import assert from 'node:assert/strict'
import test from 'node:test'
import { changeImpactFoundationV1 as impact } from './index'
import { LIMITS, type Report } from './contract'
import { fixture, flight, point, atAirport, freeze } from './fixtures'
import { evaluationChanges, temporalProjection, mobilityProjection } from './evaluations'
import { tripZeitpruefung, zeitereignissePruefen, type Zeitereignis, type Zeitgrenze } from '@/lib/trips/trip-timeline-temporal-review-1'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import type { Trip } from '@/types/trips'

const direct = (r: Report) => r.claims.filter(c => c.kind === 'direct_change')
const references = (r: Report, id: string) => r.claims.filter(c => c.kind === 'relation_needs_review' && c.id === JSON.stringify(['relation', id]))
const temporal = (r: Report) => r.claims.filter(c => c.domain === 'temporal')
const changed = (a: Trip) => ({ ...structuredClone(a), revision: a.revision + 1 })
const cast = (value: unknown) => value as Trip

test('T01 identical copies: no fabricated impact; explicit unchecked provider/ownership/safety scope', () => {
  const a = fixture()
  const r = impact(a, structuredClone(a))
  assert.equal(r.snapshotRelation, 'same_snapshot_content')
  assert.deepEqual(r.claims, [])
  assert.deepEqual(r.summary, [])
  assert.equal(r.claimScope, 'stored_plan_snapshots_only')
  assert.equal(r.authority, 'user_stored_plan_not_provider_confirmed')
  for (const s of ['provider_confirmation', 'official_entry_visa_safety', 'global_trip_safety', 'recovery_actions', 'ownership_and_access_authorization']) assert(r.notChecked.includes(s))
  assert.equal(r.evaluation, 'complete') // Complete comparison, never trip readiness.
})

test('T02 Zürich → Panama → Costa Rica: saved flight date/placement changes have only evidenced review relations', () => {
  const a = fixture()
  a.days[0].items = [flight(), point('hotel', { kind: 'stay', endsOn: '2026-10-03' })]
  a.days[1].items = [point('next-day', { dayId: 'day-2', startsOn: '2026-10-02', endsOn: '2026-10-02' })]
  a.days[2].items = [point('unrelated', { kind: 'note', dayId: 'day-3', stageId: 'stage-costa-rica', startsAt: null, endsAt: null })]
  const b = changed(a)
  const f = b.days[0].items.shift()!
  f.dayId = 'day-2'; f.startsOn = f.endsOn = '2026-10-02'
  f.routeItinerary!.legs[0].segments[0].departureDate = '2026-10-02'
  f.routeItinerary!.legs[0].segments[0].arrivalDate = '2026-10-02'
  b.days[1].items.push(f)
  const original = JSON.stringify(a), observed = JSON.stringify(b)
  freeze(a); freeze(b)
  const r = impact(a, b)
  const d = direct(r).find(c => c.refs.some(ref => ref.id === 'flight'))!
  assert(d.reasonCodes.includes('field:startsOn'))
  assert(d.reasonCodes.includes('field:dayId'))
  assert.deepEqual((d.baseline as { fields: object }).fields, { dayId: 'day-1', endsOn: '2026-10-01', startsOn: '2026-10-01' })
  assert.equal(references(r, 'hotel').length, 1)
  assert.equal(references(r, 'next-day').length, 1)
  assert.equal(references(r, 'unrelated').length, 0)
  assert.equal(JSON.stringify(a), original); assert.equal(JSON.stringify(b), observed)
  assert(!JSON.stringify(r).includes('flight_delayed'))
  assert(r.claims.filter(c => c.kind === 'relation_needs_review').every(c => c.reasonCodes.includes('needs_review_not_proven_damage')))
})

