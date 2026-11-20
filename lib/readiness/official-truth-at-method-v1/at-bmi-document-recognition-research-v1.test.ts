import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_BMI_GROUPS,atBmiSourceReview} from './at-bmi-visa-groups-v1'
import {AT_BMI_DOCUMENT_RECOGNITION_SOURCE,atBmiDocumentRecognitionResearch} from './at-bmi-document-recognition-research-v1'
import {EU4_200_VISA_RESEARCH_CASES} from '../official-truth-eu4-source-review-v1'

test('Austria BMI Iraqi passport series and dated CPA stamp caveat remain source-only',()=>{
 const row=atBmiSourceReview('IQ')
 assert.ok(row)
 assert.equal(row.group,'V')
 const d=row.passportRecognitionSourceReview
 assert.ok(d)
 assert.deepEqual(d,atBmiDocumentRecognitionResearch('IQ'))
 assert.equal(d.sourceEdition,'2026-11-06')
 assert.equal(d.originalArchiveSha256,AT_BMI_DOCUMENT_RECOGNITION_SOURCE.archiveOriginalSha256)
 assert.match(d.conditionalOriginalNotes.join(' '),/series A and G/)
 assert.match(d.conditionalOriginalNotes.join(' '),/series S.*not recognized/)
 assert.match(d.conditionalOriginalNotes.join(' '),/H, M and N.*19\.03\.2003.*CPA stamp/)
 assert.equal(d.personalDocumentRecognitionAnswer,'derzeit nicht verfügbar')
})
test('Austria BMI Somali/Somaliland document nonrecognition is not an automatic individual decision',()=>{
 const d=atBmiSourceReview('SO')?.passportRecognitionSourceReview
 assert.ok(d)
 assert.match(d.conditionalOriginalNotes.join(' '),/Somaliland.*not recognized/)
 assert.match(d.conditionalOriginalNotes.join(' '),/Somalia issued after 31\.01\.1991.*not recognized/)
 assert.equal(d.personalDocumentRecognitionAnswer,'derzeit nicht verfügbar')
})
test('All 50 AT nationality groups and 200 EU4 research cases stay closed to unqualified recognition',()=>{
 const codes=Object.values(AT_BMI_GROUPS).flat()
 assert.equal(codes.length,50)
 for(const code of codes){
  const group=atBmiSourceReview(code)
  assert.ok(group)
  const d=group.passportRecognitionSourceReview
  if(code!=='IQ'&&code!=='SO'){assert.equal(d,null);continue}
  assert.ok(d)
  assert.equal(d.scope,'AT_ONLY_RESEARCH')
  for(const flag of ['exactPassportSeriesAndIssuerVerified','exactDocumentDateAndStampVerified',
   'documentValidityAndCurrentRecognitionVerified','legalApplicabilityVerified',
   'sourceOriginalSealedForIndividual','hrs2Ma1Bg1OwnerAal2Approved'] as const)
   assert.equal(d[flag],false)
  assert.equal(d.personalDocumentRecognitionAnswer,'derzeit nicht verfügbar')
  assert.equal(group.individualVisaQualified,false)
  assert.equal(group.personalVisaEffect,null)
 }
 assert.equal(EU4_200_VISA_RESEARCH_CASES.length,200)
 for(const row of EU4_200_VISA_RESEARCH_CASES){
  assert.equal(row.destinationSpecificSourceOriginalSealed,false)
  assert.equal(row.ownerMa1Aal2Authorized,false)
  assert.equal(row.entryVisaAnswer,'derzeit nicht verfügbar')
 }
})
