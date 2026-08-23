// lib/route/pfad.ts
//
// Leg-bewusste Pfadserialisierung. Jeder belegte Segment-Origin bleibt erhalten.
// Keine Städte, keine Anzeigenamen.

import type { FlugRouteItinerary, RoutePunkt, RouteSegment } from '@/lib/route/domain'
import { iataLesen } from '@/lib/route/referenz'

export type RoutePfadSchritt = {
  punkt: RoutePunkt
  surfaceChange: boolean
}

function airportGleich(links: RoutePunkt | undefined, rechts: RoutePunkt | undefined): boolean {
  const a = iataLesen(links?.airportCode ?? null)
  const b = iataLesen(rechts?.airportCode ?? null)
  if (a && b) return a === b
  return !a && !b
}

export function pfadSchritteAusSegmenten(segmente: readonly RouteSegment[]): RoutePfadSchritt[] {
  const schritte: RoutePfadSchritt[] = []
  for (const [index, segment] of segmente.entries()) {
    if (index === 0) {
      schritte.push({ punkt: segment.origin, surfaceChange: false })
    } else if (!airportGleich(segmente[index - 1]?.destination, segment.origin)) {
      schritte.push({ punkt: segment.origin, surfaceChange: true })
    }
    schritte.push({ punkt: segment.destination, surfaceChange: false })
  }
  return schritte
}

export function pfadAusSegmenten(segmente: readonly RouteSegment[]): string {
  return pfadSchritteAusSegmenten(segmente)
    .map((schritt) => punktSchluessel(schritt.punkt))
    .join('>')
}

export function pfadAusItinerary(itinerary: FlugRouteItinerary): string {
  return itinerary.legs.map((bein) => pfadAusSegmenten(bein.segments)).join('|')
}

function punktSchluessel(punkt: { airportCode: string | null; countryCode: string | null }): string {
  return `${iataLesen(punkt.airportCode) ?? ''}:${punkt.countryCode ?? ''}`
}
