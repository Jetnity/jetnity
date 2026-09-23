#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
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
  RUN_LABEL,
  ROOT,
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
  prepareOfficialCliIdentity,
  sha256File,
  parseCliArtifactArgs,
  materializeVerifiedArchive,
  acquireOfficialCli,
  readOfflineOfficialArtifacts,
  hashTarMember,
  shouldInvokeOfficialCli,
} from './cli-identity.mjs'
import {
  assertRuntimeSources,
  leseRuntimeSourceManifest,
  refuseBootstrapOverlay,
  materialisiereAppCheckout,
  classifyMigrationApplicability,
  refuseSymlinksAndDotenv,
  SAFE_SNAPSHOT_DOTENV_EXCLUDES,
} from './source.mjs'
import {
  prepareAppForLaunch,
  starteOwnedApp,
  restartOwnedApp,
  stoppeOwnedApp,
  warteAufAppBereitschaft,
  appListenArgs,
} from './app.mjs'
import { baueAcceptanceContext, validateAcceptanceContext } from './context.mjs'
import { createOwnershipRegistry } from './ownership.mjs'
import { newBrowserSession, closeBrowserSession, assertLocalBrowserTraffic, closeOwnedBrowserHandle } from './browser-session.mjs'
import { resolveUpstreamTarget, isRemoteRedirect, readBoundedBody } from './observer.mjs'
import { assertInstalledCatalog, assertInstalledRelation, installProducerAndWrapper, parseJsonRow, acceptedCatalogFixture, requiredCount, extractExactDollarBody, EXPECTED_PRODUCER_RESULT } from './schema.mjs'
import { starteOwnedStack, stoppeOwnedStack, inspectDockerResource, classifyDockerInspectError, collectOwnedDockerResources, classifyVolumeOwnership, RESOURCE_STATE } from './stack.mjs'
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
import {
  redactSecrets,
  writeEvidence,
  assertSafeEvidence,
  exportSanitizedRunArtifacts,
  createRunIdentity,
  consumerArtifactNames,
  expectedConsumerArtifacts,
} from './evidence.mjs'
import { persistFailureReceipt, run, parseMode } from './run.mjs'
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

