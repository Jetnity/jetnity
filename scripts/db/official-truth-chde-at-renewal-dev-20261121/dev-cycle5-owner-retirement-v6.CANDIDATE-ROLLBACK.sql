-- Dev PG17 exact immutable Cycle5 unknown custody successor. Always ROLLBACK for rehearsal.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='2s';
DO $pre$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE;
BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres'
 OR current_database()<>'postgres' OR current_setting('server_version_num')::int/10000<>17
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_guard_private.source_renewal_baseline_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_cycle5_baseline_v6') IS NOT NULL
 OR to_regclass('official_v3_guard_private.retired_cycle5_attempts_v1') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771106,1)
 OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE member='postgres'::regrole AND roleid='ot_v3_jobs_owner'::regrole
 AND admin_option AND NOT set_option AND NOT inherit_option)
 THEN RAISE EXCEPTION 'CYCLE5_DEV_INSTALL_NOT_EXACT' USING ERRCODE='P7906';END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1 WHERE kind='rule_research';
 IF s.open_attempt<>'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153' OR s.start_count<>15 OR s.operation_count<>53
 OR s.current_job->>'revision'<>'49' OR s.current_job->>'attempt'<>'1'
 OR (s.current_job#>>'{lease,expiresAt}')::timestamptz>=clock_timestamp()
 THEN RAISE EXCEPTION 'CYCLE5_DEV_CURRENT_ATTEMPT_MISMATCH' USING ERRCODE='P7906';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.assert_catalog_v1()'::regprocedure),'UTF8')),'hex'))<>'bdeadbdc9dee963e9819f1a061419dc22b305ffb9a591ff7ee773740a5b2709d' THEN RAISE EXCEPTION 'CYCLE5_SOURCE_PIN_CHANGED' USING ERRCODE='P7906';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.attempt_retired_v1(text)'::regprocedure),'UTF8')),'hex'))<>'c5698535a5e70ecb840936b153832481232875f4d3e5098ad7dd90e06495252e' THEN RAISE EXCEPTION 'CYCLE5_SOURCE_PIN_CHANGED' USING ERRCODE='P7906';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.check_retirements_v1()'::regprocedure),'UTF8')),'hex'))<>'57e4a265b0b7f8c47261bf2a308690076b38884bca91fb4324d97dcf689f0899' THEN RAISE EXCEPTION 'CYCLE5_SOURCE_PIN_CHANGED' USING ERRCODE='P7906';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.require_open_v1()'::regprocedure),'UTF8')),'hex'))<>'04c396ad205b7e4c40bcfcf58fe6bc2dba29ce5bf26211ff58413eced0020dbb' THEN RAISE EXCEPTION 'CYCLE5_SOURCE_PIN_CHANGED' USING ERRCODE='P7906';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.retired_state_v1(text)'::regprocedure),'UTF8')),'hex'))<>'4fbfae1a186de2eb093474e823a7ef9e953fd15746aaeac393449064135f15fb' THEN RAISE EXCEPTION 'CYCLE5_SOURCE_PIN_CHANGED' USING ERRCODE='P7906';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('public.official_v3_guard_alarm_status_v1()'::regprocedure),'UTF8')),'hex'))<>'dcb3e8078f77d46b4cf99baf418d3d5c2009997234c72a5a11d383f5fdff8e4c' THEN RAISE EXCEPTION 'CYCLE5_SOURCE_PIN_CHANGED' USING ERRCODE='P7906';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('public.official_v3_guard_retire_v1(text,text)'::regprocedure),'UTF8')),'hex'))<>'bf15b0bf3fa519c3ab96eb9e068c66781231def84579f5304d9c35dcf0179f16' THEN RAISE EXCEPTION 'CYCLE5_SOURCE_PIN_CHANGED' USING ERRCODE='P7906';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('public.official_v3_guard_review_v1()'::regprocedure),'UTF8')),'hex'))<>'9025553719144ad283bc3fff94f43ea8ba42f5a51520833cda526da0aa3f4d2b' THEN RAISE EXCEPTION 'CYCLE5_SOURCE_PIN_CHANGED' USING ERRCODE='P7906';END IF;
