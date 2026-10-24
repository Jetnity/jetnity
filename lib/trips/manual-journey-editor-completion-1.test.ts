import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  feldFolgtVorgabe,
  gleicherEditorKontext,
  verbindungsVorgabeAus,
  vorgabeSchluessel,
} from '@/lib/trips/manual-journey-editor-completion-1'
import type { Trip } from '@/types/trips'

const reise = {
  origin: 'Zürich',
  startDate: '2026-11-02',
  stages: [{ name: 'Bern' }],
  days: [{ id: 'day-1' }],
} as Pick<Trip, 'origin' | 'startDate' | 'stages' | 'days'>

test('editor context is trip plus target', () => {
  assert.equal(
    gleicherEditorKontext({ reiseId: 'trip-a', zielId: 'item-a' }, { reiseId: 'trip-a', zielId: 'item-a' }),
    true,
  )
  assert.equal(
    gleicherEditorKontext({ reiseId: 'trip-a', zielId: 'item-a' }, { reiseId: 'trip-a', zielId: 'item-b' }),
    false,
  )
  assert.equal(
    gleicherEditorKontext({ reiseId: 'trip-a', zielId: 'item-a' }, { reiseId: 'trip-b', zielId: 'item-a' }),
    false,
  )
})

test('absent preset uses the trip, and an explicit preset does not borrow the trip date or day', () => {
  const offen = verbindungsVorgabeAus(reise)
  assert.equal(offen.mode, 'rail')
  assert.equal(offen.originName, 'Zürich')
  assert.equal(offen.destinationName, 'Bern')
  assert.equal(offen.startsOn, '2026-11-02')
  assert.equal(offen.dayId, 'day-1')
  assert.equal(offen.originPlaceId, null)

  const gesetzt = verbindungsVorgabeAus(reise, {
    mode: 'transfer',
    originName: 'ZRH',
    destinationName: 'BRN',
    originPlaceId: 'airport:ZRH',
    destinationPlaceId: 'airport:BRN',
    dayId: 'day-2',
    startsOn: null,
  })
  assert.equal(gesetzt.mode, 'transfer')
  assert.equal(gesetzt.startsOn, '')
  assert.equal(gesetzt.dayId, 'day-2')
  assert.equal(gesetzt.originPlaceId, 'airport:ZRH')
  assert.notEqual(vorgabeSchluessel(offen), vorgabeSchluessel(gesetzt))
  assert.equal(vorgabeSchluessel(gesetzt), vorgabeSchluessel({ ...gesetzt }))
})

test('a clean field follows the preset and a changed field does not', () => {
  assert.equal(feldFolgtVorgabe('Zürich', 'Zürich'), true)
  assert.equal(feldFolgtVorgabe('Basel', 'Zürich'), false)
})
