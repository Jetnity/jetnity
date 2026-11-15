// Ordinary queue operations inside the existing M04 transaction and authority boundary.
// The original confirm/read/transition/rolling-CAS helpers still own semantics;
// both direct history checks and the complete final BG1 seal remain unchanged.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const here = new URL('./', import.meta.url)
const read = path => readFileSync(new URL(path, here), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')

export const ATOMIC_CLAIM_REPLACEMENTS = Object.freeze([
  'official_v3_jobs_private.wire_v1(text)',
  'official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)',
])
export const ATOMIC_CLAIM_HELPER_SIGNATURE =
  'official_v3_jobs_private.tx_queue_claim_v1(jsonb,jsonb,integer,integer,timestamptz)'
export const ATOMIC_MUTATE_HELPER_SIGNATURE =
  'official_v3_jobs_private.tx_queue_mutate_v1(jsonb,jsonb,integer,integer,timestamptz)'
export const ATOMIC_QUEUE_HELPER_SIGNATURES = Object.freeze([
  ATOMIC_CLAIM_HELPER_SIGNATURE, ATOMIC_MUTATE_HELPER_SIGNATURE,
])
export const ATOMIC_CLAIM_SOURCE_PINS = Object.freeze({
  '../official-truth-v3-hosted-durable-jobs-1/install-candidate.sql':
    '9d9623206dfd82a9cbd465aef6e36ea48fe0534ff02a85d1a857b2672ec67818',
  '../official-truth-v3-background-guard-1/provider-migration-body.sql':
    'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950',
  '../official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql':
    '7324c5e87d18de2a692e7e61123a44565ca440ecc9f8e9afddf379ede2aac32a',
})
export const ATOMIC_CLAIM_ORIGINAL_BODY_PINS = Object.freeze({
  [ATOMIC_CLAIM_REPLACEMENTS[0]]: '98eb7a975288f3c9afdebc50131dd367a5f0459b3e0230ce2cd7cb88ea83c655',
  [ATOMIC_CLAIM_REPLACEMENTS[1]]: 'ebf97604360e16d31bff8b34e7fb6380a643d207198e9b0af2ea95821650ece5',
  'official_v3_jobs_private.transition_v1(jsonb,jsonb,jsonb)': '147cb10e9fd33e73082eaf43746552fa589e89db4b600a1fc927a2339f31b7f0',
  'official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz)': '5aba833e05ecc71fa7daa4f579a6e982eddf8e67bd5306d9ef383c8a73d73b16',
  'official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz)': 'cc90f242fec962daa71edcf534c5f24eb72541571aadc42ff1d3704efe2ffc75',
  'official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)': '1594e7681d06875e42ac601635561589ce89cdaf5ae4a5091b7a6a71c9ca27b7',
})

function once(value, before, after) {
  assert.equal(value.split(before).length, 2, 'exact atomic-claim source anchor: ' + before.slice(0, 100))
  return value.replace(before, () => after)
}
function selected(source, signature) {
  const found = functionsIn(source).filter(f => f.signature === signature)
  assert.equal(found.length, 1, 'one original atomic-claim dependency: ' + signature)
  assert.equal(sha(found[0].body), ATOMIC_CLAIM_ORIGINAL_BODY_PINS[signature], 'immutable original body: ' + signature)
  return found[0]
}
function definition(f, body, replace = true) {
  return 'CREATE ' + (replace ? 'OR REPLACE ' : '') + 'FUNCTION ' + f.name + '(' + f.args + ') '
    + f.options + 'AS $atomic_claim$' + body + '$atomic_claim$;'
}

const eventReference = "'queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',i->'operationId','command',c->'commandKey'),0),'UTF8')),'hex')"
const apiEventReference = eventReference.replace("i->'operationId'", "c->'operationId'")

function claimBranch(transition) {
  const start = "  ELSIF action='claim' THEN\n"
  const end = "\n  ELSE\n    IF expected IS NULL OR expected->>'state'<>'leased'"
  assert.equal(transition.split(start).length, 2)
  const offset = transition.indexOf(start) + start.length
  const last = transition.indexOf(end, offset)
  assert.ok(last > offset && transition.indexOf(end, last + end.length) === -1,
    'one complete original claim transition branch')
  assert.equal(transition.split(eventReference).length, 2, 'original event reference preimage')
  const branch = transition.slice(offset, last)
  assert.ok(branch.includes("IF (expected->>'attempt')::integer>=(expected->>'attemptLimit')::integer"))
  assert.ok(branch.includes("kind:=CASE WHEN expected->>'state'='leased' THEN 'reclaimed' ELSE 'leased' END;"))
  return branch
}

function lifecycleBranches(transition) {
  const start = "  rev:=COALESCE((expected->>'revision')::integer,0)+1;\n"
  const end = "\n  IF commit->'next' IS DISTINCT FROM n"
  assert.equal(transition.split(start).length, 2)
  assert.equal(transition.split(end).length, 2)
  const offset = transition.indexOf(start), last = transition.indexOf(end, offset)
  assert.ok(last > offset, 'complete original lifecycle constructor')
  const branches = transition.slice(offset, last)
  for (const needle of ["IF action='enqueue' THEN", "ELSIF action='claim' THEN",
    "IF action='complete' THEN", "IF kind IS DISTINCT FROM 'deduplicated' THEN n:=official_v3_jobs_private.job_v1(n); END IF;"])
    assert.equal(branches.split(needle).length, 2, 'one original lifecycle branch: ' + needle)
  return branches
}

function dispositionValidation(name) {
  return `      IF official_v3_jobs_private.exact_keys_v1(${name}->'disposition',CASE ${name}#>>'{disposition,kind}' WHEN 'regular' THEN ARRAY['kind'] WHEN 'completed' THEN ARRAY['kind','attemptKey'] WHEN 'settled_failure' THEN ARRAY['kind','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
        OR (${name}#>>'{disposition,kind}' IN ('regular','completed','settled_failure')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid disposition' USING ERRCODE='P7601'; END IF;
      IF ${name}#>>'{disposition,kind}'<>'regular' AND (${name}#>>'{disposition,attemptKey}' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid attempt' USING ERRCODE='P7601'; END IF;
      IF ${name}#>>'{disposition,kind}'='settled_failure' AND (${name}#>>'{disposition,token}' ~ '^[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid token' USING ERRCODE='P7601'; END IF;`
}

function helperBody(originalClaim) {
  return `
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
${originalClaim}
  -- END exact original transition_v1 claim branch.
  n:=official_v3_jobs_private.job_v1(n);
  commit_value:=jsonb_build_object('operationId',i->'operationId','commandKey',c->'commandKey',
    'jobKey',c->'jobKey','expected',expected,'next',n,
    'notAfter',to_char((at_time+interval '5 seconds') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'audit',jsonb_build_object('reference',${eventReference},
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
END `
}

function mutationBody(originalLifecycle) {
  return `
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
${dispositionValidation('input')}
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
${originalLifecycle}
  -- END exact original transition_v1 lifecycle constructor.
  commit_value:=jsonb_build_object('operationId',i->'operationId','commandKey',c->'commandKey',
    'jobKey',c->'jobKey','expected',expected,'next',n,
    'notAfter',to_char(end_time AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'audit',jsonb_build_object('reference',${eventReference},
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
END `
}

function executeBody(original) {
  assert.equal(original.split(dispositionValidation('i')).length, 2,
    'original complete disposition validation is reused unchanged')
  let body = original
  const changes = []
  const change = (before, after) => { body = once(body, before, after); changes.push([before, after]) }
  const readBranch = "  IF operation='queue_read' THEN\n"
    + "    IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['jobKey','continuation']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid read' USING ERRCODE='P7601'; END IF;"
  const atomicBranch = `  IF operation='queue_claim' THEN
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
${dispositionValidation('i')}
  ELSIF operation='queue_read' THEN
    IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['jobKey','continuation']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid read' USING ERRCODE='P7601'; END IF;`
  change(readBranch, atomicBranch)
  const auditLock = "  IF operation='queue_cas' THEN\n    lock_names:=array_append(lock_names,'audit:'||(i#>>'{commit,audit,reference}'));"
  change(auditLock, `  IF operation IN ('queue_claim','queue_mutate') THEN
    lock_names:=array_append(lock_names,'audit:'||${apiEventReference});
    IF operation='queue_mutate' AND i#>>'{disposition,kind}'<>'regular' THEN
      lock_names:=array_append(lock_names,'attempt:'||(i#>>'{disposition,attemptKey}')); END IF;
  END IF;
${auditLock}`)
  const casAdmission = "    ELSIF operation='queue_cas' THEN\n"
    + "      eligible:=i#>>'{disposition,attemptKey}'=t.attempt_key AND i#>'{commit,expected}'=t.leased_job"
  change(casAdmission, `    ELSIF operation='queue_mutate' THEN
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
${casAdmission}`)
  change("ELSIF operation IN ('queue_read','queue_confirm') AND continuation IS NOT NULL",
    "ELSIF operation IN ('queue_read','queue_confirm','queue_claim') AND continuation IS NOT NULL")
  change("      IF operation='queue_confirm' THEN eligible:=eligible AND",
    "      IF operation IN ('queue_confirm','queue_claim') THEN eligible:=eligible AND")
  const authorizedDispatch = "    WHEN 'queue_cas' THEN official_v3_jobs_private.tx_queue_cas_v1(q,b,epoch,remaining_ms,deadline)"
  change(authorizedDispatch, "    WHEN 'queue_claim' THEN official_v3_jobs_private.tx_queue_claim_v1(q,b,epoch,remaining_ms,deadline)\n"
    + "    WHEN 'queue_mutate' THEN official_v3_jobs_private.tx_queue_mutate_v1(q,b,epoch,remaining_ms,deadline)\n"
    + authorizedDispatch)
  change("WHEN 'queue_cas' THEN 'complete' ELSE 'read' END",
    "WHEN 'queue_cas' THEN 'complete' WHEN 'queue_mutate' THEN 'complete' ELSE 'read' END")
  for (const [before, after] of [...changes].reverse()) body = once(body, after, before)
  assert.equal(body, original, 'every original API byte survives the finite new-operation branches')
  body = original
  for (const [before, after] of changes) body = once(body, before, after)
  for (const [needle, expected] of [
    ['PERFORM official_v3_guard_private.begin_jobs_v1();', 1],
    ['PERFORM official_v3_jobs_private.assert_history_v1(k);', 2],
    ['PERFORM official_v3_guard_private.seal_jobs_v1();', 1],
    ['PERFORM official_v3_jobs_private.ma1_require_v1(method_id,revision,method_digest,package_digest,epoch);', 1],
  ]) assert.equal(body.split(needle).length - 1, expected, 'unchanged full API gate: ' + needle)
  return body
}

export function compileAtomicClaimDefinitions() {
  const sources = Object.entries(ATOMIC_CLAIM_SOURCE_PINS).map(([path, digest]) => {
    const sql = read(path)
    assert.equal(sha(sql), digest, 'immutable atomic-claim source: ' + path)
    return { path, digest, sql }
  })
  const wire = selected(sources[0].sql, ATOMIC_CLAIM_REPLACEMENTS[0])
  const execute = selected(sources[1].sql, ATOMIC_CLAIM_REPLACEMENTS[1])
  const transition = selected(sources[0].sql, 'official_v3_jobs_private.transition_v1(jsonb,jsonb,jsonb)')
  const readHelper = selected(sources[0].sql, 'official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz)')
  const confirm = selected(sources[0].sql, 'official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz)')
  const cas = selected(sources[2].sql, 'official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)')
  const oldOps = "('queue_read','queue_confirm','queue_cas','execution_read','execution_start','execution_prepare')"
  let wireBody = once(wire.body, oldOps,
    "('queue_read','queue_confirm','queue_cas','execution_read','execution_start','execution_prepare','queue_claim','queue_mutate')")
  wireBody = once(wireBody, "    OR (v->>'phase' IN ('probe','authorized')) IS NOT TRUE",
    "    OR (v->>'operation' IN ('queue_claim','queue_mutate') AND v->>'phase' IS DISTINCT FROM 'authorized')\n"
    + "    OR (v->>'phase' IN ('probe','authorized')) IS NOT TRUE")
  const originalClaim = claimBranch(transition.body), originalLifecycle = lifecycleBranches(transition.body)
  const helper = { ...cas, name: 'official_v3_jobs_private.tx_queue_claim_v1',
    signature: ATOMIC_CLAIM_HELPER_SIGNATURE, body: helperBody(originalClaim) }
  const mutationHelper = { ...cas, name: 'official_v3_jobs_private.tx_queue_mutate_v1',
    signature: ATOMIC_MUTATE_HELPER_SIGNATURE, body: mutationBody(originalLifecycle) }
  const definitions = [{ ...wire, body: wireBody }, { ...execute, body: executeBody(execute.body) }, helper, mutationHelper]
  const sql = '-- Additive atomic ordinary queue operations. Original five-second transaction, all full checks and authority gates remain.\n'
    + definitions.map((f, i) => definition(f, f.body, i < 2)).join('\n\n')
    + '\nREVOKE ALL ON FUNCTION ' + ATOMIC_QUEUE_HELPER_SIGNATURES.join(',')
    + ' FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;\n'
  assertTransactionBody(sql)
  assert.deepEqual(functionsIn(sql).map(f => f.signature), [...ATOMIC_CLAIM_REPLACEMENTS, ...ATOMIC_QUEUE_HELPER_SIGNATURES])
  return { sql, definitions, originals: [wire, execute], helper, mutationHelper, helpers: [helper, mutationHelper],
    dependencies: [transition, readHelper, confirm, cas].map(f => ({ signature: f.signature, bodyDigest: sha(f.body) })),
    before: Object.fromEntries([wire, execute].map(f => [f.signature, sha(f.body)])),
    after: Object.fromEntries(definitions.map(f => [f.signature, sha(f.body)])),
    digest: sha(sql), sources: sources.map(({ path, digest }) => ({ path, digest })),
    claimBranchDigest: sha(originalClaim), lifecycleBranchDigest: sha(originalLifecycle) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'atomic_claim_build_mode_required')
  const { sql } = compileAtomicClaimDefinitions()
  if (process.argv[2] === '--write') writeFileSync(new URL('atomic-claim-definitions.sql', here), sql)
  else assert.equal(read('atomic-claim-definitions.sql'), sql, 'atomic-claim SQL matches its exact compiler')
}
