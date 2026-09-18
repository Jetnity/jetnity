// lib/supabase/auth-produktion-lesen.test.ts
//
// Der Production-Auth-Leser darf nur die Audit-Allowlist ausgeben.
// Diese Datei speist absichtlich Secret-ähnliche Schlüssel ein und prüft,
// dass weder Rohkonfiguration noch unbekannte Werte die Ausgabe erreichen.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  BESTAETIGTES_PRODUCTION_PROJEKT,
  PRODUCTION_AUTH_AUDIT_FELDER,
  productionAuthSnapshotAusKonfiguration,
  productionAuthSnapshotText,
  produktionLesenAuftrag,
} from '@/lib/supabase/auth-produktion-lesen'

const GEHEIM = 'sbp_v0_5f3c9a1e7d4b8f2a6c0e9b3d7a1f5c8e2b4d6a0f'
const JWT = 'jwt-secret-value-must-never-appear'
const SMTP_PASS = 'smtp-password-value-must-never-appear'
const SMTP_USER = 'smtp-user-value-must-never-appear'
const SMTP_HOST = 'smtp.internal.example'
const CAPTCHA = 'captcha-secret-value-must-never-appear'
const OAUTH_ID = 'oauth-client-id-must-never-appear'
const OAUTH_SECRET = 'oauth-client-secret-must-never-appear'
const UNBEKANNT = 'unknown-auth-value-must-never-appear'
const TOKEN = 'supabase-access-token-must-never-appear'

const VOLL: Record<string, unknown> = {
  site_url: 'https://jetnity.example',
  uri_allow_list: 'https://jetnity.example/auth/callback',
  password_hibp_enabled: true,
  rate_limit_email_sent: 2,
  rate_limit_otp: 30,
  rate_limit_verify: 30,
  rate_limit_token_refresh: 150,
  mfa_totp_enroll_enabled: true,
  mfa_totp_verify_enabled: true,
  mfa_allow_low_aal: false,
  mailer_allow_unverified_email_sign_ins: false,
  jwt_secret: JWT,
  smtp_pass: SMTP_PASS,
  smtp_user: SMTP_USER,
  smtp_host: SMTP_HOST,
  smtp_admin_email: 'smtp-admin@example.internal',
  security_captcha_secret: CAPTCHA,
  external_google_client_id: OAUTH_ID,
  external_google_secret: OAUTH_SECRET,
  zukunft_signing_key: GEHEIM,
  unknown_future_key: UNBEKANNT,
  SUPABASE_ACCESS_TOKEN: TOKEN,
}

const UMGEBUNG = {
  SUPABASE_ACCESS_TOKEN: TOKEN,
  SUPABASE_PROJECT_REF: BESTAETIGTES_PRODUCTION_PROJEKT,
}

const ARGV = [
  'node',
  'scripts/auth/produktion-lesen.ts',
  '--produktion',
  '--projekt-ref',
  BESTAETIGTES_PRODUCTION_PROJEKT,
]

const leser = readFileSync(join(process.cwd(), 'scripts/auth/produktion-lesen.ts'), 'utf8')
const helfer = readFileSync(join(process.cwd(), 'lib/supabase/auth-produktion-lesen.ts'), 'utf8')
const ci = readFileSync(join(process.cwd(), '.github/workflows/ci.yml'), 'utf8')
const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  scripts: Record<string, string>
}

const VERBOTENE_AUSGABE = [
  GEHEIM,
  JWT,
  SMTP_PASS,
  SMTP_USER,
  SMTP_HOST,
  CAPTCHA,
  OAUTH_ID,
  OAUTH_SECRET,
  UNBEKANNT,
  TOKEN,
  'jwt_secret',
  'smtp_pass',
  'smtp_user',
  'smtp_host',
  'security_captcha_secret',
  'external_google_client_id',
  'external_google_secret',
  'unknown_future_key',
  'zukunft_signing_key',
  'SUPABASE_ACCESS_TOKEN',
]

function ausgabeVon(live: Record<string, unknown>): string {
  return productionAuthSnapshotText(productionAuthSnapshotAusKonfiguration(live))
}

