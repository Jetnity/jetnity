// Minimal bounded PostgreSQL extended-query transport for the disposable proof.
// No TCP, DSN, credential, pool, dynamic SQL or runtime application import.
import { createConnection, type Socket } from 'node:net'
import { join } from 'node:path'
import { assertOwnedLocalProofCluster, LOCAL_PG_DEADLINES, LOCAL_PG_STARTUP_OPTIONS, type LocalProofCluster } from './local-cluster'

export type PgParameter = Readonly<{ oid: number; bytes: Uint8Array; binary?: boolean }>
export type PgRows = readonly Readonly<Record<string, string | null>>[]
export class LocalPgError extends Error { constructor(readonly code: string) { super(`local_pg_${code}`) } }
const i16 = (n: number) => { const b = Buffer.alloc(2); b.writeInt16BE(n); return b }
const i32 = (n: number) => { const b = Buffer.alloc(4); b.writeInt32BE(n); return b }
const z = (s: string) => Buffer.from(`${s}\0`)
const packet = (tag: string, payload: Buffer) => Buffer.concat([Buffer.from(tag), i32(payload.length + 4), payload])
export const pgText = (value: string, oid = 25): PgParameter => ({ oid, bytes: Buffer.from(value) })
export const pgBytes = (bytes: Uint8Array): PgParameter => ({ oid: 17, bytes, binary: true })
export function pgCompositeArray(oid: number, elementOid: number, rows: readonly (readonly PgParameter[])[]): PgParameter {
  const parts: Buffer[] = [i32(1), i32(0), i32(elementOid), i32(rows.length), i32(1)]
  for (const row of rows) {
    const fields: Buffer[] = [i32(row.length)]
    for (const field of row) {
      let data = Buffer.from(field.bytes)
      if (field.oid === 20) { data = Buffer.alloc(8); data.writeBigInt64BE(BigInt(Buffer.from(field.bytes).toString())) }
      if (field.oid === 23) data = i32(Number(Buffer.from(field.bytes).toString()))
      fields.push(i32(field.oid), i32(data.length), data)
    }
    const composite = Buffer.concat(fields); parts.push(i32(composite.length), composite)
  }
  return { oid, bytes: Buffer.concat(parts), binary: true }
}
export type LocalPgOperationDiagnostic = Readonly<{
  phase: 'startup' | 'begin' | 'query' | 'commit' | 'rollback'
  elapsedMs: number
  outcome: 'complete' | 'timeout' | 'sql_error' | 'transport_error'
  code: string | null
  commitAcknowledged?: boolean
  protectionFailure?: 'commit_guard_lost' | 'commit_control_failed' | 'commit_disarm_failed'
}>
type CommitDeadline = {
  sent(): void
  completed(): void
  cleanup(): Promise<void>
  failure(): LocalPgOperationDiagnostic['protectionFailure']
}
const diagnosticCode = (error: unknown): string | null => error instanceof LocalPgError
  ? (/^[0-9A-Z]{5}$/.test(error.code) || ['connection_closed','connection_failed','connection_state','authentication_forbidden','response_bound','row_bound','parameter_bound','duplicate_column','column_count'].includes(error.code) ? error.code : 'transport_error') : null
