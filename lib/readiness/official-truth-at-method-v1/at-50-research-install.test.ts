import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-passport-research-50-dev-1/install.sql',import.meta.url),'utf8')

test('AT 50 pass installer is strictly Dev, external original-bound and research-only',()=>{
 assert.match(sql,/^-- Official Truth AT 50-passport RESEARCH_ONLY/)
 assert.match(sql,/SET LOCAL jetnity\.at_dev_target='dev:yfvbxvijcorffwxbxahl:AT-50-RESEARCH-1'/)
 assert.match(sql,/AT_50_RESEARCH_EXACT_DEV_SOURCE_REQUIRED/)
 assert.match(sql,/AT_50_OFFICIAL_MATRIX_STRUCTURE_CHANGED/)
 assert.match(sql,/AT_50_SOURCE_PRIORITY_OR_MATRIX_MISMATCH/)
 assert.match(sql,/official_v3_at_private\.source_current_v3\(\)/)
 assert.match(sql,/4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358/)
 assert.match(sql,/fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778/)
 assert.match(sql,/source_edition date NOT NULL CHECK\(source_edition='2026-11-06'::date\)/)
 assert.match(sql,/official_v3_guard_private\.catalog_status_v1\(\)/)
 assert.match(sql,/official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(sql,/AT_50_RESEARCH_BOUNDARY_CHANGED/)
 assert.match(sql,/accepted_facts integer NOT NULL DEFAULT 0 CHECK\(accepted_facts=0\)/)
 assert.match(sql,/publishing_enabled boolean NOT NULL DEFAULT false CHECK\(publishing_enabled=false\)/)
 assert.match(sql,/status text NOT NULL DEFAULT 'derzeit nicht verfügbar'/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/g)
 assert.match(sql,/REVOKE ALL ON ALL TABLES/)
 assert.match(sql,/CREATE TRIGGER immutable_rows/)
 assert.match(sql,/CREATE TRIGGER immutable_truncate/)
 assert.doesNotMatch(sql,/\bGRANT\s+(?:EXECUTE|SELECT|UPDATE|INSERT|DELETE)\s+.*(?:anon|authenticated|service_role)/i)
 assert.doesNotMatch(sql,/\bALTER\s+TABLE\s+official_v3_(?:guard|result|method|at)_private\./i)
 assert.doesNotMatch(sql,/\bUPDATE\s+official_v3_/i)
 assert.doesNotMatch(sql,/\bINSERT\s+INTO\s+official_v3_/i)
 assert.ok(sql.trimEnd().endsWith('COMMIT;'))
})

test('AT 50 passport priority, one unsupported domestic matrix entry, twenty-six topics',()=>{
 // HTML-encoded national names contain semicolons (e.g. &uuml;): do NOT
 // split this SQL VALUES section on the first semicolon.
 const priorityPart=sql.split('INSERT INTO at_50_priority(rank,code,bmi_html_name) VALUES')[1]
   ?.split('\nCREATE TEMP TABLE at_50_raw')[0]
 assert.ok(priorityPart)
 const passportCodes=[...priorityPart.matchAll(/\((\d+),'([A-Z]{2})','(?:''|[^'])*'\)/g)]
 assert.equal(passportCodes.length,50)
 assert.deepEqual(passportCodes.slice(0,10).map(v=>v[2]),['IN','TR','CN','DE','PL','IT','US','UA','RO','FR'])
 assert.equal(new Set(passportCodes.map(v=>v[2])).size,50)
 assert.ok(passportCodes.some(v=>v[2]==='CH'))
 assert.ok(passportCodes.some(v=>v[2]==='XK'))
 assert.match(sql,/code='AT' AND detail_fragment IS NULL/)
 assert.match(sql,/passport_topics_v1\)<>1300/)
 assert.match(sql,/topic_sources_v1\)<>26/)
 for(const name of ['visa','electronic_travel_authorization','passport_validity','required_vaccinations',
   'recommended_vaccinations','health_measures','entry_forms','form_costs','fraud_warnings',
   'transit','minors','parental_consent','customs','dual_nationals','official_actions']){
   assert.match(sql,new RegExp("\\('"+name+"',"))
 }
 assert.match(sql,/Antragsformular_Visum_C1_Schengenvisum_DE-ES\.pdf/)
 assert.match(sql,/FormServlet\?fid=7306/)
 assert.match(sql,/Drittanbieter können unnötige Zusatzgebühren/)
})
