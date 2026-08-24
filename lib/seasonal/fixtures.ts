// lib/seasonal/fixtures.ts
//
// Kontrollierte Testreisen und Provider-Doubles. Keine Production-Truth.

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { bangkokRouteReise, mehrzielreise } from '@/lib/safety/fixtures'
import type { SeasonalProvider, SeasonalProviderAnfrage, SeasonalProviderFact } from '@/lib/seasonal/provider'
import type { Trip } from '@/types/trips'

export const SEASONAL_NOW_MS = Date.parse('2026-08-21T10:00:00.000Z')
const SEASONAL_FRESH_UNTIL = '2026-12-31T00:00:00.000Z'

export { bangkokRouteReise, mehrzielreise }

function flugPunkt(teil: {
  id: string
  title: string
  startsOn: string
  endsOn: string
  legs: NonNullable<Trip['ohneTag'][number]['routeItinerary']>['legs']
}): Trip['ohneTag'][number] {
  return {
    ...beispielreise().days[0]!.items[0]!,
    id: teil.id,
    kind: 'flight',
    title: teil.title,
    dayId: null,
    stageId: 'stage-bkk',
    startsOn: teil.startsOn,
    endsOn: teil.endsOn,
    routeItinerary: {
      v: 1,
      type: 'flight_route_itinerary',
      legs: teil.legs,
    },
  }
}

const BKK_HIN = {
  origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
  destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
  departureDate: '2026-09-12',
  departureTime: '09:15',
  arrivalDate: '2026-09-13',
  arrivalTime: '06:20',
}

const BKK_RUECK = {
  origin: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
  destination: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
  departureDate: '2026-09-20',
  departureTime: '23:00',
  arrivalDate: '2026-09-21',
  arrivalTime: '06:00',
}

function bangkokRundreise(ohneTag: Trip['ohneTag']): Trip {
  return beispielreise({
    title: 'Bangkok Hin und Rück',
    startDate: '2026-09-12',
    endDate: '2026-09-21',
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
        departureDate: '2026-09-20',
      },
    ],
    days: [],
    ohneTag,
  })
}

export function bangkokGetrennteFluegeReise(): Trip {
  return bangkokRundreise([
    flugPunkt({
      id: 'flug-hin',
      title: 'ZRH → BKK',
      startsOn: '2026-09-12',
      endsOn: '2026-09-13',
      legs: [{ segments: [BKK_HIN] }],
    }),
    flugPunkt({
      id: 'flug-rueck',
      title: 'BKK → ZRH',
      startsOn: '2026-09-20',
      endsOn: '2026-09-21',
      legs: [{ segments: [BKK_RUECK] }],
    }),
  ])
}

const HKG_RUECK = {
  origin: { airportCode: 'HKG', countryCode: 'HK', city: 'Hong Kong', country: 'Hong Kong' },
  destination: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
  departureDate: '2026-09-20',
  departureTime: '23:00',
  arrivalDate: '2026-09-21',
  arrivalTime: '06:10',
}

export function bangkokOpenJawFluegeReise(): Trip {
  return bangkokRundreise([
    flugPunkt({
      id: 'flug-hin',
      title: 'ZRH → BKK',
      startsOn: '2026-09-12',
      endsOn: '2026-09-13',
      legs: [{ segments: [BKK_HIN] }],
    }),
    flugPunkt({
      id: 'flug-openjaw',
      title: 'SIN → ZRH',
      startsOn: '2026-09-20',
      endsOn: '2026-09-21',
      legs: [{ segments: [SIN_RUECK] }],
    }),
  ])
}

export function bangkokOpenJawLegsReise(): Trip {
  return bangkokRundreise([
    flugPunkt({
      id: 'flug-openjaw',
      title: 'ZRH → BKK | SIN → ZRH',
      startsOn: '2026-09-12',
      endsOn: '2026-09-21',
      legs: [{ segments: [BKK_HIN] }, { segments: [SIN_RUECK] }],
    }),
  ])
}

export function bangkokOpenJawHkgLegsReise(): Trip {
  return bangkokRundreise([
    flugPunkt({
      id: 'flug-openjaw-hkg',
      title: 'ZRH → BKK | HKG → ZRH',
      startsOn: '2026-09-12',
      endsOn: '2026-09-21',
      legs: [{ segments: [BKK_HIN] }, { segments: [HKG_RUECK] }],
    }),
  ])
}

export function bangkokGetrennteLegsReise(): Trip {
  return bangkokRundreise([
    flugPunkt({
      id: 'flug-roundtrip',
      title: 'ZRH ↔ BKK',
      startsOn: '2026-09-12',
      endsOn: '2026-09-21',
      legs: [{ segments: [BKK_HIN] }, { segments: [BKK_RUECK] }],
    }),
  ])
}

const BKK_SIN = {
  origin: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
  destination: { airportCode: 'SIN', countryCode: 'SG', city: 'Singapore', country: 'Singapore' },
  departureDate: '2026-09-16',
  departureTime: '11:00',
  arrivalDate: '2026-09-16',
  arrivalTime: '14:20',
}

