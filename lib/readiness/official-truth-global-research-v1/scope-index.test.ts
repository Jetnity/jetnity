// Native scope regression. The full legal research records remain external,
// unapproved; only a safe private candidate matrix is materialized in Dev.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-global-research-dev-1/install.sql',import.meta.url),'utf8')

test('206 destination scope includes Chinese special administrative territories separately, never as passports',()=>{
 assert.match(sql,/GLOBAL-206X50-RESEARCH-V1/)
 assert.match(sql,/cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123/)
 assert.match(sql,/CN-HK,CN-MO/)
 assert.match(sql,/destination_code~'\^\[A-Z\]\{2\}\(-\[A-Z\]\{2\}\)\?\$'/)
 assert.match(sql,/citizenship_code~'\^\[A-Z\]\{2\}\$'/)
 assert.match(sql,/archive_slice_count=51/)
 assert.match(sql,/<>9/)
 assert.match(sql,/AMBIGUOUS_UNSPLIT_V2_2_INDEX/)
 assert.match(sql,/<>206/)
 assert.match(sql,/<>10300/)
})
test('all 50 independently ranked passports have 26 private fail-closed topics each',()=>{
 assert.match(sql,/official_v3_source_renewal_private\.passport_priority_v1/)
 assert.match(sql,/<>50/)
 assert.match(sql,/<>26/)
 assert.match(sql,/<>267800/)
 assert.match(sql,/WITH \(security_invoker=true\)/)
 assert.match(sql,/customer_status text NOT NULL DEFAULT 'derzeit nicht verfügbar'/)
 assert.match(sql,/publication_allowed boolean NOT NULL DEFAULT false/)
 assert.match(sql,/primary_source_verified boolean NOT NULL DEFAULT false/)
 assert.match(sql,/legal_rule_qualified boolean NOT NULL DEFAULT false/)
 assert.match(sql,/accepted_fact_count integer NOT NULL DEFAULT 0/)
 assert.match(sql,/RESEARCH_ONLY_UNVERIFIED_CONTENT/)
})
test('source archive identity preserved but cannot auto-import research into official truth',()=>{
 for(const hash of [
  '4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d',
  '6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5',
  '33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153',
  '4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358',
 ]) assert.match(sql,new RegExp(hash))
 assert.match(sql,/GLOBAL_206X50_DEV_RESEARCH_SOURCE_SCOPE_REFUSED/)
 assert.match(sql,/GLOBAL_206X50_PRIVATE_RESEARCH_IMPORT_POSTCHECK_REFUSED/)
 assert.match(sql,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/immutable_rows BEFORE UPDATE OR DELETE/)
 assert.match(sql,/immutable_truncate BEFORE TRUNCATE/)
 assert.match(sql,/REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_global_research_private/)
 assert.match(sql,/REVOKE ALL ON SCHEMA jetnity_global_research_private/)
 assert.match(sql,/BEGIN;/)
 assert.match(sql,/COMMIT;\s*$/)
 assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION public\.|GRANT EXECUTE|INSERT INTO official_v3_source_renewal_private|CREATE ROLE|ALTER ROLE|cron\.schedule/i)
})
