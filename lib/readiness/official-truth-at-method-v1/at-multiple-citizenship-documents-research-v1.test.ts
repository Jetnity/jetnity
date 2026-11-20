import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS,atBmiSourceReview} from './at-bmi-visa-groups-v1'
import {AT_DUAL_BMI_SOURCES,AT_DUAL_BMI_TERMS} from './at-multiple-citizenship-documents-research-v1'
test('Official BMI: AT50 double-nationality document is never an automatic visa/ID/EES approval',()=>{
 const codes=Object.values(AT_BMI_GROUPS).flat()
 assert.equal(codes.length,50)
 assert.equal(new Set(codes).size,50)
 assert.deepEqual(Object.fromEntries(Object.entries(AT_BMI_GROUPS).map(([k,v])=>[k,v.length])),{V:20,F:19,E:10,H:1})
 for(const code of codes){
  const item=atBmiSourceReview(code)
  assert.ok(item,code)
  const r=item.dualDocumentResearch
  assert.equal(r.passportResearchCode,code)
  assert.equal(r.bmiCategory,item.group)
  assert.equal(r.destination,'AT')
  assert.equal(r.researchOnly,true)
  assert.equal(r.sourceVisa,AT_DUAL_BMI_SOURCES.visaEntry)
  assert.equal(r.sourceBorderFaq,AT_DUAL_BMI_SOURCES.borderFaq)
  assert.deepEqual(r.terms,AT_DUAL_BMI_TERMS)
  assert.equal(r.actualIssuedDocumentVerified,false)
  assert.equal(r.dualNationalAndAustrianIdentityVerified,false)
  assert.equal(r.chosenEntryExitDocumentVerified,false)
  assert.equal(r.routePurposeTransitVerified,false)
  assert.equal(r.residenceVisaAndFamilyExceptionVerified,false)
  assert.equal(r.passportValiditiesVerified,false)
  assert.equal(r.exactPrimaryOriginalSealedForPerson,false)
  assert.equal(r.individualLegalQualified,false)
  assert.equal(r.ma1Bg1OwnerAal2Authorized,false)
  assert.equal(r.publicationAllowed,false)
  assert.equal(r.individualVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(r.individualEesAnswer,'derzeit nicht verfügbar')
  assert.equal(r.individualDocumentValidityAnswer,'derzeit nicht verfügbar')
  assert.equal(r.individualFormUrl,null)
  assert.equal(r.individualFeeEur,null)
 }
 assert.equal(atBmiSourceReview('EC'),null,'Ecuador is only the BMI example, not a priority50 issuer')
 assert.equal(atBmiSourceReview('XX'),null)
})
test('Domestic Austrian dual passport and foreign document rules do not automatically pick the best passport',()=>{
 for(const [code,group] of [['AT','H'],['IN','V'],['DE','F'],['BR','E']] as const){
  const r=atBmiSourceReview(code)!.dualDocumentResearch
  assert.equal(r.bmiCategory,group)
  assert.equal(r.individualVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(r.publicationAllowed,false)
 }
 assert.equal(AT_DUAL_BMI_TERMS.provedAustrianNationalityIsDistinctFromForeignVisaLaw,true)
 assert.equal(AT_DUAL_BMI_TERMS.nonAustrianMultipleNationalityDependsOnPresentedPassport,true)
 assert.equal(AT_DUAL_BMI_TERMS.sameEntryExitDocumentRecommendedNotCompulsory,true)
 assert.equal(AT_DUAL_BMI_TERMS.euFreeMovementMustNotInheritThirdCountryPassportAgeRules,true)
})
