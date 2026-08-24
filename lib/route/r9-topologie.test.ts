import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import FlugRoute from '@/components/trips/FlugRoute'
import { routeFactsAusGraph, routeFactsAusItinerary, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { routeAnzeigeAusFacts, routeKompakt } from '@/lib/route/anzeige'
import { routeChronologieBewiesen } from '@/lib/route/chronologie'
import {
  itineraryAirportChange,
  itineraryAirportChangeZweitesLeg,
  itineraryBeideLegsTransit,
  itineraryDreiMehrzielGemischt,
  itineraryEinTransit,
  itineraryHinDirektRueckTransit,
  itineraryHinTransitRueckDirekt,
} from '@/lib/route/fixtures'
import { metadataAusItinerary, itineraryAusMetadata } from '@/lib/route/metadata'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import { verbindungNachSegment } from '@/lib/route/verbindung'
import { routeAenderungZwischen } from '@/lib/route/vergleich'
import { readinessReisekontext } from '@/lib/readiness/kontext'
import { safetyReisekontext } from '@/lib/safety/kontext'
import { seasonalReisekontext } from '@/lib/seasonal/kontext'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
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
    startsOn: '2026-09-12',
    startsAt: '09:15',
    endsOn: '2026-09-12',
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
  links: {
    id: string
    itinerary: FlugRouteItinerary
    startsOn?: string | null
    startsAt?: string | null
  },
  rechts: {
    id: string
    itinerary: FlugRouteItinerary
    startsOn?: string | null
    startsAt?: string | null
  },
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

function hinItem(startsOn: string | null, ab = '09:00'): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          {
            origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
            destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
            departureDate: startsOn,
            departureTime: ab,
            arrivalDate: startsOn,
            arrivalTime: '21:40',
          },
        ],
      },
    ],
  }
}

function rueckItem(startsOn: string | null, ab = '18:00'): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          {
            origin: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
            destination: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
            departureDate: startsOn,
            departureTime: ab,
            arrivalDate: startsOn,
            arrivalTime: '23:40',
          },
        ],
      },
    ],
  }
}

function umstiegTexte(html: string): string[] {
  const liste = html.match(/aria-label="Flugsegmente"[\s\S]*?<\/ol>/)?.[0] ?? ''
  return [...liste.matchAll(/<li[\s\S]*?<\/li>/g)].map((treffer) => treffer[0])
}

describe('R9 Blocker 16 – Airport-Change- und Segment-Origin', () => {
  test('Kompaktanzeige und Fingerprint enthalten CDG und ORY', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryAirportChange()))
    assert.match(routeKompakt(facts), /Paris CDG/)
    assert.match(routeKompakt(facts), /Paris ORY/)
    assert.match(routeKompakt(facts), /⇢/)
    assert.match(facts.fingerprint ?? '', /CDG:FR/)
    assert.match(facts.fingerprint ?? '', /ORY:FR/)
    assert.equal(facts.connections[0]?.airportChange, true)
    assert.deepEqual(facts.transitCountryCodes, ['FR'])
    assert.equal(facts.destinationCountryCodes.includes('FR'), false)
  })

  test('anderer zweiter Segment-Origin ändert Fingerprint und Route-Change', () => {
    const ory = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    const lcy = routeFactsAusGraph(reiseMit(itineraryAirportChange('LCY')))
    assert.notEqual(ory.fingerprint, lcy.fingerprint)
    assert.match(lcy.fingerprint ?? '', /LCY:GB/)
    const diff = routeAenderungZwischen(ory, lcy)
    assert.equal(diff.geaendert, true)
    assert.equal(diff.fingerprintGeaendert, true)
  })

  test('kontinuierliches Leg bleibt eine Kette ohne Trennstelle', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryEinTransit('DOH')))
    assert.match(routeKompakt(facts), /Zürich ZRH → Doha DOH → Bangkok BKK/)
    assert.equal(routeKompakt(facts).includes('⇢'), false)
    assert.equal(routeKompakt(facts).includes('|'), false)
    assert.equal(facts.fingerprint?.includes('DOH:QA>BKK:TH'), true)
  })

  test('Cross-Country-Gap behält das zweite Origin-Land in Seasonal/Readiness/Safety', () => {
    const reise = reiseMit(itineraryAirportChange('AMS'))
    const facts = routeFactsAusGraph(reise)
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.destinationCountryCodes.includes('NL'), true)
    assert.equal(facts.transitCountryCodes.includes('FR'), false)
    assert.equal(seasonalReisekontext(reise).countryCodes.includes('NL'), true)
    assert.equal(readinessReisekontext(reise).destinationCountries.includes('NL'), true)
    assert.equal(safetyReisekontext(reise).countryCodes.includes('NL'), true)
  })

  test('Guest- und Account-Parität plus Eingabereihenfolge', () => {
    const itinerary = itineraryAirportChange()
    const gast = flug({ routeItinerary: flugRouteItineraryLesen(itinerary) })
    const konto = flug({
      id: 'konto-flug',
      routeItinerary: itineraryAusMetadata(metadataAusItinerary(itinerary)) ?? itinerary,
    })
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.equal(routeFactsFuerPunkt(gast).chronologieBewiesen, false)
    assert.match(routeKompakt(routeFactsFuerPunkt(gast)), /ORY/)
    const basis = twoFlights(
      { id: 'a', itinerary, startsOn: '2026-11-01', startsAt: '07:10' },
      { id: 'b', itinerary: itineraryEinTransit('DOH'), startsOn: '2026-11-12', startsAt: '09:15' },
    )
    const umgestellt = { ...basis, ohneTag: [...basis.ohneTag].reverse() }
    assert.equal(routeFactsAusGraph(basis).fingerprint, routeFactsAusGraph(umgestellt).fingerprint)
  })
})

