// Prod-only, code-owned exact predecessor snapshot + additive guarded source
// monitor. This contract is NOT an installer or publication authorization.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const sql = readFileSync(new URL('../../../scripts/db/official-truth-at-production-stage1/install.sql',import.meta.url),'utf8')
const snapshot = JSON.parse(readFileSync(new URL('../../../scripts/db/official-truth-at-production-stage1/production-predecessor.json',import.meta.url),'utf8'))
const sha = (s:string)=>createHash('sha256').update(s).digest('hex')
const expected = {
 'official_v3_guard_alarm_status_v1()':'917a0679562d7b22f22e0c81968b09f3ebc75fbd6ce5a974be41fd75fbcd9923',
 'official_v3_guard_private.assert_catalog_v1()':'0148d8973e0a47e5cfea3906990e19b4075fd18856dbb012e22f426b69587903',
 'official_v3_guard_private.catalog_status_v1()':'edc393042cba779c8a991b228128a46266be6bc41c585375077387cb3f855f81',
 'official_v3_guard_private.require_open_v1()':'db394f5cc4380abc49ce6b5f74308ec9d045101a6ec010391120795050eef0b4'
}
test('exact production BG1 predecessor immutable, not the Dev history',()=>{
 assert.equal(snapshot.project_ref,'qscbgcdmivbbnzrcyegn')
 assert.equal(snapshot.functions.length,4)
 for(const f of snapshot.functions){
  assert.equal(f.source_sha,(expected as Record<string,string>)[f.signature])
  assert.equal(typeof f.sql,'string')
  assert.match(f.sql,/CREATE OR REPLACE FUNCTION/)
  assert.doesNotMatch(f.sql,/source_renewal_baseline_v1|cycle4_attempt2_baseline_v1/)
 }
 assert.match(sql,/AT_PRODUCTION_GUARD_DEFINITION_DRIFT/)
 for(const digest of Object.values(expected))assert.ok(sql.includes(digest))
 assert.match(sql,/weather_quota_baseline_v1/)
 assert.match(sql,/saved_offers_baseline_v1/)
 assert.match(sql,/admin_runtime_baseline_v1/)
 assert.match(sql,/rolling_quota_baseline_v1/)
 assert.match(sql,/status_baseline_v1/)
 assert.match(sql,/jetnity-official-truth-production-guard-v1/)
 assert.doesNotMatch(sql,/dev:yfvbxvijcorffwxbxahl/)
})
test('one strict Owner-only production installation, never an implicit publish',()=>{
 assert.match(sql,/^-- Owner-gated Austrian Production source-monitor installation/)
 assert.match(sql,/BEGIN;/)
 assert.match(sql,/COMMIT;\s*$/)
 assert.match(sql,/production:qscbgcdmivbbnzrcyegn:AT-SOURCE-BG1-1/)
 assert.match(sql,/pg_try_advisory_xact_lock\(771112,101\)/)
 assert.match(sql,/to_regprocedure\('public.jetnity_source_bound_at_visa_v1\(text\)'\) IS NOT NULL/)
 assert.match(sql,/research_only boolean NOT NULL DEFAULT true CHECK\(research_only=true\)/)
 assert.match(sql,/source_qualified boolean NOT NULL DEFAULT false CHECK\(source_qualified=false\)/)
 assert.match(sql,/legal_source_approved boolean NOT NULL DEFAULT false CHECK\(legal_source_approved=false\)/)
 assert.match(sql,/customer_rule_approved boolean NOT NULL DEFAULT false CHECK\(customer_rule_approved=false\)/)
 assert.doesNotMatch(sql,/INSERT INTO official_v3_method_private\.heads_v1|INSERT INTO official_v3_source_renewal_private\.facts_v1/)
 assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION public\.jetnity_source_bound_at_visa_v1/)
 assert.doesNotMatch(sql,/JETNITY_OFFICIAL_AT_PRODUCTION_VISITOR_V1\s*=\s*enabled/)
})
test('source history is private immutable and official bytes are not multiplied hourly',()=>{
 assert.match(sql,/official_v3_at_production_private.source_pins_v1/)
 assert.match(sql,/official_v3_at_production_private.watch_batches_v1/)
 assert.match(sql,/official_v3_at_production_private.watch_requests_v1/)
 assert.match(sql,/official_v3_at_production_private.watch_observations_v1/)
 assert.match(sql,/official_v3_at_production_private.first_originals_v1/)
 assert.match(sql,/CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE/)
 assert.match(sql,/CREATE TRIGGER immutable_truncate BEFORE TRUNCATE/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_at_production_private/)
 assert.match(sql,/REVOKE ALL ON ALL SEQUENCES IN SCHEMA official_v3_at_production_private/)
 assert.match(sql,/ON CONFLICT DO NOTHING/)
 assert.match(sql,/unchanged_asset_version_only/)
 assert.match(sql,/cnt=19/)
 assert.match(sql,/PINNED_UNCHANGED_RESEARCH_ONLY/)
 assert.match(sql,/CHANGED_REQUIRES_REVIEW/)
 assert.match(sql,/jetnity-at-production-source-enqueue-v1/)
 assert.match(sql,/jetnity-at-production-source-collect-v1/)
 assert.match(sql,/http_get\(src\.official_url/)
 assert.match(sql,/source_status_v1\(\)/)
})
test('atomic production BG1 successor preserves original weather and saved_offers chain',()=>{
 assert.match(sql,/CREATE TABLE official_v3_guard_private\.at_source_monitor_baseline_v1/)
 assert.match(sql,/predecessor_catalog_digest/)
 assert.match(sql,/predecessor_weather_digest/)
 assert.match(sql,/weather\.catalog/)
 assert.match(sql,/at_prod\.catalog IS DISTINCT FROM official_v3_guard_private\.catalog_status_v1\(\)/)
 assert.match(sql,/greatest\(at_prod\.required_generation,weather\.required_generation,offers\.required_generation/)
 assert.match(sql,/greatest\(at_prod\.proof_not_before,weather\.proof_not_before,offers\.proof_not_before/)
 assert.match(sql,/at_prod\.singleton AND weather\.singleton/)
 assert.match(sql,/s\.generation\+1,clock_timestamp\(\)/)
 assert.match(sql,/public\.official_v3_guard_alarm_status_v1\(\)->>'status'<>'unavailable'/)
 assert.match(sql,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
 // This package must not touch the pre-existing source or weather history.
 assert.doesNotMatch(sql,/TRUNCATE official_v3_guard_private|DROP TABLE public\.saved_offers|DELETE FROM official_v3_guard_private/i)
})
test('predecessor SQL is fully regenerated by owner from the exact read-only production snapshot',()=>{
 const names=['official_v3_guard_private.catalog_status_v1()','official_v3_guard_private.assert_catalog_v1()',
 'official_v3_guard_private.require_open_v1()','official_v3_guard_alarm_status_v1()']
 for(const sig of names) {
  const original=snapshot.functions.find((x:{signature:string})=>x.signature===sig)
  assert.ok(original,sig)
  // The successor carries the original function name, with an additive BG1
  // baseline only; no changed owner, role or grant instructions.
  const name=sig.split('(')[0]
  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION '+(name.startsWith('official_v3_guard_alarm_')?'public.':'')+name))
 }
 assert.equal(sha('normal source evidence is not legal acceptance').length,64)
})
