import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS,AT_BMI_REVIEW_SOURCES,atBmiSourceReview} from './at-bmi-visa-groups-v1'
import {AT_50_VISA_METHOD_PROPOSAL} from './at-50-method-proposal'

test('All 50 exact BMI-nationality rows have a dated crosschecked legal source group, but no individual visa grant',()=>{
 const codes=Object.values(AT_BMI_GROUPS).flat()
 assert.equal(codes.length,50)
 assert.equal(new Set(codes).size,50)
 assert.deepEqual([AT_BMI_GROUPS.V.length,AT_BMI_GROUPS.F.length,AT_BMI_GROUPS.E.length,AT_BMI_GROUPS.H.length],[20,19,10,1])
 assert.equal(AT_BMI_REVIEW_SOURCES.sourceEdition,'2026-11-06')
 assert.equal(AT_BMI_REVIEW_SOURCES.reviewedAt,'2026-11-19')
 assert.deepEqual(new Set(codes),new Set(AT_50_VISA_METHOD_PROPOSAL.passportPriority))
 for(const row of AT_50_VISA_METHOD_PROPOSAL.sourceBoundCountryCategories){
  const review=atBmiSourceReview(row.citizenshipCode)
  assert.ok(review)
  assert.equal(review.group,row.originalRowKind)
  assert.equal(review.groupSourceVerified,true)
  assert.equal(review.individualVisaQualified,false)
  assert.equal(review.ownerAal2Approved,false)
  assert.equal(review.personalVisaEffect,null)
  assert.equal(review.verifiedPrice,null)
  assert.match(review.bmiUrl,/^https:\/\/www\.bmi\.gv\.at\//)
  assert.match(review.bmeiaUrl,/^https:\/\/www\.bmeia\.gv\.at\//)
 }
})
test('Conditional biometrics, British categories and bilateral exceptions never turn into unconditional waivers',()=>{
 for(const country of ['UA','XK','RS'])assert.match(atBmiSourceReview(country)?.special??'',/biometrischen Reisepass/)
 assert.match(atBmiSourceReview('GB')?.special??'',/Passkategorien/)
 for(const country of ['BR','KR','JP','CA','IL'])assert.match(atBmiSourceReview(country)?.special??'',/bilaterale/)
 assert.equal(atBmiSourceReview('US')?.special,null)
 assert.equal(atBmiSourceReview('DE')?.group,'F')
 assert.equal(atBmiSourceReview('IN')?.group,'V')
 assert.equal(atBmiSourceReview('AT')?.group,'H')
 assert.equal(atBmiSourceReview('aa'),null)
 assert.equal(atBmiSourceReview('AQ'),null)
})
