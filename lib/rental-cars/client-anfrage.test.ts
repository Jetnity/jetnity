import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarSucheFehlerAntwort, rentalCarSucheVomClient } from '@/lib/rental-cars/client-anfrage'
import { LEERE_RENTAL_EVIDENZ } from '@/lib/rental-cars/domain'
import type { RentalCarSucheEingabe } from '@/lib/rental-cars/schema'

const ANFRAGE: RentalCarSucheEingabe = {
  pickupName: 'Zürich Flughafen',
  dropoffName: 'Lugano Zentrum',
  pickupPlaceId: null,
  dropoffPlaceId: null,
  pickupOn: '2026-09-12',
  pickupAt: null,
  dropoffOn: '2026-09-16',
  dropoffAt: null,
  vehicleClass: null,
  transmission: null,
  currency: 'CHF',
}

describe('Mietwagensuche im Client', () => {
  test('ein abgebrochener Request wirft AbortError und liefert keine Antwort', async () => {
    const steuerung = new AbortController()
    const fetchFn: typeof fetch = () =>
      new Promise((_, ablehnen) => {
        steuerung.signal.addEventListener('abort', () => {
          ablehnen(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        })
      })
    const lauf = rentalCarSucheVomClient(ANFRAGE, { signal: steuerung.signal, fetchFn })
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
    const antwort = await rentalCarSucheVomClient(ANFRAGE, { fetchFn })
    assert.equal(antwort.status, 'error')
    assert.match(antwort.message, /nicht verfügbar/)
    assert.deepEqual(antwort.evidenz, LEERE_RENTAL_EVIDENZ)
  })

  test('die Fehlerantwort enthält keinen Score und keine Rohdaten', () => {
    const antwort = rentalCarSucheFehlerAntwort('Netz weg')
    assert.equal('score' in antwort, false)
    assert.equal(JSON.stringify(antwort).includes('score'), false)
  })
})
