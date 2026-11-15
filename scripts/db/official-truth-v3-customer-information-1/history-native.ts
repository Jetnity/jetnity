// Real PG17 differential diagnostics. Fixture writes occur only in an owned,
// throwaway single-user backend. Pure-function A/B definitions roll back; full
// real API/5s/quota/authority coverage remains in the rolling native test.
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { baseSetup, methodSeed } from './native'
import { compileHistoryDefinition, HISTORY_MEMO_ADMISSION, HISTORY_SIGNATURE } from './history-build.mjs'
import { buildHistoryMemoFixture } from './history-fixture'

const creator = 'SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog;'
const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner; SET search_path=pg_catalog;'
const jobsOwner = 'SET LOCAL ROLE ot_v3_jobs_owner;'
const fixtureScope = "SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';"
type Profile = { name: string; calls: number; total_time: number; self_time: number }
const digest = `to_jsonb(encode(sha256(convert_to((SELECT jsonb_build_object(
  'subjects',(SELECT jsonb_agg(to_jsonb(r) ORDER BY job_key) FROM official_v3_jobs_private.subjects_v1 r),
  'operations',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM official_v3_jobs_private.queue_operations_v1 r),
  'starts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_starts_v1 r),
  'dispositions',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_dispositions_v1 r)
  ))::text,'UTF8')),'hex'))`

