// lib/route/schreiben.ts
//
// Schreibt validierte Flug-Itineraries nach trip_items.metadata.
// Nur Server. RLS bleibt Eigentümergrenze.

import 'server-only'

import { metadataAusItinerary } from '@/lib/route/metadata'
import { eindeutigeFlugRoute, type FlugRouteUebergabe } from '@/lib/route/persistenz'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import type { ReiseNutzlast } from '@/lib/trips/schema'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'

type SchreibenClient = SupabaseClient<Database>

function flugRoutenAusNutzlast(nutzlast: ReiseNutzlast): FlugRouteUebergabe[] {
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

export async function flugRoutenInReiseSchreiben(
  client: SchreibenClient,
  tripId: string,
  nutzlast: ReiseNutzlast,
): Promise<void> {
  const uebergaben = flugRoutenAusNutzlast(nutzlast)
  if (uebergaben.length === 0) return

  const { data: items, error } = await client
    .from('trip_items')
    .select('id, title, starts_on, ends_on, provider, external_ref, position, day_id, kind')
    .eq('trip_id', tripId)
    .eq('kind', 'flight')

  if (error || !items || items.length === 0) return

  const { data: tage } = await client.from('trip_days').select('id, day_index').eq('trip_id', tripId)
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
    await client
      .from('trip_items')
      .update({ metadata: metadataAusItinerary(treffer.itinerary) as Json })
      .eq('id', item.id)
      .eq('trip_id', tripId)
  }
}
