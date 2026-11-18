import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { AT_V3_METHOD_PREPARATION } from './at-v3-method-preparation'

const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-hrs2-dev-1/candidate.sql',import.meta.url),'utf8')
test('AT HRS2 binds complete originals, approved MA1, fresh BG1 and strict privacy',()=>{
 assert.equal(AT_V3_METHOD_PREPARATION.binding.methodDigest,'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9')
 assert.equal(AT_V3_METHOD_PREPARATION.binding.packageDigest,'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe')
 assert.ok(sql.includes('\nBEGIN;'))
 assert.ok(sql.trimEnd().endsWith('COMMIT;'))
 for(const needle of [
  'official_v3_guard_private.assert_catalog_v1()',
  'official_v3_method_private.require_current_locked_v1(',
  'FORCE ROW LEVEL SECURITY','at_verified_immutable_v3',
  'at_verified_truncate_immutable_v3',
  "source_retrieved_at <= youngest-interval '24 hours'",
  'at_hrs2_exact_dev_predecessor_required',
  'at_hrs2_unreviewed_guard_or_permission_delta',
 ]){
  assert.ok(sql.includes(needle),needle)
 }
 for(const source of AT_V3_METHOD_PREPARATION.sourcePins){
  assert.ok(sql.includes(source.originalSha256),source.publicationId)
  assert.ok(sql.includes(String(source.originalBytes)),source.publicationId)
 }
 assert.ok(!sql.includes('ALTER TABLE official_v3_result_private.originals_v1'))
 assert.ok(!sql.includes('GRANT EXECUTE ON FUNCTION public'))
})
