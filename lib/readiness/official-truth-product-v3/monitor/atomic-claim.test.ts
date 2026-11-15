// Protocol fault injection only. SQL transaction/capacity evidence is native.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readM04Command } from '../jobs/contract'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3QueueResult,
  type V3QueueStoragePort, type V3QueueAtomicClaimConfirmation } from './queue'
import { fixture, queueHarness, ids, ref, METHOD } from './test-support'

type Atomic = NonNullable<V3QueueStoragePort['claimAtomic']>
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

async function setup(namespace: 'rule' | 'discovery' = 'rule') {
  const f = fixture(), h = queueHarness(), original = namespace === 'rule' ? h.queue : h.discovery
  // The unchanged adapter has no atomic capability and independently generates
  // a real complete predecessor/acquisition through the original coordinator.
  const before = confirmed(await original.enqueue(namespace === 'rule' ? f.enqueue : f.discoveryEnqueue))
  const jobKey = before.kind === 'research_job_record' ? before.jobKey : before.identity.jobKey
  const claim = { operationId: ids('op3', 'atomic-' + namespace), jobKey,
    leaseId: ids('lease3', 'atomic-' + namespace), leaseMilliseconds: 30000 }
  const record = confirmed(await original.claim(claim))
  const command = readM04Command({ action: 'claim', input: claim }); assert.ok(command)
  const positive = { status: 'committed' as const, operationId: claim.operationId,
    commandKey: command.commandKey, record, replayed: false }
  const legacy: string[] = [], calls: Parameters<Atomic>[] = [], events: string[] = []
  const control: {
    atomic: Atomic; beforeResolve?: () => Promise<void>; beforeReprove?: (at: number) => Promise<void>
  } = { atomic: async () => positive }
  let reproves = 0
  const storage: V3QueueStoragePort = {
    async read() { legacy.push('read'); throw Error('unexpected legacy read') },
    async confirm() { legacy.push('confirm'); throw Error('unexpected legacy confirm') },
    async compareAndSwap() { legacy.push('cas'); throw Error('unexpected legacy CAS') },
    async claimAtomic(...args) { calls.push(args); events.push('atomic'); return control.atomic(...args) },
  }
  const options = { ...h.options, storage, claimMethod: METHOD, invocationMilliseconds: 5000,
    methodAuthority: {
      async resolveCurrent(...args: Parameters<typeof h.method.port.resolveCurrent>) {
        events.push('resolve'); await control.beforeResolve?.(); return h.method.port.resolveCurrent(...args)
      },
      async reproveAtCommit(...args: Parameters<typeof h.method.port.reproveAtCommit>) {
        events.push('reprove'); await control.beforeReprove?.(++reproves); return h.method.port.reproveAtCommit(...args)
      },
    } }
  const create = namespace === 'rule' ? createV3QueueCoordinator : createV3DiscoveryQueueCoordinator
  return { f, h, before, record, claim, command, positive, control, calls, legacy, events,
    options, queue: create(options), create }
}

for (const namespace of ['rule', 'discovery'] as const) for (const replayed of [false, true]) {
  test(`atomic ${namespace} ${replayed ? 'replay' : 'fresh'} claim keeps exact custody and both real method reproofs`, async () => {
    const s = await setup(namespace)
    let invokedAfterAbort: boolean | undefined
    s.control.atomic = async (_op, _command, _authority, signal) => {
      invokedAfterAbort = signal.aborted
      return { ...s.positive, replayed }
    }
    assert.deepEqual(await s.queue.claim(s.claim), { status: 'confirmed', record: s.record, replayed })
    const [op, command, authority] = s.calls[0]
    assert.equal(op, s.claim.operationId); assert.equal(command, s.command.commandKey)
    assert.equal(invokedAfterAbort, false); assert.ok(Object.isFrozen(authority))
    assert.ok(Object.isFrozen(authority.method), 'the adapter cannot rewrite the retained method binding')
    assert.ok(s.h.method.isCurrent(authority.receipt, METHOD))
    assert.deepEqual(s.events, ['resolve', 'reprove', 'atomic', 'reprove'])
    assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
  })
}

for (const status of ['collision', 'unconfirmed', 'unavailable', 'not_due', 'superseded', 'mismatch'] as const) {
  test(`atomic ${status} never retries through the legacy read/confirm/CAS path`, async () => {
    const s = await setup(); s.control.atomic = async () => ({ status })
    assert.deepEqual(await s.queue.claim(s.claim), { status: status === 'mismatch' ? 'contended' : status })
    assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
    assert.deepEqual(s.calls[0].slice(0, 2), [s.claim.operationId, s.command.commandKey])
  })
}

