// Strict HISTORICAL values only. No parsed byte, pin, receipt or result is live authority.
import 'server-only'
import { Buffer } from 'node:buffer'
import { z } from 'zod'
import { sha256Hex } from './digest'
import {
  decodeProvenanceBytes, historicalValuesEqual, ownRecord, pinsEqual, provenanceCanonical,
  provenanceHash, readPin, type Pin,
} from './official-truth-autonomous-provenance-artifact'
import {
  historicalCandidateIdentity, historicalFactIdentity, historicalProofIdentity,
  readGlobalCellDefinition, readHistoricalArtifact, readSupportReceipt,
  type HistoricalArtifactKind,
} from './official-truth-autonomous-provenance-record'
import {
  contentEvidenceVersionV2, contentIdentityBinding, contentRepresentationFromRegistry,
  createContentIdentityGraph, readContentIdentityBinding, contentIdentityMatches, type ContentIdentityBinding,
} from './official-truth-content-identity'
import { evidenceScopeLesen, evidenceSuchschluessel } from './evidence'
import { checkedAtLesen, gültigkeitszeitLesen } from './official'
import { regelScopeAusEvidenceScope, REGEL_FAKT_ARTEN, type RegelFakt } from './rule-claims'
import { quellenRegistryErstellen, type QuellenRegistry } from './source-registry'
import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'
import {
  officialTruthCitationTargetLesen, officialTruthFactCitationCoverage, officialTruthCompositionRegistriesPruefen, officialTruthCompositionPhaseA,
  type OfficialTruthCompositionCitationTarget,
} from './official-truth-composition-policy-registry'
import { officialTruthExtractorDefinitionenPruefen, officialTruthExtractorUrlErlaubt } from './official-truth-trusted-fact-extractor-registry'

export const INTEGRATED_PILOT_BUNDLE_LIMITS = Object.freeze({
  receiptBytes: 262_144, bindingBytes: 4_096, artifactBytes: 1_048_576,
  totalArtifactBytes: 8_388_608, nodes: 256, edges: 1_024, depth: 8,
})
/** R1 changes only the explicitly selected LOCAL transport/storage profile. */
export const LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE = 'ot-integrated-pilot-local-closure-v2' as const
const custodyKinds = ['GlobalCellAdmissionV1', 'AcceptedEvidenceCustodyV1', 'SupportSelectionDefinitionV1',
  'SelectedSupportManifestV1', 'GlobalRepresentationQualificationV1', 'AutonomousReviewConstructionV1'] as const
const manifestKinds = ['catalog_snapshot', 'identity_profile', 'extractor_registry', 'policy_registry',
  'extractor_definition', 'policy_definition', 'fact_schema', 'applicability_schema', 'output_contract',
  'proof_contract', 'freshness_contract', 'implementation_bundle', 'semantic_contract', 'content_item_definition',
  'representation_definition', 'original_observation', 'validity_origin', 'accepted_origin', 'eligible_version_snapshot'] as const
export type IntegratedPilotManifestType = typeof manifestKinds[number]
export type IntegratedPilotArtifactType = 'global_cell' | typeof custodyKinds[number] | IntegratedPilotManifestType
export type IntegratedPilotByteContractFamily = 'global_definition_v1' | 'custody_v1' | 'manifest_v1'
export type IntegratedPilotArtifactInput = Readonly<{
  pin: Pin; artifactType: IntegratedPilotArtifactType; artifactContractVersion: 1; canonicalBytes: Uint8Array
}>
export type IntegratedPilotBundleInput = Readonly<{
  recordFingerprint: string; receiptBytes: Uint8Array; custodyBindingBytes: Uint8Array;
  artifacts: readonly IntegratedPilotArtifactInput[]
}>
export type LocalIntegratedPilotEnvelope = Readonly<{
  profile: typeof LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE; bundle: IntegratedPilotBundleInput
}>
export type IntegratedPilotDependency = Readonly<{ slot: string; pin: Pin; artifactType: IntegratedPilotArtifactType }>
export type IntegratedPilotArtifactEdge = IntegratedPilotDependency & Readonly<{ parent: Pin }>
export type IntegratedPilotBundleFailure = 'receipt_corrupt' | 'binding_corrupt' | 'dependency_missing'
  | 'dependency_corrupt' | 'unsupported_version' | 'closure_bound_exceeded' | 'semantic_mismatch'
type Result<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; reason: IntegratedPilotBundleFailure;
  bound?: Readonly<{ limit: 'depth'; observed: number; maximum: 8 | 16 }> }>
const fail = (reason: IntegratedPilotBundleFailure): Result<never> => Object.freeze({ ok: false, reason })
const success = <T>(value: T): Result<T> => Object.freeze({ ok: true, value })
type Frozen<T> = T extends readonly (infer U)[] ? readonly Frozen<U>[] : T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T
const id = z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/)
const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const pin = z.custom<Pin>(value => !!readPin(value))
const factKind = z.enum(REGEL_FAKT_ARTEN)
const requirement = z.enum(OFFICIAL_REQUIREMENT_TYPES)
const quality = z.enum(['explicit_primary_statement', 'composed_from_multiple_primary_sources'])
const versionId = z.string().regex(/^ev2_[a-f0-9]{32}$/)
const fingerprint = z.string().regex(/^ot-provenance-v1:[a-f0-9]{64}$/)
const stamp = z.string().refine(value => checkedAtLesen(value) === value)
const dateBound = z.string().refine(value => gültigkeitszeitLesen(value) === value).nullable()
const scope = z.unknown().refine(value => { const r = regelScopeAusEvidenceScope(value); return r.ok && historicalValuesEqual(value, r.scope) })
const evidenceScope = z.unknown().refine(value => { const r = evidenceScopeLesen(value); return r.ok && historicalValuesEqual(value, r.scope) })
const binding = z.unknown().refine(value => { const r = readContentIdentityBinding(value); return r.ok && historicalValuesEqual(value, r.value) })
const identity = z.unknown().refine(value => {
  const row = ownRecord(value, ['sourceId', 'contentItemId', 'contentItemVersion', 'representationId', 'representationVersion',
    'identityProfileId', 'identityProfileVersion', 'identitySchema', 'lookupKey', 'canonicalUrl', 'contentType', 'sourceContentHash',
    'retrievedAt', 'validFrom', 'validUntil', 'versionId'])
  if (!row) return false
  const { versionId: expected, ...preimage } = row
  const read = contentEvidenceVersionV2(preimage)
  return read.ok && read.value.versionId === expected && historicalValuesEqual(read.value.identity, preimage)
})
const ref = z.object({ sourceId: z.string(), contentItemId: z.string() }).strict()
const refs = z.array(ref).min(1).max(8)
const target = z.custom<OfficialTruthCompositionCitationTarget>(value => {
  const parsed = officialTruthCitationTargetLesen(value)
  return !!parsed && historicalValuesEqual(parsed, value)
})
const citation = z.object({ target, supportVersionIds: z.array(versionId).min(1).max(8) }).strict()
const assignment = z.object({ target, contentItemRefs: refs,
  relation: z.enum(['single_content_item', 'equal_values']),
  role: z.enum(['complementary_part', 'equal_values', 'general_rule', 'exception', 'applicability_list', 'exemption_set']),
}).strict()
const support = z.object({ versionId, identitySchema: z.literal(2), binding, canonicalFinalUrl: z.string(),
  contentType: z.string(), sourceContentHash: z.string(), acceptedRetrievedAt: stamp, validFrom: dateBound, validUntil: dateBound,
  freshRetrieval: z.object({ requestUrl: z.string(), completedAt: stamp }).strict(),
}).strict()
const payloadSchema = z.object({
  schema: z.literal('official-truth-autonomous-provenance'), schemaVersion: z.literal(1),
  canonicalization: z.literal('ot-provenance-json-v1'), outcome: z.literal('trusted_fact_produced'),
  globalCell: z.object({ definition: pin, scope, ruleScopeKey: z.string().regex(/^rule-scope:v1:[a-f0-9]{64}$/) }).strict(),
  candidate: z.object({ factKind, requirementType: requirement, factSchema: pin, applicabilitySchema: pin.nullable(),
    fact: z.unknown(), factHash: z.string().regex(/^ot-fact-v1:[a-f0-9]{64}$/), candidateBinding: z.string().regex(/^ot-candidate-v1:[a-f0-9]{64}$/) }).strict(),
  evidenceQuality: quality,
  extractor: z.object({ extractorId: z.string().regex(/^otx_[a-z][a-z0-9_]{0,40}$/), extractorVersion: positive,
    sourceFamilyId: z.string().regex(/^otf_[a-z][a-z0-9_]{0,40}$/), schemaFamily: z.string().regex(/^ots_[a-z][a-z0-9_]{0,40}$/),
    definition: pin, registrySnapshot: pin, outputContract: pin, selectionKey: z.string().regex(/^ot-(?:extractor|composition)-selection-v1:[a-f0-9]{64}$/) }).strict(),
  policy: z.object({ policyId: z.string().regex(/^otp_[a-z][a-z0-9_]{0,40}$/), policyVersion: positive, definition: pin, registrySnapshot: pin,
    preHttpSelectionKey: z.string().regex(/^ot-composition-selection-v1:[a-f0-9]{64}$/), assignments: z.array(assignment).min(1).max(64),
    resultIdentity: z.string().regex(/^ot-composition-result-v1:[a-f0-9]{64}$/) }).strict().nullable(),
  supports: z.array(support).min(1).max(8), citations: z.array(citation).min(1).max(64),
  proof: z.object({ contract: pin, reviewPacketKey: z.string().regex(/^review-packet:v3:[a-f0-9]{64}$/),
    proofIdentity: z.string().regex(/^ot-proof-v1:[a-f0-9]{64}$/), catalogSnapshot: pin,
    serverReferenceTime: stamp, freshnessContract: pin, evidenceFreshnessAtReference: z.literal('current') }).strict(),
}).strict()
export type IntegratedPilotPayload = Frozen<z.infer<typeof payloadSchema>>
export type IntegratedPilotReceipt = Readonly<{ payload: IntegratedPilotPayload; recordFingerprint: string }>
const text = (bytes: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(bytes)
const bytes = (value: unknown) => { const c = provenanceCanonical(value); return c === null ? null : new TextEncoder().encode(c) }
const key = (p: Pin) => `${p.id}\u0000${p.version}\u0000${p.digest}`
const nameKey = (p: Pin) => `${p.id}\u0000${p.version}`
const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
function bindingOrder(a: unknown, b: unknown): number {
  const left = readContentIdentityBinding(a), right = readContentIdentityBinding(b)
  if (!left.ok || !right.ok) return 0
  for (const field of ['sourceId', 'contentItemId', 'contentItemVersion', 'representationId', 'representationVersion', 'identityProfileId', 'identityProfileVersion'] as const) {
    const x = left.value[field], y = right.value[field]
    if (x !== y) return x < y ? -1 : 1
  }
  return 0
}
const ordered = (values: readonly string[]) => values.every((v, i) => i === 0 || values[i - 1]! < v)
const sortDependencies = (deps: IntegratedPilotDependency[]) => deps.sort((a, b) => order(a.slot, b.slot))
const dep = (slot: string, p: Pin, artifactType: IntegratedPilotArtifactType): IntegratedPilotDependency => ({ slot, pin: p, artifactType })
function denseDataArray(value: unknown): value is readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || Reflect.ownKeys(value).length !== value.length + 1) return false
  for (let i = 0; i < value.length; i++) {
    const d = Object.getOwnPropertyDescriptor(value, String(i))
    if (!d || !('value' in d) || !d.enumerable) return false
  }
  return true
}
function exact<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const c = provenanceCanonical(value)
  if (c === null) return null
  const parsed = schema.safeParse(JSON.parse(c))
  return parsed.success && historicalValuesEqual(parsed.data, value) ? parsed.data : null
}

