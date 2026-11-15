// This oracle admits only the compiler's fixed distinct/non-null alternatives.
// It deliberately does not claim equivalence for arbitrary text[] expressions.
import assert from 'node:assert/strict'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { historyExactKeysExpression, historyFixedKeyAlternatives } from './history-keys.mjs'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;'
export async function checkHistoryKeys(proof: OwnedPersistentProof) {
  await proof.run(owner + `CREATE FUNCTION public.local_history_keys(v jsonb,original_sql text,inline_sql text) RETURNS boolean
    LANGUAGE plpgsql AS $probe$ DECLARE expected boolean; actual boolean; expected_state text; actual_state text;
    expected_message text; actual_message text;BEGIN
    BEGIN EXECUTE 'SELECT '||original_sql INTO expected USING v;
      EXCEPTION WHEN OTHERS THEN expected_state:=SQLSTATE;expected_message:=SQLERRM;END;
    BEGIN EXECUTE 'SELECT '||inline_sql INTO actual USING v;
      EXCEPTION WHEN OTHERS THEN actual_state:=SQLSTATE;actual_message:=SQLERRM;END;
    IF expected IS DISTINCT FROM actual OR expected_state IS DISTINCT FROM actual_state OR expected_message IS DISTINCT FROM actual_message THEN
      RAISE EXCEPTION 'fixed key parity mismatch: original % % %, inline % % %',expected,expected_state,expected_message,actual,actual_state,actual_message;END IF;
    RETURN true;END $probe$;`, 'actual fixed-key expression and original fallback oracle')
  const alternatives = historyFixedKeyAlternatives() as string[][]
  assert.equal(alternatives.length, 16)
  const vectors: string[] = []
  for (const keys of alternatives) {
    const exact: Record<string, unknown> = Object.fromEntries(keys.map((key, i) => [key, i % 3 ? i : { nested: [true, null, 'value'] }]))
    const missing = { ...exact }; delete missing[keys[0]]
    const replaced = { ...missing, [keys[0].toUpperCase()]: true }
    const values = [json(exact), json(missing), json({ ...exact, unexpected: null }), json(replaced), "'{}'::jsonb", 'NULL::jsonb',
      "'null'::jsonb", json([keys[0]]), json(keys[0]), "'42'::jsonb", "'true'::jsonb", json({ ...exact, é: null, 'é': null }),
      json({ ...exact, [keys[0]]: 'x'.repeat(70000) })]
    for (const value of values) for (const collation of ['default', 'C', 'POSIX']) {
      const expected = '(ARRAY[' + keys.map(literal).join(',') + ']::text[] COLLATE "' + collation + '")'
      vectors.push('(' + value + ',' + literal('official_v3_jobs_private.exact_keys_v1($1,' + expected + ')') + ','
        + literal(historyExactKeysExpression('$1', expected)) + ')')
    }
  }
  const conflict = '(ARRAY[\'a\'] COLLATE "C")||(ARRAY[]::text[] COLLATE "POSIX")'
  vectors.push('(' + json({ a: 1 }) + ',' + literal('official_v3_jobs_private.exact_keys_v1($1,' + conflict + ')') + ','
    + literal(historyExactKeysExpression('$1', conflict)) + ')')
  let checked = 0
  for (let start = 0; start < vectors.length; start += 60) {
    const chunk = vectors.slice(start, start + 60)
    const result = await proof.value<number>('(SELECT to_jsonb(count(*) FILTER (WHERE public.local_history_keys(v,o,n))) FROM (VALUES '
      + chunk.join(',') + ') AS inputs(v,o,n))', owner)
    assert.equal(result, chunk.length); checked += result
  }
  assert.equal(checked, 625)
  return { vectors: checked, fixedAlternatives: alternatives.length, collations: ['default', 'C', 'POSIX'], icuMeasured: false }
}
