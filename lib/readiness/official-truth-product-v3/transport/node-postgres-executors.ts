// Fixed V3 PostgreSQL ports. No route, caller connection, generic SQL or role picker.
import 'server-only'
import { performance } from 'node:perf_hooks'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { readMa1CurrentRequest, readMa1FixedBinding, type Ma1CurrentRequest } from '../method/contract'
import { MA1_READ_CURRENT_SQL, type Ma1MethodSqlExecutor } from '../method/authority-postgres'
import { type V3IntakeSqlExecutor } from '../storage/quarantine-postgres'
import { readV3IntakeBinding } from '../storage/intake-contract'
import { type M04FixedRequest, type M04TerminalExecutor } from '../jobs/contract'
import { HRS1_FIELDS, HRS1_SQL, hrs1Channel, hrs1Data, type Hrs1FixedRequest,
  type Hrs1Operation, type Hrs1TerminalExecutor } from '../result/contract'
import { V3_PG_LOGINS, type V3PgLogin } from './node-postgres-selection'
import { openOwnedV3PgPair, type PgOwnedPair, type PgOwnedRows, type PgOwnedSession } from './node-postgres-owned-session'

const EFFECT_MS = 5000, CLEANUP_MS = 5000
const S1 = Object.freeze([
  'SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result',
  'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
  'SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
  'SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
])
const M04_SQL = `SELECT official_v3_jobs_api.execute_v1(
  $1::text,$2::text,$3::integer,$4::text,
  $5::text,NULLIF($6::text,'')::integer,$7::integer,$8::text) AS result`
const M04_OPERATIONS = ['queue_read','queue_confirm','queue_cas','execution_read','execution_start','execution_prepare'] as const
const PUBLIC_READS = ['coverage','projection','projection_current','projection_batch','ch_de_snapshot'] as const
const IDENTITY_SQL = `SELECT a.pid::text AS pid,a.backend_start::text AS birth,
 session_user::text AS login,current_user::text AS role,a.datid::text AS db_oid,a.usesysid::text AS login_oid,
 a.application_name::text AS application_name,(s.ssl IS TRUE)::text AS backend_tls,
 (current_setting('server_version_num')::integer/10000)::text AS server_major,
 (r.rolsuper OR r.rolinherit OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls)::text AS privileged,
 r.rolcanlogin::text AS can_login,r.rolconnlimit::text AS connection_limit,
 (r.rolvaliduntil IS NULL)::text AS unbounded_validity,a.xact_start::text AS transaction
 FROM pg_catalog.pg_stat_activity a JOIN pg_catalog.pg_roles r ON r.oid=a.usesysid
 LEFT JOIN pg_catalog.pg_stat_ssl s ON s.pid=a.pid WHERE a.pid=pg_catalog.pg_backend_pid()`
const IDENTITY_FIELDS = ['pid','birth','login','role','db_oid','login_oid','application_name','backend_tls',
  'server_major','privileged','can_login','connection_limit','unbounded_validity','transaction'] as const
const GUARD_INFO_SQL = `SELECT a.backend_start::text AS birth,a.xact_start::text AS transaction,
 pg_catalog.to_char(pg_catalog.clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS observed_at
 FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz
 AND a.usesysid=$3::oid AND a.datid=$4::oid AND a.application_name=$5::text`
// Sleep against one absolute DB cutoff. The activity argument forces its fresh
// lookup after the sleep; matching the original xact excludes a later session
// transaction. Positive pg_terminate_backend timeout waits for actual exit.
const GUARD_SQL = `SELECT pg_catalog.pg_terminate_backend(a.pid,1000)::text AS terminated
 FROM pg_catalog.pg_stat_get_activity($1::integer+pg_catalog.length(pg_catalog.pg_sleep(
 GREATEST(0::double precision,EXTRACT(epoch FROM ($6::timestamptz-pg_catalog.clock_timestamp()))::double precision))::text)) a
 WHERE a.backend_start=$2::timestamptz AND a.xact_start=$3::timestamptz
 AND a.usesysid=$4::oid AND a.datid=$5::oid`
const CLEAR_SNAPSHOT_SQL = 'SELECT pg_catalog.pg_stat_clear_snapshot()::text AS cleared'
const GUARD_ARMED_SQL = `SELECT (a.state='active' AND a.wait_event='PgSleep' AND a.query=$6::text)::text AS armed
 FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz
 AND a.usesysid=$3::oid AND a.datid=$4::oid AND a.application_name=$5::text`
