import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS} from './at-bmi-visa-groups-v1'
import {AT_RESIDENCE_EES_BMI_SOURCE,AT_RESIDENCE_EES_CONDITIONS,atResidenceEesResearch} from './at-residence-and-ees-conditions-research-v1'
import {EU4_COUNTRIES,eu4PassportCase} from '../official-truth-eu4-source-review-v1'

test('BMI Gibraltar and Austria Withdrawal Agreement conditions are not British nationality exemptions',()=>{
 assert.match(AT_RESIDENCE_EES_BMI_SOURCE.border,/^https:\/\/www\.bmi\.gv\.at\//)
 assert.match(AT_RESIDENCE_EES_BMI_SOURCE.ees,/^https:\/\/www\.bmi\.gv\.at\//)
 assert.equal(AT_RESIDENCE_EES_BMI_SOURCE.reviewedAt,'2026-11-20')
 const c=AT_RESIDENCE_EES_CONDITIONS
 assert.equal(c.gibraltarResidence.agreementSignedOn,'2026-07-14')
 assert.equal(c.gibraltarResidence.residenceNotNationalityIsTheKeyContext,true)
 assert.equal(c.gibraltarResidence.applicableAgreementInForceAndLegalScopeVerified,false)
 assert.equal(c.gibraltarResidence.actualGibraltarResidenceAndSupportingDocumentVerified,false)
 assert.equal(c.gibraltarResidence.currentEntryConditionsAndBorderItineraryVerified,false)
 assert.equal(c.withdrawalAgreementAustriaResidence.austrianResidenceAndWithdrawalAgreementStatusVerified,false)
 assert.equal(c.withdrawalAgreementAustriaResidence.actualIdIssuerValidityMrzAndIcaoVerified,false)
 assert.equal(c.withdrawalAgreementAustriaResidence.austrianExternalBorderAndOtherRequirementsVerified,false)
 assert.equal(c.withdrawalAgreementAustriaResidence.otherSchengenStatesRecognitionVerified,false)
 assert.equal(c.eesShortStayContext.notEtiasNotVisa,true)
 for(const key of ['actualExternalSchengenBorderCrossingVerified','actualPermitVisaDAndExceptionDocumentsVerified','airsideNoBorderCheckVsSchengenEntryVerified','individualEesRegistrationObligationVerified'] as const)
  assert.equal(c.eesShortStayContext[key],false)
})
test('All 50 AT passport research codes remain unavailable regardless of residence/EES context',()=>{
 const codes=Object.values(AT_BMI_GROUPS).flat()
 assert.equal(codes.length,50)
 assert.equal(new Set(codes).size,50)
 for(const code of codes){
  const r=atResidenceEesResearch(code)
  assert.ok(r,code)
  assert.equal(r.destination,'AT')
  assert.equal(r.scope,'RESEARCH_ONLY')
  assert.equal(r.identityNationalityAndResidenceChecked,false)
  assert.equal(r.documentRoutePurposeTransitVerified,false)
  assert.equal(r.originalLegallySealedForIndividual,false)
  assert.equal(r.hrs2Ma1Bg1OwnerAal2Authorized,false)
  assert.equal(r.personalEesRegistrationAnswer,'derzeit nicht verfügbar')
  assert.equal(r.personalVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(r.personalTravelDocumentAnswer,'derzeit nicht verfügbar')
  assert.equal(r.personalOfficialFormUrl,null)
  assert.equal(r.personalFeeEur,null)
  assert.equal(r.publicationAllowed,false)
 }
 assert.equal(atResidenceEesResearch('XX'),null)
 // GB code is not equivalent to residence in Gibraltar, and CH is not
 // an automatic withdrawal-agreement beneficiary either.
 assert.equal(atResidenceEesResearch('GB')?.personalVisaAnswer,'derzeit nicht verfügbar')
 assert.equal(atResidenceEesResearch('CH')?.personalEesRegistrationAnswer,'derzeit nicht verfügbar')
})
test('AT-only residence/EES research does not authorize any EU4 entry issuer',()=>{
 for(const destination of EU4_COUNTRIES){
  const candidate=eu4PassportCase(destination,'GB')
  assert.equal(candidate?.entryVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(candidate?.destinationSpecificSourceOriginalSealed,false)
  assert.equal(candidate?.ownerMa1Aal2Authorized,false)
 }
})
