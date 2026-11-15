import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { checkDevGuardAlarm } from './official-truth-dev-guard-alarm.mjs'

const DEV_REF = 'yfvbxvijcorffwxbxahl'
const TOKEN = 'sb_publishable_unit_test_placeholder'
const ENV = Object.freeze({ SUPABASE_PROJECT_REF: DEV_REF, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: TOKEN })
const row = (status = 'current') => JSON.stringify({ schema: 1, status })
const response = (body = row(), { status = 200, headers = {} } = {}) => new Response(body, {
  status, headers: { 'content-type': 'application/json', ...headers },
})
const check = (body = row(), options = {}) => checkDevGuardAlarm({ env: ENV, fetchImpl: async () => response(body, options) })
function expectCode(actual, code) {
  assert.deepEqual(actual, { schema: 1, status: code === 'current' ? 'current' : 'alarm', code })
  assert.equal(Object.isFrozen(actual), true)
  assert.equal(JSON.stringify(actual).includes(TOKEN), false)
  assert.equal(JSON.stringify(actual).includes(DEV_REF), false)
}

test('the transport can only read the fixed Dev anonymous status RPC with its public apikey', async () => {
  let calls = 0
  const result = await checkDevGuardAlarm({ env: ENV, fetchImpl: async (url, init) => {
    calls++
    assert.equal(url, `https://${DEV_REF}.supabase.co/rest/v1/rpc/official_v3_guard_alarm_status_v1`)
    assert.equal(init.method, 'POST')
    assert.equal(init.redirect, 'error')
    assert.equal(init.cache, 'no-store')
    assert.equal(init.credentials, 'omit')
    assert.deepEqual(init.headers, { apikey: TOKEN, 'Content-Type': 'application/json', Accept: 'application/json' })
    assert.equal(init.body, '{}')
    assert.ok(init.signal instanceof AbortSignal)
    return response()
  } })
  expectCode(result, 'current')
  assert.equal(calls, 1)
})

test('the single unavailable public status is an alarm', async () => expectCode(await check(row('unavailable')), 'guard_unavailable'))
test('the exact status accepts JSON whitespace and either object key order', async () => {
  expectCode(await check(' \n{ "status" : "current", "schema" : 1 }\t\r'), 'current')
})

test('a Management PAT is never read, sent or used as a fallback', async () => {
  const env = Object.defineProperty({ ...ENV }, 'SUPABASE_ACCESS_TOKEN', { get() { throw new Error('private management credential') } })
  expectCode(await checkDevGuardAlarm({ env, fetchImpl: async (_url, init) => {
    assert.equal(Object.keys(init.headers).some(name => name.toLowerCase() === 'authorization'), false)
    return response()
  } }), 'current')
  let calls = 0
  expectCode(await checkDevGuardAlarm({ env: { SUPABASE_PROJECT_REF: DEV_REF, SUPABASE_ACCESS_TOKEN: 'private-management-placeholder' },
    fetchImpl: async () => { calls++; return response() } }), 'configuration_missing')
  assert.equal(calls, 0)
})

