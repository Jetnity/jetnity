import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { kalendertagAusInstant } from '@/lib/account/naechste-reise'
import { reisephaseAbleiten, type ReisephaseReise } from '@/lib/trips/reisephase'
import type { TripDay, TripStage } from '@/types/trips'

function etappe(id: string, name: string, von: string | null, bis: string | null, position = 1): TripStage {
  return {
    id,
    position,
    name,
    countryCode: 'TH',
    arrivalDate: von,
    departureDate: bis,
    latitude: null,
    longitude: null,
    placeId: null,
  }
}

function tag(id: string, datum: string | null, stageId: string | null, dayIndex = 1): TripDay {
  return { id, stageId, dayIndex, dayDate: datum, title: null, items: [] }
}

const BANGKOK = etappe('s1', 'Bangkok', '2026-12-01', '2026-12-05', 1)
const CHANG = etappe('s2', 'Ko Chang', '2026-12-05', '2026-12-12', 2)
const PHUKET = etappe('s3', 'Phuket', '2026-12-12', '2026-12-25', 3)

const REISE: ReisephaseReise = {
  startDate: '2026-12-01',
  endDate: '2026-12-25',
  stages: [BANGKOK, CHANG, PHUKET],
  days: [
    tag('d1', '2026-12-01', 's1', 1),
    tag('d3', '2026-12-03', 's1', 3),
    tag('d5', '2026-12-05', 's2', 5),
    tag('d12', '2026-12-12', 's3', 12),
    tag('d25', '2026-12-25', 's3', 25),
  ],
}

