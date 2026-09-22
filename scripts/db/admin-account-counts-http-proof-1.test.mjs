import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  FORBIDDEN_CONNECTION_KEYS,
  CHILD_ENV_STRIP_KEYS,
} from './admin-account-counts-1-local-proof.mjs'
import {
  HTTP_FORBIDDEN_KEYS,
  EXPECTED,
  SNAPSHOT,
  POSTGREST_TAR_SHA256,
  POSTGREST_URL,
  assertIsolatedHttpEnvironment,
  assertExactSourceHashes,
  assertConfigIsLoopbackOnly,
  buildPostgrestConfig,
  signLocalJwt,
  findPgBinsPrefer17,
  cleanProofEnv,
} from './admin-account-counts-http-proof-1.mjs'

const hier = dirname(fileURLToPath(import.meta.url))
const runner = join(hier, 'admin-account-counts-http-proof-1.mjs')
const fixture = join(hier, 'admin-account-counts-http-proof-1-fixture.sql')
const candidate = join(hier, 'admin-account-counts-1-candidate.sql')
const bootstrap = join(hier, 'admin-account-counts-1-bootstrap.sql')

function spawnRunner(envExtra = {}, args = []) {
  const env = { ...process.env, ...envExtra }
  for (const schluessel of HTTP_FORBIDDEN_KEYS) {
    if (!(schluessel in envExtra)) delete env[schluessel]
  }
  return spawnSync(process.execPath, ['--import', 'tsx', runner, ...args], {
    encoding: 'utf8',
    env,
  })
}

describe('admin-account-counts-http-proof-1 harness safety', () => {
  test('rejects inherited PG and PostgREST/Supabase connection defaults before any process starts', () => {
    for (const schluessel of ['PGHOST', 'PGRST_DB_URI', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
      assert.throws(
        () => assertIsolatedHttpEnvironment({ [schluessel]: 'example' }, ['node', runner]),
        /Verbotene/,
      )
    }
  })

  test('rejects public bind arguments and remote allow-flag', () => {
    assert.throws(
      () => assertIsolatedHttpEnvironment({}, ['node', runner, '0.0.0.0']),
      /Öffentliches Bind-Ziel/,
    )
    assert.throws(
      () => assertIsolatedHttpEnvironment({ JETNITY_ALLOW_REMOTE_DB: '1' }, ['node', runner]),
      /Remote-DB ist verboten/,
    )
  })

  test('spawned runner fails closed on PGHOST and does not print the override', () => {
    const lauf = spawnRunner({ PGHOST: 'should-not-be-printed.example' })
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Verbotene/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /should-not-be-printed\.example/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /initdb|postgrest --/)
  })

  test('cleanProofEnv strips PSQLRC, PG* and PGRST_* keys', () => {
    const env = cleanProofEnv({
      ...process.env,
      PSQLRC: '/tmp/hostile.psqlrc',
      PGHOST: 'should-be-stripped.example',
      PGRST_JWT_SECRET: 'should-be-stripped',
    })
    assert.equal(env.PSQLRC, undefined)
    assert.equal(env.PGHOST, undefined)
    assert.equal(env.PGRST_JWT_SECRET, undefined)
    assert.ok(CHILD_ENV_STRIP_KEYS.includes('PSQLRC'))
    assert.ok(FORBIDDEN_CONNECTION_KEYS.includes('PGHOST'))
  })

  test('PostgREST config builder refuses non-loopback hosts and wildcard binds', () => {
    assert.throws(
      () =>
        buildPostgrestConfig({
          host: '0.0.0.0',
          port: 1,
          dbUri: 'postgres://jetnity_http_authenticator@/db?host=/tmp/sock',
          jwtFile: '/tmp/jwt',
        }),
      /numeric loopback/,
    )
    const config = buildPostgrestConfig({
      host: '127.0.0.1',
      port: 18001,
      dbUri: 'postgres://jetnity_http_authenticator@/db?host=/tmp/sock',
      jwtFile: '/tmp/jwt.secret',
    })
    assertConfigIsLoopbackOnly(config)
    assert.match(config, /server-host = "127\.0\.0\.1"/)
    assert.match(config, /db-schemas = "public"/)
    assert.doesNotMatch(config, /jetnity_reporting|auth,|0\.0\.0\.0/)
  })

  test('source hash helper stays fail-closed on mismatch', () => {
    assert.throws(
      () => assertExactSourceHashes({ ...EXPECTED, wrapper: '0'.repeat(64) }),
      /source hash mismatch/,
    )
    assertExactSourceHashes(EXPECTED)
    assert.equal(SNAPSHOT, 'dcf7bfee497ba3aa2038a43fe4bc2a09e541625f')
  })

  test('local JWT helper signs HS256 without logging the token in this assertion', () => {
    const token = signLocalJwt({ role: 'authenticated', sub: '10000000-0000-4000-8000-000000000004' }, 'x'.repeat(48))
    assert.match(token, /^eyJ/)
    assert.equal(token.split('.').length, 3)
  })

  test('runner, fixture and accepted SQL stay local-only in source', () => {
    const runnerSrc = readFileSync(runner, 'utf8')
    const fixtureSrc = readFileSync(fixture, 'utf8')
    const candidateSrc = readFileSync(candidate, 'utf8')
    const bootstrapSrc = readFileSync(bootstrap, 'utf8')
    assert.doesNotMatch(runnerSrc, /from\s+['"][^'"]*sql\.mjs['"]/)
    assert.doesNotMatch(runnerSrc, /['"]sudo['"]/)
    assert.doesNotMatch(runnerSrc, /\bpg_ctlcluster\b/)
    assert.match(runnerSrc, /127\.0\.0\.1/)
    assert.match(runnerSrc, /dcf7bfee497ba3aa2038a43fe4bc2a09e541625f/)
    assert.match(fixtureSrc, /LOCAL HTTP-PROOF/)
    assert.match(fixtureSrc, /DISPOSABLE LARGE-VALUE TRANSPORT FIXTURE/)
    assert.doesNotMatch(fixtureSrc, /grant select on table auth\.users/i)
    assert.doesNotMatch(fixtureSrc, /disable row level security/i)
    assert.match(candidateSrc, /LOCAL \/ UNAPPLIED/)
    assert.match(bootstrapSrc, /METADATA-FAITHFUL FIXTURE/)
    assert.match(POSTGREST_URL, /PostgREST\/postgrest\/releases\/download\/v16\.3/)
    assert.equal(POSTGREST_TAR_SHA256.length, 64)
    assert.ok(findPgBinsPrefer17())
  })
})
