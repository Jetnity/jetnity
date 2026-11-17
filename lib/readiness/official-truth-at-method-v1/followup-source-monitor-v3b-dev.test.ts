import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-followup-source-monitor-dev-3b/install.sql',import.meta.url),'utf8')
test('source body gate distinguishes real government page containing captcha text from real Radware challenge',()=>{
 assert.match(sql,/FOLLOWUP-WATCH-3B/)
 assert.match(sql,/collect_v3b\(\)/)
 assert.match(sql,/position\('radware bot manager captcha' IN lower\(resp\.content\)\)=0/)
 assert.doesNotMatch(sql,/position\('captcha' IN lower\(resp\.content\)\)=0/)
 for(const value of ['accesso negato','access denied','radware'])assert.ok(sql.includes(value))
 assert.match(sql,/position\(lower\(rec\.content_marker\) IN lower\(resp\.content\)\)>0/)
 assert.match(sql,/resp\.status_code=200/)
})
test('old append-only observations and all full source/Guard gates remain; only collector cron swapped',()=>{
 assert.match(sql,/observations_v1\)<>4/)
 assert.match(sql,/observations_v2\)<>4/)
 assert.match(sql,/observations_v3\)<>0/)
 assert.match(sql,/cron\.unschedule\('jetnity-followup-government-collect-v3-dev'\)/)
 assert.match(sql,/cron\.schedule\('jetnity-followup-government-collect-v3b-dev'/)
 assert.match(sql,/REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private\.collect_v3b\(\)/)
 assert.match(sql,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(sql,/BEGIN;/)
 assert.match(sql,/COMMIT;\s*$/)
 assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION public\.|GRANT EXECUTE|UPDATE official_v3_/i)
})
