import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { sucheLage, sucheListeSichtbar } from '@/lib/suche/lage'

const basis = {
  offen: true,
  laedt: false,
  treffer: 0,
  queryLen: 4,
  minQueryLen: 2,
  hatAuswahl: false,
  fehlerArt: null as 'error' | 'unavailable' | null,
  ungueltig: false,
}

describe('Suchlage', () => {
  test('Loading, Empty, Error, Unavailable und Invalid bleiben getrennt', () => {
    assert.equal(sucheLage({ ...basis, laedt: true }), 'loading')
    assert.equal(sucheLage(basis), 'empty')
    assert.equal(sucheLage({ ...basis, fehlerArt: 'error' }), 'error')
    assert.equal(sucheLage({ ...basis, fehlerArt: 'unavailable' }), 'unavailable')
    assert.equal(sucheLage({ ...basis, treffer: 3 }), 'results')
    assert.equal(sucheLage({ ...basis, offen: false, ungueltig: true }), 'invalid')
    assert.equal(sucheListeSichtbar('loading'), true)
    assert.equal(sucheListeSichtbar('invalid'), false)
    assert.notEqual(sucheLage({ ...basis, fehlerArt: 'unavailable' }), 'empty')
    assert.notEqual(sucheLage({ ...basis, fehlerArt: 'error' }), 'unavailable')
  })
})
