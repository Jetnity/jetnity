import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { SEASONAL_KLASSE_TEXT, seasonalZusammenfassungText } from '@/lib/seasonal/anzeige'
import { seasonalAusFacts } from '@/lib/seasonal/engine'
import { SEASONAL_NOW_MS, bangkokMonsunReise, seasonalFact } from '@/lib/seasonal/fixtures'
import { seasonalAnsicht } from '@/lib/seasonal/status'

describe('Seasonal-Anzeige', () => {
  test('ohne Evaluations keine permanente Karte', () => {
    assert.equal(seasonalAnsicht(bangkokMonsunReise()).summary.sichtbar, false)
  })

  test('unavailable Copy ist keine gute Reisezeit', () => {
    const evaluations = seasonalAusFacts(bangkokMonsunReise(), [], null)
    const text = seasonalZusammenfassungText(seasonalAnsicht(bangkokMonsunReise(), evaluations).summary)
    assert.match(text, /nicht geprüft/)
    assert.doesNotMatch(text, /schlecht|gefährlich|Reisezeit ist gut/)
  })

  test('timing notice Copy bleibt ruhig', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'mixed_tradeoff' })],
      'audit-seasonal',
      { nowMs: SEASONAL_NOW_MS },
    )
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
    assert.equal(ansicht.summary.sichtbar, true)
    const text = seasonalZusammenfassungText(ansicht.summary)
    assert.match(text, /Trade-offs|beeinflussen|typisch/i)
    assert.doesNotMatch(text, /gefährlich|nicht reisen|schlechte Reisezeit/)
    assert.equal(SEASONAL_KLASSE_TEXT.timing_notice, 'Saisonaler Hinweis')
  })

  test('favorable plus stale ergibt keine saubere Gesamtaussage', () => {
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
    const text = seasonalZusammenfassungText(ansicht.summary)
    assert.equal(ansicht.summary.complete, false)
    assert.equal(ansicht.summary.checkState, 'unknown')
    assert.match(text, /nicht belastbar vollständig prüfbar/)
    assert.doesNotMatch(text, /ohne belastbaren Nachteil/)
  })

  test('Präsentationsklassen enthalten kein Safety-Vokabular', () => {
    assert.equal('critical_warning' in SEASONAL_KLASSE_TEXT, false)
    assert.equal('do_not_travel' in SEASONAL_KLASSE_TEXT, false)
  })
})
