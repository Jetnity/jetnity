import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { kalendertagAusInstant } from '@/lib/account/naechste-reise'
import {
  istVergangen,
  reiseGruppe,
  reisePasstZurSuche,
  reisenGruppenAus,
} from '@/lib/account/reise-lage'
import type { TripSummary } from '@/types/trips'

function reise(teil: Partial<TripSummary> & Pick<TripSummary, 'id' | 'title'>): TripSummary {
  return {
    origin: null,
    startDate: null,
    endDate: null,
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    updatedAt: '2026-08-01T10:00:00.000Z',
    stageCount: 1,
    stages: [{ name: 'Ziel', position: 1 }],
    dayCount: 0,
    itemCount: 0,
    ...teil,
  }
}

const HEUTE = '2026-08-24'
const NACH_UTC_MITTERNACHT = new Date('2026-08-24T00:30:00.000Z')
const VOR_UTC_MITTERNACHT = new Date('2026-08-23T23:30:00.000Z')

describe('reiseGruppe', () => {
  test('Aktiv: Start vor heute, Ende nach heute', () => {
    assert.equal(
      reiseGruppe(reise({ id: 'a', title: 'Aktiv', startDate: '2026-08-20', endDate: '2026-08-28' }), HEUTE),
      'aktiv',
    )
  })

  test('Kommend: Start nach heute', () => {
    assert.equal(
      reiseGruppe(reise({ id: 'k', title: 'Kyoto', startDate: '2026-09-01', endDate: '2026-09-08' }), HEUTE),
      'kommend',
    )
  })

  test('Vergangen: Ende vor heute', () => {
    assert.equal(
      reiseGruppe(reise({ id: 'v', title: 'Rom', startDate: '2026-07-01', endDate: '2026-07-08' }), HEUTE),
      'vergangen',
    )
  })

  test('Ohne Datum bleibt ohne Datum', () => {
    assert.equal(reiseGruppe(reise({ id: 'o', title: 'Offen' }), HEUTE), 'ohne-datum')
  })

  test('undatierte Reise ist niemals vergangen', () => {
    const offen = reise({ id: 'o', title: 'Offen' })
    assert.equal(istVergangen(offen, HEUTE), false)
    assert.equal(reiseGruppe(offen, '1999-01-01'), 'ohne-datum')
  })

  test('Startdatum heute ohne Ende ist aktiv', () => {
    assert.equal(
      reiseGruppe(reise({ id: 's', title: 'Start', startDate: '2026-08-24' }), HEUTE),
      'aktiv',
    )
  })

  test('Enddatum heute mit Start in der Vergangenheit ist aktiv', () => {
    assert.equal(
      reiseGruppe(reise({ id: 'e', title: 'Ende', startDate: '2026-08-20', endDate: '2026-08-24' }), HEUTE),
      'aktiv',
    )
  })

  test('nur Startdatum in der Vergangenheit ist vergangen', () => {
    assert.equal(
      reiseGruppe(reise({ id: 'p', title: 'Nur Start', startDate: '2026-08-01' }), HEUTE),
      'vergangen',
    )
  })

  test('nur Enddatum in der Vergangenheit ist vergangen', () => {
    assert.equal(
      reiseGruppe(reise({ id: 'e', title: 'Nur Ende', endDate: '2026-08-01' }), HEUTE),
      'vergangen',
    )
  })

  test('nur Enddatum heute oder später bleibt ohne Datum', () => {
    assert.equal(
      reiseGruppe(reise({ id: 'e', title: 'Ende offen', endDate: '2026-08-24' }), HEUTE),
      'ohne-datum',
    )
    assert.equal(
      reiseGruppe(reise({ id: 'e2', title: 'Ende später', endDate: '2026-09-01' }), HEUTE),
      'ohne-datum',
    )
  })
})

