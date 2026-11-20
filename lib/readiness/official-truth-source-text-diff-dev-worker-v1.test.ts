import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { reviewDevSourceDiff } from './official-truth-source-text-diff-dev-worker-v1'
import {
  parseOnePrivateRow,
  readSelection,
  sourcePairReadSql,
  OFFICIAL_SOURCE_DIFF_DEV_REF,
  type SourceSelection,
} from '@/scripts/official-truth-source-text-diff-dev-v1/read-pair'

const S:SourceSelection={sourceFamily:'SIX',destinationCode:'TH',sourceKey:'thai-tdac'}
const F:SourceSelection={sourceFamily:'FOUR',destinationCode:'IT',sourceKey:'primary'}
const sentence='This example government page states a synthetic travel procedure and no genuine legal visa or passport rules.'
const html=(notice=sentence,extra='')=>
  '<!doctype html><html lang="en"><head><title>Example Authority</title></head><body><main>'+
  '<h1>Synthetic entry notice</h1><p>'+notice+'</p><p>Please consult the correct official government department.</p>'+
  '<a href="/permit">Official online service</a>'+extra+'</main></body></html>'
const sha=(v:string)=>createHash('sha256').update(v,'utf8').digest('hex')
const raw=(v:string)=>Buffer.from(v,'utf8').toString('base64')
function row(
 selection:SourceSelection=S,
 newest:{batch:number,sha:string|null,status:string}={batch:5,sha:'a'.repeat(64),status:'changed_unqualified_snapshot'},
 before=html(),after=html(sentence.replace('synthetic travel procedure','synthetic new arrival procedure')),
) {
 return {
  source_family:selection.sourceFamily,destination_code:selection.destinationCode,source_key:selection.sourceKey,
  old_batch:1,old_sha:sha(before),old_bytes:Buffer.byteLength(before,'utf8'),old_body_base64:raw(before),
  new_batch:4,new_sha:sha(after),new_bytes:Buffer.byteLength(after,'utf8'),new_body_base64:raw(after),
  latest_batch:newest.batch,latest_sha:newest.sha,latest_state:newest.status,
 }
}
function present(selection:SourceSelection=S){
 const r=row(selection)
 const pair=parseOnePrivateRow([r],selection)
 assert.equal((pair as {status:string}).status,'stored_pair')
 return pair
}
describe('Dev source-body worker: audited source-pair reads, no model/no legal truth',()=>{
 test('a historical SIX sample is still research-only and explicitly not current',async()=>{
  const res=await reviewDevSourceDiff(S,async()=>present())
  assert.equal(res.status,'research_only')
  if(res.status!=='research_only')return
  assert.equal(res.currency,'HISTORICAL_SAMPLE_NOT_CURRENT')
  assert.equal(res.disposition,'VISIBLE_TEXT_CHANGED_REQUIRES_REVIEW')
  assert.equal(res.sampledBatchId,4)
  assert.equal(res.latestBatchId,5)
  assert.equal(res.publicationAllowed,false)
  assert.equal(res.legalRuleApproved,false)
  assert.equal(res.acceptedFacts,0)
  assert.equal(res.modelCalls,0)
  assert.equal(res.databaseWrites,0)
  const serialized=JSON.stringify(res)
  for(const material of ['<html','Synthetic entry notice','new arrival procedure','/permit','officialUrl','passportNumber']){
   assert.equal(serialized.includes(material),false,material)
  }
 })
 test('even a confirmed latest sample is NEVER an accepted rule',async()=>{
  const r=row(S,{batch:4,sha:sha(html(sentence.replace('synthetic travel procedure','synthetic new arrival procedure'))),status:'changed_unqualified_snapshot'})
  const res=await reviewDevSourceDiff(S,async()=>parseOnePrivateRow([r],S))
  assert.equal(res.status,'research_only')
  if(res.status!=='research_only')return
  assert.equal(res.currency,'LATEST_SOURCE_SAMPLE_RESEARCH_ONLY')
  assert.equal(res.publicationAllowed,false)
 })
 test('FOUR stream uses its own registered primary identity and cannot mint legal facts',async()=>{
  const r=row(F,{batch:7,sha:sha(html()),status:'changed_requires_review'})
  const res=await reviewDevSourceDiff(F,async()=>parseOnePrivateRow([r],F))
  assert.equal(res.status,'research_only')
  if(res.status!=='research_only')return
  assert.equal(res.currency,'HISTORICAL_SAMPLE_NOT_CURRENT')
  assert.equal(res.sourceFamily,'FOUR')
  assert.equal(res.publicationAllowed,false)
 })
 test('missing official monitor custody, including the FR baseline discrepancy, blocks',async()=>{
  assert.deepEqual(await reviewDevSourceDiff({...F,destinationCode:'FR'},async()=>parseOnePrivateRow([],{...F,destinationCode:'FR'})),
   {status:'blocked',reason:'missing_evidence'})
  assert.deepEqual(await reviewDevSourceDiff(S,async()=>({status:'unavailable'})),
   {status:'blocked',reason:'reader_failed'})
  assert.deepEqual(await reviewDevSourceDiff(S,async()=>{throw Error('Raw SQL error with secrets')}),
   {status:'blocked',reason:'reader_failed'})
 })
 test('invalid source identity never queries the private database',async()=>{
  let readCalls=0
  const reader=async()=>{readCalls++;return present()}
  for(const req of [
    null,{}, {...S,destinationCode:'th'}, {...S,sourceKey:'thai-tdac\';DROP SCHEMA;--'},
    {...F,sourceKey:'not-primary'}, {...S,sourceFamily:'GROK'}, {...S,canPublish:true},
  ]) assert.deepEqual(await reviewDevSourceDiff(req,reader),{status:'blocked',reason:'invalid_request'})
  assert.equal(readCalls,0)
 })
 test('untrusted response scope or extra fields never become a research finding',async()=>{
  const mismatch={...(present() as object),destinationCode:'GB'}
  assert.deepEqual(await reviewDevSourceDiff(S,async()=>mismatch),{status:'blocked',reason:'evidence_mismatch'})
  assert.deepEqual(await reviewDevSourceDiff(S,async()=>({...present() as object,canPublish:true})),
   {status:'blocked',reason:'invalid_evidence'})
  assert.deepEqual(await reviewDevSourceDiff(S,async()=>({...present() as object,publishable:true})),
   {status:'blocked',reason:'invalid_evidence'})
 })
 test('bad base64, digest, body size, sequencing and duplicate SQL rows all fail closed',async()=>{
  const base=row()
  for(const fake of [
   {...base,old_body_base64:'not;base64'},
   {...base,new_body_base64:raw('this is wrong')},
   {...base,old_sha:'0'.repeat(64)},
   {...base,old_bytes:262145},
   {...base,new_batch:1},
   {...base,latest_batch:3},
   {...base,source_key:'other'},
   {...base,qualified:true},
  ]) {
   const unsafe=parseOnePrivateRow([fake],S)
   assert.deepEqual(await reviewDevSourceDiff(S,async()=>unsafe),
     {status:'blocked',reason:unsafe && (unsafe as {status:string}).status==='not_found'
       ? 'missing_evidence'
       : unsafe && (unsafe as {status:string}).status==='unavailable'
         ? 'reader_failed'
         : 'invalid_evidence'})
  }
  assert.deepEqual(parseOnePrivateRow([base,base],S),{status:'not_found'})
 })
 test('the exact Dev target is fixed and the two SQL statements are SELECT only',()=>{
  assert.equal(OFFICIAL_SOURCE_DIFF_DEV_REF,'yfvbxvijcorffwxbxahl')
  for(const source of [S,F]){
   assert.deepEqual(readSelection(source),source)
   const sql=sourcePairReadSql(source)
   assert.ok(sql)
   assert.match(sql,/SELECT/)
   assert.match(sql,/ORDER BY sample\.batch_id DESC LIMIT 1/)
   assert.match(sql,/jetnity_source_body_private\.changed_originals_v1/)
   assert.match(sql,/public\.official_v3_guard_alarm_status_v1\(\)->>'status'='current'/)
   assert.match(sql,/encode\(sample\.original_html,'base64'\)/)
   assert.match(sql,/registered/)
   assert.doesNotMatch(sql,/\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bGRANT\b|\bCOMMIT\b|\bCREATE\b/i)
  }
  assert.match(sourcePairReadSql(F)!,/unqualified_snapshot/)
  assert.match(sourcePairReadSql(F)!,/o\.source_sha256=base\.raw_sha256/)
  assert.match(sourcePairReadSql(S)!,/base\.dest=sample\.destination_code/)
  assert.equal(sourcePairReadSql({...S,sourceKey:'not a key'}),null)
 })
 test('the manual runner refuses production and cannot print original data',()=>{
  const runner=readFileSync(new URL('../../scripts/official-truth-source-text-diff-dev-v1/run-dev.ts',import.meta.url),'utf8')
  assert.match(runner,/process\.env\.SUPABASE_PROJECT_REF!==OFFICIAL_SOURCE_DIFF_DEV_REF/)
  assert.match(runner,/const verified=await ziel\(\)/)
  assert.match(runner,/verified\.ref!==OFFICIAL_SOURCE_DIFF_DEV_REF/)
  assert.match(runner,/process\.argv\.slice\(2\)/)
  assert.match(runner,/parseOnePrivateRow\(rows,selected\)/)
  assert.match(runner,/JSON\.stringify\(result\)/)
  assert.doesNotMatch(runner,/console\.log\(rows|JSON\.stringify\(rows\)|\bUPDATE\s|\bINSERT INTO\b/)
 })
})
