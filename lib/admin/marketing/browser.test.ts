// Actual MarketingLinks component + production CSS. Only the explicit UUID
// and Clipboard ports are controlled; no real account, campaign or OS write.
// Selected by the existing Core lib/**/*.test.ts glob with no optional skip.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { after, before, test, type TestContext } from 'node:test'
import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'
import type { MarketingFixtureBoot } from '@/scripts/admin-marketing-links-1/harness'

type Language = 'de' | 'en'
type Destination = 'home' | 'planning' | 'inspiration'
type Channel = 'newsletter' | 'instagram' | 'partner' | 'qr'
type Fixture = { boot: Omit<MarketingFixtureBoot, 'documentId'>; loads: number; allowedLoads: number; violations: string[] }
const fixtures = new Map<string, Fixture>()
let server: Server | undefined
let browser: Browser | undefined
let origin = ''
const CLOCK_START = new Date('2026-11-15T12:00:00.000Z')
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'
const E = '55555555-5555-4555-8555-555555555555'

// Independent acceptance oracle: no production constants, builder or parser.
const destinations: Record<Destination, string> = { home: '/', planning: '/planen', inspiration: '/entdecken' }
const channels: Record<Channel, readonly [string, string]> = {
  newsletter: ['newsletter', 'email'], instagram: ['instagram', 'social'],
  partner: ['partner', 'referral'], qr: ['qr', 'offline'],
}
function expected(destination: Destination, channel: Channel, campaign = A, content?: string) {
  const [source, medium] = channels[channel]
  return `https://jetnity.com${destinations[destination]}?utm_source=${source}&utm_medium=${medium}&utm_campaign=cmp-${campaign}${content ? `&utm_content=cnt-${content}` : ''}`
}
const words = {
  de: {
    title: 'Marketing-Links', destination: 'Zielseite', channel: 'Kanal', create: 'Link erstellen',
    campaign: 'Neue Kampagnen-ID', add: 'Varianten-ID hinzufügen', variant: 'Neue Varianten-ID',
    remove: 'Varianten-ID entfernen', reset: 'Zurücksetzen', copy: 'Link kopieren', select: 'Linktext auswählen', url: 'Erstellter Link',
    pending: 'Link wird in die Zwischenablage kopiert …', success: 'Dieser Link wurde in die Zwischenablage kopiert.',
    failure: 'Das Kopieren ist fehlgeschlagen. Du kannst den vollständigen Linktext auswählen und selbst kopieren.',
    missing: 'Automatisches Kopieren ist in diesem Browser nicht verfügbar. Wähle den Linktext aus und kopiere ihn selbst.',
    uncertain: 'Das Kopieren ist noch nicht bestätigt. Du kannst den Linktext selbst auswählen. Der offene Kopiervorgang wird nicht abgebrochen oder wiederholt.',
    selected: 'Der vollständige Linktext ist ausgewählt. Kopiere ihn mit der Kopierfunktion deines Geräts.',
    random: 'Eine sichere Kennung konnte nicht erstellt werden. Es wurde kein neuer Link erzeugt. Versuche die Aktion erneut.',
  },
  en: {
    title: 'Marketing links', destination: 'Destination', channel: 'Channel', create: 'Create link',
    campaign: 'New campaign ID', add: 'Add variant ID', variant: 'New variant ID',
    remove: 'Remove variant ID', reset: 'Reset', copy: 'Copy link', select: 'Select link text', url: 'Generated link',
    pending: 'Copying the link to the clipboard …', success: 'This link was copied to the clipboard.',
    failure: 'Copying failed. You can select the complete link text and copy it yourself.',
    missing: 'Automatic copying is unavailable in this browser. Select the link text and copy it yourself.',
    uncertain: 'Copying has not been confirmed yet. You can select the link text yourself. The outstanding copy is not cancelled or retried.',
    selected: 'The complete link text is selected. Copy it using your device’s copy function.',
    random: 'A secure identifier could not be created. No new link was generated. Try the action again.',
  },
} as const

