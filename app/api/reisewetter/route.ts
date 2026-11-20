import { weatherRequestOrigin } from '@/lib/reisewetter/request-origin'
import { reserveGlobalWeatherRequest } from '@/lib/reisewetter/global-quota-server'
import { weatherConsentPresent } from '@/lib/reisewetter/quota-contract'
import { vorhersageLesen, type Vorhersage } from '@/lib/reisewetter/vorhersage'

const gueltigkeit = 15 * 60_000
const cache = new Map<string, { ablauf: number; antwort: Promise<Vorhersage> }>()
class Wetterfehler extends Error {
  constructor(readonly status: number, readonly grund: string) { super(grund) }
}
function fehler(status: number, grund = 'nicht-verfuegbar', retryAfterSec = 0) {
  return Response.json({ grund }, { status, headers: { 'Cache-Control': 'no-store',
    ...(retryAfterSec > 0 ? { 'Retry-After': String(retryAfterSec) } : {}) } })
}
function koordinate(params: URLSearchParams, name: string, grenze: number) {
  const [wert, ...rest] = params.getAll(name)
  if (!wert || rest.length || !/^-?\d{1,3}(?:\.\d{1,2})?$/.test(wert) || Math.abs(Number(wert)) > grenze) return null
  return Number(wert).toFixed(2)
}

async function laden(lat: string, lon: string, key: string) {
  const url = new URL('https://api.openweathermap.org/data/2.5/forecast')
  url.search = new URLSearchParams({ lat, lon, appid: key, units: 'metric', lang: 'de' }).toString()
  const antwort = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(6000) })
  if (antwort.status === 401 || antwort.status === 403) throw new Wetterfehler(503, 'anbieterzugang')
  if (antwort.status === 429) throw new Wetterfehler(429, 'limit')
  if (!antwort.ok) throw new Wetterfehler(502, 'wetterdienst')
  const reader = antwort.body?.getReader()
  if (!reader) throw new Error('Vorhersage')
  const parts: Uint8Array[] = []; let bytes = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      bytes += part.value.byteLength
      if (bytes > 256 * 1024) throw new Error('Vorhersage')
      parts.push(part.value)
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock() }
  const all = new Uint8Array(bytes); let offset = 0
  for (const part of parts) { all.set(part, offset); offset += part.byteLength }
  const daten = vorhersageLesen(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all)))
  if (!daten) throw new Error('Vorhersage')
  return daten
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const key = process.env.OPENWEATHER_API_KEY
  if (!key || url.origin !== weatherRequestOrigin(process.env)) return fehler(404)
  if (!weatherConsentPresent(request.headers)) return fehler(403, 'zustimmung-fehlt')
  const lat = koordinate(url.searchParams, 'lat', 90)
  const lon = koordinate(url.searchParams, 'lon', 180)
  if (lat === null || lon === null || url.searchParams.size !== 2) return fehler(400)

  // All requests, including cache hits, share one database budget across every
  // instance and region. No in-memory or unsigned-header fallback on failure.
  const admission = await reserveGlobalWeatherRequest()
  if (!admission.ok) return fehler(admission.status,
    admission.status === 429 ? 'limit' : admission.status === 401 ? 'anmeldung' : 'schutz-nicht-verfuegbar', admission.retryAfterSec)
  if (request.signal.aborted) return fehler(503)
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
    return Response.json(await eintrag.antwort, { headers: { 'Cache-Control': 'no-store' } })
  } catch (ursache) {
    if (cache.get(id) === eintrag) cache.delete(id)
    if (ursache instanceof Wetterfehler) return fehler(ursache.status, ursache.grund)
    return fehler(503)
  }
}
