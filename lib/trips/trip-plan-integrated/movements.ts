import { routeFactsFuerPunkt } from '@/lib/route/ableitung'
import type { Trip } from '@/types/trips'
import { inventar } from './day'

export type Endpoint = { namespace: string; id: string; precision: 'city' | 'facility' | 'terminal' | 'exact_point'; sourceRef: string }
export type MovementNeed = { id: string; tripId: string; from: Endpoint | null; to: Endpoint | null;
  occurrence: string | null; ordered: boolean; surface: boolean; sourceItemId: string; redundantProof?: string }
export type MovementCandidate = { id: string; tripId: string; from: Endpoint | null; to: Endpoint | null;
  occurrence: string | null; completeChain: boolean }
const same = (a: Endpoint, b: Endpoint) => a.namespace === b.namespace && a.id === b.id && a.precision === b.precision
const valid = (a: Endpoint | null): a is Endpoint => !!a?.id && !!a.namespace && !!a.sourceRef
export function movementCoverage(need: MovementNeed, candidates: readonly MovementCandidate[], complete: boolean) {
  const result = (state: 'present_in_plan' | 'missing_in_plan' | 'not_evaluable' | 'not_required', reason: string, ids: string[] = []) =>
    ({ id: need.id, state, reason, candidateIds: ids, sourceItemId: need.sourceItemId, travelFit: 'not_evaluable' as const })
  if (candidates.length > 1000 || !complete) return result('not_evaluable', 'inventory_incomplete')
  if (!valid(need.from) || !valid(need.to) || !need.occurrence || !need.ordered) return result('not_evaluable', 'need_unqualified')
  if (same(need.from,need.to)) return need.redundantProof && need.from.precision === 'exact_point'
    ? result('not_required','exact_redundant_movement') : result('not_evaluable','local_movement_unknown')
  if (need.from.namespace !== need.to.namespace || (need.from.precision === 'city' || need.to.precision === 'city')) return result('not_evaluable','endpoint_precision')
  const matched = new Set<string>(); const unresolved = new Set<string>(); const ids = new Set<string>()
  for (const c of candidates) {
    if (c.tripId !== need.tripId) return result('not_evaluable','cross_trip_inventory')
    if (ids.has(c.id)) return result('not_evaluable','duplicate_candidate')
    ids.add(c.id)
    if (c.occurrence && c.occurrence !== need.occurrence) continue
    if (valid(c.from) && valid(c.to) && c.from.namespace === need.from.namespace && c.to.namespace === need.to.namespace &&
      c.from.precision === need.from.precision && c.to.precision === need.to.precision &&
      (c.from.id !== need.from.id || c.to.id !== need.to.id)) continue
    if (!valid(c.from) || !valid(c.to) || !same(c.from,need.from) || !same(c.to,need.to) || !c.occurrence || !c.completeChain) unresolved.add(c.id)
    else matched.add(c.id)
  }
  if (unresolved.size || matched.size > 1) return result('not_evaluable','ambiguous_candidates',[...matched,...unresolved].sort())
  return matched.size === 1 ? result('present_in_plan','unique_directed_occurrence',[...matched]) : result('missing_in_plan','complete_directed_inventory')
}
const endpoint = (id: string | null): Endpoint | null => id && /^airport:[A-Z]{3}$/.test(id)
  ? { namespace: 'airport', id: id.slice(8), precision: 'facility', sourceRef: id } : null

/** Only explicit canonical surface edges can prove a missing movement with today's Trip schema. */
export function tripMovements(reise: Trip) {
  const inventory = inventar(reise)
  const needs: MovementNeed[] = []
  for (const item of inventory.items) {
    if (item.kind !== 'flight') continue
    const route = routeFactsFuerPunkt(item)
    for (const [li, leg] of route.legs.entries()) for (const [si, segment] of leg.segments.entries()) {
      const prior = leg.segments[si - 1]
      if (!segment.surfaceFromAirportCode) continue
      const occurrence = JSON.stringify([reise.id,item.id,li,si,route.fingerprint,route.legs])
      needs.push({ id: JSON.stringify([reise.id,'surface',item.id,li,si]), tripId: reise.id,
        from: endpoint(`airport:${segment.surfaceFromAirportCode}`), to: endpoint(segment.origin.airportCode ? `airport:${segment.origin.airportCode}` : null),
        occurrence, ordered: route.chronologieBewiesen && prior?.destination.airportCode === segment.surfaceFromAirportCode,
        surface: true, sourceItemId: item.id })
    }
  }
  const candidates: MovementCandidate[] = inventory.items.filter(item => item.kind === 'transfer').map(item => ({
    id: item.id, tripId: reise.id, from: endpoint(item.originPlaceId), to: endpoint(item.destinationPlaceId),
    // No persisted occurrence link: date/title cannot manufacture it.
    occurrence: null, completeChain: item.mobilityEvidence === 'user',
  }))
  return { needs, results: needs.map(need => movementCoverage(need,candidates,inventory.ambiguous.length === 0 && inventory.items.length <= 1000)),
    coverage: needs.length ? 'partial' as const : 'not_evaluable' as const }
}
