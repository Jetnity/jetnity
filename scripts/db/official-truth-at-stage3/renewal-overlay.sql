-- Fail-closed hold on the exact Stage 2 functions. No cron and no grant.
DO $stage3_overlay_part$
BEGIN
 IF current_setting('jetnity.at_stage3_assembler',true) IS DISTINCT FROM 'package'
 THEN RAISE EXCEPTION 'AT_STAGE3_MODULE_INSTALL_FORBIDDEN' USING ERRCODE='P7996'; END IF;
END $stage3_overlay_part$;
CREATE OR REPLACE FUNCTION official_v3_at_production_private.renew_ch_v3(p_authorization text)
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog SET lock_timeout='2s'
AS $renew$
DECLARE a official_v3_at_production_private.ch_renewal_go_v3%ROWTYPE; previous bigint; evidence jsonb;
 instant_at timestamptz; checked timestamptz; until_at timestamptz;
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)
 THEN RETURN 0; END IF;
 IF session_user<>'postgres' OR current_user<>session_user
 OR NOT pg_try_advisory_xact_lock(771112,34) THEN RETURN 0; END IF;
 PERFORM official_v3_guard_private.require_open_v1();
 PERFORM official_v3_guard_private.assert_catalog_v1();
 SELECT * INTO a FROM official_v3_at_production_private.ch_renewal_go_v3 WHERE authorization_id=p_authorization FOR SHARE;
 instant_at:=clock_timestamp();
 IF NOT FOUND OR a.authorized_at>instant_at OR a.valid_until<=instant_at OR a.method_epoch<>2
 OR official_v3_at_production_private.stage2_method_ch_v3() IS DISTINCT FROM true THEN RETURN 0; END IF;
 -- Hold the source and receipt snapshot stable from the final reproof to commit.
 LOCK TABLE official_v3_at_production_private.watch_batches_v1,official_v3_at_production_private.watch_requests_v1,
  official_v3_at_production_private.watch_observations_v1,official_v3_at_production_private.ch_source_http_receipts_v3,
  official_v3_at_production_private.ch_source_http_bodies_v3 IN SHARE MODE;
 LOCK TABLE official_v3_at_production_private.ch_visa_facts_v1,official_v3_at_production_private.ch_visa_facts_v2,official_v3_at_production_private.ch_visa_facts_v3 IN SHARE ROW EXCLUSIVE MODE;
 SELECT greatest(
  coalesce((SELECT max(version_id) FROM official_v3_at_production_private.ch_visa_facts_v1),0),
  coalesce((SELECT max(version_id) FROM official_v3_at_production_private.ch_visa_facts_v2),0),
  coalesce((SELECT max(version_id) FROM official_v3_at_production_private.ch_visa_facts_v3),0))
 INTO previous;
 IF previous<>a.expected_predecessor OR previous>=2147483646
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_visa_facts_v3 WHERE authorization_id=a.authorization_id OR source_batch_id=a.batch_id)
 THEN RETURN 0; END IF;
 evidence:=official_v3_at_production_private.stage2_evidence_ch_v3(a.batch_id,a.source_operation_id);
 IF evidence IS NULL OR evidence->>'digest' IS DISTINCT FROM a.source_digest
 OR official_v3_at_production_private.stage2_history_ch_v3(a.batch_id,a.source_operation_id) IS DISTINCT FROM true
 THEN RETURN 0; END IF;
 checked:=(evidence->>'checkedAt')::timestamptz;
 instant_at:=clock_timestamp();
 until_at:=least(instant_at+interval '1 hour',checked+interval '70 minutes','2027-11-22T00:00:00Z'::timestamptz);
 IF instant_at>=a.valid_until OR checked>instant_at OR until_at<=instant_at THEN RETURN 0; END IF;
 -- Last fresh reproof before insert, still within the same transaction.
 PERFORM official_v3_guard_private.require_open_v1();
 IF official_v3_at_production_private.stage2_evidence_ch_v3(a.batch_id,a.source_operation_id) IS DISTINCT FROM evidence
 THEN RETURN 0; END IF;
 INSERT INTO official_v3_at_production_private.ch_visa_facts_v3(version_id,authorization_id,source_operation_id,source_batch_id,source_digest,
  method_epoch,source_checked_at,verified_at,expires_at)
 VALUES(previous+1,a.authorization_id,a.source_operation_id,a.batch_id,a.source_digest,2,checked,instant_at,until_at);
 PERFORM official_v3_guard_private.assert_catalog_v1();
 RETURN 1;
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN 0;
END $renew$;
CREATE OR REPLACE FUNCTION official_v3_at_production_private.read_ch_v3(p_citizenship text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $read$
DECLARE none jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 f official_v3_at_production_private.ch_visa_facts_v3%ROWTYPE; evidence jsonb; instant_at timestamptz:=clock_timestamp();
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)
 THEN RETURN none; END IF;
 IF p_citizenship IS DISTINCT FROM 'CH'
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR official_v3_at_production_private.stage2_method_ch_v3() IS DISTINCT FROM true THEN RETURN none; END IF;
 PERFORM official_v3_guard_private.require_open_v1();
 SELECT * INTO f FROM official_v3_at_production_private.ch_visa_facts_v3 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND OR instant_at<f.verified_at OR instant_at>=f.expires_at
 OR instant_at>=f.source_checked_at+interval '70 minutes'
 OR f.version_id<=greatest(coalesce((SELECT max(version_id) FROM official_v3_at_production_private.ch_visa_facts_v1),0),
    coalesce((SELECT max(version_id) FROM official_v3_at_production_private.ch_visa_facts_v2),0))
 OR NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_renewal_go_v3 a WHERE a.authorization_id=f.authorization_id
    AND a.source_operation_id=f.source_operation_id AND a.batch_id=f.source_batch_id AND a.source_digest=f.source_digest
    AND a.expected_predecessor+1=f.version_id AND a.method_epoch=f.method_epoch
    AND f.verified_at>=a.authorized_at AND f.verified_at<a.valid_until)
 THEN RETURN none; END IF;
 evidence:=official_v3_at_production_private.stage2_evidence_ch_v3(f.source_batch_id,f.source_operation_id);
 IF evidence IS NULL OR evidence->>'digest' IS DISTINCT FROM f.source_digest
 OR (evidence->>'checkedAt')::timestamptz IS DISTINCT FROM f.source_checked_at
 THEN RETURN none; END IF;
 -- Recheck expiry after the protected reads, never lengthen it.
 IF clock_timestamp()>=f.expires_at THEN RETURN none; END IF;
 RETURN jsonb_build_object('status','accepted','sourceAuthorityVersion',3,'citizenshipCountryCode','CH',
  'destinationCountryCode','AT','documentType','passport','visaEffect','not_required','visaMode','visa_exempt',
  'ruleVersion',f.version_id,
  'sourceCheckedAt',to_char(f.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'verifiedAt',to_char(f.verified_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'expiresAt',to_char(f.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'sourceUrls',evidence->'sourceUrls');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN none;
END $read$;
CREATE OR REPLACE FUNCTION official_v3_at_production_private.read_published_ch_v3(p_citizenship text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $public_read$
DECLARE none jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 d official_v3_at_production_private.ch_visa_publication_v3%ROWTYPE; answer jsonb;
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)
 THEN RETURN none; END IF;
 IF p_citizenship IS DISTINCT FROM 'CH' THEN RETURN none; END IF;
 SELECT * INTO d FROM official_v3_at_production_private.ch_visa_publication_v3 ORDER BY decision_seq DESC LIMIT 1;
 IF NOT FOUND OR d.decision IS DISTINCT FROM 'release' OR d.recorded_at>clock_timestamp()
 THEN RETURN none; END IF;
 answer:=official_v3_at_production_private.read_ch_v3(p_citizenship);
 IF answer->>'status' IS DISTINCT FROM 'accepted' OR NOT EXISTS(
  SELECT 1 FROM official_v3_at_production_private.ch_visa_facts_v3 f JOIN official_v3_at_production_private.ch_visa_facts_v3 approved
    ON approved.version_id=d.approved_fact_version
  WHERE f.version_id=(answer->>'ruleVersion')::bigint AND f.version_id>=approved.version_id
   AND f.source_operation_id=d.source_operation_id AND approved.source_operation_id=d.source_operation_id)
 THEN RETURN none; END IF;
 RETURN answer;
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN none;
END $public_read$;
REVOKE ALL ON FUNCTION official_v3_at_production_private.renew_ch_v3(text),
 official_v3_at_production_private.read_ch_v3(text),
 official_v3_at_production_private.read_published_ch_v3(text)
 FROM PUBLIC,anon,authenticated,service_role;
