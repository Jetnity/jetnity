import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS,atBmiSourceReview} from './at-bmi-visa-groups-v1'
import {AT_VISA_APPLICATION_BMEIA_SOURCE,AT_VISA_APPLICATION_BMEIA_TERMS,atVisaApplicationEvidenceResearch} from './at-visa-application-evidence-research-v1'
import {EU4_200_VISA_RESEARCH_CASES} from '../official-truth-eu4-source-review-v1'

test('BMEIA visa application page is AT-only: two blank pages and months of validity are not automatic entry rules',()=>{
 assert.match(AT_VISA_APPLICATION_BMEIA_SOURCE.url,/^https:\/\/www\.bmeia\.gv\.at\/reise-services\//)
 assert.equal(AT_VISA_APPLICATION_BMEIA_SOURCE.checkedAt,'2026-11-20')
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.passportApplication.maxDocumentAgeYears,10)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.passportApplication.minimumMonthsValidBeyondVisaEnd,3)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.passportApplication.minimumBlankPagesForVisaApplication,2)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.passportApplication.notAnUnconditionalVisaFreeEntryRequirement,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.insurance.minimumSchengenCoverEurForApplicableVisaApplication,30000)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.publishedBaseFeesEur.schengenCAdult,90)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.publishedBaseFeesEur.schengenCAge6To12,45)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.publishedBaseFeesEur.nationalDOverAge6,195)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.publishedBaseFeesEur.nationalDUnderAge6,97)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.publishedBaseFeesEur.otherAgreementAndCategoryExemptionsMentioned,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.meansAndPurpose.fixedUniversalCashAmount,null)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.minor.exactCustodyAndGuardianEvidenceNeedsCheck,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.transit.visaAEligibilityMustBeDecidedSeparately,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.consularFilingResearch.earliestApplicationMonthsBeforePlannedTravel,6)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.consularFilingResearch.latestOrdinaryApplicationDaysBeforePlannedTravel,15)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.consularFilingResearch.mainSchengenDestinationDeterminesResponsibleMemberState,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.consularFilingResearch.firstPlannedSchengenEntryIfNoMainDestination,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.consularFilingResearch.austrianConsularPostDependsOnLawfulResidence,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.consularFilingResearch.representedByOtherSchengenConsulateMayApply,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.consularFilingResearch.authorizedExternalSubmissionProviderMayChargeExtraFee,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.consularFilingResearch.specificConsularPostOrOfficialApplicationForm,null)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.supportingDocumentsResearch.priorSchengenFingerprintsLookbackMonths,59)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.supportingDocumentsResearch.paidTransportTicketNotRequired,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.supportingDocumentsResearch.transportReservationOrBookingAcceptedAsEvidence,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.supportingDocumentsResearch.translationMayBeRequestedByConsularAuthority,true)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.processingResearch.ordinarySchengenCalendarDays,15)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.processingResearch.extendedSchengenCalendarDays,45)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.processingResearch.nationalVisaDDecisionMonths,6)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.processingResearch.individualApprovalOrTurnaroundGuaranteed,false)
 assert.equal(AT_VISA_APPLICATION_BMEIA_TERMS.fraudNotice.officialAuthorityWarnsAgainstExpensiveVisaAgencies,true)
})
test('All AT50 passport categories remain unavailable for individual BMEIA documentary, fee and family requirements',()=>{
 const codes=Object.values(AT_BMI_GROUPS).flat()
 assert.equal(codes.length,50)
 for(const code of codes){
  const row=atBmiSourceReview(code)
  assert.ok(row)
  const evidence=row.visaApplicationEvidenceResearch
  assert.deepEqual(evidence,atVisaApplicationEvidenceResearch(code))
  assert.equal(evidence.scope,'AUSTRIAN_VISA_APPLICATIONS_ONLY')
  for(const name of ['applicationRequiredForThisPersonVerified',
   'actualPassportIssueExpiryAndBlankPagesVerified',
   'actualResidenceMainDestinationAndResponsibleConsulateVerified',
   'actualVisaCategoryAndFilingDeadlineVerified',
   'actualMissionFormAndBiometricsExceptionVerified',
   'actualProcessingTimeAndPurposeVerified',
   'financialPurposeAndReturnEvidenceVerified','actualInsuranceExceptionChecked',
   'minorGuardianContextVerified','airportTransitVsEntryVerified',
   'applicantAgeFeeExemptionsAndVisaCategoryChecked',
   'destinationOriginalSealedForIndividual','hrs2Ma1Bg1OwnerAal2Authorized',
   'publicationAllowed'] as const) assert.equal(evidence[name],false)
  for(const name of ['personalPassportValidityAnswer','personalBlankPagesAnswer',
   'personalFinancialMeansAnswer','personalMinorConsentAnswer',
   'personalHealthInsuranceAnswer','personalConsularPost',
   'personalFilingDeadline','personalProcessingTime'] as const) assert.equal(evidence[name],'derzeit nicht verfügbar')
  assert.equal(evidence.personalFeeAmountEur,null)
  assert.equal(evidence.personalApplicationFormUrl,null)
  assert.equal(row.individualVisaQualified,false)
  assert.equal(row.ownerAal2Approved,false)
  assert.equal(row.personalVisaEffect,null)
  assert.equal(row.verifiedPrice,null)
 }
 assert.equal(atBmiSourceReview('XK')?.visaApplicationEvidenceResearch.publicationAllowed,false)
})
test('Austrian applicant evidence must never be counted as an Italian, French, Spanish or Portuguese rule',()=>{
 assert.equal(EU4_200_VISA_RESEARCH_CASES.length,200)
 for(const item of EU4_200_VISA_RESEARCH_CASES){
  assert.equal(item.destinationSpecificSourceOriginalSealed,false)
  assert.equal(item.ownerMa1Aal2Authorized,false)
  assert.equal(item.publicationAllowed,false)
  assert.equal(item.entryVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(item.feeAmount,null)
 }
})
