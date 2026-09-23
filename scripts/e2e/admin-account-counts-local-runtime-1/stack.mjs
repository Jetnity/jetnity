#!/usr/bin/env node
// Official CLI-managed local stack. Loopback publication is configured
// before any listener starts. CLI child exit is not Docker teardown.
// Partial network/child/container/volume handles are recorded on the
// live ownership registry before fallible work continues.
// Resource queries return PRESENT / ABSENT / UNKNOWN. Daemon, permission,
// timeout and parse failures are UNKNOWN, never absence.

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { waitForOwnedChildExit, stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import { refuseBootstrapOverlay } from '../admin-account-counts-browser-acceptance-1/source-manifest.mjs'
import { SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { CLI, RUN_LABEL, TIMEOUTS } from './constants.mjs'
import { selectSafeExcludes } from './cli-identity.mjs'
import { assertNoPublicBindPlan } from './overlay.mjs'
import { notACompletedExecution } from './implementation.mjs'
import { recordDockerResources, registerHandle } from './ownership.mjs'

const FORBIDDEN_HOSTS = new Set(['0.0.0.0', '::', '[::]', '', '*'])

export const RESOURCE_STATE = Object.freeze({
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  UNKNOWN: 'UNKNOWN',
})

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

export function assertPreLaunchPublication({ plan, network }) {
  assertNoPublicBindPlan(plan)
  if (!network?.name) throw new Error('Owned network must be named before listeners start.')
  if (network.created !== true && !network.id) {
    throw new Error('Owned network must exist before listeners start.')
  }
  if (network.option !== 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1') {
    throw new Error('Network was not created with loopback host binding.')
  }
  return {
    configuredBeforeStart: true,
    services: (plan.services || []).map((item) => ({ name: item.name, host: item.host, port: item.port })),
  }
}

export async function erzeugeOwnedNetwork({
  dockerBin,
  env,
  networkName,
  execFile,
  runId,
} = {}) {
  if (!dockerBin) throw notACompletedExecution('owned Docker network', 'docker binary missing')
  const createArgs = [
    'network',
    'create',
    '-o',
    'com.docker.network.bridge.host_binding_ipv4=127.0.0.1',
    '--label',
    `${RUN_LABEL}=${runId || networkName}`,
    networkName,
  ]
  const out = execFile(dockerBin, createArgs, { encoding: 'utf8', env, timeout: 20_000 })
  return {
    name: networkName,
    id: String(out).trim(),
    option: 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1',
    created: true,
    runId: runId || networkName,
  }
}

export function baueStartArgumente({ networkId, excludeNames = [] } = {}) {
  const args = ['start', '--network-id', networkId]
  for (const name of selectSafeExcludes(excludeNames)) {
    args.push('-x', name)
  }
  return args
}

export function classifyDockerInspectError(error) {
  const message = error instanceof Error ? error.message : String(error)
  const code = error?.code
  if (/No such (object|network|container|volume)|not found|does not exist/i.test(message)) {
    return RESOURCE_STATE.ABSENT
  }
  if (
    /Cannot connect|daemon|permission denied|timeout|ETIMEDOUT|ECONNREFUSED|EACCES|EPERM|ENOTFOUND|EHOSTUNREACH/i.test(message)
    || ['ETIMEDOUT', 'ECONNREFUSED', 'EACCES', 'EPERM', 'ENOTFOUND'].includes(code)
  ) {
    return RESOURCE_STATE.UNKNOWN
  }
  if (/Unexpected token|JSON|parse/i.test(message)) return RESOURCE_STATE.UNKNOWN
  return RESOURCE_STATE.UNKNOWN
}

export function inspectDockerResource({
  execFile,
  dockerBin,
  args,
  env,
} = {}) {
  try {
    const out = execFile(dockerBin, args, { encoding: 'utf8', env, timeout: 10_000 })
    const text = String(out ?? '').trim()
    if (!text) return { state: RESOURCE_STATE.UNKNOWN, reason: 'empty inspect output' }
    return { state: RESOURCE_STATE.PRESENT, raw: text }
  } catch (error) {
    return {
      state: classifyDockerInspectError(error),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function collectOwnedDockerResources({
  dockerBin,
  networkName,
  env,
  execFile,
  runId,
} = {}) {
  const idsText = execFile(dockerBin, ['ps', '-aq', '--filter', `network=${networkName}`], {
    encoding: 'utf8',
    env,
    timeout: 15_000,
  })
  const ids = String(idsText).trim().split(/\s+/).filter(Boolean)
  const containers = []
  const volumes = []
  const bindings = []
  for (const id of ids) {
    const raw = execFile(dockerBin, ['inspect', id], { encoding: 'utf8', env, timeout: 15_000 })
    const docs = JSON.parse(raw)
    for (const doc of docs) {
      const labels = doc.Config?.Labels || {}
      const ownedByRun = !runId
        || labels[RUN_LABEL] === runId
        || doc.HostConfig?.NetworkMode === networkName
        || Object.keys(doc.NetworkSettings?.Networks || {}).includes(networkName)
      if (!ownedByRun) continue
      containers.push({
        id: doc.Id || id,
        name: doc.Name,
        labels,
      })
      for (const mount of doc.Mounts || []) {
        if (mount.Type === 'volume' && mount.Name && (labels[RUN_LABEL] === runId || !runId)) {
          volumes.push({ name: mount.Name, containerId: doc.Id || id, owned: true })
        }
      }
      bindings.push(...parseDockerPortBindings(doc))
    }
  }
  return { containers, volumes, bindings, inventoryComplete: true, discoveryState: RESOURCE_STATE.PRESENT }
}

export function discoverOwnedResources({
  dockerBin,
  networkName,
  env,
  execFile,
  runId,
  recordedContainers = [],
  recordedVolumes = [],
} = {}) {
  if (!dockerBin || !execFile) {
    return {
      containers: recordedContainers,
      volumes: recordedVolumes,
      bindings: [],
      inventoryComplete: false,
      discoveryState: RESOURCE_STATE.UNKNOWN,
      unknown: true,
      reason: 'docker binary or execFile missing',
    }
  }
  try {
    const live = networkName
      ? collectOwnedDockerResources({ dockerBin, networkName, env, execFile, runId })
      : { containers: [], volumes: [], bindings: [], inventoryComplete: true, discoveryState: RESOURCE_STATE.ABSENT }
    const containers = mergeNamed(recordedContainers, live.containers, (item) => item.id || item.Id)
    const volumes = mergeNamed(recordedVolumes, live.volumes, (item) => item.name || item.Name)
    return {
      ...live,
      containers,
      volumes,
      inventoryComplete: live.inventoryComplete === true,
      discoveryState: live.discoveryState || RESOURCE_STATE.PRESENT,
      unknown: false,
    }
  } catch (error) {
    return {
      containers: recordedContainers,
      volumes: recordedVolumes,
      bindings: [],
      inventoryComplete: false,
      discoveryState: RESOURCE_STATE.UNKNOWN,
      unknown: true,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function mergeNamed(recorded, live, keyOf) {
  const out = []
  const seen = new Set()
  for (const item of [...recorded, ...live]) {
    const key = keyOf(item) || item
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(typeof item === 'object' ? item : { id: item, name: item })
  }
  return out
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
  inspectBindings,
  waitForStatus,
  signal,
  timeoutMs = TIMEOUTS.stackStartMs,
  registry,
  runId,
} = {}) {
  if (!cliBin || !existsSync(cliBin)) {
    throw notACompletedExecution('owned supabase start', 'verified CLI binary is absent')
  }
  if (!dockerBin) {
    throw notACompletedExecution('owned supabase start', 'usable local Docker daemon is absent')
  }
  assertNoPublicBindPlan(plan)
  refuseBootstrapOverlay({ plannedSqlPaths: [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper], target: 'gotrue' })
  const started = {
    child: null,
    network: { name: networkName, created: false },
    workdir,
    dockerServicesConfirmed: false,
    containers: [],
    volumes: [],
    inventoryComplete: false,
  }
  registerHandle(registry, 'stack', started)
  try {
    const network = await erzeugeOwnedNetwork({ dockerBin, env, networkName, execFile, runId })
    started.network = network
    registerHandle(registry, 'network', network)
    const publication = assertPreLaunchPublication({ plan, network })
    started.publication = publication
    const args = baueStartArgumente({ networkId: network.name, excludeNames })
    const child = spawnFn(cliBin, args, {
      cwd: workdir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    started.child = child
    registerHandle(registry, 'stackChild', child)
    const wait = waitForStatus
      ? await waitForStatus({ child, timeoutMs, signal })
      : await waitForOwnedChildExit(child, { timeoutMs })
    if (wait.timedOut || (wait.exitCode != null && wait.exitCode !== 0)) {
      throw notACompletedExecution('owned supabase start', wait.error || `CLI exited ${wait.exitCode}`)
    }
    const resources = inspectBindings
      ? { bindings: await inspectBindings({ dockerBin, env, networkName: network.name, execFile }), containers: [], volumes: [], inventoryComplete: false }
      : collectOwnedDockerResources({ dockerBin, networkName: network.name, env, execFile, runId })
    assertLoopbackBindings(resources.bindings)
    started.dockerServicesConfirmed = true
    started.bindings = resources.bindings
    started.containers = resources.containers || []
    started.volumes = resources.volumes || []
    started.inventoryComplete = resources.inventoryComplete === true
    recordDockerResources(registry, started)
    registerHandle(registry, 'stack', started)
    return started
  } catch (error) {
    started.error = error instanceof Error ? error.message : String(error)
    registerHandle(registry, 'stack', started)
    throw Object.assign(error instanceof Error ? error : new Error(String(error)), { ownedPartial: started })
  }
}

function allAbsent(states) {
  return states.length > 0 && states.every((state) => state === RESOURCE_STATE.ABSENT)
}

function anyUnknown(states) {
  return states.some((state) => state === RESOURCE_STATE.UNKNOWN)
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
    networkState: null,
    containerState: null,
    volumeState: null,
    discoveryState: null,
    unknown: false,
    inventoryComplete: state?.inventoryComplete === true,
  }
  if (state?.child) {
    report.cliChild = await stoppeOwnedChild(state.child)
  }
  if (!dockerBin || !execFile) {
    report.dockerServicesUnverified = Boolean(state?.network?.name || state?.containers?.length || state?.volumes?.length)
    report.unknown = Boolean(state?.network?.name || state?.containers?.length || state?.volumes?.length)
    report.networkState = state?.network?.name ? RESOURCE_STATE.UNKNOWN : RESOURCE_STATE.ABSENT
    report.containerState = RESOURCE_STATE.UNKNOWN
    report.volumeState = RESOURCE_STATE.UNKNOWN
    return report
  }

  const recordedContainers = (state?.containers || []).map((item) => (
    typeof item === 'object' ? item : { id: item }
  ))
  const recordedVolumes = (state?.volumes || []).map((item) => (
    typeof item === 'object' ? item : { name: item }
  ))
  const discovered = discoverOwnedResources({
    dockerBin,
    networkName: state?.network?.name,
    env,
    execFile,
    runId: state?.network?.runId || state?.runId,
    recordedContainers,
    recordedVolumes,
  })
  report.discoveryState = discovered.discoveryState
  if (discovered.unknown) report.unknown = true

  try {
    if (cliBin && workdir) {
      execFile(cliBin, ['stop'], { encoding: 'utf8', env, cwd: workdir, timeout: 60_000 })
    }
  } catch (error) {
    report.cliStopError = error instanceof Error ? error.message : String(error)
  }

  const containerIds = discovered.containers.map((item) => item.id || item.Id).filter(Boolean)
  report.containers = containerIds
  const containerStates = []
  for (const id of containerIds) {
    try {
      execFile(dockerBin, ['stop', id], { encoding: 'utf8', env, timeout: 20_000 })
      execFile(dockerBin, ['rm', id], { encoding: 'utf8', env, timeout: 20_000 })
    } catch (error) {
      report.containerError = error instanceof Error ? error.message : String(error)
    }
    const inspected = inspectDockerResource({
      execFile,
      dockerBin,
      args: ['inspect', id],
      env,
    })
    containerStates.push(inspected.state)
  }
  if (discovered.unknown && containerIds.length === 0) {
    report.containerState = RESOURCE_STATE.UNKNOWN
    report.containersRemoved = false
  } else if (containerIds.length === 0 && state?.inventoryComplete === true && !discovered.unknown) {
    report.containerState = RESOURCE_STATE.ABSENT
    report.containersRemoved = true
  } else if (containerIds.length === 0) {
    report.containerState = RESOURCE_STATE.UNKNOWN
    report.containersRemoved = false
    report.unknown = true
  } else if (anyUnknown(containerStates)) {
    report.containerState = RESOURCE_STATE.UNKNOWN
    report.containersRemoved = false
    report.unknown = true
  } else if (allAbsent(containerStates)) {
    report.containerState = RESOURCE_STATE.ABSENT
    report.containersRemoved = true
  } else {
    report.containerState = RESOURCE_STATE.PRESENT
    report.containersRemoved = false
  }

  const volumeNames = discovered.volumes.map((item) => item.name || item.Name).filter(Boolean)
  const volumeStates = []
  for (const name of volumeNames) {
    try {
      execFile(dockerBin, ['volume', 'rm', '-f', name], { encoding: 'utf8', env, timeout: 20_000 })
    } catch (error) {
      report.volumeError = error instanceof Error ? error.message : String(error)
    }
    const inspected = inspectDockerResource({
      execFile,
      dockerBin,
      args: ['volume', 'inspect', name],
      env,
    })
    volumeStates.push(inspected.state)
  }
  report.volumes = volumeNames
  if (discovered.unknown && volumeNames.length === 0) {
    report.volumeState = RESOURCE_STATE.UNKNOWN
    report.volumesRemoved = false
    report.unknown = true
  } else if (volumeNames.length === 0 && state?.inventoryComplete === true && !discovered.unknown) {
    report.volumeState = RESOURCE_STATE.ABSENT
    report.volumesRemoved = true
  } else if (volumeNames.length === 0) {
    report.volumeState = RESOURCE_STATE.UNKNOWN
    report.volumesRemoved = false
    report.unknown = true
  } else if (anyUnknown(volumeStates)) {
    report.volumeState = RESOURCE_STATE.UNKNOWN
    report.volumesRemoved = false
    report.unknown = true
  } else if (allAbsent(volumeStates)) {
    report.volumeState = RESOURCE_STATE.ABSENT
    report.volumesRemoved = true
  } else {
    report.volumeState = RESOURCE_STATE.PRESENT
    report.volumesRemoved = false
  }

  if (state?.network?.name) {
    if (state.network.created === true || state.network.id) {
      try {
        execFile(dockerBin, ['network', 'rm', state.network.name], { encoding: 'utf8', env, timeout: 15_000 })
      } catch (error) {
        report.networkError = error instanceof Error ? error.message : String(error)
      }
    }
    const inspected = inspectDockerResource({
      execFile,
      dockerBin,
      args: ['network', 'inspect', state.network.name],
      env,
    })
    report.networkState = inspected.state
    report.networkRemoved = inspected.state === RESOURCE_STATE.ABSENT
    if (inspected.state === RESOURCE_STATE.UNKNOWN) report.unknown = true
  } else {
    report.networkState = RESOURCE_STATE.ABSENT
    report.networkRemoved = true
  }

  report.dockerServicesStopped = report.containersRemoved === true
    && report.volumesRemoved === true
    && report.networkRemoved === true
    && report.unknown !== true
    && !report.containerError
  return report
}

export function leseOverlayConfig(configPath) {
  return readFileSync(configPath, 'utf8')
}

export { join, CLI }
