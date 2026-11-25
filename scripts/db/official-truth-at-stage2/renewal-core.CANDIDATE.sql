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