describe('Reisephase – Zeitraum', () => {
  test('ohne belegten Kalendertag wird nichts behauptet', () => {
    for (const heute of [null, '', 'heute', '2026-02-30']) {
      const phase = reisephaseAbleiten(REISE, heute)
      assert.deepEqual(phase, { art: 'wartet', kopfzeile: '', heute: null, etappe: null })
    }
  })

  test('Tag vor dem Start: Abreise in einem Tag, ohne Etappe', () => {
    const phase = reisephaseAbleiten(REISE, '2026-11-30')
    assert.equal(phase.art, 'vorher')
    assert.equal(phase.kopfzeile, 'Noch 1 Tag bis zur Abreise')
    assert.equal(phase.heute, null)
    assert.equal(phase.etappe, null)
  })

  test('zwölf Tage vor Abreise', () => {
    assert.equal(reisephaseAbleiten(REISE, '2026-11-19').kopfzeile, 'Noch 12 Tage bis zur Abreise')
  })

  test('erster Reisetag zählt als Tag 1 von 25', () => {
    const phase = reisephaseAbleiten(REISE, '2026-12-01')
    assert.equal(phase.art, 'laeuft')
    assert.equal(phase.kopfzeile, 'Tag 1 von 25')
    assert.equal(phase.heute, 'Heute laut Plan: Bangkok')
    assert.equal(phase.etappe?.id, 's1')
  })

  test('laufende Reise: Tag 3 von 25 und Bangkok', () => {
    const phase = reisephaseAbleiten(REISE, '2026-12-03')
    assert.equal(phase.kopfzeile, 'Tag 3 von 25')
    assert.equal(phase.heute, 'Heute laut Plan: Bangkok')
  })

  test('letzter Reisetag zählt noch zur Reise', () => {
    const phase = reisephaseAbleiten(REISE, '2026-12-25')
    assert.equal(phase.art, 'laeuft')
    assert.equal(phase.kopfzeile, 'Tag 25 von 25')
    assert.equal(phase.heute, 'Heute laut Plan: Phuket')
  })

  test('Tag nach dem Ende: Rückblick ohne bevorstehende Abreise', () => {
    const phase = reisephaseAbleiten(REISE, '2026-12-26')
    assert.equal(phase.art, 'nachher')
    assert.equal(phase.kopfzeile, 'Deine Reise im Rückblick')
    assert.equal(phase.heute, null)
    assert.equal(phase.etappe, null)
    assert.doesNotMatch(phase.kopfzeile, /Abreise|Tag \d/)
  })

  test('fehlender Start oder fehlendes Ende bleibt offen und erfindet keine Dauer', () => {
    for (const teil of [
      { startDate: null },
      { endDate: null },
      { startDate: null, endDate: null },
      { startDate: '2026-12-01', endDate: 'bald' },
    ]) {
      const phase = reisephaseAbleiten({ ...REISE, ...teil }, '2026-12-03')
      assert.equal(phase.art, 'offen')
      assert.equal(phase.kopfzeile, 'Reisezeitraum noch offen')
      assert.equal(phase.heute, null)
      assert.equal(phase.etappe, null)
    }
  })

  test('widersprüchlicher Zeitraum wird nicht als Tagesangabe behauptet', () => {
    const umgekehrt = reisephaseAbleiten({ ...REISE, startDate: '2026-12-25', endDate: '2026-12-01' }, '2026-12-03')
    assert.equal(umgekehrt.art, 'unklar')
    assert.equal(umgekehrt.kopfzeile, 'Reisezeitraum noch unklar')

    const etappeDraussen = reisephaseAbleiten(
      { ...REISE, stages: [BANGKOK, CHANG, etappe('s3', 'Phuket', '2026-12-12', '2027-01-03', 3)] },
      '2026-12-03',
    )
    assert.equal(etappeDraussen.art, 'unklar')

    const tagDraussen = reisephaseAbleiten({ ...REISE, days: [...REISE.days, tag('dx', '2026-11-20', 's1', 99)] }, '2026-12-03')
    assert.equal(tagDraussen.art, 'unklar')
    assert.equal(tagDraussen.heute, null)
  })

  test('Monats- und Jahreswechsel zählen Kalendertage', () => {
    const jahreswechsel: ReisephaseReise = { startDate: '2026-12-30', endDate: '2027-01-02', stages: [], days: [] }
    assert.equal(reisephaseAbleiten(jahreswechsel, '2026-12-31').kopfzeile, 'Tag 2 von 4')
    assert.equal(reisephaseAbleiten(jahreswechsel, '2027-01-01').kopfzeile, 'Tag 3 von 4')
    assert.equal(reisephaseAbleiten(jahreswechsel, '2026-12-28').kopfzeile, 'Noch 2 Tage bis zur Abreise')

    const schaltjahr: ReisephaseReise = { startDate: '2028-02-27', endDate: '2028-03-02', stages: [], days: [] }
    assert.equal(reisephaseAbleiten(schaltjahr, '2028-02-29').kopfzeile, 'Tag 3 von 5')
    assert.equal(reisephaseAbleiten(schaltjahr, '2028-03-01').kopfzeile, 'Tag 4 von 5')

    const normaljahr: ReisephaseReise = { startDate: '2027-02-27', endDate: '2027-03-02', stages: [], days: [] }
    assert.equal(reisephaseAbleiten(normaljahr, '2027-03-01').kopfzeile, 'Tag 3 von 4')
  })

  test('der Geräte-Kalendertag bestimmt den Tag, nicht UTC', () => {
    const instant = new Date('2026-12-05T23:30:00Z')
    const zuerich = kalendertagAusInstant(instant, -60)
    const honolulu = kalendertagAusInstant(instant, 600)
    const auckland = kalendertagAusInstant(instant, -780)
    assert.deepEqual([zuerich, honolulu, auckland], ['2026-12-06', '2026-12-05', '2026-12-06'])
    assert.equal(reisephaseAbleiten(REISE, zuerich).kopfzeile, 'Tag 6 von 25')
    assert.equal(reisephaseAbleiten(REISE, honolulu).kopfzeile, 'Tag 5 von 25')
    assert.equal(reisephaseAbleiten(REISE, auckland).kopfzeile, 'Tag 6 von 25')
  })

  test('der Zeitraum ändert sich mit dem Kalendertag genau einmal pro Tag', () => {
    const vor = reisephaseAbleiten(REISE, '2026-12-02')
    const nach = reisephaseAbleiten(REISE, '2026-12-03')
    assert.equal(vor.kopfzeile, 'Tag 2 von 25')
    assert.equal(nach.kopfzeile, 'Tag 3 von 25')
  })
})

