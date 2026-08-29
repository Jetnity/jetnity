// lib/server/providers/core/retry.ts
//
// Bounded, deterministic retry/backoff. Invalid configuration is rejected,
// never clamped into an unbounded policy.

import 'server-only'

import {
  PROVIDER_TRANSPORT_BOUNDS,
  type ProviderJitterStrategy,
  type ProviderRetryPolicy,
  type ProviderTimeoutPolicy,
  type ProviderValidatedRetryPolicy,
} from '@/lib/server/providers/core/domain'

export type ProviderPolicyValidation<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'invalid_configuration'; message: string }

function finiteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value)
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function validateProviderTimeoutPolicy(
  policy: ProviderTimeoutPolicy,
): ProviderPolicyValidation<ProviderTimeoutPolicy> {
  if (!finiteInteger(policy.timeoutMs)) {
    return { ok: false, reason: 'invalid_configuration', message: 'Timeout must be a finite integer.' }
  }
  if (
    policy.timeoutMs < PROVIDER_TRANSPORT_BOUNDS.minTimeoutMs ||
    policy.timeoutMs > PROVIDER_TRANSPORT_BOUNDS.maxTimeoutMs
  ) {
    return { ok: false, reason: 'invalid_configuration', message: 'Timeout is outside the allowed bound.' }
  }
  return { ok: true, value: { timeoutMs: policy.timeoutMs } }
}

const JITTER: readonly ProviderJitterStrategy[] = ['none', 'full', 'equal']

export function validateProviderRetryPolicy(
  policy: ProviderRetryPolicy,
): ProviderPolicyValidation<ProviderValidatedRetryPolicy> {
  if (!finiteInteger(policy.maxAttempts)) {
    return { ok: false, reason: 'invalid_configuration', message: 'maxAttempts must be a finite integer.' }
  }
  if (
    policy.maxAttempts < PROVIDER_TRANSPORT_BOUNDS.minAttempts ||
    policy.maxAttempts > PROVIDER_TRANSPORT_BOUNDS.maxAttempts
  ) {
    return { ok: false, reason: 'invalid_configuration', message: 'maxAttempts is outside the allowed bound.' }
  }
  if (!finiteInteger(policy.baseDelayMs) || policy.baseDelayMs < PROVIDER_TRANSPORT_BOUNDS.minDelayMs) {
    return { ok: false, reason: 'invalid_configuration', message: 'baseDelayMs must be a non-negative finite integer.' }
  }
  if (!finiteInteger(policy.maxDelayMs) || policy.maxDelayMs < policy.baseDelayMs) {
    return { ok: false, reason: 'invalid_configuration', message: 'maxDelayMs must be >= baseDelayMs.' }
  }
  if (policy.maxDelayMs > PROVIDER_TRANSPORT_BOUNDS.maxDelayMs) {
    return { ok: false, reason: 'invalid_configuration', message: 'maxDelayMs exceeds the allowed bound.' }
  }

  const jitter = policy.jitter ?? 'none'
  if (!JITTER.includes(jitter)) {
    return { ok: false, reason: 'invalid_configuration', message: 'Unsupported jitter strategy.' }
  }

  const maxRetryAfterMs = policy.maxRetryAfterMs ?? PROVIDER_TRANSPORT_BOUNDS.maxRetryAfterMs
  if (
    !finiteInteger(maxRetryAfterMs) ||
    maxRetryAfterMs < 0 ||
    maxRetryAfterMs > PROVIDER_TRANSPORT_BOUNDS.maxRetryAfterMs
  ) {
    return { ok: false, reason: 'invalid_configuration', message: 'maxRetryAfterMs is outside the allowed bound.' }
  }

  const retryableStatuses = new Set<number>()
  if (policy.retryableStatuses) {
    for (const status of policy.retryableStatuses) {
      if (!finiteInteger(status) || status < 100 || status > 599) {
        return { ok: false, reason: 'invalid_configuration', message: 'retryableStatuses contains an invalid status.' }
      }
      retryableStatuses.add(status)
    }
  }

  return {
    ok: true,
    value: {
      maxAttempts: policy.maxAttempts,
      baseDelayMs: policy.baseDelayMs,
      maxDelayMs: policy.maxDelayMs,
      jitter,
      retryOn429: policy.retryOn429 !== false,
      retry5xx: policy.retry5xx !== false,
      retryNetworkErrors: policy.retryNetworkErrors !== false,
      honorRetryAfter: policy.honorRetryAfter !== false,
      maxRetryAfterMs,
      retryableStatuses,
    },
  }
}

