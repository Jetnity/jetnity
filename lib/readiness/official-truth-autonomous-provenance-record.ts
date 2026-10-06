// Historical values only. These codecs do not certify origin, freshness or live custody.
import { z } from 'zod'
import { officialFrische } from '@/lib/readiness/official'
import { officialTruthReviewIdentityV3 } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import { contentEvidenceVersionV2, readContentIdentityBinding, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { evidenceScopeLesen, evidenceSuchschluessel, type EvidenceScope } from '@/lib/readiness/evidence'
import { REGEL_FAKT_ARTEN, regelScopeAusEvidenceScope, regelFaktKanonischLesen, type RegelScope, type RegelFaktArt } from '@/lib/readiness/rule-claims'
import { OFFICIAL_REQUIREMENT_TYPES, type OfficialRequirementType } from '@/types/trips'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import {
  decodeProvenanceBytes, historical, historicalPinFor, historicalValuesEqual, ownRecord, pinsEqual,
  provenanceCanonical, provenanceHash, readPin, refused, type HistoricalResult,
} from '@/lib/readiness/official-truth-autonomous-provenance-artifact'

const id = z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/)
const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const pin = z.object({ id, version: positive, digest: z.string().regex(/^[a-f0-9]{64}$/) }).strict()
const versionId = z.string().regex(/^ev2_[a-f0-9]{32}$/)
const kind = z.enum(REGEL_FAKT_ARTEN)
const requirement = z.enum(OFFICIAL_REQUIREMENT_TYPES)
const quality = z.enum(['explicit_primary_statement', 'composed_from_multiple_primary_sources'])
const scopeKeys = ['destinationCountryCode', 'transitCountryCode', 'citizenship', 'credentialOption', 'residence', 'requirementType', 'validity'] as const
const scope = z.custom<RegelScope>(value => {
  if (!ownRecord(value, scopeKeys)) return false
  const parsed = regelScopeAusEvidenceScope(value)
  return parsed.ok && historicalValuesEqual(value, parsed.scope)
})
const evidenceScope = z.custom<EvidenceScope>(value => {
  if (!ownRecord(value, [...scopeKeys, 'sourceId'])) return false
  const parsed = evidenceScopeLesen(value)
  return parsed.ok && historicalValuesEqual(value, parsed.scope)
})
const binding = z.custom<ContentIdentityBinding>(value => {
  const parsed = readContentIdentityBinding(value)
  return parsed.ok && historicalValuesEqual(value, parsed.value)
})
const identityFields = {
  sourceId: z.string(), contentItemId: z.string(), contentItemVersion: positive,
  representationId: z.string(), representationVersion: positive, identityProfileId: z.string(), identityProfileVersion: positive,
  identitySchema: z.literal(2), lookupKey: z.string(), canonicalUrl: z.string(), contentType: z.string(),
  sourceContentHash: z.string(), retrievedAt: z.string(), validFrom: z.string().nullable(), validUntil: z.string().nullable(),
}
const identity = z.object({ ...identityFields, versionId }).strict().refine(value => {
  const { versionId: expected, ...preimage } = value
  const read = contentEvidenceVersionV2(preimage)
  return read.ok && read.value.versionId === expected && historicalValuesEqual(read.value.identity, preimage)
})
const ref = z.object({ sourceId: z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/), contentItemId: z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/) }).strict()
function orderedUnique(values: readonly string[]): boolean { return values.every((s, i) => i === 0 || values[i - 1]! < s) }
const refs = z.array(ref).min(1).max(8).refine(values => orderedUnique(values.map(v => JSON.stringify([v.sourceId, v.contentItemId]))))
const dimensionBasis = z.object({
  destinationCountryCode: z.object({ category: z.unknown(), basis: pin }).strict(),
  transitCountryCode: z.object({ category: z.unknown(), basis: pin }).strict(),
  citizenship: z.object({ category: z.unknown(), basis: pin }).strict(),
  credentialOption: z.object({ category: z.unknown(), basis: pin }).strict(),
  residence: z.object({ category: z.unknown(), basis: pin }).strict(),
  requirementType: z.object({ category: z.unknown(), basis: pin }).strict(),
  validity: z.object({ category: z.unknown(), basis: pin }).strict(),
}).strict().refine(value => scope.safeParse(Object.fromEntries(scopeKeys.map(key => [key, value[key].category]))).success)
const cellDefinition = z.object({ id, version: positive, scope }).strict()
const admission = z.object({ cell: pin, scopeContract: pin, corpusAdmissionContract: pin, dimensionBasis, evaluationDatePlan: pin.nullable() }).strict()
  .refine(value => {
    const date = value.dimensionBasis.validity.category as RegelScope['validity']
    return (date.mode === 'travel_date') === (value.evaluationDatePlan !== null)
  })
