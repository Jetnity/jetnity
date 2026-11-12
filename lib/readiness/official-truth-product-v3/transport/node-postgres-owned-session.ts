// Private pg 8.23.1 adapter. Only node-postgres-executors and its owned tests import this.
import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { Resolver } from 'node:dns/promises'
import { Socket, isIP } from 'node:net'
import { performance } from 'node:perf_hooks'
import { checkServerIdentity, TLSSocket } from 'node:tls'
import { Client, Query, type ClientConfig, type CustomTypesConfig, type QueryArrayConfig, type QueryResult } from 'pg'
import { V3_PG_LOGINS, selectedV3PgTarget, readV3PgPassword, type V3PgLogin, type V3PgTarget } from './node-postgres-selection'

export type PgOwnedRows = readonly Readonly<Record<string, string | null>>[]
type Ready = 'I' | 'T' | 'E'
export type PgOwnedReply = Readonly<{ rows: PgOwnedRows; command: string; ready: Ready }>
export type PgOwnedSession = Readonly<{
  applicationName: string;
  query(text: string, values?: readonly (string | number | null)[]): Promise<PgOwnedReply>;
  idleAcknowledged(): boolean;
  alive(): boolean;
  forceLocalClose(): void;
  closeLocal(): Promise<void>;
}>
export type PgOwnedPair = Readonly<{ work: PgOwnedSession; control: PgOwnedSession; closeLocal(): Promise<void> }>
const ROW_BYTES = 2_097_152, FRAME_BYTES = ROW_BYTES + 65_536, SESSION_BYTES = 8_388_608
const FRAMES = 4_096, ROWS = 16, COLUMNS = 32, QUERIES = 128
const queryTypes = Object.freeze({
  // pg does not invoke a parser for SQL NULL. Every non-NULL text cell, including
  // JSONB, timestamptz, int8 and numeric, is returned without reinterpretation.
  getTypeParser(_oid: number, format?: string) {
    if (format && format !== 'text') throw Error('pg_binary_response_refused')
    return (value: string) => value
  },
}) as CustomTypesConfig

/** The two pinned driver-private surfaces are intentionally explicit: connection
 * lifecycle/framing and the asynchronous SCRAM continuation. They are checked
 * against pg 8.23.1, not guessed from a generic client facade. */
type PinnedClient = Client & {
  binary: boolean; pipeline: boolean;
  connectionParameters: { replication?: unknown; query_timeout?: unknown; sslnegotiation?: unknown };
  connection: NodeJS.EventEmitter & { stream: Socket | TLSSocket };
  _handleAuthSASLContinue(message: unknown): Promise<void>;
  _handleAuthMD5Password(message: unknown): void;
  _handleAuthCleartextPassword(message: unknown): void;
  getTransactionStatus(): string | null;
}
const failure = () => Error('pg_owned_transport_unavailable')

function admittedTarget(target: V3PgTarget | null): target is V3PgTarget {
  if (!target || typeof target.connectHost !== 'string' || target.connectHost.length > 253
    || !/^[a-z0-9.:-]+$/.test(target.connectHost) || target.connectHost.includes('/')
    || typeof target.tlsHostname !== 'string' || !/^[a-z0-9][a-z0-9.-]{0,251}[a-z0-9]$/.test(target.tlsHostname)
    || isIP(target.tlsHostname) !== 0 || !Number.isInteger(target.port) || target.port < 1 || target.port > 65535
    || typeof target.database !== 'string' || !/^[a-z][a-z0-9_]{0,62}$/.test(target.database)
    || typeof target.usernameSuffix !== 'string' || !/^(?:\.[a-z0-9]{20})?$/.test(target.usernameSuffix)
    || target.expectedServerMajor !== 17 || target.requireBackendTls !== true
    || typeof target.certificateAuthorityPem !== 'string' || Buffer.byteLength(target.certificateAuthorityPem) > 32_768
    || !target.certificateAuthorityPem.startsWith('-----BEGIN CERTIFICATE-----\n')
    || !target.certificateAuthorityPem.trimEnd().endsWith('-----END CERTIFICATE-----')
    || !/^[a-f0-9]{64}$/.test(target.certificateAuthoritySha256)) return false
  return createHash('sha256').update(target.certificateAuthorityPem, 'utf8').digest('hex') === target.certificateAuthoritySha256
}

