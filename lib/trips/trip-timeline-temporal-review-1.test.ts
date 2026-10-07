import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { tripZeitpruefung, zeitereignissePruefen, type Zeitereignis, type Zeitgrenze } from '@/lib/trips/trip-timeline-temporal-review-1'
import type { TripItem } from '@/types/trips'

// Synthetic mathematical qualification only. No provider, traveller or production admission proof.
const date = '2026-10-06'
function boundary(time: string | null, day: string | null = date, offset = 0): Zeitgrenze {
  return { date: day, time, sourceRef: `fixture:${day}:${time}`, truthClass: 'stored_user', resolution: time && day
    ? { kind: 'instant_candidates', candidates: [{ epochMinute: Date.parse(`${day}T${time}:00Z`) / 60000 - offset, offsetMinutes: offset, choices: {} }] }
    : { kind: 'unknown', reasons: [] } }
}
function event(id: string, start = '10:00', end: string | null = '11:00'): Zeitereignis {
  return { id, tripId: 'synthetic-trip', itemId: id, dayId: 'day-1', role: end ? 'occupied_interval' : 'start_only',
    start: boundary(start), end: boundary(end, end ? date : null), reasons: [], subevent: null }
}
function civil(event: Zeitereignis, context = 'airport:ZRH'): Zeitereignis {
  return { ...event, start: { ...event.start, resolution: { kind: 'civil_only', contextRef: context } },
    end: { ...event.end, resolution: { kind: 'civil_only', contextRef: context } } }
}
function pair(a: Zeitereignis, b: Zeitereignis) { return zeitereignissePruefen([a, b], 'complete').pairs[0] }
function estimateRange(earliest: string, latest: string): Zeitgrenze {
  return { ...boundary(earliest), truthClass: 'estimate', resolution: {
    kind: 'estimate_range', earliest: Date.parse(`${date}T${earliest}:00Z`) / 60000,
    latest: Date.parse(`${date}T${latest}:00Z`) / 60000, methodRef: 'synthetic-method/v1',
  } }
}
function estimatedAnchor(id: string, earliest: string, latest: string): Zeitereignis {
  return { ...event(id, earliest, null), start: estimateRange(earliest, latest) }
}
function item(id: string, overrides: Partial<TripItem> = {}): TripItem {
  return { ...beispielreise().days[0].items[0], id, dayId: 'day-1', stageId: null, kind: 'activity', title: id, note: null,
    startsOn: date, startsAt: '10:00', endsOn: date, endsAt: '11:00', routeItinerary: null,
    originPlaceId: null, destinationPlaceId: null, ...overrides }
}
function graph(items: TripItem[]) {
  const trip = beispielreise()
  trip.days = [{ ...trip.days[0], dayDate: date, items }]
  trip.ohneTag = []
  return trip
}
function flight(id = 'flight'): TripItem {
  const airport = (airportCode: string) => ({ airportCode, countryCode: null, city: null, country: null })
  return item(id, { kind: 'flight', startsOn: null, startsAt: null, endsOn: null, endsAt: null,
    routeItinerary: { v: 1, type: 'flight_route_itinerary', legs: [{ segments: [{
      origin: airport('NRT'), destination: airport('LAX'), departureDate: '2026-10-07', departureTime: '00:30', arrivalDate: date, arrivalTime: '18:30',
    }] }] } })
}
function freeze(value: object) { Object.values(value).forEach(v => { if (v && typeof v === 'object') freeze(v) }); Object.freeze(value) }

test('qualified overlapping, disjoint and half-open touching intervals; scoped exact minutes', () => {
  const a = event('a')
  assert.equal(pair(a, event('b', '10:30', '11:30')).state, 'proven_conflict')
  assert.equal(pair(a, event('b', '10:30', '11:30')).overlapMinutes, 30)
  for (const start of ['11:00', '12:00']) assert.equal(pair(a, event('b', start, '13:00')).state, 'no_proven_conflict')
  assert.equal(pair(a, event('b')).claimScope, 'saved_plan')
  assert.equal(zeitereignissePruefen([a, event('b')], 'complete').coverage.state, 'complete')
})

