// INTERNAL fixed projection used only by the owned local DB reader.
// This value is an unsealed historical reproof, never a persisted/live capability.
import 'server-only'
import { evidenceKandidatAusModell, evidenceKandidatAkzeptieren, type EvidenceVersion } from '../../../lib/readiness/evidence'
import { contentIdentityBinding } from '../../../lib/readiness/official-truth-content-identity'
import { constructHistoricalAutonomousReview } from '../../../lib/readiness/official-truth-autonomous-review-material-server'
import { decodeHistoricalArtifact, readHistoricalArtifact, type HistoricalArtifactKind } from '../../../lib/readiness/official-truth-autonomous-provenance-record'
import { historicalValuesEqual, immutable, ownRecord, pinsEqual, provenanceCanonical, type Pin } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import type { IntegratedPilotArtifactType, IntegratedPilotManifest, IntegratedPilotManifestType, IntegratedPilotVerifiedBundle } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { officialTruthRegelKandidatAusEvidence } from '../../../lib/readiness/official-truth-rule-candidate'
import { regelFaktKanonischLesen, regelKandidatAkzeptieren } from '../../../lib/readiness/rule-claims'
import { officialTruthCompositionPhaseA, officialTruthCompositionZitatePruefen, officialTruthFactCitationCoverage, officialTruthFactCitationTargets } from '../../../lib/readiness/official-truth-composition-policy-registry'
import type { OfficialTruthExtractorBeobachtung, OfficialTruthExtractorKontext, OfficialTruthExtractorStuetze } from '../../../lib/readiness/official-truth-trusted-fact-extractor-registry'
import { requirementsFuerReise } from '../../../lib/readiness/engine'
import { officialFrische, type OfficialEvaluation } from '../../../lib/readiness/official'
import type { RequirementsProvider } from '../../../lib/readiness/provider'
import { beispielreise } from '../../../lib/reiseaenderung/fixtures/reise'
import type { Trip } from '../../../types/trips'
import { PILOT_CORPUS, PILOT_SOURCE, derivePilotValidity, type PilotItem } from '../../official-truth-integrated-pilot-1/corpus'
import { persistedCanonicalReadContract } from './contract'

const order = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0
const travellerRef = 'synthetic-retained-traveller'
const documentRef = 'synthetic-retained-document'
const optionRef = `${travellerRef}:${documentRef}`
const providerName = 'Synthetic local historical reproof'
type Contract = ReturnType<typeof persistedCanonicalReadContract>
type SourceProof = Readonly<{
  versionId: string; sourceId: string; contentItemId: string; sourceUrl: string;
  sourceContentHash: string; retrievedAt: string; validFrom: string | null; validUntil: string | null;
}>
export type HistoricalCanonicalProjection = Readonly<{
  status: 'synthetic_historical_projection'; mode: Contract['mode'];
  reproof: 'unsealed_historical_reextraction'; recordFingerprint: string;
  reviewPacketKey: string; definition: Pin; ruleScopeKey: string;
  supportVersionIds: readonly string[]; sources: readonly SourceProof[];
  evaluations: readonly OfficialEvaluation[];
}>

function refuse(): never { throw Error('persisted_projection_refused') }
function equal(left: unknown, right: unknown): void { if (!historicalValuesEqual(left, right)) refuse() }
function artifact(bundle: IntegratedPilotVerifiedBundle, pin: Pin, type: IntegratedPilotArtifactType) {
  const matches = bundle.artifacts.filter(item => pinsEqual(item.pin, pin) && item.artifactType === type)
  if (matches.length !== 1) refuse()
  return matches[0]!
}
function manifest<K extends IntegratedPilotManifestType>(bundle: IntegratedPilotVerifiedBundle, pin: Pin, kind: K) {
  return (artifact(bundle, pin, kind).value as IntegratedPilotManifest<K>).content
}
function historical<K extends Exclude<HistoricalArtifactKind, 'CustodyDependencyBindingV1'>>(bundle: IntegratedPilotVerifiedBundle, pin: Pin, kind: K) {
  const parsed = readHistoricalArtifact(kind, artifact(bundle, pin, kind).value)
  if (!parsed.ok) refuse()
  return parsed.value
}

