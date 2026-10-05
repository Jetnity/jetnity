import { readdirSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  AIRPORT_ANZAHL,
  AIRPORT_PFLICHT,
  ORT_FANTASIE,
  PHASE31_MIGRATIONEN,
  PLACE_ANZAHL,
  anzahlIstPlausibel,
  rolloutBefund,
  vorabBefund,
  type RolloutBeobachtung,
} from '@/lib/rollout/befund'

const gesund: RolloutBeobachtung = {
  placesExistiert: true,
  originPlaceIdExistiert: true,
  stagePlaceIdExistiert: true,
  airportAnzahl: 5332,
  placeAnzahl: 124811,
  airportPflicht: [...AIRPORT_PFLICHT],
  airportOder: ['HND', 'NRT'],
  ortPflicht: ['Bali', 'Thailand', 'Tuscany', 'New York', 'Japan'],
  ortKeyword: ['Südtirol'],
  fantasieTreffer: [],
  airportConstraintVerletzungen: 0,
  anonKannLesen: true,
  anonKannSchreiben: false,
  reisenOhnePlaceId: 2,
  reisenLesbar: true,
}

describe('Production-Rollout-Befund', () => {
  test('die vier Phase-3.1-Migrationen stehen in der sicheren Reihenfolge', () => {
    assert.deepEqual([...PHASE31_MIGRATIONEN], [
      '20260820100000_reise_anlegen_handelsfelder.sql',
      '20260820110000_airports_referenz.sql',
      '20260820120000_places_referenz.sql',
      '20260820130000_reise_aendern_places.sql',
    ])
    const dateien = readdirSync(new URL('../../supabase/migrations', import.meta.url))
      .filter((name) => name.startsWith('202608201') && name.endsWith('.sql'))
      .sort()
    assert.deepEqual(dateien, [...PHASE31_MIGRATIONEN])
  })

  test('Vorab besteht bei 40 historischen Airports ohne Places', () => {
    const vorab = vorabBefund({
      ...gesund,
      placesExistiert: false,
      originPlaceIdExistiert: false,
      stagePlaceIdExistiert: false,
      airportAnzahl: 40,
      placeAnzahl: null,
      airportPflicht: [],
      airportOder: [],
      ortPflicht: [],
      ortKeyword: [],
      reisenOhnePlaceId: null,
      reisenLesbar: null,
    })
    assert.equal(vorab.ok, true)
    assert.equal(rolloutBefund({
      ...gesund,
      placesExistiert: false,
      airportAnzahl: 40,
      placeAnzahl: null,
    }).ok, false)
  })

  test('ein vollständiger Rollout besteht', () => {
    const befund = rolloutBefund(gesund)
    assert.equal(befund.ok, true)
    assert.equal(befund.punkte.every((punkt) => punkt.ok), true)
  })

  test('HND allein reicht als Tokio-Pflicht, NRT allein auch', () => {
    assert.equal(rolloutBefund({ ...gesund, airportOder: ['HND'] }).ok, true)
    assert.equal(rolloutBefund({ ...gesund, airportOder: ['NRT'] }).ok, true)
    assert.equal(rolloutBefund({ ...gesund, airportOder: [] }).ok, false)
  })

  test('fehlende Places, zu wenige Airports oder Fantasietreffer fallen durch', () => {
    assert.equal(rolloutBefund({ ...gesund, placesExistiert: false }).ok, false)
    assert.equal(rolloutBefund({ ...gesund, airportAnzahl: 40 }).ok, false)
    assert.equal(rolloutBefund({ ...gesund, fantasieTreffer: ['Mordor'] }).ok, false)
    assert.equal(rolloutBefund({ ...gesund, anonKannSchreiben: true }).ok, false)
    assert.ok(ORT_FANTASIE.includes('Test'))
  })

  test('Anzahlgrenzen sind Orientierungen, keine exakte Dump-Kopie', () => {
    assert.equal(anzahlIstPlausibel(5200, AIRPORT_ANZAHL), true)
    assert.equal(anzahlIstPlausibel(124000, PLACE_ANZAHL), true)
    assert.equal(anzahlIstPlausibel(40, AIRPORT_ANZAHL), false)
    assert.equal(AIRPORT_ANZAHL.orientierung, 5332)
    assert.equal(PLACE_ANZAHL.orientierung, 124811)
  })
})
