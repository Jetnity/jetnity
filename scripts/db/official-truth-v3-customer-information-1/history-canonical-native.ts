// Original PG17 serializer is the byte/error oracle, including warm memo cases.
import assert from 'node:assert/strict'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { historyCanonicalBlock, HISTORY_CANONICAL_DECLARATION } from './history-canonical.mjs'
import { historyFixedCanonicalBlock } from './history-canonical-fixed.mjs'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;'
type Result = { state: string | null; entries: number; bytes: number }
const nest = (depth: number, value: unknown): unknown => depth ? { nested: nest(depth - 1, value) } : value

export async function checkHistoryCanonical(proof: OwnedPersistentProof) {
  await proof.run(owner + `CREATE FUNCTION public.local_history_canonical(items jsonb[],depths integer[]) RETURNS jsonb LANGUAGE plpgsql AS $probe$
  DECLARE at integer; input_value jsonb; input_depth integer; expected text; actual text; expected_state text; actual_state text;
    expected_message text; actual_message text; actual_bytes bigint; actual_count integer; result jsonb:='[]';
${HISTORY_CANONICAL_DECLARATION}
  BEGIN FOR at IN 1..cardinality(items) LOOP
    input_value:=items[at];input_depth:=depths[at];expected:=NULL;actual:=NULL;
    expected_state:=NULL;actual_state:=NULL;expected_message:=NULL;actual_message:=NULL;
    BEGIN expected:=official_v3_jobs_private.canonical_v1(input_value,input_depth);
      EXCEPTION WHEN OTHERS THEN expected_state:=SQLSTATE;expected_message:=SQLERRM;END;
    BEGIN ${historyCanonicalBlock('input_value', 'input_depth', 'actual')}
      EXCEPTION WHEN OTHERS THEN actual_state:=SQLSTATE;actual_message:=SQLERRM;END;
    IF expected_state IS DISTINCT FROM actual_state OR expected_message IS DISTINCT FROM actual_message
      OR convert_to(expected,'UTF8') IS DISTINCT FROM convert_to(actual,'UTF8') THEN
      RAISE EXCEPTION 'canonical mismatch at %, depth %',at,input_depth;END IF;
    SELECT coalesce(sum(octet_length(key)::bigint+octet_length(value#>>'{}')::bigint),0),count(*)
      INTO actual_bytes,actual_count FROM jsonb_each(subtree_memo);
    IF actual_bytes<>subtree_memo_bytes OR actual_bytes>16384 OR subtree_memo_count>8 OR actual_count<>subtree_memo_count THEN
      RAISE EXCEPTION 'canonical memo cap/accounting';END IF;
    result:=result||jsonb_build_array(jsonb_build_object('state',actual_state,'entries',subtree_memo_count,'bytes',actual_bytes));
  END LOOP;RETURN result;END $probe$;`, 'original serializer and exact generated block parity')
  const values: unknown[] = [null, [], {}, true, 0, 1.5, 9007199254740991, 9007199254740992, -9007199254740991,
    -9007199254740992, 'hi', 'Zürich', 'a\nb', 'quote"slash\\', { A: 1, aa: 2, Z: 3, z: 4 },
    { 'bad\nkey': 1 }, { 'quote"slash\\': 3 }, { context: { a: 1, b: [null, true, 'CH'] } },
    { input: { context: { a: 1, b: [null, true, 'CH'] } } }, { context: { value: 'x'.repeat(17000) } },
    { context: { value: 'x'.repeat(7000) } }, nest(24, {}), nest(25, {}), { context: nest(22, {}) }, { context: nest(23, {}) }]
  const inputs: unknown[] = [], depths: number[] = []
  for (const depth of [0, 1, 22, 23, 24, 25, -1]) for (const value of values) { inputs.push(value); depths.push(depth) }
  for (let i = 0; i < 12; i++) { inputs.push({ context: { item: i } }); depths.push(0) }
  inputs.push({ context: { n: 1 } }, { input: { context: { n: 1 } } }, { context: { n: 1 } })
  depths.push(0, 0, 0)
  const result = await proof.value<Result[]>('public.local_history_canonical(ARRAY[' + inputs.map(json).join(',')
    + '],ARRAY[' + depths.join(',') + '])', owner)
  assert.equal(result.length, inputs.length)
  const special = await proof.value<Result[]>(`public.local_history_canonical(ARRAY[NULL::jsonb,
    '{"context":{"n":1}}'::jsonb,'{"context":{"n":1.0}}'::jsonb,'{"context":{"n":1e0}}'::jsonb,'{}'::jsonb],ARRAY[0,0,0,0,NULL::integer])`, owner)
  assert.equal(special[1].entries, 1); assert.equal(special[2].entries, 2); assert.equal(special[3].entries, 2)
  const bytes = await proof.value<Result[]>('public.local_history_canonical(ARRAY['
    + ['a', 'b', 'c', 'z'].map(letter => json({ context: { value: letter.repeat(letter === 'z' ? 17000 : 7000) } })).join(',')
    + '],ARRAY[0,0,0,0])', owner)
  assert.ok(bytes[0].bytes > 14000); assert.equal(bytes[1].entries, 1); assert.equal(bytes[2].entries, 1)
  assert.deepEqual(bytes[3], bytes[2], 'oversize uses original serializer and retains the prior bounded memo')
  assert.ok(result.some(r => r.state !== null)); assert.ok(result.some(r => r.entries === 8))
  return { vectors: result.length + special.length + bytes.length, matchedErrors: result.filter(r => r.state !== null).length,
    maxEntries: Math.max(...result.map(r => r.entries)), maxBytes: Math.max(...result.map(r => r.bytes)) }
}

