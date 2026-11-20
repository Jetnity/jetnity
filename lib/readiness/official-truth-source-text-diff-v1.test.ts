import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

import {
  officialTruthQuellenTextVergleich,
  type OfficialSourceResearchSnapshot,
} from './official-truth-source-text-diff-v1'

const sentence = 'The Example Government travel information page describes a synthetic entry procedure only, not an actual rule.'
const page = (text=sentence, extras='', url='/visa-form'): string =>
  `<!doctype html><html lang="en"><head><title>Government notice</title>` +
  `<script>window.dynamicCounter = 1;</script></head><body><main><h1>Travel notice</h1>` +
  `<p>${text}</p><p>Check the official procedure for the currently selected nationality and passport.</p>` +
  `<a href="${url}">Official form</a><form action="/submit"><button>Continue</button></form>` +
  `${extras}</main></body></html>`

const sha = (text:string) => createHash('sha256').update(text,'utf8').digest('hex')
const snapshot = (
  html: string,
  batchId=1,
  patch: Partial<OfficialSourceResearchSnapshot>={},
): OfficialSourceResearchSnapshot => ({
  sourceFamily: 'SIX',
  destinationCode: 'TH',
  sourceKey: 'thai-tdac',
  batchId,
  rawSha: sha(html),
  bodyBytes: Buffer.byteLength(html,'utf8'),
  html,
  ...patch,
})

const result = (left:string,right:string,patch?:Partial<OfficialSourceResearchSnapshot>) =>
  officialTruthQuellenTextVergleich(snapshot(left),snapshot(right,2,patch))

