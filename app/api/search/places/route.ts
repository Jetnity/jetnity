// app/api/search/places/route.ts
//
// Öffentliche Ortssuche gegen `public.places`.
// Kein Geocoding-Proxy, kein Schreibweg, keine Live-Abfrage gegen GeoNames.

import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { ORT_ROLLEN, type OrtRolle } from '@/lib/places/domain'
import { ORT_SPALTEN, ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import {
  ORT_ABFRAGE,
  orteOrdnen,
  ortNamensfilter,
  ortSchluesselfilter,
  schluesselErgaenzungNoetig,
} from '@/lib/places/suche'
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

export async function GET(req: Request) {
  const url = new URL(req.url)
  const raw = url.searchParams.get('q')?.trim() ?? ''
  if (!raw || raw.length < 2) return LEER

  const namensfilter = ortNamensfilter(raw)
  if (!namensfilter) return LEER

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
  const namen = await lese(() =>
    client.from('places').select(ORT_SPALTEN).or(namensfilter).limit(ORT_ABFRAGE),
  )
  if (namen.problem) return problemAntwort(namen.problem)

  const zeilen = [...namen.zeilen]
  const ids = new Set(zeilen.map((zeile) => (zeile as OrtZeile).id))

  if (rolle === 'abreise') {
    const fluege = await lese(() =>
      client.from('places').select(ORT_SPALTEN).eq('typ', 'airport').or(namensfilter).limit(12),
    )
    if (fluege.problem) return problemAntwort(fluege.problem)
    for (const zeile of fluege.zeilen) {
      const id = (zeile as OrtZeile).id
      if (typeof id === 'string' && !ids.has(id)) {
        ids.add(id)
        zeilen.push(zeile)
      }
    }
  }

  const orteAus = (menge: typeof zeilen) =>
    menge
      .map((zeile) => ortAusZeile(zeile as OrtZeile))
      .filter((ort): ort is NonNullable<typeof ort> => Boolean(ort))

  let orte = orteAus(zeilen)

  if (schluesselErgaenzungNoetig(orte, raw, rolle)) {
    const schluessel = ortSchluesselfilter(raw)
    if (schluessel) {
      const extra = await lese(() =>
        client.from('places').select(ORT_SPALTEN).or(schluessel).limit(ORT_ABFRAGE),
      )
      if (extra.problem) return problemAntwort(extra.problem)
      for (const zeile of extra.zeilen) {
        const id = (zeile as OrtZeile).id
        if (typeof id === 'string' && !ids.has(id)) {
          ids.add(id)
          zeilen.push(zeile)
        }
      }
      orte = orteAus(zeilen)
    }
  }

  return NextResponse.json(orteOrdnen(orte, raw, rolle), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
