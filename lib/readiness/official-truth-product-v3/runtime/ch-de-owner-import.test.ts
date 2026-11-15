// Offline HTTP/auth and browser-dispatch behavior. No real account, SQL or source.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { NextRequest } from 'next/server'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DevOwnerImportPanel from '../../../../app/(admin)/admin/official-truth/import/DevOwnerImportPanel'
import type { ChDeTickReport } from './ch-de-tick'
import {
  CH_DE_OWNER_IMPORT_BODY, CH_DE_OWNER_IMPORT_PATH, CH_DE_OWNER_IMPORT_REQUEST_BYTES, CH_DE_OWNER_IMPORT_RESPONSE_BYTES,
  chDeOwnerImportMessage, createChDeOwnerImportStarter, createChDeOwnerImportContinuation,
  readChDeOwnerImportRequest, readChDeOwnerImportOutcome,
  type ChDeOwnerImportRequest, type ChDeOwnerImportOutcome,
} from './ch-de-owner-import-contract'

const DEV = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const ORIGIN = 'https://fixture-preview.vercel.app'
const GUARDS = {
  VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
  VERCEL_GIT_REPO_OWNER: 'Jetnity', VERCEL_GIT_REPO_SLUG: 'jetnity',
  VERCEL_GIT_COMMIT_REF: 'feat/official-truth-human-method-ui-1-20261112',
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
function report(status: ChDeTickReport['status'] = 'complete', published = 0): ChDeTickReport {
  const idle = status === 'busy' || status === 'unavailable'
  return {
    schema: 1, status, calls: { started: idle ? 0 : 3, settled: idle ? 0 : 3 },
    stages: { discovery: idle ? 'skipped' : 'not_due', monitor: idle ? 'skipped' : 'complete', research: idle ? 'skipped' : 'processed' },
    counts: { published, escalated: 0, researchQueued: 0, suppressed: 0, deferred: 0,
      sourceUnavailable: 0, unconfirmed: 0, unavailable: status === 'unavailable' ? 1 : 0, invalid: 0 },
    elapsedMilliseconds: 20, budgetMilliseconds: 30000,
  }
}

test('manual Dev POST refuses before I/O and uses the existing current Owner/AAL2 gate', async t => {
  Object.assign(process.env, GUARDS)
  // Isolated test process: never consume a real break-glass allowlist.
  process.env.ADMIN_ALLOWED_EMAILS = ''
  let target: string | undefined = DEV
  let userPresent = true, role: string | null = 'owner', currentAal: string | null = 'aal2', nextAal = 'aal2', aalFailed = false
  const fixtureEmail = ['offline-owner', 'fixture.invalid'].join('@')
  let clients = 0, identities = 0, profiles = 0, assurances = 0, approvals = 0, ticks = 0
  let proxyClients = 0, proxyIdentities = 0
  let approval: 'approved' | 'not_approved' | 'unavailable' = 'approved'
  let gateHold: ReturnType<typeof deferred<void>> | null = null
  let approvalHold: ReturnType<typeof deferred<void>> | null = null
  let tickHold: ReturnType<typeof deferred<void>> | null = null
  let tickEntered: ReturnType<typeof deferred<void>> | null = null
  let tickThrows = false, observedSignal: AbortSignal | null = null
  let observedSelection: ChDeOwnerImportRequest | undefined
  let result = report()
  let enqueueCalls = 0
  t.mock.method(console, 'warn', () => undefined)
  t.mock.method(console, 'error', () => undefined)
  t.mock.module('@supabase/ssr', { namedExports: {
    createServerClient() {
      proxyClients++
      return { auth: { async getUser() { proxyIdentities++; return { data: { user: null }, error: null } } } }
    },
  } })
  t.mock.module(new URL('../../../supabase/server.ts', import.meta.url), { namedExports: {
    getServerSupabaseUrl() { return target },
    async createServerComponentClient() {
      clients++
      return {
        auth: {
          async getUser() {
            identities++; if (gateHold) await gateHold.promise
            return { data: { user: userPresent ? { id: 'offline-owner', email: fixtureEmail } : null }, error: null }
          },
          mfa: { async getAuthenticatorAssuranceLevel() {
            assurances++
            return { data: { currentLevel: currentAal, nextLevel: nextAal }, error: aalFailed ? { message: 'offline refusal' } : null }
          } },
        },
        from(table: string) {
          assert.equal(table, 'profiles'); profiles++
          return { select(columns: string) {
            assert.equal(columns, 'role')
            return { eq(column: string, value: string) {
              assert.equal(column, 'user_id'); assert.equal(value, 'offline-owner')
              return { async maybeSingle() { return { data: role === null ? null : { role }, error: null } } }
            } }
          } }
        },
      }
    },
  } })
  t.mock.module(new URL('./ch-de-server.ts', import.meta.url), { namedExports: {
    async checkOfficialTruthV3ChDeMethod(signal: AbortSignal) {
      approvals++; assert.equal(signal.aborted, false)
      if (approvalHold) await approvalHold.promise
      return approval
    },
  } })
  t.mock.module(new URL('./ch-de-tick.ts', import.meta.url), { namedExports: {
    async runOfficialTruthV3ChDeTick(signal: AbortSignal, selection?: ChDeOwnerImportRequest) {
      observedSelection = selection
      ticks++; observedSignal = signal; tickEntered?.resolve()
      if (tickHold) await tickHold.promise
      if (tickThrows) throw Error('private failure must not escape')
      return result
    },
  } })
  t.mock.module(new URL('./ch-de-refresh.ts', import.meta.url), { namedExports: {
    async enqueueOfficialTruthV3ChDeRefresh(selection: ChDeOwnerImportRequest, signal: AbortSignal): Promise<ChDeOwnerImportOutcome> {
      enqueueCalls++; observedSelection = selection; observedSignal = signal
      return { schema: 1, status: 'queued', published: 0 }
    },
  } })
  const route = await import('../../../../app/api/internal/readiness/ch-de-owner-import/route')
  const { proxy } = await import('../../../../proxy')
  assert.equal(route.maxDuration, 60); assert.equal(route.runtime, 'nodejs')
  assert.equal(Object.hasOwn(route, 'GET'), false)
  function counters() { return { clients, identities, profiles, assurances, approvals, ticks } }
  function reset() {
    clients = identities = profiles = assurances = approvals = ticks = 0
    proxyClients = proxyIdentities = 0
    userPresent = true; role = 'owner'; currentAal = nextAal = 'aal2'; aalFailed = false
    target = DEV; approval = 'approved'; result = report(); tickThrows = false
    observedSelection = undefined
    enqueueCalls = 0
    gateHold = approvalHold = tickHold = tickEntered = null
    Object.assign(process.env, GUARDS)
    process.env.ADMIN_ALLOWED_EMAILS = ''
  }
  t.beforeEach(reset)
  function request(input: { url?: string; method?: string; headers?: HeadersInit; body?: BodyInit | null; signal?: AbortSignal } = {}) {
    const method = input.method ?? 'POST'
    const headers = new Headers({ origin: ORIGIN, 'content-type': 'application/json' })
    for (const [name, value] of new Headers(input.headers)) headers.set(name, value)
    const body = Object.hasOwn(input, 'body') ? input.body : method === 'GET' || method === 'HEAD' ? null : CH_DE_OWNER_IMPORT_BODY
    return new Request(input.url ?? ORIGIN + CH_DE_OWNER_IMPORT_PATH, {
      method, headers, body, signal: input.signal, ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
    })
  }
  async function rejected(req: Request, expected: number) {
    const response = await route.POST(req)
    assert.equal(response.status, expected)
    assert.match(response.headers.get('cache-control') ?? '', /private, no-store/)
    assert.ok(new TextEncoder().encode(await response.text()).byteLength <= CH_DE_OWNER_IMPORT_RESPONSE_BYTES)
    assert.deepEqual(counters(), { clients: 0, identities: 0, profiles: 0, assurances: 0, approvals: 0, ticks: 0 })
  }
  await t.test('every missing/wrong Preview field and Production with a Dev URL refuse before Auth', async () => {
    for (const [key, expected] of Object.entries(GUARDS)) {
      delete process.env[key]; await rejected(request(), 503)
      process.env[key] = 'wrong-' + expected; await rejected(request(), 503)
      process.env[key] = expected
    }
    process.env.VERCEL_ENV = 'production'; await rejected(request(), 503)
    process.env.VERCEL_ENV = 'preview'
    for (const wrong of [undefined, 'https://qscbgcdmivbbnzrcyegn.supabase.co', DEV + '/', 'https://fixture.invalid']) {
      target = wrong; await rejected(request(), 503)
    }
    reset()
  })
  await t.test('Production uses its own exact target and the same fresh Owner, AAL2 and method gates', async () => {
    const production = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
    const selectProduction = () => {
      Object.assign(process.env, { VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main' })
      target = production
    }
    const productionRequest = () => request({ url: 'https://jetnity.com' + CH_DE_OWNER_IMPORT_PATH,
      headers: { origin: 'https://jetnity.com' }, body: JSON.stringify({ schema: 2, mode: 'start',
        operationId: 'op3_' + '3'.repeat(32), leaseId: 'lease3_' + '4'.repeat(32) }) })
    selectProduction()
    target = DEV
    await rejected(productionRequest(), 503)
    for (const fail of [() => { userPresent = false }, () => { role = 'manager' },
      () => { currentAal = 'aal1' }, () => { aalFailed = true }]) {
      reset(); selectProduction(); fail()
      const response = await route.POST(productionRequest())
      assert.ok([401, 403, 503].includes(response.status))
      assert.equal(approvals, 0); assert.equal(enqueueCalls, 0); assert.equal(ticks, 0)
    }
    reset(); selectProduction(); approval = 'not_approved'
    assert.equal((await route.POST(productionRequest())).status, 409)
    assert.equal(enqueueCalls, 0); assert.equal(ticks, 0)
    reset(); selectProduction()
    const accepted = await route.POST(productionRequest())
    assert.equal(accepted.status, 200)
    assert.deepEqual(await accepted.json(), { schema: 1, status: 'queued', published: 0 })
    assert.equal(identities, 1); assert.equal(assurances, 1); assert.equal(approvals, 1)
    assert.equal(enqueueCalls, 1); assert.equal(ticks, 0)
    assert.equal(observedSelection?.operationId, 'op3_' + '3'.repeat(32))
    assert.equal(observedSelection?.leaseId, 'lease3_' + '4'.repeat(32))
    reset()
  })
  await t.test('real Proxy plus fixed POST refuses target/origin/body before all Auth I/O', async () => {
    // Public synthetic fixtures only. A protected-path control proves the mock
    // observes the real Proxy's client/identity I/O; no account is contacted.
    process.env.NEXT_PUBLIC_SUPABASE_URL = DEV
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'offline-public-placeholder'
    const protectedResponse = await proxy(new NextRequest(ORIGIN + '/api/admin/official-truth/method'))
    assert.equal(protectedResponse.status, 401)
    assert.equal(proxyClients, 1); assert.equal(proxyIdentities, 1)
    reset()
    async function throughProxy(req: Request) {
      const native = new NextRequest(req)
      const boundary = await proxy(native)
      assert.equal(boundary.headers.get('x-middleware-next'), '1')
      assert.equal(proxyClients, 0); assert.equal(proxyIdentities, 0)
      return route.POST(native)
    }
    async function refused(req: Request, status: number) {
      assert.equal((await throughProxy(req)).status, status)
      assert.deepEqual(counters(), { clients: 0, identities: 0, profiles: 0, assurances: 0, approvals: 0, ticks: 0 })
    }
    target = 'https://qscbgcdmivbbnzrcyegn.supabase.co'; await refused(request(), 503); reset()
    process.env.VERCEL_ENV = 'production'; await refused(request(), 503)
    process.env.VERCEL_ENV = 'preview'
    await refused(request({ headers: { origin: 'https://other.invalid' } }), 400)
    await refused(request({ body: '{"schema":1,"target":"other"}' }), 400)
    const allowed = await throughProxy(request())
    assert.equal(allowed.status, 200)
    // The existing guard creates one client for identity and another for AAL.
    assert.deepEqual(counters(), { clients: 2, identities: 1, profiles: 1, assurances: 1, approvals: 1, ticks: 1 })
    reset()
  })
  await t.test('method, origin, path, query, framing, type and exact body are all checked before Auth', async () => {
    const cases = [
      request({ method: 'GET' }), request({ method: 'PUT' }), request({ url: ORIGIN + CH_DE_OWNER_IMPORT_PATH + '?run=1' }),
      request({ url: ORIGIN + CH_DE_OWNER_IMPORT_PATH + '#fragment' }), request({ url: ORIGIN + '/api/admin/official-truth/method' }),
      request({ headers: { origin: 'https://other.invalid' } }), request({ headers: { origin: ORIGIN + '/' } }),
      request({ headers: { origin: 'null' } }), request({ url: 'http://fixture-preview.vercel.app' + CH_DE_OWNER_IMPORT_PATH,
        headers: { origin: 'http://fixture-preview.vercel.app' } }),
      request({ headers: { 'content-type': 'text/plain' } }), request({ headers: { 'content-type': 'application/json; charset=utf-16' } }),
      request({ headers: { 'transfer-encoding': 'chunked' } }), request({ headers: { 'content-encoding': 'gzip' } }),
      request({ headers: { 'content-length': '100000' } }), request({ headers: { 'content-length': '0' } }),
      request({ headers: { 'content-length': '01' } }), request({ headers: { 'content-length': '12,12' } }),
      request({ body: null }), request({ body: '' }), request({ body: 'null' }), request({ body: '[]' }),
      request({ body: '{"schema":2}' }), request({ body: '{"schema":1,"methodId":"other"}' }),
      request({ body: '{"schema":1,"target":"other"}' }), request({ body: '{"schema":1,"source":"other"}' }),
      request({ body: '{"schema":1,"role":"owner"}' }), request({ body: '{"schema":1,"sql":"SELECT 1"}' }),
      request({ body: '{"schema":1,"schema":1}' }), request({ body: 'x'.repeat(65) }),
      request({ body: new Uint8Array([0xff, 0xfe]) }), request({ body: '\uFEFF' + CH_DE_OWNER_IMPORT_BODY }),
      request({ headers: { 'content-length': '12' }, body: CH_DE_OWNER_IMPORT_BODY + ' ' }),
    ]
    const missingOrigin = request(); missingOrigin.headers.delete('origin'); cases.push(missingOrigin)
    const missingType = request(); missingType.headers.delete('content-type'); cases.push(missingType)
    for (const req of cases) await rejected(req, 400)
    const valid = request({ headers: { 'content-length': String(CH_DE_OWNER_IMPORT_BODY.length), 'content-type': 'application/json; charset=utf-8' } })
    assert.equal((await route.POST(valid)).status, 200)
    assert.equal(ticks, 1); reset()
  })
  await t.test('stream overflow and abort await body cancellation before any Auth', async () => {
    let cancelled = false
    const oversized = new ReadableStream<Uint8Array>({ start(stream) { stream.enqueue(new Uint8Array(CH_DE_OWNER_IMPORT_REQUEST_BYTES + 1)) }, cancel() { cancelled = true } })
    await rejected(request({ body: oversized }), 400); assert.equal(cancelled, true)
    cancelled = false
    const entered = deferred<void>(), controller = new AbortController()
    const stalled = new ReadableStream<Uint8Array>({ pull() { entered.resolve() }, cancel() { cancelled = true } })
    const pending = route.POST(request({ body: stalled, signal: controller.signal }))
    await entered.promise; controller.abort()
    assert.equal((await pending).status, 400); assert.equal(cancelled, true)
    assert.deepEqual(counters(), { clients: 0, identities: 0, profiles: 0, assurances: 0, approvals: 0, ticks: 0 })
  })
  await t.test('missing session, role/capability, break-glass and non-current AAL2 never reach method or tick', async () => {
    const failures: (() => void)[] = [
      () => { userPresent = false },
      () => { role = 'user' },
      () => { role = 'manager' },
      () => { role = null },
      () => { role = null; process.env.ADMIN_ALLOWED_EMAILS = fixtureEmail },
      () => { currentAal = 'aal1'; nextAal = 'aal2' },
      () => { currentAal = null },
      () => { aalFailed = true },
    ]
    for (const fail of failures) {
      reset(); fail()
      const response = await route.POST(request())
      assert.ok([401, 403, 503].includes(response.status)); assert.equal(identities, 1)
      assert.equal(approvals, 0); assert.equal(ticks, 0)
    }
    reset()
  })
  await t.test('fresh current method refusal or abort after Auth never dispatches a tick', async () => {
    for (const state of ['not_approved', 'unavailable'] as const) {
      reset(); approval = state
      const response = await route.POST(request())
      assert.equal(response.status, state === 'not_approved' ? 409 : 503)
      assert.equal(assurances, 1); assert.equal(approvals, 1); assert.equal(ticks, 0)
    }
    reset(); gateHold = deferred<void>()
    const hold = gateHold, controller = new AbortController()
    const pending = route.POST(request({ signal: controller.signal }))
    await new Promise(resolve => setImmediate(resolve)); controller.abort(); hold.resolve()
    await pending; assert.equal(approvals, 0); assert.equal(ticks, 0)
    reset(); approvalHold = deferred<void>()
    const methodHold = approvalHold, controller2 = new AbortController()
    const pending2 = route.POST(request({ signal: controller2.signal }))
    await new Promise(resolve => setImmediate(resolve)); controller2.abort(); methodHold.resolve()
    await pending2; assert.equal(approvals, 1); assert.equal(ticks, 0)
    reset()
  })
  await t.test('only a full published report becomes publication success; no HTTP-only success', async () => {
    for (const [tickReport, status, http] of [
      [report('complete', 1), 'published', 200], [report(), 'complete', 200],
      [report('busy'), 'busy', 409], [report('unavailable'), 'unavailable', 503],
      [report('stopped'), 'unresolved', 503], [report('interrupted'), 'unresolved', 503],
      [report('stopped', 1), 'unresolved', 503],
    ] as const) {
      reset(); result = tickReport
      const req = request(), response = await route.POST(req), outcome = readChDeOwnerImportOutcome(await response.json())
      assert.equal(response.status, http); assert.equal(outcome?.status, status)
      assert.equal(outcome?.published, tickReport.counts.published)
      assert.equal(identities, 1); assert.equal(profiles, 1); assert.equal(assurances, 1); assert.equal(approvals, 1); assert.equal(ticks, 1)
      assert.equal(observedSignal, req.signal)
    }
    reset(); result = { ...report('complete', 1), calls: { started: 3, settled: 2 } }
    assert.equal((await (await route.POST(request())).json()).status, 'unresolved')
    reset(); tickThrows = true
    const response = await route.POST(request()), text = await response.text()
    assert.equal(response.status, 503); assert.equal(JSON.parse(text).status, 'unresolved')
    assert.doesNotMatch(text, /private failure/); reset()
  })
  await t.test('client abort cannot release an unsettled tick promise or imply rollback', async () => {
    tickHold = deferred<void>(); tickEntered = deferred<void>()
    const held = tickHold, entered = tickEntered, controller = new AbortController()
    let answered = false
    const pending = route.POST(request({ signal: controller.signal })).then(value => { answered = true; return value })
    await entered.promise; controller.abort(); await Promise.resolve()
    assert.equal(answered, false); assert.equal(ticks, 1)
    held.resolve()
    const response = await pending
    assert.equal((await response.json()).status, 'unresolved')
    reset()
  })
  await t.test('original request continuation still crosses fresh Owner/AAL2 and method gates', async () => {
    const ids = { operationId: 'op3_' + 'a'.repeat(32), leaseId: 'lease3_' + 'b'.repeat(32) }
    for (const mode of ['start', 'resume'] as const) {
      reset()
      const selected = { schema: 2 as const, mode, ...ids }, text = JSON.stringify(selected)
      result = mode === 'resume' ? { ...report('complete', 1), calls: { started: 1, settled: 1 },
        stages: { discovery: 'skipped', monitor: 'skipped', research: 'processed' } } : report('complete', 1)
      const response = await route.POST(request({ body: text, headers: { 'content-length': String(text.length) } }))
      assert.equal(response.status, 200); assert.equal((await response.json()).status, mode === 'start' ? 'queued' : 'published')
      assert.deepEqual(observedSelection, selected)
      assert.equal(enqueueCalls, mode === 'start' ? 1 : 0)
      assert.deepEqual(counters(), { clients: 2, identities: 1, profiles: 1, assurances: 1, approvals: 1, ticks: mode === 'start' ? 0 : 1 })
      reset(); currentAal = 'aal1'
      assert.equal((await route.POST(request({ body: text }))).status, 403)
      assert.equal(ticks, 0); assert.equal(approvals, 0)
    }
    reset()
    const valid = JSON.stringify({ schema: 2, mode: 'resume', ...ids })
    for (const body of [valid.replace('"mode":"resume"', '"mode":"resume","mode":"resume"'),
      valid.replace('"schema":2', '"schema":2,"target":"other"'),
      valid.replace('lease3_', 'token_'), valid.replace('"resume"', '"restart"'), valid + ' ']) {
      await rejected(request({ body }), 400)
    }
    result = { ...report('complete', 1), calls: { started: 3, settled: 3 } }
    assert.equal((await (await route.POST(request({ body: valid }))).json()).status, 'unresolved',
      'a resume cannot claim success from another stage shape')
    reset(); result = { ...report('stopped'), stages: { discovery: 'not_due', monitor: 'complete', research: 'exhausted' },
      counts: { ...report().counts, deferred: 1 } }
    assert.equal((await (await route.POST(request())).json()).status, 'exhausted')
    result = { ...result, counts: { ...result.counts, unconfirmed: 1 } }
    assert.equal((await (await route.POST(request())).json()).status, 'unresolved')
    reset()
  })
})

test('manual caller is inert until clicked, one-shot, bounded and honest about lost responses', async t => {
  let calls = 0
  let respond: () => Promise<Response> = async () => Response.json({ schema: 1, status: 'complete', published: 0 })
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    calls++; assert.equal(input, CH_DE_OWNER_IMPORT_PATH); assert.equal(init?.method, 'POST')
    assert.equal(init?.body, CH_DE_OWNER_IMPORT_BODY); assert.equal(init?.credentials, 'same-origin')
    assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store')
    return await respond()
  })
  const html = renderToStaticMarkup(createElement(DevOwnerImportPanel))
  assert.match(html, /<button type="button"/)
  assert.match(html, /Quellenimport für Dev starten/)
  assert.match(html, /Bestehenden Quellenlauf wiederaufnehmen/)
  assert.match(html, /Ursprüngliche Vorgangskennung/)
  assert.match(html, /Ursprüngliche Lease-Kennung/)
  assert.match(html, /Vorhandenen Vorgang übernehmen/)
  assert.doesNotMatch(html, /op3_[a-f0-9]{32}|lease3_[a-f0-9]{32}/, 'recovery has no hard-coded original identifiers')
  const productionHtml = renderToStaticMarkup(createElement(DevOwnerImportPanel, { environment: 'Production' }))
  assert.match(productionHtml, /Quellenimport für Production starten/)
  assert.match(productionHtml, /auf jetnity.com/)
  assert.doesNotMatch(productionHtml, /in Dev veröffentlichen/)
  assert.match(html, /aria-live="polite"/)
  assert.equal(calls, 0, 'rendering the real panel cannot start a source import')
  const starter = createChDeOwnerImportStarter()
  assert.equal(calls, 0)
  const held = deferred<Response>(); respond = () => held.promise
  const first = starter.start(new AbortController().signal)
  assert.equal(calls, 1)
  assert.equal(await starter.start(new AbortController().signal), null); assert.equal(calls, 1)
  held.resolve(Response.json({ schema: 1, status: 'published', published: 1 }))
  assert.equal((await first)?.status, 'published')
  assert.equal(await starter.start(new AbortController().signal), null); assert.equal(calls, 1)
  for (const [response, expected] of [
    [Response.json({ ok: true }), 'unresolved'],
    [Response.json({ schema: 1, status: 'published', published: 1 }, { status: 503 }), 'unresolved'],
    [Response.json({ schema: 1, status: 'complete', published: 0 }), 'complete'],
    [Response.json({ schema: 1, status: 'busy', published: 0 }, { status: 409 }), 'busy'],
    [Response.json({ schema: 1, status: 'unavailable', published: 0 }, { status: 503 }), 'unavailable'],
    [Response.json({ error: 'denied' }, { status: 401 }), 'access_required'],
    [new Response('x'.repeat(1025), { headers: { 'content-type': 'application/json' } }), 'unresolved'],
    [new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }), 'unresolved'],
    [new Response('{}', { headers: { 'content-type': 'application/json', 'content-length': '1025' } }), 'unresolved'],
  ] as const) {
    respond = async () => response
    const one = createChDeOwnerImportStarter()
    const before: number = calls
    assert.equal((await one.start(new AbortController().signal))?.status, expected)
    assert.equal(calls, before + 1); assert.equal(await one.start(new AbortController().signal), null)
  }
  respond = async () => { throw Error('lost response') }
  const lost = createChDeOwnerImportStarter()
  const before: number = calls
  const outcome = await lost.start(new AbortController().signal)
  assert.equal(outcome?.status, 'unresolved'); assert.match(chDeOwnerImportMessage(outcome!), /keine Rücknahme/)
  assert.equal(await lost.start(new AbortController().signal), null); assert.equal(calls, before + 1)
  const controller = new AbortController(), waiting = deferred<Response>()
  respond = () => waiting.promise
  const aborted = createChDeOwnerImportStarter().start(controller.signal)
  controller.abort(); waiting.resolve(Response.json({ schema: 1, status: 'published', published: 1 }))
  assert.equal((await aborted)?.status, 'unresolved')
  const preAborted = new AbortController(); preAborted.abort()
  const unchanged = calls
  assert.equal(await createChDeOwnerImportStarter().start(preAborted.signal), null); assert.equal(calls, unchanged)
})

