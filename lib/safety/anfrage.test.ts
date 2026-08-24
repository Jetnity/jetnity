import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  safetyBegrenztLesen,
  safetyContentLengthUeberschritten,
  safetyHttpHeader,
  safetyInhaltstypOk,
  safetyKoerperLesen,
} from '@/lib/safety/anfrage'
import { safetyEvaluationsPruefen } from '@/lib/safety/auswerten'
import { SAFETY_GRENZEN } from '@/lib/safety/domain'
import { safetyAnfrageErlaubt, safetyRateLeeren } from '@/lib/safety/rate-limit'
import { safetyAnfrageSchema } from '@/lib/safety/schema'

describe('Safety-API-Hülle', () => {
  test('Body-Cap über Content-Length', () => {
    assert.equal(safetyContentLengthUeberschritten(String(SAFETY_GRENZEN.maxAnfrageBytes + 1)), true)
    assert.equal(safetyContentLengthUeberschritten('100'), false)
  })

  test('Body-Cap beim Lesen', async () => {
    const bytes = new Uint8Array(200).fill(65)
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes)
        controller.close()
      },
    })
    const gelesen = await safetyBegrenztLesen(body, 50)
    assert.equal(gelesen.ok, false)
  })

  test('Antworten sind privat und nicht öffentlich gecacht', () => {
    assert.equal(safetyHttpHeader()['cache-control'], 'private, no-store')
  })

  test('nur application/json', () => {
    assert.equal(safetyInhaltstypOk('application/json'), true)
    assert.equal(safetyInhaltstypOk('text/plain'), false)
  })

  test('ungültiges JSON', () => {
    assert.equal(safetyKoerperLesen('{').ok, false)
  })

  test('Rate-Limit blockiert nach zu vielen Anfragen', async () => {
    safetyRateLeeren()
    let begrenzt = false
    for (let i = 0; i < 25; i += 1) {
      const ergebnis = await safetyAnfrageErlaubt('safety-ip', () => 1_000)
      if (!ergebnis.ok) {
        begrenzt = true
        break
      }
    }
    assert.equal(begrenzt, true)
    safetyRateLeeren()
  })

  test('unmögliches Kalenderdatum in der Safety-Anfrage wird verworfen', () => {
    const geprueft = safetyAnfrageSchema.safeParse({
      startDate: '2026-02-31',
      endDate: '2026-09-16',
      stages: [{ id: 'stage-1', name: 'Florenz', countryCode: 'IT' }],
    })
    assert.equal(geprueft.success, false)
  })

  test('Browser kann Safety-Evidence nicht setzen', async () => {
    const geprueft = safetyAnfrageSchema.safeParse({
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      officialResult: 'safe',
      llmResult: 'critical',
      safetyFacts: [{ category: 'earthquake' }],
      evaluations: [{ presentationClass: 'critical_warning' }],
      stages: [{ id: 'stage-1', name: 'Florenz', countryCode: 'IT' }],
    })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Anfrage sollte gültig sein')
    const evaluations = await safetyEvaluationsPruefen(geprueft.data)
    assert.equal(evaluations.every((eintrag) => eintrag.presentationClass === 'unknown'), true)
    assert.equal(evaluations.every((eintrag) => eintrag.evidence.authority === null), true)
  })
})
