BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='24s';
-- DEV ONLY: atomic capture at actual source-collector settlement, before pg_net 6-hour TTL.
-- Included in V14 BG1 transaction. No publication, no method issuance, no Production.
CREATE TABLE official_v3_at_source_watch_private.raw_bodies_v2(
 source_id text NOT NULL REFERENCES official_v3_at_source_watch_private.pins_v1(source_id),
 raw_body bytea NOT NULL,
 raw_sha text GENERATED ALWAYS AS (encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS (octet_length(raw_body)) STORED,
 first_batch_id bigint NOT NULL REFERENCES official_v3_at_source_watch_private.batches_v1(batch_id),
 first_request_id bigint NOT NULL,
 stored_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(source_id,raw_sha),
 CHECK(octet_length(raw_body) BETWEEN 1 AND 1048576)
);
CREATE TABLE official_v3_at_source_watch_private.raw_receipts_v2(
 batch_id bigint NOT NULL REFERENCES official_v3_at_source_watch_private.batches_v1(batch_id),
 source_id text NOT NULL,
 request_id bigint NOT NULL,
 raw_sha text NOT NULL CHECK(raw_sha~'^[a-f0-9]{64}$'),
 raw_bytes integer NOT NULL CHECK(raw_bytes BETWEEN 1 AND 1048576),
 captured_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 observed_at timestamptz NOT NULL,
 watch_state text NOT NULL CHECK(watch_state IN('unchanged_exact','unchanged_asset_version_only','changed')),
 PRIMARY KEY(batch_id,source_id),
 UNIQUE(request_id),
 FOREIGN KEY(source_id,raw_sha) REFERENCES official_v3_at_source_watch_private.raw_bodies_v2(source_id,raw_sha)
);
DO $acl$
DECLARE nm text;
BEGIN
 FOREACH nm IN ARRAY ARRAY['raw_bodies_v2','raw_receipts_v2'] LOOP
  EXECUTE format('ALTER TABLE official_v3_at_source_watch_private.%I ENABLE ROW LEVEL SECURITY',nm);
  EXECUTE format('ALTER TABLE official_v3_at_source_watch_private.%I FORCE ROW LEVEL SECURITY',nm);
  EXECUTE format('REVOKE ALL ON official_v3_at_source_watch_private.%I FROM PUBLIC,anon,authenticated,service_role',nm);
  EXECUTE format('CREATE POLICY postgres_only ON official_v3_at_source_watch_private.%I FOR ALL TO postgres USING(true) WITH CHECK(true)',nm);
  EXECUTE format('CREATE TRIGGER archive_immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_source_watch_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',nm);
  EXECUTE format('CREATE TRIGGER archive_immutable_truncate BEFORE TRUNCATE ON official_v3_at_source_watch_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',nm);
 END LOOP;
END $acl$;

CREATE FUNCTION official_v3_at_source_watch_private.archive_on_collect_v2()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $archive$
DECLARE result_body bytea; response record; computed_sha text; bytes integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR TG_OP<>'UPDATE'
 OR OLD.state<>'pending' OR NEW.state='pending'
 OR NEW.batch_id IS DISTINCT FROM OLD.batch_id
 OR NEW.source_id IS DISTINCT FROM OLD.source_id
 OR NEW.request_id IS DISTINCT FROM OLD.request_id
 OR NEW.requested_at IS DISTINCT FROM OLD.requested_at
 OR NEW.source_id NOT IN ('bmeia-bern-how-to-apply','bmi-general-entry','bmi-visa-nationality-matrix')
 THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_COLLECT_CONTEXT_REFUSED' USING ERRCODE='P7986'; END IF;
 IF NEW.state='unavailable' AND NEW.observed_sha IS NULL AND NEW.observed_bytes IS NULL
 THEN RETURN NULL; END IF;
 IF NEW.state NOT IN ('changed','unchanged_exact','unchanged_asset_version_only')
 OR NEW.observed_sha IS NULL OR NEW.observed_bytes IS NULL
 OR NEW.observed_at IS NULL OR NEW.observed_at<NEW.requested_at
 OR NEW.observed_at>clock_timestamp()
 THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_INCONSISTENT_OBSERVATION' USING ERRCODE='P7986'; END IF;
 SELECT status_code,timed_out,error_msg,content_type,content
 INTO response FROM net._http_response WHERE id=NEW.request_id;
 IF NOT FOUND OR response.status_code<>200 OR response.timed_out IS DISTINCT FROM FALSE
 OR response.error_msg IS NOT NULL OR response.content IS NULL
 OR response.content_type !~* '^text/html([; ]|$)'
 THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_HTTP_NOT_AVAILABLE' USING ERRCODE='P7986'; END IF;
 result_body:=convert_to(response.content,'UTF8');
 bytes:=octet_length(result_body);
 IF bytes NOT BETWEEN 1 AND 1048576 OR bytes<>NEW.observed_bytes
 THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_LENGTH_MISMATCH' USING ERRCODE='P7986'; END IF;
 computed_sha:=encode(sha256(result_body),'hex');
 IF computed_sha<>NEW.observed_sha
 THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_HASH_MISMATCH' USING ERRCODE='P7986'; END IF;
 -- Fixed private lock and finite content budget. No repeated copy for unchanged
 -- originals; if resource budget is hit, source collection fails CLOSED.
 PERFORM pg_advisory_xact_lock(771112,46);
 IF NOT EXISTS(SELECT 1 FROM official_v3_at_source_watch_private.raw_bodies_v2
    WHERE source_id=NEW.source_id AND raw_sha=computed_sha)
 AND (SELECT coalesce(sum(raw_bytes),0) FROM official_v3_at_source_watch_private.raw_bodies_v2)+bytes>33554432
 THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_32MIB_BUDGET_STOP' USING ERRCODE='P7986'; END IF;
 INSERT INTO official_v3_at_source_watch_private.raw_bodies_v2(
  source_id,raw_body,first_batch_id,first_request_id)
 VALUES(NEW.source_id,result_body,NEW.batch_id,NEW.request_id)
 ON CONFLICT(source_id,raw_sha) DO NOTHING;
 INSERT INTO official_v3_at_source_watch_private.raw_receipts_v2(
  batch_id,source_id,request_id,raw_sha,raw_bytes,observed_at,watch_state)
 VALUES(NEW.batch_id,NEW.source_id,NEW.request_id,computed_sha,bytes,NEW.observed_at,NEW.state);
 RETURN NULL;
END $archive$;
REVOKE ALL ON FUNCTION official_v3_at_source_watch_private.archive_on_collect_v2()
 FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER capture_original_on_collect_v2
 AFTER UPDATE OF state ON official_v3_at_source_watch_private.reads_v1
 FOR EACH ROW WHEN (OLD.state='pending' AND NEW.state<>'pending')
 EXECUTE FUNCTION official_v3_at_source_watch_private.archive_on_collect_v2();

-- Synthetic transaction only on actual 3 official Dev HTTP200 responses.
-- All historic watch row modifications are ROLLED BACK, not installed or published.
DO $trial$
DECLARE b bigint; rec record; attempts integer:=0; good_count integer:=0;
 old_bytes bigint; old_digests text; full_digests text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_setting('server_version_num')::int/10000<>17
 THEN RAISE EXCEPTION 'AT_ARCHIVE_TEST_REQUIRES_PG17_POSTGRES' USING ERRCODE='P7986'; END IF;
 SELECT MAX(batch_id) INTO b FROM official_v3_at_source_watch_private.batches_v1 q
 WHERE (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1 r
   WHERE r.batch_id=q.batch_id AND r.state IN('changed','unchanged_exact','unchanged_asset_version_only'))=3;
 IF b IS NULL THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_NO_FULL_SOURCE_BATCH' USING ERRCODE='P7986'; END IF;
 FOR rec IN SELECT * FROM official_v3_at_source_watch_private.reads_v1
    WHERE batch_id=b ORDER BY source_id FOR UPDATE NOWAIT LOOP
  -- Fail closed on forged hash even when net HTTP200 exists.
  UPDATE official_v3_at_source_watch_private.reads_v1 SET state='pending',
    observed_at=NULL,observed_sha=NULL,observed_bytes=NULL
  WHERE batch_id=b AND source_id=rec.source_id;
  BEGIN
    UPDATE official_v3_at_source_watch_private.reads_v1
      SET state=rec.state,observed_at=rec.observed_at,
      observed_sha=repeat('a',64),observed_bytes=rec.observed_bytes
      WHERE batch_id=b AND source_id=rec.source_id;
    RAISE EXCEPTION 'AT_DEV_ARCHIVE_FORGED_HASH_ACCEPTED' USING ERRCODE='P7986';
  EXCEPTION WHEN SQLSTATE 'P7986' THEN
    IF SQLERRM NOT LIKE '%HASH_MISMATCH%' THEN
      RAISE EXCEPTION 'AT_DEV_ARCHIVE_WRONG_FAILURE_CASE:%',SQLERRM USING ERRCODE='P7986';
    END IF;
    attempts:=attempts+1;
  END;
  -- Actual verified raw HTTP and observed SHA/bytes now write immutable
  -- body + batch receipt inside the same collector-settlement transaction.
  UPDATE official_v3_at_source_watch_private.reads_v1
    SET state=rec.state,observed_at=rec.observed_at,
    observed_sha=rec.observed_sha,observed_bytes=rec.observed_bytes
  WHERE batch_id=b AND source_id=rec.source_id;
  good_count:=good_count+1;
 END LOOP;
 SELECT count(*),sum(raw_bytes) INTO attempts,old_bytes FROM official_v3_at_source_watch_private.raw_bodies_v2;
 IF attempts<>3 OR old_bytes<>762498
  OR (SELECT count(*) FROM official_v3_at_source_watch_private.raw_receipts_v2)<>3
  OR (SELECT count(*) FROM official_v3_at_source_watch_private.raw_receipts_v2 WHERE watch_state='changed')<>1
  OR good_count<>3
 THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_COUNT_OR_SCOPE_FAILED' USING ERRCODE='P7986'; END IF;
 SELECT string_agg(source_id||':'||raw_sha||':'||raw_bytes::text,'|' ORDER BY source_id)
  INTO full_digests FROM official_v3_at_source_watch_private.raw_bodies_v2;
 IF position('b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8' IN full_digests)=0
 OR position('ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e' IN full_digests)=0
 OR position('fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778' IN full_digests)=0
 THEN RAISE EXCEPTION 'AT_DEV_ARCHIVE_SOURCE_SHA_MISMATCH' USING ERRCODE='P7986'; END IF;
 BEGIN
  UPDATE official_v3_at_source_watch_private.raw_receipts_v2
   SET request_id=123 WHERE batch_id=b;
  RAISE EXCEPTION 'AT_DEV_ARCHIVE_IMMUTABILITY_BYPASS' USING ERRCODE='P7986';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL;
 END;
END $trial$;
SELECT 'AT_ARCHIVE_DEV_PG17_THREE_ORIGINALS_SHA_BYTES_IMMUTABLE_NEGATIVE_PASS' AS result;

ROLLBACK;
SELECT public.official_v3_guard_alarm_status_v1() AS bg1_after_rollback;
