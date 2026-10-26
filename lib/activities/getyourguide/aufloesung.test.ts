import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  gygAufloesungAbschluss,
  gygAufloesungBeginnen,
  gygAufloesungStart,
  gygAufloesungWechseln,
} from '@/lib/activities/getyourguide/aufloesung'
import type { Ort } from '@/lib/places/domain'

function ort(id: string): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name: 'Panama',
    typ: 'country',
    country: 'Panama',
    countryCode: 'PA',
    region: null,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

describe('GetYourGuide-Auflösung', () => {
  test('dieselbe Anfrage bleibt dieselbe Generation, eine neue Anfrage verwirft sie', () => {
    const start = gygAufloesungStart('["land",["geonames:9003703430"]]')
    assert.equal(gygAufloesungWechseln(start, start.anfrage), start)
    const lauf = gygAufloesungBeginnen(start)
    assert.equal(lauf.phase, 'laeuft')
    assert.equal(gygAufloesungBeginnen(lauf), lauf)
    const fertig = gygAufloesungAbschluss(lauf, lauf, {
      art: 'orte',
      orte: { 'geonames:9003703430': ort('geonames:9003703430') },
    })
    assert.equal(fertig.phase, 'fertig')
    const neu = gygAufloesungWechseln(fertig, '["tag","day-b","stage-b","geonames:9001151254"]')
    assert.notEqual(neu.epoche, fertig.epoche)
    assert.equal(neu.phase, 'ruhend')
    assert.deepEqual(neu.orte, {})
    const spaet = gygAufloesungAbschluss(neu, { epoche: lauf.epoche, generation: lauf.generation, anfrage: lauf.anfrage }, {
      art: 'orte',
      orte: { 'geonames:9003703430': ort('geonames:9003703430') },
    })
    assert.equal(spaet, neu)
  })

  test('eine Ablehnung übernimmt keinen Fehlertext des Aufrufers und eine fremde ID fällt weg', () => {
    const lauf = gygAufloesungBeginnen(gygAufloesungStart('anfrage-a'))
    const abgelehnt = gygAufloesungAbschluss(lauf, lauf, { art: 'abgelehnt' })
    assert.equal(abgelehnt.phase, 'fehler')
    assert.equal(abgelehnt.fehler, 'Das Ziel konnte gerade nicht bestätigt werden.')
    assert.equal(JSON.stringify(abgelehnt).includes('https://'), false)
    const erneut = gygAufloesungBeginnen({ ...abgelehnt, phase: 'ruhend' })
    const falsch = gygAufloesungAbschluss(erneut, erneut, {
      art: 'orte',
      orte: { 'geonames:9003703430': ort('geonames:1609350') },
    })
    assert.equal(falsch.phase, 'fertig')
    assert.equal(falsch.orte['geonames:9003703430'], null)
    const alteAblehnung = gygAufloesungAbschluss(erneut, lauf, { art: 'abgelehnt' })
    assert.equal(alteAblehnung.phase, 'laeuft')
  })
})
