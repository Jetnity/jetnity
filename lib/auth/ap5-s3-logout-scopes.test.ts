import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const komponente = readFileSync(join(hier, '../../components/account/SecurityLogout.tsx'), 'utf8')
const seite = readFileSync(join(hier, '../../app/account/security/page.tsx'), 'utf8')
const aktion = readFileSync(join(hier, '../../app/account/security/logout-action.ts'), 'utf8')
const allgemein = readFileSync(join(hier, '../../app/auth/sign-out.ts'), 'utf8')
const navbar = readFileSync(join(hier, '../../components/layout/PublicNavbar.tsx'), 'utf8')
const footer = readFileSync(join(hier, '../../components/layout/FooterSitzung.tsx'), 'utf8')
const logik = readFileSync(join(hier, './account-logout-scopes.ts'), 'utf8')
const passwort = readFileSync(join(hier, '../../components/account/SecurityPasswort.tsx'), 'utf8')
const mfa = readFileSync(join(hier, '../../components/account/SecurityMFA.tsx'), 'utf8')

describe('AP-5-S3 Vertrag und Accessibility', () => {
  test('Security-Logout mappt die drei Aktionen auf explizite Scopes', () => {
    assert.equal(seite.includes('SecurityLogout'), true)
    assert.equal(komponente.includes('data-logout-action={scope}'), true)
    assert.equal(komponente.includes('accountLogoutScopeAction(scope)'), true)
    assert.equal(aktion.includes('signOut({ scope: options.scope })'), true)
    assert.equal(aktion.includes('await supabase.auth.signOut()'), false)
    assert.equal(logik.includes("['local', 'others', 'global']"), true)
    assert.equal(logik.includes('logoutNutzlast'), true)
    assert.equal(logik.includes('Dieses Gerät abmelden'), true)
    assert.equal(logik.includes('Andere Geräte abmelden'), true)
    assert.equal(logik.includes('Überall abmelden'), true)
    assert.equal(komponente.includes('LOGOUT_AKTIONEN'), true)
    assert.equal(komponente.includes('{aktion.label}'), true)
  })

  test('allgemeines Jetnity-Abmelden bleibt unscoped und damit global', () => {
    assert.equal(allgemein.includes('await supabase.auth.signOut()'), true)
    assert.equal(allgemein.includes('scope:'), false)
    assert.equal(navbar.includes('signOutAction'), true)
    assert.equal(navbar.includes('accountLogoutScopeAction'), false)
    assert.equal(footer.includes('signOutAction'), true)
    assert.equal(footer.includes('accountLogoutScopeAction'), false)
  })

  test('others bleibt lokal angemeldet und erfindet keine Sessionliste', () => {
    assert.equal(logik.includes('logoutBeendetLokaleSitzung'), true)
    assert.equal(logik.includes("scope !== 'others'"), true)
    assert.equal(komponente.includes('logoutSollLokalenAuthVerlassen'), true)
    assert.equal(komponente.includes('listSessions'), false)
    assert.equal(komponente.includes('auth.sessions'), false)
    assert.equal(logik.includes('listSessions'), false)
    assert.equal(komponente.includes('wie viele'), false)
    assert.equal(logik.includes('Wie viele andere Sitzungen betroffen waren, ist unbekannt'), true)
  })

  test('Fehler, Unavailable und Unsupported werden nicht als Erfolg gezeigt', () => {
    assert.equal(logik.includes("lage === 'success'"), true)
    assert.equal(komponente.includes('logoutErfolgBehaupten(zustand)'), true)
    assert.equal(komponente.includes('data-logout-lage={zustand.lage}'), true)
    assert.equal(komponente.includes('role={zustand.lage === "error" || zustand.lage === "unavailable" ? "alert" : "status"}'), true)
    assert.equal(komponente.includes('"assertive"'), true)
    assert.equal(komponente.includes('"polite"'), true)
    assert.equal(komponente.includes('min-h-11'), true)
    assert.equal(komponente.includes('variant={aktion.gefaehrlich ? "destructive" : "outline"}'), true)
    assert.equal(komponente.includes('Ja, überall abmelden'), true)
    assert.equal(komponente.includes('aria-describedby={hinweisId}'), true)
    assert.equal(komponente.includes('window.location.assign(new URL("/", window.location.origin).toString())'), true)
  })

  test('kein Session-Listing, kein S4/S5 und keine Secret-Logs', () => {
    assert.equal(komponente.includes('console.log'), false)
    assert.equal(komponente.includes('console.error'), false)
    assert.equal(komponente.includes('localStorage'), false)
    assert.equal(logik.includes('console.log'), false)
    assert.equal(aktion.includes('service_role'), false)
    assert.equal(aktion.includes('createAdminClient'), false)
    assert.equal(mfa.includes('accountLogoutScopeAction'), false)
    assert.equal(passwort.includes('accountLogoutScopeAction'), false)
    assert.equal(komponente.includes('getAuthenticatorAssuranceLevel'), false)
    assert.equal(logik.includes('getAuthenticatorAssuranceLevel'), false)
  })
})
