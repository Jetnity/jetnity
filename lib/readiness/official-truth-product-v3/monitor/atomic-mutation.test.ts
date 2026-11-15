// Protocol fault injection. The original coordinator supplies every positive
// transition; native SQL/COMMIT/capacity evidence belongs to the PG17 gates.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readM04Command } from '../jobs/contract'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3QueueResult,
  type V3QueueStoragePort, type V3QueueAtomicMutationConfirmation, type V3ManagedJobRecord } from './queue'
import { fixture, queueHarness, ids, ref, METHOD } from './test-support'

type Action = 'enqueue' | 'complete' | 'fail'
type Atomic = NonNullable<V3QueueStoragePort['mutateAtomic']>
const turn = () => new Promise<void>(resolve => setImmediate(resolve))
function gate() {
  let release!: () => void
  const promise = new Promise<void>(resolve => { release = resolve })
  return { promise, release }
}
function confirmed(value: V3QueueResult) {
  assert.equal(value.status, 'confirmed')
  if (value.status !== 'confirmed') assert.fail('confirmation required')
  return value.record
}

async function setup(action: Action = 'fail', namespace: 'rule' | 'discovery' = 'rule', attemptLimit = 3) {
  const f = fixture(), h = queueHarness()
  const create = namespace === 'rule' ? createV3QueueCoordinator : createV3DiscoveryQueueCoordinator
  const originalOptions = { ...h.options, invocationMilliseconds: 5000, backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000 }
  const original = create(originalOptions)
  const enqueue = { ...(namespace === 'rule' ? f.enqueue : f.discoveryEnqueue), attemptLimit }
  const before = confirmed(await original.enqueue(enqueue))
  const jobKey = before.kind === 'research_job_record' ? before.jobKey : before.identity.jobKey
  const claim = { operationId: ids('op3', `mutation-claim-${namespace}-${action}`), jobKey,
    leaseId: ids('lease3', `mutation-claim-${namespace}-${action}`), leaseMilliseconds: 30000 }
  let input: Record<string, unknown> = enqueue, record = before, leased: V3ManagedJobRecord | null = null
  if (action !== 'enqueue') {
    leased = confirmed(await original.claim(claim)); assert.ok(leased.lease)
    input = { operationId: ids('op3', `mutation-${namespace}-${action}`), jobKey,
      fence: { jobId: leased.jobId, revision: leased.revision, leaseId: leased.lease.leaseId, generation: leased.lease.generation },
      ...(action === 'fail' ? { reason: 'unreachable' }
        : namespace === 'rule' ? { decisionRef: ref('source-decision', 'mutation-complete') }
          : { discoveryRef: ref('combination-discovery-result', 'mutation-complete') }) }
    record = confirmed(await original[action](input))
  }
  const command = readM04Command({ action, ...(action === 'fail' ? {} : { kind: namespace === 'rule' ? 'rule_research' : 'combination_discovery' }), input })
  assert.ok(command)
  const positive = { status: 'committed' as const, operationId: command.operationId,
    commandKey: command.commandKey, record, replayed: false }
  const calls: Parameters<Atomic>[] = [], legacy: string[] = [], events: string[] = []
  const control: { atomic: Atomic; beforeResolve?: () => Promise<void>; beforeReprove?: (at: number) => Promise<void> }
    = { atomic: async () => positive }
  let reproves = 0
  const storage: V3QueueStoragePort = {
    async read() { legacy.push('read'); throw Error('unexpected legacy read') },
    async confirm() { legacy.push('confirm'); throw Error('unexpected legacy confirm') },
    async compareAndSwap() { legacy.push('cas'); throw Error('unexpected legacy CAS') },
    async mutateAtomic(...args) { calls.push(args); events.push('atomic'); return control.atomic(...args) },
  }
  const options = { ...originalOptions, storage, claimMethod: METHOD,
    methodAuthority: {
      async resolveCurrent(...args: Parameters<typeof h.method.port.resolveCurrent>) {
        events.push('resolve'); await control.beforeResolve?.(); return h.method.port.resolveCurrent(...args)
      },
      async reproveAtCommit(...args: Parameters<typeof h.method.port.reproveAtCommit>) {
        events.push('reprove'); await control.beforeReprove?.(++reproves); return h.method.port.reproveAtCommit(...args)
      },
    } }
  const queue = create(options)
  return { f, h, create, original, originalOptions, options, queue, action, input, before, leased, record, claim, command,
    positive, calls, legacy, events, control, invoke: (signal?: AbortSignal) => queue[action](input, signal) }
}

