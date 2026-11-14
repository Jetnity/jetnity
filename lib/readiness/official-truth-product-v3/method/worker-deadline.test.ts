// Offline negative factory contracts. No real connection, accepted source or approval.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { createV3ContextIdentity, createV3WorkIdentity, readV3GlobalRuleContext } from '../contract'
import { readM04Command, type M04TerminalExecutor, type M04Claim } from '../jobs/contract'
import { chDeRefreshRequestIdentity, retainedChDeClaim } from '../jobs/selected-claim'
import { key } from '../monitor/internal'
import type { V3ManagedJobRecord, V3QueueCommit } from '../monitor/queue'
import { hrs1Clock, hrs1Canonical, readHrs1Binding, type Hrs1TerminalExecutor } from '../result/contract'
import type { Hrs1SourceCustodyIssuer } from '../result/source-proof'
import { withDevImportDiagnostics } from '../runtime/dev-diagnostics'
import { createV3PostgresResultJobs, type Ma1MethodSqlExecutor } from './authority-postgres'

type Budget = Readonly<{ deadline: number }>
const method = { methodId: 'deadline_fixture', revision: 1, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
const signal = () => new AbortController().signal
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

/** Same finite negative fixture pattern as A3: .example profiles always refuse.
 * A real native-port call is required below, so invalid_config cannot pass. */
function fixture(options: {
  method?: Ma1MethodSqlExecutor['readCurrent']; jobs?: M04TerminalExecutor['executeFixed'];
  writer?: Hrs1TerminalExecutor['executeFixed']; clockNow?: () => string; monitorLeaseMilliseconds?: number;
  ids?: () => Readonly<{ jobId: string; operationId: string }>;
} = {}) {
  const roles = ['primary', 'counter'] as const
  const source = (role: typeof roles[number]) => ({ sourceId: 'deadline-' + role,
    contentItemId: 'synthetic-visa', contentItemVersion: 1, representationId: 'synthetic-json',
    representationVersion: 1, identityProfileId: 'deadline-synthetic-profile', identityProfileVersion: 1 })
  const url = (role: typeof roles[number]) => 'https://deadline-' + role + '.example/visa'
  const created = quellenRegistryErstellen(roles.map(role => ({ sourceId: source(role).sourceId,
    sourceClass: 'official_authority', publisherName: 'Synthetic deadline publisher', authorityName: 'Synthetic deadline authority',
    domains: ['deadline-' + role + '.example'] })))
  assert.ok(created.ok); if (!created.ok) assert.fail('synthetic registry refused')
  const graph = createContentIdentityGraph(created.registry, roles.map(role => ({ sourceId: source(role).sourceId,
    contentItemId: 'synthetic-visa', contentItemVersion: 1, current: true, externalIdNamespace: 'synthetic',
    externalContentId: 'deadline-visa', expectedPublisherIds: ['synthetic'], expectedAuthorityIds: ['synthetic'] })),
  roles.map(role => ({ ...source(role), current: true, requestUrls: [url(role)], expectedFinalUrl: url(role),
    expectedMediaType: 'application/json', expectedLocale: null, expectedSchema: null })),
  [{ identityProfileId: 'deadline-synthetic-profile', identityProfileVersion: 1, current: true,
    verify: () => ({ ok: false as const, reason: 'identity_mismatch' as const }) }])
  assert.ok(graph.ok); if (!graph.ok) assert.fail('synthetic graph refused')
  const registry = { ...created.registry, contentIdentity: graph.value }
  const context = readV3GlobalRuleContext({ scope: { destinationCountryCode: 'DE', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] }, credentialOption: { mode: 'option', documentType: 'passport',
      issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' }, residence: { mode: 'not_applicable' },
    requirementType: 'visa', validity: { mode: 'not_applicable' } }, route: 'direct_entry',
    conditions: { status: 'specified', expression: { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' } } } })
  if (!context.ok) assert.fail(context.reason)
  const identity = createV3ContextIdentity(context.value)
  if (!identity.ok) assert.fail(identity.reason)
  const binding = readHrs1Binding({ ...method, schema: 1, qualificationScope: 'global_context', context: context.value,
    contextKey: identity.value.contextKey, factKind: 'requirement_effect', dataMode: 'synthetic_test', legalTimeZone: 'Europe/Berlin',
    activeFrom: '2000-01-01T00:00:00.000Z', activeUntilExclusive: '2099-12-31T00:00:00.000Z',
    sourceMaxAgeMilliseconds: 300000, projectionMaxAgeMilliseconds: 60000, monitorIntervalMilliseconds: 100,
    monitorLeaseMilliseconds: options.monitorLeaseMilliseconds ?? 5000, attemptLimit: 3, sources: roles.map(role => ({ source: source(role), canonicalUrl: url(role),
      contentType: 'application/json', executableDigest: 'c'.repeat(64), qualificationDigest: 'd'.repeat(64), role })) }, registry)
  assert.ok(binding)
  const calls: { channel: 'method' | 'jobs'; budget: Budget; signal: AbortSignal }[] = []
  const state = { unexpected: 0, settled: 0 }
  const closed = Object.freeze<Hrs1TerminalExecutor>({ async executeFixed() { state.unexpected++; return { status: 'unavailable' } } })
  const issuer = Object.freeze<Hrs1SourceCustodyIssuer>({
    async inspect() { state.unexpected++; return null }, async finalize() { state.unexpected++; return null },
    async reprove() { state.unexpected++; return null }, async reopen() { state.unexpected++; return null },
    async observe() { state.unexpected++; return { status: 'unavailable' } }, async reproveObservation() { state.unexpected++; return null },
  })
  const facade = createV3PostgresResultJobs({ binding: method, registry,
    clock() { const clock = hrs1Clock(options.clockNow?.() ?? '2026-11-12T20:00:00.000Z', binding.legalTimeZone); assert.ok(clock); return clock },
    methodExecutor: Object.freeze<Ma1MethodSqlExecutor>({ async readCurrent(request, signal, budget) {
      assert.ok(budget); calls.push({ channel: 'method', budget, signal })
      try { return options.method ? await options.method(request, signal, budget) : { status: 'unavailable' } }
      finally { state.settled++ }
    } }),
    jobsExecutor: Object.freeze<M04TerminalExecutor>({ async executeFixed(request, signal) {
      calls.push({ channel: 'jobs', budget: request.budget, signal })
      try { return options.jobs ? await options.jobs(request, signal) : { status: 'unavailable' } }
      finally { state.settled++ }
    } }),
    intakeExecutor: { async execute() { state.unexpected++; return { status: 'unavailable' } } },
    producer: { async produce() { state.unexpected++; return { status: 'failed', reason: 'unreachable' } } },
    result: { binding, writerExecutor: options.writer ? { executeFixed: options.writer } : closed,
      readerExecutor: closed, verifierExecutor: closed, fixtureIssuer: issuer,
      ids: options.ids ?? (() => ({ jobId: 'job3_' + '1'.repeat(32), operationId: 'op3_' + '2'.repeat(32) })) },
  })
  return { facade, binding, calls, state }
}

/** Real HRS factory/strict native codecs and queues, with finite protocol doubles.
 * These tests do not claim hosted SQL, source or publication acceptance. */
function retainedFactory(options: { generation?: number; legacy?: boolean; expired?: boolean;
  execution?: 'absent' | 'unknown' | 'prepared' | 'completed'; loseClaimAck?: boolean } = {}) {
  type ResearchRecord = Extract<V3ManagedJobRecord, { kind: 'research_job_record' }>
  const now = '2026-11-12T20:00:00.000Z', timestamp = (delta: number) => new Date(Date.parse(now) + delta).toISOString()
  const requests: Record<string, unknown>[] = [], operations = new Map<string, V3QueueCommit>()
  let record: ResearchRecord, originalResult: Record<string, unknown> | null = null, lost = false, writes = 0
  const mode = options.execution ?? 'absent'
  const h = fixture({
    async method() { return { status: 'rows', rows: [{ status: 'approved', method_id: method.methodId,
      revision: '1', method_digest: method.methodDigest, package_digest: method.packageDigest, epoch: '1',
      approval_mode: 'until_revoked', approval_until: null, observed_at: now, remaining_ms: '5000' }] } },
    async jobs(request) {
      const q = JSON.parse(request.operationText), b = q.body
      requests.push(q)
      let reply: unknown
      if (q.operation === 'execution_read') {
        const matches = originalResult && hrs1Canonical(originalResult.claim) === hrs1Canonical(b.claim)
        reply = matches ? q.phase === 'probe' ? { status: 'requires_authority' } : originalResult
          : { status: mode === 'prepared' || mode === 'unknown' ? 'blocked' : 'absent' }
      } else if (q.operation === 'queue_read') {
        reply = mode === 'prepared' || mode === 'unknown' ? { status: 'blocked' }
          : q.phase === 'probe' ? { status: 'requires_authority' } : { status: 'present', record }
      } else if (q.operation === 'queue_confirm') {
        const c = readM04Command(b.command)!, old = operations.get(c.operationId)
        reply = mode === 'prepared' ? { status: 'blocked' } : !old ? { status: 'not_attempted' }
          : q.phase === 'probe' ? { status: 'requires_authority' }
            : { status: 'committed', operationId: c.operationId, commandKey: c.commandKey,
              commandText: c.commandText, envelopeText: hrs1Canonical(old), record: old.next }
      } else if (q.operation === 'queue_cas') {
        assert.equal(b.command.action, 'claim')
        assert.deepEqual(b.commit.expected, record)
        record = b.commit.next; operations.set(b.commit.operationId, b.commit); writes++
        if (options.loseClaimAck && !lost) { lost = true; return { status: 'unconfirmed' } }
        reply = { status: 'committed', record }
      } else {
        assert.equal(q.operation, 'execution_start')
        // Reaching the genuine fixed START proves the new private claim anchor;
        // the negative native reply deliberately prevents any producer execution.
        reply = { status: 'blocked' }
      }
      return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
    },
    ids() { assert.fail('retained requests never allocate replacement random IDs') },
  })
  const identity = createV3WorkIdentity({ context: h.binding.context,
    method: { methodId: method.methodId, revision: method.revision }, factKind: 'requirement_effect', researchReason: { status: 'missing' } })
  assert.ok(identity.ok)
  const root: M04Claim = { operationId: 'op3_' + 'a'.repeat(32), leaseId: 'lease3_' + 'b'.repeat(32),
    jobKey: identity.value.jobKey, leaseMilliseconds: 30000 }
  const derived = chDeRefreshRequestIdentity(root)!, cycle = options.legacy
    ? { operationId: 'op3_' + 'c'.repeat(32), jobId: 'job3_' + 'd'.repeat(32) } : derived
  record = { schema: 3, kind: 'research_job_record', ...cycle, jobKey: root.jobKey,
    context: h.binding.context, contextKey: identity.value.contextKey, research: identity.value.research,
    method: { methodId: method.methodId, revision: method.revision }, revision: 1, predecessorRevision: null,
    state: 'queued', createdAt: timestamp(-120000), updatedAt: timestamp(-120000), attempt: 0, attemptLimit: 3,
    lease: null, nextAttemptAt: null, lastFailure: null, resultDecisionRef: null }
  const generation = options.generation ?? 0
  let claim = root
  for (let index = 0; index <= generation; index++) {
    claim = retainedChDeClaim(root, index)!
    const command = readM04Command({ action: 'claim', input: claim })!
    const expected: ResearchRecord = record
    const at = timestamp(index === generation ? options.expired ? -31000 : -10000 : -60000 * (generation - index + 1))
    record = { ...expected, state: 'leased', revision: expected.revision + 1, predecessorRevision: expected.revision,
      updatedAt: at, attempt: index + 1, lease: { leaseId: claim.leaseId, generation: expected.revision + 1,
        acquiredAt: at, expiresAt: new Date(Date.parse(at) + 30000).toISOString() } }
    operations.set(claim.operationId, { operationId: claim.operationId, commandKey: command.commandKey,
      jobKey: root.jobKey, expected, next: record, notAfter: new Date(Date.parse(at) + 5000).toISOString(),
      audit: { reference: key('queue-event', { op: claim.operationId, command: command.commandKey }),
        kind: index === 0 ? 'leased' : 'reclaimed', observedAt: at, priorRevision: expected.revision, nextRevision: record.revision } })
  }
  if (mode === 'prepared' || mode === 'completed') {
    const leasedJob = record, decisionRef = 'source-decision:v3:' + 'e'.repeat(64)
    const result = { kind: 'rule_research', jobId: record.jobId, operationId: record.operationId, jobKey: root.jobKey,
      preparedAt: new Date(Date.parse(record.lease!.acquiredAt) + 1000).toISOString(), decisionRef }
    const references = [{ binding: { schema: 3, kind: 'proposal_intake_binding', operationId: 'op3_' + '1'.repeat(32),
      jobId: record.jobId, contextKey: identity.value.contextKey, method: record.method,
      runnerId: 'runner3_' + '2'.repeat(32), deliveryId: 'delivery3_' + '3'.repeat(32), inputRevision: 'snapshot:' + '4'.repeat(64) },
    proposalDigest: '5'.repeat(64), bytes: 100 }]
    if (mode === 'completed') record = { ...record, state: 'succeeded', revision: record.revision + 1,
      predecessorRevision: record.revision, updatedAt: timestamp(-100), lease: null, resultDecisionRef: decisionRef }
    originalResult = { status: mode, attemptKey: 'execution-attempt:v3:' + '6'.repeat(64),
      claim, leasedJob, result, references, ...(mode === 'completed' ? { job: record } : {}) }
  }
  return { ...h, root, claim, requests, operations, record: () => record, writes: () => writes,
    run: (budget?: Budget) => h.facade.workSelectedOnce('rule_research', signal(), budget,
      { operationId: root.operationId, leaseId: root.leaseId }) }
}

test('retained HRS factory reclaims one expired unstarted job under separate genuine anchors and one outer deadline', async () => {
  const h = retainedFactory({ expired: true }), before = h.record(), cap = { deadline: performance.now() + 30000 }
  await h.run(cap)
  const following = retainedChDeClaim(h.root, 1)!
  assert.equal(h.writes(), 1)
  assert.equal(h.record().jobId, before.jobId); assert.equal(h.record().attempt, 2)
  const writes = h.requests.filter(q => q.operation === 'queue_cas') as { body: { commit: V3QueueCommit } }[]
  assert.deepEqual(writes[0]!.body.commit.expected, before)
  const starts = h.requests.filter(q => q.operation === 'execution_start') as { body: { claim: M04Claim } }[]
  assert.equal(starts.length, 1); assert.deepEqual(starts[0]!.body.claim, following)
  assert.ok(h.calls.every(call => call.budget.deadline <= cap.deadline))
  assert.equal(h.state.settled, h.calls.length); assert.equal(h.state.unexpected, 0)
})

test('retained HRS factory finds following PREPARED/COMPLETED after blocked ordinary reads without a replacement claim', async t => {
  for (const execution of ['prepared', 'completed'] as const) await t.test(execution, async () => {
    const h = retainedFactory({ generation: 1, execution })
    await h.run()
    const reads = h.requests.filter(q => q.operation === 'execution_read') as { phase: string; body: { claim: M04Claim; purpose: string } }[]
    const actual = reads.filter(q => q.phase === 'authorized' && q.body.claim.operationId === h.claim.operationId)
    assert.ok(actual.length >= 2, 'both independent private selection and actual worker consume the same genuine result')
    assert.equal(h.writes(), 0)
    assert.ok(h.requests.every(q => q.operation !== 'execution_start'))
    if (execution === 'prepared') assert.ok(h.requests.some(q => q.operation === 'queue_confirm'), 'blocked initial queue read did not seal actual worker execution')
    else assert.ok(actual.some(q => q.body.purpose === 'artifact'))
    assert.equal(h.state.settled, h.calls.length)
  })
})

test('retained HRS factory preserves genuine legacy original results and still-valid original claims', async t => {
  for (const execution of ['absent', 'prepared', 'completed'] as const) await t.test(execution, async () => {
    const h = retainedFactory({ legacy: true, execution })
    await h.run()
    assert.equal(h.writes(), 0)
    const reads = h.requests.filter(q => q.operation === 'execution_read') as { phase: string; body: { claim: M04Claim } }[]
    assert.ok(reads.length >= 2)
    assert.ok(reads.every(q => q.body.claim.operationId === h.root.operationId))
    if (execution === 'absent') assert.ok(h.requests.some(q => q.operation === 'execution_start'))
    else assert.ok(reads.filter(q => q.phase === 'authorized').length >= 2)
  })
  const expired = retainedFactory({ legacy: true, expired: true })
  assert.equal((await expired.run()).status, 'unconfirmed'); assert.equal(expired.writes(), 0)
  assert.ok(expired.requests.every(q => q.operation !== 'execution_start'))
})

test('retained HRS factory never advances unknown START and recovers a lost following-claim ACK exactly', async t => {
  await t.test('unknown START', async () => {
    const h = retainedFactory({ generation: 1, execution: 'unknown', expired: true })
    assert.equal((await h.run()).status, 'unconfirmed')
    assert.equal(h.writes(), 0)
    assert.ok(h.requests.every(q => q.operation === 'queue_read' || q.operation === 'execution_read'))
    assert.ok(h.calls.length <= 6)
  })
  await t.test('lost claim ACK', async () => {
    const h = retainedFactory({ expired: true, loseClaimAck: true })
    assert.deepEqual(await h.run(), { status: 'worker_only', worker: { status: 'unconfirmed' } })
    const acquired = structuredClone(h.record())
    await h.run()
    assert.equal(h.writes(), 1); assert.deepEqual(h.record(), acquired)
    const starts = h.requests.filter(q => q.operation === 'execution_start') as { body: { claim: M04Claim } }[]
    assert.equal(starts.length, 1); assert.deepEqual(starts[0]!.body.claim, retainedChDeClaim(h.root, 1))
  })
})

test('optional worker and monitor caps only shorten the real HRS factory', { timeout: 15000 }, async t => {
  let now = 100_000
  t.mock.method(performance, 'now', () => now)
  await t.test('valid negative configuration reaches actual native ports under the same shorter cap', async () => {
    const h = fixture(), cap = Object.freeze({ deadline: now + 2_000 })
    await h.facade.monitorOnce(signal(), cap)
    assert.equal(h.calls.length, 1); assert.equal(h.calls[0]!.channel, 'method')
    assert.equal(h.calls[0]!.budget.deadline, cap.deadline); assert.ok(Object.isFrozen(h.calls[0]!.budget))
    h.calls.length = 0
    await h.facade.workSelectedOnce('combination_discovery', signal(), cap)
    assert.ok(h.calls.length > 0); assert.equal(h.calls[0]!.channel, 'jobs')
    assert.equal(h.calls[0]!.budget.deadline, cap.deadline); assert.ok(Object.isFrozen(h.calls[0]!.budget))
    assert.equal(h.state.unexpected, 0)
  })
  await t.test('invalid, expired, extra-field and accessor caps fail before native allocation', async () => {
    const h = fixture(); let getters = 0
    const accessor = Object.defineProperty({}, 'deadline', { enumerable: true, get() { getters++; return now + 5000 } })
    for (const raw of [null, {}, [], { deadline: NaN }, { deadline: Infinity }, { deadline: -Infinity },
      { deadline: now }, { deadline: now - 1 }, { deadline: '200000' },
      { deadline: now + 5000, override: true }, Object.create({ deadline: now + 5000 }), accessor]) {
      const cap = raw as Budget
      assert.equal((await h.facade.monitorOnce(signal(), cap)).status, 'unavailable')
      assert.equal((await h.facade.workSelectedOnce('rule_research', signal(), cap)).status, 'unavailable')
    }
    assert.equal(getters, 0); assert.equal(h.calls.length, 0); assert.equal(h.state.unexpected, 0)
  })
  await t.test('larger caps and the old optional-free calls preserve original smaller limits', async () => {
    const h = fixture(), cap = Object.freeze({ deadline: now + 60_000 })
    await h.facade.monitorOnce(signal(), cap)
    await h.facade.workSelectedOnce('rule_research', signal(), cap)
    assert.ok(h.calls.some(call => call.channel === 'method')); assert.ok(h.calls.some(call => call.channel === 'jobs'))
    for (const call of h.calls) assert.ok(call.budget.deadline <= now + 5000)
    h.calls.length = 0
    await h.facade.monitorOnce(signal())
    await h.facade.workSelectedOnce('rule_research', signal())
    assert.ok(h.calls.some(call => call.channel === 'method')); assert.ok(h.calls.some(call => call.channel === 'jobs'))
    assert.equal(h.state.unexpected, 0)
  })
  await t.test('pre-aborted outer signal starts neither worker nor monitor effects', async () => {
    const h = fixture(), controller = new AbortController(); controller.abort()
    assert.equal((await h.facade.monitorOnce(controller.signal, { deadline: now + 5000 })).status, 'interrupted')
    assert.equal((await h.facade.workSelectedOnce('rule_research', controller.signal, { deadline: now + 5000 })).status, 'unavailable')
    assert.equal(h.calls.length, 0)
  })
  await t.test('captured deadline cannot be extended during a real pending native promise', async () => {
    const entered = deferred<void>(), gate = deferred<void>()
    const h = fixture({ async jobs() { entered.resolve(); await gate.promise; return { status: 'unavailable' } } })
    const cap = { deadline: now + 2000 }, original = cap.deadline
    let answered = false
    const joined = h.facade.workSelectedOnce('rule_research', signal(), cap).then(result => { answered = true; return result })
    try {
      await entered.promise; cap.deadline = now + 60_000; now = original + 1
      await Promise.resolve(); assert.equal(answered, false); assert.equal(h.state.settled, 0)
      assert.equal(h.calls[0]!.budget.deadline, original); assert.ok(Object.isFrozen(h.calls[0]!.budget))
    } finally { gate.resolve(); await joined }
    assert.equal((await joined).status, 'unconfirmed'); assert.equal(h.state.settled, 1)
    assert.equal(h.calls.length, 1); assert.equal(h.state.unexpected, 0)
  })
  await t.test('monitor abort joins its original MA1 call before returning its negative answer', async () => {
    const entered = deferred<void>(), gate = deferred<void>(), controller = new AbortController()
    const h = fixture({ async method() { entered.resolve(); await gate.promise; return { status: 'unavailable' } } })
    let answered = false
    const joined = h.facade.monitorOnce(controller.signal, { deadline: now + 2000 }).then(result => { answered = true; return result })
    try {
      await entered.promise; controller.abort(); await Promise.resolve()
      assert.equal(answered, false); assert.equal(h.state.settled, 0); assert.equal(h.calls[0]!.signal.aborted, true)
    } finally { gate.resolve(); await joined }
    assert.equal((await joined).status, 'interrupted'); assert.equal(h.state.settled, 1)
    assert.equal(h.calls.length, 1); assert.equal(h.state.unexpected, 0)
  })
  await t.test('query keeps its 750ms cap and original workOnce keeps the existing fixed-effect cap', async () => {
    const original = process.env.GITHUB_ACTIONS
    process.env.GITHUB_ACTIONS = 'false'
    try {
      const h = fixture()
      await h.facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, signal())
      assert.equal(h.calls.length, 1); assert.equal(h.calls[0]!.channel, 'method')
      assert.equal(h.calls[0]!.budget.deadline, now + 750)
      h.calls.length = 0
      const identity = createV3WorkIdentity({ context: h.binding.context,
        method: { methodId: method.methodId, revision: method.revision }, factKind: 'requirement_effect', researchReason: { status: 'missing' } })
      if (!identity.ok) assert.fail(identity.reason)
      await h.facade.workOnce({ operationId: 'op3_' + '3'.repeat(32), jobKey: identity.value.jobKey,
        leaseId: 'lease3_' + '4'.repeat(32), leaseMilliseconds: 30000 }, signal())
      assert.ok(h.calls.length > 0); assert.equal(h.calls[0]!.channel, 'jobs'); assert.equal(h.calls[0]!.budget.deadline, now + 5000)
      assert.equal(h.state.unexpected, 0)
    } finally {
      if (original === undefined) delete process.env.GITHUB_ACTIONS
      else process.env.GITHUB_ACTIONS = original
    }
  })
  await t.test('synthetic GitHub CI query propagates the fixed 2000ms cap to the actual method operation', async () => {
    const original = process.env.GITHUB_ACTIONS
    process.env.GITHUB_ACTIONS = 'true'
    try {
      const h = fixture()
      await h.facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, signal())
      assert.equal(h.calls.length, 1); assert.equal(h.calls[0]!.channel, 'method')
      assert.equal(h.calls[0]!.budget.deadline, now + 2000)
      assert.equal(h.state.unexpected, 0)
    } finally {
      if (original === undefined) delete process.env.GITHUB_ACTIONS
      else process.env.GITHUB_ACTIONS = original
    }
  })
})

test('manual selected worker retains genuine request identifiers without caller-selected scope or new IDs', async t => {
  const requests: Record<string, unknown>[] = []
  let allocations = 0, getters = 0
  const h = fixture({ ids() { allocations++; throw Error('manual continuation must retain its original IDs') },
    async jobs(request) { requests.push(JSON.parse(request.operationText)); return { status: 'unavailable' } } })
  const selection = Object.freeze({ operationId: 'op3_' + 'a'.repeat(32), leaseId: 'lease3_' + 'b'.repeat(32) })
  const accessor = Object.defineProperty({ leaseId: selection.leaseId }, 'operationId', {
    enumerable: true, get() { getters++; return selection.operationId },
  })
  for (const invalid of [null, [], {}, { ...selection, target: 'other' }, { ...selection, leaseId: 'wrong' },
    Object.create(selection), accessor]) {
    assert.equal((await h.facade.workSelectedOnce('rule_research', signal(), undefined,
      invalid as unknown as typeof selection)).status, 'invalid')
  }
  assert.equal((await h.facade.workSelectedOnce('combination_discovery', signal(), undefined, selection)).status, 'invalid')
  assert.equal(getters, 0); assert.equal(requests.length, 0); assert.equal(allocations, 0)
  const identity = createV3WorkIdentity({ context: h.binding.context,
    method: { methodId: method.methodId, revision: method.revision }, factKind: 'requirement_effect', researchReason: { status: 'missing' } })
  assert.ok(identity.ok)
  for (let index = 0; index < 2; index++) await h.facade.workSelectedOnce('rule_research', signal(), undefined, selection)
  assert.equal(requests.length, 2); assert.deepEqual(requests[1], requests[0]); assert.equal(allocations, 0)
  assert.deepEqual(requests[0], { operation: 'execution_read', phase: 'probe', body: { purpose: 'resume', claim: {
    ...selection, jobKey: identity.value.jobKey, leaseMilliseconds: 30000,
  } } })

  await t.test('input mutation and abort cannot replace the in-flight original request or escape drain', async () => {
    const entered = deferred<void>(), gate = deferred<void>(), controller = new AbortController()
    let captured: unknown, settled = false
    const held = fixture({ ids() { assert.fail('no replacement IDs') }, async jobs(request) {
      captured = JSON.parse(request.operationText); entered.resolve(); await gate.promise; return { status: 'unavailable' }
    } })
    const mutable = { ...selection }
    const pending = held.facade.workSelectedOnce('rule_research', controller.signal, undefined, mutable)
      .then(result => { settled = true; return result })
    try {
      await entered.promise; mutable.operationId = 'op3_' + 'c'.repeat(32); mutable.leaseId = 'lease3_' + 'd'.repeat(32)
      controller.abort(); await Promise.resolve(); assert.equal(settled, false)
      assert.deepEqual(captured, requests[0])
    } finally { gate.resolve(); await pending }
    assert.equal(held.state.settled, 1); assert.equal(held.calls.length, 1); assert.equal(held.state.unexpected, 0)
  })
})

test('monitor finish cannot overtake a queue timeout with an actually unsettled MA1 call', { timeout: 15000 }, async t => {
  for (const abortOuter of [false, true]) await t.test(abortOuter ? 'outer abort during drain forbids finish' : 'settlement permits only the original negative finish', async t => {
    // Protocol doubles exercise the real HRS factory, queue and scope. They do
    // not create an accepted source, native SQL proof or durable publication.
    const initial = 100_000, instant = Date.parse('2026-11-12T20:00:00.000Z')
    let now = initial
    t.mock.method(performance, 'now', () => now)
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const clockNow = () => new Date(instant + now - initial).toISOString()
    const entered = deferred<void>(), release = deferred<void>(), queueEnded = deferred<void>()
    const controller = new AbortController()
    let current: unknown = null, claimed: unknown = null, writes = 0, claims = 0, finishes = 0, identifiers = 0
    let postCommitMethodCalls = 0, held = false, answered = false
    let heldSignal: AbortSignal | null = null
    const acknowledged = (result: unknown) => ({ status: 'acknowledged' as const, rows: [{ result: JSON.stringify(result) }] })
    const h = fixture({ clockNow, monitorLeaseMilliseconds: 30000,
      ids() { const value = (++identifiers).toString(16).padStart(32, '0'); return { jobId: 'job3_' + value, operationId: 'op3_' + value } },
      async method(request, signal) {
        if (writes > 0) {
          postCommitMethodCalls++
          if (postCommitMethodCalls === 1) {
            held = true; heldSignal = signal; entered.resolve()
            try { await release.promise; return { status: 'unavailable' } }
            finally { held = false }
          }
          // The selected transport admits no second physical method pair while
          // the first is still settling. Count an attempted overlap as well.
          if (held) return { status: 'unavailable' }
        }
        return { status: 'rows', rows: [{ status: 'approved', method_id: method.methodId, revision: String(method.revision),
          method_digest: method.methodDigest, package_digest: method.packageDigest, epoch: '1', approval_mode: 'until_revoked',
          approval_until: null, observed_at: request.checkedAt, remaining_ms: '5000' }] }
      },
      async jobs(request) {
        const command = JSON.parse(request.operationText)
        if (command.operation === 'queue_confirm') return acknowledged({ status: 'not_attempted' })
        if (command.operation === 'queue_read') return acknowledged(current === null ? { status: 'absent' }
          : command.phase === 'probe' ? { status: 'requires_authority' } : { status: 'present', record: current })
        assert.equal(command.operation, 'queue_cas'); assert.equal(command.body.command.action, 'enqueue')
        assert.equal(writes, 0, 'the existing enqueue is never replayed')
        current = command.body.commit.next; writes++
        now += 1000; t.mock.timers.tick(1000)
        return acknowledged({ status: 'committed', record: current })
      },
      async writer(request) {
        const command = JSON.parse(request.operationText)
        if (command.operation === 'monitor_claim') {
          claims++
          claimed ??= { claimId: command.body.claimId, generation: 1,
            leaseUntil: new Date(instant + 30000).toISOString(), planGeneration: 0, initialResearch: true,
            plan: { method: { methodId: method.methodId, revision: method.revision }, targets: [], attemptLimit: 3 } }
          return acknowledged({ status: 'claimed', value: claimed })
        }
        assert.equal(command.operation, 'monitor_finish'); assert.equal(held, false)
        assert.equal(command.body.generation, 1); assert.equal(command.body.outcomes.length, 1)
        assert.equal(command.body.outcomes[0].status, 'unavailable')
        assert.ok(now < initial + 30000, 'finish still consumes the original live lease and monitor deadline')
        finishes++
        return acknowledged({ status: 'finished', value: { generation: 1, nextCheckAt: new Date(Date.parse(clockNow()) + 100).toISOString() } })
      },
    })
    const pending = withDevImportDiagnostics(() => h.facade.monitorOnce(controller.signal, { deadline: initial + 30000 }), line => {
      const event = JSON.parse(line)
      if (event.stage === 'monitor_enqueue' && event.phase === 'settled') {
        assert.equal(event.returnedStatus, 'unavailable'); queueEnded.resolve()
      }
    }).then(value => { answered = true; return value })
    try {
      await entered.promise
      assert.equal(writes, 1); assert.equal(claims, 2); assert.equal(finishes, 0)
      now += 4000; t.mock.timers.tick(4000)
      await queueEnded.promise
      await new Promise<void>(resolve => setImmediate(resolve))
      assert.equal(answered, false, 'a queue timeout is not settlement of its admitted native promise')
      assert.equal(postCommitMethodCalls, 1, 'finish cannot even request a new method pair before actual settlement')
      assert.equal(finishes, 0)
      if (abortOuter) { controller.abort(); assert.equal((heldSignal as AbortSignal | null)?.aborted, true) }
    } finally { release.resolve(); await pending }
    const result = await pending
    assert.equal(result.status, abortOuter ? 'interrupted' : 'unavailable')
    assert.equal(writes, 1); assert.equal(finishes, abortOuter ? 0 : 1)
    assert.equal(postCommitMethodCalls, abortOuter ? 1 : 2)
    assert.equal(h.state.unexpected, 0)
    if (!abortOuter) assert.equal(result.outcomes[0]?.status, 'unavailable', 'a confirmed negative finish cannot promote the timed-out enqueue')
  })
})
