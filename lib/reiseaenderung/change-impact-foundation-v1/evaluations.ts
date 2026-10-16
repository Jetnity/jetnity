import { tripZeitpruefung, type Zeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import { mobilitaetsAbdeckung, type MobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import type { Trip } from '@/types/trips'
import { compare, stable, unique, type Claim, type Domain, type DomainState, type Ref, type Snapshot, type Value } from './contract'

type Row = { key: string; value: Value; comparable: boolean; level: string; refs: Omit<Ref, 'snapshot'>[]; reasons: string[] }
export type Evaluation = { state: DomainState; rows: Row[]; relations: [string, string][] }
const state = (complete: boolean, reasons: string[] = []): DomainState => ({ state: complete ? 'complete' : 'partial', reasonCodes: unique(reasons) })
const itemRefs = (ids: string[]): Omit<Ref, 'snapshot'>[] => unique(ids).map(id => ({ entity: 'item', id }))

/** Private projection: no eventIds/subevent offsets used as durable identity, no boundary authority admitted. */
export function temporalProjection(result: Zeitpruefung): Evaluation {
  const counts = new Map<string, number>()
  for (const e of result.events) counts.set(e.itemId, (counts.get(e.itemId) ?? 0) + 1)
  const unsafe = new Set(result.events.filter(e => e.subevent !== null || counts.get(e.itemId) !== 1).map(e => e.itemId))
  const grouped = new Map<string, Zeitpruefung['pairs']>()
  for (const pair of result.pairs) {
    const key = stable([...pair.itemIds].sort(compare))
    const group = grouped.get(key) ?? []; group.push(pair); grouped.set(key, group)
  }
  const rows: Row[] = []
  for (const [key, pairs] of grouped) {
    const p = pairs[0]
    const ambiguous = pairs.length !== 1 || p.itemIds[0] === p.itemIds[1] || p.itemIds.some(id => unsafe.has(id))
    rows.push({ key, comparable: !ambiguous && p.state !== 'not_evaluable', level: p.comparisonBasis,
      refs: itemRefs(p.itemIds), reasons: ambiguous ? ['snapshot_local_subevent_identity'] : [...p.reasons],
      value: ambiguous ? { state: 'unknown', reason: 'snapshot_local_subevent_identity', pairCount: pairs.length }
        : { state: p.state, comparisonBasis: p.comparisonBasis, ruleId: p.ruleId, claimScope: p.claimScope,
          reasons: [...p.reasons], overlapMinutes: p.overlapMinutes },
    })
  }
  const coverage = result.coverage
  const workLimit = coverage.reasons.includes('work_limit')
  const noWork = coverage.state === 'not_run' && !coverage.reasons.length
  return {
    state: { state: workLimit ? 'incomplete' : coverage.state === 'error' ? 'error' : coverage.state === 'complete' || noWork ? 'complete' : 'partial',
      reasonCodes: unique([...coverage.reasons, ...(noWork ? ['no_eligible_temporal_pairs'] : []),
        ...(unsafe.size ? ['snapshot_local_subevent_identity'] : [])]) },
    rows,
    // A meaningful original possible/proven pair supplies review evidence; an unevaluable all-pairs scan does not link the entire trip.
    relations: result.pairs.filter(p => p.itemIds[0] !== p.itemIds[1] && (p.state === 'possible_conflict' || p.state === 'proven_conflict')).map(p => p.itemIds),
  }
}

function edgeRow(edge: { id: string; status: string; date: string | null; originName: string; destinationName: string;
  originPlaceId: string | null; destinationPlaceId: string | null }, ids: string[], determinable: boolean): Row {
  return {
    key: edge.id, comparable: determinable && edge.status !== 'unknown' && edge.date !== null,
    level: stable([edge.originPlaceId ?? edge.originName, edge.destinationPlaceId ?? edge.destinationName]),
    refs: itemRefs(ids), reasons: edge.status === 'booked' ? ['user_marked_booking_only'] : ['stored_coverage_only'],
    value: { state: edge.status, date: edge.date, itemIds: unique(ids) },
  }
}
export function mobilityProjection(result: MobilitaetsAbdeckung): Evaluation {
  return {
    state: state(result.bestimmbar && !result.unzugeordnet.length && result.kanten.every(k => k.status !== 'unknown'),
      [...(!result.bestimmbar ? ['coverage_not_determinable'] : []), ...(result.unzugeordnet.length ? ['unassigned_items'] : []),
        ...(result.kanten.some(k => k.status === 'unknown') ? ['unknown_edge'] : [])]),
    rows: result.kanten.map(k => edgeRow(k, [k.flightItem?.id, k.mobilityItem?.id].filter((id): id is string => !!id), result.bestimmbar)),
    relations: [],
  }
}
const SOURCES = { temporal: 'tripZeitpruefung', lodging: 'unterkunftAbdeckung', flight: 'flugAbdeckung', mobility: 'mobilitaetsAbdeckung' } as const
export type EvaluationDomain = keyof typeof SOURCES
export const sources = SOURCES
export function evaluate(domain: EvaluationDomain, trip: Trip): Evaluation {
  try {
    if (domain === 'temporal') return temporalProjection(tripZeitpruefung(trip))
    if (domain === 'mobility') return mobilityProjection(mobilitaetsAbdeckung(trip))
    if (domain === 'flight') {
      const r = flugAbdeckung(trip)
      return { state: state(r.bestimmbar && !r.unzugeordnet.length && r.abschnitte.every(s => s.status !== 'unknown'),
        [...(!r.bestimmbar ? ['coverage_not_determinable'] : []), ...(r.unzugeordnet.length ? ['unassigned_items'] : []),
          ...(r.abschnitte.some(s => s.status === 'unknown') ? ['unknown_edge'] : [])]),
        rows: r.abschnitte.map(s => edgeRow(s, s.item ? [s.item.id] : [], r.bestimmbar)), relations: [] }
    }
    const r = unterkunftAbdeckung(trip)
    const uncertain = r.aufenthalte.some(s => s.status === 'unknown')
    return { state: state(r.bekannt && !uncertain, [...(!r.bekannt ? ['coverage_not_determinable'] : []), ...(uncertain ? ['unknown_stay'] : [])]),
      relations: [], rows: [{ key: 'night_coverage', comparable: r.bekannt && !uncertain, level: 'canonical_calendar_nights',
        refs: [{ entity: 'trip', id: trip.id }], reasons: ['calendar_coverage_not_hotel_confirmation'],
        value: { bekannt: r.bekannt, naechteGesamt: r.naechteGesamt, naechteAbgedeckt: r.naechteAbgedeckt,
          naechteGebucht: r.naechteGebucht, naechteAusgewaehlt: r.naechteAusgewaehlt,
          // Original gap fields only, no second night enumeration; omit free-form stage names.
          luecken: r.luecken.map(g => ({ start: g.start, end: g.end, naechte: g.naechte, stageId: g.stageId })),
          aufenthalte: r.aufenthalte.map(s => ({ itemId: s.item.id, start: s.start, end: s.end, status: s.status, ausserhalb: s.ausserhalb })) },
      }] }
  } catch { return { state: { state: 'error', reasonCodes: ['canonical_evaluation_error'] }, rows: [], relations: [] } }
}

/** Compare only common, uniquely identifiable rows at the SAME canonical evaluation level. */
export function evaluationChanges(domain: Domain, source: string, a: Evaluation, b: Evaluation, tripId: string): Claim[] {
  const fallback: Ref[] = [{ snapshot: 'baseline', entity: 'trip', id: tripId }, { snapshot: 'observed', entity: 'trip', id: tripId }]
  if ([a.state, b.state].some(s => s.state === 'error' || s.state === 'incomplete')) {
    return [{ id: stable(['evaluation', domain, 'unavailable']), kind: 'unknown', domain, source,
      reasonCodes: ['atomic_domain_comparison_unavailable'], refs: fallback, baseline: a.state.state, observed: b.state.state }]
  }
  const index = (rows: Row[]) => {
    const map = new Map<string, Row>()
    for (const row of rows) map.set(row.key, map.has(row.key) ? { ...row, comparable: false, reasons: ['ambiguous_canonical_identity'], value: { state: 'unknown' } } : row)
    return map
  }
  const left = index(a.rows), right = index(b.rows)
  const claims: Claim[] = []
  for (const key of unique([...left.keys(), ...right.keys()])) {
    const before = left.get(key), after = right.get(key)
    if (before && after && stable(before.value) === stable(after.value) && before.level === after.level) continue
    const comparable = !!before && !!after && before.comparable && after.comparable && before.level === after.level
    const refs = (row: Row | undefined, snapshot: Snapshot) => row?.refs.map(r => ({ ...r, snapshot })) ?? []
    const evidenceRefs = [...refs(before, 'baseline'), ...refs(after, 'observed')]
    claims.push({ id: stable(['evaluation', domain, key]), kind: comparable ? 'canonical_evaluation_delta' : 'unknown', domain, source,
      reasonCodes: unique([comparable ? 'original_canonical_result_changed' : 'no_common_evaluation_level',
        ...(before?.reasons ?? []), ...(after?.reasons ?? []), ...(domain === 'temporal' ? ['no_proven_conflict_is_not_safe'] : [])]),
      refs: evidenceRefs.length ? evidenceRefs : fallback, baseline: before?.value ?? null, observed: after?.value ?? null })
  }
  return claims
}
