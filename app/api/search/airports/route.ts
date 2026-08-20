// app/api/search/airports/route.ts
//
// Öffentliche Flughafensuche gegen `public.airports`.
// Kein externer Provider, keine Credentials, kein Schreibweg.

import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { FLUGHAFEN_ABFRAGE, flughaefenOrdnen } from '@/lib/airports/suche'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const LEER = NextResponse.json([], {
  headers: {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  },
})

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (!raw) return LEER

  const istIata = /^[a-z]{3}$/i.test(raw)
  if (!istIata && raw.length < 2) return LEER

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    return problemAntwort({
      status: 503,
      message: 'Die Flughafensuche ist gerade nicht erreichbar.',
    })
  }

  const like = `%${raw.toLowerCase()}%`
  const gelesen = await lese(() =>
    createRouteHandlerClient()
      .from('airports')
      .select('iata, icao, name, city, country')
      .or(`iata.ilike.${like},icao.ilike.${like},name.ilike.${like},city.ilike.${like},country.ilike.${like}`)
      .limit(FLUGHAFEN_ABFRAGE),
  )

  if (gelesen.problem) return problemAntwort(gelesen.problem)

  return NextResponse.json(flughaefenOrdnen(gelesen.zeilen, raw), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
