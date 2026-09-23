#!/usr/bin/env node
// Launch the unchanged Jetnity application on a numeric loopback origin.
// TL local-harness decision: locked `next dev` with the isolated app
// environment applied before spawn/compile. No product-activation change.
// ON/OFF uses a confirmed owned stop, then a replacement. Default path
// waits for a meaningful non-500 response while the owned child is live.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import { baueRuntimeAppUmgebung, refuseDotenvInCheckout } from './env.mjs'
import { TIMEOUTS } from './constants.mjs'
import { notACompletedExecution } from './implementation.mjs'
import { markStopUnknown, syncAppOwnership } from './ownership.mjs'

export function appListenArgs({ host = '127.0.0.1', port } = {}) {
  if (host !== '127.0.0.1') throw new Error(`App host must be 127.0.0.1, got ${host}`)
  return {
    command: 'npx',
    args: ['--no-install', 'next', 'dev', '-H', host, '-p', String(port)],
    script: 'dev',
    host,
    port,
  }
}

export function nextBinaryPath(checkoutDir) {
  return join(checkoutDir, 'node_modules/next/dist/bin/next')
}

function childIsLive(child, exitCode, signalCode) {
  return (exitCode == null && signalCode == null)
    && (child?.exitCode == null)
    && (child?.signalCode == null)
}

