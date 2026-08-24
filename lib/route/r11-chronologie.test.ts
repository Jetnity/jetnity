import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import FlugRoute from '@/components/trips/FlugRoute'
import { routeFactsAusReise, readinessReisekontext } from '@/lib/readiness/kontext'
import { routeFactsAusGraph, routeFactsAusItinerary, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { routeKompakt } from '@/lib/route/anzeige'
import { itinerariesFuerWahrheit, routeChronologieBewiesen } from '@/lib/route/chronologie'
import {
  itineraryAirportChange,
  itineraryDateLineNrtHnlLax,
  itineraryEinTransit,
  itineraryHinTransitRueckDirekt,
  itineraryKontinuierlichCdgOry,
  itineraryReverseRoundtrip,
  itineraryTransitUmgekehrt,
} from '@/lib/route/fixtures'
import { pfadAusSegmenten } from '@/lib/route/pfad'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { safetyReisekontext } from '@/lib/safety/kontext'
import { bangkokOpenJawFluegeReise } from '@/lib/seasonal/fixtures'
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

function dreiFlights(
  erstes: { id: string; itinerary: FlugRouteItinerary; startsOn: string; startsAt?: string | null },
  zweites: { id: string; itinerary: FlugRouteItinerary; startsOn: string; startsAt?: string | null },
  drittes: { id: string; itinerary: FlugRouteItinerary; startsOn: string; startsAt?: string | null },
): Trip {
  return beispielreise({
    ohneTag: [
      flug({
        id: erstes.id,
        startsOn: erstes.startsOn,
        startsAt: erstes.startsAt ?? null,
        routeItinerary: erstes.itinerary,
      }),
      flug({
        id: zweites.id,
        startsOn: zweites.startsOn,
        startsAt: zweites.startsAt ?? null,
        routeItinerary: zweites.itinerary,
      }),
      flug({
        id: drittes.id,
        startsOn: drittes.startsOn,
        startsAt: drittes.startsAt ?? null,
        routeItinerary: drittes.itinerary,
      }),
    ],
  })
}

function bein(
  von: string,
  nach: string,
  date: string,
  time: string,
  vonLand: string,
  nachLand: string,
): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          {
            origin: { airportCode: von, countryCode: vonLand, city: von, country: vonLand },
            destination: { airportCode: nach, countryCode: nachLand, city: nach, country: nachLand },
            departureDate: date,
            departureTime: time,
            arrivalDate: date,
            arrivalTime: null,
          },
        ],
      },
    ],
  }
}

function nrtLeg(): FlugRouteItinerary {
  return bein('NRT', 'HNL', '2026-01-02', '20:00', 'JP', 'US')
}

function hnlLeg(): FlugRouteItinerary {
  return bein('HNL', 'LAX', '2026-01-02', '10:00', 'US', 'US')
}