END $pre$;
CREATE TABLE official_v3_guard_private.retired_cycle5_attempts_v1(
 attempt_key text PRIMARY KEY CHECK(attempt_key='execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153'),
 job_key text NOT NULL CHECK(job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'),
 claim_operation_id text NOT NULL UNIQUE CHECK(claim_operation_id='op3_7ce17fa04e974e9991dc15e9dd55caf8'),
 intake_operation_id text NOT NULL UNIQUE CHECK(intake_operation_id='op3_be550a1a633f669a1f1b812b76020b3e'),
 owner_operation_id text NOT NULL UNIQUE CHECK(owner_operation_id~'^op3_[a-f0-9]{32}$'),
 before_state jsonb NOT NULL CHECK(octet_length(before_state::text)<=131072 AND before_state->>'kind'='ch_de_cycle5_unknown'),
 retired_at timestamptz NOT NULL CHECK(isfinite(retired_at)));
ALTER TABLE official_v3_guard_private.retired_cycle5_attempts_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.retired_cycle5_attempts_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.retired_cycle5_attempts_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.retired_cycle5_attempts_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.retired_cycle5_attempts_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.retired_cycle5_attempts_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE TABLE official_v3_guard_private.bg1_dev_cycle5_baseline_v6(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 attempt_key text NOT NULL CHECK(attempt_key='execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153'),
 prior_retirement_count integer NOT NULL CHECK(prior_retirement_count=6),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,catalog jsonb NOT NULL);
ALTER TABLE official_v3_guard_private.bg1_dev_cycle5_baseline_v6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_cycle5_baseline_v6 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_dev_cycle5_baseline_v6 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_dev_cycle5_baseline_v6 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_dev_cycle5_baseline_v6 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_dev_cycle5_baseline_v6 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT ot_v3_jobs_owner TO postgres WITH INHERIT FALSE, SET TRUE;
SET LOCAL ROLE ot_v3_jobs_owner;
CREATE FUNCTION official_v3_jobs_private.cycle5_close_v1(evidence jsonb)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $body$
DECLARE changed bigint;
BEGIN
 PERFORM official_v3_guard_private.owner_session_v1();
 IF evidence->>'kind'<>'ch_de_cycle5_unknown'
 OR evidence#>>'{job,attemptKey}'<>'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153'
 OR evidence#>>'{job,jobKey}'<>'research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
 OR evidence#>>'{job,claimOperationId}'<>'op3_7ce17fa04e974e9991dc15e9dd55caf8'
 OR evidence#>>'{job,intakeOperationId}'<>'op3_be550a1a633f669a1f1b812b76020b3e'
 OR evidence#>>'{job,startCount}'<>'15' OR evidence#>>'{job,operationCount}'<>'53'
 THEN RAISE EXCEPTION 'CYCLE5_EXACT_OWNER_QUEUE_SCOPE_REQUIRED' USING ERRCODE='P7906';END IF;
 PERFORM official_v3_guard_private.begin_jobs_v1();
 UPDATE official_v3_jobs_private.subjects_v1 s SET open_attempt=NULL
 WHERE s.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' AND s.open_attempt='execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153'
 AND to_jsonb(s) IS NOT DISTINCT FROM evidence#>'{job,subjectState}'
 AND s.current_job IS NOT DISTINCT FROM evidence#>'{job,leasedJob}'
 AND s.terminal_credit_claim='op3_7ce17fa04e974e9991dc15e9dd55caf8' AND s.start_count=15 AND s.operation_count=53;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'CYCLE5_HISTORY_CAS_REJECTED' USING ERRCODE='P7906';END IF;
 PERFORM official_v3_guard_private.seal_jobs_v1();
 PERFORM official_v3_jobs_private.assert_history_v1('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513');
 PERFORM official_v3_guard_private.owner_session_v1();
END $body$;


REVOKE ALL ON FUNCTION official_v3_jobs_private.cycle5_close_v1(jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION official_v3_jobs_private.cycle5_close_v1(jsonb) TO postgres;
RESET ROLE;
GRANT ot_v3_jobs_owner TO postgres WITH INHERIT FALSE, SET FALSE;
DO $rest$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE member='postgres'::regrole AND roleid='ot_v3_jobs_owner'::regrole AND admin_option AND NOT set_option AND NOT inherit_option)
 OR (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid='official_v3_jobs_private.cycle5_close_v1(jsonb)'::regprocedure)<>'ot_v3_jobs_owner'
 OR has_function_privilege('anon','official_v3_jobs_private.cycle5_close_v1(jsonb)','EXECUTE')
 OR has_function_privilege('authenticated','official_v3_jobs_private.cycle5_close_v1(jsonb)','EXECUTE')
 THEN RAISE EXCEPTION 'CYCLE5_JOBS_OWNER_MEMBERSHIP_NOT_RESTORED' USING ERRCODE='P7906';END IF;
END $rest$;
CREATE FUNCTION official_v3_guard_private.cycle5_snapshot_v1()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $body$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
 c official_v3_jobs_private.queue_operations_v1%ROWTYPE; o official_v3_intake_private.operations_v1%ROWTYPE;
 q official_v3_result_private.qualifications_v1%ROWTYPE; h official_v3_result_private.heads_v1%ROWTYPE;
 j jsonb; accepted_original jsonb;
BEGIN
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_certificates_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 PERFORM official_v3_guard_private.fixed_method_v1();
 IF (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)<>1
 OR (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)<>2
 OR (SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1)<>1
 OR (SELECT count(*) FROM official_v3_guard_private.retired_cycle4_attempts_v1)<>1
 OR (SELECT count(*) FROM official_v3_guard_private.retired_cycle4_attempt2_v1)<>1
 OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_cycle5_attempts_v1)
 THEN RAISE EXCEPTION 'CYCLE5_PREVIOUS_OWNER_HISTORY_INCOMPLETE' USING ERRCODE='P7906';END IF;
 SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1 WHERE kind='rule_research' AND job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513';
 IF s.open_attempt IS DISTINCT FROM 'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153' OR s.start_count<>15 OR s.operation_count<>53
 OR s.current_job->>'attempt'<>'1' OR s.current_job->>'revision'<>'49'
 OR s.current_job->>'state'<>'leased' OR s.terminal_credit_claim<>'op3_7ce17fa04e974e9991dc15e9dd55caf8'
 OR (s.current_job#>>'{lease,expiresAt}')::timestamptz>=clock_timestamp()
 THEN RAISE EXCEPTION 'CYCLE5_CURRENT_ATTEMPT_CHANGED' USING ERRCODE='P7906';END IF;
 PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
 SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt;
 SELECT * INTO STRICT c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=t.claim_operation_id;
 IF t.claim_operation_id<>'op3_7ce17fa04e974e9991dc15e9dd55caf8' OR t.job_key<>s.job_key OR t.leased_job IS DISTINCT FROM s.current_job
 OR t.authority IS DISTINCT FROM s.method_binding||jsonb_build_object('epoch',1)
 OR c.action<>'claim' OR c.job_key<>s.job_key OR c.envelope_text::jsonb->'next' IS DISTINCT FROM t.leased_job
 OR c.command_text::jsonb->'input' IS DISTINCT FROM t.claim_text::jsonb
 OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=s.open_attempt)
 OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=s.open_attempt)
 THEN RAISE EXCEPTION 'CYCLE5_CLAIM_RESULT_CUSTODY_CHANGED' USING ERRCODE='P7906';END IF;
 SELECT * INTO STRICT o FROM official_v3_intake_private.operations_v1
 WHERE operation_id='op3_be550a1a633f669a1f1b812b76020b3e' AND binding->>'jobId'=s.current_job->>'jobId'
 AND created_at>=t.reserved_at AND created_at<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz;
 j:=jsonb_build_object('leasedJob',s.current_job,'intakeOperationId',o.operation_id,
   'runnerId',o.binding->'runnerId','deliveryId',o.binding->'deliveryId','inputRevision',o.binding->'inputRevision');
 accepted_original:=official_v3_guard_private.recovery_intake_v1(j);
 IF accepted_original->>'operation_id'<>'op3_be550a1a633f669a1f1b812b76020b3e' OR accepted_original->'bytes' IS DISTINCT FROM '1425'::jsonb
 THEN RAISE EXCEPTION 'CYCLE5_SIGNED_INTAKE_CHANGED' USING ERRCODE='P7906';END IF;
 SELECT * INTO STRICT h FROM official_v3_result_private.heads_v1 WHERE singleton;
 SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1
 WHERE kind='verification' AND reference=(SELECT verification_ref FROM official_v3_result_private.projections_v1 WHERE reference=h.projection_ref);
 IF jsonb_array_length(q.original_ids)<>2
 OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 WHERE committed_at>t.reserved_at)
 OR EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1 WHERE published_at>t.reserved_at)
 OR EXISTS(SELECT 1 FROM official_v3_result_private.outbox_v1 WHERE recorded_at>t.reserved_at)
 THEN RAISE EXCEPTION 'CYCLE5_NO_UNVERIFIED_NEW_PUBLICATION_REQUIRED' USING ERRCODE='P7906';END IF;
 RETURN jsonb_build_object('schema',1,'kind','ch_de_cycle5_unknown',
 'job',jsonb_build_object('attemptKey',s.open_attempt,'jobKey',s.job_key,'claimOperationId',t.claim_operation_id,
  'intakeOperationId',o.operation_id,'leasedJob',s.current_job,'subjectState',to_jsonb(s),
  'authority',t.authority,'startCount',s.start_count,'operationCount',s.operation_count),
 'intake',accepted_original,
 'result',jsonb_build_object('originals',2,'qualifications',1,'acceptedVersions',0,
  'verificationRef',q.reference,'originalIds',q.original_ids,
  'lastVersionRef',h.version_ref,'lastProjectionRef',h.projection_ref),
 'priorRetirements',jsonb_build_object('first',1,'later',2,'refresh',1,'cycle4',1,'cycle4Attempt2',1));
