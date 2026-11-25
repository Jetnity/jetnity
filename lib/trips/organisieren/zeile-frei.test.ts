import assert from 'node:assert/strict'
import { test } from 'node:test'

import { organisierenDockFest, organisierenZeileScroll } from './zeile-frei'

test('390 px: die gemessene erste Zeile rückt über die fixierte Leiste', () => {
  const delta = organisierenZeileScroll({ top: 539, bottom: 639 }, 547, 664)
  assert.equal(delta, 100)
  assert.ok(639 - delta <= 547 - 8)
  const real = organisierenZeileScroll({ top: 616.65625, bottom: 718 }, 591, 664)
  assert.equal(real, 135)
  assert.ok(718 - real <= 591 - 8)
})

test('ohne Leiste, bereits freie Zeile oder Zeile oberhalb bleibt der Stand', () => {
  assert.equal(organisierenZeileScroll({ top: 120, bottom: 220 }, null, 664), 0)
  assert.equal(organisierenZeileScroll({ top: 120, bottom: 220 }, 547, 664), 0)
  assert.equal(organisierenZeileScroll({ top: -200, bottom: -20 }, 547, 664), 0)
})

test('die Leiste ist nur auf dem gewöhnlichen Handy fest', () => {
  assert.equal(organisierenDockFest({ breite: 390, hoehe: 664, schriftPx: 16, tastatur: false }), true)
  assert.equal(organisierenDockFest({ breite: 320, hoehe: 700, schriftPx: 16, tastatur: false }), false)
  assert.equal(organisierenDockFest({ breite: 1280, hoehe: 800, schriftPx: 16, tastatur: false }), false)
  assert.equal(organisierenDockFest({ breite: 390, hoehe: 480, schriftPx: 16, tastatur: false }), false)
  assert.equal(organisierenDockFest({ breite: 390, hoehe: 664, schriftPx: 24, tastatur: false }), false)
  assert.equal(organisierenDockFest({ breite: 390, hoehe: 664, schriftPx: 16, tastatur: true }), false)
})