test('T03 original possible temporal pair remains possible; unavailable baseline cannot prove a newly confirmed conflict', () => {
  const a = fixture(); a.days[0].items = [atAirport('a'), atAirport('b', { startsAt: '12:00', endsAt: '13:00' })]
  const b = changed(a); b.days[0].items[1].startsAt = '10:30'; b.days[0].items[1].endsAt = '11:30'
  assert.equal(tripZeitpruefung(a).pairs[0].state, 'not_evaluable')
  assert.equal(tripZeitpruefung(b).pairs[0].state, 'possible_conflict')
  const r = impact(a, b), c = temporal(r)[0]
  assert.equal(c.kind, 'unknown')
  assert.equal((c.observed as { state: string }).state, 'possible_conflict')
  assert.equal((c.baseline as { state: string }).state, 'not_evaluable')
  assert.equal(r.evaluation, 'partial')
  const noClock = changed(b); noClock.days[0].items[1].startsAt = null
  assert(!temporal(impact(b, noClock)).some(c => c.kind === 'canonical_evaluation_delta'))
  const differentAirport = changed(b)
  differentAirport.days[0].items[1].destinationPlaceId = 'airport:JFK'
  assert.equal(tripZeitpruefung(differentAirport).pairs[0].state, 'not_evaluable')
  assert.equal(temporal(impact(b, differentAirport))[0].kind, 'unknown')
})

function boundary(time: string): Zeitgrenze {
  return { date: '2026-10-01', time, sourceRef: 'synthetic-math-only', truthClass: 'stored_user',
    resolution: { kind: 'instant_candidates', candidates: [{ epochMinute: Date.parse(`2026-10-01T${time}:00Z`) / 60000, offsetMinutes: 0, choices: {} }] } }
}
function event(id: string, start: string, end: string): Zeitereignis {
  return { id: `local-${id}`, tripId: 'trip-synthetic', itemId: id, dayId: 'day-1', role: 'occupied_interval',
    start: boundary(start), end: boundary(end), reasons: [], subevent: null }
}
test('T04 qualified ORIGINAL kernel conflict removal only on common instant evaluation; no Trip promotion', () => {
  const a = zeitereignissePruefen([event('a', '10:00', '11:00'), event('b', '10:30', '11:30')], 'complete')
  const b = zeitereignissePruefen([event('a', '10:00', '11:00'), event('b', '12:00', '13:00')], 'complete')
  assert.equal(a.pairs[0].state, 'proven_conflict'); assert.equal(b.pairs[0].state, 'no_proven_conflict')
  const claims = evaluationChanges('temporal', 'tripZeitpruefung', temporalProjection(a), temporalProjection(b), 'trip-synthetic')
  assert.equal(claims[0].kind, 'canonical_evaluation_delta')
  assert.equal((claims[0].baseline as { state: string }).state, 'proven_conflict')
  assert.equal((claims[0].observed as { state: string }).state, 'no_proven_conflict')
  assert(claims[0].reasonCodes.includes('no_proven_conflict_is_not_safe'))
  const lost = event('b', '12:00', '13:00'); lost.start.resolution = { kind: 'unknown', reasons: ['missing_timezone'] }
  const unknown = temporalProjection(zeitereignissePruefen([event('a', '10:00', '11:00'), lost], 'complete'))
  assert.equal(evaluationChanges('temporal', 'tripZeitpruefung', temporalProjection(a), unknown, 'trip-synthetic')[0].kind, 'unknown')
  const trip = fixture(); trip.days[0].items = [atAirport('a'), atAirport('b')]
  const later = changed(trip); later.days[0].items[1].startsAt = '12:00'; later.days[0].items[1].endsAt = '13:00'
  assert(!JSON.stringify(impact(trip, later)).includes('"state":"proven_conflict"'))
  assert.equal(temporal(impact(trip, later))[0].kind, 'unknown')
})

