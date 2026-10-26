import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { activityKandidatenAnreichern } from '@/lib/activities/anreichern'
import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { sucheFuerClient } from '@/lib/activities/client-sicht'
import { LEERE_ACTIVITY_EVIDENZ, type ActivityOption, type ActivitySuchanfrage } from '@/lib/activities/domain'
import type { Zeitfenster } from '@/lib/activities/konflikt'
import { activityOptionenBewerten } from '@/lib/activities/ranking'
import { alsActivityMomentaufnahme } from '@/lib/activities/uebernahme'
import {
  ACTIVITY_HINWEIS_GEMELDET,
  ACTIVITY_HINWEIS_UNBESTAETIGT,
  activitySuchKontextSchluessel,
  leeresUebernahmeRegister,
  optionInhaltSchluessel,
  optionSchreibIdentitaet,
  suchAntwortAnwenden,
  suchDispatch,
  suchKontextWechseln,
  suchLaufStart,
  uebernahmeAbschliessen,
  uebernahmeBeanspruchen,
  uebernahmeDarfSenden,
  uebernahmeErgebnisLesen,
  uebernahmeHinweisSetzen,
  uebernahmeHinweisText,
  uebernahmeHinweisTexte,
  uebernahmeOperationSchluessel,
  uebernahmeUnbestaetigtFreigeben,
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

function erfasst(inhalt: string, generation = 1, epoche = 1, option: ActivityOptionSichtbar = OPTION): UebernahmeErfassung {
  return {
    tripId: 'trip-a',
    stageId: 'stage-1',
    dayId: 'day-1',
    epoche,
    generation,
    optionInhalt: inhalt,
    schreibIdentitaet: optionSchreibIdentitaet(option),
  }
}

function operationVon(option: ActivityOptionSichtbar, tripId = 'trip-a', dayId = 'day-1'): string {
  return uebernahmeOperationSchluessel({
    tripId,
    stageId: 'stage-1',
    dayId,
    schreibIdentitaet: optionSchreibIdentitaet(option),
  })
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
    const frei = uebernahmeAbschliessen(andere.register, 'op-a', 'angenommen')
    assert.deepEqual(frei.laufend, ['op-b'])
    assert.deepEqual(frei.angenommen, ['op-a'])
    assert.equal(uebernahmeBeanspruchen(frei, 'op-a').ok, false)
    const andereFrei = uebernahmeAbschliessen(frei, 'op-b', 'unbestaetigt')
    assert.deepEqual(andereFrei.laufend, [])
    assert.deepEqual(andereFrei.angenommen, ['op-a'])
    assert.deepEqual(andereFrei.unbestaetigt, ['op-b'])
    assert.equal(uebernahmeAbschliessen(andereFrei, 'fremd', 'angenommen'), andereFrei)
  })

  test('eine neue Suche öffnet eine laufende oder angenommene Übernahme nicht wieder', () => {
    const inhalt = optionInhaltSchluessel(OPTION)
    const key = operationVon(OPTION)
    assert.equal(operationVon(OPTION), key)
    const erste = uebernahmeBeanspruchen(leeresUebernahmeRegister(), key)
    assert.equal(erste.ok, true)
    if (!erste.ok) return
    assert.deepEqual(uebernahmeBeanspruchen(erste.register, key), { ok: false, grund: 'doppelt' })
    const angenommen = uebernahmeAbschliessen(erste.register, key, 'angenommen')
    assert.deepEqual(uebernahmeBeanspruchen(angenommen, key), { ok: false, grund: 'angenommen' })
    assert.equal(uebernahmeUnbestaetigtFreigeben(angenommen, key), angenommen)
    const unbestaetigt = uebernahmeAbschliessen(erste.register, key, 'unbestaetigt')
    assert.deepEqual(uebernahmeBeanspruchen(unbestaetigt, key), { ok: false, grund: 'unbestaetigt' })
    assert.equal(uebernahmeUnbestaetigtFreigeben(angenommen, key), angenommen)
    const frei = uebernahmeUnbestaetigtFreigeben(unbestaetigt, key)
    const erneut = uebernahmeBeanspruchen(frei, key)
    assert.equal(erneut.ok, true)
    assert.equal(
      uebernahmeDarfSenden(erfasst(inhalt, 1, 1), { epoche: 1, generation: 2, inhalte: [inhalt] }),
      false,
    )
  })

  test('dieselbe Schreiber-Momentaufnahme bleibt eine Operation, wenn nur die Rangdarstellung wechselt', () => {
    const anbieter: ActivityOption = {
      id: 'opt-fenster',
      provider: 'test-activity',
      externalRef: 'ref-fenster',
      title: 'Nachmittag im Garten',
      description: 'Beschreibung ändert die Momentaufnahme nicht.',
      locationName: 'Boboli',
      punkt: { lat: 43.762, lon: 11.249 },
      dauerMinuten: 90,
      timeslot: {
        startsOn: '2026-09-12',
        startsAt: '15:00',
        endsOn: '2026-09-12',
        endsAt: '16:30',
      },
      preis: 40,
      preisWaehrung: 'CHF',
      bewertung: 8.4,
      bewertungenAnzahl: 120,
      stornierbar: true,
      kategorien: ['culture'],
      tags: ['garten'],
    }
    const anfrage: ActivitySuchanfrage = {
      destinationPlaceId: 'geonames:3176959',
      destinationName: 'Florenz',
      dayDate: '2026-09-12',
      participants: 2,
      currency: 'CHF',
      budgetAmount: 4200,
      interests: ['culture'],
      pace: 'calm',
    }
    const morgen: Zeitfenster = {
      startsOn: '2026-09-12',
      startsAt: '09:00',
      endsOn: '2026-09-12',
      endsAt: '11:00',
    }
    const sichtbar = (fenster: readonly Zeitfenster[]) => {
      const kandidaten = activityKandidatenAnreichern([anbieter], anfrage, fenster, {
        lat: 43.7696,
        lon: 11.2558,
      })
      const bewertet = activityOptionenBewerten(kandidaten)
      const antwort = sucheFuerClient({
        status: 'ok',
        message: 'Aktivitäten gefunden.',
        options: bewertet,
      })
      const option = antwort.options[0]
      if (!option) throw new Error('Pipeline ohne Option')
      return option
    }
    const frei = sichtbar([morgen])
    const ueberschneidung = sichtbar([
      morgen,
      {
        startsOn: '2026-09-12',
        startsAt: '15:00',
        endsOn: '2026-09-12',
        endsAt: '16:30',
      },
    ])
    const { labels: labelsFrei, reasons: reasonsFrei, konflikt: konfliktFrei, ...restFrei } = frei
    const {
      labels: labelsNachher,
      reasons: reasonsNachher,
      konflikt: konfliktNachher,
      ...restNachher
    } = ueberschneidung
    assert.deepEqual(restFrei, restNachher)
    assert.equal(konfliktFrei, 'frei')
    assert.equal(konfliktNachher, 'ueberschneidung')
    assert.notDeepEqual(labelsFrei, labelsNachher)
    assert.notDeepEqual(reasonsFrei, reasonsNachher)
    assert.notEqual(optionInhaltSchluessel(frei), optionInhaltSchluessel(ueberschneidung))
    assert.deepEqual(
      alsActivityMomentaufnahme(frei, '2026-09-12'),
      alsActivityMomentaufnahme(ueberschneidung, '2026-09-12'),
    )

    const key = operationVon(frei)
    assert.equal(operationVon(ueberschneidung), key)
    assert.notEqual(operationVon({ ...frei, title: 'Anderer Titel' }), key)
    assert.notEqual(operationVon({ ...frei, externalRef: 'ref-andere' }), key)
    assert.notEqual(operationVon({ ...frei, preis: 41 }), key)
    assert.notEqual(
      operationVon({
        ...frei,
        timeslot: { startsOn: '2026-09-12', startsAt: '18:00', endsOn: '2026-09-12', endsAt: '19:00' },
      }),
      key,
    )
    assert.notEqual(operationVon(frei, 'trip-b'), key)
    assert.notEqual(operationVon(frei, 'trip-a', 'day-2'), key)

    const laufend = uebernahmeBeanspruchen(leeresUebernahmeRegister(), key)
    assert.equal(laufend.ok, true)
    if (!laufend.ok) return
    assert.deepEqual(uebernahmeBeanspruchen(laufend.register, operationVon(ueberschneidung)), {
      ok: false,
      grund: 'doppelt',
    })
    const andere = uebernahmeBeanspruchen(laufend.register, operationVon({ ...frei, externalRef: 'ref-andere' }))
    assert.equal(andere.ok, true)
    const angenommen = uebernahmeAbschliessen(laufend.register, key, 'angenommen')
    assert.deepEqual(uebernahmeBeanspruchen(angenommen, operationVon(ueberschneidung)), {
      ok: false,
      grund: 'angenommen',
    })
    assert.equal(uebernahmeUnbestaetigtFreigeben(angenommen, key), angenommen)
    const unbestaetigt = uebernahmeAbschliessen(laufend.register, key, 'unbestaetigt')
    assert.deepEqual(uebernahmeBeanspruchen(unbestaetigt, operationVon(ueberschneidung)), {
      ok: false,
      grund: 'unbestaetigt',
    })
    assert.equal(
      uebernahmeDarfSenden(erfasst(optionInhaltSchluessel(frei), 1, 1, frei), {
        epoche: 1,
        generation: 1,
        inhalte: [optionInhaltSchluessel(ueberschneidung)],
      }),
      false,
    )
    assert.equal(
      uebernahmeDarfSenden(erfasst(optionInhaltSchluessel(ueberschneidung), 1, 1, ueberschneidung), {
        epoche: 1,
        generation: 2,
        inhalte: [optionInhaltSchluessel(ueberschneidung)],
      }),
      false,
    )
  })

  test('eine ältere Meldung spricht nicht für eine neuere Karte', () => {
    const tag = { tripId: 'trip-a', stageId: 'stage-1', dayId: 'day-1' }
    const erste = uebernahmeHinweisSetzen({}, 'op-a', { ...tag, text: ACTIVITY_HINWEIS_GEMELDET, seq: 2 })
    const bleibt = uebernahmeHinweisSetzen(erste, 'op-a', { ...tag, text: 'älter', seq: 1 })
    assert.equal(bleibt['op-a']?.text, ACTIVITY_HINWEIS_GEMELDET)
    const neu = uebernahmeHinweisTexte(bleibt, { ...tag, karten: ['op-b'] })
    assert.deepEqual(neu.allgemein, [])
    assert.deepEqual(neu.jeKarte, {})
    const beide = uebernahmeHinweisTexte(bleibt, { ...tag, karten: ['op-a', 'op-b'] })
    assert.equal(beide.jeKarte['op-a'], ACTIVITY_HINWEIS_GEMELDET)
    assert.equal(beide.jeKarte['op-b'], undefined)
    assert.deepEqual(beide.allgemein, [])
    const untätig = uebernahmeHinweisTexte(bleibt, { ...tag, karten: null })
    assert.deepEqual(untätig.allgemein, [ACTIVITY_HINWEIS_GEMELDET])
    const gleicheMeldung = uebernahmeHinweisSetzen(bleibt, 'op-c', {
      ...tag,
      text: ACTIVITY_HINWEIS_GEMELDET,
      seq: 4,
    })
    const mitOffen = uebernahmeHinweisSetzen(gleicheMeldung, 'op-d', {
      ...tag,
      text: ACTIVITY_HINWEIS_UNBESTAETIGT,
      seq: 5,
    })
    assert.deepEqual(uebernahmeHinweisTexte(mitOffen, { ...tag, karten: null }).allgemein, [
      ACTIVITY_HINWEIS_GEMELDET,
      ACTIVITY_HINWEIS_UNBESTAETIGT,
    ])
    const nurAndereKarte = uebernahmeHinweisTexte(mitOffen, { ...tag, karten: ['op-b'] })
    assert.deepEqual(nurAndereKarte.allgemein, [])
    assert.deepEqual(nurAndereKarte.jeKarte, {})
    const andererTag = uebernahmeHinweisTexte(bleibt, { ...tag, dayId: 'day-2', karten: null })
    assert.deepEqual(andererTag.allgemein, [])
    const offen = uebernahmeHinweisSetzen(bleibt, 'op-a', {
      ...tag,
      text: ACTIVITY_HINWEIS_UNBESTAETIGT,
      seq: 3,
    })
    const unterdrueckt = uebernahmeHinweisTexte(offen, { ...tag, karten: ['op-b'] })
    assert.deepEqual(unterdrueckt.allgemein, [])
    assert.equal(unterdrueckt.jeKarte['op-b'], undefined)
    assert.equal(uebernahmeHinweisTexte(offen, { ...tag, karten: ['op-a'] }).jeKarte['op-a'], ACTIVITY_HINWEIS_UNBESTAETIGT)
  })

  test('null, Text, Wurf und eine falsche Form bleiben ehrlich und ohne automatische Wiederholung', () => {
    assert.equal(uebernahmeErgebnisLesen(null).art, 'gemeldet')
    assert.equal(uebernahmeErgebnisLesen('Der Punkt konnte nicht zugeordnet werden.').art, 'text')
    assert.equal(uebernahmeErgebnisLesen('').art, 'unbestaetigt')
    assert.equal(uebernahmeErgebnisLesen('   ').art, 'unbestaetigt')
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
  })
})