test('manual continuation retains exact original IDs across loss and remount without automatic dispatch', async t => {
  const values = new Map<string, string>(), requests: ChDeOwnerImportRequest[] = []
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
  let generated = 0, response = deferred<Response>()
  const workResponse = deferred<Response>()
  let enqueueAcknowledged = false
  const options = { storage: () => storage, identifier: () => (++generated % 2 ? 'c' : 'd').repeat(32) }
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input, CH_DE_OWNER_IMPORT_PATH); assert.equal(init?.method, 'POST')
    assert.equal(init?.credentials, 'same-origin'); assert.equal(init?.cache, 'no-store'); assert.equal(init?.redirect, 'error')
    const parsed = readChDeOwnerImportRequest(String(init?.body)); assert.ok(parsed)
    assert.equal(values.size, 1, 'original identity is retained before the network effect')
    requests.push(parsed)
    if (enqueueAcknowledged && parsed.mode === 'resume') return workResponse.promise
    return response.promise
  })
  const first = createChDeOwnerImportContinuation(options)
  assert.equal(first.restore(), false); assert.equal(generated, 0); assert.equal(requests.length, 0)
  const pending = first.start(new AbortController().signal)
  assert.equal(requests.length, 1); assert.equal(requests[0]!.mode, 'start')
  assert.equal(await first.start(new AbortController().signal), null)
  response.resolve(Response.json({ schema: 1, status: 'unresolved', published: 0 }, { status: 503 }))
  assert.equal((await pending)?.status, 'unresolved'); assert.equal(first.restore(), true)
  const remounted = createChDeOwnerImportContinuation(options)
  assert.equal(remounted.restore(), true); assert.equal(requests.length, 1); assert.equal(generated, 2)
  response = deferred<Response>()
  const continuation = remounted.start(new AbortController().signal)
  assert.deepEqual(requests[1], requests[0], 'an unknown enqueue is retried with its original enqueue request')
  response.resolve(Response.json({ schema: 1, status: 'queued', published: 0 }, { status: 503 }))
  assert.equal((await continuation)?.status, 'unresolved'); assert.equal(values.size, 1)
  response = deferred<Response>()
  const final = remounted.start(new AbortController().signal)
  assert.deepEqual(requests[2], requests[1]); assert.equal(generated, 2)
  enqueueAcknowledged = true
  response.resolve(Response.json({ schema: 1, status: 'queued', published: 0 }))
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(requests[3], { ...requests[0], mode: 'resume' })
  assert.equal((JSON.parse([...values.values()][0]!) as { phase: string }).phase, 'work', 'work phase persists before dispatch')
  workResponse.resolve(Response.json({ schema: 1, status: 'published', published: 1 }))
  assert.equal((await final)?.status, 'published'); assert.equal(values.size, 0)
  assert.equal(await remounted.start(new AbortController().signal), null); assert.equal(requests.length, 4)

  storage.setItem('jetnity.dev.ch-de-import.request.v2', '{"schema":2,"mode":"resume"}')
  const corrupted = createChDeOwnerImportContinuation(options)
  assert.equal(corrupted.restore(), false)
  assert.equal((await corrupted.start(new AbortController().signal))?.status, 'unavailable')
  assert.equal(requests.length, 4, 'corrupt custody cannot be overwritten by a replacement request')
  values.clear()
  const inaccessible = createChDeOwnerImportContinuation({ ...options, storage: () => ({ ...storage,
    setItem() { throw Error('offline storage refusal') } }) })
  await inaccessible.start(new AbortController().signal)
  assert.equal(requests.length, 4, 'failure to retain identity happens before any dispatch')
})

