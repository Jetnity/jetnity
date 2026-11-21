-- DEV ONLY. Bind all 50 foreign/nationality BMI row classes to the
-- 06.11.2026 pinned original and the human-reviewed *conditional* method draft.
-- Source rows have exceptions; this does NOT approve an individual visitor rule.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.matrix_target='dev:yfvbxvijcorffwxbxahl:AT-MATRIX-SIGNATURE-V1';

DO $pre$
DECLARE digest text; signature text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.matrix_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-MATRIX-SIGNATURE-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_legal_review_private.at_bmi_matrix_source_binding_v1') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1)<>50
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
   WHERE source_id='bmi-visa-nationality-matrix'
     AND editorial_edition='2026-11-06'
     AND body_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
     AND body_digest=encode(sha256(original_body),'hex'))<>1
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,785)
 THEN RAISE EXCEPTION 'AT_MATRIX_SIGNATURE_PREDECESSOR_REQUIRED' USING ERRCODE='P7986'; END IF;

 SELECT string_agg(
   CASE WHEN citizenship_country_code='AT' THEN 'H'
   WHEN raw_matrix_cells->>0='Ja' THEN 'V'
   WHEN raw_matrix_cells->>0='Nein' THEN 'E'
   WHEN raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit' THEN 'F'
   ELSE '?' END,'' ORDER BY rank),
 encode(sha256(convert_to(string_agg(
   rank::text||':'||citizenship_country_code||':'||
     coalesce(raw_matrix_cells::text,'[AT_HOME]'),
   E'\n' ORDER BY rank),'UTF8')),'hex')
 INTO signature,digest
 FROM jetnity_entry_research_private.passport_visa_v1;

 IF signature<>'VVVFFFEEFFFEHFFVFVFVFFVFFEFVFVVVVVFVVEEVFVEVEFEVVE'
 OR digest<>'06725851fd83fb167e432b95a728dcbe2dcd9a425529138d4df49e61e2dd77ce'
 THEN RAISE EXCEPTION 'AT_MATRIX_CANONICAL_ROWSET_CHANGED' USING ERRCODE='P7986'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE VIEW jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
 WITH (security_invoker=true) AS
SELECT v.citizenship_country_code,v.rank,v.source_edition,
 v.source_matrix_sha256 AS pinned_original_digest,
 CASE WHEN v.citizenship_country_code='AT' THEN 'H'
 WHEN v.raw_matrix_cells->>0='Ja' THEN 'V'
 WHEN v.raw_matrix_cells->>0='Nein' THEN 'E'
 WHEN v.raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit' THEN 'F'
 ELSE '?' END AS conditional_matrix_class,
 CASE WHEN v.raw_matrix_cells->>0='Ja'
  THEN 'VISA_DUTY_BASELINE_WITH_EXCEPTION_REVIEW'
  WHEN v.raw_matrix_cells->>0='Nein'
  THEN 'VISA_EXEMPT_CONDITIONAL_DOCUMENT_BIOMETRIC_REVIEW'
  WHEN v.raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit'
  THEN 'FREE_MOVEMENT_VALID_DOCUMENT_AND_STATUS'
  ELSE 'OWN_STATE_NATIONAL_NOT_FOREIGN_VISA_CASE' END AS review_condition,
 v.raw_matrix_cells->>1 AS explicit_eu_exception,
 v.raw_matrix_cells->>2 AS explicit_austrian_exception,
 v.raw_matrix_cells->>5 AS explicit_airport_transit,
 v.raw_matrix_cells->>6 AS explicit_national_id_document,
 false::boolean AS individual_legal_applicability_verified,
 false::boolean AS owner_method_aal2_approved,
 false::boolean AS legal_rule_publishable,
 'derzeit nicht verfügbar'::text AS visitor_unqualified_value
FROM jetnity_entry_research_private.passport_visa_v1 v
WHERE v.destination_code='AT' AND v.review_state='RESEARCH_ONLY'
 AND NOT v.publishing_enabled AND v.accepted_facts=0;
REVOKE ALL ON jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
     WHERE conditional_matrix_class='F')<>19
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
     WHERE conditional_matrix_class='V')<>20
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
     WHERE conditional_matrix_class='E')<>10
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
     WHERE conditional_matrix_class='H')<>1
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
    WHERE individual_legal_applicability_verified OR owner_method_aal2_approved
    OR legal_rule_publishable OR visitor_unqualified_value<>'derzeit nicht verfügbar')
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 OR has_table_privilege('anon','jetnity_legal_review_private.at_bmi_matrix_source_binding_v1','SELECT')
 OR has_table_privilege('service_role','jetnity_legal_review_private.at_bmi_matrix_source_binding_v1','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_MATRIX_SIGNATURE_POSTCHECK_ROLLBACK' USING ERRCODE='P7986'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