describe('R11 Blocker 24 – lokale Uhren sind keine absolute Chronologie', () => {
  test('Date-Line NRT 20:00 / HNL 10:00 am selben Kalendertag bleibt NRT-Ursprung', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryDateLineNrtHnlLax()))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'NRT')
    assert.equal(facts.destination.airportCode, 'LAX')
    assert.equal(facts.origin.countryCode, 'JP')
    assert.equal(facts.destination.countryCode, 'US')
    assert.match(routeKompakt(facts), /Tokio NRT → Honolulu HNL \| Honolulu HNL → Los Angeles LAX/)
    assert.equal(routeKompakt(facts).includes('Reihenfolge unbekannt'), false)
  })

  test('dieselbe Date-Line-Route als getrennte Items erfindet keine HNL-Origin', () => {
    const deklariert = twoFlights(
      { id: 'nrt', itinerary: nrtLeg(), startsOn: '2026-01-02', startsAt: '20:00' },
      { id: 'hnl', itinerary: hnlLeg(), startsOn: '2026-01-02', startsAt: '10:00' },
    )
    const facts = routeFactsAusGraph(deklariert)
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.destination.airportCode, null)
    const umgekehrt = { ...deklariert, ohneTag: [...deklariert.ohneTag].reverse() }
    const umgekehrtFacts = routeFactsAusGraph(umgekehrt)
    assert.equal(umgekehrtFacts.chronologieBewiesen, false)
    assert.equal(umgekehrtFacts.origin.airportCode, null)
    assert.equal(umgekehrtFacts.fingerprint, facts.fingerprint)
  })

  test('zwei Starts am selben bekannten Airport bleiben lokal vergleichbar', () => {
    const frueh = bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH')
    const spaet = bein('ZRH', 'FRA', '2026-11-01', '18:00', 'CH', 'DE')
    const facts = routeFactsAusGraph(
      twoFlights(
        { id: 'spaet', itinerary: spaet, startsOn: '2026-11-01', startsAt: '18:00' },
        { id: 'frueh', itinerary: frueh, startsOn: '2026-11-01', startsAt: '09:00' },
      ),
    )
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'FRA')
  })

  test('Reverse-Roundtrip mit Tagen Abstand bleibt CH-Origin und ZRH-Ziel', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryReverseRoundtrip()))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'ZRH')
    assert.equal(facts.origin.countryCode, 'CH')
    assert.deepEqual(facts.destinationCountryCodes, ['TH'])
  })

  test('Roundtrip am selben Tag bleibt fail-closed statt lokaler Uhr', () => {
    const hin = bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH')
    const rueck = bein('BKK', 'ZRH', '2026-11-01', '18:00', 'TH', 'CH')
    const facts = routeFactsAusGraph(
      twoFlights(
        { id: 'hin', itinerary: hin, startsOn: '2026-11-01', startsAt: '09:00' },
        { id: 'rueck', itinerary: rueck, startsOn: '2026-11-01', startsAt: '18:00' },
      ),
    )
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.destination.airportCode, null)
    assert.match(routeKompakt(facts), /Reihenfolge unbekannt/)
  })

  test('Nachbarntag-Roundtrip bleibt fail-closed', () => {
    const hin = bein('ZRH', 'BKK', '2026-11-01', '22:00', 'CH', 'TH')
    const rueck = bein('BKK', 'ZRH', '2026-11-02', '04:00', 'TH', 'CH')
    const reise = twoFlights(
      { id: 'hin', itinerary: hin, startsOn: '2026-11-01', startsAt: '22:00' },
      { id: 'rueck', itinerary: rueck, startsOn: '2026-11-02', startsAt: '04:00' },
    )
    assert.equal(routeChronologieBewiesen(
      reise.ohneTag.map((punkt) => ({
        startsOn: punkt.startsOn,
        startsAt: punkt.startsAt,
        itinerary: punkt.routeItinerary!,
      })),
    ), false)
    assert.equal(routeFactsAusGraph(reise).origin.airportCode, null)
  })

  test('einzigartige azyklische Kette bestätigt die deklarierte Reihenfolge ohne Uhrenvergleich', () => {
    const itinerary: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        ...bein('ZRH', 'BKK', '2026-11-01', '20:00', 'CH', 'TH').legs,
        ...bein('BKK', 'SIN', '2026-11-01', '10:00', 'TH', 'SG').legs,
      ],
    }
    const facts = routeFactsAusGraph(reiseMit(itinerary))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'SIN')
  })

  test('unbewiesene Chronologie bleibt fingerprint-stabil über Eingabereihenfolge', () => {
    const hin = bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH')
    const rueck = bein('BKK', 'ZRH', '2026-11-01', '18:00', 'TH', 'CH')
    const reise = twoFlights(
      { id: 'hin', itinerary: hin, startsOn: '2026-11-01', startsAt: '09:00' },
      { id: 'rueck', itinerary: rueck, startsOn: '2026-11-01', startsAt: '18:00' },
    )
    const umgestellt = { ...reise, ohneTag: [...reise.ohneTag].reverse() }
    assert.equal(routeFactsAusGraph(reise).fingerprint, routeFactsAusGraph(umgestellt).fingerprint)
  })
})

