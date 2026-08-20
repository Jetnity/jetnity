import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { hotelKontoUebernahmePruefen } from '@/lib/hotels/konto-uebernahme'
import { hotelNachweisAusKatalog } from '@/lib/hotels/nachweis'
import { hotelKontoUebernahmeSchema } from '@/lib/hotels/schema'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { HotelOption } from '@/lib/hotels/domain'

const OPTION: HotelOption = {
  id: 'opt-1',
  provider: 'test-hotel',
  externalRef: 'ref-77',
  name: 'Hotel Eixample',
  punkt: { lat: 41.39, lon: 2.16 },
  quartierName: 'Eixample',
  adresse: 'Carrer de Provença 1',
  sterne: 4,
  bewertung: 8.9,
  bewertungenAnzahl: 1400,
  preisGesamt: 760,
  preisProNacht: 190,
  preisWaehrung: 'CHF',
  steuernEnthalten: true,
  stornierbar: true,
  stornierungBis: '2026-08-30',
  fruehstueckEnthalten: true,
  zimmerName: 'Doppelzimmer',
}

const EINGABE = {
  tripId: 'trip-1',
  stageId: 'stage-1',
  dayId: 'day-1',
  optionId: 'opt-1',
}

describe('Konto-Hotelübernahme', () => {
  test('ohne Nachweis wird keine kommerzielle Option gespeichert', async () => {
    const ergebnis = await hotelKontoUebernahmePruefen(EINGABE, {
      nachweis: null,
      reise: beispielreise(),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
  })

  test('eine vom Browser erfundene Option mit fremdem Preis wird nicht übernommen', async () => {
    const nachweis = hotelNachweisAusKatalog({ optionen: { 'opt-1': OPTION } })
    const ergebnis = await hotelKontoUebernahmePruefen(
      {
        ...EINGABE,
        optionId: 'opt-erfunden',
      },
      { nachweis, reise: beispielreise() },
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unbekannt')
  })

  test('manipulierte Preise im Request ändern die persistierte Momentaufnahme nicht', async () => {
    const nachweis = hotelNachweisAusKatalog({ optionen: { 'opt-1': OPTION } })
    const geparst = hotelKontoUebernahmeSchema.safeParse({
      tripId: '11111111-1111-4111-8111-111111111111',
      stageId: '22222222-2222-4222-8222-222222222222',
      dayId: null,
      optionId: 'opt-1',
      option: { ...OPTION, preisGesamt: 1, provider: 'evil', externalRef: 'hack' },
      checkIn: '2020-01-01',
      checkOut: '2020-01-02',
    })
    assert.equal(geparst.success, true)
    if (!geparst.success) return
    assert.equal('option' in geparst.data, false)
    assert.equal('checkIn' in geparst.data, false)

    const ergebnis = await hotelKontoUebernahmePruefen(EINGABE, {
      nachweis,
      reise: beispielreise(),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.priceAmount, 760)
    assert.equal(ergebnis.aufnahme.provider, 'test-hotel')
    assert.equal(ergebnis.aufnahme.externalRef, 'ref-77')
    assert.equal(ergebnis.aufnahme.startsOn, '2026-09-12')
    assert.equal(ergebnis.aufnahme.endsOn, '2026-09-14')
    assert.equal(ergebnis.aufnahme.bookingUrl, null)
  })

  test('eine serverseitig vertrauenswürdige Auswahl wird als stay abgebildet', async () => {
    const ergebnis = await hotelKontoUebernahmePruefen(EINGABE, {
      nachweis: hotelNachweisAusKatalog({ optionen: { 'opt-1': OPTION } }),
      reise: beispielreise(),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.kind, 'stay')
    assert.equal(ergebnis.stageId, 'stage-1')
    assert.equal(ergebnis.dayId, 'day-1')
  })

  test('falsche Etappe, fremder Tag und fehlender Zeitraum werden abgewiesen', async () => {
    const ports = {
      nachweis: hotelNachweisAusKatalog({ optionen: { 'opt-1': OPTION } }),
      reise: beispielreise(),
    }
    const fremd = await hotelKontoUebernahmePruefen({ ...EINGABE, stageId: 'stage-fremd' }, ports)
    const andererTag = await hotelKontoUebernahmePruefen({ ...EINGABE, dayId: 'day-4' }, ports)
    assert.equal(fremd.ok, false)
    assert.equal(andererTag.ok, false)
    if (fremd.ok || andererTag.ok) return
    assert.equal(fremd.art, 'etappe-fremd')
    assert.equal(andererTag.art, 'tag-etappe')

    const ohneZeit = beispielreise({ startDate: null, endDate: null })
    ohneZeit.stages[0] = { ...ohneZeit.stages[0]!, arrivalDate: null, departureDate: null }
    const zeit = await hotelKontoUebernahmePruefen(
      { ...EINGABE, dayId: null },
      { ...ports, reise: ohneZeit },
    )
    assert.equal(zeit.ok, false)
    if (zeit.ok) return
    assert.equal(zeit.art, 'zeitraum-unvollstaendig')
  })

  test('Preisänderung oder nicht mehr verfügbare Option werden abgelehnt', async () => {
    const nachweis = hotelNachweisAusKatalog({
      optionen: { 'opt-1': OPTION },
      geaendert: ['opt-preis'],
      abgelaufen: ['opt-weg'],
    })
    const ports = { nachweis, reise: beispielreise() }
    const preis = await hotelKontoUebernahmePruefen({ ...EINGABE, optionId: 'opt-preis' }, ports)
    const weg = await hotelKontoUebernahmePruefen({ ...EINGABE, optionId: 'opt-weg' }, ports)
    assert.equal(preis.ok, false)
    assert.equal(weg.ok, false)
    if (preis.ok || weg.ok) return
    assert.equal(preis.art, 'geaendert')
    assert.equal(weg.art, 'abgelaufen')
  })
})
