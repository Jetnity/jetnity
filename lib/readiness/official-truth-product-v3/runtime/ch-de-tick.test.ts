// Offline dispatch/auth boundaries only; no SQL, source fetch, approval or schedule.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import type { Hrs1Facade, Hrs1MonitorResult } from '../result/composition'
import { HRS1_LIMITS } from '../result/contract'

type Work = Awaited<ReturnType<Hrs1Facade['workSelectedOnce']>>
type Budget = Readonly<{ deadline: number }>
type Kind = 'rule_research' | 'combination_discovery'
const notDue = (): Work => ({ status: 'worker_only', worker: { status: 'not_due' } })
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
const signal = () => new AbortController().signal

test('fixed CH→DE tick owns dispatch, shared deadline and authenticated ingress', { timeout: 15000 }, async t => {
  let now = 1_000, lookups = 0
  t.mock.method(performance, 'now', () => now)
  let work: (kind: Kind, signal: AbortSignal, budget: Budget) => Promise<Work> = async () => notDue()
  let monitor: (signal: AbortSignal, budget: Budget) => Promise<Hrs1MonitorResult> = async () => ({ status: 'complete', outcomes: [] })
  const unexpected = async (): Promise<never> => { throw Error('unselected facade entrance') }
  const facade = Object.freeze<Hrs1Facade>({
    enqueueRule: unexpected, enqueueDiscovery: unexpected, workOnce: unexpected, query: unexpected,
    workSelectedOnce(kind, signal, budget) { assert.ok(signal); assert.ok(budget); return work(kind, signal, budget) },
    monitorOnce(signal, budget) { assert.ok(signal); assert.ok(budget); return monitor(signal, budget) },
  })
  let selected: Hrs1Facade | null = facade
  t.mock.module(new URL('./ch-de-server.ts', import.meta.url), { cache: true, namedExports: {
    officialTruthV3ChDeRuntime() { lookups++; return selected },
  } })
  const { runOfficialTruthV3ChDeTick: run } = await import('./ch-de-tick')
  const route = await import('../../../../app/api/internal/readiness/ch-de-visa-tick/route')
  function reset() {
    selected = facade
    work = async () => notDue()
    monitor = async () => ({ status: 'complete', outcomes: [] })
  }
  await t.test('closed runtime and pre-abort admit no child work', async () => {
    selected = null
    const closed = await run(signal())
    assert.equal(closed.status, 'unavailable'); assert.deepEqual(closed.calls, { started: 0, settled: 0 })
    const controller = new AbortController(); controller.abort()
    const before = lookups, aborted = await run(controller.signal)
    assert.equal(aborted.status, 'interrupted'); assert.equal(lookups, before)
    reset()
  })
  await t.test('discovery then monitor then research share exactly one immutable consumed cap', async () => {
    const calls: { kind: string; budget: Budget; at: number }[] = [], start = now
    work = async (kind, _signal, budget) => { calls.push({ kind, budget, at: now }); now += 5_000; return notDue() }
    monitor = async (_signal, budget) => { calls.push({ kind: 'monitor', budget, at: now }); now += 6_000; return { status: 'complete', outcomes: [] } }
    const result = await run(signal())
    assert.equal(result.status, 'complete'); assert.deepEqual(result.calls, { started: 3, settled: 3 })
    assert.deepEqual(calls.map(row => row.kind), ['combination_discovery', 'monitor', 'rule_research'])
    assert.deepEqual(calls.map(row => row.budget.deadline - row.at), [30_000, 25_000, 19_000])
    for (const row of calls) {
      assert.equal(row.budget, calls[0]!.budget); assert.ok(Object.isFrozen(row.budget))
      assert.equal(row.budget.deadline, start + 30_000)
    }
    assert.equal(result.elapsedMilliseconds, 16_000)
    assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.calls)); assert.ok(Object.isFrozen(result.counts))
    reset()
  })
  await t.test('unknown discovery outcome stops without replay or monitor', async () => {
    let calls = 0
    work = async () => { calls++; return { status: 'unconfirmed' } }
    monitor = unexpected
    const result = await run(signal())
    assert.equal(result.status, 'stopped'); assert.equal(calls, 1)
    assert.deepEqual(result.calls, { started: 1, settled: 1 }); assert.equal(result.counts.unconfirmed, 1)
    assert.equal(result.stages.monitor, 'skipped'); assert.equal(result.stages.research, 'skipped')
    reset()
  })
  await t.test('partial monitor reports retain only counters and stop on unknown outcome', async () => {
    monitor = async () => ({ status: 'complete', outcomes: (['suppressed', 'research_queued', 'unconfirmed'] as const).map(status => ({
      status, ruleChange: 'not_asserted' as const,
      contextKey: 'private-context', sourceId: 'private-source', auditRef: 'private-audit', jobKey: 'private-job',
    })) })
    const result = await run(signal())
    assert.equal(result.status, 'stopped'); assert.deepEqual(result.calls, { started: 2, settled: 2 })
    assert.equal(result.counts.suppressed, 1); assert.equal(result.counts.researchQueued, 1); assert.equal(result.counts.unconfirmed, 1)
    assert.equal(result.stages.research, 'skipped'); assert.doesNotMatch(JSON.stringify(result), /private-/)
    reset()
  })
  await t.test('all three valid monitor outcomes per target fit the bound; an extra outcome refuses', async () => {
    const outcomes: Hrs1MonitorResult['outcomes'] = Array.from({ length: HRS1_LIMITS.monitorTargets }, (_, index) =>
      (['suppressed', 'suppressed', 'research_queued'] as const).map(status => ({
        status, ruleChange: 'not_asserted' as const, contextKey: 'private-context-' + index, sourceId: 'private-source-' + index,
      }))).flat()
    monitor = async () => ({ status: 'complete', outcomes })
    const valid = await run(signal())
    assert.equal(valid.status, 'complete'); assert.deepEqual(valid.calls, { started: 3, settled: 3 })
    assert.equal(valid.counts.suppressed, HRS1_LIMITS.monitorTargets * 2)
    assert.equal(valid.counts.researchQueued, HRS1_LIMITS.monitorTargets); assert.equal(valid.counts.invalid, 0)
    assert.doesNotMatch(JSON.stringify(valid), /private-/)
    monitor = async () => ({ status: 'complete', outcomes: [...outcomes, outcomes[0]!] })
    const overflow = await run(signal())
    assert.equal(overflow.status, 'stopped'); assert.deepEqual(overflow.calls, { started: 2, settled: 2 })
    assert.equal(overflow.counts.invalid, 1); assert.equal(overflow.stages.research, 'skipped')
    reset()
  })
  await t.test('a consumed original deadline cannot start the following stage', async () => {
    let held: AbortSignal | null = null
    work = async (_kind, signal) => { held = signal; now += 30_001; return notDue() }
    monitor = unexpected
    const result = await run(signal())
    assert.equal(result.status, 'interrupted'); assert.deepEqual(result.calls, { started: 1, settled: 1 })
    assert.ok(held); assert.equal((held as AbortSignal).aborted, true)
    assert.equal(result.elapsedMilliseconds, 30_001)
    reset()
  })
  await t.test('abort does not release local admission or answer before the actual child settles', async () => {
    const entered = deferred<void>(), gate = deferred<Work>(), controller = new AbortController()
    let childSignal: AbortSignal | null = null, answered = false
    work = async (_kind, signal) => { childSignal = signal; entered.resolve(); return await gate.promise }
    const joined = run(controller.signal).then(value => { answered = true; return value })
    try {
      await entered.promise; controller.abort(); await Promise.resolve()
      assert.ok(childSignal); assert.equal((childSignal as AbortSignal).aborted, true); assert.equal(answered, false)
      const busy = await run(signal()); assert.equal(busy.status, 'busy'); assert.deepEqual(busy.calls, { started: 0, settled: 0 })
      assert.equal(answered, false)
    } finally { gate.resolve({ status: 'unconfirmed' }); await joined }
    const result = await joined
    assert.equal(result.status, 'interrupted'); assert.deepEqual(result.calls, { started: 1, settled: 1 })
    reset(); assert.equal((await run(signal())).status, 'complete')
  })
  await t.test('unexpected child errors produce only a joined negative result', async () => {
    work = async () => { throw Error('private synthetic failure detail') }
    const result = await run(signal())
    assert.equal(result.status, 'stopped'); assert.equal(result.counts.unconfirmed, 1)
    assert.deepEqual(result.calls, { started: 1, settled: 1 }); assert.doesNotMatch(JSON.stringify(result), /private|detail/)
    reset()
  })

  // Synthetic credential only; the test restores any process configuration.
  const secret = 'test_only_' + 'a'.repeat(40), saved = process.env.CRON_SECRET
  t.after(() => { if (saved === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = saved })
  const url = 'https://tick.example/api/internal/readiness/ch-de-visa-tick'
  const authorized = () => ({ authorization: 'Bearer ' + secret })
  await t.test('missing or malformed server credential leaves the ingress closed', async () => {
    const before = lookups
    for (const value of [undefined, '', 'short', ' '.repeat(40), 'a'.repeat(257)]) {
      if (value === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = value
      const response = await route.GET(new Request(url, { headers: authorized() }))
      assert.equal(response.status, 503); assert.deepEqual(await response.json(), { schema: 1, status: 'unavailable' })
    }
    assert.equal(lookups, before); process.env.CRON_SECRET = secret
  })
  await t.test('unauthenticated and non-ASCII lookalikes never enter the fixed runtime', async () => {
    const before = lookups
    for (const authorization of [null, 'Bearer wrong', 'bearer ' + secret, 'Bearer ' + secret + 'x', 'Bearer ä' + secret.slice(1)]) {
      const response = await route.GET(new Request(url, { headers: authorization === null ? {} : { authorization } }))
      assert.equal(response.status, 401); assert.deepEqual(await response.json(), { schema: 1, status: 'unauthorized' })
    }
    assert.equal(lookups, before)
  })
  await t.test('authenticated query, method, framing and body inputs cannot select work', async () => {
    const before = lookups
    const requests = [new Request(url + '?method=other', { headers: authorized() }),
      new Request(url, { method: 'POST', headers: authorized(), body: 'caller work' }),
      new Request(url, { headers: { ...authorized(), 'content-length': '1' } }),
      new Request(url, { headers: { ...authorized(), 'transfer-encoding': 'chunked' } })]
    for (const request of requests) {
      const response = await route.GET(request)
      assert.equal(response.status, 400); assert.deepEqual(await response.json(), { schema: 1, status: 'request_refused' })
    }
    assert.equal(lookups, before)
  })
  await t.test('authenticated response awaits actual completion and discloses no credential or private identifiers', async () => {
    const entered = deferred<void>(), gate = deferred<Work>()
    let first = true, answered = false
    work = async () => { if (first) { first = false; entered.resolve(); return await gate.promise }; return notDue() }
    const joined = route.GET(new Request(url, { headers: authorized() })).then(value => { answered = true; return value })
    try { await entered.promise; await Promise.resolve(); assert.equal(answered, false) }
    finally { gate.resolve(notDue()); await joined }
    const response = await joined, body = await response.text()
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal(response.headers.get('vary'), 'Authorization'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(body.includes(secret), false); assert.doesNotMatch(body, /private-|receipt|operationId|jobId|sql/i)
    assert.deepEqual(JSON.parse(body).calls, { started: 3, settled: 3 }); assert.equal(JSON.parse(body).status, 'complete')
    assert.equal(route.runtime, 'nodejs'); assert.equal(route.maxDuration, 60)
    reset()
  })
})
