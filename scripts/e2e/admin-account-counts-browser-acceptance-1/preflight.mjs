#!/usr/bin/env node
// Bounded capability preflight. Implemented checks only.
// Register owned HOME/browser handles before fallible work. Do not launch a
// browser when container/CLI prerequisites already block. A PATH binary is
// not a version pin. Missing Docker is an execution blocker, not a Production
// P0 incident.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BROWSER_CLOSE_TIMEOUT_MS, HOSTED_MARKER_KEYS, PERMITTED_TOOL_IDENTITY } from './constants.mjs'
import { bauePreflightUmgebung, klassifiziereUmgebung } from './env-guard.mjs'
import { schliesseOwnedBrowser } from './owned-lifecycle.mjs'
import { defaultWhich, findeAusfuehrbare } from './resolve-executable.mjs'
import { raeumeOwnedAuf } from './cleanup.mjs'

const CONTAINER_COMMANDS = ['docker', 'podman', 'nerdctl']
const SOCKETS = [
  '/var/run/docker.sock',
  '/run/docker.sock',
  '/var/run/podman/podman.sock',
  '/run/podman/podman.sock',
]

function tryExec(execFile, bin, args, env, timeout = 15_000) {
  try {
    const out = execFile(bin, args, { encoding: 'utf8', timeout, env })
    return { ok: true, text: String(out).trim().split('\n')[0], full: String(out) }
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error).split('\n')[0] }
  }
}

function supabaseIdentityVerified(versionText) {
  const patterns = PERMITTED_TOOL_IDENTITY.supabase.permittedVersionPatterns
  if (!patterns.length) return false
  return patterns.some((pattern) => new RegExp(pattern).test(String(versionText || '')))
}

function probeContainerRuntime({ env, execFile, resolve }) {
  const resolved = {}
  const versions = {}
  const info = {}
  let usable = false
  for (const name of CONTAINER_COMMANDS) {
    const path = resolve(name, env)
    if (!path) continue
    resolved[name] = path
    versions[name] = tryExec(execFile, path, ['--version'], env)
    const daemon = tryExec(execFile, path, ['info'], env, 12_000)
    info[name] = daemon
    if (daemon.ok) usable = true
  }
  const sockets = SOCKETS.filter((path) => existsSync(path))
  const present = Object.keys(resolved).length > 0 || sockets.length > 0
  const status = usable ? 'ready' : present ? 'present-unusable' : 'absent'
  return {
    present,
    usable,
    available: usable,
    status,
    resolved,
    commands: Object.keys(resolved),
    sockets,
    versions,
    info,
    note: usable
      ? 'A Docker-API compatible daemon answered info on a resolved local executable.'
      : present
        ? 'A container CLI or socket is present, but a usable local daemon was not verified. Version-only binaries are not execution readiness.'
        : 'No docker/podman/nerdctl executable on the isolated PATH and no local Docker/Podman socket.',
    severity: 'execution-blocker',
    notAProductionIncident: true,
  }
}

