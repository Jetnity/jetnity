// Protocol doubles exercise actual coordinator control flow, not persistence/native proof.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { performance } from 'node:perf_hooks'
import { createV3PostgresDurableJobs, createV3PostgresMethodAuthority } from '../method/authority-postgres'
import { readM04Command, readM04NativeReply, type M04Config, type M04Facade, type M04FixedOperation, type M04FixedRequest } from './contract'
import { composeM04Invocation, composeM04ResultInvocation } from './composition'
import { createM04LanePool, createM04InvocationScope } from './owned-scope'
import { fixture, ids, METHOD } from '../monitor/test-support'
import type { V3QueueCommit, V3ManagedJobRecord } from '../monitor/queue'
import type { V3GlobalRuleContext } from '../contract'
import { m04IdentityVectors } from '../../../../scripts/db/official-truth-v3-durable-jobs-1/generate-identity-vectors'
import { createHrs1ResultPorts } from '../result/postgres'
import { createHrs1SourceConsumer } from '../result/source-proof'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../source/aa-ch-de-reviewed-program'

const NOW = '2026-11-09T08:04:00.000Z'
function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical((v as Record<string, unknown>)[k])).join(',') + '}'
}
function harness(options: { positiveProbe?: boolean; clock?: () => { now: string; legalDate: string }; pendingHistory?: boolean; uncertainLookup?: boolean } = {}) {
  const f = fixture(), requests: M04FixedRequest[] = [], history = new Map<string, V3QueueCommit>()
  let record: V3ManagedJobRecord | null = null, reads = 0, producers = 0
  const binding = { ...METHOD, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
  const config: M04Config = { binding, registry: f.registry, clock: options.clock ?? (() => ({ now: NOW, legalDate: '2026-11-09' })),
    methodExecutor: { async readCurrent() { reads++; return { status: 'rows', rows: [{ status: 'approved', method_id: METHOD.methodId,
      revision: '1', method_digest: binding.methodDigest, package_digest: binding.packageDigest, epoch: '1', approval_mode: 'until_revoked',
      approval_until: null, observed_at: NOW, remaining_ms: '5000' }] } } },
    intakeExecutor: { async execute() { throw Error('no S1 effect expected for producer-declared failure') } },
    jobsExecutor: { async executeFixed(request) {
      requests.push(request)
      const r = JSON.parse(request.operationText) as { operation: string; phase: string; body: Record<string, unknown> }
      let reply: unknown
      if (r.operation === 'queue_confirm') {
        const c = readM04Command(r.body.command)!; const old = history.get(c.operationId)
        reply = old ? r.phase === 'probe' ? { status: 'requires_authority' } : { status: 'committed', operationId: c.operationId,
          commandKey: c.commandKey, commandText: c.commandText, envelopeText: canonical(old), record: old.next } : { status: 'not_attempted' }
      } else if (r.operation === 'queue_read') {
        reply = record ? r.phase === 'probe' && !options.positiveProbe ? { status: 'requires_authority' } : { status: 'present', record } : { status: 'absent' }
      } else if (r.operation === 'queue_cas') {
        const c = r.body.commit as V3QueueCommit
        record = c.next; history.set(c.operationId, c); reply = { status: 'committed', record }
      } else if (r.operation === 'execution_read') reply = options.uncertainLookup && r.body.purpose === 'lookup' ? { status: 'unconfirmed' } : { status: 'absent' }
      else if (r.operation === 'execution_start') reply = { status: 'reserved', attemptKey: 'execution-attempt:v3:' + 'c'.repeat(64),
        token: 'd'.repeat(64), claim: r.body.claim, leasedJob: r.body.leasedJob }
      else throw Error('unexpected operation')
      return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
    } },
    producer: { async produce() { producers++; return { status: 'failed', reason: 'unreachable' } } },
    evidence: { async inspect() { return { status: 'unavailable' } }, async reprove() { return { status: 'unavailable' } } },
    history: { async read() { return { status: 'unavailable' } }, async reprove() { return { status: 'unavailable' } } },
  }
  const input = { context: f.context, method: METHOD, factKind: 'requirement_effect', researchReason: { status: 'missing' },
    operationId: ids('op3', 'm04-joint-enqueue'), jobId: ids('job3', 'm04-joint-enqueue'), attemptLimit: 3 }
  return { config, api: createV3PostgresDurableJobs(config), input, requests, identity: f.identity,
    counts: () => ({ reads, producers }), record: () => record }
}

test('positive joint enqueue reaches actual strict MA1 with exactly two method fields and post-CAS authority read', async () => {
  const h = harness(), result = await h.api.enqueueRule(h.input)
  assert.equal(result.status, 'confirmed'); assert.equal(h.counts().reads, 3, 'resolve, pre-CAS reproof and fresh post-read reproof')
  assert.ok(h.requests.some(r => JSON.parse(r.operationText).operation === 'queue_read' && r.epoch === 1))
  assert.ok(h.requests.every(r => typeof r.notAfter === 'string' && r.budget.deadline > 0))
  assert.deepEqual(Object.keys(h.api).sort(), ['enqueueDiscovery', 'enqueueRule', 'workOnce'])
})

test('original START winner known failure completes generic post-CAS read with retired continuation', async () => {
  const h = harness(); assert.equal((await h.api.enqueueRule(h.input)).status, 'confirmed')
  const claim = { operationId: ids('op3', 'm04-joint-claim'), jobKey: h.identity.jobKey, leaseId: ids('lease3', 'm04-joint-claim'), leaseMilliseconds: 4000 }
  const result = await h.api.workOnce(claim)
  assert.equal(result.status, 'worker_only')
  if (result.status === 'worker_only') assert.equal(result.worker.status, 'backoff')
  assert.equal(h.counts().producers, 1)
  const requests = h.requests.map(r => JSON.parse(r.operationText))
  const terminal = requests.findIndex(r => r.operation === 'queue_cas' && r.body.disposition.kind === 'settled_failure')
  assert.ok(terminal >= 0)
  assert.ok(requests.slice(terminal + 1).some(r => r.operation === 'queue_read' && r.body.continuation === null))
})

test('a syntactically valid positive probe reply never escapes the phase boundary', async () => {
  const h = harness({ positiveProbe: true })
  assert.equal((await h.api.enqueueRule(h.input)).status, 'confirmed', 'fresh final read is authorized directly')
  const beforeReplay = h.requests.length
  assert.notEqual((await h.api.enqueueRule(h.input)).status, 'confirmed')
  const replay = h.requests.slice(beforeReplay)
  assert.ok(replay.some(r => JSON.parse(r.operationText).operation === 'queue_read' && r.epoch === null))
  const authoritativeReads = replay.filter(r => JSON.parse(r.operationText).operation === 'queue_read' && r.epoch !== null)
  assert.equal(authoritativeReads.length, 0)
})

test('malformed clock refuses before any native probe or method read', async () => {
  const h = harness({ clock: () => ({ now: 'not-a-time', legalDate: '2026-11-09' }) })
  assert.notEqual((await h.api.enqueueRule(h.input)).status, 'confirmed')
  assert.equal(h.requests.length, 0); assert.equal(h.counts().reads, 0)
})


test('uncertain execution lookup after claim cannot manufacture a generic queue failure before START', async () => {
  const h = harness({ uncertainLookup: true })
  assert.equal((await h.api.enqueueRule(h.input)).status, 'confirmed')
  const claim = { operationId: ids('op3', 'm04-uncertain-claim'), jobKey: h.identity.jobKey,
    leaseId: ids('lease3', 'm04-uncertain-claim'), leaseMilliseconds: 4000 }
  assert.notEqual((await h.api.workOnce(claim)).status, 'processed')
  const effects = h.requests.map(r => JSON.parse(r.operationText)).filter(r => r.operation === 'queue_cas')
  assert.equal(effects.filter(r => r.body.command.action === 'fail').length, 0)
  assert.equal(h.counts().producers, 0)
  assert.equal(h.record()?.state, 'leased')
})

// This double is an explicit protocol/control-flow test. Only native.test proves SQL.
type ImportFault = 'read_unavailable' | 'reserve_busy' | 'reserve_unavailable' | 'reserve_collision' | 'finish_unknown' | 'completion_read_unknown' | 'quarantined'
type RaceHooks = {
  reserve(signal: AbortSignal): Promise<void>
  method(signal: AbortSignal): Promise<boolean>
  request(request: M04FixedRequest): void
  ready(api: M04Facade, input: unknown, abort: AbortController): void
  work?(config: M04Config, claim: unknown, signal: AbortSignal): ReturnType<M04Facade['workOnce']>
}
type WorkerHooks = {
  epoch?: () => number;
  produce?: () => void;
  prepared?: () => void;
  confirmed?: () => void;
  method?: (signal: AbortSignal, budget: Readonly<{ deadline: number }> | undefined) => Promise<void> | void;
  lookup?: (signal: AbortSignal, budget: Readonly<{ deadline: number }>) => Promise<void> | void;
  start?: (request: M04FixedRequest, signal: AbortSignal) => Promise<void> | void;
  intake?: (statement: string, parameters: readonly (string | number)[], signal: AbortSignal,
    budget: Readonly<{ deadline: number }> | undefined) => Promise<void> | void;
  ready?: (abort: AbortController) => void;
  lostStart?: boolean;
  lostConfirm?: boolean;
}
async function fullBatchHarness(count: number, corruptLast = false, context?: V3GlobalRuleContext, importFault?: ImportFault, race?: RaceHooks, worker?: WorkerHooks) {
  const { m04Fixture, M04_TEST_BINDING } = await import('../../../../scripts/db/official-truth-v3-durable-jobs-1/fixtures')
  const { readV3RetainableProposal } = await import('../storage/proposal-bytes')
  const unresolved: V3GlobalRuleContext | undefined = importFault === 'quarantined'
    ? { ...m04Fixture('unresolved').context, conditions: { status: 'unresolved', missing: ['travel_purpose'] } } : context
  const f = m04Fixture('m04-full-' + count + '-' + corruptLast, { count, fixedNow: NOW, context: unresolved })
  const bindings = new Map<string, { reference: unknown; text: string; outcome: unknown; audit: unknown }>()
  const operations = new Map<string, V3QueueCommit>()
  let job: V3ManagedJobRecord | null = null, execution: { claim: unknown; leasedJob: V3ManagedJobRecord;
    attemptKey: string; result?: unknown; references?: unknown; completed?: boolean } | null = null
  const counts = { method: 0, jobs: 0, intake: 0, capture: 0, read: 0, reserve: 0, finish: 0, artifactRead: 0 }
  const trace: string[] = [], nativeRequests: M04FixedRequest[] = []
  const terminal = new AbortController()
  const config: M04Config = { binding: M04_TEST_BINDING, registry: f.originals.registry, clock: f.clock,
    methodExecutor: { async readCurrent(_request, signal, budget) { counts.method++; trace.push('method')
      await worker?.method?.(signal, budget)
      if (race && !await race.method(signal)) return { status: 'unavailable' }
      return { status: 'rows', rows: [{ status: 'approved',
      method_id: M04_TEST_BINDING.methodId, revision: '1', method_digest: M04_TEST_BINDING.methodDigest,
      package_digest: M04_TEST_BINDING.packageDigest, epoch: String(worker?.epoch?.() ?? 1), approval_mode: 'until_revoked', approval_until: null, observed_at: NOW, remaining_ms: '5000' }] } } },
    intakeExecutor: { async execute(statement, params, signal, budget) {
      counts.intake++; assert.equal(signal.aborted, false)
      await worker?.intake?.(statement, params, signal, budget)
      const binding = JSON.parse(String(params[0])), old = bindings.get(binding.operationId)
      let reply: unknown
      if (statement.includes('.capture_v1(')) {
        trace.push('intake:capture')
        counts.capture++; const text = String(params[1]), parsed = readV3RetainableProposal(text, f.originals.registry); assert.ok(parsed.ok)
        if (!parsed.ok) throw Error('unreachable')
        const record = { reference: { binding, proposalDigest: parsed.value.digest, bytes: parsed.value.bytes }, text, outcome: null, audit: null }
        bindings.set(binding.operationId, record); reply = { status: 'recorded', record }
      } else if (statement.includes('.read_v1(')) {
        trace.push('intake:read')
        counts.read++
        if (importFault === 'read_unavailable' || importFault === 'completion_read_unknown' && counts.finish > 0) return { status: 'unavailable' }
        reply = old ? { status: 'recorded', record: old } : { status: 'not_attempted' }
      }
      else if (statement.includes('.reserve_v1(')) {
        counts.reserve++; assert.ok(old)
        if (race) { await race.reserve(signal); return { status: 'unconfirmed' } }
        reply = importFault === 'reserve_busy' ? { status: 'busy' }
          : importFault === 'reserve_collision' ? { status: 'collision' }
          : importFault === 'reserve_unavailable' ? { status: 'unavailable' }
          : old.outcome ? { status: 'completed', record: old } : { status: 'acquired', generation: 1,
          leaseToken: '11111111-1111-4111-8111-111111111111', acquiredAt: NOW,
          expiresAt: new Date(Date.parse(NOW) + Number(params[3])).toISOString(), record: old }
      } else {
        counts.finish++; assert.ok(statement.includes('.finish_v1(') && old)
        old.outcome = JSON.parse(String(params[5])); old.audit = JSON.parse(String(params[6])); reply = { status: 'recorded' }
        if (importFault === 'finish_unknown') return { status: 'unconfirmed' }
      }
      return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
    } },
    jobsExecutor: { async executeFixed(request, signal) {
      counts.jobs++; assert.equal(signal.aborted, false)
      race?.request(request)
      const q = JSON.parse(request.operationText), b = q.body
      nativeRequests.push(request); trace.push(`${q.operation}:${q.phase}${b.purpose ? ':' + b.purpose : ''}`)
      let reply: unknown
      if (q.operation === 'queue_confirm') {
        const c = readM04Command(b.command)!; const old = operations.get(c.operationId)
        reply = !old ? { status: 'not_attempted' } : q.phase === 'probe' ? { status: 'requires_authority' }
          : { status: 'committed', operationId: c.operationId, commandKey: c.commandKey, commandText: c.commandText, envelopeText: canonical(old), record: old.next }
      } else if (q.operation === 'queue_read') reply = !job ? { status: 'absent' } : q.phase === 'probe' ? { status: 'requires_authority' } : { status: 'present', record: job }
      else if (q.operation === 'queue_cas') {
        const commit = b.commit as V3QueueCommit; job = commit.next; operations.set(commit.operationId, commit)
        if (b.disposition.kind === 'completed') { assert.ok(execution); execution.completed = true }
        reply = { status: 'committed', record: job }
      } else if (q.operation === 'execution_start') {
        await worker?.start?.(request, signal)
        assert.equal(execution, null)
        execution = { claim: b.claim, leasedJob: b.leasedJob, attemptKey: 'execution-attempt:v3:' + 'e'.repeat(64) }
        reply = { status: 'reserved', ...execution, token: 'f'.repeat(64) }
        if (worker?.lostStart) return { status: 'unconfirmed' }
      } else if (q.operation === 'execution_prepare') {
        assert.ok(execution); execution.result = b.result; execution.references = b.references
        reply = { status: 'prepared', attemptKey: execution.attemptKey, result: b.result, references: b.references }
        worker?.prepared?.()
      } else {
        assert.equal(q.operation, 'execution_read')
        if (b.purpose === 'lookup') await worker?.lookup?.(signal, request.budget)
        if (b.purpose === 'artifact') counts.artifactRead++
        reply = !execution?.result ? { status: 'absent' } : q.phase === 'probe' ? { status: 'requires_authority' }
          : execution.completed ? { status: 'completed', claim: execution.claim, leasedJob: execution.leasedJob, attemptKey: execution.attemptKey,
            job, result: execution.result, references: execution.references }
            : { status: 'prepared', claim: execution.claim, leasedJob: execution.leasedJob, attemptKey: execution.attemptKey,
              result: execution.result, references: execution.references }
        if (b.purpose === 'confirm' && q.phase === 'authorized') {
          worker?.confirmed?.()
          if (worker?.lostConfirm) return { status: 'unconfirmed' }
        }
      }
      return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
    } },
    producer: { async produce(value, signal) {
      worker?.produce?.()
      const result = await f.producer.produce(value, signal)
      if (!corruptLast || result.status !== 'delivered') return result
      return { status: 'delivered', deliveries: result.deliveries.map((d, i) => i === result.deliveries.length - 1 ? { ...d, text: '{"broken":true}' } : d) }
    } }, evidence: f.evidence, history: f.history }
  const api = createV3PostgresDurableJobs(config)
  assert.equal((await (importFault || race ? api.enqueueRule(f.ruleInput) : api.enqueueDiscovery(f.discoveryInput))).status, 'confirmed')
  for (const k of Object.keys(counts) as (keyof typeof counts)[]) counts[k] = 0
  race?.ready(api, f.ruleInput, terminal)
  worker?.ready?.(terminal)
  const claim = f.claim(importFault || race ? 'rule_research' : 'combination_discovery')
  const result = await (race?.work ? race.work(config, claim, terminal.signal) : api.workOnce(claim, terminal.signal))
  return { result, counts, f, bindings, operations, trace, nativeRequests, api, claim }
}

test('M04-B2-01: actual S1/I1/E1 complete all sixteen originals within the 256-call invocation cap', async () => {
  const h = await fullBatchHarness(16)
  assert.equal(h.result.status, 'processed', JSON.stringify({ result: h.result, counts: h.counts,
    actions: [...h.operations.values()].map(value => value.audit.kind) }))
  if (h.result.status !== 'processed') return
  assert.equal(h.result.worker.acceptedRule, false)
  assert.equal(h.result.results.length, 16)
  assert.equal(h.counts.capture, 16); assert.equal(h.counts.finish, 16); assert.equal(h.counts.reserve, 16)
  assert.equal(h.counts.read, 48, '16 capture confirmations + 16 artifact opens + 16 I1 reads; no repeated full-batch opens')
  assert.equal(h.bindings.size, 16); assert.equal(h.f.producerCalls(), 1)
  assert.ok(h.counts.method + h.counts.jobs + h.counts.intake <= 256, JSON.stringify(h.counts))
  for (const delivered of h.f.delivered) assert.equal(h.bindings.get(delivered.binding.operationId)?.text, delivered.text)
})

test('worker preflight uses six actual dispatches through first S1 read and exactly one atomic START', async () => {
  const h = await fullBatchHarness(1)
  assert.equal(h.result.status, 'processed', JSON.stringify(h.result))
  const lookup = h.trace.indexOf('execution_read:probe:lookup')
  const opened = h.trace.indexOf('intake:read', lookup)
  assert.deepEqual(h.trace.slice(lookup, opened + 1), ['execution_read:probe:lookup', 'method', 'method',
    'execution_start:authorized', 'intake:capture', 'intake:read'])
  const starts = h.nativeRequests.filter(request => JSON.parse(request.operationText).operation === 'execution_start')
  assert.equal(starts.length, 1)
  const claimed = h.nativeRequests.find(request => {
    const q = JSON.parse(request.operationText)
    return q.operation === 'queue_cas' && q.body.command.action === 'claim'
  })!
  assert.equal(starts[0].epoch, claimed.epoch)
  assert.ok(starts[0].budget.deadline > 0)
})

for (const expired of [false, true]) test(`actual M04 lookup precedes the first worker receipt and START ${expired ? 'refuses its exact' : 'retains its original'} five-second cap`, async t => {
  let now = 0, lookupFinished = false
  const workerDeadlines: number[] = []
  t.mock.method(performance, 'now', () => now)
  const h = await fullBatchHarness(1, false, undefined, undefined, undefined, {
    lookup(_signal, budget) {
      assert.equal(budget.deadline, 5000, 'the actual read keeps its own unchanged effect cap')
      now = 1700; lookupFinished = true
    },
    method(_signal, budget) { if (lookupFinished && workerDeadlines.length < 2) workerDeadlines.push(budget!.deadline) },
    start(request) {
      assert.equal(request.budget.deadline, 6700, 'the first real worker receipt begins after the actual read')
      now += expired ? 5000 : 3500
    },
  })
  assert.deepEqual(workerDeadlines, [6700, 6700], 'fresh acquisition and actual reproof retain exactly one original deadline')
  assert.equal(h.trace.filter(value => value === 'execution_read:probe:lookup').length, 1)
  assert.equal(h.trace.filter(value => value === 'execution_start:authorized').length, 1)
  if (expired) {
    assert.notEqual(h.result.status, 'processed'); assert.equal(h.f.producerCalls(), 0); assert.equal(h.counts.intake, 0)
  } else {
    assert.equal(h.result.status, 'processed', JSON.stringify(h.result)); assert.equal(h.f.producerCalls(), 1)
  }
})

test('actual M04 abort during the initial lookup drains the physical read without a later worker receipt or START', async () => {
  let entered!: () => void, release!: () => void, caller: AbortController | undefined, readSignal: AbortSignal | undefined
  const reading = new Promise<void>(resolve => { entered = resolve })
  const held = new Promise<void>(resolve => { release = resolve })
  let lookupEntered = false, settled = false, returned = false, laterMethods = 0
  const work = fullBatchHarness(1, false, undefined, undefined, undefined, {
    ready(value) { caller = value },
    async lookup(signal) { lookupEntered = true; readSignal = signal; entered(); await held; settled = true },
    method() { if (lookupEntered) laterMethods++ },
  }).then(value => { returned = true; return value })
  try {
    await reading; assert.ok(caller && readSignal); caller.abort()
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(readSignal.aborted, true); assert.equal(settled, false); assert.equal(returned, false)
    assert.equal(laterMethods, 0)
    release(); const h = await work
    assert.equal(settled, true); assert.equal(laterMethods, 0)
    assert.notEqual(h.result.status, 'processed'); assert.equal(h.f.producerCalls(), 0); assert.equal(h.counts.intake, 0)
    assert.equal(h.trace.filter(value => value === 'execution_start:authorized').length, 0)
  } finally { caller?.abort(); release(); await work }
})

for (const atDeadline of [false, true]) test(`nested I1 ${atDeadline ? 'refuses expired' : 'retains original'} finish cap at the actual S1 executor`, async t => {
  let now = 1000
  const deadlines: Array<{ call: string; deadline: number; at: number }> = []
  t.mock.method(performance, 'now', () => now)
  const h = await fullBatchHarness(1, false, undefined, 'quarantined', undefined, {
    intake(statement, parameters, _signal, budget) {
      if (statement.includes('.reserve_v1(')) {
        assert.ok(budget); deadlines.push({ call: 'reserve', deadline: budget.deadline, at: now })
        assert.equal(parameters[3], 5000, 'the actual S1 lease is not extended')
        now = atDeadline ? 6000 : 5600
      } else if (statement.includes('.finish_v1(')) {
        assert.ok(budget); deadlines.push({ call: 'finish', deadline: budget.deadline, at: now })
      }
    },
  })
  assert.deepEqual(deadlines, atDeadline ? [{ call: 'reserve', deadline: 6000, at: 1000 }]
    : [{ call: 'reserve', deadline: 6000, at: 1000 }, { call: 'finish', deadline: 6000, at: 5600 }])
  assert.equal(h.counts.reserve, 1); assert.equal(h.counts.finish, atDeadline ? 0 : 1)
  if (atDeadline) {
    assert.notEqual(h.result.status, 'processed')
    assert.equal([...h.operations.values()].filter(value => ['failed', 'completed'].includes(value.audit.kind)).length, 0)
    assert.equal([...h.operations.values()].at(-1)?.next.state, 'leased')
  } else assert.equal([...h.bindings.values()][0].outcome !== null, true, 'known negative audit still completes')
})

for (const selected of [false, true]) test(`only a present frame overlaps initial reads; ${selected ? 'two' : 'one'} pending native calls remain owned after abort`, async () => {
  function gate() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve }); return { promise, release } }
  const reserveEntered = gate(), historyEntered = gate(), releaseReserve = gate(), releaseHistory = gate(), pool = createM04LanePool()
  let scope: NonNullable<ReturnType<typeof createM04InvocationScope>> | undefined, caller: AbortController | undefined
  let historyStarts = 0, historySettled = 0, reserveSettled = 0, finished = false, evidenceCalls = 0
  const joins: Promise<unknown>[] = []
  const work = fullBatchHarness(1, false, undefined, undefined, {
    ready(_api, _input, signal) { caller = signal },
    async reserve() { reserveEntered.release(); try { await releaseReserve.promise } finally { reserveSettled++ } },
    async method() { return true }, request() {},
    async work(config, claim, signal) {
      const owned = createM04InvocationScope(pool, 30000, signal); assert.ok(owned); scope = owned
      const authorityFor = (group: 'outer' | 'processing') => createV3PostgresMethodAuthority(config.binding, {
        async readCurrent(request, child, budget) {
          const value = await owned.native('method', group, s => config.methodExecutor.readCurrent(request, s, budget), child)
          return value.ok ? value.value : { status: 'unavailable' }
        },
      })
      // The existing protocol doubles bridge real standalone MA1/composition;
      // these unit probes do not claim native SQL or selected-source custody.
      const fixedFor = (group: 'outer' | 'processing'): M04FixedOperation => async (operation, child) => {
        const reply = await owned.native('jobs', group, s => config.jobsExecutor.executeFixed({
          ...config.binding, operationText: canonical({ ...operation, phase: 'authorized' }), epoch: 1,
          budget: { deadline: owned.deadline }, notAfter: new Date(Date.parse(config.clock().now) + 5000).toISOString(),
        } as M04FixedRequest, s), child)
        return reply.ok && reply.value.status === 'acknowledged'
          ? readM04NativeReply(reply.value.rows, operation.operation) ?? { status: 'unconfirmed' } : { status: 'unconfirmed' }
      }
      const closedFixed = async () => ({ status: 'unavailable' as const })
      const closed = createHrs1ResultPorts({ binding: program.binding, registry: program.registry, fixed: closedFixed,
        clock: config.clock, ids: () => ({ jobId: 'job3_' + '1'.repeat(32), operationId: 'op3_' + '2'.repeat(32) }),
        source: createHrs1SourceConsumer({ binding: program.binding, registry: program.registry, fixed: closedFixed, clock: config.clock }) })
      const history = { ...config.history, async read(contextKey: string, factKind: Parameters<typeof config.history.read>[1], child: AbortSignal) {
        const value = await owned.native('jobs', 'processing', async s => {
          historyStarts++; historyEntered.release()
          try { await releaseHistory.promise; return await config.history.read(contextKey, factKind, s) }
          finally { historySettled++ }
        }, child)
        return value.ok ? value.value : { status: 'unavailable' as const }
      } }
      const evidence = { ...config.evidence, async inspect() { evidenceCalls++; return { status: 'unavailable' as const } } }
      const processingAuthority = authorityFor('processing'), parts = { ...closed, history, evidence }
      const raw = composeM04ResultInvocation({ config, scope: owned, authority: authorityFor('outer'), processingAuthority,
        fixed: fixedFor('outer'), processingFixed: fixedFor('processing'), result: {
          outer: parts, processing: parts, callDeadline: owned.deadline, projectionMaxAgeMilliseconds: 1,
          openProcessingImport: () => selected ? { methodAuthority: processingAuthority, history, evidence,
            admitImportSignal: () => true, confirmSource: () => false, close() {} } : null,
        } })
      return raw.facade.workOnce(claim, owned.signal)
    },
  })
  try {
    await reserveEntered.promise
    if (selected) await historyEntered.promise
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.ok(scope && caller)
    assert.equal(historyStarts, selected ? 1 : 0, 'null frame leaves the ordinary reservation dependency intact')
    assert.equal(scope.snapshot().activeNative, selected ? 2 : 1)
    assert.equal(evidenceCalls, 0)
    caller.abort(); const result = await work
    assert.notEqual(result.result.status, 'processed'); assert.equal(result.counts.finish, 0)
    assert.equal(reserveSettled, 0); assert.equal(historySettled, 0)
    joins.push(scope.finish().then(() => { finished = true }))
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(finished, false); assert.equal(pool.snapshot().occupied, 1)
    releaseReserve.release()
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(reserveSettled, 1)
    if (selected) { assert.equal(finished, false); assert.equal(scope.snapshot().activeNative, 1) }
    releaseHistory.release(); await Promise.all(joins)
    assert.equal(historySettled, selected ? 1 : 0); assert.equal(scope.snapshot().activeNative, 0)
    assert.equal(pool.snapshot().occupied, 0); assert.equal(pool.snapshot().intake, 0); assert.equal(pool.snapshot().jobs, 0)
    assert.equal(evidenceCalls, 0); assert.equal(result.counts.finish, 0)
    assert.equal([...result.operations.values()].at(-1)?.next.state, 'leased')
  } finally { releaseReserve.release(); releaseHistory.release(); caller?.abort(); await Promise.allSettled([work, ...joins]); await scope?.finish() }
})

