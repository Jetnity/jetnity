import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { begruessungName } from '@/lib/account/begruessung'

describe('Account-Begrüssung', () => {
  test('nimmt den ersten Namensbestandteil, wenn Auth einen Namen kennt', () => {
    assert.equal(begruessungName({ name: 'Sasa Feirov', email: 'sasa@example.com' }), 'Sasa')
  })

  test('fällt auf den lokalen E-Mail-Teil zurück', () => {
    assert.equal(begruessungName({ email: 'sasa@example.com' }), 'sasa')
  })

  test('erfindet keinen Namen', () => {
    assert.equal(begruessungName({}), null)
    assert.equal(begruessungName({ name: '   ', email: '' }), null)
  })
})
