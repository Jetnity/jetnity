import { reiseDiff } from '@/lib/reiseaenderung/diff'
import type { Trip, TripItem } from '@/types/trips'
import { items } from './input'
import { compare, stable, unique, type Claim, type Ref, type Snapshot, type Value } from './contract'

type Entity = { entity: Ref['entity']; id: string; fields: Record<string, unknown> }
const TRIP_FIELDS = ['startDate', 'endDate', 'origin', 'originPlaceId', 'title', 'status', 'pace', 'interests', 'travelWish', 'travellers', 'budgetAmount', 'currency', 'dayStageAssignmentMode'] as const
const STAGE_FIELDS = ['position', 'arrivalDate', 'departureDate', 'name', 'placeId', 'countryCode', 'latitude', 'longitude'] as const
const DAY_FIELDS = ['dayIndex', 'dayDate', 'stageId', 'title'] as const
const ITEM_FIELDS = ['dayId', 'stageId', 'kind', 'position', 'startsOn', 'startsAt', 'endsOn', 'endsAt', 'routeItinerary',
  'title', 'note', 'bookingStatus', 'bookingSource', 'bookingConfirmedAt', 'provider', 'externalRef', 'bookingUrl',
  'priceAmount', 'priceCurrency', 'mobilityMode', 'originPlaceId', 'destinationPlaceId', 'originName', 'destinationName',
  'connectionRef', 'mobilityChanges', 'mobilityEvidence', 'rentalSupplier', 'vehicleClass', 'transmission', 'rentalEvidence'] as const
const exposed = new Set(['startDate', 'endDate', 'arrivalDate', 'departureDate', 'dayDate', 'startsOn', 'startsAt', 'endsOn', 'endsAt',
  'dayId', 'stageId', 'kind', 'position', 'dayIndex', 'bookingStatus', 'bookingSource'])
const trigger = new Set(['added', 'removed', 'dayId', 'stageId', 'position', 'dayIndex', 'dayDate', 'startsOn', 'startsAt', 'endsOn', 'endsAt',
  'arrivalDate', 'departureDate', 'kind', 'routeItinerary', 'originPlaceId', 'destinationPlaceId', 'placeId'])
function entities(trip: Trip): Entity[] {
  const select = (value: object, fields: readonly string[]) => Object.fromEntries(fields.map(k => [k, (value as Record<string, unknown>)[k] ?? null]))
  return [{ entity: 'trip', id: trip.id, fields: select(trip, TRIP_FIELDS) },
    ...trip.stages.map(s => ({ entity: 'stage' as const, id: s.id, fields: select(s, STAGE_FIELDS) })),
    ...trip.days.map(d => ({ entity: 'day' as const, id: d.id, fields: select(d, DAY_FIELDS) })),
    ...items(trip).map(p => ({ entity: 'item' as const, id: p.id, fields: select(p, ITEM_FIELDS) }))]
}
export type Change = { entity: Ref['entity']; id: string; fields: string[] }
export function directChanges(a: Trip, b: Trip): { claims: Claim[]; changes: Change[] } {
  const index = (t: Trip) => new Map(entities(t).map(e => [stable([e.entity, e.id]), e]))
  const left = index(a), right = index(b), claims: Claim[] = [], changes: Change[] = []
  for (const key of unique([...left.keys(), ...right.keys()])) {
    const before = left.get(key), after = right.get(key), entity = (after ?? before)!
    const fields = !before ? ['added'] : !after ? ['removed'] : Object.keys(entity.fields).filter(k => stable(before.fields[k]) !== stable(after.fields[k])).sort(compare)
    if (!fields.length) continue
    changes.push({ entity: entity.entity, id: entity.id, fields })
    const projection = (e: Entity | undefined): Value => !e ? null : {
      present: true, fields: Object.fromEntries(fields.filter(k => exposed.has(k)).map(k => [k, e.fields[k] as Value])),
    }
    claims.push({ id: stable(['direct', entity.entity, entity.id]), kind: 'direct_change', domain: 'plan', source: 'Trip.stored_fields',
      reasonCodes: ['stored_fields_differ', ...(fields.some(k => k.startsWith('booking')) ? ['user_booking_fact_not_provider_confirmation'] : [])],
      refs: (['baseline', 'observed'] as const).map(snapshot => ({ snapshot, entity: entity.entity, id: entity.id })),
      baseline: projection(before), observed: projection(after) })
    // Exact field names are evidence; redacted fields expose no raw private values.
    claims.at(-1)!.reasonCodes.push(...fields.map(f => `field:${f}`))
  }
  return { claims, changes }
}

