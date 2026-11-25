-- UNAPPLIED commit candidate. Do not execute without a separate Production PO-Go.
-- Same digest rule as the probe. Never install a module from this directory alone.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.at_stage3_assembler='package';
-- UNAPPLIED Stage 3 body. No BEGIN/COMMIT. The probe and the commit candidate wrap it.
-- UNAPPLIED package body. Refuses to run unless the probe or commit
-- candidate set the assembler marker in the same transaction.
DO $stage3_assembler$
BEGIN
 IF current_setting('jetnity.at_stage3_assembler',true) IS DISTINCT FROM 'package'
 OR session_user<>'postgres' OR current_user<>session_user
 OR current_setting('server_version_num')::integer/10000<>17
 THEN RAISE EXCEPTION 'AT_STAGE3_MODULE_INSTALL_FORBIDDEN' USING ERRCODE='P7996'; END IF;
END $stage3_assembler$;
CREATE TEMP TABLE at_stage3_package_token(singleton boolean);
INSERT INTO at_stage3_package_token VALUES(true);
CREATE TEMP TABLE at_stage2_exact_predecessor(singleton boolean);
DO $stage3_gate$
DECLARE digest text;
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_v6') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR NOT pg_try_advisory_xact_lock(771112,35)
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'AT_STAGE3_V6_PARENT_REQUIRED' USING ERRCODE='P7996'; END IF;
 digest:=current_setting('jetnity.at_stage3_expected_v6_catalog_digest',true);
 IF digest IS NULL OR digest!~'^[a-f0-9]{64}$'
 OR digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
   FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton)
 THEN RAISE EXCEPTION 'AT_STAGE3_V6_CATALOG_DIGEST_REQUIRES_FRESH_READBACK' USING ERRCODE='P7996'; END IF;
 IF EXISTS(
  SELECT 1 FROM (VALUES
  ('official_v3_guard_private.catalog_status_v1()','aaf93dcd12350720cac4ce76e557043908760034d353851e9de6c6094bea3086'),
  ('official_v3_guard_private.assert_catalog_v1()','2a5d30c88d6e7bba45f00a3fa59d739b97ab171b70ec24fdfbc52fca54ad2908'),
  ('official_v3_guard_private.require_open_v1()','74e12b3cd6d766eb5b09af76e56e9b259e220add67f2dcffc149f31f23f4afe2'),
  ('public.official_v3_guard_alarm_status_v1()','d49e15f93b0720e79530bc8f793a5ebf6b965acfede7bd5d9100dff5674d7f9c'),
  ('jetnity_ot_auth.require_current_owner_session_v1()','ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b')
  ) AS expected(signature,body_sha)
  WHERE to_regprocedure(expected.signature) IS NULL
  OR (SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
      WHERE p.oid=to_regprocedure(expected.signature)) IS DISTINCT FROM expected.body_sha)
 THEN RAISE EXCEPTION 'AT_STAGE3_V6_PARENT_FUNCTION_DRIFT' USING ERRCODE='P7996'; END IF;
 IF to_regprocedure('official_v3_at_production_private.renew_ch_v1()') IS NULL
 OR (SELECT publisher_function_digest FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton)
    IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex')
 OR (SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1' AND active)
    IS DISTINCT FROM 'SELECT official_v3_at_production_private.renew_ch_v1()'
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1')<>1
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 THEN RAISE EXCEPTION 'AT_STAGE3_HISTORICAL_LANE_DRIFT' USING ERRCODE='P7996'; END IF;
END $stage3_gate$;
CREATE TEMP TABLE at_stage3_lane_snapshot AS
 SELECT jobname,md5(command) AS command_md5,command FROM cron.job
 WHERE jobname IN ('jetnity-at-production-source-collect-v1','jetnity-at-production-source-enqueue-v1',
  'jetnity-at-production-source-renew-v1','jetnity-at-production-source-qualified-renew-v2',
  'jetnity-ch-de-prod-import-v1','jetnity-official-truth-production-guard-v1');
CREATE TEMP TABLE at_stage3_count_snapshot AS
 SELECT
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2) AS qualifications_v2,
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2) AS originals_v2,
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3) AS qualifications_v3,
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3) AS originals_v3,
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3) AS owner_decisions,
  (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1) AS facts_v1,
  (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v2) AS facts_v2;

CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8(
 singleton boolean PRIMARY KEY CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 source_digest text NOT NULL CHECK(source_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8
 FROM PUBLIC,anon,authenticated,service_role;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_prod_ch_at_stage3_v8
 FOR ALL TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON
 official_v3_guard_private.bg1_prod_ch_at_stage3_v8 FOR EACH ROW
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON
 official_v3_guard_private.bg1_prod_ch_at_stage3_v8 FOR EACH STATEMENT
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1(
 hold_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 reason text NOT NULL CHECK(reason='append_only_withdrawal'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE official_v3_at_production_private.ch_stage3_renewal_hold_v1_hold_id_seq
 FROM PUBLIC,anon,authenticated,service_role;
CREATE POLICY postgres_only ON official_v3_at_production_private.ch_stage3_renewal_hold_v1
 FOR ALL TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON
 official_v3_at_production_private.ch_stage3_renewal_hold_v1 FOR EACH ROW
 EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON
 official_v3_at_production_private.ch_stage3_renewal_hold_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();

-- UNAPPLIED module for isolated Dev proof. NOT a Production installer.
-- Requires a later exact V6 -> append-only successor installer and separate PO Go.
-- No job change, no initial authorization, no initial fact, no publication.
DO $module$
BEGIN
 IF to_regclass('pg_temp.at_stage2_exact_predecessor') IS NULL
 THEN RAISE EXCEPTION 'AT_STAGE2_STANDALONE_INSTALL_FORBIDDEN' USING ERRCODE='P7996'; END IF;
END $module$;

-- One independently authorized renewal, bound to one real archived source batch.
-- The privileged release operator must record the separately obtained PO Go.
-- No application/cron writer for this ledger is introduced.
CREATE TABLE official_v3_at_production_private.ch_renewal_go_v3(
 authorization_id text PRIMARY KEY CHECK(authorization_id~'^atrenew3_[a-f0-9]{32}$'),
 source_operation_id text NOT NULL REFERENCES official_v3_at_production_private.ch_source_owner_decisions_v3(operation_id),
 batch_id bigint NOT NULL UNIQUE REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
 expected_predecessor bigint NOT NULL CHECK(expected_predecessor>=0),
 source_digest text NOT NULL CHECK(source_digest~'^[a-f0-9]{64}$'),
 method_epoch integer NOT NULL CHECK(method_epoch=2),
 authorized_at timestamptz NOT NULL,
 valid_until timestamptz NOT NULL CHECK(valid_until>authorized_at AND valid_until<=authorized_at+interval '10 minutes')
);
-- Separate V3 origin. Never put a V3 fact into the old V2-origin table.
CREATE TABLE official_v3_at_production_private.ch_visa_facts_v3(
 version_id bigint PRIMARY KEY CHECK(version_id BETWEEN 1 AND 2147483646),
 authorization_id text NOT NULL UNIQUE REFERENCES official_v3_at_production_private.ch_renewal_go_v3(authorization_id),
 source_operation_id text NOT NULL REFERENCES official_v3_at_production_private.ch_source_owner_decisions_v3(operation_id),
 source_batch_id bigint NOT NULL UNIQUE REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
 source_digest text NOT NULL CHECK(source_digest~'^[a-f0-9]{64}$'),
 method_epoch integer NOT NULL CHECK(method_epoch=2),
 source_checked_at timestamptz NOT NULL,
 verified_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 semantic_scope text NOT NULL DEFAULT 'CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'
   CHECK(semantic_scope='CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'),
 approved_origin text NOT NULL DEFAULT 'OWNER_MA1_REV2_AND_CH_AT_SOURCE_V3_AND_EXPLICIT_RENEWAL_GO'
   CHECK(approved_origin='OWNER_MA1_REV2_AND_CH_AT_SOURCE_V3_AND_EXPLICIT_RENEWAL_GO'),
 CHECK(source_checked_at<=verified_at AND verified_at<expires_at
   AND expires_at<=verified_at+interval '1 hour' AND expires_at<=source_checked_at+interval '70 minutes')
);
-- Separate publication/hold decision: even a successfully renewed private
-- fact is not readable through the public RPC while this ledger is empty.
CREATE TABLE official_v3_at_production_private.ch_visa_publication_v3(
 decision_seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 decision text NOT NULL CHECK(decision IN('release','hold')),
 source_operation_id text REFERENCES official_v3_at_production_private.ch_source_owner_decisions_v3(operation_id),
 approved_fact_version bigint REFERENCES official_v3_at_production_private.ch_visa_facts_v3(version_id),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK((decision='release' AND source_operation_id IS NOT NULL AND approved_fact_version IS NOT NULL)
    OR (decision='hold' AND source_operation_id IS NULL AND approved_fact_version IS NULL))
);
DO $acl$
DECLARE n text;
BEGIN
 FOREACH n IN ARRAY ARRAY['ch_renewal_go_v3','ch_visa_facts_v3','ch_visa_publication_v3'] LOOP
  EXECUTE format('ALTER TABLE official_v3_at_production_private.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('ALTER TABLE official_v3_at_production_private.%I FORCE ROW LEVEL SECURITY',n);
  EXECUTE format('REVOKE ALL ON TABLE official_v3_at_production_private.%I FROM PUBLIC,anon,authenticated,service_role',n);
  EXECUTE format('CREATE POLICY postgres_only ON official_v3_at_production_private.%I FOR ALL TO postgres USING(true) WITH CHECK(true)',n);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_production_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1()',n);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_at_production_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1()',n);
 END LOOP;
END $acl$;
REVOKE ALL ON SEQUENCE official_v3_at_production_private.ch_visa_publication_v3_decision_seq_seq FROM PUBLIC,anon,authenticated,service_role;

-- Reuse exactly the protected Stage1 V3 qualification, not V1/V2 flags
-- or a caller-supplied visa fact. Check the specific immutable Owner receipt.
CREATE FUNCTION official_v3_at_production_private.stage2_evidence_ch_v3(p_batch bigint,p_operation text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $evidence$
DECLARE instant_at timestamptz:=clock_timestamp(); n integer; checked timestamptz; digest text; links jsonb;
BEGIN
 IF p_batch IS NULL OR p_operation IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR official_v3_at_production_private.batch_qualified_ch_v3(p_batch) IS DISTINCT FROM true
 THEN RETURN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_source_owner_decisions_v3 d
   JOIN official_v3_at_production_private.ch_source_qualifications_v3 q ON q.source_id='bmeia-bern-how-to-apply'
   WHERE d.operation_id=p_operation AND d.decision='rule_neutral_ch_at_visa_only'
     AND d.semantic_scope='CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY' AND d.method_epoch=2
     AND d.decided_at<=instant_at AND d.initial_batch=q.original_batch AND d.initial_batch<=p_batch
     AND d.source_sha=q.original_sha AND d.source_bytes=q.original_bytes)
 THEN RETURN NULL; END IF;
 SELECT count(*),min(o.observed_at),
   encode(sha256(convert_to(string_agg(o.source_id||':'||o.body_sha,'|' ORDER BY o.source_id COLLATE "C"),'UTF8')),'hex')
 INTO n,checked,digest FROM official_v3_at_production_private.watch_observations_v1 o WHERE o.batch_id=p_batch;
 IF n<>3 OR checked IS NULL OR checked>instant_at OR checked<=instant_at-interval '70 minutes' OR digest IS NULL
 THEN RETURN NULL; END IF;
 SELECT jsonb_agg(official_url ORDER BY CASE source_id WHEN 'bmi-general-entry' THEN 1
  WHEN 'bmi-visa-nationality-matrix' THEN 2 WHEN 'bmeia-bern-how-to-apply' THEN 3 ELSE 4 END)
 INTO links FROM official_v3_at_production_private.ch_source_qualifications_v3;
 IF jsonb_array_length(links) IS DISTINCT FROM 3 THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('digest',digest,'checkedAt',checked,'sourceUrls',links);
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN NULL;
END $evidence$;

-- A semantic change cannot be silently erased by a later reverted original.
-- Transient HTTP failure blocks the current batch; a fresh complete batch may
-- be considered again, but real changed/missing HTTP200 custody requires review.
CREATE FUNCTION official_v3_at_production_private.stage2_history_ch_v3(p_batch bigint,p_operation text)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $history$
DECLARE initial_id bigint;
BEGIN
 SELECT initial_batch INTO initial_id FROM official_v3_at_production_private.ch_source_owner_decisions_v3 WHERE operation_id=p_operation;
 IF NOT FOUND OR p_batch<initial_id THEN RETURN false; END IF;
 RETURN NOT EXISTS(
  SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 o
  LEFT JOIN official_v3_at_production_private.ch_source_qualifications_v3 q USING(source_id)
  LEFT JOIN official_v3_at_production_private.ch_source_originals_v3 raw USING(source_id)
  LEFT JOIN official_v3_at_production_private.ch_source_http_receipts_v3 r ON r.batch_id=o.batch_id AND r.source_id=o.source_id
  LEFT JOIN official_v3_at_production_private.ch_source_http_bodies_v3 b ON b.source_id=r.source_id AND b.raw_sha=r.raw_sha
  WHERE o.batch_id>=initial_id AND o.batch_id<=p_batch AND o.http_status=200
  AND (q.source_id IS NOT NULL AND r.raw_sha=o.body_sha AND r.raw_bytes=o.bytes
    AND r.observed_at=o.observed_at AND r.state=o.source_status
    AND b.raw_sha=o.body_sha AND b.raw_bytes=o.bytes
    AND CASE WHEN o.source_id='bmeia-bern-how-to-apply'
     THEN official_v3_at_production_private.bmeia_theme_assets_v3(convert_from(raw.raw_body,'UTF8'),convert_from(b.raw_body,'UTF8'))
     ELSE o.body_sha=q.original_sha AND o.bytes=q.original_bytes END) IS DISTINCT FROM true
 );
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN false;
END $history$;

CREATE FUNCTION official_v3_at_production_private.stage2_method_ch_v3()
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $method$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE;
BEGIN
 SELECT * INTO h FROM official_v3_method_private.heads_v1 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.status IS DISTINCT FROM 'approved' OR h.revision IS DISTINCT FROM 2 OR h.epoch IS DISTINCT FROM 2
 OR h.method_digest IS DISTINCT FROM 'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
 OR h.package_digest IS DISTINCT FROM '6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0' THEN RETURN false; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',2,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',2);
 RETURN true;
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN false;
END $method$;

-- Candidate successor of the existing renewal path. Explicit private call only.
-- The old cron command and old publisher digest are NOT changed by this module.
CREATE FUNCTION official_v3_at_production_private.renew_ch_v3(p_authorization text)
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog SET lock_timeout='2s'
AS $renew$
DECLARE a official_v3_at_production_private.ch_renewal_go_v3%ROWTYPE; previous bigint; evidence jsonb;
 instant_at timestamptz; checked timestamptz; until_at timestamptz;
BEGIN
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

-- Private readback, not a public grant. There is no fallback to V1/V2.
CREATE FUNCTION official_v3_at_production_private.read_ch_v3(p_citizenship text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $read$
DECLARE none jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 f official_v3_at_production_private.ch_visa_facts_v3%ROWTYPE; evidence jsonb; instant_at timestamptz:=clock_timestamp();
BEGIN
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

-- Independent DB publication decision also protects direct calls to the
-- existing public RPC. A Vercel flag alone cannot revoke a database grant.
CREATE FUNCTION official_v3_at_production_private.read_published_ch_v3(p_citizenship text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $public_read$
DECLARE none jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 d official_v3_at_production_private.ch_visa_publication_v3%ROWTYPE; answer jsonb;
BEGIN
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
REVOKE ALL ON FUNCTION official_v3_at_production_private.stage2_evidence_ch_v3(bigint,text),
 official_v3_at_production_private.stage2_history_ch_v3(bigint,text),official_v3_at_production_private.stage2_method_ch_v3(),
 official_v3_at_production_private.renew_ch_v3(text),official_v3_at_production_private.read_ch_v3(text),
 official_v3_at_production_private.read_published_ch_v3(text) FROM PUBLIC,anon,authenticated,service_role;
-- UNAPPLIED; only assemble with the future exact BG1 successor and separate Production install Go.
-- Preserve the existing RPC signature and ACL. No public new function or grant.
-- The publication ledger starts empty; the wrapper then returns unavailable.
DO $wrapper_predecessor$
BEGIN
 IF to_regclass('pg_temp.at_stage2_exact_predecessor') IS NULL
 OR to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NULL
 THEN RAISE EXCEPTION 'AT_STAGE2_EXISTING_RPC_REQUIRED' USING ERRCODE='P7996'; END IF;
END $wrapper_predecessor$;
CREATE OR REPLACE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $visitor$
BEGIN
 IF p_citizenship_country_code IS DISTINCT FROM 'CH' THEN
  RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 END IF;
 RETURN official_v3_at_production_private.read_published_ch_v3(p_citizenship_country_code);
EXCEPTION WHEN query_canceled OR OTHERS THEN
 RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
END $visitor$;
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
-- Append-only guard extension. catalog_status_v1() stays the exact V6 body.
-- Historical digest pins, renew_ch_v1, the HTTP allocator and every earlier
-- lane predicate stay in assert_catalog_v1. V7 remains absent.
DO $stage3_guard_part$
BEGIN
 IF current_setting('jetnity.at_stage3_assembler',true) IS DISTINCT FROM 'package'
 THEN RAISE EXCEPTION 'AT_STAGE3_MODULE_INSTALL_FORBIDDEN' USING ERRCODE='P7996'; END IF;
END $stage3_guard_part$;
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE at_source_v6 official_v3_guard_private.bg1_prod_ch_at_source_v6%ROWTYPE;
 ch_at_v5 official_v3_guard_private.bg1_prod_ch_at_qualified_v5%ROWTYPE;
 allocator_v4 official_v3_guard_private.bg1_production_http_allocator_v4%ROWTYPE;
 optimized official_v3_guard_private.query_cost_baseline_v1%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 official_v3_guard_private.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
  stage3_v8 official_v3_guard_private.bg1_prod_ch_at_stage3_v8%ROWTYPE;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT at_source_v6 FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton;
  SELECT * INTO STRICT stage3_v8 FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 WHERE singleton;
  SELECT * INTO STRICT ch_at_v5 FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 WHERE singleton;
  SELECT * INTO STRICT allocator_v4 FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton;
  SELECT * INTO STRICT optimized FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
  SELECT * INTO STRICT weather FROM official_v3_guard_private.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM official_v3_guard_private.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM official_v3_guard_private.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM official_v3_guard_private.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR admin.predecessor_provider_digest<>'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a'
    OR admin.definition_digest<>'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR offers.migration_blob IS DISTINCT FROM '667766f5455ff2460f4eb56f04c7a62c84ca9e05'
    OR offers.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR offers.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR weather.candidate_sha256 IS DISTINCT FROM '9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae'
    OR weather.predecessor_sha256 IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(offers)||jsonb_build_object('proof_not_before',extract(epoch FROM offers.proof_not_before)))::text,'UTF8')),'hex')
    OR at_prod.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(weather.catalog::text,'UTF8')),'hex')
    OR at_prod.predecessor_weather_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(weather)||jsonb_build_object('proof_not_before',extract(epoch FROM weather.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.predecessor_catalog_digest IS DISTINCT FROM
      encode(sha256(convert_to(at_prod.catalog::text,'UTF8')),'hex')
    OR switch_v2.predecessor_baseline_digest IS DISTINCT FROM
      encode(sha256(convert_to((to_jsonb(at_prod)||jsonb_build_object(
        'proof_not_before',extract(epoch FROM at_prod.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.required_generation<=at_prod.required_generation
    OR switch_v2.proof_not_before<at_prod.proof_not_before
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(switch_v2.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(switch_v2)||jsonb_build_object('proof_not_before',extract(epoch FROM switch_v2.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=switch_v2.required_generation OR bg1_v3.proof_not_before<=switch_v2.proof_not_before
 OR optimized.algorithm IS DISTINCT FROM 'jsonb_unique_narrow_dependency_distinct_v1'
 OR optimized.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR optimized.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)
   ||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to(to_jsonb(optimized)::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
 OR allocator_v4.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.transport_metadata::text,'UTF8')),'hex')
 OR allocator_v4.transport_metadata IS DISTINCT FROM (allocator_v4.catalog->'transport:production_http_id_allocator_v4')
 OR ch_at_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.catalog::text,'UTF8')),'hex')
 OR ch_at_v5.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(allocator_v4)
       ||jsonb_build_object('proof_not_before',extract(epoch FROM allocator_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR ch_at_v5.required_generation<=allocator_v4.required_generation
 OR ch_at_v5.proof_not_before<=allocator_v4.proof_not_before
 OR ch_at_v5.qualified_source_digest IS DISTINCT FROM (
    SELECT encode(sha256(convert_to(string_agg(source_id||':'||accepted_sha||':'||accepted_bytes::text||':'||
      expected_watch_state,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM official_v3_at_production_private.ch_source_qualifications_v2)
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR at_source_v6.predecessor_catalog_digest IS DISTINCT FROM
   encode(sha256(convert_to(ch_at_v5.catalog::text,'UTF8')),'hex')
 OR at_source_v6.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(ch_at_v5)||
       jsonb_build_object('proof_not_before',extract(epoch FROM ch_at_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR at_source_v6.source_digest IS DISTINCT FROM
    (SELECT encode(sha256(convert_to(string_agg(source_id||':'||original_sha||':'||
       original_bytes::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
     FROM official_v3_at_production_private.ch_source_qualifications_v3)
 OR at_source_v6.required_generation<=ch_at_v5.required_generation
 OR at_source_v6.proof_not_before<=ch_at_v5.proof_not_before
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 OR stage3_v8.predecessor_catalog_digest IS DISTINCT FROM
   encode(sha256(convert_to(at_source_v6.catalog::text,'UTF8')),'hex')
 OR stage3_v8.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(at_source_v6)||
       jsonb_build_object('proof_not_before',extract(epoch FROM at_source_v6.proof_not_before)))::text,'UTF8')),'hex')
 OR stage3_v8.required_generation<=at_source_v6.required_generation
 OR stage3_v8.proof_not_before<=at_source_v6.proof_not_before
 OR stage3_v8.source_digest IS DISTINCT FROM at_source_v6.source_digest
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR stage3_v8.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$
;
CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 v WHERE v.singleton;
  IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$
;
CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN RETURN unavailable_value; END IF;
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 v WHERE v.singleton;
  IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
  OR current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $function$
;
CREATE FUNCTION official_v3_guard_private.stage3_parent_binding_v1()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $function$
DECLARE v6 official_v3_guard_private.bg1_prod_ch_at_source_v6%ROWTYPE;
 v8 official_v3_guard_private.bg1_prod_ch_at_stage3_v8%ROWTYPE;
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL THEN
  RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
 SELECT * INTO STRICT v6 FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton;
 SELECT * INTO STRICT v8 FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 WHERE singleton;
 IF v8.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(v6.catalog::text,'UTF8')),'hex')
 OR v8.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(v6)||
   jsonb_build_object('proof_not_before',extract(epoch FROM v6.proof_not_before)))::text,'UTF8')),'hex')
 OR v8.required_generation<=v6.required_generation
 OR v8.proof_not_before<=v6.proof_not_before
 OR v8.source_digest IS DISTINCT FROM v6.source_digest
 OR v8.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
 OR (SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
     WHERE p.oid=to_regprocedure('official_v3_guard_private.catalog_status_v1()'))
    IS DISTINCT FROM 'aaf93dcd12350720cac4ce76e557043908760034d353851e9de6c6094bea3086'
 OR encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex')
    IS DISTINCT FROM (SELECT publisher_function_digest FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton)
 THEN RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END
$function$;
REVOKE ALL ON FUNCTION official_v3_guard_private.stage3_parent_binding_v1()
 FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO official_v3_guard_private.bg1_prod_ch_at_stage3_v8(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,
 source_digest,required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(v6.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v6)||
  jsonb_build_object('proof_not_before',extract(epoch FROM v6.proof_not_before)))::text,'UTF8')),'hex'),
 v6.source_digest,s.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v6
CROSS JOIN official_v3_guard_private.state_v1 s
WHERE v6.singleton AND s.singleton;
DO $stage3_close$
DECLARE before_row at_stage3_count_snapshot%ROWTYPE;
BEGIN
 PERFORM official_v3_guard_private.stage3_parent_binding_v1();
 SELECT * INTO STRICT before_row FROM at_stage3_count_snapshot;
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8)<>1
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_publication_v3)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v3)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>before_row.qualifications_v2
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)<>before_row.originals_v2
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>before_row.qualifications_v3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>before_row.originals_v3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3)<>before_row.owner_decisions
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1)<>before_row.facts_v1
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v2)<>before_row.facts_v2
 OR EXISTS(SELECT 1 FROM cron.job j JOIN at_stage3_lane_snapshot s USING(jobname)
   WHERE j.command IS DISTINCT FROM s.command)
 OR (SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1')
    IS DISTINCT FROM 'SELECT official_v3_at_production_private.renew_ch_v1()'
 OR EXISTS(SELECT 1 FROM cron.job WHERE command LIKE '%renew_ch_v3%')
 OR (SELECT proparallel FROM pg_proc WHERE oid=to_regprocedure('official_v3_at_production_private.renew_ch_v1()'))<>'u'
 OR (SELECT proparallel FROM pg_proc WHERE oid=to_regprocedure('official_v3_guard_private.assert_catalog_v1()'))<>'u'
 THEN RAISE EXCEPTION 'AT_STAGE3_LANE_OR_PUBLICATION_DRIFT' USING ERRCODE='P7996'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'AT_STAGE3_PREMATURE_GUARD_OPEN' USING ERRCODE='P7996';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL;
 END;
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 THEN RAISE EXCEPTION 'AT_STAGE3_ALARM_STILL_CURRENT_BEFORE_NATURAL_PROOF' USING ERRCODE='P7996'; END IF;
END $stage3_close$;
-- Historical production catalog chain. A synthetic database must fail closed
-- here; that refusal is not a positive Production catalog proof.
DO $stage3_historical_chain$
BEGIN
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $stage3_historical_chain$;
COMMIT;