const SIN_RUECK = {
  origin: { airportCode: 'SIN', countryCode: 'SG', city: 'Singapore', country: 'Singapore' },
  destination: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
  departureDate: '2026-09-20',
  departureTime: '23:00',
  arrivalDate: '2026-09-21',
  arrivalTime: '06:40',
}

const DOH_HIN_1 = {
  origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
  destination: { airportCode: 'DOH', countryCode: 'QA', city: 'Doha', country: 'Qatar' },
  departureDate: '2026-09-12',
  departureTime: '09:15',
  arrivalDate: '2026-09-12',
  arrivalTime: '17:40',
}

const DOH_HIN_2 = {
  origin: { airportCode: 'DOH', countryCode: 'QA', city: 'Doha', country: 'Qatar' },
  destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
  departureDate: '2026-09-12',
  departureTime: '19:10',
  arrivalDate: '2026-09-13',
  arrivalTime: '06:20',
}

const SIN_RUECK_1 = {
  origin: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
  destination: { airportCode: 'SIN', countryCode: 'SG', city: 'Singapore', country: 'Singapore' },
  departureDate: '2026-09-20',
  departureTime: '08:00',
  arrivalDate: '2026-09-20',
  arrivalTime: '11:20',
}

const SIN_RUECK_2 = {
  origin: { airportCode: 'SIN', countryCode: 'SG', city: 'Singapore', country: 'Singapore' },
  destination: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
  departureDate: '2026-09-20',
  departureTime: '23:40',
  arrivalDate: '2026-09-21',
  arrivalTime: '06:50',
}

function bangkokMehrzielreise(ohneTag: Trip['ohneTag']): Trip {
  return beispielreise({
    title: 'Bangkok und Singapur',
    startDate: '2026-09-12',
    endDate: '2026-09-21',
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
      {
        id: 'stage-sin',
        position: 2,
        name: 'Singapore',
        countryCode: 'SG',
        placeId: 'geonames:1880252',
        latitude: 1.3521,
        longitude: 103.8198,
        arrivalDate: '2026-09-16',
        departureDate: '2026-09-20',
      },
    ],
    days: [],
    ohneTag,
  })
}

export function bangkokMehrzielFluegeReise(): Trip {
  return bangkokMehrzielreise([
    flugPunkt({
      id: 'flug-hin',
      title: 'ZRH → BKK',
      startsOn: '2026-09-12',
      endsOn: '2026-09-13',
      legs: [{ segments: [BKK_HIN] }],
    }),
    flugPunkt({
      id: 'flug-weiter',
      title: 'BKK → SIN',
      startsOn: '2026-09-16',
      endsOn: '2026-09-16',
      legs: [{ segments: [BKK_SIN] }],
    }),
    flugPunkt({
      id: 'flug-rueck',
      title: 'SIN → ZRH',
      startsOn: '2026-09-20',
      endsOn: '2026-09-21',
      legs: [{ segments: [SIN_RUECK] }],
    }),
  ])
}

export function bangkokMehrzielLegsReise(): Trip {
  return bangkokMehrzielreise([
    flugPunkt({
      id: 'flug-mehrziel',
      title: 'ZRH → BKK → SIN → ZRH',
      startsOn: '2026-09-12',
      endsOn: '2026-09-21',
      legs: [{ segments: [BKK_HIN] }, { segments: [BKK_SIN] }, { segments: [SIN_RUECK] }],
    }),
  ])
}

export function bangkokRundreiseTransitFluege(): Trip {
  return bangkokRundreise([
    flugPunkt({
      id: 'flug-hin',
      title: 'ZRH → BKK',
      startsOn: '2026-09-12',
      endsOn: '2026-09-13',
      legs: [{ segments: [DOH_HIN_1, DOH_HIN_2] }],
    }),
    flugPunkt({
      id: 'flug-rueck',
      title: 'BKK → ZRH',
      startsOn: '2026-09-20',
      endsOn: '2026-09-21',
      legs: [{ segments: [SIN_RUECK_1, SIN_RUECK_2] }],
    }),
  ])
}

export function bangkokRundreiseTransitLegs(): Trip {
  return bangkokRundreise([
    flugPunkt({
      id: 'flug-roundtrip-transit',
      title: 'ZRH ↔ BKK mit Transit',
      startsOn: '2026-09-12',
      endsOn: '2026-09-21',
      legs: [
        { segments: [DOH_HIN_1, DOH_HIN_2] },
        { segments: [SIN_RUECK_1, SIN_RUECK_2] },
      ],
    }),
  ])
}