test('genuine prepared and confirm ACK acquire separate terminal authority after the original five seconds', async t => {
  let now = 0, confirmed = false
  const terminalDeadlines: number[] = []
  t.mock.method(performance, 'now', () => now)
  const h = await fullBatchHarness(1, false, undefined, undefined, undefined, {
    produce() { now = 6000 },
    confirmed() { confirmed = true },
    method(_signal, budget) { if (confirmed) terminalDeadlines.push(budget!.deadline) },
  })
  assert.equal(h.result.status, 'processed', JSON.stringify(h.result))
  const start = h.nativeRequests.find(request => JSON.parse(request.operationText).operation === 'execution_start')!
  assert.equal(start.budget.deadline, 5000, 'the original preflight authority was not extended')
  assert.ok(terminalDeadlines.length > 0)
  assert.equal(terminalDeadlines[0], 11000, 'new acquisition has its own unchanged five-second cap')
  assert.equal([...h.operations.values()].filter(value => value.audit.kind === 'completed').length, 1)
})

test('ABA after genuine confirm ACK cannot acquire terminal authority or complete the job', async t => {
  let now = 0, epoch = 1
  t.mock.method(performance, 'now', () => now)
  const h = await fullBatchHarness(1, false, undefined, undefined, undefined, {
    produce() { now = 6000 }, epoch: () => epoch, confirmed() { epoch = 3 },
  })
  assert.notEqual(h.result.status, 'processed')
  assert.equal([...h.operations.values()].filter(value => value.audit.kind === 'completed').length, 0)
  assert.equal(h.trace.filter(value => value === 'execution_start:authorized').length, 1)
})

