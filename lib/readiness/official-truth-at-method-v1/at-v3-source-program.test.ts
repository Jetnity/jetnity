import assert from 'node:assert/strict'
import { test } from 'node:test'
import { inspectAtVisaV3Candidates } from './at-v3-source-program'
import { AT_OFFICIAL_PUBLICATIONS } from '../official-truth-at-source-reader/publications'
import type { AtRetrievalInput } from '../official-truth-at-source-reader/bind'

const passports='IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'.split(' ')
function synthetic(index:number,length:number):AtRetrievalInput{
 const p=AT_OFFICIAL_PUBLICATIONS[index]!
 return {publicationId:p.id,requestUrl:p.url,finalUrl:p.url,redirectCount:0,
 httpStatus:200,contentType:'text/html',body:new Uint8Array(length).fill(65),
 startedAt:'2026-11-16T19:45:38.000Z',retrievedAt:'2026-11-16T19:45:39.000Z',
 lastModifiedHeader:null}
}
test('AT V3 rejects absence, fake origins and incomplete full original source bytes',()=>{
 const three=[synthetic(0,498415),synthetic(1,91655),synthetic(2,172460)]
 for(const source of [[],three.slice(0,2),three,[...three].reverse(),
   [{...three[0],requestUrl:'https://example.invalid'},...three.slice(1)],
   [{...three[0],body:new Uint8Array(131072)},...three.slice(1)]]){
   const result=inspectAtVisaV3Candidates(source,passports)
   assert.equal(result.status,'unavailable')
   assert.equal(result.approved,false)
   assert.equal(result.importable,false)
 }
})
test('AT V3 rejects incomplete and invented citizenship priorities, never publishes',()=>{
 const sources=[synthetic(0,498415),synthetic(1,91655),synthetic(2,172460)]
 for(const invalid of [passports.slice(0,49),Array(50).fill('CH'),
   [...passports.slice(0,49),'XX'],[...passports.slice(1),'CH']]){
   const result=inspectAtVisaV3Candidates(sources,invalid)
   assert.equal(result.approved,false)
   assert.equal(result.importable,false)
 }
})
