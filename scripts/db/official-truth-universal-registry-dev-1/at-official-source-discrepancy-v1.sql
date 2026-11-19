-- DEV ONLY. Austrian law source discrepancy resolved as RESEARCH QUARANTINE,
-- NOT as a nationality-specific immigration rule or publication authority.
-- 2026-11-19 official EU ETIAS says future EUR 20, Austrian BMI old ETIAS page
-- says future EUR 7. ETIAS currently NOT operational; no application is due.
-- Safeguard never converts either price into a personal payable fee.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='40s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.at_authority_target='dev:yfvbxvijcorffwxbxahl:AT-AUTHORITY-CONSISTENCY-V1';
DO $apply$
DECLARE sid text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_authority_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-AUTHORITY-CONSISTENCY-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>36
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1
   WHERE destination_code='AT')<>10
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>12
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>17
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1)<>50
 OR to_regclass('jetnity_legal_review_private.at_authority_consistency_v1') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR pg_database_size(current_database())>=268435456
 OR (SELECT count(*) FROM cron.job WHERE active
   AND jobname='jetnity-global-source-review-queue-dev'
   AND command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR NOT pg_try_advisory_xact_lock(771115,782)
 THEN RAISE EXCEPTION 'AT_OFFICIAL_CONSISTENCY_PREDECESSOR_REQUIRED' USING ERRCODE='P7983'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();

 -- EU itself is official for harmonized ETIAS/Schengen visa; Austrian BMF is
 -- the destination primary for customs. These sources are only RESEARCH scope.
 PERFORM jetnity_source_dispatch_private.admit_host_v1('AT','travel-europe.europa.eu');
 PERFORM jetnity_source_dispatch_private.admit_host_v1('AT','home-affairs.ec.europa.eu');
 sid:=jetnity_source_registry_private.register_research_source_v1('AT','eu-etias-live',
 'https://travel-europe.europa.eu/de/etias',ARRAY['electronic_travel_authorization','fraud_warnings','form_costs','recent_changes','official_actions']::text[],720);
 IF sid<>'AT:eu-etias-live' THEN RAISE EXCEPTION 'AT_AUTHORITY_SCOPE_MISMATCH'; END IF;
 sid:=jetnity_source_registry_private.register_research_source_v1('AT','eu-schengen-visa-fees',
 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en',ARRAY['visa','entry_forms','form_costs','entry_fees','passport_validity','insurance','financial_means','onward_return_ticket']::text[],720);
 IF sid<>'AT:eu-schengen-visa-fees' THEN RAISE EXCEPTION 'AT_AUTHORITY_SCOPE_MISMATCH'; END IF;
 sid:=jetnity_source_registry_private.register_research_source_v1('AT','bmf-cash-declaration',
 'https://www.bmf.gv.at/themen/zoll/Kontrolle-von-Barmitteln.html',ARRAY['customs','entry_forms','official_actions']::text[],1440);
 IF sid<>'AT:bmf-cash-declaration' THEN RAISE EXCEPTION 'AT_AUTHORITY_SCOPE_MISMATCH'; END IF;
 PERFORM jetnity_source_dispatch_private.admit_source_v1('AT:eu-etias-live','https://travel-europe.europa.eu/de/etias');
 PERFORM jetnity_source_dispatch_private.admit_source_v1('AT:eu-schengen-visa-fees','https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en');
 PERFORM jetnity_source_dispatch_private.admit_source_v1('AT:bmf-cash-declaration','https://www.bmf.gv.at/themen/zoll/Kontrolle-von-Barmitteln.html');

 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>39
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1
   WHERE destination_code='AT')<>13
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>14
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>20
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>1950
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
  WHERE customer_answer<>'derzeit nicht verfügbar' OR rule_verified
   OR rule_publishable OR accepted_facts<>0)
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
  WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_OFFICIAL_CONSISTENCY_INTAKE_ROLLBACK' USING ERRCODE='P7983'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $apply$;

CREATE VIEW jetnity_legal_review_private.at_authority_consistency_v1
 WITH (security_invoker=true) AS
SELECT s.destination_code,s.citizenship_code,s.priority_rank,s.topic,
 s.candidate_sources,s.registered_official_urls,s.source_last_seen_at,
 CASE
   WHEN s.candidate_sources=0 THEN 'NO_QUALIFIED_AUSTRIAN_ENTRY_PRIMARY_SOURCE'
   WHEN s.topic='electronic_travel_authorization' THEN 'CONFLICT_BMI_ETIAS_7_EU_ETIAS_20'
   WHEN s.topic='form_costs' THEN 'VISA_FORM_FEE_VS_ETIAS_FEE_DISTINCT_CONDITIONS'
   WHEN s.topic='entry_fees' THEN 'VISA_FEE_DEPENDS_ON_AGE_NATIONALITY_FAMILY_STATUS'
   WHEN s.topic='visa' THEN 'BMI_ORIGINAL_CITIZENSHIP_AND_DOCUMENT_EXCEPTION_REVIEW'
   WHEN s.topic='transit' THEN 'AIRPORT_A_VISA_STATUS_ROUTE_RESIDENCE_REQUIRED'
   WHEN s.topic='customs' THEN 'EU_EXTERNAL_BORDER_AND_CASH_THRESHOLD_REQUIRED'
   WHEN s.topic='recent_changes' THEN 'EES_ACTIVE_ETIAS_NOT_OPERATIONAL_UPDATE_DATE_REQUIRED'
   ELSE 'PASSPORT_ROUTE_STAY_DOCUMENT_AND_SOURCE_BINDING_PENDING'
 END AS review_verdict,
 CASE WHEN s.topic='electronic_travel_authorization'
   THEN 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/information_zu_etias/start.html'
   ELSE NULL::text END AS conflicting_austrian_bmi_page,
 CASE WHEN s.topic='electronic_travel_authorization'
   THEN 'https://travel-europe.europa.eu/de/etias'
   ELSE NULL::text END AS controlling_eu_etias_page,
 CASE WHEN s.topic='electronic_travel_authorization'
   THEN 'CURRENTLY_NO_APPLICATION_ETIAS_NOT_OPERATIONAL' ELSE NULL::text END
  AS official_operational_notice,
 'derzeit nicht verfügbar'::text AS visitor_value,
 NULL::numeric AS approved_fee_amount,
 NULL::date AS approved_valid_from,NULL::date AS approved_valid_until,
 false::boolean AS method_approved,
 false::boolean AS owner_aal2_approved,
 false::boolean AS legal_rule_verified,
 false::boolean AS publishable
FROM jetnity_legal_review_private.at_rule_readiness_v1 s;
REVOKE ALL ON jetnity_legal_review_private.at_authority_consistency_v1
 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_legal_review_private.at_authority_consistency_v1)<>1300
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_authority_consistency_v1
   WHERE review_verdict='CONFLICT_BMI_ETIAS_7_EU_ETIAS_20')<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_authority_consistency_v1
   WHERE review_verdict='NO_QUALIFIED_AUSTRIAN_ENTRY_PRIMARY_SOURCE')<>100
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_authority_consistency_v1
  WHERE legal_rule_verified OR publishable OR method_approved OR owner_aal2_approved
    OR approved_fee_amount IS NOT NULL OR visitor_value<>'derzeit nicht verfügbar')
 OR has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 OR has_table_privilege('anon','jetnity_legal_review_private.at_authority_consistency_v1','SELECT')
 OR has_table_privilege('authenticated','jetnity_legal_review_private.at_authority_consistency_v1','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_OFFICIAL_CONSISTENCY_POSTCHECK_ROLLBACK' USING ERRCODE='P7983'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
