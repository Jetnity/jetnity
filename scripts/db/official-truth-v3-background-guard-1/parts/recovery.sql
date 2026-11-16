SET LOCAL jetnity.bg1_recovery_target='dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY2';
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';

/* RECOVERY_CONTEXT */

CREATE TEMP TABLE bg1_recovery_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $recovery_predecessor$
DECLARE expected record; actual record; before_catalog jsonb; table_name text; row_count bigint; row_digest text; owner_name text;
BEGIN
  IF to_regclass('official_v3_guard_private.recovery_baseline_v1') IS NOT NULL
    OR to_regclass('official_v3_guard_private.retired_later_attempts_v1') IS NOT NULL
    OR to_regprocedure('official_v3_guard_private.recovery_canonical_v1(jsonb,integer)') IS NOT NULL THEN
    RAISE EXCEPTION 'bg1 recovery exact unused successor required' USING ERRCODE='P7901'; END IF;
  FOR expected IN SELECT * FROM (VALUES
    /* PREDECESSOR_FUNCTIONS */
  ) f(signature,body_hash) LOOP
    SELECT * INTO actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.body_hash THEN
      RAISE EXCEPTION 'bg1 recovery predecessor definition mismatch' USING ERRCODE='P7901'; END IF;
  END LOOP;
  SELECT (/* STATUS_CATALOG_QUERY */) INTO before_catalog;
  IF before_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.status_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'bg1 recovery predecessor catalog mismatch' USING ERRCODE='P7905'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  INSERT INTO pg_temp.bg1_recovery_before VALUES('catalog',before_catalog),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('schema_acl',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')),
    ('content',jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
      's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
      'hrs',official_v3_guard_private.hrs_certificate_v1()));
  -- The installed, independently checked catalog binds the actual bootstrap
  -- grantor and original OIDs. Never edit or delete those ADMIN-only rows.
  FOREACH owner_name IN ARRAY ARRAY['ot_v3_jobs_owner','ot_v3_result_owner'] LOOP
    IF (SELECT count(*) FROM pg_auth_members WHERE roleid=to_regrole(owner_name) AND member='postgres'::regrole)<>1
      OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid=to_regrole(owner_name) AND member='postgres'::regrole
        AND grantor<>'postgres'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
      OR pg_has_role('postgres',to_regrole(owner_name),'USAGE') IS DISTINCT FROM false
      OR pg_has_role('postgres',to_regrole(owner_name),'SET') IS DISTINCT FROM false
      OR has_schema_privilege(to_regrole(owner_name),'official_v3_guard_private','CREATE') IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'bg1 recovery exact original owner authority required' USING ERRCODE='P7901'; END IF;
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY[
    'official_v3_method_private.revisions_v1','official_v3_method_private.heads_v1','official_v3_method_private.operations_v1',
    'official_v3_intake_private.operations_v1','official_v3_intake_private.reservations_v1','official_v3_intake_private.completions_v1',
    'official_v3_jobs_private.slots_v1','official_v3_jobs_private.subjects_v1','official_v3_jobs_private.queue_operations_v1',
    'official_v3_jobs_private.execution_starts_v1','official_v3_jobs_private.execution_results_v1','official_v3_jobs_private.execution_dispositions_v1','official_v3_jobs_private.catalog_binding_v1',
    'official_v3_result_private.binding_v1','official_v3_result_private.originals_v1','official_v3_result_private.extractions_v1','official_v3_result_private.qualifications_v1',
    'official_v3_result_private.decisions_v1','official_v3_result_private.archive_pages_v1','official_v3_result_private.versions_v1','official_v3_result_private.projections_v1',
    'official_v3_result_private.heads_v1','official_v3_result_private.operations_v1','official_v3_result_private.outbox_v1','official_v3_result_private.monitor_schedule_v1',
    'official_v3_guard_private.baselines_v1','official_v3_guard_private.certificates_v1','official_v3_guard_private.certificate_history_v1',
    'official_v3_guard_private.state_v1','official_v3_guard_private.runs_v1','official_v3_guard_private.incidents_v1',
    'official_v3_guard_private.owner_operations_v1','official_v3_guard_private.retired_attempts_v1','official_v3_guard_private.status_baseline_v1'
  ] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    INSERT INTO pg_temp.bg1_recovery_before VALUES('table:'||table_name,jsonb_build_object('count',row_count,'digest',row_digest));
  END LOOP;
END $recovery_predecessor$;

-- PO-authorized, transaction-local elevation of two EXISTING owners. These
-- separate postgres-grantor edges did not exist at preflight. Original grantor
-- rows, their OIDs/options and the Intake owner remain completely untouched.
GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT ot_v3_result_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT CREATE ON SCHEMA official_v3_guard_private TO ot_v3_jobs_owner,ot_v3_result_owner;

