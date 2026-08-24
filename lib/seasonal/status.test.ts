import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { seasonalZusammenfassungText } from '@/lib/seasonal/anzeige'
import { seasonalAusFacts } from '@/lib/seasonal/engine'
import { SEASONAL_NOW_MS, bangkokMonsunReise, seasonalFact } from '@/lib/seasonal/fixtures'
import { seasonalAnsicht, seasonalApiStatus } from '@/lib/seasonal/status'

describe('Seasonal-Statusaggregation', () => {
  test('aktueller favorable_context plus stale less_favorable bleibt unvollständig', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'dry-th', category: 'other', outcome: 'favorable_context' }),
        seasonalFact({
          factKey: 'rain-th',
          category: 'monsoon',
          outcome: 'less_favorable',
          freshUntil: '2026-08-21T09:30:00.000Z',
        }),
      ],
      'audit-seasonal',
      { nowMs: SEASONAL_NOW_MS },
    )
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
    assert.equal(ansicht.summary.complete, false)
    assert.equal(ansicht.summary.checkState, 'unknown')
    assert.equal(seasonalApiStatus(ansicht.summary), 'unknown')
    assert.doesNotMatch(seasonalZusammenfassungText(ansicht.summary), /ohne belastbaren Nachteil/)
  })

  test('aktueller Timing-Hinweis plus Konflikt bleibt sichtbar und unvollständig', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'heat-th', category: 'heat', outcome: 'less_favorable' }),
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'less_favorable' }),
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'favorable_context' }),
      ],
      'audit-seasonal',
      { nowMs: SEASONAL_NOW_MS },
    )
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
    assert.equal(ansicht.summary.timingCheck > 0, true)
    assert.equal(ansicht.sichtbare.some((eintrag) => eintrag.factKey === 'heat-th'), true)
    assert.equal(ansicht.summary.complete, false)
    assert.equal(ansicht.summary.checkState, 'unknown')
    assert.equal(seasonalApiStatus(ansicht.summary), 'unknown')
  })

  test('aktueller Timing-Hinweis plus insufficient_context bleibt unvollständig', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'less_favorable' }),
        seasonalFact({
          factKey: 'rain-north',
          category: 'monsoon',
          spatialScope: { kind: 'admin_region', countryCode: 'TH', regionName: 'Isan' },
        }),
      ],
      'audit-seasonal',
      { nowMs: SEASONAL_NOW_MS },
    )
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
    assert.equal(ansicht.summary.timingCheck > 0, true)
    assert.equal(ansicht.summary.complete, false)
    assert.equal(seasonalApiStatus(ansicht.summary), 'unknown')
  })

  test('gültiger Timing-Hinweis plus acute/unavailable bleibt unvollständig', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'less_favorable' }),
        seasonalFact({
          factKey: 'warn-th',
          category: 'monsoon',
          evidenceClass: 'active_warning',
          availability: 'temporarily_unavailable',
        }),
      ],
      'audit-seasonal',
      { nowMs: SEASONAL_NOW_MS },
    )
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
    assert.equal(ansicht.sichtbare.some((eintrag) => eintrag.factKey === 'rain-th'), true)
    assert.equal(ansicht.summary.complete, false)
    assert.equal(ansicht.summary.checkState, 'unknown')
    assert.equal(seasonalApiStatus(ansicht.summary), 'unknown')
    assert.doesNotMatch(seasonalZusammenfassungText(ansicht.summary), /Reisezeit ist gut|Reisezeit ist optimal/)
  })

  test('zwei aktuelle konsistente Facts behalten den bestehenden Status', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'less_favorable' }),
        seasonalFact({ factKey: 'heat-th', category: 'heat', outcome: 'mixed_tradeoff' }),
      ],
      'audit-seasonal',
      { nowMs: SEASONAL_NOW_MS },
    )
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
    assert.equal(ansicht.summary.complete, true)
    assert.equal(ansicht.summary.checkState, 'has_timing')
    assert.equal(seasonalApiStatus(ansicht.summary), 'ok')
  })
})
