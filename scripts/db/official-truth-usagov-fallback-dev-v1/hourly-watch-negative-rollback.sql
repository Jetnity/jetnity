-- DEV ONLY. Negative security proof, always ROLLBACK.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='3s';
DO $negative$
DECLARE u boolean:=false; d boolean:=false; t boolean:=false;
 uobs boolean:=false; dobs boolean:=false; tobs boolean:=false;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_usagov_watch_private.requests_v1)<1
 OR (SELECT count(*) FROM jetnity_usagov_watch_private.observations_v1)<1
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
   WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 OR has_schema_privilege('anon','jetnity_usagov_watch_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_usagov_watch_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_usagov_watch_private','USAGE')
 THEN RAISE EXCEPTION 'USAGOV_WATCH_NEGATIVE_PRECHECK_FAILED'; END IF;
 BEGIN
  UPDATE jetnity_usagov_watch_private.requests_v1
   SET source_key=source_key
   WHERE request_id=(SELECT min(request_id) FROM jetnity_usagov_watch_private.requests_v1);
 EXCEPTION WHEN SQLSTATE 'P7990' THEN u:=true;
 END;
 BEGIN
  DELETE FROM jetnity_usagov_watch_private.requests_v1
   WHERE request_id=(SELECT min(request_id) FROM jetnity_usagov_watch_private.requests_v1);
 EXCEPTION WHEN SQLSTATE 'P7990' THEN d:=true;
 END;
 BEGIN
  TRUNCATE jetnity_usagov_watch_private.requests_v1;
 EXCEPTION WHEN SQLSTATE 'P7990' THEN t:=true;
 END;
 IF NOT u OR NOT d OR NOT t THEN
  RAISE EXCEPTION 'USAGOV_WATCH_REQUESTS_MUTABLE'; END IF;
 BEGIN
  UPDATE jetnity_usagov_watch_private.observations_v1
   SET result=result
   WHERE request_id=(SELECT min(request_id) FROM jetnity_usagov_watch_private.observations_v1);
 EXCEPTION WHEN SQLSTATE 'P7990' THEN uobs:=true;
 END;
 BEGIN
  DELETE FROM jetnity_usagov_watch_private.observations_v1
   WHERE request_id=(SELECT min(request_id) FROM jetnity_usagov_watch_private.observations_v1);
 EXCEPTION WHEN SQLSTATE 'P7990' THEN dobs:=true;
 END;
 BEGIN
  TRUNCATE jetnity_usagov_watch_private.observations_v1;
 EXCEPTION WHEN SQLSTATE 'P7990' THEN tobs:=true;
 END;
 IF NOT uobs OR NOT dobs OR NOT tobs THEN
  RAISE EXCEPTION 'USAGOV_WATCH_OBSERVATIONS_MUTABLE'; END IF;
 IF EXISTS(SELECT 1 FROM jetnity_usagov_watch_private.observations_v1
    WHERE legal_rule_qualified OR source_custody_verified OR publication_allowed
      OR accepted_fact_count<>0 OR raw_sha IS DISTINCT FROM encode(sha256(source_body),'hex'))
 THEN RAISE EXCEPTION 'USAGOV_WATCH_CONTENT_OR_APPROVAL_DRIFT'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $negative$;
SELECT (SELECT count(*) FROM jetnity_usagov_watch_private.requests_v1) AS intact_requests,
 (SELECT count(*) FROM jetnity_usagov_watch_private.observations_v1) AS existing_observations,
 (SELECT count(*) FROM jetnity_usagov_fallback_private.us_passport_review_v1) AS unqualified_us_passes,
 public.official_v3_guard_alarm_status_v1()->>'status' AS bg1;
ROLLBACK;