/** Shape reader only. Semantic checks additionally require the complete historical closure. */
export function readIntegratedPilotReceipt(value: unknown): Result<IntegratedPilotReceipt> {
  const row = ownRecord(value, ['payload', 'recordFingerprint'])
  if (!row || !fingerprint.safeParse(row.recordFingerprint).success) return fail('receipt_corrupt')
  const payload = exact(payloadSchema, row.payload)
  if (!payload || provenanceCanonical(payload, INTEGRATED_PILOT_BUNDLE_LIMITS.receiptBytes) === null
    || provenanceHash('ot-provenance-v1', payload) !== row.recordFingerprint) return fail('receipt_corrupt')
  return success({ payload, recordFingerprint: row.recordFingerprint as string })
}

function integratedPilotReceiptRoots(payload: IntegratedPilotPayload): readonly IntegratedPilotDependency[] {
  const out = [dep('globalCell.definition', payload.globalCell.definition, 'global_cell'),
    dep('candidate.factSchema', payload.candidate.factSchema, 'fact_schema'),
    dep('extractor.definition', payload.extractor.definition, 'extractor_definition'),
    dep('extractor.registrySnapshot', payload.extractor.registrySnapshot, 'extractor_registry'),
    dep('extractor.outputContract', payload.extractor.outputContract, 'output_contract'),
    dep('proof.contract', payload.proof.contract, 'proof_contract'),
    dep('proof.catalogSnapshot', payload.proof.catalogSnapshot, 'catalog_snapshot'),
    dep('proof.freshnessContract', payload.proof.freshnessContract, 'freshness_contract')]
  if (payload.candidate.applicabilitySchema) out.push(dep('candidate.applicabilitySchema', payload.candidate.applicabilitySchema, 'applicability_schema'))
  if (payload.policy) out.push(dep('policy.definition', payload.policy.definition, 'policy_definition'), dep('policy.registrySnapshot', payload.policy.registrySnapshot, 'policy_registry'))
  return sortDependencies(out)
}

const contractNames = ['scope', 'corpus_admission', 'category_basis', 'evaluation_date_plan', 'support_selection',
  'review_construction', 'content_identity', 'source_hash', 'transport', 'representation_qualification', 'validity_derivation',
  'evidence_acceptance', 'fact_schema', 'applicability_schema', 'output_contract', 'proof_contract', 'freshness_contract'] as const
const implementationDependencies = z.array(pin).max(128)
const contractContent = z.object({ contract: z.enum(contractNames), implementation: pin, implementationDependencies }).strict()
const registryEntry = z.object({ id, version: positive, current: z.boolean(), definition: pin }).strict()
const descriptor = z.object({ extractorId: z.string(), extractorVersion: positive, factKind,
  sourceFamilyId: z.string(), contentItemRefs: refs, representations: z.array(binding).min(1).max(16),
  urlAllowlist: z.array(z.union([z.object({ kind: z.literal('exact'), canonicalUrl: z.string() }).strict(),
    z.object({ kind: z.literal('path'), host: z.string(), path: z.string() }).strict()])).min(1).max(32),
  contentTypes: z.array(z.string()).min(1).max(16), schemaFamily: z.string(), policyId: z.string().nullable(),
  policyVersion: positive.nullable(), requiredFieldPaths: z.array(z.string()).max(64),
}).strict()
const policyDescriptor = z.object({ policyId: z.string(), policyVersion: positive, factKind, requirementType: requirement,
  contentItemRefs: refs, sourceFamilyId: z.string(), schemaFamily: z.string(), applicabilitySchema: z.literal(1).nullable(),
  completeness: z.literal('joint_complete_fact'), assignments: z.array(assignment).min(1).max(64),
}).strict()
const itemDescriptor = z.object({ sourceId: z.string(), contentItemId: z.string(), contentItemVersion: positive,
  current: z.boolean(), externalIdNamespace: z.string(), externalContentId: z.string(),
  expectedPublisherIds: z.array(z.string()).min(1).max(8), expectedAuthorityIds: z.array(z.string()).min(1).max(8),
}).strict()
const representationDescriptor = z.object({ sourceId: z.string(), contentItemId: z.string(), contentItemVersion: positive,
  representationId: z.string(), representationVersion: positive, current: z.boolean(),
  requestUrls: z.array(z.string()).min(1).max(16), expectedFinalUrl: z.string(), expectedMediaType: z.string(),
  identityProfileId: z.string(), identityProfileVersion: positive, expectedLocale: z.string().nullable(), expectedSchema: z.string().nullable(),
}).strict()
const basis = z.union([z.object({ kind: z.literal('no_bound_asserted') }).strict(),
  z.object({ kind: z.literal('qualified_locator'), locator: z.object({ kind: z.literal('json_pointer'),
    pointer: z.string().max(256).regex(/^(?:\/(?:[^~]|~[01])*)+$/) }).strict(), value: z.string() }).strict()])
const observationSchema = z.object({ binding, requestUrl: z.string(), canonicalFinalUrl: z.string(), contentType: z.string(),
  sourceContentHash: z.string().regex(/^[a-f0-9]{64}$/), startedAt: stamp, completedAt: stamp,
  qualification: pin, transportContract: pin, identityProfile: pin, catalogSnapshot: pin, hashContract: pin,
}).strict()
const validitySchema = z.object({ observation: pin, evidenceScope, validFrom: dateBound, validUntil: dateBound,
  validFromBasis: basis, validUntilBasis: basis, derivationContract: pin,
}).strict().refine(v => (v.validFrom === null ? v.validFromBasis.kind === 'no_bound_asserted'
  : v.validFromBasis.kind === 'qualified_locator' && v.validFromBasis.value === v.validFrom)
  && (v.validUntil === null ? v.validUntilBasis.kind === 'no_bound_asserted'
    : v.validUntilBasis.kind === 'qualified_locator' && v.validUntilBasis.value === v.validUntil))
const acceptedSchema = z.object({ observation: pin, validityOrigin: pin, cell: pin, globalAdmission: pin,
  evidenceIdentity: identity, evidenceScope, acceptanceContract: pin }).strict()
export type IntegratedPilotOriginalObservationValue = z.infer<typeof observationSchema>
export type IntegratedPilotValidityOriginValue = z.infer<typeof validitySchema>
export type IntegratedPilotAcceptedOriginValue = z.infer<typeof acceptedSchema>

/** Rebuild the existing closed graph with an inert verifier solely to reuse its descriptor codec.
 * No archived function is loaded or called, and no live profile registry is consulted. */
