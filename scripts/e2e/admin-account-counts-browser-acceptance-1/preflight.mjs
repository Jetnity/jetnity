#!/usr/bin/env node
// Bounded capability preflight. One official free local route:
// Docker-compatible runtime + official Supabase CLI `start` + real browser.
// No privileged daemon install, no hosted fallback, no second provisioning loop.

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HOSTED_MARKER_KEYS } from './constants.mjs'
import { klassifiziereUmgebung } from './env-guard.mjs'

const CONTAINER_COMMANDS = ['docker', 'podman', 'nerdctl']
const SOCKETS = [
  '/var/run/docker.sock',
  '/run/docker.sock',
  '/var/run/podman/podman.sock',
  '/run/podman/podman.sock',
]

function commandExists(name) {
  return Boolean(spawnSync('command', ['-v', name], { encoding: 'utf8' }).status === 0) ||
    Boolean(spawnSync('which', [name], { encoding: 'utf8' }).status === 0)
}

function tryVersion(bin, args = ['--version']) {
  try {
    const out = execFileSync(bin, args, { encoding: 'utf8', timeout: 15_000 })
    return { ok: true, text: out.trim().split('\n')[0] }
  } catch (error) {
    return { ok: false, error: error.message.split('\n')[0] }
  }
}

function probeContainerRuntime() {
  const found = CONTAINER_COMMANDS.filter((name) => commandExists(name))
  const sockets = SOCKETS.filter((path) => existsSync(path))
  const versions = {}
  for (const name of found) versions[name] = tryVersion(name)
  return {
    available: found.length > 0 || sockets.length > 0,
    commands: found,
    sockets,
    versions,
    note: found.length || sockets.length
      ? 'A Docker-API compatible runtime is present.'
      : 'No docker/podman/nerdctl binary and no local Docker/Podman socket.',
  }
}

function probeSupabaseCli() {
  const npx = tryVersion('npx', ['--yes', 'supabase', '--version'])
  return {
    available: npx.ok,
    via: npx.ok ? 'npx supabase' : null,
    version: npx.ok ? npx.text : null,
    helpVerified: false,
    startRequiresContainerRuntime: true,
    officialRoute: 'https://supabase.com/docs/guides/local-development',
    totpDocs: 'https://supabase.com/docs/guides/auth/auth-mfa/totp',
    changelog: 'https://supabase.com/changelog',
    note: 'Official local-development requires a container manager compatible with Docker APIs. `supabase start` starts those containers. This harness will not invent Compose/Kong defaults.',
  }
}

async function probeBrowser() {
  const chromeVersion = tryVersion('google-chrome', ['--version'])
  const chromeStable = chromeVersion.ok ? chromeVersion : tryVersion('google-chrome-stable', ['--version'])
  let playwright = { ok: false, error: 'not attempted' }
  const dir = mkdtempSync(join(tmpdir(), 'aacba1-browser-preflight-'))
  try {
    const { chromium } = await import('playwright')
    const context = await chromium.launchPersistentContext(dir, {
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      timeout: 15_000,
    })
    const page = context.pages()[0] || await context.newPage()
    await page.goto('about:blank', { timeout: 8_000 })
    await context.close()
    playwright = { ok: true, channel: 'chrome', isolatedUserDataDir: true }
  } catch (error) {
    playwright = { ok: false, error: String(error && error.message ? error.message : error) }
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      /* keep preflight moving */
    }
  }
  return {
    chromeBinary: chromeStable.ok,
    chromeVersion: chromeStable.ok ? chromeStable.text : null,
    playwrightIsolated: playwright.ok,
    playwright,
    available: chromeStable.ok && playwright.ok,
    screenshotCliNotUsed: true,
    note: 'Use Playwright launchPersistentContext with a run-owned user-data-dir. A shared Chrome user-data-dir screenshot hung in this environment and is not the acceptance path.',
  }
}

export async function runPreflight({ env = process.env } = {}) {
  const container = probeContainerRuntime()
  const supabase = probeSupabaseCli()
  if (supabase.available) {
    try {
      const help = execFileSync('npx', ['--yes', 'supabase', 'start', '--help'], {
        encoding: 'utf8',
        timeout: 20_000,
      })
      supabase.helpVerified = /Start containers for Supabase local development/.test(help)
      supabase.startHelpMentionsWorkdir = /--workdir/.test(help)
      supabase.startHelpMentionsNetworkId = /--network-id/.test(help)
    } catch (error) {
      supabase.helpError = error.message.split('\n')[0]
    }
  }
  const browser = await probeBrowser()
  const node = tryVersion('node')
  const envClass = klassifiziereUmgebung(env)
  const hostedMarkers = HOSTED_MARKER_KEYS.filter((key) => env[key] != null && String(env[key]) !== '')

  const blockers = []
  if (!container.available) {
    blockers.push({
      id: 'container-runtime',
      exact: 'No Docker-compatible runtime or local Docker API socket.',
      command: 'command -v docker; command -v podman; ls /var/run/docker.sock',
      error: 'command not found / socket absent',
      policy: 'Official Supabase local-development requires a container manager. Privileged container/daemon setup, remote Docker context, and hosted Supabase fallback are forbidden.',
    })
  }
  if (!supabase.available) {
    blockers.push({
      id: 'supabase-cli',
      exact: 'Official Supabase CLI is not invocable via npx.',
    })
  }
  if (!browser.available) {
    blockers.push({
      id: 'real-browser',
      exact: 'Isolated Playwright + system Chrome launch failed.',
      error: browser.playwright.error || 'chrome missing',
    })
  }

  const canRunFullStack = blockers.length === 0
  return {
    at: new Date().toISOString(),
    selectedRoute: 'official-supabase-cli-local-development + docker-api-runtime + playwright-chrome',
    canRunFullStack,
    blockers,
    container,
    supabase,
    browser,
    node: { available: node.ok, version: node.ok ? node.text : null },
    environment: {
      hostedMarkersPresent: hostedMarkers,
      parentHasHostedSupabaseNames: envClass.parentHasHostedSupabaseNames,
      forbiddenConnectionKeyCount: envClass.forbiddenConnectionKeysPresent.length,
      outboundProviderKeyCount: envClass.outboundProviderKeysPresent.length,
      note: 'Parent process may contain hosted connector names. This harness never reads those values and never uses them as a fallback. Child environments are rebuilt from synthetic loopback values only.',
    },
    limitations: [
      'Exact self-hosted gateway/image versions are NOT RUN until an owned `supabase start` succeeds.',
      'Do not assume historical Compose or Kong defaults.',
      'Hosted Production/Development and the parent connector credentials are unused.',
    ],
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runPreflight()
  console.log(JSON.stringify({
    canRunFullStack: result.canRunFullStack,
    blockers: result.blockers.map((item) => item.id),
    supabaseVersion: result.supabase.version,
    chromeVersion: result.browser.chromeVersion,
    nodeVersion: result.node.version,
  }, null, 2))
  process.exit(result.canRunFullStack ? 0 : 2)
}
