import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-europe-four-research-50-dev-1/install.sql',import.meta.url),'utf8')
test('four European destinations follow exact 50-pass itinerary in private Dev-only, never Official Truth',()=>{
 assert.match(sql,/^-- IT -> FR -> ES -> PT 50-passport/)
 assert.match(sql,/SET LOCAL jetnity.followup_dev_target='dev:yfvbxvijcorffwxbxahl:EUROPE-4-50-RESEARCH-1'/)
 assert.match(sql,/EUROPE_4_EXACT_DEV_RESEARCH_PREDECESSOR_REQUIRED/)
 assert.match(sql,/200/)
 assert.match(sql,/5200/)
 assert.match(sql,/RESEARCH_ONLY/)
 assert.match(sql,/official_v3_guard_private.assert_catalog_v1/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/status='derzeit nicht verfügbar'|state='derzeit nicht verfügbar'/)
 assert.match(sql,/4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358/)
 assert.match(sql,/6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5/)
 assert.match(sql,/REVOKE ALL ON ALL TABLES/)
 assert.doesNotMatch(sql,/UPDATE official_v3_/)
 assert.doesNotMatch(sql,/INSERT INTO official_v3_/)
 assert.doesNotMatch(sql,/ALTER TABLE official_v3_/)
 assert.ok(sql.trimEnd().endsWith('COMMIT;'))
})
