import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-production-stage1/install.sql',import.meta.url),'utf8')
const source=JSON.parse(readFileSync(new URL('../../../scripts/db/official-truth-at-production-stage1/production-predecessor.json',import.meta.url),'utf8'))

const predecessor={
 'official_v3_guard_alarm_status_v1()':'917a0679562d7b22f22e0c81968b09f3ebc75fbd6ce5a974be41fd75fbcd9923',
 'official_v3_guard_private.assert_catalog_v1()':'0148d8973e0a47e5cfea3906990e19b4075fd18856dbb012e22f426b69587903',
 'official_v3_guard_private.catalog_status_v1()':'edc393042cba779c8a991b228128a46266be6bc41c585375077387cb3f855f81',
 'official_v3_guard_private.require_open_v1()':'db394f5cc4380abc49ce6b5f74308ec9d045101a6ec010391120795050eef0b4'
} as const

test('real Production predecessor exact; DO NOT transplant Dev BG1, weather or saved-offers chain',()=>{
 assert.equal(source.project_ref,'qscbgcdmivbbnzrcyegn')
 assert.equal(source.functions.length,4)
 for(const f of source.functions){
  assert.equal(f.source_sha,(predecessor as Record<string,string>)[f.signature])
  assert.match(f.sql,/CREATE OR REPLACE FUNCTION/)
  assert.doesNotMatch(f.sql,/source_renewal_baseline_v1|cycle4_attempt2_baseline_v1/)
 }
 for(const hash of Object.values(predecessor))assert.ok(sql.includes(hash))
 for(const name of ['weather_quota_baseline_v1','saved_offers_baseline_v1',
   'admin_runtime_baseline_v1','rolling_quota_baseline_v1','status_baseline_v1'])
  assert.ok(sql.includes(name),name)
 assert.match(sql,/AT_PRODUCTION_GUARD_DEFINITION_DRIFT/)
 assert.match(sql,/production:qscbgcdmivbbnzrcyegn:AT-SOURCE-BG1-1/)
 assert.match(sql,/current_setting\('server_version_num'\)::int\/10000<>17/)
 assert.doesNotMatch(sql,/dev:yfvbxvijcorffwxbxahl/)
 assert.match(sql,/^-- Owner-gated Austrian Production source-monitor installation/)
})
test('one candidate installs a complete CH-only pipeline but publishes nothing until Owner/AAL2 MA1',()=>{
 assert.match(sql,/CREATE TABLE official_v3_at_production_private\.ch_visa_facts_v1/)
 assert.match(sql,/CREATE FUNCTION official_v3_at_production_private\.renew_ch_v1\(\)/)
 assert.match(sql,/CREATE FUNCTION public\.jetnity_source_bound_at_visa_v1\(p_citizenship_country_code text\)/)
 assert.match(sql,/p_citizenship_country_code IS DISTINCT FROM 'CH'/)
 assert.match(sql,/public\.jetnity_source_bound_at_visa_v1\('IN'\)->>'status'<>'unavailable'/)
 assert.match(sql,/ch_visa_facts_v1\)<>0/)
 assert.match(sql,/source_batch_id bigint NOT NULL UNIQUE/)
 assert.match(sql,/approved_origin text NOT NULL DEFAULT 'OWNER_METHOD_AND_EXACT_BMI_CH'/)
 assert.match(sql,/require_current_locked_v1\(/)
 assert.match(sql,/f\.method_epoch/)
 assert.match(sql,/method\.epoch<>f\.method_epoch/)
 assert.match(sql,/method_digest/)
 assert.match(sql,/package_digest/)
 assert.match(sql,/source_digest/)
 assert.match(sql,/source_checked_at\+interval '70 minutes'/)
 assert.match(sql,/expires_at<=verified_at\+interval '1 hour'/)
 assert.match(sql,/source_status IN\('unchanged_exact','unchanged_asset_version_only'\)/)
 assert.match(sql,/jetnity-at-production-source-renew-v1/)
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.jetnity_source_bound_at_visa_v1\(text\)\s+TO anon,authenticated/)
 assert.doesNotMatch(sql,/INSERT INTO official_v3_method_private\.heads_v1|INSERT INTO official_v3_at_production_private\.ch_visa_facts_v1\([\s\S]*?VALUES\s*\('CH'/)
 assert.doesNotMatch(sql,/JETNITY_OFFICIAL_AT_PRODUCTION_VISITOR_V1\s*=\s*enabled/)
})
test('official source monitor keeps immutable, small authority history, anti-fake and no auto-publication',()=>{
 for(const name of ['source_pins_v1','watch_batches_v1','watch_requests_v1',
  'watch_observations_v1','first_originals_v1'])
  assert.ok(sql.includes('official_v3_at_production_private.'+name),name)
 assert.match(sql,/CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE/)
 assert.match(sql,/CREATE TRIGGER immutable_truncate BEFORE TRUNCATE/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_at_production_private/)
 assert.match(sql,/REVOKE ALL ON ALL SEQUENCES IN SCHEMA official_v3_at_production_private/)
 assert.match(sql,/on conflict do nothing/i)
 assert.match(sql,/bmeia-theme-assets-v1/)
 assert.match(sql,/cnt=19/)
 assert.match(sql,/PINNED_UNCHANGED_RESEARCH_ONLY/)
 assert.match(sql,/CHANGED_REQUIRES_REVIEW/)
 assert.match(sql,/source_qualified boolean NOT NULL DEFAULT false CHECK\(source_qualified=false\)/)
 assert.match(sql,/legal_source_approved boolean NOT NULL DEFAULT false CHECK\(legal_source_approved=false\)/)
 assert.match(sql,/customer_rule_approved boolean NOT NULL DEFAULT false CHECK\(customer_rule_approved=false\)/)
 assert.match(sql,/http_get\(src\.official_url/)
 assert.match(sql,/net\._http_response/)
 assert.match(sql,/jetnity-at-production-source-enqueue-v1/)
 assert.match(sql,/jetnity-at-production-source-collect-v1/)
 assert.match(sql,/jetnity-at-production-source-renew-v1/)
})
test('BG1 additive successor pins real weather chain and refuses public reads until fresh full proof',()=>{
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
 assert.match(sql,/'reisewetter_reservieren_v1','jetnity_source_bound_at_visa_v1'/)
 assert.match(sql,/BEGIN;/)
 assert.match(sql,/COMMIT;\s*$/)
 assert.doesNotMatch(sql,/TRUNCATE official_v3_guard_private|DROP TABLE public\.saved_offers|DELETE FROM official_v3_guard_private/i)
})
test('all new grant paths are narrow, no owner role or secrets introduced',()=>{
 assert.match(sql,/REVOKE ALL ON FUNCTION official_v3_at_production_private\.renew_ch_v1\(\)/)
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.jetnity_source_bound_at_visa_v1\(text\)/)
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.jetnity_source_bound_at_visa_v1\(text\)/)
 assert.match(sql,/official_v3_guard_private\.immutable_v1\(\)/)
 assert.doesNotMatch(sql,/CREATE ROLE|ALTER ROLE|ALTER USER|CREATE POLICY authenticated_read/i)
 assert.doesNotMatch(sql,/INSERT INTO official_v3_method_private\.heads_v1/)
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION /g)||[]).length,4)
})

test('BMEIA canonical whole-original is the exact live-proven 64-char Dev pin, never a prefix',()=>{
 const canonical='b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
 assert.equal(canonical.length,64)
 assert.equal(sql.split(canonical).length-1,2)
 assert.doesNotMatch(sql,/b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3b67a7a3367052a55/)
 assert.doesNotMatch(sql,/b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3cb67a7a3367052a55/)
})
