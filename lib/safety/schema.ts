// lib/safety/schema.ts
//
// Untrusted Trip-Kontext. Official-/Safety-Evidence vom Browser wird verworfen.

import { z } from 'zod'

import { flugRouteItinerarySchema } from '@/lib/route/schema'
import { SAFETY_GRENZEN, safetyLandescode } from '@/lib/safety/domain'
import { istKalenderdatum } from '@/lib/safety/evidence'
import { TRIP_ITEM_KINDS } from '@/types/trips'

const datum = z
  .string()
  .refine(istKalenderdatum, { message: 'Datum muss ein gültiges Kalenderdatum sein.' })
  .nullable()

const id = z.string().trim().min(1).max(80)

const landescode = z
  .unknown()
  .transform((wert, ctx) => {
    if (wert == null || wert === '') return null
    const code = safetyLandescode(wert)
    if (!code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ländercode muss zwei Grossbuchstaben haben',
      })
      return z.NEVER
    }
    return code
  })

const name = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((wert) => !/<\/?[a-z][\s\S]*>/i.test(wert), { message: 'Kein HTML in Ortsnamen.' })

const etappeSchema = z.object({
  id,
  name,
  countryCode: landescode.nullable().default(null),
  placeId: z.string().trim().min(3).max(64).nullable().default(null),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  arrivalDate: datum.nullable().default(null),
  departureDate: datum.nullable().default(null),
})

const tagSchema = z.object({
  id,
  stageId: id.nullable().default(null),
  dayDate: datum.nullable().default(null),
})

const punktSchema = z.object({
  id,
  kind: z.enum(TRIP_ITEM_KINDS),
  title: name,
  stageId: id.nullable().default(null),
  dayId: id.nullable().default(null),
  startsOn: datum.nullable().default(null),
  endsOn: datum.nullable().default(null),
  originPlaceId: z.string().trim().min(3).max(64).nullable().default(null),
  destinationPlaceId: z.string().trim().min(3).max(64).nullable().default(null),
  routeItinerary: flugRouteItinerarySchema.nullable().optional(),
})

export const safetyAnfrageSchema = z
  .object({
    startDate: datum.nullable().optional(),
    endDate: datum.nullable().optional(),
    stages: z.array(etappeSchema).max(20).default([]),
    days: z.array(tagSchema).max(60).default([]),
    items: z.array(punktSchema).max(80).default([]),
    originPlaceId: z.string().trim().min(3).max(64).nullable().optional(),
    officialResult: z.unknown().optional(),
    llmResult: z.unknown().optional(),
    safetyFacts: z.unknown().optional(),
    evaluations: z.unknown().optional(),
  })
  .superRefine((wert, ctx) => {
    if (JSON.stringify(wert).length > SAFETY_GRENZEN.maxAnfrageBytes) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Die Anfrage ist zu gross.' })
    }
  })

export type SafetyAnfrage = z.infer<typeof safetyAnfrageSchema>
