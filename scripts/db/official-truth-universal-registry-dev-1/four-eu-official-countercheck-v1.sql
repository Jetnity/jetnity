-- DEV ONLY. Shared EU Schengen counter-check for IT/FR/ES/PT, 2026-11-19.
-- Complements each destination's primary legal authority; EU sources alone
-- NEVER publish travel requirements, and ES 30 contested cases remain quarantined.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.eu_five_target='dev:yfvbxvijcorffwxbxahl:FOUR-EU-CHECK-V1';
DO $g$
DECLARE sid text; target text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres' OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.eu_five_target',true)
  IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FOUR-EU-CHECK-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>39
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>14
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>20
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_authority_consistency_v1)<>1300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR pg_database_size(current_database())>=268435456
 OR NOT pg_try_advisory_xact_lock(771115,783)
 THEN RAISE EXCEPTION 'EU_FOUR_COUNTERCHECK_PREDECESSOR_REQUIRED' USING ERRCODE='P7984'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 FOR target IN SELECT unnest(ARRAY['IT','FR','ES','PT']) LOOP
  PERFORM jetnity_source_dispatch_private.admit_host_v1(target,'home-affairs.ec.europa.eu');
  PERFORM jetnity_source_dispatch_private.admit_host_v1(target,'travel-europe.europa.eu');
  sid:=jetnity_source_registry_private.register_research_source_v1(
    target,'eu-schengen-common-check','https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en',ARRAY['visa','passport_validity','blank_passport_pages','stay_limit','insurance','entry_forms','form_costs','entry_fees','financial_means','onward_return_ticket','booking_or_travel_document','official_actions']::text[],720);
  IF sid IS DISTINCT FROM target||':eu-schengen-common-check' THEN
    RAISE EXCEPTION 'EU_FOUR_COUNTRY_SOURCE_ID_UNEXPECTED'; END IF;
  sid:=jetnity_source_registry_private.register_research_source_v1(
    target,'eu-etias-future-check','https://travel-europe.europa.eu/de/etias',ARRAY['electronic_travel_authorization','form_costs','fraud_warnings','recent_changes','official_actions']::text[],720);
  IF sid IS DISTINCT FROM target||':eu-etias-future-check' THEN
    RAISE EXCEPTION 'EU_FOUR_ETIAS_SOURCE_ID_UNEXPECTED'; END IF;
  PERFORM jetnity_source_dispatch_private.admit_source_v1(target||':eu-schengen-common-check','https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en');
  PERFORM jetnity_source_dispatch_private.admit_source_v1(target||':eu-etias-future-check','https://travel-europe.europa.eu/de/etias');
 END LOOP;
 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>47
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>2350
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>22
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>28
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='AT')<>13
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='IT')<>5
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='FR')<>6
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='ES')<>5
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='PT')<>6
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
  WHERE rule_verified OR rule_publishable OR accepted_facts<>0 OR customer_answer<>'derzeit nicht verfügbar')
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
  WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'EU_FOUR_COUNTERCHECK_POSTCHECK_ROLLBACK' USING ERRCODE='P7984'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $g$;
COMMIT;
