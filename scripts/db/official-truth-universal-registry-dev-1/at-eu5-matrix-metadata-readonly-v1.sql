-- AT EU5 (DE/PL/IT/RO/FR) pinned BMI legal matrix cross-source proof.
-- SELECT-only Dev PG17. Archived original bytes ARE re-hashed here; an independently
-- approved source-to-rule receipt, individual Article 5 ID check, HRS2/MA1 and Owner remain absent.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '12s';
SET LOCAL lock_timeout = '2s';
WITH eu5 AS (
 SELECT count(*) AS checked_rows,
        string_agg(b.citizenship_country_code,' ' ORDER BY b.rank) AS checked_priority,
        count(*) FILTER (WHERE b.source_edition = DATE '2026-11-06'
          AND r.bmi_source_version = b.source_edition
          AND b.pinned_original_digest = 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
          AND r.pinned_original_digest = b.pinned_original_digest
          AND b.conditional_matrix_class = 'F'
          AND r.group_source_classification_confirmed IS TRUE
          AND b.explicit_national_id_document LIKE 'Ja%') AS pinned_matrix_rows,
        count(*) FILTER (WHERE b.citizenship_country_code='FR'
          AND b.explicit_national_id_document = 'Ja (siehe Zusatz)') AS france_id_addendum_rows,
        count(*) FILTER (WHERE b.individual_legal_applicability_verified IS DISTINCT FROM FALSE
          OR b.owner_method_aal2_approved IS DISTINCT FROM FALSE
          OR b.legal_rule_publishable IS DISTINCT FROM FALSE
          OR r.traveller_document_verified IS DISTINCT FROM FALSE
          OR r.ma1_owner_authorized IS DISTINCT FROM FALSE
          OR r.individual_legal_rule_qualified IS DISTINCT FROM FALSE
          OR r.publication_allowed IS DISTINCT FROM FALSE) AS unresolved_or_positive
 FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1 b
 JOIN jetnity_legal_review_private.at_50_group_source_review_v2 r
   ON r.passport_code=b.citizenship_country_code AND r.priority_rank=b.rank
 WHERE b.citizenship_country_code IN ('DE','PL','IT','RO','FR')
), archived_originals AS (
 SELECT count(*) FILTER (WHERE source_id='bmi-visa-nationality-matrix'
          AND editorial_edition='2026-11-06' AND body_bytes=498415
          AND octet_length(original_body)=498415
          AND body_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
          AND body_digest=encode(sha256(original_body),'hex')) AS bmi_original_exact,
        count(*) FILTER (WHERE source_id='bmi-general-entry'
          AND body_bytes=91655 AND octet_length(original_body)=91655
          AND body_digest='ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e'
          AND body_digest=encode(sha256(original_body),'hex')) AS border_original_exact
 FROM official_v3_at_private.whole_originals_v2
 WHERE source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry')
), pair_monitor AS (
 SELECT jetnity_legal_review_private.nonch_bmi_pair_status_v1() AS witness
), hrs2 AS (
 SELECT count(*) AS selected,
        coalesce(bool_or(binding#>>'{context,scope,destinationCountryCode}'='AT'
         AND binding#>'{context,scope,citizenship,countryCodes}'='["DE","PL","IT","RO","FR"]'::jsonb),false) AS at_eu5_selected
 FROM official_v3_result_private.binding_v1 WHERE singleton
), status AS (SELECT public.official_v3_guard_alarm_status_v1()->>'status' AS bg1)
SELECT e.*,a.*,p.witness->>'status' AS destination_pair_monitor_status,h.*,s.bg1,
 CASE WHEN e.checked_rows<>5 OR e.checked_priority<>'DE PL IT RO FR'
        OR e.pinned_matrix_rows<>5 OR e.france_id_addendum_rows<>1
        OR e.unresolved_or_positive<>0
   THEN 'EU5_MATRIX_OR_LEGAL_METADATA_MISMATCH_STOP'
   WHEN a.bmi_original_exact<>1 OR a.border_original_exact<>1
   THEN 'EU5_ARCHIVED_ORIGINAL_BYTES_HASH_MISMATCH_STOP'
   WHEN p.witness->>'status' IS DISTINCT FROM 'two_destination_primaries_unchanged_research_only'
        OR p.witness->>'legalRuleApproved' IS DISTINCT FROM 'false'
        OR p.witness->>'publicationAllowed' IS DISTINCT FROM 'false'
        OR p.witness->>'acceptedFacts' IS DISTINCT FROM '0'
   THEN 'EU5_DESTINATION_PRIMARY_PAIR_NOT_FRESH_STOP'
   WHEN s.bg1 IS DISTINCT FROM 'current' THEN 'EU5_BG1_STOP'
   WHEN h.at_eu5_selected OR h.selected<>1
   THEN 'EU5_HRS2_SCOPE_CHANGED_REVIEW_REQUIRED_STOP'
   ELSE 'EU5_ARCHIVED_BYTES_AND_MONITOR_EXACT__OWNER_HRS2_MA1_DOCUMENT_E2E_MISSING'
 END AS preflight_verdict,
 (a.bmi_original_exact=1 AND a.border_original_exact=1) AS stored_original_bytes_rehashed_exact,
 (p.witness->>'status'='two_destination_primaries_unchanged_research_only') AS research_pair_current,
 FALSE AS independently_approved_source_to_rule_receipt,
 FALSE AS document_or_article5_verified,
 FALSE AS owner_session_or_ma1_authorized,
 FALSE AS publication_allowed
FROM eu5 e CROSS JOIN archived_originals a CROSS JOIN pair_monitor p CROSS JOIN hrs2 h CROSS JOIN status s;
ROLLBACK;
