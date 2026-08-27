import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  REISEN_LISTE_SELECT,
  etappenOrdnen,
  itemCountAusGraph,
  reiseOrte,
  tripZusammenfassungAus,
} from '@/lib/trips/reise-orte'
import { uebersichtAbleiten } from '@/lib/trips/uebersicht'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'position' | 'name'>): TripStage {
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

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
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

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [etappe({ id: 'stage-1', position: 1, name: 'Ubud' })],
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
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('TW7-A Hub-Kartenidentität', () => {
  test('0 Etappen, ohne Herkunft → Ziel noch offen', () => {
    assert.equal(reiseOrte({ origin: null, stages: [] }), 'Ziel noch offen')
  })

  test('0 Etappen, mit Herkunft → Ziel noch offen · ab Zürich', () => {
    assert.equal(reiseOrte({ origin: 'Zürich', stages: [] }), 'Ziel noch offen · ab Zürich')
  })

  test('1 Etappe + Herkunft bleibt der Workspace-Text', () => {
    const graph = reise()
    assert.equal(reiseOrte(graph), 'Ubud · ab Zürich')
    assert.equal(uebersichtAbleiten(graph, [], '2026-08-24').orte, 'Ubud · ab Zürich')
  })

  test('3 Etappen folgen position, nicht Array-Index', () => {
    const stages = [
      { name: 'Phuket', position: 3 },
      { name: 'Bangkok', position: 1 },
      { name: 'Chiang Mai', position: 2 },
    ]
    assert.deepEqual(
      etappenOrdnen(stages).map((etappe) => etappe.name),
      ['Bangkok', 'Chiang Mai', 'Phuket'],
    )
    assert.equal(reiseOrte({ origin: null, stages }), 'Bangkok · Chiang Mai · Phuket')
  })

  test('leerer Etappenname wird nicht als Ziel erfunden', () => {
    assert.equal(
      reiseOrte({
        origin: null,
        stages: [
          { name: '   ', position: 1 },
          { name: '', position: 2 },
        ],
      }),
      'Ziel noch offen',
    )
    assert.equal(
      reiseOrte({
        origin: 'Zürich',
        stages: [
          { name: '', position: 1 },
          { name: 'Ubud', position: 2 },
        ],
      }),
      'Ubud · ab Zürich',
    )
  })

  test('Listen-Select liest keine Transit-/Flight- oder Ortskoordinatenfelder', () => {
    assert.match(REISEN_LISTE_SELECT, /trip_stages\(name, position\)/)
    assert.equal(REISEN_LISTE_SELECT.includes('trip_stages(count)'), false)
    assert.equal(REISEN_LISTE_SELECT.includes('place_id'), false)
    assert.equal(REISEN_LISTE_SELECT.includes('latitude'), false)
    assert.equal(REISEN_LISTE_SELECT.includes('longitude'), false)
    assert.equal(REISEN_LISTE_SELECT.includes('flight'), false)
    assert.equal(REISEN_LISTE_SELECT.includes('transit'), false)
    assert.equal(REISEN_LISTE_SELECT.includes('destination'), false)
    const daten = readFileSync(new URL('./daten.ts', import.meta.url), 'utf8')
    assert.match(daten, /trip_stages\(name, position\)/)
    assert.equal(daten.includes("from('trip_stages')"), false)
  })

  test('Gast-itemCount zählt days.items + ohneTag; stageCount ist die gelesene Menge', () => {
    const graph = reise({
      stages: [
        etappe({ id: 's2', position: 2, name: 'Canggu' }),
        etappe({ id: 's1', position: 1, name: 'Ubud' }),
      ],
      days: [
        {
          id: 'day-1',
          stageId: 's1',
          dayIndex: 1,
          dayDate: '2026-09-12',
          title: null,
          items: [punkt({ id: 'a', kind: 'activity', title: 'Reisterrassen' })],
        },
      ],
      ohneTag: [punkt({ id: 'flug', kind: 'flight', title: 'ZRH → DPS', dayId: null, stageId: null })],
    })
    const gast = tripZusammenfassungAus(graph)
    const konto = tripZusammenfassungAus(graph)
    assert.equal(itemCountAusGraph(graph), 2)
    assert.equal(gast.itemCount, 2)
    assert.equal(konto.itemCount, gast.itemCount)
    assert.equal(gast.stageCount, graph.stages.length)
    assert.equal(gast.stageCount, gast.stages.length)
    assert.equal(gast.stageCount, 2)
    assert.deepEqual(
      gast.stages.map((etappe) => etappe.name),
      ['Ubud', 'Canggu'],
    )
    assert.equal(JSON.stringify(gast.stages).includes('placeId'), false)
    assert.equal(JSON.stringify(gast.stages).includes('flight'), false)
  })
})
