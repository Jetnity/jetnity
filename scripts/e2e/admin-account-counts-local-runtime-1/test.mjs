#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createServer, request as httpRequest } from 'node:http'
import { once } from 'node:events'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs'
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
  verifyResolvedCli,
  bindCliExecutableIdentity,
} from './cli-identity.mjs'
import {
  assertRuntimeSources,
  leseRuntimeSourceManifest,
  refuseBootstrapOverlay,
  materialisiereAppCheckout,
  classifyMigrationApplicability,
  refuseSymlinksAndDotenv,
} from './source.mjs'
import {
  prepareAppForLaunch,
  starteOwnedApp,
  restartOwnedApp,
  stoppeOwnedApp,
} from './app.mjs'
import { baueAcceptanceContext, validateAcceptanceContext } from './context.mjs'
import { createOwnershipRegistry } from './ownership.mjs'
import { newBrowserSession, closeBrowserSession, assertLocalBrowserTraffic } from './browser-session.mjs'
import { resolveUpstreamTarget } from './observer.mjs'
import { assertInstalledCatalog, installProducerAndWrapper, parseJsonRow } from './schema.mjs'
import { starteOwnedStack, stoppeOwnedStack } from './stack.mjs'
import { bewerteCleanup } from './cleanup.mjs'
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

const FAKE_NEXT = `const { createServer } = require('node:http')
const port = Number(process.env.PORT)
const server = createServer((req, res) => { res.writeHead(200); res.end('ok') })
server.listen(port, '127.0.0.1')
`

function writeFakeAppCheckout(dir) {
  writeFileSync(join(dir, 'package.json'), '{"name":"fixture","private":true}\n')
  writeFileSync(join(dir, 'package-lock.json'), '{"lockfileVersion":3}\n')
  mkdirSync(join(dir, 'node_modules/next/dist/bin'), { recursive: true })
  writeFileSync(join(dir, 'node_modules/next/dist/bin/next'), FAKE_NEXT, { mode: 0o755 })
  chmodSync(join(dir, 'node_modules/next/dist/bin/next'), 0o755)
  mkdirSync(join(dir, '.next'), { recursive: true })
  writeFileSync(join(dir, '.next/BUILD_ID'), 'fixture')
}

async function freePort() {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}

test('R1 default cold checkout cannot claim a running app without locked deps, build and readiness', async () => {
  const empty = mkdtempSync(join(tmpdir(), 'aaclr1-empty-'))
  writeFileSync(join(empty, 'package.json'), '{}')
  await assert.rejects(
    () => starteOwnedApp({
      checkoutDir: empty,
      parentEnv: { PATH: process.env.PATH },
      privateHome: empty,
      loopbackUrl: 'http://127.0.0.1:9',
      syntheticAnonKey: 'anon',
      countsEnabled: true,
      port: 9,
    }),
    /locked next binary|not a completed execution/,
  )
  const dest = mkdtempSync(join(tmpdir(), 'aaclr1-prep-'))
  writeFileSync(join(dest, 'package.json'), '{}')
  writeFileSync(join(dest, 'package-lock.json'), '{}')
  const calls = []
  await prepareAppForLaunch({
    checkoutDir: dest,
    env: { PATH: '/usr/bin', HOME: dest },
    execFile: (bin, args) => {
      calls.push([String(bin), args[0], args[1]])
      if (args[0] === 'ci') {
        mkdirSync(join(dest, 'node_modules/next/dist/bin'), { recursive: true })
        writeFileSync(join(dest, 'node_modules/next/dist/bin/next'), 'ok')
      }
      if (args.includes('build')) {
        mkdirSync(join(dest, '.next'), { recursive: true })
        writeFileSync(join(dest, '.next/BUILD_ID'), 'x')
      }
      return ''
    },
  })
  assert.ok(calls.some((item) => item[1] === 'ci'))
  assert.ok(calls.some((item) => item.includes('build') || item[1] === 'build' || item[2] === 'build'))
  assert.equal(existsSync(join(dest, '.next')), true)
  rmSync(empty, { recursive: true, force: true })
  rmSync(dest, { recursive: true, force: true })
})

