import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarKandidatAus, rentalCarOptionenBewerten } from '@/lib/rental-cars/ranking'
import type { RentalCarOption } from '@/lib/rental-cars/domain'

function option(id: string, teil: Partial<RentalCarOption> = {}): RentalCarOption {
  return {
    id,
    provider: id === 'a' ? 'alpha' : 'beta',
    externalRef: id,
    title: id,
    pickupName: 'Zürich',
    dropoffName: 'Lugano',
    pickupPlaceId: null,
    dropoffPlaceId: null,
    pickupOn: '2026-09-12',
    pickupAt: null,
    dropoffOn: '2026-09-16',
    dropoffAt: null,
    vehicleClass: null,
    transmission: null,
    supplierName: null,
    preis: null,
    preisIstGesamt: null,
    preisWaehrung: null,
    kilometerRegel: null,
    tankRegel: null,
    storno: null,
    kaution: null,
    kautionWaehrung: null,
    ...teil,
  }
}

describe('Mietwagen-Ranking', () => {
  test('gleiche Inputs ergeben dieselbe Reihenfolge', () => {
    const kandidaten = [
      rentalCarKandidatAus(option('b', { preis: 300, preisIstGesamt: true, preisWaehrung: 'CHF' })),
      rentalCarKandidatAus(option('a', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' })),
    ]
    const erste = rentalCarOptionenBewerten(kandidaten).map((eintrag) => eintrag.id)
    const zweite = rentalCarOptionenBewerten(kandidaten).map((eintrag) => eintrag.id)
    assert.deepEqual(erste, zweite)
    assert.deepEqual(erste, ['a', 'b'])
  })

  test('Providername und fehlende Fakten ändern die Reihenfolge nicht künstlich', () => {
    const ohnePreis = [
      rentalCarKandidatAus(option('beta', { provider: 'teuer-partner' })),
      rentalCarKandidatAus(option('alpha', { provider: 'billig-partner' })),
    ]
    const ids = rentalCarOptionenBewerten(ohnePreis).map((eintrag) => eintrag.id)
    assert.deepEqual(ids, ['alpha', 'beta'])
  })
})
