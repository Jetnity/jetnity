-- PREPARED ONLY. Separate future OWNER-GO required for Production V2 rollback.
-- Stop CH→AT v2 only; preserve old V1/qualified V2 immutable history, CHDE and HTTP allocator.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='40s';
SET LOCAL lock_timeout='1s';
SET LOCAL idle_in_transaction_session_timeout='45s';
SET LOCAL jetnity.at_prod_ch_v2_rollback_target='production:qscbgcdmivbbnzrcyegn:CH_AT_V2_ROLLBACK_V6';
DO $pre$
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>session_user
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.at_prod_ch_v2_rollback_target',true)
   IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:CH_AT_V2_ROLLBACK_V6'
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_qualified_v5') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_rollback_v6') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.ch_visa_facts_v2') IS NULL
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR (SELECT catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
     FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 WHERE singleton)
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND jobname='jetnity-at-production-source-qualified-renew-v2'
     AND command='SELECT official_v3_at_production_private.renew_ch_v2()')<>1
 OR NOT pg_try_advisory_xact_lock(771106,1)
 OR NOT pg_try_advisory_xact_lock(771112,22)
 THEN RAISE EXCEPTION 'AT_CH_V2_PROD_ROLLBACK_PRECONDITION_STOP' USING ERRCODE='P7905';END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
DO $unschedule$
BEGIN
 IF NOT cron.unschedule('jetnity-at-production-source-qualified-renew-v2')
 THEN RAISE EXCEPTION 'AT_CH_V2_ROLLBACK_NEW_CRON_NOT_REMOVED' USING ERRCODE='P7905'; END IF;
END $unschedule$;
-- Never restore a possibly stale V1 rule. Fail closed for all passports,
-- regardless of a historical Owner Rev1/Rev2 state, until new scoped review.
CREATE OR REPLACE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $closed$
BEGIN
 RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
