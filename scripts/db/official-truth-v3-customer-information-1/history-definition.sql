-- Additive invocation-local history-validation memo successor. No history, quota, deadline or authority change.
CREATE OR REPLACE FUNCTION official_v3_jobs_private.assert_history_v1(k text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp  AS $history_body$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb; envelope_canonical text COLLATE "default";
  validated_jobs jsonb:='{}'::jsonb; validated_job_count integer:=0; validated_job_bytes integer:=0; job_text text COLLATE "C"; job_bytes integer;
  memo_subject_kind text COLLATE "C"; memo_subject_text text COLLATE "C"; memo_subject_result jsonb; command_identity jsonb; quota jsonb;
  canonical_memo_key_one text COLLATE "C"; canonical_memo_key_two text COLLATE "C";
  canonical_memo_value_one text; canonical_memo_value_two text;
  canonical_memo_bytes_one integer:=0; canonical_memo_bytes_two integer:=0;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT count(*) INTO ops FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k;
  SELECT count(*),array_agg(t.attempt_key ORDER BY t.attempt_key) FILTER(WHERE d.attempt_key IS NULL AND NOT official_v3_guard_private.attempt_retired_v1(t.attempt_key)) INTO starts,unresolved
    FROM official_v3_jobs_private.execution_starts_v1 t LEFT JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key) WHERE t.job_key=k;
  quota:=official_v3_jobs_private.rolling_usage_v2(k);
  IF ops<>s.operation_count OR starts<>s.start_count
    OR (quota->>'operations')::integer+(quota->>'credit')::integer>256 OR (quota->>'starts')::integer>64 OR cardinality(unresolved)>1
    OR s.open_attempt IS DISTINCT FROM unresolved[1] THEN RAISE EXCEPTION 'm04 history invariant' USING ERRCODE='P7603'; END IF;
  PERFORM official_v3_jobs_private.job_v1(s.current_job);
  job_text:=s.current_job::text; job_bytes:=octet_length(job_text);
  IF job_bytes<=1048576 THEN
    validated_jobs:=jsonb_build_object(job_text,true); validated_job_count:=1; validated_job_bytes:=job_bytes;
  END IF;
  FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k LOOP
    command_identity:=NULL;
    DECLARE v jsonb:=x.command_text::jsonb;
      a text COLLATE "default":=v->>'action'; k text COLLATE "default":=v->>'kind'; i jsonb:=v->'input'; identity jsonb; jkey text COLLATE "default"; f jsonb; t text COLLATE "default";
      subject_input jsonb; subject_input_text text COLLATE "C"; subject_bytes integer;
    BEGIN
      IF v IS NULL THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
      t:=official_v3_jobs_private.canonical_v1(v,0);
      IF octet_length(t)>65536
        OR official_v3_jobs_private.exact_keys_v1(v,CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) IS NOT TRUE
        OR (a IN ('enqueue','claim','complete','fail')) IS NOT TRUE OR (i->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
      IF a='enqueue' THEN
        IF k='rule_research' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        ELSIF k='combination_discovery' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        ELSE RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        IF (i->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'attemptLimit') IS DISTINCT FROM 'number'
          OR (i->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE OR (i->>'attemptLimit')::integer NOT BETWEEN 1 AND 16 THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        subject_input:=i-'operationId'-'jobId'-'attemptLimit'; subject_input_text:=subject_input::text;
        IF memo_subject_kind COLLATE "C" = k COLLATE "C" AND memo_subject_text COLLATE "C" = subject_input_text COLLATE "C" THEN
          identity:=memo_subject_result;
        ELSE
          identity:=official_v3_jobs_private.subject_v1(k,subject_input);
          subject_bytes:=octet_length(k)+octet_length(subject_input_text);
          IF subject_bytes<=1048576 AND octet_length(identity::text)<=1048576-subject_bytes THEN
            memo_subject_kind:=k; memo_subject_text:=subject_input_text; memo_subject_result:=identity;
          END IF;
        END IF;
        jkey:=identity->>'jobKey';
      ELSE
        jkey:=i->>'jobKey';
        IF (jkey ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid locator' USING ERRCODE='P7601'; END IF;
        IF a='claim' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) IS NOT TRUE
            OR (i->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'leaseMilliseconds') IS DISTINCT FROM 'number'
            OR (i->>'leaseMilliseconds' ~ '^[1-9][0-9]{0,5}$') IS NOT TRUE OR (i->>'leaseMilliseconds')::integer>900000 THEN RAISE EXCEPTION 'm04 invalid claim' USING ERRCODE='P7601'; END IF;
        ELSE
          f:=i->'fence';
          IF official_v3_jobs_private.exact_keys_v1(f,ARRAY['jobId','revision','leaseId','generation']) IS NOT TRUE
            OR (f->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR (f->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE
            OR jsonb_typeof(f->'revision') IS DISTINCT FROM 'number' OR (f->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'revision')::numeric>2147483647
            OR jsonb_typeof(f->'generation') IS DISTINCT FROM 'number' OR (f->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'generation')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid fence' USING ERRCODE='P7601'; END IF;
          IF a='complete' THEN
            IF (k IN ('rule_research','combination_discovery')) IS NOT TRUE OR (k='rule_research')<>(jkey LIKE 'research-job:%')
              OR official_v3_jobs_private.exact_keys_v1(i,CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) IS NOT TRUE
              OR (COALESCE(i->>'decisionRef',i->>'discoveryRef') ~ CASE WHEN k='rule_research' THEN '^source-decision:v3:[a-f0-9]{64}$' ELSE '^combination-discovery-result:v3:[a-f0-9]{64}$' END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid completion' USING ERRCODE='P7601'; END IF;
          ELSE
            IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','fence','reason']) IS NOT TRUE
              OR (i->>'reason' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid failure' USING ERRCODE='P7601'; END IF;
          END IF;
        END IF;
        k:=CASE WHEN jkey LIKE 'research-job:%' THEN 'rule_research' ELSE 'combination_discovery' END;
      END IF;
      c:=jsonb_build_object('value',v,'commandText',t,'commandKey','queue-command:v3:'||encode(sha256(convert_to(t,'UTF8')),'hex'),
        'operationId',i->'operationId','jobKey',jkey,'subjectText',identity->'subjectText','action',a,'kind',k);
      command_identity:=identity;
    END;
    e:=x.envelope_text::jsonb;
    IF c->>'commandText'<>x.command_text OR c->>'commandKey'<>x.command_key OR c->>'operationId'<>x.operation_id OR c->>'jobKey'<>k THEN RAISE EXCEPTION 'm04 journal invariant' USING ERRCODE='P7603'; END IF;
    -- Reuse only bytes computed at the same canonical depth in this invocation.
    -- Two exact-text entries share a 64KiB key+value cap. No validation is skipped.
    DECLARE member_name text; child_value jsonb; child_key text COLLATE "C";
      child_canonical text; child_bytes bigint; canonical_parts text[]:='{}';
    BEGIN
      IF official_v3_jobs_private.exact_keys_v1(e,
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId']) IS TRUE THEN
        -- This is the original canonical object's exact ASCII member order.
        FOREACH member_name IN ARRAY ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId'] LOOP
          child_value:=e->member_name;
          IF member_name IN ('expected','next') THEN
            child_key:=child_value::text;
            IF child_key COLLATE "C" = canonical_memo_key_one COLLATE "C" THEN
              child_canonical:=canonical_memo_value_one;
            ELSIF child_key COLLATE "C" = canonical_memo_key_two COLLATE "C" THEN
              child_canonical:=canonical_memo_value_two;
            ELSE
              child_canonical:=official_v3_jobs_private.canonical_v1(child_value,1);
              child_bytes:=octet_length(child_key)::bigint+octet_length(child_canonical)::bigint;
              IF child_bytes<=65536 THEN
                IF child_bytes+canonical_memo_bytes_two<=65536 THEN
                  canonical_memo_key_one:=canonical_memo_key_two;
                  canonical_memo_value_one:=canonical_memo_value_two;
                  canonical_memo_bytes_one:=canonical_memo_bytes_two;
                ELSE
                  canonical_memo_key_one:=NULL; canonical_memo_value_one:=NULL; canonical_memo_bytes_one:=0;
                END IF;
                canonical_memo_key_two:=child_key; canonical_memo_value_two:=child_canonical;
                canonical_memo_bytes_two:=child_bytes::integer;
              END IF;
            END IF;
          ELSE
            child_canonical:=official_v3_jobs_private.canonical_v1(child_value,1);
          END IF;
          canonical_parts:=array_append(canonical_parts,'"'||member_name||'":'||child_canonical);
        END LOOP;
        envelope_canonical:='{'||array_to_string(canonical_parts,',')||'}';
      ELSE
        envelope_canonical:=official_v3_jobs_private.canonical_v1(e,0);
      END IF;
    END;
    IF envelope_canonical<>x.envelope_text OR e#>>'{audit,reference}'<>x.audit_reference THEN RAISE EXCEPTION 'm04 journal invariant' USING ERRCODE='P7603'; END IF;
    DECLARE command jsonb:=c->'value'; current_record jsonb:=e->'expected'; commit jsonb:=e;
      i jsonb:=command->'input'; expected jsonb; n jsonb; identity jsonb;
      a jsonb:=commit->'audit'; f jsonb:=i->'fence'; kind text COLLATE "default"; action text COLLATE "default":=command->>'action'; at_time timestamptz; end_time timestamptz;
      observed text COLLATE "default":=a->>'observedAt'; rev integer; delay_ms integer; result_key text COLLATE "default";
    BEGIN
      IF official_v3_jobs_private.exact_keys_v1(commit,ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']) IS NOT TRUE
        OR octet_length(envelope_canonical)>196608
        OR official_v3_jobs_private.exact_keys_v1(a,ARRAY['reference','kind','observedAt','priorRevision','nextRevision']) IS NOT TRUE
        OR commit->'operationId' IS DISTINCT FROM c->'operationId' OR commit->'commandKey' IS DISTINCT FROM c->'commandKey'
        OR commit->'jobKey' IS DISTINCT FROM c->'jobKey' OR commit->'expected' IS DISTINCT FROM current_record THEN RAISE EXCEPTION 'm04 invalid transition' USING ERRCODE='P7601'; END IF;
      at_time:=official_v3_jobs_private.timestamp_v1(observed); end_time:=at_time+interval '5 seconds';
      IF current_record IS DISTINCT FROM 'null'::jsonb THEN
        job_text:=current_record::text;
        IF job_text IS NULL OR (validated_jobs ? job_text) IS NOT TRUE THEN
          expected:=official_v3_jobs_private.job_v1(current_record);
          job_bytes:=octet_length(job_text);
          IF job_bytes<=1048576 THEN
            -- Admit the just-validated exact bytes even after the bounded memo fills.
            -- A reset can cause revalidation, never skip validation of a new value.
            IF validated_job_count>=256 OR job_bytes>1048576-validated_job_bytes THEN
              validated_jobs:='{}'::jsonb; validated_job_count:=0; validated_job_bytes:=0;
            END IF;
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;
        ELSE expected:=current_record;
        END IF;
        IF COALESCE(expected->'jobKey',expected#>'{identity,jobKey}') IS DISTINCT FROM c->'jobKey' OR expected->>'updatedAt'>observed THEN RAISE EXCEPTION 'm04 invalid prior' USING ERRCODE='P7601'; END IF;
      END IF;
      rev:=COALESCE((expected->>'revision')::integer,0)+1;
      IF action='enqueue' THEN
        IF expected->>'state' IN ('queued','leased','backoff') THEN n:=expected; kind:='deduplicated';
        ELSE
          IF expected->'jobId'=i->'jobId' THEN RAISE EXCEPTION 'm04 repeated cycle' USING ERRCODE='P7601'; END IF;
          n:=jsonb_build_object('schema',3,'jobId',i->'jobId','operationId',i->'operationId','revision',rev,'predecessorRevision',expected->'revision',
            'state','queued','createdAt',observed,'updatedAt',observed,'attempt',0,'attemptLimit',i->'attemptLimit','lease',NULL,'nextAttemptAt',NULL,'lastFailure',NULL);
          identity:=command_identity;
          IF command->>'kind'='rule_research' THEN n:=n||jsonb_build_object('kind','research_job_record','jobKey',identity->'jobKey',
            'context',i->'context','contextKey',identity->'contextKey','research',identity->'research','method',i->'method','resultDecisionRef',NULL);
          ELSE n:=n||jsonb_build_object('kind','combination_discovery_job_record','identity',(i-'operationId'-'jobId'-'attemptLimit')||jsonb_build_object('kind','combination_discovery','jobKey',identity->'jobKey'),'resultDiscoveryRef',NULL); END IF;
          kind:='enqueued';
        END IF;
      ELSIF action='claim' THEN
        IF expected IS NULL OR expected->>'state' NOT IN ('queued','leased','backoff')
          OR (expected->>'state'='backoff' AND expected->>'nextAttemptAt'>observed)
          OR (expected->>'state'='leased' AND expected#>>'{lease,expiresAt}'>observed) THEN RAISE EXCEPTION 'm04 not due' USING ERRCODE='P7601'; END IF;
        n:=expected||jsonb_build_object('revision',rev,'predecessorRevision',expected->'revision','updatedAt',observed,'nextAttemptAt',NULL);
        IF (expected->>'attempt')::integer>=(expected->>'attemptLimit')::integer THEN
          n:=n||jsonb_build_object('state','exhausted','lease',NULL,'lastFailure',COALESCE(NULLIF(expected->'lastFailure','null'::jsonb),'"verification_unavailable"'::jsonb)); kind:='exhausted';
        ELSE
          n:=n||jsonb_build_object('state','leased','attempt',(expected->>'attempt')::integer+1,'lease',jsonb_build_object('leaseId',i->'leaseId','generation',rev,
            'acquiredAt',observed,'expiresAt',to_char((at_time+(i->>'leaseMilliseconds')::integer*interval '1 millisecond') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
          kind:=CASE WHEN expected->>'state'='leased' THEN 'reclaimed' ELSE 'leased' END;
        END IF;
      ELSE
        IF expected IS NULL OR expected->>'state'<>'leased' OR f IS DISTINCT FROM jsonb_build_object('jobId',expected->'jobId','revision',expected->'revision',
          'leaseId',expected#>'{lease,leaseId}','generation',expected#>'{lease,generation}') OR expected#>>'{lease,expiresAt}'<=observed THEN RAISE EXCEPTION 'm04 obsolete fence' USING ERRCODE='P7601'; END IF;
        end_time:=least(end_time,official_v3_jobs_private.timestamp_v1(expected#>>'{lease,expiresAt}'));
        n:=expected||jsonb_build_object('revision',rev,'predecessorRevision',expected->'revision','updatedAt',observed,'lease',NULL);
        IF action='complete' THEN
          result_key:=CASE WHEN expected->>'kind'='research_job_record' THEN 'resultDecisionRef' ELSE 'resultDiscoveryRef' END;
          n:=n||jsonb_build_object('state','succeeded','lastFailure',NULL,result_key,COALESCE(i->'decisionRef',i->'discoveryRef')); kind:='completed';
        ELSE
          IF (expected->>'attempt')::integer=(expected->>'attemptLimit')::integer THEN n:=n||jsonb_build_object('state','exhausted','nextAttemptAt',NULL); kind:='exhausted';
          ELSE
            delay_ms:=least(60000,1000*(2^((expected->>'attempt')::integer-1))::integer);
            n:=n||jsonb_build_object('state','backoff','nextAttemptAt',to_char((at_time+delay_ms*interval '1 millisecond') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')); kind:='backoff';
          END IF;
          n:=n||jsonb_build_object('lastFailure',i->'reason');
        END IF;
      END IF;
      IF kind IS DISTINCT FROM 'deduplicated' THEN
        job_text:=n::text;
        IF job_text IS NULL OR (validated_jobs ? job_text) IS NOT TRUE THEN
          n:=official_v3_jobs_private.job_v1(n);
          job_bytes:=octet_length(job_text);
          IF job_bytes<=1048576 THEN
            -- Admit the just-validated exact bytes even after the bounded memo fills.
            -- A reset can cause revalidation, never skip validation of a new value.
            IF validated_job_count>=256 OR job_bytes>1048576-validated_job_bytes THEN
              validated_jobs:='{}'::jsonb; validated_job_count:=0; validated_job_bytes:=0;
            END IF;
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;
        END IF;
      END IF;
      IF commit->'next' IS DISTINCT FROM n OR official_v3_jobs_private.timestamp_v1(commit->>'notAfter')<>end_time
        OR a IS DISTINCT FROM jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',i->'operationId','command',c->'commandKey'),0),'UTF8')),'hex'),
          'kind',kind,'observedAt',observed,'priorRevision',expected->'revision','nextRevision',n->'revision') THEN RAISE EXCEPTION 'm04 transition mismatch' USING ERRCODE='P7601'; END IF;
    END;
  END LOOP;
  FOR x IN SELECT t.*,q.command_text,q.envelope_text,d.kind AS disposition_kind,d.queue_operation_id,r.result
      FROM official_v3_jobs_private.execution_starts_v1 t JOIN official_v3_jobs_private.queue_operations_v1 q ON q.operation_id=t.claim_operation_id
      LEFT JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key)
      LEFT JOIN official_v3_jobs_private.execution_results_v1 r USING(attempt_key) WHERE t.job_key=k LOOP
    IF x.command_text::jsonb->>'action'<>'claim' OR x.command_text::jsonb->'input' IS DISTINCT FROM x.claim_text::jsonb
      OR x.envelope_text::jsonb->'next' IS DISTINCT FROM x.leased_job OR x.leased_job->>'state'<>'leased'
      OR x.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(x.claim_text::jsonb,0)
      OR (x.authority-'epoch') IS DISTINCT FROM s.method_binding OR (x.authority->>'epoch' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE
      OR x.attempt_key IS DISTINCT FROM 'execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
        'subject',s.subject_text::jsonb,'claim',x.claim_text::jsonb,'leasedJob',x.leased_job,'authority',x.authority),0),'UTF8')),'hex')
      OR (x.disposition_kind='completed' AND x.result IS NULL) OR (x.disposition_kind='settled_failure' AND x.result IS NOT NULL) THEN RAISE EXCEPTION 'm04 attempt invariant' USING ERRCODE='P7603'; END IF;
    IF x.disposition_kind IS NOT NULL AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id=x.queue_operation_id AND q.job_key=k
      AND q.action=CASE WHEN x.disposition_kind='completed' THEN 'complete' ELSE 'fail' END
      AND q.envelope_text::jsonb->'expected'=x.leased_job) THEN RAISE EXCEPTION 'm04 disposition invariant' USING ERRCODE='P7603'; END IF;
  END LOOP;
  IF s.current_job->>'state'='leased' THEN
    SELECT envelope_text::jsonb->'next' INTO credit FROM official_v3_jobs_private.queue_operations_v1
      WHERE operation_id=s.terminal_credit_claim AND job_key=k AND action='claim';
    IF credit IS DISTINCT FROM s.current_job THEN RAISE EXCEPTION 'm04 terminal credit invariant' USING ERRCODE='P7603'; END IF;
  ELSIF s.terminal_credit_claim IS NOT NULL THEN RAISE EXCEPTION 'm04 terminal credit invariant' USING ERRCODE='P7603'; END IF;
  IF NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.slots_v1 WHERE slot_id=s.slot_id AND job_key=k) THEN RAISE EXCEPTION 'm04 slot_id invariant' USING ERRCODE='P7603'; END IF;
END $history_body$;
