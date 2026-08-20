// lib/places/kanon.ts
//
// Hängt einen aufgelösten Ort an Reise oder Vorschlag.
// Der Anzeigetext bleibt; nur die kanonische Referenz und Koordinaten kommen
// aus public.places.

import type { Ort } from '@/lib/places/domain'
import type { Modellort } from '@/lib/places/aufloesen'
import type { Reisegraph, TripStage } from '@/types/trips'

export type KanonischeOrte = {
  origin: Ort | null
  stages: Array<Ort | null>
}

export function hinweiseAusTexten(eingabe: {
  origin?: string | null
  stages: { name: string; countryCode?: string | null }[]
}): { origin: Modellort; stages: Modellort[] } {
  return {
    origin: { name: eingabe.origin ?? null, countryCode: null, rolle: 'abreise' },
    stages: eingabe.stages.map((etappe) => ({
      name: etappe.name,
      countryCode: etappe.countryCode ?? null,
      rolle: 'ziel',
    })),
  }
}

export function etappeMitOrt<T extends Pick<TripStage, 'placeId' | 'latitude' | 'longitude'>>(
  etappe: T,
  ort: Ort | null,
): T {
  if (!ort) {
    return { ...etappe, placeId: null, latitude: null, longitude: null }
  }
  return {
    ...etappe,
    placeId: ort.id,
    latitude: ort.lat,
    longitude: ort.lon,
  }
}

export function reiseMitKanonischenOrten(reise: Reisegraph, orte: KanonischeOrte): Reisegraph {
  return {
    ...reise,
    originPlaceId: orte.origin?.id ?? null,
    stages: reise.stages.map((etappe, stelle) => etappeMitOrt(etappe, orte.stages[stelle] ?? null)),
  }
}
