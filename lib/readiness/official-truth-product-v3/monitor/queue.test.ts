import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createV3CombinationDiscoveryIdentity } from '../contract'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3QueueResult, type V3JobFence } from './queue'
import { officialTruthV3MonitoringRuntime } from './runtime'
import { fixture, queueHarness, ids, ref, must, METHOD } from './test-support'

function confirmed(value: V3QueueResult) { if (value.status !== 'confirmed') assert.fail(value.status); return value.record }
function fence(value: V3QueueResult): V3JobFence {
  const job = confirmed(value); assert.equal(job.state, 'leased'); assert.ok(job.lease)
  return { jobId: job.jobId, revision: job.revision, leaseId: job.lease.leaseId, generation: job.lease.generation }
}

describe('M1 atomic queue and separate discovery identity', () => {
  for (const namespace of ['rule', 'discovery'] as const) {
    const setup = () => {
      const f = fixture(), h = queueHarness(), queue = namespace === 'rule' ? h.queue : h.discovery
      const enqueue = namespace === 'rule' ? f.enqueue : f.discoveryEnqueue
      const key = namespace === 'rule' ? f.identity.jobKey : must(createV3CombinationDiscoveryIdentity({
        destinationCountryCode: 'AQ', citizenshipCountryCode: 'CH', method: METHOD })).jobKey
      const claim = { operationId: ids('op3', 'r2-first'), jobKey: key, leaseId: ids('lease3', 'r2-first'), leaseMilliseconds: 100 }
      const complete = (owned: V3JobFence, seed: string) => ({ operationId: ids('op3', seed), jobKey: key, fence: owned,
        ...(namespace === 'rule' ? { decisionRef: ref('source-decision', seed) } : { discoveryRef: ref('combination-discovery-result', seed) }) })
      return { f, h, queue, enqueue, key, claim, complete }
    }
    test(`R2 ${namespace}: legal claim replay confirms the same exact acquisition without another write`, async () => {
      const t = setup(); confirmed(await t.queue.enqueue(t.enqueue))
      const first = await t.queue.claim(t.claim), owned = fence(first), writes = t.h.storage.writes
      const replay = await t.queue.claim(t.claim)
      assert.deepEqual(fence(replay), owned); assert.deepEqual(confirmed(replay), confirmed(first))
      assert.equal(replay.status === 'confirmed' && replay.replayed, true); assert.equal(t.h.storage.writes, writes)
      assert.equal(confirmed(await t.queue.complete(t.complete(fence(replay), 'r2-legal-complete'))).state, 'succeeded')
    })
    test(`R2 ${namespace}: lost claim ACK recovers only its original acquisition without replaying the write`, async () => {
      const t = setup(); confirmed(await t.queue.enqueue(t.enqueue)); t.h.storage.loseNextResponse = true
      assert.equal((await t.queue.claim(t.claim)).status, 'unconfirmed')
      const acquired = t.h.storage.records.get(t.key), writes = t.h.storage.writes
      assert.equal(acquired?.state, 'leased')
      t.h.storage.obscureConfirm = true
      assert.equal((await t.queue.claim(t.claim)).status, 'unconfirmed'); assert.equal(t.h.storage.writes, writes)
      t.h.storage.obscureConfirm = false
      const recovered = await t.queue.claim(t.claim)
      assert.deepEqual(confirmed(recovered), acquired); assert.equal(t.h.storage.writes, writes)
      assert.equal(recovered.status === 'confirmed' && recovered.replayed, true)
    })
    for (const sameLeaseId of [true, false]) {
      test(`R2 ${namespace}: old claim cannot inherit a reclaimed generation with ${sameLeaseId ? 'the same' : 'a different'} lease ID`, async () => {
        const t = setup(); confirmed(await t.queue.enqueue(t.enqueue))
        const first = fence(await t.queue.claim(t.claim)); t.h.clock.advance(100)
        const second = fence(await t.queue.claim({ ...t.claim, operationId: ids('op3', 'r2-second'),
          leaseId: sameLeaseId ? t.claim.leaseId : ids('lease3', 'r2-second') }))
        assert.ok(second.generation > first.generation); assert.ok(second.revision > first.revision)
        const writes = t.h.storage.writes
        assert.equal((await t.queue.claim(t.claim)).status, 'superseded')
        assert.equal((await t.queue.complete(t.complete(first, 'r2-stale-complete'))).status, 'superseded')
        assert.equal((await t.queue.fail({ operationId: ids('op3', 'r2-stale-fail'), jobKey: t.key,
          fence: first, reason: 'unreachable' })).status, 'superseded')
        assert.equal(t.h.storage.writes, writes)
        assert.deepEqual(fence(await t.queue.read(t.key)), second)
        assert.equal(confirmed(await t.queue.complete(t.complete(second, 'r2-current-complete'))).state, 'succeeded')
      })
    }
    test(`R2 ${namespace}: a lost original ACK does not acquire a later reclaimed generation`, async () => {
      const t = setup(); confirmed(await t.queue.enqueue(t.enqueue)); t.h.storage.loseNextResponse = true
      assert.equal((await t.queue.claim(t.claim)).status, 'unconfirmed'); t.h.clock.advance(100)
      const second = fence(await t.queue.claim({ ...t.claim, operationId: ids('op3', 'r2-after-lost') }))
      const writes = t.h.storage.writes
      assert.equal((await t.queue.claim(t.claim)).status, 'superseded'); assert.equal(t.h.storage.writes, writes)
      assert.deepEqual(fence(await t.queue.read(t.key)), second)
    })
    test(`R2 ${namespace}: reclaim before the first Claim ACK returns cannot transfer the new fence`, async () => {
      const t = setup(); confirmed(await t.queue.enqueue(t.enqueue))
      let sawCommit: () => void = () => {}, releaseAck: () => void = () => {}
      const committed = new Promise<void>((resolve) => { sawCommit = resolve })
      const release = new Promise<void>((resolve) => { releaseAck = resolve })
      const options = { ...t.h.options, invocationMilliseconds: 5000, storage: {
        read: t.h.storage.read.bind(t.h.storage), confirm: t.h.storage.confirm.bind(t.h.storage),
        compareAndSwap: async (...args: Parameters<typeof t.h.storage.compareAndSwap>) => {
          const result = await t.h.storage.compareAndSwap(...args)
          if (args[0].operationId === t.claim.operationId && result.status === 'committed') { sawCommit(); await release }
          return result
        },
      } }
      const queue = namespace === 'rule' ? createV3QueueCoordinator(options) : createV3DiscoveryQueueCoordinator(options)
      const pendingFirst = queue.claim(t.claim)
      await committed; t.h.clock.advance(100)
      try {
        const second = fence(await queue.claim({ ...t.claim, operationId: ids('op3', 'r2-before-first-ack') }))
        assert.equal(second.leaseId, t.claim.leaseId); assert.equal(second.generation, 3)
      } finally { releaseAck() }
      assert.equal((await pendingFirst).status, 'superseded')
      assert.equal(t.h.storage.writes, 3); assert.equal(confirmed(await t.queue.read(t.key)).state, 'leased')
    })
  }
  test('current reads and replayed acknowledgements reject records ahead of the authoritative clock', async () => {
    const f = fixture(), h = queueHarness()
    const value = await h.queue.enqueue(f.enqueue)
    if (value.status !== 'confirmed' || value.record.kind !== 'research_job_record') assert.fail('enqueue')
    h.storage.records.set(value.record.jobKey, { ...value.record, updatedAt: '2026-11-09T08:04:00.001Z' })
    assert.equal((await h.queue.read(value.record.jobKey)).status, 'unavailable')
    assert.equal((await h.queue.enqueue(f.enqueue)).status, 'unavailable')
    assert.equal(h.storage.writes, 1)
  })
  test('concurrent identical rule misses commit one active job and consume both idempotent operations', async () => {
    const f = fixture(), h = queueHarness()
    const [first, second] = await Promise.all([h.queue.enqueue(f.enqueue), h.queue.enqueue({ ...f.enqueue,
      operationId: ids('op3', 'other-request'), jobId: ids('job3', 'other-candidate') })])
    const a = confirmed(first), b = confirmed(second)
    assert.equal(a.jobId, b.jobId); assert.equal(h.storage.records.size, 1)
    assert.equal(h.storage.events.filter((event) => event.kind === 'enqueued').length, 1)
    assert.equal(h.storage.operations.size, 2)
  })
  test('concurrent unknown combinations share neutral discovery work without any rule or passport default', async () => {
    const f = fixture(), h = queueHarness()
    const [a, b] = await Promise.all([h.discovery.enqueue(f.discoveryEnqueue), h.discovery.enqueue({ ...f.discoveryEnqueue,
      destinationCountryCode: ' aq ', citizenshipCountryCode: 'ch', operationId: ids('op3', 'second-discovery'), jobId: ids('job3', 'second-discovery') })])
    const first = confirmed(a), second = confirmed(b)
    assert.equal(first.kind, 'combination_discovery_job_record'); assert.equal(first.jobId, second.jobId)
    assert.equal('context' in first, false); assert.equal('factKind' in first, false); assert.equal('source' in first, false)
    assert.equal(h.storage.records.size, 1)
  })
  test('strict namespace separation rejects swapping rule and discovery lifecycle operations', async () => {
    const f = fixture(), h = queueHarness()
    const discovery = confirmed(await h.discovery.enqueue(f.discoveryEnqueue))
    assert.equal(discovery.kind, 'combination_discovery_job_record'); if (discovery.kind !== 'combination_discovery_job_record') assert.fail()
    assert.equal((await h.queue.read(discovery.identity.jobKey)).status, 'invalid')
    assert.equal((await h.queue.claim({ operationId: ids('op3', 'wrong-kind'), jobKey: discovery.identity.jobKey,
      leaseId: ids('lease3', 'wrong'), leaseMilliseconds: 100 })).status, 'invalid')
    assert.equal((await h.discovery.enqueue(f.enqueue)).status, 'invalid')
    assert.equal((await h.queue.enqueue(f.discoveryEnqueue)).status, 'invalid')
  })
  test('operation replay reads current succeeded state; it never resurrects the old queued ACK', async () => {
    const f = fixture(), h = queueHarness(); confirmed(await h.queue.enqueue(f.enqueue))
    const owned = fence(await h.queue.claim({ operationId: ids('op3', 'claim'), jobKey: f.identity.jobKey,
      leaseId: ids('lease3', 'claim'), leaseMilliseconds: 1000 }))
    const done = confirmed(await h.queue.complete({ operationId: ids('op3', 'done'), jobKey: f.identity.jobKey,
      fence: owned, decisionRef: ref('source-decision', 'done') }))
    assert.equal(done.state, 'succeeded')
    assert.equal(confirmed(await h.queue.enqueue(f.enqueue)).state, 'succeeded')
    const fresh = confirmed(await h.queue.enqueue({ ...f.enqueue, operationId: ids('op3', 'new-cycle'), jobId: ids('job3', 'new-cycle') }))
    assert.equal(fresh.state, 'queued'); assert.notEqual(fresh.jobId, done.jobId)
    assert.equal((await h.queue.enqueue(f.enqueue)).status, 'superseded')
  })
  test('same operation with other bytes collides instead of overriding its first meaning', async () => {
    const f = fixture(), h = queueHarness(); confirmed(await h.queue.enqueue(f.enqueue))
    const changed = { ...f.enqueue, attemptLimit: 4 }
    assert.equal((await h.queue.enqueue(changed)).status, 'collision'); assert.equal(h.storage.writes, 1)
  })
  test('expired lease is reclaimed with a new fence; delayed old worker cannot complete or fail it', async () => {
    const f = fixture(), h = queueHarness(); confirmed(await h.queue.enqueue(f.enqueue))
    const first = fence(await h.queue.claim({ operationId: ids('op3', 'claim-first'), jobKey: f.identity.jobKey,
      leaseId: ids('lease3', 'first'), leaseMilliseconds: 100 }))
    h.clock.advance(100)
    const second = fence(await h.queue.claim({ operationId: ids('op3', 'claim-second'), jobKey: f.identity.jobKey,
      leaseId: ids('lease3', 'second'), leaseMilliseconds: 100 }))
    assert.ok(second.generation > first.generation)
    assert.equal((await h.queue.complete({ operationId: ids('op3', 'late-complete'), jobKey: f.identity.jobKey,
      fence: first, decisionRef: ref('source-decision', 'late') })).status, 'superseded')
    assert.equal((await h.queue.fail({ operationId: ids('op3', 'late-fail'), jobKey: f.identity.jobKey,
      fence: first, reason: 'unreachable' })).status, 'superseded')
    assert.equal(confirmed(await h.queue.read(f.identity.jobKey)).lease?.leaseId, second.leaseId)
  })
  test('concurrent workers claim one lease; bounded backoff and exhaustion prohibit extra attempts', async () => {
    const f = fixture(), h = queueHarness(); confirmed(await h.queue.enqueue({ ...f.enqueue, attemptLimit: 2 }))
    const [a, b] = await Promise.all([1, 2].map((n) => h.queue.claim({ operationId: ids('op3', `claim-${n}`), jobKey: f.identity.jobKey,
      leaseId: ids('lease3', `claim-${n}`), leaseMilliseconds: 1000 })))
    assert.equal([a, b].filter((item) => item.status === 'confirmed').length, 1)
    const owned = fence(a.status === 'confirmed' ? a : b)
    assert.equal(confirmed(await h.queue.fail({ operationId: ids('op3', 'failure-one'), jobKey: f.identity.jobKey,
      fence: owned, reason: 'unreachable' })).state, 'backoff')
    const claim = { operationId: ids('op3', 'retry'), jobKey: f.identity.jobKey, leaseId: ids('lease3', 'retry'), leaseMilliseconds: 1000 }
    assert.equal((await h.queue.claim(claim)).status, 'not_due')
    h.clock.advance(100)
    const retry = fence(await h.queue.claim(claim))
    const exhausted = confirmed(await h.queue.fail({ operationId: ids('op3', 'failure-two'), jobKey: f.identity.jobKey,
      fence: retry, reason: 'invalid_proposal' }))
    assert.equal(exhausted.state, 'exhausted'); assert.equal(exhausted.attempt, 2)
    assert.equal((await h.queue.claim({ ...claim, operationId: ids('op3', 'excess') })).status, 'not_due')
  })
  test('a crash on the last attempt expires to exhausted and cannot acquire a seventeenth or extra lease', async () => {
    const f = fixture(), h = queueHarness(); confirmed(await h.queue.enqueue({ ...f.enqueue, attemptLimit: 1 }))
    fence(await h.queue.claim({ operationId: ids('op3', 'crashed'), jobKey: f.identity.jobKey, leaseId: ids('lease3', 'crashed'), leaseMilliseconds: 1 }))
    h.clock.advance(1)
    const result = confirmed(await h.queue.claim({ operationId: ids('op3', 'after-crash'), jobKey: f.identity.jobKey,
      leaseId: ids('lease3', 'after-crash'), leaseMilliseconds: 100 }))
    assert.equal(result.state, 'exhausted'); assert.equal(result.attempt, 1)
  })
  test('lost commit response is confirmed on retry without a second mutation; unknown remains unknown', async () => {
    const f = fixture(), h = queueHarness(); h.storage.loseNextResponse = true
    assert.equal((await h.queue.enqueue(f.enqueue)).status, 'unconfirmed'); assert.equal(h.storage.writes, 1)
    h.storage.obscureConfirm = true
    assert.equal((await h.queue.enqueue(f.enqueue)).status, 'unconfirmed'); assert.equal(h.storage.writes, 1)
    h.storage.obscureConfirm = false
    confirmed(await h.queue.enqueue(f.enqueue)); assert.equal(h.storage.writes, 1)
  })
  test('method revocation after waiting for the atomic mutation point prevents commit', async () => {
    const f = fixture(), h = queueHarness()
    h.storage.beforeCommit = async () => { h.method.control.enabled = false }
    assert.equal((await h.queue.enqueue(f.enqueue)).status, 'unavailable'); assert.equal(h.storage.writes, 0)
  })
  test('technical failure is not empty; no enqueue fallback or changed-method job is invented', async () => {
    const f = fixture(), h = queueHarness(); h.storage.unavailableReads = true
    assert.equal((await h.queue.enqueue(f.enqueue)).status, 'unavailable'); assert.equal(h.storage.writes, 0)
    h.storage.unavailableReads = false; h.method.control.revision = 2
    assert.equal((await h.discovery.enqueue(f.discoveryEnqueue)).status, 'unavailable')
    const next = confirmed(await h.discovery.enqueue({ ...f.discoveryEnqueue, method: { ...METHOD, revision: 2 } }))
    assert.equal(next.kind, 'combination_discovery_job_record')
  })
  test('a bounded timeout aborts the pending adapter and never returns a speculative ACK', async () => {
    const f = fixture(), h = queueHarness(); let aborted = false
    const queue = createV3QueueCoordinator({ ...h.options, invocationMilliseconds: 10, storage: {
      ...h.storage, read: async () => ({ status: 'unavailable' as const }), compareAndSwap: async () => ({ status: 'unavailable' as const }),
      confirm: async (_op, _key, signal) => new Promise((resolve) => {
        signal.addEventListener('abort', () => { aborted = true; resolve({ status: 'unconfirmed' }) }, { once: true })
      }),
    } })
    assert.equal((await queue.enqueue(f.enqueue)).status, 'unconfirmed'); assert.equal(aborted, true)
  })
  test('private inputs, getters and oversized payloads fail before any storage call; runtime has no bound service', async () => {
    const f = fixture(), h = queueHarness(); let invoked = false
    const getter = Object.defineProperty({}, 'context', { get() { invoked = true; return f.context } })
    for (const input of [{ ...f.enqueue, passportNumber: 'PRIVATE' }, { ...f.discoveryEnqueue, mrz: 'PRIVATE' }, getter,
      { ...f.enqueue, note: 'x'.repeat(70_000) }]) assert.equal((await h.queue.enqueue(input)).status, 'invalid')
    assert.equal(invoked, false); assert.equal(h.storage.writes, 0)
    const runtime = officialTruthV3MonitoringRuntime()
    assert.equal(runtime.status, 'unbound'); assert.equal(runtime.scheduler, null); assert.equal(runtime.worker, null)
    assert.equal((await runtime.ruleQueue.enqueue(f.enqueue)).status, 'unavailable')
    assert.equal((await runtime.discoveryQueue.enqueue(f.discoveryEnqueue)).status, 'unavailable')
    assert.ok(must(createV3CombinationDiscoveryIdentity(f.discoveryEnqueue && { destinationCountryCode: 'AQ', citizenshipCountryCode: 'CH', method: METHOD })).jobKey)
  })
})