function historicalRegistry(value: unknown): QuellenRegistry | null {
  const row = ownRecord(value, ['sources', 'blockedDomains', 'contentIdentity'])
  if (!row || !Array.isArray(row.sources) || !Array.isArray(row.blockedDomains)) return null
  const graph = ownRecord(row.contentIdentity, ['authorityRegistry', 'items', 'representations', 'profiles'])
  if (!graph || !Array.isArray(graph.profiles)) return null
  const profileValues = []
  for (const value of graph.profiles) {
    const p = exact(z.object({ identityProfileId: z.string(), identityProfileVersion: positive, current: z.boolean() }).strict(), value)
    if (!p) return null
    profileValues.push({ ...p, verify: () => ({ ok: false as const, reason: 'invalid_response' as const }) })
  }
  const authority = quellenRegistryErstellen(row.sources, { blockedDomains: row.blockedDomains })
  if (!authority.ok || !historicalValuesEqual(graph.authorityRegistry, authority.registry)) return null
  const built = createContentIdentityGraph(authority.registry, graph.items, graph.representations, profileValues)
  if (!built.ok || !historicalValuesEqual(graph, built.value)) return null
  const registry = { ...authority.registry, contentIdentity: built.value }
  return historicalValuesEqual(registry, value) ? registry : null
}
const schemas = {
  catalog_snapshot: z.object({ registry: z.unknown().refine(v => !!historicalRegistry(v)),
    profiles: z.array(z.object({ identityProfileId: z.string(), identityProfileVersion: positive, definition: pin }).strict()).max(128) }).strict(),
  identity_profile: z.object({ identityProfileId: z.string(), identityProfileVersion: positive, implementation: pin, implementationDependencies }).strict(),
  extractor_registry: z.object({ definitions: z.array(registryEntry).max(128) }).strict(),
  policy_registry: z.object({ definitions: z.array(registryEntry).max(128) }).strict(),
  extractor_definition: z.object({ descriptor, implementation: pin, implementationDependencies, outputContract: pin, factSchema: pin, applicabilitySchema: pin.nullable() }).strict(),
  policy_definition: z.object({ descriptor: policyDescriptor, implementation: pin, implementationDependencies }).strict(),
  fact_schema: contractContent.refine(v => v.contract === 'fact_schema'),
  applicability_schema: contractContent.refine(v => v.contract === 'applicability_schema'),
  output_contract: contractContent.refine(v => v.contract === 'output_contract'),
  proof_contract: contractContent.refine(v => v.contract === 'proof_contract'),
  freshness_contract: contractContent.refine(v => v.contract === 'freshness_contract'),
  semantic_contract: contractContent,
  implementation_bundle: z.object({ encoding: z.literal('base64'),
    mediaType: z.literal('application/vnd.jetnity.implementation-source-bundle+json'), bundleBase64: z.string().max(1_000_000) }).strict(),
  content_item_definition: z.object({ descriptor: itemDescriptor }).strict(),
  representation_definition: z.object({ descriptor: representationDescriptor }).strict(),
  original_observation: observationSchema,
  validity_origin: validitySchema,
  accepted_origin: acceptedSchema,
  eligible_version_snapshot: z.object({ entries: z.array(z.object({ versionId, custody: pin, eligible: z.boolean() }).strict()).min(1).max(256) }).strict(),
} as const
export type IntegratedPilotManifestContent<K extends IntegratedPilotManifestType> = Frozen<z.infer<(typeof schemas)[K]>>
export type IntegratedPilotManifest<K extends IntegratedPilotManifestType = IntegratedPilotManifestType> = Readonly<{
  artifactType: K; artifactContractVersion: 1; id: string; version: number;
  content: IntegratedPilotManifestContent<K>; dependencies: readonly Readonly<{ slot: string; pin: Pin }>[]
}>
export type IntegratedPilotVerifiedArtifact = IntegratedPilotArtifactInput & Readonly<{
  byteContractFamily: IntegratedPilotByteContractFamily; value: unknown; dependencies: readonly IntegratedPilotDependency[]
}>

function manifestDependencies(type: IntegratedPilotManifestType, content: Record<string, unknown>): IntegratedPilotDependency[] {
  const out: IntegratedPilotDependency[] = []
  const one = (field: string, type: IntegratedPilotArtifactType) => {
    if (content[field] !== null) out.push(dep(`/${field}`, content[field] as Pin, type))
  }
  if (['semantic_contract', 'identity_profile', 'fact_schema', 'applicability_schema', 'output_contract', 'proof_contract', 'freshness_contract'].includes(type)) one('implementation', 'implementation_bundle')
  else if (type === 'extractor_definition') {
    one('implementation', 'implementation_bundle'); one('outputContract', 'output_contract')
    one('factSchema', 'fact_schema'); one('applicabilitySchema', 'applicability_schema')
  } else if (type === 'policy_definition') one('implementation', 'implementation_bundle')
  else if (type === 'catalog_snapshot') (content.profiles as { definition: Pin }[]).forEach((p, i) => out.push(dep(`/profiles/${i}/definition`, p.definition, 'identity_profile')))
  else if (type === 'extractor_registry' || type === 'policy_registry') (content.definitions as { definition: Pin }[]).forEach((p, i) => out.push(dep(`/definitions/${i}/definition`, p.definition, type === 'extractor_registry' ? 'extractor_definition' : 'policy_definition')))
  else if (type === 'original_observation') {
    one('qualification', 'GlobalRepresentationQualificationV1'); one('transportContract', 'semantic_contract')
    one('identityProfile', 'identity_profile'); one('catalogSnapshot', 'catalog_snapshot'); one('hashContract', 'semantic_contract')
  } else if (type === 'validity_origin') { one('observation', 'original_observation'); one('derivationContract', 'semantic_contract') }
  else if (type === 'accepted_origin') {
    one('observation', 'original_observation'); one('validityOrigin', 'validity_origin'); one('cell', 'global_cell')
    one('globalAdmission', 'GlobalCellAdmissionV1'); one('acceptanceContract', 'semantic_contract')
  } else if (type === 'eligible_version_snapshot') (content.entries as { custody: Pin }[]).forEach((p, i) => out.push(dep(`/entries/${i}/custody`, p.custody, 'AcceptedEvidenceCustodyV1')))
  if (Array.isArray(content.implementationDependencies)) content.implementationDependencies.forEach((p: Pin, i: number) => out.push(dep(`/implementationDependencies/${i}`, p, 'implementation_bundle')))
  return sortDependencies(out)
}

function custodyDependencies(kind: typeof custodyKinds[number], v: Record<string, unknown>): IntegratedPilotDependency[] {
  const out: IntegratedPilotDependency[] = []
  const one = (field: string, type: IntegratedPilotArtifactType) => { if (v[field] !== null) out.push(dep(`/${field}`, v[field] as Pin, type)) }
  if (kind === 'GlobalCellAdmissionV1') {
    one('cell', 'global_cell'); one('scopeContract', 'semantic_contract'); one('corpusAdmissionContract', 'semantic_contract')
    one('evaluationDatePlan', 'semantic_contract')
    for (const [k, x] of Object.entries(v.dimensionBasis as Record<string, { basis: Pin }>)) out.push(dep(`/dimensionBasis/${k}/basis`, x.basis, 'semantic_contract'))
  } else if (kind === 'AcceptedEvidenceCustodyV1') {
    one('cell', 'global_cell'); one('globalAdmission', 'GlobalCellAdmissionV1'); one('scopeContract', 'semantic_contract')
    one('observation', 'original_observation'); one('validityOrigin', 'validity_origin'); one('acceptedOrigin', 'accepted_origin')
    one('identityContract', 'semantic_contract'); one('hashContract', 'semantic_contract')
  } else if (kind === 'SupportSelectionDefinitionV1') { one('cell', 'global_cell'); one('selectionContract', 'semantic_contract') }
  else if (kind === 'SelectedSupportManifestV1') {
    one('selectionDefinition', 'SupportSelectionDefinitionV1'); one('cell', 'global_cell'); one('globalAdmission', 'GlobalCellAdmissionV1')
    one('eligibleVersionSnapshot', 'eligible_version_snapshot'); one('catalogSnapshot', 'catalog_snapshot')
    one('extractorRegistrySnapshot', 'extractor_registry'); one('policyRegistrySnapshot', 'policy_registry')
    ;(v.supports as { custody: Pin }[]).forEach((s, i) => out.push(dep(`/supports/${i}/custody`, s.custody, 'AcceptedEvidenceCustodyV1')))
  } else if (kind === 'GlobalRepresentationQualificationV1') {
    one('itemDefinition', 'content_item_definition'); one('representationDefinition', 'representation_definition')
    one('identityProfileDefinition', 'identity_profile'); one('qualificationContract', 'semantic_contract')
  } else if (kind === 'AutonomousReviewConstructionV1') {
    one('cell', 'global_cell'); one('selectedSupportManifest', 'SelectedSupportManifestV1'); one('constructionContract', 'semantic_contract')
  }
  return sortDependencies(out)
}

