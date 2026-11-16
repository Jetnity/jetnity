// Signed pg_net ingress; synthetic key/IDs, no hosted database or source effect.
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import type { ChDeTickReport } from './ch-de-tick'
import { readChDeDevRefreshRequest } from './ch-de-import-http'
import type { ChDeOwnerImportOutcome, ChDeOwnerImportRequest } from './ch-de-owner-import-contract'

const PATH = '/api/internal/readiness/ch-de-prod-refresh'
const PROD = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
const URL = 'https://jetnity.com' + PATH
const KEY = 'offline_synthetic_scheduler_secret_0123456789'
const NOW = Date.parse('2026-11-15T01:00:00.000Z')
const GUARDS = { VERCEL_ENV: 'production', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
  VERCEL_GIT_REPO_OWNER: 'Jetnity', VERCEL_GIT_REPO_SLUG: 'jetnity',
  VERCEL_GIT_COMMIT_REF: 'main' }
const ORIGINAL: ChDeOwnerImportRequest = { schema: 2, mode: 'start', operationId: 'op3_' + 'a'.repeat(32), leaseId: 'lease3_' + 'b'.repeat(32) }
function pgJson(body: ChDeOwnerImportRequest) {
  return `{"mode": "${body.mode}", "schema": 2, "leaseId": "${body.leaseId}", "operationId": "${body.operationId}"}`
}
function mac(body: ChDeOwnerImportRequest, time: string) {
  return createHmac('sha256', KEY).update(['jetnity-prod-import-v1', 'POST', PATH, time, '2', body.mode, body.operationId, body.leaseId].join('\n')).digest('hex')
}
function report(published = 1): ChDeTickReport {
  return { schema: 1, status: 'complete', calls: { started: 1, settled: 1 },
    stages: { discovery: 'skipped', monitor: 'skipped', research: 'processed' },
    counts: { published, escalated: 0, researchQueued: 0, suppressed: 0, deferred: 0,
      sourceUnavailable: 0, unconfirmed: 0, unavailable: 0, invalid: 0 },
    elapsedMilliseconds: 20, budgetMilliseconds: 30000 }
}

test('scheduler accepts only the two bounded duplicate-free schema2 encodings', () => {
  for (const mode of ['start', 'resume'] as const) {
    const body = { ...ORIGINAL, mode }
    assert.deepEqual(readChDeDevRefreshRequest(JSON.stringify(body)), body)
    assert.deepEqual(readChDeDevRefreshRequest(pgJson(body)), body)
    for (const text of [pgJson(body) + ' ', pgJson(body).replace('"schema": 2', '"schema": 2, "schema": 2'),
      pgJson(body).replace('"schema": 2', '"schema": 2, "target": "production"'),
      pgJson(body).replace('"schema": 2', '"schema": 2.0'), pgJson(body).replace('lease3_', 'token_'),
      pgJson(body).replace('"mode": ', '"mode":  '), '{"schema":1}', 'x'.repeat(257)]) {
      assert.equal(readChDeDevRefreshRequest(text), null)
    }
  }
})

