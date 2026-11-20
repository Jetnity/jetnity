import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {test} from 'node:test'
import {AT_BMI_GROUPS,atBmiSourceReview} from './at-bmi-visa-groups-v1'
import {AT_VISA_A_BMI_SOURCE,AT_VISA_A_CONDITIONAL_EXCEPTIONS,AT_VISA_A_BMI_ARCHIVE_ROW_CHECK} from './at-airport-transit-visa-a-research-v1'
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

test('All 50 pinned BMI Visa A archive rows retain 9 yes, 21 no, 19 free movement, 1 home; none is a personal answer',()=>{
 const yes=new Set<string>(AT_VISA_A_BMI_ARCHIVE_ROW_CHECK.yesCodes)
 assert.equal(yes.size,9)
 assert.deepEqual([...yes].sort(),['AF','ER','IQ','IR','LK','NG','PK','SO','SY'])
 assert.match(AT_VISA_A_BMI_ARCHIVE_ROW_CHECK.originalSha256,/^[a-f0-9]{64}$/)
 assert.equal(AT_VISA_A_BMI_ARCHIVE_ROW_CHECK.sourceOnly,true)
 const V=[...AT_BMI_GROUPS.V]
 const E=[...AT_BMI_GROUPS.E]
 assert.equal(V.length+E.length,30)
 assert.equal([...V,...E].filter(code=>yes.has(code)).length,9)
 assert.equal([...V,...E].filter(code=>!yes.has(code)).length,21)
 assert.equal(AT_BMI_GROUPS.F.length,19)
 assert.equal(AT_BMI_GROUPS.H.length,1)
 for(const code of [...V,...E,...AT_BMI_GROUPS.F,...AT_BMI_GROUPS.H]){
  const review=atBmiSourceReview(code)
  assert.ok(review)
  assert.equal(review.airportTransitVisaAResearch.actualBmiPassportRowVisaAFlag,null)
  assert.equal(review.airportTransitVisaAResearch.sourceOriginalSealed,false)
  assert.equal(review.airportTransitVisaAResearch.personalTransitVisaAnswer,'derzeit nicht verfügbar')
 }
})

test('all 50 ranked original Visa A cells are pinned exactly, but never published as a personal rule',()=>{
 const audit=AT_VISA_A_BMI_ARCHIVE_ROW_CHECK
 const codes=audit.priorityCodes
 const flags=audit.visaASourceOnlySignature
 assert.equal(codes.length,50)
 assert.equal(flags.length,50)
 assert.equal(new Set(codes).size,50)
 assert.match(flags,/^[JNFH]{50}$/)
 const auditLine=codes.map((code,index)=>`${index+1}:${code}:${flags[index]}`).join('|')
 assert.equal(createHash('sha256').update(auditLine).digest('hex'),audit.rowsetVisaASha256)
 const groups=Object.fromEntries(Object.entries(AT_BMI_GROUPS).flatMap(([kind,items])=>items.map(code=>[code,kind])))
 assert.deepEqual(codes.filter((_,i)=>flags[i]==='J').sort(),[...audit.yesCodes].sort())
 assert.deepEqual({J:[...flags].filter(x=>x==='J').length,N:[...flags].filter(x=>x==='N').length,F:[...flags].filter(x=>x==='F').length,H:[...flags].filter(x=>x==='H').length},{J:9,N:21,F:19,H:1})
 for (let index=0;index<codes.length;index++){
  const code=codes[index],flag=flags[index],group=groups[code]
  assert.ok(group, `unknown pinned passport ${code}`)
  assert.equal(flag==='F',group==='F')
  assert.equal(flag==='H',group==='H')
  assert.equal(flag==='J'||flag==='N',group==='V'||group==='E')
  const review=atBmiSourceReview(code)
  assert.ok(review)
  assert.equal(review.airportTransitVisaAResearch.actualBmiPassportRowVisaAFlag,null)
  assert.equal(review.airportTransitVisaAResearch.sourceOriginalSealed,false)
  assert.equal(review.airportTransitVisaAResearch.hrs2Ma1OwnerAal2Approved,false)
  assert.equal(review.airportTransitVisaAResearch.personalTransitVisaAnswer,'derzeit nicht verfügbar')
 }
})
