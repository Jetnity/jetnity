#!/usr/bin/env node
// scripts/premium-redesign-a/dunkelstart.mjs
//
// Dunkelstart und Hydration (A7): Läuft gegen den echten lokalen Next-Production-Build.
// Das Skript des Browsers (alle /_next/static JavaScript-Dateien) wird verzögert
// ausgeliefert. Dadurch steht das serverseitig erzeugte Dokument mehrere Sekunden
// ohne Hydration auf dem Schirm. Während der Verzögerung und danach wird in jedem
// Animationsbild gemessen (nicht nur einmal), getrennt für drei echte Bereiche:
//   - Kopfzeile (`header`),
//   - Inhalt (`.workspace-content` bzw. `#public-content`),
//   - Bildnachweis (`[data-bildnachweise]` auf der Startseite, ⓘ-Knopf im Reisekopf),
// jeweils:
//   - Thema-Attribut an html und Shell,
//   - Hintergrund von Seite und Bereich,
//   - helle Flächen im Bereich,
//   - Kontrast jedes sichtbaren Texts gegen den gemischten Grund (Grenze 4,5 : 1 für alle Texte,
//     ungerundet verglichen). Texte auf Bildgrund (ein Foto oder eine Illustration liegt dahinter, auch als
//     Geschwister) werden in den Bildern nur gezählt, nie als gemessen gewertet. Gemessen werden sie an den Pixeln:
//       * im Endzustand (nach der Hydration),
//       * VOR der Hydration (Seitenskripte nicht ausgeliefert, das Dokument steht unhydriert auf dem Schirm), einmal mit
//         geladenem Bild und einmal im ungünstigen Fall «Bild noch nicht da / nicht ladbar» (alle Bildanfragen werden
//         mit einem durchsichtigen Pixel beantwortet).
//     Für jede Seite mit Bildfläche müssen die erwarteten Bildtexte (Illustrationshinweis, Ortsangabe, Bildnachweis-Link)
//     einzeln gemessen sein; ein gezählter, aber nicht gemessener Bildtext ist FAIL.
//
// Geltung des Dunkelmodus (explizit, GELTUNG unten; DESIGN_SYSTEM.md 6.27):
//   - Arbeitsbereich (Reise, Planen, Konto): bei gespeichertem Dunkel muss der Inhalt dunkel sein. Eine helle Fläche ist FAIL.
//   - Öffentliche Seiten (Startseite): bewusst hell in beiden Themes. Bei gespeichertem Dunkel muss der Grund hell BLEIBEN;
//     ein stiller Wechsel in den Dunkelmodus wäre eine Geltungsänderung ohne Entscheidung und ist FAIL.
//   - Kopfzeile: in beiden Themes weiss (Marken-Kopfzeile), darf hell sein; ihre Texte müssen 4,5 : 1 erreichen.
//
// Eine Selbstprüfung beweist vor jedem Lauf, dass helle Flächen wirklich als FAIL erkannt werden: erstens an
// künstlichen Messreihen (`auswerten`), zweitens live, indem in die echte Seite eine helle Fläche eingeschleust
// wird (Negativkontrolle). Ein Lauf, dessen Negativkontrolle nicht FAIL ergibt, gilt als wirkungslos und ist selbst FAIL.
//
// Zustände des Speichers: dunkel, hell, fehlend, blockiert, alt «green».
//
//   node scripts/premium-redesign-a/dunkelstart.mjs --base http://127.0.0.1:3462 \
//     --base-webkit https://127.0.0.1:3482 --fixtures /tmp/pra/fixtures \
//     --out /tmp/pra/shots/nachher --commit <sha>
//
// Kein Produktionszugriff, keine Anmeldung, synthetische Reise.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'
import { GRENZE, kontrastMessen } from './kontrast.mjs'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3462')
const BASIS_WEBKIT = argument('base-webkit', BASIS)
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures')
const AUS = argument('out', '/tmp/pra/shots/nachher')
const COMMIT = argument('commit', 'unbekannt')
const NUR = argument('only', '')
const VERZOEGERUNG_MS = Number(argument('delay', '2500'))
const SCHLUESSEL = 'jetnity:workspace-theme:v1'
// Durchsichtiges 1x1-PNG: Antwort auf jede Bildanfrage im ungünstigen Fall «Bild noch nicht da».
const DURCHSICHTIGES_PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=', 'base64')
const REISE = JSON.parse(readFileSync(join(FIXTURES, 'thailand.json'), 'utf8'))

const ZUSTAENDE = [
  { name: 'dunkel', wert: 'dark', erwartet: 'dark' },
  { name: 'hell', wert: 'light', erwartet: 'light' },
  { name: 'fehlend', wert: null, erwartet: 'light' },
  // Bei blockiertem Speicher ist die Gastreise unlesbar: die Reiseseite zeigt die Lesefehler-Meldung ohne Reisekopf und ohne Foto. Öffentliche Seiten sind davon nicht betroffen.
  { name: 'blockiert', wert: 'BLOCKIERT', erwartet: 'light', reiseLaedt: false },
  { name: 'alt-green', wert: 'green', erwartet: 'dark' },
]
/** Geltung des Dunkelmodus je Seite. Es gibt keine Ausnahme ohne Begründung: jede Seite steht hier und wird geprüft. */
const GELTUNG = {
  arbeitsbereich: {
    beschreibung: 'Arbeitsbereich: bei gespeichertem Dunkel ist der Inhalt dunkel; helle Flächen sind FAIL.',
    dunkelBeiGespeichertDunkel: true,
  },
  oeffentlich: {
    beschreibung: 'Öffentliche Seite: bewusst hell in beiden Themes (white-mint); der Grund bleibt hell, ein stiller Wechsel nach Dunkel ist FAIL.',
    dunkelBeiGespeichertDunkel: false,
  },
}
const SEITEN = [
  {
    name: 'startseite', pfad: () => '/', geltung: 'oeffentlich', bereiche: { kopf: 'header', inhalt: '#public-content, main', nachweis: '[data-bildnachweise]' }, nachweisSymbol: null, nachweisErforderlich: true,
    bildflaeche: true,
    erwartet: [{ text: 'Bali, Indonesien', mindestens: 1 }, { text: 'KI-Illustration', mindestens: 4 }, { text: 'Bildnachweis', mindestens: 1 }],
  },
  {
    name: 'entdecken', pfad: () => '/entdecken', geltung: 'oeffentlich', bereiche: { kopf: 'header', inhalt: '#public-content, main', nachweis: '[data-bildnachweise]' }, nachweisSymbol: null, nachweisErforderlich: true,
    bildflaeche: true,
    erwartet: [{ text: 'KI-Illustration', mindestens: 3 }],
  },
  { name: 'reise', pfad: () => `/reisen/${REISE.id}`, geltung: 'arbeitsbereich', bereiche: { kopf: 'header', inhalt: '.workspace-content, main', nachweis: '.reisekopf [data-bildnachweis]' }, nachweisSymbol: '.reisekopf .bildnachweis-knopf', nachweisErforderlich: true, haengtAnReise: true },
  { name: 'planen', pfad: () => '/planen', geltung: 'arbeitsbereich', bereiche: { kopf: 'header', inhalt: '.workspace-content, main', nachweis: null }, nachweisSymbol: null, nachweisErforderlich: false },
]
const BREITEN = [
  { name: '390', width: 390, height: 844, telefon: true },
  { name: '1440', width: 1440, height: 900, telefon: false },
]

