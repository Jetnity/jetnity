// lib/trips/flug-abdeckung.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'

function flug(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH → DPS · Swiss',
    note: null,
    position: 1,
    startsOn: '2026-08-30',
    startsAt: '10:00',
    endsOn: '2026-08-31',
    endsAt: '06:00',
    priceAmount: 890,
    priceCurrency: 'CHF',
    provider: 'duffel',
    externalRef: 'off_1',
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    ...teil,
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: 'ID',
    arrivalDate: '2026-08-30',
    departureDate: '2026-09-13',
    latitude: null,
    longitude: null,
    placeId: 'geonames:1650535',
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-08-30',
    endDate: '2026-09-13',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [etappe({ id: 'stage-1', name: 'Bali' })],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Flugabdeckung', () => {
  test('Hinflug gebucht und Rückflug offen', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [
          flug({
            id: 'hin',
            startsOn: '2026-08-30',
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
          }),
        ],
      }),
    )
    assert.equal(ergebnis.bestimmbar, true)
    assert.equal(ergebnis.abschnitte[0]?.art, 'outbound')
    assert.equal(ergebnis.abschnitte[0]?.status, 'booked')
    assert.equal(ergebnis.abschnitte[1]?.art, 'return')
    assert.equal(ergebnis.abschnitte[1]?.status, 'open')
    assert.equal(ergebnis.zusammenfassung, 'Hinflug gebucht · Rückflug offen')
  })

  test('ein ausgewählter Flug am Abreisetag füllt den Rückflug', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [flug({ id: 'rueck', startsOn: '2026-09-13', title: 'DPS → ZRH' })],
      }),
    )
    assert.equal(ergebnis.abschnitte[0]?.status, 'open')
    assert.equal(ergebnis.abschnitte[1]?.status, 'selected')
    assert.equal(ergebnis.zusammenfassung, 'Hinflug offen · Rückflug ausgewählt')
  })

  test('ohne Origin keine erfundenen Abschnitte', () => {
    const ergebnis = flugAbdeckung(
      reise({
        origin: null,
        originPlaceId: null,
        ohneTag: [flug({ id: 'hin' })],
      }),
    )
    assert.equal(ergebnis.bestimmbar, false)
    assert.equal(ergebnis.abschnitte.length, 0)
    assert.equal(ergebnis.unzugeordnet.length, 1)
    assert.match(ergebnis.zusammenfassung, /noch nicht vollständig bestimmbar/)
  })

  test('kein IATA-Code aus Ortsnamen raten', () => {
    const ergebnis = flugAbdeckung(reise())
    assert.equal(ergebnis.abschnitte.some((abschnitt) => abschnitt.originName === 'ZRH'), false)
    assert.equal(ergebnis.abschnitte[0]?.originName, 'Zürich')
    assert.equal(ergebnis.abschnitte[0]?.destinationName, 'Bali')
    assert.equal(ergebnis.zusammenfassung, 'Noch kein Flug ausgewählt')
  })

  test('ein unzugeordneter Restflug zerstört keinen eindeutigen Match', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [
          flug({ id: 'hin', startsOn: '2026-08-30' }),
          flug({ id: 'extra', startsOn: '2026-09-01', title: 'Zusatzflug', position: 2 }),
        ],
      }),
    )
    assert.equal(ergebnis.abschnitte[0]?.status, 'selected')
    assert.equal(ergebnis.abschnitte[0]?.item?.id, 'hin')
    assert.equal(ergebnis.abschnitte[1]?.status, 'unknown')
    assert.equal(ergebnis.unzugeordnet.length, 1)
    assert.equal(ergebnis.unzugeordnet[0]?.id, 'extra')
  })

  test('zwei Flüge am selben Tag bleiben unbestimmt statt falsch zugeordnet', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [
          flug({ id: 'a', startsOn: '2026-08-30' }),
          flug({ id: 'b', startsOn: '2026-08-30', position: 2, title: 'ZRH → DPS · Alternative' }),
        ],
      }),
    )
    assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
    assert.equal(ergebnis.abschnitte[0]?.item, null)
    assert.equal(ergebnis.unzugeordnet.length, 2)
    assert.match(ergebnis.zusammenfassung, /noch nicht vollständig bestimmbar/)
  })

  test('Flug ohne Datum wird nicht einer Strecke zugeordnet', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [flug({ id: 'offen', startsOn: null, endsOn: null })],
      }),
    )
    assert.equal(ergebnis.abschnitte.every((abschnitt) => abschnitt.status === 'unknown'), true)
    assert.equal(ergebnis.unzugeordnet.length, 1)
  })

  test('gleiche Origin- und Zielorte brauchen keinen Flugabschnitt', () => {
    const ergebnis = flugAbdeckung(
      reise({
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
        stages: [
          etappe({
            id: 'stage-1',
            name: 'Zürich',
            placeId: 'geonames:2657896',
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-13',
          }),
        ],
      }),
    )
    assert.equal(ergebnis.abschnitte.length, 0)
    assert.equal(ergebnis.zusammenfassung, 'Kein Flugabschnitt erforderlich')
  })

  test('Multi-Stage erzeugt Zwischenstrecken nur bei wechselndem Ort', () => {
    const ergebnis = flugAbdeckung(
      reise({
        stages: [
          etappe({
            id: 'stage-1',
            name: 'Bali',
            position: 1,
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-05',
          }),
          etappe({
            id: 'stage-2',
            name: 'Singapur',
            position: 2,
            arrivalDate: '2026-09-05',
            departureDate: '2026-09-13',
            placeId: 'geonames:1880252',
          }),
        ],
        ohneTag: [
          flug({ id: 'hin', startsOn: '2026-08-30' }),
          flug({
            id: 'weiter',
            startsOn: '2026-09-05',
            title: 'DPS → SIN',
            position: 2,
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
          }),
        ],
      }),
    )
    assert.deepEqual(
      ergebnis.abschnitte.map((abschnitt) => `${abschnitt.art}:${abschnitt.status}`),
      ['outbound:selected', 'connection:booked', 'return:open'],
    )
    assert.equal(ergebnis.abschnitte[1]?.originName, 'Bali')
    assert.equal(ergebnis.abschnitte[1]?.destinationName, 'Singapur')
    assert.equal(ergebnis.zusammenfassung, 'Hinflug ausgewählt · Bali → Singapur gebucht · Rückflug offen')
  })
})
