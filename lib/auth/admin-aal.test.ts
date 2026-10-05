import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { decideAdminAccess, parseBreakGlassAllowlist } from '@/lib/auth/admin-access'
import {
  ADMIN_MFA_EINRICHTUNG,
  ADMIN_STEP_UP_PFAD,
  SICHERES_ADMIN_ZIEL,
  adminLoginSollAbmelden,
  applyAdminAal,
  entscheideAdminLoginFortgang,
  erlaubtesAdminZiel,
  istAktuellesAal2,
  istKeinTotpFaktorFehler,
  parseAalLookup,
} from '@/lib/auth/admin-aal'

const USER = { id: 'konto-1', email: 'chef@jetnity.com' }
const OHNE_LISTE = new Set<string>()
const NOTLISTE = parseBreakGlassAllowlist('chef@jetnity.com')

const rolle = decideAdminAccess({
  user: USER,
  lookup: { status: 'ok', role: 'admin' },
  allowlist: OHNE_LISTE,
})
const notzugang = decideAdminAccess({
  user: USER,
  lookup: { status: 'ok', role: 'user' },
  allowlist: NOTLISTE,
})
const zuNiedrig = decideAdminAccess({
  user: USER,
  lookup: { status: 'ok', role: 'user' },
  allowlist: OHNE_LISTE,
})
const rolleKaputt = decideAdminAccess({
  user: USER,
  lookup: { status: 'failed', reason: 'permission denied' },
  allowlist: OHNE_LISTE,
})
const aal1 = parseAalLookup({ currentLevel: 'aal1', nextLevel: 'aal2' })
const aal2 = parseAalLookup({ currentLevel: 'aal2', nextLevel: 'aal2' })
const aalKaputt = parseAalLookup(null, { message: 'mfa unavailable' })

describe('parseAalLookup', () => {
  test('entscheidet nur über currentLevel, nie über nextLevel', () => {
    assert.deepEqual(aal1, { status: 'ok', currentLevel: 'aal1' })
    assert.deepEqual(aal2, { status: 'ok', currentLevel: 'aal2' })
    assert.equal(istAktuellesAal2(aal1), false)
    assert.equal(istAktuellesAal2(aal2), true)
  })

  test('ein Fehler oder ein unlesbarer Wert ist fail closed', () => {
    assert.deepEqual(aalKaputt, { status: 'failed', reason: 'mfa unavailable' })
    assert.equal(parseAalLookup({ nextLevel: 'aal2' }).status, 'failed')
    assert.equal(parseAalLookup({ currentLevel: 'aal3' }).status, 'failed')
    assert.equal(parseAalLookup(null).status, 'failed')
    assert.equal(istAktuellesAal2(aalKaputt), false)
  })
})

describe('applyAdminAal – verbindliche Matrix', () => {
  test('1. unauthenticated bleibt unauthenticated, unabhängig vom AAL', () => {
    const ohneSession = decideAdminAccess({
      user: null,
      lookup: { status: 'unknown' },
      allowlist: OHNE_LISTE,
    })
    assert.deepEqual(applyAdminAal(ohneSession, aal2), {
      allowed: false,
      denial: 'unauthenticated',
    })
  })

  test('2. Admin-Rolle + AAL1 wird blockiert', () => {
    assert.deepEqual(applyAdminAal(rolle, aal1), {
      allowed: false,
      denial: 'aal2-required',
    })
  })

  test('3. Admin-Rolle + AAL2 bleibt die bestehende Freigabe', () => {
    const mitAal2 = applyAdminAal(rolle, aal2)
    assert.deepEqual(mitAal2, rolle)
    assert.equal(mitAal2.allowed && mitAal2.grant, 'role')
  })

  test('4. Break-Glass + AAL1 wird blockiert', () => {
    assert.equal(notzugang.allowed && notzugang.grant, 'break-glass')
    assert.deepEqual(applyAdminAal(notzugang, aal1), {
      allowed: false,
      denial: 'aal2-required',
    })
  })

  test('5. Break-Glass + AAL2 behält die bestehende Break-Glass-Semantik', () => {
    const d = applyAdminAal(notzugang, aal2)
    assert.equal(d.allowed, true)
    assert.equal(d.allowed && d.grant, 'break-glass')
  })

  test('6. unzureichende Rolle + AAL2 bleibt forbidden', () => {
    assert.deepEqual(applyAdminAal(zuNiedrig, aal2), {
      allowed: false,
      denial: 'forbidden',
    })
  })

  test('7. Role lookup failure + AAL2 bleibt fail closed', () => {
    assert.deepEqual(applyAdminAal(rolleKaputt, aal2), {
      allowed: false,
      denial: 'lookup-failed',
    })
  })

  test('8. AAL lookup error nach Berechtigung ist fail closed', () => {
    assert.deepEqual(applyAdminAal(rolle, aalKaputt), {
      allowed: false,
      denial: 'aal-lookup-failed',
    })
    assert.deepEqual(applyAdminAal(notzugang, aalKaputt), {
      allowed: false,
      denial: 'aal-lookup-failed',
    })
  })
})

