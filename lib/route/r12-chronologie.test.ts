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
  itineraryAirportChangeUmgekehrt,
  itineraryEinTransit,
  itineraryGemischtSurfaceScrambled,
  itineraryTransitUmgekehrt,
  itineraryUnverbundeneSegmente,
  itineraryUnverbundeneSegmenteUmgekehrt,
} from '@/lib/route/fixtures'
import { pfadAusSegmenten } from '@/lib/route/pfad'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { safetyReisekontext } from '@/lib/safety/kontext'
import { seasonalReisekontext } from '@/lib/seasonal/kontext'
import type { FlugRouteItinerary, RouteSegment } from '@/lib/route/domain'
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

function frSegment(von: string, nach: string): RouteSegment {
  return {
    origin: { airportCode: von, countryCode: 'FR', city: von, country: 'France' },
    destination: { airportCode: nach, countryCode: 'FR', city: nach, country: 'France' },
    departureDate: '2026-11-01',
    departureTime: '08:00',
    arrivalDate: '2026-11-01',
    arrivalTime: '09:00',
  }
}

describe('R12 Blocker 27 – bekannte IATA beweisen keine Segmentreihenfolge', () => {
  test('1. unverbundene bekannte Segmente bleiben fail-closed ohne Origin/Destination', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryUnverbundeneSegmente()))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.destination.airportCode, null)
    assert.equal(facts.origin.countryCode, null)
    assert.equal(facts.destination.countryCode, null)
    assert.equal(facts.connections.length, 0)
    assert.deepEqual(facts.transitCountryCodes, [])
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
    assert.equal(routeKompakt(facts).includes('⇢'), false)
  })

  test('2. dieselbe unbewiesene Segmentmenge bleibt fingerprint-stabil über Array-Permutation', () => {
    const vorwaerts = routeFactsAusGraph(reiseMit(itineraryUnverbundeneSegmente()))
    const umgekehrt = routeFactsAusGraph(reiseMit(itineraryUnverbundeneSegmenteUmgekehrt()))
    assert.equal(vorwaerts.chronologieBewiesen, false)
    assert.equal(umgekehrt.chronologieBewiesen, false)
    assert.equal(vorwaerts.fingerprint, umgekehrt.fingerprint)
    assert.match(vorwaerts.fingerprint ?? '', /BKK:TH>SIN:SG/)
    assert.match(vorwaerts.fingerprint ?? '', /ZRH:CH>DOH:QA/)
    assert.match(vorwaerts.fingerprint ?? '', /&/)
    assert.deepEqual(vorwaerts.destinationCountryCodes.slice().sort(), umgekehrt.destinationCountryCodes.slice().sort())
    assert.deepEqual(vorwaerts.transitCountryCodes, [])
    assert.deepEqual(umgekehrt.transitCountryCodes, [])
  })

  test('3. verdrehter Surface-plus-Kette-Input wird eindeutig kanonisiert', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryGemischtSurfaceScrambled()))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'SIN')
    assert.equal(facts.origin.countryCode, 'CH')
    assert.deepEqual(facts.transitCountryCodes, ['FR', 'TH'])
    assert.deepEqual(facts.destinationCountryCodes, ['SG'])
    assert.equal(facts.connections[0]?.airportCode, 'CDG')
    assert.equal(facts.connections[0]?.airportChange, true)
    assert.equal(facts.connections[0]?.fromSegmentIndex, 0)
    assert.equal(facts.connections[1]?.airportCode, 'BKK')
    assert.equal(facts.connections[1]?.airportChange, false)
    assert.equal(facts.connections[1]?.fromSegmentIndex, 1)
    assert.equal(pfadAusSegmenten(facts.segments), 'ZRH:CH>CDG:FR~ORY:FR>BKK:TH>SIN:SG')
  })

  test('4. echter CDG ⇢ ORY-Surface-Change bleibt bewiesen, auch umgekehrt gespeichert', () => {
    const korrekt = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    const umgekehrt = routeFactsAusGraph(reiseMit(itineraryAirportChangeUmgekehrt('ORY')))
    assert.equal(korrekt.chronologieBewiesen, true)
    assert.equal(umgekehrt.chronologieBewiesen, true)
    assert.equal(korrekt.origin.airportCode, 'ZRH')
    assert.equal(umgekehrt.origin.airportCode, 'ZRH')
    assert.equal(korrekt.destination.airportCode, 'BKK')
    assert.equal(umgekehrt.destination.airportCode, 'BKK')
    assert.equal(korrekt.fingerprint, umgekehrt.fingerprint)
    assert.match(korrekt.fingerprint ?? '', /CDG:FR~ORY:FR/)
    assert.equal(korrekt.connections[0]?.airportChange, true)
    assert.equal(umgekehrt.connections[0]?.airportChange, true)
    assert.match(routeKompakt(korrekt), /Paris CDG ⇢ Paris ORY/)
    assert.match(routeKompakt(umgekehrt), /Paris CDG ⇢ Paris ORY/)
  })

  test('5. eindeutig rekonstruierbare Transitkette bleibt ZRH>DOH>BKK', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryTransitUmgekehrt()))
    const korrekt = routeFactsAusGraph(reiseMit(itineraryEinTransit('DOH')))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.fingerprint, korrekt.fingerprint)
    assert.equal(pfadAusSegmenten(facts.segments), 'ZRH:CH>DOH:QA>BKK:TH')
    assert.equal(facts.connections[0]?.airportCode, 'DOH')
    assert.equal(facts.connections[0]?.airportChange, false)
  })

  test('6. Zyklen, fehlende IATA und mehrdeutige Surface-Mengen bleiben fail-closed', () => {
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
    const mehrdeutig: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [{ segments: [frSegment('CDG', 'ORY'), frSegment('LYS', 'NCE')] }],
    }
    for (const itinerary of [zyklus, ohneIata, mehrdeutig]) {
      const facts = routeFactsAusGraph(reiseMit(itinerary))
      assert.equal(facts.chronologieBewiesen, false)
      assert.equal(facts.origin.airportCode, null)
      assert.equal(facts.destination.airportCode, null)
      assert.equal(facts.connections.length, 0)
    }
  })

  test('7. Connection-Indizes folgen nur der kanonischen Segmentreihenfolge', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryAirportChangeUmgekehrt('ORY')))
    assert.deepEqual(
      facts.connections.map((eintrag) => [eintrag.legIndex, eintrag.fromSegmentIndex, eintrag.toSegmentIndex, eintrag.airportCode, eintrag.airportChange]),
      [[0, 0, 1, 'CDG', true]],
    )
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts }))
    assert.match(html, /Flughafenwechsel/)
    const unverbunden = routeFactsAusGraph(reiseMit(itineraryUnverbundeneSegmente()))
    assert.equal(unverbunden.connections.length, 0)
    const unverbundenHtml = renderToStaticMarkup(createElement(FlugRoute, { facts: unverbunden }))
    assert.equal(unverbundenHtml.includes('Flughafenwechsel'), false)
    assert.equal(unverbundenHtml.includes('Umstieg'), false)
  })

  test('8. Seasonal, Safety und Readiness sehen dieselbe korrigierte Route Truth', () => {
    const reise = reiseMit(itineraryUnverbundeneSegmente())
    const facts = routeFactsAusGraph(reise)
    const readiness = routeFactsAusReise(reise)
    const safety = safetyReisekontext(reise)
    const seasonal = seasonalReisekontext(reise)
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(readiness.fingerprint, facts.fingerprint)
    assert.equal(safety.route.fingerprint, facts.fingerprint)
    assert.equal(seasonal.route.fingerprint, facts.fingerprint)
    assert.equal(readiness.originCountryCode, null)
    assert.equal(readiness.destinationCountryCode, null)
    assert.deepEqual(readiness.transitCountryCodes, [])
    assert.deepEqual(safety.route.transitCountryCodes, [])
    assert.deepEqual(seasonal.route.transitCountryCodes, [])
    assert.equal(safety.route.origin.airportCode, null)
    assert.equal(seasonal.route.origin.airportCode, null)
    for (const code of ['CH', 'TH', 'SG', 'QA']) {
      assert.equal(facts.destinationCountryCodes.includes(code), true)
      assert.equal(seasonal.countryCodes.includes(code), true)
      assert.equal(safety.countryCodes.includes(code), true)
    }
  })

  test('9. Guest und Account teilen dieselbe unbewiesene Segment-Truth', () => {
    const gast = flug({ id: 'gast', routeItinerary: itineraryUnverbundeneSegmente() })
    const konto = flug({ id: 'konto', routeItinerary: itineraryUnverbundeneSegmenteUmgekehrt() })
    assert.equal(routeFactsFuerPunkt(gast).chronologieBewiesen, false)
    assert.equal(routeFactsFuerPunkt(konto).chronologieBewiesen, false)
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.equal(routeFactsAusItinerary(itineraryUnverbundeneSegmente()).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.deepEqual(routeFactsFuerPunkt(gast).origin, routeFactsFuerPunkt(konto).origin)
    assert.deepEqual(routeFactsFuerPunkt(gast).destination, routeFactsFuerPunkt(konto).destination)
  })

  test('10. Cross-Country-Gap ohne unique Surface-Kante bleibt fail-closed', () => {
    const lcy = routeFactsAusGraph(reiseMit(itineraryAirportChange('LCY')))
    const lcyUmgekehrt = routeFactsAusGraph(reiseMit(itineraryAirportChangeUmgekehrt('LCY')))
    const ams = routeFactsAusGraph(reiseMit(itineraryAirportChange('AMS')))
    assert.equal(lcy.chronologieBewiesen, false)
    assert.equal(ams.chronologieBewiesen, false)
    assert.equal(lcy.origin.airportCode, null)
    assert.equal(ams.origin.airportCode, null)
    assert.equal(lcy.connections.length, 0)
    assert.equal(ams.connections.length, 0)
    assert.equal(lcy.fingerprint, lcyUmgekehrt.fingerprint)
    assert.equal(lcy.transitCountryCodes.includes('FR'), false)
    assert.equal(ams.transitCountryCodes.includes('FR'), false)
    assert.equal(lcy.destinationCountryCodes.includes('GB'), true)
    assert.equal(ams.destinationCountryCodes.includes('NL'), true)
    assert.equal(readinessReisekontext(reiseMit(itineraryAirportChange('AMS'))).destinationCountries.includes('NL'), true)
  })
})
