import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const read=(name:string)=>readFileSync(
  new URL('../../../scripts/db/official-truth-at-production-stage1/'+name,import.meta.url),'utf8')
const hold=read('emergency-hold.sql')
const gate=read('go-live-read-only.sql')

test('Production Austria fail-closed emergency holds only its three new source jobs',()=>{
 assert.match(hold,/AT-EMERGENCY-STOP-1/)
 assert.match(hold,/production:qscbgcdmivbbnzrcyegn/)
 for(const name of ['jetnity-at-production-source-enqueue-v1',
  'jetnity-at-production-source-collect-v1',
  'jetnity-at-production-source-renew-v1']){
  assert.match(hold,new RegExp("cron\\.unschedule\\('"+name+"'\\)"))
 }
 assert.match(hold,/NOT pg_try_advisory_xact_lock/)
 assert.match(hold,/public\.jetnity_source_bound_at_visa_v1\('CH'\)->>'status'<>'unavailable'/)
 assert.match(hold,/public\.jetnity_source_bound_at_visa_v1\('IN'\)->>'status'<>'unavailable'/)
 assert.match(hold,/jetnity-official-truth-production-guard-v1/)
 assert.match(hold,/BEGIN;/)
 assert.match(hold,/COMMIT;\s*$/)
 assert.doesNotMatch(hold,/TRUNCATE|DROP\s|DELETE\s+FROM|UPDATE\s+official_v3_|ALTER ROLE|CREATE ROLE/i)
 assert.doesNotMatch(hold,/cron\.unschedule\('jetnity-official-truth-production-guard-v1'\)/)
})
test('Production readiness is only a bounded read, no implicit go-live',()=>{
 assert.match(gate,/BEGIN READ ONLY;/)
 assert.match(gate,/ROLLBACK;\s*$/)
 assert.match(gate,/AT_PRODUCTION_READ_ONLY_NOT_INSTALLED/)
 assert.match(gate,/guardian/)
 assert.match(gate,/sourceMonitor/)
 assert.match(gate,/swissVisa/)
 assert.match(gate,/unapprovedIndia/)
 assert.match(gate,/ownerMethodApproved/)
 assert.match(gate,/sourceJobCount/)
 assert.match(gate,/'visitorFlagActivationAllowed',false/)
 assert.match(gate,/qscbgcdmivbbnzrcyegn/)
 assert.doesNotMatch(gate,/CREATE TABLE|INSERT INTO|UPDATE |DELETE FROM|DROP TABLE|ALTER ROLE|SET SESSION AUTHORIZATION|GRANT EXECUTE/i)
})
