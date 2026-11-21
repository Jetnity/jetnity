// Actual mounted campaign component + actual HTTP transport. The loopback
// server below is an explicit synthetic persistence fixture, not hosted login.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { before, after, test, type TestContext } from 'node:test'
import * as esbuild from 'esbuild'
import { chromium, type Browser } from 'playwright'
import type { CampaignFixtureBoot } from './browser-harness'
import { parseMarketingDraftCommand, type MarketingDraftCommand, type MarketingDraftRevision, type MarketingDraftRead } from './contract'
import { applyDraft, confirmDraft, readDrafts, type DraftDatabase } from './operations'
import { MARKETING_DRAFT_TEXT } from './texts'

type Fixture = {
  boot: CampaignFixtureBoot; actor: string; revisions: Map<string, MarketingDraftRevision[]>;
  commands: MarketingDraftCommand[]; requests: Map<string, MarketingDraftCommand>; apiCalls: number;
  denied: boolean; loseAck: boolean; holdConfirmation: boolean; conflict: boolean; failures: string[];
}
const fixtures = new Map<string, Fixture>()
let server: Server | undefined, browser: Browser | undefined, origin = ''

function database(fixture: Fixture): DraftDatabase {
  const error = (code: string) => ({ data: null, error: { code } })
  return {
    async read(input: MarketingDraftRead) {
      if (fixture.denied) return error('42501')
      if (input.action === 'get') return { data: { schemaVersion: 1, action: 'get', draft: fixture.revisions.get(input.draftId)?.at(-1) ?? null }, error: null }
      if (input.action === 'history') {
        const all = [...(fixture.revisions.get(input.draftId) ?? [])].reverse().filter(row => !input.cursor || BigInt(row.version) < BigInt(input.cursor))
        const items = fixture.holdConfirmation && input.limit === 1 ? [] : all.slice(0, input.limit)
        return { data: { schemaVersion: 1, action: 'history', draftId: input.draftId, items, nextCursor: items.length > 0 && all.length > input.limit ? items.at(-1)!.version : null }, error: null }
      }
      const all = [...fixture.revisions.values()].map(rows => rows.at(-1)!).filter(row => (!input.state || row.state === input.state)
        && (!input.cursor || row.savedAt < input.cursor.savedAt || row.savedAt === input.cursor.savedAt && row.draftId < input.cursor.draftId))
        .sort((a, b) => a.savedAt === b.savedAt ? b.draftId.localeCompare(a.draftId) : b.savedAt.localeCompare(a.savedAt))
      const items = all.slice(0, input.limit), last = items.at(-1)
      return { data: { schemaVersion: 1, action: 'list', items,
        nextCursor: all.length > input.limit && last ? { savedAt: last.savedAt, draftId: last.draftId } : null }, error: null }
    },
    async apply(raw) {
      if (fixture.denied) return error('42501')
      const input = parseMarketingDraftCommand(raw)
      if (!input) return error('22023')
      fixture.commands.push(input)
      const prior = fixture.requests.get(input.requestId)
      if (prior) {
        if (JSON.stringify(prior) !== JSON.stringify(input)) return error('P4092')
        return { data: { schemaVersion: 1, action: 'apply', receipt: fixture.revisions.get(input.draftId)!.find(row => row.requestId === input.requestId), replayed: true }, error: null }
      }
      const history = fixture.revisions.get(input.draftId) ?? [], current = history.at(-1)
      if (fixture.conflict) { fixture.conflict = false; return error('P4091') }
      if ((current?.version ?? '0') !== input.expectedVersion) return error('P4091')
      let payload: MarketingDraftRevision['payload']
      if (input.action === 'create' || input.action === 'save') payload = input.payload
      else if (input.action === 'archive') { if (!current) return error('P4041'); payload = current.payload }
      else if (input.action === 'restore') {
        const version = input.payload.revision, previous = history.find(row => row.version === version)
        if (!previous) return error('P4041'); payload = previous.payload
      } else return error('22023')
      const version = (BigInt(input.expectedVersion) + 1n).toString()
      const revision: MarketingDraftRevision = { draftId: input.draftId, requestId: input.requestId, actorId: fixture.actor,
        version, action: input.action, state: input.action === 'archive' ? 'archived' : 'draft', payload,
        savedAt: `2026-11-16T01:02:${version.padStart(2, '0')}.123456Z`, restoredFrom: input.action === 'restore' ? input.payload.revision : null }
      fixture.revisions.set(input.draftId, [...history, revision]); fixture.requests.set(input.requestId, input)
      if (fixture.loseAck) { fixture.loseAck = false; return error('synthetic_lost_ack') }
      return { data: { schemaVersion: 1, action: 'apply', receipt: revision, replayed: false }, error: null }
    },
  }
}

