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

export type OfficialAction = {
  kind: 'open_official_source'
  href: string
}

export type OfficialEvaluation = {
  travellerClientRef: string | null
  credentialOptionRef?: string | null
  destinationCountryCode: string | null
  transitCountryCode: string | null
  requirementType: OfficialRequirementType
  result: OfficialResult
  status: OfficialStatus
  freshness: OfficialFreshness
  officialClass: OfficialClass
  optionEligibility?: 'allowed' | 'not_allowed' | 'unknown' | null
  optionMandate?: 'mandatory' | 'not_mandatory' | 'unknown' | null
  missingFacts: MissingFact[]
  evidence: OfficialEvidence
  action: OfficialAction | null
}

export function optionEligibilityLesen(wert: unknown): 'allowed' | 'not_allowed' | 'unknown' {
  if (wert === 'allowed' || wert === 'not_allowed' || wert === 'unknown') return wert
  return 'unknown'
}

export function optionMandateLesen(wert: unknown): 'mandatory' | 'not_mandatory' | 'unknown' {
  if (wert === 'mandatory' || wert === 'not_mandatory' || wert === 'unknown') return wert
  return 'unknown'
}

export function officialAktionAusQuelle(url: unknown): OfficialAction | null {
  const href = quelleUrlLesen(url)
  return href ? { kind: 'open_official_source', href } : null
}

export function missingFactsLesen(wert: unknown): MissingFact[] {
  if (!Array.isArray(wert)) return []
  const gesehen = new Set<MissingFact>()
  for (const eintrag of wert) {
    if (typeof eintrag === 'string' && (MISSING_FACTS as readonly string[]).includes(eintrag)) {
      gesehen.add(eintrag as MissingFact)
    }
  }
  return [...gesehen]
}

export function checkedAtLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const zeit = wert.trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(zeit)) return null
  const ms = Date.parse(zeit)
  return Number.isFinite(ms) ? zeit : null
}

export function authorityLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  if (text.length < 2 || text.length > 80) return null
  return text
}

export function providerNameLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const name = wert.trim()
  if (name.length < 2 || name.length > 40) return null
  return name
}

/** Clock-Skew-Toleranz für Provider-Uhren: 5 Minuten. */
const CHECKED_AT_SKEW_MS = 5 * 60 * 1000

export function regelReferenzLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  if (text.length < 2 || text.length > 80) return null
  return text
}

export function gültigkeitszeitLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return Number.isFinite(Date.parse(`${text}T00:00:00.000Z`)) ? text : null
  }
  return checkedAtLesen(text)
}

function gültigkeitszeitMs(wert: string): number {
  return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(wert) ? `${wert}T00:00:00.000Z` : wert)
}

function checkedAtPlausibel(checkedAt: string | null, nowMs = Date.now()): boolean {
  if (!checkedAt) return false
  const ms = Date.parse(checkedAt)
  return Number.isFinite(ms) && ms <= nowMs + CHECKED_AT_SKEW_MS
}

/**
 * Provider-neutrale Trust-Grenze.
 * Source URL ist optional für das Resultat; wenn vorhanden, muss sie valide HTTPS sein.
 * Official Action braucht zusätzlich eine validierte Source URL.
 */
export function officialEvidenceVertrauenswuerdig(opts: {
  provider: string | null
  checkedAt: string | null
  authority: string | null
  ruleReference?: string | null
  sourceUrl: string | null
  sourceUrlRoh?: unknown
  nowMs?: number
}): boolean {
  if (!opts.provider || !opts.checkedAt) return false
  if (!checkedAtPlausibel(opts.checkedAt, opts.nowMs ?? Date.now())) return false
  if (!opts.authority && !opts.ruleReference) return false
  if (typeof opts.sourceUrlRoh === 'string' && opts.sourceUrlRoh.trim() !== '' && !opts.sourceUrl) {
    return false
  }
  return true
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
  credentialOptionRef?: string | null
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
    credentialOptionRef: teil.credentialOptionRef ?? null,
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
    action: null,
  }
}

export function officialFrische(opts: {
  storedFingerprint: string | null
  currentFingerprint: string
  checkedAt: string | null
  validFrom?: string | null
  validUntil: string | null
  now?: string
  hasProvider: boolean
  sourceAvailable?: boolean
}): OfficialFreshness {
  if (!opts.hasProvider) return 'provider_unavailable'
  if (opts.sourceAvailable === false) return 'source_temporarily_unavailable'
  if (!opts.checkedAt) return 'never_checked'
  if (opts.storedFingerprint && opts.storedFingerprint !== opts.currentFingerprint) return 'stale'
  const jetzt = opts.now ? Date.parse(opts.now) : Date.now()
  if (opts.validFrom && Number.isFinite(jetzt) && jetzt < gültigkeitszeitMs(opts.validFrom)) {
    return 'never_checked'
  }
  if (opts.validUntil && Number.isFinite(jetzt) && jetzt > gültigkeitszeitMs(opts.validUntil)) {
    return 'recheck_needed'
  }
  return 'current'
}
