import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createV3ImportCoordinator } from '../import/service-server'
import { readV3QuarantineCompletion } from '../storage/quarantine-codec'
import { createV3ContextIdentity, readV3GlobalRuleContext, readV3VisitorInput, type V3GlobalRuleContext } from '../contract'
import { createV3VisitorQuery } from '../visitor/query'
import { syntheticV3Fixture } from '../visitor/test-fixtures'
import { assertC1NoPublication, assertC1Prepared, c1Fixture } from './test-support/fixture'

test('C1 actual I1 preparation and full codec replay preserve application in every nested synthetic observation', async () => {
  const f = c1Fixture('c1-offline-prepared'), value = await f.completion()
  assertC1Prepared(f, value.outcome, value.audit)
  assert.deepEqual(f.synthetic.importAudits.at(-1), value.audit)
  assert.ok(f.originals.control.extracts >= 2)
  const decoded = readV3QuarantineCompletion(value.outcome, value.audit, f.upload, f.binding, f.originals.registry)
  if (!decoded.ok) assert.fail(decoded.reason)
  assert.deepEqual(decoded.value, value)
  assertC1Prepared(f, decoded.value.outcome, decoded.value.audit)
  const replay = await createV3ImportCoordinator(f.synthetic.importPorts).submit(f.text)
  assert.deepEqual(replay, { status: 'completed', replayed: true, outcome: value.outcome })
  assertC1NoPublication(f)
})

test('C1 actual I1 unapproved method stays unavailable, retained and never extracts', async () => {
  const f = c1Fixture('c1-offline-unapproved', false), value = await f.completion()
  assert.deepEqual(value.outcome, { status: 'unavailable', reason: 'method_not_approved' })
  assert.deepEqual(f.synthetic.importAudits.at(-1), value.audit)
  const decoded = readV3QuarantineCompletion(value.outcome, value.audit, f.upload, f.binding, f.originals.registry)
  if (!decoded.ok) assert.fail(decoded.reason)
  assert.deepEqual(decoded.value, value)
  assert.equal(f.originals.control.extracts, 0)
  assertC1NoPublication(f)
})

function replaceAt(value: unknown, path: readonly string[], replacement: unknown): unknown {
  if (path.length === 0) return replacement
  const [head, ...tail] = path
  if (Array.isArray(value)) return value.map((child, index) => String(index) === head ? replaceAt(child, tail, replacement) : child)
  assert.ok(value && typeof value === 'object')
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, key === head ? replaceAt(child, tail, replacement) : child]))
}

test('complete replay rejects changing or stripping one nested application under its old identity', async () => {
  const f = c1Fixture('c1-offline-cross-context'), value = await f.completion()
  const changed = { ...f.context, application: { ...f.context.application, tripStartAndEndWindow: { from: '2026-11-08', through: '2026-11-13' } } }
  const stripped = { scope: f.context.scope, route: f.context.route, conditions: f.context.conditions }
  const paths = [['value', 'decision', 'context'], ['value', 'decision', 'primary', 'observation', 'context'],
    ['value', 'decision', 'counterCheck', 'attempts', '0', 'observation', 'context'], ['value', 'version', 'subject', 'context']]
  for (const context of [changed, stripped]) for (const path of paths) {
    const altered = replaceAt(value.outcome, path, context)
    assert.notDeepEqual(altered, value.outcome, 'mutation must reach a real nested context')
    assert.equal(readV3QuarantineCompletion(altered, value.audit, f.upload, f.binding, f.originals.registry).ok, false, path.join('.'))
  }
  assert.equal(readV3QuarantineCompletion(value.outcome, { ...value.audit, contextKey: `official-truth-context:v3:${'0'.repeat(64)}` },
    f.upload, f.binding, f.originals.registry).ok, false)
})

const input = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
function queryFor(f: ReturnType<typeof syntheticV3Fixture>, context: V3GlobalRuleContext) {
  return createV3VisitorQuery({ ...f.ports, coverage: { targets: async () => ({ problem: null,
    zeilen: [{ context, factKind: 'blank_passport_pages' }] }) } })
}

test('real visitor reproof refuses another valid window or stripped restriction despite the same base scope', async () => {
  for (const strip of [false, true]) {
    const f = syntheticV3Fixture(), original = f.applicationContext()
    assert.ok('contextRevision' in original)
    const changed = strip ? { scope: original.scope, route: original.route, conditions: original.conditions }
      : { ...original, application: { ...original.application, tripStartAndEndWindow: { from: '2026-11-08', through: '2026-11-13' } } }
    const context = readV3GlobalRuleContext(changed), before = createV3ContextIdentity(original), after = createV3ContextIdentity(changed)
    if (!context.ok || !before.ok || !after.ok) assert.fail('valid synthetic alternate context')
    assert.equal(after.value.ruleScopeKey, before.value.ruleScopeKey)
    assert.notEqual(after.value.contextKey, before.value.contextKey)
    const impostor = f.make(context.value).projection
    f.cache.set(impostor.rule.subject.contextKey, impostor)
    const result = await queryFor(f, context.value)(input)
    if (!result.ok) assert.fail(result.reason)
    assert.equal(result.answer.response.cells[0].results[0].status, 'unavailable')
    assert.equal(f.counts.reproof, 1, 'fixed original map must refuse a different full context')
    assert.equal(f.counts.queue, 0)
  }
})

test('visitor input remains only destination and citizenships, never an application questionnaire', async () => {
  for (const extra of [{ application: { purpose: 'tourism' } }, { tripStartAndEndWindow: { from: '2026-11-07', through: '2026-11-13' } },
    { purpose: 'tourism' }, { passportNumber: 'PRIVATE_CANARY' }]) {
    assert.equal(readV3VisitorInput({ ...input, ...extra }).ok, false)
    const f = syntheticV3Fixture()
    assert.deepEqual(await queryFor(f, f.applicationContext())({ ...input, ...extra }), { ok: false, reason: 'invalid_input' })
  }
})
