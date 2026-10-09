import { z } from 'zod'
import { NATIONAL_LIST as N } from './manifest'
import { selectionSchema } from './research'
import { WHOLE_RESPONSE_CONTRACT } from './whole-response'

export const reasonSchema = z.enum(['not_run', 'invalid_arguments', 'runner_failed', 'invalid_reference_time',
  'scope_not_selected', 'invalid_scope_selection', 'canonical_research_refused', 'legal_predicate_unproved',
  'opaque_publishing_metadata', 'whole_response_review_not_established', 'unreviewed_public_component',
  'unexpected_response_fields', 'invalid_response_field', 'source_time_conflict',
  'unreviewed_attachment', 'unreviewed_scheduling', 'unreviewed_withdrawal', 'unsafe_source_fragment',
  'identity_mismatch', 'invalid_response', 'locator_unproved', 'stale_primary_evidence',
  'content_not_eligible', 'identity_profile_unavailable', 'content_identity_mismatch', 'representation_url_mismatch',
  'content_type_mismatch', 'invalid_url', 'insecure_scheme', 'credentials', 'unregistered_domain', 'blocked_domain',
  'caller_authority_forbidden', 'sensitive_personal_field', 'unexpected_fields', 'invalid_request',
  'catalog_not_configured', 'catalog_failed', 'tracking_parameter', 'url_source_mismatch', 'redirect_source_mismatch',
  'source_not_official_authority', 'address_not_permitted', 'non_default_port', 'dns_failed', 'dns_empty',
  'redirect_rejected', 'redirect_loop', 'redirect_limit', 'http_status', 'http_failed', 'response_too_large',
  'invalid_utf8', 'empty_body', 'timeout', 'invalid_retrieval_time', 'invalid_source_snapshot'])
export type BridgeReason = z.infer<typeof reasonSchema>
const utc = z.string().datetime({ offset: false })
const hash = z.string().regex(/^[a-f0-9]{64}$/)
const identity = z.object({ sourceId: z.literal('govuk'), contentItemId: z.literal('eta-national-list'),
  contentItemVersion: z.literal(1), representationId: z.literal('eta-national-list-api-en'), representationVersion: z.literal(1),
  identityProfileId: z.literal(N.profileId), identityProfileVersion: z.literal(1) }).strict()
