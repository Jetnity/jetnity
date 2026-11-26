import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { kostenbild, kostenZeile } from '@/lib/trips/kostenbild'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import type { Trip, TripItem } from '@/types/trips'

const GEBUCHT = { bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: '2026-06-01T00:00:00.000Z' } as const

function reiseMit(punkte: TripItem[], teil: Partial<Trip> = {}): Trip {
  const basis = n12Reise()
  const [erster, ...rest] = basis.days
  return {
    ...basis,
    currency: 'CHF',
    budgetAmount: null,
    ohneTag: [],
    days: [{ ...erster!, items: punkte }, ...rest.map((tag) => ({ ...tag, items: [] }))],
    ...teil,
  }
}

describe('Kostenbild – Summen', () => {
  test('summiert pro Währung und trennt gebucht von ausgewählt', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'f', kind: 'flight', title: 'Flug', priceAmount: 1380, priceCurrency: 'CHF', ...GEBUCHT }),
      n12Punkt({ id: 's', kind: 'stay', title: 'Hotel', priceAmount: 860.5, priceCurrency: 'CHF' }),
      n12Punkt({ id: 'a', kind: 'activity', title: 'Kochkurs', priceAmount: 120, priceCurrency: 'EUR' }),
    ]))
    assert.deepEqual(bild.summen, [
      { waehrung: 'CHF', gebucht: 1380, ausgewaehlt: 860.5, gesamt: 2240.5, anzahl: 2 },
      { waehrung: 'EUR', gebucht: 0, ausgewaehlt: 120, gesamt: 120, anzahl: 1 },
    ])
    assert.equal(bild.posten[0]!.stand, 'gebucht')
    assert.equal(bild.vollstaendig, true)
  })

  test('rechnet in Rappen, damit Dezimalbeträge exakt bleiben', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'a', kind: 'activity', title: 'A', priceAmount: 0.1, priceCurrency: 'CHF' }),
      n12Punkt({ id: 'b', kind: 'activity', title: 'B', priceAmount: 0.2, priceCurrency: 'CHF' }),
    ]))
    assert.equal(bild.summen[0]!.gesamt, 0.3)
  })

  test('die Reisewährung steht zuerst, danach alphabetisch', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'a', kind: 'activity', title: 'A', priceAmount: 1, priceCurrency: 'USD' }),
      n12Punkt({ id: 'b', kind: 'activity', title: 'B', priceAmount: 1, priceCurrency: 'EUR' }),
      n12Punkt({ id: 'c', kind: 'activity', title: 'C', priceAmount: 1, priceCurrency: 'THB' }),
    ], { currency: 'THB' }))
    assert.deepEqual(bild.summen.map((summe) => summe.waehrung), ['THB', 'EUR', 'USD'])
  })

  test('nur bestätigbare Arten können gebucht sein; eine Aktivität bleibt ausgewählt', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'a', kind: 'activity', title: 'Tour', priceAmount: 50, priceCurrency: 'CHF', ...GEBUCHT }),
    ]))
    assert.equal(bild.summen[0]!.gebucht, 0)
    assert.equal(bild.summen[0]!.ausgewaehlt, 50)
  })

  test('ein Punkt, der an zwei Tagen gleich gespeichert ist, zählt einmal', () => {
    const hotel = n12Punkt({ id: 's', kind: 'stay', title: 'Hotel', priceAmount: 500, priceCurrency: 'CHF' })
    const basis = reiseMit([hotel])
    basis.days[1] = { ...basis.days[1]!, items: [hotel] }
    assert.equal(kostenbild(basis).summen[0]!.gesamt, 500)
  })

  test('ungeplante Punkte zählen mit', () => {
    const bild = kostenbild(reiseMit([], {
      ohneTag: [n12Punkt({ id: 'r', kind: 'rental_car', title: 'Mietwagen', priceAmount: 300, priceCurrency: 'CHF' })],
    }))
    assert.equal(bild.summen[0]!.gesamt, 300)
  })

  test('separat geladene ungeplante Punkte ersetzen die der Reise', () => {
    const reise = reiseMit([], {
      ohneTag: [n12Punkt({ id: 'alt', kind: 'activity', title: 'Alt', priceAmount: 1, priceCurrency: 'CHF' })],
    })
    const bild = kostenbild(reise, [n12Punkt({ id: 'neu', kind: 'activity', title: 'Neu', priceAmount: 70, priceCurrency: 'CHF' })])
    assert.deepEqual(bild.posten.map((posten) => posten.id), ['neu'])
  })
})

