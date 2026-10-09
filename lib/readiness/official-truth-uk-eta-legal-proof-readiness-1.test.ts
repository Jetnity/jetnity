import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createLegalProofPacket, serializeLegalProofIntent, packetSchema, GAP_CATEGORIES, CONTEXT_FACTS } from '../../scripts/official-truth-uk-eta-legal-proof-readiness-1/packet'
import { syntheticIntent } from '../../scripts/official-truth-uk-eta-legal-proof-readiness-1/fixtures'
import { main } from '../../scripts/official-truth-uk-eta-legal-proof-readiness-1/run'
import { ANCHORS, QUESTIONS, URLS } from '../../scripts/official-truth-uk-eta-legal-proof-readiness-1/catalog'
import { ZIEL_ERLAUBNIS_KLASSEN } from './regulierungs-anwendbarkeit'
import { regelScopeAusEvidenceScope, type RegelScope } from './rule-claims'

function inputScope() { const input = syntheticIntent(); return { input, scope: input.scope as RegelScope } }
function packet(input: unknown = syntheticIntent()) {
  const result = createLegalProofPacket(input)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('expected_diagnostic_packet')
  return result
}
function refuses(raw: unknown, reason = 'INVALID_INPUT') {
  const result = createLegalProofPacket(raw)
  assert.equal(result.ok, false)
  assert.equal(result.reason, reason)
  assert.equal(result.legalProofReadiness, 'NOT_READY')
  assert.equal(packetSchema.safeParse(result).success, true)
}

