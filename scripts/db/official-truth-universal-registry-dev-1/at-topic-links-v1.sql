-- DEV ONLY. Link further topics to already reviewed Austrian government source candidates.
-- Adding RESEARCH topics does not assert visitor eligibility for any passport.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='4s';
SET LOCAL jetnity.at_scope_target='dev:yfvbxvijcorffwxbxahl:AT-TOPIC-LINKS-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('jetnity.at_scope_target',true)
  IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-TOPIC-LINKS-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='AT')<>7
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1 WHERE destination_code='AT')<>1300
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
    WHERE destination_code='AT' AND (rule_verified OR rule_publishable OR accepted_facts<>0
    OR customer_answer<>'derzeit nicht verfügbar'))
 OR NOT EXISTS(SELECT 1 FROM jetnity_source_registry_private.sources_v1
    WHERE source_id='AT:bmeia-visa-fees'
    AND official_url='https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/'
    AND research_only AND NOT legal_rule_qualified AND NOT publication_allowed)
 OR NOT EXISTS(SELECT 1 FROM jetnity_source_registry_private.sources_v1
    WHERE source_id='AT:bmi-visa-nationality-matrix'
    AND research_only AND NOT legal_rule_qualified AND NOT publication_allowed)
 OR (SELECT count(*) FROM jetnity_source_registry_private.topic_scope_v1
    WHERE source_id='AT:bmeia-visa-fees')<>5
 OR NOT pg_try_advisory_xact_lock(771115,773)
 THEN RAISE EXCEPTION 'AT_TOPICS_EXACT_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7994'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

INSERT INTO jetnity_source_registry_private.topic_scope_v1(source_id,topic)
VALUES
 ('AT:bmeia-visa-fees','blank_passport_pages'),
 ('AT:bmeia-visa-fees','insurance'),
 ('AT:bmeia-visa-fees','health_documents'),
 ('AT:bmeia-visa-fees','transit'),
 ('AT:bmi-visa-nationality-matrix','transit');

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_source_registry_private.topic_scope_v1
     WHERE source_id='AT:bmeia-visa-fees')<>9
 OR (SELECT count(*) FROM jetnity_source_registry_private.topic_scope_v1
     WHERE source_id='AT:bmi-visa-nationality-matrix')<>2
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1
     WHERE destination_code='AT')<>1300
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
     WHERE destination_code='AT' AND (rule_verified OR rule_publishable OR accepted_facts<>0
      OR customer_answer<>'derzeit nicht verfügbar'))
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
     WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)<>0
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_TOPIC_MAPPING_POSTCHECK_ROLLBACK' USING ERRCODE='P7994'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;