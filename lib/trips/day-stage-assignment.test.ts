import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DAY_STAGE_ASSIGNMENT_MODES,
  DayStageAssignmentFehler,
  darfClientStagePositionUebernehmen,
  darfProportionalZuordnen,
  dayStageAssignmentModeAbleiten,
  dayStageAssignmentModeFuerGast,
  dayStageAssignmentModeLesenDb,
  dayStagePositionenPruefen,
} from '@/lib/trips/day-stage-assignment'

describe('TW6 Day→Stage Assignment Mode', () => {
  test('die vier Modes bleiben unterscheidbar', () => {
    assert.deepEqual([...DAY_STAGE_ASSIGNMENT_MODES], [
      'legacy_fallback',
      'unassigned',
      'single_destination',
      'explicit',
    ])
  })

  test('persistierter DB-Bestand ohne Feld bleibt legacy_fallback', () => {
    assert.equal(dayStageAssignmentModeLesenDb(undefined), 'legacy_fallback')
    assert.equal(dayStageAssignmentModeLesenDb(null), 'legacy_fallback')
    assert.equal(dayStageAssignmentModeLesenDb(''), 'legacy_fallback')
    assert.equal(dayStageAssignmentModeLesenDb('erfunden'), 'legacy_fallback')
    assert.equal(dayStageAssignmentModeLesenDb('explicit'), 'explicit')
  })

  test('ein Ziel wird immer single_destination', () => {
    assert.equal(dayStageAssignmentModeAbleiten({ stageCount: 1 }), 'single_destination')
    assert.equal(
      dayStageAssignmentModeAbleiten({
        stageCount: 1,
        claimed: 'legacy_fallback',
        positions: [1],
      }),
      'single_destination',
    )
    assert.equal(
      dayStageAssignmentModeAbleiten({ stageCount: 1, claimed: 'user' }),
      'single_destination',
    )
  })

  test('Multi-Ziel ohne Positionen bleibt unassigned, auch bei legacy-Claim', () => {
    assert.equal(dayStageAssignmentModeAbleiten({ stageCount: 3 }), 'unassigned')
    assert.equal(
      dayStageAssignmentModeAbleiten({
        stageCount: 3,
        claimed: 'legacy_fallback',
      }),
      'unassigned',
    )
    assert.equal(
      dayStageAssignmentModeAbleiten({
        stageCount: 3,
        claimed: 'user',
      }),
      'unassigned',
    )
  })

  test('Multi-Ziel mit gültigen Positionen wird explicit, nie legacy_fallback', () => {
    assert.equal(
      dayStageAssignmentModeAbleiten({
        stageCount: 3,
        claimed: 'legacy_fallback',
        positions: [1, 2, 3],
      }),
      'explicit',
    )
    assert.equal(
      dayStageAssignmentModeAbleiten({
        stageCount: 3,
        claimed: 'user',
        positions: [1, 1, 2],
      }),
      'explicit',
    )
    assert.equal(
      dayStageAssignmentModeAbleiten({
        stageCount: 3,
        positions: [1],
      }),
      'explicit',
    )
  })

  test('Teilpositionen bleiben explicit', () => {
    assert.equal(
      dayStageAssignmentModeAbleiten({
        stageCount: 3,
        positions: [1, null, 3],
      }),
      'explicit',
    )
    assert.deepEqual(dayStagePositionenPruefen(3, [1, null, 3]), [1, 3])
  })

  test('unbekannter Claim ist fail-closed und mintet kein legacy_fallback', () => {
    assert.throws(
      () => dayStageAssignmentModeAbleiten({ stageCount: 3, claimed: 'erfunden' }),
      DayStageAssignmentFehler,
    )
  })

  test('out-of-range Position wird nicht zu Hard Truth', () => {
    assert.throws(() => dayStagePositionenPruefen(3, [4]), DayStageAssignmentFehler)
    assert.throws(() => dayStagePositionenPruefen(3, [0]), DayStageAssignmentFehler)
    assert.throws(() => dayStagePositionenPruefen(3, ['abc']), DayStageAssignmentFehler)
    assert.throws(
      () => dayStageAssignmentModeAbleiten({ stageCount: 2, positions: [3] }),
      DayStageAssignmentFehler,
    )
  })

  test('Guest leitet aus Fakten ab und mintet kein legacy_fallback', () => {
    assert.equal(dayStageAssignmentModeFuerGast({ stageCount: 3 }), 'unassigned')
    assert.equal(dayStageAssignmentModeFuerGast({ stageCount: 3, positions: [2] }), 'explicit')
    assert.equal(dayStageAssignmentModeFuerGast({ stageCount: 1 }), 'single_destination')
  })

  test('nur legacy_fallback darf proportional zuordnen', () => {
    assert.equal(darfProportionalZuordnen('legacy_fallback'), true)
    assert.equal(darfProportionalZuordnen('unassigned'), false)
    assert.equal(darfProportionalZuordnen('explicit'), false)
    assert.equal(darfProportionalZuordnen('single_destination'), false)
    assert.equal(darfClientStagePositionUebernehmen('explicit'), true)
    assert.equal(darfClientStagePositionUebernehmen('unassigned'), false)
  })
})
