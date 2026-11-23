// lib/trips/tage.test.ts
//
// Die Aufteilung eines Zeitraums in Tage ist die Stelle, an der eine Reise ihre
// Struktur bekommt. Ein Tag zu viel oder zu wenig ist nicht kosmetisch: Er wird
// eine Zeile in `trip_days`, und ein Planpunkt hängt daran.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { TAGE_MAXIMUM, ZEITRAUM_ZU_LANG, datumVerschieben, kalendertagUtc, reisetageBauen, zeitraumIstZuLang } from '@/lib/trips/tage'

describe('Aus einem Zeitraum werden Reisetage', () => {
  test('beide Daten gehören dazu', () => {
    const tage = reisetageBauen('2026-09-12', '2026-09-16')

    assert.equal(tage.length, 5)
    assert.deepEqual(tage[0], { dayIndex: 1, dayDate: '2026-09-12' })
    assert.deepEqual(tage[4], { dayIndex: 5, dayDate: '2026-09-16' })
  })

  test('ein einzelner Tag ist ein Tag', () => {
    assert.deepEqual(reisetageBauen('2026-09-12', '2026-09-12'), [
      { dayIndex: 1, dayDate: '2026-09-12' },
    ])
  })

  test('die Nummern sind lückenlos und aufsteigend', () => {
    const tage = reisetageBauen('2026-02-25', '2026-03-04')

    assert.deepEqual(
      tage.map((tag) => tag.dayIndex),
      [1, 2, 3, 4, 5, 6, 7, 8],
    )
    assert.deepEqual(
      tage.map((tag) => tag.dayDate),
      [
        '2026-02-25',
        '2026-02-26',
        '2026-02-27',
        '2026-02-28',
        '2026-03-01',
        '2026-03-02',
        '2026-03-03',
        '2026-03-04',
      ],
    )
  })

  test('ein Schaltjahr hat seinen 29. Februar', () => {
    const tage = reisetageBauen('2028-02-28', '2028-03-01')

    assert.deepEqual(
      tage.map((tag) => tag.dayDate),
      ['2028-02-28', '2028-02-29', '2028-03-01'],
    )
  })

  test('eine Zeitumstellung verschluckt keinen Tag', () => {
    // In Europa endet die Sommerzeit in der Nacht zum 25. Oktober 2026. Über die
    // lokale Zeitzone gerechnet fiele hier ein Tag aus oder doppelt an; die
    // Rechnung läuft deshalb in UTC.
    const tage = reisetageBauen('2026-10-23', '2026-10-27')

    assert.deepEqual(
      tage.map((tag) => tag.dayDate),
      ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'],
    )
  })
})

describe('Ein unbrauchbarer Zeitraum ergibt keine Tage', () => {
  test('Rückreise vor Abreise', () => {
    assert.deepEqual(reisetageBauen('2026-09-16', '2026-09-12'), [])
  })

  test('kein Datum', () => {
    assert.deepEqual(reisetageBauen('', ''), [])
  })

  test('unlesbares Datum', () => {
    assert.deepEqual(reisetageBauen('irgendwann', '2026-09-12'), [])
  })
})

describe('Die Obergrenze ist die der Datenbank', () => {
  test('366 inklusive Tage behalten den letzten Rückreisetag', () => {
    const tage = reisetageBauen('2026-01-01', '2027-01-01')
    assert.equal(tage.length, TAGE_MAXIMUM)
    assert.deepEqual(tage.at(-1), { dayIndex: 366, dayDate: '2027-01-01' })
  })

  test('367 Tage und zehn Jahre werden abgewiesen, niemals still gekürzt', () => {
    assert.equal(zeitraumIstZuLang('2026-01-01', '2027-01-02'), true)
    assert.deepEqual(reisetageBauen('2026-01-01', '2027-01-02'), [])
    assert.deepEqual(reisetageBauen('2026-01-01', '2036-01-01'), [])
    assert.match(ZEITRAUM_ZU_LANG, /einschliesslich Abreise und Rückreise/)
  })
})

describe('W1 echte Kalenderdaten statt Date.parse-Normalisierung', () => {
  test('unmögliche Kalendertage werden in allen Einstiegen abgewiesen', () => {
    for (const invalid of ['2026-02-30', '2027-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '']) {
      assert.equal(kalendertagUtc(invalid), null)
      assert.deepEqual(reisetageBauen(invalid, '2026-03-02'), [])
      assert.deepEqual(reisetageBauen('2026-02-01', invalid), [])
      assert.equal(datumVerschieben(invalid, 0), null)
    }
  })

  test('Schaltjahr, Monatswechsel, DST und ganze Verschiebung bleiben exakt', () => {
    assert.ok(kalendertagUtc('2028-02-29') !== null)
    assert.equal(datumVerschieben('2028-02-28', 1), '2028-02-29')
    assert.equal(datumVerschieben('2028-02-29', 1), '2028-03-01')
    assert.equal(datumVerschieben('2026-10-25', 1), '2026-10-26')
    assert.equal(datumVerschieben('2026-10-25', -1), '2026-10-24')
    assert.equal(datumVerschieben('2026-10-25', 0.5), null)
    assert.equal(datumVerschieben(null, 1), null)
  })
})