for (const namespace of ['rule', 'discovery'] as const) for (const action of ['enqueue', 'complete', 'fail'] as const) {
  test(`atomic ${namespace} ${action} preserves the independent original transition and real method custody`, async () => {
    const s = await setup(action, namespace)
    assert.deepEqual(await s.invoke(), { status: 'confirmed', record: s.record, replayed: false })
    assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
    const [op, command, authority, signal] = s.calls[0]
    assert.deepEqual([op, command], [s.command.operationId, s.command.commandKey])
    assert.ok(Object.isFrozen(authority)); assert.ok(Object.isFrozen(authority.method))
    assert.ok(s.h.method.isCurrent(authority.receipt, METHOD)); assert.equal(signal.aborted, true, 'finished invocation retires its signal')
    assert.deepEqual(s.events, ['resolve', 'reprove', 'atomic', 'reprove'])
  })
}

test('atomic failure preserves last-attempt exhaustion and the original bounded backoff', async () => {
  const last = await setup('fail', 'rule', 1)
  assert.equal(last.record.state, 'exhausted'); confirmed(await last.invoke())
  const retry = await setup('fail')
  assert.equal(retry.record.state, 'backoff'); confirmed(await retry.invoke())
  retry.control.atomic = async () => ({ ...retry.positive, record: { ...retry.record,
    nextAttemptAt: new Date(Date.parse(retry.record.nextAttemptAt!) + 1).toISOString() } })
  assert.notEqual((await retry.invoke()).status, 'confirmed')
})

test('atomic enqueue retains an older active cycle when the original operation deduplicates', async () => {
  const s = await setup('enqueue'), input = { ...s.input, operationId: ids('op3', 'different-enqueue'), jobId: ids('job3', 'different-cycle') }
  const dedup = confirmed(await s.original.enqueue(input)), command = readM04Command({ action: 'enqueue', kind: 'rule_research', input })
  assert.ok(command); assert.notEqual(dedup.jobId, input.jobId)
  s.control.atomic = async () => ({ ...s.positive, operationId: command.operationId, commandKey: command.commandKey, record: dedup })
  assert.deepEqual(await s.queue.enqueue(input), { status: 'confirmed', record: dedup, replayed: false })
  assert.deepEqual(s.legacy, [])
})

for (const action of ['enqueue', 'fail'] as const) {
  test(`atomic ${action} replay returns the genuinely advanced current generation of the same cycle`, async () => {
    const s = await setup(action)
    if (action === 'fail') s.h.clock.advance(1000)
    const current = confirmed(await s.original.claim({ ...s.claim, operationId: ids('op3', 'advanced-' + action), leaseId: ids('lease3', 'advanced-' + action) }))
    assert.equal(current.jobId, s.record.jobId); assert.ok(current.revision > s.record.revision)
    s.control.atomic = async () => ({ ...s.positive, record: current, replayed: true })
    assert.deepEqual(await s.invoke(), { status: 'confirmed', record: current, replayed: true })
    s.control.atomic = async () => ({ ...s.positive, record: current, replayed: false })
    if (action === 'fail') assert.notEqual((await s.invoke()).status, 'confirmed')
  })
}

for (const status of ['collision', 'unconfirmed', 'unavailable', 'superseded', 'mismatch'] as const) {
  test(`atomic mutation ${status} never starts a replacement read/CAS or operation`, async () => {
    const s = await setup(); s.control.atomic = async () => ({ status })
    assert.deepEqual(await s.invoke(), { status: status === 'mismatch' ? 'contended' : status })
    assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
    assert.deepEqual(s.events, ['resolve', 'reprove', 'atomic'])
  })
}

