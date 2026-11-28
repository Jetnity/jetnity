#!/usr/bin/env node
// scripts/premium-redesign-a/kostenkarte.mjs
//
// Kostenkarte der Reise (W3-Bestand): horizontaler Überlauf und Sichtbarkeit jedes Betrags.
// Gemessen wird in jedem Zustand einzeln, nicht nur auf der geschlossenen Karte:
//   Quelle    Gastreise (lokaler Production-Build) und Konto-Reise (Prüfstand mit den echten Komponenten)
//   Reise     «thailand» (übliche Beträge) und «kosten» (sehr lange Beträge, zwei Währungen, Posten ohne Preis)
//   Browser   Chromium und WebKit
//   Breite    320, 390, 430 px
//   Schrift   100, 150, 200 %
//   Thema     hell, dunkel
//   Zustand   zu, offen (alle Aufklapper der Karte geöffnet: Posten ohne Preis und alle Posten mit Preis)
//
// PASS einer Zeile heisst: Überlauf der Seite 0 px, kein Element der Karte ragt über die Karte oder den
// Bildschirm, kein Betrag wird von einem Vorfahren abgeschnitten, jeder Betrag liegt vollständig im Bild,
// und die Beträge sind unverändert (genau die erwartete Liste, in der erwarteten Reihenfolge).
// Nicht gemessene Werte sind kein PASS.
//
//   node scripts/premium-redesign-a/kostenkarte.mjs --base http://127.0.0.1:3462 \
//     --base-webkit https://127.0.0.1:3482 --konto http://127.0.0.1:3471 --konto-kosten http://127.0.0.1:3472 \
//     --fixtures /tmp/pra/fixtures --out /tmp/pra/shots/kosten-nachher --label nachher --commit <sha>
//
// Kein Produktionszugriff, keine Anmeldung, synthetische Reisen.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3462')
const BASIS_WEBKIT = argument('base-webkit', BASIS)
const KONTO = argument('konto', 'http://127.0.0.1:3471')
const KONTO_KOSTEN = argument('konto-kosten', 'http://127.0.0.1:3472')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures')
const AUS = argument('out', '/tmp/pra/shots/kosten-nachher')
const LABEL = argument('label', 'nachher')
const COMMIT = argument('commit', 'unbekannt')
const NUR = argument('only', '')
const ZEIGE = process.argv.includes('--zeige')
const SCHLUESSEL_THEMA = 'jetnity:workspace-theme:v1'

const REISEN = {
  thailand: {
    fixture: JSON.parse(readFileSync(join(FIXTURES, 'thailand.json'), 'utf8')),
    // Von Hand aus den Punkten der Reise gerechnet: gesamt 5’045 = gebucht 640 + ausgewählt 4’405; Budget 4’800, 245 darüber.
    // Offen folgen die Posten mit Preis in der Reihenfolge der Karte: 640, 1’120, 1’260, 1’980, 45.
    erwartet: {
      zu: ['CHF 5’045.00', 'CHF 640.00', 'CHF 4’405.00', 'CHF 4’800.00', 'CHF 245.00'],
      offen: ['CHF 5’045.00', 'CHF 640.00', 'CHF 4’405.00', 'CHF 4’800.00', 'CHF 245.00', 'CHF 640.00', 'CHF 1’120.00', 'CHF 1’260.00', 'CHF 1’980.00', 'CHF 45.00'],
    },
  },
  kosten: {
    fixture: JSON.parse(readFileSync(join(FIXTURES, 'kosten.json'), 'utf8')),
    // CHF: 1’234’567.89 ausgewählt + 123’456.78 gebucht = 1’358’024.67. JPY: Aktivitäten lassen sich in der Karte nicht als
    // gebucht führen, daher 0.00 gebucht und beide Posten ausgewählt (1’234’567.00 + 9’999’999.99 = 11’234’566.99).
    // Das Budget in CHF wird nicht mit JPY verglichen und steht als Betrag allein.
    erwartet: {
      zu: ['CHF 1’358’024.67', 'CHF 123’456.78', 'CHF 1’234’567.89', 'JPY 11’234’566.99', 'JPY 0.00', 'JPY 11’234’566.99', 'CHF 1’000’000.00'],
      offen: ['CHF 1’358’024.67', 'CHF 123’456.78', 'CHF 1’234’567.89', 'JPY 11’234’566.99', 'JPY 0.00', 'JPY 11’234’566.99', 'CHF 1’000’000.00', 'CHF 123’456.78', 'JPY 1’234’567.00', 'JPY 9’999’999.99', 'CHF 1’234’567.89'],
    },
  },
}
const BREITEN = [320, 390, 430]
const SCHRIFTEN = [100, 150, 200]
const THEMEN = ['light', 'dark']
const ZUSTAENDE = ['zu', 'offen']
const QUELLEN = ['gast', 'konto']

