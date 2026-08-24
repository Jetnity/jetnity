import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import FlugRoute from '@/components/trips/FlugRoute'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import { readinessReisekontext, routeFactsAusReise } from '@/lib/readiness/kontext'
import { routeFactsAusGraph, routeFactsAusItinerary, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { routeAnzeigeAusFacts, routeKompakt } from '@/lib/route/anzeige'
import {
  itineraryAirportChange,
  itineraryDreiMehrzielGemischt,
  itineraryEinTransit,
  itineraryHinTransitRueckDirekt,
  itineraryKontinuierlichCdgOry,
  itineraryReverseRoundtrip,
} from '@/lib/route/fixtures'
import { metadataAusItinerary, itineraryAusMetadata } from '@/lib/route/metadata'
import { routeAenderungZwischen } from '@/lib/route/vergleich'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import {
  bangkokGetrennteFluegeReise,
  bangkokGetrennteLegsReise,
  bangkokMehrzielLegsReise,
  bangkokOpenJawLegsReise,
} from '@/lib/seasonal/fixtures'
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

function twoFlights(
  links: { id: string; itinerary: FlugRouteItinerary; startsOn?: string | null; startsAt?: string | null },
  rechts: { id: string; itinerary: FlugRouteItinerary; startsOn?: string | null; startsAt?: string | null },
): Trip {
  return beispielreise({
    ohneTag: [
      flug({
        id: links.id,
        startsOn: links.startsOn ?? null,
        startsAt: links.startsAt ?? null,
        routeItinerary: links.itinerary,
      }),
      flug({
        id: rechts.id,
        startsOn: rechts.startsOn ?? null,
        startsAt: rechts.startsAt ?? null,
        routeItinerary: rechts.itinerary,
      }),
    ],
  })
}

function hinItem(): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          {
            origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
            destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
            departureDate: '2026-11-01',
            departureTime: '09:15',
            arrivalDate: '2026-11-01',
            arrivalTime: '21:40',
          },
        ],
      },
    ],
  }
}

function rueckItem(): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          {
            origin: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
            destination: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
            departureDate: '2026-11-12',
            departureTime: '23:00',
            arrivalDate: '2026-11-13',
            arrivalTime: '06:00',
          },
        ],
      },
    ],
  }
}

function readinessFp(reise: Trip): string {
  const kontext = readinessReisekontext(reise)
  const route = routeFactsAusReise(reise)
  return readinessFingerprint({
    kind: 'entry_check',
    countryCode: 'TH',
    startDate: kontext.startDate,
    endDate: kontext.endDate,
    travellers: kontext.travellers,
    destinationCountries: kontext.destinationCountries,
    rentalCarPresent: false,
    tripItemId: null,
    itemKind: null,
    bookingStatus: null,
    startsOn: null,
    endsOn: null,
    originPlaceId: null,
    destinationPlaceId: null,
    title: null,
    originCountryCode: kontext.originCountryCode,
    transitCountryCodes: kontext.transitCountryCodes,
    routeFingerprint: route.fingerprint,
  })
}

function segmentOhneIata(teil: Partial<RouteSegment> & Pick<RouteSegment, 'origin' | 'destination'>): RouteSegment {
  return {
    departureDate: '2026-11-01',
    departureTime: '09:15',
    arrivalDate: '2026-11-01',
    arrivalTime: '10:40',
    ...teil,
  }
}

