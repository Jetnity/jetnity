// Selected by the existing Core lib/**/*.test.ts glob. No skip and no new
// workflow. Run in CI; a synthetic transport is not hosted CMS acceptance.
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
import type { CmsPortResult } from './port'
import type { CmsFixtureBoot } from '@/scripts/admin-cms-editor-2/harness'
import { CMS_TEST_COPY, CMS_TEST_ENTRY, fixtureRead, fixtureReceipt, fixtureRevision } from '@/scripts/admin-cms-editor-2/fixtures'

let server: Server | undefined, browser: Browser | undefined, origin = ''
type Fixture = { boot: CmsFixtureBoot; violations: string[]; loads: number; allowedLoads: number }
const fixtures = new Map<string, Fixture>()
const words = {
  de: { title: 'Reiseideen bearbeiten', description: 'Beschreibung', idea: 'Reiseidee für die Planung', nature: 'Natur', save: 'Entwurf speichern',
    saved: 'Der Entwurf ist gespeichert und bestätigt.', publish: 'Gespeicherten Entwurf veröffentlichen', published: 'Die Veröffentlichung im Dev-CMS ist bestätigt.',
    archive: 'Archivieren', archiveConfirm: 'Archivierung bestätigen', archived: 'Die Archivierung ist bestätigt.', view: 'Revision ansehen 1', restore: 'Als neuen Entwurf wiederherstellen', restored: 'Die Revision ist als neuer Entwurf gespeichert und bestätigt.',
    confirm: 'Speicherstatus prüfen', retry: 'Denselben Auftrag erneut senden', unavailable: 'CMS derzeit nicht verfügbar', choose: 'Reiseidee auswählen',
    discard: 'Änderungen verwerfen und neu laden', discardConfirm: 'Verwerfen und neu laden', conflict: 'Der Eintrag wurde inzwischen geändert.', invalid: 'Prüfe beide Textfelder und die Themen.' },
  en: { title: 'Edit travel ideas', description: 'Description', idea: 'Travel planning idea', nature: 'Nature', save: 'Save draft',
    saved: 'The draft is saved and confirmed.', publish: 'Publish saved draft', published: 'Publication in the Dev CMS is confirmed.',
    archive: 'Archive', archiveConfirm: 'Confirm archive', archived: 'Archiving is confirmed.', view: 'View revision 1', restore: 'Restore as a new draft', restored: 'The revision is saved and confirmed as a new draft.',
    confirm: 'Check save status', retry: 'Retry the same request', unavailable: 'CMS currently unavailable', choose: 'Choose travel idea',
    discard: 'Discard changes and reload', discardConfirm: 'Discard and reload', conflict: 'The entry has changed.', invalid: 'Check both text fields and the topics.' },
}

before(async () => {
  const require = createRequire(import.meta.url)
  const from = join(process.cwd(), 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({ absWorkingDir: process.cwd(), entryPoints: ['scripts/admin-cms-editor-2/harness.tsx'], bundle: true, write: false,
      format: 'iife', platform: 'browser', jsx: 'automatic', alias: { '@': process.cwd() },
      define: { 'process.env.NODE_ENV': '"development"', 'process.env.__NEXT_ROUTER_BASEPATH': '""',
        'process.env.__NEXT_I18N_SUPPORT': 'false', 'process.env.__NEXT_TRAILING_SLASH': 'false',
        'process.env.__NEXT_MANUAL_TRAILING_SLASH': 'false', 'process.env.__NEXT_MANUAL_CLIENT_BASE_PATH': 'false', 'process.env.__NEXT_LINK_NO_TOUCH_START': 'false',
        // Actual navigation-search imports Next's client hooks. These are the
        // installed package's client defaults, without a running dev server.
        'process.env.__NEXT_DEV_SERVER': '""', 'process.env.NEXT_RUNTIME': '""',
        'process.env.NEXT_PRIVATE_DEBUG_RUNTIME_DATA': '""', 'process.env.NEXT_PRIVATE_DEBUG_VALIDATION': '""',
        'process.env.__NEXT_EXPERIMENTAL_REACT_BROWSER_BAILOUT': 'false', 'process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS': 'false',
        'process.env.__NEXT_CACHE_COMPONENTS': 'false' },
      banner: { js: 'var __name=(target)=>target;' },
    }),
    require('postcss')([require('tailwindcss/nesting')(), require('tailwindcss')(require(join(process.cwd(), 'tailwind.config.js'))), require('autoprefixer')()])
      .process(readFileSync(from, 'utf8'), { from }),
  ])
  assert.doesNotMatch(bundle.outputFiles[0].text, /\bprocess\s*\.\s*env\b/, 'Every build constant must be replaced before mounting')
  const js = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script'), style = css.css.replaceAll('</style', '<\\/style')
  server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://fixture.invalid')
    const fixture = fixtures.get(url.searchParams.get('fixture') ?? '')
    if (!fixture || request.method !== 'GET' || url.pathname !== '/admin/content/editor' || [...url.searchParams.keys()].join(',') !== 'fixture') {
      response.writeHead(404).end(); return
    }
    fixture.loads++
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(`<!doctype html><html lang="${fixture.boot.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Synthetic CMS component proof</title><style>${style}</style></head><body><div id="root"></div><script>window.__cmsBoot=${JSON.stringify(fixture.boot).replaceAll('<', '\\u003c')};${js}</script></body></html>`)
  })
  await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(0, '127.0.0.1', resolve) })
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  try { browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] }) }
  catch (error) {
    if (!(error instanceof Error) || !/Executable doesn't exist/.test(error.message)) throw error
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }
}, { timeout: 90_000 })
after(async () => {
  await browser?.close()
  if (server?.listening) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()))
})