const observation = z.object({ kind: z.literal('source_list_membership_observation'),
  identity, literalResponseSha256: hash, normalizedSourceContentHash: hash,
  responseBytes: z.number().int().min(1).max(65_536), retrievedAt: utc,
  sourceAt: z.object({ firstPublishedAt: utc, publicUpdatedAt: utc, updatedAt: utc }).strict(),
  legalValidFrom: z.null(), legalValidUntil: z.null(), officialActionUrl: z.null(),
  sourceUrl: z.literal(N.publicUrl), representationUrl: z.literal(N.requestUrl),
  locator: z.object({ pointer: z.literal('/details/body'), list: z.number().int().positive(), item: z.number().int().positive(),
    start: z.number().int().nonnegative(), end: z.number().int().positive(), byteStart: z.number().int().nonnegative(),
    byteEnd: z.number().int().positive(), quote: z.literal('Switzerland') }).strict(),
  entitlement: z.literal('UNPROVED'), documentClass: z.literal('UNPROVED'),
}).strict()
export const reportSchema = z.object({ schema: z.literal('official-truth-real-primary-source-bridge-1-v2'),
  wholeResponseContract: z.literal(WHOLE_RESPONSE_CONTRACT),
  mode: z.enum(['not_run', 'live', 'synthetic']), engineering: z.enum(['EXECUTED', 'NOT_RUN', 'FAILED']),
  sourceStatus: z.enum(['NOT_RUN', 'BLOCKED', 'SYNTHETIC_OBSERVATION_ONLY']), regulatoryStatus: z.literal('BLOCKED'),
  stage: z.enum(['invocation', 'retrieval', 'identity', 'qualification', 'observation', 'research']), reason: reasonSchema,
  referenceAt: utc.nullable(), requestUrl: z.literal(N.requestUrl), publicUrl: z.literal(N.publicUrl),
  identity: identity.nullable(), retrievedAt: utc.nullable(), responseBytes: z.number().int().min(1).max(65_536).nullable(),
  redirectCount: z.number().int().nonnegative().max(5).nullable(),
  qualification: z.enum(['NOT_RUN', 'BLOCKED', 'SYNTHETIC_ONLY']), observation: observation.nullable(),
  research: z.object({ selection: selectionSchema, requestKey: z.string().regex(/^research-request:v1:[a-f0-9]{64}$/),
    ruleScopeKey: z.string().regex(/^rule-scope:v1:[a-f0-9]{64}$/), lifecycle: z.literal('candidate'), validationState: z.literal('pending'),
    evidenceQuality: z.literal('research_gap'), proposal: z.null(), supportVersionIds: z.tuple([]),
    documentSubclassProven: z.literal(false) }).strict().nullable(),
  observationQuality: z.enum(['research_gap', 'stale_primary_evidence']).nullable(),
  gaps: z.array(z.enum(['whole_response_privacy_unproved', 'legal_effect_unproved', 'travel_effective_period_unproved',
    'appendix_exceptions_unexamined', 'ordinary_passport_predicate_unproved', 'scope_not_selected',
    'official_action_unproved', 'custody_authority_unavailable'])).max(8),
  conflictAssessment: z.literal('NOT_ASSESSED_SINGLE_SOURCE'),
  provenanceAuthority: z.literal('NO_CUSTODY_OR_ACCEPTANCE_ORIGIN'),
  previousRealOfficialSourcePilot: z.literal('BLOCKED'),
  controls: z.object({ hostedWrites: z.literal(0), acceptedEvidence: z.literal(0), acceptedRules: z.literal(0),
    f8: z.literal(false), productionChanges: z.literal(false), rawBodyPublished: z.literal(false),
    opaqueMetadataPublished: z.literal(false), shippedRegistration: z.literal(false) }).strict(),
}).strict()
export type BridgeReport = z.infer<typeof reportSchema>
export function emptyReport(mode: BridgeReport['mode'] = 'not_run'): BridgeReport {
  return { schema: 'official-truth-real-primary-source-bridge-1-v2', wholeResponseContract: WHOLE_RESPONSE_CONTRACT,
    mode, engineering: 'NOT_RUN', sourceStatus: 'NOT_RUN',
    regulatoryStatus: 'BLOCKED', stage: 'invocation', reason: 'not_run', referenceAt: null, requestUrl: N.requestUrl,
    publicUrl: N.publicUrl, identity: null, retrievedAt: null, responseBytes: null, redirectCount: null,
    qualification: 'NOT_RUN', observation: null, research: null, observationQuality: null,
    gaps: ['whole_response_privacy_unproved', 'legal_effect_unproved', 'travel_effective_period_unproved',
      'appendix_exceptions_unexamined', 'ordinary_passport_predicate_unproved', 'scope_not_selected',
      'official_action_unproved', 'custody_authority_unavailable'], conflictAssessment: 'NOT_ASSESSED_SINGLE_SOURCE',
    provenanceAuthority: 'NO_CUSTODY_OR_ACCEPTANCE_ORIGIN', previousRealOfficialSourcePilot: 'BLOCKED',
    controls: { hostedWrites: 0, acceptedEvidence: 0, acceptedRules: 0, f8: false,
      productionChanges: false, rawBodyPublished: false, opaqueMetadataPublished: false, shippedRegistration: false } }
}
export function serializeReport(report: BridgeReport): string {
  const r = reportSchema.parse(report)
  if ((r.observation !== null && (r.mode !== 'synthetic' || r.qualification !== 'SYNTHETIC_ONLY' || r.sourceStatus !== 'SYNTHETIC_OBSERVATION_ONLY'))
    || (r.research !== null && (r.mode !== 'synthetic' || r.qualification !== 'SYNTHETIC_ONLY' || r.observation === null || r.sourceStatus !== 'SYNTHETIC_OBSERVATION_ONLY' || r.stage !== 'research'))
    || (r.mode === 'live' && (r.observation !== null || r.research !== null || r.qualification === 'SYNTHETIC_ONLY'))
    || (r.sourceStatus === 'SYNTHETIC_OBSERVATION_ONLY' && r.observation === null)
    || (r.engineering === 'NOT_RUN' && r.sourceStatus !== 'NOT_RUN')) throw Error('report_state_invalid')
  return JSON.stringify(r, null, 2) + '\n'
}
