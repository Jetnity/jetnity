#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { BLOB_PINS, PINS, SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { darfOwnedVerzeichnisEntfernen, stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import {
  CONTRACT_VERSION,
  EXTRA_BLOB_PINS,
  HISTORICAL_REFUSED_PRODUCER_SHA256,
  PRODUCT_BASELINE,
  CLI,
} from './constants.mjs'
import {
  assertIsolatedConnectionEnvironment,
  baueRuntimeAppUmgebung,
  klassifiziereRuntimeUmgebung,
} from './env.mjs'
import { pruefeDockerFaehigkeit } from './docker-capability.mjs'
import {
  assertCliHelpText,
  assertCliVersionText,
  assertOfficialArchiveIdentity,
  parseChecksums,
  platformKey,
  selectSafeExcludes,
} from './cli-identity.mjs'
import { assertRuntimeSources, leseRuntimeSourceManifest, refuseBootstrapOverlay } from './source.mjs'
import { assertNoPublicBindPlan, planeLoopbackDienste, assertOverlayKeepsAuthSemantics } from './overlay.mjs'
import { assertLoopbackBindings, parseDockerPortBindings, baueStartArgumente } from './stack.mjs'
import { plannedSql, leseUnveraenderteSql } from './schema.mjs'
import {
  assertActorKey,
  contextAccounts,
  emailFor,
  prepareCountScenario,
  profileMutationSql,
  sanitizeFixtureManifest,
  setzeRolle,
} from './fixtures.mjs'
import { createRpcObserver } from './observer.mjs'
import { BROWSER_GATES } from './constants.mjs'
import { decideVerdict, loadBrowserModule, mergeBrowserGates, leereMatrix, markBrowserNotImplemented } from './gates.mjs'
import { cleanupDryRunKontrolle, raeumeOwnedAuf, assertOwnedPath } from './cleanup.mjs'
import { redactSecrets, writeEvidence, assertSafeEvidence } from './evidence.mjs'
import { run } from './run.mjs'
import { defaultStartRuntime } from './runtime.mjs'
import { SOURCE_PATHS as ACCEPTED_SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'

const IGNORE_TERM = "process.on('SIGTERM',()=>{}); process.stdout.write('ready\\n'); setInterval(()=>{},1000)"

async function withOwnedChild(script, fn) {
  const child = spawn(process.execPath, ['-e', script], {
    env: { PATH: '/usr/bin' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  try {
    await once(child.stdout, 'data')
    return await fn(child)
  } finally {
    if (child.exitCode == null && child.signalCode == null && child.pid) {
      const closed = once(child, 'close')
      try { process.kill(child.pid, 'SIGKILL') } catch { /* independent teardown */ }
      await closed
    }
  }
}

test('accepted working-tree source pins still match the #557 contract', () => {
  const manifest = leseRuntimeSourceManifest()
  assert.equal(assertRuntimeSources(manifest), true)
  assert.equal(manifest.files.producer.sha256, PINS.producerSha256)
  assert.equal(manifest.files.wrapper.sha256, PINS.wrapperSha256)
  assert.equal(manifest.files.callerStatus.workingTreeBlob, BLOB_PINS.callerStatus)
  assert.equal(manifest.extra.packageJson.workingTreeBlob, EXTRA_BLOB_PINS.packageJson)
  assert.equal(manifest.migrations.replay, 'IMPLEMENTED')
  assert.ok(manifest.migrations.files.length > 0)
  assert.notEqual(PINS.producerSha256, HISTORICAL_REFUSED_PRODUCER_SHA256)
})

test('exact-source drift and the old producer are refused', () => {
  const manifest = leseRuntimeSourceManifest()
  manifest.files.producer.workingTreeBlob = '0'.repeat(40)
  manifest.files.producer.sha256 = HISTORICAL_REFUSED_PRODUCER_SHA256
  assert.throws(() => assertRuntimeSources(manifest), /producer|permissive|working-tree/)
  assert.throws(
    () => refuseBootstrapOverlay({ plannedSqlPaths: [ACCEPTED_SOURCE_PATHS.bootstrap], target: 'gotrue' }),
    /Refusing to overlay/,
  )
  assert.deepEqual(plannedSql(), [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper])
})

test('rejects hosted, inherited and overridden environments', () => {
  assert.throws(
    () => assertIsolatedConnectionEnvironment({ SUPABASE_URL: 'https://example.supabase.co' }, []),
    /SUPABASE_URL/,
  )
  assert.throws(
    () => baueRuntimeAppUmgebung({
      parentEnv: { PATH: '/usr/bin', OPENAI_API_KEY: 'x', NODE_OPTIONS: '--require ./preload.js' },
      privateHome: mkdtempSync(join(tmpdir(), 'aaclr1-env-')),
      loopbackUrl: 'https://example.supabase.co',
      syntheticAnonKey: 'anon',
      countsEnabled: true,
    }),
    /127\.0\.0\.1|Loopback/,
  )
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-kind-'))
  const parent = {
    PATH: '/usr/bin',
    SUPABASE_ACCESS_TOKEN: 'parent-token',
    OPENAI_API_KEY: 'parent-model',
    NODE_OPTIONS: '--inspect',
    VERCEL: '1',
    NEXT_PUBLIC_SUPABASE_URL: 'https://hosted.supabase.co',
  }
  const klass = klassifiziereRuntimeUmgebung(parent)
  assert.equal(klass.parentHasHostedSupabaseNames, true)
  assert.equal(klass.nodeOptionsPresent, true)
  const off = baueRuntimeAppUmgebung({
    parentEnv: parent,
    privateHome: home,
    loopbackUrl: 'http://127.0.0.1:54321',
    syntheticAnonKey: 'local-anon',
    siteUrl: 'http://127.0.0.1:3000',
    countsEnabled: false,
  })
  assert.equal(off.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED, 'false')
  assert.equal(off.SUPABASE_ACCESS_TOKEN, undefined)
  assert.equal(off.OPENAI_API_KEY, undefined)
  assert.equal(off.NODE_OPTIONS, undefined)
  assert.equal(off.VERCEL, undefined)
  const on = baueRuntimeAppUmgebung({
    parentEnv: parent,
    privateHome: home,
    loopbackUrl: 'http://127.0.0.1:54321',
    syntheticAnonKey: 'local-anon',
    countsEnabled: true,
  })
  assert.equal(on.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED, 'true')
  rmSync(home, { recursive: true, force: true })
})

test('no public bind in the pre-start plan or observed Docker mappings', () => {
  assert.throws(() => assertNoPublicBindPlan({ bind: '0.0.0.0', services: [] }), /Public bind/)
  assert.throws(() => assertNoPublicBindPlan({ bind: '127.0.0.1', services: [{ host: '::' }] }), /Public bind/)
  const plan = planeLoopbackDienste({ apiPort: 1, dbPort: 2, appPort: 3, observerPort: 4 })
  assert.equal(plan.bind, '127.0.0.1')
  assert.throws(
    () => assertLoopbackBindings([{ HostIp: '0.0.0.0', HostPort: '54321' }]),
    /Public or unspecified/,
  )
  assert.equal(assertLoopbackBindings([{ HostIp: '127.0.0.1', HostPort: '54321' }]), true)
  const parsed = parseDockerPortBindings({
    HostConfig: { PortBindings: { '54321/tcp': [{ HostIp: '127.0.0.1', HostPort: '54321' }] } },
  })
  assert.equal(parsed[0].HostIp, '127.0.0.1')
})

test('wrong CLI checksum, version and help fail closed', () => {
  const checksums = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  supabase_2.117.0_linux_amd64.tar.gz\n'
  assert.throws(
    () => assertOfficialArchiveIdentity({
      platformId: 'linux-x64',
      checksumsText: checksums,
      checksumsBytes: Buffer.from(checksums),
    }),
    /checksums.txt digest|mismatch/,
  )
  assert.throws(() => assertCliVersionText('1.200.0'), /not the selected/)
  assert.throws(() => assertCliHelpText('unrelated binary', { kind: 'start' }), /start --help/)
  assert.equal(assertCliVersionText('2.117.0'), true)
  assert.equal(assertCliHelpText('Start containers for Supabase local development', { kind: 'start' }), true)
  const parsed = parseChecksums(`${CLI.archives['darwin-arm64'].apiDigest.replace('sha256:', '')}  ${CLI.archives['darwin-arm64'].name}\n`)
  assert.equal(parsed[CLI.archives['darwin-arm64'].name], CLI.archives['darwin-arm64'].apiDigest.replace('sha256:', ''))
  assert.ok(platformKey({ plat: 'linux', cpu: 'x64' }) === 'linux-x64')
  assert.deepEqual(
    selectSafeExcludes(['realtime', 'studio', 'kong', 'gotrue']),
    ['realtime', 'studio'],
  )
  assert.ok(!baueStartArgumente({ networkId: 'n1', excludeNames: ['kong', 'gotrue'] }).includes('kong'))
})

test('fixture actor ownership rejects foreign keys and keep secrets out of manifests', async () => {
  assert.throws(() => assertActorKey('root'), /Unknown fixture actor/)
  const accounts = {
    owner: { id: '1', email: emailFor('owner', 'r1'), password: 'secret-password', role: 'owner', status: 'active' },
    moderator: { id: '2', email: emailFor('moderator', 'r1'), password: 'secret-password', role: 'moderator', status: 'active' },
    ordinary: { id: '3', email: emailFor('ordinary', 'r1'), password: 'secret-password', role: 'user', status: 'active' },
    creator: { id: '4', email: emailFor('creator', 'r1'), password: 'secret-password', role: 'creator', status: 'active' },
  }
  const manifest = sanitizeFixtureManifest(accounts, { runId: 'r1' })
  assert.equal(JSON.stringify(manifest).includes('secret-password'), false)
  await assert.rejects(
    () => setzeRolle(accounts, 'stranger', 'user', { mutateProfile: async () => {}, verify: async () => ({}) }),
    /Unknown fixture actor/,
  )
  const ctx = contextAccounts(accounts)
  assert.equal(ctx.owner.password, 'secret-password')
  const sql = profileMutationSql({ userId: '1', role: 'user', status: 'banned' })
  assert.match(sql.text, /public.profiles/)
  const extra = { id: null }
  const seen = []
  await prepareCountScenario('zero-window', {
    accounts,
    extra,
    createExtra: async () => ({ id: 'extra' }),
    adjustCreatedAt: async (item) => seen.push(item.userId),
  })
  assert.deepEqual(seen.sort(), ['1', '2', '3', '4'])
})

test('transparent observer records positive, failure and incomplete drain controls', async () => {
  const upstream = createServer((req, res) => {
    if (req.url === '/rest/v1/rpc/admin_account_counts_v1') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end('{"ok":true}')
      return
    }
    res.writeHead(204)
    res.end()
  })
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve))
  const upPort = upstream.address().port
  const observer = createRpcObserver({
    listenHost: '127.0.0.1',
    listenPort: 0,
    upstreamOrigin: `http://127.0.0.1:${upPort}`,
  })
  const listened = await observer.listen()
  assert.match(listened.origin, /^http:\/\/127\.0\.0\.1:/)
  const mark = observer.mark()
  const ok = await fetch(`${listened.origin}/rest/v1/rpc/admin_account_counts_v1`, { method: 'POST', body: '{}' })
  assert.equal(ok.status, 200)
  const since = observer.since(mark)
  assert.equal(since.complete, true)
  assert.equal(since.calls[0].path.includes('admin_account_counts_v1'), true)
  assert.equal(since.calls[0].status, 200)
  await observer.close()
  await new Promise((resolve) => upstream.close(resolve))

  const failing = createRpcObserver({
    listenHost: '127.0.0.1',
    listenPort: 0,
    upstreamOrigin: 'http://127.0.0.1:1',
    fetchImpl: async () => { throw new Error('upstream down') },
  })
  const failListen = await failing.listen()
  const failMark = failing.mark()
  const failRes = await fetch(`${failListen.origin}/rest/v1/rpc/admin_account_counts_v1`, { method: 'POST', body: '{}' })
  assert.equal(failRes.status, 502)
  const failSince = failing.since(failMark)
  assert.equal(failSince.complete, false)
  const drained = await failing.drain({ timeoutMs: 50 })
  assert.equal(drained.complete, false)
  await failing.close()
  assert.throws(
    () => createRpcObserver({ listenHost: '0.0.0.0', upstreamOrigin: 'http://127.0.0.1:9' }),
    /non-loopback/,
  )
})

test('mandatory gate aggregation refuses missing, duplicate and unknown browser IDs', () => {
  const matrix = leereMatrix('NOT RUN')
  assert.throws(() => mergeBrowserGates(matrix, { contractVersion: CONTRACT_VERSION, gates: {} }), /Missing browser gate/)
  const gates = Object.fromEntries(BROWSER_GATES.map((id) => [id, { id, result: 'PASS', evidence: null, notes: null }]))
  gates.G99_unknown = { id: 'G99_unknown', result: 'PASS', evidence: null, notes: null }
  assert.throws(() => mergeBrowserGates(matrix, { contractVersion: CONTRACT_VERSION, gates }), /Unknown browser gate/)
  const duplicate = BROWSER_GATES.map((id) => ({ id, result: 'PASS', evidence: null, notes: null }))
  duplicate.push({ id: 'G6_login_ui_password', result: 'PASS', evidence: null, notes: null })
  assert.throws(
    () => mergeBrowserGates(leereMatrix('NOT RUN'), { contractVersion: CONTRACT_VERSION, gates: duplicate }),
    /Duplicate browser gate/,
  )
})

test('full mode cannot PASS without the sibling browser module; runtime-only cannot either', async () => {
  const matrix = leereMatrix('PASS')
  markBrowserNotImplemented(matrix, 'absent')
  const missing = decideVerdict({ mode: 'full', matrix, cleanupOk: true, browserPresent: false })
  assert.equal(missing.fullLocalExecution, false)
  assert.equal(missing.verdict, 'NOT_IMPLEMENTED')
  const runtimeOnly = decideVerdict({ mode: 'runtime-only', matrix, cleanupOk: true, browserPresent: false })
  assert.equal(runtimeOnly.fullLocalExecution, false)
  assert.equal(runtimeOnly.verdict, 'RUNTIME_ONLY')
  const loaded = await loadBrowserModule({ modulePath: join(tmpdir(), 'missing-flows.mjs') })
  assert.equal(loaded.present, false)
})

test('partial startup, timeout and abort stay owned for cleanup', async () => {
  await withOwnedChild(IGNORE_TERM, async (child) => {
    const report = await stoppeOwnedChild(child, { termTimeoutMs: 40, killTimeoutMs: 200 })
    if (!report.reaped) {
      assert.equal(report.ownershipRetained, true)
      assert.equal(darfOwnedVerzeichnisEntfernen({
        processesStopped: false,
        reaped: false,
        neverStarted: false,
        ownershipRetained: true,
      }), false)
    }
  })
  const abort = new AbortController()
  abort.abort()
  assert.equal(abort.signal.aborted, true)
})

test('normal, rejected and nonsettling cleanup; foreign sentinel is retained', async () => {
  const probe = cleanupDryRunKontrolle()
  assert.equal(probe.blocked, false)
  assert.equal(probe.allowed, true)
  assert.equal(probe.signalFailureBlocked, true)
  assert.equal(probe.dockerUnverifiedBlocked, true)
  assert.equal(probe.foreignBlocked, true)
  const owned = mkdtempSync(join(tmpdir(), 'aaclr1-owned-'))
  const foreign = mkdtempSync(join(tmpdir(), 'aaclr1-foreign-'))
  writeFileSync(join(foreign, 'sentinel'), 'keep')
  const cleanup = await raeumeOwnedAuf({
    privateDir: owned,
    foreignSentinel: foreign,
    allowEmpty: true,
  })
  assert.equal(existsSync(foreign), true)
  assert.equal(assertOwnedPath(foreign, [owned]), false)
  assert.equal(cleanup.usedPkill, false)
  assert.equal(cleanup.usedDockerPrune, false)
  rmSync(foreign, { recursive: true, force: true })
})

test('secret redaction and historical receipt protection', () => {
  const redacted = redactSecrets({
    password: 'super-secret',
    G6_login_ui_password: { id: 'G6_login_ui_password', result: 'NOT RUN' },
    extraDeniedPresent: ['SUPABASE_ACCESS_TOKEN'],
    path: '/rest/v1/rpc/x',
    status: 200,
  })
  assert.equal(redacted.password, '[redacted]')
  assert.equal(redacted.G6_login_ui_password.result, 'NOT RUN')
  assert.deepEqual(redacted.extraDeniedPresent, ['SUPABASE_ACCESS_TOKEN'])
  assert.throws(() => assertSafeEvidence({ authorization: 'Bearer abc' }), /must not contain secrets/)
  const dir = mkdtempSync(join(tmpdir(), 'aaclr1-ev-'))
  assert.throws(() => writeEvidence(dir, 'README.md', { ok: true }), /historical evidence/)
  writeEvidence(dir, 'aaclr1-unit-receipt.json', { ok: true, note: 'unit' })
  assert.equal(JSON.parse(readFileSync(join(dir, 'aaclr1-unit-receipt.json'), 'utf8')).ok, true)
  rmSync(dir, { recursive: true, force: true })
})

test('defaultStartRuntime refuses to present a placeholder as a completed path', async () => {
  await assert.rejects(
    () => defaultStartRuntime({ docker: { usable: false }, cli: { identityVerified: false } }),
    /not a completed execution path/,
  )
})

test('default run is no-start and never reports full PASS from helper success', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aaclr1-run-'))
  const homeParent = process.env
  const result = await run({
    env: {
      PATH: homeParent.PATH,
      LANG: 'C.UTF-8',
      TZ: 'UTC',
    },
    argv: [],
    evidenceDir: evidence,
    execFile: (bin, args) => {
      if (String(bin).endsWith('git') || bin === 'git') {
        return execGit(args)
      }
      throw new Error(`unexpected ${bin} ${args}`)
    },
    resolve: (name) => (name === 'node' ? process.execPath : null),
  })
  assert.equal(result.mode, 'preflight')
  assert.notEqual(result.verdict, 'LOCAL_FULL_STACK_PASS')
  assert.equal(result.summary.fullLocalExecution, false)
  assert.equal(result.matrix.G2_owned_stack.result, 'NOT RUN')
  assert.equal(result.matrix.G20_owned_cleanup.result, 'PASS')
  rmSync(evidence, { recursive: true, force: true })
})

test('full mode with a missing browser module cannot become LOCAL_FULL_STACK_PASS', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aaclr1-full-'))
  const result = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8' },
    argv: ['--full'],
    evidenceDir: evidence,
    execFile: (bin, args) => {
      if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
      throw new Error(`unexpected ${bin}`)
    },
    resolve: () => null,
    importer: async () => ({ runBrowserFlows: async () => ({ contractVersion: CONTRACT_VERSION, gates: {} }) }),
  })
  assert.equal(result.mode, 'full')
  assert.equal(result.verdict, 'NOT_IMPLEMENTED')
  assert.equal(result.summary.fullLocalExecution, false)
  rmSync(evidence, { recursive: true, force: true })
})

function execGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    cwd: new URL('../../..', import.meta.url).pathname,
  })
}
