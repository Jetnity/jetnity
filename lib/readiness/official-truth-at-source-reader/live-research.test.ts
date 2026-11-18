import assert from 'node:assert/strict'
import {test} from 'node:test'
import {prepareAtOnlineResearch50} from '../../../scripts/official-truth-at-live-research.ts'
import {AT_OFFICIAL_PUBLICATIONS} from './publications'
import type {AtOfficialTransport} from './transport'
const priority=['IN','TR','CN','DE','PL','IT','US','UA','RO','FR','NL','GB','AT','ES','HU','SY','CZ','AF','CH','RU','HR','BE','IQ','PT','BG','BR','GR','IR','SK','PK','ER','TH','SO','VN','SE','NG','EG','XK','KR','LK','DK','PH','JP','LB','RS','LT','CA','CM','MA','IL']
const csv=['rank,nationality_iso2,name,score_basis,sources,notes',...priority.map((c,i)=>String(i+1)+','+c+',fixture,x,x,x')].join('\n')
test('an official source transport refusal never emits customer facts',async()=>{
 let calls=0
 const offline:AtOfficialTransport=async publication=>{
  calls++;return{ok:false,publicationId:publication.id,reason:'dns_failed'}
 }
 await assert.rejects(prepareAtOnlineResearch50(csv,offline,new AbortController().signal),/AT_RESEARCH_ONLY_REFUSED/)
 assert.equal(calls,1)
})
test('unverified bytes cannot turn three official URLs into a release',async()=>{
 const offline:AtOfficialTransport=async publication=>({
  ok:true,retrieval:{
   publicationId:publication.id,requestUrl:publication.url,finalUrl:publication.url,redirectCount:0,httpStatus:200,
   contentType:'text/html',body:new TextEncoder().encode('<html><title>fake</title></html>'),
   startedAt:'2026-11-16T20:00:00.000Z',retrievedAt:'2026-11-16T20:00:01.000Z',lastModifiedHeader:null
  }
 })
 await assert.rejects(prepareAtOnlineResearch50(csv,offline,new AbortController().signal),/AT_RESEARCH_ONLY_REFUSED/)
})
test('only the exact pinned three Austrian sources participate',()=>{
 assert.deepEqual(AT_OFFICIAL_PUBLICATIONS.map(x=>x.id),['bmi-visa-nationality-matrix','bmi-general-entry','bmeia-bern-how-to-apply'])
})
