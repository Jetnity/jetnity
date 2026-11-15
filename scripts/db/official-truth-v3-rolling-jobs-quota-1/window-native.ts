import { OwnedPersistentProof } from './persistent-backend'
// Focused actual PG17 tests of the exact quota calculation. Reduced local table
// fixtures have no execution/MA1 authority. The separate complete-stack proof
// validates every retained row and exercises the real API and full BG1 chain.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { TestContext } from 'node:test'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'
import { literal } from './local-proof'

const key = 'research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
const helper = functionsIn(readFileSync(new URL('./policy.sql', import.meta.url), 'utf8'))
  .find((f: { signature: string }) => f.signature === 'official_v3_jobs_private.rolling_usage_v2(text)')
assert.ok(helper)
const fixture = `CREATE SCHEMA official_v3_jobs_private;
CREATE TABLE official_v3_jobs_private.subjects_v1(job_key text PRIMARY KEY,kind text,method_binding jsonb,
 start_count integer,operation_count integer,terminal_credit_claim text);
CREATE TABLE official_v3_jobs_private.rolling_policy_v2(job_key text PRIMARY KEY,method_binding jsonb,
 window_seconds integer,start_limit integer,operation_limit integer,anchor_starts integer,anchor_operations integer,installed_at timestamptz);
CREATE TABLE official_v3_jobs_private.execution_starts_v1(job_key text,attempt_key text,reserved_at timestamptz);
CREATE TABLE official_v3_jobs_private.queue_operations_v1(job_key text,operation_id text,recorded_at timestamptz);
${helper.sql}
INSERT INTO official_v3_jobs_private.subjects_v1 VALUES(${literal(key)},'rule_research','{}',0,0,NULL);
INSERT INTO official_v3_jobs_private.rolling_policy_v2 VALUES(${literal(key)},'{}',86400,64,256,0,0,clock_timestamp()-interval '7 days');`
type Usage = { model: string; clock_ok: boolean; starts: number; operations: number; credit: number;
  remaining_starts: number; remaining_operations: number; lifetime_starts: number; lifetime_operations: number }
