// Local current-version lookup. No hosted client, cache, fingerprint argument or production authority.
import 'server-only'
import { readPin } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { provenanceCanonical } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { REGEL_FAKT_ARTEN, regelScopeAusEvidenceScope, type RegelFaktArt } from '../../../lib/readiness/rule-claims'
import { OFFICIAL_REQUIREMENT_TYPES, type OfficialRequirementType } from '../../../types/trips'
import { readCandidate, type Cursor } from '../official-truth-original-custody-1/storage'
import { LocalPgConnection, pgBytes, pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'

export const CURRENT_VERSION_LOOKUP_LIMITS = Object.freeze({
  maxAcceptedEvents: 1024,
  maxReviews: 1024,
  maxReceiptBytes: 262_144,
  maxAggregateReceiptBytes: 8_388_608,
})

export type CurrentVersionRequest = Readonly<{
  definition: unknown
  scope: unknown
  factKind: unknown
  requirementType: unknown
}>

type ValidatedRequest = Readonly<{
  definition: Readonly<{ id: string; version: number; digest: string }>
  scopeBytes: Uint8Array
  ruleScopeKey: string
  factKind: RegelFaktArt
  requirementType: OfficialRequirementType
}>

const refusalReasons = ['accepted_corpus_incomplete', 'accepted_corpus_unclassifiable', 'lookup_budget_count', 'lookup_budget_receipt', 'lookup_budget_bytes'] as const
export type CurrentVersionRefusalReason = (typeof refusalReasons)[number]

type Common = Readonly<{
  productionAcceptedRead: 'NOT_AUTHORIZED'
  positiveVisaCells: 0
  reusablePositiveCache: false
  witness: Cursor
  readAt: string
  ruleScopeKey: string
  acceptedCount: number
}>

export type CurrentVersionLookupResult = Common & (
  | Readonly<{ status: 'no_match'; matchCount: 0 }>
  | Readonly<{ status: 'ambiguous'; matchCount: number }>
  | Readonly<{ status: 'refused'; reason: CurrentVersionRefusalReason }>
  | Readonly<{
    status: 'synthetic_current_version_verified'
    recordFingerprint: string
    matchCount: 1
    proof: Awaited<ReturnType<typeof readCandidate>>
  }>
)

const columns = 'outcome,reason,record_fingerprint,match_count,accepted_count,rule_scope_key,definition_id,definition_version,definition_digest,fact_kind,requirement_type,read_at,production_accepted_read,positive_visa_cells'
const readAtPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,6}Z$/
const fingerprintPattern = /^ot-provenance-v1:[a-f0-9]{64}$/

function invalid(): never {
  throw new Error('identity_request_invalid')
}
function shape(): never {
  throw new Error('current_version_lookup_shape')
}

function validateRequest(request: CurrentVersionRequest): ValidatedRequest {
  const definition = readPin(request.definition)
  const scope = regelScopeAusEvidenceScope(request.scope)
  if (!definition || !scope.ok) invalid()
  const reread = regelScopeAusEvidenceScope(scope.scope)
  if (!reread.ok || reread.key !== scope.key) invalid()
  if (scope.scope.requirementType !== request.requirementType) invalid()
  if (!(REGEL_FAKT_ARTEN as readonly string[]).includes(String(request.factKind))) invalid()
  if (!(OFFICIAL_REQUIREMENT_TYPES as readonly string[]).includes(String(request.requirementType))) invalid()
  const canonical = provenanceCanonical(scope.scope, 8192)
  if (!canonical) invalid()
  return Object.freeze({
    definition,
    scopeBytes: Buffer.from(canonical),
    ruleScopeKey: scope.key,
    factKind: request.factKind as RegelFaktArt,
    requirementType: request.requirementType as OfficialRequirementType,
  })
}

function validateWitness(witness: Cursor): void {
  if (!witness || !/^(0|[1-9][0-9]{0,5})$/.test(witness.sequence) || !/^[a-f0-9]{64}$/.test(witness.eventHash)) invalid()
}

