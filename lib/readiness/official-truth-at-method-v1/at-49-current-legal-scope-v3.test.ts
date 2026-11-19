import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

// No database side effect. True Dev eligibility is separately probed by the
// source-witness SQL and is re-checked at installation and on every read.
const sql=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-49-current-legal-scope-v3.sql',import.meta.url),'utf8')

test('AT 49 fresh official visa source scopes require the exact current BMI original, BG1 and an independently sealed witness',()=>{
 assert.match(sql,/DEV ONLY/)
 assert.match(sql,/dev:yfvbxvijcorffwxbxahl:AT-49-CURRENT-SCOPE-V3/)
 assert.match(sql,/pinned_original_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'/)
 assert.match(sql,/g\.bmi_source_version='2026-11-06'/)
 assert.match(sql,/r\.state='unchanged_exact'/)
 assert.match(sql,/r\.observed_sha=p\.raw_sha/)
 assert.match(sql,/r\.observed_bytes=p\.expected_bytes/)
 assert.match(sql,/s\.outcome='unchanged'/)
 assert.match(sql,/s\.source_batch_id=w\.batch_id/)
 assert.match(sql,/interval '70 minutes'/)
 assert.match(sql,/public\.official_v3_guard_alarm_status_v1\(\)->>'status'='current'/)
 assert.match(sql,/OFFICIAL_SOURCE_CLASS_REVIEWED_CASE_CONDITIONS_PENDING/)
 assert.match(sql,/COUNT\(\*\)/i)
 assert.match(sql,/<>49/)
 assert.match(sql,/AND NOT g\.ma1_owner_authorized/)
 assert.match(sql,/official_v3_guard_private\.assert_catalog_v1\(\)/)
})
test('AT 49 visa evidence is a private security-invoker review, never individual positive Visa, ETA, vaccine or fee publication',()=>{
 assert.match(sql,/WITH \(security_invoker=true\)/)
 assert.match(sql,/REVOKE ALL ON jetnity_legal_review_private\.at_49_current_legal_scope_v3/)
 assert.match(sql,/NULL::date AS rule_legal_valid_from_unproven/)
 assert.match(sql,/NULL::date AS rule_legal_valid_until_unproven/)
 assert.match(sql,/false::boolean AS applicant_documents_examined/)
 assert.match(sql,/false::boolean AS residence_and_family_status_examined/)
 assert.match(sql,/false::boolean AS purpose_route_duration_verified/)
 assert.match(sql,/false::boolean AS legal_fact_issuer_approved/)
 assert.match(sql,/false::boolean AS ma1_owner_aal2_authorized/)
 assert.match(sql,/false::boolean AS visitor_fact_publishable/)
 for(const v of ['personal_visa_result','entry_required_vaccination','entry_recommended_vaccination'])
  assert.ok(sql.includes("'derzeit nicht verfügbar'::text AS "+v))
 assert.match(sql,/independent_airport_transit_review/)
 assert.match(sql,/biometric_caveat/)
 assert.match(sql,/british_category_caveat/)
 assert.match(sql,/bilateral_caveat/)
 assert.match(sql,/AT_49_LEGAL_SCOPE_NOT_SOURCE_CURRENT_PRIVATE_ROLLBACK/)
 assert.doesNotMatch(sql,/\b(?:GRANT EXECUTE|GRANT SELECT|INSERT INTO|UPDATE |DELETE FROM|CREATE ROLE|ALTER FUNCTION|cron\.schedule|DROP TABLE)\b/i)
})
