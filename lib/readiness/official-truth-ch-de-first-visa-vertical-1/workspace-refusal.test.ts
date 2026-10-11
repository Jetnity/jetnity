import assert from 'node:assert/strict'
import { test } from 'node:test'
import https from 'node:https'
import { readFileSync } from 'node:fs'
import { chDeVisaReadForTrip } from './adapter'
import { chDeWorkspaceRefusal } from '../../../scripts/official-truth-ch-de-first-visa-vertical-1/workspace-refusal'
import { runChDeAcceptedReadProof } from '../../../scripts/official-truth-ch-de-first-visa-vertical-1/accepted-read-proof'
import { beispielreise } from '../../reiseaenderung/fixtures/reise'
import { credentialOptionsAus } from '../traveller-kontext'
import { requirementsProviderAus } from '../provider'
import { requirementsProviderNachZustand } from '../zustand'
import { officialChecklist } from '../official-presentation'
import { destinationEssentialsAbleiten } from '../../trips/destination-essentials'
import { OFFICIAL_REQUIREMENT_TYPES, type Trip, type TripTraveller } from '../../../types/trips'

const time = '2026-10-11T00:00:00.000Z'
function person(ref: string, code: string): TripTraveller {
  return { id: ref, clientRef: ref, label: null, residenceCountryCode: 'CH', createdAt: time, updatedAt: time,
    citizenships: [{ id: `${ref}-c`, clientRef: `${ref}-c`, countryCode: code, createdAt: time, updatedAt: time }],
    documents: [{ id: `${ref}-p`, clientRef: `${ref}-p`, documentType: 'passport', issuingCountryCode: 'CH',
      citizenshipClientRef: `${ref}-c`, expiresOn: '2030-01-01', createdAt: time, updatedAt: time }] }
}
function trip(): Trip {
  const basis = beispielreise()
  return beispielreise({ startDate: '2026-11-01', endDate: '2026-11-08',
    stages: basis.stages.map(s => ({ ...s, countryCode: 'DE' })),
    days: [], ohneTag: [], travellers: 2, party: [person('synthetic-a', 'CH'), person('synthetic-b', 'US')] })
}
const request = { travellerClientRef: 'synthetic-a', credentialOptionRef: 'synthetic-a:synthetic-a-p',
  destinationCountryCode: 'DE', requirementType: 'visa' }

test('explicit linked option passes only representable prerequisites, never the missing contract gates', t => {
  t.mock.method(https, 'request', () => { throw Error('no network authorized') })
  const read = chDeVisaReadForTrip(trip(), request)
  assert.equal(read.reason, 'explicit_proposed_context_required')
  assert.ok(read.blockers.includes('explicit_proposed_context_required'))
  assert.ok(read.blockers.includes('persisted_regulatory_context_unavailable'))
  assert.ok(read.blockers.includes('legal_applicability_unverified'))
  assert.ok(read.blockers.includes('source_not_qualified'))
  assert.ok(read.blockers.includes('retained_custody_read_unavailable'))
  assert.equal(read.provider, null)
  assert.equal(read.acceptedRule, null)
  assert.equal(read.acceptedEvidence, null)
  assert.ok(Object.isFrozen(read) && Object.isFrozen(read.blockers))
})

for (const [name, change, reason] of [
  ['residence and issuer do not confer nationality', (r: Trip) => { r.party![0]!.citizenships[0]!.countryCode = 'US' }, 'ch_citizenship_required'],
  ['unlinked document', (r: Trip) => { r.party![0]!.documents[0]!.citizenshipClientRef = null }, 'linked_ch_passport_required'],
  ['other issuer', (r: Trip) => { r.party![0]!.documents[0]!.issuingCountryCode = 'DE' }, 'linked_ch_passport_required'],
  ['national ID is not passport', (r: Trip) => { r.party![0]!.documents[0]!.documentType = 'national_id' }, 'linked_ch_passport_required'],
  ['other destination', (r: Trip) => { r.stages[0]!.countryCode = 'FR' }, 'single_de_destination_required'],
  ['unknown destination', (r: Trip) => { r.stages[0]!.countryCode = null }, 'single_de_destination_required'],
  ['missing start', (r: Trip) => { r.startDate = null }, 'explicit_travel_dates_required'],
  ['invalid date', (r: Trip) => { r.startDate = '2026-02-30' }, 'explicit_travel_dates_required'],
  ['reversed dates', (r: Trip) => { r.endDate = '2026-10-01' }, 'explicit_travel_dates_required'],
  ['duplicate traveller', (r: Trip) => { r.party!.push(structuredClone(r.party![0]!)) }, 'ambiguous_traveller_reference'],
  ['duplicate document', (r: Trip) => { r.party![0]!.documents.push(structuredClone(r.party![0]!.documents[0]!)) }, 'ambiguous_credential_reference'],
  ['foreign citizenship link', (r: Trip) => { r.party![0]!.documents[0]!.citizenshipClientRef = 'synthetic-b-c' }, 'linked_ch_passport_required'],
  ['missing party', (r: Trip) => { r.party = [] }, 'traveller_context_unavailable'],
] as const) test(`read-request refusal: ${name}`, async () => {
  const reise = trip(); change(reise)
  const result = await chDeWorkspaceRefusal(reise, request)
  assert.equal(result.read.reason, reason)
  assert.ok(result.evaluations.every(e => e.result === 'unknown'
    && e.visaMode === (e.requirementType === 'visa' ? 'unknown' : null)))
  assert.deepEqual(result.evaluations, result.accountEvaluations)
})

