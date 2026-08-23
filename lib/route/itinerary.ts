// lib/route/itinerary.ts
//
// FlugOption → persistierbare Route-Itinerary, plus Kanonisierung vorhandener Itineraries.
// Länder nur aus der übergebenen Flughafenreferenz, nie aus Segment- oder Clienttext.
// Eine FlugOption ist untrusted Browser-Input: Segmentlücken werden nicht zu Surface-Evidence.
//
// Frei von Next und Providern.

import type { FlugOption } from '@/lib/flights/domain'
import { flugOptionLesen } from '@/lib/flights/schema'
import type { FlughafenReferenzKarte, FlugRouteItinerary, RouteSegment } from '@/lib/route/domain'
import { flughafenPunkt, iataLesen } from '@/lib/route/referenz'
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

/**
 * Baut eine Itinerary aus IATA + serverseitiger Referenz neu.
 * Clientwerte für Land, Stadt und Ländername werden verworfen.
 */
export function itineraryKanonisieren(
  itinerary: FlugRouteItinerary,
  refs: FlughafenReferenzKarte,
): FlugRouteItinerary | null {
  const legs: { segments: RouteSegment[] }[] = []
  for (const bein of itinerary.legs) {
    const segments: RouteSegment[] = []
    for (const segment of bein.segments) {
      const surface = surfaceEvidenceLesen(segment.surfaceFromAirportCode)
      if (surface === false) return null
      segments.push({
        origin: flughafenPunkt(segment.origin.airportCode, refs),
        destination: flughafenPunkt(segment.destination.airportCode, refs),
        departureDate: segment.departureDate,
        departureTime: segment.departureTime,
        arrivalDate: segment.arrivalDate,
        arrivalTime: segment.arrivalTime,
        ...(surface ? { surfaceFromAirportCode: surface } : {}),
      })
    }
    legs.push({ segments })
  }
  return flugRouteItineraryLesen({
    v: 1,
    type: 'flight_route_itinerary',
    legs,
  })
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

function surfaceEvidenceLesen(wert: string | null | undefined): string | null | false {
  if (wert == null || wert === '') return null
  return iataLesen(wert) ?? false
}
