// AT-only, code-owned V3 method candidate. This is neither Owner approval nor
// an HRS issuer/guard extension; source bytes stay fully bound and quarantined.
import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { readV3MethodRevisionDraft } from '../official-truth-product-v3/contract'
import { readMa1MethodBinding } from '../official-truth-product-v3/method/contract'
import { HRS1_LIMITS } from '../official-truth-product-v3/result/contract'
import { AT_OFFICIAL_PUBLICATIONS } from '../official-truth-at-source-reader/publications'

const METHOD_ID = 'jetnity-destination-primary-at-visa'
const observed = Object.freeze([
  Object.freeze({ id: 'bmi-visa-nationality-matrix', bytes: 498415,
    sha256: 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',
    edition: '2026-11-06' }),
  Object.freeze({ id: 'bmi-general-entry', bytes: 91655,
    sha256: 'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',
    edition: null }),
  Object.freeze({ id: 'bmeia-bern-how-to-apply', bytes: 172460,
    sha256: '7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18',
    edition: null }),
])
// AT's exact whole-source requirement is distinct from the unchanged DE/CH
// HRS1 limit. This is a proposal bound, NOT a new HRS1 original entitlement.
const AT_PROPOSED_ORIGINAL_LIMIT = 524288
const sourcePins = Object.freeze(AT_OFFICIAL_PUBLICATIONS.map((publication, index) => {
  const match = observed[index]
  if (!match || match.id !== publication.id || match.bytes > AT_PROPOSED_ORIGINAL_LIMIT
    || !/^[a-f0-9]{64}$/.test(match.sha256)) throw Error('at_source_pin_invalid')
  return Object.freeze({ publicationId: match.id, url: publication.url,
    originalBytes: match.bytes, originalSha256: match.sha256, observedEdition: match.edition })
}))
const draftInput = Object.freeze({
  schema: 3 as const, method: Object.freeze({ methodId: METHOD_ID, revision: 1 }),
  predecessor: null, status: 'NOT_APPROVED' as const, createdAt: '2026-11-16T20:01:07.324Z',
  primaryPolicy: 'one_clear_qualified_destination_primary' as const,
  counterCheckPolicy: 'when_available' as const,
  conflictPolicy: 'positive_method_valid_resolution' as const,
  operatingProposal: Object.freeze({ primaryMaxAgeSeconds: 86400,
    checkIntervalSeconds: 3600, optionalAttemptLimit: 1,
    optionalTimeBudgetMilliseconds: 10000, attemptPlanRevision: 1 }),
})
const parsed = readV3MethodRevisionDraft(draftInput)
if (!parsed.ok) throw Error('at_v3_method_draft_invalid')
// A proposal package is code-only, and carries no impersonated approval receipt.
const packageText = JSON.stringify({
  kind: 'jetnity_unapproved_at_v3_method_candidate', schema: 1,
  method: parsed.value.method, draft: parsed.value, destinations: ['AT'],
  passportPriority: 'exact_private_50_required',
  travelerQualification: 'normal_passport_direct_short_stay_visa_only',
  refused: ['unverified_document','special_passport','airside_transit','residence_permit',
    'unqualified_territory','inconsistent_source','missing_edition','unknown_visa_condition'],
  fullOriginals: sourcePins,
  unchangedHrs1MaxBytes: HRS1_LIMITS.originalBytes,
  proposedAtSpecificOriginalMaxBytes: AT_PROPOSED_ORIGINAL_LIMIT,
  statement: 'DRAFT_NOT_STAGED_NOT_APPROVED_NO_POSITIVE_IMPORT',
})
const methodBinding = readMa1MethodBinding(parsed.value,
  new TextEncoder().encode(packageText), sha256Hex(packageText))
if (!methodBinding.ok) throw Error('at_v3_method_package_invalid')

/** No callable source issuer/SQL route is exported. Method/Dev/owner and BG1
 * must still accept a future native AT protocol before any customer rule. */
export const AT_V3_METHOD_PREPARATION = Object.freeze({
  status: 'DRAFT_NOT_STAGED' as const, publicationAuthority: 'none' as const,
  acceptedFacts: 0 as const, importable: false as const,
  destinationCountryCode: 'AT' as const,
  ordinaryPassports: 'private_priority_file_required' as const,
  originalBytes: HRS1_LIMITS.originalBytes,
  proposedAtOnlyMaximumBytes: AT_PROPOSED_ORIGINAL_LIMIT,
  sourcePins, method: parsed.value, binding: methodBinding.value,
  nativeHrsQualified: false as const, ownerMethodApproved: false as const,
  backgroundGuardBound: false as const, devVisitorReadback: false as const,
})
