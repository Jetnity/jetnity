import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { regelFaktKanonischLesen, type RegelFaktV2, type StayOutcomeV2 } from '@/lib/readiness/rule-claims'
import type { EventDeadlineV2 } from '@/lib/readiness/temporal'
import { createV3VisitorQuery } from './query'
import { presentV3VisitorAnswer, type V3VisitorViewResult } from './presentation'
import { syntheticV3Fixture } from './test-fixtures'
import type { V3CustomerInformationDetail } from '../customer-information/details'
import type { V3CustomerInformationTopic } from '../customer-information/topics'
import { readV3GlobalRuleContext, type V3GlobalRuleContext, type V3LegalValidity } from '../contract'
import { v3CustomerInformationCoverage } from './coverage-presentation'

for (const unconditional of [false, true]) test(`C1 real query/reproof displays all application restrictions with unconditional expression=${unconditional}`, async () => {
  const f = syntheticV3Fixture(), item = unconditional ? f.applicationUnconditional : f.application
  f.cache.set(item.projection.rule.subject.contextKey, item.projection)
  const result = await createV3VisitorQuery({ ...f.ports, coverage: { targets: async () => ({ problem: null,
    zeilen: [{ context: item.rule.subject.context, factKind: 'blank_passport_pages' }] }) } })({
    destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'],
  })
  if (!result.ok) assert.fail(result.reason)
  const view = presentV3VisitorAnswer(result.answer), displayed = view.cells[0].results[0]
  if (displayed.status !== 'accepted') assert.fail(`expected synthetic proof, received ${displayed.status}`)
  assert.equal(view.synthetic, true)
  assert.equal(displayed.informationTopic, 'blank_passport_pages')
  assert.equal(f.counts.reproof, 1); assert.equal(f.counts.confirm, 1)
  const text = displayed.conditions.join('\n')
  assert.match(text, /Reisezweck: Tourismus/)
  assert.match(text, /Reisebeginn und Reiseende müssen zwischen 2026-11-07 und 2026-11-13 liegen \(beide Grenzen eingeschlossen\)\./)
  assert.match(text, /Direkte Einreise ohne Transit/)
  assert.match(text, /Reisepass; Ausstellungsland .*Schweiz; zugeordnete Staatsangehörigkeit .*Schweiz/)
  if (!unconditional) {
    assert.match(text, /gewöhnliches Reisedokument/)
    assert.match(text, /Reisebeginn: .*Schweiz/)
  }
  assert.doesNotMatch(text, /Keine weiteren Bedingungen|Reisezweck: Besuch|höchstens 5 Tage/)
  assert.equal(displayed.validityText, 'Gültigkeit: ab 2026-11-01 · bis 2026-12-31')
  assert.equal(f.counts.queue, 0)
})

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

/** Presentation conformance, not a fabricated publication/proof. The new context
 * and fact are canonically read, then rendered with a synthetic display envelope.
 * Backend tests own qualification, persistence and commit evidence.
 */
async function renderCustomerInformation(detail: V3CustomerInformationDetail,
  informationTopic: V3CustomerInformationTopic, requirementType: V3GlobalRuleContext['scope']['requirementType']) {
  const fixture = syntheticV3Fixture()
  const context = readV3GlobalRuleContext({ ...fixture.context(), contextRevision: 3, informationTopic,
    informationItem: 'synthetic_stable_item', scope: { ...fixture.context().scope, requirementType } })
  assert.ok(context.ok)
  const fact = { kind: 'entry_information' as const, detail }
  assert.ok(regelFaktKanonischLesen('entry_information', requirementType, fact, fixture.ports.registry).ok)
  const query = await createV3VisitorQuery(fixture.ports)({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] })
  assert.ok(query.ok)
  const original = fixture.accepted.projection
  const projection = { ...original, rule: { ...original.rule, subject: { ...original.rule.subject,
    context: context.value, fact: { schema: 1 as const, fact } } } }
  const result = presentV3VisitorAnswer({ ...query.answer, response: { ...query.answer.response,
    cells: [{ citizenshipCountryCode: 'CH', results: [{ status: 'accepted', projection }] }] } }).cells[0].results[0]
  assert.equal(result.status, 'accepted')
  if (result.status !== 'accepted') assert.fail('Expected a synthetic display')
  return result
}

