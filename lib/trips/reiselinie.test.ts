import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { n12Punkt } from '@/lib/trips/n12-chronology-1/fixture'
import { chronologischeLaeufe } from '@/lib/trips/n12-chronology-1/laeufe'
import { laufUnterkunftLeser, laufUnterkunftText } from '@/lib/trips/reiselinie'
import type { Trip, TripDay, TripItem } from '@/types/trips'

function tag(index: number, stageId: string): TripDay {
  return { id: `d${index}`, dayIndex: index, dayDate: `2026-06-0${index}`, stageId, title: null, items: [] }
}

function reise(punkte: TripItem[] = [], stages: Partial<Trip['stages'][number]>[] = []): Trip {
  const tage = [tag(1, 'bkk'), tag(2, 'bkk'), tag(3, 'bkk'), tag(4, 'krabi'), tag(5, 'krabi'), tag(6, 'krabi')]
  tage[0]!.items = punkte
  const ergebnis: Trip = {
    id: 't', clientRef: 't', title: 'Thailand', origin: null, originPlaceId: null,
    startDate: '2026-06-01', endDate: '2026-06-06', travellers: 2, currency: 'CHF', budgetAmount: null,
    status: 'draft', pace: 'calm', interests: [], travelWish: null, dayStageAssignmentMode: 'explicit',
    revision: 1, lastMutationId: null, ohneTag: [], days: tage,
    stages: [
      { id: 'bkk', name: 'Bangkok', position: 1, countryCode: 'TH', arrivalDate: '2026-06-01', departureDate: '2026-06-04', latitude: null, longitude: null, placeId: null, ...stages[0] },
      { id: 'krabi', name: 'Krabi', position: 2, countryCode: 'TH', arrivalDate: '2026-06-04', departureDate: '2026-06-06', latitude: null, longitude: null, placeId: null, ...stages[1] },
    ],
    createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z',
  }
  return ergebnis
}

function staende(r: Trip) {
  const lesen = laufUnterkunftLeser(r)
  return chronologischeLaeufe(r).laeufe.map((lauf) => [lauf.name, lesen(lauf)])
}

describe('Reiselinie – Unterkunft pro Etappe', () => {
  test('ohne Unterkunft sind alle Nächte der Etappe offen', () => {
    assert.deepEqual(staende(reise()), [
      ['Bangkok', { naechte: 3, offen: 3 }],
      ['Krabi', { naechte: 2, offen: 2 }],
    ])
  })

  test('eine ausgewählte Unterkunft deckt ihre Nächte, die andere Etappe bleibt offen', () => {
    const hotel = n12Punkt({ id: 'h', kind: 'stay', title: 'Hotel', dayId: 'd1', startsOn: '2026-06-01', endsOn: '2026-06-03' })
    assert.deepEqual(staende(reise([hotel])), [
      ['Bangkok', { naechte: 3, offen: 1 }],
      ['Krabi', { naechte: 2, offen: 2 }],
    ])
  })

  test('ein unklarer Aufenthalt macht die ganze Reiselinie stumm', () => {
    const unklar = n12Punkt({ id: 'u', kind: 'stay', title: 'Hotel', dayId: 'd1' })
    assert.deepEqual(staende(reise([unklar])).map(([, stand]) => stand), [null, null])
  })

  test('ohne Etappenzeitraum wird nichts behauptet', () => {
    assert.deepEqual(staende(reise([], [{ arrivalDate: null, departureDate: null }])).map(([, stand]) => stand), [null, null])
  })

  test('Text nennt offen, teilweise und vollständig', () => {
    assert.equal(laufUnterkunftText({ naechte: 3, offen: 0 }), 'Unterkunft für alle 3 Nächte')
    assert.equal(laufUnterkunftText({ naechte: 1, offen: 0 }), 'Unterkunft für die Nacht')
    assert.equal(laufUnterkunftText({ naechte: 3, offen: 3 }), 'Unterkunft für 3 Nächte noch offen')
    assert.equal(laufUnterkunftText({ naechte: 3, offen: 1 }), '1 von 3 Nächten ohne Unterkunft')
  })
})
