import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { checkProductionImport } from './official-truth-production-import-monitor.mjs'

const REF = 'qscbgcdmivbbnzrcyegn', TOKEN = 'sb_publishable_synthetic_monitor_only'
const ENV = Object.freeze({ JETNITY_PRODUCTION_IMPORT_MONITOR: `production:${REF}:enabled-v1`,
  SUPABASE_PROJECT_REF: REF, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: TOKEN })
const NOW = Date.parse('2026-11-15T02:00:00.000Z')
const schedule = () => ({ schema: 1, status: 'current', nextDueAt: NOW + 1200000 })
const visitor = () => ({ input: { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] },
  generatedAt: new Date(NOW).toISOString(), synthetic: false,
  cells: [{ country: 'CH', label: 'Schweiz', results: [{ status: 'accepted', title: 'Visum',
    conditions: ['synthetic display fixture'], statements: [{ text: 'synthetic display fixture', when: null, href: null }],
    source: { label: 'AA', href: 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820' },
    checkedAtText: 'Geprüft', validityText: 'Gültig', ruleVersion: 1, expiresAt: new Date(NOW + 1800000).toISOString() }] }] })
const response = (body, options = {}) => new Response(typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body), {
  status: options.status ?? 200, headers: { 'content-type': 'application/json', ...options.headers },
})
function fixtureFetch(state = schedule(), view = visitor(), options = {}) {
  return async url => url.includes('supabase.co') ? response(state, options.schedule) : response(view, options.visitor)
}
const check = (state = schedule(), view = visitor(), options = {}) => checkProductionImport({ env: ENV, fetchImpl: fixtureFetch(state, view, options) })
function assertSafe(result) {
  assert.equal(Object.isFrozen(result), true)
  for (const secret of [TOKEN, REF, 'private-provider-error', 'synthetic-import-signing-key']) assert.equal(JSON.stringify(result).includes(secret), false)
}

