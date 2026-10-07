import { reiseLesen } from '@/lib/trips/schema'
import type { Trip } from '@/types/trips'
export function fixture(): Trip {
  return reiseLesen({ id: 'trip-direct-fixture', title: 'Synthetische Reise', pace: 'balanced', interests: ['culture'],
    origin: 'Zürich', originPlaceId: 'geonames:2657896', startDate: '2026-10-07', endDate: '2026-10-10', currency: 'CHF', budgetAmount: 1200,
    revision: 1, createdAt: '2026-10-07T10:00:00.000Z', updatedAt: '2026-10-07T10:00:00.000Z',
    stages: [1, 2].map(i => ({ id: `stage-${i}`, name: 'Florenz', position: i, placeId: 'geonames:3176959', countryCode: 'IT', latitude: 43.77, longitude: 11.25,
      arrivalDate: `2026-10-${i === 1 ? '07' : '09'}`, departureDate: `2026-10-${i === 1 ? '08' : '10'}` })),
    days: [1, 2, 3, 4].map(i => ({ id: `day-${i}`, stageId: `stage-${i < 3 ? 1 : 2}`, dayIndex: i, dayDate: `2026-10-${String(6+i).padStart(2,'0')}`,
      items: [{ id: `item-${i}`, dayId: `day-${i}`, stageId: `stage-${i < 3 ? 1 : 2}`, title: i === 4 ? 'Geschützte Unterkunft' : `Planpunkt ${i}`, kind: i === 4 ? 'stay' : 'note',
        startsOn: '2026-10-09', endsOn: '2026-10-10', startsAt: '14:00', endsAt: '15:00', priceAmount: i === 4 ? 0 : null,
        priceCurrency: i === 4 ? 'CHF' : null, bookingStatus: i === 4 ? 'booked' : 'unconfirmed', bookingSource: i === 4 ? 'user' : null,
        bookingConfirmedAt: i === 4 ? '2026-10-01T10:00:00.000Z' : null }] })),
  })!
}

// A date shift moves only the unprotected transfer onto the fixed booking's date.
// Shared explicit civil clock context yields a real possible conflict, never a
// fabricated proven conflict from missing timezone evidence.
export function conflictFixture(): Trip {
  const trip = fixture(), day = trip.days[0], point = day.items[0]
  return reiseLesen({ ...trip, days: trip.days.map(d => ({ ...d, items: d.id === day.id ? [
    { ...point, title: 'Verschiebbarer Transfer', kind: 'transfer', mobilityEvidence: 'user',
      originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH',
      startsOn: '2026-10-07', endsOn: '2026-10-07', startsAt: '10:00', endsAt: '11:00' },
    { ...point, id: 'fixed-transfer', position: 2, title: 'Fest gebuchter Transfer', kind: 'transfer', mobilityEvidence: 'user',
      originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH',
      startsOn: '2026-10-09', endsOn: '2026-10-09', startsAt: '10:30', endsAt: '11:30',
      bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: '2026-10-01T10:00:00.000Z' },
  ] : [] })) })!
}
