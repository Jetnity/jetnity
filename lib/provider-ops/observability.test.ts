import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { PROVIDER_OPS_OPERATIONEN, providerOpsEvent } from '@/lib/provider-ops'

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
    assert.deepEqual(Object.keys(event).sort(), [
      'domain',
      'droppedCount',
      'durationMs',
      'operation',
      'outcome',
      'providerId',
      'rateLimitHit',
      'recordedAt',
      'resultCount',
    ])
    assert.deepEqual(PROVIDER_OPS_OPERATIONEN, ['search', 'evaluate', 'nachweis'])
    assert.equal('tokens' in event, false)
    assert.equal('price' in event, false)
    assert.equal('payload' in event, false)
  })
})