END $body$;

CREATE FUNCTION official_v3_guard_private.cycle5_check_retired_v1()
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $body$
DECLARE r official_v3_guard_private.retired_cycle5_attempts_v1%ROWTYPE;
 op official_v3_guard_private.owner_operations_v1%ROWTYPE;
 s official_v3_jobs_private.subjects_v1%ROWTYPE;
 t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
 o official_v3_intake_private.operations_v1%ROWTYPE;
 q official_v3_result_private.qualifications_v1%ROWTYPE;
BEGIN
 IF (SELECT count(*) FROM official_v3_guard_private.retired_cycle5_attempts_v1)>1
 THEN RAISE EXCEPTION 'CYCLE5_MULTIPLE_OWNER_RETIREMENTS' USING ERRCODE='P7906';END IF;
 SELECT * INTO r FROM official_v3_guard_private.retired_cycle5_attempts_v1;
 IF NOT FOUND THEN RETURN;END IF;
 SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=r.owner_operation_id;
 IF op.action<>'retire_unknown' OR op.actor_id IS NULL
 OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(r.before_state::text,'UTF8')),'hex')
 OR op.recorded_at IS DISTINCT FROM r.retired_at
 OR op.receipt IS DISTINCT FROM jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
 'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
 'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
 OR r.before_state->>'kind'<>'ch_de_cycle5_unknown'
 OR r.before_state#>>'{job,attemptKey}' IS DISTINCT FROM r.attempt_key
 OR r.before_state#>>'{job,jobKey}' IS DISTINCT FROM r.job_key
 OR r.before_state#>>'{job,claimOperationId}' IS DISTINCT FROM r.claim_operation_id
 OR r.before_state#>>'{job,intakeOperationId}' IS DISTINCT FROM r.intake_operation_id
 OR r.before_state#>'{priorRetirements}' IS DISTINCT FROM '{"first":1,"later":2,"refresh":1,"cycle4":1,"cycle4Attempt2":1}'::jsonb
 THEN RAISE EXCEPTION 'CYCLE5_GENUINE_OWNER_RECEIPT_REQUIRED' USING ERRCODE='P7906';END IF;
 SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=r.job_key;
 SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=r.attempt_key;
 SELECT * INTO STRICT o FROM official_v3_intake_private.operations_v1 WHERE operation_id=r.intake_operation_id;
 SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1
 WHERE reference=r.before_state#>>'{result,verificationRef}' AND kind='verification';
 IF s.open_attempt IS NOT NULL OR s.start_count<>15 OR s.operation_count<>53
 OR (to_jsonb(s)-'open_attempt') IS DISTINCT FROM ((r.before_state#>'{job,subjectState}')-'open_attempt')
 OR s.current_job IS DISTINCT FROM t.leased_job OR t.job_key<>s.job_key OR t.claim_operation_id<>'op3_7ce17fa04e974e9991dc15e9dd55caf8'
 OR r.retired_at<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz
 OR r.before_state#>'{job,leasedJob}' IS DISTINCT FROM t.leased_job
 OR r.before_state#>'{job,authority}' IS DISTINCT FROM t.authority
 OR r.before_state#>'{result,originalIds}' IS DISTINCT FROM q.original_ids
 OR jsonb_array_length(q.original_ids)<>2
 OR r.before_state#>'{intake}' IS DISTINCT FROM
  ((to_jsonb(o)-ARRAY['original_bytes','lease_token'])||jsonb_build_object('bytes',octet_length(o.original_bytes)))
 OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
 OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)
 THEN RAISE EXCEPTION 'CYCLE5_ARCHIVED_SOURCE_OR_CLOSED_JOB_CHANGED' USING ERRCODE='P7906';END IF;
 PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
END $body$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_review_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
 SET statement_timeout TO '5s'
 SET lock_timeout TO '2s'
AS $function$
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
      IF EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE kind='rule_research' AND open_attempt='execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153') THEN
        snapshot:=official_v3_guard_private.cycle5_snapshot_v1();
      ELSE
        snapshot:=official_v3_guard_private.recovery_snapshot_v1();
      END IF;
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
END $function$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_retire_v1(p_operation_id text, p_selection text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
 SET statement_timeout TO '5s'
 SET lock_timeout TO '2s'
AS $function$
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
  IF EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE kind='rule_research' AND open_attempt='execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153') THEN
    snapshot:=official_v3_guard_private.cycle5_snapshot_v1();
  ELSE
    snapshot:=official_v3_guard_private.recovery_snapshot_v1();
  END IF;
  IF encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') IS DISTINCT FROM p_selection THEN
    RAISE EXCEPTION 'bg1 reviewed state changed' USING ERRCODE='P7906'; END IF;
  n:=(snapshot#>>'{job,leasedJob,attempt}')::integer;
  IF n=1 AND snapshot->>'kind' NOT IN ('ch_de_refresh_unknown','ch_de_cycle4_unknown') AND EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1) THEN
    RAISE EXCEPTION 'bg1 first attempt already closed' USING ERRCODE='P7906'; END IF;
  instant:=clock_timestamp();
  receipt_value:=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown','operationId',p_operation_id,'selection',p_selection,
    'result','unknown_retired','recordedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO official_v3_guard_private.owner_operations_v1 VALUES(p_operation_id,'retire_unknown',p_selection,auth.uid(),instant,receipt_value);
  IF snapshot->>'kind'='ch_de_cycle5_unknown' THEN
    INSERT INTO official_v3_guard_private.retired_cycle5_attempts_v1
      (attempt_key,job_key,claim_operation_id,intake_operation_id,owner_operation_id,before_state,retired_at)
    VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSIF snapshot->>'kind'='ch_de_cycle4_attempt2_unknown' THEN
    INSERT INTO official_v3_guard_private.retired_cycle4_attempt2_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSIF snapshot->>'kind'='ch_de_cycle4_unknown' THEN
    INSERT INTO official_v3_guard_private.retired_cycle4_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSIF snapshot->>'kind'='ch_de_refresh_unknown' THEN
    INSERT INTO official_v3_guard_private.retired_refresh_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSIF n=1 THEN
    INSERT INTO official_v3_guard_private.retired_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSE
    INSERT INTO official_v3_guard_private.retired_later_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',n,snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  END IF;
  IF snapshot->>'kind'='ch_de_cycle5_unknown' THEN
    PERFORM official_v3_jobs_private.cycle5_close_v1(snapshot);
  ELSE
    PERFORM official_v3_guard_private.close_jobs_v1(snapshot#>>'{job,attemptKey}');
  END IF;
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.fixed_method_v1();
  IF n>1 OR snapshot->>'kind' IN ('ch_de_refresh_unknown','ch_de_cycle4_unknown','ch_de_cycle5_unknown') THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN receipt_value;
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.attempt_retired_v1(attempt_value text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_refresh_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_cycle4_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_cycle4_attempt2_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_cycle5_attempts_v1 WHERE attempt_key=attempt_value)
$function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.retired_state_v1(attempt_value text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
SELECT before_state FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value
UNION ALL SELECT before_state FROM official_v3_guard_private.retired_later_attempts_v1 WHERE attempt_key=attempt_value
UNION ALL SELECT r.before_state FROM official_v3_guard_private.retired_refresh_attempts_v1 r
JOIN official_v3_guard_private.owner_operations_v1 op ON op.operation_id=r.owner_operation_id
WHERE r.attempt_key=attempt_value AND r.attempt_key='execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea'
  AND op.action='retire_unknown' AND op.recorded_at=r.retired_at
  AND op.expected_digest=encode(sha256(convert_to(r.before_state::text,'UTF8')),'hex')
  AND op.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
    'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
    'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
UNION ALL SELECT r.before_state FROM official_v3_guard_private.retired_cycle4_attempts_v1 r
JOIN official_v3_guard_private.owner_operations_v1 op ON op.operation_id=r.owner_operation_id
WHERE r.attempt_key=attempt_value AND r.attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de'
  AND op.action='retire_unknown' AND op.recorded_at=r.retired_at
  AND op.expected_digest=encode(sha256(convert_to(r.before_state::text,'UTF8')),'hex')
  AND op.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
    'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
    'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
UNION ALL SELECT r.before_state FROM official_v3_guard_private.retired_cycle4_attempt2_v1 r
JOIN official_v3_guard_private.owner_operations_v1 op ON op.operation_id=r.owner_operation_id
WHERE r.attempt_key=attempt_value AND r.attempt_key='execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99'
  AND op.action='retire_unknown' AND op.recorded_at=r.retired_at
  AND op.expected_digest=encode(sha256(convert_to(r.before_state::text,'UTF8')),'hex')
  AND op.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
    'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
    'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
UNION ALL SELECT r.before_state FROM official_v3_guard_private.retired_cycle5_attempts_v1 r
JOIN official_v3_guard_private.owner_operations_v1 op ON op.operation_id=r.owner_operation_id
WHERE r.attempt_key=attempt_value AND r.attempt_key='execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153'
 AND op.action='retire_unknown' AND op.recorded_at=r.retired_at
 AND op.expected_digest=encode(sha256(convert_to(r.before_state::text,'UTF8')),'hex')
 AND op.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
  'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
  'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
$function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retirements_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE retired record; op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb;
BEGIN
DECLARE retired record; op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb;
BEGIN
DECLARE retired record; op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb;
BEGIN
DECLARE retired record; original official_v3_guard_private.retired_attempts_v1%ROWTYPE;
  op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb; p jsonb; held jsonb; expected integer; current_number integer:=2; gap_case boolean;
BEGIN
  DECLARE retirement record; op official_v3_guard_private.owner_operations_v1%ROWTYPE;
BEGIN
  IF (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)>1 THEN RAISE EXCEPTION 'bg1 fixed recovery scope' USING ERRCODE='P7906'; END IF;
  FOR retirement IN SELECT * FROM official_v3_guard_private.retired_attempts_v1 LOOP
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retirement.owner_operation_id;
    IF op.action<>'retire_unknown' OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retirement.before_state::text,'UTF8')),'hex')
      OR retirement.attempt_key IS DISTINCT FROM retirement.before_state#>>'{job,attemptKey}'
      OR retirement.intake_operation_id IS DISTINCT FROM retirement.before_state#>>'{job,intakeOperationId}'
      OR retirement.claim_operation_id IS DISTINCT FROM retirement.before_state#>>'{job,claimOperationId}'
      OR retirement.job_key IS DISTINCT FROM retirement.before_state#>>'{job,jobKey}'
      OR retirement.retired_at IS DISTINCT FROM op.recorded_at THEN
      RAISE EXCEPTION 'bg1 retirement receipt binding' USING ERRCODE='P7906';
    END IF;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retirement.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retirement.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retirement.before_state);
  END LOOP;
