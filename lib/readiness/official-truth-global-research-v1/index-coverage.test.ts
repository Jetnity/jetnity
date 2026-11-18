import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-global-research-dev-1/index-coverage.sql',import.meta.url),'utf8')
test('only four exact missing research foreign-key indexes, with PostgreSQL 17 and prior guard',()=>{
 assert.match(sql,/GLOBAL-FK-4-V1/)
 for(const s of [
  'cases_v1\\(citizenship_code,destination_code\\)',
  'cases_v1\\(priority_rank,destination_code\\)',
  'requests_v1\\(dest,source_key,batch_id\\)',
  'first_originals_v1\\(batch_id,dest,source_key\\)',
 ]) assert.match(sql,new RegExp(s))
 assert.match(sql,/i\.indisvalid AND i\.indisready AND i\.indislive/)
 assert.match(sql,/<>4/)
 assert.match(sql,/<>10300/)
 assert.match(sql,/<>11/)
 assert.match(sql,/GLOBAL_4_FK_DEV_INDEX_PREDECESSOR_REFUSED/)
 assert.match(sql,/GLOBAL_4_FK_DEV_INDEX_POSTCHECK_REFUSED/)
})
test('index-only Dev repair leaves all legal truth and private permissions untouched',()=>{
 assert.match(sql,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(sql,/NOT has_table_privilege\('anon'/)
 assert.match(sql,/BEGIN;/)
 assert.match(sql,/COMMIT;\s*$/)
 assert.doesNotMatch(sql,/CREATE POLICY|GRANT EXECUTE|CREATE ROLE|ALTER ROLE|CREATE OR REPLACE FUNCTION|UPDATE official_v3_|INSERT INTO official_v3_|cron\.schedule|TRUNCATE/i)
})
