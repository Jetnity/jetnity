import test from 'node:test'
import assert from 'node:assert/strict'
import { kalenderPosition } from './suchkalender-position'
import { kalenderGrenzen, zeitraumGueltig } from './suchkalender'
import { searchInput } from '../providers/discovercars/search/contract'

function innerhalb(width: number, height: number, offsetLeft = 0, offsetTop = 0) {
  const rand = width <= 640 ? 8 : 16
  // The component caps its measured dialog to the visible viewport before positioning.
  const dialog = { width: Math.min(760, width - rand * 2), height: Math.min(620, height - rand * 2) }
  const viewport = { width, height, offsetLeft, offsetTop }
  for (const anker of [undefined, { left: 0, top: 0, bottom: 60 }, { left: width - 10, top: height - 80, bottom: height - 20 }]) {
    const p = kalenderPosition(viewport, dialog, anker)
    assert.ok(p.left >= offsetLeft + rand)
    assert.ok(p.top >= offsetTop + rand)
    assert.ok(p.left + dialog.width <= offsetLeft + width - rand)
    assert.ok(p.top + dialog.height <= offsetTop + height - rand)
  }
}

test('calendar stays within desktop, narrow mobile and landscape viewports', () => {
  for (const [width, height] of [[1440, 900], [1280, 720], [768, 600], [390, 844], [320, 568], [280, 568], [844, 390], [667, 375]]) innerhalb(width, height)
})
test('zoomed visual viewport offsets keep the calendar visible', () => {
  innerhalb(320, 400, 150, 260)
  innerhalb(700, 480, 90, 160)
})
test('desktop calendar stays anchored below or above when space permits', () => {
  const v = { width: 1440, height: 1000, offsetLeft: 0, offsetTop: 0 }
  const d = { width: 760, height: 500 }
  assert.deepEqual(kalenderPosition(v, d, { left: 100, top: 30, bottom: 90 }), { left: 100, top: 100 })
  assert.deepEqual(kalenderPosition(v, d, { left: 1200, top: 900, bottom: 960 }), { left: 664, top: 390 })
})
test('stage date ranges stay inside the trip and allow a single calendar day', () => {
  const g = { min: '2026-11-15', max: '2026-11-20', minTage: 0 }
  assert.equal(zeitraumGueltig('2026-11-17', '2026-11-17', g), true)
  assert.equal(zeitraumGueltig('2026-11-14', '2026-11-17', g), false)
  assert.equal(zeitraumGueltig('2026-11-17', '2026-11-21', g), false)
  assert.deepEqual(kalenderGrenzen('ende', '2026-11-17', g), { min: '2026-11-17', max: '2026-11-20' })
})
test('single date does not require a second date and still respects its allowed window', () => {
  const g = { min: '2026-11-15', max: '2026-12-31', minTage: 0, einzeln: true }
  assert.equal(zeitraumGueltig('2026-11-17', '', g), true)
  assert.equal(zeitraumGueltig('2026-11-14', '', g), false)
})
test('same-day rental remains valid only when local return time follows pickup', () => {
  const g = { min: '2026-11-15', max: '2028-12-31', minTage: 0, maxTage: 365 }
  assert.equal(zeitraumGueltig('2026-11-17', '2026-11-17', g), true)
  const search = {
    pickup: { id: 1, name: 'Teststation', country: 'Switzerland', region: 'Zurich', type: 'airport' },
    dropoff: null, pickupDate: '2026-11-17', pickupTime: '10:00', dropoffDate: '2026-11-17',
    dropoffTime: '18:00', age: 30, residence: 'CH', currency: 'CHF',
  }
  assert.equal(searchInput.safeParse(search).success, true)
  assert.equal(searchInput.safeParse({ ...search, dropoffTime: '10:00' }).success, false)
  assert.equal(searchInput.safeParse({ ...search, dropoffTime: '09:00' }).success, false)
  assert.equal(zeitraumGueltig('2026-11-17', '2027-11-17', g), true)
  assert.equal(zeitraumGueltig('2026-11-17', '2027-11-18', g), false)
})