test('a new worker approval epoch cannot cross the actual earlier claim ACK into START', async () => {
  let epoch = 1, active = false, observations = 0
  const h = await fullBatchHarness(1, false, undefined, undefined, undefined, {
    ready() { active = true }, epoch: () => epoch,
    method() { if (active && ++observations === 5) epoch = 2 },
  })
  assert.equal(epoch, 2, 'the initial worker resolve sees the changed epoch after the completed claim path')
  assert.notEqual(h.result.status, 'processed')
  assert.equal(h.trace.filter(value => value === 'execution_start:authorized').length, 0)
  assert.equal(h.f.producerCalls(), 0); assert.equal(h.counts.intake, 0)
})

test('a positive confirmation double with a changed authorization epoch cannot replace the real START anchor', async () => {
  let epoch = 1
  const h = await fullBatchHarness(1, false, undefined, undefined, undefined, {
    epoch: () => epoch, prepared() { epoch = 3 },
  })
  assert.notEqual(h.result.status, 'processed')
  assert.ok(h.trace.includes('execution_read:authorized:confirm'))
  assert.equal([...h.operations.values()].filter(value => value.audit.kind === 'completed').length, 0)
})

test('the separate terminal receipt still refuses an ACK at its original five-second deadline', async t => {
  let now = 0, confirmed = false, consumed = false
  t.mock.method(performance, 'now', () => now)
  const h = await fullBatchHarness(1, false, undefined, undefined, undefined, {
    produce() { now = 6000 }, confirmed() { confirmed = true },
    method(_signal, budget) {
      if (confirmed && !consumed) { consumed = true; assert.equal(budget?.deadline, 11000); now = 11000 }
    },
  })
  assert.equal(consumed, true)
  assert.notEqual(h.result.status, 'processed')
  assert.equal([...h.operations.values()].filter(value => value.audit.kind === 'completed').length, 0)
})

