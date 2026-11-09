import type { Trip } from '@/types/trips'
import { normal, tag, type Abschnitt, type Ort } from './katalog'

/** The arrival day of the destination or departure day of the previous stop supplies the leg date. */
export function reiseAbschnitte(reise: Trip): Abschnitt[] {
  const stages = [...reise.stages].sort((a, b) => a.position - b.position)
  const stopps = stages.map((s) => ({
    ort: {
      id: 'reise:' + s.id,
      name: s.name,
      country: s.countryCode ?? '',
      lat: s.latitude,
      lng: s.longitude,
      placeId: s.placeId,
    } satisfies Ort,
    an: s.arrivalDate,
    ab: s.departureDate,
  }))
  const legs: Abschnitt[] = []
  for (let i = 1; i < stopps.length; i++) {
    const a = stopps[i - 1]!,
      b = stopps[i]!
    if (a.ort.placeId && a.ort.placeId === b.ort.placeId) continue
    const datum = [b.an, a.ab].find((v) => v && tag(v)) ?? ''
    legs.push({ von: a.ort, nach: b.ort, datum })
  }
  const start = stopps[0]
  if (
    reise.origin &&
    start &&
    normal(reise.origin) !== normal(start.ort.name) &&
    !(reise.originPlaceId && reise.originPlaceId === start.ort.placeId)
  ) {
    const von: Ort = {
      id: 'reise:ursprung',
      name: reise.origin,
      country: '',
      lat: null,
      lng: null,
      placeId: reise.originPlaceId,
    }
    legs.push({ von, nach: start.ort, datum: reise.startDate ?? start.an ?? '' })
  }
  return legs
}
