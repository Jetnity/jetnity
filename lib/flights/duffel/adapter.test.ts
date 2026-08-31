import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { duffelAdapter } from '@/lib/flights/duffel/adapter'
import { ANTWORT_GEMISCHT, ANTWORT_NUR_MUELL } from '@/lib/flights/duffel/fixtures/angebote'
import { SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import { FlugProviderFehler } from '@/lib/flights/provider'

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
    const adapter = duffelAdapter('duffel_test_xxxxxxxx', http)
    const treffer = await adapter.suchen(SUCHANFRAGE)
    assert.equal(treffer.options.length, 3)
    assert.equal(treffer.partial, false)
    assert.equal(treffer.options[0]?.provider, 'duffel')
    assert.deepEqual(treffer.airportTimezoneEvidence, [])
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
    )
    const treffer = await adapter.suchen(SUCHANFRAGE)
    assert.equal(treffer.options.length, 1)
    assert.deepEqual(
      treffer.airportTimezoneEvidence.map((eintrag) => [eintrag.endpoint, eintrag.iata, eintrag.timeZone]),
      [
        ['departure', 'ZRH', 'Europe/Zurich'],
        ['arrival', 'BKK', 'Asia/Bangkok'],
      ],
    )
    assert.equal(treffer.airportTimezoneEvidence[0]?.optionId, treffer.options[0]?.id)
    assert.equal(/time[_-]?zone|Timezone/i.test(JSON.stringify(treffer.options)), false)
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
    const adapter = duffelAdapter('duffel_test_xxxxxxxx', {
      async post() {
        const fehler = new Error('aborted')
        fehler.name = 'AbortError'
        throw fehler
      },
    })
    await assert.rejects(() => adapter.suchen(SUCHANFRAGE), (fehler: unknown) => {
      assert.ok(fehler instanceof FlugProviderFehler)
      assert.equal(fehler.art, 'timeout')
      return true
    })
  })
})
