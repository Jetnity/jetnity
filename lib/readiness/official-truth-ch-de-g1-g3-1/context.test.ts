import assert from 'node:assert/strict'
import { test } from 'node:test'
import https from 'node:https'
import { chDeVisaReadRequestPruefen } from '../official-truth-ch-de-first-visa-vertical-1/read-request'
import { chDeVisaReadForTrip } from '../official-truth-ch-de-first-visa-vertical-1/adapter'
import { chDeWorkspaceRefusal } from '../../../scripts/official-truth-ch-de-first-visa-vertical-1/workspace-refusal'
import { beispielreise } from '../../reiseaenderung/fixtures/reise'
import { credentialOptionsAus, travellerLegacyLesen } from '../traveller-kontext'
import { partyAusZeilen } from '../reisende'
import { travellerAnfrageStriktLesen } from '../traveller-anfrage'
import { requirementsProviderAus } from '../provider'
import { officialChecklist } from '../official-presentation'
import { OFFICIAL_REQUIREMENT_TYPES, type Trip, type TripTraveller, type TripItem } from '../../../types/trips'

const time = '2026-10-11T00:00:00.000Z'
function person(ref: string, code = 'CH'): TripTraveller {
  return { id: ref, clientRef: ref, label: null, residenceCountryCode: null, createdAt: time, updatedAt: time,
    citizenships: [{ id: `${ref}-c`, clientRef: `${ref}-c`, countryCode: code, createdAt: time, updatedAt: time }],
    documents: [{ id: `${ref}-p`, clientRef: `${ref}-p`, documentType: 'passport', issuingCountryCode: 'CH',
      citizenshipClientRef: `${ref}-c`, expiresOn: null, createdAt: time, updatedAt: time }] }
}
function trip(): Trip {
  return beispielreise({ startDate: '2026-11-01', endDate: '2026-11-08', origin: null, originPlaceId: null,
    stages: [{ id: 'de-stage', position: 1, name: 'Synthetic destination', countryCode: 'DE',
      arrivalDate: '2026-11-01', departureDate: '2026-11-08', latitude: null, longitude: null, placeId: null }],
    days: [], ohneTag: [], travellers: 2, party: [person('synthetic-a'), person('synthetic-b', 'US')] })
}
function request(reise = trip()) {
  return { travellerClientRef: 'synthetic-a', credentialOptionRef: 'synthetic-a:synthetic-a-p',
    destinationCountryCode: 'DE', requirementType: 'visa', proposedContext: {
      evidenceClass: 'user_attestation', tripId: reise.id, tripRevision: reise.revision,
      documentClientRef: 'synthetic-a-p', citizenshipClientRef: 'synthetic-a-c',
      passportClass: 'ordinary', purpose: 'tourism',
      travelDates: { startDate: reise.startDate, endDate: reise.endDate },
      route: { completeness: 'complete', topology: 'direct', originCountryCode: 'CH',
        destinationCountryCode: 'DE', transitCountryCodes: [] as string[] },
    } }
}
function refusal(reise: Trip, input: unknown, reason?: string) {
  const result = chDeVisaReadRequestPruefen(reise, input)
  assert.equal(result.ok, false)
  if (!result.ok && reason) assert.equal(result.reason, reason)
  const read = chDeVisaReadForTrip(reise, input)
  assert.equal(read.contextStatus, 'not_verified')
  assert.equal(read.officialQualification, false)
  assert.equal(read.provider, null)
  assert.equal(read.acceptedRule, null)
}
function flight(): TripItem {
  return { ...beispielreise().days[0]!.items[0]!, id: 'synthetic-flight', kind: 'flight',
    startsOn: '2026-11-01', endsOn: '2026-11-01', routeItinerary: { v: 1, type: 'flight_route_itinerary',
      legs: [{ segments: [{ origin: { airportCode: 'ZRH', countryCode: 'CH', city: null, country: null },
        destination: { airportCode: 'BER', countryCode: 'DE', city: null, country: null },
        departureDate: '2026-11-01', departureTime: '10:00', arrivalDate: '2026-11-01', arrivalTime: '12:00' }] }] } }
}

