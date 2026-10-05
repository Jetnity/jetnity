import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { RICHTLINIE_TEXT, passwortAblehnung } from '@/lib/auth/passwort-richtlinie'
import { passwortAenderungFehlerEinordnen } from '@/lib/auth/account-password-aenderung'

const hier = dirname(fileURLToPath(import.meta.url))
const komponente = readFileSync(join(hier, '../../components/account/SecurityPasswort.tsx'), 'utf8')
const seite = readFileSync(join(hier, '../../app/account/security/page.tsx'), 'utf8')
const recovery = readFileSync(join(hier, '../../app/auth/update-password/page.tsx'), 'utf8')
const mfa = readFileSync(join(hier, '../../components/account/SecurityMFA.tsx'), 'utf8')
const logik = readFileSync(join(hier, './account-password-aenderung.ts'), 'utf8')

describe('AP-5-S2 Vertrag und Accessibility', () => {
  test('Account-Security nutzt Reauthentication, Recovery bleibt ohne nonce', () => {
    assert.equal(seite.includes('SecurityPasswort'), true)
    assert.equal(komponente.includes('reauthenticate'), true)
    assert.equal(komponente.includes('updateUser({ password: eingabe.password, nonce: eingabe.nonce })'), true)
    assert.equal(komponente.includes('currentPassword'), false)
    assert.equal(komponente.includes('current-password'), false)
    assert.equal(komponente.includes('getSession'), false)
    assert.equal(logik.includes('getUser'), true)
    assert.equal(logik.includes('getSession()'), false)

    assert.equal(recovery.includes('reauthenticate'), false)
    assert.equal(recovery.includes('nonce'), false)
    assert.equal(recovery.includes('updateUser({ password: pw })'), true)
    assert.equal(recovery.includes('getSession()'), true)
  })

  test('kein Current-Password-Vertrag und keine zweite Passwortregel', () => {
    assert.equal(komponente.includes('erfuelltRichtlinie'), true)
    assert.equal(komponente.includes('PASSWORT_RICHTLINIE'), true)
    assert.equal(logik.includes('passwortAblehnung'), true)
    assert.equal(logik.includes('erfuelltRichtlinie'), true)
    const hibp = passwortAenderungFehlerEinordnen({
      vorgang: 'update',
      meldung: 'Password is known to be weak and easy to guess, please choose a different one.',
    })
    assert.equal(hibp.text, passwortAblehnung('Password is known to be weak and easy to guess'))
    assert.notEqual(hibp.text, RICHTLINIE_TEXT)
  })

  test('S1-MFA-Grenze bleibt ohne Passwort-Reauthentication', () => {
    assert.equal(mfa.includes('reauthenticate'), false)
    assert.equal(mfa.includes('updateUser'), false)
    assert.equal(mfa.includes('currentPassword'), false)
  })

  test('Labels, Hinweise, Status und Tastaturziele sind vorhanden', () => {
    assert.equal(komponente.includes('htmlFor="account-password-nonce"'), true)
    assert.equal(komponente.includes('htmlFor="account-password-new"'), true)
    assert.equal(komponente.includes('htmlFor="account-password-confirm"'), true)
    assert.equal(komponente.includes('aria-describedby="account-password-nonce-hint"'), true)
    assert.equal(komponente.includes('aria-live'), true)
    assert.equal(komponente.includes('role={zustand.schritt === "error" ? "alert" : "status"}'), true)
    assert.equal(komponente.includes('"assertive"'), true)
    assert.equal(komponente.includes('"polite"'), true)
    assert.equal(komponente.includes('autoComplete="one-time-code"'), true)
    assert.equal(komponente.includes('autoComplete="new-password"'), true)
    assert.equal(komponente.includes('min-h-11'), true)
    assert.equal(komponente.includes('nonceFeld.current?.focus()'), true)
  })

  test('loggt keine Secrets und persistiert keinen Nonce', () => {
    assert.equal(komponente.includes('console.log'), false)
    assert.equal(komponente.includes('console.error'), false)
    assert.equal(komponente.includes('localStorage'), false)
    assert.equal(komponente.includes('sessionStorage'), false)
    assert.equal(logik.includes('console.log'), false)
    assert.equal(logik.includes('console.error'), false)
    assert.equal(logik.includes('localStorage'), false)
  })
})