async function resolveOwnedAddress(host: string, deadline: number, signal: AbortSignal): Promise<string | null> {
  if (signal.aborted || performance.now() >= deadline) return null
  if (isIP(host)) return host // Only a code-selected literal; native fixture uses 127.0.0.1.
  const resolver = new Resolver({ timeout: Math.max(1, Math.min(2000, Math.floor(deadline - performance.now()))), tries: 1 })
  let cancelled = false
  const cancel = () => { cancelled = true; resolver.cancel() }
  signal.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(cancel, Math.max(0, deadline - performance.now()))
  try {
    // Both actual native DNS operations are joined even when one fails or aborts.
    const responses = await Promise.allSettled([resolver.resolve4(host), resolver.resolve6(host)])
    if (cancelled || signal.aborted || performance.now() >= deadline) return null
    const addresses: string[] = []
    for (const response of responses) if (response.status === 'fulfilled') {
      if (response.value.length > 16) return null
      for (const address of response.value) if (isIP(address)) addresses.push(address)
    }
    return addresses.length > 0 && addresses.length <= 32 ? [...new Set(addresses)].sort()[0]! : null
  } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel) }
}

function session(target: V3PgTarget, address: string, password: string, kind: V3PgLogin,
  purpose: 'work' | 'control', connectDeadline: number, closeDeadline: number) {
  const remaining = Math.floor(connectDeadline - performance.now())
  if (remaining < 1) throw failure()
  const applicationName = `otv3:${kind}:${purpose === 'work' ? 'w' : 'c'}:${randomBytes(12).toString('hex')}`
  const raw = new Socket(), closePromises: Promise<void>[] = [], auth = new Set<Promise<void>>()
  let rawClosed = false, secure: TLSSocket | null = null, verified = false, connected = false
  let closing = false, closed = false, ready: Ready | null = null, readySerial = 0, queries = 0
  let busy: { serial: number; error: boolean; done: boolean; command: string; rows: PgOwnedRows;
    settle: () => void; reject: () => void } | null = null
  let closePromise: Promise<void> | null = null
  const rawClose = new Promise<void>(resolve => raw.once('close', () => { rawClosed = true; resolve() }))
  closePromises.push(rawClose)
  const nativeLimit = Math.max(1, Math.floor((purpose === 'work' ? connectDeadline : closeDeadline) - performance.now()))
  const options = `-c search_path=pg_catalog -c timezone=UTC -c datestyle=ISO,YMD -c client_encoding=UTF8`
    + ` -c transaction_timeout=${nativeLimit} -c idle_session_timeout=${Math.max(1, Math.floor(closeDeadline - performance.now()))}`
  const config: ClientConfig & { sslnegotiation: 'postgres'; replication: 'false'; pipeline: false; binary: false; scramMaxIterations: number } = {
    host: address, port: target.port, database: target.database, user: V3_PG_LOGINS[kind].login + target.usernameSuffix,
    password, stream: () => raw, sslnegotiation: 'postgres', replication: 'false', pipeline: false, binary: false,
    application_name: applicationName, fallback_application_name: applicationName, client_encoding: 'UTF8', options,
    connectionTimeoutMillis: Math.max(1, Math.min(2000, remaining)), query_timeout: 0,
    statement_timeout: nativeLimit, lock_timeout: nativeLimit, idle_in_transaction_session_timeout: nativeLimit,
    keepAlive: true, keepAliveInitialDelayMillis: 1000, enableChannelBinding: true, scramMaxIterations: 16384,
    ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2', ca: target.certificateAuthorityPem,
      servername: target.tlsHostname,
      checkServerIdentity(name, certificate) {
        return name !== target.tlsHostname ? failure() : checkServerIdentity(target.tlsHostname, certificate)
      } },
  }
  let client: PinnedClient
  try { client = new Client(config) as PinnedClient } catch { raw.destroy(); throw failure() }
  const force = () => { secure?.destroy(); raw.destroy() }
  // pg's parsed replication option otherwise accepts PGREPLICATION. All
  // connection/security fields above are explicit; no pgpass/native driver path.
  if (client.connection?.stream !== raw || client.binary !== false || client.pipeline !== false
    || client.connectionParameters.replication !== 'false' || client.connectionParameters.sslnegotiation !== 'postgres'
    || client.connectionParameters.query_timeout || typeof client.getTransactionStatus !== 'function'
    || typeof client._handleAuthSASLContinue !== 'function') { force(); throw failure() }
  client.on('error', () => { /* Error contents and credentials never leave this module. */ })
  const originalScram = client._handleAuthSASLContinue
  client._handleAuthSASLContinue = function (message: unknown): Promise<void> {
    const pending = Reflect.apply(originalScram, client, [message]) as Promise<void>
    auth.add(pending)
    void pending.then(() => auth.delete(pending), () => { auth.delete(pending); force() })
    return pending
  }
  // The selected transport requires SCRAM over verified TLS. No password-method
  // downgrade, pgpass callback or unjoined asynchronous MD5 continuation.
  client._handleAuthMD5Password = force
  client._handleAuthCleartextPassword = force
  client.connection.on('readyForQuery', (message: { status?: string }) => {
    if (message?.status !== 'I' && message?.status !== 'T' && message?.status !== 'E') { force(); return }
    ready = message.status; readySerial++
    busy?.settle()
  })
  client.connection.on('end', () => { closed = true; busy?.reject() })
  client.connection.once('sslconnect', () => {
    const stream = client.connection.stream
    if (!(stream instanceof TLSSocket)) { force(); return }
    secure = stream
    closePromises.push(new Promise<void>(resolve => stream.once('close', resolve)))
    stream.once('secureConnect', () => {
      verified = stream.authorized && !checkServerIdentity(target.tlsHostname, stream.getPeerCertificate())
      if (!verified) force()
    })
    // pg 8.23.1 attaches exactly its protocol parser before sslconnect. Deliver
    // complete bounded frames to that existing parser, retaining its real wire
    // semantics and catching malformed-packet throws before they escape an event.
    const listeners = stream.listeners('data')
    if (listeners.length !== 1) { force(); return }
    const parse = listeners[0]!
    stream.removeListener('data', parse as (chunk: Buffer) => void)
    let held = Buffer.alloc(0), received = 0, frames = 0
    stream.on('data', (chunk: Buffer) => {
      if (closing || closed) return
      try {
        received += chunk.byteLength
        if (received > SESSION_BYTES || held.byteLength + chunk.byteLength > FRAME_BYTES + 65_536) throw failure()
        held = held.byteLength ? Buffer.concat([held, chunk]) : chunk
        let offset = 0
        while (held.byteLength - offset >= 5) {
          const length = held.readUInt32BE(offset + 1)
          if (length < 4 || length + 1 > FRAME_BYTES || !'RSKZTDCE N123tnIAs'.replace(/ /g, '').includes(String.fromCharCode(held[offset]!))) throw failure()
          if (held.byteLength - offset < length + 1) break
          if (++frames > FRAMES) throw failure()
          Reflect.apply(parse, stream, [held.subarray(offset, offset + length + 1)])
          offset += length + 1
          if (closed || stream.destroyed) break
        }
        held = offset === held.byteLength ? Buffer.alloc(0) : Buffer.from(held.subarray(offset))
      } catch { force() }
    })
  })
  const hardClose = setTimeout(force, Math.max(0, closeDeadline - performance.now()))
  async function closeLocal(): Promise<void> {
    if (closePromise) return closePromise
    closePromise = (async () => {
      closing = true
      let ended: Promise<unknown>
      try { ended = Promise.resolve(client.end()) } catch { ended = Promise.resolve() }
      // A socket-close observation and pg end are both joined. The timer only
      // destroys owned sockets; it does not stand in for remote rollback truth.
      if (performance.now() >= closeDeadline) force()
      await ended.catch(() => {})
      if (!rawClosed) raw.destroy()
      if (secure && !secure.destroyed) secure.destroy()
      await Promise.all(closePromises)
      await Promise.allSettled([...auth])
      clearTimeout(hardClose)
    })()
    return closePromise
  }
  async function connect(): Promise<void> {
    try {
      await client.connect()
      connected = true
      if (!verified || ready !== 'I' || !secure?.authorized || performance.now() >= connectDeadline) throw failure()
    } catch { await closeLocal(); throw failure() }
  }
  const owned: PgOwnedSession = Object.freeze({ applicationName,
    alive: () => connected && !closing && !closed && !raw.destroyed && !!secure && !secure.destroyed,
    idleAcknowledged: () => connected && !busy && ready === 'I',
    forceLocalClose: force, closeLocal,
    async query(text, values = []): Promise<PgOwnedReply> {
      if (!connected || closing || closed || busy || ++queries > QUERIES || typeof text !== 'string'
        || Buffer.byteLength(text) > 8192 || values.length > 16 || values.some(v => v !== null && typeof v !== 'string' && typeof v !== 'number')
        || values.reduce<number>((n, v) => n + (typeof v === 'string' ? Buffer.byteLength(v) : 16), 0) > 3_145_728) throw failure()
      const serial = readySerial
      return new Promise<PgOwnedReply>((resolve, reject) => {
        const rows: Readonly<Record<string, string | null>>[] = []
        let total = 0, settled = false
        const current = { serial, error: false, done: false, command: '', rows,
          reject() { if (!settled) { settled = true; busy = null; reject(failure()) } },
          settle() {
            if (settled || readySerial <= serial || (!current.error && !current.done)) return
            settled = true; busy = null
            if (current.error || !ready || client.getTransactionStatus() !== ready) reject(failure())
            else resolve(Object.freeze({ rows: Object.freeze(rows), command: current.command, ready }))
          } }
        busy = current
        // An earlier Idle cannot prove the fate of this newly dispatched query.
        // Only its own subsequent ReadyForQuery can restore terminal idle truth.
        ready = null
        const configuration: QueryArrayConfig & { queryMode: 'extended'; binary: false } = {
          text, values: [...values], queryMode: 'extended', binary: false, rowMode: 'array', types: queryTypes }
        const query = new Query(configuration)
        query.on('row', (rawRow: unknown, result?: QueryResult) => {
          try {
            if (!result || !Array.isArray(rawRow) || rawRow.length > COLUMNS || result.fields.length !== rawRow.length || rows.length >= ROWS) throw failure()
            const row: Record<string, string | null> = {}, names = new Set<string>()
            for (let i = 0; i < rawRow.length; i++) {
              const name = result.fields[i]!.name, cell: unknown = rawRow[i]
              if (!/^[a-z][a-z0-9_]{0,62}$/.test(name) || names.has(name) || (cell !== null && typeof cell !== 'string')) throw failure()
              names.add(name); total += name.length + (typeof cell === 'string' ? Buffer.byteLength(cell) : 0)
              if (total > ROW_BYTES) throw failure()
              row[name] = cell
            }
            rows.push(Object.freeze(row))
          } catch { current.error = true; force() }
        })
        query.on('error', () => { current.error = true; current.settle(); if (closed) current.reject() })
        query.on('end', (result: QueryResult | QueryResult[]) => {
          if (Array.isArray(result) || typeof result.command !== 'string') current.error = true
          else { current.command = result.command; current.done = true }
          current.settle()
        })
        try { client.query(query) } catch { current.error = true; force(); current.reject() }
      })
    },
  })
  return { owned, connect }
}