test('R1 default wiring waits for a live loopback app and returns a contract-conforming §4 context', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-app-'))
  const checkout = join(home, 'checkout')
  mkdirSync(checkout)
  writeFakeAppCheckout(checkout)
  const evidenceDir = mkdtempSync(join(home, 'evidence-'))
  const port = await freePort()
  const registry = createOwnershipRegistry({ privateHome: home, evidenceDir })
  const app = await starteOwnedApp({
    checkoutDir: checkout,
    parentEnv: { PATH: process.env.PATH },
    privateHome: home,
    loopbackUrl: 'http://127.0.0.1:54321',
    syntheticAnonKey: 'local-anon',
    siteUrl: `http://127.0.0.1:${port}`,
    countsEnabled: true,
    port,
    registry,
  })
  assert.equal(app.ready, true)
  assert.match(app.origin, /^http:\/\/127\.0\.0\.1:\d+$/)
  assert.equal(app.countsEnabled, true)
  assert.equal(app.child.exitCode, null)
  const context = baueAcceptanceContext({
    runId: 'r1-context',
    productHead: PRODUCT_BASELINE,
    signal: new AbortController().signal,
    timeoutMs: 1000,
    accounts: {
      owner: { id: '1', email: 'o@aaclr1.invalid', password: 'x' },
      moderator: { id: '2', email: 'm@aaclr1.invalid', password: 'x' },
      ordinary: { id: '3', email: 'u@aaclr1.invalid', password: 'x' },
      creator: { id: '4', email: 'c@aaclr1.invalid', password: 'x' },
    },
    localApi: { origin: app.origin, anonKey: 'anon' },
    appController: { current: app, options: {}, registry, owned: { appChild: app.child } },
    observer: { mark: () => 0, since: () => ({ complete: true, calls: [] }) },
    fixtureDb: {
      mutateProfile: async () => {},
      verifyProfile: async () => ({ role: 'owner', status: 'active' }),
      createExtra: async () => ({ id: 'e' }),
      adjustCreatedAt: async () => {},
      independentCount: async () => ({ present: '4', recent: '0' }),
      applySql: async () => {},
    },
    evidenceDir,
    browserRegistry: new Map(),
    privateHome: home,
    childEnv: { PATH: '/usr/bin' },
  })
  assert.equal(validateAcceptanceContext(context), true)
  assert.equal(context.evidenceDir, evidenceDir)
  await stoppeOwnedApp(app.child)
  rmSync(home, { recursive: true, force: true })
})

test('R1 assembled context without a private evidenceDir is rejected', () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aaclr1-evdir-'))
  rmSync(evidence, { recursive: true, force: true })
  assert.throws(
    () => baueAcceptanceContext({
      runId: 'x',
      productHead: PRODUCT_BASELINE,
      signal: new AbortController().signal,
      timeoutMs: 1,
      accounts: {
        owner: { id: '1', email: 'o@aaclr1.invalid', password: 'x' },
        moderator: { id: '2', email: 'm@aaclr1.invalid', password: 'x' },
        ordinary: { id: '3', email: 'u@aaclr1.invalid', password: 'x' },
        creator: { id: '4', email: 'c@aaclr1.invalid', password: 'x' },
      },
      localApi: { origin: 'http://127.0.0.1:9', anonKey: 'anon' },
      observer: { mark: () => 0, since: () => ({ complete: true, calls: [] }) },
      fixtureDb: {},
      evidenceDir: '',
    }),
    /evidenceDir/,
  )
})