const custody = z.object({
  cell: pin, globalAdmission: pin, scopeContract: pin, evidenceScope, evidenceIdentity: identity,
  observation: pin, validityOrigin: pin, acceptedOrigin: pin, identityContract: pin, hashContract: pin,
}).strict().refine(value => {
  const key = evidenceSuchschluessel(value.evidenceScope, { sourceId: value.evidenceIdentity.sourceId, contentItemId: value.evidenceIdentity.contentItemId, representationId: value.evidenceIdentity.representationId })
  return key.ok && key.key === value.evidenceIdentity.lookupKey && value.evidenceScope.sourceId === value.evidenceIdentity.sourceId
})
const selection = z.object({ cell: pin, requirementType: requirement, factKind: kind, evidenceQuality: quality, requiredContentItemRefs: refs, selectionContract: pin }).strict()
  .refine(value => value.evidenceQuality === 'explicit_primary_statement' ? value.requiredContentItemRefs.length === 1 : value.requiredContentItemRefs.length >= 2)
const selectedSupport = z.object({ versionId, custody: pin }).strict()
const manifest = z.object({
  selectionDefinition: pin, cell: pin, globalAdmission: pin, requirementType: requirement, factKind: kind, evidenceQuality: quality,
  eligibleVersionSnapshot: pin, catalogSnapshot: pin, extractorRegistrySnapshot: pin, policyRegistrySnapshot: pin.nullable(),
  supports: z.array(selectedSupport).min(1).max(8),
}).strict().refine(value => {
  const primary = value.evidenceQuality === 'explicit_primary_statement'
  return primary === (value.policyRegistrySnapshot === null) && (primary ? value.supports.length === 1 : value.supports.length >= 2)
    && orderedUnique(value.supports.map(s => s.versionId))
    && new Set(value.supports.map(s => provenanceCanonical(s.custody))).size === value.supports.length
})
const qualification = z.object({ binding, itemDefinition: pin, representationDefinition: pin, identityProfileDefinition: pin, qualificationContract: pin }).strict()
const compact = z.object({ ...identityFields, versionId }).omit({ lookupKey: true }).strict()
const safePreimage = z.object({
  v: z.literal(3),
  candidate: z.object({ scope, key: z.string(), factKind: kind, evidenceQuality: quality, supportVersionIds: z.array(versionId).min(1).max(8), proposal: z.null() }).strict(),
  supports: z.array(compact).min(1).max(8),
}).strict().refine(value => {
  const cell = regelScopeAusEvidenceScope(value.candidate.scope)
  if (!cell.ok || cell.key !== value.candidate.key || !orderedUnique(value.candidate.supportVersionIds)
    || !historicalValuesEqual(value.candidate.supportVersionIds, value.supports.map(s => s.versionId))) return false
  const items = new Set<string>()
  for (const support of value.supports) {
    const lookup = evidenceSuchschluessel({ ...cell.scope, sourceId: support.sourceId }, { sourceId: support.sourceId, contentItemId: support.contentItemId, representationId: support.representationId })
    if (!lookup.ok || !identity.safeParse({ ...support, lookupKey: lookup.key }).success) return false
    items.add(JSON.stringify([support.sourceId, support.contentItemId]))
  }
  return items.size === value.supports.length && (value.candidate.evidenceQuality === 'explicit_primary_statement' ? items.size === 1 : items.size >= 2)
})
const review = z.object({ cell: pin, selectedSupportManifest: pin, constructionContract: pin, safePreimage, reviewPacketKey: z.string().regex(/^review-packet:v3:[a-f0-9]{64}$/) }).strict().refine(value => {
  const result = officialTruthReviewIdentityV3(value.safePreimage.candidate, value.safePreimage.supports)
  return result.ok && value.reviewPacketKey === `review-packet:v3:${result.digest}` && historicalValuesEqual(result.preimage, value.safePreimage)
})
const custodyBinding = z.object({ receiptFingerprint: z.string().regex(/^ot-provenance-v1:[a-f0-9]{64}$/), globalAdmission: pin, selectedSupportManifest: pin, autonomousReviewConstruction: pin }).strict()