test('R1 default cold checkout cannot claim a running app without locked deps and readiness', async () => {
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
  const prepared = await prepareAppForLaunch({
    checkoutDir: dest,
    env: {
      PATH: '/usr/bin',
      HOME: dest,
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: 'true',
    },
    execFile: (bin, args, options) => {
      calls.push({ bin: String(bin), args, env: options?.env })
      if (args[0] === 'ci') {
        mkdirSync(join(dest, 'node_modules/next/dist/bin'), { recursive: true })
        writeFileSync(join(dest, 'node_modules/next/dist/bin/next'), 'ok')
      }
      return ''
    },
  })
  assert.ok(calls.some((item) => item.args[0] === 'ci'))
  assert.equal(calls.some((item) => item.args.includes('build')), false)
  assert.equal(prepared.launchScript, 'dev')
  assert.equal(prepared.built.skipped, true)
  assert.equal(calls[0].env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321')
  rmSync(empty, { recursive: true, force: true })
  rmSync(dest, { recursive: true, force: true })
})

test('A1/A2 readiness rejects HTTP 500 and an already-exited child; A2-script is next dev', async () => {
  assert.equal(appListenArgs({ port: 3000 }).script, 'dev')
  assert.equal(appListenArgs({ port: 3000 }).args[2], 'dev')
  const live = { exitCode: null, signalCode: null, once() {}, off() {} }
  await assert.rejects(
    () => warteAufAppBereitschaft({
      child: live,
      origin: 'http://127.0.0.1:3000',
      timeoutMs: 200,
      fetchImpl: async () => ({ status: 500 }),
    }),
    /server error 500|not a completed/,
  )
  await assert.rejects(
    () => warteAufAppBereitschaft({
      child: { exitCode: 1, signalCode: null, once() {}, off() {} },
      origin: 'http://127.0.0.1:3000',
      timeoutMs: 200,
      fetchImpl: async () => ({ status: 200 }),
    }),
    /child exited 1|not a completed/,
  )
})

test('R1 default wiring waits for a live loopback app and returns a contract-conforming §4 context', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-app-'))
  const checkout = join(home, 'checkout')
  mkdirSync(checkout)
  writeFakeAppCheckout(checkout)
  const evidenceDir = mkdtempSync(join(home, 'evidence-'))
  const port = await freePort()
  const registry = createOwnershipRegistry({ privateHome: home, evidenceDir })
  const spawned = []
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
    spawnFn: (cmd, args, options) => {
      spawned.push({ cmd, args, env: options.env })
      return spawn(cmd, args, options)
    },
  })
  assert.equal(app.ready, true)
  assert.match(app.origin, /^http:\/\/127\.0\.0\.1:\d+$/)
  assert.equal(app.countsEnabled, true)
  assert.equal(app.child.exitCode, null)
  assert.equal(app.launchScript, 'dev')
  assert.equal(app.envBoundary.LOCAL_FLAG, 'true')
  assert.equal(app.envBoundary.supabaseUrl, 'http://127.0.0.1:54321')
  assert.equal(spawned[0].args[1], 'dev')
  assert.equal(spawned[0].env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321')
  assert.equal(spawned[0].env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'local-anon')
  assert.equal(spawned[0].env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED, 'true')
  assert.equal(spawned[0].env.NODE_ENV, 'development')
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
    browserRegistry: registry.browsers,
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
  const daemonDown = Object.assign(new Error('Cannot connect to the Docker daemon'), { code: 'ETIMEDOUT' })
  const d1 = await stoppeOwnedStack({
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: home,
    state: {
      network: { name: 'owned-test', created: true },
      containers: [],
      volumes: [],
    },
    execFile: () => {
      throw daemonDown
    },
  })
  assert.equal(d1.networkState, RESOURCE_STATE.UNKNOWN)
  assert.equal(d1.containerState, RESOURCE_STATE.UNKNOWN)
  assert.equal(d1.volumeState, RESOURCE_STATE.UNKNOWN)
  assert.equal(d1.networkRemoved, false)
  assert.equal(d1.volumesRemoved, false)
  assert.equal(d1.dockerServicesStopped, false)
  assert.equal(d1.unknown, true)
  assert.equal(inspectDockerResource({
    execFile: () => { throw daemonDown },
    dockerBin: 'docker',
    args: ['network', 'inspect', 'owned-test'],
    env: {},
  }).state, RESOURCE_STATE.UNKNOWN)
  const d2 = await stoppeOwnedStack({
    dockerBin: 'docker',
    state: {
      network: { name: 'owned-test', created: true },
      containers: [],
      volumes: [],
      inventoryComplete: true,
    },
    execFile: () => '{"Name":"owned-test"}',
  })
  assert.equal(d2.networkRemoved, false)
  assert.equal(d2.dockerServicesStopped, false)
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
  const cli1 = bindCliExecutableIdentity({
    resolved: cliScript,
    provenance: {
      archiveVerified: true,
      archiveSha256: official,
      extractedBinPath: cliScript,
      binarySha256: sha256File(cliScript),
    },
    platformId: 'linux-x64',
  })
  assert.equal(cli1.archiveBound, false)
  assert.match(cli1.reason, /not a trust root/)
  writeFileSync(cliScript, 'mutated-bytes\n')
  const mutated = bindCliExecutableIdentity({
    resolved: cliScript,
    provenance: {
      boundFromArchiveBytes: true,
      archiveBytesSha256: official,
      extractedBinPath: cliScript,
      binarySha256: sha256File(join(repo, 'fake-supabase')),
    },
    platformId: 'linux-x64',
  })
  assert.equal(mutated.archiveBound, false)
  const link = join(repo, 'linked-supabase')
  symlinkSync(cliScript, link)
  const linked = bindCliExecutableIdentity({
    resolved: link,
    provenance: {
      boundFromArchiveBytes: true,
      archiveBytesSha256: official,
      extractedBinPath: link,
      binarySha256: sha256File(cliScript),
    },
    platformId: 'linux-x64',
  })
  assert.equal(linked.archiveBound, false)
  const toolingDir = join(repo, 'tooling')
  mkdirSync(join(toolingDir, 'bin'), { recursive: true })
  const extracted = join(toolingDir, 'bin', 'supabase')
  writeFileSync(extracted, 'official-extract-placeholder\n')
  writeFileSync(join(toolingDir, 'provenance.json'), `${JSON.stringify({
    archiveVerified: true,
    archiveSha256: official,
    extractedBinPath: extracted,
    binarySha256: sha256File(extracted),
    version: CLI.version,
    platformId: 'linux-x64',
  }, null, 2)}\n`)
  const prepared = prepareOfficialCliIdentity({
    toolingDir,
    env: { PATH: repo },
    execFile: execFakeCli,
    platformId: 'linux-x64',
  })
  assert.equal(prepared.identityVerified, false)
  assert.equal(prepared.archiveBound, false)
  const emptyTooling = join(repo, 'empty-tooling')
  mkdirSync(emptyTooling)
  const blocked = prepareOfficialCliIdentity({ toolingDir: emptyTooling, platformId: 'linux-x64' })
  assert.equal(blocked.identityVerified, false)
  assert.match(blocked.note, /does not download/)
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
  assert.equal(redirected.status, 502)
  assert.equal(redirected.headers.get('location'), null)
  assert.match(await redirected.text(), /out-of-scope redirect/)
  assert.equal(seen.at(-1).redirect, 'manual')
  assert.equal(seen.at(-1).url.startsWith('http://127.0.0.1:9'), true)
  assert.equal(isRemoteRedirect('http://outside.invalid/x', 'http://127.0.0.1:9'), true)
  assert.equal(isRemoteRedirect('http://127.0.0.1:9/next', 'http://127.0.0.1:9'), false)
  const oversize = await readBoundedBody(
    { arrayBuffer: async () => new Uint8Array(8) },
    { maxBytes: 4, deadlineMs: Date.now() + 1000 },
  ).catch((error) => error)
  assert.match(String(oversize.message || oversize), /too large/)
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

test('R5 S1–S7 catalog verification requires typed ACL, signature and executable body', async () => {
  const markerOnly = {
    prereq: { server_version: '17.6', auth_schema: 1, migrations_schema: 1 },
    producer: {
      schema: 'jetnity_reporting',
      proname: 'account_counts_v1',
      owner: 'postgres',
      security_definer: true,
      config: ['search_path=pg_catalog', 'TimeZone=UTC'],
      execute_roles: 'postgres,authenticated',
      definition: "CREATE FUNCTION account_counts_v1() RETURNS integer LANGUAGE sql AS 'SELECT 1 /* darf_konten_verwalten 720 hours */';",
    },
    wrapper: {
      schema: 'public',
      proname: 'admin_account_counts_v1',
      owner: 'postgres',
      security_definer: false,
      config: ['search_path=pg_catalog'],
      execute_roles: 'postgres,authenticated',
      definition: "CREATE FUNCTION admin_account_counts_v1() RETURNS integer LANGUAGE sql AS 'SELECT 1 /* jetnity_reporting.account_counts_v1 */';",
    },
  }
  assert.throws(() => assertInstalledCatalog(markerOnly), /schema-access|typed ACL|signature|prosrc|accepted function body/)
  const s2 = acceptedCatalogFixture()
  s2.producer.acls = [
    { grantor: 'postgres', grantee: 'authenticated', privilege: 'EXECUTE', is_grantable: false },
    { grantor: 'postgres', grantee: 'rogue_role', privilege: 'EXECUTE', is_grantable: false },
  ]
  assert.throws(() => assertInstalledCatalog(s2), /unexpected rogue_role/)
  const s3 = acceptedCatalogFixture()
  s3.producer.acls = []
  s3.wrapper.acls = []
  assert.throws(() => assertInstalledCatalog(s3), /required EXECUTE for authenticated/)
  const s4 = { prereq: { server_version: '17.6' }, producer: markerOnly.producer, wrapper: markerOnly.wrapper }
  assert.throws(() => requiredCount(s4.prereq.auth_schema, 'auth_schema'), /missing|Number\(undefined\)/)
  assert.throws(() => assertInstalledCatalog(s4), /auth_schema|missing/)
  const ok = acceptedCatalogFixture()
  assert.equal(assertInstalledCatalog(ok).catalogVerified, true)
  const s5 = structuredClone(ok)
  s5.producer.owner = 'anon'
  assert.throws(() => assertInstalledCatalog(s5), /owner/)
  const s6 = structuredClone(ok)
  s6.wrapper.definition = ''
  s6.wrapper.prosrc = null
  assert.throws(() => assertInstalledCatalog(s6), /definition is missing|name-only|prosrc/)
  const sql1 = structuredClone(ok)
  sql1.producer.prosrc = "BEGIN PERFORM 'darf_konten_verwalten 720 hours auth.uid 42501 public.profiles auth.users'; PERFORM 'active'; RETURN QUERY SELECT 999::bigint, 0::bigint, now(), now()-interval '720 hours', 'jetnity.admin-account-counts.v1'::text; END"
  assert.throws(() => assertInstalledCatalog(sql1), /prosrc is not the accepted/)
  const sql2 = structuredClone(ok)
  sql2.producer.config = ['search_path=pg_catalog, attacker', 'TimeZone=UTC']
  assert.throws(() => assertInstalledCatalog(sql2), /proconfig/)
  const mutatedActive = structuredClone(ok)
  mutatedActive.producer.prosrc = extractExactDollarBody(leseUnveraenderteSql().producerSql).replace(
    "is distinct from 'active'",
    "is not distinct from 'active'",
  )
  assert.throws(() => assertInstalledCatalog(mutatedActive), /prosrc is not the accepted/)
  const sqlRelation = structuredClone(ok.producer)
  sqlRelation.prosrc = sql1.producer.prosrc
  assert.throws(
    () => assertInstalledRelation(sqlRelation, {
      schema: 'jetnity_reporting',
      proname: 'account_counts_v1',
      securityDefiner: true,
      language: 'plpgsql',
      expectedResult: EXPECTED_PRODUCER_RESULT,
      expectedProsrc: extractExactDollarBody(leseUnveraenderteSql().producerSql),
      expectedConfig: ['search_path=pg_catalog', 'TimeZone=UTC'],
    }),
    /prosrc is not the accepted/,
  )
  const grantOption = structuredClone(ok)
  grantOption.wrapper.acls = [
    { grantor: 'postgres', grantee: 'authenticated', privilege: 'EXECUTE', is_grantable: true },
  ]
  assert.throws(() => assertInstalledCatalog(grantOption), /must not be grantable/)
  const s7 = structuredClone(ok)
  s7.wrapper.acls = [
    { grantor: 'postgres', grantee: 'public', privilege: 'EXECUTE', is_grantable: false },
    { grantor: 'postgres', grantee: 'authenticated', privilege: 'EXECUTE', is_grantable: false },
  ]
  assert.throws(() => assertInstalledCatalog(s7), /unexpected public|granted to public/)
  await assert.rejects(
    () => installProducerAndWrapper({
      applySql: async () => {},
      verify: async () => markerOnly,
    }),
    /schema-access|typed ACL|signature|prosrc|accepted function body/,
  )
  const verified = await installProducerAndWrapper({
    applySql: async () => {},
    verify: async ({ producerSql, wrapperSql, prereqSql }) => {
      if (!producerSql || !wrapperSql || !prereqSql) throw new Error('verify callback must receive catalog SQL')
      return acceptedCatalogFixture()
    },
  })
  assert.equal(verified.catalogVerified, true)
  assert.equal(verified.sourceHashIsNotCatalogPass, true)
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

test('R1/R3 seeded sidecar cannot manufacture official archive provenance', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aaclr1-fail-'))
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-failhome-'))
  const toolingDir = join(home, 'tooling')
  mkdirSync(join(toolingDir, 'bin'), { recursive: true, mode: 0o700 })
  const extracted = join(toolingDir, 'bin', 'supabase')
  writeFileSync(extracted, 'not an official executable\n', { mode: 0o700 })
  const official = CLI.archives[platformKey() === 'linux-arm64' ? 'linux-arm64' : 'linux-x64'].apiDigest.replace('sha256:', '')
  writeFileSync(join(toolingDir, 'provenance.json'), `${JSON.stringify({
    archiveVerified: true,
    archiveSha256: official,
    extractedBinPath: extracted,
    binarySha256: sha256File(extracted),
    version: CLI.version,
    platformId: platformKey() === 'linux-arm64' ? 'linux-arm64' : 'linux-x64',
  }, null, 2)}\n`)
  let startReached = false
  const result = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
    argv: ['--runtime-only'],
    evidenceDir: evidence,
    privateHome: home,
    execFile: (bin, args) => {
      if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
      throw new Error(`binary must not be invoked from a sidecar: ${bin} ${args}`)
    },
    resolve: () => null,
    startRuntime: async () => {
      startReached = true
      throw new Error('start must not run from sidecar provenance')
    },
  })
  assert.equal(result.cli.identityVerified, false)
  assert.equal(result.cli.archiveBound, false)
  assert.equal(startReached, false)
  rmSync(evidence, { recursive: true, force: true })
  rmSync(home, { recursive: true, force: true })
})

