// lib/trips/naechte-abdeckung.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { naechteHalboffen, unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'

function stay(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return {
    dayId: null,
    stageId: 'stage-1',
    kind: 'stay',
    title: 'Hotel',
    note: null,
    position: 1,
    startsOn: '2026-08-30',
    startsAt: null,
    endsOn: '2026-09-05',
    endsAt: null,
    priceAmount: 800,
    priceCurrency: 'CHF',
    provider: 'test',
    externalRef: 'stay-1',
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

describe('Halboffenes Nachtintervall', () => {
  test('30. Aug. bis 5. Sept. deckt sechs Nächte, nicht die Check-out-Nacht', () => {
    assert.deepEqual(naechteHalboffen('2026-08-30', '2026-09-05'), [
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
    ])
  })

  test('eine Nacht ist Check-in bis zum nächsten Morgen', () => {
    assert.deepEqual(naechteHalboffen('2026-08-30', '2026-08-31'), ['2026-08-30'])
  })

  test('Schaltjahr und Monatswechsel', () => {
    assert.deepEqual(naechteHalboffen('2028-02-28', '2028-03-01'), ['2028-02-28', '2028-02-29'])
    assert.deepEqual(naechteHalboffen('2027-02-28', '2027-03-01'), ['2027-02-28'])
  })

  test('ungültige oder leere Intervalle bleiben leer', () => {
    assert.deepEqual(naechteHalboffen('2026-08-30', '2026-08-30'), [])
    assert.deepEqual(naechteHalboffen('2026-08-31', '2026-08-30'), [])
  })
})

describe('Unterkunftsabdeckung', () => {
  test('eine Nacht', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        startDate: '2026-08-30',
        endDate: '2026-08-31',
        stages: [
          etappe({
            id: 'stage-1',
            name: 'Bali',
            arrivalDate: '2026-08-30',
            departureDate: '2026-08-31',
          }),
        ],
        ohneTag: [stay({ id: 's1', startsOn: '2026-08-30', endsOn: '2026-08-31' })],
      }),
    )
    assert.equal(ergebnis.naechteGesamt, 1)
    assert.equal(ergebnis.naechteAbgedeckt, 1)
    assert.equal(ergebnis.luecken.length, 0)
    assert.equal(ergebnis.zusammenfassung, '1/1 Nächte abgedeckt')
  })

  test('vollständige Abdeckung', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [stay({ id: 's1', startsOn: '2026-08-30', endsOn: '2026-09-13' })],
      }),
    )
    assert.equal(ergebnis.bekannt, true)
    assert.equal(ergebnis.naechteGesamt, 14)
    assert.equal(ergebnis.naechteAbgedeckt, 14)
    assert.equal(ergebnis.luecken.length, 0)
    assert.equal(ergebnis.zusammenfassung, '14/14 Nächte abgedeckt')
  })

  test('Anfangslücke', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [stay({ id: 's1', startsOn: '2026-09-03', endsOn: '2026-09-13' })],
      }),
    )
    assert.equal(ergebnis.naechteAbgedeckt, 10)
    assert.deepEqual(
      ergebnis.luecken.map((luecke) => ({ start: luecke.start, end: luecke.end, naechte: luecke.naechte })),
      [{ start: '2026-08-30', end: '2026-09-03', naechte: 4 }],
    )
  })

  test('Endlücke', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [stay({ id: 's1', startsOn: '2026-08-30', endsOn: '2026-09-09' })],
      }),
    )
    assert.equal(ergebnis.naechteAbgedeckt, 10)
    assert.deepEqual(
      ergebnis.luecken.map((luecke) => ({ start: luecke.start, end: luecke.end, naechte: luecke.naechte })),
      [{ start: '2026-09-09', end: '2026-09-13', naechte: 4 }],
    )
    assert.match(ergebnis.zusammenfassung, /10\/14 Nächte abgedeckt/)
  })

  test('Lücke in der Mitte', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [
          stay({ id: 's1', startsOn: '2026-08-30', endsOn: '2026-09-05' }),
          stay({ id: 's2', startsOn: '2026-09-09', endsOn: '2026-09-13', position: 2 }),
        ],
      }),
    )
    assert.equal(ergebnis.naechteAbgedeckt, 10)
    assert.deepEqual(
      ergebnis.luecken.map((luecke) => ({ start: luecke.start, end: luecke.end, naechte: luecke.naechte })),
      [{ start: '2026-09-05', end: '2026-09-09', naechte: 4 }],
    )
  })

  test('mehrere angrenzende Stays zählen ohne Doppelung', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [
          stay({ id: 's1', startsOn: '2026-08-30', endsOn: '2026-09-05' }),
          stay({ id: 's2', startsOn: '2026-09-05', endsOn: '2026-09-13', position: 2 }),
        ],
      }),
    )
    assert.equal(ergebnis.naechteAbgedeckt, 14)
    assert.equal(ergebnis.luecken.length, 0)
  })

  test('überlappende Stays zählen Nächte nicht doppelt', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [
          stay({ id: 's1', startsOn: '2026-08-30', endsOn: '2026-09-08' }),
          stay({ id: 's2', startsOn: '2026-09-03', endsOn: '2026-09-13', position: 2 }),
        ],
      }),
    )
    assert.equal(ergebnis.naechteGesamt, 14)
    assert.equal(ergebnis.naechteAbgedeckt, 14)
  })

  test('Stay ausserhalb des Reisezeitraums deckt nichts', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [stay({ id: 's1', startsOn: '2026-07-01', endsOn: '2026-07-08' })],
      }),
    )
    assert.equal(ergebnis.naechteAbgedeckt, 0)
    assert.equal(ergebnis.aufenthalte[0]?.ausserhalb, true)
    assert.equal(ergebnis.luecken[0]?.naechte, 14)
  })

  test('Stay ohne Daten auf bekannter Reise behauptet keine 0/14', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [stay({ id: 's1', startsOn: null, endsOn: null })],
      }),
    )
    assert.equal(ergebnis.bekannt, true)
    assert.equal(ergebnis.naechteGesamt, 14)
    assert.equal(ergebnis.aufenthalte[0]?.status, 'unknown')
    assert.equal(ergebnis.zusammenfassung, 'Abdeckung noch nicht vollständig bestimmbar')
  })

  test('fehlende Daten behaupten keine 0/14-Abdeckung', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        startDate: null,
        endDate: null,
        stages: [etappe({ id: 'stage-1', name: 'Bali', arrivalDate: null, departureDate: null })],
        ohneTag: [stay({ id: 's1', startsOn: null, endsOn: null })],
      }),
    )
    assert.equal(ergebnis.bekannt, false)
    assert.equal(ergebnis.naechteGesamt, null)
    assert.equal(ergebnis.zusammenfassung, 'Abdeckung noch nicht vollständig bestimmbar')
    assert.equal(ergebnis.aufenthalte[0]?.status, 'unknown')
  })

  test('gebuchte Nächte unterscheiden sich von ausgewählten', () => {
    const ergebnis = unterkunftAbdeckung(
      reise({
        ohneTag: [
          stay({
            id: 's1',
            startsOn: '2026-08-30',
            endsOn: '2026-09-05',
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
          }),
          stay({ id: 's2', startsOn: '2026-09-05', endsOn: '2026-09-13', position: 2 }),
        ],
      }),
    )
    assert.equal(ergebnis.naechteGebucht, 6)
    assert.equal(ergebnis.naechteAusgewaehlt, 8)
    assert.match(ergebnis.zusammenfassung, /6 gebucht/)
  })

  test('Multi-Stage behandelt Etappen getrennt und vereinigt die Gesamtzahl', () => {
    const ergebnis = unterkunftAbdeckung(
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
            departureDate: '2026-09-09',
            placeId: 'geonames:1880252',
          }),
        ],
        ohneTag: [stay({ id: 's1', startsOn: '2026-08-30', endsOn: '2026-09-05', stageId: 'stage-1' })],
      }),
    )
    assert.equal(ergebnis.naechteGesamt, 10)
    assert.equal(ergebnis.naechteAbgedeckt, 6)
    assert.equal(ergebnis.luecken.length, 1)
    assert.equal(ergebnis.luecken[0]?.stageName, 'Singapur')
    assert.equal(ergebnis.luecken[0]?.naechte, 4)
  })
})
