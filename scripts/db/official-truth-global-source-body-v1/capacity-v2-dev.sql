-- Exact-scope, Dev-only capacity V2. Source data stays append-only.
-- No extra HTTP, model call, new table or permission. 256 rows/32 MiB raw,
-- 256 KiB per sample, and 256 MiB total PostgreSQL database stop.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='50s';
SET LOCAL jetnity.source_body_capacity_target='dev:yfvbxvijcorffwxbxahl:BODY-CAPACITY-V2';
DO $pre$
DECLARE n integer; b bigint;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.source_body_capacity_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BODY-CAPACITY-V2'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR md5(pg_get_functiondef('jetnity_source_body_private.capture_changed_v1()'::regprocedure))
    IS DISTINCT FROM 'ade26b9ce0e93fbf71320cf6a7f36159'
 OR md5(pg_get_functiondef('jetnity_source_body_private.capture_all_v1()'::regprocedure))
    IS DISTINCT FROM 'f084da1b45709c3de594a73ce22a764d'
 OR to_regprocedure('jetnity_source_body_private.capture_changed_v2()') IS NOT NULL
 OR to_regprocedure('jetnity_source_body_private.capture_all_v2()') IS NOT NULL
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres' AND database='postgres'
     AND jobname='jetnity-global-source-review-queue-dev' AND schedule='*/5 * * * *'
     AND command='SELECT jetnity_source_body_private.capture_all_v1()')<>1
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
      WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR pg_database_size(current_database())>=268435456
 OR NOT pg_try_advisory_xact_lock(771115,730)
 THEN RAISE EXCEPTION 'BODY_CAPACITY_DEV_EXACT_PREDECESSOR_REQUIRED' USING ERRCODE='P7988'; END IF;
 SELECT count(*),coalesce(sum(body_bytes),0) INTO n,b
 FROM jetnity_source_body_private.changed_originals_v1;
 IF n>96 OR b>16777216
 OR (SELECT count(*) FROM pg_class c WHERE c.oid='jetnity_source_body_private.changed_originals_v1'::regclass
     AND c.relrowsecurity AND c.relforcerowsecurity)<>1
 OR has_schema_privilege('anon','jetnity_source_body_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_source_body_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_source_body_private','USAGE')
 THEN RAISE EXCEPTION 'BODY_CAPACITY_V1_RLS_OR_CAP_DRIFT' USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