test('default run ignores injected cliResult/dockerResult and stays on the official-byte path', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aaclr1-inject-'))
  const result = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
    argv: [],
    evidenceDir: evidence,
    execFile: (bin, args) => {
      if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
      throw new Error(`unexpected ${bin} ${args}`)
    },
    resolve: () => null,
    cliResult: {
      identityVerified: true,
      archiveBound: true,
      resolved: '/bin/true',
      version: '2.117.0',
      helpVerified: true,
      startHelpVerified: true,
    },
    dockerResult: { usable: true, present: true, selected: { path: '/bin/true' } },
  })
  assert.equal(result.cli.identityVerified, false)
  assert.equal(result.cli.archiveBound, false)
  assert.notEqual(result.verdict, 'LOCAL_FULL_STACK_PASS')
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

function writeOwnedTar(dir, { memberName = 'supabase', contents = 'owned-member-bytes\n' } = {}) {
  writeFileSync(join(dir, memberName), contents)
  const archivePath = join(dir, `${memberName}.tar.gz`)
  execFileSync('tar', ['-czf', archivePath, memberName], { cwd: dir })
  return { archivePath, bytes: readFileSync(archivePath), sha256: createHash('sha256').update(readFileSync(archivePath)).digest('hex') }
}

test('R1/R3 explicit --cli-archive/--cli-checksums consume bytes; sidecar/corrupt/wrong-member fail before invoke', async () => {
  assert.deepEqual(parseCliArtifactArgs([]), { archivePath: null, checksumsPath: null })
  assert.throws(() => parseCliArtifactArgs(['--cli-archive', '/tmp/a']), /together/)
  assert.throws(() => parseCliArtifactArgs(['--cli-checksums', '/tmp/c']), /together/)
  const parsed = parseCliArtifactArgs(['--runtime-only', '--cli-archive', '/tmp/a', '--cli-checksums', '/tmp/c'])
  assert.equal(parsed.archivePath, '/tmp/a')
  assert.equal(parsed.checksumsPath, '/tmp/c')

  const workspace = mkdtempSync(join(tmpdir(), 'aaclr1-cli-'))
  const owned = writeOwnedTar(workspace)
  const tooling = join(workspace, 'tooling')
  const provenance = materializeVerifiedArchive({
    toolingDir: tooling,
    archiveBytes: owned.bytes,
    identity: { name: 'owned.tar.gz', sha256: owned.sha256, version: 'test' },
  })
  assert.equal(readFileSync(provenance.extractedBinPath, 'utf8'), 'owned-member-bytes\n')
  assert.equal(provenance.boundFromArchiveBytes, true)
  assert.equal(provenance.archiveBytesSha256, owned.sha256)
  const boundNonOfficial = bindCliExecutableIdentity({
    resolved: provenance.extractedBinPath,
    provenance,
    platformId: 'linux-x64',
    archiveBytes: owned.bytes,
    archivePath: provenance.archivePath,
  })
  assert.equal(boundNonOfficial.archiveBound, false)
  assert.match(boundNonOfficial.reason, /!= official/)

  writeFileSync(join(workspace, 'readme'), 'not-the-cli\n')
  execFileSync('tar', ['-czf', 'wrong.tar.gz', 'readme'], { cwd: workspace })
  const wrongBytes = readFileSync(join(workspace, 'wrong.tar.gz'))
  await assert.rejects(async () => {
    materializeVerifiedArchive({
      toolingDir: join(workspace, 'wrong-tooling'),
      archiveBytes: wrongBytes,
      identity: {
        name: 'wrong.tar.gz',
        sha256: createHash('sha256').update(wrongBytes).digest('hex'),
      },
    })
  }, /missing the supabase member/)

  assert.throws(
    () => materializeVerifiedArchive({
      toolingDir: join(workspace, 'corrupt-tooling'),
      archiveBytes: Buffer.from('not-a-tar'),
      identity: {
        name: 'c.tar.gz',
        sha256: createHash('sha256').update('not-a-tar').digest('hex'),
      },
    }),
    /tar|archive|member|gzip|not in gzip/,
  )

  const fakeChecksums = `${'a'.repeat(64)}  supabase_2.117.0_linux_amd64.tar.gz\n`
  assert.throws(
    () => acquireOfficialCli({
      toolingDir: join(workspace, 'acq'),
      checksumsText: fakeChecksums,
      checksumsBytes: Buffer.from(fakeChecksums),
      archiveBytes: owned.bytes,
      platformId: 'linux-x64',
    }),
    /digest|mismatch/,
  )
  const missing = prepareOfficialCliIdentity({
    toolingDir: join(workspace, 'missing-prep'),
    archivePath: join(workspace, 'missing.tar.gz'),
    checksumsPath: join(workspace, 'missing.txt'),
    platformId: 'linux-x64',
  })
  assert.equal(missing.archiveBound, false)
  assert.equal(missing.identityVerified, false)
  assert.match(missing.note, /missing/)

  const archive = join(workspace, 'not-official.tar.gz')
  const checksums = join(workspace, 'checksums.txt')
  writeFileSync(archive, 'nope\n')
  writeFileSync(checksums, fakeChecksums)
  const offline = readOfflineOfficialArtifacts({ archivePath: archive, checksumsPath: checksums })
  assert.equal(offline.archiveBytes.toString(), 'nope\n')
  const invoked = []
  const result = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
    argv: ['--runtime-only', '--cli-archive', archive, '--cli-checksums', checksums],
    evidenceDir: join(workspace, 'evidence'),
    execFile: (bin, args) => {
      invoked.push({ bin: String(bin), args })
      if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
      throw new Error(`must not invoke ${bin} ${args}`)
    },
    resolve: () => null,
  })
  assert.equal(result.cli.archiveBound, false)
  assert.equal(result.cli.identityVerified, false)
  assert.equal(result.summary.fullLocalExecution, false)
  assert.ok(!invoked.some((item) => String(item.bin).includes('supabase') || item.args?.includes('--version')))
  rmSync(workspace, { recursive: true, force: true })
})

