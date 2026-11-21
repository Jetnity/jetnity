-- Exact Production BG1-v3 -> normal AT-source V4 successor. ROLLBACK ONLY, NOT APPROVED.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='2s';
DO $pre$
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 OR to_regclass('official_v3_guard_private.source_renewal_baseline_v1') IS NOT NULL
 OR to_regclass('official_v3_guard_private.at_legal_source_guard_baseline_v4') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771106,1)
 THEN RAISE EXCEPTION 'PROD_AT_V4_PRECONDITION_REFUSED' USING ERRCODE='P7998';END IF;
 IF NOT(SELECT catalog=official_v3_guard_private.catalog_status_v1() FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton)
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1 WHERE research_only AND NOT source_qualified)<>3
 THEN RAISE EXCEPTION 'PROD_AT_V4_UNEXPECTED_CATALOG_OR_SOURCE' USING ERRCODE='P7998';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex'))<>'5171785c2b114a816c13c5e2dc26cc2a397c6837fccfcbda2974f706b10b5f76'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.assert_catalog_v1()'::regprocedure),'UTF8')),'hex'))<>'392ea8733d60115b7e2c0135e21c76116f9f4d066988dda860e5129d427553fa'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.require_open_v1()'::regprocedure),'UTF8')),'hex'))<>'9ce675e839dc71ee19ddba5f44503472e2f1caa07add90d5709df4f5164a20e5'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('public.official_v3_guard_alarm_status_v1()'::regprocedure),'UTF8')),'hex'))<>'d60554d4a4d902b76c51f9e5b1f2f718692732bcda614f0f1783a154ba7677ec'
 THEN RAISE EXCEPTION 'PROD_AT_V4_CODE_CHANGED' USING ERRCODE='P7998';END IF;
