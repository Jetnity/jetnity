import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { aktivitaetsZieleWaehlen, type AktivitaetsZielEingabe } from '@/lib/activities/zielauswahl'
import type { Ort } from '@/lib/places/domain'

function ort(id: string, name: string, typ: Ort['typ'], countryCode: string): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name,
    typ,
    country: countryCode,
    countryCode,
    region: null,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const bangkok = ort('geonames:1609350', 'Bangkok', 'city', 'TH')
const koChang = ort('geonames:1609604', 'Ko Chang', 'island', 'TH')
const phuket = ort('geonames:1151254', 'Phuket', 'city', 'TH')
const chiangMai = ort('geonames:1153671', 'Chiang Mai', 'city', 'TH')
const thailand = ort('geonames:1605651', 'Thailand', 'country', 'TH')
const portugal = ort('geonames:2264397', 'Portugal', 'country', 'PT')

function etappe(
  id: string,
  name: string,
  place: Ort | null,
  position: number,
  countryCode: string | null = place?.countryCode ?? null,
) {
  return { id, position, name, countryCode, placeId: place?.id ?? null }
}

function tag(id: string, dayIndex: number, stageId: string | null, dayDate: string | null) {
  return { id, dayIndex, stageId, dayDate, title: null }
}

function wahl(teil: Partial<AktivitaetsZielEingabe> & Pick<AktivitaetsZielEingabe, 'etappen' | 'tage' | 'orte'>): ReturnType<
  typeof aktivitaetsZieleWaehlen
> {
  return aktivitaetsZieleWaehlen({
    tagId: null,
    gewaehlteEtappeId: null,
    tagEntscheidung: { art: 'automatisch' },
    ...teil,
  })
}

