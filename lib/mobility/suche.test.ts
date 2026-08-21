import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilitySuchen } from '@/lib/mobility/suche'
import { mobilityZustand } from '@/lib/mobility/zustand'

const ANFRAGE = {
  originName: 'Zürich',
  destinationName: 'Lugano',
  originPlaceId: 'geonames:2657896',
  destinationPlaceId: 'geonames:2659836',
  date: '2026-09-12',
  mode: 'rail',
  travellers: 2,
  currency: 'CHF',
}

describe('Mobilitätssuche', () => {
  test('ohne Provider bleibt fail-closed und ohne Fake-Ergebnisse', async () => {
    const ergebnis = await mobilitySuchen(ANFRAGE, {
      zustand: mobilityZustand({ VERCEL_ENV: 'preview', JETNITY_MOBILITY_AKTIV: 'true' }, false),
      provider: null,
      kennung: 'test',
    })
    assert.equal(ergebnis.httpStatus, 200)
    assert.equal(ergebnis.koerper.status, 'unavailable')
    assert.equal(ergebnis.koerper.options.length, 0)
    assert.doesNotMatch(ergebnis.koerper.message, /IC 8|Fahrplan|CHF 40/)
  })

  test('Production bleibt aus', async () => {
    const ergebnis = await mobilitySuchen(ANFRAGE, {
      zustand: mobilityZustand({ VERCEL_ENV: 'production', JETNITY_MOBILITY_AKTIV: 'true' }, true),
      provider: {
        id: 'fake',
        suchen: async () => {
          throw new Error('darf nicht aufgerufen werden')
        },
      },
      kennung: 'test',
    })
    assert.equal(ergebnis.koerper.status, 'unavailable')
    assert.equal(ergebnis.koerper.options.length, 0)
  })

  test('eine ungültige Anfrage wird abgelehnt', async () => {
    const ergebnis = await mobilitySuchen({ originName: '' }, {
      zustand: mobilityZustand({ VERCEL_ENV: 'preview' }, false),
      provider: null,
      kennung: 'test',
    })
    assert.equal(ergebnis.httpStatus, 400)
    assert.equal(ergebnis.koerper.status, 'invalid')
  })
})
