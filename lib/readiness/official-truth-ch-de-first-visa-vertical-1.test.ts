import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import * as React from 'react'
import Reisevorbereitung from '@/components/trips/Reisevorbereitung'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { chDeVisaResearch } from './official-truth-ch-de-first-visa-vertical-1/research'
import { chDeVisaReadBoundary } from './official-truth-ch-de-first-visa-vertical-1/adapter'
import { immutable, provenanceCanonical, decodeProvenanceBytes } from './official-truth-autonomous-provenance-artifact'
import { regelScopeAusEvidenceScope, regelKandidatAkzeptieren } from './rule-claims'
import { officialTruthServerHeldReviewPacket } from './official-truth-server-held-source-registry'
import { requirementsFuerReise } from './engine'
import { tripOfficialEvaluationsAuswerten } from './trip-official-evaluations-server'
import { requirementsProviderAus, type RequirementsProvider } from './provider'
import { requirementsProviderNachZustand } from './zustand'
import { officialChecklist } from './official-presentation'
import { destinationEssentialsAbleiten } from '@/lib/trips/destination-essentials'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { itineraryDirekt, itineraryEinTransit } from '@/lib/route/fixtures'
import { OFFICIAL_REQUIREMENT_TYPES, type Trip, type TripTraveller } from '@/types/trips'
import type { OfficialEvaluation } from './official'

