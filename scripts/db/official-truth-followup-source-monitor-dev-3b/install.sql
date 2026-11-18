-- DEV ONLY. Genuine France Service-Public 200 government page contains the
-- generic "captcha" word in non-legal navigation. That is not evidence
-- of bot challenge. Replace *only* that overbroad filter by the exact prior
-- offending "Radware Bot Manager Captcha" marker. All source markers,
-- HTTP/size, other challenge filters, private history and fact denial remain.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.followup_v3b_target='dev:yfvbxvijcorffwxbxahl:FOLLOWUP-WATCH-3B';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.followup_v3b_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FOLLOWUP-WATCH-3B'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regprocedure('jetnity_followup_source_monitor_private.collect_v3b()') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.requests_v3)<>1
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.items_v3)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3
     WHERE destination_code='FR' AND status='invalid_source_body' AND http_code=200)<>1
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3
     WHERE destination_code IN('IT','ES','PT') AND status='unqualified_snapshot' AND http_code=200)<>3
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
   WHERE oid='jetnity_followup_source_monitor_private.collect_v3()'::regprocedure)
   IS DISTINCT FROM 'b003f45561c91624f5d3a4136da1d1187d3c2dd3a0ed885acb206c89bdabcba6'
 OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND active
   AND jobname='jetnity-followup-government-collect-v3-dev')<>1
 OR NOT pg_try_advisory_xact_lock(771110,7)
 THEN RAISE EXCEPTION 'FOLLOWUP_V3B_EXACT_DEV_PREDECESSOR_REFUSED'
 USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE FUNCTION jetnity_followup_source_monitor_private.collect_v3b()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
 AS $collect$
DECLARE rec record; resp record; state text; n integer:=0; source_size integer;
 fingerprint text; previous_sha text; response_seen boolean;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user THEN RETURN 0; END IF;
 FOR rec IN
   SELECT i.*,s.content_marker FROM jetnity_followup_source_monitor_private.items_v3 i
   JOIN jetnity_followup_source_monitor_private.sources_v3 s USING(destination_code)
   WHERE NOT EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.observations_v3 o
     WHERE o.batch_id=i.batch_id AND o.destination_code=i.destination_code)
   ORDER BY i.batch_id,i.destination_code FOR UPDATE OF i SKIP LOCKED
 LOOP
  SELECT * INTO resp FROM net._http_response
    WHERE id=rec.request_id ORDER BY created DESC LIMIT 1;
  response_seen:=FOUND;
  IF NOT response_seen AND clock_timestamp()<rec.requested_at+interval '6 minutes'
    THEN CONTINUE; END IF;
  state:='http_unavailable'; source_size:=NULL; fingerprint:=NULL;
  IF response_seen AND resp.status_code=200 AND resp.timed_out IS NOT TRUE
     AND resp.error_msg IS NULL AND resp.content IS NOT NULL
     AND resp.content_type ~* '^text/html([; ]|$)' THEN
    source_size:=octet_length(convert_to(resp.content,'UTF8'));
    IF source_size BETWEEN 1 AND 1048576
       AND position(lower(rec.content_marker) IN lower(resp.content))>0
       AND position('radware bot manager captcha' IN lower(resp.content))=0
       AND position('radware' IN lower(resp.content))=0
       AND position('accesso negato' IN lower(resp.content))=0
       AND position('access denied' IN lower(resp.content))=0 THEN
      fingerprint:=encode(sha256(convert_to(resp.content,'UTF8')),'hex');
      SELECT source_sha256 INTO previous_sha
        FROM jetnity_followup_source_monitor_private.observations_v3
        WHERE destination_code=rec.destination_code AND source_sha256 IS NOT NULL
        ORDER BY batch_id DESC LIMIT 1;
      state:=CASE WHEN previous_sha IS NULL THEN 'unqualified_snapshot'
        WHEN previous_sha=fingerprint THEN 'unchanged_unqualified'
        ELSE 'changed_requires_review' END;
    ELSE state:='invalid_source_body'; source_size:=NULL; END IF;
  END IF;
  INSERT INTO jetnity_followup_source_monitor_private.observations_v3(
   batch_id,destination_code,observed_at,status,source_bytes,source_sha256,http_code)
  VALUES(rec.batch_id,rec.destination_code,clock_timestamp(),state,source_size,fingerprint,
     CASE WHEN response_seen THEN resp.status_code ELSE NULL END)
  ON CONFLICT DO NOTHING;
  n:=n+1;
 END LOOP;
 RETURN n;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $collect$;

REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private.collect_v3b()
 FROM PUBLIC,anon,authenticated,service_role;
DO $switch$
BEGIN
 IF NOT cron.unschedule('jetnity-followup-government-collect-v3-dev')
 THEN RAISE EXCEPTION 'FOLLOWUP_V3B_CRON_OLD_NOT_RETIRED' USING ERRCODE='P7999'; END IF;
END $switch$;
SELECT cron.schedule('jetnity-followup-government-collect-v3b-dev',
 '*/5 * * * *','SELECT jetnity_followup_source_monitor_private.collect_v3b()');
DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v2)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3)<>4
 OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND active
   AND jobname IN('jetnity-followup-government-enqueue-v3-dev','jetnity-followup-government-collect-v3b-dev'))<>2
 OR EXISTS(SELECT 1 FROM cron.job WHERE jobname='jetnity-followup-government-collect-v3-dev')
 OR EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.sources_v3
   WHERE source_qualified OR approved_facts<>0)
 OR has_function_privilege('anon','jetnity_followup_source_monitor_private.collect_v3b()','EXECUTE')
 OR has_function_privilege('authenticated','jetnity_followup_source_monitor_private.collect_v3b()','EXECUTE')
 OR has_function_privilege('service_role','jetnity_followup_source_monitor_private.collect_v3b()','EXECUTE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'FOLLOWUP_V3B_POSTCHECK_REFUSED' USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;