/** Descriptor equality comes from current fixed code, not archived current:true. */
function currentDescriptors(bundle: IntegratedPilotVerifiedBundle, contract: Contract) {
  const payload = bundle.receipt.payload
  equal(payload.globalCell.definition, contract.request.definition)
  equal(artifact(bundle, contract.request.definition, 'global_cell').value, contract.definition)
  equal(payload.globalCell.scope, contract.request.scope)
  equal(payload.globalCell.ruleScopeKey, PILOT_CORPUS.ruleScopeKey)
  equal(payload.candidate.factKind, contract.request.factKind)
  equal(payload.candidate.requirementType, contract.request.requirementType)
  equal(payload.evidenceQuality, contract.quality)
  if (payload.candidate.applicabilitySchema !== null || payload.supports.length !== contract.items.length) refuse()
  const catalog = manifest(bundle, payload.proof.catalogSnapshot, 'catalog_snapshot')
  equal(catalog.registry, PILOT_CORPUS.registry)
  equal(catalog.profiles.map(profile => ({ id: profile.identityProfileId, version: profile.identityProfileVersion })),
    PILOT_CORPUS.profiles.map(profile => ({ id: profile.identityProfileId, version: profile.identityProfileVersion })))
  for (const profile of catalog.profiles) {
    const current = PILOT_CORPUS.profiles.find(item => item.identityProfileId === profile.identityProfileId && item.identityProfileVersion === profile.identityProfileVersion)
    const stored = manifest(bundle, profile.definition, 'identity_profile')
    if (!current?.current || stored.identityProfileId !== current.identityProfileId || stored.identityProfileVersion !== current.identityProfileVersion) refuse()
  }
  const registry = manifest(bundle, payload.extractor.registrySnapshot, 'extractor_registry')
  equal(registry.definitions.map(item => ({ id: item.id, version: item.version, current: item.current })),
    PILOT_CORPUS.extractors.map(item => ({ id: item.extractorId, version: item.extractorVersion, current: item.current })))
  for (const entry of registry.definitions) {
    const current = PILOT_CORPUS.extractors.find(item => item.extractorId === entry.id && item.extractorVersion === entry.version)
    if (!current?.current) refuse()
    const { current: active, match, extract, ...descriptor } = current
    void active; void match; void extract
    equal(manifest(bundle, entry.definition, 'extractor_definition').descriptor, descriptor)
  }
  const selected = PILOT_CORPUS.extractors.find(item => item.extractorId === `otx_integrated_${contract.mode}`)
  if (!selected?.current || payload.extractor.extractorId !== selected.extractorId || payload.extractor.extractorVersion !== selected.extractorVersion
    || payload.extractor.sourceFamilyId !== selected.sourceFamilyId || payload.extractor.schemaFamily !== selected.schemaFamily) refuse()
  if (!pinsEqual(registry.definitions.find(item => item.id === selected.extractorId)?.definition, payload.extractor.definition)) refuse()
  if (contract.mode === 'primary') { if (payload.policy !== null || selected.policyId !== null) refuse() }
  else {
    const policy = payload.policy
    if (!policy || !PILOT_CORPUS.policy.current || policy.policyId !== PILOT_CORPUS.policy.policyId || policy.policyVersion !== PILOT_CORPUS.policy.policyVersion) refuse()
    const { current, ...descriptor } = PILOT_CORPUS.policy
    equal(manifest(bundle, policy.definition, 'policy_definition').descriptor, descriptor)
    equal(manifest(bundle, policy.registrySnapshot, 'policy_registry').definitions,
      [{ id: descriptor.policyId, version: descriptor.policyVersion, current, definition: policy.definition }])
    equal(policy.assignments, [...descriptor.assignments].sort((a, b) => order(provenanceCanonical(a.target)!, provenanceCanonical(b.target)!)))
  }
  return selected
}

