// Test-only genuine process boundary. No PostgreSQL import, target or SQL channel.
import { performance } from 'node:perf_hooks'
import { createV3PostgresDurableJobs, type Ma1MethodSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import { readMa1CurrentRequest } from '../../../lib/readiness/official-truth-product-v3/method/contract'
import { readV3GlobalRuleContext } from '../../../lib/readiness/official-truth-product-v3/contract'
import type { M04TerminalExecutor, M04DeliveryProducer, M04Facade } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import type { V3IntakeSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'
import { m04Fixture, M04_TEST_BINDING } from './fixtures'

const generation = process.argv[2]
if (!/^[0-9a-f]{16}$/.test(generation ?? '') || !process.send) throw Error('m04 controlled child required')
const statements = [
  'SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result',
  'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
  'SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
  'SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
]
type Waiter = { resolve: (value: unknown) => void; removeAbort: () => void }
const pending = new Map<number, Waiter>()
let nextRpc = 0, nextCommand = 0, busy = false, stopped = false, bytes = 0, producerCalls = 0
let fixture: ReturnType<typeof m04Fixture> | undefined, facade: M04Facade | undefined
const stop = new AbortController()
function closed(v: unknown, keys: readonly string[]): v is Record<string, unknown> {
  return Boolean(v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype
    && Reflect.ownKeys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k)))
}
function fail() {
  if (stopped) return
  stopped = true; stop.abort(); process.exitCode = 1
  for (const w of pending.values()) { w.removeAbort(); w.resolve({ status: 'unavailable' }) }
  pending.clear(); if (process.connected) process.disconnect()
}
function send(frame: Record<string, unknown>, done?: () => void) {
  const size = Buffer.byteLength(JSON.stringify(frame))
  if (stopped || size > 1_048_576 || (bytes += size) > 67_108_864 || !process.connected || !process.send) { fail(); return }
  process.send(frame, error => { if (error) fail(); else done?.() })
}
async function rpc(kind: 'method' | 'jobs' | 'intake', request: unknown, signal: AbortSignal): Promise<unknown> {
  if (stopped || signal.aborted || pending.size >= 8 || nextRpc >= 256) return { status: 'unavailable' }
  const id = ++nextRpc
  return await new Promise(resolve => {
    let sent = false
    const abort = () => { if (pending.has(id) && !sent) { sent = true; send({ v: 1, generation, kind: 'abort', rpcId: id }) } }
    pending.set(id, { resolve, removeAbort: () => signal.removeEventListener('abort', abort) })
    signal.addEventListener('abort', abort, { once: true })
    send({ v: 1, generation, kind: 'rpc', rpcId: id, operation: kind, request })
    if (signal.aborted) abort()
  })
}
const methodExecutor: Ma1MethodSqlExecutor = { async readCurrent(request, signal) {
  const read = readMa1CurrentRequest(request)
  if (!read.ok) return { status: 'unavailable' }
  return await rpc('method', read.value, signal) as Awaited<ReturnType<Ma1MethodSqlExecutor['readCurrent']>>
} }
const jobsExecutor: M04TerminalExecutor = { async executeFixed(request, signal) {
  // Monotonic clock domains do not cross processes. Parent admits only the
  // remaining original cap plus unchanged absolute cap; child still checks its
  // original private Held after the parent's actual terminal native result.
  const remaining = Math.floor(request.budget.deadline - performance.now())
  if (remaining < 1 || remaining > 5000) return { status: 'unavailable' }
  return await rpc('jobs', { operationText: request.operationText, methodId: request.methodId, revision: request.revision,
    methodDigest: request.methodDigest, packageDigest: request.packageDigest, epoch: request.epoch,
    remaining, notAfter: request.notAfter }, signal) as Awaited<ReturnType<M04TerminalExecutor['executeFixed']>>
} }
const intakeExecutor: V3IntakeSqlExecutor = { async execute(statement, parameters, signal) {
  const index = statements.indexOf(statement)
  if (index < 0) return { status: 'unavailable' }
  return await rpc('intake', { index, parameters }, signal) as Awaited<ReturnType<V3IntakeSqlExecutor['execute']>>
} }
process.on('message', (input: unknown) => {
  if (stopped || !input || typeof input !== 'object' || Buffer.byteLength(JSON.stringify(input)) > 1_048_576) { fail(); return }
  const frame = input as Record<string, unknown>
  if (frame.v !== 1 || frame.generation !== generation) { fail(); return }
  if (frame.kind === 'settled') {
    if (!closed(frame, ['v', 'generation', 'kind', 'rpcId', 'result']) || !Number.isSafeInteger(frame.rpcId)) { fail(); return }
    const entry = pending.get(frame.rpcId as number); if (!entry) { fail(); return }
    pending.delete(frame.rpcId as number); entry.removeAbort(); entry.resolve(frame.result); return
  }
  if (!closed(frame, ['v', 'generation', 'kind', 'commandId', 'action', 'data']) || frame.kind !== 'command'
    || !Number.isSafeInteger(frame.commandId) || (frame.commandId as number) <= nextCommand || (frame.commandId as number) > 65535
    || busy || !['init', 'enqueue_rule', 'enqueue_discovery', 'work', 'stop'].includes(String(frame.action))) { fail(); return }
  nextCommand = frame.commandId as number; busy = true
  const id = nextCommand
  void (async () => {
    let result: unknown
    if (frame.action === 'init') {
      const data = frame.data
      if (fixture || !closed(data, ['seed', 'context', 'count', 'mode']) || typeof data.seed !== 'string'
        || !/^[a-z0-9-]{1,64}$/.test(data.seed) || !Number.isInteger(data.count) || (data.count as number) < 1 || (data.count as number) > 16
        || !['normal', 'failed', 'hang'].includes(String(data.mode))) throw Error('m04 child init')
      const context = readV3GlobalRuleContext(data.context); if (!context.ok) throw Error('m04 child context')
      fixture = m04Fixture(data.seed, { context: context.value, count: data.count as number })
      const producer: M04DeliveryProducer = { async produce(request, signal) {
        producerCalls++; send({ v: 1, generation, kind: 'producer', count: producerCalls })
        if (data.mode === 'failed') return { status: 'failed', reason: 'unreachable' }
        if (data.mode === 'hang') return new Promise(resolve => {
          const abort = () => { signal.removeEventListener('abort', abort); resolve({ status: 'failed', reason: 'unreachable' }) }
          signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort()
        })
        return fixture!.producer.produce(request, signal)
      } }
      facade = createV3PostgresDurableJobs({ binding: M04_TEST_BINDING, registry: fixture.originals.registry,
        clock: fixture.clock, methodExecutor, jobsExecutor, intakeExecutor, producer, evidence: fixture.evidence, history: fixture.history })
      result = { status: 'initialized' }
    } else {
      if (!fixture || !facade) throw Error('m04 child not initialized')
      if (frame.action === 'enqueue_rule') result = await facade.enqueueRule(fixture.ruleInput, stop.signal)
      else if (frame.action === 'enqueue_discovery') result = await facade.enqueueDiscovery(fixture.discoveryInput, stop.signal)
      else if (frame.action === 'work') result = await facade.workOnce(frame.data, stop.signal)
      else { if (pending.size) throw Error('m04 child stop has pending native calls'); result = { status: 'stopped' } }
    }
    busy = false
    send({ v: 1, generation, kind: 'result', commandId: id, result, producerCalls }, frame.action === 'stop'
      ? () => { stopped = true; process.disconnect() } : undefined)
  })().catch(fail)
})
process.on('disconnect', fail)