test('R2 context-not-found is UNKNOWN; unlabeled mounts stay unresolved; foreign volumes are retained', async () => {
  assert.equal(
    classifyDockerInspectError(new Error('context local-test: context not found'), {
      kind: 'container',
      name: 'owned',
    }),
    RESOURCE_STATE.UNKNOWN,
  )
  assert.equal(
    classifyDockerInspectError(new Error('No such container: owned'), {
      kind: 'container',
      name: 'owned',
    }),
    RESOURCE_STATE.ABSENT,
  )
  assert.equal(
    inspectDockerResource({
      execFile: () => { throw new Error('context local-test: context not found') },
      dockerBin: 'docker',
      args: ['inspect', 'owned'],
      env: {},
    }).state,
    RESOURCE_STATE.UNKNOWN,
  )
  assert.equal(
    classifyVolumeOwnership({
      mount: { Type: 'volume', Name: 'fixture-volume' },
      labels: { 'com.supabase.cli.project': 'probe' },
      runId: 'run-1',
    }).ownership,
    'unresolved',
  )
  const volume1 = collectOwnedDockerResources({
    dockerBin: 'docker',
    networkName: 'owned-network',
    env: {},
    runId: 'run-1',
    execFile: (_bin, args) => {
      if (args[0] === 'ps') return 'owned-container'
      if (args[0] === 'inspect') {
        return JSON.stringify([{
          Id: 'owned-container',
          Config: { Labels: { 'com.supabase.cli.project': 'probe' } },
          HostConfig: { NetworkMode: 'owned-network', PortBindings: {} },
          NetworkSettings: { Ports: {} },
          Mounts: [{ Type: 'volume', Name: 'fixture-volume' }],
        }])
      }
      throw new Error(`unexpected ${args}`)
    },
  })
  assert.equal(volume1.volumes.length, 1)
  assert.equal(volume1.volumes[0].name, 'fixture-volume')
  assert.equal(volume1.volumes[0].ownership, 'unresolved')
  assert.equal(volume1.inventoryComplete, false)
  const volume2 = collectOwnedDockerResources({
    dockerBin: 'docker',
    networkName: 'owned-network',
    env: {},
    runId: 'run-1',
    execFile: (_bin, args) => {
      if (args[0] === 'ps') return 'owned-container'
      if (args[0] === 'inspect') {
        return JSON.stringify([{
          Id: 'owned-container',
          Config: { Labels: { 'com.supabase.cli.project': 'probe', [RUN_LABEL]: 'run-1' } },
          HostConfig: { NetworkMode: 'owned-network', PortBindings: {} },
          NetworkSettings: { Ports: {} },
          Mounts: [{ Type: 'volume', Name: 'owned-volume' }],
        }])
      }
      throw new Error(`unexpected ${args}`)
    },
  })
  assert.equal(volume2.volumes[0].ownership, 'owned')
  assert.equal(volume2.inventoryComplete, true)

  const volumeCalls = []
  const foreign = await stoppeOwnedStack({
    dockerBin: 'docker',
    state: {
      network: { name: 'owned-net', created: true },
      containers: [],
      volumes: [{ name: 'foreign-vol', ownership: 'foreign' }],
      inventoryComplete: true,
    },
    execFile: (_bin, args) => {
      volumeCalls.push(args.slice())
      if (args[0] === 'ps') return ''
      if (args[0] === 'volume') throw new Error('foreign volume must not be deleted')
      if (args[0] === 'network' && (args[1] === 'rm' || args[1] === 'inspect')) {
        throw new Error(`No such network: ${args[2]}`)
      }
      return ''
    },
  })
  assert.deepEqual(foreign.foreignRetained, ['foreign-vol'])
  assert.equal(foreign.volumesRemoved, true)
  assert.ok(!volumeCalls.some((args) => args[0] === 'volume'))

  const unresolvedCleanup = await stoppeOwnedStack({
    dockerBin: 'docker',
    state: {
      network: { name: 'owned-net', created: true },
      containers: [],
      volumes: [{ name: 'mystery-vol' }],
      inventoryComplete: true,
    },
    execFile: (_bin, args) => {
      if (args[0] === 'ps') return ''
      if (args[0] === 'volume') throw new Error('unresolved volume must not be deleted blindly')
      if (args[0] === 'network' && (args[1] === 'rm' || args[1] === 'inspect')) {
        throw new Error(`No such network: ${args[2]}`)
      }
      return ''
    },
  })
  assert.equal(unresolvedCleanup.unknown, true)
  assert.equal(unresolvedCleanup.inventoryComplete, false)
  assert.equal(unresolvedCleanup.dockerServicesStopped, false)
  assert.equal(unresolvedCleanup.volumesRemoved, false)

  const alreadyGone = await stoppeOwnedStack({
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: mkdtempSync(join(tmpdir(), 'aaclr1-idemp-')),
    state: {
      network: { name: 'owned-net', created: true },
      containers: [{ id: 'ctr1' }],
      volumes: [{ name: 'vol1', ownership: 'owned' }],
      inventoryComplete: true,
    },
    execFile: (_bin, args) => {
      if (args[0] === 'ps') return ''
      if (args[0] === 'stop' || args[0] === 'rm') throw new Error(`No such container: ${args[1]}`)
      if (args[0] === 'inspect') throw new Error(`No such container: ${args[1]}`)
      if (args[0] === 'volume' && args[1] === 'rm') throw new Error(`No such volume: ${args[3]}`)
      if (args[0] === 'volume' && args[1] === 'inspect') throw new Error(`No such volume: ${args[2]}`)
      if (args[0] === 'network' && (args[1] === 'rm' || args[1] === 'inspect')) {
        throw new Error(`No such network: ${args[2]}`)
      }
      if (args[0] === 'stop' && args.length === 1) return ''
      return ''
    },
  })
  assert.equal(alreadyGone.containerError, undefined)
  assert.equal(alreadyGone.volumeError, undefined)
  assert.equal(alreadyGone.networkError, undefined)
  assert.equal(alreadyGone.containerState, RESOURCE_STATE.ABSENT)
  assert.equal(alreadyGone.volumeState, RESOURCE_STATE.ABSENT)
  assert.equal(alreadyGone.networkState, RESOURCE_STATE.ABSENT)
  assert.equal(alreadyGone.containersRemoved, true)
  assert.equal(alreadyGone.volumesRemoved, true)
  assert.equal(alreadyGone.networkRemoved, true)
  assert.equal(alreadyGone.dockerServicesStopped, true)
  assert.equal(alreadyGone.unknown, false)

  const again = await stoppeOwnedStack({
    dockerBin: 'docker',
    state: {
      network: { name: 'owned-net', created: true },
      containers: [{ id: 'ctr1' }],
      volumes: [{ name: 'vol1', ownership: 'owned' }],
      inventoryComplete: true,
    },
    execFile: (_bin, args) => {
      if (args[0] === 'ps') return ''
      if (args[0] === 'stop' || args[0] === 'rm') throw new Error(`No such container: ${args[1]}`)
      if (args[0] === 'inspect') throw new Error(`No such container: ${args[1]}`)
      if (args[0] === 'volume' && args[1] === 'rm') throw new Error(`No such volume: ${args[3]}`)
      if (args[0] === 'volume' && args[1] === 'inspect') throw new Error(`No such volume: ${args[2]}`)
      if (args[0] === 'network' && (args[1] === 'rm' || args[1] === 'inspect')) {
        throw new Error(`No such network: ${args[2]}`)
      }
      return ''
    },
  })
  assert.equal(again.dockerServicesStopped, true)
  assert.equal(again.unknown, false)
})

