// lib/rental-cars/schema.ts
//
// Laufzeitprüfung der Mietwagensuche und der manuellen Erfassung.
// Der Browser ist untrusted input. Frei von Next und Supabase.

import { z } from 'zod'

import { RENTAL_SUCHE_GRENZEN } from '@/lib/rental-cars/domain'
import { TRANSMISSIONS, VEHICLE_CLASSES } from '@/types/trips'

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
  .pipe(z.string().min(1, 'Abholung und Rückgabe brauchen einen Namen').max(RENTAL_SUCHE_GRENZEN.titel))

const optionalerOrt = z
  .string()
  .transform((wert) => wert.trim())
  .pipe(z.string().max(80))
  .transform((wert) => (wert === '' ? null : wert))

function tageZwischen(von: string, bis: string): number {
  const einTag = 86_400_000
  return Math.round((Date.parse(`${bis}T00:00:00Z`) - Date.parse(`${von}T00:00:00Z`)) / einTag)
}

function zeitraumPruefen(
  wert: {
    pickupOn: string | null
    pickupAt: string | null
    dropoffOn: string | null
    dropoffAt: string | null
  },
  ctx: z.RefinementCtx,
) {
  if (wert.dropoffOn && !wert.pickupOn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pickupOn'],
      message: 'Eine Rückgabe braucht ein Abholdatum.',
    })
  }
  if (wert.dropoffAt && !wert.pickupAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pickupAt'],
      message: 'Eine Rückgabezeit braucht eine Abholzeit.',
    })
  }
  if (wert.pickupAt && !wert.pickupOn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pickupOn'],
      message: 'Eine Abholzeit braucht ein Abholdatum.',
    })
  }
  if (wert.dropoffAt && !wert.dropoffOn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dropoffOn'],
      message: 'Eine Rückgabezeit braucht ein Rückgabedatum.',
    })
  }
  if (!wert.pickupOn || !wert.dropoffOn) return

  if (wert.dropoffOn < wert.pickupOn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dropoffOn'],
      message: 'Die Rückgabe liegt vor der Abholung.',
    })
    return
  }

  if (tageZwischen(wert.pickupOn, wert.dropoffOn) > RENTAL_SUCHE_GRENZEN.dauerInTagen) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dropoffOn'],
      message: `Ein Mietwagen dauert höchstens ${RENTAL_SUCHE_GRENZEN.dauerInTagen} Tage.`,
    })
  }

  if (wert.pickupOn === wert.dropoffOn && wert.pickupAt && wert.dropoffAt) {
    if (wert.dropoffAt < wert.pickupAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dropoffAt'],
        message: 'Die Rückgabezeit liegt vor der Abholung.',
      })
    } else if (wert.dropoffAt === wert.pickupAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dropoffAt'],
        message: 'Abholung und Rückgabe dürfen nicht dieselbe Uhrzeit haben.',
      })
    }
  }
}

export const rentalCarSucheEingabeSchema = z
  .object({
    pickupName: ortsname,
    dropoffName: ortsname,
    pickupPlaceId: optionalerOrt.nullable().default(null),
    dropoffPlaceId: optionalerOrt.nullable().default(null),
    pickupOn: datum.nullable().default(null),
    pickupAt: uhrzeit.nullable().default(null),
    dropoffOn: datum.nullable().default(null),
    dropoffAt: uhrzeit.nullable().default(null),
    vehicleClass: z.enum(VEHICLE_CLASSES).nullable().default(null),
    transmission: z.enum(TRANSMISSIONS).nullable().default(null),
    currency: waehrung.default('CHF'),
  })
  .superRefine(zeitraumPruefen)

export type RentalCarSucheEingabe = z.infer<typeof rentalCarSucheEingabeSchema>

