import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { providerOpsEvent, providerOpsHealthAusEvents } from '@/lib/provider-ops'

describe('Provider Readiness S7 bounded metadata', () => {
  test('Dauer, Zähler und Provider-ID bleiben technisch begrenzt', () => {
    const event = providerOpsEvent({
      domain: 'flights',
      providerId: `  ${'x'.repeat(200)}  `,
      operation: 'search',
      outcome: 'ok',
      durationMs: Number.POSITIVE_INFINITY,
      resultCount: 9_999_999,
      droppedCount: -12,
      rateLimitHit: false,
      recordedAt: '2026-09-01T04:00:00.000Z',
    })

    assert.equal(event.providerId?.length, 80)
    assert.equal(event.durationMs, 0)
    assert.equal(event.resultCount, 1_000_000)
    assert.equal(event.droppedCount, 0)
  })

  test('leere Provider-ID wird null und Dezimalwerte werden ganzzahlig', () => {
    const event = providerOpsEvent({
      domain: 'hotels',
      providerId: '   ',
      operation: 'search',
      outcome: 'empty',
      durationMs: 12.9,
      resultCount: 2.8,
      droppedCount: null,
      rateLimitHit: false,
      recordedAt: '2026-09-01T04:00:00.000Z',
    })

    assert.equal(event.providerId, null)
    assert.equal(event.durationMs, 12)
    assert.equal(event.resultCount, 2)
    assert.equal(event.droppedCount, null)
  })

  test('nicht-endliche Health-Uhr oder Altersgrenze kann niemals fake-grün werden', () => {
    const event = providerOpsEvent({
      domain: 'flights',
      providerId: 'test',
      operation: 'search',
      outcome: 'ok',
      durationMs: 10,
      resultCount: 1,
      droppedCount: 0,
      rateLimitHit: false,
      recordedAt: '2026-09-01T04:00:00.000Z',
    })

    for (const optionen of [
      { domain: 'flights' as const, nowMs: Number.NaN, maxAgeMs: 60_000 },
      { domain: 'flights' as const, nowMs: Number.POSITIVE_INFINITY, maxAgeMs: 60_000 },
      { domain: 'flights' as const, nowMs: Date.parse('2026-09-01T04:00:10.000Z'), maxAgeMs: Number.POSITIVE_INFINITY },
      { domain: 'flights' as const, nowMs: Date.parse('2026-09-01T04:00:10.000Z'), maxAgeMs: -1 },
    ]) {
      assert.deepEqual(providerOpsHealthAusEvents([event], optionen), {
        status: 'unknown',
        evidenceAt: event.recordedAt,
        stale: true,
      })
    }
  })
})
