-- DEV ONLY. Non-CH ordinary passport BMI primary pair freshness check.
-- The CH-only Bern consulate outage cannot imply a changed Austrian nationality
-- matrix. This is RESEARCH source-custody only: no 49-pass rule approvals.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.nonch_bmi_target='dev:yfvbxvijcorffwxbxahl:AT-NONCH-BMI-WATCH-V1';

DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.nonch_bmi_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-NONCH-BMI-WATCH-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regprocedure('jetnity_legal_review_private.nonch_bmi_pair_status_v1()') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>3
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_bmi_matrix_source_binding_v1)<>50
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>49
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,786)
 THEN RAISE EXCEPTION 'AT_NONCH_BMI_WATCH_PREDECESSOR_REQUIRED' USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE FUNCTION jetnity_legal_review_private.nonch_bmi_pair_status_v1()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER
 SET search_path=pg_catalog AS $watch$
DECLARE
 b record; total integer; current_count integer; source_count integer;
 now_at timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN jsonb_build_object('status','unavailable','legalRuleApproved',false,
  'publicationAllowed',false,'acceptedFacts',0); END IF;
 now_at:=clock_timestamp();
 SELECT batch_id,requested_at INTO b
 FROM official_v3_at_source_watch_private.batches_v1
 ORDER BY batch_id DESC LIMIT 1;
 IF NOT FOUND OR b.requested_at IS NULL OR b.requested_at>now_at
 OR b.requested_at<=now_at-interval '70 minutes'
 THEN RETURN jsonb_build_object('status','unavailable','legalRuleApproved',false,
  'publicationAllowed',false,'acceptedFacts',0); END IF;

 -- This proof checks the two current AUSTRIAN primary sources and deliberately
 -- does NOT use the Swiss-only BMEIA Bern source as evidence for the other 49.
 SELECT count(*),count(*) FILTER(WHERE r.state='unchanged_exact'
    AND r.observed_at IS NOT NULL
    AND r.observed_at>=r.requested_at
    AND r.observed_at<=r.requested_at+interval '5 minutes 10 seconds'
    AND r.observed_at<=now_at
    AND r.requested_at=b.requested_at
    AND r.observed_sha=p.raw_sha
    AND r.observed_bytes=p.expected_bytes
    AND p.raw_sha=CASE r.source_id
      WHEN 'bmi-visa-nationality-matrix'
        THEN 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
      WHEN 'bmi-general-entry'
        THEN 'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e'
      ELSE '' END)
 INTO total,current_count
 FROM official_v3_at_source_watch_private.reads_v1 r
 JOIN official_v3_at_source_watch_private.pins_v1 p USING(source_id)
 WHERE r.batch_id=b.batch_id
   AND r.source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry');
 SELECT count(*) INTO source_count
 FROM official_v3_at_private.whole_originals_v2 s
 WHERE ((s.source_id='bmi-visa-nationality-matrix'
         AND s.editorial_edition='2026-11-06'
         AND s.body_bytes=498415
         AND s.body_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778')
 OR (s.source_id='bmi-general-entry'
         AND s.body_bytes=91655
         AND s.body_digest='ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e'))
 AND s.body_digest=encode(sha256(s.original_body),'hex');
 IF total<>2 OR current_count<>2 OR source_count<>2
 THEN RETURN jsonb_build_object('status','unavailable','legalRuleApproved',false,
  'publicationAllowed',false,'acceptedFacts',0); END IF;
 RETURN jsonb_build_object('status','two_destination_primaries_unchanged_research_only',
  'sourcesObserved',2,'reviewedPassports',49,'legalRuleApproved',false,
  'publicationAllowed',false,'acceptedFacts',0,
  'reason','MA1/Owner/AAL2 plus passport-document-purpose-case proof required');
EXCEPTION WHEN OTHERS THEN
 RETURN jsonb_build_object('status','unavailable','legalRuleApproved',false,
  'publicationAllowed',false,'acceptedFacts',0);
END $watch$;
REVOKE ALL ON FUNCTION jetnity_legal_review_private.nonch_bmi_pair_status_v1()
 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
DECLARE state jsonb;
BEGIN
 state:=jetnity_legal_review_private.nonch_bmi_pair_status_v1();
 IF state->>'status' NOT IN('two_destination_primaries_unchanged_research_only','unavailable')
 OR state->>'publicationAllowed'<>'false'
 OR state->>'legalRuleApproved'<>'false'
 OR state->>'acceptedFacts'<>'0'
 OR has_function_privilege('anon','jetnity_legal_review_private.nonch_bmi_pair_status_v1()','EXECUTE')
 OR has_function_privilege('authenticated','jetnity_legal_review_private.nonch_bmi_pair_status_v1()','EXECUTE')
 OR has_function_privilege('service_role','jetnity_legal_review_private.nonch_bmi_pair_status_v1()','EXECUTE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_NONCH_BMI_WATCH_POSTCHECK_ROLLBACK' USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
