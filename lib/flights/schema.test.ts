import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import { ersteFlugmeldung, flugOptionLesen, flugSuchanfrageLesen, flugSuchanfrageSchema } from '@/lib/flights/schema'

describe('Flugsuchanfrage', () => {
  test('eine gültige Anfrage kommt durch', () => {
    const gelesen = flugSuchanfrageLesen(SUCHANFRAGE)
    assert.equal(gelesen?.legs[0]?.origin, 'ZRH')
    assert.equal(gelesen?.currency, 'CHF')
  })

  test('IATA wird auf Grossbuchstaben normiert', () => {
    const gelesen = flugSuchanfrageLesen({
      ...SUCHANFRAGE,
      legs: [{ origin: 'zrh', destination: 'bkk', date: '2026-11-01' }],
    })
    assert.equal(gelesen?.legs[0]?.origin, 'ZRH')
    assert.equal(gelesen?.legs[0]?.destination, 'BKK')
  })

  test('mehr als sechs Beine werden abgelehnt', () => {
    const beine = Array.from({ length: 7 }, (_, nr) => ({
      origin: 'ZRH',
      destination: 'BKK',
      date: `2026-11-0${nr + 1}`,
    }))
    assert.equal(flugSuchanfrageSchema.safeParse({ ...SUCHANFRAGE, legs: beine }).success, false)
  })

  test('gleicher Flughafen in einem Bein wird abgelehnt', () => {
    const ergebnis = flugSuchanfrageSchema.safeParse({
      ...SUCHANFRAGE,
      legs: [{ origin: 'ZRH', destination: 'ZRH', date: '2026-11-01' }],
    })
    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) assert.match(ersteFlugmeldung(ergebnis.error), /derselbe Flughafen/)
  })

  test('mehr als neun Personen werden abgelehnt', () => {
    assert.equal(
      flugSuchanfrageSchema.safeParse({
        ...SUCHANFRAGE,
        passengers: { adults: 9, children: 1, infants: 0 },
      }).success,
      false,
    )
  })

  test('mehr Säuglinge als Erwachsene werden abgelehnt', () => {
    assert.equal(
      flugSuchanfrageSchema.safeParse({
        ...SUCHANFRAGE,
        passengers: { adults: 1, children: 0, infants: 2 },
      }).success,
      false,
    )
  })
})

describe('Flugoption', () => {
  test('Provider-Rohfelder gehören nicht zur Momentaufnahme', () => {
    const gelesen = flugOptionLesen({
      id: 'x',
      provider: 'duffel',
      externalRef: 'ref',
      airline: 'LX',
      airlineName: 'SWISS',
      legs: [
        {
          segments: [
            {
              origin: 'ZRH',
              destination: 'BKK',
              departureDate: '2026-11-01',
              departureTime: '09:15',
              arrivalDate: '2026-11-01',
              arrivalTime: '23:45',
              airline: 'LX',
              airlineName: 'SWISS',
              operatingAirline: null,
              operatingAirlineName: null,
              flightNumber: 'LX180',
              durationMinutes: 690,
            },
          ],
          durationMinutes: 690,
          stops: 0,
        },
      ],
      durationMinutes: 690,
      stops: 0,
      priceAmount: 892.5,
      priceCurrency: 'CHF',
      cabin: 'economy',
      baggage: null,
      refundable: null,
      fare: null,
      travelerPricings: [{ travelerId: '1' }],
      access_token: 'secret',
    })
    assert.ok(gelesen)
    assert.equal('travelerPricings' in (gelesen ?? {}), false)
    assert.equal('access_token' in (gelesen ?? {}), false)
  })
})