function writeSizedMemberTar(dir, size, memberName = 'supabase') {
  writeFileSync(join(dir, memberName), Buffer.alloc(size, 65))
  const archivePath = join(dir, `${memberName}-${size}.tar.gz`)
  execFileSync('tar', ['-czf', archivePath, memberName], { cwd: dir })
  return {
    archivePath,
    expected: createHash('sha256').update(readFileSync(join(dir, memberName))).digest('hex'),
  }
}

test('F1 hashTarMember streams realistic members; 2MiB ENOBUFS path hashes; oversize/timeout/corrupt fail', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aaclr1-tar-'))
  const control = writeSizedMemberTar(dir, 64 * 1024)
  assert.equal(hashTarMember(control.archivePath, 'supabase'), control.expected)
  const twoMiB = writeSizedMemberTar(dir, 2 * 1024 * 1024)
  assert.equal(hashTarMember(twoMiB.archivePath, 'supabase'), twoMiB.expected)
  assert.throws(
    () => hashTarMember(twoMiB.archivePath, 'supabase', { maxBytes: 1024 }),
    /exceeds maxBytes/,
  )
  const timedOut = Object.assign(new Error('spawn ETIMEDOUT'), { code: 'ETIMEDOUT' })
  assert.throws(
    () => hashTarMember(control.archivePath, 'supabase', {
      execFile: () => { throw timedOut },
    }),
    /timed out/,
  )
  const corrupt = join(dir, 'corrupt.tar.gz')
  writeFileSync(corrupt, 'not-a-tar')
  assert.throws(() => hashTarMember(corrupt, 'supabase'), /tar|gzip|not in gzip|child/)
  rmSync(dir, { recursive: true, force: true })
})

test('F2 baseline .env.example is excluded from snapshots; secrets and symlinks still fail', () => {
  assert.ok(SAFE_SNAPSHOT_DOTENV_EXCLUDES.includes('.env.example'))
  const repo = mkdtempSync(join(tmpdir(), 'aaclr1-snap-'))
  execFileSync('git', ['-c', 'init.defaultBranch=main', 'init'], { cwd: repo })
  execFileSync('git', ['config', 'user.email', 't@aaclr1.invalid'], { cwd: repo })
  execFileSync('git', ['config', 'user.name', 'fixture'], { cwd: repo })
  writeFileSync(join(repo, 'app.js'), 'ok\n')
  writeFileSync(join(repo, '.env.example'), 'NEXT_PUBLIC_EXAMPLE=\n')
  execFileSync('git', ['add', '.'], { cwd: repo })
  execFileSync('git', ['commit', '-m', 'seed'], { cwd: repo })
  const rev = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
  const dest = mkdtempSync(join(tmpdir(), 'aaclr1-snapdest-'))
  const prepared = materialisiereAppCheckout({
    sourceRoot: repo,
    destDir: dest,
    rev,
    migrations: { files: [] },
  })
  assert.equal(existsSync(join(dest, 'app.js')), true)
  assert.equal(existsSync(join(dest, '.env.example')), false)
  assert.equal(prepared.inheritedEnv, false)
  assert.ok(prepared.snapshotExcludes.includes('.env.example'))
  writeFileSync(join(dest, '.env.development.local'), 'SECRET=1')
  assert.throws(() => refuseSymlinksAndDotenv(dest), /\.env/)
  rmSync(join(dest, '.env.development.local'))
  symlinkSync('/tmp/aaclr1-foreign-target', join(dest, 'escape-link'))
  assert.throws(() => refuseSymlinksAndDotenv(dest), /Symlink/)
  rmSync(join(dest, 'escape-link'))
  const baselineDest = mkdtempSync(join(tmpdir(), 'aaclr1-base-'))
  const baseline = materialisiereAppCheckout({
    sourceRoot: ROOT,
    destDir: baselineDest,
    rev: PRODUCT_BASELINE,
  })
  assert.equal(existsSync(join(baselineDest, '.env.example')), false)
  assert.equal(existsSync(join(baselineDest, 'package.json')), true)
  assert.ok(baseline.snapshotExcludes.includes('.env.example'))
  assert.equal(baseline.inheritedEnv, false)
  assert.equal(baseline.macosExtractUnverified, true)
  rmSync(repo, { recursive: true, force: true })
  rmSync(dest, { recursive: true, force: true })
  rmSync(baselineDest, { recursive: true, force: true })
})

