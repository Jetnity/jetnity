// Owned-local byte/error oracle for the two finite serialization shortcuts.
// These synthetic canonical vectors grant no command/attempt/publication authority.
import assert from 'node:assert/strict'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { historyCanonicalBlock, HISTORY_CANONICAL_DECLARATION } from './history-canonical.mjs'
import { historyCommandCanonicalBlock } from './history-command-canonical.mjs'
import { historyAttemptCanonicalBlock } from './history-attempt-canonical.mjs'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;'
type ObjectValue = Record<string, unknown>
type Shortcut = 'command' | 'attempt'
type Result = { fast: boolean; state: string | null; entries: number; bytes: number }

/** Requires the existing immutable64-cycle owned fixture, as history-native.ts
 * already installs before its original Canon oracle. No fixture rows are edited. */
export async function checkHistoryStructuredCanonical(proof: OwnedPersistentProof, exhausted: unknown, leased: unknown) {
  const base = exhausted as ObjectValue, leasedJob = leased as ObjectValue
  const lease = leasedJob.lease as ObjectValue, research = base.research as ObjectValue
  assert.ok(typeof base.jobKey === 'string' && lease && research)
  const discoverySubject = { destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: base.method }
  const discoveryIdentity = await proof.value<ObjectValue>(
    "official_v3_jobs_private.subject_v1('combination_discovery'," + json(discoverySubject) + ')', owner)
  assert.ok(typeof discoveryIdentity.subjectText === 'string')
  const discoveryJob: ObjectValue = { ...leasedJob, kind: 'combination_discovery_job_record',
    identity: { kind: 'combination_discovery', ...discoverySubject, jobKey: discoveryIdentity.jobKey }, resultDiscoveryRef: null }
  for (const key of ['jobKey', 'context', 'contextKey', 'research', 'method', 'resultDecisionRef']) delete discoveryJob[key]
  for (const value of [base, leasedJob, discoveryJob]) {
    assert.deepEqual(await proof.value<ObjectValue>('official_v3_jobs_private.job_v1(' + json(value) + ')', owner), value,
      'the structured vectors use complete jobs accepted by the unchanged validator')
  }

  const enqueue = { action: 'enqueue', kind: 'rule_research', input: { context: base.context, method: base.method,
    factKind: research.factKind, researchReason: research.researchReason, operationId: base.operationId,
    jobId: base.jobId, attemptLimit: 1 } }
  const recheck = { ...enqueue, input: { ...enqueue.input,
    researchReason: { status: 'recheck_needed', reason: 'max_age_exceeded' } } }
  const discoveryEnqueue = { action: 'enqueue', kind: 'combination_discovery', input: {
    ...discoverySubject, operationId: base.operationId, jobId: base.jobId, attemptLimit: 1 } }
  const claim = { operationId: base.operationId, jobKey: base.jobKey, leaseId: lease.leaseId, leaseMilliseconds: 30000 }
  const claimCommand = { action: 'claim', input: claim }
  const fence = { jobId: leasedJob.jobId, revision: leasedJob.revision, leaseId: lease.leaseId, generation: lease.generation }
  const fail = { action: 'fail', input: { operationId: base.operationId, jobKey: base.jobKey, fence, reason: 'unreachable' } }
  // Reference syntax is a canonical command fixture only; no completion is sent.
  const complete = { action: 'complete', kind: 'rule_research', input: { operationId: base.operationId,
    jobKey: base.jobKey, fence, decisionRef: 'source-decision:v3:' + 'a'.repeat(64) } }
  const discoveryComplete = { action: 'complete', kind: 'combination_discovery', input: { operationId: base.operationId,
    jobKey: discoveryIdentity.jobKey, fence, discoveryRef: 'combination-discovery-result:v3:' + 'b'.repeat(64) } }
  const commands = [enqueue, recheck, discoveryEnqueue, claimCommand, fail, complete, discoveryComplete]
  for (const value of commands) {
    const original = await proof.value<ObjectValue>('official_v3_jobs_private.command_v1(' + json(value) + ')', owner)
    assert.deepEqual(original.value, value, 'positive command forms pass the original command parser')
  }

  // Read the real owned fixture's retained claim/authority/subject, including its
  // full method binding. The discovery variant changes only its explicit inputs.
  const attempt = await proof.value<ObjectValue>(`(SELECT jsonb_build_object('subject',s.subject_text::jsonb,
    'claim',t.claim_text::jsonb,'leasedJob',t.leased_job,'authority',t.authority)
    FROM official_v3_jobs_private.execution_starts_v1 t
    JOIN official_v3_jobs_private.subjects_v1 s USING(job_key)
    WHERE t.job_key=${literal(base.jobKey)} AND t.leased_job=${json(leasedJob)})`, owner)
  assert.ok(attempt && typeof attempt === 'object')
  assert.deepEqual(attempt.leasedJob, leasedJob)
  const discoveryAttempt = { ...attempt, subject: JSON.parse(discoveryIdentity.subjectText) as unknown,
    claim: { ...(attempt.claim as ObjectValue), jobKey: discoveryIdentity.jobKey }, leasedJob: discoveryJob }

  await proof.run(owner + `CREATE FUNCTION public.local_history_structured_canonical(shortcut text,
    warm_value jsonb,warm_depth integer,input_value jsonb,input_depth integer) RETURNS jsonb LANGUAGE plpgsql AS $structured$
  DECLARE expected text; actual text; fast text; warmed text; expected_state text; actual_state text;
    expected_message text; actual_message text; before_memo jsonb; before_count integer; before_bytes integer;
    actual_count bigint; actual_bytes bigint;
${HISTORY_CANONICAL_DECLARATION}
  BEGIN
    IF warm_value IS NOT NULL THEN ${historyCanonicalBlock('warm_value', 'warm_depth', 'warmed', 2, 0, [])} END IF;
    before_memo:=subtree_memo; before_count:=subtree_memo_count; before_bytes:=subtree_memo_bytes;
    BEGIN expected:=official_v3_jobs_private.canonical_v1(input_value,input_depth);
      EXCEPTION WHEN OTHERS THEN expected_state:=SQLSTATE;expected_message:=SQLERRM;END;
    -- Invalid/unknown inputs must return a miss here, never throw a substitute
    -- error before the unchanged complete fallback has had its original turn.
    IF shortcut='command' THEN ${historyCommandCanonicalBlock('input_value', 'input_depth', 'fast')}
    ELSIF shortcut='attempt' THEN ${historyAttemptCanonicalBlock('input_value', 'input_depth', 'fast')}
    ELSE RAISE EXCEPTION 'unknown owned shortcut vector';END IF;
    IF subtree_memo IS DISTINCT FROM before_memo OR subtree_memo_count<>before_count OR subtree_memo_bytes<>before_bytes THEN
      RAISE EXCEPTION 'structured shortcut changed the existing memo';END IF;
    BEGIN
      IF fast IS NOT NULL THEN actual:=fast;
      ELSE ${historyCanonicalBlock('input_value', 'input_depth', 'actual', 2, 0, [])} END IF;
      EXCEPTION WHEN OTHERS THEN actual_state:=SQLSTATE;actual_message:=SQLERRM;END;
    IF expected_state IS DISTINCT FROM actual_state OR expected_message IS DISTINCT FROM actual_message
      OR convert_to(expected,'UTF8') IS DISTINCT FROM convert_to(actual,'UTF8') THEN
      RAISE EXCEPTION 'structured canonical byte/error mismatch';END IF;
    SELECT coalesce(sum(octet_length(key)::bigint+octet_length(value#>>'{}')::bigint),0),count(*)
      INTO actual_bytes,actual_count FROM jsonb_each(subtree_memo);
    IF actual_bytes<>subtree_memo_bytes OR actual_bytes>16384 OR subtree_memo_count>8 OR actual_count<>subtree_memo_count THEN
      RAISE EXCEPTION 'structured canonical memo cap/accounting';END IF;
    RETURN jsonb_build_object('fast',fast IS NOT NULL,'state',actual_state,'entries',before_count,'bytes',before_bytes);
  END $structured$;`, 'finite command/attempt shortcuts versus original byte/error serializer')

  const results: { shortcut: Shortcut; result: Result }[] = []
  const check = async (shortcut: Shortcut, value: unknown, fast: boolean, state: string | null = null,
    options: { warm?: unknown; warmDepth?: number; depth?: number } = {}) => {
    const warm = options.warm === undefined ? value : options.warm
    const result = await proof.value<Result>('public.local_history_structured_canonical(' + literal(shortcut) + ','
      + (warm === null ? 'NULL::jsonb' : json(warm)) + ',' + (options.warmDepth ?? 0) + ',' + json(value) + ','
      + (options.depth ?? 0) + ')', owner)
    assert.equal(result.fast, fast, shortcut + ' direct positive/miss path')
    assert.equal(result.state, state, shortcut + ' original error state')
    results.push({ shortcut, result })
    return result
  }
  for (const value of commands) await check('command', value, true)
  await check('command', enqueue, false, null, { warm: null })
  await check('command', enqueue, false, null, { warmDepth: 1 })
  await check('command', claimCommand, false, null, { depth: 1 })
  await check('command', { ...claimCommand, extra: true }, false)
  await check('command', { ...fail, input: { ...fail.input, fence: { ...fence, generation: 1.5 } } }, false, 'P7601', { warm: fail })
  await check('command', { ...claimCommand, input: { ...claim, leaseId: 'Zürich' } }, false, 'P7601', { warm: claimCommand })
  for (const value of [attempt, discoveryAttempt]) assert.ok((await check('attempt', value, true)).entries > 0)
  await check('attempt', attempt, false, null, { warm: null })
  await check('attempt', attempt, false, null, { warmDepth: 1 })
  await check('attempt', { ...attempt, leasedJob: { ...leasedJob, extra: true } }, false, null, { warm: attempt })
  await check('attempt', { ...attempt, leasedJob: { ...leasedJob, lease: { ...lease, generation: 1.5 } } }, false, 'P7601', { warm: attempt })
  await check('attempt', { ...attempt, subject: { ...(attempt.subject as ObjectValue), extra: 'Zürich' } }, false, 'P7601', { warm: attempt })
  return { vectors: results.length, commandHits: results.filter(r => r.shortcut === 'command' && r.result.fast).length,
    attemptHits: results.filter(r => r.shortcut === 'attempt' && r.result.fast).length,
    misses: results.filter(r => !r.result.fast).length, matchedErrors: results.filter(r => r.result.state !== null).length }
}
