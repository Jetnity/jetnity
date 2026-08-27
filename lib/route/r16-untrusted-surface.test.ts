import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { alsFlugMomentaufnahme } from '@/lib/flights/uebernahme'
import type { FlugOption, FlugSegment } from '@/lib/flights/domain'
import { flugOptionLesen } from '@/lib/flights/schema'
import { routeFactsAusReise, readinessReisekontext } from '@/lib/readiness/kontext'
import { routeFactsAusGraph, routeFactsAusItinerary, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { routeKompakt } from '@/lib/route/anzeige'
import {
  TEST_FLUGHAFEN_REFS,
  itineraryAirportChange,
  itineraryAirportChangeOhneEvidence,
  itineraryEinTransit,
  itineraryUsGapOhneSurface,
} from '@/lib/route/fixtures'
import { itineraryAusFlugOption, itineraryKanonisieren } from '@/lib/route/itinerary'
import { reiseNutzlastRouteKanonisieren } from '@/lib/route/kanonisieren'
import { itineraryAusMetadata, metadataAusItinerary } from '@/lib/route/metadata'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { safetyReisekontext } from '@/lib/safety/kontext'
import { seasonalReisekontext } from '@/lib/seasonal/kontext'
import type { FlugRouteItinerary } from '@/lib/route/domain'
import { reiseLesen, reiseNutzlastSchema } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

function flug(teil: Partial<TripItem> = {}): TripItem {
  return {
    id: 'flug-1',
    dayId: null,
    stageId: 'stage-1',
    kind: 'flight',
    title: 'Route',
    note: null,
    position: 1,
    startsOn: '2026-11-01',
    startsAt: '08:00',
    endsOn: '2026-11-03',
    endsAt: '15:40',
    priceAmount: 890,
    priceCurrency: 'CHF',
    provider: 'duffel',
    externalRef: 'off_1',
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    routeItinerary: null,
    ...teil,
  }
}

function reiseMit(itinerary: FlugRouteItinerary, extra: Partial<TripItem> = {}): Trip {
  return beispielreise({ ohneTag: [flug({ routeItinerary: itinerary, ...extra })] })
}

function persistenzRunde(itinerary: FlugRouteItinerary): FlugRouteItinerary | null {
  const gelesen = itineraryAusMetadata(metadataAusItinerary(itinerary))
  return gelesen ? itineraryKanonisieren(gelesen, TEST_FLUGHAFEN_REFS) : null
}

function browserUsGapMitSurface(): unknown {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          {
            origin: { airportCode: 'LAX', countryCode: 'US' },
            destination: { airportCode: 'JFK', countryCode: 'US' },
            departureDate: '2026-11-01',
            departureTime: '08:00',
            arrivalDate: '2026-11-01',
            arrivalTime: '16:20',
          },
          {
            origin: { airportCode: 'SFO', countryCode: 'US' },
            destination: { airportCode: 'NRT', countryCode: 'JP' },
            departureDate: '2026-11-02',
            departureTime: '11:00',
            arrivalDate: '2026-11-03',
            arrivalTime: '15:40',
            surfaceFromAirportCode: 'JFK',
          },
        ],
      },
    ],
  }
}

function gastNutzlast(itinerary: unknown) {
  return reiseNutzlastSchema.parse({
    client_ref: 'trip-guest-r16',
    title: 'USA',
    origin: 'Los Angeles',
    origin_place_id: 'airport:LAX',
    start_date: '2026-11-01',
    end_date: '2026-11-10',
    travellers: 1,
    currency: 'CHF',
    budget_amount: null,
    pace: 'balanced',
    interests: [],
    travel_wish: null,
    stages: [{ position: 1, name: 'Los Angeles', country_code: null, arrival_date: null, departure_date: null }],
    days: [],
    ungeplante: [
      {
        kind: 'flight',
        title: 'LAX JFK SFO NRT',
        note: null,
        position: 1,
        starts_on: '2026-11-01',
        starts_at: '08:00',
        ends_on: '2026-11-03',
        ends_at: '15:40',
        price_amount: 890,
        price_currency: 'CHF',
        provider: 'duffel',
        external_ref: 'off_claimed',
        booking_url: null,
        booking_status: 'unconfirmed',
        booking_confirmed_at: null,
        route_itinerary: itinerary,
      },
    ],
  })
}

