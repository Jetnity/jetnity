import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { FLUG_STOPP_PRAEFERENZEN, FLUG_SUCHE_GRENZEN, type FlugSuchanfrage } from '@/lib/flights/domain'
import { SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import { flugSuchanfrageLesen, flugSuchanfrageSchema } from '@/lib/flights/schema'
import type { FlightProviderSearchRequest } from '@/lib/providers/flights/domain'
import { flightProviderSearchRequestAus } from '@/lib/providers/flights/map-search-request'

const ANFRAGE_KONTEXT = { market: 'CH', locale: 'de-CH' } as const

type ForbiddenRequestKey =
  | 'returnDate'
  | 'originIata'
  | 'destinationIata'
  | 'departureDate'
  | 'context'
  | 'tripStartDate'
  | 'tripEndDate'
  | 'selectedDate'

type AssertAbsent<T, K extends string> = K extends keyof T ? never : true
type AssertPresent<T, K extends string> = K extends keyof T ? true : never

const _noReturnDate: AssertAbsent<FlightProviderSearchRequest, ForbiddenRequestKey> = true
const _hasStopPreference: AssertPresent<FlightProviderSearchRequest, 'stopPreference'> = true
void _noReturnDate
void _hasStopPreference

function gepruefteAnfrage(overrides: Partial<FlugSuchanfrage> = {}): FlugSuchanfrage {
  const gelesen = flugSuchanfrageLesen({ ...SUCHANFRAGE, ...overrides })
  assert.ok(gelesen, 'kanonische Validierung muss die Anfrage akzeptieren')
  return gelesen
}

function requestKeys(request: FlightProviderSearchRequest): string[] {
  return Object.keys(request).sort()
}

describe('FlightProviderSearchRequest reconciliation', () => {
  test('one-way maps as one ordered leg', () => {
    const anfrage = gepruefteAnfrage({
      legs: [{ origin: 'ZRH', destination: 'LHR', date: '2026-09-15' }],
    })
    const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)

    assert.deepEqual(request.legs, [{ originIata: 'ZRH', destinationIata: 'LHR', date: '2026-09-15' }])
    assert.equal(request.legs.length, 1)
  })

  test('two ordered return-like legs stay explicit and are not collapsed to returnDate', () => {
    const anfrage = gepruefteAnfrage({
      legs: [
        { origin: 'ZRH', destination: 'LHR', date: '2026-09-15' },
        { origin: 'LHR', destination: 'ZRH', date: '2026-09-22' },
      ],
    })
    const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)

    assert.deepEqual(request.legs, [
      { originIata: 'ZRH', destinationIata: 'LHR', date: '2026-09-15' },
      { originIata: 'LHR', destinationIata: 'ZRH', date: '2026-09-22' },
    ])
    assert.equal('returnDate' in request, false)
    assert.equal('originIata' in request, false)
    assert.equal('destinationIata' in request, false)
    assert.equal('departureDate' in request, false)
  })

  test('two-leg multi-city stays two explicit legs without a return shortcut', () => {
    const anfrage = gepruefteAnfrage({
      legs: [
        { origin: 'ZRH', destination: 'BKK', date: '2026-09-15' },
        { origin: 'BKK', destination: 'SYD', date: '2026-09-20' },
      ],
    })
    const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)

    assert.deepEqual(
      request.legs.map((bein) => `${bein.originIata}-${bein.destinationIata}-${bein.date}`),
      ['ZRH-BKK-2026-09-15', 'BKK-SYD-2026-09-20'],
    )
    assert.equal('returnDate' in request, false)
  })

  test('three-or-more leg multi-city order is preserved exactly', () => {
    const legs = [
      { origin: 'ZRH', destination: 'LHR', date: '2026-09-15' },
      { origin: 'LHR', destination: 'JFK', date: '2026-09-18' },
      { origin: 'JFK', destination: 'SFO', date: '2026-09-22' },
    ]
    const anfrage = gepruefteAnfrage({ legs })
    const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)

    assert.deepEqual(
      request.legs.map((bein) => `${bein.originIata}->${bein.destinationIata}@${bein.date}`),
      ['ZRH->LHR@2026-09-15', 'LHR->JFK@2026-09-18', 'JFK->SFO@2026-09-22'],
    )
  })

  test('disconnected legs are not rewritten or reordered', () => {
    const legs = [
      { origin: 'ZRH', destination: 'LHR', date: '2026-09-15' },
      { origin: 'BKK', destination: 'SYD', date: '2026-09-20' },
      { origin: 'NRT', destination: 'HND', date: '2026-09-25' },
    ]
    const anfrage = gepruefteAnfrage({ legs })
    const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)

    assert.deepEqual(request.legs, [
      { originIata: 'ZRH', destinationIata: 'LHR', date: '2026-09-15' },
      { originIata: 'BKK', destinationIata: 'SYD', date: '2026-09-20' },
      { originIata: 'NRT', destinationIata: 'HND', date: '2026-09-25' },
    ])
  })

  test('canonical maximum of six legs is representable through the validated path', () => {
    const legs = [
      { origin: 'ZRH', destination: 'LHR', date: '2026-11-01' },
      { origin: 'LHR', destination: 'JFK', date: '2026-11-03' },
      { origin: 'JFK', destination: 'MIA', date: '2026-11-06' },
      { origin: 'MIA', destination: 'MEX', date: '2026-11-09' },
      { origin: 'MEX', destination: 'CUN', date: '2026-11-12' },
      { origin: 'CUN', destination: 'ZRH', date: '2026-11-16' },
    ]
    assert.equal(legs.length, FLUG_SUCHE_GRENZEN.beine.max)
    const anfrage = gepruefteAnfrage({ legs })
    const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)

    assert.equal(request.legs.length, 6)
    assert.deepEqual(
      request.legs.map((bein) => bein.originIata + bein.destinationIata + bein.date),
      legs.map((bein) => bein.origin + bein.destination + bein.date),
    )
  })

  test('seven legs are rejected by the canonical validator, not a second provider limit', () => {
    const beine = Array.from({ length: FLUG_SUCHE_GRENZEN.beine.max + 1 }, (_, nr) => ({
      origin: 'ZRH',
      destination: 'LHR',
      date: `2026-11-0${nr + 1}`,
    }))
    assert.equal(flugSuchanfrageSchema.safeParse({ ...SUCHANFRAGE, legs: beine }).success, false)
    assert.equal(flugSuchanfrageLesen({ ...SUCHANFRAGE, legs: beine }), null)
  })

  test('ranking-only context is absent from the provider request', () => {
    const anfrage = gepruefteAnfrage({
      legs: [{ origin: 'ZRH', destination: 'BKK', date: '2026-11-01' }],
      stopPreference: 'nonstop',
      context: {
        tripStartDate: '2026-12-01',
        tripEndDate: '2026-12-15',
        selectedDate: '2026-12-02',
      },
    })
    const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)
    const shape = request as unknown as Record<string, unknown>

    assert.equal('context' in shape, false)
    assert.equal('tripStartDate' in shape, false)
    assert.equal('tripEndDate' in shape, false)
    assert.equal('selectedDate' in shape, false)
    assert.equal(request.legs[0]?.date, '2026-11-01')
    assert.equal(request.stopPreference, 'nonstop')
    assert.equal('max_connections' in shape, false)
    assert.deepEqual(requestKeys(request), [
      'adults',
      'cabin',
      'children',
      'currency',
      'infants',
      'legs',
      'locale',
      'market',
      'stopPreference',
    ])
  })

  test('stopPreference is preserved losslessly for any, nonstop and at_most_one', () => {
    assert.deepEqual([...FLUG_STOPP_PRAEFERENZEN], ['any', 'nonstop', 'at_most_one'])
    for (const stopPreference of FLUG_STOPP_PRAEFERENZEN) {
      const anfrage = gepruefteAnfrage({ stopPreference })
      const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)
      assert.equal(request.stopPreference, stopPreference)
      assert.equal(request.stopPreference, anfrage.stopPreference)
    }
  })

  test('passenger, cabin and currency values are preserved', () => {
    const anfrage = gepruefteAnfrage({
      passengers: { adults: 2, children: 1, infants: 1 },
      cabin: 'business',
      currency: 'EUR',
    })
    const request = flightProviderSearchRequestAus(anfrage, ANFRAGE_KONTEXT)

    assert.equal(request.adults, 2)
    assert.equal(request.children, 1)
    assert.equal(request.infants, 1)
    assert.equal(request.cabin, 'business')
    assert.equal(request.currency, 'EUR')
  })

  test('market and locale come from external request context, not trip ranking dates', () => {
    const anfrage = gepruefteAnfrage({
      context: {
        tripStartDate: '2026-11-01',
        tripEndDate: '2026-11-15',
        selectedDate: '2026-11-01',
      },
    })
    const request = flightProviderSearchRequestAus(anfrage, { market: 'GB', locale: 'en-GB' })

    assert.equal(request.market, 'GB')
    assert.equal(request.locale, 'en-GB')
    assert.equal(request.market === anfrage.context.tripStartDate, false)
  })
})
