import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-followup-source-monitor-dev-2/install.sql',import.meta.url),'utf8')
test('real 403 government blocks trigger strictly appended alternative first-party sources',()=>{
 assert.match(sql,/FOLLOWUP-WATCH-2/)
 assert.match(sql,/status='http_unavailable' AND http_code=403/)
 assert.match(sql,/service-public\.gouv\.fr\/particuliers\/vosdroits\/F13512/)
 assert.match(sql,/boe\.es\/eli\/es\/rd\/2007\/02\/16\/240/)
 assert.match(sql,/www\.esteri\.it/)
 assert.match(sql,/www\.gov\.pt/)
 assert.match(sql,/sources_v2/)
 assert.match(sql,/observations_v2/)
 assert.match(sql,/count\(\*\) FROM jetnity_followup_source_monitor_private\.observations_v1\)<>4/)
 assert.match(sql,/cron\.unschedule\('jetnity-followup-government-enqueue-dev-v1'\)/)
 assert.match(sql,/cron\.schedule\('jetnity-followup-government-enqueue-v2-dev'/)
})
test('renewal candidate monitor is private, immutable, and never an approved visa issuer',()=>{
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/BEFORE UPDATE OR DELETE/)
 assert.match(sql,/BEFORE TRUNCATE/)
 assert.match(sql,/source_qualified boolean NOT NULL DEFAULT false CHECK\(source_qualified=false\)/)
 assert.match(sql,/legal_fact_approved boolean NOT NULL DEFAULT false CHECK\(legal_fact_approved=false\)/)
 assert.match(sql,/net\.http_get\(s\.official_url/)
 assert.match(sql,/changed_requires_review/)
 assert.match(sql,/BEGIN;/)
 assert.match(sql,/COMMIT;\s*$/)
 assert.doesNotMatch(sql,/GRANT EXECUTE|CREATE OR REPLACE FUNCTION public\.|INSERT INTO official_v3_source_renewal_private/i)
})