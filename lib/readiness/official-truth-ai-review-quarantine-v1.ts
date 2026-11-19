// Offline-only candidate boundary for the owner-approved Copilot Pro
// OpenAI primary + optional independent Grok review architecture (#1232).
// Reuses the existing officialTruthRegelReviewVorschlag/#723 packet proof.
// NO model call, source fetch, DB access, write, acceptance or publication.
// An LLM cannot supply packetInput, source identity, method, trusted facts,
// reviewPacketKey, permissions, or proof: these are re-derived by Jetnity.

import {
  officialTruthRegelReviewVorschlag,
  type OfficialTruthRegelReviewBewertung,
  type OfficialTruthRegelReviewGrund,
} from '@/lib/readiness/official-truth-review-suggestion'

export type KiPruefer = 'openai' | 'grok'
export type KiPruefRisiko = 'routine' | 'critical'
export type KiPruefDisposition =
  | 'SINGLE_RESEARCH_ONLY'
  | 'INDEPENDENT_REVIEW_REQUIRED'
  | 'AGREEING_RESEARCH_ONLY'
  | 'CONFLICT_OR_GAP_REQUIRES_REVIEW'

const MODELL_FELDER = [
  'assessment',
  'citedSupportVersionIds',
  'reasonCodes',
] as const

// Exact, bounded schema. The underlying rule-review validator independently
// verifies these enums and all citation IDs against a re-built trusted packet.
const BEWERTUNGEN: readonly OfficialTruthRegelReviewBewertung[] = [
  'supports_candidate',
  'contradicts_candidate',
  'insufficient_evidence',
  'needs_human_review',
]
const GRUENDE: readonly OfficialTruthRegelReviewGrund[] = [
  'support_text_matches_candidate',
  'support_text_conflicts_candidate',
  'support_scope_ambiguous',
  'support_stale_or_time_unclear',
  'support_sources_conflict',
  'support_insufficient_for_claim',
  'proposal_requires_human_judgment',
]

type Vorschlag = Readonly<{
  assessment: OfficialTruthRegelReviewBewertung
  citedSupportVersionIds: string[]
  reasonCodes: OfficialTruthRegelReviewGrund[]
}>

export type KiGutachten =
  | Readonly<{
      status: 'quarantined_research_only'
      provider: KiPruefer
      reviewPacketKey: string
      ruleScopeKey: string
      assessment: OfficialTruthRegelReviewBewertung
      citedSupportVersionIds: readonly string[]
      reasonCodes: readonly OfficialTruthRegelReviewGrund[]
      acceptedFacts: 0
      publicationAllowed: false
    }>
  | Readonly<{
      status: 'blocked'
      reason: 'malformed_model_output' | 'unverified_review_packet'
    }>

export type KiVergleich =
  | Readonly<{
      status: 'quarantined_research_only'
      disposition: KiPruefDisposition
      reviewPacketKey: string
      ruleScopeKey: string
      acceptedFacts: 0
      publicationAllowed: false
    }>
  | Extract<KiGutachten, { status: 'blocked' }>

function record(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  try {
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return null
    const keys = Reflect.ownKeys(value)
    if (keys.length !== MODELL_FELDER.length) return null
    for (const key of keys) {
      if (typeof key !== 'string' || !MODELL_FELDER.includes(key as typeof MODELL_FELDER[number])) return null
      const desc = Object.getOwnPropertyDescriptor(value, key)
      if (!desc || !('value' in desc) || !desc.enumerable) return null
    }
    return value as Record<string, unknown>
  } catch {
    // Includes revoked proxies; nothing from the model is authoritative.
    return null
  }
}

function safeList(
  value: unknown,
  max: number,
  pattern: RegExp,
): string[] | null {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > max) return null
    const keys = Reflect.ownKeys(value)
    if (keys.length !== value.length + 1) return null
    const items: string[] = []
    for (let i = 0; i < value.length; i++) {
      const d = Object.getOwnPropertyDescriptor(value, String(i))
      if (!d || !('value' in d) || typeof d.value !== 'string' || !pattern.test(d.value)) return null
      items.push(d.value)
    }
    return items
  } catch {
    return null
  }
}

