// TEST-ONLY proposals use the existing fictional E1 registry and canonical S0.
import assert from 'node:assert/strict'
import { createV3WorkIdentity } from '../../../lib/readiness/official-truth-product-v3/contract'
import { sha256Hex } from '../../../lib/readiness/digest'
import { s1Fixture } from './fixtures'

export function retentionFixtures() {
  const f = s1Fixture('retention-shapes')
  const unconditional = (schema: number) => ({ schema, kind: 'unconditional' })
  const expression = { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' } }
  const branching = (schema: number, outcome: unknown) => ({ schema, kind: 'branches', branches: [
    { id: 'visitor', when: { kind: 'expression', expression }, outcome, supportVersionIds: [] },
  ] })
  const effectOutcome = { effect: 'required', visaMode: 'visa_before_travel' }
  const visaOutcome = { eligibility: 'allowed', mandate: 'not_mandatory' }
  const visaOption = { visaMode: 'electronic_visa', ...visaOutcome }
  const deadline = { schema: 2, kind: 'event_deadline', action: 'stay_extension_application',
    reference: { event: 'current_stay_permission_expiry', countryCode: 'AQ' }, relation: 'before', semantics: 'mandatory' }
  const stay = { perVisit: { value: 30, unit: 'days' }, initialGrant: null, extension: null, borderDiscretion: 'fixed' }
  const cases: Array<{ name: string; schema: 1 | 2; type: string; fact: Record<string, unknown>; supported?: boolean }> = [
    { name: 'legacy-effect', schema: 1, type: 'visa', fact: { kind: 'requirement_effect', ...effectOutcome } },
    { name: 'legacy-visa', schema: 1, type: 'visa', fact: { kind: 'visa_options', options: [visaOption] } },
    { name: 'legacy-stay', schema: 1, type: 'visa', fact: { kind: 'stay_limit', ...stay, rollingWindow: null } },
    { name: 'passport-no-duration', schema: 1, type: 'passport_validity', fact: { kind: 'passport_validity', semantics: 'valid_on_entry' } },
    { name: 'passport-duration', schema: 1, type: 'passport_validity', fact: { kind: 'passport_validity', semantics: 'minimum_remaining_from_entry', duration: { value: 6, unit: 'months' } } },
    { name: 'blank-pages', schema: 1, type: 'blank_passport_pages', fact: { kind: 'blank_passport_pages', minimumPages: 2 } },
    { name: 'transit', schema: 1, type: 'transit', fact: { kind: 'transit_conditions', paths: [{ crossesBorderControl: false,
      leavesTransitArea: false, transitAirportCodes: ['LHR'], maxTransitDurationMinutes: 1440, arrivalMode: 'air', departureMode: 'air',
      thirdCountryRequired: null, sameFlightRequired: null, onwardTicketRequired: true }] } },
    { name: 'relative-time', schema: 1, type: 'entry_form', fact: { kind: 'temporal_rule', rule: { kind: 'relative_duration',
      dueBy: { anchor: 'destination_arrival', relation: 'before', offsetMinutes: 1440, semantics: 'mandatory' } } } },
    { name: 'official-actions-excluded', schema: 1, type: 'visa', fact: { kind: 'official_actions', actions: [{
      actionSourceId: 'synthetic-primary', purpose: 'information', href: 'https://synthetic-primary.example/synthetic-rules', visaMode: null,
    }] }, supported: false },
  ]
  for (const schema of [1, 2] as const) {
    cases.push({ name: `effect-${schema}-unconditional`, schema, type: 'visa', fact: { schema, kind: 'requirement_effect', applicability: unconditional(schema), ...effectOutcome } },
      { name: `effect-${schema}-branches`, schema, type: 'visa', fact: { schema, kind: 'requirement_effect', applicability: branching(schema, effectOutcome) } },
      { name: `visa-${schema}-unconditional`, schema, type: 'visa', fact: { schema, kind: 'visa_options', options: [{ ...visaOption, applicability: unconditional(schema) }] } },
      { name: `visa-${schema}-branches`, schema, type: 'visa', fact: { schema, kind: 'visa_options', options: [{ visaMode: 'electronic_visa', applicability: branching(schema, visaOutcome) }] } })
  }
  for (const [name, outcome] of [['stay_limit', stay], ['temporal_rule', deadline]] as const) {
    cases.push({ name: `${name}-2-unconditional`, schema: 2, type: 'visa', fact: { schema: 2, kind: name, applicability: unconditional(2), outcome } },
      { name: `${name}-2-branches`, schema: 2, type: 'visa', fact: { schema: 2, kind: name, applicability: branching(2, outcome) } })
  }
  const rows = cases.map(item => {
    const context = { ...f.proposal.context, scope: { ...f.proposal.context.scope, requirementType: item.type } }
    const identity = createV3WorkIdentity({ context, method: f.binding.method, factKind: item.fact.kind, researchReason: { status: 'missing' } })
    if (!identity.ok) assert.fail(`fixture identity ${item.name}`)
    const proposal = { ...f.proposal, operationId: `op3_${sha256Hex(item.name).slice(0,32)}`, context,
      contextKey: identity.value.contextKey, research: identity.value.research, proposedFact: { schema: item.schema, fact: item.fact } }
    return { name: item.name, proposal, supported: item.supported !== false, registry: f.originals.registry,
      binding: { ...f.binding, operationId: proposal.operationId, contextKey: proposal.contextKey } }
  })
  return rows
}

/** Every object depth, including arrays: an unknown key outside any denylist. */
export function unknownMemberMutations(value: unknown) {
  const paths: Array<Array<string | number>> = []
  function visit(item: unknown, path: Array<string | number>) {
    if (Array.isArray(item)) { item.forEach((child, index) => visit(child, [...path, index])); return }
    if (item !== null && typeof item === 'object') {
      paths.push(path)
      for (const [key, child] of Object.entries(item)) visit(child, [...path, key])
    }
  }
  visit(value, [])
  return paths.map(path => {
    const copy = structuredClone(value) as Record<string, unknown>
    let target: unknown = copy
    for (const key of path) target = (target as Record<string | number, unknown>)[key]
    ;(target as Record<string, unknown>).unlistedPayload = 'PII_CANARY'
    return copy
  })
}