END;
  IF (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)>3 THEN
    RAISE EXCEPTION 'bg1 bounded later recovery scope' USING ERRCODE='P7906'; END IF;
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_later_attempts_v1 ORDER BY attempt_number LOOP
    SELECT * INTO STRICT original FROM official_v3_guard_private.retired_attempts_v1;
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    gap_case:=retired.attempt_number=4 AND j ? 'skippedClaims';
    IF (retired.attempt_number<>current_number AND NOT(gap_case AND current_number=3)) OR retired.attempt_number NOT BETWEEN 2 AND 4
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
      OR j->>'startCount' IS DISTINCT FROM (CASE WHEN gap_case THEN 3 ELSE retired.attempt_number END)::text OR j#>'{leasedJob,attemptLimit}' IS DISTINCT FROM '4'::jsonb
      OR jsonb_typeof(j->'preceding') IS DISTINCT FROM 'array'
      OR jsonb_array_length(j->'preceding') IS DISTINCT FROM (CASE WHEN gap_case THEN 2 ELSE retired.attempt_number-1 END)
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
    current_number:=retired.attempt_number+1;
  END LOOP;
END;
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_refresh_attempts_v1 LOOP
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    IF retired.attempt_key IS DISTINCT FROM 'execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea' OR j->>'attemptKey' IS DISTINCT FROM retired.attempt_key
      OR retired.job_key IS DISTINCT FROM j->>'jobKey' OR retired.claim_operation_id IS DISTINCT FROM 'op3_af6a4ab203d24be7869136eec570468e'
      OR retired.claim_operation_id IS DISTINCT FROM j->>'claimOperationId'
      OR retired.intake_operation_id IS DISTINCT FROM 'op3_7e003b5a015c26976fbdf3fed1b8d494' OR retired.intake_operation_id IS DISTINCT FROM j->>'intakeOperationId'
      OR retired.before_state->'schema' IS DISTINCT FROM '1'::jsonb
      OR retired.before_state->>'kind' IS DISTINCT FROM 'ch_de_refresh_unknown'
      OR retired.before_state->>'originalEvidenceDigest' IS DISTINCT FROM 'be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
      OR j->'subjectState' IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_e1467267780885ae38068e6be1738958","lease":{"leaseId":"lease3_1d7d014131bb4d42a09058b719edfaf5","expiresAt":"2026-11-15T10:45:56.164Z","acquiredAt":"2026-11-15T10:45:26.164Z","generation":37},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":37,"createdAt":"2026-11-15T10:45:20.652Z","updatedAt":"2026-11-15T10:45:26.164Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_3c550f64e49d0b2b1af14f09edca65c1","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":36},"start_count":9,"open_attempt":"execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":41,"terminal_credit_claim":"op3_af6a4ab203d24be7869136eec570468e"}'::jsonb
      OR retired.before_state->'previousRetirements' IS DISTINCT FROM (SELECT jsonb_build_object('first',COALESCE((SELECT jsonb_agg((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at))) ORDER BY attempt_key) FROM official_v3_guard_private.retired_attempts_v1 r),'[]'::jsonb),'later',COALESCE((SELECT jsonb_agg((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at))) ORDER BY attempt_number) FROM official_v3_guard_private.retired_later_attempts_v1 r),'[]'::jsonb)))
      OR op.action IS DISTINCT FROM 'retire_unknown' OR op.recorded_at IS DISTINCT FROM retired.retired_at
      OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retired.before_state::text,'UTF8')),'hex')
      OR op.receipt IS DISTINCT FROM jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
        'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
        'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      OR (j#>>'{leasedJob,lease,expiresAt}')::timestamptz>=retired.retired_at
      OR (retired.before_state#>>'{intake,expires_at}')::timestamptz>=retired.retired_at THEN
      RAISE EXCEPTION 'bg1 refresh retirement receipt binding' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retired.before_state);
  END LOOP;
