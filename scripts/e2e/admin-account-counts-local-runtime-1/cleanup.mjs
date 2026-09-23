#!/usr/bin/env node
// Owned teardown. CLI child exit is not Docker service teardown.
// Foreign sentinels are never deleted. Unknown ownership retains resources.

import { existsSync, rmSync } from 'node:fs'
import { darfOwnedVerzeichnisEntfernen, schliesseOwnedBrowser, stoppeOwnedChild } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import { stoppeOwnedStack } from './stack.mjs'

export function assertOwnedPath(path, ownedRoots = []) {
  if (!path) return false
  return ownedRoots.some((root) => root && (path === root || String(path).startsWith(`${root}/`)))
}

export async function raeumeOwnedAuf(state = {}, { closeTimeoutMs } = {}) {
  const ownedRoots = [state.privateDir, state.workdir, state.checkoutDir, state.preflightOwned?.privateHome].filter(Boolean)
  if (state.foreignSentinel && existsSync(state.foreignSentinel)) {
    if (assertOwnedPath(state.foreignSentinel, ownedRoots) !== true) {
      /* keep the sentinel */
    }
  }
  const reports = []
  const registry = state.browserRegistry
  if (registry instanceof Map) {
    for (const handle of registry.values()) {
      reports.push({ kind: 'browser-context', ...(await schliesseOwnedBrowser(handle, { closeTimeoutMs })) })
    }
  } else if (state.browserHandle) {
    reports.push({ kind: 'browser-context', ...(await schliesseOwnedBrowser(state.browserHandle, { closeTimeoutMs })) })
  }

  if (state.appChild) reports.push({ kind: 'app', ...(await stoppeOwnedChild(state.appChild)) })
  if (state.observer?.close) {
    try {
      await state.observer.close()
      reports.push({ kind: 'observer', closed: true })
    } catch (error) {
      reports.push({ kind: 'observer', closed: false, error: error instanceof Error ? error.message : String(error), ownershipRetained: true })
    }
  }
  let stack = null
  if (state.stack || state.stackChild) {
    stack = await stoppeOwnedStack({
      dockerBin: state.dockerBin,
      cliBin: state.cliBin,
      workdir: state.workdir,
      env: state.childEnv,
      state: state.stack || { child: state.stackChild, network: state.network },
      execFile: state.execFile,
    })
    reports.push({ kind: 'stack', ...stack })
  }

  const unknown = reports.some((item) => item.unknown === true)
  const ownershipRetained = reports.some((item) => item.ownershipRetained === true || item.closed === false)
  const dockerServicesUnverified = Boolean(stack && stack.dockerServicesStopped !== true && (state.stack || state.stackChild))
  const processesStopped = reports
    .filter((item) => item.kind === 'app' || item.kind === 'stack-cli-child')
    .every((item) => item.reaped === true || item.neverStarted === true || item.cliChild?.reaped === true)
  const browserClosed = reports
    .filter((item) => item.kind === 'browser-context')
    .every((item) => item.closed === true || item.skipped === true)
  const flags = {
    processesStopped: processesStopped || (!state.appChild && !state.stackChild),
    reaped: !ownershipRetained && !unknown,
    neverStarted: !state.appChild && !state.stack && !state.stackChild && !state.browserHandle && !registry?.size,
    unknown,
    ownershipRetained,
    dockerServicesUnverified,
  }
  const removals = []
  for (const dir of [state.checkoutDir, state.workdir, state.privateDir || state.preflightOwned?.privateHome]) {
    if (!dir) continue
    if (!assertOwnedPath(dir, ownedRoots)) {
      removals.push({ kind: 'foreign', path: dir, removed: false, reason: 'foreign sentinel/path retained' })
      continue
    }
    if (!existsSync(dir)) {
      removals.push({ kind: 'dir', path: dir, removed: true, alreadyAbsent: true })
      continue
    }
    if (!darfOwnedVerzeichnisEntfernen(flags)) {
      removals.push({
        kind: 'dir',
        path: dir,
        removed: false,
        reason: 'owned process still active, unknown, close unconfirmed, or Docker services unverified',
        recovery: `Inspect ${dir} and owned Docker network/containers before manual removal. Do not prune global Docker state.`,
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
    stack,
  }
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
  }
}
