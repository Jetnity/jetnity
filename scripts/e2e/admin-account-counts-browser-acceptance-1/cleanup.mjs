#!/usr/bin/env node
// Confirm bounded teardown for owned resources only.

import { existsSync, rmSync } from 'node:fs'
import { darfOwnedVerzeichnisEntfernen, stoppeOwnedChild } from './owned-lifecycle.mjs'
import { entferneOwnedWorkdir } from './stack.mjs'

export async function raeumeOwnedAuf(state = {}) {
  const reports = []
  if (state.appChild) {
    reports.push({ kind: 'app', ...(await stoppeOwnedChild(state.appChild)) })
  }
  if (state.stackChild) {
    reports.push({ kind: 'stack', ...(await stoppeOwnedChild(state.stackChild)) })
  }
  if (state.browserChild) {
    reports.push({ kind: 'browser', ...(await stoppeOwnedChild(state.browserChild)) })
  }

  const processesStopped = reports.every((item) => item.reaped || item.neverStarted)
  const reaped = processesStopped
  const neverStarted = reports.length === 0 || reports.every((item) => item.neverStarted)

  const removals = []
  if (state.workdir) {
    removals.push({
      kind: 'workdir',
      ...entferneOwnedWorkdir(state.workdir, { processesStopped, reaped, neverStarted }),
    })
  }
  if (state.privateDir && existsSync(state.privateDir)) {
    if (darfOwnedVerzeichnisEntfernen({ processesStopped, reaped, neverStarted })) {
      rmSync(state.privateDir, { recursive: true, force: true })
      removals.push({ kind: 'privateDir', removed: true })
    } else {
      removals.push({ kind: 'privateDir', removed: false, reason: 'owned process still active' })
    }
  }

  return {
    processesStopped,
    reaped,
    neverStarted,
    reports,
    removals,
    usedPkill: false,
    usedDockerPrune: false,
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
  return { blocked, allowed, unused }
}