describe('R10 Blocker 20 – Intra-Itinerary-Leg-Chronologie', () => {
  test('umgekehrt datierte Legs erzeugen keinen TH-Origin', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryReverseRoundtrip()))
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.origin.countryCode, 'CH')
    assert.deepEqual(facts.destinationCountryCodes, ['TH'])
    assert.equal(facts.destinationCountryCodes.includes('CH'), false)
    assert.equal(facts.chronologieBewiesen, true)
    assert.match(routeKompakt(facts), /Zürich ZRH → Bangkok BKK \| Bangkok BKK → Zürich ZRH/)
    assert.equal(routeKompakt(facts).includes('Reihenfolge unbekannt'), false)
  })

  test('dieselbe Reise als zwei datierte Flight-Items hat dieselbe Country-Truth', () => {
    const multi = routeFactsAusGraph(reiseMit(itineraryReverseRoundtrip()))
    const items = routeFactsAusGraph(
      twoFlights(
        { id: 'spaet', itinerary: rueckItem(), startsOn: '2026-11-12', startsAt: '23:00' },
        { id: 'frueh', itinerary: hinItem(), startsOn: '2026-11-01', startsAt: '09:15' },
      ),
    )
    assert.equal(multi.origin.countryCode, items.origin.countryCode)
    assert.deepEqual(multi.destinationCountryCodes, items.destinationCountryCodes)
    assert.deepEqual(multi.transitCountryCodes, items.transitCountryCodes)
    assert.equal(multi.fingerprint, items.fingerprint)
    assert.equal(items.origin.countryCode, 'CH')
    assert.deepEqual(items.destinationCountryCodes, ['TH'])
  })

  test('normaler Roundtrip, Open Jaw und 3-Leg-Multi-City bleiben korrekt', () => {
    const rund = routeFactsAusGraph(bangkokGetrennteLegsReise())
    assert.equal(rund.origin.countryCode, 'CH')
    assert.deepEqual(rund.destinationCountryCodes, ['TH'])
    assert.deepEqual(rollenAus(bangkokGetrennteFluegeReise()), {
      origin: 'CH',
      destinations: ['TH'],
    })
    const openJaw = routeFactsAusGraph(bangkokOpenJawLegsReise())
    assert.equal(openJaw.origin.countryCode, 'CH')
    assert.deepEqual(openJaw.destinationCountryCodes, ['TH', 'SG'])
    const mehrziel = routeFactsAusGraph(bangkokMehrzielLegsReise())
    assert.deepEqual(mehrziel.destinationCountryCodes, ['TH', 'SG'])
    const drei = routeFactsAusGraph(reiseMit(itineraryDreiMehrzielGemischt()))
    assert.equal(drei.origin.countryCode, 'CH')
    assert.equal(drei.chronologieBewiesen, true)
    const hinRueck = routeFactsAusGraph(reiseMit(itineraryHinTransitRueckDirekt()))
    assert.equal(hinRueck.origin.countryCode, 'CH')
    assert.deepEqual(hinRueck.destinationCountryCodes, ['TH'])
  })

  test('gleiche Leg-Starts erfinden keine Reihenfolge aus Airport-Text', () => {
    const gleich: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            {
              origin: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              destination: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              departureDate: '2026-11-01',
              departureTime: '09:15',
              arrivalDate: '2026-11-01',
              arrivalTime: '21:40',
            },
          ],
        },
        {
          segments: [
            {
              origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              departureDate: '2026-11-01',
              departureTime: '09:15',
              arrivalDate: '2026-11-01',
              arrivalTime: '21:40',
            },
          ],
        },
      ],
    }
    const facts = routeFactsAusGraph(reiseMit(gleich))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.origin.countryCode, null)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
    assert.equal(routeKompakt(facts).includes(' | '), false)
  })

  test('Guest- und Account-Parität für umgekehrt gespeicherte Legs', () => {
    const itinerary = itineraryReverseRoundtrip()
    const gast = flug({ routeItinerary: itinerary })
    const konto = flug({
      id: 'konto-flug',
      routeItinerary: itineraryAusMetadata(metadataAusItinerary(itinerary)) ?? itinerary,
    })
    assert.equal(routeFactsFuerPunkt(gast).origin.countryCode, 'CH')
    assert.equal(routeFactsFuerPunkt(konto).origin.countryCode, 'CH')
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.deepEqual(routeFactsFuerPunkt(gast).destinationCountryCodes, ['TH'])
  })
})

describe('R10 Blocker 21 – Surface-Grenze in der Route-ID', () => {
  test('Surface-Change und kontinuierliche Kette haben unterschiedliche Fingerprints', () => {
    const surface = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    const kontinuierlich = routeFactsAusGraph(reiseMit(itineraryKontinuierlichCdgOry()))
    assert.notEqual(surface.fingerprint, kontinuierlich.fingerprint)
    assert.match(surface.fingerprint ?? '', /CDG:FR~ORY:FR/)
    assert.match(kontinuierlich.fingerprint ?? '', /CDG:FR>ORY:FR/)
    assert.equal((surface.fingerprint ?? '').includes('CDG:FR>ORY:FR'), false)
    assert.match(routeKompakt(surface), /⇢/)
    assert.equal(routeKompakt(kontinuierlich).includes('⇢'), false)
    assert.match(routeKompakt(kontinuierlich), /Paris CDG → Paris ORY/)
    const diff = routeAenderungZwischen(surface, kontinuierlich)
    assert.equal(diff.geaendert, true)
    assert.equal(diff.fingerprintGeaendert, true)
    assert.notEqual(readinessFp(reiseMit(itineraryAirportChange('ORY'))), readinessFp(reiseMit(itineraryKontinuierlichCdgOry())))
  })

  test('gleicher Airport bleibt kontinuierlich, fehlende IATA bleibt unknown', () => {
    const transit = routeFactsAusGraph(reiseMit(itineraryEinTransit('DOH')))
    assert.match(transit.fingerprint ?? '', /^route-v2\|ZRH:CH>DOH:QA>BKK:TH$/)
    assert.equal(routeKompakt(transit).includes('⇢'), false)

    const unbekannt: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            segmentOhneIata({
              origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              destination: { airportCode: null, countryCode: 'FR', city: 'Paris', country: 'France' },
              arrivalTime: '08:30',
            }),
            segmentOhneIata({
              origin: { airportCode: null, countryCode: 'FR', city: 'Paris', country: 'France' },
              destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              departureTime: '12:40',
              arrivalDate: '2026-11-02',
              arrivalTime: '06:10',
            }),
          ],
        },
      ],
    }
    const facts = routeFactsAusGraph(reiseMit(unbekannt))
    assert.equal(facts.chronologieBewiesen, false)
    assert.match(facts.fingerprint ?? '', /&/)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
    assert.equal(facts.connections.length, 0)
  })

  test('Open-Jaw- und Leg-Grenzen bleiben unterscheidbar', () => {
    const openJaw = routeFactsAusGraph(bangkokOpenJawLegsReise())
    const rund = routeFactsAusGraph(bangkokGetrennteLegsReise())
    assert.notEqual(openJaw.fingerprint, rund.fingerprint)
    assert.match(routeKompakt(openJaw), / \| /)
    assert.match(routeKompakt(rund), / \| /)
  })
})

