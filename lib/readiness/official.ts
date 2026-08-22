// lib/readiness/official.ts
//
// Offizielle Anforderungswahrheit. Nur eine Engine mit Provider-Evidence
// darf required / not_required / conditional setzen.
// Frei von Next.

import { landescodeLesen } from '@/lib/readiness/domain'
import type { OfficialRequirementType } from '@/types/trips'

const OFFICIAL_RESULTS = [
  'required',
  'not_required',
  'conditional',
  'unknown',
] as const
export type OfficialResult = (typeof OFFICIAL_RESULTS)[number]

const OFFICIAL_STATUSES = [
  'unavailable',
  'insufficient_context',
  'unknown',
  'current',
] as const
export type OfficialStatus = (typeof OFFICIAL_STATUSES)[number]

const OFFICIAL_FRESHNESS = [
  'never_checked',
  'current',
  'recheck_needed',
  'stale',
  'provider_unavailable',
  'source_temporarily_unavailable',
] as const
export type OfficialFreshness = (typeof OFFICIAL_FRESHNESS)[number]

const OFFICIAL_CLASSES = ['requirement', 'recommendation', 'advisory', 'unknown'] as const
export type OfficialClass = (typeof OFFICIAL_CLASSES)[number]

const MISSING_FACTS = [
  'nationality',
  'residence',
  'document_type',
  'document_issuing_country',
  'document_expiry',
  'destination_country',
  'travel_dates',
  'transit_itinerary',
  'origin_country',
] as const
export type MissingFact = (typeof MISSING_FACTS)[number]

export type OfficialEvidence = {
  provider: string | null
  authority: string | null
  sourceUrl: string | null
  checkedAt: string | null
  validFrom: string | null
  validUntil: string | null
  ruleReference: string | null
  contextFingerprint: string
}

export type OfficialEvaluation = {
  travellerClientRef: string | null
  destinationCountryCode: string | null
  transitCountryCode: string | null
  requirementType: OfficialRequirementType
  result: OfficialResult
  status: OfficialStatus
  freshness: OfficialFreshness
  officialClass: OfficialClass
  missingFacts: MissingFact[]
  evidence: OfficialEvidence
}

export function quelleUrlLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const url = wert.trim()
  if (url.length < 12 || url.length > 500) return null
  if (!/^https:\/\//i.test(url)) return null
  try {
    const gelesen = new URL(url)
    if (gelesen.protocol !== 'https:') return null
    if (gelesen.username || gelesen.password) return null
    if (gelesen.hostname === 'localhost' || gelesen.hostname.endsWith('.local')) return null
    return gelesen.toString()
  } catch {
    return null
  }
}

export function officialLeer(teil: {
  travellerClientRef?: string | null
  destinationCountryCode?: string | null
  transitCountryCode?: string | null
  requirementType: OfficialRequirementType
  status?: OfficialStatus
  freshness?: OfficialFreshness
  missingFacts?: MissingFact[]
  contextFingerprint: string
}): OfficialEvaluation {
  return {
    travellerClientRef: teil.travellerClientRef ?? null,
    destinationCountryCode: landescodeLesen(teil.destinationCountryCode ?? null),
    transitCountryCode: landescodeLesen(teil.transitCountryCode ?? null),
    requirementType: teil.requirementType,
    result: 'unknown',
    status: teil.status ?? 'unavailable',
    freshness: teil.freshness ?? 'provider_unavailable',
    officialClass: 'unknown',
    missingFacts: teil.missingFacts ?? [],
    evidence: {
      provider: null,
      authority: null,
      sourceUrl: null,
      checkedAt: null,
      validFrom: null,
      validUntil: null,
      ruleReference: null,
      contextFingerprint: teil.contextFingerprint,
    },
  }
}

export function officialFrische(opts: {
  storedFingerprint: string | null
  currentFingerprint: string
  checkedAt: string | null
  validUntil: string | null
  now?: string
  hasProvider: boolean
}): OfficialFreshness {
  if (!opts.hasProvider) return 'provider_unavailable'
  if (!opts.checkedAt) return 'never_checked'
  if (opts.storedFingerprint && opts.storedFingerprint !== opts.currentFingerprint) return 'stale'
  if (opts.validUntil && (opts.now ?? new Date().toISOString()) > opts.validUntil) return 'recheck_needed'
  return 'current'
}
