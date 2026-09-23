#!/usr/bin/env node
// Confirm bounded teardown for owned resources only.
// A CLI child exit is not Docker service/container teardown.

import { existsSync, rmSync } from 'node:fs'
import { IMPLEMENTATION } from './implementation.mjs'
import { darfOwnedVerzeichnisEntfernen, schliesseOwnedBrowser, stoppeOwnedChild } from './owned-lifecycle.mjs'
import { entferneOwnedWorkdir } from './stack.mjs'

export async function raeumeOwnedAuf(state = {}) {
  const reports = []

  if (state.browserHandle) {
    reports.push({ kind: 'browser-context', ...(await schliesseOwnedBrowser(state.browserHandle)) })
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

  const neverStarted = reports.length === 0 || reports.every((item) => item.neverStarted || item.closed === true && !item.started)
  const childReports = reports.filter((item) => item.kind !== 'browser-context')
  const processesStopped = childReports.length === 0
    ? true
    : childReports.every((item) => item.reaped === true || item.neverStarted === true)
  const reaped = processesStopped && childReports.every((item) => item.reaped !== false || item.neverStarted === true)
  const unknown = reports.some((item) => item.unknown === true)
  const ownershipRetained = reports.some((item) => item.ownershipRetained === true || (item.reaped === false && item.neverStarted !== true && item.kind !== 'browser-context'))
  const dockerServicesUnverified = state.stackChild
    ? state.dockerServicesConfirmed !== true
    : false
  const browserClosed = !state.browserHandle || reports.some((item) => item.kind === 'browser-context' && item.closed === true)

  const removalArgs = {
    processesStopped: processesStopped && browserClosed,
    reaped: reaped && browserClosed,
    neverStarted: neverStarted && !state.stackChild && !state.appChild && !state.browserChild && !state.browserHandle,
    unknown,
    ownershipRetained,
    dockerServicesUnverified,
  }

  const removals = []
  if (state.workdir) {
    removals.push({
      kind: 'workdir',
      ...entferneOwnedWorkdir(state.workdir, removalArgs),
    })
  }
  if (state.privateDir && existsSync(state.privateDir)) {
    if (darfOwnedVerzeichnisEntfernen(removalArgs)) {
      rmSync(state.privateDir, { recursive: true, force: true })
      removals.push({ kind: 'privateDir', removed: true })
    } else {
      removals.push({
        kind: 'privateDir',
        removed: false,
        reason: 'owned process still active, unknown, or Docker services unverified',
      })
    }
  }

  return {
    processesStopped,
    reaped,
    neverStarted: removalArgs.neverStarted,
    unknown,
    ownershipRetained,
    dockerServicesUnverified,
    browserClosed,
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
