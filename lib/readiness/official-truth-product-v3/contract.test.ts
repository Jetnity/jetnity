import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { sha256Hex } from '@/lib/readiness/digest'
import { contentEvidenceLookupV3, createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import {
  OFFICIAL_TRUTH_V3_BINDINGS, OFFICIAL_TRUTH_V3_LIMITS,
  createV3ContextIdentity, createV3WorkIdentity, createV3TransitionIdempotencyKey,
  createV3CombinationDiscoveryIdentity, readV3CombinationDiscoveryJobRecord,
  readV3VisitorInput, readV3GlobalRuleContext, readV3ResearchProposal, readV3MethodRevisionDraft,
  readV3SourceDecisionRecord, readV3RuleVersionRecord, readV3TransitionPlan, readV3ResearchJobRecord,
  readV3ConflictArchiveRecord,
  readV3PublicProjectionRecord, readV3PublicResponseRecord,
  resolveV3PublicSourceDisplay,
  type V3ReadResult, type V3GlobalRuleContext,
  type V3CombinationDiscoveryIdentity, type V3CombinationDiscoveryJobRecord,
} from './contract'

// SYNTHETIC TEST DATA ONLY. The fictional .example publications and nine-page
// passport fact are never travel advice, a real visa statement or a runtime fallback.
const SOURCE_TIME = '2026-11-09T08:00:00.000Z'
const CHECK_TIME = '2026-11-09T08:01:00.000Z'
const ACCEPT_TIME = '2026-11-09T08:02:00.000Z'
const BUILD_TIME = '2026-11-09T08:03:00.000Z'
const CLOCK = { now: '2026-11-09T08:04:00.000Z', legalDate: '2026-11-09' }
const METHOD = { methodId: 'synthetic-method', revision: 1 }
const OPERATION = `op3_${'a'.repeat(32)}`
const JOB = `job3_${'b'.repeat(32)}`
const ref = (kind: string, seed: string) => `${kind}:v3:${sha256Hex(seed)}`
const evidenceId = (seed: string) => `ev2_${sha256Hex(seed).slice(0, 32)}`
const qualifiedSource = 'synthetic-destination'
const counterSource = 'synthetic-counter'
const registryResult = quellenRegistryErstellen([
  { sourceId: qualifiedSource, sourceClass: 'official_authority', publisherName: 'Synthetic destination only',
    authorityName: 'Synthetic authority only', domains: ['destination.example'] },
  { sourceId: counterSource, sourceClass: 'official_authority', publisherName: 'Synthetic counter only',
    authorityName: 'Synthetic counter authority only', domains: ['counter.example'] },
  { sourceId: 'synthetic-licensed', sourceClass: 'licensed_evidence_provider',
    publisherName: 'Synthetic licensed only', domains: ['licensed.example'] },
])
assert.equal(registryResult.ok, true)
if (!registryResult.ok) throw new Error('synthetic registry invalid')
const REGISTRY = registryResult.registry

function ok<T>(value: V3ReadResult<T>): T {
  if (!value.ok) assert.fail(value.reason)
  return value.value
}
function rejected(value: V3ReadResult<unknown>): void { assert.equal(value.ok, false) }

function globalContext(citizenship = 'CH'): V3GlobalRuleContext {
  return ok(readV3GlobalRuleContext({
    scope: {
      destinationCountryCode: 'DE', transitCountryCode: null,
      citizenship: { mode: 'required', countryCodes: [citizenship] },
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: citizenship,
        relatedCitizenshipCountryCode: citizenship },
      residence: { mode: 'not_applicable' }, requirementType: 'blank_passport_pages',
      validity: { mode: 'not_applicable' },
    },
    route: 'direct_entry',
    conditions: { status: 'specified', expression: { op: 'all', operands: [
      { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } },
      { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' } },
      { op: 'atomic', predicate: { kind: 'planned_stay_duration', comparison: 'at_most',
        duration: { value: 5, unit: 'days' }, counting: 'calendar_dates_inclusive' } },
    ] } },
  }))
}
function work(context = globalContext(), method = METHOD) {
  return ok(createV3WorkIdentity({ context, method, factKind: 'blank_passport_pages', researchReason: { status: 'missing' } }))
}
function sourceBinding(sourceId = qualifiedSource, representationId = 'synthetic-original') {
  return { sourceId, contentItemId: 'synthetic-publication', representationId,
    contentItemVersion: 1, representationVersion: 1, identityProfileId: 'synthetic-profile', identityProfileVersion: 1 }
}
function displayRegistry() {
  const source = sourceBinding(), url = 'https://destination.example/synthetic-test-publication'
  const graph = createContentIdentityGraph(REGISTRY, [{ sourceId: source.sourceId, contentItemId: source.contentItemId,
    contentItemVersion: 1, current: true, externalIdNamespace: 'synthetic', externalContentId: 'synthetic-publication',
    expectedPublisherIds: ['synthetic-publisher'], expectedAuthorityIds: ['synthetic-authority'] }], [{
    ...source, current: true, requestUrls: [url], expectedFinalUrl: url, expectedMediaType: 'text/plain', expectedLocale: null, expectedSchema: null,
  }], [{ identityProfileId: 'synthetic-profile', identityProfileVersion: 1, current: true,
    verify: () => ({ ok: false as const, reason: 'identity_mismatch' as const }) }])
  assert.equal(graph.ok, true)
  if (!graph.ok) throw new Error('synthetic graph invalid')
  return { ...REGISTRY, contentIdentity: graph.value }
}
function observation(context = globalContext(), sourceId = qualifiedSource, minimumPages = 9, at = SOURCE_TIME) {
  const source = sourceBinding(sourceId)
  const { sourceId: id, contentItemId, representationId } = source
  const lookup = contentEvidenceLookupV3(context.scope, { sourceId: id, contentItemId, representationId })
  assert.equal(lookup.ok, true)
  if (!lookup.ok) throw new Error('synthetic lookup invalid')
  return {
    context, contextKey: work(context).contextKey,
    fact: { schema: 1 as const, fact: { kind: 'blank_passport_pages' as const, minimumPages } },
    evidence: {
      versionId: evidenceId(`${sourceId}|${work(context).contextKey}|${minimumPages}|${at}`),
      lookupKey: lookup.value.key, source, sourceFingerprintProtocol: 1 as const,
      sourceContentHash: sha256Hex(`SYNTHETIC_ONLY_${minimumPages}`), retrievedAt: at,
      legalValidity: { status: 'specified' as const, validFrom: '2026-11-01', validUntil: '2026-12-31' },
    },
  }
}
function decision(context = globalContext()) {
  const item = observation(context)
  return {
    schema: 3 as const, kind: 'source_decision_record' as const,
    reference: ref('source-decision', `synthetic-decision-${item.contextKey}`),
    predecessor: null, method: METHOD, context, contextKey: item.contextKey,
    factKind: 'blank_passport_pages' as const, evaluatedAt: CHECK_TIME, legalAsOfDate: CLOCK.legalDate,
    primary: { status: 'clear' as const, observation: item, qualification: {
      reference: ref('destination-qualification', 'synthetic-qualified-record'), representedCountryCode: 'DE',
      role: 'destination_authority' as const, method: METHOD, evidenceVersionId: item.evidence.versionId, checkedAt: CHECK_TIME,
    } },
    counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'not_found' as const, attemptedAt: CHECK_TIME, source: null }] },
    knownConflicts: [], historyArchive: null, conclusion: 'clear_primary' as const,
  }
}
function conflictDecision() {
  const base = decision(), counter = observation(globalContext(), counterSource, 8)
  const conflictRef = ref('source-conflict', 'synthetic-conflict')
  return {
    ...base, conclusion: 'comparable_conflict' as const,
    counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'conflicts' as const, attemptedAt: CHECK_TIME,
      comparisonRef: ref('source-comparison', 'synthetic-comparison'), conflictRef, observation: counter }] },
    knownConflicts: [{ reference: conflictRef, detectedDecisionRef: base.reference, detectedAt: CHECK_TIME,
      primary: base.primary.observation, counter, resolution: null }],
  }
}
function resolvedConflict(seed: string, until = '2026-12-31') {
  const previous = conflictDecision().knownConflicts[0]
  function dated(item: ReturnType<typeof observation>, suffix: string) {
    return { ...item, evidence: { ...item.evidence, versionId: evidenceId(`archive-${seed}-${suffix}`),
      legalValidity: { ...item.evidence.legalValidity, validUntil: until } } }
  }
  const reference = ref('source-conflict', `archive-${seed}`)
  return {
    ...previous, reference, primary: dated(previous.primary, 'primary'), counter: dated(previous.counter, 'counter'),
    resolution: { reference: ref('conflict-resolution', `archive-${seed}`), predecessor: null, conflictRef: reference, method: METHOD,
      resolvedAt: '2026-11-09T09:01:00.000Z', legalAsOfDate: '2026-11-09', basis: 'corrected_publication',
      observations: [dated(observation(globalContext(), counterSource, 9, '2026-11-09T09:00:00.000Z'), 'corrected')] },
  }
}
function version(context = globalContext()) {
  const source = decision(context)
  return {
    schema: 3 as const, kind: 'rule_version_record' as const, reference: ref('rule-version', source.contextKey),
    revision: 1, predecessor: null, state: 'accepted' as const, method: METHOD,
    subject: source.primary.observation, sourceDecisionRef: source.reference, operationId: OPERATION, recordedAt: ACCEPT_TIME,
  }
}
function projection(context = globalContext()) {
  const rule = version(context)
  return {
    schema: 3 as const, kind: 'public_projection_record' as const, reference: ref('rule-projection', rule.reference),
    rule, sourceCheckedAt: SOURCE_TIME, sourceFreshUntil: '2026-11-10T08:00:00.000Z',
    builtAt: BUILD_TIME, expiresAt: '2026-11-09T08:30:00.000Z',
  }
}
function proposal(context = globalContext()) {
  const identity = work(context)
  return {
    schema: 3 as const, kind: 'untrusted_research_proposal' as const, jobId: JOB, operationId: OPERATION,
    context, contextKey: identity.contextKey, research: identity.research,
    proposedFact: observation(context).fact,
    references: [{ source: { sourceId: qualifiedSource, contentItemId: 'synthetic-publication', representationId: 'synthetic-original' },
      claimedRetrievedAt: SOURCE_TIME, claimedValidity: observation(context).evidence.legalValidity }],
  }
}
function job(context = globalContext()) {
  const identity = work(context)
  return {
    schema: 3 as const, kind: 'research_job_record' as const, jobId: JOB, operationId: OPERATION,
    jobKey: identity.jobKey, context, contextKey: identity.contextKey, research: identity.research, method: METHOD,
    revision: 1, predecessorRevision: null, state: 'queued' as const,
    createdAt: SOURCE_TIME, updatedAt: SOURCE_TIME, attempt: 0, attemptLimit: 3,
    lease: null, nextAttemptAt: null, lastFailure: null, resultDecisionRef: null,
  }
}
function discoveryIdentity(citizenshipCountryCode = 'CH', destinationCountryCode = 'DE', method = METHOD): V3CombinationDiscoveryIdentity {
  return ok(createV3CombinationDiscoveryIdentity({ destinationCountryCode, citizenshipCountryCode, method }))
}
function discoveryJob(citizenship = 'CH'): V3CombinationDiscoveryJobRecord {
  return {
    schema: 3, kind: 'combination_discovery_job_record', identity: discoveryIdentity(citizenship),
    jobId: JOB, operationId: OPERATION, revision: 1, predecessorRevision: null, state: 'queued',
    createdAt: SOURCE_TIME, updatedAt: SOURCE_TIME, attempt: 0, attemptLimit: 3,
    lease: null, nextAttemptAt: null, lastFailure: null, resultDiscoveryRef: null,
  }
}
function transition() {
  return {
    schema: 3 as const, protocolRevision: 1 as const, operationId: OPERATION, contextKey: work().contextKey,
    method: METHOD, factKind: 'blank_passport_pages' as const, action: 'accept' as const,
    expected: { revision: 0, state: 'missing' as const, versionRef: null },
    next: { revision: 1, state: 'accepted' as const, versionRef: version().reference },
    primaryEvidenceVersionId: observation().evidence.versionId, sourceDecisionRef: decision().reference,
    resolutionRefs: [], recoverFromVersionRef: null, invalidatedProjectionRefs: [],
    reproof: 'required_before_commit' as const, commitConfirmation: 'required' as const,
  }
}
function response() {
  return {
    schema: 3 as const, kind: 'conditional_rule_overview_record' as const,
    dataMode: 'synthetic_test' as const, notice: 'SYNTHETIC_TEST_DATA_NO_TRAVEL_ADVICE' as const,
    input: { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH', 'RS'] }, generatedAt: CLOCK.now,
    cells: [
      { citizenshipCountryCode: 'CH', results: [{ status: 'accepted' as const, projection: projection() }] },
      { citizenshipCountryCode: 'RS', results: [{ status: 'pending' as const, jobKey: work(globalContext('RS')).jobKey }] },
    ],
  }
}

function applicationContext(from = '2026-11-07', through = '2026-11-13') {
  return { ...globalContext(), contextRevision: 2 as const,
    conditions: { status: 'specified' as const, expression: { op: 'all' as const, operands: [
      { op: 'atomic' as const, predicate: { kind: 'document_class' as const, documentClass: 'ordinary' as const } },
      { op: 'atomic' as const, predicate: { kind: 'journey_origin' as const, place: { kind: 'country' as const, countryCode: 'CH' } } },
    ] } },
    application: { purpose: 'tourism' as const, tripStartAndEndWindow: { from, through } },
  }
}

describe('C1 strict global application carrier', () => {
  test('keeps finite inclusive windows separate from legal validity and stay duration', () => {
    for (const [from, through] of [['2026-11-07', '2026-11-13'], ['2028-02-29', '2028-02-29'], ['2027-12-31', '2028-01-02']]) {
      const input = applicationContext(from, through), parsed = ok(readV3GlobalRuleContext(input))
      assert.deepEqual(parsed, input)
      assert.ok('contextRevision' in parsed)
      assert.equal(parsed.contextRevision, 2)
      assert.deepEqual(parsed.application, { purpose: 'tourism', tripStartAndEndWindow: { from, through } })
      assert.deepEqual(parsed.scope.validity, { mode: 'not_applicable' })
      assert.ok(Object.isFrozen(parsed.application.tripStartAndEndWindow))
      assert.ok(!Object.isFrozen(input.application.tripStartAndEndWindow))
      input.application.tripStartAndEndWindow.from = '2000-01-01'
      assert.equal(parsed.application.tripStartAndEndWindow.from, from)
    }
  })
  test('selects exact closed legacy or revision2 form without fallback or field stripping', () => {
    const input = applicationContext(), legacy = globalContext()
    const cases: unknown[] = [
      { ...legacy, contextRevision: 1 }, { ...legacy, application: input.application },
      { ...legacy, contextRevision: 2 }, { ...input, contextRevision: null }, { ...input, contextRevision: '2' },
      { ...input, contextRevision: 3 }, { ...input, application: null },
      { ...input, application: {} }, { ...input, application: { ...input.application, purpose: 'visitor' } },
      { ...input, application: { ...input.application, purpose: 'business' } },
      { ...input, application: { ...input.application, tripStartAndEndWindow: null } },
      { ...input, application: { ...input.application, tripStartAndEndWindow: { from: '2026-11-07' } } },
      { ...input, application: { ...input.application, tripStartAndEndWindow: { through: '2026-11-13' } } },
      { ...input, extra: true }, { ...input, application: { ...input.application, extra: true } },
      { ...input, application: { ...input.application, tripStartAndEndWindow: { ...input.application.tripStartAndEndWindow, extra: true } } },
    ]
    for (const bad of cases) { rejected(readV3GlobalRuleContext(bad)); rejected(createV3ContextIdentity(bad)) }
    assert.deepEqual(readV3GlobalRuleContext({ ...legacy, extra: true }), { ok: false, reason: 'unexpected_fields' })
    assert.equal('contextRevision' in ok(readV3GlobalRuleContext(legacy)), false)
  })
  test('rejects impossible, reversed, missing or typed-as-nondate bounds', () => {
    for (const [from, through] of [
      ['2026-02-29', '2026-03-01'], ['2026-11-14', '2026-11-13'], ['2026-11-07', '2026-11-31'],
      ['2026-11-07T00:00:00.000Z', '2026-11-13'], ['', '2026-11-13'], ['2026-11-07', ' 2026-11-13'],
    ]) rejected(readV3GlobalRuleContext(applicationContext(from, through)))
    for (const key of ['from', 'through']) for (const bad of [null, 0, false, [], {}, undefined]) {
      const input = applicationContext()
      Object.assign(input.application.tripStartAndEndWindow, { [key]: bad })
      rejected(readV3GlobalRuleContext(input))
    }
  })
  test('preflights new subtrees before getters or private payloads can be read', () => {
    let reads = 0
    for (const key of ['application', 'tripStartAndEndWindow', 'from', 'through']) {
      const input = applicationContext()
      const target = key === 'application' ? input : key === 'tripStartAndEndWindow' ? input.application : input.application.tripStartAndEndWindow
      Object.defineProperty(target, key, { enumerable: true, get() { reads++; return 'PRIVATE_CANARY' } })
      rejected(readV3GlobalRuleContext(input)); rejected(createV3ContextIdentity(input))
    }
    assert.equal(reads, 0)
    for (const key of ['passportNumber', 'mrz', 'rawText']) {
      const input = applicationContext()
      Object.assign(input.application.tripStartAndEndWindow, { [key]: 'PRIVATE_CANARY' })
      assert.deepEqual(readV3GlobalRuleContext(input), { ok: false, reason: 'personal_data_forbidden' })
    }
    const exotic = applicationContext()
    Object.setPrototypeOf(exotic.application, { extra: true })
    rejected(readV3GlobalRuleContext(exotic))
  })
  test('all nested canonical records keep application restrictions and separate evidence validity', () => {
    const input = ok(readV3GlobalRuleContext(applicationContext())), identity = work(input)
    const p = ok(readV3ResearchProposal(proposal(input), REGISTRY)), j = ok(readV3ResearchJobRecord(job(input)))
    const d = ok(readV3SourceDecisionRecord(decision(input), REGISTRY))
    const v = ok(readV3RuleVersionRecord(version(input), REGISTRY, d))
    const projectionRead = ok(readV3PublicProjectionRecord(projection(input), REGISTRY, CLOCK))
    for (const context of [p.context, j.context, d.context, v.subject.context, projectionRead.rule.subject.context]) assert.deepEqual(context, input)
    assert.equal(d.primary.status, 'clear')
    if (d.primary.status !== 'clear') assert.fail('synthetic clear primary')
    assert.deepEqual(d.primary.observation.context, input)
    assert.deepEqual(v.subject.evidence.legalValidity, { status: 'specified', validFrom: '2026-11-01', validUntil: '2026-12-31' })
    assert.equal(identity.contextKey, j.contextKey)
    const publicResponse = { ...response(), input: { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] },
      cells: [{ citizenshipCountryCode: 'CH', results: [{ status: 'accepted', projection: projection(input) }] }] }
    const publicRead = ok(readV3PublicResponseRecord(publicResponse, REGISTRY, CLOCK))
    assert.deepEqual(publicRead.cells[0].results[0], publicResponse.cells[0].results[0])
  })
  test('changed or stripped application cannot retain old keys in any nested carrier', () => {
    const input = ok(readV3GlobalRuleContext(applicationContext()))
    const plain = { scope: input.scope, route: input.route, conditions: input.conditions }
    const changed = ok(readV3GlobalRuleContext(applicationContext('2026-11-08')))
    for (const context of [plain, changed]) {
      rejected(readV3ResearchProposal({ ...proposal(input), context }, REGISTRY))
      rejected(readV3ResearchJobRecord({ ...job(input), context }))
      rejected(readV3SourceDecisionRecord({ ...decision(input), context }, REGISTRY))
      const d = decision(input)
      rejected(readV3SourceDecisionRecord({ ...d, primary: { ...d.primary, observation: { ...d.primary.observation, context } } }, REGISTRY))
      const v = version(input)
      rejected(readV3RuleVersionRecord({ ...v, subject: { ...v.subject, context } }, REGISTRY, decision(input)))
      const p = projection(input)
      rejected(readV3PublicProjectionRecord({ ...p, rule: { ...p.rule, subject: { ...p.rule.subject, context } } }, REGISTRY, CLOCK))
    }
  })
})

