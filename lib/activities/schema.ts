// lib/activities/schema.ts
//
// Laufzeitprüfung der Aktivitätensuche und der Konto-Übernahme.
// Beides kommt aus dem Browser und ist untrusted input.
// Die Übernahme trägt nur identifiers; kommerzielle Fakten kommen serverseitig.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import { ACTIVITY_SUCHE_GRENZEN, type ActivityOption, type ActivitySuchanfrage } from '@/lib/activities/domain'
import { TRIP_INTERESTS, TRIP_ITEM_KINDS, TRIP_PACES } from '@/types/trips'

const datum = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss die Form JJJJ-MM-TT haben.')
  .refine((wert) => {
    const [jahr, monat, tag] = wert.split('-').map(Number)
    const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
    return (
      geprueft.getUTCFullYear() === jahr &&
      geprueft.getUTCMonth() === monat - 1 &&
      geprueft.getUTCDate() === tag
    )
  }, 'Dieses Datum gibt es nicht.')

const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Uhrzeit muss die Form HH:MM haben.')

const waehrung = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{3}$/, 'Währung muss ein ISO-4217-Code sein.'))

const betrag = z
  .number()
  .finite()
  .nonnegative()
  .max(9_999_999_999.99, 'Der Betrag ist zu gross.')
  .transform((wert) => Math.round(wert * 100) / 100)

const geoPunkt = z.object({
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
})

const etappeSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  placeId: z.string().trim().min(1).max(80).nullable().default(null),
  latitude: z.number().finite().min(-90).max(90).nullable().default(null),
  longitude: z.number().finite().min(-180).max(180).nullable().default(null),
})

const tagSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    dayDate: datum.nullable().default(null),
    stageId: z.string().trim().min(1).max(80).nullable().default(null),
  })
  .nullable()
  .default(null)

const reiseKontextSchema = z.object({
  startDate: datum.nullable().default(null),
  endDate: datum.nullable().default(null),
  travellers: z
    .number()
    .int()
    .min(ACTIVITY_SUCHE_GRENZEN.teilnehmer.min)
    .max(ACTIVITY_SUCHE_GRENZEN.teilnehmer.max),
  currency: waehrung.default('CHF'),
  budgetAmount: betrag.nullable().default(null),
  interests: z.array(z.enum(TRIP_INTERESTS)).max(8).default([]),
  pace: z.enum(TRIP_PACES).nullable().default(null),
})

const bestehenderPunktSchema = z.object({
  id: z.string().trim().min(1).max(80),
  kind: z.enum(TRIP_ITEM_KINDS),
  title: z.string().trim().min(1).max(120),
  startsOn: datum.nullable().default(null),
  startsAt: uhrzeit.nullable().default(null),
  endsOn: datum.nullable().default(null),
  endsAt: uhrzeit.nullable().default(null),
})

/**
 * Die Suchanfrage aus dem Reise-Arbeitsbereich.
 * Enthält nur vorhandene Reisedaten, keine Wegezeiten und keine Öffnungszeiten.
 */
export const activitySucheEingabeSchema = z.object({
  stage: etappeSchema,
  day: tagSchema,
  trip: reiseKontextSchema,
  items: z.array(bestehenderPunktSchema).max(40).default([]),
})

export type ActivitySucheEingabe = z.infer<typeof activitySucheEingabeSchema>

const activityTimeslotSchema = z.object({
  startsOn: datum,
  startsAt: uhrzeit,
  endsOn: datum.nullable().default(null),
  endsAt: uhrzeit.nullable().default(null),
})

const activitySuchanfrageSchema = z.object({
  destinationPlaceId: z.string().trim().min(1).max(80),
  destinationName: z.string().trim().min(1).max(120),
  dayDate: datum.nullable(),
  participants: z
    .number()
    .int()
    .min(ACTIVITY_SUCHE_GRENZEN.teilnehmer.min)
    .max(ACTIVITY_SUCHE_GRENZEN.teilnehmer.max),
  currency: waehrung,
  budgetAmount: betrag.nullable(),
  interests: z.array(z.enum(TRIP_INTERESTS)).max(8),
  pace: z.enum(TRIP_PACES).nullable(),
})

export type GepruefteActivitySuchanfrage = z.infer<typeof activitySuchanfrageSchema>

const activityOptionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  provider: z.string().trim().min(1).max(40),
  externalRef: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(800).nullable().default(null),
  locationName: z.string().trim().min(1).max(160).nullable().default(null),
  punkt: geoPunkt.nullable().default(null),
  dauerMinuten: z.number().int().min(1).max(24 * 60).nullable().default(null),
  timeslot: activityTimeslotSchema.nullable().default(null),
  preis: betrag.nullable().default(null),
  preisWaehrung: waehrung.nullable().default(null),
  bewertung: z.number().finite().min(0).max(10).nullable().default(null),
  bewertungenAnzahl: z.number().int().min(0).max(10_000_000).nullable().default(null),
  stornierbar: z.boolean().nullable().default(null),
  kategorien: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(16).default([]),
})
  .superRefine((wert, ctx) => {
    if ((wert.preis === null) !== (wert.preisWaehrung === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preisWaehrung'],
        message: 'Preis und Währung gehören zusammen.',
      })
    }
  })

export type GepruefteActivityOption = z.infer<typeof activityOptionSchema>

export function activitySucheEingabeLesen(wert: unknown): ActivitySucheEingabe | null {
  const ergebnis = activitySucheEingabeSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function activitySuchanfrageLesen(wert: unknown): ActivitySuchanfrage | null {
  const ergebnis = activitySuchanfrageSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function activityOptionLesen(wert: unknown): ActivityOption | null {
  const ergebnis = activityOptionSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function ersteActivitymeldung(fehler: z.ZodError): string {
  return fehler.issues[0]?.message ?? 'Die Aktivitätsangaben sind unvollständig.'
}

/**
 * Konto-Übernahme: nur identifiers. Kommerzielle Fakten und der Termin
 * kommen serverseitig aus Nachweis und Reisegraph.
 */
export const activityKontoUebernahmeSchema = z.object({
  tripId: z.string().uuid(),
  stageId: z.string().uuid(),
  dayId: z.string().uuid(),
  optionId: z.string().trim().min(1).max(200),
})
