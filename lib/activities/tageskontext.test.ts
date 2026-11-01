import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { activitySucheEingabeAusReise, tageskontextAusReise } from '@/lib/activities/tageskontext'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { activitySucheEingabeSchema } from '@/lib/activities/schema'

const EINGABE = {
  stage: {
    id: 'stage-1',
    name: 'Florenz',
    placeId: 'geonames:3176959',
    latitude: 43.77,
    longitude: 11.25,
    countryCode: null,
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


test('date-free discovery excludes more than forty unrelated items without mutating the trip', () => {
  const reise = beispielreise()
  const basis = reise.days[0].items[0]
  reise.days[1].items = Array.from({ length: 41 }, (_, i) => ({ ...basis, id: `other-${i}`, dayId: reise.days[1].id }))
  const vorher = JSON.stringify(reise)
  const eingabe = activitySucheEingabeAusReise(reise, reise.stages[0], null)
  assert.equal(activitySucheEingabeSchema.safeParse(eingabe).success, true)
  assert.equal(eingabe.day, null)
  assert.deepEqual(eingabe.items, [])
  const kontext = tageskontextAusReise(eingabe)
  assert.equal(kontext.evidenz.hatTag, false)
  assert.equal(kontext.evidenz.hatBelastbareZeiten, false)
  assert.equal(kontext.anfrage?.dayDate, null)
  const datiert = activitySucheEingabeAusReise(reise, reise.stages[0], reise.days[0])
  assert.equal(datiert.items.length, 1)
  assert.equal(datiert.items[0].id, basis.id)
  assert.equal(JSON.stringify(reise), vorher)
})