const CANCEL_GUARD_SQL = `SELECT pg_catalog.pg_cancel_backend(a.pid)::text AS sent
 FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz
 AND a.usesysid=$3::oid AND a.datid=$4::oid AND a.application_name=$5::text AND a.query=$6::text`
const TERMINATE_SQL = `SELECT pg_catalog.pg_terminate_backend(a.pid,1000)::text AS terminated
 FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz
 AND a.usesysid=$3::oid AND a.datid=$4::oid`
const ABSENCE_SQL = `SELECT (NOT EXISTS(SELECT 1 FROM pg_catalog.pg_stat_get_activity($1::integer) a
 WHERE a.backend_start=$2::timestamptz AND a.usesysid=$3::oid AND a.datid=$4::oid))::text AS absent`
const TIMEOUT_SQL = `SELECT pg_catalog.set_config('statement_timeout',$1::text,true) AS statement_timeout,
 pg_catalog.set_config('lock_timeout',$1::text,true) AS lock_timeout,
 pg_catalog.set_config('idle_in_transaction_session_timeout',$1::text,true) AS idle_timeout`
const ROLE_SQL = 'SELECT session_user::text AS login,current_user::text AS role,pg_catalog.pg_backend_pid()::text AS pid'
type Identity = Readonly<{ pid: string; birth: string; loginOid: string; databaseOid: string; applicationName: string }>
type Phase = 'idle' | 'acquiring' | 'identified' | 'guarded' | 'effect' | 'commit_sent' | 'draining' | 'blocked_terminal'
type Reply = Readonly<{ status: 'acknowledged'; rows: PgOwnedRows }>
  | Readonly<{ status: 'unavailable' | 'unconfirmed' | 'blocked_remote_unknown' }>
type Fixed = Readonly<{ statement: string; deadline: number; notAfter: string; fields: readonly string[];
  parameters(remaining: number): readonly (string | number | null)[] }>
const phases: Record<V3PgLogin, Phase> = { method: 'idle', intake: 'idle', jobs: 'idle', writer: 'idle', reader: 'idle', verifier: 'idle' }
const utf8 = (v: unknown, limit: number): v is string => typeof v === 'string' && !v.includes('\u0000') && Buffer.byteLength(v) <= limit
const hex = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v)
const integer = (v: unknown, min = 1, max = 2_147_483_647): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
function instant(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)
    && Number.isFinite(Date.parse(v)) && new Date(Date.parse(v)).toISOString() === v
}
function row(rows: PgOwnedRows, keys: readonly string[]) { return rows.length === 1 ? ownRecord(rows[0], keys) : null }
function checkedIdentity(rows: PgOwnedRows, kind: V3PgLogin, session: PgOwnedSession): Identity | null {
  const value = row(rows, IDENTITY_FIELDS), login = V3_PG_LOGINS[kind].login
  if (!value || value.login !== login || value.role !== login || value.application_name !== session.applicationName
    || value.backend_tls !== 'true' || value.server_major !== '17' || value.privileged !== 'false'
    || value.can_login !== 'true' || value.connection_limit !== '2' || value.unbounded_validity !== 'true'
    || typeof value.pid !== 'string' || !/^[1-9][0-9]{0,9}$/.test(value.pid)
    || typeof value.birth !== 'string' || value.birth.length < 19 || value.birth.length > 64
    || typeof value.db_oid !== 'string' || !/^[1-9][0-9]{0,9}$/.test(value.db_oid)
    || typeof value.login_oid !== 'string' || !/^[1-9][0-9]{0,9}$/.test(value.login_oid)) return null
  return Object.freeze({ pid: value.pid, birth: value.birth, loginOid: value.login_oid,
    databaseOid: value.db_oid, applicationName: session.applicationName })
}
const identityParameters = (id: Identity) => [id.pid, id.birth, id.loginOid, id.databaseOid, id.applicationName] as const
const immutableIdentityParameters = (id: Identity) => [id.pid, id.birth, id.loginOid, id.databaseOid] as const
const sameIdentity = (a: Identity, b: Identity) => a.pid === b.pid && a.birth === b.birth && a.loginOid === b.loginOid
  && a.databaseOid === b.databaseOid && a.applicationName === b.applicationName
