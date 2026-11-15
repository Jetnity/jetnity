// Compare the complete generated inline job block against the unchanged job_v1,
// retaining warm caches across adversarial identity/lifecycle input changes.
import assert from 'node:assert/strict'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { HISTORY_CANONICAL_DECLARATION } from './history-canonical.mjs'
import { HISTORY_NODES_DECLARATION } from './history-nodes.mjs'
import type { compileHistoryDefinition } from './history-build.mjs'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;'
type Result = { state: string | null; message: string | null; jobKey: string | null }
type Job = Record<string, unknown>

export async function checkHistoryJobs(proof: OwnedPersistentProof, successor: ReturnType<typeof compileHistoryDefinition>,
  exhausted: unknown, leased: unknown) {
  const start = 'DECLARE v jsonb:=s.current_job;'
  const end = '  NULL;\nEND;'
  assert.equal(successor.body.split(start).length, 2)
  const from = successor.body.indexOf(start), to = successor.body.indexOf(end, from)
  assert.ok(to > from)
  const block = successor.body.slice(from, to + end.length).replace(start, 'DECLARE v jsonb:=probe_input;')
    .replace(end, '  probe_result:=v;\nEND;')
  await proof.run(owner + `CREATE FUNCTION public.local_history_jobs(items jsonb[]) RETURNS jsonb LANGUAGE plpgsql AS $probe$
  DECLARE at integer; probe_input jsonb; probe_result jsonb; expected jsonb; expected_state text; actual_state text;
    expected_message text; actual_message text; result jsonb:='[]';
    memo_subject_kind text COLLATE "C"; memo_subject_text text COLLATE "C"; memo_subject_result jsonb;
${HISTORY_CANONICAL_DECLARATION}
${HISTORY_NODES_DECLARATION}
  BEGIN FOR at IN 1..cardinality(items) LOOP
    probe_input:=items[at];expected:=NULL;probe_result:=NULL;
    expected_state:=NULL;actual_state:=NULL;expected_message:=NULL;actual_message:=NULL;
    BEGIN expected:=official_v3_jobs_private.job_v1(probe_input);
      EXCEPTION WHEN OTHERS THEN expected_state:=SQLSTATE;expected_message:=SQLERRM;END;
    BEGIN ${block}
      EXCEPTION WHEN OTHERS THEN actual_state:=SQLSTATE;actual_message:=SQLERRM;END;
    IF expected_state IS DISTINCT FROM actual_state OR expected_message IS DISTINCT FROM actual_message
      OR convert_to(expected::text,'UTF8') IS DISTINCT FROM convert_to(probe_result::text,'UTF8') THEN
      RAISE EXCEPTION 'complete inline job mismatch at %, original % %, successor % %',at,expected_state,expected_message,actual_state,actual_message;END IF;
    IF octet_length(memo_subject_kind)::bigint+octet_length(memo_subject_text)::bigint+octet_length(memo_subject_result::text)::bigint>1048576
      OR subtree_memo_bytes>16384 OR nodes_memo_bytes>16384 THEN RAISE EXCEPTION 'job memo bounds';END IF;
    result:=result||jsonb_build_array(jsonb_build_object('state',actual_state,'message',actual_message,'jobKey',probe_result->'jobKey'));
  END LOOP;RETURN result;END $probe$;
  CREATE FUNCTION public.local_history_rebind(v jsonb) RETURNS jsonb LANGUAGE plpgsql AS $rebind$
  DECLARE i jsonb;BEGIN i:=official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object('context',v->'context',
    'method',v->'method','factKind',v#>'{research,factKind}','researchReason',v#>'{research,researchReason}'));
    RETURN v||jsonb_build_object('jobKey',i->'jobKey','contextKey',i->'contextKey','research',i->'research');END $rebind$;`,
  'exact generated full-job block and unchanged function oracle')
  const base = exhausted as Job, research = base.research as Job
  const state = leased as Job, lease = state.lease as Job
  const wrongHash = '0'.repeat(64)
  const values: unknown[] = [base, base, { ...base, jobKey: 'research-job:v3:' + wrongHash },
    { ...base, contextKey: 'official-truth-context:v3:' + wrongHash }, { ...base, research: { ...research, key: wrongHash } },
    base, state, { ...state, lease: { ...lease, generation: 0 } }, state, { ...base, attemptLimit: 0 },
    { ...base, revision: 0 }, { ...base, schema: 4 }, { ...base, updatedAt: 'bad' },
    { ...base, resultDecisionRef: 'source-decision:v3:' + wrongHash }, { ...base, lastFailure: null },
    { ...base, unexpected: 'x'.repeat(66000) }, { ...base, unexpected: 'Zürich' }, null, [], 1, base]
  const expressions = values.map(json)
  expressions.push('NULL::jsonb', `jsonb_set(${json(base)},'{method,revision}','1.0'::jsonb)`, json(base))
  const changedReason = { ...base, research: { ...research, researchReason: { status: 'recheck_needed', reason: 'max_age_exceeded' } } }
  expressions.push('public.local_history_rebind(' + json(changedReason) + ')', json(base))
  const context = { contextRevision: 3, informationTopic: 'customs', informationItem: 'cash_allowance',
    scope: { destinationCountryCode: 'DE', transitCountryCode: null, citizenship: { mode: 'required', countryCodes: ['CH'] },
      credentialOption: { mode: 'not_applicable' }, residence: { mode: 'not_applicable' }, requirementType: 'other_entry_requirement',
      validity: { mode: 'not_applicable' } }, route: 'direct_entry', conditions: { status: 'unconditional' } }
  const customer = { ...base, context, research: { ...research, factKind: 'entry_information' } }
  expressions.push('public.local_history_rebind(' + json(customer) + ')',
    'public.local_history_rebind(' + json({ ...customer, context: { ...context, informationItem: 'alcohol_allowance' } }) + ')',
    'public.local_history_rebind(' + json(customer) + ')')
  const discoverySubject = { destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: base.method }
  const discoveryIdentity = await proof.value<Job>('official_v3_jobs_private.subject_v1(\'combination_discovery\',' + json(discoverySubject) + ')', owner)
  const discovery: Job = { ...base, kind: 'combination_discovery_job_record',
    identity: { kind: 'combination_discovery', ...discoverySubject, jobKey: discoveryIdentity.jobKey }, resultDiscoveryRef: null }
  for (const key of ['jobKey', 'context', 'contextKey', 'research', 'method', 'resultDecisionRef']) delete discovery[key]
  expressions.push(json(discovery), json({ ...discovery, identity: { ...(discovery.identity as Job), jobKey: 'combination-discovery-job:v3:' + wrongHash } }),
    json(discovery), json(base))
  const result = await proof.value<Result[]>('public.local_history_jobs(ARRAY[' + expressions.join(',') + '])', owner)
  assert.equal(result.length, expressions.length)
  assert.equal(result[0].state, null); assert.equal(result[1].state, null)
  for (const index of [2, 3, 4]) assert.equal(result[index].message, 'm04 invalid job identity')
  assert.equal(result[22].state, 'P7601', 'numeric-text equality cannot substitute for exact subject bytes')
  assert.equal(result[24].state, null); assert.equal(result[24].jobKey, result[0].jobKey, 'reason changes preserve JobKey but require a new full subject result')
  assert.equal(result[26].state, null); assert.equal(result[27].state, null); assert.notEqual(result[26].jobKey, result[27].jobKey)
  assert.ok(result.filter(r => r.state === null).length >= 12); assert.ok(result.filter(r => r.state !== null).length >= 12)
  return { vectors: result.length, successful: result.filter(r => r.state === null).length, matchedErrors: result.filter(r => r.state !== null).length }
}