const TIME = '2026-10-09T12:00:00.000Z'
// Entirely synthetic, no real traveller. Research declarations are not custody.
const selection = () => ({ citizenshipCountryCodes: ['CH'], credentialCount: 1,
  selectedCredential: { documentType: 'passport', documentClass: 'ordinary_passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
  originCountryCode: 'CH', destinationCountryCode: 'DE', transitCountryCodes: [], directJourney: true,
  purpose: 'tourism', travelDate: '2026-11-01', endDate: '2026-11-05', residenceCountryCode: 'CH' })

function traveller(): TripTraveller {
  return { id: 'synthetic-peer', clientRef: 'synthetic-peer', label: null, residenceCountryCode: 'CH',
    createdAt: TIME, updatedAt: TIME,
    citizenships: [{ id: 'synthetic-cit', clientRef: 'synthetic-cit', countryCode: 'CH', createdAt: TIME, updatedAt: TIME }],
    documents: [{ id: 'synthetic-pass', clientRef: 'synthetic-pass', documentType: 'passport', issuingCountryCode: 'CH',
      citizenshipClientRef: 'synthetic-cit', expiresOn: '2030-01-01', createdAt: TIME, updatedAt: TIME }] }
}
function trip(): Trip {
  const basis = beispielreise()
  const route = itineraryDirekt()
  route.legs[0]!.segments[0]!.destination = { airportCode: 'FRA', countryCode: 'DE', city: 'Frankfurt', country: 'Germany' }
  return beispielreise({ startDate: '2026-11-01', endDate: '2026-11-05', travellers: 1, party: [traveller()],
    stages: [{ ...basis.stages[0]!, name: 'Deutschland', countryCode: 'DE' }],
    ohneTag: [{ ...basis.days[0]!.items[0]!, id: 'synthetic-flight', dayId: null, kind: 'flight', routeItinerary: route }],
  })
}

// Execute the actual helper with a closed import map; no app/provider activation.
function helper(provider: RequirementsProvider | null, enabled = true, timeoutMs = 20) {
  const code = ts.transpileModule(readFileSync(resolve('lib/readiness/trip-official-evaluations-server.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const dependencies: Record<string, unknown> = {
    'server-only': {}, '@/lib/readiness/provider': { requirementsProviderAus: () => provider },
    '@/lib/readiness/zustand': { requirementsProviderNachZustand: (p: RequirementsProvider | null) => requirementsProviderNachZustand(p,
      { VERCEL_ENV: enabled ? 'preview' : 'production', JETNITY_READINESS_AKTIV: 'true' }) },
    '@/lib/readiness/engine': { requirementsFuerReise: (t: Trip, p: RequirementsProvider | null) => requirementsFuerReise(t, p, { now: TIME, timeoutMs }) },
  }
  const loaded = { exports: {} as { tripOfficialEvaluationsAuswerten: typeof tripOfficialEvaluationsAuswerten } }
  new Function('require', 'module', 'exports', code)((name: string) => {
    assert.ok(Object.hasOwn(dependencies, name)); return dependencies[name]
  }, loaded, loaded.exports)
  return loaded.exports.tripOfficialEvaluationsAuswerten
}
function assertUnknown(rows: OfficialEvaluation[]) {
  assert.ok(rows.length >= OFFICIAL_REQUIREMENT_TYPES.length)
  for (const row of rows) {
    assert.equal(row.result, 'unknown'); assert.notEqual(row.status, 'current')
    assert.equal(row.visaMode, row.requirementType === 'visa' ? 'unknown' : null); assert.equal(row.action, null); assert.equal(row.temporalRule, null)
  }
}

function renderDestination(t: Trip, rows: OfficialEvaluation[]) {
  const file = resolve('components/trips/TripWorkspaceDestinationEssentials.tsx')
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const require = createRequire(import.meta.url)
  const loaded = { exports: {} as { default: React.ComponentType<{ essentials: ReturnType<typeof destinationEssentialsAbleiten> }> } }
  new Function('require', 'module', 'exports', code)((name: string) => {
    assert.equal(name, 'react/jsx-runtime'); return require(name)
  }, loaded, loaded.exports)
  return renderToStaticMarkup(React.createElement(loaded.exports.default, { essentials: destinationEssentialsAbleiten({ reise: t, officialEvaluations: rows }) }))
}

test('explicit one-cell research uses canonical scope/request/candidate without a legal fact', () => {
  const input = immutable(selection()), result = chDeVisaResearch(input)
  assert.ok(result.ok)
  assert.equal(result.status, 'RESEARCH_GAP'); assert.equal(result.accepted, false)
  assert.equal(result.candidate.scope.requirementType, 'visa')
  assert.deepEqual(result.candidate.scope.citizenship, { mode: 'required', countryCodes: ['CH'] })
  assert.equal(result.candidate.evidenceQuality, 'research_gap')
  assert.equal(result.candidate.proposal, null); assert.deepEqual(result.candidate.supportVersionIds, [])
  assert.equal(result.candidate.lifecycle, 'candidate'); assert.equal(result.candidate.validationState, 'pending')
  const scope = regelScopeAusEvidenceScope(result.candidate.scope)
  assert.ok(scope.ok); assert.equal(result.candidate.key, scope.key)
  assert.equal(result.sourceCheckedAt, null); assert.equal(result.validFrom, null); assert.equal(result.validUntil, null)
  assert.equal(result.unrepresentedPredicates.length, 4)
  assert.equal(regelKandidatAkzeptieren(result.candidate).ok, false)
  assert.ok(Object.isFrozen(result.candidate))
})

const scopeChanges: Array<[string, (s: ReturnType<typeof selection>) => unknown]> = [
  ['missing citizenship', s => ({ ...s, citizenshipCountryCodes: [] })],
  ['multi citizenship', s => ({ ...s, citizenshipCountryCodes: ['CH', 'DE'] })],
  ['duplicate citizenship', s => ({ ...s, citizenshipCountryCodes: ['CH', 'CH'] })],
  ['wrong nationality', s => ({ ...s, citizenshipCountryCodes: ['DE'] })],
  ['additional credential', s => ({ ...s, credentialCount: 2 })],
  ['no selected credential', s => ({ ...s, selectedCredential: null })],
  ['unlinked passport', s => ({ ...s, selectedCredential: { ...s.selectedCredential, relatedCitizenshipCountryCode: null } })],
  ['issuer mismatch', s => ({ ...s, selectedCredential: { ...s.selectedCredential, issuingCountryCode: 'DE' } })],
  ['subclass unknown', s => ({ ...s, selectedCredential: { ...s.selectedCredential, documentClass: null } })],
  ['identity card', s => ({ ...s, selectedCredential: { ...s.selectedCredential, documentType: 'national_id' } })],
  ['other destination', s => ({ ...s, destinationCountryCode: 'GB' })],
  ['unknown date', s => ({ ...s, travelDate: null })],
  ['invalid date', s => ({ ...s, travelDate: '2026-02-30' })],
  ['epoch', s => ({ ...s, travelDate: '1970-01-01' })],
  ['end before start', s => ({ ...s, endDate: '2026-10-01' })],
  ['unknown purpose', s => ({ ...s, purpose: null })],
  ['employment', s => ({ ...s, purpose: 'work' })],
  ['transit', s => ({ ...s, transitCountryCodes: ['FR'] })],
  ['indirect route', s => ({ ...s, directJourney: false })],
  ['unknown origin', s => ({ ...s, originCountryCode: null })],
  ['residence substitution', s => ({ ...s, citizenshipCountryCodes: [], residenceCountryCode: 'CH' })],
  ['foreign residence', s => ({ ...s, residenceCountryCode: 'DE' })],
  ['claimed acceptance', s => ({ ...s, status: 'accepted' })],
  ['injected evidence', s => ({ ...s, evidence: { effect: 'not_required' } })],
  ['HTML', s => ({ ...s, purpose: '<script>untrusted</script>' })],
  ['unicode country', s => ({ ...s, citizenshipCountryCodes: ['ＣＨ'] })],
  ['URL injection', s => ({ ...s, destinationCountryCode: 'https://example.invalid/' })],
]
for (const [name, mutate] of scopeChanges) test(`research refuses ${name}`, () => assert.equal(chDeVisaResearch(mutate(selection())).ok, false))

test('getters, prototypes, cycles, overlong data and duplicate JSON cannot become research or accepted truth', () => {
  let accesses = 0
  const getter = { ...selection(), get purpose() { accesses++; return 'tourism' } }
  const arrayGetter = selection(); Object.defineProperty(arrayGetter.citizenshipCountryCodes, '0', { get() { accesses++; return 'CH' } })
  const cycle: Record<string, unknown> = { ...selection() }; cycle.child = cycle
  for (const input of [getter, arrayGetter, cycle, Object.create(selection()), new Date(), null,
    { ...selection(), purpose: 'x'.repeat(3_000) }, { ...selection(), purpose: '\ud800' }]) {
    assert.equal(chDeVisaResearch(input).ok, false)
  }
  assert.equal(accesses, 0)
  const duplicate = Buffer.from('{"citizenshipCountryCodes":["CH"],"citizenshipCountryCodes":["DE"]}')
  assert.equal(decodeProvenanceBytes(duplicate, 2_048).ok, false)
  assert.equal(chDeVisaResearch(duplicate.toString()).ok, false)
})

test('changed dates create a fresh canonical cell; unsupported predicates remain declarations only', () => {
  const a = chDeVisaResearch(selection()), b = chDeVisaResearch({ ...selection(), travelDate: '2026-11-02' })
  assert.ok(a.ok && b.ok); assert.notEqual(a.candidate.key, b.candidate.key)
  const extended = chDeVisaResearch({ ...selection(), endDate: '2027-11-05' })
  assert.ok(extended.ok); assert.equal(extended.candidate.proposal, null)
  assert.ok(extended.unrepresentedPredicates.includes('stay_end'))
})

test('no caller-crafted accepted evidence, source result or replay can open the dormant read boundary', async () => {
  let accesses = 0
  for (const candidate of [{ status: 'accepted', effect: 'not_required' }, { status: 'server_owned_official_retrieval' },
    { get evidence() { accesses++; throw Error('must not read') } }, chDeVisaResearch(selection())]) {
    const boundary = Reflect.apply(chDeVisaReadBoundary, undefined, [candidate])
    assert.equal(boundary.provider, null); assert.equal(boundary.acceptedRule, null)
    assert.equal(boundary.reason, 'trusted_accepted_reader_unavailable')
    assert.deepEqual(boundary, chDeVisaReadBoundary())
  }
  assert.equal(accesses, 0)
  const review = await officialTruthServerHeldReviewPacket({ supports: [], metadata: {}, registry: {} }, { env: {} })
  assert.deepEqual(review, { status: 'blocked', reason: 'caller_authority_forbidden' })
})

test('actual account helper → canonical engine → existing checklist and rendered Destination Essentials stay unavailable', async () => {
  const t = immutable(trip()), before = provenanceCanonical(t)
  const boundary = chDeVisaReadBoundary()
  const rows = await helper(boundary.provider)(t)
  assert.deepEqual(rows, await tripOfficialEvaluationsAuswerten(t))
  assertUnknown(rows); assert.equal(rows.length, OFFICIAL_REQUIREMENT_TYPES.length)
  assert.ok(rows.every(r => r.destinationCountryCode === 'DE'))
  assert.equal(rows.find(r => r.requirementType === 'visa')!.status, 'unavailable')
  assert.equal(rows.find(r => r.requirementType === 'transit')!.status, 'insufficient_context')
  assert.ok(rows.some(r => r.requirementType === 'visa'))
  for (const type of ['blank_passport_pages', 'financial_means', 'passport', 'transit']) {
    assert.ok(rows.some(r => r.requirementType === type))
  }
  const entries = officialChecklist({ evaluations: rows, party: t.party!, slots: [{ clientRef: 'synthetic-peer', label: 'Test traveller' }] }).flatMap(g => g.eintraege)
  assert.ok(entries.length > 0); assert.ok(entries.every(e => e.result === 'unknown' && e.aktionen.length === 0))
  const html = renderDestination(t, rows)
  assert.match(html, /Deutschland/); assert.match(html, /nicht|Unbekannt|unbekannt/)
  assert.doesNotMatch(html, /Nicht erforderlich|visumfrei|visa-free|auswaertiges-amt|application|Alles bereit/)
  const preparation = renderToStaticMarkup(React.createElement(Reisevorbereitung, { reise: t, officialEvaluations: rows,
    offeneBereiche: new Set(['offizielle-anforderungen'] as const), onBereichOffen() {}, onZiel() {} }))
  assert.match(preparation, /Einreiseanforderungen noch nicht prüfbar/)
  assert.doesNotMatch(preparation, /Nicht erforderlich|visumfrei|visa-free|auswaertiges-amt/)
  assert.equal(provenanceCanonical(t), before)
  assert.equal(requirementsProviderAus(), null)
})

for (const change of ['multi citizenship', 'two passports', 'unlinked', 'issuer mismatch', 'no document', 'no traveller', 'other country', 'new date', 'transit'] as const) {
  test(`existing account/engine preserves unknown and option isolation: ${change}`, async () => {
    const t = trip(), p = t.party![0]!
    if (change === 'multi citizenship') p.citizenships.push({ ...p.citizenships[0]!, id: 'second-cit', clientRef: 'second-cit', countryCode: 'DE' })
    if (change === 'two passports') p.documents.push({ ...p.documents[0]!, id: 'second-pass', clientRef: 'second-pass' })
    if (change === 'unlinked') p.documents[0]!.citizenshipClientRef = null
    if (change === 'issuer mismatch') p.documents[0]!.issuingCountryCode = 'DE'
    if (change === 'no document') p.documents = []
    if (change === 'no traveller') t.party = []
    if (change === 'other country') t.stages[0]!.countryCode = 'GB'
    if (change === 'new date') t.startDate = '2027-01-01'
    if (change === 'transit') t.ohneTag![0]!.routeItinerary = itineraryEinTransit()
    const rows = await tripOfficialEvaluationsAuswerten(t)
    assertUnknown(rows)
    if (change === 'two passports') assert.equal(new Set(rows.map(r => r.credentialOptionRef)).size, 2)
    if (change === 'multi citizenship') assert.ok(rows.every(r => r.evidence.contextFingerprint.includes('cit=CH,DE')))
  })
}

for (const failure of ['empty', 'throw', 'timeout', 'aborted', 'production'] as const) {
  test(`injected port fails closed through real helper: ${failure}`, async () => {
    let calls = 0, signal: AbortSignal | undefined
    const provider: RequirementsProvider = { name: 'synthetic-refusal-only', async evaluate(_request, abort) {
      calls++; signal = abort
      if (failure === 'throw') throw Error('synthetic failure')
      if (failure === 'timeout') return new Promise(() => {})
      return []
    } }
    const rows = failure === 'aborted'
      ? await requirementsFuerReise(trip(), provider, { signal: AbortSignal.abort(), timeoutMs: 5 })
      : await helper(provider, failure !== 'production', 5)(trip())
    assertUnknown(rows)
    if (failure === 'production') assert.equal(calls, 0)
    if (failure === 'timeout') { assert.equal(calls, 1); assert.equal(signal?.aborted, true) }
  })
}