test('T05 lodging carries exact original gap projections; unknown stays never mean confirmed nights', () => {
  const a = fixture(), b = changed(a)
  b.ohneTag = [point('stay', { dayId: null, kind: 'stay', startsOn: '2026-10-01', endsOn: '2026-10-03', startsAt: null, endsAt: null })]
  const r = impact(a, b), gap = r.claims.find(c => c.domain === 'lodging')!
  assert.equal(gap.kind, 'canonical_evaluation_delta')
  for (const [side, trip] of [['baseline', a], ['observed', b]] as const) {
    const canonical = unterkunftAbdeckung(trip)
    assert.deepEqual((gap[side] as { luecken: object[] }).luecken, canonical.luecken.map(({ stageName: _name, ...g }) => g))
  }
  const unknown = changed(b); unknown.ohneTag[0].endsOn = null
  unknown.ohneTag[0].bookingStatus = 'booked'; unknown.ohneTag[0].bookingSource = 'user'
  const result = impact(b, unknown)
  assert.equal(result.claims.find(c => c.domain === 'lodging')?.kind, 'unknown')
  assert.equal(result.evaluation, 'partial')
  const missingStageDates = changed(a); missingStageDates.stages[0].arrivalDate = null
  assert.equal(impact(a, missingStageDates).claims.find(c => c.domain === 'lodging')?.kind, 'unknown')
})

test('T06 flight/mobility reflect ORIGINAL open/selected/user-booked/unknown and do not invent covered_by_flight', () => {
  const a = fixture(), b = changed(a); b.days[0].items = [flight()]
  assert.equal(flugAbdeckung(b).abschnitte[0].status, 'selected')
  const r = impact(a, b)
  assert.equal((r.claims.find(c => c.domain === 'flight' && c.kind === 'canonical_evaluation_delta')!.observed as { state: string }).state, 'selected')
  assert.equal(mobilitaetsAbdeckung(b).kanten[0].status, 'unknown')
  assert.equal((r.claims.find(c => c.domain === 'mobility')!.observed as { state: string }).state, 'unknown')
  const booked = changed(b); booked.days[0].items[0].bookingStatus = 'booked'; booked.days[0].items[0].bookingSource = 'user'
  assert.equal((impact(b, booked).claims.find(c => c.domain === 'flight')!.observed as { state: string }).state, 'booked')
  const noOrigin = changed(a); noOrigin.origin = null; noOrigin.originPlaceId = null
  assert.equal(impact(a, noOrigin).claims.find(c => c.domain === 'mobility')?.kind, 'unknown')
  // Type-contract preservation only: current canonical Trip adapter deliberately never emits this state.
  const canonical = mobilitaetsAbdeckung(a)
  canonical.kanten[0].status = 'covered_by_flight'
  const projection = mobilityProjection(canonical)
  assert.equal((projection.rows[0].value as { state: string }).state, 'covered_by_flight')
  assert(!projection.rows[0].reasons.includes('ground_transfer_gap'))
})

test('T07 same Guest/Account model, unique same-kind items, canonical unplanned once; cross-trip fails closed', () => {
  for (const id of ['trip-guest-synthetic', '00000000-0000-4000-8000-000000000001']) {
    const a = fixture(); a.id = id
    a.ohneTag = [point('one', { dayId: null, stageId: null }), point('two', { dayId: null, stageId: null })]
    const b = changed(a); b.ohneTag[1].startsAt = '09:00'
    assert.equal(direct(impact(a, b)).length, 1)
    assert(direct(impact(a, b))[0].refs.every(ref => ref.id === 'two'))
    const c = changed(b); c.id = 'other-trip'
    const blocked = impact(b, c)
    assert.equal(blocked.evaluation, 'blocked'); assert.equal(blocked.identity, null)
    assert.deepEqual(blocked.reasonCodes, ['blocked_cross_trip']); assert.deepEqual(blocked.claims, [])
  }
})