export function applyJitter(delayMs: number, jitter: ProviderJitterStrategy, random: () => number): number {
  if (delayMs <= 0 || jitter === 'none') return delayMs
  const sample = random()
  const unit = Number.isFinite(sample) ? Math.min(1, Math.max(0, sample)) : 0
  if (jitter === 'full') return Math.floor(delayMs * unit)
  return Math.floor(delayMs / 2 + (delayMs / 2) * unit)
}

export function computeProviderRetryDelayMs(input: {
  policy: ProviderValidatedRetryPolicy
  attempt: number
  retryAfterMs?: number | null
  random?: () => number
}): number {
  const exp = Math.min(
    input.policy.maxDelayMs,
    input.policy.baseDelayMs * 2 ** Math.max(0, input.attempt - 1),
  )
  let delay = applyJitter(exp, input.policy.jitter, input.random ?? Math.random)
  if (input.policy.honorRetryAfter && input.retryAfterMs != null && Number.isFinite(input.retryAfterMs)) {
    const honored = Math.min(Math.max(0, Math.floor(input.retryAfterMs)), input.policy.maxRetryAfterMs)
    delay = Math.min(input.policy.maxDelayMs, Math.max(delay, honored))
  }
  return Math.min(input.policy.maxDelayMs, Math.max(0, delay))
}

export function validateProviderRetryAfterMs(
  value: unknown,
  maxRetryAfterMs: number = PROVIDER_TRANSPORT_BOUNDS.maxRetryAfterMs,
): { ok: true; retryAfterMs: number | null } | { ok: false } {
  if (value == null) return { ok: true, retryAfterMs: null }
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > maxRetryAfterMs
  ) {
    return { ok: false }
  }
  return { ok: true, retryAfterMs: Math.floor(value) }
}

export function parseRetryAfterHeaderMs(
  raw: string | null,
  nowMs: number,
  maxRetryAfterMs: number,
): number | null {
  if (raw == null) return null
  const value = raw.trim()
  if (!value) return null
  if (/^\d+$/.test(value)) {
    const seconds = Number(value)
    if (!Number.isFinite(seconds) || seconds < 0) return null
    return Math.min(maxRetryAfterMs, seconds * 1000)
  }
  if (!/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value)) return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || !finiteNumber(nowMs)) return null
  const delta = parsed - nowMs
  if (!Number.isFinite(delta) || delta < 0) return null
  return Math.min(maxRetryAfterMs, Math.floor(delta))
}

export function isHardNonRetryableStatus(status: number): boolean {
  return status === 400 || status === 401 || status === 403
}

export function isRetryableHttpStatus(status: number, policy: ProviderValidatedRetryPolicy): boolean {
  if (isHardNonRetryableStatus(status)) return false
  if (status === 429) return policy.retryOn429
  if (status >= 500 && status <= 599) return policy.retry5xx
  return policy.retryableStatuses.has(status)
}

export async function sleepWithAbort(
  sleep: (ms: number, signal?: AbortSignal) => Promise<void>,
  ms: number,
  signal?: AbortSignal,
): Promise<'slept' | 'aborted'> {
  if (signal?.aborted) return 'aborted'
  if (ms <= 0) return 'slept'
  try {
    await sleep(ms, signal)
    return signal?.aborted ? 'aborted' : 'slept'
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) return 'aborted'
    throw error
  }
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String(error.name) : ''
  return name === 'AbortError' || name === 'TimeoutError'
}

export async function defaultProviderSleeper(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return
  if (signal?.aborted) {
    const error = new Error('aborted')
    error.name = 'AbortError'
    throw error
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)
    const onAbort = () => {
      cleanup()
      const error = new Error('aborted')
      error.name = 'AbortError'
      reject(error)
    }
    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
    signal?.addEventListener('abort', onAbort)
  })
}
