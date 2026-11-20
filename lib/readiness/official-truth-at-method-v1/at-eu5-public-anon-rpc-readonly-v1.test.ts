import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const s=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-eu5-public-anon-rpc-readonly-v1.sql',import.meta.url),'utf8')
const executable=s.split('\n').filter(line=>!line.trimStart().startsWith('--')).join('\n')
test('EU5 public visitor test is real anon and READ ONLY, never elevates to authenticated owner or performs a mutation',()=>{
 assert.match(executable,/BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY;/)
 assert.match(executable,/SET LOCAL ROLE anon;/)
 assert.match(executable,/SET LOCAL statement_timeout='12s';/)
 assert.ok(executable.trimEnd().endsWith('ROLLBACK;'))
 assert.doesNotMatch(executable,/\b(?:CREATE|INSERT|UPDATE|DELETE|ALTER|GRANT|REVOKE|TRUNCATE|COMMIT)\s/i)
})
test('Both existing public visa RPCs must show all five unavailable without any accepted facts',()=>{
 assert.match(executable,/VALUES \('DE',4\),\('PL',5\),\('IT',6\),\('RO',9\),\('FR',10\)/)
 assert.match(executable,/jetnity_at_visa_v3\(p.code\)/)
 assert.match(executable,/jetnity_source_bound_at_visa_v1\(p.code\)/)
 assert.match(executable,/current_user='anon'/)
 assert.match(executable,/all_five_fails_closed/)
 assert.match(executable,/zero_unapproved_positives/)
 assert.match(executable,/false AS certified_legal_fact/)
 assert.match(executable,/false AS authorized_issuer/)
 assert.match(executable,/false AS permits_publication/)
})
