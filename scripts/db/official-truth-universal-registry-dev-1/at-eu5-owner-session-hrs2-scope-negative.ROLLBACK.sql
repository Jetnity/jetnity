-- AT-EU5 (DE, PL, IT, RO, FR) SESSION/HRS2 ISSUER BLOCK NEGATIVE REHEARSAL.
-- Dev PG17 ONLY. No owner impersonation, no accepted facts, no Production.
-- This is a temporary function test, NOT a user-facing issuer/method approval.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres'
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR to_regclass('official_v3_guard_private.source_renewal_baseline_v1') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR auth.uid() IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR (SELECT count(*) FROM official_v3_result_private.binding_v1 WHERE singleton)<>1
 OR (SELECT binding#>>'{context,scope,destinationCountryCode}' FROM official_v3_result_private.binding_v1 WHERE singleton) IS DISTINCT FROM 'DE'
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_visa_method_candidates_v1
      WHERE citizenship_country_code IN ('DE','PL','IT','RO','FR')
      AND (primary_rule_qualified OR ma1_method_authorized OR owner_aal2_approved OR publication_allowed))<>0
 THEN RAISE EXCEPTION 'AT_EU5_DEV_NEGATIVE_PRECONDITION_REFUSED' USING ERRCODE='P7981';END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
CREATE FUNCTION pg_temp.at_eu5_initialissuer_owner_scope_gate_v1(p_country text,p_document text)
 RETURNS void
 LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
 AS $eu5$
BEGIN
 IF p_country NOT IN ('DE','PL','IT','RO','FR') OR p_country IS NULL
 OR p_document NOT IN ('ordinary_national_passport','national_eu_identity_card') OR p_document IS NULL
 THEN RAISE EXCEPTION 'AT EU5 document or nationality scope unavailable' USING ERRCODE='42501';END IF;
 -- This checks actual auth.sessions/profiles and JWT AAL2 via a definer.
 -- No booleans supplied by a user/fixture may become an Owner witness.
 PERFORM jetnity_ot_auth.require_current_owner_session_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'AT EU5 BG1 unavailable' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (
 SELECT 1 FROM official_v3_result_private.binding_v1 b WHERE b.singleton
 AND b.binding#>>'{context,scope,destinationCountryCode}'='AT'
 AND b.binding#>'{context,scope,citizenship,countryCodes}'='["DE","PL","IT","RO","FR"]'::jsonb
 ) THEN RAISE EXCEPTION 'AT EU5 HRS2 issuer not selected' USING ERRCODE='42501'; END IF;
 -- Even verified scope is NOT a fact, source seal, method issuer or legal decision.
 RAISE EXCEPTION 'AT EU5 source-bound HRS2 MA1 Owner issuer not installed' USING ERRCODE='42501';
END $eu5$;
REVOKE ALL ON FUNCTION pg_temp.at_eu5_initialissuer_owner_scope_gate_v1(text,text)
 FROM PUBLIC,anon,authenticated,service_role;
DO $negative$
DECLARE c text; doc text; refusals integer:=0; initial_generation bigint; end_generation bigint;
BEGIN
 SELECT generation INTO STRICT initial_generation FROM official_v3_guard_private.state_v1 WHERE singleton;
 IF NOT (
  SELECT p.prosecdef AND p.provolatile='v' AND
   EXISTS(SELECT 1 FROM unnest(p.proconfig) x WHERE x='search_path=pg_catalog')
  FROM pg_proc p WHERE p.oid='pg_temp.at_eu5_initialissuer_owner_scope_gate_v1(text,text)'::regprocedure)
 THEN RAISE EXCEPTION 'AT_EU5_TEMP_OWNER_WRAPPER_NOT_PROTECTED' USING ERRCODE='P7981';END IF;
 FOREACH c IN ARRAY ARRAY['DE','PL','IT','RO','FR','ZZ'] LOOP
  FOREACH doc IN ARRAY ARRAY['ordinary_national_passport','national_eu_identity_card'] LOOP
   BEGIN
    PERFORM pg_temp.at_eu5_initialissuer_owner_scope_gate_v1(c,doc);
    RAISE EXCEPTION 'AT_EU5_OWNER_OR_HRS2_BYPASS' USING ERRCODE='P7981';
   EXCEPTION WHEN SQLSTATE '42501' THEN refusals:=refusals+1;
   END;
  END LOOP;
 END LOOP;
 SELECT generation INTO STRICT end_generation FROM official_v3_guard_private.state_v1 WHERE singleton;
 IF refusals<>12 OR end_generation<>initial_generation
 OR has_function_privilege('anon','pg_temp.at_eu5_initialissuer_owner_scope_gate_v1(text,text)','EXECUTE')
 OR has_function_privilege('authenticated','pg_temp.at_eu5_initialissuer_owner_scope_gate_v1(text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'AT_EU5_NEGATIVE_SCOPE_OR_PRIVILEGE_FAILED' USING ERRCODE='P7981';END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $negative$;
SELECT 'DEV_AT_EU5_OWNER_HRS2_NEGATIVE_PG17_ROLLBACK_PASS' AS result,
  12 AS refused_missing_owner_or_wrong_scope,
  FALSE AS creates_fact,FALSE AS approves_method,FALSE AS publishes;
ROLLBACK;