describe('V3 visitor input and global context', () => {
  test('normalizes only destination and a bounded, sorted, deduplicated citizenship set', () => {
    const input = { destinationCountryCode: ' de ', citizenshipCountryCodes: ['rs', 'CH', ' ch '] }
    assert.deepEqual(ok(readV3VisitorInput(input)), { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH', 'RS'] })
    assert.deepEqual(input.citizenshipCountryCodes, ['rs', 'CH', ' ch '])
    assert.equal(Object.isFrozen(ok(readV3VisitorInput(input)).citizenshipCountryCodes), true)
  })
  test('rejects syntactically plausible noncatalog countries and empty or oversized sets', () => {
    for (const country of ['ZZ', 'XK', 'EU', 'UN', 'USA', '']) rejected(readV3VisitorInput({ destinationCountryCode: country, citizenshipCountryCodes: ['CH'] }))
    for (const citizenshipCountryCodes of [[], ['ZZ'], Array(6).fill('CH')]) {
      rejected(readV3VisitorInput({ destinationCountryCode: 'DE', citizenshipCountryCodes }))
    }
  })
  test('rejects visitor questionnaires, personal identifiers and best-pass defaults', () => {
    for (const field of ['passportNumber', 'mrz', 'photo', 'sessionId', 'userId', 'tripId', 'residence', 'travelDate', 'purpose', 'bestPassport']) {
      const result = readV3VisitorInput({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'], [field]: 'private-sentinel@example.test' })
      rejected(result)
      assert.equal(JSON.stringify(result).includes('private-sentinel'), false)
    }
  })
  test('keeps one global citizenship and explicit credential linkage per rule', () => {
    const base = globalContext()
    rejected(readV3GlobalRuleContext({ ...base, scope: { ...base.scope, citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] } } }))
    rejected(readV3GlobalRuleContext({ ...base, scope: { ...base.scope, credentialOption: { mode: 'option', documentType: 'passport',
      issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'RS' } } }))
    rejected(readV3GlobalRuleContext({ ...base, route: 'transit' }))
    rejected(readV3GlobalRuleContext({ ...base, scope: { ...base.scope, transitCountryCode: 'AT' } }))
    rejected(readV3GlobalRuleContext({ ...base, scope: { ...base.scope, validity: { mode: 'travel_date', travelDate: '2026-11-09' } } }))
  })
  test('reuses the rule scope key while binding purpose, duration, ordinary class and route separately', () => {
    const base = globalContext(), original = work(base)
    const existing = regelScopeAusEvidenceScope(base.scope)
    assert.equal(existing.ok, true)
    if (existing.ok) assert.equal(original.ruleScopeKey, existing.key)
    for (const predicate of [
      { kind: 'travel_purpose', purpose: 'work' },
      { kind: 'document_class', documentClass: 'diplomatic' },
      { kind: 'planned_stay_duration', comparison: 'at_most', duration: { value: 6, unit: 'days' }, counting: 'calendar_dates_inclusive' },
    ]) {
      const changed = ok(readV3GlobalRuleContext({ ...base, conditions: { status: 'specified', expression: { op: 'atomic', predicate } } }))
      assert.equal(work(changed).ruleScopeKey, original.ruleScopeKey)
      assert.notEqual(work(changed).contextKey, original.contextKey)
      assert.notEqual(work(changed).jobKey, original.jobKey)
    }
    assert.notEqual(work({ ...base, route: 'unresolved' }).contextKey, original.contextKey)
  })
  test('normalizes commutative existing expressions and separates method revisions', () => {
    const base = globalContext()
    assert.equal(base.conditions.status, 'specified')
    if (base.conditions.status !== 'specified' || base.conditions.expression.op !== 'all') throw new Error('test shape')
    const reversed = ok(readV3GlobalRuleContext({ ...base, conditions: { status: 'specified', expression: {
      op: 'all', operands: [...base.conditions.expression.operands].reverse(),
    } } }))
    assert.deepEqual(work(reversed), work(base))
    assert.notEqual(work(base, { ...METHOD, revision: 2 }).jobKey, work(base).jobKey)
  })
  test('rejects unknown countries and unknown keys within condition predicates', () => {
    const base = globalContext()
    for (const predicate of [{ kind: 'citizenship_includes', countryCode: 'ZZ' },
      { kind: 'document_class', documentClass: 'ordinary', trusted: true }]) {
      rejected(readV3GlobalRuleContext({ ...base, conditions: { status: 'specified', expression: { op: 'atomic', predicate } } }))
    }
  })
})

describe('V3 untrusted proposals and method authority', () => {
  test('parses the existing fact taxonomy without promoting a researcher fact', () => {
    const result = ok(readV3ResearchProposal(proposal(), REGISTRY))
    assert.equal(result.kind, 'untrusted_research_proposal')
    assert.deepEqual(result.proposedFact, proposal().proposedFact)
    assert.equal('trustedRuleFact' in result, false)
    assert.equal(Object.isFrozen(result.proposedFact.fact), true)
  })
  test('rejects all self-asserted authority, method, registry, writes and accepted claims', () => {
    for (const field of ['accepted', 'trusted', 'trustedRuleFact', 'method', 'approval', 'owner', 'registry', 'databaseRole', 'receipt', 'writePermission']) {
      rejected(readV3ResearchProposal({ ...proposal(), [field]: true }, REGISTRY))
    }
    const base = proposal()
    rejected(readV3ResearchProposal({ ...base, proposedFact: { schema: 1, fact: { ...base.proposedFact.fact, trusted: true } } }, REGISTRY))
    rejected(readV3ResearchProposal({ ...base, kind: 'accepted' }, REGISTRY))
  })
  test('rejects mismatched research identity, requirement taxonomy and unregistered references', () => {
    const base = proposal()
    rejected(readV3ResearchProposal({ ...base, research: { ...base.research, key: `research-request:v1:${'0'.repeat(64)}` } }, REGISTRY))
    rejected(readV3ResearchProposal({ ...base, contextKey: ref('official-truth-context', 'wrong') }, REGISTRY))
    rejected(readV3ResearchProposal({ ...base, proposedFact: { schema: 1, fact: { kind: 'visa_exemption', required: false } } }, REGISTRY))
    for (const sourceId of ['synthetic-licensed', 'unknown-source']) {
      rejected(readV3ResearchProposal({ ...base, references: [{ ...base.references[0], source: { ...base.references[0].source, sourceId } }] }, REGISTRY))
    }
    rejected(readV3ResearchProposal({ ...base, references: [base.references[0], base.references[0]] }, REGISTRY))
  })
  test('preserves schema-2 structured conditional facts through the canonical parser', () => {
    const base = proposal(), context = { ...base.context, scope: { ...base.context.scope, requirementType: 'other_entry_requirement' as const } }
    const identity = ok(createV3WorkIdentity({ context, method: METHOD, factKind: 'requirement_effect', researchReason: { status: 'missing' } }))
    const proposedFact = { schema: 2, fact: { schema: 2, kind: 'requirement_effect', applicability: { schema: 2, kind: 'branches', branches: [{
      id: 'synthetic_branch', when: { kind: 'expression', expression: { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } } },
      outcome: { effect: 'required', visaMode: null }, supportVersionIds: [evidenceId('synthetic-claimed-support')],
    }] } } }
    const parsed = ok(readV3ResearchProposal({ ...base, context, contextKey: identity.contextKey, research: identity.research, proposedFact }, REGISTRY))
    assert.equal(parsed.proposedFact.schema, 2)
    assert.equal('applicability' in parsed.proposedFact.fact, true)
  })
  test('keeps method operating parameters as an unapproved proposal with closed production seams', () => {
    const method = { schema: 3, method: METHOD, predecessor: null, status: 'DRAFT', createdAt: SOURCE_TIME,
      primaryPolicy: 'one_clear_qualified_destination_primary', counterCheckPolicy: 'when_available',
      conflictPolicy: 'positive_method_valid_resolution', operatingProposal: { primaryMaxAgeSeconds: 86400,
        checkIntervalSeconds: 3600, optionalAttemptLimit: 3, optionalTimeBudgetMilliseconds: 2000, attemptPlanRevision: 1 } }
    assert.equal(ok(readV3MethodRevisionDraft(method)).status, 'DRAFT')
    assert.equal(ok(readV3MethodRevisionDraft({ ...method, status: 'NOT_APPROVED' })).status, 'NOT_APPROVED')
    rejected(readV3MethodRevisionDraft({ ...method, status: 'APPROVED' }))
    rejected(readV3MethodRevisionDraft({ ...method, approved: true }))
    assert.equal(OFFICIAL_TRUTH_V3_BINDINGS.methodStatus, 'NOT_APPROVED')
    for (const [key, value] of Object.entries(OFFICIAL_TRUTH_V3_BINDINGS)) if (key !== 'methodStatus') assert.equal(value, null)
    assert.equal(requirementsProviderAus(), null)
  })
})

describe('V3 source decisions preserve the single primary rule and known conflicts', () => {
  test('one clear qualified primary succeeds with missing, unreachable or unclear optional checks', () => {
    const base = decision()
    assert.equal(ok(readV3SourceDecisionRecord(base, REGISTRY)).conclusion, 'clear_primary')
    for (const status of ['unreachable', 'unclear', 'not_applicable']) {
      assert.equal(ok(readV3SourceDecisionRecord({ ...base, counterCheck: { attemptPlanRevision: 1,
        attempts: [{ status, attemptedAt: CHECK_TIME, source: proposal().references[0].source }] } }, REGISTRY)).conclusion, 'clear_primary')
    }
  })
  test('requires a bounded attempted check without inventing evidence for an unsuccessful fetch', () => {
    const base = decision()
    rejected(readV3SourceDecisionRecord({ ...base, counterCheck: { attemptPlanRevision: 1, attempts: [] } }, REGISTRY))
    rejected(readV3SourceDecisionRecord({ ...base, counterCheck: { attemptPlanRevision: 1,
      attempts: [{ ...base.counterCheck.attempts[0], evidence: observation().evidence }] } }, REGISTRY))
    rejected(readV3SourceDecisionRecord({ ...base, counterCheck: { attemptPlanRevision: 1,
      attempts: Array(OFFICIAL_TRUTH_V3_LIMITS.crossChecks + 1).fill(base.counterCheck.attempts[0]) } }, REGISTRY))
  })
  test('host/class never substitutes for represented destination jurisdiction and method binding', () => {
    const base = decision()
    rejected(readV3SourceDecisionRecord({ ...base, primary: { ...base.primary, qualification: {
      ...base.primary.qualification, representedCountryCode: 'CH',
    } } }, REGISTRY))
    rejected(readV3SourceDecisionRecord({ ...base, primary: { ...base.primary, qualification: {
      ...base.primary.qualification, method: { ...METHOD, revision: 2 },
    } } }, REGISTRY))
    // An embassy's represented destination is explicit; .example host geography
    // is deliberately unrelated and does not infer jurisdiction.
    assert.equal(ok(readV3SourceDecisionRecord({ ...base, primary: { ...base.primary, qualification: {
      ...base.primary.qualification, role: 'destination_embassy',
    } } }, REGISTRY)).conclusion, 'clear_primary')
  })
  test('unclear mandatory source and unresolved global conditions never become clear by default', () => {
    const base = decision()
    const unclear = { ...base, primary: { status: 'unclear', reason: 'missing', evidence: null }, conclusion: 'primary_unclear' }
    assert.equal(ok(readV3SourceDecisionRecord(unclear, REGISTRY)).conclusion, 'primary_unclear')
    rejected(readV3SourceDecisionRecord({ ...unclear, conclusion: 'clear_primary' }, REGISTRY))
    const context = ok(readV3GlobalRuleContext({ ...globalContext(), conditions: { status: 'unresolved', missing: ['document_class'] } }))
    rejected(readV3SourceDecisionRecord(decision(context), REGISTRY))
    assert.equal(ok(readV3SourceDecisionRecord({ ...decision(context), conclusion: 'conditions_unresolved' }, REGISTRY)).conclusion, 'conditions_unresolved')
    const unlinked = ok(readV3GlobalRuleContext({ ...globalContext(), scope: { ...globalContext().scope,
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null } } }))
    rejected(readV3SourceDecisionRecord(decision(unlinked), REGISTRY))
  })
  test('explicit document independence remains usable without inventing a passport option', () => {
    const context = ok(readV3GlobalRuleContext({ ...globalContext(), scope: { ...globalContext().scope,
      requirementType: 'entry_form', credentialOption: { mode: 'not_applicable' } }, conditions: { status: 'unconditional' } }))
    const base = decision(context), item = { ...base.primary.observation,
      fact: { schema: 1, fact: { kind: 'requirement_effect', effect: 'required', visaMode: null } } }
    const record = { ...base, factKind: 'requirement_effect', primary: { ...base.primary, observation: item } }
    assert.equal(ok(readV3SourceDecisionRecord(record, REGISTRY)).conclusion, 'clear_primary')
    assert.deepEqual(ok(readV3SourceDecisionRecord(record, REGISTRY)).context.scope.credentialOption, { mode: 'not_applicable' })
  })
  test('a comparable conflicting statement persists despite agreement elsewhere; no majority vote', () => {
    const base = conflictDecision()
    assert.equal(ok(readV3SourceDecisionRecord(base, REGISTRY)).conclusion, 'comparable_conflict')
    rejected(readV3SourceDecisionRecord({ ...base, conclusion: 'clear_primary' }, REGISTRY))
    const agreeing = { status: 'agrees', attemptedAt: CHECK_TIME, comparisonRef: ref('source-comparison', 'synthetic-agreement'),
      observation: observation(globalContext(), counterSource, 9) }
    assert.equal(ok(readV3SourceDecisionRecord({ ...base, counterCheck: { attemptPlanRevision: 1,
      attempts: [...base.counterCheck.attempts, agreeing] } }, REGISTRY)).conclusion, 'comparable_conflict')
  })
  test('different full contexts, nonoverlapping dates and same-publication representations are not independent agreement', () => {
    const base = decision()
    const changed = ok(readV3GlobalRuleContext({ ...globalContext(), conditions: { status: 'specified', expression: {
      op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'work' },
    } } }))
    const differentContext = observation(changed, counterSource, 8)
    const nonoverlap = observation(globalContext(), counterSource, 8)
    nonoverlap.evidence.legalValidity = { status: 'specified', validFrom: '2027-01-01', validUntil: '2027-02-01' }
    const samePublication = observation()
    for (const item of [differentContext, nonoverlap, samePublication]) {
      const check = { attemptedAt: CHECK_TIME, comparisonRef: ref('source-comparison', 'synthetic-noncomparison'), observation: item }
      rejected(readV3SourceDecisionRecord({ ...base, counterCheck: { attemptPlanRevision: 1, attempts: [{ ...check, status: 'agrees' }] } }, REGISTRY))
      assert.equal(ok(readV3SourceDecisionRecord({ ...base, counterCheck: { attemptPlanRevision: 1,
        attempts: [{ ...check, status: 'not_comparable' }] } }, REGISTRY)).conclusion, 'clear_primary')
    }
  })
  test('cannot hide comparable counter-evidence as not-comparable or false agreement', () => {
    const base = decision(), other = observation(globalContext(), counterSource, 8)
    for (const status of ['not_comparable', 'agrees']) {
      rejected(readV3SourceDecisionRecord({ ...base, counterCheck: { attemptPlanRevision: 1, attempts: [{
        status, attemptedAt: CHECK_TIME, comparisonRef: ref('source-comparison', 'synthetic-false'), observation: other,
      }] } }, REGISTRY))
    }
  })
  test('a failed optional refresh cannot drop a known conflict or manufacture a resolution', () => {
    const previous = conflictDecision()
    const next = { ...previous, reference: ref('source-decision', 'synthetic-next'), predecessor: previous.reference,
      counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'unreachable', attemptedAt: CHECK_TIME, source: proposal().references[0].source }] } }
    assert.equal(ok(readV3SourceDecisionRecord(next, REGISTRY, previous)).conclusion, 'comparable_conflict')
    rejected(readV3SourceDecisionRecord(next, REGISTRY))
    rejected(readV3SourceDecisionRecord({ ...next, knownConflicts: [], conclusion: 'clear_primary' }, REGISTRY, previous))
    rejected(readV3SourceDecisionRecord({ ...next, knownConflicts: [{ ...previous.knownConflicts[0], resolution: { resolved: true } }],
      conclusion: 'clear_primary' }, REGISTRY, previous))
  })
  test('retains a positive resolution record bound to the exact conflict, method and fresh evidence', () => {
    const previous = conflictDecision(), fresh = observation(globalContext(), counterSource, 9, '2026-11-09T09:00:00.000Z')
    const resolution = { reference: ref('conflict-resolution', 'synthetic-resolution'), predecessor: null,
      conflictRef: previous.knownConflicts[0].reference, method: METHOD,
      resolvedAt: '2026-11-09T09:01:00.000Z', legalAsOfDate: CLOCK.legalDate, basis: 'corrected_publication', observations: [fresh] }
    const next = { ...decision(), reference: ref('source-decision', 'synthetic-resolved'), predecessor: previous.reference,
      evaluatedAt: '2026-11-09T09:02:00.000Z', knownConflicts: [{ ...previous.knownConflicts[0], resolution }] }
    assert.equal(ok(readV3SourceDecisionRecord(next, REGISTRY, previous)).conclusion, 'clear_primary')
    for (const changed of [{ ...resolution, method: { ...METHOD, revision: 2 } },
      { ...resolution, conflictRef: ref('source-conflict', 'unrelated') },
      { ...resolution, observations: [] }, { ...resolution, basis: 'source_unreachable' },
      { ...resolution, observations: [previous.knownConflicts[0].counter] }]) {
      rejected(readV3SourceDecisionRecord({ ...next, knownConflicts: [{ ...previous.knownConflicts[0], resolution: changed }] }, REGISTRY, previous))
    }
  })
  test('a method revision requires a new linked resolution instead of deleting or rewriting its history', () => {
    const conflict = conflictDecision(), fresh = observation(globalContext(), counterSource, 9, '2026-11-09T09:00:00.000Z')
    const resolution = { reference: ref('conflict-resolution', 'synthetic-method-one'), predecessor: null,
      conflictRef: conflict.knownConflicts[0].reference, method: METHOD,
      resolvedAt: '2026-11-09T09:01:00.000Z', legalAsOfDate: CLOCK.legalDate, basis: 'corrected_publication', observations: [fresh] }
    const previous = { ...decision(), reference: ref('source-decision', 'synthetic-method-one-resolved'),
      predecessor: conflict.reference, evaluatedAt: '2026-11-09T09:02:00.000Z', knownConflicts: [{ ...conflict.knownConflicts[0], resolution }] }
    assert.equal(readV3SourceDecisionRecord(previous, REGISTRY, conflict).ok, true)
    const method = { ...METHOD, revision: 2 }
    const nextResolution = { ...resolution, reference: ref('conflict-resolution', 'synthetic-method-two'),
      predecessor: resolution.reference, method, resolvedAt: '2026-11-09T09:03:00.000Z' }
    const next = { ...previous, reference: ref('source-decision', 'synthetic-method-two-resolved'), predecessor: previous.reference,
      method, evaluatedAt: '2026-11-09T09:04:00.000Z', primary: { ...previous.primary,
        qualification: { ...previous.primary.qualification, method } },
      knownConflicts: [{ ...conflict.knownConflicts[0], resolution: nextResolution }] }
    assert.equal(readV3SourceDecisionRecord(next, REGISTRY, previous).ok, true)
    rejected(readV3SourceDecisionRecord({ ...next, knownConflicts: [{ ...conflict.knownConflicts[0], resolution }] }, REGISTRY, previous))
    rejected(readV3SourceDecisionRecord({ ...next, knownConflicts: [{ ...conflict.knownConflicts[0],
      resolution: { ...nextResolution, predecessor: null } }] }, REGISTRY, previous))
  })
  test('binds evidence lookup, support IDs, requirement kind and provenance tuple', () => {
    const base = decision(), item = base.primary.observation
    rejected(readV3SourceDecisionRecord({ ...base, primary: { ...base.primary, observation: { ...item,
      evidence: { ...item.evidence, lookupKey: `evidence-key:v3:${'f'.repeat(64)}` } } } }, REGISTRY))
    rejected(readV3SourceDecisionRecord({ ...base, primary: { ...base.primary, qualification: {
      ...base.primary.qualification, evidenceVersionId: evidenceId('unrelated') } } }, REGISTRY))
    rejected(readV3SourceDecisionRecord({ ...base, factKind: 'visa_options' }, REGISTRY))
    const withForgedSupport = ok(readV3GlobalRuleContext({ ...globalContext(), conditions: { status: 'specified', expression: {
      op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' }, supportVersionIds: [evidenceId('forged-support')],
    } } }))
    rejected(readV3SourceDecisionRecord(decision(withForgedSupport), REGISTRY))
    const conflict = conflictDecision()
    const collision = { ...conflict.counterCheck.attempts[0].observation,
      evidence: { ...conflict.counterCheck.attempts[0].observation.evidence, versionId: item.evidence.versionId } }
    rejected(readV3SourceDecisionRecord({ ...conflict,
      counterCheck: { ...conflict.counterCheck, attempts: [{ ...conflict.counterCheck.attempts[0], observation: collision }] },
      knownConflicts: [{ ...conflict.knownConflicts[0], counter: collision }],
    }, REGISTRY))
  })
})

