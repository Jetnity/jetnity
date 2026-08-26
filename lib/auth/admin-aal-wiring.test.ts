import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const lese = (relativ: string) => readFileSync(join(hier, relativ), 'utf8')

describe('Zentraler Admin-AAL2-Guard – Verdrahtung', () => {
  const guard = lese('./admin-guard.ts')
  const login = lese('../../app/(public)/admin/login/actions.ts')
  const mfaSeite = lese('../../app/(public)/admin/mfa/page.tsx')
  const mfaAction = lese('../../app/(public)/admin/mfa/actions.ts')
  const mfaStepUp = lese('../../app/(public)/admin/mfa/AdminMfaStepUp.tsx')
  const mfaLayout = lese('../../app/(public)/admin/mfa/layout.tsx')
  const middleware = lese('../../middleware.ts')
  const consumerLogin = lese('../../components/auth/LoginForm.tsx')
  const callback = lese('../../app/auth/callback/CallbackClient.tsx')
  const naechstes = lese('./naechstes-ziel.ts')
  const layout = lese('../../app/(admin)/layout.tsx')

  test('evaluateAdminAccess wendet applyAdminAal auf currentLevel an', () => {
    assert.match(guard, /applyAdminAal/)
    assert.match(guard, /getAuthenticatorAssuranceLevel/)
    assert.match(guard, /parseAalLookup/)
    assert.equal(guard.includes('nextLevel'), false)
    assert.match(guard, /aal2-required/)
    assert.match(guard, /ADMIN_STEP_UP_PFAD/)
  })

  test('Seiten und APIs teilen dieselbe AAL-Wahrheit', () => {
    assert.match(guard, /export async function requireAdminPage/)
    assert.match(guard, /export async function requireAdminApi/)
    assert.match(guard, /const decision = await evaluateAdminAccess\(options\)/)
    assert.match(guard, /NextResponse\.json/)
    assert.equal(guard.includes("redirect('/admin/login')") || guard.includes('redirect("/admin/login")'), true)
    assert.match(guard, /if \(decision\.denial === 'aal2-required'\) redirect\(ADMIN_STEP_UP_PFAD\)/)
    assert.equal(guard.includes('redirect(`/admin'), false)
  })

  test('9./10. API-Ablehnung bleibt JSON, kein HTML-Redirect', () => {
    const apiTeil = guard.slice(guard.indexOf('export async function requireAdminApi'))
    assert.match(apiTeil, /statusForDenial\(decision\.denial\)/)
    assert.match(apiTeil, /NextResponse\.json/)
    assert.equal(apiTeil.includes('redirect('), false)
  })

  test('11. Passwortlogin gibt AAL1 nicht direkt nach /admin frei', () => {
    assert.match(login, /entscheideAdminLoginFortgang/)
    assert.match(login, /evaluateAdminAccess/)
    assert.match(login, /ADMIN_STEP_UP_PFAD/)
    assert.match(login, /if \(fortgang\.art === 'freigeben'\) redirect\('\/admin'\)/)
    assert.match(login, /if \(fortgang\.art === 'step-up'\) redirect\(ADMIN_STEP_UP_PFAD\)/)
  })

  test('12. Magic-Link, OAuth und bestehende Sessions haben keinen schwächeren Pfad', () => {
    assert.match(login, /emailRedirectTo: `\$\{site\}\/admin`/)
    assert.equal(login.includes('emailRedirectTo: `http'), false)
    assert.match(callback, /erlaubtesNaechstesZiel/)
    assert.match(naechstes, /pathname === '\/account'/)
    assert.equal(naechstes.includes("pathname === '/admin'"), false)
    assert.match(consumerLogin, /erlaubtesNaechstesZiel/)
    assert.match(layout, /requireAdminPage\(\{ surface: 'admin-bereich' \}\)/)
  })

  test('13. Step-up liegt nicht hinter dem AAL2-Admin-Guard', () => {
    assert.equal(mfaSeite.includes('requireAdminPage'), false)
    assert.equal(mfaSeite.includes('requireAdminApi'), false)
    assert.match(mfaSeite, /evaluateAdminAccess/)
    assert.match(mfaSeite, /aal2-required/)
    assert.match(mfaSeite, /AdminMfaStepUp/)
    assert.match(mfaLayout, /NICHT_INDEXIEREN/)
    assert.match(
      middleware,
      /pathname\.startsWith\('\/admin'\) && !pathname\.startsWith\('\/admin\/login'\)/,
    )
    assert.equal(middleware.includes("!pathname.startsWith('/admin/mfa')"), false)
  })

  test('Step-up belegt AAL2 erneut serverseitig und begrenzt das Return-Ziel', () => {
    assert.match(mfaAction, /evaluateAdminAccess/)
    assert.match(mfaAction, /erlaubtesAdminZiel/)
    assert.match(mfaAction, /bestaetigeAdminAal2Action/)
    assert.equal(mfaAction.includes('NextResponse.redirect'), false)
    assert.match(mfaStepUp, /MFATotpDialog/)
    assert.match(mfaStepUp, /startTotpChallenge/)
    assert.match(mfaStepUp, /bestaetigeAdminAal2Action/)
    assert.match(mfaStepUp, /ADMIN_MFA_EINRICHTUNG/)
    assert.match(mfaStepUp, /istKeinTotpFaktorFehler/)
  })
})
