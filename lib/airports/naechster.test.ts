import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FLUGHAFEN_VORSCHLAG_RADIUS_KM, naechsterFlughafen, suchfenster, type FlughafenKoordinatenZeile } from './naechster'

// Ausschnitt aus `public.airports` (Dev, OurAirports-Import), gerundet.
const Z = (iata: string | null, name: string, klasse: string | null, lat: number, lon: number): FlughafenKoordinatenZeile => ({ iata, name, klasse, lat, lon })
const AIRPORTS = [
  Z('LIS', 'Humberto Delgado Airport', 'large', 38.7813, -9.1359),
  Z('CAT', 'Cascais Municipal Aerodrome', 'medium', 38.725, -9.3552),
  Z('BYJ', 'Beja Airport', 'medium', 38.0789, -7.9324),
  Z('OPO', 'Francisco de Sá Carneiro Airport', 'large', 41.2481, -8.6814),
  Z('MAD', 'Adolfo Suárez Madrid–Barajas Airport', 'large', 40.4719, -3.5626),
  Z('TOJ', 'Madrid–Torrejón Airport', 'medium', 40.4967, -3.4458),
  Z('LUG', 'Lugano Airport', 'medium', 46.004, 8.9106),
  Z('MXP', 'Malpensa International Airport', 'large', 45.6306, 8.7231),
  Z('TDX', 'Trat Airport', 'medium', 12.2746, 102.319),
  Z('L1S', 'Ungültig', 'large', 38.72, -9.14),
  Z(null, 'Ohne Code', 'large', 38.72, -9.14),
  Z('NUL', 'Ohne Koordinaten', 'large', null as unknown as number, -9.14),
]

test('Ziel bekommt den nächsten großen Flughafen, nie einen näheren Platz ohne Linienklasse', () => {
  assert.deepEqual(naechsterFlughafen({ lat: 38.72, lon: -9.14 }, AIRPORTS), { iata: 'LIS', name: 'Humberto Delgado Airport · LIS', km: 7 })
  // Sintra: Cascais (medium) liegt näher, vorgeschlagen wird Lissabon.
  assert.equal(naechsterFlughafen({ lat: 38.8, lon: -9.38 }, AIRPORTS)?.iata, 'LIS')
  // Lugano: kein Linienverkehr in Lugano, Malpensa als großer Flughafen.
  assert.equal(naechsterFlughafen({ lat: 46.0, lon: 8.95 }, AIRPORTS)?.iata, 'MXP')
  assert.equal(naechsterFlughafen({ lat: 41.15, lon: -8.61 }, AIRPORTS)?.iata, 'OPO')
  assert.equal(naechsterFlughafen({ lat: 40.42, lon: -3.7 }, AIRPORTS)?.iata, 'MAD')
})

test('Ohne großen Flughafen im festen Radius bleibt der Vorschlag leer', () => {
  assert.equal(FLUGHAFEN_VORSCHLAG_RADIUS_KM, 120)
  // Ko Chang: nur Trat (medium) in der Nähe.
  assert.equal(naechsterFlughafen({ lat: 12.05, lon: 102.33 }, AIRPORTS), null)
  // Évora liegt knapp 110 km von Lissabon: noch im Radius.
  assert.equal(naechsterFlughafen({ lat: 38.57, lon: -7.91 }, AIRPORTS)?.iata, 'LIS')
  // Weit draussen: nichts, auch kein ungültiger Code.
  assert.equal(naechsterFlughafen({ lat: 0, lon: 0 }, AIRPORTS), null)
  assert.equal(naechsterFlughafen({ lat: 38.72, lon: -9.14 }, AIRPORTS.filter(z => z.iata !== 'LIS')), null)
})

test('Suchfenster deckt den Radius ab und gibt den Längengrad an der Datumsgrenze frei', () => {
  const lissabon = suchfenster({ lat: 38.72, lon: -9.14 })
  assert(lissabon.lon && lissabon.lon.min < -10.5 && lissabon.lon.max > -7.8)
  assert(lissabon.lat.min < 37.7 && lissabon.lat.max > 39.7)
  assert.equal(suchfenster({ lat: -17.7, lon: 179.5 }).lon, null)
  assert.equal(suchfenster({ lat: 89.9, lon: 0 }).lon, null)
})

test('Route: Katalogort liefert Vorschlag, null ohne Treffer, 404 für Unbekanntes, 503 bei Lesefehler', async (t) => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'anon'
  let ort: Array<{ lat: number | null; lon: number | null }> | null = [{ lat: 38.72, lon: -9.14 }]
  let fehler = false
  const abfragen: string[] = []
  const kette = (tabelle: string) => {
    const filter: string[] = []
    const builder = {
      select: () => builder,
      eq: (f: string, w: unknown) => { filter.push(`${f}=${w}`); return builder },
      not: () => builder, gte: () => builder, lte: () => builder,
      limit: () => builder,
      then: (fertig: (wert: unknown) => unknown) => {
        abfragen.push(`${tabelle}:${filter.join('&')}`)
        if (fehler) return Promise.resolve({ data: null, error: { message: 'down', code: '08006' }, status: 0 }).then(fertig)
        const data = tabelle === 'places' ? ort : AIRPORTS.filter(z => z.klasse === 'large')
        return Promise.resolve({ data, error: null, status: 200 }).then(fertig)
      },
    }
    return builder
  }
  t.mock.module(new URL('../supabase/server.ts', import.meta.url), { namedExports: {
    createRouteHandlerClient: async () => ({ from: kette }),
  } })
  const { GET } = await import('../../app/api/search/airports/route')
  const frage = (id: string) => GET(new Request(`https://jetnity.com/api/search/airports?naechster=${encodeURIComponent(id)}`))

  const lissabon = await frage('geonames:2267057')
  assert.equal(lissabon.status, 200)
  assert.equal(lissabon.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await lissabon.json(), { vorschlag: { iata: 'LIS', name: 'Humberto Delgado Airport · LIS', km: 7 } })
  assert(abfragen.includes('places:id=geonames:2267057'))
  assert(abfragen.includes('airports:klasse=large'))

  ort = [{ lat: 12.05, lon: 102.33 }]
  assert.deepEqual(await (await frage('geonames:1')).json(), { vorschlag: null })
  ort = [{ lat: null, lon: null }]
  assert.deepEqual(await (await frage('geonames:2')).json(), { vorschlag: null })
  ort = []
  assert.equal((await frage('geonames:3')).status, 404)
  assert.equal((await frage('freitext')).status, 404)
  fehler = true
  assert.equal((await frage('geonames:2267057')).status, 503)
})