describe('reisenGruppenAus', () => {
  test('legt jede Reise in genau eine Gruppe', () => {
    const aktiv = reise({ id: 'aktiv', title: 'Lisbon', startDate: '2026-08-20', endDate: '2026-08-28' })
    const kommend = reise({ id: 'kommend', title: 'Kyoto', startDate: '2026-09-01', endDate: '2026-09-08' })
    const vergangen = reise({ id: 'vergangen', title: 'Rom', startDate: '2026-07-01', endDate: '2026-07-05' })
    const offen = reise({ id: 'offen', title: 'Skizze' })
    const gruppen = reisenGruppenAus([kommend, offen, vergangen, aktiv], HEUTE)
    assert.deepEqual(gruppen.aktiv.map((eintrag) => eintrag.id), ['aktiv'])
    assert.deepEqual(gruppen.kommend.map((eintrag) => eintrag.id), ['kommend'])
    assert.deepEqual(gruppen.vergangen.map((eintrag) => eintrag.id), ['vergangen'])
    assert.deepEqual(gruppen.ohneDatum.map((eintrag) => eintrag.id), ['offen'])
  })

  test('leere Gruppe bleibt leere Liste, nicht Fehler', () => {
    const gruppen = reisenGruppenAus([], HEUTE)
    assert.deepEqual(gruppen, { aktiv: [], kommend: [], vergangen: [], ohneDatum: [] })
  })

  test('archivierte Reisen bleiben in der Datumsgruppe, AP-3 filtert sie nicht', () => {
    const archiv = reise({
      id: 'alt',
      title: 'Archiv',
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      status: 'archived',
    })
    const gruppen = reisenGruppenAus([archiv], HEUTE)
    assert.equal(gruppen.vergangen[0]?.id, 'alt')
  })
})

describe('date-only / timezone boundary', () => {
  const startetHeute = reise({
    id: 'start',
    title: 'Start heute',
    startDate: '2026-08-24',
    endDate: '2026-08-28',
  })
  const endetGestern = reise({
    id: 'ende',
    title: 'Ende gestern',
    startDate: '2026-08-20',
    endDate: '2026-08-23',
  })

  test('kurz nach UTC-Mitternacht bleibt die Reise kommend, solange der Geräte-Tag der Vortag ist', () => {
    const geraetetag = kalendertagAusInstant(NACH_UTC_MITTERNACHT, 120)
    assert.equal(geraetetag, '2026-08-23')
    assert.equal(reiseGruppe(startetHeute, geraetetag), 'kommend')
  })

  test('dieselbe UTC-Minute ist aktiv, sobald der Geräte-Tag der Reisetag ist', () => {
    const geraetetag = kalendertagAusInstant(NACH_UTC_MITTERNACHT, 0)
    assert.equal(geraetetag, '2026-08-24')
    assert.equal(reiseGruppe(startetHeute, geraetetag), 'aktiv')
  })

  test('kurz vor UTC-Mitternacht bleibt die Reise aktiv, solange der Geräte-Tag der Endtag ist', () => {
    const geraetetag = kalendertagAusInstant(VOR_UTC_MITTERNACHT, 0)
    assert.equal(geraetetag, '2026-08-23')
    assert.equal(reiseGruppe(endetGestern, geraetetag), 'aktiv')
  })

  test('dieselbe UTC-Minute ist nach dem lokalen Tageswechsel vergangen', () => {
    const geraetetag = kalendertagAusInstant(VOR_UTC_MITTERNACHT, -180)
    assert.equal(geraetetag, '2026-08-24')
    assert.equal(reiseGruppe(endetGestern, geraetetag), 'vergangen')
  })
})

describe('reisePasstZurSuche', () => {
  const porto = reise({ id: 'p', title: 'Porto Wochenende', origin: 'ZRH' })

  test('leere Suche lässt jede Reise', () => {
    assert.equal(reisePasstZurSuche(porto, '  '), true)
  })

  test('findet Titel und Herkunft', () => {
    assert.equal(reisePasstZurSuche(porto, 'porto'), true)
    assert.equal(reisePasstZurSuche(porto, 'zrh'), true)
    assert.equal(reisePasstZurSuche(porto, 'Kyoto'), false)
  })
})
