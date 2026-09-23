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

export class OwnershipUncertaintyError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'OwnershipUncertaintyError'
    if (cause) this.cause = cause
  }
}

export function parseAbsoluteHttpUrl(raw) {
  if (raw instanceof URL) {
    if (raw.protocol !== 'http:' && raw.protocol !== 'https:') return null
    return raw
  }
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const text = raw.trim()
  if (text.startsWith('//')) return null
  try {
    const url = new URL(text)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

export function effectivePort(url) {
  if (url.port) return url.port
  if (url.protocol === 'https:') return '443'
  if (url.protocol === 'http:') return '80'
  return ''
}

export function sameExactOrigin(candidate, allowedOrigin) {
  const left = parseAbsoluteHttpUrl(candidate)
  const right = parseAbsoluteHttpUrl(allowedOrigin)
  if (!left || !right) return false
  return (
    left.protocol === right.protocol &&
    left.hostname.toLowerCase() === right.hostname.toLowerCase() &&
    effectivePort(left) === effectivePort(right)
  )
}

export function isNumericLoopbackOrigin(raw) {
  const url = parseAbsoluteHttpUrl(raw)
  if (!url) return false
  const host = url.hostname.toLowerCase()
  return host === '127.0.0.1' || host === '[::1]' || host === '::1'
}

export function rejectUnsafeRedirect(location, credentialsPresent, allowedOrigin = null) {
  if (!location) return false
  const text = String(location)
  if (text.startsWith('//')) {
    throw new Error('refusing protocol-relative redirect')
  }
  if (text.startsWith('/') && !text.startsWith('//')) return false
  const url = parseAbsoluteHttpUrl(text)
  if (!url) {
    throw new Error('refusing unparseable redirect')
  }
  if (allowedOrigin && !sameExactOrigin(url, allowedOrigin)) {
    if (credentialsPresent) {
      throw new Error('refusing remote redirect with credentials')
    }
    throw new Error('refusing foreign redirect origin')
  }
  if (!isNumericLoopbackOrigin(url.origin)) {
    if (credentialsPresent) {
      throw new Error('refusing remote redirect with credentials')
    }
    throw new Error(`refusing remote URL ${url.origin}`)
  }
  return false
}

export function rejectRemoteRedirect(location, credentialsPresent) {
  return rejectUnsafeRedirect(location, credentialsPresent)
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

export function createRunBudget(context) {
  const started = Date.now()
  const total = context.timeoutMs
  const signal = context.signal
  const parts = budgets(context)

  function remainingMs() {
    return Math.max(0, total - (Date.now() - started))
  }

  function assertLive(label) {
    if (signal?.aborted) {
      throw new Error(`aborted during ${label}`)
    }
    if (remainingMs() <= 0) {
      throw new Error(`overall budget exhausted during ${label}`)
    }
  }

  async function bound(label, ms, fn) {
    assertLive(label)
    const cap = Math.max(1, Math.min(ms, remainingMs()))
    let timer
    let onAbort
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} exceeded ${cap}ms`)), cap)
      if (typeof signal?.addEventListener === 'function') {
        onAbort = () => reject(new Error(`aborted during ${label}`))
        signal.addEventListener('abort', onAbort, { once: true })
      }
    })
    try {
      return await Promise.race([Promise.resolve().then(() => fn(cap)), timeout])
    } finally {
      clearTimeout(timer)
      if (onAbort && typeof signal?.removeEventListener === 'function') {
        signal.removeEventListener('abort', onAbort)
      }
    }
  }

  return {
    actionMs: parts.actionMs,
    scenarioMs: parts.scenarioMs,
    settleMs: parts.settleMs,
    remainingMs,
    assertLive,
    bound,
    action(label, fn) {
      return bound(label, parts.actionMs, fn)
    },
    scenario(label, fn) {
      return bound(label, Math.min(parts.scenarioMs, remainingMs() || parts.scenarioMs), fn)
    },
    signal,
  }
}
