import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { activityOptionAusViatorProdukt, viatorActivityProvider, viatorLivePruefen, viatorProduktLaden } from '@/lib/providers/viator/activities/anbinden'
import type { ProviderHttpClient, ProviderHttpRequest } from '@/lib/server/providers/core'

const KEY = 'sandbox-key-do-not-leak'
const NOW = Date.parse('2026-10-28T12:00:00.000Z')
const URL = 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api'
const IMAGE = 'https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/06/71/ef/dc.jpg'

function httpFor(routes: Record<string, unknown>): { client: ProviderHttpClient; calls: string[] } {
  const calls: string[] = []
  const client: ProviderHttpClient = async (request: ProviderHttpRequest) => {
    calls.push(request.url)
    const body = routes[request.url]
    const encoded = new TextEncoder().encode(JSON.stringify(body ?? {}))
    return {
      status: 200,
      headers: { get: () => null },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoded)
          controller.close()
        },
      }),
    }
  }
  return { client, calls }
}

const env = { VIATOR_SANDBOX_CALLS: 'true', VIATOR_SANDBOX_API_KEY: KEY }
const product = {
  productCode: '10001P1',
  title: 'Fixture walking tour',
  description: 'Eine kurze Beschreibung.',
  duration: { fixedDurationInMinutes: 90 },
  pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
  productUrl: URL,
  images: [{ isCover: true, variants: [{ url: IMAGE, width: 720, height: 480 }] }],
  reviews: { combinedAverageRating: 4.5, totalReviews: 4, sources: [{ text: 'SECRET REVIEW BODY' }] },
  viatorUniqueContent: { text: 'UNIQUE CONTENT SHOULD NOT LEAK' },
  productOptions: [{ productOptionCode: 'TG1' }],
  pricingInfo: {
    ageBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }],
  },
}

describe('Viator native seam', () => {
  test('missing key and production do not call the network', async () => {
    const http = httpFor({})
    const missing = await viatorProduktLaden('10001P1', { env: {}, http: http.client })
    assert.equal(missing.status, 'unavailable')
    const production = await viatorProduktLaden('10001P1', {
      env: { ...env, VERCEL_ENV: 'production' },
      http: http.client,
    })
    assert.equal(production.status, 'unavailable')
    assert.deepEqual(http.calls, [])
    assert.equal(viatorActivityProvider({ env: {} }), null)
  })

  test('an unmapped place does not guess a destination or call search', async () => {
    const http = httpFor({})
    const provider = viatorActivityProvider({ env, http: http.client, bindings: [], nowMs: NOW })
    assert.ok(provider)
    await assert.rejects(
      () =>
        provider!.suchen({
          destinationPlaceId: 'place-bangkok',
          destinationName: 'Bangkok',
          dayDate: '2026-11-02',
          participants: 2,
          currency: 'CHF',
          budgetAmount: null,
          interests: [],
          pace: null,
        }),
      /kein Viator-Ziel/,
    )
    assert.deepEqual(http.calls, [])
  })

  test('search keeps the supplier currency and drops the affiliate URL from the option', async () => {
    const http = httpFor({
      'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
    })
    const provider = viatorActivityProvider({
      env,
      http: http.client,
      nowMs: NOW,
      bindings: [{ jetnityPlaceId: 'place-bangkok', destinationId: 343 }],
    })
    const treffer = await provider!.suchen({
      destinationPlaceId: 'place-bangkok',
      destinationName: 'Bangkok',
      dayDate: '2026-11-02',
      participants: 2,
      currency: 'CHF',
      budgetAmount: null,
      interests: [],
      pace: null,
    })
    assert.equal(treffer.options[0]?.preisWaehrung, 'EUR')
    assert.equal(treffer.options[0]?.preisRolle, 'rrp_from')
    assert.equal(treffer.options[0]?.bildUrl, IMAGE)
    assert.equal(JSON.stringify(treffer).includes(URL), false)
    assert.equal(JSON.stringify(treffer).includes('UNIQUE CONTENT'), false)
    assert.equal(JSON.stringify(treffer).includes('SECRET REVIEW'), false)
    const option = activityOptionAusViatorProdukt({
      productCode: '10001P1',
      title: 'Fixture walking tour',
      description: null,
      durationMinutes: null,
      pricing: { amount: 10, currency: 'CHF', priceRole: 'rrp_from', checkoutCurrencyConfirmed: false },
      reviewSummary: null,
      image: null,
      cancellation: { stornierbar: null },
    })
    assert.equal(option?.preisWaehrung, 'CHF')
    assert.equal(option != null && 'productUrl' in option, false)
  })

  test('a traveller total is not treated as adults and does not request a live check', async () => {
    const http = httpFor({
      'https://api.sandbox.viator.com/partner/products/10001P1': product,
    })
    const ergebnis = await viatorLivePruefen(
      { productCode: '10001P1', participants: 2 },
      { env, http: http.client, nowMs: NOW },
    )
    assert.equal(ergebnis.status, 'invalid')
    assert.equal(ergebnis.availabilityClaim, false)
    assert.equal(http.calls.some((url) => url.includes('/availability/check')), false)
  })
})
