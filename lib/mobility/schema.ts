// lib/mobility/schema.ts
//
// Laufzeitprüfung der Mobilitätssuche und der manuellen Erfassung.
// Der Browser ist untrusted input. Frei von Next und Supabase.

import { z } from 'zod'

import { MOBILITY_SUCHE_GRENZEN } from '@/lib/mobility/domain'
import { MOBILITY_MODES } from '@/types/trips'

const datum = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss die Form JJJJ-MM-TT haben')
  .refine((wert) => {
    const [jahr, monat, tag] = wert.split('-').map(Number)
    const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
    return (
      geprueft.getUTCFullYear() === jahr &&
      geprueft.getUTCMonth() === monat - 1 &&
      geprueft.getUTCDate() === tag
    )
  }, 'Dieses Datum gibt es nicht')

const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Uhrzeit muss die Form HH:MM haben')

const waehrung = z.string().regex(/^[A-Z]{3}$/, 'Währung muss ein ISO-4217-Code sein')

const ortsname = z
  .string()
  .transform((wert) => wert.trim())
  .pipe(z.string().min(1, 'Start und Ziel brauchen einen Namen').max(MOBILITY_SUCHE_GRENZEN.titel))

const optionalerOrt = z
  .string()
  .transform((wert) => wert.trim())
  .pipe(z.string().max(80))
  .transform((wert) => (wert === '' ? null : wert))

export const mobilitySucheEingabeSchema = z.object({
  originName: ortsname,
  destinationName: ortsname,
  originPlaceId: optionalerOrt.nullable().default(null),
  destinationPlaceId: optionalerOrt.nullable().default(null),
  date: datum.nullable().default(null),
  mode: z.enum(MOBILITY_MODES).nullable().default(null),
  travellers: z
    .number()
    .int()
    .min(MOBILITY_SUCHE_GRENZEN.reisende.min)
    .max(MOBILITY_SUCHE_GRENZEN.reisende.max)
    .default(1),
  currency: waehrung.default('CHF'),
})

export type MobilitySucheEingabe = z.infer<typeof mobilitySucheEingabeSchema>

export const mobilityManuellSchema = z
  .object({
    mode: z.enum(MOBILITY_MODES),
    title: z
      .string()
      .transform((wert) => wert.trim())
      .pipe(z.string().max(MOBILITY_SUCHE_GRENZEN.titel))
      .transform((wert) => (wert === '' ? null : wert))
      .nullable()
      .default(null),
    originName: ortsname,
    destinationName: ortsname,
    originPlaceId: optionalerOrt.nullable().default(null),
    destinationPlaceId: optionalerOrt.nullable().default(null),
    startsOn: datum.nullable().default(null),
    startsAt: uhrzeit.nullable().default(null),
    endsOn: datum.nullable().default(null),
    endsAt: uhrzeit.nullable().default(null),
    connectionRef: z
      .string()
      .transform((wert) => wert.trim())
      .pipe(z.string().max(MOBILITY_SUCHE_GRENZEN.verbindung))
      .transform((wert) => (wert === '' ? null : wert))
      .nullable()
      .default(null),
    mobilityChanges: z
      .number()
      .int()
      .min(MOBILITY_SUCHE_GRENZEN.umstiege.min)
      .max(MOBILITY_SUCHE_GRENZEN.umstiege.max)
      .nullable()
      .default(null),
    priceAmount: z
      .number()
      .finite()
      .nonnegative()
      .max(9_999_999_999.99)
      .nullable()
      .default(null),
    priceCurrency: waehrung.nullable().default(null),
    note: z
      .string()
      .transform((wert) => wert.trim())
      .pipe(z.string().max(500))
      .transform((wert) => (wert === '' ? null : wert))
      .nullable()
      .default(null),
    dayId: z.string().min(1).max(80).nullable().default(null),
    stageId: z.string().min(1).max(80).nullable().default(null),
  })
  .superRefine((wert, ctx) => {
    if ((wert.priceAmount === null) !== (wert.priceCurrency === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['priceAmount'],
        message: 'Preis und Währung gehören zusammen.',
      })
    }
    if (wert.endsOn && !wert.startsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startsOn'],
        message: 'Eine Ankunft braucht ein Abfahrtsdatum.',
      })
    }
    if (wert.endsAt && !wert.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startsAt'],
        message: 'Eine Ankunftszeit braucht eine Abfahrtszeit.',
      })
    }
    if (wert.startsOn && wert.endsOn) {
      if (wert.endsOn < wert.startsOn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endsOn'],
          message: 'Die Ankunft liegt vor der Abfahrt.',
        })
      } else if (
        wert.endsOn === wert.startsOn &&
        wert.startsAt &&
        wert.endsAt &&
        wert.endsAt < wert.startsAt
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endsAt'],
          message: 'Die Ankunftszeit liegt vor der Abfahrt.',
        })
      }
    }
  })

export type MobilityManuellEingabe = z.infer<typeof mobilityManuellSchema>

export function ersteMobilitymeldung(fehler: z.ZodError): string {
  return fehler.issues[0]?.message ?? 'Die Angaben sind unvollständig.'
}

export function mobilityTitelAus(eingabe: Pick<MobilityManuellEingabe, 'title' | 'originName' | 'destinationName'>): string {
  if (eingabe.title) return eingabe.title
  return `${eingabe.originName} → ${eingabe.destinationName}`
}