for (const field of ['acceptedEvidence', 'acceptedRule', 'provider', 'transport', 'registry', 'identityProfiles',
  'sourceSnapshot', 'sourceContentHash', 'sourceFingerprintProtocol', 'signature', 'custody', 'commitAcknowledged',
  'revoked', 'conflict', 'validFrom', 'validUntil', 'retrievedAt', 'ordinaryPassport', 'purpose', 'directJourney']) {
  test(`caller ${field} cannot supply missing authority or scope`, () => {
    const read = chDeVisaReadForTrip(trip(), { ...request, [field]: { lifecycle: 'accepted', validationState: 'valid' } })
    assert.equal(read.reason, 'unsupported_read_request')
    assert.equal(read.provider, null)
  })
}

test('getters, cycles, excessive input and absent selection fail closed without reading authority', () => {
  const getter = Object.defineProperty({ ...request }, 'acceptedRule', { enumerable: true, get() { assert.fail('getter evaluated') } })
  const cycle: Record<string, unknown> = { ...request }; cycle.self = cycle
  for (const value of [getter, { ...request, credentialOptionRef: 'x'.repeat(2_000) }]) {
    assert.equal(chDeVisaReadForTrip(trip(), value).reason, 'invalid_read_request')
  }
  assert.equal(chDeVisaReadForTrip(trip(), cycle).reason, 'unsupported_read_request')
  assert.equal(chDeVisaReadForTrip(trip()).reason, 'explicit_credential_selection_required')
})

test('selection never crosses traveller/options and ordering cannot choose a passport', () => {
  const reise = trip()
  const selected = reise.party![0]!
  selected.documents.unshift({ ...selected.documents[0]!, id: 'other', clientRef: 'other', issuingCountryCode: 'US' })
  assert.equal(chDeVisaReadForTrip(reise, request).reason, 'explicit_proposed_context_required')
  assert.equal(chDeVisaReadForTrip(reise, { ...request, credentialOptionRef: credentialOptionsAus(selected).find(o => o.document?.clientRef === 'other')!.optionRef }).reason, 'linked_ch_passport_required')
  assert.equal(chDeVisaReadForTrip(reise, { ...request, credentialOptionRef: 'synthetic-b:synthetic-b-p' }).reason, 'selected_credential_not_in_traveller')
  reise.party!.reverse(); selected.documents.reverse()
  assert.equal(chDeVisaReadForTrip(reise, request).reason, 'explicit_proposed_context_required')
  const foreign = trip(); foreign.party = [person('other-trip', 'CH')]
  assert.equal(chDeVisaReadForTrip(foreign, request).reason, 'traveller_not_in_trip')
})

test('actual server Workspace and Destination Essentials keep all types unknown with no official attribution', async () => {
  const reise = trip(), before = structuredClone(reise)
  const result = await chDeWorkspaceRefusal(reise, request)
  assert.deepEqual(reise, before)
  assert.deepEqual(result.accountEvaluations, result.evaluations)
  assert.ok(result.evaluations.length > 0)
  for (const type of OFFICIAL_REQUIREMENT_TYPES) {
    assert.ok(result.evaluations.some(e => e.requirementType === type))
  }
  assert.ok(result.evaluations.every(e => e.result === 'unknown' && e.action === null
    && e.visaMode === (e.requirementType === 'visa' ? 'unknown' : null)
    && e.evidence.sourceUrl === null && e.evidence.checkedAt === null && e.evidence.authority === null))
  const essentials = destinationEssentialsAbleiten({ reise, officialEvaluations: result.evaluations })
  assert.equal(essentials.loestSucheAus, false)
  assert.ok(essentials.ziele.every(z => !['required', 'not_required', 'conditional'].includes(z.einreise.lage) && z.einreise.links.length === 0))
  const checklist = officialChecklist({ evaluations: result.evaluations, party: reise.party!,
    slots: reise.party!.map(t => ({ clientRef: t.clientRef, label: 'Synthetic traveller' })) }).flatMap(g => g.eintraege)
  assert.ok(checklist.length > 0)
  assert.ok(checklist.every(e => e.result === 'unknown' && e.aktionen.length === 0))
  assert.equal(requirementsProviderAus(), null)
  for (const env of ['production', 'preview', 'development']) {
    assert.equal(requirementsProviderNachZustand(result.read.provider, { VERCEL_ENV: env, JETNITY_READINESS_AKTIV: 'true' }), null)
  }
  const source = readFileSync('lib/readiness/official-truth-ch-de-first-visa-vertical-1/adapter.ts', 'utf8')
  assert.doesNotMatch(source, /createClient|\.rpc\(|process\.env|fetch\(|https\.request|identityProfiles/)
})

test('native PG16 proves why accepted-store rows cannot be projected through a bypass', { timeout: 120_000 }, async t => {
  const proof = await runChDeAcceptedReadProof()
  assert.equal(proof.status, 'REFUSAL_VERIFIED')
  assert.equal(proof.positiveAcceptedRead, 'NOT_VERIFIED')
  assert.equal(proof.positiveVisaCells, 0)
  assert.equal(proof.checks.length, 9)
  assert.equal(proof.migrationCount, 7)
  assert.equal(proof.positiveStructuralAcceptedRead, 'NOT_VERIFIED')
  assert.equal(proof.reason, 'retained_accepted_custody_contract_missing')
  assert.deepEqual(proof.missingDependencies, ['M1_retained_original_material', 'M2_durable_custody_binding',
    'M3_accepted_review_history', 'M4_current_revocation_history'])
  const result = await chDeWorkspaceRefusal(trip(), { ...request, acceptedStoreProof: proof })
  assert.equal(result.read.reason, 'unsupported_read_request')
  assert.ok(result.evaluations.every(e => e.result === 'unknown'))
  t.diagnostic(JSON.stringify(proof))
})
