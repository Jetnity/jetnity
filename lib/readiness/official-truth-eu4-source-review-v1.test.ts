import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS} from './official-truth-at-method-v1/at-bmi-visa-groups-v1'
import {EU4_200_VISA_RESEARCH_CASES,EU4_COUNTRIES,EU4_CROSSCHECKS,EU4_OFFICIAL_PRIMARIES,eu4PassportCase} from './official-truth-eu4-source-review-v1'

test('IT FR ES PT use genuine country government visa portals in addition to EU Annexes, not a borrowed Austrian issuer',()=>{
 assert.deepEqual(EU4_COUNTRIES,['IT','FR','ES','PT'])
 assert.match(EU4_CROSSCHECKS.annexes,/eur-lex\.europa\.eu\/eli\/reg\/2018\/1806\/2025-12-30\/eng/)
 assert.equal(EU4_CROSSCHECKS.consolidatedAsOf,'2025-12-30')
 assert.match(EU4_CROSSCHECKS.visa,/home-affairs\.ec\.europa\.eu/)
 assert.equal(EU4_CROSSCHECKS.reviewedAt,'2026-11-20')
 assert.match(EU4_OFFICIAL_PRIMARIES.IT.application??'',/vistoperitalia\.esteri\.it/)
 assert.match(EU4_OFFICIAL_PRIMARIES.FR.application??'',/france-visas\.gouv\.fr/)
 assert.match(EU4_OFFICIAL_PRIMARIES.FR.distinction,/overseas/)
 assert.match(EU4_OFFICIAL_PRIMARIES.ES.visa,/interior\.gob\.es/)
 assert.match(EU4_OFFICIAL_PRIMARIES.ES.distinction,/conflicts/)
 assert.match(EU4_OFFICIAL_PRIMARIES.PT.visa,/gov\.pt/)
 assert.match(EU4_OFFICIAL_PRIMARIES.PT.distinction,/90 days/)
 for(const destination of EU4_COUNTRIES){
  const source=EU4_OFFICIAL_PRIMARIES[destination]
  assert.ok(source.visa.startsWith('https://')&&source.conditions.startsWith('https://'))
  assert.ok(source.government.length>6)
 }
})
test('4x50 research cases preserve priority, conditionally classify the destination as home and AT as EU visitor',()=>{
 assert.equal(EU4_200_VISA_RESEARCH_CASES.length,200)
 const allCodes=Object.values(AT_BMI_GROUPS).flat()
 for(const dest of EU4_COUNTRIES){
  const cases=EU4_200_VISA_RESEARCH_CASES.filter(x=>x.destination===dest)
  assert.equal(cases.length,50)
  assert.deepEqual(new Set(cases.map(x=>x.passport)),new Set(allCodes))
  assert.deepEqual([cases.filter(x=>x.destinationCandidateGroup==='V').length,
   cases.filter(x=>x.destinationCandidateGroup==='F').length,
   cases.filter(x=>x.destinationCandidateGroup==='E').length,
   cases.filter(x=>x.destinationCandidateGroup==='H').length],[20,19,10,1])
  assert.equal(cases.find(x=>x.passport===dest)?.destinationCandidateGroup,'H')
  assert.equal(cases.find(x=>x.passport==='AT')?.destinationCandidateGroup,'F')
  assert.equal(cases.find(x=>x.passport==='AT')?.comparativeBmiGroup,'H')
  assert.ok(cases.every(x=>x.rank>=1&&x.rank<=50))
 }
 assert.equal(eu4PassportCase('IT','AQ'),null)
 assert.equal(eu4PassportCase('FR','aa'),null)
})
test('EU4 comparison never carries over national Austrian waivers, guesses a visa, fees or vaccination, or marks research as approved',()=>{
 for(const item of EU4_200_VISA_RESEARCH_CASES){
  assert.equal(item.sourceLinksChecked,true)
  assert.equal(item.destinationSpecificSourceOriginalSealed,false)
  assert.equal(item.legalApplicabilityVerified,false)
  assert.equal(item.documentsVerified,false)
  assert.equal(item.routeAndDurationVerified,false)
  assert.equal(item.ownerMa1Aal2Authorized,false)
  assert.equal(item.publicationAllowed,false)
  assert.equal(item.entryVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(item.entryVaccineAnswer,'derzeit nicht verfügbar')
  assert.equal(item.validFrom,null)
  assert.equal(item.feeAmount,null)
  assert.equal(item.frenchTerritoryScopeNeedsCheck,item.destination==='FR')
  assert.equal(item.spanishFinancialConflictLookupRequired,item.destination==='ES')
  for(const url of Object.values(item.sourceUrls))assert.ok(url.startsWith('https://'))
 }
 for(const dest of EU4_COUNTRIES){
  for(const pass of ['UA','XK','RS'])assert.equal(eu4PassportCase(dest,pass)?.needsBiometricCheck,true)
  for(const pass of ['BR','KR','JP','CA','IL','TR','IN','PK','TH','EG','PH','MA'])
   assert.equal(eu4PassportCase(dest,pass)?.austrianNationalWaiverNonportable,true)
  for(const pass of ['CN','RU']) {
   assert.equal(eu4PassportCase(dest,pass)?.austrianNationalWaiverNonportable,false)
   assert.equal(eu4PassportCase(dest,pass)?.euDiplomaticExceptionNeedsSeparateCheck,true)
  }
  assert.equal(eu4PassportCase(dest,'US')?.austrianNationalWaiverNonportable,false)
  assert.equal(eu4PassportCase(dest,'US')?.euDiplomaticExceptionNeedsSeparateCheck,false)
 }
})

test('EU4 research never treats non-ISO Kosovo code as an accepted visitor passport or Serbian special issuer as Kosovo',()=>{
 for(const dest of EU4_COUNTRIES){
  const kosovo=eu4PassportCase(dest,'XK'),serbia=eu4PassportCase(dest,'RS')
  assert.ok(kosovo&&serbia)
  assert.equal(kosovo.issuerDocumentCrosscheckRequired,true)
  assert.equal(kosovo.visitorCountryCodeUnsupported,true)
  assert.match(kosovo.issuerDocumentLegalSource??'',/2023\/850/)
  assert.equal(serbia.issuerDocumentCrosscheckRequired,true)
  assert.equal(serbia.visitorCountryCodeUnsupported,false)
  assert.match(serbia.issuerDocumentLegalSource??'',/2024\/2495/)
  for(const item of [kosovo,serbia]){
   assert.equal(item.legalApplicabilityVerified,false)
   assert.equal(item.destinationSpecificSourceOriginalSealed,false)
   assert.equal(item.ownerMa1Aal2Authorized,false)
   assert.equal(item.entryVisaAnswer,'derzeit nicht verfügbar')
  }
  assert.equal(eu4PassportCase(dest,'CH')?.issuerDocumentCrosscheckRequired,false)
 }
})