async function open(t: TestContext, options: Partial<CmsFixtureBoot> & { width?: number } = {}) {
  const fixture: Fixture = { boot: { language: options.language ?? 'de', entryId: CMS_TEST_ENTRY, snapshot: options.snapshot ?? fixtureRead(), unavailable: options.unavailable ?? false, dark: options.dark ?? false, navigation: options.navigation ?? false }, violations: [], loads: 0, allowedLoads: 1 }
  const id = randomUUID(); fixtures.set(id, fixture)
  const page = await browser!.newPage({ viewport: { width: options.width ?? 1280, height: 900 } })
  page.setDefaultTimeout(7_000)
  page.on('pageerror', error => { fixture.violations.push(`Runtime: ${error.message}`); t.diagnostic(error.stack ?? error.message) })
  page.on('console', message => { if (message.type() === 'error') fixture.violations.push(`Console: ${message.text()}`) })
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (request.method() === 'GET' && request.isNavigationRequest() && request.resourceType() === 'document' && request.frame() === page.mainFrame()
      && url.origin === origin && url.pathname === '/admin/content/editor' && url.search === `?fixture=${id}` && fixture.loads < fixture.allowedLoads) await route.continue()
    else { fixture.violations.push(`Network: ${request.method()} ${url.origin}${url.pathname}`); await route.abort() }
  })
  await page.exposeFunction('__recordCmsViolation', (message: string) => { fixture.violations.push(message) })
  const isolation = () => {
    window.__cmsViolations = []
    const deny = (kind: string): never => { window.__cmsViolations.push(kind); void window.__recordCmsViolation(kind); throw new Error(`Forbidden CMS fixture IO: ${kind}`) }
    for (const key of ['localStorage', 'sessionStorage', 'indexedDB', 'caches']) Object.defineProperty(window, key, { configurable: true, get() { return deny(`Storage: ${key}`) } })
    Object.defineProperty(document, 'cookie', { configurable: true, get() { return deny('Cookie read') }, set() { deny('Cookie write') } })
    window.fetch = async () => deny('Network: fetch')
    for (const key of ['XMLHttpRequest', 'WebSocket', 'EventSource']) Object.defineProperty(window, key, { configurable: true, value: function () { deny(`Network: ${key}`) } })
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => deny('Network: beacon') })
    window.open = () => deny('Navigation: open')
  }
  // One ordered init script, including reload; serialized tsx callbacks depend
  // on __name being available before they execute. Do not split these scripts.
  await page.addInitScript({ content: `globalThis.__name=(target)=>target;(${isolation.toString()})();` })
  t.after(async () => {
    try {
      if (!page.isClosed()) {
        const local = await page.evaluate(() => window.__cmsViolations ?? [])
        for (const violation of local) if (!fixture.violations.includes(violation)) fixture.violations.push(violation)
        if (fixture.violations.length) t.diagnostic((await page.locator('body').innerText()).slice(0, 2000))
      }
    } finally { await page.close(); fixtures.delete(id) }
    assert.deepEqual(fixture.violations, [], 'No network, storage, navigation or runtime error is allowed')
    assert.equal(fixture.loads, fixture.allowedLoads)
  })
  const response = await page.goto(`${origin}/admin/content/editor?fixture=${id}`)
  assert.equal(response?.status(), 200)
  await page.getByRole('heading', { level: 1, name: words[fixture.boot.language].title }).waitFor()
  await page.getByRole(fixture.boot.unavailable ? 'heading' : 'textbox', { name: fixture.boot.unavailable ? words[fixture.boot.language].unavailable : words[fixture.boot.language].description, exact: true }).waitFor()
  assert.equal(await page.locator('[data-cms-editor]').getAttribute('lang'), fixture.boot.language)
  return { page, fixture, word: words[fixture.boot.language] }
}
async function calls(page: Page) { return page.evaluate(() => window.__cmsProof.commands()) }
async function settle(page: Page, kind: 'command' | 'confirm', index: number, value: CmsPortResult) { await page.evaluate(arg => window.__cmsProof.settle(arg.kind, arg.index, arg.value), { kind, index, value }) }
async function fill(page: Page, word: (typeof words)['de' | 'en']) {
  await page.getByRole('textbox', { name: word.description, exact: true }).fill(CMS_TEST_COPY.beschreibung)
  await page.getByRole('textbox', { name: word.idea, exact: true }).fill(CMS_TEST_COPY.idea)
  await page.getByRole('checkbox', { name: word.nature, exact: true }).check()
}
async function finish(page: Page, index: number, read: ReturnType<typeof fixtureRead>, receipt: ReturnType<typeof fixtureReceipt>, success: string) {
  await page.evaluate(value => window.__cmsProof.setRead(value), read)
  await settle(page, 'command', index, { ok: true, value: receipt })
  await page.waitForFunction(count => window.__cmsProof.confirmations().length === count, index + 1)
  assert.equal(await page.getByText(success, { exact: true }).count(), 0, 'ACK alone cannot claim success')
  await settle(page, 'confirm', index, { ok: true, value: receipt })
  await page.getByText(success, { exact: true }).waitFor()
}

