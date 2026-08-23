// lib/route/pfad.ts
//
// Leg-bewusste Pfadserialisierung. Keine Städte, keine Anzeigenamen.

import type { FlugRouteItinerary, RouteSegment } from '@/lib/route/domain'
import { iataLesen } from '@/lib/route/referenz'

export function pfadAusSegmenten(segmente: readonly RouteSegment[]): string {
  const punkte: string[] = []
  for (const [index, segment] of segmente.entries()) {
    if (index === 0) punkte.push(punktSchluessel(segment.origin))
    punkte.push(punktSchluessel(segment.destination))
  }
  return punkte.join('>')
}

export function pfadAusItinerary(itinerary: FlugRouteItinerary): string {
  return itinerary.legs.map((bein) => pfadAusSegmenten(bein.segments)).join('|')
}

function punktSchluessel(punkt: { airportCode: string | null; countryCode: string | null }): string {
  return `${iataLesen(punkt.airportCode) ?? ''}:${punkt.countryCode ?? ''}`
}
