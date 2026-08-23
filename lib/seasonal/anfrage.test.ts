import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  seasonalBegrenztLesen,
  seasonalContentLengthUeberschritten,
  seasonalHttpHeader,
  seasonalInhaltstypOk,
  seasonalKoerperLesen,
} from '@/lib/seasonal/anfrage'
import { seasonalEvaluationsPruefen } from '@/lib/seasonal/auswerten'
import { SEASONAL_GRENZEN } from '@/lib/seasonal/domain'
import { seasonalAnfrageErlaubt, seasonalRateLeeren } from '@/lib/seasonal/rate-limit'
import { seasonalAnfrageSchema } from '@/lib/seasonal/schema'

describe('Seasonal-API-Hülle', () => {
  test('Body-Cap über Content-Length', () => {
    assert.equal(seasonalContentLengthUeberschritten(String(SEASONAL_GRENZEN.maxAnfrageBytes + 1)), true)
    assert.equal(seasonalContentLengthUeberschritten('100'), false)
  })

  test('Body-Cap beim Lesen', async () => {
    const bytes = new Uint8Array(200).fill(65)
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes)
        controller.close()
      },
    })
    const gelesen = await seasonalBegrenztLesen(body, 50)
    assert.equal(gelesen.ok, false)
  })

  test('Antworten sind privat und nicht öffentlich gecacht', () => {
    assert.equal(seasonalHttpHeader()['cache-control'], 'private, no-store')
  })

  test('nur application/json', () => {
    assert.equal(seasonalInhaltstypOk('application/json'), true)
    assert.equal(seasonalInhaltstypOk('text/plain'), false)
  })

  test('ungültiges JSON', () => {
    assert.equal(seasonalKoerperLesen('{').ok, false)
  })

  test('Rate-Limit blockiert nach zu vielen Anfragen', () => {
    seasonalRateLeeren()
    let begrenzt = false
    for (let i = 0; i < 25; i += 1) {
      const ergebnis = seasonalAnfrageErlaubt('seasonal-ip', () => 1_000)
      if (!ergebnis.ok) {
        begrenzt = true
        break
      }
    }
    assert.equal(begrenzt, true)
    seasonalRateLeeren()
  })

  test('unmögliches Kalenderdatum in der Seasonal-Anfrage wird verworfen', () => {
    const geprueft = seasonalAnfrageSchema.safeParse({
      startDate: '2026-02-31',
      endDate: '2026-09-16',
      stages: [{ id: 'stage-1', name: 'Bangkok', countryCode: 'TH' }],
    })
    assert.equal(geprueft.success, false)
  })

  test('Browser kann Seasonal-Evidence nicht setzen', async () => {
    const geprueft = seasonalAnfrageSchema.safeParse({
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      officialResult: 'good',
      llmResult: 'beste Monate',
      seasonalFacts: [{ category: 'monsoon', outcome: 'favorable_context' }],
      evaluations: [{ presentationClass: 'information' }],
      citizenships: [{ countryCode: 'CH' }],
      stages: [{ id: 'stage-1', name: 'Bangkok', countryCode: 'TH' }],
    })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Anfrage sollte gültig sein')
    const evaluations = await seasonalEvaluationsPruefen(geprueft.data)
    assert.equal(evaluations.every((eintrag) => eintrag.presentationClass === 'unknown'), true)
    assert.equal(evaluations.every((eintrag) => eintrag.evidence.authority === null), true)
  })
})