/** Läuft vor jedem Seitenskript: setzt Thema und Gastreise, oder blockiert den Speicher. */
function speicherVorbereiten({ schluessel, wert, reiseSchluessel, reiseRoh }) {
  if (wert === 'BLOCKIERT') {
    const verweigern = () => {
      throw new DOMException('Speicher blockiert', 'SecurityError')
    }
    Object.defineProperty(window, 'localStorage', { configurable: true, get: verweigern })
    Object.defineProperty(window, 'sessionStorage', { configurable: true, get: verweigern })
    return
  }
  try {
    localStorage.setItem(reiseSchluessel, reiseRoh)
    if (wert) localStorage.setItem(schluessel, wert)
    else localStorage.removeItem(schluessel)
  } catch { /* ignorieren */ }
}

/** Wird vor jedem Seitenskript eingesetzt und misst in jedem Animationsbild drei Bereiche. */
function messschleife({ bereiche, nachweisSymbol, maximal }) {
  const proben = []
  window.__dunkelProben = proben
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
  const kontrast = (a, b) => {
    const la = leuchtdichte(a)
    const lb = leuchtdichte(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  }
  /** Gemischter Grund aller Schichten bis zum ersten deckenden; `bild` heisst: Foto oder Verlauf dahinter (nicht messbar ohne Pixel). */
  const grundVon = (element) => {
    const schichten = []
    let bild = false
    for (let knoten = element; knoten; knoten = knoten.parentElement) {
      const stil = getComputedStyle(knoten)
      if (stil.backgroundImage && stil.backgroundImage !== 'none') bild = true
      const farbe = kanaele(stil.backgroundColor)
      if (farbe && farbe.a > 0) {
        schichten.push(farbe)
        if (farbe.a >= 0.99) break
      }
    }
    let grund = { r: 255, g: 255, b: 255, a: 1 }
    for (const schicht of schichten.reverse()) grund = mischen(schicht, grund)
    return { grund, bild }
  }
  const messenBereich = (selektor, mitHellpruefung) => {
    if (!selektor) return null
    const wurzel = document.querySelector(selektor)
    if (!wurzel) return { vorhanden: false }
    const stil = getComputedStyle(wurzel)
    const mischung = grundVon(wurzel).grund
    // Ein Foto oder eine Illustration als Geschwister hinter dem Text zählt wie ein Hintergrundbild: nicht messbar ohne Pixel.
    const bildRahmen = [...document.images]
      .map((bild) => ({ bild, r: bild.getBoundingClientRect(), s: getComputedStyle(bild) }))
      .filter(({ r, s }) => r.width >= 40 && r.height >= 16 && s.visibility !== 'hidden' && s.display !== 'none')
    const liegtAufBild = (element, rahmen) => {
      const x = rahmen.left + rahmen.width / 2
      const y = rahmen.top + Math.min(rahmen.height, 24) / 2
      return bildRahmen.some(({ bild, r }) => !bild.contains(element) && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
    }
    const bereich = {
      vorhanden: true,
      grund: stil.backgroundColor,
      grundMisch: `rgb(${Math.round(mischung.r)}, ${Math.round(mischung.g)}, ${Math.round(mischung.b)})`,
      helleFlaechen: 0,
      helleBeispiele: [],
      textGeprueft: 0,
      bildTexte: 0,
      kleinsterKontrast: null,
      schlechtesterText: null,
    }
    if (mitHellpruefung && document.documentElement.getAttribute('data-workspace-theme') === 'dark') {
      for (const element of [wurzel, ...wurzel.querySelectorAll('*')]) {
        const rahmen = element.getBoundingClientRect()
        if (rahmen.width * rahmen.height < 20000) continue
        const elementStil = getComputedStyle(element)
        const farbe = kanaele(elementStil.backgroundColor)
        if (farbe && farbe.a > 0.9 && leuchtdichte(farbe) > 0.6 && !element.closest('img, picture, [data-bild]')) {
          bereich.helleFlaechen += 1
          if (bereich.helleBeispiele.length < 4) bereich.helleBeispiele.push(`${element.tagName.toLowerCase()}.${String(element.className).trim().split(/\s+/).slice(0, 3).join('.')} ${elementStil.backgroundColor} ${Math.round(rahmen.width)}x${Math.round(rahmen.height)}`)
        }
      }
    }
    let kleinster = Infinity
    let schlechtester = null
    const walker = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT)
    while (walker.nextNode() && bereich.textGeprueft + bereich.bildTexte < 160) {
      const knoten = walker.currentNode
      if (!knoten.textContent || !knoten.textContent.trim()) continue
      const element = knoten.parentElement
      if (!element || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName) || element.closest('svg, [aria-hidden="true"], [inert], .sr-only')) continue
      const elementStil = getComputedStyle(element)
      if (elementStil.visibility === 'hidden' || elementStil.display === 'none' || Number(elementStil.opacity) === 0) continue
      const rahmen = element.getBoundingClientRect()
      if (rahmen.width <= 2 || rahmen.height <= 2) continue
      const geschlossen = element.closest('details:not([open])')
      if (geschlossen && !element.closest('summary')) continue
      const vordergrund = kanaele(elementStil.color)
      if (!vordergrund) continue
      const { grund, bild } = grundVon(element)
      if (bild || liegtAufBild(element, rahmen)) {
        bereich.bildTexte += 1
        continue
      }
      bereich.textGeprueft += 1
      const verhaeltnis = kontrast(mischen(vordergrund, grund), grund)
      if (verhaeltnis < kleinster) {
        kleinster = verhaeltnis
        schlechtester = knoten.textContent.trim().slice(0, 40)
      }
    }
    if (selektor === bereiche.kopf) {
      // Die Kopfzeile zeigt auf dem Telefon nur Symbole (Menü, Plus, Profil). Sie werden wie Text gegen den Grund gemessen.
      for (const symbol of wurzel.querySelectorAll('svg')) {
        const rahmen = symbol.getBoundingClientRect()
        const symbolStil = getComputedStyle(symbol)
        if (rahmen.width < 4 || rahmen.height < 4 || symbolStil.visibility === 'hidden' || symbolStil.display === 'none') continue
        const vordergrund = kanaele(symbolStil.color)
        if (!vordergrund) continue
        const { grund, bild } = grundVon(symbol)
        if (bild || liegtAufBild(symbol, rahmen)) {
          bereich.bildTexte += 1
          continue
        }
        bereich.textGeprueft += 1
        const verhaeltnis = kontrast(mischen(vordergrund, grund), grund)
        if (verhaeltnis < kleinster) {
          kleinster = verhaeltnis
          schlechtester = 'Symbol in der Kopfzeile'
        }
      }
    }
    if (nachweisSymbol && selektor === bereiche.nachweis) {
      const knopf = document.querySelector(nachweisSymbol)
      const symbol = knopf?.querySelector('svg')
      if (symbol) {
        const vordergrund = kanaele(getComputedStyle(symbol).color)
        const scheibe = kanaele(getComputedStyle(symbol).backgroundColor)
        if (vordergrund && scheibe) {
          // Die Scheibe ist leicht durchsichtig und liegt auf einem Foto: der schlechtere von Schwarz und Weiss zählt.
          const aufWeiss = kontrast(mischen(vordergrund, mischen(scheibe, { r: 255, g: 255, b: 255, a: 1 })), mischen(scheibe, { r: 255, g: 255, b: 255, a: 1 }))
          const aufSchwarz = kontrast(mischen(vordergrund, mischen(scheibe, { r: 0, g: 0, b: 0, a: 1 })), mischen(scheibe, { r: 0, g: 0, b: 0, a: 1 }))
          const symbolKontrast = Math.min(aufWeiss, aufSchwarz)
          bereich.textGeprueft += 1
          if (symbolKontrast < kleinster) {
            kleinster = symbolKontrast
            schlechtester = 'ⓘ-Symbol'
          }
        }
      }
    }
    bereich.kleinsterKontrast = Number.isFinite(kleinster) ? kleinster : null
    bereich.schlechtesterText = schlechtester
    return bereich
  }
  const nehmen = (zeit) => {
    if (!document.documentElement) return requestAnimationFrame(nehmen)
    const shell = document.querySelector('.workspace-shell')
    const probe = {
      t: Math.round(zeit),
      hydriert: Object.keys(document).some((schluessel) => schluessel.startsWith('__reactContainer')),
      html: document.documentElement.getAttribute('data-workspace-theme'),
      shell: shell ? shell.getAttribute('data-workspace-theme') : null,
      body: document.body ? getComputedStyle(document.body).backgroundColor : null,
      seite: (() => {
        const g = grundVon(document.body ?? document.documentElement).grund
        return `rgb(${Math.round(g.r)}, ${Math.round(g.g)}, ${Math.round(g.b)})`
      })(),
      kopf: messenBereich(bereiche.kopf, false),
      inhalt: messenBereich(bereiche.inhalt, true),
      nachweis: messenBereich(bereiche.nachweis, true),
    }
    if (proben.length < maximal) proben.push(probe)
    requestAnimationFrame(nehmen)
  }
  requestAnimationFrame(nehmen)
}

