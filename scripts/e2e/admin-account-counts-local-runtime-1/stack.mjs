#!/usr/bin/env node
// Official CLI-managed local stack. Loopback publication is configured
// before any listener starts. CLI child exit is not Docker teardown.

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { waitForOwnedChildExit, stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import { refuseBootstrapOverlay } from '../admin-account-counts-browser-acceptance-1/source-manifest.mjs'
import { SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { CLI, TIMEOUTS } from './constants.mjs'
import { selectSafeExcludes } from './cli-identity.mjs'
import { assertNoPublicBindPlan } from './overlay.mjs'
import { notACompletedExecution } from './implementation.mjs'

const FORBIDDEN_HOSTS = new Set(['0.0.0.0', '::', '[::]', '', '*'])

export function assertLoopbackBindings(bindings = []) {
  if (!bindings.length) throw new Error('No published bindings to verify.')
  for (const item of bindings) {
    const host = item.HostIp ?? item.host
    if (FORBIDDEN_HOSTS.has(String(host)) || host === '::' || host === '[::]') {
      throw new Error(`Public or unspecified bind observed: ${JSON.stringify(item)}`)
    }
    if (host !== '127.0.0.1') {
      throw new Error(`Non-numeric loopback bind observed: ${JSON.stringify(item)}`)
    }
  }
  return true
}

export function parseDockerPortBindings(inspectJson) {
  const parsed = typeof inspectJson === 'string' ? JSON.parse(inspectJson) : inspectJson
  const list = []
  const ports = parsed.HostConfig?.PortBindings || parsed.NetworkSettings?.Ports || parsed
  for (const [containerPort, maps] of Object.entries(ports || {})) {
    for (const map of maps || []) {
      list.push({
        containerPort,
        HostIp: map.HostIp,
        HostPort: map.HostPort,
      })
    }
  }
  return list
}

export function parseStatusEnv(text) {
  const env = {}
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) env[match[1]] = match[2].replace(/^"|"$/g, '')
  }
  return env
}

export function sanitizeStatus(env) {
  return {
    apiUrlIsNumericLoopback: /^https?:\/\/127\.0\.0\.1(?::\d+)?(?:\/|$)/.test(String(env.API_URL || env.SUPABASE_URL || '')),
    dbUrlIsNumericLoopback: /127\.0\.0\.1/.test(String(env.DB_URL || env.DATABASE_URL || '')),
    anonKeyPresent: Boolean(env.ANON_KEY || env.SUPABASE_ANON_KEY),
    serviceRolePresent: Boolean(env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY),
    observedApiUrl: redactUrl(env.API_URL || env.SUPABASE_URL || ''),
    dbMajorHint: env.DB_MAJOR_VERSION || null,
  }
}

