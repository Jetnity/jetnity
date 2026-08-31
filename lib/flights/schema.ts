// lib/flights/schema.ts
//
// Laufzeitprüfung der Flugsuche und der übernommenen Momentaufnahme.
//
// Die Suchanfrage kommt aus dem Browser. Die Konto-Übernahme trägt nur
// identifiers; kommerzielle Flugfakten und optionale Timezone-Provenance
// kommen serverseitig aus dem Nachweis. Der Adapter prüft Providerantworten
// extra; hier steht die Jetnity-Form. Ungültige Timezone wird `null`.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import {
  FLUG_KABINEN,
  FLUG_STOPP_PRAEFERENZEN,
  FLUG_SUCHE_GRENZEN,
  type FlugOption,
  type FlugSuchanfrage,
} from '@/lib/flights/domain'
import { ianaZeitzoneLesen } from '@/lib/flights/zeitzone'

const iata = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{3}$/, 'Ein Flughafen braucht einen IATA-Code aus drei Buchstaben.'))

const airlineCode = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{2,3}$/, 'Eine Airline braucht einen IATA-Code aus zwei oder drei Zeichen.'))

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

const zeitzoneOderNull = z.unknown().optional().transform((wert) => ianaZeitzoneLesen(wert ?? null))

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

const beinSchema = z
  .object({
    origin: iata,
    destination: iata,
    date: datum,
  })
  .refine((bein) => bein.origin !== bein.destination, {
    message: 'Abflug und Ankunft dürfen nicht derselbe Flughafen sein.',
    path: ['destination'],
  })

const passagiereSchema = z
  .object({
    adults: z.number().int().min(FLUG_SUCHE_GRENZEN.erwachsene.min).max(FLUG_SUCHE_GRENZEN.erwachsene.max),
    children: z.number().int().min(FLUG_SUCHE_GRENZEN.kinder.min).max(FLUG_SUCHE_GRENZEN.kinder.max).default(0),
    infants: z.number().int().min(FLUG_SUCHE_GRENZEN.sauglinge.min).max(FLUG_SUCHE_GRENZEN.sauglinge.max).default(0),
  })
  .superRefine((wert, ctx) => {
    const gesamt = wert.adults + wert.children + wert.infants
    if (gesamt < FLUG_SUCHE_GRENZEN.personenGesamt.min || gesamt > FLUG_SUCHE_GRENZEN.personenGesamt.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Eine Suche trägt ${FLUG_SUCHE_GRENZEN.personenGesamt.min} bis ${FLUG_SUCHE_GRENZEN.personenGesamt.max} Personen.`,
      })
    }
    if (wert.infants > wert.adults) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['infants'],
        message: 'Mehr Säuglinge als Erwachsene sind nicht möglich.',
      })
    }
  })

const kontextSchema = z.object({
  tripStartDate: datum.nullable().default(null),
  tripEndDate: datum.nullable().default(null),
  selectedDate: datum.nullable().default(null),
})

export const flugSuchanfrageSchema = z.object({
  legs: z
    .array(beinSchema)
    .min(FLUG_SUCHE_GRENZEN.beine.min, 'Mindestens eine Teilstrecke ist nötig.')
    .max(FLUG_SUCHE_GRENZEN.beine.max, `Höchstens ${FLUG_SUCHE_GRENZEN.beine.max} Teilstrecken.`),
  passengers: passagiereSchema,
  cabin: z.enum(FLUG_KABINEN).default('economy'),
  stopPreference: z.enum(FLUG_STOPP_PRAEFERENZEN).default('any'),
  currency: waehrung.default('CHF'),
  context: kontextSchema.default({
    tripStartDate: null,
    tripEndDate: null,
    selectedDate: null,
  }),
})

export type GepruefteFlugSuchanfrage = z.infer<typeof flugSuchanfrageSchema>

const segmentSchema = z.object({
  origin: iata,
  destination: iata,
  departureDate: datum,
  departureTime: uhrzeit,
  arrivalDate: datum,
  arrivalTime: uhrzeit,
  departureTimezone: zeitzoneOderNull,
  arrivalTimezone: zeitzoneOderNull,
  airline: airlineCode,
  airlineName: z.string().trim().min(1).max(80),
  operatingAirline: airlineCode.nullable().default(null),
  operatingAirlineName: z.string().trim().min(1).max(80).nullable().default(null),
  flightNumber: z.string().trim().min(1).max(10),
  durationMinutes: z.number().int().min(1).max(20_000),
})

const teilstreckeSchema = z.object({
  segments: z.array(segmentSchema).min(1).max(8),
  durationMinutes: z.number().int().min(1).max(40_000),
  stops: z.number().int().min(0).max(7),
})

/**
 * Die Momentaufnahme, die in die Reise darf.
 *
 * Bewusst ohne Provider-Rohdaten, ohne Token und ohne interne Ranking-Zahlen.
 * `bookingUrl` gehört nicht hierher: Die Suchschicht erzeugt keinen Deeplink.
 */
const flugOptionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  provider: z.string().trim().min(1).max(40),
  externalRef: z.string().trim().min(1).max(200),
  airline: airlineCode,
  airlineName: z.string().trim().min(1).max(80),
  legs: z.array(teilstreckeSchema).min(1).max(FLUG_SUCHE_GRENZEN.beine.max),
  durationMinutes: z.number().int().min(1).max(80_000),
  stops: z.number().int().min(0).max(20),
  priceAmount: betrag,
  priceCurrency: waehrung,
  cabin: z.enum(FLUG_KABINEN).nullable().default(null),
  baggage: z
    .object({ checkedBags: z.number().int().min(0).max(9).nullable() })
    .nullable()
    .default(null),
  refundable: z.boolean().nullable().default(null),
  fare: z.object({ brandedFare: z.string().trim().min(1).max(40).nullable() }).nullable().default(null),
})

export type GepruefteFlugOption = z.infer<typeof flugOptionSchema>

export function flugSuchanfrageLesen(wert: unknown): FlugSuchanfrage | null {
  const ergebnis = flugSuchanfrageSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function flugOptionLesen(wert: unknown): FlugOption | null {
  const ergebnis = flugOptionSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function ersteFlugmeldung(fehler: z.ZodError): string {
  return fehler.issues[0]?.message ?? 'Die Flugangaben sind unvollständig.'
}

/**
 * Konto-Übernahme: nur identifiers. Kommerzielle Fakten, Zeiten und der
 * Suchkontext kommen serverseitig aus Nachweis und Reisegraph.
 */
export const flugKontoUebernahmeSchema = z.object({
  tripId: z.string().uuid(),
  dayId: z.string().uuid().nullable().default(null),
  optionId: z.string().trim().min(1).max(200),
})