function implementationValid(content: IntegratedPilotManifestContent<'implementation_bundle'>): boolean {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content.bundleBase64)) return false
  const raw = Buffer.from(content.bundleBase64, 'base64')
  if (raw.length === 0 || raw.toString('base64') !== content.bundleBase64) return false
  const decoded = decodeProvenanceBytes(raw)
  if (!decoded.ok) return false
  const sourceBundle = exact(z.object({ schema: z.literal('implementation-source-bundle-v1'),
    files: z.array(z.object({ path: z.string().max(256).regex(/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_./@-]+$/),
      utf8: z.string().min(1).max(524_288) }).strict()).min(1).max(256) }).strict(), decoded.value)
  return !!sourceBundle && ordered(sourceBundle.files.map(f => f.path))
}

function manifestContentValid(type: IntegratedPilotManifestType, content: Record<string, unknown>, artifactId: string, version: number): boolean {
  if (Array.isArray(content.implementationDependencies) && !ordered((content.implementationDependencies as Pin[]).map(key))) return false
  if (type === 'implementation_bundle') return implementationValid(content as IntegratedPilotManifestContent<'implementation_bundle'>)
  if (type === 'extractor_registry' || type === 'policy_registry') {
    const entries = content.definitions as z.infer<typeof registryEntry>[]
    return ordered(entries.map(e => `${e.id}\u0000${String(e.version).padStart(16, '0')}`))
      && entries.every(e => e.id === e.definition.id && e.version === e.definition.version)
  }
  if (type === 'extractor_definition') {
    const d = content.descriptor as z.infer<typeof descriptor>
    if (d.extractorId !== artifactId || d.extractorVersion !== version) return false
    const read = officialTruthExtractorDefinitionenPruefen([{ ...d, current: true,
      match: () => false, extract: () => ({ ok: false, reason: 'fact_incomplete' }) }])
    if (!read.ok) return false
    const { current, match, extract, ...canonicalDescriptor } = read.registry[0]!
    void current; void match; void extract
    return historicalValuesEqual(canonicalDescriptor, d)
  }
  if (type === 'policy_definition') {
    const d = content.descriptor as z.infer<typeof policyDescriptor>
    if (d.policyId !== artifactId || d.policyVersion !== version || !ordered(d.assignments.map(a => provenanceCanonical(a.target)!))) return false
    const read = officialTruthCompositionRegistriesPruefen([{ ...d, current: true }], [])
    if (!read.ok) return false
    const { current, ...canonicalDescriptor } = read.policies[0]!
    void current
    return historicalValuesEqual(canonicalDescriptor, d)
  }
  if (type === 'catalog_snapshot') {
    const c = content as IntegratedPilotManifestContent<'catalog_snapshot'>
    const registry = historicalRegistry(c.registry)
    return !!registry && !!registry.contentIdentity
      && historicalValuesEqual(c.profiles.map(p => [p.identityProfileId, p.identityProfileVersion]),
        registry.contentIdentity.profiles.map(p => [p.identityProfileId, p.identityProfileVersion]))
  }
  if (type === 'identity_profile') return content.identityProfileId === artifactId && content.identityProfileVersion === version
  if (type === 'original_observation') {
    const c = content as IntegratedPilotOriginalObservationValue
    return Date.parse(c.startedAt) <= Date.parse(c.completedAt)
  }
  if (type === 'eligible_version_snapshot') {
    const entries = content.entries as IntegratedPilotManifestContent<'eligible_version_snapshot'>['entries']
    return ordered(entries.map(e => e.versionId)) && new Set(entries.map(e => key(e.custody))).size === entries.length
  }
  return true
}

/** No issuance: this constructs strict canonical HISTORICAL artifact bytes from exact values. */
export function createIntegratedPilotArtifact<K extends IntegratedPilotManifestType>(
  artifactType: K, artifactId: string, version: number, value: IntegratedPilotManifestContent<K>,
): Result<IntegratedPilotArtifactInput> {
  if (!Object.hasOwn(schemas, artifactType) || !id.safeParse(artifactId).success || !positive.safeParse(version).success) return fail('unsupported_version')
  const content = exact(schemas[artifactType] as z.ZodType<unknown>, value)
  if (!content || !manifestContentValid(artifactType, content as Record<string, unknown>, artifactId, version)) return fail('dependency_corrupt')
  const dependencies = manifestDependencies(artifactType, content as Record<string, unknown>).map(({ slot, pin }) => ({ slot, pin }))
  const canonicalBytes = bytes({ artifactType, artifactContractVersion: 1, id: artifactId, version, content, dependencies })
  if (!canonicalBytes) return fail('closure_bound_exceeded')
  return success({ pin: { id: artifactId, version, digest: sha256Hex(text(canonicalBytes)) }, artifactType, artifactContractVersion: 1, canonicalBytes })
}

/** A known codec, verified bytes and typed edges, never an origin certificate. */
export function readIntegratedPilotArtifact(input: IntegratedPilotArtifactInput): Result<IntegratedPilotVerifiedArtifact> {
  if (!ownRecord(input, ['pin', 'artifactType', 'artifactContractVersion', 'canonicalBytes']) || !readPin(input.pin)
    || input.artifactContractVersion !== 1 || !(input.canonicalBytes instanceof Uint8Array)) return fail('unsupported_version')
  const decoded = decodeProvenanceBytes(input.canonicalBytes)
  if (!decoded.ok || sha256Hex(text(input.canonicalBytes)) !== input.pin.digest) return fail('dependency_corrupt')
  if (input.artifactType === 'global_cell') {
    const cell = readGlobalCellDefinition(decoded.value)
    if (!cell.ok || cell.value.id !== input.pin.id || cell.value.version !== input.pin.version) return fail('dependency_corrupt')
    return success({ ...input, canonicalBytes: input.canonicalBytes.slice(), byteContractFamily: 'global_definition_v1', value: cell.value, dependencies: [] })
  }
  if ((custodyKinds as readonly string[]).includes(input.artifactType)) {
    const kind = input.artifactType as typeof custodyKinds[number]
    const read = readHistoricalArtifact(kind, decoded.value)
    if (!read.ok) return fail('dependency_corrupt')
    return success({ ...input, canonicalBytes: input.canonicalBytes.slice(), byteContractFamily: 'custody_v1', value: read.value,
      dependencies: custodyDependencies(kind, read.value.value as Record<string, unknown>) })
  }
  if (!Object.hasOwn(schemas, input.artifactType)) return fail('unsupported_version')
  const type = input.artifactType as IntegratedPilotManifestType
  const manifest = ownRecord(decoded.value, ['artifactType', 'artifactContractVersion', 'id', 'version', 'content', 'dependencies'])
  if (!manifest || manifest.artifactType !== type || manifest.artifactContractVersion !== 1
    || manifest.id !== input.pin.id || manifest.version !== input.pin.version) return fail('dependency_corrupt')
  const content = exact(schemas[type] as z.ZodType<unknown>, manifest.content)
  if (!content || !manifestContentValid(type, content as Record<string, unknown>, input.pin.id, input.pin.version)) return fail('dependency_corrupt')
  const dependencies = manifestDependencies(type, content as Record<string, unknown>)
  if (!historicalValuesEqual(manifest.dependencies, dependencies.map(({ slot, pin }) => ({ slot, pin })))) return fail('dependency_corrupt')
  return success({ ...input, canonicalBytes: input.canonicalBytes.slice(), byteContractFamily: 'manifest_v1', value: manifest, dependencies })
}

export type IntegratedPilotVerifiedBundle = Readonly<{
  receipt: IntegratedPilotReceipt; receiptBytes: Uint8Array; custodyBindingBytes: Uint8Array; bindingDigest: string;
  artifacts: readonly IntegratedPilotVerifiedArtifact[]; receiptRoots: readonly IntegratedPilotDependency[];
  bindingRoots: readonly IntegratedPilotDependency[]; artifactEdges: readonly IntegratedPilotArtifactEdge[];
  graph: Readonly<{ nodes: number; edges: number; bytes: number; longestDepth: number }>;
}>

