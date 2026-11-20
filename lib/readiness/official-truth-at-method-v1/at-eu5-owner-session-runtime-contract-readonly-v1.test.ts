import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const sql=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-eu5-owner-session-runtime-contract-readonly-v1.sql',import.meta.url),'utf8')
const executable=sql.split('\n').filter(line=>!line.trimStart().startsWith('--')).join('\n')

test('AT EU5 runtime session/MA1/HRS2 preflight is strictly read-only, no owner/visa issuer',()=>{
 assert.match(executable,/^BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;/m)
 assert.match(executable,/^ROLLBACK;/m)
 assert.doesNotMatch(executable,/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|GRANT|REVOKE|TRUNCATE|CALL|COMMIT)\s/i)
 for(const f of ['FALSE AS legal_issuer_installed','FALSE AS owner_aal2_witnessed',
  'FALSE AS positive_visa_or_passport_rule_allowed','FALSE AS visitor_published'])
  assert.ok(executable.includes(f),f)
})
test('AT EU5 needs real independent Session+MA1+HRS2, never CH-only or synthetic witness',()=>{
 for(const f of ['require_current_owner_session_v1','own_active_session_v1','auth.sessions',
  "p.status=''active''",'u.deleted_at is null','u.banned_until',
  "s.aal::text=''aal2''",'s.not_after',"claims->>''exp''",'for share nowait',
  'ma1_bound_to_current_owner_session','eu5_at_hrs2_binding_count',
  'ch_de_hrs2_binding_count','eu5_positive_method_count',
  'RESEARCH_ONLY_AT_EU5_SOURCE_HRS2_MA1_OWNER_DOCUMENT_E2E_MISSING'])
  assert.ok(sql.includes(f),f)
 assert.match(sql,/\["DE","PL","IT","RO","FR"\]/)
 assert.match(sql,/\["CH"\]/)
 assert.doesNotMatch(executable,/\bSET\s+ROLE\b|\bSET\s+SESSION\s+AUTHORIZATION\b/i)
})
