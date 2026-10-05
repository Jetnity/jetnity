import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  FORBIDDEN_CONNECTION_KEYS,
  CHILD_ENV_STRIP_KEYS,
  PSQL_NO_STARTUP,
  PSQLRC_SENTINEL,
  assertIsolatedConnectionEnvironment,
  cleanChildEnv,
  psqlSafeArgs,
  requirePgBins,
  registrierePrivatesCluster,
  startePrivatesCluster,
  stoppePrivatesCluster,
  postmasterLebt,
  aktuellerCluster,
  schreibeHostileStartup,
  runPsqlCapture,
} from './admin-account-counts-1-local-proof.mjs'

const hier = dirname(fileURLToPath(import.meta.url))
const runner = join(hier, 'admin-account-counts-1-local-proof.mjs')
const candidate = join(hier, 'admin-account-counts-1-candidate.sql')
const bootstrap = join(hier, 'admin-account-counts-1-bootstrap.sql')

function spawnRunner(envExtra = {}, args = []) {
  const env = { ...process.env, ...envExtra }
  for (const schluessel of FORBIDDEN_CONNECTION_KEYS) {
    if (!(schluessel in envExtra)) delete env[schluessel]
  }
  return spawnSync(process.execPath, [runner, ...args], {
    encoding: 'utf8',
    env,
  })
}

