import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  KALENDER_VERSATCH_PRUEFUNG_MS,
  millisekundenBisNaechstenLokalTag,
  naechsteKalenderPruefung,
} from '@/lib/account/account-home-export-1/kalender'
import { kalendertagAusInstant } from '@/lib/account/naechste-reise'

const VOR_UTC_MITTERNACHT = new Date('2026-08-23T23:30:00.000Z')
const NACH_UTC_MITTERNACHT = new Date('2026-08-24T00:30:00.000Z')

describe('lokaler Kalenderwechsel', () => {
  test('westlicher Offset bleibt vor dem lokalen Mitternachtstag nach UTC-Mitternacht', () => {
    assert.equal(kalendertagAusInstant(NACH_UTC_MITTERNACHT, 120), '2026-08-23')
    const rest = millisekundenBisNaechstenLokalTag(NACH_UTC_MITTERNACHT, 120)
    assert.equal(rest, 90 * 60_000)
    assert.equal(naechsteKalenderPruefung(NACH_UTC_MITTERNACHT, 120), KALENDER_VERSATCH_PRUEFUNG_MS)
  })

  test('östlicher Offset ist nach dem lokalen Mitternachtstag vor UTC-Mitternacht', () => {
    assert.equal(kalendertagAusInstant(VOR_UTC_MITTERNACHT, -180), '2026-08-24')
    const rest = millisekundenBisNaechstenLokalTag(VOR_UTC_MITTERNACHT, -180)
    assert.equal(rest, (21 * 60 + 30) * 60_000)
  })

  test('die Geräteprüfung wartet höchstens eine Minute und fragt kein Netz', () => {
    const kurzVorMitternacht = new Date('2026-08-24T23:59:50.000Z')
    assert.equal(millisekundenBisNaechstenLokalTag(kurzVorMitternacht, 0), 10_000)
    assert.equal(naechsteKalenderPruefung(new Date('2026-08-24T12:00:00.000Z'), 0), KALENDER_VERSATCH_PRUEFUNG_MS)
    assert.equal(KALENDER_VERSATCH_PRUEFUNG_MS < 86_400_000, true)
  })
})
