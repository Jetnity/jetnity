// Native browser execution of actual product markup/components and CSS.
// Run by existing core CI selection. Synthetic data only: this is not login,
// database-query or saved-preference proof. No hosted IO is permitted.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { after, before, test, type TestContext } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'
import AccountBuchungen, { BuchungenLadeanzeige } from '@/components/account/AccountBuchungen'
import { analyticsRange } from '@/lib/admin/analytics/report'
import { ausProblem } from '@/lib/admin/ladezustand'
import type { UiSprache } from '@/lib/localization/ui-sprache'
import type { DisplayFixtureBoot } from '@/scripts/account-admin-display-2/harness'
import { analyticsFixture, bookingsFixture, ORIGINAL_DIAGNOSTIC, type AnalyticsFixtureState, type BookingsFixtureState } from './fixtures'

type Fixture = {
  surface: DisplayFixtureBoot['surface']; sprache: UiSprache
  analytics: AnalyticsFixtureState; bookings: BookingsFixtureState
  loads: number; allowedLoads: number; requests: string[]; violations: string[]
}
const fixtures = new Map<string, Fixture>()
let server: Server | undefined
let browser: Browser | undefined
let origin = ''

before(async () => {
  const require = createRequire(import.meta.url)
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwind = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(process.cwd(), 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({
      absWorkingDir: process.cwd(), entryPoints: ['scripts/account-admin-display-2/harness.tsx'],
      bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', alias: { '@': process.cwd() },
      define: {
        'process.env.NODE_ENV': '"development"',
        'process.env.__NEXT_ROUTER_BASEPATH': '""',
        'process.env.__NEXT_I18N_SUPPORT': 'false',
        'process.env.__NEXT_TRAILING_SLASH': 'false',
        'process.env.__NEXT_MANUAL_TRAILING_SLASH': 'false',
        'process.env.__NEXT_MANUAL_CLIENT_BASE_PATH': 'false',
        'process.env.__NEXT_LINK_NO_TOUCH_START': 'false',
      },
      banner: { js: 'var __name=(target)=>target;' },
    }),
    postcss([nesting(), tailwind(require(join(process.cwd(), 'tailwind.config.js'))), autoprefixer()])
      .process(readFileSync(from, 'utf8'), { from }),
  ])
  assert.doesNotMatch(bundle.outputFiles[0].text, /\bprocess\s*\.\s*env\b/, 'Next build constants must be replaced explicitly')
  const script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')
  const style = css.css.replaceAll('</style', '<\\/style')
  server = createServer((request, response) => {
    const id = request.headers['x-jetnity-display-fixture']
    const fixture = typeof id === 'string' ? fixtures.get(id) : undefined
    const url = new URL(request.url ?? '/', 'http://fixture.invalid')
    const expectedPath = fixture?.surface === 'analytics' ? '/admin/analytics'
      : fixture?.surface === 'bookings' ? '/account/bookings' : `/proof/${fixture?.surface}`
    if (!fixture || request.method !== 'GET' || url.pathname !== expectedPath) {
      response.writeHead(404).end('Unknown synthetic display fixture')
      return
    }
    fixture.loads += 1
    fixture.requests.push(url.pathname + url.search)
    const range = analyticsRange(url.searchParams.get('tage') ?? undefined)
    const boot: DisplayFixtureBoot = {
      surface: fixture.surface, sprache: fixture.sprache, documentId: `${id}:${fixture.loads}`,
      ...(fixture.surface === 'analytics' ? { report: analyticsFixture(fixture.analytics, range.range), invalidRange: !range.valid } : {}),
      ...(fixture.surface === 'error' ? { fehler: ausProblem({ status: 503, message: ORIGINAL_DIAGNOSTIC }) } : {}),
    }
    // AccountBuchungen is a real Server Component. Keeping its Node-only query
    // contract on the server avoids a fake browser implementation or a shim.
    const markup = fixture.surface === 'bookings'
      ? renderToStaticMarkup(createElement('main', { className: 'min-w-0 px-4 py-10' },
        createElement('div', { className: 'mx-auto min-w-0 max-w-3xl' },
          createElement(AccountBuchungen, { ansicht: bookingsFixture(fixture.bookings), sprache: fixture.sprache }))))
      : fixture.surface === 'loading' ? renderToStaticMarkup(createElement(BuchungenLadeanzeige, { sprache: fixture.sprache })) : ''
    const json = JSON.stringify(boot).replaceAll('<', '\\u003c')
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(`<!doctype html><html lang="${fixture.sprache}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Synthetic display proof</title><style>${style}</style></head><body><div id="root">${markup}</div><script>window.__displayFixtureBoot=${json};${script}</script></body></html>`)
  })
  await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(0, '127.0.0.1', resolve) })
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  } catch (error) {
    if (!(error instanceof Error) || !/Executable doesn't exist/.test(error.message)) throw error
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }
}, { timeout: 90_000 })

after(async () => {
  await browser?.close()
  if (server?.listening) await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()))
})

