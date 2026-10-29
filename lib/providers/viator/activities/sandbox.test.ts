import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { createViatorSandboxClient } from '@/lib/providers/viator/activities/sandbox'
import { viatorSandboxZugang } from '@/lib/providers/viator/activities/zugang'
import type { ProviderHttpClient, ProviderHttpRequest } from '@/lib/server/providers/core'

const KEY = 'sandbox-key-do-not-leak'
const NOW = Date.parse('2026-10-28T12:00:00.000Z')
const UNIQUE = 'UNIQUE CONTENT SHOULD NOT LEAK'

function response(status: number, body: unknown): ProviderHttpClient {
  const encoded = new TextEncoder().encode(JSON.stringify(body))
  return async () => ({
    status,
    headers: { get: () => null },
    body: new ReadableStream({
      start(controller) {
        if (encoded.byteLength > 0) controller.enqueue(encoded)
        controller.close()
      },
    }),
  })
}

function recording(body: unknown, status = 200): { client: ProviderHttpClient; calls: ProviderHttpRequest[] } {
  const calls: ProviderHttpRequest[] = []
  const inner = response(status, body)
  return {
    calls,
    client: async (request) => {
      calls.push(request)
      return inner(request)
    },
  }
}

const enabled = {
  VIATOR_SANDBOX_CALLS: 'true',
  VIATOR_SANDBOX_API_KEY: KEY,
  VIATOR_API_ORIGIN: 'https://api.viator.com',
  VERCEL_ENV: 'preview',
}

describe('Viator sandbox client', () => {
  test('stays disabled without a flag, without a key, and in production', () => {
    const disabled = viatorSandboxZugang({})
    assert.equal(disabled.ok, false)
    if (!disabled.ok) assert.equal(disabled.reason, 'disabled')
    const missingKey = viatorSandboxZugang({ VIATOR_SANDBOX_CALLS: 'true' })
    assert.equal(missingKey.ok, false)
    if (!missingKey.ok) assert.equal(missingKey.reason, 'missing_key')
    const production = viatorSandboxZugang({
      VIATOR_SANDBOX_CALLS: 'true',
      VIATOR_SANDBOX_API_KEY: KEY,
      VERCEL_ENV: 'production',
    })
    assert.equal(production.ok, false)
    if (!production.ok) assert.equal(production.reason, 'production_blocked')
    const closed = createViatorSandboxClient({ env: {}, http: response(200, {}) })
    assert.equal(closed.ok, false)
    if (!closed.ok) assert.equal(closed.reason, 'disabled')
    const noNetwork = createViatorSandboxClient({ env: enabled })
    assert.equal(noNetwork.ok, false)
    if (!noNetwork.ok) assert.equal(noNetwork.reason, 'network_not_authorized')
    const http = recording({})
    const previewOhneFlag = createViatorSandboxClient({ env: { VERCEL_ENV: 'preview' }, http: http.client, nowMs: NOW })
    assert.equal(previewOhneFlag.ok, false)
    if (!previewOhneFlag.ok) assert.equal(previewOhneFlag.reason, 'disabled')
    const previewOhneKey = createViatorSandboxClient({
      env: { VERCEL_ENV: 'preview', VIATOR_SANDBOX_CALLS: 'true' },
      http: http.client,
      nowMs: NOW,
    })
    assert.equal(previewOhneKey.ok, false)
    if (!previewOhneKey.ok) assert.equal(previewOhneKey.reason, 'missing_key')
    assert.equal(http.calls.length, 0)
  })

  test('only exact preview or development may call the sandbox host', async () => {
    const http = recording({})
    const basis = {
      VIATOR_SANDBOX_CALLS: 'true',
      VIATOR_SANDBOX_API_KEY: KEY,
    }
    const verweigert = [undefined, '', ' ', 'staging', 'production', 'production ', 'Production', 'preview ', 'Preview', 'development ']
    for (const wert of verweigert) {
      const umgebung = wert === undefined ? basis : { ...basis, VERCEL_ENV: wert }
      const guard = viatorSandboxZugang(umgebung)
      assert.equal(guard.ok, false, JSON.stringify(wert))
      if (!guard.ok) assert.equal(guard.reason, wert === 'production' ? 'production_blocked' : 'environment_blocked')
      const created = createViatorSandboxClient({ env: umgebung, http: http.client, nowMs: NOW })
      assert.equal(created.ok, false, JSON.stringify(wert))
    }
    assert.equal(http.calls.length, 0)
    for (const wert of ['preview', 'development'] as const) {
      const erlaubt = recording({
        products: [{ productCode: '10001P1', title: 'Fixture walking tour', pricing: { summary: { fromPrice: 40 }, currency: 'EUR' } }],
      })
      const created = createViatorSandboxClient({
        env: { ...basis, VERCEL_ENV: wert },
        http: erlaubt.client,
        nowMs: NOW,
      })
      assert.equal(created.ok, true, wert)
      if (!created.ok) return
      const result = await created.client.search({ destinationId: '732', currency: 'EUR' })
      assert.equal(result.ok, true, wert)
      assert.equal(erlaubt.calls.length, 1)
      assert.equal(erlaubt.calls[0]?.url, 'https://api.sandbox.viator.com/partner/products/search')
    }
  })

  test('search uses the sandbox host, hides the key, and drops unique content', async () => {
    const http = recording({
      products: [
        {
          productCode: '10001P1',
          title: 'Fixture walking tour',
          pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
          productUrl: 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api',
          viatorUniqueContent: { text: UNIQUE },
        },
      ],
    })
    const created = createViatorSandboxClient({ env: enabled, http: http.client, nowMs: NOW })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.client.search({ destinationId: '732', currency: 'EUR' })
    assert.equal(http.calls.length, 1)
    const call = http.calls[0]!
    assert.equal(call.url, 'https://api.sandbox.viator.com/partner/products/search')
    assert.equal(call.url.includes('api.viator.com'), false)
    assert.equal(call.headers['exp-api-key'], KEY)
    assert.equal(call.headers.accept, 'application/json;version=2.0')
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.value.evidenceMode, 'content_preview')
    assert.equal(result.value.availabilityClaim, false)
    const serialized = JSON.stringify(result)
    assert.equal(serialized.includes(KEY), false)
    assert.equal(serialized.includes(UNIQUE), false)
    assert.equal(JSON.stringify(created.client).includes(KEY), false)
  })

  test('an invalid live check and a rejected language do not call the network', async () => {
    const http = recording({})
    const created = createViatorSandboxClient({ env: enabled, http: http.client, nowMs: NOW })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const checked = await created.client.check({ liveCheck: { productCode: '10001P1', participants: 2 } })
    assert.equal(checked.ok, false)
    if (!checked.ok) assert.equal(checked.reason, 'total_is_not_age_mix')
    const search = await created.client.search({ destinationId: '732', acceptLanguage: 'pl' })
    assert.equal(search.ok, false)
    if (!search.ok) assert.equal(search.reason, 'invalid_language')
    assert.equal(http.calls.length, 0)
  })

  test('transport failures do not echo the key', async () => {
    const http = recording({ message: KEY }, 500)
    const created = createViatorSandboxClient({ env: enabled, http: http.client, nowMs: NOW })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.client.detail({ productCode: '10001P1' })
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.reason, 'transport')
      assert.equal(JSON.stringify(result).includes(KEY), false)
    }
  })
})
