// lib/route/fingerprint.ts
//
// Deterministischer Route-Fingerprint für Change- und Readiness-Stale.
// Städte und Anzeigenamen gehören nicht dazu.
//
// Frei von Next und Providern.

import { ROUTE_FACTS_VERSION } from '@/lib/route/domain'
import type { RouteItineraryMitQuelle, RouteSegment } from '@/lib/route/domain'
import { segmenteAusItinerary } from '@/lib/route/itinerary'
import { iataLesen } from '@/lib/route/referenz'

export function routeFingerprintAus(itineraries: readonly RouteItineraryMitQuelle[]): string | null {
  if (itineraries.length === 0) return null
  const teile = itineraries.map((eintrag) => pfadAusSegmenten(segmenteAusItinerary(eintrag.itinerary)))
  return `${ROUTE_FACTS_VERSION}|${teile.join(',')}`
}

export function pfadAusSegmenten(segmente: readonly RouteSegment[]): string {
  const punkte: string[] = []
  for (const [index, segment] of segmente.entries()) {
    if (index === 0) punkte.push(punktSchluessel(segment.origin))
    punkte.push(punktSchluessel(segment.destination))
  }
  return punkte.join('>')
}

function punktSchluessel(punkt: { airportCode: string | null; countryCode: string | null }): string {
  return `${iataLesen(punkt.airportCode) ?? ''}:${punkt.countryCode ?? ''}`
}
