-- Reproducible, zero-personal-data, fail-closed EU5 owner/session/MA1/HRS2
-- structural readiness readback. Supabase DEV ONLY. Not a legal issuer.
-- A structural string check is neither an authenticated Owner session nor
-- a source-to-rule receipt, a CI pass, or an individual visa/pass decision.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '12s';
SET LOCAL lock_timeout = '2s';
WITH owner_fn AS (
 SELECT pg_get_functiondef(to_regprocedure('jetnity_ot_auth.require_current_owner_session_v1()')) AS def
), ma1_fn AS (
 SELECT pg_get_functiondef(to_regprocedure('public.darf_official_truth_freigeben()')) AS def
), proof AS (
 SELECT
  (SELECT def IS NOT NULL
    AND position('own_active_session_v1' IN def)>0
    AND position('auth.sessions' IN def)>0
    AND position('for share nowait' IN def)>0
    AND position('p.status=''active''' IN def)>0
    AND position('u.deleted_at is null' IN def)>0
    AND position('u.banned_until' IN def)>0
    AND position('s.aal::text=''aal2''' IN def)>0
    AND position('s.not_after' IN def)>0
    AND position('claims->>''exp''' IN def)>0
    FROM owner_fn) AS actual_owner_session_structural_contract,
  (SELECT def IS NOT NULL AND position('jetnity_ot_auth.require_current_owner_session_v1' IN def)>0 FROM ma1_fn) AS ma1_bound_to_current_owner_session,
  (SELECT count(*) FROM official_v3_result_private.binding_v1 WHERE singleton AND binding#>>'{context,scope,destinationCountryCode}'='AT'
   AND binding#>'{context,scope,citizenship,countryCodes}'='["DE","PL","IT","RO","FR"]'::jsonb) AS eu5_at_hrs2_binding_count,
  (SELECT count(*) FROM official_v3_result_private.binding_v1 WHERE singleton AND binding#>>'{context,scope,destinationCountryCode}'='DE'
   AND binding#>'{context,scope,citizenship,countryCodes}'='["CH"]'::jsonb) AS ch_de_hrs2_binding_count,
  (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1
   WHERE citizenship_country_code IN ('DE','PL','IT','RO','FR')
   AND (primary_rule_qualified OR ma1_method_authorized OR owner_aal2_approved OR publication_allowed)) AS eu5_positive_method_count,
  (SELECT public.official_v3_guard_alarm_status_v1()->>'status') AS dev_bg1_status
)
SELECT p.*,
 CASE WHEN p.actual_owner_session_structural_contract IS NOT TRUE
   THEN 'SESSION_WITNESS_CONTRACT_UNVERIFIED_STOP'
  WHEN p.dev_bg1_status IS DISTINCT FROM 'current' OR p.eu5_positive_method_count<>0
   THEN 'BG1_OR_UNAPPROVED_FACT_STOP'
  WHEN p.eu5_at_hrs2_binding_count<>0 AND p.ma1_bound_to_current_owner_session IS NOT TRUE
   THEN 'MA1_UNBOUND_STOP'
  ELSE 'RESEARCH_ONLY_AT_EU5_SOURCE_HRS2_MA1_OWNER_DOCUMENT_E2E_MISSING'
 END AS verdict,
 FALSE AS legal_issuer_installed,
 FALSE AS owner_aal2_witnessed,
 FALSE AS positive_visa_or_passport_rule_allowed,
 FALSE AS visitor_published
FROM proof p;
ROLLBACK;