test('F3 one registry records Context before policy failure; pending/foreign/timeout stay unknown', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-breg-'))
  const registry = createOwnershipRegistry({ privateHome: home, evidenceDir: home })
  assert.equal(registry.browsers, registry.browserRegistry)
  let closeCount = 0
  const failing = {
    route: async () => { throw new Error('synthetic route registration failure') },
    close: async () => { closeCount += 1 },
    on() {},
  }
  await assert.rejects(
    () => newBrowserSession({
      viewport: { width: 800, height: 600 },
      privateHome: home,
      launchPersistentContext: async () => failing,
      registry: registry.browsers,
    }),
    /synthetic route registration failure/,
  )
  const failedHandle = [...registry.browsers.values()][0]
  assert.equal(failedHandle.context, failing)
  assert.equal(failedHandle.acquired, true)
  assert.equal(failedHandle.launchPending, false)
  const afterPolicyFail = await raeumeOwnedAuf({ privateHome: home, registry })
  assert.equal(closeCount, 1)
  assert.ok(afterPolicyFail.reports.some((item) => item.kind === 'browser-context' && item.closeCalled === true))

  const pendingHome = mkdtempSync(join(tmpdir(), 'aaclr1-bpend-'))
  const pendingReg = createOwnershipRegistry({ privateHome: pendingHome, evidenceDir: pendingHome })
  await assert.rejects(
    () => newBrowserSession({
      viewport: { width: 800, height: 600 },
      privateHome: pendingHome,
      launchPersistentContext: async () => { throw new Error('launch failed') },
      registry: pendingReg.browsers,
    }),
    /launch failed/,
  )
  const pendingHandle = [...pendingReg.browsers.values()][0]
  assert.equal(pendingHandle.context, null)
  assert.equal(pendingHandle.launchPending, true)
  const pendingClose = await closeOwnedBrowserHandle(pendingHandle)
  assert.equal(pendingClose.closed, false)
  assert.equal(pendingClose.profileRemoved, false)
  assert.equal(pendingClose.unknown, true)
  const pendingCleanup = await raeumeOwnedAuf({ privateHome: pendingHome, registry: pendingReg })
  assert.equal(pendingCleanup.unknown, true)
  assert.equal(bewerteCleanup(pendingCleanup, { registry: pendingReg }), false)
  assert.equal(existsSync(pendingHome), true)

  const eventHome = mkdtempSync(join(tmpdir(), 'aaclr1-bevt-'))
  const eventReg = createOwnershipRegistry({ privateHome: eventHome, evidenceDir: eventHome })
  const listeners = []
  const live = {
    route: async () => {},
    on(event, fn) { if (event === 'request') listeners.push(fn) },
    close: async () => {},
  }
  const session = await newBrowserSession({
    viewport: { width: 800, height: 600 },
    privateHome: eventHome,
    launchPersistentContext: async () => live,
    registry: eventReg.browsers,
  })
  assert.equal(eventReg.browsers, eventReg.browserRegistry)
  assert.doesNotThrow(() => listeners.forEach((fn) => fn({ url: () => 'https://blocked.invalid/test' })))
  const violated = eventReg.browsers.get(session.__runtimeSessionId)
  assert.match(violated.trafficViolation, /not local-only/)
  assert.equal(violated.unknown, true)
  const eventCleanup = await raeumeOwnedAuf({ privateHome: eventHome, registry: eventReg })
  assert.equal(eventCleanup.unknown, true)
  assert.equal(bewerteCleanup(eventCleanup, { registry: eventReg }), false)

  const okHome = mkdtempSync(join(tmpdir(), 'aaclr1-bok-'))
  const okReg = createOwnershipRegistry({ privateHome: okHome, evidenceDir: okHome })
  let okClosed = 0
  const okCtx = {
    route: async () => {},
    on() {},
    close: async () => { okClosed += 1 },
  }
  const okSession = await newBrowserSession({
    viewport: { width: 800, height: 600 },
    privateHome: okHome,
    launchPersistentContext: async () => okCtx,
    registry: okReg.browsers,
  })
  await closeBrowserSession(okSession, { registry: okReg.browsers })
  assert.equal(okClosed, 1)
  assert.equal(okReg.browsers.size, 0)
  const timeoutHome = mkdtempSync(join(tmpdir(), 'aaclr1-bto-'))
  const timeoutReg = createOwnershipRegistry({ privateHome: timeoutHome, evidenceDir: timeoutHome })
  const hanging = {
    route: async () => {},
    on() {},
    close: () => new Promise(() => {}),
  }
  const hangingSession = await newBrowserSession({
    viewport: { width: 800, height: 600 },
    privateHome: timeoutHome,
    launchPersistentContext: async () => hanging,
    registry: timeoutReg.browsers,
  })
  await assert.rejects(
    () => closeBrowserSession(hangingSession, { registry: timeoutReg.browsers, closeTimeoutMs: 20 }),
    /browser close|UNKNOWN|not proved/,
  )
  assert.equal(timeoutReg.browsers.has(hangingSession.__runtimeSessionId), true)
  const timeoutCleanup = await raeumeOwnedAuf({ privateHome: timeoutHome, registry: timeoutReg, closeTimeoutMs: 20 })
  assert.equal(timeoutCleanup.unknown, true)
  assert.equal(bewerteCleanup(timeoutCleanup, { registry: timeoutReg }), false)
  rmSync(home, { recursive: true, force: true })
  rmSync(pendingHome, { recursive: true, force: true })
  rmSync(eventHome, { recursive: true, force: true })
  rmSync(okHome, { recursive: true, force: true })
  rmSync(timeoutHome, { recursive: true, force: true })
})

function writeExactConsumerArtifacts(dir, runId, { gates = {}, desktop = 'desktop-placeholder', mobile = 'mobile-placeholder' } = {}) {
  const names = consumerArtifactNames(runId)
  writeFileSync(join(dir, names[0]), desktop)
  writeFileSync(join(dir, names[1]), mobile)
  writeFileSync(join(dir, names[2]), `${JSON.stringify(gates)}\n`)
  return names
}

