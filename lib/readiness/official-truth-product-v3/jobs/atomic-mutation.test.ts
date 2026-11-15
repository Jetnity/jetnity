// Closed protocol/factory fault injection, with the original coordinator as the
// independent transition oracle. These replies are not native SQL evidence.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3QueueCommit,
  type V3QueueResult, type V3QueueCommitAuthority, type V3ManagedJobRecord } from '../monitor/queue'
import { fixture, queueHarness, ids, ref, METHOD } from '../monitor/test-support'
import { key } from '../monitor/internal'
import { hrs1Canonical } from '../result/contract'
import { readV3GlobalRuleContext, readV3ResearchJobRecord, type V3GlobalRuleContext } from '../contract'
import { createV3PostgresDurableJobs } from '../method/authority-postgres'
import { createM04QueueStorage } from './postgres'
import { readM04Command, readM04NativeReply, type M04Command, type M04Config, type M04FixedOperation,
  type M04NativeReply, type M04Operation, type M04TerminalExecutor, type M04Continuation, type M04Disposition } from './contract'
import { chDeRefreshRequestIdentity, selectRetainedChDeClaim, guardRetainedChDeClaim } from './selected-claim'
import { createM04InvocationScope, createM04LanePool } from './owned-scope'

type Action = 'enqueue' | 'complete' | 'fail'
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
function decode(value: unknown) { return readM04NativeReply([{ result: JSON.stringify(value) }], 'queue_mutate') }

async function reference(action: Action = 'fail', namespace: 'rule' | 'discovery' = 'rule', attemptLimit = 3,
  retained = false, contextOverride?: V3GlobalRuleContext) {
  const f = fixture(), h = queueHarness(), commits: V3QueueCommit[] = []
  const create = namespace === 'rule' ? createV3QueueCoordinator : createV3DiscoveryQueueCoordinator
  const queue = create({ ...h.options, invocationMilliseconds: 5000, backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000,
    storage: { read: h.storage.read.bind(h.storage), confirm: h.storage.confirm.bind(h.storage),
      async compareAndSwap(commit, authority, child) {
        const reply = await h.storage.compareAndSwap(commit, authority, child)
        if (reply.status === 'committed') commits.push(structuredClone(commit))
        return reply
      } } })
  const claim = { operationId: ids('op3', 'mutation-codec-' + namespace),
    jobKey: namespace === 'rule' ? f.identity.jobKey : '', leaseId: ids('lease3', 'mutation-codec-' + namespace), leaseMilliseconds: 30000 }
  const enqueue = { ...(namespace === 'rule' ? f.enqueue : f.discoveryEnqueue),
    ...(namespace === 'rule' && contextOverride ? { context: contextOverride, factKind: 'entry_information' as const } : {}),
    ...(retained ? chDeRefreshRequestIdentity(claim)! : {}), attemptLimit }
  const before = confirmed(await queue.enqueue(enqueue))
  claim.jobKey = before.kind === 'research_job_record' ? before.jobKey : before.identity.jobKey
  let input: Record<string, unknown> = enqueue, record = before, leased: V3ManagedJobRecord | null = null
  if (action !== 'enqueue') {
    leased = confirmed(await queue.claim(claim)); assert.ok(leased.lease)
    const fence = { jobId: leased.jobId, revision: leased.revision, leaseId: leased.lease.leaseId, generation: leased.lease.generation }
    const kind = action === 'complete' ? 'complete' : 'fail-unreachable'
    input = { operationId: 'op3_' + key('worker-command', { kind, jobId: leased.jobId, fence }).split(':').at(-1)!.slice(0, 32),
      jobKey: claim.jobKey, fence, ...(action === 'fail' ? { reason: 'unreachable' }
        : namespace === 'rule' ? { decisionRef: ref('source-decision', 'mutation-result') }
          : { discoveryRef: ref('combination-discovery-result', 'mutation-result') }) }
    record = confirmed(await queue[action](input))
  }
  const command = readM04Command({ action, ...(action === 'fail' ? {} : { kind: namespace === 'rule' ? 'rule_research' : 'combination_discovery' }), input })
  assert.ok(command)
  const commit = commits.at(-1)!
  const wire = (value: V3QueueCommit = commit, c: M04Command = command, replayed = false, currentRecord: V3ManagedJobRecord = value.next): Wire => ({
    status: 'committed', operationId: c.operationId, commandKey: c.commandKey, commandText: c.commandText,
    envelopeText: hrs1Canonical(value), record: value.next, replayed, currentRecord,
  })
  return { f, h, queue, before, enqueue, input, action, record, leased, claim, command, commit, commits, wire, positive: wire() }
}

