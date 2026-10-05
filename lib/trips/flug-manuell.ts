import type { FlughafenReferenzKarte } from '@/lib/route/domain'
import { itineraryKanonisieren } from '@/lib/route/itinerary'
import { flughafenPunkt } from '@/lib/route/referenz'
import type { FlugSegmentManuell } from '@/lib/trips/schema'
import type { TripItem } from '@/types/trips'

/** Buchungsstatus/-quelle allein sind keine Provider-Identität. */
export function istManuellerFlug(punkt: {
  kind?: unknown; provider?: unknown; externalRef?: unknown; bookingUrl?: unknown
}): boolean {
  return punkt.kind === 'flight' && punkt.provider == null && punkt.externalRef == null && punkt.bookingUrl == null
}

/**
 * Nur Darstellbarkeit in den Legacy-trip_items-Summary-Feldern, keine Flugdauer-
 * oder UTC-Wahrheit: Ortszeiten verschiedener Flughäfen sind nicht vergleichbar.
 * Die vollständigen lokalen Werte bleiben ausschliesslich im Itinerary erhalten.
 * Gemeinsame pure Projektion für Konto und Gast, nach der Eingabevalidierung.
 */
export function manuelleFlugSummaryProjizieren(erstes: FlugSegmentManuell, letztes: FlugSegmentManuell):
  Pick<TripItem, 'startsOn' | 'startsAt' | 'endsOn' | 'endsAt'> {
  const startsOn = erstes.departureDate
  const startsAt = erstes.departureTime
  const endsOn = letztes.arrivalDate < startsOn ? null : letztes.arrivalDate
  const endsAt = endsOn !== null && startsAt !== null && letztes.arrivalTime !== null &&
    (endsOn > startsOn || letztes.arrivalTime >= startsAt) ? letztes.arrivalTime : null
  return { startsOn, startsAt, endsOn, endsAt }
}

/** Nur für validierte Segmente; Referenzen stammen im Konto ausschliesslich vom Server. */
export function manuelleFlugRouteBauen(segments: readonly FlugSegmentManuell[], refs: FlughafenReferenzKarte = {}) {
  const erstes = segments[0]
  const letztes = segments.at(-1)
  if (!erstes || !letztes) return null
  const routeItinerary = itineraryKanonisieren({
    v: 1,
    type: 'flight_route_itinerary',
    legs: [{ segments: segments.map((segment) => ({
      origin: flughafenPunkt(segment.origin),
      destination: flughafenPunkt(segment.destination),
      departureDate: segment.departureDate,
      departureTime: segment.departureTime,
      arrivalDate: segment.arrivalDate,
      arrivalTime: segment.arrivalTime,
    })) }],
  }, refs)
  if (!routeItinerary) return null
  return {
    routeItinerary,
    ...manuelleFlugSummaryProjizieren(erstes, letztes),
  } satisfies Pick<TripItem, 'routeItinerary' | 'startsOn' | 'startsAt' | 'endsOn' | 'endsAt'>
}