test('legacy and already queued requests retain their original work phase on remount', async t => {
  const original: ChDeOwnerImportRequest = { schema: 2, mode: 'start', operationId: 'op3_' + 'e'.repeat(32), leaseId: 'lease3_' + 'f'.repeat(32) }
  const values = new Map<string, string>(), requests: ChDeOwnerImportRequest[] = []
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
  const options = { storage: () => storage, identifier: () => assert.fail('original custody cannot be replaced') }
  let status: 'published' | 'unresolved' = 'unresolved'
  t.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = readChDeOwnerImportRequest(String(init?.body)); assert.ok(body)
    requests.push(body)
    return Response.json({ schema: 1, status, published: status === 'published' ? 1 : 0 }, { status: status === 'published' ? 200 : 503 })
  })
  for (const key of ['jetnity.dev.ch-de-import.request.v2', 'jetnity.dev.ch-de-import.request.v3']) {
    values.set(key, key.endsWith('v2') ? JSON.stringify(original) : JSON.stringify({ schema: 1, request: original, phase: 'work' }))
    const before = requests.length, first = createChDeOwnerImportContinuation(options)
    assert.equal(first.restore(), true); assert.equal(requests.length, before)
    status = 'unresolved'; assert.equal((await first.start(new AbortController().signal))?.status, 'unresolved')
    const remounted = createChDeOwnerImportContinuation(options)
    assert.equal(remounted.restore(), true); assert.equal(requests.length, before + 1)
    status = 'published'; assert.equal((await remounted.start(new AbortController().signal))?.status, 'published')
    assert.deepEqual(requests.slice(before), [{ ...original, mode: 'resume' }, { ...original, mode: 'resume' }])
    assert.equal(values.size, 0)
  }
})

