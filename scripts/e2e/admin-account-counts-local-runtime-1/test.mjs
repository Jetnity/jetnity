#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { crc32, deflateSync } from 'node:zlib'
import { createServer, request as httpRequest } from 'node:http'
import { once } from 'node:events'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { BLOB_PINS, PINS, SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { darfOwnedVerzeichnisEntfernen, stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import {
  CONTRACT_VERSION,
  EXTRA_BLOB_PINS,
  HISTORICAL_REFUSED_PRODUCER_SHA256,
  PRODUCT_BASELINE,
  CLI,
  CLI_PROJECT_LABEL,
  RUN_LABEL,
  ROOT,
} from './constants.mjs'
import {
  assertIsolatedConnectionEnvironment,
  baueDockerCliUmgebung,
  baueRuntimeAppUmgebung,
  baueRuntimePreflightUmgebung,
  klassifiziereRuntimeUmgebung,
} from './env.mjs'
import { pruefeDockerFaehigkeit } from './docker-capability.mjs'
import {
  istLokalerUnixDockerHost,
  sanitizeDockerHost,
  verifiziereLokalenUnixDockerEndpunkt,
  waehleLokalenUnixDockerEndpunkt,
} from './docker-endpoint.mjs'
import {
  assertCliHelpText,
  assertCliVersionText,
  hasOfficialCliEffectFlagsOnlyRootUsageIdentity,
  hasOfficialCliEffectRootUsageIdentity,
  hasOfficialCliEffectSubcommandRootUsageIdentity,
  isOfficialCliCobraRootHelp,
  isOfficialCliEffectRootHelp,
  isOfficialCliRootHelp,
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
import { createOwnershipRegistry, recordDockerResources, registerHandle } from './ownership.mjs'
import { newBrowserSession, closeBrowserSession, assertLocalBrowserTraffic, closeOwnedBrowserHandle } from './browser-session.mjs'
import { resolveUpstreamTarget, isRemoteRedirect, readBoundedBody } from './observer.mjs'
import { assertInstalledCatalog, assertInstalledRelation, installProducerAndWrapper, parseJsonRow, acceptedCatalogFixture, requiredCount, extractExactDollarBody, EXPECTED_PRODUCER_RESULT } from './schema.mjs'
import { starteOwnedStack, stoppeOwnedStack, inspectDockerResource, classifyDockerInspectError, collectOwnedDockerResources, classifyVolumeOwnership, classifyContainerOwnership, RESOURCE_STATE } from './stack.mjs'
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
  createControlledConsumerReceipt,
  createProducerShapedConsumerReceipt,
  assertConsumerGatesJson,
  assertValidPng,
  MINIMAL_PNG,
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

test('post-start observation prefers resolved NetworkSettings.Ports over empty HostConfig', () => {
  const mailpitResolved = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': [{ HostIp: '127.0.0.1', HostPort: '54324' }] } },
  })
  assert.equal(mailpitResolved.length, 1)
  assert.equal(mailpitResolved[0].containerPort, '8025/tcp')
  assert.equal(mailpitResolved[0].HostIp, '127.0.0.1')
  assert.equal(mailpitResolved[0].HostPort, '54324')
  assert.equal(assertLoopbackBindings(mailpitResolved), true)

  const publicRuntime = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': [{ HostIp: '0.0.0.0', HostPort: '54324' }] } },
  })
  assert.equal(publicRuntime[0].HostIp, '0.0.0.0')
  assert.throws(() => assertLoopbackBindings(publicRuntime), /Public or unspecified/)

  const emptyRuntime = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '127.0.0.1', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
  })
  assert.equal(emptyRuntime[0].HostIp, '')
  assert.throws(() => assertLoopbackBindings(emptyRuntime), /Public or unspecified/)

  const fallback = parseDockerPortBindings({
    HostConfig: { PortBindings: { '54321/tcp': [{ HostIp: '127.0.0.1', HostPort: '54321' }] } },
    NetworkSettings: { Networks: { owned: {} } },
  })
  assert.equal(fallback[0].HostIp, '127.0.0.1')
  assert.equal(assertLoopbackBindings(fallback), true)

  const emptyFallback = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
  })
  assert.throws(() => assertLoopbackBindings(emptyFallback), /Public or unspecified/)
  const publicFallback = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '0.0.0.0', HostPort: '54324' }] } },
  })
  assert.throws(() => assertLoopbackBindings(publicFallback), /Public or unspecified/)
  assert.throws(
    () => assertLoopbackBindings(parseDockerPortBindings({
      HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '::', HostPort: '54324' }] } },
    })),
    /Public or unspecified/,
  )
  assert.throws(
    () => assertLoopbackBindings(parseDockerPortBindings({
      HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: 'localhost', HostPort: '54324' }] } },
    })),
    /Non-numeric loopback/,
  )

  const emptyPresentRuntime = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '127.0.0.1', HostPort: '54324' }] } },
    NetworkSettings: { Ports: {} },
  })
  assert.equal(emptyPresentRuntime[0].containerPort, '8025/tcp')
  assert.equal(emptyPresentRuntime[0].HostIp, '')
  assert.throws(() => assertLoopbackBindings(emptyPresentRuntime), /Public or unspecified/)

  const multiOk = parseDockerPortBindings({
    HostConfig: {
      PortBindings: {
        '54321/tcp': [{ HostIp: '', HostPort: '54321' }],
        '8025/tcp': [{ HostIp: '', HostPort: '54324' }],
      },
    },
    NetworkSettings: {
      Ports: {
        '54321/tcp': [{ HostIp: '127.0.0.1', HostPort: '54321' }],
        '8025/tcp': [{ HostIp: '127.0.0.1', HostPort: '54324' }],
      },
    },
  })
  assert.equal(multiOk.length, 2)
  assert.equal(assertLoopbackBindings(multiOk), true)

  const multiPublic = parseDockerPortBindings({
    HostConfig: {
      PortBindings: {
        '54321/tcp': [{ HostIp: '', HostPort: '54321' }],
        '8025/tcp': [{ HostIp: '', HostPort: '54324' }],
      },
    },
    NetworkSettings: {
      Ports: {
        '54321/tcp': [{ HostIp: '127.0.0.1', HostPort: '54321' }],
        '8025/tcp': [{ HostIp: '0.0.0.0', HostPort: '54324' }],
      },
    },
  })
  assert.throws(() => assertLoopbackBindings(multiPublic), /Public or unspecified/)
})

test('authoritative runtime mappings fail closed when a configured published port is missing or malformed', () => {
  const safePlusMissing = parseDockerPortBindings({
    HostConfig: {
      PortBindings: {
        '54321/tcp': [{ HostIp: '', HostPort: '54321' }],
        '8025/tcp': [{ HostIp: '', HostPort: '54324' }],
      },
    },
    NetworkSettings: {
      Ports: {
        '54321/tcp': [{ HostIp: '127.0.0.1', HostPort: '54321' }],
      },
    },
  })
  assert.ok(safePlusMissing.some((item) => item.containerPort === '54321/tcp' && item.HostIp === '127.0.0.1'))
  assert.ok(safePlusMissing.some((item) => item.containerPort === '8025/tcp' && item.HostIp === ''))
  assert.throws(() => assertLoopbackBindings(safePlusMissing), /Public or unspecified/)

  const configuredNull = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': null } },
  })
  assert.equal(configuredNull[0].containerPort, '8025/tcp')
  assert.equal(configuredNull[0].HostIp, '')
  assert.throws(() => assertLoopbackBindings(configuredNull), /Public or unspecified/)

  const configuredEmpty = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': [] } },
  })
  assert.throws(() => assertLoopbackBindings(configuredEmpty), /Public or unspecified/)

  const configuredMalformed = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': { HostIp: '127.0.0.1', HostPort: '54324' } } },
  })
  assert.throws(() => assertLoopbackBindings(configuredMalformed), /Public or unspecified/)

  const missingHostPort = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': [{ HostIp: '127.0.0.1' }] } },
  })
  assert.throws(() => assertLoopbackBindings(missingHostPort), /Public or unspecified/)

  const unconfiguredInternalNull = parseDockerPortBindings({
    HostConfig: { PortBindings: { '54321/tcp': [{ HostIp: '', HostPort: '54321' }] } },
    NetworkSettings: {
      Ports: {
        '54321/tcp': [{ HostIp: '127.0.0.1', HostPort: '54321' }],
        '5432/tcp': null,
      },
    },
  })
  assert.equal(unconfiguredInternalNull.length, 1)
  assert.equal(unconfiguredInternalNull[0].containerPort, '54321/tcp')
  assert.equal(unconfiguredInternalNull[0].HostIp, '127.0.0.1')
  assert.equal(assertLoopbackBindings(unconfiguredInternalNull), true)

  const mailpitResolved = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': [{ HostIp: '127.0.0.1', HostPort: '54324' }] } },
  })
  assert.equal(mailpitResolved[0].HostIp, '127.0.0.1')
  assert.equal(assertLoopbackBindings(mailpitResolved), true)

  const publicRuntime = parseDockerPortBindings({
    HostConfig: { PortBindings: { '8025/tcp': [{ HostIp: '', HostPort: '54324' }] } },
    NetworkSettings: { Ports: { '8025/tcp': [{ HostIp: '0.0.0.0', HostPort: '54324' }] } },
  })
  assert.equal(publicRuntime[0].HostIp, '0.0.0.0')
  assert.throws(() => assertLoopbackBindings(publicRuntime), /Public or unspecified/)
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

