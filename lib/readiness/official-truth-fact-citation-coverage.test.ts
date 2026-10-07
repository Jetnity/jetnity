import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  officialTruthCitationTargetLesen,
  officialTruthCompositionCitationKey,
  officialTruthFactCitationCoverage,
  officialTruthFactCitationTargets,
  type OfficialTruthCompositionCitationTarget,
} from './official-truth-composition-policy-registry'
import { regelFaktKanonischLesen, type RegelFakt } from './rule-claims'
import { quellenRegistryErstellen } from './source-registry'

const A = `ev2_${'a'.repeat(32)}`, B = `ev2_${'b'.repeat(32)}`, C = `ev2_${'c'.repeat(32)}`
type Citation = { target: OfficialTruthCompositionCitationTarget; versionId: string }

function parsed(raw: unknown, kind: 'requirement_effect' | 'visa_options' = 'requirement_effect'): RegelFakt {
  const registry = quellenRegistryErstellen([])
  assert.ok(registry.ok)
  const read = regelFaktKanonischLesen(kind, 'visa', raw, registry.registry)
  assert.ok(read.ok, JSON.stringify(read))
  return read.fact
}
function branchFact(ties = false, missingAtomSupport = false) {
  const atom = (support: string) => ({ op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' },
    ...(missingAtomSupport ? {} : { supportVersionIds: [support] }),
  })
  return parsed({ kind: 'requirement_effect', schema: 1, applicability: { schema: 1, kind: 'branches', branches: [
    { id: 'exemption', when: { kind: 'expression', expression: ties ? { op: 'all', operands: [atom(A), atom(B)] } : atom(A) },
      outcome: { effect: 'not_required', visaMode: null }, supportVersionIds: ties || missingAtomSupport ? [A, B] : [A] },
    { id: 'residual', when: { kind: 'otherwise' }, outcome: { effect: 'required', visaMode: 'electronic_visa' }, supportVersionIds: [B] },
  ] } })
}
function citations(fact: RegelFakt, supports: (target: OfficialTruthCompositionCitationTarget) => readonly string[]): Citation[] {
  const targets = officialTruthFactCitationTargets(fact)
  assert.ok(targets)
  return targets.flatMap(target => supports(target).map(versionId => ({ target, versionId })))
}
function coverage(fact: RegelFakt, rows: Citation[], ids = [A, B]) {
  return officialTruthFactCitationCoverage({ fact, supportVersionIds: ids, citations: rows })
}