export class LocalPgConnection {
  private buffer: Buffer = Buffer.alloc(0)
  private messages: { tag: string; bytes: Buffer }[] = []
  private waiter: (() => void) | null = null
  private queuedBytes = 0
  private closed = false
  private busy = false
  private timedOut = false
  private backendPid = 0
  private commandTag: string | null = null
  private readonly operations: LocalPgOperationDiagnostic[] = []
  /** Fixed fields only: no SQL, parameter bytes, identities, socket paths or database error text. */
  get operationDiagnostics(): readonly LocalPgOperationDiagnostic[] { return this.operations.slice() }
  private recordOperation(phase: LocalPgOperationDiagnostic['phase'], started: number, error?: unknown, protectionFailure?: LocalPgOperationDiagnostic['protectionFailure']) {
    const code = diagnosticCode(error)
    this.operations.push(Object.freeze({ phase, elapsedMs: Math.ceil(performance.now() - started),
      outcome: this.timedOut ? 'timeout' : error === undefined ? 'complete' : code && /^[0-9A-Z]{5}$/.test(code) ? 'sql_error' : 'transport_error', code,
      ...(phase === 'commit' ? { commitAcknowledged: this.commandTag === 'COMMIT' } : {}),
      ...(protectionFailure ? { protectionFailure } : {}) }))
    if (this.operations.length > 32) this.operations.shift()
  }
  private constructor(private socket: Socket, private cluster: LocalProofCluster) {
    socket.on('data', chunk => {
      if (this.buffer.length + this.queuedBytes + chunk.length > 24 * 1024 * 1024) { this.socket.destroy(); return }
      this.buffer = Buffer.concat([this.buffer, chunk])
      while (this.buffer.length >= 5) {
        const length = this.buffer.readInt32BE(1)
        if (length < 4 || length > 24 * 1024 * 1024) { this.socket.destroy(); return }
        if (this.buffer.length < length + 1) break
        this.queuedBytes += length + 1
        this.messages.push({ tag: this.buffer.subarray(0, 1).toString(), bytes: this.buffer.subarray(5, length + 1) })
        this.buffer = this.buffer.subarray(length + 1)
      }
      this.waiter?.(); this.waiter = null
    })
    socket.on('error', () => { this.closed = true; this.waiter?.(); this.waiter = null })
    socket.on('close', () => { this.closed = true; this.waiter?.(); this.waiter = null })
    socket.setTimeout(30_000, () => { this.timedOut = true; socket.destroy() })
  }
  static async connect(cluster: LocalProofCluster, user = cluster.user): Promise<LocalPgConnection> {
    assertOwnedLocalProofCluster(cluster)
    if (!cluster.socket.startsWith(cluster.root + '/')) throw new LocalPgError('unsafe_socket')
    const socket = createConnection({ path: join(cluster.socket, `.s.PGSQL.${cluster.port}`) })
    const connection = new LocalPgConnection(socket, cluster), started = performance.now()
    let failure: unknown
    try {
      await new Promise<void>((resolve, reject) => {
        const connected = () => { cleanup(); resolve() }
        const failed = () => { cleanup(); reject(new LocalPgError('connection_failed')) }
        const cleanup = () => { socket.off('connect', connected); socket.off('error', failed); socket.off('close', failed) }
        socket.once('connect', connected); socket.once('error', failed); socket.once('close', failed)
      })
      const body = Buffer.concat([i32(196608), z('user'), z(user), z('database'), z(cluster.database), z('client_encoding'), z('UTF8'), z('options'), z(LOCAL_PG_STARTUP_OPTIONS), Buffer.from([0])])
      socket.write(Buffer.concat([i32(body.length + 4), body]))
      await connection.result()
      return connection
    } catch (error) { failure = error; socket.destroy(); throw error }
    finally { socket.setTimeout(0); connection.recordOperation('startup', started, failure) }
  }
  private async message() {
    while (!this.messages.length) {
      if (this.closed) throw new LocalPgError('connection_closed')
      await new Promise<void>(resolve => { this.waiter = resolve })
    }
    const message = this.messages.shift()!
    this.queuedBytes -= message.bytes.length + 5
    return message
  }
  private async result(): Promise<PgRows> {
    const rows: Record<string, string | null>[] = []; let names: string[] = [], failure: LocalPgError | null = null, count = 0
    while (true) {
      const { tag, bytes } = await this.message().catch(error => { throw failure ?? error })
      if (++count > 100_000) throw new LocalPgError('response_bound')
      if (tag === 'R' && bytes.readInt32BE(0) !== 0) throw new LocalPgError('authentication_forbidden')
      if (tag === 'K') this.backendPid = bytes.readInt32BE(0)
      if (tag === 'C') this.commandTag = bytes.subarray(0, bytes.length - 1).toString()
      if (tag === 'E') {
        let offset = 0, code = 'query_failed'
        while (offset < bytes.length && bytes[offset]) { const field = String.fromCharCode(bytes[offset++]!); const end = bytes.indexOf(0, offset); if (end < 0) break; if (field === 'C') code = bytes.subarray(offset, end).toString(); offset = end + 1 }
        failure = new LocalPgError(code)
      }
      if (tag === 'T') {
        names = []; let offset = 2
        for (let i = 0; i < bytes.readInt16BE(0); i++) { const end = bytes.indexOf(0, offset); names.push(bytes.subarray(offset, end).toString()); offset = end + 19 }
        if(new Set(names).size!==names.length)throw new LocalPgError('duplicate_column')
      }
      if (tag === 'D') {
        if (rows.length >= 1300) throw new LocalPgError('row_bound')
        if(bytes.readInt16BE(0)!==names.length)throw new LocalPgError('column_count')
        const row: Record<string, string | null> = {}; let offset = 2
        for (let i = 0; i < bytes.readInt16BE(0); i++) { const n = bytes.readInt32BE(offset); offset += 4; row[names[i]!] = n === -1 ? null : bytes.subarray(offset, offset + n).toString(); if (n !== -1) offset += n }
        rows.push(row)
      }
      if (tag === 'Z') { if (failure) throw failure; return rows }
    }
  }
  /** PostgreSQL 15–17 disables statement_timeout before deferred COMMIT work.
   * An independent owned backend therefore arms a fixed deadline before COMMIT.
   * Its sleep is executed by PostgreSQL, not a client timer. PID + backend birth
   * + transaction start prevent cancellation of a reused PID or later work.
   * The installation owner is local test infrastructure, never an application role.
   */
  private async armCommitDeadline(sql: string): Promise<CommitDeadline> {
    const guard = await LocalPgConnection.connect(this.cluster)
    let control: LocalPgConnection | undefined, pending: Promise<void> | undefined, recovery: Promise<void> | undefined
    let armed = false, sent = false, completed = false, disarming = false, finished = false
    let protectionFailure: LocalPgOperationDiagnostic['protectionFailure']
    let guardBirth: string | undefined
    let target: Readonly<Record<string, string | null>> | undefined
    const recover = async () => {
      protectionFailure = 'commit_guard_lost'
      // This connection was established and its fixed backend limit configured
      // BEFORE arming. Never reconnect or act on a bare/reused PID after loss.
      const fallback = setTimeout(() => {
        protectionFailure = 'commit_control_failed'
        control?.socket.destroy(); this.closed = true; this.socket.destroy()
      }, LOCAL_PG_DEADLINES.commitRecoveryMs)
      try {
        const rows = await control!.query('SELECT pg_catalog.pg_terminate_backend(a.pid,1000)::text AS terminated FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz AND a.xact_start=$3::timestamptz AND a.state=\'active\' AND a.query=$4::text',
          [pgText(String(this.backendPid), 23), pgText(target!.birth!), pgText(target!.transaction!), pgText(sql)])
        if (rows.some(row => row.terminated !== 'true')) { protectionFailure = 'commit_control_failed'; this.closed = true; this.socket.destroy() }
        // No matching activity can mean COMMIT already finished. Neither this
        // result nor a successful signal establishes commit/rollback truth.
      } catch { protectionFailure = 'commit_control_failed'; this.closed = true; this.socket.destroy() }
      finally { clearTimeout(fallback) }
    }
    const cleanup = async () => {
      disarming = true
      try {
        await recovery
        if (pending && !finished) {
          // No target command or later work can start until cancel + join ends.
          await control!.query('SELECT pg_catalog.pg_cancel_backend(a.pid) FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz', [pgText(String(guard.backendPid), 23), pgText(guardBirth!)])
        }
        await pending
      } finally { control?.close(); guard.close() }
    }
    try {
      target = (await guard.query('SELECT backend_start::text AS birth,xact_start::text AS transaction FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer', [pgText(String(this.backendPid), 23)]))[0]
      if (!target?.birth || !target.transaction) { guard.close(); return { sent() {}, completed() {}, cleanup: async () => {}, failure: () => undefined } }
      control = await LocalPgConnection.connect(this.cluster)
      await control.query(`SET statement_timeout=${LOCAL_PG_DEADLINES.commitRecoveryStatementMs}`)
      guardBirth = (await control.query('SELECT backend_start::text AS birth FROM pg_catalog.pg_stat_get_activity($1::integer)', [pgText(String(guard.backendPid), 23)]))[0]?.birth ?? undefined
      if (!guardBirth) throw new LocalPgError('commit_deadline_not_armed')
      // pg_sleep returns the empty void text. Using its length in the activity
      // function argument forces the fresh activity lookup AFTER the sleep.
      pending = guard.query('SELECT pg_catalog.pg_terminate_backend(a.pid)::text AS terminated FROM pg_catalog.pg_stat_get_activity($1::integer + pg_catalog.length(pg_catalog.pg_sleep($4::double precision)::text)) a WHERE a.backend_start=$2::timestamptz AND a.xact_start=$3::timestamptz',
        [pgText(String(this.backendPid), 23), pgText(target.birth), pgText(target.transaction), pgText(String(LOCAL_PG_DEADLINES.commitMs / 1000))])
        .then(() => { finished = true }, () => {
          finished = true
          if (!disarming && armed) {
            protectionFailure = 'commit_guard_lost'
            if (sent && !completed) recovery = recover()
          }
        })
      for (let attempt = 0; attempt < 50 && !finished; attempt++) {
        const state = (await control.query('SELECT state,wait_event,backend_start::text AS birth FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer', [pgText(String(guard.backendPid), 23)]))[0]
        if (state?.state === 'active' && state.wait_event === 'PgSleep' && state.birth) { guardBirth = state.birth; armed = true; break }
        await new Promise<void>(resolve => setTimeout(resolve, 20))
      }
      if (!armed || finished) throw new LocalPgError('commit_deadline_not_armed')
      // Cancel and join even after an uncertain target outcome; closing a
      // sleeping socket alone would not release its backend promptly.
      return {
        sent() { if (finished) throw new LocalPgError('commit_deadline_not_armed'); sent = true },
        completed() { completed = true; disarming = true },
        cleanup,
        failure: () => protectionFailure,
      }
    } catch (error) { await cleanup(); throw error }
  }
  async query(sql: string, parameters: readonly PgParameter[] = []): Promise<PgRows> {
    if (this.busy || this.closed) throw new LocalPgError('connection_state')
    if (parameters.reduce((sum, p) => sum + p.bytes.length + 12, Buffer.byteLength(sql)) > 10_485_760) throw new LocalPgError('parameter_bound')
    this.busy = true; this.timedOut = false
    const command = /^(BEGIN|COMMIT|ROLLBACK)\b/i.exec(sql.trim())?.[1]?.toLowerCase()
    const phase: LocalPgOperationDiagnostic['phase'] = command === 'begin' || command === 'commit' || command === 'rollback' ? command : 'query'
    const started = performance.now(); let failure: unknown, deadline: CommitDeadline | undefined
    let cleanupFailure: LocalPgOperationDiagnostic['protectionFailure']
    this.commandTag = null
    // The backend already bounds every statement (including COMMIT), locks and
    // idle transactions. This independent transport fallback is active only
    // during an operation; ordinary idle sessions remain reusable.
    this.socket.setTimeout(30_000)
    try {
      if (phase === 'commit') { deadline = await this.armCommitDeadline(sql); deadline.sent() }
      if (!parameters.length) {const frame=packet('Q',z(sql));if(frame.length>10_485_760)throw new LocalPgError('parameter_bound');this.socket.write(frame)}
      else {
        const parse = Buffer.concat([z(''), z(sql), i16(parameters.length), ...parameters.map(p => i32(p.oid))])
        const bind = Buffer.concat([z(''), z(''), i16(parameters.length), ...parameters.map(p => i16(p.binary ? 1 : 0)), i16(parameters.length), ...parameters.flatMap(p => [i32(p.bytes.length), Buffer.from(p.bytes)]), i16(0)])
        const frame=Buffer.concat([packet('P', parse), packet('B', bind), packet('D', Buffer.concat([Buffer.from('P'), z('')])), packet('E', Buffer.concat([z(''), i32(0)])), packet('S', Buffer.alloc(0))])
        if(frame.length>10_485_760)throw new LocalPgError('parameter_bound')
        this.socket.write(frame)
      }
      return await this.result()
    } catch (error) {
      failure = error
      // CommandComplete(COMMIT) is an actual backend acknowledgement even if
      // ReadyForQuery is lost. Preserve it; fresh readback still verifies bytes.
      if (phase === 'commit' && this.commandTag === 'COMMIT') return []
      throw error
    }
    finally {
      deadline?.completed()
      this.socket.setTimeout(0)
      try { await deadline?.cleanup() } catch { cleanupFailure = 'commit_disarm_failed'; this.closed = true; this.socket.destroy() }
      finally { this.busy = false; this.recordOperation(phase, started, failure, deadline?.failure() ?? cleanupFailure) }
    }
  }
  close() { this.socket.setTimeout(0); this.socket.end(packet('X', Buffer.alloc(0))); this.closed = true }
}