// Prove that the fixed compiler shapes actually hit; equality through the
// general fallback alone would not establish this optimization's exercised path.
export async function checkHistoryFixedCanonical(proof: OwnedPersistentProof, exhausted: unknown, leased: unknown) {
  type Job = Record<string, unknown>
  type FixedResult = { fast: boolean; state: string | null; entries: number }
  const base = exhausted as Job, leasedJob = leased as Job
  const discoverySubject = { destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: base.method }
  const identity = await proof.value<Job>('official_v3_jobs_private.subject_v1(\'combination_discovery\',' + json(discoverySubject) + ')', owner)
  const discovery: Job = { ...base, kind: 'combination_discovery_job_record',
    identity: { kind: 'combination_discovery', ...discoverySubject, jobKey: identity.jobKey }, resultDiscoveryRef: null }
  for (const key of ['jobKey', 'context', 'contextKey', 'research', 'method', 'resultDecisionRef']) delete discovery[key]
  for (const value of [base, discovery, leasedJob]) {
    assert.deepEqual(await proof.value<Job>('official_v3_jobs_private.job_v1(' + json(value) + ')', owner), value,
      'warm fast-path inputs are complete jobs accepted by the unchanged validator')
  }
  await proof.run(owner + `CREATE FUNCTION public.local_history_fixed(warm_value jsonb,warm_depth integer,input_value jsonb,input_depth integer)
    RETURNS jsonb LANGUAGE plpgsql AS $fixed$
  DECLARE expected text; actual text; fast text; warmed text; expected_state text; actual_state text;
    expected_message text; actual_message text; warm_entries integer;
${HISTORY_CANONICAL_DECLARATION}
  BEGIN
    ${historyCanonicalBlock('warm_value', 'warm_depth', 'warmed')}
    warm_entries:=subtree_memo_count;
    BEGIN expected:=official_v3_jobs_private.canonical_v1(input_value,input_depth);
      EXCEPTION WHEN OTHERS THEN expected_state:=SQLSTATE;expected_message:=SQLERRM;END;
    ${historyFixedCanonicalBlock('input_value', 'input_depth', 'fast')}
    BEGIN ${historyCanonicalBlock('input_value', 'input_depth', 'actual')}
      EXCEPTION WHEN OTHERS THEN actual_state:=SQLSTATE;actual_message:=SQLERRM;END;
    IF expected_state IS DISTINCT FROM actual_state OR expected_message IS DISTINCT FROM actual_message
      OR convert_to(expected,'UTF8') IS DISTINCT FROM convert_to(actual,'UTF8')
      OR (fast IS NOT NULL AND (expected_state IS NOT NULL OR convert_to(fast,'UTF8') IS DISTINCT FROM convert_to(expected,'UTF8'))) THEN
      RAISE EXCEPTION 'fixed canonical byte/error mismatch';END IF;
    RETURN jsonb_build_object('fast',fast IS NOT NULL,'state',actual_state,'entries',warm_entries);
  END $fixed$;`, 'real warm fixed shapes and original byte/error oracle')
  const check = (warm: unknown, value: unknown, depth: number) => proof.value<FixedResult>(
    'public.local_history_fixed(' + json(warm) + ',0,' + json(value) + ',' + depth + ')', owner)
  const outcomes: FixedResult[] = []
  for (const value of [base, discovery, leasedJob]) {
    const result = await check(value, value, 0)
    assert.equal(result.fast, true); assert.equal(result.state, null); assert.ok(result.entries > 0)
    outcomes.push(result)
  }
  const wrongDepth = await check(base, base, 1)
  assert.equal(wrongDepth.fast, false, 'a valid depth1 memo cannot serve depth2 children')
  assert.equal(wrongDepth.state, null); outcomes.push(wrongDepth)
  // These are canonical serialization vectors, not valid jobs: the known job
  // keys have primitive placeholders so only the lease reaches depth23/24.
  const boundary: Job = { ...leasedJob, context: null, method: null, research: null }
  for (const [depth, fast, state] of [[22, true, null], [23, false, 'P7601']] as const) {
    const result = await check(base, boundary, depth)
    assert.equal(result.fast, fast); assert.equal(result.state, state); outcomes.push(result)
  }
  const lease = leasedJob.lease as Job
  for (const malformed of [{ ...lease, generation: 1.5 }, { ...lease, expiresAt: 'Zürich' }]) {
    const result = await check(base, { ...boundary, lease: malformed }, 22)
    assert.equal(result.fast, false); assert.equal(result.state, 'P7601'); outcomes.push(result)
  }
  return { vectors: outcomes.length, directFastHits: outcomes.filter(r => r.fast).length,
    matchedErrors: outcomes.filter(r => r.state !== null).length }
}
