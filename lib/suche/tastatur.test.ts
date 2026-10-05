import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { sucheListeIndex, sucheListeSchliesst, sucheListeWaehlt } from '@/lib/suche/tastatur'

describe('Suchlisten-Tastatur', () => {
  test('ArrowDown und ArrowUp rotieren, Enter wählt, Escape schliesst', () => {
    assert.equal(sucheListeIndex(-1, 4, 'ArrowDown'), 0)
    assert.equal(sucheListeIndex(0, 4, 'ArrowDown'), 1)
    assert.equal(sucheListeIndex(3, 4, 'ArrowDown'), 0)
    assert.equal(sucheListeIndex(0, 4, 'ArrowUp'), 3)
    assert.equal(sucheListeIndex(2, 4, 'ArrowUp'), 1)
    assert.equal(sucheListeWaehlt('Enter', 1), true)
    assert.equal(sucheListeWaehlt('Enter', -1), false)
    assert.equal(sucheListeSchliesst('Escape'), true)
    assert.equal(sucheListeSchliesst('Enter'), false)
  })
})
