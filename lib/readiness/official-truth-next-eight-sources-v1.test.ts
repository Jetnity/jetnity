import assert from 'node:assert/strict'
import {test} from 'node:test'
import {NEXT_EIGHT_SOURCE_REVIEW_ORDER,NEXT_EIGHT_OFFICIAL_RESEARCH,nextEightOfficialReview} from './official-truth-next-eight-sources-v1'
import {readFileSync} from 'node:fs'

test('Next eight destinations follow the existing 206-target canonical destination order, without selecting new passports',()=>{
 assert.deepEqual(NEXT_EIGHT_SOURCE_REVIEW_ORDER,['GR','HR','NL','GB','US','TR','TH','AE'])
 assert.equal(NEXT_EIGHT_OFFICIAL_RESEARCH.length,8)
 const existing=readFileSync(new URL('../../scripts/official-truth-destination-batch.mjs',import.meta.url),'utf8')
 assert.match(existing,/DESTINATION_ORDER = Object\.freeze\(\['AT','IT','FR','ES','PT','GR','HR','NL','GB','US','TR','TH','AE'\]\)/)
})
test('Every next country has destination-government primary link and a distinct official countercheck, with zero fabricated public facts',()=>{
 const originals=NEXT_EIGHT_OFFICIAL_RESEARCH
 assert.equal(new Set(originals.map(x=>x.country)).size,8)
 for(const record of originals){
  assert.ok(record.governmentPrimary.startsWith('https://'))
  assert.ok(record.governmentCountercheck.startsWith('https://'))
  assert.notEqual(record.governmentPrimary,record.governmentCountercheck)
  assert.ok(record.directAuthorityName.length>=8)
  assert.ok(record.missingDocumentFacts.length>=35)
  assert.equal(record.archiveOriginalLoaded,false)
  assert.equal(record.nationalPrimaryOriginalDigestSealed,false)
  assert.equal(record.documentAndRouteLawQualified,false)
  assert.equal(record.ownerAal2Authorized,false)
  assert.equal(record.visitorPositiveApproved,false)
  for(const x of [record.entryVisaResult,record.vaccinationResult,record.feeResult])
   assert.equal(x,'derzeit nicht verfügbar')
 }
 assert.equal(nextEightOfficialReview('XX'),null)
 assert.equal(nextEightOfficialReview('xx'),null)
})
test('2026 official Thailand, Türkiye, UK and UAE updates are explicit hazards; do not copy stale research rules',()=>{
 const get=(c:string)=>nextEightOfficialReview(c)!
 assert.match(get('TH').revisedLawWarning,/15\.09\.2026/)
 assert.match(get('TH').revisedLawWarning,/60-day/)
 assert.match(get('TH').governmentPrimary,/mfa\.go\.th/)
 assert.match(get('TH').governmentCountercheck,/thailand\.prd\.go\.th/)
 assert.match(get('TR').revisedLawWarning,/02\.01\.2026/)
 assert.match(get('GB').governmentPrimary,/gov\.uk\/check-uk-visa/)
 assert.match(get('GB').governmentCountercheck,/gov\.uk\/guidance\/check-when-you-can-get-an-electronic-travel-authorisation-eta/)
 assert.match(get('AE').revisedLawWarning,/June 2026/)
 assert.match(get('AE').governmentCountercheck,/icp\.gov\.ae/)
 assert.match(get('US').revisedLawWarning,/ESTA is NOT a visa/)
 assert.match(get('HR').revisedLawWarning,/2023/)
 assert.match(get('NL').revisedLawWarning,/Dutch Caribbean/)
})