describe('R10 Blocker 22 – Connection Airport-Change und Duration', () => {
  test('gleicher IATA behält Layover-Dauer, verschiedener IATA nicht', () => {
    const gleich = routeFactsAusGraph(reiseMit(itineraryEinTransit('DOH')))
    assert.equal(gleich.connections[0]?.airportChange, false)
    assert.equal(gleich.connections[0]?.durationMinutes, 135)
    assert.match(routeAnzeigeAusFacts(gleich)?.sekundaer ?? '', /2 h 15 min/)

    const ory = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    assert.equal(ory.connections[0]?.airportChange, true)
    assert.equal(ory.connections[0]?.durationMinutes, null)

    const lcy = routeFactsAusGraph(reiseMit(itineraryAirportChange('LCY')))
    assert.equal(lcy.chronologieBewiesen, false)
    assert.equal(lcy.connections.length, 0)
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts: lcy }))
    assert.equal(html.includes('4 h 10 min'), false)
    assert.equal(html.includes('Flughafenwechsel'), false)
  })

  test('ein oder kein bekannter IATA bleibt airportChange=null', () => {
    const nurAnkunft: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            segmentOhneIata({
              origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              destination: { airportCode: 'CDG', countryCode: 'FR', city: 'Paris', country: 'France' },
              arrivalTime: '08:30',
            }),
            segmentOhneIata({
              origin: { airportCode: null, countryCode: 'FR', city: 'Paris', country: 'France' },
              destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              departureTime: '12:40',
              arrivalDate: '2026-11-02',
              arrivalTime: '06:10',
            }),
          ],
        },
      ],
    }
    const nurAbflug: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            segmentOhneIata({
              origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              destination: { airportCode: null, countryCode: 'FR', city: 'Paris', country: 'France' },
              arrivalTime: '08:30',
            }),
            segmentOhneIata({
              origin: { airportCode: 'ORY', countryCode: 'FR', city: 'Paris', country: 'France' },
              destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              departureTime: '12:40',
              arrivalDate: '2026-11-02',
              arrivalTime: '06:10',
            }),
          ],
        },
      ],
    }
    const beide: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            segmentOhneIata({
              origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              destination: { airportCode: null, countryCode: 'FR', city: 'Paris', country: 'France' },
              arrivalTime: '08:30',
            }),
            segmentOhneIata({
              origin: { airportCode: null, countryCode: 'FR', city: 'Paris', country: 'France' },
              destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              departureTime: '12:40',
              arrivalDate: '2026-11-02',
              arrivalTime: '06:10',
            }),
          ],
        },
      ],
    }
    assert.equal(routeFactsAusItinerary(nurAnkunft).chronologieBewiesen, false)
    assert.equal(routeFactsAusItinerary(nurAbflug).chronologieBewiesen, false)
    assert.equal(routeFactsAusItinerary(beide).chronologieBewiesen, false)
    assert.equal(routeFactsAusItinerary(nurAnkunft).connections.length, 0)
    assert.equal(routeFactsAusItinerary(nurAbflug).connections.length, 0)
    assert.equal(routeFactsAusItinerary(beide).connections.length, 0)
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts: routeFactsAusItinerary(nurAbflug) }))
    assert.equal(html.includes('Flughafenwechsel'), false)
  })

  test('R9 Multi-Leg-Segmentzuordnung bleibt korrekt', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryHinTransitRueckDirekt()))
    assert.equal(facts.connections[0]?.legIndex, 0)
    assert.equal(facts.connections[0]?.fromSegmentIndex, 0)
    assert.equal(facts.connections[0]?.airportChange, false)
    assert.ok((facts.connections[0]?.durationMinutes ?? 0) > 0)
  })
})

function rollenAus(reise: Trip) {
  const facts = routeFactsAusGraph(reise)
  return { origin: facts.origin.countryCode, destinations: facts.destinationCountryCodes }
}
