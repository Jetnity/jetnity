#!/usr/bin/env node
// scripts/premium-redesign-a/datumsanzeige-video.mjs
//
// Kurzes Video der Reiseprüfung («Reise prüfen», Übersicht) für die Zermatt-Beispielreise, erst hell,
// dann dunkel, mit sichtbarem Zeiger und Standband. Aufruf je Stand: alter Head (Negativbeleg
// «19. Dez..») und neuer Head («19. Dez.»). Chromium, 430 × 760 px, keine Anmeldung.
//
//   node scripts/premium-redesign-a/datumsanzeige-video.mjs --base http://127.0.0.1:3497 \
//     --etikett "Nachher a7fed3713" --fixtures /tmp/pra/fixtures-datum --out /tmp/pra/datum/video --datei datum-nachher

import { mkdirSync, readFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3497')
const ETIKETT = argument('etikett', 'Nachher')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures-datum')
const AUS = argument('out', '/tmp/pra/datum/video')
const DATEI = argument('datei', 'datumsanzeige')
const GROESSE = { width: 430, height: 760 }
const reise = JSON.parse(readFileSync(join(FIXTURES, 'zermatt.json'), 'utf8'))

mkdirSync(AUS, { recursive: true })
const roh = join(AUS, 'roh')
mkdirSync(roh, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: GROESSE, recordVideo: { dir: roh, size: GROESSE }, locale: 'de-CH', timezoneId: 'Europe/Zurich', deviceScaleFactor: 1 })
await context.addInitScript(
  ({ etikett }) => {
    const aufbauen = () => {
      if (document.getElementById('pra-zeiger')) return
      const zeiger = document.createElement('div')
      zeiger.id = 'pra-zeiger'
      zeiger.style.cssText = 'position:fixed;z-index:2147483647;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:rgba(255,90,0,.8);border:2px solid #fff;box-shadow:0 0 0 1px #000;pointer-events:none;left:-40px;top:-40px'
      const band = document.createElement('div')
      band.id = 'pra-band'
      band.textContent = etikett
      band.style.cssText = 'position:fixed;z-index:2147483646;left:8px;bottom:8px;padding:4px 10px;border-radius:8px;font:600 13px system-ui,sans-serif;color:#fff;background:#000;pointer-events:none'
      document.documentElement.append(zeiger, band)
      window.addEventListener('mousemove', (e) => { zeiger.style.left = `${e.clientX}px`; zeiger.style.top = `${e.clientY}px` }, true)
    }
    if (document.documentElement) aufbauen()
    window.addEventListener('DOMContentLoaded', aufbauen)
  },
  { etikett: ETIKETT },
)
const seite = await context.newPage()
const pause = (ms) => seite.waitForTimeout(ms)

async function bedienen(thema) {
  await seite.goto(`${BASIS}/reisen`, { waitUntil: 'domcontentloaded' })
  await seite.evaluate(({ schluessel, wert, thema: wunsch }) => {
    localStorage.setItem(schluessel, wert)
    localStorage.setItem('jetnity:workspace-theme:v1', wunsch)
  }, { schluessel: reise.schluessel, wert: reise.roh, thema })
  await seite.goto(`${BASIS}/reisen/${reise.id}`, { waitUntil: 'domcontentloaded' })
  await seite.waitForSelector('h1', { timeout: 30_000 })
  await pause(1500)
  const knopf = seite.locator('[aria-label="Reise prüfen"] button').first()
  await knopf.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await pause(700)
  const box = await knopf.boundingBox()
  await seite.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 22 })
  await pause(600)
  await knopf.click()
  await seite.waitForSelector('section[aria-label="Verbindungsplanung"]', { timeout: 10_000 })
  await pause(800)
  const bereich = seite.locator('section[aria-label="Verbindungsplanung"]').first()
  await bereich.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await pause(900)
  for (const zeile of await bereich.locator('li p:nth-of-type(2)').all()) {
    const rahmen = await zeile.boundingBox()
    if (!rahmen) continue
    await seite.mouse.move(rahmen.x + 40, rahmen.y + rahmen.height / 2, { steps: 18 })
    await pause(1500)
  }
  await pause(600)
}

await bedienen('light')
await bedienen('dark')
const video = seite.video()
await context.close()
await browser.close()
const ziel = join(AUS, `${DATEI}.webm`)
renameSync(await video.path(), ziel)
console.log(ziel)
