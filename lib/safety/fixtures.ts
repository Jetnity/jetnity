// lib/safety/fixtures.ts
//
// Kontrollierte Testreisen und Provider-Doubles. Keine Production-Truth.

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { SafetyProvider, SafetyProviderFact } from '@/lib/safety/provider'
import type { Trip } from '@/types/trips'

export const SAFETY_NOW_MS = Date.parse('2026-08-21T10:00:00.000Z')

export function mehrzielreise(abweichung: Partial<Trip> = {}): Trip {
  return beispielreise({
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Florenz',
        countryCode: 'IT',
        placeId: 'geonames:3176959',
        latitude: 43.7696,
        longitude: 11.2558,
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-14',
      },
      {
        id: 'stage-2',
        position: 2,
        name: 'Rom',
        countryCode: 'IT',
        placeId: 'geonames:3169070',
        latitude: 41.9028,
        longitude: 12.4964,
        arrivalDate: '2026-09-15',
        departureDate: '2026-09-16',
      },
    ],
    ...abweichung,
  })
}

export function bangkokRouteReise(): Trip {
  return beispielreise({
    title: 'Bangkok',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    stages: [
      {
        id: 'stage-bkk',
        position: 1,
        name: 'Bangkok',
        countryCode: 'TH',
        placeId: 'geonames:1609350',
        latitude: 13.7563,
        longitude: 100.5018,
        arrivalDate: '2026-09-13',
        departureDate: '2026-09-16',
      },
    ],
    days: [],
    ohneTag: [
      {
        ...beispielreise().days[0]!.items[0]!,
        id: 'flug-transit',
        kind: 'flight',
        title: 'ZRH → BKK',
        dayId: null,
        stageId: 'stage-bkk',
        startsOn: '2026-09-12',
        endsOn: '2026-09-13',
        routeItinerary: {
          v: 1,
          type: 'flight_route_itinerary',
          legs: [
            {
              segments: [
                {
                  origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
                  destination: { airportCode: 'DOH', countryCode: 'QA', city: 'Doha', country: 'Qatar' },
                  departureDate: '2026-09-12',
                  departureTime: '09:15',
                  arrivalDate: '2026-09-12',
                  arrivalTime: '17:40',
                },
                {
                  origin: { airportCode: 'DOH', countryCode: 'QA', city: 'Doha', country: 'Qatar' },
                  destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
                  departureDate: '2026-09-12',
                  departureTime: '19:10',
                  arrivalDate: '2026-09-13',
                  arrivalTime: '06:20',
                },
              ],
            },
          ],
        },
      },
    ],
  })
}

export function mumbaiDelhiRouteReise(reverse = false): Trip {
  const hin = [
    {
      origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
      destination: { airportCode: 'DEL', countryCode: 'IN', city: 'Delhi', country: 'India' },
      departureDate: '2026-09-12',
      departureTime: '09:15',
      arrivalDate: '2026-09-12',
      arrivalTime: '22:40',
    },
    {
      origin: { airportCode: 'DEL', countryCode: 'IN', city: 'Delhi', country: 'India' },
      destination: { airportCode: 'BOM', countryCode: 'IN', city: 'Mumbai', country: 'India' },
      departureDate: '2026-09-13',
      departureTime: '01:10',
      arrivalDate: '2026-09-13',
      arrivalTime: '03:20',
    },
  ] as const
  return beispielreise({
    title: 'Mumbai',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    stages: [
      {
        id: 'stage-bom',
        position: 1,
        name: 'Mumbai',
        countryCode: 'IN',
        placeId: 'geonames:1275339',
        latitude: 19.076,
        longitude: 72.8777,
        arrivalDate: '2026-09-13',
        departureDate: '2026-09-16',
      },
    ],
    days: [],
    ohneTag: [
      {
        ...beispielreise().days[0]!.items[0]!,
        id: 'flug-del',
        kind: 'flight',
        title: reverse ? 'BOM → ZRH' : 'ZRH → BOM',
        dayId: null,
        stageId: 'stage-bom',
        startsOn: '2026-09-12',
        endsOn: '2026-09-13',
        routeItinerary: {
          v: 1,
          type: 'flight_route_itinerary',
          legs: [{ segments: reverse ? [...hin].reverse().map((segment) => ({ ...segment })) : [...hin] }],
        },
      },
    ],
  })
}

export function safetyFact(teil: Partial<SafetyProviderFact> & Pick<SafetyProviderFact, 'factKey' | 'category'>): SafetyProviderFact {
  return {
    status: 'active',
    nature: 'acute',
    authority: 'Test Authority',
    authorityClass: 'official_government',
    sourceUrl: 'https://example.org/advisory',
    checkedAt: '2026-08-21T09:00:00.000Z',
    publishedAt: '2026-08-20T08:00:00.000Z',
    spatialScope: { kind: 'city', countryCode: 'IT', placeId: 'geonames:3176959', cityName: 'Florenz' },
    sourceSeverity: 'severe',
    advisoryClass: 'reconsider_travel',
    headline: 'Erdbeben bei Florenz',
    summary: 'Regionale Erschütterungen im Raum Florenz.',
    ...teil,
  }
}

export function testSafetyProvider(
  facts: SafetyProviderFact[] | (() => Promise<SafetyProviderFact[]>),
  name = 'audit-safety',
): SafetyProvider {
  return {
    name,
    async evaluate() {
      return typeof facts === 'function' ? facts() : facts
    },
  }
}
