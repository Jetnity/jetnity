import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import type { Hrs1Facade, Hrs1MonitorResult } from '../result/composition'
import { withDevImportDiagnostics } from './dev-diagnostics'

type Work = Awaited<ReturnType<Hrs1Facade['workSelectedOnce']>>
type Budget = Readonly<{ deadline: number }>
type Kind = 'rule_research' | 'combination_discovery'
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

test('actual tick diagnostics share its consumed 30s cap and preserve the owned drain', async t => {
  let now = 1000
  t.mock.method(performance, 'now', () => now)
  let work: (kind: Kind, signal: AbortSignal, budget: Budget) => Promise<Work> = async () => {
    now += 5000; return { status: 'worker_only', worker: { status: 'not_due' } }
  }
  const facade = {
    workSelectedOnce(kind: Kind, signal: AbortSignal, budget: Budget) { return work(kind, signal, budget) },
    async monitorOnce(): Promise<Hrs1MonitorResult> { now += 6000; return { status: 'complete', outcomes: [] } },
  }
  t.mock.module(new URL('./ch-de-server.ts', import.meta.url), { namedExports: {
    officialTruthV3ChDeRuntime() { return facade },
  } })
  const { runOfficialTruthV3ChDeTick: run } = await import('./ch-de-tick')
  const lines: string[] = []
  const result = await withDevImportDiagnostics(() => run(new AbortController().signal), line => { lines.push(line) })
  assert.equal(result.status, 'complete'); assert.equal(result.elapsedMilliseconds, 16000)
  const events = lines.map(line => JSON.parse(line) as Record<string, string | number | null>)
  assert.deepEqual(events.map(event => event.remainingMilliseconds), [30000, 25000, 25000, 19000, 19000, 14000])
  assert.ok(events.every(event => event.budget === 'tick' && event.budgetMilliseconds === 30000))
  assert.deepEqual(events.filter(event => event.phase === 'settled').map(event => event.returnedDetail), ['not_due', null, 'not_due'])

  const entered = deferred(), held = deferred(), external = new AbortController()
  let settled = false, sinkCalls = 0
  work = async (_kind, child) => {
    entered.resolve(); await held.promise
    assert.equal(child.aborted, true)
    return { status: 'worker_only', worker: { status: 'not_due' } }
  }
  const pending = withDevImportDiagnostics(() => run(external.signal), () => { sinkCalls++; throw Error('offline logger') })
    .then(value => { settled = true; return value })
  await entered.promise; external.abort(); await Promise.resolve()
  assert.equal(settled, false)
  assert.equal((await run(new AbortController().signal)).status, 'busy')
  held.resolve()
  const interrupted = await pending
  assert.equal(interrupted.status, 'interrupted'); assert.deepEqual(interrupted.calls, { started: 1, settled: 1 })
  assert.equal(sinkCalls, 1)
  work = async () => ({ status: 'worker_only', worker: { status: 'not_due' } })
  assert.equal((await run(new AbortController().signal)).status, 'complete')
})
