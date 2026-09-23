#!/usr/bin/env node
// Bounded capability preflight. Implemented checks only.
// Official route remains Docker-API runtime + pinned local supabase + real browser.
// Presence of a version-only binary is not a usable daemon. Unpinned npx --yes
// latest install is forbidden. Missing Docker is an execution blocker, not a
// Production P0 incident.

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HOSTED_MARKER_KEYS } from './constants.mjs'
import { bauePreflightUmgebung, klassifiziereUmgebung } from './env-guard.mjs'
import { schliesseOwnedBrowser } from './owned-lifecycle.mjs'

const CONTAINER_COMMANDS = ['docker', 'podman', 'nerdctl']
const SOCKETS = [
  '/var/run/docker.sock',
  '/run/docker.sock',
  '/var/run/podman/podman.sock',
  '/run/podman/podman.sock',
]

function defaultWhich(name, env) {
  const result = spawnSync('command', ['-v', name], {
    encoding: 'utf8',
    env,
    timeout: 5_000,
  })
  return result.status === 0
}

function tryExec(execFile, bin, args, env, timeout = 15_000) {
  try {
    const out = execFile(bin, args, { encoding: 'utf8', timeout, env })
    return { ok: true, text: String(out).trim().split('\n')[0] }
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error).split('\n')[0] }
  }
}

function probeContainerRuntime({ env, execFile, which }) {
  const found = CONTAINER_COMMANDS.filter((name) => which(name, env))
  const sockets = SOCKETS.filter((path) => existsSync(path))
  const versions = {}
  const info = {}
  let usable = false
  for (const name of found) {
    versions[name] = tryExec(execFile, name, ['--version'], env)
    const daemon = tryExec(execFile, name, ['info'], env, 12_000)
    info[name] = daemon
    if (daemon.ok) usable = true
  }
  const present = found.length > 0 || sockets.length > 0
  return {
    present,
    usable,
    available: usable,
    commands: found,
    sockets,
    versions,
    info,
    note: usable
      ? 'A Docker-API compatible daemon answered info on the isolated PATH.'
      : present
        ? 'A container CLI or socket is present, but a usable local daemon was not verified. Version-only binaries are not execution readiness.'
        : 'No docker/podman/nerdctl binary and no local Docker/Podman socket.',
    severity: 'execution-blocker',
    notAProductionIncident: true,
  }
}

function probeSupabaseCli({ env, execFile, which }) {
  if (which('supabase', env)) {
    const version = tryExec(execFile, 'supabase', ['--version'], env)
    let helpVerified = false
    let helpError = null
    if (version.ok) {
      try {
        const full = execFile('supabase', ['start', '--help'], { encoding: 'utf8', timeout: 20_000, env })
        helpVerified = /Start containers for Supabase local development/.test(String(full))
      } catch (error) {
        helpError = String(error && error.message ? error.message : error).split('\n')[0]
      }
    }
    return {
      available: version.ok,
      via: 'pinned-supabase-bin',
      pinned: true,
      version: version.ok ? version.text : null,
      helpVerified,
      helpError,
      startRequiresContainerRuntime: true,
      officialRoute: 'https://supabase.com/docs/guides/local-development',
      totpDocs: 'https://supabase.com/docs/guides/auth/auth-mfa/totp',
      changelog: 'https://supabase.com/changelog',
      note: 'Pinned local supabase binary only. Unpinned npx --yes latest install is forbidden.',
    }
  }
  return {
    available: false,
    via: null,
    pinned: false,
    version: null,
    helpVerified: false,
    startRequiresContainerRuntime: true,
    officialRoute: 'https://supabase.com/docs/guides/local-development',
    totpDocs: 'https://supabase.com/docs/guides/auth/auth-mfa/totp',
    changelog: 'https://supabase.com/changelog',
    note: 'Pinned supabase binary absent. Unpinned npx --yes / remote latest resolution is forbidden. Treat as a NOT RUN tooling prerequisite, not a silent install.',
  }
}

async function defaultBrowserFactory({ profileDir, env }) {
  const { chromium } = await import('playwright')
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    timeout: 15_000,
    env,
  })
  return { context, envExplicit: true }
}

async function probeBrowser({ env, browserFactory, execFile }) {
  const chromeVersion = tryExec(execFile, 'google-chrome', ['--version'], env)
  const chromeStable = chromeVersion.ok ? chromeVersion : tryExec(execFile, 'google-chrome-stable', ['--version'], env)
  let playwright = { ok: false, error: 'not attempted' }
  const dir = mkdtempSync(join(tmpdir(), 'aacba1-browser-preflight-'))
  const handle = { context: null, profileDir: dir }
  try {
    const factory = browserFactory || defaultBrowserFactory
    const launched = await factory({ profileDir: dir, env })
    handle.context = launched.context
    const page = (typeof handle.context.pages === 'function' && handle.context.pages()[0])
      || (handle.context.newPage ? await handle.context.newPage() : null)
    if (!page?.goto) throw new Error('browser factory returned no page')
    await page.goto('about:blank', { timeout: 8_000 })
    playwright = {
      ok: true,
      channel: 'chrome',
      isolatedUserDataDir: true,
      envExplicit: true,
    }
  } catch (error) {
    playwright = { ok: false, error: String(error && error.message ? error.message : error) }
  }
  const closeReport = await schliesseOwnedBrowser(handle)
  return {
    chromeBinary: chromeStable.ok,
    chromeVersion: chromeStable.ok ? chromeStable.text : null,
    playwrightIsolated: playwright.ok,
    playwright,
    closeReport,
    available: chromeStable.ok && playwright.ok && closeReport.closed,
    screenshotCliNotUsed: true,
    note: 'Use Playwright launchPersistentContext with a run-owned user-data-dir and an explicit child env. Close is required on every path before profile removal. A shared Chrome user-data-dir screenshot hung in this environment and is not the acceptance path.',
  }
}

