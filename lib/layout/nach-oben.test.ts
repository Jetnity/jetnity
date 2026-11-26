import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  NACH_OBEN_SCHWELLE_PX,
  nachObenSchwelle,
  nachObenSichtbar,
  scrollVerfolgen,
  type ScrollVerfolgung,
  ueberSchwelle,
} from './nach-oben'

const telefon = { engerRand: true, ueberSchwelle: true }

describe('Nach-oben-Knopf: Sichtbarkeit', () => {
  test('Schwelle liegt bei 400 px, genau darauf noch unsichtbar', () => {
    assert.equal(ueberSchwelle(NACH_OBEN_SCHWELLE_PX), false)
    assert.equal(ueberSchwelle(NACH_OBEN_SCHWELLE_PX + 1), true)
  })

  test('die Schwelle ist mindestens eine Bildschirmhöhe, nie unter 400 px', () => {
    assert.equal(nachObenSchwelle(320), NACH_OBEN_SCHWELLE_PX)
    assert.equal(nachObenSchwelle(844), 844)
    assert.equal(nachObenSchwelle(900.4), 900)
    assert.equal(ueberSchwelle(844, nachObenSchwelle(844)), false)
    assert.equal(ueberSchwelle(845, nachObenSchwelle(844)), true)
  })

  test('unterhalb der Schwelle nie sichtbar', () => {
    for (const richtung of ['hoch', 'runter'] as const) {
      for (const engerRand of [true, false]) {
        assert.equal(nachObenSichtbar({ ueberSchwelle: false, engerRand, richtung, ruhig: false }), false)
      }
    }
  })

  test('enger Rand (Telefon, Arbeitsbereich unter dem Desktop-Raster): nur beim Hochscrollen und nur solange es nicht ruht', () => {
    assert.equal(nachObenSichtbar({ ...telefon, richtung: 'hoch', ruhig: false }), true)
    assert.equal(nachObenSichtbar({ ...telefon, richtung: 'hoch', ruhig: true }), false)
    assert.equal(nachObenSichtbar({ ...telefon, richtung: 'runter', ruhig: false }), false)
    assert.equal(nachObenSichtbar({ ...telefon, richtung: 'runter', ruhig: true }), false)
  })

  test('grosse Bildschirme behalten den dauerhaft sichtbaren Knopf am freien Rand', () => {
    for (const richtung of ['hoch', 'runter'] as const) {
      for (const ruhig of [true, false]) {
        assert.equal(nachObenSichtbar({ ueberSchwelle: true, engerRand: false, richtung, ruhig }), true)
      }
    }
  })
})

describe('Nach-oben-Knopf: Scrollrichtung', () => {
  const verfolgen = (start: ScrollVerfolgung, positionen: number[]) =>
    positionen.reduce<ScrollVerfolgung>((zustand, y) => scrollVerfolgen(zustand, y), start)

  test('stetiges Runterscrollen in kleinen Schritten bleibt «runter»', () => {
    const ergebnis = verfolgen({ richtung: 'runter', anker: 0 }, [4, 9, 15, 22, 30, 41, 55, 70])
    assert.deepEqual(ergebnis, { richtung: 'runter', anker: 70 })
  })

  test('eine Gegenbewegung ab 12 px dreht auf «hoch», darunter nicht', () => {
    assert.equal(verfolgen({ richtung: 'runter', anker: 800 }, [795, 790]).richtung, 'runter')
    assert.equal(verfolgen({ richtung: 'runter', anker: 800 }, [795, 788]).richtung, 'hoch')
  })

  test('langsames Hochscrollen in kleinen Schritten wird erkannt und wieder umgedreht', () => {
    const hoch = verfolgen({ richtung: 'runter', anker: 1000 }, [996, 990, 982, 970, 955])
    assert.equal(hoch.richtung, 'hoch')
    assert.equal(verfolgen(hoch, [958, 960]).richtung, 'hoch')
    assert.equal(verfolgen(hoch, [958, 970]).richtung, 'runter')
  })
})
