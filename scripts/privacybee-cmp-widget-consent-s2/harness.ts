// Every navigation is routed before it starts. The licensed page may receive
// one local fixture for the official banner URL. Every other foreign request fails.
// The ledger is checked again after the interactions and the cleanup.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { chromium, type Browser, type Page, type Route } from 'playwright'

import { buildBootstrapSource, productionBootstrapSource } from '@/lib/privacy/privacybee-cmp/bootstrap'
import { CMP_BANNER_SRC } from '@/lib/privacy/privacybee-cmp/vertrag'

declare global {
  interface Window {
    __jetnityPrefs?: number
    __jetnitySetAnalytics?: (wert: boolean) => void
    __jetnitySetConsent?: (name: string, wert: boolean) => void
  }
}

const wurzel = process.cwd()
const ausgabe = join(tmpdir(), 'privacybee-cmp-widget-consent-s2')
const beweis = '/opt/cursor/artifacts/privacybee-cmp-widget-consent-s2'
const esbuild = join(wurzel, 'node_modules/esbuild/bin/esbuild')
const tailwind = join(wurzel, 'node_modules/tailwindcss/lib/cli.js')
const whiteMint = readFileSync(join(wurzel, 'styles/white-mint.css'))

const FIXTURE = `
var werteMap={SECURITY_STORAGE:true,FUNCTIONALITY_STORAGE:true,ANALYTICS_STORAGE:true,AD_STORAGE:true,AD_USER_DATA:true,AD_PERSONALIZATION:true,PERSONALIZATION_STORAGE:true};
var backup=null;
function werte(){return{SECURITY_STORAGE:werteMap.SECURITY_STORAGE,FUNCTIONALITY_STORAGE:werteMap.FUNCTIONALITY_STORAGE,ANALYTICS_STORAGE:werteMap.ANALYTICS_STORAGE,AD_STORAGE:werteMap.AD_STORAGE,AD_USER_DATA:werteMap.AD_USER_DATA,AD_PERSONALIZATION:werteMap.AD_PERSONALIZATION,PERSONALIZATION_STORAGE:werteMap.PERSONALIZATION_STORAGE};}
function api(){
  return {
    getAllConsents:function(){return werte()},
    getConsent:function(name){return werte()[name]},
    hasExplicitConsent:function(){return true}
  };
}
window.PrivacyBee=api();
backup=window.PrivacyBee;
window.__jetnityPrefs=0;
document.addEventListener('click',function(event){
  var ziel=event.target&&event.target.closest?event.target.closest('.privacybee-display-preferences'):null;
  if(!ziel)return;
  window.__jetnityPrefs+=1;
});
window.__jetnitySetConsent=function(name, wert){
  werteMap[name]=wert;
  document.dispatchEvent(new CustomEvent('privacybee:consent-changed',{detail:{explicitConsent:false,consents:{[name]:wert}}}));
};
window.__jetnitySetAnalytics=function(wert){window.__jetnitySetConsent('ANALYTICS_STORAGE', wert);};
window.__jetnityBreak=function(){
  window.PrivacyBee={
    getAllConsents:function(){throw new Error('load-error')},
    getConsent:function(){return true},
    hasExplicitConsent:function(){return true}
  };
  document.dispatchEvent(new CustomEvent('privacybee:consent-changed',{detail:{explicitConsent:false}}));
};
window.__jetnityRestore=function(){
  window.PrivacyBee=backup;
  document.dispatchEvent(new CustomEvent('privacybee:consent-changed',{detail:{explicitConsent:true}}));
};
document.dispatchEvent(new CustomEvent('privacybee:ready',{detail:{categories:['ANALYTICS_STORAGE'],hasExplicitConsent:true}}));
`

