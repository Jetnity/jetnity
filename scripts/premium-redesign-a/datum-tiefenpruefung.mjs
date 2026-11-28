// Tiefenprüfung der Datumsanzeige: besucht jede adressierbare Arbeitsbereich-
// Ansicht einer Reise (Plan, jeder Tag, jeder Planpunkt, jede Verbindung,
// Organisieren je Kategorie und Etappe, Vorbereitung, Einreise) und prüft, dass
// kein abgekürztes Datum mit einem zweiten Punkt endet.
//
// Zwei unabhängige Merkmale:
//  1. Text: «Dez..», «Sept..» usw. im sichtbaren Text und in Zugänglichkeitsnamen.
//  2. Markierung (--markierung 1): Jedes Datumsetikett mit eigenem Punkt trägt
//     vor diesem Punkt ein unsichtbares Zeichen. «Dez⁣..» findet auch Stellen, an
//     denen ein anderer Formatierer als datumKurz() einen Punkt anhängt.
//
// Mit --konto-pfad /reisen/konto läuft dieselbe Prüfung gegen den Konto-Prüfstand
// (echte Komponenten mit quelle="account", Reisebegleiter und Reise ändern).
//
// Aufruf: node scripts/premium-redesign-a/datum-tiefenpruefung.mjs --base URL
//   --fixtures ORDNER --reisen graz,wien-graz --browser chromium --breite 390
//   --thema light --out ORDNER --label NAME --markierung 1 [--basis-webkit URL]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3497')
const BASIS_WEBKIT = argument('basis-webkit', BASIS)
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures-graz')
const AUSGABE = argument('out', '/tmp/pra/datum-tief')
const LABEL = argument('label', 'tiefenpruefung')
const REISEN = argument('reisen', 'graz').split(',').filter(Boolean)
const BROWSER = argument('browser', 'chromium')
const BREITE = Number(argument('breite', '390'))
const THEMA = argument('thema', 'light')
const MARKIERUNG = argument('markierung', '') === '1'
const KONTO_PFAD = argument('konto-pfad', '')
const KLICKEN = argument('klicken', '') === '1'
const KLICK_GRENZE = Number(argument('klick-grenze', '48'))
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'
const MARKE = '\u2063'


mkdirSync(join(AUSGABE, LABEL), { recursive: true })

function reiseLaden(name) {
  const datei = JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), 'utf8'))
  return { ...datei, trip: JSON.parse(datei.roh) }
}

function adressen(reise) {
  const { id, trip } = reise
  const wurzel = KONTO_PFAD || `/reisen/${id}`
  const urls = [{ name: 'konto-reise', pfad: wurzel }]
  const mit = (name, query) => urls.push({ name, pfad: `${wurzel}?${query}` })
  mit('plan', 'ansicht=plan')
  for (const tag of trip.days ?? []) mit(`plan-tag-${tag.id}`, `ansicht=plan&tag=${encodeURIComponent(tag.id)}`)
  for (const tag of trip.days ?? []) {
    for (const punkt of tag.items ?? []) {
      mit(`plan-punkt-${punkt.id}`, `ansicht=plan&tag=${encodeURIComponent(tag.id)}&punkt=${encodeURIComponent(punkt.id)}`)
    }
  }
  for (const punkt of trip.ohneTag ?? []) mit(`plan-punkt-ohne-tag-${punkt.id}`, `ansicht=plan&punkt=${encodeURIComponent(punkt.id)}`)
  const etappen = [...(trip.stages ?? [])].sort((a, b) => a.position - b.position)
  for (let index = 0; index < etappen.length - 1; index += 1) {
    const kante = `connection:${etappen[index].id}:${etappen[index + 1].id}`
    mit(`plan-kante-${index}`, `ansicht=plan&kante=${encodeURIComponent(kante)}`)
    mit(`organisieren-verbindungen-kante-${index}`, `ansicht=organisieren&kategorie=verbindungen&kante=${encodeURIComponent(kante)}`)
  }
  for (const kategorie of ['fluege', 'unterkunft', 'aktivitaeten', 'mietwagen', 'verbindungen']) {
    mit(`organisieren-${kategorie}`, `ansicht=organisieren&kategorie=${kategorie}`)
  }
  for (const etappe of etappen) {
    mit(`organisieren-unterkunft-${etappe.id}`, `ansicht=organisieren&kategorie=unterkunft&etappe=${encodeURIComponent(etappe.id)}`)
    mit(`organisieren-aktivitaeten-${etappe.id}`, `ansicht=organisieren&kategorie=aktivitaeten&etappe=${encodeURIComponent(etappe.id)}`)
  }
  mit('vorbereitung', 'ansicht=vorbereitung')
  for (const bereich of ['offizielle-anforderungen', 'reisende-dokumente', 'tickets-buchungen', 'eigene-vorbereitung']) {
    mit(`vorbereitung-${bereich}`, `ansicht=vorbereitung&vorbereitung=${bereich}`)
  }
  mit('einreise', 'ansicht=einreise')
  urls.push({ name: 'meine-reisen', pfad: '/reisen' })
  if (KONTO_PFAD) {
    urls.push({ name: 'meine-reisen-offen', pfad: '/reisen?archiv=offen' })
    urls.push({ name: 'meine-reisen-archiv', pfad: '/reisen?archiv=archiv' })
    urls.push({ name: 'konto-start', pfad: '/account' })
    urls.push({ name: 'konto-merkliste', pfad: '/account/merkliste' })
    urls.push({ name: 'konto-einstellungen', pfad: '/account/settings' })
  }
  return urls
}

