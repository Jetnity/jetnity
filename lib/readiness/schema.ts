// lib/readiness/schema.ts
//
// Untrusted Input für Nutzer-Vorbereitungsstand.
// Offizielle Evidence vom Browser wird nicht angenommen.

import { z } from 'zod'

import {
  READINESS_EVIDENCES,
  READINESS_KINDS,
  READINESS_USER_STATUSES,
  type TripReadinessItem,
} from '@/types/trips'
import { READINESS_GRENZEN, landescodeLesen } from '@/lib/readiness/domain'

const zeitstempel = z.string().min(1).max(40)

const landescode = z
  .unknown()
  .transform((wert, ctx) => {
    if (wert == null || wert === '') return null
    const code = landescodeLesen(wert)
    if (!code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ländercode muss zwei Grossbuchstaben haben',
      })
      return z.NEVER
    }
    return code
  })

const titel = z
  .string()
  .transform((wert) => wert.trim())
  .pipe(z.string().min(1).max(READINESS_GRENZEN.titel))
  .refine((wert) => !enthaltSensitiveDaten(wert), {
    message: 'Keine Passnummern, Ausweisdaten oder andere sensible Daten eintragen.',
  })
  .refine((wert) => !/https?:\/\//i.test(wert) && !/<\/?[a-z][\s\S]*>/i.test(wert), {
    message: 'Der Titel darf keine Links oder HTML enthalten.',
  })

const SENSIBLE_TITEL_MUSTER = [
  /\bpass(nummer|nr|no|id)?\b/i,
  /\bpassport\b/i,
  /\bausweis/i,
  /\bvisa[\s-]?nr/i,
  /\bvisum[\s-]?nr/i,
  /\bgeburt/i,
  /\bdate of birth\b/i,
  /\bsozialvers/i,
  /\bkreditkarte/i,
  /\bcard\s*number\b/i,
  /\bführerschein/i,
  /\bdrivers?\s*licen[cs]e\b/i,
  /\bimpf/i,
  /\bvaccin/i,
  /\d{6,}/,
] as const

export function enthaltSensitiveDaten(wert: string): boolean {
  return SENSIBLE_TITEL_MUSTER.some((muster) => muster.test(wert))
}

const readinessItemSchema = z
  .object({
    id: z.string().min(1).max(80),
    clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef),
    kind: z.enum(READINESS_KINDS),
    userStatus: z.enum(READINESS_USER_STATUSES),
    evidence: z.enum(READINESS_EVIDENCES).default('user'),
    countryCode: landescode.nullable().default(null),
    tripItemId: z.string().min(1).max(80).nullable().default(null),
    title: titel.nullable().default(null),
    contextFingerprint: z.string().min(1).max(READINESS_GRENZEN.fingerprint),
    createdAt: zeitstempel,
    updatedAt: zeitstempel,
  })
  .transform((item) => {
    const preparation = item.kind === 'preparation'
    return {
      ...item,
      evidence: 'user' as const,
      title: preparation ? item.title : null,
      countryCode: item.countryCode,
    } satisfies TripReadinessItem
  })
  .superRefine((item, ctx) => {
    if (item.kind === 'preparation' && !item.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Eine eigene Vorbereitung braucht einen kurzen Titel.',
      })
    }
  })

export const readinessItemsSchema = z
  .array(readinessItemSchema)
  .max(READINESS_GRENZEN.itemsJeReise)
  .default([])
  .transform((items) => {
    const gesehen = new Set<string>()
    const eindeutig: TripReadinessItem[] = []
    for (const item of items) {
      if (gesehen.has(item.clientRef)) continue
      gesehen.add(item.clientRef)
      eindeutig.push(item)
    }
    return eindeutig
  })

export const readinessEingabeSchema = z.object({
  clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef).optional(),
  kind: z.enum(READINESS_KINDS),
  userStatus: z.enum(READINESS_USER_STATUSES),
  countryCode: landescode.nullable().optional().default(null),
  tripItemId: z.string().min(1).max(80).nullable().optional().default(null),
  title: z
    .string()
    .max(READINESS_GRENZEN.titel)
    .nullable()
    .optional()
    .transform((wert, ctx) => {
      if (wert == null) return null
      const titelWert = wert.trim()
      if (titelWert === '') return null
      if (enthaltSensitiveDaten(titelWert) || /https?:\/\//i.test(titelWert) || /<\/?[a-z][\s\S]*>/i.test(titelWert)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Keine Passnummern, Ausweisdaten oder andere sensible Daten eintragen.',
        })
        return z.NEVER
      }
      return titelWert
    }),
})

export type ReadinessEingabe = z.infer<typeof readinessEingabeSchema>

export const readinessKontoEingabeSchema = readinessEingabeSchema.extend({
  tripId: z.string().uuid(),
  clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef),
})

export const readinessKontoLoeschenSchema = z.object({
  tripId: z.string().uuid(),
  clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef),
})

const readinessUebernahmeItemSchema = z.object({
  clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef),
  kind: z.enum(READINESS_KINDS),
  userStatus: z.enum(READINESS_USER_STATUSES),
  countryCode: landescode.nullable().default(null),
  title: titel.nullable().default(null),
  itemKind: z.string().min(1).max(40).nullable().optional().default(null),
  itemStartsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
  itemEndsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
  itemTitle: z.string().max(120).nullable().optional().default(null),
})

export type ReadinessUebernahmeItem = z.infer<typeof readinessUebernahmeItemSchema>

export const readinessUebernahmeSchema = z.object({
  tripId: z.string().uuid(),
  items: z.array(readinessUebernahmeItemSchema).max(READINESS_GRENZEN.itemsJeReise),
})

export const readinessAnforderungAnfrageSchema = z.object({
  destinationCountryCode: landescode.nullable().optional().default(null),
  travellers: z.number().int().min(1).max(20).optional().default(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
})

export function readinessItemLesen(wert: unknown): TripReadinessItem | null {
  const ergebnis = readinessItemSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function readinessItemsLesen(wert: unknown): TripReadinessItem[] {
  const ergebnis = readinessItemsSchema.safeParse(wert ?? [])
  return ergebnis.success ? ergebnis.data : []
}
