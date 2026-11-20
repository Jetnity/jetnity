-- Production-specific BG1 v3 immutable successor CANDIDATE. Do not install.
-- Original predecessor at_batch_switch_baseline_v2, not the Dev baseline.
-- Last statement ROLLBACK. Owner Go, current backup/restore and tested v4
-- are separately required before any Production DDL may be executed.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='3s';
DO $pre$
DECLARE old_catalog jsonb; now_catalog jsonb; auth_oid oid; rk text; sk text;
 changed_keys text[]; ro jsonb; rn jsonb; so jsonb; sn jsonb; v record;
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres'
 OR current_user<>'postgres' OR current_setting('server_version_num')::int/10000<>17
 OR to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NOT NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 OR to_regprocedure('public.jetnity_bg1_alarm_kind_v2()') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 OR NOT pg_try_advisory_xact_lock(771106,1)
 THEN RAISE EXCEPTION 'BG1_PROD_V3_PREREQUISITE_STOP' USING ERRCODE='P7991'; END IF;
 SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.at_batch_switch_baseline_v2 WHERE singleton;
 SELECT official_v3_guard_private.catalog_status_v1() INTO STRICT now_catalog;
 SELECT oid INTO STRICT auth_oid FROM pg_roles WHERE rolname='authenticator';
 rk:='role:'||auth_oid::text;sk:='setting:0:'||auth_oid::text;
 SELECT array_agg(key ORDER BY key COLLATE "C") INTO changed_keys
 FROM (SELECT coalesce(p.key,l.key) AS key FROM jsonb_each(old_catalog) p
 FULL JOIN jsonb_each(now_catalog) l ON p.key=l.key
 WHERE p.value IS DISTINCT FROM l.value) delta;
 IF changed_keys IS DISTINCT FROM (SELECT array_agg(k ORDER BY k COLLATE "C") FROM unnest(ARRAY[rk,sk]) AS k)
 THEN RAISE EXCEPTION 'BG1_PROD_V3_UNKNOWN_CATALOG_DRIFT' USING ERRCODE='P7991';END IF;
 ro:=old_catalog->rk;rn:=now_catalog->rk;so:=old_catalog->sk;sn:=now_catalog->sk;
 IF ro IS NULL OR rn IS NULL OR so IS NULL OR sn IS NULL
 OR ro-'rolconfig' IS DISTINCT FROM rn-'rolconfig'
 OR so-'setconfig' IS DISTINCT FROM sn-'setconfig'
 OR (SELECT coalesce(jsonb_agg(t ORDER BY t),'[]'::jsonb) FROM jsonb_array_elements_text(ro->'rolconfig') t WHERE t NOT LIKE 'session_preload_libraries=%') IS DISTINCT FROM
    (SELECT coalesce(jsonb_agg(t ORDER BY t),'[]'::jsonb) FROM jsonb_array_elements_text(rn->'rolconfig') t WHERE t NOT LIKE 'session_preload_libraries=%')
 OR (SELECT coalesce(jsonb_agg(t ORDER BY t),'[]'::jsonb) FROM jsonb_array_elements_text(so->'setconfig') t WHERE t NOT LIKE 'session_preload_libraries=%') IS DISTINCT FROM
    (SELECT coalesce(jsonb_agg(t ORDER BY t),'[]'::jsonb) FROM jsonb_array_elements_text(sn->'setconfig') t WHERE t NOT LIKE 'session_preload_libraries=%')
 OR (SELECT count(*) FROM jsonb_array_elements_text(ro->'rolconfig') t WHERE t='session_preload_libraries=safeupdate')<>1
 OR (SELECT count(*) FROM jsonb_array_elements_text(rn->'rolconfig') t WHERE t='session_preload_libraries=supautils, safeupdate')<>1
 OR (SELECT count(*) FROM jsonb_array_elements_text(so->'setconfig') t WHERE t='session_preload_libraries=safeupdate')<>1
 OR (SELECT count(*) FROM jsonb_array_elements_text(sn->'setconfig') t WHERE t='session_preload_libraries=supautils, safeupdate')<>1
 THEN RAISE EXCEPTION 'BG1_PROD_V3_PRELOAD_SCOPE_CHANGED' USING ERRCODE='P7991';END IF;
 FOR v IN SELECT * FROM (VALUES
    ('official_v3_guard_private.assert_catalog_v1()', 'c0f4f9704a7eec6a0a43c6c2b27990ee9a5488db462aa0377f7b4ae8e30c09cf'),
    ('official_v3_guard_private.audit_v1()', '7f9acc800b3b01ad755d608029bd88bf3533496e4602037641b7568c1ce64312'),
    ('official_v3_guard_private.catalog_status_v1()', '6880695c2a5986fee7d5b4357612875b449240ea03020831ba691826509a0101'),
    ('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)', '4c85722cb02ca77332f8292f6ec32eb891b17b3fcb6bfc44a1c36d13acf5645f'),
    ('official_v3_guard_private.require_open_v1()', 'ad7ebc80c5d50a7c8a6cfad475ed55001b1b8e519db6c9a2afecbed2ed61f1bb'),
    ('public.official_v3_guard_alarm_status_v1()', '7b1c8e34dd4db19b1d3552424ec442e7a3e741feedb4855137337d09e77c8537')) AS expected(signature,digest) LOOP
 IF encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(v.signature)),'UTF8')),'hex') IS DISTINCT FROM v.digest
 THEN RAISE EXCEPTION 'BG1_PROD_V3_OLD_FUNCTION_CHANGED: %',v.signature USING ERRCODE='P7991';END IF;
 END LOOP;
