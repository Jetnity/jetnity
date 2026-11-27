#!/usr/bin/env node
// scripts/premium-redesign-a/auswahl-ursache.mjs
//
// Reproduktion und Ursachenbeleg für den Kontrastfehler auf ausgewählten Filtern («Alle», hell).
//
// Das Skript öffnet eine Seite, wählt ein Element und listet für `color` und `background-color`
// jede passende CSS-Regel mit Spezifität, Stylesheet und Quellreihenfolge. Die gewinnende Regel ist
// die mit der höchsten Spezifität (bei Gleichstand die spätere); `!important` zählt vor allem anderen.
// Dazu der berechnete Vorder- und Hintergrund, der tatsächliche Grund (Alpha und Verlauf berücksichtigt)
// und der ungerundete Kontrast. Die Regeln kommen aus dem CDP (`CSS.getMatchedStylesForNode`), nicht
// aus einer Annahme über den Code.
//
//   node scripts/premium-redesign-a/auswahl-ursache.mjs --url http://127.0.0.1:3475/reisen \
//     --selektor '[data-sammlung-archiv="alle"]' [--browser chromium] [--breite 390] [--thema light] \
//     [--zustand "aria-pressed=true"] [--schrift 100] [--out /tmp/pra/ursache.json]
//
// WebKit bietet kein CDP: Dort liefert das Skript nur die berechneten Werte und den Kontrast
// und vermerkt, dass die Regelliste nicht erhoben wurde (OFFEN, kein PASS).

import { writeFileSync } from 'node:fs'
import { chromium, webkit } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const URL_ZIEL = argument('url', 'http://127.0.0.1:3475/reisen')
const SELEKTOR = argument('selektor', '[data-sammlung-archiv="alle"]')
const BROWSER = argument('browser', 'chromium')
const BREITE = Number(argument('breite', '390'))
const THEMA = argument('thema', 'light')
const ZUSTAND = argument('zustand', '')
const SCHRIFT = Number(argument('schrift', '100'))
const AUS = argument('out', '')
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'

const typ = BROWSER === 'webkit' ? webkit : chromium
const browser = await typ.launch()
const context = await browser.newContext({
  viewport: { width: BREITE, height: BREITE < 700 ? 844 : 900 },
  isMobile: BREITE < 700,
  hasTouch: BREITE < 700,
  locale: 'de-CH',
  ignoreHTTPSErrors: true,
})
await context.addInitScript(({ schluessel, thema }) => {
  try {
    if (thema === 'dark') localStorage.setItem(schluessel, 'dark')
  } catch {
    /* blockierter Speicher */
  }
}, { schluessel: THEMA_SCHLUESSEL, thema: THEMA })
if (SCHRIFT !== 100) {
  await context.addInitScript((prozent) => {
    document.addEventListener('DOMContentLoaded', () => {
      const stil = document.createElement('style')
      stil.textContent = `html { font-size: ${prozent}% !important; }`
      document.head.append(stil)
    }, { once: true })
  }, SCHRIFT)
}
const seite = await context.newPage()
await seite.goto(URL_ZIEL, { waitUntil: 'domcontentloaded' })
await seite.waitForSelector(SELEKTOR, { timeout: 20_000 })
await seite.waitForTimeout(1200)

if (ZUSTAND) {
  const [name, wert] = ZUSTAND.split('=')
  await seite.evaluate(({ selektor, name: attribut, wert: inhalt }) => {
    document.querySelector(selektor)?.setAttribute(attribut, inhalt)
  }, { selektor: SELEKTOR, name, wert })
}

