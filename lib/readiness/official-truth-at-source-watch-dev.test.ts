import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const sql=readFileSync(new URL('../../scripts/db/official-truth-at-source-watch-dev-1/install.sql',import.meta.url),'utf8')
test('AT Source Watch V1: only Dev, fixed official sources, PG17 and BG1 preflight',()=>{
 assert.match(sql,/DEV ONLY/)
 assert.match(sql,/dev:yfvbxvijcorffwxbxahl:AT-SOURCE-WATCH-1/)
 assert.match(sql,/server_version_num/)
 assert.match(sql,/official_v3_guard_private.assert_catalog_v1\(\)/)
 assert.match(sql,/source_current_v3\(\)/)
 for(const host of ['www.bmi.gv.at','www.bmeia.gv.at'])assert.ok(sql.includes(host))
 assert.match(sql,/bmi-visa-nationality-matrix/)
 assert.match(sql,/bmi-general-entry/)
 assert.match(sql,/bmeia-bern-how-to-apply/)
})
test('AT Source Watch V1: hourly and 5-minute pending poll; never writes truth',()=>{
 assert.match(sql,/jetnity-at-source-enqueue-dev-v1','9 \* \* \* \*'/)
 assert.match(sql,/jetnity-at-source-collect-dev-v1','\*\/5 \* \* \* \*'/)
 assert.match(sql,/unchanged_asset_version_only/)
 assert.match(sql,/asset_count=19/)
 assert.match(sql,/PINNED_UNCHANGED_NOT_APPROVED/)
 assert.match(sql,/CHANGED_REQUIRES_REVIEW/)
 assert.match(sql,/SOURCE_UNAVAILABLE/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/REVOKE ALL ON ALL FUNCTIONS/)
 assert.doesNotMatch(sql,/(INSERT INTO|UPDATE|DELETE FROM)\s+(official_v3_at_private|official_v3_method_private|official_v3_guard_private)\./i)
 assert.doesNotMatch(sql,/GRANT\s+.*\s+TO\s+(anon|authenticated|service_role)/i)
 assert.match(sql,/COMMIT;[\s\S]*$/)
})