/** The kernel reserves both slots before calling this function. No pool queue,
 * reconnection, caller target/credential/role or third connection is available. */
export async function openOwnedV3PgPair(kind: V3PgLogin, operationDeadline: number,
  cleanupDeadline: number, signal: AbortSignal): Promise<PgOwnedPair | null> {
  if (!Object.hasOwn(V3_PG_LOGINS, kind) || signal.aborted || !Number.isFinite(operationDeadline)
    || !Number.isFinite(cleanupDeadline) || cleanupDeadline < operationDeadline || cleanupDeadline - operationDeadline > 5000
    || operationDeadline - performance.now() > 5000 || performance.now() >= operationDeadline) return null
  const target = selectedV3PgTarget()
  if (!admittedTarget(target)) return null
  const password = readV3PgPassword(kind)
  if (!password) return null
  const address = await resolveOwnedAddress(target.connectHost, operationDeadline, signal)
  if (!address || signal.aborted) return null
  let control: ReturnType<typeof session> | null = null, work: ReturnType<typeof session> | null = null
  const abort = () => { control?.owned.forceLocalClose(); work?.owned.forceLocalClose() }
  signal.addEventListener('abort', abort, { once: true })
  try {
    control = session(target, address, password, kind, 'control', operationDeadline, cleanupDeadline)
    if (signal.aborted) abort()
    await control.connect()
    work = session(target, address, password, kind, 'work', operationDeadline, cleanupDeadline)
    if (signal.aborted) abort()
    await work.connect()
    if (signal.aborted || performance.now() >= operationDeadline) throw failure()
    const selectedWork = work.owned, selectedControl = control.owned
    return Object.freeze({ work: selectedWork, control: selectedControl,
      async closeLocal() { await Promise.all([selectedWork.closeLocal(), selectedControl.closeLocal()]) } })
  } catch {
    abort()
    await Promise.all([work?.owned.closeLocal(), control?.owned.closeLocal()])
    return null
  } finally { signal.removeEventListener('abort', abort) }
}
