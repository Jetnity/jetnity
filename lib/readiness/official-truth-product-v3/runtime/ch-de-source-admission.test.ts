// Explicit offline UTC instants and the actual shared precheck/HTTP routes.
// No global clock replacement, database connection, source GET or production call.
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { NextResponse } from 'next/server'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import type { Ma1MethodSqlExecutor } from '../method/authority-postgres'
import type { ChDeTickReport } from './ch-de-tick'
import type { ChDeOwnerImportOutcome, ChDeOwnerImportRequest } from './ch-de-owner-import-contract'
import { chDeSourceAdmissionOpen } from './ch-de-source-admission'

const SLOT = Date.parse('2026-11-15T17:55:00.000Z')
const DEV = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const PROD = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
const PREVIEW = 'https://fixture-preview.vercel.app'
const KEY = 'offline_source_admission_secret_0123456789'
const ORIGINAL: ChDeOwnerImportRequest = Object.freeze({ schema: 2, mode: 'start',
  operationId: 'op3_' + 'a'.repeat(32), leaseId: 'lease3_' + 'b'.repeat(32) })

test('UTC source admission leaves the full 30-second tick/audit plus five seconds on each side', () => {
  for (const slot of [SLOT, Date.parse('2026-11-16T00:00:00.000Z'), Date.parse('2026-03-29T01:00:00.000Z')]) {
    for (const offset of [-35_000, -1, 0, 30_000, 34_999]) assert.equal(chDeSourceAdmissionOpen(slot + offset), false)
    for (const offset of [-35_001, 35_000, 60_000, 264_999]) assert.equal(chDeSourceAdmissionOpen(slot + offset), true)
    assert.equal(chDeSourceAdmissionOpen(slot + 265_000), false)
    assert.equal(chDeSourceAdmissionOpen(slot + 300_000), false)
  }
  for (const invalid of [NaN, Infinity, -Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER, 8_640_000_000_000_001]) {
    assert.equal(chDeSourceAdmissionOpen(invalid), false)
  }
})