describe('Reisephase – Heute laut Plan', () => {
  test('Wechseltag ohne ausdrückliche Zuordnung bleibt offen', () => {
    const ohneTage: ReisephaseReise = { ...REISE, days: [] }
    const phase = reisephaseAbleiten(ohneTage, '2026-12-05')
    assert.equal(phase.art, 'laeuft')
    assert.equal(phase.heute, 'Heutige Etappe noch offen')
    assert.equal(phase.etappe, null)
  })

  test('Wechseltag mit ausdrücklicher Tageszuordnung nennt die zugeordnete Etappe', () => {
    const phase = reisephaseAbleiten(REISE, '2026-12-05')
    assert.equal(phase.heute, 'Heute laut Plan: Ko Chang')
    assert.equal(phase.etappe?.id, 's2')
  })

  test('mehrere Etappen am selben Tag ohne Zuordnung bleiben offen', () => {
    const ueberlappend: ReisephaseReise = {
      ...REISE,
      stages: [etappe('s1', 'Bangkok', '2026-12-01', '2026-12-08', 1), etappe('s2', 'Ko Chang', '2026-12-04', '2026-12-12', 2), PHUKET],
      days: [],
    }
    const phase = reisephaseAbleiten(ueberlappend, '2026-12-06')
    assert.equal(phase.heute, 'Heutige Etappe noch offen')
    assert.equal(phase.etappe, null)
  })

  test('mehrere Tage mit demselben Datum sind mehrdeutig', () => {
    const doppelt: ReisephaseReise = { ...REISE, days: [tag('a', '2026-12-03', 's1', 3), tag('b', '2026-12-03', 's2', 4)] }
    assert.equal(reisephaseAbleiten(doppelt, '2026-12-03').heute, 'Heutige Etappe noch offen')
  })

  test('Tagesplan und Etappendaten, die sich widersprechen, bleiben offen', () => {
    const widerspruch: ReisephaseReise = { ...REISE, days: [tag('d3', '2026-12-03', 's3', 3)] }
    const phase = reisephaseAbleiten(widerspruch, '2026-12-03')
    assert.equal(phase.heute, 'Heutige Etappe noch offen')
    assert.equal(phase.etappe, null)
  })

  test('zeigt der Tageseintrag auf eine unbekannte Etappe, wird nichts geraten', () => {
    const dangling: ReisephaseReise = { ...REISE, days: [tag('d3', '2026-12-03', 'gibt-es-nicht', 3)] }
    assert.equal(reisephaseAbleiten(dangling, '2026-12-03').heute, 'Heutige Etappe noch offen')
  })

  test('Tag ohne Zuordnung und ohne eindeutige Etappendaten bleibt offen', () => {
    const luecke: ReisephaseReise = {
      startDate: '2026-12-01',
      endDate: '2026-12-25',
      stages: [etappe('s1', 'Bangkok', '2026-12-01', '2026-12-05', 1), etappe('s3', 'Phuket', '2026-12-12', '2026-12-25', 2)],
      days: [],
    }
    assert.equal(reisephaseAbleiten(luecke, '2026-12-08').heute, 'Heutige Etappe noch offen')
    assert.equal(reisephaseAbleiten(luecke, '2026-12-08').kopfzeile, 'Tag 8 von 25')
  })

  test('eine einzige Etappe ohne eigene Daten gilt für den Reisezeitraum', () => {
    const einzel: ReisephaseReise = {
      startDate: '2026-12-10',
      endDate: '2026-12-14',
      stages: [etappe('s1', 'Lissabon', null, null, 1)],
      days: [],
    }
    assert.equal(reisephaseAbleiten(einzel, '2026-12-11').heute, 'Heute laut Plan: Lissabon')
  })

  test('Land ohne konkreten Ort nennt das Land des Plans und rät keine Stadt', () => {
    const land: ReisephaseReise = {
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      stages: [{ ...etappe('s1', 'Thailand', '2026-12-01', '2026-12-10', 1), placeId: 'geonames:1605651' }],
      days: [],
    }
    const phase = reisephaseAbleiten(land, '2026-12-04')
    assert.equal(phase.heute, 'Heute laut Plan: Thailand')
    assert.doesNotMatch(phase.heute ?? '', /Bangkok|Phuket|Chiang/)
  })

  test('eine Etappe ohne Namen wird nie als Ort ausgegeben', () => {
    const namenlos: ReisephaseReise = {
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      stages: [etappe('s1', '  ', '2026-12-01', '2026-12-10', 1)],
      days: [],
    }
    const phase = reisephaseAbleiten(namenlos, '2026-12-04')
    assert.equal(phase.heute, 'Heutige Etappe noch offen')
    assert.equal(phase.etappe, null)
  })

  test('vor und nach der Reise gibt es keine Etappe von heute', () => {
    for (const heute of ['2026-11-01', '2027-01-01']) {
      const phase = reisephaseAbleiten(REISE, heute)
      assert.equal(phase.heute, null)
      assert.equal(phase.etappe, null)
    }
  })
})
