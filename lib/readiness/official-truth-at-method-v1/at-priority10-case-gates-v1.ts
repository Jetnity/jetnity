// AT top-10 standard-passport REVIEW boundary, never a visitor visa, passport
// validation, method approval, database issuer or source-freshness service.
// All boolean evidence must be established by a separate trusted process, NOT
// inferred from nationality, stored user data, assistant guesses or a click.
// Rare/special cases are rejected per case without blocking other priorities.
import {AT_PRIORITY10_VISA_PASSPORT_REVIEW,type AtPriority10Passport} from './at-priority10-visa-passport-plan-v1'

export type Top10ScopeEvidence=Readonly<{
 passportCode:string
 actualOrdinaryNationalPassportProved:boolean
 // For the five EU freedom-of-movement cases only: a presented national ID
 // card is distinct from a passport. All three Article-5 assessments must
 // come from an independently trusted exact-document review, never a guess.
 actualEuNationalIdentityCardProved?:boolean
 actualEuIdIssuerMatchesNationalityProved?:boolean
 actualEuIdNotExpiredAtEntryProved?:boolean
 actualEuIdArticle5TravelValidityProved?:boolean
 nationalityAndPresentedDocumentMatch:boolean
 actualDocumentValidForEntry:boolean
 shortStayTourismAndDirectBorderEntryProved:boolean
 actualResidenceOrFamilyVisaExemptionExcluded:boolean
 specialDiplomaticServiceOrDualPassportExcluded:boolean
 actualSchengenStayWithin90In180:boolean|null
 biometricOrdinaryPassportProved:boolean|null
 passportIssueWithin10Years:boolean|null
 passportExpiryAtLeast3MonthsAfterExit:boolean|null
 bmiOriginalSha256Verified:boolean
 bmiEntryOriginalSha256Verified:boolean
 originalObservedFreshWithinPolicy:boolean
 independentlySealedDestinationSpecificWitness:boolean
 bg1Current:boolean
}>
export type Top10ReviewOutcome=Readonly<{
 code:string;status:'derzeit nicht verfügbar';
 sourceClass:string|null
 cause:
  'UNKNOWN_PASSPORT'|'OFFICIAL_SOURCE_OR_BG1_MISSING'|'DESTINATION_WITNESS_UNSEALED'|
  'SPECIAL_DOCUMENT_OR_EXCEPTION_NEEDS_INDIVIDUAL_REVIEW'|
  'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN'|
  'CONDITIONAL_STANDARD_CASE_NEEDS_HRS2_MA1_OWNER'
 canStagePositiveFact:false
 visitorVisaStatement:null
 visitorPassportValidStatement:null
 ownerAal2Approved:false
 publicationAllowed:false
}>

const CASES=new Map(AT_PRIORITY10_VISA_PASSPORT_REVIEW.map(r=>[r.country,r]))
const unconfirmed=(code:string,cause:Top10ReviewOutcome['cause'],sourceClass:string|null):Top10ReviewOutcome=>
 Object.freeze({code,status:'derzeit nicht verfügbar' as const,sourceClass,cause,
 canStagePositiveFact:false as const,visitorVisaStatement:null,visitorPassportValidStatement:null,
 ownerAal2Approved:false as const,publicationAllowed:false as const})

/** An *independently authorized* case-level source-to-rule issuer is still
 * required, because Dev HRS2 currently accepts CH only and the BMEIA Bern
 * CH-only observation has changed. A pair of unchanged BMI HTTP reads is
 * evidence for a baseline, never a fake equivalent to an audited seal. */
export function reviewAtPriority10StandardCase(e:Top10ScopeEvidence):Top10ReviewOutcome{
 const item=CASES.get(e.passportCode as AtPriority10Passport)
 if(!item)return unconfirmed(e.passportCode,'UNKNOWN_PASSPORT',null)
 if(!e.bg1Current||!e.bmiOriginalSha256Verified||!e.bmiEntryOriginalSha256Verified
   ||!e.originalObservedFreshWithinPolicy)
  return unconfirmed(e.passportCode,'OFFICIAL_SOURCE_OR_BG1_MISSING',item.baselineVisaRule)
 if(!e.independentlySealedDestinationSpecificWitness)
  return unconfirmed(e.passportCode,'DESTINATION_WITNESS_UNSEALED',item.baselineVisaRule)
 // No automated selection between two documents or citizenships. A verified
 // EU national ID is eligible for the five EU cases only when its own issuer,
 // expiry and Art. 5 (including any applicable grandfather exception) were
 // independently proved. This does NOT classify EU IDs as ordinary passports.
 const euIdPresented=e.actualEuNationalIdentityCardProved===true
 if(!e.specialDiplomaticServiceOrDualPassportExcluded
   ||!e.actualResidenceOrFamilyVisaExemptionExcluded
   ||(!item.euFreeMovement&&!e.actualOrdinaryNationalPassportProved)
   ||(!item.euFreeMovement&&euIdPresented))
  return unconfirmed(e.passportCode,'SPECIAL_DOCUMENT_OR_EXCEPTION_NEEDS_INDIVIDUAL_REVIEW',item.baselineVisaRule)
 const ordinaryPassportOnly=e.actualOrdinaryNationalPassportProved===true&&!euIdPresented
 const provedEuIdOnly=item.euFreeMovement&&e.actualOrdinaryNationalPassportProved!==true
   &&euIdPresented&&e.actualEuIdIssuerMatchesNationalityProved===true
   &&e.actualEuIdNotExpiredAtEntryProved===true
   &&e.actualEuIdArticle5TravelValidityProved===true
 if(!(ordinaryPassportOnly||provedEuIdOnly)
   ||!e.nationalityAndPresentedDocumentMatch||!e.actualDocumentValidForEntry
   ||!e.shortStayTourismAndDirectBorderEntryProved)
  return unconfirmed(e.passportCode,'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN',item.baselineVisaRule)
 if(!item.euFreeMovement){
  if(e.actualSchengenStayWithin90In180!==true
    ||e.passportIssueWithin10Years!==true
    ||e.passportExpiryAtLeast3MonthsAfterExit!==true
    ||(item.biometricOrdinaryPassportRequiredForWaiver&&e.biometricOrdinaryPassportProved!==true))
   return unconfirmed(e.passportCode,'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN',item.baselineVisaRule)
 }
 return unconfirmed(e.passportCode,'CONDITIONAL_STANDARD_CASE_NEEDS_HRS2_MA1_OWNER',item.baselineVisaRule)
}
