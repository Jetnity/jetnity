import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { sha256Hex } from '@/lib/readiness/digest'
import { schema2DatenPruefen, type RegulierungsAusdruckV2 } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { quellenRegistryErstellen, type QuellenRegistry } from '@/lib/readiness/source-registry'
import { createV3WorkIdentity, readV3ResearchProposal, readV3GlobalRuleContext, type V3GlobalRuleContext, type V3RuleFact } from '../contract'
import { createV3SourceOnboardingTemplate, prepareV3SourceOnboardingPlan, prepareV3CustomerInformationProposal,
  V3_SOURCE_ONBOARDING_PLAN_LIMITS, type V3SourceOnboardingPlan, type V3SourceOnboardingSlot } from './source-onboarding'
import { v3CanonicalInformationTopic } from './canonical-topic'
import { CUSTOMER_DETAIL_SAMPLES, customerInformationFixture } from './test-support/fixture'

// Fictional publications and facts only. No actual country rule or source fetch.
const PRIMARY = { sourceId: 'synthetic-destination', contentItemId: 'synthetic-publication', representationId: 'synthetic-original' }
const COUNTER = { sourceId: 'synthetic-counter', contentItemId: 'synthetic-counter-publication', representationId: 'synthetic-original' }
const SOURCE_TIME = '2026-11-15T08:00:00.000Z'
const references = [{ source: PRIMARY, claimedRetrievedAt: SOURCE_TIME,
  claimedValidity: { status: 'specified' as const, validFrom: null, validUntil: null } }]

function registry(): QuellenRegistry {
  const base = quellenRegistryErstellen([
    { sourceId: PRIMARY.sourceId, sourceClass: 'official_authority', publisherName: 'Synthetic destination',
      authorityName: 'Synthetic destination', domains: ['destination.example'] },
    { sourceId: COUNTER.sourceId, sourceClass: 'official_authority', publisherName: 'Synthetic counter',
      authorityName: 'Synthetic counter', domains: ['counter.example'] },
  ])
  assert.ok(base.ok)
  const sources = [PRIMARY, COUNTER], urls = ['https://destination.example/publication', 'https://counter.example/publication']
  const graph = createContentIdentityGraph(base.registry,
    sources.map(source => ({ sourceId: source.sourceId, contentItemId: source.contentItemId, contentItemVersion: 1,
      current: true, externalIdNamespace: 'synthetic', externalContentId: source.contentItemId,
      expectedPublisherIds: [source.sourceId], expectedAuthorityIds: [source.sourceId] })),
    sources.map((source, index) => ({ ...source, contentItemVersion: 1, representationVersion: 1,
      current: true, requestUrls: [urls[index]!], expectedFinalUrl: urls[index]!, expectedMediaType: 'text/plain',
      expectedLocale: null, expectedSchema: null, identityProfileId: 'synthetic-profile', identityProfileVersion: 1 })),
    [{ identityProfileId: 'synthetic-profile', identityProfileVersion: 1, current: true,
      verify: () => ({ ok: false as const, reason: 'identity_mismatch' as const }) }])
  assert.ok(graph.ok)
  return { ...base.registry, contentIdentity: graph.value }
}
const REGISTRY = registry()
function context(requirementType: V3GlobalRuleContext['scope']['requirementType'] = 'visa', destination = 'DE', citizenship = 'CH'): V3GlobalRuleContext {
  const parsed = readV3GlobalRuleContext({ scope: { destinationCountryCode: destination, transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: [citizenship] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: citizenship, relatedCitizenshipCountryCode: citizenship },
    residence: { mode: 'not_applicable' }, requirementType, validity: { mode: 'not_applicable' } },
  route: 'direct_entry', conditions: { status: 'unconditional' } })
  assert.ok(parsed.ok); return parsed.value
}
function proposal(destination = 'DE', citizenship = 'CH', seed = 'a') {
  const ctx = context('visa', destination, citizenship)
  const identity = createV3WorkIdentity({ context: ctx, method: { methodId: 'synthetic-method', revision: 1 },
    factKind: 'requirement_effect', researchReason: { status: 'missing' } })
  assert.ok(identity.ok)
  return { schema: 3 as const, kind: 'untrusted_research_proposal' as const,
    jobId: `job3_${seed.repeat(32)}`, operationId: `op3_${seed.repeat(32)}`, context: ctx,
    contextKey: identity.value.contextKey, research: identity.value.research,
    proposedFact: { schema: 1 as const, fact: { kind: 'requirement_effect' as const, effect: 'not_required' as const, visaMode: 'visa_exempt' as const } },
    references }
}
function template(destination = 'DE', citizenships = ['CH']): V3SourceOnboardingPlan {
  const result = createV3SourceOnboardingTemplate({ destinationCountryCode: destination, citizenshipCountryCodes: citizenships })
  assert.ok(result)
  return { ...result, primary: { source: PRIMARY, representedCountryCode: destination, role: 'destination_authority' }, counterSources: [COUNTER] }
}
function withSlot(plan: V3SourceOnboardingPlan, slot: V3SourceOnboardingSlot) {
  return { ...plan, coverage: plan.coverage.map(row => row.topic === slot.topic && row.citizenshipCountryCode === slot.citizenshipCountryCode ? slot : row) }
}
function canonical(destination = 'DE', citizenship = 'CH', seed = 'a') {
  return { topic: 'visa' as const, citizenshipCountryCode: citizenship, status: 'canonical_proposals' as const, proposals: [proposal(destination, citizenship, seed)] }
}

