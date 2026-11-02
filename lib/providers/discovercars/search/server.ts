import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { createFetchProviderHttpClient, createProviderTransportExecutor } from '@/lib/server/providers/core'
import { OFFER_LIFETIME_MS, offerSchema, type RentalSearch, type RentalStation, type RentalResults, type RentalOffer } from './contract'

const BASE = 'https://demandapi.discovercars.com'
export class RentalSearchError extends Error {
  constructor(public status: number, public kind: 'error' | 'unavailable' | 'expired' | 'rate_limited', message: string) { super(message) }
}

export function rentalAccess(env: Record<string, string | undefined> = process.env): string | null {
  const key = env.DISCOVERCARS_API_KEY?.trim()
  return env.JETNITY_DISCOVERCARS_SEARCH_ENABLED === '1' && key && key.length >= 24 ? key : null
}

function mac(value: string, key: string) { return createHmac('sha256', key).update(`jetnity:discovercars:offer:v1:${value}`).digest('base64url') }
function sign(offerId: string, currency: string, expiresAt: number, key: string) {
  const value = Buffer.from(JSON.stringify({ offerId, currency, expiresAt })).toString('base64url')
  return `${value}.${mac(value, key)}`
}
export function readOfferToken(token: string, key: string, now: number) {
  try {
    const [value, signature, rest] = token.split('.')
    if (!value || !signature || rest) return null
    const expected = Buffer.from(mac(value, key)); const supplied = Buffer.from(signature)
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null
    const data = z.object({ offerId: z.string().regex(/^[\w-]{1,120}$/), currency: z.string().regex(/^[A-Z]{3}$/), expiresAt: z.number().int() }).parse(JSON.parse(Buffer.from(value, 'base64url').toString()))
    return data.expiresAt > now && data.expiresAt <= now + OFFER_LIFETIME_MS ? data : null
  } catch { return null }
}

