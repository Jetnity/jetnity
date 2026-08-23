import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import FlugRoute from '@/components/trips/FlugRoute'
import { routeFactsAusReise, readinessReisekontext } from '@/lib/readiness/kontext'
import { routeFactsAusGraph, routeFactsAusItinerary, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { routeKompakt } from '@/lib/route/anzeige'
import {
  TEST_FLUGHAFEN_REFS,
  itineraryAirportChange,
  itineraryAirportChangeOhneEvidence,
  itineraryUsGapOhneSurface,
} from '@/lib/route/fixtures'
import { itineraryKanonisieren } from '@/lib/route/itinerary'
import { iatasAusNutzlast, reiseNutzlastRouteKanonisieren } from '@/lib/route/kanonisieren'
import { itineraryAusMetadata, metadataAusItinerary } from '@/lib/route/metadata'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { safetyReisekontext } from '@/lib/safety/kontext'
import { seasonalReisekontext } from '@/lib/seasonal/kontext'
import type { FlugRouteItinerary, RouteSegment } from '@/lib/route/domain'
import { reiseNutzlastSchema, type ReiseNutzlast } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

function flug(teil: Partial<TripItem> = {}): TripItem {
  return {
    id: 'flug-1',
    dayId: null,
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH → BKK',
    note: null,
    position: 1,
    startsOn: '2026-11-01',
    startsAt: '09:15',
    endsOn: '2026-11-01',
    endsAt: '21:40',
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

/**
 * Felder, die public.flug_route_itinerary_metadata nach Blocker 29 behält.
 * Länder entstehen danach neu aus IATA + Referenz, nie aus Clientwerten.
 */
function itineraryWieDbGrenze(itinerary: FlugRouteItinerary): FlugRouteItinerary | null {
  const roh = {
    v: 1 as const,
    type: 'flight_route_itinerary' as const,
    legs: itinerary.legs.map((bein) => ({
      segments: bein.segments.map((segment) => {
        const surface = segment.surfaceFromAirportCode
        return {
          origin: { airportCode: segment.origin.airportCode },
          destination: { airportCode: segment.destination.airportCode },
          departureDate: segment.departureDate,
          departureTime: segment.departureTime,
          arrivalDate: segment.arrivalDate,
          arrivalTime: segment.arrivalTime,
          ...(surface ? { surfaceFromAirportCode: surface } : {}),
        }
      }),
    })),
  }
  const gelesen = flugRouteItineraryLesen(roh)
  return gelesen ? itineraryKanonisieren(gelesen, TEST_FLUGHAFEN_REFS) : null
}

function persistenzRunde(itinerary: FlugRouteItinerary): FlugRouteItinerary | null {
  const metadata = metadataAusItinerary(itinerary)
  const gelesen = itineraryAusMetadata(metadata)
  if (!gelesen) return null
  return itineraryWieDbGrenze(gelesen)
}

function gastNutzlast(itinerary: FlugRouteItinerary): ReiseNutzlast {
  return reiseNutzlastSchema.parse({
    client_ref: 'trip-guest-surface-1',
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
    days: [],
    ungeplante: [
      {
        kind: 'flight',
        title: 'ZRH → BKK',
        note: null,
        position: 1,
        starts_on: '2026-11-01',
        starts_at: '07:10',
        ends_on: '2026-11-02',
        ends_at: '06:10',
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
  })
}

function mitClientLaendern(itinerary: FlugRouteItinerary): FlugRouteItinerary {
  return {
    ...itinerary,
    legs: itinerary.legs.map((bein) => ({
      segments: bein.segments.map((segment) => ({
        ...segment,
        origin: {
          ...segment.origin,
          countryCode: 'US',
          city: 'Clientstadt',
          country: 'Clientland',
        },
        destination: {
          ...segment.destination,
          countryCode: 'US',
          city: 'Clientstadt',
          country: 'Clientland',
        },
      })),
    })),
  }
}

function surfaceAmZweiten(itinerary: FlugRouteItinerary): string | undefined {
  return itinerary.legs[0]?.segments[1]?.surfaceFromAirportCode ?? undefined
}

describe('R14 Blocker 29 – Surface-Evidence überlebt Persistenz', () => {
  test('1. ZRH→CDG, ORY→BKK mit surfaceFromAirportCode=CDG ist vor Persistenz bewiesen', () => {
    const itinerary = itineraryAirportChange('ORY')
    assert.equal(surfaceAmZweiten(itinerary), 'CDG')
    const facts = routeFactsAusGraph(reiseMit(itinerary))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.connections[0]?.airportChange, true)
    assert.match(routeKompakt(facts), /Paris CDG ⇢ Paris ORY/)
  })

  test('2. Kanonisierung und Metadata-Runde behalten exakt diese Evidence', () => {
    const original = itineraryAirportChange('ORY')
    const kanonisch = itineraryKanonisieren(original, TEST_FLUGHAFEN_REFS)
    const metadata = persistenzRunde(original)
    assert.equal(surfaceAmZweiten(kanonisch!), 'CDG')
    assert.equal(surfaceAmZweiten(metadata!), 'CDG')
    assert.equal(metadata?.legs[0]?.segments[0]?.surfaceFromAirportCode, undefined)
  })

  test('3. nach Persistenzgrenze bleibt CDG⇢ORY bewiesen', () => {
    const nachher = persistenzRunde(itineraryAirportChange('ORY'))
    assert.ok(nachher)
    const facts = routeFactsAusGraph(reiseMit(nachher))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.connections[0]?.airportChange, true)
  })

  test('4. Fingerprint vor und nach Persistenz ist identisch', () => {
    const vorher = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    const nachher = routeFactsAusGraph(reiseMit(persistenzRunde(itineraryAirportChange('ORY'))!))
    assert.equal(vorher.fingerprint, nachher.fingerprint)
    assert.match(vorher.fingerprint ?? '', /CDG:FR~ORY:FR/)
  })

  test('5. Connection, Airport-Change und UI bleiben vor/nach Persistenz identisch', () => {
    const vorher = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    const nachher = routeFactsAusGraph(reiseMit(persistenzRunde(itineraryAirportChange('ORY'))!))
    assert.deepEqual(
      vorher.connections.map((eintrag) => [
        eintrag.fromSegmentIndex,
        eintrag.airportCode,
        eintrag.airportChange,
      ]),
      [[0, 'CDG', true]],
    )
    assert.deepEqual(vorher.connections, nachher.connections)
    assert.equal(routeKompakt(vorher), routeKompakt(nachher))
    const htmlVorher = renderToStaticMarkup(createElement(FlugRoute, { facts: vorher }))
    const htmlNachher = renderToStaticMarkup(createElement(FlugRoute, { facts: nachher }))
    assert.match(htmlVorher, /Flughafenwechsel/)
    assert.equal(htmlVorher, htmlNachher)
  })

  test('6. Readiness, Safety und Seasonal sehen vor/nach Persistenz dieselbe Route Truth', () => {
    const vorherReise = reiseMit(itineraryAirportChange('ORY'))
    const nachherReise = reiseMit(persistenzRunde(itineraryAirportChange('ORY'))!)
    const vorher = routeFactsAusGraph(vorherReise)
    const nachher = routeFactsAusGraph(nachherReise)
    assert.equal(routeFactsAusReise(vorherReise).fingerprint, vorher.fingerprint)
    assert.equal(routeFactsAusReise(nachherReise).fingerprint, nachher.fingerprint)
    assert.equal(safetyReisekontext(vorherReise).route.fingerprint, vorher.fingerprint)
    assert.equal(safetyReisekontext(nachherReise).route.fingerprint, nachher.fingerprint)
    assert.equal(seasonalReisekontext(vorherReise).route.fingerprint, vorher.fingerprint)
    assert.equal(seasonalReisekontext(nachherReise).route.fingerprint, nachher.fingerprint)
    assert.equal(readinessReisekontext(vorherReise).originCountryCode, 'CH')
    assert.equal(readinessReisekontext(nachherReise).originCountryCode, 'CH')
    assert.equal(vorher.fingerprint, nachher.fingerprint)
  })

  test('7. Guest→Account-Kanonisierung verliert die Evidence nicht', () => {
    const nutzlast = gastNutzlast(mitClientLaendern(itineraryAirportChange('ORY')))
    const kanonisch = reiseNutzlastRouteKanonisieren(nutzlast, TEST_FLUGHAFEN_REFS)
    const itinerary = kanonisch.ungeplante[0]?.route_itinerary
    assert.equal(surfaceAmZweiten(itinerary!), 'CDG')
    const persistiert = persistenzRunde(itinerary!)
    assert.equal(surfaceAmZweiten(persistiert!), 'CDG')
    const gast = flug({ id: 'gast', routeItinerary: itineraryAirportChange('ORY') })
    const konto = flug({ id: 'konto', routeItinerary: persistiert! })
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.equal(
      routeFactsAusItinerary(itineraryAirportChange('ORY')).fingerprint,
      routeFactsFuerPunkt(konto).fingerprint,
    )
    assert.deepEqual(iatasAusNutzlast(kanonisch).sort(), ['BKK', 'CDG', 'ORY', 'ZRH'])
  })

  test('8. ungültiges surfaceFromAirportCode wird fail-closed abgewiesen', () => {
    const basis = itineraryAirportChange('ORY')
    const zweites = basis.legs[0]?.segments[1]
    assert.ok(zweites)
    const ungueltig = {
      ...basis,
      legs: [
        {
          segments: [
            basis.legs[0]!.segments[0],
            { ...zweites, surfaceFromAirportCode: 'CDGX' } as RouteSegment,
          ],
        },
      ],
    }
    assert.equal(flugRouteItineraryLesen(ungueltig), null)
    assert.equal(itineraryKanonisieren(ungueltig, TEST_FLUGHAFEN_REFS), null)
    assert.equal(itineraryAusMetadata(metadataAusItinerary(ungueltig as FlugRouteItinerary)), null)
  })

  test('9. Surface-Evidence macht keine Client-Länder zur Truth', () => {
    const persistiert = persistenzRunde(mitClientLaendern(itineraryAirportChange('ORY')))
    const origin = persistiert?.legs[0]?.segments[0]?.origin
    const ory = persistiert?.legs[0]?.segments[1]?.origin
    assert.equal(surfaceAmZweiten(persistiert!), 'CDG')
    assert.equal(origin?.countryCode, 'CH')
    assert.equal(ory?.countryCode, 'FR')
    assert.notEqual(origin?.city, 'Clientstadt')
    assert.notEqual(origin?.country, 'Clientland')
    assert.notEqual(ory?.countryCode, 'US')
  })

  test('10. LAX→JFK + SFO→NRT bleibt nach Persistenz fail-closed', () => {
    const original = itineraryUsGapOhneSurface()
    assert.equal(original.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const persistiert = persistenzRunde(original)
    assert.equal(persistiert?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    const vorher = routeFactsAusGraph(reiseMit(original))
    const nachher = routeFactsAusGraph(reiseMit(persistiert!))
    assert.equal(vorher.chronologieBewiesen, false)
    assert.equal(nachher.chronologieBewiesen, false)
    assert.equal(vorher.origin.airportCode, null)
    assert.equal(nachher.origin.airportCode, null)
    assert.equal(vorher.connections.length, 0)
    assert.equal(nachher.fingerprint, vorher.fingerprint)
    const ohneEvidence = persistenzRunde(itineraryAirportChangeOhneEvidence('ORY'))
    assert.equal(ohneEvidence?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(routeFactsAusGraph(reiseMit(ohneEvidence!)).chronologieBewiesen, false)
  })
})
