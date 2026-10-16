import { types } from 'node:util'
import { reiseSchema } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'
import { compare, LIMITS, stable } from './contract'

class AdmissionError extends Error { constructor(readonly reason: string) { super(reason) } }
const fail = (reason: string): never => { throw new AdmissionError(reason) }
export const items = (trip: Trip): TripItem[] => [...trip.days.flatMap(d => d.items), ...trip.ohneTag]

/** No property reads, serialization, or proxy traps before inert-data admission. Node-only. */
function copy(value: unknown, budget: { nodes: number; text: number }, seen: WeakSet<object>, depth = 0): unknown {
  if (++budget.nodes > LIMITS.nodesAcrossSnapshots || depth > LIMITS.depth) fail('input_work_limit')
  if (typeof value === 'string') {
    budget.text += value.length
    if (value.length > LIMITS.string || budget.text > LIMITS.textAcrossSnapshots) fail('input_text_limit')
    return value
  }
  if (value === null || value === undefined || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : fail('invalid_number')
  if (typeof value !== 'object' || types.isProxy(value)) return fail('unsafe_shape')
  if (seen.has(value)) fail('cycle_or_shared_reference')
  seen.add(value)
  const array = Array.isArray(value)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== (array ? Array.prototype : Object.prototype) && !(prototype === null && !array)) fail('unsafe_prototype')
  const keys = Reflect.ownKeys(value)
  if (keys.length > (array ? LIMITS.array + 1 : LIMITS.objectKeys)) fail('input_count_limit')
  const result: Record<string, unknown> = Object.create(null)
  let length = 0
  for (const key of keys) {
    if (typeof key !== 'string') return fail('unsafe_key')
    if (key.length > 80 || ['__proto__', 'constructor', 'prototype'].includes(key)) fail('unsafe_key')
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!
    if (!('value' in descriptor)) fail('accessor_rejected')
    if (array && key === 'length') {
      length = descriptor.value
      if (!Number.isSafeInteger(length) || length < 0 || length > LIMITS.array) fail('input_count_limit')
      continue
    }
    if (!descriptor.enumerable || (array && !/^(0|[1-9]\d*)$/.test(key))) fail('unsafe_shape')
    result[key] = copy(descriptor.value, budget, seen, depth + 1)
  }
  if (!array) return result
  if (Object.keys(result).length !== length) fail('sparse_array')
  return Array.from({ length }, (_, i) => Object.hasOwn(result, String(i)) ? result[String(i)] : fail('sparse_array'))
}

/** Provided values must already be canonical. Defaults may fill absent optional legacy fields. */
function unchangedProvided(raw: unknown, parsed: unknown): boolean {
  if (raw && typeof raw === 'object') {
    if (!parsed || typeof parsed !== 'object') return false
    return Object.entries(raw).every(([key, value]) => Object.hasOwn(parsed, key)
      && unchangedProvided(value, (parsed as Record<string, unknown>)[key]))
  }
  return raw === parsed
}
function graph(raw: unknown): Trip {
  if (!raw || typeof raw !== 'object') return fail('invalid_snapshot')
  for (const field of ['id', 'revision', 'days', 'stages', 'ohneTag']) if (!Object.hasOwn(raw, field)) fail('missing_identity_or_inventory')
  const result = reiseSchema.safeParse(raw)
  if (!result.success) return fail('invalid_snapshot')
  if (!unchangedProvided(raw, result.data)) fail('noncanonical_snapshot')
  const trip = result.data
  const all = items(trip)
  if (all.length > LIMITS.items || trip.days.length > LIMITS.days || trip.stages.length > LIMITS.stages) fail('input_count_limit')
  for (const ids of [trip.days.map(d => d.id), trip.stages.map(s => s.id), all.map(p => p.id)]) {
    if (new Set(ids).size !== ids.length) fail('duplicate_identity')
  }
  // Prevent locale-dependent tie breaking and ambiguous stage order in canonical adapters.
  if (new Set(trip.stages.map(s => s.position)).size !== trip.stages.length) fail('ambiguous_stage_order')
  for (const day of trip.days) for (const item of day.items) {
    if (item.dayId !== day.id) fail('inconsistent_placement')
    if (item.stageId && day.stageId && item.stageId !== day.stageId) fail('conflicting_stage_assignment')
  }
  if (trip.ohneTag.some(p => p.dayId !== null)) fail('inconsistent_placement')
  trip.stages.sort((a, b) => a.position - b.position)
  trip.days.sort((a, b) => a.dayIndex - b.dayIndex)
  const order = (a: TripItem, b: TripItem) => a.position - b.position || compare(a.id, b.id)
  for (const day of trip.days) day.items.sort(order)
  trip.ohneTag.sort(order)
  trip.interests.sort(compare)
  return trip
}
export function admit(baseline: unknown, observed: unknown): { ok: true; baseline: Trip; observed: Trip } | { ok: false; reason: string } {
  try {
    const budget = { nodes: 0, text: 0 }
    const a = copy(baseline, budget, new WeakSet())
    const b = copy(observed, budget, new WeakSet())
    // Identity precheck is inert and does not reflect either trip in blocked output.
    if (a && b && typeof a === 'object' && typeof b === 'object'
      && typeof (a as Trip).id === 'string' && typeof (b as Trip).id === 'string' && (a as Trip).id !== (b as Trip).id) fail('blocked_cross_trip')
    const left = graph(a), right = graph(b)
    if (right.revision < left.revision) fail('reverse_revision')
    return { ok: true, baseline: left, observed: right }
  } catch (error) { return { ok: false, reason: error instanceof AdmissionError ? error.reason : 'input_rejected' } }
}

export function workAllowed(a: Trip, b: Trip): boolean {
  let pairs = 0, nights = 0
  for (const trip of [a, b]) {
    const all = items(trip)
    const events = all.reduce((n, p) => n + (p.kind === 'flight' && p.routeItinerary
      ? p.routeItinerary.legs.reduce((sum, leg) => sum + leg.segments.length, 0) : 1), 0)
    if (events > LIMITS.events) return false
    pairs += events * (events - 1) / 2
    // Computational guard only; coverage itself stays exclusively in unterkunftAbdeckung.
    for (const [start, end] of [[trip.startDate, trip.endDate], ...trip.stages.map(s => [s.arrivalDate, s.departureDate]),
      ...all.filter(p => p.kind === 'stay').map(p => [p.startsOn, p.endsOn])]) {
      if (!start || !end) continue
      const span = Math.max(0, (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000)
      if (!Number.isFinite(span) || span > LIMITS.nightSpan) return false
      nights += span * 2 // Canonical required-night inventory is traversed twice.
    }
  }
  return pairs <= LIMITS.pairsAcrossSnapshots && nights <= LIMITS.nightWorkAcrossSnapshots
}
export const contentEqual = (a: Trip, b: Trip) => stable(a) === stable(b)
