// Official Truth Grok research-package intake V1 (offline, deterministic).
// Input: the actual Chief-of-Staff schema_version=1 candidate-package.json
// and verification.json pair. All output is RESEARCH_ONLY / quarantine.
// Never treats same-executor verification or a source URL as trusted custody.
// No database, network, model, secret, accepted Evidence/Rule or visitor result.

import { REGEL_FAKT_ARTEN } from '@/lib/readiness/rule-claims'
import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'
import { OFFICIAL_VISA_MODES } from '@/lib/readiness/official'

const COUNTRIES = ['IT', 'FR', 'ES', 'JP', 'US'] as const
const BRIDGE_V2_COUNTRIES = ['DE', 'TH', ...COUNTRIES] as const
const CANDIDATE = /^CAND-[A-Z0-9-]{3,64}$/
const PACKAGE = /^OT-CH-(IT|FR|ES|JP|US)-CAND-[0-9]{8}-[0-9]{3}$/
const VERIFY = /^OT-CH-(IT|FR|ES|JP|US)-VERIFY-[0-9]{8}-[0-9]{3}$/
const BRIDGE_V2_PACKAGE = /^OT-CH-(DE|TH|IT|FR|ES|JP|US)-CAND-[0-9]{8}-[0-9]{3}$/
const BRIDGE_V2_VERIFY = /^OT-CH-(DE|TH|IT|FR|ES|JP|US)-VERIFY-[0-9]{8}-[0-9]{3}$/
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_INPUT_LENGTH = 800_000
const MAX_SOURCES = 32
const MAX_CANDIDATES = 64
const MAX_CLAIMS = 32
const BLOCKED = 'blocked_with_exact_reason'
const SUGGESTED = 'candidate_ready_for_TL_qualification'

export type GrokForschungSperrgrund =
  | 'invalid_reference_time'
  | 'invalid_package'
  | 'invalid_verification'
  | 'invalid_scope'
  | 'invalid_source_set'
  | 'invalid_candidate_set'
  | 'verification_identity_mismatch'
  | 'count_mismatch'
  | 'future_report'
  | 'forbidden_personal_field'
  | 'input_limit'

export type GrokKandidatBefund =
  | 'bot_blocked'
  | 'candidate_scope_mismatch'
  | 'source_reference_missing'
  | 'requirement_type_unsupported'
  | 'fact_kind_unsupported'
  | 'eta_requirement_type_wrong'
  | 'visa_mode_unsupported'
  | 'visa_mode_on_nonvisa'
  | 'unsupported_stay_column'

export type GrokResearchIntakeErgebnis =
  | { readonly status: 'blocked'; readonly reason: GrokForschungSperrgrund }
  | {
      readonly status: 'quarantined_research_only'
      readonly packageId: string
      readonly countryCode: (typeof BRIDGE_V2_COUNTRIES)[number]
      readonly researchStatus: 'RESEARCH_ONLY'
      readonly databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT'
      readonly verificationClass: 'same_executor_not_independent'
      readonly sourceCustody: 'not_verified'
      readonly acceptedRules: 0
      readonly databaseWrites: 0
      /** V2-only reporter declaration; never independently verified. */
      readonly researchLimitsAttestation?: 'bot_reported_only' | 'missing_in_original'
      readonly reportedReadyForTlQualification: number
      readonly reportedBlocked: number
      readonly candidates: readonly {
        readonly candidateId: string
        readonly disposition: 'requires_independent_review' | 'blocked'
        readonly findings: readonly GrokKandidatBefund[]
      }[]
    }

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null ? value as Record<string, unknown> : null
}

function blocked(reason: GrokForschungSperrgrund): GrokResearchIntakeErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function utc(value: unknown): number | null {
  if (typeof value !== 'string' || !ISO_UTC.test(value)) return null
  const instant = Date.parse(value)
  if (!Number.isFinite(instant)) return null
  // Reject normalized invalid calendar dates (e.g. 31 February).
  if (new Date(instant).toISOString().slice(0, 19) !== value.slice(0, 19)) return null
  return instant
}

function safeShape(value: unknown, seen: WeakSet<object>, depth = 0): boolean {
  // Research input must be plain JSON-like data, with no getters, proxies,
  // symbols, functions, sparse arrays or cyclic/aliased nested references.
  if (depth > 15) return false
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object') return false
  try {
    if (seen.has(value)) return false
    seen.add(value)
    const array = Array.isArray(value)
    if (array && (Object.getPrototypeOf(value) !== Array.prototype || value.length > 256)) return false
    if (!array && !record(value)) return false
    const keys = Reflect.ownKeys(value).filter(key => !(array && key === 'length'))
    if (keys.length > 256 || (array && keys.length !== value.length)) return false
    for (const key of keys) {
      if (typeof key !== 'string') return false
      if (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)) return false
      const field = Object.getOwnPropertyDescriptor(value, key)
      if (!field || !field.enumerable || !('value' in field)) return false
      const norm = key.toLowerCase().replace(/[^a-z]/g, '')
      if ([
        'passportnumber', 'documentnumber', 'mrz', 'biometric', 'biometrics',
        'travellername', 'travelername', 'dateofbirth', 'birthdate', 'dob',
        'accountid', 'userid', 'tripid', 'emailaddress', 'healthrecord',
        'passportscan', 'documentscan',
      ].includes(norm)) return false
      if (!safeShape(field.value, seen, depth + 1)) return false
    }
    return true
  } catch {
    return false
  }
}

function officialUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.length < 12 || value.length > 500 || !value.startsWith('https://')) return false
  if (/[\s\\\u0000-\u001f]/.test(value)) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
      && parsed.hostname.length > 3 && parsed.hostname !== 'localhost'
  } catch { return false }
}

/**
 * Only matches the observed 05.11.2026 Grok V1 handoff shape.
 * The result is a redacted, non-authoritative preflight for a future
 * server-owned source/evidence review queue; it is NEVER an import request.
 * 'candidate_ready_for_TL_qualification' is merely an untrusted bot label.
 */
function grokRecherchePaketQuarantaeneIntern(
  candidatePackage: unknown,
  verification: unknown,
  expectedDestination: string,
  referenceTime: Date,
  mode: 'v1' | 'bridge-v2',
): GrokResearchIntakeErgebnis {
  if (!(referenceTime instanceof Date) || !Number.isFinite(referenceTime.getTime())) return blocked('invalid_reference_time')
  if (!safeShape(candidatePackage, new WeakSet()) || !safeShape(verification, new WeakSet())) return blocked('forbidden_personal_field')
  let bytes: string
  try { bytes = JSON.stringify([candidatePackage, verification]) } catch { return blocked('invalid_package') }
  if (bytes.length > MAX_INPUT_LENGTH) return blocked('input_limit')

  const p = record(candidatePackage), v = record(verification)
  if (!p || p.schema_version !== 1 || typeof p.package_id !== 'string'
    || !(mode === 'bridge-v2' ? BRIDGE_V2_PACKAGE : PACKAGE).test(p.package_id)) return blocked('invalid_package')
  if (!v || v.schema_version !== 1 || typeof v.verification_id !== 'string'
    || !(mode === 'bridge-v2' ? BRIDGE_V2_VERIFY : VERIFY).test(v.verification_id)) return blocked('invalid_verification')
  if (v.package_id !== p.package_id) return blocked('verification_identity_mismatch')
  const country = p.package_id.split('-')[2]
  const permittedCountries: readonly string[] = mode === 'bridge-v2' ? BRIDGE_V2_COUNTRIES : COUNTRIES
  if (!permittedCountries.includes(expectedDestination)
    || expectedDestination !== country
    || v.verification_id.split('-')[2] !== country) return blocked('invalid_scope')

  const pkgTime = utc(p.generated_at_utc), checkTime = utc(v.generated_at_utc)
  if (pkgTime === null || checkTime === null) return blocked('invalid_package')
  if (pkgTime > checkTime || checkTime > referenceTime.getTime()) return blocked('future_report')

  const boundary = record(p.authority_boundary), scope = record(p.traveller_scope)
  // Actual DE/TH original packages omit hard_limits_respected entirely.
  // Their missing declaration is never treated as true/verified.
  const missingLimits = mode === 'bridge-v2' && (country === 'DE' || country === 'TH')
    && !Object.hasOwn(p, 'hard_limits_respected')
  const limitsDeclared = p.hard_limits_respected === true
  if (!boundary || boundary.mode !== 'RESEARCH_ONLY' || boundary.not_accepted_official_truth !== true
    || boundary.not_approved_for_database_import !== true || boundary.no_supabase_writes !== true
    || boundary.stage1_readback_917_untouched !== true || (!limitsDeclared && !missingLimits)
    || v.authority_boundary_preserved !== true || !Array.isArray(v.external_writes)
    || v.external_writes.length !== 0) return blocked('invalid_package')

  const expectedDocument = mode === 'bridge-v2' && country === 'TH'
    ? 'ordinary Swiss passport'
    : 'ordinary Swiss passport (product scope)'
  if (!scope || scope.citizenship !== 'CH' || scope.destination !== country
    || scope.document !== expectedDocument) return blocked('invalid_scope')
  if (v.method !== 'independent_second_pass_same_executor_re_fetch') return blocked('invalid_verification')

  const sources = record(p.sources)
  if (!sources || Object.keys(sources).length < 1 || Object.keys(sources).length > MAX_SOURCES) return blocked('invalid_source_set')
  for (const [key, raw] of Object.entries(sources)) {
    const source = record(raw)
    if (!/^SRC-[A-Z0-9-]{3,80}$/.test(key) || !source || source.source_class !== 'official_authority'
      || !officialUrl(source.canonical_url)) return blocked('invalid_source_set')
  }

  const candidates = p.candidates, reports = record(v.per_candidate), counts = record(v.counts)
  if (!Array.isArray(candidates) || candidates.length < 1 || candidates.length > MAX_CANDIDATES
    || !reports || !counts || Object.keys(reports).length !== candidates.length) return blocked('invalid_candidate_set')
  const ids = new Set<string>()
  const rows: Array<Extract<GrokResearchIntakeErgebnis, { status: 'quarantined_research_only' }>['candidates'][number]> = []
  let ready = 0, botBlocked = 0

  for (const raw of candidates) {
    const c = record(raw)
    if (!c || typeof c.candidate_id !== 'string' || !CANDIDATE.test(c.candidate_id) || ids.has(c.candidate_id)) return blocked('invalid_candidate_set')
    ids.add(c.candidate_id)
    const report = record(reports[c.candidate_id])
    if (!report || (report.verdict !== SUGGESTED && report.verdict !== BLOCKED)) return blocked('invalid_verification')
    if (report.verdict === SUGGESTED) ready += 1
    else botBlocked += 1
    if (!Array.isArray(c.claims) || c.claims.length > MAX_CLAIMS) return blocked('invalid_candidate_set')
    const issues = new Set<GrokKandidatBefund>()
    if (report.verdict === BLOCKED) issues.add('bot_blocked')

    const candidateScope = record(c.scope)
    if (!candidateScope || candidateScope.destination_country_code !== country
      || candidateScope.citizenship_mode !== 'required'
      || JSON.stringify(candidateScope.citizenship_country_codes) !== '["CH"]'
      || candidateScope.credential_option_mode !== 'option'
      || candidateScope.document_type !== 'passport'
      || candidateScope.issuing_country_code !== 'CH'
      || candidateScope.related_citizenship_country_code !== 'CH'
      || candidateScope.passport_class_product_scope !== 'ordinary') issues.add('candidate_scope_mismatch')

    if (!(OFFICIAL_REQUIREMENT_TYPES as readonly string[]).includes(c.requirement_type as string)) issues.add('requirement_type_unsupported')
    if (!(REGEL_FAKT_ARTEN as readonly string[]).includes(c.fact_kind as string)) issues.add('fact_kind_unsupported')
    if (c.candidate_id.includes('ESTA') && c.requirement_type !== 'electronic_travel_authorization') issues.add('eta_requirement_type_wrong')

    const fact = record(c.proposed_fact)
    if (fact && Object.hasOwn(fact, 'visa_mode')) {
      if (c.requirement_type !== 'visa') issues.add('visa_mode_on_nonvisa')
      else if (!(OFFICIAL_VISA_MODES as readonly string[]).includes(fact.visa_mode as string)) issues.add('visa_mode_unsupported')
    }
    const mapping = record(c.schema_mapping)
    if (mapping && Object.keys(mapping).some((name) => name.endsWith('.max_days'))) issues.add('unsupported_stay_column')

    for (const rawClaim of c.claims) {
      const claim = record(rawClaim)
      if (!claim || typeof claim.source_ref !== 'string' || !Object.hasOwn(sources, claim.source_ref)) {
        issues.add('source_reference_missing')
      }
    }
    rows.push(Object.freeze({
      candidateId: c.candidate_id,
      disposition: issues.size ? 'blocked' as const : 'requires_independent_review' as const,
      findings: Object.freeze([...issues].sort()),
    }))
  }
  for (const id of Object.keys(reports)) if (!ids.has(id)) return blocked('verification_identity_mismatch')
  if (counts.candidate_ready_for_TL_qualification !== ready || counts.blocked_with_exact_reason !== botBlocked) {
    return blocked('count_mismatch')
  }
  rows.sort((a, b) => a.candidateId < b.candidateId ? -1 : a.candidateId > b.candidateId ? 1 : 0)

  return Object.freeze({
    status: 'quarantined_research_only',
    packageId: p.package_id,
    countryCode: country as (typeof BRIDGE_V2_COUNTRIES)[number],
    researchStatus: 'RESEARCH_ONLY',
    databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT',
    verificationClass: 'same_executor_not_independent',
    sourceCustody: 'not_verified',
    acceptedRules: 0,
    databaseWrites: 0,
    ...(mode === 'bridge-v2' ? { researchLimitsAttestation: missingLimits ? 'missing_in_original' as const : 'bot_reported_only' as const } : {}),
    reportedReadyForTlQualification: ready,
    reportedBlocked: botBlocked,
    candidates: Object.freeze(rows),
  })
}

/** Original five-country behavior remains strict and unmodified. */
export function grokRecherchePaketQuarantaene(
  candidatePackage: unknown,
  verification: unknown,
  expectedDestination: string,
  referenceTime: Date,
): GrokResearchIntakeErgebnis {
  return grokRecherchePaketQuarantaeneIntern(candidatePackage, verification, expectedDestination, referenceTime, 'v1')
}

/** V2: original raw paired research files, NOT annotated V2 or accepted Evidence. */
export function grokRecherchePaketQuarantaeneBridgeV2(
  candidatePackage: unknown,
  verification: unknown,
  expectedDestination: string,
  referenceTime: Date,
): GrokResearchIntakeErgebnis {
  return grokRecherchePaketQuarantaeneIntern(candidatePackage, verification, expectedDestination, referenceTime, 'bridge-v2')
}
