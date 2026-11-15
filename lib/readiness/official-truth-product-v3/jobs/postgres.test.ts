import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createV3QueueCoordinator, type V3ManagedJobRecord } from '../monitor/queue'
import { queueHarness, fixture, ids, METHOD } from '../monitor/test-support'
import { createV3PostgresMethodAuthority } from '../method/authority-postgres'
import { createM04ExecutionIndex, createM04QueueStorage } from './postgres'
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

test('claim confirmation forwards only its private drain while retaining original terminal and command binding', async () => {
  const f = fixture(), signal = new AbortController().signal
  const claim = { operationId: ids('op3', 'confirm-drain'), jobKey: f.identity.jobKey,
    leaseId: ids('lease3', 'confirm-drain'), leaseMilliseconds: 30000 }
  const command = readM04Command({ action: 'claim', input: claim })!
  const drain = async () => {}, calls: Parameters<M04FixedOperation>[] = []
  const storage = createM04QueueStorage({ fixed: async (...args) => { calls.push(args); return { status: 'not_attempted' } },
    commandFor: (op, key) => op === command.operationId && key === command.commandKey ? command : null,
    continuation: () => null, disposition: () => null, onRecord() {}, settled() {} })
  assert.deepEqual(await storage.confirm(command.operationId, command.commandKey, signal, drain), { status: 'not_attempted' })
  assert.deepEqual(calls[0], [{ operation: 'queue_confirm', body: { command: command.value, continuation: null } },
    signal, undefined, true, drain])
  assert.deepEqual(await storage.confirm(ids('op3', 'wrong-confirm'), command.commandKey, signal, drain), { status: 'unconfirmed' })
  assert.equal(calls.length, 1)
})

test('terminal index custody needs its own successful exact confirm and transfers that actual ACK once', async () => {
  const h = queueHarness(), f = fixture(), signal = new AbortController().signal
  assert.equal((await h.queue.enqueue(f.enqueue)).status, 'confirmed')
  const claim = { operationId: ids('op3', 'index-terminal-claim'), jobKey: f.identity.jobKey,
    leaseId: ids('lease3', 'index-terminal-claim'), leaseMilliseconds: 4000 }
  const claimed = await h.queue.claim(claim)
  assert.equal(claimed.status, 'confirmed'); if (claimed.status !== 'confirmed') return
  const job = claimed.record, methodReceipt = Object.freeze({})
  const value = { status: 'prepared' as const, claim, leasedJob: job, attemptKey: 'execution-attempt:v3:' + 'e'.repeat(64),
    result: { kind: 'rule_research' as const, jobId: job.jobId, operationId: job.operationId,
      jobKey: claim.jobKey, preparedAt: h.clock.now(), decisionRef: 'source-decision:v3:' + 'a'.repeat(64) }, references: [] }
  let available = true, calls = 0, actualAck: M04NativeReply | undefined
  const fixed: M04FixedOperation = async request => {
    assert.equal(request.operation, 'execution_read')
    actualAck = available ? structuredClone(value) : { status: 'unconfirmed' }
    return actualAck
  }
  const index = createM04ExecutionIndex({ claim, fixed, processingFixed: fixed, preparedOnly: () => false,
    onPrepared() {}, async acquireTerminalAuthority(anchor, confirmed, at, s) {
      calls++; assert.equal(anchor, methodReceipt); assert.equal(confirmed, actualAck)
      assert.equal(at, h.clock.now()); assert.equal(s, signal)
      return { status: 'current' }
    } })
  assert.equal(index.results.lookupBeforeWorkerAuthority, true)
  const ordinary = createM04ExecutionIndex({ claim, fixed, processingFixed: fixed, preparedOnly: () => false, onPrepared() {} })
  assert.equal(ordinary.results.lookupBeforeWorkerAuthority, undefined, 'ordinary adapters do not opt in without the actual terminal capability')
  const found = await index.results.lookup(job, signal)
  assert.equal(found.status, 'prepared'); if (found.status !== 'prepared') return
  const terminal = index.results.acquireTerminalAuthority!
  assert.equal((await terminal(found.receipt, methodReceipt, job, h.clock.now(), signal)).status, 'unavailable')
  assert.equal((await index.results.confirm({}, job, h.clock.now(), signal)).status, 'unconfirmed')
  assert.equal((await terminal({}, methodReceipt, job, h.clock.now(), signal)).status, 'unavailable')
  assert.equal(calls, 0)
  assert.equal((await index.results.confirm(found.receipt, job, h.clock.now(), signal)).status, 'confirmed')
  assert.equal((await terminal(found.receipt, methodReceipt, { ...job, revision: job.revision + 1 }, h.clock.now(), signal)).status, 'unavailable')
  assert.equal((await terminal(found.receipt, methodReceipt, job, h.clock.now(), signal)).status, 'unavailable', 'a failed consumption cannot be replayed')
  assert.equal((await index.results.confirm(found.receipt, job, h.clock.now(), signal)).status, 'confirmed')
  assert.equal((await terminal(found.receipt, methodReceipt, job, h.clock.now(), signal)).status, 'current')
  assert.equal((await terminal(found.receipt, methodReceipt, job, h.clock.now(), signal)).status, 'unavailable')
  assert.equal(calls, 1)
  assert.equal((await index.results.confirm(found.receipt, job, h.clock.now(), signal)).status, 'confirmed')
  available = false
  assert.equal((await index.results.confirm(found.receipt, job, h.clock.now(), signal)).status, 'unconfirmed')
  assert.equal((await terminal(found.receipt, methodReceipt, job, h.clock.now(), signal)).status, 'unavailable', 'later failed read revokes prior local confirm custody')
  assert.equal(calls, 1)
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
