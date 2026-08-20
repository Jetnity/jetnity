// lib/hotels/geo.ts
//
// Kleine Geometrie für Quartierpassung. Keine Wegezeiten, kein Routing.

import type { GeoPunkt } from '@/lib/hotels/domain'

const ERDE_KM = 6371

function toRad(grad: number): number {
  return (grad * Math.PI) / 180
}

/** Luftlinie in Kilometern. Kein Geh- oder ÖV-Ersatz. */
export function luftlinieKm(a: GeoPunkt, b: GeoPunkt): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon
  return 2 * ERDE_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function geoPunktGueltig(punkt: GeoPunkt): boolean {
  return (
    Number.isFinite(punkt.lat) &&
    Number.isFinite(punkt.lon) &&
    punkt.lat >= -90 &&
    punkt.lat <= 90 &&
    punkt.lon >= -180 &&
    punkt.lon <= 180
  )
}
