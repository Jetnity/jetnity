import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ANTWORT_GEMISCHT } from '@/lib/flights/duffel/fixtures/angebote'
import { duffelAntwortMappen } from '@/lib/flights/duffel/mapping'
import { clientEnthaeltGeheimnis } from '@/lib/flights/client-sicht'
import { FLUG_SUCHE_GRENZEN, type FlugOption, type FlugSuchanfrage } from '@/lib/flights/domain'
import { OPTION_DIREKT, SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import {
  FlugProviderFehler,
  leereFlugAirportEventInstantEvidence,
  leereFlugAirportEventInstantIssues,
  leereFlugAirportTimezoneEvidence,
  type FlugAirportEventInstantEvidence,
  type FlugAirportEventInstantIssue,
  type FlugAirportTimezoneEvidence,
  type FlugProvider,
  type FlugProviderTreffer,
} from '@/lib/flights/provider'
import { flugRateLeeren } from '@/lib/flights/rate-limit'
import { fluegeSuchen } from '@/lib/flights/suche'
import { flugZustand } from '@/lib/flights/zustand'
import { PROVIDER_OPS_EVENT_FELDER, type ProviderOpsEvent } from '@/lib/provider-ops'

const TEST_RETRIEVED_AT = '2026-08-31T12:00:00.000Z'

function leererTreffer(optionen: FlugOption[], partial = false): FlugProviderTreffer {
  return {
    options: optionen,
    partial,
    retrievedAt: TEST_RETRIEVED_AT,
    airportTimezoneEvidence: leereFlugAirportTimezoneEvidence(),
    airportEventInstantEvidence: leereFlugAirportEventInstantEvidence(),
    airportEventInstantIssues: leereFlugAirportEventInstantIssues(),
  }
}

function providerMit(
  optionen = duffelAntwortMappen(ANTWORT_GEMISCHT).options,
  airportTimezoneEvidence: FlugAirportTimezoneEvidence[] = leereFlugAirportTimezoneEvidence(),
  airportEventInstantEvidence: FlugAirportEventInstantEvidence[] = leereFlugAirportEventInstantEvidence(),
  airportEventInstantIssues: FlugAirportEventInstantIssue[] = leereFlugAirportEventInstantIssues(),
  retrievedAt: string = TEST_RETRIEVED_AT,
  id = 'duffel',
): FlugProvider {
  return {
    id,
    async suchen() {
      return {
        options: optionen,
        partial: false,
        retrievedAt,
        airportTimezoneEvidence,
        airportEventInstantEvidence,
        airportEventInstantIssues,
      }
    },
  }
}

function providerId(
  id: string,
  suchen: FlugProvider['suchen'],
): FlugProvider {
  return { id, suchen }
}

function optionFuer(
  provider: string,
  id: string,
  extra: Partial<FlugOption> = {},
): FlugOption {
  return {
    ...OPTION_DIREKT,
    id,
    provider,
    externalRef: `${provider}:${id}`,
    ...extra,
  }
}

function eventSink() {
  const events: ProviderOpsEvent[] = []
  return {
    events,
    sink: {
      write(event: ProviderOpsEvent) {
        events.push(event)
      },
    },
  }
}

describe('Flugsuche-Orchestrierung', () => {
  test('fehlende Credentials liefern unavailable, keinen Buildfehler', async () => {
    const { httpStatus, koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: flugZustand({ JETNITY_FLIGHT_AKTIV: 'true' }),
      providers: [],
      kennung: 'test-ohne-zugang',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'unavailable')
    assert.match(koerper.message, /nicht eingerichtet/)
    assert.equal(koerper.options.length, 0)
  })

  test('zero providers bleiben kontrolliert unavailable', async () => {
    const beobachtung = eventSink()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [],
      kennung: 'test-zero-providers',
      eventSink: beobachtung.sink,
    })
    assert.equal(koerper.status, 'unavailable')
    assert.equal(koerper.options.length, 0)
    assert.deepEqual(
      beobachtung.events.map((event) => ({ providerId: event.providerId, outcome: event.outcome })),
      [{ providerId: null, outcome: 'unavailable' }],
    )
  })

  test('Production bleibt aus', async () => {
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: flugZustand({
        VERCEL_ENV: 'production',
        JETNITY_FLIGHT_AKTIV: 'true',
      }),
      providers: [providerMit()],
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
      providers: [timeout],
      kennung: 'test-timeout',
    })
    assert.equal(zeit.status, 'timeout')
    assert.equal(zeit.message, 'Die Flugsuche hat zu lange gedauert.')

    const invalid: FlugProvider = {
      id: 'i',
      suchen: async () => {
        throw new FlugProviderFehler('invalid', 'Die Flugdaten waren unbrauchbar.')
      },
    }
    const { koerper: kaputt } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [invalid],
      kennung: 'test-invalid',
    })
    assert.equal(kaputt.status, 'invalid')
    assert.equal(kaputt.message, 'Die Flugdaten waren unbrauchbar.')
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
      providers: [
        providerMit(gemappt.options, gemappt.airportTimezoneEvidence, [
          {
            optionId: gemappt.options[0]!.id,
            legIndex: 0,
            segmentIndex: 0,
            endpoint: 'departure',
            iata: 'ZRH',
            timeZone: 'Europe/Zurich',
            instant: '2026-11-01T08:15:00Z',
          },
        ]),
      ],
      kennung: 'test-timezone-no-leak',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'ok')
    assert.ok(koerper.options.length >= 1)
    const serialisiert = JSON.stringify(koerper)
    assert.equal(
      /time[_-]?zone|Timezone|airportTimezoneEvidence|airportEventInstant|Europe\/Zurich|Asia\/Bangkok|2026-11-01T08:15:00Z/i.test(
        serialisiert,
      ),
      false,
    )
    assert.equal(/retrievedAt|retrieved_at|observedAt|observed_at/.test(serialisiert), false)
    assert.equal(serialisiert.includes(TEST_RETRIEVED_AT), false)
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
    assert.equal(koerper.options[0]?.legs[0]?.segments[0]?.departureTime, '09:15')
    flugRateLeeren()
  })

  test('serialisierte FlugSucheAntwort enthält keinen Retrieval- oder Observation-Timestamp', async () => {
    flugRateLeeren()
    const { httpStatus, koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerMit(
          duffelAntwortMappen(ANTWORT_GEMISCHT).options,
          leereFlugAirportTimezoneEvidence(),
          leereFlugAirportEventInstantEvidence(),
          leereFlugAirportEventInstantIssues(),
          TEST_RETRIEVED_AT,
        ),
      ],
      kennung: 'test-retrieved-at-no-leak',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'ok')
    assert.ok(koerper.options.length >= 1)
    const serialisiert = JSON.stringify(koerper)
    assert.equal(serialisiert.includes('retrievedAt'), false)
    assert.equal(serialisiert.includes('retrieved_at'), false)
    assert.equal(serialisiert.includes('observedAt'), false)
    assert.equal(serialisiert.includes('observed_at'), false)
    assert.equal(serialisiert.includes(TEST_RETRIEVED_AT), false)
    assert.equal('retrievedAt' in koerper, false)
    assert.equal(
      koerper.options.every((option) => !('retrievedAt' in option) && !('observedAt' in option)),
      true,
    )
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
    flugRateLeeren()
  })

  test('eine gültige Suche liefert bewertete Optionen ohne Geheimnisse', async () => {
    flugRateLeeren()
    const { httpStatus, koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [providerMit()],
      kennung: 'test-ok',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'ok')
    assert.ok(koerper.options.length >= 2)
    assert.ok(koerper.options.some((option) => option.labels.includes('jetnity')))
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
    assert.equal('score' in koerper.options[0]!, false)
    assert.match(koerper.coverageNote, /nicht alle Airlines/i)
    assert.match(koerper.coverageNote, /aktuell angebundenen Flugquellen/)
    assert.doesNotMatch(koerper.coverageNote, /ersten Flugdaten-Adapter/)
    flugRateLeeren()
  })

  test('Rate-Limit liefert 429 und Retry-After', async () => {
    flugRateLeeren()
    const ports = {
      zustand: { aktiv: true, umgebung: 'test' } as const,
      providers: [providerMit()],
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

  test('zwei Provider zählen das Nutzer-Rate-Limit nur einmal je Jetnity-Suche', async () => {
    flugRateLeeren()
    let alphaAufrufe = 0
    let betaAufrufe = 0
    const ports = {
      zustand: { aktiv: true, umgebung: 'test' } as const,
      providers: [
        providerId('alpha', async () => {
          alphaAufrufe += 1
          return leererTreffer([optionFuer('alpha', 'alpha-1')])
        }),
        providerId('beta', async () => {
          betaAufrufe += 1
          return leererTreffer([optionFuer('beta', 'beta-1')])
        }),
      ],
      kennung: 'test-rate-multi',
    }
    for (let i = 0; i < 8; i += 1) {
      const erlaubt = await fluegeSuchen(SUCHANFRAGE, ports)
      assert.equal(erlaubt.httpStatus, 200)
    }
    assert.equal(alphaAufrufe, 8)
    assert.equal(betaAufrufe, 8)
    const begrenzt = await fluegeSuchen(SUCHANFRAGE, ports)
    assert.equal(begrenzt.httpStatus, 429)
    assert.equal(alphaAufrufe, 8)
    assert.equal(betaAufrufe, 8)
    flugRateLeeren()
  })

  test('Ranking und Client-Sicht erhalten nur kombinierte Optionen, keinen Composite-Treffer', () => {
    const suche = readFileSync('lib/flights/suche.ts', 'utf8')
    assert.match(suche, /optionenBewerten\(zusammen\.options, geprueft\.data\)/)
    assert.doesNotMatch(suche, /optionenBewerten\(treffer[,)]/)
    assert.doesNotMatch(suche, /sucheFuerClient\([\s\S]*retrievedAt/)
    assert.doesNotMatch(suche, /retrievedAt:\s/)
    assert.match(suche, /Kombiniert werden nur normalisierte FlugOption/)
    assert.match(suche, /FLUG_SUCHE_GRENZEN\.angebote/)
  })
})

describe('Flugsuche mit mehreren Providern', () => {
  test('zwei erfolgreiche Provider bleiben getrennt attribuierbar und werden gemeinsam rangiert', async () => {
    flugRateLeeren()
    const anfragen: FlugSuchanfrage[] = []
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async (anfrage) => {
          anfragen.push(anfrage)
          return leererTreffer([optionFuer('alpha', 'alpha-teuer', { priceAmount: 1200 })])
        }),
        providerId('beta', async (anfrage) => {
          anfragen.push(anfrage)
          return leererTreffer([optionFuer('beta', 'beta-guenstig', { priceAmount: 400 })])
        }),
      ],
      kennung: 'test-zwei-ok',
    })
    assert.equal(koerper.status, 'ok')
    assert.deepEqual(
      koerper.options.map((option) => option.id).sort(),
      ['alpha-teuer', 'beta-guenstig'],
    )
    assert.equal(koerper.options[0]?.id, 'beta-guenstig')
    assert.equal(koerper.options[0]?.provider, 'beta')
    assert.equal(koerper.options[0]?.externalRef, 'beta:beta-guenstig')
    assert.equal(koerper.options.some((option) => option.provider === 'alpha'), true)
    assert.equal(anfragen.length, 2)
    assert.deepEqual(anfragen[0], SUCHANFRAGE)
    assert.deepEqual(anfragen[1], SUCHANFRAGE)
    assert.equal(anfragen[0], anfragen[1])
    flugRateLeeren()
  })

  test('globale Kappung gilt erst nach dem gemeinsamen Ranking', async () => {
    flugRateLeeren()
    const teure = Array.from({ length: FLUG_SUCHE_GRENZEN.angebote }, (_, index) =>
      optionFuer('alpha', `alpha-${index}`, { priceAmount: 900 + index, durationMinutes: 800 }),
    )
    const guenstige = Array.from({ length: 5 }, (_, index) =>
      optionFuer('beta', `beta-${index}`, { priceAmount: 100 + index, durationMinutes: 700 }),
    )
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer(teure)),
        providerId('beta', async () => leererTreffer(guenstige)),
      ],
      kennung: 'test-global-cap',
    })
    assert.equal(koerper.options.length, FLUG_SUCHE_GRENZEN.angebote)
    assert.equal(koerper.options.filter((option) => option.provider === 'beta').length, 5)
    assert.equal(koerper.options[0]?.provider, 'beta')
    assert.equal(
      koerper.options.filter((option) => option.provider === 'alpha').length,
      FLUG_SUCHE_GRENZEN.angebote - 5,
    )
    flugRateLeeren()
  })

  test('ein Erfolg plus Timeout behält die guten Optionen als partial', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([optionFuer('alpha', 'alpha-ok')])),
        providerId('beta', async () => {
          throw new FlugProviderFehler('timeout', 'Die Flugsuche hat zu lange gedauert.')
        }),
      ],
      kennung: 'test-partial-timeout',
    })
    assert.equal(koerper.status, 'partial')
    assert.equal(
      koerper.message,
      'Einige Angebote konnten nicht gelesen werden. Die übrigen Verbindungen siehst du unten.',
    )
    assert.deepEqual(
      koerper.options.map((option) => ({ id: option.id, provider: option.provider })),
      [{ id: 'alpha-ok', provider: 'alpha' }],
    )
    flugRateLeeren()
  })

  test('ein provider-internes partial plus ein Erfolg bleibt aggregiert partial', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([optionFuer('alpha', 'alpha-teil')], true)),
        providerId('beta', async () => leererTreffer([optionFuer('beta', 'beta-ok')])),
      ],
      kennung: 'test-partial-plus-ok',
    })
    assert.equal(koerper.status, 'partial')
    assert.equal(koerper.options.length, 2)
    assert.equal(
      koerper.message,
      'Einige Angebote konnten nicht gelesen werden. Die übrigen Verbindungen siehst du unten.',
    )
    flugRateLeeren()
  })

  test('alle erfolgreichen Provider ohne Optionen bleiben empty', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([])),
        providerId('beta', async () => leererTreffer([])),
      ],
      kennung: 'test-all-empty',
    })
    assert.equal(koerper.status, 'empty')
    assert.equal(koerper.message, 'Keine passenden Verbindungen gefunden.')
    assert.equal(koerper.options.length, 0)
    flugRateLeeren()
  })

  test('leerer Erfolg plus Fehler ist partial ohne falsche Rest-Verbindungen', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([])),
        providerId('beta', async () => {
          throw new FlugProviderFehler('timeout', 'Die Flugsuche hat zu lange gedauert.')
        }),
      ],
      kennung: 'test-empty-success-plus-failure',
    })
    assert.equal(koerper.status, 'partial')
    assert.equal(koerper.options.length, 0)
    assert.doesNotMatch(koerper.message, /unten|übrigen Verbindungen/)
    assert.equal(
      koerper.message,
      'Einige Quellen konnten nicht vollständig geprüft werden. Aus den abgeschlossenen Quellen liegt aktuell keine nutzbare Verbindung vor.',
    )
    flugRateLeeren()
  })

  test('provider-internes partial ohne Optionen behauptet keine restlichen Verbindungen', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [providerId('alpha', async () => leererTreffer([], true))],
      kennung: 'test-internal-partial-empty',
    })
    assert.equal(koerper.status, 'partial')
    assert.equal(koerper.options.length, 0)
    assert.doesNotMatch(koerper.message, /unten|übrigen Verbindungen/)
    assert.equal(
      koerper.message,
      'Einige Quellen konnten nicht vollständig geprüft werden. Aus den abgeschlossenen Quellen liegt aktuell keine nutzbare Verbindung vor.',
    )
    flugRateLeeren()
  })

  test('zwei leere Erfolge, einer davon partial, bleiben wahrheitsgetreu ohne Rest-Verbindungen', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([], true)),
        providerId('beta', async () => leererTreffer([])),
      ],
      kennung: 'test-empty-partial-plus-empty',
    })
    assert.equal(koerper.status, 'partial')
    assert.equal(koerper.options.length, 0)
    assert.doesNotMatch(koerper.message, /unten|übrigen Verbindungen/)
    flugRateLeeren()
  })

  test('gleiche Fehlerklasse mehrerer Provider bleibt die kontrollierte Klasse', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => {
          throw new FlugProviderFehler('timeout', 'Alpha brauchte zu lange.')
        }),
        providerId('beta', async () => {
          throw new FlugProviderFehler('timeout', 'Beta brauchte zu lange.')
        }),
      ],
      kennung: 'test-same-class',
    })
    assert.equal(koerper.status, 'timeout')
    assert.equal(koerper.message, 'Die Flugsuche hat zu lange gedauert.')
    assert.doesNotMatch(koerper.message, /Alpha|Beta/)
    flugRateLeeren()
  })

  test('verschiedene Fehlerklassen werden nicht als eine spezifische Ursache verkauft', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => {
          throw new FlugProviderFehler('timeout', 'Die Flugsuche hat zu lange gedauert.')
        }),
        providerId('beta', async () => {
          throw new FlugProviderFehler('invalid', 'Die Flugdaten waren unbrauchbar.')
        }),
      ],
      kennung: 'test-mixed-fail',
    })
    assert.equal(koerper.status, 'error')
    assert.match(koerper.message, /nicht vollständig lesen/)
    assert.doesNotMatch(koerper.message, /zu lange gedauert|unbrauchbar/)
    flugRateLeeren()
  })

  test('eine Exception eines Providers verwirft nicht die Optionen des anderen', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => {
          throw new Error('boom')
        }),
        providerId('beta', async () => leererTreffer([optionFuer('beta', 'beta-survives')])),
      ],
      kennung: 'test-isolate-exception',
    })
    assert.equal(koerper.status, 'partial')
    assert.deepEqual(
      koerper.options.map((option) => option.id),
      ['beta-survives'],
    )
    flugRateLeeren()
  })

  test('gleiche Verbindungen zweier Provider werden nicht zusammengelegt', async () => {
    flugRateLeeren()
    const alpha = optionFuer('alpha', 'alpha-lx', {
      airline: 'LX',
      externalRef: 'alpha:lx180',
    })
    const beta = optionFuer('beta', 'beta-lx', {
      airline: 'LX',
      externalRef: 'beta:lx180',
      priceAmount: OPTION_DIREKT.priceAmount,
    })
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([alpha])),
        providerId('beta', async () => leererTreffer([beta])),
      ],
      kennung: 'test-no-dedupe',
    })
    assert.equal(koerper.options.length, 2)
    assert.deepEqual(
      koerper.options.map((option) => option.externalRef).sort(),
      ['alpha:lx180', 'beta:lx180'],
    )
    flugRateLeeren()
  })

  test('Array-Reihenfolge setzt keinen Default- oder Primary-Provider', async () => {
    flugRateLeeren()
    const alpha = providerId('alpha', async () =>
      leererTreffer([optionFuer('alpha', 'alpha-x', { priceAmount: 700 })]),
    )
    const beta = providerId('beta', async () =>
      leererTreffer([optionFuer('beta', 'beta-x', { priceAmount: 500 })]),
    )
    const vorwaerts = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [alpha, beta],
      kennung: 'test-order-a',
    })
    flugRateLeeren()
    const rueckwaerts = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [beta, alpha],
      kennung: 'test-order-b',
    })
    assert.deepEqual(
      vorwaerts.koerper.options.map((option) => option.id),
      rueckwaerts.koerper.options.map((option) => option.id),
    )
    assert.equal(vorwaerts.koerper.options[0]?.id, 'beta-x')
    assert.equal('primaryProvider' in vorwaerts.koerper, false)
    assert.equal('defaultProvider' in vorwaerts.koerper, false)
    flugRateLeeren()
  })

  test('Provider-Identitätsbruch und ID-Kollision sind fail-closed und deterministisch', async () => {
    flugRateLeeren()
    const mismatch = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([optionFuer('fremd', 'alpha-x')])),
      ],
      kennung: 'test-mismatch',
    })
    assert.equal(mismatch.koerper.status, 'invalid')
    assert.equal(mismatch.koerper.options.length, 0)

    const kollisionMitDrittem = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([optionFuer('alpha', 'kollision')])),
        providerId('beta', async () => leererTreffer([optionFuer('beta', 'kollision')])),
        providerId('gamma', async () => leererTreffer([optionFuer('gamma', 'gamma-ok')])),
      ],
      kennung: 'test-collision',
    })
    assert.equal(kollisionMitDrittem.koerper.status, 'partial')
    assert.deepEqual(
      kollisionMitDrittem.koerper.options.map((option) => ({
        id: option.id,
        provider: option.provider,
      })),
      [{ id: 'gamma-ok', provider: 'gamma' }],
    )
    flugRateLeeren()
  })

  test('ProviderOps-Events sind provider-spezifisch und vor dem Aufruf providerlos', async () => {
    flugRateLeeren()
    const okSink = eventSink()
    await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [
        providerId('alpha', async () => leererTreffer([optionFuer('alpha', 'a1')])),
        providerId('beta', async () => {
          throw new FlugProviderFehler('timeout', 'Die Flugsuche hat zu lange gedauert.')
        }),
      ],
      kennung: 'test-ops-multi',
      eventSink: okSink.sink,
    })
    const nachAufruf = [...okSink.events].sort((a, b) =>
      String(a.providerId).localeCompare(String(b.providerId)),
    )
    assert.deepEqual(
      nachAufruf.map((event) => ({ providerId: event.providerId, outcome: event.outcome })),
      [
        { providerId: 'alpha', outcome: 'ok' },
        { providerId: 'beta', outcome: 'timeout' },
      ],
    )
    for (const event of nachAufruf) {
      assert.deepEqual(Object.keys(event).sort(), [...PROVIDER_OPS_EVENT_FELDER].sort())
      assert.equal('payload' in event, false)
      assert.equal('price' in event, false)
      assert.equal('email' in event, false)
    }

    const vorSink = eventSink()
    await fluegeSuchen({ legs: [] }, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [providerMit()],
      kennung: 'test-ops-invalid',
      eventSink: vorSink.sink,
    })
    assert.deepEqual(
      vorSink.events.map((event) => ({ providerId: event.providerId, outcome: event.outcome })),
      [{ providerId: null, outcome: 'invalid' }],
    )

    flugRateLeeren()
    const rateSink = eventSink()
    const ports = {
      zustand: { aktiv: true, umgebung: 'test' } as const,
      providers: [providerMit()],
      kennung: 'test-ops-rate',
      eventSink: rateSink.sink,
    }
    for (let i = 0; i < 8; i += 1) {
      await fluegeSuchen(SUCHANFRAGE, ports)
    }
    rateSink.events.length = 0
    await fluegeSuchen(SUCHANFRAGE, ports)
    assert.deepEqual(
      rateSink.events.map((event) => ({ providerId: event.providerId, outcome: event.outcome })),
      [{ providerId: null, outcome: 'rate_limited' }],
    )
    flugRateLeeren()
  })

  test('Observability-Fehler ändert die Suche nicht', async () => {
    flugRateLeeren()
    const { koerper } = await fluegeSuchen(SUCHANFRAGE, {
      zustand: { aktiv: true, umgebung: 'test' },
      providers: [providerId('alpha', async () => leererTreffer([optionFuer('alpha', 'a1')]))],
      kennung: 'test-ops-throw',
      eventSink: {
        write() {
          throw new Error('sink down')
        },
      },
    })
    assert.equal(koerper.status, 'ok')
    assert.equal(koerper.options[0]?.id, 'a1')
    flugRateLeeren()
  })
})
