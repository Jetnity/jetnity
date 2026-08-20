import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { HOTEL_SUCHE_GRENZEN } from '@/lib/hotels/domain'
import {
  hotelSucheHttpHeader,
  hotelSucheInhaltstypOk,
  hotelSucheKoerperLesen,
} from '@/lib/hotels/anfrage'

describe('Hotelsuche-Anfrage', () => {
  test('nur application/json ist zulässig', () => {
    assert.equal(hotelSucheInhaltstypOk('application/json'), true)
    assert.equal(hotelSucheInhaltstypOk('application/json; charset=utf-8'), true)
    assert.equal(hotelSucheInhaltstypOk('text/plain'), false)
    assert.equal(hotelSucheInhaltstypOk(null), false)
  })

  test('zu grosse oder ungültige Körper werden mit 413 bzw. 400 abgewiesen', () => {
    const zuGross = 'x'.repeat(HOTEL_SUCHE_GRENZEN.maxAnfrageBytes + 1)
    const gross = hotelSucheKoerperLesen(zuGross)
    assert.equal(gross.ok, false)
    if (!gross.ok) assert.equal(gross.status, 413)

    const json = hotelSucheKoerperLesen('{')
    assert.equal(json.ok, false)
    if (!json.ok) assert.equal(json.status, 400)
  })

  test('gültiges JSON wird gelesen', () => {
    const gelesen = hotelSucheKoerperLesen('{"rooms":1}')
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    assert.deepEqual(gelesen.wert, { rooms: 1 })
  })

  test('429 setzt Retry-After und cache-control: no-store', () => {
    assert.deepEqual(hotelSucheHttpHeader(429, 42), {
      'cache-control': 'no-store',
      'retry-after': '42',
    })
    assert.deepEqual(hotelSucheHttpHeader(200), { 'cache-control': 'no-store' })
    assert.equal('retry-after' in hotelSucheHttpHeader(400, 12), false)
  })
})
