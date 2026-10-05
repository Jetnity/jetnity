import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  securityFehlerAusUnbekannt,
  securityFehlerEinordnen,
  securityFehlerIstDicht,
} from '@/lib/auth/account-security-fehler'

const ROH_BEISPIELE = [
  'Invalid TOTP code entered',
  'AAL2 required to unenroll verified factor',
  'Auth session missing!',
  'Password is known to be weak and easy to guess',
  'otpauth://totp/Jetnity:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Jetnity',
  'Failed to fetch',
  'Too many requests',
  'unexpected GoTrue error: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
]

describe('AP-5-S1 Security-Fehlerhygiene', () => {
  test('Roh-GoTrue wird auf stabile Produktcopy abgebildet', () => {
    const ungueltig = securityFehlerEinordnen({
      vorgang: 'verify',
      meldung: 'Invalid TOTP code entered',
    })
    assert.equal(ungueltig.code, 'totp_verify_invalid')
    assert.match(ungueltig.text, /ungültig/i)

    const aal2 = securityFehlerEinordnen({
      vorgang: 'unenroll',
      meldung: 'AAL2 required to unenroll verified factor',
      status: 403,
    })
    assert.equal(aal2.code, 'totp_unenroll_aal2_required')
    assert.match(aal2.text, /Zwei-Faktor-Bestätigung/i)

    const liste = securityFehlerEinordnen({
      vorgang: 'list',
      meldung: 'TypeError: Failed to fetch',
    })
    assert.equal(liste.code, 'network')

    const passkey = securityFehlerEinordnen({
      vorgang: 'passkey_register',
      meldung: 'Passkeys sind noch nicht aktiviert (Auth → Settings).',
    })
    assert.equal(passkey.code, 'passkey_unsupported')
    assert.doesNotMatch(passkey.text, /Auth → Settings|GoTrue|Supabase/i)
  })

  test('keine Nutzercopy enthält Rohtext, Secret oder Token', () => {
    for (const roh of ROH_BEISPIELE) {
      for (const vorgang of ['list', 'enroll', 'verify', 'unenroll', 'passkey_register'] as const) {
        const ergebnis = securityFehlerEinordnen({ vorgang, meldung: roh })
        assert.equal(securityFehlerIstDicht(ergebnis.text, roh), true, `${vorgang}: ${roh}`)
        assert.doesNotMatch(ergebnis.text, /otpauth|secret=|eyJ|GoTrue|unexpected/i)
      }
    }
  })

  test('unbekannte Objekte werden ohne message-Passthrough gelesen', () => {
    const gelesen = securityFehlerAusUnbekannt({
      message: 'unexpected GoTrue error: token=sbp_secret',
      code: 'unexpected_failure',
      status: 500,
    })
    assert.equal(gelesen.meldung, 'unexpected GoTrue error: token=sbp_secret')
    const mapped = securityFehlerEinordnen({
      vorgang: 'enroll',
      meldung: gelesen.meldung,
      code: gelesen.code,
      status: gelesen.status,
    })
    assert.equal(mapped.code, 'totp_enroll_failed')
    assert.equal(securityFehlerIstDicht(mapped.text, gelesen.meldung), true)
    assert.doesNotMatch(mapped.text, /sbp_|GoTrue|token=/i)
  })

  test('AAL2-Unenroll-Rohfehler bleibt ehrlich gemappt', () => {
    const ergebnis = securityFehlerEinordnen({
      vorgang: 'unenroll',
      code: 'insufficient_aal',
      status: 403,
    })
    assert.equal(ergebnis.code, 'totp_unenroll_aal2_required')
    assert.doesNotMatch(ergebnis.text, /challenge|nonce|reauthenticate/i)
  })
})