describe('V3 time, versions, CAS and recovery plans', () => {
  test('rejects impossible calendar days and malformed UTC timestamps instead of Date.parse normalization', () => {
    const base = decision()
    for (const invalidDate of ['2026-02-29', '2026-04-31', '2026-13-01', '0000-01-01', '2026-11-09T00:00:00.000Z']) {
      rejected(readV3SourceDecisionRecord({ ...base, legalAsOfDate: invalidDate }, REGISTRY))
    }
    for (const invalidTimestamp of ['2026-02-30T08:01:00.000Z', '2026-11-09T24:00:00.000Z',
      '2026-11-09T08:01:60.000Z', '2026-11-09T09:01:00.000+01:00', '2026-11-09T08:01:00Z', '2026-11-09']) {
      rejected(readV3SourceDecisionRecord({ ...base, evaluatedAt: invalidTimestamp }, REGISTRY))
    }
    const leap = proposal()
    leap.references[0].claimedValidity = { status: 'specified', validFrom: '2028-02-29', validUntil: '2028-02-29' }
    assert.equal(readV3ResearchProposal(leap, REGISTRY).ok, true)
  })
  test('rejects reversed, expired and unknown primary validity and future observations', () => {
    const base = decision(), item = base.primary.observation
    for (const legalValidity of [
      { status: 'specified', validFrom: '2026-12-01', validUntil: '2026-11-01' },
      { status: 'specified', validFrom: null, validUntil: '2026-11-08' }, { status: 'unresolved' },
    ]) rejected(readV3SourceDecisionRecord({ ...base, primary: { ...base.primary, observation: { ...item,
      evidence: { ...item.evidence, legalValidity } } } }, REGISTRY))
    rejected(readV3SourceDecisionRecord({ ...base, primary: { ...base.primary, observation: { ...item,
      evidence: { ...item.evidence, retrievedAt: '2026-11-09T08:02:00.000Z' } } } }, REGISTRY))
  })
  test('requires matching clear source decisions for accepted version records', () => {
    assert.equal(ok(readV3RuleVersionRecord(version(), REGISTRY, decision())).state, 'accepted')
    rejected(readV3RuleVersionRecord(version(), REGISTRY, { ...decision(), reference: ref('source-decision', 'other') }))
    rejected(readV3RuleVersionRecord(version(), REGISTRY, conflictDecision()))
    rejected(readV3RuleVersionRecord({ ...version(), subject: observation(globalContext(), qualifiedSource, 8) }, REGISTRY, decision()))
    rejected(readV3RuleVersionRecord({ ...version(), predecessor: version().reference, revision: 2 }, REGISTRY, decision()))
  })
  test('binds operation idempotency to all relevant context, method, primary and decision references', () => {
    const base = transition(), key = ok(createV3TransitionIdempotencyKey(base))
    assert.equal(ok(createV3TransitionIdempotencyKey(structuredClone(base))), key)
    for (const changed of [
      { ...base, operationId: `op3_${'c'.repeat(32)}` },
      { ...base, method: { ...METHOD, revision: 2 } },
      { ...base, primaryEvidenceVersionId: evidenceId('new-primary') },
      { ...base, sourceDecisionRef: ref('source-decision', 'new-counterdecision') },
      { ...base, contextKey: work(globalContext('RS')).contextKey },
    ]) assert.notEqual(ok(createV3TransitionIdempotencyKey(changed)), key)
  })
  test('requires predecessor CAS, fresh versions and explicit reaccept rather than overwriting a blocked state', () => {
    const base = transition()
    assert.equal(readV3TransitionPlan(base).ok, true)
    rejected(readV3TransitionPlan({ ...base, next: { ...base.next, revision: 3 } }))
    const expected = { state: 'conflicted', revision: 2, versionRef: ref('rule-version', 'old-conflicted') }
    const next = { state: 'accepted', revision: 3, versionRef: ref('rule-version', 'fresh-reaccepted') }
    rejected(readV3TransitionPlan({ ...base, expected, next }))
    rejected(readV3TransitionPlan({ ...base, action: 'reaccept', expected, next }))
    assert.equal(readV3TransitionPlan({ ...base, action: 'reaccept', expected, next,
      resolutionRefs: [ref('conflict-resolution', 'positive-record')] }).ok, true)
    rejected(readV3TransitionPlan({ ...base, action: 'reaccept', expected, next: { ...next, versionRef: expected.versionRef },
      resolutionRefs: [ref('conflict-resolution', 'positive-record')] }))
  })
  test('recovery revalidates into a new version; historical identities are never reactivated in place', () => {
    const base = transition(), historical = ref('rule-version', 'historical')
    const recovery = { ...base, action: 'recover', expected: { state: 'withdrawn', revision: 3, versionRef: ref('rule-version', 'withdrawn') },
      next: { state: 'accepted', revision: 4, versionRef: ref('rule-version', 'fresh-recovery') }, recoverFromVersionRef: historical }
    assert.equal(readV3TransitionPlan(recovery).ok, true)
    rejected(readV3TransitionPlan({ ...recovery, recoverFromVersionRef: null }))
    rejected(readV3TransitionPlan({ ...recovery, next: { ...recovery.next, versionRef: historical } }))
    rejected(readV3TransitionPlan({ ...recovery, reproof: 'skip' }))
    rejected(readV3TransitionPlan({ ...recovery, commitConfirmation: 'assumed_from_timeout' }))
  })
})

