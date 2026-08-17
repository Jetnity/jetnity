// lib/admin/kennzahlen.test.ts
//
// Diese Rechenschritte dürfen aus keiner Zeile eine Null machen – und sie
// bekommen nach dem Umbau der Routen gar keine Gelegenheit mehr, aus einem
// Fehler eine Null zu machen: Sie werden nur noch mit Daten aufgerufen, die
// tatsächlich gelesen wurden.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  fasseSicherheitslageZusammen,
  fasseZahlungenZusammen,
  verteileAufTage,
  type Zahlung,
} from '@/lib/admin/kennzahlen'

describe('Sicherheitslage', () => {
  test('keine Ereignisse ergeben Nullen und kein letztes Ereignis', () => {
    const lage = fasseSicherheitslageZusammen([], [])

    assert.deepEqual(lage, {
      failed_logins: 0,
      blocked_ips: 0,
      anomalies: 0,
      last_event: null,
    })
  })

  test('Fehlanmeldungen, Auffälligkeiten und Sperren werden getrennt gezählt', () => {
    const lage = fasseSicherheitslageZusammen(
      [
        { type: 'auth_failed', created_at: '2026-08-17T09:00:00Z' },
        { type: 'anomaly_rate_limit', created_at: '2026-08-16T09:00:00Z' },
        { type: 'auth_failed', created_at: '2026-08-15T09:00:00Z' },
      ],
      [{ ip: '198.51.100.14' }, { ip: '203.0.113.77' }],
    )

    assert.equal(lage.failed_logins, 2)
    assert.equal(lage.anomalies, 1)
    assert.equal(lage.blocked_ips, 2)
  })

  test('das letzte Ereignis ist das erste der absteigend sortierten Liste', () => {
    const lage = fasseSicherheitslageZusammen(
      [
        { type: 'auth_failed', created_at: '2026-08-17T09:00:00Z' },
        { type: 'auth_failed', created_at: '2026-08-15T09:00:00Z' },
      ],
      [],
    )

    assert.deepEqual(lage.last_event, { type: 'auth_failed', at: '2026-08-17T09:00:00Z' })
  })
})

describe('Zahlungsübersicht', () => {
  test('keine Zahlungen ergeben Nullen', () => {
    assert.deepEqual(fasseZahlungenZusammen([], []), {
      revenue_chf: 0,
      orders: 0,
      refunds: 0,
    })
  })

  test('nur bezahlte Zahlungen zählen als Umsatz', () => {
    const zahlungen: Zahlung[] = [
      { amount_chf: 1240, status: 'paid', created_at: '2026-08-14T10:57:08Z' },
      { amount_chf: 480.5, status: 'paid', created_at: '2026-08-08T10:57:08Z' },
      { amount_chf: 310, status: 'refunded', created_at: '2026-07-27T10:57:08Z' },
      { amount_chf: 99, status: 'pending', created_at: '2026-08-16T10:57:08Z' },
    ]

    const uebersicht = fasseZahlungenZusammen(zahlungen, [{ id: 'r1' }])

    assert.equal(uebersicht.revenue_chf, 1720.5)
    assert.equal(uebersicht.orders, 2)
    assert.equal(uebersicht.refunds, 1)
  })

  test('ein fehlender Betrag zählt als null, nicht als NaN', () => {
    const uebersicht = fasseZahlungenZusammen(
      [{ amount_chf: null, status: 'paid', created_at: '2026-08-14T10:57:08Z' }],
      [],
    )

    assert.equal(uebersicht.revenue_chf, 0)
    assert.equal(uebersicht.orders, 1)
  })
})

describe('Tagesreihe', () => {
  const beginn = new Date('2026-07-18T00:00:00Z')

  test('ohne Zahlungen bleibt die Reihe vollständig und bei null', () => {
    const reihe = verteileAufTage([], beginn, 30)

    assert.equal(reihe.length, 30)
    assert.equal(reihe[0].date, '2026-07-18')
    assert.equal(reihe[29].date, '2026-08-16')
    assert.ok(reihe.every(tag => tag.revenue_chf === 0 && tag.orders === 0))
  })

  test('eine Zahlung landet auf ihrem Tag', () => {
    const reihe = verteileAufTage(
      [{ amount_chf: 1240, status: 'paid', created_at: '2026-08-14T10:57:08Z' }],
      beginn,
      30,
    )

    const tag = reihe.find(t => t.date === '2026-08-14')
    assert.deepEqual(tag, { date: '2026-08-14', revenue_chf: 1240, orders: 1 })
  })

  test('eine Zahlung ausserhalb der Reihe verfälscht keinen Tag', () => {
    const reihe = verteileAufTage(
      [{ amount_chf: 500, status: 'paid', created_at: '2026-09-01T10:00:00Z' }],
      beginn,
      30,
    )

    assert.ok(reihe.every(tag => tag.orders === 0))
  })

  test('nicht bezahlte Zahlungen erhöhen keinen Umsatz', () => {
    const reihe = verteileAufTage(
      [
        { amount_chf: 310, status: 'refunded', created_at: '2026-08-14T10:00:00Z' },
        { amount_chf: 99, status: 'pending', created_at: '2026-08-14T10:00:00Z' },
      ],
      beginn,
      30,
    )

    assert.deepEqual(
      reihe.find(t => t.date === '2026-08-14'),
      { date: '2026-08-14', revenue_chf: 0, orders: 0 },
    )
  })
})
