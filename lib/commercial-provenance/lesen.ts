// lib/commercial-provenance/lesen.ts
//
// Strukturelles Lesen untrusted Inputs. Fachregeln stehen in pruefen.ts.
// Keine Defaults, die Freshness, Währung oder Availability erfinden.

import { z } from 'zod'

import {
  COMMERCIAL_AKTEURE,
  COMMERCIAL_AMOUNT_STATUS,
  COMMERCIAL_PERSISTENZ,
  COMMERCIAL_PROVENANCE_DOMAINS,
  COMMERCIAL_SOURCE_KINDS,
  type CommercialAkteur,
} from '@/lib/commercial-provenance/domain'

const optionalerText = z
  .string()
  .trim()
  .max(200)
  .nullable()
  .optional()
  .transform((wert) => (wert && wert.length > 0 ? wert : null))

const affiliateEingabeSchema = z
  .object({
    status: z.string().trim().min(1).max(40).nullable().optional(),
    partnerId: optionalerText,
    clickId: optionalerText,
    attributionRef: optionalerText,
  })
  .nullable()
  .optional()

const eingabeSchema = z.object({
  domain: z.enum(COMMERCIAL_PROVENANCE_DOMAINS),
  providerId: z.string().trim().max(40).nullable().optional(),
  sourceKind: z.string().trim().max(40).nullable().optional(),
  sourceLabel: optionalerText,
  externalRef: optionalerText,
  providerOfferId: optionalerText,
  retrievedAt: z.string().trim().max(64).nullable().optional(),
  observedAt: z.string().trim().max(64).nullable().optional(),
  freshUntil: z.string().trim().max(64).nullable().optional(),
  requestedCurrency: z.string().trim().max(8).nullable().optional(),
  quotedCurrency: z.string().trim().max(8).nullable().optional(),
  amount: z.number().finite().nullable().optional(),
  amountStatus: z.string().trim().max(40).nullable().optional(),
  persistenz: z.string().trim().max(40).nullable().optional(),
  availability: z.string().trim().max(40).nullable().optional(),
  affiliate: affiliateEingabeSchema,
  convertedAmount: z.number().finite().nullable().optional(),
  convertedCurrency: z.string().trim().max(8).nullable().optional(),
  conversionEvidence: z.unknown().optional(),
  vergleichsschluessel: optionalerText,
})

export type CommercialProvenanceRoh = z.infer<typeof eingabeSchema>

export function commercialEingabeLesen(wert: unknown): CommercialProvenanceRoh | null {
  const gelesen = eingabeSchema.safeParse(wert)
  return gelesen.success ? gelesen.data : null
}

export function commercialAkteurLesen(wert: unknown): CommercialAkteur | null {
  if (typeof wert !== 'string') return null
  return (COMMERCIAL_AKTEURE as readonly string[]).includes(wert) ? (wert as CommercialAkteur) : null
}

export function istBekanntesSourceKind(wert: string): wert is (typeof COMMERCIAL_SOURCE_KINDS)[number] {
  return (COMMERCIAL_SOURCE_KINDS as readonly string[]).includes(wert)
}

export function istBekannterAmountStatus(wert: string): wert is (typeof COMMERCIAL_AMOUNT_STATUS)[number] {
  return (COMMERCIAL_AMOUNT_STATUS as readonly string[]).includes(wert)
}

export function istBekanntePersistenz(wert: string): wert is (typeof COMMERCIAL_PERSISTENZ)[number] {
  return (COMMERCIAL_PERSISTENZ as readonly string[]).includes(wert)
}

const ISO_AUGENBLICK =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/

export function commercialAugenblickMs(wert: string | null | undefined): number | null {
  if (!wert) return null
  if (!ISO_AUGENBLICK.test(wert)) return null
  const ms = Date.parse(wert)
  return Number.isFinite(ms) ? ms : null
}

export function commercialWaehrungLesen(wert: string | null | undefined): string | null | 'invalid' {
  if (wert == null) return null
  const code = wert.trim().toUpperCase()
  if (code.length === 0) return null
  if (!/^[A-Z]{3}$/.test(code)) return 'invalid'
  return code
}
