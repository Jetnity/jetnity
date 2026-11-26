#!/usr/bin/env node
// scripts/premium-redesign-a/dunkelstart.mjs
//
// Dunkelstart und Hydration (A7): Läuft gegen den echten lokalen Next-Production-Build.
// Das Skript des Browsers (alle /_next/static JavaScript-Dateien) wird verzögert
// ausgeliefert. Dadurch steht das serverseitig erzeugte Dokument mehrere Sekunden
// ohne Hydration auf dem Schirm. Während der Verzögerung und danach wird in jedem
// Animationsbild gemessen (nicht nur einmal):
//   - Thema-Attribut an html und Shell,
//   - Hintergrund von Seite und Inhaltsbereich,
//   - hellen Flächen im Inhaltsbereich bei gespeichertem Dunkel (helle Platzhalter),
//   - Kontrast jedes sichtbaren Texts im Inhaltsbereich gegen den nächsten deckenden Grund.
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
const SEITEN = [
  { name: 'startseite', pfad: () => '/', inhalt: '#public-content, main', themenfaehig: false },
  { name: 'reise', pfad: () => `/reisen/${REISE.id}`, inhalt: '.workspace-content, main', themenfaehig: true },
  { name: 'planen', pfad: () => '/planen', inhalt: '.workspace-content, main', themenfaehig: true },
]
const BREITEN = [
  { name: '390', width: 390, height: 844, telefon: true },
  { name: '1440', width: 1440, height: 900, telefon: false },
]

/** Wird vor jedem Seitenskript eingesetzt und misst in jedem Animationsbild. */
function messschleife({ inhaltsSelektor, maximal }) {
  const proben = []
  window.__dunkelProben = proben
  const kanaele = (farbe) => {
    const treffer = farbe && farbe.match(/rgba?\(([^)]+)\)/)
    if (!treffer) return null
    const teile = treffer[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return { r: teile[0], g: teile[1], b: teile[2], a: teile[3] ?? 1 }
  }
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
  const deckenderGrund = (element) => {
    let knoten = element
    while (knoten) {
      const stil = getComputedStyle(knoten)
      if (stil.backgroundImage && stil.backgroundImage !== 'none') return null
      const farbe = kanaele(stil.backgroundColor)
      if (farbe && farbe.a >= 0.99) return farbe
      knoten = knoten.parentElement
    }
    return { r: 255, g: 255, b: 255, a: 1 }
  }
  const nehmen = (zeit) => {
    if (!document.documentElement) return requestAnimationFrame(nehmen)
    const inhalt = document.querySelector(inhaltsSelektor)
    const shell = document.querySelector('.workspace-shell')
    const probe = {
      t: Math.round(zeit),
      hydriert: Object.keys(document).some((schluessel) => schluessel.startsWith('__reactContainer')),
      html: document.documentElement.getAttribute('data-workspace-theme'),
      shell: shell ? shell.getAttribute('data-workspace-theme') : null,
      body: document.body ? getComputedStyle(document.body).backgroundColor : null,
      inhalt: null,
      helleFlaechen: 0,
      helleBeispiele: [],
      textGeprueft: 0,
      kleinsterKontrast: null,
      schlechtesterText: null,
    }
    if (inhalt) {
      const stilInhalt = getComputedStyle(inhalt)
      probe.inhalt = stilInhalt.backgroundColor
      const dunkel = document.documentElement.getAttribute('data-workspace-theme') === 'dark'
      if (dunkel) {
        for (const element of inhalt.querySelectorAll('*')) {
          const rahmen = element.getBoundingClientRect()
          if (rahmen.width * rahmen.height < 20000) continue
          const stil = getComputedStyle(element)
          const farbe = kanaele(stil.backgroundColor)
          if (farbe && farbe.a > 0.9 && leuchtdichte(farbe) > 0.6 && !element.closest('img, picture, [data-bild]')) {
            probe.helleFlaechen += 1
            if (probe.helleBeispiele.length < 4) probe.helleBeispiele.push(`${element.tagName.toLowerCase()}.${String(element.className).trim().split(/\s+/).slice(0, 3).join('.')} ${stil.backgroundColor} ${Math.round(rahmen.width)}x${Math.round(rahmen.height)}`)
          }
        }
      }
      let kleinster = Infinity
      let schlechtester = null
      const walker = document.createTreeWalker(inhalt, NodeFilter.SHOW_TEXT)
      let anzahl = 0
      while (walker.nextNode() && anzahl < 80) {
        const knoten = walker.currentNode
        if (!knoten.textContent || !knoten.textContent.trim()) continue
        const element = knoten.parentElement
        if (!element || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName) || element.closest('svg, [aria-hidden="true"]')) continue
        const stil = getComputedStyle(element)
        if (stil.visibility === 'hidden' || stil.display === 'none' || Number(stil.opacity) === 0) continue
        const rahmen = element.getBoundingClientRect()
        if (rahmen.width <= 2 || rahmen.height <= 2) continue
        const vordergrund = kanaele(stil.color)
        const grund = deckenderGrund(element)
        if (!vordergrund || !grund) continue
        anzahl += 1
        const verhaeltnis = kontrast(vordergrund, grund)
        if (verhaeltnis < kleinster) {
          kleinster = verhaeltnis
          schlechtester = knoten.textContent.trim().slice(0, 40)
        }
      }
      probe.textGeprueft = anzahl
      probe.kleinsterKontrast = Number.isFinite(kleinster) ? Math.round(kleinster * 100) / 100 : null
      probe.schlechtesterText = schlechtester
    }
    if (proben.length < maximal) proben.push(probe)
    requestAnimationFrame(nehmen)
  }
  requestAnimationFrame(nehmen)
}

