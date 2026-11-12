import test from 'node:test'
import assert from 'node:assert/strict'
import { datumVerschieben, kalenderGrenzen, monatVerschieben, monatsTage, zeitraumGueltig } from './suchkalender'

const hotel = { min: '2026-11-11', max: '2028-11-10', minTage: 1, maxTage: 90 }
const flug = { min: '2026-11-11', max: '2027-10-07', minTage: 0 }

test('German calendar starts Monday and includes every day exactly once', () => {
  const november = monatsTage('2026-11-15')
  assert.equal(november.length, 42)
  assert.deepEqual(november.slice(0, 6), Array(6).fill(null))
  assert.equal(november[6], '2026-11-01')
  assert.equal(november[35], '2026-11-30')
  assert.equal(new Set(november.filter(Boolean)).size, 30)
})
test('leap years, year boundaries and DST do not shift calendar days', () => {
  assert.equal(monatsTage('2028-02-01').filter(Boolean).length, 29)
  assert.equal(monatsTage('2027-02-01').filter(Boolean).length, 28)
  assert.equal(monatVerschieben('2026-12-31', 1), '2027-01-01')
  assert.equal(monatVerschieben('2026-01-31', -1), '2025-12-01')
  assert.equal(datumVerschieben('2026-03-28', 2), '2026-03-30')
  assert.equal(datumVerschieben('2026-10-24', 2), '2026-10-26')
  assert.equal(datumVerschieben('2027-02-29', 1), '')
})
test('hotel checkout requires a night, respects 90 nights and the provider horizon', () => {
  assert.equal(zeitraumGueltig('2026-11-15', '2026-11-15', hotel), false)
  assert.equal(zeitraumGueltig('2026-11-15', '2026-11-16', hotel), true)
  assert.equal(zeitraumGueltig('2026-11-15', datumVerschieben('2026-11-15', 90), hotel), true)
  assert.equal(zeitraumGueltig('2026-11-15', datumVerschieben('2026-11-15', 91), hotel), false)
  assert.equal(zeitraumGueltig('2028-11-10', '2028-11-11', hotel), false)
  assert.deepEqual(kalenderGrenzen('ende', '2026-11-15', hotel), { min: '2026-11-16', max: '2027-02-13' })
  assert.equal(kalenderGrenzen('start', '', hotel).max, '2028-11-09')
})
test('flights allow same-day returns and one-way trips without a return date', () => {
  assert.equal(zeitraumGueltig('2026-11-15', '2026-11-15', flug), true)
  assert.equal(zeitraumGueltig('2026-11-15', '', flug), false)
  assert.equal(zeitraumGueltig('2026-11-15', '', { ...flug, einzeln: true }), true)
  assert.equal(zeitraumGueltig('2026-11-15', '2027-10-08', flug), false)
  assert.equal(kalenderGrenzen('ende', '2026-11-15', flug).min, '2026-11-15')
})
test('incomplete, impossible, past and reversed dates cannot be applied', () => {
  for (const [start, ende] of [['', ''], ['2026-11-10', '2026-11-20'], ['2026-11-31', '2026-12-03'], ['2026-11-20', '2026-11-19']]) {
    assert.equal(zeitraumGueltig(start, ende, hotel), false)
    assert.equal(zeitraumGueltig(start, ende, flug), false)
  }
})
