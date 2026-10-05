#!/usr/bin/env node
// E2 reconstructed reviewer reproduction — 2026-09-22 after TL 5282860545.
// Not an archived copy of the earlier session-local /tmp probe.
// Exact-source 56/56 remains a separate evidence class (exact-source-run.txt).
//
// Minimum required by E2:
//   1) HOME-only .psqlrc negative-control pair
//   2) DST start-displacement vs elapsed-duration oracle
//
// Prerequisites: local PostgreSQL 16+ binaries (initdb, pg_ctl, postgres, psql).
// Do not start system 16/main. No remote DSN. Cleanup only this run's directory.
//
//   node docs/evidence/admin-account-counts-independent-verification-1/repro-home-psqlrc-and-dst.mjs

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'

const SENTINEL = 'JETNITY_PSQLRC_SENTINEL'
const REVIEWED_CANDIDATE = 'dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420'
const HISTORICAL_TARGET = 'b5bbe211bc82c16da34bc8f48b58f39920af5f5a'
const FORBIDDEN = [
  'PGHOST',
  'PGHOSTADDR',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'PGSERVICE',
  'DATABASE_URL',
  'POSTGRES_URL',
  'SUPABASE_DB_URL',
  'JETNITY_ALLOW_REMOTE_DB',
  'PSQLRC',
]

const rows = []
function rec(id, ok, expected, actual) {
  rows.push({ id, ok, expected, actual: String(actual) })
  console.log(`${ok ? '  ok  ' : ' FEHL '} ${id}`)
  console.log(`       expected: ${expected}`)
  console.log(`       actual:   ${String(actual).replace(/\s+/g, ' ').slice(0, 280)}`)
}

function findBin(name) {
  for (const dir of ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/17/bin', '/usr/bin']) {
    const pfad = join(dir, name)
    if (existsSync(pfad)) return pfad
  }
  return null
}

function cleanEnv(base = process.env) {
  const env = { ...base }
  for (const key of Object.keys(env)) {
    if (key.startsWith('PG') || FORBIDDEN.includes(key) || key === 'PSQL_HISTORY') delete env[key]
  }
  delete env.SUPABASE_ACCESS_TOKEN
  delete env.SUPABASE_PROJECT_REF
  delete env.NEXT_PUBLIC_SUPABASE_URL
  delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return env
}