for (const [language, width, dark] of [['de', 320, false], ['en', 390, true], ['de', 1280, false]] as const) {
  test(`actual editor: save, publish, archive and restore (${language}, ${width}px)`, async t => {
    const { page, word } = await open(t, { language, width, dark })
    await page.getByRole('textbox', { name: word.description, exact: true }).focus()
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'cms-description')
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'cms-idea')
    await fill(page, word)
    await page.getByRole('button', { name: word.save, exact: true }).click()
    await page.waitForFunction(() => window.__cmsProof.commands().length === 1)
    let command = (await calls(page))[0]
    assert.equal(command.action, 'save_draft'); assert.equal(command.expectedVersion, '0')
    await finish(page, 0, fixtureRead({ draft: '1' }), fixtureReceipt(command, { draft: '1', created: '1' }), word.saved)
    await page.getByRole('button', { name: word.publish, exact: true }).click()
    await page.waitForFunction(() => window.__cmsProof.commands().length === 2)
    command = (await calls(page))[1]; assert.equal(command.action, 'publish')
    await finish(page, 1, fixtureRead({ version: '2', draft: '1', published: '1' }), fixtureReceipt(command, { draft: '1', published: '1' }), word.published)
    await page.getByRole('button', { name: word.archive, exact: true }).click()
    await page.getByRole('button', { name: word.archiveConfirm, exact: true }).click()
    await page.waitForFunction(() => window.__cmsProof.commands().length === 3)
    command = (await calls(page))[2]; assert.equal(command.action, 'archive')
    await finish(page, 2, fixtureRead({ version: '3', draft: '1', archived: true }), fixtureReceipt(command, { draft: '1', archived: true }), word.archived)
    await page.getByRole('button', { name: word.view, exact: true }).click()
    await page.getByRole('button', { name: word.restore, exact: true }).click()
    await page.waitForFunction(() => window.__cmsProof.commands().length === 4)
    command = (await calls(page))[3]; assert.equal(command.action, 'restore_draft')
    await finish(page, 3, fixtureRead({ version: '4', draft: '2', revisions: [fixtureRevision('2', { restoredFrom: '1' }), fixtureRevision('1')] }), fixtureReceipt(command, { draft: '2', created: '2' }), word.restored)
    assert.equal(await page.evaluate(() => window.__cmsProof.uuidCalls()), 4)
    await page.addStyleTag({ content: 'html { font-size: 200%; }' })
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, buttons: [...document.querySelectorAll('button')].filter(node => node.getClientRects().length > 0).map(node => ({ height: node.getBoundingClientRect().height, right: node.getBoundingClientRect().right, left: node.getBoundingClientRect().left })) }))
    assert.ok(layout.scroll <= layout.width + 1, '200% text must not cause horizontal overflow')
    assert.ok(layout.buttons.every(button => button.height >= 44 && button.left >= 0 && button.right <= layout.width + 1))
  })
}