test('Production monitor observes the actual display and schedule independently with bounded public-only reads', async t => {
  t.mock.method(Date, 'now', () => NOW)
  await t.test('missing or another activation value is UNARMED and performs zero I/O', async () => {
    for (const gate of [undefined, '', 'true', 'dev:yfvbxvijcorffwxbxahl:enabled-v1']) {
      let calls = 0
      const result = await checkProductionImport({ env: { ...ENV, JETNITY_PRODUCTION_IMPORT_MONITOR: gate },
        fetchImpl: async () => { calls++; throw Error('must not read') } })
      assert.deepEqual(result, { schema: 1, status: 'unarmed', code: 'monitor_not_armed', schedule: 'not_checked', visitor: 'not_checked' })
      assert.equal(calls, 0); assertSafe(result)
    }
  })
  await t.test('fixed Production status/visitor endpoints, inputs and public apikey are the entire transport', async () => {
    const calls = []
    const result = await checkProductionImport({ env: ENV, fetchImpl: async (url, init) => {
      calls.push(url)
      assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit'); assert.equal(init.cache, 'no-store')
      assert.ok(init.signal instanceof AbortSignal)
      if (url.includes('supabase.co')) {
        assert.equal(url, `https://${REF}.supabase.co/rest/v1/rpc/jetnity_production_import_status_v1`)
        assert.deepEqual(init.headers, { 'Content-Type': 'application/json', Accept: 'application/json', apikey: TOKEN }); assert.equal(init.body, '{}')
        return response(schedule())
      }
      assert.equal(url, 'https://jetnity.com/api/readiness/ch-de-visa')
      assert.deepEqual(init.headers, { 'Content-Type': 'application/json', Accept: 'application/json' })
      assert.deepEqual(JSON.parse(init.body), { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] })
      return response(visitor())
    } })
    assert.equal(calls.length, 2); assert.equal(result.status, 'current'); assertSafe(result)
  })
  await t.test('foreign target and private credentials refuse without I/O; management/signing secrets are never read', async () => {
    for (const env of [{ ...ENV, SUPABASE_PROJECT_REF: 'yfvbxvijcorffwxbxahl' },
      ...[undefined, '', 'service_role_secret', 'eyJhbGciOiJIUzI1NiJ9.private.jwt', 'sb_secret_private', 'sb_publishable_' + 'a'.repeat(4096)]
        .map(key => ({ ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }))]) {
      let calls = 0
      const result = await checkProductionImport({ env, fetchImpl: async () => { calls++; return response(schedule()) } })
      assert.equal(result.status, 'alarm'); assert.equal(calls, 0); assertSafe(result)
    }
    const env = { ...ENV }
    for (const name of ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY', 'JETNITY_PROD_IMPORT_CRON_SECRET', 'JETNITY_DEV_IMPORT_CRON_SECRET']) {
      Object.defineProperty(env, name, { get() { throw Error('private credential was read') } })
    }
    assert.equal((await checkProductionImport({ env, fetchImpl: fixtureFetch() })).status, 'current')
  })
  await t.test('stopped, stale or blocked schedule alarms even while the visitor remains accepted', async () => {
    const result = await check({ schema: 1, status: 'unavailable', nextDueAt: null })
    assert.equal(result.status, 'alarm'); assert.equal(result.schedule, 'schedule_unavailable'); assert.equal(result.visitor, 'current')
    for (const nextDueAt of [null, NOW - 600001, NOW + 2400001]) {
      assert.equal((await check({ ...schedule(), nextDueAt })).status, 'alarm')
    }
  })
  await t.test('only exact duplicate-free three-field schedule JSON is accepted', async () => {
    assert.equal((await check(` { "nextDueAt": ${NOW + 1200000}, "status": "current", "schema": 1 } `)).status, 'current')
    for (const state of ['null', '[]', '{"schema":1,"status":"current","status":"current"}',
      `{"schema":1,"status":"current","nextDueAt":${NOW + 1200000},"schema":1}`,
      `{"schema":1,"status":"current","nextDueAt":${NOW + 1200000}.0}`,
      `{"schema":1,"st\\u0061tus":"current","nextDueAt":${NOW + 1200000}}`,
      { ...schedule(), token: 'private-provider-error' }, { schema: 1, status: 'unavailable', nextDueAt: NOW }]) {
      const result = await check(state); assert.equal(result.status, 'alarm'); assert.equal(result.schedule, 'response_invalid'); assertSafe(result)
    }
  })
  await t.test('an expired or expiring real visitor projection alarms with a healthy schedule', async () => {
    for (const [remaining, code] of [[-1, 'visitor_expired'], [0, 'visitor_expired'], [899999, 'visitor_expiring']]) {
      const view = visitor(); view.cells[0].results[0].expiresAt = new Date(NOW + remaining).toISOString()
      const result = await check(schedule(), view)
      assert.equal(result.status, 'alarm'); assert.equal(result.visitor, code); assert.equal(result.schedule, 'current')
    }
    const view = visitor(); view.cells[0].results[0].expiresAt = new Date(NOW + 900000).toISOString()
    const state = { ...schedule(), nextDueAt: NOW + 600000 }
    assert.equal((await check(state, view)).status, 'current')
  })
  await t.test('a next refresh at or after actual expiry fails the renewal budget', async () => {
    for (const delta of [0, 1]) {
      const result = await check({ ...schedule(), nextDueAt: NOW + 1800000 + delta })
      assert.equal(result.status, 'alarm'); assert.equal(result.schedule, 'renewal_after_expiry')
    }
  })
  await t.test('pending/error/synthetic/foreign/malformed or replayed visitor data is never current', async () => {
    const mutate = [v => { v.synthetic = true }, v => { v.input.destinationCountryCode = 'FR' },
      v => { v.cells[0].results[0] = { status: 'pending', title: 'Pending', message: 'Pending' } },
      v => { v.cells[0].results[0].source.href = 'https://foreign.example/' },
      v => { v.generatedAt = new Date(NOW - 30001).toISOString() }, v => { v.generatedAt = new Date(NOW + 5001).toISOString() },
      v => { v.cells[0].results[0].ruleVersion = 0 }, v => { v.cells[0].results[0].expiresAt = 'not-a-time' },
      v => { v.cells[0].results[0].conditions = [] }, v => { v.cells[0].results[0].extra = true }]
    for (const change of mutate) {
      const view = visitor(); change(view)
      const result = await check(schedule(), view); assert.equal(result.status, 'alarm'); assert.notEqual(result.visitor, 'current'); assertSafe(result)
    }
  })
  await t.test('both observations finish and report both failures rather than hiding the second failure', async () => {
    const result = await check({ schema: 1, status: 'unavailable', nextDueAt: null }, { private: 'private-provider-error' })
    assert.equal(result.schedule, 'schedule_unavailable'); assert.equal(result.visitor, 'response_invalid'); assertSafe(result)
  })
  await t.test('redirects, provider errors, rate limits, oversized/invalid UTF8 and false lengths alarm', async () => {
    for (const options of [{ status: 302 }, { status: 401 }, { status: 403 }, { status: 429 }, { status: 503 },
      { headers: { 'content-type': 'text/html' } }, { headers: { 'content-length': '99999' } },
      { headers: { 'content-length': '1' } }, { headers: { 'content-length': '01' } }]) {
      const result = await check(schedule(), visitor(), { schedule: options, visitor: options })
      assert.equal(result.status, 'alarm'); assert.notEqual(result.schedule, 'current'); assert.notEqual(result.visitor, 'current'); assertSafe(result)
    }
    assert.equal((await check('x'.repeat(8193))).schedule, 'response_too_large')
    assert.equal((await check(schedule(), 'x'.repeat(65537))).visitor, 'response_too_large')
    assert.equal((await check(new Uint8Array([0xff]))).schedule, 'response_invalid')
    assert.equal((await check(schedule(), visitor(), { visitor: { headers: { 'content-encoding': 'gzip', 'content-length': '20' } } })).status, 'current')
  })
  await t.test('abort joins held body cancellation before reporting; it admits no detached retry', async () => {
    const controller = new AbortController(); let entered = 0, cancellations = 0, release
    const drain = new Promise(resolve => { release = resolve })
    let bothReady
    const ready = new Promise(resolve => { bothReady = resolve })
    const pending = checkProductionImport({ env: ENV, signal: controller.signal, fetchImpl: async () => {
      entered++; if (entered === 2) bothReady()
      return new Response(new ReadableStream({ cancel() { cancellations++; return drain } }), { headers: { 'content-type': 'application/json' } })
    } })
    let finished = false; pending.then(() => { finished = true })
    await ready; await Promise.resolve(); controller.abort(); await Promise.resolve()
    assert.equal(finished, false); release()
    const result = await pending
    assert.equal(result.status, 'alarm'); assert.equal(cancellations, 2); assert.equal(entered, 2); assertSafe(result)
  })
  await t.test('real fixed deadline aborts stalled reads and returns only after cleanup', async () => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    let cancellations = 0, entered = 0, ready
    const started = new Promise(resolve => { ready = resolve })
    const pending = checkProductionImport({ env: ENV, fetchImpl: async () => {
      entered++; if (entered === 2) ready()
      return new Response(new ReadableStream({ cancel() { cancellations++ } }), { headers: { 'content-type': 'application/json' } })
    } })
    await started; await Promise.resolve(); t.mock.timers.tick(10001)
    const result = await pending
    assert.equal(result.schedule, 'timeout'); assert.equal(result.visitor, 'timeout'); assert.equal(cancellations, 2)
    t.mock.timers.reset()
  })
})

