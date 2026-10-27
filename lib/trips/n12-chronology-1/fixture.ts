import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-06-01T00:00:00.000Z'

export function n12Punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: null,
    stageId: null,
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    ...teil,
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name' | 'position'>): TripStage {
  return {
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex'>): TripDay {
  return {
    stageId: null,
    dayDate: null,
    title: null,
    items: [],
    ...teil,
  }
}

function datum(index: number): string {
  return `2026-06-${String(index).padStart(2, '0')}`
}

/** 22 gespeicherte Tage, 1. Juni bis 22. Juni. Kein privates Konto. */
export function n12Reise(): Trip {
  const days: TripDay[] = []
  for (let index = 1; index <= 22; index += 1) {
    const id = `day-${index}`
    const basis = tag({
      id,
      dayIndex: index,
      dayDate: datum(index),
      stageId: index >= 2 && index <= 10 ? 'stage-bkk' : index >= 12 && index <= 21 ? 'stage-cnx' : null,
    })
    if (index === 1) {
      basis.items = [
        n12Punkt({
          id: 'flight-out',
          kind: 'flight',
          title: 'ZRH–BKK',
          dayId: id,
          position: 1,
          startsOn: '2026-06-01',
          startsAt: '22:10',
          endsOn: '2026-06-02',
          endsAt: '14:40',
        }),
      ]
    }
    if (index === 11) {
      basis.items = [
        n12Punkt({
          id: 'transfer-11',
          kind: 'transfer',
          title: 'Ortswechsel',
          dayId: id,
          position: 1,
          startsOn: '2026-06-11',
          startsAt: '09:00',
          endsOn: '2026-06-11',
          endsAt: '13:00',
          mobilityMode: 'rail',
          mobilityEvidence: 'user',
        }),
        n12Punkt({
          id: 'stay-11',
          kind: 'stay',
          title: 'Nachmittag vor Ort',
          dayId: id,
          position: 2,
          startsOn: '2026-06-11',
          endsOn: '2026-06-12',
        }),
      ]
    }
    if (index === 22) {
      basis.items = [
        n12Punkt({
          id: 'flight-back',
          kind: 'flight',
          title: 'BKK–ZRH',
          dayId: id,
          position: 1,
          startsOn: '2026-06-22',
          startsAt: '11:00',
          endsOn: '2026-06-22',
          endsAt: '18:00',
          bookingStatus: 'booked',
          bookingSource: 'user',
          bookingConfirmedAt: JETZT,
        }),
      ]
    }
    days.push(basis)
  }

  return {
    id: 'trip-n12',
    clientRef: 'trip-n12',
    title: 'Bangkok und Chiang Mai',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-06-01',
    endDate: '2026-06-22',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'calm',
    interests: ['culture'],
    travelWish: null,
    dayStageAssignmentMode: 'unassigned',
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({ id: 'stage-bkk', name: 'Bangkok', countryCode: 'TH', position: 1 }),
      etappe({ id: 'stage-cnx', name: 'Chiang Mai', countryCode: 'TH', position: 2 }),
    ],
    days,
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}
