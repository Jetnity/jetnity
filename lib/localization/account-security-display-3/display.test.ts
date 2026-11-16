import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SecurityMfaStepUp from '@/components/account/SecurityMfaStepUp'
import { ACCOUNT_SECURITY_KATALOG, sicherheitText } from '../account-security-texte'
import {
  sicherheitPasswortStatus, sicherheitPasswortStaerke, sicherheitPasswortRegeln,
  sicherheitSitzungStatus, sicherheitSitzungAal, sicherheitSitzungAblauf, sicherheitLokalerHinweis,
  sicherheitLogoutAktion, sicherheitLogoutStatus, sicherheitStepUpStatus, sicherheitFaktorStatus,
} from '../account-security-display-3'
import {
  passwortAenderungFehler, passwortAenderungStatusText, PASSWORT_AENDERUNG_ANFANG,
  type PasswortAenderungFehlerCode, type PasswortAenderungSchritt,
} from '@/lib/auth/account-password-aenderung'
import { PASSWORT_RICHTLINIE, RICHTLINIE_PUNKTE, staerkeText } from '@/lib/auth/passwort-richtlinie'
import {
  SITZUNG_ANFANG, ANDERE_SITZUNGEN_TEXT, sitzungStatusText, sitzungAalText, sitzungZugangscodeText, lokalenGeraeteHinweisAbleiten,
  type SitzungFehlerCode, type SitzungLage,
} from '@/lib/auth/account-session-view'
import {
  LOGOUT_ANFANG, LOGOUT_AKTIONEN, LOGOUT_SCOPES, LOGOUT_JWT_HINWEIS, logoutFehler, logoutStatusText,
  type LogoutLage, type LogoutFehlerCode,
} from '@/lib/auth/account-logout-scopes'
import {
  MFA_STEP_UP_ANFANG, MFA_STEP_UP_DIALOG_TEXT, mfaStepUpFehler, mfaStepUpStatusText,
  type MfaStepUpFehlerCode, type MfaStepUpLage, type MfaStepUpPhase,
} from '@/lib/auth/account-mfa-step-up'
import { PASSKEY_LAGE_TEXTE, TOTP_LAGE_TEXTE, totpFaktorStatusText, type PasskeyLage, type TotpListeLage } from '@/lib/auth/account-security-lage'
import { securityFehlerEinordnen } from '@/lib/auth/account-security-fehler'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const suffixes = (prefix: string) => Object.keys(ACCOUNT_SECURITY_KATALOG).filter((key) => key.startsWith(prefix)).map((key) => key.slice(prefix.length))

test('DE password messages and policy retain every original state/error; EN is presentation only', () => {
  const states: PasswortAenderungSchritt[] = ['idle', 'requesting_code', 'code_sent', 'verifying', 'updating', 'success', 'error', 'unsupported', 'unavailable']
  for (const schritt of states) {
    const zustand = { ...PASSWORT_AENDERUNG_ANFANG, schritt }
    assert.equal(sicherheitPasswortStatus('de', zustand), passwortAenderungStatusText(zustand), schritt)
    assert.ok(sicherheitPasswortStatus('en', zustand).length > 0)
  }
  for (const code of suffixes('password.error.') as PasswortAenderungFehlerCode[]) {
    const zustand = { schritt: 'error' as const, fehler: passwortAenderungFehler(code) }
    const before = structuredClone(zustand)
    assert.equal(sicherheitPasswortStatus('de', zustand), passwortAenderungStatusText(zustand), code)
    assert.notEqual(sicherheitPasswortStatus('en', zustand), sicherheitPasswortStatus('de', zustand), code)
    assert.deepEqual(zustand, before)
  }
  for (const score of [0, 1, 2, 3, 4, 5]) assert.equal(sicherheitPasswortStaerke('de', score), staerkeText(score))
  assert.deepEqual(sicherheitPasswortRegeln('de'), RICHTLINIE_PUNKTE)
  assert.deepEqual(sicherheitPasswortRegeln('en'), [`At least ${PASSWORT_RICHTLINIE.mindestlaenge} characters`, 'Uppercase & lowercase letters', 'At least 1 number', 'At least 1 symbol (e.g. !?@#)'])
})