describe('admin-account-counts-1 local proof runner safety', () => {
  test('rejects inherited PGHOST/PGPORT/PGSERVICE/PGDATABASE before any cluster starts', () => {
    for (const schluessel of ['PGHOST', 'PGPORT', 'PGSERVICE', 'PGDATABASE']) {
      assert.throws(
        () => assertIsolatedConnectionEnvironment({ [schluessel]: 'example' }, ['node', runner]),
        /Verbotene Verbindungs-Umgebung/,
      )
    }
  })

  test('rejects remote allow-flag and connection-string overrides', () => {
    assert.throws(
      () => assertIsolatedConnectionEnvironment({ JETNITY_ALLOW_REMOTE_DB: '1' }, ['node', runner]),
      /Remote-DB ist verboten/,
    )
    assert.throws(
      () =>
        assertIsolatedConnectionEnvironment({ DATABASE_URL: 'postgresql://example.invalid/db' }, [
          'node',
          runner,
        ]),
      /Verbotene Verbindungs-Umgebung/,
    )
    assert.throws(
      () =>
        assertIsolatedConnectionEnvironment({}, ['node', runner, 'postgres://db.abc.supabase.com:5432/postgres']),
      /Remote- oder Verbindungsziel/,
    )
  })

  test('spawned runner fails closed on PGHOST and does not print the override value', () => {
    const lauf = spawnRunner({ PGHOST: 'should-not-be-printed.example' })
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Verbotene Verbindungs-Umgebung: PGHOST/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /should-not-be-printed\.example/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /initdb|pg_ctl/)
  })

  test('spawned runner refuses a remote DSN argument without starting a cluster', () => {
    const lauf = spawnRunner({}, ['postgresql://user@db.example.supabase.com:5432/postgres'])
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Remote- oder Verbindungsziel/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /initdb|cluster socket/)
  })

  test('cleanChildEnv strips PSQLRC and connection keys; psql args always disable startup files', () => {
    const env = cleanChildEnv({
      ...process.env,
      PSQLRC: '/tmp/hostile.psqlrc',
      PSQL_HISTORY: '/tmp/hist',
      PGHOST: 'should-be-stripped.example',
    })
    assert.equal(env.PSQLRC, undefined)
    assert.equal(env.PSQL_HISTORY, undefined)
    assert.equal(env.PGHOST, undefined)
    assert.ok(CHILD_ENV_STRIP_KEYS.includes('PSQLRC'))
    assert.deepEqual([...PSQL_NO_STARTUP], ['-X', '--no-psqlrc'])
    assert.throws(() => psqlSafeArgs('postgres'), /registriertes privates Cluster/)
  })

  test('runner and candidate stay local-only in source', () => {
    const runnerSrc = readFileSync(runner, 'utf8')
    const candidateSrc = readFileSync(candidate, 'utf8')
    const bootstrapSrc = readFileSync(bootstrap, 'utf8')
    assert.doesNotMatch(runnerSrc, /from\s+['"][^'"]*sql\.mjs['"]/)
    assert.doesNotMatch(runnerSrc, /['"]sudo['"]/)
    assert.doesNotMatch(runnerSrc, /\bpg_ctlcluster\b/)
    assert.doesNotMatch(candidateSrc, /\/supabase\/migrations\//)
    assert.match(candidateSrc, /LOCAL \/ UNAPPLIED/)
    assert.match(candidateSrc, /interval '720 hours'/)
    assert.match(candidateSrc, /owner to postgres/)
    assert.doesNotMatch(candidateSrc, /create role jetnity_reporting_owner/)
    assert.doesNotMatch(candidateSrc, /grant select on table auth\.users/i)
    assert.match(bootstrapSrc, /METADATA-FAITHFUL FIXTURE/)
    assert.match(bootstrapSrc, /enable row level security/)
    assert.match(bootstrapSrc, /owner to supabase_auth_admin/)
    assert.ok(FORBIDDEN_CONNECTION_KEYS.includes('PGHOST'))
    assert.ok(FORBIDDEN_CONNECTION_KEYS.includes('PGSERVICE'))
    assert.match(runnerSrc, /-X/)
    assert.match(runnerSrc, /--no-psqlrc/)
  })
})

describe('admin-account-counts-1 psql startup-file isolation', () => {
  test('hostile explicit PSQLRC and inherited-home startup files are not executed', () => {
    const bins = requirePgBins()
    let report
    try {
      const state = startePrivatesCluster()
      const hostileDir = join(state.rootDir, 'node-test-hostile')
      mkdirSync(hostileDir, { recursive: true, mode: 0o700 })
      const explicitRc = join(hostileDir, 'explicit.psqlrc')
      const homeRc = join(hostileDir, '.psqlrc')
      schreibeHostileStartup(explicitRc)
      schreibeHostileStartup(homeRc)
      const basisEnv = cleanChildEnv()
      const verbindungsArgs = [
        '-h',
        state.socketDir,
        '-U',
        state.user,
        '-d',
        'postgres',
        '-v',
        'ON_ERROR_STOP=1',
        '-At',
        '-q',
        '-c',
        'select 1',
      ]

      const kontrolle = runPsqlCapture(bins.psql, verbindungsArgs, {
        ...basisEnv,
        PSQLRC: explicitRc,
      })
      assert.match(kontrolle.stdout, new RegExp(PSQLRC_SENTINEL))
      assert.doesNotMatch(kontrolle.stdout + kontrolle.stderr, /supabase|amazonaws|neon\.tech/i)

      const explizit = runPsqlCapture(bins.psql, ['-X', '--no-psqlrc', ...verbindungsArgs], {
        ...basisEnv,
        PSQLRC: explicitRc,
        HOME: '/tmp',
      })
      assert.equal(explizit.status, 0)
      assert.equal(explizit.stdout.trim(), '1')
      assert.doesNotMatch(explizit.stdout + explizit.stderr, new RegExp(PSQLRC_SENTINEL))

      const geerbt = runPsqlCapture(bins.psql, ['-X', '--no-psqlrc', ...verbindungsArgs], {
        ...basisEnv,
        HOME: hostileDir,
      })
      assert.equal(geerbt.status, 0)
      assert.equal(geerbt.stdout.trim(), '1')
      assert.doesNotMatch(geerbt.stdout + geerbt.stderr, new RegExp(PSQLRC_SENTINEL))

      const args = psqlSafeArgs('postgres', ['-At', '-q', '-c', 'select 3'])
      assert.ok(args.includes('-X'))
      assert.ok(args.includes('--no-psqlrc'))
      const runnerLike = runPsqlCapture(bins.psql, args, cleanChildEnv())
      assert.equal(runnerLike.status, 0)
      assert.equal(runnerLike.stdout.trim(), '3')
    } finally {
      report = stoppePrivatesCluster()
    }
    assert.equal(report.error, null)
    assert.equal(report.running, false)
  })
})

describe('admin-account-counts-1 owned-cluster cleanup', () => {
  test('initialization failure still removes the registered directory and never touches another cluster', () => {
    const foreign = join(tmpdir(), 'jetnity-unrelated-cluster-must-remain')
    mkdirSync(foreign, { recursive: true })
    writeFileSync(join(foreign, 'keep.txt'), 'keep')
    let rootDir
    try {
      const state = registrierePrivatesCluster()
      rootDir = state.rootDir
      assert.equal(state.lifecycle, 'registered')
      assert.ok(existsSync(rootDir))
      assert.throws(() => startePrivatesCluster({ failBeforeInit: true }), /injected initialization failure/)
    } finally {
      const report = stoppePrivatesCluster()
      assert.equal(report.running, false)
      assert.equal(report.removed, true)
      assert.equal(existsSync(rootDir), false)
      assert.equal(aktuellerCluster(), null)
    }
    assert.ok(existsSync(join(foreign, 'keep.txt')))
  })

  test('start failure before pg_ctl removes initialized data; stop failure does not delete a live cluster', () => {
    let rootDir
    try {
      const state = registrierePrivatesCluster()
      rootDir = state.rootDir
      assert.throws(() => startePrivatesCluster({ failBeforeStart: true }), /injected start failure before pg_ctl/)
      assert.equal(postmasterLebt(state), false)
    } finally {
      const report = stoppePrivatesCluster()
      assert.equal(report.removed, true)
      assert.equal(existsSync(rootDir), false)
    }

    const live = startePrivatesCluster()
    rootDir = live.rootDir
    assert.equal(postmasterLebt(live), true)
    const blocked = stoppePrivatesCluster({ failStop: true })
    assert.equal(blocked.running, true)
    assert.equal(blocked.removed, false)
    assert.ok(existsSync(live.dataDir))
    assert.equal(postmasterLebt(live), true)
    const finished = stoppePrivatesCluster()
    assert.equal(finished.running, false)
    assert.equal(finished.removed, true)
    assert.equal(existsSync(rootDir), false)
  })

  test('SQL failure after start still stops the postmaster before directory removal', () => {
    const state = startePrivatesCluster()
    const rootDir = state.rootDir
    assert.equal(state.lifecycle, 'started')
    try {
      throw new Error('injected SQL failure')
    } catch {
      const report = stoppePrivatesCluster()
      assert.equal(report.error, null)
      assert.equal(report.running, false)
      assert.equal(report.removed, true)
      assert.equal(existsSync(rootDir), false)
    }
  })
})
