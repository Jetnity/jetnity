-- Additive invocation-local history-validation memo successor. No history, quota, deadline or authority change.
CREATE OR REPLACE FUNCTION official_v3_jobs_private.assert_history_v1(k text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp  AS $history_body$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb; envelope_canonical text COLLATE "default";
  validated_jobs jsonb:='{}'::jsonb; validated_job_count integer:=0; validated_job_bytes integer:=0; job_text text COLLATE "C"; job_bytes integer;
  memo_subject_kind text COLLATE "C"; memo_subject_text text COLLATE "C"; memo_subject_result jsonb; command_identity jsonb; quota jsonb;
  canonical_memo_key_one text COLLATE "C"; canonical_memo_key_two text COLLATE "C";
  canonical_memo_value_one text; canonical_memo_value_two text;
  canonical_memo_bytes_one integer:=0; canonical_memo_bytes_two integer:=0;
  subtree_memo jsonb:='{}'; subtree_memo_count integer:=0; subtree_memo_bytes integer:=0;
  attempt_canonical text COLLATE "default";
  nodes_memo jsonb:='{}'; nodes_memo_count integer:=0; nodes_memo_bytes integer:=0; audit_canonical text COLLATE "default"; claim_canonical text COLLATE "default";
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
  DECLARE v jsonb:=s.current_job;
  job_subject_input jsonb; job_subject_text text COLLATE "C"; job_subject_bytes integer;
  job_canonical_text text COLLATE "default";
  job_nodes integer;
  common text[] COLLATE "default":=ARRAY['schema','kind','jobId','operationId','revision','predecessorRevision','state','createdAt','updatedAt','attempt','attemptLimit','lease','nextAttemptAt','lastFailure'];
  i jsonb; result_ref jsonb; l jsonb:=v->'lease'; state text COLLATE "default":=v->>'state'; created timestamptz; updated timestamptz;
  attempt integer; lim integer; revision integer;
BEGIN
DECLARE hn_value jsonb:=v; hn_count integer:=1; hn_child record;
  hn_child_count bigint; hn_child_nodes integer; hn_key text COLLATE "C"; hn_bytes bigint;
BEGIN
  IF hn_value IS NULL THEN hn_count:=-1;
  ELSIF jsonb_typeof(hn_value)<>'object' THEN
    hn_count:=official_v3_jobs_private.nodes_v1(hn_value,0,16,8192);
  ELSE
    SELECT count(*) INTO hn_child_count FROM jsonb_object_keys(hn_value);
    IF hn_child_count>(8192-1)/2 THEN hn_count:=-1;
    ELSE
      hn_count:=1+2*hn_child_count;
      FOR hn_child IN SELECT j.key,j.value FROM jsonb_each(hn_value) j
        WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
        IF hn_child.key IN ('context','research','method','identity') THEN
          -- The full key also binds every original recursive parameter.
          hn_key:='1:16:8192:'||hn_child.value::text;
          IF nodes_memo ? hn_key THEN hn_child_nodes:=(nodes_memo->>hn_key)::integer;
          ELSE
            hn_child_nodes:=official_v3_jobs_private.nodes_v1(hn_child.value,1,16,8192);
            hn_bytes:=octet_length(hn_key)::bigint+octet_length(hn_child_nodes::text)::bigint;
            IF hn_child_nodes>0 AND hn_bytes<=16384 THEN
              IF nodes_memo_count>=8 OR hn_bytes>16384-nodes_memo_bytes THEN
                nodes_memo:='{}'; nodes_memo_count:=0; nodes_memo_bytes:=0;
              END IF;
              nodes_memo:=nodes_memo||jsonb_build_object(hn_key,hn_child_nodes);
              nodes_memo_count:=nodes_memo_count+1; nodes_memo_bytes:=nodes_memo_bytes+hn_bytes::integer;
            END IF;
          END IF;
        ELSE
          hn_child_nodes:=official_v3_jobs_private.nodes_v1(hn_child.value,1,16,8192);
        END IF;
        IF hn_child_nodes<0 THEN hn_count:=-1; EXIT; END IF;
        hn_count:=hn_count+hn_child_nodes-1;
        IF hn_count>8192 THEN hn_count:=-1; EXIT; END IF;
      END LOOP;
    END IF;
  END IF;
  job_nodes:=hn_count;
END;
  IF job_nodes<0 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
DECLARE hc0_value jsonb:=v; hc0_depth integer:=0;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        job_canonical_text:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        job_canonical_text:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN job_canonical_text:=hc0_value::text;
      WHEN 'null' THEN job_canonical_text:='null';
      ELSE job_canonical_text:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    DECLARE hcf_value jsonb:=(hc0_value); hcf_depth integer:=(hc0_depth);
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  hc0_fast:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    IF hcf_value ? 'schema' THEN
IF hcf_value->'kind'='"research_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"context":'||COALESCE((CASE jsonb_typeof((hcf_value->'context'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'context')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'context')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'context')::numeric=trunc((hcf_value->'context')::numeric)
        AND (hcf_value->'context')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'context')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'context')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'context')::text)),
    '"contextKey":'||(CASE jsonb_typeof((hcf_value->'contextKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'contextKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'contextKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'contextKey')::numeric=trunc((hcf_value->'contextKey')::numeric)
        AND (hcf_value->'contextKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'contextKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'contextKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobKey":'||(CASE jsonb_typeof((hcf_value->'jobKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobKey')::numeric=trunc((hcf_value->'jobKey')::numeric)
        AND (hcf_value->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"method":'||COALESCE((CASE jsonb_typeof((hcf_value->'method'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'method')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'method')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'method')::numeric=trunc((hcf_value->'method')::numeric)
        AND (hcf_value->'method')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'method')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'method')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'method')::text)),
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"research":'||COALESCE((CASE jsonb_typeof((hcf_value->'research'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'research')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'research')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'research')::numeric=trunc((hcf_value->'research')::numeric)
        AND (hcf_value->'research')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'research')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'research')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'research')::text)),
    '"resultDecisionRef":'||(CASE jsonb_typeof((hcf_value->'resultDecisionRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDecisionRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDecisionRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDecisionRef')::numeric=trunc((hcf_value->'resultDecisionRef')::numeric)
        AND (hcf_value->'resultDecisionRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDecisionRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDecisionRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
ELSIF hcf_value->'kind'='"combination_discovery_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"identity":'||COALESCE((CASE jsonb_typeof((hcf_value->'identity'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'identity')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'identity')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'identity')::numeric=trunc((hcf_value->'identity')::numeric)
        AND (hcf_value->'identity')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'identity')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'identity')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'identity')::text)),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"resultDiscoveryRef":'||(CASE jsonb_typeof((hcf_value->'resultDiscoveryRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDiscoveryRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDiscoveryRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDiscoveryRef')::numeric=trunc((hcf_value->'resultDiscoveryRef')::numeric)
        AND (hcf_value->'resultDiscoveryRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDiscoveryRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDiscoveryRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
END IF;
END IF;
  END IF;
END;
    IF hc0_fast IS NOT NULL THEN job_canonical_text:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    job_canonical_text:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
  IF octet_length(job_canonical_text)>65536 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->>'kind'='research_job_record' THEN
    IF (CASE WHEN jsonb_typeof(v)='object' THEN
    CASE WHEN (v) ?& (common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) AND (v)-(common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef'])='{}'::jsonb
      THEN (common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef'])=(common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    job_subject_input:=jsonb_build_object('context',v->'context','method',v->'method','factKind',v#>'{research,factKind}','researchReason',v#>'{research,researchReason}'); job_subject_text:=job_subject_input::text;
    IF memo_subject_kind COLLATE "C" = 'rule_research' COLLATE "C"
      AND memo_subject_text COLLATE "C" = job_subject_text COLLATE "C" THEN
      i:=memo_subject_result;
    ELSE
      i:=official_v3_jobs_private.subject_v1('rule_research',job_subject_input);
      job_subject_bytes:=octet_length('rule_research')+octet_length(job_subject_text);
      IF job_subject_bytes<=1048576 AND octet_length(i::text)<=1048576-job_subject_bytes THEN
        memo_subject_kind:='rule_research'; memo_subject_text:=job_subject_text; memo_subject_result:=i;
      END IF;
    END IF;
    IF i->'jobKey' IS DISTINCT FROM v->'jobKey' OR i->'contextKey' IS DISTINCT FROM v->'contextKey' OR i->'research' IS DISTINCT FROM v->'research' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDecisionRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSIF v->>'kind'='combination_discovery_job_record' THEN
    IF (CASE WHEN jsonb_typeof(v)='object' THEN
    CASE WHEN (v) ?& (common||ARRAY['identity','resultDiscoveryRef']) AND (v)-(common||ARRAY['identity','resultDiscoveryRef'])='{}'::jsonb
      THEN (common||ARRAY['identity','resultDiscoveryRef'])=(common||ARRAY['identity','resultDiscoveryRef']) ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['identity','resultDiscoveryRef']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['identity','resultDiscoveryRef']) END) IS NOT TRUE
      OR (CASE WHEN jsonb_typeof(v->'identity')='object' THEN
    CASE WHEN (v->'identity') ?& (ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) AND (v->'identity')-(ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey'])='{}'::jsonb
      THEN (ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey'])=(ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) ELSE official_v3_jobs_private.exact_keys_v1(v->'identity',ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v->'identity',ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) END) IS NOT TRUE
      OR v#>>'{identity,kind}' IS DISTINCT FROM 'combination_discovery' THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    job_subject_input:=(v->'identity')-'kind'-'jobKey'; job_subject_text:=job_subject_input::text;
    IF memo_subject_kind COLLATE "C" = 'combination_discovery' COLLATE "C"
      AND memo_subject_text COLLATE "C" = job_subject_text COLLATE "C" THEN
      i:=memo_subject_result;
    ELSE
      i:=official_v3_jobs_private.subject_v1('combination_discovery',job_subject_input);
      job_subject_bytes:=octet_length('combination_discovery')+octet_length(job_subject_text);
      IF job_subject_bytes<=1048576 AND octet_length(i::text)<=1048576-job_subject_bytes THEN
        memo_subject_kind:='combination_discovery'; memo_subject_text:=job_subject_text; memo_subject_result:=i;
      END IF;
    END IF;
    IF i->'jobKey' IS DISTINCT FROM v#>'{identity,jobKey}' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDiscoveryRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^combination-discovery-result:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSE RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->'schema' IS DISTINCT FROM '3'::jsonb OR (v->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE
    OR (v->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(v->'revision') IS DISTINCT FROM 'number'
    OR (v->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (v->>'revision')::numeric>2147483647
    OR jsonb_typeof(v->'attempt') IS DISTINCT FROM 'number' OR (v->>'attempt' ~ '^(0|[1-9][0-9]?)$') IS NOT TRUE
    OR jsonb_typeof(v->'attemptLimit') IS DISTINCT FROM 'number' OR (v->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE
    OR (state IN ('queued','leased','backoff','succeeded','exhausted')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  revision:=(v->>'revision')::integer; attempt:=(v->>'attempt')::integer; lim:=(v->>'attemptLimit')::integer;
  IF lim NOT BETWEEN 1 AND 16 OR attempt NOT BETWEEN 0 AND lim
    OR (v->'predecessorRevision'='null'::jsonb AND revision<>1)
    OR (v->'predecessorRevision'<>'null'::jsonb AND (v->'predecessorRevision' IS DISTINCT FROM to_jsonb(revision-1) OR revision<=1)) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  created:=official_v3_jobs_private.timestamp_v1(v->>'createdAt'); updated:=(CASE WHEN (v->>'updatedAt') COLLATE "C" = (v->>'createdAt') COLLATE "C" THEN created ELSE official_v3_jobs_private.timestamp_v1(v->>'updatedAt') END);
  IF created>updated OR (v->'lastFailure'<>'null'::jsonb AND (v->>'lastFailure' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  IF state='leased' THEN
    IF (CASE WHEN jsonb_typeof(l)='object' THEN
    CASE WHEN (l) ?& (ARRAY['leaseId','generation','acquiredAt','expiresAt']) AND (l)-(ARRAY['leaseId','generation','acquiredAt','expiresAt'])='{}'::jsonb
      THEN (ARRAY['leaseId','generation','acquiredAt','expiresAt'])=(ARRAY['leaseId','generation','acquiredAt','expiresAt']) ELSE official_v3_jobs_private.exact_keys_v1(l,ARRAY['leaseId','generation','acquiredAt','expiresAt']) END
    ELSE official_v3_jobs_private.exact_keys_v1(l,ARRAY['leaseId','generation','acquiredAt','expiresAt']) END) IS NOT TRUE
      OR (l->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(l->'generation') IS DISTINCT FROM 'number'
      OR (l->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (l->>'generation')::numeric NOT BETWEEN 1 AND revision OR attempt<1
      OR (CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END) NOT BETWEEN created AND updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')<=updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')>(CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END)+interval '900 seconds' THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  ELSIF l<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  IF state='backoff' THEN
    IF official_v3_jobs_private.timestamp_v1(v->>'nextAttemptAt')<=updated OR v->'lastFailure'='null'::jsonb OR attempt<1 OR attempt>=lim THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  ELSIF v->'nextAttemptAt'<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  IF (state='queued' AND (attempt<>0 OR v->'lastFailure'<>'null'::jsonb))
    OR (state='succeeded' AND (result_ref='null'::jsonb OR attempt<1)) OR (state<>'succeeded' AND result_ref<>'null'::jsonb)
    OR (state='exhausted' AND (attempt<>lim OR v->'lastFailure'='null'::jsonb)) THEN RAISE EXCEPTION 'm04 invalid job state' USING ERRCODE='P7601'; END IF;
  NULL;
END;
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
DECLARE hcc_value jsonb:=(v); hcc_depth integer:=(0);
  hcc_action jsonb; hcc_input jsonb; hcc_nested jsonb; hcc_has_kind boolean:=false;
  hcc_parts text[] COLLATE "default"; hcc_input_parts text[] COLLATE "default";
  hcc_nested_parts text[] COLLATE "default"; hcc_input_text text COLLATE "default";
  hcc_nested_text text COLLATE "default";
BEGIN
  t:=NULL;
  IF hcc_value IS NOT NULL AND hcc_depth=0 AND jsonb_typeof(hcc_value)='object' THEN
    hcc_action:=hcc_value->'action'; hcc_input:=hcc_value->'input';
    IF jsonb_typeof(hcc_input)='object' THEN
      IF hcc_action='"enqueue"'::jsonb AND (hcc_value ?& ARRAY['action','input','kind']::text[] AND (hcc_value-ARRAY['action','input','kind']::text[])='{}'::jsonb) THEN
        hcc_has_kind:=true;
        IF hcc_value->'kind'='"rule_research"'::jsonb AND (hcc_input ?& ARRAY['attemptLimit','context','factKind','jobId','method','operationId','researchReason']::text[] AND (hcc_input-ARRAY['attemptLimit','context','factKind','jobId','method','operationId','researchReason']::text[])='{}'::jsonb) THEN
          hcc_nested:=hcc_input->'researchReason';
          IF jsonb_typeof(hcc_nested)='object' THEN
            IF (hcc_nested ?& ARRAY['status']::text[] AND (hcc_nested-ARRAY['status']::text[])='{}'::jsonb) THEN
              hcc_nested_parts:=ARRAY[
      '"status":'||(CASE jsonb_typeof((hcc_nested->'status'))
    WHEN 'string' THEN CASE WHEN ((hcc_nested->'status')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_nested->'status')::text END
    WHEN 'number' THEN CASE WHEN (hcc_nested->'status')::numeric=trunc((hcc_nested->'status')::numeric)
      AND (hcc_nested->'status')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_nested->'status')::numeric)::text END
    WHEN 'boolean' THEN (hcc_nested->'status')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
            ELSIF (hcc_nested ?& ARRAY['reason','status']::text[] AND (hcc_nested-ARRAY['reason','status']::text[])='{}'::jsonb) THEN
              hcc_nested_parts:=ARRAY[
      '"reason":'||(CASE jsonb_typeof((hcc_nested->'reason'))
    WHEN 'string' THEN CASE WHEN ((hcc_nested->'reason')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_nested->'reason')::text END
    WHEN 'number' THEN CASE WHEN (hcc_nested->'reason')::numeric=trunc((hcc_nested->'reason')::numeric)
      AND (hcc_nested->'reason')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_nested->'reason')::numeric)::text END
    WHEN 'boolean' THEN (hcc_nested->'reason')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"status":'||(CASE jsonb_typeof((hcc_nested->'status'))
    WHEN 'string' THEN CASE WHEN ((hcc_nested->'status')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_nested->'status')::text END
    WHEN 'number' THEN CASE WHEN (hcc_nested->'status')::numeric=trunc((hcc_nested->'status')::numeric)
      AND (hcc_nested->'status')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_nested->'status')::numeric)::text END
    WHEN 'boolean' THEN (hcc_nested->'status')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
            END IF;
            IF hcc_nested_parts IS NOT NULL AND array_position(hcc_nested_parts,NULL::text) IS NULL THEN
              hcc_nested_text:='{'||array_to_string(hcc_nested_parts,',')||'}';
            END IF;
          END IF;
          hcc_input_parts:=ARRAY[
      '"attemptLimit":'||(CASE jsonb_typeof((hcc_input->'attemptLimit'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'attemptLimit')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'attemptLimit')::numeric=trunc((hcc_input->'attemptLimit')::numeric)
      AND (hcc_input->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'attemptLimit')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"context":'||(CASE WHEN jsonb_typeof((hcc_input->'context'))='object'
  THEN subtree_memo->>('2:'||(hcc_input->'context')::text) END),
      '"factKind":'||(CASE jsonb_typeof((hcc_input->'factKind'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'factKind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'factKind')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'factKind')::numeric=trunc((hcc_input->'factKind')::numeric)
      AND (hcc_input->'factKind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'factKind')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'factKind')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"jobId":'||(CASE jsonb_typeof((hcc_input->'jobId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'jobId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'jobId')::numeric=trunc((hcc_input->'jobId')::numeric)
      AND (hcc_input->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'jobId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"method":'||(CASE WHEN jsonb_typeof((hcc_input->'method'))='object'
  THEN subtree_memo->>('2:'||(hcc_input->'method')::text) END),
      '"operationId":'||(CASE jsonb_typeof((hcc_input->'operationId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'operationId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'operationId')::numeric=trunc((hcc_input->'operationId')::numeric)
      AND (hcc_input->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'operationId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"researchReason":'||hcc_nested_text
    ]::text[];
        ELSIF hcc_value->'kind'='"combination_discovery"'::jsonb AND (hcc_input ?& ARRAY['attemptLimit','citizenshipCountryCode','destinationCountryCode','jobId','method','operationId']::text[] AND (hcc_input-ARRAY['attemptLimit','citizenshipCountryCode','destinationCountryCode','jobId','method','operationId']::text[])='{}'::jsonb) THEN
          hcc_input_parts:=ARRAY[
      '"attemptLimit":'||(CASE jsonb_typeof((hcc_input->'attemptLimit'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'attemptLimit')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'attemptLimit')::numeric=trunc((hcc_input->'attemptLimit')::numeric)
      AND (hcc_input->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'attemptLimit')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"citizenshipCountryCode":'||(CASE jsonb_typeof((hcc_input->'citizenshipCountryCode'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'citizenshipCountryCode')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'citizenshipCountryCode')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'citizenshipCountryCode')::numeric=trunc((hcc_input->'citizenshipCountryCode')::numeric)
      AND (hcc_input->'citizenshipCountryCode')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'citizenshipCountryCode')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'citizenshipCountryCode')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"destinationCountryCode":'||(CASE jsonb_typeof((hcc_input->'destinationCountryCode'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'destinationCountryCode')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'destinationCountryCode')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'destinationCountryCode')::numeric=trunc((hcc_input->'destinationCountryCode')::numeric)
      AND (hcc_input->'destinationCountryCode')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'destinationCountryCode')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'destinationCountryCode')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"jobId":'||(CASE jsonb_typeof((hcc_input->'jobId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'jobId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'jobId')::numeric=trunc((hcc_input->'jobId')::numeric)
      AND (hcc_input->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'jobId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"method":'||(CASE WHEN jsonb_typeof((hcc_input->'method'))='object'
  THEN subtree_memo->>('2:'||(hcc_input->'method')::text) END),
      '"operationId":'||(CASE jsonb_typeof((hcc_input->'operationId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'operationId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'operationId')::numeric=trunc((hcc_input->'operationId')::numeric)
      AND (hcc_input->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'operationId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
        END IF;
      ELSIF hcc_action='"claim"'::jsonb AND (hcc_value ?& ARRAY['action','input']::text[] AND (hcc_value-ARRAY['action','input']::text[])='{}'::jsonb)
        AND (hcc_input ?& ARRAY['jobKey','leaseId','leaseMilliseconds','operationId']::text[] AND (hcc_input-ARRAY['jobKey','leaseId','leaseMilliseconds','operationId']::text[])='{}'::jsonb) THEN
        hcc_input_parts:=ARRAY[
      '"jobKey":'||(CASE jsonb_typeof((hcc_input->'jobKey'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'jobKey')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'jobKey')::numeric=trunc((hcc_input->'jobKey')::numeric)
      AND (hcc_input->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'jobKey')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"leaseId":'||(CASE jsonb_typeof((hcc_input->'leaseId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'leaseId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'leaseId')::numeric=trunc((hcc_input->'leaseId')::numeric)
      AND (hcc_input->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'leaseId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"leaseMilliseconds":'||(CASE jsonb_typeof((hcc_input->'leaseMilliseconds'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'leaseMilliseconds')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'leaseMilliseconds')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'leaseMilliseconds')::numeric=trunc((hcc_input->'leaseMilliseconds')::numeric)
      AND (hcc_input->'leaseMilliseconds')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'leaseMilliseconds')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'leaseMilliseconds')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"operationId":'||(CASE jsonb_typeof((hcc_input->'operationId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'operationId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'operationId')::numeric=trunc((hcc_input->'operationId')::numeric)
      AND (hcc_input->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'operationId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
      ELSIF (hcc_action='"fail"'::jsonb AND (hcc_value ?& ARRAY['action','input']::text[] AND (hcc_value-ARRAY['action','input']::text[])='{}'::jsonb))
        OR (hcc_action='"complete"'::jsonb AND (hcc_value ?& ARRAY['action','input','kind']::text[] AND (hcc_value-ARRAY['action','input','kind']::text[])='{}'::jsonb)) THEN
        hcc_has_kind:=hcc_action='"complete"'::jsonb;
        hcc_nested:=hcc_input->'fence';
        IF jsonb_typeof(hcc_nested)='object' THEN
          IF (hcc_nested ?& ARRAY['generation','jobId','leaseId','revision']::text[] AND (hcc_nested-ARRAY['generation','jobId','leaseId','revision']::text[])='{}'::jsonb) THEN
            hcc_nested_parts:=ARRAY[
      '"generation":'||(CASE jsonb_typeof((hcc_nested->'generation'))
    WHEN 'string' THEN CASE WHEN ((hcc_nested->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_nested->'generation')::text END
    WHEN 'number' THEN CASE WHEN (hcc_nested->'generation')::numeric=trunc((hcc_nested->'generation')::numeric)
      AND (hcc_nested->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_nested->'generation')::numeric)::text END
    WHEN 'boolean' THEN (hcc_nested->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"jobId":'||(CASE jsonb_typeof((hcc_nested->'jobId'))
    WHEN 'string' THEN CASE WHEN ((hcc_nested->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_nested->'jobId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_nested->'jobId')::numeric=trunc((hcc_nested->'jobId')::numeric)
      AND (hcc_nested->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_nested->'jobId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_nested->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"leaseId":'||(CASE jsonb_typeof((hcc_nested->'leaseId'))
    WHEN 'string' THEN CASE WHEN ((hcc_nested->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_nested->'leaseId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_nested->'leaseId')::numeric=trunc((hcc_nested->'leaseId')::numeric)
      AND (hcc_nested->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_nested->'leaseId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_nested->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"revision":'||(CASE jsonb_typeof((hcc_nested->'revision'))
    WHEN 'string' THEN CASE WHEN ((hcc_nested->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_nested->'revision')::text END
    WHEN 'number' THEN CASE WHEN (hcc_nested->'revision')::numeric=trunc((hcc_nested->'revision')::numeric)
      AND (hcc_nested->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_nested->'revision')::numeric)::text END
    WHEN 'boolean' THEN (hcc_nested->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
            IF array_position(hcc_nested_parts,NULL::text) IS NULL THEN
              hcc_nested_text:='{'||array_to_string(hcc_nested_parts,',')||'}';
            END IF;
          END IF;
        END IF;
        IF hcc_action='"fail"'::jsonb AND (hcc_input ?& ARRAY['fence','jobKey','operationId','reason']::text[] AND (hcc_input-ARRAY['fence','jobKey','operationId','reason']::text[])='{}'::jsonb) THEN
          hcc_input_parts:=ARRAY[
      '"fence":'||hcc_nested_text,
      '"jobKey":'||(CASE jsonb_typeof((hcc_input->'jobKey'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'jobKey')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'jobKey')::numeric=trunc((hcc_input->'jobKey')::numeric)
      AND (hcc_input->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'jobKey')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"operationId":'||(CASE jsonb_typeof((hcc_input->'operationId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'operationId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'operationId')::numeric=trunc((hcc_input->'operationId')::numeric)
      AND (hcc_input->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'operationId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"reason":'||(CASE jsonb_typeof((hcc_input->'reason'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'reason')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'reason')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'reason')::numeric=trunc((hcc_input->'reason')::numeric)
      AND (hcc_input->'reason')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'reason')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'reason')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
        ELSIF hcc_value->'kind'='"rule_research"'::jsonb AND (hcc_input ?& ARRAY['decisionRef','fence','jobKey','operationId']::text[] AND (hcc_input-ARRAY['decisionRef','fence','jobKey','operationId']::text[])='{}'::jsonb) THEN
          hcc_input_parts:=ARRAY[
      '"decisionRef":'||(CASE jsonb_typeof((hcc_input->'decisionRef'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'decisionRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'decisionRef')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'decisionRef')::numeric=trunc((hcc_input->'decisionRef')::numeric)
      AND (hcc_input->'decisionRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'decisionRef')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'decisionRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"fence":'||hcc_nested_text,
      '"jobKey":'||(CASE jsonb_typeof((hcc_input->'jobKey'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'jobKey')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'jobKey')::numeric=trunc((hcc_input->'jobKey')::numeric)
      AND (hcc_input->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'jobKey')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"operationId":'||(CASE jsonb_typeof((hcc_input->'operationId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'operationId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'operationId')::numeric=trunc((hcc_input->'operationId')::numeric)
      AND (hcc_input->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'operationId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
        ELSIF hcc_value->'kind'='"combination_discovery"'::jsonb AND (hcc_input ?& ARRAY['discoveryRef','fence','jobKey','operationId']::text[] AND (hcc_input-ARRAY['discoveryRef','fence','jobKey','operationId']::text[])='{}'::jsonb) THEN
          hcc_input_parts:=ARRAY[
      '"discoveryRef":'||(CASE jsonb_typeof((hcc_input->'discoveryRef'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'discoveryRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'discoveryRef')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'discoveryRef')::numeric=trunc((hcc_input->'discoveryRef')::numeric)
      AND (hcc_input->'discoveryRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'discoveryRef')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'discoveryRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"fence":'||hcc_nested_text,
      '"jobKey":'||(CASE jsonb_typeof((hcc_input->'jobKey'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'jobKey')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'jobKey')::numeric=trunc((hcc_input->'jobKey')::numeric)
      AND (hcc_input->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'jobKey')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"operationId":'||(CASE jsonb_typeof((hcc_input->'operationId'))
    WHEN 'string' THEN CASE WHEN ((hcc_input->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_input->'operationId')::text END
    WHEN 'number' THEN CASE WHEN (hcc_input->'operationId')::numeric=trunc((hcc_input->'operationId')::numeric)
      AND (hcc_input->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_input->'operationId')::numeric)::text END
    WHEN 'boolean' THEN (hcc_input->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
        END IF;
      END IF;
      IF hcc_input_parts IS NOT NULL THEN IF array_position(hcc_input_parts,NULL::text) IS NULL THEN
      hcc_input_text:='{'||array_to_string(hcc_input_parts,',')||'}';
    END IF; END IF;
      IF hcc_input_text IS NOT NULL THEN
        IF hcc_has_kind THEN
          hcc_parts:=ARRAY[
      '"action":'||(CASE jsonb_typeof((hcc_value->'action'))
    WHEN 'string' THEN CASE WHEN ((hcc_value->'action')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_value->'action')::text END
    WHEN 'number' THEN CASE WHEN (hcc_value->'action')::numeric=trunc((hcc_value->'action')::numeric)
      AND (hcc_value->'action')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_value->'action')::numeric)::text END
    WHEN 'boolean' THEN (hcc_value->'action')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"input":'||hcc_input_text,
      '"kind":'||(CASE jsonb_typeof((hcc_value->'kind'))
    WHEN 'string' THEN CASE WHEN ((hcc_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_value->'kind')::text END
    WHEN 'number' THEN CASE WHEN (hcc_value->'kind')::numeric=trunc((hcc_value->'kind')::numeric)
      AND (hcc_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_value->'kind')::numeric)::text END
    WHEN 'boolean' THEN (hcc_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
        ELSE
          hcc_parts:=ARRAY[
      '"action":'||(CASE jsonb_typeof((hcc_value->'action'))
    WHEN 'string' THEN CASE WHEN ((hcc_value->'action')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcc_value->'action')::text END
    WHEN 'number' THEN CASE WHEN (hcc_value->'action')::numeric=trunc((hcc_value->'action')::numeric)
      AND (hcc_value->'action')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcc_value->'action')::numeric)::text END
    WHEN 'boolean' THEN (hcc_value->'action')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"input":'||hcc_input_text
    ]::text[];
        END IF;
        IF array_position(hcc_parts,NULL::text) IS NULL THEN
          t:='{'||array_to_string(hcc_parts,',')||'}';
        END IF;
      END IF;
    END IF;
  END IF;
END;
IF t IS NULL THEN
DECLARE hc0_value jsonb:=v; hc0_depth integer:=0;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        t:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        t:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN t:=hc0_value::text;
      WHEN 'null' THEN t:='null';
      ELSE t:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    hc0_fast:=NULL;
    IF hc0_fast IS NOT NULL THEN t:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    t:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
END IF;
      IF octet_length(t)>65536
        OR (CASE WHEN jsonb_typeof(v)='object' THEN
    CASE WHEN (v) ?& (CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) AND (v)-(CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END)='{}'::jsonb
      THEN (CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END)=(CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) ELSE official_v3_jobs_private.exact_keys_v1(v,CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) END
    ELSE official_v3_jobs_private.exact_keys_v1(v,CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) END) IS NOT TRUE
        OR (a IN ('enqueue','claim','complete','fail')) IS NOT TRUE OR (i->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
      IF a='enqueue' THEN
        IF k='rule_research' THEN
          IF (CASE WHEN jsonb_typeof(i)='object' THEN
    CASE WHEN (i) ?& (ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) AND (i)-(ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit'])='{}'::jsonb
      THEN (ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit'])=(ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) ELSE official_v3_jobs_private.exact_keys_v1(i,ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) END
    ELSE official_v3_jobs_private.exact_keys_v1(i,ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        ELSIF k='combination_discovery' THEN
          IF (CASE WHEN jsonb_typeof(i)='object' THEN
    CASE WHEN (i) ?& (ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) AND (i)-(ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit'])='{}'::jsonb
      THEN (ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit'])=(ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) ELSE official_v3_jobs_private.exact_keys_v1(i,ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) END
    ELSE official_v3_jobs_private.exact_keys_v1(i,ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
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
          IF (CASE WHEN jsonb_typeof(i)='object' THEN
    CASE WHEN (i) ?& (ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) AND (i)-(ARRAY['operationId','jobKey','leaseId','leaseMilliseconds'])='{}'::jsonb
      THEN (ARRAY['operationId','jobKey','leaseId','leaseMilliseconds'])=(ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) ELSE official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) END
    ELSE official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) END) IS NOT TRUE
            OR (i->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'leaseMilliseconds') IS DISTINCT FROM 'number'
            OR (i->>'leaseMilliseconds' ~ '^[1-9][0-9]{0,5}$') IS NOT TRUE OR (i->>'leaseMilliseconds')::integer>900000 THEN RAISE EXCEPTION 'm04 invalid claim' USING ERRCODE='P7601'; END IF;
        ELSE
          f:=i->'fence';
          IF (CASE WHEN jsonb_typeof(f)='object' THEN
    CASE WHEN (f) ?& (ARRAY['jobId','revision','leaseId','generation']) AND (f)-(ARRAY['jobId','revision','leaseId','generation'])='{}'::jsonb
      THEN (ARRAY['jobId','revision','leaseId','generation'])=(ARRAY['jobId','revision','leaseId','generation']) ELSE official_v3_jobs_private.exact_keys_v1(f,ARRAY['jobId','revision','leaseId','generation']) END
    ELSE official_v3_jobs_private.exact_keys_v1(f,ARRAY['jobId','revision','leaseId','generation']) END) IS NOT TRUE
            OR (f->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR (f->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE
            OR jsonb_typeof(f->'revision') IS DISTINCT FROM 'number' OR (f->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'revision')::numeric>2147483647
            OR jsonb_typeof(f->'generation') IS DISTINCT FROM 'number' OR (f->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'generation')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid fence' USING ERRCODE='P7601'; END IF;
          IF a='complete' THEN
            IF (k IN ('rule_research','combination_discovery')) IS NOT TRUE OR (k='rule_research')<>(jkey LIKE 'research-job:%')
              OR (CASE WHEN jsonb_typeof(i)='object' THEN
    CASE WHEN (i) ?& (CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) AND (i)-(CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END)='{}'::jsonb
      THEN (CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END)=(CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) ELSE official_v3_jobs_private.exact_keys_v1(i,CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) END
    ELSE official_v3_jobs_private.exact_keys_v1(i,CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) END) IS NOT TRUE
              OR (COALESCE(i->>'decisionRef',i->>'discoveryRef') ~ CASE WHEN k='rule_research' THEN '^source-decision:v3:[a-f0-9]{64}$' ELSE '^combination-discovery-result:v3:[a-f0-9]{64}$' END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid completion' USING ERRCODE='P7601'; END IF;
          ELSE
            IF (CASE WHEN jsonb_typeof(i)='object' THEN
    CASE WHEN (i) ?& (ARRAY['operationId','jobKey','fence','reason']) AND (i)-(ARRAY['operationId','jobKey','fence','reason'])='{}'::jsonb
      THEN (ARRAY['operationId','jobKey','fence','reason'])=(ARRAY['operationId','jobKey','fence','reason']) ELSE official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','fence','reason']) END
    ELSE official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','fence','reason']) END) IS NOT TRUE
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
    -- Two exact-text entries share 32KiB; exact-depth canonical and node subtrees each share 16KiB. No validation is skipped.
    DECLARE member_name text; child_value jsonb; child_key text COLLATE "C";
      child_canonical text; child_bytes bigint; canonical_parts text[]:='{}';
    BEGIN
      IF (CASE WHEN jsonb_typeof(e)='object' THEN
    CASE WHEN (e) ?& (
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId']) AND (e)-(
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId'])='{}'::jsonb
      THEN (
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId'])=(
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId']) ELSE official_v3_jobs_private.exact_keys_v1(e,
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId']) END
    ELSE official_v3_jobs_private.exact_keys_v1(e,
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId']) END) IS TRUE THEN
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
DECLARE hc0_value jsonb:=child_value; hc0_depth integer:=1;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        child_canonical:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        child_canonical:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN child_canonical:=hc0_value::text;
      WHEN 'null' THEN child_canonical:='null';
      ELSE child_canonical:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    DECLARE hcf_value jsonb:=(hc0_value); hcf_depth integer:=(hc0_depth);
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  hc0_fast:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    IF hcf_value ? 'schema' THEN
IF hcf_value->'kind'='"research_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"context":'||COALESCE((CASE jsonb_typeof((hcf_value->'context'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'context')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'context')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'context')::numeric=trunc((hcf_value->'context')::numeric)
        AND (hcf_value->'context')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'context')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'context')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'context')::text)),
    '"contextKey":'||(CASE jsonb_typeof((hcf_value->'contextKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'contextKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'contextKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'contextKey')::numeric=trunc((hcf_value->'contextKey')::numeric)
        AND (hcf_value->'contextKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'contextKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'contextKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobKey":'||(CASE jsonb_typeof((hcf_value->'jobKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobKey')::numeric=trunc((hcf_value->'jobKey')::numeric)
        AND (hcf_value->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"method":'||COALESCE((CASE jsonb_typeof((hcf_value->'method'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'method')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'method')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'method')::numeric=trunc((hcf_value->'method')::numeric)
        AND (hcf_value->'method')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'method')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'method')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'method')::text)),
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"research":'||COALESCE((CASE jsonb_typeof((hcf_value->'research'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'research')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'research')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'research')::numeric=trunc((hcf_value->'research')::numeric)
        AND (hcf_value->'research')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'research')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'research')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'research')::text)),
    '"resultDecisionRef":'||(CASE jsonb_typeof((hcf_value->'resultDecisionRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDecisionRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDecisionRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDecisionRef')::numeric=trunc((hcf_value->'resultDecisionRef')::numeric)
        AND (hcf_value->'resultDecisionRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDecisionRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDecisionRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
ELSIF hcf_value->'kind'='"combination_discovery_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"identity":'||COALESCE((CASE jsonb_typeof((hcf_value->'identity'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'identity')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'identity')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'identity')::numeric=trunc((hcf_value->'identity')::numeric)
        AND (hcf_value->'identity')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'identity')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'identity')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'identity')::text)),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"resultDiscoveryRef":'||(CASE jsonb_typeof((hcf_value->'resultDiscoveryRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDiscoveryRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDiscoveryRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDiscoveryRef')::numeric=trunc((hcf_value->'resultDiscoveryRef')::numeric)
        AND (hcf_value->'resultDiscoveryRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDiscoveryRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDiscoveryRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
END IF;
END IF;
  END IF;
END;
    IF hc0_fast IS NOT NULL THEN child_canonical:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    child_canonical:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
              child_bytes:=octet_length(child_key)::bigint+octet_length(child_canonical)::bigint;
              IF child_bytes<=32768 THEN
                IF child_bytes+canonical_memo_bytes_two<=32768 THEN
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
DECLARE hc0_value jsonb:=child_value; hc0_depth integer:=1;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        child_canonical:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        child_canonical:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN child_canonical:=hc0_value::text;
      WHEN 'null' THEN child_canonical:='null';
      ELSE child_canonical:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    DECLARE hcf_value jsonb:=(hc0_value); hcf_depth integer:=(hc0_depth);
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  hc0_fast:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    IF hcf_value ? 'reference' THEN
IF (hcf_value ?& ARRAY['kind','nextRevision','observedAt','priorRevision','reference']::text[] AND (hcf_value-ARRAY['kind','nextRevision','observedAt','priorRevision','reference']::text[])='{}'::jsonb) THEN hcf_parts:=ARRAY[
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"nextRevision":'||(CASE jsonb_typeof((hcf_value->'nextRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextRevision')::numeric=trunc((hcf_value->'nextRevision')::numeric)
        AND (hcf_value->'nextRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"observedAt":'||(CASE jsonb_typeof((hcf_value->'observedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'observedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'observedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'observedAt')::numeric=trunc((hcf_value->'observedAt')::numeric)
        AND (hcf_value->'observedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'observedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'observedAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"priorRevision":'||(CASE jsonb_typeof((hcf_value->'priorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'priorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'priorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'priorRevision')::numeric=trunc((hcf_value->'priorRevision')::numeric)
        AND (hcf_value->'priorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'priorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'priorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"reference":'||(CASE jsonb_typeof((hcf_value->'reference'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'reference')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'reference')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'reference')::numeric=trunc((hcf_value->'reference')::numeric)
        AND (hcf_value->'reference')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'reference')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'reference')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF; END IF;
END IF;
  END IF;
END;
    IF hc0_fast IS NOT NULL THEN child_canonical:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    child_canonical:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
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
      IF (CASE WHEN jsonb_typeof(commit)='object' THEN
    CASE WHEN (commit) ?& (ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']) AND (commit)-(ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit'])='{}'::jsonb
      THEN (ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit'])=(ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']) ELSE official_v3_jobs_private.exact_keys_v1(commit,ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']) END
    ELSE official_v3_jobs_private.exact_keys_v1(commit,ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']) END) IS NOT TRUE
        OR octet_length(envelope_canonical)>196608
        OR (CASE WHEN jsonb_typeof(a)='object' THEN
    CASE WHEN (a) ?& (ARRAY['reference','kind','observedAt','priorRevision','nextRevision']) AND (a)-(ARRAY['reference','kind','observedAt','priorRevision','nextRevision'])='{}'::jsonb
      THEN (ARRAY['reference','kind','observedAt','priorRevision','nextRevision'])=(ARRAY['reference','kind','observedAt','priorRevision','nextRevision']) ELSE official_v3_jobs_private.exact_keys_v1(a,ARRAY['reference','kind','observedAt','priorRevision','nextRevision']) END
    ELSE official_v3_jobs_private.exact_keys_v1(a,ARRAY['reference','kind','observedAt','priorRevision','nextRevision']) END) IS NOT TRUE
        OR commit->'operationId' IS DISTINCT FROM c->'operationId' OR commit->'commandKey' IS DISTINCT FROM c->'commandKey'
        OR commit->'jobKey' IS DISTINCT FROM c->'jobKey' OR commit->'expected' IS DISTINCT FROM current_record THEN RAISE EXCEPTION 'm04 invalid transition' USING ERRCODE='P7601'; END IF;
      at_time:=official_v3_jobs_private.timestamp_v1(observed); end_time:=at_time+interval '5 seconds';
      IF current_record IS DISTINCT FROM 'null'::jsonb THEN
        job_text:=current_record::text;
        IF job_text IS NULL OR (validated_jobs ? job_text) IS NOT TRUE THEN
          DECLARE v jsonb:=current_record;
  job_subject_input jsonb; job_subject_text text COLLATE "C"; job_subject_bytes integer;
  job_canonical_text text COLLATE "default";
  job_nodes integer;
  common text[] COLLATE "default":=ARRAY['schema','kind','jobId','operationId','revision','predecessorRevision','state','createdAt','updatedAt','attempt','attemptLimit','lease','nextAttemptAt','lastFailure'];
  i jsonb; result_ref jsonb; l jsonb:=v->'lease'; state text COLLATE "default":=v->>'state'; created timestamptz; updated timestamptz;
  attempt integer; lim integer; revision integer;
BEGIN
DECLARE hn_value jsonb:=v; hn_count integer:=1; hn_child record;
  hn_child_count bigint; hn_child_nodes integer; hn_key text COLLATE "C"; hn_bytes bigint;
BEGIN
  IF hn_value IS NULL THEN hn_count:=-1;
  ELSIF jsonb_typeof(hn_value)<>'object' THEN
    hn_count:=official_v3_jobs_private.nodes_v1(hn_value,0,16,8192);
  ELSE
    SELECT count(*) INTO hn_child_count FROM jsonb_object_keys(hn_value);
    IF hn_child_count>(8192-1)/2 THEN hn_count:=-1;
    ELSE
      hn_count:=1+2*hn_child_count;
      FOR hn_child IN SELECT j.key,j.value FROM jsonb_each(hn_value) j
        WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
        IF hn_child.key IN ('context','research','method','identity') THEN
          -- The full key also binds every original recursive parameter.
          hn_key:='1:16:8192:'||hn_child.value::text;
          IF nodes_memo ? hn_key THEN hn_child_nodes:=(nodes_memo->>hn_key)::integer;
          ELSE
            hn_child_nodes:=official_v3_jobs_private.nodes_v1(hn_child.value,1,16,8192);
            hn_bytes:=octet_length(hn_key)::bigint+octet_length(hn_child_nodes::text)::bigint;
            IF hn_child_nodes>0 AND hn_bytes<=16384 THEN
              IF nodes_memo_count>=8 OR hn_bytes>16384-nodes_memo_bytes THEN
                nodes_memo:='{}'; nodes_memo_count:=0; nodes_memo_bytes:=0;
              END IF;
              nodes_memo:=nodes_memo||jsonb_build_object(hn_key,hn_child_nodes);
              nodes_memo_count:=nodes_memo_count+1; nodes_memo_bytes:=nodes_memo_bytes+hn_bytes::integer;
            END IF;
          END IF;
        ELSE
          hn_child_nodes:=official_v3_jobs_private.nodes_v1(hn_child.value,1,16,8192);
        END IF;
        IF hn_child_nodes<0 THEN hn_count:=-1; EXIT; END IF;
        hn_count:=hn_count+hn_child_nodes-1;
        IF hn_count>8192 THEN hn_count:=-1; EXIT; END IF;
      END LOOP;
    END IF;
  END IF;
  job_nodes:=hn_count;
END;
  IF job_nodes<0 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
DECLARE hc0_value jsonb:=v; hc0_depth integer:=0;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        job_canonical_text:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        job_canonical_text:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN job_canonical_text:=hc0_value::text;
      WHEN 'null' THEN job_canonical_text:='null';
      ELSE job_canonical_text:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    DECLARE hcf_value jsonb:=(hc0_value); hcf_depth integer:=(hc0_depth);
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  hc0_fast:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    IF hcf_value ? 'schema' THEN
IF hcf_value->'kind'='"research_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"context":'||COALESCE((CASE jsonb_typeof((hcf_value->'context'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'context')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'context')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'context')::numeric=trunc((hcf_value->'context')::numeric)
        AND (hcf_value->'context')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'context')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'context')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'context')::text)),
    '"contextKey":'||(CASE jsonb_typeof((hcf_value->'contextKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'contextKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'contextKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'contextKey')::numeric=trunc((hcf_value->'contextKey')::numeric)
        AND (hcf_value->'contextKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'contextKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'contextKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobKey":'||(CASE jsonb_typeof((hcf_value->'jobKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobKey')::numeric=trunc((hcf_value->'jobKey')::numeric)
        AND (hcf_value->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"method":'||COALESCE((CASE jsonb_typeof((hcf_value->'method'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'method')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'method')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'method')::numeric=trunc((hcf_value->'method')::numeric)
        AND (hcf_value->'method')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'method')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'method')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'method')::text)),
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"research":'||COALESCE((CASE jsonb_typeof((hcf_value->'research'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'research')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'research')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'research')::numeric=trunc((hcf_value->'research')::numeric)
        AND (hcf_value->'research')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'research')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'research')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'research')::text)),
    '"resultDecisionRef":'||(CASE jsonb_typeof((hcf_value->'resultDecisionRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDecisionRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDecisionRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDecisionRef')::numeric=trunc((hcf_value->'resultDecisionRef')::numeric)
        AND (hcf_value->'resultDecisionRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDecisionRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDecisionRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
ELSIF hcf_value->'kind'='"combination_discovery_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"identity":'||COALESCE((CASE jsonb_typeof((hcf_value->'identity'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'identity')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'identity')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'identity')::numeric=trunc((hcf_value->'identity')::numeric)
        AND (hcf_value->'identity')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'identity')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'identity')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'identity')::text)),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"resultDiscoveryRef":'||(CASE jsonb_typeof((hcf_value->'resultDiscoveryRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDiscoveryRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDiscoveryRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDiscoveryRef')::numeric=trunc((hcf_value->'resultDiscoveryRef')::numeric)
        AND (hcf_value->'resultDiscoveryRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDiscoveryRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDiscoveryRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
END IF;
END IF;
  END IF;
END;
    IF hc0_fast IS NOT NULL THEN job_canonical_text:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    job_canonical_text:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
  IF octet_length(job_canonical_text)>65536 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->>'kind'='research_job_record' THEN
    IF (CASE WHEN jsonb_typeof(v)='object' THEN
    CASE WHEN (v) ?& (common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) AND (v)-(common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef'])='{}'::jsonb
      THEN (common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef'])=(common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    job_subject_input:=jsonb_build_object('context',v->'context','method',v->'method','factKind',v#>'{research,factKind}','researchReason',v#>'{research,researchReason}'); job_subject_text:=job_subject_input::text;
    IF memo_subject_kind COLLATE "C" = 'rule_research' COLLATE "C"
      AND memo_subject_text COLLATE "C" = job_subject_text COLLATE "C" THEN
      i:=memo_subject_result;
    ELSE
      i:=official_v3_jobs_private.subject_v1('rule_research',job_subject_input);
      job_subject_bytes:=octet_length('rule_research')+octet_length(job_subject_text);
      IF job_subject_bytes<=1048576 AND octet_length(i::text)<=1048576-job_subject_bytes THEN
        memo_subject_kind:='rule_research'; memo_subject_text:=job_subject_text; memo_subject_result:=i;
      END IF;
    END IF;
    IF i->'jobKey' IS DISTINCT FROM v->'jobKey' OR i->'contextKey' IS DISTINCT FROM v->'contextKey' OR i->'research' IS DISTINCT FROM v->'research' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDecisionRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSIF v->>'kind'='combination_discovery_job_record' THEN
    IF (CASE WHEN jsonb_typeof(v)='object' THEN
    CASE WHEN (v) ?& (common||ARRAY['identity','resultDiscoveryRef']) AND (v)-(common||ARRAY['identity','resultDiscoveryRef'])='{}'::jsonb
      THEN (common||ARRAY['identity','resultDiscoveryRef'])=(common||ARRAY['identity','resultDiscoveryRef']) ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['identity','resultDiscoveryRef']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['identity','resultDiscoveryRef']) END) IS NOT TRUE
      OR (CASE WHEN jsonb_typeof(v->'identity')='object' THEN
    CASE WHEN (v->'identity') ?& (ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) AND (v->'identity')-(ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey'])='{}'::jsonb
      THEN (ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey'])=(ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) ELSE official_v3_jobs_private.exact_keys_v1(v->'identity',ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v->'identity',ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) END) IS NOT TRUE
      OR v#>>'{identity,kind}' IS DISTINCT FROM 'combination_discovery' THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    job_subject_input:=(v->'identity')-'kind'-'jobKey'; job_subject_text:=job_subject_input::text;
    IF memo_subject_kind COLLATE "C" = 'combination_discovery' COLLATE "C"
      AND memo_subject_text COLLATE "C" = job_subject_text COLLATE "C" THEN
      i:=memo_subject_result;
    ELSE
      i:=official_v3_jobs_private.subject_v1('combination_discovery',job_subject_input);
      job_subject_bytes:=octet_length('combination_discovery')+octet_length(job_subject_text);
      IF job_subject_bytes<=1048576 AND octet_length(i::text)<=1048576-job_subject_bytes THEN
        memo_subject_kind:='combination_discovery'; memo_subject_text:=job_subject_text; memo_subject_result:=i;
      END IF;
    END IF;
    IF i->'jobKey' IS DISTINCT FROM v#>'{identity,jobKey}' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDiscoveryRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^combination-discovery-result:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSE RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->'schema' IS DISTINCT FROM '3'::jsonb OR (v->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE
    OR (v->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(v->'revision') IS DISTINCT FROM 'number'
    OR (v->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (v->>'revision')::numeric>2147483647
    OR jsonb_typeof(v->'attempt') IS DISTINCT FROM 'number' OR (v->>'attempt' ~ '^(0|[1-9][0-9]?)$') IS NOT TRUE
    OR jsonb_typeof(v->'attemptLimit') IS DISTINCT FROM 'number' OR (v->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE
    OR (state IN ('queued','leased','backoff','succeeded','exhausted')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  revision:=(v->>'revision')::integer; attempt:=(v->>'attempt')::integer; lim:=(v->>'attemptLimit')::integer;
  IF lim NOT BETWEEN 1 AND 16 OR attempt NOT BETWEEN 0 AND lim
    OR (v->'predecessorRevision'='null'::jsonb AND revision<>1)
    OR (v->'predecessorRevision'<>'null'::jsonb AND (v->'predecessorRevision' IS DISTINCT FROM to_jsonb(revision-1) OR revision<=1)) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  created:=official_v3_jobs_private.timestamp_v1(v->>'createdAt'); updated:=(CASE WHEN (v->>'updatedAt') COLLATE "C" = (v->>'createdAt') COLLATE "C" THEN created ELSE official_v3_jobs_private.timestamp_v1(v->>'updatedAt') END);
  IF created>updated OR (v->'lastFailure'<>'null'::jsonb AND (v->>'lastFailure' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  IF state='leased' THEN
    IF (CASE WHEN jsonb_typeof(l)='object' THEN
    CASE WHEN (l) ?& (ARRAY['leaseId','generation','acquiredAt','expiresAt']) AND (l)-(ARRAY['leaseId','generation','acquiredAt','expiresAt'])='{}'::jsonb
      THEN (ARRAY['leaseId','generation','acquiredAt','expiresAt'])=(ARRAY['leaseId','generation','acquiredAt','expiresAt']) ELSE official_v3_jobs_private.exact_keys_v1(l,ARRAY['leaseId','generation','acquiredAt','expiresAt']) END
    ELSE official_v3_jobs_private.exact_keys_v1(l,ARRAY['leaseId','generation','acquiredAt','expiresAt']) END) IS NOT TRUE
      OR (l->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(l->'generation') IS DISTINCT FROM 'number'
      OR (l->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (l->>'generation')::numeric NOT BETWEEN 1 AND revision OR attempt<1
      OR (CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END) NOT BETWEEN created AND updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')<=updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')>(CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END)+interval '900 seconds' THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  ELSIF l<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  IF state='backoff' THEN
    IF official_v3_jobs_private.timestamp_v1(v->>'nextAttemptAt')<=updated OR v->'lastFailure'='null'::jsonb OR attempt<1 OR attempt>=lim THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  ELSIF v->'nextAttemptAt'<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  IF (state='queued' AND (attempt<>0 OR v->'lastFailure'<>'null'::jsonb))
    OR (state='succeeded' AND (result_ref='null'::jsonb OR attempt<1)) OR (state<>'succeeded' AND result_ref<>'null'::jsonb)
    OR (state='exhausted' AND (attempt<>lim OR v->'lastFailure'='null'::jsonb)) THEN RAISE EXCEPTION 'm04 invalid job state' USING ERRCODE='P7601'; END IF;
  expected:=v;
END;
          job_bytes:=octet_length(job_text);
          IF job_bytes<=1048576 THEN
            -- Admit the just-validated exact bytes even after the bounded memo fills.
            -- A reset can cause revalidation, never skip validation of a new value.
            IF validated_job_count>=8 OR job_bytes>1048576-validated_job_bytes THEN
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
          DECLARE v jsonb:=n;
  job_subject_input jsonb; job_subject_text text COLLATE "C"; job_subject_bytes integer;
  job_canonical_text text COLLATE "default";
  job_nodes integer;
  common text[] COLLATE "default":=ARRAY['schema','kind','jobId','operationId','revision','predecessorRevision','state','createdAt','updatedAt','attempt','attemptLimit','lease','nextAttemptAt','lastFailure'];
  i jsonb; result_ref jsonb; l jsonb:=v->'lease'; state text COLLATE "default":=v->>'state'; created timestamptz; updated timestamptz;
  attempt integer; lim integer; revision integer;
BEGIN
DECLARE hn_value jsonb:=v; hn_count integer:=1; hn_child record;
  hn_child_count bigint; hn_child_nodes integer; hn_key text COLLATE "C"; hn_bytes bigint;
BEGIN
  IF hn_value IS NULL THEN hn_count:=-1;
  ELSIF jsonb_typeof(hn_value)<>'object' THEN
    hn_count:=official_v3_jobs_private.nodes_v1(hn_value,0,16,8192);
  ELSE
    SELECT count(*) INTO hn_child_count FROM jsonb_object_keys(hn_value);
    IF hn_child_count>(8192-1)/2 THEN hn_count:=-1;
    ELSE
      hn_count:=1+2*hn_child_count;
      FOR hn_child IN SELECT j.key,j.value FROM jsonb_each(hn_value) j
        WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
        IF hn_child.key IN ('context','research','method','identity') THEN
          -- The full key also binds every original recursive parameter.
          hn_key:='1:16:8192:'||hn_child.value::text;
          IF nodes_memo ? hn_key THEN hn_child_nodes:=(nodes_memo->>hn_key)::integer;
          ELSE
            hn_child_nodes:=official_v3_jobs_private.nodes_v1(hn_child.value,1,16,8192);
            hn_bytes:=octet_length(hn_key)::bigint+octet_length(hn_child_nodes::text)::bigint;
            IF hn_child_nodes>0 AND hn_bytes<=16384 THEN
              IF nodes_memo_count>=8 OR hn_bytes>16384-nodes_memo_bytes THEN
                nodes_memo:='{}'; nodes_memo_count:=0; nodes_memo_bytes:=0;
              END IF;
              nodes_memo:=nodes_memo||jsonb_build_object(hn_key,hn_child_nodes);
              nodes_memo_count:=nodes_memo_count+1; nodes_memo_bytes:=nodes_memo_bytes+hn_bytes::integer;
            END IF;
          END IF;
        ELSE
          hn_child_nodes:=official_v3_jobs_private.nodes_v1(hn_child.value,1,16,8192);
        END IF;
        IF hn_child_nodes<0 THEN hn_count:=-1; EXIT; END IF;
        hn_count:=hn_count+hn_child_nodes-1;
        IF hn_count>8192 THEN hn_count:=-1; EXIT; END IF;
      END LOOP;
    END IF;
  END IF;
  job_nodes:=hn_count;
END;
  IF job_nodes<0 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
DECLARE hc0_value jsonb:=v; hc0_depth integer:=0;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        job_canonical_text:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        job_canonical_text:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN job_canonical_text:=hc0_value::text;
      WHEN 'null' THEN job_canonical_text:='null';
      ELSE job_canonical_text:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    DECLARE hcf_value jsonb:=(hc0_value); hcf_depth integer:=(hc0_depth);
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  hc0_fast:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    IF hcf_value ? 'schema' THEN
IF hcf_value->'kind'='"research_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"context":'||COALESCE((CASE jsonb_typeof((hcf_value->'context'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'context')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'context')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'context')::numeric=trunc((hcf_value->'context')::numeric)
        AND (hcf_value->'context')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'context')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'context')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'context')::text)),
    '"contextKey":'||(CASE jsonb_typeof((hcf_value->'contextKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'contextKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'contextKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'contextKey')::numeric=trunc((hcf_value->'contextKey')::numeric)
        AND (hcf_value->'contextKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'contextKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'contextKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobKey":'||(CASE jsonb_typeof((hcf_value->'jobKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobKey')::numeric=trunc((hcf_value->'jobKey')::numeric)
        AND (hcf_value->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"method":'||COALESCE((CASE jsonb_typeof((hcf_value->'method'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'method')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'method')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'method')::numeric=trunc((hcf_value->'method')::numeric)
        AND (hcf_value->'method')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'method')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'method')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'method')::text)),
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"research":'||COALESCE((CASE jsonb_typeof((hcf_value->'research'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'research')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'research')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'research')::numeric=trunc((hcf_value->'research')::numeric)
        AND (hcf_value->'research')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'research')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'research')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'research')::text)),
    '"resultDecisionRef":'||(CASE jsonb_typeof((hcf_value->'resultDecisionRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDecisionRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDecisionRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDecisionRef')::numeric=trunc((hcf_value->'resultDecisionRef')::numeric)
        AND (hcf_value->'resultDecisionRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDecisionRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDecisionRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
ELSIF hcf_value->'kind'='"combination_discovery_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"identity":'||COALESCE((CASE jsonb_typeof((hcf_value->'identity'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'identity')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'identity')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'identity')::numeric=trunc((hcf_value->'identity')::numeric)
        AND (hcf_value->'identity')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'identity')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'identity')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'identity')::text)),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"resultDiscoveryRef":'||(CASE jsonb_typeof((hcf_value->'resultDiscoveryRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDiscoveryRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDiscoveryRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDiscoveryRef')::numeric=trunc((hcf_value->'resultDiscoveryRef')::numeric)
        AND (hcf_value->'resultDiscoveryRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDiscoveryRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDiscoveryRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
END IF;
END IF;
  END IF;
END;
    IF hc0_fast IS NOT NULL THEN job_canonical_text:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    job_canonical_text:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
  IF octet_length(job_canonical_text)>65536 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->>'kind'='research_job_record' THEN
    IF (CASE WHEN jsonb_typeof(v)='object' THEN
    CASE WHEN (v) ?& (common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) AND (v)-(common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef'])='{}'::jsonb
      THEN (common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef'])=(common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    job_subject_input:=jsonb_build_object('context',v->'context','method',v->'method','factKind',v#>'{research,factKind}','researchReason',v#>'{research,researchReason}'); job_subject_text:=job_subject_input::text;
    IF memo_subject_kind COLLATE "C" = 'rule_research' COLLATE "C"
      AND memo_subject_text COLLATE "C" = job_subject_text COLLATE "C" THEN
      i:=memo_subject_result;
    ELSE
      i:=official_v3_jobs_private.subject_v1('rule_research',job_subject_input);
      job_subject_bytes:=octet_length('rule_research')+octet_length(job_subject_text);
      IF job_subject_bytes<=1048576 AND octet_length(i::text)<=1048576-job_subject_bytes THEN
        memo_subject_kind:='rule_research'; memo_subject_text:=job_subject_text; memo_subject_result:=i;
      END IF;
    END IF;
    IF i->'jobKey' IS DISTINCT FROM v->'jobKey' OR i->'contextKey' IS DISTINCT FROM v->'contextKey' OR i->'research' IS DISTINCT FROM v->'research' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDecisionRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSIF v->>'kind'='combination_discovery_job_record' THEN
    IF (CASE WHEN jsonb_typeof(v)='object' THEN
    CASE WHEN (v) ?& (common||ARRAY['identity','resultDiscoveryRef']) AND (v)-(common||ARRAY['identity','resultDiscoveryRef'])='{}'::jsonb
      THEN (common||ARRAY['identity','resultDiscoveryRef'])=(common||ARRAY['identity','resultDiscoveryRef']) ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['identity','resultDiscoveryRef']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['identity','resultDiscoveryRef']) END) IS NOT TRUE
      OR (CASE WHEN jsonb_typeof(v->'identity')='object' THEN
    CASE WHEN (v->'identity') ?& (ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) AND (v->'identity')-(ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey'])='{}'::jsonb
      THEN (ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey'])=(ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) ELSE official_v3_jobs_private.exact_keys_v1(v->'identity',ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) END
    ELSE official_v3_jobs_private.exact_keys_v1(v->'identity',ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) END) IS NOT TRUE
      OR v#>>'{identity,kind}' IS DISTINCT FROM 'combination_discovery' THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    job_subject_input:=(v->'identity')-'kind'-'jobKey'; job_subject_text:=job_subject_input::text;
    IF memo_subject_kind COLLATE "C" = 'combination_discovery' COLLATE "C"
      AND memo_subject_text COLLATE "C" = job_subject_text COLLATE "C" THEN
      i:=memo_subject_result;
    ELSE
      i:=official_v3_jobs_private.subject_v1('combination_discovery',job_subject_input);
      job_subject_bytes:=octet_length('combination_discovery')+octet_length(job_subject_text);
      IF job_subject_bytes<=1048576 AND octet_length(i::text)<=1048576-job_subject_bytes THEN
        memo_subject_kind:='combination_discovery'; memo_subject_text:=job_subject_text; memo_subject_result:=i;
      END IF;
    END IF;
    IF i->'jobKey' IS DISTINCT FROM v#>'{identity,jobKey}' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDiscoveryRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^combination-discovery-result:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSE RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->'schema' IS DISTINCT FROM '3'::jsonb OR (v->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE
    OR (v->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(v->'revision') IS DISTINCT FROM 'number'
    OR (v->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (v->>'revision')::numeric>2147483647
    OR jsonb_typeof(v->'attempt') IS DISTINCT FROM 'number' OR (v->>'attempt' ~ '^(0|[1-9][0-9]?)$') IS NOT TRUE
    OR jsonb_typeof(v->'attemptLimit') IS DISTINCT FROM 'number' OR (v->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE
    OR (state IN ('queued','leased','backoff','succeeded','exhausted')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  revision:=(v->>'revision')::integer; attempt:=(v->>'attempt')::integer; lim:=(v->>'attemptLimit')::integer;
  IF lim NOT BETWEEN 1 AND 16 OR attempt NOT BETWEEN 0 AND lim
    OR (v->'predecessorRevision'='null'::jsonb AND revision<>1)
    OR (v->'predecessorRevision'<>'null'::jsonb AND (v->'predecessorRevision' IS DISTINCT FROM to_jsonb(revision-1) OR revision<=1)) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  created:=official_v3_jobs_private.timestamp_v1(v->>'createdAt'); updated:=(CASE WHEN (v->>'updatedAt') COLLATE "C" = (v->>'createdAt') COLLATE "C" THEN created ELSE official_v3_jobs_private.timestamp_v1(v->>'updatedAt') END);
  IF created>updated OR (v->'lastFailure'<>'null'::jsonb AND (v->>'lastFailure' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  IF state='leased' THEN
    IF (CASE WHEN jsonb_typeof(l)='object' THEN
    CASE WHEN (l) ?& (ARRAY['leaseId','generation','acquiredAt','expiresAt']) AND (l)-(ARRAY['leaseId','generation','acquiredAt','expiresAt'])='{}'::jsonb
      THEN (ARRAY['leaseId','generation','acquiredAt','expiresAt'])=(ARRAY['leaseId','generation','acquiredAt','expiresAt']) ELSE official_v3_jobs_private.exact_keys_v1(l,ARRAY['leaseId','generation','acquiredAt','expiresAt']) END
    ELSE official_v3_jobs_private.exact_keys_v1(l,ARRAY['leaseId','generation','acquiredAt','expiresAt']) END) IS NOT TRUE
      OR (l->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(l->'generation') IS DISTINCT FROM 'number'
      OR (l->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (l->>'generation')::numeric NOT BETWEEN 1 AND revision OR attempt<1
      OR (CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END) NOT BETWEEN created AND updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')<=updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')>(CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END)+interval '900 seconds' THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  ELSIF l<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  IF state='backoff' THEN
    IF official_v3_jobs_private.timestamp_v1(v->>'nextAttemptAt')<=updated OR v->'lastFailure'='null'::jsonb OR attempt<1 OR attempt>=lim THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  ELSIF v->'nextAttemptAt'<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  IF (state='queued' AND (attempt<>0 OR v->'lastFailure'<>'null'::jsonb))
    OR (state='succeeded' AND (result_ref='null'::jsonb OR attempt<1)) OR (state<>'succeeded' AND result_ref<>'null'::jsonb)
    OR (state='exhausted' AND (attempt<>lim OR v->'lastFailure'='null'::jsonb)) THEN RAISE EXCEPTION 'm04 invalid job state' USING ERRCODE='P7601'; END IF;
  n:=v;
END;
          job_bytes:=octet_length(job_text);
          IF job_bytes<=1048576 THEN
            -- Admit the just-validated exact bytes even after the bounded memo fills.
            -- A reset can cause revalidation, never skip validation of a new value.
            IF validated_job_count>=8 OR job_bytes>1048576-validated_job_bytes THEN
              validated_jobs:='{}'::jsonb; validated_job_count:=0; validated_job_bytes:=0;
            END IF;
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;
        END IF;
      END IF;
      IF commit->'next' IS DISTINCT FROM n OR official_v3_jobs_private.timestamp_v1(commit->>'notAfter')<>end_time THEN
        RAISE EXCEPTION 'm04 transition mismatch' USING ERRCODE='P7601';END IF;
DECLARE hc0_value jsonb:=jsonb_build_object('op',i->'operationId','command',c->'commandKey'); hc0_depth integer:=0;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        audit_canonical:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        audit_canonical:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN audit_canonical:=hc0_value::text;
      WHEN 'null' THEN audit_canonical:='null';
      ELSE audit_canonical:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    DECLARE hcf_value jsonb:=(hc0_value); hcf_depth integer:=(hc0_depth);
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  hc0_fast:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    IF hcf_value ? 'command' THEN
IF (hcf_value ?& ARRAY['command','op']::text[] AND (hcf_value-ARRAY['command','op']::text[])='{}'::jsonb) THEN hcf_parts:=ARRAY[
    '"command":'||(CASE jsonb_typeof((hcf_value->'command'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'command')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'command')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'command')::numeric=trunc((hcf_value->'command')::numeric)
        AND (hcf_value->'command')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'command')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'command')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"op":'||(CASE jsonb_typeof((hcf_value->'op'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'op')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'op')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'op')::numeric=trunc((hcf_value->'op')::numeric)
        AND (hcf_value->'op')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'op')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'op')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF; END IF;
END IF;
  END IF;
END;
    IF hc0_fast IS NOT NULL THEN audit_canonical:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    audit_canonical:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
      IF a IS DISTINCT FROM jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(audit_canonical,'UTF8')),'hex'),
          'kind',kind,'observedAt',observed,'priorRevision',expected->'revision','nextRevision',n->'revision') THEN RAISE EXCEPTION 'm04 transition mismatch' USING ERRCODE='P7601'; END IF;
    END;
  END LOOP;
  FOR x IN SELECT t.*,q.command_text,q.envelope_text,d.kind AS disposition_kind,d.queue_operation_id,r.result
      FROM official_v3_jobs_private.execution_starts_v1 t JOIN official_v3_jobs_private.queue_operations_v1 q ON q.operation_id=t.claim_operation_id
      LEFT JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key)
      LEFT JOIN official_v3_jobs_private.execution_results_v1 r USING(attempt_key) WHERE t.job_key=k LOOP
    IF x.command_text::jsonb->>'action'<>'claim' OR x.command_text::jsonb->'input' IS DISTINCT FROM x.claim_text::jsonb
      OR x.envelope_text::jsonb->'next' IS DISTINCT FROM x.leased_job OR x.leased_job->>'state'<>'leased'
 THEN RAISE EXCEPTION 'm04 attempt invariant' USING ERRCODE='P7603'; END IF;
DECLARE hc0_value jsonb:=x.claim_text::jsonb; hc0_depth integer:=0;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        claim_canonical:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        claim_canonical:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN claim_canonical:=hc0_value::text;
      WHEN 'null' THEN claim_canonical:='null';
      ELSE claim_canonical:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    DECLARE hcf_value jsonb:=(hc0_value); hcf_depth integer:=(hc0_depth);
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  hc0_fast:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    IF hcf_value ? 'leaseMilliseconds' THEN
IF (hcf_value ?& ARRAY['jobKey','leaseId','leaseMilliseconds','operationId']::text[] AND (hcf_value-ARRAY['jobKey','leaseId','leaseMilliseconds','operationId']::text[])='{}'::jsonb) THEN hcf_parts:=ARRAY[
    '"jobKey":'||(CASE jsonb_typeof((hcf_value->'jobKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobKey')::numeric=trunc((hcf_value->'jobKey')::numeric)
        AND (hcf_value->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_value->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'leaseId')::numeric=trunc((hcf_value->'leaseId')::numeric)
        AND (hcf_value->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseMilliseconds":'||(CASE jsonb_typeof((hcf_value->'leaseMilliseconds'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'leaseMilliseconds')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'leaseMilliseconds')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'leaseMilliseconds')::numeric=trunc((hcf_value->'leaseMilliseconds')::numeric)
        AND (hcf_value->'leaseMilliseconds')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'leaseMilliseconds')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'leaseMilliseconds')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hc0_fast:='{'||array_to_string(hcf_parts,',')||'}';
    END IF; END IF;
END IF;
  END IF;
END;
    IF hc0_fast IS NOT NULL THEN claim_canonical:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    claim_canonical:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
    IF x.claim_text IS DISTINCT FROM claim_canonical
      OR (x.authority-'epoch') IS DISTINCT FROM s.method_binding OR (x.authority->>'epoch' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE
 THEN RAISE EXCEPTION 'm04 attempt invariant' USING ERRCODE='P7603'; END IF;
DECLARE hca_value jsonb:=(jsonb_build_object('subject',s.subject_text::jsonb,'claim',x.claim_text::jsonb,'leasedJob',x.leased_job,'authority',x.authority)); hca_depth integer:=(0);
  hca_claim jsonb; hca_job jsonb; hca_authority jsonb; hca_subject jsonb;
  hca_claim_text text COLLATE "default"; hca_job_text text COLLATE "default";
  hca_authority_text text COLLATE "default"; hca_subject_text text COLLATE "default";
  hca_parts text[] COLLATE "default"; hca_claim_parts text[] COLLATE "default";
BEGIN
  attempt_canonical:=NULL;
  IF hca_value IS NOT NULL AND hca_depth=0 AND jsonb_typeof(hca_value)='object' THEN
    IF (hca_value ?& ARRAY['authority','claim','leasedJob','subject']::text[] AND (hca_value-ARRAY['authority','claim','leasedJob','subject']::text[])='{}'::jsonb) THEN
      hca_authority:=hca_value->'authority'; hca_subject:=hca_value->'subject';
      IF jsonb_typeof(hca_authority)='object' AND jsonb_typeof(hca_subject)='object' THEN
        hca_authority_text:=subtree_memo->>('1:'||hca_authority::text);
        hca_subject_text:=subtree_memo->>('1:'||hca_subject::text);
        IF hca_authority_text IS NOT NULL AND hca_subject_text IS NOT NULL THEN
          hca_claim:=hca_value->'claim'; hca_job:=hca_value->'leasedJob';
          IF jsonb_typeof(hca_claim)='object' THEN
            IF (hca_claim ?& ARRAY['jobKey','leaseId','leaseMilliseconds','operationId']::text[] AND (hca_claim-ARRAY['jobKey','leaseId','leaseMilliseconds','operationId']::text[])='{}'::jsonb) THEN
              hca_claim_parts:=ARRAY[
      '"jobKey":'||(CASE jsonb_typeof((hca_claim->'jobKey'))
    WHEN 'string' THEN CASE WHEN ((hca_claim->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hca_claim->'jobKey')::text END
    WHEN 'number' THEN CASE WHEN (hca_claim->'jobKey')::numeric=trunc((hca_claim->'jobKey')::numeric)
      AND (hca_claim->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hca_claim->'jobKey')::numeric)::text END
    WHEN 'boolean' THEN (hca_claim->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"leaseId":'||(CASE jsonb_typeof((hca_claim->'leaseId'))
    WHEN 'string' THEN CASE WHEN ((hca_claim->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hca_claim->'leaseId')::text END
    WHEN 'number' THEN CASE WHEN (hca_claim->'leaseId')::numeric=trunc((hca_claim->'leaseId')::numeric)
      AND (hca_claim->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hca_claim->'leaseId')::numeric)::text END
    WHEN 'boolean' THEN (hca_claim->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"leaseMilliseconds":'||(CASE jsonb_typeof((hca_claim->'leaseMilliseconds'))
    WHEN 'string' THEN CASE WHEN ((hca_claim->'leaseMilliseconds')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hca_claim->'leaseMilliseconds')::text END
    WHEN 'number' THEN CASE WHEN (hca_claim->'leaseMilliseconds')::numeric=trunc((hca_claim->'leaseMilliseconds')::numeric)
      AND (hca_claim->'leaseMilliseconds')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hca_claim->'leaseMilliseconds')::numeric)::text END
    WHEN 'boolean' THEN (hca_claim->'leaseMilliseconds')::text WHEN 'null' THEN 'null' ELSE NULL END),
      '"operationId":'||(CASE jsonb_typeof((hca_claim->'operationId'))
    WHEN 'string' THEN CASE WHEN ((hca_claim->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hca_claim->'operationId')::text END
    WHEN 'number' THEN CASE WHEN (hca_claim->'operationId')::numeric=trunc((hca_claim->'operationId')::numeric)
      AND (hca_claim->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hca_claim->'operationId')::numeric)::text END
    WHEN 'boolean' THEN (hca_claim->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END)
    ]::text[];
              IF array_position(hca_claim_parts,NULL::text) IS NULL THEN
                hca_claim_text:='{'||array_to_string(hca_claim_parts,',')||'}';
              END IF;
            END IF;
          END IF;
          IF hca_claim_text IS NOT NULL THEN
            DECLARE hcf_value jsonb:=(hca_job); hcf_depth integer:=(1);
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  hca_job_text:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    IF hcf_value ? 'schema' THEN
IF hcf_value->'kind'='"research_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','context','contextKey','createdAt','jobId','jobKey','kind','lastFailure','lease','method','nextAttemptAt','operationId','predecessorRevision','research','resultDecisionRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"context":'||COALESCE((CASE jsonb_typeof((hcf_value->'context'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'context')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'context')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'context')::numeric=trunc((hcf_value->'context')::numeric)
        AND (hcf_value->'context')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'context')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'context')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'context')::text)),
    '"contextKey":'||(CASE jsonb_typeof((hcf_value->'contextKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'contextKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'contextKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'contextKey')::numeric=trunc((hcf_value->'contextKey')::numeric)
        AND (hcf_value->'contextKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'contextKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'contextKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"jobKey":'||(CASE jsonb_typeof((hcf_value->'jobKey'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobKey')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobKey')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobKey')::numeric=trunc((hcf_value->'jobKey')::numeric)
        AND (hcf_value->'jobKey')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobKey')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobKey')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"method":'||COALESCE((CASE jsonb_typeof((hcf_value->'method'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'method')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'method')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'method')::numeric=trunc((hcf_value->'method')::numeric)
        AND (hcf_value->'method')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'method')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'method')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'method')::text)),
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"research":'||COALESCE((CASE jsonb_typeof((hcf_value->'research'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'research')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'research')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'research')::numeric=trunc((hcf_value->'research')::numeric)
        AND (hcf_value->'research')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'research')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'research')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'research')::text)),
    '"resultDecisionRef":'||(CASE jsonb_typeof((hcf_value->'resultDecisionRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDecisionRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDecisionRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDecisionRef')::numeric=trunc((hcf_value->'resultDecisionRef')::numeric)
        AND (hcf_value->'resultDecisionRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDecisionRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDecisionRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hca_job_text:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
ELSIF hcf_value->'kind'='"combination_discovery_job_record"'::jsonb
      AND (hcf_value ?& ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[] AND (hcf_value-ARRAY['attempt','attemptLimit','createdAt','identity','jobId','kind','lastFailure','lease','nextAttemptAt','operationId','predecessorRevision','resultDiscoveryRef','revision','schema','state','updatedAt']::text[])='{}'::jsonb) THEN hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=(CASE jsonb_typeof(hcf_lease)
      WHEN 'string' THEN CASE WHEN (hcf_lease#>>'{}') ~ '[^ -~]' THEN NULL ELSE hcf_lease::text END
      WHEN 'number' THEN CASE WHEN hcf_lease::numeric=trunc(hcf_lease::numeric)
        AND hcf_lease::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(hcf_lease::numeric)::text END
      WHEN 'boolean' THEN hcf_lease::text WHEN 'null' THEN 'null' ELSE NULL END);
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF (hcf_lease ?& ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[] AND (hcf_lease-ARRAY['acquiredAt','expiresAt','generation','leaseId']::text[])='{}'::jsonb) THEN
        hcf_lease_parts:=ARRAY[
    '"acquiredAt":'||(CASE jsonb_typeof((hcf_lease->'acquiredAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'acquiredAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'acquiredAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'acquiredAt')::numeric=trunc((hcf_lease->'acquiredAt')::numeric)
        AND (hcf_lease->'acquiredAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'acquiredAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'acquiredAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"expiresAt":'||(CASE jsonb_typeof((hcf_lease->'expiresAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'expiresAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'expiresAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'expiresAt')::numeric=trunc((hcf_lease->'expiresAt')::numeric)
        AND (hcf_lease->'expiresAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'expiresAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'expiresAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"generation":'||(CASE jsonb_typeof((hcf_lease->'generation'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'generation')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'generation')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'generation')::numeric=trunc((hcf_lease->'generation')::numeric)
        AND (hcf_lease->'generation')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'generation')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'generation')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"leaseId":'||(CASE jsonb_typeof((hcf_lease->'leaseId'))
      WHEN 'string' THEN CASE WHEN ((hcf_lease->'leaseId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_lease->'leaseId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_lease->'leaseId')::numeric=trunc((hcf_lease->'leaseId')::numeric)
        AND (hcf_lease->'leaseId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_lease->'leaseId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_lease->'leaseId')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    hcf_parts:=ARRAY[
    '"attempt":'||(CASE jsonb_typeof((hcf_value->'attempt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attempt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attempt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attempt')::numeric=trunc((hcf_value->'attempt')::numeric)
        AND (hcf_value->'attempt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attempt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attempt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"attemptLimit":'||(CASE jsonb_typeof((hcf_value->'attemptLimit'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'attemptLimit')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'attemptLimit')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'attemptLimit')::numeric=trunc((hcf_value->'attemptLimit')::numeric)
        AND (hcf_value->'attemptLimit')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'attemptLimit')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'attemptLimit')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"createdAt":'||(CASE jsonb_typeof((hcf_value->'createdAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'createdAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'createdAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'createdAt')::numeric=trunc((hcf_value->'createdAt')::numeric)
        AND (hcf_value->'createdAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'createdAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'createdAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"identity":'||COALESCE((CASE jsonb_typeof((hcf_value->'identity'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'identity')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'identity')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'identity')::numeric=trunc((hcf_value->'identity')::numeric)
        AND (hcf_value->'identity')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'identity')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'identity')::text WHEN 'null' THEN 'null' ELSE NULL END),subtree_memo->>(((hcf_depth)+1)::text||':'||(hcf_value->'identity')::text)),
    '"jobId":'||(CASE jsonb_typeof((hcf_value->'jobId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'jobId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'jobId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'jobId')::numeric=trunc((hcf_value->'jobId')::numeric)
        AND (hcf_value->'jobId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'jobId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'jobId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"kind":'||(CASE jsonb_typeof((hcf_value->'kind'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'kind')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'kind')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'kind')::numeric=trunc((hcf_value->'kind')::numeric)
        AND (hcf_value->'kind')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'kind')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'kind')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lastFailure":'||(CASE jsonb_typeof((hcf_value->'lastFailure'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'lastFailure')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'lastFailure')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'lastFailure')::numeric=trunc((hcf_value->'lastFailure')::numeric)
        AND (hcf_value->'lastFailure')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'lastFailure')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'lastFailure')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"lease":'||hcf_lease_text,
    '"nextAttemptAt":'||(CASE jsonb_typeof((hcf_value->'nextAttemptAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'nextAttemptAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'nextAttemptAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'nextAttemptAt')::numeric=trunc((hcf_value->'nextAttemptAt')::numeric)
        AND (hcf_value->'nextAttemptAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'nextAttemptAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'nextAttemptAt')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"operationId":'||(CASE jsonb_typeof((hcf_value->'operationId'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'operationId')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'operationId')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'operationId')::numeric=trunc((hcf_value->'operationId')::numeric)
        AND (hcf_value->'operationId')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'operationId')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'operationId')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"predecessorRevision":'||(CASE jsonb_typeof((hcf_value->'predecessorRevision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'predecessorRevision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'predecessorRevision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'predecessorRevision')::numeric=trunc((hcf_value->'predecessorRevision')::numeric)
        AND (hcf_value->'predecessorRevision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'predecessorRevision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'predecessorRevision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"resultDiscoveryRef":'||(CASE jsonb_typeof((hcf_value->'resultDiscoveryRef'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'resultDiscoveryRef')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'resultDiscoveryRef')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'resultDiscoveryRef')::numeric=trunc((hcf_value->'resultDiscoveryRef')::numeric)
        AND (hcf_value->'resultDiscoveryRef')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'resultDiscoveryRef')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'resultDiscoveryRef')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"revision":'||(CASE jsonb_typeof((hcf_value->'revision'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'revision')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'revision')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'revision')::numeric=trunc((hcf_value->'revision')::numeric)
        AND (hcf_value->'revision')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'revision')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'revision')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"schema":'||(CASE jsonb_typeof((hcf_value->'schema'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'schema')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'schema')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'schema')::numeric=trunc((hcf_value->'schema')::numeric)
        AND (hcf_value->'schema')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'schema')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'schema')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"state":'||(CASE jsonb_typeof((hcf_value->'state'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'state')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'state')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'state')::numeric=trunc((hcf_value->'state')::numeric)
        AND (hcf_value->'state')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'state')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'state')::text WHEN 'null' THEN 'null' ELSE NULL END),
    '"updatedAt":'||(CASE jsonb_typeof((hcf_value->'updatedAt'))
      WHEN 'string' THEN CASE WHEN ((hcf_value->'updatedAt')#>>'{}') ~ '[^ -~]' THEN NULL ELSE (hcf_value->'updatedAt')::text END
      WHEN 'number' THEN CASE WHEN (hcf_value->'updatedAt')::numeric=trunc((hcf_value->'updatedAt')::numeric)
        AND (hcf_value->'updatedAt')::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc((hcf_value->'updatedAt')::numeric)::text END
      WHEN 'boolean' THEN (hcf_value->'updatedAt')::text WHEN 'null' THEN 'null' ELSE NULL END)
  ]::text[];
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      hca_job_text:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;
END IF;
END IF;
  END IF;
END;
            IF hca_job_text IS NOT NULL THEN
              hca_parts:=ARRAY[
      '"authority":'||hca_authority_text,
      '"claim":'||hca_claim_text,
      '"leasedJob":'||hca_job_text,
      '"subject":'||hca_subject_text
    ]::text[];
              IF array_position(hca_parts,NULL::text) IS NULL THEN
                attempt_canonical:='{'||array_to_string(hca_parts,',')||'}';
              END IF;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
END;
IF attempt_canonical IS NULL THEN
DECLARE hc0_value jsonb:=jsonb_build_object('subject',s.subject_text::jsonb,'claim',x.claim_text::jsonb,'leasedJob',x.leased_job,'authority',x.authority); hc0_depth integer:=0;
  hc0_keys text[] COLLATE "default"; hc0_values jsonb[]; hc0_parts text[] COLLATE "default";
  hc0_pending integer[]; hc0_at integer; hc0_member text COLLATE "default"; hc0_child jsonb;
  hc0_text text COLLATE "default"; hc0_key text COLLATE "C"; hc0_bytes bigint; hc0_fast text COLLATE "default";
BEGIN
  IF hc0_value IS NULL OR hc0_depth IS NULL OR hc0_depth<0 OR hc0_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc0_value)<>'object' THEN
    CASE jsonb_typeof(hc0_value)
      WHEN 'string' THEN
        IF (hc0_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        attempt_canonical:=hc0_value::text;
      WHEN 'number' THEN
        IF hc0_value::numeric<>trunc(hc0_value::numeric) OR hc0_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        attempt_canonical:=trunc(hc0_value::numeric)::text;
      WHEN 'boolean' THEN attempt_canonical:=hc0_value::text;
      WHEN 'null' THEN attempt_canonical:='null';
      ELSE attempt_canonical:=official_v3_jobs_private.canonical_v1(hc0_value,hc0_depth);
    END CASE;
  ELSE
    hc0_fast:=NULL;
    IF hc0_fast IS NOT NULL THEN attempt_canonical:=hc0_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc0_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc0_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc0_keys,hc0_values,hc0_parts FROM jsonb_each(hc0_value) j;
    hc0_pending:=array_positions(hc0_parts,NULL::text);
    FOREACH hc0_at IN ARRAY hc0_pending LOOP
      hc0_member:=hc0_keys[hc0_at]; hc0_child:=hc0_values[hc0_at];
      IF hc0_member ~ '[^ -~]' OR hc0_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc0_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc0_key:=(hc0_depth+1)::text||':'||hc0_child::text;
        IF subtree_memo ? hc0_key THEN hc0_text:=subtree_memo->>hc0_key;
        ELSE
          hc0_text:=official_v3_jobs_private.canonical_v1(hc0_child,hc0_depth+1);
          hc0_bytes:=octet_length(hc0_key)::bigint+octet_length(hc0_text)::bigint;
          IF hc0_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc0_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc0_key,hc0_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc0_bytes::integer;
          END IF;
        END IF;
      ELSE
        DECLARE hc1_value jsonb:=hc0_child; hc1_depth integer:=hc0_depth+1;
  hc1_keys text[] COLLATE "default"; hc1_values jsonb[]; hc1_parts text[] COLLATE "default";
  hc1_pending integer[]; hc1_at integer; hc1_member text COLLATE "default"; hc1_child jsonb;
  hc1_text text COLLATE "default"; hc1_key text COLLATE "C"; hc1_bytes bigint; hc1_fast text COLLATE "default";
BEGIN
  IF hc1_value IS NULL OR hc1_depth IS NULL OR hc1_depth<0 OR hc1_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(hc1_value)<>'object' THEN
    CASE jsonb_typeof(hc1_value)
      WHEN 'string' THEN
        IF (hc1_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=hc1_value::text;
      WHEN 'number' THEN
        IF hc1_value::numeric<>trunc(hc1_value::numeric) OR hc1_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        hc0_text:=trunc(hc1_value::numeric)::text;
      WHEN 'boolean' THEN hc0_text:=hc1_value::text;
      WHEN 'null' THEN hc0_text:='null';
      ELSE hc0_text:=official_v3_jobs_private.canonical_v1(hc1_value,hc1_depth);
    END CASE;
  ELSE
    hc1_fast:=NULL;
    IF hc1_fast IS NOT NULL THEN hc0_text:=hc1_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR hc1_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((hc1_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO hc1_keys,hc1_values,hc1_parts FROM jsonb_each(hc1_value) j;
    hc1_pending:=array_positions(hc1_parts,NULL::text);
    FOREACH hc1_at IN ARRAY hc1_pending LOOP
      hc1_member:=hc1_keys[hc1_at]; hc1_child:=hc1_values[hc1_at];
      IF hc1_member ~ '[^ -~]' OR hc1_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF hc1_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        hc1_key:=(hc1_depth+1)::text||':'||hc1_child::text;
        IF subtree_memo ? hc1_key THEN hc1_text:=subtree_memo->>hc1_key;
        ELSE
          hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
          hc1_bytes:=octet_length(hc1_key)::bigint+octet_length(hc1_text)::bigint;
          IF hc1_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR hc1_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(hc1_key,hc1_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+hc1_bytes::integer;
          END IF;
        END IF;
      ELSE
        hc1_text:=official_v3_jobs_private.canonical_v1(hc1_child,hc1_depth+1);
      END IF;
      hc1_parts[hc1_at]:=to_jsonb(hc1_member)::text||':'||hc1_text;
    END LOOP;
    hc0_text:='{'||array_to_string(hc1_parts,',')||'}';
    END IF;
  END IF;
END;
      END IF;
      hc0_parts[hc0_at]:=to_jsonb(hc0_member)::text||':'||hc0_text;
    END LOOP;
    attempt_canonical:='{'||array_to_string(hc0_parts,',')||'}';
    END IF;
  END IF;
END;
END IF;
    IF x.attempt_key IS DISTINCT FROM 'execution-attempt:v3:'||encode(sha256(convert_to(attempt_canonical,'UTF8')),'hex')
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