CREATE TABLE official_v3_guard_private.retired_later_attempts_v1 (
  attempt_key text PRIMARY KEY CHECK (attempt_key ~ '^execution-attempt:v3:[a-f0-9]{64}$'),
  job_key text NOT NULL,
  attempt_number integer NOT NULL CHECK (attempt_number BETWEEN 2 AND 4),
  claim_operation_id text NOT NULL UNIQUE,
  intake_operation_id text NOT NULL UNIQUE,
  owner_operation_id text NOT NULL UNIQUE REFERENCES official_v3_guard_private.owner_operations_v1(operation_id),
  before_state jsonb NOT NULL CHECK (octet_length(before_state::text)<=131072),
  retired_at timestamptz NOT NULL CHECK (isfinite(retired_at)),
  UNIQUE(job_key,attempt_number)
);
CREATE TABLE official_v3_guard_private.recovery_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  bg1_provider_digest text NOT NULL CHECK (bg1_provider_digest='BG1_PROVIDER_SHA256'),
  status_provider_digest text NOT NULL CHECK (status_provider_digest='STATUS_PROVIDER_SHA256'),
  predecessor_catalog_digest text NOT NULL CHECK (predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_baselines_digest text NOT NULL CHECK (predecessor_baselines_digest ~ '^[a-f0-9]{64}$'),
  predecessor_status_digest text NOT NULL CHECK (predecessor_status_digest ~ '^[a-f0-9]{64}$'),
  required_generation bigint NOT NULL CHECK (required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK (isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
DO $recovery_tables$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['retired_later_attempts_v1','recovery_baseline_v1'] LOOP
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I FORCE ROW LEVEL SECURITY',table_name);
    EXECUTE format('CREATE POLICY owner_only ON official_v3_guard_private.%I TO postgres USING (true) WITH CHECK (true)',table_name);
    EXECUTE format('CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',table_name);
    EXECUTE format('CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',table_name);
    EXECUTE format('REVOKE ALL ON TABLE official_v3_guard_private.%I FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner',table_name);
  END LOOP;
END $recovery_tables$;

-- Pure canonical data calculation, bound to the installed HRS algorithm. It
-- reads no table and grants no authority or EXECUTE to another role.
CREATE FUNCTION official_v3_guard_private.recovery_canonical_v1(v jsonb,d integer) RETURNS text
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $canonical$
/* RECOVERY_CANONICAL_BODY */
$canonical$;
REVOKE ALL ON FUNCTION official_v3_guard_private.recovery_canonical_v1(jsonb,integer) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_jobs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  c official_v3_jobs_private.queue_operations_v1%ROWTYPE; prior record; held jsonb; preceding jsonb:='[]';
  n integer; expected integer:=1; fence jsonb; seed text; input_revision text;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1
    WHERE kind='rule_research' AND current_job->>'contextKey'='official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2' FOR UPDATE;
  IF s.current_job->'attempt'='1'::jsonb THEN
    /* LEGACY_JOBS_BODY */
  END IF;
  PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
  SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt FOR SHARE;
  SELECT * INTO STRICT c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=t.claim_operation_id FOR SHARE;
  n:=(s.current_job->>'attempt')::integer;
  IF (n BETWEEN 2 AND 4) IS NOT TRUE OR s.start_count<>n OR s.current_job IS DISTINCT FROM t.leased_job
    OR s.current_job->>'state'<>'leased' OR s.current_job->'attemptLimit'<>'4'::jsonb
    OR s.current_job#>>'{research,factKind}' IS DISTINCT FROM 'requirement_effect'
    OR s.current_job#>'{research,researchReason}' IS DISTINCT FROM '{"status":"missing"}'::jsonb
    OR s.job_key IS DISTINCT FROM (official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
      'context',s.current_job->'context','method',s.current_job->'method','factKind','requirement_effect','researchReason',jsonb_build_object('status','missing')))->>'jobKey')
    OR s.terminal_credit_claim IS DISTINCT FROM t.claim_operation_id
    OR s.method_binding IS DISTINCT FROM jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1,
      'methodDigest','44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3','packageDigest','0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9')
    OR t.authority IS DISTINCT FROM s.method_binding||jsonb_build_object('epoch',1)
    OR c.action<>'claim' OR c.envelope_text::jsonb->'next' IS DISTINCT FROM t.leased_job
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
    OR clock_timestamp()<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz THEN
    RAISE EXCEPTION 'bg1 exact expired later attempt required' USING ERRCODE='P7906'; END IF;
  FOR prior IN SELECT * FROM official_v3_jobs_private.execution_starts_v1 WHERE job_key=s.job_key AND attempt_key<>t.attempt_key
    ORDER BY (leased_job->>'attempt')::integer LOOP
    held:=official_v3_guard_private.retired_state_v1(prior.attempt_key);
    IF held IS NULL OR (prior.leased_job->>'attempt')::integer<>expected OR expected>=n
      OR held->>'kind' IS DISTINCT FROM (CASE WHEN expected=1 THEN 'ch_de_first_unknown' ELSE 'ch_de_later_unknown' END)
      OR held#>'{job,leasedJob}' IS DISTINCT FROM prior.leased_job OR held#>>'{job,jobKey}' IS DISTINCT FROM s.job_key
      OR prior.leased_job->'jobId' IS DISTINCT FROM t.leased_job->'jobId'
      OR prior.authority IS DISTINCT FROM t.authority
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=prior.attempt_key)
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=prior.attempt_key) THEN
      RAISE EXCEPTION 'bg1 genuine preceding retirement required' USING ERRCODE='P7906'; END IF;
    preceding:=preceding||jsonb_build_array(jsonb_build_object('attemptKey',prior.attempt_key,'attempt',expected,
      'snapshotDigest',encode(sha256(convert_to(held::text,'UTF8')),'hex'),
      'intakeOperationId',held#>'{job,intakeOperationId}','proposalDigest',held#>'{intake,proposal_digest}'));
    expected:=expected+1;
  END LOOP;
  IF expected<>n THEN RAISE EXCEPTION 'bg1 complete preceding retirement chain required' USING ERRCODE='P7906'; END IF;
  fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision',
    'leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
  input_revision:='snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9';
  seed:=official_v3_jobs_private.canonical_v1(jsonb_build_object('producerRevision',1,'inputRevision',input_revision,'job',t.leased_job,'fence',fence),0);
  RETURN jsonb_build_object('attemptKey',t.attempt_key,'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,
    'claim',t.claim_text::jsonb,'leasedJob',t.leased_job,'authority',t.authority,'fence',fence,
    'intakeOperationId','op3_'||substr(encode(sha256(convert_to('operation:'||seed,'UTF8')),'hex'),1,32),
    'deliveryId','delivery3_'||substr(encode(sha256(convert_to('delivery:'||seed,'UTF8')),'hex'),1,32),
    'runnerId','runner3_'||substr(encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
      'kind','aa_bern_ch_de_untrusted_delivery','producerRevision',1,'inputRevision',input_revision),0),'UTF8')),'hex'),1,32),
    'inputRevision',input_revision,'startCount',s.start_count,'operationCount',s.operation_count,'preceding',preceding);
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.close_jobs_v1(attempt_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE evidence jsonb; count_value bigint;
BEGIN
  PERFORM official_v3_guard_private.owner_session_v1();
  evidence:=official_v3_guard_private.retired_state_v1(attempt_value);
  IF evidence IS NULL OR evidence#>>'{job,attemptKey}' IS DISTINCT FROM attempt_value THEN
    RAISE EXCEPTION 'bg1 immutable retirement required' USING ERRCODE='P7906'; END IF;
  IF evidence->>'kind'='ch_de_first_unknown' THEN
    UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL
      WHERE job_key=evidence#>>'{job,jobKey}' AND open_attempt=attempt_value
        AND current_job=evidence#>'{job,leasedJob}' AND start_count=1 AND operation_count=2;
  ELSIF evidence->>'kind'='ch_de_later_unknown' THEN
    PERFORM official_v3_guard_private.begin_jobs_v1();
    UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL
      WHERE job_key=evidence#>>'{job,jobKey}' AND open_attempt=attempt_value
        AND current_job=evidence#>'{job,leasedJob}' AND terminal_credit_claim=evidence#>>'{job,claimOperationId}'
        AND start_count=(evidence#>>'{job,startCount}')::integer AND operation_count=(evidence#>>'{job,operationCount}')::integer
        AND start_count BETWEEN 2 AND 4 AND current_job->'attemptLimit'='4'::jsonb;
  ELSE RAISE EXCEPTION 'bg1 fixed retirement kind required' USING ERRCODE='P7906'; END IF;
  GET DIAGNOSTICS count_value=ROW_COUNT;
  IF count_value<>1 THEN RAISE EXCEPTION 'bg1 retirement compare failed' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.seal_jobs_v1();
  IF evidence->>'kind'='ch_de_later_unknown' THEN PERFORM official_v3_guard_private.begin_jobs_v1(); END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
END $$;
RESET ROLE;

SET LOCAL ROLE ot_v3_result_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_hrs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; certificate text; q record; inventory jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(771105,2);
  SELECT * INTO STRICT h FROM official_v3_result_private.heads_v1 WHERE singleton FOR UPDATE;
  PERFORM official_v3_guard_private.check_hrs_v1();
  IF h.context_key<>'official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    OR h.version_ref IS NOT NULL OR h.decision_ref IS NOT NULL OR h.projection_ref IS NOT NULL
    OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.decisions_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.outbox_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1 WHERE operation_kind IN ('version','publication','escalation')) THEN
    RAISE EXCEPTION 'bg1 uncommitted initial result required' USING ERRCODE='P7906'; END IF;
  FOR q IN SELECT * FROM official_v3_result_private.qualifications_v1 WHERE kind='verification' LOOP
    PERFORM official_v3_result_private.verification_v1(q.record,official_v3_result_private.selected_binding_v1(),false);
  END LOOP;
  SELECT jsonb_build_object(
    'originals',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',o.version_id,'digest',encode(sha256(convert_to(to_jsonb(o)::text,'UTF8')),'hex')) ORDER BY o.version_id COLLATE "C") FROM official_v3_result_private.originals_v1 o),'[]'::jsonb),
    'extractions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',e.version_id,'digest',encode(sha256(convert_to(to_jsonb(e)::text,'UTF8')),'hex')) ORDER BY e.version_id COLLATE "C") FROM official_v3_result_private.extractions_v1 e),'[]'::jsonb),
    'qualifications',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',q2.reference,'kind',q2.kind,'decisionRef',q2.decision_ref,'originalIds',q2.original_ids,
      'digest',encode(sha256(convert_to((to_jsonb(q2)||jsonb_build_object('valid_until',extract(epoch FROM q2.valid_until)))::text,'UTF8')),'hex')) ORDER BY q2.reference COLLATE "C") FROM official_v3_result_private.qualifications_v1 q2),'[]'::jsonb)) INTO inventory;
  SELECT state_certificate INTO certificate FROM official_v3_result_private.binding_v1 WHERE singleton;
  RETURN jsonb_build_object('head',to_jsonb(h),'certificate',certificate,
    'originals',jsonb_array_length(inventory->'originals'),'qualifications',jsonb_array_length(inventory->'qualifications'),
    'versions',0,'publications',0,'inventory',inventory);
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retired_hrs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE entry jsonb; actual text;
BEGIN
  /* LEGACY_RETIRED_HRS_BODY */
  IF evidence->>'kind'='ch_de_later_unknown' THEN
    IF jsonb_typeof(evidence#>'{result,inventory}') IS DISTINCT FROM 'object'
      OR jsonb_typeof(evidence#>'{result,inventory,originals}') IS DISTINCT FROM 'array'
      OR jsonb_typeof(evidence#>'{result,inventory,extractions}') IS DISTINCT FROM 'array'
      OR jsonb_typeof(evidence#>'{result,inventory,qualifications}') IS DISTINCT FROM 'array'
      OR evidence#>'{result,originals}' IS DISTINCT FROM to_jsonb(jsonb_array_length(evidence#>'{result,inventory,originals}'))
      OR evidence#>'{result,qualifications}' IS DISTINCT FROM to_jsonb(jsonb_array_length(evidence#>'{result,inventory,qualifications}')) THEN
      RAISE EXCEPTION 'bg1 complete retained source inventory required' USING ERRCODE='P7906'; END IF;
    -- Compare retained entries, not the future whole-store count/fingerprint:
    -- later legitimate originals, qualifications and publications may append.
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,originals}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(o)::text,'UTF8')),'hex') INTO actual
        FROM official_v3_result_private.originals_v1 o WHERE o.version_id=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN RAISE EXCEPTION 'bg1 retained original changed' USING ERRCODE='P7906'; END IF;
    END LOOP;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,extractions}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(e)::text,'UTF8')),'hex') INTO actual
        FROM official_v3_result_private.extractions_v1 e WHERE e.version_id=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN RAISE EXCEPTION 'bg1 retained extraction changed' USING ERRCODE='P7906'; END IF;
    END LOOP;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,qualifications}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(q)||jsonb_build_object('valid_until',extract(epoch FROM q.valid_until)))::text,'UTF8')),'hex') INTO actual
        FROM official_v3_result_private.qualifications_v1 q WHERE q.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN RAISE EXCEPTION 'bg1 retained qualification changed' USING ERRCODE='P7906'; END IF;
    END LOOP;
  END IF;