END $pre$;
CREATE TABLE official_v3_guard_private.at_legal_source_guard_baseline_v4(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest ~ '^[a-f0-9]{64}$'),
 publisher_function_digest text NOT NULL CHECK(publisher_function_digest ~ '^[a-f0-9]{64}$'),
 original_source_count integer NOT NULL CHECK(original_source_count=3),
 original_unqualified_count integer NOT NULL CHECK(original_unqualified_count=3),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.at_legal_source_guard_baseline_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.at_legal_source_guard_baseline_v4 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.at_legal_source_guard_baseline_v4 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.at_legal_source_guard_baseline_v4 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.at_legal_source_guard_baseline_v4 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.at_legal_source_guard_baseline_v4 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE OR REPLACE FUNCTION official_v3_at_production_private.renew_ch_v1()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE latest record; h official_v3_method_private.heads_v1%ROWTYPE;
 previous record; as_of timestamptz; seen timestamptz; digest text; official_count integer;
 expires timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
   OR NOT pg_try_advisory_xact_lock(771112,2)
 THEN RETURN 0; END IF;
 -- Do not turn research-only physical source observations into accepted
 -- travel facts. All three sources require independent legal qualification.
 IF (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.source_pins_v1
    WHERE research_only OR NOT source_qualified) THEN RETURN 0;END IF;
 SELECT * INTO latest FROM official_v3_at_production_private.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1 FOR SHARE;
 as_of:=clock_timestamp();
 IF NOT FOUND OR latest.started_at>as_of
   OR latest.started_at<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 SELECT count(*),min(observed_at) INTO official_count,seen
 FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=latest.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only');
 IF official_count<>3 OR seen IS NULL OR seen<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND active
    AND jobname IN ('jetnity-at-production-source-enqueue-v1',
                    'jetnity-at-production-source-collect-v1',
                    'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN 0; END IF;
 IF NOT EXISTS(
   SELECT 1 FROM official_v3_at_production_private.first_originals_v1 o
   JOIN official_v3_at_production_private.source_pins_v1 p USING(source_id)
   WHERE o.source_id='bmi-visa-nationality-matrix'
     AND p.original_sha='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
     AND o.raw_sha=p.original_sha AND o.raw_bytes=498415
     AND position('(Stand: 6.11.2026)' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('EU-Freiz&uuml;gigkeit' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('Schweiz' IN convert_from(o.raw_body,'UTF8'))>0)
 THEN RETURN 0; END IF;
 IF EXISTS(
  SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 r
  JOIN official_v3_at_production_private.source_pins_v1 p USING(source_id)
  WHERE r.batch_id=latest.batch_id
   AND ((r.source_status='unchanged_exact'
     AND (r.body_sha IS DISTINCT FROM p.original_sha OR r.bytes<>p.original_bytes))
   OR (r.source_status='unchanged_asset_version_only'
     AND (r.source_id<>'bmeia-bern-how-to-apply'
       OR p.normalization<>'bmeia-theme-assets-v1'
       OR p.canonical_sha IS DISTINCT FROM
       'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
       OR r.bytes<>p.original_bytes))))
 THEN RETURN 0; END IF;
 SELECT * INTO h FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.revision<>1 OR h.method_digest<>
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
 OR h.package_digest<>
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 OR h.epoch<1
 THEN RETURN 0; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 SELECT * INTO previous FROM official_v3_at_production_private.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1 FOR SHARE;
 -- Once any official source is actually changed, do NOT auto-renew a
 -- later reverted source under the old method. Owner requalification required.
 IF FOUND AND EXISTS(
   SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 o
   WHERE o.batch_id>previous.source_batch_id AND o.batch_id<=latest.batch_id
     AND o.source_status='changed'
 ) THEN RETURN 0; END IF;
 IF FOUND AND (previous.source_batch_id=latest.batch_id
   OR previous.source_checked_at>=seen) THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(string_agg(
   source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=latest.batch_id;
 IF digest IS NULL THEN RETURN 0; END IF;
 as_of:=clock_timestamp();
 expires:=least(as_of+interval '1 hour',seen+interval '70 minutes',
   '2027-11-16T00:00:00Z'::timestamptz);
 IF expires<=as_of OR as_of>=seen+interval '70 minutes'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 INSERT INTO official_v3_at_production_private.ch_visa_facts_v1(
  source_batch_id,predecessor_version_id,method_epoch,method_id,
  method_revision,method_digest,package_digest,source_digest,
  verified_at,source_checked_at,expires_at)
 VALUES(latest.batch_id,previous.version_id,h.epoch,
 'jetnity-destination-primary-at-visa',1,
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
 digest,as_of,seen,expires)
 ON CONFLICT DO NOTHING;
 IF FOUND THEN
   PERFORM official_v3_guard_private.assert_catalog_v1();
   RETURN 1;
 END IF;
 RETURN 0;
EXCEPTION WHEN OTHERS THEN RETURN 0;
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
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.at_legal_source_guard_baseline_v4 v WHERE singleton;
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
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.at_legal_source_guard_baseline_v4 v WHERE singleton;
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

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE legal_v4 official_v3_guard_private.at_legal_source_guard_baseline_v4%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 official_v3_guard_private.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT legal_v4 FROM official_v3_guard_private.at_legal_source_guard_baseline_v4 WHERE singleton;
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
 OR legal_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR legal_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR legal_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex')
 OR legal_v4.original_source_count<>3 OR legal_v4.original_unqualified_count<>3
 OR legal_v4.required_generation<=bg1_v3.required_generation
 OR legal_v4.proof_not_before<=bg1_v3.proof_not_before
 OR legal_v4.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;

INSERT INTO official_v3_guard_private.at_legal_source_guard_baseline_v4
(singleton,predecessor_catalog_digest,predecessor_baseline_digest,publisher_function_digest,
 original_source_count,original_unqualified_count,required_generation,proof_not_before,catalog)
SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex'),
 3,3,greatest(s.generation+1,v.required_generation+1),greatest(clock_timestamp(),v.proof_not_before+interval '1 microsecond'),
 official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_transient_baseline_v3 v CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton;
DO $post$
BEGIN
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status'<>'unavailable'
 OR (SELECT count(*) FROM official_v3_guard_private.at_legal_source_guard_baseline_v4)<>1
 OR has_table_privilege('anon','official_v3_guard_private.at_legal_source_guard_baseline_v4','SELECT')
 OR has_table_privilege('authenticated','official_v3_guard_private.at_legal_source_guard_baseline_v4','SELECT')
 OR (SELECT v.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() FROM official_v3_guard_private.at_legal_source_guard_baseline_v4 v WHERE singleton)
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1 WHERE research_only OR NOT source_qualified)<>3
 THEN RAISE EXCEPTION 'PROD_AT_V4_POSTCHECK_REFUSED' USING ERRCODE='P7998';END IF;
END $post$;
SELECT 'PROD_AT_V4_ROLLBACK_ONLY' AS result,false AS authorized_to_install;
ROLLBACK;
