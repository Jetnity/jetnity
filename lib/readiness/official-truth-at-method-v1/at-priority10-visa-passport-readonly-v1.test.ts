import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-priority10-visa-passport-readonly-v1.sql',import.meta.url),'utf8')

test('Actual source-only top-ten readback binds 10 original ranks and both Visa and passport-validity topics',()=>{
 assert.ok(sql.startsWith('-- Dev ONLY'))
 assert.ok(sql.includes('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;'))
 assert.ok(sql.trimEnd().endsWith('ROLLBACK;'))
 assert.ok(sql.includes('official_v3_source_renewal_private.passport_priority_v1'))
 assert.ok(sql.includes('p.rank BETWEEN 1 AND 10'))
 assert.ok(sql.includes('passport.topic=\'passport_validity\''))
 assert.ok(sql.includes('visa.topic=\'visa\''))
 assert.ok(sql.includes('IN TR CN DE PL IT US UA RO FR'))
 assert.ok(sql.includes('(3,5,2,1,10)'))
 assert.ok(sql.includes('TEN_SOURCE_RULE_BASELINES_CHECKED_PERSONAL_ISSUER_AND_SEAL_PENDING'))
 assert.ok(sql.includes('TOP10_QUALIFICATION_RESEARCH_REFUSED'))
})
test('Source-unchanged witness is separate from a fully sealed latest batch; changed Bern CH-only file is not ignored in publisher seal',()=>{
 assert.ok(sql.includes("r.source_id IN('bmi-visa-nationality-matrix','bmi-general-entry')"))
 assert.ok(sql.includes("r.state='unchanged_exact'"))
 assert.ok(sql.includes("r.observed_sha=pin.raw_sha"))
 assert.ok(sql.includes("r.observed_bytes=pin.expected_bytes"))
 assert.ok(sql.includes("s.source_batch_id=w.id"))
 assert.ok(sql.includes("s.outcome='unchanged'"))
 assert.ok(sql.includes('w.exact_batch_sealed AS complete_monitor_batch_sealed'))
 assert.ok(sql.includes('w.bern_observation_state AS bern_embassy_other_scope_observation'))
 assert.ok(sql.includes("public.official_v3_guard_alarm_status_v1()->>'status'"))
 assert.ok(sql.includes("official_v3_guard_private.assert_catalog_v1()"))
})
test('Third-country 3-month/10-year passport rules and application-only two pages never contaminate EU valid-passport/ID freedom',()=>{
 assert.ok(sql.includes("WHEN ten.bmi_group='F' THEN NULL::integer ELSE 3"))
 assert.ok(sql.includes("WHEN ten.bmi_group='F' THEN NULL::integer ELSE 10"))
 assert.ok(sql.includes("ten.bmi_group='F' AS eu_valid_national_passport_or_qualified_identity_card"))
 assert.ok(sql.includes("ten.bmi_group='F' AS eu_identity_card_2025_1208_security_review"))
 assert.ok(sql.includes("ten.bmi_group='V' AS visa_application_two_blank_pages_not_general_entry"))
 assert.ok(sql.includes("ten.code='UA' AS biometric_ordinary_passport_required_for_waiver"))
})
test('Research cannot issue visas, confirm personal passport expiry, price, owner status, AAL2 or publish',()=>{
 for(const literal of ['false AS actual_presented_passport_and_identity_verified',
 'false AS document_issuance_and_expiry_verified',
 'false AS context_route_residence_and_travel_dates_verified',
 'false AS applicable_legal_rule_issuer_installed',
 'false AS active_owner_session_and_aal2_verified',
 'false AS publication_allowed',
 "'derzeit nicht verfügbar'::text AS personal_visa_answer",
 "'derzeit nicht verfügbar'::text AS personal_document_answer",
 'NULL::text AS personal_official_form',
 'NULL::numeric AS individual_fee'])assert.ok(sql.includes(literal),literal)
 assert.doesNotMatch(sql,/\b(?:CREATE|ALTER|DROP|TRUNCATE|INSERT|UPDATE|DELETE|GRANT|REVOKE)\s+(?:TABLE|VIEW|FUNCTION|INTO|FROM|ROLE|SCHEMA|POLICY)\b/i)
})
