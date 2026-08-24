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

  test('rückwärts laufende Trip- und Stage-Daten werden fail-closed abgelehnt', () => {
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        startDate: '2026-09-20',
        endDate: '2026-09-10',
        stages: [{ id: 'stage-1', name: 'Bangkok', countryCode: 'TH' }],
      }).success,
      false,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        startDate: '2026-09-16',
        endDate: '2026-09-16',
        stages: [{ id: 'stage-1', name: 'Bangkok', countryCode: 'TH' }],
      }).success,
      true,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        startDate: '2026-09-10',
        endDate: '2026-09-20',
        stages: [
          {
            id: 'stage-1',
            name: 'Bangkok',
            countryCode: 'TH',
            arrivalDate: '2026-09-16',
            departureDate: '2026-09-12',
          },
        ],
      }).success,
      false,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        startDate: '2026-09-10',
        endDate: '2026-09-20',
        stages: [
          {
            id: 'stage-1',
            name: 'Bangkok',
            countryCode: 'TH',
            arrivalDate: '2026-09-12',
          },
        ],
      }).success,
      true,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        startDate: '2026-09-10',
        endDate: '2026-09-20',
        stages: [
          {
            id: 'stage-1',
            name: 'Bangkok',
            countryCode: 'TH',
            departureDate: '2026-09-16',
          },
        ],
      }).success,
      true,
    )
  })

  test('Tripgraph mit doppelten oder dangling Referenzen wird abgelehnt', () => {
    const basis = {
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      stages: [
        { id: 'stage-a', name: 'Bangkok', countryCode: 'TH', arrivalDate: '2026-09-12', departureDate: '2026-09-13' },
        { id: 'stage-b', name: 'Chiang Mai', countryCode: 'TH', arrivalDate: '2026-09-14', departureDate: '2026-09-16' },
      ],
      days: [
        { id: 'day-a', stageId: 'stage-a', dayDate: '2026-09-12' },
        { id: 'day-b', stageId: 'stage-b', dayDate: '2026-09-14' },
      ],
      items: [
        { id: 'item-a', kind: 'activity', title: 'Tempel', stageId: 'stage-a', dayId: 'day-a', startsOn: '2026-09-12' },
      ],
    }
    assert.equal(seasonalAnfrageSchema.safeParse(basis).success, true)
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        ...basis,
        stages: [
          { id: 'stage-x', name: 'A', countryCode: 'TH', arrivalDate: '2026-06-01', departureDate: '2026-06-05' },
          { id: 'stage-x', name: 'B', countryCode: 'TH', arrivalDate: '2026-09-01', departureDate: '2026-09-05' },
        ],
      }).success,
      false,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        ...basis,
        days: [
          { id: 'day-a', stageId: 'stage-a', dayDate: '2026-09-12' },
          { id: 'day-a', stageId: 'stage-b', dayDate: '2026-09-14' },
        ],
      }).success,
      false,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        ...basis,
        items: [
          { id: 'item-a', kind: 'activity', title: 'Tempel', stageId: 'stage-a', dayId: 'day-a' },
          { id: 'item-a', kind: 'activity', title: 'Markt', stageId: 'stage-b', dayId: 'day-b' },
        ],
      }).success,
      false,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        ...basis,
        days: [{ id: 'day-a', stageId: 'fehlt', dayDate: '2026-09-12' }],
      }).success,
      false,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        ...basis,
        items: [{ id: 'item-a', kind: 'activity', title: 'Tempel', stageId: 'fehlt', dayId: 'day-a' }],
      }).success,
      false,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        ...basis,
        items: [
          {
            id: 'flug-1',
            kind: 'flight',
            title: 'ZRH → BKK',
            stageId: 'stage-a',
            dayId: 'day-fehlt',
            routeItinerary: {
              v: 1,
              type: 'flight_route_itinerary',
              legs: [{ segments: [{ origin: { airportCode: 'ZRH' }, destination: { airportCode: 'BKK' } }] }],
            },
          },
        ],
      }).success,
      false,
    )
    assert.equal(
      seasonalAnfrageSchema.safeParse({
        ...basis,
        items: [{ id: 'item-a', kind: 'activity', title: 'Tempel', stageId: 'stage-b', dayId: 'day-a' }],
      }).success,
      false,
    )
  })

  test('gültiger Graph bleibt unverändert funktional und guest/account-paritätisch', async () => {
    const anfrage = {
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      stages: [{ id: 'stage-1', name: 'Bangkok', countryCode: 'TH' }],
      days: [{ id: 'day-1', stageId: 'stage-1', dayDate: '2026-09-12' }],
      items: [{ id: 'item-1', kind: 'activity', title: 'Tempel', stageId: 'stage-1', dayId: 'day-1' }],
    }
    const geprueft = seasonalAnfrageSchema.safeParse(anfrage)
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Anfrage sollte gültig sein')
    const gast = await seasonalEvaluationsPruefen(geprueft.data)
    const konto = await seasonalEvaluationsPruefen(geprueft.data)
    assert.deepEqual(
      gast.map((eintrag) => eintrag.factFingerprint),
      konto.map((eintrag) => eintrag.factFingerprint),
    )
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
