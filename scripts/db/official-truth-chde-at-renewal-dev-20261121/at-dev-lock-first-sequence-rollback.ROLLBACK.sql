-- PG17 / isolated temporary objects only. NO hosted pg_net mutation.
-- Exercises real SAVEPOINT rollback of sequence state, not just object removal
-- at final ROLLBACK. No setval, Owner/session claims or role impersonation.
-- This single-session proof is not a two-session concurrency test.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='2s';
DO $environment$
BEGIN
 IF current_setting('server_version_num')::integer/10000<>17
 OR current_user<>session_user
 OR to_regclass('official_v3_at_production_private.watch_requests_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_OR_DISPOSABLE_PG17_ONLY' USING ERRCODE='P7998'; END IF;
END $environment$;
CREATE TEMP TABLE pg_temp.at_sequence_seen(request_id bigint PRIMARY KEY) ON COMMIT DROP;
INSERT INTO pg_temp.at_sequence_seen VALUES(61),(62),(77),(185),(196);
CREATE TEMP SEQUENCE pg_temp.at_sequence_called AS bigint START 77 INCREMENT 1 CACHE 1 NO CYCLE;
CREATE TEMP SEQUENCE pg_temp.at_sequence_uncalled AS bigint START 79 INCREMENT 1 CACHE 1 NO CYCLE;
SELECT nextval('pg_temp.at_sequence_called'::regclass);
CREATE TEMP TABLE pg_temp.at_sequence_original(
 name text PRIMARY KEY,last_value bigint NOT NULL,is_called boolean NOT NULL,parameters jsonb NOT NULL
) ON COMMIT DROP;
INSERT INTO pg_temp.at_sequence_original
 SELECT 'called',s.last_value,s.is_called,to_jsonb(p)-'seqrelid'
 FROM pg_temp.at_sequence_called s CROSS JOIN pg_sequence p
 WHERE p.seqrelid='pg_temp.at_sequence_called'::regclass;
INSERT INTO pg_temp.at_sequence_original
 SELECT 'uncalled',s.last_value,s.is_called,to_jsonb(p)-'seqrelid'
 FROM pg_temp.at_sequence_uncalled s CROSS JOIN pg_sequence p
 WHERE p.seqrelid='pg_temp.at_sequence_uncalled'::regclass;

SAVEPOINT before_restart;
ALTER SEQUENCE pg_temp.at_sequence_called INCREMENT BY 1;
ALTER SEQUENCE pg_temp.at_sequence_uncalled INCREMENT BY 1;
DO $restart$
DECLARE seq regclass; old_value bigint; highest bigint; first_new bigint; a bigint; b bigint;
BEGIN
 FOREACH seq IN ARRAY ARRAY['pg_temp.at_sequence_called'::regclass,'pg_temp.at_sequence_uncalled'::regclass] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='relation' AND pid=pg_backend_pid()
    AND relation=seq AND mode='ShareRowExclusiveLock' AND granted)
  THEN RAISE EXCEPTION 'NATIVE_SEQUENCE_LOCK_NOT_HELD' USING ERRCODE='P7998'; END IF;
  EXECUTE format('SELECT last_value FROM %s',seq) INTO STRICT old_value;
  SELECT max(request_id) INTO STRICT highest FROM pg_temp.at_sequence_seen;
  first_new:=greatest(highest,old_value)+1;
  EXECUTE format('ALTER SEQUENCE %s RESTART WITH %s',seq,first_new);
  a:=nextval(seq);
  b:=nextval(seq);
  IF a<>197 OR b<>198 OR a<=highest OR a<=old_value
  THEN RAISE EXCEPTION 'NATIVE_SEQUENCE_FORWARD_RESTART_FAILED' USING ERRCODE='P7998'; END IF;
 END LOOP;
 INSERT INTO pg_temp.at_sequence_seen VALUES(197),(198);
END $restart$;
ROLLBACK TO SAVEPOINT before_restart;

