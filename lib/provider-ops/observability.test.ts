import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  PROVIDER_OPS_EVENT_FELDER,
  PROVIDER_OPS_OPERATIONEN,
  providerOpsEvent,
  providerOpsEventSchreiben,
  providerOpsHealthAusEvents,
  type ProviderOpsEvent,
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

  test('Sink-Fehler verändern die fachliche Ausführung nicht', async () => {
    const event = await providerOpsEventSchreiben(
      {
        write() {
          throw new Error('telemetry down')
        },
      },
      {
        domain: 'hotels',
        providerId: null,
        operation: 'search',
        outcome: 'unavailable',
        durationMs: 4,
        resultCount: 0,
        droppedCount: 0,
        rateLimitHit: false,
        recordedAt: '2026-09-01T03:00:00.000Z',
      },
    )

    assert.equal(event.outcome, 'unavailable')
    assert.deepEqual(Object.keys(event).sort(), [...PROVIDER_OPS_EVENT_FELDER].sort())
  })

  test('Health bleibt ohne oder mit alter Evidence unknown statt fake-grün', () => {
    const nowMs = Date.parse('2026-09-01T04:00:00.000Z')
    assert.deepEqual(
      providerOpsHealthAusEvents([], { domain: 'flights', nowMs, maxAgeMs: 60_000 }),
      { status: 'unknown', evidenceAt: null, stale: false },
    )

    const alt: ProviderOpsEvent = providerOpsEvent({
      domain: 'flights',
      providerId: 'test',
      operation: 'search',
      outcome: 'ok',
      durationMs: 8,
      resultCount: 1,
      droppedCount: 0,
      rateLimitHit: false,
      recordedAt: '2026-09-01T03:00:00.000Z',
    })
    assert.deepEqual(
      providerOpsHealthAusEvents([alt], { domain: 'flights', nowMs, maxAgeMs: 60_000 }),
      { status: 'unknown', evidenceAt: alt.recordedAt, stale: true },
    )
  })

  test('Health mappt aktuelle technische Outcomes ehrlich', () => {
    const nowMs = Date.parse('2026-09-01T04:00:10.000Z')
    const event = (outcome: ProviderOpsEvent['outcome']) =>
      providerOpsEvent({
        domain: 'readiness',
        providerId: 'test',
        operation: 'evaluate',
        outcome,
        durationMs: 10,
        resultCount: 0,
        droppedCount: 0,
        rateLimitHit: outcome === 'rate_limited',
        recordedAt: '2026-09-01T04:00:00.000Z',
      })

    for (const [outcome, status] of [
      ['empty', 'empty'],
      ['partial', 'partial'],
      ['unavailable', 'unavailable'],
      ['timeout', 'timeout'],
      ['rate_limited', 'rate_limited'],
      ['error', 'internal'],
      ['invalid', 'unknown'],
    ] as const) {
      assert.equal(
        providerOpsHealthAusEvents([event(outcome)], {
          domain: 'readiness',
          nowMs,
          maxAgeMs: 60_000,
        }).status,
        status,
      )
    }
  })
})
