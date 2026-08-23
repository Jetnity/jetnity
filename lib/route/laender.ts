// lib/route/laender.ts
//
// Kanonische Länderrollen. Nur innerhalb eines belegten Legs.
// Das letzte Segmentziel eines Legs ist kein Transit.
// Das globale Origin-/Rückkehrland wird nicht allein durch ein Rück-Leg zum Reiseziel.

import { landescodeLesen } from '@/lib/readiness/domain'
import type { FlugRouteItinerary } from '@/lib/route/domain'

export type RouteLaenderrollen = {
  transitCountryCodes: string[]
  destinationCountryCodes: string[]
}

export function laenderrollenAus(
  itineraries: readonly { itinerary: FlugRouteItinerary }[],
): RouteLaenderrollen {
  return {
    transitCountryCodes: transitlaenderAus(itineraries),
    destinationCountryCodes: ziellaenderAus(itineraries),
  }
}

function transitlaenderAus(itineraries: readonly { itinerary: FlugRouteItinerary }[]): string[] {
  const laender: string[] = []
  for (const eintrag of itineraries) {
    for (const bein of eintrag.itinerary.legs) {
      const segmente = bein.segments
      for (const [index, segment] of segmente.entries()) {
        if (index === segmente.length - 1) continue
        merken(laender, segment.destination.countryCode)
      }
    }
  }
  return laender
}

function ziellaenderAus(itineraries: readonly { itinerary: FlugRouteItinerary }[]): string[] {
  const ursprung = ursprungslandAus(itineraries)
  const laender: string[] = []
  for (const eintrag of itineraries) {
    for (const bein of eintrag.itinerary.legs) {
      const segmente = bein.segments
      const ende = landescodeLesen(segmente[segmente.length - 1]?.destination.countryCode ?? null)
      if (ende && ende !== ursprung) merken(laender, ende)
    }
  }
  return laender
}

function ursprungslandAus(itineraries: readonly { itinerary: FlugRouteItinerary }[]): string | null {
  const erstes = itineraries[0]
  const start = erstes?.itinerary.legs[0]?.segments[0]?.origin.countryCode ?? null
  return landescodeLesen(start)
}

function merken(laender: string[], code: string | null): void {
  const gelesen = landescodeLesen(code)
  if (gelesen && !laender.includes(gelesen)) laender.push(gelesen)
}
