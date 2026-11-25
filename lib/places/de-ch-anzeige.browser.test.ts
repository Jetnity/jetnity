import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import { chromium, type Browser, type Page } from 'playwright'

import { gleichGefaltet } from '@/lib/airports/normalisieren'
import { flughafenAlsOption } from '@/lib/airports/suche'
import type { OrtZeile } from '@/lib/places/abbildung'
import { placesSuchen } from '@/lib/places/suche-lauf'
import { DeChAnzeigeHarness } from '@/lib/places/de-ch-anzeige-harness'

void DeChAnzeigeHarness

const BREITEN = [320, 390, 1280] as const
const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']

function oderTeile(filter: string): string[] {
  const teile: string[] = []
  let tiefe = 0
  let start = 0
  let quote = false
  for (let i = 0; i < filter.length; i += 1) {
    const zeichen = filter[i]
    if (zeichen === '"') quote = !quote
    else if (!quote && zeichen === '(') tiefe += 1
    else if (!quote && zeichen === ')') tiefe -= 1
    else if (!quote && tiefe === 0 && zeichen === ',') {
      teile.push(filter.slice(start, i))
      start = i + 1
    }
  }
  teile.push(filter.slice(start))
  return teile.map((teil) => teil.trim()).filter((teil) => teil.length > 0)
}

function literale(roh: string): string {
  if (roh.startsWith('"') && roh.endsWith('"')) return JSON.parse(roh) as string
  return roh
}

function zeilePasst(zeile: OrtZeile, ausdruck: string): boolean {
  if (ausdruck.startsWith('and(') && ausdruck.endsWith(')')) {
    return oderTeile(ausdruck.slice(4, -1)).every((teil) => zeilePasst(zeile, teil))
  }
  const ilike = /^(name|keywords)\.ilike\.(.+)$/.exec(ausdruck)
  if (ilike) {
    const roh = ilike[2] ?? ''
    const muster = literale(roh).replaceAll('%', '')
    const schluessel = typeof zeile.keywords === 'string' ? zeile.keywords : Array.isArray(zeile.keywords) ? zeile.keywords.join(', ') : ''
    const feld = ilike[1] === 'name' ? zeile.name : schluessel
    if (!roh.includes('%')) return gleichGefaltet(feld, muster)
    if (roh.startsWith('%')) return feld.toLocaleLowerCase('de').includes(muster.toLocaleLowerCase('de'))
    return feld.toLocaleLowerCase('de').startsWith(muster.toLocaleLowerCase('de'))
  }
  const gleich = /^(typ|country_code|iata)\.eq\.(.+)$/.exec(ausdruck)
  if (gleich) {
    const wert = literale(gleich[2] ?? '')
    if (gleich[1] === 'typ') return zeile.typ === wert
    if (gleich[1] === 'country_code') return zeile.country_code === wert
    return (zeile.iata ?? '').toUpperCase() === wert.toUpperCase()
  }
  return false
}

const WIEN: OrtZeile = {
  id: 'geonames:2761369', source: 'geonames', source_id: '2761369', name: 'Vienna', typ: 'city',
  country: 'Austria', country_code: 'AT', region: null, lat: 48.20849, lon: 16.37208, iata: null,
  keywords: 'Vienna, Vienne', population: 1_900_000, feature_code: 'PPLC',
}
const VIENNA_US: OrtZeile = {
  ...WIEN, id: 'geonames:4730000', source_id: '4730000', country: 'United States', country_code: 'US',
  keywords: 'Vienna', population: 20_000, lat: 38.9, lon: -77.26,
}

async function ortsAntwort(suche: string) {
  const ergebnis = await placesSuchen(suche, 'ziel', async (_art, filter, limit) => ({
    zeilen: [WIEN, VIENNA_US].filter((zeile) => oderTeile(filter).some((teil) => zeilePasst(zeile, teil))).slice(0, limit),
    problem: null,
  }))
  assert.equal(ergebnis.problem, null)
  return ergebnis.optionen ?? []
}

const FLUGHAFEN = flughafenAlsOption({
  iata: 'VIE', icao: 'LOWW', name: 'Vienna International Airport', city: 'Vienna',
  country: 'Austria', country_code: 'AT',
})

