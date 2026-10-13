import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import childProcess from 'node:child_process'
import https from 'node:https'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import type { IncomingMessage, ClientRequest } from 'node:http'
import { checkServerIdentity } from 'node:tls'
import { createAuthenticatedBernGithubReader } from '../../../scripts/official-truth-bern-g3-rq-fetch-1/github-read'
import { bernResearchDeveloperOneShot } from '../../../scripts/official-truth-bern-g3-rq-fetch-1/run'
import { githubFixture, SHA, RECEIPT } from './fixtures/github'

type Reply = { status?: number; body?: Uint8Array; complete?: boolean; contentType?: string;
  encoding?: string; length?: string; stall?: boolean; abort?: boolean }
function mockGithub(t: TestContext, reply: (path: string) => Reply) {
  const paths: string[] = [], methods: string[] = []
  let destroys = 0
  t.mock.method(childProcess, 'execFileSync', (file: string, args: string[]) => {
    if (file === '/usr/bin/git') return args[0] === 'status' ? '' : SHA
    assert.equal(file, process.platform === 'darwin' ? '/opt/homebrew/bin/gh' : '/usr/bin/gh')
    assert.deepEqual(args, ['auth', 'token', '--hostname', 'github.com'])
    return 'synthetic_credential_never_real_12345'
  })
  t.mock.method(https, 'request', (options: https.RequestOptions, callback: (res: IncomingMessage) => void) => {
    assert.equal(options.hostname, 'api.github.com')
    assert.equal(options.servername, 'api.github.com')
    assert.equal(options.port, 443); assert.equal(options.rejectUnauthorized, true)
    assert.equal(options.checkServerIdentity, checkServerIdentity)
    assert.equal(options.agent, false)
    assert.equal(options.method, 'GET')
    const headers = options.headers as Record<string, string>
    assert.equal(headers.Authorization, 'Bearer synthetic_credential_never_real_12345')
    paths.push(String(options.path)); methods.push(String(options.method))
    const data = reply(String(options.path))
    const req = new EventEmitter() as ClientRequest
    req.destroy = () => { destroys++; return req }
    req.end = (() => {
      queueMicrotask(() => {
        if (data.stall) return
        const res = new PassThrough()
        Object.assign(res, { statusCode: data.status ?? 200, complete: data.complete ?? true,
          headers: { 'content-type': data.contentType ?? 'application/json',
            ...(data.encoding ? { 'content-encoding': data.encoding } : {}),
            ...(data.length ? { 'content-length': data.length } : {}) } })
        const destroy = res.destroy.bind(res)
        res.destroy = () => { destroys++; return destroy() }
        callback(res as unknown as IncomingMessage)
        if (data.abort) res.emit('aborted')
        res.end(data.body ?? new TextEncoder().encode('{"id":123}'))
      })
      return req
    }) as ClientRequest['end']
    return req
  })
  return { paths, methods, destroys: () => destroys }
}

test('GitHub read uses explicit TLS and GET; arbitrary endpoints including real ref write are impossible', async t => {
  const mock = mockGithub(t, () => ({})), read = createAuthenticatedBernGithubReader()
  assert.deepEqual(await read('/user'), { status: 200, body: { id: 123 } })
  for (const path of ['https://evil.example/', '/repos/Jetnity/jetnity/git/refs', '/user?x=1',
    '/repos/evil/jetnity', '/repos/Jetnity/jetnity/issues/comments/1?redirect=x']) await assert.rejects(read(path))
  assert.deepEqual(mock.paths, ['/user']); assert.deepEqual(mock.methods, ['GET'])
})
for (const status of [300, 301, 302, 307, 308, 399, 401, 403, 404, 429, 500, 503]) {
  test('authenticated GitHub read rejects status ' + status + ' without retry/follow', async t => {
    const mock = mockGithub(t, () => ({ status }))
    await assert.rejects(createAuthenticatedBernGithubReader()('/user'), /github_unverifiable/)
    assert.equal(mock.paths.length, 1); assert.ok(mock.destroys() > 0)
  })
}
for (const [name, reply] of [
  ['invalid JSON', { body: new TextEncoder().encode('HTTP/2 200 approved') }],
  ['invalid UTF8', { body: Uint8Array.of(0xc3, 0x28) }],
  ['BOM', { body: new TextEncoder().encode('\ufeff{}') }],
  ['incomplete framing', { complete: false }],
  ['wrong media', { contentType: 'text/html' }],
  ['compression', { encoding: 'gzip' }],
  ['length mismatch', { length: '100' }],
  ['bad length', { length: 'NaN' }],
  ['declared over budget', { length: '262145' }],
  ['streamed over budget', { body: new Uint8Array(262145) }],
  ['aborted response', { abort: true }],
] as const) test('GitHub read refuses ' + name, async t => {
  mockGithub(t, () => reply)
  await assert.rejects(createAuthenticatedBernGithubReader()('/user'), /github_unverifiable/)
})
test('GitHub deadline destroys stalled request', { timeout: 8000 }, async t => {
  const mock = mockGithub(t, () => ({ stall: true }))
  await assert.rejects(createAuthenticatedBernGithubReader()('/user'), /github_unverifiable/)
  assert.equal(mock.paths.length, 1); assert.ok(mock.destroys() > 0)
})
test('stdout approval text is never an authenticated comment', async t => {
  let http = 0
  t.mock.method(childProcess, 'execFileSync', () => '{"recordType":"G3_RQ_FETCH_1_ATTEMPT_CONSUMED"}')
  t.mock.method(https, 'request', () => { http++; throw Error('must not request') })
  assert.throws(createAuthenticatedBernGithubReader, /github_unverifiable/)
  assert.equal(http, 0)
})
test('subprocess failure is redacted, no credential or stdout leakage', t => {
  t.mock.method(childProcess, 'execFileSync', () => { throw Error('secret token and raw output') })
  assert.throws(createAuthenticatedBernGithubReader, { message: 'github_unverifiable' })
})
test('even complete authenticated preflight cannot enable live B in this code-only revision', async t => {
  const fixture = githubFixture()
  const mock = mockGithub(t, path => {
    const r = fixture.responses.get(path)
    assert.ok(r, path)
    return { status: r.status, body: new TextEncoder().encode(JSON.stringify(r.body)) }
  })
  const result = await bernResearchDeveloperOneShot(['--execute-owner-approved-once',
    '--approved-main-sha=' + SHA, '--issue-934-consumed-comment=' + RECEIPT])
  assert.equal(result.exitCode, 2)
  assert.equal(result.report.reason, 'live_execution_not_authorized')
  assert.equal(result.report.physicalAttemptMade, false)
  assert.ok(mock.paths.length > 5)
  assert.equal(mock.paths.some(path => path.includes('/git/refs')), false)
  assert.equal(mock.methods.every(method => method === 'GET'), true)
})
