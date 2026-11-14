// Offline observation/control-flow tests only; no live source, SQL or authority.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test, type TestContext } from 'node:test'
import { createV3ImportCoordinator } from '../import/service-server'
import { makeSyntheticOriginals } from '../integration/test-support/originals'
import { makeSyntheticStore } from '../integration/test-support/store'
import { traceDevDiagnosticStage as trace, withDevDiagnosticBudget as budget, withDevImportDiagnostics as observe } from './dev-diagnostics'

type Event = Record<string, string | number | null>
const signal = () => new AbortController().signal
const parsed = (lines: string[]): Event[] => lines.map(line => JSON.parse(line) as Event)
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
function region(t: TestContext, value: string | undefined) {
  const before = process.env.VERCEL_REGION
  if (value === undefined) delete process.env.VERCEL_REGION
  else process.env.VERCEL_REGION = value
  t.after(() => { if (before === undefined) delete process.env.VERCEL_REGION; else process.env.VERCEL_REGION = before })
}

test('diagnostics remain absent outside the opened context and after its awaited closure', async t => {
  const lines: string[] = []
  t.mock.method(console, 'info', (line: string) => { lines.push(line) })
  const value = Object.freeze({ status: 'prepared' }), held = deferred<void>()
  const original = Promise.resolve(value)
  assert.equal(trace('i1_prepare', signal(), () => original), original)
  assert.equal(await budget('tick', 0, 30000, () => trace('i1_prepare', signal(), async () => value)), value)
  assert.deepEqual(lines, [])
  let inherited!: Promise<unknown>
  await observe(async () => {
    // Emulate an inherited asynchronous resource after the caller has completed;
    // it may not reopen logging. No product cleanup is detached by the helper.
    inherited = held.promise.then(() => trace('i1_finish', signal(), async () => value))
    return value
  })
  held.resolve(); assert.equal(await inherited, value)
  assert.deepEqual(lines, [])
})

test('only fixed fields, statuses and actual allowlisted regions reach bounded JSON lines', async t => {
  region(t, 'private-region?token=private-material')
  const lines: string[] = [], sink = (line: string) => { lines.push(line) }
  let getters = 0
  const foreign = { get status() { getters++; throw Error('private-exception') }, secret: 'private-token' }
  const unknown = { status: 'private-status-' + 'x'.repeat(5000), ticket: 'private-ticket' }
  await observe(async () => {
    assert.equal(await trace('i1_prepare', signal(), async () => foreign), foreign)
    assert.equal(await trace('i1_finish', signal(), async () => unknown), unknown)
    await trace('private-stage' as never, signal(), async () => unknown)
    await budget('private-budget' as never, 0, 30000, () => trace('i1_reserve', signal(), async () => ({ status: 'acquired' })))
  }, sink)
  assert.equal(getters, 0); assert.equal(lines.length, 6)
  const expected = ['schema', 'kind', 'sequence', 'stage', 'phase', 'outcome', 'returnedStatus', 'returnedDetail', 'region', 'span',
    'callsStarted', 'callsSettled', 'elapsedMilliseconds', 'stageElapsedMilliseconds', 'budget', 'budgetMilliseconds',
    'budgetElapsedMilliseconds', 'remainingMilliseconds'].sort()
  for (const event of parsed(lines)) {
    assert.deepEqual(Object.keys(event).sort(), expected)
    assert.equal(event.region, 'unlisted'); assert.equal(event.budget, null)
  }
  assert.equal(parsed(lines)[1]!.returnedStatus, null)
  assert.equal(parsed(lines)[3]!.returnedStatus, null)
  assert.equal(parsed(lines)[5]!.returnedStatus, 'acquired')
  assert.doesNotMatch(lines.join('\n'), /private-|secret|ticket|token|exception/)
  for (const value of [undefined, '', 'fra1']) {
    if (value === undefined) delete process.env.VERCEL_REGION; else process.env.VERCEL_REGION = value
    const fresh: string[] = []
    await observe(() => trace('method_precheck', signal(), async () => 'approved'), line => { fresh.push(line) })
    assert.equal(parsed(fresh)[0]!.region, value ? 'fra1' : 'unavailable')
  }
})

test('job observations retain only the fixed actual importer/confirmation outcome', async () => {
  const lines: string[] = []
  await observe(async () => {
    await trace('job_import', signal(), async () => ({ status: 'completed', outcome: { status: 'quarantined', reason: 'private-reason' } }))
    await trace('job_import_confirm', signal(), async () => ({ status: 'completed', outcome: { status: 'prepared', value: 'private-ticket' } }))
    await trace('job_import', signal(), async () => ({ status: 'outcome_unknown', operationId: 'private-operation' }))
    await trace('job_prepare', signal(), async () => null)
    await trace('job_prepare', signal(), async () => Object.freeze({}))
  }, line => { lines.push(line) })
  assert.deepEqual(parsed(lines).filter(event => event.phase === 'settled').map(event => [event.returnedStatus, event.returnedDetail]),
    [['completed', 'quarantined'], ['completed', 'prepared'], ['outcome_unknown', null], [null, 'no_receipt'], [null, 'receipt_returned']])
  assert.doesNotMatch(lines.join('\n'), /private-/)
})

test('event count, line bytes and numeric counters stay bounded without limiting the work', async () => {
  const lines: string[] = []
  let work = 0
  await observe(async () => {
    for (let n = 0; n < 150; n++) await trace('i1_history_read', signal(), async () => { work++; return { status: 'snapshot' } })
  }, line => { lines.push(line) })
  assert.equal(work, 150); assert.equal(lines.length, 128)
  for (const [index, event] of parsed(lines).entries()) {
    assert.ok(Buffer.byteLength(lines[index]!, 'utf8') <= 1024)
    assert.equal(event.sequence, index + 1)
    assert.ok(Number(event.callsSettled) <= Number(event.callsStarted))
    assert.ok(Number(event.callsStarted) <= 128)
  }
})

