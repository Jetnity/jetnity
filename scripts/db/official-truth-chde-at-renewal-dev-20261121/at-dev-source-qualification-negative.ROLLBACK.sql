-- Dev PG17; no trusted owner session, source-to-rule or user fact. Full ROLLBACK.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
CREATE TEMP TABLE pg_temp.at_research_pin(
 source_id text PRIMARY KEY, research_only boolean NOT NULL, source_qualified boolean NOT NULL
) ON COMMIT DROP;
INSERT INTO pg_temp.at_research_pin VALUES
('bmi-general-entry',true,false),
('bmi-visa-nationality-matrix',true,false),
('bmeia-bern-how-to-apply',true,false);
CREATE FUNCTION pg_temp.at_verified_source_to_rule_gate_v1() RETURNS void
 LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $fn$
BEGIN
 IF (SELECT count(*) FROM pg_temp.at_research_pin)<>3
 OR EXISTS(SELECT 1 FROM pg_temp.at_research_pin WHERE research_only OR NOT source_qualified)
 THEN RAISE EXCEPTION 'AT_RESEARCH_ONLY_CANNOT_PUBLISH' USING ERRCODE='42501';END IF;
 PERFORM official_v3_guard_private.owner_session_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'AT_BG1_NOT_CURRENT' USING ERRCODE='42501';END IF;
 RAISE EXCEPTION 'AT_DOCUMENT_HRS2_MA1_LEGAL_ISSUER_NOT_INSTALLED' USING ERRCODE='42501';
END $fn$;
REVOKE ALL ON FUNCTION pg_temp.at_verified_source_to_rule_gate_v1()
 FROM PUBLIC,anon,authenticated,service_role;
DO $negative$
DECLARE rejected integer:=0;
BEGIN
 IF current_user<>'postgres' OR session_user<>'postgres' OR current_setting('server_version_num')::integer/10000<>17
 OR auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'DEV_ONLY_PG17_REQUIRED';END IF;
 BEGIN
  PERFORM pg_temp.at_verified_source_to_rule_gate_v1();
  RAISE EXCEPTION 'AT_RESEARCH_BYPASS';
 EXCEPTION WHEN SQLSTATE '42501' THEN rejected:=rejected+1;
 END;
 UPDATE pg_temp.at_research_pin SET research_only=false,source_qualified=true;
 BEGIN
  PERFORM pg_temp.at_verified_source_to_rule_gate_v1();
  RAISE EXCEPTION 'AT_OWNER_BYPASS';
 EXCEPTION WHEN SQLSTATE '42501' THEN rejected:=rejected+1;
 END;
 IF rejected<>2 OR has_function_privilege('anon','pg_temp.at_verified_source_to_rule_gate_v1()','EXECUTE')
 OR has_function_privilege('authenticated','pg_temp.at_verified_source_to_rule_gate_v1()','EXECUTE')
 THEN RAISE EXCEPTION 'AT_FAILCLOSED_TEST_MISSING';END IF;
END $negative$;
SELECT 'DEV_AT_SOURCE_QUALIFICATION_AND_OWNER_SESSION_NEGATIVE_PG17_PASS' AS result,
 2 AS expected_refusals,
 false AS current_at_source_legally_qualified,
 false AS new_visitor_facts;
ROLLBACK;
