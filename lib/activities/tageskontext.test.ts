import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { tageskontextAusReise } from '@/lib/activities/tageskontext'

const EINGABE = {
  stage: {
    id: 'stage-1',
    name: 'Florenz',
    placeId: 'geonames:3176959',
    latitude: 43.77,
    longitude: 11.25,
  },
  day: {
    id: 'day-1',
    dayDate: '2026-09-12',
    stageId: 'stage-1',
  },
  trip: {
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4000,
    interests: ['culture' as const],
    pace: 'calm' as const,
  },
  items: [
    {
      id: 'item-1',
      kind: 'activity' as const,
      title: 'Dom',
      startsOn: '2026-09-12',
      startsAt: '09:00',
      endsOn: '2026-09-12',
      endsAt: '11:00',
    },
  ],
}

describe('Aktivitäts-Tageskontext', () => {
  test('nutzt nur vorhandene Reisedaten und erfindet keine Wegezeiten', () => {
    const { anfrage, evidenz } = tageskontextAusReise(EINGABE)
    assert.equal(anfrage?.destinationName, 'Florenz')
    assert.equal(anfrage?.dayDate, '2026-09-12')
    assert.equal(evidenz.hatOrt, true)
    assert.equal(evidenz.hatDatum, true)
    assert.equal(evidenz.hatBelastbareZeiten, true)
    assert.equal(evidenz.hatInteressen, true)
  })

  test('ohne Zielort gibt es keinen Suchkontext', () => {
    const { anfrage, evidenz } = tageskontextAusReise({
      ...EINGABE,
      stage: { ...EINGABE.stage, name: '   ' },
    })
    assert.equal(anfrage, null)
    assert.equal(evidenz.hatOrt, false)
  })

  test('ohne Uhrzeiten bleibt die Zeitlage unbekannt', () => {
    const { evidenz } = tageskontextAusReise({
      ...EINGABE,
      items: [
        {
          id: 'item-2',
          kind: 'note',
          title: 'Spaziergang',
          startsOn: '2026-09-12',
          startsAt: null,
          endsOn: null,
          endsAt: null,
        },
      ],
    })
    assert.equal(evidenz.hatBestehendePunkte, true)
    assert.equal(evidenz.hatBelastbareZeiten, false)
  })
})
