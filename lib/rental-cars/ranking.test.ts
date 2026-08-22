import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarKandidatAus, rentalCarOptionenBewerten } from '@/lib/rental-cars/ranking'
import type { RentalCarKandidat, RentalCarKontext, RentalCarOption } from '@/lib/rental-cars/domain'

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

  test('fehlende Gesamtpreisflagge ergibt kein Preisranking und kein Best Value', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('ohne-flagge', { preis: 80, preisIstGesamt: null, preisWaehrung: 'CHF' })),
      rentalCarKandidatAus(option('mit-flagge', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' })),
    ])
    assert.equal(
      bewertet.some((eintrag) => eintrag.labels.includes('best_value')),
      false,
    )
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

  test('ein einzelner Gesamtpreis ist kein Best Value', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('einzeln', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' })),
    ])
    assert.equal(bewertet[0]?.labels.includes('best_value'), false)
  })

  test('zwei gleiche günstigste Gesamtpreise dürfen beide Best Value tragen', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('links', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' })),
      rentalCarKandidatAus(option('rechts', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' })),
    ])
    assert.equal(bewertet.filter((eintrag) => eintrag.labels.includes('best_value')).length, 2)
    assert.equal(
      bewertet.some((eintrag) => eintrag.labels.includes('jetnity')),
      false,
    )
  })

  test('ohne Ranking-Signale gibt es keine Jetnity-Empfehlung', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('beta')),
      rentalCarKandidatAus(option('alpha')),
    ])
    assert.equal(bewertet.every((eintrag) => eintrag.score === 0), true)
    assert.equal(
      bewertet.some((eintrag) => eintrag.labels.includes('jetnity')),
      false,
    )
  })

  test('Top-Score-Gleichstand ist keine Empfehlung', () => {
    const bewertet = rentalCarOptionenBewerten([
      mitKontext(option('eins', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' }), { ortFit: 1 }),
      mitKontext(option('zwei', { preis: 200, preisIstGesamt: true, preisWaehrung: 'CHF' }), { ortFit: 1 }),
    ])
    assert.equal(bewertet[0]?.score, bewertet[1]?.score)
    assert.equal(
      bewertet.some((eintrag) => eintrag.labels.includes('jetnity')),
      false,
    )
  })

  test('eindeutiger Top-Kandidat darf empfohlen werden', () => {
    const bewertet = rentalCarOptionenBewerten([
      mitKontext(option('passend'), { ortFit: 1 }),
      mitKontext(option('schwach'), { ortFit: 0.2 }),
    ])
    const empfohlen = bewertet.filter((eintrag) => eintrag.labels.includes('jetnity'))
    assert.deepEqual(empfohlen.map((eintrag) => eintrag.id), ['passend'])
    assert.ok((empfohlen[0]?.score ?? 0) > 0)
  })

  test('nicht stornierbar ist nicht Flexibel', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('hart', { storno: 'nicht stornierbar' })),
    ])
    assert.equal(bewertet[0]?.labels.includes('flexible'), false)
    assert.ok(bewertet[0]?.reasons.includes('Stornoregel bekannt'))
  })

  test('vorhandene Klasse oder Getriebe ohne Match sind keine Passung', () => {
    const bewertet = rentalCarOptionenBewerten([
      rentalCarKandidatAus(option('fakt', { vehicleClass: 'compact', transmission: 'automatic' })),
    ])
    assert.ok(bewertet[0]?.reasons.includes('Kompakt'))
    assert.ok(bewertet[0]?.reasons.includes('Automatik'))
    assert.equal(bewertet[0]?.reasons.includes('Passende Fahrzeugklasse'), false)
    assert.equal(bewertet[0]?.reasons.includes('Gewünschtes Getriebe'), false)
  })

  test('Passung nur bei positivem Match', () => {
    const bewertet = rentalCarOptionenBewerten([
      mitKontext(option('treffer', { vehicleClass: 'suv', transmission: 'manual' }), {
        fahrzeugFit: 1,
        getriebeFit: 1,
      }),
    ])
    assert.ok(bewertet[0]?.reasons.includes('Passende Fahrzeugklasse'))
    assert.ok(bewertet[0]?.reasons.includes('Gewünschtes Getriebe'))
  })
})

function mitKontext(basis: RentalCarOption, context: Partial<RentalCarKontext>): RentalCarKandidat {
  const kandidat = rentalCarKandidatAus(basis)
  return {
    ...kandidat,
    context: { ...kandidat.context, ...context },
  }
}
