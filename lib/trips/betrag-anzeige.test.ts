import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Preis } from '@/components/ui/preis'
import TripWorkspaceKosten from '@/components/trips/TripWorkspaceKosten'
import { kostenbild } from '@/lib/trips/kostenbild'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import type { Trip, TripItem } from '@/types/trips'

const GEBUCHT = { bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: '2026-06-01T00:00:00.000Z' } as const

function reiseMit(punkte: TripItem[], budgetAmount: number): Trip {
  const basis = n12Reise()
  const [erster, ...rest] = basis.days
  return {
    ...basis,
    currency: 'CHF',
    budgetAmount,
    ohneTag: [],
    days: [{ ...erster!, items: punkte }, ...rest.map((tag) => ({ ...tag, items: [] }))],
  }
}

function beispiel(flugGebucht: boolean) {
  return reiseMit([
    n12Punkt({ id: 'flug', kind: 'flight', title: 'Flug', priceAmount: 420.5, priceCurrency: 'CHF', ...(flugGebucht ? GEBUCHT : {}) }),
    n12Punkt({ id: 'hotel', kind: 'stay', title: 'Hotel', priceAmount: 610, priceCurrency: 'CHF' }),
    n12Punkt({ id: 'aktiv', kind: 'activity', title: 'Aktivität', priceAmount: 79.9, priceCurrency: 'CHF' }),
    n12Punkt({ id: 'eigen', kind: 'stay', title: 'Eigene Unterkunft', priceAmount: null, priceCurrency: null }),
  ], 1500)
}

function html(flugGebucht: boolean) {
  const bild = kostenbild(beispiel(flugGebucht))
  return renderToStaticMarkup(createElement(TripWorkspaceKosten, { bild }))
}

test('gespeicherte Hundertstel erscheinen in der Kostenansicht, nicht auf Franken gerundet', () => {
  const text = html(false)
  assert.match(text, /CHF 1\u2019110\.40/)
  assert.match(text, /CHF 420\.50/)
  assert.match(text, /CHF 610\.00/)
  assert.match(text, /CHF 79\.90/)
  assert.match(text, /CHF 1\u2019500\.00/)
  assert.match(text, /CHF 389\.60/)
  assert.match(text, /CHF 0\.00/)
  assert.match(text, /ohne Preis/)
  assert.doesNotMatch(text, /CHF 421|CHF 1\u2019111|CHF 690[^\d]|CHF 80[^\d.]/)
  assert.equal(renderToStaticMarkup(createElement(Preis, { betrag: 420.5, waehrung: 'CHF' })), renderToStaticMarkup(createElement(Preis, { betrag: 420.5, waehrung: 'CHF' })))
})

test('nach der Flugmarkierung bleiben Teilsumme, Gesamtsumme und Rest auf Hundertstel', () => {
  const bild = kostenbild(beispiel(true))
  assert.equal(bild.summen[0]?.gebucht, 420.5)
  assert.equal(bild.summen[0]?.ausgewaehlt, 689.9)
  assert.equal(bild.summen[0]?.gesamt, 1110.4)
  assert.equal(bild.budget?.vergleich?.rest, 389.6)
  const text = renderToStaticMarkup(createElement(TripWorkspaceKosten, { bild }))
  assert.match(text, /CHF 420\.50/)
  assert.match(text, /CHF 689\.90/)
  assert.match(text, /CHF 1\u2019110\.40/)
  assert.match(text, /CHF 389\.60/)
  assert.doesNotMatch(text, /CHF 421|CHF 690[^\d]/)
})

test('ein negativer Budgetrest bleibt ein exakter Betrag über dem Budget', () => {
  const bild = kostenbild(reiseMit([
    n12Punkt({ id: 'flug', kind: 'flight', title: 'Flug', priceAmount: 420.5, priceCurrency: 'CHF' }),
  ], 100))
  assert.equal(bild.budget?.vergleich?.rest, -320.5)
  const text = renderToStaticMarkup(createElement(TripWorkspaceKosten, { bild }))
  assert.match(text, /CHF 320\.50/)
  assert.match(text, /über dem Budget/)
  assert.doesNotMatch(text, /CHF 321/)
})

test('zwei Währungen bleiben getrennt und erfinden keine Summe', () => {
  const bild = kostenbild(reiseMit([
    n12Punkt({ id: 'flug', kind: 'flight', title: 'Flug', priceAmount: 188.4, priceCurrency: 'CHF' }),
    n12Punkt({ id: 'hotel', kind: 'stay', title: 'Hotel', priceAmount: 377.1, priceCurrency: 'EUR' }),
  ], 800))
  const text = renderToStaticMarkup(createElement(TripWorkspaceKosten, { bild }))
  assert.match(text, /CHF 188\.40/)
  assert.match(text, /EUR 377\.10/)
  assert.match(text, /Nicht verglichen/)
  assert.equal(bild.budget?.vergleich, null)
})
