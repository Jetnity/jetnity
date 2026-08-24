import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
  providerOpsRateKennungAus,
} from '@/lib/provider-ops'

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

describe('Provider-Ops Request-Härtung', () => {
  test('nur application/json ist zulässig', () => {
    assert.equal(providerOpsInhaltstypOk('application/json'), true)
    assert.equal(providerOpsInhaltstypOk('application/json; charset=utf-8'), true)
    assert.equal(providerOpsInhaltstypOk('text/plain'), false)
    assert.equal(providerOpsInhaltstypOk('application/xml'), false)
    assert.equal(providerOpsInhaltstypOk(null), false)
  })

  test('Content-Length über dem Limit wird vor dem Lesen abgewiesen', () => {
    assert.equal(providerOpsContentLengthUeberschritten('16385', 16_384), true)
    assert.equal(providerOpsContentLengthUeberschritten('16384', 16_384), false)
    assert.equal(providerOpsContentLengthUeberschritten(null, 16_384), false)
    assert.equal(providerOpsContentLengthUeberschritten('abc', 16_384), false)
  })

  test('ein Stream über dem Limit wird auch ohne Content-Length abgewiesen', async () => {
    const zuGross = new Uint8Array(51)
    const ohneLaenge = await providerOpsBegrenztLesen(stromAus([zuGross]), 50, 'Die Suchanfrage ist zu gross.')
    assert.equal(ohneLaenge.ok, false)
    if (!ohneLaenge.ok) {
      assert.equal(ohneLaenge.status, 413)
      assert.equal(ohneLaenge.message, 'Die Suchanfrage ist zu gross.')
    }
  })

  test('gültiges JSON wird gelesen, ungültiges mit 400 abgewiesen', () => {
    const gelesen = providerOpsKoerperLesen('{"rooms":1}', 'Die Suchanfrage war kein gültiges JSON.')
    assert.equal(gelesen.ok, true)
    if (gelesen.ok) assert.deepEqual(gelesen.wert, { rooms: 1 })

    const json = providerOpsKoerperLesen('{', 'Die Suchanfrage war kein gültiges JSON.')
    assert.equal(json.ok, false)
    if (!json.ok) {
      assert.equal(json.status, 400)
      assert.equal(json.message, 'Die Suchanfrage war kein gültiges JSON.')
    }
  })

  test('429 setzt Retry-After, andere Status nicht', () => {
    assert.deepEqual(providerOpsHttpHeader({ httpStatus: 429, retryAfterSec: 12, cacheControl: 'no-store' }), {
      'cache-control': 'no-store',
      'retry-after': '12',
    })
    assert.deepEqual(providerOpsHttpHeader({ cacheControl: 'private, no-store' }), {
      'cache-control': 'private, no-store',
    })
    assert.equal('retry-after' in providerOpsHttpHeader({ httpStatus: 400, retryAfterSec: 12 }), false)
  })

  test('Rate-Kennung nimmt den ersten X-Forwarded-For-Hop', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.8, 10.0.0.1' })
    assert.equal(providerOpsRateKennungAus(headers, 'ip'), 'ip:203.0.113.8')
    assert.equal(providerOpsRateKennungAus(headers, 'plain'), '203.0.113.8')
    assert.equal(providerOpsRateKennungAus(new Headers(), 'plain'), 'unbekannt')
  })
})
