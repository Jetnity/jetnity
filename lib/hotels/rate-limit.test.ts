import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { HOTEL_RATE_GRENZEN, hotelRateLeeren, hotelSucheErlaubt } from '@/lib/hotels/rate-limit'

describe('Hotel-Rate-Limit', () => {
  test('zu viele Suchen im Fenster werden abgelehnt', async () => {
    hotelRateLeeren()
    let uhr = 1_000_000
    for (let i = 0; i < HOTEL_RATE_GRENZEN.suchenJeFenster; i += 1) {
      assert.equal((await hotelSucheErlaubt('ip:test', () => uhr)).ok, true)
      uhr += 1
    }
    assert.equal((await hotelSucheErlaubt('ip:test', () => uhr)).ok, false)
  })
})
