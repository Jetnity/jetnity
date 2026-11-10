// Protocol doubles exercise actual coordinator control flow, not persistence/native proof.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createV3PostgresDurableJobs } from '../method/authority-postgres'
import { readM04Command, type M04Config, type M04FixedRequest } from './contract'
import { fixture, ids, METHOD } from '../monitor/test-support'
import type { V3QueueCommit, V3ManagedJobRecord } from '../monitor/queue'
import type { V3GlobalRuleContext } from '../contract'
import { m04IdentityVectors } from '../../../../scripts/db/official-truth-v3-durable-jobs-1/generate-identity-vectors'

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
  assert.equal(result.status, 'confirmed'); assert.ok(h.counts().reads >= 4)
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
  assert.notEqual((await h.api.enqueueRule(h.input)).status, 'confirmed')
  const authoritativeReads = h.requests.filter(r => JSON.parse(r.operationText).operation === 'queue_read' && r.epoch !== null)
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
async function fullBatchHarness(count: number, corruptLast = false, context?: V3GlobalRuleContext, importFault?: ImportFault) {
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
  const terminal = new AbortController()
  const config: M04Config = { binding: M04_TEST_BINDING, registry: f.originals.registry, clock: f.clock,
    methodExecutor: { async readCurrent() { counts.method++; return { status: 'rows', rows: [{ status: 'approved',
      method_id: M04_TEST_BINDING.methodId, revision: '1', method_digest: M04_TEST_BINDING.methodDigest,
      package_digest: M04_TEST_BINDING.packageDigest, epoch: '1', approval_mode: 'until_revoked', approval_until: null, observed_at: NOW, remaining_ms: '5000' }] } } },
    intakeExecutor: { async execute(statement, params, signal) {
      counts.intake++; assert.equal(signal.aborted, false)
      const binding = JSON.parse(String(params[0])), old = bindings.get(binding.operationId)
      let reply: unknown
      if (statement.includes('.capture_v1(')) {
        counts.capture++; const text = String(params[1]), parsed = readV3RetainableProposal(text, f.originals.registry); assert.ok(parsed.ok)
        if (!parsed.ok) throw Error('unreachable')
        const record = { reference: { binding, proposalDigest: parsed.value.digest, bytes: parsed.value.bytes }, text, outcome: null, audit: null }
        bindings.set(binding.operationId, record); reply = { status: 'recorded', record }
      } else if (statement.includes('.read_v1(')) {
        counts.read++
        if (importFault === 'read_unavailable' || importFault === 'completion_read_unknown' && counts.finish > 0) return { status: 'unavailable' }
        reply = old ? { status: 'recorded', record: old } : { status: 'not_attempted' }
      }
      else if (statement.includes('.reserve_v1(')) {
        counts.reserve++; assert.ok(old)
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
      const q = JSON.parse(request.operationText), b = q.body
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
        assert.equal(execution, null)
        execution = { claim: b.claim, leasedJob: b.leasedJob, attemptKey: 'execution-attempt:v3:' + 'e'.repeat(64) }
        reply = { status: 'reserved', ...execution, token: 'f'.repeat(64) }
      } else if (q.operation === 'execution_prepare') {
        assert.ok(execution); execution.result = b.result; execution.references = b.references
        reply = { status: 'prepared', attemptKey: execution.attemptKey, result: b.result, references: b.references }
      } else {
        assert.equal(q.operation, 'execution_read')
        if (b.purpose === 'artifact') counts.artifactRead++
        reply = !execution?.result ? { status: 'absent' } : q.phase === 'probe' ? { status: 'requires_authority' }
          : execution.completed ? { status: 'completed', claim: execution.claim, leasedJob: execution.leasedJob, attemptKey: execution.attemptKey,
            job, result: execution.result, references: execution.references }
            : { status: 'prepared', claim: execution.claim, leasedJob: execution.leasedJob, attemptKey: execution.attemptKey,
              result: execution.result, references: execution.references }
      }
      return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
    } },
    producer: { async produce(value, signal) {
      const result = await f.producer.produce(value, signal)
      if (!corruptLast || result.status !== 'delivered') return result
      return { status: 'delivered', deliveries: result.deliveries.map((d, i) => i === result.deliveries.length - 1 ? { ...d, text: '{"broken":true}' } : d) }
    } }, evidence: f.evidence, history: f.history }
  const api = createV3PostgresDurableJobs(config)
  assert.equal((await (importFault ? api.enqueueRule(f.ruleInput) : api.enqueueDiscovery(f.discoveryInput))).status, 'confirmed')
  for (const k of Object.keys(counts) as (keyof typeof counts)[]) counts[k] = 0
  const result = await api.workOnce(f.claim(importFault ? 'rule_research' : 'combination_discovery'), terminal.signal)
  return { result, counts, f, bindings, operations }
}

test('M04-B2-01: actual S1/I1/E1 complete all sixteen originals within the 256-call invocation cap', async () => {
  const h = await fullBatchHarness(16)
  assert.equal(h.result.status, 'processed', JSON.stringify(h.result))
  if (h.result.status !== 'processed') return
  assert.equal(h.result.worker.acceptedRule, false)
  assert.equal(h.result.results.length, 16)
  assert.equal(h.counts.capture, 16); assert.equal(h.counts.finish, 16); assert.equal(h.counts.reserve, 16)
  assert.equal(h.counts.read, 48, '16 capture confirmations + 16 artifact opens + 16 I1 reads; no repeated full-batch opens')
  assert.equal(h.bindings.size, 16); assert.equal(h.f.producerCalls(), 1)
  assert.ok(h.counts.method + h.counts.jobs + h.counts.intake <= 256, JSON.stringify(h.counts))
  for (const delivered of h.f.delivered) assert.equal(h.bindings.get(delivered.binding.operationId)?.text, delivered.text)
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