test('official v2.117 Cobra root --help is recognized; fragments and start-help fail closed', async () => {
  const official = officialCobraRootHelp()
  const historicalCompatible = historicalRootHelp()
  const startHelp = [
    'Start containers for Supabase local development',
    '',
    'Usage:',
    '  supabase start [flags]',
    '',
  ].join('\n')
  const missingStop = official.replace(/^[ \t]*stop[ \t]+Stop all local Supabase containers.*$/m, '')
  const wrappedOfficial = official.replace(
    'Start containers for Supabase local development',
    'Start containers for Supabase\n                    local development',
  )

  assert.equal(isOfficialCliRootHelp(official), true)
  assert.equal(assertCliHelpText(official, { kind: 'help' }), true)
  assert.equal(isOfficialCliRootHelp(wrappedOfficial), true)
  assert.equal(assertCliHelpText(historicalCompatible, { kind: 'help' }), true)
  assert.equal(isOfficialCliRootHelp(missingStop), false)
  assert.throws(() => assertCliHelpText(missingStop, { kind: 'help' }), /root-help structure/)
  assert.equal(isOfficialCliRootHelp(startHelp), false)
  assert.throws(() => assertCliHelpText(startHelp, { kind: 'help' }), /root-help structure/)
  assert.equal(assertCliHelpText(startHelp, { kind: 'start' }), true)
  assert.throws(
    () => assertCliHelpText('Please run supabase start before continuing.', { kind: 'help' }),
    /root-help structure/,
  )
  assert.throws(
    () => assertCliHelpText('Start containers for Supabase local development', { kind: 'help' }),
    /root-help structure/,
  )
  assert.throws(() => assertCliHelpText('unrelated binary', { kind: 'help' }), /root-help structure/)

  const workspace = mkdtempSync(join(tmpdir(), 'aaclr1-root-help-'))
  const pins = writeTestCliPins(workspace)
  const composed = prepareOfficialCliIdentity({
    toolingDir: join(workspace, 'tooling'),
    env: { PATH: '/usr/bin', LANG: 'C', TZ: 'UTC' },
    archivePath: pins.archivePath,
    checksumsPath: pins.checksumsPath,
    platformId: 'linux-x64',
    invokeBinary: true,
    pins: pins.pins,
    execFile: (bin, args, options) => {
      if (String(bin) === 'tar' || String(bin).endsWith('/tar')) return execFileSync('tar', args, options)
      if (args?.[0] === '--version') return '2.117.0\n'
      if (args?.[0] === '--help') return official
      if (args?.[0] === 'start' && args?.[1] === '--help') return startHelp
      throw new Error(`unexpected ${bin} ${args}`)
    },
  })
  assert.equal(composed.archiveBound, true)
  assert.equal(composed.versionVerified, true)
  assert.equal(composed.helpVerified, true)
  assert.equal(composed.startHelpVerified, true)
  assert.equal(composed.identityVerified, true)
  assert.deepEqual(composed.failedIdentityChecks, [])

  const helpOnlyStart = prepareOfficialCliIdentity({
    toolingDir: join(workspace, 'tooling-start-help'),
    env: { PATH: '/usr/bin', LANG: 'C', TZ: 'UTC' },
    archivePath: pins.archivePath,
    checksumsPath: pins.checksumsPath,
    platformId: 'linux-x64',
    invokeBinary: true,
    pins: pins.pins,
    execFile: (bin, args, options) => {
      if (String(bin) === 'tar' || String(bin).endsWith('/tar')) return execFileSync('tar', args, options)
      if (args?.[0] === '--version') return '2.117.0\n'
      if (args?.[0] === '--help') return startHelp
      if (args?.[0] === 'start' && args?.[1] === '--help') return startHelp
      throw new Error(`unexpected ${bin} ${args}`)
    },
  })
  assert.equal(helpOnlyStart.archiveBound, true)
  assert.equal(helpOnlyStart.versionVerified, true)
  assert.equal(helpOnlyStart.helpVerified, false)
  assert.equal(helpOnlyStart.startHelpVerified, true)
  assert.equal(helpOnlyStart.identityVerified, false)
  assert.deepEqual(helpOnlyStart.failedIdentityChecks, ['help'])
  rmSync(workspace, { recursive: true, force: true })
})

