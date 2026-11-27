#!/usr/bin/env node
// scripts/premium-redesign-a/auswahl-kontrast.mjs
//
// Zustandsmatrix für alle Filter, Chips, Tabs, Menüs, Theme-Wahl und Siegel im PR-A-Bereich
// (Work-Nachtest 27.11.2026, Kontrast-FAIL «Alle» hell).
//
// Läuft gegen einen echten lokalen Next-Production-Build (Gast-Ansichten) und gegen den Konto-Prüfstand
// (`konto-harness.mjs`: echte Komponenten und echtes Projekt-CSS für Ansichten hinter der Anmeldung; die
// Anmeldung wird nicht umgangen). Kein Produktionszugriff, keine Kundendaten, keine Buchung.
//
//   node scripts/premium-redesign-a/auswahl-kontrast.mjs \
//     --base http://127.0.0.1:3461 [--base-webkit https://127.0.0.1:3462] --konto http://127.0.0.1:3475 \
//     --label vorher --commit <sha> --out /tmp/pra/auswahl --fixtures /tmp/pra/fixtures \
//     [--views a,b] [--combos x,y] [--schrift 100,150,200] [--parallel 3] [--echt] [--ohne-js] [--themawechsel]
//
// Je Element werden gemessen: normal, hover, focus-visible, active, deaktiviert (sichtbar) und – bei Elementen mit
// Auswahlzustand – gewählt/ungewählt (zuerst als reiner Attributzustand: `erzwungen`, dann mit echter Bedienung
// der Gruppe: `echt`, mit `--echt`). Jeder Wert ist der ungerundete Kontrast gegen den tatsächlichen Grund.
// Ein Zustand, der sich nicht herstellen liess, steht als OFFEN. Nichts Ungemessenes ist PASS.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'
import { installieren, urteilen, bandMessen, DREI } from './auswahl-messung.mjs'
import { bildtexteImSichtfeld } from './kontrast.mjs'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[index + 1] : standard
}
const schalter = (name) => process.argv.includes(`--${name}`)

const BASIS = argument('base', 'http://127.0.0.1:3461')
const BASIS_WEBKIT = argument('base-webkit', BASIS)
const KONTO = argument('konto', '')
const ETIKETT = argument('label', 'vorher')
const COMMIT = argument('commit', 'unbekannt')
const AUS = argument('out', '/tmp/pra/auswahl')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures')
const NUR_ANSICHTEN = argument('views', '')
const NUR_KOMBIS = argument('combos', '')
const SCHRIFTEN = argument('schrift', '100').split(',').map(Number)
const PARALLEL = Number(argument('parallel', '3'))
const ECHT = schalter('echt')
const OHNE_JS = schalter('ohne-js')
const THEMAWECHSEL = schalter('themawechsel')
const JE_SIGNATUR = Number(argument('je-signatur', '2'))
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
    for (const thema of THEMEN) {
      for (const schrift of SCHRIFTEN) KOMBINATIONEN.push({ browser, breite, thema, schrift })
    }
  }
}

/* Ansichten: `quelle` = echter Build (gast) oder Konto-Prüfstand (konto). */
const ANSICHTEN = [
  { id: 'startseite', quelle: 'gast', mitReise: false },
  { id: 'entdecken', quelle: 'gast', mitReise: false },
  { id: 'planen', quelle: 'gast', mitReise: false },
  { id: 'reisen-gast', quelle: 'gast', mitReise: true },
  { id: 'uebersicht', quelle: 'gast', mitReise: true },
  { id: 'reiseplan', quelle: 'gast', mitReise: true },
  { id: 'organisieren', quelle: 'gast', mitReise: true },
  { id: 'vorbereitung', quelle: 'gast', mitReise: true },
  { id: 'einreise', quelle: 'gast', mitReise: true },
  { id: 'menue', quelle: 'gast', mitReise: true },
  { id: 'profil', quelle: 'gast', mitReise: true },
  { id: 'menue-startseite', quelle: 'gast', mitReise: false },
  { id: 'sammlung', quelle: 'konto', mitReise: false },
  { id: 'konto', quelle: 'konto', mitReise: false },
  { id: 'konto-reise', quelle: 'konto', mitReise: false },
  { id: 'begleiter', quelle: 'konto', mitReise: false },
  { id: 'merkliste', quelle: 'konto', mitReise: false },
  { id: 'einstellungen', quelle: 'konto', mitReise: false },
]

function kombiName({ browser, breite, thema, schrift }) {
  return `${browser}-${breite.name}-${thema}${schrift === 100 ? '' : `-s${schrift}`}`
}

