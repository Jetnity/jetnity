// SOURCE_ONLY at delivery. Run separately with --experimental-test-module-mocks.
// This suite mocks only the private physical pair; it makes no native/SQL claim.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { performance } from 'node:perf_hooks'
import type { PgOwnedPair, PgOwnedReply, PgOwnedSession } from '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-owned-session'
import type { M04FixedRequest } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import type { Hrs1FixedRequest } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { V3_PG_LOGINS, selectedV3PgTarget, type V3PgLogin } from '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-selection'

const SOURCE = new URL('../../../lib/readiness/official-truth-product-v3/transport/', import.meta.url)
const binding = { methodId: 'pg_transport_fixture', revision: 1, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
const signal = () => new AbortController().signal
const wait = (n: number) => new Promise<void>(r => setTimeout(r, n))
const budget = (milliseconds = 1000) => Object.freeze({ deadline: performance.now() + milliseconds })
const intakeStatement = 'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result'
const intakeBinding = { schema: 3, kind: 'proposal_intake_binding', operationId: 'op3_' + '1'.repeat(32),
  jobId: 'job3_' + '2'.repeat(32), contextKey: 'official-truth-context:v3:' + '3'.repeat(64),
  method: { methodId: binding.methodId, revision: 1 }, runnerId: 'runner3_' + '4'.repeat(32),
  deliveryId: 'delivery3_' + '5'.repeat(32), inputRevision: 'snapshot:' + '6'.repeat(64) }
const intakeParameters = [JSON.stringify(intakeBinding), '{"synthetic":true}', '7'.repeat(64)] as const
const resultText = '{ "status" : "recorded", "original" : "  exact text  ", "n" : 9007199254740993, "date" : "2026-11-12 10:00:00.123456+00", "missing" : null }'
function deferred() { let release!: () => void; const pending = new Promise<void>(r => { release = r }); return { pending, release } }
function job(milliseconds = 1000): M04FixedRequest {
  return { ...binding, operationText: '{"body":{},"operation":"queue_read","phase":"authorized"}', epoch: 1,
    budget: { deadline: performance.now() + milliseconds }, notAfter: new Date(Date.now() + milliseconds).toISOString() } as M04FixedRequest
}
function hrs(operation: string, body: Record<string, unknown>, channel: 'read' | 'execute' | 'attest'): Hrs1FixedRequest {
  return { ...binding, channel, bindingHash: 'c'.repeat(64), operationText: JSON.stringify({ schema: 1, operation, bindingHash: 'c'.repeat(64), body }),
    epoch: 1, budget: { deadline: performance.now() + 1000 }, notAfter: new Date(Date.now() + 1000).toISOString(), legalDate: '2026-11-12' } as Hrs1FixedRequest
}
function fakePair(kind: V3PgLogin, options: { closeGate?: ReturnType<typeof deferred>; lostCommit?: boolean; effectGate?: ReturnType<typeof deferred>; commitGate?: ReturnType<typeof deferred>;
  guardFailure?: boolean; noRemoteProof?: boolean; wrongLogin?: boolean } = {}) {
  const calls: { side: string; sql: string; values: readonly unknown[] }[] = []
  let workClosed = false, controlClosed = false, workIdle = true, controlIdle = true, role = V3_PG_LOGINS[kind].login as string
  let commits = 0, effectCalls = 0, guardFinish: ((value: PgOwnedReply) => void) | null = null
  let guardTimer: ReturnType<typeof setTimeout> | null = null
  let rejectedEffect: (() => void) | null = null, rejectedCommit: (() => void) | null = null
  const reply = (rows: readonly Readonly<Record<string, string | null>>[] = [], command = 'SELECT', ready: 'I' | 'T' = 'I'): PgOwnedReply => ({ rows, command, ready })
  function completeGuard() {
    if (guardTimer) { clearTimeout(guardTimer); guardTimer = null }
    controlIdle = true; guardFinish?.(reply([])); guardFinish = null
  }
  function identity(side: 'w' | 'c') { return { pid: side === 'w' ? '101' : '102', birth: '2026-11-12 00:00:00.123456+00',
    login: options.wrongLogin && side === 'w' ? 'postgres' : V3_PG_LOGINS[kind].login,
    role: V3_PG_LOGINS[kind].login, db_oid: '42', login_oid: '401', application_name: `fixture-${kind}-${side}`,
    backend_tls: 'true', server_major: '17', privileged: 'false', can_login: 'true', connection_limit: '2', unbounded_validity: 'true',
    transaction: side === 'w' && !workIdle ? '2026-11-12 00:00:01+00' : null } }
  const work: PgOwnedSession = {
    applicationName: `fixture-${kind}-w`, alive: () => !workClosed, idleAcknowledged: () => workIdle,
    forceLocalClose() { workClosed = true; rejectedEffect?.(); rejectedCommit?.() },
    async closeLocal() { await options.closeGate?.pending; workClosed = true },
    async query(sql, values = []) {
      calls.push({ side: 'work', sql, values })
      if (workClosed) throw Error('closed')
      if (sql.includes('AS server_major')) return reply([identity('w')], 'SELECT', workIdle ? 'I' : 'T')
      if (sql.startsWith('BEGIN')) { workIdle = false; return reply([], 'BEGIN', 'T') }
      if (sql.startsWith('SET LOCAL ROLE ')) { role = V3_PG_LOGINS[kind].role; return reply([], 'SET', 'T') }
      if (sql.includes('AS armed')) return reply([{ armed: 'true' }], 'SELECT', 'T')
      if (sql.includes('current_user::text AS role,pg_catalog')) return reply([{ login: V3_PG_LOGINS[kind].login, role, pid: '101' }], 'SELECT', 'T')
      if (sql.includes('official_v3_')) {
        effectCalls++
        if (options.effectGate) await new Promise<void>((resolve, reject) => {
          rejectedEffect = () => reject(Error('actual local query closed'))
          void options.effectGate!.pending.then(resolve)
        })
        if (workClosed) throw Error('closed')
        if (kind === 'method') return reply([{ status: 'absent', method_id: binding.methodId, revision: null, method_digest: null,
          package_digest: null, epoch: '0', approval_mode: null, approval_until: null,
          observed_at: '2026-11-12 10:00:00.123456+00', remaining_ms: '0' }], 'SELECT', 'T')
        return reply([{ result: resultText }], 'SELECT', 'T')
      }
      if (sql === 'COMMIT') {
        commits++
        if (options.commitGate) await new Promise<void>((resolve, reject) => {
          rejectedCommit = () => reject(Error('actual local COMMIT query closed'))
          void options.commitGate!.pending.then(resolve)
        })
        if (workClosed) throw Error('closed')
        workIdle = true; role = V3_PG_LOGINS[kind].login
        if (options.lostCommit) { workIdle = false; workClosed = true; throw Error('lost COMMIT response') }
        return reply([], 'COMMIT')
      }
      if (sql === 'ROLLBACK') { workIdle = true; role = V3_PG_LOGINS[kind].login; return reply([], 'ROLLBACK') }
      if (sql.includes('pg_cancel_backend')) { completeGuard(); return reply([{ sent: 'true' }]) }
      return reply([], 'SELECT', workIdle ? 'I' : 'T')
    },
  }
  const control: PgOwnedSession = {
    applicationName: `fixture-${kind}-c`, alive: () => !controlClosed, idleAcknowledged: () => controlIdle,
    forceLocalClose() { controlClosed = true; completeGuard() }, async closeLocal() { controlClosed = true },
    async query(sql, values = []) {
      calls.push({ side: 'control', sql, values })
      if (controlClosed) throw Error('closed')
      if (sql.includes('AS server_major')) return reply([identity('c')])
      if (sql.includes('AS observed_at')) return reply([{ birth: identity('w').birth, transaction: '2026-11-12 00:00:01+00',
        observed_at: new Date().toISOString().replace('Z', '000Z') }])
      if (sql.includes('pg_sleep(')) {
        if (options.guardFailure) throw Error('guard refused')
        controlIdle = false
        return new Promise<PgOwnedReply>(resolve => {
          guardFinish = resolve
          guardTimer = setTimeout(completeGuard, Math.max(0, Date.parse(String(values[5])) - Date.now()))
        })
      }
      if (sql.includes('AS absent')) return reply([{ absent: options.noRemoteProof ? 'false' : String(workClosed) }])
      if (sql.includes('pg_terminate_backend')) return reply([{ terminated: options.noRemoteProof ? 'false' : 'true' }])
      return reply([])
    },
  }
  return { pair: { work, control, async closeLocal() { await Promise.all([work.closeLocal(), control.closeLocal()]) } } satisfies PgOwnedPair,
    calls, stats: () => ({ commits, effectCalls, workClosed, controlClosed }), release() { options.effectGate?.release(); options.commitGate?.release(); options.closeGate?.release(); completeGuard() } }
}

test('PG transport offline contracts and reserved terminal ownership', { timeout: 15000 }, async t => {
  assert.equal(selectedV3PgTarget(), null)
  assert.deepEqual(Object.values(V3_PG_LOGINS).map(x => x.login), ['ot_v3_method_transport_login','ot_v3_intake_transport_login',
    'ot_v3_jobs_transport_login','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'])
  let count = 0, options: Parameters<typeof fakePair>[1] = {}, last: ReturnType<typeof fakePair> | null = null
  const acquired: { kind: V3PgLogin; operationDeadline: number; cleanupDeadline: number }[] = []
  t.mock.module(new URL('node-postgres-owned-session.ts', SOURCE), { cache: true, namedExports: {
    async openOwnedV3PgPair(kind: V3PgLogin, operationDeadline: number, cleanupDeadline: number) {
      count++; acquired.push({ kind, operationDeadline, cleanupDeadline }); last = fakePair(kind, options); return last.pair
    },
  } })
  const { V3_NODE_POSTGRES_EXECUTORS: port, readV3NodePostgresTerminalState: state } = await import(
    '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-executors')
  await t.test('fixed statements and channels reject before physical acquisition', async () => {
    assert.deepEqual(await port.intake.execute('SELECT 1', [], signal(), budget()), { status: 'unavailable' })
    assert.deepEqual(await port.intake.execute('SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result ', [], signal(), budget()), { status: 'unavailable' })
    assert.deepEqual(await port.jobs.executeFixed({ ...job(), sql: 'COMMIT' } as M04FixedRequest, signal()), { status: 'unavailable' })
    const malicious = { ...job() }; Object.defineProperty(malicious, 'epoch', { enumerable: true, get() { throw Error('getter invoked') } })
    assert.deepEqual(await port.jobs.executeFixed(malicious, signal()), { status: 'unavailable' })
    assert.deepEqual(await port.verifier.executeFixed(hrs('history', { contextKey: 'x', factKind: 'requirement_effect' }, 'read'), signal()), { status: 'unavailable' })
    assert.deepEqual(await port.reader.executeFixed(hrs('head', { contextKey: 'x', factKind: 'requirement_effect' }, 'read'), signal()), { status: 'unavailable' })
    assert.deepEqual(await port.writer.executeFixed(hrs('coverage', { destinationCountryCode: 'DE', citizenshipCountryCode: 'CH' }, 'read'), signal()), { status: 'unavailable' })
    assert.equal(count, 0)
  })
  await t.test('MA1/S1 require the shared cap before physical acquisition', async () => {
    const request = { ...binding, checkedAt: new Date().toISOString() }
    let getterCalls = 0
    const accessor = Object.defineProperty({}, 'deadline', { enumerable: true, get() { getterCalls++; return performance.now() + 1000 } })
    for (const cap of [undefined, { deadline: NaN }, { deadline: Infinity }, { deadline: -1 },
      { deadline: performance.now() - 1 }, { deadline: performance.now() + 1000, extension: true }, accessor]) {
      assert.deepEqual(await port.method.readCurrent(request, signal(), cap as Readonly<{ deadline: number }> | undefined), { status: 'unavailable' })
      assert.deepEqual(await port.intake.execute(intakeStatement, intakeParameters, signal(), cap as Readonly<{ deadline: number }> | undefined), { status: 'unavailable' })
    }
    assert.equal(getterCalls, 0); assert.equal(count, 0)
  })
  await t.test('one consumed MA1/S1 cap reaches physical acquisition unchanged', async () => {
    const cap = budget(500), request = { ...binding, checkedAt: new Date().toISOString() }
    await wait(10)
    assert.equal((await port.method.readCurrent(request, signal(), cap)).status, 'rows')
    assert.equal(acquired.at(-1)!.operationDeadline, cap.deadline)
    assert.equal((await port.intake.execute(intakeStatement, intakeParameters, signal(), cap)).status, 'acknowledged')
    assert.equal(acquired.at(-1)!.operationDeadline, cap.deadline)
    const expired = budget(5), before = count
    await wait(10)
    assert.deepEqual(await port.intake.execute(intakeStatement, intakeParameters, signal(), expired), { status: 'unavailable' })
    assert.deepEqual(await port.method.readCurrent(request, signal(), expired), { status: 'unavailable' })
    assert.equal(count, before)
  })
  await t.test('S1 cannot renew the shared cap while COMMIT is awaiting its real reply', async () => {
    const commitGate = deferred(); options = { commitGate }
    try {
      const cap = budget(100)
      const pending = port.intake.execute(intakeStatement, intakeParameters, signal(), cap)
      assert.deepEqual(await pending, { status: 'unconfirmed' })
      assert.equal(last!.stats().commits, 1); assert.equal(last!.stats().effectCalls, 1)
      assert.equal(acquired.at(-1)!.operationDeadline, cap.deadline)
      assert.equal(state().intake, 'idle')
    } finally { commitGate.release(); options = {} }
  })
  await t.test('actual COMMIT reply, same narrow controls and exact unchanged text', async () => {
    const result = await port.jobs.executeFixed(job(), signal())
    assert.deepEqual(result, { status: 'acknowledged', rows: [{ result: resultText }] })
    assert.ok(last)
    assert.deepEqual(last.stats(), { commits: 1, effectCalls: 1, workClosed: true, controlClosed: true })
    const idAt = last.calls.findIndex(x => x.side === 'work' && x.sql.includes('AS server_major'))
    const roleAt = last.calls.findIndex(x => x.sql === 'SET LOCAL ROLE ot_v3_jobs_caller')
    const guardAt = last.calls.findIndex(x => x.sql.includes('pg_sleep('))
    const commitAt = last.calls.findIndex(x => x.sql === 'COMMIT')
    assert.ok(idAt >= 0 && guardAt > idAt && roleAt > guardAt && commitAt > roleAt)
    assert.ok(last.calls.filter(x => x.side === 'control').every(x => !x.sql.includes('SET ROLE')))
    assert.equal(state().jobs, 'idle')
  })
  await t.test('lost COMMIT acknowledgement remains unconfirmed without replay', async () => {
    options = { lostCommit: true }
    assert.deepEqual(await port.jobs.executeFixed(job(100), signal()), { status: 'unconfirmed' })
    assert.equal(last!.stats().commits, 1); assert.equal(last!.stats().effectCalls, 1)
    assert.equal(state().jobs, 'idle'); options = {}
  })
  await t.test('local cleanup must finish before either reserved slot is reusable', async () => {
    const closeGate = deferred(); options = { closeGate }
    let resolved = false
    const pending = port.jobs.executeFixed(job(), signal()).then(r => { resolved = true; return r })
    for (let i = 0; i < 100 && state().jobs !== 'draining'; i++) await wait(1)
    assert.equal(state().jobs, 'draining'); assert.equal(resolved, false)
    const before = count
    assert.deepEqual(await port.jobs.executeFixed(job(), signal()), { status: 'unavailable' })
    assert.equal(count, before)
    closeGate.release(); await pending; assert.equal(state().jobs, 'idle'); options = {}
  })
  await t.test('abort joins the effect and watchdog before unconfirmed settlement', async () => {
    const effectGate = deferred(), controller = new AbortController(); options = { effectGate }
    const pending = port.jobs.executeFixed(job(100), controller.signal)
    for (let i = 0; i < 100 && !last?.stats().effectCalls; i++) await wait(1)
    controller.abort()
    assert.deepEqual(await pending, { status: 'unconfirmed' })
    effectGate.release(); assert.equal(last!.stats().commits, 0); assert.equal(state().jobs, 'idle'); options = {}
  })
  await t.test('wrong actual login never reaches a role change or effect', async () => {
    options = { wrongLogin: true }
    assert.deepEqual(await port.jobs.executeFixed(job(), signal()), { status: 'unavailable' })
    assert.equal(last!.stats().effectCalls, 0); options = {}
  })
  await t.test('missing remote proof returns only its explicit negative after local joins', async () => {
    const closeGate = deferred(); options = { noRemoteProof: true, closeGate }
    let settled = false
    const pending = port.verifier.executeFixed(hrs('attest', { kind: 'source', verification: {} }, 'attest'), signal())
    void pending.then(() => { settled = true }, () => { settled = true })
    for (let i = 0; i < 100 && state().verifier !== 'draining'; i++) await wait(1)
    assert.equal(state().verifier, 'draining'); assert.equal(settled, false)
    assert.equal(last!.stats().workClosed, false, 'local work close is still genuinely gated')
    closeGate.release()
    assert.deepEqual(await pending, { status: 'blocked_remote_unknown' })
    for (let i = 0; i < 800 && state().verifier !== 'blocked_terminal'; i++) await wait(1)
    assert.equal(state().verifier, 'blocked_terminal'); assert.equal(settled, true)
    assert.equal(last!.stats().workClosed, true); assert.equal(last!.stats().controlClosed, true)
    const before = count
    assert.deepEqual(await port.verifier.executeFixed(hrs('attest', { kind: 'source', verification: {} }, 'attest'), signal()), { status: 'blocked_remote_unknown' })
    assert.equal(count, before)
    last!.release() // Test owns no real backend or detached timer.
    options = {}
  })
  await t.test('MA1 and S1 preserve the explicit poisoned outcome without another acquisition', async () => {
    options = { noRemoteProof: true }
    const request = { ...binding, checkedAt: new Date().toISOString() }
    assert.deepEqual(await port.method.readCurrent(request, signal(), budget()), { status: 'blocked_remote_unknown' })
    assert.equal(state().method, 'blocked_terminal')
    const methodCount = count
    assert.deepEqual(await port.method.readCurrent(request, signal(), budget()), { status: 'blocked_remote_unknown' })
    assert.equal(count, methodCount)
    assert.deepEqual(await port.intake.execute(intakeStatement, intakeParameters, signal(), budget()), { status: 'blocked_remote_unknown' })
    assert.equal(state().intake, 'blocked_terminal')
    const intakeCount = count
    assert.deepEqual(await port.intake.execute(intakeStatement, intakeParameters, signal(), budget()), { status: 'blocked_remote_unknown' })
    assert.equal(count, intakeCount)
    assert.equal(last!.stats().workClosed, true); assert.equal(last!.stats().controlClosed, true)
    last!.release(); options = {}
  })
})
