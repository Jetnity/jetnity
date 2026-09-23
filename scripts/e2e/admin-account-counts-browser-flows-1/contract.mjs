#!/usr/bin/env node
// Frozen §4 consumer contract. Reject incomplete or injection-capable context.

import {
  ACTOR_KEYS,
  CONTRACT_VERSION,
  FLOW_GATE_IDS,
  FORBIDDEN_CONTEXT_KEYS,
  GATE_RESULTS,
} from './constants.mjs'

export class ContextContractError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ContextContractError'
  }
}

export function isNumericLoopbackOrigin(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return false
  let url
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  return host === '127.0.0.1' || host === '[::1]' || host === '::1'
}

export function rejectRemoteRedirect(location, credentialsPresent) {
  if (!location) return false
  let url
  try {
    url = new URL(location)
  } catch {
    if (String(location).startsWith('/')) return false
    throw new Error(`refusing unparseable redirect: ${location}`)
  }
  if (!isNumericLoopbackOrigin(url.origin)) {
    if (credentialsPresent) {
      throw new Error('refusing remote redirect with credentials')
    }
    throw new Error(`refusing remote URL ${url.origin}`)
  }
  return false
}

function requireFunction(value, name) {
  if (typeof value !== 'function') {
    throw new ContextContractError(`context.${name} must be a function`)
  }
}

function requireNonEmptyString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ContextContractError(`context.${name} must be a non-empty string`)
  }
}

function assertNoInjectionApi(context) {
  for (const key of FORBIDDEN_CONTEXT_KEYS) {
    if (Object.hasOwn(context, key) && context[key] != null) {
      throw new ContextContractError(`real-mode context must not provide ${key}`)
    }
  }
  if (context.mode === 'fake' || context.fake === true) {
    throw new ContextContractError('real-mode API cannot enable fake/session injection')
  }
  if (typeof context.injectSession === 'function' || typeof context.forgeSession === 'function') {
    throw new ContextContractError('real-mode API cannot enable fake/session injection')
  }
}

export function validateContext(context) {
  if (context == null || typeof context !== 'object') {
    throw new ContextContractError('context is required')
  }
  if (context.contractVersion !== CONTRACT_VERSION) {
    throw new ContextContractError(
      `wrong contractVersion ${String(context.contractVersion)} !== ${CONTRACT_VERSION}`,
    )
  }
  assertNoInjectionApi(context)
  requireNonEmptyString(context.runId, 'runId')
  requireNonEmptyString(context.productHead, 'productHead')
  requireNonEmptyString(context.evidenceDir, 'evidenceDir')
  if (typeof context.timeoutMs !== 'number' || !(context.timeoutMs > 0)) {
    throw new ContextContractError('context.timeoutMs must be a positive number')
  }
  if (!context.signal || typeof context.signal.aborted !== 'boolean') {
    throw new ContextContractError('context.signal must be an AbortSignal')
  }
  const accounts = context.accounts
  if (!accounts || typeof accounts !== 'object') {
    throw new ContextContractError('context.accounts is required')
  }
  for (const key of ACTOR_KEYS) {
    const actor = accounts[key]
    if (!actor || typeof actor !== 'object') {
      throw new ContextContractError(`context.accounts.${key} is required`)
    }
    for (const field of ['id', 'email', 'password']) {
      if (typeof actor[field] !== 'string' || actor[field].trim() === '') {
        throw new ContextContractError(`context.accounts.${key}.${field} must be a string`)
      }
    }
  }
  if (!context.localApi || typeof context.localApi !== 'object') {
    throw new ContextContractError('context.localApi is required')
  }
  if (!isNumericLoopbackOrigin(context.localApi.origin)) {
    throw new ContextContractError('context.localApi.origin must be a numeric-loopback URL')
  }
  requireNonEmptyString(context.localApi.anonKey, 'localApi.anonKey')
  requireFunction(context.useApp, 'useApp')
  requireFunction(context.newBrowserSession, 'newBrowserSession')
  requireFunction(context.closeBrowserSession, 'closeBrowserSession')
  if (!context.fixture || typeof context.fixture !== 'object') {
    throw new ContextContractError('context.fixture is required')
  }
  for (const name of ['setStatus', 'setRole', 'prepareCountScenario', 'expectedCounts', 'setWrapperPresent']) {
    requireFunction(context.fixture[name], `fixture.${name}`)
  }
  if (!context.rpcObserver || typeof context.rpcObserver !== 'object') {
    throw new ContextContractError('context.rpcObserver is required')
  }
  requireFunction(context.rpcObserver.mark, 'rpcObserver.mark')
  requireFunction(context.rpcObserver.since, 'rpcObserver.since')
  return context
}

export function emptyGates(result, notes) {
  if (!GATE_RESULTS.includes(result)) {
    throw new Error(`invalid gate result ${result}`)
  }
  return FLOW_GATE_IDS.map((id) => ({
    id,
    result,
    evidence: null,
    notes,
  }))
}

export function makeGate(id, { result, evidence = null, notes = null }) {
  if (!FLOW_GATE_IDS.includes(id)) throw new Error(`unknown flow gate ${id}`)
  if (!GATE_RESULTS.includes(result)) throw new Error(`invalid gate result ${result}`)
  return { id, result, evidence, notes }
}

export function assertGateSetComplete(gates) {
  const ids = gates.map((gate) => gate.id)
  const missing = FLOW_GATE_IDS.filter((id) => !ids.includes(id))
  const extra = ids.filter((id) => !FLOW_GATE_IDS.includes(id))
  const dupes = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (missing.length || extra.length || dupes.length) {
    throw new Error(
      `gate set incomplete: missing=${missing.join(',') || 'none'} extra=${extra.join(',') || 'none'} dupes=${dupes.join(',') || 'none'}`,
    )
  }
  return true
}

export function resultOf(gates, id) {
  return gates.find((gate) => gate.id === id)?.result
}

export function passed(gates, id) {
  return resultOf(gates, id) === 'PASS'
}

export function budgets(context) {
  const total = context.timeoutMs
  return {
    actionMs: Math.max(1_000, Math.min(15_000, total)),
    scenarioMs: Math.max(2_000, Math.min(60_000, total)),
    settleMs: Math.max(500, Math.min(8_000, total)),
  }
}
