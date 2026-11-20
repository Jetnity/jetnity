import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const root=new URL('../../../scripts/db/official-truth-global-research-dev-1/',import.meta.url)
const v1=readFileSync(new URL('source-monitor-six.sql',root),'utf8')
const v2=readFileSync(new URL('monitor-cadence-v2.sql',root),'utf8')

test('government six-country schedule cannot skip a 50-minute deduplicated source batch for an extra hour',()=>{
 assert.match(v1,/interval '50 minutes'/)
 assert.match(v1,/cron\.schedule\('jetnity-global-gov-six-enqueue-dev','24 \* \* \* \*'/)
 assert.match(v1,/cron\.schedule\('jetnity-global-gov-six-collect-dev','27,32,37,42,47,52,57 \* \* \* \*'/)
 assert.match(v2,/enqueue_schedule='24 \* \* \* \*'/)
 assert.match(v2,/collect_schedule='27,32,37,42,47,52,57 \* \* \* \*'/)
 assert.match(v2,/PERFORM cron\.alter_job\(enqueue_id,schedule=>'\*\/5 \* \* \* \*'\)/)
 assert.match(v2,/PERFORM cron\.alter_job\(collect_id,schedule=>'\*\/5 \* \* \* \*'\)/)
 const minute=60_000
 const started=Date.parse('2026-11-18T01:40:20.000Z')
 const nextEligible=Math.ceil((started+50*minute)/(5*minute))*(5*minute)
 assert.equal(new Date(nextEligible).toISOString(),'2026-11-18T02:35:00.000Z')
 assert.ok(nextEligible-started<55*minute)
 assert.ok(Date.parse('2026-11-18T02:24:00Z')-started<50*minute,
  'old hourly 02:24 batch was deduplicated, then old 03:24 too late')
})
test('only existing Dev cron schedules change; hard-zero research publication and BG1 remain',()=>{
 assert.match(v2,/dev:yfvbxvijcorffwxbxahl:GLOBAL-SIX-SOURCE-CADENCE-V2/)
 assert.match(v2,/GLOBAL_SIX_CADENCE_V2_EXACT_DEV_REQUIRED/)
 assert.match(v2,/GLOBAL_SIX_CADENCE_V2_UNKNOWN_JOB_STATE/)
 assert.match(v2,/GLOBAL_SIX_CADENCE_V2_ROLLBACK/)
 assert.match(v2,/OR \(SELECT count\(\*\) FROM jetnity_global_research_private\.cases_v1\)<>10300/)
 assert.match(v2,/OR \(SELECT count\(\*\) FROM jetnity_global_source_monitor_private\.sources_v1\)<>11/)
 assert.match(v2,/OR \(SELECT count\(DISTINCT dest\) FROM jetnity_global_source_monitor_private\.sources_v1\)<>6/)
 assert.match(v2,/publication_allowed OR accepted_fact_count<>0/)
 assert.match(v2,/official_v3_source_renewal_private\.subjects_v1/)
 assert.match(v2,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(v2,/BEGIN;/)
 assert.match(v2,/COMMIT;\s*$/)
 assert.doesNotMatch(v2,/CREATE ROLE|ALTER ROLE|CREATE TABLE|CREATE FUNCTION|GRANT |REVOKE |DROP |TRUNCATE |DELETE FROM |UPDATE\s+official_v3_|INSERT INTO\s+official_v3_/i)
})
