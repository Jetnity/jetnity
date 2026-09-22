import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { EventEmitter, once } from 'node:events'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  FORBIDDEN_CONNECTION_KEYS,
  CHILD_ENV_STRIP_KEYS,
} from './admin-account-counts-1-local-proof.mjs'
import {
  HTTP_FORBIDDEN_KEYS,
  EXPECTED,
  SNAPSHOT,
  POSTGREST_TAR_SHA256,
  POSTGREST_URL,
  assertIsolatedHttpEnvironment,
  assertExactSourceHashes,
  assertConfigIsLoopbackOnly,
  assertOwnedListenLoopbackOnly,
  buildPostgrestConfig,
  signLocalJwt,
  findPgBinsPrefer17,
  cleanProofEnv,
  POSTGREST_V16_DENY,
  TCP_LISTEN_STATE,
  evaluateDeniedResponse,
  evaluateCleanupAcceptance,
  waitForOwnedChildExit,
  stoppeOwnedHttp,
  tamperJwtSignature,
  schemaProfileHeaders,
  parseProcNetListenRows,
  sameCatalogIdentity,
  sameUsersProtection,
} from './admin-account-counts-http-proof-1.mjs'

const hier = dirname(fileURLToPath(import.meta.url))
const runner = join(hier, 'admin-account-counts-http-proof-1.mjs')
const fixture = join(hier, 'admin-account-counts-http-proof-1-fixture.sql')
const candidate = join(hier, 'admin-account-counts-1-candidate.sql')
const bootstrap = join(hier, 'admin-account-counts-1-bootstrap.sql')

function spawnRunner(envExtra = {}, args = []) {
  const env = { ...process.env, ...envExtra }
  for (const schluessel of HTTP_FORBIDDEN_KEYS) {
    if (!(schluessel in envExtra)) delete env[schluessel]
  }
  return spawnSync(process.execPath, ['--import', 'tsx', runner, ...args], {
    encoding: 'utf8',
    env,
  })
}

