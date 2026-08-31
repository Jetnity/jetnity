import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { duffelAdapter, type DuffelAdapterUhr } from '@/lib/flights/duffel/adapter'
import { ANGEBOT_DIREKT, ANTWORT_GEMISCHT, ANTWORT_NUR_MUELL } from '@/lib/flights/duffel/fixtures/angebote'
import { FLUG_SUCHE_GRENZEN } from '@/lib/flights/domain'
import { SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import { FlugProviderFehler } from '@/lib/flights/provider'

const FESTE_UHRZEIT = '2026-08-31T15:04:05.123Z'
const FESTE_UHR: DuffelAdapterUhr = () => new Date(FESTE_UHRZEIT)
const PAYLOAD_RETRIEVED_AT = '1999-01-01T00:00:00.000Z'
const PAYLOAD_RETRIEVED_AT_SNAKE = '1999-01-02T00:00:00.000Z'
const PAYLOAD_OBSERVED_AT = '1999-01-03T00:00:00.000Z'
const PAYLOAD_OBSERVED_AT_SNAKE = '1999-01-04T00:00:00.000Z'

function httpMit(antworten: Array<{ ok: boolean; status: number; body: unknown }>) {
  const rest = [...antworten]
  const gesendet: Array<{ url: string; body: string }> = []
  return {
    gesendet,
    async post(url: string, init: { body: string }) {
      gesendet.push({ url, body: init.body })
      const naechste = rest.shift()
      if (!naechste) throw new Error('kein weiterer Aufruf erwartet')
      return {
        ok: naechste.ok,
        status: naechste.status,
        json: async () => naechste.body,
      }
    },
  }
}

describe('Duffel-Adapter', () => {
  test('mappt eine gültige Suche ohne echten Netzaufruf', async () => {
    const http = httpMit([{ ok: true, status: 201, body: ANTWORT_GEMISCHT }])
    const adapter = duffelAdapter('duffel_test_xxxxxxxx', http, FESTE_UHR)
    const treffer = await adapter.suchen(SUCHANFRAGE)
    assert.equal(treffer.options.length, 3)
    assert.equal(treffer.partial, false)
    assert.equal(treffer.options[0]?.provider, 'duffel')
    assert.equal(treffer.retrievedAt, FESTE_UHRZEIT)
    assert.match(treffer.retrievedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    assert.deepEqual(treffer.airportTimezoneEvidence, [])
    assert.deepEqual(treffer.airportEventInstantEvidence, [])
    assert.deepEqual(treffer.airportEventInstantIssues, [])
    const koerper = JSON.parse(http.gesendet[0]!.body) as {
      data: { passengers: Array<Record<string, string>>; slices: unknown[] }
    }
    assert.equal(koerper.data.slices.length, 1)
    assert.equal(
      koerper.data.passengers.every((eintrag) => eintrag.type === 'adult' && !eintrag.given_name && !eintrag.born_on),
      true,
    )
    assert.match(http.gesendet[0]!.url, /offer_requests/)
    assert.equal(/orders/.test(http.gesendet[0]!.url), false)
  })

  test('trägt strukturierte time_zone nur als Companion-Evidence, nicht in der Option', async () => {
    const angebot = {
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
    }
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: true, status: 201, body: { data: { offers: [angebot] } } }]),
      FESTE_UHR,
    )
    const treffer = await adapter.suchen(SUCHANFRAGE)
    assert.equal(treffer.options.length, 1)
    assert.equal(treffer.retrievedAt, FESTE_UHRZEIT)
    assert.deepEqual(
      treffer.airportTimezoneEvidence.map((eintrag) => [eintrag.endpoint, eintrag.iata, eintrag.timeZone]),
      [
        ['departure', 'ZRH', 'Europe/Zurich'],
        ['arrival', 'BKK', 'Asia/Bangkok'],
      ],
    )
    assert.equal(treffer.airportTimezoneEvidence[0]?.optionId, treffer.options[0]?.id)
    assert.equal(/time[_-]?zone|Timezone/i.test(JSON.stringify(treffer.options)), false)
    assert.deepEqual(
      treffer.airportEventInstantEvidence.map((eintrag) => [eintrag.endpoint, eintrag.iata, eintrag.instant]),
      [
        ['departure', 'ZRH', '2026-11-01T08:15:00Z'],
        ['arrival', 'BKK', '2026-11-01T16:45:00Z'],
      ],
    )
    assert.deepEqual(treffer.airportEventInstantIssues, [])
    assert.equal(treffer.options[0]?.priceAmount, 892.5)
  })

  test('unauflösbarer Instant verwirft kein sonst gültiges Offer', async () => {
    const angebot = {
      ...ANTWORT_GEMISCHT.data.offers[0],
      slices: [
        {
          ...ANTWORT_GEMISCHT.data.offers[0]!.slices[0],
          segments: [
            {
              ...ANTWORT_GEMISCHT.data.offers[0]!.slices[0]!.segments[0],
              departing_at: '2026-03-29T02:30:00',
              origin: { iata_code: 'ZRH', time_zone: 'Europe/Zurich' },
              destination: { iata_code: 'BKK', time_zone: 'Asia/Bangkok' },
            },
          ],
        },
      ],
    }
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: true, status: 201, body: { data: { offers: [angebot] } } }]),
      FESTE_UHR,
    )
    const treffer = await adapter.suchen(SUCHANFRAGE)
    assert.equal(treffer.options.length, 1)
    assert.equal(treffer.options[0]?.priceAmount, 892.5)
    assert.equal(treffer.retrievedAt, FESTE_UHRZEIT)
    assert.equal(treffer.airportTimezoneEvidence.length, 2)
    assert.equal(
      treffer.airportEventInstantIssues.some((eintrag) => eintrag.issue === 'nonexistent_local_time'),
      true,
    )
    assert.equal(
      treffer.airportEventInstantEvidence.some((eintrag) => eintrag.endpoint === 'departure'),
      false,
    )
    assert.equal(
      treffer.airportEventInstantEvidence.some((eintrag) => eintrag.endpoint === 'arrival'),
      true,
    )
  })

  test('Angebots-Cap entfernt Timezone- und Event-Instant-Evidence verworfener Optionen', async () => {
    const angebote = Array.from({ length: FLUG_SUCHE_GRENZEN.angebote + 1 }, (_, index) => ({
      ...ANGEBOT_DIREKT,
      id: `off_cap_${index}`,
      total_amount: `${800 + index}.00`,
      slices: [
        {
          ...ANGEBOT_DIREKT.slices[0],
          segments: [
            {
              ...ANGEBOT_DIREKT.slices[0]!.segments[0],
              origin: { iata_code: 'ZRH', time_zone: 'Europe/Zurich' },
              destination: { iata_code: 'BKK', time_zone: 'Asia/Bangkok' },
            },
          ],
        },
      ],
    }))
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: true, status: 201, body: { data: { offers: angebote } } }]),
      FESTE_UHR,
    )
    const treffer = await adapter.suchen(SUCHANFRAGE)
    assert.equal(treffer.options.length, FLUG_SUCHE_GRENZEN.angebote)
    assert.equal(treffer.retrievedAt, FESTE_UHRZEIT)
    const behalteneIds = new Set(treffer.options.map((option) => option.id))
    assert.equal(behalteneIds.size, FLUG_SUCHE_GRENZEN.angebote)
    assert.equal(treffer.airportTimezoneEvidence.length, FLUG_SUCHE_GRENZEN.angebote * 2)
    assert.equal(treffer.airportEventInstantEvidence.length, FLUG_SUCHE_GRENZEN.angebote * 2)
    assert.equal(
      treffer.airportTimezoneEvidence.every((eintrag) => behalteneIds.has(eintrag.optionId)),
      true,
    )
    assert.equal(
      treffer.airportEventInstantEvidence.every((eintrag) => behalteneIds.has(eintrag.optionId)),
      true,
    )
    assert.equal(treffer.airportEventInstantIssues.length, 0)
  })

  test('eine unbrauchbare Antwort wird invalid', async () => {
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: true, status: 201, body: ANTWORT_NUR_MUELL }]),
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'invalid')
      return true
    })
  })

  test('HTTP 500 wird error, ohne Token in der Meldung', async () => {
    const adapter = duffelAdapter(
      'duffel_test_super-secret',
      httpMit([{ ok: false, status: 500, body: { errors: [{ message: 'boom' }] } }]),
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'error')
      assert.equal(/secret|duffel_test|token/i.test(fehler.message), false)
      return true
    })
  })

  test('HTTP 401 ist unavailable', async () => {
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: false, status: 401, body: { errors: [{ message: 'unauthorized' }] } }]),
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'unavailable')
      return true
    })
  })

  test('Timeout bleibt timeout', async () => {
    let ticks = 0
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      {
        async post() {
          const fehler = new Error('aborted')
          fehler.name = 'AbortError'
          throw fehler
        },
      },
      () => {
        ticks += 1
        return new Date(FESTE_UHRZEIT)
      },
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'timeout')
      return true
    })
    assert.equal(ticks, 0)
  })

  test('feste Test-Uhr erzeugt exakt kanonisches UTC-ISO mit Z', async () => {
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: true, status: 201, body: ANTWORT_GEMISCHT }]),
      FESTE_UHR,
    )
    const treffer = await adapter.suchen(SUCHANFRAGE)
    assert.equal(treffer.retrievedAt, '2026-08-31T15:04:05.123Z')
    assert.equal(treffer.retrievedAt.endsWith('Z'), true)
    assert.equal(treffer.retrievedAt.includes('+'), false)
    assert.equal(/retrievedAt|retrieved_at|observedAt|observed_at/.test(JSON.stringify(treffer.options)), false)
  })

  test('Provider-Payload-Timestamps ersetzen retrievedAt nicht', async () => {
    const body = {
      retrievedAt: PAYLOAD_RETRIEVED_AT,
      retrieved_at: PAYLOAD_RETRIEVED_AT_SNAKE,
      observedAt: PAYLOAD_OBSERVED_AT,
      observed_at: PAYLOAD_OBSERVED_AT_SNAKE,
      data: {
        retrievedAt: PAYLOAD_RETRIEVED_AT,
        retrieved_at: PAYLOAD_RETRIEVED_AT_SNAKE,
        observedAt: PAYLOAD_OBSERVED_AT,
        observed_at: PAYLOAD_OBSERVED_AT_SNAKE,
        offers: ANTWORT_GEMISCHT.data.offers.map((angebot) => ({
          ...angebot,
          retrievedAt: PAYLOAD_RETRIEVED_AT,
          retrieved_at: PAYLOAD_RETRIEVED_AT_SNAKE,
          observedAt: PAYLOAD_OBSERVED_AT,
          observed_at: PAYLOAD_OBSERVED_AT_SNAKE,
        })),
      },
    }
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: true, status: 201, body }]),
      FESTE_UHR,
    )
    const treffer = await adapter.suchen(SUCHANFRAGE)
    assert.equal(treffer.retrievedAt, FESTE_UHRZEIT)
    assert.notEqual(treffer.retrievedAt, PAYLOAD_RETRIEVED_AT)
    assert.notEqual(treffer.retrievedAt, PAYLOAD_RETRIEVED_AT_SNAKE)
    assert.notEqual(treffer.retrievedAt, PAYLOAD_OBSERVED_AT)
    assert.notEqual(treffer.retrievedAt, PAYLOAD_OBSERVED_AT_SNAKE)
    const optionenRoh = JSON.stringify(treffer.options)
    assert.equal(optionenRoh.includes(PAYLOAD_RETRIEVED_AT), false)
    assert.equal(optionenRoh.includes(PAYLOAD_RETRIEVED_AT_SNAKE), false)
    assert.equal(optionenRoh.includes(PAYLOAD_OBSERVED_AT), false)
    assert.equal(optionenRoh.includes(PAYLOAD_OBSERVED_AT_SNAKE), false)
  })

  test('HTTP 403 ist unavailable und ruft die Uhr nicht auf', async () => {
    let ticks = 0
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: false, status: 403, body: { errors: [{ message: 'forbidden' }] } }]),
      () => {
        ticks += 1
        return new Date(FESTE_UHRZEIT)
      },
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'unavailable')
      return true
    })
    assert.equal(ticks, 0)
  })

  test('HTTP 500 ruft die Uhr nicht auf', async () => {
    let ticks = 0
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: false, status: 500, body: { errors: [{ message: 'boom' }] } }]),
      () => {
        ticks += 1
        return new Date(FESTE_UHRZEIT)
      },
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'error')
      return true
    })
    assert.equal(ticks, 0)
  })

  test('HTTP 401 ruft die Uhr nicht auf', async () => {
    let ticks = 0
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: false, status: 401, body: { errors: [{ message: 'unauthorized' }] } }]),
      () => {
        ticks += 1
        return new Date(FESTE_UHRZEIT)
      },
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'unavailable')
      return true
    })
    assert.equal(ticks, 0)
  })

  test('unlesbares JSON liefert keinen Treffer und ruft die Uhr nicht auf', async () => {
    let ticks = 0
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      {
        async post() {
          return {
            ok: true,
            status: 201,
            json: async () => {
              throw new SyntaxError('Unexpected token')
            },
          }
        },
      },
      () => {
        ticks += 1
        return new Date(FESTE_UHRZEIT)
      },
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'invalid')
      return true
    })
    assert.equal(ticks, 0)
  })

  test('unbrauchbare Antwort liefert keinen Treffer trotz gelesener Uhr', async () => {
    let ticks = 0
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: true, status: 201, body: ANTWORT_NUR_MUELL }]),
      () => {
        ticks += 1
        return new Date(FESTE_UHRZEIT)
      },
    )
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'invalid')
      return true
    })
    assert.equal(ticks, 1)
  })

  test('Production-Default-Uhr erzeugt kanonisches UTC-ISO ohne Clock-Injection', async () => {
    const vorher = Date.now()
    const adapter = duffelAdapter(
      'duffel_test_xxxxxxxx',
      httpMit([{ ok: true, status: 201, body: ANTWORT_GEMISCHT }]),
    )
    const treffer = await adapter.suchen(SUCHANFRAGE)
    const nachher = Date.now()
    assert.match(treffer.retrievedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    const ms = Date.parse(treffer.retrievedAt)
    assert.equal(Number.isNaN(ms), false)
    assert.ok(ms >= vorher - 1000)
    assert.ok(ms <= nachher + 1000)
  })
})
