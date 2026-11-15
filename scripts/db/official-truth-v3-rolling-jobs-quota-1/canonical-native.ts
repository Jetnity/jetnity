// Actual PG17 differential proof of the exact inserted byte-only optimization.
// It supplies no quota, method, queue or execution authority.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { TestContext } from 'node:test'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'
import { ROLLING_CANONICAL_MEMO_DECLARATION } from './build.mjs'
import { json, literal, readSql } from './local-proof'
import { OwnedPersistentProof } from './persistent-backend'

const originals = functionsIn(readSql('official-truth-v3-hosted-durable-jobs-1/install-candidate.sql'))
const original = (name: string) => {
  const found = originals.find((f: { signature: string }) => f.signature === 'official_v3_jobs_private.' + name)
  assert.ok(found)
  return found.sql
}
const block = readFileSync(new URL('./canonical-envelope.sql', import.meta.url), 'utf8')
const setup = `CREATE SCHEMA official_v3_jobs_private;
${original('exact_keys_v1(jsonb,text[])')}
${original('canonical_v1(jsonb,integer)')}
${original('unique_json_v1(json,integer)')}
CREATE FUNCTION public.local_canonical_probe(items jsonb[]) RETURNS jsonb
LANGUAGE plpgsql SET search_path=pg_catalog AS $probe$
DECLARE e jsonb; envelope_canonical text; original_bytes text; original_state text; actual_state text;
  result jsonb:='[]'; retained_bytes integer;
${ROLLING_CANONICAL_MEMO_DECLARATION}
BEGIN
  FOREACH e IN ARRAY items LOOP
    original_bytes:=NULL; envelope_canonical:=NULL; original_state:=NULL; actual_state:=NULL;
    BEGIN original_bytes:=official_v3_jobs_private.canonical_v1(e,0);
    EXCEPTION WHEN OTHERS THEN original_state:=SQLSTATE; END;
    BEGIN
${block}
    EXCEPTION WHEN OTHERS THEN actual_state:=SQLSTATE; END;
    IF original_state IS DISTINCT FROM actual_state OR
      convert_to(original_bytes,'UTF8') IS DISTINCT FROM convert_to(envelope_canonical,'UTF8') THEN
      RAISE EXCEPTION 'canonical differential mismatch: original %, optimized %',original_state,actual_state;
    END IF;
    retained_bytes:=COALESCE(octet_length(canonical_memo_key_one),0)+COALESCE(octet_length(canonical_memo_value_one),0)
      +COALESCE(octet_length(canonical_memo_key_two),0)+COALESCE(octet_length(canonical_memo_value_two),0);
    IF retained_bytes<>canonical_memo_bytes_one+canonical_memo_bytes_two OR retained_bytes>65536 THEN
      RAISE EXCEPTION 'canonical byte memo exceeded its shared bound'; END IF;
    IF canonical_memo_key_one IS NOT NULL AND convert_to(canonical_memo_value_one,'UTF8') IS DISTINCT FROM
      convert_to(official_v3_jobs_private.canonical_v1(canonical_memo_key_one::jsonb,1),'UTF8') THEN
      RAISE EXCEPTION 'first memo value was not an exact depth-one canonical result'; END IF;
    IF canonical_memo_key_two IS NOT NULL AND convert_to(canonical_memo_value_two,'UTF8') IS DISTINCT FROM
      convert_to(official_v3_jobs_private.canonical_v1(canonical_memo_key_two::jsonb,1),'UTF8') THEN
      RAISE EXCEPTION 'second memo value was not an exact depth-one canonical result'; END IF;
    result:=result||jsonb_build_array(jsonb_build_object('sqlstate',actual_state,'canonical',envelope_canonical,
      'cached_bytes',retained_bytes,'key_one',canonical_memo_key_one,'key_two',canonical_memo_key_two));
  END LOOP;
  RETURN result;
END $probe$;`
const envelope = (expected: unknown, next: unknown = expected) => ({ audit: { reference: 'audit', revision: 1 },
  commandKey: 'command', expected, jobKey: 'job', next, notAfter: '2026-11-14T00:00:05.000Z', operationId: 'operation' })
const nested = (count: number, value: unknown): unknown => count ? [nested(count - 1, value)] : value
type Result = { sqlstate: string | null; canonical: string | null; cached_bytes: number; key_one: string | null; key_two: string | null }

