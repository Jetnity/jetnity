import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { devAuthKonfiguration, devAuthPruefkonfiguration, devAuthPushKonfiguration } from '@/lib/supabase/auth-dev-konfiguration'
import { leseToml, tomlWert, type TomlTabelle } from '@/lib/supabase/config-toml'
import { erwarteteAuthKonfiguration } from '@/lib/supabase/auth-erwartung'
import { befund } from '@/lib/supabase/auth-bericht'

const REF = 'yfvbxvijcorffwxbxahl'
const CALLBACK = 'https://jetnity-app-git-feat-dev-security-event-0ab098-jetnity-e1b93c82.vercel.app/auth/callback\\?next=%2Freisen'
const RECOVERY = 'https://jetnity-app-git-feat-official-truth-hum-6fe0cd-jetnity-e1b93c82.vercel.app/auth/update-password'
const DEVICE = 'https://dev.jetnity.com/**'
const RAW = readFileSync(join(process.cwd(), 'supabase/config.toml'), 'utf8')

function config(redirects: unknown = [CALLBACK]): TomlTabelle {
  const parsed = leseToml(RAW)
  ;(parsed.auth as TomlTabelle).additional_redirect_urls = redirects as string[]
  return parsed
}
function raw(redirects: string[]) {
  return RAW.replace(
    /^additional_redirect_urls = .+$/m,
    'additional_redirect_urls = ' + JSON.stringify(redirects),
  )
}
function live(config: TomlTabelle) {
  return Object.fromEntries(erwarteteAuthKonfiguration(config).map((entry) => [entry.api, entry.wert]))
}

describe('Strict approved Development redirect contract', () => {
  test('historic and already-integrated TOML produce exactly the same complete expectations', () => {
    const old = devAuthKonfiguration(config(), REF)
    const integrated = devAuthKonfiguration(config([CALLBACK, RECOVERY]), REF)
    assert.equal(old.roheKonfigurationVollstaendig, false)
    assert.equal(integrated.roheKonfigurationVollstaendig, true)
    assert.deepEqual(old.config, integrated.config)
    assert.deepEqual(tomlWert(old.config, 'auth.additional_redirect_urls'), [CALLBACK, RECOVERY])
    assert.equal(old.herkunft.sourcePr, 1197)
    assert.equal(old.herkunft.sourceCommit, '70a3cb09204e74f6bcd4a5b481e942e526a6102f')
  })

  test('composition does not mutate input and only changes the exact redirect expectation', () => {
    const input = config()
    const before = structuredClone(input)
    Object.freeze((input.auth as TomlTabelle).additional_redirect_urls)
    Object.freeze(input.auth)
    Object.freeze(input)
    const result = devAuthKonfiguration(input, REF)
    assert.deepEqual(input, before)
    const original = live(before)
    const effective = live(result.config)
    assert.equal(Object.keys(effective).length, 56)
    assert.deepEqual(
      Object.keys(original).filter((key) => original[key] !== effective[key]),
      ['uri_allow_list'],
    )
    assert.equal(effective.uri_allow_list, CALLBACK + ',' + RECOVERY)
  })

  for (const ref of ['qscbgcdmivbbnzrcyegn', 'unreviewed-branch', '', REF + ' ']) {
    test('rejects unapproved target ' + (ref || '(empty)'), () => {
      assert.throws(() => devAuthKonfiguration(config(), ref), /ausschließlich/)
      assert.throws(() => devAuthPruefkonfiguration(config(), ref), /ausschließlich/)
      assert.throws(() => devAuthPushKonfiguration(config([CALLBACK, RECOVERY]), ref), /ausschließlich/)
    })
  }

  const badLists: Array<[string, unknown]> = [
    ['missing callback', [RECOVERY]],
    ['empty list', []],
    ['duplicate callback', [CALLBACK, CALLBACK]],
    ['duplicate recovery', [CALLBACK, RECOVERY, RECOVERY]],
    ['extra URL', [CALLBACK, RECOVERY, 'https://unreviewed.example/auth/callback']],
    ['Dev device URL in raw baseline', [CALLBACK, RECOVERY, DEVICE]],
    ['wildcard', [CALLBACK, 'https://*.vercel.app/**']],
    ['changed callback escaping', [CALLBACK.replace('\\?', '?')]],
    ['reordered addresses', [RECOVERY, CALLBACK]],
    ['changed recovery query', [CALLBACK, RECOVERY + '?next=/admin']],
    ['non-list', CALLBACK],
    ['missing value', undefined],
  ]
  for (const [label, redirects] of badLists) {
    test('rejects raw configuration: ' + label, () => {
      const input = config(redirects)
      if (redirects === undefined) delete (input.auth as TomlTabelle).additional_redirect_urls
      assert.throws(() => devAuthKonfiguration(input, REF), /rohe Dev-Redirect-Liste/)
      assert.throws(() => devAuthPruefkonfiguration(input, REF), /rohe Dev-Redirect-Liste/)
      assert.throws(() => devAuthPushKonfiguration(input, REF), /rohe Dev-Redirect-Liste/)
    })
  }

  test('writer refuses the historic raw TOML and accepts only the complete raw TOML', () => {
    assert.throws(() => devAuthPushKonfiguration(config(), REF), /Kein config push und kein PATCH/)
    const integrated = config([CALLBACK, RECOVERY])
    assert.deepEqual(devAuthPushKonfiguration(integrated, REF).config, integrated)
  })

  test('the live response must match both addresses exactly', () => {
    const effective = devAuthKonfiguration(config(), REF).config
    for (const redirect of [CALLBACK, RECOVERY, RECOVERY + ',' + CALLBACK, CALLBACK + ',' + RECOVERY + ',https://extra.example']) {
      const report = befund(effective, { ...live(effective), uri_allow_list: redirect })
      assert.equal(report.sauber, false)
      assert.deepEqual(report.abweichungen.map((entry) => entry.api), ['uri_allow_list'])
    }
    const missing = live(effective)
    delete missing.uri_allow_list
    assert.deepEqual(befund(effective, missing).fehlend, ['uri_allow_list'])
    assert.equal(befund(effective, live(effective)).sauber, true)
  })

  test('MFA, password, unexpected provider and unknown-key drift still fail together', () => {
    const effective = devAuthKonfiguration(config(), REF).config
    const report = befund(effective, {
      ...live(effective),
      mfa_totp_verify_enabled: false,
      password_hibp_enabled: false,
      external_unreviewed_enabled: true,
      unreviewed_setting: 'not-an-expected-setting',
    })
    assert.equal(report.sauber, false)
    assert.deepEqual(report.abweichungen.map((entry) => entry.api).sort(), ['mfa_totp_verify_enabled', 'password_hibp_enabled'])
    assert.deepEqual(report.verstoesse.map((entry) => entry.api), ['external_unreviewed_enabled'])
    assert.ok(report.unklassifiziert.includes('unreviewed_setting'))
  })
})

