import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { AENDERUNGSPHASEN, aenderungsphase, aenderungsphasenindex } from '@/lib/reiseaenderung/fortschritt'

describe('Die Änderungsphasen', () => {
  test('beginnen mit dem Lesen und enden mit der Prüfung', () => {
    assert.equal(aenderungsphase(0), 'Dein Änderungswunsch wird gelesen …')
    assert.equal(aenderungsphase(7_999), 'Dein Änderungswunsch wird gelesen …')
    assert.equal(aenderungsphase(8_000), 'Die bestehende Reise wird gegen den Wunsch gehalten …')
    assert.equal(aenderungsphase(65_000), 'Die Änderung wird geprüft …')
    assert.equal(aenderungsphase(120_000), 'Die Änderung wird geprüft …')
  })

  test('nennen keine Prozente und keine Providerdaten', () => {
    for (const phase of AENDERUNGSPHASEN) {
      assert.doesNotMatch(phase.text, /%|Flugpreis|Verfügbarkeit|Angebot|buchen/i)
    }
  })

  test('eine negative Laufzeit gilt als Beginn', () => {
    assert.equal(aenderungsphase(-20), AENDERUNGSPHASEN[0].text)
    assert.equal(aenderungsphasenindex(-20), 0)
    assert.equal(aenderungsphasenindex(65_000), AENDERUNGSPHASEN.length - 1)
  })
})