test('concurrent invocation regions, counters, closure and absolute budgets are isolated', async t => {
  region(t, 'fra1')
  let now = 1000
  t.mock.method(performance, 'now', () => now)
  const first: string[] = [], second: string[] = [], hold = deferred<void>()
  const one = observe(() => budget('tick', 1000, 31000, () => trace('tick_discovery', signal(), async () => {
    await hold.promise; return { status: 'processed' }
  })), line => { first.push(line) })
  process.env.VERCEL_REGION = 'sin1'
  now = 2000
  await observe(() => budget('i1', 2000, 7000, () => trace('i1_reserve', signal(), async () => ({ status: 'acquired' }))),
    line => { second.push(line) })
  now = 3000; hold.resolve(); await one
  for (const lines of [first, second]) {
    assert.deepEqual(parsed(lines).map(event => event.sequence), [1, 2])
    assert.deepEqual(parsed(lines).map(event => event.callsSettled), [0, 1])
  }
  assert.ok(parsed(first).every(event => event.region === 'fra1' && event.budget === 'tick' && event.budgetMilliseconds === 30000))
  assert.ok(parsed(second).every(event => event.region === 'sin1' && event.budget === 'i1' && event.budgetMilliseconds === 5000))
  assert.equal(parsed(first)[1]!.remainingMilliseconds, 28000)
  assert.equal(parsed(second)[1]!.remainingMilliseconds, 5000)
})

test('nested I1 observations consume the original tick deadline and cannot report a late positive status', async t => {
  let now = 1000
  t.mock.method(performance, 'now', () => now)
  const lines: string[] = []
  await observe(() => budget('tick', 1000, 31000, async () => {
    now = 27000
    await budget('i1', 27000, 32000, async () => {
      await trace('i1_evidence_reproof', signal(), async () => { now = 29000; return { status: 'current' } })
      await trace('i1_method_reproof', signal(), async () => { now = 31000; return { status: 'current' } })
    })
  }), line => { lines.push(line) })
  const events = parsed(lines)
  assert.deepEqual(events.map(event => event.remainingMilliseconds), [4000, 2000, 2000, 0])
  assert.ok(events.every(event => event.budgetMilliseconds === 5000))
  assert.equal(events[3]!.outcome, 'budget_ended'); assert.equal(events[3]!.returnedStatus, null)
  assert.equal(events[3]!.budgetElapsedMilliseconds, 4000)
})

test('abort waits for actual settlement; absent, missing or throwing sinks preserve value and error identity', async t => {
  const lines: string[] = [], value = { status: 'prepared' }, error = Error('private-provider-error')
  let sinkCalls = 0
  const throwing = () => { sinkCalls++; throw Error('private-logger-error') }
  for (const sink of [null, throwing, (line: string) => { lines.push(line) }]) {
    const abort = new AbortController(), hold = deferred<void>()
    let settled = false
    const pending = observe(() => trace('source_attest', abort.signal, async () => { await hold.promise; return value }), sink)
      .then(result => { settled = true; return result })
    abort.abort(); await Promise.resolve()
    assert.equal(settled, false)
    hold.resolve(); assert.equal(await pending, value)
    await assert.rejects(observe(() => trace('source_evidence_read', signal(), async () => { throw error }), sink),
      thrown => thrown === error)
  }
  assert.equal(sinkCalls, 2) // disabled after the first failure in each invocation
  assert.equal(parsed(lines)[1]!.outcome, 'aborted'); assert.equal(parsed(lines)[1]!.returnedStatus, null)
  assert.equal(parsed(lines)[3]!.outcome, 'threw'); assert.equal(parsed(lines)[3]!.returnedStatus, null)
  assert.doesNotMatch(lines.join('\n'), /private-provider-error/)
  const descriptor = Object.getOwnPropertyDescriptor(console, 'info')!
  Object.defineProperty(console, 'info', { ...descriptor, value: undefined })
  t.after(() => { Object.defineProperty(console, 'info', descriptor) })
  assert.equal(await observe(() => trace('i1_finish', signal(), async () => value)), value)
})

test('actual I1 flow preserves every result and records its configured budget at all awaited stages', async () => {
  for (const budgetMilliseconds of [5000, 30000]) {
    const originals = makeSyntheticOriginals(), store = makeSyntheticStore(originals)
    const lines: string[] = []
    const result = await observe(() => createV3ImportCoordinator(store.importPorts, { budgetMilliseconds })
      .submit(JSON.stringify(originals.proposal('diagnostic-' + budgetMilliseconds))), line => { lines.push(line) })
    assert.equal(result.status, 'completed')
    if (result.status !== 'completed') assert.fail('synthetic import did not complete')
    assert.equal(result.outcome.status, 'prepared')
    assert.equal(store.counts.importWrites, 1)
    assert.deepEqual(parsed(lines).filter(event => event.phase === 'started').map(event => event.stage), [
      'i1_reserve', 'i1_prepare', 'i1_method_resolve', 'i1_history_read', 'i1_evidence_inspect',
      'i1_evidence_reproof', 'i1_history_reproof', 'i1_method_reproof', 'i1_finish',
    ])
    assert.ok(parsed(lines).every(event => event.budget === 'i1' && event.budgetMilliseconds === budgetMilliseconds))
    assert.equal(parsed(lines).at(-1)!.callsStarted, 9)
    assert.equal(parsed(lines).at(-1)!.callsSettled, 9)
    assert.doesNotMatch(lines.join('\n'), /op3_|job3_|source-decision:|rule-version:|https?:/)
  }
})