test('explicit selected scope is representable and immutable, without durable/official qualification', () => {
  const reise = trip(), input = request(reise), before = structuredClone(reise)
  const result = chDeVisaReadRequestPruefen(reise, input)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.status, 'proposed_context_only')
  assert.equal(result.officialQualification, false)
  assert.equal(result.persistedContext, false)
  assert.equal(result.proposedContext.evidenceClass, 'user_attestation')
  assert.ok(Object.isFrozen(result.proposedContext.route))
  input.proposedContext.passportClass = 'diplomatic'
  assert.equal(result.proposedContext.passportClass, 'ordinary')
  assert.deepEqual(reise, before)
})

for (const passportClass of [null, 'unknown', 'diplomatic', 'service', 'emergency', 'other', 'passport', true]) {
  test(`unknown/non-ordinary passport declaration refuses: ${passportClass}`, () => {
    const r = request(); refusal(trip(), { ...r, proposedContext: { ...r.proposedContext, passportClass } })
  })
}
for (const purpose of [null, 'unknown', 'other', 'work', 'study', '', true]) {
  test(`purpose must be explicit tourism: ${purpose}`, () => {
    const r = request(); refusal(trip(), { ...r, proposedContext: { ...r.proposedContext, purpose } })
  })
}
for (const change of [
  { completeness: 'incomplete' }, { completeness: 'unknown' }, { topology: 'indirect' }, { topology: 'unknown' },
  { originCountryCode: null }, { originCountryCode: 'US' }, { destinationCountryCode: null },
  { destinationCountryCode: 'FR' }, { transitCountryCodes: ['FR'] }, { directJourney: true }, { verified: true },
]) test(`explicit complete direct route required: ${JSON.stringify(change)}`, () => {
  const r = request(); Object.assign(r.proposedContext.route, change); refusal(trip(), r)
})
for (const field of ['passportClass', 'purpose', 'route', 'travelDates', 'evidenceClass', 'tripId',
  'tripRevision', 'documentClientRef', 'citizenshipClientRef']) {
  test(`no missing ${field} default`, () => {
    const r = request(); const proposed: Record<string, unknown> = { ...r.proposedContext }; delete proposed[field]
    refusal(trip(), { ...r, proposedContext: proposed })
  })
}
for (const route of [null, {}, { transitCountryCodes: [] }, true]) {
  test(`empty transit is not complete route: ${JSON.stringify(route)}`, () => {
    const r = request(); refusal(trip(), { ...r, proposedContext: { ...r.proposedContext, route } })
  })
}
for (const value of ['official', 'provider', 'account_registry', 'persisted', true]) {
  test(`caller cannot forge evidence class ${value}`, () => {
    const r = request(); refusal(trip(), { ...r, proposedContext: { ...r.proposedContext, evidenceClass: value } })
  })
}
for (const [label, change] of [
  ['false nationality', (r: Trip) => { r.party![0]!.citizenships[0]!.countryCode = 'US' }],
  ['no citizenship', (r: Trip) => { r.party![0]!.citizenships = [] }],
  ['foreign citizenship ref', (r: Trip) => { r.party![0]!.documents[0]!.citizenshipClientRef = 'synthetic-b-c' }],
  ['unlinked passport', (r: Trip) => { r.party![0]!.documents[0]!.citizenshipClientRef = null }],
  ['issuer', (r: Trip) => { r.party![0]!.documents[0]!.issuingCountryCode = 'US' }],
  ['national ID', (r: Trip) => { r.party![0]!.documents[0]!.documentType = 'national_id' }],
  ['duplicate traveller', (r: Trip) => { r.party!.push(structuredClone(r.party![0]!)) }],
  ['duplicate document', (r: Trip) => { r.party![0]!.documents.push(structuredClone(r.party![0]!.documents[0]!)) }],
  ['duplicate citizenship ref', (r: Trip) => { r.party![0]!.citizenships.push(structuredClone(r.party![0]!.citizenships[0]!)) }],
  ['duplicate nationality', (r: Trip) => { r.party![0]!.citizenships.push({ ...r.party![0]!.citizenships[0]!, clientRef: 'duplicate' }) }],
  ['different trip', (r: Trip) => { r.id = 'other-trip' }],
  ['changed revision', (r: Trip) => { r.revision++ }],
  ['unknown stage', (r: Trip) => { r.stages[0]!.countryCode = null }],
  ['foreign stage', (r: Trip) => { r.stages[0]!.countryCode = 'FR' }],
  ['stage before start', (r: Trip) => { r.stages[0]!.arrivalDate = '2026-10-31' }],
  ['stage after end', (r: Trip) => { r.stages[0]!.departureDate = '2026-11-09' }],
  ['stage reversed', (r: Trip) => { r.stages[0]!.departureDate = '2026-10-31' }],
] as const) test(`context conflict: ${label}`, () => { const r = trip(); change(r); refusal(r, request()) })

