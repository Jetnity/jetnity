-- Dev ONLY / SELECT only. AT top-10 original passport priority + HRS2/Owner witness preflight.
-- This is no source-to-rule issuer, no authentication attempt, no MA1 grant,
-- no production operation, no certified browser test, and no legal approval.
-- Only aggregate counters + guard wiring flags; never personal user/session data.
-- Follow the protected real issuer path separately after Owner/AAL2 authorization.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '12s';
SET LOCAL lock_timeout = '2s';
WITH candidates AS (
 SELECT p.rank,p.code,
        v.legal_rule_qualified AS visa_legal,
        d.legal_rule_qualified AS document_legal,
        v.publication_allowed AS visa_published,
        d.publication_allowed AS document_published,
        v.accepted_facts AS visa_accepted,
        d.accepted_facts AS document_accepted,
        m.primary_rule_qualified AS candidate_legal,
        m.ma1_method_authorized AS candidate_ma1,
        m.owner_aal2_approved AS candidate_owner,
        m.publication_allowed AS candidate_published
 FROM official_v3_source_renewal_private.passport_priority_v1 p
 JOIN jetnity_legal_review_private.at_rule_readiness_v1 v
  ON v.destination_code='AT' AND v.citizenship_code=p.code AND v.topic='visa'
 JOIN jetnity_legal_review_private.at_rule_readiness_v1 d
  ON d.destination_code='AT' AND d.citizenship_code=p.code AND d.topic='passport_validity'
 JOIN jetnity_legal_review_private.at_visa_method_candidates_v1 m
  ON m.destination_code='AT' AND m.citizenship_country_code=p.code AND m.rank=p.rank
 WHERE p.rank BETWEEN 1 AND 10
), aggregate_gate AS (
 SELECT count(*) AS rows_checked,
        string_agg(code,' ' ORDER BY rank) AS actual_priority,
        count(*) FILTER(WHERE code IN ('DE','PL','IT','RO','FR')) AS eu5_rows,
        count(*) FILTER(WHERE visa_legal IS TRUE OR document_legal IS TRUE
           OR visa_published IS TRUE OR document_published IS TRUE
           OR coalesce(visa_accepted,0)<>0 OR coalesce(document_accepted,0)<>0
           OR candidate_legal IS TRUE OR candidate_ma1 IS TRUE
           OR candidate_owner IS TRUE OR candidate_published IS TRUE) AS unapproved_positive
 FROM candidates
), session_gate AS (
 SELECT to_regprocedure('jetnity_ot_auth.require_current_owner_session_v1()') IS NOT NULL
         AS independent_session_witness_function_present,
        to_regprocedure('official_v3_guard_private.owner_session_v1()') IS NOT NULL
         AS bg1_owner_wrapper_present,
        position('jetnity_ot_auth.require_current_owner_session_v1'
         IN coalesce(pg_get_functiondef(to_regprocedure('public.darf_official_truth_freigeben()')),''))>0
         AS legacy_ma1_owner_gate_bound_to_session_witness
), guard AS (
 SELECT public.official_v3_guard_alarm_status_v1()->>'status' AS dev_bg1_status
)
SELECT a.*,s.*,g.dev_bg1_status,
 CASE
   WHEN a.rows_checked<>10 OR a.actual_priority<>'IN TR CN DE PL IT US UA RO FR'
     OR a.eu5_rows<>5 THEN 'TOP10_ORIGINAL_PRIORITY_SCOPE_STOP'
   WHEN a.unapproved_positive<>0 THEN 'UNAPPROVED_POSITIVE_FACT_STOP'
   WHEN g.dev_bg1_status<>'current' THEN 'DEV_BG1_NOT_CURRENT_STOP'
   WHEN NOT s.independent_session_witness_function_present OR NOT s.bg1_owner_wrapper_present
     OR NOT s.legacy_ma1_owner_gate_bound_to_session_witness
    THEN 'RESEARCH_ONLY_OWNER_SESSION_METHOD_WIRING_UNPROVEN'
   ELSE 'RESEARCH_ONLY_NEEDS_SEPARATE_SOURCE_HRS2_MA1_OWNER_AND_E2E'
 END AS preflight_verdict,
 FALSE AS permits_new_visa_or_passport_fact,
 FALSE AS acts_as_owner_session_witness,
 FALSE AS permits_method_approval,
 FALSE AS permits_publication
FROM aggregate_gate a CROSS JOIN session_gate s CROSS JOIN guard g;
ROLLBACK;
