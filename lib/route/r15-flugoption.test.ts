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
} from '@/lib/route/fixtures'
import { itineraryAusFlugOption, itineraryKanonisieren } from '@/lib/route/itinerary'
import { reiseNutzlastRouteKanonisieren } from '@/lib/route/kanonisieren'
import { itineraryAusMetadata, metadataAusItinerary } from '@/lib/route/metadata'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { safetyReisekontext } from '@/lib/safety/kontext'
import { seasonalReisekontext } from '@/lib/seasonal/kontext'
import type { FlugRouteItinerary } from '@/lib/route/domain'
import { reiseNutzlastSchema } from '@/lib/trips/schema'
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
    endsOn: '2026-11-02',
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

const US_GAP = [
  segment('LAX', 'JFK', '2026-11-01', '08:00', '2026-11-01', '16:20'),
  segment('SFO', 'NRT', '2026-11-02', '11:00', '2026-11-03', '15:40'),
]

const US_GAP_UMGEKEHRT = [...US_GAP].reverse()

const CDG_ORY_LUECKE = [
  segment('ZRH', 'CDG', '2026-11-01', '07:10', '2026-11-01', '08:30'),
  segment('ORY', 'BKK', '2026-11-01', '12:40', '2026-11-02', '06:10'),
]

const TRANSIT = [
  segment('ZRH', 'DOH', '2026-11-01', '09:15', '2026-11-01', '16:40'),
  segment('DOH', 'BKK', '2026-11-01', '18:55', '2026-11-02', '07:10'),
]

function persistenzRunde(itinerary: FlugRouteItinerary): FlugRouteItinerary | null {
  const gelesen = itineraryAusMetadata(metadataAusItinerary(itinerary))
  return gelesen ? itineraryKanonisieren(gelesen, TEST_FLUGHAFEN_REFS) : null
}

