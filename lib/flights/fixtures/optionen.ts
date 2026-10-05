// lib/flights/fixtures/optionen.ts
//
// Normalisierte Optionen für Ranking-Tests. Unabhängig vom Provider.

import type { FlugOption, FlugSuchanfrage } from '@/lib/flights/domain'

function segment(
  von: string,
  nach: string,
  abDatum: string,
  abZeit: string,
  anDatum: string,
  anZeit: string,
  airline: string,
  nummer: string,
  minuten: number,
) {
  return {
    origin: von,
    destination: nach,
    departureDate: abDatum,
    departureTime: abZeit,
    arrivalDate: anDatum,
    arrivalTime: anZeit,
    airline,
    airlineName: airline === 'LX' ? 'SWISS' : airline === 'BA' ? 'British Airways' : airline,
    operatingAirline: airline,
    operatingAirlineName: airline === 'LX' ? 'SWISS' : airline,
    flightNumber: nummer,
    durationMinutes: minuten,
  }
}

export const OPTION_DIREKT: FlugOption = {
  id: 'direkt',
  provider: 'duffel',
  externalRef: '1:ZRH:BKK:20261101:LX180:892.5:CHF',
  airline: 'LX',
  airlineName: 'SWISS',
  legs: [
    {
      segments: [segment('ZRH', 'BKK', '2026-11-01', '09:15', '2026-11-01', '21:40', 'LX', 'LX180', 690)],
      durationMinutes: 690,
      stops: 0,
    },
  ],
  durationMinutes: 690,
  stops: 0,
  priceAmount: 892.5,
  priceCurrency: 'CHF',
  cabin: 'economy',
  baggage: { checkedBags: 1 },
  refundable: false,
  fare: { brandedFare: 'ECOSAVER' },
}

export const OPTION_GUENSTIG_LANG: FlugOption = {
  id: 'guenstig',
  provider: 'duffel',
  externalRef: '2:ZRH:BKK:20261101:BA715:850:CHF',
  airline: 'BA',
  airlineName: 'British Airways',
  legs: [
    {
      segments: [
        segment('ZRH', 'LHR', '2026-11-01', '05:10', '2026-11-01', '06:05', 'BA', 'BA715', 115),
        segment('LHR', 'BKK', '2026-11-01', '10:40', '2026-11-02', '05:55', 'BA', 'BA9', 675),
      ],
      durationMinutes: 1125,
      stops: 1,
    },
  ],
  durationMinutes: 1125,
  stops: 1,
  priceAmount: 850,
  priceCurrency: 'CHF',
  cabin: 'economy',
  baggage: { checkedBags: 0 },
  refundable: null,
  fare: null,
}

export const OPTION_OVERNIGHT: FlugOption = {
  id: 'overnight',
  provider: 'duffel',
  externalRef: '3:ZRH:BKK:20261101:LX310:810:CHF',
  airline: 'LX',
  airlineName: 'SWISS',
  legs: [
    {
      segments: [
        segment('ZRH', 'DOH', '2026-11-01', '16:00', '2026-11-01', '22:10', 'LX', 'LX310', 370),
        segment('DOH', 'BKK', '2026-11-02', '08:40', '2026-11-02', '19:10', 'LX', 'LX7802', 390),
      ],
      durationMinutes: 1210,
      stops: 1,
    },
  ],
  durationMinutes: 1210,
  stops: 1,
  priceAmount: 810,
  priceCurrency: 'CHF',
  cabin: 'economy',
  baggage: null,
  refundable: null,
  fare: null,
}

export const SUCHANFRAGE: FlugSuchanfrage = {
  legs: [{ origin: 'ZRH', destination: 'BKK', date: '2026-11-01' }],
  passengers: { adults: 2, children: 0, infants: 0 },
  cabin: 'economy',
  stopPreference: 'any',
  currency: 'CHF',
  context: {
    tripStartDate: '2026-11-01',
    tripEndDate: '2026-11-15',
    selectedDate: '2026-11-01',
  },
}
