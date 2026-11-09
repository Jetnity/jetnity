// TEST-ONLY actual child process: proposal/import memory dies on parent SIGKILL.
// Parent retains ownership of the fresh local PostgreSQL transports over IPC.
import { createV3ProposalIntakeStore } from '../../../lib/readiness/official-truth-product-v3/storage/intake-server'
import type { V3IntakeSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'
import { s1Fixture } from './fixtures'

let sequence = 0
const waiting = new Map<number, (reply: Awaited<ReturnType<V3IntakeSqlExecutor['execute']>>) => void>()
const executor: V3IntakeSqlExecutor = { execute(statement, parameters) {
  const id = ++sequence
  return new Promise(resolve => { waiting.set(id, resolve); process.send?.({ type: 'sql', id, statement, parameters }) })
} }
let started = false
process.on('message', async (message: unknown) => {
  if (!message || typeof message !== 'object') return
  const row = message as Record<string, unknown>
  if (row.type === 'reply' && typeof row.id === 'number') {
    const complete = waiting.get(row.id); waiting.delete(row.id)
    if (complete) complete(row.reply as Awaited<ReturnType<V3IntakeSqlExecutor['execute']>>)
    return
  }
  if (row.type !== 'start' || started || typeof row.seed !== 'string' || !/^[a-z0-9-]{1,64}$/.test(row.seed)) return
  started = true
  try {
    const f = s1Fixture(row.seed), store = createV3ProposalIntakeStore({ registry: f.originals.registry, executor, leaseMilliseconds: 500 })
    const signal = new AbortController().signal
    if (row.mode === 'capture-reserve') {
      const captured = await store.intake.capture(f.text, f.binding, signal)
      if (captured.status !== 'recorded') throw Error('worker_capture')
      const reserve = await store.forImport(f.binding).reserve(f.upload, signal)
      if (reserve.status !== 'acquired') throw Error('worker_reserve')
      process.send?.({ type: 'held', operationId: f.binding.operationId })
      // The IPC listener keeps this process alive until the parent kills it.
    } else if (row.mode === 'confirm') {
      const result = await store.confirmImport(f.reference, signal)
      process.send?.({ type: 'confirmed', result }, () => process.disconnect())
    } else throw Error('worker_mode')
  } catch { process.send?.({ type: 'failed' }, () => process.disconnect()) }
})
