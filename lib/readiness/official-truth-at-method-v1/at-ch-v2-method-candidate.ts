// CH→AT only: code-owned proposed V3 method revision 2.
// The source review was approved for this narrow visa statement, NOT a DB method
// or an HRS/BG1/customer publication. Old originals remain immutable Research-only.
import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { readV3MethodRevisionDraft } from '../official-truth-product-v3/contract'
import { readMa1MethodBinding } from '../official-truth-product-v3/method/contract'
import { AT_OFFICIAL_PUBLICATIONS } from '../official-truth-at-source-reader/publications'

const METHOD_ID = 'jetnity-destination-primary-at-visa' as const
const sourceEditions = Object.freeze([
  Object.freeze({ id: 'bmi-visa-nationality-matrix', bytes: 498415,
    sha256: 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',
    watchState: 'unchanged_exact' as const, edition: '2026-11-06' }),
  Object.freeze({ id: 'bmi-general-entry', bytes: 91655,
    sha256: 'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',
    watchState: 'unchanged_exact' as const, edition: null }),
  Object.freeze({ id: 'bmeia-bern-how-to-apply', bytes: 172428,
    sha256: '2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe',
    watchState: 'changed' as const, edition: null }),
])
const sourcePins = Object.freeze(AT_OFFICIAL_PUBLICATIONS.map((publication, index) => {
  const entry = sourceEditions[index]
  if (!entry || entry.id !== publication.id || entry.bytes < 1 || entry.bytes > 524288
    || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw Error('at_ch_v2_source_identity')
  return Object.freeze({ publicationId: entry.id, url: publication.url,
    originalBytes: entry.bytes, originalSha256: entry.sha256,
    observedEdition: entry.edition, watchState: entry.watchState })
}))
const proposal = readV3MethodRevisionDraft({
  schema: 3 as const,
  method: { methodId: METHOD_ID, revision: 2 },
  predecessor: { methodId: METHOD_ID, revision: 1 },
  status: 'NOT_APPROVED' as const,
  createdAt: '2026-11-22T13:00:37.083Z',
  primaryPolicy: 'one_clear_qualified_destination_primary' as const,
  counterCheckPolicy: 'when_available' as const,
  conflictPolicy: 'positive_method_valid_resolution' as const,
  operatingProposal: {
    primaryMaxAgeSeconds: 3600, checkIntervalSeconds: 3600,
    optionalAttemptLimit: 1, optionalTimeBudgetMilliseconds: 10000,
    attemptPlanRevision: 2,
  },
})
if (!proposal.ok) throw Error('at_ch_v2_method_draft_invalid')
const packageText = JSON.stringify({
  schema: 1, kind: 'jetnity_at_ch_v2_source_method_unapproved_candidate',
  destination: 'AT', citizenship: 'CH', requirement: 'visa',
  document: 'ordinary_valid_swiss_passport', route: 'direct_entry',
  effect: 'no_visa_required', sourcePins, draft: proposal.value,
  bmeiaFullBodyWatchResult: 'changed',
  bmeiaReviewedDifference: 'rule_neutral_only_in_this_scope',
  immutableOriginals: true,
  forbidden: ['other_passports', 'other_topics', 'transit', 'outdated_source',
    'method_revision_1_reuse', 'unqualified_source_publication'],
  assertion: 'NOT_STAGED_NOT_APPROVED_NOT_INSTALLED_NOT_PUBLISHED',
})
const binding = readMa1MethodBinding(proposal.value,
  new TextEncoder().encode(packageText), sha256Hex(packageText))
if (!binding.ok) throw Error('at_ch_v2_method_binding_invalid')

/** Shape-only selection. Does NOT establish a source, owner or method receipt. */
export function atChV2ScopeMatches(value: Readonly<{
  citizenshipCountryCode: string; destinationCountryCode: string;
  requirementType: string; documentType: string; route: string;
}>): boolean {
  return value.citizenshipCountryCode === 'CH'
    && value.destinationCountryCode === 'AT'
    && value.requirementType === 'visa'
    && value.documentType === 'passport'
    && value.route === 'direct_entry'
}

export const AT_CH_METHOD_V2_CANDIDATE = Object.freeze({
  status: 'DRAFT_NOT_STAGED' as const,
  sourceQualificationWritten: false as const,
  ownerMethodStaged: false as const,
  ownerMethodApproved: false as const,
  bg1ProtectedSuccessorInstalled: false as const,
  publisherRebound: false as const,
  positiveCustomerFacts: 0 as const,
  sourcePins, method: proposal.value, binding: binding.value,
  sourceDecisionScope: 'CH citizen with valid Swiss passport, direct entry to AT, visa only' as const,
  bmeiaOriginalWatchState: 'changed' as const,
})
