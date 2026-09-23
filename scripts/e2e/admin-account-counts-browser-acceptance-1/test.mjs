#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { COPY, BLOB_PINS, PINS, SOURCE_PATHS } from './constants.mjs'
import { assertPinnedSources, leseSourceManifest, refuseBootstrapOverlay, workingTreeBlob } from './source-manifest.mjs'
import {
  assertIsolatedConnectionEnvironment,
  baueKindUmgebung,
  bauePreflightUmgebung,
  klassifiziereUmgebung,
} from './env-guard.mjs'
import {
  darfOwnedVerzeichnisEntfernen,
  schliesseOwnedBrowser,
  stoppeOwnedChild,
} from './owned-lifecycle.mjs'
import { GATE_IDS, leereMatrix, setzeGate, zusammenfassung } from './gates.mjs'
import { baueConfigOverlay, DISCLOSED_OVERLAY, geplanteSqlAnwendung, starteOwnedStack } from './stack.mjs'
import { FIXTURE_PLAN, emailFor, provisioniereUeberGoTrue, sanitizeFixtureManifest } from './fixtures.mjs'
import { cleanupDryRunKontrolle, raeumeOwnedAuf } from './cleanup.mjs'
import { generateTotp, looksLikeTotpCode } from './totp.mjs'
import { kannServerSeitigesRpcSchweigenBeweisen, fuehreBrowserAkzeptanz } from './browser.mjs'
import { IMPLEMENTATION } from './implementation.mjs'
import { runPreflight } from './preflight.mjs'
import { defaultWhich, findeAusfuehrbare } from './resolve-executable.mjs'
import { run } from './run.mjs'

const IGNORE_TERM = "process.on('SIGTERM',()=>{}); process.stdout.write('ready\\n'); setInterval(()=>{},1000)"
const NORMAL_CHILD = "process.stdout.write('ready\\n'); setInterval(()=>{},1000)"
const QUICK_EXIT = "process.stdout.write('ready\\n'); process.exit(0)"

