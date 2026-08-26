import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DAY_STAGE_ASSIGNMENT_SOURCES,
  darfClientStagePositionUebernehmen,
  darfProportionalZuordnen,
  dayStageAssignmentSourceAbleiten,
  dayStageAssignmentSourceIstReserviert,
  dayStageAssignmentSourceLesen,
} from '@/lib/trips/day-stage-assignment'

describe('TW6 Day→Stage Assignment Source', () => {
  test('die vier Semantiken bleiben unterscheidbar', () => {
    assert.deepEqual([...DAY_STAGE_ASSIGNMENT_SOURCES], [
      'legacy_fallback',
      'unassigned',
      'single_destination',
      'user',
    ])
  })

  test('fehlender oder unbekannter Wert bleibt Legacy-Fallback', () => {
    assert.equal(dayStageAssignmentSourceLesen(undefined), 'legacy_fallback')
    assert.equal(dayStageAssignmentSourceLesen(null), 'legacy_fallback')
    assert.equal(dayStageAssignmentSourceLesen(''), 'legacy_fallback')
    assert.equal(dayStageAssignmentSourceLesen('erfunden'), 'legacy_fallback')
  })

  test('ein Ziel wird immer single_destination, auch bei gefälschtem Claim', () => {
    assert.equal(dayStageAssignmentSourceAbleiten({ stageCount: 1 }), 'single_destination')
    assert.equal(
      dayStageAssignmentSourceAbleiten({ stageCount: 1, claimed: 'unassigned' }),
      'single_destination',
    )
    assert.equal(
      dayStageAssignmentSourceAbleiten({ stageCount: 1, claimed: 'user' }),
      'single_destination',
    )
    assert.equal(
      dayStageAssignmentSourceAbleiten({ stageCount: 1, claimed: 'legacy_fallback' }),
      'single_destination',
    )
  })

  test('neue Multi-Ziel-Reise ohne Positionen bleibt unassigned', () => {
    assert.equal(dayStageAssignmentSourceAbleiten({ stageCount: 3 }), 'unassigned')
    assert.equal(
      dayStageAssignmentSourceAbleiten({
        stageCount: 3,
        claimed: 'legacy_fallback',
        daysHaveStagePosition: false,
      }),
      'unassigned',
    )
    assert.equal(
      dayStageAssignmentSourceAbleiten({
        stageCount: 3,
        claimed: 'user',
        daysHaveStagePosition: false,
      }),
      'unassigned',
    )
    assert.equal(
      dayStageAssignmentSourceAbleiten({
        stageCount: 3,
        claimed: 'single_destination',
      }),
      'unassigned',
    )
  })

  test('Legacy-Transfer mit bereits gesetzten Positionen bleibt legacy_fallback', () => {
    assert.equal(
      dayStageAssignmentSourceAbleiten({
        stageCount: 3,
        claimed: 'legacy_fallback',
        daysHaveStagePosition: true,
      }),
      'legacy_fallback',
    )
    assert.equal(
      dayStageAssignmentSourceAbleiten({
        stageCount: 2,
        daysHaveStagePosition: true,
      }),
      'legacy_fallback',
    )
  })

  test('Claim user wird nie persistiert', () => {
    assert.equal(dayStageAssignmentSourceIstReserviert('user'), true)
    assert.equal(
      dayStageAssignmentSourceAbleiten({
        stageCount: 3,
        claimed: 'user',
        daysHaveStagePosition: true,
      }),
      'unassigned',
    )
  })

  test('unassigned übernimmt keine Client-Position', () => {
    assert.equal(darfClientStagePositionUebernehmen('unassigned'), false)
    assert.equal(darfClientStagePositionUebernehmen('legacy_fallback'), true)
    assert.equal(darfClientStagePositionUebernehmen('single_destination'), true)
    assert.equal(darfProportionalZuordnen('unassigned'), false)
    assert.equal(darfProportionalZuordnen('legacy_fallback'), true)
    assert.equal(darfProportionalZuordnen('user'), false)
  })
})
