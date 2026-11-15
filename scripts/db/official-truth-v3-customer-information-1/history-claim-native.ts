// Owned-local factory proof, with genuine MA1/M04 SQL and the original queue
// deadline. One asynchronous single-user backend serializes SQL calls. This is
// not a TCP/TLS, connection-parallelism or cold-backend performance claim.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { createV3PostgresDurableJobs, type Ma1MethodSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import type { M04Config, M04FixedRequest } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { readM04NativeReply } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import type { V3ManagedJobRecord, V3QueueCommit } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { hrs1Clock, hrs1Same } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { baseSetup, methodSeed } from './native'
import { buildCapacityFixture626 } from './history-capacity-fixture'
import { compileHistoryDefinition, HISTORY_SIGNATURE } from './history-build.mjs'
import { M04_S1_STATEMENTS } from '../official-truth-v3-durable-jobs-1/native-adapter'
import { checkHistoryFactorySuccess } from './history-success-native'
import { historyGuardCadence } from './history-bg1-cadence-native'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner; SET search_path=pg_catalog;'
const creator = 'SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog;'
const fixtureScope = "SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';"
const binding = { methodId: program.binding.methodId, revision: program.binding.revision,
  methodDigest: program.binding.methodDigest, packageDigest: program.binding.packageDigest }
const id = (kind: string) => kind + '_' + createHash('sha256').update('owned-real-capacity-claim626:' + kind).digest('hex').slice(0, 32)

export type HistoryFactoryEvent = {
  operation: string; phase?: string; action?: string; purpose?: string;
  entered: number; admitted?: number; finished: number; deadline: number;
  dispatched: boolean; status?: string; error?: string; record?: V3ManagedJobRecord;
  envelopeText?: string; replayed?: boolean;
}
type Prefix = { digest: string; operations: number; starts: number; dispositions: number }
type Quota = { lifetime_starts: number; lifetime_operations: number; starts: number; operations: number; clock_ok: boolean }

/** A local SQL bridge, not a protocol double. Positive rows come only from the
 * original functions, COMMIT and the backend's complete output/cleanup drain.
 * Admission after the serialized wait recomputes the remaining original cap.
 * Late/aborted calls cannot acquire another window or return positive rows. */
