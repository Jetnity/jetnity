// lib/route/fixtures.ts
//
// Bekannte Flughafenreferenzen für Tests. Keine geratenen Ortsnamen.

import type { FlughafenReferenzKarte, FlugRouteItinerary, RouteSegment } from '@/lib/route/domain'

export const TEST_FLUGHAFEN_REFS: FlughafenReferenzKarte = {
  ZRH: { countryCode: 'CH', city: 'Zürich', country: 'Switzerland', name: 'Zurich' },
  BKK: { countryCode: 'TH', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi' },
  DMK: { countryCode: 'TH', city: 'Bangkok', country: 'Thailand', name: 'Don Mueang' },
  DOH: { countryCode: 'QA', city: 'Doha', country: 'Qatar', name: 'Hamad International' },
  SIN: { countryCode: 'SG', city: 'Singapore', country: 'Singapore', name: 'Changi' },
  FRA: { countryCode: 'DE', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt' },
  LHR: { countryCode: 'GB', city: 'London', country: 'United Kingdom', name: 'Heathrow' },
  CDG: { countryCode: 'FR', city: 'Paris', country: 'France', name: 'Charles de Gaulle' },
  ORY: { countryCode: 'FR', city: 'Paris', country: 'France', name: 'Orly' },
}

function segment(
  von: keyof typeof TEST_FLUGHAFEN_REFS,
  nach: keyof typeof TEST_FLUGHAFEN_REFS,
  abDatum: string,
  abZeit: string,
  anDatum: string,
  anZeit: string,
  mitLand = true,
): RouteSegment {
  const originRef = TEST_FLUGHAFEN_REFS[von]
  const destRef = TEST_FLUGHAFEN_REFS[nach]
  return {
    origin: {
      airportCode: von,
      countryCode: mitLand ? originRef.countryCode : null,
      city: originRef.city,
      country: originRef.country,
    },
    destination: {
      airportCode: nach,
      countryCode: mitLand ? destRef.countryCode : null,
      city: destRef.city,
      country: destRef.country,
    },
    departureDate: abDatum,
    departureTime: abZeit,
    arrivalDate: anDatum,
    arrivalTime: anZeit,
  }
}

export function itineraryDirekt(): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [segment('ZRH', 'BKK', '2026-11-01', '09:15', '2026-11-01', '21:40')],
      },
    ],
  }
}

export function itineraryEinTransit(transit: 'DOH' | 'SIN' = 'DOH'): FlugRouteItinerary {
  const ankunft = transit === 'DOH' ? '16:40' : '15:10'
  const weiter = transit === 'DOH' ? '18:55' : '17:40'
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          segment('ZRH', transit, '2026-11-01', '09:15', '2026-11-01', ankunft),
          segment(transit, 'BKK', '2026-11-01', weiter, '2026-11-02', '07:10'),
        ],
      },
    ],
  }
}

export function itineraryZweiTransits(): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          segment('ZRH', 'FRA', '2026-11-01', '07:10', '2026-11-01', '08:20'),
          segment('FRA', 'DOH', '2026-11-01', '10:05', '2026-11-01', '18:40'),
          segment('DOH', 'BKK', '2026-11-01', '20:55', '2026-11-02', '07:10'),
        ],
      },
    ],
  }
}

export function itineraryOhneLaender(): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [segment('ZRH', 'BKK', '2026-11-01', '09:15', '2026-11-01', '21:40', false)],
      },
    ],
  }
}

export function itineraryAirportChange(): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          segment('ZRH', 'CDG', '2026-11-01', '07:10', '2026-11-01', '08:30'),
          segment('ORY', 'BKK', '2026-11-01', '12:40', '2026-11-02', '06:10'),
        ],
      },
    ],
  }
}

export function itineraryOhneZeiten(): FlugRouteItinerary {
  const basis = itineraryEinTransit()
  const erstes = basis.legs[0]
  if (!erstes) return basis
  return {
    ...basis,
    legs: [
      {
        segments: erstes.segments.map((eintrag, index) =>
          index === 0
            ? { ...eintrag, arrivalDate: null, arrivalTime: null }
            : { ...eintrag, departureDate: null, departureTime: null },
        ),
      },
    ],
  }
}