before(async () => {
  const require = createRequire(import.meta.url), from = join(process.cwd(), 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({ absWorkingDir: process.cwd(), entryPoints: ['lib/admin/marketing/drafts/browser-harness.tsx'], bundle: true, write: false,
      format: 'iife', platform: 'browser', jsx: 'automatic', alias: { '@': process.cwd() },
      define: { 'process.env.NODE_ENV': '"development"' }, banner: { js: 'var __name=(target)=>target;' } }),
    require('postcss')([require('tailwindcss/nesting')(), require('tailwindcss')(require(join(process.cwd(), 'tailwind.config.js'))), require('autoprefixer')()])
      .process(readFileSync(from, 'utf8'), { from }),
  ])
  const script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script'), style = css.css.replaceAll('</style', '<\\/style')
  assert.doesNotMatch(script, /\bprocess\s*\.\s*env\b/)
  server = createServer((request, response) => { void (async () => {
    const url = new URL(request.url ?? '/', 'http://fixture.invalid')
    const referrer = new URL(request.headers.referer ?? 'http://fixture.invalid')
    const fixture = fixtures.get((url.pathname === '/admin/marketing' ? url : referrer).searchParams.get('fixture') ?? '')
    if (!fixture) { response.writeHead(404).end(); return }
    if (request.method === 'GET' && url.pathname === '/admin/marketing') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      response.end(`<!doctype html><html lang="${fixture.boot.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Synthetic campaign runtime proof</title><style>${style}</style></head><body><a href="/admin" id="fixture-navigation">Admin</a><div id="root"></div><script>window.__campaignBoot=${JSON.stringify(fixture.boot)};${script}</script></body></html>`)
      return
    }
    if (request.method !== 'POST' || !/^\/api\/admin\/marketing\/drafts\/(read|apply|confirm)$/.test(url.pathname)) { response.writeHead(404).end(); return }
    fixture.apiCalls++
    const chunks: Buffer[] = []; let bytes = 0
    for await (const chunk of request) { bytes += chunk.length; if (bytes > 4096) { response.writeHead(413).end(); return }; chunks.push(chunk) }
    const input: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')), db = database(fixture)
    const result = url.pathname.endsWith('/read') ? await readDrafts(db, input)
      : url.pathname.endsWith('/apply') ? await applyDraft(db, input, fixture.actor) : await confirmDraft(db, input, fixture.actor)
    response.writeHead(result.ok ? 200 : result.code === 'forbidden' ? 403 : result.code === 'conflict' ? 409 : 503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify(result))
  })().catch(error => { response.writeHead(500).end(); for (const fixture of fixtures.values()) fixture.failures.push(String(error)) }) })
  await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(0, '127.0.0.1', resolve) })
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  try { browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] }) }
  catch (error) {
    if (!(error instanceof Error) || !/Executable doesn't exist/.test(error.message)) throw error
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }
}, { timeout: 90_000 })
after(async () => { await browser?.close(); if (server?.listening) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve())) })

async function open(t: TestContext, language: 'de' | 'en', width: number, enabled = true) {
  const id = randomUUID(), fixture: Fixture = { boot: { language, enabled }, actor: randomUUID(), revisions: new Map(), commands: [], requests: new Map(), apiCalls: 0,
    denied: false, loseAck: false, holdConfirmation: false, conflict: false, failures: [] }
  fixtures.set(id, fixture)
  const page = await browser!.newPage({ viewport: { width, height: 1000 } }); page.setDefaultTimeout(7_000)
  page.on('pageerror', error => { fixture.failures.push(error.message) })
  page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource: the server responded with a status of (403|409|503)/.test(message.text())) fixture.failures.push(message.text()) })
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin === origin && (request.method() === 'GET' && url.pathname === '/admin/marketing'
      || request.method() === 'POST' && /^\/api\/admin\/marketing\/drafts\/(read|apply|confirm)$/.test(url.pathname))) return route.continue()
    fixture.failures.push(`Unexpected network ${request.method()} ${url.pathname}`); return route.abort()
  })
  await page.addInitScript({ content: `globalThis.__name=(target)=>target; window.__campaignViolations=[];
    for(const key of ['localStorage','sessionStorage','indexedDB','caches']) Object.defineProperty(window,key,{configurable:true,get(){window.__campaignViolations.push(key);throw new Error('forbidden browser store')}});` })
  t.after(async () => { try { assert.deepEqual(await page.evaluate(() => window.__campaignViolations), []); assert.deepEqual(fixture.failures, []) } finally { await page.close(); fixtures.delete(id) } })
  await page.goto(`${origin}/admin/marketing?fixture=${id}`)
  const text = MARKETING_DRAFT_TEXT[language]
  await page.getByRole('heading', { name: text.title, exact: true }).waitFor()
  if (enabled) await page.getByRole('button', { name: text.create, exact: true }).waitFor({ state: 'visible' })
  return { page, fixture, text }
}

