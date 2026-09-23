#!/usr/bin/env node
// Launch the unchanged Jetnity application on a numeric loopback origin.
// ON/OFF uses a controlled owned restart and fresh runtime state. No app
// patch, guard bypass or environment-snapshot trick.

import { spawn } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import { baueRuntimeAppUmgebung } from './env.mjs'
import { TIMEOUTS } from './constants.mjs'
import { notACompletedExecution } from './implementation.mjs'

export function appListenArgs({ host = '127.0.0.1', port, startScript = 'start' } = {}) {
  if (host !== '127.0.0.1') throw new Error(`App host must be 127.0.0.1, got ${host}`)
  return {
    command: 'npx',
    args: ['--no-install', 'next', startScript === 'dev' ? 'dev' : 'start', '-H', host, '-p', String(port)],
    host,
    port,
  }
}

export async function stoppeOwnedApp(child) {
  return stoppeOwnedChild(child)
}

export async function starteOwnedApp({
  checkoutDir,
  parentEnv,
  privateHome,
  loopbackUrl,
  syntheticAnonKey,
  siteUrl,
  countsEnabled,
  host = '127.0.0.1',
  port,
  spawnFn = spawn,
  waitUntilReady,
  timeoutMs = TIMEOUTS.appBootMs,
  signal,
} = {}) {
  if (!checkoutDir || !existsSync(checkoutDir)) {
    throw notACompletedExecution('owned app launch', 'dedicated checkout is missing')
  }
  if (existsSync(join(checkoutDir, '.env')) || existsSync(join(checkoutDir, '.env.local'))) {
    throw new Error('Dedicated checkout still contains an inherited .env file.')
  }
  const nextDir = join(checkoutDir, '.next')
  if (existsSync(nextDir) && countsEnabled !== undefined) {
    // Fresh runtime state for each ON/OFF start. The previous build output
    // from this owned checkout may be reused only after an explicit rebuild
    // hook; default is to keep .next from this checkout's own build.
  }
  const env = baueRuntimeAppUmgebung({
    parentEnv,
    privateHome,
    loopbackUrl,
    syntheticAnonKey,
    siteUrl,
    countsEnabled,
  })
  const launch = appListenArgs({ host, port })
  const child = spawnFn(process.execPath, [
    join(checkoutDir, 'node_modules/next/dist/bin/next'),
    launch.args[2],
    '-H',
    host,
    '-p',
    String(port),
  ], {
    cwd: checkoutDir,
    env: {
      ...env,
      PATH: env.PATH,
      PORT: String(port),
      HOSTNAME: host,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (waitUntilReady) {
    await waitUntilReady({ child, origin: `http://127.0.0.1:${port}`, timeoutMs, signal })
  }
  return {
    child,
    origin: `http://127.0.0.1:${port}`,
    countsEnabled: countsEnabled === true,
    envBoundary: {
      LOCAL_FLAG: env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED,
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    },
  }
}

export async function restartOwnedApp(current, options) {
  if (current?.child) await stoppeOwnedApp(current.child)
  if (current?.checkoutDir && options.freshBuild !== false && existsSync(join(current.checkoutDir, '.next'))) {
    if (options.clearRuntimeState === true) {
      rmSync(join(current.checkoutDir, '.next'), { recursive: true, force: true })
    }
  }
  return starteOwnedApp({ ...options, checkoutDir: options.checkoutDir || current.checkoutDir })
}