describe('admin-account-counts-http-proof-1 harness safety', () => {
  test('rejects inherited PG and PostgREST/Supabase connection defaults before any process starts', () => {
    for (const schluessel of ['PGHOST', 'PGRST_DB_URI', 'SUPABASE_URL', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF']) {
      assert.throws(
        () => assertIsolatedHttpEnvironment({ [schluessel]: 'example' }, ['node', runner]),
        /Verbotene/,
      )
    }
  })

  test('rejects public bind arguments and remote allow-flag', () => {
    assert.throws(
      () => assertIsolatedHttpEnvironment({}, ['node', runner, '0.0.0.0']),
      /Öffentliches Bind-Ziel/,
    )
    assert.throws(
      () => assertIsolatedHttpEnvironment({ JETNITY_ALLOW_REMOTE_DB: '1' }, ['node', runner]),
      /Remote-DB ist verboten/,
    )
  })

  test('spawned runner fails closed on PGHOST and does not print the override', () => {
    const lauf = spawnRunner({ PGHOST: 'should-not-be-printed.example' })
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Verbotene/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /should-not-be-printed\.example/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /initdb|postgrest --/)
  })

  test('cleanProofEnv strips PSQLRC, PG* and PGRST_* keys', () => {
    const env = cleanProofEnv({
      ...process.env,
      PSQLRC: '/tmp/hostile.psqlrc',
      PGHOST: 'should-be-stripped.example',
      PGRST_JWT_SECRET: 'should-be-stripped',
    })
    assert.equal(env.PSQLRC, undefined)
    assert.equal(env.PGHOST, undefined)
    assert.equal(env.PGRST_JWT_SECRET, undefined)
    assert.ok(CHILD_ENV_STRIP_KEYS.includes('PSQLRC'))
    assert.ok(FORBIDDEN_CONNECTION_KEYS.includes('PGHOST'))
  })

  test('PostgREST config builder refuses non-loopback hosts and wildcard binds', () => {
    assert.throws(
      () =>
        buildPostgrestConfig({
          host: '0.0.0.0',
          port: 1,
          dbUri: 'postgres://jetnity_http_authenticator@/db?host=/tmp/sock',
          jwtFile: '/tmp/jwt',
        }),
      /numeric loopback/,
    )
    const config = buildPostgrestConfig({
      host: '127.0.0.1',
      port: 18001,
      dbUri: 'postgres://jetnity_http_authenticator@/db?host=/tmp/sock',
      jwtFile: '/tmp/jwt.secret',
    })
    assertConfigIsLoopbackOnly(config)
    assert.match(config, /server-host = "127\.0\.0\.1"/)
    assert.match(config, /db-schemas = "public"/)
    assert.doesNotMatch(config, /jetnity_reporting|auth,|0\.0\.0\.0/)
  })

  test('source hash helper stays fail-closed on mismatch', () => {
    assert.throws(
      () => assertExactSourceHashes({ ...EXPECTED, wrapper: '0'.repeat(64) }),
      /source hash mismatch/,
    )
    assertExactSourceHashes(EXPECTED)
    assert.equal(SNAPSHOT, 'dcf7bfee497ba3aa2038a43fe4bc2a09e541625f')
  })

  test('local JWT helper signs HS256 without logging the token in this assertion', () => {
    const token = signLocalJwt({ role: 'authenticated', sub: '10000000-0000-4000-8000-000000000004' }, 'x'.repeat(48))
    assert.match(token, /^eyJ/)
    assert.equal(token.split('.').length, 3)
  })

  test('runner, fixture and accepted SQL stay local-only in source', () => {
    const runnerSrc = readFileSync(runner, 'utf8')
    const fixtureSrc = readFileSync(fixture, 'utf8')
    const candidateSrc = readFileSync(candidate, 'utf8')
    const bootstrapSrc = readFileSync(bootstrap, 'utf8')
    assert.doesNotMatch(runnerSrc, /from\s+['"][^'"]*sql\.mjs['"]/)
    assert.doesNotMatch(runnerSrc, /['"]sudo['"]/)
    assert.doesNotMatch(runnerSrc, /\bpg_ctlcluster\b/)
    assert.match(runnerSrc, /127\.0\.0\.1/)
    assert.match(runnerSrc, /dcf7bfee497ba3aa2038a43fe4bc2a09e541625f/)
    assert.match(fixtureSrc, /LOCAL HTTP-PROOF/)
    assert.match(fixtureSrc, /DISPOSABLE LARGE-VALUE TRANSPORT FIXTURE/)
    assert.doesNotMatch(fixtureSrc, /grant select on table auth\.users/i)
    assert.doesNotMatch(fixtureSrc, /disable row level security/i)
    assert.match(candidateSrc, /LOCAL \/ UNAPPLIED/)
    assert.match(bootstrapSrc, /METADATA-FAITHFUL FIXTURE/)
    assert.match(POSTGREST_URL, /PostgREST\/postgrest\/releases\/download\/v16\.3/)
    assert.equal(POSTGREST_TAR_SHA256.length, 64)
    assert.ok(findPgBinsPrefer17())
  })
})

function fakeLingeringChild(pid = 4242) {
  const child = new EventEmitter()
  child.pid = pid
  child.exitCode = null
  child.signalCode = null
  child.kill = () => false
  child.stdout = null
  child.stderr = null
  return child
}

function listenRow({ local, portHex, state = '0A', inode }) {
  return `  0: ${local}:${portHex} 00000000:0000 ${state} 00000000:00000000 00:00000000 00000000     0        0 ${inode} 1 0000000000000000 100 0 0 10 0`
}

describe('admin-account-counts-http-proof-1 H1 process lifecycle', () => {
  test('never-started child is a confirmed stop, not a cleanup PASS hole', async () => {
    const idle = await waitForOwnedChildExit(null, { timeoutMs: 50 })
    assert.equal(idle.neverStarted, true)
    assert.equal(idle.exited, true)
    const report = await stoppeOwnedHttp({ child: null })
    assert.equal(report.neverStarted, true)
    assert.equal(report.httpStopped, true)
    assert.equal(report.reaped, true)
    assert.equal(
      evaluateCleanupAcceptance({
        ...report,
        running: false,
        cleaned: true,
        removed: true,
        httpReaped: report.reaped,
        httpNeverStarted: report.neverStarted,
        error: null,
      }).ok,
      true,
    )
  })

  test('normal-run owned sleep child is reaped before removal is allowed', async () => {
    const child = spawn('sleep', ['30'], { stdio: 'ignore' })
    assert.ok(child.pid > 1)
    const report = await stoppeOwnedHttp({ child }, { termTimeoutMs: 1500, killTimeoutMs: 500 })
    assert.equal(report.httpStopped, true)
    assert.equal(report.reaped, true)
    assert.equal(report.timedOut, false)
    assert.ok(child.exitCode != null || child.signalCode != null)
    assert.throws(() => process.kill(child.pid, 0), /ESRCH/)
    const acceptance = evaluateCleanupAcceptance({
      cleaned: true,
      removed: true,
      running: false,
      httpStopped: report.httpStopped,
      httpReaped: report.reaped,
      error: null,
    })
    assert.equal(acceptance.ok, true)
    assert.equal(acceptance.mayRemove, true)
  })

  test('lingering child / timeout refuses removal and cannot be cleanup PASS', async () => {
    const child = fakeLingeringChild(7777)
    const report = await stoppeOwnedHttp({ child }, { termTimeoutMs: 40, killTimeoutMs: 40 })
    assert.equal(report.httpStopped, false)
    assert.equal(report.reaped, false)
    assert.equal(report.timedOut, true)
    const historicalContradiction = evaluateCleanupAcceptance({
      cleaned: true,
      removed: true,
      running: false,
      httpStopped: false,
      httpReaped: false,
      error: null,
    })
    assert.equal(historicalContradiction.ok, false)
    assert.equal(historicalContradiction.mayRemove, false)
    const afterFailedStop = evaluateCleanupAcceptance({
      cleaned: false,
      removed: false,
      running: false,
      httpStopped: report.httpStopped,
      httpReaped: report.reaped,
      error: report.error,
    })
    assert.equal(afterFailedStop.mayRemove, false)
    assert.equal(afterFailedStop.ok, false)
  })

  test('early start failure is a spawn failure, not a silent running child', async () => {
    const child = spawn('/tmp/jetnity-http-proof-1-missing-postgrest', [], { stdio: 'ignore' })
    const wait = await waitForOwnedChildExit(child, { timeoutMs: 1000 })
    assert.equal(wait.exited, true)
    assert.equal(wait.started, false)
    assert.equal(wait.neverStarted, true)
    assert.equal(wait.spawnFailed, true)
    const report = await stoppeOwnedHttp({ child, spawnError: new Error('ENOENT') })
    assert.equal(report.httpStopped, true)
    assert.equal(report.reaped, true)
  })

  test('stop-failure keeps the data tree and rejects httpStopped:false PASS', () => {
    const failed = evaluateCleanupAcceptance({
      cleaned: true,
      removed: true,
      running: false,
      httpStopped: false,
      httpReaped: false,
      error: null,
    })
    assert.equal(failed.ok, false)
    assert.equal(failed.mayRemove, false)
    const stillRunning = evaluateCleanupAcceptance({
      cleaned: false,
      removed: false,
      running: true,
      httpStopped: true,
      httpReaped: true,
      error: null,
    })
    assert.equal(stillRunning.mayRemove, false)
  })

  test('listener evidence is pid-bound LISTEN loopback and rejects wrong pid/public/non-listen', () => {
    const header =
      '  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode'
    const loopback = [header, listenRow({ local: '0100007F', portHex: '1F90', inode: '5555' })].join('\n')
    const publicBind = [header, listenRow({ local: '00000000', portHex: '1F90', inode: '5555' })].join('\n')
    const established = [header, listenRow({ local: '0100007F', portHex: '1F90', state: '01', inode: '5555' })].join('\n')
    const ipv6loop = [header, listenRow({ local: '00000000000000000000000001000000', portHex: '1F90', inode: '6666' })].join('\n')

    const owned = assertOwnedListenLoopbackOnly({
      pid: 99,
      port: 8080,
      tcpText: loopback,
      tcp6Text: '',
      socketInodes: ['5555'],
    })
    assert.equal(owned.loopback, true)
    assert.equal(owned.listenState, TCP_LISTEN_STATE)
    assert.deepEqual(owned.inodes, ['5555'])

    assert.throws(
      () =>
        assertOwnedListenLoopbackOnly({
          pid: 88,
          port: 8080,
          tcpText: loopback,
          tcp6Text: '',
          socketInodes: ['9999'],
        }),
      /wrong-PID|unrelated socket/,
    )
    assert.throws(
      () =>
        assertOwnedListenLoopbackOnly({
          pid: 99,
          port: 8080,
          tcpText: publicBind,
          tcp6Text: '',
          socketInodes: ['5555'],
        }),
      /wildcard|public/,
    )
    assert.throws(
      () =>
        assertOwnedListenLoopbackOnly({
          pid: 99,
          port: 8080,
          tcpText: established,
          tcp6Text: '',
          socketInodes: ['5555'],
        }),
      /LISTEN/,
    )

    const ipv6 = assertOwnedListenLoopbackOnly({
      pid: 99,
      port: 8080,
      tcpText: '',
      tcp6Text: ipv6loop,
      socketInodes: ['6666'],
    })
    assert.deepEqual(ipv6.families, ['ipv6'])
    assert.equal(parseProcNetListenRows(established).length, 0)
    assert.equal(parseProcNetListenRows(loopback).length, 1)
  })

  test('exported waiter resolves a real already-exited child without timer TDZ', async () => {
    const child = spawn(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' })
    await once(child, 'exit')
    const wait = await waitForOwnedChildExit(child, { timeoutMs: 100 })
    assert.equal(wait.exited, true)
    assert.equal(wait.timedOut, false)
    assert.equal(wait.exitCode, 0)
    assert.equal(wait.neverStarted, false)
  })

  test('exported waiter resolves a real already-signaled child', async () => {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
    await once(child, 'spawn')
    child.kill('SIGTERM')
    await once(child, 'exit')
    const wait = await waitForOwnedChildExit(child, { timeoutMs: 100 })
    assert.equal(wait.exited, true)
    assert.equal(wait.signal, 'SIGTERM')
    assert.equal(wait.timedOut, false)
  })

  test('post-spawn kill EPERM error is not exit and retains the living child', async () => {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
    await once(child, 'spawn')
    const realKill = child.kill.bind(child)
    try {
      child.kill = () => {
        queueMicrotask(() =>
          child.emit('error', Object.assign(new Error('injected EPERM kill failure'), { code: 'EPERM' })),
        )
        return false
      }
      const first = await stoppeOwnedHttp({ child }, { termTimeoutMs: 80, killTimeoutMs: 80 })
      assert.equal(first.httpStopped, false)
      assert.equal(first.reaped, false)
      assert.equal(first.ownershipRetained, true)
      assert.equal(first.exitCode, null)
      assert.equal(first.signal, null)
      assert.match(String(first.error), /EPERM|still running|injected/)
      process.kill(child.pid, 0)
      const acceptance = evaluateCleanupAcceptance({
        cleaned: false,
        removed: false,
        running: false,
        httpStopped: first.httpStopped,
        httpReaped: first.reaped,
        error: first.error,
      })
      assert.equal(acceptance.mayRemove, false)
      const second = await stoppeOwnedHttp({ child }, { termTimeoutMs: 80, killTimeoutMs: 80 })
      assert.equal(second.httpStopped, false)
      assert.equal(second.ownershipRetained, true)
      process.kill(child.pid, 0)
    } finally {
      child.kill = realKill
      realKill('SIGKILL')
      await once(child, 'exit')
    }
  })
})

describe('admin-account-counts-http-proof-1 H2 structured denials', () => {
  test('evaluateDeniedResponse accepts the pinned PostgREST v16 pairs and rejects 500/503/HTML/success', () => {
    const privilege = {
      status: 403,
      json: { code: '42501', message: 'jetnity.admin-account-counts.v1: not authorized' },
      text: '{"code":"42501"}',
    }
    assert.equal(evaluateDeniedResponse(privilege, POSTGREST_V16_DENY.privilege).ok, true)
    assert.equal(
      evaluateDeniedResponse(
        { status: 401, json: { code: '42501' }, text: '{"code":"42501"}' },
        POSTGREST_V16_DENY.anon,
      ).ok,
      true,
    )
    assert.equal(
      evaluateDeniedResponse(
        { status: 401, json: { code: 'PGRST301' }, text: '{"code":"PGRST301"}' },
        POSTGREST_V16_DENY.invalidJwt,
      ).ok,
      true,
    )
    assert.equal(
      evaluateDeniedResponse(
        { status: 401, json: { code: 'PGRST303' }, text: '{"code":"PGRST303"}' },
        POSTGREST_V16_DENY.expiredJwt,
      ).ok,
      true,
    )

    const injected = [
      { status: 500, json: { code: 'XX000' }, text: 'error' },
      { status: 503, json: { code: '08006' }, text: 'error' },
      { status: 500, json: { code: 'XX000' }, text: 'error' },
      { status: 503, json: { code: '08006' }, text: 'error' },
      { status: 200, json: { present_registered_accounts: '10' }, text: '{"present_registered_accounts":"10"}' },
      { status: 403, json: { code: 'XX000' }, text: '{"code":"XX000"}' },
      { status: 401, json: { code: '42501' }, text: '<html>nope</html>' },
      { status: 503, json: null, text: '<!DOCTYPE html><html>down</html>' },
    ]
    const expecteds = [
      POSTGREST_V16_DENY.privilege,
      POSTGREST_V16_DENY.privilege,
      POSTGREST_V16_DENY.anon,
      POSTGREST_V16_DENY.invalidJwt,
      POSTGREST_V16_DENY.privilege,
      POSTGREST_V16_DENY.privilege,
      POSTGREST_V16_DENY.anon,
      POSTGREST_V16_DENY.expiredJwt,
    ]
    const failed = injected.map((antwort, i) => evaluateDeniedResponse(antwort, expecteds[i]))
    assert.equal(failed.every((item) => item.ok === false), true)
    assert.ok(failed[0].reasons.includes('server-failure'))
    assert.ok(failed[1].reasons.includes('server-failure'))
    assert.ok(failed[4].reasons.includes('unexpected-success'))
    assert.ok(failed[4].reasons.includes('leaked-counts'))
    assert.ok(failed[6].reasons.includes('malformed-html'))
  })

  test('JWT tamper deterministically changes signed bytes', () => {
    const token = signLocalJwt({ role: 'authenticated', sub: '10000000-0000-4000-8000-000000000004' }, 'z'.repeat(48))
    const tampered = tamperJwtSignature(token)
    assert.notEqual(tampered, token)
    assert.notEqual(tampered.split('.')[2], token.split('.')[2])
    assert.equal(tampered.split('.')[0], token.split('.')[0])
    assert.equal(tampered.split('.')[1], token.split('.')[1])
  })
})

describe('admin-account-counts-http-proof-1 H3 schema profile and catalog identity', () => {
  test('schema selection uses Accept-Profile for GET and Content-Profile for POST', () => {
    assert.deepEqual(schemaProfileHeaders('GET', 'auth'), { 'Accept-Profile': 'auth' })
    assert.deepEqual(schemaProfileHeaders('POST', 'jetnity_reporting'), { 'Content-Profile': 'jetnity_reporting' })
    assert.deepEqual(schemaProfileHeaders('GET', 'public'), { 'Accept-Profile': 'public' })
  })

  test('catalog identity compare is definition/owner/ACL, not existence-only', () => {
    const producer = {
      owner: 'postgres',
      definition: 'create function account_counts_v1() ...',
      acls: ['authenticated=X/postgres'],
      security_definer: true,
    }
    assert.equal(sameCatalogIdentity(producer, { ...producer }), true)
    assert.equal(sameCatalogIdentity(producer, { ...producer, owner: 'other' }), false)
    assert.equal(sameCatalogIdentity(producer, { ...producer, definition: 'changed' }), false)
    const users = {
      owner: 'supabase_auth_admin',
      rls: true,
      force_rls: false,
      policies: [],
      acls: ['postgres=arwdDxt/supabase_auth_admin'],
    }
    assert.equal(sameUsersProtection(users, { ...users }), true)
    assert.equal(sameUsersProtection(users, { ...users, rls: false }), false)
    assert.equal(sameUsersProtection(users, { ...users, policies: ['opened'] }), false)
  })
})
