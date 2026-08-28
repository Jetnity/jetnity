import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  istTotpFaktor,
  totpFaktorenAusAntwort,
  totpFaktorTyp,
  type MfaFaktor,
} from '@/lib/auth/account-security-faktoren'
import { totpFaktorAnzeigename, totpListeLage } from '@/lib/auth/account-security-lage'

const VERIFIZIERTER_TOTP: MfaFaktor = {
  id: '3c1a0d2e-1111-2222-3333-444444444444',
  factor_type: 'totp',
  status: 'verified',
  friendly_name: 'Telefon von Alex',
  created_at: '2026-08-28T10:00:00.000Z',
  updated_at: '2026-08-28T10:00:00.000Z',
}

describe('AP-5-S1 TOTP-Faktorvertrag', () => {
  test('data.all mit factor_type=totp wird ready, nicht empty', () => {
    const faktoren = totpFaktorenAusAntwort({
      all: [
        VERIFIZIERTER_TOTP,
        {
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          factor_type: 'phone',
          status: 'verified',
          created_at: '2026-08-28T10:00:00.000Z',
          updated_at: '2026-08-28T10:00:00.000Z',
        },
      ],
      totp: [VERIFIZIERTER_TOTP],
      phone: [],
    })

    assert.equal(faktoren.length, 1)
    assert.equal(faktoren[0].id, VERIFIZIERTER_TOTP.id)
    assert.equal(faktoren[0].status, 'verified')

    const lage = totpListeLage({
      listFactorsVorhanden: true,
      laden: false,
      fehler: false,
      anzahl: faktoren.length,
    })
    assert.equal(lage, 'ready')
    assert.notEqual(lage, 'empty')
    assert.equal(totpFaktorAnzeigename(faktoren[0].friendly_name), 'Telefon von Alex')
    assert.equal(totpFaktorAnzeigename(faktoren[0].id), 'Authenticator-App')
  })

  test('data.totp bleibt als Fallback erhalten', () => {
    const faktoren = totpFaktorenAusAntwort({
      totp: [VERIFIZIERTER_TOTP],
    })
    assert.equal(faktoren.length, 1)
    assert.equal(
      totpListeLage({
        listFactorsVorhanden: true,
        laden: false,
        fehler: false,
        anzahl: faktoren.length,
      }),
      'ready',
    )
  })

  test('factor_type ist Current Truth; type nur Fallback', () => {
    assert.equal(totpFaktorTyp({ factor_type: 'totp' }), 'totp')
    assert.equal(totpFaktorTyp({ factor_type: 'phone', type: 'totp' }), 'phone')
    assert.equal(
      istTotpFaktor({
        id: 'legacy-only',
        factor_type: 'phone',
        type: 'totp',
      }),
      false,
    )
    assert.equal(
      istTotpFaktor({
        id: 'legacy-only',
        factor_type: '' as MfaFaktor['factor_type'],
        type: 'totp',
      }),
      true,
    )

    const nurLegacyType = totpFaktorenAusAntwort({
      all: [
        {
          id: 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
          factor_type: '' as MfaFaktor['factor_type'],
          type: 'totp',
          status: 'verified',
          friendly_name: 'Altes Gerät',
          created_at: '2026-08-01T00:00:00.000Z',
        },
      ],
    })
    assert.equal(nurLegacyType.length, 1)
    assert.equal(totpFaktorAnzeigename(nurLegacyType[0].friendly_name), 'Altes Gerät')
  })
})
