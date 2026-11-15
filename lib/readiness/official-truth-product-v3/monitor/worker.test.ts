import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { readV3ResearchProposal } from '../contract'
import { runV3ResearchWorkerOnce, type V3ResearchResultCustodyPort, type V3ResearchWorkPort, type V3WorkerResultRecord } from './worker'
import { type V3ManagedJobRecord } from './queue'
import { queueHarness, fixture, ids, ref, must } from './test-support'

function workerHarness(discovery = true) {
  const f = fixture(), h = queueHarness(), queue = discovery ? h.discovery : h.queue
  const custody = new WeakMap<object, V3WorkerResultRecord>(), journal = new Map<string, object>()
  const control = { executeCount: 0, unknown: false, corrupt: false, unconfirmedOnce: false,
    onExecute: null as (() => Promise<void>) | null, captured: null as V3ManagedJobRecord | null }
  const recordFor = (job: V3ManagedJobRecord): V3WorkerResultRecord => job.kind === 'research_job_record'
    ? { kind: 'rule_research', jobId: job.jobId, operationId: job.operationId, jobKey: job.jobKey,
      preparedAt: h.clock.now(), decisionRef: ref('source-decision', 'synthetic-worker-result') }
    : { kind: 'combination_discovery', jobId: job.jobId, operationId: job.operationId, jobKey: job.identity.jobKey,
      preparedAt: h.clock.now(), discoveryRef: ref('combination-discovery-result', 'synthetic-worker-result'),
      proposalDigests: [sha256Hex('synthetic-untrusted-proposal')] }
  const results: V3ResearchResultCustodyPort<object> = {
    async lookup(job) {
      if (control.unknown) return { status: 'unconfirmed' }
      const receipt = journal.get(job.operationId)
      return receipt ? { status: 'prepared', receipt } : { status: 'not_attempted' }
    },
    async confirm(receipt, job) {
      const record = custody.get(receipt)
      if (!record || record.jobId !== job.jobId || record.operationId !== job.operationId) return { status: 'unconfirmed' }
      return { status: 'confirmed', record: control.corrupt ? { ...record, jobId: ids('job3', 'foreign') } : record }
    },
  }
  const work: V3ResearchWorkPort<object> = {
    async execute(job, fence, signal) {
      control.executeCount++; control.captured = job
      await control.onExecute?.()
      if (signal.aborted) return { status: 'unconfirmed' }
      const current = await queue.read(job.kind === 'research_job_record' ? job.jobKey : job.identity.jobKey, signal)
      if (current.status !== 'confirmed' || current.record.revision !== fence.revision
        || current.record.lease?.generation !== fence.generation || current.record.lease.expiresAt <= h.clock.now()) return { status: 'unconfirmed' }
      const receipt = Object.freeze({}), record = recordFor(job)
      custody.set(receipt, record); journal.set(job.operationId, receipt)
      if (control.unconfirmedOnce) { control.unconfirmedOnce = false; return { status: 'unconfirmed' } }
      return { status: 'prepared', receipt }
    },
  }
  return { f, h, queue, control, work, results,
    deps: { queue, work, results, methodAuthority: h.method.port, now: h.clock.now, invocationMilliseconds: 1000 },
    async enqueue() {
      const ack = await queue.enqueue(discovery ? f.discoveryEnqueue : f.enqueue)
      assert.equal(ack.status, 'confirmed'); if (ack.status !== 'confirmed') assert.fail()
      return ack.record.kind === 'research_job_record' ? ack.record.jobKey : ack.record.identity.jobKey
    },
  }
}
const claim = (jobKey: string, name = 'first') => ({ jobKey, operationId: ids('op3', `worker-claim-${name}`),
  leaseId: ids('lease3', `worker-lease-${name}`), leaseMilliseconds: 1000 })

