// Every navigation is routed. Only the licensed banner URL is fulfilled with the local fixture.

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

const FIXTURE = `
var analytics=true;
function werte(){return{SECURITY_STORAGE:true,FUNCTIONALITY_STORAGE:true,ANALYTICS_STORAGE:analytics,AD_STORAGE:true,AD_USER_DATA:true,AD_PERSONALIZATION:true,PERSONALIZATION_STORAGE:true};}
window.PrivacyBee={
  getAllConsents:function(){return werte()},
  getConsent:function(name){return werte()[name]},
  hasExplicitConsent:function(){return true}
};
window.__jetnityPrefs=0;
document.addEventListener('click',function(event){
  var ziel=event.target&&event.target.closest?event.target.closest('.privacybee-display-preferences'):null;
  if(!ziel)return;
  window.__jetnityPrefs+=1;
});
window.__jetnitySetAnalytics=function(wert){
  analytics=wert;
  document.dispatchEvent(new CustomEvent('privacybee:consent-changed',{detail:{explicitConsent:false,consents:{ANALYTICS_STORAGE:wert}}}));
};
document.dispatchEvent(new CustomEvent('privacybee:ready',{detail:{categories:['ANALYTICS_STORAGE'],hasExplicitConsent:true}}));
`

function html(bootstrap: string) {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><script>${bootstrap}</script><script>window.__jetnityOptionalCanary=window.__jetnityCmp&&window.__jetnityCmp.order==="deny-before-optional"?"blocked-first":"too-late";</script><div id="cmp-s2-root"></div><script type="module" src="/app.js"></script></body></html>`
}

function bauen() {
  mkdirSync(ausgabe, { recursive: true })
  mkdirSync(beweis, { recursive: true })
  const cssPfad = join(ausgabe, 'app.css')
  const jsPfad = join(ausgabe, 'app.js')
  execFileSync(process.execPath, [tailwind, '-i', join(wurzel, 'styles/globals.css'), '-o', cssPfad, '--minify'], { cwd: wurzel, stdio: 'inherit' })
  execFileSync(esbuild, [
    join(wurzel, 'scripts/privacybee-cmp-widget-consent-s2/einbindung.tsx'),
    '--bundle', '--format=esm', `--alias:@=${wurzel}`, `--outfile=${jsPfad}`,
    '--define:process.env.NODE_ENV="production"',
  ], { cwd: wurzel, stdio: 'inherit' })
  return { css: readFileSync(cssPfad), js: readFileSync(jsPfad) }
}

async function browserStart(): Promise<Browser> {
  const optionen = { headless: true, args: ['--disable-background-networking', '--no-first-run'] }
  try { return await chromium.launch({ ...optionen, channel: 'chrome' }) }
  catch { return chromium.launch(optionen) }
}

function anbinden(page: Page, origin: string, body: string, dateien: { css: Buffer; js: Buffer }, banner: string[], fremd: string[]) {
  const host = new URL(origin).host
  return page.route('**/*', (route: Route) => {
    const url = route.request().url()
    let ziel = ''
    try { ziel = new URL(url).host } catch { ziel = '' }
    if (url === CMP_BANNER_SRC) {
      banner.push(url)
      return route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: FIXTURE })
    }
    if (url === `${origin}/` || url === origin) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body })
    }
    if (ziel === host && url.endsWith('/app.js')) {
      return route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: dateien.js })
    }
    if (ziel === host && url.endsWith('/app.css')) {
      return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: dateien.css })
    }
    if (ziel === host) return route.fulfill({ status: 204, body: '' })
    fremd.push(url)
    return route.abort()
  })
}

async function main() {
  const fehler: string[] = []
  const dateien = bauen()
  const browser = await browserStart()
  const banner: string[] = []
  const fremd: string[] = []
  try {
    const lizenziert = html(buildBootstrapSource({ release: true, killDenied: false }))
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
    await anbinden(page, 'https://jetnity.com', lizenziert, dateien, banner, fremd)
    await page.goto('https://jetnity.com/', { waitUntil: 'networkidle' })
    const frueh = await page.evaluate(() => ({
      canary: (window as unknown as { __jetnityOptionalCanary?: string }).__jetnityOptionalCanary ?? null,
      scripts: (window as unknown as { __jetnityCmp?: { scripts?: number } }).__jetnityCmp?.scripts ?? 0,
    }))
    if (frueh.canary !== 'blocked-first') fehler.push(`Reihenfolge ${frueh.canary}`)
    if (banner.length !== 1 || frueh.scripts !== 1) fehler.push(`Banner ${banner.length}/${frueh.scripts}`)
    if (fremd.length > 0) fehler.push(`Fremd ${fremd.join(',')}`)
    await page.waitForFunction(() => document.querySelector('[data-phase]')?.getAttribute('data-phase') === 'ready')
    await page.locator('[data-cmp-preferences="ready"]').click()
    const klicks = await page.evaluate(() => (window as unknown as { __jetnityPrefs?: number }).__jetnityPrefs ?? 0)
    if (klicks !== 1) fehler.push(`Präferenzen ${klicks}`)
    await page.getByRole('button', { name: 'Zustimmen' }).click()
    if (await page.locator('[data-synthetic-frame="1"]').count() !== 0) fehler.push('Informative Zustimmung hat einen Rahmen erzeugt')
    await page.locator('[data-synthetic="select"]').click()
    await page.locator('[data-synthetic="start"]').click()
    await page.waitForFunction(() => document.querySelectorAll('[data-synthetic-frame="1"]').length === 1)
    await page.locator('[data-synthetic="start"]').click()
    if (await page.locator('[data-synthetic-frame="1"]').count() !== 1) fehler.push('Zweiter Start dupliziert')
    await page.evaluate(() => (window as unknown as { __jetnitySetAnalytics: (wert: boolean) => void }).__jetnitySetAnalytics(false))
    await page.waitForFunction(() => document.querySelector('[data-synthetic-frame="1"]') === null)
    await page.screenshot({ path: join(beweis, '390-nach-kategorieverlust.png'), fullPage: true })
    await page.close()

    for (const origin of ['https://www.jetnity.com', 'https://widgets.jetnity.com', 'https://jetnity.com.evil.test']) {
      const negativ = await browser.newPage()
      const lokalBanner: string[] = []
      const lokalFremd: string[] = []
      await anbinden(negativ, origin, lizenziert, dateien, lokalBanner, lokalFremd)
      await negativ.goto(`${origin}/`, { waitUntil: 'domcontentloaded' })
      if (lokalBanner.length !== 0) fehler.push(`${origin} Banner`)
      if (lokalFremd.length !== 0) fehler.push(`${origin} fremd`)
      await negativ.close()
    }

    const server: { server: Server; url: string } = await new Promise((resolve) => {
      const http = createServer((anfrage, antwort) => {
        const pfad = anfrage.url?.split('?')[0]
        if (pfad === '/app.js') {
          antwort.setHeader('content-type', 'text/javascript')
          antwort.end(dateien.js)
          return
        }
        if (pfad === '/app.css') {
          antwort.setHeader('content-type', 'text/css')
          antwort.end(dateien.css)
          return
        }
        antwort.setHeader('content-type', 'text/html')
        antwort.end(html(productionBootstrapSource(undefined)))
      })
      http.listen(0, '127.0.0.1', () => {
        const adresse = http.address()
        if (!adresse || typeof adresse === 'string') throw new Error('port')
        resolve({ server: http, url: `http://127.0.0.1:${adresse.port}/` })
      })
    })
    const geo = await browser.newPage()
    const geoFremd: string[] = []
    const geoBanner: string[] = []
    await geo.route('**/*', (route) => {
      const url = route.request().url()
      if (url.startsWith(server.url)) return route.continue()
      if (url === CMP_BANNER_SRC) geoBanner.push(url)
      geoFremd.push(url)
      return route.abort()
    })
    await geo.goto(server.url, { waitUntil: 'networkidle' })
    if (geoBanner.length !== 0 || geoFremd.length !== 0) fehler.push(`Geometrie egress ${geoFremd.length}`)
    if (await geo.locator('[data-cmp-preferences="ready"]').count() !== 0) fehler.push('Unlizenzierte Präferenzen sichtbar')
    const faelle = [
      { name: '320', width: 320, height: 900, schrift: '16px' },
      { name: '390', width: 390, height: 900, schrift: '16px' },
      { name: '768', width: 768, height: 1000, schrift: '16px' },
      { name: '1440', width: 1440, height: 1100, schrift: '16px' },
      { name: '320-root-32', width: 320, height: 1400, schrift: '32px' },
    ]
    for (const fall of faelle) {
      await geo.setViewportSize({ width: fall.width, height: fall.height })
      await geo.evaluate((schrift) => { document.documentElement.style.fontSize = schrift }, fall.schrift)
      const ueberlauf = await geo.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (ueberlauf > 1) fehler.push(`${fall.name} Überlauf ${ueberlauf}`)
      await geo.screenshot({ path: join(beweis, `${fall.name}.png`), fullPage: true })
    }
    await geo.close()
    await new Promise<void>((resolve, reject) => server.server.close((error) => (error ? reject(error) : resolve())))
  } finally {
    await browser.close()
  }
  writeFileSync(join(beweis, 'bericht.json'), JSON.stringify({ fehler }, null, 2))
  if (fehler.length) {
    console.error(fehler.join('\n'))
    process.exit(1)
  }
  console.log('harness ok')
}

void main()