for (const fault of ['lostStart', 'lostConfirm'] as const) test(`${fault} does not mint preflight or terminal custody`, async () => {
  const h = await fullBatchHarness(1, false, undefined, undefined, undefined, { [fault]: true })
  assert.notEqual(h.result.status, 'processed')
  assert.equal([...h.operations.values()].filter(value => value.audit.kind === 'completed').length, 0)
  if (fault === 'lostStart') { assert.equal(h.f.producerCalls(), 0); assert.equal(h.counts.intake, 0) }
})

test('the same original claim resumes real PREPARED custody without another START or producer', async () => {
  const hooks: WorkerHooks = { lostConfirm: true }
  const h = await fullBatchHarness(1, false, undefined, undefined, undefined, hooks)
  assert.notEqual(h.result.status, 'processed')
  const starts = h.trace.filter(value => value === 'execution_start:authorized').length
  const produced = h.f.producerCalls(), captures = h.counts.capture
  hooks.lostConfirm = false
  const resumed = await h.api.workOnce(h.claim)
  assert.equal(resumed.status, 'processed', JSON.stringify(resumed))
  assert.equal(h.trace.filter(value => value === 'execution_start:authorized').length, starts)
  assert.equal(h.f.producerCalls(), produced); assert.equal(h.counts.capture, captures)
  assert.equal([...h.operations.values()].filter(value => value.audit.kind === 'completed').length, 1)
})