before(async () => {
  const require = createRequire(import.meta.url)
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwind = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(process.cwd(), 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({
      absWorkingDir: process.cwd(), entryPoints: ['scripts/admin-marketing-links-1/harness.tsx'],
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
  assert.doesNotMatch(bundle.outputFiles[0].text, /\bprocess\s*\.\s*env\b/, 'Unreplaced build constants must fail before browser mounting')
  const script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')
  const style = css.css.replaceAll('</style', '<\\/style')
  server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://fixture.invalid')
    const id = url.searchParams.get('fixture') ?? ''
    const fixture = fixtures.get(id)
    if (!fixture || request.method !== 'GET' || url.pathname !== '/admin/marketing' || [...url.searchParams.keys()].join(',') !== 'fixture') {
      response.writeHead(404).end('Unknown synthetic Marketing fixture')
      return
    }
    fixture.loads += 1
    const boot: MarketingFixtureBoot = { ...fixture.boot, documentId: `${id}:${fixture.loads}` }
    const json = JSON.stringify(boot).replaceAll('<', '\\u003c')
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(`<!doctype html><html lang="${fixture.boot.sprache}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Synthetic Marketing component proof</title><style>${style}</style></head><body><div id="root"></div><script>window.__marketingFixtureBoot=${json};${script}</script></body></html>`)
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

async function open(t: TestContext, options: Partial<MarketingFixtureBoot> & { width?: number; clock?: boolean } = {}) {
  const fixture: Fixture = {
    boot: { sprache: options.sprache ?? 'de', appearance: options.appearance ?? 'light', uuidMode: options.uuidMode ?? 'valid', clipboardMode: options.clipboardMode ?? 'controlled' },
    loads: 0, allowedLoads: 1, violations: [],
  }
  const id = randomUUID()
  fixtures.set(id, fixture)
  const page = await browser!.newPage({ viewport: { width: options.width ?? 1280, height: 900 } })
  page.setDefaultTimeout(7_000)
  const consoleErrors: string[] = []
  let diagnosed = false
  let navigation: { status: number; contentType: string | null } | null = null
  const diagnose = async (stage: string) => {
    diagnosed = true
    let state: unknown
    try {
      state = page.isClosed() ? { closed: true } : await page.evaluate(() => ({
        ready: document.readyState, path: location.pathname, boot: Boolean(window.__marketingFixtureBoot),
        port: typeof window.__recordMarketingViolation, proof: window.__marketingProof?.diagnostics() ?? null,
        headings: [...document.querySelectorAll('h1')].map((node) => node.textContent?.slice(0, 150)),
        text: document.body.innerText.slice(0, 1800), root: document.getElementById('root')?.innerHTML.slice(0, 2500),
      }))
    } catch (error) { state = { unavailable: error instanceof Error ? error.message.slice(0, 800) : String(error).slice(0, 800) } }
    t.diagnostic('MARKETING_FIXTURE_DIAGNOSTIC ' + JSON.stringify({ stage, navigation, state, errors: consoleErrors, violations: fixture.violations.slice(0, 12) }))
  }
  page.on('pageerror', (error) => {
    const detail = (error.stack ?? error.message).slice(0, 2500)
    fixture.violations.push(`Runtime: ${detail}`)
    t.diagnostic('MARKETING_PAGE_ERROR ' + detail)
  })
  page.on('console', (message) => {
    if (message.type() === 'error' && consoleErrors.length < 12) consoleErrors.push(message.text().slice(0, 1500))
  })
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const expectedDocument = request.method() === 'GET' && request.isNavigationRequest() && request.resourceType() === 'document'
      && request.frame() === page.mainFrame() && url.origin === origin && url.pathname === '/admin/marketing'
      && url.search === `?fixture=${id}` && fixture.loads < fixture.allowedLoads
    if (expectedDocument) await route.continue()
    else {
      fixture.violations.push(`Network: ${request.method()} ${url.origin}${url.pathname}`)
      await route.abort()
    }
  })
  await page.exposeFunction('__recordMarketingViolation', (message: string) => { fixture.violations.push(message) })
  // Installed before every document's bundle, including reload. Node retains
  // attempted IO even when the document and its local buffer are replaced.
  await page.addInitScript(() => {
    const buffer: string[] = []
    window.__marketingBlockedOperations = buffer
    const record = (kind: string) => {
      buffer.push(kind)
      void window.__recordMarketingViolation(kind)
    }
    const deny = (kind: string): never => { record(kind); throw new Error(`Forbidden Marketing IO: ${kind}`) }
    for (const key of ['localStorage', 'sessionStorage', 'indexedDB', 'caches']) {
      Object.defineProperty(window, key, { configurable: true, get() { return deny(`Storage: ${key}`) } })
    }
    Object.defineProperty(document, 'cookie', { configurable: true,
      get() { return deny('Storage: cookie read') }, set() { deny('Storage: cookie write') },
    })
    window.fetch = async () => {
      record('Network: fetch')
      await window.__recordMarketingViolation('Network: fetch rejected before transport')
      throw new Error('Forbidden Marketing fetch')
    }
    for (const key of ['XMLHttpRequest', 'WebSocket', 'EventSource']) {
      Object.defineProperty(window, key, { configurable: true, value: function () { deny(`Network: ${key}`) } })
    }
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => { record('Network: sendBeacon'); return false } })
    window.open = () => { record('Navigation: window.open'); return null }
  })
  t.after(async () => {
    try {
      if (!page.isClosed()) {
        const local = await page.evaluate(() => window.__marketingBlockedOperations ?? [])
        for (const violation of local) if (!fixture.violations.includes(violation)) fixture.violations.push(violation)
      }
      if ((fixture.violations.length || consoleErrors.length) && !diagnosed) await diagnose('teardown')
    } finally { await page.close(); fixtures.delete(id) }
    assert.deepEqual(fixture.violations, [], 'Marketing must make no network, navigation or storage attempt')
    assert.deepEqual(consoleErrors, [], 'A rendered component error must fail the fixture')
    assert.equal(fixture.loads, fixture.allowedLoads, 'Only explicitly requested document loads are allowed')
  })
  if (options.clock) await page.clock.install({ time: CLOCK_START })
  try {
    const response = await page.goto(`${origin}/admin/marketing?fixture=${id}`)
    navigation = response ? { status: response.status(), contentType: response.headers()['content-type'] ?? null } : null
    assert.equal(navigation?.status, 200)
    await page.getByRole('heading', { level: 1, name: words[fixture.boot.sprache].title, exact: true }).waitFor()
    assert.equal(await page.locator('[data-marketing-links]').getAttribute('lang'), fixture.boot.sprache)
    if (options.clock) await page.clock.pauseAt(new Date(CLOCK_START.getTime() + 60_000))
  } catch (error) { await diagnose('open'); throw error }
  return { page, fixture }
}

async function calls(page: Page) { return page.evaluate(() => window.__marketingProof.calls()) }
async function uuidCalls(page: Page) { return page.evaluate(() => window.__marketingProof.uuidCalls()) }
async function create(page: Page, language: Language = 'de') {
  await page.getByRole('button', { name: words[language].create, exact: true }).click()
  await page.getByRole('textbox', { name: words[language].url, exact: true }).waitFor()
}
async function urlText(page: Page) { return page.locator('#marketing-url').innerText() }
async function emptyPreview(page: Page) { assert.equal(await page.locator('#marketing-url').count(), 0) }
async function status(page: Page, value: string) {
  await page.locator('#marketing-copy-status').filter({ hasText: value }).waitFor()
  assert.equal(await page.locator('#marketing-copy-status').innerText(), value)
}
async function settle(page: Page, index: number, outcome: 'fulfilled' | 'rejected') {
  await page.evaluate(({ index, outcome }) => window.__marketingProof.settle(index, outcome), { index, outcome })
  await page.locator('#marketing-pending-warning').waitFor({ state: 'detached' })
}
async function startCopy(page: Page, language: Language = 'de') {
  await page.getByRole('button', { name: words[language].copy, exact: true }).click()
  await status(page, words[language].pending)
  await page.locator('#marketing-pending-warning').waitFor()
  return (await calls(page)).length - 1
}

for (const language of ['de', 'en'] as const) {
  test(`Marketing ${language}: opening and editing never generate, copy, navigate or persist implicitly`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: language })
    assert.equal(await uuidCalls(page), 0)
    assert.deepEqual(await calls(page), [])
    await emptyPreview(page)
    await page.getByRole('combobox', { name: words[language].destination, exact: true }).selectOption('planning')
    await page.getByRole('combobox', { name: words[language].channel, exact: true }).selectOption('partner')
    await emptyPreview(page)
    assert.equal(await uuidCalls(page), 0)
    assert.deepEqual(await calls(page), [])
    assert.equal(await page.locator('[data-marketing-links] a[href], [data-marketing-links] iframe').count(), 0)
    const text = await page.locator('[data-marketing-links]').innerText()
    assert.match(text, language === 'de' ? /nicht gespeichert oder gemessen/ : /not stored or measured/)
    assert.match(text, language === 'de' ? /jetnity\.com.*Dev-Vorschau/ : /jetnity\.com.*Development preview/)
  })

  for (const destination of Object.keys(destinations) as Destination[]) for (const channel of Object.keys(channels) as Channel[]) {
    test(`Marketing ${language}: explicit ${destination}/${channel} uses exactly the independent incoming-link contract`, { timeout: 30_000 }, async (t) => {
      const { page } = await open(t, { sprache: language })
      await page.getByRole('combobox', { name: words[language].destination, exact: true }).selectOption(destination)
      await page.getByRole('combobox', { name: words[language].channel, exact: true }).selectOption(channel)
      await create(page, language)
      assert.equal(await urlText(page), expected(destination, channel))
      assert.equal(await uuidCalls(page), 1)
      assert.deepEqual(await calls(page), [])
      assert.deepEqual(await page.locator('[data-marketing-parameters] dt').allTextContents(), ['utm_source', 'utm_medium', 'utm_campaign'])
      assert.deepEqual(await page.locator('[data-marketing-parameters] dd').allTextContents(), [...channels[channel], `cmp-${A}`])
      await create(page, language)
      assert.equal(await urlText(page), expected(destination, channel))
      assert.equal(await uuidCalls(page), 1, 'Recreating a current link must preserve its identifier')
    })
  }

  test(`Marketing ${language}: edits preserve IDs; new and removed variants, new campaign and reset invalidate the old preview`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: language })
    await create(page, language)
    await page.getByRole('button', { name: words[language].add, exact: true }).click()
    await emptyPreview(page)
    await create(page, language)
    assert.equal(await urlText(page), expected('home', 'newsletter', A, B))
    await page.getByRole('combobox', { name: words[language].destination, exact: true }).selectOption('inspiration')
    await page.getByRole('combobox', { name: words[language].channel, exact: true }).selectOption('qr')
    await emptyPreview(page)
    assert.equal(await page.locator('[data-marketing-campaign]').innerText(), `cmp-${A}`)
    assert.equal(await page.locator('[data-marketing-content]').innerText(), `cnt-${B}`)
    await create(page, language)
    assert.equal(await urlText(page), expected('inspiration', 'qr', A, B))
    await page.getByRole('button', { name: words[language].variant, exact: true }).click()
    await emptyPreview(page)
    await create(page, language)
    assert.equal(await urlText(page), expected('inspiration', 'qr', A, C))
    await page.getByRole('button', { name: words[language].remove, exact: true }).click()
    await emptyPreview(page)
    await create(page, language)
    assert.equal(await urlText(page), expected('inspiration', 'qr', A))
    await page.getByRole('button', { name: words[language].add, exact: true }).click()
    await page.getByRole('button', { name: words[language].campaign, exact: true }).click()
    await emptyPreview(page)
    assert.equal(await page.locator('[data-marketing-campaign]').innerText(), `cmp-${E}`)
    assert.doesNotMatch(await page.locator('[data-marketing-content]').innerText(), /cnt-/)
    await create(page, language)
    assert.equal(await urlText(page), expected('inspiration', 'qr', E))
    await page.getByRole('button', { name: words[language].reset, exact: true }).click()
    await emptyPreview(page)
    assert.equal(await page.locator('#marketing-destination').inputValue(), 'home')
    assert.equal(await page.locator('#marketing-channel').inputValue(), 'newsletter')
    assert.doesNotMatch(await page.locator('[data-marketing-campaign]').innerText(), /cmp-/)
    assert.doesNotMatch(await page.locator('[data-marketing-content]').innerText(), /cnt-/)
    assert.equal(await uuidCalls(page), 5)
    assert.deepEqual(await calls(page), [])
  })

  test(`Marketing ${language}: a real document reload discards transient values with no storage access`, { timeout: 30_000 }, async (t) => {
    const { page, fixture } = await open(t, { sprache: language })
    await create(page, language)
    await page.getByRole('button', { name: words[language].add, exact: true }).click()
    await page.locator('#marketing-destination').selectOption('inspiration')
    await page.locator('#marketing-channel').selectOption('instagram')
    await create(page, language)
    const previous = await page.evaluate(() => window.__marketingProof.documentId)
    fixture.allowedLoads += 1
    await page.reload()
    await page.getByRole('heading', { level: 1, name: words[language].title, exact: true }).waitFor()
    assert.notEqual(await page.evaluate(() => window.__marketingProof.documentId), previous)
    assert.equal(await uuidCalls(page), 0)
    await emptyPreview(page)
    assert.equal(await page.locator('#marketing-destination').inputValue(), 'home')
    assert.equal(await page.locator('#marketing-channel').inputValue(), 'newsletter')
    assert.doesNotMatch(await page.locator('[data-marketing-campaign]').innerText(), /cmp-/)
    assert.doesNotMatch(await page.locator('[data-marketing-content]').innerText(), /cnt-/)
    assert.deepEqual(await calls(page), [])
  })

  for (const uuidMode of ['missing', 'invalid', 'throw'] as const) {
    test(`Marketing ${language}: ${uuidMode} UUID port never produces a fake identifier or usable link`, { timeout: 30_000 }, async (t) => {
      const { page } = await open(t, { sprache: language, uuidMode })
      await page.getByRole('button', { name: words[language].create, exact: true }).click()
      assert.equal(await page.getByRole('alert').innerText(), words[language].random)
      await emptyPreview(page)
      assert.equal(await uuidCalls(page), 1)
      assert.deepEqual(await calls(page), [])
      await page.evaluate(() => window.__marketingProof.setUuidMode('valid'))
      await emptyPreview(page)
      assert.equal(await uuidCalls(page), 1, 'Changing fixture availability must not trigger an automatic retry')
      await create(page, language)
      assert.equal(await urlText(page), expected('home', 'newsletter'))
      assert.equal(await uuidCalls(page), 2)
      assert.equal(await page.getByRole('alert').count(), 0)
    })
  }

  test(`Marketing ${language}: explicit copy confirms only fulfilled exact text and suppresses duplicate clicks`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: language })
    await create(page, language)
    const copy = page.getByRole('button', { name: words[language].copy, exact: true })
    await copy.dblclick()
    await status(page, words[language].pending)
    assert.equal((await calls(page)).length, 1)
    assert.equal((await calls(page))[0].text, expected('home', 'newsletter'))
    assert.equal(await copy.isEnabled(), false)
    assert.equal(await page.getByText(words[language].success, { exact: true }).count(), 0)
    await settle(page, 0, 'fulfilled')
    await status(page, words[language].success)
    assert.equal(await copy.isEnabled(), true)
    await page.locator('#marketing-channel').selectOption('partner')
    await emptyPreview(page)
    assert.equal(await page.locator('#marketing-copy-status').count(), 0)
    assert.equal((await calls(page)).length, 1)
  })

  for (const outcome of ['rejected', 'missing', 'throw'] as const) {
    test(`Marketing ${language}: Clipboard ${outcome} retains manual selection and requires deliberate retry`, { timeout: 30_000 }, async (t) => {
      const { page } = await open(t, { sprache: language, clipboardMode: outcome === 'rejected' ? 'controlled' : outcome })
      await create(page, language)
      await page.getByRole('button', { name: words[language].copy, exact: true }).click()
      if (outcome === 'rejected') await settle(page, 0, 'rejected')
      await status(page, outcome === 'missing' ? words[language].missing : words[language].failure)
      assert.equal(await page.getByText(words[language].success, { exact: true }).count(), 0)
      const oldCalls = (await calls(page)).length
      assert.equal(oldCalls, outcome === 'missing' ? 0 : 1)
      await page.getByRole('button', { name: words[language].select, exact: true }).click()
      assert.equal(await page.evaluate(() => document.getSelection()?.toString()), expected('home', 'newsletter'))
      await status(page, words[language].selected)
      await page.evaluate(() => window.__marketingProof.setClipboardMode('controlled'))
      assert.equal((await calls(page)).length, oldCalls)
      const next = await startCopy(page, language)
      assert.equal(next, oldCalls)
      await settle(page, next, 'fulfilled')
      await status(page, words[language].success)
    })
  }

  test(`Marketing ${language}: the entire readonly URL can be focused and selected without any Clipboard write`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: language, width: 320 })
    await create(page, language)
    await page.getByRole('button', { name: words[language].add, exact: true }).click()
    await page.locator('#marketing-destination').selectOption('inspiration')
    await page.locator('#marketing-channel').selectOption('instagram')
    await create(page, language)
    const field = page.getByRole('textbox', { name: words[language].url, exact: true })
    assert.equal(await field.getAttribute('aria-readonly'), 'true')
    assert.equal(await field.getAttribute('aria-multiline'), 'true')
    await field.focus()
    await field.press('x')
    assert.equal(await urlText(page), expected('inspiration', 'instagram', A, B))
    await page.getByRole('button', { name: words[language].select, exact: true }).click()
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'marketing-url')
    assert.equal(await page.evaluate(() => document.getSelection()?.toString()), expected('inspiration', 'instagram', A, B))
    await status(page, words[language].selected)
    assert.deepEqual(await calls(page), [])
  })
}