describe('government HTML changes remain unqualified even with equal visible source text',()=>{
 test('identical raw bytes yield only research, with no authority and no model call',()=>{
   const html=page()
   const r=result(html,html)
   assert.equal(r.status,'research_comparison_only')
   if(r.status!=='research_comparison_only') return
   assert.equal(r.disposition,'RAW_IDENTICAL_RESEARCH_ONLY')
   assert.equal(r.oldRawSha,r.newRawSha)
   assert.equal(r.oldVisibleTextSha,r.newVisibleTextSha)
   assert.equal(r.reviewRequired,true)
   assert.equal(r.legalRuleApproved,false)
   assert.equal(r.publicationAllowed,false)
   assert.equal(r.acceptedFacts,0)
   assert.equal(r.modelCalls,0)
   assert.equal(r.databaseWrites,0)
 })
 test('visa/entry text differences are only flagged for review, not legally interpreted',()=>{
   const original=page(sentence)
   const updated=page(sentence.replace('synthetic entry procedure','synthetic visa requirement'))
   const r=result(original,updated)
   assert.equal(r.status,'research_comparison_only')
   if(r.status!=='research_comparison_only') return
   assert.equal(r.disposition,'VISIBLE_TEXT_CHANGED_REQUIRES_REVIEW')
   assert.notEqual(r.oldVisibleTextSha,r.newVisibleTextSha)
   assert.ok(r.changedOrAddedFragments>=1)
   assert.ok(r.changedOrRemovedFragments>=1)
   assert.equal(r.publicationAllowed,false)
   const serialized=JSON.stringify(r)
   for(const sensitive of [sentence,'visa requirement','/visa-form','/submit','<html','trustedRuleFact']) {
     assert.equal(serialized.includes(sensitive),false,sensitive)
   }
 })
 test('dynamic script changes do NOT masquerade as proved legal equivalence',()=>{
   const original=page().replace('dynamicCounter = 1','dynamicCounter = 123')
   const updated=page().replace('dynamicCounter = 1','dynamicCounter = 456')
   const r=result(original,updated)
   assert.equal(r.status,'research_comparison_only')
   if(r.status!=='research_comparison_only') return
   assert.equal(r.disposition,'NONVISIBLE_MARKUP_CHANGED_REQUIRES_REVIEW')
   assert.equal(r.oldVisibleTextSha,r.newVisibleTextSha)
   assert.notEqual(r.oldRawSha,r.newRawSha)
   assert.equal(r.reviewRequired,true)
 })
 test('silent form/action or href changes remain visibly marked even with identical page text',()=>{
   const old=page()
   const newer=page().replace('href="/visa-form"','href="/form?new=true"')
   const r=result(old,newer)
   assert.equal(r.status,'research_comparison_only')
   if(r.status!=='research_comparison_only') return
   assert.equal(r.disposition,'FORM_OR_LINK_CHANGED_REQUIRES_REVIEW')
   assert.equal(r.oldVisibleTextSha,r.newVisibleTextSha)
   assert.notEqual(r.oldLinkAndFormSha,r.newLinkAndFormSha)
   assert.equal(r.publicationAllowed,false)
 })
 test('HTML entity and harmless element wrapping cannot silently become approval',()=>{
   const old=page('The government page says: A &amp; B, visa terms and official information for travellers are described below.')
   const newer=page('The government page says: A &amp; B, visa terms and official information for travellers are described below.')
    .replace('government page','government <span>page</span>')
   const r=result(old,newer)
   assert.equal(r.status,'research_comparison_only')
   if(r.status!=='research_comparison_only') return
   assert.equal(r.publicationAllowed,false)
   assert.equal(r.reviewRequired,true)
 })
 test('foreign/script markup is never executed and never returned as government evidence',()=>{
   const evil='PRIVATE_MARKER_SHOULD_NOT_SURFACE_948203'
   const old=page()
   const newer=page().replace('</main>',`<script>throw Error('${evil}')</script><svg><title>${evil}</title></svg></main>`)
   const r=result(old,newer)
   assert.equal(r.status,'research_comparison_only')
   assert.equal(JSON.stringify(r).includes(evil),false)
 })
 test('FOUR stream is allowed only with the registry-owned primary key',()=>{
   const old=snapshot(page(),1,{sourceFamily:'FOUR',destinationCode:'FR',sourceKey:'primary'})
   const newer=snapshot(page().replace('synthetic entry procedure','synthetic permit'),2,
      {sourceFamily:'FOUR',destinationCode:'FR',sourceKey:'primary'})
   const r=officialTruthQuellenTextVergleich(old,newer)
   assert.equal(r.status,'research_comparison_only')
   assert.equal(r.status==='research_comparison_only'?r.disposition:null,'VISIBLE_TEXT_CHANGED_REQUIRES_REVIEW')
 })
 test('scope mismatch, adjacent passport or unordered batch may not be compared',()=>{
   const original=snapshot(page(),7)
   for(const next of [
      snapshot(page(),8,{destinationCode:'US'}),
      snapshot(page(),8,{sourceKey:'thai-other'}),
      snapshot(page(),8,{sourceFamily:'FOUR',destinationCode:'FR',sourceKey:'primary'}),
      snapshot(page(),7),
      snapshot(page(),6),
   ]) assert.deepEqual(officialTruthQuellenTextVergleich(original,next),
      {status:'blocked',reason:'unmatched_source_or_sequence'})
 })
 test('changed body bytes and SHA are checked independently against Jetnity originals',()=>{
   const original=snapshot(page())
   for(const changed of [
      snapshot(page(),2,{rawSha:'0'.repeat(64)}),
      snapshot(page(),2,{bodyBytes:1234}),
      snapshot(page(),2,{html:page().replace('synthetic','spoofed')}),
   ]) assert.deepEqual(officialTruthQuellenTextVergleich(original,changed),
      {status:'blocked',reason:'source_hash_or_length_mismatch'})
 })
 test('invalid source identity and suspicious object fields are blocked before parsing',()=>{
   const original=snapshot(page())
   const good=snapshot(page(),2)
   for(const bad of [
      null,[],{...good,sourceKey:'../evil'}, {...good,sourceFamily:'UNKNOWN'},
      {...good,sourceKey:'thai-tdac',sourceFamily:'FOUR',destinationCode:'GB'},
      {...good,sourceKey:'thai-tdac',rawSha:'not-a-hash'}, {...good,batchId:0},
      {...good,acceptedFacts:10}, {...good,publicationAllowed:true}
   ]) assert.deepEqual(officialTruthQuellenTextVergleich(original,bad),
      {status:'blocked',reason:'invalid_snapshot'})
   const getter=Object.defineProperty({...good},'html',{enumerable:true,get(){throw Error('not invoked')}})
   assert.deepEqual(officialTruthQuellenTextVergleich(original,getter),
      {status:'blocked',reason:'invalid_snapshot'})
 })
 test('oversized and content-free government pages are not accepted as comparable',()=>{
   const large=page('x'.repeat(263000))
   const oversized=snapshot(large,2)
   assert.deepEqual(officialTruthQuellenTextVergleich(snapshot(page()),oversized),
      {status:'blocked',reason:'snapshot_bytes_exceeded'})
   const tiny='<!doctype html><html><body><script>no content</script></body></html>'
   assert.deepEqual(result(page(),tiny),
      {status:'blocked',reason:'html_unusable_or_too_complex'})
   const notHtml='This is not an HTML government body with a certified source identity'
   assert.deepEqual(result(page(),notHtml),
      {status:'blocked',reason:'html_unusable_or_too_complex'})
 })
 test('bounded DOM traversal fails closed on excessive fragmented node count',()=>{
   const huge=page().replace('</main>','<div>'+Array.from({length:16000},()=>'<span>x</span>').join('')+'</div></main>')
   assert.ok(Buffer.byteLength(huge,'utf8')<262144)
   const r=result(page(),huge)
   assert.deepEqual(r,{status:'blocked',reason:'html_unusable_or_too_complex'})
 })
 test('this source screen has no provider call, database write, authority or trust bypass',()=>{
   const source=readFileSync(new URL('./official-truth-source-text-diff-v1.ts',import.meta.url),'utf8')
   assert.match(source,/parse, type DefaultTreeAdapterMap/)
   assert.doesNotMatch(source,/\bfetch\s*\(|\bnet\.http_get\s*\(|\bcreateClient\s*\(|process\.env|\bGRANT EXECUTE\b|\bINSERT INTO\b|\bUPDATE\s+public\./)
   assert.match(source,/publicationAllowed: false/)
   assert.match(source,/reviewRequired: true/)
   assert.match(source,/legalRuleApproved: false/)
 })
})