test('caller abort during terminal acquisition retains actual native ownership until its read settles', async () => {
  let confirmed = false, abort: AbortController | undefined, nativeSignal: AbortSignal | undefined
  let release!: () => void, entered!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  const atTerminal = new Promise<void>(resolve => { entered = resolve })
  let joined = false
  const result = fullBatchHarness(1, false, undefined, undefined, undefined, {
    ready(value) { abort = value }, confirmed() { confirmed = true },
    async method(signal) { if (confirmed) { nativeSignal = signal; entered(); await pending; joined = true } },
  })
  let settled = false
  void result.then(() => { settled = true })
  try {
    await Promise.race([atTerminal, result.then(() => assert.fail('the harness ended before terminal acquisition'))])
    abort!.abort()
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(nativeSignal?.aborted, true)
    assert.equal(joined, false); assert.equal(settled, false, 'outward factory still owns the real MA1 read')
  } finally { release(); await result }
  const h = await result
  assert.equal(joined, true); assert.notEqual(h.result.status, 'processed')
  assert.equal([...h.operations.values()].filter(value => value.audit.kind === 'completed').length, 0)
})

test('whole sixteen-item batch is validated before the first S1 effect', async () => {
  const h = await fullBatchHarness(16, true)
  assert.equal(h.counts.intake, 0); assert.equal(h.bindings.size, 0)
  assert.equal(h.f.producerCalls(), 1)
  assert.equal(h.result.status, 'worker_only')
  if (h.result.status === 'worker_only') assert.equal(h.result.worker.status, 'backoff')
})