describe('Production-Auth-Allowlist', () => {
  test('gibt genau die Pflichtfelder in fester Reihenfolge aus', () => {
    const snapshot = productionAuthSnapshotAusKonfiguration(VOLL)
    assert.deepEqual(Object.keys(snapshot), [...PRODUCTION_AUTH_AUDIT_FELDER])
    assert.equal(snapshot.site_url, 'https://jetnity.example')
    assert.equal(snapshot.uri_allow_list, 'https://jetnity.example/auth/callback')
    assert.equal(snapshot.password_hibp_enabled, true)
    assert.equal(snapshot.rate_limit_email_sent, 2)
    assert.equal(snapshot.rate_limit_otp, 30)
    assert.equal(snapshot.rate_limit_verify, 30)
    assert.equal(snapshot.rate_limit_token_refresh, 150)
    assert.equal(snapshot.mfa_totp_enroll_enabled, true)
    assert.equal(snapshot.mfa_totp_verify_enabled, true)
    assert.equal(snapshot.mfa_allow_low_aal, false)
    assert.equal(snapshot.mailer_allow_unverified_email_sign_ins, false)
  })

  test('normalisiert eine Redirect-Liste zu einem sicheren Skalar', () => {
    const snapshot = productionAuthSnapshotAusKonfiguration({
      ...VOLL,
      uri_allow_list: ['https://a.example', 'https://b.example'],
    })
    assert.equal(snapshot.uri_allow_list, 'https://a.example,https://b.example')
  })

  test('lehnt ein Objekt in einem Pflichtfeld fail-closed ab', () => {
    assert.throws(
      () =>
        productionAuthSnapshotAusKonfiguration({
          ...VOLL,
          site_url: { raw: GEHEIM },
        }),
      /sicheren skalaren Wert/,
    )
  })
})

describe('Keine Rohkonfiguration und keine Secrets in der Ausgabe', () => {
  test('Secret-ähnliche Werte und unbekannte Schlüssel erscheinen nicht', () => {
    const ausgabe = ausgabeVon(VOLL)
    for (const verboten of VERBOTENE_AUSGABE) {
      assert.equal(ausgabe.includes(verboten), false, verboten)
    }
    assert.equal(ausgabe.includes(JSON.stringify(VOLL)), false)
    assert.match(ausgabe, /JETNITY_PRODUCTION_AUTH_SNAPSHOT_BEGIN/)
    assert.match(ausgabe, /JETNITY_PRODUCTION_AUTH_SNAPSHOT_END/)
    assert.match(ausgabe, /https:\/\/jetnity\.example/)
  })

  test('ein fehlendes Pflichtfeld ist kein PASS', () => {
    const ohne = { ...VOLL }
    delete ohne.site_url
    assert.throws(
      () => productionAuthSnapshotAusKonfiguration(ohne),
      /unvollständig.*site_url/,
    )
  })

  test('mehrere fehlende Pflichtfelder werden alle genannt', () => {
    const ohne = { ...VOLL }
    delete ohne.password_hibp_enabled
    delete ohne.uri_allow_list
    assert.throws(
      () => productionAuthSnapshotAusKonfiguration(ohne),
      /uri_allow_list.*password_hibp_enabled|password_hibp_enabled.*uri_allow_list/,
    )
  })
})

describe('Production-Zielbestätigung ist Pflicht', () => {
  test('gültiger Aufruf bestätigt genau das Production-Projekt', () => {
    const auftrag = produktionLesenAuftrag(ARGV, UMGEBUNG)
    assert.equal(auftrag.bestaetigterRef, BESTAETIGTES_PRODUCTION_PROJEKT)
    assert.equal('SUPABASE_ACCESS_TOKEN' in auftrag, false)
  })

  test('ohne --produktion abbrechen', () => {
    assert.throws(
      () =>
        produktionLesenAuftrag(
          ['node', 'lesen.ts', '--projekt-ref', BESTAETIGTES_PRODUCTION_PROJEKT],
          UMGEBUNG,
        ),
      /--produktion/,
    )
  })

  test('ohne --projekt-ref abbrechen', () => {
    assert.throws(
      () => produktionLesenAuftrag(['node', 'lesen.ts', '--produktion'], UMGEBUNG),
      /--projekt-ref/,
    )
  })

  test('ein anderer Projekt-Ref wird abgelehnt', () => {
    assert.throws(
      () =>
        produktionLesenAuftrag(
          ['node', 'lesen.ts', '--produktion', '--projekt-ref', 'anderesprojektref'],
          UMGEBUNG,
        ),
      /bestätigte Production-Projekt/,
    )
  })

  test('fehlendes Token, fehlender Ref und Ref-Mismatch brechen ab', () => {
    assert.throws(
      () => produktionLesenAuftrag(ARGV, { SUPABASE_PROJECT_REF: BESTAETIGTES_PRODUCTION_PROJEKT }),
      /SUPABASE_ACCESS_TOKEN fehlt/,
    )
    assert.throws(
      () => produktionLesenAuftrag(ARGV, { SUPABASE_ACCESS_TOKEN: TOKEN }),
      /SUPABASE_PROJECT_REF fehlt/,
    )
    assert.throws(
      () =>
        produktionLesenAuftrag(ARGV, {
          SUPABASE_ACCESS_TOKEN: TOKEN,
          SUPABASE_PROJECT_REF: 'anderesprojektref',
        }),
      /stimmt nicht mit SUPABASE_PROJECT_REF/,
    )
  })

  test('Schreib- und unbekannte Flags sind verboten', () => {
    assert.throws(
      () => produktionLesenAuftrag([...ARGV, '--schreiben'], UMGEBUNG),
      /GET-only/,
    )
    assert.throws(
      () => produktionLesenAuftrag([...ARGV, '--entwicklung'], UMGEBUNG),
      /GET-only/,
    )
  })
})