test('start-only: equal start / anchor inside support possible; missing end never blankets later points', () => {
  const a = event('a', '10:00', null)
  for (const b of [event('b'), event('b', '10:00', null), event('b', '09:00', '11:00')]) {
    assert.equal(pair(a, b).state, 'possible_conflict')
    assert(pair(a, b).reasons.includes('missing_end'))
    assert.equal(pair(a, b).overlapMinutes, null)
  }
  assert.equal(pair(a, event('later', '11:00', '12:00')).state, 'not_evaluable')
  assert.equal(pair(a, event('earlier', '09:00', '10:00')).state, 'not_evaluable')
  assert.equal(zeitereignissePruefen([a, event('b')], 'complete').coverage.state, 'partial')
})

test('end-only and explicit milestones are not fabricated occupied intervals', () => {
  const end = { ...event('end'), role: 'end_only' as const, start: boundary(null, null) }
  assert.equal(pair(end, event('b')).state, 'not_evaluable')
  const milestone = { ...event('milestone', '10:30', null), role: 'milestone' as const }
  assert.equal(pair(milestone, event('b')).state, 'possible_conflict')
  assert.equal(pair(milestone, event('b')).overlapMinutes, null)
})

test('explicit midnight and qualified Date-Line duration; missing end date never means tomorrow', () => {
  const a = { ...event('a', '23:30', '00:30'), end: boundary('00:30', '2026-10-07') }
  const b = { ...event('b'), start: boundary('00:15', '2026-10-07'), end: boundary('01:00', '2026-10-07') }
  assert.equal(pair(a, b).overlapMinutes, 15)
  assert.equal(pair({ ...a, end: boundary('00:30', null) }, b).state, 'not_evaluable')
  const dateline = { ...event('dateline'), start: boundary('00:30', '2026-10-07', 540), end: boundary('18:30', date, -420) }
  const middle = event('middle', '16:00', '17:00')
  assert.equal(pair(dateline, middle).state, 'proven_conflict')
  assert.equal(pair(dateline, middle).overlapMinutes, 60)
})

test('civil overlap requires shared identity, remains possible; civil disjoint is not physical disjointness', () => {
  assert.equal(pair(civil(event('a')), civil(event('b', '10:30', '12:00'))).state, 'possible_conflict')
  assert.equal(pair(civil(event('a')), civil(event('b'))).comparisonBasis, 'civil_only')
  assert.equal(pair(civil(event('a')), civil(event('b'))).overlapMinutes, null)
  assert.equal(pair(civil(event('a')), civil(event('b', '11:00', '12:00'))).state, 'not_evaluable')
  assert.equal(pair(civil(event('a')), civil(event('b'), 'airport:JFK')).state, 'not_evaluable')
})

function ambiguous(event: Zeitereignis): Zeitereignis {
  const candidates = (value: Zeitgrenze): Zeitgrenze => ({ ...value, resolution: { kind: 'instant_candidates', candidates: [0, 60].map(offsetMinutes => ({
    epochMinute: Date.parse(`${value.date}T${value.time}:00Z`) / 60000 - offsetMinutes,
    offsetMinutes, choices: { fold: String(offsetMinutes) },
  })) } })
  return { ...event, start: candidates(event.start), end: candidates(event.end) }
}

test('finite ambiguity retains correlations, universal overlap/disjoint and existential possibility', () => {
  const a = ambiguous(event('a', '01:30', '02:00'))
  assert.equal(pair(a, event('b', '01:45', '02:15')).state, 'possible_conflict')
  assert.equal(pair(a, ambiguous(event('b', '01:45', '02:15'))).state, 'proven_conflict')
  assert.equal(pair(a, ambiguous(event('b', '02:00', '02:30'))).state, 'no_proven_conflict')
  assert.equal(pair(a, ambiguous(event('b', '01:45', '02:15'))).overlapMinutes, 15)
  // Cross products would invent nonpositive durations; the supplied shared fold excludes only those combinations.
  const uncorrelated = structuredClone(a)
  if (uncorrelated.end.resolution.kind === 'instant_candidates') for (const c of uncorrelated.end.resolution.candidates) c.choices = {}
  assert.equal(pair(uncorrelated, event('b')).state, 'not_evaluable')
})

