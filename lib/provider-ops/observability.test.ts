import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  PROVIDER_OPS_EVENT_FELDER,
  PROVIDER_OPS_OPERATIONEN,
  providerOpsEvent,
} from '@/lib/provider-ops'

describe('Provider-Ops Observability-Contract', () => {
  test('Event trägt nur erlaubte technische Metadaten', () => {
    const event = providerOpsEvent({
      domain: 'flights',
      providerId: null,
      operation: 'search',
      outcome: 'unavailable',
      durationMs: 12,
      resultCount: 0,
      droppedCount: 0,
      rateLimitHit: false,
      recordedAt: '2026-08-24T09:00:00.000Z',
    })
    assert.deepEqual(Object.keys(event).sort(), [...PROVIDER_OPS_EVENT_FELDER].sort())
    assert.deepEqual(PROVIDER_OPS_OPERATIONEN, ['search', 'evaluate', 'nachweis'])
    assert.equal('tokens' in event, false)
    assert.equal('price' in event, false)
    assert.equal('payload' in event, false)
  })

  test('Zusatzfelder aus einem strukturell kompatiblen Objekt überleben nicht', () => {
    const dirty = {
      domain: 'flights' as const,
      providerId: 'duffel',
      operation: 'search' as const,
      outcome: 'ok' as const,
      durationMs: 9,
      resultCount: 2,
      droppedCount: 1,
      rateLimitHit: false,
      recordedAt: '2026-08-24T09:00:00.000Z',
      payload: { route: 'ZRH-BKK', token: 'secret' },
      token: 'leak',
      price: 199,
    }
    const event = providerOpsEvent(dirty)
    assert.deepEqual(Object.keys(event).sort(), [...PROVIDER_OPS_EVENT_FELDER].sort())
    assert.equal('payload' in event, false)
    assert.equal('token' in event, false)
    assert.equal('price' in event, false)
    assert.equal(JSON.stringify(event).includes('ZRH-BKK'), false)
    assert.equal(JSON.stringify(event).includes('secret'), false)
  })
})