function redactUrl(value) {
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`
  } catch {
    return null
  }
}

export async function erzeugeOwnedNetwork({
  dockerBin,
  env,
  networkName,
  execFile,
} = {}) {
  if (!dockerBin) throw notACompletedExecution('owned Docker network', 'docker binary missing')
  const createArgs = [
    'network',
    'create',
    '-o',
    'com.docker.network.bridge.host_binding_ipv4=127.0.0.1',
    networkName,
  ]
  const out = execFile(dockerBin, createArgs, { encoding: 'utf8', env, timeout: 20_000 })
  return { name: networkName, id: String(out).trim(), option: 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' }
}

export function baueStartArgumente({ networkId, excludeNames = [] } = {}) {
  const args = ['start', '--network-id', networkId]
  for (const name of selectSafeExcludes(excludeNames)) {
    args.push('-x', name)
  }
  return args
}

export async function starteOwnedStack({
  cliBin,
  dockerBin,
  workdir,
  env,
  plan,
  networkName,
  excludeNames = [],
  spawnFn = spawn,
  execFile,
  inspectBindings = defaultInspect,
  waitForStatus,
  signal,
  timeoutMs = TIMEOUTS.stackStartMs,
} = {}) {
  if (!cliBin || !existsSync(cliBin)) {
    throw notACompletedExecution('owned supabase start', 'verified CLI binary is absent')
  }
  if (!dockerBin) {
    throw notACompletedExecution('owned supabase start', 'usable local Docker daemon is absent')
  }
  assertNoPublicBindPlan(plan)
  refuseBootstrapOverlay({ plannedSqlPaths: [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper], target: 'gotrue' })
  const network = await erzeugeOwnedNetwork({ dockerBin, env, networkName, execFile })
  const args = baueStartArgumente({ networkId: network.name, excludeNames })
  const child = spawnFn(cliBin, args, {
    cwd: workdir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const started = { child, network, workdir, dockerServicesConfirmed: false, containers: [], volumes: [] }
  try {
    const wait = waitForStatus
      ? await waitForStatus({ child, timeoutMs, signal })
      : await waitForOwnedChildExit(child, { timeoutMs })
    if (wait.timedOut || (wait.exitCode != null && wait.exitCode !== 0)) {
      throw notACompletedExecution('owned supabase start', wait.error || `CLI exited ${wait.exitCode}`)
    }
    const bindings = await inspectBindings({ dockerBin, env, networkName: network.name, execFile })
    assertLoopbackBindings(bindings)
    started.dockerServicesConfirmed = true
    started.bindings = bindings
    return started
  } catch (error) {
    started.error = error instanceof Error ? error.message : String(error)
    throw error
  }
}

async function defaultInspect({ dockerBin, env, networkName, execFile }) {
  const idsText = execFile(dockerBin, ['ps', '-q', '--filter', `network=${networkName}`], {
    encoding: 'utf8',
    env,
    timeout: 15_000,
  })
  const ids = String(idsText).trim().split(/\s+/).filter(Boolean)
  const bindings = []
  for (const id of ids) {
    const raw = execFile(dockerBin, ['inspect', id], { encoding: 'utf8', env, timeout: 15_000 })
    const docs = JSON.parse(raw)
    for (const doc of docs) bindings.push(...parseDockerPortBindings(doc))
  }
  return bindings
}

export async function stoppeOwnedStack({
  dockerBin,
  cliBin,
  workdir,
  env,
  state,
  execFile,
} = {}) {
  const report = {
    cliChild: null,
    dockerServicesStopped: false,
    containers: [],
    networkRemoved: false,
    volumesRemoved: false,
    usedGlobalPrune: false,
    usedDefaultProjectStop: false,
  }
  if (state?.child) {
    report.cliChild = await stoppeOwnedChild(state.child)
  }
  if (!dockerBin || !state?.network?.name) {
    report.dockerServicesUnverified = true
    return report
  }
  try {
    if (cliBin && workdir) {
      execFile(cliBin, ['stop'], { encoding: 'utf8', env, cwd: workdir, timeout: 60_000 })
    }
  } catch (error) {
    report.cliStopError = error instanceof Error ? error.message : String(error)
  }
  const idsText = execFile(dockerBin, ['ps', '-aq', '--filter', `network=${state.network.name}`], {
    encoding: 'utf8',
    env,
    timeout: 15_000,
  })
  const ids = String(idsText).trim().split(/\s+/).filter(Boolean)
  report.containers = ids
  for (const id of ids) {
    try {
      execFile(dockerBin, ['stop', id], { encoding: 'utf8', env, timeout: 20_000 })
      execFile(dockerBin, ['rm', id], { encoding: 'utf8', env, timeout: 20_000 })
    } catch (error) {
      report.containerError = error instanceof Error ? error.message : String(error)
    }
  }
  try {
    execFile(dockerBin, ['network', 'rm', state.network.name], { encoding: 'utf8', env, timeout: 15_000 })
    report.networkRemoved = true
  } catch (error) {
    report.networkError = error instanceof Error ? error.message : String(error)
  }
  report.dockerServicesStopped = !report.containerError && report.networkRemoved
  return report
}

export function leseOverlayConfig(configPath) {
  return readFileSync(configPath, 'utf8')
}

export { join }
