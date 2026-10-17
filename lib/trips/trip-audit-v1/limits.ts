import { GRENZEN, reiseSchema } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

export const AUDIT_LIMITS = {
  findings: 200,
  nodes: 100_000,
  characters: 1_000_000,
  stringLength: 4096,
  depth: 16,
  fields: 80,
  lodgingDays: GRENZEN.reisedauerInTagen,
  lodgingWork: 20_000,
} as const

export type InputProblem = 'input_limit' | 'invalid_snapshot' | 'lodging_work_limit'

/** Bound traversal before schema validation and the canonical recursive serializers.
 * Accessors/cycles are not canonical JSON snapshots; do not invoke or log them.
 */
export function boundedSnapshot(value: unknown): InputProblem | null {
  let nodes = 0
  let characters = 0
  const ancestors = new Set<object>()
  function visit(current: unknown, depth: number): InputProblem | null {
    if (++nodes > AUDIT_LIMITS.nodes || depth > AUDIT_LIMITS.depth) return 'input_limit'
    if (typeof current === 'string') {
      characters += current.length
      return current.length > AUDIT_LIMITS.stringLength || characters > AUDIT_LIMITS.characters ? 'input_limit' : null
    }
    if (current === null || current === undefined || typeof current === 'boolean') return null
    if (typeof current === 'number') return Number.isFinite(current) ? null : 'invalid_snapshot'
    if (typeof current !== 'object') return 'invalid_snapshot'
    if (ancestors.has(current)) return 'invalid_snapshot'
    const array = Array.isArray(current)
    if (array && current.length > GRENZEN.punkteJeReise) return 'input_limit'
    if (!array && ![Object.prototype, null].includes(Object.getPrototypeOf(current))) return 'invalid_snapshot'
    ancestors.add(current)
    let fields = 0
    for (const key in current) {
      if (!Object.hasOwn(current, key)) continue
      if (++fields > (array ? GRENZEN.punkteJeReise : AUDIT_LIMITS.fields)) return 'input_limit'
      const descriptor = Object.getOwnPropertyDescriptor(current, key)
      if (!descriptor || !('value' in descriptor)) return 'invalid_snapshot'
      const problem = visit(descriptor.value, depth + 1)
      if (problem) return problem
    }
    ancestors.delete(current)
    return null
  }
  return visit(value, 0)
}

export function snapshotProblem(reise: Trip, selected: readonly TripItem[]): InputProblem | null {
  if (!Array.isArray(reise.days) || !Array.isArray(reise.stages) || !Array.isArray(selected)) return 'invalid_snapshot'
  if (reise.days.length > GRENZEN.reisetageJeReise || reise.stages.length > GRENZEN.etappenJeReise
    || reise.days.some(day => !day || !Array.isArray(day.items))) return 'invalid_snapshot'
  if (reise.days.reduce((n, day) => n + day.items.length, selected.length) > GRENZEN.punkteJeReise) return 'input_limit'
  // Validate with the existing schema, but do not replace the input with its transformed data.
  if (!reiseSchema.safeParse(reise).success) return 'invalid_snapshot'
  const ids = new Set<string>()
  for (const entry of [...reise.stages, ...reise.days]) {
    if (ids.has(entry.id)) return 'invalid_snapshot'
    ids.add(entry.id)
  }
  const itemIds = new Set<string>()
  for (const item of [...reise.days.flatMap(day => day.items), ...selected]) {
    if (itemIds.has(item.id)) return 'invalid_snapshot'
    itemIds.add(item.id)
  }
  if (reise.days.some(day => day.items.some(item => item.dayId !== day.id))
    || selected.some(item => item.dayId !== null)) return 'invalid_snapshot'
  return null
}

/** Resource budget only, never a coverage calculation. The canonical lodging
 * reader enumerates dates without a ceiling, including dates outside the trip.
 */
export function lodgingBudget(reise: Trip): InputProblem | null {
  const spans = [
    [reise.startDate, reise.endDate],
    ...reise.stages.map(stage => [stage.arrivalDate, stage.departureDate]),
    ...[...reise.days.flatMap(day => day.items), ...reise.ohneTag]
      .filter(item => item.kind === 'stay').map(item => [item.startsOn, item.endsOn]),
  ]
  let work = 0
  for (const [start, end] of spans) {
    if (!start || !end) continue
    const days = Math.max(0, (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000)
    work += days
    if (days > AUDIT_LIMITS.lodgingDays || work > AUDIT_LIMITS.lodgingWork) return 'lodging_work_limit'
  }
  return null
}
