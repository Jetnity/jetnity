// lib/route/laender.ts
//
// Kanonische Länderrollen. Nur innerhalb eines belegten Legs.
// Spätere Leg-Ursprünge sind belegte Besuche, solange sie nicht das bewiesene
// Reise-Origin sind. Transit bleibt ein Zwischenpunkt im selben Leg.

import { landescodeLesen } from '@/lib/readiness/domain'
import { itinerariesFuerWahrheit, routeChronologieBewiesen } from '@/lib/route/chronologie'
import type { FlugRouteItinerary } from '@/lib/route/domain'

export type RouteLaenderrollen = {
  transitCountryCodes: string[]
  destinationCountryCodes: string[]
}

export type RouteItineraryFuerRollen = {
  itinerary: FlugRouteItinerary
  startsOn?: string | null
  startsAt?: string | null
}

export function laenderrollenAus(
  itineraries: readonly RouteItineraryFuerRollen[],
): RouteLaenderrollen {
  const wahrheit = itinerariesFuerWahrheit(itineraries)
  return {
    transitCountryCodes: transitlaenderAus(wahrheit),
    destinationCountryCodes: ziellaenderAus(wahrheit),
  }
}

function transitlaenderAus(itineraries: readonly RouteItineraryFuerRollen[]): string[] {
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

function ziellaenderAus(itineraries: readonly RouteItineraryFuerRollen[]): string[] {
  const ursprung = ursprungslandAus(itineraries)
  const laender: string[] = []
  for (const eintrag of itineraries) {
    for (const bein of eintrag.itinerary.legs) {
      const segmente = bein.segments
      const start = landescodeLesen(segmente[0]?.origin.countryCode ?? null)
      const ende = landescodeLesen(segmente[segmente.length - 1]?.destination.countryCode ?? null)
      if (start && start !== ursprung) merken(laender, start)
      if (ende && ende !== ursprung) merken(laender, ende)
      for (let index = 1; index < segmente.length; index += 1) {
        const vorher = landescodeLesen(segmente[index - 1]?.destination.countryCode ?? null)
        const weiter = landescodeLesen(segmente[index]?.origin.countryCode ?? null)
        if (weiter && weiter !== ursprung && weiter !== vorher) merken(laender, weiter)
      }
    }
  }
  return laender
}

function ursprungslandAus(itineraries: readonly RouteItineraryFuerRollen[]): string | null {
  if (!routeChronologieBewiesen(itineraries)) return null
  const start = itineraries[0]?.itinerary.legs[0]?.segments[0]?.origin.countryCode ?? null
  return landescodeLesen(start)
}

function merken(laender: string[], code: string | null): void {
  const gelesen = landescodeLesen(code)
  if (gelesen && !laender.includes(gelesen)) laender.push(gelesen)
}
