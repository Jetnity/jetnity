-- Austria AT10: US/UA ordinary-passport visa/passport research proof, DEV PG17, READ ONLY.
-- Historical BMI 06.11.2026 bytes are re-hashed; unchanged research monitoring
-- is NOT a current legal source-to-rule seal, owner approval or public answer.
-- US visa-exempt standard tourism and UA biometric-only standard passport
-- remain CONDITIONAL research, never an identity/document verification.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='2s';
WITH target AS (
 SELECT code,rank FROM official_v3_source_renewal_private.passport_priority_v1
 WHERE code IN ('US','UA')
), archive AS (
 SELECT count(*) AS exact_originals FROM official_v3_at_private.whole_originals_v2
 WHERE (source_id='bmi-visa-nationality-matrix' AND editorial_edition='2026-11-06'
   AND octet_length(original_body)=498415
   AND encode(sha256(original_body),'hex')='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778')
 OR (source_id='bmi-general-entry' AND octet_length(original_body)=91655
   AND encode(sha256(original_body),'hex')='ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e')
), proof AS (
 SELECT count(*) AS cases,string_agg(t.code,' ' ORDER BY t.rank) AS codes,
 count(*) FILTER(WHERE t.rank NOT IN (7,8) OR (t.code='US' AND t.rank<>7)
   OR (t.code='UA' AND t.rank<>8)
   OR m.original_bmi_editorial_date IS DISTINCT FROM DATE '2026-11-06'
   OR m.original_eu_visa_requirement IS DISTINCT FROM 'Nein'
   OR (t.code='US' AND m.original_eu_visa_exemption_conditions IS DISTINCT FROM 'Ja')
   OR (t.code='UA' AND (m.original_eu_visa_exemption_conditions NOT LIKE 'Ja, nur biometrische Reisep%'
     OR position('Diplomatenp' IN m.original_eu_visa_exemption_conditions)=0))
   ) AS missing_or_changed_original_scope,
 count(*) FILTER(WHERE m.primary_rule_qualified IS DISTINCT FROM FALSE
   OR m.ma1_method_authorized IS DISTINCT FROM FALSE
   OR m.owner_aal2_approved IS DISTINCT FROM FALSE
   OR m.publication_allowed IS DISTINCT FROM FALSE
   OR v.legal_rule_qualified IS DISTINCT FROM FALSE OR d.legal_rule_qualified IS DISTINCT FROM FALSE
   OR v.publication_allowed IS DISTINCT FROM FALSE OR d.publication_allowed IS DISTINCT FROM FALSE
   OR v.accepted_facts IS DISTINCT FROM 0 OR d.accepted_facts IS DISTINCT FROM 0
 ) AS new_or_unqualified_positive
 FROM target t
 LEFT JOIN jetnity_legal_review_private.at_visa_method_candidates_v1 m
   ON m.destination_code='AT' AND m.citizenship_country_code=t.code AND m.rank=t.rank
 LEFT JOIN jetnity_legal_review_private.at_rule_readiness_v1 v
   ON v.destination_code='AT' AND v.citizenship_code=t.code AND v.topic='visa'
 LEFT JOIN jetnity_legal_review_private.at_rule_readiness_v1 d
   ON d.destination_code='AT' AND d.citizenship_code=t.code AND d.topic='passport_validity'
), monitor AS (
 SELECT jetnity_legal_review_private.nonch_bmi_pair_status_v1() AS status
), hrs2 AS (
 SELECT count(*) FILTER (WHERE singleton AND
   binding#>>'{context,scope,destinationCountryCode}'='AT'
   AND binding#>'{context,scope,citizenship,countryCodes}'='["US","UA"]'::jsonb)
   AS selected_us_ua_binding
 FROM official_v3_result_private.binding_v1
), bg1 AS (
 SELECT public.official_v3_guard_alarm_status_v1()->>'status' AS status
)
SELECT proof.cases,proof.codes,archive.exact_originals,
 proof.missing_or_changed_original_scope,proof.new_or_unqualified_positive,
 monitor.status->>'status' AS source_pair_monitor,
 hrs2.selected_us_ua_binding,bg1.status AS dev_bg1,
 CASE WHEN proof.cases<>2 OR proof.codes<>'US UA'
   OR archive.exact_originals<>2 OR proof.missing_or_changed_original_scope<>0
   OR proof.new_or_unqualified_positive<>0
   OR monitor.status->>'status' IS DISTINCT FROM 'two_destination_primaries_unchanged_research_only'
   OR bg1.status IS DISTINCT FROM 'current'
 THEN 'US_UA_ORIGINAL_OR_REVIEW_DRIFT_STOP'
 ELSE 'US_UA_ARCHIVED_RESEARCH_EXACT__BIOMETRIC_90_180_DOCUMENT_HRS2_MA1_OWNER_E2E_MISSING'
 END AS legal_readiness,
 FALSE AS legal_source_to_rule_sealed,
 FALSE AS person_document_verified,
 FALSE AS owner_method_approved,
 FALSE AS visitor_publication
FROM proof CROSS JOIN archive CROSS JOIN monitor CROSS JOIN hrs2 CROSS JOIN bg1;
ROLLBACK;
