import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import { WHITE_MINT, hexNachRgb, kontrast } from '@/lib/ui/white-mint-home-workspace-1/palette'

const flaeche = readFileSync(join(process.cwd(), 'styles/white-mint.css'), 'utf8').toLowerCase()

test('the scoped stylesheet carries the approved white/mint pairs', () => {
  for (const [name, hex] of Object.entries(WHITE_MINT)) {
    if (name === 'beige') {
      assert.equal(flaeche.includes(hex.toLowerCase()), false, 'the old beige must not be reintroduced')
      continue
    }
    assert.equal(flaeche.includes(hex.toLowerCase()), true, name)
  }
  assert.equal(flaeche.includes('[data-workspace-theme="green"]'), false)
  assert.equal(flaeche.includes('!important'), false)
})

test('text and control pairs clear the contrast floor; pale edges do not', () => {
  const canvas = hexNachRgb(WHITE_MINT.canvas)
  const card = hexNachRgb(WHITE_MINT.card)
  const navigation = hexNachRgb(WHITE_MINT.navigation)
  const selected = hexNachRgb(WHITE_MINT.selected)
  const ink = hexNachRgb(WHITE_MINT.ink)
  const muted = hexNachRgb(WHITE_MINT.muted)
  const control = hexNachRgb(WHITE_MINT.control)
  const edge = hexNachRgb(WHITE_MINT.edge)
  for (const hintergrund of [canvas, card, navigation, selected]) {
    assert.ok(kontrast(ink, hintergrund) >= 4.5)
    assert.ok(kontrast(muted, hintergrund) >= 4.5)
    assert.ok(kontrast(control, hintergrund) >= 3)
  }
  assert.ok(kontrast(hexNachRgb('#FFFFFF'), ink) >= 4.5)
  assert.ok(kontrast(edge, card) < 3)
  assert.ok(kontrast(hexNachRgb(WHITE_MINT.beige), card) > 1)
})
