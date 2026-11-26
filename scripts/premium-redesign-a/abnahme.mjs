#!/usr/bin/env node
// scripts/premium-redesign-a/abnahme.mjs
//
// Vorher/Nachher-Abnahme von PR A (Premium-Redesign: Kopfzeile, Reisekopf, Design-System).
//
// Läuft gegen einen echten lokalen Next-Production-Build (`next build` + `next start`)
// mit synthetischen Gastreisen aus `fixtures.ts`. Keine Kundendaten, keine Anmeldung,
// kein Produktionszugriff. Der Treiber ist für Vorher und Nachher derselbe; nur der
// Code, den der Server ausliefert, unterscheidet sich.
//
//   node scripts/premium-redesign-a/abnahme.mjs \
//     --base http://127.0.0.1:3461 --label vorher --commit <sha> \
//     --out /tmp/pra/shots --fixtures /tmp/pra/fixtures [--konto <url>]
//
// Ausgabe: <out>/<label>/<ansicht>__<browser>-<breite>-<thema>.png und
// <out>/<label>/messwerte.json. Eine nicht ausgeführte Messung steht als `null`
// mit Grund im Protokoll, niemals als bestanden.
//
// Kontrast: Grenze 4,5 : 1 für alle sichtbaren Texte (auch grosse Schrift), ungerundet verglichen.
// Texte auf einfarbigem Grund und Texte auf Bildgrund werden getrennt gemessen (kontrast.mjs); was
// nicht gemessen werden konnte, ist kein PASS.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'
import { kontrastMessen } from './kontrast.mjs'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3461')
const BASIS_WEBKIT = argument('base-webkit', BASIS)
const PARALLEL = Number(argument('parallel', '3'))
const ETIKETT = argument('label', 'vorher')
const COMMIT = argument('commit', 'unbekannt')
const AUS = argument('out', '/tmp/pra/shots')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures')
const KONTO = argument('konto', '')
const NUR_ANSICHTEN = argument('views', '')
const NUR_KOMBIS = argument('combos', '')
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'
const JETZT = '2026-12-03T10:00:00.000Z'
const ZEITZONE = 'Europe/Zurich'

const BROWSER = { chromium, webkit }
const BREITEN = [
  { name: '390', width: 390, height: 844, telefon: true },
  { name: '1440', width: 1440, height: 900, telefon: false },
  { name: '320', width: 320, height: 640, telefon: true },
  { name: '430', width: 430, height: 932, telefon: true },
]
const THEMEN = ['light', 'dark']

const REISE = JSON.parse(readFileSync(join(FIXTURES, 'thailand.json'), 'utf8'))

const KOMBINATIONEN = []
for (const browser of ['chromium', 'webkit']) {
  for (const breite of BREITEN) {
    for (const thema of THEMEN) KOMBINATIONEN.push({ browser, breite, thema })
  }
}

const ANSICHTEN = [
  'startseite',
  'uebersicht',
  'reiseplan',
  'organisieren',
  'vorbereitung',
  'einreise',
  'konto',
  'konto-reise',
  'begleiter',
  'menue',
  'menue-startseite',
  'profil',
  'laden',
  'fehler',
]

function kombiName({ browser, breite, thema }) {
  return `${browser}-${breite.name}-${thema}`
}

async function kontext(browserTyp, kombi, optionen = {}) {
  const { breite, thema } = kombi
  const context = await browserTyp.newContext({
    viewport: { width: breite.width, height: breite.height },
    deviceScaleFactor: 1,
    isMobile: breite.telefon,
    hasTouch: breite.telefon,
    locale: 'de-CH',
    timezoneId: ZEITZONE,
    ignoreHTTPSErrors: true,
    ...optionen,
  })
  await context.addInitScript(
    ({ schluessel, wert, themaSchluessel, thema: wunsch, mitReise }) => {
      try {
        if (mitReise) localStorage.setItem(schluessel, wert)
        if (wunsch === 'dark') localStorage.setItem(themaSchluessel, 'dark')
      } catch {
        /* blockierter Speicher wird getrennt geprüft */
      }
    },
    { schluessel: REISE.schluessel, wert: REISE.roh, themaSchluessel: THEMA_SCHLUESSEL, thema, mitReise: optionen.mitReise !== false },
  )
  return context
}

async function seiteOeffnen(context) {
  const seite = await context.newPage()
  const meldungen = { konsole: [], seitenfehler: [], anfragefehler: [] }
  seite.on('console', (nachricht) => {
    if (nachricht.type() === 'error' || nachricht.type() === 'warning') {
      meldungen.konsole.push({ art: nachricht.type(), text: nachricht.text().slice(0, 300) })
    }
  })
  seite.on('pageerror', (fehler) => meldungen.seitenfehler.push(String(fehler).slice(0, 300)))
  seite.on('requestfailed', (anfrage) => {
    const fehler = anfrage.failure()?.errorText ?? ''
    if (fehler !== 'net::ERR_ABORTED' && fehler !== 'NS_BINDING_ABORTED') meldungen.anfragefehler.push({ adresse: anfrage.url().replace(/^https?:\/\/[^/]+/, ''), fehler })
  })
  await seite.clock.setFixedTime(new Date(JETZT))
  return { seite, meldungen }
}