test('U04: every full S0 predicate family traverses actual whole-original admission and unchanged later I1/E1', async () => {
  for (const vector of m04IdentityVectors().slice(0, 17)) {
    const h = await fullBatchHarness(1, false, vector.input.context)
    assert.equal(h.result.status, 'processed', vector.name + ': ' + JSON.stringify(h.result))
    assert.equal(h.counts.capture, 1); assert.equal(h.counts.reserve, 1); assert.equal(h.counts.finish, 1)
    assert.equal(h.f.producerCalls(), 1); assert.equal(h.bindings.size, 1)
    assert.equal(h.bindings.get(h.f.delivered[0].binding.operationId)?.text, h.f.delivered[0].text)
  }
})

test('U07: actual I1 busy/unavailable/collision/unknown never manufacture failure, confirmed quarantine may settle', async () => {
  for (const fault of ['read_unavailable', 'reserve_busy', 'reserve_unavailable', 'reserve_collision', 'finish_unknown', 'completion_read_unknown', 'quarantined'] as const) {
    const h = await fullBatchHarness(1, false, undefined, fault)
    assert.notEqual(h.result.status, 'processed', fault)
    assert.equal(h.f.producerCalls(), 1)
    const operations = [...h.operations.values()]
    const failures = operations.filter(o => o.audit.kind === 'backoff' || o.audit.kind === 'exhausted')
    if (fault === 'quarantined') {
      assert.equal(failures.length, 1); assert.equal(failures[0].next.state, 'backoff')
      assert.equal(h.counts.finish, 1)
    } else {
      assert.equal(failures.length, 0, fault + ' must preserve unknown without generic Fail CAS/audit')
      assert.equal(operations.at(-1)?.next.state, 'leased')
    }
  }
})

