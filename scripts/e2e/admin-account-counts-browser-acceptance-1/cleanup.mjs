#!/usr/bin/env node
// Confirm bounded teardown for owned resources only.
// A CLI child exit is not Docker service/container teardown.
// Empty caller state is not proof that preflight created nothing.

import { existsSync, rmSync } from 'node:fs'
import { IMPLEMENTATION } from './implementation.mjs'
import { BROWSER_CLOSE_TIMEOUT_MS } from './constants.mjs'
import { darfOwnedVerzeichnisEntfernen, schliesseOwnedBrowser, stoppeOwnedChild } from './owned-lifecycle.mjs'
import { entferneOwnedWorkdir } from './stack.mjs'

export async function raeumeOwnedAuf(state = {}, { closeTimeoutMs = BROWSER_CLOSE_TIMEOUT_MS } = {}) {
  const declaredEmpty = state.allowEmpty === true
  const hasPreflight = Boolean(state.preflightOwned)
  if (!hasPreflight && !declaredEmpty && !state.appChild && !state.stackChild && !state.browserChild && !state.browserHandle) {
    return {
      processesStopped: false,
      reaped: false,
      neverStarted: false,
      unknown: true,
      ownershipRetained: true,
      dockerServicesUnverified: false,
      browserClosed: false,
      reports: [{ kind: 'preflight-state', error: 'cleanup invoked without owned preflight state; absence not inferred' }],
      removals: [],
      usedPkill: false,
      usedDockerPrune: false,
      stackExecution: IMPLEMENTATION.stackStart,
    }
  }

  const reports = []
  const closeReport = state.browserCloseReport || state.preflightOwned?.closeReport || null
  const liveHandle = state.browserHandle
    || (state.preflightOwned?.browserHandle && !closeReport?.closed ? state.preflightOwned.browserHandle : null)

  if (liveHandle && !closeReport?.closed) {
    reports.push({ kind: 'browser-context', ...(await schliesseOwnedBrowser(liveHandle, { closeTimeoutMs })) })
  } else if (closeReport) {
    reports.push({ kind: 'browser-context', ...closeReport, reused: true })
  }

  if (state.appChild) {
    reports.push({ kind: 'app', ...(await stoppeOwnedChild(state.appChild)) })
  }
  if (state.stackChild) {
    reports.push({
      kind: 'stack-cli-child',
      ...(await stoppeOwnedChild(state.stackChild)),
      dockerServicesUnverified: state.dockerServicesConfirmed !== true,
      note: 'Supabase CLI child exit is not Docker service/container teardown.',
    })
  }
  if (state.browserChild) {
    reports.push({ kind: 'browser', ...(await stoppeOwnedChild(state.browserChild)) })
  }

  const browserReports = reports.filter((item) => item.kind === 'browser-context')
  const browserClosed = browserReports.length === 0
    ? !state.preflightOwned?.browserLaunched
    : browserReports.every((item) => item.closed === true || item.skipped === true)
  const browserFailed = browserReports.some((item) => item.closed === false || item.ownershipRetained === true || item.unknown === true)

  const childReports = reports.filter((item) => item.kind !== 'browser-context')
  const processesStopped = childReports.length === 0
    ? true
    : childReports.every((item) => item.reaped === true || item.neverStarted === true)
  const reaped = processesStopped && !browserFailed
  const unknown = reports.some((item) => item.unknown === true)
  const ownershipRetained = browserFailed || reports.some((item) => item.ownershipRetained === true)
  const dockerServicesUnverified = state.stackChild
    ? state.dockerServicesConfirmed !== true
    : false
  const neverStarted = !state.preflightOwned?.browserLaunched
    && !state.stackChild
    && !state.appChild
    && !state.browserChild
    && !liveHandle

  const removalArgs = {
    processesStopped: processesStopped && browserClosed,
    reaped: reaped && browserClosed,
    neverStarted: neverStarted && !browserFailed,
    unknown: unknown || browserFailed,
    ownershipRetained,
    dockerServicesUnverified,
  }

  const privateDir = state.privateDir || state.preflightOwned?.privateHome || null
  const removals = []
  if (state.workdir) {
    removals.push({
      kind: 'workdir',
      ...entferneOwnedWorkdir(state.workdir, removalArgs),
    })
  }
  if (privateDir && existsSync(privateDir)) {
    if (darfOwnedVerzeichnisEntfernen(removalArgs)) {
      rmSync(privateDir, { recursive: true, force: true })
      removals.push({ kind: 'privateDir', removed: !existsSync(privateDir) })
    } else {
      removals.push({
        kind: 'privateDir',
        removed: false,
        reason: 'owned process still active, unknown, close unconfirmed, or Docker services unverified',
      })
    }
  } else if (privateDir) {
    removals.push({ kind: 'privateDir', removed: true, alreadyAbsent: true })
  }

  return {
    processesStopped,
    reaped,
    neverStarted,
    unknown,
    ownershipRetained,
    dockerServicesUnverified,
    browserClosed,
    privateHomeRemoved: removals.some((item) => item.kind === 'privateDir' && item.removed === true),
    reports,
    removals,
    usedPkill: false,
    usedDockerPrune: false,
    stackExecution: IMPLEMENTATION.stackStart,
  }
}

export function cleanupDryRunKontrolle() {
  const blocked = darfOwnedVerzeichnisEntfernen({
    processesStopped: false,
    reaped: false,
    neverStarted: false,
  })
  const allowed = darfOwnedVerzeichnisEntfernen({
    processesStopped: true,
    reaped: true,
    neverStarted: false,
  })
  const unused = darfOwnedVerzeichnisEntfernen({
    processesStopped: false,
    reaped: false,
    neverStarted: true,
  })
  const signalFailure = darfOwnedVerzeichnisEntfernen({
    processesStopped: true,
    reaped: true,
    neverStarted: false,
    unknown: false,
    ownershipRetained: true,
  })
  const dockerUnverified = darfOwnedVerzeichnisEntfernen({
    processesStopped: true,
    reaped: true,
    neverStarted: false,
    dockerServicesUnverified: true,
  })
  return {
    blocked,
    allowed,
    unused,
    signalFailureBlocked: signalFailure === false,
    dockerUnverifiedBlocked: dockerUnverified === false,
  }
}
