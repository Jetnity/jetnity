import 'server-only'
import { contentIdentityBinding, contentIdentityMatches, contentRepresentationFromRegistry, type ContentIdentityBinding } from '../official-truth-content-identity'
import { evidenceQuellenFingerprint } from '../evidence'
import { regelKandidatAkzeptieren, regelScopeAusEvidenceScope, type AkzeptierteRegelClaim, type RegelScope } from '../rule-claims'
import { officialTruthRechercheEntscheiden } from '../official-truth-research-request'
import { officialTruthRegelReviewBelege } from '../official-truth-rule-review-packet'
import { officialTruthRegelReviewPacketFingerprint } from '../official-truth-rule-review-fingerprint'
import { officialTruthRegelReviewEntscheidungsabsicht } from '../official-truth-rule-review-decision-intent'
import { officialTruthTrustedFactExtrahieren, consumeOfficialTruthTrustedFactExecutionContext, type OfficialTruthTrustedFactExecutionContext } from '../official-truth-trusted-fact-extractor-registry'
import { immutable } from '../official-truth-autonomous-provenance-artifact'
import type { QuellenRegistry } from '../source-registry'
import type { ApplicationContract } from '../official-truth-ch-de-application-pilot-1/contract-server'
import type { IntegratedPilotValidityOriginValue } from '../official-truth-integrated-pilot-bundle'
import type { EvidenceVersion } from '../evidence'

/** Internal server values. No source/contract/fact is accepted by a product request. */
export type AcceptedStoreContract = ApplicationContract & Readonly<{
  cellId: string; cellVersion: number; scope: RegelScope;
  implementationSources: readonly Readonly<{ path: string; utf8: string }>[];
  validityOrigin: (completeText: string) => Pick<IntegratedPilotValidityOriginValue,
    'validFrom' | 'validUntil' | 'validFromBasis' | 'validUntilBasis'> | null;
}>
export type AcceptedStoreOriginal = ContentIdentityBinding & Readonly<{
  identitySchema: 2; status: 'server_owned_official_retrieval'; requestUrl: string; canonicalUrl: string;
  retrievedAt: string; contentType: string; sourceSnapshot: string; sourceContentHash: string; redirectCount: number;
}>
export type CanonicalStoreMaterial = Readonly<{
  contract: AcceptedStoreContract; registry: QuellenRegistry; original: AcceptedStoreOriginal;
  originalStartedAt: string; reviewPacketKey: string; evidence: EvidenceVersion;
  claim: AkzeptierteRegelClaim; execution: OfficialTruthTrustedFactExecutionContext;
  validity: NonNullable<ReturnType<AcceptedStoreContract['validityOrigin']>>;
}>
const constructed = new WeakSet<object>()

/** Actual canonical execution, not a protected DB acceptance. Finalize supplies
 * fresh authenticated authority; neither this value nor its history is a grant. */
