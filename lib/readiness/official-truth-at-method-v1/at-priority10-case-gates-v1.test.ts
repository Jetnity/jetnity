import assert from 'node:assert/strict'
import {test} from 'node:test'
import {reviewAtPriority10StandardCase,type Top10ScopeEvidence} from './at-priority10-case-gates-v1'
const top10=['IN','TR','CN','DE','PL','IT','US','UA','RO','FR']
function evidence(code:string):Top10ScopeEvidence{
 return Object.freeze({
  passportCode:code,actualOrdinaryNationalPassportProved:true,
  nationalityAndPresentedDocumentMatch:true,actualDocumentValidForEntry:true,
  shortStayTourismAndDirectBorderEntryProved:true,actualResidenceOrFamilyVisaExemptionExcluded:true,
  specialDiplomaticServiceOrDualPassportExcluded:true,
  actualSchengenStayWithin90In180:true,biometricOrdinaryPassportProved:true,
  passportIssueWithin10Years:true,passportExpiryAtLeast3MonthsAfterExit:true,
  bmiOriginalSha256Verified:true,bmiEntryOriginalSha256Verified:true,
  originalObservedFreshWithinPolicy:true,independentlySealedDestinationSpecificWitness:true,
  bg1Current:true,
 })
}
test('No per-case review, even one with entirely positive self-contained conditions, can mint a visa, passport acceptance or Owner approval',()=>{
 for(const code of top10){
  const result=reviewAtPriority10StandardCase(evidence(code))
  assert.equal(result.cause,'CONDITIONAL_STANDARD_CASE_NEEDS_HRS2_MA1_OWNER')
  assert.equal(result.status,'derzeit nicht verfügbar')
  assert.equal(result.visitorVisaStatement,null)
  assert.equal(result.visitorPassportValidStatement,null)
  assert.equal(result.canStagePositiveFact,false)
  assert.equal(result.ownerAal2Approved,false)
  assert.equal(result.publicationAllowed,false)
 }
 assert.equal(reviewAtPriority10StandardCase(evidence('AQ')).cause,'UNKNOWN_PASSPORT')
})
test('Two unchanged BMI witnesses are NOT an independently sealed legal-revision source; CH-only Bern receipt cannot be silently bypassed',()=>{
 for(const code of top10){
  const result=reviewAtPriority10StandardCase({...evidence(code),independentlySealedDestinationSpecificWitness:false})
  assert.equal(result.cause,'DESTINATION_WITNESS_UNSEALED')
  assert.equal(result.publicationAllowed,false)
 }
 for(const evidenceField of ['bmiOriginalSha256Verified','bmiEntryOriginalSha256Verified','originalObservedFreshWithinPolicy','bg1Current'] as const)
  assert.equal(reviewAtPriority10StandardCase({...evidence('DE'),[evidenceField]:false}).cause,'OFFICIAL_SOURCE_OR_BG1_MISSING')
})
test('Rare diplomatic/residence or dual-passport special-case never blocks unrelated standard EU5 or US/UA cases',()=>{
 const inputs=top10.map(code=>evidence(code))
 const rare=inputs.map(v=>v.passportCode==='IN'?{...v,specialDiplomaticServiceOrDualPassportExcluded:false}:v)
 const results=rare.map(reviewAtPriority10StandardCase)
 assert.equal(results[0].cause,'SPECIAL_DOCUMENT_OR_EXCEPTION_NEEDS_INDIVIDUAL_REVIEW')
 assert.ok(results.slice(1).every(x=>x.cause==='CONDITIONAL_STANDARD_CASE_NEEDS_HRS2_MA1_OWNER'))
 assert.deepEqual(results.map(x=>x.code),top10)
 assert.equal(reviewAtPriority10StandardCase({...evidence('TR'),actualResidenceOrFamilyVisaExemptionExcluded:false}).cause,'SPECIAL_DOCUMENT_OR_EXCEPTION_NEEDS_INDIVIDUAL_REVIEW')
})
test('Five EU national passport standard cases are not subject to third-country 90/180, 10-year and 3-month rules',()=>{
 for(const code of ['DE','PL','IT','RO','FR']){
  const x=reviewAtPriority10StandardCase({...evidence(code),actualSchengenStayWithin90In180:null,
   passportIssueWithin10Years:null,passportExpiryAtLeast3MonthsAfterExit:null,biometricOrdinaryPassportProved:null})
  assert.equal(x.cause,'CONDITIONAL_STANDARD_CASE_NEEDS_HRS2_MA1_OWNER')
 }
})
test('US/UA require full third-country passport and Schengen terms; biometric is compulsory only for UA waiver',()=>{
 for(const code of ['US','UA']){
  for(const flag of ['actualSchengenStayWithin90In180','passportIssueWithin10Years','passportExpiryAtLeast3MonthsAfterExit'] as const)
   assert.equal(reviewAtPriority10StandardCase({...evidence(code),[flag]:null}).cause,'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN')
 }
 assert.equal(reviewAtPriority10StandardCase({...evidence('UA'),biometricOrdinaryPassportProved:false}).cause,'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN')
 assert.equal(reviewAtPriority10StandardCase({...evidence('US'),biometricOrdinaryPassportProved:false}).cause,'CONDITIONAL_STANDARD_CASE_NEEDS_HRS2_MA1_OWNER')
 assert.equal(reviewAtPriority10StandardCase({...evidence('CN'),actualOrdinaryNationalPassportProved:false}).cause,'SPECIAL_DOCUMENT_OR_EXCEPTION_NEEDS_INDIVIDUAL_REVIEW')
})

