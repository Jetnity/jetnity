import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_GB_BMI_CATEGORY_REVIEW,AT_GB_BMI_NATIONALITY_CATEGORIES,atGbBmiCategoryReview} from './at-gb-bmi-nationality-categories-v1'
import {atBmiSourceReview,AT_BMI_GROUPS} from './at-bmi-visa-groups-v1'
import {EU4_COUNTRIES,eu4PassportCase} from '../official-truth-eu4-source-review-v1'

test('AT British nationalities require an explicit document category before any personal visa result',()=>{
 const categories=AT_GB_BMI_NATIONALITY_CATEGORIES
 assert.deepEqual(categories,[
  'British citizen','British National (Overseas)','British Overseas Territories Citizen',
  'British Overseas Citizen','British Protected Person','British Subject',
 ])
 assert.equal(new Set(categories).size,6)
 assert.equal(AT_GB_BMI_CATEGORY_REVIEW.bmiEdition,'2026-11-06')
 assert.match(AT_GB_BMI_CATEGORY_REVIEW.bmiSource,/^https:\/\/www\.bmi\.gv\.at\//)
 assert.equal(atGbBmiCategoryReview('GB'),AT_GB_BMI_CATEGORY_REVIEW)
 for(const code of Object.values(AT_BMI_GROUPS).flat().filter(code=>code!=='GB'))
  assert.equal(atGbBmiCategoryReview(code),null)
 const entry=atBmiSourceReview('GB')
 assert.equal(entry?.group,'E')
 assert.equal(entry?.britishPassportCategoryCrosscheck,AT_GB_BMI_CATEGORY_REVIEW)
 assert.equal(entry?.personalVisaEffect,null)
 assert.equal(entry?.individualVisaQualified,false)
})
test('GB category research is explicitly blocked for both AT and foreign national EU4 issuers',()=>{
 const review=AT_GB_BMI_CATEGORY_REVIEW
 for(const flag of ['ordinaryTravelDocumentAndNationalityCategoryVerified',
  'specificDocumentRecognitionVerified','visaAndResidenceExceptionsVerified',
  'routePurposeAndStayVerified','exactDestinationOriginalForIndividualRuleSealed',
  'eu4DestinationLegalityVerified','ma1OwnerAal2Approved'] as const)
  assert.equal(review[flag],false)
 assert.equal(review.personalVisaDecision,'derzeit nicht verfügbar')
 for(const destination of EU4_COUNTRIES){
  const candidate=eu4PassportCase(destination,'GB')
  assert.equal(candidate?.britishNationalityCategoryCrosscheckRequired,true)
  assert.equal(candidate?.issuerDocumentCrosscheckRequired,true)
  assert.equal(candidate?.issuerDocumentLegalSource,null)
  assert.equal(candidate?.britishNationalityAustrianResearchSource,review.bmiSource)
  assert.equal(candidate?.destinationSpecificSourceOriginalSealed,false)
  assert.equal(candidate?.legalApplicabilityVerified,false)
  assert.equal(candidate?.ownerMa1Aal2Authorized,false)
  assert.equal(candidate?.entryVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(eu4PassportCase(destination,'CH')?.britishNationalityCategoryCrosscheckRequired,false)
 }
})
