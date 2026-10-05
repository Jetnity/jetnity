import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { ACTIVITY_RATE_GRENZEN, activityRateLeeren, activitySucheErlaubt } from '@/lib/activities/rate-limit'

describe('Aktivitäts-Rate-Limit', () => {
  test('zu viele Suchen im Fenster werden abgelehnt', async () => {
    activityRateLeeren()
    let uhr = 1_000_000
    for (let i = 0; i < ACTIVITY_RATE_GRENZEN.suchenJeFenster; i += 1) {
      assert.equal((await activitySucheErlaubt('ip:test', () => uhr)).ok, true)
      uhr += 1
    }
    assert.equal((await activitySucheErlaubt('ip:test', () => uhr)).ok, false)
  })
})