test('R2 partial stack failure stays owned; leftover volume and traversal do not PASS cleanup', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-partial-'))
  const registry = createOwnershipRegistry({ privateHome: home, evidenceDir: home })
  registry.hadFallibleAcquisition = true
  await assert.rejects(
    () => starteOwnedStack({
      cliBin: process.execPath,
      dockerBin: 'docker',
      workdir: home,
      env: { PATH: '/usr/bin' },
      plan: { bind: '127.0.0.1', services: [{ name: 'api-gateway', host: '127.0.0.1', port: 1 }] },
      networkName: 'aaclr1-partial',
      registry,
      execFile: (bin, args) => {
        if (args[0] === 'network' && args[1] === 'create') return 'netid'
        throw new Error('inspect failed after network create')
      },
      spawnFn: () => {
        throw new Error('cli child failed after network')
      },
    }),
    /cli child failed|inspect failed|not a completed/,
  )
  assert.equal(registry.network?.created, true)
  const cleanup = await raeumeOwnedAuf({
    privateHome: home,
    registry,
    dockerBin: 'docker',
    execFile: (bin, args) => {
      if (args[0] === 'network' && args[1] === 'inspect') throw new Error('missing')
      if (args[0] === 'network' && args[1] === 'rm') return ''
      return ''
    },
  })
  assert.equal(cleanup.neverStarted, false)
  assert.ok(cleanup.reports.some((item) => item.kind === 'stack'))
  assert.equal(assertOwnedPath('/tmp/owned/../foreign', ['/tmp/owned']), false)
  const volumeReport = await stoppeOwnedStack({
    dockerBin: 'docker',
    state: {
      network: { name: 'n', created: true, id: 'x' },
      volumes: [{ name: 'leftover-vol' }],
      containers: [],
    },
    execFile: (bin, args) => {
      if (args[0] === 'volume' && args[1] === 'rm') throw new Error('in use')
      if (args[0] === 'volume' && args[1] === 'inspect') return '{"Name":"leftover-vol"}'
      if (args[0] === 'network' && args[1] === 'inspect') throw new Error('gone')
      if (args[0] === 'network' && args[1] === 'rm') return ''
      return ''
    },
  })
  assert.equal(volumeReport.volumesRemoved, false)
  assert.equal(volumeReport.dockerServicesStopped, false)
  const foreign = mkdtempSync(join(tmpdir(), 'aaclr1-foreign2-'))
  writeFileSync(join(foreign, 'sentinel'), 'keep')
  const withForeign = await raeumeOwnedAuf({
    privateHome: home,
    foreignSentinel: foreign,
    registry: createOwnershipRegistry({ privateHome: home }),
  })
  assert.equal(existsSync(foreign), true)
  assert.ok(withForeign.removals.some((item) => item.kind === 'foreign-sentinel' && item.removed === false))
  rmSync(foreign, { recursive: true, force: true })
  rmSync(home, { recursive: true, force: true })
})

test('R2 failed app stop refuses replacement; two restarts update final cleanup ownership', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-restart-'))
  const checkout = join(home, 'checkout')
  mkdirSync(checkout)
  writeFakeAppCheckout(checkout)
  const registry = createOwnershipRegistry({ privateHome: home, evidenceDir: home })
  const firstPort = await freePort()
  const first = await starteOwnedApp({
    checkoutDir: checkout,
    parentEnv: { PATH: process.env.PATH },
    privateHome: home,
    loopbackUrl: 'http://127.0.0.1:54321',
    syntheticAnonKey: 'anon',
    port: firstPort,
    registry,
  })
  await assert.rejects(
    () => restartOwnedApp(first, {
      checkoutDir: checkout,
      parentEnv: { PATH: process.env.PATH },
      privateHome: home,
      loopbackUrl: 'http://127.0.0.1:54321',
      syntheticAnonKey: 'anon',
      port: firstPort,
      registry,
      stopApp: async () => ({ reaped: false, unknown: true, neverStarted: false }),
    }),
    /unconfirmed app stop/,
  )
  assert.equal(registry.stopUnknown, true)
  registry.stopUnknown = false
  await stoppeOwnedApp(first.child)
  const secondPort = await freePort()
  const thirdPort = await freePort()
  const second = await starteOwnedApp({
    checkoutDir: checkout,
    parentEnv: { PATH: process.env.PATH },
    privateHome: home,
    loopbackUrl: 'http://127.0.0.1:54321',
    syntheticAnonKey: 'anon',
    port: secondPort,
    registry,
  })
  const third = await restartOwnedApp(second, {
    checkoutDir: checkout,
    parentEnv: { PATH: process.env.PATH },
    privateHome: home,
    loopbackUrl: 'http://127.0.0.1:54321',
    syntheticAnonKey: 'anon',
    port: thirdPort,
    registry,
    clearRuntimeState: true,
    buildApp: async () => {
      mkdirSync(join(checkout, '.next'), { recursive: true })
      writeFileSync(join(checkout, '.next/BUILD_ID'), 'again')
      return { nextDir: join(checkout, '.next') }
    },
  })
  assert.equal(registry.appChild, third.child)
  assert.notEqual(registry.appChild, second.child)
  const cleanup = await raeumeOwnedAuf({
    privateHome: home,
    registry,
    appChild: registry.appChild,
  })
  assert.ok(cleanup.reports.some((item) => item.kind === 'app'))
  rmSync(home, { recursive: true, force: true })
})

