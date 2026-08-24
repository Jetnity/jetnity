import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import FlugRoute from '@/components/trips/FlugRoute'
import { routeFactsAusReise, readinessReisekontext } from '@/lib/readiness/kontext'
import { routeFactsAusGraph, routeFactsAusItinerary, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { routeKompakt } from '@/lib/route/anzeige'
import {
  itineraryAirportChange,
  itineraryAirportChangeOhneEvidence,
  itineraryAirportChangeUmgekehrt,
  itineraryEinTransit,
  itineraryTransitUmgekehrt,
  itineraryUnverbundeneSegmente,
  itineraryUsGapOhneSurface,
  itineraryUsGapOhneSurfaceUmgekehrt,
} from '@/lib/route/fixtures'
import { pfadAusSegmenten } from '@/lib/route/pfad'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { safetyReisekontext } from '@/lib/safety/kontext'
import { seasonalReisekontext } from '@/lib/seasonal/kontext'
import type { FlugRouteItinerary } from '@/lib/route/domain'
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

describe('R13 Blocker 28 – same-country ist keine Surface-Evidence', () => {
  test('1. LAX→JFK plus SFO→NRT ohne Surface-Evidence bleibt fail-closed', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryUsGapOhneSurface()))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.destination.airportCode, null)
    assert.equal(facts.connections.length, 0)
    assert.deepEqual(facts.transitCountryCodes, [])
    assert.equal(routeKompakt(facts).includes('JFK ⇢'), false)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
  })

  test('2. dieselbe US-Lücke bleibt fingerprint-stabil über Array-Permutation', () => {
    const vorwaerts = routeFactsAusGraph(reiseMit(itineraryUsGapOhneSurface()))
    const umgekehrt = routeFactsAusGraph(reiseMit(itineraryUsGapOhneSurfaceUmgekehrt()))
    assert.equal(vorwaerts.fingerprint, umgekehrt.fingerprint)
    assert.equal(vorwaerts.chronologieBewiesen, false)
    assert.equal(umgekehrt.chronologieBewiesen, false)
    assert.match(vorwaerts.fingerprint ?? '', /&/)
  })

  test('3. CDG⇢ORY ohne explizite Evidence bleibt fail-closed', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryAirportChangeOhneEvidence('ORY')))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.connections.length, 0)
    assert.equal(facts.transitCountryCodes.includes('FR'), false)
  })

  test('4. echter CDG⇢ORY mit Surface-Evidence bleibt bewiesen', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.connections[0]?.airportChange, true)
    assert.match(routeKompakt(facts), /Paris CDG ⇢ Paris ORY/)
    assert.match(facts.fingerprint ?? '', /CDG:FR~ORY:FR/)
  })

  test('5. verdrehter CDG⇢ORY-Input wird nur mit derselben Evidence kanonisiert', () => {
    const mitEvidence = routeFactsAusGraph(reiseMit(itineraryAirportChangeUmgekehrt('ORY')))
    const ohneEvidence = routeFactsAusGraph(reiseMit({
      ...itineraryAirportChangeUmgekehrt('ORY'),
      legs: [
        {
          segments: (itineraryAirportChangeUmgekehrt('ORY').legs[0]?.segments ?? []).map((segment) => {
            const { surfaceFromAirportCode: _ignored, ...rest } = segment
            return rest
          }),
        },
      ],
    }))
    assert.equal(mitEvidence.chronologieBewiesen, true)
    assert.equal(mitEvidence.origin.airportCode, 'ZRH')
    assert.equal(mitEvidence.fingerprint, routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY'))).fingerprint)
    assert.equal(ohneEvidence.chronologieBewiesen, false)
    assert.equal(ohneEvidence.origin.airportCode, null)
    assert.notEqual(mitEvidence.fingerprint, ohneEvidence.fingerprint)
  })

  test('6. eindeutige Transitkette bleibt ZRH>DOH>BKK', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryTransitUmgekehrt()))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.fingerprint, routeFactsAusGraph(reiseMit(itineraryEinTransit('DOH'))).fingerprint)
    assert.equal(pfadAusSegmenten(facts.segments), 'ZRH:CH>DOH:QA>BKK:TH')
  })

  test('7. Zyklen, fehlende IATA und unverbundene Cross-Country-Sets bleiben fail-closed', () => {
    const zyklus: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            {
              origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              departureDate: '2026-11-01',
              departureTime: '09:00',
              arrivalDate: '2026-11-01',
              arrivalTime: '21:40',
            },
            {
              origin: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              destination: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              departureDate: '2026-11-01',
              departureTime: '18:00',
              arrivalDate: '2026-11-01',
              arrivalTime: '23:00',
            },
          ],
        },
      ],
    }
    const ohneIata: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            {
              origin: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              destination: { airportCode: null, countryCode: 'QA', city: 'Doha', country: 'Qatar' },
              departureDate: '2026-11-12',
              departureTime: '18:55',
              arrivalDate: '2026-11-13',
              arrivalTime: '07:10',
              surfaceFromAirportCode: 'ZRH',
            },
            {
              origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              destination: { airportCode: 'DOH', countryCode: 'QA', city: 'Doha', country: 'Qatar' },
              departureDate: '2026-11-01',
              departureTime: '09:15',
              arrivalDate: '2026-11-01',
              arrivalTime: '16:40',
            },
          ],
        },
      ],
    }
    for (const itinerary of [zyklus, ohneIata, itineraryUnverbundeneSegmente()]) {
      const facts = routeFactsAusGraph(reiseMit(itinerary))
      assert.equal(facts.chronologieBewiesen, false)
      assert.equal(facts.origin.airportCode, null)
      assert.equal(facts.connections.length, 0)
    }
  })

  test('8. Connections entstehen nur aus belegter Segmentreihenfolge', () => {
    const belegt = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    assert.deepEqual(
      belegt.connections.map((eintrag) => [eintrag.fromSegmentIndex, eintrag.airportCode, eintrag.airportChange]),
      [[0, 'CDG', true]],
    )
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts: belegt }))
    assert.match(html, /Flughafenwechsel/)
    const luecke = routeFactsAusGraph(reiseMit(itineraryUsGapOhneSurface()))
    assert.equal(luecke.connections.length, 0)
    assert.equal(renderToStaticMarkup(createElement(FlugRoute, { facts: luecke })).includes('Flughafenwechsel'), false)
  })

  test('9. Fingerprint unterscheidet belegte Surface-Route von unknown Segmentmenge', () => {
    const belegt = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    const unknown = routeFactsAusGraph(reiseMit(itineraryAirportChangeOhneEvidence('ORY')))
    assert.notEqual(belegt.fingerprint, unknown.fingerprint)
    assert.match(belegt.fingerprint ?? '', /~/)
    assert.match(unknown.fingerprint ?? '', /&/)
  })

  test('10. Seasonal, Safety, Readiness und Guest/Account teilen dieselbe Truth', () => {
    const reise = reiseMit(itineraryUsGapOhneSurface())
    const facts = routeFactsAusGraph(reise)
    const readiness = routeFactsAusReise(reise)
    const safety = safetyReisekontext(reise)
    const seasonal = seasonalReisekontext(reise)
    assert.equal(readiness.fingerprint, facts.fingerprint)
    assert.equal(safety.route.fingerprint, facts.fingerprint)
    assert.equal(seasonal.route.fingerprint, facts.fingerprint)
    assert.equal(readiness.originCountryCode, null)
    assert.equal(readinessReisekontext(reise).originCountryCode, null)
    const gast = flug({ id: 'gast', routeItinerary: itineraryUsGapOhneSurface() })
    const konto = flug({ id: 'konto', routeItinerary: itineraryUsGapOhneSurfaceUmgekehrt() })
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.equal(routeFactsAusItinerary(itineraryUsGapOhneSurface()).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
  })
})
