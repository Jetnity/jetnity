import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { betragAusText, dauerAusIso, dauerLesbar, ortszeitAus, umstiegMinuten } from '@/lib/flights/zeit'

describe('Flugzeiten', () => {
  test('ISO-Dauer wird in Minuten gelesen', () => {
    assert.equal(dauerAusIso('PT11H30M'), 690)
    assert.equal(dauerAusIso('P1DT2H'), 1560)
    assert.equal(dauerAusIso('kaputt'), null)
  })

  test('Ortszeit wird nicht in eine Zone umgerechnet', () => {
    const gelesen = ortszeitAus('2026-11-01T07:40:00')
    assert.deepEqual(gelesen, { date: '2026-11-01', time: '07:40' })
    assert.equal(ortszeitAus('2026-11-01T07:40:00+07:00')?.time, '07:40')
  })

  test('ein Umstieg nutzt nur Kalender und Uhr, keine Zone', () => {
    assert.equal(
      umstiegMinuten(
        { date: '2026-11-01', time: '22:10' },
        { date: '2026-11-02', time: '08:40' },
      ),
      10 * 60 + 30,
    )
  })

  test('Dauer wird lesbar', () => {
    assert.equal(dauerLesbar(255), '4 h 15 min')
    assert.equal(dauerLesbar(60), '1 h')
  })

  test('Dezimalbeträge bleiben auf zwei Stellen, ohne Zone', () => {
    assert.equal(betragAusText('892.50'), 892.5)
    assert.equal(betragAusText('10.999'), null)
  })
})
