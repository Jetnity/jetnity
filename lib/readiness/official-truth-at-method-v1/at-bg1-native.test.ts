import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-bg1-dev-1/candidate.sql',import.meta.url),'utf8')
test('AT BG1 successor is confined to Dev, actual source custody and one visitor read',()=>{
 assert.match(sql,/^-- Isolated Dev only/)
 assert.match(sql,/SET LOCAL search_path=pg_catalog/)
 assert.match(sql,/at_bg1_dev_predecessor_not_ready/)
 assert.match(sql,/CREATE TABLE official_v3_guard_private.at_hrs2_baseline_v1/)
 assert.match(sql,/CREATE FUNCTION public.jetnity_at_visa_v3/)
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public.jetnity_at_visa_v3\(text\) TO anon,authenticated/)
 assert.match(sql,/at_baseline.required_generation/)
 assert.match(sql,/at_baseline.proof_not_before/)
 assert.match(sql,/official_v3_guard_private.assert_catalog_v1\(\)/)
 assert.match(sql,/at_bg1_next_real_full_proof_required/)
 assert.match(sql,/at_bg1_predecessor_catalog_changed/)
 assert.doesNotMatch(sql,/ALTER TABLE official_v3_result_private.originals_v1/)
 assert.doesNotMatch(sql,/INSERT INTO official_v3_method_private.heads_v1/)
 assert.doesNotMatch(sql,/UPDATE official_v3_guard_private.state_v1/)
 assert.match(sql,/COMMIT;\s*$/)
})
