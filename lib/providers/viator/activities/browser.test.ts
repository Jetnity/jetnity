import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { mountViatorHarness } from '@/lib/providers/viator/activities/browser-harness'

test('the browser harness stays imported for reachability', () => {
  assert.equal(typeof mountViatorHarness, 'function')
})

const ARTIFACTS = process.env.VIATOR_S2_ARTIFACT_DIR ?? join(tmpdir(), 'viator-s2')

async function css(): Promise<string> {
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

async function bundle(): Promise<string> {
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['lib/providers/viator/activities/browser-harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};' },
    plugins: [{
      name: 'viator-shims',
      setup(build) {
        build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'leer' }))
        build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'leer' }))
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'leer' }, () => ({ contents: 'export default function(){return null}', loader: 'js' }))
      },
    }],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('Viator harness bundle was empty')
  return js
}

describe('Viator activities browser harness', { timeout: 180_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string

  before(async () => {
    mkdirSync(ARTIFACTS, { recursive: true })
    const style = await css()
    const script = await bundle()
    const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${style}</style></head><body><div id="root"></div><script>${script}</script></body></html>`
    server = createServer((_req, res) => {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(html)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    } catch (fehler) {
      const meldung = fehler instanceof Error ? fehler.message : String(fehler)
      if (!meldung.includes("Executable doesn't exist")) throw fehler
      browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    }
  })

  after(async () => {
    await browser?.close()
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  })

  async function seite(breite: number): Promise<Page> {
    const page = await browser.newPage({ viewport: { width: breite, height: 900 } })
    let checks = 0
    let releaseFirst: (() => void) | null = null
    const gesendet: Array<{ currency?: string | null; productOptionCode?: string; startTime?: string }> = []
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin !== origin) return route.abort()
      if (url.pathname === '/viator-local.png') {
        return route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
        })
      }
      if (url.pathname === '/api/activities/search') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'ok',
            message: 'Aktivitäten gefunden.',
            options: [{
              id: 'viator:10001P1',
              provider: 'viator',
              externalRef: '10001P1',
              title: 'Spaziergang durch die Altstadt',
              description: null,
              locationName: null,
              punkt: null,
              dauerMinuten: 90,
              timeslot: null,
              preis: 42,
              preisWaehrung: 'EUR',
              bewertung: null,
              bewertungenAnzahl: null,
              stornierbar: null,
              kategorien: [],
              tags: [],
              bildUrl: '/viator-local.png',
              preisRolle: 'rrp_from',
              labels: [],
              reasons: [],
              konflikt: 'unbekannt',
            }],
          }),
        })
      }
      if (url.pathname === '/api/activities/viator/detail') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'ok',
            message: 'Details geladen.',
            value: {
              productCode: '10001P1',
              title: 'Spaziergang',
              description: 'Kurzbeschreibung.',
              imageUrl: '/viator-local.png',
              price: null,
              productOptionCodes: ['TG1', 'TG2'],
              productOptions: [{ code: 'TG1', title: 'Morgentour' }, { code: 'TG2', title: 'Abendtour' }],
              ageBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }],
              productUrl: 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api',
            },
          }),
        })
      }
      if (url.pathname === '/api/activities/viator/schedule') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'ok',
            message: 'Kalenderhinweis.',
            value: {
              productCode: '10001P1',
              supplierCurrency: 'EUR',
              options: [{
                productOptionCode: 'TG1',
                seasons: [{
                  startDate: '2026-11-01',
                  endDate: '2026-11-30',
                  startTimes: ['10:00'],
                  unavailableDates: [],
                  timedEntries: [{ startTime: '10:00', unavailableDates: [] }],
                }],
              }, {
                productOptionCode: 'TG2',
                seasons: [{
                  startDate: '2026-11-01',
                  endDate: '2026-11-30',
                  startTimes: ['18:00'],
                  unavailableDates: [],
                  timedEntries: [{ startTime: '18:00', unavailableDates: [] }],
                }],
              }],
            },
          }),
        })
      }
      if (url.pathname === '/api/activities/viator/check') {
        checks += 1
        const aktuell = checks
        const roh = route.request().postData()
        if (roh) gesendet.push(JSON.parse(roh) as { currency?: string | null; productOptionCode?: string; startTime?: string })
        if (aktuell === 1) await new Promise<void>((resolve) => { releaseFirst = resolve })
        try {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              status: 'ok',
              message: aktuell === 1 ? 'alte Prüfung' : 'neue Prüfung',
              value: { available: true, price: { amount: aktuell === 1 ? 111 : 80, currency: 'EUR', checkoutCurrencyConfirmed: false } },
            }),
          })
        } catch {
          return
        }
        return
      }
      return route.continue()
    })
    await page.goto(origin)
    await page.getByRole('button', { name: 'Für diesen Tag suchen' }).click()
    await page.getByRole('button', { name: 'Angebot prüfen' }).click()
    await page.getByRole('button', { name: 'Verfügbarkeit prüfen' }).waitFor()
    page.once('close', () => releaseFirst?.())
    Object.assign(page, { releaseFirst: () => releaseFirst?.(), gesendet })
    return page
  }

  test('search, selection and a late quote do not survive a changed date', async () => {
    const page = await seite(390)
    const träger = page as Page & { gesendet: Array<{ currency?: string | null; productOptionCode?: string; startTime?: string }> }
    await page.getByLabel('Option').waitFor()
    assert.equal(await page.getByLabel('Option').inputValue(), '')
    await page.getByLabel('Option').selectOption({ label: 'Morgentour' })
    await page.getByText('Angefragte Anzeigewährung: CHF').waitFor()
    await page.getByLabel('Erwachsene Anzahl').fill('2')
    await page.getByRole('button', { name: 'Verfügbarkeit prüfen' }).click()
    for (let i = 0; i < 50 && träger.gesendet.length < 1; i += 1) await page.waitForTimeout(20)
    assert.equal(träger.gesendet[0]?.currency, 'CHF')
    assert.equal(träger.gesendet[0]?.productOptionCode, 'TG1')
    assert.equal(träger.gesendet[0]?.startTime, '10:00')
    assert.equal(JSON.stringify(träger.gesendet[0]).includes('DEFAULT'), false)
    await page.getByLabel('Datum').fill('2026-11-03')
    ;(page as Page & { releaseFirst: () => void }).releaseFirst()
    await page.waitForTimeout(50)
    assert.equal(await page.getByText('111').count(), 0)
    assert.equal(await page.getByText('alte Prüfung').count(), 0)
    await page.getByRole('button', { name: 'Verfügbarkeit prüfen' }).click()
    await page.getByText('neue Prüfung').waitFor()
    await page.getByText('80').waitFor()
    assert.equal(await page.getByText('111').count(), 0)
    const vorher = await page.locator('h3').first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    const nachher = await page.locator('h3').first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
    assert.ok(nachher > vorher)
    await page.keyboard.press('Tab')
    const mass = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    assert.ok(mass.scroll <= mass.client + 1)
    await page.screenshot({ path: join(ARTIFACTS, 'viator-390.png'), fullPage: true })
    await page.close()
    for (const breite of [320, 768, 1440]) {
      const weitere = await seite(breite)
      const kante = await weitere.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      assert.ok(kante.scroll <= kante.client + 1, `${breite}`)
      await weitere.screenshot({ path: join(ARTIFACTS, `viator-${breite}.png`), fullPage: true })
      await weitere.close()
    }
  })
})
