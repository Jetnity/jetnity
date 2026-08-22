// lib/readiness/domain.ts
//
// Fachliche Begriffe der Reisevorbereitung.
//
// Zwei Wahrheiten bleiben getrennt:
//   A. Offizielle Anforderung – ohne Provider immer unknown / unavailable
//   B. Nutzer-Vorbereitungsstand – User Evidence, keine Bestätigung
//
// Frei von Next und Supabase.

import {
  type ReadinessEvidence,
  type ReadinessKind,
  type ReadinessUserStatus,
  type TripReadinessItem,
} from '@/types/trips'

export const READINESS_GRENZEN = {
  titel: 80,
  clientRef: 64,
  fingerprint: 500,
  itemsJeReise: 50,
  maxAnfrageBytes: 8_192,
} as const

export const READINESS_FINGERPRINT_VERSION = 'v1'

export type OfficialRequirementResult = 'required' | 'not_required' | 'unknown'

export type OfficialRequirementStatus = 'unavailable' | 'insufficient_context' | 'unknown'

export type OfficialRequirementEvidence = {
  destinationCountryCode: string | null
  requiredTravellerFacts: readonly string[]
  requirementType: ReadinessKind | 'entry_or_visa'
  result: OfficialRequirementResult
  status: OfficialRequirementStatus
  authority: string | null
  sourceUrl: string | null
  checkedAt: string | null
  validityUntil: string | null
  reason: OfficialRequirementReason
}

export type OfficialRequirementReason =
  | 'no_provider'
  | 'insufficient_context'
  | 'missing_nationality'
  | 'multiple_travellers_no_individual_evidence'
  | 'unknown_country_code'
  | 'production_closed'

export type ReadinessCurrentness = 'current' | 'stale' | 'not_applicable'

export type ReadinessDerivedKind =
  | 'entry_check'
  | 'visa_check'
  | 'travel_document_check'
  | 'insurance_check'
  | 'ticket_confirmation_check'
  | 'booking_confirmation_check'

export type ReadinessDerivedCheck = {
  clientRef: string
  kind: ReadinessDerivedKind
  countryCode: string | null
  tripItemId: string | null
  title: string | null
  contextFingerprint: string
}

export type ReadinessViewItem = {
  clientRef: string
  kind: ReadinessKind
  userStatus: ReadinessUserStatus
  evidence: ReadinessEvidence
  currentness: ReadinessCurrentness
  countryCode: string | null
  tripItemId: string | null
  title: string | null
  persisted: boolean
  official: OfficialRequirementEvidence
}

export type ReadinessSummary = {
  open: number
  done: number
  skipped: number
  stale: number
  notApplicable: number
  officialStatus: OfficialRequirementStatus
  officialResult: OfficialRequirementResult
  officialReason: OfficialRequirementReason
  travellers: number
  destinationCountries: string[]
  unknownCountryContext: boolean
  individualClaimsForbidden: boolean
}

export const LEERE_OFFICIAL_REQUIRED_FACTS = [
  'nationality',
  'travel_purpose',
  'route_including_transit',
  'stay_duration',
] as const

export function readinessItemsVon(reise: { readinessItems?: readonly TripReadinessItem[] | null }): TripReadinessItem[] {
  return [...(reise.readinessItems ?? [])]
}

export function landescodeLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const code = wert.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

export function clientRefFuerAbgeleitet(
  kind: ReadinessDerivedKind,
  schluessel: string,
): string {
  return `${kind}:${schluessel}`.slice(0, READINESS_GRENZEN.clientRef)
}