export function localExecutors(proof: OwnedPersistentProof) {
  const events: HistoryFactoryEvent[] = []
  let tail: Promise<void> = Promise.resolve(), active = 0, peak = 0
  const serialize = <T>(run: () => Promise<T>): Promise<T> => {
    const next = tail.then(run)
    tail = next.then(() => undefined, () => undefined)
    return next
  }
  const begin = (login: 'ot_ma1_reader' | 'ot_m04_jobs' | 'ot_m04_intake',
    role: 'ot_v3_method_reader' | 'ot_v3_jobs_caller' | 'ot_v3_intake_caller', remaining: number) =>
    `SET SESSION AUTHORIZATION ${login}; SET ROLE ${role}; SET search_path=pg_catalog; BEGIN;
    SET LOCAL statement_timeout='${remaining}ms'; SET LOCAL lock_timeout='${remaining}ms';
    DO $identity$ BEGIN IF session_user<>${literal(login)} OR current_user<>${literal(role)} THEN
      RAISE EXCEPTION 'original runtime identity required'; END IF; END $identity$;`
  async function call<T>(event: HistoryFactoryEvent, signal: AbortSignal, run: (remaining: number) => Promise<T>, failed: T): Promise<T> {
    events.push(event)
    return serialize(async () => {
      event.admitted = performance.now()
      const remaining = Math.floor(event.deadline - event.admitted)
      if (signal.aborted || remaining < 1 || remaining > 5000) {
        event.status = 'unavailable'; event.finished = performance.now(); return failed
      }
      active++; peak = Math.max(peak, active)
      try {
        event.dispatched = true
        const value = await run(remaining)
        if (signal.aborted || performance.now() >= event.deadline) {
          event.status = 'unavailable'; return failed
        }
        return value
      } catch (error) {
        event.error = error instanceof Error ? error.message.split('\n').filter(line => /ERROR:|FATAL:|PANIC:/.test(line)).join('\n') || error.message : String(error)
        event.status = 'unavailable'; return failed
      } finally { event.finished = performance.now(); active-- }
    })
  }
  const method: Ma1MethodSqlExecutor = { async readCurrent(request, signal, budget) {
    assert.ok(budget, 'real factory supplies the original method observation deadline')
    const event: HistoryFactoryEvent = { operation: 'method', entered: performance.now(), finished: 0, deadline: budget.deadline, dispatched: false }
    return call<Awaited<ReturnType<Ma1MethodSqlExecutor['readCurrent']>>>(event, signal, async remaining => {
      const args = [literal(request.methodId), String(request.revision), literal(request.methodDigest),
        literal(request.packageDigest), literal(request.checkedAt)].join(',')
      const rows = await proof.value<Record<string, string | null>[]>(`(SELECT jsonb_agg(to_jsonb(r)) FROM
        (SELECT status,method_id,revision::text,method_digest,package_digest,epoch::text,approval_mode,approval_until,
          observed_at,remaining_ms::text FROM official_v3_method_api.read_current_v1(${args})) r)`,
      begin('ot_ma1_reader', 'ot_v3_method_reader', remaining), 'COMMIT;')
      event.status = rows[0]?.status ?? 'missing'
      return { status: 'rows', rows }
    }, { status: 'unavailable' })
  } }
  const execute: M04Config['jobsExecutor']['executeFixed'] = async (request: M04FixedRequest, signal) => {
    const input = JSON.parse(request.operationText) as { operation: string; phase: string; body: {
      command?: { action: string }; purpose?: string;
    } }
    const event: HistoryFactoryEvent = { operation: input.operation, phase: input.phase, action: input.body.command?.action,
      purpose: input.body.purpose, entered: performance.now(), finished: 0, deadline: request.budget.deadline, dispatched: false }
    return call<Awaited<ReturnType<M04Config['jobsExecutor']['executeFixed']>>>(event, signal, async remaining => {
      const args = [literal(request.operationText), literal(request.methodId), String(request.revision), literal(request.methodDigest),
        literal(request.packageDigest), request.epoch === null ? 'NULL' : String(request.epoch), String(remaining), literal(request.notAfter)].join(',')
      const actual = await proof.value<unknown>(`official_v3_jobs_api.execute_v1(${args})`,
        begin('ot_m04_jobs', 'ot_v3_jobs_caller', remaining),
        `DO $commit_deadline$ BEGIN IF clock_timestamp()>=${literal(request.notAfter)}::timestamptz THEN
          RAISE EXCEPTION 'original RPC commit deadline expired'; END IF; END $commit_deadline$; COMMIT;`)
      const rows = [{ result: JSON.stringify(actual) }]
      const decoded = readM04NativeReply(rows, input.operation as Parameters<typeof readM04NativeReply>[1])
      assert.ok(decoded, 'every reply must pass the unchanged M04 native decoder')
      event.status = decoded.status
      if (decoded.status === 'present' || decoded.status === 'committed') event.record = decoded.record
      if (decoded.status === 'committed') { event.envelopeText = decoded.envelopeText; event.replayed = decoded.replayed }
      return { status: 'acknowledged', rows }
    }, { status: 'unconfirmed' })
  }
  const jobs: M04Config['jobsExecutor'] = Object.freeze<M04Config['jobsExecutor']>({
    async executeFixed(request, signal) {
      const operation = JSON.parse(request.operationText) as { operation: string }
      assert.notEqual(operation.operation, 'queue_claim', 'an atomic claim never falls back to the historical executor')
      assert.notEqual(operation.operation, 'queue_mutate', 'an atomic mutation never falls back to the historical executor')
      return execute(request, signal)
    },
    async executeAtomicClaimFixed(request, signal) {
      const operation = JSON.parse(request.operationText) as { operation: string; phase: string }
      assert.equal(operation.operation, 'queue_claim'); assert.equal(operation.phase, 'authorized')
      return execute(request, signal)
    },
    async executeAtomicMutationFixed(request, signal) {
      const operation = JSON.parse(request.operationText) as { operation: string; phase: string }
      assert.equal(operation.operation, 'queue_mutate'); assert.equal(operation.phase, 'authorized')
      return execute(request, signal)
    },
  })
  const intake: M04Config['intakeExecutor'] = Object.freeze<M04Config['intakeExecutor']>({ async execute(statement, params, signal, budget) {
    const index = M04_S1_STATEMENTS.indexOf(statement)
    assert.ok(index >= 0 && budget, 'only the four original intake statements with an actual budget')
    assert.equal(params.length, [3, 3, 4, 7][index])
    const expression = statement.replace(/^SELECT /, '').replace(/ AS result$/, '').replace(/\$(\d+)/g, (_match, number: string) => {
      const value = params[Number(number) - 1]
      assert.ok(typeof value === 'string' || typeof value === 'number' && Number.isSafeInteger(value))
      return typeof value === 'string' ? literal(value) : String(value)
    })
    const event: HistoryFactoryEvent = { operation: ['s1_read', 's1_capture', 's1_reserve', 's1_finish'][index],
      entered: performance.now(), finished: 0, deadline: budget.deadline, dispatched: false }
    return call<Awaited<ReturnType<M04Config['intakeExecutor']['execute']>>>(event, signal, async remaining => {
      const actual = await proof.value<{ status: string }>(expression,
        begin('ot_m04_intake', 'ot_v3_intake_caller', remaining), 'COMMIT;')
      event.status = actual.status
      return { status: 'acknowledged', rows: [{ result: JSON.stringify(actual) }] }
    }, { status: 'unconfirmed' })
  } })
  return { method, jobs, intake, events, drain: () => tail, active: () => active, peak: () => peak }
}
export type HistoryFactoryBridge = ReturnType<typeof localExecutors>

