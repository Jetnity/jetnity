-- DEV ONLY / PR #1254 / 20.11.2026. SOURCE-LAW research and evidence readback.
-- Intentionally READ ONLY: adding a new view over protected Official Truth
-- relations alters pg_depend and is rejected by BG1 (P7905). NEVER weaken,
-- rebaseline or bypass that protection to install a research-only view.
-- No importer, visitor decision, Owner/AAL2 method, write or Production access.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='5s';

WITH current_batch AS (
 SELECT max(batch_id) AS batch_id FROM official_v3_at_source_watch_private.batches_v1
),
official_bmi_witness AS (
 SELECT b.batch_id,count(*) AS checked_sources,
   bool_and(r.state='unchanged_exact'
      AND r.observed_sha=p.raw_sha AND r.observed_bytes=p.expected_bytes
      AND r.observed_at>=now()-interval '70 minutes'
      AND r.observed_at<=now()
      AND r.requested_at<=r.observed_at) AS exact_unchanged,
   min(r.observed_at) AS checked_from,max(r.observed_at) AS checked_until
 FROM current_batch b
 JOIN official_v3_at_source_watch_private.reads_v1 r ON r.batch_id=b.batch_id
 JOIN official_v3_at_source_watch_private.pins_v1 p ON p.source_id=r.source_id
 WHERE r.source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry')
 GROUP BY b.batch_id
),
seal AS (
 SELECT w.*, EXISTS(SELECT 1 FROM official_v3_source_renewal_private.batches_v1 s
  WHERE s.destination_code='AT' AND s.source_batch_id=w.batch_id
    AND s.outcome='unchanged'
    AND s.sealed_at>=now()-interval '70 minutes'
    AND s.sealed_at<=now()) AS independently_sealed
 FROM official_bmi_witness w
),
scope AS (
 SELECT g.passport_code,g.priority_rank,g.bmi_group,g.bmi_source_version,
   g.pinned_original_digest,
   g.biometric_passport_required_for_waiver AS biometric_caveat,
   g.british_document_category_required AS british_category_caveat,
   g.separate_austrian_bilateral_scope_check AS bilateral_caveat,
   g.bmi_airside_only_not_direct_entry='Ja' AS separate_airport_transit_visa_review,
   g.bmi_exact_eu_exception,g.bmi_exact_national_exception,
   s.checked_from AS authority_checked_at,s.batch_id AS source_batch_id,
   (s.checked_sources=2 AND s.exact_unchanged AND s.independently_sealed) IS TRUE
     AS original_sources_exactly_unchanged
 FROM jetnity_legal_review_private.at_50_group_source_review_v2 g
 CROSS JOIN seal s
 WHERE g.group_source_classification_confirmed AND NOT g.individual_legal_rule_qualified
   AND NOT g.publication_allowed AND NOT g.ma1_owner_authorized
   AND g.individual_visitor_decision='derzeit nicht verfügbar'
),gate AS (
 SELECT official_v3_guard_private.assert_catalog_v1() AS protected_catalog_attested,
    public.official_v3_guard_alarm_status_v1()->>'status' AS bg1,
    (SELECT count(*) FROM scope) AS rows_checked,
    (SELECT count(*) FROM scope WHERE bmi_group='V') AS visa_base,
    (SELECT count(*) FROM scope WHERE bmi_group='F') AS free_movement,
    (SELECT count(*) FROM scope WHERE bmi_group='E') AS conditional_waiver,
    (SELECT count(*) FROM scope WHERE bmi_group='H') AS own_national,
    (SELECT count(*) FROM scope WHERE biometric_caveat) AS biometric,
    (SELECT count(*) FROM scope WHERE bilateral_caveat) AS bilateral,
    (SELECT count(*) FROM scope WHERE separate_airport_transit_visa_review) AS airside_visa
)
SELECT c.passport_code,c.priority_rank,c.bmi_group,c.source_batch_id,
 c.authority_checked_at,
 CASE WHEN gate.bg1='current' AND session_user='postgres'
   AND current_database()='postgres' AND current_setting('server_version_num')::int/10000=17
   AND (gate.rows_checked,gate.visa_base,gate.free_movement,gate.conditional_waiver,gate.own_national)
      =(50,20,19,10,1)
   AND (gate.biometric,gate.bilateral,gate.airside_visa)=(3,5,9)
   AND c.original_sources_exactly_unchanged
   AND c.bmi_source_version='2026-11-06'
   AND c.pinned_original_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
   THEN CASE c.bmi_group
     WHEN 'V' THEN 'VISA_DUTY_ORDINARY_PASSPORT_BASELINE_EXCEPTIONS_PENDING'
     WHEN 'F' THEN 'FREE_MOVEMENT_VALID_EU_EEA_CH_DOCUMENT_REQUIRED'
     WHEN 'E' THEN 'SHORT_STAY_EXEMPT_ONLY_IF_PASSPORT_AND_90_180_RULES_MATCH'
     ELSE 'AUSTRIAN_HOME_NATIONAL_NOT_FOREIGN_VISA_CASE'
   END
   ELSE 'OFFICIAL_SOURCE_STALE_OR_PROTECTED_CATALOG_REFUSED'
 END AS conditionally_verified_source_rule,
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'::text AS destination_primary_url,
 'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/'::text AS bmeia_consular_conditions_crosscheck_url,
 c.biometric_caveat,c.british_category_caveat,c.bilateral_caveat,
 c.separate_airport_transit_visa_review,
 c.bmi_exact_eu_exception,c.bmi_exact_national_exception,
 false AS individual_document_verified,
 false AS residency_status_family_right_etc_verified,
 false AS route_purpose_duration_verified,
 false AS personal_legal_rule_qualified,
 false AS ma1_owner_aal2_approved,
 false AS publication_allowed,
 NULL::date AS legal_valid_from_unproven,
 NULL::date AS legal_valid_until_unproven,
 'derzeit nicht verfügbar'::text AS individual_visum_result,
 'derzeit nicht verfügbar'::text AS entry_required_vaccination,
 'derzeit nicht verfügbar'::text AS entry_recommended_vaccination,
 gate.bg1 AS bg1_status
FROM scope c CROSS JOIN gate
ORDER BY c.priority_rank;
ROLLBACK;
