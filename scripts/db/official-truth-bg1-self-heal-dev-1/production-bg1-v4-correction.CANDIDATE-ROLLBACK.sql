-- PRODUCTION v4 correction candidate only. Explicit Owner-Go mandatory.
-- This file is ROLLBACK-only. It does not restore user-data snapshots.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='3s';
-- Production-specific corrective successor after owner-approved v3 COMMIT. CANDIDATE ONLY.
-- Does NOT delete v3, alter authenticator or resume an incident. Keeps v3
-- historical catalog intact and enforces a new fresh-full-proof threshold.
DO $v4pre$
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_transient_correction_baseline_v4') IS NOT NULL
 OR NOT pg_try_advisory_xact_lock(771106,1)
 THEN RAISE EXCEPTION 'BG1_V4_CORRECTION_PREREQUISITE_REFUSED' USING ERRCODE='P7991';END IF;
 IF NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_transient_baseline_v3 v
   WHERE singleton AND v.catalog=official_v3_guard_private.catalog_status_v1())
 THEN RAISE EXCEPTION 'BG1_V4_PREDECESSOR_CATALOG_MISMATCH' USING ERRCODE='P7991';END IF;
END $v4pre$;
CREATE TABLE official_v3_guard_private.bg1_transient_correction_baseline_v4(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest ~ '^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL, catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_transient_correction_baseline_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_transient_correction_baseline_v4 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_transient_correction_baseline_v4 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_transient_correction_baseline_v4 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_transient_correction_baseline_v4 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_transient_correction_baseline_v4 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE OR REPLACE FUNCTION official_v3_guard_private.latch_incident_v1(due_value timestamp with time zone, reason_value text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.incidents_v1
    WHERE due_at=due_value AND reason=reason_value AND baseline_generation=s.generation) THEN RETURN; END IF;
  instant:=greatest(clock_timestamp(),s.last_observed);
  INSERT INTO official_v3_guard_private.incidents_v1 VALUES(s.incident_generation+1,due_value,reason_value,s.generation,instant);
  UPDATE official_v3_guard_private.state_v1 SET incident_generation=s.incident_generation+1,incident_at=instant WHERE singleton;
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.audit_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
 SET jit TO 'off'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
  entered timestamptz:=statement_timestamp(); started timestamptz; finished timestamptz; observed timestamptz;
  due timestamptz:=date_bin(interval '5 minutes',entered,timestamptz '2000-01-01 00:00:00+00');
  deadline timestamptz:=entered+interval '30 seconds'; first_due timestamptz; old_valid_until timestamptz;
  result text:='complete'; gap boolean:=false; healthy boolean:=false; incident_recorded boolean:=false;
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres'
    OR current_setting('transaction_isolation')<>'read committed'
    OR current_setting('statement_timeout')::interval<=interval '0 seconds'
    OR current_setting('statement_timeout')::interval>interval '30 seconds' THEN
    RAISE EXCEPTION 'bg1 fixed checker context required' USING ERRCODE='P7903';
  END IF;
  -- Same first lock as every guarded write and Owner closure. No takeover of a
  -- half-finished checker; process death releases it and freshness still expires.
  PERFORM pg_advisory_xact_lock(771106,1);
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','unavailable'); END IF;
  started:=clock_timestamp();
  IF entered<s.last_observed OR started<entered THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,'clock');
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    INSERT INTO official_v3_guard_private.runs_v1 VALUES(due,entered,started,clock_timestamp(),'clock',s.generation,s.incident_generation)
      ON CONFLICT(due_at) DO NOTHING;
    RETURN official_v3_guard_private.alarm_status_v1();
  END IF;
  -- An already completed due slot is immutable, including its negative result.
  -- Retrying it late cannot manufacture another incident or extend freshness.
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 WHERE due_at=due) THEN
    RETURN official_v3_guard_private.alarm_status_v1();
  END IF;
  IF started>deadline THEN result:='expired'; END IF;
  first_due:=date_bin(interval '5 minutes',s.installed_at,timestamptz '2000-01-01 00:00:00+00')+interval '5 minutes';
  old_valid_until:=CASE WHEN s.generation>0 THEN s.valid_until ELSE first_due+interval '30 seconds' END;
  gap:=started>=old_valid_until;
  IF gap OR result<>'complete' THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,CASE WHEN gap THEN 'gap' ELSE result END);
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    incident_recorded:=true;
    started:=clock_timestamp();
  END IF;
  IF result='complete' THEN
    BEGIN
      observed:=started;
      PERFORM official_v3_guard_private.check_control_v1();
      PERFORM official_v3_guard_private.assert_catalog_v1();
      PERFORM official_v3_guard_private.check_hma_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_s1_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_jobs_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_hrs_v1();
      PERFORM official_v3_guard_private.check_certificates_v1();
      PERFORM official_v3_guard_private.check_retirements_v1();
      PERFORM official_v3_guard_private.assert_catalog_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      healthy:=true;
    EXCEPTION
      WHEN query_canceled OR lock_not_available THEN result:='expired';
      WHEN SQLSTATE 'P7904' THEN result:='expired';
      WHEN OTHERS THEN result:='refused';
    END;
  END IF;
  finished:=clock_timestamp();
  IF healthy AND (finished<started OR finished>deadline) THEN healthy:=false; result:='expired'; END IF;
  -- The previous lease may expire while this run waits or performs its full
  -- proof. Preserve that gap before publishing new evidence. A proof begun
  -- before this incident cannot satisfy the separate Owner resume predicate.
  IF NOT gap AND finished>=old_valid_until THEN
    gap:=true;
    PERFORM official_v3_guard_private.latch_incident_v1(due,'gap');
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    incident_recorded:=true;
  END IF;
  IF NOT healthy AND NOT incident_recorded THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,result);
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
  END IF;
  IF healthy THEN
    s.generation:=s.generation+1;
    UPDATE official_v3_guard_private.state_v1 SET generation=s.generation,
      last_due=due,last_started=entered,last_proof_started=started,last_finished=finished,valid_until=due+interval '5 minutes 30 seconds',
      incident_generation=s.incident_generation,incident_at=s.incident_at,
      last_observed=greatest(last_observed,finished) WHERE singleton;
  ELSE
    UPDATE official_v3_guard_private.state_v1 SET incident_generation=s.incident_generation,incident_at=s.incident_at,
      last_observed=greatest(last_observed,finished) WHERE singleton;
  END IF;
  INSERT INTO official_v3_guard_private.runs_v1(due_at,started_at,proof_started_at,finished_at,outcome,generation,incident_generation)
  VALUES(due,entered,started,finished,result,s.generation,s.incident_generation);
  RETURN official_v3_guard_private.alarm_status_v1();
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
  SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_correction_baseline_v4 v WHERE singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;;

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
  SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_correction_baseline_v4 v WHERE singleton;
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
END $function$;;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE bg1_v4 official_v3_guard_private.bg1_transient_correction_baseline_v4%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 official_v3_guard_private.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT bg1_v4 FROM official_v3_guard_private.bg1_transient_correction_baseline_v4 WHERE singleton;
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
 OR bg1_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR bg1_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v4.required_generation<=bg1_v3.required_generation
 OR bg1_v4.proof_not_before<=bg1_v3.proof_not_before
 OR bg1_v4.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;;
