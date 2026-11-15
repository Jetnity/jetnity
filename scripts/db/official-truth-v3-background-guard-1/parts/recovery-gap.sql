SET LOCAL jetnity.bg1_gap_target='dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY3';
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';

/* GAP_CONTEXT */
/* GAP_PREFLIGHT */

-- Only existing owners receive transaction-local SET/CREATE. Their original
-- membership rows, OIDs, grantors/options and the complete ACL are restored.
GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT CREATE ON SCHEMA official_v3_guard_private TO ot_v3_jobs_owner,ot_v3_intake_owner;

CREATE TABLE official_v3_guard_private.gap_recovery_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  recovery2_provider_digest text NOT NULL CHECK (recovery2_provider_digest='RECOVERY2_PROVIDER_SHA256'),
  predecessor_catalog_digest text NOT NULL CHECK (predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_recovery_digest text NOT NULL CHECK (predecessor_recovery_digest ~ '^[a-f0-9]{64}$'),
  required_generation bigint NOT NULL CHECK (required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK (isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.gap_recovery_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.gap_recovery_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.gap_recovery_baseline_v1 TO postgres USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.gap_recovery_baseline_v1
  FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.gap_recovery_baseline_v1
  FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON TABLE official_v3_guard_private.gap_recovery_baseline_v1
  FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;

/* GAP_FUNCTIONS */

REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner,ot_v3_intake_owner;
REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres;

/* GAP_SUFFIX */

-- The generator embeds each following closed block twice, then removes these
-- definitions. Both current review and immutable retrospective proof use the
-- same real journal comparison; neither block creates a business row.
-- GAP_JOBS_BEGIN
DECLARE gap_claim official_v3_jobs_private.queue_operations_v1%ROWTYPE;
  gap_start official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  gap_row official_v3_jobs_private.queue_operations_v1%ROWTYPE;
  gap_number integer:=1; gap_previous jsonb; gap_next jsonb; gap_retired jsonb;
  gap_preceding jsonb; gap_fence jsonb; gap_seed text; gap_value jsonb;
BEGIN
  IF candidate#>'{leasedJob,attempt}' IS DISTINCT FROM '4'::jsonb
    OR candidate#>'{leasedJob,attemptLimit}' IS DISTINCT FROM '4'::jsonb
    OR candidate->'startCount' IS DISTINCT FROM '3'::jsonb
    OR candidate#>'{leasedJob,revision}' IS DISTINCT FROM '5'::jsonb
    OR candidate#>'{leasedJob,lease,generation}' IS DISTINCT FROM '5'::jsonb
    OR candidate#>>'{leasedJob,state}' IS DISTINCT FROM 'leased'
    OR candidate#>>'{leasedJob,contextKey}' IS DISTINCT FROM 'official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    OR candidate->'authority' IS DISTINCT FROM jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1,
      'methodDigest','44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3',
      'packageDigest','0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9','epoch',1)
    OR candidate->>'inputRevision' IS DISTINCT FROM 'snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9'
    OR jsonb_typeof(candidate->'preceding') IS DISTINCT FROM 'array'
    OR jsonb_array_length(candidate->'preceding')<>2 THEN
    RAISE EXCEPTION 'bg1 exact gap3 fourth-attempt scope required' USING ERRCODE='P7906';
  END IF;
  PERFORM official_v3_jobs_private.assert_history_v1(candidate->>'jobKey');
  -- Starts are counted as actual immutable rows, never inferred from attempt4.
  IF (SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1 x
      WHERE x.job_key=candidate->>'jobKey' AND x.leased_job->'jobId'=candidate#>'{leasedJob,jobId}')<>3 THEN
    RAISE EXCEPTION 'bg1 exact actual starts 1 2 4 required' USING ERRCODE='P7906';
  END IF;
  FOR gap_row IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 q
    WHERE q.job_key=candidate->>'jobKey' AND q.action='claim'
      AND q.envelope_text::jsonb#>'{next,jobId}'=candidate#>'{leasedJob,jobId}'
      AND q.envelope_text::jsonb#>>'{next,state}'='leased'
    ORDER BY (q.envelope_text::jsonb#>>'{next,attempt}')::integer LOOP
    gap_next:=gap_row.envelope_text::jsonb->'next';
    IF gap_number>4 OR gap_next->'attempt' IS DISTINCT FROM to_jsonb(gap_number)
      OR gap_next->'revision' IS DISTINCT FROM to_jsonb(gap_number+1)
      OR gap_next#>'{lease,generation}' IS DISTINCT FROM to_jsonb(gap_number+1)
      OR gap_next->>'state' IS DISTINCT FROM 'leased'
      OR gap_row.authority IS DISTINCT FROM candidate->'authority'
      OR gap_row.command_text::jsonb->>'action' IS DISTINCT FROM 'claim'
      OR gap_row.command_text::jsonb#>'{input,jobKey}' IS DISTINCT FROM candidate->'jobKey'
      OR gap_row.command_text::jsonb#>'{input,operationId}' IS DISTINCT FROM to_jsonb(gap_row.operation_id)
      OR gap_number=1 AND (gap_row.envelope_text::jsonb#>'{expected,attempt}' IS DISTINCT FROM '0'::jsonb
        OR gap_row.envelope_text::jsonb#>'{expected,revision}' IS DISTINCT FROM '1'::jsonb)
      OR gap_number>1 AND gap_row.envelope_text::jsonb->'expected' IS DISTINCT FROM gap_previous THEN
      RAISE EXCEPTION 'bg1 exact genuine four-claim prefix required' USING ERRCODE='P7906';
    END IF;
    IF gap_number=3 THEN
      gap_claim:=gap_row;
      IF EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 x
          WHERE x.claim_operation_id=gap_row.operation_id OR x.job_key=candidate->>'jobKey'
            AND x.leased_job->'jobId'=candidate#>'{leasedJob,jobId}' AND x.leased_job->'attempt'='3'::jsonb)
        OR clock_timestamp()<=(gap_next#>>'{lease,expiresAt}')::timestamptz THEN
        RAISE EXCEPTION 'bg1 genuine expired claim3 without execution required' USING ERRCODE='P7906';
      END IF;
    ELSE
      SELECT * INTO STRICT gap_start FROM official_v3_jobs_private.execution_starts_v1 x
        WHERE x.claim_operation_id=gap_row.operation_id;
      IF gap_start.job_key IS DISTINCT FROM candidate->>'jobKey'
        OR gap_start.leased_job IS DISTINCT FROM gap_next
        OR gap_start.authority IS DISTINCT FROM gap_row.authority
        OR gap_start.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(gap_row.command_text::jsonb->'input',0)
        OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=gap_start.attempt_key)
        OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=gap_start.attempt_key) THEN
        RAISE EXCEPTION 'bg1 gap proof actual execution binding' USING ERRCODE='P7906';
      END IF;
      IF gap_number<3 THEN
        gap_retired:=official_v3_guard_private.retired_state_v1(gap_start.attempt_key);
        gap_preceding:=jsonb_build_object('attemptKey',gap_start.attempt_key,'attempt',gap_number,
          'snapshotDigest',encode(sha256(convert_to(gap_retired::text,'UTF8')),'hex'),
          'intakeOperationId',gap_retired#>'{job,intakeOperationId}','proposalDigest',gap_retired#>'{intake,proposal_digest}');
        IF gap_retired IS NULL OR gap_retired#>'{job,leasedJob}' IS DISTINCT FROM gap_next
          OR gap_retired#>'{job,authority}' IS DISTINCT FROM gap_row.authority
          OR gap_retired->>'kind' IS DISTINCT FROM (CASE WHEN gap_number=1 THEN 'ch_de_first_unknown' ELSE 'ch_de_later_unknown' END)
          OR candidate->'preceding'->(gap_number-1) IS DISTINCT FROM gap_preceding THEN
          RAISE EXCEPTION 'bg1 gap proof real retired predecessors required' USING ERRCODE='P7906';
        END IF;
      ELSIF gap_start.attempt_key IS DISTINCT FROM candidate->>'attemptKey'
        OR gap_start.claim_operation_id IS DISTINCT FROM candidate->>'claimOperationId'
        OR gap_start.leased_job IS DISTINCT FROM candidate->'leasedJob'
        OR gap_start.claim_text::jsonb IS DISTINCT FROM candidate->'claim' THEN
        RAISE EXCEPTION 'bg1 gap proof actual fourth start required' USING ERRCODE='P7906';
      END IF;
    END IF;
    gap_previous:=gap_next; gap_number:=gap_number+1;
  END LOOP;
  IF gap_number<>5 OR gap_claim.operation_id IS NULL THEN
    RAISE EXCEPTION 'bg1 complete genuine claim prefix required' USING ERRCODE='P7906';
  END IF;
  gap_next:=gap_claim.envelope_text::jsonb->'next';
  gap_fence:=jsonb_build_object('jobId',gap_next->'jobId','revision',gap_next->'revision',
    'leaseId',gap_next#>'{lease,leaseId}','generation',gap_next#>'{lease,generation}');
  gap_seed:=official_v3_jobs_private.canonical_v1(jsonb_build_object('producerRevision',1,
    'inputRevision',candidate->'inputRevision','job',gap_next,'fence',gap_fence),0);
  gap_value:=jsonb_build_array(jsonb_build_object('kind','claim_without_execution_start','attempt',3,
    'queueOperation',to_jsonb(gap_claim)||jsonb_build_object('recorded_at',extract(epoch FROM gap_claim.recorded_at)),
    'intakeOperationId','op3_'||substr(encode(sha256(convert_to('operation:'||gap_seed,'UTF8')),'hex'),1,32)));
  IF candidate ? 'skippedClaims' THEN
    IF candidate->'skippedClaims' IS DISTINCT FROM gap_value THEN
      RAISE EXCEPTION 'bg1 immutable skipped claim proof changed' USING ERRCODE='P7906';
    END IF;
  ELSE
    candidate:=candidate||jsonb_build_object('skippedClaims',gap_value);
  END IF;
END;
-- GAP_JOBS_END

-- GAP_S1_BEGIN
DECLARE gap jsonb; gap_operation text;
BEGIN
  IF gap_job ? 'skippedClaims' THEN
    IF gap_job#>'{leasedJob,attempt}' IS DISTINCT FROM '4'::jsonb OR gap_job->'startCount' IS DISTINCT FROM '3'::jsonb
      OR jsonb_typeof(gap_job->'skippedClaims') IS DISTINCT FROM 'array'
      OR jsonb_array_length(gap_job->'skippedClaims')<>1 THEN
      RAISE EXCEPTION 'bg1 exact skipped intake scope required' USING ERRCODE='P7906';
    END IF;
    gap:=gap_job#>'{skippedClaims,0}'; gap_operation:=gap->>'intakeOperationId';
    IF gap->>'kind' IS DISTINCT FROM 'claim_without_execution_start' OR gap->'attempt' IS DISTINCT FROM '3'::jsonb
      OR (gap_operation ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE
      OR gap_operation IS NOT DISTINCT FROM gap_job->>'intakeOperationId' THEN
      RAISE EXCEPTION 'bg1 exact skipped intake binding required' USING ERRCODE='P7906';
    END IF;
    -- These existing owner bridges observe real absence while all S1 writers
    -- are excluded. No fabricated reservation, original or completion exists.
    LOCK TABLE official_v3_intake_private.operations_v1,official_v3_intake_private.reservations_v1,
      official_v3_intake_private.completions_v1 IN SHARE MODE;
    IF EXISTS(SELECT 1 FROM official_v3_intake_private.operations_v1 WHERE operation_id=gap_operation)
      OR EXISTS(SELECT 1 FROM official_v3_intake_private.reservations_v1 WHERE operation_id=gap_operation)
      OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id=gap_operation) THEN
      RAISE EXCEPTION 'bg1 skipped claim has actual intake history' USING ERRCODE='P7906';
    END IF;
  END IF;
END;
-- GAP_S1_END