export async function warteAufAppBereitschaft({
  child,
  origin,
  timeoutMs = TIMEOUTS.appBootMs,
  signal,
  fetchImpl = fetch,
} = {}) {
  if (!origin || !/^https?:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
    throw new Error('App readiness requires a numeric loopback origin.')
  }
  const started = Date.now()
  let exitCode = child?.exitCode ?? null
  let signalCode = child?.signalCode ?? null
  const onExit = (code, sig) => {
    exitCode = code
    signalCode = sig
  }
  child?.once?.('exit', onExit)
  try {
    while (Date.now() - started < timeoutMs) {
      if (signal?.aborted) throw new Error('app readiness aborted')
      if (!childIsLive(child, exitCode, signalCode)) {
        throw notACompletedExecution(
          'owned app launch',
          `child exited ${exitCode ?? signalCode ?? child?.exitCode ?? child?.signalCode} before readiness`,
        )
      }
      try {
        const response = await fetchImpl(origin, { signal: AbortSignal.timeout(500) })
        const status = response?.status
        if (status == null) {
          await new Promise((resolve) => setTimeout(resolve, 50))
          continue
        }
        if (status >= 500) {
          throw notACompletedExecution(
            'owned app launch',
            `application returned server error ${status}; a returned origin is not readiness`,
          )
        }
        if (status >= 200 && status < 400) {
          if (!childIsLive(child, exitCode, signalCode)) {
            throw notACompletedExecution('owned app launch', 'child exited after the readiness response')
          }
          return { ready: true, origin, status }
        }
      } catch (error) {
        if (error && error.code === 'NOT_COMPLETED_EXECUTION') throw error
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }
    throw notACompletedExecution('owned app launch', `readiness timeout after ${timeoutMs}ms`)
  } finally {
    child?.off?.('exit', onExit)
  }
}

export function defaultInstallLockedDependencies({
  checkoutDir,
  env,
  execFile,
  timeoutMs = TIMEOUTS.installMs,
} = {}) {
  if (!checkoutDir || !existsSync(join(checkoutDir, 'package.json')) || !existsSync(join(checkoutDir, 'package-lock.json'))) {
    throw notACompletedExecution('locked dependency install', 'package.json or package-lock.json missing from dedicated checkout')
  }
  refuseDotenvInCheckout(checkoutDir)
  execFile('npm', ['ci', '--no-audit', '--no-fund'], {
    cwd: checkoutDir,
    env: { ...env, npm_config_update_notifier: 'false' },
    timeout: timeoutMs,
    encoding: 'utf8',
  })
  if (!existsSync(nextBinaryPath(checkoutDir))) {
    throw notACompletedExecution('locked dependency install', 'verified next binary missing after npm ci')
  }
  return { nextBin: nextBinaryPath(checkoutDir), lockfile: true }
}

export function defaultBuildLocalApp({
  checkoutDir,
  env,
  execFile,
  timeoutMs = TIMEOUTS.buildMs,
} = {}) {
  const nextBin = nextBinaryPath(checkoutDir)
  if (!existsSync(nextBin)) {
    throw notACompletedExecution('local app build', 'locked next binary missing')
  }
  execFile(process.execPath, [nextBin, 'build'], {
    cwd: checkoutDir,
    env,
    timeout: timeoutMs,
    encoding: 'utf8',
  })
  if (!existsSync(join(checkoutDir, '.next'))) {
    throw notACompletedExecution('local app build', 'supported local build output missing')
  }
  return { nextDir: join(checkoutDir, '.next') }
}

export async function prepareAppForLaunch({
  checkoutDir,
  env,
  execFile,
  install = defaultInstallLockedDependencies,
  build,
} = {}) {
  refuseDotenvInCheckout(checkoutDir)
  const installed = await install({ checkoutDir, env, execFile })
  if (!existsSync(nextBinaryPath(checkoutDir))) {
    throw notACompletedExecution('owned app launch', 'locked next binary missing after install')
  }
  if (typeof build === 'function') {
    const built = await build({ checkoutDir, env, execFile })
    return { installed, built, launchScript: 'dev' }
  }
  return {
    installed,
    built: { skipped: true, reason: 'next dev compiles from locked dependencies in the isolated app environment' },
    launchScript: 'dev',
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
  registry,
} = {}) {
  if (!checkoutDir || !existsSync(checkoutDir)) {
    throw notACompletedExecution('owned app launch', 'dedicated checkout is missing')
  }
  refuseDotenvInCheckout(checkoutDir)
  const nextBin = nextBinaryPath(checkoutDir)
  if (!existsSync(nextBin)) {
    throw notACompletedExecution('owned app launch', 'verified locked next binary is missing')
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
  const origin = `http://127.0.0.1:${port}`
  const child = spawnFn(process.execPath, [
    nextBin,
    launch.script,
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
  const handle = {
    child,
    origin,
    countsEnabled: countsEnabled === true,
    ready: false,
    checkoutDir,
    launchScript: launch.script,
    envBoundary: {
      LOCAL_FLAG: env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED,
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeyPresent: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      nodeEnv: env.NODE_ENV,
    },
  }
  syncAppOwnership(registry, handle)
  const wait = waitUntilReady === undefined ? warteAufAppBereitschaft : waitUntilReady
  if (wait) {
    const readiness = await wait({ child, origin, timeoutMs, signal })
    handle.ready = readiness?.ready === true
    handle.readinessStatus = readiness?.status ?? null
    if (handle.ready !== true) {
      throw notACompletedExecution('owned app launch', 'bounded readiness was not confirmed')
    }
  } else {
    throw notACompletedExecution('owned app launch', 'default path requires bounded readiness')
  }
  if (!childIsLive(child, child.exitCode, child.signalCode)) {
    throw notACompletedExecution('owned app launch', `child exited ${child.exitCode ?? child.signalCode} after readiness`)
  }
  return handle
}

export async function restartOwnedApp(current, options = {}) {
  if (current?.child) {
    const stop = await (options.stopApp || stoppeOwnedApp)(current.child)
    if (stop.unknown === true || (stop.reaped !== true && stop.neverStarted !== true)) {
      markStopUnknown(options.registry)
      throw Object.assign(new Error('Refuse replacement after unconfirmed app stop'), {
        code: 'APP_STOP_UNCONFIRMED',
        stop,
      })
    }
    if (options.registry) options.registry.appChild = null
  }
  const next = await starteOwnedApp({
    ...options,
    checkoutDir: options.checkoutDir || current.checkoutDir,
    registry: options.registry,
  })
  syncAppOwnership(options.registry, next)
  if (options.owned) options.owned.appChild = next.child
  return next
}
