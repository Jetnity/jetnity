-- DEV ONLY. Thirty-six original source_ref gaps mapped to exactly
-- eighteen citizenship cases × two distinct visa-application-fee topics.
-- Exact 2026-11-19 current Austrian law: EU/EEA/CH visa-free with
-- valid ID/passport for regular <=3-month stay. This does NOT prove
-- another purpose, entry charge, international transit or form-cost waiver.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL jetnity.at_36_target='dev:yfvbxvijcorffwxbxahl:AT-36-LEGAL-SCOPE-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_36_target',true)
  IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-36-LEGAL-SCOPE-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_legal_review_private.at_36_fee_source_scope_v1') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1)<>50
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
  WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 THEN RAISE EXCEPTION 'AT_36_LEGAL_SCOPE_PREDECESSOR_REFUSED' USING ERRCODE='P7981'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE VIEW jetnity_legal_review_private.at_36_fee_source_scope_v1
 WITH (security_invoker=true) AS
SELECT p.citizenship_code,p.topic,p.priority_rank,
 'S_3550010'::text AS recovered_original_source_ref,
 'https://www.oesterreich.gv.at/de/themen/menschen_aus_anderen_staaten/visum_fuer_oesterreich/Seite.3550010'::text
  AS original_official_form_url,
 'https://www.oesterreich.gv.at/de/themen/eu_und_international/recht_in_der_eu/Seite.2394001'::text
  AS destination_primary_free_movement_url,
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start-2.html'::text
  AS destination_border_police_official_url,
 '2026-11-19'::date AS legal_source_review_date,
 CASE WHEN p.citizenship_code='AT'
  THEN 'AUSTRIAN_OWN_NATIONAL_NOT_A_FOREIGN_VISA_APPLICANT'
  ELSE 'EU_REGULAR_SHORT_STAY_VISA_APPLICATION_NOT_APPLICABLE_WITH_VALID_ID_OR_PASSPORT' END
  AS narrowly_confirmed_application_scope,
 CASE WHEN p.topic='form_costs'
  THEN 'No visa-application form required for regular entry; NOT a promise of all other application form fees'
  ELSE 'No Schengen visa application for this regular entry; NOT a blanket assertion of all entry charges'
 END AS explicit_legal_limitation,
 true::boolean AS official_narrow_scope_supported,
 false::boolean AS verified_traveller_context,
 false::boolean AS v3_ma1_owner_authorized,
 false::boolean AS publication_allowed,
 NULL::numeric AS money_due,
 NULL::date AS legal_valid_from,NULL::date AS legal_valid_until,
 'derzeit nicht verfügbar'::text AS visitor_text
FROM jetnity_legal_review_private.at_rule_readiness_v1 p
JOIN jetnity_legal_review_private.at_bmi_matrix_source_binding_v1 m
 ON m.citizenship_country_code=p.citizenship_code
WHERE p.destination_code='AT'
 AND p.topic IN ('entry_fees','form_costs')
 AND p.citizenship_code IN ('AT','BE','BG','CZ','DK','ES','FR','GR','HR','HU','IT','LT','NL','PL','PT','RO','SE','SK')
 AND (m.conditional_matrix_class='F' OR
     (p.citizenship_code='AT' AND m.conditional_matrix_class='H'))
 AND p.candidate_sources>0;

REVOKE ALL ON jetnity_legal_review_private.at_36_fee_source_scope_v1
 FROM PUBLIC,anon,authenticated,service_role;
DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_legal_review_private.at_36_fee_source_scope_v1)<>36
 OR (SELECT count(DISTINCT citizenship_code) FROM jetnity_legal_review_private.at_36_fee_source_scope_v1)<>18
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_36_fee_source_scope_v1
  WHERE citizenship_code='AT')<>2
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_36_fee_source_scope_v1
  WHERE citizenship_code<>'AT')<>34
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_36_fee_source_scope_v1
   WHERE NOT official_narrow_scope_supported OR verified_traveller_context
      OR v3_ma1_owner_authorized OR publication_allowed OR money_due IS NOT NULL
      OR visitor_text<>'derzeit nicht verfügbar')
 OR has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_36_LEGAL_SCOPE_POSTCHECK_ROLLBACK' USING ERRCODE='P7981'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
