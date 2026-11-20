import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-eu5-owner-session-hrs2-scope-negative.ROLLBACK.sql',import.meta.url),'utf8')
const executable=sql.split('\n').filter(line=>!line.trimStart().startsWith('--')).join('\n')
test('EU5 issuer Owner-session PG17 proof is Dev-only and always rolled back',()=>{
 assert.match(executable,/^BEGIN;$/m)
 assert.ok(executable.trimEnd().endsWith('ROLLBACK;'))
 assert.doesNotMatch(executable,/^\s*COMMIT\s*;/im)
 assert.match(executable,/to_regclass\('official_v3_guard_private\.source_renewal_baseline_v1'\) IS NULL/)
 assert.match(executable,/to_regclass\('official_v3_guard_private\.at_batch_switch_baseline_v2'\) IS NOT NULL/)
 assert.match(executable,/auth\.uid\(\) IS NOT NULL/)
 assert.match(executable,/CREATE FUNCTION pg_temp\.at_eu5_initialissuer_owner_scope_gate_v1/)
 assert.match(executable,/LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog/)
 assert.match(executable,/REVOKE ALL ON FUNCTION pg_temp\.at_eu5_initialissuer_owner_scope_gate_v1/)
 assert.doesNotMatch(executable,/\bALTER ROLE\b|GRANT EXECUTE|INSERT INTO official_v3_result_private|UPDATE official_v3_guard_private|CREATE TABLE|UPDATE jetnity_legal_review_private/i)
})
test('No EU5 country or national ID bypasses real session witness and distinct HRS2 binding',()=>{
 assert.match(executable,/PERFORM jetnity_ot_auth\.require_current_owner_session_v1\(\)/)
 assert.match(executable,/p_country NOT IN \('DE','PL','IT','RO','FR'\)/)
 assert.match(executable,/national_eu_identity_card/)
 assert.match(executable,/\["DE","PL","IT","RO","FR"\]/)
 assert.match(executable,/b\.binding#>>'\{context,scope,destinationCountryCode\}'='AT'/)
 assert.match(executable,/AT EU5 source-bound HRS2 MA1 Owner issuer not installed/)
 assert.match(executable,/FOREACH c IN ARRAY ARRAY\['DE','PL','IT','RO','FR','ZZ'\]/)
 assert.match(executable,/IF refusals<>12/)
 assert.match(executable,/FALSE AS creates_fact,FALSE AS approves_method,FALSE AS publishes/)
 assert.match(executable,/DEV_AT_EU5_OWNER_HRS2_NEGATIVE_PG17_ROLLBACK_PASS/)
})
