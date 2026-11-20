-- AT10 EU5: separate ordinary-passport research from national-EU-ID legal method.
-- Execute ONLY on actual Supabase DEV PG17. READ ONLY + ROLLBACK.
-- Does not qualify a person, recognize a document, approve MA1, or publish.
-- Archived hashes and monitor status are not independent external Source-to-Rule receipts.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='2s';
WITH required(ord,code) AS (VALUES (1,'DE'),(2,'PL'),(3,'IT'),(4,'RO'),(5,'FR')),
method_rows AS (
 SELECT p.ord,p.code,
  count(m.citizenship_country_code)::int AS total_research_rows,
  count(*) FILTER (WHERE m.candidate_context='ordinary_passport_tourist_short_stay')::int AS ordinary_passport_rows,
  count(*) FILTER (WHERE m.candidate_context='national_eu_identity_card')::int AS separate_id_rows,
  count(*) FILTER (WHERE m.original_bmi_editorial_date=DATE '2026-11-06' AND m.destination_code='AT')::int AS correct_version_rows,
  count(*) FILTER (WHERE m.primary_bmi_source IS NOT NULL AND m.official_condition_source IS NOT NULL)::int AS source_reference_rows,
  count(*) FILTER (WHERE m.current_primary_source_checked_for_this_rule IS TRUE)::int AS current_rule_source_checked_rows,
  count(*) FILTER (WHERE m.primary_rule_qualified OR m.ma1_method_authorized OR m.owner_aal2_approved OR m.publication_allowed)::int AS any_positive_gate_rows
 FROM required p LEFT JOIN jetnity_legal_review_private.at_visa_method_candidates_v1 m
 ON m.citizenship_country_code=p.code AND m.destination_code='AT'
 GROUP BY p.ord,p.code
),
global_state AS (
 SELECT
  (SELECT count(*)=2 FROM official_v3_at_private.whole_originals_v2
    WHERE (source_id='bmi-visa-nationality-matrix' AND editorial_edition='2026-11-06'
      AND octet_length(original_body)=498415 AND encode(sha256(original_body),'hex')='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778')
    OR (source_id='bmi-general-entry' AND octet_length(original_body)=91655
      AND encode(sha256(original_body),'hex')='ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e')
  ) AS archived_bmi_bytes_exact,
  (SELECT jetnity_legal_review_private.nonch_bmi_pair_status_v1()->>'status') AS monitor_status,
  (SELECT public.official_v3_guard_alarm_status_v1()->>'status') AS dev_bg1_status,
  (SELECT count(*) FROM official_v3_result_private.binding_v1
   WHERE singleton AND binding#>>'{context,scope,destinationCountryCode}'='AT'
   AND binding#>'{context,scope,citizenship,countryCodes}'='["DE","PL","IT","RO","FR"]'::jsonb) AS eu5_at_hrs2_count,
  (SELECT position('jetnity_ot_auth.require_current_owner_session_v1'
    IN pg_get_functiondef(to_regprocedure('public.darf_official_truth_freigeben()')))>0) AS ma1_owner_session_bound
)
SELECT p.ord,p.code,p.total_research_rows,p.ordinary_passport_rows,p.separate_id_rows,
 p.correct_version_rows,p.source_reference_rows,p.current_rule_source_checked_rows,p.any_positive_gate_rows,
 s.archived_bmi_bytes_exact,s.monitor_status,s.dev_bg1_status,s.eu5_at_hrs2_count,s.ma1_owner_session_bound,
 CASE WHEN s.archived_bmi_bytes_exact IS NOT TRUE OR s.dev_bg1_status IS DISTINCT FROM 'current'
   OR s.monitor_status IS DISTINCT FROM 'two_destination_primaries_unchanged_research_only'
   OR p.total_research_rows<>1 OR p.ordinary_passport_rows<>1
   OR p.correct_version_rows<>1 OR p.source_reference_rows<>1
   OR p.any_positive_gate_rows<>0 OR s.eu5_at_hrs2_count<>0
   THEN 'STOP_UNEXPECTED_SOURCE_OR_METHOD_STATE'
  WHEN p.separate_id_rows<>0 OR p.current_rule_source_checked_rows<>0
    OR s.ma1_owner_session_bound IS NOT FALSE
   THEN 'STOP_INDEPENDENT_SCOPE_OR_SESSION_REVIEW'
  ELSE 'RESEARCH_ONLY_PASSPORT_CONTEXT__EU_ID_SEPARATE_RECEIPT_MISSING'
 END AS verdict,
 FALSE AS passport_source_to_rule_authorized,
 FALSE AS eu_id_source_to_rule_authorized,
 FALSE AS personalized_document_qualified,
 FALSE AS owner_aal2_method_approved,
 FALSE AS visitor_positive_allowed
FROM method_rows p CROSS JOIN global_state s ORDER BY p.ord;
ROLLBACK;
