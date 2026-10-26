import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { activitySucheAntwortLesen, activitySucheFehlerAntwort, activitySucheVomClient } from '@/lib/activities/client-anfrage'
import { ACTIVITY_ABDECKUNGSHINWEIS, LEERE_ACTIVITY_EVIDENZ } from '@/lib/activities/domain'

describe('Aktivitätensuche im Client', () => {
  test('ein abgebrochener Request wirft AbortError und liefert keine Antwort', async () => {
    const steuerung = new AbortController()
    const fetchFn: typeof fetch = () =>
      new Promise((_, ablehnen) => {
        steuerung.signal.addEventListener('abort', () => {
          ablehnen(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        })
      })
    const lauf = activitySucheVomClient({ stage: { id: 's' } }, { signal: steuerung.signal, fetchFn })
    steuerung.abort()
    await assert.rejects(lauf, (fehler: unknown) => {
      assert.ok(fehler instanceof Error)
      assert.equal(fehler.name, 'AbortError')
      return true
    })
  })

  test('eine HTTP-Fehlerantwort ohne Meldung wird zum verständlichen Fehlerzustand', async () => {
    const fetchFn: typeof fetch = async () =>
      new Response(JSON.stringify({ status: 'error', options: [] }), { status: 500 })
    const antwort = await activitySucheVomClient({}, { fetchFn })
    assert.equal(antwort.status, 'error')
    assert.match(antwort.message, /fehlgeschlagen/)
    assert.deepEqual(antwort.evidenz, LEERE_ACTIVITY_EVIDENZ)
  })

  test('die Fehlerantwort enthält keinen Score und keine Rohdaten', () => {
    const antwort = activitySucheFehlerAntwort('Netz weg')
    assert.equal('score' in antwort, false)
    assert.equal(JSON.stringify(antwort).includes('score'), false)
  })

  test('ungültiges JSON wird zu einem sicheren Fehler ohne Rohtext', async () => {
    const fetchFn: typeof fetch = async () => new Response('<<kein json', { status: 200 })
    const antwort = await activitySucheVomClient({}, { fetchFn })
    assert.equal(antwort.status, 'error')
    assert.equal(antwort.options.length, 0)
    assert.equal(JSON.stringify(antwort).includes('kein json'), false)
  })

  test('eine nicht erfolgreiche Antwort in Erfolgsform ist nicht handlungsfähig', () => {
    const antwort = activitySucheAntwortLesen(
      {
        status: 'ok',
        message: 'ROH-ERFOLG',
        options: [option()],
        evidenz: evidenz(),
      },
      500,
    )
    assert.equal(antwort.status, 'error')
    assert.equal(antwort.options.length, 0)
    assert.equal(JSON.stringify(antwort).includes('ROH-ERFOLG'), false)
    assert.equal(JSON.stringify(antwort).includes('Uffizien'), false)
  })

  test('ein ungültiges Angebot wird nicht als Erfolg dargestellt', () => {
    const kaputt = option()
    delete (kaputt as { title?: string }).title
    const antwort = activitySucheAntwortLesen(
      { status: 'ok', message: 'Aktivitäten gefunden.', evidenz: evidenz(), options: [kaputt] },
      200,
    )
    assert.equal(antwort.status, 'invalid')
    assert.equal(antwort.options.length, 0)
  })

  test('gültige Teilergebnisse, leere Antworten und Limits bleiben erhalten', () => {
    const teilweise = activitySucheAntwortLesen(
      {
        status: 'partial',
        message: 'Einige Angebote konnten nicht gelesen werden.',
        evidenz: evidenz(),
        options: [option()],
        debug: 'intern',
      },
      200,
    )
    assert.equal(teilweise.status, 'partial')
    assert.equal(teilweise.options.length, 1)
    assert.equal(teilweise.options[0]?.title, 'Uffizien')
    assert.equal(JSON.stringify(teilweise).includes('intern'), false)
    assert.equal('score' in teilweise.options[0]!, false)

    const leer = activitySucheAntwortLesen(
      { status: 'empty', message: 'Keine passenden Aktivitäten.', evidenz: evidenz(), options: [option()] },
      200,
    )
    assert.equal(leer.status, 'empty')
    assert.equal(leer.options.length, 0)

    const limit = activitySucheAntwortLesen(
      { status: 'rate_limited', message: 'Bitte warte einen Moment.', options: [option()] },
      429,
    )
    assert.equal(limit.status, 'rate_limited')
    assert.equal(limit.options.length, 0)
    assert.match(limit.message, /warte/)
    assert.equal(limit.coverageNote, ACTIVITY_ABDECKUNGSHINWEIS)
  })

  test('ein Geheimnisfeld wird nicht in die sichtbare Antwort übernommen', () => {
    const antwort = activitySucheAntwortLesen(
      { status: 'ok', message: 'Aktivitäten gefunden.', evidenz: evidenz(), options: [option()], score: 0.9 },
      200,
    )
    assert.equal(antwort.status, 'error')
    assert.equal(JSON.stringify(antwort).includes('score'), false)
    assert.equal(antwort.options.length, 0)
  })
})

function evidenz() {
  return {
    hatOrt: true,
    hatKoordinaten: true,
    hatTag: true,
    hatDatum: true,
    hatBestehendePunkte: false,
    hatBelastbareZeiten: false,
    hatInteressen: false,
    hatBudget: false,
  }
}

function option() {
  return {
    id: 'opt-1',
    provider: 'test-activity',
    externalRef: 'ref-1',
    title: 'Uffizien',
    description: null,
    locationName: 'Florenz',
    punkt: { lat: 43.77, lon: 11.25 },
    dauerMinuten: 90,
    timeslot: {
      startsOn: '2026-09-12',
      startsAt: '15:00',
      endsOn: '2026-09-12',
      endsAt: '16:30',
    },
    preis: 28,
    preisWaehrung: 'CHF',
    bewertung: 9.1,
    bewertungenAnzahl: 1200,
    stornierbar: true,
    kategorien: ['culture'],
    tags: ['museum'],
    labels: ['jetnity'],
    reasons: ['Passt zu den Interessen dieser Reise.'],
    konflikt: 'frei',
  }
}
