-- NATIVE PG17 ISOLATED BG1 CHAIN ROLLBACK, synthetic only.
BEGIN; SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout='30s';
CREATE SCHEMA jetnity_at_p0_guard_native AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_at_p0_guard_native FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_at_p0_guard_native.baselines_v1(component text,catalog jsonb,installed_at timestamptz);
CREATE TABLE jetnity_at_p0_guard_native.rolling_policy_v2(mode text,installed_at timestamptz);
CREATE TABLE jetnity_at_p0_guard_native.status_baseline_v1(singleton boolean,provider_digest text,predecessor_catalog_digest text,predecessor_baselines_digest text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_p0_guard_native.rolling_quota_baseline_v1(singleton boolean,predecessor_provider_digest text,predecessor_catalog_digest text,predecessor_status_digest text,policy jsonb,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_p0_guard_native.admin_runtime_baseline_v1(singleton boolean,predecessor_provider_digest text,definition_digest text,predecessor_catalog_digest text,predecessor_rolling_digest text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_p0_guard_native.saved_offers_baseline_v1(singleton boolean,migration_blob text,predecessor_catalog_digest text,predecessor_admin_digest text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_p0_guard_native.weather_quota_baseline_v1(singleton boolean,candidate_sha256 text,predecessor_sha256 text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_p0_guard_native.at_source_monitor_baseline_v1(singleton boolean,predecessor_catalog_digest text,predecessor_weather_digest text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_p0_guard_native.at_batch_switch_baseline_v2(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),predecessor_catalog_digest text NOT NULL,predecessor_baseline_digest text NOT NULL,catalog jsonb NOT NULL,proof_not_before timestamptz NOT NULL,required_generation bigint NOT NULL);
CREATE TABLE jetnity_at_p0_guard_native.state_v1(singleton boolean PRIMARY KEY,generation bigint,incident_generation bigint,resumed_generation bigint,installed_at timestamptz,last_observed timestamptz,last_finished timestamptz,last_started timestamptz,last_proof_started timestamptz,last_due timestamptz,valid_until timestamptz);
CREATE TABLE jetnity_at_p0_guard_native.runs_v1(due_at timestamptz,started_at timestamptz,proof_started_at timestamptz,finished_at timestamptz,outcome text,generation bigint);
ALTER TABLE jetnity_at_p0_guard_native.at_batch_switch_baseline_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_at_p0_guard_native.at_batch_switch_baseline_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_at_p0_guard_native.at_batch_switch_baseline_v2 TO postgres USING(true) WITH CHECK(true);
CREATE FUNCTION jetnity_at_p0_guard_native.immutable_v1() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'immutable' USING ERRCODE='P7901'; END $$;
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_at_p0_guard_native.at_batch_switch_baseline_v2
FOR EACH ROW EXECUTE FUNCTION jetnity_at_p0_guard_native.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_at_p0_guard_native.at_batch_switch_baseline_v2
FOR EACH STATEMENT EXECUTE FUNCTION jetnity_at_p0_guard_native.immutable_v1();
REVOKE ALL ON TABLE jetnity_at_p0_guard_native.at_batch_switch_baseline_v2 FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION jetnity_at_p0_guard_native.catalog_status_v1() RETURNS jsonb LANGUAGE sql STABLE
SET search_path=pg_catalog AS $$
SELECT jsonb_build_object(
'definitions',(SELECT jsonb_object_agg(p.proname,
encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') ORDER BY p.proname)
FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
WHERE ns.nspname='jetnity_at_p0_guard_native' AND p.proname IN('assert_catalog_v1','require_open_v1','public_guard_v1')),
'rls',(SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='jetnity_at_p0_guard_native.at_batch_switch_baseline_v2'::regclass),
'policies',(SELECT count(*) FROM pg_policy WHERE polrelid='jetnity_at_p0_guard_native.at_batch_switch_baseline_v2'::regclass),
'triggers',(SELECT count(*) FROM pg_trigger WHERE tgrelid='jetnity_at_p0_guard_native.at_batch_switch_baseline_v2'::regclass AND NOT tgisinternal)) $$;
CREATE OR REPLACE FUNCTION jetnity_at_p0_guard_native.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE switch_v2 jetnity_at_p0_guard_native.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod jetnity_at_p0_guard_native.at_source_monitor_baseline_v1%ROWTYPE;
 weather jetnity_at_p0_guard_native.weather_quota_baseline_v1%ROWTYPE;
  offers jetnity_at_p0_guard_native.saved_offers_baseline_v1%ROWTYPE;
  admin jetnity_at_p0_guard_native.admin_runtime_baseline_v1%ROWTYPE;
  predecessor jetnity_at_p0_guard_native.status_baseline_v1%ROWTYPE;
  rolling jetnity_at_p0_guard_native.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT weather FROM jetnity_at_p0_guard_native.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM jetnity_at_p0_guard_native.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM jetnity_at_p0_guard_native.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM jetnity_at_p0_guard_native.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM jetnity_at_p0_guard_native.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM jetnity_at_p0_guard_native.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM jetnity_at_p0_guard_native.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM jetnity_at_p0_guard_native.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM jetnity_at_p0_guard_native.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM jetnity_at_p0_guard_native.rolling_policy_v2 p)
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
    OR switch_v2.catalog IS DISTINCT FROM jetnity_at_p0_guard_native.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$
;
CREATE OR REPLACE FUNCTION jetnity_at_p0_guard_native.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s jetnity_at_p0_guard_native.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM jetnity_at_p0_guard_native.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_p0_guard_native.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_p0_guard_native.status_baseline_v1 b CROSS JOIN jetnity_at_p0_guard_native.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_p0_guard_native.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_p0_guard_native.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_p0_guard_native.at_source_monitor_baseline_v1 at_prod CROSS JOIN jetnity_at_p0_guard_native.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_p0_guard_native.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$
;
CREATE OR REPLACE FUNCTION jetnity_at_p0_guard_native.alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s jetnity_at_p0_guard_native.state_v1%ROWTYPE; instant timestamptz:=clock_timestamp();
BEGIN
  SELECT * INTO s FROM jetnity_at_p0_guard_native.state_v1 WHERE singleton;
  IF NOT FOUND THEN RETURN jsonb_build_object('schema',1,'status','unavailable'); END IF;
  RETURN jsonb_build_object('schema',1,'status',CASE
    WHEN instant<s.last_observed OR instant<s.last_finished THEN 'clock'
    WHEN s.incident_generation<>s.resumed_generation THEN 'incident'
    WHEN s.generation=0 THEN 'unchecked'
    WHEN instant>=s.valid_until THEN 'stale' ELSE 'current' END);
END $function$;
CREATE OR REPLACE FUNCTION jetnity_at_p0_guard_native.public_guard_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state jetnity_at_p0_guard_native.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF jetnity_at_p0_guard_native.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_p0_guard_native.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_p0_guard_native.status_baseline_v1 b CROSS JOIN jetnity_at_p0_guard_native.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_p0_guard_native.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_p0_guard_native.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_p0_guard_native.at_source_monitor_baseline_v1 at_prod CROSS JOIN jetnity_at_p0_guard_native.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT * INTO STRICT current_state FROM jetnity_at_p0_guard_native.state_v1 WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_p0_guard_native.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $function$
;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_at_p0_guard_native FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO jetnity_at_p0_guard_native.baselines_v1 VALUES
('all','{"v":"base"}',clock_timestamp()-interval '2 hours'),
('jobs','{"v":"jobs"}',clock_timestamp()-interval '2 hours'),
('s1','{"v":"s1"}',clock_timestamp()-interval '2 hours');
INSERT INTO jetnity_at_p0_guard_native.rolling_policy_v2 VALUES('fixed',clock_timestamp()-interval '2 hours');
INSERT INTO jetnity_at_p0_guard_native.status_baseline_v1
SELECT true,'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e',
encode(sha256(convert_to(catalog::text,'UTF8')),'hex'),
(SELECT encode(sha256(convert_to(jsonb_agg(to_jsonb(b)||jsonb_build_object(
'installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")::text,'UTF8')),'hex')
FROM jetnity_at_p0_guard_native.baselines_v1 b),'{"v":"status"}',clock_timestamp()-interval '90 minutes',1
FROM jetnity_at_p0_guard_native.baselines_v1 WHERE component='all';
INSERT INTO jetnity_at_p0_guard_native.rolling_quota_baseline_v1
SELECT true,'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc',
encode(sha256(convert_to(s.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(s)||jsonb_build_object('proof_not_before',
extract(epoch FROM s.proof_not_before)))::text,'UTF8')),'hex'),
(SELECT to_jsonb(r)||jsonb_build_object('installed_at',extract(epoch FROM r.installed_at))
FROM jetnity_at_p0_guard_native.rolling_policy_v2 r),'{"v":"rolling"}',clock_timestamp()-interval '80 minutes',1
FROM jetnity_at_p0_guard_native.status_baseline_v1 s;
INSERT INTO jetnity_at_p0_guard_native.admin_runtime_baseline_v1
SELECT true,'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a',
'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de',
encode(sha256(convert_to(r.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('proof_not_before',
extract(epoch FROM r.proof_not_before)))::text,'UTF8')),'hex'),
'{"v":"admin"}',clock_timestamp()-interval '70 minutes',1 FROM jetnity_at_p0_guard_native.rolling_quota_baseline_v1 r;
INSERT INTO jetnity_at_p0_guard_native.saved_offers_baseline_v1
SELECT true,'667766f5455ff2460f4eb56f04c7a62c84ca9e05',
encode(sha256(convert_to(a.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(a)||jsonb_build_object('proof_not_before',
extract(epoch FROM a.proof_not_before)))::text,'UTF8')),'hex'),
'{"v":"offers"}',clock_timestamp()-interval '60 minutes',1 FROM jetnity_at_p0_guard_native.admin_runtime_baseline_v1 a;
INSERT INTO jetnity_at_p0_guard_native.weather_quota_baseline_v1
SELECT true,'9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae',
encode(sha256(convert_to((to_jsonb(o)||jsonb_build_object('proof_not_before',
extract(epoch FROM o.proof_not_before)))::text,'UTF8')),'hex'),
'{"v":"weather"}',clock_timestamp()-interval '50 minutes',1 FROM jetnity_at_p0_guard_native.saved_offers_baseline_v1 o;
INSERT INTO jetnity_at_p0_guard_native.at_source_monitor_baseline_v1
SELECT true,encode(sha256(convert_to(w.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(w)||jsonb_build_object('proof_not_before',
extract(epoch FROM w.proof_not_before)))::text,'UTF8')),'hex'),
'{"v":"at_previous"}',clock_timestamp()-interval '40 minutes',2
FROM jetnity_at_p0_guard_native.weather_quota_baseline_v1 w;
INSERT INTO jetnity_at_p0_guard_native.state_v1
SELECT true,3,0,0,clock_timestamp()-interval '3 hours',
clock_timestamp()-interval '1 second',clock_timestamp()-interval '1 second',
clock_timestamp()-interval '3 seconds',clock_timestamp()-interval '2 seconds',
date_bin(interval '5 minutes',clock_timestamp(),timestamptz '2000-01-01 00:00:00+00'),
date_bin(interval '5 minutes',clock_timestamp(),timestamptz '2000-01-01 00:00:00+00')+interval '5 minutes 30 seconds';
INSERT INTO jetnity_at_p0_guard_native.runs_v1 SELECT last_due,last_started,last_proof_started,last_finished,'complete',generation FROM jetnity_at_p0_guard_native.state_v1;
INSERT INTO jetnity_at_p0_guard_native.at_batch_switch_baseline_v2
SELECT true,encode(sha256(convert_to(old.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(old)||jsonb_build_object('proof_not_before',
extract(epoch FROM old.proof_not_before)))::text,'UTF8')),'hex'),
jetnity_at_p0_guard_native.catalog_status_v1(),clock_timestamp(),state.generation+1
FROM jetnity_at_p0_guard_native.at_source_monitor_baseline_v1 old CROSS JOIN jetnity_at_p0_guard_native.state_v1 state;
DO $first$
BEGIN
 PERFORM jetnity_at_p0_guard_native.assert_catalog_v1();
 IF jetnity_at_p0_guard_native.public_guard_v1()->>'status'<>'unavailable' THEN RAISE EXCEPTION 'fresh proof not required'; END IF;
 BEGIN UPDATE jetnity_at_p0_guard_native.at_batch_switch_baseline_v2 SET required_generation=2;
 RAISE EXCEPTION 'immutable UPDATE allowed';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL; END;
 BEGIN DELETE FROM jetnity_at_p0_guard_native.at_batch_switch_baseline_v2;
 RAISE EXCEPTION 'immutable DELETE allowed';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL; END;
END $first$;
-- Separate synthetic proof timestamp must be strictly AFTER successor baseline.
SELECT pg_sleep(3);
WITH tick AS (SELECT clock_timestamp() at_time)
UPDATE jetnity_at_p0_guard_native.state_v1 SET generation=4,
last_observed=tick.at_time,last_finished=tick.at_time,
last_started=tick.at_time,last_proof_started=tick.at_time
FROM tick;
INSERT INTO jetnity_at_p0_guard_native.runs_v1 SELECT last_due,last_started,last_proof_started,last_finished,
'complete',generation FROM jetnity_at_p0_guard_native.state_v1;
DO $after$
DECLARE state text; episode bigint;
BEGIN
 PERFORM jetnity_at_p0_guard_native.assert_catalog_v1();
 state:=jetnity_at_p0_guard_native.public_guard_v1()->>'status';
 IF state<>'current' THEN RAISE EXCEPTION 'fresh BG1 proof refused: %',state; END IF;
 episode:=jetnity_at_p0_guard_native.require_open_v1();
 IF episode<>0 THEN RAISE EXCEPTION 'require-open refused'; END IF;
 EXECUTE 'ALTER FUNCTION jetnity_at_p0_guard_native.require_open_v1() SET search_path TO public';
 BEGIN PERFORM jetnity_at_p0_guard_native.assert_catalog_v1();
 RAISE EXCEPTION 'tamper not detected';
 EXCEPTION WHEN SQLSTATE 'P7905' THEN NULL; END;
 RAISE NOTICE 'BG1 PG17 shadow guard 7 cases green';
END $after$;
SELECT (SELECT count(*) FROM jetnity_at_p0_guard_native.at_batch_switch_baseline_v2) AS immutable_baselines,
(SELECT count(*) FROM jetnity_at_p0_guard_native.runs_v1) AS synthetic_proofs;
ROLLBACK;