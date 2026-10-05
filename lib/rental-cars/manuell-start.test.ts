import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalManuellHinweise, rentalManuellStartwerte } from '@/lib/rental-cars/manuell-start'
import type { Trip } from '@/types/trips'

function reise(teil: Partial<Pick<Trip, 'origin' | 'stages'>> = {}): Pick<Trip, 'origin' | 'stages'> {
  return {
    origin: 'Zürich',
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Denpasar',
        countryCode: 'ID',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-16',
        latitude: null,
        longitude: null,
        placeId: 'geonames:1650535',
      },
    ],
    ...teil,
  }
}

describe('Manuelle Mietwagen-Startwerte', () => {
  test('Startwerte bleiben leer, auch bei Origin und entfernter Etappe', () => {
    const start = rentalManuellStartwerte()
    assert.deepEqual(start, {
      pickupName: '',
      dropoffName: '',
      pickupOn: '',
      pickupAt: '',
      dropoffOn: '',
      dropoffAt: '',
    })
    assert.notEqual(start.pickupName, 'Zürich')
    assert.notEqual(start.dropoffName, 'Denpasar')
  })

  test('Reiseorte dürfen nur als unverbindlicher Hinweis erscheinen', () => {
    const hinweise = rentalManuellHinweise(reise())
    assert.match(hinweise.pickupName, /^z\. B\. /)
    assert.match(hinweise.dropoffName, /^z\. B\. /)
    assert.match(hinweise.pickupName, /Zürich/)
    assert.match(hinweise.dropoffName, /Denpasar/)
    const start = rentalManuellStartwerte()
    assert.notEqual(start.pickupName, hinweise.pickupName)
    assert.notEqual(start.dropoffName, hinweise.dropoffName)
  })

  test('fehlender Reisekontext erzeugt keinen erfundenen Ort', () => {
    const hinweise = rentalManuellHinweise({ origin: null, stages: [] })
    assert.match(hinweise.pickupName, /^z\. B\. /)
    assert.match(hinweise.dropoffName, /^z\. B\. /)
    assert.doesNotMatch(hinweise.pickupName, /Zürich|Denpasar/)
    assert.doesNotMatch(hinweise.dropoffName, /Zürich|Denpasar/)
  })
})
