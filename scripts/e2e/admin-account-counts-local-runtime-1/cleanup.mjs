#!/usr/bin/env node
// Owned teardown. CLI child exit is not Docker service teardown.
// Foreign sentinels are never deleted. Unknown ownership retains resources.
// Roots are the private HOME only; target paths are not self-authorizing.

import { existsSync, lstatSync, realpathSync, rmSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { darfOwnedVerzeichnisEntfernen, stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import { closeOwnedBrowserHandle } from './browser-session.mjs'
import { authoritativeBrowserRegistry } from './ownership.mjs'
import { stoppeOwnedStack } from './stack.mjs'

export function canonicalizeOwnedPath(path) {
  if (!path) return null
  const resolved = resolve(String(path))
  try {
    if (existsSync(resolved)) {
      const stat = lstatSync(resolved)
      if (stat.isSymbolicLink()) return realpathSync(resolved)
      return realpathSync(resolved)
    }
  } catch {
    return resolved
  }
  return resolved
}

export function assertOwnedPath(path, ownedRoots = []) {
  if (!path) return false
  const candidate = canonicalizeOwnedPath(path)
  if (!candidate) return false
  return ownedRoots.some((root) => {
    if (!root) return false
    const canonicalRoot = canonicalizeOwnedPath(root)
    if (!canonicalRoot) return false
    const rel = relative(canonicalRoot, candidate)
    if (rel === '') return true
    if (rel.startsWith(`..${sep}`) || rel === '..' || rel.startsWith('..')) return false
    if (isAbsolute(rel)) return false
    return true
  })
}

function privateRoots(state) {
  return [state.privateHome || state.privateDir || state.preflightOwned?.privateHome].filter(Boolean)
}

export async function raeumeOwnedAuf(state = {}, { closeTimeoutMs, exportArtifacts } = {}) {
  const registry = state.registry || null
  const ownedRoots = privateRoots(state)
  const browserRegistry = authoritativeBrowserRegistry(registry, state.browserRegistry)
  const network = registry?.network || state.network
  const stack = registry?.stack || state.stack
  const stackChild = registry?.stackChild || state.stackChild || stack?.child
  const appChild = registry?.appChild !== undefined ? registry.appChild : state.appChild
  const containers = registry?.containers || state.containers || stack?.containers || []
  const volumes = registry?.volumes || state.volumes || stack?.volumes || []
  const observer = registry?.observer || state.observer

  if (state.foreignSentinel && existsSync(state.foreignSentinel)) {
    if (assertOwnedPath(state.foreignSentinel, ownedRoots) !== true) {
      /* keep the sentinel */
    }
  }
  const reports = []
  if (browserRegistry instanceof Map) {
    for (const handle of browserRegistry.values()) {
      reports.push({ kind: 'browser-context', ...(await closeOwnedBrowserHandle(handle, { closeTimeoutMs })) })
    }
  } else if (state.browserHandle) {
    reports.push({ kind: 'browser-context', ...(await closeOwnedBrowserHandle(state.browserHandle, { closeTimeoutMs })) })
  }

  if (appChild) reports.push({ kind: 'app', ...(await stoppeOwnedChild(appChild)) })
  if (observer?.close) {
    try {
      await observer.close({ timeoutMs: closeTimeoutMs })
      reports.push({ kind: 'observer', closed: true })
    } catch (error) {
      reports.push({ kind: 'observer', closed: false, error: error instanceof Error ? error.message : String(error), ownershipRetained: true })
    }
  }
  const stackRequired = Boolean(
    stack
    || stackChild
    || network?.name
    || (containers && containers.length)
    || (volumes && volumes.length),
  )
  let stackReport = null
  if (stackRequired) {
    stackReport = await stoppeOwnedStack({
      dockerBin: registry?.dockerBin || state.dockerBin,
      cliBin: registry?.cliBin || state.cliBin,
      workdir: registry?.workdir || state.workdir,
      env: registry?.childEnv || state.childEnv,
      state: {
        child: stackChild,
        network,
        containers,
        volumes,
        created: network?.created === true || Boolean(network?.id),
        inventoryComplete: stack?.inventoryComplete === true,
        runId: network?.runId || registry?.runId || state.runId,
        projectId: registry?.projectId || state.projectId || network?.projectId,
      },
      execFile: registry?.execFile || state.execFile,
      projectId: registry?.projectId || state.projectId || network?.projectId,
    })
    reports.push({ kind: 'stack', ...stackReport })
  }

  let artifactExport = null
  if (typeof exportArtifacts === 'function') {
    try {
      artifactExport = await exportArtifacts({
        reports,
        registry,
        evidenceDir: registry?.evidenceDir || state.evidenceDir,
      })
    } catch (error) {
      artifactExport = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const resourceUnknown = Boolean(
    stackReport?.unknown === true
    || stackReport?.networkState === 'UNKNOWN'
    || stackReport?.containerState === 'UNKNOWN'
    || stackReport?.volumeState === 'UNKNOWN'
    || stackReport?.discoveryState === 'UNKNOWN'
    || (Array.isArray(stackReport?.unresolvedVolumes) && stackReport.unresolvedVolumes.length > 0),
  )
  const exportFailed = artifactExport?.ok === false
  const unknown = reports.some((item) => item.unknown === true) || registry?.stopUnknown === true || resourceUnknown || exportFailed
  const ownershipRetained = reports.some((item) => item.ownershipRetained === true || item.closed === false) || exportFailed
  const volumesUnconfirmed = Boolean(
    stackReport
    && (
      stackReport.volumesRemoved !== true
      || stackReport.volumeState === 'UNKNOWN'
      || stackReport.volumeState === 'PRESENT'
    )
    && (volumes?.length || stackReport.volumes?.length || stackReport.volumeState === 'UNKNOWN' || stackRequired),
  )
  const dockerServicesUnverified = Boolean(
    stackReport
    && stackReport.dockerServicesStopped !== true
    && stackRequired,
  )
  const processesStopped = reports
    .filter((item) => item.kind === 'app' || item.kind === 'stack-cli-child')
    .every((item) => item.reaped === true || item.neverStarted === true || item.cliChild?.reaped === true)
  const browserClosed = reports
    .filter((item) => item.kind === 'browser-context')
    .every((item) => item.closed === true || item.skipped === true)
  const live = Boolean(
    appChild
    || stack
    || stackChild
    || network?.name
    || state.browserHandle
    || browserRegistry?.size
    || registry?.hadFallibleAcquisition,
  )
  const flags = {
    processesStopped: processesStopped || (!appChild && !stackChild),
    reaped: !ownershipRetained && !unknown,
    neverStarted: !live,
    unknown,
    ownershipRetained,
    dockerServicesUnverified,
    volumesUnconfirmed,
    incompleteRegistry: Boolean(
      registry?.hadFallibleAcquisition
      && (
        (!stackRequired && !appChild && !observer && !(browserRegistry && browserRegistry.size))
        || stackReport?.inventoryComplete === false
        || resourceUnknown
      ),
    ),
    stopUnknown: registry?.stopUnknown === true,
    exportFailed,
  }
  const retainPrivate = flags.unknown
    || flags.ownershipRetained
    || flags.incompleteRegistry
    || flags.stopUnknown
    || flags.dockerServicesUnverified
    || flags.volumesUnconfirmed
    || flags.exportFailed
  const removals = []
  const dirs = [
    registry?.checkoutDir || state.checkoutDir,
    registry?.workdir || state.workdir,
    state.privateDir || state.privateHome || state.preflightOwned?.privateHome,
  ].filter(Boolean).sort((a, b) => b.length - a.length)
  for (const dir of dirs) {
    if (!assertOwnedPath(dir, ownedRoots)) {
      removals.push({ kind: 'foreign', path: dir, removed: false, reason: 'foreign sentinel/path retained' })
      continue
    }
    if (!existsSync(dir)) {
      removals.push({ kind: 'dir', path: dir, removed: true, alreadyAbsent: true })
      continue
    }
    if (
      retainPrivate
      || !darfOwnedVerzeichnisEntfernen({
        ...flags,
        unknown: flags.unknown || retainPrivate,
        dockerServicesUnverified: flags.dockerServicesUnverified || flags.volumesUnconfirmed || retainPrivate,
      })
    ) {
      removals.push({
        kind: 'dir',
        path: dir,
        removed: false,
        reason: 'owned process still active, unknown, close unconfirmed, leftover volume, incomplete registry, or Docker services unverified',
        recovery: `Inspect ${dir} and owned Docker network/containers/volumes before manual removal. Do not prune global Docker state.`,
      })
      continue
    }
    rmSync(dir, { recursive: true, force: true })
    removals.push({ kind: 'dir', path: dir, removed: !existsSync(dir) })
  }
  if (state.foreignSentinel && existsSync(state.foreignSentinel)) {
    removals.push({ kind: 'foreign-sentinel', path: state.foreignSentinel, removed: false })
  }
  return {
    ...flags,
    browserClosed,
    reports,
    removals,
    usedPkill: false,
    usedDockerPrune: false,
    stack: stackReport,
    artifactExport,
  }
}

export function bewerteCleanup(cleanup, { registry = null, mode = 'preflight' } = {}) {
  if (!cleanup) return false
  if (cleanup.usedPkill === true || cleanup.usedDockerPrune === true) return false
  if (cleanup.unknown === true || cleanup.ownershipRetained === true) return false
  if (cleanup.stopUnknown === true || registry?.stopUnknown === true) return false
  if (cleanup.volumesUnconfirmed === true) return false
  if (registry?.hadFallibleAcquisition && cleanup.neverStarted === true) return false
  if (cleanup.incompleteRegistry === true) return false
  if (cleanup.dockerServicesUnverified === true && registry?.hadFallibleAcquisition) return false
  if (cleanup.exportFailed === true) return false
  void mode
  return true
}

export function cleanupDryRunKontrolle() {
  return {
    blocked: darfOwnedVerzeichnisEntfernen({ processesStopped: false, reaped: false, neverStarted: false }),
    allowed: darfOwnedVerzeichnisEntfernen({ processesStopped: true, reaped: true, neverStarted: false }),
    unused: darfOwnedVerzeichnisEntfernen({ processesStopped: false, reaped: false, neverStarted: true }),
    signalFailureBlocked: darfOwnedVerzeichnisEntfernen({
      processesStopped: true,
      reaped: true,
      neverStarted: false,
      ownershipRetained: true,
    }) === false,
    dockerUnverifiedBlocked: darfOwnedVerzeichnisEntfernen({
      processesStopped: true,
      reaped: true,
      neverStarted: false,
      dockerServicesUnverified: true,
    }) === false,
    foreignBlocked: assertOwnedPath('/tmp/foreign-sentinel', ['/tmp/aaclr1-owned']) === false,
    traversalBlocked: assertOwnedPath('/tmp/owned/../foreign', ['/tmp/owned']) === false,
  }
}
