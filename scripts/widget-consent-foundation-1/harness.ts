// Synthetische Prüffläche im lokalen Browser.
// Kein Klick auf Datenschutz-Links. Fremde Hosts werden abgebrochen.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'

const wurzel = process.cwd()
const ausgabe = process.env.WIDGET_CONSENT_AUSGABE?.trim() || join(tmpdir(), 'widget-consent-foundation-1')
const beweis = '/opt/cursor/artifacts/widget-consent-foundation-1'
const esbuild = join(wurzel, 'node_modules/esbuild/bin/esbuild')
const tailwind = join(wurzel, 'node_modules/tailwindcss/lib/cli.js')

const FAELLE = [
  { name: '320', width: 320, height: 900, schrift: '16px', zoom: '1' },
  { name: '390', width: 390, height: 900, schrift: '16px', zoom: '1' },
  { name: '768', width: 768, height: 1000, schrift: '16px', zoom: '1' },
  { name: '1440', width: 1440, height: 1100, schrift: '16px', zoom: '1' },
  { name: '320-root-32', width: 320, height: 1400, schrift: '32px', zoom: '1' },
  { name: '390-zoom-2', width: 390, height: 1400, schrift: '16px', zoom: '2' },
] as const

function bauen() {
  mkdirSync(ausgabe, { recursive: true })
  mkdirSync(beweis, { recursive: true })
  const css = join(ausgabe, 'app.css')
  const js = join(ausgabe, 'app.js')
  execFileSync(process.execPath, [
    tailwind,
    '-i', join(wurzel, 'styles/globals.css'),
    '-o', css,
    '--minify',
  ], { cwd: wurzel, stdio: 'inherit' })
  execFileSync(esbuild, [
    join(wurzel, 'scripts/widget-consent-foundation-1/einbindung.tsx'),
    '--bundle',
    '--format=esm',
    '--jsx=automatic',
    `--alias:@=${wurzel}`,
    `--outfile=${js}`,
    '--define:process.env.NODE_ENV="production"',
  ], { cwd: wurzel, stdio: 'inherit' })
  const html = `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetische Widget-Einwilligung</title><link rel="stylesheet" href="/app.css"></head><body><div id="widget-consent-synthetic-root"></div><script type="module" src="/app.js"></script></body></html>`
  writeFileSync(join(ausgabe, 'index.html'), html)
  return {
    html,
    css: readFileSync(css),
    js: readFileSync(js),
  }
}

function serverStart(dateien: { html: string; css: Buffer; js: Buffer }): Promise<{ server: Server; url: string }> {
  const server = createServer((anfrage, antwort) => {
    const pfad = anfrage.url?.split('?')[0]
    if (pfad === '/app.css') {
      antwort.setHeader('content-type', 'text/css; charset=utf-8')
      antwort.end(dateien.css)
      return
    }
    if (pfad === '/app.js') {
      antwort.setHeader('content-type', 'text/javascript; charset=utf-8')
      antwort.end(dateien.js)
      return
    }
    if (pfad === '/' || pfad === '/index.html') {
      antwort.setHeader('content-type', 'text/html; charset=utf-8')
      antwort.end(dateien.html)
      return
    }
    antwort.statusCode = 404
    antwort.end('nicht vorhanden')
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const adresse = server.address()
      if (!adresse || typeof adresse === 'string') throw new Error('server ohne port')
      resolve({ server, url: `http://127.0.0.1:${adresse.port}/` })
    })
  })
}

async function browserStart(): Promise<Browser> {
  const optionen = {
    headless: true,
    args: ['--disable-background-networking', '--disable-component-update', '--no-first-run'],
  }
  try {
    return await chromium.launch({ ...optionen, channel: 'chrome' })
  } catch {
    return chromium.launch(optionen)
  }
}

function fremdSammeln(page: Page, fremd: string[], phase: { name: string }) {
  page.on('request', (anfrage) => {
    const adresse = new URL(anfrage.url())
    if (adresse.hostname === '127.0.0.1' || adresse.hostname === 'localhost') return
    fremd.push(`${phase.name} ${adresse.href}`)
  })
}

