import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { datumUeberlappt, rentalDecktKanteNicht, rentalKalendertage, rentalOneWay } from '@/lib/rental-cars/zeitraum'

describe('Mietwagen-Zeitraum', () => {
  test('gleicher Ort ist same_location, sonst one_way, sonst unknown', () => {
    assert.equal(
      rentalOneWay({
        originPlaceId: 'geonames:1',
        originName: 'Zürich Flughafen',
        destinationPlaceId: 'geonames:1',
        destinationName: 'Zürich Flughafen',
      }),
      'same_location',
    )
    assert.equal(
      rentalOneWay({
        originPlaceId: 'geonames:1',
        originName: 'Zürich Flughafen',
        destinationPlaceId: 'geonames:2',
        destinationName: 'Lugano Zentrum',
      }),
      'one_way',
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
