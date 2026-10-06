// Explicitly synthetic offline conformance; canonical proof/retrieval/extraction
// run through the existing harness, with only external boundaries simulated.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  consumeOfficialTruthSameRequestCompositionContext,
  consumeOfficialTruthSameRequestCompositionExecutionContext,
  consumeOfficialTruthSameRequestPrimaryContext,
} from './official-truth-same-request-extraction-server'
import { officialTruthCompositionSealView } from './official-truth-composition-policy-registry'
import {
  consumeOfficialTruthTrustedFactExecutionContext,
  officialTruthTrustedFactExtrahierenMitDefinitionen,
  type OfficialTruthTrustedFactExtractorErgebnis,
} from './official-truth-trusted-fact-extractor-registry'
import { compositionCaptureFixture as f } from './official-truth-same-request-extraction-server.test'

function immutable(value: unknown) {
  if (!value || typeof value !== 'object') return
  assert.ok(Object.isFrozen(value))
  for (const child of Object.values(value)) immutable(child)
}

test('primary retains exact successful fact and executed definition with complete frozen registry', async () => {
  const selected = f.definition(), inactive = { ...selected, extractorVersion: 2, current: false }
  const definitions = [selected, inactive]
  const { match, extract } = selected
  let actual: OfficialTruthTrustedFactExtractorErgebnis | null = null
  const { ergebnis } = await f.binden(f.eingabe(), { extract: input => {
    actual = officialTruthTrustedFactExtrahierenMitDefinitionen(input, definitions)
    return actual
  } })
  assert.equal(ergebnis.status, 'same_request_trusted_fact_material')
  if (ergebnis.status !== 'same_request_trusted_fact_material') return
  const context = consumeOfficialTruthSameRequestPrimaryContext(ergebnis)
  assert.ok(context)
  assert.ok(actual && (actual as OfficialTruthTrustedFactExtractorErgebnis).status === 'trusted_fact_extracted')
  const success = actual as Extract<OfficialTruthTrustedFactExtractorErgebnis, { status: 'trusted_fact_extracted' }>
  assert.strictEqual(context.execution.fact, success.fact)
  assert.notStrictEqual(context.execution.fact, ergebnis.trustedRuleFact)
  assert.deepEqual(context.execution.fact, ergebnis.trustedRuleFact)
  assert.strictEqual(context.execution.provenance, success.provenance)
  assert.strictEqual(context.execution.selected, context.execution.extractors[0])
  assert.strictEqual(context.execution.selected.match, match)
  assert.strictEqual(context.execution.selected.extract, extract)
  assert.equal(context.execution.extractors.length, 2)
  definitions.splice(0)
  Object.assign(selected, { match: () => { throw Error('replaced') }, extractorVersion: 99 })
  assert.strictEqual(context.execution.selected.match, match)
  assert.equal(context.execution.selected.extractorVersion, 1)
  assert.equal(context.execution.extractors[1]!.extractorVersion, 2)
  assert.deepEqual(context.binding.evidenceVersions, ergebnis.evidenceVersions)
  assert.deepEqual(context.binding.supportVersionIds, ergebnis.supportVersionIds)
  assert.equal(context.binding.reviewPacketKey, ergebnis.reviewPacketKey)
  assert.equal(context.binding.ruleScopeKey, ergebnis.ruleScopeKey)
  assert.equal(context.binding.serverReferenceTime, ergebnis.serverReferenceTime)
  assert.deepEqual(context.retrievals, ergebnis.retrievals)
  assert.equal('execution' in ergebnis, false)
  assert.equal('selected' in ergebnis, false)
  immutable(context)
  assert.throws(() => Object.assign(context.execution.fact, { effect: 'not_required' }))
  assert.equal(consumeOfficialTruthSameRequestPrimaryContext(ergebnis), null)
})

test('primary refuses fabricated, cloned, proxy and foreign result identities without getters', async () => {
  const { ergebnis } = await f.binden(f.eingabe(), { definitionen: [f.definition()] })
  let touched = 0
  const getter = Object.defineProperty({}, 'status', { get() { touched++; throw Error('private') } })
  for (const candidate of [null, undefined, '', {}, getter, { ...ergebnis }, structuredClone(ergebnis),
    JSON.parse(JSON.stringify(ergebnis)), Object.create(ergebnis), new Proxy(ergebnis, {})]) {
    assert.equal(consumeOfficialTruthSameRequestPrimaryContext(candidate), null)
  }
  assert.equal(touched, 0)
  assert.ok(consumeOfficialTruthSameRequestPrimaryContext(ergebnis))
  assert.equal(consumeOfficialTruthSameRequestPrimaryContext(ergebnis), null)
})

for (const substitution of ['clone', 'foreign_input', 'consumed', 'fact_clone'] as const) {
  test(`primary ${substitution} extractor success never gains a private execution context`, async () => {
    const { ergebnis } = await f.binden(f.eingabe(), { extract: input => {
      const result = officialTruthTrustedFactExtrahierenMitDefinitionen(
        substitution === 'foreign_input' ? structuredClone(input) : input, [f.definition()],
      )
      assert.equal(result.status, 'trusted_fact_extracted')
      if (substitution === 'consumed') assert.ok(consumeOfficialTruthTrustedFactExecutionContext(result, input))
      if (substitution === 'clone') return structuredClone(result)
      if (substitution === 'fact_clone' && result.status === 'trusted_fact_extracted') return { ...result, fact: structuredClone(result.fact) }
      return result
    } })
    // Legacy diagnostic projection remains compatible, but cannot enter producer.
    assert.equal(ergebnis.status, 'same_request_trusted_fact_material')
    assert.equal(consumeOfficialTruthSameRequestPrimaryContext(ergebnis), null)
  })
}

