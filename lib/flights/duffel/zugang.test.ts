import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { duffelProviderAus } from '@/lib/flights/duffel/factory'
import { istDuffelTestToken } from '@/lib/flights/duffel/zugang'

describe('Duffel-Zugang', () => {
  test('akzeptiert nur Duffel-Test-Tokens', () => {
    assert.equal(istDuffelTestToken('duffel_test_xxxxxxxx'), true)
    assert.equal(istDuffelTestToken('duffel_live_xxxxxxxxxxxxxxxx'), false)
    assert.equal(istDuffelTestToken(''), false)
    assert.equal(istDuffelTestToken(undefined), false)
    assert.equal(istDuffelTestToken('duffel_test_short'), false)
  })

  test('Fabrik liest das Token nur aus der Duffel-Umgebung', () => {
    assert.equal(duffelProviderAus({ JETNITY_FLIGHT_AKTIV: 'true' }, {}), null)
    assert.equal(
      duffelProviderAus(
        { JETNITY_FLIGHT_AKTIV: 'true' },
        { DUFFEL_ACCESS_TOKEN: 'duffel_live_xxxxxxxxxxxxxxxx' },
      ),
      null,
    )
    assert.equal(
      duffelProviderAus(
        { JETNITY_FLIGHT_AKTIV: 'true' },
        { DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx' },
      )?.id,
      'duffel',
    )
    assert.equal(
      duffelProviderAus(
        { VERCEL_ENV: 'production', JETNITY_FLIGHT_AKTIV: 'true' },
        { DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx' },
      ),
      null,
    )
  })

  test('ein auf die globale Flug-Umgebung geschmuggeltes Token konstruiert Duffel nicht', () => {
    const geschmuggelt = {
      JETNITY_FLIGHT_AKTIV: 'true',
      DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx',
    }
    assert.equal(duffelProviderAus(geschmuggelt, {}), null)
  })

  test('globale Flight-Module tragen kein Duffel-Credential', () => {
    const zustand = readFileSync('lib/flights/zustand.ts', 'utf8')
    const sammlung = readFileSync('lib/flights/provider-sammlung.ts', 'utf8')
    assert.doesNotMatch(zustand, /DUFFEL_|ACCESS_TOKEN|istDuffelTestToken/)
    assert.doesNotMatch(sammlung, /DUFFEL_ACCESS_TOKEN|ACCESS_TOKEN/)
    assert.match(readFileSync('lib/flights/duffel/zugang.ts', 'utf8'), /DUFFEL_ACCESS_TOKEN/)
    assert.match(readFileSync('lib/flights/duffel/factory.ts', 'utf8'), /duffelZugang/)
  })
})