test('T08 same revision edits are unverified, backwards or missing revisions/IDs blocked', () => {
  const a = fixture(), b = structuredClone(a); b.days[0].title = 'Changed private title'
  const r = impact(a, b)
  assert.equal(r.snapshotRelation, 'same_revision_unverified'); assert.equal(r.evaluation, 'partial')
  assert.equal(direct(r).length, 1); assert(!JSON.stringify(r).includes('Changed private title'))
  b.revision = 0; assert.equal(impact(a, b).evaluation, 'blocked')
  a.revision = 3; b.revision = 2; assert.deepEqual(impact(a, b).reasonCodes, ['reverse_revision'])
  for (const k of ['revision', 'id', 'days']) {
    const malformed = { ...a }; Reflect.deleteProperty(malformed, k)
    assert.equal(impact(a, cast(malformed)).evaluation, 'blocked')
  }
})

test('T09 unsafe snapshots rejected before getters/proxy traps; malformed data never reflected', () => {
  const a = fixture(); let invoked = 0
  const getter = structuredClone(a); Object.defineProperty(getter, 'title', { get() { invoked++; throw Error('PRIVATE_SECRET') }, enumerable: true })
  const proxy = new Proxy(a, { ownKeys() { invoked++; throw Error('PRIVATE_SECRET') }, get() { invoked++; throw Error('PRIVATE_SECRET') }, getPrototypeOf() { invoked++; throw Error('PRIVATE_SECRET') } })
  const revoked = Proxy.revocable(a, {}); revoked.revoke()
  const cycle = structuredClone(a); Object.assign(cycle, { cycle })
  const proto = Object.assign(Object.create({ sneaky: 'PRIVATE_SECRET' }), a)
  const nested = fixture(); nested.days[0].items = [new Proxy(point('proxy'), { get() { invoked++; throw Error('PRIVATE_SECRET') } })]
  for (const bad of [getter, proxy, revoked.proxy, cycle, proto, nested, null, 123, { ...a, title: 'PRIVATE_SECRET'.repeat(300) }, { ...a, days: new Array(1_000_000) }]) {
    const r = impact(a, cast(bad)); assert.equal(r.evaluation, 'blocked'); assert(!JSON.stringify(r).includes('PRIVATE_SECRET'))
    assert.equal(r.identity, null); assert.equal(r.claims.length, 0)
  }
  assert.equal(invoked, 0)
  const duplicate = fixture(); duplicate.ohneTag = [point('dup', { dayId: null }), point('dup', { dayId: null })]
  assert.deepEqual(impact(a, duplicate).reasonCodes, ['duplicate_identity'])
  const misplaced = fixture(); misplaced.days[0].items = [point('wrong', { dayId: null })]
  assert.deepEqual(impact(a, misplaced).reasonCodes, ['inconsistent_placement'])
  const conflictingStage = fixture(); conflictingStage.days[0].items = [point('wrong-stage', { stageId: 'stage-costa-rica' })]
  assert.deepEqual(impact(a, conflictingStage).reasonCodes, ['conflicting_stage_assignment'])
  const huge = fixture(); huge.ohneTag = Array.from({ length: 101 }, (_, i) => point(`p${i}`, { dayId: null }))
  assert.equal(impact(a, huge).evaluation, 'blocked')
  const century = fixture(); century.stages[0].departureDate = '9999-01-01'
  const limited = impact(a, century); assert.equal(limited.evaluation, 'incomplete')
  assert.deepEqual(limited.claims, []); assert.equal(limited.counts.unprocessedSnapshots, 2)
  const normalizes = fixture(); normalizes.title = ' padded title '
  assert.deepEqual(impact(a, normalizes).reasonCodes, ['noncanonical_snapshot'])
})

