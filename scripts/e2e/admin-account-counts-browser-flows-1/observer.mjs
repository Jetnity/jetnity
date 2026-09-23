#!/usr/bin/env node
// Server-boundary observer consumer. Page request logs cannot prove silence.

import { RPC_PATH_MARKERS, WRAPPER_RPC } from './constants.mjs'

export function isWrapperCall(call) {
  if (!call || typeof call !== 'object') return false
  const path = String(call.path ?? '')
  const method = String(call.method ?? '').toUpperCase()
  if (!RPC_PATH_MARKERS.some((marker) => path.includes(marker))) return false
  return method === '' || method === 'POST' || method === 'GET'
}

export function wrapperCalls(since) {
  return (since?.calls ?? []).filter(isWrapperCall)
}

export function assertObserverComplete(since, purpose) {
  if (!since || since.complete !== true) {
    throw new Error(`incomplete observer interval cannot ${purpose}`)
  }
  return since
}

export function assertObservedWrapper(since, { requireComplete = true } = {}) {
  if (requireComplete) assertObserverComplete(since, 'prove an observed wrapper RPC')
  const hits = wrapperCalls(since)
  if (hits.length === 0) {
    throw new Error(
      `no observed server RPC for ${WRAPPER_RPC}; page request events are not a substitute`,
    )
  }
  return hits
}

export function assertNoWrapperCalls(since, { priorPositiveControl }) {
  if (!priorPositiveControl) {
    throw new Error('OFF/no-call assertion requires a prior real positive observed-call control')
  }
  assertObserverComplete(since, 'prove no wrapper RPC')
  const hits = wrapperCalls(since)
  if (hits.length !== 0) {
    throw new Error(`expected zero ${WRAPPER_RPC} calls, observed ${hits.length}`)
  }
  return true
}

export async function waitForRequestsToSettle(page, { timeoutMs, signal } = {}) {
  if (signal?.aborted) throw new Error('aborted while waiting for requests to settle')
  if (typeof page.waitForLoadState === 'function') {
    try {
      await page.waitForLoadState('networkidle', { timeout: timeoutMs })
    } catch (error) {
      if (signal?.aborted) throw error
      // Fall through: settle wait is a bound, not a silent PASS.
    }
  }
}
