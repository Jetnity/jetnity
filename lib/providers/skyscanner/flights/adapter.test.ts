import assert from 'node:assert/strict'
import test from 'node:test'

import { skyscannerFixtureNormalisieren } from '@/lib/providers/skyscanner/flights/adapter'
import type { SkyscannerNormalizedLivePricesResponse } from '@/lib/providers/skyscanner/flights/contracts'

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

test('fixture normalizes realistic offers as fixture evidence only', () => {
  const result = skyscannerFixtureNormalisieren(response())
  assert.equal(result.offers.length, 1)
  assert.equal(result.evidenceMode, 'fixture')
  assert.equal(result.providerId, 'skyscanner')
  assert.equal(result.offers[0]?.amount, 212.4)
  assert.equal(result.offers[0]?.currency, 'CHF')

  const runtimeShape = result as unknown as Record<string, unknown>
  assert.equal('sourceKind' in runtimeShape, false)
  assert.equal('persistenz' in runtimeShape, false)
  assert.equal('akteur' in runtimeShape, false)
})

test('fixture result exposes no commercial-truth fields that could be promoted by passthrough', () => {
  const offer = skyscannerFixtureNormalisieren(response()).offers[0] as unknown as Record<string, unknown>
  assert.ok(offer)
  assert.equal('sourceKind' in offer, false)
  assert.equal('persistenz' in offer, false)
  assert.equal('freshUntil' in offer, false)
  assert.equal('availability' in offer, false)
  assert.equal('affiliate' in offer, false)
})

test('malformed amount, timestamp, identifiers and IATA legs are dropped', () => {
  const malformed = [
    response({ price: { amount: Number.NaN, currency: 'CHF' } }).offers[0]!,
    response({ retrievedAt: 'not-a-date' }).offers[0]!,
    response({ itineraryId: '  ' }).offers[0]!,
    response({ legs: [{ originIata: 'ZZZZ', destinationIata: 'LHR', departureAt: '2026-09-15T08:00:00Z', arrivalAt: '2026-09-15T09:00:00Z' }] }).offers[0]!,
  ]
  const result = skyscannerFixtureNormalisieren({
    schema: 'jetnity.skyscanner.live-prices.normalized.v1',
    offers: malformed,
  })
  assert.equal(result.offers.length, 0)
})

test('currency is normalized but invalid currency is rejected', () => {
  const normalized = skyscannerFixtureNormalisieren(response({ price: { amount: 212.4, currency: ' chf ' } }))
  assert.equal(normalized.offers[0]?.currency, 'CHF')

  const rejected = skyscannerFixtureNormalisieren(response({ price: { amount: 212.4, currency: 'EURO' } }))
  assert.equal(rejected.offers.length, 0)
})

test('non-https deeplinks are discarded and never preserved as attribution evidence', () => {
  const result = skyscannerFixtureNormalisieren(response({ deeplink: 'javascript:alert(1)' }))
  assert.equal(result.offers.length, 1)
  assert.equal(result.offers[0]?.deeplink, null)
})