for (const fault of ['operation', 'command', 'replayed', 'queued', 'lease_id', 'lease_duration',
  'generation', 'future', 'method', 'extra'] as const) {
  test(`atomic positive ACK rejects ${fault} without borrowing another claim`, async () => {
    const s = await setup(); assert.ok(s.record.lease)
    let value: unknown = s.positive
    if (fault === 'operation') value = { ...s.positive, operationId: ids('op3', 'foreign') }
    if (fault === 'command') value = { ...s.positive, commandKey: ref('queue-command', 'foreign') }
    if (fault === 'replayed') value = { ...s.positive, replayed: 'false' }
    if (fault === 'queued') value = { ...s.positive, record: s.before }
    if (fault === 'lease_id') value = { ...s.positive, record: { ...s.record,
      lease: { ...s.record.lease, leaseId: ids('lease3', 'foreign') } } }
    if (fault === 'lease_duration') value = { ...s.positive, record: { ...s.record,
      lease: { ...s.record.lease, expiresAt: new Date(Date.parse(s.record.lease.expiresAt) + 1).toISOString() } } }
    if (fault === 'generation') value = { ...s.positive, record: { ...s.record,
      lease: { ...s.record.lease, generation: s.record.revision + 1 } } }
    if (fault === 'future') value = { ...s.positive, record: { ...s.record,
      updatedAt: new Date(Date.parse(s.h.clock.now()) + 1).toISOString(), lease: { ...s.record.lease,
        acquiredAt: new Date(Date.parse(s.h.clock.now()) + 1).toISOString(),
        expiresAt: new Date(Date.parse(s.record.lease.expiresAt) + 1).toISOString() } } }
    if (fault === 'method') value = { ...s.positive, record: { ...s.record, method: { ...METHOD, revision: 2 } } }
    if (fault === 'extra') value = { ...s.positive, record: { ...s.record, privateClaim: 'not a record field' } }
    s.control.atomic = async () => value as V3QueueAtomicClaimConfirmation
    assert.notEqual((await s.queue.claim(s.claim)).status, 'confirmed')
    assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
  })
}

test('a valid record in the wrong namespace and an expired exact replay confer no lease', async () => {
  const s = await setup(), other = await setup('discovery')
  s.control.atomic = async () => ({ ...s.positive, record: other.record })
  assert.notEqual((await s.queue.claim(s.claim)).status, 'confirmed')
  s.h.clock.advance(s.claim.leaseMilliseconds)
  s.control.atomic = async () => ({ ...s.positive, replayed: true })
  assert.notEqual((await s.queue.claim(s.claim)).status, 'confirmed')
  assert.equal(s.calls.length, 2); assert.deepEqual(s.legacy, [])
})

for (const phase of ['pre', 'post'] as const) for (const fault of ['revoked', 'revision'] as const) {
  test(`atomic claim fails closed when MA1 is ${fault} at ${phase}-commit reproof`, async () => {
    const s = await setup()
    s.control.beforeReprove = async at => {
      if (at === (phase === 'pre' ? 1 : 2)) {
        if (fault === 'revoked') s.h.method.control.enabled = false
        else s.h.method.control.revision = 2
      }
    }
    assert.equal((await s.queue.claim(s.claim)).status, 'unavailable')
    assert.equal(s.calls.length, phase === 'pre' ? 0 : 1); assert.deepEqual(s.legacy, [])
  })
}

test('missing atomic method authority cannot silently select the old path', async () => {
  const s = await setup()
  for (const options of [{ ...s.options, claimMethod: undefined }, { ...s.options, methodAuthority: null }]) {
    assert.equal((await s.create(options).claim(s.claim)).status, 'unavailable')
  }
  assert.equal(s.calls.length, 0); assert.deepEqual(s.legacy, [])
})

test('lost ACK is recovered only by an explicit same-ID replay, with no hidden replacement effect', async () => {
  const s = await setup(); let writes = 0
  s.control.atomic = async (op, command) => {
    assert.equal(op, s.claim.operationId)
    if (command !== s.command.commandKey) return { status: 'collision' }
    if (!writes) { writes++; return { status: 'unconfirmed' } }
    return { ...s.positive, replayed: true }
  }
  assert.equal((await s.queue.claim(s.claim)).status, 'unconfirmed'); assert.equal(s.calls.length, 1)
  assert.deepEqual(await s.queue.claim(s.claim), { status: 'confirmed', record: s.record, replayed: true })
  assert.equal((await s.queue.claim({ ...s.claim, leaseId: ids('lease3', 'same-op-other-command') })).status, 'collision')
  assert.equal(writes, 1); assert.equal(s.calls.length, 3); assert.deepEqual(s.legacy, [])
})