for (const [language, width] of [['de', 320], ['en', 390], ['de', 1280]] as const) {
  test(`campaign runtime UI: create, real reload, save, archive and restore (${language}, ${width}px)`, async t => {
    const { page, fixture, text } = await open(t, language, width)
    await page.getByRole('button', { name: text.create, exact: true }).click()
    await page.getByRole('textbox', { name: text.label, exact: true }).fill('Synthetic campaign')
    await page.getByLabel(text.destination, { exact: true }).selectOption('planning')
    await page.getByRole('button', { name: text.save, exact: true }).click()
    await page.getByText(text.confirmed, { exact: true }).waitFor()
    assert.equal(fixture.commands.length, 1)
    const id = fixture.commands[0].draftId
    assert.equal(await page.getByRole('textbox', { name: text.link, exact: true }).inputValue(), `https://jetnity.com/planen?utm_source=newsletter&utm_medium=email&utm_campaign=cmp-${id}`)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    await page.reload()
    await page.getByRole('button', { name: `${text.open}: Synthetic campaign`, exact: true }).click()
    await page.getByRole('textbox', { name: text.label, exact: true }).fill('Changed campaign')
    await page.getByRole('button', { name: text.save, exact: true }).click()
    await page.getByText(text.confirmed, { exact: true }).waitFor()
    await page.getByRole('button', { name: text.archive, exact: true }).click()
    await page.getByRole('button', { name: text.archiveConfirm, exact: true }).click()
    await page.getByText(text.archivedHint, { exact: true }).waitFor()
    await page.getByRole('button', { name: `${text.historyView} 1`, exact: true }).click()
    await page.getByRole('button', { name: text.restore, exact: true }).click()
    await page.getByRole('button', { name: text.restoreConfirm, exact: true }).click()
    await page.getByText(text.confirmed, { exact: true }).waitFor()
    await page.waitForFunction(() => (document.getElementById('campaign-label') as HTMLInputElement)?.value === 'Synthetic campaign')
    assert.deepEqual(fixture.commands.map(item => item.action), ['create', 'save', 'archive', 'restore'])
    assert.equal(fixture.revisions.get(id)?.length, 4)
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  })
}

test('campaign uncertain commit survives real reload with IDs only and performs no automatic replay', async t => {
  const { page, fixture, text } = await open(t, 'de', 390)
  fixture.loseAck = true; fixture.holdConfirmation = true
  await page.getByRole('button', { name: text.create, exact: true }).click()
  await page.getByRole('textbox', { name: text.label, exact: true }).fill('Uncertain synthetic')
  await page.getByRole('button', { name: text.save, exact: true }).click()
  await page.getByRole('heading', { name: text.pending, exact: true }).waitFor()
  await page.getByText(text.unresolved, { exact: true }).waitFor()
  assert.equal(fixture.commands.length, 1)
  assert.ok(!page.url().includes('Uncertain'))
  await page.reload()
  await page.getByText(text.afterReload, { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: text.retry, exact: true }).count(), 0)
  const before = page.url(); await page.locator('#fixture-navigation').click(); assert.equal(page.url(), before)
  await page.getByText(text.blocked, { exact: true }).waitFor()
  fixture.holdConfirmation = false
  await page.getByRole('button', { name: text.check, exact: true }).click()
  await page.getByText(text.confirmed, { exact: true }).waitFor()
  assert.equal(fixture.commands.length, 1)
  assert.equal(new URL(page.url()).searchParams.has('campaignRequest'), false)
})

test('campaign CAS preserves input until explicit discard; authority denial removes protected data', async t => {
  const { page, fixture, text } = await open(t, 'en', 1280)
  await page.getByRole('button', { name: text.create, exact: true }).click()
  await page.getByRole('textbox', { name: text.label, exact: true }).fill('Initial synthetic')
  await page.getByRole('button', { name: text.save, exact: true }).click(); await page.getByText(text.confirmed, { exact: true }).waitFor()
  fixture.conflict = true
  await page.getByRole('textbox', { name: text.label, exact: true }).fill('Preserved input')
  await page.getByRole('button', { name: text.save, exact: true }).click(); await page.getByText(text.conflict, { exact: true }).waitFor()
  assert.equal(await page.getByRole('textbox', { name: text.label, exact: true }).inputValue(), 'Preserved input')
  assert.equal(await page.getByRole('button', { name: text.save, exact: true }).isEnabled(), false)
  await page.getByRole('button', { name: text.discard, exact: true }).click(); await page.getByRole('button', { name: text.discardConfirm, exact: true }).click()
  await page.waitForFunction(() => (document.getElementById('campaign-label') as HTMLInputElement)?.value === 'Initial synthetic')
  fixture.denied = true
  // Discard restores the previous draft asynchronously. Playwright waits until
  // the accessible Reload list control is actionable, without bypassing disabled
  // state during the server-backed recovery read.
  await page.getByRole('button', { name: text.refresh, exact: true }).click({ timeout: 20_000 })
  await page.getByRole('heading', { name: text.denied, exact: true }).waitFor()
  assert.equal(await page.getByRole('textbox', { name: text.label, exact: true }).count(), 0)
  assert.equal(await page.getByText('Initial synthetic', { exact: true }).count(), 0)
})

test('closed campaign runtime makes no requests and does not claim an empty collection', async t => {
  const { page, fixture, text } = await open(t, 'de', 320, false)
  await page.getByRole('heading', { name: text.unavailable, exact: true }).waitFor()
  assert.equal(fixture.apiCalls, 0)
  assert.equal(await page.getByText(text.empty, { exact: true }).count(), 0)
})