describe('R2 historical resolution, bounded archive and compatible statements', () => {
  test('historical resolution remains valid on its own date while the new mandatory primary is current', () => {
    const historical = resolvedConflict('historical', '2026-11-09')
    const previous = { ...decision(), evaluatedAt: '2026-11-09T09:02:00.000Z', knownConflicts: [historical] }
    assert.equal(readV3SourceDecisionRecord(previous, REGISTRY).ok, true)
    const fresh = observation(globalContext(), qualifiedSource, 9, '2026-11-10T08:00:00.000Z')
    const next = { ...previous, reference: ref('source-decision', 'historical-next-day'), predecessor: previous.reference,
      legalAsOfDate: '2026-11-10', evaluatedAt: '2026-11-10T08:01:00.000Z', primary: { ...previous.primary, observation: fresh,
        qualification: { ...previous.primary.qualification, evidenceVersionId: fresh.evidence.versionId, checkedAt: '2026-11-10T08:01:00.000Z' } } }
    assert.equal(ok(readV3SourceDecisionRecord(next, REGISTRY, previous)).conclusion, 'clear_primary')
    rejected(readV3SourceDecisionRecord({ ...next, knownConflicts: [] }, REGISTRY, previous))
    rejected(readV3SourceDecisionRecord({ ...next, knownConflicts: [{ ...historical,
      resolution: { ...historical.resolution, legalAsOfDate: '2026-11-10' } }] }, REGISTRY, previous))
  })
  test('a bounded archive append carries exact resolved records beyond eight lifetime conflicts', () => {
    const seed = { ...decision(), evaluatedAt: '2026-11-09T09:02:00.000Z',
      knownConflicts: Array.from({ length: 8 }, (_, index) => resolvedConflict(`seed-${index}`)) }
    let previous = ok(readV3SourceDecisionRecord(seed, REGISTRY))
    for (let index = 0; index < 10; index++) {
      const evaluatedAt = new Date(Date.parse('2026-11-09T09:02:00.000Z') + (index + 1) * 60_000).toISOString()
      const archive = { schema: 3, kind: 'resolved_conflict_archive_record',
        head: { reference: ref('conflict-archive', `page-${index}`), revision: index + 1, totalConflicts: index + 1 },
        predecessor: previous.historyArchive, contextKey: previous.contextKey, factKind: previous.factKind,
        fromDecisionRef: previous.reference, archivedAt: evaluatedAt, entries: [previous.knownConflicts[0]] }
      const next = { ...previous, reference: ref('source-decision', `archive-next-${index}`), predecessor: previous.reference,
        evaluatedAt, historyArchive: archive.head, knownConflicts: [...previous.knownConflicts.slice(1), resolvedConflict(`new-${index}`)] }
      assert.equal(readV3ConflictArchiveRecord(archive, REGISTRY).ok, true)
      rejected(readV3SourceDecisionRecord(next, REGISTRY, previous))
      previous = ok(readV3SourceDecisionRecord(next, REGISTRY, previous, archive))
      assert.equal(previous.knownConflicts.length, 8)
    }
    assert.equal(previous.historyArchive?.totalConflicts, 10)
    assert.equal(previous.historyArchive?.revision, 10)
  })
  test('archive append cannot erase an unresolved conflict, forge counts, sever history or replace archived bytes', () => {
    const prior = { ...decision(), evaluatedAt: '2026-11-09T09:02:00.000Z', knownConflicts: [resolvedConflict('one')] }
    const archive = { schema: 3, kind: 'resolved_conflict_archive_record',
      head: { reference: ref('conflict-archive', 'one'), revision: 1, totalConflicts: 1 }, predecessor: null,
      contextKey: prior.contextKey, factKind: prior.factKind, fromDecisionRef: prior.reference,
      archivedAt: '2026-11-09T09:03:00.000Z', entries: prior.knownConflicts }
    const next = { ...prior, reference: ref('source-decision', 'archived-one'), predecessor: prior.reference,
      evaluatedAt: archive.archivedAt, knownConflicts: [], historyArchive: archive.head }
    assert.equal(readV3SourceDecisionRecord(next, REGISTRY, prior, archive).ok, true)
    for (const changed of [
      { ...archive, head: { ...archive.head, totalConflicts: 2 } },
      { ...archive, fromDecisionRef: ref('source-decision', 'wrong') },
      { ...archive, predecessor: { reference: ref('conflict-archive', 'invented'), revision: 1, totalConflicts: 1 } },
      { ...archive, entries: [{ ...archive.entries[0], detectedDecisionRef: ref('source-decision', 'rewritten') }] },
      { ...archive, entries: [{ ...archive.entries[0], resolution: null }] },
    ]) rejected(readV3SourceDecisionRecord(next, REGISTRY, prior, changed))
    rejected(readV3ConflictArchiveRecord({ ...archive, entries: Array(9).fill(archive.entries[0]) }, REGISTRY))
    const unresolved = { ...prior, knownConflicts: [{ ...prior.knownConflicts[0], resolution: null }], conclusion: 'comparable_conflict' }
    assert.equal(readV3SourceDecisionRecord(unresolved, REGISTRY).ok, true)
    rejected(readV3SourceDecisionRecord(next, REGISTRY, unresolved, archive))
    rejected(readV3SourceDecisionRecord({ ...next, predecessor: null }, REGISTRY, null, archive))
  })
  test('the same unconditional effect agrees across canonical legacy, explicit schema-1 and schema-2 encodings', () => {
    const context = ok(readV3GlobalRuleContext({ ...globalContext(), scope: { ...globalContext().scope, requirementType: 'entry_form' } }))
    const base = decision(context), primary = { ...base.primary.observation,
      fact: { schema: 1, fact: { kind: 'requirement_effect', effect: 'required', visaMode: null } } }
    for (const schema of [1, 2]) {
      const counter = { ...observation(context, counterSource), fact: { schema, fact: {
        schema, kind: 'requirement_effect', applicability: { schema, kind: 'unconditional' }, effect: 'required', visaMode: null,
      } } }
      const check = { attemptedAt: CHECK_TIME, comparisonRef: ref('source-comparison', `schema-${schema}`), observation: counter }
      const record = { ...base, factKind: 'requirement_effect', primary: { ...base.primary, observation: primary },
        counterCheck: { attemptPlanRevision: 1, attempts: [{ ...check, status: 'agrees' }] } }
      assert.equal(ok(readV3SourceDecisionRecord(record, REGISTRY)).conclusion, 'clear_primary')
      const conflictRef = ref('source-conflict', `false-schema-${schema}`)
      rejected(readV3SourceDecisionRecord({ ...record, conclusion: 'comparable_conflict',
        counterCheck: { attemptPlanRevision: 1, attempts: [{ ...check, status: 'conflicts', conflictRef }] },
        knownConflicts: [{ reference: conflictRef, detectedDecisionRef: record.reference, detectedAt: CHECK_TIME,
          primary, counter, resolution: null }],
      }, REGISTRY))
    }
  })
  test('nonexclusive optional visa additions have a method-bound compatible record without a false conflict', () => {
    // Fictional .example observation of a synthetic rule, never real visa advice.
    const context = ok(readV3GlobalRuleContext({ ...globalContext(), scope: { ...globalContext().scope, requirementType: 'visa' } }))
    const base = decision(context), electronic = { visaMode: 'electronic_visa', eligibility: 'allowed', mandate: 'not_mandatory' }
    const primary = { ...base.primary.observation, fact: { schema: 1, fact: { kind: 'visa_options', options: [electronic] } } }
    const counter = { ...observation(context, counterSource), fact: { schema: 1, fact: { kind: 'visa_options', options: [
      electronic, { visaMode: 'visa_on_arrival', eligibility: 'allowed', mandate: 'not_mandatory' },
    ] } } }
    const check = { status: 'compatible', attemptedAt: CHECK_TIME, comparisonRef: ref('source-comparison', 'optional-visa'),
      method: METHOD, reproof: 'required_before_acceptance', observation: counter }
    const record = { ...base, factKind: 'visa_options', primary: { ...base.primary, observation: primary },
      counterCheck: { attemptPlanRevision: 1, attempts: [check] } }
    assert.equal(ok(readV3SourceDecisionRecord(record, REGISTRY)).conclusion, 'clear_primary')
    rejected(readV3SourceDecisionRecord({ ...record, counterCheck: { attemptPlanRevision: 1,
      attempts: [{ ...check, method: { ...METHOD, revision: 2 } }] } }, REGISTRY))
    rejected(readV3SourceDecisionRecord({ ...record, counterCheck: { attemptPlanRevision: 1,
      attempts: [{ ...check, reproof: 'already_trusted' }] } }, REGISTRY))
    const conflictRef = ref('source-conflict', 'false-visa-conflict')
    rejected(readV3SourceDecisionRecord({ ...record, conclusion: 'comparable_conflict', counterCheck: { attemptPlanRevision: 1, attempts: [{
      status: 'conflicts', attemptedAt: CHECK_TIME, comparisonRef: check.comparisonRef, conflictRef, observation: counter,
    }] }, knownConflicts: [{ reference: conflictRef, detectedDecisionRef: record.reference, detectedAt: CHECK_TIME, primary, counter, resolution: null }] }, REGISTRY))
    const opposing = { ...counter, fact: { schema: 1, fact: { kind: 'visa_options', options: [{ ...electronic, eligibility: 'not_allowed' }] } } }
    rejected(readV3SourceDecisionRecord({ ...record, counterCheck: { attemptPlanRevision: 1, attempts: [{ ...check, observation: opposing }] } }, REGISTRY))
  })
  test('a true required-versus-not-required statement cannot be relabeled compatible', () => {
    const context = ok(readV3GlobalRuleContext({ ...globalContext(), scope: { ...globalContext().scope, requirementType: 'entry_form' } }))
    const base = decision(context), primary = { ...base.primary.observation,
      fact: { schema: 1, fact: { kind: 'requirement_effect', effect: 'required', visaMode: null } } }
    const counter = { ...observation(context, counterSource), fact: { schema: 1,
      fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: null } } }
    rejected(readV3SourceDecisionRecord({ ...base, factKind: 'requirement_effect', primary: { ...base.primary, observation: primary },
      counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'compatible', attemptedAt: CHECK_TIME,
        comparisonRef: ref('source-comparison', 'false-compatible'), method: METHOD, reproof: 'required_before_acceptance', observation: counter }] },
    }, REGISTRY))
  })
})

