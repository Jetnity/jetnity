CREATE FUNCTION official_v3_guard_private.owner_session_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM jetnity_ot_auth.require_current_owner_session_v1();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'bg1 owner authority unavailable' USING ERRCODE='42501'; END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.current_method_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE;
BEGIN
  SELECT * INTO h FROM official_v3_method_private.heads_v1 WHERE method_id='jetnity-destination-primary-ch-de-visa' FOR SHARE;
  IF NOT FOUND OR h.revision<>1 OR h.method_digest<>'44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3'
    OR h.package_digest<>'0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9' THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('methodId',h.method_id,'revision',h.revision,'methodDigest',h.method_digest,
    'packageDigest',h.package_digest,'epoch',h.epoch,'status',h.status,'approvalMode',h.approval_mode,'approvalUntil',h.approval_until);
END $$;

CREATE FUNCTION official_v3_guard_private.fixed_method_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM official_v3_method_private.require_current_locked_v1('jetnity-destination-primary-ch-de-visa',1,
    '44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3',
    '0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9',1);
END $$;

CREATE FUNCTION official_v3_guard_private.recovery_jobs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  claim_record official_v3_jobs_private.queue_operations_v1%ROWTYPE; fence jsonb; seed text; revision_value text;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1
    WHERE kind='rule_research' AND current_job->>'contextKey'='official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    FOR UPDATE;
  PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
  SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt FOR SHARE;
  SELECT * INTO STRICT claim_record FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=t.claim_operation_id FOR SHARE;
  IF s.start_count<>1 OR s.operation_count<>2 OR s.current_job IS DISTINCT FROM t.leased_job
    OR s.current_job->>'state'<>'leased' OR s.current_job->'attempt'<>'1'::jsonb
    OR s.current_job#>>'{research,factKind}' IS DISTINCT FROM 'requirement_effect'
    OR s.current_job#>'{research,researchReason}' IS DISTINCT FROM '{"status":"missing"}'::jsonb
    OR s.job_key IS DISTINCT FROM (official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
      'context',s.current_job->'context','method',s.current_job->'method','factKind','requirement_effect',
      'researchReason',jsonb_build_object('status','missing')))->>'jobKey')
    OR s.current_job->'attemptLimit'<>'4'::jsonb OR s.terminal_credit_claim IS DISTINCT FROM t.claim_operation_id
    OR s.method_binding IS DISTINCT FROM jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1,
      'methodDigest','44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3',
      'packageDigest','0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9')
    OR t.authority IS DISTINCT FROM s.method_binding||jsonb_build_object('epoch',1)
    OR claim_record.action<>'claim' OR claim_record.envelope_text::jsonb->'next' IS DISTINCT FROM t.leased_job
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
    OR clock_timestamp()<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz THEN
    RAISE EXCEPTION 'bg1 exact expired first attempt required' USING ERRCODE='P7906';
  END IF;
  fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision',
    'leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
  revision_value:='snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9';
  seed:=official_v3_jobs_private.canonical_v1(jsonb_build_object('producerRevision',1,'inputRevision',revision_value,'job',t.leased_job,'fence',fence),0);
  RETURN jsonb_build_object('attemptKey',t.attempt_key,'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,
    'claim',t.claim_text::jsonb,'leasedJob',t.leased_job,'authority',t.authority,'fence',fence,
    'intakeOperationId','op3_'||substr(encode(sha256(convert_to('operation:'||seed,'UTF8')),'hex'),1,32),
    'deliveryId','delivery3_'||substr(encode(sha256(convert_to('delivery:'||seed,'UTF8')),'hex'),1,32),
    'runnerId','runner3_'||substr(encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
      'kind','aa_bern_ch_de_untrusted_delivery','producerRevision',1,'inputRevision',revision_value),0),'UTF8')),'hex'),1,32),
    'inputRevision',revision_value);
END $$;

