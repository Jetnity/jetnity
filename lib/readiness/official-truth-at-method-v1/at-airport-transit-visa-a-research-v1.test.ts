import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS,atBmiSourceReview} from './at-bmi-visa-groups-v1'
import {AT_VISA_A_BMI_SOURCE,AT_VISA_A_CONDITIONAL_EXCEPTIONS} from './at-airport-transit-visa-a-research-v1'
import {EU4_200_VISA_RESEARCH_CASES} from '../official-truth-eu4-source-review-v1'

test('Austrian BMI footnote 3 has exactly eight document-/route-bound research exception classes',()=>{
 assert.equal(AT_VISA_A_BMI_SOURCE.edition,'2026-11-06')
 assert.equal(AT_VISA_A_BMI_SOURCE.footnote,'3')
 assert.match(AT_VISA_A_BMI_SOURCE.url,/^https:\/\/www\.bmi\.gv\.at\//)
 assert.equal(AT_VISA_A_CONDITIONAL_EXCEPTIONS.length,8)
 assert.equal(new Set(AT_VISA_A_CONDITIONAL_EXCEPTIONS.map(x=>x.id)).size,8)
 for(const exception of AT_VISA_A_CONDITIONAL_EXCEPTIONS)assert.ok(exception.proof.length>25)
 assert.match(AT_VISA_A_CONDITIONAL_EXCEPTIONS.find(x=>x.id==='specified_third_country_visa_route')?.proof??'',/cut-off dates/)
 assert.match(AT_VISA_A_CONDITIONAL_EXCEPTIONS.find(x=>x.id==='covered_family_member')?.proof??'',/outside-EU/)
})

test('all 50 AT passport rows preserve airside uncertainty and fail closed without actual document/route/issuer',()=>{
 const codes=Object.values(AT_BMI_GROUPS).flat()
 assert.equal(codes.length,50)
 for(const code of codes){
  const row=atBmiSourceReview(code)
  assert.ok(row)
  const a=row.airportTransitVisaAResearch
  assert.equal(a.passportResearchCode,code)
  assert.equal(a.destination,'AT')
  assert.equal(a.austrianAirsideOnly,true)
  assert.equal(a.otherSchengenTransitRuleTransferAllowed,false)
  assert.equal(a.actualBmiPassportRowVisaAFlag,null)
  for(const flag of ['airportAndAirsideItineraryVerified','actualDocumentAndIssuerVerified',
   'visaOrResidenceAndValidityVerified','travelPurposeAndVisaRouteVerified',
   'familyOrCrewSpecialStatusVerified','exemptionLegallyQualified',
   'sourceOriginalSealed','hrs2Ma1OwnerAal2Approved'] as const) assert.equal(a[flag],false)
  assert.equal(a.personalTransitVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(row.personalVisaEffect,null)
  assert.equal(row.individualVisaQualified,false)
 }
})

test('Austrian airside exception footnote never serves as EU4 destination-specific legal issuer',()=>{
 assert.equal(EU4_200_VISA_RESEARCH_CASES.length,200)
 for(const row of EU4_200_VISA_RESEARCH_CASES){
  assert.equal(row.destinationSpecificSourceOriginalSealed,false)
  assert.equal(row.legalApplicabilityVerified,false)
  assert.equal(row.ownerMa1Aal2Authorized,false)
  assert.equal(row.entryVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(row.entryVaccineAnswer,'derzeit nicht verfügbar')
 }
})
