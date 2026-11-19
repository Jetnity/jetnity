// New AT 50-passport visa method PROPOSAL only; no MA1 stage, approval,
// source-to-rule activation, grant, database write or visitor-positive path.
// Unlike the historical CH method, the Bern embassy source NEVER applies to
// other nationalities. Only BMI destination-primary and BMI general entry
// are candidate sources for ordinary national passports with exact conditions.
import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { readV3MethodRevisionDraft } from '../official-truth-product-v3/contract'
import { readMa1MethodBinding } from '../official-truth-product-v3/method/contract'

const PASSPORTS = 'IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'.split(' ')
const PASSPORT_SHA = '4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358'
const BMI_MATRIX = Object.freeze({
  sourceId: 'bmi-visa-nationality-matrix',
  officialUrl: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
  editorialVersion: '2026-11-06', originalBytes: 498415,
  originalSha256: 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',
})
const BMI_BORDER = Object.freeze({
  sourceId: 'bmi-general-entry',
  officialUrl: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
  originalBytes: 91655,
  originalSha256: 'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',
})
if (PASSPORTS.length !== 50 || new Set(PASSPORTS).size !== 50
  || PASSPORTS.slice(0, 10).join(' ') !== 'IN TR CN DE PL IT US UA RO FR'
  || !PASSPORTS.includes('CH') || !PASSPORTS.includes('XK')) {
  throw Error('at_50_method_original_priority_invalid')
}
const draft = readV3MethodRevisionDraft({
  schema: 3, method: { methodId: 'jetnity-at-priority50-visa', revision: 1 },
  predecessor: null, status: 'NOT_APPROVED', createdAt: '2026-11-19T14:30:00.000Z',
  primaryPolicy: 'one_clear_qualified_destination_primary',
  counterCheckPolicy: 'when_available',
  conflictPolicy: 'positive_method_valid_resolution',
  operatingProposal: {
    primaryMaxAgeSeconds: 86400, checkIntervalSeconds: 3600,
    optionalAttemptLimit: 1, optionalTimeBudgetMilliseconds: 10000,
    attemptPlanRevision: 1,
  },
})
if (!draft.ok) throw Error('at_priority_50_method_draft_invalid')
const packageValue = Object.freeze({
  schema: 1, kind: 'official_truth_at_priority50_unapproved_source_bound_method',
  citizenshipPriority: PASSPORTS, priorityCsvSha256: PASSPORT_SHA,
  country: 'AT', actualDocumentType: 'ordinary_national_passport',
  route: 'direct_entry', purpose: 'short_stay_tourism_only',
  bmiDestinationPrimary: BMI_MATRIX,
  bmiBorderConditions: BMI_BORDER,
  otherAuthorityForSwissOnly: 'BMEIA Bern is CH-only and never positive evidence for a non-CH passport',
  visaClassesSourceReviewed: Object.freeze({
    euSwissFreeMovement: 19, baselineVisaRequiredWithExceptions: 20,
    visaExemptSubjectToDocumentConditions: 10, austrianHomeCountry: 1,
  }),
  strictCaseRequirements: Object.freeze([
    'citizenship_matches_original_nationality',
    'ordinary_passport_class_confirmed',
    'passport_valid_and_accepted',
    'biometric_status_when_required',
    'route_and_stay_and_purpose_explicit',
    'current_residence_permit_or_schengen_visa_effect_checked',
    'eu_family_free_movement_and_bilateral_exceptions_checked',
    'airside_transit_not_silently_equated_to_direct_entry',
    'source_current_against_original_exact_editional_digest',
    'ma1_owner_aal2_approval_separate_from_research',
    'active_bg1_and_append_only_fact_history',
    'missing_or_conflicting_rule_fails_closed',
  ]),
  researchCodeXkNotIso3166: true,
  permittedVisitorClaims: 0, acceptedRules: 0,
  publicationAuthority: 'none',
})
const methodPackage = JSON.stringify(packageValue)
const binding = readMa1MethodBinding(draft.value,
  new TextEncoder().encode(methodPackage),sha256Hex(methodPackage))
if (!binding.ok) throw Error('at_priority_50_method_binding_invalid')

// The source-bound *approval* can only be performed by the protected MA1
// Owner AAL2 interface, never this module. HRS2 currently accepts CH only;
// no SQL issuer for 49 additional passports has been installed.
export const AT_50_VISA_METHOD_PROPOSAL = Object.freeze({
  status: 'DRAFT_NOT_STAGED' as const,
  destinationCountryCode: 'AT' as const,
  passportPriority: Object.freeze(PASSPORTS),
  passportPriorityCsvSha256: PASSPORT_SHA,
  method: draft.value, methodBinding: binding.value,
  primary: BMI_MATRIX, officialConditions: BMI_BORDER,
  humanReleaseScope: Object.freeze({
    citizenship: 'PRIORITY_50' as const,
    destination: 'AT' as const,
    requirement: 'visa' as const,
    document: 'national_passport' as const,
    route: 'direct_entry' as const,
    conditions: 'verified_context_only' as const,
  }),
  ownerAal2Approved: false as const,
  issuerForAll50Installed: false as const,
  acceptedFacts: 0 as const, publicationAllowed: false as const,
  originalArchiveRequired: true as const,
})
