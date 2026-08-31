import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { airportTimezoneIdentifierLesen } from '@/lib/flights/airport-timezone'

describe('Airport-Timezone-Identifier', () => {
  test('bekannte IANA-Zonen bleiben unverändert erhalten', () => {
    assert.equal(airportTimezoneIdentifierLesen('Europe/Zurich'), 'Europe/Zurich')
    assert.equal(airportTimezoneIdentifierLesen('Asia/Bangkok'), 'Asia/Bangkok')
    assert.equal(airportTimezoneIdentifierLesen('America/Argentina/Buenos_Aires'), 'America/Argentina/Buenos_Aires')
  })

  test('leere, fehlende oder nicht-string Werte sind keine Evidence', () => {
    assert.equal(airportTimezoneIdentifierLesen(undefined), null)
    assert.equal(airportTimezoneIdentifierLesen(null), null)
    assert.equal(airportTimezoneIdentifierLesen(''), null)
    assert.equal(airportTimezoneIdentifierLesen(2), null)
    assert.equal(airportTimezoneIdentifierLesen({ time_zone: 'Europe/Zurich' }), null)
  })

  test('Whitespace, Offset, Z und unbegrenzte Werte werden abgelehnt', () => {
    assert.equal(airportTimezoneIdentifierLesen(' Europe/Zurich'), null)
    assert.equal(airportTimezoneIdentifierLesen('Europe/Zurich '), null)
    assert.equal(airportTimezoneIdentifierLesen('   '), null)
    assert.equal(airportTimezoneIdentifierLesen('Z'), null)
    assert.equal(airportTimezoneIdentifierLesen('z'), null)
    assert.equal(airportTimezoneIdentifierLesen('+02:00'), null)
    assert.equal(airportTimezoneIdentifierLesen('-05:00'), null)
    assert.equal(airportTimezoneIdentifierLesen('+0000'), null)
    assert.equal(airportTimezoneIdentifierLesen('+2'), null)
    assert.equal(airportTimezoneIdentifierLesen('Not/A/Real/Zone'), null)
    assert.equal(airportTimezoneIdentifierLesen('../Europe/Zurich'), null)
    assert.equal(airportTimezoneIdentifierLesen('Europe\\Zurich'), null)
    assert.equal(airportTimezoneIdentifierLesen('/Europe/Zurich'), null)
    assert.equal(airportTimezoneIdentifierLesen('Europe/Zurich\n'), null)
    assert.equal(airportTimezoneIdentifierLesen('x'.repeat(65)), null)
  })

  test('ein gültiger Identifier wird nicht auf eine andere Zone umgeschrieben', () => {
    const gelesen = airportTimezoneIdentifierLesen('Asia/Bangkok')
    assert.equal(gelesen, 'Asia/Bangkok')
    assert.notEqual(gelesen, 'Europe/Zurich')
  })
})
