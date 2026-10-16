/** Synthetic fixtures only, imported exclusively by this namespace's tests. */
import { reiseSchema } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

export function fixture(): Trip {
  return reiseSchema.parse({ id: 'trip-synthetic', clientRef: 'trip-synthetic', title: 'Synthetische Reise',
    origin: 'Zürich', originPlaceId: 'airport:ZRH', startDate: '2026-10-01', endDate: '2026-10-05',
    pace: 'balanced', revision: 1, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
    stages: [
      { id: 'stage-panama', position: 1, name: 'Panama', placeId: 'airport:PTY', countryCode: 'PA', arrivalDate: '2026-10-01', departureDate: '2026-10-03' },
      { id: 'stage-costa-rica', position: 2, name: 'Costa Rica', placeId: 'airport:SJO', countryCode: 'CR', arrivalDate: '2026-10-03', departureDate: '2026-10-05' },
    ],
    days: [
      { id: 'day-1', dayIndex: 1, dayDate: '2026-10-01', stageId: 'stage-panama', items: [] },
      { id: 'day-2', dayIndex: 2, dayDate: '2026-10-02', stageId: 'stage-panama', items: [] },
      { id: 'day-3', dayIndex: 3, dayDate: '2026-10-03', stageId: 'stage-costa-rica', items: [] },
    ], ohneTag: [],
  })
}
export function point(id: string, extra: Partial<TripItem> = {}): TripItem {
  const trip = fixture()
  const raw = { id, title: 'Synthetischer Planpunkt', dayId: 'day-1', stageId: 'stage-panama', kind: 'activity',
    startsOn: '2026-10-01', startsAt: '10:00', endsOn: '2026-10-01', endsAt: '11:00', ...extra }
  return reiseSchema.parse({ ...trip, days: [{ ...trip.days[0], items: [raw] }] }).days[0].items[0]
}
export function flight(id = 'flight'): TripItem {
  const airport = (airportCode: string, countryCode: string) => ({ airportCode, countryCode, city: null, country: null })
  return point(id, { kind: 'flight', routeItinerary: { v: 1, type: 'flight_route_itinerary', legs: [{ segments: [{
    origin: airport('ZRH', 'CH'), destination: airport('PTY', 'PA'), departureDate: '2026-10-01', departureTime: '10:00',
    arrivalDate: '2026-10-01', arrivalTime: '11:00',
  }] }] } })
}
export function atAirport(id: string, extra: Partial<TripItem> = {}): TripItem {
  return point(id, { kind: 'transfer', mobilityMode: 'transfer', originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH', ...extra })
}
export function freeze(value: object): void {
  for (const v of Object.values(value)) if (v && typeof v === 'object') freeze(v)
  Object.freeze(value)
}
