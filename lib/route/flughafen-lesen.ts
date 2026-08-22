// lib/route/flughafen-lesen.ts
//
// Serverseitige IATA-Auflösung gegen public.airports. Ein Batch, kein N+1.
//
// Nur Server.

import 'server-only'

import { createServerActionClient } from '@/lib/supabase/server'
import type { FlughafenReferenzKarte } from '@/lib/route/domain'
import { iataLesen, referenzKarteAus } from '@/lib/route/referenz'

export { iatasAusOption } from '@/lib/route/referenz'

export async function flughafenReferenzLesen(
  codes: readonly string[],
  client = createServerActionClient(),
): Promise<FlughafenReferenzKarte> {
  const iatas = [...new Set(codes.map((code) => iataLesen(code)).filter((code): code is string => Boolean(code)))]
  if (iatas.length === 0) return {}

  const { data, error } = await client
    .from('airports')
    .select('iata, country_code, city, country, name')
    .in('iata', iatas)

  if (error || !data) return {}
  return referenzKarteAus(data)
}
