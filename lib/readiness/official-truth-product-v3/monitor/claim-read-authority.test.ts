import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createV3QueueCoordinator, type V3QueueStoragePort, type V3QueueCommitAuthority } from './queue'
import { fixture, queueHarness, ids, METHOD } from './test-support'

async function setup() {
  const f = fixture(), h = queueHarness()
  assert.equal((await h.queue.enqueue(f.enqueue)).status, 'confirmed')
  const claim = { operationId: ids('op3', 'fresh-read-authority'), jobKey: f.identity.jobKey,
    leaseId: ids('lease3', 'fresh-read-authority'), leaseMilliseconds: 30000 }
  h.method.control.checks = 0
  return { f, h, claim }
}

test('fresh fixed-method claim retains its own original receipt across both real reads and all existing reproofs', async () => {
  const { h, claim } = await setup(), reads: (object | undefined)[] = [], writes: V3QueueCommitAuthority[] = []
  let resolves = 0
  const storage: V3QueueStoragePort = {
    async read(key, _signal, receipt) { reads.push(receipt); return h.storage.read(key) },
    confirm: h.storage.confirm.bind(h.storage),
    async compareAndSwap(commit, authority, signal) {
      writes.push(authority); return h.storage.compareAndSwap(commit, authority, signal)
    },
  }
  const queue = createV3QueueCoordinator({ ...h.options, storage, claimMethod: METHOD, methodAuthority: {
    async resolveCurrent(...args) { resolves++; return h.method.port.resolveCurrent(...args) },
    reproveAtCommit: h.method.port.reproveAtCommit.bind(h.method.port),
  } })
  assert.equal((await queue.claim(claim)).status, 'confirmed')
  assert.equal(resolves, 1); assert.equal(writes.length, 1)
  assert.ok(reads[0]); assert.deepEqual(reads, [writes[0].receipt, writes[0].receipt])
  assert.equal(h.method.control.checks, 3, 'pre-CAS, actual adapter and after actual final read')
  reads.length = 0
  assert.equal((await queue.claim(claim)).status, 'confirmed')
  assert.deepEqual(reads, [undefined], 'historical confirmation never inherits the old receipt')
  assert.equal(writes.length, 1); assert.equal(resolves, 3, 'replay discards its speculative observation and resolves its own authority')
})

test('fresh claim mismatch gets new current custody within the same unchanged invocation', async () => {
  const { h, claim } = await setup(), receipts: object[] = [], reads: (object | undefined)[] = []
  const storage: V3QueueStoragePort = {
    async read(key, _signal, receipt) { reads.push(receipt); return h.storage.read(key) },
    confirm: h.storage.confirm.bind(h.storage),
    async compareAndSwap(commit, authority, signal) {
      receipts.push(authority.receipt)
      return receipts.length === 1 ? { status: 'mismatch' } : h.storage.compareAndSwap(commit, authority, signal)
    },
  }
  assert.equal((await createV3QueueCoordinator({ ...h.options, storage, claimMethod: METHOD }).claim(claim)).status, 'confirmed')
  assert.equal(receipts.length, 2); assert.notEqual(receipts[0], receipts[1])
  assert.deepEqual(reads, [receipts[0], receipts[1], receipts[1]])
})

test('uncertain claim confirmation discards the parallel observation without a queue read or effect', async () => {
  const { h, claim } = await setup()
  h.storage.obscureConfirm = true
  let resolves = 0, reads = 0
  const queue = createV3QueueCoordinator({ ...h.options, claimMethod: METHOD, storage: {
    async read() { reads++; assert.fail('unknown is not a fresh claim') },
    confirm: h.storage.confirm.bind(h.storage), compareAndSwap: h.storage.compareAndSwap.bind(h.storage),
  }, methodAuthority: {
    async resolveCurrent(...args) { resolves++; return h.method.port.resolveCurrent(...args) },
    reproveAtCommit: h.method.port.reproveAtCommit.bind(h.method.port),
  } })
  assert.equal((await queue.claim(claim)).status, 'unconfirmed')
  assert.equal(resolves, 1); assert.equal(reads, 0); assert.equal(h.storage.writes, 1)
})

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