async function kontext(browserTyp, kombi, optionen) {
  const { breite, thema, schrift } = kombi
  const context = await browserTyp.newContext({
    viewport: { width: breite.width, height: breite.height },
    deviceScaleFactor: 1,
    isMobile: breite.telefon,
    hasTouch: breite.telefon,
    locale: 'de-CH',
    timezoneId: ZEITZONE,
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(
    ({ schluessel, wert, themaSchluessel, thema: wunsch, mitReise, wechsel }) => {
      try {
        if (mitReise) localStorage.setItem(schluessel, wert)
        if (wunsch === 'dark' || wechsel) localStorage.setItem(themaSchluessel, wechsel ? (wunsch === 'dark' ? 'light' : 'dark') : 'dark')
      } catch {
        /* blockierter Speicher */
      }
    },
    { schluessel: REISE.schluessel, wert: REISE.roh, themaSchluessel: THEMA_SCHLUESSEL, thema, mitReise: optionen.mitReise, wechsel: THEMAWECHSEL },
  )
  if (schrift !== 100) {
    await context.addInitScript((prozent) => {
      const setzen = () => {
        const stil = document.createElement('style')
        stil.textContent = `html { font-size: ${prozent}% !important; }`
        document.head.append(stil)
      }
      if (document.head) setzen()
      else document.addEventListener('DOMContentLoaded', setzen, { once: true })
    }, schrift)
  }
  return context
}

async function warten(seite, ms = 700) {
  await seite.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await seite.evaluate(() => document.fonts?.ready).catch(() => undefined)
  await seite.waitForTimeout(ms)
}

async function tabOeffnen(seite, muster) {
  const knoepfe = seite.locator('.workspace-bottom-nav button, [data-workspace-mode-nav="sidebar"] button, .workspace-sidebar button').filter({ hasText: muster })
  await knoepfe.first().waitFor({ state: 'attached', timeout: 10_000 })
  for (const kandidat of await knoepfe.all()) {
    if (await kandidat.isVisible()) {
      await kandidat.click()
      await seite.waitForTimeout(900)
      await seite.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      return true
    }
  }
  return false
}

async function menueOeffnen(seite, telefon) {
  if (telefon) {
    await seite.locator('button[aria-controls="workspace-navigation"]').first().click()
    await seite.waitForTimeout(500)
    return true
  }
  const box = await seite.locator('.workspace-sidebar').first().boundingBox()
  if (!box) return false
  await seite.mouse.move(box.x + 30, box.y + 60)
  await seite.waitForTimeout(500)
  return true
}

const THEMA_BEZEICHNUNG = { light: /^Hell\b/, dark: /^Dunkel\b/ }
const OHNE_THEMAWECHSEL = new Set(['startseite', 'entdecken', 'planen', 'menue', 'profil', 'menue-startseite', 'begleiter'])

/**
 * Themawechsel (`--themawechsel`): Die Seite startet im anderen Theme und wechselt über die echte Darstellungswahl
 * (Menü bzw. Konto-Einstellungen) in das Ziel-Theme; gemessen wird erst nach dem Wechsel. Öffentliche Seiten haben
 * keine Wahl (ADR zu Geltung von Hell und Dunkel) und werden nicht umgeschaltet.
 */
async function themaWechseln(seite, ansicht, kombi) {
  const ziel = kombi.thema
  const bereich = ansicht.id === 'einstellungen' ? seite.locator('.workspace-content') : seite
  const knopf = () => bereich.getByRole('button', { name: THEMA_BEZEICHNUNG[ziel] }).filter({ visible: true })
  if (ansicht.id !== 'einstellungen') {
    if (kombi.breite.telefon) await seite.locator('button[aria-controls="workspace-navigation"]').first().click()
    else {
      const box = await seite.locator('.workspace-sidebar').first().boundingBox()
      if (box) await seite.mouse.move(box.x + 30, box.y + 60)
    }
    await seite.waitForTimeout(500)
  }
  if (!(await knopf().count())) return `Darstellungswahl «${ziel}» nicht gefunden`
  await knopf().first().click()
  await seite.waitForTimeout(500)
  if (ansicht.id !== 'einstellungen') {
    if (kombi.breite.telefon) await seite.keyboard.press('Escape')
    else await seite.mouse.move(1, 1)
    await seite.waitForTimeout(500)
  }
  const stand = await seite.evaluate(() => document.querySelector('.workspace-shell')?.getAttribute('data-workspace-theme') ?? document.documentElement.getAttribute('data-workspace-theme'))
  return stand === ziel ? null : `Themawechsel nicht wirksam (Stand «${stand}», erwartet «${ziel}»)`
}

/** Öffnet die Ansicht. Gibt den Wurzelselektor zurück, auf den sich das Inventar beschränkt (Überlagerungen). */
async function ansichtHerstellen(seite, ansicht, kombi) {
  const basis = kombi.browser === 'webkit' ? BASIS_WEBKIT : BASIS
  const telefon = kombi.breite.telefon
  const gehen = async (url, selektor = 'h1') => {
    await seite.goto(url, { waitUntil: 'domcontentloaded' })
    if (!OHNE_JS && selektor) await seite.waitForSelector(selektor, { timeout: 20_000 })
    await warten(seite, OHNE_JS ? 400 : 1000)
  }
  let wurzel = ''
  switch (ansicht.id) {
    case 'startseite':
      await gehen(`${basis}/`, 'h1')
      break
    case 'entdecken':
      await gehen(`${basis}/entdecken`, 'h1')
      break
    case 'planen':
      await gehen(`${basis}/planen`, 'h1, form, main')
      break
    case 'reisen-gast':
      await gehen(`${basis}/reisen`, 'h1')
      break
    case 'uebersicht':
    case 'reiseplan':
    case 'organisieren':
    case 'vorbereitung':
    case 'einreise': {
      await gehen(`${basis}/reisen/${REISE.id}`, 'h1')
      if (!OHNE_JS) {
        const muster = { reiseplan: /^\s*Reiseplan/, organisieren: /^\s*Organisieren/, vorbereitung: /^\s*Vorbereitung/, einreise: /^\s*Einreise/ }[ansicht.id]
        if (muster) await tabOeffnen(seite, muster)
      }
      break
    }
    case 'menue':
      await gehen(`${basis}/reisen/${REISE.id}`, 'h1')
      if (!OHNE_JS) {
        await menueOeffnen(seite, telefon)
        wurzel = telefon ? '#workspace-navigation' : '.workspace-sidebar'
      }
      break
    case 'profil':
      await gehen(`${basis}/reisen/${REISE.id}`, 'h1')
      if (!OHNE_JS) {
        await seite.locator('summary[aria-label="Kontomenü"]').first().click()
        await seite.waitForTimeout(400)
        wurzel = 'details[open]'
      }
      break
    case 'menue-startseite': {
      await gehen(`${basis}/`, 'h1')
      const knopf = seite.locator('button[aria-controls="oeffentliche-mobile-navigation"]').first()
      if (await knopf.isVisible().catch(() => false)) {
        await knopf.click()
        await seite.waitForTimeout(500)
        wurzel = '#oeffentliche-mobile-navigation'
      }
      break
    }
    case 'sammlung':
      if (!KONTO) return { offen: 'kein Konto-Prüfstand angegeben (--konto); die Route braucht eine Anmeldung und wird nicht umgangen' }
      await gehen(`${KONTO}/reisen`, '[data-sammlung-archiv]')
      break
    case 'konto':
      if (!KONTO) return { offen: 'kein Konto-Prüfstand angegeben (--konto)' }
      await gehen(`${KONTO}/account`, 'h1')
      break
    case 'konto-reise':
    case 'begleiter':
      if (!KONTO) return { offen: 'kein Konto-Prüfstand angegeben (--konto)' }
      await gehen(`${KONTO}/reisen/konto`, '.reisekopf h1, h1')
      if (ansicht.id === 'begleiter' && !OHNE_JS) {
        await seite.locator('button.kopf-begleiter').first().click()
        await seite.waitForTimeout(700)
        wurzel = '#reisebegleiter'
      }
      break
    case 'merkliste':
      if (!KONTO) return { offen: 'kein Konto-Prüfstand angegeben (--konto)' }
      await gehen(`${KONTO}/account/merkliste`, 'h1')
      break
    case 'einstellungen':
      if (!KONTO) return { offen: 'kein Konto-Prüfstand angegeben (--konto)' }
      await gehen(`${KONTO}/account/settings`, 'h1')
      break
    default:
      return { offen: `unbekannte Ansicht ${ansicht.id}` }
  }
  return { wurzel }
}

function rgbAus(text) {
  const t = text.match(/rgb\(([\d.]+) ([\d.]+) ([\d.]+)\)/)
  return t ? { r: Number(t[1]), g: Number(t[2]), b: Number(t[3]), a: 1 } : null
}
function leuchtdichte({ r, g, b }) {
  const l = [r, g, b].map((k) => {
    const v = k / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
}
function verhaeltnis(a, b) {
  const la = leuchtdichte(a)
  const lb = leuchtdichte(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
const gerundet = (zahl) => (typeof zahl === 'number' ? Math.round(zahl * 10000) / 10000 : zahl)

async function zustandHerstellen(seite, element, interaktion) {
  await seite.mouse.move(1, 1)
  await seite.evaluate(() => document.activeElement && document.activeElement !== document.body && document.activeElement.blur())
  // Jedes Element wird zuerst ins Sichtfeld geholt: Pixelmessungen auf Bild gelten nur für sichtbare Pixel.
  const mitte = await seite.evaluate((i) => window.__pra.mitte(i), element.i)
  if (interaktion === 'normal') {
    await seite.waitForTimeout(40)
    await seite.evaluate(() => window.__pra.abwarten())
    return { erreichbar: true }
  }
  if (!mitte) return { erreichbar: false, grund: 'Element nicht mehr vorhanden' }
  if (interaktion === 'fokus') {
    // WebKit setzt :focus-visible nach einer Zeigerbedienung bei scriptgesteuertem focus() nicht; focusVisible stellt den
    // Tastaturfokus her, den eine Person mit Tab erreicht.
    await seite.keyboard.press('Shift')
    await seite.evaluate((i) => window.__pra.element(i)?.focus({ preventScroll: true, focusVisible: true }), element.i)
  } else {
    if (!mitte.erreichbar) return { erreichbar: false, grund: 'Element liegt unter einem anderen Element und ist nicht zeigbar' }
    // Eine Seitenleiste, die beim Zeigen aufklappt, verschiebt das Element: Position neu bestimmen, bis :hover trifft.
    let hergestellt = false
    for (let versuch = 0; versuch < 4 && !hergestellt; versuch += 1) {
      const ziel = versuch === 0 ? mitte : await seite.evaluate((i) => window.__pra.mitte(i), element.i)
      if (!ziel) break
      await seite.mouse.move(ziel.x, ziel.y)
      await seite.waitForTimeout(180)
      await seite.evaluate(() => window.__pra.abwarten())
      hergestellt = await seite.evaluate((i) => Boolean(window.__pra.element(i)?.matches(':hover')), element.i)
      if (!hergestellt && process.env.PRA_DIAG) {
        console.error('DIAG hover', element.i, JSON.stringify(await seite.evaluate(([i, x, y]) => { const e = window.__pra.element(i); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(x, y); return { x, y, rect: [r.x, r.y, r.width, r.height], top: t ? t.tagName + '.' + t.className : null, sameTop: t === e || e.contains(t), sy: scrollY } }, [element.i, ziel.x, ziel.y])))
      }
    }
    if (interaktion === 'aktiv') {
      let gedrueckt = false
      for (let versuch = 0; versuch < 4 && !gedrueckt; versuch += 1) {
        if (versuch > 0) {
          await seite.mouse.up()
          const ziel = await seite.evaluate((i) => window.__pra.mitte(i), element.i)
          if (!ziel) break
          await seite.mouse.move(ziel.x, ziel.y)
          await seite.waitForTimeout(220)
        }
        await seite.mouse.down()
        await seite.waitForTimeout(60)
        gedrueckt = await seite.evaluate((i) => Boolean(window.__pra.element(i)?.matches(':active')), element.i)
      }
    }
  }
  await seite.waitForTimeout(60)
  await seite.evaluate(() => window.__pra.abwarten())
  return { erreichbar: true }
}

let markenZaehler = 0

/** Misst ein Element in einem Zustand; Pixelmessungen für Text, Ring und Feldgrenze auf Bild oder Verlauf inklusive. */
async function messenImZustand(seite, element, interaktion, flaecheNormal) {
  const stand = await zustandHerstellen(seite, element, interaktion)
  if (!stand.erreichbar && interaktion !== 'normal') return { stand, messung: null, pixel: null }
  markenZaehler += 1
  await seite.evaluate((i) => window.__pra.deckkraftAbwarten(i), element.i)
  const messung = await seite.evaluate(
    ({ i, fokus, vorher, basis }) => window.__pra.messen(i, { fokus, vorher, markenBasis: basis }),
    { i: element.i, fokus: interaktion === 'fokus', vorher: flaecheNormal ? { flaeche: flaecheNormal } : null, basis: markenZaehler * 1000 },
  )
  const pixel = {}
  if (messung.fehlt) return { stand, messung, pixel }
  if (messung.bildgrund) {
    const marken = await seite.evaluate(() => window.__pra.marken())
    pixel.text = marken.length ? await bildtexteImSichtfeld(seite, marken) : []
    await seite.evaluate(() => window.__pra.markenEntfernen())
  }
  const indikator = messung.fokus?.indikator
  if (interaktion === 'fokus' && messung.treffer.fokusSichtbar && indikator) {
    const innen = indikator.band[1] <= 0
    if (innen ? messung.eigenerBildgrund : messung.umgebungBild || messung.eigenerBildgrund) {
      pixel.fokus = await bandMessen(seite, {
        rechteck: messung.rechteck,
        von: indikator.band[0],
        bis: indikator.band[1],
        farben: indikator.teile.map((teil) => rgbAus(teil.farbe)),
        ausblenden: `[data-pra-i="${element.i}"] { outline-color: transparent !important; box-shadow: none !important; }`,
      })
      if (!pixel.fokus) pixel.fokusOffen = 'Fokusindikator auf Bild/Verlauf: Band ausserhalb des Sichtfelds'
    }
  }
  if (element.feld && (messung.huelle ? messung.huelle.umgebungBild : messung.umgebungBild)) {
    const rechteck = messung.huelle?.rechteck ?? messung.rechteck
    const gegen = [messung.grenze.fuellungsFarbe, messung.grenze.rahmenFarbe].filter(Boolean)
    const ergebnisse = []
    for (const farbe of gegen) {
      const wert = await bandMessen(seite, { rechteck, von: 0.5, bis: 4, farben: [{ ...farbe }] })
      if (wert) ergebnisse.push(wert)
    }
    if (ergebnisse.length) pixel.grenze = ergebnisse.sort((p, q) => q.p10 - p.p10)[0]
    else pixel.grenzeOffen = 'Feldgrenze auf Bild/Verlauf: Umgebung ausserhalb des Sichtfelds'
  }
  return { stand, messung, pixel }
}

function eintragBauen({ ansichtId, kombiname, modus, element, auswahl, zustandName, stand, messung, pixel, interaktion }) {
  const eintrag = { ansicht: ansichtId, kombination: kombiname, modus, element: element.beschreibung, art: element.art, tag: element.tag, auswahl, zustand: zustandName }
  if (!messung || messung.fehlt || (!stand.erreichbar && interaktion !== 'normal')) {
    return Object.assign(eintrag, { urteil: 'OFFEN', gruende: [], offen: [stand.grund ?? 'Zustand nicht herstellbar'] })
  }
  const u = urteilen(messung, { interaktion, feld: element.feld, pixel })
  const pixelKontrast = pixel?.text?.map((t) => t.p01).filter((w) => typeof w === 'number') ?? []
  const werte = [messung.kleinster ? messung.kleinster.verhaeltnis : null, ...pixelKontrast].filter((w) => typeof w === 'number')
  Object.assign(eintrag, {
    urteil: u.urteil,
    gruende: u.gruende,
    offen: u.offen,
    kontrast: werte.length ? gerundet(Math.min(...werte)) : messung.symbol && !messung.bildgrund ? gerundet(messung.symbol.verhaeltnis) : null,
    messart: messung.bildgrund ? 'text-pixel' : messung.anzahlTexte ? 'text' : messung.symbol ? 'symbol' : 'keine',
    text: messung.kleinster
      ? { text: messung.kleinster.text, vordergrund: messung.kleinster.vordergrund, grund: messung.kleinster.grund, groesse: messung.kleinster.groesse }
      : pixel?.text?.[0] ? { text: pixel.text[0].text, pixel: pixel.text[0] } : null,
    farbeRoh: { color: messung.textfarbeRoh, backgroundColor: messung.grundRoh },
    flaeche: messung.flaeche,
    grenze: { rahmen: gerundet(messung.grenze.rahmen), fuellung: gerundet(messung.grenze.fuellung), huelle: messung.huelle?.beschreibung ?? null, pixel: pixel?.grenze ? { p10: gerundet(pixel.grenze.p10), schlechtester: gerundet(pixel.grenze.schlechtester) } : null },
    ziel: messung.ziel,
    bildgrund: Boolean(messung.bildgrund),
  })
  if (messung.fokus) {
    eintrag.fokus = {
      indikator: messung.fokus.indikator ? { ...messung.fokus.indikator, verhaeltnis: gerundet(messung.fokus.indikator.verhaeltnis) } : null,
      flaechenwechsel: gerundet(messung.fokus.flaechenwechsel),
      pixel: pixel?.fokus ? { p10: gerundet(pixel.fokus.p10), schlechtester: gerundet(pixel.fokus.schlechtester) } : null,
    }
  }
  return eintrag
}

const ZUSTANDSNAME = (element, interaktion) => (element.deaktiviert ? 'deaktiviert' : interaktion === 'fokus' ? 'focus-visible' : interaktion === 'aktiv' ? 'active' : interaktion)

function auswahlProfil(messung) {
  return { flaeche: messung.flaeche, form: messung.formMerkmale, text: messung.kleinster?.vordergrund ?? null, kontrast: messung.kleinster?.verhaeltnis ?? null }
}

/** Vergleicht zwei Profile (gewählt/ungewählt): unterscheiden sie sich nicht nur durch Farbe? */
function auswahlVergleich(a, b) {
  const unterschiede = Object.keys(a.form).filter((schluessel) => schluessel !== 'breite' && a.form[schluessel] !== b.form[schluessel])
  const breitenDelta = Math.abs(a.form.breite - b.form.breite)
  const flaecheA = rgbAus(a.flaeche)
  const flaecheB = rgbAus(b.flaeche)
  const luminanz = flaecheA && flaecheB ? verhaeltnis(flaecheA, flaecheB) : null
  const nichtNurFarbe = unterschiede.length > 0 || breitenDelta >= 4 || (luminanz !== null && luminanz >= DREI)
  const wirkungslos = a.flaeche === b.flaeche && a.text === b.text && unterschiede.length === 0
  return { unterschiede, breitenDelta, luminanz, nichtNurFarbe, wirkungslos }
}

const GEWAEHLT = (wert) => wert === 'true' || wert === 'page' || wert === 'step' || wert === 'location' || wert === 'date' || wert === 'time'

/**
 * Messung eines Elements. Zustände: normal (so, wie die App es zeigt), hover, focus-visible, active; bei Elementen mit
 * Auswahlzustand zusätzlich der erzwungene Gegenzustand (nur das Attribut wird umgesetzt, die App-Logik bleibt unberührt).
 */
async function elementMessen(seite, element, ansichtId, kombiname, modus, sammler, profile) {
  const interaktionen = element.deaktiviert || element.art === 'siegel' ? ['normal'] : ['normal', 'hover', 'fokus', 'aktiv']
  const umschalter = element.toggle && element.toggle !== 'aria-expanded' && element.art === 'steuerelement' && !element.deaktiviert
  const istGewaehlt = GEWAEHLT(element.toggleWert)
  const durchlaeufe = [{ name: element.toggle ? `ist: ${element.toggle}=${element.toggleWert}` : null, art: 'ist' }]
  if (umschalter) {
    const gegen = istGewaehlt ? (element.toggle === 'aria-current' ? null : 'false') : element.toggle === 'aria-current' ? 'page' : 'true'
    durchlaeufe.push({ name: `erzwungen: ${element.toggle}=${gegen ?? '(entfernt)'}`, art: 'gegenteil', attribut: gegen })
  }
  const proAuswahl = {}
  for (const durchlauf of durchlaeufe) {
    if (durchlauf.art === 'gegenteil') await seite.evaluate(({ i, name, wert }) => window.__pra.setzeAuswahl(i, name, wert), { i: element.i, name: element.toggle, wert: durchlauf.attribut })
    let flaecheNormal = null
    for (const interaktion of durchlauf.art === 'gegenteil' ? ['normal', 'hover', 'fokus'] : interaktionen) {
      const { stand, messung, pixel } = await messenImZustand(seite, element, interaktion, flaecheNormal)
      if (interaktion === 'aktiv') await seite.mouse.up().catch(() => undefined)
      await seite.mouse.move(1, 1)
      if (messung && !messung.fehlt && interaktion === 'normal') {
        flaecheNormal = rgbAus(messung.flaeche)
        proAuswahl[durchlauf.art] = auswahlProfil(messung)
      }
      sammler.push(eintragBauen({ ansichtId, kombiname, modus: durchlauf.art === 'ist' ? 'ist' : modus, element, auswahl: durchlauf.name, zustandName: ZUSTANDSNAME(element, interaktion), stand, messung, pixel, interaktion }))
    }
    if (durchlauf.art === 'gegenteil') await seite.evaluate(({ i, name }) => window.__pra.stelleHer(i, name), { i: element.i, name: element.toggle })
  }
  if (element.toggle) profile.push({ gruppe: element.gruppe, toggle: element.toggle, wert: element.toggleWert, tag: element.tag, beschreibung: element.beschreibung, profil: proAuswahl.ist ?? null, gegenteil: proAuswahl.gegenteil ?? null, gewaehlt: istGewaehlt })
  else profile.push({ gruppe: element.gruppe, toggle: null, tag: element.tag, beschreibung: element.beschreibung, profil: proAuswahl.ist ?? null, gewaehlt: false })
  if (proAuswahl.ist && proAuswahl.gegenteil) {
    const a = istGewaehlt ? proAuswahl.ist : proAuswahl.gegenteil
    const b = istGewaehlt ? proAuswahl.gegenteil : proAuswahl.ist
    const v = auswahlVergleich(a, b)
    sammler.push({
      ansicht: ansichtId,
      kombination: kombiname,
      modus,
      element: element.beschreibung,
      art: 'auswahlanzeige',
      auswahl: element.toggle,
      zustand: 'gewaehlt-vs-ungewaehlt',
      urteil: v.wirkungslos ? 'OFFEN' : v.nichtNurFarbe ? 'PASS' : 'FAIL',
      gruende: !v.wirkungslos && !v.nichtNurFarbe ? [`Auswahl nur durch Farbe: Flächen ${v.luminanz?.toFixed(2)}:1 < 3:1, keine Formänderung`] : [],
      offen: v.wirkungslos ? ['Das Attribut allein ändert die Darstellung nicht (Darstellung hängt an Klassen/Zustand der App): Vergleich innerhalb der Gruppe bzw. Modus «echt»'] : [],
      auswahlanzeige: { formUnterschiede: v.unterschiede, breitenDelta: v.breitenDelta, flaechenLuminanz: v.luminanz ? gerundet(v.luminanz) : null, gewaehlt: a, ungewaehlt: b },
      wirkungslos: v.wirkungslos,
      gruppe: element.gruppe,
    })
  }
}

/** Auswahlanzeige innerhalb einer echten Gruppe: das gewählte Mitglied gegen ein ungewähltes, so wie die App sie zeigt. */
function gruppenUrteile(profile, ansichtId, kombiname, modus) {
  const nachGruppe = new Map()
  for (const p of profile) {
    if (!p.gruppe || !p.profil) continue
    if (!nachGruppe.has(p.gruppe)) nachGruppe.set(p.gruppe, [])
    nachGruppe.get(p.gruppe).push(p)
  }
  const ergebnis = []
  for (const [gruppe, mitglieder] of nachGruppe) {
    const gewaehlt = mitglieder.filter((m) => m.toggle && m.toggle !== 'aria-expanded' && m.gewaehlt)
    for (const g of gewaehlt) {
      const andere = mitglieder.find((m) => !m.gewaehlt && m.tag === g.tag && (m.toggle === g.toggle || (!m.toggle && g.toggle === 'aria-current')))
      if (!andere) continue
      const v = auswahlVergleich(g.profil, andere.profil)
      ergebnis.push({
        ansicht: ansichtId,
        kombination: kombiname,
        modus: 'gruppe',
        element: g.beschreibung,
        art: 'auswahlanzeige',
        auswahl: g.toggle,
        zustand: 'gewaehlt-vs-ungewaehlt (Gruppe)',
        urteil: v.wirkungslos ? 'FAIL' : v.nichtNurFarbe ? 'PASS' : 'FAIL',
        gruende: v.wirkungslos ? ['Das gewählte Mitglied sieht aus wie ein ungewähltes: Auswahl ist nicht erkennbar'] : !v.nichtNurFarbe ? [`Auswahl nur durch Farbe: Flächen ${v.luminanz?.toFixed(2)}:1 < 3:1, keine Formänderung`] : [],
        offen: [],
        auswahlanzeige: { vergleichMit: andere.beschreibung, formUnterschiede: v.unterschiede, breitenDelta: v.breitenDelta, flaechenLuminanz: v.luminanz ? gerundet(v.luminanz) : null },
        gruppe,
      })
    }
  }
  return ergebnis
}

/** Echte Bedienung: jedes Mitglied einer Auswahlgruppe wird angeklickt und die Gruppe danach gemessen (alle Zustände). */
async function echteAuswahl(seite, ansichtId, kombiname, sammler, grenze = 30) {
  const gruppen = await seite.evaluate(() => {
    const TOGGLE = ['aria-pressed', 'aria-selected', 'aria-checked']
    const karte = new Map()
    for (const element of document.querySelectorAll('[aria-pressed], [aria-selected], [aria-checked]')) {
      if (!window.__pra.sichtbar(element) || element.closest('[inert], [aria-hidden="true"], svg')) continue
      if (['TD', 'LI'].includes(element.tagName) && element.getAttribute('role') !== 'tab') continue
      const r = element.getBoundingClientRect()
      if (r.right <= 0 || r.left >= innerWidth) continue
      const name = TOGGLE.find((n) => element.hasAttribute(n))
      const eltern = element.parentElement
      if (!eltern) continue
      if (!eltern.hasAttribute('data-pra-eg')) eltern.setAttribute('data-pra-eg', String(karte.size + 1))
      const schluessel = eltern.getAttribute('data-pra-eg')
      const eintrag = karte.get(schluessel) ?? { g: schluessel, name, mitglieder: [] }
      if (!element.hasAttribute('data-pra-e')) element.setAttribute('data-pra-e', `${schluessel}-${eintrag.mitglieder.length}`)
      eintrag.mitglieder.push(element.getAttribute('data-pra-e'))
      karte.set(schluessel, eintrag)
    }
    return [...karte.values()].filter((g) => g.mitglieder.length >= 2)
  })
  let klicks = 0
  for (const gruppe of gruppen) {
    for (const mitglied of gruppe.mitglieder) {
      if (klicks >= grenze) return klicks
      const vorher = await seite.evaluate(() => location.pathname + location.search)
      const gefunden = await seite.evaluate((m) => {
        const element = document.querySelector(`[data-pra-e="${m}"]`)
        if (!element) return false
        element.scrollIntoView({ block: 'center', behavior: 'instant' })
        return true
      }, mitglied).catch(() => false)
      if (!gefunden) continue
      const box = await seite.locator(`[data-pra-e="${mitglied}"]`).first().boundingBox().catch(() => null)
      if (!box) continue
      await seite.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => undefined)
      klicks += 1
      await seite.waitForTimeout(500)
      const nachher = await seite.evaluate(() => location.pathname + location.search)
      if (nachher !== vorher) {
        sammler.push({ ansicht: ansichtId, kombination: kombiname, modus: 'echt', element: `Gruppe ${gruppe.g}`, art: 'hinweis', auswahl: null, zustand: 'navigation', urteil: 'OFFEN', gruende: [], offen: [`Klick auf ein Gruppenmitglied wechselt die Seite (${vorher} → ${nachher}); Gruppe nicht weiter bedient`] })
        await seite.goBack().catch(() => undefined)
        await warten(seite, 600)
        break
      }
      await seite.evaluate(installieren).catch(() => undefined)
      const profile = []
      for (const m of gruppe.mitglieder) {
        const info = await seite.evaluate((id) => {
          const element = document.querySelector(`[data-pra-e="${id}"]`)
          if (!element) return null
          if (!element.hasAttribute('data-pra-i')) {
            const zaehler = Number(document.body.getAttribute('data-pra-zaehler') ?? 0) + 1
            element.setAttribute('data-pra-i', String(zaehler))
            document.body.setAttribute('data-pra-zaehler', String(zaehler))
          }
          const name = ['aria-pressed', 'aria-selected', 'aria-checked'].find((n) => element.hasAttribute(n))
          return { i: Number(element.getAttribute('data-pra-i')), beschreibung: window.__pra.beschreibung(element), tag: element.tagName.toLowerCase(), toggle: name, wert: element.getAttribute(name), gruppe: String(id.split('-')[0]) }
        }, m)
        if (!info) continue
        const elementInfo = { i: info.i, beschreibung: info.beschreibung, art: 'steuerelement', tag: info.tag, toggle: info.toggle, toggleWert: info.wert, deaktiviert: false, feld: false }
        const gewaehlt = GEWAEHLT(info.wert)
        let flaecheNormal = null
        for (const interaktion of gewaehlt ? ['normal', 'hover', 'fokus', 'aktiv'] : ['normal', 'hover', 'fokus']) {
          const { stand, messung, pixel } = await messenImZustand(seite, elementInfo, interaktion, flaecheNormal)
          if (interaktion === 'aktiv') await seite.mouse.up().catch(() => undefined)
          await seite.mouse.move(1, 1)
          if (messung && !messung.fehlt && interaktion === 'normal') {
            flaecheNormal = rgbAus(messung.flaeche)
            profile.push({ gruppe: info.gruppe, toggle: info.toggle, tag: info.tag, beschreibung: info.beschreibung, profil: auswahlProfil(messung), gewaehlt })
          }
          sammler.push(eintragBauen({ ansichtId, kombiname, modus: 'echt', element: elementInfo, auswahl: `${gewaehlt ? 'gewaehlt' : 'ungewaehlt'} (echt, nach Klick auf «${gruppe.mitglieder.indexOf(mitglied) + 1}. Mitglied»)`, zustandName: ZUSTANDSNAME(elementInfo, interaktion), stand, messung, pixel, interaktion }))
        }
      }
      sammler.push(...gruppenUrteile(profile, ansichtId, kombiname, 'echt').map((e) => ({ ...e, modus: 'echt' })))
    }
  }
  return klicks
}

async function ansichtMessen(browserTyp, kombi, ansicht) {
  const context = await kontext(browserTyp, kombi, { mitReise: ansicht.mitReise })
  const seite = await context.newPage()
  if (OHNE_JS && ansicht.quelle === 'gast') await seite.route('**/_next/static/chunks/**/*.js', (route) => route.abort())
  await seite.clock.setFixedTime(new Date(JETZT))
  const kombiname = kombiName(kombi)
  const eintraege = []
  let hinweis = null
  try {
    const stand = await ansichtHerstellen(seite, ansicht, kombi)
    let wechselProblem = null
    if (THEMAWECHSEL && !stand.offen) {
      wechselProblem = OHNE_THEMAWECHSEL.has(ansicht.id)
        ? 'kein Themawechsel möglich (öffentliche Seiten und Überlagerungen haben keine Darstellungswahl)'
        : await themaWechseln(seite, ansicht, kombi)
    }
    if (stand.offen) {
      hinweis = `OFFEN: ${stand.offen}`
    } else if (wechselProblem) {
      // Der Wechsel gelang nicht oder ist nicht möglich: nichts messen, ein Wert im falschen Theme wäre kein Beleg.
      hinweis = `OFFEN: ${wechselProblem}`
    } else {
      if (OHNE_JS && ansicht.quelle === 'konto') {
        await seite.evaluate(() => {
          document.documentElement.setAttribute('data-workspace-theme', document.documentElement.getAttribute('data-workspace-theme') ?? 'light')
          document.querySelector('.workspace-shell')?.setAttribute('data-workspace-theme', 'light')
        })
      }
      await seite.evaluate(installieren)
      await seite.evaluate(() => {
        window.addEventListener('click', (ereignis) => { ereignis.preventDefault(); ereignis.stopImmediatePropagation() }, true)
        window.addEventListener('submit', (ereignis) => { ereignis.preventDefault(); ereignis.stopImmediatePropagation() }, true)
      })
      const inventar = await seite.evaluate(({ wurzel, grenze }) => window.__pra.inventar(wurzel, grenze), { wurzel: stand.wurzel, grenze: JE_SIGNATUR })
      const profile = []
      for (const element of inventar) await elementMessen(seite, element, ansicht.id, kombiname, 'erzwungen', eintraege, profile)
      const gruppenErgebnis = gruppenUrteile(profile, ansicht.id, kombiname, 'gruppe')
      const mitGruppenurteil = new Set(gruppenErgebnis.map((e) => e.gruppe))
      for (let k = eintraege.length - 1; k >= 0; k -= 1) if (eintraege[k].wirkungslos && mitGruppenurteil.has(eintraege[k].gruppe)) eintraege.splice(k, 1)
      eintraege.push(...gruppenErgebnis)
      if (ECHT && !OHNE_JS) {
        await seite.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
        await ansichtHerstellen(seite, ansicht, kombi)
        await seite.evaluate(installieren)
        await echteAuswahl(seite, ansicht.id, kombiname, eintraege)
      }
    }
  } catch (fehler) {
    hinweis = `Fehler bei der Erfassung: ${String(fehler).slice(0, 240)}`
  }
  await context.close()
  return { ansicht: ansicht.id, kombination: kombiname, hinweis, eintraege }
}

function zusammenfassen(ergebnisse) {
  const alle = ergebnisse.flatMap((e) => e.eintraege)
  const zaehlen = (urteil) => alle.filter((e) => e.urteil === urteil).length
  const verfehlt = alle.filter((e) => e.urteil === 'FAIL')
  return {
    messungen: alle.length,
    pass: zaehlen('PASS'),
    fail: zaehlen('FAIL'),
    offen: zaehlen('OFFEN'),
    ansichtenOhneMessung: ergebnisse.filter((e) => e.hinweis).map((e) => ({ ansicht: e.ansicht, kombination: e.kombination, hinweis: e.hinweis })),
    kleinsterTextkontrast: alle.filter((e) => e.messart === 'text' && typeof e.kontrast === 'number').reduce((m, e) => Math.min(m, e.kontrast), Infinity),
    verfehlteElemente: [...new Set(verfehlt.map((e) => `${e.ansicht} | ${e.element} | ${e.auswahl ?? '-'} | ${e.zustand}`))].slice(0, 80),
  }
}

async function main() {
  const ordner = join(AUS, ETIKETT)
  mkdirSync(ordner, { recursive: true })
  const ansichten = ANSICHTEN.filter((a) => !NUR_ANSICHTEN || NUR_ANSICHTEN.split(',').includes(a.id))
  const kombis = KOMBINATIONEN.filter((k) => !NUR_KOMBIS || NUR_KOMBIS.split(',').includes(kombiName(k)))
  const browser = {}
  for (const name of new Set(kombis.map((k) => k.browser))) browser[name] = await BROWSER[name].launch()
  const aufgaben = kombis.flatMap((kombi) => ansichten.map((ansicht) => ({ kombi, ansicht })))
  const ergebnisse = []
  async function arbeiter() {
    for (let aufgabe = aufgaben.shift(); aufgabe; aufgabe = aufgaben.shift()) {
      const ergebnis = await ansichtMessen(browser[aufgabe.kombi.browser], aufgabe.kombi, aufgabe.ansicht)
      ergebnisse.push(ergebnis)
      const fail = ergebnis.eintraege.filter((e) => e.urteil === 'FAIL').length
      const offen = ergebnis.eintraege.filter((e) => e.urteil === 'OFFEN').length
      console.log(`${ergebnis.kombination.padEnd(22)} ${ergebnis.ansicht.padEnd(18)} n=${String(ergebnis.eintraege.length).padStart(4)} FAIL=${String(fail).padStart(3)} OFFEN=${String(offen).padStart(3)} ${ergebnis.hinweis ? 'HINWEIS ' + ergebnis.hinweis.slice(0, 90) : ''}`)
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, PARALLEL) }, arbeiter))
  for (const typ of Object.values(browser)) await typ.close()
  const kopf = { etikett: ETIKETT, commit: COMMIT, basis: BASIS, basisWebkit: BASIS_WEBKIT, konto: KONTO || null, jetzt: JETZT, zeitzone: ZEITZONE, modus: { echt: ECHT, ohneJs: OHNE_JS, themawechsel: THEMAWECHSEL }, erzeugt: new Date().toISOString() }
  const ziel = join(ordner, `zustandsmatrix${OHNE_JS ? '-ohne-js' : ''}${ECHT ? '-echt' : ''}${THEMAWECHSEL ? '-themawechsel' : ''}.json`)
  let bisher = []
  if (existsSync(ziel)) bisher = JSON.parse(readFileSync(ziel, 'utf8')).ergebnisse ?? []
  const neu = new Set(ergebnisse.map((e) => `${e.ansicht}|${e.kombination}`))
  const gesamt = [...bisher.filter((e) => !neu.has(`${e.ansicht}|${e.kombination}`)), ...ergebnisse]
  writeFileSync(ziel, JSON.stringify({ ...kopf, zusammenfassung: zusammenfassen(gesamt), ergebnisse: gesamt }, null, 2))
  const z = zusammenfassen(ergebnisse)
  console.log(`Fertig: ${z.messungen} Messungen, PASS ${z.pass}, FAIL ${z.fail}, OFFEN ${z.offen}. Datei: ${ziel}`)
}

void main()
