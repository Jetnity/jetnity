import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import type { IncomingMessage, ClientRequest } from 'node:http'
import type https from 'node:https'
import { checkServerIdentity } from 'node:tls'
import { exerciseAppTransportForTests, validateAppRequest, type AppHttpRequest } from '../../../scripts/official-truth-bern-executor-app-1/github'
import { APP_API as API, APP_POLICY as P } from './policy'

const pins = { appId: 90001, installationId: 90002, clientId: 'Iv1.syntheticfixture', slug: 'synthetic-offline-app' }
const get: AppHttpRequest = { method: 'GET', path: '/app' }
type Options = { status?: number; data?: Buffer; headers?: Record<string, string>; complete?: boolean;
  rawHeaders?: string[]; stall?: boolean; syncError?: boolean; abortResponse?: boolean }
function fake(options: Options = {}) {
  let calls = 0, destroyed = false, responseDestroyed = false
  let captured: https.RequestOptions | undefined
  let sent: unknown
  const request = ((o: https.RequestOptions, callback: (r: IncomingMessage) => void) => {
    calls++; captured = o
    if (options.syncError) throw new Error('synthetic-secret-error-canary')
    const req = new EventEmitter() as ClientRequest
    req.destroy = () => { destroyed = true; return req }
    req.end = ((body: unknown) => {
      sent = body
      if (options.stall) return req
      queueMicrotask(() => {
        const data = options.data ?? Buffer.from('{"ok":true}')
        const stream = new Readable({ read() {
          if (options.abortResponse) { this.emit('aborted'); return }
          this.push(data); this.push(null)
        } })
        stream.on('close', () => { responseDestroyed = true })
        const res = stream as unknown as IncomingMessage
        res.statusCode = options.status ?? 200
        res.headers = { 'content-type': 'application/json', 'content-length': String(data.length), ...options.headers }
        res.rawHeaders = options.rawHeaders ?? Object.entries(res.headers).flatMap(([k, v]) => [k, String(v)])
        res.complete = options.complete ?? true
        callback(res)
      })
      return req
    }) as ClientRequest['end']
    return req
  }) as typeof https.request
  return { request, get calls() { return calls }, get destroyed() { return destroyed }, get responseDestroyed() { return responseDestroyed },
    get captured() { return captured }, get sent() { return sent } }
}
function exercise(f: ReturnType<typeof fake>, input = get, signal = new AbortController().signal) {
  return exerciseAppTransportForTests(pins, f.request, input, signal)
}
test('fixed GitHub HTTPS request options, strict TLS, no redirect and no caller headers', async () => {
  const f = fake(); assert.deepEqual(await exercise(f), { status: 200, body: { ok: true } })
  assert.equal(f.calls, 1); assert.equal(f.sent, undefined)
  const o = f.captured!
  assert.equal(o.hostname, 'api.github.com'); assert.equal(o.port, 443); assert.equal(o.protocol, 'https:')
  assert.equal(o.servername, 'api.github.com'); assert.equal(o.rejectUnauthorized, true)
  assert.equal(o.checkServerIdentity, checkServerIdentity); assert.equal(o.agent, false)
  assert.equal(o.minVersion, 'TLSv1.2'); assert.equal(o.maxHeaderSize, 16384)
  assert.deepEqual(o.headers, { Authorization: 'Bearer synthetic-installation-only-not-a-real-credential',
    Accept: 'application/vnd.github+json', 'Accept-Encoding': 'identity', 'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'jetnity-bern-executor-app-1-preflight' })
})
for (const [credentialCase, length] of [['stateless520', 520], ['stateless1200', 1200], ['opaque_min', 1], ['opaque_limit', 4096]] as const) {
  test('opaque credential reaches fixed header intact: ' + credentialCase, async () => {
    const f = fake()
    await exerciseAppTransportForTests(pins, f.request, get, new AbortController().signal, credentialCase)
    const authorization = (f.captured!.headers as Record<string, string>).Authorization!
    assert.equal(authorization.length, 'Bearer '.length + length); assert.equal(f.calls, 1)
    assert.ok(authorization.startsWith('Bearer '))
    assert.equal(Object.hasOwn(f.captured!.headers!, 'X-GitHub-Stateless-S2S-Token'), false)
  })
}
test('opaque punctuation is not decoded, normalized or truncated in the header', async () => {
  const f = fake()
  await exerciseAppTransportForTests(pins, f.request, get, new AbortController().signal, 'opaque_punctuation')
  assert.equal((f.captured!.headers as Record<string, string>).Authorization, 'Bearer synthetic!opaque~value+/=:,')
})
for (const credentialCase of ['empty', 'too_long', 'crlf', 'lf', 'nul', 'tab', 'space', 'del', 'non_ascii', 'non_string'] as const) {
  test('unsafe opaque credential never opens transport: ' + credentialCase, async () => {
    const f = fake()
    await assert.rejects(exerciseAppTransportForTests(pins, f.request, get, new AbortController().signal, credentialCase),
      /^Error: github_unverifiable$/)
    assert.equal(f.calls, 0); assert.equal(f.captured, undefined)
  })
}
test('sole POST uses fixed scoped token exchange body', async () => {
  const f = fake({ status: 201 })
  const body = { repository_ids: [P.repositoryId], permissions: P.permissions }
  await exercise(f, { method: 'POST', path: '/app/installations/90002/access_tokens', body })
  assert.equal(f.captured?.method, 'POST'); assert.equal(f.sent, JSON.stringify(body))
})
for (const status of Array.from({ length: 100 }, (_, i) => i + 300)) {
  test('redirect ' + status + ' never follows or returns response data', async () => {
    const f = fake({ status, headers: { location: 'https://bern.example/forbidden' } })
    await assert.rejects(exercise(f), /^Error: github_unverifiable$/)
    assert.equal(f.calls, 1); assert.equal(f.destroyed, true)
  })
}
const framing: [string, Options][] = [
  ['HTTP failure', { status: 401 }], ['non-JSON', { headers: { 'content-type': 'text/html' } }],
  ['wrong charset', { headers: { 'content-type': 'application/json; charset=latin1' } }],
  ['gzip', { headers: { 'content-encoding': 'gzip' } }],
  ['negative length', { headers: { 'content-length': '-1' } }],
  ['excess length', { headers: { 'content-length': '262145' } }],
  ['length mismatch', { headers: { 'content-length': '1' } }],
  ['duplicate length', { rawHeaders: ['content-type', 'application/json', 'content-length', '11', 'Content-Length', '11'] }],
  ['duplicate content type', { rawHeaders: ['content-type', 'application/json', 'Content-Type', 'text/html'] }],
  ['ambiguous framing', { headers: { 'transfer-encoding': 'chunked' } }],
  ['unsupported transfer', { headers: { 'transfer-encoding': 'gzip' } }],
  ['incomplete', { complete: false }], ['empty', { data: Buffer.alloc(0) }],
  ['over limit streaming', { data: Buffer.alloc(262145), headers: { 'content-length': '262144' } }],
  ['bad UTF8', { data: Buffer.from([0xff]) }], ['BOM', { data: Buffer.from([239, 187, 191, 123, 125]) }],
  ['invalid JSON', { data: Buffer.from('{"a":') }], ['appended JSON', { data: Buffer.from('{}{}') }],
  ['duplicate JSON key', { data: Buffer.from('{"id":1,"id":2}') }],
  ['escaped duplicate JSON key', { data: Buffer.from('{"id":1,"\\u0069d":2}') }],
  ['nested duplicate JSON key', { data: Buffer.from('{"a":[{"id":1,"id":2}]}') }],
  ['excess nesting', { data: Buffer.from('['.repeat(65) + '0' + ']'.repeat(65)) }],
  ['pagination', { headers: { link: '<https://api.github.com/next>; rel="next"' } }],
  ['response abort', { abortResponse: true }], ['raw throwing error redacted', { syncError: true }],
]
for (const [name, options] of framing) test('framing denies ' + name, async () => {
  const f = fake(options)
  await assert.rejects(exercise(f), /^Error: github_unverifiable$/)
  assert.equal(f.calls, 1)
})
test('abort cancels socket and deadline, no retry', async () => {
  const f = fake({ stall: true }), controller = new AbortController()
  const promise = exercise(f, get, controller.signal)
  controller.abort()
  await assert.rejects(promise, /github_unverifiable/)
  assert.equal(f.calls, 1); assert.equal(f.destroyed, true)
})
test('stalled socket is destroyed at unchanged five second request deadline', { timeout: 7000 }, async () => {
  const f = fake({ stall: true })
  await assert.rejects(exercise(f), /github_unverifiable/)
  assert.equal(f.calls, 1); assert.equal(f.destroyed, true)
})
test('already aborted call never opens a socket', async () => {
  const f = fake(), controller = new AbortController(); controller.abort()
  await assert.rejects(exercise(f, get, controller.signal), /github_unverifiable/)
  assert.equal(f.calls, 0)
})
const deniedRequests: AppHttpRequest[] = [
  { method: 'GET', path: 'https://api.github.com/app' }, { method: 'GET', path: '//api.github.com/app' },
  { method: 'GET', path: '/user' }, { method: 'GET', path: '/app\r\nInjected: yes' },
  { method: 'GET', path: '/app?redirect=https://bern.example' }, { method: 'GET', path: API + '/git/ref/heads/other' },
  { method: 'GET', path: API + '/rulesets/1' }, { method: 'POST', path: API + '/git/refs', body: {} },
  { method: 'POST', path: API + '/rulesets', body: {} },
  { method: 'POST', path: '/app/installations/90003/access_tokens', body: {} },
  { method: 'POST', path: '/app/installations/90002/access_tokens', body: { permissions: P.permissions } },
  { method: 'POST', path: '/app/installations/90002/access_tokens', body: { repository_ids: [P.repositoryId, 2], permissions: P.permissions } },
  { method: 'POST', path: '/app/installations/90002/access_tokens', body: { repository_ids: [P.repositoryId], permissions: { ...P.permissions, administration: 'read' } } },
  { method: 'GET', path: '/app', body: {} },
]
for (const input of deniedRequests) test('closed request allowlist: ' + JSON.stringify(input), async () => {
  const f = fake()
  assert.throws(() => validateAppRequest(input, pins), /request_not_allowed/)
  await assert.rejects(exercise(f, input), /request_not_allowed/)
  assert.equal(f.calls, 0)
})
test('extra headers cannot be injected', async () => {
  const f = fake()
  await assert.rejects(exercise(f, { ...get, headers: { Host: 'other' } } as AppHttpRequest), /request_not_allowed/)
  assert.equal(f.calls, 0)
})
test('unsafe TLS/proxy/environment options fail before request', async () => {
  for (const name of ['NODE_OPTIONS', 'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'SSL_CERT_DIR', 'NODE_TLS_REJECT_UNAUTHORIZED', 'HTTPS_PROXY']) {
    const before = process.env[name]; process.env[name] = 'synthetic-not-secret'
    try { const f = fake(); await assert.rejects(exercise(f), /unsafe_environment/); assert.equal(f.calls, 0) }
    finally { if (before === undefined) delete process.env[name]; else process.env[name] = before }
  }
})
