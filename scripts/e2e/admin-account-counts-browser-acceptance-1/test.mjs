#!/usr/bin/env node
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateTotp, looksLikeTotpCode } from './totp.mjs'
import { PINS, SOURCE_PATHS } from './constants.mjs'
import { assertPinnedSources, leseSourceManifest, refuseBootstrapOverlay } from './source-manifest.mjs'
import { assertIsolatedConnectionEnvironment, baueKindUmgebung, klassifiziereUmgebung } from './env-guard.mjs'
import { darfOwnedVerzeichnisEntfernen } from './owned-lifecycle.mjs'
import { GATE_IDS, leereMatrix, setzeGate, zusammenfassung } from './gates.mjs'
import { baueConfigOverlay, DISCLOSED_OVERLAY, geplanteSqlAnwendung } from './stack.mjs'
import { FIXTURE_PLAN, emailFor, sanitizeFixtureManifest } from './fixtures.mjs'
import { cleanupDryRunKontrolle } from './cleanup.mjs'
import { COPY } from './constants.mjs'

test('accepted source pins still match the immutable task', () => {
  const manifest = leseSourceManifest()
  assert.equal(assertPinnedSources(manifest), true)
  assert.equal(manifest.files.producer.sha256, PINS.producerSha256)
  assert.equal(manifest.files.wrapper.sha256, PINS.wrapperSha256)
  assert.equal(manifest.files.contract.blob, PINS.contractBlob)
  assert.equal(manifest.files.reader.blob, PINS.readerBlob)
})

test('refuses the reduced #550 bootstrap as a GoTrue overlay', () => {
  assert.throws(
    () => refuseBootstrapOverlay({ plannedSqlPaths: [SOURCE_PATHS.bootstrap], target: 'gotrue' }),
    /Refusing to overlay/,
  )
  assert.deepEqual(geplanteSqlAnwendung(), [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper])
})

test('child env rejects remote URLs and strips hosted connection names', () => {
  assert.throws(
    () => baueKindUmgebung({ loopbackUrl: 'https://example.supabase.co', syntheticAnonKey: 'test-anon' }),
    /Loopback/,
  )
  const kind = baueKindUmgebung({
    parentEnv: {
      PATH: '/usr/bin',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ACCESS_TOKEN: 'parent-token',
      OPENAI_API_KEY: 'parent-model',
      VERCEL: '1',
    },
    loopbackUrl: 'http://127.0.0.1:54321',
    syntheticAnonKey: 'synthetic-local-anon',
    extra: { siteUrl: 'http://127.0.0.1:3000' },
  })
  assert.equal(kind.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321')
  assert.equal(kind.SUPABASE_ACCESS_TOKEN, undefined)
  assert.equal(kind.OPENAI_API_KEY, undefined)
  assert.equal(kind.VERCEL, undefined)
  assert.equal(kind.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED, 'true')
})

test('isolated connection guard names forbidden keys without printing values', () => {
  assert.throws(
    () => assertIsolatedConnectionEnvironment({ DATABASE_URL: 'postgres://example' }, []),
    /DATABASE_URL/,
  )
  const klass = klassifiziereUmgebung({
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    VERCEL: '1',
  })
  assert.equal(klass.parentHasHostedSupabaseNames, true)
  assert.deepEqual(klass.hostedMarkersPresent, ['VERCEL'])
})

test('cleanup refuses to delete while an owned process remains active', () => {
  const probe = cleanupDryRunKontrolle()
  assert.equal(probe.blocked, false)
  assert.equal(probe.allowed, true)
  assert.equal(probe.unused, true)
  assert.equal(
    darfOwnedVerzeichnisEntfernen({ processesStopped: false, reaped: false, neverStarted: false }),
    false,
  )
})

test('gate matrix does not treat preflight BLOCKED as a full-stack PASS', () => {
  const matrix = leereMatrix('NOT RUN')
  setzeGate(matrix, 'G0_preflight', { result: 'BLOCKED' })
  setzeGate(matrix, 'G1_source_pins', { result: 'PASS' })
  const summary = zusammenfassung(matrix)
  assert.equal(summary.fullLocalExecution, false)
  assert.equal(summary.preflightBlocked, true)
  assert.equal(summary.counts['NOT RUN'], GATE_IDS.length - 2)
})

test('fixture plan is not the old HTTP 10/0 proof', () => {
  assert.equal(FIXTURE_PLAN.notAssumed.presentRegisteredAccounts, null)
  assert.equal(FIXTURE_PLAN.deletedAnonymousNoSubject.planned, false)
  const sanitized = sanitizeFixtureManifest(FIXTURE_PLAN, { runId: 'run-test' })
  assert.equal(sanitized.expectedCounts.source, 'pending-owned-stack')
  assert.equal(emailFor('privileged-moderator', 'run-test').endsWith('@aacba1.invalid'), true)
  assert.equal(sanitized.accounts.some((account) => account.status === 'banned'), true)
})

test('TOTP helper returns a 6-digit code from a known RFC fixture', () => {
  // RFC 6238 Appendix B uses a hex key; this only checks local encoding + shape.
  const code = generateTotp('JBSWY3DPEHPK3PXP', { now: 1_111_111_111_000 })
  assert.equal(looksLikeTotpCode(code), true)
  assert.equal(code.length, 6)
})

test('config overlay keeps MFA/password/captcha and discloses seed/studio changes', () => {
  const accepted = [
    'project_id = "jetnity"',
    '[api]',
    'port = 54321',
    '[db]',
    'port = 54322',
    'major_version = 17',
    '[auth]',
    'site_url = "http://localhost:3000"',
    'minimum_password_length = 12',
    '[auth.captcha]',
    'enabled = false',
    '[auth.mfa.totp]',
    'enroll_enabled = true',
    '[studio]',
    'enabled = true',
    '[db.seed]',
    'enabled = true',
  ].join('\n')
  const overlay = baueConfigOverlay(accepted, {
    projectId: 'aacba1-test',
    apiPort: 40121,
    dbPort: 40122,
    siteUrl: 'http://127.0.0.1:40300',
  })
  assert.match(overlay, /project_id = "aacba1-test"/)
  assert.match(overlay, /port = 40121/)
  assert.match(overlay, /minimum_password_length = 12/)
  assert.match(overlay, /enroll_enabled = true/)
  assert.match(overlay, /\[studio\]\nenabled = false/)
  assert.match(overlay, /\[db\.seed\]\nenabled = false/)
  assert.equal(DISCLOSED_OVERLAY.keptAuthBehavior.includes('auth.captcha.enabled=false'), true)
})

test('honest unavailable copy is not a zero', () => {
  assert.doesNotMatch(COPY.unavailable, /\b0\b/)
  assert.doesNotMatch(COPY.failed, /\b0\b/)
})
