import assert from 'node:assert/strict'
import test from 'node:test'

import type { FlightProviderSearchRequest } from '@/lib/providers/flights/domain'
import {
  skyscannerLivePricesNormalisieren,
  skyscannerOfferZuCommercialQuote,
} from '@/lib/providers/skyscanner/flights/adapter'
import type { SkyscannerNormalizedLivePricesResponse } from '@/lib/providers/skyscanner/flights/contracts'

const request: FlightProviderSearchRequest = {
  originIata: 'ZRH',
  destinationIata: 'LHR',
  departureDate: '2026-09-15',
  adults: 1,
  currency: 'CHF',
  market: 'CH',
  locale: 'de-CH',
}

function response(overrides: Partial<SkyscannerNormalizedLivePricesResponse['offers'][number]> = {}): SkyscannerNormalizedLivePricesResponse {
  return {
    schema: 'jetnity.skyscanner.live-prices.normalized.v1',
    offers: [
      {
        itineraryId: 'itin-1',
        pricingOptionId: 'price-1',
        price: { amount: 212.4, currency: 'CHF' },
        retrievedAt: '2026-08-29T15:00:00.000Z',
        deeplink: 'https://example.test/book/itin-1',
        legs: [
          {
            originIata: 'ZRH',
            destinationIata: 'LHR',
            departureAt: '2026-09-15T08:00:00.000Z',
            arrivalAt: '2026-09-15T09:45:00.000Z',
            marketingCarrier: 'XX',
            flightNumber: '123',
          },
        ],
        ...overrides,
      },
    ],
  }
}

test('fixture normalizes realistic offers but cannot mint commercial provider truth', () => {
  const executionContext = { mode: 'fixture' } as const
  const result = skyscannerLivePricesNormalisieren({ response: response(), executionContext })
  assert.equal(result.offers.length, 1)
  assert.equal(result.executionMode, 'fixture')

  const promoted = skyscannerOfferZuCommercialQuote({
    request,
    result,
    offer: result.offers[0]!,
    executionContext,
  })
  assert.deepEqual(promoted, { ok: false, reason: 'fixture_not_trusted' })
})

test('future trusted live transport can produce an ephemeral S5-A quote without invented freshness', () => {
  const executionContext = { mode: 'live_transport', trustedTransport: true } as const
  const result = skyscannerLivePricesNormalisieren({ response: response(), executionContext })
  const promoted = skyscannerOfferZuCommercialQuote({
    request,
    result,
    offer: result.offers[0]!,
    executionContext,
  })

  assert.equal(promoted.ok, true)
  if (!promoted.ok) return
  assert.equal(promoted.quote.providerId, 'skyscanner')
  assert.equal(promoted.quote.sourceKind, 'live_api')
  assert.equal(promoted.quote.persistenz, 'ephemeral')
  assert.equal(promoted.quote.freshUntil, null)
  assert.equal(promoted.quote.availability, 'unknown')
  assert.equal(promoted.quote.amount, 212.4)
  assert.equal(promoted.quote.quotedCurrency, 'CHF')
  assert.equal(promoted.quote.affiliate.status, 'present')
})

test('currency mismatch fails closed instead of pretending conversion evidence', () => {
  const executionContext = { mode: 'live_transport', trustedTransport: true } as const
  const result = skyscannerLivePricesNormalisieren({ response: response(), executionContext })
  const promoted = skyscannerOfferZuCommercialQuote({
    request: { ...request, currency: 'EUR' },
    result,
    offer: result.offers[0]!,
    executionContext,
  })
  assert.deepEqual(promoted, { ok: false, reason: 'currency_mismatch' })
})

test('malformed amount, timestamp, identifiers and IATA legs are dropped', () => {
  const executionContext = { mode: 'fixture' } as const
  const malformed = [
    response({ price: { amount: Number.NaN, currency: 'CHF' } }).offers[0]!,
    response({ retrievedAt: 'not-a-date' }).offers[0]!,
    response({ itineraryId: '  ' }).offers[0]!,
    response({ legs: [{ originIata: 'ZZZZ', destinationIata: 'LHR', departureAt: '2026-09-15T08:00:00Z', arrivalAt: '2026-09-15T09:00:00Z' }] }).offers[0]!,
  ]
  const result = skyscannerLivePricesNormalisieren({
    response: { schema: 'jetnity.skyscanner.live-prices.normalized.v1', offers: malformed },
    executionContext,
  })
  assert.equal(result.offers.length, 0)
})

test('non-https deeplinks are never preserved as affiliate evidence', () => {
  const executionContext = { mode: 'live_transport', trustedTransport: true } as const
  const result = skyscannerLivePricesNormalisieren({
    response: response({ deeplink: 'javascript:alert(1)' }),
    executionContext,
  })
  assert.equal(result.offers[0]?.deeplink, null)

  const promoted = skyscannerOfferZuCommercialQuote({
    request,
    result,
    offer: result.offers[0]!,
    executionContext,
  })
  assert.equal(promoted.ok, true)
  if (!promoted.ok) return
  assert.equal(promoted.quote.affiliate.status, 'absent')
  assert.equal(promoted.quote.affiliate.attributionRef, null)
})