test('official v2.117 Effect root --help is recognized; mixed and start-help fail closed', async () => {
  const exactMac = officialEffectRootHelpExact()
  const headed = officialEffectRootHelpHeaded()
  const flagsOnly = officialEffectRootHelpFlagsOnlyCompatibility()
  const cobra = officialCobraRootHelp()
  const historical = historicalRootHelp()
  const startHelp = [
    'Start containers for Supabase local development',
    '',
    'Usage:',
    '  supabase start [flags]',
    '',
  ].join('\n')
  const effectStartHelp = [
    'supabase start [flags]',
    'Start containers for Supabase local development',
    '',
  ].join('\n')
  const missingStop = exactMac.replace(/^[ \t]*stop[ \t]+Stop all local Supabase containers.*$/m, '')
  const flagsOnlyMissingStop = flagsOnly.replace(/^[ \t]*stop[ \t]+Stop all local Supabase containers.*$/m, '')
  const mixedPrimaryUsageCobraStart = [
    'supabase <subcommand> [flags]',
    'start  Start containers for Supabase local development',
    'status Show status of local Supabase containers',
    'stop   Stop all local Supabase containers',
  ].join('\n')
  const mixedFlagsOnlyUsageCobraStart = [
    'supabase [flags]',
    'start  Start containers for Supabase local development',
    'status Show status of local Supabase containers',
    'stop   Stop all local Supabase containers',
  ].join('\n')

  assert.equal(hasOfficialCliEffectSubcommandRootUsageIdentity(exactMac), true)
  assert.equal(hasOfficialCliEffectRootUsageIdentity(exactMac), true)
  assert.equal(hasOfficialCliEffectFlagsOnlyRootUsageIdentity(exactMac), false)
  assert.equal(hasOfficialCliEffectSubcommandRootUsageIdentity(headed), true)
  assert.equal(hasOfficialCliEffectFlagsOnlyRootUsageIdentity(flagsOnly), true)
  assert.equal(hasOfficialCliEffectSubcommandRootUsageIdentity(flagsOnly), false)
  assert.equal(hasOfficialCliEffectRootUsageIdentity(flagsOnly), false)
  assert.equal(isOfficialCliEffectRootHelp(exactMac), true)
  assert.equal(isOfficialCliCobraRootHelp(exactMac), false)
  assert.equal(isOfficialCliRootHelp(exactMac), true)
  assert.equal(assertCliHelpText(exactMac, { kind: 'help' }), true)
  assert.equal(isOfficialCliEffectRootHelp(headed), true)
  assert.equal(isOfficialCliRootHelp(headed), true)
  assert.equal(isOfficialCliEffectRootHelp(flagsOnly), true)
  assert.equal(isOfficialCliCobraRootHelp(flagsOnly), false)
  assert.equal(isOfficialCliRootHelp(flagsOnly), true)
  assert.equal(isOfficialCliEffectRootHelp('supabase <subcommand> [flags]'), false)
  assert.equal(isOfficialCliEffectRootHelp('supabase [flags]'), false)
  assert.equal(isOfficialCliEffectRootHelp(cobra), false)
  assert.equal(isOfficialCliCobraRootHelp(cobra), true)
  assert.equal(isOfficialCliRootHelp(cobra), true)
  assert.equal(isOfficialCliCobraRootHelp(historical), true)
  assert.equal(isOfficialCliEffectRootHelp(historical), false)
  assert.equal(isOfficialCliRootHelp(startHelp), false)
  assert.equal(isOfficialCliRootHelp(effectStartHelp), false)
  assert.throws(() => assertCliHelpText(startHelp, { kind: 'help' }), /root-help structure/)
  assert.throws(() => assertCliHelpText(effectStartHelp, { kind: 'help' }), /root-help structure/)
  assert.equal(assertCliHelpText(startHelp, { kind: 'start' }), true)
  assert.equal(isOfficialCliRootHelp(missingStop), false)
  assert.throws(() => assertCliHelpText(missingStop, { kind: 'help' }), /root-help structure/)
  assert.equal(isOfficialCliRootHelp(flagsOnlyMissingStop), false)
  assert.throws(() => assertCliHelpText(flagsOnlyMissingStop, { kind: 'help' }), /root-help structure/)
  assert.equal(isOfficialCliEffectRootHelp(mixedPrimaryUsageCobraStart), false)
  assert.equal(isOfficialCliCobraRootHelp(mixedPrimaryUsageCobraStart), false)
  assert.equal(isOfficialCliRootHelp(mixedPrimaryUsageCobraStart), false)
  assert.throws(
    () => assertCliHelpText(mixedPrimaryUsageCobraStart, { kind: 'help' }),
    /root-help structure/,
  )
  assert.equal(isOfficialCliEffectRootHelp(mixedFlagsOnlyUsageCobraStart), false)
  assert.equal(isOfficialCliCobraRootHelp(mixedFlagsOnlyUsageCobraStart), false)
  assert.equal(isOfficialCliRootHelp(mixedFlagsOnlyUsageCobraStart), false)
  assert.throws(
    () => assertCliHelpText(mixedFlagsOnlyUsageCobraStart, { kind: 'help' }),
    /root-help structure/,
  )
  assert.throws(
    () => assertCliHelpText('Please run supabase start before continuing.', { kind: 'help' }),
    /root-help structure/,
  )
  assert.throws(
    () => assertCliHelpText('start Start local Supabase stack in any sentence about status and stop.', { kind: 'help' }),
    /root-help structure/,
  )
  assert.throws(() => assertCliHelpText('unrelated binary', { kind: 'help' }), /root-help structure/)

  const workspace = mkdtempSync(join(tmpdir(), 'aaclr1-effect-root-help-'))
  const pins = writeTestCliPins(workspace)
  const composed = prepareOfficialCliIdentity({
    toolingDir: join(workspace, 'tooling'),
    env: { PATH: '/usr/bin', LANG: 'C', TZ: 'UTC' },
    archivePath: pins.archivePath,
    checksumsPath: pins.checksumsPath,
    platformId: 'linux-x64',
    invokeBinary: true,
    pins: pins.pins,
    execFile: (bin, args, options) => {
      if (String(bin) === 'tar' || String(bin).endsWith('/tar')) return execFileSync('tar', args, options)
      if (args?.[0] === '--version') return '2.117.0\n'
      if (args?.[0] === '--help') return exactMac
      if (args?.[0] === 'start' && args?.[1] === '--help') return startHelp
      throw new Error(`unexpected ${bin} ${args}`)
    },
  })
  assert.equal(composed.archiveBound, true)
  assert.equal(composed.versionVerified, true)
  assert.equal(composed.helpVerified, true)
  assert.equal(composed.startHelpVerified, true)
  assert.equal(composed.identityVerified, true)
  assert.deepEqual(composed.failedIdentityChecks, [])
  rmSync(workspace, { recursive: true, force: true })
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
  assert.throws(() => assertSafeEvidence({ access_token: 'SYNTHETIC-ACCESS-TOKEN' }), /must not contain secrets/)
  assert.throws(() => assertSafeEvidence({ refresh_token: 'SYNTHETIC-REFRESH-TOKEN' }), /must not contain secrets/)
  const jwtMarker = `eyJ${'A'.repeat(30)}.${'B'.repeat(30)}.${'C'.repeat(30)}`
  assert.throws(() => assertSafeEvidence({ notes: `request failed while using Bearer ${jwtMarker}` }), /must not contain secrets/)
  const fillError = "locator.fill('SYNTHETIC-NOT-A-REAL-PASSWORD-491') timed out"
  const otpError = 'setup error otpauth://totp/test?secret=SYNTHETIC-NOT-A-REAL-TOTP-SECRET'
  assert.equal(redactSecrets(fillError), '[redacted]')
  assert.equal(redactSecrets(otpError), '[redacted]')
  assert.doesNotMatch(redactSecrets(fillError), /SYNTHETIC-NOT-A-REAL-PASSWORD/)
  assert.doesNotMatch(redactSecrets(otpError), /SYNTHETIC-NOT-A-REAL-TOTP/)
  assert.throws(() => assertSafeEvidence({ error: fillError }), /must not contain secrets/)
  assert.throws(() => assertSafeEvidence({ error: otpError }), /must not contain secrets/)
  const dir = mkdtempSync(join(tmpdir(), 'aaclr1-ev-'))
  assert.throws(() => writeEvidence(dir, 'README.md', { ok: true }), /historical evidence/)
  writeEvidence(dir, 'aaclr1-unit-receipt.json', { ok: true, note: 'unit' })
  assert.equal(JSON.parse(readFileSync(join(dir, 'aaclr1-unit-receipt.json'), 'utf8')).ok, true)
  const firstBytes = readFileSync(join(dir, 'aaclr1-unit-receipt.json'), 'utf8')
  assert.throws(
    () => writeEvidence(dir, 'aaclr1-unit-receipt.json', { ok: false, note: 'replacement' }),
    /overwrite existing durable evidence/,
  )
  assert.equal(readFileSync(join(dir, 'aaclr1-unit-receipt.json'), 'utf8'), firstBytes)
  writeEvidence(dir, 'aaclr1-fill-receipt.json', { error: fillError })
  const fillWritten = JSON.parse(readFileSync(join(dir, 'aaclr1-fill-receipt.json'), 'utf8'))
  assert.equal(fillWritten.error, '[redacted]')
  assert.doesNotMatch(readFileSync(join(dir, 'aaclr1-fill-receipt.json'), 'utf8'), /SYNTHETIC-NOT-A-REAL-PASSWORD/)
  writeEvidence(dir, 'aaclr1-otp-receipt.json', { error: otpError })
  const otpWritten = JSON.parse(readFileSync(join(dir, 'aaclr1-otp-receipt.json'), 'utf8'))
  assert.equal(otpWritten.error, '[redacted]')
  assert.doesNotMatch(readFileSync(join(dir, 'aaclr1-otp-receipt.json'), 'utf8'), /SYNTHETIC-NOT-A-REAL-TOTP/)
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
      if (args[0] === 'volume' && args[1] === 'inspect') {
        return JSON.stringify([{ Name: 'fixture-volume', Driver: 'local', Labels: {} }])
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
      if (args[0] === 'volume' && args[1] === 'inspect') {
        return JSON.stringify([{ Name: 'owned-volume', Driver: 'local', Labels: { [RUN_LABEL]: 'run-1' } }])
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
      network: { name: 'owned-net', created: true, runId: 'run-1' },
      runId: 'run-1',
      containers: [],
      volumes: [{ name: 'foreign-vol', ownership: 'foreign' }],
      inventoryComplete: true,
    },
    execFile: (_bin, args) => {
      volumeCalls.push(args.slice())
      if (args[0] === 'ps') return ''
      if (args[0] === 'volume' && args[1] === 'inspect') {
        return JSON.stringify([{ Name: 'foreign-vol', Labels: { [RUN_LABEL]: 'OTHER-RUN' } }])
      }
      if (args[0] === 'volume') throw new Error('foreign volume must not be deleted')
      if (args[0] === 'network' && (args[1] === 'rm' || args[1] === 'inspect')) {
        throw new Error(`No such network: ${args[2]}`)
      }
      return ''
    },
  })
  assert.deepEqual(foreign.foreignVolumes, ['foreign-vol'])
  assert.ok(foreign.foreignRetained.includes('foreign-vol'))
  assert.equal(foreign.volumesRemoved, true)
  assert.ok(!volumeCalls.some((args) => args[0] === 'volume' && args[1] === 'rm'))

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

function o1ResourceExec({
  container,
  volume,
  removed = { containers: new Set(), volumes: new Set() },
  calls,
} = {}) {
  return (_bin, args) => {
    calls.push({ bin: String(_bin), args: args.slice() })
    if (args[0] === 'ps') {
      return removed.containers.has(container.Id) ? '' : container.Id
    }
    if (args[0] === 'inspect') {
      if (removed.containers.has(args[1]) || args[1] !== container.Id) {
        throw new Error(`No such container: ${args[1]}`)
      }
      return JSON.stringify([container])
    }
    if (args[0] === 'stop' && args.length === 1) return ''
    if ((args[0] === 'stop' && args[1]) || args[0] === 'rm') {
      if (removed.containers.has(args[1])) throw new Error(`No such container: ${args[1]}`)
      removed.containers.add(args[1])
      return ''
    }
    if (args[0] === 'volume' && args[1] === 'inspect') {
      if (removed.volumes.has(args[2]) || (volume && args[2] !== volume.Name)) {
        throw new Error(`No such volume: ${args[2]}`)
      }
      return JSON.stringify([volume])
    }
    if (args[0] === 'volume' && args[1] === 'rm') {
      const name = args[2] === '-f' ? args[3] : args[2]
      if (removed.volumes.has(name)) throw new Error(`No such volume: ${name}`)
      removed.volumes.add(name)
      return ''
    }
    if (args[0] === 'network' && (args[1] === 'rm' || args[1] === 'inspect')) {
      throw new Error(`No such network: ${args[2]}`)
    }
    throw new Error(`unexpected ${args}`)
  }
}

test('O1 collector→reconcile→stop refuses foreign identity and keeps owned teardown', async () => {
  const runId = 'aaclr1-diagnostic-9fff'
  const label = RUN_LABEL
  const networkName = 'owned-network'
  const ownedContainer = {
    Id: 'container-1',
    Name: '/synthetic-owned-db',
    Config: { Labels: { [label]: runId } },
    HostConfig: {
      NetworkMode: networkName,
      PortBindings: { '5432/tcp': [{ HostIp: '127.0.0.1', HostPort: '32100' }] },
    },
    NetworkSettings: { Networks: { [networkName]: {} } },
    Mounts: [{ Type: 'volume', Name: 'synthetic-volume', Destination: '/data' }],
  }
  const foreignVolume = { Name: 'synthetic-volume', Driver: 'local', Labels: { [label]: 'OTHER-RUN' } }
  const ownedVolume = { Name: 'synthetic-volume', Driver: 'local', Labels: { [label]: runId } }

  assert.equal(
    classifyContainerOwnership({ labels: { [label]: 'OTHER-RUN' }, runId }).ownership,
    'foreign',
  )
  assert.equal(
    classifyVolumeOwnership({
      mount: { Type: 'volume', Name: 'synthetic-volume' },
      labels: foreignVolume.Labels,
      runId,
    }).ownership,
    'foreign',
  )

  const s02Calls = []
  const s02 = collectOwnedDockerResources({
    dockerBin: 'docker',
    networkName,
    env: {},
    runId,
    projectId: runId,
    execFile: o1ResourceExec({ container: ownedContainer, volume: foreignVolume, calls: s02Calls }),
  })
  assert.equal(s02.containers[0].ownership, 'owned')
  assert.equal(s02.volumes[0].ownership, 'foreign')
  assert.ok(s02Calls.some((item) => item.args[0] === 'volume' && item.args[1] === 'inspect'))
  const s02StopCalls = []
  const s02Removed = { containers: new Set(), volumes: new Set() }
  const s02Stop = await stoppeOwnedStack({
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: mkdtempSync(join(tmpdir(), 'aaclr1-o1s02-')),
    projectId: runId,
    state: {
      network: { name: networkName, created: true, runId },
      runId,
      projectId: runId,
      containers: s02.containers,
      volumes: [{ name: 'synthetic-volume', ownership: 'owned' }],
      inventoryComplete: true,
    },
    execFile: o1ResourceExec({
      container: ownedContainer,
      volume: foreignVolume,
      removed: s02Removed,
      calls: s02StopCalls,
    }),
  })
  assert.equal(s02Stop.volumes[0], undefined)
  assert.ok(s02Stop.foreignVolumes.includes('synthetic-volume'))
  assert.equal(s02Stop.conflicts.includes('synthetic-volume'), true)
  assert.ok(!s02StopCalls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  assert.ok(!s02StopCalls.some((item) => item.bin === 'supabase' || (item.args[0] === 'stop' && item.args.length === 1)))
  assert.equal(s02Stop.cliStopSkipped, 'foreign-or-unresolved-identity')
  assert.equal(s02Stop.dockerServicesStopped, false)

  const foreignAttached = {
    ...ownedContainer,
    Config: { Labels: { [label]: 'OTHER-RUN' } },
    Mounts: [],
  }
  const s03Collect = collectOwnedDockerResources({
    dockerBin: 'docker',
    networkName,
    env: {},
    runId,
    projectId: runId,
    execFile: o1ResourceExec({ container: foreignAttached, volume: null, calls: [] }),
  })
  assert.equal(s03Collect.containers[0].ownership, 'foreign')
  const s03Calls = []
  const s03 = await stoppeOwnedStack({
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: mkdtempSync(join(tmpdir(), 'aaclr1-o1s03-')),
    projectId: runId,
    state: {
      network: { name: networkName, created: true, runId },
      runId,
      projectId: runId,
      containers: s03Collect.containers,
      volumes: [],
      inventoryComplete: true,
    },
    execFile: o1ResourceExec({ container: foreignAttached, volume: null, calls: s03Calls }),
  })
  assert.ok(s03.foreignContainers.includes('container-1'))
  assert.ok(!s03Calls.some((item) => item.args[0] === 'stop' && item.args[1] === 'container-1'))
  assert.ok(!s03Calls.some((item) => item.args[0] === 'rm' && item.args[1] === 'container-1'))
  assert.ok(!s03Calls.some((item) => item.args[0] === 'stop' && item.args.length === 1))
  assert.equal(s03.cliStopSkipped, 'foreign-or-unresolved-identity')
  assert.equal(s03.dockerServicesStopped, false)

  const s04Calls = []
  const s04 = await stoppeOwnedStack({
    dockerBin: 'docker',
    projectId: runId,
    state: {
      network: { name: networkName, created: true, runId },
      runId,
      projectId: runId,
      containers: [{ id: 'container-1', ownership: 'owned' }],
      volumes: [{ name: 'synthetic-volume', ownership: 'owned' }],
      inventoryComplete: true,
    },
    execFile: o1ResourceExec({ container: ownedContainer, volume: foreignVolume, calls: s04Calls }),
  })
  assert.equal(s04.conflicts.includes('synthetic-volume'), true)
  assert.ok(s04.foreignVolumes.includes('synthetic-volume'))
  assert.ok(!s04Calls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  assert.equal(s04.dockerServicesStopped, false)

  const ownedCalls = []
  const ownedRemoved = { containers: new Set(), volumes: new Set() }
  const ownedSuccess = await stoppeOwnedStack({
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: mkdtempSync(join(tmpdir(), 'aaclr1-o1ok-')),
    projectId: runId,
    state: {
      network: { name: networkName, created: true, runId },
      runId,
      projectId: runId,
      containers: [{ id: 'container-1', ownership: 'owned' }],
      volumes: [{ name: 'synthetic-volume', ownership: 'owned' }],
      inventoryComplete: true,
    },
    execFile: o1ResourceExec({
      container: ownedContainer,
      volume: ownedVolume,
      removed: ownedRemoved,
      calls: ownedCalls,
    }),
  })
  assert.equal(ownedSuccess.dockerServicesStopped, true)
  assert.ok(ownedCalls.some((item) => item.args[0] === 'stop' && item.args[1] === 'container-1'))
  assert.ok(ownedCalls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  assert.ok(ownedCalls.some((item) => item.args[0] === 'stop' && item.args.length === 1))

  const cliProject = 'aaclr1-cli-project'
  const cliContainer = {
    ...ownedContainer,
    Config: { Labels: { [CLI_PROJECT_LABEL]: cliProject } },
    Mounts: [{ Type: 'volume', Name: 'synthetic-volume', Destination: '/data' }],
  }
  const cliVolume = { Name: 'synthetic-volume', Driver: 'local', Labels: { [CLI_PROJECT_LABEL]: cliProject } }
  assert.equal(
    classifyContainerOwnership({ labels: cliContainer.Config.Labels, runId, projectId: cliProject }).ownership,
    'owned',
  )
  const cliCalls = []
  const cliRemoved = { containers: new Set(), volumes: new Set() }
  const cliOwned = await stoppeOwnedStack({
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: mkdtempSync(join(tmpdir(), 'aaclr1-o1cli-')),
    projectId: cliProject,
    state: {
      network: { name: networkName, created: true, runId },
      runId,
      projectId: cliProject,
      containers: [{ id: 'container-1', ownership: 'owned' }],
      volumes: [{ name: 'synthetic-volume', ownership: 'owned' }],
      inventoryComplete: true,
    },
    execFile: o1ResourceExec({
      container: cliContainer,
      volume: cliVolume,
      removed: cliRemoved,
      calls: cliCalls,
    }),
  })
  assert.equal(cliOwned.dockerServicesStopped, true)
  assert.ok(cliCalls.some((item) => item.args[0] === 'stop' && item.args[1] === 'container-1'))
  assert.ok(cliCalls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  assert.ok(cliCalls.some((item) => item.args[0] === 'stop' && item.args.length === 1))

  const daemonCalls = []
  const daemonDown = Object.assign(new Error('Cannot connect to the Docker daemon'), { code: 'ETIMEDOUT' })
  const daemon = await stoppeOwnedStack({
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: mkdtempSync(join(tmpdir(), 'aaclr1-o1daemon-')),
    projectId: runId,
    state: {
      network: { name: networkName, created: true, runId },
      runId,
      projectId: runId,
      containers: [{ id: 'container-1', ownership: 'owned' }],
      volumes: [{ name: 'synthetic-volume', ownership: 'owned' }],
      inventoryComplete: true,
    },
    execFile: (_bin, args) => {
      daemonCalls.push({ bin: String(_bin), args: args.slice() })
      throw daemonDown
    },
  })
  assert.equal(daemon.unknown, true)
  assert.equal(daemon.dockerServicesStopped, false)
  assert.equal(daemon.cliStopSkipped, 'discovery-unknown')
  assert.ok(!daemonCalls.some((item) => item.args[0] === 'stop'))
  assert.ok(!daemonCalls.some((item) => item.args[0] === 'rm'))
  assert.ok(!daemonCalls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  assert.ok(!daemonCalls.some((item) => item.args[0] === 'network' && item.args[1] === 'rm'))

  const partialCalls = []
  const partial = await stoppeOwnedStack({
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: mkdtempSync(join(tmpdir(), 'aaclr1-o1partial-')),
    projectId: runId,
    state: {
      network: { name: networkName, created: true, runId },
      runId,
      projectId: runId,
      containers: [],
      volumes: [],
      inventoryComplete: false,
    },
    execFile: (_bin, args) => {
      partialCalls.push({ bin: String(_bin), args: args.slice() })
      if (args[0] === 'ps') return ''
      if (args[0] === 'inspect') throw new Error(`No such container: ${args[1]}`)
      if (args[0] === 'stop' || args[0] === 'rm') throw new Error(`No such container: ${args[1]}`)
      if (args[0] === 'volume') throw new Error(`No such volume: ${args[2] === '-f' ? args[3] : args[2]}`)
      if (args[0] === 'network' && args[1] === 'rm') return ''
      if (args[0] === 'network' && args[1] === 'inspect') throw new Error(`No such network: ${args[2]}`)
      if (args[0] === 'stop' && args.length === 1) return ''
      throw new Error(`unexpected ${args}`)
    },
  })
  assert.equal(partial.containerState, RESOURCE_STATE.ABSENT)
  assert.equal(partial.volumeState, RESOURCE_STATE.ABSENT)
  assert.equal(partial.networkRemoved, true)
  assert.equal(partial.dockerServicesStopped, true)
  assert.ok(!partialCalls.some((item) => item.args[0] === 'stop' && item.args[1]))
  assert.ok(!partialCalls.some((item) => item.args[0] === 'rm'))
  assert.ok(!partialCalls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  assert.ok(partialCalls.some((item) => item.args[0] === 'network' && item.args[1] === 'rm'))

  const home = mkdtempSync(join(tmpdir(), 'aaclr1-o1hand-'))
  const registry = createOwnershipRegistry({ runId, privateHome: home, evidenceDir: home })
  registerHandle(registry, 'network', { name: networkName, created: true, runId })
  registerHandle(registry, 'dockerBin', 'docker')
  registerHandle(registry, 'projectId', runId)
  registerHandle(registry, 'cliBin', 'supabase')
  registerHandle(registry, 'workdir', home)
  const handoffCalls = []
  registerHandle(registry, 'execFile', o1ResourceExec({
    container: ownedContainer,
    volume: foreignVolume,
    calls: handoffCalls,
  }))
  recordDockerResources(registry, {
    containers: [{ id: 'container-1', ownership: 'owned' }],
    volumes: [{ name: 'synthetic-volume', ownership: 'owned' }],
  })
  const handoff = await raeumeOwnedAuf({
    privateHome: home,
    registry,
    dockerBin: 'docker',
    cliBin: 'supabase',
    workdir: home,
    projectId: runId,
    execFile: registry.execFile,
  })
  assert.equal(handoff.neverStarted, false)
  assert.ok(handoff.reports.some((item) => item.kind === 'stack'))
  assert.ok(!handoffCalls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  assert.ok(!handoffCalls.some((item) => item.args[0] === 'stop' && item.args.length === 1))
  assert.equal(bewerteCleanup(handoff, { registry }), false)
  rmSync(home, { recursive: true, force: true })
})

function hideExitProof(child) {
  return {
    get pid() { return child.pid },
    get exitCode() { return null },
    get signalCode() { return null },
    kill() { return true },
    on: (...args) => child.on(...args),
    off: (...args) => child.off(...args),
    once: (...args) => child.once(...args),
  }
}

test('O2a unconfirmed stack CLI child retains HOME and fails G20; confirmed stop remains safe', async () => {
  const absentDocker = (_bin, args) => {
    if (args[0] === 'ps') return ''
    if (args[0] === 'inspect') throw new Error(`No such container: ${args[1]}`)
    if (args[0] === 'volume' && args[1] === 'inspect') throw new Error(`No such volume: ${args[2]}`)
    if (args[0] === 'volume' && args[1] === 'rm') throw new Error(`No such volume: ${args[3] || args[2]}`)
    if (args[0] === 'network' && (args[1] === 'rm' || args[1] === 'inspect')) {
      throw new Error(`No such network: ${args[2]}`)
    }
    if (args[0] === 'stop' && args.length === 1) return ''
    return ''
  }

  await withOwnedChild(IGNORE_TERM, async (real) => {
    const home = mkdtempSync(join(tmpdir(), 'aaclr1-o2a-live-'))
    const registry = createOwnershipRegistry({ privateHome: home, evidenceDir: home })
    registerHandle(registry, 'network', { name: 'owned-net', created: true, runId: 'aaclr1-o2a' })
    registerHandle(registry, 'stackChild', hideExitProof(real))
    registerHandle(registry, 'stack', { child: registry.stackChild, inventoryComplete: true })
    registerHandle(registry, 'dockerBin', 'docker')
    const cleanup = await raeumeOwnedAuf({
      privateHome: home,
      registry,
      dockerBin: 'docker',
      execFile: absentDocker,
    })
    assert.ok(cleanup.reports.some((item) => item.kind === 'stack-cli-child' && item.reaped !== true))
    assert.equal(cleanup.ownershipRetained, true)
    assert.equal(cleanup.unknown, true)
    assert.equal(cleanup.processesStopped, false)
    assert.equal(existsSync(home), true)
    assert.ok(cleanup.removals.some((item) => item.path === home && item.removed === false))
    assert.equal(bewerteCleanup(cleanup, { registry }), false)
    rmSync(home, { recursive: true, force: true })
  })

  const doneHome = mkdtempSync(join(tmpdir(), 'aaclr1-o2a-done-'))
  const doneChild = spawn(process.execPath, ['-e', 'process.exit(0)'], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  await once(doneChild, 'exit')
  const doneReg = createOwnershipRegistry({ privateHome: doneHome, evidenceDir: doneHome })
  registerHandle(doneReg, 'network', { name: 'owned-net', created: true, runId: 'aaclr1-o2a' })
  registerHandle(doneReg, 'stackChild', doneChild)
  registerHandle(doneReg, 'stack', { child: doneChild, inventoryComplete: true })
  registerHandle(doneReg, 'dockerBin', 'docker')
  const confirmed = await raeumeOwnedAuf({
    privateHome: doneHome,
    registry: doneReg,
    dockerBin: 'docker',
    execFile: absentDocker,
  })
  assert.ok(confirmed.reports.some((item) => item.kind === 'stack-cli-child' && item.reaped === true))
  assert.equal(confirmed.ownershipRetained, false)
  assert.equal(confirmed.unknown, false)
  assert.equal(confirmed.processesStopped, true)
  assert.equal(existsSync(doneHome), false)
  assert.equal(bewerteCleanup(confirmed, { registry: doneReg }), true)
})

test('O2b default start threads exact CLI project identity into discovery and teardown', async () => {
  const projectId = 'aaclr1-o2b-exact'
  const otherProject = 'aaclr1-o2b-other'
  const networkName = `aaclr1-${projectId}`.slice(0, 60)
  const cliContainer = {
    Id: 'cli-db-1',
    Name: '/supabase_db_aaclr1-o2b-exact',
    Config: { Labels: { [CLI_PROJECT_LABEL]: projectId } },
    HostConfig: {
      NetworkMode: networkName,
      PortBindings: { '5432/tcp': [{ HostIp: '127.0.0.1', HostPort: '54322' }] },
    },
    NetworkSettings: { Networks: { [networkName]: {} } },
    Mounts: [{ Type: 'volume', Name: 'cli-volume', Destination: '/var/lib/postgresql/data' }],
  }
  const cliVolume = { Name: 'cli-volume', Driver: 'local', Labels: { [CLI_PROJECT_LABEL]: projectId } }

  async function startWithLabels(labels, volumeLabels) {
    const home = mkdtempSync(join(tmpdir(), 'aaclr1-o2b-'))
    const evidenceDir = mkdtempSync(join(home, 'evidence-'))
    const workdir = mkdtempSync(join(home, 'workdir-'))
    const registry = createOwnershipRegistry({ runId: 'aaclr1-o2b-run', privateHome: home, evidenceDir })
    const owned = { evidenceDir, registry, privateHome: home, browserRegistry: registry.browsers }
    const calls = []
    const removed = { containers: new Set(), volumes: new Set() }
    const container = { ...cliContainer, Config: { Labels: labels } }
    const volume = { ...cliVolume, Labels: volumeLabels }
    try {
      await defaultStartRuntime({
        owned,
        plan: planeLoopbackDienste({ apiPort: 54321, dbPort: 54322, appPort: 3000, observerPort: 3999 }),
        prepared: { projectId, workdir },
        source: {},
        cli: { identityVerified: true, archiveBound: true, resolved: process.execPath },
        docker: { usable: true, selected: { path: 'docker' } },
        childEnv: { PATH: '/usr/bin' },
        execFile: (bin, args) => {
          calls.push({ bin: String(bin), args: args.slice() })
          if (args[0] === 'status') throw new Error('status-after-stack')
          if (args[0] === 'network' && args[1] === 'create') return 'netid'
          return o1ResourceExec({ container, volume, removed, calls: [] })(bin, args)
        },
        spawnFn: () => spawn(process.execPath, ['-e', 'process.exit(0)'], {
          stdio: ['ignore', 'ignore', 'ignore'],
        }),
      })
    } catch (error) {
      return { owned, home, calls, error, removed }
    }
    return { owned, home, calls, error: null, removed }
  }

  const exact = await startWithLabels({ [CLI_PROJECT_LABEL]: projectId }, { [CLI_PROJECT_LABEL]: projectId })
  assert.match(String(exact.error?.message || ''), /status-after-stack/)
  assert.equal(exact.owned.stack.projectId, projectId)
  assert.equal(exact.owned.registry.projectId, projectId)
  assert.equal(exact.owned.stack.containers[0].ownership, 'owned')
  assert.equal(exact.owned.stack.containers[0].reason, 'exact CLI project')
  assert.equal(exact.owned.stack.volumes[0].ownership, 'owned')
  assert.ok(exact.owned.stack.bindings.some((item) => item.HostIp === '127.0.0.1' && item.HostPort === '54322'))
  assert.equal(exact.owned.stack.dockerServicesConfirmed, true)
  const teardownCalls = []
  registerHandle(exact.owned.registry, 'execFile', o1ResourceExec({
    container: cliContainer,
    volume: cliVolume,
    removed: { containers: new Set(), volumes: new Set() },
    calls: teardownCalls,
  }))
  const teardown = await raeumeOwnedAuf({
    privateHome: exact.home,
    registry: exact.owned.registry,
    dockerBin: 'docker',
    cliBin: process.execPath,
    workdir: exact.owned.stack.workdir,
    projectId,
    execFile: exact.owned.registry.execFile,
  })
  assert.ok(teardownCalls.some((item) => item.args[0] === 'stop' && item.args[1] === 'cli-db-1'))
  assert.ok(teardownCalls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  assert.equal(exact.owned.registry.projectId, projectId)
  assert.equal(teardown.neverStarted, false)
  rmSync(exact.home, { recursive: true, force: true })

  const wrong = await startWithLabels({ [CLI_PROJECT_LABEL]: otherProject }, { [CLI_PROJECT_LABEL]: otherProject })
  assert.match(String(wrong.error?.message || ''), /No published bindings|not a completed/)
  assert.equal(wrong.owned.stack, undefined)
  assert.ok(!wrong.calls.some((item) => item.args[0] === 'stop' && item.args[1] === 'cli-db-1'))
  assert.ok(!wrong.calls.some((item) => item.args[0] === 'volume' && item.args[1] === 'rm'))
  rmSync(wrong.home, { recursive: true, force: true })
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

function writeExactConsumerArtifacts(dir, runId, {
  receipt,
  gates,
  desktop = MINIMAL_PNG,
  mobile = MINIMAL_PNG,
} = {}) {
  const names = consumerArtifactNames(runId)
  writeFileSync(join(dir, names[0]), desktop)
  writeFileSync(join(dir, names[1]), mobile)
  const body = receipt || gates || createControlledConsumerReceipt({ runId })
  writeFileSync(join(dir, names[2]), `${JSON.stringify(body)}\n`)
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
  writeFileSync(join(missPrivate, `${runId}-counts-desktop.png`), MINIMAL_PNG)
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

function gateMap(receipt) {
  const gates = receipt.gates
  if (Array.isArray(gates)) return Object.fromEntries(gates.map((gate) => [gate.id, gate]))
  return gates
}

function zeroDimensionPng() {
  const bytes = Buffer.alloc(45)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0)
  bytes.writeUInt32BE(13, 8)
  bytes.write('IHDR', 12)
  bytes.write('IEND', 37)
  return bytes
}

const MALFORMED_MINIMAL_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d4948445200000002000000020806000000f4e295f00000000d49444154789c636000020000050001aa5072260000000049454e44ae426082',
  'hex',
)

function encodePngChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBytes = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])) >>> 0)
  return Buffer.concat([length, typeBytes, data, crc])
}

function encodePng(chunks) {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ...chunks.map(([type, data]) => encodePngChunk(type, data)),
  ])
}

function illegalRgbDepth1Png() {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(2, 0)
  ihdr.writeUInt32BE(2, 4)
  ihdr[8] = 1
  ihdr[9] = 2
  return encodePng([
    ['IHDR', ihdr],
    ['IDAT', deflateSync(Buffer.alloc(6))],
    ['IEND', Buffer.alloc(0)],
  ])
}

function textMetadataPng(marker = `Bearer eyJ${'A'.repeat(30)}.${'B'.repeat(30)}.${'C'.repeat(30)}`) {
  const chunks = []
  let offset = 8
  const source = MINIMAL_PNG
  while (offset + 12 <= source.length) {
    const length = source.readUInt32BE(offset)
    const type = source.toString('ascii', offset + 4, offset + 8)
    const data = source.subarray(offset + 8, offset + 8 + length)
    chunks.push([type, Buffer.from(data)])
    offset += 12 + length
    if (type === 'IEND') break
  }
  const ihdr = chunks.find((chunk) => chunk[0] === 'IHDR')
  const rest = chunks.filter((chunk) => chunk[0] !== 'IHDR')
  return encodePng([
    ihdr,
    ['tEXt', Buffer.from(`Comment\0${marker}`)],
    ...rest,
  ])
}

function rgba2x2Png() {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(2, 0)
  ihdr.writeUInt32BE(2, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const row = Buffer.alloc(1 + 2 * 4)
  const payload = Buffer.concat([row, row])
  return encodePng([
    ['IHDR', ihdr],
    ['IDAT', deflateSync(payload)],
    ['IEND', Buffer.alloc(0)],
  ])
}

function ancillaryMetadataPng(type = 'eXIf') {
  const chunks = []
  let offset = 8
  const source = MINIMAL_PNG
  while (offset + 12 <= source.length) {
    const length = source.readUInt32BE(offset)
    const chunkType = source.toString('ascii', offset + 4, offset + 8)
    const data = source.subarray(offset + 8, offset + 8 + length)
    chunks.push([chunkType, Buffer.from(data)])
    offset += 12 + length
    if (chunkType === 'IEND') break
  }
  const ihdr = chunks.find((chunk) => chunk[0] === 'IHDR')
  const rest = chunks.filter((chunk) => chunk[0] !== 'IHDR')
  return encodePng([
    ihdr,
    [type, Buffer.from('unreviewed-ancillary')],
    ...rest,
  ])
}

async function exportFullConsumer({
  runId,
  identity,
  receipt,
  desktop = MINIMAL_PNG,
  mobile = MINIMAL_PNG,
}) {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-n01-'))
  const privateEv = mkdtempSync(join(home, 'evidence-'))
  const durable = mkdtempSync(join(tmpdir(), 'aaclr1-n01d-'))
  writeExactConsumerArtifacts(privateEv, runId, { receipt, desktop, mobile })
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
  return { home, durable, registry, cleanup }
}

test('E1 E2 validate consumer contents and refuse receipt overwrite', async () => {
  const runId = 'aaclr1-20260923T180000Z'
  const identity = createRunIdentity({ runId })
  assertValidPng(MINIMAL_PNG)
  const validReceipt = createProducerShapedConsumerReceipt({ runId })
  assert.equal(gateMap(validReceipt).G6_login_ui_password.result, 'NOT RUN')
  assert.equal(validReceipt.agent, 'Jetnity admin account counts browser flows 1')
  assert.equal(validReceipt.realExecution, 'NOT RUN')
  assertConsumerGatesJson(validReceipt, { identity })

  const failReceipt = createProducerShapedConsumerReceipt({
    runId,
    gateResults: { G6_login_ui_password: 'FAIL' },
  })
  assert.equal(gateMap(failReceipt).G6_login_ui_password.result, 'FAIL')
  assert.equal(failReceipt.thisInvocation.observedResults.includes('FAIL'), true)
  assert.equal(failReceipt.realExecution, 'NOT RUN')
  assertConsumerGatesJson(failReceipt, { identity })

  const home = mkdtempSync(join(tmpdir(), 'aaclr1-e1ok-'))
  const privateEv = mkdtempSync(join(home, 'evidence-'))
  const durable = mkdtempSync(join(tmpdir(), 'aaclr1-e1okd-'))
  writeExactConsumerArtifacts(privateEv, runId, { receipt: failReceipt })
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
  assert.equal(cleanup.artifactExport.ok, true)
  assert.equal(cleanup.artifactExport.exported.length, 3)
  assert.equal(bewerteCleanup(cleanup, { registry }), true)
  assert.equal(existsSync(home), false)
  const published = JSON.parse(readFileSync(join(durable, `${runId}-browser-flows-gates.json`), 'utf8'))
  assert.equal(published.agent, 'Jetnity admin account counts browser flows 1')
  assert.equal(gateMap(published).G6_login_ui_password.result, 'FAIL')
  assert.notEqual(gateMap(published).G6_login_ui_password.result, 'PASS')
  assert.equal(published.realExecution, 'NOT RUN')
  const publishedDesktop = readFileSync(join(durable, `${runId}-counts-desktop.png`))
  const publishedMobile = readFileSync(join(durable, `${runId}-counts-mobile.png`))
  assertValidPng(publishedDesktop)
  assertValidPng(publishedMobile)
  assert.equal(publishedDesktop.equals(MINIMAL_PNG), true)
  const pngTextType = Buffer.from([0x74, 0x45, 0x58, 0x74])
  const pngExifType = Buffer.from([0x65, 0x58, 0x49, 0x66])
  assert.equal(publishedDesktop.includes(pngTextType), false)
  assert.equal(publishedDesktop.includes(pngExifType), false)
  assert.equal(published.thisInvocation.observedResults[0], 'FAIL')
  assert.deepEqual(published.thisInvocation.observedResults, published.gates.map((gate) => gate.result))

  const jwtMarker = `eyJ${'A'.repeat(30)}.${'B'.repeat(30)}.${'C'.repeat(30)}`
  const secretReceipt = createControlledConsumerReceipt({ runId })
  secretReceipt.notes = `request failed while using Bearer ${jwtMarker}`
  secretReceipt.access_token = 'SYNTHETIC-ACCESS-TOKEN'
  secretReceipt.refresh_token = 'SYNTHETIC-REFRESH-TOKEN'
  const n1Home = mkdtempSync(join(tmpdir(), 'aaclr1-n1-'))
  const n1Private = mkdtempSync(join(n1Home, 'evidence-'))
  const n1Durable = mkdtempSync(join(tmpdir(), 'aaclr1-n1d-'))
  writeExactConsumerArtifacts(n1Private, runId, { receipt: secretReceipt })
  const n1Reg = createOwnershipRegistry({ runId, privateHome: n1Home, evidenceDir: n1Private })
  const n1 = await raeumeOwnedAuf({
    privateHome: n1Home,
    registry: n1Reg,
    evidenceDir: n1Private,
    browserRegistry: n1Reg.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: n1Private,
      destDir: n1Durable,
      runId,
      runIdentity: identity,
      ownedRoots: [n1Home],
      mode: 'full',
      consumerCompleted: true,
    }),
  })
  assert.equal(n1.exportFailed, true)
  assert.equal(bewerteCleanup(n1, { registry: n1Reg }), false)
  assert.equal(existsSync(n1Home), true)
  assert.equal(existsSync(join(n1Durable, `${runId}-browser-flows-gates.json`)), false)
  assert.equal(existsSync(join(n1Durable, `${runId}-counts-desktop.png`)), false)

  const n2Home = mkdtempSync(join(tmpdir(), 'aaclr1-n2-'))
  const n2Private = mkdtempSync(join(n2Home, 'evidence-'))
  const n2Durable = mkdtempSync(join(tmpdir(), 'aaclr1-n2d-'))
  writeExactConsumerArtifacts(n2Private, runId, {
    receipt: {},
    desktop: Buffer.alloc(0),
    mobile: Buffer.alloc(0),
  })
  const n2Reg = createOwnershipRegistry({ runId, privateHome: n2Home, evidenceDir: n2Private })
  const n2 = await raeumeOwnedAuf({
    privateHome: n2Home,
    registry: n2Reg,
    evidenceDir: n2Private,
    browserRegistry: n2Reg.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: n2Private,
      destDir: n2Durable,
      runId,
      runIdentity: identity,
      ownedRoots: [n2Home],
      mode: 'full',
      consumerCompleted: true,
    }),
  })
  assert.equal(n2.exportFailed, true)
  assert.equal(bewerteCleanup(n2, { registry: n2Reg }), false)
  assert.equal(existsSync(n2Home), true)
  assert.equal(readdirSync(n2Durable).length, 0)

  const n3Receipt = createControlledConsumerReceipt({
    runId: 'aaclr1-wrong-run',
    productHead: '0'.repeat(40),
  })
  const n3Home = mkdtempSync(join(tmpdir(), 'aaclr1-n3-'))
  const n3Private = mkdtempSync(join(n3Home, 'evidence-'))
  const n3Durable = mkdtempSync(join(tmpdir(), 'aaclr1-n3d-'))
  writeExactConsumerArtifacts(n3Private, runId, { receipt: n3Receipt })
  const n3Reg = createOwnershipRegistry({ runId, privateHome: n3Home, evidenceDir: n3Private })
  const n3 = await raeumeOwnedAuf({
    privateHome: n3Home,
    registry: n3Reg,
    evidenceDir: n3Private,
    browserRegistry: n3Reg.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: n3Private,
      destDir: n3Durable,
      runId,
      runIdentity: identity,
      ownedRoots: [n3Home],
      mode: 'full',
      consumerCompleted: true,
    }),
  })
  assert.equal(n3.exportFailed, true)
  assert.equal(existsSync(n3Home), true)
  assert.equal(existsSync(join(n3Durable, `${runId}-browser-flows-gates.json`)), false)

  const incomplete = createProducerShapedConsumerReceipt({ runId })
  incomplete.gates = incomplete.gates.filter((gate) => gate.id !== 'G19_http_boundary_same_session')
  assert.throws(() => assertConsumerGatesJson(incomplete, { identity }), /missing gate/)
  const duplicate = createProducerShapedConsumerReceipt({ runId })
  duplicate.gates = [
    ...duplicate.gates,
    { id: 'G6_login_ui_password', result: 'NOT RUN', notes: 'dup' },
  ]
  assert.throws(() => assertConsumerGatesJson(duplicate, { identity }), /duplicate gate/)
  assert.throws(() => assertValidPng(Buffer.alloc(40, 0x41)), /not a structurally valid PNG|too small/)
  assert.throws(() => assertValidPng(Buffer.alloc(0)), /empty image/)
  assert.throws(() => assertValidPng(zeroDimensionPng()), /zero PNG dimensions|missing PNG image data|invalid PNG CRC|too small/)
  assert.throws(() => assertValidPng(MALFORMED_MINIMAL_PNG), /invalid PNG image payload|invalid PNG CRC|does not match IHDR/)
  assert.throws(() => assertValidPng(illegalRgbDepth1Png()), /screenshot profile/)
  const jwtTextMarker = `Bearer eyJ${'A'.repeat(30)}.${'B'.repeat(30)}.${'C'.repeat(30)}`
  const textPng = textMetadataPng(jwtTextMarker)
  assert.throws(() => assertValidPng(textPng), /unreviewed PNG metadata chunk tEXt/)
  assert.throws(() => assertValidPng(ancillaryMetadataPng('eXIf')), /unreviewed PNG metadata chunk eXIf/)
  assert.throws(() => assertValidPng(ancillaryMetadataPng('pHYs')), /unreviewed PNG metadata chunk pHYs/)
  assertValidPng(rgba2x2Png())
  const blockedReceipt = createProducerShapedConsumerReceipt({
    runId,
    gateResults: { G6_login_ui_password: 'BLOCKED' },
  })
  assert.equal(gateMap(blockedReceipt).G6_login_ui_password.result, 'BLOCKED')
  assert.equal(blockedReceipt.thisInvocation.observedResults[0], 'BLOCKED')
  assertConsumerGatesJson(blockedReceipt, { identity })
  const mismatched = createProducerShapedConsumerReceipt({ runId })
  mismatched.thisInvocation.observedResults = BROWSER_GATES.map(() => 'PASS')
  assert.throws(() => assertConsumerGatesJson(mismatched, { identity }), /observedResults does not match/)
  const n01 = await exportFullConsumer({
    runId,
    identity,
    receipt: createProducerShapedConsumerReceipt({ runId }),
    desktop: illegalRgbDepth1Png(),
    mobile: illegalRgbDepth1Png(),
  })
  assert.equal(n01.cleanup.exportFailed, true)
  assert.equal(bewerteCleanup(n01.cleanup, { registry: n01.registry }), false)
  assert.equal(existsSync(n01.home), true)
  assert.equal(readdirSync(n01.durable).length, 0)
  const n02 = await exportFullConsumer({
    runId,
    identity,
    receipt: createProducerShapedConsumerReceipt({ runId }),
    desktop: textPng,
    mobile: MINIMAL_PNG,
  })
  assert.equal(n02.cleanup.exportFailed, true)
  assert.equal(bewerteCleanup(n02.cleanup, { registry: n02.registry }), false)
  assert.equal(existsSync(n02.home), true)
  assert.equal(readdirSync(n02.durable).length, 0)
  for (const name of readdirSync(n02.durable)) {
    assert.equal(readFileSync(join(n02.durable, name)).includes(Buffer.from(jwtTextMarker)), false)
  }
  const n03 = await exportFullConsumer({
    runId,
    identity,
    receipt: mismatched,
  })
  assert.equal(n03.cleanup.exportFailed, true)
  assert.equal(bewerteCleanup(n03.cleanup, { registry: n03.registry }), false)
  assert.equal(existsSync(n03.home), true)
  assert.equal(existsSync(join(n03.durable, `${runId}-browser-flows-gates.json`)), false)
  const rgbaExport = await exportFullConsumer({
    runId: `${runId}-rgba`,
    identity: createRunIdentity({ runId: `${runId}-rgba` }),
    receipt: createProducerShapedConsumerReceipt({ runId: `${runId}-rgba` }),
    desktop: MINIMAL_PNG,
    mobile: rgba2x2Png(),
  })
  assert.equal(rgbaExport.cleanup.artifactExport.ok, true)
  assert.equal(rgbaExport.cleanup.artifactExport.exported.length, 3)
  assert.equal(bewerteCleanup(rgbaExport.cleanup, { registry: rgbaExport.registry }), true)
  assert.equal(existsSync(rgbaExport.home), false)
  const exportedRgba = readFileSync(join(rgbaExport.durable, `${runId}-rgba-counts-mobile.png`))
  assertValidPng(exportedRgba)
  assert.equal(exportedRgba.equals(rgba2x2Png()), true)
  assert.equal(exportedRgba.includes(pngTextType), false)
  assert.equal(exportedRgba.includes(pngExifType), false)
  const drifted = createProducerShapedConsumerReceipt({ runId })
  drifted.unexpectedField = true
  assert.throws(() => assertConsumerGatesJson(drifted, { identity }), /unsupported field unexpectedField/)

  const fakeHome = mkdtempSync(join(tmpdir(), 'aaclr1-fakepng-'))
  const fakePrivate = mkdtempSync(join(fakeHome, 'evidence-'))
  const fakeDurable = mkdtempSync(join(tmpdir(), 'aaclr1-fakepngd-'))
  writeExactConsumerArtifacts(fakePrivate, runId, {
    receipt: createProducerShapedConsumerReceipt({ runId }),
    desktop: zeroDimensionPng(),
    mobile: MALFORMED_MINIMAL_PNG,
  })
  const fakeReg = createOwnershipRegistry({ runId, privateHome: fakeHome, evidenceDir: fakePrivate })
  const fake = await raeumeOwnedAuf({
    privateHome: fakeHome,
    registry: fakeReg,
    evidenceDir: fakePrivate,
    browserRegistry: fakeReg.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: fakePrivate,
      destDir: fakeDurable,
      runId,
      runIdentity: identity,
      ownedRoots: [fakeHome],
      mode: 'full',
      consumerCompleted: true,
    }),
  })
  assert.equal(fake.exportFailed, true)
  assert.equal(bewerteCleanup(fake, { registry: fakeReg }), false)
  assert.equal(existsSync(fakeHome), true)
  assert.equal(readdirSync(fakeDurable).length, 0)

  const rtHome = mkdtempSync(join(tmpdir(), 'aaclr1-rt-'))
  const rtPrivate = mkdtempSync(join(rtHome, 'evidence-'))
  const rtDurable = mkdtempSync(join(tmpdir(), 'aaclr1-rtd-'))
  const rtReg = createOwnershipRegistry({ runId, privateHome: rtHome, evidenceDir: rtPrivate })
  const runtimeOnly = await raeumeOwnedAuf({
    privateHome: rtHome,
    registry: rtReg,
    evidenceDir: rtPrivate,
    browserRegistry: rtReg.browsers,
  }, {
    exportArtifacts: () => exportSanitizedRunArtifacts({
      sourceDir: rtPrivate,
      destDir: rtDurable,
      runId,
      ownedRoots: [rtHome],
      mode: 'runtime-only',
    }),
  })
  assert.equal(runtimeOnly.exportFailed, false)
  assert.equal(runtimeOnly.artifactExport.exported.length, 0)
  assert.equal(existsSync(rtHome), false)

  const receiptDir = mkdtempSync(join(tmpdir(), 'aaclr1-n4-'))
  writeEvidence(receiptDir, `${runId}-run-receipt.json`, { runId, verdict: 'ORIGINAL' })
  const originalReceipt = readFileSync(join(receiptDir, `${runId}-run-receipt.json`), 'utf8')
  assert.throws(
    () => writeEvidence(receiptDir, `${runId}-run-receipt.json`, { runId, verdict: 'REPLACEMENT' }),
    /overwrite existing durable evidence/,
  )
  assert.equal(readFileSync(join(receiptDir, `${runId}-run-receipt.json`), 'utf8'), originalReceipt)
  const firstFailure = persistFailureReceipt({
    evidenceDir: receiptDir,
    runId,
    error: new Error('first failure'),
    cleanup: {},
    matrix: {},
  })
  assert.equal(firstFailure.ok, true)
  const originalFailure = readFileSync(join(receiptDir, `${runId}-failure.json`), 'utf8')
  const secondFailure = persistFailureReceipt({
    evidenceDir: receiptDir,
    runId,
    error: new Error('second failure'),
    cleanup: {},
    matrix: {},
  })
  assert.equal(secondFailure.ok, false)
  assert.equal(secondFailure.collision, true)
  assert.equal(readFileSync(join(receiptDir, `${runId}-failure.json`), 'utf8'), originalFailure)

  const fillError = "locator.fill('SYNTHETIC-NOT-A-REAL-PASSWORD-491') timed out"
  const otpError = 'setup error otpauth://totp/test?secret=SYNTHETIC-NOT-A-REAL-TOTP-SECRET'
  const writerDir = mkdtempSync(join(tmpdir(), 'aaclr1-e1c-'))
  const fillPersist = persistFailureReceipt({
    evidenceDir: writerDir,
    runId: `${runId}-fill`,
    error: new Error(fillError),
    cleanup: { note: otpError },
    matrix: { G20_owned_cleanup: { result: 'FAIL' } },
  })
  assert.equal(fillPersist.ok, true)
  const fillFailure = JSON.parse(readFileSync(join(writerDir, `${runId}-fill-failure.json`), 'utf8'))
  assert.equal(fillFailure.error, '[redacted]')
  assert.equal(fillFailure.cleanup.note, '[redacted]')
  assert.doesNotMatch(JSON.stringify(fillFailure), /SYNTHETIC-NOT-A-REAL-PASSWORD|SYNTHETIC-NOT-A-REAL-TOTP|otpauth:\/\/|locator\.fill/)
  const otpPersist = persistFailureReceipt({
    evidenceDir: writerDir,
    runId: `${runId}-otp`,
    error: new Error(otpError),
    cleanup: {},
    matrix: {},
  })
  assert.equal(otpPersist.ok, true)
  const otpFailure = JSON.parse(readFileSync(join(writerDir, `${runId}-otp-failure.json`), 'utf8'))
  assert.equal(otpFailure.error, '[redacted]')
  assert.doesNotMatch(JSON.stringify(otpFailure), /SYNTHETIC-NOT-A-REAL-TOTP|otpauth:\/\//)

  const runnerNow = new Date('2026-09-23T18:15:00.000Z')
  const runnerId = 'aaclr1-20260923T181500Z'
  const runnerEvidence = mkdtempSync(join(tmpdir(), 'aaclr1-runner-'))
  writeFileSync(join(runnerEvidence, `${runnerId}-preflight.json`), '{"verdict":"ORIGINAL-PREFLIGHT"}\n')
  writeFileSync(join(runnerEvidence, `${runnerId}-failure.json`), '{"verdict":"ORIGINAL-FAILURE"}\n')
  let runnerError = null
  try {
    await run({
      now: runnerNow,
      evidenceDir: runnerEvidence,
      env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
      argv: [],
      execFile: (bin, args) => {
        if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
        throw new Error(`unexpected ${bin} ${args}`)
      },
      resolve: (name) => (name === 'node' ? process.execPath : null),
    })
  } catch (error) {
    runnerError = error
  }
  assert.ok(runnerError)
  assert.match(runnerError.message, /overwrite existing durable evidence/)
  assert.equal(runnerError.failureReceipt?.ok, false)
  assert.equal(runnerError.failureReceipt?.collision, true)
  assert.equal(readFileSync(join(runnerEvidence, `${runnerId}-preflight.json`), 'utf8'), '{"verdict":"ORIGINAL-PREFLIGHT"}\n')
  assert.equal(readFileSync(join(runnerEvidence, `${runnerId}-failure.json`), 'utf8'), '{"verdict":"ORIGINAL-FAILURE"}\n')
  assert.equal(existsSync(join(runnerEvidence, `${runnerId}-run-receipt.json`)), false)

  rmSync(durable, { recursive: true, force: true })
  rmSync(n1Home, { recursive: true, force: true })
  rmSync(n1Durable, { recursive: true, force: true })
  rmSync(n2Home, { recursive: true, force: true })
  rmSync(n2Durable, { recursive: true, force: true })
  rmSync(n3Home, { recursive: true, force: true })
  rmSync(n3Durable, { recursive: true, force: true })
  rmSync(n01.home, { recursive: true, force: true })
  rmSync(n01.durable, { recursive: true, force: true })
  rmSync(n02.home, { recursive: true, force: true })
  rmSync(n02.durable, { recursive: true, force: true })
  rmSync(n03.home, { recursive: true, force: true })
  rmSync(n03.durable, { recursive: true, force: true })
  rmSync(rgbaExport.durable, { recursive: true, force: true })
  rmSync(rtDurable, { recursive: true, force: true })
  rmSync(receiptDir, { recursive: true, force: true })
  rmSync(writerDir, { recursive: true, force: true })
  rmSync(fakeHome, { recursive: true, force: true })
  rmSync(fakeDurable, { recursive: true, force: true })
  rmSync(runnerEvidence, { recursive: true, force: true })
})