const pause = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds))
function cutoffFromDb(observed: unknown, notAfter: string, deadline: number, receivedAt: number): string | null {
  if (typeof observed !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/.test(observed)) return null
  const truncated = observed.slice(0, 23) + 'Z'
  if (!instant(truncated)) return null
  // Receipt occurs after DB observation. Flooring and two milliseconds only
  // shorten the cap. Later guard acquisition never starts another time budget.
  const until = Math.floor(Math.min(Date.parse(notAfter), Date.parse(truncated) + deadline - receivedAt - 2))
  return until > Date.parse(truncated) ? new Date(until).toISOString().replace('Z', '000Z') : null
}

async function execute(kind: V3PgLogin, fixed: Fixed, signal: AbortSignal): Promise<Reply> {
  if (phases[kind] === 'blocked_terminal') return { status: 'blocked_remote_unknown' }
  if (signal.aborted || phases[kind] !== 'idle' || performance.now() >= fixed.deadline) return { status: 'unavailable' }
  phases[kind] = 'acquiring' // Both physical slots reserved atomically; no waiting queue.
  const cleanupDeadline = fixed.deadline + CLEANUP_MS
  let pair: PgOwnedPair | null = null, workId: Identity | null = null, controlId: Identity | null = null
  let began = false, dispatched = false, committed = false, guardFinished = false, disarming = false, protectionFailed = false
  let guard: Promise<boolean> | null = null, timer: ReturnType<typeof setTimeout> | null = null
  let result: Reply = { status: 'unavailable' }, targetAbsent = false, controlSettled = false, locallySettled = false
  const abort = () => { pair?.work.forceLocalClose() }
  function check() {
    if (signal.aborted || performance.now() >= fixed.deadline || protectionFailed) throw Error('pg_fixed_bound')
  }
  function remaining() { check(); const n = Math.floor(fixed.deadline - performance.now()); if (n < 1) throw Error('pg_fixed_bound'); return n }
  try {
    pair = await openOwnedV3PgPair(kind, fixed.deadline, cleanupDeadline, signal)
    if (!pair) return result
    signal.addEventListener('abort', abort, { once: true })
    timer = setTimeout(abort, Math.max(0, fixed.deadline - performance.now()))
    check()
    controlId = checkedIdentity((await pair.control.query(IDENTITY_SQL)).rows, kind, pair.control)
    workId = checkedIdentity((await pair.work.query(IDENTITY_SQL)).rows, kind, pair.work)
    if (!controlId || !workId || controlId.pid === workId.pid || controlId.databaseOid !== workId.databaseOid
      || controlId.loginOid !== workId.loginOid) throw Error('pg_fixed_identity')
    phases[kind] = 'identified'
    check()
    const begun = await pair.work.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    began = begun.command === 'BEGIN' && begun.ready === 'T'
    if (!began) throw Error('pg_fixed_begin')
    const inTransaction = checkedIdentity((await pair.work.query(IDENTITY_SQL)).rows, kind, pair.work)
    if (!inTransaction || !sameIdentity(workId, inTransaction)) throw Error('pg_session_backend_changed')
    const info = await pair.control.query(GUARD_INFO_SQL, identityParameters(workId))
    const receivedAt = performance.now(), value = row(info.rows, ['birth','transaction','observed_at'])
    if (!value || value.birth !== workId.birth || typeof value.transaction !== 'string' || value.transaction.length > 64) throw Error('pg_fixed_transaction')
    const cutoff = cutoffFromDb(value.observed_at, fixed.notAfter, fixed.deadline, receivedAt)
    if (!cutoff) throw Error('pg_fixed_cutoff')
    const target = pair.work
    guard = pair.control.query(GUARD_SQL, [workId.pid, workId.birth, value.transaction,
      workId.loginOid, workId.databaseOid, cutoff]).then(reply => {
        guardFinished = true
        if (!disarming && !committed) { protectionFailed = true; target.forceLocalClose() }
        return reply.ready === 'I' && reply.rows.every(r => ownRecord(r, ['terminated'])?.terminated === 'true')
      }, () => {
        guardFinished = true
        if (!disarming && !committed) { protectionFailed = true; target.forceLocalClose() }
        return false
      })
    let armed = false
    for (let attempt = 0; attempt < 20; attempt++) {
      check()
      if (guardFinished) break
      await pair.work.query(CLEAR_SNAPSHOT_SQL)
      const found = await pair.work.query(GUARD_ARMED_SQL, [...identityParameters(controlId), GUARD_SQL])
      if (row(found.rows, ['armed'])?.armed === 'true') { armed = true; break }
      if (attempt < 19) await pause(Math.min(10, remaining()))
    }
    check()
    if (!armed || guardFinished) throw Error('pg_fixed_guard_not_armed')
    phases[kind] = 'guarded'
    const role = V3_PG_LOGINS[kind].setRole
    if (role) await pair.work.query(role)
    const roleRead = row((await pair.work.query(ROLE_SQL)).rows, ['login','role','pid'])
    if (roleRead?.login !== V3_PG_LOGINS[kind].login || roleRead.role !== V3_PG_LOGINS[kind].role || roleRead.pid !== workId.pid) throw Error('pg_fixed_role')
    const bounded = String(remaining())
    await pair.work.query(TIMEOUT_SQL, [bounded])
    const parameters = fixed.parameters(remaining())
    check()
    dispatched = true; phases[kind] = 'effect'
    const reply = await pair.work.query(fixed.statement, parameters)
    if (reply.command !== 'SELECT' || reply.ready !== 'T' || !row(reply.rows, fixed.fields)) throw Error('pg_fixed_reply')
    // Same original minimum after all acquisition, arming, role and effect work.
    // No renewed relative COMMIT budget; the DB watchdog is still armed.
    await pair.work.query(TIMEOUT_SQL, [String(remaining())])
    check()
    if (guardFinished) throw Error('pg_fixed_guard_lost')
    phases[kind] = 'commit_sent'
    const acknowledgement = await pair.work.query('COMMIT')
    committed = acknowledgement.command === 'COMMIT' && acknowledgement.ready === 'I'
    if (!committed) throw Error('pg_fixed_commit_unconfirmed')
    check()
    result = { status: 'acknowledged', rows: reply.rows }
  } catch { result = { status: dispatched ? 'unconfirmed' : 'unavailable' } }
  finally {
    if (timer) clearTimeout(timer)
    signal.removeEventListener('abort', abort)
    if (pair) {
      phases[kind] = 'draining'
      disarming = true
      try {
      // ROLLBACK is attempted only on the owned, now-settled working client.
      // Its failure is not a rollback claim; exact remote termination remains required.
      if (began && !committed && pair.work.alive()) {
        try { await pair.work.query('ROLLBACK') } catch { pair.work.forceLocalClose() }
      }
      if (guard && !guardFinished && controlId && pair.work.alive() && pair.work.idleAcknowledged()) {
        try { await pair.work.query(CANCEL_GUARD_SQL, [...identityParameters(controlId), GUARD_SQL]) } catch { pair.work.forceLocalClose() }
      }
      // Cancel(true) is deliberately not used as evidence. The actual guard
      // promise includes ErrorResponse/ReadyForQuery or local connection end.
      if (guard) await guard
      await pair.work.closeLocal()
      if (workId && pair.control.alive() && pair.control.idleAcknowledged()) {
        let terminationAttempted = false
        for (let attempt = 0; attempt < 40 && performance.now() < cleanupDeadline; attempt++) {
          try {
            await pair.control.query(CLEAR_SNAPSHOT_SQL)
            const absent = await pair.control.query(ABSENCE_SQL, immutableIdentityParameters(workId))
            if (row(absent.rows, ['absent'])?.absent === 'true') { targetAbsent = true; break }
            if (!terminationAttempted) {
              terminationAttempted = true
              // Same narrow LOGIN, exact pre-SET-ROLE identity. Never a bare PID,
              // a superuser control credential or a newly acquired spare client.
              await pair.control.query(TERMINATE_SQL, immutableIdentityParameters(workId))
            }
          } catch { break }
          await pause(Math.min(10, Math.max(0, cleanupDeadline - performance.now())))
        }
      }
      controlSettled = pair.control.idleAcknowledged()
      await pair.closeLocal()
      locallySettled = true
      if (!workId && !began && pair.work.idleAcknowledged()) targetAbsent = true
      } catch {
        // Retain the lane on any unexpected local cleanup failure too. A thrown
        // cleanup callback cannot become the executor's terminal settlement.
        targetAbsent = false; controlSettled = false
        pair.work.forceLocalClose(); pair.control.forceLocalClose()
        const joined = await Promise.allSettled([guard, pair.work.closeLocal(), pair.control.closeLocal()])
        locallySettled = joined[1]!.status === 'fulfilled' && joined[2]!.status === 'fulfilled'
      }
      if (!targetAbsent || !controlSettled || !locallySettled) {
        phases[kind] = 'blocked_terminal'
        // This explicit negative is NOT a remote terminal/rollback/commit receipt.
        // Both physical slots remain poisoned. No reconnect, replay or reuse.
        // A local timeout alone cannot establish even the local join below.
        if (!locallySettled) await new Promise<never>(() => {})
        result = { status: 'blocked_remote_unknown' }
      }
    }
    if (phases[kind] !== 'blocked_terminal') phases[kind] = 'idle'
  }
  return result.status === 'acknowledged' && (signal.aborted || performance.now() >= fixed.deadline || protectionFailed)
    ? { status: 'unconfirmed' } : result
}