export async function runRollingCanonicalNative(t: TestContext) {
  const proof = new OwnedPersistentProof(t.signal)
  try {
    await proof.run(setup, 'original canonical and exact successor block')
    const compare = async (items: unknown[]): Promise<Result[]> => proof.value<Result[]>(
      'public.local_canonical_probe(ARRAY[' + items.map(json).join(',') + ']::jsonb[])')
    await t.test('fixed envelope order, changed children, two-slot reuse and strict case-sensitive keys preserve exact bytes', async () => {
      const a = { value: 'A', nested: { b: 2, a: [null, true, false, -4] } }
      const b = { value: 'a', nested: { a: [null, true, false, -4], b: 2 } }
      const inputs = [envelope(null, a), envelope(a, b), envelope(b, a), envelope(a, b), envelope(b, null), envelope(null, a)]
      const results = await compare(inputs)
      assert.equal(results.length, inputs.length)
      assert.ok(results.every(row => row.sqlstate === null && row.cached_bytes > 0 && row.cached_bytes <= 65536))
      assert.notEqual(results[1].key_one, results[1].key_two, 'distinct case variants are not equivalent memo keys')
      assert.equal(results[0].canonical, results.at(-1)!.canonical)
    })
    await t.test('malformed root forms retain the original fallback, null and exact-key behavior', async () => {
      const missing = { ...envelope(null) } as Record<string, unknown>; delete missing.expected
      const inputs = [null, [], {}, true, 42, 'root', { ...envelope(null), extra: 1 }, missing,
        { ...envelope(null), audit: null }, { ...envelope(null), next: [] }]
      const results = await compare(inputs)
      assert.equal(results.length, inputs.length)
      assert.ok(results.every(row => row.sqlstate === null))
      const sqlNull = await proof.value<Result[]>('public.local_canonical_probe(ARRAY[NULL::jsonb])')
      assert.equal(sqlNull[0].sqlstate, 'P7601')
    })
    await t.test('depth24 succeeds and depth25 fails identically without resetting canonical depth', async () => {
      const results = await compare([envelope(nested(23, 1)), envelope(nested(24, 1)),
        envelope(null, nested(23, {})), envelope(null, nested(24, { key: 1 }))])
      assert.equal(results[0].sqlstate, null); assert.equal(results[1].sqlstate, 'P7601')
      assert.equal(results[2].sqlstate, null); assert.equal(results[3].sqlstate, 'P7601')
    })
    await t.test('numeric bounds, fractions, escape sequences and non-ASCII values retain identical rejection', async () => {
      const values = [0, -1, 9007199254740991, -9007199254740991, 9007199254740992, -9007199254740992,
        0.5, 'quote"slash\\', '\n', '\t', 'Zürich', 'e\u0301', { 'é': 1 }, { 'A': 1, 'a': 2 }]
      const results = await compare(values.map(value => envelope({ value })))
      for (const i of [0, 1, 2, 3, 7, 13]) assert.equal(results[i].sqlstate, null)
      for (const i of [4, 5, 6, 8, 9, 10, 11, 12]) assert.equal(results[i].sqlstate, 'P7601')
      const scaled = await proof.value<Result[]>(`public.local_canonical_probe(ARRAY[
        ${json(envelope(null))}||'{"expected":1.000,"next":1e0}'::jsonb,
        ${json(envelope(null))}||'{"expected":-0,"next":0}'::jsonb])`)
      assert.ok(scaled.every(row => row.sqlstate === null))
    })
    await t.test('cache eviction, joint64KiB cap and oversized child misses preserve original serialization', async () => {
      const small = { value: 's'.repeat(12000) }, medium = { value: 'm'.repeat(20000) }, large = { value: 'l'.repeat(40000) }
      const results = await compare([envelope(small, small), envelope(small, medium), envelope(medium, large),
        envelope(large, large), envelope(large, small), envelope(small, medium)])
      assert.ok(results.every(row => row.sqlstate === null && row.cached_bytes <= 65536))
      assert.ok(results.every(row => !row.key_one?.includes('l'.repeat(40000)) && !row.key_two?.includes('l'.repeat(40000))))
      assert.equal(results[1].canonical, results[5].canonical)
    })
    await t.test('duplicate members, alternative whitespace and noncanonical raw bytes remain detectable', async () => {
      const clean = (await compare([envelope(null)]))[0].canonical!
      const duplicate = clean.replace('"expected":null', '"expected":null,"expected":null')
      const spaced = clean.replace('"expected":null', '"expected": null')
      for (const text of [duplicate, spaced]) {
        const compared = await proof.value<{ equal: boolean; unique: boolean }>(`jsonb_build_object(
          'equal',(public.local_canonical_probe(ARRAY[${literal(text)}::jsonb])->0->>'canonical') COLLATE "C"=${literal(text)} COLLATE "C",
          'unique',official_v3_jobs_private.unique_json_v1(${literal(text)}::json,0))`)
        assert.equal(compared.equal, false)
        assert.equal(compared.unique, text !== duplicate)
      }
    })
  } finally { await proof.close() }
}