test('R2 failed browser launch and unconfirmed close remain owned', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-browser-'))
  const registry = new Map()
  await assert.rejects(
    () => newBrowserSession({
      viewport: { width: 800, height: 600 },
      privateHome: home,
      launchPersistentContext: async () => { throw new Error('launch failed') },
      registry,
    }),
    /launch failed/,
  )
  assert.equal(registry.size, 1)
  const handle = [...registry.values()][0]
  assert.equal(handle.launchPending, true)
  const fake = {
    route: async (_pattern, handler) => { fake._handler = handler },
    on() {},
    close: () => new Promise(() => {}),
  }
  const context = await newBrowserSession({
    viewport: { width: 800, height: 600 },
    privateHome: home,
    launchPersistentContext: async () => fake,
    registry,
  })
  assert.equal(typeof fake._handler, 'function')
  let aborted = false
  await fake._handler({
    request: () => ({ url: () => 'https://example.invalid/' }),
    continue: async () => { throw new Error('must not continue') },
    abort: async () => { aborted = true },
  })
  assert.equal(aborted, true)
  assert.equal(assertLocalBrowserTraffic('http://127.0.0.1:9/'), true)
  await assert.rejects(
    () => closeBrowserSession(context, {
      registry,
      closeTimeoutMs: 20,
    }),
    /browser close|UNKNOWN|not proved/,
  )
  assert.equal(registry.has(context.__runtimeSessionId), true)
  rmSync(home, { recursive: true, force: true })
})

