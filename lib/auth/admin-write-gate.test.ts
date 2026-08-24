import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { adminWriteErlaubt } from './admin-write-gate'

describe('adminWriteErlaubt', () => {
  test('erlaubt persistente Writes nur bei Datenbankrolle', () => {
    assert.deepEqual(adminWriteErlaubt({ grant: 'role' }), { erlaubt: true })
  })

  test('lehnt Break-Glass ab — UI-Zugang ist kein Schreibrecht', () => {
    assert.deepEqual(adminWriteErlaubt({ grant: 'break-glass' }), {
      erlaubt: false,
      grund: 'break_glass',
    })
  })
})
