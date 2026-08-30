import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function lese(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

describe('AP-5-R1 Vertrag, Caller-Inventar und Accessibility', () => {
  const allgemein = lese('app/auth/sign-out.ts')
  const logik = lese('lib/auth/globales-sign-out.ts')
  const formular = lese('components/auth/GlobalesAbmeldenForm.tsx')
  const navbar = lese('components/layout/PublicNavbar.tsx')
  const footer = lese('components/layout/FooterSitzung.tsx')
  const topbar = lese('components/layout/AdminTopbar.tsx')
  const unauthorized = lese('app/unauthorized/page.tsx')
  const adminLogin = lese('app/(public)/admin/login/page.tsx')
  const scopedAktion = lese('app/account/security/logout-action.ts')
  const scopedLogik = lese('lib/auth/account-logout-scopes.ts')
  const scopedUi = lese('components/account/SecurityLogout.tsx')

  test('allgemeines Sign-Out bleibt unscoped und redirected nur nach Erfolg', () => {
    assert.equal(allgemein.includes('await supabase.auth.signOut()'), true)
    assert.equal(/signOut\(\s*\{/.test(allgemein), false)
    assert.equal(allgemein.includes('scope:'), false)
    assert.equal(allgemein.includes("scope: 'local'"), false)
    assert.equal(allgemein.includes("scope: 'others'"), false)
    assert.equal(allgemein.includes('globalesSignOutAusAntwort'), true)
    assert.equal(allgemein.includes('globalesSignOutDarfWeiterleiten'), true)
    assert.equal(allgemein.includes('redirect(ergebnis.ziel)'), true)
    assert.equal(/formData\.get\(/.test(allgemein), false)
    assert.equal(/searchParams/.test(allgemein), false)
    assert.equal(/redirectTo|returnTo|next=/.test(allgemein), false)
    assert.equal(logik.includes("signOut: () =>"), true)
    assert.equal(logik.includes('GLOBALES_SIGN_OUT_ZIEL_PUBLIC'), true)
    assert.equal(logik.includes('GLOBALES_SIGN_OUT_ZIEL_ADMIN'), true)
  })

  test('alle echten allgemeinen/admin Caller nutzen das ehrliche Formular', () => {
    assert.equal(navbar.includes('signOutAction'), true)
    assert.equal(navbar.includes('GlobalesAbmeldenForm'), true)
    assert.equal(navbar.includes('accountLogoutScopeAction'), false)
    assert.equal(/<form action=\{signOutAction\}/.test(navbar), false)

    assert.equal(footer.includes('signOutAction'), true)
    assert.equal(footer.includes('GlobalesAbmeldenForm'), true)
    assert.equal(footer.includes('accountLogoutScopeAction'), false)
    assert.equal(/<form action=\{signOutAction\}/.test(footer), false)

    assert.equal(topbar.includes('signOutToAdminLoginAction'), true)
    assert.equal(topbar.includes('GlobalesAbmeldenForm'), true)
    assert.equal(topbar.includes('signOutAction'), false)
    assert.equal(/<form action=\{signOutToAdminLoginAction\}/.test(topbar), false)
    assert.equal(topbar.includes('onErgebnis'), false)

    assert.equal(unauthorized.includes('signOutAction'), true)
    assert.equal(unauthorized.includes('GlobalesAbmeldenForm'), true)
    assert.equal(/<form action=\{signOutAction\}/.test(unauthorized), false)

    assert.equal(adminLogin.includes('signOutToAdminLoginAction'), true)
    assert.equal(adminLogin.includes('GlobalesAbmeldenForm'), true)
    assert.equal(adminLogin.includes('signOutAction'), false)
    assert.equal(/<form action=\{signOutToAdminLoginAction\}/.test(adminLogin), false)
  })

  test('Failure-UX ist sichtbar, retrybar und screenreader-tauglich', () => {
    assert.equal(formular.includes("role=\"alert\""), true)
    assert.equal(formular.includes('aria-live="assertive"'), true)
    assert.equal(formular.includes('useActionState'), true)
    assert.equal(formular.includes('data-abmelden-lage'), true)
    assert.equal(formular.includes('fehler.text'), true)
    assert.equal(formular.includes('onErgebnis'), false)
    assert.equal(formular.includes('useEffect'), false)
    assert.equal(formular.includes('console.log'), false)
    assert.equal(formular.includes('console.error'), false)
    assert.equal(topbar.includes('globalesAbmeldenMenueOffen'), true)
    assert.equal(topbar.includes('nutzer_schliessen'), true)
    const knopf = navbar.slice(navbar.indexOf('function AbmeldenKnopf'))
    assert.equal(knopf.includes('onFertig'), false)
    assert.equal(knopf.includes('onClick='), false)
  })

  test('AP-5-S3 local/others/global bleibt eine getrennte Authority', () => {
    assert.equal(scopedAktion.includes('signOut({ scope: options.scope })'), true)
    assert.equal(scopedAktion.includes('await supabase.auth.signOut()'), false)
    assert.equal(scopedAktion.includes('GlobalesAbmeldenForm'), false)
    assert.equal(scopedLogik.includes("['local', 'others', 'global']"), true)
    assert.equal(scopedLogik.includes('logoutNutzlast'), true)
    assert.equal(scopedUi.includes('accountLogoutScopeAction(scope)'), true)
    assert.equal(scopedUi.includes('signOutAction'), false)
    assert.equal(logik.includes("'local'"), false)
    assert.equal(logik.includes("'others'"), false)
  })

  test('AP-5-R1 schreibt keine zentrale ADR-0200- oder Architecture-Wahrheit', () => {
    const architecture = lese('ARCHITECTURE.md')
    const decisions = lese('DECISIONS.md')
    const status = lese('docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_STATUS_2026-08-30.md')
    const handoff = lese('docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_HANDOFF_2026-08-30.md')
    assert.equal(architecture.includes('AP-5-R1'), false)
    assert.equal(architecture.includes('Draft-PR #242 / ADR-0200'), false)
    assert.equal(decisions.includes('ehrliche Fehlersemantik für das allgemeine globale Abmelden'), false)
    assert.equal(status.includes('ADR-0200'), false)
    assert.equal(handoff.includes('ADR-0200'), false)
  })

  test('keine Tokens, Session-IDs oder Service-Role im allgemeinen Logout', () => {
    assert.equal(allgemein.includes('service_role'), false)
    assert.equal(allgemein.includes('createAdminClient'), false)
    assert.equal(allgemein.includes('console.log'), false)
    assert.equal(logik.includes('service_role'), false)
    assert.equal(logik.includes('auth.sessions'), false)
    assert.equal(logik.includes('listSessions'), false)
    assert.equal(logik.includes('console.log'), false)
    assert.equal(formular.includes('refresh_token'), false)
    assert.equal(formular.includes('session_id'), false)
  })
})