test('R3 dotenv, symlink and PATH-only CLI identity fail closed; archive binding is required', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'aaclr1-src-'))
  execFileSync('git', ['-c', 'init.defaultBranch=main', 'init'], { cwd: repo })
  execFileSync('git', ['config', 'user.email', 't@aaclr1.invalid'], { cwd: repo })
  execFileSync('git', ['config', 'user.name', 'fixture'], { cwd: repo })
  mkdirSync(join(repo, 'supabase/migrations'), { recursive: true })
  writeFileSync(join(repo, 'app.txt'), 'tracked')
  writeFileSync(join(repo, 'supabase/migrations/20260101000000_x.sql'), 'select 1;\n')
  execFileSync('git', ['add', '.'], { cwd: repo })
  execFileSync('git', ['commit', '-m', 'seed'], { cwd: repo })
  const rev = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
  writeFileSync(join(repo, '.env.development.local'), 'SECRET=1')
  const dest = mkdtempSync(join(tmpdir(), 'aaclr1-copy-'))
  materialisiereAppCheckout({
    sourceRoot: repo,
    destDir: dest,
    rev,
    migrations: {
      files: [{
        path: 'supabase/migrations/20260101000000_x.sql',
        baselineBlob: execFileSync('git', ['rev-parse', `${rev}:supabase/migrations/20260101000000_x.sql`], { cwd: repo, encoding: 'utf8' }).trim(),
      }],
    },
  })
  assert.equal(existsSync(join(dest, '.env.development.local')), false)
  writeFileSync(join(dest, '.env.development.local'), 'SECRET=1')
  await assert.rejects(
    () => prepareAppForLaunch({
      checkoutDir: dest,
      env: {},
      execFile: () => '',
    }),
    /\.env/,
  )
  rmSync(join(dest, '.env.development.local'), { force: true })
  symlinkSync('/tmp/aaclr1-foreign-target', join(dest, 'escape-link'))
  assert.throws(() => refuseSymlinksAndDotenv(dest), /Symlink/)
  assert.throws(
    () => classifyMigrationApplicability({
      file: { path: 'supabase/migrations/20260101000000_x.sql' },
      appliedVersions: ['20260101'],
      baselineBlob: 'aaa',
      copiedBlob: 'bbb',
    }),
    /Copied migration bytes/,
  )
  assert.throws(
    () => classifyMigrationApplicability({
      file: { path: 'supabase/migrations/20260101000000_x.sql' },
      appliedVersions: ['20260101'],
    }),
    /prefix-only/,
  )
  const cliScript = join(repo, 'fake-supabase')
  writeFileSync(cliScript, 'official-extract-placeholder\n')
  const execFakeCli = (_bin, args) => {
    const joined = args.join(' ')
    if (joined.includes('--version')) return '2.117.0\n'
    if (joined.includes('start')) return 'Start containers for Supabase local development\n'
    return 'supabase start\nsupabase stop\nsupabase status\n'
  }
  const pathOnly = verifyResolvedCli({
    resolved: cliScript,
    env: { PATH: repo },
    execFile: execFakeCli,
  })
  assert.equal(pathOnly.identityVerified, false)
  assert.equal(pathOnly.pinned, false)
  assert.equal(pathOnly.archiveBound, false)
  const official = CLI.archives['linux-x64'].apiDigest.replace('sha256:', '')
  const bound = bindCliExecutableIdentity({
    resolved: cliScript,
    provenance: {
      archiveVerified: true,
      archiveSha256: official,
      extractedBinPath: cliScript,
    },
    platformId: 'linux-x64',
  })
  assert.equal(bound.archiveBound, true)
  const verified = verifyResolvedCli({
    resolved: cliScript,
    env: { PATH: repo },
    execFile: execFakeCli,
    provenance: {
      archiveVerified: true,
      archiveSha256: official,
      extractedBinPath: cliScript,
    },
    platformId: 'linux-x64',
  })
  assert.equal(verified.identityVerified, true)
  rmSync(repo, { recursive: true, force: true })
  rmSync(dest, { recursive: true, force: true })
})