test('a lost durable enqueue-to-work transition cannot dispatch work or manufacture new identity', async t => {
  const values = new Map<string, string>(), requests: ChDeOwnerImportRequest[] = []
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if ((JSON.parse(value) as { phase: string }).phase === 'work') throw Error('offline phase write failure')
      values.set(key, value)
    }, removeItem: (key: string) => { values.delete(key) } }
  let generated = 0
  const options = { storage: () => storage, identifier: () => (++generated % 2 ? 'a' : 'b').repeat(32) }
  t.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = readChDeOwnerImportRequest(String(init?.body)); assert.ok(body); requests.push(body)
    return Response.json({ schema: 1, status: 'queued', published: 0 })
  })
  const first = createChDeOwnerImportContinuation(options)
  assert.equal((await first.start(new AbortController().signal))?.status, 'unresolved')
  assert.equal(requests.length, 1)
  const second = createChDeOwnerImportContinuation(options)
  assert.equal(second.restore(), true); assert.equal(requests.length, 1)
  assert.equal((await second.start(new AbortController().signal))?.status, 'unresolved')
  assert.equal(requests.length, 2); assert.deepEqual(requests[1], requests[0]); assert.equal(requests[0]?.mode, 'start')
  assert.equal(generated, 2)
})

test('explicit original recovery persists work before a separate resume click and survives remount', async t => {
  const original: ChDeOwnerImportRequest = { schema: 2, mode: 'resume', operationId: 'op3_' + 'a'.repeat(32), leaseId: 'lease3_' + 'b'.repeat(32) }
  const text = JSON.stringify(original), key = 'jetnity.dev.ch-de-import.request.v3'
  const retained = JSON.stringify({ schema: 1, request: { ...original, mode: 'start' }, phase: 'work' })
  const values = new Map<string, string>(), requests: ChDeOwnerImportRequest[] = []
  const storage = { getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => { values.set(name, value) }, removeItem: (name: string) => { values.delete(name) } }
  const options = { storage: () => storage, identifier: () => assert.fail('recovery never generates a replacement identity') }
  let response = deferred<Response>(), notifications = 0
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input, CH_DE_OWNER_IMPORT_PATH); assert.equal(init?.credentials, 'same-origin')
    assert.equal(values.get(key), retained, 'original work phase is durable before the request')
    const body = readChDeOwnerImportRequest(String(init?.body)); assert.ok(body); requests.push(body)
    return response.promise
  })
  const first = createChDeOwnerImportContinuation(options)
  const unsubscribe = first.subscribe(() => { notifications++ })
  assert.equal(first.retainOriginalResume(text), true)
  assert.equal(notifications, 1); assert.equal(values.get(key), retained)
  assert.equal(first.restore(), true); assert.equal(requests.length, 0, 'retention and restore are inert')
  unsubscribe()
  const remounted = createChDeOwnerImportContinuation(options)
  assert.equal(remounted.restore(), true); assert.equal(requests.length, 0)
  const active = remounted.start(new AbortController().signal)
  assert.deepEqual(requests, [original], 'the first dispatch is resume, never enqueue')
  assert.equal(remounted.retainOriginalResume(text), false, 'active work cannot be replaced')
  response.resolve(Response.json({ schema: 1, status: 'unresolved', published: 0 }, { status: 503 }))
  assert.equal((await active)?.status, 'unresolved')
  assert.equal(remounted.retainOriginalResume(text), false, 'a retained unknown outcome cannot be replaced')
  assert.equal(values.get(key), retained)
  response = deferred<Response>()
  const final = remounted.start(new AbortController().signal)
  response.resolve(Response.json({ schema: 1, status: 'published', published: 1 }))
  assert.equal((await final)?.status, 'published'); assert.equal(values.size, 0)
  assert.equal(remounted.retainOriginalResume(text), false, 'a finished caller cannot be repurposed')
  assert.deepEqual(requests, [original, original])
})

