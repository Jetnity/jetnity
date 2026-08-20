// lib/hotels/schema.ts
//
// Laufzeitprüfung der Hotelsuche und der übernommenen Momentaufnahme.
// Beides kommt aus dem Browser und ist untrusted input.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import { HOTEL_SUCHE_GRENZEN, type HotelOption, type HotelSuchanfrage } from '@/lib/hotels/domain'
import { TRIP_INTERESTS, TRIP_PACES } from '@/types/trips'

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
  arrivalDate: datum.nullable().default(null),
  departureDate: datum.nullable().default(null),
})

const reiseKontextSchema = z.object({
  startDate: datum.nullable().default(null),
  endDate: datum.nullable().default(null),
  travellers: z.number().int().min(1).max(20),
  currency: waehrung.default('CHF'),
  budgetAmount: betrag.nullable().default(null),
  interests: z.array(z.enum(TRIP_INTERESTS)).max(8).default([]),
  pace: z.enum(TRIP_PACES).nullable().default(null),
})

const flugKontextSchema = z.object({
  startsOn: datum.nullable().default(null),
  startsAt: uhrzeit.nullable().default(null),
})

/**
 * Die Suchanfrage aus dem Reise-Arbeitsbereich.
 * Enthält nur vertrauenswürdige Reisedaten, keine Wegezeiten und keine POIs.
 */
export const hotelSucheEingabeSchema = z
  .object({
    stage: etappeSchema,
    trip: reiseKontextSchema,
    rooms: z
      .number()
      .int()
      .min(HOTEL_SUCHE_GRENZEN.zimmer.min)
      .max(HOTEL_SUCHE_GRENZEN.zimmer.max)
      .default(1),
    children: z
      .number()
      .int()
      .min(HOTEL_SUCHE_GRENZEN.kinder.min)
      .max(HOTEL_SUCHE_GRENZEN.kinder.max)
      .default(0),
    flights: z.array(flugKontextSchema).max(20).default([]),
  })
  .superRefine((wert, ctx) => {
    const erwachsene = wert.trip.travellers
    if (erwachsene < HOTEL_SUCHE_GRENZEN.erwachsene.min || erwachsene > HOTEL_SUCHE_GRENZEN.erwachsene.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trip', 'travellers'],
        message: `Eine Hotelsuche trägt ${HOTEL_SUCHE_GRENZEN.erwachsene.min} bis ${HOTEL_SUCHE_GRENZEN.erwachsene.max} Erwachsene.`,
      })
    }
  })

export type HotelSucheEingabe = z.infer<typeof hotelSucheEingabeSchema>

const hotelPraeferenzenSchema = z.object({
  budgetProNachtMax: betrag.nullable().default(null),
  mindestSterne: z.number().int().min(1).max(5).nullable().default(null),
  fruehstueckBevorzugt: z.boolean().nullable().default(null),
  stornierbarBevorzugt: z.boolean().nullable().default(null),
})

export const hotelSuchanfrageSchema = z
  .object({
    destinationPlaceId: z.string().trim().min(1).max(80),
    checkIn: datum,
    checkOut: datum,
    rooms: z.number().int().min(HOTEL_SUCHE_GRENZEN.zimmer.min).max(HOTEL_SUCHE_GRENZEN.zimmer.max),
    adults: z.number().int().min(HOTEL_SUCHE_GRENZEN.erwachsene.min).max(HOTEL_SUCHE_GRENZEN.erwachsene.max),
    children: z.number().int().min(HOTEL_SUCHE_GRENZEN.kinder.min).max(HOTEL_SUCHE_GRENZEN.kinder.max),
    currency: waehrung,
    quartier: z
      .object({
        id: z.string().trim().min(1).max(80),
        name: z.string().trim().min(1).max(120),
        zentrum: geoPunkt,
      })
      .nullable(),
    preferences: hotelPraeferenzenSchema,
  })
  .refine((wert) => wert.checkIn < wert.checkOut, {
    message: 'Das Abreisedatum muss nach der Anreise liegen.',
    path: ['checkOut'],
  })

export type GepruefteHotelSuchanfrage = z.infer<typeof hotelSuchanfrageSchema>

const hotelOptionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  provider: z.string().trim().min(1).max(40),
  externalRef: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(160),
  punkt: geoPunkt,
  quartierName: z.string().trim().min(1).max(120).nullable().default(null),
  adresse: z.string().trim().min(1).max(240).nullable().default(null),
  sterne: z.number().int().min(1).max(5).nullable().default(null),
  bewertung: z.number().finite().min(0).max(10).nullable().default(null),
  bewertungenAnzahl: z.number().int().min(0).max(10_000_000).nullable().default(null),
  preisGesamt: betrag,
  preisProNacht: betrag,
  preisWaehrung: waehrung,
  steuernEnthalten: z.boolean().nullable().default(null),
  stornierbar: z.boolean().nullable().default(null),
  stornierungBis: z.string().trim().min(1).max(40).nullable().default(null),
  fruehstueckEnthalten: z.boolean().nullable().default(null),
  zimmerName: z.string().trim().min(1).max(120).nullable().default(null),
})

export type GepruefteHotelOption = z.infer<typeof hotelOptionSchema>

export function hotelSucheEingabeLesen(wert: unknown): HotelSucheEingabe | null {
  const ergebnis = hotelSucheEingabeSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function hotelSuchanfrageLesen(wert: unknown): HotelSuchanfrage | null {
  const ergebnis = hotelSuchanfrageSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function hotelOptionLesen(wert: unknown): HotelOption | null {
  const ergebnis = hotelOptionSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function ersteHotelmeldung(fehler: z.ZodError): string {
  return fehler.issues[0]?.message ?? 'Die Hotelangaben sind unvollständig.'
}

export const hotelKontoUebernahmeSchema = z
  .object({
    tripId: z.string().uuid(),
    stageId: z.string().uuid(),
    dayId: z.string().uuid().nullable(),
    checkIn: datum,
    checkOut: datum,
    option: hotelOptionSchema,
  })
  .refine((wert) => wert.checkIn < wert.checkOut, {
    message: 'Das Abreisedatum muss nach der Anreise liegen.',
    path: ['checkOut'],
  })
