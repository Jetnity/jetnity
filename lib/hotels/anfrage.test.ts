import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { HOTEL_SUCHE_GRENZEN } from '@/lib/hotels/domain'
import {
  hotelSucheBegrenztLesen,
  hotelSucheContentLengthUeberschritten,
  hotelSucheHttpHeader,
  hotelSucheInhaltstypOk,
  hotelSucheKoerperLesen,
} from '@/lib/hotels/anfrage'

function stromAus(teile: Uint8Array[]): ReadableStream<Uint8Array> {
  let index = 0
  return new ReadableStream({
    pull(controller) {
      if (index >= teile.length) {
        controller.close()
        return
      }
      controller.enqueue(teile[index]!)
      index += 1
    },
  })
}

describe('Hotelsuche-Anfrage', () => {
  test('nur application/json ist zulässig', () => {
    assert.equal(hotelSucheInhaltstypOk('application/json'), true)
    assert.equal(hotelSucheInhaltstypOk('application/json; charset=utf-8'), true)
    assert.equal(hotelSucheInhaltstypOk('text/plain'), false)
    assert.equal(hotelSucheInhaltstypOk(null), false)
  })

  test('Content-Length über dem Limit wird vor dem Lesen abgewiesen', () => {
    assert.equal(hotelSucheContentLengthUeberschritten(String(HOTEL_SUCHE_GRENZEN.maxAnfrageBytes + 1)), true)
    assert.equal(hotelSucheContentLengthUeberschritten(String(HOTEL_SUCHE_GRENZEN.maxAnfrageBytes)), false)
    assert.equal(hotelSucheContentLengthUeberschritten(null), false)
    assert.equal(hotelSucheContentLengthUeberschritten('abc'), false)
  })

  test('ein Stream über dem Limit wird auch ohne bzw. mit irreführendem Content-Length abgewiesen', async () => {
    const zuGross = new Uint8Array(HOTEL_SUCHE_GRENZEN.maxAnfrageBytes + 1)
    const ohneLaenge = await hotelSucheBegrenztLesen(stromAus([zuGross]))
    assert.equal(ohneLaenge.ok, false)
    if (!ohneLaenge.ok) assert.equal(ohneLaenge.status, 413)

    const irrefuehrendKlein = hotelSucheContentLengthUeberschritten('10')
    assert.equal(irrefuehrendKlein, false)
    const trotzdem = await hotelSucheBegrenztLesen(
      stromAus([new Uint8Array(10_000), new Uint8Array(7_000)]),
    )
    assert.equal(trotzdem.ok, false)
    if (!trotzdem.ok) assert.equal(trotzdem.status, 413)
  })

  test('ein Körper exakt am Limit wird gelesen, ein Byte mehr nicht', async () => {
    const genau = await hotelSucheBegrenztLesen(stromAus([new Uint8Array(HOTEL_SUCHE_GRENZEN.maxAnfrageBytes)]))
    assert.equal(genau.ok, true)
    if (genau.ok) assert.equal(new TextEncoder().encode(genau.text).length, HOTEL_SUCHE_GRENZEN.maxAnfrageBytes)

    const mehr = await hotelSucheBegrenztLesen(
      stromAus([new Uint8Array(HOTEL_SUCHE_GRENZEN.maxAnfrageBytes), new Uint8Array(1)]),
    )
    assert.equal(mehr.ok, false)
    if (!mehr.ok) assert.equal(mehr.status, 413)
  })

  test('gültiges JSON wird gelesen, ungültiges mit 400 abgewiesen', () => {
    const gelesen = hotelSucheKoerperLesen('{"rooms":1}')
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    assert.deepEqual(gelesen.wert, { rooms: 1 })

    const json = hotelSucheKoerperLesen('{')
    assert.equal(json.ok, false)
    if (!json.ok) assert.equal(json.status, 400)
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
