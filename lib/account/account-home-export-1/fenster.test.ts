import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  fensterHinweis,
  naechsteReiseBezeichnung,
  reiseFensterAus,
  weltReichweiteText,
} from '@/lib/account/account-home-export-1/fenster'
import { naechsteReiseAus } from '@/lib/account/naechste-reise'
import { REISEN_LISTE_GRENZE } from '@/lib/trips/liste-grenze'
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
    stages: [],
    stageCount: 0,
    dayCount: 0,
    itemCount: 0,
    ...teil,
  }
}

describe('geladenes Reisefenster', () => {
  test('0 und 199 sind die ganze Leserantwort, 200 ist nur die Obergrenze', () => {
    assert.deepEqual(reiseFensterAus({ problem: false, anzahl: 0 }), { lage: 'vollstaendig', anzahl: 0 })
    assert.deepEqual(reiseFensterAus({ problem: false, anzahl: 199 }), { lage: 'vollstaendig', anzahl: 199 })
    assert.equal(REISEN_LISTE_GRENZE, 200)
    const grenze = reiseFensterAus({ problem: false, anzahl: 200 })
    assert.equal(grenze.lage, 'grenze')
    const text = fensterHinweis(grenze)
    assert.equal(text.includes('200'), true)
    assert.equal(/weitere Reisen gespeichert sind, ist hier nicht geprüft/.test(text), true)
    assert.equal(/vollständig|abgeschnitten|es gibt weitere/i.test(text), false)
    assert.equal(weltReichweiteText(grenze).includes('nicht geprüft'), true)
    assert.equal(weltReichweiteText(grenze).includes('Gesamt in deinem Konto'), false)
  })

  test('ein Fehler behauptet weder leer noch vollständig', () => {
    const fenster = reiseFensterAus({ problem: true, anzahl: 0 })
    assert.equal(fenster.lage, 'fehler')
    assert.equal(fensterHinweis(fenster).includes('nicht geladen'), true)
    assert.equal(weltReichweiteText(fenster).includes('unbekannt'), true)
  })

  test('eine frühere kommende Reise ausserhalb des Fensters ist nicht die globale nächste', () => {
    const imFenster = reise({
      id: 'spaeter',
      title: 'Später im Fenster',
      startDate: '2026-11-01',
      endDate: '2026-11-08',
      status: 'planned',
      updatedAt: '2026-10-01T00:00:00.000Z',
    })
    const ausserhalb = reise({
      id: 'frueher',
      title: 'Früher, aber älter geändert',
      startDate: '2026-09-01',
      endDate: '2026-09-04',
      status: 'planned',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    const geladen = [imFenster]
    const gewaehlt = naechsteReiseAus(geladen, '2026-08-24')
    assert.equal(gewaehlt?.reise.id, 'spaeter')
    assert.equal(geladen.some((eintrag) => eintrag.id === ausserhalb.id), false)
    const grenze = reiseFensterAus({ problem: false, anzahl: 200 })
    const text = naechsteReiseBezeichnung('kommend', grenze)
    assert.equal(text, 'Nächste Reise in den geladenen Reisen.')
    assert.equal(text.includes('Deine nächste Reise'), false)
    assert.equal(naechsteReiseBezeichnung('kommend', reiseFensterAus({ problem: false, anzahl: 3 })), 'Deine nächste Reise.')
  })

  test('nur archivierte Zeilen an der Obergrenze sind keine globale Leere', () => {
    const archiv = reise({
      id: 'alt',
      title: 'Archiv',
      startDate: '2026-09-01',
      endDate: '2026-09-04',
      status: 'archived',
      archivePreviousStatus: 'planned',
    })
    const reihen = Array.from({ length: 200 }, (_, index) => ({ ...archiv, id: `a${index}` }))
    assert.equal(naechsteReiseAus(reihen, '2026-08-24'), null)
    assert.equal(reiseFensterAus({ problem: false, anzahl: reihen.length }).lage, 'grenze')
    assert.equal(naechsteReiseAus([archiv], '2026-08-24'), null)
    assert.equal(reiseFensterAus({ problem: false, anzahl: 1 }).lage, 'vollstaendig')
  })
})