for (const namespace of ['rule', 'discovery'] as const) for (const action of ['enqueue', 'complete', 'fail'] as const) {
  test(`queue_mutate validates the complete original ${namespace} ${action} receipt`, async () => {
    const s = await reference(action, namespace)
    assert.deepEqual(decode(s.positive), s.positive)
    assert.deepEqual(decode({ ...s.positive, replayed: true }), { ...s.positive, replayed: true })
  })
}

test('native mutation refusals are exact and cannot expose a probe or acquire a claim', async () => {
  for (const status of ['blocked', 'collision', 'quota', 'superseded', 'mismatch']) assert.deepEqual(decode({ status }), { status })
  for (const status of ['not_due', 'requires_authority', 'not_attempted', 'absent', 'present', 'reserved', 'unknown']) assert.equal(decode({ status }), null)
  const s = await reference(), c = readM04Command({ action: 'claim', input: s.claim }); assert.ok(c)
  assert.equal(decode(s.wire(s.commits[1], c)), null)
})

test('mutation decoder rejects missing/foreign/duplicate fields and noncanonical original bytes', async () => {
  const s = await reference(), missing = { ...s.positive }; delete missing.currentRecord
  for (const value of [missing, { ...s.positive, replayed: 'false' }, { ...s.positive, privateReceipt: {} },
    { ...s.positive, commandText: ' ' + s.command.commandText }, { ...s.positive, envelopeText: JSON.stringify(s.commit, null, 2) }]) assert.equal(decode(value), null)
  const duplicate = JSON.stringify(s.positive).replace('"replayed":false', '"replayed":true,"replayed":false')
  assert.equal(readM04NativeReply([{ result: duplicate }], 'queue_mutate'), null)
  let getters = 0
  assert.equal(readM04NativeReply([{ get result() { getters++; return JSON.stringify(s.positive) } }], 'queue_mutate'), null)
  assert.equal(getters, 0)
})

for (const action of ['enqueue', 'complete', 'fail'] as const) {
  test(`mutation decoder refuses self-consistent ${action} record/envelope substitutions`, async () => {
    const s = await reference(action)
    const variants: V3QueueCommit[] = [
      { ...s.commit, next: { ...s.record, jobId: ids('job3', 'foreign-cycle') } },
      { ...s.commit, notAfter: new Date(Date.parse(s.commit.notAfter) + 1).toISOString() },
      { ...s.commit, audit: { ...s.commit.audit, kind: action === 'enqueue' ? 'deduplicated' : 'leased' } },
    ]
    if (action === 'complete') variants.push({ ...s.commit, next: { ...s.record, resultDecisionRef: ref('source-decision', 'foreign-result') } as V3ManagedJobRecord })
    if (action === 'fail') variants.push({ ...s.commit, next: { ...s.record, lastFailure: 'invalid_proposal' } },
      { ...s.commit, next: { ...s.record, nextAttemptAt: new Date(Date.parse(s.record.nextAttemptAt!) + 1).toISOString() } })
    for (const value of variants) assert.equal(decode(s.wire(value)), null)
  })
}

test('enqueue dedup keeps its original active cycle; failure exhaustion stays a distinct transition', async () => {
  const s = await reference('fail'), input = { ...s.enqueue, operationId: ids('op3', 'mutation-dedup'), jobId: ids('job3', 'dedup-not-adopted') }
  const result = confirmed(await s.queue.enqueue(input)), c = readM04Command({ action: 'enqueue', kind: 'rule_research', input }); assert.ok(c)
  assert.notEqual(result.jobId, input.jobId)
  assert.equal(decode(s.wire(s.commits.at(-1)!, c))?.status, 'committed')
  const last = await reference('fail', 'rule', 1)
  assert.equal(last.record.state, 'exhausted'); assert.equal(decode(last.positive)?.status, 'committed')
})

