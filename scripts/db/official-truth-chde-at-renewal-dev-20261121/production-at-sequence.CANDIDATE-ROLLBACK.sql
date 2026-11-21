-- REVIEW CANDIDATE ONLY. Do not execute on Production without a separate Owner Go.
-- Requires the normal AT legal-source v4 successor and a fresh natural BG1 proof.
-- No source qualification, fact renewal, role change, HTTP call or scheduler restart.
-- PostgreSQL 17: ALTER SEQUENCE takes the sequence lock before the state reread.
-- https://www.postgresql.org/docs/17/sql-altersequence.html
-- Release preflight must independently inventory all durable pg_net request-ID
-- consumers. The two application ledgers below are the reviewed known Production
-- consumers; an additional durable ledger requires an amended high-water query.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='20s';

DO $at_pre$
DECLARE approved integer; source_total integer; seq pg_sequence%ROWTYPE;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed'
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NULL
 OR to_regclass('official_v3_at_production_private.watch_requests_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR NOT pg_try_advisory_xact_lock(771112,1)
 OR NOT pg_try_advisory_xact_lock(771112,2)
 THEN RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_PREREQUISITE' USING ERRCODE='P7998'; END IF;
 -- Order is AT enqueue lock, AT renewal lock, sequence lock; never acquire
 -- a row/table writer lock after the sequence lock. Other pg_net producers
 -- do not honor AT advisory locks: the sequence lock is the global barrier.
 SELECT count(*),count(*) FILTER(WHERE source_qualified AND NOT research_only)
 INTO source_total,approved FROM official_v3_at_production_private.source_pins_v1;
 IF source_total<>3 OR approved<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1
     WHERE research_only AND NOT source_qualified)<>3
 THEN RAISE EXCEPTION 'AT_SEQUENCE_SOURCE_INVENTORY_CHANGED' USING ERRCODE='P7998'; END IF;
 IF to_regclass('official_v3_guard_private.at_legal_source_guard_baseline_v4') IS NULL
 THEN RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_PROTECTED_V4_GUARD_MISSING' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF NOT EXISTS(SELECT 1 FROM official_v3_guard_private.at_legal_source_guard_baseline_v4 v
     WHERE singleton AND v.catalog=official_v3_guard_private.catalog_status_v1()
       AND v.publisher_function_digest=
        encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex'))
 THEN RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_SOURCE_PUBLISHER_UNVERIFIED' USING ERRCODE='P7998'; END IF;
 SELECT * INTO STRICT seq FROM pg_sequence
  WHERE seqrelid='net.http_request_queue_id_seq'::regclass;
 IF seq.seqtypid<>'bigint'::regtype OR seq.seqincrement<>1 OR seq.seqcache<>1
  OR seq.seqcycle OR seq.seqmin<>1 OR seq.seqmax<>9223372036854775807
 THEN RAISE EXCEPTION 'AT_SEQUENCE_UNREVIEWED_GENERATOR_PARAMETERS' USING ERRCODE='P7998'; END IF;
END $at_pre$;

-- Deliberately no value read precedes this lock. INCREMENT BY 1 is a no-op
-- for the exact reviewed metadata. It blocks nextval/setval until rollback.
ALTER SEQUENCE net.http_request_queue_id_seq INCREMENT BY 1;

-- A new READ COMMITTED command obtains a snapshot after waiting for any
-- producer that had already allocated an ID and had not yet committed.
DO $at_locked$
DECLARE seq pg_sequence%ROWTYPE; now_value bigint; was_called boolean;
 prior_high bigint; new_first bigint; after_value bigint; after_called boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_locks
  WHERE locktype='relation' AND pid=pg_backend_pid()
   AND relation='net.http_request_queue_id_seq'::regclass
   AND mode='ShareRowExclusiveLock' AND granted)
 THEN RAISE EXCEPTION 'AT_SEQUENCE_GLOBAL_LOCK_MISSING' USING ERRCODE='P7998'; END IF;
 SELECT * INTO STRICT seq FROM pg_sequence
  WHERE seqrelid='net.http_request_queue_id_seq'::regclass;
 IF seq.seqtypid<>'bigint'::regtype OR seq.seqincrement<>1 OR seq.seqcache<>1
  OR seq.seqcycle OR seq.seqmin<>1 OR seq.seqmax<>9223372036854775807
 THEN RAISE EXCEPTION 'AT_SEQUENCE_PARAMETERS_CHANGED_WHILE_WAITING' USING ERRCODE='P7998'; END IF;
 SELECT last_value,is_called INTO STRICT now_value,was_called
  FROM net.http_request_queue_id_seq;
 SELECT greatest(
  coalesce((SELECT max(request_id) FROM official_v3_at_production_private.watch_requests_v1),0),
  coalesce((SELECT max(net_request_id) FROM jetnity_prod_import_scheduler.dispatches_v1),0),
  coalesce((SELECT max(id) FROM net._http_response),0),
  coalesce((SELECT max(id) FROM net.http_request_queue),0)) INTO prior_high;
 IF now_value<1 OR prior_high<1 OR greatest(prior_high,now_value)>=seq.seqmax
 THEN RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_INVALID_OR_EXHAUSTED_RANGE' USING ERRCODE='P7998'; END IF;
 new_first:=greatest(prior_high,now_value)+1;
 EXECUTE format('ALTER SEQUENCE net.http_request_queue_id_seq RESTART WITH %s',new_first);
 SELECT last_value,is_called INTO STRICT after_value,after_called
  FROM net.http_request_queue_id_seq;
 IF after_value<>new_first OR after_called IS DISTINCT FROM false
  OR new_first<=now_value OR new_first<=prior_high
 THEN RAISE EXCEPTION 'AT_SEQUENCE_LOCKED_RESTART_POSTCHECK_FAILED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'AT_SEQUENCE_PROOF_EXPIRED_DURING_REPAIR' USING ERRCODE='P7998'; END IF;
 -- No nextval here: a real HTTP request receives the first new ID only after
 -- a separately approved commit. Retrying can skip an unused ID, never reuse one.
END $at_locked$;

-- This review artifact cannot persist a repair. After a future authorized
-- COMMIT, never decrement as rollback; use an independently reviewed successor.
ROLLBACK;
