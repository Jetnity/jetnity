-- REFRESH_JOBS_BEGIN
  IF s.open_attempt='REFRESH_ATTEMPT' THEN
    PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
    SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt FOR SHARE;
    SELECT * INTO STRICT c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=t.claim_operation_id FOR SHARE;
    IF to_jsonb(s) IS DISTINCT FROM /* EXACT_SUBJECT */
      OR t.leased_job IS DISTINCT FROM s.current_job OR t.job_key IS DISTINCT FROM s.job_key
      OR t.claim_operation_id IS DISTINCT FROM 'REFRESH_CLAIM'
      OR t.claim_text::jsonb IS DISTINCT FROM /* EXACT_CLAIM */
      OR t.authority IS DISTINCT FROM s.method_binding||jsonb_build_object('epoch',1)
      OR t.reserved_at IS DISTINCT FROM 'REFRESH_RESERVED_AT'::timestamptz
      OR c.action IS DISTINCT FROM 'claim' OR c.job_key IS DISTINCT FROM s.job_key
      OR c.envelope_text::jsonb->'next' IS DISTINCT FROM t.leased_job
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
      OR clock_timestamp()<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz THEN
      RAISE EXCEPTION 'bg1 exact expired refresh original required' USING ERRCODE='P7906';
    END IF;
    fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision',
      'leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
    RETURN jsonb_build_object('refreshScope','ch_de_refresh_unknown','attemptKey',t.attempt_key,
      'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,'claim',t.claim_text::jsonb,
      'leasedJob',t.leased_job,'authority',t.authority,'fence',fence,'subjectState',to_jsonb(s),
      'startCount',s.start_count,'operationCount',s.operation_count,
      'startDigest',encode(sha256(convert_to((to_jsonb(t)||jsonb_build_object('reserved_at',extract(epoch FROM t.reserved_at)))::text,'UTF8')),'hex'),
      'claimDigest',encode(sha256(convert_to((to_jsonb(c)||jsonb_build_object('recorded_at',extract(epoch FROM c.recorded_at)))::text,'UTF8')),'hex'),
      'intakeOperationId','REFRESH_INTAKE','deliveryId','REFRESH_DELIVERY','runnerId','REFRESH_RUNNER',
      'inputRevision','snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9');
  END IF;
-- REFRESH_JOBS_END