async function masse(page: Page) {
  return page.evaluate(() => {
    const karte = document.querySelector('[data-provider="discovercars"]')
    const ablehnen = karte?.querySelector<HTMLElement>('[data-widget-consent-action="refuse"]')
    const zustimmen = karte?.querySelector<HTMLElement>('[data-widget-consent-action="grant_informative"]')
    const a = ablehnen?.getBoundingClientRect()
    const z = zustimmen?.getBoundingClientRect()
    const stileA = ablehnen ? getComputedStyle(ablehnen) : null
    const stileZ = zustimmen ? getComputedStyle(zustimmen) : null
    return {
      panel: karte?.getAttribute('data-panel'),
      informativ: karte?.getAttribute('data-informative'),
      ausfuehrung: karte?.getAttribute('data-effective-vendor-execution'),
      zwecke: karte?.getAttribute('data-purpose-controls'),
      kill: document.querySelector('[data-kill-switch]')?.getAttribute('data-kill-switch'),
      text: document.body.innerText,
      checkboxen: document.querySelectorAll('input[type="checkbox"]').length,
      iframes: document.querySelectorAll('iframe').length,
      skripte: [...document.scripts].map((skript) => skript.src),
      hoeheAblehnen: a?.height ?? 0,
      hoeheZustimmen: z?.height ?? 0,
      breiteAblehnen: a?.width ?? 0,
      breiteZustimmen: z?.width ?? 0,
      flaecheGleich: Boolean(stileA && stileZ && stileA.backgroundColor === stileZ.backgroundColor && stileA.color === stileZ.color && stileA.borderTopWidth === stileZ.borderTopWidth),
      seitenUeberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fokusAktion: document.activeElement?.getAttribute('data-widget-consent-action'),
    }
  })
}

async function oeffnen(browser: Browser, url: string, fall: (typeof FAELLE)[number], fremd: string[], phase: { name: string }) {
  const page = await browser.newPage({ viewport: { width: fall.width, height: fall.height } })
  await page.route('**/*', (route) => {
    const adresse = new URL(route.request().url())
    if (adresse.hostname === '127.0.0.1' || adresse.hostname === 'localhost') return route.continue()
    fremd.push(`${phase.name} block ${adresse.href}`)
    return route.abort()
  })
  fremdSammeln(page, fremd, phase)
  const fehler: string[] = []
  page.on('pageerror', (error) => fehler.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(({ schrift, zoom }) => {
    document.documentElement.style.fontSize = schrift
    document.documentElement.style.zoom = zoom
  }, { schrift: fall.schrift, zoom: fall.zoom })
  await page.waitForFunction(() => document.querySelector('[data-provider="discovercars"]'))
  return { page, fehler }
}

async function tabBis(page: Page, selector: string) {
  for (let schritt = 0; schritt < 12; schritt += 1) {
    const getroffen = await page.evaluate((sel) => document.activeElement?.matches(sel) ?? false, selector)
    if (getroffen) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`Tab erreicht ${selector} nicht`)
}

async function tastatur(page: Page) {
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('data-widget-consent-action') === 'refuse',
  )
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => {
    const karte = document.querySelector('[data-provider="discovercars"]')
    return karte?.getAttribute('data-panel') === 'closed' && karte.getAttribute('data-informative') === 'not_decided'
  })
  await tabBis(page, '[data-provider="discovercars"] [data-widget-consent-action="reopen"]')
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('data-widget-consent-action') === 'refuse',
  )
  await tabBis(page, '[data-provider="discovercars"] [data-widget-consent-action="grant_informative"]')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => {
    const karte = document.querySelector('[data-provider="discovercars"]')
    return karte?.getAttribute('data-informative') === 'granted'
      && karte.getAttribute('data-effective-vendor-execution') === 'denied'
      && karte.getAttribute('data-panel') === 'closed'
  })
  await page.screenshot({ path: join(beweis, '390-nach-zustimmung.png'), fullPage: true })
  await tabBis(page, '[data-provider="discovercars"] [data-widget-consent-action="reopen"]')
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('data-widget-consent-action') === 'withdraw',
  )
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => {
    const karte = document.querySelector('[data-provider="discovercars"]')
    return karte?.getAttribute('data-informative') === 'not_decided' && karte.getAttribute('data-panel') === 'open'
  })
  await page.locator('[data-synthetic="stale-grant"]').click()
  await page.waitForFunction(() => {
    const karte = document.querySelector('[data-provider="discovercars"]')
    return karte?.getAttribute('data-informative') === 'not_decided' && karte.getAttribute('data-panel') === 'open'
  })
  await page.locator('[data-provider="discovercars"] [data-widget-consent-action="grant_informative"]').click()
  await page.waitForFunction(() => document.querySelector('[data-provider="discovercars"]')?.getAttribute('data-informative') === 'granted')
  await page.locator('[data-synthetic="reorder"]').click()
  await page.waitForFunction(() => {
    const karte = document.querySelector('[data-provider="discovercars"]')
    return karte?.getAttribute('data-informative') === 'not_decided' && karte.getAttribute('data-panel') === 'open'
  })
  await page.locator('[data-provider="discovercars"] [data-widget-consent-action="grant_informative"]').click()
  await page.waitForFunction(() => document.querySelector('[data-provider="discovercars"]')?.getAttribute('data-informative') === 'granted')
  await page.locator('[data-synthetic="scope"]').click()
  await page.waitForFunction(() => {
    const karte = document.querySelector('[data-provider="discovercars"]')
    return karte?.getAttribute('data-informative') === 'not_decided' && karte.getAttribute('data-panel') === 'open'
  })
}