function officialEffectRootHelpExact() {
  return [
    'supabase <subcommand> [flags]',
    'start   Start local Supabase stack',
    'status  Show status of local Supabase containers',
    'stop    Stop all local Supabase containers',
  ].join('\n')
}

function officialEffectRootHelpHeaded() {
  return [
    'USAGE',
    '',
    '  supabase <subcommand> [flags]',
    '',
    'COMMANDS',
    '',
    '  start   Start local Supabase stack',
    '  status  Show status of local Supabase containers',
    '  stop    Stop all local Supabase containers',
    '',
  ].join('\n')
}

function officialEffectRootHelpFlagsOnlyCompatibility() {
  return [
    'supabase [flags]',
    'start  Start local Supabase stack',
    'status Show status of local Supabase containers',
    'stop   Stop all local Supabase containers',
  ].join('\n')
}

function officialCobraRootHelp() {
  return [
    'Supabase CLI',
    '',
    'Usage:',
    '  supabase [command]',
    '',
    'Local Development:',
    '  start             Start containers for Supabase local development',
    '  status            Show status of local Supabase containers',
    '  stop              Stop all local Supabase containers',
    '',
    'Flags:',
    '  -h, --help        help for supabase',
    '',
    'Use "supabase [command] --help" for more information about a command.',
    '',
  ].join('\n')
}