function istHell(farbe) {
  const treffer = farbe && farbe.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!treffer) return null
  const l = [treffer[1], treffer[2], treffer[3]].map((k) => {
    const v = Number(k) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2] > 0.5
}

async function lauf(browserTyp, browserName, zustand, seite, breite) {
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
  await context.addInitScript(messschleife, { inhaltsSelektor: seite.inhalt, maximal: 600 })
  const meldungen = { konsole: [], seitenfehler: [], hydrationsfehler: [] }
  const page = await context.newPage()
  page.on('console', (nachricht) => {
    const text = nachricht.text()
    if (nachricht.type() === 'error') meldungen.konsole.push(text.slice(0, 240))
    if (/hydrat/i.test(text)) meldungen.hydrationsfehler.push(text.slice(0, 240))
  })
  page.on('pageerror', (fehler) => meldungen.seitenfehler.push(String(fehler).slice(0, 240)))
  let ersteSkriptAnfrage = null
  await page.route(/\/_next\/static\/.*\.js(\?.*)?$/, async (route) => {
    if (ersteSkriptAnfrage === null) ersteSkriptAnfrage = Date.now()
    const antwort = await route.fetch()
    await new Promise((fertig) => setTimeout(fertig, VERZOEGERUNG_MS))
    await route.fulfill({ response: antwort })
  })
  await page.goto(`${basis}${seite.pfad()}`, { waitUntil: 'commit' })
  await page.waitForTimeout(VERZOEGERUNG_MS + 3500)
  const proben = await page.evaluate(() => window.__dunkelProben ?? [])
  await context.close()
  return { proben, meldungen }
}

function auswerten(zustand, proben, themenfaehig) {
  const vorHydration = proben.filter((probe) => probe.t > 0)
  const mitInhalt = vorHydration.filter((probe) => probe.inhalt !== null)
  const attribute = new Set(mitInhalt.map((probe) => probe.html))
  const erwartet = zustand.erwartet === 'dark' ? 'dark' : null
  const falsch = mitInhalt.filter((probe) => probe.html !== erwartet)
  const hell = mitInhalt.filter((probe) => zustand.erwartet === 'dark' && themenfaehig && (istHell(probe.body) || istHell(probe.inhalt)))
  const kontraste = mitInhalt.map((probe) => probe.kleinsterKontrast).filter((wert) => wert != null)
  const kleinster = kontraste.length ? Math.min(...kontraste) : null
  const schlechtestes = mitInhalt.find((probe) => probe.kleinsterKontrast === kleinster)
  return {
    bilder: proben.length,
    bilderMitInhalt: mitInhalt.length,
    themaWerte: [...attribute],
    bilderMitFalschemThema: falsch.length,
    bilderMitHellemGrund: hell.length,
    maxHelleFlaechen: themenfaehig ? Math.max(0, ...mitInhalt.map((probe) => probe.helleFlaechen)) : 0,
    startseiteOhneThemenpflicht: !themenfaehig,
    helleBeispiele: (mitInhalt.find((probe) => probe.helleFlaechen > 0) ?? {}).helleBeispiele ?? [],
    kleinsterKontrast: kleinster,
    schlechtesterText: schlechtestes?.schlechtesterText ?? null,
    bilderVorHydration: mitInhalt.filter((probe) => !probe.hydriert).length,
    ersteBilder: mitInhalt.slice(0, 3).map((probe) => ({ t: probe.t, html: probe.html, shell: probe.shell, body: probe.body, inhalt: probe.inhalt })),
  }
}

