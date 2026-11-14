import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createV3QueueCoordinator, type V3ManagedJobRecord } from '../monitor/queue'
import { queueHarness, fixture, ids, METHOD } from '../monitor/test-support'
import { createV3PostgresMethodAuthority } from '../method/authority-postgres'
import { createM04QueueStorage } from './postgres'
import { createM04LanePool, createM04InvocationScope } from './owned-scope'
import { readM04Command, readM04NativeReply, type M04FixedOperation, type M04Continuation, type M04NativeReply } from './contract'

test('post-CAS receipt crosses only the actual queue-read adapter and never supplies its record', async () => {
  const h = queueHarness(), f = fixture(), seeded = await h.queue.enqueue(f.enqueue)
  assert.equal(seeded.status, 'confirmed'); if (seeded.status !== 'confirmed') return
  const calls: Parameters<M04FixedOperation>[] = [], receipt = Object.freeze({}), signal = new AbortController().signal
  let reply: M04NativeReply = { status: 'present', record: seeded.record }, recorded = 0
  const fixed: M04FixedOperation = async (...args) => { calls.push(args); return reply }
  const storage = createM04QueueStorage({ fixed, commandFor: () => null, continuation: () => null,
    disposition: () => null, onRecord() { recorded++ }, settled() { assert.fail('a read cannot retire continuation') } })
  assert.deepEqual(await storage.read(f.identity.jobKey, signal, receipt), { status: 'ok', record: seeded.record })
  assert.deepEqual(calls[0][0], { operation: 'queue_read', body: { jobKey: f.identity.jobKey, continuation: null } })
  assert.equal(calls[0][1], signal); assert.equal(calls[0][2], receipt); assert.equal(recorded, 1)
  reply = { status: 'unavailable' }
  assert.deepEqual(await storage.read(f.identity.jobKey, signal, receipt), { status: 'unavailable' })
  assert.equal(recorded, 1, 'the CAS record is not a substitute for a failed actual read')
  assert.deepEqual(await storage.read(f.identity.jobKey, signal, null as unknown as object), { status: 'unavailable' })
  assert.equal(calls[2].length, 3); assert.equal(calls[2][2], null, 'explicit invalid custody is not converted to omission')
  reply = { status: 'absent' }
  assert.deepEqual(await storage.read(f.identity.jobKey, signal), { status: 'ok', record: null })
  assert.equal(calls[3].length, 2, 'initial and replay reads keep the original default path')
  reply = { status: 'present', record: seeded.record }
  assert.deepEqual(await storage.read('research-job:v3:' + 'f'.repeat(64), signal, receipt), { status: 'unavailable' })
  assert.equal(recorded, 1, 'readback still belongs to the requested job key')
})

