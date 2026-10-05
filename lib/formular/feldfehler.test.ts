import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { ORT_MELDUNG } from '@/lib/places/pruefen'
import {
  FORMULAR_ZUSAMMENFASSUNG,
  REISE_FELD_MELDUNG,
  REISE_FORMULAR_FELDER,
  ariaBeschrieben,
  erstesFehlerfeld,
  feldFehlerId,
  feldfehlerLoeschen,
  reiseFormularPruefen,
  zusaetzlicheZielePruefen,
  zusaetzlichesZielFeld,
} from '@/lib/formular/feldfehler'

const gueltig = {
  destination: 'Bangkok',
  destinationPlaceId: 'geonames:1609350',
  origin: 'Zürich',
  originPlaceId: 'geonames:2657896',
  startDate: '2026-09-12',
  endDate: '2026-09-16',
  travellers: 2 as const,
  budget: '4200',
}

describe('Reiseformular-Feldfehler', () => {
  test('mehrere leere Pflichtfelder werden alle markiert', () => {
    const { fehler, erstes } = reiseFormularPruefen({
      destination: '',
      origin: '',
      startDate: '',
      endDate: '',
      travellers: '',
      budget: '',
    })

    assert.equal(fehler.destination, REISE_FELD_MELDUNG.destination)
    assert.equal(fehler.origin, REISE_FELD_MELDUNG.origin)
    assert.equal(fehler.startDate, REISE_FELD_MELDUNG.startDate)
    assert.equal(fehler.endDate, REISE_FELD_MELDUNG.endDate)
    assert.equal(fehler.travellers, REISE_FELD_MELDUNG.travellers)
    assert.equal(fehler.budget, undefined)
    assert.equal(erstes, 'destination')
    assert.equal(FORMULAR_ZUSAMMENFASSUNG, 'Bitte prüfe die markierten Angaben.')
  })

  test('ein einzelnes fehlendes Feld bleibt allein markiert', () => {
    const { fehler, erstes } = reiseFormularPruefen({
      ...gueltig,
      startDate: '',
    })

    assert.deepEqual(fehler, { startDate: REISE_FELD_MELDUNG.startDate })
    assert.equal(erstes, 'startDate')
  })

  test('ungültige Datumsreihenfolge markiert die Rückreise', () => {
    const { fehler, erstes } = reiseFormularPruefen({
      ...gueltig,
      startDate: '2026-09-16',
      endDate: '2026-09-12',
    })

    assert.equal(fehler.startDate, undefined)
    assert.equal(fehler.endDate, REISE_FELD_MELDUNG.endDateReihenfolge)
    assert.equal(erstes, 'endDate')
  })

  test('Reiseziel nur eingetippt, aber nicht ausgewählt', () => {
    const { fehler, erstes } = reiseFormularPruefen({
      ...gueltig,
      destination: 'Bangkok',
      destinationPlaceId: null,
    })

    assert.equal(fehler.destination, ORT_MELDUNG.zielFehlt)
    assert.equal(fehler.origin, undefined)
    assert.equal(erstes, 'destination')
  })

  test('Abreise nur eingetippt, aber nicht ausgewählt', () => {
    const { fehler, erstes } = reiseFormularPruefen({
      ...gueltig,
      origin: 'Zürich',
      originPlaceId: '',
    })

    assert.equal(fehler.origin, ORT_MELDUNG.abreiseFehlt)
    assert.equal(erstes, 'origin')
  })

  test('das erste Fehlerfeld folgt der sichtbaren Reihenfolge', () => {
    const { erstes } = reiseFormularPruefen({
      ...gueltig,
      origin: 'Zürich',
      originPlaceId: null,
      endDate: '2026-09-01',
    })
    assert.equal(erstes, 'origin')
    assert.equal(erstesFehlerfeld({ budget: 'x', origin: 'y' }, REISE_FORMULAR_FELDER), 'origin')
  })

  test('Ortssuche bleibt per Tastatur bedienbar, auch mit Feldfehler', () => {
    const beschrieben = ariaBeschrieben('feld-ziel-fehler', 'feld-ziel-liste')
    assert.equal(beschrieben, 'feld-ziel-fehler feld-ziel-liste')
    assert.ok(beschrieben?.includes('liste'))
  })

  test('die Fehlermeldung ist mit dem jeweiligen Feld verbunden', () => {
    assert.equal(feldFehlerId('feld-ziel'), 'feld-ziel-fehler')
    assert.equal(
      ariaBeschrieben('feld-ziel-fehler', 'feld-ziel-liste'),
      'feld-ziel-fehler feld-ziel-liste',
    )
    assert.equal(ariaBeschrieben(undefined, ''), undefined)
  })

  test('der Fehler verschwindet nach der Korrektur', () => {
    const vorher = reiseFormularPruefen({
      ...gueltig,
      destination: 'Test',
      destinationPlaceId: null,
      startDate: '',
    }).fehler

    assert.equal(vorher.destination, ORT_MELDUNG.zielFehlt)
    assert.equal(vorher.startDate, REISE_FELD_MELDUNG.startDate)

    const ohneZiel = feldfehlerLoeschen(vorher, 'destination')
    assert.equal(ohneZiel.destination, undefined)
    assert.equal(ohneZiel.startDate, REISE_FELD_MELDUNG.startDate)

    const danach = reiseFormularPruefen({
      ...gueltig,
      destination: 'Bangkok',
      destinationPlaceId: 'geonames:1609350',
    })
    assert.deepEqual(danach.fehler, {})
    assert.equal(danach.erstes, null)
  })

  test('ein zusätzliches Ziel ohne bestätigte ID scheitert am Feld', () => {
    const fehler = zusaetzlicheZielePruefen([
      { key: '1', text: 'Rom', placeId: null },
    ])
    assert.equal(fehler[zusaetzlichesZielFeld('1')], ORT_MELDUNG.zielFehlt)
  })

  test('ein ungültiges Budget wird am Feld genannt', () => {
    assert.equal(
      reiseFormularPruefen({ ...gueltig, budget: '-10' }).fehler.budget,
      REISE_FELD_MELDUNG.budget,
    )
    assert.equal(reiseFormularPruefen({ ...gueltig, budget: '' }).fehler.budget, undefined)
  })
})
