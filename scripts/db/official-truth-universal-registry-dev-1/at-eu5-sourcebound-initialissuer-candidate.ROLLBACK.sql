-- AT EU5 DE/PL/IT/RO/FR: uninstalled source-bound candidate NEGATIVE rehearsal.
-- ONLY execute on isolated Supabase DEV PG17, with explicit ROLLBACK.
-- Does not mint a rule, authenticate a person, approve a method, or publish.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
DO $pre$
DECLARE n integer; pair jsonb; legal_count integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR auth.uid() IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'AT_EU5_REVIEW_PRECONDITION_STOP' USING ERRCODE='P7981'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 SELECT count(*) INTO n FROM official_v3_at_private.whole_originals_v2
 WHERE (source_id='bmi-visa-nationality-matrix' AND editorial_edition='2026-11-06'
 AND octet_length(original_body)=498415 AND encode(sha256(original_body),'hex')='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778')
 OR (source_id='bmi-general-entry' AND octet_length(original_body)=91655
 AND encode(sha256(original_body),'hex')='ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e');
 IF n<>2 THEN RAISE EXCEPTION 'AT_EU5_ARCHIVED_BYTES_MISMATCH' USING ERRCODE='P7981'; END IF;
 SELECT jetnity_legal_review_private.nonch_bmi_pair_status_v1() INTO pair;
 IF pair->>'status' IS DISTINCT FROM 'two_destination_primaries_unchanged_research_only'
 OR pair->>'legalRuleApproved' IS DISTINCT FROM 'false'
 OR pair->>'acceptedFacts' IS DISTINCT FROM '0'
 THEN RAISE EXCEPTION 'AT_EU5_RESEARCH_PAIR_CHANGED' USING ERRCODE='P7981'; END IF;
 SELECT count(*) INTO legal_count FROM jetnity_legal_review_private.at_visa_method_candidates_v1
 WHERE citizenship_country_code IN ('DE','PL','IT','RO','FR')
 AND (primary_rule_qualified OR ma1_method_authorized OR owner_aal2_approved OR publication_allowed);
 IF legal_count<>0 THEN RAISE EXCEPTION 'AT_EU5_REVIEW_STATE_CHANGED' USING ERRCODE='P7981'; END IF;
END $pre$;
CREATE FUNCTION pg_temp.at_eu5_sourcebound_initialissuer_candidate_v1(p_code text,p_document text,p_id_form text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $candidate$
BEGIN
 IF p_code IS NULL OR p_code NOT IN ('DE','PL','IT','RO','FR')
 OR p_document IS NULL OR p_document NOT IN ('ordinary_national_passport','national_eu_identity_card')
 THEN RAISE EXCEPTION 'AT EU5 unknown country/document' USING ERRCODE='42501'; END IF;
 IF p_document='national_eu_identity_card' AND
 (p_id_form IS DISTINCT FROM 'verified_physical_travel_id' OR p_code='FR')
 THEN RAISE EXCEPTION 'AT EU5 unqualified Article-5 ID or FR addendum' USING ERRCODE='42501'; END IF;
 IF p_document='ordinary_national_passport' AND p_id_form IS NOT NULL
 THEN RAISE EXCEPTION 'AT EU5 ID/passport evidence mixed' USING ERRCODE='42501'; END IF;
 -- Actual independent DB-backed session witness, never user/fixture booleans.
 PERFORM jetnity_ot_auth.require_current_owner_session_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'AT EU5 BG1 unavailable' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (SELECT 1 FROM official_v3_result_private.binding_v1
   WHERE singleton AND binding#>>'{context,scope,destinationCountryCode}'='AT'
   AND binding#>'{context,scope,citizenship,countryCodes}'='["DE","PL","IT","RO","FR"]'::jsonb)
 THEN RAISE EXCEPTION 'AT EU5 separate HRS2 not approved' USING ERRCODE='42501'; END IF;
 -- Archived research + unchanged monitor are NOT a legal source-to-rule receipt.
 -- Never accept without separately attested document, MA1 and Owner AAL2.
 -- This candidate has NO success path even if the above guards later pass.
 RAISE EXCEPTION 'AT EU5 source-rule/legal/MA1 issuer NOT INSTALLED' USING ERRCODE='42501';
END $candidate$;
REVOKE ALL ON FUNCTION pg_temp.at_eu5_sourcebound_initialissuer_candidate_v1(text,text,text)
FROM PUBLIC,anon,authenticated,service_role;
DO $negative$
DECLARE c text; count_refusals int:=0; g0 bigint; g1 bigint; doc text; form text;
BEGIN
 SELECT generation INTO STRICT g0 FROM official_v3_guard_private.state_v1 WHERE singleton;
 FOREACH c IN ARRAY ARRAY['DE','PL','IT','RO','FR','ZZ'] LOOP
  FOREACH doc IN ARRAY ARRAY['ordinary_national_passport','national_eu_identity_card','special_diplomatic_passport'] LOOP
   form:=CASE WHEN doc='national_eu_identity_card' THEN
    CASE WHEN c='IT' THEN 'italian_paper_nontravel'
         WHEN c='RO' THEN 'romanian_simple_nontravel'
         WHEN c='FR' THEN 'french_face_expired_legacy_unresolved'
         ELSE 'verified_physical_travel_id' END
    ELSE NULL END;
   BEGIN
    PERFORM pg_temp.at_eu5_sourcebound_initialissuer_candidate_v1(c,doc,form);
    RAISE EXCEPTION 'AT_EU5_REVIEW_BYPASS' USING ERRCODE='P7981';
   EXCEPTION WHEN SQLSTATE '42501' THEN count_refusals:=count_refusals+1;
   END;
  END LOOP;
 END LOOP;
 SELECT generation INTO STRICT g1 FROM official_v3_guard_private.state_v1 WHERE singleton;
 IF count_refusals<>18 OR g0<>g1
 OR has_function_privilege('anon','pg_temp.at_eu5_sourcebound_initialissuer_candidate_v1(text,text,text)','EXECUTE')
 OR has_function_privilege('authenticated','pg_temp.at_eu5_sourcebound_initialissuer_candidate_v1(text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'AT_EU5_PRIVILEGE_OR_ROLLBACK_PROOF_FAILED' USING ERRCODE='P7981'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $negative$;
SELECT 'AT_EU5_SOURCEBOUND_ISSUER_UNINSTALLED_18_NEGATIVE_ROLLBACK_PASS' AS result,
 18 AS rejected, FALSE AS authorized_legal_fact,FALSE AS installed_issuer,FALSE AS visitor_publication;
ROLLBACK;
