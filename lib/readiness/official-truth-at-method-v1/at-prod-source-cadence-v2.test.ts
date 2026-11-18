import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const base=new URL('../../../scripts/db/',import.meta.url)
const patch=readFileSync(new URL('official-truth-at-production-schedule-v2/install.sql',base),'utf8')
const original=readFileSync(new URL('official-truth-at-production-stage1/install.sql',base),'utf8')

test('Production AT source cadence v2 pins exactly the already-installed protected predecessor',()=>{
 assert.match(patch,/production:qscbgcdmivbbnzrcyegn:AT-SCHEDULE-GAP-V2/)
 assert.match(patch,/AT_SCHEDULE_V2_PROD_EXACT_PREDECESSOR_REQUIRED/)
 assert.match(patch,/AT_SCHEDULE_V2_UNEXPECTED_CRON_CONFIGURATION/)
 assert.match(patch,/AT_SCHEDULE_V2_POSTCHECK_ROLLBACK/)
 assert.match(patch,/public\.official_v3_guard_alarm_status_v1\(\)->>'status'<>'current'/)
 assert.match(patch,/official_v3_guard_private\.at_source_monitor_baseline_v1/)
 assert.match(patch,/saved_offers_baseline_v1/)
 assert.match(patch,/weather_quota_baseline_v1/)
 assert.match(patch,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(patch,/BEGIN;/)
 assert.match(patch,/COMMIT;\s*$/)
})
test('Cron v2 repairs the two exact jobs without weakening the official-source dedupe or adding roles',()=>{
 assert.match(original,/interval '50 minutes'/)
 assert.match(original,/net\.http_get\(src\.official_url/)
 assert.match(patch,/enqueue_schedule='9 \* \* \* \*'/)
 assert.match(patch,/renewal_schedule='17-59\/5 \* \* \* \*'/)
 assert.match(patch,/enqueue_schedule='\*\/5 \* \* \* \*'/)
 assert.match(patch,/renewal_schedule='2-59\/5 \* \* \* \*'/)
 assert.match(patch,/PERFORM cron\.alter_job\(enqueue_id,schedule=>'\*\/5 \* \* \* \*'\)/)
 assert.match(patch,/PERFORM cron\.alter_job\(renew_id,schedule=>'2-59\/5 \* \* \* \*'\)/)
 assert.match(patch,/jetnity-at-production-source-collect-v1/)
 assert.match(patch,/jetnity-official-truth-production-guard-v1/)
 assert.doesNotMatch(patch,/CREATE ROLE|ALTER ROLE|CREATE TABLE|CREATE FUNCTION|GRANT |REVOKE |DROP |TRUNCATE |DELETE FROM |UPDATE official_v3_|INSERT INTO official_v3_/i)
})
test('50-minute dedupe plus 5-minute retry closes the original phase-collision outage',()=>{
 const minute=60_000
 const tick=5*minute
 function earliestAllowedBatch(startIso:string) {
  const started=Date.parse(startIso)
  const firstTick=Math.ceil((started+50*minute)/tick)*tick
  return firstTick
 }
 const release=earliestAllowedBatch('2026-11-18T00:20:31.533Z')
 assert.equal(new Date(release).toISOString(),'2026-11-18T01:15:00.000Z')
 assert.ok(release-Date.parse('2026-11-18T00:20:31.533Z')<55*minute)
 // At the old single hourly phase (01:09), 48min 29s was too recent.
 assert.ok(Date.parse('2026-11-18T01:09:00Z')-Date.parse('2026-11-18T00:20:31.533Z')<50*minute)
 // After the real 02:09 batch, next eligible sample runs at 03:00,
 // collector at 03:05 and the offset renewal at 03:07.
 const second=earliestAllowedBatch('2026-11-18T02:09:00.031Z')
 assert.equal(new Date(second).toISOString(),'2026-11-18T03:00:00.000Z')
 const collection=second+5*minute,renewal=collection+2*minute
 assert.equal(new Date(renewal).toISOString(),'2026-11-18T03:07:00.000Z')
 assert.ok(renewal<Date.parse('2026-11-18T03:12:09.715Z'))
})


const batchCandidate = readFileSync(
 new URL('official-truth-at-production-schedule-v2/batch-boundary-v3.reference.txt',base), 'utf8'
)

test('P0: the enqueue cadence alone cannot make newest-batch selection safe',()=>{
 // The installed v1 reader intentionally remains unchanged in Production.
 assert.match(original,/CREATE FUNCTION public\.jetnity_source_bound_at_visa_v1/)
 assert.match(original,/SELECT \* INTO b FROM official_v3_at_production_private\.watch_batches_v1\s+ORDER BY batch_id DESC LIMIT 1/)
 assert.match(batchCandidate,/NON-INSTALLABLE REFERENCE/)
 assert.match(batchCandidate,/SELECT \* INTO f FROM official_v3_at_production_private\.ch_visa_facts_v1\s+ORDER BY version_id DESC LIMIT 1/)
 assert.match(batchCandidate,/SELECT \* INTO b FROM official_v3_at_production_private\.watch_batches_v1\s+WHERE batch_id=f\.source_batch_id/)
 assert.doesNotMatch(batchCandidate,/SELECT \* INTO b FROM official_v3_at_production_private\.watch_batches_v1\s+ORDER BY batch_id DESC LIMIT 1/)
 assert.match(batchCandidate,/o\.source_status IN\('changed','unavailable'\)/)
 assert.match(batchCandidate,/newer\.started_at<=instant-interval '6 minutes'/)
 assert.match(batchCandidate,/o\.source_status='changed'/)
 assert.match(batchCandidate,/public\.official_v3_guard_alarm_status_v1\(\)->>'status'<>'current'/)
 assert.match(batchCandidate,/require_current_locked_v1/)
 assert.match(batchCandidate,/signed_sources IS DISTINCT FROM f\.source_digest/)
 assert.match(batchCandidate,/p_citizenship_country_code IS DISTINCT FROM 'CH'/)
 assert.match(batchCandidate,/new immutable BG1 successor/)
})

test('P0: real 03:00 UTC timeline requires a pending-safe but strictly leased successor',()=>{
 const previousBatchAt = Date.parse('2026-11-18T02:09:00.031Z')
 const oldCheckedAt = Date.parse('2026-11-18T02:09:00.200Z')
 const oldFactExpires = Date.parse('2026-11-18T03:12:09.715Z')
 const nextBatchAt = Date.parse('2026-11-18T03:00:00.000Z')
 const pendingAt = Date.parse('2026-11-18T03:00:17.000Z')
 assert.ok(nextBatchAt-previousBatchAt>=50*60_000)
 assert.ok(pendingAt<oldFactExpires && pendingAt<oldCheckedAt+70*60_000)
 type NewerBatch = {at:number; observations: Array<'unchanged'|'changed'|'unavailable'>}
 const decision = (at:number, bg1:boolean, newer:NewerBatch|undefined, factExpiry=oldFactExpires) => {
  if(!bg1||at>=factExpiry||at>=oldCheckedAt+70*60_000) return 'unavailable'
  if(!newer) return 'accepted'
  if(newer.observations.some(x=>x==='changed'||x==='unavailable')) return 'unavailable'
  if(newer.observations.length!==3 && at>=newer.at+6*60_000) return 'unavailable'
  return 'accepted'
 }
 assert.equal(decision(pendingAt,true,{at:nextBatchAt,observations:[]}), 'accepted')
 assert.equal(decision(pendingAt,true,{at:nextBatchAt,observations:['changed']}), 'unavailable')
 assert.equal(decision(pendingAt,true,{at:nextBatchAt,observations:['unavailable']}), 'unavailable')
 assert.equal(decision(nextBatchAt+6*60_000,true,{at:nextBatchAt,observations:[]}), 'unavailable')
 assert.equal(decision(oldFactExpires,true,{at:nextBatchAt,observations:['unchanged','unchanged','unchanged']}), 'unavailable')
 assert.equal(decision(pendingAt,false,{at:nextBatchAt,observations:[]}), 'unavailable')
 // The next authoritatively renewed version is distinct: no old-lease extension.
 assert.equal(decision(Date.parse('2026-11-18T03:07:01Z'),true,undefined,
   Date.parse('2026-11-18T04:07:00Z')), 'accepted')
})
