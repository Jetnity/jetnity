// lib/route/fingerprint.ts
//
// Deterministischer Route-Fingerprint für Change- und Readiness-Stale.
// Leg-Grenzen, jeder Leg-Origin und Surface-/Airport-Change gehören zur Identität.
// Unbewiesene Segmentmengen werden als sortierte Multimenge serialisiert.
//
// Frei von Next und Providern.

import { itinerariesFuerWahrheit, segmenteOrdnungBewiesen } from '@/lib/route/chronologie'
import { ROUTE_FACTS_VERSION } from '@/lib/route/domain'
import type { RouteItineraryMitQuelle, RouteSegment } from '@/lib/route/domain'
import { pfadAusSegmenten } from '@/lib/route/pfad'

export function routeFingerprintAus(itineraries: readonly RouteItineraryMitQuelle[]): string | null {
  if (itineraries.length === 0) return null
  const teile = itinerariesFuerWahrheit(itineraries).flatMap((eintrag) =>
    eintrag.itinerary.legs.map((bein) => beinFingerprint(bein.segments)),
  )
  return `${ROUTE_FACTS_VERSION}|${teile.join('|')}`
}

function beinFingerprint(segmente: readonly RouteSegment[]): string {
  if (segmenteOrdnungBewiesen(segmente)) return pfadAusSegmenten(segmente)
  return [...segmente.map((segment) => pfadAusSegmenten([segment]))]
    .sort((a, b) => a.localeCompare(b))
    .join('&')
}
