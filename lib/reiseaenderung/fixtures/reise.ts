// lib/reiseaenderung/fixtures/reise.ts
//
// Eine kleine, vertrauenswürdige Reise für Pipeline-Tests.

import type { Reisegraph, TripDay, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-20T08:00:00.000Z'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'title'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    kind: 'activity',
    note: null,
    position: 1,
    startsOn: '2026-09-12',
    startsAt: '09:00',
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

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex'>): TripDay {
  return {
    stageId: 'stage-1',
    dayDate: `2026-09-${11 + teil.dayIndex}`,
    title: null,
    items: [],
    ...teil,
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'position' | 'name'>): TripStage {
  return {
    countryCode: 'IT',
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

export function beispielreise(abweichung: Partial<Reisegraph> = {}): Reisegraph {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Italien',
    origin: 'Zürich',
    originPlaceId: null,
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4000,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture'],
    travelWish: 'Erst Florenz, dann Rom.',
    revision: 3,
    lastMutationId: null,
    stages: [
      etappe({
        id: 'stage-1',
        position: 1,
        name: 'Florenz',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-14',
      }),
      etappe({
        id: 'stage-2',
        position: 2,
        name: 'Rom',
        arrivalDate: '2026-09-15',
        departureDate: '2026-09-16',
      }),
    ],
    days: [
      tag({
        id: 'day-1',
        dayIndex: 1,
        title: 'Anreise',
        items: [
          punkt({
            id: 'item-1',
            title: 'Dom',
            priceAmount: 18,
            priceCurrency: 'EUR',
            provider: 'getyourguide',
            externalRef: 'gyg-1',
            bookingUrl: 'https://example.com/dom',
          }),
        ],
      }),
      tag({
        id: 'day-2',
        dayIndex: 2,
        items: [punkt({ id: 'item-2', title: 'Uffizien', dayId: 'day-2' })],
      }),
      tag({ id: 'day-3', dayIndex: 3, items: [] }),
      tag({
        id: 'day-4',
        dayIndex: 4,
        stageId: 'stage-2',
        items: [punkt({ id: 'item-3', title: 'Kolosseum', dayId: 'day-4', stageId: 'stage-2' })],
      }),
      tag({ id: 'day-5', dayIndex: 5, stageId: 'stage-2', items: [] }),
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
    ohneTag: [],
    ...abweichung,
  }
}