/**
 * Only the three model-owned fields are read. The original packetInput must
 * come from Jetnity's server-held verified source/evidence flow, NEVER from
 * the model response; this function additionally re-validates that packet.
 */
export function officialTruthKiVorschlag(
  packetInput: unknown,
  provider: KiPruefer,
  modelOutput: unknown,
): KiGutachten {
  if (provider !== 'openai' && provider !== 'grok') {
    return { status: 'blocked', reason: 'malformed_model_output' }
  }
  let parsed: unknown = modelOutput
  if (typeof modelOutput === 'string') {
    if (modelOutput.length === 0 || modelOutput.length > 8192) {
      return { status: 'blocked', reason: 'malformed_model_output' }
    }
    try { parsed = JSON.parse(modelOutput) as unknown } catch {
      return { status: 'blocked', reason: 'malformed_model_output' }
    }
  }
  const r = record(parsed)
  if (!r || !BEWERTUNGEN.includes(r.assessment as OfficialTruthRegelReviewBewertung)) {
    return { status: 'blocked', reason: 'malformed_model_output' }
  }
  const ids = safeList(r.citedSupportVersionIds, 8, /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,255}$/)
  const reasons = safeList(r.reasonCodes, 8, /^[a-z_]{3,80}$/)
  if (ids === null || reasons === null || reasons.some(x => !GRUENDE.includes(x as OfficialTruthRegelReviewGrund))) {
    return { status: 'blocked', reason: 'malformed_model_output' }
  }
  const suggestion: Vorschlag = {
    assessment: r.assessment as OfficialTruthRegelReviewBewertung,
    citedSupportVersionIds: ids,
    reasonCodes: reasons as OfficialTruthRegelReviewGrund[],
  }
  try {
    const review = officialTruthRegelReviewVorschlag({ packetInput, suggestion })
    if (review.status !== 'review_suggestion') {
      return { status: 'blocked', reason: 'unverified_review_packet' }
    }
    return Object.freeze({
      status: 'quarantined_research_only',
      provider,
      reviewPacketKey: review.reviewPacketKey,
      ruleScopeKey: review.ruleScopeKey,
      assessment: review.assessment,
      citedSupportVersionIds: review.citedSupportVersionIds,
      reasonCodes: review.reasonCodes,
      acceptedFacts: 0,
      publicationAllowed: false,
    })
  } catch {
    return { status: 'blocked', reason: 'unverified_review_packet' }
  }
}

/**
 * Comparing two LLM reviews never amounts to "two approvals". All outcomes
 * are RESEARCH_ONLY, including perfect agreement. Elevated-risk results
 * need an independent challenger, but even then the deterministic MA1/BG1
 * acceptance path has to be approved and executed separately.
 */
export function officialTruthKiGegenpruefung(
  packetInput: unknown,
  openaiOutput: unknown,
  grokOutput: unknown | null,
  risk: KiPruefRisiko,
): KiVergleich {
  if (risk !== 'routine' && risk !== 'critical') {
    return { status: 'blocked', reason: 'malformed_model_output' }
  }
  const first = officialTruthKiVorschlag(packetInput, 'openai', openaiOutput)
  if (first.status === 'blocked') return first
  let disposition: KiPruefDisposition = risk === 'critical'
    ? 'INDEPENDENT_REVIEW_REQUIRED'
    : 'SINGLE_RESEARCH_ONLY'
  if (grokOutput !== null) {
    const second = officialTruthKiVorschlag(packetInput, 'grok', grokOutput)
    if (second.status === 'blocked') return second
    const samePacket = first.reviewPacketKey === second.reviewPacketKey
      && first.ruleScopeKey === second.ruleScopeKey
    const agreeing = first.assessment === 'supports_candidate'
      && second.assessment === 'supports_candidate'
      && JSON.stringify(first.citedSupportVersionIds) === JSON.stringify(second.citedSupportVersionIds)
    disposition = samePacket && agreeing
      ? 'AGREEING_RESEARCH_ONLY'
      : 'CONFLICT_OR_GAP_REQUIRES_REVIEW'
  }
  return Object.freeze({
    status: 'quarantined_research_only',
    disposition,
    reviewPacketKey: first.reviewPacketKey,
    ruleScopeKey: first.ruleScopeKey,
    acceptedFacts: 0,
    publicationAllowed: false,
  })
}
