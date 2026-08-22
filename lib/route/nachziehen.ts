// lib/route/nachziehen.ts
//
// Fail-closed Nachzug einer eindeutig zugeordneten Flug-Itinerary.
// Die RPC schreibt atomar; dieser Schritt stellt Recovery und Nachweis her.
//
// Frei von Next und Providern.

import { itineraryAusMetadata, metadataAusItinerary } from '@/lib/route/metadata'
import { eindeutigeFlugRoute, type FlugRouteUebergabe } from '@/lib/route/persistenz'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import type { ReiseNutzlast } from '@/lib/trips/schema'

export const ROUTE_UEBERNAHME_UNVOLLSTAENDIG =
  'Die Reise liegt im Konto, aber die Flugroute konnte nicht übernommen werden. Bitte versuche es erneut – es entsteht keine zweite Reise.'

export type RouteSchreibErgebnis =
  | { ok: true }
  | { ok: false; grund: 'lesen' | 'schreiben' | 'unvollstaendig' }

export type RouteFlugItem = {
  id: string
  title: string
  starts_on: string | null
  ends_on: string | null
  provider: string | null
  external_ref: string | null
  position: number
  day_id: string | null
  metadata: unknown
}

export type RouteSchreibClient = {
  flugItemsLesen(
    tripId: string,
  ): Promise<{ data: RouteFlugItem[] | null; error: { message: string } | null }>
  tageLesen(
    tripId: string,
  ): Promise<{ data: { id: string; day_index: number }[] | null; error: { message: string } | null }>
  metadataSchreiben(
    tripId: string,
    itemId: string,
    metadata: ReturnType<typeof metadataAusItinerary>,
  ): Promise<{ error: { message: string } | null }>
}

export function flugRoutenAusNutzlast(nutzlast: ReiseNutzlast): FlugRouteUebergabe[] {
  const uebergaben: FlugRouteUebergabe[] = []

  for (const tag of nutzlast.days) {
    for (const punkt of tag.items) {
      if (punkt.kind !== 'flight') continue
      const itinerary = flugRouteItineraryLesen(punkt.route_itinerary ?? null)
      if (!itinerary) continue
      uebergaben.push({
        title: punkt.title,
        startsOn: punkt.starts_on,
        endsOn: punkt.ends_on,
        provider: punkt.provider,
        externalRef: punkt.external_ref,
        position: punkt.position,
        dayIndex: tag.day_index,
        itinerary,
      })
    }
  }

  for (const punkt of nutzlast.ungeplante) {
    if (punkt.kind !== 'flight') continue
    const itinerary = flugRouteItineraryLesen(punkt.route_itinerary ?? null)
    if (!itinerary) continue
    uebergaben.push({
      title: punkt.title,
      startsOn: punkt.starts_on,
      endsOn: punkt.ends_on,
      provider: punkt.provider,
      externalRef: punkt.external_ref,
      position: punkt.position,
      dayIndex: null,
      itinerary,
    })
  }

  return uebergaben
}

function itineraryGleich(
  links: ReturnType<typeof itineraryAusMetadata>,
  rechts: FlugRouteUebergabe['itinerary'],
): boolean {
  return JSON.stringify(links) === JSON.stringify(rechts)
}

export async function flugRoutenNachziehen(
  client: RouteSchreibClient,
  tripId: string,
  nutzlast: ReiseNutzlast,
): Promise<RouteSchreibErgebnis> {
  const uebergaben = flugRoutenAusNutzlast(nutzlast)
  if (uebergaben.length === 0) return { ok: true }

  const { data: items, error } = await client.flugItemsLesen(tripId)
  if (error || !items) return { ok: false, grund: 'lesen' }
  if (items.length === 0) return { ok: false, grund: 'unvollstaendig' }

  const { data: tage, error: tagFehler } = await client.tageLesen(tripId)
  if (tagFehler) return { ok: false, grund: 'lesen' }
  const tagIndex = new Map((tage ?? []).map((tag) => [tag.id, tag.day_index]))

  for (const item of items) {
    const kandidat = {
      title: item.title,
      startsOn: item.starts_on,
      endsOn: item.ends_on,
      provider: item.provider,
      externalRef: item.external_ref,
      position: item.position,
      dayIndex: item.day_id ? (tagIndex.get(item.day_id) ?? null) : null,
    }
    const treffer = eindeutigeFlugRoute(kandidat, uebergaben)
    if (!treffer) continue
    if (itineraryGleich(itineraryAusMetadata(item.metadata), treffer.itinerary)) continue

    const { error: schreibFehler } = await client.metadataSchreiben(
      tripId,
      item.id,
      metadataAusItinerary(treffer.itinerary),
    )
    if (schreibFehler) return { ok: false, grund: 'schreiben' }
    item.metadata = metadataAusItinerary(treffer.itinerary)
  }

  for (const item of items) {
    const kandidat = {
      title: item.title,
      startsOn: item.starts_on,
      endsOn: item.ends_on,
      provider: item.provider,
      externalRef: item.external_ref,
      position: item.position,
      dayIndex: item.day_id ? (tagIndex.get(item.day_id) ?? null) : null,
    }
    const treffer = eindeutigeFlugRoute(kandidat, uebergaben)
    if (!treffer) continue
    if (!itineraryGleich(itineraryAusMetadata(item.metadata), treffer.itinerary)) {
      return { ok: false, grund: 'unvollstaendig' }
    }
  }

  return { ok: true }
}