for (const outcome of ['fulfilled', 'rejected'] as const) {
  test(`Marketing: actual 10s UI deadline retains the OS lock until late ${outcome}, without automatic retry`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: 'en', clock: true })
    await create(page, 'en')
    await startCopy(page, 'en')
    await page.clock.runFor(9_999)
    assert.equal(await page.locator('#marketing-copy-status').innerText(), words.en.pending)
    await page.clock.runFor(1)
    await status(page, words.en.uncertain)
    assert.equal(await page.getByRole('button', { name: words.en.copy, exact: true }).isEnabled(), false)
    assert.equal((await calls(page)).length, 1)
    assert.equal((await calls(page))[0].settled, false)
    await page.clock.runFor(30_000)
    assert.equal((await calls(page)).length, 1)
    await settle(page, 0, outcome)
    await status(page, outcome === 'fulfilled' ? words.en.success : words.en.failure)
    assert.equal((await calls(page)).length, 1)
    await startCopy(page, 'en')
    assert.equal((await calls(page)).length, 2)
    await settle(page, 1, 'fulfilled')
    await status(page, words.en.success)
  })

  test(`Marketing: edit A to B before its deadline, late A ${outcome} cannot confirm B or overlap its copy`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: 'en', clock: true })
    await create(page, 'en')
    await startCopy(page, 'en')
    await page.locator('#marketing-destination').selectOption('planning')
    await page.locator('#marketing-channel').selectOption('partner')
    await emptyPreview(page)
    await create(page, 'en')
    assert.equal(await urlText(page), expected('planning', 'partner'))
    assert.equal(await page.getByRole('button', { name: words.en.copy, exact: true }).isEnabled(), false)
    await page.clock.runFor(10_000)
    assert.equal(await page.locator('#marketing-copy-status').count(), 0, 'Old timer must not overwrite the new preview')
    await page.locator('#marketing-pending-warning').waitFor()
    assert.equal((await calls(page)).length, 1)
    await page.getByRole('button', { name: words.en.select, exact: true }).click()
    assert.equal(await page.evaluate(() => document.getSelection()?.toString()), expected('planning', 'partner'))
    await status(page, words.en.selected)
    await settle(page, 0, outcome)
    await status(page, words.en.selected)
    assert.equal(await page.getByText(words.en.success, { exact: true }).count(), 0)
    assert.equal((await calls(page)).length, 1)
    await startCopy(page, 'en')
    assert.deepEqual((await calls(page)).map((call) => call.text), [expected('home', 'newsletter'), expected('planning', 'partner')])
    await settle(page, 1, 'fulfilled')
    await status(page, words.en.success)
  })

  test(`Marketing: unmount/remount in one document preserves pending transport through late ${outcome}`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: 'de', clock: true })
    await create(page)
    await startCopy(page)
    const documentId = await page.evaluate(() => window.__marketingProof.documentId)
    await page.evaluate(() => window.__marketingProof.unmount())
    await page.locator('[data-marketing-unmounted]').waitFor()
    assert.equal(await page.locator('[data-marketing-links]').count(), 0)
    await page.clock.runFor(10_000)
    await page.evaluate(() => window.__marketingProof.remount())
    await page.getByRole('heading', { name: words.de.title, exact: true }).waitFor()
    assert.equal(await page.evaluate(() => window.__marketingProof.documentId), documentId)
    await page.locator('#marketing-pending-warning').waitFor()
    await create(page)
    assert.equal(await urlText(page), expected('home', 'newsletter', B))
    assert.equal(await page.getByRole('button', { name: words.de.copy, exact: true }).isEnabled(), false)
    assert.equal((await calls(page)).length, 1)
    await settle(page, 0, outcome)
    assert.equal(await page.locator('#marketing-copy-status').count(), 0)
    assert.equal(await page.getByText(words.de.success, { exact: true }).count(), 0)
    await startCopy(page)
    assert.equal((await calls(page))[1].text, expected('home', 'newsletter', B))
    await settle(page, 1, 'fulfilled')
    await status(page, words.de.success)
  })
}