async function main() {
  const dateien = bauen()
  const { server, url } = await serverStart(dateien)
  const browser = await browserStart()
  const fremd: string[] = []
  const berichte = []
  const fehler: string[] = []
  try {
    const phase = { name: 'tastatur' }
    const tastaturSeite = await oeffnen(browser, url, FAELLE[1], fremd, phase)
    fehler.push(...tastaturSeite.fehler)
    await tastatur(tastaturSeite.page)
    const nachWahl = await masse(tastaturSeite.page)
    if (nachWahl.informativ !== 'not_decided') fehler.push(`nach Tastatur informativ ${nachWahl.informativ}`)
    if (nachWahl.ausfuehrung !== 'denied') fehler.push('nach Tastatur Ausführung nicht denied')
    if (nachWahl.kill !== 'closed') fehler.push('Kill-Switch nicht closed')
    await tastaturSeite.page.screenshot({ path: join(beweis, '390-nach-tastatur.png'), fullPage: true })
    await tastaturSeite.page.close()

    for (const fall of FAELLE) {
      const seite = await oeffnen(browser, url, fall, fremd, { name: fall.name })
      fehler.push(...seite.fehler.map((meldung) => `${fall.name}: ${meldung}`))
      await seite.page.waitForFunction(
        () => document.activeElement?.getAttribute('data-widget-consent-action') === 'refuse',
      )
      const stand = await masse(seite.page)
      await seite.page.screenshot({ path: join(beweis, `${fall.name}.png`), fullPage: true })
      berichte.push({ name: fall.name, ...stand })
      if (stand.panel !== 'open') fehler.push(`${fall.name}: Panel ${stand.panel}`)
      if (stand.informativ !== 'not_decided') fehler.push(`${fall.name}: informativ ${stand.informativ}`)
      if (stand.ausfuehrung !== 'denied' || stand.kill !== 'closed') fehler.push(`${fall.name}: Ausführung offen`)
      if (stand.zwecke !== 'locked') fehler.push(`${fall.name}: Zwecke nicht gesperrt`)
      if (stand.checkboxen !== 0 || stand.iframes !== 0) fehler.push(`${fall.name}: Drittinhalt`)
      if (stand.skripte.some((src) => !src.startsWith('http://127.0.0.1'))) fehler.push(`${fall.name}: fremdes Skript`)
      if (!stand.flaecheGleich) fehler.push(`${fall.name}: Aktionen ungleich`)
      if (stand.hoeheAblehnen < 44 || stand.hoeheZustimmen < 44) {
        fehler.push(`${fall.name}: Höhe ${stand.hoeheAblehnen}/${stand.hoeheZustimmen}`)
      }
      if (Math.abs(stand.breiteAblehnen - stand.breiteZustimmen) > 1) {
        fehler.push(`${fall.name}: Breite ${stand.breiteAblehnen}/${stand.breiteZustimmen}`)
      }
      if (fall.zoom === '1' && stand.seitenUeberlauf > 1) fehler.push(`${fall.name}: Überlauf ${stand.seitenUeberlauf}`)
      if (!stand.text.includes('Ausführung trotz Schalter-Versuch: aus.')) fehler.push(`${fall.name}: Kill-Text fehlt`)
      if (stand.text.includes('Wirksame Anbieter-Ausführung: an.')) fehler.push(`${fall.name}: Ausführung an`)
      await seite.page.close()
    }
  } finally {
    await browser.close()
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }

  if (fremd.length > 0) fehler.push(`Fremdanfragen ${fremd.length}: ${fremd.slice(0, 8).join(' | ')}`)
  const bericht = { berichte, fremd, fehler }
  writeFileSync(join(beweis, 'bericht.json'), JSON.stringify(bericht, null, 2))
  writeFileSync(join(ausgabe, 'bericht.json'), JSON.stringify(bericht, null, 2))
  if (fehler.length > 0) {
    console.error(fehler.join('\n'))
    process.exit(1)
  }
  console.log(JSON.stringify(berichte.map((eintrag) => ({
    name: eintrag.name,
    hoehe: [Math.round(eintrag.hoeheAblehnen), Math.round(eintrag.hoeheZustimmen)],
    breite: [Math.round(eintrag.breiteAblehnen), Math.round(eintrag.breiteZustimmen)],
    ueberlauf: eintrag.seitenUeberlauf,
    fokus: eintrag.fokusAktion,
  })), null, 2))
}

void main()
