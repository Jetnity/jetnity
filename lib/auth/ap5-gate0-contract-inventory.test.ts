// lib/auth/ap5-gate0-contract-inventory.test.ts
//
// AP-5 Gate 0 Evidence-Lock: welcher Auth-/Session-/MFA-Vertrag heute
// tatsächlich im Repository steht. Kein Runtime-Write. Keine Auth-Mutation.

import { readdirSync, readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { leseToml } from '@/lib/supabase/config-toml'
import { erwarteteAuthKonfiguration } from '@/lib/supabase/auth-erwartung'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const QUELL_ENDUNGEN = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const QUELL_VERZEICHNISSE = ['app', 'lib', 'components']
const IGNORIERTE_TEILE = new Set(['node_modules', '.git', 'docs', 'supabase'])

function dateienSammeln(verzeichnis: string, gefunden: string[] = []): string[] {
  for (const eintrag of readdirSync(verzeichnis, { withFileTypes: true })) {
    if (IGNORIERTE_TEILE.has(eintrag.name)) continue
    const pfad = join(verzeichnis, eintrag.name)
    if (eintrag.isDirectory()) {
      dateienSammeln(pfad, gefunden)
      continue
    }
    const punkt = eintrag.name.lastIndexOf('.')
    const endung = punkt >= 0 ? eintrag.name.slice(punkt) : ''
    if (QUELL_ENDUNGEN.has(endung) && !eintrag.name.endsWith('.test.ts') && !eintrag.name.endsWith('.test.tsx')) {
      gefunden.push(pfad)
    }
  }
  return gefunden
}

function quelle(absolut: string): string {
  return readFileSync(absolut, 'utf8')
}

function rel(absolut: string): string {
  return relative(wurzel, absolut).replaceAll('\\', '/')
}

const LIST_SESSIONS = /\.listSessions\s*\(|auth\.getSessions\s*\(/
const REAUTH = /\.reauthenticate\s*\(/
const UPDATE_USER_PASSWORD = /updateUser\(\s*\{\s*password/
const SIGN_OUT_SCOPED = /signOut\(\s*\{\s*scope\s*:/
const CURRENT_PASSWORD_FIELD = /security_update_password_require_current_password|aktuelles Passwort mitsenden|currentPassword/

describe('AP-5 Gate 0 Auth-/Session-/MFA-Vertragsinventar', () => {
  const dateien = QUELL_VERZEICHNISSE.flatMap((name) => dateienSammeln(join(wurzel, name)))
  const inhalte = dateien.map((pfad) => ({ pfad: rel(pfad), text: quelle(pfad) }))

  test('kein user-facing Session-Listing in App/Lib/Components', () => {
    const treffer = inhalte.filter((datei) => LIST_SESSIONS.test(datei.text)).map((datei) => datei.pfad)
    assert.deepEqual(treffer, [])
  })

  test('reauthenticate() bleibt der signed-in Vertrag und liegt nicht im Recovery-Pfad', () => {
    const treffer = inhalte.filter((datei) => REAUTH.test(datei.text)).map((datei) => datei.pfad)
    assert.deepEqual(treffer.slice().sort(), [
      'components/account/SecurityPasswort.tsx',
      'lib/auth/account-password-aenderung.ts',
    ])
    const recovery = inhalte.find((datei) => datei.pfad === 'app/auth/update-password/page.tsx')
    assert.ok(recovery)
    assert.equal(REAUTH.test(recovery.text), false)
  })

  test('signed-in Change und Recovery bleiben getrennte Passwort-Authorities', () => {
    const treffer = inhalte.filter((datei) => UPDATE_USER_PASSWORD.test(datei.text)).map((datei) => datei.pfad)
    assert.deepEqual(treffer.slice().sort(), [
      'app/auth/update-password/page.tsx',
      'components/account/SecurityPasswort.tsx',
      'lib/auth/account-password-aenderung.ts',
    ])
    const seite = inhalte.find((datei) => datei.pfad === 'app/auth/update-password/page.tsx')
    assert.ok(seite)
    assert.equal(seite.text.includes('currentPassword'), false)
    assert.equal(seite.text.includes('nonce'), false)
    assert.equal(seite.text.includes('getSession()'), true)
    assert.equal(seite.text.includes('getUser()'), false)

    const signedIn = inhalte.find((datei) => datei.pfad === 'lib/auth/account-password-aenderung.ts')
    assert.ok(signedIn)
    assert.equal(signedIn.text.includes('nonce'), true)
    assert.equal(signedIn.text.includes('currentPassword'), false)
    assert.equal(signedIn.text.includes('getUser'), true)
    assert.equal(signedIn.text.includes('getSession()'), false)
  })

  test('signOutAction ruft signOut ohne Scope auf – Client-Default ist global', () => {
    const signOut = quelle(join(wurzel, 'app/auth/sign-out.ts'))
    assert.equal(signOut.includes('await supabase.auth.signOut()'), true)
    assert.equal(SIGN_OUT_SCOPED.test(signOut), false)
    assert.equal(signOut.includes("scope: 'local'"), false)
    assert.equal(signOut.includes("scope: 'others'"), false)
  })

  test('SecurityMFA hat kein AAL-Step-up vor Enroll/Unenroll', () => {
    const security = quelle(join(wurzel, 'components/account/SecurityMFA.tsx'))
    assert.equal(security.includes('getAuthenticatorAssuranceLevel'), false)
    assert.equal(security.includes('getAAL'), false)
    assert.equal(security.includes('startTotpChallenge'), false)
    assert.equal(security.includes('mfa.unenroll'), true)
    assert.equal(security.includes('mfa.enroll'), true)
  })

  test('keine Session-Listing-Route; S3-Logout bleibt ohne Geräteinventar', () => {
    const securityPage = quelle(join(wurzel, 'app/account/security/page.tsx'))
    assert.equal(securityPage.includes('SecurityMFA'), true)
    assert.equal(securityPage.includes('SecurityPasswort'), true)
    assert.equal(securityPage.includes('SecurityLogout'), true)
    assert.equal(securityPage.includes('listSessions'), false)
    assert.equal(securityPage.includes('/account/sessions'), false)
    const settings = quelle(join(wurzel, 'app/account/settings/page.tsx'))
    assert.equal(settings.includes('/account/security'), true)
    assert.equal(settings.includes('currentPassword'), false)
    assert.equal(settings.includes('/account/sessions'), false)
    const logout = quelle(join(wurzel, 'lib/auth/account-logout-scopes.ts'))
    assert.equal(logout.includes('listSessions'), false)
    assert.equal(logout.includes('auth.sessions'), false)
  })

  test('Auth-Sollwerte bleiben am Reauthentication-Vertrag', () => {
    const config = leseToml(readFileSync(join(wurzel, 'supabase', 'config.toml'), 'utf8'))
    const soll = new Map(erwarteteAuthKonfiguration(config).map((e) => [e.api, e.wert]))
    assert.equal(soll.get('security_update_password_require_reauthentication'), true)
    assert.equal(soll.get('security_update_password_require_current_password'), false)
    assert.equal(soll.get('sessions_single_per_user'), false)
    assert.equal(soll.get('mfa_allow_low_aal'), false)
    assert.equal(soll.get('mfa_totp_enroll_enabled'), true)
    assert.equal(soll.get('passkey_enabled'), false)
  })

  test('kein Current-Password-Submit-Vertrag in App-Quellen', () => {
    const treffer = inhalte
      .filter((datei) => CURRENT_PASSWORD_FIELD.test(datei.text) && !datei.pfad.includes('auth-erwartung'))
      .map((datei) => datei.pfad)
    assert.deepEqual(treffer, [])
  })
})