describe('R9 Blocker 17 – Connection-Leg-Zuordnung', () => {
  test('Hinflug direkt, Rückflug Transit hängt den Umstieg nur ans Rückflug-Segment', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryHinDirektRueckTransit()))
    assert.equal(facts.connections.length, 1)
    assert.equal(facts.connections[0]?.legIndex, 1)
    assert.equal(facts.connections[0]?.fromSegmentIndex, 1)
    assert.equal(verbindungNachSegment(facts.connections, 0), null)
    assert.equal(verbindungNachSegment(facts.connections, 1)?.airportCode, 'SIN')
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts }))
    const listen = umstiegTexte(html)
    assert.equal(listen[0]?.includes('Umstieg'), false)
    assert.equal(listen[1]?.includes('Umstieg'), true)
    assert.match(listen[1] ?? '', /Singapore|SIN/)
    assert.equal(routeAnzeigeAusFacts(facts)?.umstiege, 1)
  })

  test('Hinflug Transit, Rückflug direkt hängt den Umstieg nur ans Hinflug-Segment', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryHinTransitRueckDirekt()))
    assert.equal(facts.connections[0]?.fromSegmentIndex, 0)
    assert.equal(facts.connections[0]?.legIndex, 0)
    assert.equal(verbindungNachSegment(facts.connections, 2), null)
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts }))
    const listen = umstiegTexte(html)
    assert.equal(listen[0]?.includes('Umstieg'), true)
    assert.match(listen[0] ?? '', /Doha|DOH/)
    assert.equal(listen[2]?.includes('Umstieg'), false)
  })

  test('beide Legs mit Transit bleiben am richtigen Segment', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryBeideLegsTransit()))
    assert.deepEqual(
      facts.connections.map((eintrag) => [eintrag.legIndex, eintrag.fromSegmentIndex, eintrag.airportCode]),
      [
        [0, 0, 'DOH'],
        [1, 2, 'SIN'],
      ],
    )
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts }))
    const listen = umstiegTexte(html)
    assert.equal(listen[0]?.includes('Doha'), true)
    assert.equal(listen[2]?.includes('Singapore'), true)
    assert.equal(listen[1]?.includes('Umstieg'), false)
    assert.equal(routeAnzeigeAusFacts(facts)?.umstiege, 2)
  })

  test('Airport Change nur im zweiten Leg erscheint am richtigen Segment', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryAirportChangeZweitesLeg()))
    assert.equal(facts.connections[0]?.legIndex, 1)
    assert.equal(facts.connections[0]?.fromSegmentIndex, 1)
    assert.equal(facts.connections[0]?.airportChange, true)
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts }))
    const listen = umstiegTexte(html)
    assert.equal(listen[0]?.includes('Flughafenwechsel'), false)
    assert.equal(listen[1]?.includes('Flughafenwechsel'), true)
  })

  test('drei Multi-City-Legs mit gemischten Direct/Transit-Verbindungen', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryDreiMehrzielGemischt()))
    assert.equal(facts.connections.length, 1)
    assert.equal(facts.connections[0]?.legIndex, 1)
    assert.equal(facts.connections[0]?.fromSegmentIndex, 1)
    assert.equal(facts.connections[0]?.airportCode, 'DOH')
    assert.match(routeKompakt(facts), / \| /)
    assert.equal(routeAnzeigeAusFacts(facts)?.umstiege, 1)
  })

  test('FlugKarte-Ableitung teilt dieselbe Connection-Identität', () => {
    const facts = routeFactsAusItinerary(itineraryHinDirektRueckTransit(), 'opt-1')
    assert.equal(facts.connections[0]?.fromSegmentIndex, 1)
    assert.equal(verbindungNachSegment(facts.connections, 0), null)
  })

  test('FlugBestand-Ableitung teilt dieselbe Connection-Identität', () => {
    const punkt = flug({ routeItinerary: itineraryHinDirektRueckTransit() })
    const facts = routeFactsFuerPunkt(punkt)
    assert.equal(facts.connections[0]?.fromSegmentIndex, 1)
    assert.equal(verbindungNachSegment(facts.connections, 0), null)
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts }))
    const listen = umstiegTexte(html)
    assert.equal(listen[0]?.includes('Umstieg'), false)
    assert.equal(listen[1]?.includes('Umstieg'), true)
  })
})

