import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { AT_V3_METHOD_PREPARATION } from './at-v3-method-preparation'

const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-hrs2-dev-1/candidate.sql',import.meta.url),'utf8')
test('AT HRS2 candidate pins full original custody, MA1, BG1, append-only and private boundary',()=>{
 assert.equal(AT_V3_METHOD_PREPARATION.binding.methodDigest,'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9')
 assert.equal(AT_V3_METHOD_PREPARATION.binding.packageDigest,'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe')
 assert.match(sql,/^BEGIN;[sS]*COMMIT;s*$/)
 assert.match(sql,/official_v3_guard_private.assert_catalog_v1()/)
 assert.match(sql,/official_v3_method_private.require_current_locked_v1(/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/at_verified_immutable_v3/)
 assert.match(sql,/at_verified_truncate_immutable_v3/)
 assert.match(sql,/source_retrieved_at <= youngest-interval '24 hours'/)
 for(const source of AT_V3_METHOD_PREPARATION.sourcePins){
   assert.ok(sql.includes(source.originalSha256),source.publicationId)
   assert.ok(sql.includes(String(source.originalBytes)),source.publicationId)
 }
 assert.doesNotMatch(sql,/ALTER TABLE official_v3_result_private.originals_v1/)
 assert.doesNotMatch(sql,/GRANT EXECUTE .* TO anon/i)
})