for (const fault of ['operation', 'command', 'replayed', 'method', 'future', 'job', 'revision', 'reason', 'extra'] as const) {
  test(`atomic mutation refuses a positive ACK with changed ${fault}`, async () => {
    const s = await setup()
    let value: unknown = s.positive
    if (fault === 'operation') value = { ...s.positive, operationId: ids('op3', 'foreign') }
    if (fault === 'command') value = { ...s.positive, commandKey: ref('queue-command', 'foreign') }
    if (fault === 'replayed') value = { ...s.positive, replayed: 1 }
    if (fault === 'method') value = { ...s.positive, record: { ...s.record, method: { ...METHOD, revision: 2 } } }
    if (fault === 'future') value = { ...s.positive, record: { ...s.record,
      updatedAt: new Date(Date.parse(s.h.clock.now()) + 1).toISOString() } }
    if (fault === 'job') value = { ...s.positive, record: { ...s.record, jobId: ids('job3', 'foreign') } }
    if (fault === 'revision') value = { ...s.positive, record: { ...s.record, revision: s.record.revision + 1, predecessorRevision: s.record.revision } }
    if (fault === 'reason') value = { ...s.positive, record: { ...s.record, lastFailure: 'invalid_proposal' } }
    if (fault === 'extra') value = { ...s.positive, record: { ...s.record, privateProof: true } }
    s.control.atomic = async () => value as V3QueueAtomicMutationConfirmation
    assert.notEqual((await s.invoke()).status, 'confirmed'); assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
  })
}

test('successful completion requires its actual result reference and namespace', async () => {
  const s = await setup('complete'), other = await setup('complete', 'discovery')
  s.control.atomic = async () => ({ ...s.positive, record: { ...s.record, resultDecisionRef: ref('source-decision', 'foreign') } })
  assert.notEqual((await s.invoke()).status, 'confirmed')
  s.control.atomic = async () => ({ ...s.positive, record: other.record })
  assert.notEqual((await s.invoke()).status, 'confirmed'); assert.deepEqual(s.legacy, [])
})

for (const phase of ['pre', 'post'] as const) for (const fault of ['revoked', 'revision'] as const) {
  test(`atomic mutation refuses ${fault} MA1 at the ${phase}-effect reproof`, async () => {
    const s = await setup()
    s.control.beforeReprove = async at => {
      if (at !== (phase === 'pre' ? 1 : 2)) return
      if (fault === 'revoked') s.h.method.control.enabled = false
      else s.h.method.control.revision = 2
    }
    assert.equal((await s.invoke()).status, 'unavailable')
    assert.equal(s.calls.length, phase === 'pre' ? 0 : 1); assert.deepEqual(s.legacy, [])
  })
}

test('enqueue takes method custody from its actual input; terminal mutations require a fixed server method', async () => {
  for (const action of ['enqueue', 'complete', 'fail'] as const) {
    const s = await setup(action), queue = s.create({ ...s.options, claimMethod: undefined })
    const result = await queue[action](s.input)
    assert.equal(result.status, action === 'enqueue' ? 'confirmed' : 'unavailable')
    assert.equal(s.calls.length, action === 'enqueue' ? 1 : 0); assert.deepEqual(s.legacy, [])
  }
})

test('an atomic mutation refuses a different backoff policy before acquiring authority or SQL', async () => {
  for (const change of [{ backoffBaseMilliseconds: 100 }, { backoffMaxMilliseconds: 40000 }]) {
    const s = await setup(), queue = s.create({ ...s.options, ...change })
    assert.equal((await queue.fail(s.input)).status, 'unavailable')
    assert.deepEqual(s.events, []); assert.deepEqual(s.legacy, [])
  }
})