-- REFRESH_HRS_BEGIN
  IF h.version_ref IS NOT NULL THEN
    IF to_jsonb(h) IS DISTINCT FROM /* EXACT_HRS_HEAD */
      OR (SELECT count(*) FROM official_v3_result_private.versions_v1)<>5
      OR (SELECT count(*) FROM official_v3_result_private.projections_v1)<>5
      OR (SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication')<>5
      OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1
        WHERE operation_id='REFRESH_INTAKE' OR command#>>'{intake,binding,operationId}'='REFRESH_INTAKE')
      OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 WHERE prepared#>>'{transition,operationId}'='REFRESH_INTAKE') THEN
      RAISE EXCEPTION 'bg1 exact previous refresh publications required' USING ERRCODE='P7906';
    END IF;
    SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1 WHERE reference='REFRESH_QUALIFICATION';
    IF q.kind IS DISTINCT FROM 'verification' OR q.decision_ref IS DISTINCT FROM 'REFRESH_DECISION'
      OR q.original_ids IS DISTINCT FROM /* EXACT_ORIGINAL_IDS */
      OR q.record#>'{history,pointer}' IS DISTINCT FROM /* EXACT_HISTORY_POINTER */ THEN
      RAISE EXCEPTION 'bg1 exact refresh source qualification required' USING ERRCODE='P7906';
    END IF;
    PERFORM official_v3_result_private.verification_v1(q.record,official_v3_result_private.selected_binding_v1(),false);
    SELECT /* REFRESH_HRS_INVENTORY */ INTO inventory;
    SELECT state_certificate INTO certificate FROM official_v3_result_private.binding_v1 WHERE singleton;
    RETURN jsonb_build_object('head',to_jsonb(h),'certificate',certificate,
      'originals',2,'qualifications',1,'versions',0,'publications',0,
      'priorVersions',5,'priorPublications',5,'qualificationRef',q.reference,'decisionRef',q.decision_ref,'inventory',inventory);
  END IF;
-- REFRESH_HRS_END

-- REFRESH_SNAPSHOT_BEGIN
  IF j->>'refreshScope'='ch_de_refresh_unknown' THEN
    PERFORM official_v3_guard_private.require_open_v1();
    s:=official_v3_guard_private.recovery_intake_v1(j);
    h:=official_v3_guard_private.recovery_hrs_v1();
    IF s IS DISTINCT FROM /* EXACT_INTAKE */
      OR h->'priorVersions' IS DISTINCT FROM '5'::jsonb
      OR h->'priorPublications' IS DISTINCT FROM '5'::jsonb
      OR h->>'decisionRef' IS DISTINCT FROM 'source-decision:v3:'||encode(sha256(convert_to(
        official_v3_guard_private.recovery_canonical_v1(jsonb_build_object('operationId',j->'intakeOperationId',
          'proposalDigest',s->'proposal_digest','contextKey',j#>'{leasedJob,contextKey}','method',j#>'{leasedJob,method}',
          'predecessor',h#>'{head,decision_ref}'),0),'UTF8')),'hex')
      OR (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)<>1
      OR (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)<>2
      OR clock_timestamp()<=(j#>>'{leasedJob,lease,expiresAt}')::timestamptz
      OR clock_timestamp()<=(s->>'expires_at')::timestamptz THEN
      RAISE EXCEPTION 'bg1 exact refresh custody required' USING ERRCODE='P7906';
    END IF;
    result_value:=jsonb_build_object('schema',1,'kind','ch_de_refresh_unknown',
      'originalEvidenceDigest','ORIGINAL_EVIDENCE_SHA256','job',j,'intake',s,'result',h,
      'previousRetirements',/* PREVIOUS_RETIREMENTS */);
    IF octet_length(result_value::text)>131072 THEN
      RAISE EXCEPTION 'bg1 bounded refresh snapshot required' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.require_open_v1();
    RETURN result_value;
  END IF;
-- REFRESH_SNAPSHOT_END

-- REFRESH_CLOSE_BEGIN
  ELSIF evidence->>'kind'='ch_de_refresh_unknown' THEN
    PERFORM official_v3_guard_private.begin_jobs_v1();
    IF attempt_value IS DISTINCT FROM 'REFRESH_ATTEMPT'
      OR evidence->>'originalEvidenceDigest' IS DISTINCT FROM 'ORIGINAL_EVIDENCE_SHA256'
      OR evidence#>'{job,subjectState}' IS DISTINCT FROM /* EXACT_SUBJECT */ THEN
      RAISE EXCEPTION 'bg1 exact refresh retirement required' USING ERRCODE='P7906'; END IF;
    UPDATE official_v3_jobs_private.subjects_v1 s SET open_attempt=NULL
      WHERE s.job_key=evidence#>>'{job,jobKey}' AND s.open_attempt=attempt_value
        AND to_jsonb(s)=evidence#>'{job,subjectState}'
        AND s.current_job=evidence#>'{job,leasedJob}'
        AND s.terminal_credit_claim=evidence#>>'{job,claimOperationId}'
        AND s.start_count=9 AND s.operation_count=41;
-- REFRESH_CLOSE_END

-- REFRESH_RETIRED_STATE_BEGIN
UNION ALL SELECT r.before_state FROM official_v3_guard_private.retired_refresh_attempts_v1 r
JOIN official_v3_guard_private.owner_operations_v1 op ON op.operation_id=r.owner_operation_id
WHERE r.attempt_key=attempt_value AND r.attempt_key='REFRESH_ATTEMPT'
  AND op.action='retire_unknown' AND op.recorded_at=r.retired_at
  AND op.expected_digest=encode(sha256(convert_to(r.before_state::text,'UTF8')),'hex')
  AND op.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
    'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
    'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
-- REFRESH_RETIRED_STATE_END

-- REFRESH_RESUME_BEGIN
  IF NOT FOUND THEN
    -- A permanently retired original has no resumable result custody. This
    -- exact read does not erase its START, restore a token or authorize work.
    -- The normal caller must still confirm the original claim and perform the
    -- full subsequent queue CAS and MA1 checks before a new START is possible.
    IF q#>>'{body,purpose}'='resume' AND t.attempt_key='REFRESH_ATTEMPT' THEN
      c:=official_v3_guard_private.retired_state_v1(t.attempt_key);
      IF c->>'kind'='ch_de_refresh_unknown'
        AND c->>'originalEvidenceDigest'='ORIGINAL_EVIDENCE_SHA256'
        AND c#>'{job,subjectState}'=/* EXACT_SUBJECT */
        AND c#>>'{job,attemptKey}'=t.attempt_key
        AND c#>>'{job,claimOperationId}'='REFRESH_CLAIM'
        AND c#>'{job,claim}'=claim AND claim=/* EXACT_CLAIM */
        AND c#>'{job,leasedJob}'=t.leased_job AND c#>'{job,authority}'=t.authority
        AND to_jsonb(s)=(c#>'{job,subjectState}'||jsonb_build_object('open_attempt',NULL))
        AND s.open_attempt IS NULL
        AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key) THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false);
      END IF;
    END IF;
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false);
  END IF;
-- REFRESH_RESUME_END

-- REFRESH_CHECK_JOBS_BEGIN
  IF evidence->>'kind'='ch_de_refresh_unknown' THEN
    IF evidence#>>'{job,attemptKey}' IS DISTINCT FROM 'REFRESH_ATTEMPT'
      OR evidence#>>'{job,claimOperationId}' IS DISTINCT FROM 'REFRESH_CLAIM'
      OR (SELECT encode(sha256(convert_to((to_jsonb(t)||jsonb_build_object('reserved_at',extract(epoch FROM t.reserved_at)))::text,'UTF8')),'hex')
        FROM official_v3_jobs_private.execution_starts_v1 t WHERE attempt_key='REFRESH_ATTEMPT') IS DISTINCT FROM evidence#>>'{job,startDigest}'
      OR (SELECT encode(sha256(convert_to((to_jsonb(c)||jsonb_build_object('recorded_at',extract(epoch FROM c.recorded_at)))::text,'UTF8')),'hex')
        FROM official_v3_jobs_private.queue_operations_v1 c WHERE operation_id='REFRESH_CLAIM') IS DISTINCT FROM evidence#>>'{job,claimDigest}' THEN
      RAISE EXCEPTION 'bg1 retained refresh execution changed' USING ERRCODE='P7906'; END IF;
  END IF;
-- REFRESH_CHECK_JOBS_END

-- REFRESH_CHECK_RETIREMENTS_BEGIN
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_refresh_attempts_v1 LOOP
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    IF retired.attempt_key IS DISTINCT FROM 'REFRESH_ATTEMPT' OR j->>'attemptKey' IS DISTINCT FROM retired.attempt_key
      OR retired.job_key IS DISTINCT FROM j->>'jobKey' OR retired.claim_operation_id IS DISTINCT FROM 'REFRESH_CLAIM'
      OR retired.claim_operation_id IS DISTINCT FROM j->>'claimOperationId'
      OR retired.intake_operation_id IS DISTINCT FROM 'REFRESH_INTAKE' OR retired.intake_operation_id IS DISTINCT FROM j->>'intakeOperationId'
      OR retired.before_state->'schema' IS DISTINCT FROM '1'::jsonb
      OR retired.before_state->>'kind' IS DISTINCT FROM 'ch_de_refresh_unknown'
      OR retired.before_state->>'originalEvidenceDigest' IS DISTINCT FROM 'ORIGINAL_EVIDENCE_SHA256'
      OR j->'subjectState' IS DISTINCT FROM /* EXACT_SUBJECT */
      OR retired.before_state->'previousRetirements' IS DISTINCT FROM /* PREVIOUS_RETIREMENTS */
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
-- REFRESH_CHECK_RETIREMENTS_END
