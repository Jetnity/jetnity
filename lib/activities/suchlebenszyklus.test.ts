import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { LEERE_ACTIVITY_EVIDENZ } from '@/lib/activities/domain'
import {
  ACTIVITY_HINWEIS_GEMELDET,
  ACTIVITY_HINWEIS_UNBESTAETIGT,
  activitySuchKontextSchluessel,
  leeresUebernahmeRegister,
  optionInhaltSchluessel,
  suchAntwortAnwenden,
  suchDispatch,
  suchKontextWechseln,
  suchLaufStart,
  uebernahmeAbschliessen,
  uebernahmeBeanspruchen,
  uebernahmeDarfSenden,
  uebernahmeErgebnisLesen,
  uebernahmeHinweisNochGueltig,
  uebernahmeHinweisText,
  type UebernahmeErfassung,
} from '@/lib/activities/suchlebenszyklus'

const ANTWORT: ActivitySucheAntwort = {
  status: 'ok',
  message: 'Aktivitäten gefunden.',
  coverageNote: 'Hinweis',
  evidenz: { ...LEERE_ACTIVITY_EVIDENZ, hatOrt: true },
  options: [],
}

const OPTION: ActivityOptionSichtbar = {
  id: 'opt-1',
  provider: 'test-activity',
  externalRef: 'ref-1',
  title: 'Uffizien',
  description: null,
  locationName: 'Florenz',
  punkt: null,
  dauerMinuten: 90,
  timeslot: null,
  preis: 28,
  preisWaehrung: 'CHF',
  bewertung: null,
  bewertungenAnzahl: null,
  stornierbar: null,
  kategorien: [],
  tags: [],
  labels: ['jetnity'],
  reasons: [],
  konflikt: 'frei',
}

function schluessel(tripId: string, dayId: string | null, anfrage = '{"currency":"CHF"}') {
  return activitySuchKontextSchluessel({
    tripId,
    stageId: 'stage-1',
    dayId,
    anfrageSchluessel: anfrage,
  })
}

function erfasst(inhalt: string, generation = 1, epoche = 1): UebernahmeErfassung {
  return {
    tripId: 'trip-a',
    stageId: 'stage-1',
    dayId: 'day-1',
    epoche,
    generation,
    optionInhalt: inhalt,
  }
}

