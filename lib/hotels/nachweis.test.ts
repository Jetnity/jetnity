import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { HotelOption } from '@/lib/hotels/domain'
import {
  hotelNachweisAusKatalog,
  hotelNachweisAusUmgebung,
  hotelNachweisFehler,
} from '@/lib/hotels/nachweis'

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

describe('Hotel-Nachweis', () => {
  test('ohne Umgebung gibt es keinen Nachweis', () => {
    assert.equal(hotelNachweisAusUmgebung(), null)
  })

  test('eine unbekannte, abgelaufene oder geänderte Auswahl wird abgelehnt', async () => {
    const nachweis = hotelNachweisAusKatalog({
      optionen: { 'opt-1': OPTION },
      abgelaufen: ['opt-alt'],
      geaendert: ['opt-neu'],
      fehler: { 'opt-err': 'error' },
    })

    const unbekannt = await nachweis.nachweisen({ optionId: 'gibt-es-nicht' })
    const abgelaufen = await nachweis.nachweisen({ optionId: 'opt-alt' })
    const geaendert = await nachweis.nachweisen({ optionId: 'opt-neu' })
    const fehlerhaft = await nachweis.nachweisen({ optionId: 'opt-err' })
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

  test('eine gültige Katalogauswahl liefert die serverseitige Option', async () => {
    const nachweis = hotelNachweisAusKatalog({ optionen: { 'opt-1': OPTION } })
    const ergebnis = await nachweis.nachweisen({ optionId: 'opt-1' })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.option.preisGesamt, 760)
    assert.equal(ergebnis.option.provider, 'test-hotel')
  })

  test('eine unvollständige Katalogzeile fällt fail-closed', async () => {
    const nachweis = hotelNachweisAusKatalog({
      optionen: { 'opt-leer': { id: 'opt-leer', name: 'Ohne Preis' } },
    })
    const ergebnis = await nachweis.nachweisen({ optionId: 'opt-leer' })
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