CREATE FUNCTION official_v3_guard_private.recovery_intake_v1(job_value jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE o official_v3_intake_private.operations_v1%ROWTYPE; expected_binding jsonb; proposal jsonb;
BEGIN
  SELECT * INTO STRICT o FROM official_v3_intake_private.operations_v1 WHERE operation_id=job_value->>'intakeOperationId' FOR UPDATE;
  expected_binding:=jsonb_build_object('schema',3,'kind','proposal_intake_binding','operationId',job_value->'intakeOperationId',
    'jobId',job_value#>'{leasedJob,jobId}','contextKey',job_value#>'{leasedJob,contextKey}',
    'method',jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1),
    'runnerId',job_value->'runnerId','deliveryId',job_value->'deliveryId','inputRevision',job_value->'inputRevision');
  proposal:=convert_from(o.original_bytes,'UTF8')::jsonb;
  IF o.binding IS DISTINCT FROM expected_binding OR o.generation<>1
    OR clock_timestamp()<=o.expires_at OR NOT isfinite(o.expires_at)
    OR official_v3_guard_private.original_valid_v1(o.binding,convert_from(o.original_bytes,'UTF8'),o.proposal_digest) IS NOT TRUE
    OR proposal->'context' IS DISTINCT FROM job_value#>'{leasedJob,context}'
    OR proposal->'research' IS DISTINCT FROM job_value#>'{leasedJob,research}'
    OR (SELECT count(*) FROM official_v3_intake_private.reservations_v1 WHERE operation_id=o.operation_id)<>1
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id=o.operation_id) THEN
    RAISE EXCEPTION 'bg1 exact expired original required' USING ERRCODE='P7906';
  END IF;
  PERFORM official_v3_guard_private.check_s1_v1();
  RETURN (to_jsonb(o)-ARRAY['original_bytes','lease_token'])||jsonb_build_object('bytes',octet_length(o.original_bytes));
END $$;

CREATE FUNCTION official_v3_guard_private.recovery_hrs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; certificate text; q official_v3_result_private.qualifications_v1%ROWTYPE;
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
    OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1 WHERE operation_kind IN ('version','publication','escalation'))
    OR (SELECT count(*) FROM official_v3_result_private.originals_v1)<>2
    OR (SELECT count(*) FROM official_v3_result_private.qualifications_v1)<>1 THEN
    RAISE EXCEPTION 'bg1 uncommitted first result required' USING ERRCODE='P7906';
  END IF;
  SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1 WHERE kind='verification';
  PERFORM official_v3_result_private.verification_v1(q.record,official_v3_result_private.selected_binding_v1(),false);
  IF jsonb_array_length(q.original_ids)<>2 OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(q.original_ids))<>2
    OR EXISTS(SELECT 1 FROM official_v3_result_private.originals_v1 o WHERE NOT q.original_ids ? o.version_id) THEN
    RAISE EXCEPTION 'bg1 exact first source qualification required' USING ERRCODE='P7906'; END IF;
  SELECT state_certificate INTO certificate FROM official_v3_result_private.binding_v1 WHERE singleton;
  RETURN jsonb_build_object('head',to_jsonb(h),'certificate',certificate,'originals',2,'qualifications',1,'versions',0,'publications',0);
END $$;