test('the fixed claim joins both independent observations before its actual initial read', { timeout: 2000 }, async () => {
  const { h, claim } = await setup(), entered = deferred(), release = deferred(), events: string[] = []
  let observations = 0, completed = 0
  async function observe(name: string) {
    events.push(name + ':start')
    if (++observations === 2) entered.resolve()
    await release.promise
    completed++; events.push(name + ':end')
  }
  const queue = createV3QueueCoordinator({ ...h.options, claimMethod: METHOD, storage: {
    async confirm(op, command) { await observe('confirm'); return h.storage.confirm(op, command) },
    async read(key, signal, receipt) {
      assert.equal(completed, 2); assert.equal(signal.aborted, false); assert.ok(receipt)
      events.push('read'); return h.storage.read(key)
    },
    compareAndSwap: h.storage.compareAndSwap.bind(h.storage),
  }, methodAuthority: {
    async resolveCurrent(...args) { await observe('method'); return h.method.port.resolveCurrent(...args) },
    reproveAtCommit: h.method.port.reproveAtCommit.bind(h.method.port),
  } })
  const running = queue.claim(claim)
  try {
    await entered.promise
    assert.deepEqual(events, ['confirm:start', 'method:start'])
    assert.equal(h.storage.writes, 1)
  } finally { release.resolve() }
  assert.equal((await running).status, 'confirmed')
  assert.ok(events.indexOf('read') > events.indexOf('confirm:end'))
  assert.ok(events.indexOf('read') > events.indexOf('method:end'))
})

for (const fault of ['confirmation_rejected', 'method_rejected', 'deadline'] as const) {
  test(`parallel claim observations retain both promises through ${fault}`, { timeout: 2000 }, async () => {
    const { h, claim } = await setup(), entered = deferred(), confirmations = deferred(), methods = deferred()
    let observations = 0, settled = false, signal: AbortSignal | undefined, reads = 0
    const enter = () => { if (++observations === 2) entered.resolve() }
    const queue = createV3QueueCoordinator({ ...h.options, claimMethod: METHOD,
      invocationMilliseconds: fault === 'deadline' ? 10 : 1000,
      storage: {
        async confirm(op, command, observedSignal) {
          signal = observedSignal; enter(); await confirmations.promise
          if (fault === 'confirmation_rejected') throw new Error('synthetic confirmation failure')
          return h.storage.confirm(op, command)
        },
        async read() { reads++; assert.fail('unsettled/failed observations cannot enter the queue') },
        compareAndSwap: h.storage.compareAndSwap.bind(h.storage),
      }, methodAuthority: {
        async resolveCurrent(...args) {
          enter(); await methods.promise
          if (fault === 'method_rejected') throw new Error('synthetic observation failure')
          return h.method.port.resolveCurrent(...args)
        },
        reproveAtCommit: h.method.port.reproveAtCommit.bind(h.method.port),
      },
    })
    const running = queue.claim(claim).finally(() => { settled = true })
    try {
      await entered.promise
      if (fault === 'deadline') {
        await new Promise<void>(done => setTimeout(done, 25))
        assert.equal(signal?.aborted, true)
      }
      const first = fault === 'method_rejected' ? methods : confirmations
      first.resolve(); await new Promise<void>(done => setImmediate(done))
      assert.equal(settled, false, 'one real observation is still owned after the other fails or the deadline expires')
      assert.equal(reads, 0); assert.equal(h.storage.writes, 1)
    } finally { confirmations.resolve(); methods.resolve() }
    assert.notEqual((await running).status, 'confirmed')
    assert.equal(reads, 0); assert.equal(h.storage.writes, 1)
  })
}