test('Production refresh verifies signed immutable requests before ordinary method/work and signs every admitted result', async t => {
  let now = NOW, target: string | undefined = PROD, approvals = 0, enqueues = 0, ticks = 0
  let approval: 'approved' | 'not_approved' | 'unavailable' = 'approved'
  let queueOutcome: ChDeOwnerImportOutcome = { schema: 1, status: 'queued', published: 0 }, tickReport = report()
  let observed: ChDeOwnerImportRequest | undefined, observedSignal: AbortSignal | undefined
  let hold: Promise<void> | null = null, entered: (() => void) | null = null, failure = false
  let methodHold: Promise<void> | null = null, methodEntered: (() => void) | null = null
  const diagnostics: string[] = []
  t.mock.method(Date, 'now', () => now)
  t.mock.method(console, 'info', (line: string) => { diagnostics.push(line) })
  t.mock.module(new globalThis.URL('../../../supabase/server.ts', import.meta.url), { namedExports: { getServerSupabaseUrl() { return target } } })
  t.mock.module(new globalThis.URL('./ch-de-server.ts', import.meta.url), { namedExports: {
    async checkOfficialTruthV3ChDeMethod() { approvals++; methodEntered?.(); if (methodHold) await methodHold; return approval },
  } })
  t.mock.module(new globalThis.URL('./ch-de-refresh.ts', import.meta.url), { namedExports: {
    async enqueueOfficialTruthV3ChDeRefresh(body: ChDeOwnerImportRequest, signal: AbortSignal) {
      enqueues++; observed = body; observedSignal = signal; entered?.(); if (hold) await hold
      if (failure) throw Error('private detail')
      return queueOutcome
    },
  } })
  t.mock.module(new globalThis.URL('./ch-de-tick.ts', import.meta.url), { namedExports: {
    async runOfficialTruthV3ChDeTick(signal: AbortSignal, body: ChDeOwnerImportRequest) {
      ticks++; observed = body; observedSignal = signal; entered?.(); if (hold) await hold
      if (failure) throw Error('private detail')
      return tickReport
    },
  } })
  const route = await import('../../../../app/api/internal/readiness/ch-de-prod-refresh/route')
  assert.equal(route.runtime, 'nodejs'); assert.equal(route.maxDuration, 60); assert.equal(Object.hasOwn(route, 'GET'), false)
  function reset() {
    Object.assign(process.env, GUARDS, { JETNITY_PROD_IMPORT_CRON_SECRET: KEY })
    now = NOW; target = PROD; approvals = enqueues = ticks = 0; approval = 'approved'
    queueOutcome = { schema: 1, status: 'queued', published: 0 }; tickReport = report()
    observed = undefined; observedSignal = undefined; hold = null; entered = null; failure = false
    methodHold = null; methodEntered = null
    diagnostics.length = 0
  }
  reset(); t.beforeEach(reset)
  function request(input: { body?: BodyInit | null; selected?: ChDeOwnerImportRequest; time?: string; method?: string;
    url?: string; headers?: HeadersInit; signal?: AbortSignal } = {}) {
    const selected = input.selected ?? ORIGINAL, time = input.time ?? String(NOW), method = input.method ?? 'POST'
    const headers = new Headers({ 'content-type': 'application/json', 'X-Jetnity-Prod-Import-Time': time,
      authorization: 'HMAC-SHA256 ' + mac(selected, time) })
    for (const [name, value] of new Headers(input.headers)) headers.set(name, value)
    const body = Object.hasOwn(input, 'body') ? input.body : method === 'GET' || method === 'HEAD' ? null : pgJson(selected)
    return new Request(input.url ?? URL, { method, headers, body, signal: input.signal,
      ...(body instanceof ReadableStream ? { duplex: 'half' } : {}) })
  }
  async function rejected(req: Request, status: number) {
    const response = await route.POST(req)
    assert.equal(response.status, status); assert.equal(response.headers.has('X-Jetnity-Prod-Import-Mac'), false)
    assert.deepEqual([approvals, enqueues, ticks], [0, 0, 0])
  }
  async function admitted(req: Request, status: string, http: number, published = 0) {
    const original = req.clone()
    const response = await route.POST(req), text = await response.text(), outcome = JSON.parse(text)
    assert.equal(response.status, http); assert.deepEqual(outcome, { schema: 1, status, published })
    const selected = readChDeDevRefreshRequest(await original.text())
    assert.ok(selected)
    const expected = createHmac('sha256', KEY).update(['jetnity-prod-import-response-v1', 'POST', PATH,
      req.headers.get('X-Jetnity-Prod-Import-Time')!, '2', selected.mode, selected.operationId, selected.leaseId,
      '1', String(http), status, String(published)].join('\n')).digest('hex')
    assert.equal(response.headers.get('X-Jetnity-Prod-Import-Mac'), expected)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.ok(text.length < 1024); assert.ok(!text.includes(KEY)); assert.ok(!text.includes(ORIGINAL.operationId))
  }
  await t.test('every Production/main identity and exact Production target gate refuses before method or queue I/O', async () => {
    for (const [name, value] of Object.entries(GUARDS)) {
      delete process.env[name]; await rejected(request(), 503)
      process.env[name] = 'wrong'; await rejected(request(), 503)
      process.env[name] = value
    }
    process.env.VERCEL_ENV = 'preview'; await rejected(request(), 503); reset()
    for (const other of [undefined, PROD + '/', 'https://yfvbxvijcorffwxbxahl.supabase.co']) {
      target = other; await rejected(request(), 503)
    }
    reset()
    for (const key of [undefined, '', 'short', 'a'.repeat(257), ' '.repeat(32)]) {
      if (key === undefined) delete process.env.JETNITY_PROD_IMPORT_CRON_SECRET
      else process.env.JETNITY_PROD_IMPORT_CRON_SECRET = key
      await rejected(request(), 503)
    }
  })
  await t.test('request MAC binds phase, original IDs, exact path and time; stale/future/unsigned inputs refuse', async () => {
    const invalidHeaders: HeadersInit[] = [ { authorization: '' }, { authorization: 'Bearer ' + KEY },
      { authorization: 'HMAC-SHA256 ' + '0'.repeat(64) }, { authorization: 'HMAC-SHA256 ' + 'F'.repeat(64) },
      { 'X-Jetnity-Prod-Import-Time': '1e12' }, { 'X-Jetnity-Prod-Import-Time': String(NOW - 1) } ]
    for (const headers of invalidHeaders) {
      await rejected(request({ headers }), 401)
    }
    await rejected(request({ time: String(NOW - 120001) }), 401)
    await rejected(request({ time: String(NOW + 5001) }), 401)
    await rejected(request({ body: pgJson({ ...ORIGINAL, mode: 'resume' }) }), 401)
    await rejected(request({ body: pgJson({ ...ORIGINAL, operationId: 'op3_' + 'c'.repeat(32) }) }), 401)
    await rejected(request({ body: pgJson({ ...ORIGINAL, leaseId: 'lease3_' + 'd'.repeat(32) }) }), 401)
    const invalidRequests: Parameters<typeof request>[0][] = [ { method: 'GET' }, { method: 'PUT' }, { url: URL + '?run=1' }, { url: URL + '#fragment' },
      { url: URL.replace('https:', 'http:') }, { url: URL.replace('jetnity.com', 'preview.vercel.app') }, { url: URL.replace('jetnity.com', 'www.jetnity.com') }, { url: URL.replace('jetnity.com', 'jetnity.com:444') }, { url: URL.replace('ch-de-prod-refresh', 'ch-de-owner-import') },
      { headers: { cookie: 'session=anything' } }, { headers: { origin: 'https://fixture-preview.vercel.app' } },
      { headers: { 'content-type': 'text/plain' } }, { headers: { 'transfer-encoding': 'chunked' } },
      { headers: { 'content-encoding': 'gzip' } }, { headers: { 'content-length': '257' } },
      { headers: { 'content-length': '01' } }, { headers: { 'content-length': '1' } },
      { body: pgJson(ORIGINAL) + ' ' }, { body: pgJson(ORIGINAL).replace('"schema": 2', '"schema": 2, "schema": 2') },
      { body: '{"schema":1}' }, { body: new Uint8Array([0xff]) } ]
    for (const input of invalidRequests) await rejected(request(input), 400)
  })
  await t.test('both encodings only enqueue on start and resume the same original IDs on the next call', async () => {
    for (const mode of ['start', 'resume'] as const) {
      for (const encoding of [JSON.stringify, pgJson]) {
        const selected = { ...ORIGINAL, mode }, req = request({ selected, body: encoding(selected) })
        const clone = req.clone()
        await admitted(clone, mode === 'start' ? 'queued' : 'published', 200, mode === 'start' ? 0 : 1)
        assert.deepEqual(observed, selected); assert.equal(observedSignal, clone.signal)
        assert.deepEqual([approvals, enqueues, ticks], mode === 'start' ? [1, 1, 0] : [1, 0, 1])
        assert.deepEqual(diagnostics.map(line => JSON.parse(line).stage),
          ['method_precheck', 'method_precheck', mode === 'start' ? 'refresh_enqueue' : 'tick', mode === 'start' ? 'refresh_enqueue' : 'tick'])
        assert.ok(diagnostics.every(line => JSON.parse(line).kind === 'official_truth_production_import_diagnostic' && !line.includes(KEY) && !line.includes(ORIGINAL.operationId) && !line.includes(ORIGINAL.leaseId)))
        reset()
      }
    }
  })
  await t.test('Production rejects every preview bypass or cookie, even with a valid Production HMAC', async () => {
    const forbiddenHeaders: HeadersInit[] = [{ cookie: '' }, { cookie: '_vercel_jwt=a.b.c' }, { cookie: 'session=anything' },
      { 'x-vercel-protection-bypass': 'synthetic-preview-share' }, { 'x-vercel-set-bypass-cookie': 'true' }]
    for (const headers of forbiddenHeaders) {
      await rejected(request({ headers }), 400)
    }
    const devMac = createHmac('sha256', KEY).update(['jetnity-dev-import-v1', 'POST', '/api/internal/readiness/ch-de-dev-refresh', String(NOW),
      '2', ORIGINAL.mode, ORIGINAL.operationId, ORIGINAL.leaseId].join('\n')).digest('hex')
    await rejected(request({ headers: { authorization: 'HMAC-SHA256 ' + devMac } }), 401)
    const req = request(), headers = new Headers(req.headers)
    headers.delete('X-Jetnity-Prod-Import-Time'); headers.set('X-Jetnity-Dev-Import-Time', String(NOW))
    await rejected(new Request(req, { headers }), 401)
    delete process.env.JETNITY_PROD_IMPORT_CRON_SECRET
    process.env.JETNITY_DEV_IMPORT_CRON_SECRET = KEY
    await rejected(request(), 503)
    delete process.env.JETNITY_DEV_IMPORT_CRON_SECRET
  })
  await t.test('negative authority, actual unknown and zero-publication outcomes remain distinct and signed', async () => {
    approval = 'not_approved'; await admitted(request(), 'not_approved', 409)
    assert.deepEqual([approvals, enqueues, ticks], [1, 0, 0]); reset()
    approval = 'unavailable'; await admitted(request(), 'unavailable', 503); reset()
    for (const status of ['unresolved', 'busy', 'unavailable'] as const) {
      queueOutcome = { schema: 1, status, published: 0 }
      await admitted(request(), status, status === 'busy' ? 409 : 503); reset()
    }
    const selected = { ...ORIGINAL, mode: 'resume' as const }
    tickReport = report(0); await admitted(request({ selected }), 'complete', 200); reset()
    tickReport = { ...report(), calls: { started: 1, settled: 0 } }
    await admitted(request({ selected }), 'unresolved', 503); reset()
    tickReport = { ...report(), status: 'interrupted' }
    await admitted(request({ selected }), 'unresolved', 503, 1); reset()
    failure = true; await admitted(request(), 'unresolved', 503)
  })
  await t.test('body overflow/abort cancel before effect and age is checked again after body acquisition', async () => {
    let cancelled = false
    const overflow = new ReadableStream<Uint8Array>({ start(stream) { stream.enqueue(new Uint8Array(257)) }, cancel() { cancelled = true } })
    await rejected(request({ body: overflow }), 400); assert.equal(cancelled, true)
    let pull!: () => void
    const pulled = new Promise<void>(resolve => { pull = resolve })
    let stream!: ReadableStreamDefaultController<Uint8Array>
    const delayed = new ReadableStream<Uint8Array>({ start(value) { stream = value }, pull() { pull() } })
    const pending = route.POST(request({ body: delayed }))
    await pulled; now += 120001
    stream.enqueue(new TextEncoder().encode(pgJson(ORIGINAL))); stream.close()
    assert.equal((await pending).status, 401); assert.deepEqual([approvals, enqueues, ticks], [0, 0, 0])
  })
  await t.test('a MAC that expires during method resolution cannot start queue work', async () => {
    let release!: () => void, mark!: () => void
    methodHold = new Promise<void>(resolve => { release = resolve })
    const started = new Promise<void>(resolve => { mark = resolve }); methodEntered = mark
    const pending = route.POST(request())
    await started; now += 120001; release()
    const response = await pending
    assert.equal(response.status, 401); assert.equal((await response.json()).status, 'access_required')
    assert.match(response.headers.get('X-Jetnity-Prod-Import-Mac')!, /^[a-f0-9]{64}$/)
    assert.deepEqual([approvals, enqueues, ticks], [1, 0, 0])
  })
  await t.test('abort after dispatch drains the held invocation and signs unknown without another dispatch', async () => {
    let release!: () => void, mark!: () => void
    hold = new Promise<void>(resolve => { release = resolve })
    const started = new Promise<void>(resolve => { mark = resolve }); entered = mark
    const controller = new AbortController(); let answered = false
    const req = request({ signal: controller.signal })
    const pending = route.POST(req).then(value => { answered = true; return value })
    await started; controller.abort(); await Promise.resolve()
    assert.equal(answered, false); assert.equal(enqueues, 1)
    release()
    const response = await pending
    assert.equal((await response.json()).status, 'unresolved')
    assert.match(response.headers.get('X-Jetnity-Prod-Import-Mac')!, /^[a-f0-9]{64}$/)
    assert.equal(enqueues, 1); assert.equal(ticks, 0)
  })
})