test('Session translation retains unknown versus current and preserves sanitized local facts', () => {
  const states: SitzungLage[] = ['loading', 'current', 'unavailable', 'unsupported', 'error']
  for (const lage of states) {
    const state = { ...SITZUNG_ANFANG, lage }
    assert.equal(sicherheitSitzungStatus('de', state), sitzungStatusText(state), lage)
  }
  for (const code of suffixes('session.error.') as SitzungFehlerCode[]) {
    const state = { ...SITZUNG_ANFANG, lage: 'error' as const, fehler: { code, text: 'Do not render raw error' } }
    assert.notEqual(sicherheitSitzungStatus('en', state), state.fehler.text)
    assert.ok(sicherheitSitzungStatus('de', state).length > 0)
  }
  for (const aal of ['aal1', 'aal2', null] as const) assert.equal(sicherheitSitzungAal('de', aal), sitzungAalText(aal))
  assert.equal(sicherheitSitzungAal('en', null), null)
  assert.equal(sicherheitSitzungAblauf('en', null), null)
  const unix = 1794754800
  assert.equal(sicherheitSitzungAblauf('de', unix), sitzungZugangscodeText(unix))
  assert.match(sicherheitSitzungAblauf('en', unix)!, /not the end of the session or the time of its last activity/)
  const hint = lokalenGeraeteHinweisAbleiten({ userAgentData: { brands: [{ brand: 'Chromium', version: '140.0.0' }], platform: 'Linux' } })!
  assert.equal(sicherheitLokalerHinweis('de', hint.text), hint.text)
  assert.match(sicherheitLokalerHinweis('en', hint.text), /Detected locally, not verified by the server as a device identity: Chromium-Browser · Linux/)
  assert.equal(sicherheitText('de', 'session.otherDescription'), ANDERE_SITZUNGEN_TEXT)
  assert.match(sicherheitText('en', 'session.otherDescription'), /neither a device list nor a count, including zero/)
  assert.match(sicherheitSitzungStatus('en', { ...SITZUNG_ANFANG, lage: 'error', fehler: { code: 'network', text: '' } }), /unknown/)
})

test('Logout translation preserves exact scope descriptions, confirmation and JWT limitations', () => {
  const states: LogoutLage[] = ['idle', 'working', 'success', 'error', 'unavailable', 'unsupported']
  for (const scope of [...LOGOUT_SCOPES, null]) {
    for (const lage of states) {
      for (const bestaetigungFuer of ['global', null] as const) {
        const state = { ...LOGOUT_ANFANG, scope, lage, bestaetigungFuer }
        assert.equal(sicherheitLogoutStatus('de', state), logoutStatusText(state), JSON.stringify(state))
        assert.ok(sicherheitLogoutStatus('en', state).length > 0)
      }
    }
  }
  for (const scope of LOGOUT_SCOPES) {
    const { label, beschreibung } = LOGOUT_AKTIONEN[scope]
    assert.deepEqual(sicherheitLogoutAktion('de', scope), { label, beschreibung })
    assert.match(sicherheitLogoutStatus('en', { ...LOGOUT_ANFANG, lage: 'success', scope }), /may remain valid for up to an hour/)
  }
  for (const code of suffixes('logout.error.') as LogoutFehlerCode[]) {
    const state = { ...LOGOUT_ANFANG, lage: 'error' as const, fehler: logoutFehler(code) }
    assert.equal(sicherheitLogoutStatus('de', state), logoutStatusText(state), code)
    assert.notEqual(sicherheitLogoutStatus('en', state), state.fehler.text, code)
  }
  assert.equal(sicherheitText('de', 'logout.jwtHint'), LOGOUT_JWT_HINWEIS)
  assert.match(sicherheitLogoutStatus('en', { ...LOGOUT_ANFANG, lage: 'success', scope: 'others' }), /remains active.*unknown/)
})

test('Step-up projection retains every phase, partial success and post-unenroll uncertainty', () => {
  const phases: MfaStepUpPhase[] = ['idle', 'pruefen', 'warte_auf_code', 'bestaetigen', 'entfernen']
  const states: MfaStepUpLage[] = ['idle', 'working', 'success', 'error', 'unavailable', 'unsupported']
  for (const phase of phases) for (const lage of states) {
    const state = { ...MFA_STEP_UP_ANFANG, phase, lage }
    assert.equal(sicherheitStepUpStatus('de', state), mfaStepUpStatusText(state), `${lage}/${phase}`)
  }
  for (const code of suffixes('step.error.') as MfaStepUpFehlerCode[]) {
    const state = { ...MFA_STEP_UP_ANFANG, lage: 'error' as const, fehler: mfaStepUpFehler(code) }
    const before = structuredClone(state)
    assert.equal(sicherheitStepUpStatus('de', state), mfaStepUpStatusText(state), code)
    assert.notEqual(sicherheitStepUpStatus('en', state), state.fehler.text, code)
    assert.deepEqual(state, before)
  }
  assert.equal(sicherheitText('de', 'step.description'), MFA_STEP_UP_DIALOG_TEXT)
  assert.match(sicherheitText('en', 'step.error.unenroll_failed_nach_step_up'), /succeeded.*still not removed/)
  assert.match(sicherheitText('en', 'step.error.sitzung_unbestaetigt_abmelden_fehlgeschlagen'), /was removed.*could not be confirmed.*sign-out failed/)
  assert.match(sicherheitText('en', 'step.description'), /does not enable a global two-factor requirement/)
})

