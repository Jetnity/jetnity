import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarSuchen } from '@/lib/rental-cars/suche'
import { rentalCarZustand } from '@/lib/rental-cars/zustand'
import type { RentalCarOption } from '@/lib/rental-cars/domain'

const ANFRAGE = {
  pickupName: 'Zürich Flughafen',
  dropoffName: 'Lugano Zentrum',
  pickupPlaceId: 'geonames:2657896',
  dropoffPlaceId: 'geonames:2659836',
  pickupOn: '2026-09-12',
  pickupAt: '09:00',
  dropoffOn: '2026-09-16',
  dropoffAt: '18:00',
  vehicleClass: null,
  transmission: null,
  currency: 'CHF',
}

function option(teil: Partial<RentalCarOption> = {}): RentalCarOption {
  return {
    id: 'opt-1',
    provider: 'test-rental',
    externalRef: 'off-1',
    title: 'Kompakt',
    pickupName: 'Zürich Flughafen',
    dropoffName: 'Lugano Zentrum',
    pickupPlaceId: 'geonames:2657896',
    dropoffPlaceId: 'geonames:2659836',
    pickupOn: '2026-09-12',
    pickupAt: '09:00',
    dropoffOn: '2026-09-16',
    dropoffAt: '18:00',
    vehicleClass: 'compact',
    transmission: 'automatic',
    supplierName: 'Test',
    preis: 240,
    preisIstGesamt: true,
    preisWaehrung: 'CHF',
    kilometerRegel: null,
    tankRegel: null,
    storno: null,
    kaution: null,
    kautionWaehrung: null,
    ...teil,
  }
}

describe('Mietwagensuche', () => {
  test('ohne Provider bleibt fail-closed und ohne Fake-Ergebnisse', async () => {
    const ergebnis = await rentalCarSuchen(ANFRAGE, {
      zustand: rentalCarZustand({ VERCEL_ENV: 'preview', JETNITY_RENTAL_CAR_AKTIV: 'true' }, false),
      provider: null,
      kennung: 'test',
    })
    assert.equal(ergebnis.httpStatus, 200)
    assert.equal(ergebnis.koerper.status, 'unavailable')
    assert.equal(ergebnis.koerper.options.length, 0)
    assert.doesNotMatch(ergebnis.koerper.message, /Hertz|CHF 89|Automatik/)
  })

  test('Production bleibt aus', async () => {
    const ergebnis = await rentalCarSuchen(ANFRAGE, {
      zustand: rentalCarZustand({ VERCEL_ENV: 'production', JETNITY_RENTAL_CAR_AKTIV: 'true' }, true),
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
    const ergebnis = await rentalCarSuchen({ pickupName: '' }, {
      zustand: rentalCarZustand({ VERCEL_ENV: 'preview' }, false),
      provider: null,
      kennung: 'test',
    })
    assert.equal(ergebnis.httpStatus, 400)
    assert.equal(ergebnis.koerper.status, 'invalid')
  })

  test('die Client-Sicht leakt keine internen Scores', async () => {
    const ergebnis = await rentalCarSuchen(ANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: {
        id: 'fake',
        suchen: async () => ({ options: [option()], partial: false }),
      },
      kennung: `sicht-${Date.now()}`,
    })
    assert.equal(ergebnis.koerper.status, 'ok')
    assert.equal(ergebnis.koerper.options.length, 1)
    assert.equal('score' in ergebnis.koerper.options[0]!, false)
    assert.equal('provider' in ergebnis.koerper.options[0]!, false)
    assert.equal('externalRef' in ergebnis.koerper.options[0]!, false)
  })
})
