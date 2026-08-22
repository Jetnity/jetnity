// lib/route/schreiben.ts
//
// Supabase-Adapter für den fail-closed Routen-Nachzug.
// Nur Server. RLS bleibt Eigentümergrenze.

import 'server-only'

import { flugRoutenNachziehen, type RouteSchreibClient } from '@/lib/route/nachziehen'
import type { ReiseNutzlast } from '@/lib/trips/schema'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'

export {
  ROUTE_UEBERNAHME_UNVOLLSTAENDIG,
  type RouteSchreibErgebnis,
} from '@/lib/route/nachziehen'

type SchreibenClient = SupabaseClient<Database>

function alsRouteClient(client: SchreibenClient): RouteSchreibClient {
  return {
    async flugItemsLesen(tripId) {
      const { data, error } = await client
        .from('trip_items')
        .select('id, title, starts_on, ends_on, provider, external_ref, position, day_id, kind, metadata')
        .eq('trip_id', tripId)
        .eq('kind', 'flight')
      return { data, error }
    },
    async tageLesen(tripId) {
      const { data, error } = await client
        .from('trip_days')
        .select('id, day_index')
        .eq('trip_id', tripId)
      return { data, error }
    },
    async metadataSchreiben(tripId, itemId, metadata) {
      const { error } = await client
        .from('trip_items')
        .update({ metadata: metadata as Json })
        .eq('id', itemId)
        .eq('trip_id', tripId)
      return { error }
    },
  }
}

export async function flugRoutenInReiseSchreiben(
  client: SchreibenClient,
  tripId: string,
  nutzlast: ReiseNutzlast,
) {
  return flugRoutenNachziehen(alsRouteClient(client), tripId, nutzlast)
}