describe('Der neue Leser enthält keinen Schreib- oder Schlüsselpfad', () => {
  test('Skript importiert nur GET-Primitiven und serialisiert nicht die Rohantwort', () => {
    assert.match(leser, /produktionsZiel/)
    assert.match(leser, /authKonfiguration/)
    assert.match(leser, /produktionLesenAuftrag/)
    assert.match(leser, /productionAuthSnapshotAusKonfiguration/)
    assert.match(leser, /productionAuthSnapshotText/)
    assert.equal(leser.includes('authKonfigurationSetzen'), false)
    assert.equal(leser.includes('projektSchluessel'), false)
    assert.equal(/\bPATCH\b/.test(leser), false)
    assert.equal(/\bPOST\b/.test(leser), false)
    assert.equal(/\bPUT\b/.test(leser), false)
    assert.equal(/\bDELETE\b/.test(leser), false)
    assert.equal(leser.includes('JSON.stringify(live)'), false)
    assert.equal(helfer.includes('authKonfigurationSetzen'), false)
    assert.equal(helfer.includes('projektSchluessel'), false)
    assert.equal(/\bPATCH\b/.test(helfer), false)
    assert.equal(/\bPOST\b/.test(helfer), false)
    assert.equal(/\bPUT\b/.test(helfer), false)
    assert.equal(/\bDELETE\b/.test(helfer), false)
  })

  test('package.json stellt den GET-only-Script bereit', () => {
    assert.match(pkg.scripts['auth:produktion:lesen'] ?? '', /produktion-lesen/)
    assert.equal((pkg.scripts['auth:produktion:lesen'] ?? '').includes('anwenden'), false)
  })
})

describe('Temporärer CI-Schritt ist exact-branch-only', () => {
  test('Development-Abgleich bleibt unverändert und wird nicht übersprungen', () => {
    assert.match(
      ci,
      /name: Abgleich\n        if: steps\.zugang\.outputs\.vorhanden == 'ja'\n        run: npm run auth:pruefen/,
    )
  })

  test('Production-Lesen läuft nur auf diesem PR-Branch und überschreibt den Ref nur im Step', () => {
    assert.match(ci, /auth:produktion:lesen/)
    assert.match(ci, /github\.event_name == 'pull_request'/)
    assert.match(ci, /github\.head_ref == 'verify\/v1-production-auth-verification-1'/)
    assert.match(ci, /--produktion --projekt-ref qscbgcdmivbbnzrcyegn/)

    const start = ci.indexOf('name: Production Auth lesen')
    assert.ok(start >= 0)
    const produktionSchritt = ci.slice(start, start + 700)
    assert.match(produktionSchritt, /github\.event_name == 'pull_request'/)
    assert.match(produktionSchritt, /github\.head_ref == 'verify\/v1-production-auth-verification-1'/)
    assert.match(produktionSchritt, /SUPABASE_PROJECT_REF: qscbgcdmivbbnzrcyegn/)
    assert.match(produktionSchritt, /auth:produktion:lesen/)
    assert.equal(produktionSchritt.includes('auth:anwenden'), false)
    assert.equal(produktionSchritt.includes('authKonfigurationSetzen'), false)
    assert.equal(produktionSchritt.includes('auth:pruefen'), false)
  })
})
