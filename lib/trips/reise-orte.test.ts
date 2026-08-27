// lib/trips/reise-orte.test.ts
//
// TW7-A: Hub-Kartenidentität und Workspace-Übersicht teilen dieselbe
// Presentation-Derivation. Keine Transit-/Flight-Ziele, keine stille Reorder.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { reiseOrte, tripAlsUebersicht, tripItemCount } from '@/lib/trips/reise-orte'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const JETZT = '2026-08-21T00:00:00.000Z'

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

function etappe(name: string, position: number): TripStage {
  return {
    id: `stage-${position}`,
    position,
    name,
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
  }
}

function punkt(id: string): TripItem {
  return {
    id,
    dayId: null,
    stageId: null,
    kind: 'note',
    title: id,
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
    stages: [],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('reiseOrte – Sichtregel', () => {
  test('0 Etappen, ohne Herkunft → Ziel noch offen', () => {
    assert.equal(reiseOrte({ origin: null, stages: [] }), 'Ziel noch offen')
  })

  test('0 Etappen, mit Herkunft → Ziel noch offen · ab Zürich', () => {
    assert.equal(reiseOrte({ origin: 'Zürich', stages: [] }), 'Ziel noch offen · ab Zürich')
  })

  test('1 Etappe + Herkunft → Ubud · ab Zürich', () => {
    assert.equal(
      reiseOrte({ origin: 'Zürich', stages: [{ name: 'Ubud', position: 1 }] }),
      'Ubud · ab Zürich',
    )
  })

  test('3 Etappen in falscher Array-Reihenfolge folgen position', () => {
    assert.equal(
      reiseOrte({
        origin: null,
        stages: [
          { name: 'Phuket', position: 3 },
          { name: 'Bangkok', position: 1 },
          { name: 'Chiang Mai', position: 2 },
        ],
      }),
      'Bangkok · Chiang Mai · Phuket',
    )
  })

  test('leerer Etappenname wird nicht als Ziel erfunden', () => {
    assert.equal(
      reiseOrte({
        origin: null,
        stages: [
          { name: '   ', position: 1 },
          { name: '', position: 2 },
          { name: 'Ubud', position: 3 },
        ],
      }),
      'Ubud',
    )
    assert.equal(
      reiseOrte({
        origin: 'Zürich',
        stages: [{ name: '  ', position: 1 }],
      }),
      'Ziel noch offen · ab Zürich',
    )
  })
})

describe('reiseOrte – keine Transit-/Flight-Ziele', () => {
  test('Listen-Select und Helper lesen keine Transit-/Flight-Felder', () => {
    const daten = quelle('daten.ts')
    const helper = quelle('reise-orte.ts')
    const karte = readFileSync(join(hier, '../../components/trips/Reisekarte.tsx'), 'utf8')

    assert.match(daten, /trip_stages\(name, position\)/)
    assert.equal(daten.includes('trip_stages(count)'), false)

    const listenSelect = daten.match(/const UEBERSICHT_SPALTEN =[\s\S]*?trip_items\(count\)/)?.[0] ?? ''
    assert.notEqual(listenSelect, '')
    for (const verboten of [
      'place_id',
      'latitude',
      'longitude',
      'country_code',
      'origin_place',
      'destination',
      'flight',
      'transit',
      'itinerary',
    ]) {
      assert.equal(listenSelect.includes(verboten), false, verboten)
    }

    assert.equal(helper.includes('destinationName'), false)
    assert.equal(helper.includes('originPlaceId'), false)
    assert.equal(helper.includes('routeItinerary'), false)
    assert.equal(karte.includes('destinationName'), false)
    assert.equal(karte.includes('routeItinerary'), false)
  })
})

describe('Gast- und Konto-Abbildung', () => {
  test('Gast-itemCount zählt days.items + ohneTag; Konto zählt dieselbe Menge', () => {
    const graph = reise({
      days: [
        {
          id: 'day-1',
          stageId: 'stage-1',
          dayIndex: 1,
          dayDate: '2026-09-12',
          title: null,
          items: [punkt('a'), punkt('b')],
        },
      ],
      ohneTag: [punkt('c')],
    })

    assert.equal(tripItemCount(graph), 3)
    assert.equal(tripAlsUebersicht(graph).itemCount, 3)

    const daten = quelle('daten.ts')
    assert.match(daten, /itemCount: anzahl\(zeile\.trip_items\)/)
    assert.match(daten, /trip_items\(count\)/)

    const gast = readFileSync(join(hier, '../../components/trips/GastReisen.tsx'), 'utf8')
    assert.match(gast, /tripAlsUebersicht/)
    assert.equal(gast.includes('tag.items.length'), false)
  })

  test('AP-4-Provenienz ändert reiseOrte, stageCount und itemCount nicht', () => {
    const graph = reise({
      status: 'archived',
      stages: [etappe('Ubud', 1), etappe('Canggu', 2)],
      days: [
        {
          id: 'day-1',
          stageId: 'stage-1',
          dayIndex: 1,
          dayDate: '2026-09-12',
          title: null,
          items: [punkt('a')],
        },
      ],
      ohneTag: [punkt('b')],
    })
    const sicht = tripAlsUebersicht(graph)
    sicht.archivePreviousStatus = 'planned'
    assert.equal(sicht.stageCount, 2)
    assert.equal(sicht.itemCount, 2)
    assert.equal(reiseOrte(sicht), 'Ubud · Canggu · ab Zürich')
    assert.equal(sicht.stages[0]?.name, 'Ubud')
  })

  test('stageCount entspricht der gelesenen Etappenmenge, nicht einem zweiten Zähler', () => {
    const graph = reise({
      stages: [etappe('Ubud', 1), etappe('   ', 2)],
    })
    const sicht = tripAlsUebersicht(graph)
    assert.equal(sicht.stageCount, 2)
    assert.equal(sicht.stages.length, 2)
    assert.equal(reiseOrte(sicht), 'Ubud · ab Zürich')

    const daten = quelle('daten.ts')
    assert.match(daten, /stageCount: stages\.length/)
    assert.equal(daten.includes('stageCount: anzahl('), false)
  })
})
