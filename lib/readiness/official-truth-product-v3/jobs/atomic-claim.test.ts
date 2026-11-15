// Closed protocol/factory fault injection. These tests do not claim SQL custody.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { createV3QueueCoordinator, type V3QueueCommit, type V3QueueResult,
  type V3QueueCommitAuthority, type V3ManagedJobRecord } from '../monitor/queue'
import { fixture, queueHarness, ids, METHOD } from '../monitor/test-support'
import { key } from '../monitor/internal'
import { hrs1Canonical } from '../result/contract'
import { readV3ResearchJobRecord } from '../contract'
import { createV3PostgresDurableJobs } from '../method/authority-postgres'
import { createM04QueueStorage } from './postgres'
import { readM04Command, readM04NativeReply, type M04Config, type M04FixedOperation,
  type M04NativeReply, type M04Operation, type M04TerminalExecutor } from './contract'
import { chDeRefreshRequestIdentity, selectRetainedChDeClaim, guardRetainedChDeClaim } from './selected-claim'

type Wire = Record<string, unknown>
const signal = () => new AbortController().signal
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

async function fixtureQueue(retained = false, attemptLimit = 3) {
  const f = fixture(), h = queueHarness(), commits: V3QueueCommit[] = []
  const claim = { operationId: ids('op3', 'atomic-codec'), jobKey: f.identity.jobKey,
    leaseId: ids('lease3', 'atomic-codec'), leaseMilliseconds: 30000 }
  // This storage deliberately has no atomic capability. Its original public
  // coordinator is an independent reference for every positive transition.
  const queue = createV3QueueCoordinator({ ...h.options, invocationMilliseconds: 5000, storage: {
    read: h.storage.read.bind(h.storage), confirm: h.storage.confirm.bind(h.storage),
    async compareAndSwap(commit, authority, child) {
      const reply = await h.storage.compareAndSwap(commit, authority, child)
      if (reply.status === 'committed') commits.push(structuredClone(commit))
      return reply
    },
  } })
  const input = { ...f.enqueue, ...(retained ? chDeRefreshRequestIdentity(claim)! : {}), attemptLimit }
  const before = confirmed(await queue.enqueue(input))
  const command = readM04Command({ action: 'claim', input: claim }); assert.ok(command)
  const wire = (commit: V3QueueCommit, rawCommand = command, replayed = false): Wire => ({
    status: 'committed', operationId: rawCommand.operationId, commandKey: rawCommand.commandKey,
    commandText: rawCommand.commandText, envelopeText: hrs1Canonical(commit), record: commit.next, replayed,
  })
  async function acquire() {
    const record = confirmed(await queue.claim(claim)), commit = commits.at(-1)!
    assert.equal(commit.operationId, claim.operationId)
    return { record, commit, positive: wire(commit) }
  }
  return { f, h, queue, claim, command, commits, before, input, acquire, wire }
}
async function acquired() { const s = await fixtureQueue(); return { ...s, ...await s.acquire() } }
function decode(value: unknown) { return readM04NativeReply([{ result: JSON.stringify(value) }], 'queue_claim') }

test('queue_claim accepts only complete exact fresh/replayed claim envelopes', async () => {
  const s = await acquired()
  for (const replayed of [false, true]) assert.deepEqual(decode({ ...s.positive, replayed }), { ...s.positive, replayed })
  for (const status of ['blocked', 'collision', 'quota', 'not_due', 'superseded', 'mismatch'])
    assert.deepEqual(decode({ status }), { status })
  for (const status of ['requires_authority', 'not_attempted', 'absent', 'present', 'reserved', 'unknown'])
    assert.equal(decode({ status }), null, status + ' cannot authorize a probe or alternate acquisition')
})

test('atomic decoder rejects missing/foreign/duplicate fields and noncanonical retained bytes', async () => {
  const s = await acquired(), missing = { ...s.positive }; delete missing.replayed
  const variants: unknown[] = [missing, { ...s.positive, replayed: 0 }, { ...s.positive, replayed: 'false' },
    { ...s.positive, privateReceipt: {} }, { ...s.positive, operationId: ids('op3', 'other-ack') },
    { ...s.positive, commandKey: key('queue-command', { different: true }) },
    { ...s.positive, commandText: ' ' + s.command.commandText },
    { ...s.positive, envelopeText: JSON.stringify(s.commit, null, 2) }]
  for (const value of variants) assert.equal(decode(value), null)
  const duplicate = JSON.stringify(s.positive).replace('"replayed":false', '"replayed":true,"replayed":false')
  assert.equal(readM04NativeReply([{ result: duplicate }], 'queue_claim'), null)
  let getters = 0
  assert.equal(readM04NativeReply([{ get result() { getters++; return JSON.stringify(s.positive) } }], 'queue_claim'), null)
  assert.equal(getters, 0)
})

