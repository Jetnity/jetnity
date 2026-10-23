import 'server-only'
import { Buffer } from 'node:buffer'
import type { Trip } from '@/types/trips'
import { loadOfficialTruthFactEntryAuthority } from '@/lib/readiness/official-truth-fact-entry-authority-server'
import { loadOfficialTruthServerOwnedRetrieval } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { quellenKatalogLesen } from '@/lib/readiness/official-truth-source-catalog-server'
import { contentIdentityBinding, contentIdentityMatches, contentRepresentationFromRegistry } from '@/lib/readiness/official-truth-content-identity'
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES, officialTruthSourceFingerprintV3 } from '@/lib/readiness/official-truth-source-fingerprint-v3'
import { regelKandidatAkzeptieren, regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { officialTruthRechercheEntscheiden } from '@/lib/readiness/official-truth-research-request'
import { officialTruthRegelReviewBelege } from '@/lib/readiness/official-truth-rule-review-packet'
import { officialTruthRegelReviewPacketFingerprint } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import { officialTruthRegelReviewEntscheidungsabsicht } from '@/lib/readiness/official-truth-rule-review-decision-intent'
import { officialTruthTrustedFactExtrahieren, consumeOfficialTruthTrustedFactExecutionContext } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { requirementsFuerReise, requirementsLokalFuerReise } from '@/lib/readiness/engine'
import type { RequirementsProvider } from '@/lib/readiness/provider'
import { reiseLaden } from '@/lib/trips/daten'
import { pilotContextFingerprint } from './context'
import { pilotScope } from './scope-server'
import { applicationContract, applicationContractExpectsCurrentRequest, applicationCurrentRequestContractDigest, applicationPilotEnabled } from './contract-server'
import { pilotGrant } from './database-server'
import type { PilotResult, PilotStatus } from './result'
import { withinDeadline } from './deadline-server'

/** Current invocation only. No exported injection seam, positive cache or writes
 * to the accepted store. Tests replace dependencies outside the deploy graph. */
export async function evaluateApplicationPilot(trip: Trip, signal: AbortSignal): Promise<PilotResult> {
  try { return await withinDeadline(signal, 15_000, bounded => evaluateCurrentRequest(trip, bounded)) }
  catch { return { status: 'unavailable', tripId: trip.id, revision: trip.revision,
    contextFingerprint: pilotContextFingerprint(trip), expiresAt: null, evaluations: requirementsLokalFuerReise(trip) } }
}
async function evaluateCurrentRequest(trip: Trip, signal: AbortSignal): Promise<PilotResult> {
  const started = Date.now(), fingerprint = pilotContextFingerprint(trip)
  const empty = (status: PilotStatus): PilotResult => ({ status, tripId: trip.id, revision: trip.revision,
    contextFingerprint: fingerprint, expiresAt: null, evaluations: requirementsLokalFuerReise(trip) })
  const expired = () => signal.aborted || Date.now()-started >= 15_000
  // Scope is checked before authority, admission or any source request.
  const scopeCheck = pilotScope(trip)
  if (!scopeCheck.ok) return empty(scopeCheck.reason === 'context_missing' ? 'context_missing'
    : scopeCheck.reason === 'context_changed' ? 'context_changed' : 'unsupported_context')
  if (expired()) return empty('unavailable')
  if (!applicationPilotEnabled()) return empty('disabled')
  try {
    const authority = await loadOfficialTruthFactEntryAuthority()
    if (expired() || authority.status !== 'authorized' || authority.grant !== 'role' || authority.capability !== 'official-truth-freigeben') return empty('unavailable')
    const grant = await pilotGrant(trip, null, signal)
    if (!grant || expired()) return empty('source_not_admitted')
    const contract = applicationContract(grant.contractId, grant.contractDigest)
    if (!contract || contract.applicationScope !== 'ch-ordinary-tourism-direct-de-v1'
      || !trip.startDate || !trip.endDate || trip.startDate<contract.travelDates.from || trip.endDate>contract.travelDates.through) return empty('source_not_admitted')
    // Bern's independent blocked execution authority is never borrowed here.
    if (new URL(contract.source.url).hostname === 'bern.diplo.de') return empty('source_not_admitted')
    const catalog = await quellenKatalogLesen()
    if (!catalog.ok || expired()) return empty('source_not_admitted')
    const source = catalog.registry.sources.find(s => s.sourceId === contract.source.sourceId)
    const representation = contentRepresentationFromRegistry(catalog.registry, contract.source.url)
    if (!source || source.sourceClass !== 'official_authority' || !representation.ok
      || !contentIdentityMatches(representation.value, contract.source.binding)) return empty('source_not_admitted')
    const d = trip.regulatoryContext!.declaration
    const traveller = trip.party!.find(t => t.clientRef===d.travellerClientRef)!
    const scope = regelScopeAusEvidenceScope({ destinationCountryCode: 'DE', transitCountryCode: null,
      citizenship: { mode: 'required', countryCodes: traveller.citizenships.map(c => c.countryCode).sort() },
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
      residence: { mode: 'not_applicable' }, requirementType: 'visa',
      validity: { mode: 'travel_date', travelDate: trip.startDate } })
    if (!scope.ok) return empty('unsupported_context')
    const research = officialTruthRechercheEntscheiden({ status: 'missing', ruleScopeKey: scope.key, factKind: 'requirement_effect' }, scope.scope)
    if (research.action !== 'research') return empty('unavailable')
    // Leave the unchanged protected retrieval its complete 10-second budget.
    if (expired() || Date.now()-started>5_000) return empty('unavailable')
    const retrieval = await loadOfficialTruthServerOwnedRetrieval({ sourceId: source.sourceId, url: contract.source.url })
    if (retrieval.status !== 'server_owned_official_retrieval' || expired()) return empty('unavailable')
    if (contract.sourceProtocol != null || contract.policyId != null || contract.policyVersion != null) {
      const currentDigest = applicationCurrentRequestContractDigest(contract)
      if (!applicationContractExpectsCurrentRequest(contract) || !currentDigest || contract.digest !== currentDigest) {
        return empty('source_not_admitted')
      }
      const fingerprintBinding = {
        ...contentIdentityBinding(retrieval), canonicalUrl: retrieval.canonicalUrl, contentType: retrieval.contentType,
      }
      if (retrieval.sourceFingerprintProtocol !== 3 || retrieval.redirectCount !== 0
        || Buffer.byteLength(retrieval.sourceSnapshot, 'utf8') > OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES
        || retrieval.sourceSnapshot.length > OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES
        || retrieval.sourceContentHash !== officialTruthSourceFingerprintV3(retrieval.sourceSnapshot, fingerprintBinding)
        || !contentIdentityMatches(retrieval, contract.source.binding)
        || retrieval.requestUrl !== contract.source.url || retrieval.canonicalUrl !== representation.value.expectedFinalUrl
        || Date.parse(retrieval.retrievedAt) < started || Date.parse(retrieval.retrievedAt) > Date.now()) return empty('unavailable')
    } else if (Buffer.byteLength(retrieval.sourceSnapshot,'utf8')>65_536
      || retrieval.sourceContentHash !== evidenceQuellenFingerprint(retrieval.sourceSnapshot)
      || !contentIdentityMatches(retrieval, contract.source.binding)
      || retrieval.requestUrl !== contract.source.url || retrieval.canonicalUrl !== representation.value.expectedFinalUrl
      || Date.parse(retrieval.retrievedAt)<started || Date.parse(retrieval.retrievedAt)>Date.now()) return empty('unavailable')
    const validity = contract.validity(retrieval.sourceSnapshot)
    if (!validity) return empty('unavailable')
    const packetInput = { supports: [{ umschlag: { request: research.request, registry: catalog.registry,
      descriptors: [{ source, coverage: contract.source.coverage }], sourceId: source.sourceId,
      material: { canonicalUrl: retrieval.canonicalUrl, contentType: retrieval.contentType,
        sourceSnapshot: retrieval.sourceSnapshot, retrievedAt: retrieval.retrievedAt,
        ...(retrieval.sourceFingerprintProtocol === 3 ? { sourceFingerprintProtocol: 3 as const } : {}) } },
      uhr: () => new Date(), extraktion: { ...validity, extractionNote: null } }],
      metadata: { factKind: 'requirement_effect', evidenceQuality: 'explicit_primary_statement', proposal: null } }
    const packet = officialTruthRegelReviewBelege(packetInput)
    const review = officialTruthRegelReviewPacketFingerprint(packetInput)
    if (packet.status !== 'rule_review_packet' || review.status !== 'rule_review_packet_fingerprint') return empty('unavailable')
    const intent = officialTruthRegelReviewEntscheidungsabsicht({ packetInput, reviewPacketKey: review.reviewPacketKey,
      decision: 'proceed_to_trusted_fact_entry' })
    if (intent.status !== 'rule_review_decision_intent') return empty('unavailable')
    const input = { factKind: 'requirement_effect', requirementType: 'visa', scope: scope.scope, scopeKey: scope.key,
      evidenceQuality: 'explicit_primary_statement', supports: [{ versionId: packet.evidenceVersions[0]!.versionId,
        sourceId: source.sourceId, retrieval: {
          ...contentIdentityBinding(retrieval), identitySchema: 2 as const,
          status: retrieval.status, sourceId: retrieval.sourceId,
          canonicalUrl: retrieval.canonicalUrl, retrievedAt: retrieval.retrievedAt,
          contentType: retrieval.contentType, sourceSnapshot: retrieval.sourceSnapshot,
          sourceContentHash: retrieval.sourceContentHash, redirectCount: retrieval.redirectCount,
          ...(retrieval.sourceFingerprintProtocol === 3 ? { sourceFingerprintProtocol: 3 as const } : {}),
        } }], policy: null, registry: catalog.registry }
    const extracted = officialTruthTrustedFactExtrahieren(input)
    const execution = consumeOfficialTruthTrustedFactExecutionContext(extracted, input)
    if (extracted.status !== 'trusted_fact_extracted' || !execution || expired()
      || extracted.extractorId !== contract.extractorId || extracted.extractorVersion !== contract.extractorVersion) return empty('unavailable')
    const accepted = regelKandidatAkzeptieren({ kandidat: packet.kandidat, trustedRuleFact: extracted.fact,
      evidenceVersions: packet.evidenceVersions, registry: catalog.registry })
    if (!accepted.ok || accepted.claim.fact.kind !== 'requirement_effect') return empty('unavailable')
    const fact = accepted.claim.fact
    // This application version only projects a fully proven simple visa effect.
    // Conditional/composed legal mappings require their existing canonical proof path.
    if (execution.fact !== extracted.fact || !('effect' in fact) || (fact.effect !== 'required' && fact.effect !== 'not_required')) return empty('unavailable')
    const provider: RequirementsProvider = { name: 'Jetnity Official Truth', evaluate: async () => [{
      travellerClientRef: d.travellerClientRef!, credentialOptionRef: d.credentialOptionRef!,
      destinationCountryCode: 'DE', requirementType: 'visa', result: fact.effect, visaMode: fact.visaMode,
      officialClass: 'requirement', authority: source.authorityName, sourceUrl: retrieval.canonicalUrl,
      checkedAt: retrieval.retrievedAt, validFrom: validity.validFrom, validUntil: validity.validUntil,
      ruleReference: review.reviewPacketKey,
    }] }
    const evaluations = await requirementsFuerReise(trip, provider, { signal })
    // Recheck kill/admission, actual Auth and account graph AFTER verification.
    if (expired()) return empty('unavailable')
    const [currentGrant, currentAuthority, currentTrip, currentCatalog] = await Promise.all([
      pilotGrant(trip, grant.id, signal), loadOfficialTruthFactEntryAuthority(), reiseLaden(trip.id, signal), quellenKatalogLesen(),
    ])
    if (!applicationPilotEnabled() || expired() || currentAuthority.status !== 'authorized' || currentAuthority.grant !== 'role'
      || currentAuthority.capability !== 'official-truth-freigeben'
      || !currentGrant || JSON.stringify(currentGrant)!==JSON.stringify(grant)
      || !currentCatalog.ok || JSON.stringify(currentCatalog.registry)!==JSON.stringify(catalog.registry)) return empty('unavailable')
    if (currentTrip.problem || !currentTrip.zeilen[0] || pilotContextFingerprint(currentTrip.zeilen[0])!==fingerprint) return empty('context_changed')
    const positive = evaluations.filter(e => e.result==='required' || e.result==='not_required')
    if (positive.length!==1 || positive[0]!.requirementType!=='visa') return empty('unavailable')
    const expires = Math.min(Date.now()+60_000,Date.parse(grant.expiresAt))
    return { status: 'verified', tripId: trip.id, revision: trip.revision, contextFingerprint: fingerprint,
      expiresAt: new Date(expires).toISOString(), evaluations }
  } catch { return empty('unavailable') }
}
