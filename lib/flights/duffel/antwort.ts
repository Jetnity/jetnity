// lib/flights/duffel/antwort.ts
//
// Untrusted Provider-JSON. Nur die Felder, die das Mapping braucht.
// Zusätzliche Schlüssel fallen weg; fehlende Pflichtfelder verwerfen das Angebot.

import { z } from 'zod'

const iata = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{3}$/))

const airlineCode = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{2,3}$/))

const ortszeit = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)

const strukturierterOrt = z.object({
  iata_code: iata,
  /** Untrusted Providerfeld. Mapping entscheidet, ob daraus Evidence wird. */
  time_zone: z.unknown().optional(),
})

const ort = z.union([iata, strukturierterOrt])

const airline = z.object({
  iata_code: airlineCode,
  name: z.string().trim().min(1).max(80).optional(),
})

const gepack = z.object({
  type: z.string().optional(),
  quantity: z.number().int().min(0).max(9).optional(),
})

const duffelSegmentSchema = z.object({
  origin: ort,
  destination: ort,
  departing_at: ortszeit,
  arriving_at: ortszeit,
  duration: z.string().min(2).max(20).optional(),
  marketing_carrier: airline,
  operating_carrier: airline.optional(),
  marketing_carrier_flight_number: z
    .union([z.string(), z.number()])
    .transform((wert) => String(wert).trim()),
  passengers: z
    .array(
      z.object({
        cabin_class: z.string().optional(),
        baggages: z.array(gepack).optional(),
      }),
    )
    .optional(),
})

const duffelSliceSchema = z.object({
  duration: z.string().min(2).max(20),
  fare_brand_name: z.string().trim().min(1).max(40).nullable().optional(),
  segments: z.array(duffelSegmentSchema).min(1).max(8),
})

export const duffelAngebotSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((wert) => String(wert).trim()),
  total_amount: z.string().min(1).max(20),
  total_currency: z
    .string()
    .trim()
    .transform((wert) => wert.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{3}$/)),
  owner: airline.optional(),
  slices: z.array(duffelSliceSchema).min(1).max(6),
  conditions: z
    .object({
      refund_before_departure: z
        .object({
          allowed: z.boolean().optional(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
})

export type DuffelAngebot = z.infer<typeof duffelAngebotSchema>

export function duffelIataAus(ortWert: z.infer<typeof ort>): string {
  return typeof ortWert === 'string' ? ortWert : ortWert.iata_code
}

/** Nur das strukturierte Airport-Objekt darf ein Timezone-Rohfeld tragen. */
export function duffelTimeZoneRohAus(ortWert: z.infer<typeof ort>): unknown {
  return typeof ortWert === 'string' ? undefined : ortWert.time_zone
}