function historicalRootHelp() {
  return [
    'Usage:',
    '  supabase [command]',
    '',
    'supabase start',
    'supabase stop',
    'supabase status',
    '',
  ].join('\n')
}

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
      if (args[0] === 'context' && args[1] === 'show') return 'default'
      if (args[0] === 'context' && args[1] === 'inspect') return 'unix:///var/run/docker.sock'
      if (args[0] === 'context') return 'default'
      throw new Error(`unexpected docker ${args}`)
    }
    if (args?.[0] === '--version') return '2.117.0\n'
    if (args?.[0] === '--help') return officialCobraRootHelp()
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
    exists: (path) => path === '/var/run/docker.sock' || path === '/run/docker.sock',
    platform: 'linux',
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
    exists: (path) => path === '/var/run/docker.sock' || path === '/run/docker.sock',
    platform: 'linux',
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
    exists: (path) => path === '/var/run/docker.sock' || path === '/run/docker.sock',
    platform: 'linux',
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
    exists: (path) => path === '/var/run/docker.sock' || path === '/run/docker.sock',
    platform: 'linux',
    cliPins: pins.pins,
    importer: async () => ({
      runBrowserFlows: async () => ({
        contractVersion: CONTRACT_VERSION,
        gates: Object.fromEntries(BROWSER_GATES.map((id) => [id, {
          id,
          result: 'NOT RUN',
          evidence: null,
          notes: 'C2 importer is not a real sibling consumer',
        }])),
      }),
    }),
    startRuntime: async ({ cli }) => {
      fullStart = true
      assert.equal(cli.identityVerified, true)
      return { owned: {}, gates: setupBoundary, context: { runId: 'x' } }
    },
  })
  assert.equal(fullStart, true)
  assert.equal(fullMissingConsumer.mode, 'full')
  assert.equal(fullMissingConsumer.browserPresent, true)
  assert.notEqual(fullMissingConsumer.verdict, 'LOCAL_FULL_STACK_PASS')
  assert.equal(fullMissingConsumer.summary.fullLocalExecution, false)

  rmSync(workspace, { recursive: true, force: true })
})

