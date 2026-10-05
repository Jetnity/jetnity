#!/usr/bin/env node
// Official CLI-managed local stack. Loopback publication is configured
// before any listener starts. The official CLI child sees a private
// run-owned docker publish shim on PATH; harness Docker calls keep the
// exact verified real binary. Post-start safety prefers resolved
// NetworkSettings.Ports over empty HostConfig.PortBindings placeholders.
// CLI child exit is not Docker teardown.
// Partial network/child/container/volume handles are recorded on the
// live ownership registry before fallible work continues.
// Resource queries return PRESENT / ABSENT / UNKNOWN. Daemon, permission,
// timeout and parse failures are UNKNOWN, never absence. Exact Docker Desktop
// already-absent forms for the requested resource are ABSENT; a different
// name or a generic "not found" stays UNKNOWN.
// Ownership is per-resource: inspect the volume itself before classify/rm;
// network membership is discovery only; live foreign wins over stale owned;
// CLI stop requires exact project authority and no blocking identity.

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { waitForOwnedChildExit, stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import { refuseBootstrapOverlay } from '../admin-account-counts-browser-acceptance-1/source-manifest.mjs'
import { SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { CLI, CLI_PROJECT_LABEL, RUN_LABEL, TIMEOUTS } from './constants.mjs'
import { selectSafeExcludes } from './cli-identity.mjs'
import { assertNoPublicBindPlan } from './overlay.mjs'
import { notACompletedExecution } from './implementation.mjs'
import { recordDockerResources, registerHandle } from './ownership.mjs'
import { assertDockerPublishShimUsable } from './docker-publish-shim.mjs'

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

function isPlainPortMap(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function configuredPublishedPorts(inspectDoc) {
  const configured = inspectDoc?.HostConfig?.PortBindings
  if (!isPlainPortMap(configured)) return []
  return Object.keys(configured)
}

function isWellFormedRuntimeMap(map) {
  if (map == null || typeof map !== 'object' || Array.isArray(map)) return false
  if (map.HostIp == null) return false
  return String(map.HostPort ?? '') !== ''
}

function unresolvedRuntimeBinding(containerPort, reason) {
  return {
    containerPort,
    HostIp: '',
    HostPort: '',
    reason,
  }
}

function collectPublishedPortMaps(ports) {
  const list = []
  if (!isPlainPortMap(ports)) return list
  for (const [containerPort, maps] of Object.entries(ports)) {
    if (!Array.isArray(maps)) continue
    for (const map of maps) {
      list.push({
        containerPort,
        HostIp: map?.HostIp,
        HostPort: map?.HostPort,
      })
    }
  }
  return list
}

function collectAuthoritativeRuntimeBindings(inspectDoc) {
  const runtimePorts = isPlainPortMap(inspectDoc.NetworkSettings.Ports)
    ? inspectDoc.NetworkSettings.Ports
    : {}
  const list = []
  const configured = configuredPublishedPorts(inspectDoc)
  const seenConfigured = new Set()

  for (const containerPort of configured) {
    seenConfigured.add(containerPort)
    const maps = runtimePorts[containerPort]
    if (!Array.isArray(maps) || maps.length === 0) {
      list.push(unresolvedRuntimeBinding(containerPort, 'missing-or-malformed-runtime-publication'))
      continue
    }
    for (const map of maps) {
      if (!isWellFormedRuntimeMap(map)) {
        list.push(unresolvedRuntimeBinding(containerPort, 'malformed-runtime-publication'))
        continue
      }
      list.push({
        containerPort,
        HostIp: map.HostIp,
        HostPort: map.HostPort,
      })
    }
  }

  for (const [containerPort, maps] of Object.entries(runtimePorts)) {
    if (seenConfigured.has(containerPort)) continue
    if (!Array.isArray(maps)) continue
    for (const map of maps) {
      list.push({
        containerPort,
        HostIp: map?.HostIp,
        HostPort: map?.HostPort,
      })
    }
  }
  return list
}

export function hasResolvedRuntimePortMappings(inspectDoc) {
  return isPlainPortMap(inspectDoc?.NetworkSettings)
    && Object.prototype.hasOwnProperty.call(inspectDoc.NetworkSettings, 'Ports')
}

export function parseDockerPortBindings(inspectJson) {
  const parsed = typeof inspectJson === 'string' ? JSON.parse(inspectJson) : inspectJson
  if (hasResolvedRuntimePortMappings(parsed)) {
    // Actual post-start publication. Do not fall back to HostConfig to
    // manufacture PASS when this field exists, even if it is empty/public.
    // Configured published ports must still appear as well-formed runtime maps.
    return collectAuthoritativeRuntimeBindings(parsed)
  }
  const configured = parsed?.HostConfig?.PortBindings
  if (configured !== undefined) {
    return collectPublishedPortMaps(configured)
  }
  return collectPublishedPortMaps(parsed)
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

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function dockerNameBoundary(exact) {
  return `${exact}(?![A-Za-z0-9_.-])`
}

function isHardUnknownResourceFailure(error, message) {
  const code = error?.code
  if (['ETIMEDOUT', 'ECONNREFUSED', 'EACCES', 'EPERM', 'ENOTFOUND'].includes(code)) {
    return true
  }
  // Genuine unavailable / permission / timeout / context failures stay UNKNOWN
  // even when the text also names a resource. The Docker CLI envelope
  // "Error response from daemon: <detail>" is surrounding prefix text, not a
  // daemon-unavailability signal by itself.
  if (/Cannot connect|permission denied|timeout|ETIMEDOUT|ECONNREFUSED|EACCES|EPERM|ENOTFOUND|EHOSTUNREACH|context .*not found|context not found|Is the docker daemon running|daemon is not running/i.test(message)) {
    return true
  }
  return /Unexpected token|JSON|parse/i.test(message)
}

function isExactResourceAbsentMessage(kind, exact, message) {
  const named = dockerNameBoundary(exact)
  if (kind === 'container') {
    return new RegExp(`No such (container|object):\\s*${named}`, 'i').test(message)
  }
  if (kind === 'volume') {
    return new RegExp(`No such volume:\\s*${named}`, 'i').test(message)
      || new RegExp(`\\bget\\s+${named}\\s*:\\s*no such volume\\b`, 'i').test(message)
  }
  if (kind === 'network') {
    return new RegExp(`No such network:\\s*${named}`, 'i').test(message)
      || new RegExp(`\\bnetwork\\s+${named}\\s+not found\\b`, 'i').test(message)
  }
  return false
}

export function classifyDockerInspectError(error, { kind, name } = {}) {
  const message = error instanceof Error ? error.message : String(error)
  if (isHardUnknownResourceFailure(error, message)) return RESOURCE_STATE.UNKNOWN
  if (kind && name) {
    const exact = escapeRegExp(name)
    if (isExactResourceAbsentMessage(kind, exact, message)) return RESOURCE_STATE.ABSENT
  }
  return RESOURCE_STATE.UNKNOWN
}

export function resourceKindFromDockerArgs(args = []) {
  if (args[0] === 'network' && (args[1] === 'inspect' || args[1] === 'rm')) {
    return { kind: 'network', name: args[2] }
  }
  if (args[0] === 'volume' && (args[1] === 'inspect' || args[1] === 'rm')) {
    const name = args[1] === 'rm' && args[2] === '-f' ? args[3] : args[2]
    return { kind: 'volume', name }
  }
  if (args[0] === 'inspect' || args[0] === 'stop' || args[0] === 'rm') {
    return { kind: 'container', name: args[1] }
  }
  return { kind: null, name: null }
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
    const target = resourceKindFromDockerArgs(args)
    return {
      state: classifyDockerInspectError(error, target),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function parseInspectDocs(raw) {
  const parsed = JSON.parse(String(raw || '').trim() || '[]')
  return Array.isArray(parsed) ? parsed : [parsed]
}

export function classifyResourceIdentity(labels = {}, { runId = null, projectId = null } = {}) {
  const run = labels[RUN_LABEL]
  const project = labels[CLI_PROJECT_LABEL]
  const foreignRun = Boolean(run && runId && run !== runId)
  const foreignProject = Boolean(project && projectId && project !== projectId)
  if (foreignRun || foreignProject) {
    return {
      ownership: 'foreign',
      reason: foreignRun ? 'other run label' : 'other CLI project',
    }
  }
  if (run && runId && run === runId) {
    return { ownership: 'owned', reason: 'run label' }
  }
  if (project && projectId && project === projectId) {
    return { ownership: 'owned', reason: 'exact CLI project' }
  }
  return { ownership: 'unresolved', reason: 'no matching creation authority' }
}

export function classifyContainerOwnership({ labels = {}, runId, projectId } = {}) {
  return classifyResourceIdentity(labels, { runId, projectId })
}

export function classifyVolumeOwnership({ mount, labels = {}, runId, projectId } = {}) {
  const name = mount?.Name
  if (!name || mount?.Type !== 'volume') {
    return { name, ownership: 'unresolved', reason: 'unnamed or non-volume mount' }
  }
  return {
    name,
    containerId: mount.containerId,
    ...classifyResourceIdentity(labels, { runId, projectId }),
  }
}

export function inspectVolumeDocument({
  execFile,
  dockerBin,
  env,
  name,
} = {}) {
  const inspected = inspectDockerResource({
    execFile,
    dockerBin,
    env,
    args: ['volume', 'inspect', name],
  })
  if (inspected.state !== RESOURCE_STATE.PRESENT) {
    return { state: inspected.state, error: inspected.error, labels: {} }
  }
  try {
    const docs = parseInspectDocs(inspected.raw)
    const doc = docs[0] || {}
    return {
      state: RESOURCE_STATE.PRESENT,
      doc,
      labels: doc.Labels || {},
    }
  } catch (error) {
    return {
      state: RESOURCE_STATE.UNKNOWN,
      error: error instanceof Error ? error.message : String(error),
      labels: {},
    }
  }
}

function classifyMountedVolume({
  mount,
  containerId,
  execFile,
  dockerBin,
  env,
  runId,
  projectId,
}) {
  const volumeInspect = inspectVolumeDocument({ execFile, dockerBin, env, name: mount.Name })
  if (volumeInspect.state === RESOURCE_STATE.UNKNOWN) {
    return {
      name: mount.Name,
      containerId,
      ownership: 'unresolved',
      reason: 'volume inspect unknown',
      state: RESOURCE_STATE.UNKNOWN,
    }
  }
  if (volumeInspect.state === RESOURCE_STATE.ABSENT) {
    return {
      name: mount.Name,
      containerId,
      ownership: 'absent',
      reason: 'volume already absent',
      state: RESOURCE_STATE.ABSENT,
    }
  }
  const classified = classifyVolumeOwnership({
    mount: { ...mount, containerId },
    labels: volumeInspect.labels,
    runId,
    projectId,
  })
  return {
    name: mount.Name,
    containerId,
    labels: volumeInspect.labels,
    ownership: classified.ownership,
    reason: classified.reason,
    state: RESOURCE_STATE.PRESENT,
  }
}

export function collectOwnedDockerResources({
  dockerBin,
  networkName,
  env,
  execFile,
  runId,
  projectId,
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
  const seenVolumes = new Set()
  for (const id of ids) {
    const raw = execFile(dockerBin, ['inspect', id], { encoding: 'utf8', env, timeout: 15_000 })
    const docs = parseInspectDocs(raw)
    for (const doc of docs) {
      const labels = doc.Config?.Labels || {}
      const classified = classifyContainerOwnership({ labels, runId, projectId })
      containers.push({
        id: doc.Id || id,
        name: doc.Name,
        labels,
        ownership: classified.ownership,
        reason: classified.reason,
        state: RESOURCE_STATE.PRESENT,
      })
      if (classified.ownership === 'owned') {
        bindings.push(...parseDockerPortBindings(doc))
      }
      for (const mount of doc.Mounts || []) {
        if (mount.Type !== 'volume' || !mount.Name || seenVolumes.has(mount.Name)) continue
        seenVolumes.add(mount.Name)
        volumes.push(classifyMountedVolume({
          mount,
          containerId: doc.Id || id,
          execFile,
          dockerBin,
          env,
          runId,
          projectId,
        }))
      }
    }
  }
  const unresolvedVolumes = volumes.filter((item) => item.ownership === 'unresolved')
  const unresolvedContainers = containers.filter((item) => item.ownership === 'unresolved')
  return {
    containers,
    volumes,
    bindings,
    inventoryComplete: unresolvedVolumes.length === 0 && unresolvedContainers.length === 0,
    discoveryState: RESOURCE_STATE.PRESENT,
    unresolvedVolumes,
    foreignContainers: containers.filter((item) => item.ownership === 'foreign'),
    foreignVolumes: volumes.filter((item) => item.ownership === 'foreign'),
  }
}

export function reconcileOneResource(recorded, live) {
  const liveOwn = volumeOwnershipOf(live)
  const recOwn = recorded ? volumeOwnershipOf(recorded) : null
  if (liveOwn === 'foreign') {
    return {
      ...live,
      ownership: 'foreign',
      conflict: recOwn === 'owned',
      reason: recOwn === 'owned' ? 'stale owned record vs live foreign' : live.reason,
    }
  }
  if (recOwn === 'foreign' && liveOwn === 'owned') {
    return {
      ...live,
      ownership: 'conflict',
      reason: 'stale foreign record vs live owned',
    }
  }
  if (recOwn === 'owned' && (liveOwn === 'unresolved' || liveOwn === 'absent')) {
    return {
      ...live,
      ownership: liveOwn === 'absent' ? 'absent' : 'unresolved',
      reason: liveOwn === 'absent' ? live.reason : 'stale owned record cannot replace missing live authority',
    }
  }
  return live
}

export function reconcileDockerResources(recorded = [], live = [], keyOf) {
  const out = []
  const seen = new Set()
  for (const liveItem of live) {
    const key = keyOf(liveItem)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const recordedItem = recorded.find((item) => keyOf(item) === key)
    out.push(reconcileOneResource(recordedItem, liveItem))
  }
  for (const recordedItem of recorded) {
    const normalized = typeof recordedItem === 'object' ? recordedItem : { id: recordedItem, name: recordedItem }
    const key = keyOf(normalized)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({ ...normalized, discovery: 'recorded-only' })
  }
  return out
}

export function discoverOwnedResources({
  dockerBin,
  networkName,
  env,
  execFile,
  runId,
  projectId,
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
      ? collectOwnedDockerResources({ dockerBin, networkName, env, execFile, runId, projectId })
      : { containers: [], volumes: [], bindings: [], inventoryComplete: true, discoveryState: RESOURCE_STATE.ABSENT }
    return {
      ...live,
      containers: reconcileDockerResources(recordedContainers, live.containers, (item) => item.id || item.Id),
      volumes: reconcileDockerResources(recordedVolumes, live.volumes, (item) => item.name || item.Name),
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

export async function starteOwnedStack({
  cliBin,
  dockerBin,
  workdir,
  env,
  cliEnv,
  dockerPublishShim,
  cliIdentity,
  privateHome,
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
  projectId,
} = {}) {
  if (!cliBin || !existsSync(cliBin)) {
    throw notACompletedExecution('owned supabase start', 'verified CLI binary is absent')
  }
  if (!dockerBin) {
    throw notACompletedExecution('owned supabase start', 'usable local Docker daemon is absent')
  }
  if (!cliEnv || !dockerPublishShim) {
    throw notACompletedExecution('owned supabase start', 'docker publish shim/PATH proof is missing')
  }
  assertDockerPublishShimUsable({
    shim: dockerPublishShim,
    cli: cliIdentity,
    docker: { usable: true, selected: { path: dockerBin } },
    cliEnv,
    privateHome: privateHome || registry?.privateHome,
    runId: runId || registry?.runId,
    shimVerified: true,
  })
  assertNoPublicBindPlan(plan)
  refuseBootstrapOverlay({ plannedSqlPaths: [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper], target: 'gotrue' })
  const started = {
    child: null,
    network: { name: networkName, created: false, projectId: projectId || null },
    workdir,
    runId: runId || null,
    projectId: projectId || null,
    dockerServicesConfirmed: false,
    containers: [],
    volumes: [],
    inventoryComplete: false,
  }
  registerHandle(registry, 'stack', started)
  try {
    const network = await erzeugeOwnedNetwork({ dockerBin, env, networkName, execFile, runId })
    started.network = { ...network, projectId: projectId || network.projectId || null }
    registerHandle(registry, 'network', started.network)
    const publication = assertPreLaunchPublication({ plan, network })
    started.publication = publication
    const args = baueStartArgumente({ networkId: network.name, excludeNames })
    const child = spawnFn(cliBin, args, {
      cwd: workdir,
      env: cliEnv,
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
      : collectOwnedDockerResources({
        dockerBin,
        networkName: network.name,
        env,
        execFile,
        runId,
        projectId,
      })
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

function revalidateRecordedContainer(item, { execFile, dockerBin, env, runId, projectId }) {
  const id = item.id || item.Id || item.name
  const inspected = inspectDockerResource({
    execFile,
    dockerBin,
    args: ['inspect', id],
    env,
  })
  if (inspected.state === RESOURCE_STATE.ABSENT) {
    return {
      ...item,
      ownership: 'absent',
      state: RESOURCE_STATE.ABSENT,
      reason: item.reason || 'already absent',
    }
  }
  if (inspected.state === RESOURCE_STATE.UNKNOWN) {
    return {
      ...item,
      ownership: 'unresolved',
      state: RESOURCE_STATE.UNKNOWN,
      reason: 'container inspect unknown',
    }
  }
  try {
    const doc = parseInspectDocs(inspected.raw)[0] || {}
    const classified = classifyContainerOwnership({
      labels: doc.Config?.Labels || {},
      runId,
      projectId,
    })
    return {
      ...item,
      ...classified,
      labels: doc.Config?.Labels || {},
      state: RESOURCE_STATE.PRESENT,
    }
  } catch (error) {
    return {
      ...item,
      ownership: 'unresolved',
      state: RESOURCE_STATE.UNKNOWN,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

function revalidateRecordedVolume(item, { execFile, dockerBin, env, runId, projectId }) {
  const name = item.name || item.Name
  const inspected = inspectVolumeDocument({ execFile, dockerBin, env, name })
  if (inspected.state === RESOURCE_STATE.ABSENT) {
    return {
      ...item,
      ownership: 'absent',
      state: RESOURCE_STATE.ABSENT,
      reason: item.reason || 'already absent',
    }
  }
  if (inspected.state === RESOURCE_STATE.UNKNOWN) {
    return {
      ...item,
      ownership: 'unresolved',
      state: RESOURCE_STATE.UNKNOWN,
      reason: 'volume inspect unknown',
    }
  }
  const classified = classifyVolumeOwnership({
    mount: { Type: 'volume', Name: name },
    labels: inspected.labels,
    runId,
    projectId,
  })
  if (classified.ownership === 'foreign' && volumeOwnershipOf(item) === 'owned') {
    return {
      ...item,
      ...classified,
      ownership: 'foreign',
      conflict: true,
      reason: 'stale owned record vs live foreign',
      state: RESOURCE_STATE.PRESENT,
    }
  }
  if (classified.ownership === 'unresolved' && volumeOwnershipOf(item) === 'foreign') {
    return {
      ...item,
      ownership: 'foreign',
      labels: inspected.labels,
      reason: 'recorded foreign identity retained',
      state: RESOURCE_STATE.PRESENT,
    }
  }
  return {
    ...item,
    ...classified,
    labels: inspected.labels,
    state: RESOURCE_STATE.PRESENT,
  }
}

function isAbsent(item) {
  return item?.state === RESOURCE_STATE.ABSENT || volumeOwnershipOf(item) === 'absent'
}

function isBlockingIdentity(item) {
  if (isAbsent(item)) return false
  const ownership = volumeOwnershipOf(item)
  return ownership === 'foreign' || ownership === 'unresolved' || ownership === 'conflict'
}

function isOwnedPresent(item) {
  return volumeOwnershipOf(item) === 'owned' && item.state === RESOURCE_STATE.PRESENT
}

function presentUnresolved(items = []) {
  return items.filter((item) => volumeOwnershipOf(item) === 'unresolved' && !isAbsent(item))
}

export async function stoppeOwnedStack({
  dockerBin,
  cliBin,
  workdir,
  env,
  state,
  execFile,
  projectId,
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
  const runId = state?.network?.runId || state?.runId
  const exactProjectId = projectId || state?.projectId || state?.network?.projectId || null
  const discovered = discoverOwnedResources({
    dockerBin,
    networkName: state?.network?.name,
    env,
    execFile,
    runId,
    projectId: exactProjectId,
    recordedContainers,
    recordedVolumes,
  })
  report.discoveryState = discovered.discoveryState
  if (discovered.unknown) report.unknown = true
  const identityCtx = { execFile, dockerBin, env, runId, projectId: exactProjectId }
  const containers = (discovered.containers || []).map((item) => (
    item.discovery === 'recorded-only'
      ? revalidateRecordedContainer(item, identityCtx)
      : item
  ))
  const volumes = (discovered.volumes || []).map((item) => (
    item.discovery === 'recorded-only' || !item.labels
      ? revalidateRecordedVolume(item, identityCtx)
      : item
  ))
  const unresolved = presentUnresolved(volumes).concat(presentUnresolved(containers))
  const foreignContainers = containers.filter((item) => volumeOwnershipOf(item) === 'foreign' && !isAbsent(item))
  const foreignVolumes = volumes.filter((item) => volumeOwnershipOf(item) === 'foreign' && !isAbsent(item))
  const conflicts = [...containers, ...volumes].filter((item) => (
    (item.conflict === true || volumeOwnershipOf(item) === 'conflict') && !isAbsent(item)
  ))
  report.foreignContainers = foreignContainers.map((item) => item.id || item.Id || item.name)
  report.foreignVolumes = foreignVolumes.map((item) => item.name || item.Name)
  report.foreignRetained = [...report.foreignContainers, ...report.foreignVolumes]
  report.conflicts = conflicts.map((item) => item.id || item.name)
  const discoveryFailed = discovered.unknown === true
  if (unresolved.length || discovered.inventoryComplete === false || conflicts.length) {
    report.unresolvedVolumes = unresolved.filter((item) => item.name || item.Name)
    report.inventoryComplete = false
    report.unknown = true
    if (conflicts.length) report.conflictReason = 'fresh identity conflicts with recorded ownership'
  } else if (!discoveryFailed) {
    report.inventoryComplete = true
  }
  const blocking = [...containers, ...volumes].filter(isBlockingIdentity)
  const mayCliStop = Boolean(
    cliBin
    && workdir
    && exactProjectId
    && blocking.length === 0
    && !discoveryFailed,
  )
  if (mayCliStop) {
    try {
      execFile(cliBin, ['stop'], { encoding: 'utf8', env, cwd: workdir, timeout: 60_000 })
    } catch (error) {
      report.cliStopError = error instanceof Error ? error.message : String(error)
    }
  } else if (cliBin && workdir) {
    report.cliStopSkipped = discoveryFailed
      ? 'discovery-unknown'
      : (blocking.length ? 'foreign-or-unresolved-identity' : 'exact-project-authority-missing')
  }

  const ownedContainers = discoveryFailed ? [] : containers.filter(isOwnedPresent)
  const containerIds = ownedContainers.map((item) => item.id || item.Id).filter(Boolean)
  report.containers = containerIds
  const containerStates = []
  for (const id of containerIds) {
    try {
      execFile(dockerBin, ['stop', id], { encoding: 'utf8', env, timeout: 20_000 })
      execFile(dockerBin, ['rm', id], { encoding: 'utf8', env, timeout: 20_000 })
    } catch (error) {
      const classified = classifyDockerInspectError(error, { kind: 'container', name: id })
      if (classified !== RESOURCE_STATE.ABSENT) {
        report.containerError = error instanceof Error ? error.message : String(error)
      }
    }
    const inspected = inspectDockerResource({
      execFile,
      dockerBin,
      args: ['inspect', id],
      env,
    })
    containerStates.push(inspected.state)
  }
  if (discoveryFailed && containerIds.length === 0) {
    report.containerState = RESOURCE_STATE.UNKNOWN
    report.containersRemoved = false
  } else if (containerIds.length === 0 && unresolved.length === 0 && !discoveryFailed) {
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

  const ownedVolumes = discoveryFailed ? [] : volumes.filter(isOwnedPresent)
  const volumeNames = ownedVolumes.map((item) => item.name || item.Name).filter(Boolean)
  const volumeStates = []
  for (const name of volumeNames) {
    try {
      execFile(dockerBin, ['volume', 'rm', '-f', name], { encoding: 'utf8', env, timeout: 20_000 })
    } catch (error) {
      const classified = classifyDockerInspectError(error, { kind: 'volume', name })
      if (classified !== RESOURCE_STATE.ABSENT) {
        report.volumeError = error instanceof Error ? error.message : String(error)
      }
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
  if (unresolved.length || discoveryFailed) {
    report.volumeState = RESOURCE_STATE.UNKNOWN
    report.volumesRemoved = false
    report.unknown = true
  } else if (volumeNames.length === 0) {
    report.volumeState = RESOURCE_STATE.ABSENT
    report.volumesRemoved = true
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

  const foreignContainersPresent = foreignContainers.some((item) => item.state !== RESOURCE_STATE.ABSENT)
  const blockingContainersPresent = containers.some(isBlockingIdentity)
  if (state?.network?.name) {
    if (
      (state.network.created === true || state.network.id)
      && !foreignContainersPresent
      && !blockingContainersPresent
      && !discoveryFailed
    ) {
      try {
        execFile(dockerBin, ['network', 'rm', state.network.name], { encoding: 'utf8', env, timeout: 15_000 })
      } catch (error) {
        const classified = classifyDockerInspectError(error, { kind: 'network', name: state.network.name })
        if (classified !== RESOURCE_STATE.ABSENT) {
          report.networkError = error instanceof Error ? error.message : String(error)
        }
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

  const blockingPresent = blocking.some((item) => item.state !== RESOURCE_STATE.ABSENT)
  report.dockerServicesStopped = report.containersRemoved === true
    && report.volumesRemoved === true
    && report.networkRemoved === true
    && report.unknown !== true
    && report.inventoryComplete !== false
    && !blockingPresent
    && !report.containerError
    && !report.volumeError
    && !report.networkError
  return report
}

function volumeOwnershipOf(item) {
  if (item?.state === RESOURCE_STATE.ABSENT && !item?.ownership) return 'absent'
  if (item?.ownership) return item.ownership
  if (item?.owned === false) return 'foreign'
  if (item?.owned === true) return 'owned'
  return 'unresolved'
}

export function leseOverlayConfig(configPath) {
  return readFileSync(configPath, 'utf8')
}

export { join, CLI }
