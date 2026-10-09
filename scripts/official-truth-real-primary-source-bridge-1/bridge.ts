import { decideOfficialTruthServerOwnedRetrieval, type OfficialTruthServerOwnedRetrievalErgebnis } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { nationalListResearchCatalog, retrieveNationalListResearchSource, verifyNationalListResearchText } from '../official-truth-integrated-pilot-1/official-source'
import { NATIONAL_LIST as N, NATIONAL_REPRESENTATION } from './manifest'
import { FIXTURE_TIME, nationalListFixture } from './fixtures'
import { digest, locateNationality, qualifyNationalList } from './qualification'
import { createGapResearch, observationAge, SYNTHETIC_SELECTION } from './research'
import { emptyReport, reportSchema, type BridgeReport } from './report'

// Test seam explicitly marked synthetic. Cannot choose URL, real network or mode.
export async function retrieveSyntheticNationalList(text = JSON.stringify(nationalListFixture())) {
  const bytes = Buffer.from(text)
  return decideOfficialTruthServerOwnedRetrieval({ sourceId: N.sourceId, url: N.requestUrl }, {
    catalog: nationalListResearchCatalog().catalog, now: () => new Date(FIXTURE_TIME),
    resolve: async () => [{ address: '93.184.216.34', family: 4 }],
    http: async ({ lookup }) => {
      await new Promise<void>((resolve, reject) => lookup('www.gov.uk', {}, error => error ? reject(error) : resolve()))
      return { ok: true, status: 200, headers: { get: key => key === 'content-type' ? 'application/json; charset=utf-8' : key === 'content-length' ? String(bytes.length) : null },
        body: (async function* () { yield bytes })() }
    },
  })
}

/** Research report construction only, not a custody verifier or acceptance API.
 * The public live command obtains its own retrieval and clock; it never accepts
 * this function's submitted historical result as a same-request capability. */
export function evaluateResearchRetrieval(retrieval: OfficialTruthServerOwnedRetrievalErgebnis,
  mode: 'live' | 'synthetic', referenceAt: string, selection: unknown): BridgeReport {
  const report = emptyReport(mode)
  report.engineering = 'EXECUTED'; report.sourceStatus = 'BLOCKED'; report.stage = 'retrieval'
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(referenceAt)
    || !Number.isFinite(Date.parse(referenceAt)) || new Date(referenceAt).toISOString() !== referenceAt) {
    report.reason = 'invalid_reference_time'; return reportSchema.parse(report)
  }
  report.referenceAt = referenceAt
  const research = createGapResearch(selection)
  if (research.ok) {
    report.research = { selection: research.selection, requestKey: research.requestKey, ruleScopeKey: research.candidate.key,
      lifecycle: research.candidate.lifecycle, validationState: research.candidate.validationState,
      evidenceQuality: 'research_gap', proposal: null, supportVersionIds: [], documentSubclassProven: false }
    report.gaps = report.gaps.filter(g => g !== 'scope_not_selected')
  }
  if (retrieval.status === 'blocked') { report.reason = retrieval.reason; return reportSchema.parse(report) }
  if (retrieval.requestUrl !== N.requestUrl || retrieval.canonicalUrl !== N.requestUrl || retrieval.contentType !== 'application/json'
    || retrieval.identitySchema !== 2 || Object.entries({ sourceId: N.sourceId, contentItemId: N.contentItemId,
      contentItemVersion: 1, representationId: NATIONAL_REPRESENTATION.representationId, representationVersion: 1,
      identityProfileId: N.profileId, identityProfileVersion: 1 }).some(([k, v]) => retrieval[k as keyof typeof retrieval] !== v)
    || retrieval.sourceContentHash !== evidenceQuellenFingerprint(retrieval.sourceSnapshot)
    || !verifyNationalListResearchText(retrieval.sourceSnapshot).ok) {
    report.stage = 'identity'; report.reason = 'content_identity_mismatch'; return reportSchema.parse(report)
  }
  const age = observationAge(retrieval.retrievedAt, referenceAt)
  if (age === 'invalid_reference_time') { report.reason = age; return reportSchema.parse(report) }
  const q = qualifyNationalList(retrieval.sourceSnapshot, mode)
  // Expected descriptor values only; opaque metadata and unqualified hashes never escape.
  report.identity = { sourceId: 'govuk', contentItemId: 'eta-national-list', contentItemVersion: 1,
    representationId: 'eta-national-list-api-en', representationVersion: 1, identityProfileId: N.profileId, identityProfileVersion: 1 }
  report.retrievedAt = retrieval.retrievedAt; report.responseBytes = Buffer.byteLength(retrieval.sourceSnapshot)
  report.redirectCount = retrieval.redirectCount; report.qualification = 'BLOCKED'
  if (!q.ok) { report.stage = q.stage; report.reason = q.reason; return reportSchema.parse(report) }
  report.qualification = 'SYNTHETIC_ONLY'; report.gaps = report.gaps.filter(g => g !== 'whole_response_privacy_unproved')
  const locator = locateNationality(q.row.details.body)
  if (!locator) { report.stage = 'observation'; report.reason = 'locator_unproved'; return reportSchema.parse(report) }
  report.observation = { kind: 'source_list_membership_observation', identity: report.identity,
    literalResponseSha256: digest(retrieval.sourceSnapshot), normalizedSourceContentHash: retrieval.sourceContentHash,
    responseBytes: report.responseBytes, retrievedAt: retrieval.retrievedAt,
    sourceAt: { firstPublishedAt: q.row.first_published_at, publicUpdatedAt: q.row.public_updated_at, updatedAt: q.row.updated_at },
    legalValidFrom: null, legalValidUntil: null, officialActionUrl: null, sourceUrl: N.publicUrl,
    representationUrl: N.requestUrl, locator, entitlement: 'UNPROVED', documentClass: 'UNPROVED' }
  report.sourceStatus = 'SYNTHETIC_OBSERVATION_ONLY'; report.stage = 'research'; report.observationQuality = age
  report.reason = age === 'stale_primary_evidence' ? age : !research.ok ? research.reason : 'legal_predicate_unproved'
  return reportSchema.parse(report)
}

export async function runOfflineFixture() {
  return evaluateResearchRetrieval(await retrieveSyntheticNationalList(), 'synthetic', FIXTURE_TIME, SYNTHETIC_SELECTION)
}
export async function runLiveOfficialSource(selection: unknown = null) {
  const retrieval = await retrieveNationalListResearchSource()
  return evaluateResearchRetrieval(retrieval, 'live', new Date().toISOString(), selection)
}
