import 'server-only'
import { historicalPinFor, provenanceCanonical, provenanceHash, historicalValuesEqual, type Pin } from '../official-truth-autonomous-provenance-artifact'
import { createIntegratedPilotArtifact, verifyAcceptedStoreIntegratedBundleV1, ACCEPTED_STORE_TRIP_CLOSURE_PROFILE, type IntegratedPilotArtifactInput, type IntegratedPilotManifestType,
  type IntegratedPilotManifestContent, type IntegratedPilotBundleInput, type IntegratedPilotPayload } from '../official-truth-integrated-pilot-bundle'
import { readHistoricalArtifact, type HistoricalArtifactKind } from '../official-truth-autonomous-provenance-record'
import { validateGlobalCellAdmissionValue } from '../official-truth-global-cell-admission-server'
import { selectHistoricalSupports } from '../official-truth-support-selection-server'
import { constructHistoricalAutonomousReview } from '../official-truth-autonomous-review-material-server'
import { contentIdentityBinding } from '../official-truth-content-identity'
import { officialTruthFactCitationTargets } from '../official-truth-composition-policy-registry'
import { consumeCanonicalStoreMaterial, type CanonicalStoreMaterial } from './canonical-server'

const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const bytes = (value: unknown) => {
  const canonical = provenanceCanonical(value)
  if (canonical === null) throw Error('provenance_value_invalid')
  return new TextEncoder().encode(canonical)
}
const value = <T>(result: { ok: true; value: T } | { ok: false; reason: string }): T => {
  if (!result.ok) throw Error(result.reason)
  return result.value
}

/** Full unchanged historical schema, made solely from this actual canonical
 * execution. No historical flag grants publication/current acceptance. */