test('original recovery preserves every existing legacy, pending, corrupt or conflicting storage state', t => {
  const original: ChDeOwnerImportRequest = { schema: 2, mode: 'start', operationId: 'op3_' + 'c'.repeat(32), leaseId: 'lease3_' + 'd'.repeat(32) }
  const resume = JSON.stringify({ ...original, mode: 'resume' })
  const legacy = 'jetnity.dev.ch-de-import.request.v2', current = 'jetnity.dev.ch-de-import.request.v3'
  const stored = (phase: 'enqueue' | 'work') => JSON.stringify({ schema: 1, request: original, phase })
  const cases: ReadonlyArray<ReadonlyArray<readonly [string, string]>> = [
    [[legacy, JSON.stringify(original)]], [[current, stored('enqueue')]], [[current, stored('work')]],
    [[legacy, 'broken']], [[current, '']], [[legacy, JSON.stringify(original)], [current, stored('work')]],
  ]
  t.mock.method(globalThis, 'fetch', () => assert.fail('rejected recovery cannot dispatch'))
  for (const entries of cases) {
    const values = new Map(entries), before = [...values]
    const continuation = createChDeOwnerImportContinuation({
      storage: () => ({ getItem: key => values.get(key) ?? null,
        setItem: () => assert.fail('existing custody cannot be overwritten'),
        removeItem: () => assert.fail('existing custody cannot be removed') }),
      identifier: () => assert.fail('recovery cannot generate identity'),
    })
    assert.equal(continuation.retainOriginalResume(resume), false)
    assert.deepEqual([...values], before)
    values.clear()
    assert.equal(continuation.retainOriginalResume(resume), false, 'in-memory custody or a blocked state survives missing storage')
  }
})

