-- SAFETY ROLLBACK of committed CH->AT source V3, without deleting accepted
-- or audit history. Stage 1 and rollback never edit Visitor flag or facts.
-- Only Jetnity Release & Production after new PO-Go may execute this.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL jetnity.at_v3_rollback='production:qscbgcdmivbbnzrcyegn:CH-AT-V3-ROLLBACK-V7';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR
 current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_v3_rollback',true) IS DISTINCT FROM
  'production:qscbgcdmivbbnzrcyegn:CH-AT-V3-ROLLBACK-V7'
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_v6') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR NOT pg_try_advisory_xact_lock(771106,1)
 OR NOT pg_try_advisory_xact_lock(771112,33)
 THEN RAISE EXCEPTION 'AT_V3_ROLLBACK_PREDECESSOR_STOP' USING ERRCODE='P7997'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

-- Its existence is a hard STOP for any V3 Owner approval or V3 batch checker.
-- No V3 table/function deletion: retain evidence and irreversibility trail.
CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7(
 singleton boolean PRIMARY KEY CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7
 FROM PUBLIC,anon,authenticated,service_role;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7
 FOR ALL TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON
 official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7 FOR EACH ROW
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON
 official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7 FOR EACH STATEMENT
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE source_rollback_v7 official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7%ROWTYPE;
 at_source_v6 official_v3_guard_private.bg1_prod_ch_at_source_v6%ROWTYPE;
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
  SELECT * INTO STRICT source_rollback_v7 FROM official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7 WHERE singleton;
  SELECT * INTO STRICT at_source_v6 FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton;
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
 OR allocator_v4.transport_metadata IS DISTINCT FROM (allocator_v4.catalog->'transport:production_http_id_allocator_v4')
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
 OR at_source_v6.predecessor_catalog_digest IS DISTINCT FROM
   encode(sha256(convert_to(ch_at_v5.catalog::text,'UTF8')),'hex')
 OR at_source_v6.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(ch_at_v5)||
       jsonb_build_object('proof_not_before',extract(epoch FROM ch_at_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR at_source_v6.source_digest IS DISTINCT FROM
    (SELECT encode(sha256(convert_to(string_agg(source_id||':'||original_sha||':'||
       original_bytes::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
     FROM official_v3_at_production_private.ch_source_qualifications_v3)
 OR at_source_v6.required_generation<=ch_at_v5.required_generation
 OR at_source_v6.proof_not_before<=ch_at_v5.proof_not_before
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 OR source_rollback_v7.predecessor_catalog_digest IS DISTINCT FROM
   encode(sha256(convert_to(at_source_v6.catalog::text,'UTF8')),'hex')
 OR source_rollback_v7.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(at_source_v6)||
    jsonb_build_object('proof_not_before',extract(epoch FROM at_source_v6.proof_not_before)))::text,'UTF8')),'hex')
 OR source_rollback_v7.required_generation<=at_source_v6.required_generation
 OR source_rollback_v7.proof_not_before<=at_source_v6.proof_not_before
 OR source_rollback_v7.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
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
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7 v WHERE v.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;
CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN RETURN unavailable_value; END IF;
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7 v WHERE v.singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $function$;

INSERT INTO official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7(
singleton,predecessor_catalog_digest,predecessor_baseline_digest,
required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(v6.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v6)||
   jsonb_build_object('proof_not_before',extract(epoch FROM v6.proof_not_before)))::text,'UTF8')),'hex'),
 state.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v6
CROSS JOIN official_v3_guard_private.state_v1 state
WHERE v6.singleton AND state.singleton;
DO $post$
BEGIN
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7)<>1
 THEN RAISE EXCEPTION 'AT_V3_ROLLBACK_V7_NOT_ARMED' USING ERRCODE='P7997'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF official_v3_at_production_private.batch_qualified_owner_precheck_v3()
 OR official_v3_at_production_private.batch_qualified_ch_v3(
    (SELECT MAX(batch_id) FROM official_v3_at_production_private.watch_batches_v1))
 THEN RAISE EXCEPTION 'AT_V3_ROLLBACK_FAIL_OPEN' USING ERRCODE='P7997'; END IF;
 -- The new protected V7 baseline also needs a NATURAL new full BG1 proof.
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'AT_V3_ROLLBACK_PREMATURE_GUARD_OPEN' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL;
 END;
END $post$;
COMMIT;