function playwrightChromiumFehlt(fehler: unknown): boolean {
  return fehler instanceof Error && fehler.message.includes("Executable doesn't exist")
}

async function browserStarten() {
  try {
    return await chromium.launch({ headless: true, args: BROWSER_ARGS })
  } catch (fehler) {
    if (!playwrightChromiumFehlt(fehler)) throw fehler
    return chromium.launch({ headless: true, channel: 'chrome', args: BROWSER_ARGS })
  }
}

async function projektCss() {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as (plugins: unknown[]) => {
    process: (css: string, opts: { from: string }) => Promise<{ css: string }>
  }
  const nesting = verlangen('tailwindcss/nesting') as () => unknown
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => unknown
  const autoprefixer = verlangen('autoprefixer') as () => unknown
  const from = join(process.cwd(), 'styles/globals.css')
  const config = verlangen(join(process.cwd(), 'tailwind.config.js')) as unknown
  const ergebnis = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(from, 'utf8'), { from })
  const dateien = [
    'components/workspace/workspace.css',
    'components/workspace/workspace-surfaces.css',
    'components/trips/reiseplan/etappen.css',
    'components/trips/organisieren/organisieren.css',
    'components/trips/organisieren/hotelsuche.css',
    'components/trips/organisieren/fluege/flugsuche.css',
    'styles/white-mint.css',
  ]
  const extra = dateien.map((datei) => readFileSync(join(process.cwd(), datei), 'utf8')).join('\n')
  return `${ergebnis.css}\n${extra}`.replaceAll('</style', '<\\/style')
}

async function bundeln() {
  const esbuild = createRequire(import.meta.url)('esbuild') as typeof import('esbuild')
  const wurzel = process.cwd()
  const gebaut = await esbuild.build({
    absWorkingDir: wurzel,
    entryPoints: ['lib/places/de-ch-anzeige-harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [{
      name: 'de-ch-shims',
      setup(build) {
        const shim = join(wurzel, 'lib/ui/white-mint-home-workspace-1')
        build.onResolve({ filter: /^next\/link$/ }, () => ({ path: join(shim, 'link.tsx') }))
        build.onResolve({ filter: /^next\/image$/ }, () => ({ path: join(shim, 'image.tsx') }))
        build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: join(shim, 'navigation.tsx') }))
        build.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: join(shim, 'dynamic-stub.tsx') }))
        build.onResolve({ filter: /^@\/lib\/places\/aktionen$/ }, () => ({ path: join(shim, 'server-action-stub.ts') }))
        build.onResolve({ filter: /\.css$/ }, () => ({ path: 'leer.css', namespace: 'css-leer' }))
        build.onLoad({ filter: /.*/, namespace: 'css-leer' }, () => ({ contents: '', loader: 'js' }))
        build.onResolve({ filter: /^@\// }, (args) => {
          if (args.path === '@/lib/places/aktionen') return { path: join(shim, 'server-action-stub.ts') }
          return build.resolve(join(wurzel, args.path.slice(2)), { resolveDir: wurzel, kind: args.kind })
        })
      },
    }],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('de-CH-Harness blieb leer')
  return js
}

let browser: Browser
let server: Server
let origin = ''
let dokument = ''

async function seite(theme: 'light' | 'dark', breite: number): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: breite, height: 1100 } })
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return route.abort()
    return route.continue()
  })
  await context.addInitScript(`document.addEventListener('DOMContentLoaded', () => { document.body.dataset.theme = ${JSON.stringify(theme)}; });`)
  const page = await context.newPage()
  page.on('pageerror', (fehler) => {
    page.setExtraHTTPHeaders({})
    void fehler
  })
  const fehler: string[] = []
  page.on('pageerror', (error) => fehler.push(error.message))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.evaluate((modus) => { document.body.dataset.theme = modus }, theme)
  await page.waitForSelector('[data-de-ch-harness]')
  ;(page as Page & { __fehler?: string[] }).__fehler = fehler
  return page
}