test('lost mutation ACK permits only explicit same-ID replay and never a hidden replacement effect', async () => {
  const s = await setup(); let writes = 0
  s.control.atomic = async (_op, command) => {
    if (command !== s.command.commandKey) return { status: 'collision' }
    if (!writes) { writes++; return { status: 'unconfirmed' } }
    return { ...s.positive, replayed: true }
  }
  assert.equal((await s.invoke()).status, 'unconfirmed')
  assert.deepEqual(await s.invoke(), { status: 'confirmed', record: s.record, replayed: true })
  assert.equal((await s.queue.fail({ ...s.input, reason: 'invalid_proposal' })).status, 'collision')
  assert.equal(writes, 1); assert.equal(s.calls.length, 3); assert.deepEqual(s.legacy, [])
})

test('a throwing mutation transport remains uncertain with no legacy fallback', async () => {
  const s = await setup(); s.control.atomic = async () => { throw Error('possible COMMIT, lost reply') }
  assert.equal((await s.invoke()).status, 'unconfirmed'); assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
})

for (const phase of ['resolve', 'pre', 'effect', 'effect_reject', 'post'] as const) {
  test(`atomic mutation abort joins the actual ${phase} promise before returning`, { timeout: 3000 }, async () => {
    const s = await setup(), entered = gate(), held = gate(), controller = new AbortController()
    const hold = async () => { entered.release(); await held.promise }
    if (phase === 'resolve') s.control.beforeResolve = hold
    else if (phase === 'pre' || phase === 'post') s.control.beforeReprove = async at => { if (at === (phase === 'pre' ? 1 : 2)) await hold() }
    else s.control.atomic = async () => { await hold(); if (phase === 'effect_reject') throw Error('late rejected mutation'); return s.positive }
    let settled = false
    const running = s.invoke(controller.signal).finally(() => { settled = true })
    try { await entered.promise; controller.abort(); await turn(); assert.equal(settled, false) } finally { held.release() }
    assert.notEqual((await running).status, 'confirmed')
    assert.equal(s.calls.length, phase === 'resolve' || phase === 'pre' ? 0 : 1); assert.deepEqual(s.legacy, [])
  })
}

test('all mutation phases consume the same original 5000ms window and drain after expiry', async t => {
  const s = await setup(), entered = gate(), held = gate()
  let before: boolean | undefined, after: boolean | undefined
  t.mock.timers.enable({ apis: ['setTimeout'] })
  s.control.beforeResolve = async () => { t.mock.timers.tick(2000) }
  s.control.beforeReprove = async at => { if (at === 1) t.mock.timers.tick(1500) }
  s.control.atomic = async (_op, _key, _authority, signal) => {
    t.mock.timers.tick(1499); before = signal.aborted
    t.mock.timers.tick(1); after = signal.aborted
    entered.release(); await held.promise; return s.positive
  }
  let settled = false
  const pending = s.invoke().finally(() => { settled = true })
  try { await entered.promise; await turn(); assert.equal(settled, false) } finally { held.release() }
  assert.equal((await pending).status, 'unconfirmed'); assert.equal(before, false); assert.equal(after, true)
  assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
})

test('pre-abort starts neither method proof nor an atomic mutation', async () => {
  const s = await setup(), controller = new AbortController(); controller.abort()
  assert.notEqual((await s.invoke(controller.signal)).status, 'confirmed')
  assert.deepEqual(s.events, []); assert.deepEqual(s.legacy, [])
})

test('a mutation capability never changes the original claim path', async () => {
  const f = fixture(), h = queueHarness(); let mutations = 0
  confirmed(await h.queue.enqueue(f.enqueue))
  const storage: V3QueueStoragePort = { read: h.storage.read.bind(h.storage), confirm: h.storage.confirm.bind(h.storage),
    compareAndSwap: h.storage.compareAndSwap.bind(h.storage), async mutateAtomic() { mutations++; throw Error('not a mutation') } }
  const queue = createV3QueueCoordinator({ ...h.options, storage, claimMethod: METHOD })
  confirmed(await queue.claim({ operationId: ids('op3', 'legacy-claim'), jobKey: f.identity.jobKey,
    leaseId: ids('lease3', 'legacy-claim'), leaseMilliseconds: 30000 }))
  assert.equal(mutations, 0)
})
