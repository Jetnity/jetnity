// lib/account/account-world-visit-management-premium-1-fixture.ts
//
// Nur für den UI-Audit. Keine Produktdaten, kein Schreibweg.
//
// Vierzig Ereignisse auf zehn Orten: Wiederholungen bleiben eigene Ids.
// Die Länder liegen in der bestehenden Audit-Geometrie (PT, IT, JP, SG, BR,
// HK, MT), damit die Karte keine neue Kartografie braucht.

import type { Besuch } from '@/lib/account/besuche'

const ORTE: readonly Pick<
  Besuch,
  'placeId' | 'placeLabel' | 'countryCode' | 'latitude' | 'longitude'
>[] = [
  {
    placeId: 'geonames:2267057',
    placeLabel: 'Lissabon',
    countryCode: 'PT',
    latitude: 38.7223,
    longitude: -9.1393,
  },
  {
    placeId: 'geonames:2735943',
    placeLabel: 'Porto',
    countryCode: 'PT',
    latitude: 41.1496,
    longitude: -8.6109,
  },
  {
    placeId: 'geonames:3169070',
    placeLabel: 'Rom',
    countryCode: 'IT',
    latitude: 41.8931,
    longitude: 12.4828,
  },
  {
    placeId: 'geonames:1850147',
    placeLabel: 'Tokio',
    countryCode: 'JP',
    latitude: 35.6895,
    longitude: 139.6917,
  },
  {
    placeId: 'geonames:1857910',
    placeLabel: 'Kyoto',
    countryCode: 'JP',
    latitude: 35.0116,
    longitude: 135.7681,
  },
  {
    placeId: 'geonames:1880252',
    placeLabel: 'Singapur',
    countryCode: 'SG',
    latitude: 1.2897,
    longitude: 103.8501,
  },
  {
    placeId: 'geonames:3451190',
    placeLabel: 'Rio de Janeiro',
    countryCode: 'BR',
    latitude: -22.9028,
    longitude: -43.2075,
  },
  {
    placeId: 'geonames:1819729',
    placeLabel: 'Hongkong',
    countryCode: 'HK',
    latitude: 22.2783,
    longitude: 114.1747,
  },
  {
    placeId: 'geonames:2562305',
    placeLabel: 'Valletta',
    countryCode: 'MT',
    latitude: 35.8997,
    longitude: 14.5147,
  },
  {
    placeId: 'geonames:9999999',
    placeLabel: 'Ort ohne Ländercode',
    countryCode: null,
    latitude: null,
    longitude: null,
  },
]

function auditId(nummer: number): string {
  return `bbbb1111-0000-4000-8000-${nummer.toString(16).padStart(12, '0')}`
}

/** `anzahl` getrennte Besuchsereignisse. Standard ist die Dichte der Produktkritik. */
export function besuchVerwaltungDichteFixture(anzahl = 40): readonly Besuch[] {
  return Array.from({ length: anzahl }, (_, index) => {
    const ort = ORTE[index % ORTE.length]!
    const muster = index % 4
    const jahr = muster === 0 ? null : 2024 - (index % 18)
    const monat = muster === 2 || muster === 3 ? (index % 12) + 1 : null
    const tag = muster === 3 ? (index % 27) + 1 : null
    return {
      id: auditId(index + 1),
      placeId: ort.placeId,
      placeLabel: ort.placeLabel,
      countryCode: ort.countryCode,
      latitude: ort.latitude,
      longitude: ort.longitude,
      jahr,
      monat,
      tag,
      erstelltAm: new Date(Date.UTC(2026, 0, 1, 10, index, 0)).toISOString(),
    }
  })
}
