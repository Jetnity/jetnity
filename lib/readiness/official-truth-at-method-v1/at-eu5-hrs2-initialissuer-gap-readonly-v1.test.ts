import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const sql=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-eu5-hrs2-initialissuer-gap-readonly-v1.sql',import.meta.url),'utf8')
const executable=sql.split('\n').filter(line=>!line.trimStart().startsWith('--')).join('\n')

test('EU5 initialissuer review is a read-only transaction, never an issuer or a session witness',()=>{
 assert.match(executable,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;/)
 assert.match(executable,/SET LOCAL statement_timeout = '12s';/)
 assert.match(executable,/ROLLBACK;/)
 assert.doesNotMatch(executable,/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|GRANT|REVOKE|TRUNCATE|CALL|COMMIT)\s/i)
 for(const flag of ['FALSE AS creates_or_renews_fact','FALSE AS witnesses_owner_session',
  'FALSE AS authorizes_method','FALSE AS permits_publication'])
  assert.ok(executable.includes(flag),flag)
 assert.doesNotMatch(executable,/\b(?:auth\.uid|auth\.jwt)\s*\(/i)
})

test('Only the real five EU passports are checked, with unknown states treated as blockers',()=>{
 assert.match(executable,/p\.code IN \('DE','PL','IT','RO','FR'\)/)
 assert.match(executable,/e\.cases<>5 OR e\.codes<>'DE PL IT RO FR'/)
 assert.match(executable,/IS DISTINCT FROM FALSE/)
 assert.match(executable,/accepted_facts IS DISTINCT FROM 0/)
 assert.match(executable,/unapproved_or_unknown_positive<>0/)
 assert.match(executable,/EU5_ORIGINAL_SCOPE_OR_UNAPPROVED_FACT_STOP/)
 assert.match(executable,/EU5_BG1_NOT_CURRENT_STOP/)
})

test('CH to DE HRS2 and the unbound legacy Owner function cannot be reinterpreted as an AT EU5 approval',()=>{
 assert.match(executable,/official_v3_result_private\.binding_v1/)
 assert.match(executable,/destinationCountryCode}'='DE'/)
 assert.match(executable,/countryCodes}'='\["CH"\]'::jsonb/)
 assert.match(executable,/destinationCountryCode}'='AT'/)
 assert.match(executable,/countryCodes}'='\["DE","PL","IT","RO","FR"\]'::jsonb/)
 assert.match(executable,/h\.selected_count<>1 OR h\.selected_ch_de_only IS NOT TRUE OR h\.selected_at_eu5_exact IS TRUE/)
 assert.match(executable,/EU5_HRS2_SCOPE_CHANGED_INDEPENDENT_REVIEW_STOP/)
 assert.match(executable,/jetnity_ot_auth\.require_current_owner_session_v1/)
 assert.match(executable,/public\.darf_official_truth_freigeben/)
 assert.match(executable,/o\.legacy_owner_method_directly_binds_witness IS NOT TRUE/)
 assert.match(executable,/EU5_CH_DE_HRS2_AND_ACTIVE_SESSION_LINK_NOT_READY/)
 assert.match(executable,/EU5_NEEDS_DISTINCT_SOURCE_HRS2_MA1_OWNER_ISSUER/)
})
