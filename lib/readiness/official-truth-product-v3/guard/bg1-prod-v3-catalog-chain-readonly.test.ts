import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const base='../../../../scripts/db/official-truth-bg1-self-heal-dev-1/'
const check=readFileSync(new URL(base+'production-v3-catalog-chain-readonly.sql',import.meta.url),'utf8')
const candidate=readFileSync(new URL(base+'production-bg1-v3-chain-exact.CANDIDATE-ROLLBACK.sql',import.meta.url),'utf8')
test('Production lineage preflight is strictly read-only and never authorizes release',()=>{
 assert.match(check,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/)
 assert.ok(check.trimEnd().endsWith('ROLLBACK;'))
 assert.doesNotMatch(check,/^\s*COMMIT\s*;/im)
 assert.doesNotMatch(check,/\b(?:CREATE|INSERT|UPDATE|DELETE|ALTER|DROP|GRANT|REVOKE|TRUNCATE)\s+(?:TABLE|ROLE|FUNCTION|SCHEMA|INTO|SET|ON|FROM|\S+)/i)
 assert.match(check,/false AS production_permission_to_resume/)
 assert.match(check,/v3_not_yet_installed/)
 assert.match(check,/fail_closed_before_owner_go/)
})
test('All six complete Production regprocedure SHA pins are copied exactly, not loosened',()=>{
 const rx=/\('((?:official_v3_guard_private|public)\.[a-z0-9_]+\([^']*\))', '([a-f0-9]{64})'\)/g
 const expected=[...candidate.matchAll(rx)].map(x=>x[1]+'='+x[2]).sort()
 const actual=[...check.matchAll(rx)].map(x=>x[1]+'='+x[2]).sort()
 assert.equal(expected.length,6)
 assert.deepEqual(actual,expected)
 assert.match(check,/count\(\*\)=6 AND bool_and\(coalesce\(resolved AND exact,false\)\)/)
})
test('All twelve predecessor links and no unreviewed Dev-only lineages are required',()=>{
 assert.match(check,/all_twelve_links_present/)
 assert.match(check,/all_twelve_links_true/)
 assert.match(check,/at_batch_switch_baseline_v2/)
 assert.match(check,/count\(\*\)=12/)
 assert.doesNotMatch(check,/source_renewal_baseline_v1/)
})
