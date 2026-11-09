// Actual child restart proof. No Pg import, cluster custody or arbitrary SQL IPC.
import { createV3PostgresMethodAuthority, type Ma1MethodReceipt, type Ma1MethodSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import { readMa1CurrentRequest, readMa1CurrentRows, type Ma1CurrentRequest } from '../../../lib/readiness/official-truth-product-v3/method/contract'
import { ma1RootVectors } from './fixtures'

const generation = process.argv[2]
if (!/^[0-9a-f]{16}$/.test(generation ?? '') || !process.send) throw Error('ma1 finite child invocation required')
const binding = ma1RootVectors()[0]!.binding
const method = Object.freeze({ methodId: binding.methodId, revision: binding.revision })
type ReadResult = Awaited<ReturnType<Ma1MethodSqlExecutor['readCurrent']>>
type Pending = { request: Ma1CurrentRequest; resolve: (result: ReadResult) => void; removeAbort: () => void }
const pending = new Map<number, Pending>()
let readId = 0, commandId = 0, busy = false, stopped = false, retained: Ma1MethodReceipt | undefined
function record(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false
  const names = Reflect.ownKeys(value)
  return names.length === keys.length && names.every(name => typeof name === 'string' && keys.includes(name)
    && Object.getOwnPropertyDescriptor(value, name)?.get === undefined)
}
function fail(): void {
  if (stopped) return
  stopped = true; process.exitCode = 1
  for (const entry of pending.values()) { entry.removeAbort(); entry.resolve({ status: 'unavailable' }) }
  pending.clear()
  if (process.connected) process.disconnect()
}
function send(frame: Record<string, unknown>, done?: () => void): void {
  if (stopped || Buffer.byteLength(JSON.stringify(frame)) > 4096 || !process.connected || !process.send) { fail(); return }
  process.send(frame, error => { if (error) fail(); else done?.() })
}
const executor: Ma1MethodSqlExecutor = {
  async readCurrent(input, signal) {
    if (stopped || signal.aborted || pending.size >= 4 || readId >= 65535) return { status: 'unavailable' }
    const parsed = readMa1CurrentRequest(input)
    if (!parsed.ok) return { status: 'unavailable' }
    const id = ++readId
    return await new Promise<ReadResult>(resolve => {
      let sentAbort = false
      const abort = () => {
        if (!pending.has(id) || sentAbort) return
        sentAbort = true; send({ v: 1, generation, readId: id, kind: 'abort' })
      }
      pending.set(id, { request: parsed.value, resolve,
        removeAbort: () => signal.removeEventListener('abort', abort) })
      signal.addEventListener('abort', abort, { once: true })
      send({ v: 1, generation, readId: id, kind: 'read', ...parsed.value })
      if (signal.aborted) abort()
    })
  },
}
const authority = createV3PostgresMethodAuthority(binding, executor)
process.on('message', (input: unknown) => {
  if (stopped || !input || typeof input !== 'object' || Buffer.byteLength(JSON.stringify(input)) > 4096) { fail(); return }
  const frame = input as Record<string, unknown>
  if (frame.v !== 1 || frame.generation !== generation) { fail(); return }
  if (frame.kind === 'settled') {
    if (!record(frame, ['v', 'generation', 'readId', 'kind', 'result']) || !Number.isSafeInteger(frame.readId)) { fail(); return }
    const entry = pending.get(frame.readId as number)
    if (!entry) { fail(); return }
    const result = frame.result
    if (!record(result, ['status']) && !record(result, ['status', 'rows'])) { fail(); return }
    if (result.status === 'rows') {
      if (!record(result, ['status', 'rows']) || !readMa1CurrentRows(result.rows, binding, entry.request.checkedAt).ok) { fail(); return }
    } else if (result.status !== 'unavailable' || !record(result, ['status'])) { fail(); return }
    pending.delete(frame.readId as number); entry.removeAbort(); entry.resolve(result as ReadResult)
    return
  }
  const withTime = frame.kind === 'resolve' || frame.kind === 'reprove_retained'
  if (!record(frame, withTime ? ['v', 'generation', 'commandId', 'kind', 'checkedAt'] : ['v', 'generation', 'commandId', 'kind'])
    || !Number.isSafeInteger(frame.commandId) || (frame.commandId as number) <= commandId || (frame.commandId as number) > 65535
    || busy || !['resolve', 'reprove_retained', 'try_serialized_clone', 'stop'].includes(String(frame.kind))) { fail(); return }
  if (withTime && !readMa1CurrentRequest({ ...binding, checkedAt: frame.checkedAt }).ok) { fail(); return }
  commandId = frame.commandId as number; busy = true
  const id = commandId
  void (async () => {
    let status: string
    if (frame.kind === 'resolve') {
      const result = await authority.resolveCurrent(method, frame.checkedAt as string)
      if (result.status === 'approved') retained = result.receipt
      status = result.status
    } else if (frame.kind === 'reprove_retained') {
      status = retained ? (await authority.reproveAtCommit(retained, method, frame.checkedAt as string)).status : 'unavailable'
    } else if (frame.kind === 'try_serialized_clone') {
      const clone: unknown = JSON.parse(JSON.stringify(retained ?? {}))
      status = (await authority.reproveAtCommit(clone as Ma1MethodReceipt, method, new Date().toISOString())).status
    } else {
      if (pending.size) throw Error('ma1 stop with unsettled reads')
      status = 'stopped'
    }
    busy = false
    send({ v: 1, generation, commandId: id, kind: 'result', status, retainedReceipt: Boolean(retained) },
      frame.kind === 'stop' ? () => { stopped = true; process.disconnect() } : undefined)
  })().catch(fail)
})
process.on('disconnect', fail)
