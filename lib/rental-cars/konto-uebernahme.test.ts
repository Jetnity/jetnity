import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarKontoUebernahmePruefen, rentalCarInKontoUebernehmen } from '@/lib/rental-cars/konto-uebernahme'
import { rentalCarNachweisAusKatalog, type RentalCarNachweisKontext } from '@/lib/rental-cars/nachweis'
import { rentalCarKontoUebernahmeSchema } from '@/lib/rental-cars/schema'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

const KONTEXT: RentalCarNachweisKontext = {
  pickupName: 'Zürich Flughafen',
  dropoffName: 'Florenz Zentrum',
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
  dropoffName: 'Florenz Zentrum',
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

const SUCHE = {
  pickupName: KONTEXT.pickupName,
  dropoffName: KONTEXT.dropoffName,
  pickupPlaceId: KONTEXT.pickupPlaceId,
  dropoffPlaceId: KONTEXT.dropoffPlaceId,
  pickupOn: KONTEXT.pickupOn,
  pickupAt: KONTEXT.pickupAt,
  dropoffOn: KONTEXT.dropoffOn,
  dropoffAt: KONTEXT.dropoffAt,
  vehicleClass: KONTEXT.vehicleClass,
  transmission: KONTEXT.transmission,
} as const

function nachweisMit(
  extra: { geaendert?: readonly string[]; abgelaufen?: readonly string[] } = {},
) {
  return rentalCarNachweisAusKatalog({
    optionen: { 'compact-1': OPTION },
    kontexte: { 'compact-1': KONTEXT },
    ...extra,
  })
}

const EINGABE = { tripId: 'trip-1', optionId: 'compact-1' }

describe('Konto-Mietwagenübernahme', () => {
  test('ohne Nachweis wird keine kommerzielle Option gespeichert', async () => {
    const ergebnis = await rentalCarKontoUebernahmePruefen(EINGABE, {
      nachweis: null,
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
  })

  test('ohne serverseitigen Suchkontext bleibt die Übernahme fail-closed', async () => {
    const ergebnis = await rentalCarKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: null,
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
  })

  test('eine vom Browser erfundene Option wird nicht übernommen', async () => {
    const ergebnis = await rentalCarKontoUebernahmePruefen(
      { ...EINGABE, optionId: 'opt-erfunden' },
      { nachweis: nachweisMit(), reise: beispielreise(), suche: SUCHE },
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unbekannt')
  })

  test('manipulierte Browserfelder ändern die Momentaufnahme nicht', async () => {
    const geparst = rentalCarKontoUebernahmeSchema.safeParse({
      tripId: '11111111-1111-4111-8111-111111111111',
      optionId: 'compact-1',
      option: { ...OPTION, preis: 1, provider: 'evil' },
      priceAmount: 1,
      provider: 'evil',
      booking_url: 'https://evil.example/book',
      access_token: 'secret',
    })
    assert.equal(geparst.success, true)
    if (!geparst.success) return
    assert.deepEqual(Object.keys(geparst.data).sort(), ['optionId', 'tripId'])

    const ergebnis = await rentalCarKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.priceAmount, 240)
    assert.equal(ergebnis.aufnahme.provider, 'test-rental')
    assert.equal(ergebnis.aufnahme.rentalSupplier, 'Europcar')
    assert.equal(ergebnis.aufnahme.kind, 'rental_car')
    assert.equal(ergebnis.aufnahme.bookingUrl, null)
  })

  test('Stations- oder Währungsdrift wird abgewiesen', async () => {
    const station = await rentalCarKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: { ...SUCHE, dropoffName: 'Rom' },
    })
    const waehrung = await rentalCarKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise({ currency: 'EUR' }),
      suche: SUCHE,
    })
    assert.equal(station.ok, false)
    assert.equal(waehrung.ok, false)
    if (station.ok || waehrung.ok) return
    assert.equal(station.art, 'geaendert')
    assert.equal(waehrung.art, 'geaendert')
  })

  test('eine fremde Reise wird abgewiesen', async () => {
    const ergebnis = await rentalCarKontoUebernahmePruefen(
      { ...EINGABE, tripId: 'trip-fremd' },
      { nachweis: nachweisMit(), reise: beispielreise(), suche: SUCHE },
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'reise-fremd')
  })

  test('der Produktionsweg ohne Adapter bleibt fail-closed', async () => {
    const ergebnis = await rentalCarInKontoUebernehmen({
      tripId: '00000000-0000-0000-0000-000000000001',
      optionId: 'compact-1',
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
    assert.doesNotMatch(ergebnis.message, /secret|token|key|api[_-]?key/i)
  })
})
