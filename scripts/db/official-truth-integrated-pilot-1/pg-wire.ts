// Minimal bounded PostgreSQL extended-query transport for the disposable proof.
// No TCP, DSN, credential, pool, dynamic SQL or runtime application import.
import { createConnection, type Socket } from 'node:net'
import { join } from 'node:path'
import { assertOwnedLocalProofCluster, type LocalProofCluster } from './local-cluster'

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
export class LocalPgConnection {
  private buffer: Buffer = Buffer.alloc(0)
  private messages: { tag: string; bytes: Buffer }[] = []
  private waiter: (() => void) | null = null
  private queuedBytes = 0
  private closed = false
  private busy = false
  private constructor(private socket: Socket) {
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
    socket.setTimeout(30_000, () => socket.destroy())
  }
  static async connect(cluster: LocalProofCluster, user = cluster.user): Promise<LocalPgConnection> {
    assertOwnedLocalProofCluster(cluster)
    if (!cluster.socket.startsWith(cluster.root + '/')) throw new LocalPgError('unsafe_socket')
    const socket = createConnection({ path: join(cluster.socket, `.s.PGSQL.${cluster.port}`) })
    const connection = new LocalPgConnection(socket)
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('error', () => reject(new LocalPgError('connection_failed'))) })
    const body = Buffer.concat([i32(196608), z('user'), z(user), z('database'), z(cluster.database), z('client_encoding'), z('UTF8'), Buffer.from([0])])
    socket.write(Buffer.concat([i32(body.length + 4), body]))
    await connection.result()
    return connection
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
      const { tag, bytes } = await this.message()
      if (++count > 100_000) throw new LocalPgError('response_bound')
      if (tag === 'R' && bytes.readInt32BE(0) !== 0) throw new LocalPgError('authentication_forbidden')
      if (tag === 'E') {
        let offset = 0, code = 'query_failed'
        while (offset < bytes.length && bytes[offset]) { const field = String.fromCharCode(bytes[offset++]!); const end = bytes.indexOf(0, offset); if (end < 0) break; if (field === 'C') code = bytes.subarray(offset, end).toString(); offset = end + 1 }
        failure = new LocalPgError(code)
      }
      if (tag === 'T') {
        names = []; let offset = 2
        for (let i = 0; i < bytes.readInt16BE(0); i++) { const end = bytes.indexOf(0, offset); names.push(bytes.subarray(offset, end).toString()); offset = end + 19 }
      }
      if (tag === 'D') {
        if (rows.length >= 1300) throw new LocalPgError('row_bound')
        const row: Record<string, string | null> = {}; let offset = 2
        for (let i = 0; i < bytes.readInt16BE(0); i++) { const n = bytes.readInt32BE(offset); offset += 4; row[names[i]!] = n === -1 ? null : bytes.subarray(offset, offset + n).toString(); if (n !== -1) offset += n }
        rows.push(row)
      }
      if (tag === 'Z') { if (failure) throw failure; return rows }
    }
  }
  async query(sql: string, parameters: readonly PgParameter[] = []): Promise<PgRows> {
    if (this.busy || this.closed) throw new LocalPgError('connection_state')
    if (parameters.reduce((sum, p) => sum + p.bytes.length + 12, Buffer.byteLength(sql)) > 10_485_760) throw new LocalPgError('parameter_bound')
    this.busy = true
    try {
      if (!parameters.length) this.socket.write(packet('Q', z(sql)))
      else {
        const parse = Buffer.concat([z(''), z(sql), i16(parameters.length), ...parameters.map(p => i32(p.oid))])
        const bind = Buffer.concat([z(''), z(''), i16(parameters.length), ...parameters.map(p => i16(p.binary ? 1 : 0)), i16(parameters.length), ...parameters.flatMap(p => [i32(p.bytes.length), Buffer.from(p.bytes)]), i16(0)])
        this.socket.write(Buffer.concat([packet('P', parse), packet('B', bind), packet('D', Buffer.concat([Buffer.from('P'), z('')])), packet('E', Buffer.concat([z(''), i32(0)])), packet('S', Buffer.alloc(0))]))
      }
      return await this.result()
    } finally { this.busy = false }
  }
  close() { this.socket.end(packet('X', Buffer.alloc(0))); this.closed = true }
}