for (const boundary of ['i1_timeout', 'worker_caller_abort'] as const) {
  test('U06/R9: actual composed nested S1 reserve remains owned past ' + boundary, { timeout: 10000 }, async () => {
    function gate() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve }); return { promise, release } }
    const entered = gate(), released = gate(), aborted = gate(), failObserved = gate(), methodsReleased = gate()
    let api!: M04Facade, input: unknown, caller!: AbortController, nestedSignal: AbortSignal | undefined
    let reservePending = false, holdMethods = false, heldMethods = 0, completedMethods = 0, workTerminal = false
    const requests: M04FixedRequest[] = [], otherCalls: Promise<unknown>[] = []
    const work = fullBatchHarness(1, false, undefined, undefined, {
      ready(value, enqueue, signal) { api = value; input = enqueue; caller = signal },
      async reserve(signal) {
        nestedSignal = signal; reservePending = true; entered.release()
        const onAbort = () => aborted.release()
        signal.addEventListener('abort', onAbort, { once: true })
        try { if (signal.aborted) onAbort(); await released.promise }
        finally { signal.removeEventListener('abort', onAbort); reservePending = false }
      },
      async method(signal) {
        if (!holdMethods) return true
        assert.equal(signal.aborted, false); heldMethods++
        try { await methodsReleased.promise; return false } finally { completedMethods++ }
      },
      request(request) {
        requests.push(request)
        const r = JSON.parse(request.operationText)
        if (r.operation === 'queue_confirm' && r.body.command.action === 'fail') failObserved.release()
      },
    }).then(value => { workTerminal = true; return value }, error => { workTerminal = true; throw error })
    const until = async (condition: () => boolean) => {
      for (let n = 0; n < 100 && !condition(); n++) await new Promise(resolve => setTimeout(resolve, 1))
      assert.equal(condition(), true, 'bounded test handshake did not complete')
    }
    try {
      await entered.promise
      assert.equal(reservePending, true); assert.equal(nestedSignal?.aborted, false)
      if (boundary === 'worker_caller_abort') caller.abort()
      await aborted.promise
      if (boundary === 'i1_timeout') await failObserved.promise // actual worker reached fail after actual I1 facade returned
      // Drain the finite coordinator microtasks before enabling the unrelated
      // held-method calls; otherwise they could also intercept the original
      // worker's final refusal read. No native promise is released here.
      await new Promise<void>(resolve => setImmediate(resolve))
      // Explicit caller abort is not a claim that the 30s worker timer elapsed.
      assert.equal(reservePending, true); assert.equal(workTerminal, false)
      holdMethods = true
      for (let n = 0; n < 3; n++) otherCalls.push(api.enqueueRule(input))
      await until(() => heldMethods === 3)
      assert.equal(completedMethods, 0)
      assert.equal((await api.workOnce(null)).status, 'unavailable', 'four outer lanes include the still-owned nested reserve')
      assert.equal(workTerminal, false); assert.equal(reservePending, true)
      const terminalEffects = () => requests.map(r => JSON.parse(r.operationText)).filter(r => r.operation === 'queue_cas'
        && (r.body.command.action === 'fail' || r.body.command.action === 'complete'))
      assert.equal(terminalEffects().length, 0)
      released.release()
      const result = await work
      assert.equal(reservePending, false); assert.notEqual(result.result.status, 'processed')
      assert.equal(completedMethods, 0, 'other three actual method promises are still held')
      assert.equal((await api.workOnce(null)).status, 'invalid', 'only actual nested drain releases the fourth lane')
      assert.equal(terminalEffects().length, 0)
      assert.equal(result.counts.capture, 1); assert.equal(result.counts.reserve, 1); assert.equal(result.counts.finish, 0)
      assert.equal([...result.operations.values()].at(-1)?.next.state, 'leased')
      const intakeCalls = result.counts.intake, requestCount = requests.length
      await Promise.resolve(); await Promise.resolve()
      assert.equal(result.counts.intake, intakeCalls); assert.equal(requests.length, requestCount, 'no late native admission after drain')
    } finally {
      released.release(); methodsReleased.release(); caller?.abort()
      await Promise.allSettled([work, ...otherCalls])
    }
    assert.equal(completedMethods, heldMethods)
  })
}