for (const fault of ['lease_id', 'lease_duration', 'next_job', 'prior_job', 'deadline', 'audit_kind'] as const) {
  test(`atomic decoder rejects a self-consistent ${fault} substitution inside the retained envelope`, async () => {
    const s = await acquired(), commit = structuredClone(s.commit)
    assert.ok(commit.next.lease && commit.expected)
    let next = commit.next, expected = commit.expected
    if (fault === 'lease_id') next = { ...next, lease: { ...next.lease!, leaseId: ids('lease3', 'foreign-lease') } }
    if (fault === 'lease_duration') next = { ...next, lease: { ...next.lease!,
      expiresAt: new Date(Date.parse(next.lease!.expiresAt) + 1).toISOString() } }
    if (fault === 'next_job') next = { ...next, jobId: ids('job3', 'foreign-next-cycle') }
    if (fault === 'prior_job') expected = { ...expected, jobId: ids('job3', 'foreign-prior-cycle') }
    assert.ok(readV3ResearchJobRecord(next).ok, 'a complete valid record alone is insufficient')
    assert.ok(readV3ResearchJobRecord(expected).ok)
    const changed: V3QueueCommit = { ...commit, next, expected,
      ...(fault === 'deadline' ? { notAfter: new Date(Date.parse(commit.notAfter) + 1).toISOString() } : {}),
      ...(fault === 'audit_kind' ? { audit: { ...commit.audit, kind: 'reclaimed' as const } } : {}) }
    assert.equal(decode(s.wire(changed)), null)
  })
}

test('an actual non-claim dedup ACK cannot become queue_claim merely because its record is leased', async () => {
  const s = await acquired(), input = { ...s.input, operationId: ids('op3', 'atomic-dedup') }
  confirmed(await s.queue.enqueue(input))
  const command = readM04Command({ action: 'enqueue', kind: 'rule_research', input }); assert.ok(command)
  const wire = s.wire(s.commits.at(-1)!, command)
  const old = { ...wire }; delete old.replayed
  assert.equal(readM04NativeReply([{ result: JSON.stringify(old) }], 'queue_confirm')?.status, 'committed')
  assert.equal(decode(wire), null)
})

test('a genuine failure exhaustion cannot masquerade as the earlier claim terminal transition', async () => {
  const s = await fixtureQueue(false, 1), { record } = await s.acquire(); assert.ok(record.lease)
  confirmed(await s.queue.fail({ operationId: ids('op3', 'atomic-real-failure'), jobKey: s.claim.jobKey,
    fence: { jobId: record.jobId, revision: record.revision, leaseId: record.lease.leaseId, generation: record.lease.generation }, reason: 'unreachable' }))
  const failure = s.commits.at(-1)!
  const forged: V3QueueCommit = { ...failure, operationId: s.claim.operationId, commandKey: s.command.commandKey,
    audit: { ...failure.audit, reference: key('queue-event', { op: s.claim.operationId, command: s.command.commandKey }) } }
  assert.ok(readV3ResearchJobRecord(failure.next).ok); assert.equal(failure.next.state, 'exhausted')
  assert.equal(decode(s.wire(forged)), null)
})

async function adapter() {
  const s = await acquired(), calls: Parameters<M04FixedOperation>[] = [], remembered: V3ManagedJobRecord[] = []
  let current: M04NativeReply = decode(s.positive)!, retired = 0
  const control = { execute: async (): Promise<M04NativeReply> => current }
  const fixed: M04FixedOperation = async (...args) => { calls.push(args); return control.execute() }
  const options = { fixed, atomicFixed: fixed,
    commandFor: (op: string, command: string) => op === s.claim.operationId && command === s.command.commandKey ? s.command : null,
    continuation: () => null, disposition: () => ({ kind: 'regular' as const }),
    onRecord(record: V3ManagedJobRecord) { remembered.push(record) }, settled() { retired++ } }
  const storage = createM04QueueStorage(options); assert.ok(storage.claimAtomic)
  const authority: V3QueueCommitAuthority = { method: METHOD, receipt: Object.freeze({}), reprove: async () => true }
  return { ...s, storage, authority, options, calls, remembered, control, retired: () => retired,
    setReply(reply: M04NativeReply) { current = reply },
    invoke: (child = signal(), auth = authority) => storage.claimAtomic!(s.claim.operationId, s.command.commandKey, auth, child) }
}