test('throwing atomic transport leaves one uncertain attempt and no legacy retry', async () => {
  const s = await setup(); s.control.atomic = async () => { throw Error('lost transport after possible COMMIT') }
  assert.equal((await s.queue.claim(s.claim)).status, 'unconfirmed')
  assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
})

for (const phase of ['resolve', 'pre', 'effect', 'effect_reject', 'post'] as const) {
  test(`atomic abort drains the actual pending ${phase} promise before returning`, { timeout: 3000 }, async () => {
    const s = await setup(), entered = gate(), held = gate(), controller = new AbortController()
    const hold = async () => { entered.release(); await held.promise }
    if (phase === 'resolve') s.control.beforeResolve = hold
    else if (phase === 'pre' || phase === 'post') s.control.beforeReprove = async at => {
      if (at === (phase === 'pre' ? 1 : 2)) await hold()
    }
    else s.control.atomic = async () => {
      await hold(); if (phase === 'effect_reject') throw Error('late transport rejection')
      return s.positive
    }
    let settled = false
    const running = s.queue.claim(s.claim, controller.signal).finally(() => { settled = true })
    try {
      await entered.promise; controller.abort(); await turn()
      assert.equal(settled, false, 'cancellation is not an executor/method drain')
    } finally { held.release() }
    assert.notEqual((await running).status, 'confirmed')
    assert.equal(s.calls.length, phase === 'resolve' || phase === 'pre' ? 0 : 1)
    assert.deepEqual(s.legacy, [])
  })
}

test('resolve, reproof and atomic operation consume one original 5000ms budget', async t => {
  const s = await setup(), entered = gate(), held = gate()
  let beforeDeadline: boolean | undefined, atDeadline: boolean | undefined
  t.mock.timers.enable({ apis: ['setTimeout'] })
  s.control.beforeResolve = async () => { t.mock.timers.tick(2000) }
  s.control.beforeReprove = async at => { if (at === 1) t.mock.timers.tick(1500) }
  s.control.atomic = async (_op, _command, _authority, signal) => {
    t.mock.timers.tick(1499); beforeDeadline = signal.aborted
    t.mock.timers.tick(1); atDeadline = signal.aborted
    entered.release(); await held.promise; return s.positive
  }
  let settled = false
  const running = s.queue.claim(s.claim).finally(() => { settled = true })
  try { await entered.promise; await turn(); assert.equal(settled, false) } finally { held.release() }
  assert.equal((await running).status, 'unconfirmed')
  assert.equal(beforeDeadline, false)
  assert.equal(atDeadline, true, 'the original deadline was not reset by an intermediate phase')
  assert.equal(s.calls.length, 1); assert.deepEqual(s.legacy, [])
})

test('a pre-aborted atomic claim acquires neither method custody nor a database operation', async () => {
  const s = await setup(), controller = new AbortController(); controller.abort()
  assert.notEqual((await s.queue.claim(s.claim, controller.signal)).status, 'confirmed')
  assert.deepEqual(s.events, []); assert.deepEqual(s.legacy, [])
})

test('enqueue, complete and fail keep their original path even with an atomic claim capability', async () => {
  for (const action of ['enqueue', 'complete', 'fail'] as const) {
    const f = fixture(), h = queueHarness(); let atomic = 0
    const storage: V3QueueStoragePort = { read: h.storage.read.bind(h.storage), confirm: h.storage.confirm.bind(h.storage),
      compareAndSwap: h.storage.compareAndSwap.bind(h.storage),
      async claimAtomic() { atomic++; throw Error('claim capability used by ' + action) } }
    const queue = createV3QueueCoordinator({ ...h.options, storage, claimMethod: METHOD })
    if (action === 'enqueue') confirmed(await queue.enqueue(f.enqueue))
    else {
      confirmed(await h.queue.enqueue(f.enqueue))
      const record = confirmed(await h.queue.claim({ operationId: ids('op3', action), jobKey: f.identity.jobKey,
        leaseId: ids('lease3', action), leaseMilliseconds: 30000 }))
      assert.ok(record.lease)
      const input = { operationId: ids('op3', action + '-terminal'), jobKey: f.identity.jobKey,
        fence: { jobId: record.jobId, revision: record.revision, leaseId: record.lease.leaseId, generation: record.lease.generation } }
      confirmed(action === 'complete' ? await queue.complete({ ...input, decisionRef: ref('source-decision', action) })
        : await queue.fail({ ...input, reason: 'unreachable' }))
    }
    assert.equal(atomic, 0)
  }
})
