// lib/route/chronologie.ts
//
// Belegte Route-Reihenfolge. Item-Daten zuerst, sonst Segmentdaten.
// Ohne beweisbare Chronologie keine Country-Truth aus lexikographischen Pfaden.

import type { FlugRouteItinerary, RouteItineraryMitQuelle } from '@/lib/route/domain'
import { pfadAusItinerary } from '@/lib/route/pfad'

function kalendertag(wert: string | null | undefined): string | null {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const datum = new Date(Date.UTC(jahr ?? 0, (monat ?? 0) - 1, tag ?? 0))
  if (
    datum.getUTCFullYear() !== jahr ||
    datum.getUTCMonth() !== (monat ?? 0) - 1 ||
    datum.getUTCDate() !== tag
  ) {
    return null
  }
  return wert
}

function uhrzeit(wert: string | null | undefined): string | null {
  return wert && /^\d{2}:\d{2}$/.test(wert) ? wert : null
}

function startAusSegmenten(itinerary: FlugRouteItinerary): string | null {
  const erstes = itinerary.legs[0]?.segments[0]
  const tag = kalendertag(erstes?.departureDate ?? null)
  if (!tag) return null
  return `${tag}T${uhrzeit(erstes?.departureTime ?? null) ?? '00:00'}`
}

export function itineraryStartBelegt(eintrag: {
  startsOn?: string | null
  startsAt?: string | null
  itinerary: FlugRouteItinerary
}): string | null {
  const itemTag = kalendertag(eintrag.startsOn ?? null)
  if (itemTag) return `${itemTag}T${uhrzeit(eintrag.startsAt ?? null) ?? '00:00'}`
  return startAusSegmenten(eintrag.itinerary)
}

export function routeChronologieBewiesen(
  itineraries: readonly { startsOn?: string | null; startsAt?: string | null; itinerary: FlugRouteItinerary }[],
): boolean {
  if (itineraries.length <= 1) return true
  return itineraries.every((eintrag) => itineraryStartBelegt(eintrag) !== null)
}

export function itinerariesSortieren<T extends RouteItineraryMitQuelle>(itineraries: readonly T[]): T[] {
  return [...itineraries].sort((a, b) => {
    const aStart = itineraryStartBelegt(a)
    const bStart = itineraryStartBelegt(b)
    if (aStart && bStart && aStart !== bStart) return aStart < bStart ? -1 : 1
    if (aStart && !bStart) return -1
    if (!aStart && bStart) return 1
    return pfadAusItinerary(a.itinerary).localeCompare(pfadAusItinerary(b.itinerary))
  })
}
