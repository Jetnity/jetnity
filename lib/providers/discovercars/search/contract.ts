import { z } from 'zod'
import { istKatalogLand } from '@/lib/country/katalog'

export const OFFER_LIFETIME_MS = 30 * 60 * 1000
export const SEARCH_CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP'] as const

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T00:00:00Z`)
  return Number.isFinite(d.valueOf()) && d.toISOString().slice(0, 10) === s
}, 'Bitte wähle ein gültiges Datum.')
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Bitte wähle eine Uhrzeit.')
const station = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  country: z.string().max(100),
  region: z.string().max(150),
  type: z.string().max(40),
})
export type RentalStation = z.infer<typeof station>

export const searchInput = z.object({
  pickup: station,
  dropoff: station.nullable(),
  pickupDate: date,
  pickupTime: time,
  dropoffDate: date,
  dropoffTime: time,
  age: z.number().int().min(18).max(99),
  residence: z.string().refine(istKatalogLand, 'Bitte wähle das Wohnsitzland des Fahrers.'),
  currency: z.enum(SEARCH_CURRENCIES),
}).strict().superRefine((s, ctx) => {
  const start = `${s.pickupDate}T${s.pickupTime}`
  const end = `${s.dropoffDate}T${s.dropoffTime}`
  if (end <= start) ctx.addIssue({ code: 'custom', path: ['dropoffDate'], message: 'Die Rückgabe muss nach der Abholung liegen.' })
  if (Date.parse(`${s.dropoffDate}T00:00:00Z`) - Date.parse(`${s.pickupDate}T00:00:00Z`) > 365 * 86400000) {
    ctx.addIssue({ code: 'custom', path: ['dropoffDate'], message: 'Bitte wähle einen Mietzeitraum von höchstens 365 Tagen.' })
  }
})
export type RentalSearch = z.infer<typeof searchInput>

export const requestInput = z.discriminatedUnion('action', [
  z.object({ action: z.literal('locations'), term: z.string().trim().min(2).max(100) }).strict(),
  z.object({ action: z.literal('search'), search: searchInput }).strict(),
  z.object({ action: z.literal('detail'), token: z.string().min(20).max(1000) }).strict(),
])

/** Only allow URLs actually returned by the provider; never construct an offer link. */
export function discoverCarsUrl(value: unknown, kind: 'offer' | 'conditions' | 'image'): string | null {
  if (typeof value !== 'string' || value.length > 6000) return null
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' || !['www.discovercars.com', 'discovercars.com'].includes(u.hostname) || u.port || u.username || u.password) return null
    const valid = kind === 'image'
      ? /^\/(images\/car\/|PartnerFiles\/)/.test(u.pathname)
      : kind === 'conditions'
        ? /^\/offer\/rental-conditions\/[\w-]+$/.test(u.pathname)
        : /^\/(?:[a-z]{2}\/)?offer\/[\w-]+$/.test(u.pathname)
    return valid ? value : null
  } catch { return null }
}

const text = z.string().trim().max(4000).nullable().optional().catch(null)
const number = z.number().finite().nonnegative().nullable().optional().catch(null)
const integer = z.number().int().nonnegative().nullable().optional().catch(null)
const bool = z.boolean().nullable().optional().catch(null)
const currency = z.string().regex(/^[A-Z]{3}$/)
const moneyRange = z.object({ min: number, max: number, currency }).nullable().optional().catch(null)
const location = z.object({
  location: text, address: text, instructions: text, location_type: text,
  opening_hours: z.record(z.string().max(20), z.string().max(100)).nullable().optional().catch(null),
}).nullable().optional().catch(null)
const extra = z.object({ name: z.string().max(200), price: number, price_period: text, payable: text })
const url = (kind: 'offer' | 'conditions' | 'image') => z.unknown().transform(v => discoverCarsUrl(v, kind))

export const offerSchema = z.object({
  offer_id: z.string().regex(/^[\w-]{1,120}$/),
  car: z.object({
    name: z.string().trim().min(1).max(200), image: url('image'), category: text,
    bags: integer, seats: integer, doors: integer, transmission: text,
    fuel: text, fuel_type: text, air_conditioning: bool,
  }),
  price: z.object({ total: z.number().finite().nonnegative(), currency, pay_now: number, pay_later: number }),
  supplier: z.object({ name: text, logo: url('image'), rating: number, review_count: integer, location_type: text }).nullable().optional().catch(null),
  guaranteed_model: bool, deposit_free: bool,
  deposit: moneyRange, excess: moneyRange,
  mileage: z.object({ unlimited: bool, included_limit: number, unit: text }).nullable().optional().catch(null),
  cancellation: z.object({ type: text, details: z.object({ hours_before_pickup: number }).nullable().optional().catch(null) }).nullable().optional().catch(null),
  cross_border: z.object({ allowed: bool, ferry_allowed: bool }).nullable().optional().catch(null),
  included_options: z.array(z.object({ name: z.string().max(200) })).max(100).optional().catch([]),
  extras: z.array(extra).max(100).optional().catch([]),
  mandatory_extras: z.array(extra).max(100).optional().catch([]),
  payment_methods: z.array(z.object({ name: text, type: text, status: text })).max(100).optional().catch([]),
  coverage: z.object({ price: number, currency, max_coverage: number }).nullable().optional().catch(null),
  pickup: location, dropoff: location,
  url: z.object({ web: url('offer'), rental_conditions: url('conditions') }).catch({ web: null, rental_conditions: null }),
})
export type RentalOffer = z.infer<typeof offerSchema> & { token: string }
export type RentalResults = { offers: RentalOffer[]; expiresAt: number; searchedAt: number; omitted: number }
export type RentalResponse =
  | { status: 'ok'; kind: 'locations'; locations: RentalStation[] }
  | { status: 'ok'; kind: 'search'; result: RentalResults }
  | { status: 'ok'; kind: 'detail'; offer: RentalOffer; expiresAt: number }
  | { status: 'error' | 'unavailable' | 'expired' | 'rate_limited'; message: string }

export function offersForView(offers: RentalOffer[], transmission: string, category: string, order: string) {
  return offers.filter(o => (!transmission || o.car.transmission === transmission) && (!category || o.car.category === category))
    .sort((a, b) => order === 'rating' ? (b.supplier?.rating ?? -1) - (a.supplier?.rating ?? -1) || a.price.total - b.price.total : a.price.total - b.price.total)
}
