import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  applyJitter,
  computeProviderRetryDelayMs,
  defaultProviderSleeper,
  isAbortError,
  isHardNonRetryableStatus,
  isRetryableHttpStatus,
  parseRetryAfterHeaderMs,
  sleepWithAbort,
  validateProviderRetryAfterMs,
  validateProviderRetryPolicy,
  validateProviderTimeoutPolicy,
} from '@/lib/server/providers/core'

describe('provider transport retry policy', () => {
  test('rejects unbounded or invalid retry configuration', () => {
    assert.equal(validateProviderRetryPolicy({ maxAttempts: 0, baseDelayMs: 10, maxDelayMs: 20 }).ok, false)
    assert.equal(validateProviderRetryPolicy({ maxAttempts: 9, baseDelayMs: 10, maxDelayMs: 20 }).ok, false)
    assert.equal(validateProviderRetryPolicy({ maxAttempts: 2, baseDelayMs: -1, maxDelayMs: 20 }).ok, false)
    assert.equal(validateProviderRetryPolicy({ maxAttempts: 2, baseDelayMs: 50, maxDelayMs: 20 }).ok, false)
    assert.equal(validateProviderRetryPolicy({ maxAttempts: Number.POSITIVE_INFINITY, baseDelayMs: 10, maxDelayMs: 20 }).ok, false)
    assert.equal(validateProviderRetryPolicy({ maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 20, maxRetryAfterMs: 120_000 }).ok, false)
    assert.equal(validateProviderTimeoutPolicy({ timeoutMs: 0 }).ok, false)
    assert.equal(validateProviderTimeoutPolicy({ timeoutMs: 200_000 }).ok, false)
    assert.equal(validateProviderRetryAfterMs(null).ok, true)
    assert.equal(validateProviderRetryAfterMs(0).ok, true)
    assert.equal(validateProviderRetryAfterMs(4_000).ok, true)
    assert.equal(validateProviderRetryAfterMs(Number.NaN).ok, false)
    assert.equal(validateProviderRetryAfterMs(Number.POSITIVE_INFINITY).ok, false)
    assert.equal(validateProviderRetryAfterMs(-1).ok, false)
    assert.equal(validateProviderRetryAfterMs(120_000).ok, false)
  })

  test('accepts a bounded explicit policy', () => {
    const policy = validateProviderRetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 800,
      jitter: 'none',
    })
    assert.equal(policy.ok, true)
    if (!policy.ok) return
    assert.equal(policy.value.maxAttempts, 3)
    assert.equal(isHardNonRetryableStatus(401), true)
    assert.equal(isRetryableHttpStatus(401, policy.value), false)
    assert.equal(isRetryableHttpStatus(429, policy.value), true)
    assert.equal(isRetryableHttpStatus(502, policy.value), true)
    assert.equal(isRetryableHttpStatus(404, policy.value), false)
  })

  test('retry delay stays bounded and honors safe Retry-After', () => {
    const policy = validateProviderRetryPolicy({
      maxAttempts: 4,
      baseDelayMs: 200,
      maxDelayMs: 1_000,
      jitter: 'none',
    })
    assert.equal(policy.ok, true)
    if (!policy.ok) return
    const backoff = computeProviderRetryDelayMs({ policy: policy.value, attempt: 4, random: () => 0.5 })
    assert.ok(backoff <= 1_000)
    const honored = computeProviderRetryDelayMs({
      policy: policy.value,
      attempt: 1,
      retryAfterMs: 50_000,
      random: () => 0,
    })
    assert.equal(honored, 1_000)
    assert.equal(applyJitter(100, 'none', () => 0.9), 100)
    assert.equal(applyJitter(100, 'full', () => 0.5), 50)
  })

  test('Retry-After parsing clamps and rejects unsafe values', () => {
    assert.equal(parseRetryAfterHeaderMs('2', 0, 10_000), 2_000)
    assert.equal(parseRetryAfterHeaderMs('-1', 0, 10_000), null)
    assert.equal(parseRetryAfterHeaderMs('not-a-date', 0, 10_000), null)
    const future = new Date(1_700_000_000_000 + 8_000).toUTCString()
    assert.equal(parseRetryAfterHeaderMs(future, 1_700_000_000_000, 5_000), 5_000)
  })

  test('sleep does not wait when the request is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    assert.equal(await sleepWithAbort(defaultProviderSleeper, 5_000, controller.signal), 'aborted')
    const error = new Error('aborted')
    error.name = 'AbortError'
    assert.equal(isAbortError(error), true)
  })
})
