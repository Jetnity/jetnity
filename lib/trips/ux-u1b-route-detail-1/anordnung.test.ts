import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DETAIL_MIN_REM,
  EINTRITT_REM,
  ROUTE_MIN_REM,
  SCHWELLE_REM,
  SPALTEN_GAP_REM,
  naechsteAnordnung,
} from '@/lib/trips/ux-u1b-route-detail-1/anordnung'

test('die Schwelle ist die Summe der harten Minima', () => {
  assert.equal(SCHWELLE_REM, 49.5)
  assert.equal(ROUTE_MIN_REM + DETAIL_MIN_REM + SPALTEN_GAP_REM, SCHWELLE_REM)
  assert.equal(EINTRITT_REM, 50.5)
})

test('der erste Blick nutzt 49.5rem, der Wiedereintritt 50.5rem, das Verlassen liegt darunter', () => {
  const root = 16
  const px = (rem: number) => rem * root
  assert.equal(naechsteAnordnung(null, px(49.5) - 0.1, root), 'schmal')
  assert.equal(naechsteAnordnung(null, px(49.5), root), 'neben')
  assert.equal(naechsteAnordnung('neben', px(49.5), root), 'neben')
  assert.equal(naechsteAnordnung('neben', px(49.5) - 0.1, root), 'schmal')
  assert.equal(naechsteAnordnung('schmal', px(49.5), root), 'schmal')
  assert.equal(naechsteAnordnung('schmal', px(50.5) - 0.1, root), 'schmal')
  assert.equal(naechsteAnordnung('schmal', px(50.5), root), 'neben')
})

test('Root 32 vergrößert die Schwelle, 1440 CSS-Pixel bleiben schmal', () => {
  const root = 32
  assert.equal(naechsteAnordnung(null, 1344, root), 'schmal')
  assert.equal(naechsteAnordnung(null, 49.5 * root, root), 'neben')
  assert.equal(naechsteAnordnung('neben', 49.5 * root - 1, root), 'schmal')
})

test('768 und 390 bei Root 16 sind schmal, 1024 und 1440 sind neben', () => {
  assert.equal(naechsteAnordnung(null, 720, 16), 'schmal')
  assert.equal(naechsteAnordnung(null, 342, 16), 'schmal')
  assert.equal(naechsteAnordnung(null, 976, 16), 'neben')
  assert.equal(naechsteAnordnung(null, 1232, 16), 'neben')
})