const codecs = {
  GlobalCellAdmissionV1: admission, AcceptedEvidenceCustodyV1: custody,
  SupportSelectionDefinitionV1: selection, SelectedSupportManifestV1: manifest,
  GlobalRepresentationQualificationV1: qualification, AutonomousReviewConstructionV1: review,
  CustodyDependencyBindingV1: custodyBinding,
} as const
export type HistoricalArtifactKind = keyof typeof codecs
export type ArtifactValue<K extends HistoricalArtifactKind> = z.infer<(typeof codecs)[K]>
export type HistoricalArtifact<K extends HistoricalArtifactKind> = Readonly<{ kind: K; schemaVersion: 1; value: ArtifactValue<K> }>
export type GlobalCellDefinitionV1 = z.infer<typeof cellDefinition>
export type AcceptedEvidenceCustodyV1 = ArtifactValue<'AcceptedEvidenceCustodyV1'>
export type SelectedSupportManifestV1 = ArtifactValue<'SelectedSupportManifestV1'>
export type SafeReviewPreimage = z.infer<typeof safePreimage>

/** Detach only AFTER structural validation, then apply an exact closed semantic codec. */
function parse<T>(schema: z.ZodType<T>, input: unknown): HistoricalResult<T> {
  const bytes = provenanceCanonical(input)
  if (bytes === null) return refused('schema_incompatible')
  try {
    const result = schema.safeParse(JSON.parse(bytes))
    // No stripping/normalizing optional fields, categories or unknown data.
    return result.success && historicalValuesEqual(result.data, input) ? historical(result.data) : refused('schema_incompatible')
  } catch { return refused('schema_incompatible') }
}
export function readGlobalCellDefinition(input: unknown): HistoricalResult<GlobalCellDefinitionV1> { return parse(cellDefinition, input) }
export function readSafeReviewPreimage(input: unknown): HistoricalResult<SafeReviewPreimage> { return parse(safePreimage, input) }
export function readHistoricalArtifact<K extends HistoricalArtifactKind>(expectedKind: K, input: unknown): HistoricalResult<HistoricalArtifact<K>> {
  try {
    if (!Object.hasOwn(codecs, expectedKind) || provenanceCanonical(input) === null) return refused('schema_incompatible')
    const row = ownRecord(input, ['kind', 'schemaVersion', 'value'])
    if (!row || row.kind !== expectedKind || row.schemaVersion !== 1) return refused('schema_incompatible')
    const parsed = parse(codecs[expectedKind] as z.ZodType<ArtifactValue<K>>, row.value)
    return parsed.ok ? historical({ kind: expectedKind, schemaVersion: 1 as const, value: parsed.value }) : parsed
  } catch { return refused('schema_incompatible') }
}
export function decodeHistoricalArtifact<K extends HistoricalArtifactKind>(kind: K, bytes: Uint8Array): HistoricalResult<HistoricalArtifact<K>> {
  const decoded = decodeProvenanceBytes(bytes)
  return decoded.ok ? readHistoricalArtifact(kind, decoded.value) : decoded
}
export function artifactPinMatches<K extends HistoricalArtifactKind>(expectedKind: K, expectedPin: unknown, artifact: unknown): boolean {
  const p = readPin(expectedPin), parsed = readHistoricalArtifact(expectedKind, artifact)
  return !!p && parsed.ok && pinsEqual(p, historicalPinFor(p.id, p.version, parsed.value))
}
export function cellPinMatches(expectedPin: unknown, definition: unknown): boolean {
  const parsed = readGlobalCellDefinition(definition)
  return parsed.ok && pinsEqual(expectedPin, historicalPinFor(parsed.value.id, parsed.value.version, parsed.value))
}

