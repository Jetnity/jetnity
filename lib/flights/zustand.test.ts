import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { flugUmgebungAusProzess, flugZustand, flugZustandMeldung } from '@/lib/flights/zustand'

describe('Flugzustand', () => {
  test('Production bleibt hart aus, auch mit Kill Switch', () => {
    const zustand = flugZustand({
      VERCEL_ENV: 'production',
      JETNITY_FLIGHT_AKTIV: 'true',
    })
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'production')
    assert.match(flugZustandMeldung(zustand), /Production/)
  })

  test('ohne Kill Switch bleibt die Suche aus', () => {
    const zustand = flugZustand({})
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'abgeschaltet')
  })

  test('globaler Zustand hängt nicht an einem Duffel-Token', () => {
    const ohneToken = flugZustand({ JETNITY_FLIGHT_AKTIV: 'true' })
    assert.deepEqual(ohneToken, { aktiv: true, umgebung: 'test' })
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

  test('globale Flug-Umgebung enthält und liest kein Anbieter-Credential', () => {
    const quelle = readFileSync('lib/flights/zustand.ts', 'utf8')
    assert.doesNotMatch(quelle, /DUFFEL_|ACCESS_TOKEN|istDuffelTestToken/)
    assert.match(quelle, /providerOpsIstProduction/)
    assert.match(quelle, /providerOpsFlagAn/)
    const umgebung = flugUmgebungAusProzess()
    assert.deepEqual(Object.keys(umgebung).sort(), ['JETNITY_FLIGHT_AKTIV', 'VERCEL_ENV'])
    assert.equal('DUFFEL_ACCESS_TOKEN' in umgebung, false)
  })
})
