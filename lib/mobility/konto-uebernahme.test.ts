import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilityKontoUebernahmePruefen, mobilityInKontoUebernehmen } from '@/lib/mobility/konto-uebernahme'
import { mobilityNachweisAusKatalog, type MobilityNachweisKontext } from '@/lib/mobility/nachweis'
import { mobilityKontoUebernahmeSchema } from '@/lib/mobility/schema'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

const KONTEXT: MobilityNachweisKontext = {
  originName: 'Zürich',
  destinationName: 'Florenz',
  originPlaceId: null,
  destinationPlaceId: null,
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
  title: 'Zürich → Florenz',
  originName: 'Zürich',
  destinationName: 'Florenz',
  originPlaceId: null,
  destinationPlaceId: null,
  startsOn: '2026-09-12',
  startsAt: '08:00',
  endsOn: '2026-09-12',
  endsAt: '14:10',
  durationMinutes: 370,
  changes: 1,
  preis: 89,
  preisWaehrung: 'CHF',
  stornierbar: true,
  connectionRef: 'EC 15',
  operatorName: 'SBB',
}

const SUCHE = {
  originName: KONTEXT.originName,
  destinationName: KONTEXT.destinationName,
  originPlaceId: KONTEXT.originPlaceId,
  destinationPlaceId: KONTEXT.destinationPlaceId,
  date: KONTEXT.date,
  mode: KONTEXT.mode,
} as const

function nachweisMit(
  extra: { geaendert?: readonly string[]; abgelaufen?: readonly string[] } = {},
) {
  return mobilityNachweisAusKatalog({
    optionen: { 'ic-490': OPTION },
    kontexte: { 'ic-490': KONTEXT },
    ...extra,
  })
}

const EINGABE = { tripId: 'trip-1', optionId: 'ic-490' }

describe('Konto-Mobilitätsübernahme', () => {
  test('ohne Nachweis wird keine kommerzielle Option gespeichert', async () => {
    const ergebnis = await mobilityKontoUebernahmePruefen(EINGABE, {
      nachweis: null,
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
  })

  test('ohne serverseitigen Suchkontext bleibt die Übernahme fail-closed', async () => {
    const ergebnis = await mobilityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: null,
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
  })

  test('eine vom Browser erfundene Option wird nicht übernommen', async () => {
    const ergebnis = await mobilityKontoUebernahmePruefen(
      { ...EINGABE, optionId: 'opt-erfunden' },
      { nachweis: nachweisMit(), reise: beispielreise(), suche: SUCHE },
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unbekannt')
  })

  test('manipulierte Browserfelder ändern die Momentaufnahme nicht', async () => {
    const geparst = mobilityKontoUebernahmeSchema.safeParse({
      tripId: '11111111-1111-4111-8111-111111111111',
      optionId: 'ic-490',
      option: { ...OPTION, preis: 1, provider: 'evil' },
      priceAmount: 1,
      provider: 'evil',
      booking_url: 'https://evil.example/book',
      access_token: 'secret',
    })
    assert.equal(geparst.success, true)
    if (!geparst.success) return
    assert.deepEqual(Object.keys(geparst.data).sort(), ['optionId', 'tripId'])
    assert.equal('option' in geparst.data, false)
    assert.equal('booking_url' in geparst.data, false)

    const ergebnis = await mobilityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.priceAmount, 89)
    assert.equal(ergebnis.aufnahme.provider, 'test-rail')
    assert.equal(ergebnis.aufnahme.externalRef, OPTION.externalRef)
    assert.equal(ergebnis.aufnahme.bookingUrl, null)
  })

  test('eine serverseitig vertrauenswürdige Auswahl wird als transfer abgebildet', async () => {
    const ergebnis = await mobilityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.kind, 'transfer')
    assert.equal(ergebnis.aufnahme.mobilityMode, 'rail')
    assert.equal(ergebnis.option.id, 'ic-490')
    assert.equal(ergebnis.aufnahme.bookingUrl, null)
  })

  test('Ort-, Datums- oder Währungsdrift wird abgewiesen', async () => {
    const ports = { nachweis: nachweisMit(), reise: beispielreise() }
    const ziel = await mobilityKontoUebernahmePruefen(EINGABE, {
      ...ports,
      suche: { ...SUCHE, destinationName: 'Rom' },
    })
    const waehrung = await mobilityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise({ currency: 'EUR' }),
      suche: SUCHE,
    })
    const reisende = await mobilityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise({ travellers: 4 }),
      suche: SUCHE,
    })
    assert.equal(ziel.ok, false)
    assert.equal(waehrung.ok, false)
    assert.equal(reisende.ok, false)
    if (ziel.ok || waehrung.ok || reisende.ok) return
    assert.equal(ziel.art, 'geaendert')
    assert.equal(waehrung.art, 'geaendert')
    assert.equal(reisende.art, 'geaendert')
  })

  test('eine fremde Reise wird abgewiesen', async () => {
    const ergebnis = await mobilityKontoUebernahmePruefen(
      { ...EINGABE, tripId: 'trip-fremd' },
      { nachweis: nachweisMit(), reise: beispielreise(), suche: SUCHE },
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'reise-fremd')
  })

  test('Preisänderung oder nicht mehr verfügbare Option werden abgelehnt', async () => {
    const nachweis = nachweisMit({ geaendert: ['opt-preis'], abgelaufen: ['opt-weg'] })
    const ports = { nachweis, reise: beispielreise(), suche: SUCHE }
    const preis = await mobilityKontoUebernahmePruefen({ ...EINGABE, optionId: 'opt-preis' }, ports)
    const weg = await mobilityKontoUebernahmePruefen({ ...EINGABE, optionId: 'opt-weg' }, ports)
    assert.equal(preis.ok, false)
    assert.equal(weg.ok, false)
    if (preis.ok || weg.ok) return
    assert.equal(preis.art, 'geaendert')
    assert.equal(weg.art, 'abgelaufen')
  })

  test('der Produktionsweg ohne Adapter bleibt fail-closed und erfindet keine booking_url', async () => {
    const ergebnis = await mobilityInKontoUebernehmen({
      tripId: '00000000-0000-0000-0000-000000000001',
      optionId: 'ic-490',
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
    assert.doesNotMatch(ergebnis.message, /secret|token|key|api[_-]?key/i)
  })
})