for (const [name, env, code] of [
  ['missing configuration', {}, 'configuration_missing'],
  ['missing public key', { SUPABASE_PROJECT_REF: DEV_REF }, 'configuration_missing'],
  ['missing target', { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: TOKEN }, 'configuration_missing'],
  ['different target', { ...ENV, SUPABASE_PROJECT_REF: 'another-project' }, 'target_refused'],
  ['Production target', { ...ENV, SUPABASE_PROJECT_REF: 'qscbgcdmivbbnzrcyegn' }, 'target_refused'],
  ['whitespace in target', { ...ENV, SUPABASE_PROJECT_REF: `${DEV_REF} ` }, 'target_refused'],
  ['CRLF in key', { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: `${TOKEN}\r\nHeader:value` }, 'credentials_invalid'],
  ['non-string key', { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {} }, 'credentials_invalid'],
  ['oversized key', { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'x'.repeat(4097) }, 'credentials_invalid'],
  ['empty publishable suffix', { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' }, 'credentials_invalid'],
  ['secret key', { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_unit_test_placeholder' }, 'credentials_invalid'],
  ['Management key', { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sbp_unit_test_placeholder' }, 'credentials_invalid'],
  ['user bearer', { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'Bearer ' + TOKEN }, 'credentials_invalid'],
  ['prefixed URL', { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'https://example.invalid/' + TOKEN }, 'credentials_invalid'],
  ['throwing environment', Object.defineProperty({}, 'SUPABASE_PROJECT_REF', { get() { throw new Error(TOKEN) } }), 'configuration_invalid'],
]) {
  test(`${name} refuses the request before HTTP`, async () => {
    let calls = 0
    expectCode(await checkDevGuardAlarm({ env, fetchImpl: async () => { calls++; return response() } }), code)
    assert.equal(calls, 0)
  })
}
for (const [role, ref] of [['anon', DEV_REF], ['anon', 'other-project'], ['service_role', DEV_REF], ['authenticated', DEV_REF]]) {
  test(`legacy/user JWT ${role}/${ref === DEV_REF ? 'Dev' : 'foreign'} is refused before transport`, async () => {
    const jwt = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ role, ref })).toString('base64url'), 'fixture_signature'].join('.')
    let calls = 0
    expectCode(await checkDevGuardAlarm({ env: { ...ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt },
      fetchImpl: async () => { calls++; return response() } }), 'credentials_invalid')
    assert.equal(calls, 0)
  })
}
test('missing transport is a failure', async () => {
  expectCode(await checkDevGuardAlarm({ env: ENV, fetchImpl: null }), 'transport_unavailable')
})

for (const [status, code] of [[201, 'http_failure'], [401, 'access_denied'], [403, 'access_denied'], [429, 'rate_limited'], [500, 'http_failure'], [503, 'http_failure'], [302, 'redirect_refused']]) {
  test(`HTTP ${status} cannot become healthy from its body`, async () => expectCode(await check(row(), { status }), code))
}
test('a redirected response is refused even if it claims success', async () => {
  const redirected = response()
  Object.defineProperty(redirected, 'redirected', { value: true })
  expectCode(await checkDevGuardAlarm({ env: ENV, fetchImpl: async () => redirected }), 'redirect_refused')
})
test('missing response body is refused', async () => expectCode(await check(null), 'response_invalid'))
test('a wrong content type is refused', async () => expectCode(await check(row(), { headers: { 'content-type': 'text/html' } }), 'response_invalid'))
test('the UTF-8 content type is accepted', async () => expectCode(await check(row(), { headers: { 'content-type': 'application/json; charset=utf-8' } }), 'current'))

for (const [name, body] of [
  ['empty JSON', ''],
  ['malformed JSON', '[{'],
  ['empty array', '[]'],
  ['two results', `[${row()},${row()}]`],
  ['scalar string', '"current"'],
  ['old Management row', '[{"guard_status":{"schema":1,"status":"current"}}]'],
  ['extra status field', '{"schema":1,"status":"current","extra":true}'],
  ['wrong schema', '{"schema":2,"status":"current"}'],
  ['string schema', '{"schema":"1","status":"current"}'],
  ['missing schema', '{"status":"current"}'],
  ['missing status', '{"schema":1}'],
  ['unknown status', row('healthy')],
  ['free-form response', row(TOKEN)],
  ['duplicate status', '{"schema":1,"status":"unavailable","status":"current"}'],
  ['duplicate schema', '{"schema":2,"schema":1,"status":"current"}'],
  ['escaped object key', '{"schema":1,"\\u0073tatus":"current"}'],
  ['escaped status', '{"schema":1,"status":"curre\\u006et"}'],
  ['raw provider error', '{"code":"42501","message":"PRIVATE_PROVIDER_RESPONSE","details":"private","hint":null}'],
  ['trailing content', `${row()}true`],
  ['invalid UTF-8', new Uint8Array([0xff, 0xfe])],
]) {
  test(`${name} cannot become a healthy response`, async () => expectCode(await check(body), 'response_invalid'))
}
for (const status of ['unchecked', 'clock', 'incident', 'stale']) {
  test(`private internal status ${status} cannot leak through the public contract`, async () => expectCode(await check(row(status)), 'response_invalid'))
}
test('a response exactly at the byte limit can be accepted', async () => {
  const body = row().padEnd(8192, ' ')
  expectCode(await check(body, { headers: { 'content-length': '8192' } }), 'current')
})
test('an oversized streamed body is rejected without content-length', async () => {
  expectCode(await check(row().padEnd(8193, ' ')), 'response_too_large')
})
for (const length of ['8193', '-1', '1.0', '0001', '999999999999999999']) {
  test(`content-length ${length} is rejected`, async () => expectCode(await check(row(), { headers: { 'content-length': length } }), 'response_too_large'))
}
test('a truncated body cannot satisfy its content-length', async () => {
  expectCode(await check(row(), { headers: { 'content-length': '1000' } }), 'response_invalid')
})
test('an explicit identity encoding still requires the declared length', async () => {
  expectCode(await check(row(), { headers: { 'content-length': '1000', 'content-encoding': 'identity' } }), 'response_invalid')
})
// These fixtures model native Fetch's already decoded body plus wire headers;
// they are not live Data API or compression-library evidence.
for (const encoding of ['gzip', 'br', 'deflate']) {
  test(`${encoding} decoded current is not compared to its compressed wire length`, async () => {
    expectCode(await check(row(), { headers: { 'content-length': '27', 'content-encoding': encoding } }), 'current')
  })
  test(`${encoding} cannot exceed the decoded byte limit`, async () => {
    expectCode(await check(row().padEnd(8193, ' '), { headers: { 'content-length': '27', 'content-encoding': encoding } }), 'response_too_large')
  })
  test(`${encoding} cannot hide incomplete or invalid decoded JSON`, async () => {
    expectCode(await check('[{"guard_status":', { headers: { 'content-length': '27', 'content-encoding': encoding } }), 'response_invalid')
  })
}
test('network exceptions expose no free-form message or credentials', async () => {
  expectCode(await checkDevGuardAlarm({ env: ENV, fetchImpl: async () => { throw new Error(`secret ${TOKEN} ${DEV_REF}`) } }), 'network_failed')
})

test('an already aborted request performs no HTTP call', async () => {
  const controller = new AbortController()
  controller.abort()
  let calls = 0
  expectCode(await checkDevGuardAlarm({ env: ENV, signal: controller.signal, fetchImpl: async () => { calls++; return response() } }), 'aborted')
  assert.equal(calls, 0)
})
test('external cancellation aborts and awaits the active fetch', async () => {
  const controller = new AbortController()
  let settled = false
  const pending = checkDevGuardAlarm({ env: ENV, signal: controller.signal, fetchImpl: async (_url, { signal }) => {
    await new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true }))
    settled = true
    throw new Error(TOKEN)
  } })
  controller.abort()
  expectCode(await pending, 'aborted')
  assert.equal(settled, true)
})
test('the ten-second deadline aborts and awaits the active fetch', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let settled = false
  const pending = checkDevGuardAlarm({ env: ENV, fetchImpl: async (_url, { signal }) => {
    await new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true }))
    settled = true
    throw new Error(TOKEN)
  } })
  t.mock.timers.tick(10000)
  expectCode(await pending, 'timeout')
  assert.equal(settled, true)
})
test('a deadline during body reading cancels the body before returning', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let reading, cancelled = false
  const started = new Promise((resolve) => { reading = resolve })
  let finishRead
  const reader = {
    read() { reading(); return new Promise((resolve) => { finishRead = resolve }) },
    async cancel() { cancelled = true; finishRead({ done: true }) },
    releaseLock() { assert.equal(cancelled, true) },
  }
  const pending = checkDevGuardAlarm({ env: ENV, fetchImpl: async () => ({
    status: 200, redirected: false, headers: new Headers({ 'content-type': 'application/json' }), body: { getReader: () => reader },
  }) })
  await started
  t.mock.timers.tick(10000)
  expectCode(await pending, 'timeout')
  assert.equal(cancelled, true)
})
test('the failure result awaits owned body cancellation', async () => {
  let cancelStarted, finishCancellation
  const started = new Promise((resolve) => { cancelStarted = resolve })
  const drained = new Promise((resolve) => { finishCancellation = resolve })
  let completed = false
  const body = new ReadableStream({ cancel() { cancelStarted(); return drained } })
  const pending = checkDevGuardAlarm({ env: ENV, fetchImpl: async () => response(body, { status: 403 }) }).then((result) => { completed = true; return result })
  await started
  assert.equal(completed, false)
  finishCancellation()
  expectCode(await pending, 'access_denied')
})
test('body cleanup failures are safe failures', async () => {
  const body = new ReadableStream({ cancel() { throw new Error(TOKEN) } })
  expectCode(await checkDevGuardAlarm({ env: ENV, fetchImpl: async () => response(body, { status: 403 }) }), 'cleanup_failed')
})
test('CLI emits one safe failure line when configuration is missing', () => {
  const path = fileURLToPath(new URL('./official-truth-dev-guard-alarm.mjs', import.meta.url))
  const child = spawnSync(process.execPath, [path], { env: {}, encoding: 'utf8', timeout: 2000 })
  assert.equal(child.status, 1)
  assert.equal(child.stderr, '')
  assert.equal(child.stdout, '{"schema":1,"status":"alarm","code":"configuration_missing"}\n')
})
test('CLI refuses arguments without executing HTTP', () => {
  const path = fileURLToPath(new URL('./official-truth-dev-guard-alarm.mjs', import.meta.url))
  const child = spawnSync(process.execPath, [path, '--url', TOKEN], { env: ENV, encoding: 'utf8', timeout: 2000 })
  assert.equal(child.status, 1)
  assert.equal(child.stderr, '')
  assert.equal(child.stdout, '{"schema":1,"status":"alarm","code":"arguments_refused"}\n')
})
