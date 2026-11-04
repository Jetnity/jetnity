import { chronologischeLaeufe } from '@/lib/trips/n12-chronology-1/laeufe'
import type { Trip } from '@/types/trips'

export type MapStop = {
  index: number
  stageId: string
  name: string
  position: { lat: number; lng: number } | null
  dayIds: string[]
}

/** Projection only: no geocoding, new place identity or inferred day assignment. */
export function tripMapStops(trip: Trip): MapStop[] {
  const chronology = chronologischeLaeufe(trip)
  const ids = new Map<string, number>()
  for (const stage of trip.stages) ids.set(stage.id, (ids.get(stage.id) ?? 0) + 1)
  return [...trip.stages].sort((a, b) => a.position - b.position).map((stage, index) => {
    const { latitude: lat, longitude: lng } = stage
    const position = typeof lat === 'number' && typeof lng === 'number'
      && Number.isFinite(lat) && Number.isFinite(lng)
      && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
    return {
      index,
      stageId: stage.id,
      name: stage.name,
      position,
      dayIds: chronology.gueltig && ids.get(stage.id) === 1
        ? chronology.laeufe.filter((run) => run.stageId === stage.id).flatMap((run) => run.tage.map((day) => day.id))
        : [],
    }
  })
}

/** Retain the selected day on repeated visits; otherwise use its first actual day. */
export function mapStopDay(stop: MapStop, selectedDay: string): string | null {
  return stop.dayIds.includes(selectedDay) ? selectedDay : stop.dayIds[0] ?? null
}

/** Only marker indices, coordinates and names; no internal IDs, dates or travellers. */
export function mapWireStops(stops: readonly MapStop[]) {
  return stops.flatMap((stop) => stop.position
    ? [{ index: stop.index, label: stop.name, ...stop.position }]
    : [])
}
