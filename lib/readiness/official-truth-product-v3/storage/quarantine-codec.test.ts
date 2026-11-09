import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { s1Fixture } from '../../../../scripts/db/official-truth-v3-intake-store-1/fixtures'
import { readV3QuarantineCompletion } from './quarantine-codec'
import type { V3ImportOutcome } from '../import/service-server'

describe('S1 complete durable outcome codec', () => {
  test('actual I1 prepared result and audit survive a detached immutable roundtrip', async () => {
    const f = s1Fixture('codec-prepared'), value = await f.completion()
    const result = readV3QuarantineCompletion(value.outcome, value.audit, f.upload, f.binding, f.originals.registry)
    assert.equal(result.ok, true)
    if (!result.ok) assert.fail('valid completion')
    assert.deepEqual(result.value, value)
    assert.notEqual(result.value.outcome, value.outcome)
    assert.ok(Object.isFrozen(result.value.outcome) && Object.isFrozen(result.value.audit.method))
    if (result.value.outcome.status !== 'prepared') assert.fail('prepared')
    assert.equal(result.value.outcome.value.acceptance, 'not_committed')
    assert.equal(result.value.outcome.value.reproof, 'required_before_commit')
  })
  for (const reason of ['primary_unclear', 'comparable_conflict'] as const) {
    test(`replays full ${reason} predecessor and archive; omission or mutation refuses`, async () => {
      const f = s1Fixture(`codec-${reason}`), value = await f.withArchivedPredecessor(reason)
      assert.equal(value.outcome.status, 'escalation')
      if (value.outcome.status !== 'escalation') assert.fail('escalation')
      assert.ok(value.outcome.previousDecision && value.outcome.archiveAppend)
      const decoded = readV3QuarantineCompletion(value.outcome, value.audit, f.upload, f.binding, f.originals.registry)
      assert.equal(decoded.ok, true)
      if (!decoded.ok) assert.fail('complete archive')
      assert.deepEqual(decoded.value, value)
      for (const altered of [
        { ...value.outcome, previousDecision: null }, { ...value.outcome, archiveAppend: null },
        { ...value.outcome, archiveAppend: { ...value.outcome.archiveAppend, fromDecisionRef: `source-decision:v3:${'a'.repeat(64)}` } },
        { ...value.outcome, key: `source-escalation:v3:${'b'.repeat(64)}` },
      ]) assert.equal(readV3QuarantineCompletion(altered, value.audit, f.upload, f.binding, f.originals.registry).ok, false)
    })
  }
  test('all terminal negative variants are closed, fully bound and roundtrip', () => {
    const f = s1Fixture('codec-negative')
    const outcomes: V3ImportOutcome[] = [
      ...(['conditions_unresolved', 'invalid_verification', 'history_changed', 'method_not_current'] as const).map(reason => ({ status: 'quarantined' as const, reason })),
      ...(['method_not_approved', 'method_unavailable', 'verification_unavailable', 'history_unavailable', 'aborted', 'temporary_failure'] as const)
        .map(reason => ({ status: 'unavailable' as const, reason })),
    ]
    for (const outcome of outcomes) {
      const audit = f.auditFor(outcome), result = readV3QuarantineCompletion(outcome, audit, f.upload, f.binding, f.originals.registry)
      assert.equal(result.ok, true)
      if (!result.ok) assert.fail('negative variant')
      assert.deepEqual(result.value, { outcome, audit })
      assert.equal(readV3QuarantineCompletion({ ...outcome, extra: true }, audit, f.upload, f.binding, f.originals.registry).ok, false)
      assert.equal(readV3QuarantineCompletion({ ...outcome, reason: 'error bytes' }, audit, f.upload, f.binding, f.originals.registry).ok, false)
    }
  })
  test('prepared cross-record substitutions and accidental acceptance are rejected', async () => {
    const f = s1Fixture('codec-corrupt'), value = await f.completion()
    if (value.outcome.status !== 'prepared') assert.fail('prepared')
    const original = value.outcome.value
    for (const changed of [
      { ...original, acceptance: 'committed' }, { ...original, proposalDigest: 'a'.repeat(64) },
      { ...original, proposalDisposition: 'matched' },
      { ...original, transition: { ...original.transition, operationId: `op3_${'a'.repeat(32)}` } },
      { ...original, transition: { ...original.transition, primaryEvidenceVersionId: `ev2_${'a'.repeat(32)}` } },
      { ...original, decision: { ...original.decision, reference: `source-decision:v3:${'a'.repeat(64)}` } },
      { ...original, version: { ...original.version, reference: `rule-version:v3:${'a'.repeat(64)}` } },
    ]) assert.equal(readV3QuarantineCompletion({ status: 'prepared', value: changed }, value.audit, f.upload, f.binding, f.originals.registry).ok, false)
  })
  test('every audit identity/status field is bound; no unknown fields or earlier timestamp', async () => {
    const f = s1Fixture('codec-audit'), value = await f.completion()
    for (const [field, change] of Object.entries({ operationId: `op3_${'a'.repeat(32)}`, jobId: `job3_${'a'.repeat(32)}`,
      contextKey: `official-truth-context:v3:${'a'.repeat(64)}`, proposalDigest: 'a'.repeat(64), method: { ...f.binding.method, revision: 2 },
      result: 'unavailable', decisionRef: null, escalationKey: `source-escalation:v3:${'a'.repeat(64)}`, recordedAt: '2026-11-08T00:00:00.000Z',
      extra: true })) {
      assert.equal(readV3QuarantineCompletion(value.outcome, { ...value.audit, [field]: change }, f.upload, f.binding, f.originals.registry).ok, false, field)
    }
  })
  test('malformed objects, getters, huge values and payload errors are never mirrored', () => {
    const f = s1Fixture('codec-safe'), good: V3ImportOutcome = { status: 'unavailable', reason: 'temporary_failure' }
    let reads = 0
    const getter = Object.defineProperty({}, 'status', { enumerable: true, get() { reads++; throw Error('private content') } })
    for (const value of [getter, null, [], new Date(), { status: 'unavailable', reason: 'x'.repeat(524_289) }]) {
      const result = readV3QuarantineCompletion(value, f.auditFor(good), f.upload, f.binding, f.originals.registry)
      assert.deepEqual(result, { ok: false, reason: 'invalid_contract' })
    }
    assert.equal(reads, 0)
  })
})
