// Dormant metadata mapping only. No original, fact, receipt or approval is made.
import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE as application } from '@/lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping'
import { AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE as reviewed } from '@/lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/reviewed-source'
import { createV3ContextIdentity, readV3GlobalRuleContext, type V3GlobalRuleContext, type V3ReadResult } from '../contract'

export type V3AaPilotContextCandidate = Readonly<{
  kind: 'global_context_candidate'; mappingRevision: 1; mappingDigest: string;
  context: V3GlobalRuleContext; contextKey: string; ruleScopeKey: string;
  basis: Readonly<{ reviewedMetadataDigest: string; applicationMetadataDigest: string;
    applicationContractId: string; applicationContractDigest: string }>;
}>

/** No parameters: callers cannot select countries, windows, purposes or grants.
 * These exact metadata pins require a reviewed mapping revision if changed.
 * The travel_date-scoped AA extractor/receipts are deliberately never invoked. */
export function createV3AaPilotContextCandidate(): V3ReadResult<V3AaPilotContextCandidate> {
  const applicationMetadata = {
    id: application.id, digest: application.digest, applicationScope: application.applicationScope,
    travelDates: application.travelDates, source: application.source,
    extractorId: application.extractorId, extractorVersion: application.extractorVersion,
  }
  const reviewedMetadataDigest = sha256Hex(schema2Kanonisch(reviewed))
  const applicationMetadataDigest = sha256Hex(schema2Kanonisch(applicationMetadata))
  if (reviewedMetadataDigest !== '0c5d46528329e799f930d04077b15a3bd9f114d72342d40ebe9dc19382623e23'
    || applicationMetadataDigest !== '6b58c2febd0a8e455ffd1494eacb9949c39855a331082d66a7b31a88b4830291') {
    return Object.freeze({ ok: false, reason: 'reference_mismatch' })
  }
  const context = readV3GlobalRuleContext({ contextRevision: 2,
    scope: { destinationCountryCode: 'DE', transitCountryCode: null,
      citizenship: { mode: 'required', countryCodes: ['CH'] },
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
      residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'not_applicable' } },
    route: 'direct_entry', conditions: { status: 'specified', expression: { op: 'all', operands: [
      { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } },
      { op: 'atomic', predicate: { kind: 'journey_origin', place: { kind: 'country', countryCode: 'CH' } } },
    ] } },
    application: { purpose: 'tourism', tripStartAndEndWindow: { from: '2026-11-07', through: '2026-11-13' } },
  })
  if (!context.ok) return context
  const identity = createV3ContextIdentity(context.value)
  if (!identity.ok) return identity
  const mappingDigest = sha256Hex('jetnity:official-truth:aa-pilot-global-context:v1\0' + schema2Kanonisch({
    mappingRevision: 1, reviewedMetadata: reviewed, applicationMetadata,
    context: context.value, contextIdentity: identity.value,
  }))
  return Object.freeze({ ok: true, value: Object.freeze({ kind: 'global_context_candidate', mappingRevision: 1,
    mappingDigest, context: context.value, ...identity.value,
    basis: Object.freeze({ reviewedMetadataDigest, applicationMetadataDigest,
      applicationContractId: application.id, applicationContractDigest: application.digest }),
  }) })
}