describe('Owner-approved Dev passkey read expectations', () => {
  test('only the read expectation enables passkeys and the exact Dev device redirect; input and writer stay unchanged', () => {
    const input = config([CALLBACK, RECOVERY])
    const before = structuredClone(input)
    Object.freeze((input.auth as TomlTabelle).passkey)
    Object.freeze(input.auth)
    Object.freeze(input)
    const read = devAuthPruefkonfiguration(input, REF)
    const baseline = live(devAuthKonfiguration(input, REF).config)
    const effective = live(read.config)
    assert.deepEqual(input, before)
    assert.deepEqual(Object.keys(baseline).filter((key) => baseline[key] !== effective[key]), ['uri_allow_list', 'passkey_enabled'])
    assert.equal(effective.passkey_enabled, true)
    assert.equal(effective.uri_allow_list, [CALLBACK, RECOVERY, DEVICE].join(','))
    assert.equal(baseline.passkey_enabled, false)
    assert.equal(baseline.uri_allow_list, [CALLBACK, RECOVERY].join(','))
    assert.equal(live(devAuthPushKonfiguration(input, REF).config).passkey_enabled, false)
    assert.equal(live(devAuthPushKonfiguration(input, REF).config).uri_allow_list, [CALLBACK, RECOVERY].join(','))
    assert.equal(live(leseToml(RAW)).passkey_enabled, false)
    assert.equal(read.passkeyHerkunft.sourcePr, 1240)
    assert.equal(read.passkeyHerkunft.enabled, true)
    assert.equal(read.geraetetestRedirectHerkunft.zusaetzlicheUrl, DEVICE)
    assert.equal(read.geraetetestRedirectHerkunft.sourcePr, 1240)
  })

  test('the Dev reader requires all three exact redirects and rejects other hosts, wider wildcards and paths', () => {
    const effective = devAuthPruefkonfiguration(config(), REF).config
    for (const urls of [
      [CALLBACK, RECOVERY],
      [CALLBACK, DEVICE],
      [RECOVERY, DEVICE],
      [CALLBACK, RECOVERY, 'https://*.jetnity.com/**'],
      [CALLBACK, RECOVERY, 'https://jetnity.com/**'],
      [CALLBACK, RECOVERY, 'https://dev.jetnity.com/auth/callback'],
      [CALLBACK, RECOVERY, DEVICE, 'https://unreviewed.example/**'],
      [CALLBACK, RECOVERY, DEVICE, DEVICE],
      [DEVICE, CALLBACK, RECOVERY],
    ]) {
      const report = befund(effective, { ...live(effective), uri_allow_list: urls.join(',') })
      assert.equal(report.sauber, false, urls.join(','))
      assert.deepEqual(report.abweichungen.map((entry) => entry.api), ['uri_allow_list'])
    }
    assert.equal(befund(effective, live(effective)).sauber, true)
  })

  for (const value of [true, 'false', 0, undefined]) {
    test('rejects an unreviewed raw passkey baseline: ' + String(value), () => {
      const input = config()
      const passkey = (input.auth as TomlTabelle).passkey as TomlTabelle
      if (value === undefined) delete passkey.enabled
      else passkey.enabled = value
      assert.throws(() => devAuthPruefkonfiguration(input, REF), /unveränderten Rohkonfiguration/)
    })
  }

  test('the read overlay preserves MFA, password, provider and unknown-setting failures', () => {
    const effective = devAuthPruefkonfiguration(config(), REF).config
    const report = befund(effective, {
      ...live(effective),
      mfa_totp_verify_enabled: false,
      password_hibp_enabled: false,
      external_unreviewed_enabled: true,
      unreviewed_setting: 'not-an-expected-setting',
    })
    assert.equal(report.sauber, false)
    assert.deepEqual(report.abweichungen.map((entry) => entry.api).sort(), ['mfa_totp_verify_enabled', 'password_hibp_enabled'])
    assert.deepEqual(report.verstoesse.map((entry) => entry.api), ['external_unreviewed_enabled'])
    assert.ok(report.unklassifiziert.includes('unreviewed_setting'))
  })
})