test('atomic adapter sends one authorized-capability request with exact normal expected/replay fields', async () => {
  const s = await adapter(), child = signal()
  assert.deepEqual(await s.invoke(child), { status: 'committed', operationId: s.claim.operationId,
    commandKey: s.command.commandKey, record: s.record, replayed: false })
  assert.deepEqual(s.calls, [[{ operation: 'queue_claim', body: { command: s.command.value,
    continuation: null, expected: null, replayOnly: false } }, child, s.authority.receipt]])
  assert.deepEqual(s.remembered, [s.record]); assert.equal(s.retired(), 0)
  const legacy = createM04QueueStorage({ ...s.options, atomicFixed: undefined })
  assert.equal(legacy.claimAtomic, undefined, 'an executor without the explicit capability retains the original path')
})

test('atomic adapter retains all native refusals and never invents a replacement operation', async () => {
  const s = await adapter()
  for (const status of ['blocked', 'collision', 'quota', 'not_due', 'superseded', 'mismatch', 'unavailable', 'unconfirmed'] as const) {
    s.setReply({ status })
    const result = await s.invoke()
    assert.notEqual(result.status, 'committed')
    assert.equal(s.calls.at(-1)![0].operation, 'queue_claim')
  }
  assert.equal(s.calls.length, 8); assert.deepEqual(s.remembered, []); assert.equal(s.retired(), 0)
  assert.equal((await s.storage.claimAtomic!(ids('op3', 'unbound'), s.command.commandKey, s.authority, signal())).status, 'unconfirmed')
  assert.equal(s.calls.length, 8)
})

test('atomic adapter refuses foreign authority, a non-claim command and a late ACK after abort', async () => {
  const s = await adapter()
  assert.equal((await s.invoke(signal(), { ...s.authority, method: { ...METHOD, revision: 2 } })).status, 'unconfirmed')
  assert.deepEqual(s.remembered, [])
  const enqueue = readM04Command({ action: 'enqueue', kind: 'rule_research', input: s.input }); assert.ok(enqueue)
  const foreign = createM04QueueStorage({ ...s.options, commandFor: () => enqueue }); assert.ok(foreign.claimAtomic)
  assert.equal((await foreign.claimAtomic(s.claim.operationId, s.command.commandKey, s.authority, signal())).status, 'unconfirmed')
  assert.equal(s.calls.length, 1, 'the non-claim never enters native execution')
  const controller = new AbortController(), entered = gate(), held = gate()
  s.control.execute = async () => { entered.release(); await held.promise; return decode(s.positive)! }
  let settled = false
  const pending = s.invoke(controller.signal).finally(() => { settled = true })
  try { await entered.promise; controller.abort(); await turn(); assert.equal(settled, false) } finally { held.release() }
  assert.equal((await pending).status, 'unconfirmed'); assert.deepEqual(s.remembered, [])
})

test('retained guard supplies its own predecessor/replay-only constraint and refuses caller overrides', async () => {
  const s = await fixtureQueue(true, 4), forwarded: Parameters<M04FixedOperation>[] = []
  const selector: M04FixedOperation = async request => request.operation === 'execution_read' ? { status: 'absent' }
    : request.operation === 'queue_read' ? { status: 'present', record: s.h.storage.records.get(s.claim.jobKey)! }
      : assert.fail('unexpected selection operation')
  const select = async () => {
    const selected = await selectRetainedChDeClaim({ root: s.claim, method: METHOD, attemptLimit: 4, fixed: selector,
      now: s.h.clock.now, deadline: performance.now() + 5000, signal: signal() })
    assert.equal(selected.status, 'selected'); if (selected.status !== 'selected') assert.fail('no selection')
    return selected
  }
  const fixed: M04FixedOperation = async (...args) => { forwarded.push(args); return { status: 'not_due' } }
  const request: Extract<M04Operation, { operation: 'queue_claim' }> = { operation: 'queue_claim',
    body: { command: s.command.value, continuation: null, expected: null, replayOnly: false } }
  const fresh = await select(), receipt = Object.freeze({}), child = signal()
  await guardRetainedChDeClaim(fresh, fixed)(request, child, receipt)
  assert.deepEqual(forwarded[0], [{ ...request, body: { ...request.body, expected: fresh.predecessor } }, child, receipt, undefined, undefined])
  for (const body of [{ ...request.body, expected: fresh.predecessor }, { ...request.body, replayOnly: true },
    { ...request.body, command: { action: 'claim', input: { ...s.claim, leaseId: ids('lease3', 'foreign-selection') } } }]) {
    assert.equal((await guardRetainedChDeClaim(fresh, fixed)({ ...request, body }, child, receipt)).status, 'blocked')
  }
  assert.equal(forwarded.length, 1)
  await s.acquire()
  const replay = await select(); assert.equal(replay.predecessor, null)
  await guardRetainedChDeClaim(replay, fixed)(request, child, receipt)
  assert.deepEqual(forwarded[1][0], { ...request, body: { ...request.body, expected: null, replayOnly: true } })
  assert.deepEqual(request.body, { command: s.command.value, continuation: null, expected: null, replayOnly: false }, 'caller bytes remain unchanged')
})

