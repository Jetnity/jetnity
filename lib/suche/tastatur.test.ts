import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  sucheAktiveOption,
  sucheListeIndex,
  sucheListeSchliesst,
  sucheListeWaehlt,
} from '@/lib/suche/tastatur'

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

  test('der Aktivindex benennt nur eine aktuell gerenderte Option', () => {
    assert.equal(sucheAktiveOption(0, 3), 0)
    assert.equal(sucheAktiveOption(2, 3), 2)
    assert.equal(sucheAktiveOption(-1, 3), -1)
    assert.equal(sucheAktiveOption(2, 2), -1)
    assert.equal(sucheAktiveOption(1, 1), -1)
    assert.equal(sucheAktiveOption(0, 0), -1)
    assert.equal(sucheAktiveOption(1, 0), -1)
    assert.equal(sucheAktiveOption(1.5, 3), -1)
    assert.equal(sucheAktiveOption(1, 2.5), -1)
  })
})