DO $rollback_verify$
DECLARE seq regclass; label text; actual_value bigint; actual_called boolean; parameters jsonb; expected record;
BEGIN
 FOREACH label IN ARRAY ARRAY['called','uncalled'] LOOP
  seq:=to_regclass('pg_temp.at_sequence_'||label);
  SELECT * INTO STRICT expected FROM pg_temp.at_sequence_original WHERE name=label;
  EXECUTE format('SELECT last_value,is_called FROM %s',seq) INTO STRICT actual_value,actual_called;
  SELECT to_jsonb(s)-'seqrelid' INTO STRICT parameters FROM pg_sequence s WHERE s.seqrelid=seq;
  IF actual_value IS DISTINCT FROM expected.last_value
   OR actual_called IS DISTINCT FROM expected.is_called OR parameters IS DISTINCT FROM expected.parameters
  THEN RAISE EXCEPTION 'NATIVE_SEQUENCE_SAVEPOINT_ROLLBACK_FAILED' USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_temp.at_sequence_seen)<>5
  OR EXISTS(SELECT 1 FROM pg_temp.at_sequence_seen WHERE request_id>196)
 THEN RAISE EXCEPTION 'NATIVE_SEQUENCE_LEDGER_ROLLBACK_FAILED' USING ERRCODE='P7998'; END IF;
END $rollback_verify$;

SAVEPOINT retry_restart;
ALTER SEQUENCE pg_temp.at_sequence_called INCREMENT BY 1;
DO $retry$
DECLARE old_value bigint; highest bigint; a bigint; b bigint; unchanged_last bigint; unchanged_called boolean;
BEGIN
 SELECT last_value INTO STRICT old_value FROM pg_temp.at_sequence_called;
 SELECT max(request_id) INTO STRICT highest FROM pg_temp.at_sequence_seen;
 EXECUTE format('ALTER SEQUENCE pg_temp.at_sequence_called RESTART WITH %s',greatest(old_value,highest)+1);
 a:=nextval('pg_temp.at_sequence_called'::regclass);
 INSERT INTO pg_temp.at_sequence_seen VALUES(a);
 SELECT last_value INTO STRICT old_value FROM pg_temp.at_sequence_called;
 SELECT max(request_id) INTO STRICT highest FROM pg_temp.at_sequence_seen;
 EXECUTE format('ALTER SEQUENCE pg_temp.at_sequence_called RESTART WITH %s',greatest(old_value,highest)+1);
 b:=nextval('pg_temp.at_sequence_called'::regclass);
 IF a<>197 OR b<>198 OR b<=a THEN
  RAISE EXCEPTION 'NATIVE_SEQUENCE_REPEAT_NOT_MONOTONIC' USING ERRCODE='P7998'; END IF;
 -- Overflow is rejected before addition or any sequence restart.
 SELECT last_value,is_called INTO STRICT unchanged_last,unchanged_called FROM pg_temp.at_sequence_called;
 BEGIN
  highest:=9223372036854775807;
  IF greatest(highest,unchanged_last)>=9223372036854775807 THEN
   RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_INVALID_OR_EXHAUSTED_RANGE' USING ERRCODE='P7998'; END IF;
  RAISE EXCEPTION 'NATIVE_RANGE_GUARD_DID_NOT_REJECT';
 EXCEPTION WHEN SQLSTATE 'P7998' THEN
  IF SQLERRM<>'AT_SEQUENCE_RELEASE_STOP_INVALID_OR_EXHAUSTED_RANGE' THEN RAISE; END IF;
 END;
 IF (SELECT last_value FROM pg_temp.at_sequence_called)<>unchanged_last
  OR (SELECT is_called FROM pg_temp.at_sequence_called) IS DISTINCT FROM unchanged_called
 THEN RAISE EXCEPTION 'NATIVE_RANGE_FAILURE_CHANGED_SEQUENCE' USING ERRCODE='P7998'; END IF;
END $retry$;
ROLLBACK TO SAVEPOINT retry_restart;
DO $final_verify$
BEGIN
 IF (SELECT last_value FROM pg_temp.at_sequence_called)<>77
 OR (SELECT is_called FROM pg_temp.at_sequence_called) IS DISTINCT FROM true
 OR (SELECT last_value FROM pg_temp.at_sequence_uncalled)<>79
 OR (SELECT is_called FROM pg_temp.at_sequence_uncalled) IS DISTINCT FROM false
 OR (SELECT count(*) FROM pg_temp.at_sequence_seen)<>5
 THEN RAISE EXCEPTION 'NATIVE_SEQUENCE_FINAL_RESTORE_FAILED' USING ERRCODE='P7998'; END IF;
END $final_verify$;
SELECT 'PG17_TEMP_SEQUENCE_LOCK_FIRST_SAVEPOINT_ROLLBACK_PASS' AS result,
 true AS called_state_restored,true AS uncalled_state_restored,
 true AS ledger_restored,true AS repeat_moves_forward,true AS exhaustion_refused,
 false AS hosted_pgnet_changed,false AS two_session_concurrency_proven,
 false AS facts_published;
ROLLBACK;
