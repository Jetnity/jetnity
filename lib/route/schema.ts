// lib/route/schema.ts
//
// Laufzeitprüfung der Route-Itinerary-Momentaufnahme.
//
// Untrusted Intake (Browser, Local Storage, Guest) darf weder
// `surfaceFromAirportCode` noch Timezone-Felder als Hard Truth setzen.
// Serverseitig belegte persistierte Metadata darf explizite IANA-Timezone
// wiederlesen, aber weiterhin keine Surface-Evidence adeln.
// Die Trusted-Lesefunktion darf Surface und Timezone nur an bereits
// typisierten oder serverseitig belegten Objekten lesen.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import { ianaZeitzoneLesen } from '@/lib/flights/zeitzone'
import type { FlugRouteItinerary } from '@/lib/route/domain'

const iata = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{3}$/))

const landescode = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{2}$/))

const datum = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((wert) => {
    const [jahr, monat, tag] = wert.split('-').map(Number)
    const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
    return (
      geprueft.getUTCFullYear() === jahr &&
      geprueft.getUTCMonth() === monat - 1 &&
      geprueft.getUTCDate() === tag
    )
  })

const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const anzeigeText = z
  .string()
  .trim()
  .max(120)
  .transform((wert) => (wert === '' ? null : wert))

const punktSchema = z.object({
  airportCode: iata.nullable().default(null),
  countryCode: landescode.nullable().default(null),
  city: anzeigeText.nullable().default(null),
  country: anzeigeText.nullable().default(null),
})

const segmentFelder = {
  origin: punktSchema,
  destination: punktSchema,
  departureDate: datum.nullable().default(null),
  departureTime: uhrzeit.nullable().default(null),
  arrivalDate: datum.nullable().default(null),
  arrivalTime: uhrzeit.nullable().default(null),
}

const zeitzoneOptional = z.unknown().optional().transform((wert) => {
  if (wert === undefined) return undefined
  return ianaZeitzoneLesen(wert) ?? undefined
})

const zeitzoneFelder = {
  departureTimezone: zeitzoneOptional,
  arrivalTimezone: zeitzoneOptional,
}

const segmentSchema = z.object(segmentFelder)

const timezoneSegmentSchema = z.object({
  ...segmentFelder,
  ...zeitzoneFelder,
})

const trustedSegmentSchema = z.object({
  ...segmentFelder,
  surfaceFromAirportCode: iata.nullable().optional(),
  ...zeitzoneFelder,
})

function itinerarySchema(segment: z.ZodTypeAny) {
  return z.object({
    v: z.literal(1),
    type: z.literal('flight_route_itinerary'),
    legs: z
      .array(
        z.object({
          segments: z.array(segment).min(1).max(8),
        }),
      )
      .min(1)
      .max(6),
  })
}

export const flugRouteItinerarySchema = itinerarySchema(segmentSchema).transform(
  (wert): FlugRouteItinerary => wert,
)
const flugRouteItineraryTrustedSchema = itinerarySchema(trustedSegmentSchema)
const flugRouteItineraryTrustedTimezoneSchema = itinerarySchema(timezoneSegmentSchema)

export function flugRouteItineraryLesen(wert: unknown): FlugRouteItinerary | null {
  const ergebnis = flugRouteItinerarySchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

/** Nur für bereits typisierte oder serverseitig belegte Itineraries. */
export function flugRouteItineraryTrustedLesen(wert: unknown): FlugRouteItinerary | null {
  const ergebnis = flugRouteItineraryTrustedSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

/**
 * Server-proven persistierte Metadata: Timezone ja, Surface-Evidence nein.
 * Untrusted Intake muss `flugRouteItineraryLesen` verwenden.
 */
export function flugRouteItineraryTrustedTimezoneLesen(wert: unknown): FlugRouteItinerary | null {
  const ergebnis = flugRouteItineraryTrustedTimezoneSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}
