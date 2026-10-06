import { routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { ROUTE_FACTS_VERSION } from '@/lib/route/domain'
import { GRENZEN } from '@/lib/trips/schema'
import { lokalePlanzeit } from '@/lib/trips/trip-timeline-core-1'
import type { Trip, TripItem } from '@/types/trips'

type Grund = 'missing_date' | 'missing_start' | 'missing_end' | 'missing_clock_context'
  | 'missing_timezone' | 'ambiguous_local_time' | 'invalid_local_time' | 'conflicting_evidence'
  | 'stale_evidence' | 'incomplete_snapshot' | 'unsupported_role' | 'unknown_placement'
  | 'duplicate_identity' | 'evaluation_error' | 'work_limit' | 'date_mismatch' | 'estimate_only'
type Rolle = 'occupied_interval' | 'start_only' | 'end_only' | 'milestone'
  | 'availability_span' | 'flexible' | 'date_only' | 'unscheduled' | 'unsupported'
type Auswahl = Readonly<Record<string, string>>
type Kandidat = { epochMinute: number; offsetMinutes: number; choices: Auswahl }

/** Pure mathematical input, NOT an external-fact admission API. The Trip adapter never reads it. */
export type Zeitgrenze = {
  date: string | null
  time: string | null
  sourceRef: string
  truthClass: 'stored_user' | 'canonical_trip_route' | 'estimate' | 'unknown'
  resolution:
    | { kind: 'unknown'; reasons: Grund[] }
    | { kind: 'civil_only'; contextRef: string }
    | { kind: 'instant_candidates'; candidates: readonly Kandidat[] }
    | { kind: 'estimate_range'; earliest: number; latest: number; methodRef: string }
}

export type Zeitereignis = {
  id: string
  tripId: string
  itemId: string
  dayId: string | null
  role: Rolle
  start: Zeitgrenze
  end: Zeitgrenze
  reasons: Grund[]
  /** Optional explicit constraint in mathematical input; never a guessed duration. */
  durationMinutes?: number
  /** Scope-local indices expire on ANY canonical itinerary content change. Never durable IDs. */
  subevent: { routeVersion: string; itineraryRef: string; legIndex: number; segmentIndex: number } | null
}

type Zustand = 'proven_conflict' | 'possible_conflict' | 'no_proven_conflict' | 'not_evaluable'
type Basis = 'instant' | 'civil_only' | 'estimate' | 'none'
type Paar = {
  eventIds: [string, string]
  itemIds: [string, string]
  state: Zustand
  comparisonBasis: Basis
  ruleId: 'saved-plan-overlap/v1'
  claimScope: 'saved_plan'
  basisRefs: string[]
  reasons: Grund[]
  overlapMinutes: number | null
}
type Inventar = 'complete' | 'partial' | 'unavailable' | 'error' | 'not_run'
export type Zeitpruefung = {
  contractVersion: 'timeline-temporal-review/v1'
  events: Zeitereignis[]
  pairs: Paar[]
  coverage: {
    state: Inventar
    eligiblePairs: number | null
    attemptedPairs: number
    evaluatedPairs: number
    unevaluablePairs: number | null
    unassessedEvents: number | null
    reasons: Grund[]
  }
}

// Computational ceilings, not travel/buffer policy. Exceeding a ceiling is explicit incomplete coverage.
const MAX_PAIRS = 10_000
const MAX_ASSIGNMENTS = 64
const sort = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const unique = <T extends string>(values: readonly T[]): T[] => [...new Set(values)].sort(sort)
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => sort(a, b)).map(([key, v]) => `${JSON.stringify(key)}:${stable(v)}`).join(',')}}`
  return JSON.stringify(value) ?? 'undefined'
}
const fixed = (event: Zeitereignis) => ['occupied_interval', 'start_only', 'end_only', 'milestone'].includes(event.role)

function civilMinute(date: string | null, time: string | null): number | null {
  if (!date || date.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !lokalePlanzeit(time)) return null
  const [year, month, day] = date.split('-').map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > lengths[month - 1]) return null
  const y = year - 1
  // Gregorian ordinal relative to 1970-01-01; this is a civil coordinate, NOT an admitted UTC instant.
  const days = 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)
    + lengths.slice(0, month - 1).reduce((sum, n) => sum + n, 0) + day - 1 - 719162
  return days * 1440 + Number(time!.slice(0, 2)) * 60 + Number(time!.slice(3))
}

function fieldReasons(boundary: Zeitgrenze, edge: 'start' | 'end'): Grund[] {
  const reasons: Grund[] = []
  if (!boundary.date) reasons.push('missing_date')
  else if (civilMinute(boundary.date, '00:00') === null) reasons.push('invalid_local_time')
  if (!boundary.time) reasons.push(edge === 'start' ? 'missing_start' : 'missing_end')
  else if (!lokalePlanzeit(boundary.time)) reasons.push('invalid_local_time')
  if (!boundary.sourceRef || boundary.truthClass === 'unknown') reasons.push('conflicting_evidence')
  if (boundary.resolution.kind === 'unknown') reasons.push(...boundary.resolution.reasons)
  return unique(reasons)
}

type Point = { value: number; choices: Auswahl }
type Bound = { points: Point[]; basis: Basis; context: string | null; reasons: Grund[]; invalid: boolean }
function boundaryRead(boundary: Zeitgrenze, edge: 'start' | 'end'): Bound {
  const reasons = fieldReasons(boundary, edge)
  const result: Bound = { points: [], basis: 'none', context: null, reasons, invalid: reasons.some(r => ['invalid_local_time', 'conflicting_evidence', 'stale_evidence'].includes(r)) }
  if (reasons.length) return result
  const resolution = boundary.resolution
  if (resolution.kind === 'civil_only') {
    if (!resolution.contextRef) return { ...result, reasons: ['missing_clock_context'] }
    return { ...result, points: [{ value: civilMinute(boundary.date, boundary.time)!, choices: {} }], basis: 'civil_only', context: resolution.contextRef, reasons: ['missing_timezone'] }
  }
  if (resolution.kind === 'instant_candidates') {
    const candidates = resolution.candidates
    if (candidates.length > MAX_ASSIGNMENTS) return { ...result, invalid: true, reasons: ['work_limit'] }
    if (!candidates.length || candidates.some(c =>
      !Number.isSafeInteger(c.epochMinute) || !Number.isInteger(c.offsetMinutes) || Math.abs(c.offsetMinutes) >= 1440
      || civilMinute(boundary.date, boundary.time)! - c.offsetMinutes !== c.epochMinute
      || Object.entries(c.choices).some(([k, v]) => !k || typeof v !== 'string' || !v),
    )) return { ...result, invalid: true, reasons: ['conflicting_evidence'] }
    // A choice assignment must identify a single value. Uncorrelated alternatives may use {}.
    const keyed = new Map<string, number>()
    for (const c of candidates) {
      const key = JSON.stringify(Object.entries(c.choices).sort(([a], [b]) => sort(a, b)))
      if (key !== '[]' && keyed.has(key) && keyed.get(key) !== c.epochMinute) return { ...result, invalid: true, reasons: ['conflicting_evidence'] }
      keyed.set(key, c.epochMinute)
    }
    return { ...result, basis: boundary.truthClass === 'estimate' ? 'estimate' : 'instant',
      points: [...new Map(candidates.map(c => {
        const point = { value: c.epochMinute, choices: c.choices }
        return [stable(point), point]
      })).values()].sort((a, b) => a.value - b.value || sort(stable(a.choices), stable(b.choices))),
      reasons: boundary.truthClass === 'estimate' ? ['estimate_only'] : candidates.length > 1 ? ['ambiguous_local_time'] : [] }
  }
  if (resolution.kind === 'estimate_range') {
    if (!resolution.methodRef || !Number.isSafeInteger(resolution.earliest) || !Number.isSafeInteger(resolution.latest)
      || resolution.earliest > resolution.latest) return { ...result, invalid: true, reasons: ['conflicting_evidence'] }
    return { ...result, basis: 'estimate', reasons: ['estimate_only'],
      points: unique([String(resolution.earliest), String(resolution.latest)]).map(value => ({ value: Number(value), choices: {} })) }
  }
  return { ...result, reasons: ['missing_clock_context'] }
}

function combine(a: Auswahl, b: Auswahl): Auswahl | null {
  for (const key of Object.keys(a)) if (Object.hasOwn(b, key) && a[key] !== b[key]) return null
  return { ...a, ...b }
}
function sameChoiceDomains(a: readonly { choices: Auswahl }[], b: readonly { choices: Auswahl }[]): boolean {
  const keys = unique(a.flatMap(p => Object.keys(p.choices))).filter(key => b.some(p => Object.hasOwn(p.choices, key)))
  return keys.every(key => JSON.stringify(unique(a.flatMap(p => Object.hasOwn(p.choices, key) ? [p.choices[key]] : [])))
    === JSON.stringify(unique(b.flatMap(p => Object.hasOwn(p.choices, key) ? [p.choices[key]] : []))))
}
type Assignment = { start: number; end: number | null; choices: Auswahl }
type Span = { event: Zeitereignis; assignments: Assignment[]; basis: Basis; context: string | null; reasons: Grund[]; invalid: boolean }
function spanRead(event: Zeitereignis): Span {
  if (event.role === 'availability_span' || event.role === 'unsupported') {
    // No appointment is inferred, so absent appointment clocks are not a hotel/rental data defect.
    return { event, assignments: [], basis: 'none', context: null, reasons: event.reasons,
      invalid: event.reasons.includes('duplicate_identity') || event.reasons.includes('conflicting_evidence') }
  }
  const start = boundaryRead(event.start, 'start')
  const end = boundaryRead(event.end, 'end')
  const reasons = unique([...event.reasons, ...start.reasons, ...(event.role === 'milestone' ? [] : end.reasons)])
  const invalid = start.invalid || end.invalid || event.reasons.some(r => ['duplicate_identity', 'conflicting_evidence', 'stale_evidence'].includes(r))
  const result: Span = { event, assignments: [], basis: 'none', context: null, reasons, invalid }
  if (invalid || !fixed(event)) return result
  if (event.role === 'start_only' || event.role === 'milestone') {
    return { ...result, basis: start.basis, context: start.context, assignments: start.points.map(p => ({ start: p.value, end: null, choices: p.choices })) }
  }
  if (event.role !== 'occupied_interval' || !start.points.length || !end.points.length) return result
  const civil = start.basis === 'civil_only' && end.basis === 'civil_only' && start.context === end.context
  const instant = ['instant', 'estimate'].includes(start.basis) && ['instant', 'estimate'].includes(end.basis)
  if (!civil && !instant) return { ...result, reasons: unique([...reasons, 'missing_clock_context']) }
  if (!sameChoiceDomains(start.points, end.points)) return { ...result, invalid: true, reasons: unique([...reasons, 'conflicting_evidence']) }
  const assignments: Assignment[] = []
  for (const a of start.points) for (const b of end.points) {
    const choices = combine(a.choices, b.choices)
    if (!choices) continue // Only explicitly disallowed correlated combinations are excluded.
    if (b.value <= a.value || (event.durationMinutes !== undefined
      && (!Number.isSafeInteger(event.durationMinutes) || event.durationMinutes <= 0 || b.value - a.value !== event.durationMinutes))) {
      return { ...result, invalid: true, reasons: unique([...reasons, 'conflicting_evidence']) }
    }
    assignments.push({ start: a.value, end: b.value, choices })
    if (assignments.length > MAX_ASSIGNMENTS) return { ...result, reasons: unique([...reasons, 'work_limit']) }
  }
  if (!assignments.length) return { ...result, invalid: true, reasons: unique([...reasons, 'conflicting_evidence']) }
  return { ...result, assignments, context: civil ? start.context : null,
    basis: civil ? 'civil_only' : start.basis === 'estimate' || end.basis === 'estimate' ? 'estimate' : 'instant' }
}

function pairRead(a: Span, b: Span): Paar {
  const result: Paar = { eventIds: [a.event.id, b.event.id], itemIds: [a.event.itemId, b.event.itemId],
    state: 'not_evaluable', comparisonBasis: 'none', ruleId: 'saved-plan-overlap/v1', claimScope: 'saved_plan',
    basisRefs: unique([a.event.start.sourceRef, a.event.end.sourceRef, b.event.start.sourceRef, b.event.end.sourceRef]),
    reasons: unique([...a.reasons, ...b.reasons]), overlapMinutes: null }
  if (a.invalid || b.invalid || !a.assignments.length || !b.assignments.length) return result
  const civil = a.basis === 'civil_only' && b.basis === 'civil_only' && a.context === b.context
  const instant = ['instant', 'estimate'].includes(a.basis) && ['instant', 'estimate'].includes(b.basis)
  if (!civil && !instant) return { ...result, reasons: unique([...result.reasons, 'missing_clock_context']) }
  if (!sameChoiceDomains(a.assignments, b.assignments)) return { ...result, reasons: unique([...result.reasons, 'conflicting_evidence']) }
  result.comparisonBasis = civil ? 'civil_only' : a.basis === 'estimate' || b.basis === 'estimate' ? 'estimate' : 'instant'
  let count = 0
  let overlaps = 0
  let equalMinutes: number | null | undefined
  for (const left of a.assignments) for (const right of b.assignments) {
    if (!combine(left.choices, right.choices)) continue
    count++
    const minutes = left.end !== null && right.end !== null
      ? Math.max(0, Math.min(left.end, right.end) - Math.max(left.start, right.start)) : null
    const overlap = minutes !== null ? minutes > 0
      : left.start === right.start
        || (left.end === null && right.end !== null && right.start <= left.start && left.start < right.end)
        || (right.end === null && left.end !== null && left.start <= right.start && right.start < left.end)
    if (overlap) overlaps++
    equalMinutes = equalMinutes === undefined ? minutes : equalMinutes === minutes ? minutes : null
  }
  if (!count) return { ...result, reasons: unique([...result.reasons, 'conflicting_evidence']) }
  const complete = a.event.role === 'occupied_interval' && b.event.role === 'occupied_interval'
  if (complete && result.comparisonBasis === 'instant' && overlaps === count) {
    return { ...result, state: 'proven_conflict', overlapMinutes: equalMinutes ?? null }
  }
  if (overlaps > 0) return { ...result, state: 'possible_conflict' }
  if (complete && result.comparisonBasis === 'instant') return { ...result, state: 'no_proven_conflict' }
  return result
}

/** Bounded kernel for qualified mathematical fixtures and the conservative live adapter below. */
export function zeitereignissePruefen(events: readonly Zeitereignis[], inventory: Inventar, inventoryReasons: Grund[] = []): Zeitpruefung {
  const result: Zeitpruefung = { contractVersion: 'timeline-temporal-review/v1', events: [], pairs: [],
    coverage: { state: inventory, eligiblePairs: null, attemptedPairs: 0, evaluatedPairs: 0, unevaluablePairs: null, unassessedEvents: null, reasons: inventoryReasons } }
  if (['error', 'not_run', 'unavailable'].includes(inventory)) return result
  if (events.length > GRENZEN.punkteJeReise) return { ...result, coverage: { ...result.coverage, state: 'error', reasons: ['work_limit'] } }
  if (new Set(events.map(e => e.tripId)).size > 1) return { ...result, coverage: { ...result.coverage, state: 'error', reasons: ['conflicting_evidence'] } }
  const byId = new Map<string, Zeitereignis>()
  const conflicts = new Set<string>()
  for (const event of events) {
    const previous = byId.get(event.id)
    if (previous && stable(previous) !== stable(event)) conflicts.add(event.id)
    if (!previous || sort(stable(event), stable(previous)) < 0) byId.set(event.id, event)
  }
  result.events = [...byId.values()].sort((a, b) => sort(a.id, b.id)).map(event => conflicts.has(event.id)
    ? { ...event, reasons: unique([...event.reasons, 'duplicate_identity']) } : event)
  const spans = result.events.map(spanRead)
  const eligible = spans.filter(s => fixed(s.event))
  let eligiblePairs = 0
  for (let i = 0; i < eligible.length; i++) for (let j = i + 1; j < eligible.length; j++) {
    eligiblePairs++
    if (result.pairs.length < MAX_PAIRS) result.pairs.push(pairRead(eligible[i], eligible[j]))
  }
  const reasons = unique([...inventoryReasons, ...(inventory === 'partial' ? ['incomplete_snapshot' as const] : []), ...spans.flatMap(s => s.reasons), ...result.pairs.flatMap(p => p.reasons),
    ...(eligiblePairs > MAX_PAIRS ? ['work_limit' as const] : [])])
  const evaluatedPairs = result.pairs.filter(p => p.state !== 'not_evaluable').length
  const unassessedEvents = spans.filter(s => s.event.role !== 'availability_span'
    && (s.event.role !== 'occupied_interval' || s.basis !== 'instant' || !s.assignments.length || s.invalid)).length
  const incomplete = inventory !== 'complete' || reasons.includes('work_limit') || conflicts.size > 0
    || unassessedEvents > 0 || evaluatedPairs < eligiblePairs
  const state = reasons.includes('work_limit') ? result.pairs.length > 0 ? 'partial' : 'error'
    : !events.length && inventory === 'complete' ? 'not_run'
    : !eligiblePairs && !unassessedEvents && inventory === 'complete' ? 'not_run'
      : incomplete ? evaluatedPairs > 0 ? 'partial' : 'unavailable' : 'complete'
  result.coverage = { state, eligiblePairs, attemptedPairs: result.pairs.length, evaluatedPairs,
    unevaluablePairs: eligiblePairs - evaluatedPairs, unassessedEvents, reasons }
  return result
}

function localBoundary(date: string | null, time: string | null, sourceRef: string, context: string | null): Zeitgrenze {
  return { date, time, sourceRef, truthClass: 'stored_user', resolution: context
    ? { kind: 'civil_only', contextRef: context }
    : { kind: 'unknown', reasons: ['missing_clock_context'] } }
}
function role(item: TripItem): Rolle {
  if (item.kind === 'stay' || item.kind === 'rental_car') return 'availability_span'
  if (item.kind === 'note') return 'unsupported'
  if (item.startsAt && item.endsAt) return 'occupied_interval'
  if (item.startsAt) return 'start_only'
  if (item.endsAt) return 'end_only'
  if (item.startsOn || item.endsOn) return 'date_only'
  return item.dayId ? 'flexible' : 'unscheduled'
}
const airport = (id: string | null) => id && /^airport:[A-Z]{3}$/.test(id) ? id : null

/** Full current Trip + canonical unplanned inventory. No cache/revision shortcut, I/O or graph writes. */
export function tripZeitpruefung(reise: Trip, ohneTag: readonly TripItem[] = reise.ohneTag): Zeitpruefung {
  const fail = (reason: Grund) => zeitereignissePruefen([], 'error', [reason])
  if (!Array.isArray(reise.days) || !Array.isArray(reise.stages) || !Array.isArray(reise.ohneTag) || !Array.isArray(ohneTag)
    || reise.days.some(day => !day || !Array.isArray(day.items))) return fail('incomplete_snapshot')
  if (reise.days.length > GRENZEN.reisetageJeReise || reise.stages.length > GRENZEN.etappenJeReise
    || reise.days.reduce((n, d) => n + d.items.length, 0) + reise.ohneTag.length > GRENZEN.punkteJeReise
    || ohneTag.length > GRENZEN.punkteJeReise) return fail('work_limit')
  const entries = [...reise.days.flatMap(day => day.items.map(item => ({ item, placement: day.id, date: day.dayDate }))),
    ...reise.ohneTag.map(item => ({ item, placement: null, date: null })),
    ...ohneTag.map(item => ({ item, placement: null, date: null }))]
  const inventoryReasons: Grund[] = []
  const days = new Set(reise.days.map(d => d.id))
  const duplicateDays = new Set(reise.days.filter((d, i) => reise.days.findIndex(other => other.id === d.id) !== i).map(d => d.id))
  if (days.size !== reise.days.length || new Set(reise.stages.map(s => s.id)).size !== reise.stages.length) inventoryReasons.push('duplicate_identity')
  // A second unplanned projection may add evidence but cannot silently replace canonical inventory.
  if (unique(ohneTag.map(p => p.id)).join('\0') !== unique(reise.ohneTag.map(p => p.id)).join('\0')) inventoryReasons.push('incomplete_snapshot')
  const byId = new Map<string, typeof entries[number]>()
  const duplicates = new Set<string>()
  for (const entry of entries) {
    const previous = byId.get(entry.item.id)
    if (previous && (stable(previous.item) !== stable(entry.item) || previous.placement !== entry.placement)) duplicates.add(entry.item.id)
    // Deterministic representative; conflicting payloads are never actionable or evaluated.
    if (!previous || sort(stable(entry), stable(previous)) < 0) byId.set(entry.item.id, entry)
  }
  if (byId.size > GRENZEN.punkteJeReise) return fail('work_limit')
  const events: Zeitereignis[] = []
  for (const { item, placement, date } of [...byId.values()].sort((a, b) => sort(a.item.id, b.item.id))) {
    const reasons: Grund[] = []
    if (!item.id || duplicates.has(item.id) || (placement && duplicateDays.has(placement))) reasons.push('duplicate_identity')
    if (item.dayId !== placement || (item.dayId && !days.has(item.dayId))) reasons.push('incomplete_snapshot')
    if (!placement) reasons.push('unknown_placement')
    if (item.startsOn && date && item.startsOn !== date) reasons.push('date_mismatch')
    const base = { tripId: reise.id, itemId: item.id, dayId: placement, reasons }
    if (item.kind === 'flight' && item.routeItinerary) {
      // Existing Route schema: at most 6 legs x 8 segments. Bound traversal before its canonical reader.
      if (!Array.isArray(item.routeItinerary.legs) || item.routeItinerary.legs.length > 6
        || item.routeItinerary.legs.some((leg: { segments: unknown }) => !leg || !Array.isArray(leg.segments) || leg.segments.length > 8)) return fail('work_limit')
      const route = routeFactsFuerPunkt(item)
      if (route.quelle === 'flight_itinerary') {
        const itineraryRef = JSON.stringify([ROUTE_FACTS_VERSION, route.fingerprint, route.legs])
        for (const [legIndex, leg] of route.legs.entries()) for (const [segmentIndex, segment] of leg.segments.entries()) {
          const id = JSON.stringify([reise.id, item.id, legIndex, segmentIndex])
          const segmentRole = role({ ...item, startsAt: segment.departureTime, endsAt: segment.arrivalTime,
            startsOn: segment.departureDate, endsOn: segment.arrivalDate })
          events.push({ ...base, id, role: segmentRole,
            reasons: unique([...reasons, ...(date && segment.departureDate && date !== segment.departureDate ? ['date_mismatch' as const] : [])]),
            start: localBoundary(segment.departureDate, segment.departureTime, `${id}:departure`, segment.origin.airportCode ? `airport:${segment.origin.airportCode}` : null),
            end: localBoundary(segment.arrivalDate, segment.arrivalTime, `${id}:arrival`, segment.destination.airportCode ? `airport:${segment.destination.airportCode}` : null),
            subevent: { routeVersion: ROUTE_FACTS_VERSION, itineraryRef, legIndex, segmentIndex } })
        }
        if (events.length > GRENZEN.punkteJeReise) return fail('work_limit')
        continue // Never also count the legacy summary.
      }
      reasons.push('conflicting_evidence') // Invalid itinerary cannot fall back to convenient summary fields.
    }
    const id = JSON.stringify([reise.id, item.id])
    const itemRole = role(item)
    if (itemRole === 'unsupported') reasons.push('unsupported_role')
    const mobility = item.kind === 'transfer' && item.mobilityEvidence === 'user'
    events.push({ ...base, id, role: itemRole, subevent: null,
      start: localBoundary(item.startsOn, item.startsAt, `${id}:start`, mobility ? airport(item.originPlaceId) : null),
      end: localBoundary(item.endsOn, item.endsAt, `${id}:end`, mobility ? airport(item.destinationPlaceId) : null) })
  }
  if (duplicates.size) inventoryReasons.push('duplicate_identity')
  if (events.some(e => e.reasons.includes('incomplete_snapshot'))) inventoryReasons.push('incomplete_snapshot')
  return zeitereignissePruefen(events, inventoryReasons.length ? 'partial' : 'complete', unique(inventoryReasons))
}
