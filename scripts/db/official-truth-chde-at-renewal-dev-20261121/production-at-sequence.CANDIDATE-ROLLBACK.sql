-- NOT AN APPROVED INSTALLER: Production pg_net sequence repair only after v4 source guard.
-- This executable candidate REMAINS ROLLBACK-only, needs a separate Owner Go.
-- PostgreSQL 17 ALTER SEQUENCE RESTART is transactional and blocks concurrent nextval.
-- https://www.postgresql.org/docs/17/sql-altersequence.html
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='2s';
DO $at_pre$
DECLARE now_value bigint; prior_high bigint; new_first bigint; approved integer; source_total integer;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NULL
 OR to_regclass('official_v3_at_production_private.watch_requests_v1') IS NULL
 OR NOT pg_try_advisory_xact_lock(771112,1)
 THEN RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_PREREQUISITE' USING ERRCODE='P7998'; END IF;
 SELECT count(*),count(*) FILTER(WHERE source_qualified AND NOT research_only)
 INTO source_total,approved FROM official_v3_at_production_private.source_pins_v1;
 -- Research-only physical originals must NEVER turn into positive customer facts.
 -- Current Production fails this gate: 0/3 qualified.
 IF source_total<>3 OR approved<>3
 THEN RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_SOURCE_NOT_QUALIFIED' USING ERRCODE='P7998';END IF;
 -- A future protected v4 successor of renew_ch_v1 must independently require
 -- the same exact legal-source-to-rule/Document/MA1/Owner gate.
 IF to_regclass('official_v3_guard_private.bg1_transient_correction_baseline_v4') IS NULL
 THEN RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_PROTECTED_V4_GUARD_MISSING' USING ERRCODE='P7998';END IF;
 SELECT last_value INTO STRICT now_value FROM net.http_request_queue_id_seq;
 SELECT greatest(coalesce((SELECT max(request_id) FROM official_v3_at_production_private.watch_requests_v1),0),
  coalesce((SELECT max(net_request_id) FROM jetnity_prod_import_scheduler.dispatches_v1),0),
  coalesce((SELECT max(id) FROM net._http_response),0),
  coalesce((SELECT max(id) FROM net.http_request_queue),0)) INTO prior_high;
 IF now_value<1 OR prior_high<1 OR prior_high>=9223372036854775800
 THEN RAISE EXCEPTION 'AT_SEQUENCE_RELEASE_STOP_INVALID_NUMBERS' USING ERRCODE='P7998';END IF;
 new_first:=greatest(prior_high,now_value)+1;
 -- No historical request IDs are deleted/reused. Under the exact guarded Go,
 -- this transactional restart is idempotent and blocks concurrent nextval.
 EXECUTE format('ALTER SEQUENCE net.http_request_queue_id_seq RESTART WITH %s',new_first);
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $at_pre$;
-- Still unapproved even with an all-green schema: never imply new source approval.
ROLLBACK;
