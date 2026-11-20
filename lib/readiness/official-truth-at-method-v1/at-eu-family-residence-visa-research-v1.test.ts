import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS,atBmiSourceReview} from './at-bmi-visa-groups-v1'
import {AT_EU_FAMILY_CONDITIONS,AT_EU_FAMILY_ENTRY_SOURCES,atEuFamilyEntryResearch} from './at-eu-family-residence-visa-research-v1'
test('AT 50: EU-family entry is conditional, never an automatic visa/fee or card exemption',()=>{
 const codes=Object.values(AT_BMI_GROUPS).flat()
 assert.equal(codes.length,50)
 assert.equal(new Set(codes).size,50)
 assert.equal(AT_EU_FAMILY_ENTRY_SOURCES.reviewedAt,'2026-11-20')
 assert.match(AT_EU_FAMILY_ENTRY_SOURCES.austrianVisa,/^https:\/\/www\.bmeia\.gv\.at\//)
 assert.match(AT_EU_FAMILY_ENTRY_SOURCES.austrianGovernment,/^https:\/\/www\.oesterreich\.gv\.at\//)
 assert.match(AT_EU_FAMILY_ENTRY_SOURCES.euTravel,/^https:\/\/europa\.eu\//)
 assert.equal(AT_EU_FAMILY_CONDITIONS.separateEuEeaSwissFamilyCase,true)
 for(const [group,members] of Object.entries(AT_BMI_GROUPS)){
  for(const code of members){
   const r=atBmiSourceReview(code)
   assert.ok(r,code)
   assert.deepEqual(r.euFamilyEntryResearch,atEuFamilyEntryResearch(code,group as 'V'|'F'|'E'|'H'))
   if(group==='F'||group==='H'){assert.equal(r.euFamilyEntryResearch,null);continue}
   const f=r.euFamilyEntryResearch
   assert.ok(f,code)
   assert.equal(f.passportCode,code)
   assert.equal(f.group,group)
   assert.equal(f.destination,'AT')
   assert.equal(f.scope,'RESEARCH_ONLY')
   assert.equal(f.terms.actualFamilyRelationAndAccompanyOrJoinVerified,false)
   assert.equal(f.terms.actualValidResidenceCardOrPermitTypeIssuerAndValidityVerified,false)
   assert.equal(f.terms.sponsorHomeCountryVsGenuineCrossBorderMovementVerified,false)
   assert.equal(f.terms.euFeeWaiverAndAcceleratedProcedureIndividuallyApplicable,false)
   assert.equal(f.individualFamilyDocumentLegalRuleVerified,false)
   assert.equal(f.ma1Bg1OwnerAal2Approved,false)
   assert.equal(f.personalVisaResult,'derzeit nicht verfügbar')
   assert.equal(f.personalEntryFormUrl,null)
   assert.equal(f.personalFeeAmountEur,null)
   assert.equal(f.publicationAllowed,false)
  }
 }
 assert.equal(atEuFamilyEntryResearch('ch','V'),null)
 assert.equal(atEuFamilyEntryResearch('XX','F'),null)
})