function adresse(browserName, quelle, reise) {
  if (quelle === 'konto') return `${reise === 'kosten' ? KONTO_KOSTEN : KONTO}/reisen/konto`
  return `${browserName === 'webkit' ? BASIS_WEBKIT : BASIS}/reisen/${REISEN[reise].fixture.id}`
}

/** Läuft im Browser: misst die Kostenkarte im aktuellen Zustand. */
function messen() {
  const wurzel = document.documentElement
  const karte = document.querySelector('[data-workspace-kosten]')
  if (!karte) return { fehlt: true }
  const kr = karte.getBoundingClientRect()
  const sichtbar = (element) => {
    const stil = getComputedStyle(element)
    if (stil.visibility === 'hidden' || stil.display === 'none') return false
    // Inhalt eines geschlossenen Aufklappers liegt zwar im DOM, ist aber nicht zu sehen.
    const zu = element.closest('details:not([open])')
    if (zu && !element.closest('summary')) return false
    const r = element.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && !element.closest('.sr-only')
  }
  const ausserhalb = []
  for (const element of karte.querySelectorAll('*')) {
    if (!sichtbar(element) || element.closest('svg') && element.tagName !== 'svg') continue
    const r = element.getBoundingClientRect()
    if (r.right > kr.right + 0.5 || r.left < kr.left - 0.5 || r.right > innerWidth + 0.5 || r.left < -0.5) {
      ausserhalb.push({ tag: element.tagName.toLowerCase(), klasse: String(element.getAttribute('class') ?? '').slice(0, 40), text: (element.textContent ?? '').trim().slice(0, 24), rechts: Math.round(r.right * 10) / 10, links: Math.round(r.left * 10) / 10 })
    }
  }
  const betraege = []
  const abgeschnitten = []
  for (const element of karte.querySelectorAll('[data-preis]')) {
    if (!sichtbar(element)) continue
    const bereich = document.createRange()
    bereich.selectNodeContents(element)
    const rechtecke = [...bereich.getClientRects()].filter((r) => r.width > 0)
    betraege.push(element.textContent)
    let verdeckt = false
    for (const r of rechtecke) {
      if (r.left < -0.5 || r.right > innerWidth + 0.5) verdeckt = true
      for (let vorfahr = element.parentElement; vorfahr && vorfahr !== document.body; vorfahr = vorfahr.parentElement) {
        const stil = getComputedStyle(vorfahr)
        if ([stil.overflowX, stil.overflowY].some((wert) => wert !== 'visible')) {
          const v = vorfahr.getBoundingClientRect()
          if (r.right > v.right + 0.5 || r.left < v.left - 0.5 || r.bottom > v.bottom + 0.5 || r.top < v.top - 0.5) verdeckt = true
        }
      }
      if (r.right > kr.right + 0.5 || r.left < kr.left - 0.5) verdeckt = true
    }
    if (verdeckt) abgeschnitten.push(element.textContent)
  }
  const texte = []
  for (const element of karte.querySelectorAll('[data-status-siegel], dt, strong, summary, p')) {
    if (!sichtbar(element)) continue
    if (element.scrollWidth > element.clientWidth + 1 && getComputedStyle(element).overflowX !== 'visible') texte.push((element.textContent ?? '').trim().slice(0, 30))
  }
  return {
    fehlt: false,
    ueberlauf: wurzel.scrollWidth - wurzel.clientWidth,
    ueberlaufKoerper: document.body.scrollWidth - document.body.clientWidth,
    viewport: innerWidth,
    karte: { links: Math.round(kr.left * 10) / 10, rechts: Math.round(kr.right * 10) / 10, breite: Math.round(kr.width * 10) / 10 },
    ausserhalb: ausserhalb.slice(0, 8),
    anzahlAusserhalb: ausserhalb.length,
    betraege,
    abgeschnitten,
    beschnitteneTexte: texte,
    offeneAufklapper: [...karte.querySelectorAll('details')].filter((d) => d.open).length,
    schriftPx: parseFloat(getComputedStyle(wurzel).fontSize),
  }
}

const ergebnisse = []

