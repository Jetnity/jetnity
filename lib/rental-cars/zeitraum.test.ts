import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { datumUeberlappt, rentalDecktKanteNicht, rentalKalendertage, rentalOneWay } from '@/lib/rental-cars/zeitraum'

describe('Mietwagen-Zeitraum', () => {
  test('gleiche IDs bleiben same_location, auch bei verschiedenen Labels', () => {
    assert.equal(
      rentalOneWay({
        originPlaceId: 'geonames:1',
        originName: 'Zürich Flughafen',
        destinationPlaceId: 'geonames:1',
        destinationName: 'Zurich Airport',
      }),
      'same_location',
    )
  })

  test('verschiedene IDs sind one_way', () => {
    assert.equal(
      rentalOneWay({
        originPlaceId: 'geonames:1',
        originName: 'Zürich Flughafen',
        destinationPlaceId: 'geonames:2',
        destinationName: 'Lugano Zentrum',
      }),
      'one_way',
    )
  })

  test('verschiedene Namen ohne zwei IDs bleiben unknown', () => {
    assert.equal(
      rentalOneWay({
        originPlaceId: null,
        originName: 'Zürich Flughafen',
        destinationPlaceId: null,
        destinationName: 'Zurich Airport',
      }),
      'unknown',
    )
    assert.equal(
      rentalOneWay({
        originPlaceId: 'geonames:1',
        originName: 'Zürich Flughafen',
        destinationPlaceId: null,
        destinationName: 'Zurich Airport',
      }),
      'unknown',
    )
    assert.equal(
      rentalOneWay({
        originPlaceId: null,
        originName: 'Zürich',
        destinationPlaceId: null,
        destinationName: null,
      }),
      'unknown',
    )
  })

  test('exakt gleiche Namen ohne IDs sind same_location', () => {
    assert.equal(
      rentalOneWay({
        originPlaceId: null,
        originName: 'Zürich Flughafen',
        destinationPlaceId: null,
        destinationName: 'Zürich Flughafen',
      }),
      'same_location',
    )
  })

  test('Kalendertage zählen Abhol- und Rückgabetag', () => {
    assert.equal(rentalKalendertage({ startsOn: '2026-09-12', endsOn: '2026-09-16' }), 5)
    assert.equal(rentalKalendertage({ startsOn: '2026-09-12', endsOn: null }), null)
  })

  test('gleicher Ort oder gleiches Datum beweist keine Kante', () => {
    assert.equal(
      rentalDecktKanteNicht(
        {
          startsOn: '2026-09-12',
          endsOn: '2026-09-16',
          originName: 'Zürich',
          destinationName: 'Lugano',
        },
        { date: '2026-09-13', originName: 'Zürich', destinationName: 'Luzern' },
      ),
      true,
    )
  })

  test('fehlendes Datum bleibt unbestimmte Überlappung', () => {
    assert.equal(datumUeberlappt('2026-09-12', '2026-09-16', null), null)
    assert.equal(datumUeberlappt('2026-09-12', '2026-09-16', '2026-09-13'), true)
    assert.equal(datumUeberlappt('2026-09-12', '2026-09-16', '2026-09-20'), false)
  })
})