describe('R9 Blocker 18 – Chronologie-Präzision', () => {
  test('gleicher Tag an verschiedenen Flughäfen erfindet keine Cross-Airport-Uhrzeit-Reihenfolge', () => {
    const reise = twoFlights(
      { id: 'hin', itinerary: hinItem('2026-09-12', '09:00'), startsOn: '2026-09-12', startsAt: null },
      { id: 'rueck', itinerary: rueckItem('2026-09-12', '18:00'), startsOn: '2026-09-12', startsAt: null },
    )
    const facts = routeFactsAusGraph(reise)
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
    const umgestellt = { ...reise, ohneTag: [...reise.ohneTag].reverse() }
    assert.equal(routeFactsAusGraph(umgestellt).fingerprint, facts.fingerprint)
  })

  test('ein Item date-only und eines mit Zeit degradieren nicht auf 00:00', () => {
    const reise = twoFlights(
      { id: 'spaet', itinerary: rueckItem('2026-09-12', '18:00'), startsOn: '2026-09-12', startsAt: null },
      { id: 'frueh', itinerary: hinItem('2026-09-12', '09:00'), startsOn: '2026-09-12', startsAt: '09:00' },
    )
    const facts = routeFactsAusGraph(reise)
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
  })

  test('identische Same-Day-Starts an verschiedenen Airports bleiben unknown', () => {
    const reise = twoFlights(
      { id: 'hin', itinerary: hinItem('2026-09-12', '09:00'), startsOn: '2026-09-12', startsAt: null },
      { id: 'rueck', itinerary: rueckItem('2026-09-12', '18:00'), startsOn: '2026-09-12', startsAt: null },
    )
    const evidenzen = reise.ohneTag.map((punkt) => ({
      startsOn: punkt.startsOn,
      startsAt: punkt.startsAt,
      itinerary: punkt.routeItinerary!,
    }))
    assert.equal(routeChronologieBewiesen(evidenzen), false)
    assert.equal(routeFactsAusGraph(reise).origin.airportCode, null)
  })

  test('echte gleiche Starts ohne weitere Evidenz bleiben unknown', () => {
    const reise = twoFlights(
      { id: 'a', itinerary: hinItem(null), startsOn: null, startsAt: null },
      { id: 'b', itinerary: rueckItem(null), startsOn: null, startsAt: null },
    )
    const facts = routeFactsAusGraph(reise)
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
    assert.equal(routeKompakt(facts).includes(' | '), false)
    const umgestellt = { ...reise, ohneTag: [...reise.ohneTag].reverse() }
    assert.equal(routeFactsAusGraph(umgestellt).fingerprint, facts.fingerprint)
  })

  test('widersprüchliche Item- und Segmentchronologie bleibt fail-closed', () => {
    const reise = twoFlights(
      { id: 'hin', itinerary: hinItem('2026-09-12', '09:00'), startsOn: '2026-09-12', startsAt: '18:00' },
      { id: 'rueck', itinerary: rueckItem('2026-09-12', '18:00'), startsOn: '2026-09-12', startsAt: '09:00' },
    )
    const facts = routeFactsAusGraph(reise)
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
  })
})