test('C1 exact consumer artifacts survive cleanup; wrong-run/missing/secret fail; no-start needs none', async () => {
  const runId = 'aaclr1-20260923T172002Z'
  const identity = createRunIdentity({ runId, projectId: 'aaclr1-aaclr1-20260923T172002Z'.slice(0, 40) })
  assert.deepEqual(consumerArtifactNames(runId), [
    `${runId}-counts-desktop.png`,
    `${runId}-counts-mobile.png`,
    `${runId}-browser-flows-gates.json`,
  ])
  assert.deepEqual(expectedConsumerArtifacts({ mode: 'preflight', runId }), [])
  assert.deepEqual(expectedConsumerArtifacts({ mode: 'runtime-only', runId }), [])
  assert.equal(expectedConsumerArtifacts({ mode: 'full', consumerCompleted: true, runId }).length, 3)

  const home = mkdtempSync(join(tmpdir(), 'aaclr1-e1-'))
  const privateEv = mkdtempSync(join(home, 'evidence-'))
  const durable = mkdtempSync(join(tmpdir(), 'aaclr1-e1d-'))
  writeExactConsumerArtifacts(privateEv, runId)
  writeFileSync(join(privateEv, 'aaclr1-another-run-consumer-receipt.json'), '{"ok":true}\n')
  writeFileSync(join(privateEv, 'session.har'), '{"pages":[]}')
  mkdirSync(join(privateEv, 'profile'))
  writeFileSync(join(privateEv, 'profile/Cookies'), 'token')
  const registry = createOwnershipRegistry({ runId, privateHome: home, evidenceDir: privateEv })
  const cleanup = await raeumeOwnedAuf({
    privateHome: home,
    registry,
    evidenceDir: privateEv,
    browserRegistry: registry.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: privateEv,
      destDir: durable,
      runId,
      runIdentity: identity,
      ownedRoots: [home],
      mode: 'full',
      consumerCompleted: true,
    }),
  })
  assert.equal(existsSync(join(durable, `${runId}-counts-desktop.png`)), true)
  assert.equal(existsSync(join(durable, `${runId}-counts-mobile.png`)), true)
  assert.equal(existsSync(join(durable, `${runId}-browser-flows-gates.json`)), true)
  assert.equal(existsSync(join(durable, 'aaclr1-another-run-consumer-receipt.json')), false)
  assert.equal(existsSync(join(durable, 'session.har')), false)
  assert.equal(existsSync(join(durable, 'profile')), false)
  assert.equal(cleanup.exportFailed, false)
  assert.equal(cleanup.artifactExport.ok, true)
  assert.equal(cleanup.artifactExport.exported.length, 3)
  assert.ok(cleanup.artifactExport.skipped.some((item) => item.name.includes('another-run') && item.reason === 'wrong-run'))
  assert.equal(existsSync(home), false)

  const missHome = mkdtempSync(join(tmpdir(), 'aaclr1-e1m-'))
  const missPrivate = mkdtempSync(join(missHome, 'evidence-'))
  const missDurable = mkdtempSync(join(tmpdir(), 'aaclr1-e1md-'))
  writeFileSync(join(missPrivate, `${runId}-counts-desktop.png`), 'only-one')
  const missReg = createOwnershipRegistry({ runId, privateHome: missHome, evidenceDir: missPrivate })
  const missing = await raeumeOwnedAuf({
    privateHome: missHome,
    registry: missReg,
    evidenceDir: missPrivate,
    browserRegistry: missReg.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: missPrivate,
      destDir: missDurable,
      runId,
      runIdentity: identity,
      ownedRoots: [missHome],
      mode: 'full',
      consumerCompleted: true,
    }),
  })
  assert.equal(missing.exportFailed, true)
  assert.equal(bewerteCleanup(missing, { registry: missReg }), false)
  assert.equal(existsSync(missHome), true)

  const failHome = mkdtempSync(join(tmpdir(), 'aaclr1-evfail-'))
  const failPrivate = mkdtempSync(join(failHome, 'evidence-'))
  const failDurable = mkdtempSync(join(tmpdir(), 'aaclr1-evfaild-'))
  writeExactConsumerArtifacts(failPrivate, 'aaclr1-run2', { gates: { password: 'synthetic' } })
  const failReg = createOwnershipRegistry({ privateHome: failHome, evidenceDir: failPrivate })
  const failed = await raeumeOwnedAuf({
    privateHome: failHome,
    registry: failReg,
    evidenceDir: failPrivate,
    browserRegistry: failReg.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: failPrivate,
      destDir: failDurable,
      runId: 'aaclr1-run2',
      ownedRoots: [failHome],
      mode: 'full',
      consumerCompleted: true,
    }),
  })
  assert.equal(failed.exportFailed, true)
  assert.equal(failed.unknown, true)
  assert.equal(bewerteCleanup(failed, { registry: failReg }), false)
  assert.equal(existsSync(failHome), true)
  assert.equal(existsSync(join(failDurable, 'aaclr1-run2-browser-flows-gates.json')), false)

  const overwrite = mkdtempSync(join(tmpdir(), 'aaclr1-e7-'))
  const overwriteSrc = mkdtempSync(join(overwrite, 'evidence-'))
  const overwriteDest = mkdtempSync(join(tmpdir(), 'aaclr1-e7d-'))
  writeExactConsumerArtifacts(overwriteSrc, runId)
  writeFileSync(join(overwriteDest, `${runId}-counts-desktop.png`), 'original-bytes')
  assert.throws(
    () => exportSanitizedRunArtifacts({
      sourceDir: overwriteSrc,
      destDir: overwriteDest,
      runId,
      ownedRoots: [overwrite],
      mode: 'full',
      consumerCompleted: true,
    }),
    /overwrite/,
  )
  assert.equal(readFileSync(join(overwriteDest, `${runId}-counts-desktop.png`), 'utf8'), 'original-bytes')

  const noStartHome = mkdtempSync(join(tmpdir(), 'aaclr1-ns-'))
  const noStartPrivate = mkdtempSync(join(noStartHome, 'evidence-'))
  const noStartDurable = mkdtempSync(join(tmpdir(), 'aaclr1-nsd-'))
  const noStartReg = createOwnershipRegistry({ runId, privateHome: noStartHome, evidenceDir: noStartPrivate })
  const noStart = await raeumeOwnedAuf({
    privateHome: noStartHome,
    registry: noStartReg,
    evidenceDir: noStartPrivate,
    browserRegistry: noStartReg.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: noStartPrivate,
      destDir: noStartDurable,
      runId,
      ownedRoots: [noStartHome],
      mode: 'preflight',
    }),
  })
  assert.equal(noStart.exportFailed, false)
  assert.equal(noStart.artifactExport.exported.length, 0)
  assert.equal(existsSync(noStartHome), false)

  persistFailureReceipt({
    evidenceDir: failDurable,
    runId: 'aaclr1-run2',
    error: new Error('export failed'),
    cleanup: failed,
    matrix: {},
  })
  rmSync(failHome, { recursive: true, force: true })
  persistFailureReceipt({
    evidenceDir: failDurable,
    runId: 'aaclr1-run2b',
    error: new Error('after G20'),
    cleanup: failed,
    matrix: {},
  })
  assert.equal(existsSync(failHome), false)
  rmSync(durable, { recursive: true, force: true })
  rmSync(failDurable, { recursive: true, force: true })
  rmSync(missHome, { recursive: true, force: true })
  rmSync(missDurable, { recursive: true, force: true })
  rmSync(overwrite, { recursive: true, force: true })
  rmSync(overwriteSrc, { recursive: true, force: true })
  rmSync(overwriteDest, { recursive: true, force: true })
})

