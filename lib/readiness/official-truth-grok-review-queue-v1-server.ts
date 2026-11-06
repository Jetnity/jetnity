// Server-only, zero-persistence bridge from raw Grok research handoffs
// to deterministic review-queue plans. NOT a database writer, Source
// Registry admission, accepted Evidence or Official Truth.
import 'server-only'

import { sha256Hex } from '@/lib/readiness/digest'
import {
  grokRecherchePaketQuarantaene,
  grokRecherchePaketQuarantaeneBridgeV2,
  type GrokForschungSperrgrund,
  type GrokKandidatBefund,
} from '@/lib/readiness/official-truth-grok-research-intake-v1'

const COUNTRY_CODES = ['IT', 'FR', 'ES', 'JP', 'US'] as const
const BRIDGE_V2_COUNTRY_CODES = ['DE', 'TH', ...COUNTRY_CODES] as const
const PAIR_KEYS = ['countryCode', 'candidatePackage', 'verification'] as const
const MAX_PAIRS = COUNTRY_CODES.length
const MAX_TREE_DEPTH = 16

type CountryCode = (typeof BRIDGE_V2_COUNTRY_CODES)[number]
export type GrokReviewQueueV1Sperrgrund =
  | 'invalid_batch'
  | 'invalid_pair'
  | 'invalid_country'
  | 'duplicate_country'
  | 'invalid_json_tree'
  | GrokForschungSperrgrund

export type GrokReviewQueueV1Ergebnis =
  | { readonly status: 'blocked'; readonly reason: GrokReviewQueueV1Sperrgrund }
  | {
      readonly status: 'research_review_queue_prepared'
      readonly queueKey: string
      readonly researchStatus: 'RESEARCH_ONLY'
      readonly databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT'
      readonly sourceCustody: 'not_verified'
      readonly verifierIndependence: 'same_executor_not_independent'
      readonly acceptedRules: 0
      readonly databaseWrites: 0
      readonly totalCandidates: number
      readonly awaitingIndependentReview: number
      readonly blockedCandidates: number
      readonly countries: readonly {
        readonly countryCode: CountryCode
        readonly packageId: string
        /** Digest of caller-supplied research JSON, NOT an official source hash. */
        readonly untrustedSubmissionKey: string
        readonly botReportedReady: number
        /** V2-only untrusted reporter claim; absence is a review caveat, not a PASS. */
        readonly researchLimitsAttestation?: 'bot_reported_only' | 'missing_in_original'
        readonly botReportedBlocked: number
        readonly candidates: readonly {
          readonly candidateId: string
          readonly reviewKey: string
          readonly state: 'needs_independent_source_review' | 'blocked'
          readonly findings: readonly GrokKandidatBefund[]
        }[]
      }[]
    }

function blocked(reason: GrokReviewQueueV1Sperrgrund): GrokReviewQueueV1Ergebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null ? value as Record<string, unknown> : null
}

/** Strictly allow parsed JSON-like data; never evaluate accessors. */
function dataOnly(value: unknown, seen: WeakSet<object>, depth = 0): boolean {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || depth > MAX_TREE_DEPTH || seen.has(value)) return false
  if (!Array.isArray(value) && !record(value)) return false
  seen.add(value)
  const isArray = Array.isArray(value)
  if (isArray && (value.length > 256 || Object.keys(value).length !== value.length)) return false
  const keys = Reflect.ownKeys(value).filter((key) => !(isArray && key === 'length'))
  if (keys.length > 256 || keys.some((key) => typeof key !== 'string')) return false
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (const key of keys) {
    if (isArray && !/^(0|[1-9]\d*)$/.test(String(key))) return false
    const field = descriptors[key as string]
    if (!field || !field.enumerable || !('value' in field) || !dataOnly(field.value, seen, depth + 1)) return false
  }
  return true
}

function exactPair(value: Record<string, unknown>): value is Record<(typeof PAIR_KEYS)[number], unknown> {
  return Object.keys(value).length === PAIR_KEYS.length
    && PAIR_KEYS.every((key) => Object.hasOwn(value, key))
}

function compareCountry(a: { countryCode: CountryCode }, b: { countryCode: CountryCode }) {
  return a.countryCode < b.countryCode ? -1 : a.countryCode > b.countryCode ? 1 : 0
}

/**
 * A server time is selected internally. Re-proves each raw untrusted Grok
 * pair using the merged V1 quarantine. Does not accept prevalidated caller
 * reports as authority. A bad pair blocks the entire batch without output
 * containing source text, raw quotes, URLs or personal details.
 */