async function lauf(browserTyp, browserName, quelle, reiseName, breite, thema) {
  const reise = REISEN[reiseName]
  if (NUR && !NUR.split(',').some((teil) => teil.startsWith(`${browserName}-${quelle}-${reiseName}-${breite}-`) && teil.includes(`-${thema}`))) return
  const context = await browserTyp.newContext({
    viewport: { width: breite, height: 900 },
    isMobile: true,
    hasTouch: true,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(({ schluessel, wert, reiseSchluessel, reiseRoh, mitReise }) => {
    try {
      localStorage.setItem(schluessel, wert)
      if (mitReise) localStorage.setItem(reiseSchluessel, reiseRoh)
    } catch { /* ignorieren */ }
  }, { schluessel: SCHLUESSEL_THEMA, wert: thema, reiseSchluessel: reise.fixture.schluessel, reiseRoh: reise.fixture.roh, mitReise: quelle === 'gast' })
  const seite = await context.newPage()
  await seite.goto(adresse(browserName, quelle, reiseName), { waitUntil: 'domcontentloaded' })
  await seite.waitForSelector('[data-workspace-kosten]', { timeout: 30_000 })
  await seite.waitForTimeout(900)
  for (const schrift of SCHRIFTEN) {
    await seite.evaluate((prozent) => {
      let stil = document.getElementById('pra-schrift')
      if (!stil) {
        stil = document.createElement('style')
        stil.id = 'pra-schrift'
        document.head.appendChild(stil)
      }
      stil.textContent = `html { font-size: ${prozent}% !important }`
    }, schrift)
    for (const zustand of ZUSTAENDE) {
      await seite.evaluate((offen) => {
        for (const d of document.querySelectorAll('[data-workspace-kosten] details')) d.open = offen
      }, zustand === 'offen')
      await seite.waitForTimeout(250)
      const m = await seite.evaluate(messen)
      const kennung = `${browserName}-${quelle}-${reiseName}-${breite}-${schrift}-${thema}-${zustand}`
      if (NUR && !NUR.split(',').some((teil) => kennung.includes(teil))) continue
      const erwartet = reise.erwartet[zustand]
      const unveraendert = !m.fehlt && m.betraege.length === erwartet.length && erwartet.every((betrag, index) => m.betraege[index] === betrag)
      const bestanden =
        !m.fehlt &&
        m.ueberlauf === 0 &&
        m.ueberlaufKoerper === 0 &&
        m.anzahlAusserhalb === 0 &&
        m.abgeschnitten.length === 0 &&
        m.beschnitteneTexte.length === 0 &&
        unveraendert &&
        m.betraege.length > 0
      const eintrag = { browser: browserName, quelle, reise: reiseName, breite, schrift, thema, zustand, bestanden, unveraendert, ...m }
      ergebnisse.push(eintrag)
      console.log(
        `${bestanden ? 'PASS' : 'FAIL'} ${browserName.padEnd(8)} ${quelle.padEnd(5)} ${reiseName.padEnd(8)} ${String(breite).padStart(3)} px ${String(schrift).padStart(3)} % ${thema.padEnd(5)} ${zustand.padEnd(5)} ` +
          `Überlauf=${m.ueberlauf} Körper=${m.ueberlaufKoerper} Ausserhalb=${m.anzahlAusserhalb} Abgeschnitten=${m.abgeschnitten?.length} Beträge=${m.betraege?.length} unverändert=${unveraendert}`,
      )
      if (!bestanden && m.ausserhalb?.length) console.log('     ', JSON.stringify(m.ausserhalb.slice(0, 3)))
      if (ZEIGE) console.log('     Beträge:', (m.betraege ?? []).join(' | '))
      if (breite === 320 && schrift === 200 && zustand === 'offen' && thema === 'light' && browserName === 'chromium' && reiseName === 'kosten') {
        mkdirSync(AUS, { recursive: true })
        await seite.locator('[data-workspace-kosten]').first().screenshot({ path: join(AUS, `kostenkarte__${quelle}-${reiseName}-${breite}-${schrift}-${thema}-${zustand}.png`) }).catch(() => undefined)
      }
    }
  }
  await context.close()
}

async function main() {
  mkdirSync(AUS, { recursive: true })
  const browserListe = { chromium: await chromium.launch(), webkit: await webkit.launch() }
  for (const [browserName, browserTyp] of Object.entries(browserListe)) {
    for (const quelle of QUELLEN) {
      for (const reiseName of Object.keys(REISEN)) {
        for (const breite of BREITEN) {
          for (const thema of THEMEN) {
            await lauf(browserTyp, browserName, quelle, reiseName, breite, thema)
          }
        }
      }
    }
  }
  for (const typ of Object.values(browserListe)) await typ.close()
  const bericht = {
    label: LABEL,
    commit: COMMIT,
    basis: BASIS,
    erzeugt: new Date().toISOString(),
    gesamt: ergebnisse.length,
    bestanden: ergebnisse.filter((eintrag) => eintrag.bestanden).length,
    ergebnisse,
  }
  writeFileSync(join(AUS, `kostenkarte-${LABEL}.json`), JSON.stringify(bericht, null, 2))
  console.log(`Fertig (${LABEL}): ${bericht.bestanden}/${bericht.gesamt} bestanden`)
  process.exitCode = bericht.bestanden === bericht.gesamt ? 0 : 1
}

void main()
