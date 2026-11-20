import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const sql=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-priority10-owner-issuer-preflight-readonly-v1.sql',import.meta.url),'utf8')
const executable=sql.split('\n').filter(line=>!line.trimStart().startsWith('--')).join('\n')

test('AT10 issuer preflight cannot mutate Dev or Production or approve a rule',()=>{
 assert.match(executable,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;/)
 assert.match(executable,/SET LOCAL statement_timeout = '12s';/)
 assert.match(executable,/ROLLBACK;/)
 assert.doesNotMatch(executable,/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|GRANT|REVOKE|TRUNCATE|CALL|COMMIT)\s/i)
 for(const expression of ['FALSE AS permits_new_visa_or_passport_fact',
  'FALSE AS acts_as_owner_session_witness','FALSE AS permits_method_approval',
  'FALSE AS permits_publication'])assert.ok(executable.includes(expression))
})

test('Only ten exact passports with EU5 separate, accepted visa and passport facts both fail closed',()=>{
 assert.match(executable,/p\.rank BETWEEN 1 AND 10/)
 assert.match(executable,/IN TR CN DE PL IT US UA RO FR/)
 assert.match(executable,/DE','PL','IT','RO','FR/)
 assert.match(executable,/a\.eu5_rows<>5/)
 for(const flag of ['visa_legal IS TRUE','document_legal IS TRUE','visa_published IS TRUE',
  'document_published IS TRUE','candidate_legal IS TRUE','candidate_ma1 IS TRUE',
  'candidate_owner IS TRUE','candidate_published IS TRUE'])
  assert.ok(executable.includes(flag),flag)
 assert.match(executable,/UNAPPROVED_POSITIVE_FACT_STOP/)
 assert.match(executable,/DEV_BG1_NOT_CURRENT_STOP/)
})

test('Presence of an Owner/session function is not treated as its actual wiring or a signed session',()=>{
 assert.match(executable,/jetnity_ot_auth\.require_current_owner_session_v1/)
 assert.match(executable,/public\.darf_official_truth_freigeben/)
 assert.match(executable,/legacy_ma1_owner_gate_bound_to_session_witness/)
 assert.match(executable,/RESEARCH_ONLY_OWNER_SESSION_METHOD_WIRING_UNPROVEN/)
 assert.match(executable,/RESEARCH_ONLY_NEEDS_SEPARATE_SOURCE_HRS2_MA1_OWNER_AND_E2E/)
 assert.doesNotMatch(executable,/\bauth\.uid\s*\(|\bauth\.jwt\s*\(/i)
})