async function open(t: TestContext, options: {
  surface: Fixture['surface']; sprache?: UiSprache; width?: number; analytics?: AnalyticsFixtureState; bookings?: BookingsFixtureState
}) {
  const fixture: Fixture = {
    surface: options.surface, sprache: options.sprache ?? 'en',
    analytics: options.analytics ?? 'ready', bookings: options.bookings ?? 'liste',
    loads: 0, allowedLoads: 1, requests: [], violations: [],
  }
  const id = randomUUID()
  fixtures.set(id, fixture)
  const page = await browser!.newPage({ viewport: { width: options.width ?? 1280, height: 900 } })
  page.setDefaultTimeout(7_000)
  // Synthetic fixture selection only; this is never an Auth credential.
  await page.setExtraHTTPHeaders({ 'x-jetnity-display-fixture': id })
  const path = fixture.surface === 'analytics' ? '/admin/analytics?tage=7'
    : fixture.surface === 'bookings' ? '/account/bookings' : `/proof/${fixture.surface}`
  const pathname = new URL(path, origin).pathname
  page.on('pageerror', (error) => { fixture.violations.push(`Runtime: ${error.message}`); t.diagnostic(error.stack ?? error.message) })
  page.on('console', (message) => { if (message.type() === 'error') fixture.violations.push(`Console: ${message.text()}`) })
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const expected = request.method() === 'GET' && request.isNavigationRequest() && request.resourceType() === 'document'
      && request.frame() === page.mainFrame() && url.origin === origin && url.pathname === pathname && fixture.loads < fixture.allowedLoads
    if (expected) await route.continue()
    else { fixture.violations.push(`Network: ${request.method()} ${url.origin}${url.pathname}`); await route.abort() }
  })
  await page.exposeFunction('__recordDisplayViolation', (message: string) => { fixture.violations.push(message) })
  const installIsolation = () => {
    const buffer: string[] = []
    window.__displayBlockedOperations = buffer
    const record = (kind: string) => { buffer.push(kind); void window.__recordDisplayViolation(kind) }
    const deny = (kind: string): never => { record(kind); throw new Error(`Forbidden display IO: ${kind}`) }
    for (const key of ['localStorage', 'sessionStorage', 'indexedDB', 'caches']) {
      Object.defineProperty(window, key, { configurable: true, get() { return deny(`Storage: ${key}`) } })
    }
    Object.defineProperty(document, 'cookie', { configurable: true,
      get() { return deny('Storage: cookie read') }, set() { deny('Storage: cookie write') },
    })
    window.fetch = async () => deny('Network: fetch')
    for (const key of ['XMLHttpRequest', 'WebSocket', 'EventSource']) {
      Object.defineProperty(window, key, { configurable: true, value: function () { deny(`Network: ${key}`) } })
    }
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => { record('Network: sendBeacon'); return false } })
    window.open = () => { record('Navigation: window.open'); return null }
  }
  // One ordered init script, including reload: tsx helper first, then callbacks.
  await page.addInitScript({ content: `globalThis.__name=(target)=>target;(${installIsolation.toString()})();` })
  t.after(async () => {
    try {
      if (!page.isClosed()) for (const entry of await page.evaluate(() => window.__displayBlockedOperations ?? [])) {
        if (!fixture.violations.includes(entry)) fixture.violations.push(entry)
      }
      assert.deepEqual(fixture.violations, [], 'Only explicit native document navigation is allowed; no storage or transport IO')
      assert.equal(fixture.loads, fixture.allowedLoads)
    } finally { await page.close(); fixtures.delete(id) }
  })
  const response = await page.goto(origin + path)
  assert.equal(response?.status(), 200)
  await page.waitForFunction(() => Boolean(window.__displayProof))
  await page.locator('main').waitFor()
  return { page, fixture }
}

async function scaleAndCheck(page: Page, factor: number) {
  const bounds = await page.evaluate(async (scale) => {
    document.documentElement.style.fontSize = `${16 * scale}px`
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    const controls = [...document.querySelectorAll('main button, main input, main select, main a, main summary')]
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return { text: element.textContent?.slice(0, 70), x: rect.x, width: rect.width, height: rect.height }
      })
    return { width: innerWidth, scroll: document.documentElement.scrollWidth, controls }
  }, factor)
  assert.ok(bounds.scroll <= bounds.width + 1, `Page overflow at ${factor}x: ${JSON.stringify(bounds)}`)
  for (const control of bounds.controls) {
    assert.ok(control.x >= -1 && control.x + control.width <= bounds.width + 1 && control.height >= 44,
      `Control leaves the viewport or touch target at ${factor}x: ${JSON.stringify(control)}`)
  }
}