test('empty, mismatched and inconsistent assignments cannot become vacuous positive proofs', () => {
  const a = event('a')
  a.start.resolution = { kind: 'instant_candidates', candidates: [] }
  assert.equal(pair(a, event('b')).state, 'not_evaluable')
  const fold = ambiguous(event('fold', '01:30', '02:00'))
  if (fold.end.resolution.kind === 'instant_candidates') fold.end.resolution = { ...fold.end.resolution, candidates: fold.end.resolution.candidates.slice(0, 1) }
  assert.equal(pair(fold, event('b')).state, 'not_evaluable')
  const contradictory = event('contradictory')
  if (contradictory.start.resolution.kind === 'instant_candidates') contradictory.start.resolution.candidates[0].epochMinute++
  assert.equal(pair(contradictory, event('b')).state, 'not_evaluable')
  assert(pair(contradictory, event('b')).reasons.includes('conflicting_evidence'))
  assert.equal(pair({ ...event('constrained'), durationMinutes: 30 }, event('b')).state, 'not_evaluable')
  assert.equal(pair({ ...event('constrained'), durationMinutes: 60 }, event('b')).state, 'proven_conflict')
  const expired = event('expired')
  expired.start.resolution = { kind: 'unknown', reasons: ['stale_evidence'] }
  assert.equal(pair(expired, event('b')).state, 'not_evaluable')
  const gap = event('gap')
  gap.start.resolution = { kind: 'unknown', reasons: ['invalid_local_time'] }
  assert.equal(pair(gap, event('b')).state, 'not_evaluable')
})

test('estimates never prove overlap or disjointness; bounded supported overlap only', () => {
  const estimate = (time: string): Zeitgrenze => ({ ...boundary(time), truthClass: 'estimate', resolution: {
    kind: 'estimate_range', earliest: Date.parse(`${date}T${time}:00Z`) / 60000,
    latest: Date.parse(`${date}T${time}:00Z`) / 60000 + 10, methodRef: 'synthetic-method/v1',
  } })
  const a = { ...event('a'), start: estimate('10:00'), end: estimate('11:00') }
  assert.equal(pair(a, event('b', '10:30', '11:30')).state, 'possible_conflict')
  assert.equal(pair(a, event('b', '12:00', '13:00')).state, 'not_evaluable')
  const tagged = event('tagged'); tagged.start.truthClass = 'estimate'
  assert.equal(pair(tagged, event('b')).state, 'possible_conflict')
  if (a.start.resolution.kind === 'estimate_range') a.start.resolution.latest += 100
  assert.equal(pair(a, event('b')).state, 'not_evaluable')
})

test('closed estimate range: start-only interior witness overlaps an occupied interval', () => {
  const a = estimatedAnchor('estimated', '10:00', '11:00')
  const before = structuredClone(a)
  for (const result of [pair(a, event('occupied', '10:20', '10:40')), pair(event('occupied', '10:20', '10:40'), a)]) {
    assert.equal(result.state, 'possible_conflict')
    assert.equal(result.comparisonBasis, 'estimate')
    assert.equal(result.overlapMinutes, null)
    assert(result.reasons.includes('missing_end'))
    assert(result.reasons.includes('estimate_only'))
  }
  assert.deepEqual(a, before)
})

test('closed estimate range: milestone interior witness is possible without inventing an end', () => {
  const a = { ...estimatedAnchor('milestone', '10:00', '11:00'), role: 'milestone' as const }
  const result = pair(a, event('occupied', '10:20', '10:40'))
  assert.equal(result.state, 'possible_conflict')
  assert.equal(result.overlapMinutes, null)
  assert(!result.reasons.includes('missing_end'))
  assert.equal(a.end.time, null)
})

test('closed estimate range: two anchors can intersect without sharing any endpoints', () => {
  const a = estimatedAnchor('a', '10:00', '11:00')
  for (const b of [estimatedAnchor('nested', '10:20', '10:40'), estimatedAnchor('crossing', '10:30', '11:30'), event('exact', '10:30', null)]) {
    assert.equal(pair(a, b).state, 'possible_conflict')
    assert.equal(pair(a, b).overlapMinutes, null)
  }
})