export function createRentalSearch(key: string, fetchImpl = fetch, now = Date.now) {
  const transport = createProviderTransportExecutor({
    http: createFetchProviderHttpClient(fetchImpl), timeout: { timeoutMs: 18_000 },
    retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 }, maxBodyBytes: 2_097_152,
  })
  async function request(path: string, body?: unknown, signal?: AbortSignal): Promise<unknown> {
    if (!transport.ok) throw new RentalSearchError(503, 'unavailable', 'Die Mietwagensuche ist gerade nicht erreichbar.')
    const response = await transport.executor.execute({
      providerId: 'discovercars', operationId: body ? 'search' : path.includes('/offers/') ? 'detail' : 'locations',
      method: body ? 'POST' : 'GET', url: `${BASE}${path}`, signal,
      headers: { publicHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' }, secretHeaders: { Authorization: `Bearer ${key}` } },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (response.ok) return response.value
    const { kind, status } = response.error
    if (kind === 'rate_limited') throw new RentalSearchError(429, 'rate_limited', 'Die Mietwagensuche ist gerade stark ausgelastet. Bitte versuche es in einer Minute erneut.')
    if (kind === 'timeout') throw new RentalSearchError(504, 'error', 'Die Suche dauert gerade zu lange. Bitte versuche es erneut.')
    if (status === 400) throw new RentalSearchError(400, 'error', 'Für diese Angaben konnte DiscoverCars keine Suche ausführen. Prüfe Station, Mietdaten und Wohnsitzland; einzelne Vermieter beschränken Anmietungen im eigenen Wohnsitzland.')
    if (status === 404) throw new RentalSearchError(404, 'expired', 'Die Station oder das Angebot ist nicht mehr verfügbar. Bitte suche erneut.')
    throw new RentalSearchError(503, 'unavailable', 'Mietwagenangebote können gerade nicht geladen werden. Bitte versuche es später erneut.')
  }
  return {
    async locations(term: string, signal?: AbortSignal): Promise<RentalStation[]> {
      const raw = await request(`/v2/locations/search?${new URLSearchParams({ term, locale: 'de-DE' })}`, undefined, signal)
      const parsed = z.object({ data: z.array(z.unknown()).max(100) }).safeParse(raw)
      if (!parsed.success) throw new RentalSearchError(502, 'error', 'Die Ortsvorschläge konnten nicht gelesen werden. Bitte versuche es erneut.')
      const schema = z.object({ location_id: z.number().int().positive(), place: z.string().max(200), country: z.string().max(100), region: z.string().max(150), type: z.string().max(40) })
      const locations = parsed.data.data.flatMap(v => {
        const p = schema.safeParse(v)
        return p.success ? [{ id: p.data.location_id, name: p.data.place, country: p.data.country, region: p.data.region, type: p.data.type }] : []
      }).slice(0, 10)
      if (parsed.data.data.length && !locations.length) throw new RentalSearchError(502, 'error', 'Die Ortsvorschläge konnten nicht sicher angezeigt werden. Bitte versuche einen anderen Ortsnamen.')
      return locations
    },
    async search(s: RentalSearch, signal?: AbortSignal): Promise<RentalResults> {
      const searchedAt = now(); const expiresAt = searchedAt + OFFER_LIFETIME_MS
      // Local station time as confirmed by DiscoverCars; do not shift through browser UTC.
      const raw = await request('/v1/offers', {
        driver: { residence: s.residence, age: s.age }, currency: s.currency,
        pickup_at: `${s.pickupDate}T${s.pickupTime}:00`, pickup_location: { location_id: s.pickup.id },
        dropoff_at: `${s.dropoffDate}T${s.dropoffTime}:00`,
        ...(s.dropoff ? { dropoff_location: { location_id: s.dropoff.id } } : {}),
        parameters: { show_extras: true },
      }, signal)
      const parsed = z.object({ data: z.array(z.unknown()).max(2000) }).safeParse(raw)
      if (!parsed.success) throw new RentalSearchError(502, 'error', 'Die Angebote konnten nicht vollständig gelesen werden. Bitte versuche es erneut.')
      const offers: RentalOffer[] = []; const ids = new Set<string>()
      for (const v of parsed.data.data) {
        const p = offerSchema.safeParse(v)
        if (p.success && p.data.price.currency === s.currency && !ids.has(p.data.offer_id)) {
          ids.add(p.data.offer_id)
          offers.push({ ...p.data, token: sign(p.data.offer_id, s.currency, expiresAt, key) })
        }
      }
      if (parsed.data.data.length && !offers.length) throw new RentalSearchError(502, 'error', 'Die Angebotsdaten konnten nicht sicher angezeigt werden. Bitte versuche es erneut.')
      return { offers, searchedAt, expiresAt, omitted: parsed.data.data.length - offers.length }
    },
    async detail(token: string, signal?: AbortSignal): Promise<{ offer: RentalOffer; expiresAt: number }> {
      const context = readOfferToken(token, key, now())
      if (!context) throw new RentalSearchError(410, 'expired', 'Dieses Suchergebnis ist abgelaufen. Bitte suche erneut, um aktuelle Preise zu sehen.')
      const raw = await request(`/v1/offers/${encodeURIComponent(context.offerId)}`, undefined, signal)
      const parsed = z.object({ data: offerSchema }).safeParse(raw)
      if (!parsed.success || parsed.data.data.offer_id !== context.offerId || parsed.data.data.price.currency !== context.currency) throw new RentalSearchError(502, 'error', 'Die Fahrzeugdetails konnten nicht gelesen werden. Bitte versuche es erneut.')
      if (now() >= context.expiresAt) throw new RentalSearchError(410, 'expired', 'Dieses Suchergebnis ist abgelaufen. Bitte suche erneut.')
      return { offer: { ...parsed.data.data, token }, expiresAt: context.expiresAt }
    },
  }
}
