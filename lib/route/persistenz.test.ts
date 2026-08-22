// lib/route/persistenz.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { itineraryEinTransit } from '@/lib/route/fixtures'
import {
  eindeutigeFlugRoute,
  flugRoutePasst,
  flugRoutenAusReise,
  type FlugRouteUebergabe,
} from '@/lib/route/persistenz'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripItem } from '@/types/trips'

function flug(teil: Partial<TripItem> = {}): TripItem {
  return {
    id: 'flug-1',
    dayId: null,
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH → BKK · SWISS',
    note: null,
    position: 1,
    startsOn: '2026-11-01',
    startsAt: '09:15',
    endsOn: '2026-11-01',
    endsAt: '21:40',
    priceAmount: 890,
    priceCurrency: 'CHF',
    provider: 'duffel',
    externalRef: 'off_1',
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
    routeItinerary: itineraryEinTransit(),
    ...teil,
  }
}

function uebergabe(teil: Partial<FlugRouteUebergabe> = {}): FlugRouteUebergabe {
  return {
    title: 'ZRH → BKK · SWISS',
    startsOn: '2026-11-01',
    endsOn: '2026-11-01',
    provider: 'duffel',
    externalRef: 'off_1',
    position: 1,
    dayIndex: null,
    itinerary: itineraryEinTransit(),
    ...teil,
  }
}

describe('Flugroute-Persistenz', () => {
  test('ordnet eine Route nur eindeutig passenden Flügen zu', () => {
    const reise = beispielreise({ ohneTag: [flug()] })
    const [eintrag] = flugRoutenAusReise(reise)
    assert.ok(eintrag)
    assert.equal(eintrag.externalRef, 'off_1')
    assert.equal(eindeutigeFlugRoute(eintrag, [eintrag])?.externalRef, 'off_1')
  })

  test('lässt mehrdeutige Treffer aus', () => {
    const kandidat = uebergabe()
    const doppelt = [uebergabe(), uebergabe({ itinerary: itineraryEinTransit('SIN') })]
    assert.equal(eindeutigeFlugRoute(kandidat, doppelt), null)
    assert.equal(flugRoutePasst(kandidat, doppelt[0]!), true)
  })

  test('unterscheidet Flüge über Provider-Ref und Datum', () => {
    const hin = uebergabe()
    const rueck = uebergabe({
      title: 'BKK → ZRH · SWISS',
      startsOn: '2026-11-20',
      endsOn: '2026-11-20',
      externalRef: 'off_2',
    })
    assert.equal(eindeutigeFlugRoute(hin, [hin, rueck])?.externalRef, 'off_1')
    assert.equal(flugRoutePasst(hin, rueck), false)
  })
})