/** #855 SupportReceipt is separate from #861 custody and retains all required nulls. */
const supportReceipt = z.object({
  versionId, identitySchema: z.literal(2), binding, canonicalFinalUrl: z.string(), contentType: z.string(), sourceContentHash: z.string(),
  acceptedRetrievedAt: z.string(), validFrom: z.string().nullable(), validUntil: z.string().nullable(),
  freshRetrieval: z.object({ requestUrl: z.string(), completedAt: z.string() }).strict(),
}).strict()
export type SupportReceipt = z.infer<typeof supportReceipt>
export function readSupportReceipt(input: unknown, evidence: unknown, referenceTime: string): HistoricalResult<SupportReceipt> {
  const support = parse(supportReceipt, input), accepted = parse(identity, evidence)
  if (!support.ok || !accepted.ok) return refused('schema_incompatible')
  const s = support.value, e = accepted.value
  const { versionId: ignoredVersion, lookupKey: ignoredKey, ...compactIdentity } = e
  void ignoredVersion; void ignoredKey
  if (!historicalValuesEqual(compactIdentity, { ...s.binding, identitySchema: 2, canonicalUrl: s.canonicalFinalUrl,
    contentType: s.contentType, sourceContentHash: s.sourceContentHash, retrievedAt: s.acceptedRetrievedAt,
    validFrom: s.validFrom, validUntil: s.validUntil }) || s.versionId !== e.versionId) return refused('evidence_identity_drift')
  // Reuse the identity time/URL codec; this does not perform a retrieval.
  const { versionId: ignored, ...identityValue } = e
  void ignored
  if (!contentEvidenceVersionV2({ ...identityValue, canonicalUrl: s.freshRetrieval.requestUrl, retrievedAt: s.freshRetrieval.completedAt }).ok
    || !contentEvidenceVersionV2({ ...identityValue, retrievedAt: referenceTime }).ok) return refused('schema_incompatible')
  if (Date.parse(e.retrievedAt) > Date.parse(referenceTime) || Date.parse(s.freshRetrieval.completedAt) < Date.parse(referenceTime)
    || officialFrische({ storedFingerprint: e.sourceContentHash, currentFingerprint: e.sourceContentHash, checkedAt: e.retrievedAt,
      validFrom: e.validFrom, validUntil: e.validUntil, now: referenceTime, hasProvider: true, sourceAvailable: true }) !== 'current') return refused('freshness_gap')
  return support
}

/** Exact legacy/v1 parser only. Does not label its result trusted or accepted. */
export function readHistoricalFactValue(art: RegelFaktArt, requirementType: OfficialRequirementType, value: unknown,
  applicabilitySchema: 1 | null, registry: QuellenRegistry): HistoricalResult<unknown> {
  if (applicabilitySchema !== null && applicabilitySchema !== 1) return refused('schema_incompatible')
  if (!kind.safeParse(art).success || !requirement.safeParse(requirementType).success
    || provenanceCanonical(value) === null || provenanceCanonical(registry) === null) return refused('schema_incompatible')
  // Existing four-argument contract rejects schema 2; never use the fifth argument/cast.
  const parsed = regelFaktKanonischLesen(art, requirementType, value, registry)
  if (!parsed.ok || !historicalValuesEqual(value, parsed.fact)) return refused('schema_incompatible')
  const row = value as Record<string, unknown>
  if ((row.schema === 1) !== (applicabilitySchema === 1)) return refused('schema_incompatible')
  return historical(parsed.fact)
}

const factPreimage = z.object({ factSchema: pin, applicabilitySchema: pin.nullable(), factKind: kind, requirementType: requirement, fact: z.unknown() }).strict()
const candidatePreimage = z.object({ scope, ruleScopeKey: z.string().regex(/^rule-scope:v1:[a-f0-9]{64}$/), factKind: kind, requirementType: requirement,
  schemaFamily: z.string().regex(/^ots_[a-z][a-z0-9_]{0,40}$/), factSchema: pin, applicabilitySchema: pin.nullable(), factHash: z.string().regex(/^ot-fact-v1:[a-f0-9]{64}$/),
  evidenceQuality: quality, supportVersionIds: z.array(versionId).min(1).max(8) }).strict()
