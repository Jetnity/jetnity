-- DEV ONLY. Follow-up legal-condition index IT/FR/ES/PT, 50 passports each.
-- Original 206x50 research archive SHA256:
-- 6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5
-- Only the 30 original ES daily-funds disagreements are topic conflicted.
-- Research links are not approved law; no price, ID, visa, transit, health,
-- or negative requirement can be inferred from a missing source.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.eu_review_target='dev:yfvbxvijcorffwxbxahl:FOUR-LEGAL-RESEARCH-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres' OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.eu_review_target',true)
  IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FOUR-LEGAL-RESEARCH-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_legal_review_private.eu_four_case_audit_v1') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>49
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_authority_consistency_v1)<>1300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,787)
 THEN RAISE EXCEPTION 'EU_FOUR_LEGAL_SCOPE_PREDECESSOR_REQUIRED' USING ERRCODE='P7989'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE VIEW jetnity_legal_review_private.eu_four_case_audit_v1
 WITH (security_invoker=true) AS
SELECT p.destination_code,p.citizenship_code,p.priority_rank,p.topic,
 c.original_slice_path,c.source_snapshot_class,c.document_scope,
 p.candidate_sources,p.registered_official_urls,p.source_last_seen_at,
 CASE
   WHEN p.destination_code='ES' AND p.topic='financial_means'
     AND p.citizenship_code IN ('IN','TR','CN','US','UA','GB','SY','AF','RU','IQ','BR','IR','PK','ER','TH','SO','VN','NG','EG','XK','KR','LK','PH','JP','LB','RS','CA','CM','MA','IL')
      THEN 'ORIGINAL_ES_DAILY_FUNDS_AMOUNT_CONFLICT_UNRESOLVED'
   WHEN p.candidate_sources=0 THEN 'NO_SUITABLE_PRIMARY_TOPIC_SOURCE'
   WHEN p.topic='electronic_travel_authorization'
      THEN 'EU_ETIAS_NOT_IN_OPERATION_MONITOR_FOR_ACTUAL_START'
   WHEN p.topic='visa' THEN 'MUST_VERIFY_DESTINATION_PRIMARY_CITIZENSHIP_DOCUMENT_RESIDENCE_AND_PURPOSE'
   WHEN p.topic IN ('passport','identity_document','passport_validity','blank_passport_pages')
      THEN 'DOCUMENT_TYPE_ISSUE_DATE_VALIDITY_AND_ACCEPTED_TRAVEL_DOCUMENT_REQUIRED'
   WHEN p.topic IN ('entry_fees','form_costs','entry_forms','official_actions')
      THEN 'ACTUAL_VISA_APPLICATION_AGE_AND_OFFICIAL_FORM_CONDITIONS_REQUIRED'
   WHEN p.topic IN ('transit','stay_limit','onward_return_ticket','financial_means')
      THEN 'TRAVEL_ROUTE_TRANSIT_ZONE_PURPOSE_AND_STAY_CONDITIONS_REQUIRED'
   WHEN p.topic IN ('minors','parental_consent')
      THEN 'CHILD_AGE_CUSTODY_COMPANION_AND_DESTINATION_RULE_REQUIRED'
   ELSE 'CURRENT_DESTINATION_PRIMARY_AND_APPLICABILITY_CHECK_REQUIRED'
 END AS legal_review_disposition,
 CASE WHEN p.destination_code='ES' AND p.topic='financial_means'
  AND p.citizenship_code IN ('IN','TR','CN','US','UA','GB','SY','AF','RU','IQ','BR','IR','PK','ER','TH','SO','VN','NG','EG','XK','KR','LK','PH','JP','LB','RS','CA','CM','MA','IL') THEN true ELSE false END AS unresolved_original_conflict,
 false::boolean AS legal_rule_qualified,
 false::boolean AS owner_aal2_approved,
 false::boolean AS publication_allowed,
 0::integer AS accepted_fact_count,
 NULL::date AS legal_valid_from,
 NULL::date AS legal_valid_until,
 NULL::numeric AS verified_fee_amount,
 'derzeit nicht verfügbar'::text AS visitor_text
FROM jetnity_release_review_private.passport_topic_status_v1 p
JOIN jetnity_global_research_private.cases_v1 c
 ON c.destination_code=p.destination_code
 AND c.citizenship_code=p.citizenship_code
WHERE p.destination_code IN ('IT','FR','ES','PT')
 AND NOT p.rule_verified AND NOT p.rule_publishable
 AND p.customer_answer='derzeit nicht verfügbar'
 AND NOT c.legal_rule_qualified AND NOT c.publication_allowed
 AND c.accepted_fact_count=0;

REVOKE ALL ON jetnity_legal_review_private.eu_four_case_audit_v1
 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_legal_review_private.eu_four_case_audit_v1)<>5200
 OR (SELECT count(*) FROM jetnity_legal_review_private.eu_four_case_audit_v1
     WHERE destination_code='ES' AND unresolved_original_conflict)<>30
 OR (SELECT count(*) FROM jetnity_legal_review_private.eu_four_case_audit_v1
     WHERE destination_code='ES' AND topic='visa'
     AND unresolved_original_conflict)<>0
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.eu_four_case_audit_v1
     WHERE legal_rule_qualified OR owner_aal2_approved OR publication_allowed
     OR accepted_fact_count<>0 OR verified_fee_amount IS NOT NULL
     OR visitor_text<>'derzeit nicht verfügbar')
 OR has_schema_privilege('anon','jetnity_legal_review_private','USAGE')
 OR has_table_privilege('anon','jetnity_legal_review_private.eu_four_case_audit_v1','SELECT')
 OR has_table_privilege('authenticated','jetnity_legal_review_private.eu_four_case_audit_v1','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'EU_FOUR_LEGAL_SCOPE_POSTCHECK_ROLLBACK' USING ERRCODE='P7989'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
