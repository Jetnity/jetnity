-- DEV ONLY. Three rejected mutations in a single rolled-back transaction.
-- The public page is a nonauthoritative one-off research candidate.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='3s';
DO $proof$
DECLARE updates_blocked boolean:=false; deletes_blocked boolean:=false; truncate_blocked boolean:=false;
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_usagov_fallback_private.original_v1)<>1
 OR (SELECT count(*) FROM jetnity_usagov_fallback_private.us_passport_review_v1)<>50
 OR has_schema_privilege('anon','jetnity_usagov_fallback_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_usagov_fallback_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_usagov_fallback_private','USAGE')
 THEN RAISE EXCEPTION 'USAGOV_NEGATIVE_PRECONDITION_MISSING'; END IF;
 BEGIN
  UPDATE jetnity_usagov_fallback_private.original_v1
    SET source_bytes=source_bytes WHERE singleton=1;
 EXCEPTION WHEN SQLSTATE 'P7989' THEN updates_blocked:=true;
 END;
 BEGIN
  DELETE FROM jetnity_usagov_fallback_private.original_v1 WHERE singleton=1;
 EXCEPTION WHEN SQLSTATE 'P7989' THEN deletes_blocked:=true;
 END;
 BEGIN
  TRUNCATE jetnity_usagov_fallback_private.original_v1;
 EXCEPTION WHEN SQLSTATE 'P7989' THEN truncate_blocked:=true;
 END;
 IF NOT updates_blocked OR NOT deletes_blocked OR NOT truncate_blocked
 OR EXISTS(SELECT 1 FROM jetnity_usagov_fallback_private.original_v1
   WHERE source_custody_verified OR legal_rule_qualified OR publication_allowed
     OR accepted_fact_count<>0 OR source_bytes<>octet_length(original_html)
     OR source_sha256<>encode(sha256(original_html),'hex'))
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
    WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 THEN RAISE EXCEPTION 'USAGOV_NEGATIVE_PROOF_FAILED'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $proof$;
SELECT (SELECT count(*) FROM jetnity_usagov_fallback_private.original_v1) AS preserved_source,
 (SELECT count(*) FROM jetnity_usagov_fallback_private.us_passport_review_v1) AS unqualified_cases,
 public.official_v3_guard_alarm_status_v1()->>'status' AS bg1;
ROLLBACK;