test('lost claim ACK retains only its original operation and never lends old custody on retry', async () => {
  const { h, claim } = await setup(), reads: (object | undefined)[] = []
  const storage: V3QueueStoragePort = { async read(key, _signal, receipt) { reads.push(receipt); return h.storage.read(key) },
    confirm: h.storage.confirm.bind(h.storage), compareAndSwap: h.storage.compareAndSwap.bind(h.storage) }
  const queue = createV3QueueCoordinator({ ...h.options, storage, claimMethod: METHOD })
  h.storage.loseNextResponse = true
  assert.equal((await queue.claim(claim)).status, 'unconfirmed'); assert.equal(reads.length, 1); assert.ok(reads[0])
  const original = structuredClone(h.storage.records.get(claim.jobKey)), writes = h.storage.writes
  reads.length = 0
  const retried = await queue.claim(claim)
  assert.equal(retried.status, 'confirmed')
  if (retried.status === 'confirmed') assert.deepEqual(retried.record, original)
  assert.deepEqual(reads, [undefined]); assert.equal(h.storage.writes, writes)
})

for (const fault of ['revoked_after_read', 'revision_after_read', 'foreign_receipt', 'wrong_record_method',
  'invalid_binding', 'read_unavailable', 'abort_after_read'] as const) {
  test(`fresh fixed-method claim refuses ${fault} before CAS`, async () => {
    const { h, claim } = await setup(), controller = new AbortController(), other = queueHarness()
    const foreign = await other.method.port.resolveCurrent(METHOD, h.clock.now())
    assert.equal(foreign.status, 'approved')
    let attempted = 0
    const storage: V3QueueStoragePort = {
      async read(key, _signal, receipt) {
        assert.ok(receipt)
        if (fault === 'read_unavailable') return { status: 'unavailable' }
        const value = await h.storage.read(key)
        if (fault === 'revoked_after_read') h.method.control.enabled = false
        if (fault === 'revision_after_read') h.method.control.revision = 2
        if (fault === 'abort_after_read') controller.abort()
        if (fault === 'wrong_record_method' && value.status === 'ok' && value.record?.kind === 'research_job_record') {
          return { status: 'ok', record: { ...value.record, method: { ...METHOD, revision: 2 } } }
        }
        return value
      },
      confirm: h.storage.confirm.bind(h.storage),
      async compareAndSwap(commit, authority, signal) { attempted++; return h.storage.compareAndSwap(commit, authority, signal) },
    }
    const queue = createV3QueueCoordinator({ ...h.options, storage,
      claimMethod: fault === 'invalid_binding' ? { ...METHOD, revision: 0 } : METHOD,
      methodAuthority: {
        async resolveCurrent(...args) { return fault === 'foreign_receipt' ? foreign : h.method.port.resolveCurrent(...args) },
        reproveAtCommit: h.method.port.reproveAtCommit.bind(h.method.port),
      } })
    assert.notEqual((await queue.claim(claim, controller.signal)).status, 'confirmed')
    assert.equal(attempted, 0); assert.equal(h.storage.writes, 1)
  })
}

test('a late actual read after the original claim deadline cannot start CAS', async () => {
  const { h, claim } = await setup()
  let release!: () => void, entered!: () => void, attempted = 0
  const pending = new Promise<void>(done => { release = done }), started = new Promise<void>(done => { entered = done })
  const storage: V3QueueStoragePort = {
    async read(key, signal, receipt) { assert.ok(receipt); entered(); await pending; assert.equal(signal.aborted, true); return h.storage.read(key) },
    confirm: h.storage.confirm.bind(h.storage),
    async compareAndSwap(commit, authority, signal) { attempted++; return h.storage.compareAndSwap(commit, authority, signal) },
  }
  const running = createV3QueueCoordinator({ ...h.options, storage, claimMethod: METHOD, invocationMilliseconds: 10 }).claim(claim)
  await started
  assert.notEqual((await running).status, 'confirmed')
  release(); await new Promise<void>(done => setImmediate(done))
  assert.equal(attempted, 0); assert.equal(h.storage.writes, 1)
})
