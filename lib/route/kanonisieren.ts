// lib/route/kanonisieren.ts
//
// Browser-/Local-Storage-Itinerary ist Input, nicht Country-Truth.
// Account-Route-Punkte entstehen nur aus IATA + serverseitiger Airport-Referenz.
//
// Frei von Next, Supabase und `process.env`.

import type { FlughafenReferenzKarte } from '@/lib/route/domain'
import { itineraryKanonisieren } from '@/lib/route/itinerary'
import { iatasAusItinerary } from '@/lib/route/referenz'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import type { ReiseNutzlast } from '@/lib/trips/schema'

type NutzlastPunkt = ReiseNutzlast['ungeplante'][number]

export function iatasAusNutzlast(nutzlast: ReiseNutzlast): string[] {
  const codes: string[] = []
  for (const punkt of nutzlastFlugpunkte(nutzlast)) {
    const itinerary = flugRouteItineraryLesen(punkt.route_itinerary ?? null)
    if (!itinerary) continue
    codes.push(...iatasAusItinerary(itinerary))
  }
  return [...new Set(codes)]
}

export function reiseNutzlastRouteKanonisieren(
  nutzlast: ReiseNutzlast,
  refs: FlughafenReferenzKarte,
): ReiseNutzlast {
  return {
    ...nutzlast,
    days: nutzlast.days.map((tag) => ({
      ...tag,
      items: tag.items.map((punkt) => punktKanonisieren(punkt, refs)),
    })),
    ungeplante: nutzlast.ungeplante.map((punkt) => punktKanonisieren(punkt, refs)),
  }
}

function nutzlastFlugpunkte(nutzlast: ReiseNutzlast): NutzlastPunkt[] {
  return [...nutzlast.days.flatMap((tag) => tag.items), ...nutzlast.ungeplante].filter(
    (punkt) => punkt.kind === 'flight',
  )
}

function punktKanonisieren(punkt: NutzlastPunkt, refs: FlughafenReferenzKarte): NutzlastPunkt {
  if (punkt.kind !== 'flight') return punkt
  const gelesen = flugRouteItineraryLesen(punkt.route_itinerary ?? null)
  if (!gelesen) return { ...punkt, route_itinerary: null }
  return { ...punkt, route_itinerary: itineraryKanonisieren(gelesen, refs) }
}