test('R4 observer rejects origin escape, uses manual redirects, and incomplete intervals cannot prove no-RPC', async () => {
  assert.throws(
    () => resolveUpstreamTarget('http://outside.invalid/secret', 'http://127.0.0.1:9'),
    /absolute or scheme-relative|origin escape/,
  )
  assert.throws(
    () => resolveUpstreamTarget('//outside.invalid/secret', 'http://127.0.0.1:9'),
    /absolute or scheme-relative|origin escape/,
  )
  const seen = []
  const observer = createRpcObserver({
    listenHost: '127.0.0.1',
    listenPort: 0,
    upstreamOrigin: 'http://127.0.0.1:9',
    fetchImpl: async (url, init) => {
      seen.push({ url: String(url), redirect: init.redirect, authorization: init.headers.authorization || init.headers.Authorization })
      return new Response('', { status: 302, headers: { location: 'http://outside.invalid/x', 'set-cookie': 'a=1' } })
    },
  })
  const listened = await observer.listen()
  await new Promise((resolve, reject) => {
    const req = httpRequest({
      host: '127.0.0.1',
      port: new URL(listened.origin).port,
      method: 'GET',
      path: 'http://outside.invalid/secret',
      headers: { authorization: 'Bearer synthetic' },
    }, (res) => {
      res.resume()
      res.on('end', resolve)
    })
    req.on('error', reject)
    req.end()
  })
  assert.equal(seen.some((item) => item.url.includes('outside.invalid')), false)
  const mark = observer.mark()
  const redirected = await fetch(`${listened.origin}/rest/v1/rpc/admin_account_counts_v1`, {
    method: 'POST',
    headers: { authorization: 'Bearer synthetic' },
    body: '{}',
    redirect: 'manual',
  })
  assert.equal(redirected.status, 302)
  assert.equal(seen.at(-1).redirect, 'manual')
  assert.equal(seen.at(-1).url.startsWith('http://127.0.0.1:9'), true)
  let release
  const hanging = createRpcObserver({
    listenHost: '127.0.0.1',
    listenPort: 0,
    upstreamOrigin: 'http://127.0.0.1:9',
    fetchImpl: () => new Promise((resolve) => { release = resolve }),
  })
  const hangListen = await hanging.listen()
  const pending = fetch(`${hangListen.origin}/slow`, { method: 'GET' })
  await new Promise((resolve) => setTimeout(resolve, 30))
  const incomplete = hanging.since(0)
  assert.equal(incomplete.complete, false)
  release(new Response('ok', { status: 200 }))
  await pending
  await hanging.close()
  await observer.close()
  assert.equal(observer.since(mark).calls.some((item) => JSON.stringify(item).includes('Bearer')), false)
})

test('R5 catalog verification requires definition, owner, ACL and config; name-only is not PASS', async () => {
  const sql = leseUnveraenderteSql()
  assert.throws(
    () => assertInstalledCatalog({
      prereq: { server_version: '17.6', auth_schema: 1, migrations_schema: 1 },
      producer: { proname: 'account_counts_v1' },
      wrapper: { proname: 'admin_account_counts_v1' },
    }, sql),
    /definition is missing|name-only/,
  )
  assert.throws(
    () => assertInstalledCatalog({
      prereq: { server_version: '17.6', auth_schema: 1, migrations_schema: 1 },
      producer: {
        schema: 'jetnity_reporting',
        proname: 'account_counts_v1',
        owner: 'anon',
        security_definer: true,
        config: ['search_path=pg_catalog', 'TimeZone=UTC'],
        definition: 'account_counts_v1 darf_konten_verwalten 720 hours',
        execute_roles: 'authenticated',
      },
      wrapper: {
        schema: 'public',
        proname: 'admin_account_counts_v1',
        owner: 'postgres',
        security_definer: false,
        config: ['search_path=pg_catalog'],
        definition: 'admin_account_counts_v1 jetnity_reporting.account_counts_v1',
        execute_roles: 'authenticated',
      },
    }, sql),
    /owner/,
  )
  assert.throws(
    () => assertInstalledCatalog({
      prereq: { server_version: '17.6', auth_schema: 1, migrations_schema: 1 },
      producer: {
        schema: 'jetnity_reporting',
        proname: 'account_counts_v1',
        owner: 'postgres',
        security_definer: true,
        config: ['search_path=pg_catalog', 'TimeZone=UTC'],
        definition: 'account_counts_v1 darf_konten_verwalten 720 hours',
        execute_roles: 'anon,public',
      },
      wrapper: {
        schema: 'public',
        proname: 'admin_account_counts_v1',
        owner: 'postgres',
        security_definer: false,
        config: ['search_path=pg_catalog'],
        definition: 'admin_account_counts_v1 jetnity_reporting.account_counts_v1',
        execute_roles: 'authenticated',
      },
    }, sql),
    /EXECUTE is granted/,
  )
  const ok = assertInstalledCatalog({
    prereq: { server_version: '17.6', timezone: 'UTC', auth_schema: 1, migrations_schema: 1 },
    producer: {
      schema: 'jetnity_reporting',
      proname: 'account_counts_v1',
      owner: 'postgres',
      security_definer: true,
      config: ['search_path=pg_catalog', 'TimeZone=UTC'],
      definition: 'create function account_counts_v1() ... darf_konten_verwalten ... 720 hours',
      execute_roles: 'authenticated',
    },
    wrapper: {
      schema: 'public',
      proname: 'admin_account_counts_v1',
      owner: 'postgres',
      security_definer: false,
      config: ['search_path=pg_catalog'],
      definition: 'create function admin_account_counts_v1() ... jetnity_reporting.account_counts_v1()',
      execute_roles: 'authenticated',
    },
  }, sql)
  assert.equal(ok.catalogVerified, true)
  await assert.rejects(
    () => installProducerAndWrapper({
      applySql: async () => {},
      verify: async () => ({
        prereq: { server_version: '17.6', auth_schema: 1, migrations_schema: 1 },
        producer: { proname: 'account_counts_v1' },
        wrapper: { proname: 'admin_account_counts_v1' },
      }),
    }),
    /definition is missing|name-only/,
  )
  assert.equal(parseJsonRow('{"a":1}').a, 1)
})