END;
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_cycle4_attempts_v1 LOOP
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    IF retired.attempt_key IS DISTINCT FROM 'execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de' OR j->>'attemptKey' IS DISTINCT FROM retired.attempt_key
      OR retired.job_key IS DISTINCT FROM j->>'jobKey' OR retired.claim_operation_id IS DISTINCT FROM 'op3_2b7811ed9b5f488cbffcd09a0ec0409b'
      OR retired.claim_operation_id IS DISTINCT FROM j->>'claimOperationId'
      OR retired.intake_operation_id IS DISTINCT FROM 'op3_90bd61aa6d32e79273bdd923f1851576' OR retired.intake_operation_id IS DISTINCT FROM j->>'intakeOperationId'
      OR retired.before_state->'schema' IS DISTINCT FROM '1'::jsonb
      OR retired.before_state->>'kind' IS DISTINCT FROM 'ch_de_cycle4_unknown'
      OR retired.before_state->>'originalEvidenceDigest' IS DISTINCT FROM '5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
      OR j->'subjectState' IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
      OR retired.before_state->'previousRetirements' IS DISTINCT FROM jsonb_build_object('first',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'later',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_later_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'refresh',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_refresh_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb))
      OR op.action IS DISTINCT FROM 'retire_unknown' OR op.recorded_at IS DISTINCT FROM retired.retired_at
      OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retired.before_state::text,'UTF8')),'hex')
      OR op.receipt IS DISTINCT FROM jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
        'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
        'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      OR (j#>>'{leasedJob,lease,expiresAt}')::timestamptz>=retired.retired_at
      OR (retired.before_state#>>'{intake,expires_at}')::timestamptz>=retired.retired_at THEN
      RAISE EXCEPTION 'bg1 cycle4 retirement receipt binding' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retired.before_state);
  END LOOP;