test('actual editor preserves CAS input, rejects invalid content and requires explicit discard', async t => {
  const { page, word } = await open(t)
  await fill(page, word)
  await page.getByRole('textbox', { name: word.idea, exact: true }).fill('<unsafe>')
  assert.equal(await page.getByRole('button', { name: word.save, exact: true }).isDisabled(), true)
  assert.equal(await page.getByRole('textbox', { name: word.idea, exact: true }).getAttribute('aria-invalid'), 'true')
  await page.getByRole('textbox', { name: word.idea, exact: true }).fill(CMS_TEST_COPY.idea)
  await page.getByRole('button', { name: word.save, exact: true }).click()
  await page.waitForFunction(() => window.__cmsProof.commands().length === 1)
  await settle(page, 'command', 0, { ok: false, code: 'conflict' })
  await page.getByText(word.conflict, { exact: false }).waitFor()
  assert.equal(await page.getByRole('textbox', { name: word.idea, exact: true }).inputValue(), CMS_TEST_COPY.idea)
  assert.equal(await page.getByRole('combobox', { name: word.choose }).isDisabled(), true)
  await page.getByRole('button', { name: word.discard, exact: true }).first().click()
  await page.getByRole('button', { name: word.discardConfirm, exact: true }).click()
  await page.waitForFunction(() => (document.getElementById('cms-idea') as HTMLTextAreaElement)?.value === '')
})

test('actual editor retains its uncertain ID when the retry is rate-limited, then reconciles the original commit', async t => {
  const { page, word } = await open(t, { language: 'en' })
  await fill(page, word); await page.getByRole('button', { name: word.save, exact: true }).click()
  await page.waitForFunction(() => window.__cmsProof.commands().length === 1)
  const command = (await calls(page))[0]
  await settle(page, 'command', 0, { ok: false, code: 'timeout' })
  await page.getByRole('button', { name: word.confirm, exact: true }).click()
  await page.waitForFunction(() => window.__cmsProof.confirmations().length === 1)
  await settle(page, 'confirm', 0, { ok: true, value: { schema: 1, status: 'unknown', requestId: command.requestId } })
  await page.getByRole('button', { name: word.retry, exact: true }).click()
  await page.waitForFunction(() => window.__cmsProof.commands().length === 2)
  assert.deepEqual((await calls(page))[1], command)
  await settle(page, 'command', 1, { ok: false, code: 'rate_limit' })
  assert.equal(await page.getByRole('combobox', { name: word.choose }).isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: word.save, exact: true }).isDisabled(), true)
  await page.evaluate(value => window.__cmsProof.setRead(value), fixtureRead({ draft: '1' }))
  await page.getByRole('button', { name: word.confirm, exact: true }).click()
  await page.waitForFunction(() => window.__cmsProof.confirmations().length === 2)
  await settle(page, 'confirm', 1, { ok: true, value: fixtureReceipt(command, { draft: '1', created: '1' }) })
  await page.getByText(word.saved, { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => window.__cmsProof.uuidCalls()), 1)
})