export const rentalCarManuellSchema = z
  .object({
    title: z
      .string()
      .transform((wert) => wert.trim())
      .pipe(z.string().max(RENTAL_SUCHE_GRENZEN.titel))
      .transform((wert) => (wert === '' ? null : wert))
      .nullable()
      .default(null),
    pickupName: ortsname,
    dropoffName: ortsname,
    pickupPlaceId: optionalerOrt.nullable().default(null),
    dropoffPlaceId: optionalerOrt.nullable().default(null),
    pickupOn: datum.nullable().default(null),
    pickupAt: uhrzeit.nullable().default(null),
    dropoffOn: datum.nullable().default(null),
    dropoffAt: uhrzeit.nullable().default(null),
    rentalSupplier: z
      .string()
      .transform((wert) => wert.trim())
      .pipe(z.string().max(RENTAL_SUCHE_GRENZEN.supplier))
      .transform((wert) => (wert === '' ? null : wert))
      .nullable()
      .default(null),
    vehicleClass: z.enum(VEHICLE_CLASSES).nullable().default(null),
    transmission: z.enum(TRANSMISSIONS).nullable().default(null),
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
    zeitraumPruefen(wert, ctx)
  })

export type RentalCarManuellEingabe = z.infer<typeof rentalCarManuellSchema>

export function ersteRentalmeldung(fehler: z.ZodError): string {
  return fehler.issues[0]?.message ?? 'Die Angaben sind unvollständig.'
}

export function rentalTitelAus(
  eingabe: Pick<RentalCarManuellEingabe, 'title' | 'pickupName' | 'dropoffName'>,
): string {
  if (eingabe.title) return eingabe.title
  if (eingabe.pickupName === eingabe.dropoffName) return `Mietwagen ${eingabe.pickupName}`
  return `Mietwagen ${eingabe.pickupName} → ${eingabe.dropoffName}`
}

const optionalerBetrag = z
  .number()
  .finite()
  .nonnegative()
  .max(9_999_999_999.99)
  .nullable()
  .default(null)

const optionalerHinweis = z
  .string()
  .transform((wert) => wert.trim())
  .pipe(z.string().max(160))
  .transform((wert) => (wert === '' ? null : wert))
  .nullable()
  .default(null)

const rentalCarOptionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  provider: z.string().trim().min(1).max(40),
  externalRef: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(RENTAL_SUCHE_GRENZEN.titel),
  pickupName: ortsname,
  dropoffName: ortsname,
  pickupPlaceId: optionalerOrt.nullable().default(null),
  dropoffPlaceId: optionalerOrt.nullable().default(null),
  pickupOn: datum.nullable().default(null),
  pickupAt: uhrzeit.nullable().default(null),
  dropoffOn: datum.nullable().default(null),
  dropoffAt: uhrzeit.nullable().default(null),
  vehicleClass: z.enum(VEHICLE_CLASSES).nullable().default(null),
  transmission: z.enum(TRANSMISSIONS).nullable().default(null),
  supplierName: z
    .string()
    .transform((wert) => wert.trim())
    .pipe(z.string().max(RENTAL_SUCHE_GRENZEN.supplier))
    .transform((wert) => (wert === '' ? null : wert))
    .nullable()
    .default(null),
  preis: optionalerBetrag,
  preisIstGesamt: z.boolean().nullable().default(null),
  preisWaehrung: waehrung.nullable().default(null),
  kilometerRegel: optionalerHinweis,
  tankRegel: optionalerHinweis,
  storno: optionalerHinweis,
  kaution: optionalerBetrag,
  kautionWaehrung: waehrung.nullable().default(null),
})

export type GepruefteRentalCarOption = z.infer<typeof rentalCarOptionSchema>

export function rentalCarOptionLesen(wert: unknown): GepruefteRentalCarOption | null {
  const ergebnis = rentalCarOptionSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

/**
 * Konto-Übernahme: nur identifiers. Kommerzielle Fakten und der Suchkontext
 * kommen serverseitig aus Nachweis und Reise, nicht aus dem Browser.
 */
export const rentalCarKontoUebernahmeSchema = z.object({
  tripId: z.string().uuid(),
  optionId: z.string().trim().min(1).max(200),
})
