import assert from 'node:assert/strict'
import test from 'node:test'

import {
  creationLifecycleAktuell,
  creationLifecycleAnfang,
  creationLifecycleBeenden,
  creationLifecycleBeginnen,
} from '@/components/trips/usePlanningCreationLifecycle'

// Gewöhnlicher CI-Test. `npm test` startet keinen Browser und liest kein result.json.
// Der gemountete Beweis ist getrennt und bricht ohne Browser ab, statt ihn zu überspringen:
// PLANNING_CREATION_CHROMIUM=/pfad/zu/chromium node scripts/planning-creation-lifecycle-1/run.mjs

test('ein zweites Beginnen im selben Stand startet keine zweite Generation', () => {
  const erster = creationLifecycleBeginnen(creationLifecycleAnfang())
  const zweiter = creationLifecycleBeginnen(erster.stand)

  assert.equal(erster.lauf, 1)
  assert.equal(erster.stand.belegt, true)
  assert.equal(erster.stand.generation, 1)
  assert.equal(zweiter.lauf, null)
  assert.equal(zweiter.stand, erster.stand)
  assert.equal(creationLifecycleAktuell(erster.stand, 1), true)
})

test('nur die passende Generation gibt den Stand für einen ausdrücklichen neuen Versuch frei', () => {
  const erster = creationLifecycleBeginnen(creationLifecycleAnfang())
  assert.ok(erster.lauf !== null)

  const fremd = creationLifecycleBeenden(erster.stand, erster.lauf + 1)
  assert.equal(fremd, erster.stand)
  assert.equal(creationLifecycleBeginnen(fremd).lauf, null)

  const frei = creationLifecycleBeenden(erster.stand, erster.lauf)
  assert.equal(frei.belegt, false)
  assert.equal(frei.generation, 1)
  assert.equal(creationLifecycleAktuell(frei, erster.lauf), true)

  const retry = creationLifecycleBeginnen(frei)
  assert.equal(retry.lauf, 2)
  assert.equal(retry.stand.belegt, true)
  assert.equal(creationLifecycleAktuell(retry.stand, erster.lauf), false)
  assert.equal(creationLifecycleAktuell(retry.stand, 2), true)
})

test('ein abgemeldeter oder neuer Stand wendet ein altes Ergebnis nicht an', () => {
  const laufend = creationLifecycleBeginnen(creationLifecycleAnfang())
  assert.ok(laufend.lauf !== null)

  const weg = { ...laufend.stand, montiert: false }
  assert.equal(creationLifecycleAktuell(weg, laufend.lauf), false)

  const beendet = creationLifecycleBeenden(weg, laufend.lauf)
  assert.equal(beendet.belegt, false)
  assert.equal(beendet.montiert, false)
  assert.equal(creationLifecycleAktuell(beendet, laufend.lauf), false)

  const neu = creationLifecycleAnfang()
  assert.equal(creationLifecycleBeenden(neu, laufend.lauf), neu)
  const eigener = creationLifecycleBeginnen(neu)
  assert.equal(eigener.lauf, 1)
  assert.equal(eigener.stand.belegt, true)
  assert.notEqual(eigener.stand, laufend.stand)
  assert.equal(creationLifecycleAktuell(weg, eigener.lauf), false)
  assert.equal(creationLifecycleBeenden(weg, eigener.lauf).belegt, false)
  assert.equal(eigener.stand.belegt, true)
})