test('primary legacy fields require complete exact citation coverage', () => {
  const fact = parsed({ kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' })
  const targets = officialTruthFactCitationTargets(fact)
  assert.deepEqual(targets, [{ kind: 'fact_field', fieldPath: 'effect' }, { kind: 'fact_field', fieldPath: 'visaMode' }])
  assert.ok(Object.isFrozen(targets)); assert.ok(Object.isFrozen(targets[0]))
  const rows = citations(fact, () => [A])
  assert.equal(coverage(fact, rows, [A]), true)
  assert.equal(coverage(fact, rows.slice(1), [A]), false)
  assert.equal(coverage(fact, [...rows, rows[0]!], [A]), false)
  assert.equal(coverage(fact, [...rows, { target: { kind: 'fact_field', fieldPath: 'kind' }, versionId: A }], [A]), false)
  assert.equal(coverage(fact, [{ ...rows[0]!, versionId: C }, rows[1]!], [A]), false)
  assert.equal(coverage(fact, rows, [A, A]), false)
})

test('branch, outcomes, atom and otherwise reuse exact canonical locator and support checks', () => {
  const fact = branchFact()
  const rows = citations(fact, target => target.kind === 'otherwise' ? [B] : [A])
  assert.deepEqual(rows.map(row => officialTruthCompositionCitationKey(row.target)), [
    '{"kind":"atom","branchId":"exemption","atomLocator":"branch:exemption/atom"}',
    '{"kind":"branch","branchId":"exemption"}',
    '{"kind":"branch_outcome","branchId":"exemption","field":"effect"}',
    '{"kind":"branch_outcome","branchId":"exemption","field":"visaMode"}',
    '{"kind":"otherwise","branchId":"residual"}',
  ])
  assert.equal(coverage(fact, rows), true)
  for (const omitted of ['atom', 'otherwise', 'branch', 'branch_outcome']) {
    assert.equal(coverage(fact, rows.filter(row => row.target.kind !== omitted)), false, omitted)
  }
  assert.equal(coverage(fact, rows.map(row => row.target.kind === 'atom' ? { ...row, versionId: B } : row)), false)
  assert.equal(coverage(fact, rows.map(row => row.target.kind === 'branch_outcome' ? { ...row, versionId: B } : row)), false)
  assert.equal(coverage(fact, rows, [A, B, C]), false)
})

test('multi-support atom without its own citation cannot gain inferred provenance', () => {
  const fact = branchFact(false, true)
  const rows = citations(fact, target => target.kind === 'otherwise' ? [B] : target.kind === 'branch' ? [A, B] : [A])
  assert.equal(coverage(fact, rows), false)
})

test('tie locators match unique embedded support sets and preserve permutation semantics', () => {
  const fact = branchFact(true)
  const rows = citations(fact, target => {
    if (target.kind === 'branch') return [A, B]
    if (target.kind === 'atom') return [target.atomLocator.includes(':0/atom') ? A : B]
    if (target.kind === 'branch_outcome') return [target.field === 'effect' ? A : B]
    return [B]
  })
  assert.equal(coverage(fact, rows), true)
  assert.equal(coverage(fact, [...rows].reverse()), true)
  assert.equal(coverage(fact, rows.map(row => row.target.kind === 'atom' ? { ...row, versionId: row.versionId === A ? B : A } : row)), true)
  assert.equal(coverage(fact, rows.map(row => row.target.kind === 'atom' ? { ...row, versionId: A } : row)), false)
})

test('visa options retain namespaced fields, branch, outcomes, atom and otherwise', () => {
  const fact = parsed({ kind: 'visa_options', schema: 1, options: [
    { visaMode: 'electronic_visa', applicability: { schema: 1, kind: 'branches', branches: [
      { id: 'ordinary', when: { kind: 'expression', expression: { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' }, supportVersionIds: [A] } },
        outcome: { eligibility: 'allowed', mandate: 'not_mandatory' }, supportVersionIds: [A] },
      { id: 'residual', when: { kind: 'otherwise' }, outcome: { eligibility: 'not_allowed', mandate: 'not_mandatory' }, supportVersionIds: [B] },
    ] } },
    { visaMode: 'visa_before_travel', eligibility: 'allowed', mandate: 'not_mandatory', applicability: { schema: 1, kind: 'unconditional' } },
  ] }, 'visa_options')
  const rows = citations(fact, target => target.kind === 'visa_option_otherwise' ? [B] : [A])
  assert.equal(rows.length, 7)
  assert.equal(coverage(fact, rows), true)
  for (const kind of ['visa_option_field', 'visa_option_branch', 'visa_option_outcome', 'visa_option_atom', 'visa_option_otherwise']) {
    assert.equal(coverage(fact, rows.filter(row => row.target.kind !== kind)), false, kind)
  }
})

test('target reader refuses accessors, symbols, unknown fields and illegal locator namespaces', () => {
  let getters = 0
  const accessor = Object.defineProperty({ fieldPath: 'effect' }, 'kind', { enumerable: true, get() { getters++; return 'fact_field' } })
  for (const value of [accessor, { kind: 'fact_field', fieldPath: 'effect', unexpected: 'x' },
    { kind: 'fact_field', fieldPath: 'effect', [Symbol('extra')]: true },
    { kind: 'atom', branchId: 'a', atomLocator: 'branch:b/atom' },
    new Proxy({}, { ownKeys() { throw Error('private') } }), Object.create({ kind: 'fact_field', fieldPath: 'effect' })]) {
    assert.equal(officialTruthCitationTargetLesen(value), null)
  }
  assert.equal(getters, 0)
  const target = officialTruthCitationTargetLesen({ kind: 'atom', branchId: 'a', atomLocator: 'branch:a/atom' })
  assert.ok(target); assert.ok(Object.isFrozen(target))
})

test('schema-2 facts cannot be relabelled as legacy/v1 citation material', () => {
  const fact = { kind: 'requirement_effect', schema: 2, effect: 'required', visaMode: 'electronic_visa' } as unknown as RegelFakt
  assert.equal(officialTruthFactCitationTargets(fact), null)
  assert.equal(coverage(fact, [{ target: { kind: 'fact_field', fieldPath: 'effect' }, versionId: A }], [A]), false)
})
