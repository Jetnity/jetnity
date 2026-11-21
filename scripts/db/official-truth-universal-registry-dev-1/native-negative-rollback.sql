-- DEV ONLY. One actual PostgreSQL17 registration and refusal test.
-- Entire test is ROLLBACK, no persistent fake source, no source HTTP.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
DO $proof$
DECLARE inserted text; bad_country boolean:=false; bad_topic boolean:=false;
  bad_url boolean:=false; update_blocked boolean:=false;
  delete_blocked boolean:=false; truncate_blocked boolean:=false;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>19
 THEN RAISE EXCEPTION 'REGISTRY_NEGATIVE_PRECONDITION_MISSING'; END IF;
 inserted:=jetnity_source_registry_private.register_research_source_v1(
  'NL','synthetic-unit-test','https://research.example.test/notice',
  ARRAY['visa','passport_validity']::text[],180);
 IF inserted<>'NL:synthetic-unit-test'
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1
     WHERE source_id=inserted)<>50
 OR (SELECT count(*) FROM jetnity_source_registry_private.topic_scope_v1
     WHERE source_id=inserted)<>2
 OR EXISTS(SELECT 1 FROM jetnity_source_registry_private.sources_v1
    WHERE source_id=inserted AND
     (source_custody_verified OR legal_rule_qualified OR publication_allowed
       OR accepted_facts<>0 OR migration_state<>'REGISTERED_RESEARCH_ONLY'))
 THEN RAISE EXCEPTION 'REGISTRY_NEW_COUNTRY_IS_NOT_PRIVATE_RESEARCH'; END IF;
 BEGIN
  PERFORM jetnity_source_registry_private.register_research_source_v1(
   'ZZ','unknown-country','https://research.example.test/notice',ARRAY['visa']::text[],180);
 EXCEPTION WHEN SQLSTATE 'P7991' THEN bad_country:=true;
 END;
 BEGIN
  PERFORM jetnity_source_registry_private.register_research_source_v1(
   'NL','bad-topic','https://research.example.test/notice',ARRAY['fake_approved']::text[],180);
 EXCEPTION WHEN SQLSTATE 'P7991' THEN bad_topic:=true;
 END;
 BEGIN
  PERFORM jetnity_source_registry_private.register_research_source_v1(
   'NL','bad-url','http://127.0.0.1/private',ARRAY['visa']::text[],180);
 EXCEPTION WHEN SQLSTATE 'P7991' THEN bad_url:=true;
 END;
 BEGIN
  UPDATE jetnity_source_registry_private.sources_v1 SET legal_rule_qualified=legal_rule_qualified
   WHERE source_id=inserted;
 EXCEPTION WHEN SQLSTATE 'P7991' THEN update_blocked:=true;
 END;
 BEGIN
  DELETE FROM jetnity_source_registry_private.sources_v1 WHERE source_id=inserted;
 EXCEPTION
  WHEN SQLSTATE 'P7991' THEN delete_blocked:=true;
  WHEN foreign_key_violation THEN delete_blocked:=true;
 END;
 BEGIN
  TRUNCATE jetnity_source_registry_private.sources_v1;
 EXCEPTION
  WHEN SQLSTATE 'P7991' THEN truncate_blocked:=true;
  WHEN SQLSTATE '0A000' THEN truncate_blocked:=true;
 END;
 IF NOT bad_country OR NOT bad_topic OR NOT bad_url OR NOT update_blocked
    OR NOT delete_blocked OR NOT truncate_blocked
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>20
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>1000
 OR (SELECT count(*) FROM jetnity_source_registry_private.latest_research_status_v1)<>20
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev'
   AND active AND command='SELECT jetnity_usagov_watch_private.tick_v1()')<>1
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1 WHERE
      publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 THEN RAISE EXCEPTION 'REGISTRY_NEGATIVE_PROOF_FAILED'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $proof$;
SELECT (SELECT count(*) FROM jetnity_source_registry_private.sources_v1) AS transitory_sources,
 (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1) AS transitory_passport_impacts,
 public.official_v3_guard_alarm_status_v1()->>'status' AS bg1;
ROLLBACK;
