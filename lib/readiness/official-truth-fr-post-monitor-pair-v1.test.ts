// Only synthetic, offline material. Never an accepted French entry rule.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { describe,test } from 'node:test'
import { reviewDevSourceDiff } from './official-truth-source-text-diff-dev-worker-v1'
import {
 FR_LATER_SELECTION,FR_MONITORED_POST_ARCHIVE_SQL,
 parseFrMonitoredPostArchivePair,
} from '@/scripts/official-truth-source-text-diff-dev-v2/fr-later-pair'

const before='<!doctype html><html><head><title>Test government page</title></head><body><main><h1>Example country entry</h1><p>Before: this synthetic statement describes a fake border process, not a travel requirement.</p></main></body></html>'
const after=before.replace('Before: this synthetic statement','After: this synthetic statement')
const sha=(x:string)=>createHash('sha256').update(x,'utf8').digest('hex')
function fixture(){
 return [{
  source_family:'FOUR',destination_code:'FR',source_key:'primary',
  old_batch:23,old_sha:sha(before),old_bytes:Buffer.byteLength(before,'utf8'),old_body_base64:Buffer.from(before,'utf8').toString('base64'),
  new_batch:27,new_sha:sha(after),new_bytes:Buffer.byteLength(after,'utf8'),new_body_base64:Buffer.from(after,'utf8').toString('base64'),
  latest_batch:27,latest_sha:sha(after),latest_state:'changed_requires_review',
 }]
}
describe('French initial archive drift never becomes accepted source law',()=>{
 test('verified post-monitor pair can be classified only as quarantined research',async()=>{
  const pair=parseFrMonitoredPostArchivePair(fixture())
  assert.equal((pair as {status:string}).status,'stored_pair')
  const result=await reviewDevSourceDiff(FR_LATER_SELECTION,async()=>pair)
  assert.equal(result.status,'research_only')
  if(result.status!=='research_only')return
  assert.equal(result.currency,'LATEST_SOURCE_SAMPLE_RESEARCH_ONLY')
  assert.equal(result.disposition,'VISIBLE_TEXT_CHANGED_REQUIRES_REVIEW')
  assert.equal(result.legalRuleApproved,false)
  assert.equal(result.publicationAllowed,false)
  assert.equal(result.acceptedFacts,0)
  assert.equal(result.modelCalls,0)
  assert.equal(result.databaseWrites,0)
  const output=JSON.stringify(result)
  for(const p of ['Example country','fake border','Before:','After:','passportNumber','official_url','original_html']){
   assert.equal(output.includes(p),false,p)
  }
 })
 test('wrong destination, extra fields or missing original are refused',async()=>{
  for(const fake of [
   [], [{...fixture()[0]!,destination_code:'IT'}],
   [{...fixture()[0]!,source_family:'SIX'}],
   [{...fixture()[0]!,source_key:'other'}],
   [{...fixture()[0]!,archive_applies:true}],
   [{...fixture()[0]!,old_body_base64:'BROKEN'}],
   [{...fixture()[0]!,new_sha:'0'.repeat(64)}],
   [{...fixture()[0]!,new_batch:23}],
   [{...fixture()[0]!,latest_batch:23}],
  ]){
   const pair=parseFrMonitoredPostArchivePair(fake)
   const result=await reviewDevSourceDiff(FR_LATER_SELECTION,async()=>pair)
   assert.notEqual(result.status,'research_only')
   assert.equal(result.status,'blocked')
  }
 })
 test('the real SQL has no custody-altering fallback, no new network, no source grants',()=>{
  const sql=FR_MONITORED_POST_ARCHIVE_SQL
  assert.match(sql,/^SELECT 'FOUR'::text AS source_family/)
  assert.match(sql,/sample\.destination_code='FR'/)
  assert.match(sql,/sample\.source_key='primary'/)
  assert.match(sql,/first_monitor\.source_sha256 IS DISTINCT FROM archive\.raw_sha256/)
  assert.match(sql,/first_monitor\.batch_id<sample\.batch_id/)
  assert.match(sql,/latest\.batch_id>sample\.batch_id/)
  assert.match(sql,/registry\.official_url=archive\.official_url/)
  assert.match(sql,/response\.status_code=200/)
  assert.match(sql,/response\.content_type~\*'\^text\/html/)
  assert.match(sql,/encode\(sha256\(convert_to\(response\.content,'UTF8'\)\),'hex'\)=latest\.source_sha256/)
  assert.match(sql,/sample\.raw_sha=encode\(sha256\(sample\.original_html\),'hex'\)/)
  assert.match(sql,/latest\.observed_at>=clock_timestamp\(\)-interval '90 minutes'/)
  assert.match(sql,/public\.official_v3_guard_alarm_status_v1\(\)->>'status'='current'/)
  assert.match(sql,/NOT EXISTS \(/)
  assert.match(sql,/ORDER BY sample\.batch_id DESC LIMIT 1$/)
  assert.doesNotMatch(sql,/\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE|GRANT|TRUNCATE|COMMIT|DROP)\b/i)
  assert.doesNotMatch(sql,/\bnet\.http_get\s*\(|\bnet\.http_post\s*\(/i)
 })
 test('the runnable entrypoint is strictly Dev-bound and returns no text/URL',()=>{
  const program=readFileSync(new URL('../../scripts/official-truth-source-text-diff-dev-v2/run-fr-dev.ts',import.meta.url),'utf8')
  assert.match(program,/process\.env\.SUPABASE_PROJECT_REF!==OFFICIAL_SOURCE_DIFF_DEV_REF/)
  assert.match(program,/const dev=await ziel\(\)/)
  assert.match(program,/dev\.ref!==OFFICIAL_SOURCE_DIFF_DEV_REF/)
  assert.match(program,/reviewDevSourceDiff\(FR_LATER_SELECTION/)
  assert.match(program,/runSql\(FR_MONITORED_POST_ARCHIVE_SQL\)/)
  assert.match(program,/TWO_VERIFIED_POST_MONITOR_OBSERVATIONS_ONLY/)
  assert.match(program,/JSON\.stringify\(safe\)/)
  assert.doesNotMatch(program,/\b(?:fetch|console\.log|console\.error)\s*\(|\b(?:INSERT|UPDATE|DELETE|GRANT)\b|\bOPENAI_API_KEY\b|\bXAI_API_KEY\b/)
 })
})
