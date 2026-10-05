import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { HotelOption } from '@/lib/hotels/domain'
import {
  hotelNachweisAusKatalog,
  hotelNachweisAusUmgebung,
  hotelNachweisFehler,
  hotelNachweisKontextAusGraph,
  type HotelNachweisKontext,
} from '@/lib/hotels/nachweis'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

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

const KONTEXT: HotelNachweisKontext = {
  destinationPlaceId: 'stage:stage-1',
  checkIn: '2026-09-12',
  checkOut: '2026-09-14',
  rooms: 1,
  adults: 2,
  children: 0,
  currency: 'CHF',
}

function katalog() {
  return hotelNachweisAusKatalog({
    optionen: { 'opt-1': OPTION },
    kontexte: { 'opt-1': KONTEXT },
    abgelaufen: ['opt-alt'],
    geaendert: ['opt-neu'],
    fehler: { 'opt-err': 'error' },
  })
}

describe('Hotel-Nachweis', () => {
  test('ohne Umgebung gibt es keinen Nachweis', () => {
    assert.equal(hotelNachweisAusUmgebung(), null)
  })

  test('der erwartete Kontext kommt aus dem Reisegraphen, nicht aus dem Browser', () => {
    const reise = beispielreise()
    const kontext = hotelNachweisKontextAusGraph(reise, {
      etappe: reise.stages[0]!,
      checkIn: '2026-09-12',
      checkOut: '2026-09-14',
    })
    assert.deepEqual(kontext, KONTEXT)
  })

  test('eine unbekannte, abgelaufene oder geänderte Auswahl wird abgelehnt', async () => {
    const nachweis = katalog()
    const unbekannt = await nachweis.nachweisen({ optionId: 'gibt-es-nicht', kontext: KONTEXT })
    const abgelaufen = await nachweis.nachweisen({ optionId: 'opt-alt', kontext: KONTEXT })
    const geaendert = await nachweis.nachweisen({ optionId: 'opt-neu', kontext: KONTEXT })
    const fehlerhaft = await nachweis.nachweisen({ optionId: 'opt-err', kontext: KONTEXT })
    assert.equal(unbekannt.ok, false)
    assert.equal(abgelaufen.ok, false)
    assert.equal(geaendert.ok, false)
    assert.equal(fehlerhaft.ok, false)
    if (unbekannt.ok || abgelaufen.ok || geaendert.ok || fehlerhaft.ok) return
    assert.equal(unbekannt.art, 'unbekannt')
    assert.equal(abgelaufen.art, 'abgelaufen')
    assert.equal(geaendert.art, 'geaendert')
    assert.equal(fehlerhaft.art, 'error')
  })

  test('gleiche optionId mit anderem Ziel, Zeitraum, Belegung oder Währung wird abgelehnt', async () => {
    const nachweis = katalog()
    const faelle: HotelNachweisKontext[] = [
      { ...KONTEXT, destinationPlaceId: 'geonames:3128760' },
      { ...KONTEXT, checkIn: '2026-10-01', checkOut: '2026-10-05' },
      { ...KONTEXT, rooms: 2 },
      { ...KONTEXT, adults: 4 },
      { ...KONTEXT, children: 1 },
      { ...KONTEXT, currency: 'EUR' },
    ]
    for (const kontext of faelle) {
      const ergebnis = await nachweis.nachweisen({ optionId: 'opt-1', kontext })
      assert.equal(ergebnis.ok, false)
      if (ergebnis.ok) return
      assert.equal(ergebnis.art, 'geaendert')
    }
  })

  test('eine gültige Katalogauswahl mit passendem Kontext liefert die Option', async () => {
    const nachweis = katalog()
    const ergebnis = await nachweis.nachweisen({ optionId: 'opt-1', kontext: KONTEXT })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.option.preisGesamt, 760)
    assert.equal(ergebnis.option.provider, 'test-hotel')
  })

  test('eine unvollständige Katalogzeile fällt fail-closed', async () => {
    const nachweis = hotelNachweisAusKatalog({
      optionen: { 'opt-leer': { id: 'opt-leer', name: 'Ohne Preis' } },
      kontexte: { 'opt-leer': KONTEXT },
    })
    const ergebnis = await nachweis.nachweisen({ optionId: 'opt-leer', kontext: KONTEXT })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'invalid')
  })

  test('unavailable bleibt die ehrliche Meldung ohne Nachweisquelle', () => {
    const fehler = hotelNachweisFehler('unavailable')
    assert.equal(fehler.ok, false)
    if (fehler.ok) return
    assert.match(fehler.message, /noch nicht verbindlich/)
  })
})
