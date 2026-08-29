// app/api/search/places/route.ts
//
// Öffentliche Ortssuche gegen `public.places`.
// Kein Geocoding-Proxy, kein Schreibweg, keine Live-Abfrage gegen GeoNames.

import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese, type Lesung } from '@/lib/api/datenbank-lesen'
import { ORT_SPALTEN, type OrtZeile } from '@/lib/places/abbildung'
import { ORT_ROLLEN, type OrtRolle } from '@/lib/places/domain'
import { placesSuchen } from '@/lib/places/suche-lauf'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const LEER = NextResponse.json([], {
  headers: {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  },
})

function rolleAus(wert: string | null): OrtRolle {
  return wert === 'abreise' ? 'abreise' : ORT_ROLLEN[0]
}

function alsOrtZeilen(ergebnis: Lesung<unknown>): Lesung<OrtZeile> {
  if (ergebnis.problem) return ergebnis
  return { zeilen: ergebnis.zeilen as OrtZeile[], problem: null }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const raw = url.searchParams.get('q')?.trim() ?? ''
  if (!raw || raw.length < 2) return LEER

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    return problemAntwort({
      status: 503,
      message: 'Die Ortssuche ist gerade nicht erreichbar.',
    })
  }

  const rolle = rolleAus(url.searchParams.get('rolle'))
  const client = await createRouteHandlerClient()
  const ergebnis = await placesSuchen(raw, rolle, async (art, filter, limit) => {
    if (art === 'land') {
      return alsOrtZeilen(
        await lese(() =>
          client.from('places').select(ORT_SPALTEN).eq('typ', 'country').or(filter).limit(limit),
        ),
      )
    }
    if (art === 'abreise-flughafen') {
      return alsOrtZeilen(
        await lese(() =>
          client.from('places').select(ORT_SPALTEN).eq('typ', 'airport').or(filter).limit(limit),
        ),
      )
    }
    return alsOrtZeilen(
      await lese(() => client.from('places').select(ORT_SPALTEN).or(filter).limit(limit)),
    )
  })

  if (ergebnis.problem) return problemAntwort(ergebnis.problem)

  return NextResponse.json(ergebnis.optionen, {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