test('R1/R3 defaultStartRuntime refuses missing archive-bound CLI and missing private evidenceDir', async () => {
  await assert.rejects(
    () => defaultStartRuntime({
      docker: { usable: true, selected: { path: '/bin/true' } },
      cli: { identityVerified: true, resolved: '/bin/true', archiveBound: false },
      owned: { evidenceDir: mkdtempSync(join(tmpdir(), 'aaclr1-ev-')) },
    }),
    /archive|not a completed/,
  )
  await assert.rejects(
    () => defaultStartRuntime({
      docker: { usable: true, selected: { path: '/bin/true' } },
      cli: { identityVerified: true, resolved: '/bin/true', archiveBound: true },
      owned: {},
    }),
    /evidenceDir/,
  )
})

test('R2 failure receipt is persisted when setup throws after fallible acquisition', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aaclr1-fail-'))
  await assert.rejects(
    () => run({
      env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
      argv: ['--runtime-only'],
      evidenceDir: evidence,
      execFile: (bin, args) => {
        if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
        throw new Error(`unexpected ${bin}`)
      },
      resolve: () => null,
      dockerResult: {
        usable: true,
        present: true,
        selected: { path: '/bin/true' },
        sockets: [],
        commands: [],
        note: 'test double',
        installAttempted: false,
      },
      cliResult: {
        identityVerified: true,
        archiveBound: true,
        resolved: '/bin/true',
        version: '2.117.0',
        helpVerified: true,
        startHelpVerified: true,
        excludeNames: [],
        note: 'test double',
      },
      startRuntime: async ({ owned }) => {
        owned.registry.hadFallibleAcquisition = true
        owned.network = { name: 'aaclr1-partial', created: true, option: 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' }
        owned.registry.network = owned.network
        throw new Error('partial stack failed')
      },
    }),
    /partial stack failed/,
  )
  const names = (await import('node:fs')).readdirSync(evidence).filter((name) => name.endsWith('-failure.json'))
  assert.equal(names.length, 1)
  const payload = JSON.parse(readFileSync(join(evidence, names[0]), 'utf8'))
  assert.match(payload.error, /partial stack failed/)
  rmSync(evidence, { recursive: true, force: true })
})

test('G20 does not PASS an incomplete registry after fallible work', () => {
  assert.equal(bewerteCleanup({
    unknown: false,
    ownershipRetained: false,
    usedPkill: false,
    usedDockerPrune: false,
    neverStarted: true,
    incompleteRegistry: true,
  }, { registry: { hadFallibleAcquisition: true } }), false)
  assert.equal(probeTraversal(), true)
})

function probeTraversal() {
  return cleanupDryRunKontrolle().traversalBlocked === true
}
