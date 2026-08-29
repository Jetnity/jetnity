import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const security = readFileSync(join(hier, '../../components/account/SecurityMFA.tsx'), 'utf8')
const seite = readFileSync(join(hier, '../../app/account/security/page.tsx'), 'utf8')
const dialog = readFileSync(join(hier, '../../components/auth/MFATotpDialog.tsx'), 'utf8')

describe('AP-5-S1 Security-UI Semantik', () => {
  test('SecurityMFA unterscheidet Lagen und liest Server-Passkey-Truth', () => {
    assert.equal(security.includes('data-security-lage={totpLage}'), true)
    assert.equal(security.includes('data-passkey-lage={aktuellePasskeyLage}'), true)
    assert.equal(security.includes('passkeysServerAktiviert'), true)
    assert.equal(security.includes('passkeyLage('), true)
    assert.equal(security.includes('totpListeLage('), true)
    assert.equal(seite.includes('passkeysServerAktiviertLesen()'), true)
  })

  test('Faktor-IDs werden nicht als Geräteidentität gerendert', () => {
    assert.equal(security.includes('f.id.slice'), false)
    assert.equal(security.includes('faktor.id.slice'), false)
    assert.equal(security.includes('Faktor {'), false)
    assert.equal(security.includes('totpFaktorAnzeigename'), true)
    assert.equal(seite.includes('Gerät'), false)
    assert.equal(seite.includes('Sitzung'), false)
  })

  test('keine rohen GoTrue-Meldungen, Secrets oder Auth-Settings-Copy', () => {
    assert.equal(security.includes('err?.message'), false)
    assert.equal(security.includes('err.message'), false)
    assert.equal(security.includes('enrollUri'), false)
    assert.equal(security.includes('otpauth'), false)
    assert.equal(security.includes('Auth → Settings'), false)
    assert.equal(security.includes('Verwalten (bald)'), false)
    assert.equal(security.includes('Passkey hinzufügen'), false)
    assert.equal(security.includes('aktiviert sich automatisch'), false)
    assert.equal(dialog.includes('err?.message'), false)
    assert.equal(dialog.includes('securityFehlerEinordnen'), true)
  })

  test('listFactors-Normalisierung folgt factor_type, nicht type', () => {
    assert.equal(security.includes('totpFaktorenAusAntwort'), true)
    assert.equal(security.includes('MfaListFactorsData'), true)
    assert.equal(security.includes('faktor.type === "totp"'), false)
    assert.equal(security.includes('factor_type'), false)
  })

  test('Enroll bleibt ohne AAL-Step-up; verified Unenroll nutzt S4', () => {
    assert.equal(security.includes('unenroll'), true)
    assert.equal(security.includes('enroll'), true)
    assert.equal(security.includes('mfaUnenrollVorbereiten'), true)
    assert.equal(security.includes('startTotpChallenge'), false)
    assert.equal(security.includes('reauthenticate'), false)
    assert.equal(security.includes('nonce'), false)
    assert.equal(seite.includes('SecurityPasswort'), true)
  })
})