function writeUnixSocket(dir, rel = 'docker.sock') {
  const sock = join(dir, rel)
  mkdirSync(dirname(sock), { recursive: true })
  writeFileSync(sock, '')
  return sock
}

function desktopInspectExec(host, contextName = 'desktop-linux') {
  return (bin, args) => {
    if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
    if (String(bin).includes('docker')) {
      if (args[0] === '--version') return 'Docker version 29.8.0'
      if (args[0] === 'info') {
        return 'Server Version: 29.8.0\nName: desktop-linux\n'
      }
      if (args[0] === 'context' && args[1] === 'show') return `${contextName}\n`
      if (args[0] === 'context' && args[1] === 'inspect') return `${host}\n`
    }
    throw new Error(`unexpected ${bin} ${args}`)
  }
}

test('Linux default local Unix socket is selected and verified without inheriting parent Docker vars', () => {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-linux-home-'))
  const sock = writeUnixSocket(home, 'var/run/docker.sock')
  const parent = {
    PATH: '/usr/bin',
    HOME: home,
    DOCKER_HOST: 'unix:///var/run/docker.sock',
    DOCKER_CONTEXT: 'default',
    DOCKER_CERT_PATH: '/tmp/certs',
    DOCKER_TLS_VERIFY: '1',
  }
  const selected = waehleLokalenUnixDockerEndpunkt({
    parentEnv: parent,
    platform: 'linux',
    exists: (path) => path === sock || path === '/var/run/docker.sock',
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec('unix:///var/run/docker.sock', 'default'),
  })
  assert.equal(selected.ok, true)
  assert.equal(selected.host, 'unix:///var/run/docker.sock')
  assert.equal(selected.kind, 'linux-var-run-sock')
  const isolated = baueDockerCliUmgebung({
    parentEnv: parent,
    privateHome: join(home, 'private'),
    dockerHost: selected.host,
  })
  assert.equal(isolated.DOCKER_HOST, 'unix:///var/run/docker.sock')
  assert.equal(isolated.DOCKER_CONTEXT, undefined)
  assert.equal(isolated.DOCKER_CERT_PATH, undefined)
  assert.equal(isolated.DOCKER_TLS_VERIFY, undefined)
  assert.equal(isolated.HOME, join(home, 'private'))
  const verified = verifiziereLokalenUnixDockerEndpunkt({
    selection: selected,
    isolatedEnv: isolated,
    exists: (path) => path === '/var/run/docker.sock',
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec('unix:///var/run/docker.sock', 'default'),
  })
  assert.equal(verified.verified, true)
  const capability = pruefeDockerFaehigkeit({
    env: isolated,
    exists: (path) => path === '/var/run/docker.sock',
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec('unix:///var/run/docker.sock', 'default'),
  })
  assert.equal(capability.usable, true)
  assert.equal(capability.usedExplicitLocalHost, true)
  const bare = baueRuntimePreflightUmgebung({ parentEnv: parent, privateHome: join(home, 'bare') })
  assert.equal(bare.DOCKER_HOST, undefined)
  rmSync(home, { recursive: true, force: true })
})

