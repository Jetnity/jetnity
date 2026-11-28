#!/usr/bin/env node
// scripts/premium-redesign-a/auswahl-video.mjs
//
// Kurzes Video der Filterauswahl «Alle / Offen / Archiv» in Meine Reisen gegen den Konto-Prüfstand
// (echte Komponenten, echtes Projekt-CSS): erst hell, dann dunkel, mit sichtbarem Zeiger, Klick auf jeden Filter und
// Tastaturfokus. Aufruf je Stand: alter Head (Negativbeleg) und neuer Head.
//
//   node scripts/premium-redesign-a/auswahl-video.mjs --konto http://127.0.0.1:3475 --etikett "Nachher d070343a0" --out /tmp/pra/auswahl/video

import { mkdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[index + 1] : standard
}

const KONTO = argument('konto', 'http://127.0.0.1:3475')
const ETIKETT = argument('etikett', 'Nachher')
const AUS = argument('out', '/tmp/pra/auswahl/video')
const DATEI = argument('datei', 'filter-auswahl')
const GROESSE = { width: 420, height: 640 }

mkdirSync(AUS, { recursive: true })
const roh = join(AUS, 'roh')
mkdirSync(roh, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: GROESSE, recordVideo: { dir: roh, size: GROESSE }, locale: 'de-CH', deviceScaleFactor: 1 })
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
  await seite.evaluate((wert) => localStorage.setItem('jetnity:workspace-theme:v1', wert), thema)
  await seite.goto(`${KONTO}/reisen`, { waitUntil: 'domcontentloaded' })
  await seite.waitForSelector('[data-sammlung-archiv]', { timeout: 20_000 })
  await seite.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await pause(1200)
  const knoepfe = seite.locator('button[aria-pressed]').filter({ visible: true })
  await knoepfe.first().evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await pause(900)
  for (const name of ['Alle', 'Offen', 'Archiv', 'Alle']) {
    const knopf = seite.locator('button[aria-pressed]', { hasText: new RegExp(`^\\s*${name}\\s*$`) }).first()
    await knopf.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await pause(400)
    const box = await knopf.boundingBox()
    await seite.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 22 })
    await pause(700)
    await knopf.click()
    await pause(1300)
  }
  await seite.locator('button[aria-pressed]').filter({ visible: true }).first().evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await seite.keyboard.press('Tab')
  await pause(900)
  await seite.keyboard.press('Tab')
  await pause(1500)
}

await seite.goto(`${KONTO}/reisen`, { waitUntil: 'domcontentloaded' })
await bedienen('light')
await bedienen('dark')
const video = seite.video()
await context.close()
await browser.close()
const quelle = await video.path()
const ziel = join(AUS, `${DATEI}.webm`)
renameSync(quelle, ziel)
console.log(ziel)
