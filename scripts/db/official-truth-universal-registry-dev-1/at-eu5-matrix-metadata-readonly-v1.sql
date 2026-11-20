-- AT EU5 (DE/PL/IT/RO/FR) pinned BMI legal matrix cross-source proof.
-- SELECT-only Dev PG17. Pinned catalog metadata is NOT re-hashed original source bytes,
-- an independently sealed receipt, an Article 5 ID check, HRS2, MA1 or Owner witness.
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
), hrs2 AS (
 SELECT count(*) AS selected,
        coalesce(bool_or(binding#>>'{context,scope,destinationCountryCode}'='AT'
         AND binding#>'{context,scope,citizenship,countryCodes}'='["DE","PL","IT","RO","FR"]'::jsonb),false) AS at_eu5_selected
 FROM official_v3_result_private.binding_v1 WHERE singleton
), status AS (SELECT public.official_v3_guard_alarm_status_v1()->>'status' AS bg1)
SELECT e.*,h.*,s.bg1,
 CASE WHEN e.checked_rows<>5 OR e.checked_priority<>'DE PL IT RO FR'
        OR e.pinned_matrix_rows<>5 OR e.france_id_addendum_rows<>1
        OR e.unresolved_or_positive<>0
   THEN 'EU5_MATRIX_OR_LEGAL_METADATA_MISMATCH_STOP'
   WHEN s.bg1 IS DISTINCT FROM 'current' THEN 'EU5_BG1_STOP'
   WHEN h.at_eu5_selected OR h.selected<>1
   THEN 'EU5_HRS2_SCOPE_CHANGED_REVIEW_REQUIRED_STOP'
   ELSE 'EU5_PINNED_METADATA_MATCHES__SOURCE_BYTES_SEAL_OWNER_ISSUER_E2E_MISSING'
 END AS preflight_verdict,
 FALSE AS original_bytes_rehashed_now,
 FALSE AS document_or_article5_verified,
 FALSE AS destination_specific_seal_proven,
 FALSE AS owner_session_or_ma1_authorized,
 FALSE AS publication_allowed
FROM eu5 e CROSS JOIN hrs2 h CROSS JOIN status s;
ROLLBACK;
