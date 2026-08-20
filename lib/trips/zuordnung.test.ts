// lib/trips/zuordnung.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { etappeFuerTag, tageEtappenZuordnen } from '@/lib/trips/zuordnung'
import type { Trip, TripDay, TripStage } from '@/types/trips'

const JETZT = '2026-08-20T08:00:00.000Z'

function reise(etappen: TripStage[], tage: TripDay[]): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Test',
    origin: null,
    originPlaceId: null,
    startDate: null,
    endDate: null,
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: etappen,
    days: tage,
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

describe('Tage ohne stageId erhalten eine Etappe', () => {
  test('eine Etappe gilt für alle Tage', () => {
    const zugeordnet = tageEtappenZuordnen(
      reise(
        [{ id: 's1', position: 1, name: 'Rom', countryCode: null, arrivalDate: null, departureDate: null, latitude: null, longitude: null, placeId: null }],
        [
          { id: 'd1', stageId: null, dayIndex: 1, dayDate: null, title: null, items: [] },
          { id: 'd2', stageId: null, dayIndex: 2, dayDate: null, title: null, items: [] },
        ],
      ),
    )

    assert.equal(zugeordnet.days[0]?.stageId, 's1')
    assert.equal(zugeordnet.days[1]?.stageId, 's1')
  })

  test('ohne Datum werden Tage proportional aufgeteilt', () => {
    const zugeordnet = tageEtappenZuordnen(
      reise(
        [
          { id: 's1', position: 1, name: 'Florenz', countryCode: null, arrivalDate: null, departureDate: null, latitude: null, longitude: null, placeId: null },
          { id: 's2', position: 2, name: 'Rom', countryCode: null, arrivalDate: null, departureDate: null, latitude: null, longitude: null, placeId: null },
        ],
        [1, 2, 3, 4].map((nr) => ({
          id: `d${nr}`,
          stageId: null,
          dayIndex: nr,
          dayDate: null,
          title: null,
          items: [],
        })),
      ),
    )

    assert.equal(zugeordnet.days[0]?.stageId, 's1')
    assert.equal(zugeordnet.days[1]?.stageId, 's1')
    assert.equal(zugeordnet.days[2]?.stageId, 's2')
    assert.equal(zugeordnet.days[3]?.stageId, 's2')
  })

  test('mit Datum gewinnt der Etappenzeitraum', () => {
    const etappe = etappeFuerTag(
      { dayIndex: 2, dayDate: '2026-09-13', stageId: null },
      [
        {
          id: 's1',
          position: 1,
          name: 'Florenz',
          countryCode: 'IT',
          arrivalDate: '2026-09-12',
          departureDate: '2026-09-14',
          latitude: null,
          longitude: null,
        },
        {
          id: 's2',
          position: 2,
          name: 'Rom',
          countryCode: 'IT',
          arrivalDate: '2026-09-15',
          departureDate: '2026-09-16',
          latitude: null,
          longitude: null,
        },
      ],
      5,
    )

    assert.equal(etappe?.id, 's1')
  })

  test('eine gesetzte Zuordnung bleibt', () => {
    const zugeordnet = tageEtappenZuordnen(
      reise(
        [
          { id: 's1', position: 1, name: 'A', countryCode: null, arrivalDate: null, departureDate: null, latitude: null, longitude: null, placeId: null },
          { id: 's2', position: 2, name: 'B', countryCode: null, arrivalDate: null, departureDate: null, latitude: null, longitude: null, placeId: null },
        ],
        [{ id: 'd1', stageId: 's2', dayIndex: 1, dayDate: null, title: null, items: [] }],
      ),
    )

    assert.equal(zugeordnet.days[0]?.stageId, 's2')
  })
})
