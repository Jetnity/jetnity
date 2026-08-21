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

  test('CHF 200 ist preislich besser als CHF 300 und erhält Best Value', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('teuer', { preis: 300, preisIstGesamt: true, preisWaehrung: 'CHF' })),
      rentalCarKandidatAus(option('guenstig', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' })),
    ])
    assert.deepEqual(bewertet.map((eintrag) => eintrag.id), ['guenstig', 'teuer'])
    assert.ok(bewertet[0]?.labels.includes('best_value'))
    assert.equal(bewertet[1]?.labels.includes('best_value'), false)
  })

  test('EUR 190 und CHF 200 ohne FX ergeben keinen Cross-Currency-Sieger', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('eur', { preis: 190, preisIstGesamt: true, preisWaehrung: 'EUR' })),
      rentalCarKandidatAus(option('chf', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' })),
    ])
    assert.equal(
      bewertet.some((eintrag) => eintrag.labels.includes('best_value')),
      false,
    )
    assert.deepEqual(
      bewertet.map((eintrag) => eintrag.id).sort(),
      ['chf', 'eur'],
    )
  })

  test('fehlende Gesamtpreisflagge ergibt kein Preisranking', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('ohne-flagge', { preis: 80, preisIstGesamt: null, preisWaehrung: 'CHF' })),
      rentalCarKandidatAus(option('mit-flagge', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' })),
    ])
    assert.equal(bewertet.find((eintrag) => eintrag.id === 'ohne-flagge')?.labels.includes('best_value'), false)
    assert.ok(bewertet.find((eintrag) => eintrag.id === 'mit-flagge')?.labels.includes('best_value'))
  })

  test('Best Value nur bei vergleichbarer Grundlage', () => {
    const ohneVergleich = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('a', { preis: 100, preisIstGesamt: false, preisWaehrung: 'CHF' })),
      rentalCarKandidatAus(option('b', { preis: 90, preisIstGesamt: false, preisWaehrung: 'CHF' })),
    ])
    assert.equal(
      ohneVergleich.some((eintrag) => eintrag.labels.includes('best_value')),
      false,
    )
  })
})
