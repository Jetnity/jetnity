// app/(public)/api/search/airports/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* ----------------------------- Types & helpers ----------------------------- */

type AirportRow = {
  iata: string | null
  icao: string | null
  name: string
  city: string | null
  country: string | null
  lat?: number | null
  lon?: number | null
}

type Option = { label: string; value: string; description?: string }

type AmadeusTokenResponse = {
  access_token: string
  expires_in: number
}

type AmadeusLocation = {
  type: 'location'
  subType: 'AIRPORT' | 'CITY'
  name: string
  iataCode?: string
  address?: {
    cityName?: string
    cityCode?: string
    countryName?: string
  }
}


/* -------------------------------- Amadeus --------------------------------- */

const AMADEUS_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_SECRET = process.env.AMADEUS_API_SECRET
const AMADEUS_BASE =
  process.env.AMADEUS_ENV === 'prod' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com'

let token: string | null = null
let tokenExp = 0

async function getAmadeusToken(): Promise<string> {
  const now = Date.now()
  if (token && now < tokenExp - 10_000) return token

  const resp = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_KEY!,
      client_secret: AMADEUS_SECRET!,
    }),
    cache: 'no-store',
  })
  if (!resp.ok) throw new Error('Amadeus auth failed')
  const json = (await resp.json()) as AmadeusTokenResponse
  token = json.access_token
  tokenExp = Date.now() + (json.expires_in ?? 0) * 1000
  return token!
}

/* --------------------------------- Mapping -------------------------------- */

function mapLocalRow(r: AirportRow): Option {
  const code = r.iata || r.icao || ''
  const label = `${code ? `${code} — ` : ''}${r.name}${r.city ? `, ${r.city}` : ''}`
  const description = r.country ?? undefined
  return { label, value: code || r.name, description }
}

function mapAmadeus(loc: AmadeusLocation): Option {
  const code = loc.iataCode ?? loc.address?.cityCode ?? ''
  const city = loc.address?.cityName ?? loc.name
  const name = loc.name
  const country = loc.address?.countryName

  return {
    label: `${code ? `${code} — ` : ''}${name}${city ? `, ${city}` : ''}`,
    value: code || name,
    description: country ?? undefined,
  }
}

/* --------------------------------- Handler -------------------------------- */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get('q') || '').trim()
  if (!raw) {
    return NextResponse.json([], {
      headers: {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
      },
    })
  }

  const q = raw.toLowerCase()
  const isIataLike = /^[a-z]{3}$/i.test(raw)
  if (!isIataLike && q.length < 2) {
    return NextResponse.json([], {
      headers: {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
      },
    })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  const read = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  // 1) Schnell: lokale DB
  const like = `%${q}%`
  const { data: rows, error } = await read
    .from('airports')
    .select('iata, icao, name, city, country')
    .or(
      `iata.ilike.${like},icao.ilike.${like},name.ilike.${like},city.ilike.${like},country.ilike.${like}`
    )
    .limit(40)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Ranking lokal
  const up = raw.toUpperCase()
  const scored = (rows ?? []).map((r: AirportRow) => {
    let s = 0
    if (r.iata && r.iata.toUpperCase() === up) s += 1000
    if (r.icao && r.icao.toUpperCase() === up) s += 900
    if (r.iata && r.iata.toUpperCase().startsWith(up)) s += 500
    if (r.icao && r.icao.toUpperCase().startsWith(up)) s += 400
    if (r.name?.toLowerCase().startsWith(q)) s += 220
    if (r.city?.toLowerCase().startsWith(q)) s += 200
    if (r.name?.toLowerCase().includes(q)) s += 120
    if (r.city?.toLowerCase().includes(q)) s += 100
    if (r.country?.toLowerCase().includes(q)) s += 20
    return { r, s }
  })
  scored.sort((a, b) => b.s - a.s)

  const optionsLocal: Option[] = scored.map(({ r }) => mapLocalRow(r)).slice(0, 12)

  let options: Option[] = [...optionsLocal]

  // 2) Wenige Treffer? → optionaler Amadeus-Fallback
  const shouldUseAmadeus = options.length < 5 && AMADEUS_KEY && AMADEUS_SECRET
  if (shouldUseAmadeus) {
    try {
      const t = await getAmadeusToken()
      const url = new URL(`${AMADEUS_BASE}/v1/reference-data/locations`)
      url.searchParams.set('keyword', raw)
      url.searchParams.set('subType', 'AIRPORT,CITY')
      url.searchParams.set('page[limit]', '10')

      const resp = await fetch(url, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      if (resp.ok) {
        const json = (await resp.json()) as { data?: AmadeusLocation[] }
        const mapped = (json.data ?? []).map(mapAmadeus)

        // De-dupe über value
        const seen = new Set<string>(options.map((o) => o.value))
        for (const treffer of mapped) {
          if (!seen.has(treffer.value)) {
            options.push(treffer)
            seen.add(treffer.value)
          }
        }
      }
    } catch {
      // Fallback leise ignorieren
    }
  }

  // Antwort mit korrektem UTF-8 Header (Safari)
  return NextResponse.json(options.slice(0, 12), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

export const dynamic = 'force-dynamic'