export async function runHistoryMemoNative(t: TestContext) {
  const successor = compileHistoryDefinition()
  const oldDefinition = 'CREATE OR REPLACE FUNCTION ' + successor.original.name + '(' + successor.original.args + ') '
    + successor.original.options + 'AS $old_history$' + successor.original.body + '$old_history$;'
  const fixture = await buildHistoryMemoFixture()
  const proof = new OwnedPersistentProof(t.signal)
  try {
    await baseSetup(proof)
    await proof.run(owner + 'BEGIN;' + fixtureScope + methodSeed(fixture.original.oldestAt) + fixture.original.seedSql + 'COMMIT;',
      '64 coherent old cycles for local memo diagnostic')
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql',
      'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql']) {
      await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-background-guard-1/' + file) + 'COMMIT;', 'unchanged BG1 predecessor')
    }
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql') + 'COMMIT;', 'unchanged rolling predecessor')
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-customer-information-1/provider-migration-body.sql') + 'COMMIT;',
      'exact complete additive successor before explicit diagnostic fixture extension')
    const history = 'official_v3_jobs_private.assert_history_v1(' + literal(fixture.original.jobKey) + ')'
    // The timing excludes child-process transport and function-statistics work.
    const measure = (definition: string) => proof.value<number>(`(WITH started AS MATERIALIZED (SELECT clock_timestamp() AS at),
      checked AS MATERIALIZED (SELECT ${history},at FROM started)
      SELECT to_jsonb(extract(epoch FROM clock_timestamp()-at)*1000) FROM checked)`, owner + 'BEGIN;' + definition + jobsOwner, 'RESET ROLE;ROLLBACK;')
    const profile = async (definition: string) => {
      await proof.run(owner + 'SELECT pg_stat_reset();', 'owned local statistics reset')
      await proof.run(owner + 'BEGIN;' + definition + "SET LOCAL track_functions='all';" + jobsOwner
        + 'SELECT ' + history + '; RESET ROLE;SELECT pg_stat_force_next_flush();ROLLBACK;', 'pure historical validator differential, rolled back')
      return proof.value<Profile[]>(`(SELECT jsonb_agg(jsonb_build_object('name',funcname,'calls',calls,'total_time',total_time,'self_time',self_time)
        ORDER BY self_time DESC) FROM pg_stat_user_functions WHERE schemaname='official_v3_jobs_private')`, owner + 'SELECT pg_stat_clear_snapshot();')
    }
    const compare = async (label: string) => {
      const before = await proof.value<string>(digest, owner)
      const oldMilliseconds = await measure(oldDefinition), newMilliseconds = await measure(successor.sql)
      const oldProfile = await profile(oldDefinition), newProfile = await profile(successor.sql)
      const oldCalls = oldProfile.find(f => f.name === 'job_v1')?.calls, newCalls = newProfile.find(f => f.name === 'job_v1')?.calls
      assert.ok(oldCalls && newCalls)
      assert.equal(await proof.value<string>(digest, owner), before, 'differential reads preserve all retained data')
      // Prove that every temporary diagnostic definition was rolled back to the
      // exact installed, catalog-bound body. The A/B calls grant no admission.
      assert.equal(await proof.value<string>(`(SELECT to_jsonb(encode(sha256(convert_to(prosrc,'UTF8')),'hex')) FROM pg_proc WHERE oid=${literal(HISTORY_SIGNATURE)}::regprocedure)`, owner), successor.after)
      await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();', 'exact installed catalog after pure-function comparison')
      t.diagnostic('history memo actual PG17 comparison: ' + JSON.stringify({ label, oldMilliseconds, newMilliseconds,
        oldJobValidations: oldCalls, newJobValidations: newCalls, oldProfile: oldProfile.slice(0, 5), newProfile: newProfile.slice(0, 5) }))
      return { oldCalls, newCalls }
    }
    await t.test('before saturation both full validators check all 192 distinct original jobs', async () => {
      const calls = await compare('64 starts / 192 operations / exhausted revision192')
      assert.equal(calls.oldCalls, 192); assert.equal(calls.newCalls, 192)
    })
    await proof.run(owner + 'BEGIN;' + fixtureScope + fixture.queueSql + 'COMMIT;', 'explicit local fixture reaches queued259 and 187 deduplicated rows')
    await t.test('queued high-water head is already memoized in the old and new bodies', async () => {
      const calls = await compare('86 starts / 446 operations / queued revision259')
      assert.ok(calls.newCalls >= 259 && calls.newCalls <= 261)
      assert.ok(calls.oldCalls - calls.newCalls <= 2)
    })
    await t.test('a changed invalid historical job after eviction is rejected by both complete validators', async () => {
      const before = await proof.value<string>(digest, owner)
      for (const definition of [oldDefinition, successor.sql]) {
        const output = await proof.run(owner + 'BEGIN;' + fixtureScope + fixture.invalidSql + definition + jobsOwner
          + 'SELECT ' + history + ';RESET ROLE;ROLLBACK;', 'invalid changed history beyond memo saturation', /m04 invalid job|current transaction is aborted/)
        assert.match(output, /m04 invalid job/)
        assert.equal(await proof.value<string>(digest, owner), before)
      }
      await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();', 'negative diagnostic changes all roll back')
    })
    await proof.run(owner + 'BEGIN;' + fixtureScope + fixture.claimSql + 'COMMIT;', 'explicit local fixture changes head to leased260, retaining every dedup row')
    await t.test('leased high-water head no longer revalidates every retained dedup state after 256 entries', async () => {
      const calls = await compare('86 starts / 447 operations / leased revision260')
      assert.ok(calls.newCalls >= 260 && calls.newCalls <= 262)
      assert.ok(calls.oldCalls - calls.newCalls >= 187, 'the specific retained-dedup miss storm is removed, not hidden by a retry')
      const repeated = await profile(successor.sql)
      assert.equal(repeated.find(f => f.name === 'job_v1')?.calls, calls.newCalls, 'a new invocation performs its full fresh validations')
    })
    await t.test('the exact admission block preserves the 256-entry and 1MiB bounds, including oversize fallback', async () => {
      // This separate byte-accounting probe uses arbitrary text keys. It proves
      // the exact memo block, not job validity; the full validator above does that.
      await proof.run(owner + `CREATE FUNCTION public.local_history_memo_bound(items text[]) RETURNS jsonb LANGUAGE plpgsql AS $bound$
      DECLARE validated_jobs jsonb:='{}'; validated_job_count integer:=0; validated_job_bytes integer:=0;
        job_text text COLLATE "C"; job_bytes integer; actual_bytes integer; actual_count integer; hit boolean; result jsonb:='[]';
      BEGIN FOREACH job_text IN ARRAY items LOOP
        hit:=validated_jobs ? job_text;
        IF NOT hit THEN
          job_bytes:=octet_length(job_text);
${HISTORY_MEMO_ADMISSION}
        END IF;
        SELECT count(*),COALESCE(sum(octet_length(key)),0) INTO actual_count,actual_bytes FROM jsonb_object_keys(validated_jobs) AS k(key);
        IF validated_job_count<>actual_count OR validated_job_bytes<>actual_bytes OR actual_count>256 OR actual_bytes>1048576 THEN
          RAISE EXCEPTION 'memo accounting or bound changed'; END IF;
        result:=result||jsonb_build_array(jsonb_build_object('hit',hit,'count',actual_count,'bytes',actual_bytes));
      END LOOP; RETURN result; END $bound$;`, 'exact admission byte-accounting probe')
      const small = Array.from({ length: 257 }, (_, n) => String(n))
      type Bound = { hit: boolean; count: number; bytes: number }
      const check = (items: string[]) => proof.value<Bound[]>('public.local_history_memo_bound(ARRAY[' + items.map(literal).join(',') + ']::text[])', owner)
      const counts = await check([...small, '256', '0', '0'])
      assert.equal(counts[255].count, 256); assert.equal(counts[256].count, 1)
      assert.equal(counts[257].hit, true); assert.equal(counts[258].hit, false); assert.equal(counts[259].hit, true)
      const bytes = await check(['small', 'x'.repeat(1048576), 'y'.repeat(1048577), 'x'.repeat(1048576), 'next', 'next'])
      assert.equal(bytes[1].bytes, 1048576); assert.equal(bytes[1].count, 1)
      assert.deepEqual(bytes[2], { hit: false, count: 1, bytes: 1048576 }, 'oversize does not evict a useful valid-size entry')
      assert.equal(bytes[3].hit, true); assert.equal(bytes[4].count, 1); assert.equal(bytes[4].bytes, 4); assert.equal(bytes[5].hit, true)
    })
  } finally { await proof.close() }
}