describe('R11 Blocker 25 – Segmentordnung innerhalb eines Legs', () => {
  test('umgekehrt gespeicherter Transit wird kanonisch ZRH>DOH>BKK', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryTransitUmgekehrt()))
    const korrekt = routeFactsAusGraph(reiseMit(itineraryEinTransit('DOH')))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.origin.countryCode, 'CH')
    assert.deepEqual(facts.destinationCountryCodes, ['TH'])
    assert.deepEqual(facts.transitCountryCodes, ['QA'])
    assert.equal(facts.destinationCountryCodes.includes('CH'), false)
    assert.equal(facts.fingerprint, korrekt.fingerprint)
    assert.equal(facts.connections[0]?.airportCode, 'DOH')
    assert.equal(facts.connections[0]?.airportChange, false)
    assert.equal(pfadAusSegmenten(facts.segments), 'ZRH:CH>DOH:QA>BKK:TH')
    const html = renderToStaticMarkup(createElement(FlugRoute, { facts }))
    assert.match(html, /Zürich ZRH/)
    assert.match(html, /Bangkok BKK/)
    assert.equal(html.includes('Flughafenwechsel'), false)
  })

  test('Surface-Change ohne IATA-Kette bleibt erklärte Reihenfolge', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryAirportChange('ORY')))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.connections[0]?.airportChange, true)
    assert.match(routeKompakt(facts), /Paris CDG ⇢ Paris ORY/)
  })

  test('vertauschte kontinuierliche CDG-ORY-Kette bleibt ZRH-Origin', () => {
    const umgekehrt: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [...(itineraryKontinuierlichCdgOry().legs[0]?.segments ?? [])].reverse(),
        },
      ],
    }
    const facts = routeFactsAusGraph(reiseMit(umgekehrt))
    const korrekt = routeFactsAusGraph(reiseMit(itineraryKontinuierlichCdgOry()))
    assert.equal(facts.chronologieBewiesen, true)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'BKK')
    assert.equal(facts.fingerprint, korrekt.fingerprint)
    assert.equal(facts.connections.some((eintrag) => eintrag.airportChange === true), false)
  })

  test('zyklische Segmente bleiben fail-closed', () => {
    const cycle: FlugRouteItinerary = {
      v: 1,
      type: 'flight_route_itinerary',
      legs: [
        {
          segments: [
            bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH').legs[0]!.segments[0]!,
            bein('BKK', 'ZRH', '2026-11-01', '18:00', 'TH', 'CH').legs[0]!.segments[0]!,
          ],
        },
      ],
    }
    const facts = routeFactsAusGraph(reiseMit(cycle))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.destination.airportCode, null)
  })

  test('fehlende IATA ist keine Kontinuität und erfindet keine Reihenfolge', () => {
    const itinerary: FlugRouteItinerary = {
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
    const facts = routeFactsAusGraph(reiseMit(itinerary))
    assert.equal(facts.chronologieBewiesen, false)
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.destination.airportCode, null)
  })

  test('Guest und Account teilen dieselbe rekonstruierte Transit-Truth', () => {
    const gast = flug({ id: 'gast', routeItinerary: itineraryTransitUmgekehrt() })
    const konto = flug({ id: 'konto', routeItinerary: itineraryTransitUmgekehrt() })
    assert.deepEqual(routeFactsFuerPunkt(gast).origin, routeFactsFuerPunkt(konto).origin)
    assert.deepEqual(routeFactsFuerPunkt(gast).destination, routeFactsFuerPunkt(konto).destination)
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsAusItinerary(itineraryEinTransit('DOH')).fingerprint)
  })
})

