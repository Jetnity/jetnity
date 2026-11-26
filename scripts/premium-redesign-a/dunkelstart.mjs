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
//     ungerundet verglichen). Texte auf Bildgrund werden hier gezählt und im Endzustand an den Pixeln gemessen.
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
const REISE = JSON.parse(readFileSync(join(FIXTURES, 'thailand.json'), 'utf8'))

const ZUSTAENDE = [
  { name: 'dunkel', wert: 'dark', erwartet: 'dark' },
  { name: 'hell', wert: 'light', erwartet: 'light' },
  { name: 'fehlend', wert: null, erwartet: 'light' },
  { name: 'blockiert', wert: 'BLOCKIERT', erwartet: 'light' },
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
  { name: 'startseite', pfad: () => '/', geltung: 'oeffentlich', bereiche: { kopf: 'header', inhalt: '#public-content, main', nachweis: '[data-bildnachweise]' }, nachweisSymbol: null, nachweisErforderlich: true },
  { name: 'reise', pfad: () => `/reisen/${REISE.id}`, geltung: 'arbeitsbereich', bereiche: { kopf: 'header', inhalt: '.workspace-content, main', nachweis: '.reisekopf [data-bildnachweis]' }, nachweisSymbol: '.reisekopf .bildnachweis-knopf', nachweisErforderlich: true },
  { name: 'planen', pfad: () => '/planen', geltung: 'arbeitsbereich', bereiche: { kopf: 'header', inhalt: '.workspace-content, main', nachweis: null }, nachweisSymbol: null, nachweisErforderlich: false },
]
const BREITEN = [
  { name: '390', width: 390, height: 844, telefon: true },
  { name: '1440', width: 1440, height: 900, telefon: false },
]

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
      if (bild) {
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
        if (bild) {
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
  await context.addInitScript(
    ({ schluessel, wert, reiseSchluessel, reiseRoh }) => {
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
    },
    { schluessel: SCHLUESSEL, wert: zustand.wert, reiseSchluessel: REISE.schluessel, reiseRoh: REISE.roh },
  )
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

function auswerten(zustand, proben, seite, endzustand = null, meldungen = { hydrationsfehler: [], seitenfehler: [] }) {
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
  if (seite.nachweisErforderlich) {
    if (bereiche.nachweis.bilderMitBereich === 0) grundlagen.push('Bildnachweis nie gefunden')
    else if (bereiche.nachweis.maxTexte === 0) grundlagen.push('Bildnachweis ohne messbaren Text oder Symbol: nicht gemessen')
  }
  for (const [name, werte] of Object.entries(bereiche)) {
    if (werte.kleinsterKontrastRoh != null && werte.kleinsterKontrastRoh < GRENZE) grundlagen.push(`Kontrast im Bereich «${name}» ${werte.kleinsterKontrast} < ${GRENZE} («${werte.schlechtesterText}»)`)
  }
  if (endzustand) {
    if (!endzustand.kontrast.bestanden) grundlagen.push(`Kontrast im Endzustand: ${endzustand.kontrast.gemessen} gemessen, ${endzustand.kontrast.nichtGemessen} nicht gemessen, kleinster ${endzustand.kontrast.kleinster}`)
    if (endzustand.fotos > 0 && !seite.nachweisErforderlich) grundlagen.push('Foto ohne Bildnachweis-Bereich')
    if (seite.nachweisSymbol && endzustand.nachweisOffen === null) grundlagen.push('Bildnachweis liess sich nicht öffnen: nicht gemessen')
    else if (endzustand.nachweisOffen && !endzustand.nachweisOffen.bestanden) grundlagen.push(`Kontrast im geöffneten Bildnachweis: ${endzustand.nachweisOffen.kleinster}`)
  } else if (!seite.verstoss) {
    grundlagen.push('Endzustand nicht gemessen')
  }
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
    grundlagen,
    bestanden: grundlagen.length === 0,
  }
}

/** Beweist vor dem Lauf, dass `auswerten` helle Flächen im Arbeitsbereich und dunkle Flächen auf öffentlichen Seiten wirklich als FAIL erkennt. */
function selbstpruefung() {
  const bereich = (grund, helle = 0) => ({ vorhanden: true, grund, grundMisch: grund, helleFlaechen: helle, helleBeispiele: helle ? ['div.test'] : [], textGeprueft: 6, bildTexte: 0, kleinsterKontrast: 8, schlechtesterText: 'Test' })
  const reihe = (seiteGrund, helle) => Array.from({ length: 12 }, (_, i) => ({ t: 100 + i * 16, hydriert: false, html: 'dark', shell: null, body: seiteGrund, seite: seiteGrund, kopf: bereich('rgb(255, 255, 255)'), inhalt: bereich(seiteGrund, helle), nachweis: null }))
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
          const auswertung = auswerten(zustand, proben, seite, endzustand, meldungen)
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
    gesamt: ergebnisse.length,
    bestanden: ergebnisse.filter((eintrag) => eintrag.bestanden).length,
    ergebnisse,
  }
  writeFileSync(join(AUS, 'dunkelstart.json'), JSON.stringify(bericht, null, 2))
  const negativOk = negativ.every((eintrag) => eintrag.erkannt)
  console.log(`Fertig: ${bericht.bestanden}/${bericht.gesamt} bestanden; Negativkontrollen erkannt: ${negativ.filter((eintrag) => eintrag.erkannt).length}/${negativ.length}`)
  if (bericht.bestanden !== bericht.gesamt || !negativOk) process.exitCode = 1
}

void main()