type Calls = { projectReads: number; branchReads: number; authReads: number; subprocesses: number; patches: number; unexpected: number }
function runCli(
  name: 'pruefen' | 'anwenden',
  options: { redirects?: string[]; ref?: string; liveChanges?: Record<string, unknown>; json?: boolean; show?: boolean; projectStatus?: number; branchStatus?: number } = {},
) {
  const fixture = {
    ref: options.ref ?? REF,
    configPath: join(process.cwd(), 'supabase/config.toml'),
    rawConfig: raw(options.redirects ?? [CALLBACK]),
    live: {
      ...live(config([CALLBACK, RECOVERY])),
      ...(name === 'pruefen' ? { passkey_enabled: true, uri_allow_list: [CALLBACK, RECOVERY, DEVICE].join(',') } : {}),
      ...options.liveChanges,
    },
    projectStatus: options.projectStatus ?? 404,
    branchStatus: options.branchStatus ?? 200,
  }
  const args = [
    '--import', 'tsx',
    '--import', join(process.cwd(), 'scripts/auth/testing/auth-dev-cli-register.mjs'),
    join(process.cwd(), 'scripts/auth/' + name + '.ts'),
    ...(options.json ? ['--json'] : []),
    ...(options.show ? ['--zeigen'] : []),
  ]
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 15_000,
    maxBuffer: 1_000_000,
    env: {
      NODE_ENV: 'test',
      PATH: process.env.PATH,
      SUPABASE_PROJECT_REF: fixture.ref,
      SUPABASE_ACCESS_TOKEN: 'offline-auth-fixture',
      JETNITY_AUTH_OFFLINE_TEST: '1',
      JETNITY_AUTH_OFFLINE_FIXTURE: JSON.stringify(fixture),
    },
  })
  assert.equal(result.error, undefined)
  assert.equal(result.signal, null)
  const receipt = result.stderr.split('\n').find((line) => line.startsWith('__JETNITY_AUTH_OFFLINE_CALLS__'))
  assert.ok(receipt, result.stderr)
  const calls = JSON.parse(receipt.slice('__JETNITY_AUTH_OFFLINE_CALLS__'.length)) as Calls
  assert.equal(calls.unexpected, 0)
  return { ...result, calls }
}

