import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { leseToml } from '@/lib/supabase/config-toml'
import {
  darfPasskeyHinzufuegen,
  darfTotpEinrichten,
  passkeyBrowserHinweis,
  passkeyLage,
  passkeysServerAktiviertAusToml,
  totpFaktorAnzeigename,
  totpFaktorStatusText,
  totpListeLage,
} from '@/lib/auth/account-security-lage'
import { passkeysServerAktiviertLesen } from '@/lib/auth/account-security-passkeys-lesen'

const config = leseToml(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../supabase/config.toml'), 'utf8'),
)

describe('AP-5-S1 Security-Lagen', () => {
  test('config.toml deaktiviert Passkeys und die Ableitung bleibt fail-closed', () => {
    assert.equal(passkeysServerAktiviertAusToml(config), false)
    assert.equal(passkeysServerAktiviertAusToml({}), false)
    assert.equal(passkeysServerAktiviertAusToml({ auth: { passkey: { enabled: 'true' } } }), false)
    assert.equal(passkeysServerAktiviertLesen(), false)
  })

  test('TOTP-Liste trennt empty, unsupported, error und ready', () => {
    assert.equal(
      totpListeLage({ listFactorsVorhanden: false, laden: false, fehler: false, anzahl: 0 }),
      'unsupported',
    )
    assert.equal(
      totpListeLage({ listFactorsVorhanden: true, laden: true, fehler: false, anzahl: 0 }),
      'loading',
    )
    assert.equal(
      totpListeLage({ listFactorsVorhanden: true, laden: false, fehler: true, anzahl: 0 }),
      'error',
    )
    assert.equal(
      totpListeLage({ listFactorsVorhanden: true, laden: false, fehler: false, anzahl: 0 }),
      'empty',
    )
    assert.equal(
      totpListeLage({ listFactorsVorhanden: true, laden: false, fehler: false, anzahl: 2 }),
      'ready',
    )
    assert.notEqual(
      totpListeLage({ listFactorsVorhanden: true, laden: false, fehler: true, anzahl: 0 }),
      'empty',
    )
  })

  test('Browser-WebAuthn überschreibt deaktivierte Server-Passkeys nicht', () => {
    assert.equal(passkeyLage({ serverAktiviert: false, browserWebAuthn: true }), 'unsupported')
    assert.equal(passkeyLage({ serverAktiviert: false, browserWebAuthn: false }), 'unsupported')
    assert.equal(passkeyLage({ serverAktiviert: false, browserWebAuthn: null }), 'unsupported')
    assert.equal(passkeyLage({ serverAktiviert: true, browserWebAuthn: false }), 'unavailable')
    assert.equal(passkeyLage({ serverAktiviert: true, browserWebAuthn: null }), 'unavailable')
    assert.equal(passkeyLage({ serverAktiviert: true, browserWebAuthn: true }), 'empty')
    assert.equal(darfPasskeyHinzufuegen('unsupported'), false)
    assert.equal(darfPasskeyHinzufuegen('unavailable'), false)
    assert.equal(darfPasskeyHinzufuegen('empty'), true)
  })

  test('WebAuthn-Hinweis bleibt sekundär und ändert unsupported nicht', () => {
    assert.equal(
      passkeyBrowserHinweis({ lage: 'unsupported', browserWebAuthn: true }),
      'Dieser Browser könnte Passkeys technisch anbieten. Die Server-Konfiguration lässt das trotzdem nicht zu.',
    )
    assert.equal(passkeyBrowserHinweis({ lage: 'unsupported', browserWebAuthn: false }), null)
    assert.equal(passkeyBrowserHinweis({ lage: 'empty', browserWebAuthn: true }), null)
    assert.equal(passkeyBrowserHinweis({ lage: 'unavailable', browserWebAuthn: false }), null)
  })

  test('Faktor-IDs und UUID-Namen werden nicht als Geräteidentität gezeigt', () => {
    assert.equal(totpFaktorAnzeigename(null), 'Authenticator-App')
    assert.equal(totpFaktorAnzeigename(''), 'Authenticator-App')
    assert.equal(totpFaktorAnzeigename('3c1a0d2e-1111-2222-3333-444444444444'), 'Authenticator-App')
    assert.equal(totpFaktorAnzeigename('Telefon von Alex'), 'Telefon von Alex')
    assert.equal(totpFaktorStatusText('verified'), 'bestätigt')
    assert.equal(totpFaktorStatusText('unverified'), 'Einrichtung nicht abgeschlossen')
    assert.equal(totpFaktorStatusText('aktiv'), null)
    assert.equal(totpFaktorStatusText(null), null)
  })

  test('Einrichten bleibt nur bei bekannter Liste erlaubt', () => {
    assert.equal(darfTotpEinrichten('empty'), true)
    assert.equal(darfTotpEinrichten('ready'), true)
    assert.equal(darfTotpEinrichten('error'), false)
    assert.equal(darfTotpEinrichten('unsupported'), false)
    assert.equal(darfTotpEinrichten('loading'), false)
  })
})
