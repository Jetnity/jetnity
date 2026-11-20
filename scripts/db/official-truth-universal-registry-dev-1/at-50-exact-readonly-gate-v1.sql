-- One reproducible, PRIVATE Supabase DEV evidence proof; NEVER an issuer.
-- Austrian BMI edition 06.11.2026. RESEARCH_ONLY: verified source grouping is not an individual visa fact.
-- Run only in Dev yfvbxvijcorffwxbxahl. Any mismatch => REFUSED. No DDL, DML or Owner operation.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '20s';
SET LOCAL lock_timeout = '3s';
WITH groups AS (
 SELECT count(*) total,count(DISTINCT passport_code) distinct_passports,
 count(*) FILTER(WHERE bmi_group='V') v,count(*) FILTER(WHERE bmi_group='F') f,
 count(*) FILTER(WHERE bmi_group='E') e,count(*) FILTER(WHERE bmi_group='H') h,
 count(*) FILTER(WHERE biometric_passport_required_for_waiver) biometric,
 count(*) FILTER(WHERE british_document_category_required) british,
 count(*) FILTER(WHERE separate_austrian_bilateral_scope_check) bilateral,
 count(*) FILTER(WHERE pinned_original_digest<>'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
 OR bmi_source_version::text<>'2026-11-06' OR NOT group_source_classification_confirmed
 OR traveller_document_verified OR traveller_residence_verified OR traveller_route_and_purpose_verified
 OR ma1_owner_authorized OR individual_legal_rule_qualified OR publication_allowed
 OR legal_fee_amount IS NOT NULL OR individual_visitor_decision<>'derzeit nicht verfügbar') unqualified_grants
 FROM jetnity_legal_review_private.at_50_group_source_review_v2
),visa AS (
 SELECT count(*) total,count(*) FILTER(WHERE current_primary_source_checked_for_this_rule OR primary_rule_qualified
 OR ma1_method_authorized OR owner_aal2_approved OR publication_allowed
 OR legal_valid_from IS NOT NULL OR legal_valid_until IS NOT NULL OR visitor_answer<>'derzeit nicht verfügbar') unqualified_grants
 FROM jetnity_legal_review_private.at_visa_method_candidates_v1
),topics AS (
 SELECT count(*) total,count(DISTINCT citizenship_code) passports,count(DISTINCT topic) kinds,
 count(*) FILTER(WHERE candidate_sources=0 AND topic='required_vaccinations') missing_required,
 count(*) FILTER(WHERE candidate_sources=0 AND topic='recommended_vaccinations') missing_recommended,
 count(*) FILTER(WHERE candidate_sources=0 AND topic NOT IN ('required_vaccinations','recommended_vaccinations')) other_missing,
 count(*) FILTER(WHERE legal_rule_qualified OR publication_allowed OR accepted_facts<>0
 OR verified_fee IS NOT NULL OR visitor_answer<>'derzeit nicht verfügbar') unqualified_grants
 FROM jetnity_legal_review_private.at_rule_readiness_v1
),eu4 AS (
 SELECT count(*) total,count(DISTINCT destination_code) countries,
 count(*) FILTER(WHERE unresolved_original_conflict AND destination_code='ES' AND topic='financial_means') es_financial,
 count(*) FILTER(WHERE unresolved_original_conflict AND NOT (destination_code='ES' AND topic='financial_means')) other_conflicts,
 count(*) FILTER(WHERE legal_rule_qualified OR owner_aal2_approved OR publication_allowed
 OR accepted_fact_count<>0 OR verified_fee_amount IS NOT NULL OR visitor_text<>'derzeit nicht verfügbar') unqualified_grants
 FROM jetnity_legal_review_private.eu_four_case_audit_v1
),guard AS (
 SELECT generation,incident_generation,resumed_generation,valid_until
 FROM official_v3_guard_private.state_v1 WHERE singleton
)
SELECT CASE WHEN current_database()='postgres' AND current_setting('server_version_num')::int/10000=17
 AND (SELECT public.official_v3_guard_alarm_status_v1()->>'status')='current'
 AND guard.incident_generation<=guard.resumed_generation AND guard.valid_until>now()
 AND (groups.total,groups.distinct_passports,groups.v,groups.f,groups.e,groups.h)=(50,50,20,19,10,1)
 AND (groups.biometric,groups.british,groups.bilateral)=(3,1,5)
 AND groups.unqualified_grants=0 AND visa.total=50 AND visa.unqualified_grants=0
 AND (topics.total,topics.passports,topics.kinds)=(1300,50,26)
 AND (topics.missing_required,topics.missing_recommended,topics.other_missing)=(50,50,0)
 AND topics.unqualified_grants=0
 AND (eu4.total,eu4.countries,eu4.es_financial,eu4.other_conflicts)=(5200,4,30,0)
 AND eu4.unqualified_grants=0
 AND NOT has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 AND NOT has_table_privilege('anon','jetnity_legal_review_private.at_50_group_source_review_v2','SELECT')
 AND NOT has_table_privilege('authenticated','jetnity_legal_review_private.at_50_group_source_review_v2','SELECT')
 THEN 'AT50_RESEARCH_EXACT_READONLY_PASS_NOT_RELEASE'
 ELSE 'AT50_RESEARCH_EVIDENCE_REFUSED' END AS evidence_verdict,
 groups.total AS passports,topics.total AS at_topic_slots,
 (topics.missing_required+topics.missing_recommended) AS vaccination_unavailable,
 eu4.total AS eu4_topic_slots,eu4.es_financial AS es_financial_conflicts,
 guard.generation AS bg1_generation,guard.incident_generation AS bg1_incident,
 guard.resumed_generation AS bg1_resumed,now() AS checked_at,
 false AS individual_legal_release_authorized,false AS production_install_authorized
FROM groups CROSS JOIN visa CROSS JOIN topics CROSS JOIN eu4 CROSS JOIN guard;
ROLLBACK;
