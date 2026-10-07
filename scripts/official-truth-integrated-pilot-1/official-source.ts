// Opt-in fixed GOV.UK passport representation; no shipped registration or body publication.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { quellenKatalogSnapshotAntwort, type OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import { retrieveOfficialTruthIsolatedPilotSource } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { immutable, ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { PASSPORT_GUIDE, PASSPORT_IDENTITY_PROFILE, qualifyPassportWholeResponse, extractQualifiedPassportObservation } from './official-source-profile'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const evidencePath = resolve(root, 'docs/evidence/official-truth-integrated-pilot-1/official-source.json')
function passportCatalog(): OfficialTruthSourceCatalogTransport {
  const authority = quellenRegistryErstellen([{ sourceId: 'govuk', sourceClass: 'official_authority',
    publisherName: 'GOV.UK', authorityName: 'UK Government', domains: ['www.gov.uk'] }])
  if (!authority.ok) throw Error('local_manifest_invalid')
  const graph = createContentIdentityGraph(authority.registry, [{ sourceId: PASSPORT_GUIDE.sourceId, contentItemId: PASSPORT_GUIDE.contentItemId,
    contentItemVersion: 1, current: true, externalIdNamespace: 'govuk-content-id', externalContentId: PASSPORT_GUIDE.contentId,
    expectedPublisherIds: [PASSPORT_GUIDE.publisherId], expectedAuthorityIds: PASSPORT_GUIDE.authorityIds }],
  [{ sourceId: PASSPORT_GUIDE.sourceId, contentItemId: PASSPORT_GUIDE.contentItemId, contentItemVersion: 1,
    representationId: 'passport-guide-api-en', representationVersion: 1, current: true,
    requestUrls: [PASSPORT_GUIDE.requestUrl, PASSPORT_GUIDE.finalUrl], expectedFinalUrl: PASSPORT_GUIDE.finalUrl,
    expectedMediaType: 'application/json', identityProfileId: PASSPORT_GUIDE.profileId, identityProfileVersion: 1,
    expectedLocale: 'en', expectedSchema: 'guide' }], [PASSPORT_IDENTITY_PROFILE])
  if (!graph.ok) throw Error('local_manifest_invalid')
  const snapshot = quellenKatalogSnapshotAntwort({ ...authority.registry, contentIdentity: graph.value })
  if (!snapshot) throw Error('local_manifest_invalid')
  return Object.freeze({ async aufrufen(input: unknown) {
    const request = ownRecord(input, ['operation'])
    return request?.operation === 'read_registry' ? { ok: true as const, antwort: snapshot } : { ok: false as const }
  } })
}

export async function runOfficialSourceQualification() {
  const startedAt = new Date().toISOString()
  const retrieval = await retrieveOfficialTruthIsolatedPilotSource({ sourceId: 'govuk', url: PASSPORT_GUIDE.requestUrl },
    { transport: passportCatalog(), identityProfiles: [PASSPORT_IDENTITY_PROFILE] })
  const qualification = retrieval.status === 'server_owned_official_retrieval' ? qualifyPassportWholeResponse(retrieval.sourceSnapshot) : null
  const fact = qualification?.ok ? extractQualifiedPassportObservation(qualification.observation) : null
  const completedAt = new Date().toISOString()
  // No source hash/body, publishing identifier or historical bundle is emitted before full qualification.
  const reason = retrieval.status === 'blocked' ? retrieval.reason : !qualification?.ok ? qualification?.reason ?? 'whole_response_unqualified'
    : !fact ? 'passport_semantics_unrecognized' : 'real_origin_receipt_roundtrip_not_verified'
  const result = immutable({ schema: 'official-truth-integrated-pilot-real-source-report-v2', realOfficialSourcePilot: 'BLOCKED' as const,
    startedAt, completedAt, researchedFamilyCount: 1, family: 'GOV.UK / UK Government',
    selectedCase: { citizenship: 'CH', documentClass: 'ordinary_passport', destination: 'GB', purpose: 'narrow_passport_validity_only',
      proposedSemanticTarget: 'valid_through_stay', selectedUrl: PASSPORT_GUIDE.publicUrl,
      requestUrl: PASSPORT_GUIDE.requestUrl, expectedFinalUrl: PASSPORT_GUIDE.finalUrl,
      scopeLimitation: 'one passport-validity dimension; no complete ETA/visa/admission claim' },
    selectedBoundaryAttempt: { status: retrieval.status === 'blocked' ? 'BLOCKED' : 'IDENTITY_VERIFIED', reason,
      actualNetworkAttempt: retrieval.status !== 'blocked' || ['http_failed', 'response_too_large', 'invalid_utf8', 'empty_body', 'content_type_mismatch', 'content_identity_mismatch', 'redirect_rejected', 'redirect_limit', 'representation_url_mismatch'].includes(retrieval.reason), retrievalCompletedAt: retrieval.status === 'blocked' ? null : retrieval.retrievedAt,
      redirectCount: retrieval.status === 'blocked' ? null : retrieval.redirectCount,
      profile: PASSPORT_GUIDE.profileId, sourceProfileImplemented: true, nationalListProfileUsed: false,
      sourceProfileQualified: retrieval.status !== 'blocked', deterministicExtractionImplemented: true,
      deterministicExtractionExecuted: qualification?.ok === true, sourceSemanticsQualified: fact !== null },
    chain: { identity: retrieval.status === 'blocked' ? 'BLOCKED' : 'VERIFIED',
      wholeResponsePrivacyQualification: qualification?.ok ? 'VERIFIED' : 'BLOCKED',
      originalObservationOrigin: 'NOT_ISSUED', validityOrigin: 'NOT_ISSUED', evidenceAcceptedOrigin: 'NOT_ISSUED',
      extraction: fact ? 'QUALIFIED_DIMENSION_ONLY' : 'NOT_RUN', custodyBundle: 'NOT_PUBLISHED', postgresRoundtrip: 'NOT_RUN' },
    blockers: [reason],
    qualificationContract: { kind: 'closed_reviewed_public_components_and_null_opaque_metadata',
      unknownUnusedFields: 'reject', changedPublicComponents: 'require_fresh_review',
      opaquePublishingMetadata: 'reject_without_copying_or_publishing_value',
      deletingFieldsToQualify: false, metadataRefusalIsGovernmentAccessBlock: false },
    controls: { network: 'same_server_owned_dns_https_redirect_body_utf8_identity_path', arbitraryUrlInput: false,
      credentials: false, cookieOrChallengeBypass: false, rawSourceBodyPublished: false, unqualifiedSourceHashPublished: false,
      hostedDevelopmentApply: false, productionActivation: false, evidenceOrRuleWrite: false, f8: 'CLOSED' },
    researchSources: [{ title: 'Entering the UK: Before you leave for the UK', url: PASSPORT_GUIDE.publicUrl },
      { title: 'Official Content API guide representation', url: PASSPORT_GUIDE.finalUrl }],
  })
  mkdirSync(dirname(evidencePath), { recursive: true }); writeFileSync(evidencePath, JSON.stringify(result, null, 2) + '\n')
  return result
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== '--run-official-source') throw Error('explicit_fixed_official_source_opt_in_required')
  runOfficialSourceQualification().then(result => process.stdout.write(JSON.stringify(result, null, 2) + '\n')).catch(() => {
    process.stderr.write('official_source_runner_failed\n'); process.exitCode = 1
  })
}
