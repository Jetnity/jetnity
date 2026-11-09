import { test } from 'node:test'
import assert from 'node:assert/strict'
import { archivErstellen, archivLesen } from './archiv'
test('private catalog round trips; wrong keys or altered data are rejected', () => {
  const key = 'ab'.repeat(32),
    raw = Buffer.from(JSON.stringify({ preis: 4726 }))
  const a = archivErstellen(raw, key),
    b = archivErstellen(raw, key)
  assert.notDeepEqual(a, b)
  assert.deepEqual(archivLesen(a, key), { preis: 4726 })
  assert.throws(() => archivLesen(a, 'f0'.repeat(32)))
  a[a.length - 1] ^= 1
  assert.throws(() => archivLesen(a, key))
})
