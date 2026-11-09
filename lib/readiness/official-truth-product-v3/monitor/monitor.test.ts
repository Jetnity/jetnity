import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { runV3SourceMonitorOnce, type V3MonitorPlanPort, type V3SourceObservationPort,
  type V3ProjectionSuppressionPort, type V3ProjectionSuppression, type V3MonitorTarget } from './monitor'
import { fixture, queueHarness, ref, METHOD } from './test-support'

function harness() {
  const f = fixture(), h = queueHarness()
  const target: V3MonitorTarget = { context: f.context, factKind: 'requirement_effect', source: f.source, role: 'primary',
    baseline: { sourceContentHash: f.observation.evidence.sourceContentHash, sourceFingerprintProtocol: 1 },
    nextCheckAt: '2026-11-09T08:03:00.000Z', primaryFreshUntil: '2026-11-09T09:00:00.000Z',
    expectedVersionRef: f.version.reference, sourceDecisionRef: f.decision.reference,
    projectionRefs: [ref('rule-projection', 'active')], knownUnresolvedConflictRef: null }
  const events = new Map<string, V3ProjectionSuppression>(), active = new Set(target.projectionRefs), escalations = new Set<string>()
  const planReceipt = Object.freeze({}), sourceReceipt = Object.freeze({})
  const control = { sourceState: 'observed' as 'observed' | 'unclear' | 'unreachable' | 'unavailable',
    changed: false, planValid: true, sourceValid: true, sourceCalls: 0, lostApplyResponse: false, unknown: false,
    onObserve: null as (() => Promise<void>) | null, beforeApply: null as (() => void) | null }
  const plans: V3MonitorPlanPort<object> = {
    registry: f.registry,
    async load() { return { status: 'available', plan: { method: METHOD, targets: [target], attemptLimit: 3 }, receipt: planReceipt } },
    async reprove(receipt, candidate) { return receipt === planReceipt && control.planValid && candidate.expectedVersionRef === f.version.reference },
  }
  const sources: V3SourceObservationPort<object> = {
    async observe(candidate) {
      control.sourceCalls++; await control.onObserve?.()
      if (control.sourceState === 'unclear') return { status: 'unclear', receipt: sourceReceipt }
      if (control.sourceState !== 'observed') return { status: control.sourceState }
      return { status: 'observed', receipt: sourceReceipt, observation: { source: candidate.source,
        fingerprint: { sourceContentHash: control.changed ? sha256Hex('changed-source-not-a-proved-law-change') : candidate.baseline.sourceContentHash,
          sourceFingerprintProtocol: candidate.baseline.sourceFingerprintProtocol }, retrievedAt: h.clock.now() } }
    },
    async reprove(receipt) { return receipt === sourceReceipt && control.sourceValid },
  }
  let tail = Promise.resolve()
  const suppressions: V3ProjectionSuppressionPort = {
    async confirm(operationId, auditRef) {
      if (control.unknown) return { status: 'unconfirmed' }
      const prior = events.get(operationId)
      return prior && prior.auditRef === auditRef ? { status: 'confirmed', auditRef } : { status: 'not_attempted' }
    },
    async apply(effect, reprove, signal) {
      let unlock: () => void = () => {}; const prior = tail
      tail = new Promise<void>((resolve) => { unlock = resolve }); await prior
      try {
        if (events.has(effect.operationId)) return { status: 'confirmed', auditRef: effect.auditRef }
        control.beforeApply?.()
        if (signal.aborted || !await reprove(signal)) return { status: 'unavailable' }
        if (effect.expectedVersionRef !== f.version.reference) return { status: 'stale_head' }
        events.set(effect.operationId, structuredClone(effect))
        for (const id of effect.projectionRefs) active.delete(id)
        if (effect.escalationKey) escalations.add(effect.escalationKey)
        if (control.lostApplyResponse) { control.lostApplyResponse = false; return { status: 'unconfirmed' } }
        return { status: 'confirmed', auditRef: effect.auditRef }
      } finally { unlock() }
    },
  }
  return { f, h, target, events, active, escalations, control, sources,
    deps: { plans, sources, suppressions, queue: h.queue, methodAuthority: h.method.port, now: h.clock.now, invocationMilliseconds: 1000 } }
}