export async function runPreflight({
  env,
  privateHome,
  execFile = execFileSync,
  which = defaultWhich,
  browserFactory,
} = {}) {
  const parentEnv = env ?? process.env
  const home = privateHome || mkdtempSync(join(tmpdir(), 'aacba1-preflight-home-'))
  const childEnv = bauePreflightUmgebung({ parentEnv, privateHome: home })
  const parentClass = klassifiziereUmgebung(parentEnv)
  const childClass = klassifiziereUmgebung(childEnv)

  const container = probeContainerRuntime({ env: childEnv, execFile, which })
  const supabase = probeSupabaseCli({ env: childEnv, execFile, which })
  const browser = await probeBrowser({
    env: childEnv,
    browserFactory,
    execFile,
  })
  const node = tryExec(execFile, 'node', ['--version'], childEnv)
  const hostedMarkers = HOSTED_MARKER_KEYS.filter((key) => parentEnv[key] != null && String(parentEnv[key]) !== '')

  const blockers = []
  if (!container.usable) {
    blockers.push({
      id: 'container-runtime',
      exact: container.present
        ? 'Container CLI/socket present but a usable local Docker-compatible daemon was not verified.'
        : 'No Docker-compatible runtime or local Docker API socket.',
      command: 'command -v docker; docker info; ls /var/run/docker.sock',
      error: container.present ? 'daemon unverified' : 'command not found / socket absent',
      policy: 'Official Supabase local-development requires a usable container manager. Privileged container/daemon setup, remote Docker context, and hosted Supabase fallback are forbidden.',
      severity: 'execution-blocker',
      notAProductionIncident: true,
    })
  }
  if (!supabase.available) {
    blockers.push({
      id: 'supabase-cli',
      exact: 'Pinned local supabase binary is not available. Unpinned npx --yes latest is forbidden.',
      severity: 'execution-blocker',
      notAProductionIncident: true,
    })
  }
  if (!browser.available) {
    blockers.push({
      id: 'real-browser',
      exact: 'Isolated Playwright + system Chrome launch failed or close was not proved.',
      error: browser.playwright.error || browser.closeReport?.error || 'chrome missing',
      severity: 'execution-blocker',
      notAProductionIncident: true,
    })
  }

  const canRunFullStack = false
  const toolingReadyForLaterImplementation = blockers.length === 0
  return {
    at: new Date().toISOString(),
    selectedRoute: 'official-supabase-cli-local-development + docker-api-runtime + playwright-chrome',
    implementation: 'preflight-and-source-only',
    canRunFullStack,
    toolingReadyForLaterImplementation,
    blockers,
    container,
    supabase,
    browser,
    node: { available: node.ok, version: node.ok ? node.text : null },
    environment: {
      hostedMarkersPresent: hostedMarkers,
      parentHasHostedSupabaseNames: parentClass.parentHasHostedSupabaseNames,
      childHasHostedSupabaseNames: childClass.parentHasHostedSupabaseNames,
      childForbiddenKeyCount: childClass.forbiddenConnectionKeysPresent.length,
      forbiddenConnectionKeyCount: parentClass.forbiddenConnectionKeysPresent.length,
      outboundProviderKeyCount: parentClass.outboundProviderKeysPresent.length,
      usedAllowlistedChildEnv: true,
      privateHome: true,
      note: 'Parent process may contain hosted connector names. Classification uses names only. Actual subprocesses receive a rebuilt allowlisted environment with a private HOME and no inherited connector/database/provider credentials.',
    },
    limitations: [
      'This command does not start a stack, provision GoTrue, or drive the application even if tooling is present.',
      'Exact self-hosted gateway/image versions are NOT RUN until an owned `supabase start` is implemented and succeeds.',
      'Do not assume historical Compose or Kong defaults.',
      'Hosted Production/Development and the parent connector credentials are unused.',
      'Missing Docker is an execution blocker, not a Production P0 incident.',
    ],
    childEnvKeys: Object.keys(childEnv).sort(),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runPreflight()
  console.log(JSON.stringify({
    canRunFullStack: result.canRunFullStack,
    toolingReadyForLaterImplementation: result.toolingReadyForLaterImplementation,
    blockers: result.blockers.map((item) => item.id),
    supabaseVersion: result.supabase.version,
    chromeVersion: result.browser.chromeVersion,
    nodeVersion: result.node.version,
  }, null, 2))
  process.exit(result.canRunFullStack ? 0 : 2)
}