test('a replay keeps immutable receipt bytes and returns the genuinely later same-cycle current record', async () => {
  const s = await reference(); s.h.clock.advance(1000)
  const current = confirmed(await s.queue.claim({ ...s.claim, operationId: ids('op3', 'mutation-replay-next'), leaseId: ids('lease3', 'mutation-replay-next') }))
  const replay = s.wire(s.commit, s.command, true, current)
  assert.equal(decode(replay)?.status, 'committed'); assert.equal(replay.envelopeText, s.positive.envelopeText)
  assert.equal(decode({ ...replay, replayed: false }), null, 'a fresh mutation cannot borrow a later generation')
  for (const changed of [
    { ...current, jobId: ids('job3', 'foreign') }, { ...current, operationId: ids('op3', 'foreign') },
    { ...current, createdAt: new Date(Date.parse(current.createdAt) - 1).toISOString() },
    { ...current, attemptLimit: current.attemptLimit + 1 },
    { ...current, method: { ...METHOD, revision: 2 } },
  ]) assert.equal(decode({ ...replay, currentRecord: changed }), null)
})

test('same-revision replay cannot rewrite a valid row or reset an immutable cycle limit', async () => {
  const s = await reference('enqueue'), current = { ...s.record, attemptLimit: s.record.attemptLimit + 1 }
  assert.ok(readV3ResearchJobRecord(current).ok)
  assert.equal(decode({ ...s.positive, replayed: true, currentRecord: current }), null)
  const late = { ...s.record, updatedAt: new Date(Date.parse(s.record.updatedAt) + 1).toISOString() }
  assert.ok(readV3ResearchJobRecord(late).ok)
  assert.equal(decode({ ...s.positive, replayed: true, currentRecord: late }), null)
})

test('a terminal replay cannot invent another lifecycle within the completed or exhausted job', async () => {
  for (const action of ['complete', 'fail'] as const) {
    const s = await reference(action, 'rule', 1)
    const current = { ...s.record, revision: s.record.revision + 1, predecessorRevision: s.record.revision,
      updatedAt: new Date(Date.parse(s.record.updatedAt) + 1).toISOString() }
    assert.ok(readV3ResearchJobRecord(current).ok)
    assert.equal(decode({ ...s.positive, replayed: true, currentRecord: current }), null)
  }
})

test('the full16-node context and112 support IDs fit the unchanged atomic response contract', async t => {
  const f = fixture(); let support = 0
  const atom = () => ({ op: 'atomic', predicate: { kind: 'destination_permission', destinationCountryCode: 'CH',
    permissionClass: 'electronic_travel_authorization', validity: 'valid_on_travel_date' },
  supportVersionIds: Array.from({ length: 8 }, () => 'ev2_' + (++support).toString(16).padStart(32, '0')) })
  const context = readV3GlobalRuleContext({ ...f.enqueue.context, contextRevision: 3, informationTopic: 'entry_forms',
    informationItem: 'a'.repeat(24) + '_' + 'b'.repeat(24) + '_' + 'c'.repeat(14), conditions: { status: 'specified',
      expression: { op: 'all', operands: [{ op: 'any', operands: Array.from({ length: 7 }, atom) }, ...Array.from({ length: 7 }, atom)] } } })
  assert.ok(context.ok); if (!context.ok) assert.fail('bounded context required')
  const s = await reference('enqueue', 'rule', 16, false, context.value)
  confirmed(await s.queue.claim({ ...s.claim, leaseMilliseconds: 900000 }))
  const input = { ...s.enqueue, operationId: ids('op3', 'large-response-dedup'), jobId: ids('job3', 'large-response-dedup') }
  const current = confirmed(await s.queue.enqueue(input)), command = readM04Command({ action: 'enqueue', kind: 'rule_research', input })
  assert.ok(command); assert.ok(readV3ResearchJobRecord(current).ok)
  const commit = s.commits.at(-1)!, reply = s.wire(commit, command, false, current)
  const wireBytes = Buffer.byteLength(JSON.stringify(reply))
  assert.ok(wireBytes > 45000 && wireBytes < 262144)
  assert.equal(decode(reply)?.status, 'committed')
  t.diagnostic(JSON.stringify({ conditionNodes: 16, atomicPredicates: 14, supportIds: support,
    contextBytes: Buffer.byteLength(hrs1Canonical(context.value)), jobBytes: Buffer.byteLength(hrs1Canonical(current)),
    commandBytes: Buffer.byteLength(command.commandText), envelopeBytes: Buffer.byteLength(hrs1Canonical(commit)), wireBytes }))
})

