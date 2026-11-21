-- DEV ONLY: current official consolidated Portuguese entry law, 2026 version.
-- ORIGINAL research S_LEI23 on a different portal is NOT silently rewritten.
-- This is a new official PRIMARY research source, NOT validated visitor law.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.pt_gazette_target='dev:yfvbxvijcorffwxbxahl:PT-GAZETTE-V1';
DO $intake$
DECLARE id text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.pt_gazette_target',true)
  IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:PT-GAZETTE-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>35
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1
     WHERE destination_code='PT')<>3
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>11
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>16
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
     WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM cron.job WHERE active
     AND jobname='jetnity-global-source-review-queue-dev'
     AND command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR pg_database_size(current_database())>=268435456
 OR NOT pg_try_advisory_xact_lock(771115,779)
 THEN RAISE EXCEPTION 'PT_GAZETTE_REVIEW_PREDECESSOR_REQUIRED' USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();

 -- Official gazette (Diario da Republica), Lei 23/2007 as consolidated 2026.
 -- Original regional portal ID S_LEI23 remains a separate unqualified artifact.
 id:=jetnity_source_registry_private.register_research_source_v1(
 'PT','official-law-23-2007',
 'https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2007-67564445-214118434',
 ARRAY['visa','passport','passport_validity','stay_limit','transit',
 'minors','parental_consent','official_actions']::text[],1440);
 IF id<>'PT:official-law-23-2007' THEN RAISE EXCEPTION 'PT_GAZETTE_SOURCE_ID_REFUSED'; END IF;
 PERFORM jetnity_source_dispatch_private.admit_host_v1('PT','diariodarepublica.pt');
 PERFORM jetnity_source_dispatch_private.admit_source_v1(
 'PT:official-law-23-2007',
 'https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2007-67564445-214118434');

 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>36
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1
     WHERE destination_code='PT')<>4
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>1800
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>12
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>17
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
     WHERE rule_verified OR rule_publishable OR accepted_facts<>0
       OR customer_answer<>'derzeit nicht verfügbar')
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
     WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'PT_GAZETTE_REVIEW_POSTCHECK_ROLLBACK' USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $intake$;
COMMIT;
