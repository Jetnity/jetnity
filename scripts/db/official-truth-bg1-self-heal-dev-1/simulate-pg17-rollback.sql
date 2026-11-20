-- DEV ONLY, BG1 autonomous transient-recovery v2 state-machine PG17 rehearsal.
-- Never executes or replaces an existing BG1 function, catalog baseline,
-- owner method, cron or production object. No persistent schema/table/role.
-- The successful 'fullProof' parameter is a TEST FIXTURE ONLY; in a future
-- signed migration, the actual check_control/catalog/hma/s1/jobs/hrs/
-- certificates/retirements functions must supply the result, not a client.
BEGIN;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='3s';
SET LOCAL search_path=pg_catalog;
CREATE TEMP TABLE bg1_v2_rehearsal_state(
 singleton boolean PRIMARY KEY CHECK(singleton),
 previous_due timestamptz,
 last_fullproof timestamptz,
 valid_until timestamptz,
 hard_reason text,
 alert_count integer NOT NULL CHECK(alert_count>=0),
 processed_count integer NOT NULL CHECK(processed_count>=0)
) ON COMMIT DROP;
INSERT INTO pg_temp.bg1_v2_rehearsal_state(singleton,alert_count,processed_count)
VALUES (true,0,0);

CREATE FUNCTION pg_temp.bg1_v2_rehearsal_tick(
 p_due timestamptz,p_finished timestamptz,p_class text,p_fullproof_for_fixture boolean
) RETURNS text LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog AS $sim$
DECLARE before_row pg_temp.bg1_v2_rehearsal_state%ROWTYPE;
BEGIN
 IF p_due IS NULL OR p_finished IS NULL
   OR p_due<>date_bin(interval '5 minutes',p_due,timestamptz '2000-01-01 00:00:00+00')
   OR p_finished<p_due OR p_finished>p_due+interval '30 seconds'
   OR p_class NOT IN ('complete','restart','timeout','deadlock','connection_reset',
      'integrity_catalog','integrity_checksum','integrity_permissions','integrity_history')
 THEN RAISE EXCEPTION 'BG1_INVALID_REHEARSAL_CASE'; END IF;
 SELECT * INTO STRICT before_row FROM pg_temp.bg1_v2_rehearsal_state WHERE singleton FOR UPDATE;
 IF before_row.previous_due IS NOT NULL AND p_due<=before_row.previous_due THEN
  RETURN CASE WHEN before_row.hard_reason IS NOT NULL THEN 'integrity_locked'
   WHEN before_row.valid_until IS NOT NULL AND p_finished<before_row.valid_until THEN 'current'
   ELSE 'temporarily_unavailable' END;
 END IF;
 IF p_class='complete' AND NOT p_fullproof_for_fixture THEN
  p_class:='integrity_history'; -- never accept a claimed success without proof
 END IF;
 UPDATE pg_temp.bg1_v2_rehearsal_state SET previous_due=p_due,
  processed_count=processed_count+1,
  hard_reason=CASE WHEN p_class LIKE 'integrity_%'
   THEN coalesce(hard_reason,p_class) ELSE hard_reason END,
  alert_count=CASE WHEN p_class LIKE 'integrity_%' AND hard_reason IS NULL
   THEN alert_count+1 ELSE alert_count END,
  last_fullproof=CASE WHEN p_class='complete' THEN p_finished ELSE last_fullproof END,
  valid_until=CASE WHEN p_class='complete' THEN p_due+interval '5 minutes 30 seconds'
   ELSE valid_until END WHERE singleton;
 SELECT * INTO STRICT before_row FROM pg_temp.bg1_v2_rehearsal_state WHERE singleton;
 RETURN CASE WHEN before_row.hard_reason IS NOT NULL THEN 'integrity_locked'
   WHEN before_row.valid_until IS NOT NULL AND p_finished<before_row.valid_until THEN 'current'
   ELSE 'temporarily_unavailable' END;
END $sim$;