describe('Complete customer inventory over the existing untrusted V3 intake', () => {
  test('neutral templates retain every topic for every citizenship, no passport or requirement is inferred', () => {
    const value = createV3SourceOnboardingTemplate({ destinationCountryCode: 'JP', citizenshipCountryCodes: ['GB', 'CH', 'GB'] })
    assert.ok(value)
    assert.equal(value.primary, null)
    assert.deepEqual(value.citizenshipCountryCodes, ['CH', 'GB'])
    assert.equal(value.coverage.length, 52)
    assert.ok(value.coverage.every(row => row.status === 'unavailable'))
    assert.equal(JSON.stringify(value).includes('credentialOption'), false)
    const checked = prepareV3SourceOnboardingPlan(value, REGISTRY)
    assert.ok(checked.ok)
    assert.equal(checked.publicationAuthority, 'none')
    assert.equal(checked.proposals.length, 0)
    assert.ok(checked.rows.every(row => row.status === 'unavailable'))
  })
  test('canonical source proposals preserve their original identities and use the existing reader without granting acceptance', () => {
    const input = withSlot(template(), canonical()), original = JSON.stringify(input)
    const result = prepareV3SourceOnboardingPlan(input, REGISTRY)
    assert.ok(result.ok)
    assert.equal(result.intake, 'existing_v3_only')
    assert.equal(result.proposals.length, 1)
    assert.deepEqual(result.proposals[0], proposal())
    assert.ok(readV3ResearchProposal(result.proposals[0], REGISTRY).ok)
    assert.equal(result.rows.filter(row => row.status === 'proposal_prepared').length, 1)
    assert.equal(result.rows.filter(row => row.status === 'unavailable').length, 25)
    assert.equal(JSON.stringify(input), original)
    assert.equal(Object.isFrozen(input), false)
    assert.ok(Object.isFrozen(result.value.coverage))
    assert.ok(Object.isFrozen(result.proposals[0]!.context.scope))
  })
  test('same workflow supports another destination and multiple citizenships without CH-DE or default-document assumptions', () => {
    let input = withSlot(template('JP', ['GB', 'CH']), canonical('JP', 'CH', 'a'))
    input = withSlot(input, canonical('JP', 'GB', 'b'))
    const result = prepareV3SourceOnboardingPlan(input, REGISTRY)
    assert.ok(result.ok)
    assert.equal(result.proposals.length, 2)
    assert.deepEqual(result.proposals.map(item => item.context.scope.citizenship.countryCodes[0]).sort(), ['CH', 'GB'])
    assert.ok(result.proposals.every(item => item.context.scope.destinationCountryCode === 'JP'))
  })
  test('absence of an optional counter source does not block a primary-supported proposal', () => {
    const result = prepareV3SourceOnboardingPlan({ ...withSlot(template(), canonical()), counterSources: [] }, REGISTRY)
    assert.ok(result.ok)
    assert.equal(result.proposals.length, 1)
  })
  test('a counter source cannot replace a missing destination primary', () => {
    const input = withSlot(template(), { ...canonical(), proposals: [{ ...proposal(), references: [{ ...references[0]!, source: COUNTER }] }] })
    const result = prepareV3SourceOnboardingPlan({ ...input, primary: null }, REGISTRY)
    assert.ok(result.ok)
    assert.equal(result.proposals.length, 0)
    assert.equal(result.rows.find(row => row.topic === 'visa')?.status, 'requires_primary_source')
  })
  test('known comparable conflict remains blocked even when the proposal itself parses', () => {
    const input = { ...withSlot(template(), canonical()), knownConflicts: [{ topic: 'visa', citizenshipCountryCode: 'CH', primary: PRIMARY, counter: COUNTER }] }
    const result = prepareV3SourceOnboardingPlan(input, REGISTRY)
    assert.ok(result.ok)
    assert.equal(result.proposals.length, 0)
    assert.equal(result.rows.find(row => row.topic === 'visa')?.status, 'blocked_conflict')
    assert.deepEqual(result.value.knownConflicts, input.knownConflicts)
  })
  test('a gap marked conflict is retained, not silently reset to unresearched', () => {
    const input = withSlot(template(), { topic: 'visa', citizenshipCountryCode: 'CH', status: 'unavailable', reason: 'conflict' })
    const result = prepareV3SourceOnboardingPlan(input, REGISTRY)
    assert.ok(result.ok)
    assert.equal(result.rows.find(row => row.topic === 'visa')?.status, 'blocked_conflict')
  })
  test('missing, duplicate and foreign citizenship coverage cannot hide unconfirmed topics', () => {
    const base = template()
    for (const coverage of [base.coverage.slice(1), [...base.coverage.slice(1), base.coverage[1]!],
      base.coverage.map((row, index) => index === 0 ? { ...row, citizenshipCountryCode: 'GB' } : row)]) {
      assert.deepEqual(prepareV3SourceOnboardingPlan({ ...base, coverage }, REGISTRY), { ok: false, reason: 'incomplete_coverage' })
    }
  })
  test('country, topic and original identity mismatches fail before producing a proposal', () => {
    assert.deepEqual(prepareV3SourceOnboardingPlan(withSlot(template(), { ...canonical(), proposals: [proposal('JP')] }), REGISTRY), { ok: false, reason: 'invalid_context' })
    assert.deepEqual(prepareV3SourceOnboardingPlan(withSlot(template(), { ...canonical(), topic: 'electronic_travel_authorization' }), REGISTRY), { ok: false, reason: 'topic_mismatch' })
    assert.deepEqual(prepareV3SourceOnboardingPlan(withSlot(template(), { ...canonical(), proposals: [{ ...proposal(), contextKey: `official-truth-context:v3:${'0'.repeat(64)}` }] }), REGISTRY), { ok: false, reason: 'invalid_proposal' })
  })
  test('unregistered references and a claimed foreign primary are rejected', () => {
    const base = withSlot(template(), canonical())
    assert.deepEqual(prepareV3SourceOnboardingPlan({ ...base, primary: { ...base.primary!, representedCountryCode: 'JP' } }, REGISTRY), { ok: false, reason: 'invalid_source' })
    assert.deepEqual(prepareV3SourceOnboardingPlan({ ...base, primary: { ...base.primary!, source: { ...PRIMARY, representationId: 'unknown' } } }, REGISTRY), { ok: false, reason: 'invalid_source' })
    assert.deepEqual(prepareV3SourceOnboardingPlan({ ...base, counterSources: [PRIMARY] }, REGISTRY), { ok: false, reason: 'invalid_source' })
    assert.deepEqual(prepareV3SourceOnboardingPlan(base, { sources: REGISTRY.sources, blockedDomains: [] }), { ok: false, reason: 'invalid_source' })
  })
  test('new complete details become original untrusted proposals on the ordinary intake path', () => {
    const detail = { kind: 'entry_form_details', formTitle: 'Synthetic arrival form', completion: 'required',
      cost: { status: 'specified', amount: { value: '12.50', currency: 'CHF', basis: 'per_person' } }, due: null,
      action: { source: PRIMARY, purpose: 'form', href: 'https://destination.example/publication' } }
    const bound = prepareV3CustomerInformationProposal({ jobId: 'job3_' + 'c'.repeat(32), operationId: 'op3_' + 'c'.repeat(32),
      context: { ...context('entry_form'), contextRevision: 3, informationTopic: 'entry_forms', informationItem: 'arrival_form' },
      method: { methodId: 'synthetic-method', revision: 1 }, researchReason: { status: 'missing' }, detail, references }, REGISTRY)
    assert.ok(bound.ok)
    const input = withSlot(template(), { topic: 'entry_forms', citizenshipCountryCode: 'CH', status: 'canonical_proposals', proposals: [bound.value] })
    const result = prepareV3SourceOnboardingPlan(input, REGISTRY)
    assert.ok(result.ok)
    assert.equal(result.proposals.length, 1)
    assert.equal(result.rows.find(row => row.topic === 'entry_forms')?.status, 'proposal_prepared')
    assert.deepEqual(result.proposals[0]!.proposedFact, { schema: 1, fact: { kind: 'entry_information', detail } })
    assert.equal(result.publicationAuthority, 'none')
  })
  test('ordinary official host permission cannot approve an arbitrary action path or query', () => {
    for (const href of ['https://destination.example/another', 'https://destination.example/publication?token=private', 'https://counter.example/publication']) {
      const result = prepareV3CustomerInformationProposal({ jobId: 'job3_' + 'c'.repeat(32), operationId: 'op3_' + 'c'.repeat(32),
        context: { ...context('entry_form'), contextRevision: 3, informationTopic: 'entry_forms', informationItem: 'arrival_form' },
        method: { methodId: 'synthetic-method', revision: 1 }, researchReason: { status: 'missing' },
        detail: { kind: 'entry_form_details', formTitle: 'Synthetic form', completion: 'required',
          cost: { status: 'unavailable' }, due: null, action: { source: PRIMARY, purpose: 'form', href } }, references }, REGISTRY)
      assert.equal(result.ok, false)
    }
  })
  test('multiple forms in one topic retain separate identities and a repeated context cannot hide inside another operation', () => {
    const make = (item: string, seed: string) => {
      const read = prepareV3CustomerInformationProposal({ jobId: 'job3_' + seed.repeat(32), operationId: 'op3_' + seed.repeat(32),
        context: { ...context('entry_form'), contextRevision: 3, informationTopic: 'entry_forms', informationItem: item },
        method: { methodId: 'synthetic-method', revision: 1 }, researchReason: { status: 'missing' },
        detail: { kind: 'entry_form_details', formTitle: 'Synthetic form', completion: 'required',
          cost: { status: 'unavailable' }, due: null, action: null }, references }, REGISTRY)
      assert.ok(read.ok); return read.value
    }
    const first = make('arrival_form', 'a'), second = make('departure_form', 'b')
    const input = withSlot(template(), { topic: 'entry_forms', citizenshipCountryCode: 'CH', status: 'canonical_proposals', proposals: [first, second] })
    const result = prepareV3SourceOnboardingPlan(input, REGISTRY)
    assert.ok(result.ok); assert.equal(result.proposals.length, 2)
    assert.notEqual(result.proposals[0]!.contextKey, result.proposals[1]!.contextKey)
    for (const proposals of [[first, first], [first, make('arrival_form', 'c')], Array.from({ length: 9 }, () => first)]) {
      assert.equal(prepareV3SourceOnboardingPlan(withSlot(template(), { topic: 'entry_forms', citizenshipCountryCode: 'CH',
        status: 'canonical_proposals', proposals }), REGISTRY).ok, false)
    }
  })
  test('different existing fact kinds can share a context across visa and stay topics', () => {
    const visa = proposal(), work = createV3WorkIdentity({ context: visa.context, method: { methodId: 'synthetic-method', revision: 1 },
      factKind: 'stay_limit', researchReason: { status: 'missing' } })
    assert.ok(work.ok)
    const stay = { ...visa, jobId: 'job3_' + 'd'.repeat(32), operationId: 'op3_' + 'd'.repeat(32),
      research: work.value.research, proposedFact: { schema: 1 as const, fact: { kind: 'stay_limit' as const,
        perVisit: { value: 30, unit: 'days' as const }, rollingWindow: null, initialGrant: null, extension: null, borderDiscretion: 'fixed' as const } } }
    assert.ok(readV3ResearchProposal(stay, REGISTRY).ok)
    const input = withSlot(withSlot(template(), canonical()), { topic: 'stay_limit', citizenshipCountryCode: 'CH',
      status: 'canonical_proposals', proposals: [stay] })
    const result = prepareV3SourceOnboardingPlan(input, REGISTRY)
    assert.ok(result.ok)
    assert.equal(result.proposals.length, 2)
    assert.equal(result.proposals[0]!.contextKey, result.proposals[1]!.contextKey)
    assert.notEqual(result.proposals[0]!.research.factKind, result.proposals[1]!.research.factKind)
  })
  test('no author-supplied approval, receipt, personal identifier, accessor or cycle can enter the plan', () => {
    const base = template()
    for (const extension of [{ approval: true }, { receipt: {} }, { passportNumber: 'private' }, { userId: 'private' }]) {
      assert.equal(prepareV3SourceOnboardingPlan({ ...base, ...extension }, REGISTRY).ok, false)
    }
    let called = false
    const getter = Object.defineProperty({}, 'schema', { enumerable: true, get() { called = true; return 1 } })
    assert.equal(prepareV3SourceOnboardingPlan(getter, REGISTRY).ok, false)
    assert.equal(called, false)
    const cycle: Record<string, unknown> = {}; cycle.self = cycle
    assert.equal(prepareV3SourceOnboardingPlan(cycle, REGISTRY).ok, false)
  })
})