function html(bootstrap: string) {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="/white-mint.css"></head><body><div class="workspace-shell" data-workspace-theme="light" data-white-mint="home"><div id="cmp-canary-log" data-canary-log="[]"></div><div id="cmp-issued" data-issued=""></div><div id="cmp-s2-root"></div></div><script src="/app.js"></script><script>${bootstrap}</script></body></html>`
}

function bauen() {
  mkdirSync(ausgabe, { recursive: true })
  mkdirSync(beweis, { recursive: true })
  const cssPfad = join(ausgabe, 'app.css')
  const jsPfad = join(ausgabe, 'app.js')
  execFileSync(process.execPath, [tailwind, '-i', join(wurzel, 'styles/globals.css'), '-o', cssPfad, '--minify'], { cwd: wurzel, stdio: 'inherit' })
  execFileSync(esbuild, [
    join(wurzel, 'scripts/privacybee-cmp-widget-consent-s2/einbindung.tsx'),
    '--bundle', '--format=iife', `--alias:@=${wurzel}`, `--outfile=${jsPfad}`,
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
    if (ziel === host && url.endsWith('/white-mint.css')) {
      return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: whiteMint })
    }
    if (ziel === host) return route.fulfill({ status: 204, body: '' })
    fremd.push(url)
    return route.abort()
  })
}

async function log(page: Page) {
  return page.locator('#cmp-canary-log').getAttribute('data-canary-log').then((wert) => JSON.parse(wert || '[]') as { epoch: number; scope: string; ok: boolean; kind: string; n: number }[])
}

async function tokenLesen(page: Page) {
  return page.evaluate(() => window.__jetnityToken ?? null)
}

async function main() {
  const fehler: string[] = []
  const merken = (text: string) => { fehler.push(text) }
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
      calls: window.__jetnityOptionalCalls ?? 0,
      attempt: window.__jetnityCmp?.optionalAttempt ?? null,
      order: window.__jetnityCmp?.order ?? null,
      scripts: window.__jetnityCmp?.scripts ?? 0,
      early: window.__jetnityEarly ?? null,
    }))
    if (frueh.calls !== 1 || frueh.attempt !== 'blocked' || frueh.order !== 'listeners-before-optional' || !frueh.early) {
      merken(`Optionalstart ${JSON.stringify(frueh)}`)
    } else if (frueh.early.created || frueh.early.live || frueh.early.storeLive || frueh.early.bannerPresent || frueh.early.scripts !== 0 || frueh.early.listeners < 1 || frueh.early.reason !== 'no_provider_intent') {
      merken(`Frühes Gate ${JSON.stringify(frueh.early)}`)
    }
    if (banner.length !== 1 || frueh.scripts !== 1) merken(`Banner ${banner.length}/${frueh.scripts}`)
    const stil = await page.evaluate(() => ({
      html: getComputedStyle(document.documentElement).backgroundColor,
      sheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) => (node as HTMLLinkElement).href),
      home: document.querySelectorAll('[data-white-mint="home"]').length,
      shell: document.querySelectorAll('.workspace-shell[data-workspace-theme="light"]').length,
    }))
    if (!stil.sheets.some((href) => href.endsWith('/white-mint.css')) || !stil.sheets.some((href) => href.endsWith('/app.css'))) {
      merken(`Styles ${stil.sheets.join(',')}`)
    }
    if (stil.home < 1 || stil.shell < 1) merken('Ancestor fehlt')
    if (stil.html !== 'rgb(247, 252, 249)' && stil.html !== 'rgba(247, 252, 249, 1)') merken(`Mint ${stil.html}`)
    if (await page.locator('[data-cmp-client="1"]').count() !== 1) merken('Client nicht gemountet')
    await page.waitForFunction(() => document.querySelector('[data-cmp-phase]')?.getAttribute('data-cmp-phase') === 'ready')
    await page.waitForFunction(() => document.querySelector('[data-phase]')?.getAttribute('data-phase') === 'ready')
    await page.locator('[data-cmp-preferences="ready"]').click()
    const klicks = await page.evaluate(() => window.__jetnityPrefs ?? 0)
    if (klicks !== 1) merken(`Präferenzen ${klicks}`)
    await page.getByRole('button', { name: 'Zustimmen' }).click()
    if (await page.locator('[data-synthetic-frame="1"]').count() !== 0) merken('Informative Zustimmung hat einen Rahmen erzeugt')
    if (await page.locator('[data-effective-vendor-execution="denied"]').count() < 1) merken('Ausführung nicht verweigert')

    await page.locator('[data-synthetic="select"]').click()
    await page.locator('[data-synthetic="remember"]').click()
    const vorRahmen = await tokenLesen(page)
    if (!vorRahmen) merken('Token vor dem Rahmen fehlt')
    if (await page.locator('[data-synthetic-frame="1"]').count() !== 0) merken('Rahmen vor dem Start')
    await page.evaluate(() => window.__jetnitySetAnalytics?.(false))
    await page.waitForFunction(() => document.querySelector('[data-intent]')?.getAttribute('data-intent') === 'withdrawn')
    await page.evaluate(() => window.__jetnitySetAnalytics?.(true))
    await page.locator('[data-synthetic="start"]').click()
    if (await page.locator('[data-synthetic-frame="1"]').count() !== 0) merken('Start ohne neue Auswahl hat einen Rahmen erzeugt')

    await page.locator('[data-synthetic="select"]').click()
    await page.locator('[data-synthetic="remember"]').click()
    await page.locator('[data-synthetic="start"]').click()
    await page.waitForFunction(() => document.querySelectorAll('[data-synthetic-frame="1"]').length === 1)
    const rahmen = page.locator('[data-synthetic-frame="1"]')
    if (await rahmen.getAttribute('sandbox') !== 'allow-scripts') merken('Canary-Sandbox fehlt')
    const srcdoc = await rahmen.getAttribute('srcdoc')
    if (!srcdoc?.includes('parent.postMessage') || srcdoc.includes('privacybee') || srcdoc.includes('http')) merken('Canary-Dokument')
    await page.waitForFunction(() => {
      const roh = document.getElementById('cmp-canary-log')?.getAttribute('data-canary-log') || '[]'
      const eintraege = JSON.parse(roh) as { ok: boolean; kind: string }[]
      return eintraege.some((eintrag) => eintrag.kind === 'active' && eintrag.ok) && eintraege.some((eintrag) => eintrag.kind === 'pulse' && eintrag.ok)
    })
    await page.screenshot({ path: join(beweis, '390-canary.png'), fullPage: true })
    await page.evaluate(() => window.__jetnitySetConsent?.('AD_STORAGE', false))
    const vorFremd = (await log(page)).length
    await page.waitForFunction((bisher) => {
      const roh = document.getElementById('cmp-canary-log')?.getAttribute('data-canary-log') || '[]'
      const eintraege = JSON.parse(roh) as { ok: boolean; kind: string }[]
      return document.querySelectorAll('[data-synthetic-frame="1"]').length === 1 && eintraege.slice(bisher).some((eintrag) => eintrag.kind === 'pulse' && eintrag.ok)
    }, vorFremd)
    const erster = await tokenLesen(page)
    if (!erster) merken('Lebendes Token fehlt')
    if ((await log(page)).some((eintrag) => eintrag.kind === 'delayed')) merken('Verzögerung lief vor dem Schnitt')
    await page.locator('[data-synthetic-frame="1"]').evaluate((node) => {
      (node as HTMLIFrameElement).contentWindow?.postMessage({ jetnityArm: 'delayed' }, '*')
    })
    await page.waitForFunction(() => {
      const roh = document.getElementById('cmp-canary-log')?.getAttribute('data-canary-log') || '[]'
      const eintraege = JSON.parse(roh) as { kind: string }[]
      return eintraege.some((eintrag) => eintrag.kind === 'armed') && !eintraege.some((eintrag) => eintrag.kind === 'delayed')
    })
    const mark = (await log(page)).length
    await page.evaluate(() => window.__jetnitySetAnalytics?.(false))
    await page.waitForFunction(() => document.querySelector('[data-synthetic-frame="1"]') === null)
    await page.waitForTimeout(800)
    const nachAbbruch = (await log(page)).slice(mark).filter((eintrag) => eintrag.kind === 'active' || eintrag.kind === 'pulse' || eintrag.kind === 'delayed')
    if (nachAbbruch.some((eintrag) => eintrag.kind === 'delayed')) merken('Verzögerte Canary-Arbeit nach Abbruch')
    if (nachAbbruch.length > 1) merken(`Canary arbeitet nach Abbruch ${nachAbbruch.length}`)
    if (nachAbbruch.some((eintrag) => eintrag.ok)) merken('Eingereihte Canary-Arbeit wurde akzeptiert')
    await page.screenshot({ path: join(beweis, '390-nach-kategorieverlust.png'), fullPage: true })
    await page.evaluate(() => window.__jetnitySetAnalytics?.(true))
    await page.evaluate(() => window.__jetnitySetConsent?.('AD_STORAGE', true))
    await page.evaluate((alt) => {
      window.postMessage({ jetnityCanary: alt?.epoch, provider: alt?.providerId, scope: alt?.scopeKey, required: alt?.requiredOptional }, '*')
    }, erster)
    await page.waitForFunction(() => {
      const roh = document.getElementById('cmp-canary-log')?.getAttribute('data-canary-log') || '[]'
      return JSON.parse(roh).some((eintrag: { ok: boolean }) => eintrag.ok === false)
    })
    await page.evaluate(() => window.__jetnitySetAnalytics?.(true))
    await page.locator('[data-synthetic="select"]').click()
    await page.locator('[data-synthetic="remember"]').click()
    await page.locator('[data-synthetic="start"]').click()
    await page.waitForFunction(() => document.querySelectorAll('[data-synthetic-frame="1"]').length === 1)
    const zweiter = await tokenLesen(page)
    if (!zweiter || zweiter.epoch === erster?.epoch) merken('Regrant nutzt die alte Epoche')
    await page.waitForFunction(() => {
      const roh = document.getElementById('cmp-canary-log')?.getAttribute('data-canary-log') || '[]'
      const eintraege = JSON.parse(roh) as { epoch: number; ok: boolean }[]
      return eintraege.some((eintrag) => eintrag.epoch === window.__jetnityToken?.epoch && eintrag.ok)
    })
    const vorReplay = (await log(page)).length
    await page.evaluate((alt) => {
      window.postMessage({ jetnityCanary: alt?.epoch, provider: alt?.providerId, scope: alt?.scopeKey, required: alt?.requiredOptional }, '*')
    }, erster)
    await page.waitForFunction((bisher) => {
      const roh = document.getElementById('cmp-canary-log')?.getAttribute('data-canary-log') || '[]'
      return JSON.parse(roh).slice(bisher).some((eintrag: { kind?: string }) => eintrag.kind === 'replay')
    }, vorReplay)
    const nachRegrant = (await log(page)).slice(vorReplay).filter((eintrag) => eintrag.kind === 'replay')
    if (nachRegrant.length === 0 || nachRegrant.some((eintrag) => eintrag.ok)) merken('Alte Epoche nach Regrant akzeptiert')

    await page.locator('[data-synthetic="reorder"]').click()
    await page.waitForFunction(() => document.querySelector('[data-synthetic-frame="1"]') === null && document.querySelector('[data-intent]')?.getAttribute('data-intent') === 'none')
    await page.locator('[data-synthetic="select"]').click()
    await page.locator('[data-synthetic="remember"]').click()
    await page.locator('[data-synthetic="start"]').click()
    await page.waitForFunction(() => document.querySelectorAll('[data-synthetic-frame="1"]').length === 1)
    await page.locator('[data-synthetic="scope"]').click()
    await page.waitForFunction(() => document.querySelector('[data-scope]')?.getAttribute('data-scope') === 'scope-beta' && document.querySelector('[data-synthetic-frame="1"]') === null)

    await page.locator('[data-synthetic="select"]').click()
    await page.locator('[data-synthetic="remember"]').click()
    await page.locator('[data-synthetic="start"]').click()
    await page.waitForFunction(() => document.querySelectorAll('[data-synthetic-frame="1"]').length === 1)
    const vorClose = await tokenLesen(page)
    await page.getByRole('button', { name: 'Schliessen' }).click()
    await page.waitForFunction(() => document.querySelector('[data-synthetic-frame="1"]') === null && document.querySelector('[data-intent]')?.getAttribute('data-intent') === 'withdrawn')
    await page.evaluate((alt) => {
      window.postMessage({ jetnityCanary: alt?.epoch, provider: alt?.providerId, scope: alt?.scopeKey, required: alt?.requiredOptional }, '*')
    }, vorClose)
    await page.locator('[data-synthetic="break"]').click()
    await page.waitForFunction(() => document.querySelector('[data-cmp-phase]')?.getAttribute('data-cmp-phase') === 'error')
    if (await page.locator('[data-synthetic-frame="1"]').count() !== 0) merken('Fehlerzustand behält den Rahmen')
    await page.locator('[data-synthetic="restore"]').click()
    await page.waitForFunction(() => document.querySelector('[data-cmp-phase]')?.getAttribute('data-cmp-phase') === 'ready')
    await page.evaluate(() => window.__jetnityUnmount?.())
    if (await page.locator('[data-cmp-client="1"]').count() !== 0) merken('Unmount lässt den Client stehen')
    await page.evaluate(() => window.__jetnityRemount?.())
    await page.waitForFunction(() => document.querySelector('[data-cmp-client="1"]') && document.querySelector('[data-cmp-phase]')?.getAttribute('data-cmp-phase') === 'ready')
    const laenge = (await log(page)).length
    await page.evaluate((alt) => {
      window.postMessage({ jetnityCanary: alt?.epoch, provider: alt?.providerId, scope: alt?.scopeKey, required: alt?.requiredOptional }, '*')
    }, vorClose)
    await page.waitForFunction((bisher) => {
      const roh = document.getElementById('cmp-canary-log')?.getAttribute('data-canary-log') || '[]'
      return JSON.parse(roh).length > bisher
    }, laenge)
    const ende = await log(page)
    if (ende.at(-1)?.ok !== false) merken('Callback nach Unmount akzeptiert')
    if (fremd.length !== 0) merken(`Fremd vor Cleanup ${fremd.join(',')}`)
    await page.close()

    for (const origin of ['https://www.jetnity.com', 'https://widgets.jetnity.com', 'https://jetnity.com.evil.test']) {
      const negativ = await browser.newPage()
      await anbinden(negativ, origin, lizenziert, dateien, banner, fremd)
      await negativ.goto(`${origin}/`, { waitUntil: 'domcontentloaded' })
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
        if (pfad === '/white-mint.css') {
          antwort.setHeader('content-type', 'text/css')
          antwort.end(whiteMint)
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
    await geo.route('**/*', (route) => {
      const url = route.request().url()
      if (url.startsWith(server.url)) return route.continue()
      if (url === CMP_BANNER_SRC) banner.push(url)
      fremd.push(url)
      return route.abort()
    })
    await geo.goto(server.url, { waitUntil: 'networkidle' })
    const geoFrueh = await geo.evaluate(() => ({
      calls: window.__jetnityOptionalCalls ?? 0,
      attempt: window.__jetnityCmp?.optionalAttempt ?? null,
      scripts: window.__jetnityCmp?.scripts ?? 0,
      early: window.__jetnityEarly ?? null,
    }))
    if (geoFrueh.calls !== 1 || geoFrueh.attempt !== 'blocked' || geoFrueh.scripts !== 0 || geoFrueh.early?.created || geoFrueh.early?.reason !== 'host_unlicensed' || geoFrueh.early?.bannerPresent) {
      merken(`Geometrie-Optional ${JSON.stringify(geoFrueh)}`)
    }
    if (await geo.locator('[data-cmp-client="1"]').count() !== 1) merken('Geometrie ohne Client')
    await geo.waitForFunction(() => document.querySelector('[data-cmp-phase]')?.getAttribute('data-cmp-phase') === 'error', undefined, { timeout: 15_000 })
    if (await geo.locator('[data-cmp-preferences="ready"]').count() !== 0) merken('Unlizenzierte Präferenzen sichtbar')
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
      if (ueberlauf > 1) merken(`${fall.name} Überlauf ${ueberlauf}`)
      await geo.screenshot({ path: join(beweis, `${fall.name}.png`), fullPage: true })
    }
    await geo.close()
    await new Promise<void>((resolve, reject) => server.server.close((error) => (error ? reject(error) : resolve())))
  } finally {
    await browser.close()
  }
  if (banner.length !== 1) fehler.push(`Banner gesamt ${banner.length}`)
  if (fremd.length !== 0) fehler.push(`Fremd nach Cleanup ${fremd.join(',')}`)
  writeFileSync(join(beweis, 'bericht.json'), JSON.stringify({ fehler, banner: banner.length, fremd }, null, 2))
  if (fehler.length) {
    console.error(fehler.join('\n'))
    process.exit(1)
  }
  console.log('harness ok')
}

void main()
