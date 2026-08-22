// lib/readiness/schema.ts
//
// Untrusted Input für Nutzer-Vorbereitungsstand.
// Offizielle Evidence vom Browser wird nicht angenommen.

import { z } from 'zod'

import {
  READINESS_EVIDENCES,
  READINESS_KINDS,
  READINESS_USER_STATUSES,
  TRAVELLER_DOCUMENT_TYPES,
  type TripReadinessItem,
  type TripTraveller,
} from '@/types/trips'
import { READINESS_GRENZEN, TRAVELLER_CONTEXT_GRENZEN, landescodeLesen } from '@/lib/readiness/domain'
import { travellerLegacyLesen } from '@/lib/readiness/traveller-kontext'

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
    travellerClientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef).nullable().optional().default(null),
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
      travellerClientRef: item.travellerClientRef ?? null,
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
    travellerClientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef).nullable().optional().default(null),
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
  travellerClientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef).nullable().optional().default(null),
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
  originCountryCode: landescode.nullable().optional().default(null),
  destinationCountryCode: landescode.nullable().optional().default(null),
  destinationCountryCodes: z
    .array(landescode)
    .max(12)
    .optional()
    .default([])
    .transform((codes) => codes.filter((code): code is string => Boolean(code))),
  transitCountryCodes: z
    .array(landescode)
    .max(12)
    .optional()
    .default([])
    .transform((codes) => codes.filter((code): code is string => Boolean(code))),
  travellers: z.number().int().min(1).max(20).optional().default(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
  party: z
    .array(z.unknown())
    .max(TRAVELLER_CONTEXT_GRENZEN.travellersJeReise)
    .optional()
    .default([])
    .transform((items, ctx) => {
      const gelesen: TripTraveller[] = []
      for (const item of items) {
        const traveller = travellerLegacyLesen(item)
        if (!traveller) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Mindestens eine Reisendenangabe ist ungültig.',
          })
          return z.NEVER
        }
        gelesen.push(traveller)
      }
      return gelesen
    }),
})

const citizenshipEingabeSchema = z.object({
  clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef).optional(),
  countryCode: landescode,
})

const documentEingabeSchema = z.object({
  clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef).optional(),
  documentType: z.enum(TRAVELLER_DOCUMENT_TYPES),
  issuingCountryCode: landescode.nullable().optional().default(null),
  expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
  citizenshipClientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef).nullable().optional().default(null),
})

export const travellerEingabeSchema = z
  .object({
    clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef),
    label: z
      .string()
      .max(40)
      .nullable()
      .optional()
      .transform((wert, ctx) => {
        if (wert == null) return null
        const label = wert.trim()
        if (label === '') return null
        if (enthaltSensitiveDaten(label) || /https?:\/\//i.test(label) || /<\/?[a-z][\s\S]*>/i.test(label)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Keine Passnummern, Ausweisdaten oder andere sensible Daten eintragen.',
          })
          return z.NEVER
        }
        return label
      }),
    residenceCountryCode: landescode.nullable().optional().default(null),
    citizenships: z.array(citizenshipEingabeSchema).max(TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller).optional(),
    documents: z.array(documentEingabeSchema).max(TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller).optional(),
    nationalityCountryCode: landescode.nullable().optional(),
    documentType: z.enum(TRAVELLER_DOCUMENT_TYPES).nullable().optional(),
    documentIssuingCountryCode: landescode.nullable().optional(),
    documentExpiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  })
  .transform((eingabe, ctx) => {
    const gelesen = travellerLegacyLesen({
      ...eingabe,
      id: eingabe.clientRef,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    if (!gelesen) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Diese Reisendenangabe ist ungültig.',
      })
      return z.NEVER
    }
    return {
      clientRef: gelesen.clientRef,
      label: eingabe.label ?? gelesen.label,
      residenceCountryCode: gelesen.residenceCountryCode,
      citizenships: gelesen.citizenships.map((eintrag) => ({
        clientRef: eintrag.clientRef,
        countryCode: eintrag.countryCode,
      })),
      documents: gelesen.documents.map((eintrag) => ({
        clientRef: eintrag.clientRef,
        documentType: eintrag.documentType,
        issuingCountryCode: eintrag.issuingCountryCode,
        expiresOn: eintrag.expiresOn,
        citizenshipClientRef: eintrag.citizenshipClientRef,
      })),
    }
  })
  .superRefine((eingabe, ctx) => {
    const laender = new Set<string>()
    for (const citizenship of eingabe.citizenships) {
      if (laender.has(citizenship.countryCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['citizenships'],
          message: 'Dieselbe Staatsbürgerschaft kann nur einmal erfasst werden.',
        })
      }
      laender.add(citizenship.countryCode)
    }
    const citizenshipRefs = new Set(eingabe.citizenships.map((eintrag) => eintrag.clientRef))
    for (const document of eingabe.documents) {
      if (document.citizenshipClientRef && !citizenshipRefs.has(document.citizenshipClientRef)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['documents'],
          message: 'Das Dokument muss zu einer Staatsbürgerschaft derselben Person gehören.',
        })
      }
    }
  })

const travellerItemSchema = z.unknown().transform((wert, ctx) => {
  const gelesen = travellerLegacyLesen(wert)
  if (!gelesen) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Diese Reisendenangabe ist ungültig.',
    })
    return z.NEVER
  }
  return gelesen
})

export const partySchema = z
  .array(z.unknown())
  .max(TRAVELLER_CONTEXT_GRENZEN.travellersJeReise)
  .default([])
  .transform((items) => {
    const gesehen = new Set<string>()
    const eindeutig: TripTraveller[] = []
    for (const roh of items) {
      const item = travellerLegacyLesen(roh)
      if (!item || gesehen.has(item.clientRef)) continue
      gesehen.add(item.clientRef)
      eindeutig.push(item)
    }
    return eindeutig
  })

export const travellerKontoEingabeSchema = z
  .object({ tripId: z.string().uuid() })
  .passthrough()
  .transform((wert, ctx) => {
    const geprueft = travellerEingabeSchema.safeParse(wert)
    if (!geprueft.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: geprueft.error.issues[0]?.message ?? 'Diese Reisendenangabe ist ungültig.',
      })
      return z.NEVER
    }
    return { ...geprueft.data, tripId: wert.tripId }
  })

export const travellerKontoLoeschenSchema = z.object({
  tripId: z.string().uuid(),
  clientRef: z.string().min(1).max(READINESS_GRENZEN.clientRef),
})

export const partyUebernahmeSchema = z.object({
  tripId: z.string().uuid(),
  party: z.array(travellerEingabeSchema).max(20),
})

export function readinessItemLesen(wert: unknown): TripReadinessItem | null {
  const ergebnis = readinessItemSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

export function readinessItemsLesen(wert: unknown): TripReadinessItem[] {
  const ergebnis = readinessItemsSchema.safeParse(wert ?? [])
  return ergebnis.success ? ergebnis.data : []
}

export function partyLesen(wert: unknown): z.infer<typeof partySchema> {
  const ergebnis = partySchema.safeParse(wert ?? [])
  return ergebnis.success ? ergebnis.data : []
}
