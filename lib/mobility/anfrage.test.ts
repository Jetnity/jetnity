import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  mobilitySucheBegrenztLesen,
  mobilitySucheContentLengthUeberschritten,
  mobilitySucheInhaltstypOk,
} from '@/lib/mobility/anfrage'

describe('Mobilitätssuche Anfragehülle', () => {
  test('nimmt nur JSON an', () => {
    assert.equal(mobilitySucheInhaltstypOk('application/json'), true)
    assert.equal(mobilitySucheInhaltstypOk('text/plain'), false)
  })

  test('lehnt einen zu großen Content-Length ab, bevor der Body gelesen wird', () => {
    assert.equal(mobilitySucheContentLengthUeberschritten(String(20_000)), true)
    assert.equal(mobilitySucheContentLengthUeberschritten('100'), false)
  })

  test('bricht das Stream-Lesen an der Bytegrenze ab', async () => {
    const bytes = new Uint8Array(100)
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes)
        controller.close()
      },
    })
    const ergebnis = await mobilitySucheBegrenztLesen(stream, 40)
    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.status, 413)
  })
})