export function storeProvenanceBundle(material: CanonicalStoreMaterial): IntegratedPilotBundleInput {
  if (!consumeCanonicalStoreMaterial(material)) throw Error('canonical_execution_required')
  const { contract, registry, original, evidence, claim, execution, validity } = material
  const artifacts: IntegratedPilotArtifactInput[] = []
  const put = (artifact: IntegratedPilotArtifactInput) => { artifacts.push(artifact); return artifact.pin }
  const id = (name: string, content: unknown) => {
    const pin = historicalPinFor(`ast-${name}`, 1, content)
    if (!pin) throw Error('provenance_identity_invalid')
    return `ast-${pin.digest}`
  }
  function manifest<K extends IntegratedPilotManifestType>(kind: K, name: string, content: IntegratedPilotManifestContent<K>, fixed = false) {
    return put(value(createIntegratedPilotArtifact(kind, fixed ? name : id(name, content), 1, content)))
  }
  function custody<K extends HistoricalArtifactKind>(kind: K, name: string, content: unknown) {
    const parsed = value(readHistoricalArtifact(kind, { kind, schemaVersion: 1, value: content }))
    const pin = historicalPinFor(id(name, parsed), 1, parsed)!
    if (kind === 'CustodyDependencyBindingV1') throw Error('separate_binding_required')
    put({ pin, artifactType: kind, artifactContractVersion: 1, canonicalBytes: bytes(parsed) })
    return { pin, value: parsed }
  }
  const capsules: Pin[] = []
  let files: { path: string; utf8: string }[] = [], size = 0
  const flush = () => {
    if (!files.length) return
    capsules.push(manifest('implementation_bundle', `code-${capsules.length}`, { encoding: 'base64',
      mediaType: 'application/vnd.jetnity.implementation-source-bundle+json',
      bundleBase64: Buffer.from(bytes({ schema: 'implementation-source-bundle-v1', files })).toString('base64') }))
    files = []; size = 0
  }
  if (!contract.implementationSources.length || contract.implementationSources.length > 256) throw Error('implementation_snapshot_missing')
  for (const file of contract.implementationSources) {
    if (size + Buffer.byteLength(file.utf8, 'utf8') > 150_000) flush()
    files.push(file); size += Buffer.byteLength(file.utf8, 'utf8')
  }
  flush()
  const code = { implementation: capsules[0]!, implementationDependencies: capsules.slice(1).sort((a, b) => order(`${a.id}\0${a.version}\0${a.digest}`, `${b.id}\0${b.version}\0${b.digest}`)) }
  const semantic = (name: IntegratedPilotManifestContent<'semantic_contract'>['contract']) => manifest('semantic_contract', name, { contract: name, ...code })
  const scopeContract = semantic('scope'), corpusAdmissionContract = semantic('corpus_admission'), categoryBasis = semantic('category_basis')
  const evaluationDatePlan = semantic('evaluation_date_plan'), identityContract = semantic('content_identity'), hashContract = semantic('source_hash')
  const transportContract = semantic('transport'), qualificationContract = semantic('representation_qualification'), derivationContract = semantic('validity_derivation')
  const acceptanceContract = semantic('evidence_acceptance'), selectionContract = semantic('support_selection'), constructionContract = semantic('review_construction')
  const factSchema = manifest('fact_schema', 'fact-schema', { contract: 'fact_schema', ...code })
  const outputContract = manifest('output_contract', 'output-contract', { contract: 'output_contract', ...code })
  const proofContract = manifest('proof_contract', 'proof-contract', { contract: 'proof_contract', ...code })
  const freshnessContract = manifest('freshness_contract', 'freshness-contract', { contract: 'freshness_contract', ...code })
  const profiles = registry.contentIdentity!.profiles.map(p => ({ ...p, definition: manifest('identity_profile', p.identityProfileId,
    { identityProfileId: p.identityProfileId, identityProfileVersion: p.identityProfileVersion, ...code }, true) }))
  const catalogSnapshot = manifest('catalog_snapshot', 'catalog', { registry,
    profiles: profiles.map(({ identityProfileId, identityProfileVersion, definition }) => ({ identityProfileId, identityProfileVersion, definition })) })
  const definitions = execution.extractors.map(extractor => {
    const { current, match, extract, ...descriptor } = extractor; void match; void extract
    return { id: extractor.extractorId, version: extractor.extractorVersion, current,
      definition: manifest('extractor_definition', extractor.extractorId, { descriptor, ...code, outputContract, factSchema, applicabilitySchema: null }, true) }
  }).sort((a, b) => order(a.id, b.id) || a.version - b.version)
  const extractorRegistrySnapshot = manifest('extractor_registry', 'extractors', { definitions })
  const definition = { id: contract.cellId, version: contract.cellVersion, scope: claim.scope }
  const cell = put({ pin: historicalPinFor(definition.id, definition.version, definition)!, artifactType: 'global_cell', artifactContractVersion: 1, canonicalBytes: bytes(definition) })
  const admission = custody('GlobalCellAdmissionV1', 'admission', { cell, scopeContract, corpusAdmissionContract,
    dimensionBasis: Object.fromEntries(Object.entries(claim.scope).map(([key, category]) => [key, { category, basis: categoryBasis }])), evaluationDatePlan })
  value(validateGlobalCellAdmissionValue(definition, admission.value, admission.pin, scopeContract))
  const rep = registry.contentIdentity!.representations.find(r => r.sourceId === original.sourceId && r.contentItemId === original.contentItemId
    && r.contentItemVersion === original.contentItemVersion && r.representationId === original.representationId && r.representationVersion === original.representationVersion)!
  const item = registry.contentIdentity!.items.find(i => i.sourceId === original.sourceId && i.contentItemId === original.contentItemId && i.contentItemVersion === original.contentItemVersion)!
  const profile = profiles.find(p => p.identityProfileId === original.identityProfileId && p.identityProfileVersion === original.identityProfileVersion)!.definition
  const itemDefinition = manifest('content_item_definition', 'item', { descriptor: item })
  const representationDefinition = manifest('representation_definition', 'representation', { descriptor: rep })
  const qualification = custody('GlobalRepresentationQualificationV1', 'qualification', {
    binding: contentIdentityBinding(original), itemDefinition, representationDefinition, identityProfileDefinition: profile, qualificationContract })
  const observation = manifest('original_observation', 'observation', { binding: contentIdentityBinding(original),
    requestUrl: original.requestUrl, canonicalFinalUrl: original.canonicalUrl, contentType: original.contentType,
    sourceContentHash: original.sourceContentHash, startedAt: material.originalStartedAt, completedAt: original.retrievedAt,
    qualification: qualification.pin, transportContract, identityProfile: profile, catalogSnapshot, hashContract })
  const validityOrigin = manifest('validity_origin', 'validity', { observation, evidenceScope: evidence.scope, ...validity, derivationContract })
  const { previousVersionId, lifecycle, validationState, sourceClass, authorityName, publisherName, scope, extractionNote, ...evidenceIdentity } = evidence
  void previousVersionId; void lifecycle; void validationState; void sourceClass; void authorityName; void publisherName; void extractionNote
  const acceptedOrigin = manifest('accepted_origin', 'accepted', { observation, validityOrigin, cell, globalAdmission: admission.pin,
    evidenceIdentity, evidenceScope: scope, acceptanceContract })
  const originalCustody = custody('AcceptedEvidenceCustodyV1', 'custody', { cell, globalAdmission: admission.pin, scopeContract,
    evidenceScope: scope, evidenceIdentity, observation, validityOrigin, acceptedOrigin, identityContract, hashContract })
  const requiredContentItemRefs = [{ sourceId: original.sourceId, contentItemId: original.contentItemId }]
  const selection = custody('SupportSelectionDefinitionV1', 'selection', { cell, requirementType: 'visa', factKind: 'requirement_effect',
    evidenceQuality: 'explicit_primary_statement', requiredContentItemRefs, selectionContract })
  const eligibleVersionSnapshot = manifest('eligible_version_snapshot', 'eligibility', {
    entries: [{ versionId: evidence.versionId, custody: originalCustody.pin, eligible: true }] })
  const selected = value(selectHistoricalSupports({ definition, admission: admission.value, admissionPin: admission.pin,
    scopeContract, identityContract, hashContract, selectionDefinition: selection.value, selectionPin: selection.pin,
    eligibleVersionSnapshot, catalogSnapshot, extractorRegistrySnapshot, policyRegistrySnapshot: null,
    entries: [{ custody: originalCustody.value, pin: originalCustody.pin, eligible: true }] }))
  const selectedManifest = custody('SelectedSupportManifestV1', 'selected', selected.manifest.value)
  const review = value(constructHistoricalAutonomousReview({ definition, manifest: selected.manifest, manifestPin: selectedManifest.pin,
    constructionContract, custodies: selected.custodies, acceptedVersions: [evidence], registry, proposal: null }))
  if (review.value.reviewPacketKey !== material.reviewPacketKey) throw Error('actual_review_binding_mismatch')
  const reviewed = custody('AutonomousReviewConstructionV1', 'review', review.value)
  const supportVersionIds = [evidence.versionId]
  const supports = [{ versionId: evidence.versionId, identitySchema: 2 as const, binding: contentIdentityBinding(evidence),
    canonicalFinalUrl: evidence.canonicalUrl, contentType: evidence.contentType, sourceContentHash: evidence.sourceContentHash,
    acceptedRetrievedAt: evidence.retrievedAt, validFrom: evidence.validFrom, validUntil: evidence.validUntil,
    freshRetrieval: { requestUrl: original.requestUrl, completedAt: original.retrievedAt } }]
  const targets = officialTruthFactCitationTargets(execution.fact)
  if (!targets || !historicalValuesEqual(execution.fact, claim.fact)) throw Error('actual_fact_binding_mismatch')
  const citations = targets.map(target => ({ target, supportVersionIds })).sort((a, b) => order(provenanceCanonical(a.target)!, provenanceCanonical(b.target)!))
  const selectedDefinition = definitions.find(d => d.id === execution.selected.extractorId && d.version === execution.selected.extractorVersion)!.definition
  const factHash = provenanceHash('ot-fact-v1', { factSchema, applicabilitySchema: null, factKind: 'requirement_effect', requirementType: 'visa', fact: claim.fact })!
  const candidateBinding = provenanceHash('ot-candidate-v1', { scope: claim.scope, ruleScopeKey: claim.key, factKind: 'requirement_effect',
    requirementType: 'visa', schemaFamily: execution.selected.schemaFamily, factSchema, applicabilitySchema: null, factHash,
    evidenceQuality: 'explicit_primary_statement', supportVersionIds })!
  const selectionKey = provenanceHash('ot-extractor-selection-v1', { path: 'explicit_post_retrieval', selectorContract: proofContract,
    registrySnapshot: extractorRegistrySnapshot, factKind: 'requirement_effect', requirementType: 'visa', contentItemRefs: requiredContentItemRefs,
    representations: supports.map(s => s.binding), canonicalFinalUrls: supports.map(s => s.canonicalFinalUrl),
    evidenceQuality: 'explicit_primary_statement', observedContentTypes: [original.contentType], policy: null })!
  const proofFields = { contract: proofContract, reviewPacketKey: material.reviewPacketKey, catalogSnapshot,
    serverReferenceTime: original.retrievedAt, freshnessContract, evidenceFreshnessAtReference: 'current' as const }
  const proofIdentity = provenanceHash('ot-proof-v1', { ...proofFields, ruleScopeKey: claim.key, factKind: 'requirement_effect', supportVersionIds })!
  const payload: IntegratedPilotPayload = { schema: 'official-truth-autonomous-provenance', schemaVersion: 1,
    canonicalization: 'ot-provenance-json-v1', outcome: 'trusted_fact_produced',
    globalCell: { definition: cell, scope: claim.scope, ruleScopeKey: claim.key },
    candidate: { factKind: 'requirement_effect', requirementType: 'visa', factSchema, applicabilitySchema: null,
      fact: structuredClone(claim.fact), factHash, candidateBinding }, evidenceQuality: 'explicit_primary_statement',
    extractor: { extractorId: execution.selected.extractorId, extractorVersion: execution.selected.extractorVersion,
      sourceFamilyId: execution.selected.sourceFamilyId, schemaFamily: execution.selected.schemaFamily, definition: selectedDefinition,
      registrySnapshot: extractorRegistrySnapshot, outputContract, selectionKey }, policy: null, supports, citations,
    proof: { ...proofFields, proofIdentity } }
  const recordFingerprint = provenanceHash('ot-provenance-v1', payload)!
  const binding = value(readHistoricalArtifact('CustodyDependencyBindingV1', { kind: 'CustodyDependencyBindingV1', schemaVersion: 1,
    value: { receiptFingerprint: recordFingerprint, globalAdmission: admission.pin, selectedSupportManifest: selectedManifest.pin, autonomousReviewConstruction: reviewed.pin } }))
  const bundle = { recordFingerprint, receiptBytes: bytes(payload), custodyBindingBytes: bytes(binding), artifacts }
  const checked = verifyAcceptedStoreIntegratedBundleV1({ profile: ACCEPTED_STORE_TRIP_CLOSURE_PROFILE, bundle })
  if (!checked.ok) throw Error(checked.reason)
  return bundle
}
