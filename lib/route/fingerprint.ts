// lib/route/fingerprint.ts
//
// Deterministischer Route-Fingerprint für Change- und Readiness-Stale.
// Leg-Grenzen und jeder Leg-Origin gehören zur Identität.
//
// Frei von Next und Providern.

import { itinerariesSortieren } from '@/lib/route/chronologie'
import { ROUTE_FACTS_VERSION } from '@/lib/route/domain'
import type { RouteItineraryMitQuelle } from '@/lib/route/domain'
import { pfadAusSegmenten } from '@/lib/route/pfad'

export function routeFingerprintAus(itineraries: readonly RouteItineraryMitQuelle[]): string | null {
  if (itineraries.length === 0) return null
  const teile = itinerariesSortieren(itineraries).flatMap((eintrag) =>
    eintrag.itinerary.legs.map((bein) => pfadAusSegmenten(bein.segments)),
  )
  return `${ROUTE_FACTS_VERSION}|${teile.join('|')}`
}