test('T10 deterministic report under graph permutation, frozen inputs, repeats, different clock/timezone/locale', () => {
  const a = fixture(); a.days[0].items = [point('z'), point('a')]
  const b = changed(a); b.days[0].items[0].startsAt = '09:00'
  const shuffledA = structuredClone(a), shuffledB = structuredClone(b)
  for (const t of [shuffledA, shuffledB]) { t.stages.reverse(); t.days.reverse(); t.days.forEach(d => d.items.reverse()) }
  const r = impact(a, b)
  freeze(a); freeze(b)
  const now = Date.now, locale = String.prototype.localeCompare
  Date.now = () => { throw Error('ambient clock') }
  String.prototype.localeCompare = () => { throw Error('ambient locale') }
  try {
    assert.deepEqual(impact(a, b), r); assert.deepEqual(impact(shuffledA, shuffledB), r)
    assert.deepEqual(impact(a, a).claims, [])
  } finally { Date.now = now; String.prototype.localeCompare = locale }
  const sameRevision = structuredClone(b); sameRevision.revision = a.revision
  assert.equal(impact(a, sameRevision).snapshotRelation, 'same_revision_unverified')
})

test('T11 exact relations aggregate; unrelated and unknown links are never guessed', () => {
  const a = fixture()
  a.days[0].items = [point('one'), point('two'), point('related')]
  a.days[2].items = [point('independent', { dayId: 'day-3', stageId: 'stage-costa-rica' })]
  a.ohneTag = [point('unknown-link', { dayId: null, stageId: null })]
  const b = changed(a); b.days[0].items[0].startsAt = '08:00'; b.days[0].items[1].startsAt = '09:00'
  const r = impact(a, b)
  assert.equal(references(r, 'related').length, 1)
  assert.equal(references(r, 'independent').length, 0)
  assert.equal(references(r, 'unknown-link').length, 0)
  assert.equal(new Set(r.claims.map(c => c.id)).size, r.claims.length)
  const labelsOnly = changed(a); labelsOnly.days[0].items[0].title = 'New title'
  assert.equal(impact(a, labelsOnly).claims.filter(c => c.kind === 'relation_needs_review').length, 0)
})

test('T09/T10 output cap retains explicit counts and never silently completes a truncated report', () => {
  const a = fixture(); a.days[0].items = Array.from({ length: 45 }, (_, i) => atAirport(`t-${i}`))
  const b = changed(a)
  b.days[0].items.slice(0, 22).forEach((p, i) => { p.startsAt = '12:00'; p.endsAt = '13:00'; p.position = i + 1 })
  const r = impact(a, b)
  assert.equal(r.evaluation, 'incomplete'); assert(r.reasonCodes.includes('output_limit'))
  assert(r.counts.omitted > 0); assert.equal(r.counts.claims, r.counts.returned + r.counts.omitted)
  assert(r.claims.length <= LIMITS.claims); assert(JSON.stringify(r).length <= LIMITS.outputCharacters)
  assert(r.claims.every(c => c.refs.length <= LIMITS.refsPerClaim))
})

test('T04/T10 changed segment-local indices are unknown, never stable pair identities', () => {
  const a = fixture(); a.days[0].items = [flight(), atAirport('other')]
  const b = changed(a); b.days[0].items[0].routeItinerary!.legs[0].segments.push(structuredClone(b.days[0].items[0].routeItinerary!.legs[0].segments[0]))
  const r = impact(a, b)
  assert(temporal(r).every(c => c.kind === 'unknown'))
  assert(r.domains.find(d => d.domain === 'temporal')!.observed.reasonCodes.includes('snapshot_local_subevent_identity'))
})

test('D4 canonical failure invalidates BOTH sides of the domain comparison, preserves no false-green rows', () => {
  const good = temporalProjection(zeitereignissePruefen([event('a', '10:00', '11:00'), event('b', '10:30', '11:30')], 'complete'))
  const failed = temporalProjection(zeitereignissePruefen([], 'error', ['evaluation_error']))
  const claims = evaluationChanges('temporal', 'tripZeitpruefung', good, failed, 'trip-synthetic')
  assert.equal(claims.length, 1); assert.equal(claims[0].kind, 'unknown')
  assert(claims[0].reasonCodes.includes('atomic_domain_comparison_unavailable'))
})

