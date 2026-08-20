import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  activityReisegraphMitTimeslotPruefen,
  activityReisegraphPruefen,
  activityTimeslotPasstZumTag,
} from '@/lib/activities/reisegraph'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

describe('Aktivitäts-Reisegraph', () => {
  test('eine fremde Etappe oder ein Tag einer anderen Etappe wird abgewiesen', () => {
    const reise = beispielreise()
    const fremd = activityReisegraphPruefen(reise, {
      tripId: reise.id,
      stageId: 'stage-fremd',
      dayId: 'day-1',
    })
    const andererTag = activityReisegraphPruefen(reise, {
      tripId: reise.id,
      stageId: 'stage-1',
      dayId: 'day-4',
    })
    const fehlt = activityReisegraphPruefen(reise, {
      tripId: reise.id,
      stageId: 'stage-1',
      dayId: 'day-fehlt',
    })
    assert.equal(fremd.ok, false)
    assert.equal(andererTag.ok, false)
    assert.equal(fehlt.ok, false)
    if (fremd.ok || andererTag.ok || fehlt.ok) return
    assert.equal(fremd.art, 'etappe-fremd')
    assert.equal(andererTag.art, 'tag-etappe')
    assert.equal(fehlt.art, 'tag-fremd')
  })

  test('eine passende Etappe und der zugehörige Tag werden angenommen', () => {
    const reise = beispielreise()
    const ergebnis = activityReisegraphPruefen(reise, {
      tripId: reise.id,
      stageId: 'stage-1',
      dayId: 'day-1',
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.tag.id, 'day-1')
    assert.equal(ergebnis.etappe.id, 'stage-1')
  })

  test('ein Timeslot an einem anderen Tag wird nicht still korrigiert', () => {
    const reise = beispielreise()
    const ergebnis = activityReisegraphMitTimeslotPruefen(
      reise,
      { tripId: reise.id, stageId: 'stage-1', dayId: 'day-1' },
      {
        startsOn: '2026-09-13',
        startsAt: '15:00',
        endsOn: '2026-09-13',
        endsAt: '16:30',
      },
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'timeslot-tag')
  })

  test('ein Timeslot ohne Tagesdatum fällt fail-closed', () => {
    assert.equal(
      activityTimeslotPasstZumTag(
        {
          startsOn: '2026-09-12',
          startsAt: '15:00',
          endsOn: null,
          endsAt: null,
        },
        { dayDate: null },
      ),
      false,
    )
  })
})
