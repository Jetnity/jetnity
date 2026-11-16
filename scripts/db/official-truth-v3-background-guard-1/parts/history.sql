CREATE FUNCTION official_v3_guard_private.check_hma_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE o record; r record; m text; previous jsonb; expected jsonb; after_value jsonb;
  epoch_value integer; head_value jsonb; last_operation text; last_actor uuid; last_at timestamptz;
BEGIN
  LOCK TABLE official_v3_method_private.revisions_v1,official_v3_method_private.heads_v1,
    official_v3_method_private.operations_v1 IN SHARE MODE;
  FOR r IN SELECT * FROM official_v3_method_private.revisions_v1 LOOP
    IF official_v3_method_private.tuple_valid_v1(r.method_id,r.revision,r.method_digest,r.package_digest) IS NOT TRUE
      OR (r.revision=1 AND r.predecessor_revision IS NOT NULL)
      OR (r.revision>1 AND (r.predecessor_revision IS DISTINCT FROM r.revision-1 OR NOT EXISTS(
        SELECT 1 FROM official_v3_method_private.revisions_v1 p WHERE p.method_id=r.method_id AND p.revision=r.predecessor_revision)))
      OR NOT EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 s WHERE s.action='stage'
        AND s.method_id=r.method_id AND s.revision=r.revision AND s.actor_id=r.staged_by AND s.recorded_at=r.staged_at
        AND s.command->>'methodDigest'=r.method_digest AND s.command->>'packageDigest'=r.package_digest) THEN
      RAISE EXCEPTION 'bg1 method revision history' USING ERRCODE='P7905';
    END IF;
  END LOOP;
  FOR o IN SELECT * FROM official_v3_method_private.operations_v1 LOOP
    IF o.command IS DISTINCT FROM official_v3_method_private.command_v1(o.operation_id,o.action,o.method_id,o.revision,
      o.command->>'methodDigest',o.command->>'packageDigest',(o.command->>'predecessorRevision')::integer,
      (o.command#>>'{expected,revision}')::integer,o.command#>>'{expected,methodDigest}',o.command#>>'{expected,packageDigest}',
      (o.command#>>'{expected,epoch}')::integer,o.command#>>'{expected,status}',o.command#>>'{approval,mode}',o.command#>>'{approval,until}')
      OR NOT EXISTS(SELECT 1 FROM official_v3_method_private.revisions_v1 rev_row WHERE rev_row.method_id=o.method_id
        AND rev_row.revision=o.revision AND rev_row.method_digest=o.command->>'methodDigest' AND rev_row.package_digest=o.command->>'packageDigest')
      OR NOT isfinite(o.recorded_at) THEN RAISE EXCEPTION 'bg1 method command history' USING ERRCODE='P7905'; END IF;
    IF o.action='stage' AND (o.before_state IS DISTINCT FROM o.after_state OR
      (o.before_state IS NOT NULL AND NOT EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 prior
        WHERE prior.method_id=o.method_id AND prior.action IN ('approve','revoke') AND prior.after_state=o.before_state
          AND prior.recorded_at<=o.recorded_at))
      OR EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 newer WHERE newer.method_id=o.method_id
        AND newer.action IN ('approve','revoke') AND newer.recorded_at<o.recorded_at
        AND (o.before_state IS NULL OR (newer.after_state->>'epoch')::integer>(o.before_state->>'epoch')::integer))) THEN
      RAISE EXCEPTION 'bg1 method stage snapshot' USING ERRCODE='P7905';
    END IF;
  END LOOP;
  FOR m IN SELECT method_id FROM official_v3_method_private.revisions_v1
    UNION SELECT method_id FROM official_v3_method_private.heads_v1
    UNION SELECT method_id FROM official_v3_method_private.operations_v1 LOOP
    previous:=NULL; epoch_value:=0; last_operation:=NULL;
    FOR o IN SELECT * FROM official_v3_method_private.operations_v1 WHERE method_id=m AND action IN ('approve','revoke')
      ORDER BY (after_state->>'epoch')::integer LOOP
      epoch_value:=epoch_value+1;
      expected:=jsonb_build_object('revision',previous->'revision','methodDigest',previous->'methodDigest',
        'packageDigest',previous->'packageDigest','epoch',epoch_value-1,'status',previous->'status');
      IF o.before_state IS DISTINCT FROM previous OR o.command->'expected' IS DISTINCT FROM expected
        OR (o.after_state->>'epoch')::integer IS DISTINCT FROM epoch_value
        OR (epoch_value=1 AND (o.action<>'approve' OR o.revision<>1))
        OR (o.action='approve' AND previous IS NOT NULL AND o.revision::bigint NOT IN ((previous->>'revision')::bigint,(previous->>'revision')::bigint+1))
        OR (o.action='approve' AND o.command#>>'{approval,mode}'='until'
          AND official_v3_method_private.timestamp_v1(o.command#>>'{approval,until}')<=o.recorded_at)
        OR (o.action='revoke' AND (previous->>'status' IS DISTINCT FROM 'approved'
          OR o.revision IS DISTINCT FROM (previous->>'revision')::integer
          OR o.command->'methodDigest' IS DISTINCT FROM previous->'methodDigest'
          OR o.command->'packageDigest' IS DISTINCT FROM previous->'packageDigest')) THEN
        RAISE EXCEPTION 'bg1 method epoch chain' USING ERRCODE='P7905';
      END IF;
      after_value:=jsonb_build_object('methodId',m,'revision',o.revision,'methodDigest',o.command->'methodDigest',
        'packageDigest',o.command->'packageDigest','epoch',epoch_value,'status',CASE o.action WHEN 'approve' THEN 'approved' ELSE 'revoked' END,
        'approvalMode',CASE WHEN o.action='approve' THEN o.command#>'{approval,mode}' ELSE 'null'::jsonb END,
        'approvalUntil',CASE WHEN o.action='approve' THEN o.command#>'{approval,until}' ELSE 'null'::jsonb END);
      IF o.after_state IS DISTINCT FROM after_value THEN RAISE EXCEPTION 'bg1 method after state' USING ERRCODE='P7905'; END IF;
      previous:=after_value; last_operation:=o.operation_id; last_actor:=o.actor_id; last_at:=o.recorded_at;
    END LOOP;
    SELECT jsonb_build_object('methodId',h.method_id,'revision',h.revision,'methodDigest',h.method_digest,
      'packageDigest',h.package_digest,'epoch',h.epoch,'status',h.status,'approvalMode',h.approval_mode,
      'approvalUntil',to_char(h.approval_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) INTO head_value
      FROM official_v3_method_private.heads_v1 h WHERE h.method_id=m;
    IF head_value IS DISTINCT FROM previous OR (previous IS NOT NULL AND NOT EXISTS(
      SELECT 1 FROM official_v3_method_private.heads_v1 h WHERE h.method_id=m AND h.operation_id=last_operation
        AND h.changed_by=last_actor AND h.changed_at=last_at)) THEN
      RAISE EXCEPTION 'bg1 method current head' USING ERRCODE='P7905';
    END IF;
  END LOOP;
END $$;

CREATE FUNCTION official_v3_guard_private.check_s1_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE o record; r record; c record; generation_value integer; last_expiry timestamptz; last_token uuid; last_acquired timestamptz;
  text_value text; proposal jsonb;
BEGIN
  LOCK TABLE official_v3_intake_private.operations_v1,official_v3_intake_private.reservations_v1,
    official_v3_intake_private.completions_v1 IN SHARE MODE;
  FOR o IN SELECT * FROM official_v3_intake_private.operations_v1 LOOP
    text_value:=convert_from(o.original_bytes,'UTF8'); proposal:=text_value::jsonb;
    IF official_v3_guard_private.original_valid_v1(o.binding,text_value,o.proposal_digest) IS NOT TRUE
      OR NOT isfinite(o.created_at)
      OR o.operation_id IS DISTINCT FROM o.binding->>'operationId'
      OR octet_length(o.original_bytes) NOT BETWEEN 1 AND 65536 OR o.proposal_digest IS DISTINCT FROM encode(sha256(o.original_bytes),'hex')
      OR official_v3_intake_private.unique_json_v1(text_value::json,0) IS NOT TRUE
      OR official_v3_intake_private.proposal_retainable_v1(proposal) IS NOT TRUE
      OR proposal->>'operationId' IS DISTINCT FROM o.operation_id OR proposal->'jobId' IS DISTINCT FROM o.binding->'jobId'
      OR proposal->'contextKey' IS DISTINCT FROM o.binding->'contextKey' THEN
      RAISE EXCEPTION 'bg1 intake original history' USING ERRCODE='P7905';
    END IF;
    generation_value:=0; last_expiry:=NULL; last_token:=NULL; last_acquired:=NULL;
    FOR r IN SELECT * FROM official_v3_intake_private.reservations_v1 WHERE operation_id=o.operation_id ORDER BY generation LOOP
      generation_value:=generation_value+1;
      IF r.generation<>generation_value OR NOT isfinite(r.acquired_at) OR NOT isfinite(r.expires_at)
        OR r.expires_at<=r.acquired_at OR r.expires_at>r.acquired_at+interval '900 seconds'
        OR r.acquired_at<last_expiry OR r.lease_token IS NOT DISTINCT FROM last_token THEN
        RAISE EXCEPTION 'bg1 intake reservation chain' USING ERRCODE='P7905';
      END IF;
      last_expiry:=r.expires_at; last_token:=r.lease_token; last_acquired:=r.acquired_at;
    END LOOP;
    IF o.generation<>generation_value OR o.lease_token IS DISTINCT FROM last_token
      OR o.acquired_at IS DISTINCT FROM last_acquired OR o.expires_at IS DISTINCT FROM last_expiry THEN
      RAISE EXCEPTION 'bg1 intake reservation head' USING ERRCODE='P7905';
    END IF;
    SELECT * INTO c FROM official_v3_intake_private.completions_v1 WHERE operation_id=o.operation_id;
    IF FOUND AND (c.generation<>generation_value OR c.lease_token IS DISTINCT FROM last_token
      OR c.completed_at>=last_expiry OR NOT isfinite(c.completed_at)
      OR official_v3_guard_private.completion_valid_v1(o.binding,o.proposal_digest,octet_length(o.original_bytes),
        c.generation,c.lease_token,c.outcome,c.audit) IS NOT TRUE
      OR c.escalation_key IS DISTINCT FROM CASE WHEN c.outcome->>'status'='escalation' THEN c.outcome->>'key' END
      OR (c.audit->>'recordedAt')::timestamptz>c.completed_at) THEN
      RAISE EXCEPTION 'bg1 intake completion history' USING ERRCODE='P7905';
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM official_v3_intake_private.reservations_v1 res_row LEFT JOIN official_v3_intake_private.operations_v1 op_row USING(operation_id) WHERE op_row.operation_id IS NULL)
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 completion_row LEFT JOIN official_v3_intake_private.operations_v1 op_row USING(operation_id) WHERE op_row.operation_id IS NULL) THEN
    RAISE EXCEPTION 'bg1 intake orphan history' USING ERRCODE='P7905';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_method_link_v1(authority_value jsonb,at_value timestamptz) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF jsonb_typeof(authority_value) IS DISTINCT FROM 'object'
    OR (authority_value ?& ARRAY['methodId','revision','methodDigest','packageDigest','epoch']) IS NOT TRUE
    OR EXISTS(SELECT 1 FROM jsonb_object_keys(authority_value) key WHERE key<>ALL(ARRAY['methodId','revision','methodDigest','packageDigest','epoch']))
    OR NOT isfinite(at_value) OR NOT EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 o
      WHERE o.method_id=authority_value->>'methodId' AND o.action='approve'
        AND (o.after_state-'status'-'approvalMode'-'approvalUntil')=authority_value AND o.recorded_at<=at_value
        AND (o.after_state->>'approvalMode'='until_revoked' OR (o.after_state->>'approvalUntil')::timestamptz>at_value)
        AND NOT EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 newer WHERE newer.method_id=o.method_id
          AND newer.action IN ('approve','revoke') AND (newer.after_state->>'epoch')::bigint>(authority_value->>'epoch')::bigint
          AND newer.recorded_at<at_value)) THEN
    RAISE EXCEPTION 'bg1 historical method link' USING ERRCODE='P7905'; END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_jobs_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE k text; x record; ref jsonb; opened jsonb; subject_row record;
  prior jsonb; envelope jsonb; next_revision bigint; head_count bigint;
BEGIN
  LOCK TABLE official_v3_jobs_private.subjects_v1,official_v3_jobs_private.queue_operations_v1,
    official_v3_jobs_private.execution_starts_v1,official_v3_jobs_private.execution_results_v1,
    official_v3_jobs_private.execution_dispositions_v1,official_v3_jobs_private.slots_v1 IN SHARE MODE;
  FOR k IN SELECT job_key FROM official_v3_jobs_private.subjects_v1 ORDER BY job_key COLLATE "C" LOOP
    PERFORM official_v3_jobs_private.assert_history_v1(k);
    SELECT * INTO STRICT subject_row FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
    prior:='null'::jsonb; next_revision:=1; head_count:=0;
    -- The predecessor validates each transition separately. BG1 additionally
    -- reconstructs the one complete journal chain and its exact retained head.
    -- Deduplicated enqueues do not advance revisions and are checked below.
    FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k
      AND envelope_text::jsonb->'expected' IS DISTINCT FROM envelope_text::jsonb->'next'
      ORDER BY (envelope_text::jsonb#>>'{next,revision}')::bigint LOOP
      envelope:=x.envelope_text::jsonb;
      IF envelope->'expected' IS DISTINCT FROM prior OR (envelope#>>'{next,revision}')::bigint<>next_revision
        OR NOT isfinite(x.recorded_at)
        OR (x.authority-'epoch') IS DISTINCT FROM subject_row.method_binding THEN
        RAISE EXCEPTION 'bg1 complete jobs chain' USING ERRCODE='P7905'; END IF;
      prior:=envelope->'next'; next_revision:=next_revision+1; head_count:=head_count+1;
    END LOOP;
    IF head_count=0 OR subject_row.current_job IS DISTINCT FROM prior THEN
      RAISE EXCEPTION 'bg1 exact jobs journal head' USING ERRCODE='P7905'; END IF;
    FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k
      AND envelope_text::jsonb->'expected' IS NOT DISTINCT FROM envelope_text::jsonb->'next' LOOP
      envelope:=x.envelope_text::jsonb;
      IF x.action<>'enqueue' OR envelope#>>'{audit,kind}' IS DISTINCT FROM 'deduplicated'
        OR NOT isfinite(x.recorded_at)
        OR (x.authority-'epoch') IS DISTINCT FROM subject_row.method_binding
        OR NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.job_key=k
          AND q.envelope_text::jsonb->'expected' IS DISTINCT FROM q.envelope_text::jsonb->'next'
          AND q.envelope_text::jsonb->'next'=envelope->'expected') THEN
        RAISE EXCEPTION 'bg1 deduplicated jobs chain' USING ERRCODE='P7905'; END IF;
    END LOOP;
    -- A same-revision dedup attaches to its exact immutable chain node. Client
    -- observedAt values are not a global serialization clock; do not order
    -- otherwise valid concurrent historical requests by their observation time.
  END LOOP;
  FOR x IN SELECT authority,recorded_at AS checked_at FROM official_v3_jobs_private.queue_operations_v1
    UNION ALL SELECT authority,reserved_at FROM official_v3_jobs_private.execution_starts_v1 LOOP
    PERFORM official_v3_guard_private.check_method_link_v1(x.authority,x.checked_at);
  END LOOP;
  FOR x IN SELECT t.*,r.result,r."references" FROM official_v3_jobs_private.execution_starts_v1 t
    JOIN official_v3_jobs_private.execution_results_v1 r USING(attempt_key) LOOP
    FOR ref IN SELECT value FROM jsonb_array_elements(x."references") LOOP
      PERFORM official_v3_jobs_private.reference_v1(ref);
      opened:=official_v3_jobs_private.s1_read_v1(ref->'binding',ref->>'proposalDigest',(ref->>'bytes')::integer);
      IF opened#>'{record,reference}' IS DISTINCT FROM ref THEN RAISE EXCEPTION 'bg1 jobs intake reference' USING ERRCODE='P7905'; END IF;
      PERFORM official_v3_jobs_private.consume_s1_v1(opened,x.leased_job,x.result,'read');
    END LOOP;
  END LOOP;
END $$;

CREATE FUNCTION official_v3_guard_private.hrs_certificate_v1() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT state_certificate FROM official_v3_result_private.binding_v1 WHERE singleton
$$;

CREATE FUNCTION official_v3_guard_private.check_hrs_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE q record; b jsonb:=official_v3_result_private.selected_binding_v1();
BEGIN
  LOCK TABLE official_v3_result_private.archive_pages_v1,official_v3_result_private.binding_v1,
    official_v3_result_private.decisions_v1,official_v3_result_private.extractions_v1,
    official_v3_result_private.heads_v1,official_v3_result_private.monitor_schedule_v1,
    official_v3_result_private.operations_v1,official_v3_result_private.originals_v1,
    official_v3_result_private.outbox_v1,official_v3_result_private.projections_v1,
    official_v3_result_private.qualifications_v1,official_v3_result_private.versions_v1 IN SHARE MODE;
  PERFORM official_v3_result_private.assert_history_v1();
  IF EXISTS(SELECT 1 FROM official_v3_result_private.originals_v1 o WHERE o.raw_digest IS DISTINCT FROM encode(sha256(convert_to(o.body_text,'UTF8')),'hex'))
    OR (SELECT state_certificate FROM official_v3_result_private.binding_v1 WHERE singleton)
      IS DISTINCT FROM official_v3_result_private.state_fingerprint_v1() THEN
    RAISE EXCEPTION 'bg1 result content certificate' USING ERRCODE='P7905';
  END IF;
  FOR q IN SELECT * FROM official_v3_result_private.qualifications_v1 WHERE kind='verification' LOOP
    PERFORM official_v3_result_private.verification_v1(q.record,b,false);
  END LOOP;
END $$;
