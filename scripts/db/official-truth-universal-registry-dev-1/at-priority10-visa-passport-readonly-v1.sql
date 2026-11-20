-- Dev ONLY: top ten passport visa/passport legal-source review, 20.11.2026.
-- The exact ten are the first 10 rows of the original passport-priority.csv;
-- the DB rank is compared against the pinned original, not chosen by query.
-- This is research/readback, NOT source-to-rule issue, MA1, personal visa,
-- passport/expiry validation, user data collection, import, or publication.
-- No new schema, grant, guard rebaseline, Cron, external connection or expense.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';

WITH ten AS (
 SELECT p.rank,p.code,g.bmi_group,g.pinned_original_digest,
  g.group_source_classification_confirmed,
  g.biometric_passport_required_for_waiver,
  g.bmi_exact_eu_exception,g.bmi_exact_national_exception,
  g.individual_legal_rule_qualified,g.ma1_owner_authorized,g.publication_allowed,
  visa.candidate_sources AS visa_source_links,
  passport.candidate_sources AS passport_source_links,
  visa.legal_rule_qualified AS visa_qualified,
  passport.legal_rule_qualified AS passport_qualified,
  visa.publication_allowed AS visa_published,
  passport.publication_allowed AS passport_published
 FROM official_v3_source_renewal_private.passport_priority_v1 p
 JOIN jetnity_legal_review_private.at_50_group_source_review_v2 g
 ON g.passport_code=p.code AND g.priority_rank=p.rank
 JOIN jetnity_legal_review_private.at_rule_readiness_v1 visa
 ON visa.citizenship_code=p.code AND visa.destination_code='AT' AND visa.topic='visa'
 JOIN jetnity_legal_review_private.at_rule_readiness_v1 passport
 ON passport.citizenship_code=p.code AND passport.destination_code='AT' AND passport.topic='passport_validity'
 WHERE p.rank BETWEEN 1 AND 10
),
latest AS (SELECT max(batch_id) id FROM official_v3_at_source_watch_private.batches_v1),
witness AS (
 SELECT latest.id, count(*) FILTER (WHERE r.source_id IN('bmi-visa-nationality-matrix','bmi-general-entry')) AS bmi_pages,
 bool_and(r.state='unchanged_exact' AND r.observed_sha=pin.raw_sha
  AND r.observed_bytes=pin.expected_bytes
  AND r.observed_at>=now()-interval '75 minutes'
  AND r.observed_at<=now()) FILTER (WHERE r.source_id IN('bmi-visa-nationality-matrix','bmi-general-entry')) AS bmi_exact_fresh,
 max(r.observed_at) FILTER (WHERE r.source_id='bmi-visa-nationality-matrix') AS matrix_observed_at,
 max(r.state) FILTER (WHERE r.source_id='bmeia-bern-how-to-apply') AS bern_observation_state
 FROM latest
 JOIN official_v3_at_source_watch_private.reads_v1 r ON r.batch_id=latest.id
 JOIN official_v3_at_source_watch_private.pins_v1 pin ON pin.source_id=r.source_id
 GROUP BY latest.id
),
safe AS (
 SELECT count(*) AS passport_cases,count(DISTINCT code) AS distinct_passports,
 string_agg(code,' ' ORDER BY rank) AS actual_priority,
 count(*) FILTER(WHERE bmi_group='V') AS duty,
 count(*) FILTER(WHERE bmi_group='F') AS free,
 count(*) FILTER(WHERE bmi_group='E') AS waiver,
 count(*) FILTER(WHERE biometric_passport_required_for_waiver) AS biometric,
 count(*) FILTER(WHERE visa_source_links>0 AND passport_source_links>0) AS two_topics_sourced,
 count(*) FILTER(WHERE individual_legal_rule_qualified OR ma1_owner_authorized
 OR publication_allowed OR visa_qualified OR passport_qualified
 OR visa_published OR passport_published) AS inappropriate_positive,
 count(*) FILTER(WHERE pinned_original_digest<>'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
 OR NOT group_source_classification_confirmed) AS original_mismatch
 FROM ten
),
seal AS (
 SELECT w.*,EXISTS(
  SELECT 1 FROM official_v3_source_renewal_private.batches_v1 s
  WHERE s.source_batch_id=w.id AND s.destination_code='AT'
   AND s.outcome='unchanged' AND s.sealed_at>=now()-interval '75 minutes'
 ) AS exact_batch_sealed FROM witness w
),
gate AS (
 SELECT safe.*,
 public.official_v3_guard_alarm_status_v1()->>'status' AS bg1,
 official_v3_guard_private.assert_catalog_v1() AS protected_catalog_attested
 FROM safe
)
SELECT ten.rank,ten.code AS passport,ten.bmi_group,
 CASE WHEN ten.bmi_group='V' THEN 'ORDINARY_PASSPORT_SCHENGEN_C_VISA_NORMALLY_REQUIRED'
      WHEN ten.bmi_group='F' THEN 'VALID_EU_PASSPORT_OR_QUALIFIED_ID_FREE_MOVEMENT'
      WHEN ten.code='UA' THEN 'SHORT_STAY_WAIVER_ONLY_WITH_BIOMETRIC_ORDINARY_PASSPORT'
      ELSE 'ORDINARY_SHORT_STAY_WAIVER_90_IN_180_SUBJECT_TO_ENTRY_CONDITIONS'
 END AS source_supported_conditional_rule,
 ten.bmi_exact_eu_exception,ten.bmi_exact_national_exception,
 CASE WHEN ten.bmi_group='F' THEN NULL::integer ELSE 3 END AS third_country_passport_months_after_schengen_exit,
 CASE WHEN ten.bmi_group='F' THEN NULL::integer ELSE 10 END AS third_country_passport_max_years_since_issue,
 ten.bmi_group='F' AS eu_valid_national_passport_or_qualified_identity_card,
 ten.bmi_group='F' AS eu_identity_card_2025_1208_security_review,
 ten.bmi_group='V' AS visa_application_two_blank_pages_not_general_entry,
 ten.code='UA' AS biometric_ordinary_passport_required_for_waiver,
 ten.bmi_group<>'F' AS must_verify_90_180_schengen_days,
 ten.visa_source_links,ten.passport_source_links,
 w.id AS source_monitor_batch,w.matrix_observed_at,
 w.bmi_pages=2 AND w.bmi_exact_fresh IS TRUE AS full_bmi_primary_pages_current,
 w.exact_batch_sealed AS complete_monitor_batch_sealed,
 w.bern_observation_state AS bern_embassy_other_scope_observation,
 CASE WHEN gate.passport_cases=10 AND gate.distinct_passports=10
   AND gate.actual_priority='IN TR CN DE PL IT US UA RO FR'
   AND (gate.duty,gate.free,gate.waiver,gate.biometric,gate.two_topics_sourced)=(3,5,2,1,10)
   AND gate.original_mismatch=0 AND gate.inappropriate_positive=0
   AND gate.bg1='current' AND w.bmi_pages=2 AND w.bmi_exact_fresh IS TRUE
   AND current_database()='postgres' AND current_setting('server_version_num')::int/10000=17
 THEN 'TEN_SOURCE_RULE_BASELINES_CHECKED_PERSONAL_ISSUER_AND_SEAL_PENDING'
 ELSE 'TOP10_QUALIFICATION_RESEARCH_REFUSED' END AS source_review_verdict,
 false AS actual_presented_passport_and_identity_verified,
 false AS document_issuance_and_expiry_verified,
 false AS context_route_residence_and_travel_dates_verified,
 false AS applicable_legal_rule_issuer_installed,
 false AS active_owner_session_and_aal2_verified,
 false AS publication_allowed,
 'derzeit nicht verfügbar'::text AS personal_visa_answer,
 'derzeit nicht verfügbar'::text AS personal_document_answer,
 NULL::text AS personal_official_form,
 NULL::numeric AS individual_fee
FROM ten CROSS JOIN seal w CROSS JOIN gate
ORDER BY ten.rank;
ROLLBACK;
