import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { ANTWORT_GEMISCHT } from '@/lib/flights/duffel/fixtures/angebote'
import { duffelAntwortMappen } from '@/lib/flights/duffel/mapping'
import { clientEnthaeltGeheimnis } from '@/lib/flights/client-sicht'
import { SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import {
  FlugProviderFehler,
  leereFlugAirportTimezoneEvidence,
  type FlugAirportTimezoneEvidence,
  type FlugProvider,
} from '@/lib/flights/provider'
import { flugRateLeeren } from '@/lib/flights/rate-limit'
import { fluegeSuchen } from '@/lib/flights/suche'
import { flugZustand } from '@/lib/flights/zustand'

function providerMit(
  optionen = duffelAntwortMappen(ANTWORT_GEMISCHT).options,
  airportTimezoneEvidence: FlugAirportTimezoneEvidence[] = leereFlugAirportTimezoneEvidence(),
): FlugProvider {
  return {
    id: 'test',
    async suchen() {
      return { options: optionen, partial: false, airportTimezoneEvidence }
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

  test('Timezone-Evidence aus dem Provider erreicht die Browser-Antwort nicht', async () => {
    flugRateLeeren()
    const gemappt = duffelAntwortMappen({
      data: {
        offers: [
          {
            ...ANTWORT_GEMISCHT.data.offers[0],
            slices: [
              {
                ...ANTWORT_GEMISCHT.data.offers[0]!.slices[0],
                segments: [
                  {
                    ...ANTWORT_GEMISCHT.data.offers[0]!.slices[0]!.segments[0],
                    origin: { iata_code: 'ZRH', time_zone: 'Europe/Zurich' },
                    destination: { iata_code: 'BKK', time_zone: 'Asia/Bangkok' },
                  },
                ],
              },
            ],
          },
        ],
      },
    })
    assert.ok(gemappt.airportTimezoneEvidence.length >= 2)
    const { httpStatus, koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: providerMit(gemappt.options, gemappt.airportTimezoneEvidence),
      kennung: 'test-timezone-no-leak',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'ok')
    assert.ok(koerper.options.length >= 1)
    const serialisiert = JSON.stringify(koerper)
    assert.equal(/time[_-]?zone|Timezone|airportTimezoneEvidence|Europe\/Zurich|Asia\/Bangkok/i.test(serialisiert), false)
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
    assert.equal(koerper.options[0]?.legs[0]?.segments[0]?.departureTime, '09:15')
    flugRateLeeren()
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

  test('Rate-Limit liefert 429 und Retry-After', async () => {
    flugRateLeeren()
    const ports = {
      zustand: { aktiv: true, umgebung: 'test' } as const,
      provider: providerMit(),
      kennung: 'test-rate',
    }
    for (let i = 0; i < 8; i += 1) {
      const erlaubt = await fluegeSuchen(SUCHANFRAGE, ports)
      assert.equal(erlaubt.httpStatus, 200)
    }
    const begrenzt = await fluegeSuchen(SUCHANFRAGE, ports)
    assert.equal(begrenzt.httpStatus, 429)
    assert.equal(begrenzt.koerper.status, 'rate_limited')
    assert.ok((begrenzt.retryAfterSec ?? 0) >= 1)
    flugRateLeeren()
  })
})