describe('V3 bounded research jobs', () => {
  test('deduplicates normalized context/fact/method independently of requester and recheck reason', () => {
    const base = job()
    assert.equal(ok(readV3ResearchJobRecord(base)).state, 'queued')
    const recheck = ok(createV3WorkIdentity({ context: globalContext(), method: METHOD,
      factKind: 'blank_passport_pages', researchReason: { status: 'recheck_needed', reason: 'max_age_exceeded' } }))
    assert.equal(recheck.jobKey, base.jobKey)
    assert.notEqual(recheck.research.key, base.research.key)
    assert.equal(readV3ResearchJobRecord({ ...base, research: recheck.research }).ok, true)
    rejected(readV3ResearchJobRecord({ ...base, jobKey: work(globalContext('RS')).jobKey }))
    rejected(readV3ResearchJobRecord({ ...base, sessionId: 'not-a-job-partition' }))
  })
  test('binds bounded leases to revision/generation and leaves expired leases readable for reclaim', () => {
    const base = job(), lease = { leaseId: `lease3_${'d'.repeat(32)}`, generation: 2,
      acquiredAt: CHECK_TIME, expiresAt: '2026-11-09T08:06:00.000Z' }
    const leased = { ...base, state: 'leased', revision: 2, predecessorRevision: 1,
      attempt: 1, updatedAt: CHECK_TIME, lease }
    assert.equal(readV3ResearchJobRecord(leased).ok, true)
    // There is no implicit Date.now() and no acquisition side effect. M1 can read
    // this same historical lease after 08:06 and perform a separate fenced CAS.
    assert.equal(ok(readV3ResearchJobRecord(leased)).lease?.generation, 2)
    for (const changed of [{ ...lease, generation: 3 }, { ...lease, expiresAt: CHECK_TIME },
      { ...lease, expiresAt: '2026-11-09T09:00:00.000Z' }]) rejected(readV3ResearchJobRecord({ ...leased, lease: changed }))
    rejected(readV3ResearchJobRecord({ ...leased, predecessorRevision: 2 }))
    rejected(readV3ResearchJobRecord({ ...leased, attempt: 0 }))
  })
  test('requires bounded backoff, exhausted attempts and explicit completion references', () => {
    const base = job(), backoff = { ...base, state: 'backoff', revision: 3, predecessorRevision: 2,
      attempt: 1, updatedAt: CHECK_TIME, lastFailure: 'unreachable', nextAttemptAt: '2026-11-09T08:10:00.000Z' }
    assert.equal(readV3ResearchJobRecord(backoff).ok, true)
    rejected(readV3ResearchJobRecord({ ...backoff, nextAttemptAt: SOURCE_TIME }))
    rejected(readV3ResearchJobRecord({ ...backoff, attempt: 3 }))
    rejected(readV3ResearchJobRecord({ ...base, state: 'succeeded', attempt: 1 }))
    assert.equal(readV3ResearchJobRecord({ ...base, state: 'succeeded', attempt: 1, resultDecisionRef: decision().reference }).ok, true)
    assert.equal(readV3ResearchJobRecord({ ...base, state: 'exhausted', attempt: 3, lastFailure: 'commit_unconfirmed' }).ok, true)
    rejected(readV3ResearchJobRecord({ ...base, state: 'exhausted', attempt: 2, lastFailure: 'unreachable' }))
  })
})

