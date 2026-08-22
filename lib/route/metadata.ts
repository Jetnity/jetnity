// lib/route/metadata.ts
//
// trip_items.metadata trägt ausschliesslich die validierte Flug-Itinerary.
// Kein allgemeiner Jutesack.
//
// Frei von Next und Providern.

import type { FlugRouteItinerary } from '@/lib/route/domain'
import { flugRouteItineraryLesen } from '@/lib/route/schema'

export const ROUTE_METADATA_SCHLUESSEL = 'routeItinerary' as const
export const ROUTE_METADATA_MAX = 8192

export type RouteMetadata = {
  [ROUTE_METADATA_SCHLUESSEL]: FlugRouteItinerary
}

export function itineraryAusMetadata(wert: unknown): FlugRouteItinerary | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const eintrag = (wert as Record<string, unknown>)[ROUTE_METADATA_SCHLUESSEL]
  return flugRouteItineraryLesen(eintrag)
}

export function metadataAusItinerary(itinerary: FlugRouteItinerary | null): RouteMetadata | Record<string, never> {
  if (!itinerary) return {}
  const huelle = { [ROUTE_METADATA_SCHLUESSEL]: itinerary }
  if (JSON.stringify(huelle).length > ROUTE_METADATA_MAX) return {}
  return huelle
}

export function itineraryPasstInMetadata(itinerary: FlugRouteItinerary): boolean {
  return JSON.stringify({ [ROUTE_METADATA_SCHLUESSEL]: itinerary }).length <= ROUTE_METADATA_MAX
}