for (const value of [null, '', '2026-11', '2026-11-01T00:00:00Z', '2026-02-30', '2026-13-01', '2026-11-00']) {
  test(`invalid/truncated trip date ${value}`, () => {
    const r = trip(); r.startDate = value; refusal(r, request(r))
  })
}
test('date reversal and proposal/Trip date mismatch refuse; expiry gives no validity proof', () => {
  const r = trip(); r.endDate = '2026-10-31'; refusal(r, request(r))
  const q = request(); q.proposedContext.travelDates.endDate = '2026-11-09'; refusal(trip(), q)
  for (const expiry of [null, '2000-01-01', '2030-01-01']) {
    const r = trip(); r.party![0]!.documents[0]!.expiresOn = expiry
    const result = chDeVisaReadRequestPruefen(r, request(r))
    assert.equal(result.ok, true); assert.equal(chDeVisaReadForTrip(r, request(r)).officialQualification, false)
  }
})
test('multiple citizens/documents are separate options; explicit selection is permutation invariant', () => {
  const r = trip(), p = r.party![0]!
  p.citizenships.push({ ...p.citizenships[0]!, id: 'other-c', clientRef: 'other-c', countryCode: 'US' })
  p.documents.unshift({ ...p.documents[0]!, id: 'other-p', clientRef: 'other-p', citizenshipClientRef: 'other-c' })
  assert.equal(credentialOptionsAus(p).length, 2)
  assert.equal(chDeVisaReadRequestPruefen(r, request(r)).ok, true)
  refusal(r, { ...request(r), credentialOptionRef: 'synthetic-a:other-p' })
  refusal(r, { ...request(r), credentialOptionRef: 'synthetic-b:synthetic-b-p' })
  const q = request(r); q.proposedContext.documentClientRef = 'other-p'; refusal(r, q)
  q.proposedContext.documentClientRef = 'synthetic-a-p'; q.proposedContext.citizenshipClientRef = 'other-c'; refusal(r, q)
  r.party!.reverse(); p.documents.reverse(); p.citizenships.reverse()
  assert.equal(chDeVisaReadRequestPruefen(r, request(r)).ok, true)
})
test('legacy guest/account serialization never creates ordinary class or a proposal', () => {
  const r = trip(), p = r.party![0]!
  const injected = { ...p, purpose: 'tourism', documents: p.documents.map(d => ({ ...d, passportClass: 'ordinary' })) }
  assert.equal(travellerAnfrageStriktLesen(injected), null)
  const guest = travellerLegacyLesen(JSON.parse(JSON.stringify(injected)))!
  const account = partyAusZeilen([{ id: p.id, client_ref: p.clientRef, created_at: time, updated_at: time,
    trip_traveller_citizenships: p.citizenships.map(c => ({ id: c.id, client_ref: c.clientRef, country_code: c.countryCode, created_at: time, updated_at: time })),
    trip_traveller_documents: p.documents.map(d => ({ id: d.id, client_ref: d.clientRef, document_type: d.documentType,
      issuing_country_code: d.issuingCountryCode, citizenship_id: p.citizenships[0]!.id, expires_on: null, created_at: time, updated_at: time })) }])[0]!
  assert.deepEqual(guest, account)
  const legacy: Record<string, unknown> = request(r); delete legacy.proposedContext
  for (const loaded of [guest, account]) {
    r.party = [loaded]; refusal(r, legacy, 'explicit_proposed_context_required')
    assert.equal(chDeVisaReadRequestPruefen(r, request(r)).ok, true)
    assert.equal('passportClass' in loaded.documents[0]!, false)
  }
})
test('canonical direct flight may corroborate, but never replaces explicit user attestation', () => {
  const r = trip(); r.ohneTag = [flight()]
  assert.equal(chDeVisaReadRequestPruefen(r, request(r)).ok, true)
  const legacy: Record<string, unknown> = request(r); delete legacy.proposedContext; refusal(r, legacy)
})
for (const [label, change] of [
  ['missing itinerary', (i: TripItem) => { i.routeItinerary = null }],
  ['unknown origin', (i: TripItem) => { i.routeItinerary!.legs[0]!.segments[0]!.origin.countryCode = null }],
  ['foreign origin', (i: TripItem) => { i.routeItinerary!.legs[0]!.segments[0]!.origin.countryCode = 'FR' }],
  ['wrong travel day', (i: TripItem) => { i.routeItinerary!.legs[0]!.segments[0]!.departureDate = '2026-11-02' }],
  ['unknown travel day', (i: TripItem) => { i.routeItinerary!.legs[0]!.segments[0]!.arrivalDate = null }],
  ['unrepresented surface leg', (i: TripItem) => { i.routeItinerary!.legs[0]!.segments[0]!.surfaceFromAirportCode = 'CDG' }],
  ['contradictory item date', (i: TripItem) => { i.startsOn = '2026-11-02' }],
  ['indirect same-country connection', (i: TripItem) => { i.routeItinerary!.legs[0]!.segments.push(structuredClone(i.routeItinerary!.legs[0]!.segments[0]!)) }],
  ['additional leg', (i: TripItem) => { i.routeItinerary!.legs.push(structuredClone(i.routeItinerary!.legs[0]!)) }],
  ['unqualified transfer', (i: TripItem) => { i.kind = 'transfer'; i.mobilityChanges = 0 }],
] as const) test(`structured route cannot be overwritten: ${label}`, () => {
  const r = trip(), item = flight(); change(item); r.ohneTag = [item]; refusal(r, request(r))
})
test('extra transport and null route fail even with all DE stages and zero declared transits', () => {
  const r = trip(); r.ohneTag = [flight(), { ...flight(), id: 'second-flight' }]; refusal(r, request(r))
  const q = request(); refusal(trip(), { ...q, proposedContext: { ...q.proposedContext, route: null } })
})
test('nested getters, cycles, symbols, overflows and sensitive/authority fields never enter the context', () => {
  const q = request()
  const getter = Object.defineProperty({ ...q.proposedContext }, 'purpose', { enumerable: true, get() { assert.fail('getter executed') } })
  const cycle: Record<string, unknown> = { ...q.proposedContext }; cycle.self = cycle
  const symbol = { ...q.proposedContext, [Symbol('authority')]: true }
  for (const proposedContext of [getter, cycle, symbol, { ...q.proposedContext, tripId: 'x'.repeat(5000) }]) {
    refusal(trip(), { ...q, proposedContext })
  }
  for (const field of ['passportNumber', 'mrz', 'dateOfBirth', 'fullName', 'health', 'officiallyVerified',
    'acceptedRule', 'acceptedEvidence', 'persisted', 'provider', 'validFrom', 'validUntil']) {
    refusal(trip(), { ...q, proposedContext: { ...q.proposedContext, [field]: true } })
  }
})
test('complete G1 scope still gives only unknown in actual server Workspace and canonical engine', async t => {
  t.mock.method(https, 'request', () => { assert.fail('no network from G1') })
  const r = trip(), before = structuredClone(r)
  const result = await chDeWorkspaceRefusal(r, request(r))
  assert.equal(result.read.contextStatus, 'proposed_context_only')
  assert.equal(result.read.reason, 'trusted_accepted_reader_unavailable')
  assert.ok(result.read.blockers.includes('persisted_regulatory_context_unavailable'))
  assert.ok(result.read.blockers.includes('legal_applicability_unverified'))
  assert.deepEqual(result.evaluations, result.accountEvaluations)
  assert.ok(result.evaluations.length > 0)
  for (const type of OFFICIAL_REQUIREMENT_TYPES) assert.ok(result.evaluations.some(e => e.requirementType === type))
  assert.ok(result.evaluations.every(e => e.result === 'unknown' && e.action === null
    && e.visaMode === (e.requirementType === 'visa' ? 'unknown' : null)
    && e.evidence.sourceUrl === null && e.evidence.checkedAt === null))
  const entries = officialChecklist({ evaluations: result.evaluations, party: r.party!,
    slots: r.party!.map(p => ({ clientRef: p.clientRef, label: 'Synthetic traveller' })) }).flatMap(g => g.eintraege)
  assert.ok(entries.length > 0); assert.ok(entries.every(e => e.result === 'unknown' && e.aktionen.length === 0))
  assert.equal(requirementsProviderAus(), null)
  assert.deepEqual(r, before)
})
