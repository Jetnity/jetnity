import 'server-only'
import type { ApplicationContract } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/contract-server'
import type { OfficialTruthExtractorDefinition, OfficialTruthExtractorKontext } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { sha256Hex } from '@/lib/readiness/digest'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { officialTruthSourceFingerprintProtocol, officialTruthSourceFingerprintV2 } from '@/lib/readiness/official-truth-source-fingerprint-v2'
import { chDeAaS1VisaRowResearchFromHtml } from '@/lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server'
import { AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE as reviewed } from './reviewed-source'

const binding = reviewed.binding
const fingerprintBinding = Object.freeze({ ...binding, canonicalUrl: reviewed.canonicalUrl, contentType: reviewed.contentType })

// Fixed ordered projection: object insertion order or unrelated grant digests
// cannot silently choose the mapping. These are applicability, not legal dates.
const digest = sha256Hex('jetnity:official-truth:aa-ch-de-visa-mapping-candidate:v1\0' + JSON.stringify([
  reviewed.mappingVersion, reviewed.contractId, reviewed.applicationScope,
  [reviewed.travelDates.from, reviewed.travelDates.through],
  [binding.sourceId, binding.contentItemId, binding.contentItemVersion,
    binding.representationId, binding.representationVersion, binding.identityProfileId, binding.identityProfileVersion],
  [reviewed.requestUrl, reviewed.canonicalUrl, reviewed.finalUrl, reviewed.contentType,
    reviewed.locale, reviewed.schema, reviewed.sourceFingerprintProtocol, reviewed.sourceContentHash],
  [reviewed.coverage.destinationCountryCodes, reviewed.coverage.transitCountryCodes, reviewed.coverage.requirementTypes,
    [reviewed.coverage.citizenship.mode, reviewed.coverage.citizenship.countryCodes],
    [reviewed.coverage.residence.mode],
    [reviewed.coverage.documents.mode, reviewed.coverage.documents.options.map(o => [o.documentType, o.issuingCountryCode])]],
  [reviewed.extractorId, reviewed.extractorVersion, reviewed.sourceFamilyId, reviewed.schemaFamily,
    reviewed.policyId, reviewed.policyVersion, reviewed.requiredFieldPaths],
  [reviewed.fact.kind, reviewed.fact.effect, reviewed.fact.visaMode], reviewed.recognition, reviewed.validitySemantics,
]))

/** The full pin detects global qualifications/hidden ancestors/body changes.
 * S1 only recognizes the unqualified Swiss row; neither proves origin. The
 * unchanged V2 helper normalizes CRLF/CR to LF, with no other normalization. */
function recognizedBody(text: string): boolean {
  return officialTruthSourceFingerprintProtocol(text) === reviewed.sourceFingerprintProtocol
    && officialTruthSourceFingerprintV2(text, fingerprintBinding) === reviewed.sourceContentHash
    && chDeAaS1VisaRowResearchFromHtml(text).status === 'research_visa_table_observation'
}

type GuardResult = { readonly ok: true } | {
  readonly ok: false; readonly reason: 'schema_mismatch' | 'representation_not_eligible' | 'structure_not_recognized'
}
function guard(context: OfficialTruthExtractorKontext): GuardResult {
  const parsed = regelScopeAusEvidenceScope(context.scope)
  const scope = context.scope
  if (!parsed.ok || parsed.key !== context.scopeKey
    || context.factKind !== 'requirement_effect' || context.requirementType !== 'visa'
    || context.evidenceQuality !== 'explicit_primary_statement' || context.schemaFamily !== reviewed.schemaFamily
    || context.policy !== null || !Array.isArray(context.supports) || context.supports.length !== 1
    || scope.destinationCountryCode !== 'DE' || scope.transitCountryCode !== null || scope.requirementType !== 'visa'
    || scope.citizenship.mode !== 'required' || scope.citizenship.countryCodes.length !== 1 || scope.citizenship.countryCodes[0] !== 'CH'
    || scope.credentialOption.mode !== 'option' || scope.credentialOption.documentType !== 'passport'
    || scope.credentialOption.issuingCountryCode !== 'CH' || scope.credentialOption.relatedCitizenshipCountryCode !== 'CH'
    || scope.residence.mode !== 'not_applicable' || scope.validity.mode !== 'travel_date'
    || scope.validity.travelDate < reviewed.travelDates.from || scope.validity.travelDate > reviewed.travelDates.through) {
    return { ok: false, reason: 'schema_mismatch' }
  }
  const support = context.supports[0]!
  if (support.sourceId !== binding.sourceId || support.contentItemId !== binding.contentItemId
    || support.contentItemVersion !== binding.contentItemVersion || support.representationId !== binding.representationId
    || support.representationVersion !== binding.representationVersion || support.identityProfileId !== binding.identityProfileId
    || support.identityProfileVersion !== binding.identityProfileVersion || support.canonicalUrl !== reviewed.canonicalUrl
    || support.contentType !== reviewed.contentType || support.sourceFingerprintProtocol !== 2) {
    return { ok: false, reason: 'representation_not_eligible' }
  }
  // Request/final URL, zero redirects, freshness and custody belong to the
  // canonical retrieval/application path; its reduced context has no redirects.
  if (support.sourceContentHash !== reviewed.sourceContentHash || !recognizedBody(support.sourceSnapshot)) {
    return { ok: false, reason: 'structure_not_recognized' }
  }
  return { ok: true }
}

export const AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE: ApplicationContract = Object.freeze({
  id: reviewed.contractId, digest, applicationScope: reviewed.applicationScope, travelDates: reviewed.travelDates,
  source: Object.freeze({ sourceId: binding.sourceId, url: reviewed.requestUrl, binding, coverage: reviewed.coverage }),
  extractorId: reviewed.extractorId, extractorVersion: reviewed.extractorVersion,
  validity: (completeText: string) => recognizedBody(completeText) ? { validFrom: null, validUntil: null } : null,
})

/** Inert and unregistered. A callback output alone is never accepted authority;
 * a future admission still requires the unchanged canonical same-request chain. */
export const AA_CH_DE_VISA_EXTRACTOR_CANDIDATE: OfficialTruthExtractorDefinition = Object.freeze({
  extractorId: reviewed.extractorId, extractorVersion: reviewed.extractorVersion, current: false,
  factKind: reviewed.fact.kind, sourceFamilyId: reviewed.sourceFamilyId,
  contentItemRefs: Object.freeze([Object.freeze({ sourceId: binding.sourceId, contentItemId: binding.contentItemId })]),
  representations: Object.freeze([binding]),
  urlAllowlist: Object.freeze([Object.freeze({ kind: 'exact' as const, canonicalUrl: reviewed.canonicalUrl })]),
  contentTypes: Object.freeze([reviewed.contentType]), schemaFamily: reviewed.schemaFamily,
  policyId: reviewed.policyId, policyVersion: reviewed.policyVersion, requiredFieldPaths: reviewed.requiredFieldPaths,
  match: guard,
  extract: (context: OfficialTruthExtractorKontext) => {
    const result = guard(context)
    return result.ok ? { ok: true, fact: reviewed.fact } : result
  },
})
