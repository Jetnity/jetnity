import { z } from 'zod'
import type { Database } from '@/types/supabase'

export const CATEGORIES = { stay: 'Unterkunft', flight: 'Flug', activity: 'Aktivität', rental_car: 'Mietwagen', transfer: 'Verbindung' } as const
export type SavedOffer = Database['public']['Tables']['saved_offers']['Row']

/** Personal references only. Never fetch these URLs or treat them as booking evidence. */
export function safeOfferUrl(value: string): string | null {
  try {
    if (value.length > 2048 || /[\s\\]/.test(value)) return null
    const u = new URL(value)
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !u.hostname.includes('.') || u.hostname.endsWith('.local') || /^[\d.]+$/.test(u.hostname) || u.hostname.startsWith('[')) return null
    if ([...u.searchParams.keys()].some(k => /^(access_?token|refresh_?token|api_?key|authorization|password|secret|code)$/i.test(k))) return null
    if (u.pathname === '/' || /\/(search|searchresults)(\.|\/|$)/i.test(u.pathname)) return null
    u.hash = ''
    return u.href
  } catch { return null }
}

const optionalText = (max: number) => z.string().trim().max(max).nullable().transform(v => v || null)
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const t = Date.parse(v + 'T12:00:00Z')
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v
}, 'Bitte wähle ein gültiges Datum.').nullable()
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable()
const zone = optionalText(64).refine(v => {
  if (!v) return true
  try { new Intl.DateTimeFormat('de', { timeZone: v }).format(); return true } catch { return false }
}, 'Die Zeitzone ist unbekannt.')

export const offerTimingInput = z.object({ starts_on: date, ends_on: date, starts_at: time, ends_at: time }).strict()

export const offerInput = z.object({
  category: z.enum(['stay', 'flight', 'activity', 'rental_car', 'transfer']),
  title: z.string().trim().min(1, 'Bitte benenne das konkrete Angebot.').max(200),
  url: z.string().trim().refine(v => !!safeOfferUrl(v), 'Bitte verwende den HTTPS-Link zum konkreten Angebot, ohne Zugangsdaten oder Suchseite.').transform(v => safeOfferUrl(v)!),
  destination: optionalText(200), ...offerTimingInput.shape, start_timezone: zone, end_timezone: zone,
}).strict().superRefine((v, ctx) => {
  if (v.starts_at && !v.starts_on) ctx.addIssue({ code: 'custom', path: ['starts_on'], message: 'Zur Anfangszeit fehlt das Datum.' })
  if (v.ends_at && !v.ends_on) ctx.addIssue({ code: 'custom', path: ['ends_on'], message: 'Zur Endzeit fehlt das Datum.' })
  // Different local dates are valid across the date line; never infer flight time zones.
  if (v.category !== 'flight' && v.starts_on && v.ends_on && v.ends_on < v.starts_on) ctx.addIssue({ code: 'custom', path: ['ends_on'], message: 'Das Ende liegt vor dem Anfang.' })
  if (v.category === 'stay' && v.starts_on && v.ends_on && v.ends_on <= v.starts_on) ctx.addIssue({ code: 'custom', path: ['ends_on'], message: 'Der Check-out muss nach dem Check-in liegen.' })
})
export type OfferInput = z.infer<typeof offerInput>

export function suggestedDay(offer: Pick<SavedOffer, 'starts_on' | 'destination'>, days: { id: string; dayDate: string | null; stageId: string | null }[], stages: { id: string; name: string }[]): string {
  if (!offer.starts_on) return ''
  const matches = days.filter(d => d.dayDate === offer.starts_on)
  const destination = offer.destination?.trim().toLocaleLowerCase('de')
  const local = destination ? matches.filter(d => stages.some(s => s.id === d.stageId && s.name.toLocaleLowerCase('de') === destination)) : matches
  return local.length === 1 ? local[0].id : ''
}