test('macOS Docker Desktop local Unix endpoint works with private HOME and redacted evidence', async () => {
  const parentHome = mkdtempSync(join(tmpdir(), 'aaclr1-mac-parent-'))
  const usersHome = join(parentHome, 'Users', 'fixture-user')
  const sock = writeUnixSocket(usersHome, '.docker/run/docker.sock')
  writeFileSync(join(usersHome, '.docker', 'config.json'), '{"auths":{"https://index.docker.io/v1/":{}}}\n')
  const host = `unix://${sock}`
  assert.equal(istLokalerUnixDockerHost(host), true)
  const privateHome = mkdtempSync(join(tmpdir(), 'aaclr1-mac-private-'))
  const selected = waehleLokalenUnixDockerEndpunkt({
    parentEnv: { PATH: '/usr/bin', HOME: usersHome },
    platform: 'darwin',
    exists: (path) => path === sock,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec(host, 'desktop-linux'),
  })
  assert.equal(selected.ok, true)
  assert.equal(selected.host, host)
  assert.equal(selected.source, 'docker-context')
  assert.equal(selected.contextName, 'desktop-linux')
  assert.equal(selected.kind, 'docker-desktop-unix')
  const isolated = baueDockerCliUmgebung({
    parentEnv: { PATH: '/usr/bin', HOME: usersHome, DOCKER_CONTEXT: 'desktop-linux' },
    privateHome,
    dockerHost: selected.host,
  })
  assert.equal(isolated.HOME, privateHome)
  assert.equal(isolated.DOCKER_HOST, host)
  assert.equal(isolated.DOCKER_CONTEXT, undefined)
  assert.equal(existsSync(join(privateHome, '.docker', 'config.json')), false)
  const sanitized = sanitizeDockerHost(host, { parentHome: usersHome })
  assert.equal(sanitized, 'unix://<redacted-home>/.docker/run/docker.sock')
  assert.doesNotMatch(sanitized, /fixture-user/)
  const workspace = mkdtempSync(join(tmpdir(), 'aaclr1-mac-run-'))
  const pins = writeTestCliPins(workspace)
  const invoked = []
  const result = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC', HOME: usersHome },
    argv: ['--runtime-only', '--cli-archive', pins.archivePath, '--cli-checksums', pins.checksumsPath],
    evidenceDir: join(workspace, 'evidence'),
    privateHome,
    platform: 'darwin',
    exists: (path) => path === sock,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    cliPins: pins.pins,
    execFile: (bin, args, options) => {
      invoked.push({ bin: String(bin), args: [...(args || [])], envHost: options?.env?.DOCKER_HOST, envHome: options?.env?.HOME, envContext: options?.env?.DOCKER_CONTEXT })
      if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
      if (String(bin) === 'tar' || String(bin).endsWith('/tar')) return execFileSync('tar', args, options)
      if (String(bin).includes('docker')) {
        if (args[0] === '--version') return 'Docker version 29.8.0'
        if (args[0] === 'info') {
          assert.equal(options.env.DOCKER_HOST, host)
          assert.equal(options.env.HOME, privateHome)
          assert.equal(options.env.DOCKER_CONTEXT, undefined)
          return 'Server Version: 29.8.0\nName: desktop-linux\n'
        }
        if (args[0] === 'context' && args[1] === 'show') return 'desktop-linux\n'
        if (args[0] === 'context' && args[1] === 'inspect') return `${host}\n`
        throw new Error(`unexpected docker ${args}`)
      }
      if (args?.[0] === '--version') return '2.117.0\n'
      if (args?.[0] === '--help') return officialCobraRootHelp()
      if (args?.[0] === 'start' && args?.[1] === '--help') {
        assert.equal(options.env.DOCKER_HOST, host)
        assert.equal(options.env.HOME, privateHome)
        return 'Start containers for Supabase local development\n'
      }
      throw new Error(`must not invoke ${bin} ${args}`)
    },
    startRuntime: async ({ childEnv, docker, cli }) => {
      assert.equal(childEnv.DOCKER_HOST, host)
      assert.equal(docker.usable, true)
      assert.equal(cli.identityVerified, true)
      assert.equal(cli.startHelpVerified, true)
      return {
        owned: {},
        gates: {
          G2_owned_stack: { result: 'NOT RUN', notes: 'endpoint control' },
          G3_auth_schema_not_bootstrap: { result: 'NOT RUN', notes: 'endpoint control' },
          G4_fixtures_via_gotrue: { result: 'NOT RUN', notes: 'endpoint control' },
          G5_app_boot_loopback: { result: 'NOT RUN', notes: 'endpoint control' },
        },
      }
    },
  })
  assert.equal(result.docker.usable, true)
  assert.equal(result.endpoint.verified, true)
  assert.equal(result.cli.identityVerified, true)
  assert.doesNotMatch(result.docker.endpoint.hostSanitized, /fixture-user/)
  assert.match(result.docker.endpoint.hostSanitized, /<redacted-home>|\.docker\/run\/docker\.sock/)
  assert.ok(invoked.some((item) => item.args?.[0] === 'info' && item.envHost === host))
  assert.ok(invoked.some((item) => item.args?.[0] === 'start' && item.args?.[1] === '--help' && item.envHost === host))
  assert.equal(existsSync(join(privateHome, '.docker', 'config.json')), false)
  rmSync(workspace, { recursive: true, force: true })
  rmSync(parentHome, { recursive: true, force: true })
  rmSync(privateHome, { recursive: true, force: true })
})

