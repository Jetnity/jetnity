import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { FLUG_RATE_GRENZEN, flugRateKennungAus, flugRateLeeren, flugSucheErlaubt } from '@/lib/flights/rate-limit'

describe('Flug-Rate-Limit', () => {
  test('das Fenster lässt die erlaubte Zahl durch und sperrt danach', async () => {
    flugRateLeeren()
    let uhr = 1_000_000
    for (let i = 0; i < FLUG_RATE_GRENZEN.suchenJeFenster; i++) {
      assert.equal((await flugSucheErlaubt('ip:1', () => uhr)).ok, true)
      uhr += 10
    }
    const gesperrt = await flugSucheErlaubt('ip:1', () => uhr)
    assert.equal(gesperrt.ok, false)
    if (!gesperrt.ok) assert.ok(gesperrt.retryAfterSec > 0)
  })

  test('eine andere Kennung bleibt frei', async () => {
    flugRateLeeren()
    assert.equal((await flugSucheErlaubt('ip:a', () => 1)).ok, true)
    assert.equal((await flugSucheErlaubt('ip:b', () => 1)).ok, true)
  })

  test('die IP kommt aus dem ersten X-Forwarded-For-Hop', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.8, 10.0.0.1' })
    assert.equal(flugRateKennungAus(headers), 'ip:203.0.113.8')
  })
})
