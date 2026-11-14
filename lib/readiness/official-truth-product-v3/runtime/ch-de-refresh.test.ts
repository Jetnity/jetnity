// Offline real ordinary queue; no source fetch, SQL, authority change or account.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createV3WorkIdentity, type V3MethodAuthorityPort } from '../contract'
import { createV3QueueCoordinator, type V3QueueResult } from '../monitor/queue'
import { queueHarness, ref } from '../monitor/test-support'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import type { ChDeOwnerImportRequest } from './ch-de-owner-import-contract'

test('ordinary refresh retains exact request custody and only confirms its own real queue job', async t => {
  const program = AA_BERN_CH_DE_REVIEWED_PROGRAM
  const request: ChDeOwnerImportRequest = { schema: 2, mode: 'start', operationId: 'op3_' + 'a'.repeat(32), leaseId: 'lease3_' + 'b'.repeat(32) }
  const next: ChDeOwnerImportRequest = { ...request, operationId: 'op3_' + 'c'.repeat(32), leaseId: 'lease3_' + 'd'.repeat(32) }
  const method: V3MethodAuthorityPort<object> = {
    async resolveCurrent(selected) { return selected.methodId === program.method.methodId && selected.revision === program.method.revision
      ? { status: 'approved', receipt: Object.freeze({}) } : { status: 'not_approved' } },
    async reproveAtCommit() { return { status: 'current' } },
  }
  let available = true, calls = 0
  let invoke: (input: unknown, signal: AbortSignal) => Promise<V3QueueResult> = async () => ({ status: 'unavailable' })
  t.mock.module(new URL('./ch-de-server.ts', import.meta.url), { namedExports: {
    officialTruthV3ChDeRuntime() { return available ? { async enqueueRule(input: unknown, signal: AbortSignal) {
      calls++; return invoke(input, signal)
    } } : null },
  } })
  const { chDeRefreshQueueIdentity, enqueueOfficialTruthV3ChDeRefresh: enqueue } = await import('./ch-de-refresh')
  const ids = chDeRefreshQueueIdentity(request)!, newIds = chDeRefreshQueueIdentity(next)!
  assert.match(ids.operationId, /^op3_[a-f0-9]{32}$/); assert.match(ids.jobId, /^job3_[a-f0-9]{32}$/)
  assert.notEqual(ids.operationId, request.operationId)
  assert.notEqual(ids.jobId.slice(5), ids.operationId.slice(4), 'domain separation excludes overlapping enqueue/job identifiers')
  assert.notDeepEqual(ids, newIds)
  assert.deepEqual(chDeRefreshQueueIdentity({ ...request, mode: 'resume' }), ids, 'phase never changes the original queue identity')
  const selected = createV3WorkIdentity({ context: program.context, method: program.method,
    factKind: program.binding.factKind, researchReason: { status: 'missing' } })
  assert.ok(selected.ok)
  const key = selected.value.jobKey
  function setup() {
    const harness = queueHarness(), queue = createV3QueueCoordinator({ ...harness.options, methodAuthority: method })
    invoke = (input, signal) => queue.enqueue(input, signal)
    available = true; calls = 0
    return { harness, queue }
  }
  const signal = () => new AbortController().signal
  await t.test('lost enqueue ACK replays the same committed request without a second job or write', async () => {
    const { harness } = setup()
    harness.storage.loseNextResponse = true
    assert.equal((await enqueue(request, signal())).status, 'unresolved')
    assert.equal(harness.storage.records.get(key)?.jobId, ids.jobId)
    assert.equal(harness.storage.writes, 1)
    assert.equal((await enqueue(request, signal())).status, 'queued')
    assert.equal(harness.storage.writes, 1); assert.equal(harness.storage.operations.size, 1)
    const retained = harness.storage.records.get(key)
    assert.equal(retained?.attemptLimit, program.binding.attemptLimit)
    assert.equal(retained?.kind, 'research_job_record')
    if (retained?.kind !== 'research_job_record') assert.fail()
    assert.deepEqual(retained.context, program.context); assert.deepEqual(retained.method, program.method)
  })
  await t.test('an older active job is busy, never a positive acknowledgement for another request', async () => {
    const { harness } = setup()
    assert.equal((await enqueue(request, signal())).status, 'queued')
    assert.equal((await enqueue(next, signal())).status, 'busy')
    assert.equal(harness.storage.records.get(key)?.jobId, ids.jobId)
    const writes = harness.storage.writes
    assert.equal((await enqueue(next, signal())).status, 'busy')
    assert.equal(harness.storage.writes, writes)
  })
  await t.test('completed original enqueue replays terminal custody and a later ordinary cycle has a new identity', async () => {
    const { harness, queue } = setup()
    assert.equal((await enqueue(request, signal())).status, 'queued')
    const claim = await queue.claim({ operationId: request.operationId, jobKey: key, leaseId: request.leaseId, leaseMilliseconds: 1000 })
    assert.equal(claim.status, 'confirmed')
    if (claim.status !== 'confirmed' || !claim.record.lease) assert.fail()
    const owned = { jobId: claim.record.jobId, revision: claim.record.revision,
      leaseId: claim.record.lease.leaseId, generation: claim.record.lease.generation }
    assert.equal((await queue.complete({ operationId: 'op3_' + 'e'.repeat(32), jobKey: key,
      fence: owned, decisionRef: ref('source-decision', 'refresh-completed') })).status, 'confirmed')
    const writes = harness.storage.writes
    assert.equal((await enqueue(request, signal())).status, 'queued')
    assert.equal(harness.storage.writes, writes); assert.equal(harness.storage.records.get(key)?.state, 'succeeded')
    assert.equal((await enqueue(next, signal())).status, 'queued')
    assert.equal(harness.storage.records.get(key)?.jobId, newIds.jobId)
    assert.equal((await enqueue(request, signal())).status, 'unavailable', 'superseded original cannot adopt the new cycle')
  })
  await t.test('invalid or missing runtime refuses before enqueue; post-dispatch abort awaits the actual promise', async () => {
    setup()
    const preAborted = new AbortController(); preAborted.abort()
    assert.equal((await enqueue(request, preAborted.signal)).status, 'unavailable')
    assert.equal((await enqueue({ ...request, mode: 'resume' }, signal())).status, 'request_refused')
    assert.equal((await enqueue({ ...request, operationId: 'op3_invalid' }, signal())).status, 'request_refused')
    available = false
    assert.equal((await enqueue(request, signal())).status, 'unavailable'); assert.equal(calls, 0)
    available = true
    let entered!: () => void, release!: (value: V3QueueResult) => void
    const admitted = new Promise<void>(resolve => { entered = resolve })
    const held = new Promise<V3QueueResult>(resolve => { release = resolve })
    invoke = () => { entered(); return held }
    const controller = new AbortController(); let answered = false
    const pending = enqueue(request, controller.signal).then(value => { answered = true; return value })
    await admitted; controller.abort(); await Promise.resolve()
    assert.equal(answered, false)
    release({ status: 'unconfirmed' })
    assert.equal((await pending).status, 'unresolved'); assert.equal(calls, 1)
  })
  await t.test('negative or mismatching acknowledgements cannot be queued or published', async () => {
    const { queue } = setup()
    assert.equal((await enqueue(request, signal())).status, 'queued')
    const real = await queue.read(key); assert.equal(real.status, 'confirmed')
    if (real.status !== 'confirmed' || real.record.kind !== 'research_job_record') assert.fail()
    for (const failure of ['unconfirmed', 'unavailable', 'contended', 'collision', 'invalid', 'superseded'] as const) {
      invoke = async () => ({ status: failure })
      const outcome = await enqueue(request, signal())
      assert.ok(!['queued', 'published', 'complete'].includes(outcome.status)); assert.equal(outcome.published, 0)
    }
    for (const record of [
      { ...real.record, jobId: newIds.jobId },
      { ...real.record, contextKey: 'another-context' },
      { ...real.record, method: { ...program.method, revision: 2 } },
    ]) {
      invoke = async () => ({ ...real, record })
      const outcome = await enqueue(request, signal())
      assert.ok(!['queued', 'published', 'complete'].includes(outcome.status))
    }
  })
})