describe('Admin-Login-Fortgang', () => {
  test('11. Passwortlogin mit AAL1 gibt /admin nicht frei', () => {
    const fortgang = entscheideAdminLoginFortgang(applyAdminAal(rolle, aal1))
    assert.deepEqual(fortgang, { art: 'step-up' })
    assert.equal(adminLoginSollAbmelden(fortgang), false)
  })

  test('Passwortlogin mit AAL2 gibt den Adminbereich frei', () => {
    const fortgang = entscheideAdminLoginFortgang(applyAdminAal(rolle, aal2))
    assert.deepEqual(fortgang, { art: 'freigeben' })
  })

  test('fehlende Rolle beendet die Sitzung weiterhin', () => {
    const fortgang = entscheideAdminLoginFortgang(zuNiedrig)
    assert.deepEqual(fortgang, { art: 'ablehnen', denial: 'forbidden' })
    assert.equal(adminLoginSollAbmelden(fortgang), true)
  })

  test('AAL-Ausfall nach Berechtigung beendet die Sitzung nicht', () => {
    const fortgang = entscheideAdminLoginFortgang(applyAdminAal(rolle, aalKaputt))
    assert.deepEqual(fortgang, { art: 'ablehnen', denial: 'aal-lookup-failed' })
    assert.equal(adminLoginSollAbmelden(fortgang), false)
  })
})

describe('erlaubtesAdminZiel', () => {
  test('erlaubt nur interne Admin-Ziele', () => {
    assert.equal(erlaubtesAdminZiel('/admin'), '/admin')
    assert.equal(erlaubtesAdminZiel('/admin/users?q=a'), '/admin/users?q=a')
    assert.equal(erlaubtesAdminZiel('/admin/system-health'), '/admin/system-health')
  })

  test('15. externes oder manipuliertes Return-Target wird verworfen', () => {
    assert.equal(erlaubtesAdminZiel('https://evil.example/admin'), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel('//evil.example/admin'), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel('/account/security'), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel('/reisen'), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel('/admin/login'), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel(ADMIN_STEP_UP_PFAD), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel('/admin/mfa?next=/admin'), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel('/admin/%2e%2e/login'), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel('https://evil.example'), SICHERES_ADMIN_ZIEL)
    assert.equal(erlaubtesAdminZiel(null), SICHERES_ADMIN_ZIEL)
  })
})

describe('TOTP-Grenze', () => {
  test('14. ohne Faktor gibt es keinen Bypass-Hinweis, nur den Setup-Pfad', () => {
    assert.equal(ADMIN_MFA_EINRICHTUNG, '/account/security')
    assert.equal(
      istKeinTotpFaktorFehler(
        new Error('Kein TOTP-Faktor gefunden. Bitte zuerst TOTP in den Sicherheitseinstellungen einrichten.'),
      ),
      true,
    )
    assert.equal(istKeinTotpFaktorFehler(new Error('Netzwerkfehler')), false)
  })
})
