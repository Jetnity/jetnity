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

  test('only a destinations body failure carries the closed reason', async () => {
    const canary = 'CANARY-CLIENT-BODY'
    const satz = 'Provider response was not valid JSON.'
    const kaputt = (urlName: 'destinations' | 'search' | 'detail') => {
      const calls: string[] = []
      const http: ProviderHttpClient = async (request) => {
        calls.push(request.url)
        return {
          status: 200,
          headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(`{${canary}`))
              controller.close()
            },
          }),
        }
      }
      return { calls, http, urlName }
    }
    const ziele = kaputt('destinations')
    const created = createViatorSandboxClient({ env: enabled, http: ziele.http, nowMs: NOW })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const destinations = await created.client.destinations()
    assert.equal(destinations.ok, false)
    if (!destinations.ok) {
      assert.equal(destinations.reason, 'transport')
      assert.equal(destinations.transportKind, 'malformed_response')
      assert.equal(destinations.bodyReason, 'invalid_json')
    }
    assert.equal(ziele.calls.length, 1)
    assert.equal(ziele.calls[0]?.endsWith('/partner/destinations'), true)
    const zielText = JSON.stringify(destinations)
    assert.equal(zielText.includes(canary), false)
    assert.equal(zielText.includes(satz), false)
    assert.equal(zielText.includes(KEY), false)
    const suche = kaputt('search')
    const suchClient = createViatorSandboxClient({ env: enabled, http: suche.http, nowMs: NOW })
    assert.equal(suchClient.ok, true)
    if (!suchClient.ok) return
    const search = await suchClient.client.search({ destinationId: '343', currency: 'CHF' })
    assert.equal(search.ok, false)
    if (!search.ok) {
      assert.equal(search.transportKind, 'malformed_response')
      assert.equal('bodyReason' in search, false)
    }
    assert.equal(suche.calls.length, 1)
    assert.equal(JSON.stringify(search).includes(canary), false)
    assert.equal(JSON.stringify(search).includes(satz), false)
    const detailHttp = kaputt('detail')
    const detailClient = createViatorSandboxClient({ env: enabled, http: detailHttp.http, nowMs: NOW })
    assert.equal(detailClient.ok, true)
    if (!detailClient.ok) return
    const detail = await detailClient.client.detail({ productCode: '10001P1' })
    assert.equal(detail.ok, false)
    if (!detail.ok) assert.equal('bodyReason' in detail, false)
    assert.equal(detailHttp.calls.length, 1)
    const katalogHttp = response(200, { destinations: canary })
    const katalogClient = createViatorSandboxClient({ env: enabled, http: katalogHttp, nowMs: NOW })
    assert.equal(katalogClient.ok, true)
    if (!katalogClient.ok) return
    const katalog = await katalogClient.client.destinations()
    assert.equal(katalog.ok, false)
    if (!katalog.ok) {
      assert.equal(katalog.reason, 'malformed_response')
      assert.equal('bodyReason' in katalog, false)
      assert.equal(JSON.stringify(katalog).includes(canary), false)
    }
  })
})