// Actual queue confirmation/authority/post-CAS control flow, scoped protocol
// doubles only; native transaction/epoch proof belongs to mandatory native CI.
test('R3: the original justified final fail uses reserved native capacity through real queue confirmation, MA1 and post-CAS read', async () => {
  const h = queueHarness(), f = fixture(), seeded = await h.queue.enqueue({ context: f.context, method: METHOD,
    factKind: 'requirement_effect', researchReason: { status: 'missing' }, operationId: ids('op3', 'quota-enqueue'), jobId: ids('job3', 'quota-job'), attemptLimit: 3 })
  assert.equal(seeded.status, 'confirmed')
  const claim = { operationId: ids('op3', 'quota-claim'), jobKey: f.identity.jobKey, leaseId: ids('lease3', 'quota-claim'), leaseMilliseconds: 4000 }
  const claimed = await h.queue.claim(claim); assert.equal(claimed.status, 'confirmed')
  if (claimed.status !== 'confirmed' || !claimed.record.lease) return
  let current: V3ManagedJobRecord = claimed.record
  const input = { operationId: ids('op3', 'quota-fail'), jobKey: f.identity.jobKey,
    fence: { jobId: current.jobId, revision: current.revision, leaseId: current.lease!.leaseId, generation: current.lease!.generation }, reason: 'unreachable' }
  const command = readM04Command({ action: 'fail', input }); assert.ok(command)
  const scope = createM04InvocationScope(createM04LanePool(), 5000)!
  const binding = { ...METHOD, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
  const trace: string[] = []
  const authority = createV3PostgresMethodAuthority(binding, { async readCurrent(request) {
    const outcome = await scope.native('method', 'outer', async () => { trace.push('method'); return { status: 'rows' as const, rows: [{
      status: 'approved', method_id: binding.methodId, revision: String(binding.revision), method_digest: binding.methodDigest, package_digest: binding.packageDigest,
      epoch: '1', approval_mode: 'until_revoked', approval_until: null, observed_at: request.checkedAt, remaining_ms: '5000' }] } }, undefined, scope.terminalObservation())
    return outcome.ok ? outcome.value : { status: 'unavailable' }
  } })
  let continuation: M04Continuation = { kind: 'owned_failure', claim, attemptKey: 'execution-attempt:v3:' + 'd'.repeat(64), token: 'e'.repeat(64) }
  const fixed: M04FixedOperation = async (request, signal, receipt) => {
    const isRead = request.operation === 'queue_read' || request.operation === 'queue_confirm'
    async function execute(reply: unknown) {
      const admitted = await scope.native('jobs', 'outer', async () => {
        trace.push(request.operation)
        return readM04NativeReply([{ result: JSON.stringify(reply) }], request.operation)!
      }, signal, scope.terminalOperation(request))
      return admitted.ok ? admitted.value : { status: 'unavailable' as const }
    }
    if (request.operation === 'queue_confirm') return execute({ status: 'not_attempted' })
    if (isRead) {
      const probe = await execute({ status: 'requires_authority' }); if (probe.status !== 'requires_authority') return probe
      const held = await authority.resolveCurrent(METHOD, h.clock.now()); if (held.status !== 'approved') return { status: 'unavailable' }
    } else assert.ok(receipt, 'actual queue supplied opaque method receipt')
    if (request.operation === 'queue_cas') { current = request.body.commit.next; return execute({ status: 'committed', record: current }) }
    return execute({ status: 'present', record: current })
  }
  const storage = createM04QueueStorage({ fixed, commandFor: (op, key) => op === command.operationId && key === command.commandKey ? command : null,
    continuation: () => continuation, disposition: () => ({ kind: 'settled_failure', attemptKey: 'execution-attempt:v3:' + 'd'.repeat(64), token: 'e'.repeat(64) }),
    onRecord() {}, settled() { continuation = null; scope.markSettled(); trace.push('actual-terminal-retirement') } })
  try {
    scope.markUnresolved()
    for (let n = 0; n < 240; n++) assert.equal((await scope.native('jobs', 'outer', async () => undefined)).ok, true)
    assert.equal((await authority.resolveCurrent(METHOD, h.clock.now())).status, 'unavailable', 'no generic method exemption at240')
    scope.sealProcessing()
    assert.equal(scope.beginTerminal({ claim, attemptKey: 'execution-attempt:v3:' + 'd'.repeat(64), commandKey: command.commandKey }), true)
    assert.equal(scope.terminalOperation({ operation: 'execution_start', body: { claim, leasedJob: claimed.record, subjectText: '{}' } }), false)
    assert.equal(scope.terminalOperation({ operation: 'queue_read', body: { jobKey: 'research-job:v3:' + 'f'.repeat(64), continuation } }), false)
    const queue = createV3QueueCoordinator({ storage, methodAuthority: authority, now: h.clock.now,
      invocationMilliseconds: 5000, backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000 })
    const done = await queue.fail(input)
    assert.equal(done.status, 'confirmed', JSON.stringify({ done, trace, scope: scope.snapshot() }))
    if (done.status === 'confirmed') assert.equal(done.record.state, 'backoff')
    assert.ok(scope.snapshot().nativeTotal > 240 && scope.snapshot().nativeTotal <= 256)
    assert.equal(continuation, null)
    const at = trace.indexOf('actual-terminal-retirement')
    assert.ok(at > 0 && trace.slice(at + 1).includes('queue_read') && trace.slice(at + 1).includes('method'))
  } finally { await scope.finish() }
})