test('low-level capture is input-bound, one-shot and refuses arbitrary property-bearing objects', async () => {
  let touched = 0
  const getter = Object.defineProperty({}, 'fact', { get() { touched++; throw Error('private') } })
  assert.equal(consumeOfficialTruthTrustedFactExecutionContext(getter, getter), null)
  const { ergebnis } = await f.binden(f.eingabe(), { extract: input => {
    const result = officialTruthTrustedFactExtrahierenMitDefinitionen(input, [f.definition()])
    assert.equal(consumeOfficialTruthTrustedFactExecutionContext({ ...result }, input), null)
    assert.equal(consumeOfficialTruthTrustedFactExecutionContext(result, structuredClone(input)), null)
    assert.equal(consumeOfficialTruthTrustedFactExecutionContext(result, input), null)
    return result
  } })
  assert.equal(touched, 0)
  assert.equal(consumeOfficialTruthSameRequestPrimaryContext(ergebnis), null)
})

test('extractor dependency cannot replace scope or supports inside the genuine input reference', async () => {
  const { ergebnis } = await f.binden(f.eingabe(), { extract: input => {
    immutable(input)
    Object.assign(input as object, { scopeKey: 'foreign', supports: [] })
    return officialTruthTrustedFactExtrahierenMitDefinitionen(input, [f.definition()])
  } })
  assert.deepEqual(ergebnis, { status: 'blocked', reason: 'fact_incomplete' })
  assert.equal(consumeOfficialTruthSameRequestPrimaryContext(ergebnis), null)
})

async function composed() {
  const policy = f.kompositionsPolitik()
  const definition = f.kompositionsExtraktor({ match: 0, extract: 0 }, f.kompositionsBeobachtungen(policy))
  const result = await f.binden(f.zusammengesetzteEingabe(), {
    compositionPolicies: [policy, { ...policy, policyVersion: 2, current: false }],
    compositionExtractors: [definition, { ...definition, extractorVersion: 2, current: false }],
  })
  assert.equal(result.ergebnis.status, 'same_request_composition_bound')
  return { result: result.ergebnis, definition }
}

test('composition execution consumer reuses #898 capture, full registries and genuine seal fact', async () => {
  const { result, definition } = await composed()
  assert.deepEqual(Object.keys(result).sort(), ['seal', 'status'])
  const consumed = consumeOfficialTruthSameRequestCompositionExecutionContext(result)
  assert.ok(consumed)
  assert.equal(consumed.execution.extractors.length, 2)
  assert.equal(consumed.execution.policies.length, 2)
  assert.strictEqual(consumed.execution.selected.extractor, consumed.execution.extractors[0])
  assert.strictEqual(consumed.execution.selected.policy, consumed.execution.policies[0])
  assert.strictEqual(consumed.execution.selected.extractor.match, definition.match)
  assert.strictEqual(consumed.execution.selected.extractor.extract, definition.extract)
  assert.strictEqual(consumed.context.phaseB.fact, officialTruthCompositionSealView(consumed.context.phaseB.seal)!.fact)
  assert.equal('extract' in consumed.context.phaseA.selected.extractor, false)
  immutable(consumed)
  assert.equal(consumeOfficialTruthSameRequestCompositionContext(result), null)
  assert.equal(consumeOfficialTruthSameRequestCompositionExecutionContext(result), null)
})

test('both composition consumers share one-shot membership and reject copied/foreign attachments', async () => {
  const a = (await composed()).result, b = (await composed()).result
  for (const candidate of [{ ...a }, structuredClone(a), Object.create(a), new Proxy(a, {}),
    { ...a, seal: b.status === 'same_request_composition_bound' ? b.seal : {} }]) {
    assert.equal(consumeOfficialTruthSameRequestCompositionExecutionContext(candidate), null)
  }
  assert.ok(consumeOfficialTruthSameRequestCompositionContext(a))
  assert.equal(consumeOfficialTruthSameRequestCompositionExecutionContext(a), null)
  assert.ok(consumeOfficialTruthSameRequestCompositionExecutionContext(b))
  assert.equal(consumeOfficialTruthSameRequestCompositionContext(b), null)
})

test('parallel primary executions retain separate exact facts and blocked paths publish no context', async () => {
  const [a, b, blocked] = await Promise.all([
    f.binden(f.eingabe(), { definitionen: [f.definition()] }),
    f.binden(f.eingabe(), { definitionen: [f.definition()] }),
    f.binden(f.eingabe()),
  ])
  const ca = consumeOfficialTruthSameRequestPrimaryContext(a.ergebnis)
  const cb = consumeOfficialTruthSameRequestPrimaryContext(b.ergebnis)
  assert.ok(ca); assert.ok(cb)
  assert.notStrictEqual(ca.execution.fact, cb.execution.fact)
  assert.notStrictEqual(ca.execution.selected, cb.execution.selected)
  assert.notStrictEqual(ca.binding, cb.binding)
  assert.equal(blocked.ergebnis.status, 'blocked')
  assert.equal(consumeOfficialTruthSameRequestPrimaryContext(blocked.ergebnis), null)
  assert.equal(consumeOfficialTruthSameRequestCompositionExecutionContext(a.ergebnis), null)
})