test('CLI stays unarmed without the explicit approval value and refuses target arguments', () => {
  const file = fileURLToPath(new URL('./official-truth-production-import-monitor.mjs', import.meta.url))
  const env = { ...process.env, JETNITY_PRODUCTION_IMPORT_MONITOR: '' }
  const unarmed = spawnSync(process.execPath, [file], { encoding: 'utf8', env, timeout: 5000 })
  assert.equal(unarmed.status, 2); assert.equal(JSON.parse(unarmed.stdout).status, 'unarmed')
  const refused = spawnSync(process.execPath, [file, '--target=dev'], { encoding: 'utf8', env, timeout: 5000 })
  assert.equal(refused.status, 1); assert.equal(JSON.parse(refused.stdout).code, 'arguments_refused')
})

test('prepared workflow has an explicit approval/public-main gate and a separate deliberate delivery probe', () => {
  const source = readFileSync(new URL('../.github/workflows/official-truth-production-import-monitor.yml', import.meta.url), 'utf8')
  for (const gate of ["github.repository == 'Jetnity/jetnity'", "github.ref == 'refs/heads/main'", 'github.event.repository.private == false',
    "vars.JETNITY_PRODUCTION_IMPORT_MONITOR == 'production:qscbgcdmivbbnzrcyegn:enabled-v1'"] ) assert.ok(source.includes(gate))
  assert.match(source, /timeout-minutes: 2/); assert.match(source, /default: false/); assert.match(source, /inputs\.alarm_delivery_probe/)
  assert.match(source, /persist-credentials: false/); assert.doesNotMatch(source, /secrets\.|npm ci|curl|cron\.schedule|JETNITY_PROD_IMPORT_CRON_SECRET/)
})
