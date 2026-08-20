import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { ACTIVITY_SUCHE_GRENZEN } from '@/lib/activities/domain'
import {
  activitySucheBegrenztLesen,
  activitySucheContentLengthUeberschritten,
  activitySucheHttpHeader,
  activitySucheInhaltstypOk,
  activitySucheKoerperLesen,
} from '@/lib/activities/anfrage'

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

describe('Aktivitätensuche-Anfrage', () => {
  test('nur application/json ist zulässig', () => {
    assert.equal(activitySucheInhaltstypOk('application/json'), true)
    assert.equal(activitySucheInhaltstypOk('application/json; charset=utf-8'), true)
    assert.equal(activitySucheInhaltstypOk('text/plain'), false)
    assert.equal(activitySucheInhaltstypOk(null), false)
  })

  test('Content-Length über dem Limit wird vor dem Lesen abgewiesen', () => {
    assert.equal(
      activitySucheContentLengthUeberschritten(String(ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes + 1)),
      true,
    )
    assert.equal(activitySucheContentLengthUeberschritten(String(ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes)), false)
    assert.equal(activitySucheContentLengthUeberschritten(null), false)
    assert.equal(activitySucheContentLengthUeberschritten('abc'), false)
  })

  test('ein Stream über dem Limit wird auch ohne bzw. mit irreführendem Content-Length abgewiesen', async () => {
    const zuGross = new Uint8Array(ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes + 1)
    const ohneLaenge = await activitySucheBegrenztLesen(stromAus([zuGross]))
    assert.equal(ohneLaenge.ok, false)
    if (!ohneLaenge.ok) assert.equal(ohneLaenge.status, 413)

    const irrefuehrendKlein = activitySucheContentLengthUeberschritten('10')
    assert.equal(irrefuehrendKlein, false)
    const trotzdem = await activitySucheBegrenztLesen(
      stromAus([new Uint8Array(10_000), new Uint8Array(7_000)]),
    )
    assert.equal(trotzdem.ok, false)
    if (!trotzdem.ok) assert.equal(trotzdem.status, 413)
  })

  test('ein Körper exakt am Limit wird gelesen, ein Byte mehr nicht', async () => {
    const genau = await activitySucheBegrenztLesen(
      stromAus([new Uint8Array(ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes)]),
    )
    assert.equal(genau.ok, true)
    if (genau.ok) assert.equal(new TextEncoder().encode(genau.text).length, ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes)

    const mehr = await activitySucheBegrenztLesen(
      stromAus([new Uint8Array(ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes), new Uint8Array(1)]),
    )
    assert.equal(mehr.ok, false)
    if (!mehr.ok) assert.equal(mehr.status, 413)
  })

  test('gültiges JSON wird gelesen, ungültiges mit 400 abgewiesen', () => {
    const gelesen = activitySucheKoerperLesen('{"trip":{}}')
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    assert.deepEqual(gelesen.wert, { trip: {} })

    const json = activitySucheKoerperLesen('{')
    assert.equal(json.ok, false)
    if (!json.ok) assert.equal(json.status, 400)
  })

  test('429 setzt Retry-After und cache-control: no-store', () => {
    assert.deepEqual(activitySucheHttpHeader(429, 42), {
      'cache-control': 'no-store',
      'retry-after': '42',
    })
    assert.deepEqual(activitySucheHttpHeader(200), { 'cache-control': 'no-store' })
    assert.equal('retry-after' in activitySucheHttpHeader(400, 12), false)
  })
})