describe('M1 source monitor preserves source comparison and suppression truth', () => {
  test('changed normalized bytes enqueue research but never assert changed law or acceptance', async () => {
    const t = harness(); t.control.changed = true
    const result = await runV3SourceMonitorOnce(t.deps)
    assert.equal(result.status, 'complete'); assert.ok(result.outcomes.some((item) => item.status === 'research_queued'))
    assert.ok(result.outcomes.every((item) => item.ruleChange === 'not_asserted'))
    assert.equal(t.h.storage.records.size, 1); assert.equal(t.events.size, 0)
    assert.equal(t.h.storage.records.values().next().value?.state, 'queued')
  })
  test('unchanged content does not manufacture a newer rule or rejuvenate the existing source expiry', async () => {
    const t = harness(), expiry = t.target.primaryFreshUntil
    const result = await runV3SourceMonitorOnce(t.deps)
    assert.equal(result.outcomes[0].status, 'unchanged'); assert.equal(t.h.storage.writes, 0)
    assert.equal(t.target.primaryFreshUntil, expiry); assert.equal(t.events.size, 0)
  })
  test('optional unreachable or unclear source does not suppress a clear still-current mandatory source', async () => {
    for (const sourceState of ['unreachable', 'unclear'] as const) {
      const t = harness(); t.target.role = 'counter'; t.target.source = t.f.counterSource; t.control.sourceState = sourceState
      const result = await runV3SourceMonitorOnce(t.deps)
      assert.equal(result.status, 'complete'); assert.equal(t.events.size, 0); assert.equal(t.active.size, 1)
      assert.equal(t.escalations.size, 0)
    }
  })
  test('known unresolved conflict survives an optional outage and deduplicates suppression/escalation', async () => {
    const t = harness(); t.target.role = 'counter'; t.target.source = t.f.counterSource
    t.target.knownUnresolvedConflictRef = ref('source-conflict', 'known'); t.control.sourceState = 'unreachable'
    const results = await Promise.all([runV3SourceMonitorOnce(t.deps), runV3SourceMonitorOnce(t.deps)])
    assert.ok(results.every((result) => result.outcomes.some((item) => item.status === 'suppressed')))
    assert.equal(t.events.size, 1); assert.equal(t.active.size, 0); assert.equal(t.escalations.size, 1)
  })
  test('known conflict is suppressed before a hanging source consumes the invocation budget', async () => {
    const t = harness(); t.target.knownUnresolvedConflictRef = ref('source-conflict', 'known')
    const sources: V3SourceObservationPort<object> = { ...t.sources, observe: async (_target, _method, signal) => new Promise((resolve) => {
      signal.addEventListener('abort', () => resolve({ status: 'unreachable' }), { once: true })
    }) }
    const result = await runV3SourceMonitorOnce({ ...t.deps, sources, invocationMilliseconds: 15 })
    assert.equal(result.status, 'interrupted'); assert.equal(t.active.size, 0); assert.equal(t.events.size, 1)
  })
  test('unclear mandatory source suppresses its projections and requests research with one escalation', async () => {
    const t = harness(); t.control.sourceState = 'unclear'
    const result = await runV3SourceMonitorOnce(t.deps)
    assert.ok(result.outcomes.some((item) => item.status === 'suppressed'))
    assert.ok(result.outcomes.some((item) => item.status === 'research_queued'))
    assert.equal(t.active.size, 0); assert.equal(t.escalations.size, 1)
  })
  test('freshness expiring during an awaited source check is evaluated again before effects', async () => {
    const t = harness(); t.target.primaryFreshUntil = '2026-11-09T08:04:00.010Z'
    t.control.onObserve = async () => { t.h.clock.advance(10) }
    const result = await runV3SourceMonitorOnce(t.deps)
    assert.ok(result.outcomes.some((item) => item.status === 'suppressed')); assert.equal(t.active.size, 0)
    assert.equal([...t.events.values()][0].reason, 'expired'); assert.equal(t.escalations.size, 0)
  })
  test('method revocation at the atomic suppression point prevents a falsely reported effect', async () => {
    const t = harness(); t.target.knownUnresolvedConflictRef = ref('source-conflict', 'known')
    t.control.beforeApply = () => { t.h.method.control.enabled = false }
    const result = await runV3SourceMonitorOnce(t.deps)
    assert.equal(t.events.size, 0); assert.ok(result.outcomes.every((item) => item.status !== 'suppressed'))
  })
  test('lost suppression response remains unconfirmed until the same operation is actually confirmed', async () => {
    const t = harness(); t.target.knownUnresolvedConflictRef = ref('source-conflict', 'known')
    t.control.sourceState = 'unreachable'; t.control.lostApplyResponse = true
    assert.ok((await runV3SourceMonitorOnce(t.deps)).outcomes.some((item) => item.status === 'unconfirmed'))
    assert.equal(t.events.size, 1)
    t.control.unknown = true
    assert.ok((await runV3SourceMonitorOnce(t.deps)).outcomes.some((item) => item.status === 'unconfirmed'))
    assert.equal(t.events.size, 1)
    t.control.unknown = false
    assert.ok((await runV3SourceMonitorOnce(t.deps)).outcomes.some((item) => item.status === 'suppressed'))
    assert.equal(t.events.size, 1)
  })
  test('method revocation while confirming an old suppression cannot produce a current suppressed outcome', async () => {
    const t = harness(); t.target.knownUnresolvedConflictRef = ref('source-conflict', 'known')
    t.control.sourceState = 'unreachable'
    assert.ok((await runV3SourceMonitorOnce(t.deps)).outcomes.some((item) => item.status === 'suppressed'))
    const original = t.deps.suppressions.confirm.bind(t.deps.suppressions)
    t.deps.suppressions.confirm = async (...args) => {
      const result = await original(...args)
      t.h.method.control.enabled = false
      return result
    }
    const result = await runV3SourceMonitorOnce(t.deps)
    assert.ok(result.outcomes.every((item) => item.status !== 'suppressed'))
    assert.ok(result.outcomes.some((item) => item.status === 'unconfirmed')); assert.equal(t.events.size, 1)
  })
  test('foreign registry pin or stale plan cannot start observation, queue or invalidation', async () => {
    for (const failure of ['pin', 'plan'] as const) {
      const t = harness(); if (failure === 'pin') t.target.source = { ...t.target.source, representationVersion: 2 }
      else t.control.planValid = false
      const result = await runV3SourceMonitorOnce(t.deps)
      assert.equal(t.control.sourceCalls, 0); assert.equal(t.h.storage.writes, 0); assert.equal(t.events.size, 0)
      assert.ok(result.outcomes.every((item) => ['invalid', 'unavailable'].includes(item.status)))
    }
  })
  test('unbound source transport causes no plan read or network fallback', async () => {
    const t = harness()
    assert.equal((await runV3SourceMonitorOnce({ ...t.deps, sources: null })).status, 'unavailable')
    assert.equal(t.control.sourceCalls, 0); assert.equal(t.h.storage.writes, 0)
  })
})