async function withOwnedChild(script, fn, { injectThrow = false } = {}) {
  const child = spawn(process.execPath, ['-e', script], {
    env: { PATH: '/usr/bin' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  try {
    await once(child.stdout, 'data')
    if (injectThrow) {
      child.kill = () => {
        throw Object.assign(new Error('synthetic signal failure'), { code: 'EPERM' })
      }
    }
    return await fn(child)
  } finally {
    if (child.exitCode == null && child.signalCode == null && child.pid) {
      const closed = once(child, 'close')
      try {
        process.kill(child.pid, 'SIGKILL')
      } catch {
        /* independent teardown */
      }
      await closed
    }
  }
}

test('accepted working-tree source pins match the full applicable set', () => {
  const manifest = leseSourceManifest()
  assert.equal(assertPinnedSources(manifest), true)
  assert.equal(manifest.identityKind, 'working-tree-git-hash-object')
  assert.equal(manifest.files.producer.sha256, PINS.producerSha256)
  assert.equal(manifest.files.wrapper.sha256, PINS.wrapperSha256)
  assert.equal(manifest.files.guard.workingTreeBlob, BLOB_PINS.guard)
  assert.equal(manifest.files.server.workingTreeBlob, BLOB_PINS.server)
  assert.equal(manifest.files.config.workingTreeBlob, BLOB_PINS.config)
  assert.equal(manifest.files.countsUi.workingTreeBlob, BLOB_PINS.countsUi)
  assert.equal(manifest.files.client.workingTreeBlob, BLOB_PINS.client)
  assert.equal(manifest.migrations.replay, 'NOT IMPLEMENTED')
})

test('refuses the reduced #550 bootstrap as a GoTrue overlay', () => {
  assert.throws(
    () => refuseBootstrapOverlay({ plannedSqlPaths: [SOURCE_PATHS.bootstrap], target: 'gotrue' }),
    /Refusing to overlay/,
  )
  assert.deepEqual(geplanteSqlAnwendung(), [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper])
})

test('wrong guard/server/config working-tree fingerprints fail even with correct core pins', () => {
  const manifest = leseSourceManifest()
  manifest.files.guard.workingTreeBlob = '0'.repeat(40)
  manifest.files.server.workingTreeBlob = '1'.repeat(40)
  manifest.files.config.workingTreeBlob = '2'.repeat(40)
  assert.throws(() => assertPinnedSources(manifest), /guard working-tree blob/)
})

test('assertPinnedSources uses working-tree bytes, not committed HEAD names', () => {
  const manifest = leseSourceManifest()
  manifest.files.guard.committedBlob = BLOB_PINS.guard
  manifest.files.guard.workingTreeBlob = 'ab'.repeat(20)
  manifest.files.guard.dirtyWorktree = true
  assert.throws(() => assertPinnedSources(manifest), /working tree differs|working-tree blob/)
})

test('isolated dirty-worktree control fails without committing product edits', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'aacba1-dirty-'))
  try {
    const rel = SOURCE_PATHS.guard
    mkdirSync(join(tmp, 'lib/auth'), { recursive: true })
    writeFileSync(join(tmp, rel), 'export const dirty = true\n')
    const dirtyBlob = workingTreeBlob(rel, tmp)
    assert.notEqual(dirtyBlob, BLOB_PINS.guard)
    const manifest = {
      files: Object.fromEntries(
        Object.entries(BLOB_PINS).map(([key, blob]) => [
          key,
          {
            path: SOURCE_PATHS[key],
            workingTreeBlob: key === 'guard' ? dirtyBlob : blob,
            committedBlob: blob,
            dirtyWorktree: key === 'guard',
            ...(key === 'producer' ? { sha256: PINS.producerSha256 } : {}),
            ...(key === 'wrapper' ? { sha256: PINS.wrapperSha256 } : {}),
            ...(key === 'bootstrap' ? { sha256: PINS.bootstrapSha256 } : {}),
          },
        ]),
      ),
      migrations: { replay: 'NOT IMPLEMENTED', files: [] },
    }
    assert.throws(() => assertPinnedSources(manifest), /dirty|working-tree/)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('child env rejects remote URLs, strips hosted names, and refuses passthrough', () => {
  assert.throws(
    () => baueKindUmgebung({ loopbackUrl: 'https://example.supabase.co', syntheticAnonKey: 'test-anon' }),
    /Loopback/,
  )
  assert.throws(
    () =>
      baueKindUmgebung({
        parentEnv: { PATH: '/usr/bin' },
        loopbackUrl: 'http://127.0.0.1:54321',
        syntheticAnonKey: 'synthetic-local',
        extra: {
          passthrough: {
            NEXT_PUBLIC_SUPABASE_URL: 'https://target.invalid',
            SUPABASE_ACCESS_TOKEN: 'synthetic-reintroduced',
            OPENAI_API_KEY: 'synthetic-reintroduced',
          },
        },
      }),
    /passthrough/,
  )
  const home = mkdtempSync(join(tmpdir(), 'aacba1-kind-home-'))
  const kind = baueKindUmgebung({
    parentEnv: {
      PATH: '/usr/bin',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ACCESS_TOKEN: 'parent-token',
      OPENAI_API_KEY: 'parent-model',
      VERCEL: '1',
    },
    loopbackUrl: 'http://127.0.0.1:54321',
    syntheticAnonKey: 'synthetic-local-anon',
    extra: { siteUrl: 'http://127.0.0.1:3000' },
    privateHome: home,
  })
  assert.equal(kind.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321')
  assert.equal(kind.SUPABASE_ACCESS_TOKEN, undefined)
  assert.equal(kind.OPENAI_API_KEY, undefined)
  assert.equal(kind.VERCEL, undefined)
  assert.equal(kind.HOME, home)
  assert.equal(kind.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED, 'true')
  rmSync(home, { recursive: true, force: true })
})

test('isolated connection guard names forbidden keys without printing values', () => {
  assert.throws(
    () => assertIsolatedConnectionEnvironment({ DATABASE_URL: 'postgres://example' }, []),
    /DATABASE_URL/,
  )
  const klass = klassifiziereUmgebung({
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    VERCEL: '1',
  })
  assert.equal(klass.parentHasHostedSupabaseNames, true)
  assert.deepEqual(klass.hostedMarkersPresent, ['VERCEL'])
})

test('actual subprocess does not inherit parent hosted markers', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aacba1-env-child-'))
  const parentEnv = {
    PATH: '/usr/bin',
    LANG: 'C.UTF-8',
    SUPABASE_ACCESS_TOKEN: 'TL_SYNTHETIC_NOT_A_REAL_TOKEN',
    OPENAI_API_KEY: 'TL_SYNTHETIC_NOT_A_REAL_KEY',
  }
  const kind = bauePreflightUmgebung({ parentEnv, privateHome: home })
  const witness = join(home, 'witness.json')
  const child = spawn(
    process.execPath,
    [
      '-e',
      'require("fs").writeFileSync(process.argv[1], JSON.stringify({hasToken:process.env.SUPABASE_ACCESS_TOKEN!=null,hasOpenAi:process.env.OPENAI_API_KEY!=null,home:process.env.HOME}))',
      witness,
    ],
    { env: kind, stdio: 'ignore' },
  )
  await once(child, 'exit')
  const seen = JSON.parse(readFileSync(witness, 'utf8'))
  assert.equal(seen.hasToken, false)
  assert.equal(seen.hasOpenAi, false)
  assert.equal(seen.home, home)
  rmSync(home, { recursive: true, force: true })
})

test('runPreflight exec uses allowlisted env, not process secrets or unpinned npx --yes', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aacba1-preflight-env-'))
  const seen = []
  const result = await runPreflight({
    env: {
      PATH: '/usr/bin',
      SUPABASE_ACCESS_TOKEN: 'TL_SYNTHETIC_NOT_A_REAL_TOKEN',
    },
    privateHome: home,
    which: () => false,
    execFile: (bin, args, opts) => {
      seen.push({
        bin,
        args,
        hasToken: Boolean(opts?.env?.SUPABASE_ACCESS_TOKEN),
        envIsProcess: opts?.env === process.env,
        yes: args.includes('--yes'),
      })
      if (bin === 'node' && args[0] === '--version') return process.version
      throw new Error('synthetic missing tool')
    },
    browserFactory: async () => {
      throw new Error('synthetic browser skip')
    },
  })
  assert.equal(seen.length > 0, true)
  assert.equal(seen.every((item) => item.hasToken === false), true)
  assert.equal(seen.every((item) => item.envIsProcess === false), true)
  assert.equal(seen.every((item) => item.yes === false), true)
  assert.equal(result.canRunFullStack, false)
  assert.equal(result.environment.usedAllowlistedChildEnv, true)
  assert.equal(result.supabase.available, false)
  rmSync(home, { recursive: true, force: true })
})

test('version-only docker is not a usable local runtime', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aacba1-docker-version-'))
  const result = await runPreflight({
    env: { PATH: '/usr/bin' },
    privateHome: home,
    which: (name) => name === 'docker' || name === 'node',
    execFile: (bin, args) => {
      if (bin === 'docker' && args[0] === '--version') return 'Docker version 28.0.0, build synthetic'
      if (bin === 'docker' && args[0] === 'info') throw new Error('Cannot connect to the Docker daemon')
      if (bin === 'node') return process.version
      throw new Error(`unexpected ${bin}`)
    },
    browserFactory: async () => {
      throw new Error('synthetic browser skip')
    },
  })
  assert.equal(result.container.present, true)
  assert.equal(result.container.usable, false)
  assert.equal(result.canRunFullStack, false)
  assert.equal(result.toolingReadyForLaterImplementation, false)
  assert.equal(result.container.notAProductionIncident, true)
  assert.equal(result.blockers.some((item) => item.id === 'container-runtime'), true)
  rmSync(home, { recursive: true, force: true })
})

test('cleanup refuses to delete while an owned process remains active', () => {
  const probe = cleanupDryRunKontrolle()
  assert.equal(probe.blocked, false)
  assert.equal(probe.allowed, true)
  assert.equal(probe.unused, true)
  assert.equal(probe.signalFailureBlocked, true)
  assert.equal(probe.dockerUnverifiedBlocked, true)
  assert.equal(
    darfOwnedVerzeichnisEntfernen({ processesStopped: false, reaped: false, neverStarted: false }),
    false,
  )
})

test('ignored SIGTERM is not treated as exit; deletion requires confirmed termination', async () => {
  await withOwnedChild(IGNORE_TERM, async (child) => {
    const report = await stoppeOwnedChild(child, { termTimeoutMs: 70, killTimeoutMs: 200 })
    if (report.reaped) {
      assert.ok(child.exitCode != null || child.signalCode != null)
      assert.equal(report.killSent, true)
      assert.throws(() => process.kill(child.pid, 0))
      assert.equal(
        darfOwnedVerzeichnisEntfernen({
          processesStopped: true,
          reaped: true,
          neverStarted: false,
          ownershipRetained: false,
        }),
        true,
      )
    } else {
      process.kill(child.pid, 0)
      assert.equal(report.ownershipRetained, true)
      assert.equal(
        darfOwnedVerzeichnisEntfernen({
          processesStopped: report.reaped,
          reaped: report.reaped,
          neverStarted: report.neverStarted,
          ownershipRetained: report.ownershipRetained,
        }),
        false,
      )
    }
  })
})

test('thrown signal is not reported as reaped while the child lives', async () => {
  await withOwnedChild(IGNORE_TERM, async (child) => {
    const report = await stoppeOwnedChild(child, { termTimeoutMs: 70, killTimeoutMs: 80 })
    process.kill(child.pid, 0)
    assert.equal(report.reaped, false)
    assert.equal(report.killSent, false)
    assert.equal(report.signalError != null, true)
    assert.equal(child.exitCode, null)
    assert.equal(child.signalCode, null)
    assert.equal(
      darfOwnedVerzeichnisEntfernen({
        processesStopped: report.reaped,
        reaped: report.reaped,
        neverStarted: report.neverStarted,
        ownershipRetained: report.ownershipRetained,
      }),
      false,
    )
  }, { injectThrow: true })
})

test('already-exited and never-started children are honest', async () => {
  const none = await stoppeOwnedChild(null)
  assert.equal(none.neverStarted, true)
  assert.equal(none.reaped, true)
  assert.equal(darfOwnedVerzeichnisEntfernen({ processesStopped: true, reaped: true, neverStarted: true }), true)

  const child = spawn(process.execPath, ['-e', QUICK_EXIT], {
    env: { PATH: '/usr/bin' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await once(child, 'exit')
  const report = await stoppeOwnedChild(child)
  assert.equal(report.reaped, true)
  assert.equal(report.neverStarted, false)
  assert.equal(report.exitCode, 0)
})

test('normal TERM stop confirms exit before deletion is allowed', async () => {
  await withOwnedChild(NORMAL_CHILD, async (child) => {
    const report = await stoppeOwnedChild(child, { termTimeoutMs: 400, killTimeoutMs: 400 })
    assert.equal(report.reaped, true)
    assert.equal(report.ownershipRetained, false)
    assert.equal(
      darfOwnedVerzeichnisEntfernen({
        processesStopped: report.reaped,
        reaped: report.reaped,
        neverStarted: report.neverStarted,
        ownershipRetained: report.ownershipRetained,
      }),
      true,
    )
  })
})

test('browser close failure retains the profile directory', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aacba1-browser-close-'))
  writeFileSync(join(dir, 'keep'), '1')
  const report = await schliesseOwnedBrowser({
    context: {
      close: async () => {
        throw new Error('synthetic close failure')
      },
    },
    profileDir: dir,
  })
  assert.equal(report.closeCalled, true)
  assert.equal(report.closed, false)
  assert.equal(report.profileRemoved, false)
  assert.equal(existsSync(join(dir, 'keep')), true)
  rmSync(dir, { recursive: true, force: true })
})

test('preflight closes the owned browser after a controlled navigation failure', async () => {
  const home = mkdtempSync(join(tmpdir(), 'aacba1-browser-nav-'))
  let closeCalled = false
  let profileDir = null
  const result = await runPreflight({
    env: { PATH: '/usr/bin' },
    privateHome: home,
    which: () => false,
    execFile: (bin, args) => {
      if (bin === 'node') return process.version
      if (bin === 'google-chrome' || bin === 'google-chrome-stable') return 'Google Chrome 148.0.0.0'
      throw new Error('synthetic missing')
    },
    browserFactory: async ({ profileDir: dir }) => {
      profileDir = dir
      return {
        context: {
          pages: () => [],
          newPage: async () => ({
            goto: async () => {
              throw new Error('synthetic navigation error')
            },
          }),
          close: async () => {
            closeCalled = true
          },
        },
        envExplicit: true,
      }
    },
  })
  assert.equal(closeCalled, true)
  assert.equal(result.browser.closeReport.closeCalled, true)
  assert.equal(result.browser.closeReport.closed, true)
  assert.equal(result.browser.playwright.ok, false)
  if (profileDir && existsSync(profileDir)) {
    rmSync(profileDir, { recursive: true, force: true })
  }
  rmSync(home, { recursive: true, force: true })
})

test('historical blocked receipt shape stays fail-closed and is not a full-stack PASS', () => {
  const matrix = leereMatrix('NOT RUN')
  setzeGate(matrix, 'G0_preflight', { result: 'BLOCKED' })
  setzeGate(matrix, 'G1_source_pins', { result: 'PASS' })
  setzeGate(matrix, 'G20_owned_cleanup', { result: 'PASS' })
  const summary = zusammenfassung(matrix)
  assert.equal(summary.fullLocalExecution, false)
  assert.equal(summary.preflightBlocked, true)
  assert.equal(summary.applicationRan, false)
  assert.equal(summary.counts['NOT RUN'], GATE_IDS.length - 3)
})

test('whole acceptance ignores neither prerequisite nor cleanup failures', () => {
  for (const id of ['G0_preflight', 'G1_source_pins', 'G20_owned_cleanup']) {
    const matrix = leereMatrix('PASS')
    setzeGate(matrix, id, { result: id === 'G0_preflight' ? 'BLOCKED' : 'FAIL' })
    assert.equal(zusammenfassung(matrix).fullLocalExecution, false)
  }
  const unknown = leereMatrix('PASS')
  delete unknown.G5_app_boot_loopback
  assert.equal(zusammenfassung(unknown).fullLocalExecution, false)
  const allPass = leereMatrix('PASS')
  assert.equal(zusammenfassung(allPass).fullLocalExecution, true)
})

test('this command does not implement stack, fixtures, or browser acceptance', async () => {
  assert.equal(IMPLEMENTATION.stackStart, 'NOT IMPLEMENTED')
  assert.equal(IMPLEMENTATION.browserAcceptance, 'NOT IMPLEMENTED')
  assert.equal(kannServerSeitigesRpcSchweigenBeweisen(), false)
  await assert.rejects(starteOwnedStack, /NOT IMPLEMENTED/)
  await assert.rejects(provisioniereUeberGoTrue, /NOT IMPLEMENTED/)
  await assert.rejects(fuehreBrowserAkzeptanz, /NOT IMPLEMENTED/)
})

test('fixture plan is not the old HTTP 10/0 proof', () => {
  assert.equal(FIXTURE_PLAN.notAssumed.presentRegisteredAccounts, null)
  assert.equal(FIXTURE_PLAN.deletedAnonymousNoSubject.planned, false)
  const sanitized = sanitizeFixtureManifest(FIXTURE_PLAN, { runId: 'run-test' })
  assert.equal(sanitized.expectedCounts.source, 'pending-owned-stack')
  assert.equal(emailFor('privileged-moderator', 'run-test').endsWith('@aacba1.invalid'), true)
  assert.equal(sanitized.accounts.some((account) => account.status === 'banned'), true)
})

test('TOTP helper returns a 6-digit code from a known RFC fixture', () => {
  const code = generateTotp('JBSWY3DPEHPK3PXP', { now: 1_111_111_111_000 })
  assert.equal(looksLikeTotpCode(code), true)
  assert.equal(code.length, 6)
})

test('config overlay keeps MFA/password/captcha and discloses seed/studio changes', () => {
  const accepted = [
    'project_id = "jetnity"',
    '[api]',
    'port = 54321',
    '[db]',
    'port = 54322',
    'major_version = 17',
    '[auth]',
    'site_url = "http://localhost:3000"',
    'minimum_password_length = 12',
    '[auth.captcha]',
    'enabled = false',
    '[auth.mfa.totp]',
    'enroll_enabled = true',
    '[studio]',
    'enabled = true',
    '[db.seed]',
    'enabled = true',
  ].join('\n')
  const overlay = baueConfigOverlay(accepted, {
    projectId: 'aacba1-test',
    apiPort: 40121,
    dbPort: 40122,
    siteUrl: 'http://127.0.0.1:40300',
  })
  assert.match(overlay, /project_id = "aacba1-test"/)
  assert.match(overlay, /port = 40121/)
  assert.match(overlay, /minimum_password_length = 12/)
  assert.match(overlay, /enroll_enabled = true/)
  assert.match(overlay, /\[studio\]\nenabled = false/)
  assert.match(overlay, /\[db\.seed\]\nenabled = false/)
  assert.equal(DISCLOSED_OVERLAY.keptAuthBehavior.includes('auth.captcha.enabled=false'), true)
})

test('honest unavailable copy is not a zero', () => {
  assert.doesNotMatch(COPY.unavailable, /\b0\b/)
  assert.doesNotMatch(COPY.failed, /\b0\b/)
})

function writeTempExecutable(dir, name, body) {
  const path = join(dir, name)
  writeFileSync(path, `#!/bin/sh\n${body}\n`, { mode: 0o755 })
  return path
}

test('default discovery is shell-free and finds harmless PATH executables', () => {
  const bin = mkdtempSync(join(tmpdir(), 'aacba1-default-which-'))
  try {
    writeTempExecutable(bin, 'docker', 'exit 0')
    writeTempExecutable(bin, 'supabase', 'exit 0')
    const env = { PATH: bin }
    assert.equal(defaultWhich('docker', env), true)
    assert.equal(findeAusfuehrbare('docker', env), join(bin, 'docker'))
    assert.equal(findeAusfuehrbare('supabase', env), join(bin, 'supabase'))
    assert.equal(findeAusfuehrbare('nerdctl', env), null)
    assert.equal(findeAusfuehrbare('docker', { PATH: '' }), null)
  } finally {
    rmSync(bin, { recursive: true, force: true })
  }
})

test('default preflight records resolved PATH binaries without treating them as pins', async () => {
  const bin = mkdtempSync(join(tmpdir(), 'aacba1-default-path-'))
  const home = mkdtempSync(join(tmpdir(), 'aacba1-default-home-'))
  try {
    writeTempExecutable(
      bin,
      'docker',
      'if [ "$1" = "--version" ]; then echo "Docker version 28.0.0, build synthetic"; exit 0; fi; echo "Cannot connect to the Docker daemon" >&2; exit 1',
    )
    writeTempExecutable(
      bin,
      'supabase',
      'if [ "$1" = "--version" ]; then echo "2.0.0"; exit 0; fi; if [ "$1" = "start" ]; then echo "Start containers for Supabase local development"; exit 0; fi; exit 1',
    )
    const result = await runPreflight({
      env: { PATH: bin, LANG: 'C' },
      privateHome: home,
    })
    assert.equal(result.container.resolved.docker, join(bin, 'docker'))
    assert.equal(result.container.status, 'present-unusable')
    assert.equal(result.container.usable, false)
    assert.equal(result.supabase.resolved, join(bin, 'supabase'))
    assert.equal(result.supabase.version, '2.0.0')
    assert.equal(result.supabase.helpVerified, true)
    assert.equal(result.supabase.identityVerified, false)
    assert.equal(result.supabase.pinned, false)
    assert.equal(result.browser.launched, false)
    assert.equal(result.toolingReadyForLaterImplementation, false)
  } finally {
    rmSync(bin, { recursive: true, force: true })
    rmSync(home, { recursive: true, force: true })
  }
})

test('failed supabase help probe is not toolingReady', async () => {
  const bin = mkdtempSync(join(tmpdir(), 'aacba1-help-fail-'))
  const home = mkdtempSync(join(tmpdir(), 'aacba1-help-home-'))
  try {
    writeTempExecutable(bin, 'supabase', 'if [ "$1" = "--version" ]; then echo "2.0.0"; exit 0; fi; exit 1')
    const result = await runPreflight({
      env: { PATH: bin, LANG: 'C' },
      privateHome: home,
    })
    assert.equal(result.supabase.helpVerified, false)
    assert.equal(result.supabase.identityVerified, false)
    assert.equal(result.toolingReadyForLaterImplementation, false)
    assert.equal(result.blockers.some((item) => item.id === 'supabase-cli'), true)
  } finally {
    rmSync(bin, { recursive: true, force: true })
    rmSync(home, { recursive: true, force: true })
  }
})

test('empty cleanup state is unknown, not a G20 never-started PASS', async () => {
  const report = await raeumeOwnedAuf({})
  assert.equal(report.unknown, true)
  assert.equal(report.neverStarted, false)
  assert.equal(report.ownershipRetained, true)
})

test('nonsettling browser close is bounded and retains the profile', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aacba1-hang-close-'))
  writeFileSync(join(dir, 'keep'), '1')
  const started = Date.now()
  const report = await schliesseOwnedBrowser({
    context: { close: () => new Promise(() => {}) },
    profileDir: dir,
  }, { closeTimeoutMs: 80 })
  assert.equal(Date.now() - started < 500, true)
  assert.equal(report.closeCalled, true)
  assert.equal(report.closed, false)
  assert.equal(report.timedOut, true)
  assert.equal(report.ownershipRetained, true)
  assert.equal(report.profileRemoved, false)
  assert.equal(existsSync(join(dir, 'keep')), true)
  rmSync(dir, { recursive: true, force: true })
})

test('orchestrator G20 cleans skipped-browser preflight HOME', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aacba1-orch-ok-'))
  const home = mkdtempSync(join(tmpdir(), 'aacba1-orch-home-'))
  const result = await run({
    env: { PATH: '/usr/bin', LANG: 'C' },
    evidenceDir: evidence,
    now: new Date('2026-09-23T11:00:00Z'),
    preflightOptions: { privateHome: home },
  })
  assert.equal(result.preflight.browser.launched, false)
  assert.equal(result.matrix.G20_owned_cleanup.result, 'PASS')
  assert.equal(result.cleanup.privateHomeRemoved, true)
  assert.equal(existsSync(home), false)
  assert.equal(result.verdict, 'BLOCKED_ENVIRONMENT')
  assert.equal(result.summary.fullLocalExecution, false)
  rmSync(evidence, { recursive: true, force: true })
})

test('orchestrator G20 fails on rejected close and retains private HOME', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aacba1-orch-rej-'))
  const home = mkdtempSync(join(tmpdir(), 'aacba1-orch-rej-home-'))
  try {
    const result = await run({
      env: { PATH: '/usr/bin', LANG: 'C' },
      evidenceDir: evidence,
      now: new Date('2026-09-23T11:01:00Z'),
      preflightOptions: {
        privateHome: home,
        closeTimeoutMs: 80,
        browserFactory: async ({ profileDir }) => ({
          context: {
            pages: () => [{ goto: async () => {} }],
            close: async () => {
              throw new Error('synthetic close rejection')
            },
          },
          envExplicit: true,
        }),
      },
    })
    assert.equal(result.matrix.G20_owned_cleanup.result, 'FAIL')
    assert.equal(result.verdict, 'CLEANUP_FAIL')
    assert.equal(result.cleanup.ownershipRetained, true)
    assert.equal(existsSync(home), true)
  } finally {
    if (existsSync(home)) rmSync(home, { recursive: true, force: true })
    rmSync(evidence, { recursive: true, force: true })
  }
})

