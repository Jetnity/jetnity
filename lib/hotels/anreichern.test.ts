import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { hotelKandidatenAnreichern } from '@/lib/hotels/anreichern'
import type { HotelOption, HotelSuchanfrage } from '@/lib/hotels/domain'

const ANFRAGE: HotelSuchanfrage = {
  destinationPlaceId: 'geonames:3128760',
  checkIn: '2026-09-12',
  checkOut: '2026-09-16',
  rooms: 1,
  adults: 2,
  children: 0,
  currency: 'CHF',
  quartier: {
    id: 'barcelona',
    name: 'Barcelona',
    zentrum: { lat: 41.3874, lon: 2.1686 },
  },
  preferences: {
    budgetProNachtMax: 220,
    mindestSterne: null,
    fruehstueckBevorzugt: null,
    stornierbarBevorzugt: null,
  },
}

const OPTION: HotelOption = {
  id: 'opt-1',
  provider: 'test',
  externalRef: 'ref-1',
  name: 'Hotel Test',
  punkt: { lat: 41.39, lon: 2.16 },
  quartierName: 'Eixample',
  adresse: null,
  sterne: 4,
  bewertung: 8.8,
  bewertungenAnzahl: 900,
  preisGesamt: 760,
  preisProNacht: 190,
  preisWaehrung: 'CHF',
  steuernEnthalten: true,
  stornierbar: true,
  stornierungBis: null,
  fruehstueckEnthalten: null,
  zimmerName: null,
}

describe('Hotel-Kontext anreichern', () => {
  test('erfindet keine Wegezeiten und kein Ruheprofil', () => {
    const [kandidat] = hotelKandidatenAnreichern([OPTION], ANFRAGE)
    assert.equal(kandidat?.context.taeglicheWegeMinuten, null)
    assert.equal(kandidat?.context.ruheScore, null)
    assert.equal(kandidat?.context.praeferenzFitScore, null)
    assert.equal(typeof kandidat?.context.quartierFitScore, 'number')
  })

  test('ohne Quartierzentrum bleibt der Fit unbekannt', () => {
    const [kandidat] = hotelKandidatenAnreichern([OPTION], { ...ANFRAGE, quartier: null })
    assert.equal(kandidat?.context.quartierFitScore, null)
  })
})