function capture(psql, args, env, input) {
  try {
    const stdout = execFileSync(psql, args, {
      encoding: 'utf8',
      env,
      input,
      timeout: 30_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { status: 0, stdout, stderr: '' }
  } catch (error) {
    return {
      status: typeof error?.status === 'number' ? error.status : 1,
      stdout: String(error?.stdout ?? ''),
      stderr: String(error?.stderr ?? ''),
    }
  }
}

for (const key of FORBIDDEN) {
  if (process.env[key]) throw new Error(`refuse inherited connection override: ${key}`)
}
if (process.argv.some((arg) => /postgres(ql)?:\/\/|supabase\.(co|com)/i.test(String(arg)))) {
  throw new Error('remote or connection-string argument is forbidden')
}

const bins = {
  initdb: findBin('initdb'),
  pgCtl: findBin('pg_ctl'),
  postgres: findBin('postgres'),
  psql: findBin('psql'),
}
if (Object.values(bins).some((pfad) => !pfad)) {
  throw new Error('BLOCKED: local PostgreSQL binaries missing. No remote fallback.')
}

const candidatePath = join(process.cwd(), 'scripts/db/admin-account-counts-1-candidate.sql')
if (existsSync(candidatePath)) {
  const hash = createHash('sha256').update(readFileSync(candidatePath)).digest('hex')
  rec('source-hash-candidate', hash === REVIEWED_CANDIDATE, REVIEWED_CANDIDATE, hash)
} else {
  rec('source-hash-candidate', false, REVIEWED_CANDIDATE, 'candidate file absent in cwd')
}

const rootDir = join(tmpdir(), `jetnity-iv1-e2-repro-${randomUUID()}`)
const dataDir = join(rootDir, 'data')
const socketDir = join(rootDir, 'socket')
const homeDir = join(rootDir, 'home')
const logFile = join(rootDir, 'postgres.log')

try {
  mkdirSync(rootDir, { recursive: true, mode: 0o700 })
  mkdirSync(socketDir, { recursive: true, mode: 0o700 })
  mkdirSync(homeDir, { recursive: true, mode: 0o700 })
  const env = cleanEnv()
  env.HOME = homeDir

  execFileSync(
    bins.initdb,
    ['-D', dataDir, '--auth-local=trust', '--auth-host=reject', '--no-sync', '--encoding=UTF8', '--username', 'jetnity_proof', '--no-locale'],
    { stdio: 'pipe', env, timeout: 60_000 },
  )
  writeFileSync(
    join(dataDir, 'postgresql.conf'),
    `\nlisten_addresses = ''\nunix_socket_directories = '${socketDir}'\nunix_socket_permissions = 0700\ntimezone = 'UTC'\n`,
    { flag: 'a' },
  )
  execFileSync(bins.pgCtl, ['-D', dataDir, '-l', logFile, '-w', '-t', '30', 'start'], {
    stdio: 'pipe',
    env,
    timeout: 45_000,
  })

  rec(
    'system-16-main-unused',
    !existsSync('/var/run/postgresql/.s.PGSQL.5432'),
    'no system socket',
    existsSync('/var/run/postgresql/.s.PGSQL.5432') ? 'system socket present' : 'no system socket',
  )

  writeFileSync(join(homeDir, '.psqlrc'), `\\echo ${SENTINEL}\n\\connect nonexistent_psqlrc_redirect_db\n`)
  const connect = ['-h', socketDir, '-U', 'jetnity_proof', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-q', '-c', 'select 1']
  const homeEnv = { ...env, HOME: homeDir }
  delete homeEnv.PSQLRC

  const withoutX = capture(bins.psql, connect, homeEnv)
  const withoutText = `${withoutX.stdout} ${withoutX.stderr}`
  rec(
    'home-only-without-X-runs-sentinel',
    withoutText.includes(SENTINEL) && /nonexistent_psqlrc_redirect_db/.test(withoutText),
    'sentinel + local \\connect to missing db on owned socket',
    withoutText,
  )
  rec(
    'home-only-redirect-stays-on-private-socket',
    withoutText.includes(socketDir) && !/supabase\\.co|amazonaws|neon\\.tech/i.test(withoutText),
    `owned socket ${socketDir}`,
    withoutText,
  )

  const withX = capture(bins.psql, ['-X', '--no-psqlrc', ...connect], homeEnv)
  rec(
    'home-only-with-X-suppresses-sentinel',
    withX.status === 0 && withX.stdout.trim() === '1' && !withX.stdout.includes(SENTINEL),
    'status 0, stdout 1, no sentinel',
    `${withX.status} ${withX.stdout.trim()}`,
  )

  const dstSql = `
set timezone = 'America/New_York';
select json_build_object(
  'historical_target', '${HISTORICAL_TARGET}',
  'spring', json_build_object(
    'fixed_start', (timestamptz '2026-03-09 07:00:00+00' - interval '720 hours'),
    'calendar_start', (timestamptz '2026-03-09 07:00:00+00' - interval '30 days'),
    'start_displacement_seconds', extract(epoch from (
      (timestamptz '2026-03-09 07:00:00+00' - interval '30 days')
      - (timestamptz '2026-03-09 07:00:00+00' - interval '720 hours')
    ))::int,
    'calendar_elapsed_seconds', extract(epoch from (
      timestamptz '2026-03-09 07:00:00+00'
      - (timestamptz '2026-03-09 07:00:00+00' - interval '30 days')
    ))::int,
    'fixed_elapsed_seconds', extract(epoch from interval '720 hours')::int
  ),
  'fall', json_build_object(
    'fixed_start', (timestamptz '2026-11-02 06:00:00+00' - interval '720 hours'),
    'calendar_start', (timestamptz '2026-11-02 06:00:00+00' - interval '30 days'),
    'start_displacement_seconds', extract(epoch from (
      (timestamptz '2026-11-02 06:00:00+00' - interval '30 days')
      - (timestamptz '2026-11-02 06:00:00+00' - interval '720 hours')
    ))::int,
    'calendar_elapsed_seconds', extract(epoch from (
      timestamptz '2026-11-02 06:00:00+00'
      - (timestamptz '2026-11-02 06:00:00+00' - interval '30 days')
    ))::int,
    'fixed_elapsed_seconds', extract(epoch from interval '720 hours')::int
  )
);
`
  const dstRun = capture(
    bins.psql,
    ['-X', '--no-psqlrc', '-h', socketDir, '-U', 'jetnity_proof', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-q', '-f', '-'],
    env,
    dstSql,
  )
  if (dstRun.status !== 0) {
    rec('dst-oracle-json', false, 'json row', `${dstRun.status} ${dstRun.stderr}`)
  } else {
    const dst = JSON.parse(dstRun.stdout.trim())
    rec(
      'dst-spring-start-displacement-plus-3600-elapsed-719h',
      dst.spring.start_displacement_seconds === 3600 &&
        dst.spring.calendar_elapsed_seconds === 719 * 3600 &&
        dst.spring.fixed_elapsed_seconds === 720 * 3600,
      'start +3600s, calendar elapsed 2588400 (719h), fixed 2592000',
      JSON.stringify(dst.spring),
    )
    rec(
      'dst-fall-start-displacement-minus-3600-elapsed-721h',
      dst.fall.start_displacement_seconds === -3600 &&
        dst.fall.calendar_elapsed_seconds === 721 * 3600 &&
        dst.fall.fixed_elapsed_seconds === 720 * 3600,
      'start -3600s, calendar elapsed 2595600 (721h), fixed 2592000',
      JSON.stringify(dst.fall),
    )
    rec(
      'dst-fixed-window-always-2592000',
      dst.spring.fixed_elapsed_seconds === 2592000 && dst.fall.fixed_elapsed_seconds === 2592000,
      '2592000',
      `${dst.spring.fixed_elapsed_seconds}/${dst.fall.fixed_elapsed_seconds}`,
    )
  }
} catch (error) {
  rec('fatal', false, 'clean run', error instanceof Error ? error.stack : String(error))
} finally {
  try {
    execFileSync(bins.pgCtl, ['-D', dataDir, '-m', 'fast', '-w', '-t', '20', 'stop'], {
      stdio: 'pipe',
      env: cleanEnv(),
      timeout: 45_000,
    })
  } catch {
    /* verified below via pid file */
  }
  const stillLive = existsSync(join(dataDir, 'postmaster.pid'))
  if (stillLive) {
    rec('cleanup-refused-while-running', false, 'postmaster stopped before rm', 'postmaster.pid still present')
  } else if (existsSync(rootDir)) {
    rmSync(rootDir, { recursive: true, force: true })
    rec('cleanup-removed-owned-dir-after-stop', !existsSync(rootDir), 'owned dir removed', existsSync(rootDir) ? rootDir : 'removed')
  }
}

const failed = rows.filter((row) => !row.ok)
console.log(`\n${rows.length - failed.length}/${rows.length} E2 reconstructed assertions (not the historical 25 mixed-probe total).`)
if (failed.length) process.exit(1)