async function warten(seite, ms = 700) {
  await seite.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await seite.evaluate(() => document.fonts?.ready).catch(() => undefined)
  await seite.waitForTimeout(ms)
}

/* ---------- Messungen im Browser ---------- */

function messenImBrowser() {
  const rechteck = (selektor) => {
    const element = document.querySelector(selektor)
    if (!element) return null
    const r = element.getBoundingClientRect()
    return { x: Math.round(r.x), y: Math.round(r.y), breite: Math.round(r.width), hoehe: Math.round(r.height), unten: Math.round(r.bottom) }
  }
  const sichtbar = (element) => {
    const stil = getComputedStyle(element)
    if (stil.visibility === 'hidden' || stil.display === 'none' || Number(stil.opacity) === 0) return false
    const r = element.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }

  const eingaben = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')]
    .filter(sichtbar)
    .map((element) => parseFloat(getComputedStyle(element).fontSize))
  const wurzel = document.documentElement

  const kopf = document.querySelector('header')
  const fest = [...document.querySelectorAll('.workspace-bottom-nav, .workspace-cost-bar, [data-shell-nav="bottom"]')]
    .filter((element) => getComputedStyle(element).position === 'fixed' && sichtbar(element))
  const festeHoehe = fest.reduce((summe, element) => summe + element.getBoundingClientRect().height, 0)
  const kopfHoehe = kopf && getComputedStyle(kopf).position === 'sticky' ? kopf.getBoundingClientRect().height : 0

  return {
    viewport: { breite: innerWidth, hoehe: innerHeight },
    ueberlaufX: wurzel.scrollWidth - wurzel.clientWidth,
    titel: document.querySelector('h1')?.textContent?.trim().slice(0, 80) ?? null,
    kopfzeile: kopf ? rechteck('header') : null,
    bottomNav: rechteck('.workspace-bottom-nav'),
    kostenLeiste: rechteck('.workspace-cost-bar'),
    festeHoeheGesamt: Math.round(festeHoehe),
    nutzhoehe: Math.round(innerHeight - kopfHoehe - festeHoehe),
    inhaltsHoeheVerfuegbarProzent: Math.round(((innerHeight - kopfHoehe - festeHoehe) / innerHeight) * 100),
    kleinsteEingabeSchrift: eingaben.length ? Math.min(...eingaben) : null,
    themaHtml: wurzel.getAttribute('data-workspace-theme'),
    themaShell: document.querySelector('.workspace-shell')?.getAttribute('data-workspace-theme') ?? null,
  }
}

/** Abstand zwischen dem Ende des Inhalts und der Fusszeile (am Seitenende gemessen). */
async function abstandVorFusszeile(seite) {
  return seite.evaluate(async () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    await new Promise((fertig) => setTimeout(fertig, 300))
    const fussListe = [...document.querySelectorAll('footer')]
    const fuss = fussListe[fussListe.length - 1]
    const inhalt = document.querySelector('.workspace-content, #public-content')
    if (!fuss || !inhalt) return null
    const imFluss = (element) => {
      const stil = getComputedStyle(element)
      return stil.display !== 'none' && stil.visibility !== 'hidden' && !['fixed', 'absolute'].includes(stil.position)
    }
    let letztes = inhalt
    for (;;) {
      const kinder = [...letztes.children].filter((kind) => imFluss(kind) && kind.getBoundingClientRect().height > 0)
      if (!kinder.length) break
      letztes = kinder[kinder.length - 1]
    }
    const f = fuss.getBoundingClientRect()
    const i = letztes.getBoundingClientRect()
    const haupt = document.querySelector('main')
    const nav = document.querySelector('.workspace-bottom-nav')
    const navR = nav && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect() : null
    return {
      inhaltEndeBisFusszeile: Math.round(f.top - i.bottom),
      fusszeileBisViewportUnten: Math.round(innerHeight - f.bottom),
      hauptPolsterUnten: haupt ? Math.round(parseFloat(getComputedStyle(haupt).paddingBottom)) : null,
      feststehendeNavigationHoehe: navR ? Math.round(navR.height) : 0,
    }
  })
}

/* ---------- Ansichten ---------- */