describe('Coverage retains exact existing fact semantics', () => {
  test('visa-exempt does not fill ETA, document validity, identity card or vaccination topics', () => {
    const fact: V3RuleFact = { schema: 1, fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' } }
    assert.equal(v3CanonicalInformationTopic(context(), fact), 'visa')
    for (const requirement of ['identity_document', 'vaccination', 'health', 'entry_form', 'passport_validity', 'blank_passport_pages'] as const) {
      assert.equal(v3CanonicalInformationTopic(context(requirement), { schema: 1,
        fact: { kind: 'requirement_effect', effect: 'required', visaMode: null } }), null)
    }
  })
})

// Independent fictional full-inventory plan. No source facts are promoted: each
// candidate goes through the same canonical proposal reader as normal intake.
function fullPlan(countries = ['CH', 'GB']) {
  const f = customerInformationFixture(), root = createV3SourceOnboardingTemplate({ destinationCountryCode: 'DE', citizenshipCountryCodes: countries })
  assert.ok(root)
  const base = { ...root, primary: { source: f.proposal.references[0]!.source, representedCountryCode: 'DE', role: 'destination_authority' as const } }
  const legacy: readonly (readonly [V3GlobalRuleContext['scope']['requirementType'], V3RuleFact['fact']])[] = [
    ['visa', { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }],
    ['electronic_travel_authorization', { kind: 'requirement_effect', effect: 'not_required', visaMode: null }],
    ['visa', { kind: 'stay_limit', perVisit: { value: 30, unit: 'days' }, rollingWindow: null, initialGrant: null, extension: null, borderDiscretion: 'fixed' }],
    ['passport', { kind: 'requirement_effect', effect: 'required', visaMode: null }],
    ['passport_validity', { kind: 'passport_validity', semantics: 'minimum_remaining_from_planned_departure', duration: { value: 3, unit: 'months' } }],
    ['blank_passport_pages', { kind: 'blank_passport_pages', minimumPages: 2 }],
    ['health_document', { kind: 'requirement_effect', effect: 'required', visaMode: null }],
    ['insurance', { kind: 'requirement_effect', effect: 'required', visaMode: null }],
    ['booking_or_travel_document', { kind: 'requirement_effect', effect: 'required', visaMode: null }],
    ['transit', { kind: 'transit_conditions', paths: [{ crossesBorderControl: false, leavesTransitArea: false, transitAirportCodes: null,
      maxTransitDurationMinutes: 120, arrivalMode: 'air', departureMode: 'air', thirdCountryRequired: true, sameFlightRequired: false, onwardTicketRequired: true }] }],
  ]
  const original = f.originals.context('CH', 'DE')
  const rows = [
    ...CUSTOMER_DETAIL_SAMPLES.map((detail, index) => customerInformationFixture(detail, 'synthetic_rule', `plan-${index}`).proposal),
    ...legacy.map(([requirementType, fact]) => ({ ...f.proposal, context: { ...original, scope: { ...original.scope, requirementType } },
      proposedFact: { schema: 1 as const, fact } as V3RuleFact })),
  ]
  function bind(row: typeof rows[number], country: string, item?: string) {
    const raw = structuredClone(row.context)
    if (item !== undefined && 'informationItem' in raw) raw.informationItem = item
    const parsed = readV3GlobalRuleContext({ ...raw, scope: { ...raw.scope, citizenship: { mode: 'required', countryCodes: [country] },
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: country, relatedCitizenshipCountryCode: country } } })
    assert.ok(parsed.ok)
    const identity = createV3WorkIdentity({ context: parsed.value, method: f.method, factKind: row.proposedFact.fact.kind, researchReason: { status: 'missing' } })
    assert.ok(identity.ok)
    const seed = sha256Hex(identity.value.jobKey).slice(0, 32)
    const proposal = readV3ResearchProposal({ ...row, jobId: `job3_${seed}`, operationId: `op3_${seed}`,
      context: parsed.value, contextKey: identity.value.contextKey, research: identity.value.research }, f.originals.registry)
    assert.ok(proposal.ok); return proposal.value
  }
  function planWith(proposals: readonly ReturnType<typeof bind>[]) {
    return { ...base, coverage: base.coverage.map(slot => {
      const matches = proposals.filter(proposal => proposal.context.scope.citizenship.countryCodes[0] === slot.citizenshipCountryCode
        && v3CanonicalInformationTopic(proposal.context, proposal.proposedFact) === slot.topic)
      return matches.length ? { topic: slot.topic, citizenshipCountryCode: slot.citizenshipCountryCode,
        status: 'canonical_proposals' as const, proposals: matches } : slot
    }) }
  }
  const proposals = countries.flatMap(country => rows.map(row => bind(row, country)))
  return { f, rows, bind, planWith, proposals, plan: planWith(proposals) }
}

