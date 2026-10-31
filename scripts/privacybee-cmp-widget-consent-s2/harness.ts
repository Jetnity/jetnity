// Local CMP harness. The licensed page may intercept one banner URL.
// Every other vendor host fails. Unlicensed hosts make zero banner requests.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { chromium, type Browser, type Page, type Route } from 'playwright'

import { buildBootstrapSource, productionBootstrapSource } from '@/lib/privacy/privacybee-cmp/bootstrap'
import { CMP_BANNER_SRC } from '@/lib/privacy/privacybee-cmp/vertrag'

const wurzel = process.cwd()
const ausgabe = join(tmpdir(), 'privacybee-cmp-widget-consent-s2')
const beweis = '/opt/cursor/artifacts/privacybee-cmp-widget-consent-s2'
const esbuild = join(wurzel, 'node_modules/esbuild/bin/esbuild')
const tailwind = join(wurzel, 'node_modules/tailwindcss/lib/cli.js')

const FIXTURE = `window.PrivacyBee={getAllConsents:function(){return{SECURITY_STORAGE:true,FUNCTIONALITY_STORAGE:true,ANALYTICS_STORAGE:false,AD_STORAGE:false,AD_USER_DATA:false,AD_PERSONALIZATION:false,PERSONALIZATION_STORAGE:false}},getConsent:function(c){return this.getAllConsents()[c]},hasExplicitConsent:function(){return false}};document.dispatchEvent(new CustomEvent('privacybee:ready',{detail:{categories:['SECURITY_STORAGE'],hasExplicitConsent:false}}));`

function seite(bootstrap: string) {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><script>${bootstrap}</script><script>window.__jetnityOptionalCanary=window.__jetnityCmp&&window.__jetnityCmp.order==="deny-before-optional"?"blocked-first":"too-late";</script></head><body><p id="stand">bereit</p></body></html>`
}

async function routeHost(page: Page, origin: string, html: string, banner: string[], fremd: string[]) {
  const pageHost = new URL(origin).host
  await page.route('**/*', (route: Route) => {
    const url = route.request().url()
    let host = ''
    try { host = new URL(url).host } catch { host = '' }
    if (url === `${origin}/` || url === origin) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html })
    }
    if (url === CMP_BANNER_SRC) {
      banner.push(url)
      return route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: FIXTURE })
    }
    if (host === pageHost) return route.fulfill({ status: 204, body: '' })
    fremd.push(url)
    return route.abort()
  })
}

async function oeffnen(browser: Browser, origin: string, html: string) {
  const page = await browser.newPage()
  const banner: string[] = []
  const fremd: string[] = []
  await routeHost(page, origin, html, banner, fremd)
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' })
  return { page, banner, fremd }
}

async function browserStart(): Promise<Browser> {
  const optionen = { headless: true, args: ['--disable-background-networking', '--no-first-run'] }
  try {
    return await chromium.launch({ ...optionen, channel: 'chrome' })
  } catch {
    return chromium.launch(optionen)
  }
}

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
    join(wurzel, 'scripts/privacybee-cmp-widget-consent-s2/einbindung.tsx'),
    '--bundle',
    '--format=esm',
    `--alias:@=${wurzel}`,
    `--outfile=${js}`,
    '--define:process.env.NODE_ENV="production"',
  ], { cwd: wurzel, stdio: 'inherit' })
  return { css: readFileSync(css), js: readFileSync(js) }
}

function serverStart(dateien: { css: Buffer; js: Buffer }, html: string): Promise<{ server: Server; url: string }> {
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
    antwort.setHeader('content-type', 'text/html; charset=utf-8')
    antwort.end(html)
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const adresse = server.address()
      if (!adresse || typeof adresse === 'string') throw new Error('server ohne port')
      resolve({ server, url: `http://127.0.0.1:${adresse.port}/` })
    })
  })
}

