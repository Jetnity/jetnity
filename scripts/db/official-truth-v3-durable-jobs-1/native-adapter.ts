// TEST ONLY. Own each fixed transaction through real COMMIT, cancellation and drain.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { LocalPgConnection, LocalPgError, pgText, type PgRows, type PgParameter } from '../official-truth-integrated-pilot-1/pg-wire'
import { assertOwnedLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import type { M04TerminalExecutor, M04FixedRequest } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import type { V3IntakeSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'
import { M04_TEST_LOGIN } from './fixtures'

export const M04_FIXED_SQL = `SELECT official_v3_jobs_api.execute_v1(
  $1::text,$2::text,$3::integer,$4::text,
  $5::text,NULLIF($6::text,'')::integer,$7::integer,$8::text) AS result`
export const M04_S1_STATEMENTS = Object.freeze([
  'SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result',
  'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
  'SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
  'SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
])
type Identity = Readonly<{ pid: string; birth: string }>
type Kind = 'jobs' | 'intake'
type Call = { id: number; kind: Kind; statement: string; operation: string; control?: LocalPgConnection;
  target?: LocalPgConnection; controlId?: Identity; targetId?: Identity; cancellation?: Promise<void>; dispatched: boolean; committed: boolean; drained: boolean }
type Hooks = Readonly<{
  afterAcquisition?: (call: Readonly<Call>, signal: AbortSignal) => Promise<void>
  beforeQuery?: (call: Readonly<Call>, signal: AbortSignal) => Promise<void>
  afterQuery?: (call: Readonly<Call>, rows: PgRows, signal: AbortSignal) => Promise<void>
  beforeCommit?: (call: Readonly<Call>, signal: AbortSignal) => Promise<void>
  loseAcknowledgement?: (call: Readonly<Call>) => boolean
  beforeDrain?: (call: Readonly<Call>) => Promise<void>
  releaseGates?: () => void
}>
const IDENTITY_SQL = 'SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth,session_user::text AS login,current_user::text AS role FROM pg_stat_activity WHERE pid=pg_backend_pid()'
const microseconds = (s: string) => s.slice(0, -1) + '000Z'
function identity(rows: PgRows, login: string, role: string): Identity {
  assert.equal(rows.length, 1); const row = rows[0]!
  assert.deepEqual(Object.keys(row).sort(), ['birth', 'login', 'pid', 'role'])
  assert.equal(row.login, login); assert.equal(row.role, role)
  assert.match(row.pid!, /^[1-9][0-9]{0,9}$/); assert.ok(row.birth && row.birth.length < 65)
  return Object.freeze({ pid: row.pid!, birth: row.birth! })
}
export async function createM04NativeExecutors(cluster: LocalProofCluster, lifetime: OwnedTestLifetime, hooks: Hooks = {}) {
  assertOwnedLocalProofCluster(cluster)
  const observer = await lifetime.run(() => LocalPgConnection.connect(cluster))
  await observer.query("SELECT set_config('statement_timeout','1000',false),set_config('lock_timeout','1000',false)")
  const contexts = new Set<Call>(), active = { jobs: 0, intake: 0 }, stop = new AbortController()
  let nextId = 0, poisoned = false, stopped = false, cleanupTail = Promise.resolve()
  const evidence = { admitted: 0, dispatched: 0, acknowledged: 0, lost: 0, aborted: 0, drained: 0,
    maxJobs: 0, maxIntake: 0, poisoned: false, sqlCodes: [] as string[], calls: [] as Readonly<{ id: number; kind: Kind; operation: string;
      target: Identity | null; control: Identity | null; dispatched: boolean; committed: boolean; drained: boolean }>[] }
  const removeStop = lifetime.onStop(() => { stop.abort(); hooks.releaseGates?.() })
  function poison() {
    if (poisoned) return
    poisoned = true; evidence.poisoned = true; stop.abort(); hooks.releaseGates?.()
    for (const call of contexts) { call.target?.close(); call.control?.close() }
    // A failed drain is a failed fixture, never a reusable native lane.
    lifetime.stopCluster(cluster)
  }
  async function drain(call: Call) {
    const before = cleanupTail
    let release!: () => void
    cleanupTail = new Promise<void>(resolve => { release = resolve })
    try {
      await before
      await hooks.beforeDrain?.(call)
      const until = performance.now() + 5000
      for (;;) {
        lifetime.check()
        assert.ok(call.targetId && call.controlId, 'both real backend identities must be captured')
        const rows = await observer.query(`SELECT
          (NOT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz))::text AS target_absent,
          (NOT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=$3::integer AND backend_start=$4::timestamptz))::text AS control_absent`,
        [pgText(call.targetId.pid, 23), pgText(call.targetId.birth), pgText(call.controlId.pid, 23), pgText(call.controlId.birth)])
        if (rows[0]?.target_absent === 'true' && rows[0]?.control_absent === 'true') { call.drained = true; evidence.drained++; return }
        if (performance.now() >= until) throw Error('m04 native drain expired')
        await lifetime.wait(5)
      }
    } catch (error) { poison(); throw error } finally { release() }
  }
  async function execute(kind: Kind, statement: string, operation: string, parameters: () => readonly PgParameter[],
    signal: AbortSignal, deadline: number, notAfter: string) {
    if (poisoned || stopped || signal.aborted || stop.signal.aborted || performance.now() >= deadline || active[kind] >= 4 || nextId >= 2048) return { status: 'unavailable' as const }
    const call: Call = { id: ++nextId, kind, statement, operation, dispatched: false, committed: false, drained: false }
    contexts.add(call); active[kind]++; evidence.admitted++
    evidence.maxJobs = Math.max(evidence.maxJobs, active.jobs); evidence.maxIntake = Math.max(evidence.maxIntake, active.intake)
    let began = false, timer: ReturnType<typeof setTimeout> | undefined
    const abort = () => {
      if (!call.control || !call.targetId || call.cancellation) return
      evidence.aborted++
      call.cancellation = lifetime.track(call.control.query('SELECT pg_terminate_backend(pid,1000)::text AS terminated FROM pg_stat_get_activity($1::integer) WHERE backend_start=$2::timestamptz',
        [pgText(call.targetId.pid, 23), pgText(call.targetId.birth)]).then(rows => { assert.ok(rows.every(r => r.terminated === 'true')) }))
      void call.cancellation.catch(() => {})
    }
    try {
      call.control = await lifetime.run(() => LocalPgConnection.connect(cluster))
      call.controlId = identity(await call.control.query(IDENTITY_SQL), cluster.user, cluster.user)
      await call.control.query("SELECT set_config('statement_timeout','1000',false),set_config('lock_timeout','1000',false)")
      call.target = await lifetime.run(() => LocalPgConnection.connect(cluster, M04_TEST_LOGIN[kind]))
      // Capture the login's own visible birth before NOINHERIT SET ROLE.
      call.targetId = identity(await call.target.query(IDENTITY_SQL), M04_TEST_LOGIN[kind], M04_TEST_LOGIN[kind])
      await call.target.query(kind === 'jobs' ? 'SET ROLE ot_v3_jobs_caller' : 'SET ROLE ot_v3_intake_caller')
      signal.addEventListener('abort', abort, { once: true }); stop.signal.addEventListener('abort', abort, { once: true })
      timer = setTimeout(abort, Math.max(0, deadline - performance.now()))
      await hooks.afterAcquisition?.(call, signal)
      if (signal.aborted || stop.signal.aborted || performance.now() >= deadline) { abort(); return { status: 'unavailable' as const } }
      await call.target.query('BEGIN ISOLATION LEVEL READ COMMITTED'); began = true
      await call.target.query("SELECT set_config('statement_timeout',$1::text,true),set_config('lock_timeout',$1::text,true)",
        [pgText(String(Math.max(1, Math.floor(deadline - performance.now()))))])
      await hooks.beforeQuery?.(call, signal)
      if (signal.aborted || stop.signal.aborted || performance.now() >= deadline) return { status: 'unconfirmed' as const }
      // parameters() is evaluated after acquisition against the ORIGINAL cap.
      const bound = parameters()
      if (performance.now() >= deadline) return { status: 'unconfirmed' as const }
      call.dispatched = true; evidence.dispatched++
      const rows = await call.target.query(statement, bound)
      await hooks.afterQuery?.(call, rows, signal)
      await hooks.beforeCommit?.(call, signal)
      if (signal.aborted || stop.signal.aborted || performance.now() >= deadline) return { status: 'unconfirmed' as const }
      const committed = await call.target.commitBefore(deadline, microseconds(notAfter))
      call.committed = committed.acknowledged && !committed.protectionFailure
      if (!call.committed) return { status: 'unconfirmed' as const }
      evidence.acknowledged++
      if (signal.aborted || performance.now() >= deadline || hooks.loseAcknowledgement?.(call)) { evidence.lost++; return { status: 'unconfirmed' as const } }
      return { status: 'acknowledged' as const, rows }
    } catch (error) {
      if (error instanceof LocalPgError && /^[0-9A-Z]{5}$/.test(error.code) && evidence.sqlCodes.length < 2048) evidence.sqlCodes.push(error.code)
      return { status: call.dispatched ? 'unconfirmed' as const : 'unavailable' as const }
    } finally {
      if (timer) clearTimeout(timer)
      signal.removeEventListener('abort', abort); stop.signal.removeEventListener('abort', abort)
      let cleanupFailure: unknown
      try {
        // A failed control promise is evidence to retain, never an early exit
        // from actual target/control termination and their native absence proof.
        try { await call.cancellation } catch (error) { cleanupFailure = error }
        if (call.target && began && !call.committed && !call.cancellation) {
          try { await call.target.query('ROLLBACK') } catch (error) { cleanupFailure ??= error }
        }
        try { call.target?.close() } catch (error) { cleanupFailure ??= error }
        try { call.control?.close() } catch (error) { cleanupFailure ??= error }
        if (call.targetId && call.controlId) {
          try { await drain(call) } catch (error) { cleanupFailure ??= error; poison() }
        } else { poison(); cleanupFailure ??= Error('m04 acquisition identity unavailable; stopped owned cluster') }
        assert.ok(call.drained || poisoned, 'native slot cannot retire without actual absence or owned cluster stop')
        if (cleanupFailure) throw cleanupFailure
      } finally {
        active[kind]--; contexts.delete(call)
        evidence.calls.push(Object.freeze({ id: call.id, kind, operation, target: call.targetId ?? null, control: call.controlId ?? null,
          dispatched: call.dispatched, committed: call.committed, drained: call.drained }))
      }
    }
  }
  const jobs: M04TerminalExecutor = Object.freeze({ async executeFixed(request: M04FixedRequest, signal: AbortSignal) {
    const deadline = Math.min(request.budget.deadline, performance.now() + 5000)
    assert.ok(Number.isFinite(deadline) && typeof request.notAfter === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(request.notAfter))
    assert.ok(Buffer.byteLength(request.operationText) <= 262144)
    const operation = JSON.parse(request.operationText).operation as string
    assert.ok(['queue_read', 'queue_confirm', 'queue_cas', 'execution_read', 'execution_start', 'execution_prepare'].includes(operation))
    return execute('jobs', M04_FIXED_SQL, operation, () => {
      const remaining = Math.min(5000, Math.floor(deadline - performance.now())); assert.ok(remaining >= 1)
      return [pgText(request.operationText), pgText(request.methodId), pgText(String(request.revision), 23), pgText(request.methodDigest), pgText(request.packageDigest),
        // Root M04-T01, PR1178 comment6754518445: the unchanged wire helper
        // has no NULL bytes parameter. This sole fixed NULLIF cast carries probe NULL.
        pgText(request.epoch === null ? '' : String(request.epoch)), pgText(String(remaining), 23), pgText(request.notAfter)]
    }, signal, deadline, request.notAfter)
  } })
  const intake: V3IntakeSqlExecutor = Object.freeze<V3IntakeSqlExecutor>({ async execute(statement, params, signal) {
    assert.ok(M04_S1_STATEMENTS.includes(statement)); assert.ok(params.length === [3, 3, 4, 7][M04_S1_STATEMENTS.indexOf(statement)])
    const deadline = performance.now() + 5000, notAfter = new Date(Date.now() + 5000).toISOString()
    return execute('intake', statement, String(M04_S1_STATEMENTS.indexOf(statement)), () => params.map(v => pgText(String(v), typeof v === 'number' ? 23 : 25)), signal, deadline, notAfter)
  } })
  return { jobs, intake, evidence,
    snapshot: () => Object.freeze({ jobs: active.jobs, intake: active.intake, contexts: contexts.size, poisoned }),
    async dispose() { stopped = true; stop.abort(); hooks.releaseGates?.(); await cleanupTail; assert.equal(contexts.size, 0); observer.close(); removeStop() },
  }
}