test('original recovery rejects noncanonical inputs and blocks dispatch after storage failure', async t => {
  const original: ChDeOwnerImportRequest = { schema: 2, mode: 'resume', operationId: 'op3_' + 'e'.repeat(32), leaseId: 'lease3_' + 'f'.repeat(32) }
  const text = JSON.stringify(original), values = new Map<string, string>()
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
  const continuation = createChDeOwnerImportContinuation({ storage: () => storage,
    identifier: () => assert.fail('recovery cannot generate identity') })
  t.mock.method(globalThis, 'fetch', () => assert.fail('input retention or failure cannot dispatch'))
  for (const invalid of ['not JSON', text + '\n', JSON.stringify({ ...original, mode: 'start' }),
    text.replace('"schema":2', '"schema":2,"schema":2'), JSON.stringify({ ...original, authority: true }),
    JSON.stringify({ ...original, operationId: 'wrong' })]) {
    assert.equal(continuation.retainOriginalResume(invalid), false)
    assert.equal(values.size, 0)
  }
  assert.equal(continuation.retainOriginalResume(text), true, 'invalid input alone can be corrected explicitly')
  values.clear()
  for (const failure of ['access', 'read', 'write']) {
    let failing = true, notifications = 0
    const refused = createChDeOwnerImportContinuation({ storage: () => {
      if (failing && failure === 'access') throw Error('storage unavailable')
      return { ...storage,
        getItem(key: string) { if (failing && failure === 'read') throw Error('storage read failed'); return storage.getItem(key) },
        setItem(key: string, value: string) { if (failing && failure === 'write') throw Error('storage write failed'); storage.setItem(key, value) },
      }
    }, identifier: () => assert.fail('failed recovery cannot fall back to a fresh start') })
    const unsubscribe = refused.subscribe(() => { notifications++ })
    assert.equal(refused.retainOriginalResume(text), false); assert.equal(values.size, 0)
    assert.equal(notifications, 1)
    failing = false
    assert.equal(refused.retainOriginalResume(text), false)
    assert.equal((await refused.start(new AbortController().signal))?.status, 'unavailable')
    unsubscribe()
  }
})