async function main() {
  mkdirSync(AUS, { recursive: true })
  const browserListe = { chromium: await chromium.launch(), webkit: await webkit.launch() }
  const ergebnisse = []
  for (const [browserName, browserTyp] of Object.entries(browserListe)) {
    for (const zustand of ZUSTAENDE) {
      for (const seite of SEITEN) {
        for (const breite of BREITEN) {
          if (NUR && !NUR.split(',').includes(`${browserName}-${zustand.name}-${seite.name}-${breite.name}`)) continue
          const { proben, meldungen } = await lauf(browserTyp, browserName, zustand, seite, breite)
          const auswertung = auswerten(zustand, proben)
          const bestanden =
            auswertung.bilderVorHydration >= 8 &&
            auswertung.bilderMitFalschemThema === 0 &&
            auswertung.bilderMitHellemGrund === 0 &&
            auswertung.maxHelleFlaechen === 0 &&
            (auswertung.kleinsterKontrast === null || auswertung.kleinsterKontrast >= 4.5) &&
            meldungen.hydrationsfehler.length === 0 &&
            meldungen.seitenfehler.length === 0
          const eintrag = {
            browser: browserName,
            zustand: zustand.name,
            seite: seite.name,
            breite: breite.name,
            erwartetesThema: zustand.erwartet,
            ...auswertung,
            hydrationsfehler: meldungen.hydrationsfehler,
            helleBeispiele: auswertung.helleBeispiele,
            seitenfehler: meldungen.seitenfehler,
            konsolenFehler: meldungen.konsole.length,
            bestanden,
          }
          ergebnisse.push(eintrag)
          if (!bestanden) console.log('   ', JSON.stringify(auswertung.helleBeispiele), auswertung.schlechtesterText)
          console.log(
            `${browserName.padEnd(8)} ${zustand.name.padEnd(10)} ${seite.name.padEnd(10)} ${breite.name.padEnd(5)} ` +
              `Bilder=${auswertung.bilderMitInhalt}/${auswertung.bilderVorHydration}vor Thema=${auswertung.themaWerte.join('/') || '-'} Falsch=${auswertung.bilderMitFalschemThema} ` +
              `HellerGrund=${auswertung.bilderMitHellemGrund} HelleFlaechen=${auswertung.maxHelleFlaechen} Kontrast=${auswertung.kleinsterKontrast} ` +
              `Hydr=${meldungen.hydrationsfehler.length} Fehler=${meldungen.seitenfehler.length} ${bestanden ? 'PASS' : 'FAIL'}`,
          )
        }
      }
    }
  }
  for (const typ of Object.values(browserListe)) await typ.close()
  const bericht = {
    commit: COMMIT,
    basis: BASIS,
    basisWebkit: BASIS_WEBKIT,
    verzoegerungMs: VERZOEGERUNG_MS,
    erzeugt: new Date().toISOString(),
    gesamt: ergebnisse.length,
    bestanden: ergebnisse.filter((eintrag) => eintrag.bestanden).length,
    ergebnisse,
  }
  writeFileSync(join(AUS, 'dunkelstart.json'), JSON.stringify(bericht, null, 2))
  console.log(`Fertig: ${bericht.bestanden}/${bericht.gesamt} bestanden`)
}

void main()
