-- Real Dev-hosted PG17: exact Owner-API SQL bodies, never an Owner session.
-- CREATE ... and ROLLBACK only, no Production, no extra roles or grants in custody.
BEGIN;
SET LOCAL statement_timeout='15s';
SET LOCAL search_path=pg_catalog;
DO $pre$
BEGIN
 IF current_setting('server_version_num')::int/10000<>17
 OR to_regprocedure('public.official_v3_at_ch_source_approve_v3(text,text)') IS NOT NULL
 OR to_regprocedure('public.official_v3_at_ch_source_confirm_v3(text,text)') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_V3_DEV_AAL2_NEGATIVE_PRECONDITION' USING ERRCODE='P7998'; END IF;
END $pre$;
CREATE FUNCTION public.official_v3_at_ch_source_approve_v3(
 p_operation_id text,p_bmeia_sha text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog SET lock_timeout='2s' AS $approve$
DECLARE current_head official_v3_method_private.heads_v1%ROWTYPE;
 actor uuid; jwt jsonb; session_uuid uuid; recorded_at timestamptz; previous_op text;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^atsrc3_[a-f0-9]{32}$'
 OR p_bmeia_sha IS DISTINCT FROM 'b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8'
 OR auth.uid() IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 THEN RAISE EXCEPTION 'AT_V3_OWNER_SOURCE_REQUEST_REFUSED' USING ERRCODE='42501'; END IF;
 PERFORM jetnity_ot_auth.require_current_owner_session_v1();
 actor:=auth.uid(); jwt:=auth.jwt(); session_uuid:=(jwt->>'session_id')::uuid;
 PERFORM pg_advisory_xact_lock(771112,33);
 PERFORM official_v3_guard_private.require_open_v1();
 SELECT * INTO current_head FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR current_head.status<>'approved' OR current_head.revision<>2
 OR current_head.epoch<>2
 OR current_head.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
 OR current_head.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 THEN RAISE EXCEPTION 'AT_V3_OWNER_SOURCE_METHOD_REFUSED' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_source_qualifications_v3
   WHERE source_id='bmeia-bern-how-to-apply' AND original_sha=p_bmeia_sha AND original_bytes=172428)
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 THEN RAISE EXCEPTION 'AT_V3_OWNER_SOURCE_CUSTODY_REFUSED' USING ERRCODE='42501'; END IF;
 -- A changed source or older batch can never be approved from an expired screenshot.
 IF NOT official_v3_at_production_private.batch_qualified_owner_precheck_v3()
 THEN RAISE EXCEPTION 'AT_V3_OWNER_SOURCE_CHANGED' USING ERRCODE='42501'; END IF;
 SELECT operation_id,decided_at INTO previous_op,recorded_at
 FROM official_v3_at_production_private.ch_source_owner_decisions_v3
 WHERE source_sha=p_bmeia_sha AND decision='rule_neutral_ch_at_visa_only' FOR SHARE;
 IF FOUND THEN
  IF previous_op<>p_operation_id THEN RAISE EXCEPTION 'AT_V3_OWNER_DECISION_ALREADY_RECORDED' USING ERRCODE='23505'; END IF;
  RETURN jsonb_build_object('schema',3,'status','recorded','operationId',p_operation_id,
   'sourceSha',p_bmeia_sha,'recordedAt',recorded_at);
 END IF;
 INSERT INTO official_v3_at_production_private.ch_source_owner_decisions_v3(
 operation_id,decision,source_sha,source_bytes,owner_id,auth_session_id,method_epoch)
 VALUES(p_operation_id,'rule_neutral_ch_at_visa_only',p_bmeia_sha,172428,actor,session_uuid,2)
 RETURNING decided_at INTO recorded_at;
 RETURN jsonb_build_object('schema',3,'status','recorded','operationId',p_operation_id,
 'sourceSha',p_bmeia_sha,'recordedAt',recorded_at);
END $approve$;
REVOKE ALL ON FUNCTION public.official_v3_at_ch_source_approve_v3(text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.official_v3_at_ch_source_approve_v3(text,text) TO authenticated;
CREATE FUNCTION public.official_v3_at_ch_source_confirm_v3(
 p_operation_id text,p_bmeia_sha text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog SET lock_timeout='2s' AS $confirm$
DECLARE recorded timestamptz;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id!~'^atsrc3_[a-f0-9]{32}$'
 OR p_bmeia_sha IS DISTINCT FROM 'b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8'
 THEN RAISE EXCEPTION 'AT_V3_SOURCE_CONFIRM_REFUSED' USING ERRCODE='42501'; END IF;
 PERFORM jetnity_ot_auth.require_current_owner_session_v1();
 SELECT d.decided_at INTO recorded
 FROM official_v3_at_production_private.ch_source_owner_decisions_v3 d
 WHERE d.operation_id=p_operation_id AND d.source_sha=p_bmeia_sha
   AND d.owner_id=auth.uid();
 IF NOT FOUND THEN RETURN jsonb_build_object('schema',3,'status','absent','operationId',p_operation_id); END IF;
 RETURN jsonb_build_object('schema',3,'status','confirmed','operationId',p_operation_id,
   'sourceSha',p_bmeia_sha,'recordedAt',recorded);
END $confirm$;
REVOKE ALL ON FUNCTION public.official_v3_at_ch_source_confirm_v3(text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.official_v3_at_ch_source_confirm_v3(text,text) TO authenticated;
DO $proof$
DECLARE n int:=0;
BEGIN
 IF has_function_privilege('anon','public.official_v3_at_ch_source_approve_v3(text,text)','EXECUTE')
 OR has_function_privilege('service_role','public.official_v3_at_ch_source_approve_v3(text,text)','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.official_v3_at_ch_source_approve_v3(text,text)','EXECUTE')
 OR has_function_privilege('anon','public.official_v3_at_ch_source_confirm_v3(text,text)','EXECUTE')
 OR has_function_privilege('service_role','public.official_v3_at_ch_source_confirm_v3(text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'AT_V3_OWNER_API_WRONG_ACL' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM public.official_v3_at_ch_source_approve_v3(
    'atsrc3_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8');
  RAISE EXCEPTION 'AT_V3_AAL2_BYPASS' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE '42501' THEN n:=n+1;
 END;
 BEGIN
  PERFORM public.official_v3_at_ch_source_confirm_v3(
    'atsrc3_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8');
  RAISE EXCEPTION 'AT_V3_AAL2_CONFIRM_BYPASS' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE '42501' THEN n:=n+1;
 END;
 IF n<>2 THEN RAISE EXCEPTION 'AT_V3_AAL2_REFUSALS_MISSING' USING ERRCODE='P7998'; END IF;
END $proof$;
SELECT 'AT_V3_DEV_OWNER_AAL2_2_NEGATIVE_PASS' AS result;
ROLLBACK;
DO $after$
BEGIN
 IF to_regprocedure('public.official_v3_at_ch_source_approve_v3(text,text)') IS NOT NULL
 OR to_regprocedure('public.official_v3_at_ch_source_confirm_v3(text,text)') IS NOT NULL
 THEN RAISE EXCEPTION 'AT_V3_DEV_OWNER_API_ROLLBACK_FAILED' USING ERRCODE='P7998'; END IF;
END $after$;
SELECT public.official_v3_guard_alarm_status_v1() AS dev_bg1_after;