function scalarParameters(raw: unknown, count: number): readonly (string | number)[] | null {
  if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype || raw.length !== count
    || Reflect.ownKeys(raw).length !== count + 1) return null
  const values: (string | number)[] = []
  for (let i = 0; i < count; i++) {
    const d = Object.getOwnPropertyDescriptor(raw, String(i))
    if (!d || !('value' in d) || !d.enumerable || !(utf8(d.value, 524_288) || integer(d.value))) return null
    values.push(d.value as string | number)
  }
  return Object.freeze(values)
}
function sharedCap(raw: unknown): Readonly<{ deadline: number; notAfter: string }> | null {
  const budget = ownRecord(raw, ['deadline']), now = performance.now()
  if (!budget || typeof budget.deadline !== 'number' || !Number.isFinite(budget.deadline)) return null
  const deadline = Math.min(budget.deadline, now + EFFECT_MS), remaining = Math.floor(deadline - now)
  if (remaining < 1) return null
  // Snapshot the numeric cap. Neither a later caller mutation nor a fresh SQL
  // transaction can renew the original invocation's consumed time allowance.
  return Object.freeze({ deadline, notAfter: new Date(Date.now() + remaining).toISOString() })
}
const method: Ma1MethodSqlExecutor = Object.freeze<Ma1MethodSqlExecutor>({ async readCurrent(raw: Ma1CurrentRequest, signal: AbortSignal,
  budget?: Readonly<{ deadline: number }>) {
  try {
    const request = readMa1CurrentRequest(raw), cap = sharedCap(budget)
    if (!request.ok || !cap) return { status: 'unavailable' }
    const r = request.value
    const result = await execute('method', { statement: MA1_READ_CURRENT_SQL, ...cap,
      fields: ['status','method_id','revision','method_digest','package_digest','epoch','approval_mode','approval_until','observed_at','remaining_ms'],
      parameters: () => [r.methodId, r.revision, r.methodDigest, r.packageDigest, r.checkedAt] }, signal)
    if (result.status === 'blocked_remote_unknown') return { status: 'blocked_remote_unknown' }
    return result.status === 'acknowledged' ? { status: 'rows', rows: result.rows } : { status: 'unavailable' }
  } catch { return { status: 'unavailable' } }
} })
const intake: V3IntakeSqlExecutor = Object.freeze<V3IntakeSqlExecutor>({ async execute(statement, input, signal, budget) {
  try {
    const index = S1.indexOf(statement), count = [3,3,4,7][index], cap = sharedCap(budget)
    if (index < 0 || count === undefined || !cap) return { status: 'unavailable' }
    const params = scalarParameters(input, count)
    if (!params || typeof params[0] !== 'string' || !readV3IntakeBinding(JSON.parse(params[0])).ok
      || (index === 1 ? typeof params[1] !== 'string' || !hex(params[2])
        : !hex(params[1]) || !integer(params[2], 1, 65_536))
      || (index === 2 && !integer(params[3], 1, 900_000))
      || (index === 3 && (!integer(params[3]) || typeof params[4] !== 'string'
        || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(params[4])
        || typeof params[5] !== 'string' || typeof params[6] !== 'string'))) return { status: 'unavailable' }
    return execute('intake', { statement: S1[index]!, ...cap, fields: ['result'], parameters: () => params }, signal)
  } catch { return { status: 'unavailable' } }
} })