test('all real source POSTs refuse before enqueue/START and retain the original request across the BG1 window', async t => {
  let sourceTime = SLOT + 60_000, afterMethod: number | null = null, target = DEV
  let methods = 0, enqueues = 0, ticks = 0, gates = 0, gateAllowed = true
  let observed: ChDeOwnerImportRequest | undefined, observedSignal: AbortSignal | undefined
  const binding = AA_BERN_CH_DE_REVIEWED_PROGRAM.binding
  const executor: Ma1MethodSqlExecutor = { async readCurrent(request, _signal, budget) {
    methods++; assert.ok(budget)
    assert.equal(request.methodId, binding.methodId); assert.equal(request.revision, binding.revision)
    if (afterMethod !== null) sourceTime = afterMethod
    return { status: 'rows', rows: [{ status: 'approved', method_id: binding.methodId, revision: String(binding.revision),
      method_digest: binding.methodDigest, package_digest: binding.packageDigest, epoch: '1',
      approval_mode: 'until_revoked', approval_until: null, observed_at: request.checkedAt, remaining_ms: '5000' }] }
  } }
  t.mock.module(new URL('./ch-de-source-admission.ts', import.meta.url), { namedExports: {
    chDeSourceAdmissionOpen, chDeSourceUtcNow: () => sourceTime,
  } })
  t.mock.module(new URL('../transport/node-postgres-executors.ts', import.meta.url), { namedExports: {
    V3_NODE_POSTGRES_EXECUTORS: { method: executor },
  } })
  t.mock.module(new URL('../../../auth/admin-guard.ts', import.meta.url), { namedExports: {
    async requireAdminApi(input: unknown) {
      gates++
      assert.deepEqual(input, { surface: 'official-truth-import', capability: 'official-truth-freigeben' })
      return gateAllowed ? { ok: true, role: 'owner', grant: 'role' }
        : { ok: false, response: NextResponse.json({ error: 'access_required' }, { status: 403 }) }
    },
  } })
  t.mock.module(new URL('../../../supabase/server.ts', import.meta.url), { namedExports: {
    getServerSupabaseUrl: () => target,
  } })
  t.mock.module(new URL('./ch-de-refresh.ts', import.meta.url), { namedExports: {
    async enqueueOfficialTruthV3ChDeRefresh(body: ChDeOwnerImportRequest, signal: AbortSignal): Promise<ChDeOwnerImportOutcome> {
      enqueues++; observed = body; observedSignal = signal
      return { schema: 1, status: 'queued', published: 0 }
    },
  } })
  t.mock.module(new URL('./ch-de-tick.ts', import.meta.url), { namedExports: {
    async runOfficialTruthV3ChDeTick(signal: AbortSignal, body: ChDeOwnerImportRequest): Promise<ChDeTickReport> {
      ticks++; observed = body; observedSignal = signal
      return { schema: 1, status: 'complete', calls: { started: 1, settled: 1 },
        stages: { discovery: 'skipped', monitor: 'skipped', research: 'processed' },
        counts: { published: 1, escalated: 0, researchQueued: 0, suppressed: 0, deferred: 0,
          sourceUnavailable: 0, unconfirmed: 0, unavailable: 0, invalid: 0 },
        elapsedMilliseconds: 20, budgetMilliseconds: 30000 }
    },
  } })
  t.mock.method(console, 'info', () => undefined)
  const owner = await import('../../../../app/api/internal/readiness/ch-de-owner-import/route')
  const dev = await import('../../../../app/api/internal/readiness/ch-de-dev-refresh/route')
  const prod = await import('../../../../app/api/internal/readiness/ch-de-prod-refresh/route')
  const endpoints = [
    { name: 'Owner', path: '/api/internal/readiness/ch-de-owner-import', target: DEV, scheduler: null, post: owner.POST },
    { name: 'Dev scheduler', path: '/api/internal/readiness/ch-de-dev-refresh', target: DEV, scheduler: 'Dev', post: dev.POST },
    { name: 'Production scheduler contract', path: '/api/internal/readiness/ch-de-prod-refresh', target: PROD, scheduler: 'Prod', post: prod.POST },
  ] as const
  const environment = { VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
    VERCEL_GIT_REPO_OWNER: 'Jetnity', VERCEL_GIT_REPO_SLUG: 'jetnity',
    JETNITY_DEV_IMPORT_CRON_SECRET: KEY, JETNITY_PROD_IMPORT_CRON_SECRET: KEY }
  const names = [...Object.keys(environment), 'VERCEL_ENV', 'VERCEL_GIT_COMMIT_REF']
  const before = new Map(names.map(name => [name, process.env[name]]))
  Object.assign(process.env, environment)
  t.after(() => { for (const [name, value] of before) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value
  } })
  function reset(endpoint: typeof endpoints[number]) {
    methods = enqueues = ticks = gates = 0; gateAllowed = true
    observed = observedSignal = undefined; afterMethod = null; target = endpoint.target
    sourceTime = SLOT + 60_000
    process.env.VERCEL_ENV = target === PROD ? 'production' : 'preview'
    process.env.VERCEL_GIT_COMMIT_REF = target === PROD ? 'main' : 'feat/official-truth-human-method-ui-1-20261112'
  }
  function request(endpoint: typeof endpoints[number], mode: 'start' | 'resume', authorized = true) {
    const body = { ...ORIGINAL, mode }, time = String(Date.now())
    const headers = new Headers({ 'content-type': 'application/json' })
    const origin = endpoint.target === PROD ? 'https://jetnity.com' : PREVIEW
    if (endpoint.scheduler) {
      const prefix = endpoint.scheduler.toLowerCase()
      const text = [`jetnity-${prefix}-import-v1`, 'POST', endpoint.path, time, '2', mode, body.operationId, body.leaseId].join('\n')
      headers.set(`X-Jetnity-${endpoint.scheduler}-Import-Time`, time)
      headers.set('authorization', 'HMAC-SHA256 ' + (authorized ? createHmac('sha256', KEY).update(text).digest('hex') : '0'.repeat(64)))
    } else headers.set('origin', origin)
    return { body, time, req: new Request(origin + endpoint.path, { method: 'POST', headers, body: JSON.stringify(body) }) }
  }
  for (const endpoint of endpoints) {
    await t.test(`${endpoint.name}: both original phases refuse with zero effects throughout the blocked window`, async () => {
      for (const instant of [SLOT - 35_000, SLOT - 1, SLOT, SLOT + 34_999]) {
        for (const mode of ['start', 'resume'] as const) {
          reset(endpoint); sourceTime = instant
          const { req, body, time } = request(endpoint, mode)
          const response = await endpoint.post(req)
          assert.equal(response.status, 503)
          assert.deepEqual(await response.json(), { schema: 1, status: 'unavailable', published: 0 })
          assert.deepEqual([methods, enqueues, ticks], [0, 0, 0]); assert.equal(observed, undefined)
          assert.equal(gates, endpoint.scheduler ? 0 : 1)
          if (endpoint.scheduler) {
            const text = [`jetnity-${endpoint.scheduler.toLowerCase()}-import-response-v1`, 'POST', endpoint.path, time, '2', mode,
              body.operationId, body.leaseId, '1', '503', 'unavailable', '0'].join('\n')
            assert.equal(response.headers.get(`X-Jetnity-${endpoint.scheduler}-Import-Mac`), createHmac('sha256', KEY).update(text).digest('hex'))
          }
        }
      }
    })
    await t.test(`${endpoint.name}: crossing the cutoff during the actual method read starts no enqueue or tick`, async () => {
      for (const mode of ['start', 'resume'] as const) {
        reset(endpoint); sourceTime = SLOT - 35_001; afterMethod = SLOT - 35_000
        const response = await endpoint.post(request(endpoint, mode).req)
        assert.equal(response.status, 503)
        assert.deepEqual(await response.json(), { schema: 1, status: 'unavailable', published: 0 })
        assert.deepEqual([methods, enqueues, ticks], [1, 0, 0]); assert.equal(observed, undefined)
      }
    })
    await t.test(`${endpoint.name}: open boundary keeps the exact original request and signal`, async () => {
      for (const instant of [SLOT - 35_001, SLOT + 35_000]) {
        for (const mode of ['start', 'resume'] as const) {
          reset(endpoint); sourceTime = instant
          const { req, body } = request(endpoint, mode)
          const response = await endpoint.post(req)
          assert.equal(response.status, 200)
          assert.deepEqual(await response.json(), { schema: 1, status: mode === 'start' ? 'queued' : 'published', published: mode === 'start' ? 0 : 1 })
          assert.deepEqual([methods, enqueues, ticks], mode === 'start' ? [1, 1, 0] : [1, 0, 1])
          assert.deepEqual(observed, body); assert.equal(observedSignal, req.signal)
        }
      }
    })
    await t.test(`${endpoint.name}: the blocked schedule never substitutes for actual authorization`, async () => {
      reset(endpoint); sourceTime = SLOT; gateAllowed = false
      const response = await endpoint.post(request(endpoint, 'resume', false).req)
      assert.equal(response.status, endpoint.scheduler ? 401 : 403)
      assert.deepEqual([methods, enqueues, ticks], [0, 0, 0])
    })
  }
})