INSERT INTO official_v3_guard_private.bg1_transient_correction_baseline_v4
 (singleton,predecessor_catalog_digest,predecessor_baseline_digest,required_generation,proof_not_before,catalog)
 SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 greatest(s.generation+1,v.required_generation+1),
 greatest(clock_timestamp(),v.proof_not_before+interval '1 microsecond'),
 official_v3_guard_private.catalog_status_v1()
 FROM official_v3_guard_private.bg1_transient_baseline_v3 v CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton;
DO $v4post$
BEGIN
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 OR (SELECT count(*) FROM official_v3_guard_private.bg1_transient_correction_baseline_v4)<>1
 OR has_schema_privilege('anon','official_v3_guard_private','USAGE')
 OR has_table_privilege('anon','official_v3_guard_private.bg1_transient_correction_baseline_v4','SELECT')
 OR (SELECT v.required_generation<=s.generation FROM official_v3_guard_private.bg1_transient_correction_baseline_v4 v CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton)
 THEN RAISE EXCEPTION 'BG1_V4_CORRECTION_POSTCHECK_STOP' USING ERRCODE='P7991';END IF;
END $v4post$;
SELECT jsonb_build_object(
 'result','PROD_BG1_V3_TO_V4_APPEND_ONLY_CORRECTION_NATIVE_CANDIDATE',
 'v3Preserved',(SELECT count(*)=1 FROM official_v3_guard_private.bg1_transient_baseline_v3),
 'oldAuditRestored',encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.audit_v1()'::regprocedure),'UTF8')),'hex')='7f9acc800b3b01ad755d608029bd88bf3533496e4602037641b7568c1ce64312',
 'visitorFailsClosed',public.official_v3_guard_alarm_status_v1()->>'status'='unavailable') AS result;

ROLLBACK;