function requestParts(raw: unknown, hrs: boolean) {
  const r = ownRecord(raw, hrs ? ['channel','operationText','bindingHash','methodId','revision','methodDigest','packageDigest','epoch','budget','notAfter','legalDate']
    : ['operationText','methodId','revision','methodDigest','packageDigest','epoch','budget','notAfter'])
  if (!r || !utf8(r.operationText, hrs ? 2_097_152 : 262_144) || !instant(r.notAfter)
    || (!integer(r.epoch) && (hrs || r.epoch !== null))) return null
  const binding = readMa1FixedBinding({ methodId: r.methodId, revision: r.revision, methodDigest: r.methodDigest, packageDigest: r.packageDigest })
  const budget = ownRecord(r.budget, ['deadline'])
  if (!binding.ok || !budget || typeof budget.deadline !== 'number' || !Number.isFinite(budget.deadline)) return null
  const deadline = Math.min(budget.deadline, performance.now() + EFFECT_MS)
  if (deadline <= performance.now()) return null
  return { r, binding: binding.value, deadline, operationText: r.operationText, notAfter: r.notAfter, epoch: r.epoch as number | null }
}
const jobs: M04TerminalExecutor = Object.freeze<M04TerminalExecutor>({ async executeFixed(raw: M04FixedRequest, signal: AbortSignal) {
  try {
    const parsed = requestParts(raw, false)
    if (!parsed) return { status: 'unavailable' }
    const command = ownRecord(JSON.parse(parsed.operationText), ['operation','body','phase'])
    if (!command || !M04_OPERATIONS.includes(command.operation as typeof M04_OPERATIONS[number])
      || (command.phase !== 'probe' && command.phase !== 'authorized') || !hrs1Data(command, 262_144)
      || (command.phase === 'probe' ? parsed.epoch !== null : parsed.epoch === null)) return { status: 'unavailable' }
    const b = parsed.binding
    return execute('jobs', { statement: M04_SQL, deadline: parsed.deadline, notAfter: parsed.notAfter,
      fields: ['result'], parameters: remaining => [parsed.operationText, b.methodId, b.revision, b.methodDigest,
        b.packageDigest, parsed.epoch === null ? '' : String(parsed.epoch), remaining, parsed.notAfter] }, signal)
  } catch { return { status: 'unavailable' } }
} })
function hrsExecutor(kind: 'writer' | 'reader' | 'verifier'): Hrs1TerminalExecutor {
  return Object.freeze<Hrs1TerminalExecutor>({ async executeFixed(raw: Hrs1FixedRequest, signal: AbortSignal) {
    try {
      const p = requestParts(raw, true)
      if (!p || !hex(p.r.bindingHash) || typeof p.r.legalDate !== 'string' || !instant(p.r.legalDate + 'T00:00:00.000Z')) return { status: 'unavailable' }
      const command = ownRecord(JSON.parse(p.operationText), ['schema','operation','bindingHash','body'])
      if (!command || command.schema !== 1 || command.bindingHash !== p.r.bindingHash || typeof command.operation !== 'string'
        || !Object.hasOwn(HRS1_FIELDS, command.operation) || !hrs1Data(command)
        || !ownRecord(command.body, HRS1_FIELDS[command.operation as Hrs1Operation])) return { status: 'unavailable' }
      const operation = command.operation as Hrs1Operation, channel = hrs1Channel(operation)
      const isPublicRead = PUBLIC_READS.includes(operation as typeof PUBLIC_READS[number])
      if (p.r.channel !== channel || (kind === 'verifier' ? channel !== 'attest'
        : kind === 'reader' ? channel !== 'read' || !isPublicRead : channel === 'attest' || isPublicRead)) return { status: 'unavailable' }
      const b = p.binding, bindingHash = p.r.bindingHash, legalDate = p.r.legalDate
      return execute(kind, { statement: HRS1_SQL[channel], deadline: p.deadline, notAfter: p.notAfter, fields: ['result'],
        parameters: remaining => [p.operationText, bindingHash, b.methodId, b.revision, b.methodDigest,
          b.packageDigest, p.epoch, remaining, p.notAfter, legalDate] }, signal)
    } catch { return { status: 'unavailable' } }
  } })
}

/** Sole server composition surface. It neither selects a target nor grants method authority. */
export const V3_NODE_POSTGRES_EXECUTORS = Object.freeze({ method, intake, jobs,
  writer: hrsExecutor('writer'), reader: hrsExecutor('reader'), verifier: hrsExecutor('verifier') })

/** Safe server-only health readback. No endpoint, identity, SQL, credential or row content. */
export function readV3NodePostgresTerminalState(): Readonly<Record<V3PgLogin, Phase>> {
  return Object.freeze({ ...phases })
}