DO $test$
DECLARE result text; s pg_temp.bg1_v2_rehearsal_state%ROWTYPE;
BEGIN
 -- At 00:00 genuine full checker success: lease for 330 seconds.
 result:=pg_temp.bg1_v2_rehearsal_tick('2026-11-20 00:00+00','2026-11-20 00:00:04+00','complete',true);
 IF result<>'current' THEN RAISE EXCEPTION 'BG1_R01_INITIAL_PROOF'; END IF;
 -- 00:05 is intentionally missed (server restart). No false incident.
 -- 00:10 is next full actual proven success. Auto current, no Owner.
 result:=pg_temp.bg1_v2_rehearsal_tick('2026-11-20 00:10+00','2026-11-20 00:10:04+00','complete',true);
 SELECT * INTO STRICT s FROM pg_temp.bg1_v2_rehearsal_state WHERE singleton;
 IF result<>'current' OR s.hard_reason IS NOT NULL OR s.alert_count<>0
   OR s.processed_count<>2 OR s.valid_until<>'2026-11-20 00:15:30+00'
 THEN RAISE EXCEPTION 'BG1_R02_AUTO_RECOVER_MISSED_TICK'; END IF;
 -- Timeout: does not create hard incident, stale is possible for one slot.
 result:=pg_temp.bg1_v2_rehearsal_tick('2026-11-20 00:15+00','2026-11-20 00:15:20+00','timeout',false);
 IF result<>'current' THEN RAISE EXCEPTION 'BG1_R03_BOUNDED_LEASE'; END IF;
 result:=pg_temp.bg1_v2_rehearsal_tick('2026-11-20 00:20+00','2026-11-20 00:20:04+00','complete',true);
 IF result<>'current' THEN RAISE EXCEPTION 'BG1_R04_AUTO_RECOVER_TIMEOUT'; END IF;
 -- A real protected catalog/privilege change ALWAYS locks, alerts once.
 result:=pg_temp.bg1_v2_rehearsal_tick('2026-11-20 00:25+00','2026-11-20 00:25:04+00','integrity_catalog',false);
 IF result<>'integrity_locked' THEN RAISE EXCEPTION 'BG1_R05_TAMPER_MUST_LOCK'; END IF;
 result:=pg_temp.bg1_v2_rehearsal_tick('2026-11-20 00:30+00','2026-11-20 00:30:04+00','complete',true);
 SELECT * INTO STRICT s FROM pg_temp.bg1_v2_rehearsal_state WHERE singleton;
 IF result<>'integrity_locked' OR s.alert_count<>1 OR s.hard_reason<>'integrity_catalog'
 THEN RAISE EXCEPTION 'BG1_R06_FULL_PROOF_CANNOT_UNLATCH_INTEGRITY'; END IF;
 -- Different hard reasons in one Owner-unresolved incident do NOT send spam.
 PERFORM pg_temp.bg1_v2_rehearsal_tick('2026-11-20 00:35+00','2026-11-20 00:35:04+00','integrity_checksum',false);
 SELECT * INTO STRICT s FROM pg_temp.bg1_v2_rehearsal_state WHERE singleton;
 IF s.alert_count<>1 THEN RAISE EXCEPTION 'BG1_R07_INTEGRITY_ALERT_DEDUP'; END IF;
 -- Exact protected Owner/AAL2 reapproval is not callable by this simulation:
 -- deleting a hard incident cannot be derived from the next green proof.
 -- A new independent fixture mimics the legitimate post-Owner recovered epoch.
 TRUNCATE pg_temp.bg1_v2_rehearsal_state;
 INSERT INTO pg_temp.bg1_v2_rehearsal_state(singleton,alert_count,processed_count)
 VALUES(true,0,0);
 result:=pg_temp.bg1_v2_rehearsal_tick('2026-11-20 01:00+00','2026-11-20 01:00:04+00','complete',false);
 SELECT * INTO STRICT s FROM pg_temp.bg1_v2_rehearsal_state WHERE singleton;
 IF result<>'integrity_locked' OR s.alert_count<>1 OR s.hard_reason<>'integrity_history'
 THEN RAISE EXCEPTION 'BG1_R08_FAKE_SUCCESS_CANNOT_RECOVER'; END IF;
 -- No roll forward of repeated completed slot.
 result:=pg_temp.bg1_v2_rehearsal_tick('2026-11-20 01:00+00','2026-11-20 01:00:04+00','complete',true);
 SELECT * INTO STRICT s FROM pg_temp.bg1_v2_rehearsal_state WHERE singleton;
 IF result<>'integrity_locked' OR s.processed_count<>1
 THEN RAISE EXCEPTION 'BG1_R09_REPLAY_REFUSED'; END IF;
END $test$;

SELECT jsonb_build_object(
 'status','DEV_PG17_TRANSIENT_RECOVERY_9_CASES_PASS',
 'fixture_only',true,'touched_real_bg1',false,'production_touched',false,
 'transient_auto_recovers',true,'catalog_integrity_remains_owner_locked',true,
 'hard_incident_alert_is_deduplicated',true
) AS result;
ROLLBACK;