async function tabOeffnen(seite, muster) {
  const nav = seite.locator('[data-shell-nav="bottom"], nav.workspace-bottom-nav, [data-workspace-mode-nav="sidebar"]')
  const knopf = seite.locator('.workspace-bottom-nav button, [data-workspace-mode-nav="sidebar"] button, .workspace-sidebar button').filter({ hasText: muster })
  const sichtbarerKnopf = knopf.first()
  await sichtbarerKnopf.waitFor({ state: 'attached', timeout: 10_000 })
  const kandidaten = await knopf.all()
  for (const kandidat of kandidaten) {
    if (await kandidat.isVisible()) {
      await kandidat.click()
      await seite.waitForTimeout(900)
      await seite.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await seite.waitForTimeout(250)
      return true
    }
  }
  void nav
  return false
}

async function menueOeffnen(seite, telefon) {
  if (telefon) {
    const knopf = seite.locator('button[aria-controls="workspace-navigation"]').first()
    await knopf.click()
    await seite.waitForTimeout(500)
    return true
  }
  const seitenleiste = seite.locator('.workspace-sidebar').first()
  const box = await seitenleiste.boundingBox()
  if (!box) return false
  await seite.mouse.move(box.x + 30, box.y + 60)
  await seite.waitForTimeout(500)
  return true
}