describe('de-CH-Anzeige in den echten Flächen', () => {
  before(async () => {
    const [css, js, orte] = await Promise.all([projektCss(), bundeln(), ortsAntwort('Wien')])
    assert.equal(orte[0]?.anzeige, 'Wien')
    assert.equal(orte[0]?.label, 'Vienna')
    assert.equal(orte.some((option) => option.id === VIENNA_US.id), false)
    dokument = `<!doctype html><html lang="de-CH"><head><meta charset="utf-8" /><style>${css}</style></head><body data-theme="light"><div id="root"></div><script>${js}</script></body></html>`
    server = createServer((req, antwort) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname === '/api/search/places') {
        antwort.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        antwort.end(JSON.stringify(orte))
        return
      }
      if (url.pathname === '/api/search/airports') {
        antwort.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        antwort.end(JSON.stringify(FLUGHAFEN ? [FLUGHAFEN] : []))
        return
      }
      antwort.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      antwort.end(dokument)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
    browser = await browserStarten()
  })

  after(async () => {
    await browser?.close()
    await new Promise<void>((resolve, reject) => server.close((fehler) => fehler ? reject(fehler) : resolve()))
  })

  for (const theme of ['light', 'dark'] as const) {
    for (const breite of BREITEN) {
      test(`${theme} ${breite}: echte Komponenten, kein abgeschnittener Ortsname`, async () => {
        const page = await seite(theme, breite)
        const flaeche = async (name: string) => page.locator(`[data-flaeche="${name}"]`).innerText()
        const reisen = await flaeche('reisen')
        const etappen = await flaeche('etappen')
        const unterkunft = await flaeche('unterkunft')
        const verbindungen = await flaeche('verbindungen')
        const vorschau = await flaeche('vorschau')
        assert.match(reisen, /Unsere Romreise/)
        assert.match(reisen, /Lissabon/)
        assert.equal(reisen.includes('Lisbon'), false)
        assert.match(etappen, /Lissabon/)
        assert.match(unterkunft, /Lissabon/)
        assert.match(verbindungen, /Lissabon/)
        assert.match(verbindungen, /Vienna/)
        assert.match(vorschau, /Prag/)
        assert.match(vorschau, /Ein Wochenende in Prague/)
        assert.match(vorschau, /Ankommen in Prague/)
        const masse = await page.evaluate(() => {
          const wurzel = document.documentElement
          const namen = [...document.querySelectorAll('[data-flaeche]')].map((knoten) => {
            const feld = knoten as HTMLElement
            return { flaeche: feld.dataset.flaeche ?? '', ueber: feld.scrollWidth - feld.clientWidth }
          })
          return { ueberlauf: wurzel.scrollWidth - wurzel.clientWidth, namen }
        })
        assert.ok(masse.ueberlauf <= 1, `Dokument überläuft um ${masse.ueberlauf}`)
        for (const name of masse.namen) assert.ok(name.ueber <= 1, `${name.flaeche} schneidet ab`)
        const ausgabe = process.env.DE_CH_ANZEIGE_EVIDENCE_DIR?.trim()
        if (ausgabe) {
          mkdirSync(ausgabe, { recursive: true })
          await page.screenshot({ path: join(ausgabe, `de-ch-${theme}-${breite}.png`), fullPage: true })
        }
        await page.context().close()
      })
    }
  }

  test('Ortssuche übernimmt per Klick die Anzeige und behält den Katalognamen', async () => {
    const page = await seite('light', 390)
    await page.locator('#de-ch-ort').fill('Wien')
    await page.getByRole('option', { name: /Wien/ }).click()
    assert.equal(await page.locator('#de-ch-ort').inputValue(), 'Wien')
    assert.equal(await page.locator('[data-kanonisch]').innerText(), 'Vienna')
    assert.equal(await page.locator('[data-anzeige]').innerText(), 'Wien')
    await page.context().close()
  })

  test('Flughafensuche zeigt Wien und übernimmt die IATA, nicht einen übersetzten Abfragewert', async () => {
    const page = await seite('light', 390)
    await page.locator('#de-ch-flug').fill('Wien')
    await page.getByRole('option', { name: /Wien/ }).click()
    assert.equal(await page.locator('[data-iata]').innerText(), 'VIE')
    assert.match(await page.locator('#de-ch-flug').inputValue(), /VIE/)
    await page.context().close()
  })
})