async function adapter(action: Action = 'fail') {
  const s = await reference(action), calls: Parameters<M04FixedOperation>[] = [], remembered: V3ManagedJobRecord[] = [], lifecycle: string[] = []
  const attemptKey = ref('execution-attempt', 'mutation'), token = 'a'.repeat(64)
  const continuation: M04Continuation = action === 'enqueue' ? null : action === 'complete'
    ? { kind: 'prepared', claim: s.claim, attemptKey } : { kind: 'owned_failure', claim: s.claim, attemptKey, token }
  const disposition: M04Disposition = action === 'enqueue' ? { kind: 'regular' } : action === 'complete'
    ? { kind: 'completed', attemptKey } : { kind: 'settled_failure', attemptKey, token }
  let current = decode(s.positive)!, retired = 0
  const control = { execute: async (): Promise<M04NativeReply> => current }
  const fixed: M04FixedOperation = async (...args) => { calls.push(args); return control.execute() }
  const options = { fixed, atomicMutationFixed: fixed,
    commandFor: (op: string, command: string) => op === s.command.operationId && command === s.command.commandKey ? s.command : null,
    continuation: () => continuation, disposition: () => disposition,
    onRecord(record: V3ManagedJobRecord) { remembered.push(record); lifecycle.push('record') },
    settled() { retired++; lifecycle.push('settled') } }
  const storage = createM04QueueStorage(options); assert.ok(storage.mutateAtomic)
  const authority: V3QueueCommitAuthority = { method: METHOD, receipt: Object.freeze({}), reprove: async () => true }
  return { ...s, options, storage, authority, continuation, disposition, calls, remembered, lifecycle, control,
    retired: () => retired, setReply(value: M04NativeReply) { current = value },
    invoke: (child = signal(), auth = authority) => storage.mutateAtomic!(s.command.operationId, s.command.commandKey, auth, child) }
}

for (const action of ['enqueue', 'complete', 'fail'] as const) {
  test(`atomic ${action} adapter emits one bound request and retires continuation only after exact ACK`, async () => {
    const s = await adapter(action), child = signal()
    assert.deepEqual(await s.invoke(child), { status: 'committed', operationId: s.command.operationId,
      commandKey: s.command.commandKey, record: s.record, replayed: false })
    assert.deepEqual(s.calls, [[{ operation: 'queue_mutate', body: { command: s.command.value,
      continuation: s.continuation, disposition: s.disposition, expected: null } }, child, s.authority.receipt, action !== 'enqueue']])
    assert.deepEqual(s.lifecycle, action === 'enqueue' ? ['record'] : ['settled', 'record'])
    assert.equal(createM04QueueStorage({ ...s.options, atomicMutationFixed: undefined }).mutateAtomic, undefined)
  })
}

test('unknown/refused/foreign mutation replies retain terminal continuation and create no replacement operation', async () => {
  const s = await adapter()
  for (const status of ['blocked', 'collision', 'quota', 'superseded', 'mismatch', 'unavailable', 'unconfirmed'] as const) {
    s.setReply({ status }); assert.notEqual((await s.invoke()).status, 'committed')
  }
  s.setReply(decode(s.positive)!)
  assert.equal((await s.invoke(signal(), { ...s.authority, method: { ...METHOD, revision: 2 } })).status, 'unconfirmed')
  assert.equal(s.calls.length, 8); assert.equal(s.retired(), 0); assert.deepEqual(s.remembered, [])
  assert.equal((await s.storage.mutateAtomic!(ids('op3', 'unbound'), s.command.commandKey, s.authority, signal())).status, 'unconfirmed')
  assert.equal(s.calls.length, 8)
})

test('mutation adapter returns the real current replay record, while preserving the immutable original receipt', async () => {
  const s = await adapter(); s.h.clock.advance(1000)
  const current = confirmed(await s.queue.claim({ ...s.claim, operationId: ids('op3', 'adapter-next'), leaseId: ids('lease3', 'adapter-next') }))
  s.setReply(decode(s.wire(s.commit, s.command, true, current))!)
  const result = await s.invoke()
  assert.deepEqual(result, { status: 'committed', operationId: s.command.operationId, commandKey: s.command.commandKey, record: current, replayed: true })
  assert.deepEqual(s.remembered, [current]); assert.equal(s.retired(), 1)
})

