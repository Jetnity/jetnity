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
 * Untrusted Intake-Grenze nach Blocker 31: der Client darf Surface behaupten,
 * Parser und Kanonisierung entfernen das Feld. Länder entstehen neu aus IATA.
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
    stages: [{ position: 1, name: 'Bangkok', country_code: null, arrival_date: null, departure_date: null }],
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

describe('R14 Blocker 29 / R16 Blocker 31 – untrusted Persistenz entfernt Surface-Evidence', () => {
  test('1. ZRH→CDG, ORY→BKK mit surfaceFromAirportCode=CDG ist als In-Memory-Fixture bewiesen', () => {
    const itinerary = itineraryAirportChange('ORY')
    assert.equal(surfaceAmZweiten(itinerary), 'CDG')
    const facts = routeFactsAusGraph(reiseMit(itinerary))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.connections[0]?.airportChange, true)
    assert.match(routeKompakt(facts), /Paris CDG ⇢ Paris ORY/)
  })

  test('2. Kanonisierung und Metadata-Runde entfernen Client-Surface-Evidence', () => {
    const original = itineraryAirportChange('ORY')
    const kanonisch = itineraryKanonisieren(original, TEST_FLUGHAFEN_REFS)
    const metadata = persistenzRunde(original)
    assert.equal(surfaceAmZweiten(kanonisch!), undefined)
    assert.equal(surfaceAmZweiten(metadata!), undefined)
    assert.equal(metadata?.legs[0]?.segments[1]?.origin.airportCode, 'ORY')
  })

  test('3. nach untrusted Persistenzgrenze wird CDG⇢ORY unknown', () => {
    const nachher = persistenzRunde(itineraryAirportChange('ORY'))
    assert.ok(nachher)
    const facts = routeFactsAusGraph(reiseMit(nachher))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.connections.length, 0)
    assert.equal(surfaceAmZweiten(nachher), undefined)
  })

  test('4. Fingerprint nach Persistenz entspricht der Evidence-losen Lücke', () => {
    const vorher = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    const nachher = routeFactsAusGraph(reiseMit(persistenzRunde(itineraryAirportChange('ORY'))!))
    const ohne = routeFactsAusGraph(reiseMit(persistenzRunde(itineraryAirportChangeOhneEvidence('ORY'))!))
    assert.notEqual(vorher.fingerprint, nachher.fingerprint)
    assert.equal(nachher.fingerprint, ohne.fingerprint)
    assert.match(vorher.fingerprint ?? '', /CDG:FR~ORY:FR/)
  })

  test('5. Persistenz erzeugt keinen Airport-Change aus Client-Surface', () => {
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
    assert.equal(nachher.connections.length, 0)
    assert.match(routeKompakt(vorher), /Paris CDG ⇢ Paris ORY/)
    assert.match(routeKompakt(nachher), /Reihenfolge unbekannt/)
    const htmlVorher = renderToStaticMarkup(createElement(FlugRoute, { facts: vorher }))
    const htmlNachher = renderToStaticMarkup(createElement(FlugRoute, { facts: nachher }))
    assert.match(htmlVorher, /Flughafenwechsel/)
    assert.equal(htmlNachher.includes('Flughafenwechsel'), false)
  })

  test('6. Readiness, Safety und Seasonal sehen nach Persistenz die gestrippte Truth', () => {
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
    assert.equal(readinessReisekontext(nachherReise).originCountryCode, null)
    assert.notEqual(vorher.fingerprint, nachher.fingerprint)
  })

  test('7. Guest→Account-Kanonisierung adelt Client-Surface nicht', () => {
    const nutzlast = gastNutzlast(mitClientLaendern(itineraryAirportChange('ORY')))
    const kanonisch = reiseNutzlastRouteKanonisieren(nutzlast, TEST_FLUGHAFEN_REFS)
    const itinerary = kanonisch.ungeplante[0]?.route_itinerary
    assert.equal(surfaceAmZweiten(itinerary!), undefined)
    const persistiert = persistenzRunde(itinerary!)
    assert.equal(surfaceAmZweiten(persistiert!), undefined)
    const gast = flug({ id: 'gast', routeItinerary: itinerary! })
    const konto = flug({ id: 'konto', routeItinerary: persistiert! })
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.equal(routeFactsFuerPunkt(konto).chronologieBewiesen, false)
    assert.notEqual(
      routeFactsAusItinerary(itineraryAirportChange('ORY')).fingerprint,
      routeFactsFuerPunkt(konto).fingerprint,
    )
    assert.deepEqual(iatasAusNutzlast(kanonisch).sort(), ['BKK', 'CDG', 'ORY', 'ZRH'])
  })

  test('8. ungültiges surfaceFromAirportCode wird verworfen, Route bleibt', () => {
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
    const gelesen = flugRouteItineraryLesen(ungueltig)
    assert.ok(gelesen)
    assert.equal(surfaceAmZweiten(gelesen), undefined)
    assert.equal(gelesen.legs[0]?.segments[1]?.origin.airportCode, 'ORY')
    const kanonisch = itineraryKanonisieren(ungueltig, TEST_FLUGHAFEN_REFS)
    assert.equal(surfaceAmZweiten(kanonisch!), undefined)
    const metadata = itineraryAusMetadata(metadataAusItinerary(ungueltig as FlugRouteItinerary))
    assert.equal(surfaceAmZweiten(metadata!), undefined)
  })

  test('9. Client-Surface macht keine Client-Länder zur Truth', () => {
    const persistiert = persistenzRunde(mitClientLaendern(itineraryAirportChange('ORY')))
    const origin = persistiert?.legs[0]?.segments[0]?.origin
    const ory = persistiert?.legs[0]?.segments[1]?.origin
    assert.equal(surfaceAmZweiten(persistiert!), undefined)
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