test('revision-3 form details reach the visitor with full conditions, cost, source/version and no invented tourism window', async () => {
  const source = { sourceId: 'synthetic-destination', contentItemId: 'synthetic-publication', representationId: 'synthetic-original' }
  const result = await renderCustomerInformation({ kind: 'entry_form_details', formTitle: 'Synthetisches Einreiseformular',
    completion: 'required', cost: { status: 'specified', amount: { value: '12.3400', currency: 'CHF', basis: 'per_application' } },
    due: null, action: { source, purpose: 'form', href: 'https://destination.example/synthetic-test-publication' },
  }, 'entry_forms', 'entry_form')
  assert.equal(result.informationTopic, 'entry_forms')
  assert.match(result.statements.map(row => row.text).join('\n'), /12\.3400 CHF pro Antrag/)
  assert.match(result.statements.map(row => row.text).join('\n'), /Zeitpunkt: Derzeit nicht verfügbar/)
  assert.match(result.conditions.join('\n'), /Reisezweck: Besuch/)
  assert.doesNotMatch(result.conditions.join('\n'), /Tourismus|Reisebeginn und Reiseende müssen zwischen|synthetic_stable_item/)
  assert.equal(result.source.href, 'https://destination.example/synthetic-test-publication')
  assert.equal(result.ruleVersion, 1)
  const coverage = v3CustomerInformationCoverage([result]).groups.flatMap(group => group.topics)
  assert.equal(coverage.find(topic => topic.id === 'entry_forms')?.results[0], result)
  assert.equal(coverage.find(topic => topic.id === 'form_costs')?.related.length, 1)
  assert.equal(coverage.find(topic => topic.id === 'official_actions')?.related.length, 1)
})

test('unconfirmed form cost and missing action remain unavailable despite a confirmed form name', async () => {
  const result = await renderCustomerInformation({ kind: 'entry_form_details', formTitle: 'Synthetisches Einreiseformular',
    completion: 'required', cost: { status: 'unavailable' }, due: null, action: null,
  }, 'entry_forms', 'entry_form')
  const coverage = v3CustomerInformationCoverage([result]).groups.flatMap(group => group.topics)
  for (const id of ['form_costs', 'official_actions'] as const) {
    const topic = coverage.find(row => row.id === id)
    assert.equal(topic?.results.length, 0)
    assert.equal(topic?.related.length, 0)
  }
  assert.match(result.statements.map(row => row.text).join('\n'), /Formularkosten: Derzeit nicht verfügbar/)
})