END;
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_cycle4_attempt2_v1 LOOP
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    IF retired.attempt_key IS DISTINCT FROM 'execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99' OR j->>'attemptKey' IS DISTINCT FROM retired.attempt_key
      OR retired.job_key IS DISTINCT FROM j->>'jobKey' OR retired.claim_operation_id IS DISTINCT FROM 'op3_aa4029549e0cf99ec5d882752e492713'
      OR retired.claim_operation_id IS DISTINCT FROM j->>'claimOperationId'
      OR retired.intake_operation_id IS DISTINCT FROM 'op3_e062b171cbf4958094a86366d013a73d' OR retired.intake_operation_id IS DISTINCT FROM j->>'intakeOperationId'
      OR retired.before_state->'schema' IS DISTINCT FROM '1'::jsonb
      OR retired.before_state->>'kind' IS DISTINCT FROM 'ch_de_cycle4_attempt2_unknown'
      OR retired.before_state->>'originalEvidenceDigest' IS DISTINCT FROM '7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
      OR j->'subjectState' IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_61fea9f1b961deb3301791adb8a3bfa4","expiresAt":"2026-11-15T17:55:23.069Z","acquiredAt":"2026-11-15T17:54:53.069Z","generation":42},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":2,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":42,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T17:54:53.069Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":41},"start_count":12,"open_attempt":"execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":46,"terminal_credit_claim":"op3_aa4029549e0cf99ec5d882752e492713"}'::jsonb
      OR retired.before_state->'previousRetirements' IS DISTINCT FROM jsonb_build_object('first',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'later',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_later_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'refresh',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_refresh_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'cycle4',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_cycle4_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb))
      OR op.action IS DISTINCT FROM 'retire_unknown' OR op.recorded_at IS DISTINCT FROM retired.retired_at
      OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retired.before_state::text,'UTF8')),'hex')
      OR op.receipt IS DISTINCT FROM jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
        'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
        'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      OR (j#>>'{leasedJob,lease,expiresAt}')::timestamptz>=retired.retired_at
      OR (retired.before_state#>>'{intake,expires_at}')::timestamptz>=retired.retired_at THEN
      RAISE EXCEPTION 'bg1 cycle4 retirement receipt binding' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retired.before_state);
  END LOOP;
  PERFORM official_v3_guard_private.cycle5_check_retired_v1();
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(renewal.required_generation,at_baseline.required_generation,admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(renewal.proof_not_before,at_baseline.proof_not_before,admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.source_renewal_baseline_v1 renewal CROSS JOIN official_v3_guard_private.at_hrs2_baseline_v1 at_baseline CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE renewal.singleton AND at_baseline.singleton AND admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 v WHERE singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(renewal.required_generation,at_baseline.required_generation,admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(renewal.proof_not_before,at_baseline.proof_not_before,admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.source_renewal_baseline_v1 renewal CROSS JOIN official_v3_guard_private.at_hrs2_baseline_v1 at_baseline CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE renewal.singleton AND at_baseline.singleton AND admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 v WHERE singleton;
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
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE cycle5_v6 official_v3_guard_private.bg1_dev_cycle5_baseline_v6%ROWTYPE;
 maintenance_v5 official_v3_guard_private.bg1_dev_maintenance_baseline_v5%ROWTYPE;
 acl_v4 official_v3_guard_private.bg1_dev_weather_acl_baseline_v4%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 renewal official_v3_guard_private.source_renewal_baseline_v1%ROWTYPE;
  at_baseline official_v3_guard_private.at_hrs2_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;
  customer official_v3_guard_private.customer_information_baseline_v1%ROWTYPE;
  refresh official_v3_guard_private.refresh_retirement_baseline_v1%ROWTYPE;
  cycle4 official_v3_guard_private.cycle4_recovery_baseline_v1%ROWTYPE;
  attempt2 official_v3_guard_private.cycle4_attempt2_baseline_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT cycle5_v6 FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 WHERE singleton;
  SELECT * INTO STRICT maintenance_v5 FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton;
  SELECT * INTO STRICT acl_v4 FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
 SELECT * INTO STRICT renewal FROM official_v3_guard_private.source_renewal_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_baseline FROM official_v3_guard_private.at_hrs2_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT attempt2 FROM official_v3_guard_private.cycle4_attempt2_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT cycle4 FROM official_v3_guard_private.cycle4_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT refresh FROM official_v3_guard_private.refresh_retirement_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT customer FROM official_v3_guard_private.customer_information_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT gap_baseline FROM official_v3_guard_private.gap_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT successor FROM official_v3_guard_private.recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'
    OR successor.bg1_provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950' OR successor.status_provider_digest<>'71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR successor.predecessor_baselines_digest IS DISTINCT FROM predecessor.predecessor_baselines_digest
    OR successor.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR successor.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR gap_baseline.recovery2_provider_digest<>'b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7'
    OR gap_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(successor.catalog::text,'UTF8')),'hex')
    OR gap_baseline.predecessor_recovery_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(successor)||jsonb_build_object('proof_not_before',extract(epoch FROM successor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(gap_baseline.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_gap_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(gap_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM gap_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at)) FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR customer.predecessor_provider_digest<>'7324c5e87d18de2a692e7e61123a44565ca440ecc9f8e9afddf379ede2aac32a'
    OR customer.definitions_digest<>'6c5d64c50389caf424d99b204e7f0f08ba64c0f669e7b9e3f8cccead2deb992f'
    OR customer.history_definition_digest<>'061e62165021fe13959b72bfb3135114d5c77b5119f32eb7233e1290d586d692'
    OR customer.history_guard_definition_digest<>'f4a6ee4ade45524bd8ce12e389b9958568c6e2bcda1c103d22233e1e3d32987b'
    OR customer.atomic_claim_definition_digest<>'75f43cdf119fe9bd862dd5bdcbbd6d53da974b09a6162ad999f23ab62fd3af8a'
    OR customer.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR customer.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR refresh.predecessor_provider_digest<>'cd886ead66b92ec48ee9c5c5a214f310bc6e6645e1fc15f88a78650fcb95b37f'
    OR refresh.original_evidence_digest<>'be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
    OR refresh.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(customer.catalog::text,'UTF8')),'hex')
    OR refresh.predecessor_customer_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(customer)||jsonb_build_object('proof_not_before',extract(epoch FROM customer.proof_not_before)))::text,'UTF8')),'hex')
    OR cycle4.predecessor_provider_digest<>'e71c729360c0e36e7d3a00504b8f013d716ef33c76ae35c9e8fbb484d01c67fe'
    OR cycle4.original_evidence_digest<>'5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
    OR cycle4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(refresh.catalog::text,'UTF8')),'hex')
    OR cycle4.predecessor_refresh_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(refresh)||jsonb_build_object('proof_not_before',extract(epoch FROM refresh.proof_not_before)))::text,'UTF8')),'hex')
    OR attempt2.predecessor_provider_digest<>'e12dc341cc01de2a459826e8b1c6a3a9b4dd48b40dd8cd1c765660007b7694f3'
    OR attempt2.original_evidence_digest<>'7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
    OR attempt2.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(cycle4.catalog::text,'UTF8')),'hex')
    OR attempt2.predecessor_cycle4_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(cycle4)||jsonb_build_object('proof_not_before',extract(epoch FROM cycle4.proof_not_before)))::text,'UTF8')),'hex')
    OR admin.predecessor_provider_digest<>'9da5d3dee7a4c3a45fea976b27fc2996e5b5d912741407c6be9954baefa1e106'
    OR admin.definition_digest<>'872bec621ba99e88c62b61cc2c5ab54725593bf424f18dae2c5442897d7f228b'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(attempt2.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_attempt2_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(attempt2)||jsonb_build_object('proof_not_before',extract(epoch FROM attempt2.proof_not_before)))::text,'UTF8')),'hex')
    OR at_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR at_baseline.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR at_baseline.source_chain IS DISTINCT FROM (SELECT encode(sha256(convert_to(string_agg(source_id||':'||encode(sha256(original_body),'hex'),'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_at_private.whole_originals_v2)
    OR renewal.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(at_baseline.catalog::text,'UTF8')),'hex')
    OR renewal.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(at_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM at_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(renewal.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(renewal)||jsonb_build_object('proof_not_before',extract(epoch FROM renewal.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=renewal.required_generation
 OR bg1_v3.proof_not_before<=renewal.proof_not_before
 OR acl_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR acl_v4.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(bg1_v3)||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR acl_v4.approved_dependency_key IS DISTINCT FROM 'shared:5:1255:91879:0:1260:16485:a'
 OR NOT (acl_v4.catalog ? 'shared:5:1255:91879:0:1260:16485:a') OR (bg1_v3.catalog ? 'shared:5:1255:91879:0:1260:16485:a')
 OR acl_v4.weather_function_digest IS DISTINCT FROM
   encode(sha256(convert_to(pg_get_functiondef('public.reisewetter_reservieren_v1()'::regprocedure),'UTF8')),'hex')
 OR acl_v4.weather_function_digest<>'9c9e0dc4a1c7cf48c60b434b32eb26f2c65805f9ab95e9c0ca832d7b5e1b27be'
 OR acl_v4.weather_acl_text IS DISTINCT FROM
   (SELECT proacl::text FROM pg_proc WHERE oid='public.reisewetter_reservieren_v1()'::regprocedure)
 OR acl_v4.weather_acl_text<>'{postgres=X/postgres,authenticated=X/postgres}'
 OR has_function_privilege('anon','public.reisewetter_reservieren_v1()','EXECUTE')
 OR has_function_privilege('service_role','public.reisewetter_reservieren_v1()','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.reisewetter_reservieren_v1()','EXECUTE')
 OR acl_v4.required_generation<=bg1_v3.required_generation
 OR acl_v4.proof_not_before<=bg1_v3.proof_not_before
 OR maintenance_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(acl_v4.catalog::text,'UTF8')),'hex')
 OR maintenance_v5.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(acl_v4)||jsonb_build_object('proof_not_before',extract(epoch FROM acl_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR maintenance_v5.required_generation<=acl_v4.required_generation
 OR maintenance_v5.proof_not_before<=acl_v4.proof_not_before
 OR cycle5_v6.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(maintenance_v5.catalog::text,'UTF8')),'hex')
 OR cycle5_v6.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(maintenance_v5)||jsonb_build_object('proof_not_before',extract(epoch FROM maintenance_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR cycle5_v6.attempt_key<>'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153' OR cycle5_v6.prior_retirement_count<>6
 OR cycle5_v6.required_generation<=maintenance_v5.required_generation
 OR cycle5_v6.proof_not_before<=maintenance_v5.proof_not_before
 OR maintenance_v5.catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton)
 OR cycle5_v6.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;

REVOKE ALL ON FUNCTION official_v3_guard_private.cycle5_snapshot_v1(),official_v3_guard_private.cycle5_check_retired_v1()
 FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO official_v3_guard_private.bg1_dev_cycle5_baseline_v6
 (singleton,predecessor_catalog_digest,predecessor_baseline_digest,attempt_key,
 prior_retirement_count,required_generation,proof_not_before,catalog)
 SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153',6,greatest(v.required_generation+1,s.generation+1),
 greatest(v.proof_not_before+interval '1 microsecond',clock_timestamp()),official_v3_guard_private.catalog_status_v1()
 FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 v
 CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton;
DO $post$
DECLARE snap jsonb;
BEGIN
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 snap:=official_v3_guard_private.cycle5_snapshot_v1();
 IF snap->>'kind'<>'ch_de_cycle5_unknown'
 OR snap#>>'{job,attemptKey}'<>'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153'
 OR snap#>>'{job,startCount}'<>'15'
 OR snap#>>'{job,operationCount}'<>'53'
 OR snap#>'{result,originals}' IS DISTINCT FROM '2'::jsonb
 OR snap#>'{result,qualifications}' IS DISTINCT FROM '1'::jsonb
 OR snap#>'{result,acceptedVersions}' IS DISTINCT FROM '0'::jsonb
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'unavailable'
 OR (SELECT count(*) FROM official_v3_guard_private.retired_cycle5_attempts_v1)<>0
 OR (SELECT catalog=official_v3_guard_private.catalog_status_v1() FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 WHERE singleton) IS DISTINCT FROM true
 OR (SELECT count(*) FROM official_v3_guard_private.owner_operations_v1 WHERE action='retire_unknown')<>6
 OR has_table_privilege('anon','official_v3_guard_private.retired_cycle5_attempts_v1','SELECT')
 OR has_function_privilege('anon','official_v3_guard_private.cycle5_snapshot_v1()','EXECUTE')
 THEN RAISE EXCEPTION 'CYCLE5_CATALOG_REVIEW_POSTCHECK_REFUSED' USING ERRCODE='P7906';END IF;
END $post$;
DO $negative$
DECLARE refused boolean:=false;
BEGIN
 BEGIN PERFORM public.official_v3_guard_retire_v1('op3_00000000000000000000000000000000',repeat('0',64));
 EXCEPTION WHEN SQLSTATE '42501' THEN refused:=true; END;
 IF NOT refused THEN RAISE EXCEPTION 'CYCLE5_OWNER_SESSION_BYPASS_REFUSED' USING ERRCODE='P7906';END IF;
END $negative$;
SELECT 'DEV_CYCLE5_EXACT_HISTORY_AND_AAL2_FAILCLOSED_ROLLBACK_PASS' result,
 (SELECT required_generation FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 WHERE singleton) next_required_proof,
 (SELECT catalog=official_v3_guard_private.catalog_status_v1() FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 WHERE singleton) catalog_current,
 false AS owner_approval_forged,false AS new_visa_fact_issued;
ROLLBACK;