export async function runHistoryClaimNative(t: TestContext) {
  const fixture = await buildCapacityFixture626(), successor = compileHistoryDefinition()
  const proof = new OwnedPersistentProof(t.signal)
  try {
    await baseSetup(proof)
    await proof.run(owner + 'BEGIN;' + fixtureScope + methodSeed(fixture.original.oldestAt) + fixture.original.seedSql + 'COMMIT;', 'same original64 prefix')
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql', 'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql']) {
      await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-background-guard-1/' + file) + 'COMMIT;', 'unchanged BG1 predecessor')
    }
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql') + 'COMMIT;', 'unchanged rolling predecessor')
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-customer-information-1/provider-migration-body.sql') + 'COMMIT;', 'exact bounded history successor')
    assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current',
      'the installed successor must pass the genuine complete BG1 audit before historical continuation')
    const guard = historyGuardCadence(t, proof)
    await guard.admit('complete history seed')
    const cutoff = literal(fixture.prefixCutoff) + '::timestamptz'
    const prefixExpression = `(WITH o AS (SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE recorded_at<=${cutoff}),
      s AS (SELECT * FROM official_v3_jobs_private.execution_starts_v1 WHERE reserved_at<=${cutoff}),
      d AS (SELECT * FROM official_v3_jobs_private.execution_dispositions_v1 WHERE settled_at<=${cutoff})
      SELECT jsonb_build_object('operations',(SELECT count(*) FROM o),'starts',(SELECT count(*) FROM s),'dispositions',(SELECT count(*) FROM d),
        'digest',encode(sha256(convert_to(jsonb_build_object('o',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM o r),
          's',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM s r),
          'd',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM d r))::text,'UTF8')),'hex')))`
    const prefix = await proof.value<Prefix>(prefixExpression, owner + 'BEGIN;' + fixtureScope + fixture.prefixSql, 'ROLLBACK;')
    assert.deepEqual([prefix.operations, prefix.starts, prefix.dispositions], [447, 86, 86])
    await proof.run(owner + 'BEGIN;' + fixtureScope + 'SELECT official_v3_guard_private.begin_jobs_v1();' + fixture.queueSql
      + 'SELECT official_v3_guard_private.seal_jobs_v1();COMMIT;', 'same complete626/2066 history with retained187 deduplications')
    const quota = await proof.value<Quota>('official_v3_guard_private.ch_de_quota_v2()', creator)
    assert.equal(quota.lifetime_starts, 626); assert.equal(quota.lifetime_operations, 2066)
    assert.equal(quota.clock_ok, true); assert.ok(quota.starts <= 64 && quota.operations <= 256)
    const rolesExpression = `(SELECT to_jsonb(encode(sha256(convert_to(jsonb_build_object(
      'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY oid) FROM pg_roles r),
      'memberships',(SELECT jsonb_agg(to_jsonb(r) ORDER BY oid) FROM pg_auth_members r))::text,'UTF8')),'hex')))`
    const roles = await proof.value<string>(rolesExpression, owner)
    const check = async () => {
      await guard.admit('history invariants', 5000)
      assert.deepEqual(await proof.value<Prefix>(prefixExpression, owner), prefix, 'all447 original journal rows retain their exact stored fields and texts')
      assert.equal(await proof.value<string>(rolesExpression, owner), roles, 'original roles and grants remain unchanged')
      await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();SELECT official_v3_guard_private.check_certificates_v1();'
        + 'SELECT official_v3_guard_private.require_open_v1();', 'real catalog, certificates and open gate')
      assert.equal(await proof.value<string>(`(SELECT to_jsonb(encode(sha256(convert_to(prosrc,'UTF8')),'hex')) FROM pg_proc
        WHERE oid=${literal(HISTORY_SIGNATURE)}::regprocedure)`, owner), successor.after)
    }
    await check()
    const initial = await proof.value<V3ManagedJobRecord>(`(SELECT current_job FROM official_v3_jobs_private.subjects_v1
      WHERE job_key=${literal(fixture.original.jobKey)})`, owner)
    assert.equal(initial.state, 'queued'); assert.equal(initial.revision, 1879); assert.equal(initial.attempt, 0)
    const claim = { operationId: id('op3'), leaseId: id('lease3'), jobKey: fixture.original.jobKey, leaseMilliseconds: 30000 }
    const bridge = localExecutors(proof)
    let deliveries = 0
    const config: M04Config = {
      binding, registry: program.registry,
      clock() { const value = hrs1Clock(new Date().toISOString(), program.legalTimeZone); assert.ok(value); return value },
      methodExecutor: bridge.method, jobsExecutor: bridge.jobs,
      intakeExecutor: { async execute() { assert.fail('no proposal is created by the unavailable local producer') } },
      producer: { async produce() { deliveries++; return { status: 'failed', reason: 'unreachable' } } },
      evidence: { async inspect() { assert.fail('no source fact is fabricated') }, async reprove() { assert.fail('no source receipt is fabricated') } },
      history: { async read() { assert.fail('no rule history is fabricated') }, async reprove() { assert.fail('no rule history receipt is fabricated') } },
    }
    await proof.run(owner + "DO $off$ BEGIN IF current_setting('track_functions')<>'none' THEN RAISE EXCEPTION 'instrumented factory timing';END IF;END $off$;", 'uninstrumented real factory')
    await guard.admit('original history factory')
    const started = performance.now()
    const outcome = await createV3PostgresDurableJobs(config).workOnce(claim, t.signal)
    await bridge.drain()
    const elapsed = performance.now() - started
    t.diagnostic('actual local serialized SQL factory626/2066: ' + JSON.stringify({ historyBody: successor.after, status: outcome.status,
      worker: outcome.status === 'worker_only' ? outcome.worker.status : null, milliseconds: elapsed, deliveries,
      calls: bridge.events.map(e => ({ operation: e.operation, phase: e.phase, action: e.action, purpose: e.purpose,
        milliseconds: e.finished - e.entered, queuedMilliseconds: (e.admitted ?? e.entered) - e.entered,
        remainingAtEntry: e.deadline - e.entered, remainingAtSettlement: e.deadline - e.finished,
        dispatched: e.dispatched, status: e.status, error: e.error })) }))

    await t.test('one actual fresh factory claim confirms one atomic M04 transaction and three real MA1 reads inside unchanged5s', () => {
      const atomicIndex = bridge.events.findIndex(e => e.operation === 'queue_claim' && e.action === 'claim')
      assert.ok(atomicIndex >= 2, 'the real factory acquires and rechecks authority before atomic claim')
      const start = atomicIndex - 2
      const calls = bridge.events.slice(start, start + 4)
      assert.deepEqual(calls.map(e => [e.operation, e.phase ?? null, e.action ?? null]), [
        ['method', null, null], ['method', null, null], ['queue_claim', 'authorized', 'claim'], ['method', null, null],
      ], 'real acquisition, real pre-effect reproof, atomic complete SQL transition and real final reproof')
      assert.deepEqual(calls.map(e => e.status), ['approved', 'approved', 'committed', 'approved'])
      assert.ok(calls.every(e => e.dispatched && !e.error && e.finished < e.deadline))
      const [acquired, beforeEffect, atomic, reproof] = calls
      assert.ok(reproof.finished - acquired.entered < 5000, 'the entire queue claim fits its original five-second budget')
      assert.ok(beforeEffect.deadline <= acquired.deadline && atomic.deadline <= beforeEffect.deadline
        && reproof.deadline <= atomic.deadline, 'neither the effect nor either reproof renews the private receipt')
      assert.equal(atomic.replayed, false)
      assert.equal(atomic.record?.state, 'leased'); assert.equal(atomic.record?.revision, 1880)
      assert.equal(atomic.record?.lease?.leaseId, claim.leaseId)
      assert.ok(atomic.envelopeText)
      const envelope = JSON.parse(atomic.envelopeText) as V3QueueCommit
      assert.ok(hrs1Same(envelope.expected, initial), 'the atomic transaction records the actual original predecessor')
      assert.ok(hrs1Same(envelope.next, atomic.record), 'the complete validated receipt binds the exact final acquisition')
      assert.equal(envelope.operationId, claim.operationId)
      assert.ok(bridge.events.slice(start + 4).some(e => e.operation === 'execution_read' && e.purpose === 'lookup'),
        'the unchanged worker advances only after queue.claim returns confirmed')
      t.diagnostic('actual complete claim milliseconds: ' + (reproof.finished - acquired.entered).toFixed(3)
        + '; one atomic M04 RPC with three full history checks and three real MA1 observations; local SQL explicitly serialized')
    })
    await t.test('the real START and unavailable local producer settle through the original terminal path', async () => {
      const lookupAt = bridge.events.findIndex(e => e.operation === 'execution_read' && e.purpose === 'lookup')
      assert.ok(lookupAt >= 0)
      const [lookup, acquired, reproof, start] = bridge.events.slice(lookupAt, lookupAt + 4)
      assert.deepEqual([lookup.operation, acquired.operation, reproof.operation, start.operation],
        ['execution_read', 'method', 'method', 'execution_start'])
      assert.deepEqual([lookup.status, acquired.status, reproof.status, start.status], ['absent', 'approved', 'approved', 'reserved'])
      assert.ok(lookup.finished <= acquired.entered, 'actual read finishes before the first worker authority acquisition')
      assert.ok(reproof.deadline <= acquired.deadline && start.deadline <= reproof.deadline,
        'the original five-second worker receipt is never renewed')
      assert.ok(start.finished < start.deadline && start.finished - acquired.entered < 5000)
      t.diagnostic('actual first worker authority through START: ' + JSON.stringify({
        lookupMilliseconds: lookup.finished - lookup.entered, startMilliseconds: start.finished - start.entered,
        originalAuthorityMilliseconds: start.finished - acquired.entered,
        remainingMilliseconds: start.deadline - start.finished }))
      assert.equal(outcome.status, 'worker_only'); assert.ok(outcome.status === 'worker_only')
      assert.equal(outcome.worker.status, 'exhausted'); assert.equal(deliveries, 1)
      const after = await proof.value<Quota>('official_v3_guard_private.ch_de_quota_v2()', creator)
      assert.equal(after.lifetime_starts, 627); assert.equal(after.lifetime_operations, 2068)
      assert.equal(after.clock_ok, true); assert.ok(after.starts <= 64 && after.operations <= 256)
      const head = await proof.value<{ current_job: V3ManagedJobRecord; open_attempt: unknown; terminal_credit_claim: unknown }>(`(SELECT to_jsonb(r)
        FROM (SELECT current_job,open_attempt,terminal_credit_claim FROM official_v3_jobs_private.subjects_v1
          WHERE job_key=${literal(fixture.original.jobKey)}) r)`, owner)
      assert.equal(head.current_job.state, 'exhausted'); assert.equal(head.current_job.revision, 1881)
      assert.equal(head.open_attempt, null); assert.equal(head.terminal_credit_claim, null)
      assert.equal(head.current_job.lastFailure, 'unreachable')
    })
    await t.test('normal enqueue, successful producer and separately prepared resume complete through actual S1 inside original budgets', async () => {
      await checkHistoryFactorySuccess(t, proof, config, bridge, fixture.original.jobKey, guard)
    })
    await t.test('factory settlement retains the entire old prefix, original catalog and drained local SQL', async () => {
      assert.equal(bridge.active(), 0); assert.equal(bridge.peak(), 1, 'owned local SQL is explicitly serialized')
      await check()
    })
  } finally { await proof.close() }
}