test('closed estimate range: inclusive anchor bounds versus half-open occupation', () => {
  const occupied = event('occupied', '10:20', '10:40')
  for (const role of ['start_only', 'milestone'] as const) {
    for (const [earliest, latest, expected] of [
      ['10:00', '10:20', 'possible_conflict'], ['10:20', '10:20', 'possible_conflict'],
      ['10:40', '11:00', 'not_evaluable'], ['10:40', '10:40', 'not_evaluable'],
    ] as const) assert.equal(pair({ ...estimatedAnchor('anchor', earliest, latest), role }, occupied).state, expected)
  }
  assert.equal(pair(estimatedAnchor('a', '10:00', '11:00'), estimatedAnchor('b', '11:00', '12:00')).state, 'possible_conflict')
  const estimatedSpan = { ...event('span'), start: estimateRange('10:00', '10:10'), end: estimateRange('10:30', '10:40') }
  assert.equal(pair(estimatedSpan, event('at-end', '10:40', null)).state, 'not_evaluable')
  assert.equal(pair(estimatedSpan, event('inside', '10:39', null)).state, 'possible_conflict')
})

test('closed estimate range: separated anchors and occupied spans never prove disjointness', () => {
  const a = estimatedAnchor('a', '10:00', '10:10')
  const span = { ...event('span'), start: estimateRange('10:00', '10:10'), end: estimateRange('11:00', '11:10') }
  for (const result of [pair(a, estimatedAnchor('b', '10:20', '10:40')), pair(a, event('b', '10:20', '10:40')),
    pair(span, event('later', '11:10', '12:00'))]) {
    assert.equal(result.state, 'not_evaluable')
    assert.equal(result.comparisonBasis, 'estimate')
    assert.equal(result.overlapMinutes, null)
  }
  assert.equal(pair(span, event('overlap', '10:20', '10:40')).state, 'possible_conflict')
})

test('closed estimate range: huge ranges use bounded existence checks, not minute enumeration', () => {
  const a = estimatedAnchor('wide', '10:00', '11:00')
  a.start.resolution = { kind: 'estimate_range', earliest: -1_000_000_000_000, latest: 1_000_000_000_000, methodRef: 'synthetic-wide/v1' }
  assert.equal(pair(a, event('inside', '10:20', '10:40')).state, 'possible_conflict')
})

test('closed estimate range: finite alternatives retain holes and civil contexts remain distinct', () => {
  const a = estimatedAnchor('a', '10:20', '10:40')
  const b = event('finite', '10:00', null)
  const base = Date.parse(`${date}T10:00:00Z`) / 60000
  b.start.resolution = { kind: 'instant_candidates', candidates: [0, -60].map(offsetMinutes => ({
    epochMinute: base - offsetMinutes, offsetMinutes, choices: { fold: String(offsetMinutes) },
  })) }
  assert.equal(pair(a, b).state, 'not_evaluable') // Neither 10:00 nor 11:00 lies in the estimate.
  assert.equal(pair(a, civil(event('civil', '10:20', '10:40'))).state, 'not_evaluable')
})

test('closed estimate range: invalid assignments and contradictory explicit duration fail closed', () => {
  const a = { ...event('a'), start: estimateRange('10:00', '11:00'), end: estimateRange('10:30', '12:00') }
  assert(pair(a, event('b')).reasons.includes('conflicting_evidence'))
  const varying = { ...event('varying'), start: estimateRange('10:00', '10:10'), end: estimateRange('11:00', '11:10'), durationMinutes: 60 }
  assert.equal(pair(varying, event('b')).state, 'not_evaluable')
  const singleton = { ...varying, start: estimateRange('10:00', '10:00'), end: estimateRange('11:00', '11:00') }
  assert.equal(pair(singleton, event('b')).state, 'possible_conflict')
  assert.equal(pair(estimatedAnchor('reversed', '11:00', '10:00'), event('b')).state, 'not_evaluable')
})

test('invalid Gregorian dates, invalid clocks and nonpositive occupied intervals fail closed', () => {
  for (const day of ['2026-02-29', '2026-02-30', '1900-02-29', '2026-13-01', '2026-10-00', '0000-01-01', '2026-1-01', '2026-10-06\n']) {
    assert.equal(pair({ ...event('a'), start: boundary('10:00', day) }, event('b')).state, 'not_evaluable', day)
  }
  for (const time of ['24:00', '10:60', '9:00', ' 10:00', '10:00Z', '10:00\n']) {
    assert.equal(pair({ ...event('a'), start: boundary(time) }, event('b')).state, 'not_evaluable', time)
  }
  assert.equal(pair(event('a', '10:00', '10:00'), event('b')).state, 'not_evaluable')
  assert.equal(pair(event('a', '11:00', '10:00'), event('b')).state, 'not_evaluable')
  const leap = { ...event('leap'), start: boundary('10:00', '2000-02-29'), end: boundary('11:00', '2000-02-29') }
  assert.equal(pair(leap, { ...leap, id: 'other', itemId: 'other' }).state, 'proven_conflict')
})

