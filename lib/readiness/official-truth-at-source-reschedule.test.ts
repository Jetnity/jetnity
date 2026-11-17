import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const sql=readFileSync(new URL('../../scripts/db/official-truth-at-source-watch-dev-1/reschedule-enqueue.sql',import.meta.url),'utf8')
const existing=readFileSync(new URL('../../scripts/db/official-truth-at-source-watch-dev-1/install.sql',import.meta.url),'utf8')

test('AT source monitoring: shortened scheduler polling never bypasses 50-minute network cap',()=>{
 assert.match(existing,/clock_timestamp\(\)-interval '50 minutes'/)
 assert.match(sql,/DEV ONLY/)
 assert.match(sql,/server_version_num/)
 assert.match(sql,/dev:yfvbxvijcorffwxbxahl:AT-WATCH-SCHEDULE-1/)
 assert.match(sql,/jetnity-at-source-enqueue-dev-v1','\/5 \* \* \* \*'/)
 assert.match(sql,/jetnity-at-source-collect-dev-v1/)
 assert.match(sql,/official_v3_guard_private.assert_catalog_v1\(\)/)
 assert.match(sql,/official_v3_guard_private.catalog_status_v1\(\)/)
 assert.match(sql,/IS DISTINCT FROM \(SELECT catalog FROM at_source_watch_before\)/)
 assert.match(sql,/pg_try_advisory_xact_lock\(771108,3\)/)
 assert.doesNotMatch(sql,/(INSERT INTO|UPDATE|DELETE FROM)\s+(official_v3_at_private|official_v3_method_private|official_v3_guard_private)\./i)
 assert.doesNotMatch(sql,/GRANT\s+.*\s+TO\s+(anon|authenticated|service_role)/i)
 assert.ok(sql.trimEnd().endsWith('COMMIT;'))
})