/** Uses the unchanged canonical one-hour freshness ceiling and original times. */
export function historicalProjectionCurrent(projection: HistoricalCanonicalProjection, now = new Date().toISOString()): boolean {
  return projection.sources.length > 0 && projection.sources.every(source => {
    const stamp = Date.parse(source.retrievedAt), current = Date.parse(now)
    return Number.isFinite(stamp) && Number.isFinite(current) && stamp <= current
      && officialFrische({ storedFingerprint: source.sourceContentHash, currentFingerprint: source.sourceContentHash,
        checkedAt: source.retrievedAt, validFrom: source.validFrom, validUntil: source.validUntil,
        now, hasProvider: true, sourceAvailable: true }) === 'current'
  })
}

// Deliberately fixed fictional declaration. No real owner, trip, account or passport.
function syntheticTrip(now: string): Trip {
  const day = now.slice(0, 10)
  return beispielreise({ id: 'synthetic-retained-trip', clientRef: 'synthetic-retained-trip',
    title: 'Synthetic CH passport / GB conformance', origin: '', startDate: day, endDate: day,
    travellers: 1, revision: 1, days: [], ohneTag: [], readinessItems: [],
    stages: [{ id: 'synthetic-retained-stage', name: 'Synthetic GB', countryCode: 'GB', position: 1,
      arrivalDate: null, departureDate: null, latitude: null, longitude: null, placeId: null }],
    party: [{ id: travellerRef, clientRef: travellerRef, label: 'Synthetic traveller', residenceCountryCode: null,
      createdAt: now, updatedAt: now,
      citizenships: [{ id: 'synthetic-retained-citizenship', clientRef: 'synthetic-retained-citizenship', countryCode: 'CH', createdAt: now, updatedAt: now }],
      documents: [{ id: documentRef, clientRef: documentRef, documentType: 'passport', issuingCountryCode: 'CH',
        citizenshipClientRef: 'synthetic-retained-citizenship', expiresOn: null, createdAt: now, updatedAt: now }] }],
  })
}

/** Fixed storage-to-projection call; no caller callback, parser or authority DTO.
 * The storage module owns the verified closure/bytes and keeps its SQL lock.
 * This function does not claim that its result was read from a database. */
