import { z } from 'zod'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}, 'Ungültiges Datum')
const common = { adults: z.number().int().min(1).max(9) }
export const kayakSearchSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('hotels'), ...common, latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), checkIn: date, checkOut: date, rooms: z.number().int().min(1).max(4) }).strict(),
  z.object({ kind: z.literal('flights'), ...common, origin: z.string().regex(/^[A-Z]{3}$/), destination: z.string().regex(/^[A-Z]{3}$/), departure: date, returnDate: date.optional(), cabin: z.enum(['economy', 'premium', 'business', 'first']) }).strict(),
])
export type KayakSearch = z.infer<typeof kayakSearchSchema>
export function validSearchDates(input: KayakSearch, now = new Date()): boolean {
  const start = input.kind === 'hotels' ? input.checkIn : input.departure
  const end = input.kind === 'hotels' ? input.checkOut : input.returnDate
  const today = now.toISOString().slice(0, 10)
  const limit = new Date(now.getTime() + 365 * 86400000).toISOString().slice(0, 10)
  if (start < today || start > limit || (end && (end < start || end > limit))) return false
  if (input.kind === 'hotels') return input.rooms <= input.adults && input.checkOut > start && (Date.parse(input.checkOut) - Date.parse(start)) <= 30 * 86400000
  return input.origin !== input.destination
}

export type HotelPreview = { id: string; name: string; address: string; image: string | null; stars: number | null; rating: number | null; reviews: number | null; price: number | null; currency: string; room: string; freeCancellation: boolean; provider: string }
export type FlightLegPreview = { origin: string; destination: string; departure: string; arrival: string; duration: number | null; stops: number; airlines: string[] }
export type FlightPreview = { id: string; legs: FlightLegPreview[]; price: number | null; currency: string; priceMode: 'perPerson' | 'total' | 'unknown' }
export type KayakPreview = { mode: 'sandbox'; kind: 'hotels' | 'flights'; complete: boolean; checkedAt: string; hotels: HotelPreview[]; flights: FlightPreview[] }

type Row = Record<string, unknown>
function object(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function rows(value: unknown): Row[] { return Array.isArray(value) ? value.map(object) : [] }
function text(value: unknown, max = 180): string { return typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, '').slice(0, max) : '' }
function number(value: unknown, max = 1000000): number | null { return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : null }
function currency(value: unknown): string { const code = text(value, 3); return /^[A-Z]{3}$/.test(code) ? code : '' }
export function safeHotelImage(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 1500) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null
    if (!['www.kayak.com', 'www.kayak.ch', 'www.kayak.de', 'www.kayak.co.uk', 'content.r9cdn.net'].includes(url.hostname)) return null
    if (!/^\/(?:h\/run\/api\/image|himg\/|rimg\/|img\/)/.test(url.pathname)) return null
    for (const [key, entry] of url.searchParams) {
      if (!['url', 'maxheight', 'maxwidth', 'width', 'height', 'crop', 'xhint', 'yhint'].includes(key)) return null
      if (key === 'url' && !/^\/(?:himg|rimg|img)\/[a-zA-Z0-9_./-]+$/.test(entry)) return null
    }
    return url.toString()
  } catch { return null }
}

/** Explicit projection: provider URLs, credentials and booking links never reach the browser. */
export function normalizePreview(kind: KayakSearch['kind'], raw: unknown, now = new Date()): KayakPreview {
  const data = object(raw)
  const complete = kind === 'hotels' ? data.isComplete === true : data.status === 'complete'
  if (kind === 'hotels' ? typeof data.isComplete !== 'boolean' : !['complete', 'first-phase', 'second-phase'].includes(String(data.status))) throw new Error('invalid_response')
  if ((!Array.isArray(data.results) && (complete || data.results !== undefined)) || (Array.isArray(data.results) && data.results.some((row) => !row || typeof row !== 'object' || Array.isArray(row)))) throw new Error('invalid_response')
  const result: KayakPreview = { mode: 'sandbox', kind, complete, checkedAt: now.toISOString(), hotels: [], flights: [] }
  if (kind === 'hotels') {
    const providers = rows(data.providers)
    result.hotels = rows(data.results).slice(0, 24).map((hotel, index) => {
      const rates = rows(hotel.rates).filter((rate) => number(rate.totalRate) !== null).sort((a, b) => Number(a.totalRate) - Number(b.totalRate))
      const rate = rates[0] ?? {}
      return { id: `hotel-${index}`, name: text(hotel.name) || 'Beispielunterkunft', address: text(hotel.address), image: rows(hotel.images).map((image) => safeHotelImage(image.large) ?? safeHotelImage(image.small)).find(Boolean) ?? null, stars: number(hotel.starRating, 5), rating: number(hotel.guestRating, 10), reviews: number(hotel.numberOfReviews), price: number(rate.totalRate), currency: currency(data.currencyCode), room: text(rate.roomName), freeCancellation: rate.hasFreeCancellation === true, provider: text(providers[Number(rate.providerIndex)]?.name) }
    })
  } else {
    const allLegs = object(data.legs), allSegments = object(data.segments), airlines = object(data.airlines)
    result.flights = rows(data.results).slice(0, 80).map((flight, index) => {
      const prices = rows(flight.bookingOptions).map((option) => number(object(option.displayPrice).price)).filter((price): price is number => price !== null)
      const references = rows(flight.legs)
      let valid = references.length > 0 && references.length <= 2
      const legs = references.map((ref) => {
        const leg = object(allLegs[String(ref.id)])
        const segments = rows(leg.segments).map((segment) => object(allSegments[String(segment.id)]))
        if (!segments.length || segments.some((segment) => !/^[A-Z]{3}$/.test(String(segment.origin)) || !/^[A-Z]{3}$/.test(String(segment.destination)))) valid = false
        const first = segments[0] ?? {}, last = segments.at(-1) ?? {}
        return { origin: text(first.origin, 3), destination: text(last.destination, 3), departure: text(leg.departureTime, 35), arrival: text(leg.arrivalTime, 35), duration: number(leg.duration, 10000), stops: Math.max(0, segments.length - 1), airlines: [...new Set(segments.map((segment) => text(object(airlines[String(segment.airline)]).displayName) || text(segment.airline, 8)).filter(Boolean))] }
      }).filter((leg) => /^[A-Z]{3}$/.test(leg.origin) && /^[A-Z]{3}$/.test(leg.destination) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(leg.departure) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(leg.arrival))
      return { id: `flight-${index}`, legs: valid && legs.length === references.length ? legs : [], price: prices.length ? Math.min(...prices) : null, currency: currency(data.currency), priceMode: data.priceMode === 'perPerson' ? 'perPerson' as const : data.priceMode === 'total' ? 'total' as const : 'unknown' as const }
    }).filter((flight) => flight.legs.length > 0)
    if (rows(data.results).length > 0 && result.flights.length === 0) throw new Error('invalid_response')
  }
  return result
}