describe('R11 Blocker 26 – globales Routenziel', () => {
  test('zwei Items ZRH→BKK und BKK→SIN setzen Ziel auf SIN', () => {
    const erster = bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH')
    const zweiter = bein('BKK', 'SIN', '2026-11-08', '11:00', 'TH', 'SG')
    const facts = routeFactsAusGraph(
      twoFlights(
        { id: 'a', itinerary: erster, startsOn: '2026-11-01', startsAt: '09:00' },
        { id: 'b', itinerary: zweiter, startsOn: '2026-11-08', startsAt: '11:00' },
      ),
    )
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'SIN')
    assert.equal(facts.destination.countryCode, 'SG')
    assert.deepEqual(facts.destinationCountryCodes, ['TH', 'SG'])
  })

  test('drei sequenzielle Items setzen das Ziel auf das letzte Ende', () => {
    const reise = dreiFlights(
      { id: 'c', itinerary: bein('SIN', 'HNL', '2026-11-15', '09:00', 'SG', 'US'), startsOn: '2026-11-15' },
      { id: 'a', itinerary: bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH'), startsOn: '2026-11-01' },
      { id: 'b', itinerary: bein('BKK', 'SIN', '2026-11-08', '11:00', 'TH', 'SG'), startsOn: '2026-11-08' },
    )
    const facts = routeFactsAusGraph(reise)
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'HNL')
    assert.equal(facts.destination.countryCode, 'US')
  })

  test('umgekehrte Eingabereihenfolge ändert bewiesenes Ziel nicht', () => {
    const erster = bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH')
    const zweiter = bein('BKK', 'SIN', '2026-11-08', '11:00', 'TH', 'SG')
    const vor = routeFactsAusGraph(
      twoFlights(
        { id: 'a', itinerary: erster, startsOn: '2026-11-01', startsAt: '09:00' },
        { id: 'b', itinerary: zweiter, startsOn: '2026-11-08', startsAt: '11:00' },
      ),
    )
    const rueck = routeFactsAusGraph(
      twoFlights(
        { id: 'b', itinerary: zweiter, startsOn: '2026-11-08', startsAt: '11:00' },
        { id: 'a', itinerary: erster, startsOn: '2026-11-01', startsAt: '09:00' },
      ),
    )
    assert.equal(vor.origin.airportCode, rueck.origin.airportCode)
    assert.equal(vor.destination.airportCode, rueck.destination.airportCode)
    assert.equal(vor.fingerprint, rueck.fingerprint)
  })

  test('getrennte Roundtrip-Items enden in ZRH', () => {
    const facts = routeFactsAusGraph(
      twoFlights(
        { id: 'rueck', itinerary: bein('BKK', 'ZRH', '2026-11-12', '23:00', 'TH', 'CH'), startsOn: '2026-11-12' },
        { id: 'hin', itinerary: bein('ZRH', 'BKK', '2026-11-01', '09:15', 'CH', 'TH'), startsOn: '2026-11-01' },
      ),
    )
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'ZRH')
    assert.deepEqual(facts.destinationCountryCodes, ['TH'])
  })

  test('Open-Jaw-Ziel ist das Ende der letzten Route', () => {
    const facts = routeFactsAusGraph(bangkokOpenJawFluegeReise())
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'ZRH')
    assert.deepEqual(facts.destinationCountryCodes, ['TH', 'SG'])
  })

  test('Open-Jaw DMK→GVA als letztes Item setzt GVA als Ziel', () => {
    const hin = bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH')
    const rueck = bein('DMK', 'GVA', '2026-11-12', '11:00', 'TH', 'CH')
    const facts = routeFactsAusGraph(
      twoFlights(
        { id: 'rueck', itinerary: rueck, startsOn: '2026-11-12', startsAt: '11:00' },
        { id: 'hin', itinerary: hin, startsOn: '2026-11-01', startsAt: '09:00' },
      ),
    )
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'GVA')
    assert.equal(facts.destination.countryCode, 'CH')
  })

  test('unbewiesene Chronologie leert Ursprung und Ziel', () => {
    const facts = routeFactsAusGraph(
      twoFlights(
        { id: 'a', itinerary: bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH'), startsOn: '2026-11-01' },
        { id: 'b', itinerary: bein('BKK', 'ZRH', '2026-11-01', '18:00', 'TH', 'CH'), startsOn: '2026-11-01' },
      ),
    )
    assert.equal(facts.origin.airportCode, null)
    assert.equal(facts.destination.airportCode, null)
  })

  test('eine Multi-Leg-Itinerary bleibt korrekt und endet am letzten Leg', () => {
    const facts = routeFactsAusGraph(reiseMit(itineraryHinTransitRueckDirekt()))
    assert.equal(facts.origin.airportCode, 'ZRH')
    assert.equal(facts.destination.airportCode, 'ZRH')
    assert.deepEqual(facts.transitCountryCodes, ['QA'])
    assert.deepEqual(facts.destinationCountryCodes, ['TH'])
  })

  test('Airport-Zeitkontakte folgen der kanonischen Reihenfolge', () => {
    const wahrheit = itinerariesFuerWahrheit([
      {
        sourceItemId: 'b',
        startsOn: '2026-11-08',
        startsAt: '11:00',
        itinerary: bein('BKK', 'SIN', '2026-11-08', '11:00', 'TH', 'SG'),
      },
      {
        sourceItemId: 'a',
        startsOn: '2026-11-01',
        startsAt: '09:00',
        itinerary: bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH'),
      },
    ])
    assert.equal(wahrheit[0]?.itinerary.legs[0]?.segments[0]?.origin.airportCode, 'ZRH')
    assert.equal(wahrheit.at(-1)?.itinerary.legs[0]?.segments[0]?.destination.airportCode, 'SIN')
    const facts = routeFactsAusGraph(
      twoFlights(
        { id: 'b', itinerary: bein('BKK', 'SIN', '2026-11-08', '11:00', 'TH', 'SG'), startsOn: '2026-11-08' },
        { id: 'a', itinerary: bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH'), startsOn: '2026-11-01' },
      ),
    )
    assert.equal(facts.airportContacts.find((kontakt) => kontakt.airportCode === 'ZRH')?.start, '2026-11-01T09:00')
    assert.equal(facts.airportContacts.find((kontakt) => kontakt.airportCode === 'SIN')?.start, '2026-11-08')
  })

  test('Readiness, Safety und Seasonal sehen dieselbe korrigierte Route Truth', () => {
    const reise = twoFlights(
      { id: 'b', itinerary: bein('BKK', 'SIN', '2026-11-08', '11:00', 'TH', 'SG'), startsOn: '2026-11-08' },
      { id: 'a', itinerary: bein('ZRH', 'BKK', '2026-11-01', '09:00', 'CH', 'TH'), startsOn: '2026-11-01' },
    )
    const facts = routeFactsAusGraph(reise)
    const readiness = routeFactsAusReise(reise)
    const safety = safetyReisekontext(reise)
    const seasonal = seasonalReisekontext(reise)
    assert.equal(facts.destination.airportCode, 'SIN')
    assert.equal(readiness.destinationCountryCode, 'SG')
    assert.deepEqual(readiness.destinationCountryCodes, ['TH', 'SG'])
    assert.equal(safety.route.destination.airportCode, 'SIN')
    assert.equal(seasonal.route.destination.airportCode, 'SIN')
    assert.equal(readinessReisekontext(reise).originCountryCode, 'CH')
  })
})