describe('Aktivitäts-Suchlebenszyklus', () => {
  test('der Start ist untätig und löst keine Suche aus', () => {
    const lauf = suchLaufStart(schluessel('trip-a', 'day-1'))
    assert.equal(lauf.phase, 'idle')
    assert.equal(lauf.antwort, null)
    assert.equal(lauf.generation, null)
  })

  test('eine zweite Auslösung im selben Takt wird synchron abgelehnt', () => {
    const erste = suchDispatch(suchLaufStart(schluessel('trip-a', 'day-1')))
    assert.equal(erste.angenommen, true)
    if (!erste.angenommen) return
    const zweite = suchDispatch(erste.lauf)
    assert.equal(zweite.angenommen, false)
    assert.equal(erste.lauf.phase, 'loading')
    assert.equal(zweite.lauf.generation, erste.generation)
  })

  test('eine verspätete Antwort ersetzt weder einen neueren Kontext noch eine neue Generation', () => {
    const start = suchLaufStart(schluessel('trip-a', 'day-1'))
    const erste = suchDispatch(start)
    assert.equal(erste.angenommen, true)
    if (!erste.angenommen) return
    const fertig = suchAntwortAnwenden(erste.lauf, erste, ANTWORT)
    assert.equal(fertig.phase, 'fertig')
    const neu = suchDispatch(fertig)
    assert.equal(neu.angenommen, true)
    if (!neu.angenommen) return
    const ignoriert = suchAntwortAnwenden(neu.lauf, erste, { ...ANTWORT, message: 'alt' })
    assert.equal(ignoriert.generation, neu.generation)
    assert.equal(ignoriert.antwort, null)
    assert.equal(ignoriert.phase, 'loading')
  })

  test('A nach B nach A belebt die erste Antwort nicht wieder', () => {
    const a = schluessel('trip-a', 'day-1', '{"day":"a"}')
    const b = schluessel('trip-a', 'day-2', '{"day":"b"}')
    const erste = suchDispatch(suchLaufStart(a))
    assert.equal(erste.angenommen, true)
    if (!erste.angenommen) return
    const fertig = suchAntwortAnwenden(erste.lauf, erste, ANTWORT)
    const nachB = suchKontextWechseln(fertig, b)
    const zurueck = suchKontextWechseln(nachB, a)
    assert.equal(zurueck.phase, 'idle')
    assert.equal(zurueck.antwort, null)
    assert.notEqual(zurueck.epoche, erste.epoche)
    const spaet = suchAntwortAnwenden(zurueck, erste, ANTWORT)
    assert.equal(spaet.antwort, null)
    assert.equal(spaet.phase, 'idle')
    const zweite = suchDispatch(spaet)
    assert.equal(zweite.angenommen, true)
    if (!zweite.angenommen) return
    assert.notEqual(zweite.generation, erste.generation)
  })

  test('dieselbe Anfrage in zwei Reisen teilt sich die Identität nicht', () => {
    const anfrage = JSON.stringify({ currency: 'CHF', travellers: 2 })
    const eins = schluessel('trip-1', 'day-1', anfrage)
    const zwei = schluessel('trip-2', 'day-1', anfrage)
    assert.notEqual(eins, zwei)
    const erste = suchDispatch(suchLaufStart(eins))
    assert.equal(erste.angenommen, true)
    if (!erste.angenommen) return
    const fertig = suchAntwortAnwenden(erste.lauf, erste, ANTWORT)
    const andereReise = suchKontextWechseln(fertig, zwei)
    assert.equal(andereReise.antwort, null)
    assert.equal(andereReise.phase, 'idle')
    const spaet = suchAntwortAnwenden(andereReise, erste, ANTWORT)
    assert.equal(spaet.antwort, null)
  })

  test('Datum, Reisende, Währung und ein entfernter Tag machen alte Optionen sofort ungültig', () => {
    const basis = schluessel('trip-a', 'day-1', '{"currency":"CHF","travellers":2,"date":"2026-09-12"}')
    const erste = suchDispatch(suchLaufStart(basis))
    assert.equal(erste.angenommen, true)
    if (!erste.angenommen) return
    const fertig = suchAntwortAnwenden(erste.lauf, erste, ANTWORT)
    for (const neu of [
      schluessel('trip-a', 'day-1', '{"currency":"EUR","travellers":2,"date":"2026-09-12"}'),
      schluessel('trip-a', 'day-1', '{"currency":"CHF","travellers":3,"date":"2026-09-12"}'),
      schluessel('trip-a', 'day-1', '{"currency":"CHF","travellers":2,"date":"2026-09-13"}'),
      schluessel('trip-a', null, '{"currency":"CHF","travellers":2,"date":null}'),
    ]) {
      const gewechselt = suchKontextWechseln(fertig, neu)
      assert.equal(gewechselt.phase, 'idle')
      assert.equal(gewechselt.antwort, null)
      assert.notEqual(gewechselt.epoche, fertig.epoche)
    }
  })

  test('ein alter Handler mit wiederverwendeter ID sendet den alten Inhalt nicht', () => {
    const alt = optionInhaltSchluessel({ ...OPTION, title: 'Alt' })
    const neu = optionInhaltSchluessel({ ...OPTION, title: 'Neu' })
    assert.notEqual(alt, neu)
    assert.equal(
      uebernahmeDarfSenden(erfasst(alt), { epoche: 1, generation: 1, inhalte: [neu] }),
      false,
    )
    assert.equal(
      uebernahmeDarfSenden(erfasst(neu), { epoche: 1, generation: 1, inhalte: [neu] }),
      true,
    )
    assert.equal(
      uebernahmeDarfSenden(erfasst(neu, 1, 1), { epoche: 2, generation: 1, inhalte: [neu] }),
      false,
    )
  })

  test('dieselbe Übernahme wird synchron nur einmal beansprucht und gibt nur sich selbst frei', () => {
    const erste = uebernahmeBeanspruchen(leeresUebernahmeRegister(), 'op-a')
    assert.equal(erste.ok, true)
    if (!erste.ok) return
    const doppelt = uebernahmeBeanspruchen(erste.register, 'op-a')
    assert.deepEqual(doppelt, { ok: false, grund: 'doppelt' })
    const andere = uebernahmeBeanspruchen(erste.register, 'op-b')
    assert.equal(andere.ok, true)
    if (!andere.ok) return
    const frei = uebernahmeAbschliessen(andere.register, 'op-a')
    assert.deepEqual(frei.laufend, ['op-b'])
    assert.deepEqual(frei.abgeschlossen, ['op-a'])
    assert.equal(uebernahmeBeanspruchen(frei, 'op-a').ok, false)
    const andereFrei = uebernahmeAbschliessen(frei, 'op-b')
    assert.deepEqual(andereFrei.laufend, [])
    assert.deepEqual(andereFrei.abgeschlossen, ['op-a', 'op-b'])
    assert.equal(uebernahmeAbschliessen(andereFrei, 'fremd'), andereFrei)
  })

  test('null, Text, Wurf und eine falsche Form bleiben ehrlich und ohne automatische Wiederholung', () => {
    assert.equal(uebernahmeErgebnisLesen(null).art, 'gemeldet')
    assert.equal(uebernahmeErgebnisLesen('Der Punkt konnte nicht zugeordnet werden.').art, 'text')
    assert.equal(uebernahmeErgebnisLesen(undefined).art, 'unbestaetigt')
    assert.equal(uebernahmeErgebnisLesen({ gespeichert: false }).art, 'unbestaetigt')
    assert.equal(uebernahmeErgebnisLesen('x\n at Function').art, 'unbestaetigt')
    const gemeldet = uebernahmeHinweisText(uebernahmeErgebnisLesen(null))
    const text = uebernahmeHinweisText(uebernahmeErgebnisLesen('Bitte erneut prüfen.'))
    const unbestaetigt = uebernahmeHinweisText(uebernahmeErgebnisLesen(new Error('stack')))
    assert.equal(gemeldet, ACTIVITY_HINWEIS_GEMELDET)
    assert.match(text, /Bitte erneut prüfen\./)
    assert.match(text, /nicht bestätigt/)
    assert.equal(unbestaetigt, ACTIVITY_HINWEIS_UNBESTAETIGT)
    for (const hinweis of [gemeldet, text, unbestaetigt]) {
      assert.equal(hinweis.includes('genau einmal'), false)
      assert.equal(hinweis.includes('nicht gespeichert'), false)
    }
    assert.equal(uebernahmeHinweisNochGueltig(0, 1), true)
    assert.equal(uebernahmeHinweisNochGueltig(5, 4), false)
  })
})