test('minimal result contract rejects forged success and keeps distinct user states', () => {
  for (const value of [
    { schema: 1, status: 'published', published: 0 }, { schema: 1, status: 'complete', published: 1 },
    { schema: 1, status: 'busy', published: 1 }, { schema: 1, status: 'published', published: 33 },
    { schema: 1, status: 'published', published: 1.5 }, { schema: 1, status: 'published', published: 1, raw: 'private' },
    { schema: 1, status: 'accepted', published: 1 }, null,
  ]) assert.equal(readChDeOwnerImportOutcome(value), null)
  for (const status of ['queued', 'published', 'complete', 'exhausted', 'busy', 'not_approved', 'unavailable', 'access_required', 'request_refused', 'unresolved'] as const) {
    const outcome: ChDeOwnerImportOutcome = { schema: 1, status, published: status === 'published' ? 1 : 0 }
    assert.deepEqual(readChDeOwnerImportOutcome(outcome), outcome)
    assert.ok(chDeOwnerImportMessage(outcome).length > 20)
    assert.ok(new TextEncoder().encode(JSON.stringify(outcome)).byteLength <= CH_DE_OWNER_IMPORT_RESPONSE_BYTES)
  }
})

test('existing API inventory fails closed for the exact manual import route', () => {
  const root = mkdtempSync(join(tmpdir(), 'jetnity-owner-import-inventory-'))
  const routeRelative = 'app/api/internal/readiness/ch-de-owner-import/route.ts'
  const routePath = join(root, routeRelative)
  const original = readFileSync(new URL('../../../../' + routeRelative, import.meta.url), 'utf8')
  const acceptedRelative = 'app/api/readiness/accepted-store/route.ts'
  const acceptedPath = join(root, acceptedRelative)
  const script = fileURLToPath(new URL('../../../../scripts/api-schutz.mjs', import.meta.url))
  try {
    mkdirSync(dirname(routePath), { recursive: true }); mkdirSync(dirname(acceptedPath), { recursive: true })
    writeFileSync(acceptedPath, readFileSync(new URL('../../../../' + acceptedRelative, import.meta.url)))
    const guardRelative = 'app/api/internal/readiness/ch-de-owner-guard/route.ts'
    const guardPath = join(root, guardRelative)
    const guardSource = readFileSync(new URL('../../../../' + guardRelative, import.meta.url), 'utf8')
    mkdirSync(dirname(guardPath), { recursive: true }); writeFileSync(guardPath, guardSource)
    const machineRoutes = ['dev', 'prod'].map(environment => {
      const relative = `app/api/internal/readiness/ch-de-${environment}-refresh/route.ts`
      const path = join(root, relative)
      const source = readFileSync(new URL('../../../../' + relative, import.meta.url), 'utf8')
      mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, source)
      return { environment, path, source }
    })
    function run() { return spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8', timeout: 5_000 }) }
    writeFileSync(routePath, original)
    const allowed = run(); assert.equal(allowed.status, 0, allowed.stderr)
    for (const [source, expected] of [
      [null, 'geschützte Route fehlt'],
      [original.replace('await requireAdminApi(', 'await missingGate('), 'ruft requireAdminApi() nicht auf'],
      [original.replace('if (!gate.ok)', 'if (gate.ok)'), 'wertet das Ergebnis von requireAdminApi() nicht aus'],
      [original.replace('export async function POST(', 'export async function GET('), 'ausschliesslich der geschützte POST'],
    ] as const) {
      if (source === null) rmSync(routePath)
      else { assert.notEqual(source, original); writeFileSync(routePath, source) }
      const denied = run()
      assert.equal(denied.status, 1, denied.stderr)
      assert.ok(denied.stderr.includes(expected), denied.stderr)
    }
    writeFileSync(routePath, original)
    for (const [source, expected] of [
      [null, 'geschützte Route fehlt'],
      [guardSource.replace('await requireAdminApi(', 'await missingGate('), 'ruft requireAdminApi() nicht auf'],
      [guardSource.replace('if (!gate.ok)', 'if (gate.ok)'), 'wertet das Ergebnis von requireAdminApi() nicht aus'],
      [guardSource.replace('export async function POST(', 'export async function GET('), 'ausschliesslich der geschützte POST'],
    ] as const) {
      if (source === null) rmSync(guardPath)
      else { assert.notEqual(source, guardSource); writeFileSync(guardPath, source) }
      const denied = run()
      assert.equal(denied.status, 1, denied.stderr)
      assert.ok(denied.stderr.includes(expected), denied.stderr)
    }
    writeFileSync(guardPath, guardSource)
    for (const machine of machineRoutes) {
      for (const source of [null,
        machine.source.replace('export async function POST(', 'export async function GET('),
        machine.source.replace(`process.env.JETNITY_${machine.environment.toUpperCase()}_IMPORT_CRON_SECRET`, 'process.env.UNRELATED_SECRET'),
      ]) {
        if (source === null) rmSync(machine.path)
        else { assert.notEqual(source, machine.source); writeFileSync(machine.path, source) }
        const denied = run()
        assert.equal(denied.status, 1, denied.stderr)
        assert.match(denied.stderr, /fester Scheduler-Einstieg fehlt|feste HMAC-geschützte Quellen-POST/)
      }
      writeFileSync(machine.path, machine.source)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})