/** This byte/graph checker is historical only; callers cannot register additional codecs. */
export type IntegratedPilotArtifactClosureInput = Readonly<{
  readonly artifacts: readonly IntegratedPilotArtifactInput[];
  readonly receiptRoots: readonly IntegratedPilotDependency[]; readonly bindingRoots: readonly IntegratedPilotDependency[];
  readonly bindingByteLength: number;
}>
type ClosureValue = Pick<IntegratedPilotVerifiedBundle, 'artifacts' | 'artifactEdges' | 'graph'>
function verifyArtifactClosure(input: IntegratedPilotArtifactClosureInput, maximumDepth: 8 | 16): Result<ClosureValue> {
  if (!ownRecord(input, ['artifacts', 'receiptRoots', 'bindingRoots', 'bindingByteLength'])
    || !denseDataArray(input.artifacts) || input.artifacts.length + 1 > INTEGRATED_PILOT_BUNDLE_LIMITS.nodes
    || !denseDataArray(input.receiptRoots) || !denseDataArray(input.bindingRoots)
    || input.receiptRoots.length > 11 || input.bindingRoots.length !== 3
    || !Number.isSafeInteger(input.bindingByteLength) || input.bindingByteLength < 1
    || input.bindingByteLength > INTEGRATED_PILOT_BUNDLE_LIMITS.bindingBytes) return fail('closure_bound_exceeded')
  const nodes = new Map<string, IntegratedPilotVerifiedArtifact>()
  const names = new Map<string, string>(), nameTypes = new Map<string, string>(), digestBytes = new Map<string, string>()
  const artifactEdges: IntegratedPilotArtifactEdge[] = []
  let totalBytes = input.bindingByteLength, edgeCount = input.receiptRoots.length + input.bindingRoots.length + 1
  for (const raw of input.artifacts) {
    const parsed = readIntegratedPilotArtifact(raw)
    if (!parsed.ok) return parsed
    const a = parsed.value, k = key(a.pin), semantic = nameKey(a.pin), canonical = text(a.canonicalBytes)
    if (nodes.has(k) || names.has(semantic) || (nameTypes.has(a.pin.id) && nameTypes.get(a.pin.id) !== `${a.artifactType}:${a.byteContractFamily}`)
      || (digestBytes.has(a.pin.digest) && digestBytes.get(a.pin.digest) !== canonical)) return fail('dependency_corrupt')
    nodes.set(k, a); names.set(semantic, k); nameTypes.set(a.pin.id, `${a.artifactType}:${a.byteContractFamily}`); digestBytes.set(a.pin.digest, canonical)
    totalBytes += a.canonicalBytes.length; edgeCount += a.dependencies.length
    if (a.dependencies.length > 256 || totalBytes > INTEGRATED_PILOT_BUNDLE_LIMITS.totalArtifactBytes
      || edgeCount > INTEGRATED_PILOT_BUNDLE_LIMITS.edges) return fail('closure_bound_exceeded')
    artifactEdges.push(...a.dependencies.map(d => ({ parent: a.pin, ...d })))
  }
  const rootSchema = z.array(z.object({ slot: z.string().min(1).max(1024), pin,
    artifactType: z.enum(['global_cell', ...custodyKinds, ...manifestKinds]) }).strict()).max(11)
  const receiptRoots = exact(rootSchema, input.receiptRoots), bindingRoots = exact(rootSchema, input.bindingRoots)
  if (!receiptRoots || !bindingRoots || !ordered(receiptRoots.map(r => r.slot)) || !ordered(bindingRoots.map(r => r.slot))) return fail('dependency_corrupt')
  const traversal = verifyResolvedGraph(nodes, receiptRoots, bindingRoots, maximumDepth)
  if (!traversal.ok) return traversal
  const { longestDepth } = traversal.value
  return success({ artifacts: [...nodes.values()].sort((a, b) => order(key(a.pin), key(b.pin))),
    artifactEdges: artifactEdges.sort((a, b) => order(key(a.parent), key(b.parent)) || order(a.slot, b.slot)),
    graph: { nodes: nodes.size + 1, edges: edgeCount, bytes: totalBytes, longestDepth } })
}

/** Private graph arithmetic, after closed codecs and typed roles resolve every node.
 * Memoized subtree height retains the longest path when a DAG node is shared. */
function verifyResolvedGraph(nodes: ReadonlyMap<string, IntegratedPilotVerifiedArtifact>,
  receiptRoots: readonly IntegratedPilotDependency[], bindingRoots: readonly IntegratedPilotDependency[],
  maximumDepth: 8 | 16,
): Result<Readonly<{ longestDepth: number }>> {
  const active = new Set<string>(), heights = new Map<string, number>(), reached = new Set<string>()
  function visit(edge: IntegratedPilotDependency): Result<number> {
    const k = key(edge.pin), a = nodes.get(k)
    if (!a) return fail('dependency_missing')
    if (a.artifactType !== edge.artifactType || active.has(k)) return fail('dependency_corrupt')
    reached.add(k)
    if (heights.has(k)) return success(heights.get(k)!)
    active.add(k)
    let height = 1
    for (const child of a.dependencies) {
      const subtree = visit(child)
      if (!subtree.ok) return subtree
      height = Math.max(height, subtree.value + 1)
    }
    active.delete(k); heights.set(k, height)
    return success(height)
  }
  let longestDepth = 1
  for (const root of receiptRoots) { const h = visit(root); if (!h.ok) return h; longestDepth = Math.max(longestDepth, h.value) }
  for (const root of bindingRoots) { const h = visit(root); if (!h.ok) return h; longestDepth = Math.max(longestDepth, 1 + h.value) }
  if (longestDepth > maximumDepth) return Object.freeze({ ok: false, reason: 'closure_bound_exceeded',
    bound: Object.freeze({ limit: 'depth', observed: longestDepth, maximum: maximumDepth }) })
  if (reached.size !== nodes.size) return fail('dependency_corrupt')
  return success({ longestDepth })
}

/** Legacy v1 always uses depth 8. It does not recognize a local envelope. */
export function verifyIntegratedPilotArtifactClosure(input: IntegratedPilotArtifactClosureInput): Result<ClosureValue> {
  return verifyArtifactClosure(input, INTEGRATED_PILOT_BUNDLE_LIMITS.depth)
}
/** Explicit local transport only; neither a caller depth nor an automatic fallback exists. */
export function verifyLocalIntegratedPilotArtifactClosure(input: Readonly<{
  profile: typeof LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE; closure: IntegratedPilotArtifactClosureInput
}>): Result<ClosureValue & Readonly<{ profile: typeof LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE }>> {
  if (!ownRecord(input, ['profile', 'closure']) || input.profile !== LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE) return fail('unsupported_version')
  const result = verifyArtifactClosure(input.closure, 16)
  return result.ok ? success({ ...result.value, profile: LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE }) : result
}

