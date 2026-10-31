import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { readCmpController, serverCmpSnapshot, subscribeCmpController } from '@/lib/privacy/privacybee-cmp/abo'

describe('cmp abo', () => {
  test('der Server-Snapshot ist ein stabiles Objekt und das Abo ändert ihn ohne Dokument nicht', () => {
    const first = serverCmpSnapshot()
    const second = serverCmpSnapshot()
    assert.equal(first, second)
    assert.equal(readCmpController(), first)
    let calls = 0
    const stop = subscribeCmpController(() => { calls += 1 })
    assert.equal(calls, 0)
    assert.equal(readCmpController(), first)
    assert.equal(serverCmpSnapshot(), first)
    stop()
    assert.equal(readCmpController(), first)
  })
})
