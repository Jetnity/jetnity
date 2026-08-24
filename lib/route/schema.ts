// lib/route/schema.ts
//
// Laufzeitprüfung der Route-Itinerary-Momentaufnahme.
//
// Die Aufnahme kann aus dem Browser, dem Local Storage oder metadata kommen.
// Nur strukturell gültige IATA-/Zeit-/Ländercodes dürfen Route Truth werden.
// `surfaceFromAirportCode` ist kein untrusted Intake-Feld: Clientbehauptungen
// werden verworfen. Die Trusted-Lesefunktion darf das Feld nur an bereits
// typisierten oder serverseitig belegten Objekten lesen. Ohne solche Quelle
// bleibt die Lücke unknown.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import type { FlugRouteItinerary, RoutePunkt, RouteSegment } from '@/lib/route/domain'

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

const segmentSchema = z.object(segmentFelder)

const trustedSegmentSchema = z.object({
  ...segmentFelder,
  surfaceFromAirportCode: iata.nullable().optional(),
})

function itinerarySchema(segment: typeof segmentSchema | typeof trustedSegmentSchema) {
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

export function flugRouteItineraryLesen(wert: unknown): FlugRouteItinerary | null {
  const ergebnis = flugRouteItinerarySchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

/** Nur für bereits typisierte oder serverseitig belegte Itineraries. */
export function flugRouteItineraryTrustedLesen(wert: unknown): FlugRouteItinerary | null {
  const ergebnis = flugRouteItineraryTrustedSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}
