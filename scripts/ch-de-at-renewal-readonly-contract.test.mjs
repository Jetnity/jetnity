import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const path=new URL('../scripts/db/official-truth-bg1-self-heal-dev-1/ch-de-at-renewal-preflight.READONLY.sql',import.meta.url)
const sql=readFileSync(path,'utf8')
const runnable=sql.split('\n').filter(x=>!x.trimStart().startsWith('--')).join('\n')
test('Renewal diagnostic is read-only and cannot reset pg_net or override guarded CHDE import',()=>{
 assert.match(runnable,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;/)
 assert.ok(runnable.trim().endsWith('ROLLBACK;'))
 assert.doesNotMatch(runnable,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|GRANT|REVOKE|CREATE|DROP|COMMIT|SETVAL|NEXTVAL)\s*\(/i)
 assert.doesNotMatch(runnable,/\b(?:ALTER|INSERT|UPDATE|DELETE|CREATE|DROP|GRANT|REVOKE|COMMIT|TRUNCATE)\s+/i)
 assert.match(runnable,/pg_sequences/)
 assert.match(runnable,/watch_requests_v1/)
 assert.match(runnable,/ch_de_latest_cycle_outcome/)
 assert.match(runnable,/at_request_id_collision_risk/)
 assert.match(runnable,/FALSE AS authorizes_sequence_repair/)
 assert.match(runnable,/FALSE AS authorizes_visa_publication/)
})