test('TOTP and Passkey labels preserve unavailable, unsupported, errors and unknown factor states', () => {
  for (const lage of Object.keys(TOTP_LAGE_TEXTE) as TotpListeLage[]) assert.equal(sicherheitText('de', `totp.status.${lage}`), TOTP_LAGE_TEXTE[lage])
  for (const lage of Object.keys(PASSKEY_LAGE_TEXTE) as PasskeyLage[]) assert.equal(sicherheitText('de', `passkey.status.${lage}`), PASSKEY_LAGE_TEXTE[lage])
  for (const status of ['verified', 'unverified', 'unknown', null]) assert.equal(sicherheitFaktorStatus('de', status), totpFaktorStatusText(status))
  assert.equal(sicherheitFaktorStatus('en', 'unknown'), null)
  assert.match(sicherheitText('en', 'totp.status.error'), /unknown/)
  assert.match(sicherheitText('en', 'totp.status.unsupported'), /does not mean that no factors exist/)
  assert.match(sicherheitText('en', 'passkey.status.unsupported'), /not supported.*regardless/)
  assert.match(sicherheitText('en', 'passkey.notConnected'), /has not been connected/)
  const raw = 'network error: secret=NEVER-SHOW-THIS'
  const classified = securityFehlerEinordnen({ vorgang: 'list', meldung: raw })
  assert.equal(sicherheitText('de', `security.error.${classified.code}`), classified.text)
  assert.doesNotMatch(sicherheitText('en', `security.error.${classified.code}`), /secret|NEVER-SHOW/)
})

test('Shared Step-up defaults to DE and renders real localized accessible markup without leaking factor IDs', () => {
  const props = { zustand: { ...MFA_STEP_UP_ANFANG, phase: 'warte_auf_code' as const, zielFaktorId: 'PRIVATE-FACTOR-ID' }, onBestaetigen: () => {}, onAbbrechen: () => {} }
  const fallback = renderToStaticMarkup(createElement(SecurityMfaStepUp, props))
  const de = renderToStaticMarkup(createElement(SecurityMfaStepUp, { ...props, sprache: 'de' }))
  const en = renderToStaticMarkup(createElement(SecurityMfaStepUp, { ...props, sprache: 'en' }))
  assert.equal(fallback, de)
  assert.match(en, /role="dialog"[^>]*aria-modal="true"/)
  assert.match(en, /lang="en"/)
  assert.match(en, /Confirm authenticator app/)
  assert.match(en, /6-digit code/)
  assert.match(en, /autoComplete="one-time-code"/i)
  assert.match(en, /id="account-mfa-step-up-status" role="status" aria-live="polite"/)
  assert.doesNotMatch(en, /PRIVATE-FACTOR-ID|Authenticator-App bestätigen|6-stelliger Code/)
})

test('Security route and metadata use the existing request-cached saved preference reader', () => {
  const page = read('app/account/security/page.tsx')
  const reader = read('lib/localization/konto-anzeigesprache.ts')
  assert.match(page, /export async function generateMetadata\(\)/)
  assert.match(page, /export default async function SecurityPage\(\)/)
  assert.equal((page.match(/await kontoAnzeigesprache\(\)/g) ?? []).length, 2, 'Page and metadata share the cached server read')
  assert.match(reader, /cache\(async/)
  assert.match(page, /<main lang=\{sprache\}/)
  for (const name of ['SecurityPasswort', 'SecuritySitzung', 'SecurityLogout', 'SecurityMFA']) {
    assert.match(page, new RegExp(`<${name} sprache=\\{sprache\\}`))
  }
  assert.match(page, /robots: \{ index: false, follow: false \}/)
  assert.doesNotMatch(page, /localStorage|document\.cookie|user_metadata|createAdminClient|uiEinstellungenSpeichern/)
})