END $$;
RESET ROLE;

CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_snapshot_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; s jsonb; h jsonb; result_value jsonb; q jsonb; p jsonb; allowed_decisions jsonb:='[]'; expected_ref text; n integer;
BEGIN
  PERFORM official_v3_guard_private.fixed_method_v1();
  j:=official_v3_guard_private.recovery_jobs_v1();
  n:=(j#>>'{leasedJob,attempt}')::integer;
  IF n>1 THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;
  s:=official_v3_guard_private.recovery_intake_v1(j);
  h:=official_v3_guard_private.recovery_hrs_v1();
  IF clock_timestamp()<=(j#>>'{leasedJob,lease,expiresAt}')::timestamptz OR clock_timestamp()<=(s->>'expires_at')::timestamptz THEN
    RAISE EXCEPTION 'bg1 expired custody required' USING ERRCODE='P7906'; END IF;
  IF n=1 THEN
    IF h->'originals'<>'2'::jsonb OR h->'qualifications'<>'1'::jsonb
      OR h#>>'{inventory,qualifications,0,kind}' IS DISTINCT FROM 'verification'
      OR jsonb_array_length(h#>'{inventory,qualifications,0,originalIds}')<>2
      OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(h#>'{inventory,qualifications,0,originalIds}'))<>2
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(h#>'{inventory,originals}') o
        WHERE NOT ((h#>'{inventory,qualifications,0,originalIds}') ? (o->>'id'))) THEN
      RAISE EXCEPTION 'bg1 exact first source qualification required' USING ERRCODE='P7906'; END IF;
    RETURN jsonb_build_object('schema',1,'kind','ch_de_first_unknown','job',j,'intake',s,'result',h-'inventory');
  END IF;
  FOR p IN SELECT value FROM jsonb_array_elements((j->'preceding')||jsonb_build_array(jsonb_build_object(
    'intakeOperationId',j->'intakeOperationId','proposalDigest',s->'proposal_digest'))) LOOP
    expected_ref:='source-decision:v3:'||encode(sha256(convert_to(official_v3_guard_private.recovery_canonical_v1(jsonb_build_object(
      'operationId',p->'intakeOperationId','proposalDigest',p->'proposalDigest','contextKey',j#>'{leasedJob,contextKey}',
      'method',j#>'{leasedJob,method}','predecessor',NULL),0),'UTF8')),'hex');
    allowed_decisions:=allowed_decisions||jsonb_build_array(expected_ref);
  END LOOP;
  FOR q IN SELECT value FROM jsonb_array_elements(h#>'{inventory,qualifications}') LOOP
    IF q->>'kind'='verification' AND NOT (allowed_decisions ? (q->>'decisionRef')) THEN
      RAISE EXCEPTION 'bg1 actual intake source binding required' USING ERRCODE='P7906'; END IF;
  END LOOP;
  result_value:=jsonb_build_object('schema',1,'kind','ch_de_later_unknown','job',j,'intake',s,'result',h);
  IF octet_length(result_value::text)>131072 THEN RAISE EXCEPTION 'bg1 bounded recovery snapshot required' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.require_open_v1();
  RETURN result_value;
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.intake_retired_v1(operation_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE intake_operation_id=operation_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1 WHERE intake_operation_id=operation_value)
$$;
CREATE OR REPLACE FUNCTION official_v3_guard_private.attempt_retired_v1(attempt_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1 WHERE attempt_key=attempt_value)
$$;
CREATE OR REPLACE FUNCTION official_v3_guard_private.retired_state_v1(attempt_value text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT before_state FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value
UNION ALL SELECT before_state FROM official_v3_guard_private.retired_later_attempts_v1 WHERE attempt_key=attempt_value
$$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retirements_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE retired record; original official_v3_guard_private.retired_attempts_v1%ROWTYPE;
  op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb; p jsonb; held jsonb; expected integer; current_number integer:=2;
BEGIN
  /* LEGACY_RETIREMENTS_BODY */
  IF (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)>3 THEN
    RAISE EXCEPTION 'bg1 bounded later recovery scope' USING ERRCODE='P7906'; END IF;
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_later_attempts_v1 ORDER BY attempt_number LOOP
    SELECT * INTO STRICT original FROM official_v3_guard_private.retired_attempts_v1;
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    IF retired.attempt_number<>current_number OR retired.attempt_number NOT BETWEEN 2 AND 4
      OR retired.before_state->'schema' IS DISTINCT FROM '1'::jsonb
      OR retired.before_state->>'kind' IS DISTINCT FROM 'ch_de_later_unknown'
      OR op.action<>'retire_unknown' OR op.receipt->>'result' IS DISTINCT FROM 'unknown_retired'
      OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retired.before_state::text,'UTF8')),'hex')
      OR op.receipt->>'operationId' IS DISTINCT FROM op.operation_id OR op.receipt->>'selection' IS DISTINCT FROM op.expected_digest
      OR op.receipt IS DISTINCT FROM jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
        'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
        'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      OR retired.attempt_key IS DISTINCT FROM j->>'attemptKey' OR retired.intake_operation_id IS DISTINCT FROM j->>'intakeOperationId'
      OR retired.claim_operation_id IS DISTINCT FROM j->>'claimOperationId' OR retired.job_key IS DISTINCT FROM j->>'jobKey'
      OR retired.job_key IS DISTINCT FROM original.job_key OR retired.retired_at IS DISTINCT FROM op.recorded_at
      OR j#>'{leasedJob,jobId}' IS DISTINCT FROM original.before_state#>'{job,leasedJob,jobId}'
      OR j#>>'{leasedJob,attempt}' IS DISTINCT FROM retired.attempt_number::text
      OR j->>'startCount' IS DISTINCT FROM retired.attempt_number::text OR j#>'{leasedJob,attemptLimit}' IS DISTINCT FROM '4'::jsonb
      OR jsonb_typeof(j->'preceding') IS DISTINCT FROM 'array'
      OR jsonb_array_length(j->'preceding') IS DISTINCT FROM retired.attempt_number-1
      OR (j#>>'{leasedJob,lease,expiresAt}')::timestamptz>=retired.retired_at
      OR (retired.before_state#>>'{intake,expires_at}')::timestamptz>=retired.retired_at THEN
      RAISE EXCEPTION 'bg1 later retirement receipt binding' USING ERRCODE='P7906'; END IF;
    expected:=1;
    FOR p IN SELECT value FROM jsonb_array_elements(j->'preceding') LOOP
      held:=official_v3_guard_private.retired_state_v1(p->>'attemptKey');
      IF held IS NULL OR p->>'attempt' IS DISTINCT FROM expected::text
        OR held#>>'{job,leasedJob,attempt}' IS DISTINCT FROM expected::text
        OR held#>>'{job,jobKey}' IS DISTINCT FROM retired.job_key
        OR p->>'snapshotDigest' IS DISTINCT FROM encode(sha256(convert_to(held::text,'UTF8')),'hex')
        OR p->'intakeOperationId' IS DISTINCT FROM held#>'{job,intakeOperationId}'
        OR p->'proposalDigest' IS DISTINCT FROM held#>'{intake,proposal_digest}'
        OR expected=1 AND p->>'attemptKey' IS DISTINCT FROM original.attempt_key THEN
        RAISE EXCEPTION 'bg1 later retirement predecessor changed' USING ERRCODE='P7906'; END IF;
      expected:=expected+1;
    END LOOP;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retired.before_state);
    current_number:=current_number+1;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_review_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE retirement jsonb; incident jsonb; snapshot jsonb;
BEGIN
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1)
    AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE kind='rule_research'
      AND current_job->>'contextKey'='official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2' AND open_attempt IS NOT NULL) THEN
    retirement:=jsonb_build_object('status','closed');
  ELSE
    BEGIN
      snapshot:=official_v3_guard_private.recovery_snapshot_v1();
      retirement:=jsonb_build_object('status','reviewable','selection',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'),
        'attempt',snapshot#>'{job,leasedJob,attempt}','originals',snapshot#>'{result,originals}',
        'qualifications',snapshot#>'{result,qualifications}','acceptedVersions',0,'leaseEndedAt',snapshot#>'{job,leasedJob,lease,expiresAt}');
    EXCEPTION WHEN SQLSTATE 'P7906' OR SQLSTATE 'P7902' OR SQLSTATE 'P7504' OR no_data_found OR too_many_rows THEN
      retirement:=jsonb_build_object('status','unavailable'); END;
  END IF;
  incident:=official_v3_guard_private.incident_snapshot_v1();
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN jsonb_build_object('schema',1,'status','reviewed','retirement',retirement,
    'incident',jsonb_build_object('status',CASE WHEN incident->'generation'=incident->'resumedGeneration' THEN 'clear' ELSE 'blocked' END,
      'selection',encode(sha256(convert_to(incident::text,'UTF8')),'hex'),'generation',incident->'generation',
      'methodEpoch',incident#>'{method,epoch}','proofFinished',incident->'proofFinished','validUntil',incident->'validUntil',
      'canResume',COALESCE((incident->>'generation')::bigint>(incident->>'resumedGeneration')::bigint
        AND incident#>>'{method,status}'='approved' AND (incident->>'proofStarted')::timestamptz>(incident->>'incidentAt')::timestamptz
        AND clock_timestamp()<(incident->>'validUntil')::timestamptz,false)));
END $$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_retire_v1(p_operation_id text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE snapshot jsonb; prior official_v3_guard_private.owner_operations_v1%ROWTYPE; instant timestamptz; receipt_value jsonb; n integer;
BEGIN
  IF p_operation_id !~ '^op3_[a-f0-9]{32}$' OR p_selection !~ '^[a-f0-9]{64}$' OR p_operation_id IS NULL OR p_selection IS NULL THEN
    RAISE EXCEPTION 'bg1 fixed operation input' USING ERRCODE='P7901'; END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM pg_advisory_xact_lock(771106,1);
  SELECT * INTO prior FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=p_operation_id;
  IF FOUND THEN
    IF prior.action<>'retire_unknown' OR prior.expected_digest<>p_selection OR prior.actor_id<>auth.uid() THEN RAISE EXCEPTION 'bg1 operation collision' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.owner_session_v1(); RETURN prior.receipt;
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  snapshot:=official_v3_guard_private.recovery_snapshot_v1();
  IF encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') IS DISTINCT FROM p_selection THEN
    RAISE EXCEPTION 'bg1 reviewed state changed' USING ERRCODE='P7906'; END IF;
  n:=(snapshot#>>'{job,leasedJob,attempt}')::integer;
  IF n=1 AND EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1) THEN
    RAISE EXCEPTION 'bg1 first attempt already closed' USING ERRCODE='P7906'; END IF;
  instant:=clock_timestamp();
  receipt_value:=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown','operationId',p_operation_id,'selection',p_selection,
    'result','unknown_retired','recordedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO official_v3_guard_private.owner_operations_v1 VALUES(p_operation_id,'retire_unknown',p_selection,auth.uid(),instant,receipt_value);
  IF n=1 THEN
    INSERT INTO official_v3_guard_private.retired_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSE
    INSERT INTO official_v3_guard_private.retired_later_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',n,snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  END IF;
  PERFORM official_v3_guard_private.close_jobs_v1(snapshot#>>'{job,attemptKey}');
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.fixed_method_v1();
  IF n>1 THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN receipt_value;
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT successor FROM official_v3_guard_private.recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'BG1_PROVIDER_SHA256'
    OR successor.bg1_provider_digest<>'BG1_PROVIDER_SHA256' OR successor.status_provider_digest<>'STATUS_PROVIDER_SHA256'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR successor.predecessor_baselines_digest IS DISTINCT FROM predecessor.predecessor_baselines_digest
    OR successor.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR successor.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR successor.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(r.required_generation,b.required_generation),greatest(r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE r.singleton AND b.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(r.required_generation,b.required_generation),greatest(r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE r.singleton AND b.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
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
END $$;

-- Remove ONLY edges/privileges proven absent before this transaction. Preserve
-- all original bootstrap-grantor memberships, including their immutable OIDs.
REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner,ot_v3_result_owner;
REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;
REVOKE ot_v3_result_owner FROM postgres GRANTED BY postgres;

CREATE TEMP TABLE bg1_recovery_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $recovery_delta$
DECLARE approved jsonb:=/* APPROVED_FUNCTIONS */; expected record; actual pg_proc%ROWTYPE;
  before_catalog jsonb; after_catalog jsonb; entry record; relation_id oid; table_name text;
  class_value oid; object_value oid; expected_columns jsonb; replacement_ids oid[]:='{}';
BEGIN
  IF COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
      IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_recovery_before WHERE kind='memberships')
    OR (SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')
      IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_recovery_before WHERE kind='schema_acl') THEN
    RAISE EXCEPTION 'bg1 recovery exact authority restoration required' USING ERRCODE='P7901'; END IF;
  SELECT value INTO STRICT before_catalog FROM pg_temp.bg1_recovery_before WHERE kind='catalog';
  FOR expected IN SELECT * FROM jsonb_to_recordset(approved)
    AS f(signature text,name text,owner text,hash text,language text,definer boolean,volatile text,config jsonb) LOOP
    SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF actual.proowner<>to_regrole(expected.owner) OR actual.prokind<>'f' OR actual.proleakproof OR actual.proisstrict OR actual.proretset
      OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.proparallel<>'u'
      OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
      OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
      OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config
      OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash THEN
      RAISE EXCEPTION 'bg1 recovery exact function contract' USING ERRCODE='P7901'; END IF;
    IF before_catalog ? ('function:'||actual.oid) THEN replacement_ids:=array_append(replacement_ids,actual.oid);
    ELSE
      IF expected.signature<>'official_v3_guard_private.recovery_canonical_v1(jsonb,integer)'
        OR actual.prorettype<>'text'::regtype OR actual.proargnames IS DISTINCT FROM ARRAY['v','d']::text[]
        OR actual.pronargs<>2 OR actual.proargmodes IS NOT NULL OR actual.proallargtypes IS NOT NULL
        OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
          WHERE a.grantee<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.is_grantable OR a.privilege_type<>'EXECUTE') THEN
        RAISE EXCEPTION 'bg1 recovery new helper owner-only contract' USING ERRCODE='P7901'; END IF;
      INSERT INTO pg_temp.bg1_recovery_objects VALUES('pg_proc'::regclass,actual.oid);
    END IF;
  END LOOP;
  IF cardinality(replacement_ids)<>14 THEN RAISE EXCEPTION 'bg1 recovery exact replacement inventory' USING ERRCODE='P7901'; END IF;
  FOREACH table_name IN ARRAY ARRAY['retired_later_attempts_v1','recovery_baseline_v1'] LOOP
    relation_id:=to_regclass('official_v3_guard_private.'||table_name);
    expected_columns:=CASE table_name WHEN 'retired_later_attempts_v1' THEN
      '[["attempt_key","text",true,false],["job_key","text",true,false],["attempt_number","integer",true,false],["claim_operation_id","text",true,false],["intake_operation_id","text",true,false],["owner_operation_id","text",true,false],["before_state","jsonb",true,false],["retired_at","timestamp with time zone",true,false]]'::jsonb
      ELSE '[["singleton","boolean",true,false],["bg1_provider_digest","text",true,false],["status_provider_digest","text",true,false],["predecessor_catalog_digest","text",true,false],["predecessor_baselines_digest","text",true,false],["predecessor_status_digest","text",true,false],["required_generation","bigint",true,false],["proof_not_before","timestamp with time zone",true,false],["catalog","jsonb",true,false]]'::jsonb END;
    IF relation_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=relation_id AND c.relkind='r'
      AND c.relowner='postgres'::regrole AND c.relrowsecurity AND c.relforcerowsecurity)
      OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
        WHERE c.oid=relation_id AND (a.grantee<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.is_grantable))
      OR (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid::regtype::text,a.attnotnull,a.attisdropped) ORDER BY a.attnum)
        FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0) IS DISTINCT FROM expected_columns
      OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=relation_id)<>1
      OR NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=relation_id AND p.polname='owner_only'
        AND p.polroles=ARRAY['postgres'::regrole::oid] AND p.polpermissive AND p.polcmd='*'
        AND pg_get_expr(p.polqual,p.polrelid)='true' AND pg_get_expr(p.polwithcheck,p.polrelid)='true')
      OR (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal)<>2
      OR EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal
        AND (t.tgfoid<>'official_v3_guard_private.immutable_v1()'::regprocedure OR t.tgenabled<>'O' OR t.tgnargs<>0 OR t.tgqual IS NOT NULL
          OR NOT (t.tgname='immutable_v1' AND t.tgtype=27 OR t.tgname='immutable_truncate_v1' AND t.tgtype=34))) THEN
      RAISE EXCEPTION 'bg1 recovery private table contract' USING ERRCODE='P7901'; END IF;
    INSERT INTO pg_temp.bg1_recovery_objects
      SELECT 'pg_class'::regclass,relation_id
      UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.oid=relation_id AND c.reltoastrelid<>0
      UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i WHERE i.indrelid=relation_id
        OR i.indrelid=(SELECT reltoastrelid FROM pg_class WHERE oid=relation_id)
      UNION SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typrelid=relation_id
        OR t.typelem IN (SELECT oid FROM pg_type WHERE typrelid=relation_id)
      UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid=relation_id
      UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid=relation_id
        OR t.tgisinternal AND t.tgrelid='official_v3_guard_private.owner_operations_v1'::regclass
          AND t.tgconstrrelid=relation_id AND t.tgconstraint IN (SELECT c.oid FROM pg_constraint c
          WHERE c.conrelid=relation_id AND c.contype='f' AND c.confrelid='official_v3_guard_private.owner_operations_v1'::regclass
            AND c.conkey=ARRAY[6]::smallint[] AND c.confkey=ARRAY[1]::smallint[])
      UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid=relation_id
      UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid=relation_id;
  END LOOP;
  after_catalog:=official_v3_guard_private.catalog_status_v1();
  FOR entry IN SELECT key,value FROM jsonb_each(before_catalog) LOOP
    IF after_catalog->entry.key IS NOT DISTINCT FROM entry.value THEN CONTINUE; END IF;
    IF entry.key LIKE 'function:%' AND split_part(entry.key,':',2)::oid=ANY(replacement_ids)
      AND (after_catalog->entry.key)-'definition' IS NOT DISTINCT FROM entry.value-'definition' THEN CONTINUE; END IF;
    RAISE EXCEPTION 'bg1 recovery predecessor graph changed' USING ERRCODE='P7901';
  END LOOP;
  FOR entry IN SELECT key,value FROM jsonb_each(after_catalog) WHERE NOT before_catalog ? key LOOP
    class_value:=CASE split_part(entry.key,':',1)
      WHEN 'function' THEN 'pg_proc'::regclass WHEN 'relation' THEN 'pg_class'::regclass
      WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
      WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
      WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
      WHEN 'dependency' THEN (entry.value->>'classid')::oid WHEN 'shared' THEN (entry.value->>'classid')::oid END;
    object_value:=CASE WHEN split_part(entry.key,':',1) IN ('dependency','shared') THEN (entry.value->>'objid')::oid ELSE split_part(entry.key,':',2)::oid END;
    IF class_value IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.bg1_recovery_objects o WHERE o.classid=class_value AND o.objid=object_value) THEN
      RAISE EXCEPTION 'bg1 recovery unreviewed additive edge' USING ERRCODE='P7901'; END IF;
  END LOOP;
  INSERT INTO official_v3_guard_private.recovery_baseline_v1
  SELECT true,'BG1_PROVIDER_SHA256','STATUS_PROVIDER_SHA256',encode(sha256(convert_to(before_catalog::text,'UTF8')),'hex'),
    encode(sha256(convert_to((SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C") FROM official_v3_guard_private.baselines_v1 b)::text,'UTF8')),'hex'),
    encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
    s.generation+1,clock_timestamp(),after_catalog FROM official_v3_guard_private.state_v1 s
      CROSS JOIN official_v3_guard_private.status_baseline_v1 prior WHERE s.singleton AND prior.singleton;
END $recovery_delta$;

DO $recovery_postcheck$
DECLARE prior record; table_name text; row_count bigint; row_digest text; current_content jsonb;
BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  current_content:=jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
    's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
    'hrs',official_v3_guard_private.hrs_certificate_v1());
  IF current_content IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_recovery_before WHERE kind='content') THEN
    RAISE EXCEPTION 'bg1 recovery old certified content changed' USING ERRCODE='P7901'; END IF;
  FOR prior IN SELECT * FROM pg_temp.bg1_recovery_before WHERE kind LIKE 'table:%' LOOP
    table_name:=substr(prior.kind,7);
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    IF prior.value IS DISTINCT FROM jsonb_build_object('count',row_count,'digest',row_digest) THEN
      RAISE EXCEPTION 'bg1 recovery old table changed' USING ERRCODE='P7901'; END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1) THEN
    RAISE EXCEPTION 'bg1 recovery installer cannot retire an attempt' USING ERRCODE='P7901'; END IF;
  IF public.official_v3_guard_alarm_status_v1() IS DISTINCT FROM '{"schema":1,"status":"unavailable"}'::jsonb THEN
    RAISE EXCEPTION 'bg1 recovery fresh proof admission required' USING ERRCODE='P7901'; END IF;
  BEGIN
    PERFORM official_v3_guard_private.require_open_v1();
    RAISE EXCEPTION 'bg1 recovery old proof admitted business IO' USING ERRCODE='P7901';
  EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL; END;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  /* FINAL_QUIESCENCE */ THEN
    RAISE EXCEPTION 'bg1 recovery final quiescence refusal' USING ERRCODE='P7901'; END IF;
END $recovery_postcheck$;