test('T02/T07 day/stage additions, removals and reassignment are precise direct evidence', () => {
  const a = fixture(); a.days[0].items = [point('moving')]
  const b = changed(a)
  b.stages.push({ ...b.stages[1], id: 'stage-new', position: 3, name: 'Synthetic stop' })
  b.days.push({ ...b.days[2], id: 'day-new', dayIndex: 4, dayDate: '2026-10-04', stageId: 'stage-new', items: [] })
  b.days[0].stageId = 'stage-costa-rica'
  const moving = b.days[0].items.pop()!; moving.dayId = null; moving.stageId = null; b.ohneTag.push(moving)
  const r = impact(a, b)
  assert(direct(r).some(c => c.reasonCodes.includes('field:added') && c.refs.some(ref => ref.id === 'day-new')))
  assert(direct(r).some(c => c.reasonCodes.includes('field:added') && c.refs.some(ref => ref.id === 'stage-new')))
  assert(direct(r).some(c => c.reasonCodes.includes('field:stageId') && c.refs.some(ref => ref.id === 'day-1')))
  assert.equal(direct(r).filter(c => c.refs.some(ref => ref.id === 'moving')).length, 1)
  const removed = changed(a); removed.days = removed.days.slice(1)
  assert(direct(impact(a, removed)).some(c => c.reasonCodes.includes('field:removed') && c.refs.some(ref => ref.id === 'moving')))
})

test('T09 expanded itinerary work budget is checked before pair evaluation', () => {
  const a = fixture(), b = changed(a)
  for (let i = 0; i < 3; i++) {
    const f = flight(`many-${i}`)
    f.routeItinerary!.legs = Array.from({ length: 6 }, () => ({ segments: Array.from({ length: 8 }, () => structuredClone(f.routeItinerary!.legs[0].segments[0])) }))
    b.days[0].items.push(f)
  }
  const r = impact(a, b)
  assert.equal(r.evaluation, 'incomplete'); assert(r.reasonCodes.includes('canonical_work_limit'))
  assert.deepEqual(r.domains, []); assert.deepEqual(r.claims, [])
})

test('T11 meaningful canonical pair links different stages, unevaluable pairs do not', () => {
  const a = fixture(); a.days[0].items = [atAirport('a')]
  a.days[2].items = [atAirport('b', { dayId: 'day-3', stageId: 'stage-costa-rica' })]
  const b = changed(a); b.days[0].items[0].startsAt = '09:30'
  const relation = references(impact(a, b), 'b')[0]
  assert(relation.reasonCodes.includes('canonical_time_pair_item_ids'))
  assert(!relation.reasonCodes.includes('same_persistent_stage_id'))
  assert(relation.source.includes('tripZeitpruefung'))
  const removedContext = changed(a)
  removedContext.days[0].items[0].originPlaceId = null
  removedContext.days[0].items[0].destinationPlaceId = null
  removedContext.days[0].items[0].mobilityEvidence = 'user' // mobilityMode remains a user fact.
  const changedUnknown = changed(removedContext); changedUnknown.days[0].items[0].startsAt = '08:00'
  assert.equal(references(impact(removedContext, changedUnknown), 'b').length, 0)
})

test('T11 stage relation through an explicitly persisted parent day also carries across days', () => {
  const a = fixture()
  a.days[0].items = [point('cause', { stageId: null })]
  a.days[1].items = [point('related', { stageId: null, dayId: 'day-2', kind: 'note', startsAt: null, endsAt: null })]
  a.days[2].items = [point('unrelated', { stageId: null, dayId: 'day-3', kind: 'note', startsAt: null, endsAt: null })]
  const b = changed(a); b.days[0].items[0].startsAt = '09:00'
  const result = impact(a, b)
  assert.equal(references(result, 'related').length, 1)
  assert(references(result, 'related')[0].reasonCodes.includes('same_persistent_stage_id'))
  assert(references(result, 'related')[0].refs.some(ref => ref.entity === 'stage' && ref.id === 'stage-panama'))
  assert.equal(references(result, 'unrelated').length, 0)
})
