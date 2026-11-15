-- Additive atomic ordinary queue operations. Original five-second transaction, all full checks and authority gates remain.
CREATE OR REPLACE FUNCTION official_v3_jobs_private.wire_v1(t text) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $atomic_claim$
DECLARE j json; v jsonb;
BEGIN
  IF t IS NULL OR octet_length(t) NOT BETWEEN 1 AND 262144 THEN RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  j:=t::json;
  IF official_v3_jobs_private.unique_json_v1(j,0) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  v:=j::jsonb;
  IF official_v3_jobs_private.nodes_v1(v,0,24,32768)<0 OR official_v3_jobs_private.canonical_v1(v,0)<>t
    OR official_v3_jobs_private.exact_keys_v1(v,ARRAY['operation','phase','body']) IS NOT TRUE
    OR (v->>'operation' IN ('queue_read','queue_confirm','queue_cas','execution_read','execution_start','execution_prepare','queue_claim','queue_mutate')) IS NOT TRUE
    OR (v->>'operation' IN ('queue_claim','queue_mutate') AND v->>'phase' IS DISTINCT FROM 'authorized')
    OR (v->>'phase' IN ('probe','authorized')) IS NOT TRUE OR jsonb_typeof(v->'body') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $atomic_claim$;

CREATE OR REPLACE FUNCTION official_v3_jobs_api.execute_v1(wire text,method_id text,revision integer,method_digest text,package_digest text,epoch integer,remaining_ms integer,absolute_not_after text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp  AS $atomic_claim$
DECLARE deadline timestamptz; entry timestamptz:=statement_timestamp(); q jsonb; i jsonb; operation text; phase text; b jsonb; c jsonb; claim jsonb;
  k text; lock_names text[]; lock_value bigint; relation text; next_identity jsonb; attempt text;
  s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; continuation jsonb; eligible boolean:=false; bundle jsonb; ref jsonb; opened jsonb; raw_reply jsonb;
BEGIN
  PERFORM official_v3_guard_private.begin_jobs_v1();
  -- Anchor BEFORE any relation/advisory/row wait. Acquisitions cannot restart it.
  IF remaining_ms IS NULL OR remaining_ms NOT BETWEEN 1 AND 5000 OR absolute_not_after IS NULL THEN RAISE EXCEPTION 'm04 invalid budget' USING ERRCODE='P7601'; END IF;
  deadline:=least(entry+remaining_ms*interval '1 millisecond',official_v3_jobs_private.timestamp_v1(absolute_not_after));
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired budget' USING ERRCODE='P7605'; END IF;
  q:=official_v3_jobs_private.wire_v1(wire); i:=q->'body'; operation:=q->>'operation'; phase:=q->>'phase';
  IF official_v3_jobs_private.ma1_tuple_valid_v1(method_id,revision,method_digest,package_digest) IS NOT TRUE
    OR (phase='probe' AND (epoch IS NOT NULL OR operation NOT IN ('queue_read','queue_confirm','execution_read')))
    OR (phase='authorized' AND (epoch IS NULL OR epoch NOT BETWEEN 1 AND 2147483647)) THEN RAISE EXCEPTION 'm04 invalid binding' USING ERRCODE='P7601'; END IF;
  b:=jsonb_build_object('methodId',method_id,'revision',revision,'methodDigest',method_digest,'packageDigest',package_digest);
  IF operation='queue_claim' THEN
    IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['command','continuation','expected','replayOnly']) IS NOT TRUE
      OR jsonb_typeof(i->'replayOnly') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'm04 invalid atomic claim' USING ERRCODE='P7601'; END IF;
    c:=official_v3_jobs_private.command_v1(i->'command');
    IF c->>'action' IS DISTINCT FROM 'claim' THEN RAISE EXCEPTION 'm04 invalid atomic claim' USING ERRCODE='P7601'; END IF;
    k:=c->>'jobKey'; claim:=c#>'{value,input}'; continuation:=i->'continuation';
    IF i->'expected'<>'null'::jsonb THEN PERFORM official_v3_jobs_private.job_v1(i->'expected'); END IF;
  ELSIF operation='queue_mutate' THEN
    IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['command','continuation','disposition','expected']) IS NOT TRUE THEN
      RAISE EXCEPTION 'm04 invalid atomic mutation' USING ERRCODE='P7601'; END IF;
    c:=official_v3_jobs_private.command_v1(i->'command'); k:=c->>'jobKey'; continuation:=i->'continuation';
    IF (c->>'action' IN ('enqueue','complete','fail')) IS NOT TRUE THEN
      RAISE EXCEPTION 'm04 invalid atomic mutation' USING ERRCODE='P7601'; END IF;
    IF i->'expected'<>'null'::jsonb THEN PERFORM official_v3_jobs_private.job_v1(i->'expected'); END IF;
      IF official_v3_jobs_private.exact_keys_v1(i->'disposition',CASE i#>>'{disposition,kind}' WHEN 'regular' THEN ARRAY['kind'] WHEN 'completed' THEN ARRAY['kind','attemptKey'] WHEN 'settled_failure' THEN ARRAY['kind','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
        OR (i#>>'{disposition,kind}' IN ('regular','completed','settled_failure')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid disposition' USING ERRCODE='P7601'; END IF;
      IF i#>>'{disposition,kind}'<>'regular' AND (i#>>'{disposition,attemptKey}' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid attempt' USING ERRCODE='P7601'; END IF;
      IF i#>>'{disposition,kind}'='settled_failure' AND (i#>>'{disposition,token}' ~ '^[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid token' USING ERRCODE='P7601'; END IF;
  ELSIF operation='queue_read' THEN
    IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['jobKey','continuation']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid read' USING ERRCODE='P7601'; END IF;
    k:=i->>'jobKey'; continuation:=i->'continuation';
  ELSIF operation IN ('queue_confirm','queue_cas') THEN
    IF official_v3_jobs_private.exact_keys_v1(i,CASE WHEN operation='queue_confirm' THEN ARRAY['command','continuation'] ELSE ARRAY['command','commit','subjectText','disposition'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command envelope' USING ERRCODE='P7601'; END IF;
    c:=official_v3_jobs_private.command_v1(i->'command'); k:=c->>'jobKey'; continuation:=i->'continuation';
    IF operation='queue_cas' THEN
      -- Validate the complete proposed transition before computing its advisory set;
      -- actual expected/current equality is checked again under the subject lock.
      PERFORM official_v3_jobs_private.transition_v1(c->'value',i#>'{commit,expected}',i->'commit');
      IF official_v3_jobs_private.exact_keys_v1(i->'disposition',CASE i#>>'{disposition,kind}' WHEN 'regular' THEN ARRAY['kind'] WHEN 'completed' THEN ARRAY['kind','attemptKey'] WHEN 'settled_failure' THEN ARRAY['kind','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
        OR (i#>>'{disposition,kind}' IN ('regular','completed','settled_failure')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid disposition' USING ERRCODE='P7601'; END IF;
      IF i#>>'{disposition,kind}'<>'regular' AND (i#>>'{disposition,attemptKey}' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid attempt' USING ERRCODE='P7601'; END IF;
      IF i#>>'{disposition,kind}'='settled_failure' AND (i#>>'{disposition,token}' ~ '^[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid token' USING ERRCODE='P7601'; END IF;
      IF jsonb_typeof(i->'subjectText') IS DISTINCT FROM 'string' OR octet_length(i->>'subjectText')>65536 THEN RAISE EXCEPTION 'm04 invalid subject' USING ERRCODE='P7601'; END IF;
      deadline:=least(deadline,official_v3_jobs_private.timestamp_v1(i#>>'{commit,notAfter}'));
    END IF;
  ELSE
    IF official_v3_jobs_private.exact_keys_v1(i,CASE operation WHEN 'execution_read' THEN ARRAY['claim','purpose'] WHEN 'execution_start' THEN ARRAY['claim','leasedJob','subjectText'] ELSE ARRAY['claim','attemptKey','token','result','references'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid execution' USING ERRCODE='P7601'; END IF;
    claim:=i->'claim'; PERFORM official_v3_jobs_private.command_v1(jsonb_build_object('action','claim','input',claim)); k:=claim->>'jobKey';
    IF operation='execution_read' AND (i->>'purpose' IN ('resume','lookup','confirm','artifact')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid read purpose' USING ERRCODE='P7601'; END IF;
    IF operation='execution_start' THEN
      PERFORM official_v3_jobs_private.job_v1(i->'leasedJob');
      next_identity:=CASE WHEN i#>>'{leasedJob,kind}'='research_job_record' THEN official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
        'context',i#>'{leasedJob,context}','method',i#>'{leasedJob,method}','factKind',i#>'{leasedJob,research,factKind}','researchReason',i#>'{leasedJob,research,researchReason}'))
        ELSE official_v3_jobs_private.subject_v1('combination_discovery',(i#>'{leasedJob,identity}')-'kind'-'jobKey') END;
      IF next_identity->>'jobKey' IS DISTINCT FROM k OR next_identity->'subjectText' IS DISTINCT FROM i->'subjectText' THEN RAISE EXCEPTION 'm04 subject preimage mismatch' USING ERRCODE='P7601'; END IF;
      attempt:='execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('subject',(i->>'subjectText')::jsonb,
        'claim',claim,'leasedJob',i->'leasedJob','authority',b||jsonb_build_object('epoch',epoch)),0),'UTF8')),'hex');
    ELSIF operation='execution_prepare' THEN
      IF (i->>'attemptKey' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE OR (i->>'token' ~ '^[a-f0-9]{64}$') IS NOT TRUE
        OR jsonb_typeof(i->'result') IS DISTINCT FROM 'object' OR jsonb_typeof(i->'references') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'm04 invalid prepare' USING ERRCODE='P7601'; END IF;
      attempt:=i->>'attemptKey';
    END IF;
  END IF;
  IF (k ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid subject locator' USING ERRCODE='P7601'; END IF;
  IF continuation IS NOT NULL AND continuation<>'null'::jsonb THEN
    IF official_v3_jobs_private.exact_keys_v1(continuation,CASE continuation->>'kind' WHEN 'prepared' THEN ARRAY['kind','claim','attemptKey'] WHEN 'owned_failure' THEN ARRAY['kind','claim','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
      OR (continuation->>'kind' IN ('prepared','owned_failure')) IS NOT TRUE
      OR (continuation->>'attemptKey' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR (continuation->>'kind'='owned_failure' AND (continuation->>'token' ~ '^[a-f0-9]{64}$') IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid continuation' USING ERRCODE='P7601'; END IF;
    PERFORM official_v3_jobs_private.command_v1(jsonb_build_object('action','claim','input',continuation->'claim'));
    IF continuation#>>'{claim,jobKey}' IS DISTINCT FROM k THEN RAISE EXCEPTION 'm04 continuation subject' USING ERRCODE='P7601'; END IF;
  END IF;
  -- All keys depend solely on fully validated request data. There are no later keys.
  lock_names:=ARRAY['subject:'||k];
  IF c IS NOT NULL THEN
    lock_names:=array_append(lock_names,'operation:'||(c->>'operationId'));
    IF c->>'action'='enqueue' THEN lock_names:=array_append(lock_names,'cycle:'||(c#>>'{value,input,jobId}')); END IF;
  END IF;
  IF operation IN ('queue_claim','queue_mutate') THEN
    lock_names:=array_append(lock_names,'audit:'||'queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',c->'operationId','command',c->'commandKey'),0),'UTF8')),'hex'));
    IF operation='queue_mutate' AND i#>>'{disposition,kind}'<>'regular' THEN
      lock_names:=array_append(lock_names,'attempt:'||(i#>>'{disposition,attemptKey}')); END IF;
  END IF;
  IF operation='queue_cas' THEN
    lock_names:=array_append(lock_names,'audit:'||(i#>>'{commit,audit,reference}'));
    IF i#>>'{disposition,kind}'<>'regular' THEN lock_names:=array_append(lock_names,'attempt:'||(i#>>'{disposition,attemptKey}')); END IF;
  END IF;
  IF claim IS NOT NULL THEN lock_names:=array_append(lock_names,'operation:'||(claim->>'operationId')); END IF;
  IF attempt IS NOT NULL THEN lock_names:=array_append(lock_names,'attempt:'||attempt); END IF;
  IF operation='execution_prepare' THEN
    IF (COALESCE(i#>>'{result,decisionRef}',i#>>'{result,discoveryRef}') ~ '^(source-decision|combination-discovery-result):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result key' USING ERRCODE='P7601'; END IF;
    lock_names:=array_append(lock_names,'result:'||COALESCE(i#>>'{result,decisionRef}',i#>>'{result,discoveryRef}'));
  END IF;
  -- Self-compatible relation locks isolate runtime subjects and finish DDL waits early.
  FOREACH relation IN ARRAY ARRAY['slots_v1','subjects_v1','queue_operations_v1','execution_starts_v1','execution_results_v1','execution_dispositions_v1','catalog_binding_v1'] LOOP
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before relation' USING ERRCODE='P7605'; END IF;
    PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
    EXECUTE format('LOCK TABLE official_v3_jobs_private.%I IN ROW EXCLUSIVE MODE',relation);
  END LOOP;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after relations' USING ERRCODE='P7605'; END IF;
  PERFORM official_v3_jobs_private.assert_catalog_v1();
  FOR lock_value IN SELECT DISTINCT ('x'||substr(encode(sha256(convert_to('m04-lock:v1:'||v,'UTF8')),'hex'),1,16))::bit(64)::bigint AS token
      FROM unnest(lock_names) v ORDER BY token LOOP
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before advisory' USING ERRCODE='P7605'; END IF;
    PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
    PERFORM pg_advisory_xact_lock(lock_value);
  END LOOP;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before subject' USING ERRCODE='P7605'; END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k FOR UPDATE;
  IF s.job_key IS NOT NULL THEN
    PERFORM official_v3_jobs_private.assert_history_v1(k);
    IF s.method_binding IS DISTINCT FROM b THEN RETURN jsonb_build_object('status','blocked'); END IF;
  END IF;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after subject' USING ERRCODE='P7605'; END IF;
  -- Complete all-older-unknown gate, independent of latest IDs and MA1 availability.
  IF s.open_attempt IS NOT NULL THEN
    SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt;
    SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=s.open_attempt;
    IF operation='execution_read' THEN
      eligible:=r.attempt_key IS NOT NULL AND t.claim_text=official_v3_jobs_private.canonical_v1(claim,0) AND s.current_job=t.leased_job;
    ELSIF operation='execution_prepare' THEN
      eligible:=i->>'attemptKey'=t.attempt_key AND t.claim_text=official_v3_jobs_private.canonical_v1(claim,0)
        AND t.token_hash=encode(sha256(convert_to(i->>'token','UTF8')),'hex') AND s.current_job=t.leased_job;
    ELSIF operation='queue_mutate' THEN
      -- The bundled confirm/read and CAS each retain their original START
      -- binding. The actual locked head replaces an external commit.expected.
      eligible:=i#>>'{disposition,attemptKey}'=t.attempt_key AND s.current_job=t.leased_job
        AND continuation IS NOT NULL AND continuation<>'null'::jsonb
        AND continuation->>'attemptKey'=t.attempt_key
        AND t.claim_text=official_v3_jobs_private.canonical_v1(continuation->'claim',0)
        AND ((c->>'action'='complete' AND i#>>'{disposition,kind}'='completed'
          AND continuation->>'kind'='prepared' AND r.attempt_key IS NOT NULL)
          OR (c->>'action'='fail' AND i#>>'{disposition,kind}'='settled_failure'
            AND continuation->>'kind'='owned_failure' AND r.attempt_key IS NULL
            AND t.token_hash=encode(sha256(convert_to(i#>>'{disposition,token}','UTF8')),'hex')
            AND t.token_hash=encode(sha256(convert_to(continuation->>'token','UTF8')),'hex')));
    ELSIF operation='queue_cas' THEN
      eligible:=i#>>'{disposition,attemptKey}'=t.attempt_key AND i#>'{commit,expected}'=t.leased_job
        AND ((i#>>'{disposition,kind}'='completed' AND r.attempt_key IS NOT NULL)
          OR (i#>>'{disposition,kind}'='settled_failure' AND r.attempt_key IS NULL AND t.token_hash=encode(sha256(convert_to(i#>>'{disposition,token}','UTF8')),'hex')));
    ELSIF operation IN ('queue_read','queue_confirm','queue_claim') AND continuation IS NOT NULL AND continuation<>'null'::jsonb THEN
      eligible:=continuation->>'attemptKey'=t.attempt_key AND t.claim_text=official_v3_jobs_private.canonical_v1(continuation->'claim',0)
        AND s.current_job=t.leased_job AND ((continuation->>'kind'='prepared' AND r.attempt_key IS NOT NULL)
          OR (continuation->>'kind'='owned_failure' AND r.attempt_key IS NULL AND t.token_hash=encode(sha256(convert_to(continuation->>'token','UTF8')),'hex')));
      IF operation IN ('queue_confirm','queue_claim') THEN eligible:=eligible AND ((c->>'action'='claim' AND c#>'{value,input}'=continuation->'claim')
        OR (c->>'action'='complete' AND continuation->>'kind'='prepared') OR (c->>'action'='fail' AND continuation->>'kind'='owned_failure')); END IF;
    END IF;
    IF eligible IS NOT TRUE THEN RETURN jsonb_build_object('status','blocked'); END IF;
    IF phase='authorized' AND t.authority IS DISTINCT FROM (b||jsonb_build_object('epoch',epoch)) THEN RETURN jsonb_build_object('status','blocked'); END IF;
  END IF;
  IF phase='probe' THEN
    bundle:=CASE operation WHEN 'queue_read' THEN official_v3_jobs_private.tx_queue_read_v1(q,b,epoch,remaining_ms,deadline)
      WHEN 'queue_confirm' THEN official_v3_jobs_private.tx_queue_confirm_v1(q,b,epoch,remaining_ms,deadline)
      ELSE official_v3_jobs_private.tx_execution_read_v1(q,b,epoch,remaining_ms,deadline) END;
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired probe' USING ERRCODE='P7605'; END IF;
    RETURN CASE WHEN bundle->'authority'='true'::jsonb THEN jsonb_build_object('status','requires_authority') ELSE bundle->'reply' END;
  END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  bundle:=CASE operation WHEN 'queue_read' THEN official_v3_jobs_private.tx_queue_read_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'queue_confirm' THEN official_v3_jobs_private.tx_queue_confirm_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'queue_claim' THEN official_v3_jobs_private.tx_queue_claim_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'queue_mutate' THEN official_v3_jobs_private.tx_queue_mutate_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'queue_cas' THEN official_v3_jobs_private.tx_queue_cas_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'execution_read' THEN official_v3_jobs_private.tx_execution_read_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'execution_start' THEN official_v3_jobs_private.tx_execution_start_v1(q,b,epoch,remaining_ms,deadline)
    ELSE official_v3_jobs_private.tx_execution_prepare_v1(q,b,epoch,remaining_ms,deadline) END;
  IF bundle->'authority' IS DISTINCT FROM 'true'::jsonb THEN
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired negative' USING ERRCODE='P7605'; END IF;
    RETURN bundle->'reply';
  END IF;
  -- Preexisting original PREPARED continuation reads also consume full actual S1.
  IF (bundle->'references' IS NULL OR bundle->'references'='null'::jsonb) AND r.attempt_key IS NOT NULL THEN
    bundle:=bundle||jsonb_build_object('references',r."references",'job',t.leased_job,'result',r.result,'lease',t.leased_job#>>'{lease,expiresAt}');
  END IF;
  PERFORM official_v3_jobs_private.assert_history_v1(k);
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after effects' USING ERRCODE='P7605'; END IF;
  IF jsonb_typeof(bundle->'references')='array' THEN
    FOR ref IN SELECT value FROM jsonb_array_elements(bundle->'references') ORDER BY value#>>'{binding,operationId}' COLLATE "C" LOOP
      IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before S1' USING ERRCODE='P7605'; END IF;
      PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
      opened:=official_v3_jobs_private.s1_read_v1(ref->'binding',ref->>'proposalDigest',(ref->>'bytes')::integer);
      IF opened#>'{record,reference}' IS DISTINCT FROM ref THEN RAISE EXCEPTION 'm04 S1 reference mismatch' USING ERRCODE='P7604'; END IF;
      PERFORM official_v3_jobs_private.consume_s1_v1(opened,bundle->'job',bundle->'result',CASE operation WHEN 'execution_prepare' THEN 'prepare' WHEN 'queue_cas' THEN 'complete' WHEN 'queue_mutate' THEN 'complete' ELSE 'read' END);
    END LOOP;
  END IF;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before authority' USING ERRCODE='P7605'; END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  raw_reply:=bundle->'reply';
  IF raw_reply IS NULL OR octet_length(official_v3_jobs_private.canonical_v1(raw_reply,0))>262144 THEN RAISE EXCEPTION 'm04 oversized reply' USING ERRCODE='P7601'; END IF;
  PERFORM official_v3_guard_private.seal_jobs_v1();
  -- LAST database authority check. It takes actual MA1 head FOR SHARE, then reads
  -- actual clock/tuple/epoch/expiry. No application DML or new lock follows it.
  PERFORM official_v3_jobs_private.ma1_require_v1(method_id,revision,method_digest,package_digest,epoch);
  IF clock_timestamp()>=deadline OR (bundle->>'lease' IS NOT NULL AND clock_timestamp()>=official_v3_jobs_private.timestamp_v1(bundle->>'lease'))
    OR (bundle->>'observedAt' IS NOT NULL AND clock_timestamp()<official_v3_jobs_private.timestamp_v1(bundle->>'observedAt'))
    OR (bundle->>'dueAt' IS NOT NULL AND clock_timestamp()<official_v3_jobs_private.timestamp_v1(bundle->>'dueAt')) THEN
    RAISE EXCEPTION 'm04 final expired budget or lease' USING ERRCODE='P7605'; END IF;
  RETURN raw_reply;
END $atomic_claim$;

CREATE FUNCTION official_v3_jobs_private.tx_queue_claim_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $atomic_claim$
DECLARE input jsonb:=q->'body'; c jsonb:=official_v3_jobs_private.command_v1(input->'command');
  i jsonb:=c#>'{value,input}'; continuation jsonb:=input->'continuation';
  confirmation jsonb; readback jsonb; written jsonb; receipt jsonb; envelope jsonb;
  confirm_request jsonb; read_request jsonb; commit_value jsonb; cas_request jsonb;
  expected jsonb; n jsonb; rev integer; kind text COLLATE "default"; observed text COLLATE "default";
  at_time timestamptz; subject_text text; replayed boolean:=false;
BEGIN
  IF q->>'operation' IS DISTINCT FROM 'queue_claim' OR q->>'phase' IS DISTINCT FROM 'authorized'
    OR official_v3_jobs_private.exact_keys_v1(input,ARRAY['command','continuation','expected','replayOnly']) IS NOT TRUE
    OR c->>'action' IS DISTINCT FROM 'claim' OR jsonb_typeof(input->'replayOnly') IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'm04 invalid atomic claim' USING ERRCODE='P7601'; END IF;
  IF input->'expected'<>'null'::jsonb THEN PERFORM official_v3_jobs_private.job_v1(input->'expected'); END IF;
  confirm_request:=jsonb_build_object('operation','queue_confirm','phase','authorized',
    'body',jsonb_build_object('command',c->'value','continuation',continuation));
  read_request:=jsonb_build_object('operation','queue_read','phase','authorized',
    'body',jsonb_build_object('jobKey',c->'jobKey','continuation',continuation));
  confirmation:=official_v3_jobs_private.tx_queue_confirm_v1(confirm_request,b,e,remaining,deadline);
  IF confirmation#>>'{reply,status}'='collision' THEN RETURN confirmation; END IF;
  IF confirmation#>>'{reply,status}'='committed' THEN
    -- This receipt is historical. It never authorizes a new effect or a later
    -- generation that happens to reuse the same caller-supplied lease ID.
    replayed:=true; receipt:=confirmation->'reply';
    readback:=official_v3_jobs_private.tx_queue_read_v1(read_request,b,e,remaining,deadline);
    IF readback#>>'{reply,status}' IS DISTINCT FROM 'present'
      OR readback#>'{reply,record}' IS DISTINCT FROM receipt->'record' THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','superseded'),'authority',false); END IF;
    n:=receipt->'record'; envelope:=(receipt->>'envelopeText')::jsonb;
    IF n->>'state'='leased' AND clock_timestamp()>=official_v3_jobs_private.timestamp_v1(n#>>'{lease,expiresAt}') THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','superseded'),'authority',false); END IF;
    RETURN jsonb_build_object('reply',receipt||jsonb_build_object('replayed',replayed),'authority',true,
      'lease',CASE WHEN n->>'state'='leased' THEN n#>>'{lease,expiresAt}' END,
      'observedAt',envelope#>>'{audit,observedAt}',
      'dueAt',CASE envelope#>>'{expected,state}' WHEN 'backoff' THEN envelope#>>'{expected,nextAttemptAt}'
        WHEN 'leased' THEN envelope#>>'{expected,lease,expiresAt}' END);
  END IF;
  IF confirmation#>>'{reply,status}' IS DISTINCT FROM 'not_attempted' THEN
    RAISE EXCEPTION 'm04 atomic claim confirmation invariant' USING ERRCODE='P7603'; END IF;
  IF (input->>'replayOnly')::boolean OR continuation<>'null'::jsonb THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  readback:=official_v3_jobs_private.tx_queue_read_v1(read_request,b,e,remaining,deadline);
  IF readback#>>'{reply,status}'='absent' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','not_due'),'authority',false); END IF;
  IF readback#>>'{reply,status}' IS DISTINCT FROM 'present' THEN
    RAISE EXCEPTION 'm04 atomic claim read invariant' USING ERRCODE='P7603'; END IF;
  expected:=readback#>'{reply,record}';
  IF input->'expected'<>'null'::jsonb AND input->'expected' IS DISTINCT FROM expected THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','mismatch'),'authority',false); END IF;
  -- Observe the real database clock after all original locks and pre-history.
  -- The outer API deadline was fixed before them and is never renewed here.
  observed:=to_char(date_trunc('milliseconds',clock_timestamp()) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  at_time:=official_v3_jobs_private.timestamp_v1(observed);
  IF (expected->>'state' IN ('queued','leased','backoff')) IS NOT TRUE
    OR (expected->>'state'='backoff' AND expected->>'nextAttemptAt'>observed)
    OR (expected->>'state'='leased' AND expected#>>'{lease,expiresAt}'>observed) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','not_due'),'authority',false); END IF;
  rev:=COALESCE((expected->>'revision')::integer,0)+1;
  -- BEGIN exact original transition_v1 claim branch.
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
  -- END exact original transition_v1 claim branch.
  n:=official_v3_jobs_private.job_v1(n);
  commit_value:=jsonb_build_object('operationId',i->'operationId','commandKey',c->'commandKey',
    'jobKey',c->'jobKey','expected',expected,'next',n,
    'notAfter',to_char((at_time+interval '5 seconds') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'audit',jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',i->'operationId','command',c->'commandKey'),0),'UTF8')),'hex'),
      'kind',kind,'observedAt',observed,'priorRevision',expected->'revision','nextRevision',n->'revision'));
  PERFORM official_v3_jobs_private.transition_v1(c->'value',expected,commit_value);
  SELECT s.subject_text INTO STRICT subject_text FROM official_v3_jobs_private.subjects_v1 s WHERE s.job_key=c->>'jobKey';
  cas_request:=jsonb_build_object('operation','queue_cas','phase','authorized',
    'body',jsonb_build_object('command',c->'value','commit',commit_value,'subjectText',subject_text,
      'disposition',jsonb_build_object('kind','regular')));
  written:=official_v3_jobs_private.tx_queue_cas_v1(cas_request,b,e,remaining,deadline);
  IF written->'authority' IS DISTINCT FROM 'true'::jsonb THEN
    IF (written#>>'{reply,status}' IN ('blocked','collision','quota','mismatch')) IS NOT TRUE THEN
      RAISE EXCEPTION 'm04 atomic claim CAS invariant' USING ERRCODE='P7603'; END IF;
    RETURN written;
  END IF;
  -- A failure after the original CAS must roll the whole transaction back.
  -- Never return an authority=false early exit after possible jobs DML.
  confirmation:=official_v3_jobs_private.tx_queue_confirm_v1(confirm_request,b,e,remaining,deadline);
  readback:=official_v3_jobs_private.tx_queue_read_v1(read_request,b,e,remaining,deadline);
  receipt:=confirmation->'reply';
  IF confirmation#>>'{reply,status}' IS DISTINCT FROM 'committed'
    OR receipt->'record' IS DISTINCT FROM n OR written#>'{reply,record}' IS DISTINCT FROM n
    OR readback#>>'{reply,status}' IS DISTINCT FROM 'present' OR readback#>'{reply,record}' IS DISTINCT FROM n
    OR receipt->>'operationId' IS DISTINCT FROM c->>'operationId'
    OR receipt->>'commandKey' IS DISTINCT FROM c->>'commandKey'
    OR receipt->>'commandText' IS DISTINCT FROM c->>'commandText'
    OR receipt->>'envelopeText' IS DISTINCT FROM official_v3_jobs_private.canonical_v1(commit_value,0) THEN
    RAISE EXCEPTION 'm04 atomic claim final readback invariant' USING ERRCODE='P7603'; END IF;
  RETURN written||jsonb_build_object('reply',receipt||jsonb_build_object('replayed',false),
    'lease',CASE WHEN n->>'state'='leased' THEN n#>>'{lease,expiresAt}' END,
    'observedAt',observed,
    'dueAt',CASE expected->>'state' WHEN 'backoff' THEN expected->>'nextAttemptAt'
      WHEN 'leased' THEN expected#>>'{lease,expiresAt}' END);
END $atomic_claim$;

CREATE FUNCTION official_v3_jobs_private.tx_queue_mutate_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $atomic_claim$
DECLARE input jsonb:=q->'body'; c jsonb:=official_v3_jobs_private.command_v1(input->'command');
  command jsonb:=c->'value'; i jsonb:=command->'input'; action text:=c->>'action';
  f jsonb:=i->'fence'; continuation jsonb:=input->'continuation';
  confirmation jsonb; readback jsonb; written jsonb; receipt jsonb;
  confirm_request jsonb; read_request jsonb; commit_value jsonb; cas_request jsonb;
  expected jsonb; n jsonb; identity jsonb; rev integer; delay_ms integer; result_key text;
  kind text COLLATE "default"; observed text COLLATE "default"; subject_text text;
  at_time timestamptz; end_time timestamptz;
BEGIN
  IF q->>'operation' IS DISTINCT FROM 'queue_mutate' OR q->>'phase' IS DISTINCT FROM 'authorized'
    OR official_v3_jobs_private.exact_keys_v1(input,ARRAY['command','continuation','disposition','expected']) IS NOT TRUE
    OR (action IN ('enqueue','complete','fail')) IS NOT TRUE THEN
    RAISE EXCEPTION 'm04 invalid atomic mutation' USING ERRCODE='P7601'; END IF;
  IF input->'expected'<>'null'::jsonb THEN PERFORM official_v3_jobs_private.job_v1(input->'expected'); END IF;
      IF official_v3_jobs_private.exact_keys_v1(input->'disposition',CASE input#>>'{disposition,kind}' WHEN 'regular' THEN ARRAY['kind'] WHEN 'completed' THEN ARRAY['kind','attemptKey'] WHEN 'settled_failure' THEN ARRAY['kind','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
        OR (input#>>'{disposition,kind}' IN ('regular','completed','settled_failure')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid disposition' USING ERRCODE='P7601'; END IF;
      IF input#>>'{disposition,kind}'<>'regular' AND (input#>>'{disposition,attemptKey}' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid attempt' USING ERRCODE='P7601'; END IF;
      IF input#>>'{disposition,kind}'='settled_failure' AND (input#>>'{disposition,token}' ~ '^[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid token' USING ERRCODE='P7601'; END IF;
  confirm_request:=jsonb_build_object('operation','queue_confirm','phase','authorized',
    'body',jsonb_build_object('command',command,'continuation',continuation));
  read_request:=jsonb_build_object('operation','queue_read','phase','authorized',
    'body',jsonb_build_object('jobKey',c->'jobKey','continuation',continuation));
  confirmation:=official_v3_jobs_private.tx_queue_confirm_v1(confirm_request,b,e,remaining,deadline);
  IF confirmation#>>'{reply,status}'='collision' THEN RETURN confirmation; END IF;
  IF confirmation#>>'{reply,status}'='committed' THEN
    -- Preserve the original immutable receipt and separately read its actual
    -- current generation. This is the original confirmed(mode=current) rule.
    receipt:=confirmation->'reply';
    readback:=official_v3_jobs_private.tx_queue_read_v1(read_request,b,e,remaining,deadline);
    IF readback#>>'{reply,status}' IS DISTINCT FROM 'present'
      OR readback#>'{reply,record,jobId}' IS DISTINCT FROM receipt#>'{record,jobId}' THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','superseded'),'authority',false); END IF;
    n:=readback#>'{reply,record}';
    RETURN confirmation||jsonb_build_object('reply',receipt||jsonb_build_object('replayed',true,'currentRecord',n),
      'observedAt',n->>'updatedAt');
  END IF;
  IF confirmation#>>'{reply,status}' IS DISTINCT FROM 'not_attempted' THEN
    RAISE EXCEPTION 'm04 atomic mutation confirmation invariant' USING ERRCODE='P7603'; END IF;
  readback:=official_v3_jobs_private.tx_queue_read_v1(read_request,b,e,remaining,deadline);
  IF readback#>>'{reply,status}'='present' THEN expected:=readback#>'{reply,record}';
  ELSIF readback#>>'{reply,status}' IS DISTINCT FROM 'absent' THEN
    RAISE EXCEPTION 'm04 atomic mutation read invariant' USING ERRCODE='P7603'; END IF;
  IF input->'expected'<>'null'::jsonb AND input->'expected' IS DISTINCT FROM expected THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','mismatch'),'authority',false); END IF;
  observed:=to_char(date_trunc('milliseconds',clock_timestamp()) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  at_time:=official_v3_jobs_private.timestamp_v1(observed); end_time:=at_time+interval '5 seconds';
  IF action='enqueue' AND expected->>'state' NOT IN ('queued','leased','backoff')
    AND expected->'jobId'=i->'jobId' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  IF action IN ('complete','fail') AND (expected IS NULL OR expected->>'state'<>'leased'
    OR f IS DISTINCT FROM jsonb_build_object('jobId',expected->'jobId','revision',expected->'revision',
      'leaseId',expected#>'{lease,leaseId}','generation',expected#>'{lease,generation}')
    OR expected#>>'{lease,expiresAt}'<=observed) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','superseded'),'authority',false); END IF;
  -- BEGIN exact original transition_v1 lifecycle constructor. The validated
  -- operation above excludes claim; every enqueue/complete/fail byte is kept.
  rev:=COALESCE((expected->>'revision')::integer,0)+1;
  IF action='enqueue' THEN
    IF expected->>'state' IN ('queued','leased','backoff') THEN n:=expected; kind:='deduplicated';
    ELSE
      IF expected->'jobId'=i->'jobId' THEN RAISE EXCEPTION 'm04 repeated cycle' USING ERRCODE='P7601'; END IF;
      n:=jsonb_build_object('schema',3,'jobId',i->'jobId','operationId',i->'operationId','revision',rev,'predecessorRevision',expected->'revision',
        'state','queued','createdAt',observed,'updatedAt',observed,'attempt',0,'attemptLimit',i->'attemptLimit','lease',NULL,'nextAttemptAt',NULL,'lastFailure',NULL);
      identity:=official_v3_jobs_private.subject_v1(command->>'kind',i-'operationId'-'jobId'-'attemptLimit');
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
  IF kind IS DISTINCT FROM 'deduplicated' THEN n:=official_v3_jobs_private.job_v1(n); END IF;
  -- END exact original transition_v1 lifecycle constructor.
  commit_value:=jsonb_build_object('operationId',i->'operationId','commandKey',c->'commandKey',
    'jobKey',c->'jobKey','expected',expected,'next',n,
    'notAfter',to_char(end_time AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'audit',jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',i->'operationId','command',c->'commandKey'),0),'UTF8')),'hex'),
      'kind',kind,'observedAt',observed,'priorRevision',expected->'revision','nextRevision',n->'revision'));
  PERFORM official_v3_jobs_private.transition_v1(command,COALESCE(expected,'null'::jsonb),commit_value);
  IF action='enqueue' THEN
    subject_text:=c->>'subjectText';
  ELSE
    SELECT s.subject_text INTO STRICT subject_text FROM official_v3_jobs_private.subjects_v1 s WHERE s.job_key=c->>'jobKey';
  END IF;
  cas_request:=jsonb_build_object('operation','queue_cas','phase','authorized',
    'body',jsonb_build_object('command',command,'commit',commit_value,'subjectText',subject_text,
      'disposition',input->'disposition'));
  written:=official_v3_jobs_private.tx_queue_cas_v1(cas_request,b,e,remaining,deadline);
  IF written->'authority' IS DISTINCT FROM 'true'::jsonb THEN
    IF (written#>>'{reply,status}' IN ('blocked','collision','quota','mismatch')) IS NOT TRUE THEN
      RAISE EXCEPTION 'm04 atomic mutation CAS invariant' USING ERRCODE='P7603'; END IF;
    RETURN written;
  END IF;
  -- Any unexpected read after possible DML aborts the entire transaction.
  confirmation:=official_v3_jobs_private.tx_queue_confirm_v1(confirm_request,b,e,remaining,deadline);
  readback:=official_v3_jobs_private.tx_queue_read_v1(read_request,b,e,remaining,deadline);
  receipt:=confirmation->'reply';
  IF confirmation#>>'{reply,status}' IS DISTINCT FROM 'committed'
    OR receipt->'record' IS DISTINCT FROM n OR written#>'{reply,record}' IS DISTINCT FROM n
    OR readback#>>'{reply,status}' IS DISTINCT FROM 'present' OR readback#>'{reply,record}' IS DISTINCT FROM n
    OR receipt->>'operationId' IS DISTINCT FROM c->>'operationId'
    OR receipt->>'commandKey' IS DISTINCT FROM c->>'commandKey'
    OR receipt->>'commandText' IS DISTINCT FROM c->>'commandText'
    OR receipt->>'envelopeText' IS DISTINCT FROM official_v3_jobs_private.canonical_v1(commit_value,0) THEN
    RAISE EXCEPTION 'm04 atomic mutation final readback invariant' USING ERRCODE='P7603'; END IF;
  -- Retain the original CAS lease, actual PREPARED/S1 references and clock
  -- fields. The API consumes them under its unchanged outer deadline.
  RETURN written||jsonb_build_object('reply',receipt||jsonb_build_object('replayed',false,'currentRecord',n));
END $atomic_claim$;
REVOKE ALL ON FUNCTION official_v3_jobs_private.tx_queue_claim_v1(jsonb,jsonb,integer,integer,timestamptz),official_v3_jobs_private.tx_queue_mutate_v1(jsonb,jsonb,integer,integer,timestamptz) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