END $pre$;
CREATE TABLE official_v3_guard_private.bg1_transient_baseline_v3(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest ~ '^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_transient_baseline_v3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_transient_baseline_v3 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_transient_baseline_v3 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_transient_baseline_v3 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_transient_baseline_v3 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_transient_baseline_v3 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE OR REPLACE FUNCTION official_v3_guard_private.latch_incident_v1(due_value timestamptz,reason_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.incidents_v1
    WHERE due_at=due_value AND reason=reason_value AND baseline_generation=s.generation) THEN RETURN; END IF;
  -- One unresolved genuine integrity incident already prevents publication.
  -- Record one durable owner-visible hard alarm, NOT one each five-minute tick.
  -- A prior timing-gap incident must NOT suppress the first real refusal.
  IF s.incident_generation>s.resumed_generation AND EXISTS(
    SELECT 1 FROM official_v3_guard_private.incidents_v1
    WHERE generation>s.resumed_generation AND reason IN ('refused','clock')
  ) THEN RETURN; END IF;
  instant:=greatest(clock_timestamp(),s.last_observed);
  INSERT INTO official_v3_guard_private.incidents_v1 VALUES(s.incident_generation+1,due_value,reason_value,s.generation,instant);
  UPDATE official_v3_guard_private.state_v1 SET incident_generation=s.incident_generation+1,incident_at=instant WHERE singleton;
END $$;

-- The scheduled statement sets its own real 30-second statement timeout before
-- entering this function. Cancellation is caught inside a subtransaction; the
-- negative run and sticky incident are written afterwards and may COMMIT.;;

CREATE OR REPLACE FUNCTION official_v3_guard_private.audit_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET jit=off AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
  entered timestamptz:=statement_timestamp(); started timestamptz; finished timestamptz; observed timestamptz;
  due timestamptz:=date_bin(interval '5 minutes',entered,timestamptz '2000-01-01 00:00:00+00');
  deadline timestamptz:=entered+interval '30 seconds'; first_due timestamptz; old_valid_until timestamptz;
  result text:='complete'; gap boolean:=false; healthy boolean:=false;
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
  -- A missed five-minute tick, server restart or bounded timeout never
  -- creates a STICKY integrity incident. require_open_v1() independently
  -- expires the old proof; only a NEW full checker pass restores it.
  -- Do not reset or extend valid_until here or use cron.status as proof.
  IF gap OR result<>'complete' THEN
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
      WHEN query_canceled OR lock_not_available OR deadlock_detected OR serialization_failure THEN result:='expired';
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
    gap:=true; -- stale, but NOT an integrity tamper report
  END IF;
  IF NOT healthy AND result='refused' THEN
    -- P7905/P7906, malformed certificate or unclassified checker exceptions:
    -- integrity is never auto-released by a later apparently green tick.
    PERFORM official_v3_guard_private.latch_incident_v1(due,'refused');
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
END $$;;;

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
DECLARE bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 official_v3_guard_private.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
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
 OR bg1_v3.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
 SET jit TO 'off'