test('orchestrator G20 fails on nonsettling close without hanging', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aacba1-orch-hang-'))
  const home = mkdtempSync(join(tmpdir(), 'aacba1-orch-hang-home-'))
  try {
    const started = Date.now()
    const result = await run({
      env: { PATH: '/usr/bin', LANG: 'C' },
      evidenceDir: evidence,
      now: new Date('2026-09-23T11:02:00Z'),
      preflightOptions: {
        privateHome: home,
        closeTimeoutMs: 80,
        browserFactory: async () => ({
          context: {
            pages: () => [{ goto: async () => {} }],
            close: () => new Promise(() => {}),
          },
          envExplicit: true,
        }),
      },
    })
    assert.equal(Date.now() - started < 2000, true)
    assert.equal(result.matrix.G20_owned_cleanup.result, 'FAIL')
    assert.equal(result.preflight.owned.closeReport.timedOut, true)
    assert.equal(existsSync(home), true)
  } finally {
    if (existsSync(home)) rmSync(home, { recursive: true, force: true })
    rmSync(evidence, { recursive: true, force: true })
  }
})

test('orchestrator G20 passes after navigation failure when close is confirmed', async () => {
  const evidence = mkdtempSync(join(tmpdir(), 'aacba1-orch-nav-'))
  const home = mkdtempSync(join(tmpdir(), 'aacba1-orch-nav-home-'))
  const result = await run({
    env: { PATH: '/usr/bin', LANG: 'C' },
    evidenceDir: evidence,
    now: new Date('2026-09-23T11:03:00Z'),
    preflightOptions: {
      privateHome: home,
      closeTimeoutMs: 200,
      browserFactory: async () => ({
        context: {
          pages: () => [],
          newPage: async () => ({
            goto: async () => {
              throw new Error('synthetic navigation error')
            },
          }),
          close: async () => {},
        },
        envExplicit: true,
      }),
    },
  })
  assert.equal(result.preflight.browser.playwright.ok, false)
  assert.equal(result.preflight.owned.closeReport.closed, true)
  assert.equal(result.matrix.G20_owned_cleanup.result, 'PASS')
  assert.equal(existsSync(home), false)
  assert.notEqual(result.verdict, 'LOCAL_FULL_STACK_PASS')
  rmSync(evidence, { recursive: true, force: true })
})