function writeTestCliPins(dir) {
  const owned = writeOwnedTar(dir, { contents: 'test-cli-member\n' })
  const archiveName = 'supabase_2.117.0_linux_amd64.tar.gz'
  const archivePath = join(dir, archiveName)
  writeFileSync(archivePath, owned.bytes)
  const checksumsText = `${owned.sha256}  ${archiveName}\n`
  const checksumsPath = join(dir, 'checksums.txt')
  writeFileSync(checksumsPath, checksumsText)
  const checksumsSha = createHash('sha256').update(checksumsText).digest('hex')
  const pin = { name: archiveName, apiDigest: `sha256:${owned.sha256}` }
  return {
    archivePath,
    checksumsPath,
    pins: {
      version: CLI.version,
      checksumsApiDigest: `sha256:${checksumsSha}`,
      archives: {
        'linux-x64': pin,
        'linux-arm64': pin,
        'darwin-arm64': pin,
        'darwin-x64': pin,
      },
    },
  }
}

function controlledRuntimeExecFile(invoked) {
  return (bin, args, options) => {
    invoked.push({ bin: String(bin), args: [...(args || [])] })
    const name = String(bin)
    if (name.endsWith('git') || name === 'git') return execGit(args)
    if (name === 'tar' || name.endsWith('/tar')) return execFileSync('tar', args, options)
    if (name.includes('docker')) {
      if (args[0] === '--version') return 'Docker version 24.0.0'
      if (args[0] === 'info') return 'Server Version: 24.0.0\n'
      if (args[0] === 'context') return 'default'
      throw new Error(`unexpected docker ${args}`)
    }
    if (args?.[0] === '--version') return '2.117.0\n'
    if (args?.[0] === '--help') return 'supabase start\nsupabase stop\nsupabase status\n'
    if (args?.[0] === 'start' && args?.[1] === '--help') {
      return 'Start containers for Supabase local development\n'
    }
    throw new Error(`must not invoke ${name} ${args}`)
  }
}

test('C2 explicit modes invoke verified archive/member/version/help; default stays no-start', async () => {
  assert.equal(parseMode([]), 'preflight')
  assert.equal(parseMode(['--runtime-only']), 'runtime-only')
  assert.equal(parseMode(['--full']), 'full')
  assert.equal(shouldInvokeOfficialCli('preflight'), false)
  assert.equal(shouldInvokeOfficialCli('runtime-only'), true)
  assert.equal(shouldInvokeOfficialCli('full'), true)

  const workspace = mkdtempSync(join(tmpdir(), 'aaclr1-c2-'))
  const pins = writeTestCliPins(workspace)
  const setupBoundary = {
    G2_owned_stack: { result: 'NOT RUN', notes: 'C2 setup-boundary control; stack not started' },
    G3_auth_schema_not_bootstrap: { result: 'NOT RUN', notes: 'C2 setup-boundary control' },
    G4_fixtures_via_gotrue: { result: 'NOT RUN', notes: 'C2 setup-boundary control' },
    G5_app_boot_loopback: { result: 'NOT RUN', notes: 'C2 setup-boundary control' },
  }

  const defaultInvoked = []
  let defaultStart = false
  const defaultResult = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
    argv: ['--cli-archive', pins.archivePath, '--cli-checksums', pins.checksumsPath],
    evidenceDir: join(workspace, 'default-evidence'),
    execFile: controlledRuntimeExecFile(defaultInvoked),
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    cliPins: pins.pins,
    startRuntime: async () => {
      defaultStart = true
      throw new Error('default no-start must not reach startRuntime')
    },
  })
  assert.equal(defaultResult.mode, 'preflight')
  assert.equal(defaultResult.invokeBinary, false)
  assert.equal(defaultResult.cli.archiveBound, true)
  assert.equal(defaultResult.cli.identityVerified, false)
  assert.equal(defaultStart, false)
  assert.ok(!defaultInvoked.some((item) => item.args?.[0] === '--version' && !String(item.bin).includes('docker')))
  assert.equal(defaultResult.summary.fullLocalExecution, false)

  const missingInvoked = []
  let missingStart = false
  const missing = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
    argv: ['--runtime-only'],
    evidenceDir: join(workspace, 'missing-evidence'),
    execFile: controlledRuntimeExecFile(missingInvoked),
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    startRuntime: async () => {
      missingStart = true
      throw new Error('missing archive must not reach startRuntime')
    },
  })
  assert.equal(missing.invokeBinary, true)
  assert.equal(missing.cli.identityVerified, false)
  assert.equal(missingStart, false)
  assert.ok(!missingInvoked.some((item) => item.args?.[0] === '--version' && !String(item.bin).includes('docker')))

  const runtimeInvoked = []
  let runtimeStart = false
  const runtimeOnly = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
    argv: ['--runtime-only', '--cli-archive', pins.archivePath, '--cli-checksums', pins.checksumsPath],
    evidenceDir: join(workspace, 'runtime-evidence'),
    execFile: controlledRuntimeExecFile(runtimeInvoked),
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    cliPins: pins.pins,
    startRuntime: async ({ cli, owned }) => {
      runtimeStart = true
      assert.equal(cli.identityVerified, true)
      assert.equal(cli.archiveBound, true)
      assert.equal(cli.helpVerified, true)
      assert.equal(cli.startHelpVerified, true)
      assert.ok(owned.runIdentity.runId)
      assert.equal(owned.runIdentity.runId, owned.runId)
      return { owned, gates: setupBoundary }
    },
  })
  assert.equal(runtimeOnly.mode, 'runtime-only')
  assert.equal(runtimeOnly.invokeBinary, true)
  assert.equal(runtimeOnly.cli.identityVerified, true)
  assert.equal(runtimeStart, true)
  assert.ok(runtimeInvoked.some((item) => item.args?.[0] === '--version' && !String(item.bin).includes('docker')))
  assert.ok(runtimeInvoked.some((item) => item.args?.[0] === '--help'))
  assert.ok(runtimeInvoked.some((item) => item.args?.[0] === 'start' && item.args?.[1] === '--help'))
  assert.notEqual(runtimeOnly.verdict, 'LOCAL_FULL_STACK_PASS')
  assert.equal(runtimeOnly.summary.fullLocalExecution, false)

  const fullInvoked = []
  let fullStart = false
  const fullMissingConsumer = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
    argv: ['--full', '--cli-archive', pins.archivePath, '--cli-checksums', pins.checksumsPath],
    evidenceDir: join(workspace, 'full-evidence'),
    execFile: controlledRuntimeExecFile(fullInvoked),
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    cliPins: pins.pins,
    importer: async () => ({ notTheConsumer: true }),
    startRuntime: async ({ cli }) => {
      fullStart = true
      assert.equal(cli.identityVerified, true)
      return { owned: {}, gates: setupBoundary, context: { runId: 'x' } }
    },
  })
  assert.equal(fullStart, true)
  assert.equal(fullMissingConsumer.mode, 'full')
  assert.equal(fullMissingConsumer.browserPresent, false)
  assert.equal(fullMissingConsumer.verdict, 'NOT_IMPLEMENTED')
  assert.equal(fullMissingConsumer.summary.fullLocalExecution, false)

  rmSync(workspace, { recursive: true, force: true })
})
