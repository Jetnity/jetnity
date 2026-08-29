import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  PROVIDER_TRANSPORT_EVENT_FIELDS,
  isoFromClock,
  providerTransportEvent,
  providerTransportEventFieldNames,
} from '@/lib/server/providers/core'

describe('provider transport observability', () => {
  test('events keep only the allowlisted fields', () => {
    const dirty = {
      name: 'request_started' as const,
      providerId: 'example',
      operationId: 'search',
      method: 'POST' as const,
      origin: 'https://provider.test',
      path: '/create',
      attempt: 1,
      maxAttempts: 3,
      status: null,
      elapsedMs: 0,
      errorKind: null,
      causeKind: null,
      retryAfterMs: null,
      delayMs: null,
      correlationId: 'corr-1',
      recordedAt: '2026-08-29T15:00:00.000Z',
      payload: { token: 'should-not-survive' },
      headers: { 'x-api-key': 'should-not-survive' },
    }
    const event = providerTransportEvent(dirty)
    assert.deepEqual(Object.keys(event).sort(), [...PROVIDER_TRANSPORT_EVENT_FIELDS].sort())
    assert.deepEqual(providerTransportEventFieldNames(), PROVIDER_TRANSPORT_EVENT_FIELDS)
    assert.equal('payload' in event, false)
    assert.equal('headers' in event, false)
    assert.equal(JSON.stringify(event).includes('should-not-survive'), false)
    assert.equal(isoFromClock(0), '1970-01-01T00:00:00.000Z')
  })
})
