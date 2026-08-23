// lib/safety/domain.ts
//
// Fachliche Begriffe der Travel Safety & Disruption Intelligence.
//
// Getrennte Ebenen, die nicht in ein Severity-Feld fallen:
//   Kategorie, Authority, source-backed Severity, Freshness,
//   räumliche/zeitliche Relevanz, Trip-Impact, UI-Priorität.
//
// Frei von Next und Providern.

import { landescodeLesen } from '@/lib/readiness/domain'
import type { SafetyEvidence } from '@/lib/safety/evidence'

export const SAFETY_GRENZEN = {
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
} as const

export const SAFETY_EVENT_CATEGORIES = [
  'armed_conflict',
  'civil_unrest',
  'earthquake',
  'tsunami',
  'volcanic_activity',
  'flood',
  'wildfire',
  'tropical_cyclone',
  'infrastructure_disruption',
  'other',
  'unknown',
] as const
export type SafetyEventCategory = (typeof SAFETY_EVENT_CATEGORIES)[number]

export const SAFETY_EVENT_STATUSES = [
  'active',
  'monitoring',
  'resolved',
  'withdrawn',
  'unknown',
] as const
export type SafetyEventStatus = (typeof SAFETY_EVENT_STATUSES)[number]

const SAFETY_EVIDENCE_STATUSES = [
  'unavailable',
  'insufficient_context',
  'unknown',
  'current',
] as const
export type SafetyEvidenceStatus = (typeof SAFETY_EVIDENCE_STATUSES)[number]

const SAFETY_FRESHNESS = [
  'never_checked',
  'current',
  'recheck_needed',
  'stale',
  'provider_unavailable',
  'source_temporarily_unavailable',
] as const
export type SafetyFreshness = (typeof SAFETY_FRESHNESS)[number]

export const SAFETY_SOURCE_SEVERITIES = ['minor', 'moderate', 'severe', 'extreme'] as const
export type SafetySourceSeverity = (typeof SAFETY_SOURCE_SEVERITIES)[number]

export const SAFETY_ADVISORY_CLASSES = [
  'do_not_travel',
  'avoid_all_travel',
  'reconsider_travel',
  'exercise_caution',
  'informational',
] as const
export type SafetyAdvisoryClass = (typeof SAFETY_ADVISORY_CLASSES)[number]

export const SAFETY_AUTHORITY_CLASSES = [
  'official_government',
  'official_humanitarian',
  'official_transport',
  'unknown',
] as const
export type SafetyAuthorityClass = (typeof SAFETY_AUTHORITY_CLASSES)[number]

const SAFETY_PRESENTATION_CLASSES = [
  'critical_warning',
  'important_notice',
  'information',
  'unknown',
] as const
export type SafetyPresentationClass = (typeof SAFETY_PRESENTATION_CLASSES)[number]

const SAFETY_RELEVANCE = [
  'affected',
  'not_affected',
  'insufficient_context',
  'unknown',
] as const
export type SafetyRelevance = (typeof SAFETY_RELEVANCE)[number]

const SAFETY_SPATIAL_PRECISIONS = [
  'country',
  'admin_region',
  'city',
  'place',
  'airport',
  'point',
  'route',
  'unknown',
] as const
export type SafetySpatialPrecision = (typeof SAFETY_SPATIAL_PRECISIONS)[number]

const SAFETY_IMPACT_DOMAINS = [
  'stage',
  'flight',
  'stay',
  'activity',
  'mobility',
  'rental_car',
  'day_plan',
  'readiness',
] as const
export type SafetyImpactDomain = (typeof SAFETY_IMPACT_DOMAINS)[number]

const SAFETY_IMPACT_STATUSES = ['affected', 'needs_recheck', 'unknown'] as const
export type SafetyImpactStatus = (typeof SAFETY_IMPACT_STATUSES)[number]

const SAFETY_NEXT_ACTIONS = [
  'check_stage',
  'check_route',
  'check_accommodation',
  'check_activity',
  'check_mobility',
  'check_readiness',
  'observe',
] as const
export type SafetyNextAction = (typeof SAFETY_NEXT_ACTIONS)[number]

const SAFETY_REF_KINDS = [
  'stage',
  'day',
  'item',
  'route_point',
  'airport',
  'traveller',
] as const
export type SafetyRefKind = (typeof SAFETY_REF_KINDS)[number]

export const SAFETY_NATURES = ['acute', 'seasonal_pattern'] as const
export type SafetyNature = (typeof SAFETY_NATURES)[number]

export type SafetyTripRef = {
  kind: SafetyRefKind
  id: string
  label: string
}

export type SafetyImpact = {
  domain: SafetyImpactDomain
  ref: SafetyTripRef
  status: SafetyImpactStatus
}

export type SafetyEvaluation = {
  factId: string
  factKey: string
  category: SafetyEventCategory
  eventStatus: SafetyEventStatus
  evidenceStatus: SafetyEvidenceStatus
  freshness: SafetyFreshness
  relevance: SafetyRelevance
  spatialPrecision: SafetySpatialPrecision
  presentationClass: SafetyPresentationClass
  sourceSeverity: SafetySourceSeverity | null
  advisoryClass: SafetyAdvisoryClass | null
  authorityClass: SafetyAuthorityClass
  affectedRefs: SafetyTripRef[]
  impact: SafetyImpact[]
  reason: string
  nextAction: SafetyNextAction
  conflict: boolean
  seasonalRejected: boolean
  evidence: SafetyEvidence
  contextFingerprint: string
  eventFingerprint: string
}

export function iataLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const code = wert.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : null
}

export function safetyLandescode(wert: unknown): string | null {
  return landescodeLesen(wert)
}

export function enumLesen<T extends string>(wert: unknown, erlaubt: readonly T[]): T | null {
  return typeof wert === 'string' && (erlaubt as readonly string[]).includes(wert) ? (wert as T) : null
}
