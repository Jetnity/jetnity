// lib/trips/trip-audit-v1/f05-ground-flight.ts
//
// Audit-only reconciliation of an open flight segment with one stored ground
// connection. Place names, countries, coordinates and provider links are not
// evidence. A user-selected transfer is not a provider booking.

import type { Bewegungskante, MobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { istGebucht } from '@/lib/trips/buchung'
import type { FlugAbschnitt, FlugAbdeckung } from '@/lib/trips/flug-abdeckung'
import { MOBILITY_MODES, type MobilityMode } from '@/types/trips'

export type F05FlightGapAdjustment =
  | { kind: 'keep' }
  | { kind: 'withhold' }
  | { kind: 'ground'; itemId: string; userMarkedBooked: boolean }

type FlightProjection = Pick<FlugAbdeckung, 'bestimmbar' | 'abschnitte' | 'unzugeordnet'>
type MobilityProjection = Pick<MobilitaetsAbdeckung, 'bestimmbar' | 'kanten' | 'unzugeordnet'>

const GROUND_MODES: ReadonlySet<string> = new Set(MOBILITY_MODES)

function validPlace(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 80 && value === value.trim() && !/\s/u.test(value)
}

function validDate(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function recognizedMode(value: string | null): value is MobilityMode {
  return value !== null && GROUND_MODES.has(value)
}

function directedKey(art: string, originPlaceId: string | null, destinationPlaceId: string | null): string | null {
  if (!validPlace(originPlaceId) || !validPlace(destinationPlaceId)) return null
  return `${art}\u0000${originPlaceId}\u0000${destinationPlaceId}`
}

function sameIds(left: readonly { id: string }[], right: readonly { id: string }[]): boolean {
  if (left.length !== right.length) return false
  const a = left.map((row) => row.id).sort()
  const b = right.map((row) => row.id).sort()
  return a.every((id, index) => id === b[index])
}

/** Stage occurrence ids encoded by the existing projection id. A colon inside
 * a stage id fails closed because `connection:from:to` would be ambiguous.
 */
function endpointStageIds(sectionId: string, art: FlugAbschnitt['art']): string[] | null {
  if (art === 'outbound' && sectionId.startsWith('outbound:')) {
    const id = sectionId.slice('outbound:'.length)
    return id.length > 0 && !id.includes(':') ? [id] : null
  }
  if (art === 'return' && sectionId.startsWith('return:')) {
    const id = sectionId.slice('return:'.length)
    return id.length > 0 && !id.includes(':') ? [id] : null
  }
  if (art === 'connection' && sectionId.startsWith('connection:')) {
    const rest = sectionId.slice('connection:'.length)
    const cut = rest.indexOf(':')
    if (cut <= 0 || cut >= rest.length - 1) return null
    const from = rest.slice(0, cut)
    const to = rest.slice(cut + 1)
    if (from.length === 0 || to.length === 0 || to.includes(':')) return null
    return [from, to]
  }
  return null
}

function repeatedDirectedPair(
  segment: FlugAbschnitt,
  abschnitte: readonly FlugAbschnitt[],
  mobility: MobilityProjection,
): boolean {
  const key = directedKey(segment.art, segment.originPlaceId, segment.destinationPlaceId)
  if (!key) return false
  const twins = abschnitte.filter((row) => directedKey(row.art, row.originPlaceId, row.destinationPlaceId) === key)
  if (twins.length < 2) return false
  return mobility.kanten.some((edge) =>
    directedKey(edge.art, edge.originPlaceId, edge.destinationPlaceId) === key
    && (edge.status !== 'open' || edge.mobilityItem != null || edge.flightItem != null))
}

function groundProof(segment: FlugAbschnitt, edge: Bewegungskante): F05FlightGapAdjustment | null {
  const item = edge.mobilityItem
  if (!item || edge.flightItem || segment.item) return null
  if (segment.status !== 'open') return null
  if (edge.status !== 'selected' && edge.status !== 'booked') return null
  if (item.kind !== 'transfer' || !recognizedMode(item.mobilityMode)) return null
  if (!validPlace(segment.originPlaceId) || !validPlace(segment.destinationPlaceId)) return null
  if (edge.originPlaceId !== segment.originPlaceId || edge.destinationPlaceId !== segment.destinationPlaceId) return null
  if (item.originPlaceId !== segment.originPlaceId || item.destinationPlaceId !== segment.destinationPlaceId) return null
  if (!validDate(segment.date) || edge.date !== segment.date || item.startsOn !== segment.date) return null
  const stages = endpointStageIds(segment.id, segment.art)
  const boundStage = segment.art === 'connection' ? stages?.[1] : stages?.[0]
  if (!boundStage || item.stageId !== boundStage) return null
  const userMarkedBooked = istGebucht(item)
  if (userMarkedBooked && item.bookingSource !== 'user') return null
  if (!userMarkedBooked && item.bookingSource != null) return null
  if (edge.status === 'booked' && !userMarkedBooked) return null
  if (edge.status === 'selected' && userMarkedBooked) return null
  return { kind: 'ground', itemId: item.id, userMarkedBooked }
}

/** Decide whether an open, dated flight segment may stay a known gap.
 * `keep` preserves the existing flight gap. `ground` is the only suppression,
 * and only as unknown flight necessity. `withhold` is fail-closed: no flight
 * obligation and no ground-coverage claim.
 */
export function f05AdjustFlightKnownGap(
  segment: FlugAbschnitt,
  flights: FlightProjection,
  mobility: MobilityProjection,
): F05FlightGapAdjustment {
  if (!flights.bestimmbar || !mobility.bestimmbar) return { kind: 'withhold' }
  if (flights.unzugeordnet.length > 0 || mobility.unzugeordnet.length > 0) return { kind: 'withhold' }
  if (!sameIds(flights.abschnitte, mobility.kanten)) return { kind: 'withhold' }

  const edges = mobility.kanten.filter((edge) => edge.id === segment.id)
  if (edges.length !== 1) return { kind: 'withhold' }
  const edge = edges[0]
  if (edge.art !== segment.art) return { kind: 'withhold' }
  if (repeatedDirectedPair(segment, flights.abschnitte, mobility)) return { kind: 'withhold' }
  if (edge.status === 'open' && edge.mobilityItem == null && edge.flightItem == null) return { kind: 'keep' }
  return groundProof(segment, edge) ?? { kind: 'withhold' }
}
