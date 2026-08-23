// lib/seasonal/schema.ts
//
// Untrusted Trip-Kontext. Browser-/LLM-Evidence wird verworfen.

import { z } from 'zod'

import { flugRouteItinerarySchema } from '@/lib/route/schema'
import { SEASONAL_GRENZEN, seasonalLandescode } from '@/lib/seasonal/domain'
import { istKalenderdatum } from '@/lib/seasonal/kalender'
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
    const code = seasonalLandescode(wert)
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

export const seasonalAnfrageSchema = z
  .object({
    startDate: datum.nullable().optional(),
    endDate: datum.nullable().optional(),
    stages: z.array(etappeSchema).max(20).default([]),
    days: z.array(tagSchema).max(60).default([]),
    items: z.array(punktSchema).max(80).default([]),
    originPlaceId: z.string().trim().min(3).max(64).nullable().optional(),
    officialResult: z.unknown().optional(),
    llmResult: z.unknown().optional(),
    seasonalFacts: z.unknown().optional(),
    evaluations: z.unknown().optional(),
    citizenships: z.unknown().optional(),
    documents: z.unknown().optional(),
  })
  .superRefine((wert, ctx) => {
    if (JSON.stringify(wert).length > SEASONAL_GRENZEN.maxAnfrageBytes) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Die Anfrage ist zu gross.' })
    }

    const stageIds = new Set<string>()
    for (const etappe of wert.stages) {
      if (stageIds.has(etappe.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['stages'], message: 'Stage-IDs müssen eindeutig sein.' })
        break
      }
      stageIds.add(etappe.id)
    }

    const dayIds = new Set<string>()
    for (const tag of wert.days) {
      if (dayIds.has(tag.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['days'], message: 'Day-IDs müssen eindeutig sein.' })
        break
      }
      dayIds.add(tag.id)
      if (tag.stageId && !stageIds.has(tag.stageId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['days'],
          message: 'day.stageId muss auf eine vorhandene Stage zeigen.',
        })
      }
    }

    const itemIds = new Set<string>()
    for (const punkt of wert.items) {
      if (itemIds.has(punkt.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items'], message: 'Item-IDs müssen eindeutig sein.' })
        break
      }
      itemIds.add(punkt.id)
      if (punkt.stageId && !stageIds.has(punkt.stageId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items'],
          message: 'item.stageId muss auf eine vorhandene Stage zeigen.',
        })
      }
      if (punkt.dayId && !dayIds.has(punkt.dayId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items'],
          message: 'item.dayId muss auf einen vorhandenen Tag zeigen.',
        })
      }
      if (punkt.dayId && punkt.stageId) {
        const tag = wert.days.find((eintrag) => eintrag.id === punkt.dayId)
        if (tag?.stageId && tag.stageId !== punkt.stageId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['items'],
            message: 'item.stageId und day.stageId müssen übereinstimmen.',
          })
        }
      }
    }
  })

export type SeasonalAnfrage = z.infer<typeof seasonalAnfrageSchema>
