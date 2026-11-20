import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS,atBmiSourceReview} from './at-bmi-visa-groups-v1'
import {AT_EU_ID_SOURCES,AT_EU_ID_ART5,AT_EU_ID_PRIORITY_CODES,atEuIdentityCardResearch} from './at-eu-identity-card-article5-research-v1'
import {EU4_200_VISA_RESEARCH_CASES} from '../official-truth-eu4-source-review-v1'

test('Current Austrian primary and EU 2025/1208 Art 5 distinguish MRZ, expiry and elderly carve-out',()=>{
 assert.equal(AT_EU_ID_SOURCES.reviewedAt,'2026-11-20')
 assert.equal(AT_EU_ID_SOURCES.bmi,'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/')
 assert.equal(AT_EU_ID_SOURCES.regulation,'https://eur-lex.europa.eu/eli/reg/2025/1208/oj/eng')
 assert.equal(AT_EU_ID_ART5.noFunctionalMrzOrIcaoMinimumCeasesBy,'2026-08-03')
 assert.equal(AT_EU_ID_ART5.otherNonConformingNationalIdCeasesBy,'2031-08-03')
 assert.equal(AT_EU_ID_ART5.grandfatherAgeOn,'2021-08-02')
 assert.equal(AT_EU_ID_ART5.grandfatherMinimumAge,70)
 assert.equal(AT_EU_ID_ART5.grandfatherNeedsFunctionalMrzAndIcaoMinimum,true)
 assert.equal(AT_EU_ID_ART5.grandfatherValidOnlyToActualDocumentExpiry,true)
 assert.equal(AT_EU_ID_ART5.notApplicableToPassport,true)
})
test('19 EU card categories but no single AT50 personal document or visitor release',()=>{
 const all=Object.values(AT_BMI_GROUPS).flat()
 assert.equal(all.length,50)
 assert.equal(AT_EU_ID_PRIORITY_CODES.length,19)
 assert.equal(new Set(AT_EU_ID_PRIORITY_CODES).size,19)
 for(const code of all){
  const record=atBmiSourceReview(code)
  assert.ok(record)
  const r=record.euIdentityCardResearch
  if(!AT_EU_ID_PRIORITY_CODES.includes(code)){assert.equal(r,null);continue}
  assert.deepEqual(r,atEuIdentityCardResearch(code))
  assert.ok(r)
  for(const key of ['actualCardIssuerAndTypeVerified','mrzIcaoAndExpiryVerified',
   'actualAgeOn20210802Verified','grandfatherExceptionQualified',
   'routeAndBorderContextVerified','destinationOriginalLegallySealed',
   'hrs2Ma1Bg1OwnerAal2Authorized','publicationAllowed'] as const)assert.equal(r[key],false)
  assert.equal(r.personalIdentityCardTravelAnswer,'derzeit nicht verfügbar')
  assert.equal(r.personalVisaEffect,null)
  assert.equal(record.individualVisaQualified,false)
 }
 for(const code of ['CH','GB','XK','US','ZZ'])assert.equal(atEuIdentityCardResearch(code),null)
})
test('No Austrian identity-card research releases EU4 passport rules',()=>{
 for(const r of EU4_200_VISA_RESEARCH_CASES){
  assert.equal(r.destinationSpecificSourceOriginalSealed,false)
  assert.equal(r.publicationAllowed,false)
  assert.equal(r.entryVisaAnswer,'derzeit nicht verfügbar')
 }
})