export function canonicalStoreMaterial(contract: AcceptedStoreContract, registry: QuellenRegistry,
  original: AcceptedStoreOriginal, originalStartedAt: string): CanonicalStoreMaterial {
  const started = Date.parse(originalStartedAt), received = Date.parse(original.retrievedAt)
  if (!Number.isFinite(started) || !Number.isFinite(received) || started > received || received > Date.now()
    || original.status !== 'server_owned_official_retrieval' || original.identitySchema !== 2
    || Buffer.byteLength(original.sourceSnapshot, 'utf8') > 65_536 || Object.hasOwn(original, 'sourceFingerprintProtocol')
    || original.requestUrl !== contract.source.url || !contentIdentityMatches(original, contract.source.binding)
    || evidenceQuellenFingerprint(original.sourceSnapshot) !== original.sourceContentHash) throw Error('original_invalid')
  const source = registry.sources.find(s => s.sourceId === contract.source.sourceId)
  const representation = contentRepresentationFromRegistry(registry, contract.source.url)
  const scope = regelScopeAusEvidenceScope(contract.scope)
  if (!source || source.sourceClass !== 'official_authority' || !representation.ok || !scope.ok
    || !contentIdentityMatches(representation.value, contract.source.binding)
    || original.canonicalUrl !== representation.value.expectedFinalUrl || original.contentType !== representation.value.expectedMediaType
    || contract.applicationScope !== 'ch-ordinary-tourism-direct-de-v1'
    || scope.scope.destinationCountryCode !== 'DE' || scope.scope.transitCountryCode !== null
    || scope.scope.validity.mode !== 'travel_date'
    || scope.scope.validity.travelDate < contract.travelDates.from || scope.scope.validity.travelDate > contract.travelDates.through) throw Error('contract_invalid')
  const validity = contract.validityOrigin(original.sourceSnapshot), plainValidity = contract.validity(original.sourceSnapshot)
  if (!validity || !plainValidity || validity.validFrom !== plainValidity.validFrom || validity.validUntil !== plainValidity.validUntil
    || validity.validFrom !== null && scope.scope.validity.travelDate < validity.validFrom.slice(0, 10)
    || validity.validUntil !== null && scope.scope.validity.travelDate > validity.validUntil.slice(0, 10)) throw Error('validity_invalid')
  const research = officialTruthRechercheEntscheiden({ status: 'missing', ruleScopeKey: scope.key, factKind: 'requirement_effect' }, scope.scope)
  if (research.action !== 'research') throw Error('research_invalid')
  const packetInput = { supports: [{ umschlag: { request: research.request, registry,
    descriptors: [{ source, coverage: contract.source.coverage }], sourceId: source.sourceId,
    material: { canonicalUrl: original.canonicalUrl, contentType: original.contentType,
      sourceSnapshot: original.sourceSnapshot, retrievedAt: original.retrievedAt } },
    uhr: () => new Date(), extraktion: { ...plainValidity, extractionNote: null } }],
    metadata: { factKind: 'requirement_effect', evidenceQuality: 'explicit_primary_statement', proposal: null } }
  const packet = officialTruthRegelReviewBelege(packetInput)
  const fingerprint = officialTruthRegelReviewPacketFingerprint(packetInput)
  if (packet.status !== 'rule_review_packet' || packet.evidenceVersions.length !== 1
    || fingerprint.status !== 'rule_review_packet_fingerprint') throw Error('packet_invalid')
  const intent = officialTruthRegelReviewEntscheidungsabsicht({ packetInput, reviewPacketKey: fingerprint.reviewPacketKey,
    decision: 'proceed_to_trusted_fact_entry' })
  if (intent.status !== 'rule_review_decision_intent') throw Error('decision_construction_invalid')
  const evidence = packet.evidenceVersions[0]!
  const input = { factKind: 'requirement_effect', requirementType: 'visa', scope: scope.scope, scopeKey: scope.key,
    evidenceQuality: 'explicit_primary_statement', supports: [{ versionId: evidence.versionId, sourceId: source.sourceId,
      retrieval: { ...contentIdentityBinding(original), identitySchema: 2, status: original.status, sourceId: original.sourceId,
        canonicalUrl: original.canonicalUrl, retrievedAt: original.retrievedAt, contentType: original.contentType,
        sourceSnapshot: original.sourceSnapshot, sourceContentHash: original.sourceContentHash, redirectCount: original.redirectCount } }], policy: null, registry }
  const extracted = officialTruthTrustedFactExtrahieren(input)
  const execution = consumeOfficialTruthTrustedFactExecutionContext(extracted, input)
  if (extracted.status !== 'trusted_fact_extracted' || !execution || execution.fact !== extracted.fact
    || execution.selected.extractorId !== contract.extractorId || execution.selected.extractorVersion !== contract.extractorVersion) throw Error('execution_invalid')
  const accepted = regelKandidatAkzeptieren({ kandidat: packet.kandidat, trustedRuleFact: execution.fact,
    evidenceVersions: packet.evidenceVersions, registry })
  if (!accepted.ok || accepted.claim.fact.kind !== 'requirement_effect'
    || !('effect' in accepted.claim.fact) || !['required', 'not_required'].includes(accepted.claim.fact.effect)) throw Error('canonical_acceptance_invalid')
  const result = immutable({ contract, registry, original, originalStartedAt, reviewPacketKey: fingerprint.reviewPacketKey,
    evidence, claim: accepted.claim, execution, validity })
  constructed.add(result)
  return result
}

/** One-use constructor membership. A cloned or caller-asserted accepted value
 * cannot be turned into this package's provenance construction. */
export function consumeCanonicalStoreMaterial(material: CanonicalStoreMaterial): boolean {
  if (!constructed.has(material)) return false
  constructed.delete(material)
  return true
}