CREATE FUNCTION jetnity_source_body_private.capture_changed_v2() RETURNS integer
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $capture$
DECLARE src record; saved integer:=0; used_rows integer; used_bytes bigint;
 content_bytes bytea; current_bytes integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,721)
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
   WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 THEN RETURN 0; END IF;
 SELECT count(*),coalesce(sum(body_bytes),0)
 INTO used_rows,used_bytes FROM jetnity_source_body_private.changed_originals_v1;
 IF used_rows>=256 OR used_bytes>=33554432
 OR pg_database_size(current_database())>=268435456 THEN RETURN 0; END IF;

 FOR src IN
  WITH requested AS(
   SELECT 'SIX'::text AS source_family,o.dest AS destination_code,
    o.source_key AS source_key,o.batch_id,o.observed_at,
    (o.observed_at AT TIME ZONE 'UTC')::date AS observed_day_utc,
    o.result AS source_result,o.raw_sha,o.body_bytes,
    n.content,n.status_code,n.content_type,n.timed_out,n.error_msg
   FROM jetnity_global_source_monitor_private.observations_v1 o
   JOIN jetnity_global_source_monitor_private.requests_v1 r
    USING(batch_id,dest,source_key)
   JOIN net._http_response n ON n.id=r.request_id
   WHERE o.result='changed_unqualified_snapshot'
    AND o.observed_at>clock_timestamp()-interval '6 hours'
   UNION ALL
   SELECT 'FOUR'::text,o.destination_code,'primary'::text,
    o.batch_id,o.observed_at,(o.observed_at AT TIME ZONE 'UTC')::date,
    o.status,o.source_sha256,o.source_bytes,
    n.content,n.status_code,n.content_type,n.timed_out,n.error_msg
   FROM jetnity_followup_source_monitor_private.observations_v3 o
   JOIN jetnity_followup_source_monitor_private.items_v3 r
    USING(batch_id,destination_code)
   JOIN net._http_response n ON n.id=r.request_id
   WHERE o.status='changed_requires_review'
    AND o.observed_at>clock_timestamp()-interval '6 hours'
  )
  SELECT DISTINCT ON (source_family,destination_code,source_key,observed_day_utc)
   source_family,destination_code,source_key,batch_id,observed_at,
   observed_day_utc,source_result,raw_sha,body_bytes,content
  FROM requested v
  WHERE status_code=200 AND timed_out IS NOT TRUE AND error_msg IS NULL
   AND content IS NOT NULL AND content_type~*'^text/html([; ]|$)'
   AND raw_sha ~ '^[a-f0-9]{64}$'
   AND body_bytes BETWEEN 1000 AND 262144
   AND NOT EXISTS(
    SELECT 1 FROM jetnity_source_body_private.changed_originals_v1 e
    WHERE e.source_family=v.source_family
     AND e.destination_code=v.destination_code
     AND e.source_key=v.source_key
     AND e.observed_day_utc=v.observed_day_utc)
  ORDER BY source_family,destination_code,source_key,observed_day_utc,batch_id DESC
 LOOP
  content_bytes:=convert_to(src.content,'UTF8');
  current_bytes:=octet_length(content_bytes);
  IF current_bytes IS DISTINCT FROM src.body_bytes
   OR encode(sha256(content_bytes),'hex') IS DISTINCT FROM src.raw_sha
   OR position('<html' IN lower(left(src.content,4096)))=0
     AND position('<!doctype html' IN lower(left(src.content,4096)))=0
   OR position('radware bot manager captcha' IN lower(left(src.content,4096)))>0
   OR position('access denied' IN lower(left(src.content,4096)))>0
   OR position('accesso negato' IN lower(left(src.content,4096)))>0
  THEN CONTINUE; END IF;
  IF used_rows>=256 OR used_bytes+current_bytes>33554432 THEN EXIT; END IF;
  INSERT INTO jetnity_source_body_private.changed_originals_v1(
   source_family,destination_code,source_key,batch_id,six_batch_id,four_batch_id,
   observed_at,observed_day_utc,source_result,raw_sha,body_bytes,original_html)
  VALUES(src.source_family,src.destination_code,src.source_key,
   src.batch_id,CASE WHEN src.source_family='SIX' THEN src.batch_id END,
   CASE WHEN src.source_family='FOUR' THEN src.batch_id END,
   src.observed_at,src.observed_day_utc,src.source_result,
   src.raw_sha,current_bytes,content_bytes)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN saved:=saved+1;used_rows:=used_rows+1;used_bytes:=used_bytes+current_bytes; END IF;
 END LOOP;
 RETURN saved;
END $capture$;

-- Preserve the existing single five-minute queue. No new cron or web requests.
CREATE FUNCTION jetnity_source_body_private.capture_all_v2() RETURNS integer
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $both$
DECLARE seen integer; copied integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,722)
 THEN RETURN 0; END IF;
 seen:=jetnity_global_review_private.capture_all_v2();
 copied:=jetnity_source_body_private.capture_changed_v2();
 RETURN seen+copied;
END $both$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_source_body_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_source_body_private
 FROM PUBLIC,anon,authenticated,service_role;
DO $schedule$
DECLARE jobid bigint;
BEGIN
 SELECT j.jobid INTO STRICT jobid FROM cron.job j
 WHERE j.active AND j.username='postgres' AND j.database='postgres'
 AND j.jobname='jetnity-global-source-review-queue-dev' AND j.schedule='*/5 * * * *'
 AND j.command='SELECT jetnity_source_body_private.capture_all_v1()';
 PERFORM cron.alter_job(jobid,command=>'SELECT jetnity_source_body_private.capture_all_v2()');
END $schedule$;
SELECT jetnity_source_body_private.capture_all_v2();
DO $post$
DECLARE n integer; b bigint;
BEGIN
 SELECT count(*),coalesce(sum(body_bytes),0) INTO n,b
 FROM jetnity_source_body_private.changed_originals_v1;
 IF n>256 OR b>33554432 OR pg_database_size(current_database())>=268435456
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
   AND database='postgres' AND jobname='jetnity-global-source-review-queue-dev'
   AND schedule='*/5 * * * *'
   AND command='SELECT jetnity_source_body_private.capture_all_v2()')<>1
 OR EXISTS(SELECT 1 FROM jetnity_source_body_private.changed_originals_v1
   WHERE raw_sha<>encode(sha256(original_html),'hex')
     OR body_bytes<>octet_length(original_html)
     OR primary_rule_qualified OR legal_fact_approved OR public_publish_allowed)
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM pg_class c
     WHERE c.oid='jetnity_source_body_private.changed_originals_v1'::regclass
     AND c.relrowsecurity AND c.relforcerowsecurity)<>1
 OR has_schema_privilege('anon','jetnity_source_body_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_source_body_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_source_body_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'BODY_CAPACITY_V2_POSTCHECK_ROLLBACK' USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