function segment(
  von: string,
  nach: string,
  abDatum: string,
  abZeit: string,
  anDatum: string,
  anZeit: string,
): FlugSegment {
  return {
    origin: von,
    destination: nach,
    departureDate: abDatum,
    departureTime: abZeit,
    arrivalDate: anDatum,
    arrivalTime: anZeit,
    airline: 'LX',
    airlineName: 'SWISS',
    operatingAirline: 'LX',
    operatingAirlineName: 'SWISS',
    flightNumber: 'LX1',
    durationMinutes: 300,
  }
}

function optionMit(segmente: FlugSegment[], extra: Partial<FlugOption> = {}): FlugOption {
  return {
    id: 'opt-1',
    provider: 'duffel',
    externalRef: 'browser-ref-1',
    airline: 'LX',
    airlineName: 'SWISS',
    legs: [
      {
        segments: segmente,
        durationMinutes: 900,
        stops: Math.max(0, segmente.length - 1),
      },
    ],
    durationMinutes: 900,
    stops: Math.max(0, segmente.length - 1),
    priceAmount: 890,
    priceCurrency: 'CHF',
    cabin: 'economy',
    baggage: null,
    refundable: null,
    fare: null,
    ...extra,
  }
}

describe('R16 Blocker 31 – untrusted routeItinerary adelt keine Surface-Evidence', () => {
  test('1. Browser-routeItinerary LAX→JFK + SFO→NRT mit surface=JFK bleibt unknown', () => {
    const gelesen = flugRouteItineraryLesen(browserUsGapMitSurface())
    assert.ok(gelesen)
    assert.equal(gelesen.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const kanonisch = itineraryKanonisieren(gelesen, TEST_FLUGHAFEN_REFS)
    assert.equal(kanonisch?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const facts = routeFactsAusGraph(reiseMit(kanonisch!))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.connections.length, 0)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
    assert.equal(routeKompakt(facts).includes('JFK ⇢'), false)
    assert.equal(facts.fingerprint, routeFactsAusGraph(reiseMit(itineraryUsGapOhneSurface())).fingerprint)
  })

  test('2. Guest→Account adelt dieselbe Clientbehauptung nicht', () => {
    const gastLaden = reiseLesen(reiseMit(browserUsGapMitSurface() as FlugRouteItinerary))
    assert.equal(
      gastLaden?.ohneTag[0]?.routeItinerary?.legs[0]?.segments[1]?.surfaceFromAirportCode,
      undefined,
    )
    const nutzlast = gastNutzlast(browserUsGapMitSurface())
    assert.equal(nutzlast.ungeplante[0]?.route_itinerary?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const konto = reiseNutzlastRouteKanonisieren(nutzlast, TEST_FLUGHAFEN_REFS).ungeplante[0]?.route_itinerary
    assert.equal(konto?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const gast = flug({ id: 'gast', routeItinerary: konto! })
    const account = flug({ id: 'konto', routeItinerary: persistenzRunde(konto!)! })
    assert.equal(routeFactsFuerPunkt(gast).chronologieBewiesen, false)
    assert.equal(routeFactsFuerPunkt(account).chronologieBewiesen, false)
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(account).fingerprint)
  })

  test('3. Save→Reload adelt untrusted Surface-Evidence nicht', () => {
    const gelesen = flugRouteItineraryLesen(browserUsGapMitSurface())!
    const persistiert = persistenzRunde(gelesen)
    assert.equal(persistiert?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(routeFactsAusGraph(reiseMit(persistiert!)).chronologieBewiesen, false)
    const cdg = persistenzRunde(itineraryAirportChange('ORY'))
    assert.equal(cdg?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(routeFactsAusGraph(reiseMit(cdg!)).chronologieBewiesen, false)
  })

  test('4. Metadata-/Schreibvertrag persistiert keine Client-Surface-Behauptung', () => {
    const metadata = metadataAusItinerary(flugRouteItineraryLesen(browserUsGapMitSurface())!)
    const gelesen = itineraryAusMetadata(metadata)
    assert.equal(gelesen?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const roh = JSON.stringify(metadata)
    assert.equal(roh.includes('surfaceFromAirportCode'), false)
  })

  test('5. R15 FlugOption-Extra-Felder, provider und externalRef erzeugen keine Evidence', () => {
    const usGap = [
      segment('LAX', 'JFK', '2026-11-01', '08:00', '2026-11-01', '16:20'),
      segment('SFO', 'NRT', '2026-11-02', '11:00', '2026-11-03', '15:40'),
    ]
    const manipuliert = {
      ...optionMit(usGap, { provider: 'duffel', externalRef: 'off_provider_token' }),
      legs: [
        {
          segments: usGap.map((eintrag) => ({
            ...eintrag,
            surfaceFromAirportCode: 'JFK',
          })),
          durationMinutes: 900,
          stops: 1,
        },
      ],
    }
    const gelesen = flugOptionLesen(manipuliert)
    const itinerary = itineraryAusFlugOption(manipuliert, TEST_FLUGHAFEN_REFS)
    assert.ok(gelesen)
    assert.equal('surfaceFromAirportCode' in (gelesen.legs[0]?.segments[1] ?? {}), false)
    assert.equal(itinerary?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(alsFlugMomentaufnahme(manipuliert, TEST_FLUGHAFEN_REFS)?.routeItinerary?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(routeFactsAusGraph(reiseMit(itinerary!)).chronologieBewiesen, false)
  })

  test('6. kontinuierlicher ZRH→DOH→BKK bleibt bewiesen', () => {
    const itinerary = itineraryAusFlugOption(
      optionMit([
        segment('ZRH', 'DOH', '2026-11-01', '09:15', '2026-11-01', '16:40'),
        segment('DOH', 'BKK', '2026-11-01', '18:55', '2026-11-02', '07:10'),
      ]),
      TEST_FLUGHAFEN_REFS,
    )!
    assert.equal(itinerary.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const facts = routeFactsAusGraph(reiseMit(itinerary))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.fingerprint, routeFactsAusGraph(reiseMit(itineraryEinTransit('DOH'))).fingerprint)
    assert.equal(routeFactsAusGraph(reiseMit(persistenzRunde(itinerary)!)).fingerprint, facts.fingerprint)
  })

  test('7. CDG⇢ORY ist nur als In-Memory-Fixture bewiesen, nicht nach untrusted Intake', () => {
    const fixture = itineraryAirportChange('ORY')
    assert.equal(fixture.legs[0]?.segments[1]?.surfaceFromAirportCode, 'CDG')
    assert.equal(routeFactsAusGraph(reiseMit(fixture)).chronologieBewiesen, true)
    const gelesen = flugRouteItineraryLesen(fixture)
    assert.equal(gelesen?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(routeFactsAusGraph(reiseMit(gelesen!)).chronologieBewiesen, false)
    assert.equal(
      routeFactsAusGraph(reiseMit(gelesen!)).fingerprint,
      routeFactsAusGraph(reiseMit(itineraryAirportChangeOhneEvidence('ORY'))).fingerprint,
    )
  })

  test('8. Fingerprint, Readiness, Safety und Seasonal bleiben nach Strip konsistent', () => {
    const kanonisch = itineraryKanonisieren(flugRouteItineraryLesen(browserUsGapMitSurface())!, TEST_FLUGHAFEN_REFS)!
    const persistiert = persistenzRunde(kanonisch)!
    const gastReise = reiseMit(kanonisch)
    const kontoReise = reiseMit(persistiert)
    const gast = routeFactsAusGraph(gastReise)
    const konto = routeFactsAusGraph(kontoReise)
    assert.equal(gast.fingerprint, konto.fingerprint)
    assert.equal(routeFactsAusReise(gastReise).fingerprint, gast.fingerprint)
    assert.equal(routeFactsAusReise(kontoReise).fingerprint, konto.fingerprint)
    assert.equal(safetyReisekontext(gastReise).route.fingerprint, gast.fingerprint)
    assert.equal(safetyReisekontext(kontoReise).route.fingerprint, konto.fingerprint)
    assert.equal(seasonalReisekontext(gastReise).route.fingerprint, gast.fingerprint)
    assert.equal(seasonalReisekontext(kontoReise).route.fingerprint, konto.fingerprint)
    assert.equal(readinessReisekontext(gastReise).originCountryCode, null)
    assert.equal(readinessReisekontext(kontoReise).originCountryCode, null)
    assert.equal(routeFactsAusItinerary(kanonisch).chronologieBewiesen, false)
  })
})
