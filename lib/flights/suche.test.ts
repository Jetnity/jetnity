import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { ANTWORT_GEMISCHT } from '@/lib/flights/duffel/fixtures/angebote'
import { duffelAntwortMappen } from '@/lib/flights/duffel/mapping'
import { clientEnthaeltGeheimnis } from '@/lib/flights/client-sicht'
import { SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import { FlugProviderFehler, type FlugProvider } from '@/lib/flights/provider'
import { flugRateLeeren } from '@/lib/flights/rate-limit'
import { fluegeSuchen } from '@/lib/flights/suche'
import { flugZustand } from '@/lib/flights/zustand'

function providerMit(optionen = duffelAntwortMappen(ANTWORT_GEMISCHT).options): FlugProvider {
  return {
    id: 'test',
    async suchen() {
      return { options: optionen, partial: false }
    },
  }
}

describe('Flugsuche-Orchestrierung', () => {
  test('fehlende Credentials liefern unavailable, keinen Buildfehler', async () => {
    const { httpStatus, koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: flugZustand({ JETNITY_FLIGHT_AKTIV: 'true' }),
      provider: null,
      kennung: 'test-ohne-zugang',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'unavailable')
    assert.match(koerper.message, /nicht eingerichtet/)
    assert.equal(koerper.options.length, 0)
  })

  test('Production bleibt aus', async () => {
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: flugZustand({
        VERCEL_ENV: 'production',
        JETNITY_FLIGHT_AKTIV: 'true',
        DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxx',
      }),
      provider: providerMit(),
      kennung: 'test-prod',
    })
    assert.equal(koerper.status, 'unavailable')
    assert.match(koerper.message, /Production/)
  })

  test('Timeout und invalid bleiben kontrollierte Zustände', async () => {
    const timeout: FlugProvider = {
      id: 't',
      suchen: async () => {
        throw new FlugProviderFehler('timeout', 'Die Flugsuche hat zu lange gedauert.')
      },
    }
    const { koerper: zeit } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: timeout,
      kennung: 'test-timeout',
    })
    assert.equal(zeit.status, 'timeout')

    const invalid: FlugProvider = {
      id: 'i',
      suchen: async () => {
        throw new FlugProviderFehler('invalid', 'Die Flugdaten waren unbrauchbar.')
      },
    }
    const { koerper: kaputt } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: invalid,
      kennung: 'test-invalid',
    })
    assert.equal(kaputt.status, 'invalid')
  })

  test('eine gültige Suche liefert bewertete Optionen ohne Geheimnisse', async () => {
    flugRateLeeren()
    const { httpStatus, koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: providerMit(),
      kennung: 'test-ok',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'ok')
    assert.ok(koerper.options.length >= 2)
    assert.ok(koerper.options.some((option) => option.labels.includes('jetnity')))
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
    assert.equal('score' in koerper.options[0]!, false)
    assert.match(koerper.coverageNote, /nicht alle Airlines/i)
  })
})