/** Grösste Zahl gezählter Bildtexte in einem Bereich während der Bilder vor der Hydration. */
function bildTexteVorHydrationZaehlen(proben) {
  return Math.max(
    0,
    ...proben
      .filter((probe) => probe.t > 0 && probe.inhalt?.vorhanden && !probe.hydriert)
      .flatMap((probe) => ['kopf', 'inhalt', 'nachweis'].map((name) => probe[name]?.bildTexte ?? 0)),
  )
}

function istHell(farbe) {
  const treffer = farbe && farbe.match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/)
  if (!treffer) return null
  const l = [treffer[1], treffer[2], treffer[3]].map((k) => {
    const v = Number(k) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2] > 0.5
}

/** Läuft im Browser: schleust eine Fläche ein, die der Geltung der Seite widerspricht (Negativkontrolle). */
function verstossEinschleusen({ geltung, inhaltsSelektor }) {
  const inhalt = document.querySelector(inhaltsSelektor)
  if (geltung === 'arbeitsbereich') {
    const flaeche = document.createElement('div')
    flaeche.setAttribute('data-negativkontrolle', '')
    flaeche.style.cssText = 'min-height:40vh;width:100%;background:#ffffff;color:#222222'
    flaeche.textContent = 'Negativkontrolle: helle Fläche im dunklen Arbeitsbereich'
    ;(inhalt ?? document.body).prepend(flaeche)
    if (inhalt) inhalt.style.backgroundColor = '#ffffff'
    document.body.style.backgroundColor = '#ffffff'
  } else {
    document.body.style.backgroundColor = '#102a26'
    document.documentElement.style.backgroundColor = '#102a26'
    if (inhalt) inhalt.style.backgroundColor = '#102a26'
  }
}

