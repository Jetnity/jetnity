import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  DEFAULT_SENSITIVE_HEADER_NAMES,
  buildProviderRequestHeaders,
  headerNamesAreSecretSafe,
  isSensitiveHeaderName,
  isValidHttpHeaderName,
  redactHeaderName,
  resolveRequestIdHeaderName,
} from '@/lib/server/providers/core'

describe('provider transport header redaction', () => {
  test('standard secret header names are sensitive', () => {
    assert.equal(isSensitiveHeaderName('X-API-Key'), true)
    assert.equal(isSensitiveHeaderName('authorization'), true)
    assert.equal(isSensitiveHeaderName('Cookie'), true)
    assert.equal(isSensitiveHeaderName('accept'), false)
    assert.ok(DEFAULT_SENSITIVE_HEADER_NAMES.includes('x-api-key'))
  })

  test('adapters can register additional sensitive names', () => {
    assert.equal(isSensitiveHeaderName('x-partner-secret', ['X-Partner-Secret']), true)
    assert.equal(isSensitiveHeaderName('x-partner-secret'), false)
  })

  test('header names are lowercased and values stay only on the outbound object', () => {
    const built = buildProviderRequestHeaders({
      publicHeaders: { Accept: 'application/json' },
      secretHeaders: { 'X-API-Key': 'super-secret-key' },
    })
    assert.equal(built.ok, true)
    if (!built.ok) return
    assert.equal(built.headers.outbound['x-api-key'], 'super-secret-key')
    assert.deepEqual(built.headers.sentHeaderNames.sort(), ['accept', 'x-api-key'])
    assert.equal(redactHeaderName('X-API-Key'), 'x-api-key')
    assert.equal(headerNamesAreSecretSafe(built.headers.sentHeaderNames, ['super-secret-key']), true)
  })

  test('invalid header names are rejected', () => {
    const built = buildProviderRequestHeaders({
      publicHeaders: { 'Bad Header': 'x' },
    })
    assert.equal(built.ok, false)
  })

  test('request-id header names must be valid and non-sensitive', () => {
    assert.equal(isValidHttpHeaderName('x-request-id'), true)
    assert.equal(isValidHttpHeaderName('Bad Header'), false)
    const fallback = resolveRequestIdHeaderName(undefined)
    assert.equal(fallback.ok, true)
    if (!fallback.ok) return
    assert.equal(fallback.name, 'x-request-id')
    const custom = resolveRequestIdHeaderName('X-Request-Id')
    assert.equal(custom.ok, true)
    if (!custom.ok) return
    assert.equal(custom.name, 'x-request-id')
    assert.equal(resolveRequestIdHeaderName('authorization').ok, false)
    assert.equal(resolveRequestIdHeaderName('Set-Cookie').ok, false)
    assert.equal(resolveRequestIdHeaderName('x-api-key').ok, false)
    assert.equal(resolveRequestIdHeaderName('x-partner-request-id').ok, true)
    assert.equal(resolveRequestIdHeaderName('x-partner-secret').ok, true)
    assert.equal(resolveRequestIdHeaderName('x-partner-secret', ['x-partner-secret']).ok, false)
    assert.equal(resolveRequestIdHeaderName('x-partner-request-id', ['x-partner-secret']).ok, true)
  })
})