describe('Actual Auth CLI entrypoints with isolated transport', () => {
  test('reader succeeds on legacy TOML and reports the reviewed Dev provenance as JSON', () => {
    const result = runCli('pruefen', { json: true })
    assert.equal(result.status, 0, result.stderr)
    const report = JSON.parse(result.stdout)
    assert.equal(report.sauber, true)
    assert.equal(report.geprueft, 56)
    assert.equal(report.devRedirectVertrag.sourcePr, 1197)
    assert.equal(report.devRedirectVertrag.roheKonfigurationVollstaendig, false)
    assert.equal(report.devPasskeyVertrag.enabled, true)
    assert.equal(report.devPasskeyVertrag.sourcePr, 1240)
    assert.equal(report.devGeraetetestRedirectVertrag.zusaetzlicheUrl, DEVICE)
    assert.deepEqual(result.calls, { projectReads: 1, branchReads: 1, authReads: 1, subprocesses: 0, patches: 0, unexpected: 0 })
  })

  for (const value of [false, 'true', null, undefined]) {
    test('reader rejects non-true or missing live Dev passkeys: ' + String(value), () => {
      const result = runCli('pruefen', { json: true, liveChanges: { passkey_enabled: value } })
      assert.equal(result.status, 1)
      const report = JSON.parse(result.stdout)
      assert.equal(report.sauber, false)
      if (value === undefined) assert.deepEqual(report.fehlend, ['passkey_enabled'])
      else {
        assert.deepEqual(report.abweichungen.map((entry: { api: string }) => entry.api), ['passkey_enabled'])
        assert.equal(report.abweichungen[0].erwartet, true)
        assert.match(report.abweichungen[0].quelle, /Owner-Freigabe 2026-11-21 \(#1240\)/)
      }
      assert.deepEqual(result.calls, { projectReads: 1, branchReads: 1, authReads: 1, subprocesses: 0, patches: 0, unexpected: 0 })
    })
  }

  test('reader refuses the Production ref even if remote metadata presents it as a branch', () => {
    const result = runCli('pruefen', { ref: 'qscbgcdmivbbnzrcyegn', projectStatus: 404, branchStatus: 200 })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /ausschließlich/)
    assert.deepEqual(result.calls, { projectReads: 1, branchReads: 1, authReads: 0, subprocesses: 0, patches: 0, unexpected: 0 })
  })

  test('reader retains nonzero exit and source attribution on missing live recovery URL', () => {
    const result = runCli('pruefen', { json: true, liveChanges: { uri_allow_list: CALLBACK } })
    assert.equal(result.status, 1)
    const report = JSON.parse(result.stdout)
    assert.equal(report.sauber, false)
    assert.deepEqual(report.abweichungen.map((entry: { api: string }) => entry.api), ['uri_allow_list'])
    assert.match(report.abweichungen[0].quelle, /auth-dev-konfiguration/)
    assert.match(report.abweichungen[0].quelle, /Dev-Dashboard-Lesung 2026-11-21/)
    assert.equal(result.calls.patches, 0)
    assert.equal(result.calls.subprocesses, 0)
  })

  test('reader keeps existing remote project rejection before Auth reads', () => {
    const result = runCli('pruefen', { ref: 'qscbgcdmivbbnzrcyegn', projectStatus: 200, branchStatus: 404 })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /eigenständiges Projekt/)
    assert.equal(result.calls.authReads, 0)
    assert.equal(result.calls.subprocesses, 0)
    assert.equal(result.calls.patches, 0)
  })

  test('reader rejects an unreviewed remote branch before Auth reads', () => {
    const result = runCli('pruefen', { ref: 'unreviewed-branch' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /ausschließlich/)
    assert.equal(result.calls.authReads, 0)
    assert.equal(result.calls.patches, 0)
  })

  test('reader rejects ambiguous remote project and branch responses before Auth reads', () => {
    const result = runCli('pruefen', { projectStatus: 200, branchStatus: 200 })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /weder Projekt \(200\) noch Branch \(200\)/)
    assert.equal(result.calls.authReads, 0)
    assert.equal(result.calls.subprocesses, 0)
    assert.equal(result.calls.patches, 0)
  })

  test('writer blocks legacy TOML before every Auth write or subprocess', () => {
    const result = runCli('anwenden')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Auth-Anwendung gesperrt/)
    assert.deepEqual(result.calls, { projectReads: 1, branchReads: 1, authReads: 0, subprocesses: 0, patches: 0, unexpected: 0 })
  })

  test('writer integrated dry-run performs one read and no subprocess or PATCH', () => {
    const result = runCli('anwenden', { redirects: [CALLBACK, RECOVERY], show: true })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(result.calls, { projectReads: 1, branchReads: 1, authReads: 1, subprocesses: 0, patches: 0, unexpected: 0 })
  })

  test('writer integrated path reaches only the existing CLI and complete readback', () => {
    const result = runCli('anwenden', { redirects: [CALLBACK, RECOVERY] })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Alle 56 erwarteten Werte/)
    assert.deepEqual(result.calls, { projectReads: 1, branchReads: 1, authReads: 2, subprocesses: 1, patches: 0, unexpected: 0 })
  })

  test('writer refuses broadened raw TOML with zero subprocess or PATCH', () => {
    const result = runCli('anwenden', { redirects: [CALLBACK, RECOVERY, 'https://extra.example'] })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /rohe Dev-Redirect-Liste/)
    assert.equal(result.calls.authReads, 0)
    assert.equal(result.calls.subprocesses, 0)
    assert.equal(result.calls.patches, 0)
  })
})