async function ansichtErfassen(browserTyp, kombi, ansicht, ordner) {
  const { breite } = kombi
  const basis = kombi.browser === 'webkit' ? BASIS_WEBKIT : BASIS
  const REISE_URL = `${basis}/reisen/${REISE.id}`
  const context = await kontext(browserTyp, kombi, ansicht === 'startseite' || ansicht === 'menue-startseite' || ansicht === 'konto-reise' || ansicht === 'begleiter' ? { mitReise: false } : {})
  const { seite, meldungen } = await seiteOeffnen(context)
  const datei = join(ordner, `${ansicht}__${kombiName(kombi)}.png`)
  let messung = null
  let hinweis = null
  try {
    if (ansicht === 'startseite') {
      await seite.goto(`${basis}/`, { waitUntil: 'domcontentloaded' })
      await warten(seite, 1200)
    } else if (ansicht === 'menue-startseite') {
      await seite.goto(`${basis}/`, { waitUntil: 'domcontentloaded' })
      await warten(seite, 900)
      const knopf = seite.locator('button[aria-controls="oeffentliche-mobile-navigation"]').first()
      if (!(await knopf.isVisible())) hinweis = 'Auf dieser Breite gibt es kein Menü, die Navigation steht in der Kopfzeile.'
      else {
        await knopf.click()
        await seite.waitForTimeout(500)
      }
    } else if (ansicht === 'konto') {
      if (!KONTO) {
        hinweis = 'OFFEN: kein Konto-Harness angegeben; /account braucht eine Anmeldung und wird nicht umgangen.'
      } else {
        await seite.goto(`${KONTO}/account`, { waitUntil: 'domcontentloaded' })
        await warten(seite, 900)
      }
    } else if (ansicht === 'konto-reise' || ansicht === 'begleiter') {
      if (!KONTO) {
        hinweis = 'OFFEN: kein Konto-Harness angegeben; die Konto-Reise braucht eine Anmeldung und wird nicht umgangen.'
      } else {
        await seite.goto(`${KONTO}/reisen/konto`, { waitUntil: 'domcontentloaded' })
        await seite.waitForSelector('.reisekopf h1, h1', { timeout: 20_000 })
        await warten(seite, 1000)
        if (ansicht === 'begleiter') {
          await seite.locator('button.kopf-begleiter').first().click()
          await seite.waitForTimeout(700)
        }
      }
    } else if (ansicht === 'laden') {
      await seite.route('**/_next/static/chunks/**/*.js', (route) => route.abort())
      await seite.goto(REISE_URL, { waitUntil: 'domcontentloaded' })
      await seite.waitForTimeout(900)
    } else if (ansicht === 'fehler') {
      await context.addInitScript(({ schluessel }) => {
        try { localStorage.setItem(schluessel, '{"kaputt"') } catch { /* ignorieren */ }
      }, { schluessel: REISE.schluessel })
      await seite.goto(REISE_URL, { waitUntil: 'domcontentloaded' })
      await warten(seite, 1200)
    } else {
      await seite.goto(REISE_URL, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('h1', { timeout: 20_000 })
      await warten(seite, 1000)
      if (ansicht === 'reiseplan') await tabOeffnen(seite, /^\s*Reiseplan/)
      if (ansicht === 'organisieren') await tabOeffnen(seite, /^\s*Organisieren/)
      if (ansicht === 'vorbereitung') await tabOeffnen(seite, /^\s*Vorbereitung/)
      if (ansicht === 'einreise') await tabOeffnen(seite, /^\s*Einreise/)
      if (ansicht === 'menue') {
        if (!(await menueOeffnen(seite, breite.telefon))) hinweis = 'Menü ließ sich nicht öffnen.'
      }
      if (ansicht === 'profil') {
        await seite.locator('summary[aria-label="Kontomenü"]').first().click()
        await seite.waitForTimeout(400)
      }
    }
    const nurAnzeigen = (ansicht === 'konto' || ansicht === 'konto-reise' || ansicht === 'begleiter') && !KONTO
    if (!nurAnzeigen) {
      messung = await seite.evaluate(messenImBrowser)
      messung.kontrast = await kontrastMessen(seite)
      messung.kleinsterKontrast = messung.kontrast.kleinster
      await seite.screenshot({ path: datei })
      if (!['laden', 'fehler', 'menue', 'menue-startseite', 'profil', 'begleiter'].includes(ansicht)) {
        messung.fusszeile = await abstandVorFusszeile(seite)
        await seite.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      }
    }
  } catch (fehler) {
    hinweis = `Fehler bei der Erfassung: ${String(fehler).slice(0, 240)}`
  }
  const ergebnis = {
    ansicht,
    kombination: kombiName(kombi),
    datei: messung ? `${ansicht}__${kombiName(kombi)}.png` : null,
    messung,
    hinweis,
    konsolenFehler: meldungen.konsole.filter((m) => m.art === 'error').length,
    konsolenWarnungen: meldungen.konsole.filter((m) => m.art === 'warning').length,
    seitenfehler: meldungen.seitenfehler,
    anfragefehler: meldungen.anfragefehler.slice(0, 6),
    konsole: meldungen.konsole.slice(0, 6),
  }
  await context.close()
  return ergebnis
}

function speichern(ordner, bericht) {
  const ziel = join(ordner, 'messwerte.json')
  if (existsSync(ziel)) {
    const bisher = JSON.parse(readFileSync(ziel, 'utf8'))
    const neu = new Set(bericht.ergebnisse.map((e) => `${e.ansicht}|${e.kombination}`))
    bericht = { ...bericht, ergebnisse: [...bisher.ergebnisse.filter((e) => !neu.has(`${e.ansicht}|${e.kombination}`)), ...bericht.ergebnisse] }
  }
  writeFileSync(ziel, JSON.stringify(bericht, null, 2))
}

async function main() {
  const ordner = join(AUS, ETIKETT)
  mkdirSync(ordner, { recursive: true })
  const ansichten = NUR_ANSICHTEN ? NUR_ANSICHTEN.split(',') : ANSICHTEN
  const kombis = KOMBINATIONEN.filter((k) => !NUR_KOMBIS || NUR_KOMBIS.split(',').includes(kombiName(k)))
  const browser = {}
  for (const name of new Set(kombis.map((k) => k.browser))) browser[name] = await BROWSER[name].launch()
  const kopf = { etikett: ETIKETT, commit: COMMIT, basis: BASIS, basisWebkit: BASIS_WEBKIT, jetzt: JETZT, zeitzone: ZEITZONE, reise: REISE.id, erzeugt: new Date().toISOString() }
  let anzahl = 0
  const warteschlange = [...kombis]
  async function arbeiter() {
    for (let kombi = warteschlange.shift(); kombi; kombi = warteschlange.shift()) {
      const ergebnisse = []
      for (const ansicht of ansichten) {
        const eintrag = await ansichtErfassen(browser[kombi.browser], kombi, ansicht, ordner)
        ergebnisse.push(eintrag)
        console.log(`${kombiName(kombi).padEnd(20)} ${ansicht.padEnd(18)} ${eintrag.hinweis ? 'HINWEIS ' + eintrag.hinweis.slice(0, 70) : 'ok'} ` +
          `Kopf=${eintrag.messung?.kopfzeile?.hoehe ?? '-'} Fest=${eintrag.messung?.festeHoeheGesamt ?? '-'} Nutz=${eintrag.messung?.nutzhoehe ?? '-'} Ueberlauf=${eintrag.messung?.ueberlaufX ?? '-'} Kontrast=${eintrag.messung?.kontrast ? (eintrag.messung.kontrast.bestanden ? 'PASS ' : 'FAIL ') + eintrag.messung.kontrast.kleinster : 'OFFEN'} (${eintrag.messung?.kontrast?.einfarbig.geprueft ?? 0}+${eintrag.messung?.kontrast?.bildgrund.gemessen ?? 0}, offen ${eintrag.messung?.kontrast?.nichtGemessen ?? '-'})`)
      }
      anzahl += ergebnisse.length
      speichern(ordner, { ...kopf, ergebnisse })
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, PARALLEL) }, arbeiter))
  for (const typ of Object.values(browser)) await typ.close()
  console.log(`Fertig: ${anzahl} Erfassungen in ${ordner}`)
}

void main()
