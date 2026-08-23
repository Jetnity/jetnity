import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  SAFETY_AKTION_TEXT,
  SAFETY_KLASSE_TEXT,
  safetyZusammenfassungText,
} from '@/lib/safety/anzeige'
import { safetyAusFacts } from '@/lib/safety/engine'
import { SAFETY_NOW_MS, mehrzielreise, safetyFact } from '@/lib/safety/fixtures'
import { safetyAnsicht } from '@/lib/safety/status'

describe('Safety-Anzeige', () => {
  test('25 Warnungsstufe ist ohne Farbe verständlich', () => {
    assert.equal(SAFETY_KLASSE_TEXT.critical_warning, 'Kritische Warnung')
    assert.equal(SAFETY_KLASSE_TEXT.important_notice, 'Wichtiger Reisehinweis')
    assert.equal(SAFETY_KLASSE_TEXT.unknown, 'Lage unklar')
  })

  test('26 betroffener Reiseteil ist klar benannt', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: SAFETY_NOW_MS },
    )
    assert.equal(evaluations[0]?.affectedRefs[0]?.label, 'Florenz')
  })

  test('27 Source/Freshness ist benannt', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: SAFETY_NOW_MS },
    )
    assert.equal(evaluations[0]?.evidence.authority, 'Test Authority')
    assert.equal(evaluations[0]?.freshness, 'current')
  })

  test('28 keine automatische Änderungswirkung', () => {
    assert.equal(SAFETY_AKTION_TEXT.observe.includes('nicht still ändern'), true)
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: SAFETY_NOW_MS },
    )
    assert.equal(evaluations[0]?.impact.some((eintrag) => eintrag.status === 'needs_recheck'), true)
  })

  test('29 mehrere Hinweise werden deterministisch priorisiert', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'info-it',
          category: 'other',
          spatialScope: { kind: 'country', countryCode: 'IT' },
          sourceSeverity: 'minor',
          advisoryClass: 'informational',
        }),
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          sourceSeverity: 'extreme',
          advisoryClass: 'do_not_travel',
        }),
      ],
      'audit-safety',
      { nowMs: SAFETY_NOW_MS },
    )
    assert.equal(evaluations[0]?.presentationClass, 'critical_warning')
    assert.equal(evaluations[1]?.presentationClass, 'information')
  })

  test('30 Übersicht bleibt ohne Evaluations leer', () => {
    const ansicht = safetyAnsicht(mehrzielreise())
    assert.equal(ansicht.summary.sichtbar, false)
    assert.equal(safetyZusammenfassungText(ansicht.summary).includes('nicht geprüft'), true)
  })
})