/**
 * Caller keeps one READ COMMITTED transaction open through this return.
 * The lifecycle SHARE lock therefore covers selection and the existing custody proof.
 * The returned fingerprint is bound to that witness and read time only.
 * A later decision runs the proof again.
 */
export async function lookupCurrentVersion(cluster: LocalProofCluster, connection: LocalPgConnection, request: CurrentVersionRequest, key: string, witness: Cursor): Promise<CurrentVersionLookupResult> {
  const validated = validateRequest(request)
  validateWitness(witness)
  const rows = await connection.query(
    `SELECT outcome,reason,record_fingerprint,match_count::text AS match_count,accepted_count::text AS accepted_count,rule_scope_key,definition_id,definition_version::text AS definition_version,definition_digest,fact_kind,requirement_type,read_at,production_accepted_read,positive_visa_cells::text AS positive_visa_cells FROM official_original_api.lookup_current_version($1::text,$2::bigint,$3::text,$4::bytea,$5::text,$6::text,$7::bigint,$8::text)`,
    [pgText(validated.definition.id), pgText(String(validated.definition.version), 20), pgText(validated.definition.digest), pgBytes(validated.scopeBytes), pgText(validated.factKind), pgText(validated.requirementType), pgText(witness.sequence, 20), pgText(witness.eventHash)],
  )
  const row = rows[0]
  if (rows.length !== 1 || !row || Object.keys(row).join(',') !== columns) shape()
  if (row.production_accepted_read !== 'NOT_AUTHORIZED' || row.positive_visa_cells !== '0') shape()
  if (!row.read_at || !readAtPattern.test(row.read_at)) shape()
  if (row.rule_scope_key !== validated.ruleScopeKey || row.definition_id !== validated.definition.id || row.definition_version !== String(validated.definition.version) || row.definition_digest !== validated.definition.digest) shape()
  if (row.fact_kind !== validated.factKind || row.requirement_type !== validated.requirementType) shape()
  if (!/^(0|[1-9][0-9]{0,6})$/.test(row.accepted_count ?? '')) shape()
  const acceptedCount = Number(row.accepted_count)
  const common = Object.freeze({
    productionAcceptedRead: 'NOT_AUTHORIZED' as const,
    positiveVisaCells: 0 as const,
    reusablePositiveCache: false as const,
    witness,
    readAt: row.read_at,
    ruleScopeKey: validated.ruleScopeKey,
    acceptedCount,
  })
  if (row.outcome === 'no_match') {
    if (row.reason !== null || row.record_fingerprint !== null || row.match_count !== '0') shape()
    return Object.freeze({ ...common, status: 'no_match', matchCount: 0 })
  }
  if (row.outcome === 'ambiguous') {
    if (row.reason !== null || row.record_fingerprint !== null || !row.match_count || !/^[1-9][0-9]*$/.test(row.match_count)) shape()
    const matchCount = Number(row.match_count)
    if (matchCount < 2) shape()
    return Object.freeze({ ...common, status: 'ambiguous', matchCount })
  }
  if (row.outcome === 'refused') {
    if (row.record_fingerprint !== null || row.match_count !== null || !refusalReasons.includes(row.reason as CurrentVersionRefusalReason)) shape()
    return Object.freeze({ ...common, status: 'refused', reason: row.reason as CurrentVersionRefusalReason })
  }
  if (row.outcome !== 'unique' || row.reason !== null || row.match_count !== '1' || !row.record_fingerprint || !fingerprintPattern.test(row.record_fingerprint)) shape()
  const proof = await readCandidate(cluster, connection, row.record_fingerprint, key, witness)
  if (proof.recordFingerprint !== row.record_fingerprint || proof.productionAcceptedRead !== 'NOT_AUTHORIZED' || proof.positiveVisaCells !== 0 || proof.cursor.sequence !== witness.sequence || proof.cursor.eventHash !== witness.eventHash) shape()
  return Object.freeze({ ...common, status: 'synthetic_current_version_verified', recordFingerprint: row.record_fingerprint, matchCount: 1 as const, proof })
}
