// lib/route/kanonisieren.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { routeFingerprintAus } from '@/lib/route/fingerprint'
import {
  TEST_FLUGHAFEN_REFS,
  itineraryAirportChange,
  itineraryDirekt,
  itineraryEinTransit,
  itineraryZweiTransits,
} from '@/lib/route/fixtures'
import { itineraryKanonisieren } from '@/lib/route/itinerary'
import { iatasAusNutzlast, reiseNutzlastRouteKanonisieren } from '@/lib/route/kanonisieren'
import type { FlugRouteItinerary, RoutePunkt } from '@/lib/route/domain'
import { reiseNutzlastSchema, type ReiseNutzlast } from '@/lib/trips/schema'

function fingerprint(itinerary: FlugRouteItinerary) {
  return routeFingerprintAus([
    { sourceItemId: null, startsOn: null, startsAt: null, itinerary },
  ])
}

function mitClientFacts(itinerary: FlugRouteItinerary, land = 'US'): FlugRouteItinerary {
  const luege: RoutePunkt = {
    airportCode: null,
    countryCode: land,
    city: 'Clientstadt',
    country: 'Clientland',
  }
  return {
    ...itinerary,
    legs: itinerary.legs.map((bein) => ({
      segments: bein.segments.map((segment) => ({
        ...segment,
        origin: { ...luege, airportCode: segment.origin.airportCode },
        destination: { ...luege, airportCode: segment.destination.airportCode },
      })),
    })),
  }
}

function flugNutzlast(itinerary: FlugRouteItinerary | null): ReiseNutzlast {
  return reiseNutzlastSchema.parse({
    client_ref: 'trip-guest-1',
    title: 'Thailand',
    origin: 'Zürich',
    origin_place_id: 'airport:ZRH',
    start_date: '2026-11-01',
    end_date: '2026-11-10',
    travellers: 2,
    currency: 'CHF',
    budget_amount: null,
    pace: 'balanced',
    interests: [],
    travel_wish: null,
    stages: [],
    days: [
      {
        day_index: 1,
        day_date: '2026-11-01',
        title: 'Anreise',
        stage_position: null,
        items: [
          {
            kind: 'flight',
            title: 'ZRH → BKK · SWISS',
            note: null,
            position: 1,
            starts_on: '2026-11-01',
            starts_at: '09:15',
            ends_on: '2026-11-01',
            ends_at: '21:40',
            price_amount: 890,
            price_currency: 'CHF',
            provider: 'duffel',
            external_ref: 'off_1',
            booking_url: null,
            booking_status: 'unconfirmed',
            booking_confirmed_at: null,
            route_itinerary: itinerary,
          },
        ],
      },
    ],
    ungeplante: [],
  })
}

describe('itineraryKanonisieren', () => {
  test('1. manipuliertes ZRH-Land wird zu CH', () => {
    const kanonisch = itineraryKanonisieren(mitClientFacts(itineraryDirekt(), 'US'), TEST_FLUGHAFEN_REFS)
    assert.equal(kanonisch?.legs[0]?.segments[0]?.origin.airportCode, 'ZRH')
    assert.equal(kanonisch?.legs[0]?.segments[0]?.origin.countryCode, 'CH')
  })

  test('2. manipuliertes DOH-Transitland wird zu QA', () => {
    const kanonisch = itineraryKanonisieren(mitClientFacts(itineraryEinTransit(), 'DE'), TEST_FLUGHAFEN_REFS)
    assert.equal(kanonisch?.legs[0]?.segments[0]?.destination.airportCode, 'DOH')
    assert.equal(kanonisch?.legs[0]?.segments[0]?.destination.countryCode, 'QA')
    assert.equal(kanonisch?.legs[0]?.segments[1]?.origin.countryCode, 'QA')
  })

  test('3. Client-Stadt und -Landname werden durch die Referenz ersetzt', () => {
    const kanonisch = itineraryKanonisieren(mitClientFacts(itineraryDirekt()), TEST_FLUGHAFEN_REFS)
    const origin = kanonisch?.legs[0]?.segments[0]?.origin
    assert.equal(origin?.city, 'Zürich')
    assert.equal(origin?.country, 'Switzerland')
    assert.notEqual(origin?.city, 'Clientstadt')
    assert.notEqual(origin?.country, 'Clientland')
  })

  test('4. unbekannter IATA übernimmt kein Client-Land', () => {
    const unbekannt: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            {
              origin: {
                airportCode: 'ZZZ',
                countryCode: 'US',
                city: 'Clientstadt',
                country: 'Clientland',
              },
              destination: {
                airportCode: 'BKK',
                countryCode: 'XX',
                city: 'Clientstadt',
                country: 'Clientland',
              },
              departureDate: '2026-11-01',
              departureTime: '09:15',
              arrivalDate: '2026-11-01',
              arrivalTime: '21:40',
            },
          ],
        },
      ],
    }
    const kanonisch = itineraryKanonisieren(unbekannt, TEST_FLUGHAFEN_REFS)
    const origin = kanonisch?.legs[0]?.segments[0]?.origin
    const destination = kanonisch?.legs[0]?.segments[0]?.destination
    assert.equal(origin?.airportCode, 'ZZZ')
    assert.equal(origin?.countryCode, null)
    assert.equal(origin?.city, null)
    assert.equal(origin?.country, null)
    assert.equal(destination?.countryCode, 'TH')
  })

  test('5. leere Referenz (Lookup-Fehler) fällt nicht auf Clientwerte zurück', () => {
    const kanonisch = itineraryKanonisieren(mitClientFacts(itineraryEinTransit(), 'US'), {})
    for (const segment of kanonisch?.legs[0]?.segments ?? []) {
      assert.equal(segment.origin.countryCode, null)
      assert.equal(segment.origin.city, null)
      assert.equal(segment.origin.country, null)
      assert.equal(segment.destination.countryCode, null)
      assert.ok(segment.origin.airportCode)
      assert.ok(segment.destination.airportCode)
    }
  })

  test('6. Direktflug, ein Transit und Multi-Transit bleiben vollständig', () => {
    assert.equal(itineraryKanonisieren(itineraryDirekt(), TEST_FLUGHAFEN_REFS)?.legs[0]?.segments.length, 1)
    assert.equal(itineraryKanonisieren(itineraryEinTransit(), TEST_FLUGHAFEN_REFS)?.legs[0]?.segments.length, 2)
    assert.equal(itineraryKanonisieren(itineraryZweiTransits(), TEST_FLUGHAFEN_REFS)?.legs[0]?.segments.length, 3)
  })

  test('Zeiten bleiben erhalten', () => {
    const original = itineraryEinTransit()
    const kanonisch = itineraryKanonisieren(mitClientFacts(original), TEST_FLUGHAFEN_REFS)
    assert.deepEqual(
      kanonisch?.legs[0]?.segments.map((segment) => ({
        departureDate: segment.departureDate,
        departureTime: segment.departureTime,
        arrivalDate: segment.arrivalDate,
        arrivalTime: segment.arrivalTime,
      })),
      original.legs[0]?.segments.map((segment) => ({
        departureDate: segment.departureDate,
        departureTime: segment.departureTime,
        arrivalDate: segment.arrivalDate,
        arrivalTime: segment.arrivalTime,
      })),
    )
  })
})