test('late or throwing terminal ACKs never retire continuation before actual executor drain', async () => {
  for (const rejects of [false, true]) {
    const s = await adapter(), entered = gate(), held = gate(), controller = new AbortController()
    s.control.execute = async () => { entered.release(); await held.promise; if (rejects) throw Error('lost ACK'); return decode(s.positive)! }
    let settled = false
    const pending = s.invoke(controller.signal).then(value => value.status, () => 'rejected').finally(() => { settled = true })
    try { await entered.promise; controller.abort(); await turn(); assert.equal(settled, false); assert.equal(s.retired(), 0) } finally { held.release() }
    assert.notEqual(await pending, 'committed'); assert.equal(s.retired(), 0); assert.deepEqual(s.remembered, [])
  }
})

test('mutations cannot borrow the claim capability or a mismatched terminal disposition', async () => {
  const s = await adapter(), c = readM04Command({ action: 'claim', input: s.claim }); assert.ok(c)
  const claimStore = createM04QueueStorage({ ...s.options, commandFor: () => c })
  assert.equal((await claimStore.mutateAtomic!(c.operationId, c.commandKey, s.authority, signal())).status, 'unconfirmed')
  const regular = createM04QueueStorage({ ...s.options, disposition: () => ({ kind: 'regular' }) })
  assert.equal((await regular.mutateAtomic!(s.command.operationId, s.command.commandKey, s.authority, signal())).status, 'unavailable')
  assert.equal(s.calls.length, 0); assert.equal(s.retired(), 0)
})

test('retained terminal mutation requires an actual observed acquisition and supplies only its own expected record', async () => {
  const s = await reference('fail', 'rule', 3, true), forwarded: Parameters<M04FixedOperation>[] = []
  const selector: M04FixedOperation = async request => request.operation === 'execution_read' ? { status: 'absent' }
    : request.operation === 'queue_read' ? { status: 'present', record: s.before } : assert.fail('unexpected selection')
  const selected = await selectRetainedChDeClaim({ root: s.claim, method: METHOD, attemptLimit: 3, fixed: selector,
    now: s.h.clock.now, deadline: performance.now() + 5000, signal: signal() })
  assert.equal(selected.status, 'selected'); if (selected.status !== 'selected') assert.fail('selection required')
  const claimCommand = readM04Command({ action: 'claim', input: s.claim }); assert.ok(claimCommand && s.leased)
  const fixed: M04FixedOperation = async (...args) => {
    forwarded.push(args)
    if (args[0].operation === 'queue_claim') {
      const value = s.wire(s.commits[1], claimCommand); delete value.currentRecord
      return readM04NativeReply([{ result: JSON.stringify(value) }], 'queue_claim')!
    }
    return decode(s.positive)!
  }
  const guarded = guardRetainedChDeClaim(selected, fixed), attemptKey = ref('execution-attempt', 'retained'), token = 'b'.repeat(64)
  const request: Extract<M04Operation, { operation: 'queue_mutate' }> = { operation: 'queue_mutate', body: { command: s.command.value,
    continuation: { kind: 'owned_failure', claim: s.claim, attemptKey, token }, disposition: { kind: 'settled_failure', attemptKey, token }, expected: null } }
  assert.equal((await guarded(request, signal())).status, 'blocked'); assert.equal(forwarded.length, 0)
  await guarded({ operation: 'queue_claim', body: { command: claimCommand.value, continuation: null, expected: null, replayOnly: false } }, signal())
  assert.equal(forwarded.length, 1)
  for (const body of [{ ...request.body, expected: s.leased }, { ...request.body,
    continuation: { ...request.body.continuation!, claim: { ...s.claim, leaseId: ids('lease3', 'foreign') } } }]) {
    assert.equal((await guarded({ ...request, body }, signal())).status, 'blocked')
  }
  const receipt = Object.freeze({}), child = signal()
  assert.equal((await guarded(request, child, receipt, true)).status, 'committed')
  assert.deepEqual(forwarded[1], [{ ...request, body: { ...request.body, expected: s.leased } }, child, receipt, true, undefined])
  assert.equal(request.body.expected, null, 'the caller cannot supply or acquire the guard restriction')
})