test('nonadjacent and adjacent-day events compared from full inventory; coverage independent of findings', () => {
  const result = zeitereignissePruefen([event('a', '09:00', '12:00'), event('b', '15:00', '16:00'), event('c', '10:00', '11:00')], 'complete')
  assert.equal(result.pairs.length, 3)
  assert.equal(result.pairs.find(p => p.itemIds.includes('a') && p.itemIds.includes('c'))?.state, 'proven_conflict')
  const partial = zeitereignissePruefen([event('a'), event('b')], 'partial')
  assert.equal(partial.pairs[0].state, 'proven_conflict')
  assert.equal(partial.coverage.state, 'partial')
  for (const state of ['not_run', 'unavailable', 'error'] as const) assert.equal(zeitereignissePruefen([], state).coverage.state, state)
  assert.equal(zeitereignissePruefen([], 'complete').coverage.state, 'not_run')
})

test('kernel deduplicates identity and rejects conflicting identities; input permutations are stable', () => {
  const a = event('a'), b = event('b'), changed = event('a', '11:00', '12:00')
  assert.equal(zeitereignissePruefen([a, a, b], 'complete').pairs.length, 1)
  const result = zeitereignissePruefen([a, changed, b], 'complete')
  assert.equal(result.pairs[0].state, 'not_evaluable')
  assert.deepEqual(result, zeitereignissePruefen([b, changed, a], 'complete'))
  assert.equal(zeitereignissePruefen([a, { ...b, tripId: 'foreign' }], 'complete').coverage.state, 'error')
})

test('live adapter rejects caller-supplied zone/instant/verified and shared display-day context', () => {
  const trip = graph([item('a'), item('b')])
  Object.assign(trip.days[0].items[0], { timezone: 'Europe/Zurich', verified: true, instant: 0, resolution: boundary('10:00').resolution })
  const result = tripZeitpruefung(trip)
  assert.equal(result.pairs[0].state, 'not_evaluable')
  assert.equal(result.coverage.state, 'unavailable')
  assert(result.coverage.reasons.includes('missing_clock_context'))
  assert(result.events.every(e => e.start.truthClass === 'stored_user' && e.start.resolution.kind === 'unknown'))
})