END $closed$;
CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_rollback_v6(
 singleton boolean PRIMARY KEY CHECK(singleton),
 predecessor_catalog_digest text NOT NULL,
 predecessor_baseline_digest text NOT NULL,
 required_generation bigint NOT NULL,
 proof_not_before timestamptz NOT NULL,
 reason text NOT NULL CHECK(reason='CH_AT_V2_OWNER_GO_ROLLBACK_DEFAULT_CLOSED'),
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_rollback_v6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_rollback_v6 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_prod_ch_at_rollback_v6 TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON official_v3_guard_private.bg1_prod_ch_at_rollback_v6 FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION official_v3_guard_private.at_v6_bootstrap_immutable()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $immutable$
BEGIN
 IF TG_OP='UPDATE' AND OLD.catalog='{}'::jsonb AND NEW.catalog<>'{}'::jsonb
 AND NEW.predecessor_catalog_digest IS NOT DISTINCT FROM OLD.predecessor_catalog_digest
 AND NEW.predecessor_baseline_digest IS NOT DISTINCT FROM OLD.predecessor_baseline_digest
 AND NEW.required_generation IS NOT DISTINCT FROM OLD.required_generation
 AND NEW.proof_not_before IS NOT DISTINCT FROM OLD.proof_not_before
 AND NEW.reason IS NOT DISTINCT FROM OLD.reason
 AND current_user='postgres' AND session_user='postgres' THEN RETURN NEW;
 END IF;
 RAISE EXCEPTION 'CH_AT_PROD_V6_APPEND_ONLY_ROLLBACK_BASELINE' USING ERRCODE='P7905';
END $immutable$;
REVOKE ALL ON FUNCTION official_v3_guard_private.at_v6_bootstrap_immutable() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER at_v6_immutable BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_prod_ch_at_rollback_v6
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.at_v6_bootstrap_immutable();
CREATE TRIGGER at_v6_no_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_prod_ch_at_rollback_v6
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.at_v6_bootstrap_immutable();
INSERT INTO official_v3_guard_private.bg1_prod_ch_at_rollback_v6(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,required_generation,proof_not_before,reason,catalog)
SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',
 extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 s.generation+1,clock_timestamp(),'CH_AT_V2_OWNER_GO_ROLLBACK_DEFAULT_CLOSED','{}'::jsonb
FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 v
CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton;
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE ch_at_v6 official_v3_guard_private.bg1_prod_ch_at_rollback_v6%ROWTYPE;
 ch_at_v5 official_v3_guard_private.bg1_prod_ch_at_qualified_v5%ROWTYPE;
 allocator_v4 official_v3_guard_private.bg1_production_http_allocator_v4%ROWTYPE;
 optimized official_v3_guard_private.query_cost_baseline_v1%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 official_v3_guard_private.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT ch_at_v6 FROM official_v3_guard_private.bg1_prod_ch_at_rollback_v6 WHERE singleton;
  SELECT * INTO STRICT ch_at_v5 FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 WHERE singleton;
  SELECT * INTO STRICT allocator_v4 FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton;
  SELECT * INTO STRICT optimized FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
  SELECT * INTO STRICT weather FROM official_v3_guard_private.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM official_v3_guard_private.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM official_v3_guard_private.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM official_v3_guard_private.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR admin.predecessor_provider_digest<>'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a'
    OR admin.definition_digest<>'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR offers.migration_blob IS DISTINCT FROM '667766f5455ff2460f4eb56f04c7a62c84ca9e05'
    OR offers.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR offers.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR weather.candidate_sha256 IS DISTINCT FROM '9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae'
    OR weather.predecessor_sha256 IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(offers)||jsonb_build_object('proof_not_before',extract(epoch FROM offers.proof_not_before)))::text,'UTF8')),'hex')
    OR at_prod.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(weather.catalog::text,'UTF8')),'hex')
    OR at_prod.predecessor_weather_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(weather)||jsonb_build_object('proof_not_before',extract(epoch FROM weather.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.predecessor_catalog_digest IS DISTINCT FROM
      encode(sha256(convert_to(at_prod.catalog::text,'UTF8')),'hex')
    OR switch_v2.predecessor_baseline_digest IS DISTINCT FROM
      encode(sha256(convert_to((to_jsonb(at_prod)||jsonb_build_object(
        'proof_not_before',extract(epoch FROM at_prod.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.required_generation<=at_prod.required_generation
    OR switch_v2.proof_not_before<at_prod.proof_not_before
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(switch_v2.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(switch_v2)||jsonb_build_object('proof_not_before',extract(epoch FROM switch_v2.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=switch_v2.required_generation OR bg1_v3.proof_not_before<=switch_v2.proof_not_before
 OR optimized.algorithm IS DISTINCT FROM 'jsonb_unique_narrow_dependency_distinct_v1'
 OR optimized.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR optimized.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)
   ||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to(to_jsonb(optimized)::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
 OR allocator_v4.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.transport_metadata::text,'UTF8')),'hex')
 OR allocator_v4.transport_metadata IS DISTINCT FROM (official_v3_guard_private.catalog_status_v1()->'transport:production_http_id_allocator_v4')
 OR ch_at_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.catalog::text,'UTF8')),'hex')
 OR ch_at_v5.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(allocator_v4)
       ||jsonb_build_object('proof_not_before',extract(epoch FROM allocator_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR ch_at_v5.required_generation<=allocator_v4.required_generation
 OR ch_at_v5.proof_not_before<=allocator_v4.proof_not_before
 OR ch_at_v5.qualified_source_digest IS DISTINCT FROM (
    SELECT encode(sha256(convert_to(string_agg(source_id||':'||accepted_sha||':'||accepted_bytes::text||':'||
      expected_watch_state,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM official_v3_at_production_private.ch_source_qualifications_v2)
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR ch_at_v6.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(ch_at_v5.catalog::text,'UTF8')),'hex')
 OR ch_at_v6.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(ch_at_v5)
       ||jsonb_build_object('proof_not_before',extract(epoch FROM ch_at_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR ch_at_v6.required_generation<=ch_at_v5.required_generation
 OR ch_at_v6.proof_not_before<=ch_at_v5.proof_not_before
 OR ch_at_v6.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;
CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_prod_ch_at_rollback_v6 v WHERE v.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;
UPDATE official_v3_guard_private.bg1_prod_ch_at_rollback_v6
 SET catalog=official_v3_guard_private.catalog_status_v1() WHERE singleton AND catalog='{}'::jsonb;
DO $post$
BEGIN
 IF (SELECT catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
     FROM official_v3_guard_private.bg1_prod_ch_at_rollback_v6 WHERE singleton)
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-at-production-source-qualified-renew-v2')<>0
 OR public.jetnity_source_bound_at_visa_v1('CH')->>'status'<>'unavailable'
 OR public.jetnity_source_bound_at_visa_v1('IN')->>'status'<>'unavailable'
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 THEN RAISE EXCEPTION 'AT_CH_V2_ROLLBACK_POSTCHECK_FAILED' USING ERRCODE='P7905';END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
SELECT jsonb_build_object('verdict','PROD_CH_AT_V2_ROLLBACK_DEFAULT_CLOSED_PRECOMMIT',
  'fresh_BG1_generation_required',(SELECT required_generation FROM official_v3_guard_private.bg1_prod_ch_at_rollback_v6 WHERE singleton),
  'legacy_source_count',(SELECT count(*) FROM official_v3_at_production_private.source_pins_v1),
  'legacy_original_count',(SELECT count(*) FROM official_v3_at_production_private.first_originals_v1),
  'qualified_source_count',(SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2),
  'historical_fact_count',(SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v2),
  'visitor_CH','unavailable','foreign_passports','unavailable',
  'CHDE_and_HTTP_ID_allocator_preserved',true) AS rollback_precommit;
ROLLBACK;
