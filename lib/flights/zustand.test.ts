import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { flugZustand, flugZustandMeldung } from '@/lib/flights/zustand'

const zugang = {
  JETNITY_FLIGHT_AKTIV: 'true',
  DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx',
}

describe('Flugzustand', () => {
  test('Production bleibt hart aus, auch mit Credentials', () => {
    const zustand = flugZustand({ ...zugang, VERCEL_ENV: 'production' })
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

  test('fehlende Credentials sind Feature-unavailable, kein Buildfehler', () => {
    const zustand = flugZustand({ JETNITY_FLIGHT_AKTIV: 'true' })
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'ohne-zugang')
    assert.match(flugZustandMeldung(zustand), /nicht eingerichtet/)
  })

  test('Preview darf die Test-Suche einschalten', () => {
    const zustand = flugZustand({ ...zugang, VERCEL_ENV: 'preview' })
    assert.deepEqual(zustand, { aktiv: true, umgebung: 'test' })
  })

  test('lokal ohne VERCEL_ENV darf die Test-Suche laufen', () => {
    assert.equal(flugZustand(zugang).aktiv, true)
  })

  test('ein Live-Token bleibt Feature-unavailable', () => {
    const zustand = flugZustand({
      JETNITY_FLIGHT_AKTIV: 'true',
      DUFFEL_ACCESS_TOKEN: 'duffel_live_xxxxxxxx',
    })
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'ohne-zugang')
  })
})
