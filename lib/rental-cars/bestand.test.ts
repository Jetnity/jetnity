import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mietwagenBestand, mietwagenZeile } from '@/lib/rental-cars/bestand'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import type { Trip, TripItem } from '@/types/trips'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return {
    dayId: null,
    stageId: 'stage-1',
    kind: 'rental_car',
    title: 'Mietwagen Zürich Flughafen → Lugano',
    note: null,
    position: 1,
    startsOn: '2026-09-12',
    startsAt: '09:00',
    endsOn: '2026-09-16',
    endsAt: '18:00',
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    ...leereMobilitaet(),
    originName: 'Zürich Flughafen',
    destinationName: 'Lugano',
    rentalEvidence: 'user',
    ...teil,
  }
}

function reise(ohneTag: TripItem[] = []): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Tessin',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'calm',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Lugano',
        countryCode: 'CH',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-16',
        latitude: null,
        longitude: null,
        placeId: 'geonames:2659836',
      },
    ],
    days: [
      {
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-09-12',
        title: null,
        items: [],
      },
    ],
    ohneTag,
    createdAt: '2026-08-21T10:00:00.000Z',
    updatedAt: '2026-08-21T10:00:00.000Z',
  }
}

describe('Mietwagenbestand', () => {
  test('ohne Mietwagen keine Pflichtaussage in der Übersicht', () => {
    const lage = mietwagenBestand(reise())
    assert.equal(lage.uebersicht, null)
    assert.equal(lage.zusammenfassung, 'Kein Mietwagen eingetragen.')
  })

  test('geplanter Mietwagen bleibt geplant, nicht gebucht', () => {
    const lage = mietwagenBestand(reise([punkt({ id: 'r-1' })]))
    assert.match(lage.zusammenfassung, /geplant/)
    assert.doesNotMatch(lage.zusammenfassung, /gebucht/)
    assert.match(mietwagenZeile(punkt({ id: 'r-1' })), /geplant/)
  })

  test('ausdrücklich gebuchter Mietwagen heisst gebucht', () => {
    const lage = mietwagenBestand(
      reise([
        punkt({
          id: 'r-2',
          bookingStatus: 'booked',
          bookingSource: 'user',
          bookingConfirmedAt: '2026-08-21T10:00:00.000Z',
        }),
      ]),
    )
    assert.match(lage.zusammenfassung, /gebucht/)
  })
})