test('L02/L11 finite diagnostic is BLOCKED even with fresh synthetic sources; no legal outcome', () => {
  const result = packet()
  assert.equal(result.status, 'BLOCKED')
  assert.equal(result.reason, 'OPAQUE_PUBLISHING_METADATA')
  assert.equal(packetSchema.safeParse(result).success, true)
  assert.doesNotMatch(JSON.stringify(result), /"(?:required|not_required|visaMode|outcome|accepted|sourceAttestation|ruleFact)"|ev2_/)
  assert.equal(result.questions.length, 6)
  assert.ok(result.questions.every(q => q.status === 'UNRESOLVED'))
})
for (const category of GAP_CATEGORIES) test(`L04/L16 direct missing-proof category ${category}`, () => {
  assert.ok(packet().gaps.some(gap => gap.category === category))
})
test('L01 canonical scope is reused without creating Rule or research-request identities', () => {
  const { input } = inputScope()
  assert.equal(regelScopeAusEvidenceScope(input.scope).ok, true)
  assert.equal(packet(input).scopeAssessment, 'EXPLICIT_CH_GB_RESEARCH_SCOPE_ONLY')
  assert.doesNotMatch(JSON.stringify(packet(input)), /rule-scope:|research-request:|contentItemId|sourceFamily/)
})
test('L03 null scope is NOT_READY, never default CH', () => refuses({ ...syntheticIntent(), scope: null }, 'SCOPE_MISSING'))
test('L03 missing scope is invalid input', () => { const raw: Record<string, unknown> = { ...syntheticIntent() }; delete raw.scope; refuses(raw) })
for (const codes of [['CH', 'IE'], ['IE', 'CH'], ['DE'], ['RS', 'CH']]) test(`L03 no narrowing citizenship ${codes.join('+')}`, () => {
  const { input, scope } = inputScope(); scope.citizenship = { mode: 'required', countryCodes: codes }
  if (!codes.includes('CH')) scope.credentialOption = { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null }
  refuses(input, 'CITIZENSHIP_OUT_OF_SCOPE')
})
test('L09 issuer CH never creates citizenship', () => {
  const { input, scope } = inputScope(); scope.citizenship = { mode: 'not_applicable' }
  scope.credentialOption = { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null }
  refuses(input, 'CITIZENSHIP_OUT_OF_SCOPE')
})
for (const destination of ['IE', 'US', null]) test(`L03 destination ${destination} not silently rewritten`, () => {
  const { input, scope } = inputScope(); scope.destinationCountryCode = destination; refuses(input, destination === null ? 'INVALID_SCOPE' : 'DESTINATION_OUT_OF_SCOPE')
})
test('L03 wrong requirement is out of scope', () => { const { input, scope } = inputScope(); scope.requirementType = 'visa'; refuses(input, 'REQUIREMENT_OUT_OF_SCOPE') })
for (const type of ['national_id', 'unknown'] as const) test(`L03 selected ${type} is not a passport`, () => {
  const { input, scope } = inputScope(); scope.credentialOption = { mode: 'option', documentType: type, issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' }; refuses(input, 'CREDENTIAL_OUT_OF_SCOPE')
})
test('L03 missing and unlinked selected credential are distinct, never repaired', () => {
  const { input, scope } = inputScope(); scope.credentialOption = { mode: 'not_applicable' }
  assert.ok(packet(input).gaps.some(g => g.reason === 'SELECTED_CREDENTIAL_MISSING'))
  scope.credentialOption = { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null }
  assert.ok(packet(input).gaps.some(g => g.reason === 'CITIZENSHIP_LINK_MISSING'))
})
for (const journey of ['AIRSIDE_TRANSIT', 'LANDSIDE_TRANSIT', 'DOMESTIC'] as const) test(`L08 no general ${journey} rule`, () => refuses({ ...syntheticIntent(), journey }, 'JOURNEY_OUT_OF_SCOPE'))
test('L08 null transit country alone cannot exclude airside/landside cases', () => {
  const result = packet({ ...syntheticIntent(), journey: 'UNKNOWN' })
  assert.ok(result.gaps.some(g => g.reason === 'JOURNEY_KIND_MISSING'))
  assert.ok(result.coverage.filter(c => c.case.includes('TRANSIT')).every(c => c.disposition === 'UNRESOLVED'))
  assert.equal(packet().coverage.find(c => c.case === 'AIRSIDE_TRANSIT')?.disposition, 'EXCLUDED_BY_EXPLICIT_RESEARCH_SCOPE')
})
test('L08 transit scope cannot masquerade as destination', () => { const { input, scope } = inputScope(); scope.transitCountryCode = 'GB'; refuses(input, 'JOURNEY_OUT_OF_SCOPE') })
test('L07 never-applied has two explicit unsatisfied official predicates without an invented event', () => {
  const result = packet()
  assert.deepEqual(result.questions[0]?.unsatisfiedPredicates, ['ETA14_QUALIFIER_TARGET', 'ETA14_NEVER_APPLIED_REFERENCE_EVENT'])
  assert.ok(result.gaps.some(g => g.reason === 'NEVER_APPLIED_EVENT_UNRESOLVED'))
  assert.doesNotMatch(JSON.stringify(result), /applicationDate|referenceEventAt|2026-11-01/)
})
for (const scenario of ['APPLICATION_ASSERTED', 'UNKNOWN'] as const) test(`L07 ${scenario} cannot settle interpretation`, () => {
  const result = packet({ ...syntheticIntent(), applicationScenario: scenario })
  assert.equal(result.questions[0]?.status, 'UNRESOLVED')
  assert.ok(result.gaps.some(g => g.reason === 'REFERENCE_EVENT_UNRESOLVED'))
})
test('L09 all supplied assertions preserve legal, context and platform separation', () => {
  const input = syntheticIntent()
  input.contextCoverage = CONTEXT_FACTS.map(fact => ({ fact, state: 'USER_ASSERTED' }))
  input.permissionCoverage = ZIEL_ERLAUBNIS_KLASSEN.map(permissionClass => ({ permissionClass, state: 'USER_ASSERTED' }))
  const result = packet(input)
  assert.equal(result.gaps.filter(g => g.reason === 'ASSERTION_NOT_OFFICIAL_PROOF').length, CONTEXT_FACTS.length + ZIEL_ERLAUBNIS_KLASSEN.length)
  assert.ok(result.gaps.some(g => g.reason === 'CLASS_WIDE_ABSENCE_UNPROVEN'))
  assert.ok(result.questions.every(q => q.status === 'UNRESOLVED'))
  assert.deepEqual(new Set(result.gaps.map(g => g.layer)), new Set(['OFFICIAL_SOURCE', 'LEGAL_SEMANTICS', 'PERSONAL_CONTEXT', 'PLATFORM_PO_GATE']))
})
for (const fact of CONTEXT_FACTS) test(`L16 missing ${fact} is explicit`, () => {
  assert.ok(packet().gaps.some(g => g.subject === fact && g.reason === 'CONTEXT_MISSING'))
})
for (const permissionClass of ZIEL_ERLAUBNIS_KLASSEN) test(`L16 missing permission class ${permissionClass}`, () => {
  assert.ok(packet().gaps.some(g => g.subject === permissionClass && g.reason === 'PERMISSION_CLASS_MISSING'))
})
test('L09 residence country is not Irish lawful entitlement', () => {
  const { input, scope } = inputScope(); scope.residence = { mode: 'required', countryCode: 'IE' }
  input.contextCoverage = [{ fact: 'IRELAND_ACTUAL_RESIDENCE', state: 'USER_ASSERTED' }]
  assert.ok(packet(input).gaps.some(g => g.subject === 'IRELAND_ENTITLEMENT' && g.reason === 'CONTEXT_MISSING'))
})
test('L08 R2–R6 and non-exhaustive exemption routes remain unresolved', () => {
  const result = packet()
  assert.deepEqual(result.questions.map(q => q.id), QUESTIONS.map(q => q.id))
  for (const name of ['UNENUMERATED_EXEMPTIONS', 'BOTC_BNO', 'GERMAN_SCHOOL', 'FRENCH_SCHOOL', 'FORCES', 'SHIP_AIR_RAIL_CREW', 'FRONTIER_WORKER', 'S2_ARRIVAL'] as const) assert.equal(result.coverage.find(c => c.case === name)?.disposition, 'UNRESOLVED')
  assert.ok(result.gaps.some(g => g.reason === 'NO_RESIDUAL_NEGATIVE_PROOF'))
})
test('L08 ETA holding/use and island ETA recognition do not become exemption', () => {
  const result = packet()
  assert.equal(result.coverage.find(c => c.case === 'ETA_APPLICATION_AND_USE')?.disposition, 'APPLICATION_USE_ONLY')
  assert.equal(result.coverage.find(c => c.case === 'CROWN_DEPENDENCY_ETA_RECOGNITION')?.disposition, 'APPLICATION_USE_ONLY')
})
test('L10 all targeted anchors are canonical official URLs with concrete locators', () => {
  for (const anchor of Object.values(ANCHORS)) {
    const url = new URL(anchor.url)
    assert.ok(['https://www.gov.uk', 'https://assets.publishing.service.gov.uk'].includes(url.origin)); assert.equal(url.search, ''); assert.equal(url.hash, '')
    assert.ok(anchor.locator.length > 5); assert.ok(anchor.auditRows.length > 0)
  }
})
test('L01/L05 references reuse the 76-record/33-retrieval historical audit without a new corpus', () => {
  const audit = readFileSync('docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_2026-10-05.md', 'utf8')
  const rows = [...audit.matchAll(/```json\n([\s\S]*?)\n```/g)].map(match => JSON.parse(match[1]!))
  assert.equal(rows.filter(row => row.evidenceId).length, 76)
  assert.equal(rows.filter(row => row.canonicalRequestUrl).length, 33)
  for (const anchor of Object.values(ANCHORS)) assert.ok(rows.some(row => row.officialSourceUrl === anchor.url))
})
test('L12 National List and Appendix remain distinct research labels', () => {
  const sources = packet().sources
  assert.notEqual(sources[0]?.url, sources[1]?.url)
  assert.ok(sources.every(s => s.phase === 'RESEARCH_ONLY' && s.sourceRevision === null))
})
test('L15 absent source is separate from historical, stale, conflicting and ambiguous', () => {
  const input = syntheticIntent(); input.observations = []
  assert.equal(packet(input).gaps.filter(g => g.reason === 'ABSENT_SOURCE').length, 3)
  input.observations = syntheticIntent().observations
  input.observations[0] = { ...input.observations[0]!, origin: 'HISTORICAL_AUDIT', retrievedAt: '2026-10-05T12:00:00.000Z', interpretation: 'CONFLICTING' }
  input.observations[1] = { ...input.observations[1]!, origin: 'RESEARCH_READ', interpretation: 'AMBIGUOUS' }
  const result = packet(input)
  for (const reason of ['HISTORICAL_NOT_CURRENT', 'RESEARCH_STALE', 'CONFLICTING_SOURCE']) assert.ok(result.sources[0]?.reasons.includes(reason as never))
  assert.ok(result.sources[1]?.reasons.includes('AMBIGUOUS_SOURCE'))
  assert.equal(result.status, 'BLOCKED')
})
test('L10 publication and observation dates never establish legal effect', () => {
  const input = syntheticIntent()
  for (const row of input.observations) { row.origin = 'RESEARCH_READ'; row.publishedAt = '2026-10-08T12:00:00.000Z' }
  const result = packet(input)
  assert.ok(result.sources.every(s => s.validFrom === null && s.validUntil === null))
  assert.ok(result.gaps.some(g => g.reason === 'COMMENCEMENT_UNPROVEN'))
  assert.ok(result.gaps.some(g => g.reason === 'EFFECTIVE_INTERVAL_UNKNOWN'))
})
test('L15 future retrieval, publishing-after-retrieval, missing retrieval remain distinct', () => {
  const input = syntheticIntent()
  input.observations[0]!.retrievedAt = '2026-10-10T12:00:00.000Z'
  input.observations[1]!.publishedAt = '2026-10-09T11:30:00.000Z'
  input.observations[2]!.retrievedAt = null
  const result = packet(input)
  assert.ok(result.sources[0]?.reasons.includes('SOURCE_TIME_CONFLICT'))
  assert.ok(result.sources[1]?.reasons.includes('SOURCE_TIME_CONFLICT'))
  assert.ok(result.sources[2]?.reasons.includes('RETRIEVAL_TIME_MISSING'))
})
test('L15 24-hour observation age boundary is diagnostic only', () => {
  const input = syntheticIntent(); input.observations[0]!.retrievedAt = '2026-10-08T12:00:00.000Z'
  assert.ok(!packet(input).sources[0]?.reasons.includes('RESEARCH_STALE'))
  input.observations[0]!.retrievedAt = '2026-10-08T11:59:59.999Z'
  assert.ok(packet(input).sources[0]?.reasons.includes('RESEARCH_STALE'))
})
test('L15 future publication with absent retrieval retains both temporal gaps', () => {
  const input = syntheticIntent(); input.observations[0]!.retrievedAt = null
  input.observations[0]!.publishedAt = '2026-10-10T12:00:00.000Z'
  const reasons = packet(input).sources[0]!.reasons
  assert.ok(reasons.includes('SOURCE_TIME_CONFLICT')); assert.ok(reasons.includes('RETRIEVAL_TIME_MISSING'))
})
test('L09 an unreviewed context record is never accepted context or law', () => {
  const input = syntheticIntent(); input.contextCoverage = [{ fact: 'SCHOOL_FORM_AUTHORITY', state: 'UNREVIEWED_RECORD' }]
  input.permissionCoverage = [{ permissionClass: 'entry_clearance', state: 'UNREVIEWED_RECORD' }]
  const result = packet(input)
  assert.ok(result.gaps.some(g => g.subject === 'SCHOOL_FORM_AUTHORITY' && g.reason === 'UNREVIEWED_CONTEXT'))
  assert.ok(result.gaps.some(g => g.subject === 'entry_clearance' && g.reason === 'UNREVIEWED_CONTEXT'))
  assert.equal(result.questions[5]?.status, 'UNRESOLVED')
})
test('L15 absent passport and CTA context is not mislabeled as an unreviewed record', () => {
  for (const fact of ['NATIONAL_PASSPORT', 'INBOUND_CTA_ORIGIN'] as const) {
    const gaps = packet().gaps.filter(g => g.subject === fact)
    assert.equal(gaps.length, 1)
    assert.equal(gaps[0]?.reason, 'CONTEXT_MISSING')
    assert.equal(gaps[0]?.category, 'CREDENTIAL_AND_ROUTE')
  }
})
test('L07 located clarification still needs authoritative review of both predicates', () => {
  const input = syntheticIntent(); input.observations[0]!.interpretation = 'CLARIFICATION_LOCATED'
  const result = packet(input)
  assert.ok(result.sources[0]?.reasons.includes('CLARIFICATION_UNREVIEWED'))
  assert.equal(result.questions[0]?.status, 'UNRESOLVED')
})
test('L10 missing travel date is not replaced by observedAt', () => {
  const { input, scope } = inputScope(); scope.validity = { mode: 'not_applicable' }
  assert.ok(packet(input).gaps.some(g => g.reason === 'TRAVEL_DATE_MISSING'))
})
for (const date of ['2026-02-30T12:00:00.000Z', '2026-10-09', '2026-10-09T12:00:00+00:00', '2026-10-09T24:00:00.000Z', '0000-01-01T00:00:00.000Z']) test(`L14 invalid observation date ${date}`, () => refuses({ ...syntheticIntent(), observedAt: date }))
for (const suffix of ['?utm_source=test', '#fragment', '?token=synthetic', '/..', '%00']) test(`L14 reject noncanonical source URL ${suffix}`, () => {
  const input = syntheticIntent(); const row = { ...input.observations[0], url: URLS.ETA_APPENDIX + suffix }; refuses({ ...input, observations: [row] })
})
test('L12 crossed source URL cannot assert common identity', () => {
  const input = syntheticIntent(); input.observations[0]!.url = URLS.NATIONAL_LIST; refuses(input)
})
for (const field of ['email', 'passportNumber', 'dateOfBirth', 'fullName', 'requestId', 'note', 'rawBody', 'acceptedRule', 'publishing_request_id']) test(`L13/L14 injected ${field} rejected without echo`, () => {
  const input = { ...syntheticIntent(), [field]: 'PRIVATE_SYNTHETIC_SENTINEL' }; refuses(input)
  assert.ok(!serializeLegalProofIntent(input).includes('PRIVATE_SYNTHETIC_SENTINEL'))
})
test('L14 nested extras and duplicate labels are rejected', () => {
  const input = syntheticIntent()
  refuses({ ...input, observations: [{ ...input.observations[0], extra: 'hidden' }] })
  refuses({ ...input, contextCoverage: [{ fact: 'SCHOOL_FORM_AUTHORITY', state: 'MISSING', name: 'synthetic' }] })
  refuses({ ...input, permissionCoverage: [{ permissionClass: 'visa', state: 'MISSING', evidence: true }] })
  refuses({ ...input, observations: [input.observations[0], input.observations[0]] })
  refuses({ ...input, contextCoverage: [{ fact: 'NATIONAL_PASSPORT', state: 'MISSING' }, { fact: 'NATIONAL_PASSPORT', state: 'USER_ASSERTED' }] })
})
test('L14 canonical scope unknown or irrelevant fields cannot be silently stripped', () => {
  const { input, scope } = inputScope()
  refuses({ ...input, scope: { ...scope, sourceId: 'synthetic-source' } }, 'INVALID_SCOPE')
  refuses({ ...input, scope: { ...scope, unknown: true } }, 'INVALID_SCOPE')
  refuses({ ...input, scope: { ...scope, residence: { mode: 'not_applicable', countryCode: 'IE' } } }, 'INVALID_SCOPE')
})
test('L14 hostile values fail closed; accessors are not invoked', () => {
  let calls = 0
  const getter = { ...syntheticIntent() }; Object.defineProperty(getter, 'observedAt', { enumerable: true, get() { calls++; throw new Error('PRIVATE_SYNTHETIC_SENTINEL') } })
  const nested = { ...syntheticIntent(), observations: [Object.defineProperty({}, 'url', { enumerable: true, get() { calls++; return 'hidden' } })] }
  const cycle: Record<string, unknown> = { ...syntheticIntent() }; cycle.self = cycle
  const revoked = Proxy.revocable({}, {}); revoked.revoke()
  for (const value of [getter, nested, cycle, Object.create(syntheticIntent()), Object.create(null), new Date(), BigInt(1), NaN, Infinity, undefined,
    { ...syntheticIntent(), [Symbol('hidden')]: true }, { ...syntheticIntent(), toJSON: () => 'hidden' },
    Object.defineProperty({ ...syntheticIntent() }, 'hidden', { value: true }),
    { ...syntheticIntent(), scope: new Proxy(inputScope().scope, {}) }, revoked.proxy,
    JSON.parse('{"__proto__":{"polluted":true}}'), { ...syntheticIntent(), observations: new Array(2) },
  ]) refuses(value)
  assert.equal(calls, 0)
  assert.ok(!serializeLegalProofIntent(getter).includes('PRIVATE_SYNTHETIC_SENTINEL'))
})
test('L13 bounds apply before parsing/canonicalization', () => {
  const input = syntheticIntent()
  refuses({ ...input, observations: Array(4).fill(input.observations[0]) })
  refuses({ ...input, contextCoverage: Array(15).fill({ fact: 'NATIONAL_PASSPORT', state: 'MISSING' }) })
  refuses({ ...input, observedAt: 'x'.repeat(65_537) })
  let nested: unknown = null; for (let n = 0; n < 18; n++) nested = { child: nested }
  refuses({ ...input, scope: nested })
})
test('L15 no mutation, no implicit clock; permutations retain canonical output', () => {
  const input = syntheticIntent(); const original = structuredClone(input)
  assert.deepEqual(packet(input), packet(input)); assert.deepEqual(input, original)
  input.observations.reverse(); assert.deepEqual(packet(input), packet(original))
  assert.ok(Object.isFrozen(packet().gaps[0]))
  const changed = { ...original, observedAt: '2026-10-09T12:01:00.000Z' }
  assert.deepEqual({ ...packet(changed), observedAt: original.observedAt }, packet(original))
})
test('L03 closed output rejects injected root/nested fields and readiness upgrades', () => {
  const result = packet()
  for (const invalid of [{ ...result, outcome: 'required' }, { ...result, status: 'READY' }, { ...result, legalProofReadiness: 'READY' },
    { ...result, sources: [{ ...result.sources[0], body: 'synthetic' }, ...result.sources.slice(1)] },
    { ...result, questions: [{ ...result.questions[0], status: 'RESOLVED' }, ...result.questions.slice(1)] },
    { ...result, gaps: [{ ...result.gaps[0], rawError: 'hidden' }] },
  ]) assert.equal(packetSchema.safeParse(invalid).success, false)
  refuses(result) // serialized diagnostics cannot be replayed as new intent/accepted material
})
test('L17 CLI defaults to NOT_RUN; only explicit offline synthetic mode exists', () => {
  assert.deepEqual(main([]), { exitCode: 0, execution: 'NOT_RUN', packet: null })
  assert.equal(main(['--synthetic']).execution, 'SYNTHETIC_ONLY')
  for (const args of [['--live'], ['https://www.gov.uk'], ['--synthetic', 'extra']]) {
    assert.deepEqual(main(args), { exitCode: 2, execution: 'INVALID_ARGUMENTS', packet: null })
  }
})
test('L17 no application consumer, hidden clock, transport, store or acceptance invocation', () => {
  function files(root: string): string[] { return readdirSync(root, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(root, e.name)) : [join(root, e.name)]) }
  for (const root of ['app', 'components', 'lib']) for (const path of files(root)) if (/\.[jt]sx?$/.test(path) && !path.endsWith('.test.ts')) assert.doesNotMatch(readFileSync(path, 'utf8'), /official-truth-uk-eta-legal-proof-readiness-1\//)
  const code = readFileSync('scripts/official-truth-uk-eta-legal-proof-readiness-1/packet.ts', 'utf8')
  assert.doesNotMatch(code, /Date\.now|new Date\(\)|process\.env|fetch\(|regelKandidatAkzeptieren\(|regulierungsAnwendbarkeitV2Auswerten\(|supabase|node:fs|node:https/)
})
