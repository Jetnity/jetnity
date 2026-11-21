-- REVIEW CANDIDATE ONLY. Author: independent AT source-guard review, 2026-11-21.
-- Run ONLY via the verified Development project yfvbxvijcorffwxbxahl after
-- connectivity/identity is independently established. Not executed by reviewer.
-- No source approval, fabricated receipt, HTTP request, DDL, role grant or login.
-- Deliberately NOT READ ONLY: the actual publisher uses SELECT ... FOR SHARE;
-- its catch-all would turn READ ONLY errors into a misleading zero result.
-- The required real, fresh 3/3 unchanged source batch is NEVER synthesized.
-- A missing/stale/changed batch must STOP this test; restore monitoring first.
-- Snapshot equality proves no fact or source mutation within this transaction.
-- ROLLBACK protects row writes; nextval is nontransactional, so the real fact
-- sequence is independently checked and is NEVER decremented to hide a failure.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';

DO $native_source_guard$
DECLARE
 b official_v3_source_renewal_private.batches_v1%ROWTYPE;
 stamp timestamptz;
 first_result integer;
 repeat_result integer;
 before_state jsonb;
 after_state jsonb;
 seq_name text;
 before_seq jsonb;
 after_seq jsonb;
 current_body_sha text;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres'
 OR session_user<>'postgres' OR auth.uid() IS NOT NULL
 OR current_setting('server_version_num')::integer/10000<>17
 OR to_regclass('official_v3_guard_private.source_renewal_baseline_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR NOT pg_try_advisory_xact_lock(771108,44)
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_DEV_IDENTITY_OR_CONCURRENCY_STOP'; END IF;

 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR NOT (SELECT catalog=official_v3_guard_private.catalog_status_v1()
         FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 WHERE singleton)
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_CURRENT_EXACT_BG1_REQUIRED'; END IF;

 SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') INTO STRICT current_body_sha
 FROM pg_proc WHERE oid='official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure;
 -- Derived from the exact v4 source body on branch head b378c39b. A later
 -- publisher body requires independent review, never automatic hash refresh.
 IF current_body_sha IS DISTINCT FROM '05bf4f11d1b5b482d798afc11396c53016cd17470ce3b857cacb87323b520105'
 OR has_function_privilege('anon','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 OR has_function_privilege('authenticated','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 OR has_function_privilege('service_role','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_PUBLISHER_OR_PRIVILEGE_CHANGED'; END IF;

 -- Independently establish every gate BEFORE the installed legal-source
 -- barrier, including the same row lock in a writable transaction.
 SELECT * INTO b FROM official_v3_source_renewal_private.batches_v1
 WHERE destination_code='AT' ORDER BY source_batch_id DESC LIMIT 1 FOR SHARE;
 stamp:=clock_timestamp();
 IF NOT FOUND OR b.outcome<>'unchanged' OR b.source_count<>3
 OR b.requested_at>stamp OR b.requested_at<=stamp-interval '65 minutes'
 OR b.sealed_at<b.requested_at OR b.sealed_at>stamp
 OR (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1 WHERE destination_code='AT')<>3
 OR (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1
     WHERE destination_code='AT' AND role='destination_primary')<>1
 OR (SELECT count(*) FROM official_v3_source_renewal_private.observations_v1
     WHERE destination_code='AT' AND source_batch_id=b.source_batch_id
       AND result IN ('unchanged_exact','unchanged_asset_version_only'))<>3
 OR b.source_batch_id IS DISTINCT FROM (SELECT max(batch_id)
     FROM official_v3_at_source_watch_private.batches_v1)
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_REAL_FRESH_COMPLETE_UNCHANGED_BATCH_REQUIRED'; END IF;

 IF (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1
     WHERE batch_id=b.source_batch_id)<>3
 OR EXISTS (
   SELECT 1 FROM official_v3_source_renewal_private.observations_v1 o
   JOIN official_v3_source_renewal_private.sources_v1 p USING(destination_code,source_id)
   LEFT JOIN official_v3_at_source_watch_private.reads_v1 r
     ON r.batch_id=o.source_batch_id AND r.source_id=o.source_id
   LEFT JOIN official_v3_at_source_watch_private.pins_v1 wp ON wp.source_id=o.source_id
   WHERE o.destination_code='AT' AND o.source_batch_id=b.source_batch_id AND (
    r.source_id IS NULL OR wp.source_id IS NULL
    OR r.request_id IS DISTINCT FROM o.request_id OR r.state IS DISTINCT FROM o.result
    OR r.requested_at IS DISTINCT FROM b.requested_at
    OR o.requested_at IS DISTINCT FROM b.requested_at
    OR r.observed_at IS DISTINCT FROM o.observed_at
    OR r.observed_sha IS DISTINCT FROM o.observed_sha
    OR r.observed_bytes IS DISTINCT FROM o.observed_bytes
    OR wp.url IS DISTINCT FROM p.official_url OR wp.raw_sha IS DISTINCT FROM p.raw_sha
    OR wp.expected_bytes IS DISTINCT FROM p.original_bytes
    OR wp.canonical_sha IS DISTINCT FROM p.canonical_sha
    OR o.observed_at IS NULL OR o.observed_at>stamp OR o.observed_at<o.requested_at
    OR o.observed_at>o.requested_at+interval '5 minutes 10 seconds'
    OR o.observed_at<=stamp-interval '65 minutes'
    OR (o.result='unchanged_exact' AND
       (o.observed_sha IS DISTINCT FROM p.raw_sha OR o.observed_bytes IS DISTINCT FROM p.original_bytes))
    OR (o.result='unchanged_asset_version_only' AND
       (p.source_id<>'bmeia-bern-how-to-apply' OR p.normalization<>'bmeia-theme-assets-v1'
        OR p.canonical_sha IS DISTINCT FROM 'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
        OR o.observed_bytes IS DISTINCT FROM p.original_bytes))
   ))
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_REAL_MONITOR_TO_JOURNAL_MISMATCH'; END IF;

 -- Exact original bytes are recomputed, not inferred from metadata alone.
 IF (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
      WHERE disposition='RESEARCH_ONLY' AND NOT importable AND accepted_fact_count=0)<>3
 OR EXISTS (
   SELECT 1 FROM official_v3_source_renewal_private.sources_v1 p
   LEFT JOIN official_v3_at_private.whole_originals_v2 o USING(source_id)
   WHERE p.destination_code='AT' AND (o.source_id IS NULL
      OR o.official_url IS DISTINCT FROM p.official_url
      OR o.body_digest IS DISTINCT FROM p.raw_sha
      OR encode(sha256(o.original_body),'hex') IS DISTINCT FROM p.raw_sha
      OR octet_length(o.original_body) IS DISTINCT FROM p.original_bytes))
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_THREE_EXACT_RESEARCH_ONLY_ORIGINALS_REQUIRED'; END IF;

 SELECT jsonb_build_object(
  'facts_count',(SELECT count(*) FROM official_v3_source_renewal_private.facts_v1),
  'facts_sha',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(f)::text,'|' ORDER BY fact_id),''),'UTF8')),'hex') FROM official_v3_source_renewal_private.facts_v1 f),
  'historical_visas_count',(SELECT count(*) FROM official_v3_at_private.verified_visas_v3),
  'historical_visas_sha',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(v)::text,'|' ORDER BY rule_version),''),'UTF8')),'hex') FROM official_v3_at_private.verified_visas_v3 v),
  'originals_sha',(SELECT encode(sha256(convert_to(string_agg(((to_jsonb(o)-'original_body')||jsonb_build_object('actual_body_sha',encode(sha256(original_body),'hex')))::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_at_private.whole_originals_v2 o),
  'sources_sha',(SELECT encode(sha256(convert_to(string_agg(to_jsonb(p)::text,'|' ORDER BY destination_code,source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_source_renewal_private.sources_v1 p),
  'batch_sha',(SELECT encode(sha256(convert_to(to_jsonb(x)::text,'UTF8')),'hex') FROM official_v3_source_renewal_private.batches_v1 x WHERE destination_code='AT' AND source_batch_id=b.source_batch_id),
  'observations_sha',(SELECT encode(sha256(convert_to(string_agg(to_jsonb(o)::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_source_renewal_private.observations_v1 o WHERE destination_code='AT' AND source_batch_id=b.source_batch_id)
 ) INTO before_state;
 seq_name:=pg_get_serial_sequence('official_v3_source_renewal_private.facts_v1','fact_id');
 IF seq_name IS NULL THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_FACT_SEQUENCE_MISSING'; END IF;
 EXECUTE format('SELECT jsonb_build_object(''last_value'',last_value,''is_called'',is_called) FROM %s',seq_name::regclass) INTO before_seq;

 first_result:=official_v3_source_renewal_private.renew_approved_batch_v1('AT',b.source_batch_id);
 repeat_result:=official_v3_source_renewal_private.renew_approved_batch_v1('AT',b.source_batch_id);
 IF first_result IS DISTINCT FROM 0 OR repeat_result IS DISTINCT FROM 0
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_UNQUALIFIED_SOURCE_PUBLISHED'; END IF;

 SELECT jsonb_build_object(
  'facts_count',(SELECT count(*) FROM official_v3_source_renewal_private.facts_v1),
  'facts_sha',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(f)::text,'|' ORDER BY fact_id),''),'UTF8')),'hex') FROM official_v3_source_renewal_private.facts_v1 f),
  'historical_visas_count',(SELECT count(*) FROM official_v3_at_private.verified_visas_v3),
  'historical_visas_sha',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(v)::text,'|' ORDER BY rule_version),''),'UTF8')),'hex') FROM official_v3_at_private.verified_visas_v3 v),
  'originals_sha',(SELECT encode(sha256(convert_to(string_agg(((to_jsonb(o)-'original_body')||jsonb_build_object('actual_body_sha',encode(sha256(original_body),'hex')))::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_at_private.whole_originals_v2 o),
  'sources_sha',(SELECT encode(sha256(convert_to(string_agg(to_jsonb(p)::text,'|' ORDER BY destination_code,source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_source_renewal_private.sources_v1 p),
  'batch_sha',(SELECT encode(sha256(convert_to(to_jsonb(x)::text,'UTF8')),'hex') FROM official_v3_source_renewal_private.batches_v1 x WHERE destination_code='AT' AND source_batch_id=b.source_batch_id),
  'observations_sha',(SELECT encode(sha256(convert_to(string_agg(to_jsonb(o)::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_source_renewal_private.observations_v1 o WHERE destination_code='AT' AND source_batch_id=b.source_batch_id)
 ) INTO after_state;
 EXECUTE format('SELECT jsonb_build_object(''last_value'',last_value,''is_called'',is_called) FROM %s',seq_name::regclass) INTO after_seq;
 IF before_state IS DISTINCT FROM after_state OR before_seq IS DISTINCT FROM after_seq
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_SOURCE_FACT_OR_SEQUENCE_MUTATED'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'AT_NATIVE_PROOF_BG1_EXPIRED_DURING_TEST'; END IF;
END $native_source_guard$;

-- Plain aggregate only. No Row-IDs/Owner data or original bodies leave the DB.
SELECT 'DEV_AT_REAL_PUBLISHER_RESEARCH_ONLY_ZERO_FACT_ROLLBACK_PASS' AS result,
       2 AS real_publisher_calls,3 AS exact_research_only_originals,
       0 AS new_facts,true AS source_and_history_hashes_unchanged,
       true AS fact_sequence_unchanged,false AS positive_renewal_proven;
ROLLBACK;
