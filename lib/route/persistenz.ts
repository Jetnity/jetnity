// lib/route/persistenz.ts
//
// Ordnet eine validierte Itinerary einem gespeicherten Flug zu.
// Kein Raten über Titel allein, wenn Provider/Ref/Zeiten unterscheiden.
//
// Frei von Next und Providern.

import type { FlugRouteItinerary } from '@/lib/route/domain'
import { itineraryPasstInMetadata } from '@/lib/route/metadata'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import type { Trip } from '@/types/trips'

export type FlugRouteUebergabe = {
  title: string
  startsOn: string | null
  endsOn: string | null
  provider: string | null
  externalRef: string | null
  position: number
  dayIndex: number | null
  itinerary: FlugRouteItinerary
}

export function flugRoutenAusReise(reise: Trip): FlugRouteUebergabe[] {
  const uebergaben: FlugRouteUebergabe[] = []

  for (const tag of reise.days) {
    for (const punkt of tag.items) {
      if (punkt.kind !== 'flight') continue
      const itinerary = flugRouteItineraryLesen(punkt.routeItinerary ?? null)
      if (!itinerary || !itineraryPasstInMetadata(itinerary)) continue
      uebergaben.push({
        title: punkt.title,
        startsOn: punkt.startsOn,
        endsOn: punkt.endsOn,
        provider: punkt.provider,
        externalRef: punkt.externalRef,
        position: punkt.position,
        dayIndex: tag.dayIndex,
        itinerary,
      })
    }
  }

  for (const punkt of reise.ohneTag) {
    if (punkt.kind !== 'flight') continue
    const itinerary = flugRouteItineraryLesen(punkt.routeItinerary ?? null)
    if (!itinerary || !itineraryPasstInMetadata(itinerary)) continue
    uebergaben.push({
      title: punkt.title,
      startsOn: punkt.startsOn,
      endsOn: punkt.endsOn,
      provider: punkt.provider,
      externalRef: punkt.externalRef,
      position: punkt.position,
      dayIndex: null,
      itinerary,
    })
  }

  return uebergaben
}

export function flugRoutePasst(
  punkt: {
    title: string
    startsOn: string | null
    endsOn: string | null
    provider: string | null
    externalRef: string | null
    position: number
    dayIndex: number | null
  },
  uebergabe: FlugRouteUebergabe,
): boolean {
  return (
    punkt.title === uebergabe.title &&
    punkt.startsOn === uebergabe.startsOn &&
    punkt.endsOn === uebergabe.endsOn &&
    punkt.provider === uebergabe.provider &&
    punkt.externalRef === uebergabe.externalRef &&
    punkt.position === uebergabe.position &&
    punkt.dayIndex === uebergabe.dayIndex
  )
}

export function eindeutigeFlugRoute(
  punkt: Parameters<typeof flugRoutePasst>[0],
  uebergaben: readonly FlugRouteUebergabe[],
): FlugRouteUebergabe | null {
  const treffer = uebergaben.filter((eintrag) => flugRoutePasst(punkt, eintrag))
  return treffer.length === 1 ? (treffer[0] ?? null) : null
}
