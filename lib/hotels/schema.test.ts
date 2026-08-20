import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ersteHotelmeldung,
  hotelOptionLesen,
  hotelSucheEingabeLesen,
  hotelSucheEingabeSchema,
  hotelSuchanfrageLesen,
} from '@/lib/hotels/schema'

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
    currency: 'chf',
    budgetAmount: 3500,
    interests: ['food'],
    pace: 'calm',
  },
  rooms: 1,
  children: 0,
  flights: [],
}

describe('Hotel-Suchanfrage', () => {
  test('eine gültige Anfrage kommt durch und normiert die Währung', () => {
    const gelesen = hotelSucheEingabeLesen(EINGABE)
    assert.equal(gelesen?.trip.currency, 'CHF')
    assert.equal(gelesen?.stage.placeId, 'geonames:3128760')
  })

  test('zu viele Zimmer werden abgelehnt', () => {
    assert.equal(hotelSucheEingabeSchema.safeParse({ ...EINGABE, rooms: 9 }).success, false)
  })

  test('ein erfundenes Datum fällt fail-closed', () => {
    const ergebnis = hotelSucheEingabeSchema.safeParse({
      ...EINGABE,
      stage: { ...EINGABE.stage, arrivalDate: '2026-02-30' },
    })
    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) assert.match(ersteHotelmeldung(ergebnis.error), /Datum/)
  })

  test('Wegezeiten aus dem Client sind kein akzeptiertes Feld', () => {
    const gelesen = hotelSucheEingabeLesen({
      ...EINGABE,
      taeglicheWegeMinuten: 12,
      quartier: { name: 'Eixample', taeglicheWegeMinuten: 8 },
    })
    assert.ok(gelesen)
    assert.equal('taeglicheWegeMinuten' in gelesen, false)
  })

  test('Check-out vor Check-in wird für die Providersuche abgelehnt', () => {
    assert.equal(
      hotelSuchanfrageLesen({
        destinationPlaceId: 'geonames:3128760',
        checkIn: '2026-09-16',
        checkOut: '2026-09-12',
        rooms: 1,
        adults: 2,
        children: 0,
        currency: 'CHF',
        quartier: null,
        preferences: {
          budgetProNachtMax: null,
          mindestSterne: null,
          fruehstueckBevorzugt: null,
          stornierbarBevorzugt: null,
        },
      }),
      null,
    )
  })
})

describe('Hoteloption', () => {
  test('eine vollständige Option wird gelesen, Rohfelder nicht', () => {
    const gelesen = hotelOptionLesen({
      id: 'opt-1',
      provider: 'test',
      externalRef: 'ref-1',
      name: 'Hotel Test',
      punkt: { lat: 41.39, lon: 2.16 },
      quartierName: 'Eixample',
      adresse: 'Carrer de Provença 1',
      sterne: 4,
      bewertung: 8.7,
      bewertungenAnzahl: 1100,
      preisGesamt: 760,
      preisProNacht: 190,
      preisWaehrung: 'chf',
      steuernEnthalten: true,
      stornierbar: true,
      stornierungBis: null,
      fruehstueckEnthalten: null,
      zimmerName: null,
      score: 88,
      access_token: 'secret',
    })
    assert.equal(gelesen?.preisWaehrung, 'CHF')
    assert.equal(gelesen && 'score' in gelesen, false)
    assert.equal(gelesen && 'access_token' in gelesen, false)
  })

  test('ohne Preis fällt die Option fail-closed', () => {
    assert.equal(
      hotelOptionLesen({
        id: 'opt-2',
        provider: 'test',
        externalRef: 'ref-2',
        name: 'Hotel Ohne Preis',
        punkt: { lat: 41.39, lon: 2.16 },
      }),
      null,
    )
  })
})
