-- Development-only readback for the four BMI visa source classes, exact 50
-- ordinary-passport priority entries. Source-class verification != traveller
-- facts: MA1/Owner/AAL2/route/identity gates MUST remain closed. No publication.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.at_group_target='dev:yfvbxvijcorffwxbxahl:AT-50-GROUPED-LAW-V2';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
  OR current_database()<>'postgres'
  OR current_setting('server_version_num')::integer/10000<>17
  OR current_setting('jetnity.at_group_target',true) IS DISTINCT FROM
     'dev:yfvbxvijcorffwxbxahl:AT-50-GROUPED-LAW-V2'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR to_regclass('jetnity_legal_review_private.at_50_group_source_review_v2') IS NOT NULL
  OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1)<>50
  OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
      WHERE pinned_original_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
        AND source_edition='2026-11-06')<>50
  OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
      WHERE conditional_matrix_class='V')<>20
  OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
      WHERE conditional_matrix_class='F')<>19
  OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
      WHERE conditional_matrix_class='E')<>10
  OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1
      WHERE conditional_matrix_class='H')<>1
  OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
      WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
  OR NOT pg_try_advisory_xact_lock(771115,791)
 THEN RAISE EXCEPTION 'AT_GROUP_SOURCE_PREDECESSOR_REQUIRED' USING ERRCODE='P7988';
 END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
CREATE VIEW jetnity_legal_review_private.at_50_group_source_review_v2
 WITH (security_invoker=true) AS
SELECT v.citizenship_country_code AS passport_code,v.rank AS priority_rank,
 v.source_edition AS bmi_source_version,v.pinned_original_digest,
 '2026-11-19'::date AS reviewed_at,
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'::text
  AS destination_primary_url,
 'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/'::text
  AS destination_consular_countercheck_url,
 v.conditional_matrix_class AS bmi_group,
 CASE v.conditional_matrix_class
  WHEN 'V' THEN 'VISA_DUTY_BASELINE_CONDITIONAL_ON_ORDINARY_PASSPORT_NO_OTHER_STATUS'
  WHEN 'F' THEN 'EU_EEA_CH_FREE_MOVEMENT_WITH_VALID_DOCUMENT'
  WHEN 'E' THEN 'SHORT_STAY_VISA_WAIVER_IF_DOCUMENT_AND_90_180_CONDITIONS_MET'
  ELSE 'AUSTRIAN_HOME_NATIONAL_NOT_FOREIGN_VISA_CASE'
 END AS supported_source_baseline,
 (v.citizenship_country_code IN ('UA','XK','RS'))::boolean
  AS biometric_passport_required_for_waiver,
 (v.citizenship_country_code='GB')::boolean AS british_document_category_required,
 (v.citizenship_country_code IN ('BR','KR','JP','CA','IL'))::boolean
  AS separate_austrian_bilateral_scope_check,
 v.explicit_eu_exception AS bmi_exact_eu_exception,
 v.explicit_austrian_exception AS bmi_exact_national_exception,
 v.explicit_airport_transit AS bmi_airside_only_not_direct_entry,
 true::boolean AS group_source_classification_confirmed,
 false::boolean AS traveller_document_verified,
 false::boolean AS traveller_residence_verified,
 false::boolean AS traveller_route_and_purpose_verified,
 false::boolean AS ma1_owner_authorized,
 false::boolean AS individual_legal_rule_qualified,
 false::boolean AS publication_allowed,
 NULL::numeric AS legal_fee_amount,
 'derzeit nicht verfügbar'::text AS individual_visitor_decision
FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1 v
WHERE NOT v.individual_legal_applicability_verified
 AND NOT v.owner_method_aal2_approved
 AND NOT v.legal_rule_publishable
 AND v.visitor_unqualified_value='derzeit nicht verfügbar';
REVOKE ALL ON jetnity_legal_review_private.at_50_group_source_review_v2
 FROM PUBLIC,anon,authenticated,service_role;
DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_legal_review_private.at_50_group_source_review_v2)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_50_group_source_review_v2
     WHERE group_source_classification_confirmed)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_50_group_source_review_v2
     WHERE biometric_passport_required_for_waiver)<>3
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_50_group_source_review_v2
     WHERE separate_austrian_bilateral_scope_check)<>5
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_50_group_source_review_v2
     WHERE british_document_category_required)<>1
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_50_group_source_review_v2
    WHERE traveller_document_verified OR traveller_residence_verified
       OR traveller_route_and_purpose_verified OR ma1_owner_authorized
       OR individual_legal_rule_qualified OR publication_allowed
       OR legal_fee_amount IS NOT NULL
       OR individual_visitor_decision<>'derzeit nicht verfügbar')
 OR has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 OR has_table_privilege('anon','jetnity_legal_review_private.at_50_group_source_review_v2','SELECT')
 OR has_table_privilege('authenticated','jetnity_legal_review_private.at_50_group_source_review_v2','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_GROUP_SOURCE_POSTCHECK_ROLLBACK' USING ERRCODE='P7988';
 END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