describe('M1 bounded research and discovery worker', () => {
  test('neutral discovery confirms only untrusted result custody, then contextual proposal remains separately untrusted', async () => {
    const t = workerHarness(), key = await t.enqueue()
    const result = await runV3ResearchWorkerOnce(claim(key), t.deps)
    assert.equal(result.status, 'completed'); if (result.status !== 'completed') assert.fail()
    assert.equal(result.acceptedRule, false); assert.equal(result.result.kind, 'combination_discovery')
    assert.equal(t.control.captured?.kind, 'combination_discovery_job_record')
    assert.equal('context' in t.control.captured!, false); assert.equal('factKind' in t.control.captured!, false)
    const ruleAck = await t.h.queue.enqueue(t.f.enqueue)
    assert.equal(ruleAck.status, 'confirmed'); if (ruleAck.status !== 'confirmed') assert.fail()
    const proposal = must(readV3ResearchProposal({ schema: 3, kind: 'untrusted_research_proposal', jobId: ruleAck.record.jobId,
      operationId: ids('op3', 'neutral-adapter-proposal'), context: t.f.context, contextKey: t.f.identity.contextKey,
      research: t.f.identity.research, proposedFact: t.f.observation.fact,
      references: [{ source: { sourceId: t.f.source.sourceId, contentItemId: t.f.source.contentItemId, representationId: t.f.source.representationId },
        claimedRetrievedAt: t.f.observation.evidence.retrievedAt, claimedValidity: t.f.observation.evidence.legalValidity }] }, t.f.registry))
    assert.equal(proposal.kind, 'untrusted_research_proposal'); assert.equal('accepted' in proposal, false)
    assert.equal('method' in proposal, false)
  })
  test('a rule worker records prepared decision completion without claiming a database acceptance', async () => {
    const t = workerHarness(false), key = await t.enqueue()
    const result = await runV3ResearchWorkerOnce(claim(key), t.deps)
    assert.equal(result.status, 'completed'); if (result.status !== 'completed') assert.fail()
    assert.equal(result.result.kind, 'rule_research'); assert.equal(result.acceptedRule, false)
  })
  test('optional atomic preflight and terminal acquisition keep exact receipts and actual confirm ordering', async () => {
    const t = workerHarness(), key = await t.enqueue(), events: string[] = []
    let initial: object | undefined, preparedReceipt: object | undefined
    const methodAuthority = { ...t.h.method.port, async resolveCurrent(...args: Parameters<typeof t.h.method.port.resolveCurrent>) {
      const value = await t.h.method.port.resolveCurrent(...args)
      if (value.status === 'approved') initial = value.receipt
      return value
    } }
    const work: V3ResearchWorkPort<object> = { ...t.work, async prepare(job, fence, receipt, signal) {
      events.push('atomic-start'); assert.equal(receipt, initial); assert.equal(signal.aborted, false)
      assert.equal(fence.jobId, job.jobId); assert.equal(fence.generation, job.lease?.generation)
      return { status: 'ready' }
    } }
    const results: V3ResearchResultCustodyPort<object> = { ...t.results,
      async confirm(receipt, job, checkedAt, signal) {
        const value = await t.results.confirm(receipt, job, checkedAt, signal)
        if (value.status === 'confirmed') { preparedReceipt = receipt; events.push('actual-confirm') }
        return value
      },
      async acquireTerminalAuthority(receipt, anchor, job, checkedAt, signal) {
        events.push('terminal-acquire'); assert.equal(receipt, preparedReceipt); assert.equal(anchor, initial)
        assert.equal(job.state, 'leased'); assert.equal(checkedAt, t.h.clock.now()); assert.equal(signal.aborted, false)
        return { status: 'current' }
      },
    }
    const result = await runV3ResearchWorkerOnce(claim(key), { ...t.deps, methodAuthority, work, results })
    assert.equal(result.status, 'completed')
    assert.deepEqual(events, ['atomic-start', 'actual-confirm', 'terminal-acquire'])
    assert.equal(t.control.executeCount, 1)
  })
  for (const [opted, atomic] of [[true, true], [false, true], [true, false]] as const)
    test(`custody-first ordering requires explicit opt-in ${opted} and actual atomic prepare ${atomic}`, async () => {
      const t = workerHarness(), key = await t.enqueue(), events: string[] = []
      const before = t.h.clock.now()
      let observedAt: string | undefined, initial: object | undefined
      const methodAuthority = { ...t.h.method.port, async resolveCurrent(...args: Parameters<typeof t.h.method.port.resolveCurrent>) {
        events.push('method'); observedAt = args[1]
        const value = await t.h.method.port.resolveCurrent(...args)
        if (value.status === 'approved') initial = value.receipt
        return value
      } }
      const results: V3ResearchResultCustodyPort<object> = { ...t.results,
        ...(opted ? { lookupBeforeWorkerAuthority: true as const } : {}),
        async lookup(job, signal) { events.push('lookup'); t.h.clock.advance(100); return t.results.lookup(job, signal) },
      }
      const work: V3ResearchWorkPort<object> = { ...t.work, ...(atomic ? {
        async prepare(_job, _fence, receipt, signal) {
          assert.equal(receipt, initial); assert.equal(signal.aborted, false); return { status: 'ready' as const }
        },
      } : {}) }
      assert.equal((await runV3ResearchWorkerOnce(claim(key), { ...t.deps, methodAuthority, results, work })).status, 'completed')
      assert.deepEqual(events, opted && atomic ? ['lookup', 'method'] : ['method', 'lookup'])
      assert.equal(observedAt, opted && atomic ? t.h.clock.now() : before)
      assert.equal(t.control.executeCount, 1)
    })
  for (const failure of ['unconfirmed', 'unavailable', 'throw'] as const)
    test(`custody-first ${failure} preserves the original negative queue audit without positive work`, async () => {
      const t = workerHarness(), key = await t.enqueue()
      let lookups = 0, approvals = 0, failures = 0, starts = 0
      const methodAuthority = { ...t.h.method.port, async resolveCurrent(...args: Parameters<typeof t.h.method.port.resolveCurrent>) {
        approvals++; return t.h.method.port.resolveCurrent(...args)
      } }
      const results: V3ResearchResultCustodyPort<object> = { ...t.results, lookupBeforeWorkerAuthority: true,
        async lookup() { lookups++; if (failure === 'throw') throw Error('unavailable read'); return { status: failure } },
      }
      const work: V3ResearchWorkPort<object> = { ...t.work, async prepare() { starts++; return { status: 'ready' } } }
      const queue = { ...t.queue, async fail(...args: Parameters<typeof t.queue.fail>) { failures++; return t.queue.fail(...args) } }
      const result = await runV3ResearchWorkerOnce(claim(key), { ...t.deps, queue, methodAuthority, results, work })
      assert.equal(result.status, 'backoff'); assert.ok(result.status === 'backoff')
      assert.equal(result.job.lastFailure, failure === 'unavailable' ? 'verification_unavailable' : 'commit_unconfirmed')
      assert.deepEqual([lookups, approvals, failures, starts, t.control.executeCount], [1, 1, 1, 0, 0])
    })
  for (const expiredAt of ['claim', 'lookup'] as const)
    test(`custody-first refuses the lease boundary after ${expiredAt} before acquiring worker authority`, async () => {
      const t = workerHarness(), key = await t.enqueue()
      let lookups = 0, approvals = 0, starts = 0
      const queue = { ...t.queue, async claim(...args: Parameters<typeof t.queue.claim>) {
        const result = await t.queue.claim(...args); if (expiredAt === 'claim') t.h.clock.advance(1000); return result
      } }
      const results: V3ResearchResultCustodyPort<object> = { ...t.results, lookupBeforeWorkerAuthority: true,
        async lookup(job, signal) { lookups++; t.h.clock.advance(1000); return t.results.lookup(job, signal) },
      }
      const methodAuthority = { ...t.h.method.port, async resolveCurrent(...args: Parameters<typeof t.h.method.port.resolveCurrent>) {
        approvals++; return t.h.method.port.resolveCurrent(...args)
      } }
      const work: V3ResearchWorkPort<object> = { ...t.work, async prepare() { starts++; return { status: 'ready' } } }
      const result = await runV3ResearchWorkerOnce(claim(key), { ...t.deps, queue, results, methodAuthority, work })
      assert.equal(result.status, 'superseded')
      assert.deepEqual([lookups, approvals, starts, t.control.executeCount], [expiredAt === 'claim' ? 0 : 1, 0, 0, 0])
    })
  for (const stop of ['abort', 'timeout'] as const)
    test(`custody-first ${stop} joins the late read and never acquires worker authority afterwards`, async () => {
      const t = workerHarness(), key = await t.enqueue(), controller = new AbortController()
      let entered!: () => void, release!: () => void, aborted!: () => void
      const reading = new Promise<void>(resolve => { entered = resolve })
      const held = new Promise<void>(resolve => { release = resolve })
      const stopped = new Promise<void>(resolve => { aborted = resolve })
      let lookups = 0, approvals = 0, starts = 0, settled = false, returned = false
      const results: V3ResearchResultCustodyPort<object> = { ...t.results, lookupBeforeWorkerAuthority: true,
        async lookup(_job, signal) {
          lookups++; signal.addEventListener('abort', aborted, { once: true }); entered()
          await held; settled = true; return { status: 'not_attempted' }
        },
      }
      const methodAuthority = { ...t.h.method.port, async resolveCurrent(...args: Parameters<typeof t.h.method.port.resolveCurrent>) {
        approvals++; return t.h.method.port.resolveCurrent(...args)
      } }
      const work: V3ResearchWorkPort<object> = { ...t.work, async prepare() { starts++; return { status: 'ready' } } }
      const pending = runV3ResearchWorkerOnce(claim(key), { ...t.deps, results, methodAuthority, work,
        invocationMilliseconds: stop === 'timeout' ? 250 : 1000 }, controller.signal)
        .then(value => { returned = true; return value })
      try {
        await reading; if (stop === 'abort') controller.abort(); await stopped
        await new Promise<void>(resolve => setImmediate(resolve))
        assert.equal(settled, false); assert.equal(returned, false)
        assert.deepEqual([lookups, approvals, starts, t.control.executeCount], [1, 0, 0, 0])
        release(); assert.equal((await pending).status, 'unconfirmed'); assert.equal(settled, true)
        assert.deepEqual([lookups, approvals, starts, t.control.executeCount], [1, 0, 0, 0])
      } finally { controller.abort(); release(); await pending }
    })
  test('unknown atomic preflight cannot run the producer, retry the start or settle a fabricated failure', async () => {
    const t = workerHarness(), key = await t.enqueue()
    let starts = 0
    const work: V3ResearchWorkPort<object> = { ...t.work, async prepare() { starts++; return { status: 'unconfirmed' } } }
    const result = await runV3ResearchWorkerOnce(claim(key), { ...t.deps, work })
    assert.equal(result.status, 'unconfirmed'); assert.equal(starts, 1); assert.equal(t.control.executeCount, 0)
    assert.equal(t.h.storage.records.get(key)?.state, 'leased')
  })
  test('invalid confirmed record never reaches optional terminal authority', async () => {
    const t = workerHarness(), key = await t.enqueue(); t.control.corrupt = true
    let acquired = 0
    const results: V3ResearchResultCustodyPort<object> = { ...t.results,
      async acquireTerminalAuthority() { acquired++; return { status: 'current' } } }
    assert.notEqual((await runV3ResearchWorkerOnce(claim(key), { ...t.deps, results })).status, 'completed')
    assert.equal(acquired, 0)
  })
  test('two concurrent worker ticks execute one owner; the other sees non-due work', async () => {
    const t = workerHarness(), key = await t.enqueue()
    const results = await Promise.all([runV3ResearchWorkerOnce(claim(key, 'one'), t.deps), runV3ResearchWorkerOnce(claim(key, 'two'), t.deps)])
    assert.equal(t.control.executeCount, 1); assert.equal(results.filter((result) => result.status === 'completed').length, 1)
  })
  test('unknown result custody triggers backoff without a blind provider execution', async () => {
    const t = workerHarness(), key = await t.enqueue(); t.control.unknown = true
    const result = await runV3ResearchWorkerOnce(claim(key), t.deps)
    assert.equal(result.status, 'backoff'); assert.equal(t.control.executeCount, 0)
    if (result.status !== 'backoff') assert.fail()
    assert.equal(result.job.lastFailure, 'commit_unconfirmed')
  })
  test('lost result write response is confirmed in the next attempt without repeating research', async () => {
    const t = workerHarness(), key = await t.enqueue(); t.control.unconfirmedOnce = true
    assert.equal((await runV3ResearchWorkerOnce(claim(key), t.deps)).status, 'backoff')
    assert.equal(t.control.executeCount, 1)
    t.h.clock.advance(100)
    assert.equal((await runV3ResearchWorkerOnce(claim(key, 'retry'), t.deps)).status, 'completed')
    assert.equal(t.control.executeCount, 1)
  })
  test('foreign result binding cannot finish the job', async () => {
    const t = workerHarness(), key = await t.enqueue(); t.control.corrupt = true
    const result = await runV3ResearchWorkerOnce(claim(key), t.deps)
    assert.equal(result.status, 'backoff'); if (result.status !== 'backoff') assert.fail()
    assert.equal(result.job.lastFailure, 'invalid_proposal')
  })
  test('method revocation during work prevents succeeded even after an execution began', async () => {
    const t = workerHarness(), key = await t.enqueue()
    t.control.onExecute = async () => { t.h.method.control.enabled = false }
    const result = await runV3ResearchWorkerOnce(claim(key), t.deps)
    assert.notEqual(result.status, 'completed')
    assert.notEqual(t.h.storage.records.get(key)?.state, 'succeeded')
  })
  test('late first worker cannot persist a result or finish after another worker reclaimed its lease', async () => {
    const t = workerHarness(), key = await t.enqueue()
    t.control.onExecute = async () => {
      t.h.clock.advance(1000)
      const next = await t.queue.claim(claim(key, 'replacement'))
      assert.equal(next.status, 'confirmed')
    }
    const first = await runV3ResearchWorkerOnce(claim(key), t.deps)
    assert.equal(first.status, 'superseded')
    assert.equal(t.h.storage.records.get(key)?.state, 'leased')
    assert.equal(t.h.storage.records.get(key)?.lease?.leaseId, ids('lease3', 'worker-lease-replacement'))
  })
  test('timeout and abort are bounded and never synthesize successful completion', async () => {
    const t = workerHarness(), key = await t.enqueue(); let abortSeen = false
    const work: V3ResearchWorkPort<object> = { execute: async (_job, _fence, signal) => new Promise((resolve) => {
      signal.addEventListener('abort', () => { abortSeen = true; resolve({ status: 'unconfirmed' }) }, { once: true })
    }) }
    const result = await runV3ResearchWorkerOnce(claim(key), { ...t.deps, work, invocationMilliseconds: 20 })
    assert.equal(result.status, 'unconfirmed'); assert.equal(abortSeen, true)
    assert.equal(t.h.storage.records.get(key)?.state, 'leased')
    const controller = new AbortController(); controller.abort()
    assert.equal((await runV3ResearchWorkerOnce(claim(key, 'abort'), t.deps, controller.signal)).status, 'unconfirmed')
  })
  test('unbound execution port performs no queue or result mutation', async () => {
    const t = workerHarness(), key = await t.enqueue(), writes = t.h.storage.writes
    assert.equal((await runV3ResearchWorkerOnce(claim(key), { ...t.deps, work: null })).status, 'unavailable')
    assert.equal(t.h.storage.writes, writes); assert.equal(t.control.executeCount, 0)
  })
})
