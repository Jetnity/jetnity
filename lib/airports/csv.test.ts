import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { csvAlsObjekte, csvZeilen } from '@/lib/airports/csv'

describe('OurAirports-CSV', () => {
  test('liest Anführungszeichen und Kommas in Feldern', () => {
    const text = 'name,keywords\n"Zurich Airport","Zürich, ZRH"\n'
    assert.deepEqual(csvZeilen(text), [
      ['name', 'keywords'],
      ['Zurich Airport', 'Zürich, ZRH'],
    ])
    assert.deepEqual(csvAlsObjekte(text), [
      { name: 'Zurich Airport', keywords: 'Zürich, ZRH' },
    ])
  })

  test('ignoriert eine leere Datei', () => {
    assert.deepEqual(csvAlsObjekte(''), [])
  })
})