CREATE FUNCTION official_v3_guard_private.recovery_snapshot_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; s jsonb; h jsonb;
BEGIN
  PERFORM official_v3_guard_private.fixed_method_v1();
  j:=official_v3_guard_private.recovery_jobs_v1();
  s:=official_v3_guard_private.recovery_intake_v1(j);
  h:=official_v3_guard_private.recovery_hrs_v1();
  -- The global write lock excludes a new generation while the component locks
  -- are acquired. Recheck both original lease ends after every possible wait.
  IF clock_timestamp()<=(j#>>'{leasedJob,lease,expiresAt}')::timestamptz
    OR clock_timestamp()<=(s->>'expires_at')::timestamptz THEN
    RAISE EXCEPTION 'bg1 expired custody required' USING ERRCODE='P7906';
  END IF;
  RETURN jsonb_build_object('schema',1,'kind','ch_de_first_unknown','job',j,'intake',s,'result',h);
END $$;

CREATE FUNCTION official_v3_guard_private.retired_state_v1(attempt_value text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT before_state FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value
$$;

CREATE FUNCTION official_v3_guard_private.close_jobs_v1(attempt_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE evidence jsonb; count_value bigint;
BEGIN
  -- Mandatory at the lowest mutator, even when invoked directly by postgres.
  PERFORM official_v3_guard_private.owner_session_v1();
  evidence:=official_v3_guard_private.retired_state_v1(attempt_value);
  IF evidence IS NULL OR evidence#>>'{job,attemptKey}' IS DISTINCT FROM attempt_value THEN
    RAISE EXCEPTION 'bg1 immutable retirement required' USING ERRCODE='P7906';
  END IF;
  UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL
    WHERE job_key=evidence#>>'{job,jobKey}' AND open_attempt=attempt_value
      AND current_job=evidence#>'{job,leasedJob}' AND start_count=1 AND operation_count=2;
  GET DIAGNOSTICS count_value=ROW_COUNT;
  IF count_value<>1 THEN RAISE EXCEPTION 'bg1 retirement compare failed' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.seal_jobs_v1();
  PERFORM official_v3_guard_private.owner_session_v1();
END $$;

CREATE FUNCTION official_v3_guard_private.check_retired_jobs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=evidence#>>'{job,attemptKey}';
  IF t.job_key IS DISTINCT FROM evidence#>>'{job,jobKey}' OR t.claim_text::jsonb IS DISTINCT FROM evidence#>'{job,claim}'
    OR t.leased_job IS DISTINCT FROM evidence#>'{job,leasedJob}' OR t.authority IS DISTINCT FROM evidence#>'{job,authority}'
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE open_attempt=t.attempt_key) THEN
    RAISE EXCEPTION 'bg1 retired job changed' USING ERRCODE='P7906';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_retired_s1_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE o official_v3_intake_private.operations_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT o FROM official_v3_intake_private.operations_v1 WHERE operation_id=evidence#>>'{job,intakeOperationId}';
  IF (to_jsonb(o)-ARRAY['original_bytes','lease_token'])||jsonb_build_object('bytes',octet_length(o.original_bytes)) IS DISTINCT FROM evidence->'intake'
    OR encode(sha256(o.original_bytes),'hex') IS DISTINCT FROM o.proposal_digest
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id=o.operation_id) THEN
    RAISE EXCEPTION 'bg1 retired intake changed' USING ERRCODE='P7906';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_retired_hrs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1
    WHERE operation_id=evidence#>>'{job,intakeOperationId}' OR command#>>'{intake,binding,operationId}'=evidence#>>'{job,intakeOperationId}')
    OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 WHERE prepared#>>'{transition,operationId}'=evidence#>>'{job,intakeOperationId}') THEN
    RAISE EXCEPTION 'bg1 retired intake publication' USING ERRCODE='P7906';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_retirements_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
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
END $$;

CREATE FUNCTION official_v3_guard_private.incident_snapshot_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  RETURN jsonb_build_object('schema',1,'kind','integrity_incident','generation',s.incident_generation,
    'resumedGeneration',s.resumed_generation,'incidentAt',s.incident_at,'proofGeneration',s.generation,
    'proofDue',s.last_due,'proofStarted',s.last_proof_started,'proofFinished',s.last_finished,'validUntil',s.valid_until,
    'method',official_v3_guard_private.current_method_v1());
END $$;

CREATE FUNCTION public.official_v3_guard_review_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE retirement jsonb; incident jsonb; snapshot jsonb;
BEGIN
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1) THEN retirement:=jsonb_build_object('status','closed');
  ELSE
    BEGIN
      snapshot:=official_v3_guard_private.recovery_snapshot_v1();
      retirement:=jsonb_build_object('status','reviewable','selection',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'),
        'attempt',1,'originals',2,'qualifications',1,'acceptedVersions',0,
        'leaseEndedAt',snapshot#>'{job,leasedJob,lease,expiresAt}');
    EXCEPTION WHEN SQLSTATE 'P7906' OR SQLSTATE 'P7504' OR no_data_found OR too_many_rows THEN retirement:=jsonb_build_object('status','unavailable'); END;
  END IF;
  incident:=official_v3_guard_private.incident_snapshot_v1();
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN jsonb_build_object('schema',1,'status','reviewed','retirement',retirement,
    'incident',jsonb_build_object('status',CASE WHEN incident->'generation'=incident->'resumedGeneration' THEN 'clear' ELSE 'blocked' END,
      'selection',encode(sha256(convert_to(incident::text,'UTF8')),'hex'),'generation',incident->'generation',
      'methodEpoch',incident#>'{method,epoch}','proofFinished',incident->'proofFinished','validUntil',incident->'validUntil',
      'canResume',COALESCE((incident->>'generation')::bigint>(incident->>'resumedGeneration')::bigint
        AND incident#>>'{method,status}'='approved'
        AND (incident->>'proofStarted')::timestamptz>(incident->>'incidentAt')::timestamptz
        AND clock_timestamp()<(incident->>'validUntil')::timestamptz,false)));
END $$;

CREATE FUNCTION public.official_v3_guard_retire_v1(p_operation_id text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE snapshot jsonb; prior official_v3_guard_private.owner_operations_v1%ROWTYPE; instant timestamptz; receipt_value jsonb;
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
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1) THEN RAISE EXCEPTION 'bg1 first attempt already closed' USING ERRCODE='P7906'; END IF;
  snapshot:=official_v3_guard_private.recovery_snapshot_v1();
  IF encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') IS DISTINCT FROM p_selection THEN RAISE EXCEPTION 'bg1 reviewed state changed' USING ERRCODE='P7906'; END IF;
  instant:=clock_timestamp();
  receipt_value:=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown','operationId',p_operation_id,'selection',p_selection,
    'result','unknown_retired','recordedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO official_v3_guard_private.owner_operations_v1 VALUES(p_operation_id,'retire_unknown',p_selection,auth.uid(),instant,receipt_value);
  INSERT INTO official_v3_guard_private.retired_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
    snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  PERFORM official_v3_guard_private.close_jobs_v1(snapshot#>>'{job,attemptKey}');
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.fixed_method_v1();
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN receipt_value;
END $$;

CREATE FUNCTION public.official_v3_guard_resume_v1(p_operation_id text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE snapshot jsonb; prior official_v3_guard_private.owner_operations_v1%ROWTYPE; instant timestamptz; receipt_value jsonb;
BEGIN
  IF p_operation_id !~ '^op3_[a-f0-9]{32}$' OR p_selection !~ '^[a-f0-9]{64}$' OR p_operation_id IS NULL OR p_selection IS NULL THEN
    RAISE EXCEPTION 'bg1 fixed operation input' USING ERRCODE='P7901'; END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM pg_advisory_xact_lock(771106,1);
  SELECT * INTO prior FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=p_operation_id;
  IF FOUND THEN
    IF prior.action<>'resume' OR prior.expected_digest<>p_selection OR prior.actor_id<>auth.uid() THEN RAISE EXCEPTION 'bg1 operation collision' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.owner_session_v1(); RETURN prior.receipt;
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  snapshot:=official_v3_guard_private.incident_snapshot_v1(); instant:=clock_timestamp();
  IF encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') IS DISTINCT FROM p_selection
    OR snapshot->>'proofStarted' IS NULL OR snapshot->>'proofFinished' IS NULL OR snapshot->>'validUntil' IS NULL
    OR snapshot#>>'{method,status}' IS DISTINCT FROM 'approved'
    OR (snapshot->>'generation')::bigint<=(snapshot->>'resumedGeneration')::bigint
    OR (snapshot->>'proofStarted')::timestamptz<=(snapshot->>'incidentAt')::timestamptz
    OR (snapshot->>'proofFinished')::timestamptz>instant OR instant>=(snapshot->>'validUntil')::timestamptz
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run_row WHERE run_row.generation=(snapshot->>'proofGeneration')::bigint
      AND run_row.outcome='complete' AND run_row.incident_generation=(snapshot->>'generation')::bigint
      AND run_row.proof_started_at=(snapshot->>'proofStarted')::timestamptz
      AND run_row.finished_at=(snapshot->>'proofFinished')::timestamptz AND run_row.due_at=(snapshot->>'proofDue')::timestamptz
      AND run_row.due_at+interval '5 minutes 30 seconds'=(snapshot->>'validUntil')::timestamptz) THEN
    RAISE EXCEPTION 'bg1 fresh post-incident proof required' USING ERRCODE='P7906'; END IF;
  receipt_value:=jsonb_build_object('schema',1,'status','recorded','action','resume','operationId',p_operation_id,'selection',p_selection,
    'result','resumed','generation',snapshot->'generation','recordedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO official_v3_guard_private.owner_operations_v1 VALUES(p_operation_id,'resume',p_selection,auth.uid(),instant,receipt_value);
  UPDATE official_v3_guard_private.state_v1 SET resumed_generation=incident_generation,last_observed=greatest(last_observed,instant)
    WHERE singleton AND incident_generation=(snapshot->>'generation')::bigint;
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_method_private.require_current_locked_v1(snapshot#>>'{method,methodId}',(snapshot#>>'{method,revision}')::integer,
    snapshot#>>'{method,methodDigest}',snapshot#>>'{method,packageDigest}',(snapshot#>>'{method,epoch}')::integer);
  RETURN receipt_value;
END $$;

CREATE FUNCTION public.official_v3_guard_confirm_v1(p_operation_id text,p_action text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE prior official_v3_guard_private.owner_operations_v1%ROWTYPE;
BEGIN
  PERFORM official_v3_guard_private.owner_session_v1();
  IF p_operation_id !~ '^op3_[a-f0-9]{32}$' OR p_selection !~ '^[a-f0-9]{64}$' OR p_action NOT IN ('retire_unknown','resume')
    OR p_operation_id IS NULL OR p_selection IS NULL OR p_action IS NULL THEN RAISE EXCEPTION 'bg1 fixed confirmation input' USING ERRCODE='P7901'; END IF;
  SELECT * INTO prior FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=p_operation_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('schema',1,'status','absent'); END IF;
  IF prior.action<>p_action OR prior.expected_digest<>p_selection OR prior.actor_id<>auth.uid() THEN RAISE EXCEPTION 'bg1 operation collision' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN prior.receipt;
END $$;
