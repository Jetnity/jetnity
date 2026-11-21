// app/api/search/airports/route.ts
//
// Öffentliche Flughafensuche gegen `public.airports`.
// Kein externer Provider, keine Live-Abfrage, kein Schreibweg.

import { tripServicesOrigin } from '@/lib/maps/config'
import { istPosition } from '@/lib/maps/reisekarte'
import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { FLUGHAFEN_ABFRAGE, flughaefenOrdnen, sucheFilter } from '@/lib/airports/suche'
import { flughafenLaender } from '@/lib/airports/laendersuche'
import { naechsterFlughafen, suchfenster } from '@/lib/airports/naechster'
import { istOrtId } from '@/lib/places/domain'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const LEER = NextResponse.json([], {
  headers: {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  },
})

function orFilter(teile: string[]): string {
  const felder = ['iata', 'icao', 'name', 'city', 'region', 'keywords', 'country']
  return teile
    .flatMap((teil) => felder.map((feld) => `${feld}.ilike.%${teil}%`))
    .join(',')
}

const OHNE_SPEICHER = { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' }

/** Nächster großer Flughafen zu einem Katalogort. `vorschlag: null` heißt: keiner im Radius. */
async function naechsterZuOrt(ortId: string): Promise<Response> {
  if (!istOrtId(ortId)) return new Response(null, { status: 404 })
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return problemAntwort({ status: 503, message: 'Die Flughafensuche ist gerade nicht erreichbar.' })
  }
  const client = await createRouteHandlerClient()
  const ort = await lese(() => client.from('places').select('lat, lon').eq('id', ortId).limit(1))
  if (ort.problem) return problemAntwort(ort.problem)
  const zeile = ort.zeilen[0]
  if (!zeile) return new Response(null, { status: 404 })
  if (typeof zeile.lat !== 'number' || typeof zeile.lon !== 'number') {
    return NextResponse.json({ vorschlag: null }, { headers: OHNE_SPEICHER })
  }
  const position = { lat: zeile.lat, lon: zeile.lon }
  const fenster = suchfenster(position)
  const flughaefen = await lese(() => {
    const abfrage = client
      .from('airports')
      .select('iata, name, klasse, lat, lon')
      .eq('klasse', 'large')
      .not('iata', 'is', null)
      .gte('lat', fenster.lat.min)
      .lte('lat', fenster.lat.max)
    return (fenster.lon ? abfrage.gte('lon', fenster.lon.min).lte('lon', fenster.lon.max) : abfrage).limit(200)
  })
  if (flughaefen.problem) return problemAntwort(flughaefen.problem)
  return NextResponse.json({ vorschlag: naechsterFlughafen(position, flughaefen.zeilen) }, { headers: OHNE_SPEICHER })
}

export async function GET(req: Request) {
  const naechster = new URL(req.url).searchParams.get('naechster')
  if (naechster !== null) return naechsterZuOrt(naechster.trim())
  const code = new URL(req.url).searchParams.get('position')
  if (code !== null) {
    if (new URL(req.url).origin !== tripServicesOrigin(process.env) || !/^[A-Z]{3}$/.test(code)) return new Response(null, { status: 404 })
    const db = await createRouteHandlerClient()
    const { data, error } = await db.from('airports').select('name,lat,lon').eq('iata', code).maybeSingle()
    const position = data && { lat: data.lat, lng: data.lon }
    if (error || !data || !istPosition(position)) return new Response(null, { status: error ? 503 : 404 })
    return NextResponse.json({ name: data.name, position }, { headers: { 'Cache-Control': 'private, no-store' } })
  }
  const raw = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (!raw) return LEER

  const istIata = /^[a-z]{3}$/i.test(raw)
  if (!istIata && raw.length < 2) return LEER

  const teile = sucheFilter(raw)
  if (teile.length === 0) return LEER

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    return problemAntwort({
      status: 503,
      message: 'Die Flughafensuche ist gerade nicht erreichbar.',
    })
  }

  const client = await createRouteHandlerClient()
  const laender = flughafenLaender(raw)
  const filter = [orFilter(teile), ...laender.map(code => `country_code.eq.${code}`)].join(',')
  const gelesen = await lese(() =>
    client
      .from('airports')
      .select('iata, icao, name, city, region, country, country_code, keywords, klasse')
      .or(filter)
      .not('iata', 'is', null)
      .order('klasse', { ascending: true, nullsFirst: false })
      .order('iata')
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