const proofPreimage = z.object({ contract: pin, reviewPacketKey: z.string().regex(/^review-packet:v3:[a-f0-9]{64}$/),
  ruleScopeKey: z.string().regex(/^rule-scope:v1:[a-f0-9]{64}$/), factKind: kind, supportVersionIds: z.array(versionId).min(1).max(8),
  serverReferenceTime: z.string(), catalogSnapshot: pin, freshnessContract: pin, evidenceFreshnessAtReference: z.literal('current') }).strict()

/** Exact #855 fact preimage; returns only historical value/digest, never the live fact reference. */
export function historicalFactIdentity(input: unknown, applicabilityVersion: 1 | null, registry: QuellenRegistry) {
  const parsed = parse(factPreimage, input)
  if (!parsed.ok) return parsed
  const f = parsed.value
  if ((f.applicabilitySchema === null) !== (applicabilityVersion === null)) return refused('schema_incompatible')
  const fact = readHistoricalFactValue(f.factKind, f.requirementType, f.fact, applicabilityVersion, registry)
  if (!fact.ok) return fact
  return historical({ preimage: f, factHash: provenanceHash('ot-fact-v1', f)! })
}
/** Exact #855 candidate preimage, rebound to independently checked historical fact values. */
export function historicalCandidateIdentity(input: unknown, factValues: unknown, applicabilityVersion: 1 | null, registry: QuellenRegistry) {
  const candidate = parse(candidatePreimage, input), fact = historicalFactIdentity(factValues, applicabilityVersion, registry)
  if (!candidate.ok || !fact.ok) return refused('schema_incompatible')
  const c = candidate.value, f = fact.value
  const parsedScope = regelScopeAusEvidenceScope(c.scope)
  if (!parsedScope.ok || parsedScope.key !== c.ruleScopeKey || c.scope.requirementType !== c.requirementType) return refused('scope_mismatch')
  if (!orderedUnique(c.supportVersionIds) || (c.evidenceQuality === 'explicit_primary_statement' ? c.supportVersionIds.length !== 1 : c.supportVersionIds.length < 2)) return refused('support_selection_invalid')
  if (c.factHash !== f.factHash || c.factKind !== f.preimage.factKind || c.requirementType !== f.preimage.requirementType
    || !pinsEqual(c.factSchema, f.preimage.factSchema) || !historicalValuesEqual(c.applicabilitySchema, f.preimage.applicabilitySchema)) return refused('pin_inconsistent')
  return historical({ preimage: c, candidateBinding: provenanceHash('ot-candidate-v1', c)! })
}
/** Exact #855 proof preimage cross-checked against the separate #861 safe review value.
 * 'current' is an historical assertion here; no clock/authority/freshness is minted.
 */
export function historicalProofIdentity(input: unknown, construction: unknown) {
  const proof = parse(proofPreimage, input), reviewed = readHistoricalArtifact('AutonomousReviewConstructionV1', construction)
  if (!proof.ok || !reviewed.ok) return refused('schema_incompatible')
  const p = proof.value, r = reviewed.value.value, c = r.safePreimage.candidate
  if (p.reviewPacketKey !== r.reviewPacketKey || p.ruleScopeKey !== c.key || p.factKind !== c.factKind
    || !historicalValuesEqual(p.supportVersionIds, c.supportVersionIds)) return refused('custody_dependency_mismatch')
  for (const s of r.safePreimage.supports) {
    const lookup = evidenceSuchschluessel({ ...c.scope, sourceId: s.sourceId }, { sourceId: s.sourceId, contentItemId: s.contentItemId, representationId: s.representationId })
    if (!lookup.ok) return refused('scope_mismatch')
    const { versionId: ignored, ...compact } = s
    void ignored
    if (!contentEvidenceVersionV2({ ...compact, lookupKey: lookup.key, retrievedAt: p.serverReferenceTime }).ok) return refused('schema_incompatible')
    if (Date.parse(s.retrievedAt) > Date.parse(p.serverReferenceTime) || officialFrische({ storedFingerprint: s.sourceContentHash,
      currentFingerprint: s.sourceContentHash, checkedAt: s.retrievedAt, validFrom: s.validFrom, validUntil: s.validUntil,
      now: p.serverReferenceTime, hasProvider: true, sourceAvailable: true }) !== 'current') return refused('freshness_gap')
  }
  return historical({ preimage: p, proofIdentity: provenanceHash('ot-proof-v1', p)! })
}