export async function runRollingWindowNative(t: TestContext) {
  const proof = new OwnedPersistentProof(t.signal)
  try {
    await proof.run(fixture, 'local readback-only fixture');
    const check = async (seed: string): Promise<Usage> => (await proof.value<Usage>(`official_v3_jobs_private.rolling_usage_v2(${literal(key)})`, 'BEGIN;\n' + seed))
    // The persistent test backend rolls back each unfinished fixture transaction.
    // Production rows are never timestamp-edited.
    await t.test('old immutable rows replenish a rolling window without resetting lifetime totals', async () => {
      const value = (await check(`UPDATE official_v3_jobs_private.subjects_v1 SET start_count=64,operation_count=256;
        INSERT INTO official_v3_jobs_private.execution_starts_v1 SELECT ${literal(key)},n::text,clock_timestamp()-interval '25 hours' FROM generate_series(1,64) n;
        INSERT INTO official_v3_jobs_private.queue_operations_v1 SELECT ${literal(key)},n::text,clock_timestamp()-interval '25 hours' FROM generate_series(1,256) n;`))
      assert.equal(value.starts, 0); assert.equal(value.operations, 0); assert.equal(value.remaining_starts, 64); assert.equal(value.remaining_operations, 256)
      assert.equal(value.lifetime_starts, 64); assert.equal(value.lifetime_operations, 256); assert.equal(value.clock_ok, true)
    })
    await t.test('64 current STARTs deny a 65th admission and 255 operations retain one terminal credit', async () => {
      const value = (await check(`UPDATE official_v3_jobs_private.subjects_v1 SET start_count=64,operation_count=256,terminal_credit_claim='old-claim';
        INSERT INTO official_v3_jobs_private.execution_starts_v1 SELECT ${literal(key)},n::text,clock_timestamp()-interval '1 hour' FROM generate_series(1,64) n;
        INSERT INTO official_v3_jobs_private.queue_operations_v1 SELECT ${literal(key)},n::text,clock_timestamp()-interval '1 hour' FROM generate_series(1,255) n;
        INSERT INTO official_v3_jobs_private.queue_operations_v1 VALUES(${literal(key)},'old-claim',clock_timestamp()-interval '48 hours');`))
      assert.equal(value.starts, 64); assert.equal(value.remaining_starts, 0); assert.equal(value.operations, 255)
      assert.equal(value.credit, 1); assert.equal(value.remaining_operations, 0); assert.equal(value.clock_ok, true)
    })
    await t.test('terminal credit remains reserved after its claim ages out of the window', async () => {
      const value = (await check(`UPDATE official_v3_jobs_private.subjects_v1 SET operation_count=1,terminal_credit_claim='old-claim';
        INSERT INTO official_v3_jobs_private.queue_operations_v1 VALUES(${literal(key)},'old-claim',clock_timestamp()-interval '48 hours');`))
      assert.equal(value.operations, 0); assert.equal(value.credit, 1); assert.equal(value.remaining_operations, 255)
    })
    await t.test('future rows remain charged and refuse fresh admission after a clock rollback', async () => {
      const value = (await check(`UPDATE official_v3_jobs_private.subjects_v1 SET start_count=64,operation_count=256;
        INSERT INTO official_v3_jobs_private.execution_starts_v1 SELECT ${literal(key)},n::text,
          clock_timestamp()+CASE WHEN n=64 THEN interval '1 hour' ELSE interval '-1 hour' END FROM generate_series(1,64) n;
        INSERT INTO official_v3_jobs_private.queue_operations_v1 SELECT ${literal(key)},n::text,
          clock_timestamp()+CASE WHEN n=256 THEN interval '1 hour' ELSE interval '-1 hour' END FROM generate_series(1,256) n;`))
      assert.equal(value.starts, 64); assert.equal(value.operations, 256); assert.equal(value.clock_ok, false)
      assert.equal(value.remaining_starts, 0); assert.equal(value.remaining_operations, 0)
    })
    await t.test('the cutoff excludes only rows older than 24 hours and preserves rows just inside it', async () => {
      const value = (await check(`UPDATE official_v3_jobs_private.subjects_v1 SET start_count=2,operation_count=2;
        INSERT INTO official_v3_jobs_private.execution_starts_v1 VALUES
          (${literal(key)},'outside',clock_timestamp()-interval '24 hours 5 seconds'),
          (${literal(key)},'inside',clock_timestamp()-interval '23 hours 59 minutes 55 seconds');
        INSERT INTO official_v3_jobs_private.queue_operations_v1 SELECT job_key,attempt_key,reserved_at FROM official_v3_jobs_private.execution_starts_v1;`))
      assert.equal(value.starts, 1); assert.equal(value.operations, 1); assert.equal(value.remaining_starts, 63); assert.equal(value.remaining_operations, 255)
    })
    await t.test('another subject keeps the original lifetime model', async () => {
      const other = key.replace('74713', '11111')
      const value = (await proof.value<Usage>(`official_v3_jobs_private.rolling_usage_v2(${literal(other)})`, `BEGIN;
        INSERT INTO official_v3_jobs_private.subjects_v1 VALUES(${literal(other)},'rule_research','{}',64,255,'claim');`))
      assert.equal(value.model, 'lifetime_v1'); assert.equal(value.remaining_starts, 0); assert.equal(value.remaining_operations, 0)
    })
    await t.test('policy tuple mismatch and future policy installation fail closed', async () => {
      await proof.run(`BEGIN; UPDATE official_v3_jobs_private.rolling_policy_v2 SET method_binding='{"changed":true}';
        SELECT official_v3_jobs_private.rolling_usage_v2(${literal(key)});`, 'tuple mismatch', /(?:ERROR|FATAL):.*rolling quota binding mismatch/);
      const value = (await check("UPDATE official_v3_jobs_private.rolling_policy_v2 SET installed_at=clock_timestamp()+interval '1 hour';"))
      assert.equal(value.clock_ok, false)
    })
  } finally { await proof.close(); }
}
