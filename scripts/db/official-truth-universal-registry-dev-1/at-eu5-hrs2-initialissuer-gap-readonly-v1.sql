-- AT EU5 (DE/PL/IT/RO/FR), PG17 DEV ONLY: real HRS2/Owner-session scope gap.
-- Select-only independent proof, NOT a new issuer, sealed source, signed method,
-- authenticated session, visa/passport adjudication, or permission to publish.
-- If the CH->DE HRS2 binding changes, STOP and independently inspect the new scope.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '12s';
SET LOCAL lock_timeout = '2s';
WITH eu5 AS (
 SELECT count(*) AS cases,
        string_agg(p.code,' ' ORDER BY p.rank) AS codes,
        count(*) FILTER (WHERE v.legal_rule_qualified IS DISTINCT FROM FALSE
          OR d.legal_rule_qualified IS DISTINCT FROM FALSE
          OR v.publication_allowed IS DISTINCT FROM FALSE
          OR d.publication_allowed IS DISTINCT FROM FALSE
          OR v.accepted_facts IS DISTINCT FROM 0 OR d.accepted_facts IS DISTINCT FROM 0
          OR m.primary_rule_qualified IS DISTINCT FROM FALSE
          OR m.ma1_method_authorized IS DISTINCT FROM FALSE
          OR m.owner_aal2_approved IS DISTINCT FROM FALSE
          OR m.publication_allowed IS DISTINCT FROM FALSE) AS unapproved_or_unknown_positive
 FROM official_v3_source_renewal_private.passport_priority_v1 p
 JOIN jetnity_legal_review_private.at_rule_readiness_v1 v
   ON v.destination_code='AT' AND v.citizenship_code=p.code AND v.topic='visa'
 JOIN jetnity_legal_review_private.at_rule_readiness_v1 d
   ON d.destination_code='AT' AND d.citizenship_code=p.code AND d.topic='passport_validity'
 JOIN jetnity_legal_review_private.at_visa_method_candidates_v1 m
   ON m.destination_code='AT' AND m.citizenship_country_code=p.code AND m.rank=p.rank
 WHERE p.code IN ('DE','PL','IT','RO','FR')
), hrs2 AS (
 SELECT count(*) AS selected_count,
        coalesce(bool_or(b.binding#>>'{context,scope,destinationCountryCode}'='DE'
          AND b.binding#>'{context,scope,citizenship,countryCodes}'='["CH"]'::jsonb),false)
            AS selected_ch_de_only,
        coalesce(bool_or(b.binding#>>'{context,scope,destinationCountryCode}'='AT'
          AND b.binding#>'{context,scope,citizenship,countryCodes}'='["DE","PL","IT","RO","FR"]'::jsonb),false)
            AS selected_at_eu5_exact
 FROM official_v3_result_private.binding_v1 b WHERE b.singleton
), owner_wiring AS (
 SELECT to_regprocedure('jetnity_ot_auth.require_current_owner_session_v1()') IS NOT NULL
          AS dedicated_session_witness_present,
        to_regprocedure('official_v3_guard_private.owner_session_v1()') IS NOT NULL
          AS bg1_owner_wrapper_present,
        position('jetnity_ot_auth.require_current_owner_session_v1'
          IN coalesce(pg_get_functiondef(to_regprocedure('public.darf_official_truth_freigeben()')),''))>0
          AS legacy_owner_method_directly_binds_witness
), bg1 AS (
 SELECT public.official_v3_guard_alarm_status_v1()->>'status' AS status
)
SELECT e.cases,e.codes,e.unapproved_or_unknown_positive,
 h.selected_count,h.selected_ch_de_only,h.selected_at_eu5_exact,
 o.dedicated_session_witness_present,o.bg1_owner_wrapper_present,
 o.legacy_owner_method_directly_binds_witness,b.status AS dev_bg1_status,
 CASE
  WHEN e.cases<>5 OR e.codes<>'DE PL IT RO FR' OR e.unapproved_or_unknown_positive<>0
    THEN 'EU5_ORIGINAL_SCOPE_OR_UNAPPROVED_FACT_STOP'
  WHEN b.status IS DISTINCT FROM 'current' THEN 'EU5_BG1_NOT_CURRENT_STOP'
  WHEN h.selected_count<>1 OR h.selected_ch_de_only IS NOT TRUE OR h.selected_at_eu5_exact IS TRUE
    THEN 'EU5_HRS2_SCOPE_CHANGED_INDEPENDENT_REVIEW_STOP'
  WHEN o.dedicated_session_witness_present IS NOT TRUE OR o.bg1_owner_wrapper_present IS NOT TRUE
    OR o.legacy_owner_method_directly_binds_witness IS NOT TRUE
    THEN 'EU5_CH_DE_HRS2_AND_ACTIVE_SESSION_LINK_NOT_READY'
  ELSE 'EU5_NEEDS_DISTINCT_SOURCE_HRS2_MA1_OWNER_ISSUER'
 END AS eu5_initialissuer_review_verdict,
 FALSE AS creates_or_renews_fact,
 FALSE AS witnesses_owner_session,
 FALSE AS authorizes_method,
 FALSE AS permits_publication
FROM eu5 e CROSS JOIN hrs2 h CROSS JOIN owner_wiring o CROSS JOIN bg1 b;
ROLLBACK;
