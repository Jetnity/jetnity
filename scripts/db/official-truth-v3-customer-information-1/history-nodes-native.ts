// Original PG17 recursive counter is the count/depth oracle for the exact block.
import assert from 'node:assert/strict'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { historyNodesBlock, HISTORY_NODES_DECLARATION } from './history-nodes.mjs'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;'
type Result = { count: number; entries: number; bytes: number }
const nest = (depth: number, value: unknown): unknown => depth ? { nested: nest(depth - 1, value) } : value

export async function checkHistoryNodes(proof: OwnedPersistentProof) {
  await proof.run(owner + `CREATE FUNCTION public.local_history_nodes(items jsonb[]) RETURNS jsonb LANGUAGE plpgsql AS $probe$
  DECLARE at integer; input_value jsonb; expected integer; actual integer; actual_bytes bigint; actual_count integer; result jsonb:='[]';
${HISTORY_NODES_DECLARATION}
  BEGIN FOR at IN 1..cardinality(items) LOOP
    input_value:=items[at];expected:=official_v3_jobs_private.nodes_v1(input_value,0,16,8192);
${historyNodesBlock('input_value', 'actual')}
    IF expected IS DISTINCT FROM actual THEN RAISE EXCEPTION 'nodes mismatch at %, original %, new %',at,expected,actual;END IF;
    SELECT coalesce(sum(octet_length(key)::bigint+octet_length(value::text)::bigint),0),count(*) INTO actual_bytes,actual_count FROM jsonb_each(nodes_memo);
    IF actual_bytes<>nodes_memo_bytes OR actual_bytes>16384 OR nodes_memo_count>8 OR actual_count<>nodes_memo_count THEN
      RAISE EXCEPTION 'nodes memo cap/accounting';END IF;
    result:=result||jsonb_build_array(jsonb_build_object('count',actual,'entries',nodes_memo_count,'bytes',actual_bytes));
  END LOOP;RETURN result;END $probe$;`, 'original recursive counter and exact root block parity')
  const values: unknown[] = [null, [], {}, true, 0, 'hi', { context: { n: 1 } }, { context: { n: 1 } }, { context: { n: 2 } },
    { context: { big: 'x'.repeat(17000) } }, { context: { n: 2 } }, { method: { n: 3 } }, { research: { n: 4 } },
    { identity: { n: 5 } }, { unknown: { nested: [{ k: 1 }] } }]
  for (let depth = 0; depth <= 18; depth++) for (const value of [{}, [], 0, { k: 1 }]) values.push(nest(depth, value))
  for (const n of [8190, 8191, 8192, 8193]) values.push(Array.from({ length: n }, () => 0))
  for (const n of [4094, 4095, 4096]) values.push(Object.fromEntries(Array.from({ length: n }, (_, i) => ['k' + i, 0])))
  for (const n of [8189, 8190, 8191]) values.push({ context: Array.from({ length: n }, () => 0) })
  for (let i = 0; i < 12; i++) values.push({ context: { item: i } })
  values.push({ context: { n: 1 } }, { context: nest(17, {}) }, { context: { n: 1 } })
  const result = await proof.value<Result[]>('public.local_history_nodes(ARRAY[' + values.map(json).join(',') + '])', owner)
  const special = await proof.value<Result[]>(`public.local_history_nodes(ARRAY[NULL::jsonb,'{"context":{"n":1}}'::jsonb,
    '{"context":{"n":1.0}}'::jsonb,'{"context":{"n":1e0}}'::jsonb])`, owner)
  assert.equal(special[0].count, -1); assert.equal(special[1].entries, 1); assert.equal(special[2].entries, 2); assert.equal(special[3].entries, 2)
  assert.equal(result[9].entries, result[8].entries, 'oversize does not evict successful prior counts')
  const bytes = await proof.value<Result[]>('public.local_history_nodes(ARRAY['
    + ['a', 'b', 'c', 'z'].map(letter => json({ context: { value: letter.repeat(letter === 'z' ? 17000 : 7000) } })).join(',') + '])', owner)
  assert.equal(bytes[1].entries, 2); assert.ok(bytes[1].bytes > 14000); assert.equal(bytes[2].entries, 1)
  assert.deepEqual(bytes[3], bytes[2], 'oversize falls back without evicting the valid memo')
  return { vectors: result.length + special.length + bytes.length, negativeMatched: result.filter(r => r.count < 0).length,
    maxEntries: Math.max(...result.map(r => r.entries)), maxBytes: Math.max(...bytes.map(r => r.bytes)) }
}