const gemessen = await seite.evaluate((selektor) => {
  const element = document.querySelector(selektor)
  if (!element) return null
  const kanaele = (farbe) => {
    const treffer = farbe && farbe.match(/rgba?\(([^)]+)\)/)
    if (!treffer) return null
    const teile = treffer[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return { r: teile[0], g: teile[1], b: teile[2], a: teile[3] ?? 1 }
  }
  const mischen = (vorn, hinten) => ({
    r: vorn.r * vorn.a + hinten.r * (1 - vorn.a),
    g: vorn.g * vorn.a + hinten.g * (1 - vorn.a),
    b: vorn.b * vorn.a + hinten.b * (1 - vorn.a),
    a: 1,
  })
  const leuchtdichte = ({ r, g, b }) => {
    const l = [r, g, b].map((k) => {
      const v = k / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
  }
  const stil = getComputedStyle(element)
  const schichten = []
  let knoten = element
  let verlauf = false
  while (knoten) {
    const s = getComputedStyle(knoten)
    if (s.backgroundImage && s.backgroundImage !== 'none') verlauf = true
    const farbe = kanaele(s.backgroundColor)
    if (farbe && farbe.a > 0) {
      schichten.push({ farbe: s.backgroundColor, von: `${knoten.tagName.toLowerCase()}${knoten.className && typeof knoten.className === 'string' ? '.' + knoten.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}` })
      if (farbe.a >= 0.99) break
    }
    knoten = knoten.parentElement
  }
  let grund = { r: 255, g: 255, b: 255, a: 1 }
  for (const schicht of [...schichten].reverse()) grund = mischen(kanaele(schicht.farbe), grund)
  const vordergrund = mischen(kanaele(stil.color), grund)
  const la = leuchtdichte(vordergrund)
  const lb = leuchtdichte(grund)
  const rahmen = element.getBoundingClientRect()
  return {
    text: element.textContent?.trim().slice(0, 40),
    klassen: typeof element.className === 'string' ? element.className : '',
    ariaPressed: element.getAttribute('aria-pressed'),
    color: stil.color,
    backgroundColor: stil.backgroundColor,
    backgroundImage: stil.backgroundImage,
    opacity: stil.opacity,
    schichten,
    verlaufImGrund: verlauf,
    tatsaechlicherGrund: `rgb(${grund.r.toFixed(2)} ${grund.g.toFixed(2)} ${grund.b.toFixed(2)})`,
    tatsaechlicheSchrift: `rgb(${vordergrund.r.toFixed(2)} ${vordergrund.g.toFixed(2)} ${vordergrund.b.toFixed(2)})`,
    kontrastUngerundet: (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05),
    box: { breite: Math.round(rahmen.width), hoehe: Math.round(rahmen.height) },
    themaShell: document.querySelector('.workspace-shell')?.getAttribute('data-workspace-theme') ?? null,
    themaHtml: document.documentElement.getAttribute('data-workspace-theme'),
  }
}, SELEKTOR)

const bericht = { url: URL_ZIEL, selektor: SELEKTOR, browser: BROWSER, breite: BREITE, thema: THEMA, schrift: SCHRIFT, zustand: ZUSTAND || null, gemessen, regeln: null, hinweis: null }

if (BROWSER === 'chromium') {
  const cdp = await context.newCDPSession(seite)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const wurzel = await cdp.send('DOM.getDocument', { depth: 0 })
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: wurzel.root.nodeId, selector: SELEKTOR })
  const treffer = await cdp.send('CSS.getMatchedStylesForNode', { nodeId })
  const kopfzeilen = new Map()
  cdp.on('CSS.styleSheetAdded', ({ header }) => kopfzeilen.set(header.styleSheetId, header))
  await cdp.send('CSS.disable')
  await cdp.send('CSS.enable')
  await seite.waitForTimeout(300)
  const eigenschaften = ['color', 'background-color']
  const regeln = []
  let reihenfolge = 0
  for (const eintrag of treffer.matchedCSSRules) {
    reihenfolge += 1
    const regel = eintrag.rule
    const aktiv = eintrag.matchingSelectors.map((index) => regel.selectorList.selectors[index])
    const spezifitaet = aktiv.map((wahl) => wahl.specificity ?? null)
    for (const eigenschaft of eigenschaften) {
      const eigenschaftEintrag = regel.style.cssProperties.find((p) => p.name === eigenschaft && !p.disabled && p.parsedOk !== false)
      if (!eigenschaftEintrag) continue
      const beste = spezifitaet.filter(Boolean).sort((a, b) => b.a - a.a || b.b - a.b || b.c - a.c)[0] ?? null
      regeln.push({
        eigenschaft,
        wert: eigenschaftEintrag.value,
        wichtig: Boolean(eigenschaftEintrag.important),
        selektor: aktiv.map((wahl) => wahl.text).join(', ').slice(0, 260),
        spezifitaet: beste ? `${beste.a},${beste.b},${beste.c}` : 'unbekannt',
        reihenfolge,
        stylesheet: regel.styleSheetId ?? null,
        ursprung: regel.origin,
      })
    }
  }
  const kopfListe = await cdp.send('CSS.getStyleSheetText', { styleSheetId: treffer.matchedCSSRules[0]?.rule.styleSheetId ?? '' }).catch(() => null)
  void kopfListe
  const rang = (regel) => [regel.wichtig ? 1 : 0, ...regel.spezifitaet.split(',').map(Number), regel.reihenfolge]
  const gewinner = {}
  for (const eigenschaft of eigenschaften) {
    const kandidaten = regeln.filter((regel) => regel.eigenschaft === eigenschaft && regel.spezifitaet !== 'unbekannt')
    kandidaten.sort((a, b) => {
      const ra = rang(a)
      const rb = rang(b)
      for (let i = 0; i < ra.length; i += 1) if (ra[i] !== rb[i]) return rb[i] - ra[i]
      return 0
    })
    gewinner[eigenschaft] = kandidaten[0] ?? null
  }
  bericht.regeln = regeln
  bericht.gewinner = gewinner
  await cdp.detach()
} else {
  bericht.hinweis = 'OFFEN: WebKit bietet kein CDP; die Regelliste wurde nur in Chromium erhoben. Berechnete Werte stehen oben.'
}

await browser.close()
const text = JSON.stringify(bericht, null, 2)
if (AUS) writeFileSync(AUS, text)
console.log(text)
