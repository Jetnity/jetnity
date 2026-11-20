-- DEV ONLY. Replace inaccessible source by an ADDED, separately pinned
-- official alternative for IT/ES. Old immutable attempts remain unchanged.
-- ES conflicting 30 passport records remain quarantined, never auto-resolved.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.it_es_target='dev:yfvbxvijcorffwxbxahl:IT-ES-OFFICIAL-V1';
DO $batch$
DECLARE sid text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.it_es_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:IT-ES-OFFICIAL-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>47
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>28
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>22
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>2350
 OR NOT EXISTS(SELECT 1 FROM jetnity_source_dispatch_private.research_hosts_v1
   WHERE destination_code='IT' AND hostname='www.esteri.it')
 OR NOT EXISTS(SELECT 1 FROM jetnity_source_dispatch_private.research_hosts_v1
   WHERE destination_code='ES' AND hostname='www.interior.gob.es')
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,784)
 THEN RAISE EXCEPTION 'IT_ES_SOURCE_PREDECESSOR_REQUIRED' USING ERRCODE='P7985'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();

 sid:=jetnity_source_registry_private.register_research_source_v1(
 'IT','maeci-travel-documents',
 'https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/passaporti_documenti/',
 ARRAY['passport','identity_document','passport_validity','transit','dual_nationals']::text[],720);
 IF sid<>'IT:maeci-travel-documents' THEN RAISE EXCEPTION 'IT_SOURCE_REFUSED'; END IF;
 sid:=jetnity_source_registry_private.register_research_source_v1(
 'ES','interior-current-border',
 'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/control-de-fronteras/entrada-en-espana/',
 ARRAY['passport','passport_validity','visa','financial_means','onward_return_ticket',
       'booking_or_travel_document','health_documents','stay_limit']::text[],720);
 IF sid<>'ES:interior-current-border' THEN RAISE EXCEPTION 'ES_SOURCE_REFUSED'; END IF;
 PERFORM jetnity_source_dispatch_private.admit_source_v1(
 'IT:maeci-travel-documents',
 'https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/passaporti_documenti/');
 PERFORM jetnity_source_dispatch_private.admit_source_v1(
 'ES:interior-current-border',
 'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/control-de-fronteras/entrada-en-espana/');

 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>49
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>2450
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>30
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>22
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='IT')<>6
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='ES')<>6
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
   WHERE customer_answer<>'derzeit nicht verfügbar'
    OR rule_verified OR rule_publishable OR accepted_facts<>0)
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'IT_ES_SOURCE_POSTCHECK_ROLLBACK' USING ERRCODE='P7985'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $batch$;
COMMIT;
