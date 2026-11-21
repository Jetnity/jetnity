-- DEV ONLY. Official BMI visa matrix is a category source, NOT a complete legal
-- determination for traveller passport class, residence, reason, date, or transit.
-- Read-only 50-pass x 26-topic applicability inventory; NO positive publication.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.at_review_target='dev:yfvbxvijcorffwxbxahl:AT-LEGAL-RESEARCH-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_review_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-LEGAL-RESEARCH-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_legal_review_private') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>26
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1
       WHERE destination_code='AT')<>1300
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1)<>50
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE matrix_evidence_present)<>49
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE raw_matrix_cells->>0='Ja')<>20
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE raw_matrix_cells->>0='Nein')<>10
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit')<>19
 OR (SELECT count(*) FROM jetnity_release_review_private.rollout_counts_v1
       WHERE destination_code='AT' AND research_sourced_slots=1200 AND unsupported_slots=100)<>1
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
       WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,778)
 THEN RAISE EXCEPTION 'AT_LEGAL_REVIEW_PREDECESSOR_REQUIRED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE SCHEMA jetnity_legal_review_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_legal_review_private FROM PUBLIC,anon,authenticated,service_role;
CREATE VIEW jetnity_legal_review_private.at_rule_readiness_v1
 WITH (security_invoker=true) AS
SELECT s.destination_code,s.citizenship_code,s.priority_rank,s.topic,
 s.candidate_sources,s.registered_official_urls,s.source_last_seen_at,
 v.source_edition AS bmi_matrix_editorial_date,
 CASE WHEN s.topic='visa' AND v.matrix_evidence_present THEN
   CASE v.raw_matrix_cells->>0
    WHEN 'Ja' THEN 'VISA_DUTY_CATEGORY_WITH_DOCUMENT_AND_STATUS_EXCEPTIONS'
    WHEN 'Nein' THEN 'VISA_EXEMPT_CATEGORY_WITH_DOCUMENT_AND_STATUS_EXCEPTIONS'
    WHEN 'EU-Freiz&uuml;gigkeit' THEN 'FREE_MOVEMENT_REQUIRES_DOCUMENT_STATUS'
    ELSE 'UNIDENTIFIED_BMI_CATEGORY' END
  WHEN s.topic='visa' AND s.citizenship_code='AT'
   THEN 'OWN_NATIONALITY_SPECIAL_SCOPE' ELSE NULL::text END AS visa_matrix_class,
 CASE WHEN s.candidate_sources=0 THEN 'NO_PRIMARY_TOPIC_SOURCE_UNAVAILABLE'
  WHEN s.topic='visa' THEN 'PRIMARY_MATRIX_CATEGORY_REVIEWED_APPLICABILITY_PENDING'
  WHEN s.topic IN ('entry_forms','entry_fees','form_costs','official_actions','fraud_warnings')
   THEN 'VISA_CLASS_AGE_APPLICATION_AND_FORM_SCOPE_REQUIRED'
  WHEN s.topic IN ('minors','parental_consent')
   THEN 'AGE_PARENTAL_COMPANION_DETAILS_REQUIRED'
  WHEN s.topic IN ('passport','passport_validity','blank_passport_pages','transit','identity_document')
   THEN 'DOCUMENT_RESIDENCE_TRANSIT_AND_ROUTE_REQUIRED'
  WHEN s.topic IN ('financial_means','onward_return_ticket','booking_or_travel_document','stay_limit')
   THEN 'TRAVEL_PURPOSE_LENGTH_AND_RESIDENCE_REQUIRED'
  ELSE 'TOPIC_SOURCE_CANDIDATE_NOT_LEGAL_FACT' END AS legal_research_disposition,
 'derzeit nicht verfügbar'::text AS visitor_answer,
 false::boolean AS legal_rule_qualified,false::boolean AS publication_allowed,
 0::integer AS accepted_facts,NULL::numeric AS verified_fee,
 NULL::date AS valid_from,NULL::date AS valid_until
FROM jetnity_release_review_private.passport_topic_status_v1 s
JOIN jetnity_entry_research_private.passport_visa_v1 v
 ON v.destination_code=s.destination_code
 AND v.citizenship_country_code=s.citizenship_code
WHERE s.destination_code='AT' AND s.customer_answer='derzeit nicht verfügbar'
 AND NOT s.rule_verified AND NOT s.rule_publishable;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_legal_review_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_legal_review_private FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1
    WHERE candidate_sources>0)<>1200
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1
    WHERE legal_research_disposition='NO_PRIMARY_TOPIC_SOURCE_UNAVAILABLE')<>100
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1
    WHERE topic='visa' AND visa_matrix_class IS NOT NULL)<>50
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_rule_readiness_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_facts<>0
      OR visitor_answer<>'derzeit nicht verfügbar' OR verified_fee IS NOT NULL)
 OR has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_legal_review_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_legal_review_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_LEGAL_REVIEW_POSTCHECK_ROLLBACK' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