function semanticBundle(
  receipt: IntegratedPilotReceipt, bindingValue: unknown, artifacts: readonly IntegratedPilotVerifiedArtifact[],
): boolean {
  const p = receipt.payload, ids = p.supports.map(s => s.versionId)
  if (!ordered(ids) || (p.evidenceQuality === 'explicit_primary_statement' ? ids.length !== 1 || p.policy !== null : ids.length < 2 || p.policy === null)
    || !ordered(p.citations.map(c => provenanceCanonical(c.target)!))
    || p.citations.some(c => !ordered(c.supportVersionIds) || c.supportVersionIds.some(v => !ids.includes(v)))) return false
  const map = new Map(artifacts.map(a => [key(a.pin), a]))
  const get = (pin: Pin) => map.get(key(pin))!
  const content = <K extends IntegratedPilotManifestType>(pin: Pin, type: K): IntegratedPilotManifestContent<K> | null => {
    const a = get(pin)
    return a?.artifactType === type ? (a.value as IntegratedPilotManifest<K>).content : null
  }
  const semantic = (pin: Pin, name: typeof contractNames[number]) => content(pin, 'semantic_contract')?.contract === name
  const custody = <K extends HistoricalArtifactKind>(pin: Pin, kind: K) => {
    const a = get(pin)
    if (!a || a.artifactType !== kind) return null
    const parsed = readHistoricalArtifact(kind, a.value)
    return parsed.ok ? parsed.value.value : null
  }
  // Audit every historical origin in the closure, including versions that were
  // not selected. Reachability and matching hashes do not establish these joins.
  for (const artifact of artifacts) {
    if (artifact.artifactType === 'original_observation') {
      const observed = (artifact.value as IntegratedPilotManifest<'original_observation'>).content
      const bound = readContentIdentityBinding(observed.binding)
      const snapshot = content(observed.catalogSnapshot, 'catalog_snapshot'), registry = snapshot && historicalRegistry(snapshot.registry)
      const representation = registry && contentRepresentationFromRegistry(registry, observed.canonicalFinalUrl)
      const qualification = custody(observed.qualification, 'GlobalRepresentationQualificationV1')
      const profile = content(observed.identityProfile, 'identity_profile')
      if (!bound.ok || !registry || !representation?.ok || !qualification || !profile
        || !historicalValuesEqual(contentIdentityBinding(representation.value), bound.value)
        || !representation.value.requestUrls.includes(observed.requestUrl) || representation.value.expectedMediaType !== observed.contentType
        || !historicalValuesEqual(qualification.binding, bound.value)
        || !pinsEqual(qualification.identityProfileDefinition, observed.identityProfile)
        || profile.identityProfileId !== bound.value.identityProfileId || profile.identityProfileVersion !== bound.value.identityProfileVersion
        || !snapshot!.profiles.some(entry => entry.identityProfileId === bound.value.identityProfileId
          && entry.identityProfileVersion === bound.value.identityProfileVersion && pinsEqual(entry.definition, observed.identityProfile))
        || !semantic(observed.transportContract, 'transport') || !semantic(observed.hashContract, 'source_hash')
        || !semantic(qualification.qualificationContract, 'representation_qualification')) return false
      const item = content(qualification.itemDefinition, 'content_item_definition'), rep = content(qualification.representationDefinition, 'representation_definition')
      if (!item || !rep || !historicalValuesEqual(rep.descriptor, representation.value)
        || !historicalValuesEqual(item.descriptor, registry.contentIdentity!.items.find(x => x.sourceId === bound.value.sourceId
          && x.contentItemId === bound.value.contentItemId && x.contentItemVersion === bound.value.contentItemVersion))) return false
    }
    if (artifact.artifactType === 'GlobalCellAdmissionV1') {
      const admission = custody(artifact.pin, 'GlobalCellAdmissionV1')!, cell = readGlobalCellDefinition(get(admission.cell)?.value)
      if (!cell.ok || !semantic(admission.scopeContract, 'scope') || !semantic(admission.corpusAdmissionContract, 'corpus_admission')
        || admission.evaluationDatePlan !== null && !semantic(admission.evaluationDatePlan, 'evaluation_date_plan')) return false
      for (const [dimension, category] of Object.entries(cell.value.scope)) {
        const basis = admission.dimensionBasis[dimension as keyof typeof admission.dimensionBasis]
        if (!historicalValuesEqual(basis.category, category) || !semantic(basis.basis, 'category_basis')) return false
      }
    }
    if (artifact.artifactType === 'accepted_origin') {
      const accepted = (artifact.value as IntegratedPilotManifest<'accepted_origin'>).content
      const observed = content(accepted.observation, 'original_observation'), valid = content(accepted.validityOrigin, 'validity_origin')
      const identityValue = accepted.evidenceIdentity as Record<string, unknown>
      const acceptedCell = readGlobalCellDefinition(get(accepted.cell)?.value)
      const acceptedAdmission = custody(accepted.globalAdmission, 'GlobalCellAdmissionV1')
      const bound = readContentIdentityBinding(observed?.binding)
      if (!observed || !valid || !bound.ok || !acceptedCell.ok || !acceptedAdmission
        || !pinsEqual(acceptedAdmission.cell, accepted.cell) || !pinsEqual(valid.observation, accepted.observation)
        || !historicalValuesEqual(valid.evidenceScope, accepted.evidenceScope)
        || !historicalValuesEqual(accepted.evidenceScope, { ...acceptedCell.value.scope, sourceId: bound.value.sourceId })
        || valid.validFrom !== identityValue.validFrom || valid.validUntil !== identityValue.validUntil
        || !semantic(accepted.acceptanceContract, 'evidence_acceptance') || !semantic(valid.derivationContract, 'validity_derivation')) return false
      const lookup = evidenceSuchschluessel(accepted.evidenceScope, { sourceId: bound.value.sourceId,
        contentItemId: bound.value.contentItemId, representationId: bound.value.representationId })
      if (!lookup.ok || !historicalValuesEqual(identityValue, { ...bound.value, identitySchema: 2, lookupKey: lookup.key,
        canonicalUrl: observed.canonicalFinalUrl, contentType: observed.contentType, sourceContentHash: observed.sourceContentHash,
        retrievedAt: observed.completedAt, validFrom: valid.validFrom, validUntil: valid.validUntil, versionId: identityValue.versionId })) return false
    }
    if (artifact.artifactType === 'AcceptedEvidenceCustodyV1') {
      const c = custody(artifact.pin, 'AcceptedEvidenceCustodyV1')!
      const accepted = content(c.acceptedOrigin, 'accepted_origin'), observed = content(c.observation, 'original_observation')
      const admission = custody(c.globalAdmission, 'GlobalCellAdmissionV1')
      if (!accepted || !observed || !admission || !pinsEqual(c.cell, accepted.cell) || !pinsEqual(c.cell, admission.cell)
        || !pinsEqual(c.globalAdmission, accepted.globalAdmission) || !pinsEqual(c.scopeContract, admission.scopeContract)
        || !pinsEqual(c.observation, accepted.observation) || !pinsEqual(c.validityOrigin, accepted.validityOrigin)
        || !historicalValuesEqual(c.evidenceIdentity, accepted.evidenceIdentity) || !historicalValuesEqual(c.evidenceScope, accepted.evidenceScope)
        || !pinsEqual(c.hashContract, observed.hashContract) || !semantic(c.identityContract, 'content_identity')
        || !semantic(c.hashContract, 'source_hash')) return false
    }
    if (artifact.artifactType === 'eligible_version_snapshot') {
      const snapshot = (artifact.value as IntegratedPilotManifest<'eligible_version_snapshot'>).content
      if (!snapshot.entries.every(entry => custody(entry.custody, 'AcceptedEvidenceCustodyV1')?.evidenceIdentity.versionId === entry.versionId)) return false
    }
  }
  const k = readHistoricalArtifact('CustodyDependencyBindingV1', bindingValue)
  if (!k.ok || k.value.value.receiptFingerprint !== receipt.recordFingerprint) return false
  const kv = k.value.value
  const cell = readGlobalCellDefinition(get(p.globalCell.definition)?.value)
  const admission = custody(kv.globalAdmission, 'GlobalCellAdmissionV1')
  const manifest = custody(kv.selectedSupportManifest, 'SelectedSupportManifestV1')
  const review = custody(kv.autonomousReviewConstruction, 'AutonomousReviewConstructionV1')
  if (!cell.ok || !admission || !manifest || !review || !historicalValuesEqual(cell.value.scope, p.globalCell.scope)
    || !pinsEqual(admission.cell, p.globalCell.definition) || !pinsEqual(manifest.cell, p.globalCell.definition)
    || !pinsEqual(review.cell, p.globalCell.definition) || !pinsEqual(manifest.globalAdmission, kv.globalAdmission)
    || !pinsEqual(review.selectedSupportManifest, kv.selectedSupportManifest)
    || review.reviewPacketKey !== p.proof.reviewPacketKey || !historicalValuesEqual(review.safePreimage.candidate.scope, p.globalCell.scope)
    || review.safePreimage.candidate.key !== p.globalCell.ruleScopeKey
    || review.safePreimage.candidate.factKind !== p.candidate.factKind
    || review.safePreimage.candidate.evidenceQuality !== p.evidenceQuality
    || !historicalValuesEqual(review.safePreimage.candidate.supportVersionIds, ids)
    || !historicalValuesEqual(manifest.supports.map(s => s.versionId), ids)
    || manifest.factKind !== p.candidate.factKind || manifest.requirementType !== p.candidate.requirementType
    || manifest.evidenceQuality !== p.evidenceQuality || !pinsEqual(manifest.catalogSnapshot, p.proof.catalogSnapshot)
    || !pinsEqual(manifest.extractorRegistrySnapshot, p.extractor.registrySnapshot)
    || !historicalValuesEqual(manifest.policyRegistrySnapshot, p.policy?.registrySnapshot ?? null)) return false
  if (!semantic(admission.scopeContract, 'scope') || !semantic(admission.corpusAdmissionContract, 'corpus_admission')
    || (admission.evaluationDatePlan !== null && !semantic(admission.evaluationDatePlan, 'evaluation_date_plan'))
    || !semantic(review.constructionContract, 'review_construction')) return false
  for (const [dimension, value] of Object.entries(cell.value.scope)) {
    const basis = admission.dimensionBasis[dimension as keyof typeof admission.dimensionBasis]
    if (!historicalValuesEqual(basis.category, value) || !semantic(basis.basis, 'category_basis')) return false
  }
  const catalog = content(p.proof.catalogSnapshot, 'catalog_snapshot')
  const registry = catalog && historicalRegistry(catalog.registry)
  const extractor = content(p.extractor.definition, 'extractor_definition')
  const extractorRegistry = content(p.extractor.registrySnapshot, 'extractor_registry')
  const selection = custody(manifest.selectionDefinition, 'SupportSelectionDefinitionV1')
  const eligibility = content(manifest.eligibleVersionSnapshot, 'eligible_version_snapshot')
  if (!registry || !extractor || !extractorRegistry || !selection || !eligibility
    || !pinsEqual(selection.cell, p.globalCell.definition) || selection.requirementType !== p.candidate.requirementType
    || selection.factKind !== p.candidate.factKind || selection.evidenceQuality !== p.evidenceQuality
    || !pinsEqual(extractor.outputContract, p.extractor.outputContract) || !pinsEqual(extractor.factSchema, p.candidate.factSchema)
    || !historicalValuesEqual(extractor.applicabilitySchema, p.candidate.applicabilitySchema)
    || !semantic(selection.selectionContract, 'support_selection')) return false
  const ed = extractor.descriptor
  if (ed.extractorId !== p.extractor.extractorId || ed.extractorVersion !== p.extractor.extractorVersion
    || ed.schemaFamily !== p.extractor.schemaFamily || ed.sourceFamilyId !== p.extractor.sourceFamilyId
    || ed.factKind !== p.candidate.factKind || ed.policyId !== (p.policy?.policyId ?? null)
    || ed.policyVersion !== (p.policy?.policyVersion ?? null)) return false
  // Validate the complete historical registries together. A selected entry alone
  // does not rule out a second current match or a policy/descriptor mismatch.
  const extractorDefinitions = extractorRegistry.definitions.map(entry => {
    const definition = content(entry.definition, 'extractor_definition')
    return definition ? { ...definition.descriptor, current: entry.current,
      match: () => false, extract: () => ({ ok: false as const, reason: 'fact_incomplete' as const }) } : null
  })
  const policyRegistry = p.policy === null ? null : content(p.policy.registrySnapshot, 'policy_registry')
  const policyDefinitions = policyRegistry?.definitions.map(entry => {
    const definition = content(entry.definition, 'policy_definition')
    return definition ? { ...definition.descriptor, current: entry.current } : null
  }) ?? []
  const canonicalExtractors = officialTruthExtractorDefinitionenPruefen(extractorDefinitions)
  if (!canonicalExtractors.ok) return false
  const canonicalComposition = p.policy === null ? null : officialTruthCompositionRegistriesPruefen(policyDefinitions, canonicalExtractors.registry)
  if (canonicalComposition && !canonicalComposition.ok) return false
  for (const artifact of artifacts) {
    if (artifact.artifactType !== 'catalog_snapshot') continue
    const snapshot = (artifact.value as IntegratedPilotManifest<'catalog_snapshot'>).content
    if (!snapshot.profiles.every(entry => {
      const profile = content(entry.definition, 'identity_profile')
      return profile?.identityProfileId === entry.identityProfileId && profile.identityProfileVersion === entry.identityProfileVersion
    })) return false
  }
  const selectedDefs = extractorRegistry.definitions.filter(d => d.current && pinsEqual(d.definition, p.extractor.definition))
  if (selectedDefs.length !== 1) return false
  const selectedExtractor = canonicalExtractors.registry.find(d => d.current
    && d.extractorId === p.extractor.extractorId && d.extractorVersion === p.extractor.extractorVersion)
  if (!selectedExtractor) return false
  // Historical metadata can prove selector eligibility, but never execute an
  // archived matcher or recreate the live fact/seal. Reuse the canonical URL
  // and identity predicates for both branches; MIME is a post-HTTP constraint.
  const selectorSupports: (ContentIdentityBinding & { canonicalUrl: string })[] = []
  for (const support of p.supports) {
    const bound = readContentIdentityBinding(support.binding)
    if (!bound.ok || !selectedExtractor.contentTypes.includes(support.contentType)
      || !officialTruthExtractorUrlErlaubt(support.canonicalFinalUrl, selectedExtractor.urlAllowlist)
      || !selectedExtractor.representations.some(allowed => contentIdentityMatches(allowed, bound.value))) return false
    selectorSupports.push({ ...bound.value, canonicalUrl: support.canonicalFinalUrl })
  }
  if (canonicalComposition?.ok) {
    // Phase A is pure descriptor selection: it never invokes match/extract and
    // it deliberately cannot use observed MIME as a late selection tie-break.
    const selected = officialTruthCompositionPhaseA({ factKind: p.candidate.factKind, requirementType: p.candidate.requirementType,
      supports: selectorSupports, extractors: canonicalComposition.extractors, policies: canonicalComposition.policies })
    if (!selected.ok || selected.freeze.extractorId !== p.extractor.extractorId
      || selected.freeze.extractorVersion !== p.extractor.extractorVersion || selected.freeze.policyId !== p.policy!.policyId
      || selected.freeze.policyVersion !== p.policy!.policyVersion) return false
  } else {
    const refs = selectorSupports.map(({ sourceId, contentItemId }) => ({ sourceId, contentItemId }))
      .sort((a, b) => order(JSON.stringify([a.sourceId, a.contentItemId]), JSON.stringify([b.sourceId, b.contentItemId])))
    const candidates = canonicalExtractors.registry.filter(d => d.current && d.factKind === p.candidate.factKind
      && d.policyId === null && historicalValuesEqual(d.contentItemRefs, refs)
      && p.supports.every(support => d.contentTypes.includes(support.contentType)))
    if (candidates.length !== 1 || candidates[0] !== selectedExtractor) return false
  }
  const pairs: string[] = [], compactSupports: unknown[] = []
  for (let i = 0; i < p.supports.length; i++) {
    const s = p.supports[i]!, selected = manifest.supports[i]!, c = custody(selected.custody, 'AcceptedEvidenceCustodyV1')
    const b = readContentIdentityBinding(s.binding)
    if (!c || !b.ok || !pinsEqual(c.cell, p.globalCell.definition) || !pinsEqual(c.globalAdmission, kv.globalAdmission)
      || !pinsEqual(c.scopeContract, admission.scopeContract) || !semantic(c.identityContract, 'content_identity')
      || !semantic(c.hashContract, 'source_hash')) return false
    const lookup = evidenceSuchschluessel({ ...cell.value.scope, sourceId: b.value.sourceId }, { sourceId: b.value.sourceId,
      contentItemId: b.value.contentItemId, representationId: b.value.representationId })
    if (!lookup.ok) return false
    const identityValue = { ...b.value, identitySchema: 2, lookupKey: lookup.key, canonicalUrl: s.canonicalFinalUrl,
      contentType: s.contentType, sourceContentHash: s.sourceContentHash, retrievedAt: s.acceptedRetrievedAt,
      validFrom: s.validFrom, validUntil: s.validUntil, versionId: s.versionId }
    if (!historicalValuesEqual(identityValue, c.evidenceIdentity)
      || !historicalValuesEqual(c.evidenceScope, { ...cell.value.scope, sourceId: b.value.sourceId })
      || !readSupportReceipt(s, identityValue, p.proof.serverReferenceTime).ok) return false
    const { lookupKey: ignored, ...compact } = identityValue; void ignored; compactSupports.push(compact)
    const representation = contentRepresentationFromRegistry(registry, s.canonicalFinalUrl)
    if (!representation.ok || !historicalValuesEqual(contentIdentityBinding(representation.value), b.value)
      || !representation.value.requestUrls.includes(s.freshRetrieval.requestUrl)) return false
    const observed = content(c.observation, 'original_observation'), valid = content(c.validityOrigin, 'validity_origin'), accepted = content(c.acceptedOrigin, 'accepted_origin')
    if (!observed || !valid || !accepted || !pinsEqual(valid.observation, c.observation)
      || !pinsEqual(accepted.observation, c.observation) || !pinsEqual(accepted.validityOrigin, c.validityOrigin)
      || !pinsEqual(accepted.cell, c.cell) || !pinsEqual(accepted.globalAdmission, c.globalAdmission)
      || !historicalValuesEqual(accepted.evidenceIdentity, c.evidenceIdentity)
      || !historicalValuesEqual(valid.evidenceScope, c.evidenceScope) || !historicalValuesEqual(accepted.evidenceScope, c.evidenceScope)
      || valid.validFrom !== s.validFrom || valid.validUntil !== s.validUntil
      || !historicalValuesEqual(observed.binding, b.value) || observed.canonicalFinalUrl !== s.canonicalFinalUrl
      || observed.contentType !== s.contentType || observed.sourceContentHash !== s.sourceContentHash
      || observed.completedAt !== s.acceptedRetrievedAt || !pinsEqual(observed.hashContract, c.hashContract)
      || !semantic(observed.transportContract, 'transport') || !semantic(valid.derivationContract, 'validity_derivation')
      || !semantic(accepted.acceptanceContract, 'evidence_acceptance')) return false
    const originalCatalog = content(observed.catalogSnapshot, 'catalog_snapshot')
    const originalRegistry = originalCatalog && historicalRegistry(originalCatalog.registry)
    const originalRep = originalRegistry && contentRepresentationFromRegistry(originalRegistry, observed.canonicalFinalUrl)
    const qualification = custody(observed.qualification, 'GlobalRepresentationQualificationV1')
    const profile = content(observed.identityProfile, 'identity_profile')
    if (!originalRep || !originalRep.ok || !originalRep.value.requestUrls.includes(observed.requestUrl)
      || !historicalValuesEqual(contentIdentityBinding(originalRep.value), b.value) || !qualification || !profile
      || !historicalValuesEqual(qualification.binding, b.value) || !pinsEqual(qualification.identityProfileDefinition, observed.identityProfile)
      || profile.identityProfileId !== b.value.identityProfileId || profile.identityProfileVersion !== b.value.identityProfileVersion
      || !originalCatalog!.profiles.some(entry => entry.identityProfileId === b.value.identityProfileId
        && entry.identityProfileVersion === b.value.identityProfileVersion && pinsEqual(entry.definition, observed.identityProfile))
      || !semantic(qualification.qualificationContract, 'representation_qualification')) return false
    const item = content(qualification.itemDefinition, 'content_item_definition')
    const rep = content(qualification.representationDefinition, 'representation_definition')
    if (!item || !rep || !historicalValuesEqual(rep.descriptor, originalRep.value)
      || !historicalValuesEqual(item.descriptor, originalRegistry!.contentIdentity!.items.find(x =>
        x.sourceId === b.value.sourceId && x.contentItemId === b.value.contentItemId && x.contentItemVersion === b.value.contentItemVersion))) return false
    pairs.push(JSON.stringify([b.value.sourceId, b.value.contentItemId]))
  }
  if (new Set(pairs).size !== pairs.length || !historicalValuesEqual(compactSupports, review.safePreimage.supports)
    || !historicalValuesEqual([...pairs].sort(), selection.requiredContentItemRefs.map(r => JSON.stringify([r.sourceId, r.contentItemId])))
    || !historicalValuesEqual([...pairs].sort(), ed.contentItemRefs.map(r => JSON.stringify([r.sourceId, r.contentItemId])))) return false
  const eligible = eligibility.entries.filter(e => e.eligible)
  if (!historicalValuesEqual(eligible.map(e => ({ versionId: e.versionId, custody: e.custody })), manifest.supports)) return false
  const applicability = p.candidate.applicabilitySchema === null ? null : 1
  const factPreimage = { factSchema: p.candidate.factSchema, applicabilitySchema: p.candidate.applicabilitySchema,
    factKind: p.candidate.factKind, requirementType: p.candidate.requirementType, fact: p.candidate.fact }
  const f = historicalFactIdentity(factPreimage, applicability, registry)
  const candidatePreimage = { scope: p.globalCell.scope, ruleScopeKey: p.globalCell.ruleScopeKey, factKind: p.candidate.factKind,
    requirementType: p.candidate.requirementType, schemaFamily: p.extractor.schemaFamily, factSchema: p.candidate.factSchema,
    applicabilitySchema: p.candidate.applicabilitySchema, factHash: p.candidate.factHash, evidenceQuality: p.evidenceQuality, supportVersionIds: ids }
  const c = historicalCandidateIdentity(candidatePreimage, factPreimage, applicability, registry)
  const proof = historicalProofIdentity({ contract: p.proof.contract, reviewPacketKey: p.proof.reviewPacketKey,
    ruleScopeKey: p.globalCell.ruleScopeKey, factKind: p.candidate.factKind, supportVersionIds: ids,
    serverReferenceTime: p.proof.serverReferenceTime, catalogSnapshot: p.proof.catalogSnapshot,
    freshnessContract: p.proof.freshnessContract, evidenceFreshnessAtReference: 'current' }, get(kv.autonomousReviewConstruction)?.value)
  if (!f.ok || !c.ok || !proof.ok || f.value.factHash !== p.candidate.factHash || c.value.candidateBinding !== p.candidate.candidateBinding
    || proof.value.proofIdentity !== p.proof.proofIdentity || !officialTruthFactCitationCoverage({ fact: p.candidate.fact as RegelFakt,
      supportVersionIds: ids, citations: p.citations.flatMap(c => c.supportVersionIds.map(versionId => ({ target: c.target, versionId }))) })) return false
  const contentItemRefs = [...p.supports].map(s => { const b = s.binding as { sourceId: string; contentItemId: string }; return { sourceId: b.sourceId, contentItemId: b.contentItemId } }).sort((a, b) => order(JSON.stringify([a.sourceId, a.contentItemId]), JSON.stringify([b.sourceId, b.contentItemId])))
  const representations = [...p.supports].map(s => s.binding).sort(bindingOrder)
  const urls = p.supports.map(s => s.canonicalFinalUrl)
  if (p.policy === null) {
    const selectionKey = provenanceHash('ot-extractor-selection-v1', { path: 'explicit_post_retrieval', selectorContract: p.proof.contract,
      registrySnapshot: p.extractor.registrySnapshot, factKind: p.candidate.factKind, requirementType: p.candidate.requirementType,
      evidenceQuality: 'explicit_primary_statement', contentItemRefs, representations, canonicalFinalUrls: urls,
      observedContentTypes: [...new Set(p.supports.map(s => s.contentType))].sort(), policy: null })
    return p.extractor.selectionKey === selectionKey && p.citations.every(c => historicalValuesEqual(c.supportVersionIds, ids))
  }
  const pd = content(p.policy.definition, 'policy_definition'), pr = content(p.policy.registrySnapshot, 'policy_registry')
  if (!pd || !pr || pr.definitions.filter(d => d.current && pinsEqual(d.definition, p.policy!.definition)).length !== 1
    || pd.descriptor.policyId !== p.policy.policyId || pd.descriptor.policyVersion !== p.policy.policyVersion
    || pd.descriptor.factKind !== p.candidate.factKind || pd.descriptor.requirementType !== p.candidate.requirementType
    || pd.descriptor.sourceFamilyId !== p.extractor.sourceFamilyId || pd.descriptor.schemaFamily !== p.extractor.schemaFamily
    || pd.descriptor.applicabilitySchema !== applicability || !historicalValuesEqual(pd.descriptor.assignments, p.policy.assignments)
    || !historicalValuesEqual(pd.descriptor.contentItemRefs, contentItemRefs)
    || !historicalValuesEqual(p.policy.assignments.map(a => a.target), p.citations.map(c => c.target))) return false
  for (let i = 0; i < p.policy.assignments.length; i++) {
    const assignment = p.policy.assignments[i]!, cited = p.citations[i]!
    const projected = assignment.contentItemRefs.map(r => p.supports.find(s => {
      const b = s.binding as { sourceId: string; contentItemId: string }; return b.sourceId === r.sourceId && b.contentItemId === r.contentItemId
    })?.versionId).sort()
    if (!historicalValuesEqual(projected, cited.supportVersionIds)) return false
  }
  const selectionKey = provenanceHash('ot-composition-selection-v1', { path: 'composed_pre_http', selectorContract: p.proof.contract,
    extractorRegistrySnapshot: p.extractor.registrySnapshot, policyRegistrySnapshot: p.policy.registrySnapshot,
    factKind: p.candidate.factKind, requirementType: p.candidate.requirementType, contentItemRefs, representations,
    canonicalFinalUrls: urls, sourceFamilyId: p.extractor.sourceFamilyId, schemaFamily: p.extractor.schemaFamily })
  const resultIdentity = provenanceHash('ot-composition-result-v1', { candidateBinding: p.candidate.candidateBinding, factHash: p.candidate.factHash,
    extractorDefinition: p.extractor.definition, extractorRegistrySnapshot: p.extractor.registrySnapshot,
    outputContract: p.extractor.outputContract, policyDefinition: p.policy.definition, policyRegistrySnapshot: p.policy.registrySnapshot,
    preHttpSelectionKey: p.policy.preHttpSelectionKey, assignments: p.policy.assignments, supportVersionIds: ids, citations: p.citations })
  return p.extractor.selectionKey === selectionKey && p.policy.preHttpSelectionKey === selectionKey && p.policy.resultIdentity === resultIdentity
}

