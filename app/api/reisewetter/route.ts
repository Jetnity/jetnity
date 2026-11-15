import { APP_MAP_ORIGIN, isAppMapPreview } from '@/lib/maps/config'
import { providerOpsInMemoryCostGuard } from '@/lib/provider-ops/cost-guard'
import { vorhersageLesen, type Vorhersage } from '@/lib/reisewetter/vorhersage'

const gueltigkeit = 15 * 60_000
const limit = providerOpsInMemoryCostGuard({
  fensterMs: 60_000, anfragenJeFenster: 45, tagMs: 86_400_000, anfragenJeTag: 1000,
})
const cache = new Map<string, { ablauf: number; antwort: Promise<Vorhersage> }>()
class Wetterfehler extends Error {
  constructor(readonly status: number, readonly grund: string) { super(grund) }
}
function fehler(status: number, grund = 'nicht-verfuegbar') {
  return Response.json({ grund }, { status, headers: { 'Cache-Control': 'no-store' } })
}
function koordinate(params: URLSearchParams, name: string, grenze: number) {
  const [wert, ...rest] = params.getAll(name)
  if (!wert || rest.length || !/^-?\d{1,3}(?:\.\d{1,2})?$/.test(wert) || Math.abs(Number(wert)) > grenze) return null
  return Number(wert).toFixed(2)
}

async function laden(lat: string, lon: string, key: string) {
  if (!(await limit.erlaubt('reisewetter')).ok) throw new Wetterfehler(429, 'limit')
  const url = new URL('https://api.openweathermap.org/data/2.5/forecast')
  url.search = new URLSearchParams({ lat, lon, appid: key, units: 'metric', lang: 'de' }).toString()
  const antwort = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(6000) })
  if (antwort.status === 401 || antwort.status === 403) throw new Wetterfehler(503, 'vorschauzugang')
  if (antwort.status === 429) throw new Wetterfehler(429, 'limit')
  if (!antwort.ok) throw new Wetterfehler(502, 'wetterdienst')
  const daten = vorhersageLesen(await antwort.json())
  if (!daten) throw new Error('Vorhersage')
  return daten
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const key = process.env.OPENWEATHER_API_KEY
  if (!key || !isAppMapPreview(process.env) || url.origin !== APP_MAP_ORIGIN) return fehler(404)
  if (request.headers.get('sec-fetch-site') !== 'same-origin') return fehler(403)
  const lat = koordinate(url.searchParams, 'lat', 90)
  const lon = koordinate(url.searchParams, 'lon', 180)
  if (lat === null || lon === null || url.searchParams.size !== 2) return fehler(400)

  const id = lat + ',' + lon
  const jetzt = Date.now()
  for (const [ort, eintrag] of cache) if (eintrag.ablauf <= jetzt) cache.delete(ort)
  let eintrag = cache.get(id)
  if (!eintrag) {
    if (cache.size >= 128) return fehler(429)
    eintrag = { ablauf: jetzt + gueltigkeit, antwort: laden(lat, lon, key) }
    cache.set(id, eintrag)
  }
  try {
    return Response.json(await eintrag.antwort, { headers: { 'Cache-Control': 'private, max-age=300' } })
  } catch (ursache) {
    if (cache.get(id) === eintrag) cache.delete(id)
    if (ursache instanceof Wetterfehler) return fehler(ursache.status, ursache.grund)
    return fehler(503)
  }
}
