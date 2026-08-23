import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  kalendertagImRecurring,
  kontaktImTravelWindow,
  monatTagLesen,
  referencePeriodLesen,
  travelWindowLesen,
  wiederkehrendProjizieren,
} from '@/lib/seasonal/fenster'

describe('Seasonal Travel Window', () => {
  test('ungültige Month/Day-Werte fail-closed', () => {
    assert.equal(monatTagLesen('02-30'), null)
    assert.equal(monatTagLesen('13-01'), null)
    assert.equal(monatTagLesen('00-10'), null)
    assert.equal(monatTagLesen('April'), null)
    assert.equal(travelWindowLesen({ kind: 'annual_recurring', start: '02-30', end: '03-31' }).kind, 'insufficient')
  })

  test('02-29 ist als recurring Definition gültig', () => {
    assert.deepEqual(monatTagLesen('02-29'), { month: 2, day: 29 })
  })

  test('Nov–März wrap inklusiv: 11-01 und 03-31 gehören dazu, 10-31 und 04-01 nicht', () => {
    const fenster = travelWindowLesen({ kind: 'annual_recurring', start: '11-01', end: '03-31' })
    assert.equal(fenster.kind, 'annual_recurring')
    if (fenster.kind !== 'annual_recurring') throw new Error('expected recurring')
    assert.equal(kalendertagImRecurring('2026-11-01', fenster), true)
    assert.equal(kalendertagImRecurring('2026-12-15', fenster), true)
    assert.equal(kalendertagImRecurring('2027-01-15', fenster), true)
    assert.equal(kalendertagImRecurring('2027-03-31', fenster), true)
    assert.equal(kalendertagImRecurring('2026-10-31', fenster), false)
    assert.equal(kalendertagImRecurring('2027-04-01', fenster), false)
  })

  test('12-15 → 01-15 wrap trifft Jahreswechsel', () => {
    const fenster = travelWindowLesen({ kind: 'annual_recurring', start: '12-15', end: '01-15' })
    assert.equal(fenster.kind, 'annual_recurring')
    if (fenster.kind !== 'annual_recurring') throw new Error('expected recurring')
    assert.equal(kontaktImTravelWindow('2026-12-20', '2027-01-10', fenster), 'overlaps')
    assert.equal(kontaktImTravelWindow('2026-11-01', '2026-11-20', fenster), 'before')
    assert.equal(kontaktImTravelWindow('2026-02-01', '2026-02-10', fenster), 'before')
  })

  test('Leap-Day 02-29 trifft nur den Schalttag', () => {
    const fenster = travelWindowLesen({ kind: 'annual_recurring', start: '02-29', end: '02-29' })
    assert.equal(fenster.kind, 'annual_recurring')
    if (fenster.kind !== 'annual_recurring') throw new Error('expected recurring')
    assert.equal(wiederkehrendProjizieren(fenster, 2028)?.start, '2028-02-29')
    assert.equal(wiederkehrendProjizieren(fenster, 2027), null)
    assert.equal(kontaktImTravelWindow('2028-02-29', '2028-02-29', fenster), 'overlaps')
    assert.notEqual(kontaktImTravelWindow('2027-02-28', '2027-02-28', fenster), 'overlaps')
  })

  test('absolute Fenster bleiben date-only bzw. Instant und nicht vermischt', () => {
    assert.equal(travelWindowLesen({ kind: 'absolute', start: '2026-09-01', end: '2026-09-30' }).kind, 'absolute')
    assert.equal(
      travelWindowLesen({
        kind: 'absolute',
        start: '2026-09-01T00:00:00.000Z',
        end: '2026-09-10T00:00:00.000Z',
      }).kind,
      'absolute',
    )
    assert.equal(
      travelWindowLesen({ kind: 'absolute', start: '2026-09-01', end: '2026-09-01T00:00:00.000Z' }).kind,
      'insufficient',
    )
    assert.equal(travelWindowLesen({ kind: 'absolute', start: '2026-09-30', end: '2026-09-01' }).kind, 'insufficient')
  })

  test('unmögliche absolute Kalenderdaten werden nicht normalisiert', () => {
    assert.equal(
      travelWindowLesen({
        kind: 'absolute',
        start: '2026-02-30T00:00:00.000Z',
        end: '2026-03-02T00:00:00.000Z',
      }).kind,
      'insufficient',
    )
    assert.equal(
      travelWindowLesen({
        kind: 'absolute',
        start: '2026-04-31T00:00:00.000Z',
        end: '2026-05-02T00:00:00.000Z',
      }).kind,
      'insufficient',
    )
    assert.equal(
      travelWindowLesen({
        kind: 'absolute',
        start: '2027-02-29T00:00:00.000Z',
        end: '2027-03-01T00:00:00.000Z',
      }).kind,
      'insufficient',
    )
    assert.equal(
      travelWindowLesen({
        kind: 'absolute',
        start: '2028-02-29T00:00:00.000Z',
        end: '2028-03-01T00:00:00.000Z',
      }).kind,
      'absolute',
    )
    assert.equal(
      travelWindowLesen({
        kind: 'absolute',
        start: '2026-09-01T00:00:00.000Z',
        end: '2026-09-10T00:00:00.000Z',
      }).kind,
      'absolute',
    )
  })

  test('Reference Period ist kein Travel Window', () => {
    assert.deepEqual(referencePeriodLesen({ startYear: 1991, endYear: 2020 }), { startYear: 1991, endYear: 2020 })
    assert.equal(referencePeriodLesen({ startYear: 2020, endYear: 1991 }), null)
    const fenster = travelWindowLesen({ kind: 'annual_recurring', start: '06-01', end: '09-30' })
    assert.equal(kontaktImTravelWindow('2026-07-01', '2026-07-10', fenster), 'overlaps')
    assert.equal(kontaktImTravelWindow('1995-07-01', '1995-07-10', fenster), 'overlaps')
  })
})
