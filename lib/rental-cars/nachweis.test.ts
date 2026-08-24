import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarInKontoUebernehmen } from '@/lib/rental-cars/konto-uebernahme'
import {
  rentalCarNachweisAusKatalog,
  rentalCarNachweisAusUmgebung,
  type RentalCarNachweisKontext,
} from '@/lib/rental-cars/nachweis'
import { rentalCarOptionLesen } from '@/lib/rental-cars/schema'

const KONTEXT: RentalCarNachweisKontext = {
  pickupName: 'Zürich Flughafen',
  dropoffName: 'Lugano Zentrum',
  pickupPlaceId: null,
  dropoffPlaceId: null,
  pickupOn: '2026-09-12',
  pickupAt: '09:00',
  dropoffOn: '2026-09-16',
  dropoffAt: '18:00',
  vehicleClass: 'compact',
  transmission: 'automatic',
  currency: 'CHF',
}

const OPTION = {
  id: 'compact-1',
  provider: 'test-rental',
  externalRef: 'europcar-compact-1',
  title: 'Kompakt Automatik',
  pickupName: 'Zürich Flughafen',
  dropoffName: 'Lugano Zentrum',
  pickupPlaceId: null,
  dropoffPlaceId: null,
  pickupOn: '2026-09-12',
  pickupAt: '09:00',
  dropoffOn: '2026-09-16',
  dropoffAt: '18:00',
  vehicleClass: 'compact' as const,
  transmission: 'automatic' as const,
  supplierName: 'Europcar',
  preis: 240,
  preisIstGesamt: true,
  preisWaehrung: 'CHF',
  kilometerRegel: 'unbegrenzt',
  tankRegel: 'full-to-full',
  storno: '24h vorher frei',
  kaution: 400,
  kautionWaehrung: 'CHF',
}

function nachweisMit(
  extra: {
    geaendert?: readonly string[]
    abgelaufen?: readonly string[]
    fehler?: Partial<Record<string, 'unavailable' | 'unbekannt' | 'abgelaufen' | 'geaendert' | 'invalid' | 'error'>>
    optionen?: Record<string, unknown>
  } = {},
) {
  return rentalCarNachweisAusKatalog({
    optionen: extra.optionen ?? { 'compact-1': OPTION },
    kontexte: { 'compact-1': KONTEXT },
    geaendert: extra.geaendert,
    abgelaufen: extra.abgelaufen,
    fehler: extra.fehler,
  })
}

describe('Mietwagen-Nachweis', () => {
  test('ohne Provider bleibt der Nachweis fail closed', () => {
    assert.equal(rentalCarNachweisAusUmgebung(), null)
  })

  test('eine gültige optionId mit passendem Kontext wird bestätigt', async () => {
    const ergebnis = await nachweisMit().nachweisen({ optionId: 'compact-1', kontext: KONTEXT })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.option.id, 'compact-1')
    assert.equal(ergebnis.option.preis, 240)
    assert.equal(ergebnis.option.vehicleClass, 'compact')
    assert.equal('booking_url' in ergebnis.option, false)
  })

  test('eine unbekannte optionId bleibt unbekannt', async () => {
    const ergebnis = await nachweisMit().nachweisen({ optionId: 'gibt-es-nicht', kontext: KONTEXT })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unbekannt')
  })

  test('booking_url aus Rohdaten wird nicht in die Option übernommen', () => {
    const gelesen = rentalCarOptionLesen({
      ...OPTION,
      booking_url: 'https://evil.example/book',
      access_token: 'secret',
    })
    assert.ok(gelesen)
    assert.equal('booking_url' in gelesen, false)
    assert.equal('access_token' in gelesen, false)
  })

  test('Kontext-Drift wird als geändert abgewiesen', async () => {
    const nachweis = nachweisMit()
    const station = await nachweis.nachweisen({
      optionId: 'compact-1',
      kontext: { ...KONTEXT, dropoffName: 'Mailand' },
    })
    const zeitraum = await nachweis.nachweisen({
      optionId: 'compact-1',
      kontext: { ...KONTEXT, dropoffOn: '2026-09-18' },
    })
    const klasse = await nachweis.nachweisen({
      optionId: 'compact-1',
      kontext: { ...KONTEXT, vehicleClass: 'suv' },
    })
    const waehrung = await nachweis.nachweisen({
      optionId: 'compact-1',
      kontext: { ...KONTEXT, currency: 'EUR' },
    })
    assert.equal(station.ok, false)
    assert.equal(zeitraum.ok, false)
    assert.equal(klasse.ok, false)
    assert.equal(waehrung.ok, false)
    if (station.ok || zeitraum.ok || klasse.ok || waehrung.ok) return
    assert.equal(station.art, 'geaendert')
    assert.equal(zeitraum.art, 'geaendert')
    assert.equal(klasse.art, 'geaendert')
    assert.equal(waehrung.art, 'geaendert')
  })

  test('unavailable und fehlender Adapter bleiben geschlossen', async () => {
    const unavailable = await nachweisMit({ fehler: { tot: 'unavailable' } }).nachweisen({
      optionId: 'tot',
      kontext: KONTEXT,
    })
    assert.equal(unavailable.ok, false)
    if (unavailable.ok) return
    assert.equal(unavailable.art, 'unavailable')
    assert.doesNotMatch(unavailable.message, /secret|token|key|api[_-]?key/i)

    const ohneAdapter = await rentalCarInKontoUebernehmen({
      tripId: '00000000-0000-0000-0000-000000000001',
      optionId: 'compact-1',
    })
    assert.equal(ohneAdapter.ok, false)
    if (ohneAdapter.ok) return
    assert.equal(ohneAdapter.art, 'unavailable')
    assert.match(ohneAdapter.message, /noch nicht/)
  })

  test('der Testkatalog ist nur injiziert und kein Umgebungsweg', () => {
    assert.equal(rentalCarNachweisAusUmgebung(), null)
    assert.notEqual(nachweisMit(), null)
  })
})
