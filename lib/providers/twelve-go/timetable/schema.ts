import { z } from 'zod'
import type { TwelveGoKante } from '@/lib/providers/twelve-go/affiliate/kanten'

// Countries explicitly documented by the partner's PHP reference v2.0.
const laender = ['TH', 'MY', 'KH', 'VN', 'SG'] as const
const ort = z.string().trim().min(2).max(80).regex(/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} '\-()]{1,79}$/u)
// Reviewed GeoNames identity -> provider region. Evidence and geographical scope:
// docs/TWELVE_GO_TIMETABLE_1_EVIDENCE_2026-11-01.md. Never resolve an unknown ID by name.
const zuordnungen: Readonly<Record<string, { country: string; name: string }>> = {
  'geonames:1609350': { country: 'TH', name: 'Bangkok' },
  'geonames:1611309': { country: 'TH', name: 'Koh Chang' },
  'geonames:1151254': { country: 'TH', name: 'Phuket' },
}
function zugeordnet(id: string, country: string, name: string): boolean {
  const ort = zuordnungen[id]
  return !!ort && ort.country === country && ortSchluessel(ort.name, country) === ortSchluessel(name, country)
}
export const timetableAnfrageSchema = z.object({
  country: z.enum(laender), from: ort, to: ort,
  fromPlaceId: z.string().max(50), toPlaceId: z.string().max(50),
}).strict().refine((a) => a.fromPlaceId !== a.toPlaceId &&
  zugeordnet(a.fromPlaceId, a.country, a.from) && zugeordnet(a.toPlaceId, a.country, a.to))
export type TimetableAnfrage = z.infer<typeof timetableAnfrageSchema>

export function ortSchluessel(name: string, country: string): string {
  const normal = name.normalize('NFC').toLocaleLowerCase('en').trim().replace(/[ -]+/g, '-')
  // The official portal names the Thai island Koh Chang; Jetnity also uses Ko Chang.
  return country === 'TH' && normal === 'ko-chang' ? 'koh-chang' : normal
}

export function timetableAnfrageFuerKante(kante: TwelveGoKante): TimetableAnfrage | null {
  if (!kante.vonPlaceId?.match(/^geonames:\d+$/) || !kante.nachPlaceId?.match(/^geonames:\d+$/)) return null
  if (kante.vonPlaceId === kante.nachPlaceId || kante.vonLand !== kante.nachLand) return null
  const parsed = timetableAnfrageSchema.safeParse({ country: kante.vonLand, from: kante.vonName, to: kante.nachName,
    fromPlaceId: kante.vonPlaceId, toPlaceId: kante.nachPlaceId })
  return parsed.success ? parsed.data : null
}

const verkehrsmittel = ['train', 'bus', 'avia', 'van', 'ferry', 'charter'] as const
export const timetableVerkehrsmittel: Record<(typeof verkehrsmittel)[number], string> = {
  train: 'Zug', bus: 'Bus', avia: 'Flug', van: 'Minivan', ferry: 'Fähre', charter: 'Privater Transfer',
}

export function timetableLink(wert: string, anfrage?: TimetableAnfrage): URL | null {
  try {
    const url = new URL(wert)
    if (url.origin !== 'https://12go.asia' || url.username || url.password || url.hash) return null
    const segmente = url.pathname.split('/')
    if (segmente.length !== 5 || segmente[1] !== 'de' || !['travel', ...verkehrsmittel].includes(segmente[2]!)) return null
    if (!segmente.slice(3).every((s) => /^[\p{L}\p{N}()'\-]+$/u.test(decodeURIComponent(s)))) return null
    if (url.searchParams.getAll('z').length !== 1 || url.searchParams.get('z') !== '17323861') return null
    if (url.searchParams.getAll('curr').length !== 1 || url.searchParams.get('curr') !== 'CHF') return null
    if ([...url.searchParams.keys()].some((k) => k !== 'z' && k !== 'curr')) return null
    if (anfrage && (decodeURIComponent(segmente[3]!) !== ortSchluessel(anfrage.from, anfrage.country) ||
      decodeURIComponent(segmente[4]!) !== ortSchluessel(anfrage.to, anfrage.country))) return null
    return url
  } catch { return null }
}

const text = z.string().trim().min(1).max(300)
export const timetableAntwortSchema = z.object({
  status: z.enum(['ready', 'unmatched']),
  fetchedAt: z.string().datetime(),
  currency: z.literal('CHF'),
  routeLabel: text,
  href: z.string().refine((v) => timetableLink(v) !== null).nullable(),
  options: z.array(z.object({
    mode: z.enum(verkehrsmittel),
    href: z.string().refine((v) => timetableLink(v) !== null),
    price: z.string().regex(/^Fr\.\s*\d[\d.,'’ ]*(?:[–-]\s*\d[\d.,'’ ]*)?$/).max(80),
    duration: text.nullable(),
    departures: z.array(z.object({ service: text, times: z.string().max(300).nullable() })).max(40),
  })).max(6),
}).superRefine((v, ctx) => {
  if (new Set(v.options.map((option) => option.mode)).size !== v.options.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate transport mode' })
  }
  if ((v.status === 'ready' && (!v.href || v.options.length === 0)) ||
    (v.status === 'unmatched' && (v.href !== null || v.options.length !== 0))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inconsistent timetable result' })
  }
})
export type TimetableAntwort = z.infer<typeof timetableAntwortSchema>
