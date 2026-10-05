import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { activitySucheFehlerAntwort, activitySucheVomClient } from '@/lib/activities/client-anfrage'
import { LEERE_ACTIVITY_EVIDENZ } from '@/lib/activities/domain'

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
})
