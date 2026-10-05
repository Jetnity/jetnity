import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { flugReisegraphPruefen } from '@/lib/flights/reisegraph'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

describe('Flug-Reisegraph', () => {
  test('ein Tag der Reise wird akzeptiert', () => {
    const ergebnis = flugReisegraphPruefen(beispielreise(), { tripId: 'trip-1', dayId: 'day-1' })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.tag?.id, 'day-1')
  })

  test('ohne Tag bleibt die Übernahme ungeplant zulässig', () => {
    const ergebnis = flugReisegraphPruefen(beispielreise(), { tripId: 'trip-1', dayId: null })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.tag, null)
  })

  test('fremde Reise oder fremder Tag werden abgewiesen', () => {
    const reise = beispielreise()
    const fremd = flugReisegraphPruefen(reise, { tripId: 'trip-fremd', dayId: 'day-1' })
    const tag = flugReisegraphPruefen(reise, { tripId: 'trip-1', dayId: 'day-fehlt' })
    assert.equal(fremd.ok, false)
    assert.equal(tag.ok, false)
    if (fremd.ok || tag.ok) return
    assert.equal(fremd.art, 'reise-fremd')
    assert.equal(tag.art, 'tag-fremd')
  })
})