describe('reiseNutzlastRouteKanonisieren', () => {
  test('7. Guest-Nutzlast wird vor Persistenz kanonisiert', () => {
    const nutzlast = flugNutzlast(mitClientFacts(itineraryEinTransit(), 'US'))
    const kanonisch = reiseNutzlastRouteKanonisieren(nutzlast, TEST_FLUGHAFEN_REFS)
    const itinerary = kanonisch.days[0]?.items[0]?.route_itinerary
    assert.equal(itinerary?.legs[0]?.segments[0]?.origin.countryCode, 'CH')
    assert.equal(itinerary?.legs[0]?.segments[0]?.destination.countryCode, 'QA')
    assert.equal(itinerary?.legs[0]?.segments[1]?.destination.countryCode, 'TH')
    assert.equal(nutzlast.days[0]?.items[0]?.route_itinerary?.legs[0]?.segments[0]?.origin.countryCode, 'US')
  })

  test('8. Fingerprint folgt der kanonischen Route und bleibt bei gleicher Route stabil', () => {
    const ehrlich = itineraryEinTransit()
    const einmal = itineraryKanonisieren(mitClientFacts(ehrlich, 'US'), TEST_FLUGHAFEN_REFS)
    const erneut = itineraryKanonisieren(mitClientFacts(ehrlich, 'FR'), TEST_FLUGHAFEN_REFS)
    assert.equal(fingerprint(einmal!), fingerprint(ehrlich))
    assert.equal(fingerprint(erneut!), fingerprint(ehrlich))
  })

  test('zweimal kanonisieren bleibt idempotent', () => {
    const nutzlast = flugNutzlast(mitClientFacts(itineraryZweiTransits(), 'US'))
    const einmal = reiseNutzlastRouteKanonisieren(nutzlast, TEST_FLUGHAFEN_REFS)
    const erneut = reiseNutzlastRouteKanonisieren(einmal, TEST_FLUGHAFEN_REFS)
    assert.deepEqual(einmal.ungeplante, erneut.ungeplante)
    assert.deepEqual(einmal.days[0]?.items[0]?.route_itinerary, erneut.days[0]?.items[0]?.route_itinerary)
    assert.equal(einmal.client_ref, nutzlast.client_ref)
  })

  test('Surface-Evidence wird bei Guest-Kanonisierung entfernt', () => {
    const nutzlast = flugNutzlast(mitClientFacts(itineraryAirportChange('ORY'), 'US'))
    const kanonisch = reiseNutzlastRouteKanonisieren(nutzlast, TEST_FLUGHAFEN_REFS)
    const itinerary = kanonisch.days[0]?.items[0]?.route_itinerary
    assert.equal(itinerary?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(itinerary?.legs[0]?.segments[1]?.origin.airportCode, 'ORY')
    assert.equal(itinerary?.legs[0]?.segments[0]?.origin.countryCode, 'CH')
    assert.equal(itinerary?.legs[0]?.segments[1]?.origin.countryCode, 'FR')
    assert.notEqual(itinerary?.legs[0]?.segments[0]?.origin.countryCode, 'US')
  })

  test('sammelt IATA-Codes nur aus der Itinerary', () => {
    const codes = iatasAusNutzlast(flugNutzlast(mitClientFacts(itineraryEinTransit())))
    assert.deepEqual([...codes].sort(), ['BKK', 'DOH', 'ZRH'])
  })
})
