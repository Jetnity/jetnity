import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { mountN12ChronologieHarness } from '@/lib/trips/n12-chronology-1/harness'

test('the chronology harness stays on the test import path', () => {
  assert.equal(typeof mountN12ChronologieHarness, 'function')
})

const BREITEN = [
  { name: '320', width: 320, height: 568 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
] as const

async function projektCss(): Promise<string> {
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
  return ergebnis.css.replaceAll('</style', '<\\/style')
}

async function bundeln(): Promise<string> {
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['lib/trips/n12-chronology-1/harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: join(mkdtempSync(join(tmpdir(), 'n12-chronology-1-')), 'harness.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [
      {
        name: 'n12-shims',
        setup(build) {
          build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'n12-leer' }))
          build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'n12-leer' }))
          build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), {
            resolveDir: process.cwd(),
            kind: args.kind,
          }))
          build.onLoad({ filter: /.*/, namespace: 'n12-leer' }, () => ({
            contents: 'export default function(){return null};export const useRouter=()=>({push(){},replace(){}});export const usePathname=()=>"/";export const useSearchParams=()=>new URLSearchParams();',
            loader: 'js',
          }))
        },
      },
    ],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('chronology harness bundle was empty')
  return js
}

function html(css: string, js: string) {
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
}

const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']

function playwrightChromiumFehlt(fehler: unknown) {
  const meldung = fehler instanceof Error ? fehler.message : String(fehler)
  return meldung.includes("Executable doesn't exist")
}

async function browserStarten() {
  try {
    const gestartet = await chromium.launch({ headless: true, args: BROWSER_ARGS })
    return { browser: gestartet, kanal: 'playwright-chromium' as const }
  } catch (fehler) {
    if (!playwrightChromiumFehlt(fehler)) throw fehler
    const gestartet = await chromium.launch({ headless: true, channel: 'chrome', args: BROWSER_ARGS })
    return { browser: gestartet, kanal: 'chrome' as const }
  }
}

async function tagesfolge(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const sichtbar = (el: Element) => el instanceof HTMLElement && el.getClientRects().length > 0
    return [...document.querySelectorAll('[data-timeline-tag]')].filter(sichtbar).map((el) => el.getAttribute('data-timeline-tag') ?? '')
  })
}

describe('mounted chronological trip days', { timeout: 180_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string
  let browserKanal = ''

  before(async () => {
    const css = await projektCss()
    const js = await bundeln()
    const dokument = html(css, js)
    server = createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(dokument)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const adresse = server.address() as AddressInfo
    origin = `http://127.0.0.1:${adresse.port}`
    const gestartet = await browserStarten()
    browser = gestartet.browser
    browserKanal = gestartet.kanal
    assert.match(browser.version(), /^\d+\.\d+/)
    console.log(`n12-browser kanal=${browserKanal} version=${browser.version()}`)
  })

  after(async () => {
    await browser?.close()
    if (server) {
      await new Promise<void>((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve())))
    }
  })

  async function oeffnen(breite: number, hoehe: number, schrift: string, quelle: 'gast' | 'konto') {
    const context = await browser.newContext({ viewport: { width: breite, height: hoehe } })
    const page = await context.newPage()
    const fehler: string[] = []
    const netz: string[] = []
    page.on('pageerror', (error) => fehler.push(error.message))
    page.on('request', (request) => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') netz.push(request.url())
    })
    await page.goto(`${origin}/?quelle=${quelle}`, { waitUntil: 'networkidle' })
    await page.evaluate((groesse) => {
      document.documentElement.style.fontSize = groesse
    }, schrift)
    await page.waitForSelector('[data-plan-chronologie="tag-zuerst"]')
    return { context, page, fehler, netz }
  }

  for (const viewport of BREITEN) {
    for (const schrift of ['16px', '32px'] as const) {
      test(`Tag 1 bis Tag 22 bleiben sichtbar bei ${viewport.name} und ${schrift}`, async () => {
        const { context, page, fehler, netz } = await oeffnen(viewport.width, viewport.height, schrift, 'gast')
        try {
          const folge = await tagesfolge(page)
          assert.deepEqual(folge, Array.from({ length: 22 }, (_, index) => `day-${index + 1}`))
          const kopf = await page.locator('[data-plan-lauf-name]').filter({ visible: true }).allInnerTexts()
          assert.deepEqual(kopf, [
            'Reisetag mit geplantem Flug/Transfer',
            'Bangkok',
            'Reisetag mit geplantem Flug/Transfer',
            'Chiang Mai',
            'Reisetag mit geplantem Flug/Transfer',
          ])
          const uebersicht = await page.locator('[data-plan-etappen-uebersicht] strong').allInnerTexts()
          assert.deepEqual(uebersicht, ['Bangkok', 'Chiang Mai', 'Noch keinem Ziel zugeordnet'])
          const zaehler = page.locator('[data-plan-tag-zaehler]')
          assert.equal((await zaehler.innerText()).trim(), 'Tag 1 von 22')
          const naechster = page.locator('[data-plan-tag-naechster]')
          const vorher = page.locator('[data-plan-tag-vorher]')
          const naechsterBox = await naechster.boundingBox()
          const vorherBox = await vorher.boundingBox()
          assert.ok(naechsterBox && naechsterBox.height >= 44 && naechsterBox.width >= 44)
          assert.ok(vorherBox && vorherBox.height >= 44 && vorherBox.width >= 44)
          assert.equal(await vorher.isDisabled(), true)
          await naechster.focus()
          assert.equal(await naechster.evaluate((el) => el === document.activeElement), true)
          await page.keyboard.press('Enter')
          await page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 2 von 22'))
          assert.equal(await page.locator('[data-plan-reisehinweis="fortsetzung"]').count(), 1)
          assert.equal(await page.locator('[data-plan-punkt="flight-out"]').count(), 0)
          await page.locator('[data-timeline-tag="day-11"]').filter({ visible: true }).click()
          await page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 11 von 22'))
          assert.equal(await page.locator('[data-plan-punkt="transfer-11"]').count(), 1)
          assert.equal(await page.locator('[data-plan-punkt="stay-11"]').count(), 1)
          await page.locator('[data-timeline-tag="day-22"]').filter({ visible: true }).click()
          await page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 22 von 22'))
          assert.equal(await page.locator('[data-plan-tag-naechster]').isDisabled(), true)
          await page.locator('[data-plan-tag-vorher]').click()
          await page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 21 von 22'))
          const ueberlauf = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
          assert.equal(ueberlauf, true)
          assert.deepEqual(netz, [])
          assert.deepEqual(fehler, [])
        } finally {
          await context.close()
        }
      })
    }
  }

  test('Gast und Konto zeigen dieselbe sichtbare Tagesfolge', async () => {
    const gast = await oeffnen(390, 844, '16px', 'gast')
    const konto = await oeffnen(390, 844, '16px', 'konto')
    try {
      assert.equal(await gast.page.locator('[data-plan-quelle]').getAttribute('data-plan-quelle'), 'gast')
      assert.equal(await konto.page.locator('[data-plan-quelle]').getAttribute('data-plan-quelle'), 'konto')
      assert.deepEqual(await tagesfolge(gast.page), await tagesfolge(konto.page))
      assert.deepEqual(gast.fehler, [])
      assert.deepEqual(konto.fehler, [])
    } finally {
      await gast.context.close()
      await konto.context.close()
    }
  })
})