test('live same canonical airport supports civil possible; same label/country/different airport cannot', () => {
  const atAirport = (id: string) => item(id, { kind: 'transfer', mobilityEvidence: 'user', originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH', originName: 'Same name', destinationName: 'Same name' })
  const trip = graph([atAirport('a'), atAirport('b')])
  assert.equal(tripZeitpruefung(trip).pairs[0].state, 'possible_conflict')
  trip.days[0].items[1].originPlaceId = 'airport:JFK'
  trip.days[0].items[1].destinationPlaceId = 'airport:JFK'
  assert.equal(tripZeitpruefung(trip).pairs[0].state, 'not_evaluable')
  for (const p of trip.days[0].items) { p.originPlaceId = null; p.destinationPlaceId = null }
  assert.equal(tripZeitpruefung(trip).pairs[0].state, 'not_evaluable')
})

test('real Trip Date-Line itinerary preserves exact boundaries, canonical refs, and ignores summary', () => {
  const f = flight()
  const trip = graph([f, item('b')])
  const result = tripZeitpruefung(trip)
  const projected = result.events.find(e => e.itemId === f.id)!
  assert.equal(projected.start.date, '2026-10-07')
  assert.equal(projected.end.date, date)
  assert.equal(projected.end.time, '18:30')
  assert.equal(result.events.length, 2)
  assert.equal(result.pairs[0].state, 'not_evaluable')
  assert(!projected.reasons.includes('conflicting_evidence'))
  const before = projected.subevent!.itineraryRef
  f.routeItinerary!.legs[0].segments[0].departureTime = '00:45'
  assert.notEqual(tripZeitpruefung(trip).events.find(e => e.itemId === f.id)!.subevent!.itineraryRef, before)
  f.routeItinerary!.legs[0].segments[0].arrivalDate = '2026-02-30'
  assert(tripZeitpruefung(trip).coverage.reasons.includes('conflicting_evidence'))
})

test('availability, free text, date-only, flexible and unplanned remain distinct without occupied pairs', () => {
  const trip = graph([item('hotel', { kind: 'stay' }), item('rental', { kind: 'rental_car' }), item('note', { kind: 'note' }),
    item('dated', { startsAt: null, endsAt: null }), item('flex', { startsOn: null, startsAt: null, endsOn: null, endsAt: null })])
  trip.ohneTag = [item('unplanned', { dayId: null, startsOn: null, startsAt: null, endsOn: null, endsAt: null })]
  const result = tripZeitpruefung(trip)
  assert.deepEqual(result.events.map(e => e.role).sort(), ['availability_span', 'availability_span', 'date_only', 'flexible', 'unscheduled', 'unsupported'].sort())
  assert.equal(result.pairs.length, 0)
  assert.notEqual(result.coverage.state, 'complete')
  assert.equal(tripZeitpruefung(graph([item('hotel', { kind: 'stay' })])).coverage.state, 'not_run')
  assert.deepEqual(tripZeitpruefung(graph([item('hotel', { kind: 'stay', startsAt: null, endsAt: null })])).coverage.reasons, [])
})

test('display day never fills missing date; protected date mismatch retained', () => {
  const trip = graph([item('missing', { startsOn: null }), item('different', { startsOn: '2026-10-05' })])
  const result = tripZeitpruefung(trip)
  assert.equal(result.events.find(e => e.itemId === 'missing')!.start.date, null)
  assert(result.coverage.reasons.includes('missing_date'))
  assert(result.events.find(e => e.itemId === 'different')!.reasons.includes('date_mismatch'))
})

test('canonical unplanned inventory is included even if second projection is partial; duplicate payloads cannot hide', () => {
  const trip = graph([item('a')]); trip.ohneTag = [item('u', { dayId: null })]
  const normal = tripZeitpruefung(trip)
  assert.equal(normal.events.length, 2)
  assert.equal(normal.pairs.length, 1)
  assert.equal(tripZeitpruefung(trip, []).events.length, 2)
  assert(tripZeitpruefung(trip, []).coverage.reasons.includes('incomplete_snapshot'))
  const conflicting = tripZeitpruefung(trip, [{ ...trip.ohneTag[0], startsAt: '12:00' }])
  assert(conflicting.coverage.reasons.includes('duplicate_identity'))
  assert.equal(conflicting.pairs[0].state, 'not_evaluable')
})

test('immutable graph and deterministic full projection under graph permutation, Guest/Account parity', () => {
  const trip = graph([item('b'), item('a'), flight()])
  trip.days.push({ ...trip.days[0], id: 'day-2', dayIndex: 2, items: [item('other', { dayId: 'day-2' })] })
  const before = structuredClone(trip)
  const account = structuredClone(trip)
  account.days.reverse(); account.days.forEach(d => d.items.reverse()); account.stages.reverse()
  freeze(trip)
  assert.deepEqual(tripZeitpruefung(trip), tripZeitpruefung(account))
  assert.deepEqual(trip, before)
})

test('clock-only edit, deletion, move and booking change recompute without revision shortcut', () => {
  const trip = graph([item('a', { kind: 'transfer', mobilityEvidence: 'user', originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH' }),
    item('b', { kind: 'transfer', mobilityEvidence: 'user', originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH' })])
  const revision = trip.revision
  assert.equal(tripZeitpruefung(trip).pairs[0].state, 'possible_conflict')
  trip.days[0].items[1].startsAt = '12:00'; trip.days[0].items[1].endsAt = '13:00'
  assert.equal(tripZeitpruefung(trip).pairs[0].state, 'not_evaluable')
  trip.days[0].items[1].bookingStatus = 'booked'
  assert.equal(tripZeitpruefung(trip).pairs[0].state, 'not_evaluable')
  const moved = trip.days[0].items.pop()!; moved.dayId = null; trip.ohneTag.push(moved)
  assert.equal(tripZeitpruefung(trip).events.find(e => e.itemId === 'b')!.dayId, null)
  trip.ohneTag = []
  assert.equal(tripZeitpruefung(trip).pairs.length, 0)
  assert.equal(tripZeitpruefung(trip).events.length, 1)
  assert.equal(trip.revision, revision)
})

test('event and pair overload cannot silently report complete; counts include every unassessed pair', () => {
  const events = Array.from({ length: 150 }, (_, i) => event(String(i)))
  const result = zeitereignissePruefen(events, 'complete')
  assert.equal(result.coverage.eligiblePairs, 11175)
  assert.equal(result.coverage.attemptedPairs, 10000)
  assert.equal(result.coverage.unevaluablePairs, 1175)
  assert.equal(result.coverage.state, 'partial')
  assert(result.coverage.reasons.includes('work_limit'))
  assert.equal(zeitereignissePruefen(Array.from({ length: 1001 }, (_, i) => event(String(i))), 'complete').coverage.state, 'error')
  assert.equal(tripZeitpruefung(graph(Array.from({ length: 1001 }, (_, i) => item(String(i))))).coverage.state, 'error')
  const huge = event('huge')
  if (huge.start.resolution.kind === 'instant_candidates') huge.start.resolution.candidates = Array.from({ length: 65 }, () => ({ epochMinute: 0, offsetMinutes: 0, choices: {} }))
  const bounded = zeitereignissePruefen([huge, event('other')], 'complete')
  assert.equal(bounded.coverage.state, 'partial')
  assert(bounded.coverage.reasons.includes('work_limit'))
  assert.equal(bounded.pairs[0].state, 'not_evaluable')
})

test('removing a qualifying source, end or clock can never retain a proven outcome', () => {
  const a = event('a'), b = event('b')
  assert.equal(pair(a, b).state, 'proven_conflict')
  assert.equal(pair({ ...a, start: { ...a.start, sourceRef: '' } }, b).state, 'not_evaluable')
  assert.equal(pair({ ...a, start: { ...a.start, resolution: { kind: 'unknown', reasons: ['missing_clock_context'] } } }, b).state, 'not_evaluable')
  assert.equal(pair(event('a', '10:00', null), b).state, 'possible_conflict')
})

test('adapter has zero network/derived writes and pure results; no ambient clock use', () => {
  const trip = graph([flight(), item('b')]); const before = JSON.stringify(trip)
  const fetchBefore = globalThis.fetch, nowBefore = Date.now
  globalThis.fetch = () => { throw new Error('unexpected network') }
  Date.now = () => { throw new Error('unexpected ambient clock') }
  try { assert.deepEqual(tripZeitpruefung(trip), tripZeitpruefung(trip)); assert.equal(JSON.stringify(trip), before) }
  finally { globalThis.fetch = fetchBefore; Date.now = nowBefore }
})

test('actual Plan integration: quiet grouped coverage, original IDs, prices and no false green', () => {
  const trip = graph([item('original:?[]&=', { priceAmount: 42, priceCurrency: 'CHF' }), item('b')])
  const render = () => renderToStaticMarkup(createElement(TripWorkspacePlan, { reise: trip, ohneTag: trip.ohneTag,
    aktiverTag: 'day-1', kompakt: false, onTagWechseln: () => {}, onPunktAnlegen: async () => null,
    onPunktEntfernen: async () => null, onPunktOeffnen: () => {} }))
  const html = render()
  assert.match(html, /aria-label="Zeitprüfung"/)
  assert.match(html, /data-zeitpruefung-status="unavailable"/)
  assert.match(html, /0 von 1 Vergleichen auswertbar/)
  assert.match(html, /CHF/)
  assert.match(html, /original:\?\[\]&amp;=/)
  assert.doesNotMatch(html, /Alles passt|konfliktfrei|proven_conflict|not_evaluable/)
  trip.days[0].items = []
  assert.match(render(), /Noch keine festen Termine für diesen Tag/)
  assert.doesNotMatch(render(), /data-zeitpruefung-punkt=/)
  trip.days[0].items = Array.from({ length: 1001 }, (_, i) => item(String(i)))
  assert.match(render(), /Für diesen Tag liegt kein verlässliches Prüfergebnis vor/)
  assert.doesNotMatch(render(), /Noch keine festen Termine für diesen Tag/)
})
