#!/usr/bin/env node
// scripts/premium-redesign-a/datum-konto-video.mjs
//
// Kurzes Video von «Meine Reisen» (Konto-Prüfstand, bestehende Graz-Reise, 27.–31. Dezember):
// der Einstieg «Dein nächster Schritt», erst hell, dann dunkel, mit sichtbarem Zeiger. Aufruf je
// Stand: alter Prüfstand (Negativbeleg «31. Dez..») und neuer Prüfstand («31. Dez.»). Chromium,
// 430 × 760 px, keine Anmeldung, kein Produktionszugriff.
//
//   node scripts/premium-redesign-a/datum-konto-video.mjs --base http://127.0.0.1:3602 \
//     --etikett "Nachher" --out /tmp/pra/datum-konto-video --datei datum-konto-nachher

import { mkdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3602')
const ETIKETT = argument('etikett', 'Nachher')
const AUS = argument('out', '/tmp/pra/datum-konto-video')
const DATEI = argument('datei', 'datum-konto')
const GROESSE = { width: 430, height: 760 }
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'

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

async function zeigen(thema) {
  await seite.goto(`${BASIS}/reisen`, { waitUntil: 'domcontentloaded' })
  await seite.evaluate(({ schluessel, wunsch }) => localStorage.setItem(schluessel, wunsch), { schluessel: THEMA_SCHLUESSEL, wunsch: thema })
  await seite.goto(`${BASIS}/reisen`, { waitUntil: 'domcontentloaded' })
  const abschnitt = seite.locator('section[aria-label="Dein nächster Schritt"]').first()
  await abschnitt.waitFor({ timeout: 30_000 })
  await abschnitt.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await pause(1200)
  const satz = abschnitt.locator('p').nth(1)
  const rahmen = await satz.boundingBox()
  if (rahmen) {
    await seite.mouse.move(rahmen.x + 30, rahmen.y + rahmen.height / 2, { steps: 20 })
    await pause(900)
    await seite.mouse.move(rahmen.x + rahmen.width - 40, rahmen.y + rahmen.height / 2, { steps: 24 })
  }
  await pause(2200)
}

await zeigen('light')
await zeigen('dark')
const video = seite.video()
await context.close()
await browser.close()
const ziel = join(AUS, `${DATEI}.webm`)
renameSync(await video.path(), ziel)
console.log(ziel)
