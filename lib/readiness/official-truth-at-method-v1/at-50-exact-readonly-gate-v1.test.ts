import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const sql=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-50-exact-readonly-gate-v1.sql',import.meta.url),'utf8')
test('AT50 and EU4 one-snapshot research evidence cannot create or authorize a visitor legal fact',()=>{
 assert.match(sql,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;/)
 assert.match(sql,/ROLLBACK;/)
 assert.match(sql,/AT50_RESEARCH_EXACT_READONLY_PASS_NOT_RELEASE/)
 assert.match(sql,/AT50_RESEARCH_EVIDENCE_REFUSED/)
 assert.match(sql,/individual_legal_release_authorized,false AS production_install_authorized/)
 assert.match(sql,/official_v3_guard_alarm_status_v1/)
 assert.match(sql,/incident_generation<=guard\.resumed_generation/)
 assert.match(sql,/pinned_original_digest<>'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'/)
 assert.match(sql,/\(50,50,20,19,10,1\)/)
 assert.match(sql,/\(50,50,0\)/)
 assert.match(sql,/\(5200,4,30,0\)/)
 assert.match(sql,/required_vaccinations/)
 assert.match(sql,/recommended_vaccinations/)
 assert.match(sql,/destination_code='ES' AND topic='financial_means'/)
 assert.match(sql,/has_schema_privilege\('anon'/)
 assert.doesNotMatch(sql,/^\s*(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|COMMIT|SELECT\s+.*\s+FOR\s+UPDATE)\b/im)
})
