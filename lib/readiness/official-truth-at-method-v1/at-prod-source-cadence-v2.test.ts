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