test('EU5 national ID and passport are separate, Art. 5-dependent evidence paths; neither publishes',()=>{
 const eu5=['DE','PL','IT','RO','FR']
 for(const code of eu5){
  const card={...evidence(code),actualOrdinaryNationalPassportProved:false,
   actualEuNationalIdentityCardProved:true,actualEuIdDocumentForm:'verified_physical_travel_id' as const,actualEuIdIssuerMatchesNationalityProved:true,
   actualEuIdNotExpiredAtEntryProved:true,actualEuIdArticle5TravelValidityProved:true,
   actualSchengenStayWithin90In180:null,passportIssueWithin10Years:null,
   passportExpiryAtLeast3MonthsAfterExit:null}
  const acceptedForReview=reviewAtPriority10StandardCase(card)
  assert.equal(acceptedForReview.cause,'CONDITIONAL_STANDARD_CASE_NEEDS_HRS2_MA1_OWNER')
  assert.equal(acceptedForReview.visitorVisaStatement,null)
  assert.equal(acceptedForReview.visitorPassportValidStatement,null)
  assert.equal(acceptedForReview.publicationAllowed,false)
  for(const flag of ['actualEuIdIssuerMatchesNationalityProved',
   'actualEuIdNotExpiredAtEntryProved','actualEuIdArticle5TravelValidityProved'] as const){
   assert.equal(reviewAtPriority10StandardCase({...card,[flag]:false}).cause,
    'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN')
  }
  assert.equal(reviewAtPriority10StandardCase({...card,actualOrdinaryNationalPassportProved:true}).cause,
   'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN')
  assert.equal(reviewAtPriority10StandardCase({...card,actualEuNationalIdentityCardProved:false}).cause,
   'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN')
  assert.equal(reviewAtPriority10StandardCase({...card,bg1Current:false}).cause,
   'OFFICIAL_SOURCE_OR_BG1_MISSING')
  assert.equal(reviewAtPriority10StandardCase({...card,independentlySealedDestinationSpecificWitness:false}).cause,
   'DESTINATION_WITNESS_UNSEALED')
 }
 for(const code of ['IN','TR','CN','US','UA']){
  const bad={...evidence(code),actualOrdinaryNationalPassportProved:false,
   actualEuNationalIdentityCardProved:true,actualEuIdIssuerMatchesNationalityProved:true,
   actualEuIdNotExpiredAtEntryProved:true,actualEuIdArticle5TravelValidityProved:true}
  assert.equal(reviewAtPriority10StandardCase(bad).cause,
   'SPECIAL_DOCUMENT_OR_EXCEPTION_NEEDS_INDIVIDUAL_REVIEW')
 }
})

test('Five EU5 nontravel or ambiguous historical ID forms remain unavailable even if other booleans claim success',()=>{
 const blocked=[
  ['IT','italian_paper_nontravel'],
  ['RO','romanian_simple_nontravel'],
  ['FR','french_face_expired_legacy_unresolved'],
  ['PL','mobile_only'],
  ['DE','unclassified'],
 ] as const
 for(const [code,form] of blocked){
  const input={...evidence(code),actualOrdinaryNationalPassportProved:false,
   actualEuNationalIdentityCardProved:true,actualEuIdDocumentForm:form,
   actualEuIdIssuerMatchesNationalityProved:true,actualEuIdNotExpiredAtEntryProved:true,
   actualEuIdArticle5TravelValidityProved:true}
  const output=reviewAtPriority10StandardCase(input)
  assert.equal(output.cause,'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN',code)
  assert.equal(output.visitorPassportValidStatement,null)
  assert.equal(output.publicationAllowed,false)
 }
 for(const code of ['DE','PL','IT','RO','FR']){
  const unknown=reviewAtPriority10StandardCase({...evidence(code),
   actualOrdinaryNationalPassportProved:false,actualEuNationalIdentityCardProved:true,
   actualEuIdIssuerMatchesNationalityProved:true,actualEuIdNotExpiredAtEntryProved:true,
   actualEuIdArticle5TravelValidityProved:true})
  assert.equal(unknown.cause,'DOCUMENT_OR_TRAVEL_CONTEXT_UNPROVEN')
 }
})