describe('V3 neutral combination discovery', () => {
  const pending = (identity = discoveryIdentity('RS')) => ({
    status: 'pending' as const, jobKind: 'combination_discovery' as const, jobKey: identity.jobKey, identity,
  })
  const withPending = (item: unknown) => ({ ...response(), cells: [
    response().cells[0], { citizenshipCountryCode: 'RS', results: [item] },
  ] })

  test('represents an unknown pair without inferred rule, route, document or purpose', () => {
    const input = { destinationCountryCode: ' de ', citizenshipCountryCode: ' ch ', method: { ...METHOD } }
    const identity = ok(createV3CombinationDiscoveryIdentity(input))
    assert.deepEqual(Object.keys(identity).sort(), ['citizenshipCountryCode', 'destinationCountryCode', 'jobKey', 'kind', 'method'])
    assert.equal(identity.kind, 'combination_discovery')
    assert.equal(identity.destinationCountryCode, 'DE')
    assert.equal(identity.citizenshipCountryCode, 'CH')
    assert.deepEqual(identity, discoveryIdentity())
    assert.equal(Object.isFrozen(identity.method), true)
    input.method.revision = 2
    assert.equal(identity.method.revision, 1)
    assert.equal(input.destinationCountryCode, ' de ')
    const parsed = ok(readV3CombinationDiscoveryJobRecord(discoveryJob()))
    assert.equal(parsed.state, 'queued')
    for (const key of ['context', 'contextKey', 'research', 'factKind', 'route', 'credentialOption', 'conditions']) {
      assert.equal(Object.hasOwn(parsed, key), false)
      assert.equal(Object.hasOwn(parsed.identity, key), false)
    }
  })
  test('deduplicates canonical pair and method independently of job and operation IDs', () => {
    const base = discoveryJob()
    const repeated = ok(readV3CombinationDiscoveryJobRecord({ ...base,
      jobId: `job3_${'c'.repeat(32)}`, operationId: `op3_${'d'.repeat(32)}` }))
    assert.equal(repeated.identity.jobKey, base.identity.jobKey)
    for (const other of [discoveryIdentity('RS'), discoveryIdentity('CH', 'FR'),
      discoveryIdentity('CH', 'DE', { ...METHOD, revision: 2 }),
      discoveryIdentity('CH', 'DE', { ...METHOD, methodId: 'other-synthetic-method' })]) {
      assert.notEqual(other.jobKey, base.identity.jobKey)
    }
    assert.notEqual(base.identity.jobKey, work().jobKey)
    assert.match(base.identity.jobKey, /^combination-discovery-job:v3:[a-f0-9]{64}$/)
  })
  test('rejects noncatalog countries, multiple citizenships and invalid method revisions', () => {
    for (const country of ['ZZ', 'XK', 'EU', 'USA', '', 'DE'.repeat(5)]) {
      rejected(createV3CombinationDiscoveryIdentity({ destinationCountryCode: country, citizenshipCountryCode: 'CH', method: METHOD }))
      rejected(createV3CombinationDiscoveryIdentity({ destinationCountryCode: 'DE', citizenshipCountryCode: country, method: METHOD }))
    }
    rejected(createV3CombinationDiscoveryIdentity({ destinationCountryCode: 'DE', citizenshipCountryCode: ['CH', 'RS'], method: METHOD }))
    rejected(createV3CombinationDiscoveryIdentity({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'], method: METHOD }))
    for (const revision of [0, -1, 1.5, 2_147_483_648]) {
      rejected(createV3CombinationDiscoveryIdentity({ destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: { ...METHOD, revision } }))
    }
    rejected(createV3CombinationDiscoveryIdentity({ destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: null }))
  })
  test('rejects private data, legal defaults, URLs, raw payloads and authority claims at every new boundary', () => {
    const input = { destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: METHOD }
    for (const extra of [{ passportNumber: 'private-sentinel' }, { rawText: 'private-sentinel' },
      { url: 'https://destination.example/private-sentinel' }, { context: globalContext() },
      { route: 'direct_entry' }, { credentialOption: { mode: 'not_applicable' } },
      { purpose: 'visitor' }, { factKind: 'blank_passport_pages' }, { accepted: true }, { approved: true }]) {
      rejected(createV3CombinationDiscoveryIdentity({ ...input, ...extra }))
      rejected(readV3CombinationDiscoveryJobRecord({ ...discoveryJob(), ...extra }))
      rejected(readV3CombinationDiscoveryJobRecord({ ...discoveryJob(), identity: { ...discoveryIdentity(), ...extra } }))
      rejected(readV3PublicResponseRecord(withPending({ ...pending(), ...extra }), REGISTRY, CLOCK))
    }
    rejected(readV3CombinationDiscoveryJobRecord({ ...discoveryJob(), state: 'accepted' }))
    rejected(createV3CombinationDiscoveryIdentity({ ...input, method: { ...METHOD, approved: true } }))
  })
  test('binds the exact discovery discriminator and key and rejects rule jobs in both directions', () => {
    const base = discoveryJob()
    for (const changed of [{ ...base.identity, destinationCountryCode: 'FR' },
      { ...base.identity, citizenshipCountryCode: 'RS' }, { ...base.identity, method: { ...METHOD, revision: 2 } },
      { ...base.identity, jobKey: work().jobKey }, { ...base.identity, jobKey: ref('combination-discovery-job', 'wrong-pair') },
      { ...base.identity, kind: 'rule_research' }]) {
      rejected(readV3CombinationDiscoveryJobRecord({ ...base, identity: changed }))
    }
    rejected(readV3CombinationDiscoveryJobRecord(job()))
    rejected(readV3ResearchJobRecord(base))
    rejected(readV3CombinationDiscoveryJobRecord({ ...job(), kind: 'combination_discovery_job_record', identity: base.identity }))
    rejected(readV3ResearchJobRecord({ ...base, kind: 'research_job_record', jobKey: work().jobKey }))
    rejected(readV3CombinationDiscoveryJobRecord({ ...base, resultDecisionRef: null }))
  })
  test('reuses bounded revision, lease and generation rules without acquiring or expiring historical leases', () => {
    const lease = { leaseId: `lease3_${'e'.repeat(32)}`, generation: 2,
      acquiredAt: CHECK_TIME, expiresAt: '2026-11-09T08:06:00.000Z' }
    const leased = { ...discoveryJob(), state: 'leased', revision: 2, predecessorRevision: 1,
      attempt: 1, updatedAt: CHECK_TIME, lease }
    assert.equal(ok(readV3CombinationDiscoveryJobRecord(leased)).lease?.generation, 2)
    // Historical data remains readable after expiry; reclaim requires a separate fenced CAS.
    assert.deepEqual(ok(readV3CombinationDiscoveryJobRecord(leased)).lease, lease)
    for (const change of [{ lease: { ...lease, generation: 3 } }, { lease: { ...lease, expiresAt: CHECK_TIME } },
      { lease: { ...lease, expiresAt: '2026-11-09T09:00:00.000Z' } }, { lease: null },
      { predecessorRevision: 2 }, { revision: 1 }, { attempt: 0 }, { state: 'queued' }]) {
      rejected(readV3CombinationDiscoveryJobRecord({ ...leased, ...change }))
    }
    rejected(readV3CombinationDiscoveryJobRecord({ ...discoveryJob(), createdAt: '2026-02-30T08:00:00.000Z' }))
  })
  test('requires bounded backoff and completion reference without promoting discovery to acceptance', () => {
    const base = discoveryJob(), backoff = { ...base, state: 'backoff', revision: 3, predecessorRevision: 2,
      attempt: 1, updatedAt: CHECK_TIME, lastFailure: 'unreachable', nextAttemptAt: '2026-11-09T08:10:00.000Z' }
    assert.equal(readV3CombinationDiscoveryJobRecord(backoff).ok, true)
    for (const change of [{ nextAttemptAt: SOURCE_TIME }, { nextAttemptAt: null }, { lastFailure: null },
      { attempt: 0 }, { attempt: 3 }, { attemptLimit: 17 }]) {
      rejected(readV3CombinationDiscoveryJobRecord({ ...backoff, ...change }))
    }
    assert.equal(readV3CombinationDiscoveryJobRecord({ ...base, state: 'exhausted', attempt: 3, lastFailure: 'unreachable' }).ok, true)
    rejected(readV3CombinationDiscoveryJobRecord({ ...base, state: 'exhausted', attempt: 2, lastFailure: 'unreachable' }))
    const completed = { ...base, state: 'succeeded', attempt: 1,
      resultDiscoveryRef: ref('combination-discovery-result', 'synthetic-discovery-result') }
    assert.equal(readV3CombinationDiscoveryJobRecord(completed).ok, true)
    rejected(readV3CombinationDiscoveryJobRecord({ ...completed, resultDiscoveryRef: null }))
    rejected(readV3CombinationDiscoveryJobRecord({ ...completed, resultDiscoveryRef: decision().reference }))
    rejected(readV3CombinationDiscoveryJobRecord({ ...completed, state: 'queued' }))
    rejected(readV3PublicProjectionRecord(completed, REGISTRY, CLOCK))
    rejected(readV3PublicResponseRecord(withPending({ status: 'accepted', projection: completed }), REGISTRY, CLOCK))
  })
  test('applies bounded JSON preflight and sanitized failures before field access', () => {
    let accessed = false
    const getter = Object.defineProperty({}, 'destinationCountryCode', { enumerable: true, get: () => { accessed = true; return 'DE' } })
    rejected(createV3CombinationDiscoveryIdentity(getter))
    assert.equal(accessed, false)
    const cyclic: Record<string, unknown> = { ...discoveryJob() }
    cyclic.identity = cyclic
    rejected(readV3CombinationDiscoveryJobRecord(cyclic))
    const huge = readV3CombinationDiscoveryJobRecord({ ...discoveryJob(), extra: 'private-sentinel'.repeat(70_000) })
    assert.deepEqual(huge, { ok: false, reason: 'bound_exceeded' })
    assert.equal(JSON.stringify(huge).includes('private-sentinel'), false)
    rejected(readV3CombinationDiscoveryJobRecord({ ...discoveryJob(), identity: { ...discoveryIdentity(), sessionId: 'private-sentinel' } }))
  })
  test('keeps existing rule pending and adds explicitly discriminated discovery pending per citizenship', () => {
    assert.equal(readV3PublicResponseRecord(response(), REGISTRY, CLOCK).ok, true)
    assert.equal(readV3PublicResponseRecord(withPending({ status: 'pending', jobKind: 'rule_research',
      jobKey: work(globalContext('RS')).jobKey }), REGISTRY, CLOCK).ok, true)
    const result = ok(readV3PublicResponseRecord(withPending(pending()), REGISTRY, CLOCK)).cells[1].results[0]
    assert.equal(result.status, 'pending')
    if (result.status !== 'pending' || result.jobKind !== 'combination_discovery') assert.fail('wrong pending discriminator')
    assert.equal(result.identity.citizenshipCountryCode, 'RS')
    assert.equal(result.jobKey, result.identity.jobKey)
    assert.equal(Object.isFrozen(result.identity.method), true)
    const unknownPairs = { ...response(), cells: ['CH', 'RS'].map((citizenshipCountryCode) => ({
      citizenshipCountryCode, results: [pending(discoveryIdentity(citizenshipCountryCode))],
    })) }
    const parsed = ok(readV3PublicResponseRecord(unknownPairs, REGISTRY, CLOCK))
    assert.deepEqual(parsed.cells.map((cell) => cell.results[0].status), ['pending', 'pending'])
    assert.notEqual(unknownPairs.cells[0].results[0].jobKey, unknownPairs.cells[1].results[0].jobKey)
  })
  test('rejects missing or mismatched pending discriminator, pair, method and job identity', () => {
    const base = pending(), identity = base.identity
    for (const changed of [{ status: 'pending', jobKey: base.jobKey },
      { status: 'pending', jobKey: base.jobKey, identity },
      { status: 'pending', jobKind: 'combination_discovery', jobKey: base.jobKey },
      { ...base, jobKind: 'rule_research' }, { ...base, jobKey: work(globalContext('RS')).jobKey },
      { ...base, jobKey: discoveryIdentity().jobKey },
      { ...base, identity: { ...identity, method: { ...METHOD, revision: 2 } } },
      pending(discoveryIdentity('CH')), pending(discoveryIdentity('RS', 'FR')),
      { status: 'pending', jobKind: 'combination_discovery', jobKey: work().jobKey, identity: work() },
      { status: 'pending', jobKind: 'rule_research', jobKey: base.jobKey }]) {
      rejected(readV3PublicResponseRecord(withPending(changed), REGISTRY, CLOCK))
    }
  })
})

describe('V3 public projection and separate citizenship results', () => {
  test('resolves required source label and URL from exact pinned existing registry identities without network work', () => {
    const registry = displayRegistry(), source = sourceBinding()
    assert.deepEqual(ok(resolveV3PublicSourceDisplay(source, registry)), {
      source, publisherName: 'Synthetic destination only', authorityName: 'Synthetic authority only',
      href: 'https://destination.example/synthetic-test-publication',
    })
    rejected(resolveV3PublicSourceDisplay(source, REGISTRY))
    rejected(resolveV3PublicSourceDisplay({ ...source, representationVersion: 2 }, registry))
    rejected(resolveV3PublicSourceDisplay({ ...source, sourceId: counterSource }, registry))
    rejected(resolveV3PublicSourceDisplay(source, { ...registry, blockedDomains: ['destination.example'] }))
    rejected(resolveV3PublicSourceDisplay(source, { ...registry, contentIdentity: { ...registry.contentIdentity,
      representations: [{ ...registry.contentIdentity.representations[0], current: false }] } }))
  })
  test('retains accepted CH and pending RS with original source time and explicit synthetic notice', () => {
    const parsed = ok(readV3PublicResponseRecord(response(), REGISTRY, CLOCK))
    assert.deepEqual(parsed.cells.map((cell) => [cell.citizenshipCountryCode, cell.results[0].status]), [['CH', 'accepted'], ['RS', 'pending']])
    const first = parsed.cells[0].results[0]
    assert.equal(first.status, 'accepted')
    if (first.status !== 'accepted') throw new Error('test shape')
    assert.equal(first.projection.sourceCheckedAt, SOURCE_TIME)
    assert.notEqual(first.projection.sourceCheckedAt, first.projection.builtAt)
    assert.equal(first.projection.rule.subject.context.conditions.status, 'specified')
    assert.equal(parsed.notice, 'SYNTHETIC_TEST_DATA_NO_TRAVEL_ADVICE')
    assert.equal(Object.isFrozen(first.projection.rule.subject.context), true)
  })
  test('never hides a missing second citizenship, duplicates a result cell or selects a best passport', () => {
    const base = response()
    rejected(readV3PublicResponseRecord({ ...base, cells: [base.cells[0]] }, REGISTRY, CLOCK))
    rejected(readV3PublicResponseRecord({ ...base, cells: [base.cells[0], base.cells[0]] }, REGISTRY, CLOCK))
    rejected(readV3PublicResponseRecord({ ...base, selectedCitizenship: 'CH' }, REGISTRY, CLOCK))
    rejected(readV3PublicResponseRecord({ ...base, cells: [base.cells[0], {
      citizenshipCountryCode: 'RS', results: [{ status: 'accepted', projection: projection() }],
    }] }, REGISTRY, CLOCK))
  })
  test('separate accepted citizenships keep distinct immutable projection/version/evidence references', () => {
    const base = response(), rs = projection(globalContext('RS'))
    const value = { ...base, cells: [base.cells[0], { citizenshipCountryCode: 'RS', results: [{ status: 'accepted', projection: rs }] }] }
    assert.equal(readV3PublicResponseRecord(value, REGISTRY, CLOCK).ok, true)
    rejected(readV3PublicResponseRecord({ ...value, cells: [base.cells[0], { citizenshipCountryCode: 'RS', results: [{
      status: 'accepted', projection: { ...rs, rule: { ...rs.rule, reference: version().reference } },
    }] }] }, REGISTRY, CLOCK))
  })
  test('one canonical evidence observation may support separate global condition contexts without changing its identity', () => {
    const first = projection(), context = ok(readV3GlobalRuleContext({ ...globalContext(), conditions: { status: 'specified', expression: {
      op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'business' },
    } } }))
    const other = projection(context)
    const second = { ...other, rule: { ...other.rule, subject: { ...other.rule.subject, evidence: first.rule.subject.evidence } } }
    const value = { ...response(), input: { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] },
      cells: [{ citizenshipCountryCode: 'CH', results: [
        { status: 'accepted', projection: first }, { status: 'accepted', projection: second },
      ] }] }
    assert.notEqual(first.rule.subject.contextKey, second.rule.subject.contextKey)
    assert.equal(first.rule.subject.evidence.versionId, second.rule.subject.evidence.versionId)
    assert.equal(readV3PublicResponseRecord(value, REGISTRY, CLOCK).ok, true)
    const changed = { ...second, rule: { ...second.rule, subject: { ...second.rule.subject,
      evidence: { ...second.rule.subject.evidence, sourceContentHash: sha256Hex('different-bytes-same-id') } } } }
    rejected(readV3PublicResponseRecord({ ...value, cells: [{ citizenshipCountryCode: 'CH', results: [
      { status: 'accepted', projection: first }, { status: 'accepted', projection: changed },
    ] }] }, REGISTRY, CLOCK))
  })
  test('preserves conflict, unavailable and error as distinct honest results', () => {
    const base = response()
    const alternatives = [
      { status: 'conflict', decisionRef: decision().reference, reason: 'comparable_conflict' },
      { status: 'unavailable', reason: 'unbound' },
      { status: 'error', code: 'temporary_failure', retryable: true },
    ]
    for (const alternative of alternatives) {
      const parsed = ok(readV3PublicResponseRecord({ ...base, cells: [base.cells[0], { citizenshipCountryCode: 'RS', results: [alternative] }] }, REGISTRY, CLOCK))
      assert.equal(parsed.cells[1].results[0].status, alternative.status)
    }
    rejected(readV3PublicResponseRecord({ ...base, cells: [base.cells[0], { citizenshipCountryCode: 'RS', results: [] }] }, REGISTRY, CLOCK))
  })
  test('rejects expiry at the exact boundary and does not rejuvenate source age with cache rebuilds', () => {
    const base = projection()
    assert.equal(readV3PublicProjectionRecord(base, REGISTRY, CLOCK).ok, true)
    rejected(readV3PublicProjectionRecord(base, REGISTRY, { ...CLOCK, now: base.expiresAt }))
    rejected(readV3PublicProjectionRecord({ ...base, sourceCheckedAt: BUILD_TIME }, REGISTRY, CLOCK))
    rejected(readV3PublicProjectionRecord({ ...base, expiresAt: '2026-11-11T00:00:00.000Z' }, REGISTRY, CLOCK))
    rejected(readV3PublicProjectionRecord(base, REGISTRY, { ...CLOCK, legalDate: '2027-01-01' }))
    rejected(readV3PublicProjectionRecord({ ...base, builtAt: '2026-11-09T08:10:00.000Z' }, REGISTRY, CLOCK))
    rejected(readV3PublicProjectionRecord({ ...base, rule: { ...base.rule, state: 'withdrawn' } }, REGISTRY, CLOCK))
    rejected(readV3PublicResponseRecord({ ...response(), generatedAt: '2026-11-09T08:05:00.000Z' }, REGISTRY, CLOCK))
  })
  test('requires explicit classification and safe exact error enums instead of free text', () => {
    const base = response()
    rejected(readV3PublicResponseRecord({ ...base, notice: null }, REGISTRY, CLOCK))
    rejected(readV3PublicResponseRecord({ ...base, dataMode: 'official_projection' }, REGISTRY, CLOCK))
    rejected(readV3PublicResponseRecord({ ...base, cells: [base.cells[0], { citizenshipCountryCode: 'RS', results: [{
      status: 'error', code: 'private@example.test', retryable: true,
    }] }] }, REGISTRY, CLOCK))
  })
})

describe('V3 adversarial data and dormant boundaries', () => {
  test('preflight never invokes getters and rejects cycles, prototypes, sparse arrays and non-JSON values', () => {
    let called = 0
    const getter = Object.defineProperty({}, 'destinationCountryCode', { enumerable: true, get: () => { called++; return 'DE' } })
    rejected(readV3VisitorInput(getter))
    assert.equal(called, 0)
    const cyclic: Record<string, unknown> = { destinationCountryCode: 'DE' }
    cyclic.self = cyclic
    for (const invalid of [cyclic, new Date(), new Map(), Object.create({ destinationCountryCode: 'DE' }),
      { destinationCountryCode: 'DE', citizenshipCountryCodes: Array(1) },
      { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'], value: BigInt(1) },
      JSON.parse('{"destinationCountryCode":"DE","__proto__":{"polluted":true}}')]) rejected(readV3VisitorInput(invalid))
  })
  test('enforces shared UTF-8 size, nesting and node bounds before a parser or error can echo payloads', () => {
    const huge = readV3ResearchProposal({ ...proposal(), extra: 'secret-sentinel'.repeat(6000) }, REGISTRY)
    assert.deepEqual(huge, { ok: false, reason: 'bound_exceeded' })
    let deep: unknown = 'private-sentinel'
    for (let index = 0; index < 20; index++) deep = { nested: deep }
    assert.deepEqual(readV3ResearchProposal(deep, REGISTRY), { ok: false, reason: 'bound_exceeded' })
    assert.deepEqual(readV3VisitorInput(Array(8193).fill(null)), { ok: false, reason: 'bound_exceeded' })
    assert.equal(JSON.stringify([huge, readV3ResearchProposal(deep, REGISTRY)]).includes('sentinel'), false)
  })
  test('nested PII, content blobs and source-URL personal data never enter proposal/cache/job records', () => {
    const base = proposal()
    for (const extra of [{ email: 'private@example.test' }, { session_id: 'personal' }, { passportPhoto: 'base64-personal' },
      { rawText: 'private@example.test' }, { canonicalUrl: 'https://destination.example/user/private@example.test' }]) {
      rejected(readV3ResearchProposal({ ...base, references: [{ ...base.references[0], ...extra }] }, REGISTRY))
    }
    rejected(readV3ResearchJobRecord({ ...job(), lastFailure: 'private@example.test' }))
    rejected(readV3PublicResponseRecord({ ...response(), input: { ...response().input, passportNumber: 'secret' } }, REGISTRY, CLOCK))
  })
  test('arbitrary official-host action paths are rejected without exact registered content identity', () => {
    const base = proposal(), identity = ok(createV3WorkIdentity({ context: base.context, method: METHOD,
      factKind: 'official_actions', researchReason: { status: 'missing' } }))
    rejected(readV3ResearchProposal({ ...base, research: identity.research, proposedFact: { schema: 1, fact: {
      kind: 'official_actions', actions: [{ actionSourceId: qualifiedSource, purpose: 'information',
        href: 'https://destination.example/private-user-path?email=private@example.test', visaMode: null }],
    } } }, REGISTRY))
  })
  test('serialization, hash fields or boolean flags cannot create a method approval or a trusted receipt', () => {
    const parsed = ok(readV3SourceDecisionRecord(decision(), REGISTRY))
    assert.equal('trustedReceipt' in parsed, false)
    assert.equal('accepted' in parsed, false)
    rejected(readV3SourceDecisionRecord({ ...parsed, trustedReceipt: sha256Hex(JSON.stringify(parsed)), approved: true }, REGISTRY))
    assert.equal(OFFICIAL_TRUTH_V3_BINDINGS.methodAuthority, null)
    assert.equal(OFFICIAL_TRUTH_V3_BINDINGS.acceptedStore, null)
    assert.equal(OFFICIAL_TRUTH_V3_BINDINGS.publicProjection, null)
  })
  test('the contract imports no fixtures and exposes no network, database, activation or acceptance side effect', () => {
    const code = readFileSync(new URL('./contract.ts', import.meta.url), 'utf8')
    assert.equal(/from ['"][^'"]*(?:fixtures|\.test|store-server|supabase|database-server)/.test(code), false)
    assert.equal(/\b(?:fetch|setInterval|regelKandidatAkzeptieren)\s*\(/.test(code), false)
    assert.equal(requirementsProviderAus(), null)
  })
})
