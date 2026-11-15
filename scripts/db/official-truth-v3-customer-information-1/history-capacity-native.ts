// Mandatory owned PG17 horizon proof. Every run uses a fresh fully drained
// backend. The first operational call is uninstrumented and must pass once.
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { OwnedSingleProof, literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { baseSetup, methodSeed } from './native'
import { buildCapacityFixture626 } from './history-capacity-fixture'
import { compileHistoryDefinition, HISTORY_SIGNATURE } from './history-build.mjs'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { hrs1Canonical } from '../../../lib/readiness/official-truth-product-v3/result/contract'

const creator = 'SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog;'
const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner; SET search_path=pg_catalog;'
const caller = 'SET SESSION AUTHORIZATION ot_m04_jobs; SET ROLE ot_v3_jobs_caller;'
const scope = "SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';"
const dataDigest = `(SELECT to_jsonb(encode(sha256(convert_to(jsonb_build_object(
  'subjects',(SELECT jsonb_agg(to_jsonb(r) ORDER BY job_key) FROM official_v3_jobs_private.subjects_v1 r),
  'operations',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM official_v3_jobs_private.queue_operations_v1 r),
  'starts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_starts_v1 r),
  'dispositions',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_dispositions_v1 r)
  )::text,'UTF8')),'hex')))`
type Quota = { lifetime_starts: number; lifetime_operations: number; starts: number; operations: number; clock_ok: boolean }
type Profile = { name: string; calls: number }
type Prefix = { digest: string; counts: { operations: number; starts: number; dispositions: number } }

export async function runHistoryCapacityNative(t: TestContext) {
  const fixture = await buildCapacityFixture626(), successor = compileHistoryDefinition()
  const proof = new OwnedSingleProof()
  try {
    await baseSetup(proof)
    proof.run(owner + 'BEGIN;' + scope + methodSeed(fixture.original.oldestAt) + fixture.original.seedSql + 'COMMIT;', 'original64 coherent predecessor')
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql', 'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql']) {
      proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-background-guard-1/' + file) + 'COMMIT;', 'exact original BG1 predecessor')
    }
    proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql') + 'COMMIT;', 'immutable rolling installer')
    proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-customer-information-1/provider-migration-body.sql') + 'COMMIT;', 'exact bounded history successor')
    assert.equal(proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator).status, 'current')
    assert.equal(fixture.retainedStarts, 626); assert.equal(fixture.retainedOperations, 2066)
    const cutoff = literal(fixture.prefixCutoff) + '::timestamptz'
    const prefixExpression = `(WITH operations AS (SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE recorded_at<=${cutoff}),
      starts AS (SELECT * FROM official_v3_jobs_private.execution_starts_v1 WHERE reserved_at<=${cutoff}),
      dispositions AS (SELECT * FROM official_v3_jobs_private.execution_dispositions_v1 WHERE settled_at<=${cutoff})
      SELECT jsonb_build_object('counts',jsonb_build_object('operations',(SELECT count(*) FROM operations),
        'starts',(SELECT count(*) FROM starts),'dispositions',(SELECT count(*) FROM dispositions)),
        'digest',encode(sha256(convert_to(jsonb_build_object('operations',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM operations r),
          'starts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM starts r),
          'dispositions',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM dispositions r))::text,'UTF8')),'hex')))`
    const oldDigest = proof.value<string>(dataDigest, owner)
    const prefixOutput = proof.run(owner + 'BEGIN;' + scope + fixture.prefixSql
      + 'DO $prefix$ BEGIN RAISE WARNING \'CAPACITY_PREFIX %\',' + prefixExpression + ';END $prefix$;ROLLBACK;',
    'materialize the exact original86/447 prefix once and roll it back completely')
    const prefixSamples = [...prefixOutput.matchAll(/WARNING:\s+CAPACITY_PREFIX ([^\r\n]+)/g)]
    assert.equal(prefixSamples.length, 1)
    const prefix = JSON.parse(prefixSamples[0][1]) as Prefix
    assert.deepEqual(prefix.counts, { operations: 447, starts: 86, dispositions: 86 })
    assert.equal(proof.value<string>(dataDigest, owner), oldDigest, 'prefix rehearsal preserves the full original predecessor')
    // Explicit historical fixture rows are certified by the original full
    // begin/seal path, including the complete history, fingerprints and links.
    proof.run(owner + 'BEGIN;' + scope + 'SELECT official_v3_guard_private.begin_jobs_v1();' + fixture.queueSql
      + 'SELECT official_v3_guard_private.seal_jobs_v1();COMMIT;', '626 coherent cycles certified through original full seal')
    const check = () => {
      const quota = proof.value<Quota>('official_v3_guard_private.ch_de_quota_v2()', creator)
      assert.equal(quota.lifetime_starts, 626); assert.equal(quota.lifetime_operations, 2066)
      assert.equal(quota.clock_ok, true); assert.ok(quota.starts <= 64 && quota.operations <= 256)
      assert.deepEqual(proof.value<Prefix>(prefixExpression, owner), prefix, 'all447 original operations including187 deduplications retain exact database bytes')
      proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();SELECT official_v3_guard_private.check_certificates_v1();'
        + 'SELECT official_v3_guard_private.require_open_v1();', 'current exact catalog and complete original certificates')
      assert.equal(proof.value<string>(`(SELECT to_jsonb(encode(sha256(convert_to(prosrc,'UTF8')),'hex')) FROM pg_proc
        WHERE oid=${literal(HISTORY_SIGNATURE)}::regprocedure)`, owner), successor.after)
    }
    check()
    const before = proof.value<string>(dataDigest, owner), binding = program.binding
    const request = hrs1Canonical({ operation: 'queue_read', phase: 'authorized', body: { jobKey: fixture.original.jobKey, continuation: null } })
    const execute = (deadline: string) => `official_v3_jobs_api.execute_v1(${literal(request)},${literal(binding.methodId)},${binding.revision},
      ${literal(binding.methodDigest)},${literal(binding.packageDigest)},1,5000,${deadline})`
    const deadline = `to_char((clock_timestamp()+interval '5 seconds') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
    const call = `DO $capacity$ DECLARE started timestamptz:=clock_timestamp();reply jsonb;milliseconds numeric;BEGIN
      reply:=${execute(deadline)};
      IF reply->>'status' IS DISTINCT FROM 'present' THEN RAISE EXCEPTION '626-cycle queue read did not return present';END IF;
      milliseconds:=extract(epoch FROM clock_timestamp()-started)*1000;
      IF milliseconds>=5000 THEN RAISE EXCEPTION '626-cycle call exceeded its original budget';END IF;
      RAISE WARNING 'CAPACITY_PASS %',jsonb_build_object('milliseconds',milliseconds,'status',reply->>'status');END $capacity$;`
    await t.test('first fresh uninstrumented authorized626 call passes the original5s boundary', () => {
      const output = proof.run("DO $off$ BEGIN IF current_setting('track_functions')<>'none' THEN RAISE EXCEPTION 'instrumented timing';END IF;END $off$;"
        + caller + call, 'first actual uninstrumented cold626 M04 call, no retry')
      const samples = [...output.matchAll(/WARNING:\s+CAPACITY_PASS ([^\r\n]+)/g)]
      assert.equal(samples.length, 1)
      const result = JSON.parse(samples[0][1]) as { milliseconds: number; status: string }
      assert.equal(result.status, 'present'); assert.ok(result.milliseconds < 5000)
      t.diagnostic('cold626/2066 uninstrumented actual API with exact447-operation prefix: ' + JSON.stringify(result))
      assert.equal(proof.value<string>(dataDigest, owner), before); check()
    })
    await t.test('separate fresh call retains all three full original history checks', () => {
      proof.run(owner + "SELECT pg_stat_reset();SET track_functions='all';" + caller + call
        + owner + 'SELECT pg_stat_force_next_flush();', 'independent full scan count, same original deadline')
      const profile = proof.value<Profile[]>(`(SELECT jsonb_agg(jsonb_build_object('name',funcname,'calls',calls))
        FROM pg_stat_user_functions WHERE calls>0 AND funcname IN ('assert_history_v1','execute_v1','check_jobs_v1'))`, owner)
      assert.equal(profile.find(r => r.name === 'assert_history_v1')?.calls, 3)
      assert.equal(profile.find(r => r.name === 'execute_v1')?.calls, 1)
      assert.equal(profile.find(r => r.name === 'check_jobs_v1')?.calls, 1)
      assert.equal(proof.value<string>(dataDigest, owner), before); check()
    })
    await t.test('expired actual API and changed historical job both refuse without retained mutations', () => {
      const expired = proof.run(caller + 'SELECT ' + execute("'2000-01-01T00:00:00.000Z'") + ';', 'original expired budget refusal', /expired.*budget|budget.*expired/)
      assert.match(expired, /expired.*budget|budget.*expired/)
      assert.equal(proof.value<string>(dataDigest, owner), before); check()
      const invalid = proof.run(owner + 'BEGIN;' + scope + fixture.invalidSql + 'SET LOCAL ROLE ot_v3_jobs_owner;SELECT '
        + 'official_v3_jobs_private.assert_history_v1(' + literal(fixture.original.jobKey) + ');RESET ROLE;ROLLBACK;',
      'original complete invalid-job refusal after bounded memo eviction', /m04 invalid job|current transaction is aborted/)
      assert.match(invalid, /m04 invalid job/)
      assert.equal(proof.value<string>(dataDigest, owner), before); check()
    })
  } finally { proof.close() }
}