/** Complete historical audit. Even success cannot mint custody, trigger HTTP, or accept Evidence/Rules. */
function verifyBundle(input: IntegratedPilotBundleInput, maximumDepth: 8 | 16): Result<IntegratedPilotVerifiedBundle> {
  try {
    if (!ownRecord(input, ['recordFingerprint', 'receiptBytes', 'custodyBindingBytes', 'artifacts'])) return fail('receipt_corrupt')
    const payload = decodeProvenanceBytes(input.receiptBytes, INTEGRATED_PILOT_BUNDLE_LIMITS.receiptBytes)
    if (!payload.ok) return fail('receipt_corrupt')
    const receipt = readIntegratedPilotReceipt({ payload: payload.value, recordFingerprint: input.recordFingerprint })
    if (!receipt.ok) return receipt
    const binding = decodeProvenanceBytes(input.custodyBindingBytes, INTEGRATED_PILOT_BUNDLE_LIMITS.bindingBytes)
    const k = binding.ok ? readHistoricalArtifact('CustodyDependencyBindingV1', binding.value) : null
    if (!k || !k.ok || k.value.value.receiptFingerprint !== input.recordFingerprint) return fail('binding_corrupt')
    const v = k.value.value
    const receiptRoots = integratedPilotReceiptRoots(receipt.value.payload)
    const bindingRoots = sortDependencies([dep('globalAdmission', v.globalAdmission, 'GlobalCellAdmissionV1'),
      dep('selectedSupportManifest', v.selectedSupportManifest, 'SelectedSupportManifestV1'),
      dep('autonomousReviewConstruction', v.autonomousReviewConstruction, 'AutonomousReviewConstructionV1')])
    const closure = verifyArtifactClosure({ artifacts: input.artifacts, receiptRoots, bindingRoots, bindingByteLength: input.custodyBindingBytes.length }, maximumDepth)
    if (!closure.ok) return closure
    if (!semanticBundle(receipt.value, k.value, closure.value.artifacts)) return fail('semantic_mismatch')
    return success({ receipt: receipt.value, receiptBytes: input.receiptBytes.slice(), custodyBindingBytes: input.custodyBindingBytes.slice(),
      bindingDigest: sha256Hex(text(input.custodyBindingBytes)), receiptRoots, bindingRoots, ...closure.value })
  } catch { return fail('dependency_corrupt') }
}

/** Legacy receipt/storage v1 remains depth 8; it never upgrades after refusal. */
export function verifyIntegratedPilotBundle(input: IntegratedPilotBundleInput): Result<IntegratedPilotVerifiedBundle> {
  return verifyBundle(input, INTEGRATED_PILOT_BUNDLE_LIMITS.depth)
}

/** R1 local envelope. Receipt schema, C/H, artifact bytes and K remain unchanged. */
export function verifyLocalIntegratedPilotBundle(input: LocalIntegratedPilotEnvelope): Result<
  IntegratedPilotVerifiedBundle & Readonly<{ profile: typeof LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE }>
> {
  if (!ownRecord(input, ['profile', 'bundle']) || input.profile !== LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE) return fail('unsupported_version')
  const result = verifyBundle(input.bundle, 16)
  return result.ok ? success({ ...result.value, profile: LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE }) : result
}