describe('Aktivitätsziel', () => {
  test('ein Anreisetag ohne Etappe blockiert Bangkok, Ko Chang und Phuket nicht', () => {
    const orte = new Map<string, Ort | null>([
      [bangkok.id, bangkok],
      [koChang.id, koChang],
      [phuket.id, phuket],
    ])
    const aus = wahl({
      etappen: [
        etappe('stage-bkk', 'Bangkok Titel', bangkok, 1),
        etappe('stage-kc', 'Ko Chang Titel', koChang, 2),
        etappe('stage-phu', 'Phuket Titel', phuket, 3),
      ],
      tage: [
        tag('day-ab', 1, null, '2026-11-02'),
        tag('day-bkk', 2, 'stage-bkk', '2026-11-03'),
        tag('day-kc', 3, 'stage-kc', '2026-11-06'),
        tag('day-phu', 4, 'stage-phu', '2026-11-10'),
        tag('day-rueck', 5, null, '2026-11-14'),
      ],
      tagId: 'day-ab',
      orte,
    })
    assert.equal(aus.gewaehlt?.stageId, 'stage-bkk')
    assert.equal(aus.gewaehlt?.name, 'Bangkok')
    assert.equal(aus.gewaehlt?.kanonischerName, 'Bangkok')
    assert.equal(aus.tagFilter, null)
    assert.equal(aus.datumOffen, true)
    assert.equal(aus.einstieg, 'erster')
    assert.deepEqual(
      aus.ziele.map((ziel) => ziel.stageId),
      ['stage-bkk', 'stage-kc', 'stage-phu'],
    )
    assert.equal(aus.gewaehlt?.name.includes('Titel'), false)
  })

  test('ein bewusster Tag benutzt seine eigene Etappe und sein Datum', () => {
    const aus = wahl({
      etappen: [etappe('stage-bkk', 'Bangkok', bangkok, 1), etappe('stage-phu', 'Phuket', phuket, 2)],
      tage: [tag('day-ab', 1, null, '2026-11-02'), tag('day-phu', 2, 'stage-phu', '2026-11-10')],
      tagId: 'day-phu',
      orte: new Map([
        [bangkok.id, bangkok],
        [phuket.id, phuket],
      ]),
    })
    assert.equal(aus.einstieg, 'tag')
    assert.equal(aus.gewaehlt?.stageId, 'stage-phu')
    assert.equal(aus.tagFilter?.id, 'day-phu')
    assert.equal(aus.tagFilter?.dayDate, '2026-11-10')
    assert.equal(aus.datumOffen, false)
  })

  test('wiederholte Ziele bleiben getrennte Etappen', () => {
    const aus = wahl({
      etappen: [
        etappe('stage-hin', 'Bangkok', bangkok, 1),
        etappe('stage-cm', 'Chiang Mai', chiangMai, 2),
        etappe('stage-rueck', 'Bangkok', bangkok, 3),
      ],
      tage: [
        tag('day-hin', 1, 'stage-hin', '2026-11-02'),
        tag('day-cm', 2, 'stage-cm', '2026-11-05'),
        tag('day-rueck', 3, 'stage-rueck', '2026-11-08'),
      ],
      tagId: 'day-hin',
      orte: new Map([
        [bangkok.id, bangkok],
        [chiangMai.id, chiangMai],
      ]),
    })
    assert.equal(aus.ziele.length, 3)
    assert.equal(aus.ziele[0]?.stageId, 'stage-hin')
    assert.equal(aus.ziele[2]?.stageId, 'stage-rueck')
    assert.notEqual(aus.ziele[0]?.tage[0]?.id, aus.ziele[2]?.tage[0]?.id)
    const rueck = wahl({
      etappen: aus.ziele.map((ziel, index) =>
        etappe(ziel.stageId, ziel.name, index === 1 ? chiangMai : bangkok, index + 1),
      ),
      tage: [
        tag('day-hin', 1, 'stage-hin', '2026-11-02'),
        tag('day-cm', 2, 'stage-cm', '2026-11-05'),
        tag('day-rueck', 3, 'stage-rueck', '2026-11-08'),
      ],
      tagEntscheidung: { art: 'tag', tagId: 'day-rueck' },
      orte: new Map([
        [bangkok.id, bangkok],
        [chiangMai.id, chiangMai],
      ]),
    })
    assert.equal(rueck.gewaehlt?.stageId, 'stage-rueck')
    assert.equal(rueck.tagFilter?.id, 'day-rueck')
    assert.notEqual(rueck.gewaehlt?.stageId, 'stage-hin')
  })

  test('ohne Tage bleibt das erste bestätigte Ziel wählbar', () => {
    const aus = wahl({
      etappen: [etappe('stage-bkk', 'Bangkok', bangkok, 1)],
      tage: [],
      orte: new Map([[bangkok.id, bangkok]]),
    })
    assert.equal(aus.gewaehlt?.stageId, 'stage-bkk')
    assert.equal(aus.tagFilter, null)
    assert.equal(aus.datumOffen, false)
  })

  test('ein Land bleibt ein Land und ein Widerspruch lädt kein anderes Ziel unter seinem Namen', () => {
    const land = wahl({
      etappen: [etappe('stage-th', 'Thailand frei', thailand, 1)],
      tage: [],
      orte: new Map([[thailand.id, thailand]]),
    })
    assert.equal(land.gewaehlt?.status, 'land')
    assert.equal(land.gewaehlt?.zielArt, 'land')
    assert.equal(land.gewaehlt?.name, 'Thailand')
    const konflikt = wahl({
      etappen: [etappe('stage-bkk', 'Bangkok', bangkok, 1, 'PT'), etappe('stage-phu', 'Phuket', phuket, 2)],
      tage: [],
      orte: new Map<string, Ort | null>([
        [bangkok.id, bangkok],
        [phuket.id, phuket],
      ]),
    })
    assert.equal(konflikt.gewaehlt?.stageId, 'stage-phu')
    assert.equal(konflikt.ziele[0]?.status, 'widerspruch')
    const gehalten = wahl({
      etappen: [etappe('stage-bkk', 'Bangkok', bangkok, 1, 'PT')],
      tage: [],
      gewaehlteEtappeId: 'stage-bkk',
      orte: new Map([[bangkok.id, bangkok]]),
    })
    assert.equal(gehalten.gewaehlt?.status, 'widerspruch')
    assert.equal(gehalten.gewaehlt?.stageId, 'stage-bkk')
    assert.equal(gehalten.gewaehlt?.kanonischerName, null)
  })

  test('unbestätigte und mehrdeutige Orte werden übersprungen, solange ein bestätigtes Ziel folgt', () => {
    const aus = wahl({
      etappen: [
        etappe('stage-offen', 'Irgendwo', null, 1),
        etappe('stage-pt', 'Portugal', portugal, 2),
      ],
      tage: [tag('day-offen', 1, 'stage-offen', '2026-11-02')],
      tagId: 'day-offen',
      orte: new Map([[portugal.id, portugal]]),
    })
    assert.equal(aus.einstieg, 'tag')
    assert.equal(aus.gewaehlt?.stageId, 'stage-offen')
    assert.equal(aus.gewaehlt?.status, 'unbestaetigt')
    assert.equal(aus.tagFilter?.id, 'day-offen')
    const allgemein = wahl({
      etappen: [
        etappe('stage-offen', 'Irgendwo', null, 1),
        etappe('stage-pt', 'Portugal', portugal, 2),
      ],
      tage: [],
      orte: new Map([[portugal.id, portugal]]),
    })
    assert.equal(allgemein.gewaehlt?.stageId, 'stage-pt')
    assert.equal(allgemein.gewaehlt?.status, 'land')
  })

  test('eine gelöschte Auswahl fällt auf das erste passende Ziel zurück', () => {
    const aus = wahl({
      etappen: [etappe('stage-bkk', 'Bangkok', bangkok, 2), etappe('stage-phu', 'Phuket', phuket, 1)],
      tage: [],
      gewaehlteEtappeId: 'stage-weg',
      orte: new Map([
        [bangkok.id, bangkok],
        [phuket.id, phuket],
      ]),
    })
    assert.equal(aus.gewaehlt?.stageId, 'stage-phu')
    assert.equal(aus.ziele[0]?.stageId, 'stage-phu')
  })

  test('ohne abgeschlossene Ortslesung wird nicht am ersten unbestätigten Ort vorbeigewählt', () => {
    const aus = wahl({
      etappen: [etappe('stage-bkk', 'Bangkok', bangkok, 1), etappe('stage-phu', 'Phuket', phuket, 2)],
      tage: [],
      orte: null,
    })
    assert.equal(aus.gewaehlt?.stageId, 'stage-bkk')
    assert.equal(aus.gewaehlt?.status, 'ausstehend')
    assert.equal(aus.tagFilter, null)
  })
})
