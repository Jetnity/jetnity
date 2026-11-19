-- DEV ONLY / PR #1254 / 20.11.2026.
-- Fresh primary-source checks and 49-passport conditional legal review, not
-- a fact issuer. A checked BMI nationality row only establishes a *baseline*
-- with the exact document/status/route conditions below. It never publishes
-- an unconditional visa outcome or makes an Austrian vaccination exemption.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.at_source_scope_target='dev:yfvbxvijcorffwxbxahl:AT-49-CURRENT-SCOPE-V3';

DO $before$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres' OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.at_source_scope_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-49-CURRENT-SCOPE-V3'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_legal_review_private.at_49_current_legal_scope_v3') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_50_group_source_review_v2)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_50_group_source_review_v2
       WHERE pinned_original_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
       AND bmi_source_version='2026-11-06')<>50
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_50_group_source_review_v2
       WHERE NOT group_source_classification_confirmed OR individual_legal_rule_qualified OR
       publication_allowed OR ma1_owner_authorized OR individual_visitor_decision<>'derzeit nicht verfügbar')
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
       WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,793)
 THEN RAISE EXCEPTION 'AT_49_LEGAL_SOURCE_SCOPE_PREDECESSOR_REFUSED' USING ERRCODE='P7994';
 END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $before$;

-- No new HTTP transport or source credibility. Freshness comes exclusively
-- from the independently audited existing public Austrian BMI source monitor.
-- BMEIA general visa explanation is a separate official interpretation link;
-- it is *not* misleadingly treated as an exact-digest monitor observation.
CREATE VIEW jetnity_legal_review_private.at_49_current_legal_scope_v3
WITH (security_invoker=true) AS
WITH current_batch AS (
 SELECT max(batch_id) AS batch_id FROM official_v3_at_source_watch_private.batches_v1
),
official_bmi_witness AS (
 SELECT b.batch_id,
   count(*) AS checked_sources,
   bool_and(r.state='unchanged_exact'
       AND r.observed_sha=p.raw_sha AND r.observed_bytes=p.expected_bytes
       AND r.observed_at>=now()-interval '70 minutes'
       AND r.observed_at<=now()
       AND r.requested_at<=r.observed_at) AS two_primary_pages_exact,
   min(r.observed_at) AS oldest_check,
   max(r.observed_at) AS newest_check
 FROM current_batch b
 JOIN official_v3_at_source_watch_private.reads_v1 r ON r.batch_id=b.batch_id
 JOIN official_v3_at_source_watch_private.pins_v1 p ON p.source_id=r.source_id
 WHERE r.source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry')
 GROUP BY b.batch_id
), sealed AS (
 SELECT w.*, EXISTS (
   SELECT 1 FROM official_v3_source_renewal_private.batches_v1 s
   WHERE s.destination_code='AT' AND s.source_batch_id=w.batch_id
      AND s.outcome='unchanged'
      AND s.sealed_at>=now()-interval '70 minutes'
      AND s.sealed_at<=now()
 ) AS independently_sealed
 FROM official_bmi_witness w
)
SELECT g.passport_code,g.priority_rank,g.bmi_group,
  g.bmi_source_version,
  g.pinned_original_digest AS original_full_body_sha256,
  g.destination_primary_url AS bmi_visa_matrix_source,
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'::text
    AS bmi_general_entry_source,
  g.destination_consular_countercheck_url AS bmeia_conditions_source,
  (s.checked_sources=2 AND s.two_primary_pages_exact
    AND s.independently_sealed
    AND public.official_v3_guard_alarm_status_v1()->>'status'='current') IS TRUE
    AS current_official_primary_source_bound,
  s.oldest_check AS current_source_checked_at,
  s.batch_id AS audited_source_batch_id,
  CASE g.bmi_group
    WHEN 'V' THEN 'ORDINARY_SHORT_STAY_VISA_REQUIRED_BASELINE_EXCEPT_OTHER_ENTITLEMENT'
    WHEN 'F' THEN 'EU_EEA_CH_FREE_MOVEMENT_WITH_VALID_NATIONAL_DOCUMENT'
    WHEN 'E' THEN 'ORDINARY_SHORT_STAY_VISA_EXEMPT_IF_SPECIFIC_DOCUMENT_AND_90_180'
    ELSE 'AUSTRIAN_NATIONAL_OWN_COUNTRY'
  END AS conditioned_nationality_rule,
  CASE WHEN g.bmi_group='V'
    THEN 'Genuine ordinary passport; short stay; no existing Schengen visa/permit, EU family right, international protection, diplomatic/service privilege, applicable bilateral exception, or other legal exemption. Check nationality and exact exception text.'
   WHEN g.bmi_group='F'
    THEN 'Actual EU/EWR/CH nationality with legally acceptable, valid passport or ID. Nationality and document type must be established.'
   WHEN g.bmi_group='E'
    THEN 'Ordinary, valid national travel passport; genuine short non-work stay within 90/180 Schengen days; nationality/document-biometric/British category rules and bilateral exceptions verified. Other conditions separately.'
   ELSE 'Austrian citizen: own nationality; immigration document checks separate.'
  END AS scope_conditions_to_verify,
  g.biometric_passport_required_for_waiver AS biometric_caveat,
  g.british_document_category_required AS british_category_caveat,
  g.separate_austrian_bilateral_scope_check AS bilateral_caveat,
  g.bmi_exact_eu_exception,
  g.bmi_exact_national_exception,
  g.bmi_airside_only_not_direct_entry,
  -- 9 original BMI airport-transit-visa countries have separate Visa A rules;
  -- they must never inherit the direct-entry short-stay class.
  (g.bmi_airside_only_not_direct_entry='Ja') AS independent_airport_transit_review,
  CASE
    WHEN g.passport_code='AT' THEN 'OWN_NATIONAL_SEPARATE_REVIEW'
    WHEN s.checked_sources=2 AND s.two_primary_pages_exact AND s.independently_sealed
     AND public.official_v3_guard_alarm_status_v1()->>'status'='current'
      THEN 'OFFICIAL_SOURCE_CLASS_REVIEWED_CASE_CONDITIONS_PENDING'
    ELSE 'OFFICIAL_SOURCE_NOT_FRESH_NO_CASE_QUALIFICATION'
  END AS legal_review_step,
  NULL::date AS rule_legal_valid_from_unproven,
  NULL::date AS rule_legal_valid_until_unproven,
  false::boolean AS applicant_documents_examined,
  false::boolean AS residence_and_family_status_examined,
  false::boolean AS purpose_route_duration_verified,
  false::boolean AS legal_fact_issuer_approved,
  false::boolean AS ma1_owner_aal2_authorized,
  false::boolean AS visitor_fact_publishable,
  'derzeit nicht verfügbar'::text AS personal_visa_result,
  'derzeit nicht verfügbar'::text AS entry_required_vaccination,
  'derzeit nicht verfügbar'::text AS entry_recommended_vaccination
