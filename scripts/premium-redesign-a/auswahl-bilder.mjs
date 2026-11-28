#!/usr/bin/env node
// scripts/premium-redesign-a/auswahl-bilder.mjs
//
// Vorher/Nachher-Aufnahmen der Auswahl-, Bild- und Fokuselemente (Work-Nachtest 27.11.2026).
// Dieselben Ausschnitte gegen den alten Head (`--alt-*`) und den neuen Head (`--neu-*`), Chromium, hell und dunkel.
// Kein Produktionszugriff, keine Anmeldung: Gast-Ansichten kommen vom echten lokalen Build, Konto-Ansichten vom
// Konto-Prüfstand mit den echten Komponenten und dem echten CSS (`konto-harness.mjs`).
//
//   node scripts/premium-redesign-a/auswahl-bilder.mjs --alt-gast http://127.0.0.1:3491 --neu-gast http://127.0.0.1:3493 \
//     --alt-konto http://127.0.0.1:3476 --neu-konto http://127.0.0.1:3475 --out /tmp/pra/auswahl/bilder [--fixtures /tmp/pra/fixtures]

import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[index + 1] : standard
}

const QUELLEN = {
  alt: { gast: argument('alt-gast', 'http://127.0.0.1:3491'), konto: argument('alt-konto', 'http://127.0.0.1:3476') },
  neu: { gast: argument('neu-gast', 'http://127.0.0.1:3493'), konto: argument('neu-konto', 'http://127.0.0.1:3475') },
}
const AUS = argument('out', '/tmp/pra/auswahl/bilder')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures')
const REISE = JSON.parse(readFileSync(join(FIXTURES, 'thailand.json'), 'utf8'))
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'

const AUSSCHNITTE = [
  { id: 'meine-reisen-filter', quelle: 'konto', pfad: '/reisen', warten: '[data-sammlung-archiv]', ziel: 'button[aria-pressed]', breite: 390, hoehe: 844, mitReise: false },
  { id: 'meine-reisen-filter-1440', quelle: 'konto', pfad: '/reisen', warten: '[data-sammlung-archiv]', ziel: 'button[aria-pressed]', breite: 1440, hoehe: 900, mitReise: false },
  { id: 'konto-reise-kopf', quelle: 'konto', pfad: '/reisen/konto', warten: 'h1', ziel: '.reisekopf', breite: 390, hoehe: 844, mitReise: false },
  { id: 'einstellungen-darstellung', quelle: 'konto', pfad: '/account/settings', warten: 'h1', ziel: '[aria-pressed], [role="radiogroup"], [role="radio"]', breite: 390, hoehe: 844, mitReise: false },
  { id: 'reiseplan-etappen', quelle: 'gast', pfad: `/reisen/${REISE.id}`, warten: 'h1', ziel: '.et-map-tools, [aria-pressed]', breite: 390, hoehe: 844, mitReise: true, tab: /^\s*Reiseplan/ },
  { id: 'einreise-chips', quelle: 'gast', pfad: `/reisen/${REISE.id}`, warten: 'h1', ziel: '[aria-pressed]', breite: 390, hoehe: 844, mitReise: true, tab: /^\s*Einreise/ },
]

async function tabOeffnen(seite, muster) {
  const knoepfe = seite.locator('.workspace-bottom-nav button, [data-workspace-mode-nav="sidebar"] button, .workspace-sidebar button').filter({ hasText: muster })
  await knoepfe.first().waitFor({ state: 'attached', timeout: 10_000 })
  for (const kandidat of await knoepfe.all()) {
    if (await kandidat.isVisible()) {
      await kandidat.click()
      await seite.waitForTimeout(900)
      return
    }
  }
}

async function aufnehmen(browser, kopf, ausschnitt, thema) {
  const context = await browser.newContext({
    viewport: { width: ausschnitt.breite, height: ausschnitt.hoehe },
    deviceScaleFactor: 2,
    isMobile: ausschnitt.breite < 700,
    hasTouch: ausschnitt.breite < 700,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
  })
  await context.addInitScript(
    ({ schluessel, wert, themaSchluessel, dunkel, mitReise }) => {
      try {
        if (mitReise) localStorage.setItem(schluessel, wert)
        if (dunkel) localStorage.setItem(themaSchluessel, 'dark')
      } catch {
        /* blockierter Speicher */
      }
    },
    { schluessel: REISE.schluessel, wert: REISE.roh, themaSchluessel: THEMA_SCHLUESSEL, dunkel: thema === 'dark', mitReise: ausschnitt.mitReise },
  )
  const seite = await context.newPage()
  await seite.goto(`${QUELLEN[kopf][ausschnitt.quelle]}${ausschnitt.pfad}`, { waitUntil: 'domcontentloaded' })
  await seite.waitForSelector(ausschnitt.warten, { timeout: 20_000 })
  await seite.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  if (ausschnitt.tab) await tabOeffnen(seite, ausschnitt.tab)
  await seite.waitForTimeout(1200)
  const ergebnis = {}
  const ziel = seite.locator(ausschnitt.ziel).filter({ visible: true }).first()
  const zielGefunden = (await ziel.count()) > 0
  if (zielGefunden) {
    await ziel.scrollIntoViewIfNeeded()
    await seite.waitForTimeout(900)
  }
  const rahmen = zielGefunden ? await ziel.evaluate((element) => {
    const gruppe = element.closest('[role="group"], [role="radiogroup"], .reisekopf') ?? element.parentElement ?? element
    const box = gruppe.getBoundingClientRect()
    return { x: Math.max(0, box.x - 12), y: Math.max(0, box.y - 12), width: Math.min(innerWidth, box.width + 24), height: Math.min(innerHeight, box.height + 24) }
  }) : null
  const aufnahme = async (name, vorbereitung) => {
    if (vorbereitung) await vorbereitung()
    await seite.waitForTimeout(450)
    const datei = join(AUS, `${ausschnitt.id}-${thema}-${name}-${kopf === 'alt' ? 'vorher' : 'nachher'}.png`)
    if (rahmen) await seite.screenshot({ path: datei, clip: rahmen })
    else await seite.screenshot({ path: datei })
    ergebnis[name] = datei
  }
  await aufnahme('ruhend')
  if (zielGefunden) {
    await aufnahme('tastaturfokus', async () => {
      await seite.keyboard.press('Shift')
      await ziel.focus({ focusVisible: true }).catch(() => ziel.focus())
    })
  }
  await context.close()
  return ergebnis
}

mkdirSync(AUS, { recursive: true })
const browser = await chromium.launch()
const alle = []
for (const ausschnitt of AUSSCHNITTE) {
  for (const thema of ['light', 'dark']) {
    for (const kopf of ['alt', 'neu']) {
      try {
        const ergebnis = await aufnehmen(browser, kopf, ausschnitt, thema)
        alle.push({ ausschnitt: ausschnitt.id, thema, kopf, ...ergebnis })
        console.log(`${ausschnitt.id.padEnd(28)} ${thema.padEnd(5)} ${kopf}  ${Object.values(ergebnis).length} Aufnahmen`)
      } catch (fehler) {
        console.log(`${ausschnitt.id.padEnd(28)} ${thema.padEnd(5)} ${kopf}  OFFEN ${String(fehler.message).split('\n')[0]}`)
      }
    }
  }
}
await browser.close()
console.log(JSON.stringify({ aufnahmen: alle.length }, null, 2))