describe('R15 Blocker 30 – FlugOption erfindet keine Surface-Evidence', () => {
  test('1. untrusted LAX→JFK + SFO→NRT erzeugt keine Surface-Evidence', () => {
    const option = optionMit(US_GAP)
    const itinerary = itineraryAusFlugOption(option, TEST_FLUGHAFEN_REFS)
    const aufnahme = alsFlugMomentaufnahme(option, TEST_FLUGHAFEN_REFS)
    assert.ok(itinerary)
    assert.equal(itinerary.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(aufnahme?.routeItinerary?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const facts = routeFactsAusGraph(reiseMit(itinerary))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.connections.length, 0)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
    assert.equal(routeKompakt(facts).includes('JFK ⇢'), false)
  })

  test('2. umgekehrte Array-Reihenfolge ändert die semantische Truth nicht', () => {
    const vorwaerts = itineraryAusFlugOption(optionMit(US_GAP), TEST_FLUGHAFEN_REFS)!
    const umgekehrt = itineraryAusFlugOption(optionMit(US_GAP_UMGEKEHRT), TEST_FLUGHAFEN_REFS)!
    const a = routeFactsAusGraph(reiseMit(vorwaerts))
    const b = routeFactsAusGraph(reiseMit(umgekehrt))
    assert.equal(a.fingerprint, b.fingerprint)
    assert.equal(a.chronologieBewiesen, false)
    assert.equal(b.chronologieBewiesen, false)
    assert.equal(vorwaerts.legs[0]?.segments[0]?.surfaceFromAirportCode, undefined)
    assert.equal(umgekehrt.legs[0]?.segments[0]?.surfaceFromAirportCode, undefined)
  })

  test('3. CDG⇢ORY aus FlugOption bleibt unknown; explizite Itinerary-Evidence bleibt bewiesen', () => {
    const ausOption = itineraryAusFlugOption(optionMit(CDG_ORY_LUECKE), TEST_FLUGHAFEN_REFS)!
    assert.equal(ausOption.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const unknown = routeFactsAusGraph(reiseMit(ausOption))
    assert.equal(unknown.chronologieBewiesen, false)
    assert.equal(unknown.origin.airportCode, null)
    const belegt = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    assert.equal(belegt.chronologieBewiesen, true)
    assert.equal(belegt.origin.airportCode, 'ZRH')
    assert.equal(belegt.connections[0]?.airportChange, true)
    assert.notEqual(unknown.fingerprint, belegt.fingerprint)
  })

  test('4. Browser-provider/externalRef oder Extra-Felder erzeugen keine Provider-Evidence', () => {
    const manipuliert = {
      ...optionMit(US_GAP, { provider: 'duffel', externalRef: 'off_provider_token' }),
      legs: [
        {
          segments: US_GAP.map((eintrag) => ({
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
    assert.equal(routeFactsAusGraph(reiseMit(itinerary!)).chronologieBewiesen, false)
  })

  test('5. Save→Reload bewahrt belegte Evidence und erfindet keine neue', () => {
    const belegt = persistenzRunde(itineraryAirportChange('ORY'))
    assert.equal(belegt?.legs[0]?.segments[1]?.surfaceFromAirportCode, 'CDG')
    assert.equal(routeFactsAusGraph(reiseMit(belegt!)).chronologieBewiesen, true)
    const erfunden = persistenzRunde(itineraryAusFlugOption(optionMit(US_GAP), TEST_FLUGHAFEN_REFS)!)
    assert.equal(erfunden?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(routeFactsAusGraph(reiseMit(erfunden!)).chronologieBewiesen, false)
    const luecke = persistenzRunde(itineraryAirportChangeOhneEvidence('ORY'))
    assert.equal(luecke?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
  })

  test('6. Guest→Account teilt dieselbe Truth', () => {
    const optionItinerary = itineraryAusFlugOption(optionMit(US_GAP), TEST_FLUGHAFEN_REFS)!
    const nutzlast = reiseNutzlastSchema.parse({
      client_ref: 'trip-guest-r15',
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
      stages: [],
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
          external_ref: 'off_1',
          booking_url: null,
          booking_status: 'unconfirmed',
          booking_confirmed_at: null,
          route_itinerary: optionItinerary,
        },
      ],
    })
    const konto = reiseNutzlastRouteKanonisieren(nutzlast, TEST_FLUGHAFEN_REFS).ungeplante[0]?.route_itinerary
    assert.equal(konto?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const gast = flug({ id: 'gast', routeItinerary: optionItinerary })
    const account = flug({ id: 'konto', routeItinerary: persistenzRunde(konto!)! })
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(account).fingerprint)
    const belegtGast = flug({ id: 'gast-e', routeItinerary: itineraryAirportChange('ORY') })
    const belegtKonto = flug({
      id: 'konto-e',
      routeItinerary: persistenzRunde(itineraryAirportChange('ORY'))!,
    })
    assert.equal(routeFactsFuerPunkt(belegtGast).fingerprint, routeFactsFuerPunkt(belegtKonto).fingerprint)
  })

  test('8. Readiness, Safety und Seasonal sehen dieselbe korrigierte Truth', () => {
    const itinerary = itineraryAusFlugOption(optionMit(US_GAP), TEST_FLUGHAFEN_REFS)!
    const reise = reiseMit(itinerary)
    const facts = routeFactsAusGraph(reise)
    assert.equal(routeFactsAusReise(reise).fingerprint, facts.fingerprint)
    assert.equal(safetyReisekontext(reise).route.fingerprint, facts.fingerprint)
    assert.equal(seasonalReisekontext(reise).route.fingerprint, facts.fingerprint)
    assert.equal(readinessReisekontext(reise).originCountryCode, null)
    assert.equal(routeFactsAusItinerary(itinerary).chronologieBewiesen, false)
  })

  test('9. eindeutiger kontinuierlicher Transit ZRH→DOH→BKK bleibt bewiesen', () => {
    const itinerary = itineraryAusFlugOption(optionMit(TRANSIT), TEST_FLUGHAFEN_REFS)!
    assert.equal(itinerary.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const facts = routeFactsAusGraph(reiseMit(itinerary))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.fingerprint, routeFactsAusGraph(reiseMit(itineraryEinTransit('DOH'))).fingerprint)
  })
})
