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
