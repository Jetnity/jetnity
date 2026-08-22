// lib/route/itinerary.ts
//
// FlugOption → persistierbare Route-Itinerary.
// Länder nur aus der übergebenen Flughafenreferenz, nie aus Segmenttext.
//
// Frei von Next und Providern.

import type { FlugOption } from '@/lib/flights/domain'
import { flugOptionLesen } from '@/lib/flights/schema'
import type { FlughafenReferenzKarte, FlugRouteItinerary, RouteSegment } from '@/lib/route/domain'
import { flughafenPunkt } from '@/lib/route/referenz'
import { flugRouteItineraryLesen } from '@/lib/route/schema'

export function itineraryAusFlugOption(
  wert: unknown,
  refs: FlughafenReferenzKarte = {},
): FlugRouteItinerary | null {
  const option = flugOptionLesen(wert)
  if (!option) return null

  const legs = option.legs
    .map((bein) => ({
      segments: bein.segments
        .map((segment) => segmentAusOption(segment, refs))
        .filter((segment): segment is RouteSegment => segment !== null),
    }))
    .filter((bein) => bein.segments.length > 0)

  return flugRouteItineraryLesen({
    v: 1,
    type: 'flight_route_itinerary',
    legs,
  })
}

export function segmenteAusItinerary(itinerary: FlugRouteItinerary): RouteSegment[] {
  return itinerary.legs.flatMap((bein) => [...bein.segments])
}

function segmentAusOption(
  segment: FlugOption['legs'][number]['segments'][number],
  refs: FlughafenReferenzKarte,
): RouteSegment | null {
  const origin = flughafenPunkt(segment.origin, refs)
  const destination = flughafenPunkt(segment.destination, refs)
  if (!origin.airportCode || !destination.airportCode) return null
  return {
    origin,
    destination,
    departureDate: segment.departureDate,
    departureTime: segment.departureTime,
    arrivalDate: segment.arrivalDate,
    arrivalTime: segment.arrivalTime,
  }
}
