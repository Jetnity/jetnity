import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { hinweiseAusTexten, reiseMitKanonischenOrten } from '@/lib/places/kanon'
import type { Ort } from '@/lib/places/domain'
import type { Reisegraph } from '@/types/trips'

const bangkok: Ort = {
  id: 'geonames:1609350',
  source: 'geonames',
  sourceId: '1609350',
  name: 'Bangkok',
  typ: 'city',
  country: 'Thailand',
  countryCode: 'TH',
  region: null,
  lat: 13.75,
  lon: 100.52,
  iata: null,
  keywords: null,
}

function reise(): Reisegraph {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Thailand',
    origin: 'Zürich',
    originPlaceId: 'geonames:1',
    startDate: null,
    endDate: null,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      {
        id: 's1',
        position: 1,
        name: 'Bangkok',
        countryCode: 'TH',
        arrivalDate: null,
        departureDate: null,
        latitude: null,
        longitude: null,
        placeId: 'geonames:999',
      },
    ],
    days: [],
    ohneTag: [],
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
  }
}

describe('Kanonische Orte am Reisegraph', () => {
  test('ein eindeutiger Treffer ersetzt eine behauptete ID', () => {
    const kanonisch = reiseMitKanonischenOrten(reise(), { origin: null, stages: [bangkok] })
    assert.equal(kanonisch.originPlaceId, null)
    assert.equal(kanonisch.stages[0]?.name, 'Bangkok')
    assert.equal(kanonisch.stages[0]?.placeId, 'geonames:1609350')
    assert.equal(kanonisch.stages[0]?.latitude, 13.75)
  })

  test('ohne Treffer bleibt der Text, aber keine Place-ID', () => {
    const kanonisch = reiseMitKanonischenOrten(reise(), { origin: null, stages: [null] })
    assert.equal(kanonisch.stages[0]?.name, 'Bangkok')
    assert.equal(kanonisch.stages[0]?.placeId, null)
    assert.equal(kanonisch.originPlaceId, null)
  })

  test('Startseite und Modellweg beschreiben denselben Hinweis', () => {
    const hinweise = hinweiseAusTexten({
      origin: 'Zürich',
      stages: [{ name: 'Bangkok', countryCode: 'TH' }],
    })
    assert.equal(hinweise.origin.rolle, 'abreise')
    assert.equal(hinweise.stages[0]?.rolle, 'ziel')
    assert.equal(hinweise.stages[0]?.countryCode, 'TH')
  })
})