async function main() {
  const fehler: string[] = []
  const browser = await browserStart()
  const lizenziert = seite(buildBootstrapSource(true))
  try {
    const positiv = await oeffnen(browser, 'https://jetnity.com', lizenziert)
    const stand = await positiv.page.evaluate(() => ({
      canary: (window as unknown as { __jetnityOptionalCanary?: string }).__jetnityOptionalCanary ?? null,
      phase: (window as unknown as { __jetnityCmp?: { phase?: string; scripts?: number; order?: string } }).__jetnityCmp ?? null,
    }))
    if (stand.canary !== 'blocked-first') fehler.push(`Reihenfolge ${stand.canary}`)
    if (stand.phase?.phase !== 'denied' || stand.phase.order !== 'deny-before-optional') fehler.push('Deny fehlt')
    if (positiv.banner.length !== 1) fehler.push(`Banner ${positiv.banner.length}`)
    if (positiv.fremd.length > 0) fehler.push(`Fremd lizenziert ${positiv.fremd.join(',')}`)
    await positiv.page.close()

    for (const origin of ['https://www.jetnity.com', 'https://widgets.jetnity.com', 'https://jetnity.com.evil.test', 'http://127.0.0.1:9']) {
      const seiteNegativ = await oeffnen(browser, origin, lizenziert)
      if (seiteNegativ.banner.length !== 0) fehler.push(`${origin} Banner ${seiteNegativ.banner.length}`)
      if (seiteNegativ.fremd.length > 0) fehler.push(`${origin} fremd`)
      await seiteNegativ.page.close()
    }

    const lokalHtml = `<!doctype html><html><head><script>try{localStorage.setItem('cmp-release','true')}catch(e){}</script><script>${productionBootstrapSource()}<\/script></head><body></body></html>`
    const lokal = await oeffnen(browser, 'http://127.0.0.1:9', lokalHtml)
    if (lokal.banner.length !== 0) fehler.push('Produktion auf 127.0.0.1 hat ein Banner angefragt')
    await lokal.page.close()
  } finally {
    await browser.close()
  }

  const dateien = bauen()
  const html = `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"><script>${productionBootstrapSource()}<\/script></head><body><div id="cmp-s2-root"></div><script type="module" src="/app.js"></script></body></html>`
  const { server, url } = await serverStart(dateien, html)
  const ansicht = await browserStart()
  const banner: string[] = []
  const fremd: string[] = []
  try {
    const page = await ansicht.newPage()
    page.on('request', (anfrage) => {
      const adresse = anfrage.url()
    if (adresse.startsWith(url)) return
    if (adresse === CMP_BANNER_SRC) banner.push(adresse)
    else fremd.push(adresse)
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    if (banner.length !== 0 || fremd.length !== 0) fehler.push('Geometriefläche hat Vendor-Verkehr')
    const faelle = [
      { name: '320', width: 320, height: 900, schrift: '16px' },
      { name: '390', width: 390, height: 900, schrift: '16px' },
      { name: '768', width: 768, height: 1000, schrift: '16px' },
      { name: '1440', width: 1440, height: 1100, schrift: '16px' },
      { name: '320-root-32', width: 320, height: 1400, schrift: '32px' },
    ]
    for (const fall of faelle) {
      await page.setViewportSize({ width: fall.width, height: fall.height })
      await page.evaluate((schrift) => { document.documentElement.style.fontSize = schrift }, fall.schrift)
      const masse = await page.evaluate(() => {
        const knopf = document.querySelector('[data-cmp-preferences="ready"]')
        const kasten = knopf?.getBoundingClientRect()
        return {
          prefs: Boolean(knopf),
          hoehe: kasten?.height ?? 0,
          ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          iframes: document.querySelectorAll('iframe').length,
        }
      })
      if (!masse.prefs) fehler.push(`${fall.name}: Präferenzen fehlen`)
      if (masse.hoehe < 44) fehler.push(`${fall.name}: Höhe ${masse.hoehe}`)
      if (masse.ueberlauf > 1) fehler.push(`${fall.name}: Überlauf ${masse.ueberlauf}`)
      if (masse.iframes !== 0) fehler.push(`${fall.name}: iframe`)
      await page.screenshot({ path: join(beweis, `${fall.name}.png`), fullPage: true })
    }
    await page.setViewportSize({ width: 390, height: 900 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '16px' })
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-widget-consent-action') === 'refuse')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const fokus = await page.evaluate(() => document.activeElement?.getAttribute('data-cmp-preferences'))
    if (fokus !== 'ready') fehler.push(`Tastatur Präferenzen ${fokus}`)
    await page.locator('[data-synthetic="start"]').click()
    await page.waitForFunction(() => document.querySelectorAll('[data-synthetic-frame="1"]').length === 1)
    await page.locator('[data-synthetic="start"]').click()
    const anzahl = await page.locator('[data-synthetic-frame="1"]').count()
    if (anzahl !== 1) fehler.push(`Rahmen ${anzahl}`)
    await page.locator('[data-synthetic="withdraw"]').click()
    await page.waitForFunction(() => document.querySelector('[data-synthetic-frame="1"]') === null)
    await page.screenshot({ path: join(beweis, '390-nach-entzug.png'), fullPage: true })
    await page.close()
  } finally {
    await ansicht.close()
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }

  writeFileSync(join(beweis, 'bericht.json'), JSON.stringify({ fehler, bannerErwartet: CMP_BANNER_SRC }, null, 2))
  if (fehler.length > 0) {
    console.error(fehler.join('\n'))
    process.exit(1)
  }
  console.log('harness ok')
}

void main()
