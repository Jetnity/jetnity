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
    startsOn: erstes.departureDate,
    startsAt: erstes.departureTime,
    endsOn: letztes.arrivalDate,
    endsAt: letztes.arrivalTime,
  } satisfies Pick<TripItem, 'routeItinerary' | 'startsOn' | 'startsAt' | 'endsOn' | 'endsAt'>
}
