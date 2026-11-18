import assert from 'node:assert/strict'
import { test } from 'node:test'
import { inspectAtWholeSourceV2 } from './whole-source-v2'
import { AT_OFFICIAL_PUBLICATIONS } from '../official-truth-at-source-reader/publications'
import type { AtRetrievalInput } from '../official-truth-at-source-reader/bind'

const make=(index:number,length=1):AtRetrievalInput => {
 const p=AT_OFFICIAL_PUBLICATIONS[index]!
 return {publicationId:p.id,requestUrl:p.url,finalUrl:p.url,redirectCount:0,httpStatus:200,
 contentType:'text/html',body:new Uint8Array(length).fill(65),
 startedAt:'2026-11-16T19:45:38.000Z',retrievedAt:'2026-11-16T19:45:39.000Z',lastModifiedHeader:null}
}
test('AT HRS V2 whole-original candidate is wholly source-bound, not an authority',()=>{
 assert.equal(inspectAtWholeSourceV2([]).status,'unavailable')
 assert.equal(inspectAtWholeSourceV2([make(0),make(0),make(1)]).status,'unavailable')
 assert.equal(inspectAtWholeSourceV2([make(2),make(1),make(0)]).status,'unavailable')
 const exact=[make(0,498415),make(1,91655),make(2,172460)]
 const candidate=inspectAtWholeSourceV2(exact)
 assert.equal(candidate.status,'unavailable') // equal sizes but fake bytes never qualify
 if(candidate.status==='unavailable'){
   assert.equal(candidate.reason,'source_identity_or_version')
   assert.equal(candidate.acceptedFactCount,0)
   assert.equal(candidate.importable,false)
 }
 const tooLarge=[make(0,524289),make(1,91655),make(2,172460)]
 assert.equal(inspectAtWholeSourceV2(tooLarge).status,'unavailable')
 assert.equal(inspectAtWholeSourceV2([{...exact[0],requestUrl:'https://example.invalid'},...exact.slice(1)]).status,'unavailable')
 assert.equal(inspectAtWholeSourceV2([{...exact[0],body:new Uint8Array(131072)},...exact.slice(1)]).status,'unavailable')
})
