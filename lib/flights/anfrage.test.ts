import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { FLUG_SUCHE_GRENZEN } from '@/lib/flights/domain'
import {
  flugSucheBegrenztLesen,
  flugSucheContentLengthUeberschritten,
  flugSucheHttpHeader,
  flugSucheInhaltstypOk,
  flugSucheKoerperLesen,
} from '@/lib/flights/anfrage'

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

describe('Flugsuche-Anfrage', () => {
  test('nur application/json ist zulässig', () => {
    assert.equal(flugSucheInhaltstypOk('application/json'), true)
    assert.equal(flugSucheInhaltstypOk('application/json; charset=utf-8'), true)
    assert.equal(flugSucheInhaltstypOk('text/plain'), false)
    assert.equal(flugSucheInhaltstypOk(null), false)
  })

  test('Content-Length über dem Limit wird vor dem Lesen abgewiesen', () => {
    assert.equal(flugSucheContentLengthUeberschritten(String(FLUG_SUCHE_GRENZEN.maxAnfrageBytes + 1)), true)
    assert.equal(flugSucheContentLengthUeberschritten(String(FLUG_SUCHE_GRENZEN.maxAnfrageBytes)), false)
    assert.equal(flugSucheContentLengthUeberschritten(null), false)
    assert.equal(flugSucheContentLengthUeberschritten('abc'), false)
  })

  test('ein Stream über dem Limit wird auch ohne Content-Length abgewiesen', async () => {
    const zuGross = new Uint8Array(FLUG_SUCHE_GRENZEN.maxAnfrageBytes + 1)
    const ohneLaenge = await flugSucheBegrenztLesen(stromAus([zuGross]))
    assert.equal(ohneLaenge.ok, false)
    if (!ohneLaenge.ok) assert.equal(ohneLaenge.status, 413)
  })

  test('gültiges JSON wird gelesen, ungültiges mit 400 abgewiesen', () => {
    const gelesen = flugSucheKoerperLesen('{"legs":[]}')
    assert.equal(gelesen.ok, true)
    if (gelesen.ok) assert.deepEqual(gelesen.wert, { legs: [] })

    const json = flugSucheKoerperLesen('{')
    assert.equal(json.ok, false)
    if (!json.ok) assert.equal(json.status, 400)
  })

  test('429 setzt Retry-After und cache-control: no-store', () => {
    assert.deepEqual(flugSucheHttpHeader(429, 42), {
      'cache-control': 'no-store',
      'retry-after': '42',
    })
    assert.deepEqual(flugSucheHttpHeader(200), { 'cache-control': 'no-store' })
    assert.equal('retry-after' in flugSucheHttpHeader(400, 12), false)
  })
})
