import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilityInKontoUebernehmen } from '@/lib/mobility/konto-uebernahme'
import {
  mobilityNachweisAusKatalog,
  mobilityNachweisAusUmgebung,
  type MobilityNachweisKontext,
} from '@/lib/mobility/nachweis'
import { mobilityOptionLesen } from '@/lib/mobility/schema'
import { mobilitySucheStartetAutomatisch } from '@/lib/mobility/suche-ausloeser'

const KONTEXT: MobilityNachweisKontext = {
  originName: 'Zürich',
  destinationName: 'Lugano',
  originPlaceId: 'geonames:2657896',
  destinationPlaceId: 'geonames:2659836',
  date: '2026-09-12',
  mode: 'rail',
  travellers: 2,
  currency: 'CHF',
}

const OPTION = {
  id: 'ic-490',
  provider: 'test-rail',
  externalRef: 'sbb-ic-490',
  mode: 'rail' as const,
  title: 'Zürich → Lugano',
  originName: 'Zürich',
  destinationName: 'Lugano',
  originPlaceId: 'geonames:2657896',
  destinationPlaceId: 'geonames:2659836',
  startsOn: '2026-09-12',
  startsAt: '08:00',
  endsOn: '2026-09-12',
  endsAt: '10:00',
  durationMinutes: 120,
  changes: 0,
  preis: 44,
  preisWaehrung: 'CHF',
  stornierbar: true,
  connectionRef: 'IC 490',
  operatorName: 'SBB',
}

function nachweisMit(
  extra: {
    geaendert?: readonly string[]
    abgelaufen?: readonly string[]
    fehler?: Partial<Record<string, 'unavailable' | 'unbekannt' | 'abgelaufen' | 'geaendert' | 'invalid' | 'error'>>
    optionen?: Record<string, unknown>
  } = {},
) {
  return mobilityNachweisAusKatalog({
    optionen: extra.optionen ?? { 'ic-490': OPTION },
    kontexte: { 'ic-490': KONTEXT },
    geaendert: extra.geaendert,
    abgelaufen: extra.abgelaufen,
    fehler: extra.fehler,
  })
}

describe('Mobilitätsnachweis', () => {
  test('die Umgebung bleibt fail closed und startet keine Suche von selbst', () => {
    assert.equal(mobilityNachweisAusUmgebung(), null)
    assert.equal(mobilitySucheStartetAutomatisch(), false)
  })

  test('eine gültige optionId mit passendem Kontext wird bestätigt', async () => {
    const ergebnis = await nachweisMit().nachweisen({ optionId: 'ic-490', kontext: KONTEXT })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.option.id, 'ic-490')
    assert.equal(ergebnis.option.preis, 44)
    assert.equal('booking_url' in ergebnis.option, false)
    assert.equal('bookingUrl' in ergebnis.option, false)
  })

  test('eine unbekannte optionId bleibt unbekannt', async () => {
    const ergebnis = await nachweisMit().nachweisen({ optionId: 'gibt-es-nicht', kontext: KONTEXT })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unbekannt')
  })

  test('manipulierte Optionsdaten werden nicht als Nachweis gelesen', () => {
    const gelesen = mobilityOptionLesen({
      ...OPTION,
      preis: 1,
      provider: 'evil',
      booking_url: 'https://evil.example/book',
    })
    assert.ok(gelesen)
    assert.equal(gelesen.preis, 1)
    assert.equal('booking_url' in gelesen, false)
    assert.equal('bookingUrl' in gelesen, false)
  })

  test('Kontext-Drift wird als geändert abgewiesen', async () => {
    const nachweis = nachweisMit()
    const ziel = await nachweis.nachweisen({
      optionId: 'ic-490',
      kontext: { ...KONTEXT, destinationName: 'Mailand' },
    })
    const datum = await nachweis.nachweisen({
      optionId: 'ic-490',
      kontext: { ...KONTEXT, date: '2026-09-13' },
    })
    const reisende = await nachweis.nachweisen({
      optionId: 'ic-490',
      kontext: { ...KONTEXT, travellers: 4 },
    })
    const waehrung = await nachweis.nachweisen({
      optionId: 'ic-490',
      kontext: { ...KONTEXT, currency: 'EUR' },
    })
    assert.equal(ziel.ok, false)
    assert.equal(datum.ok, false)
    assert.equal(reisende.ok, false)
    assert.equal(waehrung.ok, false)
    if (ziel.ok || datum.ok || reisende.ok || waehrung.ok) return
    assert.equal(ziel.art, 'geaendert')
    assert.equal(datum.art, 'geaendert')
    assert.equal(reisende.art, 'geaendert')
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

    const ohneAdapter = await mobilityInKontoUebernehmen({
      tripId: '00000000-0000-0000-0000-000000000001',
      optionId: 'ic-490',
    })
    assert.equal(ohneAdapter.ok, false)
    if (ohneAdapter.ok) return
    assert.equal(ohneAdapter.art, 'unavailable')
  })

  test('eine ungültige Katalogoption wird nicht geadelt', async () => {
    const ergebnis = await nachweisMit({
      optionen: { 'ic-490': { id: 'ic-490', provider: 'test-rail' } },
    }).nachweisen({ optionId: 'ic-490', kontext: KONTEXT })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'invalid')
  })

  test('der Testkatalog ist nur injiziert und kein Umgebungsweg', () => {
    assert.equal(mobilityNachweisAusUmgebung(), null)
    assert.notEqual(nachweisMit(), null)
  })
})
