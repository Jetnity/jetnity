import { z } from 'zod'
import { planpunktFormularSchema } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

export const KONFLIKT = 'Der Planpunkt hat sich inzwischen geändert. Bitte lade die Reise neu; deine Eingabe bleibt erhalten.'
export function manuellBearbeitbar(item: TripItem): boolean {
  return (item.kind === 'activity' || item.kind === 'note') && item.provider == null && item.externalRef == null && item.bookingUrl == null
}

/** Validated explicit local fields. An absent date never comes from placement. */
export const manuellerInhaltSchema = planpunktFormularSchema.omit({ clientRef: true }).extend({
  kind: z.enum(['activity', 'note']),
 }).strict().superRefine((v, ctx) => {
  if (v.endsOn && !v.startsOn) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startsOn'], message: 'Bitte gib für ein Enddatum auch das Anfangsdatum an.' })
  if (v.endsAt && !v.startsAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startsAt'], message: 'Bitte gib für eine Endzeit auch die Anfangszeit an.' })
  if (v.startsOn && v.endsOn && (v.endsOn < v.startsOn ||
    (v.endsOn === v.startsOn && v.startsAt && v.endsAt && v.endsAt <= v.startsAt))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endsOn'], message: 'Das Ende muss nach dem Anfang liegen. Für Mitternacht bitte das Enddatum ausdrücklich angeben.' })
  }
})
export const planAenderungSchema = z.discriminatedUnion('art', [
  z.object({ art: z.literal('inhalt'), inhalt: manuellerInhaltSchema, dayId: z.string().min(1).max(80).nullable() }).strict(),
  z.object({ art: z.literal('platzierung'), dayId: z.string().min(1).max(80).nullable() }).strict(),
])
export type PlanAenderung = z.infer<typeof planAenderungSchema>

export function allePlanpunkte(reise: Trip): TripItem[] {
  return [...reise.days.flatMap(day => day.items), ...reise.ohneTag]
}

export function punktAendern(reise: Trip, original: TripItem, eingabe: unknown): Trip {
  const a = planAenderungSchema.parse(eingabe)
  const matches = allePlanpunkte(reise).filter(item => item.id === original.id)
  if (matches.length !== 1 || JSON.stringify(matches[0]) !== JSON.stringify(original)) throw new Error(KONFLIKT)
  if (a.dayId !== null && reise.days.filter(day => day.id === a.dayId).length !== 1) throw new Error('Dieser Tag gehört nicht zur Reise.')
  if (a.art === 'inhalt' && (!manuellBearbeitbar(original) || a.inhalt.kind !== original.kind)) {
    throw new Error('Dieser Punkt wird in seiner vorgesehenen Detailansicht bearbeitet.')
  }
  // Never rewrite stage, price, booking, route or provider facts on placement.
  const next: TripItem = { ...original, ...(a.art === 'inhalt' ? {
    title: a.inhalt.title, note: a.inhalt.note, startsOn: a.inhalt.startsOn ?? null,
    startsAt: a.inhalt.startsAt, endsOn: a.inhalt.endsOn ?? null, endsAt: a.inhalt.endsAt ?? null,
  } : {}), dayId: a.dayId }
  return { ...reise, revision: reise.revision + 1,
    days: reise.days.map(day => ({ ...day, items: [...day.items.filter(item => item.id !== original.id), ...(day.id === a.dayId ? [next] : [])] })),
    ohneTag: [...reise.ohneTag.filter(item => item.id !== original.id), ...(a.dayId === null ? [next] : [])],
  }
}
