// Minimal bounded PostgreSQL extended-query transport for the disposable proof.
// No TCP, DSN, credential, pool, dynamic SQL or runtime application import.
import { createConnection, type Socket } from 'node:net'
import { join } from 'node:path'
import { assertOwnedLocalProofCluster, LOCAL_PG_DEADLINES, LOCAL_PG_STARTUP_OPTIONS, type LocalProofCluster } from './local-cluster'

export type PgParameter = Readonly<{ oid: number; bytes: Uint8Array; binary?: boolean }>
export type PgRows = readonly Readonly<Record<string, string | null>>[]
export type LocalPgGuardDiagnostic = Readonly<{
  guard: string
  statementTag?: 'inline_code_block' | 'hrs1_assert_catalog'
  line?: number
  position?: number
  internalPosition?: number
}>
// Exact source-owned HRS/HMA labels only; never retain raw PostgreSQL message,
// context, detail, hint, internal query, SQL, parameters or catalog/data values.
const P7802_GUARD_LABELS = new Map<string, string>([
  [
    "hma1 exact identity invalid",
    "hma1_identity"
  ],
  [
    "hrs1 exact restrictive roles and automatic edges required",
    "hrs1_guard_01"
  ],
  [
    "hrs1 exact catalog changed",
    "hrs1_guard_02"
  ],
  [
    "hrs1 runtime membership drift",
    "hrs1_guard_03"
  ],
  [
    "hrs1 exact temporary intake SET edge required",
    "hrs1_guard_04"
  ],
  [
    "hrs1 exact function count",
    "hrs1_guard_05"
  ],
  [
    "hrs1 immutable function missing",
    "hrs1_guard_06"
  ],
  [
    "hrs1 exact schema/relation/type count or ownership",
    "hrs1_guard_07"
  ],
  [
    "hrs1 exact namespace ACL",
    "hrs1_guard_08"
  ],
  [
    "hrs1 forbidden ambient schema/database rights",
    "hrs1_guard_09"
  ],
  [
    "hrs1 extra or missing table column",
    "hrs1_guard_10"
  ],
  [
    "hrs1 exact unique index metadata",
    "hrs1_guard_11"
  ],
  [
    "hrs1 unknown dependency/ownership/label/extension",
    "hrs1_guard_12"
  ],
  [
    "hrs1 exact new database CONNECT ACL",
    "hrs1_guard_13"
  ],
  [
    "hrs1 final catalog differs after temporary rights removal",
    "hrs1_guard_14"
  ],
  [
    "hrs1 final role topology differs",
    "hrs1_guard_15"
  ],
  [
    "hrs1 original intake role topology differs",
    "hrs1_guard_16"
  ]
])
const P7802_FUNCTIONS = [
  "exact_keys_v1",
  "nodes_v1",
  "canonical_v1",
  "civil_date_v1",
  "timestamp_v1",
  "predicate_v1",
  "expression_v1",
  "context_v1",
  "subject_v1",
  "reference_v1",
  "safe_data_v1",
  "unique_json_v1",
  "proposal_shape_v1",
  "data_nodes_v1",
  "shape_matches_v1",
  "proposal_retainable_v1",
  "validate_s1_copy_v1",
  "immutable_v1",
  "hash_v1",
  "ref_v1",
  "time_text_v1",
  "s1_shape_v1",
  "record_shape_v1",
  "binding_valid_v1",
  "catalog_v1",
  "assert_catalog_v1",
  "selected_binding_v1",
  "state_v1",
  "assert_history_v1",
  "original_v1",
  "observations_v1",
  "verification_v1",
  "fence_v1",
  "keep_original_v1",
  "attest_v1",
  "consume_s1_v1",
  "keep_decision_v1",
  "prepared_v1",
  "transition_v1",
  "publication_v1",
  "escalation_v1",
  "projection_binding_v1",
  "current_projection_v1",
  "plan_v1",
  "plan_current_v1",
  "suppress_v1",
  "monitor_claim_v1",
  "monitor_finish_v1",
  "command_v1",
  "dispatch_v1",
  "execute_v1",
  "read_v1",
  "ma1_require_current_locked_v1",
  "s1_read_locked_v1"
] as const
const P7802_COLUMNS = [
  "binding_v1.singleton",
  "binding_v1.binding",
  "binding_v1.binding_hash",
  "binding_v1.creator_oid",
  "binding_v1.catalog",
  "originals_v1.version_id",
  "originals_v1.evidence",
  "originals_v1.body_text",
  "originals_v1.raw_digest",
  "extractions_v1.version_id",
  "extractions_v1.record",
  "qualifications_v1.reference",
  "qualifications_v1.kind",
  "qualifications_v1.record",
  "qualifications_v1.digest",
  "qualifications_v1.decision_ref",
  "qualifications_v1.decision_content_key",
  "qualifications_v1.valid_until",
  "qualifications_v1.original_ids",
  "decisions_v1.reference",
  "decisions_v1.predecessor_ref",
  "decisions_v1.record",
  "decisions_v1.archive_ref",
  "decisions_v1.verification_ref",
  "archive_pages_v1.reference",
  "archive_pages_v1.predecessor_ref",
  "archive_pages_v1.revision",
  "archive_pages_v1.record",
  "versions_v1.reference",
  "versions_v1.revision",
  "versions_v1.predecessor_ref",
  "versions_v1.decision_ref",
  "versions_v1.verification_ref",
  "versions_v1.prepared",
  "versions_v1.committed_at",
  "projections_v1.reference",
  "projections_v1.version_ref",
  "projections_v1.verification_ref",
  "projections_v1.record",
  "projections_v1.suppression_epoch",
  "projections_v1.published_at",
  "heads_v1.singleton",
  "heads_v1.context_key",
  "heads_v1.version_ref",
  "heads_v1.decision_ref",
  "heads_v1.sticky_decision_ref",
  "heads_v1.projection_ref",
  "heads_v1.suppression",
  "heads_v1.suppression_epoch",
  "heads_v1.generation",
  "heads_v1.coverage",
  "operations_v1.operation_kind",
  "operations_v1.operation_id",
  "operations_v1.operation_key",
  "operations_v1.command_digest",
  "operations_v1.command",
  "operations_v1.result",
  "operations_v1.head_generation",
  "operations_v1.recorded_at",
  "outbox_v1.escalation_key",
  "outbox_v1.decision_ref",
  "outbox_v1.operation_kind",
  "outbox_v1.operation_id",
  "outbox_v1.record",
  "outbox_v1.recorded_at",
  "monitor_schedule_v1.singleton",
  "monitor_schedule_v1.generation",
  "monitor_schedule_v1.claimed_by",
  "monitor_schedule_v1.claim_operation",
  "monitor_schedule_v1.next_check_at",
  "monitor_schedule_v1.lease_until",
  "monitor_schedule_v1.outcomes",
  "monitor_schedule_v1.finish_operation"
] as const
const P7802_TABLES = [
  "binding_v1",
  "originals_v1",
  "extractions_v1",
  "qualifications_v1",
  "decisions_v1",
  "archive_pages_v1",
  "versions_v1",
  "projections_v1",
  "heads_v1",
  "operations_v1",
  "outbox_v1",
  "monitor_schedule_v1"
] as const
for (const name of P7802_FUNCTIONS) {
  P7802_GUARD_LABELS.set('hrs1 exact function declaration or ACL: ' + name, 'hrs1_function_declaration:' + name)
  P7802_GUARD_LABELS.set('hrs1 exact function dependencies: ' + name, 'hrs1_function_dependencies:' + name)
}
for (const name of P7802_COLUMNS) P7802_GUARD_LABELS.set('hrs1 exact selected column: ' + name, 'hrs1_column:' + name)
for (const name of P7802_TABLES) {
  P7802_GUARD_LABELS.set('hrs1 exact constraint: ' + name, 'hrs1_constraint:' + name)
  P7802_GUARD_LABELS.set('hrs1 exact table ACL/RLS/immutability: ' + name, 'hrs1_table_boundary:' + name)
}
function readP7802GuardDiagnostic(code: string, message?: string, context?: string, position?: string, internalPosition?: string): LocalPgGuardDiagnostic | undefined {
  if (code !== 'P7802') return undefined
  const guard = P7802_GUARD_LABELS.get(message ?? '')
  if (!guard) return undefined
  const numericPosition = (value: string | undefined): number | undefined => value !== undefined
    && /^[1-9][0-9]{0,7}$/.test(value) && Number(value) <= 10_485_760 ? Number(value) : undefined
  const match = context?.match(/^PL\/pgSQL function (inline_code_block|official_v3_result_private\.assert_catalog_v1\(\)) line ([1-9][0-9]{0,5}) at RAISE$/m)
  const at = numericPosition(position), internalAt = numericPosition(internalPosition)
  return Object.freeze({ guard,
    ...(match ? { statementTag: match[1] === 'inline_code_block' ? 'inline_code_block' as const : 'hrs1_assert_catalog' as const, line: Number(match[2]) } : {}),
    ...(at === undefined ? {} : { position: at }),
    ...(internalAt === undefined ? {} : { internalPosition: internalAt }),
  })
}
const localPgGuardDiagnostics = new WeakMap<LocalPgError, LocalPgGuardDiagnostic>()
export class LocalPgError extends Error {
  constructor(readonly code: string) { super(`local_pg_${code}`) }
  get guardDiagnostic(): LocalPgGuardDiagnostic | undefined { return localPgGuardDiagnostics.get(this) }
}
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
  commitDispatched?: boolean
  protectionFailure?: 'commit_guard_lost' | 'commit_control_failed' | 'commit_disarm_failed'
}>
/** Only the new bounded COMMIT path reports dispatch separately from ACK. */
export type LocalPgBoundedCommit = Readonly<{
  dispatched: boolean; acknowledged: boolean; code: string | null;
  protectionFailure?: LocalPgOperationDiagnostic['protectionFailure'];
}>
type CommitBound = Readonly<{ deadlineAt: number; databaseCutoff: string }>
type CommitDeadline = {
  sent(): void
  completed(): void
  cleanup(): Promise<void>
  failure(): LocalPgOperationDiagnostic['protectionFailure']
}
const diagnosticCode = (error: unknown): string | null => error instanceof LocalPgError
  ? (/^[0-9A-Z]{5}$/.test(error.code) || ['connection_closed','connection_failed','connection_state','authentication_forbidden','response_bound','row_bound','parameter_bound','duplicate_column','column_count','commit_deadline_not_armed','commit_bound_elapsed'].includes(error.code) ? error.code : 'transport_error') : null
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
  private recordOperation(phase: LocalPgOperationDiagnostic['phase'], started: number, error?: unknown, protectionFailure?: LocalPgOperationDiagnostic['protectionFailure'], dispatched?: boolean) {
    const code = diagnosticCode(error)
    this.operations.push(Object.freeze({ phase, elapsedMs: Math.ceil(performance.now() - started),
      outcome: this.timedOut ? 'timeout' : error === undefined ? 'complete' : code && /^[0-9A-Z]{5}$/.test(code) ? 'sql_error' : 'transport_error', code,
      ...(phase === 'commit' ? { commitAcknowledged: this.commandTag === 'COMMIT' } : {}),
      ...(dispatched === undefined ? {} : { commitDispatched: dispatched }),
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
        let guardMessage: string | undefined, guardContext: string | undefined, position: string | undefined, internalPosition: string | undefined
        const diagnosticFields = new Set<string>(); let repeatedDiagnosticField = false
        while (offset < bytes.length && bytes[offset]) {
          const field = String.fromCharCode(bytes[offset++]!), end = bytes.indexOf(0, offset)
          if (end < 0) break
          if (field === 'C') code = bytes.subarray(offset, end).toString()
          if (field === 'M' || field === 'W' || field === 'P' || field === 'p') {
            if (diagnosticFields.has(field)) repeatedDiagnosticField = true
            diagnosticFields.add(field)
            const limit = field === 'M' ? 256 : field === 'W' ? 8192 : 8
            if (end - offset <= limit) {
              const value = bytes.subarray(offset, end).toString()
              if (field === 'M') guardMessage = value
              else if (field === 'W') guardContext = value
              else if (field === 'P') position = value
              else internalPosition = value
            }
          }
          offset = end + 1
        }
        failure = new LocalPgError(code)
        const guard = repeatedDiagnosticField ? undefined : readP7802GuardDiagnostic(code, guardMessage, guardContext, position, internalPosition)
        if (guard) localPgGuardDiagnostics.set(failure, guard)
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
  private async armCommitDeadline(bound?: CommitBound): Promise<CommitDeadline> {
    const guard = await LocalPgConnection.connect(this.cluster)
    let control: LocalPgConnection | undefined, pending: Promise<void> | undefined, recovery: Promise<void> | undefined
    let armed = false, sent = false, completed = false, disarming = false, finished = false
    let protectionFailure: LocalPgOperationDiagnostic['protectionFailure']
    let guardBirth: string | undefined
    let target: Readonly<Record<string, string | null>> | undefined
    let absoluteCutoff: string | undefined
    const recover = async () => {
      protectionFailure = 'commit_guard_lost'
      // This connection was established and its fixed backend limit configured
      // BEFORE arming. Never reconnect or act on a bare/reused PID after loss.
      const fallback = setTimeout(() => {
        protectionFailure = 'commit_control_failed'
        control?.socket.destroy(); this.closed = true; this.socket.destroy()
      }, LOCAL_PG_DEADLINES.commitRecoveryMs)
      try {
        // COMMIT may still be in transport while this same transaction is idle.
        // Query/state sampling must not create an unprotected dispatch window.
        // busy-through-cleanup prevents later target work; xact identity excludes
        // a completed commit or another transaction even when its PID survives.
        const rows = await control!.query('SELECT pg_catalog.pg_terminate_backend(a.pid,1000)::text AS terminated FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz AND a.xact_start=$3::timestamptz',
          [pgText(String(this.backendPid), 23), pgText(target!.birth!), pgText(target!.transaction!)])
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
      target = (await guard.query(bound
        ? 'SELECT backend_start::text AS birth,xact_start::text AS transaction,to_char(clock_timestamp() AT TIME ZONE \'UTC\',\'YYYY-MM-DD"T"HH24:MI:SS.US"Z"\') AS observed_at FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer'
        : 'SELECT backend_start::text AS birth,xact_start::text AS transaction FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer', [pgText(String(this.backendPid), 23)]))[0]
      const observedReplyAt = bound ? performance.now() : 0
      if (!target?.birth || !target.transaction) {
        if (bound) throw new LocalPgError('commit_deadline_not_armed')
        guard.close(); return { sent() {}, completed() {}, cleanup: async () => {}, failure: () => undefined }
      }
      if (bound) {
        const observed = target.observed_at
        if (typeof observed !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(observed)
          || !Number.isFinite(Date.parse(observed)) || new Date(Date.parse(observed)).toISOString() !== `${observed.slice(0, 23)}Z`
          || observedReplyAt >= bound.deadlineAt) throw new LocalPgError('commit_bound_elapsed')
        // Map the immutable monotonic minimum to DB time BEFORE subsequent
        // arming awaits. Observed DB time precedes response receipt, so this
        // mapping and millisecond flooring only shorten the allowed duration.
        // Later SQL scheduling can never restart a relative sleep budget.
        const mapped = Math.floor(Math.min(Date.parse(bound.databaseCutoff), Date.parse(observed) + bound.deadlineAt - observedReplyAt - 2))
        if (!Number.isFinite(mapped) || mapped <= Date.parse(observed)) throw new LocalPgError('commit_bound_elapsed')
        absoluteCutoff = new Date(mapped).toISOString().replace('Z', '000Z')
      }
      control = await LocalPgConnection.connect(this.cluster)
      await control.query(`SET statement_timeout=${LOCAL_PG_DEADLINES.commitRecoveryStatementMs}`)
      guardBirth = (await control.query('SELECT backend_start::text AS birth FROM pg_catalog.pg_stat_get_activity($1::integer)', [pgText(String(guard.backendPid), 23)]))[0]?.birth ?? undefined
      if (!guardBirth) throw new LocalPgError('commit_deadline_not_armed')
      // pg_sleep returns the empty void text. Using its length in the activity
      // function argument forces the fresh activity lookup AFTER the sleep.
      // The ordinary fixed path is byte-for-byte the same SQL/20s budget. The
      // new path only shortens it: both remaining monotonic budget and actual
      // database cutoff survive asynchronous guard setup and server scheduling.
      const guardSql = bound
        ? 'SELECT pg_catalog.pg_terminate_backend(a.pid)::text AS terminated FROM pg_catalog.pg_stat_get_activity($1::integer + pg_catalog.length(pg_catalog.pg_sleep(GREATEST(0::double precision,EXTRACT(epoch FROM ($4::timestamptz-pg_catalog.clock_timestamp()))::double precision))::text)) a WHERE a.backend_start=$2::timestamptz AND a.xact_start=$3::timestamptz'
        : 'SELECT pg_catalog.pg_terminate_backend(a.pid)::text AS terminated FROM pg_catalog.pg_stat_get_activity($1::integer + pg_catalog.length(pg_catalog.pg_sleep($4::double precision)::text)) a WHERE a.backend_start=$2::timestamptz AND a.xact_start=$3::timestamptz'
      const guardParams = [pgText(String(this.backendPid), 23), pgText(target.birth), pgText(target.transaction),
        pgText(bound ? absoluteCutoff! : String(LOCAL_PG_DEADLINES.commitMs / 1000))]
      pending = guard.query(guardSql, guardParams)
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
  /** Fixed COMMIT only, with a proved cutoff; it cannot dispatch arbitrary SQL.
   * Legacy query(COMMIT) remains unchanged. The caller receives actual ACK even
   * after ReadyForQuery/cleanup loss and distinguishes definitely unsent work.
   */
  async commitBefore(deadlineAt: number, databaseCutoff: string): Promise<LocalPgBoundedCommit> {
    const started = performance.now()
    const invalid = arguments.length !== 2 || !Number.isFinite(deadlineAt) || typeof databaseCutoff !== 'string'
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(databaseCutoff)
      || !Number.isFinite(Date.parse(databaseCutoff))
      || new Date(Date.parse(databaseCutoff)).toISOString() !== `${databaseCutoff.slice(0, 23)}Z`
    if (this.busy || this.closed || invalid) return Object.freeze({ dispatched: false, acknowledged: false, code: 'connection_state' })
    const bound: CommitBound = Object.freeze({ deadlineAt: Math.min(deadlineAt, started + LOCAL_PG_DEADLINES.commitMs), databaseCutoff })
    this.busy = true; this.timedOut = false; this.commandTag = null
    this.socket.setTimeout(30_000)
    let deadline: CommitDeadline | undefined, failure: unknown, dispatched = false
    let cleanupFailure: LocalPgOperationDiagnostic['protectionFailure']
    try {
      if (performance.now() >= bound.deadlineAt) throw new LocalPgError('commit_bound_elapsed')
      deadline = await this.armCommitDeadline(bound)
      const frame = packet('Q', z('COMMIT'))
      // No await between this post-arming check and handing the COMMIT frame to
      // the socket. A scheduling delay while arming cannot start a new budget.
      if (this.closed || performance.now() >= bound.deadlineAt) throw new LocalPgError('commit_bound_elapsed')
      deadline.sent()
      dispatched = true
      this.socket.write(frame)
      await this.result()
    } catch (error) { failure = error }
    finally {
      deadline?.completed()
      this.socket.setTimeout(0)
      try { await deadline?.cleanup() } catch { cleanupFailure = 'commit_disarm_failed'; this.closed = true; this.socket.destroy() }
      finally { this.busy = false; this.recordOperation('commit', started, failure, deadline?.failure() ?? cleanupFailure, dispatched) }
    }
    return Object.freeze({ dispatched, acknowledged: this.commandTag === 'COMMIT', code: diagnosticCode(failure),
      ...((deadline?.failure() ?? cleanupFailure) ? { protectionFailure: deadline?.failure() ?? cleanupFailure } : {}) })
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
      if (phase === 'commit') { deadline = await this.armCommitDeadline(); deadline.sent() }
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
