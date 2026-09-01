import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { flugZustand, flugZustandMeldung } from '@/lib/flights/zustand'

describe('Flugzustand', () => {
  test('Production bleibt hart aus, auch mit Credentials', () => {
    const zustand = flugZustand({
      VERCEL_ENV: 'production',
      JETNITY_FLIGHT_AKTIV: 'true',
      DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx',
    })
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'production')
    assert.match(flugZustandMeldung(zustand), /Production/)
  })

  test('ohne Kill Switch bleibt die Suche aus', () => {
    const zustand = flugZustand({
      DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx',
    })
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'abgeschaltet')
  })

  test('globaler Zustand hängt nicht an einem Duffel-Token', () => {
    const ohneToken = flugZustand({ JETNITY_FLIGHT_AKTIV: 'true' })
    const mitLiveToken = flugZustand({
      JETNITY_FLIGHT_AKTIV: 'true',
      DUFFEL_ACCESS_TOKEN: 'duffel_live_xxxxxxxx',
    })
    assert.deepEqual(ohneToken, { aktiv: true, umgebung: 'test' })
    assert.deepEqual(mitLiveToken, { aktiv: true, umgebung: 'test' })
  })

  test('Preview darf die Test-Suche einschalten', () => {
    const zustand = flugZustand({
      VERCEL_ENV: 'preview',
      JETNITY_FLIGHT_AKTIV: 'true',
    })
    assert.deepEqual(zustand, { aktiv: true, umgebung: 'test' })
  })

  test('lokal ohne VERCEL_ENV darf die Test-Suche laufen', () => {
    assert.equal(flugZustand({ JETNITY_FLIGHT_AKTIV: 'true' }).aktiv, true)
  })

  test('flugZustand liest kein vendor-spezifisches Credential', () => {
    const quelle = readFileSync('lib/flights/zustand.ts', 'utf8')
    const funktion = quelle.slice(quelle.indexOf('export function flugZustand'))
    assert.doesNotMatch(funktion, /istDuffelTestToken|DUFFEL_ACCESS_TOKEN/)
    assert.match(funktion, /providerOpsIstProduction/)
    assert.match(funktion, /providerOpsFlagAn/)
  })
})
