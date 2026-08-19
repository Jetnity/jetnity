import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { PLANUNGSPHASEN, phasenindex, planungsphase } from '@/lib/reisevorschlag/fortschritt'

describe('Die Planungsphasen', () => {
  test('beginnen mit dem Verstehen und enden mit der Prüfung', () => {
    assert.equal(planungsphase(0), 'Deine Wünsche werden verstanden …')
    assert.equal(planungsphase(7_999), 'Deine Wünsche werden verstanden …')
    assert.equal(planungsphase(8_000), 'Die sinnvollste Route wird zusammengestellt …')
    assert.equal(planungsphase(40_000), 'Der Tagesplan wird erstellt …')
    assert.equal(planungsphase(65_000), 'Deine Vorgaben werden abschliessend geprüft …')
    assert.equal(planungsphase(120_000), 'Deine Vorgaben werden abschliessend geprüft …')
  })

  test('nennen keine Prozente und keine Providerdaten', () => {
    for (const phase of PLANUNGSPHASEN) {
      assert.doesNotMatch(phase.text, /%|Flugpreis|Verfügbarkeit|Angebot|buchen/i)
    }
  })

  test('eine negative Laufzeit gilt als Beginn', () => {
    assert.equal(planungsphase(-20), PLANUNGSPHASEN[0].text)
    assert.equal(phasenindex(-20), 0)
    assert.equal(phasenindex(20_000), 2)
    assert.equal(phasenindex(65_000), PLANUNGSPHASEN.length - 1)
  })
})