async function factory(fault?: 'lost_ack' | 'wrong_lease' | 'epoch_changed') {
  const s = await acquired(), calls: { operation: string; phase: string; body: Record<string, unknown>; epoch: number | null }[] = []
  const binding = { ...METHOD, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
  let epoch = 1, reads = 0, producers = 0
  const execute: M04TerminalExecutor['executeFixed'] = async request => {
    const wire = JSON.parse(request.operationText)
    calls.push({ ...wire, epoch: request.epoch })
    if (wire.operation === 'queue_claim') {
      assert.equal(wire.phase, 'authorized'); assert.equal(request.epoch, 1)
      assert.deepEqual(wire.body, { command: s.command.value, continuation: null, expected: null, replayOnly: false })
      if (fault === 'lost_ack') return { status: 'unconfirmed' }
      if (fault === 'epoch_changed') epoch = 2
      let reply = s.positive
      if (fault === 'wrong_lease') {
        const next = { ...s.record, lease: { ...s.record.lease!, leaseId: ids('lease3', 'invalid-native-ack') } }
        reply = s.wire({ ...s.commit, next })
      }
      return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
    }
    if (wire.operation === 'execution_read') return { status: 'acknowledged', rows: [{ result: '{"status":"absent"}' }] }
    if (wire.operation === 'execution_start') return { status: 'acknowledged', rows: [{ result: '{"status":"blocked"}' }] }
    throw Error('unexpected legacy or replacement operation')
  }
  const config: M04Config = { binding, registry: s.f.registry, clock: () => ({ now: s.h.clock.now(), legalDate: '2026-11-09' }),
    methodExecutor: { async readCurrent() { reads++; return { status: 'rows', rows: [{ status: 'approved', method_id: METHOD.methodId,
      revision: '1', method_digest: binding.methodDigest, package_digest: binding.packageDigest, epoch: String(epoch),
      approval_mode: 'until_revoked', approval_until: null, observed_at: s.h.clock.now(), remaining_ms: '5000' }] } } },
    jobsExecutor: { executeFixed: execute, executeAtomicClaimFixed: execute },
    intakeExecutor: { async execute() { assert.fail('no intake effect') } },
    producer: { async produce() { producers++; assert.fail('blocked START cannot reach a producer') } },
    evidence: { async inspect() { assert.fail('no evidence effect') }, async reprove() { assert.fail('no evidence effect') } },
    history: { async read() { assert.fail('no history effect') }, async reprove() { assert.fail('no history effect') } } }
  return { ...s, config, calls, counts: () => ({ reads, producers }) }
}

for (const fault of [undefined, 'lost_ack', 'wrong_lease', 'epoch_changed'] as const) {
  test(`real private factory binds atomic ACK custody before START (${fault ?? 'valid'})`, async () => {
    const s = await factory(fault)
    await createV3PostgresDurableJobs(s.config).workOnce(s.claim)
    assert.equal(s.calls.filter(c => c.operation === 'queue_claim').length, 1)
    assert.equal(s.calls.filter(c => ['queue_confirm', 'queue_read', 'queue_cas'].includes(c.operation)).length, 0)
    assert.equal(s.calls.filter(c => c.operation === 'execution_start').length, fault ? 0 : 1)
    assert.equal(s.counts().producers, 0)
  })
}

test('atomic executor capability must be an own function property, never a getter/prototype flag', async () => {
  for (const shape of ['absent', 'getter', 'prototype', 'boolean'] as const) {
    const s = await factory(); let getters = 0
    const original = s.config.jobsExecutor
    const executor: Record<string, unknown> = shape === 'prototype'
      ? Object.assign(Object.create({ executeAtomicClaimFixed: original.executeAtomicClaimFixed }), { executeFixed: original.executeFixed })
      : { executeFixed: original.executeFixed }
    if (shape === 'getter') Object.defineProperty(executor, 'executeAtomicClaimFixed', { get() { getters++; return original.executeAtomicClaimFixed } })
    if (shape === 'boolean') executor.executeAtomicClaimFixed = true
    await createV3PostgresDurableJobs({ ...s.config, jobsExecutor: executor as unknown as M04TerminalExecutor }).workOnce(s.claim)
    assert.equal(getters, 0); assert.equal(s.calls.filter(c => c.operation === 'queue_claim').length, 0)
    assert.equal(s.calls.filter(c => c.operation === 'execution_start').length, 0)
  }
})