describe('Source-plan collection budgets preserve each original proposal boundary', () => {
  test('complete CH and CH+GB inventories retain all 27 and 54 original facts without truncation', t => {
    for (const countries of [['CH'], ['CH', 'GB']]) {
      const f = fullPlan(countries), before = JSON.stringify(f.plan), bytes = Buffer.byteLength(before)
      assert.equal(f.proposals.length, countries.length * 27)
      for (const proposal of f.proposals) assert.equal(schema2DatenPruefen(proposal), null)
      if (countries.length === 2) {
        assert.ok(bytes > 65_536)
        assert.equal(schema2DatenPruefen(f.plan), 'bound_exceeded', 'unchanged single-record checker is not an aggregate budget')
      }
      const result = prepareV3SourceOnboardingPlan(f.plan, f.f.originals.registry)
      assert.ok(result.ok)
      assert.equal(result.proposals.length, f.proposals.length)
      assert.deepEqual(result.proposals.map(proposal => proposal.operationId).sort(), f.proposals.map(proposal => proposal.operationId).sort())
      assert.equal(JSON.stringify(f.plan), before)
      assert.equal(result.publicationAuthority, 'none')
      t.diagnostic(JSON.stringify({ countries, bytes, proposals: result.proposals.length }))
    }
  })
  test('all 64 separately valid, node-heavy proposals fit; a 65th proposal or ninth same-topic proposal cannot enter', () => {
    const f = fullPlan(['CH', 'FR', 'GB', 'US'])
    const labels = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel']
    const proposals = ['CH', 'FR', 'GB', 'US'].flatMap(country => f.rows.slice(0, 2).flatMap(row => labels.map(label => {
      const detail = row.proposedFact.fact.kind === 'entry_information' ? row.proposedFact.fact.detail : null
      assert.ok(detail?.kind === 'vaccination_details')
      const expanded = { ...row, proposedFact: { schema: 1 as const, fact: { kind: 'entry_information' as const,
        detail: { ...detail, vaccines: Array.from({ length: 16 }, (_, i) => ({ ...detail.vaccines[0]!, vaccineLabel: `Synthetic vaccine ${i}` })) } } } }
      return f.bind(expanded, country, `vaccine_group_${label}`)
    })))
    const plan = f.planWith(proposals)
    let nodes = 0
    const count = (value: unknown): void => { nodes++; if (value && typeof value === 'object') Object.values(value).forEach(count) }
    count(plan); assert.ok(nodes > 8192)
    const result = prepareV3SourceOnboardingPlan(plan, f.f.originals.registry)
    assert.ok(result.ok); assert.equal(result.proposals.length, 64)
    assert.ok(Buffer.byteLength(JSON.stringify(plan)) < V3_SOURCE_ONBOARDING_PLAN_LIMITS.payloadBytes)
    assert.ok(nodes < V3_SOURCE_ONBOARDING_PLAN_LIMITS.payloadNodes)
    const extra = f.bind(f.rows[3]!, 'CH', 'arrival_form')
    assert.equal(prepareV3SourceOnboardingPlan(f.planWith([...proposals, extra]), f.f.originals.registry).ok, false)
    assert.equal(prepareV3SourceOnboardingPlan(f.planWith([...proposals.slice(0, 8), f.bind(f.rows[0]!, 'CH', 'ninth_vaccine')]), f.f.originals.registry).ok, false)
  })
  test('collection wrappers do not consume the original proposal depth limit', () => {
    const f = fullPlan(['CH'])
    let expression: RegulierungsAusdruckV2 = { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' } }
    for (let level = 0; level < 3; level++) expression = { op: level % 2 ? 'any' : 'all', operands: [expression,
      { op: 'atomic', predicate: { kind: 'age_on_travel_date', comparison: 'at_least', years: level } }] }
    const original = f.rows.find(row => row.context.scope.requirementType === 'visa'
      && row.proposedFact.fact.kind === 'requirement_effect')!
    const proposedFact: V3RuleFact = { schema: 2, fact: { schema: 2, kind: 'requirement_effect',
      applicability: { schema: 2, kind: 'branches', branches: [{ id: 'synthetic_depth',
        when: { kind: 'expression', expression }, outcome: { effect: 'not_required', visaMode: 'visa_exempt' },
        supportVersionIds: [`ev2_${'0'.repeat(32)}`] }] } } }
    const proposal = f.bind({ ...original, proposedFact }, 'CH'), plan = f.planWith([proposal])
    assert.equal(schema2DatenPruefen(proposal), null)
    assert.equal(schema2DatenPruefen(plan), 'bound_exceeded')
    assert.equal(prepareV3SourceOnboardingPlan(plan, f.f.originals.registry).ok, true)
  })
  test('an aggregate never expands a single proposal or metadata frame budget', () => {
    const f = fullPlan(['CH'])
    for (const extra of [{ padding: 'x'.repeat(65_536) }, { padding: Array(8192).fill(null) }]) {
      const bad = { ...f.proposals[0]!, ...extra }
      assert.equal(readV3ResearchProposal(bad, f.f.originals.registry).ok, false)
      assert.equal(prepareV3SourceOnboardingPlan(f.planWith([bad]), f.f.originals.registry).ok, false)
      assert.equal(prepareV3SourceOnboardingPlan({ ...f.plan, ...extra }, f.f.originals.registry).ok, false)
    }
  })
  test('partition boundaries preserve getter, sparse-array, cycle, private-field and source rejection', () => {
    const f = fullPlan(['CH', 'GB']), slot = f.plan.coverage.find(row => row.status === 'canonical_proposals')!
    assert.ok(slot.status === 'canonical_proposals')
    let called = 0
    const getter = () => { called++; throw Error('not called') }
    const rootGetter = Object.defineProperty({ ...f.plan }, 'coverage', { enumerable: true, get: getter })
    const rowGetter = Object.defineProperty({ ...slot }, 'proposals', { enumerable: true, get: getter })
    const childGetter = Object.defineProperty({}, 'schema', { enumerable: true, get: getter })
    const sparse = [slot, slot]; delete sparse[0]
    const cycle: Record<string, unknown> = {}; cycle.self = cycle
    for (const bad of [rootGetter, { ...f.plan, coverage: [rowGetter] }, { ...f.plan, coverage: sparse },
      { ...f.plan, coverage: [{ ...slot, proposals: [childGetter] }] }, { ...f.plan, extra: cycle },
      { ...f.plan, coverage: [{ ...slot, proposals: [f.plan] }] },
      { ...f.plan, passportNumber: 'PRIVATE' }, { ...f.plan, extra: new Date() }]) {
      assert.equal(prepareV3SourceOnboardingPlan(bad, f.f.originals.registry).ok, false)
    }
    assert.equal(called, 0)
    assert.equal(prepareV3SourceOnboardingPlan(f.plan, { ...f.f.originals.registry, contentIdentity: undefined }).ok, false)
    const wrongKey = { ...f.proposals[0]!, contextKey: `official-truth-context:v3:${'0'.repeat(64)}` }
    assert.equal(prepareV3SourceOnboardingPlan(f.planWith([wrongKey]), f.f.originals.registry).ok, false)
    assert.equal(prepareV3SourceOnboardingPlan({ ...f.plan, destinationCountryCode: 'JP' }, f.f.originals.registry).ok, false)
  })
})