export async function projectHistoricalCanonicalRequirements(bundle: IntegratedPilotVerifiedBundle, bodies: readonly Uint8Array[], mode: unknown, signal: AbortSignal): Promise<HistoricalCanonicalProjection> {
  if (signal.aborted) refuse()
  const contract = persistedCanonicalReadContract(mode), payload = bundle.receipt.payload
  const selected = currentDescriptors(bundle, contract)
  const binding = decodeHistoricalArtifact('CustodyDependencyBindingV1', bundle.custodyBindingBytes)
  if (!binding.ok || binding.value.value.receiptFingerprint !== bundle.receipt.recordFingerprint) refuse()
  const selectedPin = binding.value.value.selectedSupportManifest
  const selectedManifest = historical(bundle, selectedPin, 'SelectedSupportManifestV1')
  const storedReview = historical(bundle, binding.value.value.autonomousReviewConstruction, 'AutonomousReviewConstructionV1')
  if (storedReview.value.safePreimage.candidate.proposal !== null || bodies.length !== payload.supports.length) refuse()
  equal(selectedManifest.value.supports.map(item => item.versionId), payload.supports.map(item => item.versionId))
  const custodies = selectedManifest.value.supports.map(item => historical(bundle, item.custody, 'AcceptedEvidenceCustodyV1'))
  const versions: EvidenceVersion[] = [], flat: OfficialTruthExtractorStuetze[] = []
  for (let index = 0; index < payload.supports.length; index++) {
    const support = payload.supports[index]!, custody = custodies[index]!.value, body = bodies[index]!
    if (support.sourceFingerprintProtocol !== undefined || body.byteLength < 1 || body.byteLength > 65_536) refuse()
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body)
    if (text.startsWith('\uFEFF') || !Buffer.from(text, 'utf8').equals(Buffer.from(body))) refuse()
    const observation = manifest(bundle, custody.observation, 'original_observation')
    const validity = manifest(bundle, custody.validityOrigin, 'validity_origin')
    const origin = manifest(bundle, custody.acceptedOrigin, 'accepted_origin')
    const identity = custody.evidenceIdentity
    if (!contract.items.includes(identity.contentItemId) || identity.sourceId !== PILOT_SOURCE || identity.representationId !== 'json') refuse()
    const representation = PILOT_CORPUS.registry.contentIdentity!.representations.find(item =>
      item.sourceId === identity.sourceId && item.contentItemId === identity.contentItemId && item.representationId === identity.representationId)
    const item = PILOT_CORPUS.registry.contentIdentity!.items.find(item => item.sourceId === identity.sourceId && item.contentItemId === identity.contentItemId)
    const profile = PILOT_CORPUS.profiles.find(item => item.identityProfileId === identity.identityProfileId && item.identityProfileVersion === identity.identityProfileVersion)
    if (!representation?.current || !item?.current || !profile?.current) refuse()
    equal(contentIdentityBinding(representation), support.binding)
    const qualified = profile.verify({ item, representation, responseText: text, finalUrl: observation.canonicalFinalUrl, mediaType: observation.contentType })
    if (!qualified.ok) refuse()
    equal(qualified.identity, support.binding)
    const derived = derivePilotValidity(identity.contentItemId as PilotItem, text)
    if (!derived) refuse()
    equal({ validFrom: validity.validFrom, validUntil: validity.validUntil, validFromBasis: validity.validFromBasis, validUntilBasis: validity.validUntilBasis }, derived)
    const candidate = evidenceKandidatAusModell({ scope: custody.evidenceScope, validFrom: derived.validFrom, validUntil: derived.validUntil },
      { sourceSnapshot: text, contentType: observation.contentType, canonicalUrl: observation.canonicalFinalUrl, retrievedAt: observation.completedAt }, PILOT_CORPUS.registry)
    if (!candidate.ok) refuse()
    const accepted = evidenceKandidatAkzeptieren(candidate.evidence, PILOT_CORPUS.registry)
    if (!accepted.ok) refuse()
    const { previousVersionId, lifecycle, validationState, sourceClass, authorityName, publisherName, scope, extractionNote, ...rebuiltIdentity } = accepted.evidence
    void previousVersionId; void lifecycle; void validationState; void sourceClass; void authorityName; void publisherName; void extractionNote
    equal(rebuiltIdentity, custody.evidenceIdentity)
    equal(rebuiltIdentity, origin.evidenceIdentity)
    equal(scope, custody.evidenceScope)
    equal(scope, origin.evidenceScope)
    equal(observation.binding, support.binding)
    equal(observation.sourceContentHash, accepted.evidence.sourceContentHash)
    equal(observation.completedAt, support.acceptedRetrievedAt)
    if (observation.startedAt > observation.completedAt) refuse()
    versions.push(immutable(accepted.evidence))
    flat.push(immutable({ ...contentIdentityBinding(accepted.evidence), versionId: accepted.evidence.versionId,
      canonicalUrl: accepted.evidence.canonicalUrl, retrievedAt: accepted.evidence.retrievedAt,
      contentType: accepted.evidence.contentType, sourceSnapshot: text, sourceContentHash: accepted.evidence.sourceContentHash }))
  }
  const review = constructHistoricalAutonomousReview({ definition: contract.definition, manifest: selectedManifest, manifestPin: selectedPin,
    constructionContract: storedReview.value.constructionContract, custodies, acceptedVersions: versions,
    registry: PILOT_CORPUS.registry, proposal: storedReview.value.safePreimage.candidate.proposal })
  if (!review.ok) refuse()
  equal(review.value, storedReview)
  equal(review.value.value.reviewPacketKey, payload.proof.reviewPacketKey)
  const context: OfficialTruthExtractorKontext = immutable({ factKind: 'requirement_effect', requirementType: 'visa',
    scopeKey: PILOT_CORPUS.ruleScopeKey, scope: PILOT_CORPUS.scope, evidenceQuality: contract.quality,
    schemaFamily: selected.schemaFamily, supports: flat, policy: null, registry: PILOT_CORPUS.registry })
  // R1: the existing fixed parser over retained bytes; no current retrieval
  // envelope, redirect count, Same-Request token or composition execution seal.
  const match = ownRecord(selected.match(context), ['ok'])
  if (match?.ok !== true) refuse()
  const extracted = selected.extract(context)
  const result = ownRecord(extracted, contract.mode === 'primary' ? ['ok', 'fact'] : ['ok', 'fact', 'observations'])
  if (result?.ok !== true) refuse()
  const fact = regelFaktKanonischLesen('requirement_effect', 'visa', result.fact, PILOT_CORPUS.registry)
  if (!fact.ok) refuse()
  equal(fact.fact, payload.candidate.fact)
  const ids = versions.map(version => version.versionId), targets = officialTruthFactCitationTargets(fact.fact)
  if (!targets) refuse()
  let citations: { target: (typeof targets)[number]; supportVersionIds: string[] }[]
  if (contract.mode === 'primary') citations = targets.map(target => ({ target, supportVersionIds: [...ids] }))
  else {
    const frozen = officialTruthCompositionPhaseA({ factKind: 'requirement_effect', requirementType: 'visa',
      supports: versions, extractors: PILOT_CORPUS.extractors, policies: [PILOT_CORPUS.policy] })
    if (!frozen.ok || frozen.freeze.extractor.extract !== selected.extract || frozen.freeze.extractor.match !== selected.match) refuse()
    if (!Array.isArray(result.observations) || provenanceCanonical(result.observations) === null) refuse()
    // These observations came from the exact fixed extract() call above; no
    // observer values are accepted from a caller or from the stored receipt.
    const checked = officialTruthCompositionZitatePruefen({ freeze: frozen.freeze, fact: fact.fact,
      proofSupports: versions, acceptedVersionIds: ids, observations: result.observations as OfficialTruthExtractorBeobachtung[] })
    if (!checked.ok) refuse()
    equal(frozen.freeze.policyId, payload.policy!.policyId)
    equal(frozen.freeze.policyVersion, payload.policy!.policyVersion)
    citations = targets.map(target => ({ target, supportVersionIds: [...new Set(checked.provenance
      .filter(row => historicalValuesEqual(row.target, target)).map(row => row.versionId))].sort() }))
  }
  citations.sort((left, right) => order(provenanceCanonical(left.target)!, provenanceCanonical(right.target)!))
  equal(citations, payload.citations)
  if (!officialTruthFactCitationCoverage({ fact: fact.fact, supportVersionIds: ids,
    citations: citations.flatMap(row => row.supportVersionIds.map(versionId => ({ target: row.target, versionId }))) })) refuse()
  const candidate = officialTruthRegelKandidatAusEvidence(versions, PILOT_CORPUS.registry,
    { factKind: 'requirement_effect', evidenceQuality: contract.quality, proposal: null })
  if (!candidate.ok) refuse()
  const accepted = regelKandidatAkzeptieren({ kandidat: candidate.kandidat, trustedRuleFact: fact.fact, evidenceVersions: versions, registry: PILOT_CORPUS.registry })
  if (!accepted.ok || accepted.claim.fact.kind !== 'requirement_effect' || 'schema' in accepted.claim.fact) refuse()
  const requirement = accepted.claim.fact
  if (requirement.effect !== 'required' || requirement.visaMode !== 'electronic_visa') refuse()
  const sources: SourceProof[] = versions.map(version => ({ versionId: version.versionId, sourceId: version.sourceId,
    contentItemId: version.contentItemId, sourceUrl: version.canonicalUrl, sourceContentHash: version.sourceContentHash,
    retrievedAt: version.retrievedAt, validFrom: version.validFrom, validUntil: version.validUntil }))
  const common = { status: 'synthetic_historical_projection' as const, mode: contract.mode, reproof: 'unsealed_historical_reextraction' as const,
    recordFingerprint: bundle.receipt.recordFingerprint, reviewPacketKey: payload.proof.reviewPacketKey,
    definition: contract.request.definition, ruleScopeKey: PILOT_CORPUS.ruleScopeKey, supportVersionIds: ids, sources }
  if (signal.aborted || !historicalProjectionCurrent({ ...common, evaluations: [] })) refuse()
  const now = new Date().toISOString(), trip = syntheticTrip(now)
  const checkedAt = sources.map(source => source.retrievedAt).sort()[0]!
  const starts = sources.flatMap(source => source.validFrom === null ? [] : [source.validFrom]).sort()
  const ends = sources.flatMap(source => source.validUntil === null ? [] : [source.validUntil]).sort()
  const provider: RequirementsProvider = { name: providerName, async evaluate(request, evaluationSignal) {
    const traveller = request.travellers[0], option = traveller?.credentialOptions[0]
    if (signal.aborted || evaluationSignal.aborted || request.travellers.length !== 1
      || !historicalValuesEqual(request.destinationCountryCodes, ['GB']) || request.transitCountryCodes.length !== 0
      || traveller?.clientRef !== travellerRef || traveller.residenceCountryCode !== null
      || !historicalValuesEqual(traveller.citizenshipCountryCodes, ['CH']) || traveller.documents.length !== 1
      || traveller.credentialOptions.length !== 1 || option?.optionRef !== optionRef || option.documentClientRef !== documentRef
      || option.documentType !== 'passport' || option.issuingCountryCode !== 'CH' || option.relatedCitizenshipCountryCode !== 'CH'
      || request.startDate !== trip.startDate || request.endDate !== trip.endDate) return []
    return [{ travellerClientRef: travellerRef, credentialOptionRef: optionRef, destinationCountryCode: 'GB', transitCountryCode: null,
      requirementType: 'visa', result: requirement.effect, visaMode: requirement.visaMode, officialClass: 'requirement',
      authority: versions[0]!.authorityName, sourceUrl: contract.mode === 'primary' ? sources[0]!.sourceUrl : null,
      checkedAt, validFrom: starts.at(-1) ?? null, validUntil: ends[0] ?? null, ruleReference: null, availability: 'ok' }]
  } }
  const evaluations = await requirementsFuerReise(trip, provider, { signal })
  const positive = evaluations.filter(row => row.result !== 'unknown')
  if (signal.aborted || positive.length !== 1 || positive[0]!.requirementType !== 'visa'
    || positive[0]!.result !== 'required' || positive[0]!.visaMode !== 'electronic_visa'
    || positive[0]!.status !== 'current' || positive[0]!.freshness !== 'current'
    || positive[0]!.travellerClientRef !== travellerRef || positive[0]!.credentialOptionRef !== optionRef
    || positive[0]!.destinationCountryCode !== 'GB' || positive[0]!.transitCountryCode !== null
    || positive[0]!.evidence.checkedAt !== checkedAt) refuse()
  const projection = immutable({ ...common, evaluations })
  if (!historicalProjectionCurrent(projection)) refuse()
  return projection
}
