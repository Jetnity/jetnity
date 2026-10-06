// Opt-in, fixed-URL, credentialless official-source qualification attempt.
// The local manifest is NOT a hosted source/profile/extractor registration.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { quellenKatalogSnapshotAntwort, type OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import { loadOfficialTruthServerOwnedRetrievalWithCatalogTransport } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { immutable, ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const evidencePath = resolve(root, 'docs/evidence/official-truth-integrated-pilot-1/official-source.json')
const family = 'GOV.UK / UK Government / Home Office'
const passportUrl = 'https://www.gov.uk/uk-border-control/before-you-leave-for-the-uk'
const swissGuidanceUrl = 'https://www.gov.uk/guidance/visiting-the-uk-as-an-eu-eea-or-swiss-citizen'
const nationalListUrl = 'https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list'
const homeOffice = '06056197-bc69-4147-aa28-070bca132178'

/** Exact known identity-only manifest copied from the independently accepted #821/#826
 * descriptor contract, reconstructed locally. No hosted catalog is read or changed. */
function localNationalListTransport(): OfficialTruthSourceCatalogTransport {
  const authority = quellenRegistryErstellen([{ sourceId: 'govuk', sourceClass: 'official_authority',
    publisherName: 'GOV.UK', authorityName: 'UK Government', domains: ['www.gov.uk'] }])
  if (!authority.ok) throw Error('local_manifest_invalid')
  const graph = createContentIdentityGraph(authority.registry, [{ sourceId: 'govuk', contentItemId: 'eta-national-list',
    contentItemVersion: 1, current: true, externalIdNamespace: 'govuk-content-id',
    externalContentId: '2b25b3d4-4eaa-4859-a34e-c7869c114c15', expectedPublisherIds: [homeOffice], expectedAuthorityIds: [homeOffice] }],
  [{ sourceId: 'govuk', contentItemId: 'eta-national-list', contentItemVersion: 1, representationId: 'content-api-en',
    representationVersion: 1, current: true, requestUrls: [nationalListUrl], expectedFinalUrl: nationalListUrl,
    expectedMediaType: 'application/json', identityProfileId: 'govuk-eta-national-list-content-api-en', identityProfileVersion: 1,
    expectedLocale: 'en', expectedSchema: 'manual_section' }])
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
  const transport = localNationalListTransport()
  // The selected passport URL has no qualified registered representation/profile.
  // Running the real boundary records its honest pre-network refusal; it is not
  // silently mapped onto the unrelated National List profile.
  const selected = await loadOfficialTruthServerOwnedRetrievalWithCatalogTransport({ sourceId: 'govuk', url: passportUrl }, transport)
  // One same-family identity-only control executes the actual code-owned HTTPS,
  // DNS/SSRF, redirects, bounded UTF-8, MIME and exact GOV.UK identity verifier.
  const controlStartedAt = new Date().toISOString()
  const control = await loadOfficialTruthServerOwnedRetrievalWithCatalogTransport({ sourceId: 'govuk', url: nationalListUrl }, transport)
  const completedAt = new Date().toISOString()
  const controlIdentityVerified = control.status === 'server_owned_official_retrieval'
  // Never publish body/hash before whole-response non-personal qualification.
  // The existing identity profile permits opaque legal body/unused fields; it
  // does not supply that stronger qualification, and no full-response hash is
  // admitted to autonomous-origin custody here.
  const result = immutable({
    schema: 'official-truth-integrated-pilot-real-source-report-v1', realOfficialSourcePilot: 'BLOCKED',
    startedAt, completedAt, researchedFamilyCount: 1, family,
    selectedCase: { citizenship: 'CH', documentClass: 'ordinary_passport', destination: 'GB',
      purpose: 'narrow_passport_validity_only', proposedSemanticTarget: 'valid_through_stay',
      selectedUrl: passportUrl, corroboratingUrl: swissGuidanceUrl,
      researchStatus: 'prior_official_public_guidance_read', researchDateUTC: '2026-10-06',
      researchSummary: 'The Swiss citizen section describes document validity covering the stay; route and document exceptions must remain explicit. This research text is not a trusted extracted fact.' },
    selectedBoundaryAttempt: { url: passportUrl, status: selected.status === 'blocked' ? 'BLOCKED' : 'IDENTITY_ONLY',
      reason: selected.status === 'blocked' ? selected.reason : 'whole_response_qualification_unavailable',
      sourceProfileQualified: false, deterministicExtractionExecuted: false },
    identityOnlyControl: { url: nationalListUrl, startedAt: controlStartedAt, completedAt,
      status: controlIdentityVerified ? 'IDENTITY_VERIFIED_ONLY' : 'BLOCKED',
      reason: control.status === 'blocked' ? control.reason : 'whole_response_qualification_unavailable',
      retrievalCompletedAt: controlIdentityVerified ? control.retrievedAt : null,
      exactContentIdentityVerified: controlIdentityVerified,
      role: 'same_family_existing_identity_profile_control_not_the_passport_rule' },
    chain: { wholeResponsePrivacyQualification: 'BLOCKED', originalObservationOrigin: 'NOT_ISSUED',
      validityOrigin: 'NOT_ISSUED', evidenceAcceptedOrigin: 'NOT_ISSUED', extraction: 'NOT_RUN',
      custodyBundle: 'NOT_PUBLISHED', postgresRoundtrip: 'NOT_RUN' },
    blockers: ['passport_representation_identity_profile_unavailable', 'source_specific_whole_response_qualification_unavailable',
      'passport_rule_extractor_unavailable', 'national_list_alone_does_not_prove_complete_eta_eligibility'],
    controls: { network: 'existing_server_owned_dns_https_redirect_body_utf8_identity_path',
      arbitraryUrlInput: false, credentials: false, cookieOrChallengeBypass: false,
      rawSourceBodyPublished: false, unqualifiedSourceHashPublished: false,
      hostedDevelopmentApply: false, productionActivation: false, evidenceOrRuleWrite: false, f8: 'CLOSED' },
    researchSources: [{ title: 'Entering the UK: Before you leave for the UK', url: passportUrl },
      { title: 'Visiting the UK as an EU, EEA or Swiss citizen', url: swissGuidanceUrl }],
    priorEvidence: ['docs/OFFICIAL_TRUTH_GOVUK_DEVELOPMENT_REGISTRATION_RECEIPT_1_2026-10-04.md',
      'docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_2026-10-05.md'],
  })
  mkdirSync(dirname(evidencePath), { recursive: true })
  writeFileSync(evidencePath, JSON.stringify(result, null, 2) + '\n')
  return result
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== '--run-official-source') throw Error('explicit_fixed_official_source_opt_in_required')
  runOfficialSourceQualification().then(result => process.stdout.write(JSON.stringify(result, null, 2) + '\n')).catch(() => {
    process.stderr.write('official_source_runner_failed\n'); process.exitCode = 1
  })
}