function probeSupabaseCli({ env, execFile, resolve }) {
  const resolved = resolve('supabase', env)
  if (!resolved) {
    return {
      available: false,
      via: null,
      pinned: false,
      identityVerified: false,
      identity: 'absent',
      resolved: null,
      version: null,
      helpVerified: false,
      startRequiresContainerRuntime: true,
      officialRoute: 'https://supabase.com/docs/guides/local-development',
      totpDocs: 'https://supabase.com/docs/guides/auth/auth-mfa/totp',
      changelog: 'https://supabase.com/changelog',
      note: 'No supabase executable on the isolated PATH. Unpinned npx --yes / remote latest resolution is forbidden. Treat as a NOT RUN tooling prerequisite.',
    }
  }
  const version = tryExec(execFile, resolved, ['--version'], env)
  let helpVerified = false
  let helpError = null
  let helpFull = null
  if (version.ok) {
    const help = tryExec(execFile, resolved, ['start', '--help'], env, 20_000)
    helpFull = help.ok ? help.full : null
    helpVerified = help.ok && /Start containers for Supabase local development/.test(String(help.full || help.text || ''))
    if (!help.ok) helpError = help.error
  }
  const identityVerified = version.ok && helpVerified && supabaseIdentityVerified(version.text)
  return {
    available: identityVerified,
    via: 'path-executable',
    pinned: identityVerified,
    identityVerified,
    identity: identityVerified ? 'permitted' : 'unverified',
    resolved,
    version: version.ok ? version.text : null,
    helpVerified,
    helpError,
    startRequiresContainerRuntime: true,
    officialRoute: 'https://supabase.com/docs/guides/local-development',
    totpDocs: 'https://supabase.com/docs/guides/auth/auth-mfa/totp',
    changelog: 'https://supabase.com/changelog',
    note: identityVerified
      ? 'Resolved supabase executable matched a permitted identity and start --help.'
      : `${PERMITTED_TOOL_IDENTITY.supabase.note} Observed ${version.ok ? version.text : 'no version'}; helpVerified=${helpVerified}.`,
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

async function probeBrowser({ env, browserFactory, execFile, resolve, closeTimeoutMs, owned }) {
  const chromePath = resolve('google-chrome', env) || resolve('google-chrome-stable', env)
  const chromeStable = chromePath
    ? tryExec(execFile, chromePath, ['--version'], env)
    : { ok: false, error: 'chrome executable absent' }
  const dir = mkdtempSync(join(owned.privateHome, 'browser-profile-'))
  owned.profileDir = dir
  owned.browserHandle = { context: null, profileDir: dir }
  let playwright = { ok: false, error: 'not attempted' }
  try {
    const factory = browserFactory || defaultBrowserFactory
    const launched = await factory({ profileDir: dir, env })
    owned.browserHandle.context = launched.context
    owned.browserLaunched = true
    const page = (typeof launched.context?.pages === 'function' && launched.context.pages()[0])
      || (launched.context?.newPage ? await launched.context.newPage() : null)
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
  const closeReport = await schliesseOwnedBrowser(owned.browserHandle, { closeTimeoutMs })
  owned.closeReport = closeReport
  if (closeReport.closed) {
    owned.browserHandle = { context: null, profileDir: dir }
  }
  return {
    chromeBinary: chromeStable.ok,
    chromeVersion: chromeStable.ok ? chromeStable.text : null,
    chromeResolved: chromePath,
    playwrightIsolated: playwright.ok,
    playwright,
    closeReport,
    launched: true,
    available: chromeStable.ok && playwright.ok && closeReport.closed,
    screenshotCliNotUsed: true,
    note: 'Use Playwright launchPersistentContext with a run-owned user-data-dir and an explicit child env. Close is bounded; unconfirmed close retains the profile.',
  }
}

function skippedBrowser({ env, execFile, resolve, reason }) {
  const chromePath = resolve('google-chrome', env) || resolve('google-chrome-stable', env)
  const chromeStable = chromePath
    ? tryExec(execFile, chromePath, ['--version'], env)
    : { ok: false, error: 'chrome executable absent' }
  return {
    chromeBinary: chromeStable.ok,
    chromeVersion: chromeStable.ok ? chromeStable.text : null,
    chromeResolved: chromePath,
    playwrightIsolated: false,
    playwright: { ok: false, error: 'not launched; prerequisites already block' },
    closeReport: { closeCalled: false, closed: true, profileRemoved: false, skipped: true },
    launched: false,
    available: false,
    screenshotCliNotUsed: true,
    note: reason,
  }
}

export async function runPreflight({
  env,
  privateHome,
  execFile = execFileSync,
  resolve = findeAusfuehrbare,
  which,
  browserFactory,
  closeTimeoutMs = BROWSER_CLOSE_TIMEOUT_MS,
  forceBrowserProbe = false,
} = {}) {
  const parentEnv = env ?? process.env
  const home = privateHome || mkdtempSync(join(tmpdir(), 'aacba1-preflight-home-'))
  const owned = {
    privateHome: home,
    profileDir: null,
    browserHandle: null,
    closeReport: null,
    browserLaunched: false,
    homeCreated: true,
  }
  const childEnv = bauePreflightUmgebung({ parentEnv, privateHome: home })
  const parentClass = klassifiziereUmgebung(parentEnv)
  const childClass = klassifiziereUmgebung(childEnv)
  const resolveFn = which
    ? (name, lookupEnv) => (which(name, lookupEnv) ? name : null)
    : resolve

  const container = probeContainerRuntime({ env: childEnv, execFile, resolve: resolveFn })
  const supabase = probeSupabaseCli({ env: childEnv, execFile, resolve: resolveFn })
  const shouldLaunchBrowser = Boolean(browserFactory) || forceBrowserProbe || (container.usable && supabase.identityVerified)
  const browser = shouldLaunchBrowser
    ? await probeBrowser({
      env: childEnv,
      browserFactory,
      execFile,
      resolve: resolveFn,
      closeTimeoutMs,
      owned,
    })
    : skippedBrowser({
      env: childEnv,
      execFile,
      resolve: resolveFn,
      reason: 'Browser launch skipped because container/CLI prerequisites already block. Avoid leftover profile/HOME from an unnecessary Chrome start.',
    })

  const nodePath = resolveFn('node', childEnv)
  const node = nodePath
    ? tryExec(execFile, nodePath, ['--version'], childEnv)
    : tryExec(execFile, 'node', ['--version'], childEnv)
  const hostedMarkers = HOSTED_MARKER_KEYS.filter((key) => parentEnv[key] != null && String(parentEnv[key]) !== '')

  const blockers = []
  if (!container.usable) {
    blockers.push({
      id: 'container-runtime',
      exact: container.present
        ? 'Container CLI/socket present but a usable local Docker-compatible daemon was not verified.'
        : 'No Docker-compatible runtime or local Docker API socket.',
      command: 'resolved docker/podman/nerdctl; docker info; ls /var/run/docker.sock',
      error: container.present ? 'daemon unverified' : 'executable not found / socket absent',
      policy: 'Official Supabase local-development requires a usable container manager. Privileged container/daemon setup, remote Docker context, and hosted Supabase fallback are forbidden.',
      severity: 'execution-blocker',
      notAProductionIncident: true,
    })
  }
  if (!supabase.identityVerified || !supabase.helpVerified) {
    blockers.push({
      id: 'supabase-cli',
      exact: supabase.resolved
        ? 'Resolved supabase executable is not a permitted/verified identity, or start --help failed.'
        : 'No supabase executable on the isolated PATH. Unpinned npx --yes latest is forbidden.',
      resolved: supabase.resolved,
      version: supabase.version,
      helpVerified: supabase.helpVerified,
      identityVerified: supabase.identityVerified,
      severity: 'execution-blocker',
      notAProductionIncident: true,
    })
  }
  if (shouldLaunchBrowser && !browser.available) {
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
    && container.usable
    && supabase.identityVerified
    && supabase.helpVerified
    && browser.available
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
    node: { available: node.ok, version: node.ok ? node.text : null, resolved: nodePath },
    owned,
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
      'A PATH binary is not a pinned tooling identity.',
    ],
    childEnvKeys: Object.keys(childEnv).sort(),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runPreflight()
  const cleanup = await raeumeOwnedAuf({
    preflightOwned: result.owned,
    browserHandle: result.owned.closeReport?.closed ? null : result.owned.browserHandle,
    privateDir: result.owned.privateHome,
    browserCloseReport: result.owned.closeReport,
  })
  console.log(JSON.stringify({
    canRunFullStack: result.canRunFullStack,
    toolingReadyForLaterImplementation: result.toolingReadyForLaterImplementation,
    blockers: result.blockers.map((item) => item.id),
    supabaseVersion: result.supabase.version,
    chromeVersion: result.browser.chromeVersion,
    nodeVersion: result.node.version,
    cleanupUnknown: cleanup.unknown,
    homeRemoved: cleanup.removals.some((item) => item.kind === 'privateDir' && item.removed),
  }, null, 2))
  process.exit(result.canRunFullStack ? 0 : 2)
}
