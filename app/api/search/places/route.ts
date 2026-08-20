// app/api/search/places/route.ts
//
// Öffentliche Ortssuche gegen `public.places`.
// Kein Geocoding-Proxy, kein Schreibweg, keine Live-Abfrage gegen GeoNames.

import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { ORT_ROLLEN, type OrtRolle } from '@/lib/places/domain'
import { ORT_SPALTEN, ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import { ORT_ABFRAGE, orteOrdnen, sucheFilter } from '@/lib/places/suche'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const LEER = NextResponse.json([], {
  headers: {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  },
})

function orFilter(teile: string[]): string {
  const felder = ['name', 'keywords', 'region', 'country', 'iata']
  return teile
    .flatMap((teil) => felder.map((feld) => `${feld}.ilike.%${teil}%`))
    .join(',')
}

function rolleAus(wert: string | null): OrtRolle {
  return wert === 'abreise' ? 'abreise' : ORT_ROLLEN[0]
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const raw = url.searchParams.get('q')?.trim() ?? ''
  if (!raw || raw.length < 2) return LEER

  const teile = sucheFilter(raw)
  if (teile.length === 0) return LEER

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    return problemAntwort({
      status: 503,
      message: 'Die Ortssuche ist gerade nicht erreichbar.',
    })
  }

  const rolle = rolleAus(url.searchParams.get('rolle'))
  const gelesen = await lese(() =>
    createRouteHandlerClient()
      .from('places')
      .select(ORT_SPALTEN)
      .or(orFilter(teile))
      .limit(ORT_ABFRAGE),
  )

  if (gelesen.problem) return problemAntwort(gelesen.problem)

  const orte = gelesen.zeilen
    .map((zeile) => ortAusZeile(zeile as OrtZeile))
    .filter((ort): ort is NonNullable<typeof ort> => Boolean(ort))

  return NextResponse.json(orteOrdnen(orte, raw, rolle), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