test('terminal reserve recognizes only the owned command, attempt, continuation and token agreement', async () => {
  const s = await adapter(), scope = createM04InvocationScope(createM04LanePool(), 30000); assert.ok(scope)
  const request: Extract<M04Operation, { operation: 'queue_mutate' }> = { operation: 'queue_mutate', body: {
    command: s.command.value, continuation: s.continuation, disposition: s.disposition, expected: null } }
  try {
    assert.equal(scope.terminalOperation(request), false)
    scope.markUnresolved(); scope.sealProcessing()
    assert.ok(s.continuation && s.disposition.kind === 'settled_failure')
    assert.equal(scope.beginTerminal({ claim: s.claim, attemptKey: s.continuation.attemptKey, commandKey: s.command.commandKey }), true)
    assert.equal(scope.terminalOperation(request), true)
    for (const body of [{ ...request.body, continuation: null }, { ...request.body, disposition: { kind: 'regular' as const } },
      { ...request.body, disposition: { ...s.disposition, token: 'c'.repeat(64) } },
      { ...request.body, disposition: { ...s.disposition, attemptKey: ref('execution-attempt', 'other') } }]) {
      assert.equal(scope.terminalOperation({ ...request, body }), false)
    }
    scope.markAmbiguous(); assert.equal(scope.terminalOperation(request), false)
  } finally { await scope.finish() }
})

async function factory(fault?: 'lost_ack' | 'changed_transition' | 'epoch_changed') {
  const s = await reference('enqueue'), calls: { operation: string; phase: string; body: unknown }[] = []
  const binding = { ...METHOD, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
  let epoch = 1, legacy = 0
  const executeAtomicMutationFixed: NonNullable<M04TerminalExecutor['executeAtomicMutationFixed']> = async request => {
    const wire = JSON.parse(request.operationText); calls.push(wire)
    if (fault === 'lost_ack') return { status: 'unconfirmed' }
    if (fault === 'epoch_changed') epoch = 2
    const reply = fault === 'changed_transition' ? s.wire({ ...s.commit, next: { ...s.record, jobId: ids('job3', 'forged') } }) : s.positive
    return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
  }
  const config: M04Config = { binding, registry: s.f.registry, clock: () => ({ now: s.h.clock.now(), legalDate: '2026-11-09' }),
    methodExecutor: { async readCurrent() { return { status: 'rows', rows: [{ status: 'approved', method_id: METHOD.methodId,
      revision: '1', method_digest: binding.methodDigest, package_digest: binding.packageDigest, epoch: String(epoch),
      approval_mode: 'until_revoked', approval_until: null, observed_at: s.h.clock.now(), remaining_ms: '5000' }] } } },
    jobsExecutor: { async executeFixed() { legacy++; return { status: 'unavailable' } }, executeAtomicMutationFixed },
    intakeExecutor: { async execute() { assert.fail('enqueue creates no source original') } },
    producer: { async produce() { assert.fail('mutation ACK cannot acquire START') } },
    evidence: { async inspect() { assert.fail('no evidence effect') }, async reprove() { assert.fail('no evidence effect') } },
    history: { async read() { assert.fail('no history effect') }, async reprove() { assert.fail('no history effect') } } }
  return { ...s, config, calls, legacy: () => legacy }
}

for (const fault of [undefined, 'lost_ack', 'changed_transition', 'epoch_changed'] as const) {
  test(`real factory selects one atomic enqueue with no fallback (${fault ?? 'valid'})`, async () => {
    const s = await factory(fault), result = await createV3PostgresDurableJobs(s.config).enqueueRule(s.input)
    assert.equal(result.status === 'confirmed', !fault)
    assert.equal(s.calls.length, 1); assert.equal(s.calls[0].operation, 'queue_mutate'); assert.equal(s.calls[0].phase, 'authorized')
    assert.deepEqual(s.calls[0].body, { command: s.command.value, continuation: null, disposition: { kind: 'regular' }, expected: null })
    assert.equal(s.legacy(), 0)
  })
}

test('mutation executor capability requires its own function descriptor and never invokes getters or prototype flags', async () => {
  for (const shape of ['absent', 'getter', 'prototype', 'boolean'] as const) {
    const s = await factory(); let getters = 0
    const original = s.config.jobsExecutor
    const executor: Record<string, unknown> = shape === 'prototype'
      ? Object.assign(Object.create({ executeAtomicMutationFixed: original.executeAtomicMutationFixed }), { executeFixed: original.executeFixed })
      : { executeFixed: original.executeFixed }
    if (shape === 'getter') Object.defineProperty(executor, 'executeAtomicMutationFixed', { get() { getters++; return original.executeAtomicMutationFixed } })
    if (shape === 'boolean') executor.executeAtomicMutationFixed = true
    assert.notEqual((await createV3PostgresDurableJobs({ ...s.config, jobsExecutor: executor as unknown as M04TerminalExecutor }).enqueueRule(s.input)).status, 'confirmed')
    assert.equal(getters, 0); assert.equal(s.calls.length, 0)
  }
})