// Pure display conformance, not a new source qualification or accepted-store write.
test('partial transit facts label every missing subvalue without inventing a negative finding', async () => {
  const fixture = syntheticV3Fixture()
  const query = await createV3VisitorQuery(fixture.ports)({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] })
  if (!query.ok) assert.fail(query.reason)
  const original = fixture.accepted.projection
  const path = { crossesBorderControl: null, leavesTransitArea: null, transitAirportCodes: null,
    maxTransitDurationMinutes: null, arrivalMode: null, departureMode: null,
    thirdCountryRequired: null, sameFlightRequired: null, onwardTicketRequired: null }
  for (const fact of [
    { kind: 'transit_conditions' as const, paths: [{ ...path, arrivalMode: 'air' as const }] },
    { kind: 'transit_conditions' as const, paths: [{ ...path, crossesBorderControl: false,
      leavesTransitArea: true, sameFlightRequired: false, thirdCountryRequired: true, onwardTicketRequired: false }] },
  ]) {
    assert.equal(regelFaktKanonischLesen(fact.kind, 'transit', fact, fixture.ports.registry).ok, true)
    const projection = { ...original, rule: { ...original.rule, subject: { ...original.rule.subject,
      fact: { schema: 1 as const, fact } } } }
    const displayed: V3VisitorViewResult = presentV3VisitorAnswer({ ...query.answer, response: { ...query.answer.response,
      cells: [{ citizenshipCountryCode: 'CH', results: [{ status: 'accepted', projection }] }] } }).cells[0].results[0]
    if (displayed.status !== 'accepted') assert.fail('Expected a synthetic display')
    assert.equal(displayed.informationTopic, 'transit')
    const text = displayed.statements.map(row => row.text).join('\n')
    assert.doesNotMatch(text, /ungeklärt|nicht bestimmt/)
    for (const label of ['Flughafenbindung', 'Maximale Transitdauer', 'Abreise']) {
      assert.ok(text.includes(`${label}: Derzeit nicht verfügbar`))
    }
    if (fact.paths[0].arrivalMode === 'air') {
      for (const label of ['Grenzkontrolle', 'Verlassen des Transitbereichs', 'Drittlandvoraussetzung', 'Flugwechsel', 'Weiterreiseticketvoraussetzung']) {
        assert.ok(text.includes(`${label}: Derzeit nicht verfügbar`))
      }
      assert.match(text, /Ankunft: Flug/)
      assert.doesNotMatch(text, /wird nicht passiert|Kein Drittland|Kein Weiterreiseticket|Flugwechsel möglich/)
    } else {
      for (const confirmed of ['Grenzkontrolle wird nicht passiert', 'Transitbereich wird verlassen', 'Weiterreise in ein Drittland erforderlich',
        'Flugwechsel möglich', 'Kein Weiterreiseticket erforderlich', 'Ankunft: Derzeit nicht verfügbar']) assert.ok(text.includes(confirmed))
    }
  }
})

test('unknown legal-validity boundaries stay explicit while known dates retain their exact meaning', async () => {
  const fixture = syntheticV3Fixture()
  const query = await createV3VisitorQuery(fixture.ports)({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] })
  if (!query.ok) assert.fail(query.reason)
  const original = fixture.accepted.projection
  const cases: readonly [V3LegalValidity, string][] = [
    [{ status: 'unresolved' }, 'Gültigkeit: Derzeit nicht verfügbar'],
    [{ status: 'specified', validFrom: null, validUntil: null }, 'Gültigkeit: Beginn: Derzeit nicht verfügbar · Ende: Derzeit nicht verfügbar'],
    [{ status: 'specified', validFrom: '2026-11-01', validUntil: null }, 'Gültigkeit: ab 2026-11-01 · Ende: Derzeit nicht verfügbar'],
    [{ status: 'specified', validFrom: null, validUntil: '2026-12-31' }, 'Gültigkeit: Beginn: Derzeit nicht verfügbar · bis 2026-12-31'],
    [{ status: 'specified', validFrom: '2026-11-01', validUntil: '2026-12-31' }, 'Gültigkeit: ab 2026-11-01 · bis 2026-12-31'],
  ]
  for (const [legalValidity, expected] of cases) {
    const projection = { ...original, rule: { ...original.rule, subject: { ...original.rule.subject,
      evidence: { ...original.rule.subject.evidence, legalValidity } } } }
    const displayed: V3VisitorViewResult = presentV3VisitorAnswer({ ...query.answer, response: { ...query.answer.response,
      cells: [{ citizenshipCountryCode: 'CH', results: [{ status: 'accepted', projection }] }] } }).cells[0].results[0]
    if (displayed.status !== 'accepted') assert.fail('Expected a synthetic display')
    assert.equal(displayed.validityText, expected)
    assert.equal(displayed.source.href, 'https://destination.example/synthetic-test-publication')
    assert.equal(displayed.ruleVersion, original.rule.revision)
  }
})
