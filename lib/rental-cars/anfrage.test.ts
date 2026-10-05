import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  rentalCarSucheBegrenztLesen,
  rentalCarSucheContentLengthUeberschritten,
  rentalCarSucheHttpHeader,
  rentalCarSucheInhaltstypOk,
  rentalCarSucheKoerperLesen,
} from '@/lib/rental-cars/anfrage'

describe('Mietwagensuche Anfragehülle', () => {
  test('nimmt nur JSON an', () => {
    assert.equal(rentalCarSucheInhaltstypOk('application/json'), true)
    assert.equal(rentalCarSucheInhaltstypOk('text/plain'), false)
  })

  test('lehnt einen zu großen Content-Length ab, bevor der Body gelesen wird', () => {
    assert.equal(rentalCarSucheContentLengthUeberschritten(String(20_000)), true)
    assert.equal(rentalCarSucheContentLengthUeberschritten('100'), false)
  })

  test('bricht das Stream-Lesen an der Bytegrenze ab', async () => {
    const bytes = new Uint8Array(100)
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes)
        controller.close()
      },
    })
    const ergebnis = await rentalCarSucheBegrenztLesen(stream, 40)
    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.status, 413)
  })

  test('ungültiges JSON wird abgelehnt', () => {
    const gelesen = rentalCarSucheKoerperLesen('{nein')
    assert.equal(gelesen.ok, false)
    if (!gelesen.ok) assert.equal(gelesen.status, 400)
  })

  test('429 setzt Retry-After', () => {
    const header = rentalCarSucheHttpHeader(429, 12)
    assert.equal(header['retry-after'], '12')
    assert.equal(header['cache-control'], 'no-store')
  })
})
