// lib/seasonal/domain.ts
//
// Fachliche Begriffe der Travel Timing & Seasonal Intelligence.
// Eigene Truth-Domäne. Keine Safety-Evaluation, keine Safety-Präsentation.
// Frei von Next und Providern.

import { landescodeLesen } from '@/lib/readiness/domain'
import type { SeasonalEvidence } from '@/lib/seasonal/evidence'

export const SEASONAL_GRENZEN = {
  headline: 160,
  summary: 400,
  authority: 80,
  provider: 40,
  factKey: 160,
  factId: 80,
  region: 80,
  maxAnfrageBytes: 24_576,
  maxFacts: 40,
  maxRefs: 40,
  providerTimeoutMs: 4_000,
} as const

export const SEASONAL_CATEGORIES = [
  'heavy_rain',
  'monsoon',
  'tropical_cyclone_season',
  'heat',
  'cold',
  'wildfire_smoke',
  'flood',
  'snow_avalanche',
  'seasonal_access',
  'other',
  'unknown',
] as const
export type SeasonalCategory = (typeof SEASONAL_CATEGORIES)[number]

export const SEASONAL_EVIDENCE_CLASSES = [
  'seasonal_pattern',
  'official_seasonal_risk_window',
  'forecast_outlook',
] as const
export type SeasonalEvidenceClass = (typeof SEASONAL_EVIDENCE_CLASSES)[number]

export const SEASONAL_ABGEWIESENE_KLASSEN = ['active_warning', 'acute'] as const

export const SEASONAL_OUTCOMES = [
  'less_favorable',
  'mixed_tradeoff',
  'favorable_context',
  'unknown',
] as const
export type SeasonalOutcome = (typeof SEASONAL_OUTCOMES)[number]

const SEASONAL_EVIDENCE_STATUSES = [
  'unavailable',
  'insufficient_context',
  'unknown',
  'current',
] as const
export type SeasonalEvidenceStatus = (typeof SEASONAL_EVIDENCE_STATUSES)[number]

const SEASONAL_FRESHNESS = [
  'never_checked',
  'current',
  'recheck_needed',
  'stale',
  'provider_unavailable',
  'source_temporarily_unavailable',
] as const
export type SeasonalFreshness = (typeof SEASONAL_FRESHNESS)[number]

export const SEASONAL_AUTHORITY_CLASSES = [
  'official_government',
  'official_climate',
  'official_transport',
  'scientific_climatology',
  'unknown',
] as const
export type SeasonalAuthorityClass = (typeof SEASONAL_AUTHORITY_CLASSES)[number]

const SEASONAL_PRESENTATION_CLASSES = [
  'timing_check',
  'timing_notice',
  'information',
  'unknown',
] as const
export type SeasonalPresentationClass = (typeof SEASONAL_PRESENTATION_CLASSES)[number]

const SEASONAL_RELEVANCE = [
  'applies',
  'not_applies',
  'insufficient_context',
  'unknown',
] as const
export type SeasonalRelevance = (typeof SEASONAL_RELEVANCE)[number]

const SEASONAL_SPATIAL_PRECISIONS = [
  'country',
  'admin_region',
  'city',
  'place',
  'airport',
  'point',
  'route',
  'unknown',
] as const
export type SeasonalSpatialPrecision = (typeof SEASONAL_SPATIAL_PRECISIONS)[number]

export const SEASONAL_IMPACT_DOMAINS = [
  'stage',
  'flight',
  'stay',
  'activity',
  'mobility',
  'rental_car',
  'day_plan',
] as const
export type SeasonalImpactDomain = (typeof SEASONAL_IMPACT_DOMAINS)[number]

const SEASONAL_IMPACT_STATUSES = ['affected', 'needs_recheck', 'unknown'] as const
export type SeasonalImpactStatus = (typeof SEASONAL_IMPACT_STATUSES)[number]

const SEASONAL_NEXT_ACTIONS = [
  'review_timing',
  'check_stage',
  'check_route',
  'check_activity',
  'check_mobility',
  'observe',
] as const
export type SeasonalNextAction = (typeof SEASONAL_NEXT_ACTIONS)[number]

const SEASONAL_REF_KINDS = ['stage', 'day', 'item', 'route_point', 'airport'] as const
export type SeasonalRefKind = (typeof SEASONAL_REF_KINDS)[number]

export type SeasonalTripRef = {
  kind: SeasonalRefKind
  id: string
  label: string
}

export type SeasonalImpact = {
  domain: SeasonalImpactDomain
  ref: SeasonalTripRef
  status: SeasonalImpactStatus
}

export type SeasonalEvaluation = {
  factId: string
  factKey: string
  category: SeasonalCategory
  evidenceClass: SeasonalEvidenceClass | 'rejected_acute'
  outcome: SeasonalOutcome
  evidenceStatus: SeasonalEvidenceStatus
  freshness: SeasonalFreshness
  relevance: SeasonalRelevance
  spatialPrecision: SeasonalSpatialPrecision
  presentationClass: SeasonalPresentationClass
  authorityClass: SeasonalAuthorityClass
  affectedRefs: SeasonalTripRef[]
  impact: SeasonalImpact[]
  reason: string
  nextAction: SeasonalNextAction
  conflict: boolean
  acuteRejected: boolean
  evidence: SeasonalEvidence
  contextFingerprint: string
  factFingerprint: string
}

export function iataLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const code = wert.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : null
}

export function seasonalLandescode(wert: unknown): string | null {
  return landescodeLesen(wert)
}

export function enumLesen<T extends string>(wert: unknown, erlaubt: readonly T[]): T | null {
  return typeof wert === 'string' && (erlaubt as readonly string[]).includes(wert) ? (wert as T) : null
}
