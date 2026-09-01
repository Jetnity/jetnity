import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { OPTION_DIREKT, SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import type { FlugProvider } from '@/lib/flights/provider'
import {
  aktuelleFlugProviderSammlung,
  flugProviderSammlungAus,
} from '@/lib/flights/provider-sammlung'
import { flugRateLeeren } from '@/lib/flights/rate-limit'
import { fluegeSuchen, suchePortsAusUmgebung } from '@/lib/flights/suche'

function stubProvider(id: string): FlugProvider {
  return {
    id,
    async suchen() {
      return {
        options: [{ ...OPTION_DIREKT, id: `${id}:direkt`, provider: id, externalRef: `${id}:ref` }],
        partial: false,
        retrievedAt: '2026-08-31T12:00:00.000Z',
        airportTimezoneEvidence: [],
        airportEventInstantEvidence: [],
        airportEventInstantIssues: [],
      }
    },
  }
}

describe('Flug-Provider-Sammlung', () => {
  test('null und fehlende Kandidaten ergeben 0 Provider', () => {
    assert.deepEqual(flugProviderSammlungAus([]), [])
    assert.deepEqual(flugProviderSammlungAus([null, undefined]), [])
  })

  test('ein gültiger Provider bleibt unverändert und ohne Primary-Feld', () => {
    const alpha = stubProvider('alpha')
    const sammlung = flugProviderSammlungAus([null, alpha, undefined])
    assert.deepEqual(sammlung, [alpha])
    assert.equal('primary' in sammlung, false)
    assert.equal('default' in sammlung, false)
  })

  test('zwei verschiedene Provider bleiben beide erhalten, Reihenfolge ist kein Default', () => {
    const alpha = stubProvider('alpha')
    const beta = stubProvider('beta')
    const vorwaerts = flugProviderSammlungAus([alpha, beta])
    const rueckwaerts = flugProviderSammlungAus([beta, alpha])
    assert.deepEqual(vorwaerts.map((provider) => provider.id), ['alpha', 'beta'])
    assert.deepEqual(rueckwaerts.map((provider) => provider.id), ['beta', 'alpha'])
    assert.equal(vorwaerts[0]?.id === 'alpha', true)
    assert.notEqual(vorwaerts[0]?.id, rueckwaerts[0]?.id)
  })

  test('doppelte Provider-IDs werden vollständig verworfen, nicht auf das erste Element reduziert', () => {
    const alpha1 = stubProvider('alpha')
    const alpha2 = stubProvider('alpha')
    const beta = stubProvider('beta')
    assert.deepEqual(flugProviderSammlungAus([alpha1, alpha2]), [])
    assert.deepEqual(flugProviderSammlungAus([alpha1, beta, alpha2]).map((provider) => provider.id), [
      'beta',
    ])
  })

  test('leere Provider-IDs gelten nicht als konstruierbarer Provider', () => {
    assert.deepEqual(flugProviderSammlungAus([stubProvider('   ')]), [])
  })

  test('aktuelle Laufzeit-Sammlung bleibt ohne Token leer und kennt nur Duffel, wenn Test-Zugang da ist', () => {
    assert.deepEqual(aktuelleFlugProviderSammlung({ JETNITY_FLIGHT_AKTIV: 'true' }), [])
    const mitDuffel = aktuelleFlugProviderSammlung({
      JETNITY_FLIGHT_AKTIV: 'true',
      DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx',
    })
    assert.deepEqual(
      mitDuffel.map((provider) => provider.id),
      ['duffel'],
    )
    assert.equal(
      aktuelleFlugProviderSammlung({
        VERCEL_ENV: 'production',
        JETNITY_FLIGHT_AKTIV: 'true',
        DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx',
      }).length,
      0,
    )
    assert.deepEqual(
      aktuelleFlugProviderSammlung({
        JETNITY_FLIGHT_AKTIV: 'true',
        DUFFEL_ACCESS_TOKEN: 'duffel_live_xxxxxxxxxxxxxxxx',
      }),
      [],
    )
  })

  test('suchePortsAusUmgebung verdrahtet eine 0..N-Sammlung, keinen einzelnen Pflicht-Provider', () => {
    const leer = suchePortsAusUmgebung({ JETNITY_FLIGHT_AKTIV: 'true' }, [], 'k-leer')
    assert.deepEqual(leer.providers, [])
    const zwei = suchePortsAusUmgebung(
      { JETNITY_FLIGHT_AKTIV: 'true' },
      [stubProvider('alpha'), stubProvider('beta')],
      'k-zwei',
    )
    assert.deepEqual(
      zwei.providers.map((provider) => provider.id),
      ['alpha', 'beta'],
    )
    assert.equal('provider' in zwei, false)
  })

  test('nicht-Duffel-Stub ist strukturell aktiv ohne Duffel-Token; Production und 0 Provider bleiben geschlossen', async () => {
    flugRateLeeren()
    const ohneToken = suchePortsAusUmgebung(
      { JETNITY_FLIGHT_AKTIV: 'true' },
      [stubProvider('alpha')],
      'k-stub-ohne-duffel',
    )
    assert.equal(ohneToken.zustand.aktiv, true)
    assert.deepEqual(
      ohneToken.providers.map((provider) => provider.id),
      ['alpha'],
    )
    const gefunden = await fluegeSuchen(SUCHANFRAGE, ohneToken)
    assert.equal(gefunden.httpStatus, 200)
    assert.equal(gefunden.koerper.status, 'ok')
    assert.equal(gefunden.koerper.options[0]?.provider, 'alpha')

    const production = suchePortsAusUmgebung(
      {
        VERCEL_ENV: 'production',
        JETNITY_FLIGHT_AKTIV: 'true',
      },
      [stubProvider('alpha')],
      'k-stub-production',
    )
    assert.equal(production.zustand.aktiv, false)
    if (!production.zustand.aktiv) assert.equal(production.zustand.grund, 'production')
    const gesperrt = await fluegeSuchen(SUCHANFRAGE, production)
    assert.equal(gesperrt.koerper.status, 'unavailable')
    assert.match(gesperrt.koerper.message, /Production/)
    assert.equal(gesperrt.koerper.options.length, 0)

    const leer = suchePortsAusUmgebung({ JETNITY_FLIGHT_AKTIV: 'true' }, [], 'k-zero-ohne-duffel')
    assert.equal(leer.zustand.aktiv, true)
    assert.deepEqual(leer.providers, [])
    const unavailable = await fluegeSuchen(SUCHANFRAGE, leer)
    assert.equal(unavailable.koerper.status, 'unavailable')
    assert.match(unavailable.koerper.message, /nicht eingerichtet/)
    flugRateLeeren()
  })

  test('Route und Sammlung verdrahten 0..N ohne neuen Live-Provider und ohne KAYAK/Wego/Skyscanner', () => {
    const route = readFileSync('app/api/flights/search/route.ts', 'utf8')
    const sammlung = readFileSync('lib/flights/provider-sammlung.ts', 'utf8')
    assert.match(route, /aktuelleFlugProviderSammlung\(/)
    assert.doesNotMatch(route, /duffelProviderAus\(/)
    assert.match(sammlung, /duffelProviderAus\(/)
    assert.doesNotMatch(sammlung, /kayak|wego|skyscanner/i)
    assert.doesNotMatch(route, /kayak|wego|skyscanner/i)
    assert.match(sammlung, /Reihenfolge ist kein Default/)
  })
})
