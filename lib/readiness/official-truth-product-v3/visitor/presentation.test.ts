import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { regelFaktKanonischLesen, type RegelFaktV2, type StayOutcomeV2 } from '@/lib/readiness/rule-claims'
import type { EventDeadlineV2 } from '@/lib/readiness/temporal'
import { createV3VisitorQuery } from './query'
import { presentV3VisitorAnswer } from './presentation'
import { syntheticV3Fixture } from './test-fixtures'

const deadline: EventDeadlineV2 = { schema: 2, kind: 'event_deadline', action: 'stay_extension_application',
  reference: { event: 'current_stay_permission_expiry', countryCode: 'DE' }, relation: 'before', semantics: 'mandatory' }
const stay: StayOutcomeV2 = { perVisit: { value: 30, unit: 'days' },
  initialGrant: { quantity: { value: 7, unit: 'days' }, event: 'permission_to_enter_granted' },
  extension: { requiresApplication: true, maximumTotal: { value: 6, unit: 'months' }, applicationDeadline: deadline,
    authority: { countryCode: 'DE', role: 'immigration_authority' } }, borderDiscretion: 'may_be_shorter' }
const unconditional = { schema: 2 as const, kind: 'unconditional' as const }
const branches = <T>(first: T, otherwise: T) => ({ schema: 2 as const, kind: 'branches' as const, branches: [
  { id: 'visitor', when: { kind: 'expression' as const, expression: { op: 'atomic' as const,
    predicate: { kind: 'travel_purpose' as const, purpose: 'visitor' as const } } }, outcome: first,
  supportVersionIds: [`ev2_${'a'.repeat(32)}`] },
  { id: 'other', when: { kind: 'otherwise' as const }, outcome: otherwise, supportVersionIds: [`ev2_${'b'.repeat(32)}`] },
] })

// Pure rendering conformance: canonical facts replace only the synthetic view
// fixture. This helper is not a cache insertion or an authority/read proof.
async function render(fact: RegelFaktV2) {
  const fixture = syntheticV3Fixture()
  const canonical = regelFaktKanonischLesen(fact.kind, 'visa', fact, fixture.ports.registry, { schema: 2, jurisdictionCountryCode: 'DE' })
  assert.equal(canonical.ok, true)
  const result = await createV3VisitorQuery(fixture.ports)({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] })
  if (!result.ok) assert.fail(result.reason)
  const base = result.answer
  const original = fixture.accepted.projection
  const projection = { ...original, rule: { ...original.rule, subject: { ...original.rule.subject, fact: { schema: 2 as const, fact } } } }
  const displayed = presentV3VisitorAnswer({ ...base, response: { ...base.response, cells: [{ citizenshipCountryCode: 'CH',
    results: [{ status: 'accepted', projection }] }] } }).cells[0].results[0]
  if (displayed.status !== 'accepted') assert.fail('expected synthetic display')
  return displayed
}

describe('U1 full schema-2 display conformance', () => {
  test('stay outcome preserves grant event, units, total extension, authority, deadline and discretion', async () => {
    const result = await render({ kind: 'stay_limit', schema: 2, applicability: unconditional, outcome: stay })
    assert.equal(result.statements.length, 6)
    const text = result.statements.map((statement) => statement.text).join('\n')
    for (const expected of [/Pro Aufenthalt: 30 Tage/, /Bei Erteilung der Einreisebewilligung: 7 Tage/,
      /Verlängerung nur auf Antrag; insgesamt höchstens 6 Monate/, /vor Ablauf der derzeitigen Aufenthaltsbewilligung/,
      /Zuständig: Einwanderungsbehörde .*Deutschland/, /kürzere Dauer/]) assert.match(text, expected)
  })
  test('every stay branch displays its own entire outcome including otherwise', async () => {
    const result = await render({ kind: 'stay_limit', schema: 2, applicability: branches(stay,
      { perVisit: { value: 2, unit: 'months' }, initialGrant: null, extension: null, borderDiscretion: 'fixed' }) })
    assert.equal(result.statements.length, 8)
    const visitor = result.statements.filter((statement) => statement.when === 'Reisezweck: Besuch')
    const otherwise = result.statements.filter((statement) => statement.when === 'In allen übrigen Fällen')
    assert.equal(visitor.length, 6)
    assert.deepEqual(otherwise.map((statement) => statement.text), ['Pro Aufenthalt: 2 Monate', 'Die Dauer ist festgelegt'])
  })
  test('event deadlines keep mandatory versus recommended semantics on every branch', async () => {
    const single = await render({ kind: 'temporal_rule', schema: 2, applicability: unconditional, outcome: deadline })
    assert.equal(single.statements.length, 1)
    assert.match(single.statements[0].text, /^Pflichtfrist:/)
    const split = await render({ kind: 'temporal_rule', schema: 2,
      applicability: branches(deadline, { ...deadline, semantics: 'recommended' }) })
    assert.equal(split.statements.length, 2)
    assert.match(split.statements[0].text, /^Pflichtfrist:/)
    assert.equal(split.statements[0].when, 'Reisezweck: Besuch')
    assert.match(split.statements[1].text, /^Empfehlung:/)
    assert.equal(split.statements[1].when, 'In allen übrigen Fällen')
  })
  test('visa requirement branches and independent option branches stay visible', async () => {
    const requirement = await render({ kind: 'requirement_effect', schema: 2, applicability: branches(
      { effect: 'not_required' as const, visaMode: 'visa_exempt' as const },
      { effect: 'required' as const, visaMode: 'visa_before_travel' as const }) })
    assert.equal(requirement.statements.length, 2)
    assert.equal(requirement.statements[1].when, 'In allen übrigen Fällen')
    const options = await render({ kind: 'visa_options', schema: 2, options: [
      { visaMode: 'visa_before_travel', applicability: branches(
        { eligibility: 'allowed' as const, mandate: 'mandatory' as const },
        { eligibility: 'not_allowed' as const, mandate: 'not_mandatory' as const }) },
      { visaMode: 'visa_exempt', applicability: unconditional, eligibility: 'allowed', mandate: 'not_mandatory' },
    ] })
    assert.equal(options.statements.length, 3)
    assert.equal(options.statements[1].when, 'In allen übrigen Fällen')
    assert.match(options.statements[1].text, /Nicht zulässig/)
    assert.equal(options.statements[2].when, null)
  })
})