for (const pending of [false, true]) {
  test(`actual Sidebar and navigation-search Next Links cannot unmount an editor with ${pending ? 'an open intent' : 'unsaved input'}`, async t => {
    const { page, word } = await open(t, { navigation: true })
    await fill(page, word)
    if (pending) {
      await page.getByRole('button', { name: word.save, exact: true }).click()
      await page.waitForFunction(() => window.__cmsProof.commands().length === 1)
    }
    const sidebar = page.getByRole('navigation', { name: 'Hauptnavigation' })
    await sidebar.getByRole('link', { name: 'Einstellungen', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.__cmsProof.navigations()), [])
    assert.equal(await page.getByRole('textbox', { name: word.idea, exact: true }).inputValue(), CMS_TEST_COPY.idea)
    await page.locator('[data-admin-nav-search-trigger="desktop"]').click()
    await page.locator('#admin-nav-search-input').fill('Einstellungen')
    await page.getByRole('option', { name: 'Einstellungen', exact: true }).waitFor()
    // The actual search dispatches .click() on its selected Next Link for Enter.
    await page.locator('#admin-nav-search-input').press('Enter')
    assert.deepEqual(await page.evaluate(() => window.__cmsProof.navigations()), [])
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('textbox', { name: word.idea, exact: true }).inputValue(), CMS_TEST_COPY.idea)
    if (pending) {
      const command = (await calls(page))[0]
      await finish(page, 0, fixtureRead({ draft: '1' }), fixtureReceipt(command, { draft: '1', created: '1' }), word.saved)
    } else {
      await page.getByRole('button', { name: word.discard, exact: true }).click()
      await page.getByRole('button', { name: word.discardConfirm, exact: true }).click()
      await page.waitForFunction(() => (document.getElementById('cms-idea') as HTMLTextAreaElement)?.value === '')
    }
    await sidebar.getByRole('link', { name: 'Einstellungen', exact: true }).click()
    await page.locator('[data-cms-navigated]').waitFor()
    assert.deepEqual(await page.evaluate(() => window.__cmsProof.navigations()), ['/admin/settings'])
    assert.equal(await page.locator('[data-cms-editor]').count(), 0, 'The actual Next Link is allowed only after the edit/intent is resolved')
  })
}

for (const boundary of ['history', 'confirm', 'readback'] as const) {
  test(`actual editor closes guarded content on forbidden ${boundary} and retains any unresolved intent`, async t => {
    const snapshot = boundary === 'history' ? fixtureRead({ draft: '21', revisions: Array.from({ length: 20 }, (_, index) => fixtureRevision(String(21 - index))), before: '2' }) : fixtureRead()
    const { page, word } = await open(t, { snapshot })
    if (boundary === 'history') {
      await page.evaluate(() => window.__cmsProof.setReadFailure('forbidden'))
      await page.getByRole('button', { name: 'Weitere Revisionen laden', exact: true }).click()
    } else {
      await fill(page, word); await page.getByRole('button', { name: word.save, exact: true }).click()
      await page.waitForFunction(() => window.__cmsProof.commands().length === 1)
      const command = (await calls(page))[0], receipt = fixtureReceipt(command, { draft: '1', created: '1' })
      await settle(page, 'command', 0, { ok: true, value: receipt })
      await page.waitForFunction(() => window.__cmsProof.confirmations().length === 1)
      if (boundary === 'readback') await page.evaluate(() => window.__cmsProof.setReadFailure('forbidden'))
      await settle(page, 'confirm', 0, boundary === 'confirm' ? { ok: false, code: 'forbidden' } : { ok: true, value: receipt })
    }
    await page.getByRole('heading', { name: word.unavailable, exact: true }).waitFor()
    assert.equal(await page.getByRole('textbox').count(), 0)
    assert.equal(await page.getByRole('button', { name: word.save, exact: true }).count(), 0)
    assert.equal(await page.getByRole('button', { name: word.publish, exact: true }).count(), 0)
    if (boundary !== 'history') {
      assert.equal(await page.getByRole('button', { name: word.retry, exact: true }).isDisabled(), true)
      assert.equal(await page.getByRole('button', { name: word.confirm, exact: true }).count(), 1)
      assert.equal(await page.evaluate(() => window.__cmsProof.uuidCalls()), 1)
    }
  })
}

test('unavailable product transport exposes no editor writes, including reload', async t => {
  const { page, fixture, word } = await open(t, { language: 'en', unavailable: true })
  assert.equal(await page.getByRole('button', { name: word.save, exact: true }).count(), 0)
  assert.equal(await page.getByRole('textbox').count(), 0)
  fixture.allowedLoads++
  await page.reload(); await page.getByRole('heading', { name: word.unavailable, exact: true }).waitFor()
  assert.deepEqual(await calls(page), [])
  assert.equal(await page.evaluate(() => window.__cmsProof.uuidCalls()), 0)
})