/** Single aggregate per affected item. Relations refer to their ORIGINAL snapshot, not a hybrid graph. */
export function relationChanges(a: Trip, b: Trip, changes: Change[], pairs: { baseline: [string, string][]; observed: [string, string][] }): Claim[] {
  const found = new Map<string, Claim>()
  const add = (target: TripItem, cause: Change, snapshot: Snapshot, reason: string, relationId?: string) => {
    if (cause.entity === 'item' && cause.id === target.id) return
    const claim = found.get(target.id) ?? { id: stable(['relation', target.id]), kind: 'relation_needs_review' as const,
      domain: 'plan' as const, source: 'Trip.persisted_relations', reasonCodes: ['needs_review_not_proven_damage'], refs: [], baseline: null, observed: null }
    claim.reasonCodes.push(reason)
    if (reason === 'canonical_time_pair_item_ids') claim.source = 'Trip.persisted_relations+tripZeitpruefung.pairs'
    if (relationId) claim.refs.push({ snapshot, entity: reason === 'same_persistent_day_id' ? 'day' : 'stage', id: relationId })
    claim.refs.push({ snapshot, entity: 'item', id: target.id }, { snapshot, entity: cause.entity, id: cause.id })
    found.set(target.id, claim)
  }
  for (const [snapshot, trip] of [['baseline', a], ['observed', b]] as const) {
    const all = items(trip), byId = new Map(all.map(i => [i.id, i]))
    for (const cause of changes.filter(c => c.entity !== 'trip' && c.fields.some(f => trigger.has(f)))) {
      const item = cause.entity === 'item' ? byId.get(cause.id) : undefined
      const day = cause.entity === 'day' ? trip.days.find(d => d.id === cause.id) : undefined
      const stage = cause.entity === 'stage' ? trip.stages.find(s => s.id === cause.id) : undefined
      if (!item && !day && !stage) continue // Never borrow the other snapshot's placement.
      for (const target of all) {
        if ((item?.dayId && target.dayId === item.dayId) || (day && target.dayId === day.id)) add(target, cause, snapshot, 'same_persistent_day_id', item?.dayId ?? day?.id ?? undefined)
        const stageId = item?.stageId ?? (item?.dayId ? trip.days.find(d => d.id === item.dayId)?.stageId : null) ?? day?.stageId ?? stage?.id
        if (stageId && (target.stageId === stageId || trip.days.some(d => d.id === target.dayId && d.stageId === stageId))) add(target, cause, snapshot, 'same_persistent_stage_id', stageId)
      }
      if (item) for (const pair of pairs[snapshot]) {
        if (!pair.includes(item.id)) continue
        const target = byId.get(pair[0] === item.id ? pair[1] : pair[0])
        if (target) add(target, cause, snapshot, 'canonical_time_pair_item_ids')
      }
    }
  }
  return [...found.values()].map(c => ({ ...c, reasonCodes: unique(c.reasonCodes),
    refs: [...new Map(c.refs.map(r => [stable(r), r])).values()].sort((x, y) => compare(stable(x), stable(y))) }))
}

/** Canonical human-readable diff on a deliberately redacted projection; not an authoritative field inventory. */
export function summaries(a: Trip, b: Trip) {
  const project = (t: Trip, side: string): Trip => ({ ...t, title: a.title === b.title ? 'Reise' : `Reise ${side}`,
    origin: a.origin === b.origin ? 'Abreiseort' : `Abreiseort ${side}`, budgetAmount: null, travellers: 1,
    travelWish: a.travelWish === b.travelWish ? null : `Reisewunsch ${side}`, party: [], readinessItems: [], regulatoryContext: null,
    stages: t.stages.map(s => ({ ...s, name: `Etappe ${s.position}` })),
    days: t.days.map(d => ({ ...d, title: null, items: d.items.map(p => ({ ...p, title: 'Planpunkt', note: null, routeItinerary: null })) })),
    ohneTag: t.ohneTag.map(p => ({ ...p, title: 'Planpunkt', note: null, routeItinerary: null })),
  })
  return reiseDiff(project(a, 'A'), project(b, 'B')).map(s => ({ source: 'reiseDiff' as const, projection: 'redacted_stored_plan' as const, ...s }))
}
