// lib/readiness/anfrage.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  readinessBegrenztLesen,
  readinessContentLengthUeberschritten,
  readinessHttpHeader,
  readinessInhaltstypOk,
  readinessKoerperLesen,
} from '@/lib/readiness/anfrage'
import { officialRequirementsPruefen } from '@/lib/readiness/anforderungen'
import { readinessAnfrageErlaubt, readinessRateLeeren } from '@/lib/readiness/rate-limit'
import { readinessAnforderungAnfrageSchema } from '@/lib/readiness/schema'

describe('Readiness-API-Hülle', () => {
  test('Body-Cap über Content-Length', () => {
    assert.equal(readinessContentLengthUeberschritten('8193'), true)
    assert.equal(readinessContentLengthUeberschritten('100'), false)
  })

  test('Body-Cap beim Lesen', async () => {
    const bytes = new Uint8Array(9000).fill(65)
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes)
        controller.close()
      },
    })
    const gelesen = await readinessBegrenztLesen(body, 100)
    assert.equal(gelesen.ok, false)
    if (!gelesen.ok) assert.equal(gelesen.status, 413)
  })

  test('Antworten sind privat und nicht öffentlich gecacht', () => {
    assert.equal(readinessHttpHeader()['cache-control'], 'private, no-store')
  })

  test('nur application/json', () => {
    assert.equal(readinessInhaltstypOk('application/json'), true)
    assert.equal(readinessInhaltstypOk('text/plain'), false)
  })

  test('ungültiges JSON', () => {
    const gelesen = readinessKoerperLesen('{')
    assert.equal(gelesen.ok, false)
  })

  test('Rate-Limit blockiert nach zu vielen Anfragen', () => {
    readinessRateLeeren()
    let begrenzt = false
    for (let i = 0; i < 25; i += 1) {
      const ergebnis = readinessAnfrageErlaubt('test-ip', () => 1_000)
      if (!ergebnis.ok) {
        begrenzt = true
        assert.ok(ergebnis.retryAfterSec > 0)
        break
      }
    }
    assert.equal(begrenzt, true)
    readinessRateLeeren()
  })

  test('Browser kann official Evidence nicht vortäuschen', () => {
    const geprueft = readinessAnforderungAnfrageSchema.safeParse({
      destinationCountryCode: 'TH',
      officialResult: 'not_required',
      authority: 'Fake',
    })
    assert.equal(geprueft.success, true)
    const official = officialRequirementsPruefen(geprueft.success ? geprueft.data : {})
    assert.equal(official.result, 'unknown')
    assert.equal(official.authority, null)
  })
})