async function textScale(page: Page, scale: number) {
  await page.evaluate(async (value) => {
    document.documentElement.style.fontSize = `${16 * value}px`
    let timer: number | undefined
    try {
      await Promise.race([
        (async () => {
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
          await Promise.allSettled(document.getAnimations().filter((animation) => {
            const end = animation.effect?.getComputedTiming().endTime
            return animation.playState === 'running' && typeof end === 'number' && Number.isFinite(end)
          }).map((animation) => animation.finished))
        })(),
        new Promise<never>((_resolve, reject) => { timer = window.setTimeout(() => reject(new Error('Marketing layout did not settle')), 3_000) }),
      ])
    } finally { if (timer !== undefined) window.clearTimeout(timer) }
  }, scale)
}

async function geometry(page: Page) {
  return page.evaluate(() => {
    const problems: unknown[] = []
    if (document.documentElement.scrollWidth > innerWidth + 1) problems.push({ kind: 'page-overflow', measured: document.documentElement.scrollWidth, width: innerWidth })
    const controls = [...document.querySelectorAll<HTMLElement>('[data-marketing-links] button, [data-marketing-links] select, #marketing-url')]
      .filter((node) => node.getClientRects().length > 0)
    for (const node of controls) {
      const rect = node.getBoundingClientRect()
      const name = node.id || node.textContent?.trim().slice(0, 80)
      const bounds = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      if (rect.width < 44 || rect.height < 44 || rect.left < -1 || rect.right > innerWidth + 1) problems.push({ kind: 'control-bounds', name, bounds })
      if (node.tagName === 'BUTTON' || node.id === 'marketing-url') {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
        let text: Node | null
        while ((text = walker.nextNode())) {
          if (!text.textContent?.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(text)
          for (const item of range.getClientRects()) if (item.left < rect.left - 1 || item.right > rect.right + 1 || item.top < rect.top - 1 || item.bottom > rect.bottom + 1) {
            problems.push({ kind: 'text-clipped', name, bounds, text: { x: item.x, y: item.y, width: item.width, height: item.height } })
          }
        }
      }
      if (node.id === 'marketing-url' && (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1)) {
        problems.push({ kind: 'url-internal-overflow', width: node.scrollWidth, clientWidth: node.clientWidth, height: node.scrollHeight, clientHeight: node.clientHeight })
      }
      if (node instanceof HTMLSelectElement) {
        const css = getComputedStyle(node)
        const context = document.createElement('canvas').getContext('2d')!
        context.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`
        const label = node.selectedOptions[0]?.textContent ?? ''
        const needed = context.measureText(label).width + parseFloat(css.paddingLeft) + parseFloat(css.paddingRight)
        if (needed > node.clientWidth + 1) problems.push({ kind: 'select-label-clipped', name, label, needed, available: node.clientWidth })
      }
    }
    return { controls: controls.length, problems }
  })
}

type Rgba = [number, number, number, number]
function rgba(value: string): Rgba {
  const match = /^rgba?\(([^)]+)\)$/.exec(value)
  assert.ok(match, `Unsupported computed color: ${value}`)
  const values = match[1].split(',').map(Number)
  assert.ok((values.length === 3 || values.length === 4) && values.every(Number.isFinite))
  return [values[0], values[1], values[2], values[3] ?? 1]
}
function over(top: Rgba, base: Rgba): Rgba {
  const alpha = top[3] + base[3] * (1 - top[3])
  if (!alpha) return [0, 0, 0, 0]
  const channel = (index: 0 | 1 | 2) => (top[index] * top[3] + base[index] * base[3] * (1 - top[3])) / alpha
  return [channel(0), channel(1), channel(2), alpha]
}
function luminance(color: Rgba) {
  const values = color.slice(0, 3).map((part) => part / 255).map((part) => part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4)
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
}
async function contrast(page: Page) {
  const rows = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(
    '[data-marketing-links] h1, [data-marketing-links] h2, [data-marketing-links] h3, [data-marketing-links] p, [data-marketing-links] label, [data-marketing-links] select, [data-marketing-links] button:not(:disabled), [data-marketing-links] dt, [data-marketing-links] dd, #marketing-url',
  )].filter((node) => node.getClientRects().length > 0 && node.textContent?.trim()).map((node) => {
    const css = getComputedStyle(node)
    const backgrounds: string[] = []
    const unsupported: string[] = []
    let parent: HTMLElement | null = node
    while (parent) {
      const layer = getComputedStyle(parent)
      backgrounds.unshift(layer.backgroundColor)
      if (layer.backgroundImage !== 'none' || Number(layer.opacity) !== 1) unsupported.push(`${parent.tagName}: ${layer.backgroundImage}, opacity ${layer.opacity}`)
      parent = parent.parentElement
    }
    return { name: node.id || node.textContent?.trim().slice(0, 70), color: css.color, backgrounds, unsupported, size: parseFloat(css.fontSize), weight: Number(css.fontWeight) }
  }))
  const problems: unknown[] = []
  for (const row of rows) {
    if (row.unsupported.length) { problems.push({ kind: 'unsupported-contrast-layer', name: row.name, layers: row.unsupported }); continue }
    const background = row.backgrounds.reduce((base, value) => over(rgba(value), base), [0, 0, 0, 0] as Rgba)
    if (background[3] !== 1) { problems.push({ kind: 'no-opaque-background', name: row.name }); continue }
    const foreground = over(rgba(row.color), background)
    const fg = luminance(foreground)
    const bg = luminance(background)
    const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)
    const minimum = row.size >= 24 || (row.size >= 18.6667 && row.weight >= 700) ? 3 : 4.5
    if (ratio < minimum) problems.push({ kind: 'contrast', name: row.name, ratio, minimum, foreground, background })
  }
  return { measured: rows.length, problems }
}

for (const language of ['de', 'en'] as const) for (const appearance of ['light', 'dark'] as const) for (const width of [320, 390, 1280]) {
  test(`Marketing ${language}/${appearance}/${width}px: all labels, full URL and feedback at 100/200% remain usable`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: language, appearance, width })
    const measurements: { scale: number; state: string; geometry: Awaited<ReturnType<typeof geometry>>; contrast: Awaited<ReturnType<typeof contrast>> }[] = []
    const measure = async (scale: number, state: string) => { measurements.push({ scale, state, geometry: await geometry(page), contrast: await contrast(page) }) }
    for (const scale of [1, 2]) {
      await textScale(page, scale)
      await page.getByRole('button', { name: words[language].reset, exact: true }).click()
      await measure(scale, 'empty')
      await create(page, language)
      await page.getByRole('button', { name: words[language].add, exact: true }).click()
      await page.locator('#marketing-destination').selectOption('planning')
      await page.locator('#marketing-channel').selectOption('partner')
      await create(page, language)
      await measure(scale, 'generated with variant')
      const index = await startCopy(page, language)
      await settle(page, index, 'rejected')
      await status(page, words[language].failure)
      await measure(scale, 'copy failure')
    }
    assert.ok(measurements.every((item) => item.geometry.controls >= 6 && item.contrast.measured >= 15), 'Measure actual controls, explanatory text, parameters and feedback')
    const failures = measurements.filter((item) => item.geometry.problems.length || item.contrast.problems.length)
    assert.deepEqual(failures, [], JSON.stringify({ language, appearance, width, failures }))
  })
}

for (const language of ['de', 'en'] as const) {
  test(`Marketing ${language}: keyboard at 320px/200% reaches generation, explicit copy and manual selection`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { sprache: language, width: 320 })
    await textScale(page, 2)
    const destination = page.getByRole('combobox', { name: words[language].destination, exact: true })
    await destination.focus()
    await page.keyboard.press('End')
    assert.equal(await destination.inputValue(), 'inspiration')
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'marketing-channel')
    await page.keyboard.press('End')
    assert.equal(await page.locator('#marketing-channel').inputValue(), 'qr')
    await page.getByRole('button', { name: words[language].create, exact: true }).focus()
    const shadow = await page.evaluate(() => document.activeElement instanceof HTMLElement ? getComputedStyle(document.activeElement).boxShadow : null)
    assert.ok(shadow && shadow !== 'none', 'Focused primary action must have a visible indicator')
    await page.keyboard.press('Enter')
    assert.equal(await urlText(page), expected('inspiration', 'qr'))
    await page.getByRole('textbox', { name: words[language].url, exact: true }).focus()
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), words[language].copy)
    await page.keyboard.press('Enter')
    await status(page, words[language].pending)
    assert.equal((await calls(page)).length, 1)
    await settle(page, 0, 'fulfilled')
    await status(page, words[language].success)
    await page.getByRole('button', { name: words[language].select, exact: true }).focus()
    await page.keyboard.press('Enter')
    assert.equal(await page.evaluate(() => document.getSelection()?.toString()), expected('inspiration', 'qr'))
    assert.equal((await calls(page)).length, 1)
  })
}