function seitenmessung() {
  const text = document.body.innerText
  const attribute = []
  for (const element of document.querySelectorAll('[aria-label],[title],[alt]')) {
    for (const name of ['aria-label', 'title', 'alt']) {
      const wert = element.getAttribute(name)
      if (wert) attribute.push(wert)
    }
  }
  const alle = [text, ...attribute]
  return {
    thema: document.querySelector('[data-workspace-theme]')?.getAttribute('data-workspace-theme') ?? null,
    zeichen: text.length,
    datumsetiketten: (text.match(/\b\d{1,2}\.\s?(?:Jan|Feb|Apr|Aug|Sept|Okt|Nov|Dez)\u2063?\./g) ?? []).length,
    marken: (text.match(/\u2063/g) ?? []).length,
    text: alle.flatMap((eintrag) => {
      const treffer = []
      for (const fund of eintrag.matchAll(/\b(?:Jan|Feb|Apr|Aug|Sept|Okt|Nov|Dez)\u2063?\.\./g)) {
        treffer.push(eintrag.slice(Math.max(0, fund.index - 50), fund.index + 30).replace(/\s+/g, ' '))
      }
      return treffer
    }),
    markiert: alle.flatMap((eintrag) => {
      const treffer = []
      for (const fund of eintrag.matchAll(/\u2063\.[.!?]/g)) {
        treffer.push(eintrag.slice(Math.max(0, fund.index - 50), fund.index + 30).replace(/\s+/g, ' '))
      }
      return treffer
    }),
  }
}