describe('Kostenbild – nichts wird erfunden', () => {
  test('Punkte ohne Preis werden genannt, nicht mit null gerechnet', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'f', kind: 'flight', title: 'Flug', priceAmount: 900, priceCurrency: 'CHF' }),
      n12Punkt({ id: 's', kind: 'stay', title: 'Hotel Krabi' }),
      n12Punkt({ id: 'n', kind: 'note', title: 'Sonnencreme kaufen' }),
    ]))
    assert.deepEqual(bild.ohnePreis, [{ id: 's', titel: 'Hotel Krabi', art: 'stay', stand: 'ausgewaehlt' }])
    assert.equal(bild.summen[0]!.anzahl, 1)
    assert.equal(bild.vollstaendig, false)
  })

  test('ein gebuchter Punkt ohne Preis bleibt als gebucht erkennbar', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 's', kind: 'stay', title: 'Hotel', ...GEBUCHT }),
    ]))
    assert.equal(bild.ohnePreis[0]!.stand, 'gebucht')
    assert.deepEqual(bild.summen, [])
  })

  test('halbe, negative oder unlesbare Preise zählen als ungültig und nicht in die Summe', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'a', kind: 'activity', title: 'A', priceAmount: 10, priceCurrency: null }),
      n12Punkt({ id: 'b', kind: 'activity', title: 'B', priceAmount: -5, priceCurrency: 'CHF' }),
      n12Punkt({ id: 'c', kind: 'activity', title: 'C', priceAmount: 5, priceCurrency: 'chf' }),
      n12Punkt({ id: 'd', kind: 'activity', title: 'D', priceAmount: 1.005, priceCurrency: 'CHF' }),
    ]))
    assert.equal(bild.ungueltig, 4)
    assert.deepEqual(bild.summen, [])
    assert.equal(bild.vollstaendig, false)
  })

  test('widersprüchliche Doppelungen werden weder gezählt noch aufgelöst', () => {
    const basis = reiseMit([n12Punkt({ id: 'x', kind: 'stay', title: 'Hotel', priceAmount: 500, priceCurrency: 'CHF' })])
    basis.days[1] = { ...basis.days[1]!, items: [n12Punkt({ id: 'x', kind: 'stay', title: 'Hotel', priceAmount: 700, priceCurrency: 'CHF' })] }
    const bild = kostenbild(basis)
    assert.equal(bild.mehrdeutig, 1)
    assert.deepEqual(bild.summen, [])
  })

  test('keine Hochrechnung pro Person', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'a', kind: 'activity', title: 'A', priceAmount: 80, priceCurrency: 'CHF' }),
    ], { travellers: 4 }))
    assert.equal(bild.summen[0]!.gesamt, 80)
  })
})

describe('Kostenbild – Budget', () => {
  test('vergleicht nur in derselben Währung', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'f', kind: 'flight', title: 'Flug', priceAmount: 1380, priceCurrency: 'CHF' }),
    ], { budgetAmount: 4200 }))
    assert.deepEqual(bild.budget, { betrag: 4200, waehrung: 'CHF', vergleich: { geplant: 1380, rest: 2820 } })
  })

  test('ein Preis in einer anderen Währung verhindert den Vergleich, statt umzurechnen', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'f', kind: 'flight', title: 'Flug', priceAmount: 1380, priceCurrency: 'CHF' }),
      n12Punkt({ id: 'a', kind: 'activity', title: 'A', priceAmount: 40, priceCurrency: 'EUR' }),
    ], { budgetAmount: 4200 }))
    assert.deepEqual(bild.budget, { betrag: 4200, waehrung: 'CHF', vergleich: null })
  })

  test('ohne gespeicherten Preis gibt es keinen Vergleich', () => {
    const bild = kostenbild(reiseMit([], { budgetAmount: 4200 }))
    assert.deepEqual(bild.budget, { betrag: 4200, waehrung: 'CHF', vergleich: null })
  })

  test('über dem Budget wird der Rest negativ', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 's', kind: 'stay', title: 'Hotel', priceAmount: 5000, priceCurrency: 'CHF' }),
    ], { budgetAmount: 4200 }))
    assert.equal(bild.budget?.vergleich?.rest, -800)
  })
})

describe('Kostenzeile', () => {
  test('nennt geplante Summe und Budget', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'f', kind: 'flight', title: 'Flug', priceAmount: 1380, priceCurrency: 'CHF' }),
      n12Punkt({ id: 's', kind: 'stay', title: 'Hotel', priceAmount: 1260, priceCurrency: 'CHF' }),
    ], { budgetAmount: 4200 }))
    assert.equal(kostenZeile(bild), 'Geplant ca. CHF 2\u2019640.00 · Budget CHF 4\u2019200.00')
  })

  test('mehrere Währungen stehen nebeneinander, ohne Umrechnung', () => {
    const bild = kostenbild(reiseMit([
      n12Punkt({ id: 'f', kind: 'flight', title: 'Flug', priceAmount: 1380, priceCurrency: 'CHF' }),
      n12Punkt({ id: 'a', kind: 'activity', title: 'A', priceAmount: 40, priceCurrency: 'EUR' }),
    ]))
    assert.equal(kostenZeile(bild), 'Geplant ca. CHF 1\u2019380.00 + EUR 40.00')
  })

  test('ohne Preise sagt sie das', () => {
    assert.equal(kostenZeile(kostenbild(reiseMit([], { budgetAmount: 4200 }))), 'Noch keine Preise gespeichert · Budget CHF 4\u2019200.00')
  })
})
