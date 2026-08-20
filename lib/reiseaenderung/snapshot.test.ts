import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { reiseFuerModell } from '@/lib/reiseaenderung/snapshot'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

describe('Der Snapshot für das Modell', () => {
  test('trägt keine kommerziellen Felder', () => {
    const roh = JSON.stringify(reiseFuerModell(beispielreise()))
    assert.doesNotMatch(roh, /price|preis|provider|booking|externalRef|external_ref|getyourguide/i)
    assert.doesNotMatch(roh, /18/)
  })

  test('trägt Kennungen und Etappen-Tage-Zuordnung', () => {
    const snapshot = reiseFuerModell(beispielreise())
    assert.equal(snapshot.revision, 3)
    assert.deepEqual(snapshot.etappen[0]?.tagIds, ['day-1', 'day-2', 'day-3'])
    assert.equal(snapshot.tage[0]?.punkte[0]?.id, 'item-1')
  })
})