FROM jetnity_legal_review_private.at_50_group_source_review_v2 g
CROSS JOIN sealed s
WHERE g.group_source_classification_confirmed
  AND NOT g.individual_legal_rule_qualified AND NOT g.publication_allowed
  AND NOT g.ma1_owner_authorized;
REVOKE ALL ON jetnity_legal_review_private.at_49_current_legal_scope_v3
 FROM PUBLIC,anon,authenticated,service_role;

DO $after$
DECLARE n bigint;
BEGIN
 SELECT count(*) INTO n FROM jetnity_legal_review_private.at_49_current_legal_scope_v3;
 IF n<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_49_current_legal_scope_v3
       WHERE passport_code<>'AT' AND legal_review_step=
        'OFFICIAL_SOURCE_CLASS_REVIEWED_CASE_CONDITIONS_PENDING')<>49
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_49_current_legal_scope_v3
       WHERE independent_airport_transit_review)<>9
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_49_current_legal_scope_v3
       WHERE biometric_caveat)<>3
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_49_current_legal_scope_v3
       WHERE bilateral_caveat)<>5
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_49_current_legal_scope_v3
    WHERE NOT current_official_primary_source_bound OR applicant_documents_examined
    OR residence_and_family_status_examined OR purpose_route_duration_verified
    OR legal_fact_issuer_approved OR ma1_owner_aal2_authorized OR visitor_fact_publishable
    OR personal_visa_result<>'derzeit nicht verfügbar'
    OR entry_required_vaccination<>'derzeit nicht verfügbar'
    OR entry_recommended_vaccination<>'derzeit nicht verfügbar')
 OR has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 OR has_table_privilege('anon','jetnity_legal_review_private.at_49_current_legal_scope_v3','SELECT')
 OR has_table_privilege('authenticated','jetnity_legal_review_private.at_49_current_legal_scope_v3','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_49_LEGAL_SCOPE_NOT_SOURCE_CURRENT_PRIVATE_ROLLBACK' USING ERRCODE='P7994';
 END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $after$;
COMMIT;