for (const sprache of ['de', 'en'] as const) for (const width of [320, 1280]) {
  test(`Analytics ${sprache} at ${width}px retains exact data, keyboard range navigation and explicit reload`, { timeout: 30_000 }, async (t) => {
    const { page, fixture } = await open(t, { surface: 'analytics', sprache, width })
    await page.getByRole('heading', { name: sprache === 'en' ? 'Trip activity' : 'Reiseaktivität', exact: true }).waitFor()
    await page.locator('summary').click()
    assert.equal(await page.locator('tbody tr').count(), 7)
    assert.deepEqual(await page.locator('tbody td').allTextContents(), ['1', '2', '3', '4', '5', '6', '7'])
    for (const scale of [1, 2]) await scaleAndCheck(page, scale)
    const range = page.getByRole('link', { name: sprache === 'en' ? '30 days' : '30 Tage', exact: true })
    await range.focus()
    fixture.allowedLoads += 1
    await Promise.all([page.waitForURL('**/admin/analytics?tage=30'), page.keyboard.press('Enter')])
    await page.getByRole('heading', { name: sprache === 'en' ? 'Trip activity' : 'Reiseaktivität', exact: true }).waitFor()
    assert.equal(await page.locator('tbody tr').count(), 30)
    const previous = await page.evaluate(() => window.__displayProof.documentId)
    fixture.allowedLoads += 1
    await page.getByRole('button', { name: sprache === 'en' ? 'Refresh view' : 'Ansicht aktualisieren', exact: true }).click()
    await page.waitForFunction((before) => Boolean(window.__displayProof?.documentId && window.__displayProof.documentId !== before), previous)
    await page.getByRole('heading', { name: sprache === 'en' ? 'Trip activity' : 'Reiseaktivität', exact: true }).waitFor()
    assert.ok(page.url().endsWith('?tage=30'))
  })

  test(`Bookings ${sprache} at ${width}px keeps readable labels and native GET values`, { timeout: 30_000 }, async (t) => {
    const { page, fixture } = await open(t, { surface: 'bookings', sprache, width })
    await page.getByRole('heading', { name: sprache === 'en' ? 'Confirmed bookings' : 'Bestätigte Buchungen', exact: true }).waitFor()
    assert.equal(await page.locator('[data-buchungen]').getAttribute('lang'), sprache)
    await page.getByText('Synthetischer Flug & eigener Titel', { exact: true }).waitFor()
    assert.equal(await page.getByRole('link', { name: sprache === 'en' ? 'Open plan item' : 'Planpunkt öffnen', exact: true }).count(), 1)
    for (const scale of [1, 2]) await scaleAndCheck(page, scale)
    await page.locator('[name=titel]').fill('Eigener Titel & mehr')
    await page.locator('[name=art]').selectOption('rental_car')
    await page.locator('[name=archiv]').selectOption('archiviert')
    await page.getByRole('button', { name: sprache === 'en' ? 'Search' : 'Suchen', exact: true }).focus()
    fixture.allowedLoads += 1
    await Promise.all([page.waitForURL('**/account/bookings?**'), page.keyboard.press('Enter')])
    const submitted = new URL(page.url())
    assert.deepEqual([...submitted.searchParams], [['titel', 'Eigener Titel & mehr'], ['art', 'rental_car'], ['archiv', 'archiviert']])
    // This assertion proves real form serialization, not a database filter query.
    assert.equal(fixture.requests.length, 2)
  })
}

test('English original error and unavailable data cannot become a zero-count claim', { timeout: 30_000 }, async (t) => {
  const { page, fixture } = await open(t, { surface: 'analytics', analytics: 'unavailable' })
  await page.getByText(/Operational figures are unavailable/).first().waitFor()
  assert.equal(await page.locator('dd').count(), 0)
  assert.doesNotMatch(await page.locator('main').innerText(), /No new trips were recorded/)
  fixture.analytics = 'partial'
  fixture.allowedLoads += 1
  await page.reload()
  await page.getByRole('alert').waitFor()
  assert.match(await page.getByRole('alert').innerText(), /Synthetischer Quellfehler <unverändert>/)
  assert.match(await page.getByRole('alert').innerText(), /Trying again may help/)
  assert.equal(await page.locator('tbody tr').count(), 7)
  fixture.analytics = 'zero'
  fixture.allowedLoads += 1
  await page.reload()
  await page.getByText('No new trips were recorded in this period.', { exact: true }).waitFor()
  assert.deepEqual(await page.locator('dd').allTextContents(), ['0', '0', '0'])
  assert.equal(await page.getByRole('alert').count(), 0)
})

test('English retry framing preserves the explicit action and pending disabled state', { timeout: 30_000 }, async (t) => {
  const { page } = await open(t, { surface: 'error', width: 320 })
  await page.getByRole('alert').waitFor()
  assert.match(await page.getByRole('alert').innerText(), /The displayed data is older/)
  const retry = page.getByRole('button', { name: 'Try again', exact: true })
  await retry.focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => window.__displayProof.retries() === 1)
  assert.equal(await retry.isDisabled(), true)
})

for (const sprache of ['de', 'en'] as const) {
  test(`Bookings loading ${sprache} uses the actual route presentation at 320px and 200% text`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { surface: 'loading', sprache, width: 320 })
    await page.getByRole('status').getByText(sprache === 'en' ? 'Loading bookings.' : 'Buchungen werden geladen.', { exact: true }).waitFor()
    assert.equal(await page.locator('main').getAttribute('lang'), sprache)
    assert.equal(await page.locator('[aria-busy=true][aria-live=polite]').count(), 1)
    await scaleAndCheck(page, 2)
  })
}