export function goaKeralaReise(): Trip {
  return beispielreise({
    title: 'Goa und Kerala',
    startDate: '2026-07-10',
    endDate: '2026-07-20',
    stages: [
      {
        id: 'stage-goa',
        position: 1,
        name: 'Goa',
        countryCode: 'IN',
        placeId: 'geonames:1271157',
        latitude: 15.2993,
        longitude: 74.124,
        arrivalDate: '2026-07-10',
        departureDate: '2026-07-14',
      },
      {
        id: 'stage-kerala',
        position: 2,
        name: 'Kochi',
        countryCode: 'IN',
        placeId: 'geonames:1273874',
        latitude: 9.9312,
        longitude: 76.2673,
        arrivalDate: '2026-07-15',
        departureDate: '2026-07-20',
      },
    ],
    days: [
      {
        id: 'day-goa-1',
        stageId: 'stage-goa',
        dayIndex: 1,
        dayDate: '2026-07-11',
        title: null,
        items: [
          {
            ...beispielreise().days[0]!.items[0]!,
            id: 'act-goa',
            kind: 'activity',
            title: 'Bootstour',
            dayId: 'day-goa-1',
            stageId: 'stage-goa',
            startsOn: '2026-07-11',
            endsOn: '2026-07-11',
          },
        ],
      },
    ],
    ohneTag: [],
  })
}

export function bangkokMonsunReise(): Trip {
  return beispielreise({
    title: 'Bangkok im September',
    startDate: '2026-09-10',
    endDate: '2026-09-18',
    stages: [
      {
        id: 'stage-bkk',
        position: 1,
        name: 'Bangkok',
        countryCode: 'TH',
        placeId: 'geonames:1609350',
        latitude: 13.7563,
        longitude: 100.5018,
        arrivalDate: '2026-09-10',
        departureDate: '2026-09-18',
      },
    ],
    days: [],
    ohneTag: [],
  })
}

export function karibikHurrikanReise(): Trip {
  return beispielreise({
    title: 'Barbados',
    startDate: '2026-09-05',
    endDate: '2026-09-12',
    stages: [
      {
        id: 'stage-bgi',
        position: 1,
        name: 'Bridgetown',
        countryCode: 'BB',
        placeId: 'geonames:3374036',
        latitude: 13.0975,
        longitude: -59.6167,
        arrivalDate: '2026-09-05',
        departureDate: '2026-09-12',
      },
    ],
    days: [],
    ohneTag: [],
  })
}

export function winterJahreswechselReise(): Trip {
  return beispielreise({
    title: 'Reykjavik über Jahreswechsel',
    startDate: '2026-12-28',
    endDate: '2027-01-06',
    stages: [
      {
        id: 'stage-rek',
        position: 1,
        name: 'Reykjavik',
        countryCode: 'IS',
        placeId: 'geonames:3413829',
        latitude: 64.1466,
        longitude: -21.9426,
        arrivalDate: '2026-12-28',
        departureDate: '2027-01-06',
      },
    ],
    days: [],
    ohneTag: [],
  })
}

export function schalttagReise(): Trip {
  return beispielreise({
    title: 'Schalttag',
    startDate: '2028-02-28',
    endDate: '2028-03-01',
    stages: [
      {
        id: 'stage-osu',
        position: 1,
        name: 'Oslo',
        countryCode: 'NO',
        placeId: 'geonames:3143244',
        latitude: 59.9139,
        longitude: 10.7522,
        arrivalDate: '2028-02-29',
        departureDate: '2028-02-29',
      },
    ],
    days: [],
    ohneTag: [],
  })
}

export function wiederholteGoaReise(): Trip {
  return beispielreise({
    title: 'Goa zweimal',
    startDate: '2026-03-01',
    endDate: '2026-07-20',
    stages: [
      {
        id: 'stage-goa-mar',
        position: 1,
        name: 'Goa',
        countryCode: 'IN',
        placeId: 'geonames:1271157',
        latitude: 15.2993,
        longitude: 74.124,
        arrivalDate: '2026-03-02',
        departureDate: '2026-03-06',
      },
      {
        id: 'stage-goa-jul',
        position: 2,
        name: 'Goa',
        countryCode: 'IN',
        placeId: 'geonames:1271157',
        latitude: 15.2993,
        longitude: 74.124,
        arrivalDate: '2026-07-10',
        departureDate: '2026-07-16',
      },
    ],
    days: [],
    ohneTag: [],
  })
}

export function seasonalFact(
  teil: Partial<SeasonalProviderFact> & Pick<SeasonalProviderFact, 'factKey' | 'category'>,
): SeasonalProviderFact {
  return {
    evidenceClass: 'seasonal_pattern',
    outcome: 'less_favorable',
    authority: 'Test Climate Authority',
    authorityClass: 'official_climate',
    sourceUrl: 'https://example.org/seasonal',
    checkedAt: '2026-08-21T09:00:00.000Z',
    publishedAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
    freshUntil: SEASONAL_FRESH_UNTIL,
    spatialScope: { kind: 'country', countryCode: 'TH' },
    travelWindow: { kind: 'annual_recurring', start: '05-01', end: '10-31' },
    referencePeriod: { startYear: 1991, endYear: 2020 },
    headline: 'Typische Regenzeit',
    summary: 'Der Zeitraum fällt typischerweise in die stärkere Regenzeit.',
    ...teil,
  }
}

export function testSeasonalProvider(
  facts: SeasonalProviderFact[] | ((anfrage: SeasonalProviderAnfrage) => Promise<SeasonalProviderFact[]>),
  name = 'audit-seasonal',
): SeasonalProvider {
  return {
    name,
    async evaluate(anfrage) {
      return typeof facts === 'function' ? facts(anfrage) : facts
    },
  }
}