async function lauf(browserTyp, browserName, zustand, seite, breite, optionen = {}) {
  const basis = browserName === 'webkit' ? BASIS_WEBKIT : BASIS
  const context = await browserTyp.newContext({
    viewport: { width: breite.width, height: breite.height },
    isMobile: breite.telefon,
    hasTouch: breite.telefon,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(speicherVorbereiten, { schluessel: SCHLUESSEL, wert: zustand.wert, reiseSchluessel: REISE.schluessel, reiseRoh: REISE.roh })
  await context.addInitScript(messschleife, { bereiche: seite.bereiche, nachweisSymbol: seite.nachweisSymbol, maximal: 600 })
  const meldungen = { konsole: [], seitenfehler: [], hydrationsfehler: [] }
  const page = await context.newPage()
  page.on('console', (nachricht) => {
    const text = nachricht.text()
    if (nachricht.type() === 'error') meldungen.konsole.push(text.slice(0, 240))
    if (/hydrat/i.test(text)) meldungen.hydrationsfehler.push(text.slice(0, 240))
  })
  page.on('pageerror', (fehler) => meldungen.seitenfehler.push(String(fehler).slice(0, 240)))
  await page.route(/\/_next\/static\/.*\.js(\?.*)?$/, async (route) => {
    const antwort = await route.fetch()
    await new Promise((fertig) => setTimeout(fertig, VERZOEGERUNG_MS))
    await route.fulfill({ response: antwort })
  })
  await page.goto(`${basis}${seite.pfad()}`, { waitUntil: 'commit' })
  if (optionen.verstoss) {
    await page.waitForSelector(seite.bereiche.inhalt.split(',')[0].trim(), { timeout: 10_000 }).catch(() => undefined)
    await page.evaluate(verstossEinschleusen, { geltung: seite.geltung, inhaltsSelektor: seite.bereiche.inhalt })
  }
  await page.waitForTimeout(VERZOEGERUNG_MS + 3500)
  const proben = await page.evaluate(() => window.__dunkelProben ?? [])
  let endzustand = null
  if (!optionen.verstoss) {
    const kontrast = await kontrastMessen(page)
    const fotos = await page.evaluate(() =>
      [...document.querySelectorAll('img')].filter((bild) => {
        const r = bild.getBoundingClientRect()
        const stil = getComputedStyle(bild)
        return r.width >= 80 && r.height >= 60 && stil.visibility !== 'hidden' && stil.display !== 'none' && !(bild.getAttribute('src') ?? '').includes('/brand/')
      }).length,
    )
    let nachweisOffen = null
    if (seite.nachweisSymbol) {
      const knopf = page.locator(seite.nachweisSymbol).first()
      if (await knopf.count()) {
        await knopf.click({ timeout: 4000 }).catch(() => undefined)
        await page.waitForTimeout(400)
        nachweisOffen = await kontrastMessen(page, { wurzelSelektor: `${seite.bereiche.nachweis.split(' ')[0]} .bildnachweis-feld` })
      }
    }
    endzustand = { kontrast, fotos, nachweisOffen }
  }
  await context.close()
  return { proben, meldungen, endzustand }
}

/**
 * Pixelmessung der Bildtexte VOR der Hydration. Die Seitenskripte werden nicht ausgeliefert; das serverseitig
 * erzeugte Dokument steht dauerhaft unhydriert auf dem Schirm. `bilder: false` ist der ungünstige Fall «Bild noch nicht da»: jede
 * Bildanfrage bekommt ein durchsichtiges Pixel, dahinter bleibt nur der Grund der Seite. `einschleusen` ist die
 * Negativkontrolle: ein Text mit zu geringem Kontrast wird über das echte Bild gelegt und muss als FAIL gemessen werden.
 */
async function vorHydrationLauf(browserTyp, browserName, zustand, seite, breite, { bilder = true, einschleusen = false } = {}) {
  const basis = browserName === 'webkit' ? BASIS_WEBKIT : BASIS
  const context = await browserTyp.newContext({
    viewport: { width: breite.width, height: breite.height },
    isMobile: breite.telefon,
    hasTouch: breite.telefon,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(speicherVorbereiten, { schluessel: SCHLUESSEL, wert: zustand.wert, reiseSchluessel: REISE.schluessel, reiseRoh: REISE.roh })
  const page = await context.newPage()
  // Die Seitenskripte werden nicht ausgeliefert: Das Dokument bleibt dauerhaft unhydriert und das Ladeereignis tritt ein.
  // (Ein bloss angehaltenes Skript hielte das Ladeereignis zurück; dann wartet die Bildaufnahme ewig auf die Schriften.)
  await page.route(/\/_next\/static\/.*\.js(\?.*)?$/, (route) => route.abort('failed'))
  if (!bilder) {
    await page.route(/\/images\/|\/_next\/image/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: DURCHSICHTIGES_PIXEL }))
  }
  const hydriert = () => page.evaluate(() => Object.keys(document).some((schluessel) => schluessel.startsWith('__reactContainer')) || Object.keys(document.body ?? {}).some((schluessel) => schluessel.startsWith('__react')))
  try {
    await page.goto(`${basis}${seite.pfad()}`, { waitUntil: 'commit' })
    await page.waitForSelector('h1', { timeout: 20_000 })
    // Faule Bilder laden erst beim Scrollen: einmal durchlaufen, damit der geladene Zustand wirklich vorliegt.
    const hoehe = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < hoehe; y += Math.max(200, breite.height - 120)) {
      await page.evaluate((oben) => window.scrollTo({ top: oben, behavior: 'instant' }), y)
      await page.waitForTimeout(200)
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    let geladen = null
    if (bilder) {
      geladen = await page
        .waitForFunction(() => [...document.images].every((bild) => !bild.getAttribute('src') || (bild.complete && bild.naturalWidth > 0)), null, { timeout: 20_000 })
        .then(() => true)
        .catch(() => false)
    } else {
      await page.waitForTimeout(600)
      geladen = await page.evaluate(() => [...document.images].filter((bild) => /\/images\/|\/_next\/image/.test(bild.currentSrc || bild.src)).every((bild) => bild.naturalWidth <= 1))
    }
    const vorher = await hydriert()
    if (einschleusen) {
      const eingeschleust = await page.evaluate(() => {
        const bild = [...document.images].find((kandidat) => {
          const r = kandidat.getBoundingClientRect()
          return r.width > 200 && r.height > 120 && kandidat.naturalWidth > 1
        })
        if (!bild) return false
        window.scrollTo({ top: Math.max(0, bild.getBoundingClientRect().top + scrollY - 100), behavior: 'instant' })
        const r = bild.getBoundingClientRect()
        const text = document.createElement('span')
        text.setAttribute('data-negativkontrolle', '')
        text.textContent = 'Negativkontrolle Bildtext'
        text.style.cssText = `position:absolute;left:${Math.round(r.left + scrollX + 16)}px;top:${Math.round(r.top + scrollY + 72)}px;z-index:60;color:#808080;font:700 28px/36px sans-serif;white-space:nowrap`
        document.body.append(text)
        return true
      })
      if (!eingeschleust) throw new Error('Pixel-Negativkontrolle: kein Bild zum Überlagern gefunden')
      await page.waitForTimeout(300)
    }
    const kontrast = await kontrastMessen(page)
    const nachher = await hydriert()
    return { kontrast, hydriertVorher: vorher, hydriertNachher: nachher, bilderGeladen: geladen, bilder }
  } finally {
    await context.close().catch(() => undefined)
  }
}

const bereichsWerte = (frames, name) => {
  const vorhanden = frames.map((probe) => probe[name]).filter((bereich) => bereich?.vorhanden)
  const kontraste = vorhanden.map((bereich) => bereich.kleinsterKontrast).filter((wert) => wert != null)
  const kleinster = kontraste.length ? Math.min(...kontraste) : null
  return {
    bilderMitBereich: vorhanden.length,
    maxTexte: Math.max(0, ...vorhanden.map((bereich) => bereich.textGeprueft)),
    maxBildTexte: Math.max(0, ...vorhanden.map((bereich) => bereich.bildTexte)),
    maxHelleFlaechen: Math.max(0, ...vorhanden.map((bereich) => bereich.helleFlaechen)),
    helleBeispiele: (vorhanden.find((bereich) => bereich.helleFlaechen > 0) ?? {}).helleBeispiele ?? [],
    kleinsterKontrastRoh: kleinster,
    kleinsterKontrast: kleinster == null ? null : Math.round(kleinster * 100) / 100,
    schlechtesterText: vorhanden.find((bereich) => bereich.kleinsterKontrast === kleinster)?.schlechtesterText ?? null,
  }
}

function auswerten(zustand, proben, seite, endzustand = null, meldungen = { hydrationsfehler: [], seitenfehler: [] }, vorHydration = null) {
  const geltung = GELTUNG[seite.geltung]
  const frames = proben.filter((probe) => probe.t > 0 && probe.inhalt?.vorhanden)
  const attribute = new Set(frames.map((probe) => probe.html))
  const dunkelGespeichert = zustand.erwartet === 'dark'
  const erwartetesAttribut = dunkelGespeichert ? 'dark' : null
  const falschesThema = frames.filter((probe) => probe.html !== erwartetesAttribut)
  const heller = (probe) => istHell(probe.inhalt.grundMisch ?? probe.seite) === true
  const hell = frames.filter((probe) => dunkelGespeichert && geltung.dunkelBeiGespeichertDunkel && heller(probe))
  const unerwartetDunkel = frames.filter((probe) => dunkelGespeichert && !geltung.dunkelBeiGespeichertDunkel && istHell(probe.inhalt.grundMisch ?? probe.seite) === false)
  const bereiche = {
    kopf: bereichsWerte(frames, 'kopf'),
    inhalt: bereichsWerte(frames, 'inhalt'),
    nachweis: bereichsWerte(frames, 'nachweis'),
  }
  const helleFlaechen = dunkelGespeichert && geltung.dunkelBeiGespeichertDunkel ? Math.max(bereiche.inhalt.maxHelleFlaechen, bereiche.nachweis.maxHelleFlaechen) : 0
  const grundlagen = []
  if (frames.filter((probe) => !probe.hydriert).length < 8) grundlagen.push('weniger als 8 Bilder vor der Hydration')
  if (falschesThema.length) grundlagen.push(`Thema-Attribut falsch in ${falschesThema.length} Bildern`)
  if (hell.length) grundlagen.push(`heller Grund im Arbeitsbereich bei gespeichertem Dunkel in ${hell.length} Bildern`)
  if (helleFlaechen) grundlagen.push(`${helleFlaechen} helle Flächen im dunklen Arbeitsbereich`)
  if (unerwartetDunkel.length) grundlagen.push(`öffentliche Seite wurde dunkel (Geltung verletzt) in ${unerwartetDunkel.length} Bildern`)
  for (const name of ['kopf', 'inhalt']) {
    if (bereiche[name].bilderMitBereich === 0) grundlagen.push(`Bereich «${name}» nie gefunden: nicht gemessen`)
    else if (bereiche[name].maxTexte === 0) grundlagen.push(`Bereich «${name}» ohne messbaren Text: nicht gemessen`)
  }
  // Nur Seiten, die an der Gastreise hängen, entfallen bei blockiertem Speicher; zeigt eine solche Seite trotzdem ein Foto, bleibt der Nachweis Pflicht.
  const ohneReise = seite.haengtAnReise === true && zustand.reiseLaedt === false
  const fotoSichtbar = endzustand ? endzustand.fotos > 0 : true
  const nachweisNoetig = seite.nachweisErforderlich && (!ohneReise || fotoSichtbar)
  if (nachweisNoetig) {
    if (bereiche.nachweis.bilderMitBereich === 0) grundlagen.push('Bildnachweis nie gefunden')
    else if (bereiche.nachweis.maxTexte === 0) grundlagen.push('Bildnachweis ohne messbaren Text oder Symbol: nicht gemessen')
  }
  for (const [name, werte] of Object.entries(bereiche)) {
    if (werte.kleinsterKontrastRoh != null && werte.kleinsterKontrastRoh < GRENZE) grundlagen.push(`Kontrast im Bereich «${name}» ${werte.kleinsterKontrast} < ${GRENZE} («${werte.schlechtesterText}»)`)
  }
  if (endzustand) {
    if (!endzustand.kontrast.bestanden) grundlagen.push(`Kontrast im Endzustand: ${endzustand.kontrast.gemessen} gemessen, ${endzustand.kontrast.nichtGemessen} nicht gemessen, kleinster ${endzustand.kontrast.kleinster}`)
    if (endzustand.fotos > 0 && !seite.nachweisErforderlich) grundlagen.push('Foto ohne Bildnachweis-Bereich')
    if (nachweisNoetig && seite.nachweisSymbol && endzustand.nachweisOffen === null) grundlagen.push('Bildnachweis liess sich nicht öffnen: nicht gemessen')
    else if (endzustand.nachweisOffen && !endzustand.nachweisOffen.bestanden) grundlagen.push(`Kontrast im geöffneten Bildnachweis: ${endzustand.nachweisOffen.kleinster}`)
  } else if (!seite.verstoss) {
    grundlagen.push('Endzustand nicht gemessen')
  }
  // Bildtexte, die vor der Hydration gezählt wurden, sind nie «gemessen»: sie brauchen die Pixelmessung vor der Hydration.
  const bildTexteVorHydration = bildTexteVorHydrationZaehlen(proben)
  const vorHydrationNoetig = !seite.verstoss && (bildTexteVorHydration > 0 || seite.bildflaeche === true)
  const vorHydrationBericht = vorHydrationNoetig ? vorHydrationPruefen(vorHydration, seite, bildTexteVorHydration, grundlagen) : null
  if (meldungen.hydrationsfehler.length) grundlagen.push('Hydrationsfehler')
  if (meldungen.seitenfehler.length) grundlagen.push('Seitenfehler')
  return {
    geltung: seite.geltung,
    geltungBeschreibung: geltung.beschreibung,
    bilder: proben.length,
    bilderMitInhalt: frames.length,
    themaWerte: [...attribute],
    bilderMitFalschemThema: falschesThema.length,
    bilderMitHellemGrund: hell.length,
    bilderMitUnerwartetDunklemGrund: unerwartetDunkel.length,
    maxHelleFlaechen: helleFlaechen,
    helleBeispiele: bereiche.inhalt.helleBeispiele.length ? bereiche.inhalt.helleBeispiele : bereiche.nachweis.helleBeispiele,
    bereiche,
    bilderVorHydration: frames.filter((probe) => !probe.hydriert).length,
    ersteBilder: frames.slice(0, 3).map((probe) => ({ t: probe.t, html: probe.html, shell: probe.shell, body: probe.body, seite: probe.seite, inhalt: probe.inhalt.grund, inhaltGemischt: probe.inhalt.grundMisch })),
    endzustand: endzustand && {
      kontrastBestanden: endzustand.kontrast.bestanden,
      gemessen: endzustand.kontrast.gemessen,
      nichtGemessen: endzustand.kontrast.nichtGemessen,
      kleinster: endzustand.kontrast.kleinster,
      einfarbig: endzustand.kontrast.einfarbig,
      bildgrund: endzustand.kontrast.bildgrund,
      fotos: endzustand.fotos,
      nachweisOffen: endzustand.nachweisOffen && { bestanden: endzustand.nachweisOffen.bestanden, kleinster: endzustand.nachweisOffen.kleinster, gemessen: endzustand.nachweisOffen.gemessen },
    },
    bildTexteVorHydration,
    vorHydration: vorHydrationBericht,
    grundlagen,
    bestanden: grundlagen.length === 0,
  }
}

/** Prüft die Pixelmessung vor der Hydration; jeder Mangel ist ein Grund für FAIL, auch eine fehlende Messung. */
function vorHydrationPruefen(vorHydration, seite, gezaehlt, grundlagen) {
  if (!vorHydration || !vorHydration.geladen || !vorHydration.ohneBilder) {
    grundlagen.push(`${gezaehlt} Bildtexte vor der Hydration gezählt, aber nicht an den Pixeln gemessen (vor der Hydration nicht gemessen)`)
    return null
  }
  const bericht = {}
  for (const [name, lauf] of Object.entries(vorHydration)) {
    const eintraege = lauf.kontrast.bildgrund.einzelwerte ?? []
    bericht[name] = {
      hydriertVorher: lauf.hydriertVorher,
      hydriertNachher: lauf.hydriertNachher,
      bilderGeladen: lauf.bilderGeladen,
      gemessen: lauf.kontrast.gemessen,
      nichtGemessen: lauf.kontrast.nichtGemessen,
      kleinster: lauf.kontrast.kleinster,
      bildtexteGemessen: eintraege.length,
      verfehlt: lauf.kontrast.bildgrund.verfehlt,
      einzelwerte: eintraege,
    }
    if (lauf.hydriertVorher || lauf.hydriertNachher) grundlagen.push(`Seite war bei der Messung «${name}» schon hydriert: nicht vor der Hydration gemessen`)
    if (!lauf.bilderGeladen) grundlagen.push(`Messung «${name}»: Bildzustand nicht erreicht (nicht gemessen)`)
    if (!lauf.kontrast.bestanden) grundlagen.push(`Kontrast vor der Hydration («${name}»): ${lauf.kontrast.gemessen} gemessen, ${lauf.kontrast.nichtGemessen} nicht gemessen, kleinster ${lauf.kontrast.kleinster}`)
    if (lauf.kontrast.nichtGemessen > 0) grundlagen.push(`Messung «${name}»: ${lauf.kontrast.nichtGemessen} Bildtexte nicht gemessen`)
    if (gezaehlt > 0 && eintraege.length === 0) grundlagen.push(`Messung «${name}»: ${gezaehlt} Bildtexte gezählt, keiner an den Pixeln gemessen`)
    for (const { text, mindestens } of seite.erwartet ?? []) {
      const treffer = eintraege.filter((eintrag) => eintrag.text.includes(text))
      if (treffer.length < mindestens) grundlagen.push(`Messung «${name}»: Bildtext «${text}» nur ${treffer.length}× gemessen, erwartet ≥ ${mindestens}`)
      for (const eintrag of treffer) {
        if (eintrag.schlechtester < GRENZE) grundlagen.push(`Messung «${name}»: «${eintrag.text}» ${eintrag.schlechtester} < ${GRENZE}`)
      }
    }
  }
  return bericht
}

/** Beweist vor dem Lauf, dass `auswerten` helle Flächen im Arbeitsbereich und dunkle Flächen auf öffentlichen Seiten wirklich als FAIL erkennt. */
function selbstpruefung() {
  const bereich = (grund, helle = 0, bildTexte = 0) => ({ vorhanden: true, grund, grundMisch: grund, helleFlaechen: helle, helleBeispiele: helle ? ['div.test'] : [], textGeprueft: 6, bildTexte, kleinsterKontrast: 8, schlechtesterText: 'Test' })
  const reihe = (seiteGrund, helle, bildTexte = 0) => Array.from({ length: 12 }, (_, i) => ({ t: 100 + i * 16, hydriert: false, html: 'dark', shell: null, body: seiteGrund, seite: seiteGrund, kopf: bereich('rgb(255, 255, 255)'), inhalt: bereich(seiteGrund, helle, bildTexte), nachweis: null }))
  const pixelLauf = (aenderung = {}) => ({
    hydriertVorher: false,
    hydriertNachher: false,
    bilderGeladen: true,
    kontrast: { bestanden: true, gemessen: 3, nichtGemessen: 0, kleinster: 12.6, bildgrund: { verfehlt: [], einzelwerte: [{ text: 'KI-Illustration', schlechtester: 12.6 }] } },
    ...aenderung,
  })
  const beide = (aenderung = {}) => ({ geladen: pixelLauf(aenderung), ohneBilder: pixelLauf(aenderung) })
  const bildSeite = { ...SEITEN.find((eintrag) => eintrag.geltung === 'oeffentlich'), nachweisErforderlich: false, bildflaeche: true, erwartet: [{ text: 'KI-Illustration', mindestens: 1 }] }
  const ohneMangel = (vorHydration) =>
    auswerten(ZUSTAENDE[0], reihe('rgb(242, 247, 244)', 0, 3), bildSeite, null, undefined, vorHydration).grundlagen.every((grund) => !/Pixel|Messung|Bildtext|Hydration gemessen/.test(grund))
  const dunkel = ZUSTAENDE[0]
  const arbeit = SEITEN.find((eintrag) => eintrag.geltung === 'arbeitsbereich')
  const oeffentlich = SEITEN.find((eintrag) => eintrag.geltung === 'oeffentlich')
  const ohneEnde = { ...arbeit, verstoss: true, nachweisErforderlich: false, nachweisSymbol: null }
  const ohneEndeOeffentlich = { ...oeffentlich, verstoss: true, nachweisErforderlich: false }
  const ergebnisse = [
    { name: 'dunkler Arbeitsbereich ohne helle Fläche', soll: true, ist: auswerten(dunkel, reihe('rgb(15, 30, 27)', 0), ohneEnde).grundlagen.length === 0 },
    { name: 'weisser Grund im dunklen Arbeitsbereich', soll: false, ist: auswerten(dunkel, reihe('rgb(255, 255, 255)', 0), ohneEnde).bestanden },
    { name: 'helle Fläche im dunklen Arbeitsbereich', soll: false, ist: auswerten(dunkel, reihe('rgb(15, 30, 27)', 3), ohneEnde).bestanden },
    { name: 'dunkel gewordene öffentliche Seite', soll: false, ist: auswerten(dunkel, reihe('rgb(16, 42, 38)', 0), ohneEndeOeffentlich).bestanden },
    { name: 'helle öffentliche Seite bei gespeichertem Dunkel', soll: true, ist: auswerten(dunkel, reihe('rgb(242, 247, 244)', 0), ohneEndeOeffentlich).grundlagen.length === 0 },
    { name: 'Bildtexte gezählt, vor der Hydration nicht gemessen', soll: false, ist: ohneMangel(null) },
    { name: 'Pixelmessung nur mit geladenem Bild, Fall «Bild fehlt» ohne Messung', soll: false, ist: ohneMangel({ geladen: pixelLauf() }) },
    { name: 'Pixelmessung mit nicht gemessenen Bildtexten', soll: false, ist: ohneMangel(beide({ kontrast: { bestanden: false, gemessen: 3, nichtGemessen: 2, kleinster: 12.6, bildgrund: { verfehlt: [], einzelwerte: [{ text: 'KI-Illustration', schlechtester: 12.6 }] } } })) },
    { name: 'Pixelmessung ohne den erwarteten Bildtext', soll: false, ist: ohneMangel(beide({ kontrast: { bestanden: true, gemessen: 1, nichtGemessen: 0, kleinster: 9, bildgrund: { verfehlt: [], einzelwerte: [{ text: 'Anderer Text', schlechtester: 9 }] } } })) },
    { name: 'Pixelmessung mit Bildtext unter 4,5 : 1', soll: false, ist: ohneMangel(beide({ kontrast: { bestanden: false, gemessen: 1, nichtGemessen: 0, kleinster: 3.1, bildgrund: { verfehlt: [{ text: 'KI-Illustration' }], einzelwerte: [{ text: 'KI-Illustration', schlechtester: 3.1 }] } } })) },
    { name: 'Messung an bereits hydrierter Seite', soll: false, ist: ohneMangel(beide({ hydriertVorher: true })) },
    { name: 'vollständige Pixelmessung vor der Hydration', soll: true, ist: ohneMangel(beide()) },
  ]
  return ergebnisse.map((eintrag) => ({ ...eintrag, richtig: eintrag.soll === eintrag.ist }))
}

async function main() {
  mkdirSync(AUS, { recursive: true })
  const selbst = selbstpruefung()
  for (const eintrag of selbst) console.log(`Selbstprüfung ${eintrag.richtig ? 'ok  ' : 'FALSCH'} ${eintrag.name}`)
  if (selbst.some((eintrag) => !eintrag.richtig)) {
    console.log('FAIL: die Auswertung erkennt Verstösse gegen die Geltung nicht; der Lauf wäre wirkungslos.')
    process.exitCode = 1
    return
  }
  const browserListe = { chromium: await chromium.launch(), webkit: await webkit.launch() }
  const ergebnisse = []
  const negativ = []
  for (const [browserName, browserTyp] of Object.entries(browserListe)) {
    for (const zustand of ZUSTAENDE) {
      for (const seite of SEITEN) {
        for (const breite of BREITEN) {
          if (NUR && !NUR.split(',').includes(`${browserName}-${zustand.name}-${seite.name}-${breite.name}`)) continue
          const { proben, meldungen, endzustand } = await lauf(browserTyp, browserName, zustand, seite, breite)
          let vorHydration = null
          if (seite.bildflaeche === true || bildTexteVorHydrationZaehlen(proben) > 0) {
            vorHydration = {
              geladen: await vorHydrationLauf(browserTyp, browserName, zustand, seite, breite, { bilder: true }),
              ohneBilder: await vorHydrationLauf(browserTyp, browserName, zustand, seite, breite, { bilder: false }),
            }
          }
          const auswertung = auswerten(zustand, proben, seite, endzustand, meldungen, vorHydration)
          const eintrag = {
            browser: browserName,
            zustand: zustand.name,
            seite: seite.name,
            breite: breite.name,
            erwartetesThema: zustand.erwartet,
            ...auswertung,
            hydrationsfehler: meldungen.hydrationsfehler,
            seitenfehler: meldungen.seitenfehler,
            konsolenFehler: meldungen.konsole.length,
          }
          ergebnisse.push(eintrag)
          if (!auswertung.bestanden) console.log('   ', JSON.stringify(auswertung.grundlagen))
          const b = auswertung.bereiche
          console.log(
            `${browserName.padEnd(8)} ${zustand.name.padEnd(10)} ${seite.name.padEnd(10)} ${breite.name.padEnd(5)} ${seite.geltung.padEnd(14)} ` +
              `Bilder=${auswertung.bilderMitInhalt}/${auswertung.bilderVorHydration}vor Thema=${auswertung.themaWerte.join('/') || '-'} Falsch=${auswertung.bilderMitFalschemThema} ` +
              `Hell=${auswertung.bilderMitHellemGrund} Dunkel?=${auswertung.bilderMitUnerwartetDunklemGrund} Flächen=${auswertung.maxHelleFlaechen} ` +
              `Kontrast kopf/inhalt/nachweis=${b.kopf.kleinsterKontrast}/${b.inhalt.kleinsterKontrast}/${b.nachweis.kleinsterKontrast} Ende=${auswertung.endzustand?.kleinster ?? '-'} (${auswertung.endzustand?.gemessen ?? 0}, offen ${auswertung.endzustand?.nichtGemessen ?? '-'}) ` +
              `Hydr=${meldungen.hydrationsfehler.length} Fehler=${meldungen.seitenfehler.length} ${auswertung.bestanden ? 'PASS' : 'FAIL'}`,
          )
        }
      }
    }
    // Negativkontrolle: gespeichertes Dunkel, in die echte Seite wird ein Verstoss gegen die Geltung eingeschleust.
    // Erwartet ist FAIL der Auswertung; PASS wäre ein Beweis, dass das Skript Verstösse nicht erkennt.
    for (const seite of SEITEN) {
      const breite = BREITEN[0]
      const zustand = ZUSTAENDE[0]
      if (NUR && !NUR.split(',').includes(`negativ-${browserName}-${seite.name}`)) continue
      const { proben, meldungen } = await lauf(browserTyp, browserName, zustand, seite, breite, { verstoss: true })
      const auswertung = auswerten(zustand, proben, { ...seite, verstoss: true, nachweisErforderlich: false }, null, meldungen)
      const erkannt = !auswertung.bestanden && (auswertung.bilderMitHellemGrund > 0 || auswertung.maxHelleFlaechen > 0 || auswertung.bilderMitUnerwartetDunklemGrund > 0)
      negativ.push({ browser: browserName, seite: seite.name, geltung: seite.geltung, erkannt, grundlagen: auswertung.grundlagen })
      console.log(`Negativkontrolle ${browserName.padEnd(8)} ${seite.name.padEnd(10)} ${seite.geltung.padEnd(14)} ${erkannt ? 'als FAIL erkannt (richtig)' : 'NICHT ERKANNT (Skript wirkungslos)'} ${JSON.stringify(auswertung.grundlagen).slice(0, 160)}`)
    }
  }
  // Negativkontrolle der Pixelmessung vor der Hydration: ein zu schwacher Text über dem echten Bild muss als FAIL gemessen werden.
  const pixelNegativ = []
  for (const [browserName, browserTyp] of Object.entries(browserListe)) {
    for (const seite of SEITEN.filter((eintrag) => eintrag.bildflaeche === true)) {
      if (NUR && !NUR.split(',').includes(`pixel-negativ-${browserName}-${seite.name}`)) continue
      const messung = await vorHydrationLauf(browserTyp, browserName, ZUSTAENDE[0], seite, BREITEN[0], { bilder: true, einschleusen: true })
      const treffer = messung.kontrast.bildgrund.verfehlt.filter((eintrag) => eintrag.text.includes('Negativkontrolle'))
      const erkannt = !messung.kontrast.bestanden && treffer.length > 0 && !messung.hydriertVorher && !messung.hydriertNachher
      pixelNegativ.push({ browser: browserName, seite: seite.name, erkannt, verfehlt: treffer, hydriertVorher: messung.hydriertVorher })
      console.log(`Pixel-Negativkontrolle ${browserName.padEnd(8)} ${seite.name.padEnd(10)} ${erkannt ? 'als FAIL gemessen (richtig)' : 'NICHT ERKANNT (Pixelmessung wirkungslos)'} ${JSON.stringify(treffer).slice(0, 160)}`)
    }
  }
  for (const typ of Object.values(browserListe)) await typ.close()
  const bericht = {
    commit: COMMIT,
    basis: BASIS,
    basisWebkit: BASIS_WEBKIT,
    verzoegerungMs: VERZOEGERUNG_MS,
    erzeugt: new Date().toISOString(),
    grenze: GRENZE,
    geltung: GELTUNG,
    seiten: SEITEN.map((eintrag) => ({ name: eintrag.name, geltung: eintrag.geltung, bereiche: eintrag.bereiche })),
    selbstpruefung: selbst,
    negativkontrolle: negativ,
    pixelNegativkontrolle: pixelNegativ,
    gesamt: ergebnisse.length,
    bestanden: ergebnisse.filter((eintrag) => eintrag.bestanden).length,
    ergebnisse,
  }
  writeFileSync(join(AUS, 'dunkelstart.json'), JSON.stringify(bericht, null, 2))
  const negativOk = negativ.every((eintrag) => eintrag.erkannt) && pixelNegativ.every((eintrag) => eintrag.erkannt)
  console.log(`Fertig: ${bericht.bestanden}/${bericht.gesamt} bestanden; Negativkontrollen erkannt: ${negativ.filter((eintrag) => eintrag.erkannt).length}/${negativ.length}; Pixel-Negativkontrollen erkannt: ${pixelNegativ.filter((eintrag) => eintrag.erkannt).length}/${pixelNegativ.length}`)
  if (bericht.bestanden !== bericht.gesamt || !negativOk) process.exitCode = 1
}

void main()
