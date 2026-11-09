import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { readV3IntakeBinding, readV3IntakeReference, type V3IntakeBinding } from './intake-contract'

const binding = (): V3IntakeBinding => ({ schema: 3, kind: 'proposal_intake_binding',
  operationId: `op3_${'a'.repeat(32)}`, jobId: `job3_${'b'.repeat(32)}`,
  contextKey: `official-truth-context:v3:${'c'.repeat(64)}`, method: { methodId: 'synthetic-s1-method', revision: 1 },
  runnerId: `runner3_${'d'.repeat(32)}`, deliveryId: `delivery3_${'e'.repeat(32)}`, inputRevision: `git:${'f'.repeat(40)}` })

describe('S1 shared intake identity reader', () => {
  test('accepts both bounded runner revision kinds without claiming authority', () => {
    for (const inputRevision of [`git:${'f'.repeat(40)}`, `snapshot:${'a'.repeat(64)}`]) {
      const input = { ...binding(), inputRevision }, result = readV3IntakeBinding(input)
      assert.equal(result.ok, true)
      if (!result.ok) assert.fail('valid binding')
      assert.deepEqual(result.value, input)
      assert.notEqual(result.value, input)
      assert.notEqual(result.value.method, input.method)
      assert.ok(Object.isFrozen(result.value) && Object.isFrozen(result.value.method))
      assert.equal(Object.isFrozen(input), false)
    }
  })
  test('rejects unknown and personal fields at both closed levels', () => {
    assert.equal(readV3IntakeBinding({ ...binding(), passportNumber: 'unwanted' }).ok, false)
    assert.equal(readV3IntakeBinding({ ...binding(), method: { ...binding().method, approved: true } }).ok, false)
    assert.equal(readV3IntakeBinding({ ...binding(), accepted: true }).ok, false)
  })
  test('never reads getters or inherited records', () => {
    let called = 0
    const input = { ...binding() }
    Object.defineProperty(input, 'method', { enumerable: true, get() { called++; throw Error('must not read') } })
    assert.equal(readV3IntakeBinding(input).ok, false)
    assert.equal(called, 0)
    assert.equal(readV3IntakeBinding(Object.create(binding())).ok, false)
    assert.equal(readV3IntakeBinding(new Date()).ok, false)
  })
  test('validates exact operation, job, context, delivery and runner identities', () => {
    for (const key of ['operationId', 'jobId', 'contextKey', 'runnerId', 'deliveryId', 'inputRevision']) {
      for (const value of ['', ' ', 'https://untrusted.example', 'A'.repeat(40), null, 3]) {
        assert.equal(readV3IntakeBinding({ ...binding(), [key]: value }).ok, false, key)
      }
    }
  })
  test('bounds method revision and identifier without coercion', () => {
    assert.equal(readV3IntakeBinding({ ...binding(), method: { methodId: 'method', revision: 2_147_483_647 } }).ok, true)
    for (const revision of [0, -1, 1.1, 2_147_483_648, NaN, Infinity, '1']) {
      assert.equal(readV3IntakeBinding({ ...binding(), method: { methodId: 'method', revision } }).ok, false)
    }
    for (const methodId of ['A', 'a', 'a'.repeat(65), 'owner@example.com']) {
      assert.equal(readV3IntakeBinding({ ...binding(), method: { methodId, revision: 1 } }).ok, false)
    }
  })
  test('reference is exact, bounded and detached', () => {
    const reference = { binding: binding(), proposalDigest: 'a'.repeat(64), bytes: 65_536 }
    const result = readV3IntakeReference(reference)
    assert.equal(result.ok, true)
    if (!result.ok) assert.fail('reference')
    assert.notEqual(result.value.binding, reference.binding)
    for (const bytes of [0, 65_537, 1.1, '1', null]) assert.equal(readV3IntakeReference({ ...reference, bytes }).ok, false)
    assert.equal(readV3IntakeReference({ ...reference, proposalDigest: 'A'.repeat(64) }).ok, false)
    assert.equal(readV3IntakeReference({ ...reference, sourceProof: true }).ok, false)
  })
})
