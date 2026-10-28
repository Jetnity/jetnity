import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { activityOptionAusViatorProdukt, viatorActivityProvider, viatorLivePruefen, viatorProduktLaden, viatorZielCacheLeeren } from '@/lib/providers/viator/activities/anbinden'
import { viatorOrtAufloesen, viatorKatalogLesen } from '@/lib/providers/viator/activities/destination'
import { viatorStartzeiten } from '@/lib/providers/viator/activities/kalender'
import type { ProviderHttpClient, ProviderHttpRequest } from '@/lib/server/providers/core'

const KATALOG = {
  destinations: [
    { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null },
    { destinationId: 343, name: 'Bangkok', type: 'CITY', parentDestinationId: 20, center: { latitude: 13.75, longitude: 100.5 } },
    { destinationId: 344, name: 'Chiang Mai', type: 'CITY', parentDestinationId: 20, center: { latitude: 18.79, longitude: 98.98 } },
    { destinationId: 51, name: 'France', type: 'COUNTRY', parentDestinationId: null },
    { destinationId: 479, name: 'Paris', type: 'CITY', parentDestinationId: 51, center: { latitude: 48.86, longitude: 2.35 } },
    { destinationId: 8, name: 'United States', type: 'COUNTRY', parentDestinationId: null },
    { destinationId: 901, name: 'Paris', type: 'CITY', parentDestinationId: 8, center: { latitude: 33.66, longitude: -95.55 } },
  ],
}

const ZIELE = 'https://api.sandbox.viator.com/partner/destinations'

function anfrage(teil: Partial<{ name: string; countryCode: string; latitude: number; longitude: number; placeId: string }> = {}) {
  return {
    destinationPlaceId: teil.placeId ?? 'place-1',
    destinationName: teil.name ?? 'Bangkok',
    dayDate: '2026-11-02',
    participants: 2,
    currency: 'CHF',
    budgetAmount: null,
    interests: [],
    pace: null,
    countryCode: teil.countryCode ?? 'TH',
    latitude: teil.latitude ?? 13.75,
    longitude: teil.longitude ?? 100.5,
  }
}
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
    viatorZielCacheLeeren()
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

  test('catalog resolution distinguishes country, repeat visits and ambiguity', async () => {
    const katalog = viatorKatalogLesen(KATALOG)
    assert.ok(katalog)
    const bangkok = viatorOrtAufloesen({ name: 'Bangkok', countryCode: 'TH', latitude: 13.75, longitude: 100.5, katalog: katalog! })
    const chiang = viatorOrtAufloesen({ name: 'Chiang Mai', countryCode: 'TH', latitude: 18.79, longitude: 98.98, katalog: katalog! })
    const parisFr = viatorOrtAufloesen({ name: 'Paris', countryCode: 'FR', latitude: 48.86, longitude: 2.35, katalog: katalog! })
    const parisUs = viatorOrtAufloesen({ name: 'Paris', countryCode: 'US', latitude: 33.66, longitude: -95.55, katalog: katalog! })
    const erneut = viatorOrtAufloesen({ name: 'Bangkok', countryCode: 'TH', latitude: 13.75, longitude: 100.5, katalog: katalog! })
    const unklar = viatorOrtAufloesen({ name: 'Paris', katalog: katalog! })
    assert.equal(bangkok.ok && bangkok.destinationId, '343')
    assert.equal(chiang.ok && chiang.destinationId, '344')
    assert.equal(parisFr.ok && parisFr.destinationId, '479')
    assert.equal(parisUs.ok && parisUs.destinationId, '901')
    assert.equal(erneut.ok && erneut.destinationId, '343')
    assert.equal(unklar.ok, false)
  })

  test('runtime search loads destinations once and does not guess an unknown city', async () => {
    viatorZielCacheLeeren()
    const http = httpFor({
      [ZIELE]: KATALOG,
      'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
    })
    const provider = viatorActivityProvider({ env, http: http.client, nowMs: NOW })
    const erster = await provider!.suchen(anfrage())
    const zweiter = await provider!.suchen(anfrage())
    assert.equal(erster.options[0]?.externalRef, '10001P1')
    assert.equal(zweiter.options[0]?.externalRef, '10001P1')
    assert.equal(http.calls.filter((url) => url === ZIELE).length, 1)
    const body = http.calls.includes('https://api.sandbox.viator.com/partner/products/search')
    assert.equal(body, true)
    await assert.rejects(() => provider!.suchen(anfrage({ name: 'Atlantis', countryCode: 'TH' })), /kein eindeutiges Viator-Ziel/)
  })

  test('search keeps the supplier currency and drops the affiliate URL from the option', async () => {
    viatorZielCacheLeeren()
    const http = httpFor({
      [ZIELE]: KATALOG,
      'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
    })
    const provider = viatorActivityProvider({ env, http: http.client, nowMs: NOW })
    const treffer = await provider!.suchen(anfrage())
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

  test('detail separates rate limit from a generic error and a stale time is rejected', async () => {
    viatorZielCacheLeeren()
    const begrenzt = httpFor({})
    const original = begrenzt.client
    const rateClient: ProviderHttpClient = async (request) => {
      if (request.url.endsWith('/products/10001P1')) {
        return { status: 429, headers: { get: (name) => (name.toLowerCase() === 'retry-after' ? '2' : null) }, body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"code":"TOO_MANY_REQUESTS"}')); c.close() } }) }
      }
      return original(request)
    }
    const rate = await viatorProduktLaden('10001P1', { env, http: rateClient, nowMs: NOW })
    assert.equal(rate.status, 'rate_limited')
    const zeiten = viatorStartzeiten(
      {
        productOptionCode: 'TG1',
        seasons: [{
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          startTimes: ['10:00', '11:00'],
          unavailableDates: [],
          timedEntries: [
            { startTime: '10:00', unavailableDates: ['2026-11-02'] },
            { startTime: '11:00', unavailableDates: [] },
          ],
        }],
      },
      '2026-11-02',
    )
    assert.deepEqual(zeiten, ['11:00'])
    assert.equal(viatorStartzeiten(undefined, '2026-01-01'), null)
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
