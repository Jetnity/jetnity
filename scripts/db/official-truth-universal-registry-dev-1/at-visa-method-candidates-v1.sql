-- DEV ONLY. BMI visa-matrix row-by-row candidates; never customer visa facts.
-- Matrix edition 2026-11-06, official primary BMI, context exceptions retained.
-- A candidate MUST pass MA1/V3, residency, passport, purpose, date and Owner AAL2
-- before becoming a positive Official Truth rule. No published rules here.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.visa_candidate_target='dev:yfvbxvijcorffwxbxahl:AT-VISA-CANDIDATES-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.visa_candidate_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-VISA-CANDIDATES-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_legal_review_private.at_visa_method_candidates_v1') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>36
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE source_edition='2026-11-06'::date)<>50
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE raw_matrix_cells->>0='Ja')<>20
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE raw_matrix_cells->>0='Nein')<>10
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit')<>19
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
       WHERE NOT matrix_evidence_present)<>1
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
       WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,780)
 THEN RAISE EXCEPTION 'AT_VISA_CANDIDATE_PREDECESSOR_REFUSED' USING ERRCODE='P7980'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE VIEW jetnity_legal_review_private.at_visa_method_candidates_v1
 WITH (security_invoker=true) AS
SELECT v.destination_code,v.citizenship_country_code,v.rank,
 'ordinary_passport_tourist_short_stay'::text AS candidate_context,
 v.source_edition AS original_bmi_editorial_date,
 v.source_retrieved_at AS research_collected_at,
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'::text AS primary_bmi_source,
 'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/'::text AS official_condition_source,
 v.raw_matrix_cells->>0 AS original_eu_visa_requirement,
 v.raw_matrix_cells->>1 AS original_eu_visa_exemption_conditions,
 v.raw_matrix_cells->>2 AS original_national_exception_conditions,
 v.raw_matrix_cells->>5 AS original_airport_transit_requirement,
 v.raw_matrix_cells->>6 AS original_identity_document_conditions,
 CASE
  WHEN v.citizenship_country_code='AT' AND NOT v.matrix_evidence_present
    THEN 'OWN_NATIONALITY_OUTSIDE_FOREIGN_VISA_MATRIX'
  WHEN v.raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit'
    THEN 'EU_EEA_CH_NO_VISA_WITH_VALID_TRAVEL_DOCUMENT'
  WHEN v.raw_matrix_cells->>0='Ja'
    THEN 'VISA_REQUIRED_AS_BASELINE_IF_NO_RESIDENCE_FAMILY_OR_PASSPORT_EXCEPTION'
  WHEN v.raw_matrix_cells->>0='Nein'
    THEN 'VISA_EXEMPT_AS_BASELINE_ONLY_IF_ORIGINAL_DOCUMENT_CONDITIONS_MET'
  ELSE 'UNAVAILABLE_UNRECOGNIZED_MATRIX_ROW' END AS conditional_visa_draft,
 CASE WHEN v.raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit'
  THEN 'Must verify actual EU/EEA/CH citizenship and valid passport or accepted ID'
  WHEN v.raw_matrix_cells->>0='Ja'
  THEN 'Must verify ordinary non-diplomatic document, valid residence/Schengen D/C visa, EU family rights, intended purpose, stay and national exceptions'
  WHEN v.raw_matrix_cells->>0='Nein'
  THEN 'Must verify ordinary biometric passport where applicable, issuing authority, stay, work purpose, residence status and bilateral exceptions'
  ELSE 'Must individually determine nationality or legal rule' END AS mandatory_case_conditions,
 false::boolean AS current_primary_source_checked_for_this_rule,
 false::boolean AS primary_rule_qualified,
 false::boolean AS ma1_method_authorized,
 false::boolean AS owner_aal2_approved,
 false::boolean AS publication_allowed,
 NULL::date AS legal_valid_from,
 NULL::date AS legal_valid_until,
 'derzeit nicht verfügbar'::text AS visitor_answer
FROM jetnity_entry_research_private.passport_visa_v1 v
WHERE v.destination_code='AT' AND v.review_state='RESEARCH_ONLY'
 AND v.accepted_facts=0 AND NOT v.publishing_enabled;

REVOKE ALL ON jetnity_legal_review_private.at_visa_method_candidates_v1 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1
       WHERE conditional_visa_draft='EU_EEA_CH_NO_VISA_WITH_VALID_TRAVEL_DOCUMENT')<>19
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1
       WHERE conditional_visa_draft='VISA_REQUIRED_AS_BASELINE_IF_NO_RESIDENCE_FAMILY_OR_PASSPORT_EXCEPTION')<>20
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1
       WHERE conditional_visa_draft='VISA_EXEMPT_AS_BASELINE_ONLY_IF_ORIGINAL_DOCUMENT_CONDITIONS_MET')<>10
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1
       WHERE conditional_visa_draft='OWN_NATIONALITY_OUTSIDE_FOREIGN_VISA_MATRIX')<>1
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_visa_method_candidates_v1
       WHERE current_primary_source_checked_for_this_rule OR primary_rule_qualified
        OR ma1_method_authorized OR owner_aal2_approved OR publication_allowed
        OR visitor_answer<>'derzeit nicht verfügbar')
 OR has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 OR has_table_privilege('anon','jetnity_legal_review_private.at_visa_method_candidates_v1','SELECT')
 OR has_table_privilege('service_role','jetnity_legal_review_private.at_visa_method_candidates_v1','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_VISA_CANDIDATE_POSTCHECK_ROLLBACK' USING ERRCODE='P7980'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