test('remote tcp/ssh contexts and hostile parent DOCKER_HOST fail closed', () => {
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-remote-'))
  const sock = writeUnixSocket(home, '.docker/run/docker.sock')
  const localHost = `unix://${sock}`
  const tcp = waehleLokalenUnixDockerEndpunkt({
    parentEnv: { PATH: '/usr/bin', HOME: home, DOCKER_HOST: 'tcp://203.0.113.9:2376' },
    platform: 'darwin',
    exists: (path) => path === sock,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec(localHost, 'desktop-linux'),
  })
  assert.equal(tcp.ok, false)
  assert.equal(tcp.remoteRefused, true)
  const ssh = waehleLokalenUnixDockerEndpunkt({
    parentEnv: { PATH: '/usr/bin', HOME: home, DOCKER_CONTEXT: 'ssh' },
    platform: 'linux',
    exists: () => false,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec('ssh://operator@203.0.113.9', 'ssh'),
  })
  assert.equal(ssh.ok, false)
  assert.equal(ssh.remoteRefused, true)
  const cloud = waehleLokalenUnixDockerEndpunkt({
    parentEnv: { PATH: '/usr/bin', HOME: home },
    platform: 'linux',
    exists: () => false,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec('https://cloud.example.invalid', 'cloud'),
  })
  assert.equal(cloud.ok, false)
  assert.equal(cloud.remoteRefused, true)
  assert.throws(
    () => baueRuntimePreflightUmgebung({
      parentEnv: { PATH: '/usr/bin' },
      privateHome: join(home, 'private'),
      dockerHost: 'tcp://203.0.113.9:2376',
    }),
    /local Unix Docker socket/,
  )
  const isolated = baueRuntimePreflightUmgebung({
    parentEnv: { PATH: '/usr/bin', DOCKER_HOST: 'tcp://203.0.113.9:2376', DOCKER_CONTEXT: 'desktop-linux' },
    privateHome: join(home, 'child'),
  })
  assert.equal(isolated.DOCKER_HOST, undefined)
  assert.equal(isolated.DOCKER_CONTEXT, undefined)
  rmSync(home, { recursive: true, force: true })
})

test('missing or non-responsive local endpoint blocks; CLI start-help failure is named', async () => {
  const missing = waehleLokalenUnixDockerEndpunkt({
    parentEnv: { PATH: '/usr/bin', HOME: '/tmp' },
    platform: 'darwin',
    exists: () => false,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: () => {
      throw new Error('no such file or directory')
    },
  })
  assert.equal(missing.ok, false)
  const home = mkdtempSync(join(tmpdir(), 'aaclr1-dead-'))
  const sock = writeUnixSocket(home, 'docker.sock')
  const host = `unix://${sock}`
  const selected = waehleLokalenUnixDockerEndpunkt({
    parentEnv: { PATH: '/usr/bin', HOME: home, DOCKER_HOST: host },
    platform: 'linux',
    exists: (path) => path === sock,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec(host, 'default'),
  })
  const isolated = baueDockerCliUmgebung({
    parentEnv: { PATH: '/usr/bin' },
    privateHome: join(home, 'private'),
    dockerHost: selected.host,
  })
  const dead = verifiziereLokalenUnixDockerEndpunkt({
    selection: selected,
    isolatedEnv: isolated,
    exists: (path) => path === sock,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: () => {
      throw new Error('failed to connect to the docker API at unix:///missing.sock')
    },
  })
  assert.equal(dead.verified, false)
  assert.match(dead.note, /docker info failed|non-responsive|failed to connect/)
  const gone = verifiziereLokalenUnixDockerEndpunkt({
    selection: selected,
    isolatedEnv: isolated,
    exists: () => false,
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    execFile: desktopInspectExec(host, 'default'),
  })
  assert.equal(gone.verified, false)
  assert.match(gone.note, /missing/)

  const workspace = mkdtempSync(join(tmpdir(), 'aaclr1-cli-fail-'))
  const pins = writeTestCliPins(workspace)
  const cliFail = await run({
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TZ: 'UTC' },
    argv: ['--runtime-only', '--cli-archive', pins.archivePath, '--cli-checksums', pins.checksumsPath],
    evidenceDir: join(workspace, 'evidence'),
    platform: 'linux',
    exists: (path) => path === '/var/run/docker.sock',
    resolve: (name) => (name === 'docker' ? '/usr/bin/docker' : null),
    cliPins: pins.pins,
    execFile: (bin, args, options) => {
      if (String(bin).endsWith('git') || bin === 'git') return execGit(args)
      if (String(bin) === 'tar' || String(bin).endsWith('/tar')) return execFileSync('tar', args, options)
      if (String(bin).includes('docker')) {
        if (args[0] === 'info') return 'Server Version: 24.0.0\n'
        if (args[0] === '--version') return 'Docker version 24.0.0'
        if (args[0] === 'context' && args[1] === 'show') return 'default'
        if (args[0] === 'context' && args[1] === 'inspect') return 'unix:///var/run/docker.sock'
      }
      if (args?.[0] === '--version') return '2.117.0\n'
      if (args?.[0] === '--help') return officialCobraRootHelp()
      if (args?.[0] === 'start' && args?.[1] === '--help') {
        throw new Error(`failed to connect to the docker API at ${options.env.DOCKER_HOST}`)
      }
      throw new Error(`must not invoke ${bin} ${args}`)
    },
    startRuntime: async () => {
      throw new Error('start must not run when start-help fails')
    },
  })
  assert.equal(cliFail.cli.identityVerified, false)
  assert.equal(cliFail.cli.versionVerified, true)
  assert.equal(cliFail.cli.helpVerified, true)
  assert.equal(cliFail.cli.startHelpVerified, false)
  assert.deepEqual(cliFail.cli.failedIdentityChecks, ['start-help'])
  assert.match(cliFail.cli.note, /startHelp=false/)
  assert.equal(cliFail.docker.usable, true)
  assert.equal(cliFail.matrix.G0_preflight.result, 'BLOCKED')
  rmSync(workspace, { recursive: true, force: true })
  rmSync(home, { recursive: true, force: true })
})