AS $function$
WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private','jetnity_weather_private','official_v3_at_production_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','jetnity_bg1_alarm_kind_v2','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','reisewetter_reservieren_v1','jetnity_source_bound_at_visa_v1'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname IN ('profiles','saved_offers') OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
)
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries
$function$;
-- BG1 5-MINUTE INTEGRITY-ONLY ALARM DTO, UNAPPLIED CANDIDATE.
-- NOT independently runnable in Production: must be protected by a new
-- exact append-only BG1-v3 catalog successor, restrictive grants and Owner
-- authorization in same transaction as the guard policy upgrade.
-- Fixed schema/DTO, no caller-supplied params, raw role attributes, PII,
-- source bodies, operational secret, incident text or writable capability.
CREATE FUNCTION public.jetnity_bg1_alarm_kind_v2() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $bg1_alarm$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
 hard_generation bigint;
 status_value text:='temporarily_unavailable';
BEGIN
 SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton;
 IF NOT FOUND THEN RETURN jsonb_build_object('schema',1,'status','integrity_locked','incidentGeneration',0); END IF;
 SELECT min(generation) INTO hard_generation
 FROM official_v3_guard_private.incidents_v1
 WHERE generation>s.resumed_generation AND reason IN ('refused','clock');
 IF hard_generation IS NOT NULL THEN
  RETURN jsonb_build_object('schema',1,'status','integrity_locked','incidentGeneration',hard_generation);
 END IF;
 IF public.official_v3_guard_alarm_status_v1()->>'status'='current' THEN
  status_value:='current';
 END IF;
 RETURN jsonb_build_object('schema',1,'status',status_value,'incidentGeneration',0);
EXCEPTION WHEN OTHERS THEN
 -- Unknown control errors are not treated as a harmless restart.
 RETURN jsonb_build_object('schema',1,'status','integrity_locked','incidentGeneration',0);
END $bg1_alarm$;
REVOKE ALL ON FUNCTION public.jetnity_bg1_alarm_kind_v2() FROM PUBLIC,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.jetnity_bg1_alarm_kind_v2() TO anon;

INSERT INTO official_v3_guard_private.bg1_transient_baseline_v3
 (singleton,predecessor_catalog_digest,predecessor_baseline_digest,required_generation,proof_not_before,catalog)
 SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 s.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
 FROM official_v3_guard_private.at_batch_switch_baseline_v2 v
 CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton;
DO $post$
BEGIN
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_transient_baseline_v3)<>1
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 OR has_schema_privilege('anon','official_v3_guard_private','USAGE')
 OR has_table_privilege('anon','official_v3_guard_private.bg1_transient_baseline_v3','SELECT')
 OR has_table_privilege('anon','official_v3_guard_private.state_v1','SELECT')
 OR NOT has_function_privilege('anon','public.jetnity_bg1_alarm_kind_v2()','EXECUTE')
 OR has_function_privilege('authenticated','public.jetnity_bg1_alarm_kind_v2()','EXECUTE')
 OR (SELECT NOT(catalog ? ('function:'||'public.jetnity_bg1_alarm_kind_v2()'::regprocedure::oid::text)) FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton)
 OR (SELECT v.required_generation<=s.generation OR v.proof_not_before<=s.last_proof_started FROM official_v3_guard_private.bg1_transient_baseline_v3 v CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton)
 THEN RAISE EXCEPTION 'BG1_PROD_V3_POSTCHECK_STOP' USING ERRCODE='P7991';END IF;
END $post$;
SELECT 'PROD_SPECIFIC_BG1_V3_CANDIDATE_ROLLBACK_ONLY' AS result;
-- DO NOT replace this with COMMIT without independently confirmed backup,
-- postcommit successor rollback, full CI and explicit OWNER GO.
ROLLBACK;
