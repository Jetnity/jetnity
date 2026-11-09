// Test-only finite executor. No application import, pool, driver or target selector.
import assert from 'node:assert/strict'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { assertOwnedLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { MA1_LIMITS, readMa1CurrentRequest } from '../../../lib/readiness/official-truth-product-v3/method/contract'
import { MA1_READ_CURRENT_SQL, type Ma1MethodSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import { MA1_AUTH } from './auth-fixture'

type Identity = Readonly<{ pid: string; birth: string }>
type Kind = 'control' | 'target'
type Options = Readonly<{
  afterAcquisition?: (kind: Kind, connection: LocalPgConnection, signal: AbortSignal) => Promise<void>
  beforeDrain?: (identities: Readonly<{ control: Identity; target: Identity }>, signal: AbortSignal) => Promise<void>
  beforeObserve?: () => Promise<void>
  corruptIdentity?: Kind
  breakObserver?: boolean
  releaseFaultGates?: () => void
}>
type Call = {
  id: number; promises: Promise<unknown>[]; pending: number
  control?: LocalPgConnection; target?: LocalPgConnection; controlId?: Identity; targetId?: Identity
  cancel?: Promise<void>; targetAbsent: boolean; controlAbsent: boolean; joined: boolean
}
const identitySql = 'SELECT pg_catalog.pg_backend_pid()::text AS pid,backend_start::text AS birth,session_user::text AS session_user,current_user::text AS current_user FROM pg_catalog.pg_stat_activity WHERE pid=pg_catalog.pg_backend_pid()'
const configureSql = "SELECT pg_catalog.set_config('statement_timeout','1000',false) AS statement_cap,pg_catalog.set_config('lock_timeout','1000',false) AS lock_cap"
function identity(rows: PgRows, login: string, role: string): Identity {
  assert.equal(rows.length, 1)
  const row = rows[0]!
  assert.deepEqual(Object.keys(row).sort(), ['birth', 'current_user', 'pid', 'session_user'])
  assert.ok(typeof row.pid === 'string' && /^[1-9][0-9]{0,9}$/.test(row.pid) && Number(row.pid) <= 2147483647)
  assert.ok(typeof row.birth === 'string' && row.birth.length >= 19 && row.birth.length <= 64)
  assert.equal(row.session_user, login); assert.equal(row.current_user, role)
  return Object.freeze({ pid: row.pid, birth: row.birth })
}

export async function createMa1NativeExecutor(cluster: LocalProofCluster, lifetime: OwnedTestLifetime, options: Options = {}) {
  assertOwnedLocalProofCluster(cluster)
  let observer: LocalPgConnection | undefined
  let poisoned: Error | undefined, stopped = false, active = 0, nextId = 0, laneTail = Promise.resolve()
  const contexts = new Set<Call>(), returned = new Set<LocalPgConnection>()
  const fixtureStop = new AbortController()
  const evidence = { admitted: 0, refusedCapacity: 0, dispatched: 0, aborted: 0, drained: 0,
    active: 0, maxActive: 0, cleanupRunning: 0, cleanupWaiting: 0, maxCleanupWaiting: 0,
    poisoned: false, clusterStopped: false, sqlCodes: [] as string[],
    calls: [] as Readonly<{ id: number; control: Identity | null; target: Identity | null;
      targetAbsent: boolean; controlAbsent: boolean; joined: boolean; pending: number; stoppedFailure: boolean }>[] }
  const own = <T>(call: Call, promise: Promise<T>): Promise<T> => {
    call.promises.push(promise); call.pending++
    void promise.then(() => { call.pending-- }, () => { call.pending-- })
    return promise
  }
  const close = (connection: LocalPgConnection | undefined) => {
    if (connection) { returned.delete(connection); connection.close() }
  }
  function fail(error: unknown): Error {
    if (!poisoned) {
      poisoned = error instanceof Error ? error : Error('ma1 native executor failure')
      evidence.poisoned = true
      fixtureStop.abort(poisoned)
      try { options.releaseFaultGates?.() } catch (failure) { poisoned = new AggregateError([poisoned, failure], 'ma1 fault gate cleanup failed') }
      for (const connection of returned) {
        try { connection.close() } catch (failure) { poisoned = new AggregateError([poisoned, failure], 'ma1 connection close failed') }
      }
      returned.clear()
      try {
        // Existing helper performs the real stop/postmaster-absence check synchronously.
        cluster.stop(); stopped = true; evidence.clusterStopped = true
        lifetime.stopCluster(cluster) // idempotent ownership accounting; no self-dispose.
      } catch (failure) { poisoned = new AggregateError([poisoned, failure], 'ma1 owned cluster stop failed') }
    }
    return poisoned
  }
  const check = () => { lifetime.check(); if (poisoned) throw poisoned }
  try {
    observer = await LocalPgConnection.connect(cluster); returned.add(observer)
    await observer.query(configureSql)
    identity(await observer.query(identitySql), cluster.user, cluster.user)
  } catch (error) { throw fail(error) }
  const stableObserver = observer
  const releaseOnStop = lifetime.onStop(() => { fixtureStop.abort(Error('ma1 native fixture stopped')); options.releaseFaultGates?.() })

  async function inCleanupLane(call: Call, operation: () => Promise<void>): Promise<void> {
    const previous = laneTail
    let release!: () => void
    laneTail = new Promise<void>(resolve => { release = resolve })
    evidence.cleanupWaiting++; evidence.maxCleanupWaiting = Math.max(evidence.maxCleanupWaiting, evidence.cleanupWaiting)
    let entered = false
    // These are four admitted contexts at most, not arbitrary queued authority calls.
    try {
      await previous; evidence.cleanupWaiting--; evidence.cleanupRunning++; entered = true
      check(); assert.equal(evidence.cleanupRunning, 1); await operation()
    } finally {
      if (entered) evidence.cleanupRunning--; else evidence.cleanupWaiting--
      release()
    }
    assert.ok(contexts.has(call))
  }
  async function proveBothAbsent(call: Call): Promise<void> {
    assert.ok(call.controlId && call.targetId)
    const controlId = call.controlId, targetId = call.targetId
    await inCleanupLane(call, async () => {
      if (options.beforeObserve) await own(call, lifetime.run(() => options.beforeObserve!()))
      check()
      if (options.breakObserver) stableObserver.close()
      for (let attempt = 0; attempt < 20; attempt++) {
        check()
        const rows = await own(call, stableObserver.query(`SELECT
          (NOT EXISTS(SELECT 1 FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz))::text AS target_absent,
          (NOT EXISTS(SELECT 1 FROM pg_catalog.pg_stat_activity WHERE pid=$3::integer AND backend_start=$4::timestamptz))::text AS control_absent`,
        [pgText(targetId.pid, 23), pgText(targetId.birth), pgText(controlId.pid, 23), pgText(controlId.birth)]))
        assert.equal(rows.length, 1)
        assert.ok(['true', 'false'].includes(rows[0]!.target_absent ?? ''))
        assert.ok(['true', 'false'].includes(rows[0]!.control_absent ?? ''))
        call.targetAbsent = rows[0]!.target_absent === 'true'; call.controlAbsent = rows[0]!.control_absent === 'true'
        if (call.targetAbsent && call.controlAbsent) return
        if (attempt < 19) await own(call, lifetime.wait(10))
      }
      throw Error('ma1 both per-call backends must disappear before settlement')
    })
  }
  const executor: Ma1MethodSqlExecutor = {
    async readCurrent(input, requestSignal) {
      const parsed = readMa1CurrentRequest(input)
      if (!parsed.ok || requestSignal.aborted || poisoned || lifetime.signal.aborted) return { status: 'unavailable' }
      if (active >= MA1_LIMITS.activeReads) { evidence.refusedCapacity++; return { status: 'unavailable' } }
      const request = parsed.value
      const call: Call = { id: ++nextId, promises: [], pending: 0, targetAbsent: false, controlAbsent: false, joined: false }
      contexts.add(call); active++; evidence.admitted++; evidence.active = active; evidence.maxActive = Math.max(evidence.maxActive, active)
      const signal = AbortSignal.any([requestSignal, lifetime.signal, fixtureStop.signal])
      let result: Awaited<ReturnType<Ma1MethodSqlExecutor['readCurrent']>> = { status: 'unavailable' }
      let phase: 'acquisition' | 'read' | 'cleanup' = 'acquisition', primaryFailure: unknown
      const abort = () => {
        if (poisoned || !call.targetId || !call.control || call.cancel) return
        const targetId = call.targetId
        evidence.aborted++
        call.cancel = own(call, call.control.query(
          'SELECT pg_catalog.pg_terminate_backend(a.pid,1000)::text AS terminated FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz',
          [pgText(targetId.pid, 23), pgText(targetId.birth)]).then(rows => {
          assert.ok(rows.every(row => row.terminated === 'true'), 'exact backend cancellation did not complete')
        }))
      }
      const guardBeforeIdentity = () => { if (signal.aborted) throw Error('ma1 abort before identity requires owned stop') }
      try {
        check()
        call.control = await own(call, LocalPgConnection.connect(cluster)); returned.add(call.control)
        if (options.afterAcquisition) await own(call, lifetime.run(() => options.afterAcquisition!('control', call.control!, signal)))
        guardBeforeIdentity(); check()
        await own(call, call.control.query(configureSql)); guardBeforeIdentity(); check()
        const controlRows = await own(call, call.control.query(identitySql))
        call.controlId = identity(options.corruptIdentity === 'control' ? [] : controlRows, cluster.user, cluster.user)
        check()
        if (!signal.aborted) {
          call.target = await own(call, LocalPgConnection.connect(cluster, MA1_AUTH.readerLogin)); returned.add(call.target)
          if (options.afterAcquisition) await own(call, lifetime.run(() => options.afterAcquisition!('target', call.target!, signal)))
          guardBeforeIdentity(); check()
          // Capture genuine-login birth before NOINHERIT SET ROLE hides it.
          const targetRows = await own(call, call.target.query(identitySql))
          call.targetId = identity(options.corruptIdentity === 'target' ? [] : targetRows, MA1_AUTH.readerLogin, MA1_AUTH.readerLogin)
          check()
          signal.addEventListener('abort', abort, { once: true })
          if (signal.aborted) abort()
          else {
            const assigned = await own(call, call.target.query('SET ROLE ot_v3_method_reader; SELECT pg_catalog.pg_backend_pid()::text AS pid,session_user::text AS session_user,current_user::text AS current_user'))
            assert.deepEqual(assigned, [{ pid: call.targetId.pid, session_user: MA1_AUTH.readerLogin, current_user: 'ot_v3_method_reader' }])
            check()
            if (!signal.aborted) {
              phase = 'read'; evidence.dispatched++
              const rows = await own(call, call.target.query(MA1_READ_CURRENT_SQL,
                [pgText(request.methodId), pgText(String(request.revision), 23), pgText(request.methodDigest), pgText(request.packageDigest), pgText(request.checkedAt)]))
              if (!signal.aborted && !poisoned) result = { status: 'rows', rows }
            }
          }
        }
      } catch (error) {
        if (error instanceof LocalPgError) evidence.sqlCodes.push(error.code)
        if (phase !== 'read') primaryFailure = error
      } finally {
        signal.removeEventListener('abort', abort)
        phase = 'cleanup'
        try {
          await call.cancel
          if (primaryFailure || poisoned) throw primaryFailure ?? poisoned
          // Aborted after control identity but before target acquisition owns only control.
          // The full normal proof needs both identities; stop is the conservative failure path.
          if (!call.controlId || !call.targetId) throw Error('ma1 incomplete per-call identity requires owned stop')
          if (options.beforeDrain) await own(call, lifetime.run(() => options.beforeDrain!(
            { control: call.controlId!, target: call.targetId! }, signal)))
          close(call.target); close(call.control)
          await proveBothAbsent(call)
          await Promise.allSettled(call.promises)
          assert.equal(call.pending, 0); call.joined = true
          check(); evidence.drained++
        } catch (error) {
          primaryFailure = fail(error)
          close(call.target); close(call.control)
          // Only primitive promises: never this executor/adapter or the lifetime's own teardown.
          await lifetime.drain(call.promises)
          call.joined = call.pending === 0
          assert.ok(stopped && call.joined, 'failed call needs actual owned-stop and primitive joins')
        } finally {
          evidence.calls.push(Object.freeze({ id: call.id, control: call.controlId ?? null, target: call.targetId ?? null,
            targetAbsent: call.targetAbsent, controlAbsent: call.controlAbsent, joined: call.joined,
            pending: call.pending, stoppedFailure: Boolean(primaryFailure) && stopped }))
          contexts.delete(call); active--; evidence.active = active
        }
      }
      if (primaryFailure) throw primaryFailure
      if (signal.aborted || poisoned || lifetime.signal.aborted) return { status: 'unavailable' }
      return result
    },
  }
  return Object.freeze({ executor, evidence,
    activeIdentities() { return [...contexts].filter(call => call.controlId && call.targetId).map(call =>
      Object.freeze({ id: call.id, control: call.controlId!, target: call.targetId! })) },
    assertHealthy() { check(); assert.equal(active, 0); assert.equal(contexts.size, 0)
      assert.equal(evidence.cleanupRunning, 0); assert.equal(evidence.cleanupWaiting, 0) },
    closeObserver() { releaseOnStop(); close(stableObserver) },
  })
}
