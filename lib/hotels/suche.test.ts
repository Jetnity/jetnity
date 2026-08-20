import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { clientEnthaeltGeheimnis } from '@/lib/hotels/client-sicht'
import type { HotelOption } from '@/lib/hotels/domain'
import { HotelProviderFehler, type HotelProvider } from '@/lib/hotels/provider'
import { hotelRateLeeren } from '@/lib/hotels/rate-limit'
import { hotelsSuchen } from '@/lib/hotels/suche'
import { hotelZustand } from '@/lib/hotels/zustand'

const EINGABE = {
  stage: {
    id: 'stage-1',
    name: 'Barcelona',
    placeId: 'geonames:3128760',
    latitude: 41.3874,
    longitude: 2.1686,
    arrivalDate: '2026-09-12',
    departureDate: '2026-09-16',
  },
  trip: {
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    interests: ['food'],
    pace: 'calm',
  },
  rooms: 1,
  children: 0,
  flights: [],
}

function option(teil: Partial<HotelOption> & Pick<HotelOption, 'id' | 'name' | 'preisGesamt'>): HotelOption {
  return {
    provider: 'test',
    externalRef: teil.id,
    punkt: { lat: 41.39, lon: 2.16 },
    quartierName: 'Eixample',
    adresse: null,
    sterne: 4,
    bewertung: 8.6,
    bewertungenAnzahl: 800,
    preisProNacht: Math.round(teil.preisGesamt / 4),
    preisWaehrung: 'CHF',
    steuernEnthalten: true,
    stornierbar: true,
    stornierungBis: null,
    fruehstueckEnthalten: null,
    zimmerName: null,
    ...teil,
  }
}

function providerMit(optionen: HotelOption[]): HotelProvider {
  return {
    id: 'test',
    async suchen() {
      return { options: optionen, partial: false }
    },
  }
}

describe('Hotelsuche-Orchestrierung', () => {
  test('fehlender Provider liefert unavailable und darf Quartier aus der Reise zeigen', async () => {
    const { httpStatus, koerper } = await hotelsSuchen(EINGABE, {
      zustand: hotelZustand({ JETNITY_HOTEL_AKTIV: 'true' }, false),
      provider: null,
      kennung: 'hotel-ohne-zugang',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'unavailable')
    assert.equal(koerper.options.length, 0)
    assert.equal(koerper.quartier?.name, 'Barcelona')
    assert.equal(koerper.evidenz.hatWegezeiten, false)
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
  })

  test('Production bleibt aus', async () => {
    const { koerper } = await hotelsSuchen(EINGABE, {
      zustand: hotelZustand(
        { VERCEL_ENV: 'production', JETNITY_HOTEL_AKTIV: 'true' },
        true,
      ),
      provider: providerMit([]),
      kennung: 'hotel-prod',
    })
    assert.equal(koerper.status, 'unavailable')
    assert.match(koerper.message, /Production/)
  })

  test('ungültige Eingabe fällt fail-closed', async () => {
    const { httpStatus, koerper } = await hotelsSuchen({ rooms: 99 }, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: providerMit([]),
      kennung: 'hotel-invalid',
    })
    assert.equal(httpStatus, 400)
    assert.equal(koerper.status, 'error')
    assert.equal(koerper.options.length, 0)
  })

  test('Timeout und empty bleiben kontrollierte Zustände', async () => {
    hotelRateLeeren()
    const timeout: HotelProvider = {
      id: 't',
      suchen: async () => {
        throw new HotelProviderFehler('timeout', 'Die Hotelsuche hat zu lange gedauert.')
      },
    }
    const { koerper: zeit } = await hotelsSuchen(EINGABE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: timeout,
      kennung: 'hotel-timeout',
    })
    assert.equal(zeit.status, 'timeout')

    hotelRateLeeren()
    const { koerper: leer } = await hotelsSuchen(EINGABE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: providerMit([]),
      kennung: 'hotel-empty',
    })
    assert.equal(leer.status, 'empty')
    assert.equal(leer.options.length, 0)
  })

  test('eine gültige Suche liefert bewertete Optionen ohne Geheimnisse', async () => {
    hotelRateLeeren()
    const { httpStatus, koerper } = await hotelsSuchen(EINGABE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: providerMit([
        option({ id: 'lage', name: 'Hotel Lage', preisGesamt: 780, punkt: { lat: 41.388, lon: 2.169 } }),
        option({ id: 'billig', name: 'Hotel Billig', preisGesamt: 420, punkt: { lat: 41.45, lon: 2.25 }, bewertung: 7.2 }),
      ]),
      kennung: 'hotel-ok',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'ok')
    assert.ok(koerper.options.length >= 2)
    assert.ok(koerper.options.some((eintrag) => eintrag.labels.includes('jetnity')))
    assert.equal(koerper.options.find((eintrag) => eintrag.labels.includes('jetnity'))?.id, 'lage')
    assert.equal('score' in koerper.options[0]!, false)
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
  })
})