test('U06/R9: raw composition returns on caller abort before the same nested reserve and owned scope drain', { timeout: 10000 }, async () => {
  function gate() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve }); return { promise, release } }
  const entered = gate(), releaseReserve = gate(), pool = createM04LanePool()
  let scope: NonNullable<ReturnType<typeof createM04InvocationScope>> | undefined, caller: AbortController | undefined
  let reservePending = false, nestedSignal: AbortSignal | undefined, drainTerminal = false, finishTerminal = false
  const joins: Promise<void>[] = [], requests: M04FixedRequest[] = []
  const work = fullBatchHarness(1, false, undefined, undefined, {
    ready(_api, _input, signal) { caller = signal },
    async reserve(signal) {
      nestedSignal = signal; reservePending = true; entered.release()
      try { await releaseReserve.promise } finally { reservePending = false }
    },
    async method() { return true },
    request(request) { requests.push(request) },
    async work(config, claim, signal) {
      const owned = createM04InvocationScope(pool, 30000, signal); assert.ok(owned); scope = owned
      const authorityFor = (group: 'outer' | 'processing') => createV3PostgresMethodAuthority(config.binding, {
        async readCurrent(request, child) {
          const result = await owned.native('method', group, s => config.methodExecutor.readCurrent(request, s), child)
          return result.ok ? result.value : { status: 'unavailable' }
        },
      })
      // Handwritten fixed-request protocol bridge, not private authorityCore.
      // Real standalone MA1 and raw composition run over the existing doubles;
      // only the actual full-factory/native cases establish private wiring.
      const fixedFor = (group: 'outer' | 'processing'): M04FixedOperation => async (operation, child) => {
        const reply = await owned.native('jobs', group, s => config.jobsExecutor.executeFixed({
          ...config.binding, operationText: canonical({ ...operation, phase: 'authorized' }), epoch: 1,
          budget: { deadline: owned.deadline }, notAfter: new Date(Date.parse(config.clock().now) + 5000).toISOString(),
        } as M04FixedRequest, s), child)
        if (!reply.ok || reply.value.status !== 'acknowledged') return { status: 'unconfirmed' }
        return readM04NativeReply(reply.value.rows, operation.operation) ?? { status: 'unconfirmed' }
      }
      const raw = composeM04Invocation({ config, scope: owned, authority: authorityFor('outer'),
        processingAuthority: authorityFor('processing'), fixed: fixedFor('outer'), processingFixed: fixedFor('processing') })
      return raw.workOnce(claim, owned.signal)
    },
  })
  try {
    await entered.promise; assert.ok(scope && caller && nestedSignal)
    caller.abort()
    const result = await work
    assert.equal(result.result.status, 'unconfirmed', 'raw integration facade returned before the held executor')
    assert.equal(nestedSignal.aborted, true); assert.equal(reservePending, true)
    assert.equal(scope.snapshot().activeNative, 1); assert.equal(pool.snapshot().intake, 1)
    assert.equal(pool.snapshot().occupied, 1)
    joins.push(scope.drainNative().then(() => { drainTerminal = true }))
    joins.push(scope.finish().then(() => { finishTerminal = true }))
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(drainTerminal, false); assert.equal(finishTerminal, false)
    assert.equal(scope.snapshot().retired, true); assert.equal(pool.snapshot().occupied, 1)
    const terminalEffects = () => requests.map(request => JSON.parse(request.operationText))
      .filter(q => q.operation === 'queue_cas' && ['fail', 'complete'].includes(q.body.command.action))
    assert.equal(terminalEffects().length, 0)
    releaseReserve.release(); await Promise.all(joins)
    assert.equal(reservePending, false); assert.equal(scope.snapshot().activeNative, 0)
    assert.equal(pool.snapshot().intake, 0); assert.equal(pool.snapshot().occupied, 0)
    assert.equal(result.counts.reserve, 1); assert.equal(result.counts.finish, 0)
    assert.equal([...result.operations.values()].at(-1)?.next.state, 'leased')
    const admissions = scope.snapshot().nativeTotal
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(scope.snapshot().nativeTotal, admissions); assert.equal(terminalEffects().length, 0)
  } finally {
    releaseReserve.release(); caller?.abort()
    await Promise.allSettled([work, ...joins]); await scope?.finish()
  }
})