async function kontextOeffnen(browserInstanz, reise) {
  const telefon = BREITE <= 430
  const context = await browserInstanz.newContext({
    viewport: { width: BREITE, height: telefon ? 844 : 900 },
    deviceScaleFactor: 1,
    isMobile: telefon,
    hasTouch: telefon,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(({ schluessel, wert, themaSchluessel, thema }) => {
    try {
      localStorage.setItem(schluessel, wert)
      if (thema === 'dark') localStorage.setItem(themaSchluessel, 'dark')
    } catch {
      /* blockierter Speicher wird hier nicht geprüft */
    }
  }, { schluessel: reise.schluessel, wert: reise.roh, themaSchluessel: THEMA_SCHLUESSEL, thema: THEMA })
  if (MARKIERUNG) {
    await context.addInitScript((marke) => {
      const beschreibung = Object.getOwnPropertyDescriptor(Intl.DateTimeFormat.prototype, 'format')
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'format', {
        configurable: true,
        get() {
          const roh = beschreibung.get.call(this)
          return (datum) => {
            const text = roh(datum)
            return /\.$/.test(text) ? text.slice(0, -1) + marke + '.' : text
          }
        },
      })
      for (const name of ['toLocaleDateString', 'toLocaleString']) {
        const original = Date.prototype[name]
        Date.prototype[name] = function (...argumente) {
          const text = original.apply(this, argumente)
          return typeof text === 'string' && /\.$/.test(text) ? text.slice(0, -1) + marke + '.' : text
        }
      }
    }, MARKE)
  }
  return context
}

const ZERSTOERT = /löschen|entfernen|abmelden|ausloggen|verwerfen|zurücksetzen|logout|konto/i

async function klickDurchlauf(seite, ansichtName, adresse, messenNach) {
  const namen = await seite.evaluate(() => {
    const sichtbar = (element) => {
      const kasten = element.getBoundingClientRect()
      const stil = getComputedStyle(element)
      return kasten.width > 0 && kasten.height > 0 && stil.visibility !== 'hidden' && stil.display !== 'none'
    }
    const liste = []
    for (const element of document.querySelectorAll('button, [role="tab"], summary')) {
      if (!sichtbar(element)) continue
      const name = (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70)
      if (name) liste.push(name)
    }
    return liste
  })
  const eindeutig = [...new Set(namen)].filter((name) => !ZERSTOERT.test(name)).slice(0, KLICK_GRENZE)
  let index = 0
  for (const name of eindeutig) {
    index += 1
    const markiert = await seite.evaluate((gesucht) => {
      for (const element of document.querySelectorAll('button, [role="tab"], summary')) {
        const bezeichnung = (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70)
        const kasten = element.getBoundingClientRect()
        if (bezeichnung === gesucht && kasten.width > 0 && kasten.height > 0) {
          element.setAttribute('data-krabbler', '1')
          return true
        }
      }
      return false
    }, name)
    if (!markiert) continue
    try {
      await seite.locator('[data-krabbler="1"]').first().click({ timeout: 2500 })
      await messenNach(`${ansichtName}~klick-${index}-${name.slice(0, 24)}`)
    } catch {
      /* nicht anklickbar: überspringen */
    }
    try {
      await seite.goto(adresse, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('h1', { timeout: 20_000 })
      await seite.waitForTimeout(250)
    } catch {
      return
    }
  }
}

async function reiseAendernBesuchen(seite, messenNach) {
  const knopf = seite.getByRole('button', { name: /^Reise ändern/ }).first()
  if (!(await knopf.count())) return
  await knopf.click()
  await seite.waitForTimeout(600)
  await messenNach('reise-aendern-offen')
  for (const schritt of [/^2\. /, /^3\. /]) {
    const reiter = seite.getByRole('button', { name: schritt }).first()
    if (await reiter.count()) {
      await reiter.click().catch(() => undefined)
      await seite.waitForTimeout(500)
      await messenNach(`reise-aendern-schritt-${String(schritt).slice(3, 4)}`)
    }
  }
  await seite.keyboard.press('Escape')
}

async function reiseBesuchen(browserInstanz, basis, reiseName) {
  const reise = reiseLaden(reiseName)
  const context = await kontextOeffnen(browserInstanz, reise)
  const seite = await context.newPage()
  const ansichten = {}
  const fehler = []
  seite.on('pageerror', (e) => fehler.push(String(e).slice(0, 160)))
  const messen = async (name) => {
    await seite.waitForTimeout(450)
    ansichten[name] = await seite.evaluate(seitenmessung)
  }
  let punktAnzahl = 0
  let tagAnzahl = 0
  for (const ziel of adressen(reise)) {
    try {
      await seite.goto(`${basis}${ziel.pfad}`, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('h1', { timeout: 20_000 })
      await messen(ziel.name)
      if (ziel.name === 'konto-reise') await reiseAendernBesuchen(seite, messen)
      if (KLICKEN) {
        const festeAnsicht = ['konto-reise', 'plan', 'vorbereitung', 'einreise', 'meine-reisen', 'konto-start'].includes(ziel.name) ||
          /^organisieren-(fluege|unterkunft|aktivitaeten|mietwagen|verbindungen)$/.test(ziel.name)
        const tag = /^plan-tag-/.test(ziel.name) && (tagAnzahl += 1) <= 2
        const punkt = /^plan-punkt-/.test(ziel.name) && (punktAnzahl += 1) <= 3
        if (festeAnsicht || tag || punkt) await klickDurchlauf(seite, ziel.name, `${basis}${ziel.pfad}`, messen)
      }
    } catch (e) {
      ansichten[ziel.name] = { offen: String(e).slice(0, 140) }
    }
  }
  await context.close()
  const gemessen = Object.entries(ansichten).filter(([, m]) => typeof m.zeichen === 'number')
  const offen = Object.entries(ansichten).filter(([, m]) => typeof m.zeichen !== 'number').map(([name, m]) => `${name}: ${m.offen}`)
  const textTreffer = gemessen.flatMap(([name, m]) => m.text.map((ausschnitt) => ({ ansicht: name, ausschnitt })))
  const markeTreffer = gemessen.flatMap(([name, m]) => m.markiert.map((ausschnitt) => ({ ansicht: name, ausschnitt })))
  const etiketten = gemessen.reduce((summe, [, m]) => summe + m.datumsetiketten, 0)
  const ansichtenMitMarke = gemessen.filter(([, m]) => m.marken > 0).length
  const themaAbweichung = gemessen.filter(([, m]) => m.thema !== null && m.thema !== THEMA).map(([name, m]) => `${name}: ${m.thema}`)
  const themaGeprueft = gemessen.filter(([, m]) => m.thema === THEMA).length
  return {
    reise: reiseName,
    ansichtenGeprueft: gemessen.length,
    ansichtenNamen: gemessen.map(([name]) => name),
    offen,
    datumsetikettenGesehen: etiketten,
    ansichtenMitMarke,
    themaGeprueft,
    themaAbweichung,
    textTreffer,
    markeTreffer,
    seitenfehler: fehler,
    ergebnis: textTreffer.length === 0 && markeTreffer.length === 0 && themaAbweichung.length === 0 && themaGeprueft > 0 && gemessen.length > 0 ? 'PASS' : 'FAIL',
  }
}

const browserTyp = BROWSER === 'webkit' ? webkit : chromium
const basis = BROWSER === 'webkit' ? BASIS_WEBKIT : BASIS
const browserInstanz = await browserTyp.launch({ headless: true })
const ergebnisse = []
for (const name of REISEN) {
  const e = await reiseBesuchen(browserInstanz, basis, name)
  ergebnisse.push(e)
  console.log(`${e.ergebnis} ${BROWSER}-${BREITE}-${THEMA} ${name} | Ansichten ${e.ansichtenGeprueft} | Etiketten ${e.datumsetikettenGesehen} | Marke in ${e.ansichtenMitMarke} | Thema ${THEMA} in ${e.themaGeprueft}/${e.themaAbweichung.length ? `abw. ${e.themaAbweichung.length}` : 'ok'} | Text-Treffer ${e.textTreffer.length} | Marke-Treffer ${e.markeTreffer.length}${e.offen.length ? ` | offen ${e.offen.length}` : ''}`)
  for (const treffer of [...e.textTreffer, ...e.markeTreffer].slice(0, 4)) console.log(`   ${treffer.ansicht}: «${treffer.ausschnitt}»`)
}
await browserInstanz.close()
writeFileSync(join(AUSGABE, LABEL, `${BROWSER}-${BREITE}-${THEMA}.json`), JSON.stringify({ label: LABEL, basis, browser: BROWSER, breite: BREITE, thema: THEMA, markierung: MARKIERUNG, ergebnisse }, null, 2))
const bestanden = ergebnisse.filter((e) => e.ergebnis === 'PASS').length
console.log(`${LABEL} ${BROWSER}-${BREITE}-${THEMA}: ${bestanden} PASS, ${ergebnisse.length - bestanden} FAIL`)
process.exitCode = bestanden === ergebnisse.length ? 0 : 1
