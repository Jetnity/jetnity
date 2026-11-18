import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-eu-ch-legal-review-dev-1/install.sql',import.meta.url),'utf8')
test('19 original BMI EU/Swiss ordinary-passport visa source candidates are individually scope-bound',()=>{
 assert.match(sql,/AT-EU-CH-19-REVIEW/)
 assert.match(sql,/<>19/)
 for(const i of ['0','1','2','3'])assert.match(sql,new RegExp("raw_matrix_cells->>"+i+"='EU-Freiz"))
 assert.match(sql,/source_edition='2026-11-06'/)
 assert.match(sql,/pinned_primary_sha256/)
 assert.match(sql,/SWISS_EU_FREE_MOVEMENT_AGREEMENT/)
 assert.match(sql,/EU_EEA_FREEDOM_OF_MOVEMENT/)
 assert.match(sql,/ordinary_valid_national_passport/)
 assert.match(sql,/direct_entry/)
 assert.match(sql,/AT_19_OFFICIAL_SOURCE_TOO_OLD/)
})
test('EU/Swiss study can never self-issue, approve method or publish a new passport',()=>{
 assert.match(sql,/NOT_GRANTED_FOR_NEW_SUBJECT/)
 assert.match(sql,/initial_verified_fact boolean NOT NULL DEFAULT false CHECK\(initial_verified_fact=false\)/)
 assert.match(sql,/customer_publication_allowed boolean NOT NULL DEFAULT false CHECK\(customer_publication_allowed=false\)/)
 assert.match(sql,/official_v3_source_renewal_private\.subjects_v1\)<>1/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/BEFORE UPDATE OR DELETE/)
 assert.match(sql,/BEFORE TRUNCATE/)
 assert.match(sql,/REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_at_eu_ch_review_private/)
 assert.match(sql,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;\s*$/)
 assert.doesNotMatch(sql,/GRANT EXECUTE|INSERT INTO official_v3_source_renewal_private|CREATE OR REPLACE FUNCTION public\./i)
})