function grokForschungsReviewQueueIntern(
  input: unknown, mode: 'v1' | 'bridge-v2',
): GrokReviewQueueV1Ergebnis {
  const maxPairs = mode === 'bridge-v2' ? BRIDGE_V2_COUNTRY_CODES.length : MAX_PAIRS
  if (!Array.isArray(input) || input.length < 1 || input.length > maxPairs) return blocked('invalid_batch')
  // Catch traps from adversarial proxies before reading any caller data.
  try {
    if (!dataOnly(input, new WeakSet())) return blocked('invalid_json_tree')
  } catch {
    return blocked('invalid_json_tree')
  }
  const acceptedCountries: readonly string[] = mode === 'bridge-v2' ? BRIDGE_V2_COUNTRY_CODES : COUNTRY_CODES
  const version = mode === 'bridge-v2' ? 2 : 1

  const now = new Date()
  const seen = new Set<CountryCode>()
  const countryRows: Array<Extract<GrokReviewQueueV1Ergebnis, { status: 'research_review_queue_prepared' }>['countries'][number]> = []
  let total = 0, awaiting = 0, blockedCount = 0

  for (const raw of input) {
    const pair = record(raw)
    if (!pair || !exactPair(pair)) return blocked('invalid_pair')
    if (typeof pair.countryCode !== 'string' || !acceptedCountries.includes(pair.countryCode)) {
      return blocked('invalid_country')
    }
    const country = pair.countryCode as CountryCode
    if (seen.has(country)) return blocked('duplicate_country')
    seen.add(country)

    const examined = mode === 'bridge-v2'
      ? grokRecherchePaketQuarantaeneBridgeV2(pair.candidatePackage, pair.verification, country, now)
      : grokRecherchePaketQuarantaene(pair.candidatePackage, pair.verification, country, now)
    if (examined.status === 'blocked') return blocked(examined.reason)

    // A digest of submitted model data is an idempotency identifier only.
    // It is NOT an independently witnessed government source fingerprint.
    const submitted = sha256Hex(JSON.stringify({
      version,
      countryCode: country,
      package: pair.candidatePackage,
      verification: pair.verification,
    }))
    const submissionKey = 'grok-submission:v' + version + ':' + submitted

    const candidates = examined.candidates.map((candidate) => Object.freeze({
      candidateId: candidate.candidateId,
      reviewKey: 'grok-review-item:v' + version + ':' + sha256Hex(JSON.stringify([submissionKey, candidate.candidateId])),
      state: candidate.disposition === 'blocked' ? 'blocked' as const : 'needs_independent_source_review' as const,
      findings: Object.freeze([...candidate.findings]),
    }))
    const rejected = candidates.filter((candidate) => candidate.state === 'blocked').length
    total += candidates.length
    blockedCount += rejected
    awaiting += candidates.length - rejected
    countryRows.push(Object.freeze({
      countryCode: country,
      packageId: examined.packageId,
      untrustedSubmissionKey: submissionKey,
      botReportedReady: examined.reportedReadyForTlQualification,
      ...(mode === 'bridge-v2' ? { researchLimitsAttestation: examined.researchLimitsAttestation } : {}),
      botReportedBlocked: examined.reportedBlocked,
      candidates: Object.freeze(candidates),
    }))
  }

  countryRows.sort(compareCountry)
  const queueKey = 'grok-review-queue:v' + version + ':' + sha256Hex(JSON.stringify(
    countryRows.map((row) => [row.countryCode, row.untrustedSubmissionKey]),
  ))

  return Object.freeze({
    status: 'research_review_queue_prepared',
    queueKey,
    researchStatus: 'RESEARCH_ONLY',
    databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT',
    sourceCustody: 'not_verified',
    verifierIndependence: 'same_executor_not_independent',
    acceptedRules: 0,
    databaseWrites: 0,
    totalCandidates: total,
    awaitingIndependentReview: awaiting,
    blockedCandidates: blockedCount,
    countries: Object.freeze(countryRows),
  })
}

/** Five-country historical V1 behavior, signatures and key namespaces. */
export function grokForschungsReviewQueueVorbereiten(input: unknown): GrokReviewQueueV1Ergebnis {
  return grokForschungsReviewQueueIntern(input, 'v1')
}

/** Seven-country V2 planning, fully offline, unpersisted, never Official Truth. */
export function grokForschungsReviewQueueVorbereitenV2(input: unknown): GrokReviewQueueV1Ergebnis {
  return grokForschungsReviewQueueIntern(input, 'bridge-v2')
}
