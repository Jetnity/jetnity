#!/usr/bin/env node
// Isolated local proof of jetnity.admin-account-counts.v1.
//
// Starts a disposable PostgreSQL cluster on a private socket owned by this
// process. It never imports scripts/db/sql.mjs, never uses remote defaults,
// and refuses inherited connection overrides. Cleanup removes only the
// cluster directory this run created, and only after the owned postmaster
// has stopped.
//
//   node scripts/db/admin-account-counts-1-local-proof.mjs

import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  appendFileSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../..', import.meta.url).pathname
const BOOTSTRAP = join(ROOT, 'scripts/db/admin-account-counts-1-bootstrap.sql')
const CANDIDATE = join(ROOT, 'scripts/db/admin-account-counts-1-candidate.sql')
const DB_NAME = 'jetnity_admin_account_counts_1'
const CLUSTER_USER = 'jetnity_proof'
export const PSQL_NO_STARTUP = Object.freeze(['-X', '--no-psqlrc'])
export const PSQLRC_SENTINEL = 'JETNITY_PSQLRC_SENTINEL'
const SUBPROCESS_TIMEOUT_MS = Object.freeze({
  initdb: 60_000,
  pgctl: 45_000,
  psql: 30_000,
})
const FIXED_WINDOW_SECONDS = 720 * 3600

export const FORBIDDEN_CONNECTION_KEYS = Object.freeze([
  'PGHOST',
  'PGHOSTADDR',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'PGPASSFILE',
  'PGSERVICE',
  'PGSERVICEFILE',
  'PGSSLMODE',
  'PGREQUIRESSL',
  'PGCHANNELBINDING',
  'PGOPTIONS',
  'PGAPPNAME',
  'PGTARGETSESSIONATTRS',
  'PGCONNECT_TIMEOUT',
  'PGCLIENTENCODING',
  'PGDATA',
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'DIRECT_URL',
  'SUPABASE_DB_URL',
  'SUPABASE_DATABASE_URL',
  'SUPABASE_CONNECTION_STRING',
  'JETNITY_ALLOW_REMOTE_DB',
  'JETNITY_SECURITY_EVENTS_DB_URL',
  'SECURITY_EVENTS_DATABASE_URL',
  'JETNITY_LOCAL_DB_URL',
])

export const CHILD_ENV_STRIP_KEYS = Object.freeze(['PSQLRC', 'PSQL_HISTORY', 'PGSYSCONFDIR'])

export const IDS = {
  owner: '10000000-0000-4000-8000-000000000001',
  admin: '10000000-0000-4000-8000-000000000002',
  operator: '10000000-0000-4000-8000-000000000003',
  moderator: '10000000-0000-4000-8000-000000000004',
  user: '10000000-0000-4000-8000-000000000005',
  creator: '10000000-0000-4000-8000-000000000006',
  noProfile: '10000000-0000-4000-8000-000000000007',
  unconfirmed: '10000000-0000-4000-8000-000000000008',
  internal: '10000000-0000-4000-8000-000000000009',
  nullTs: '10000000-0000-4000-8000-00000000000a',
  old: '10000000-0000-4000-8000-00000000000b',
  future: '10000000-0000-4000-8000-00000000000c',
  hardDel: '10000000-0000-4000-8000-00000000000d',
  banned: '10000000-0000-4000-8000-00000000000e',
  anonUser: '10000000-0000-4000-8000-00000000000f',
  softDel: '10000000-0000-4000-8000-000000000010',
  absent: '10000000-0000-4000-8000-000000000011',
  edgeStart: '10000000-0000-4000-8000-000000000012',
  edgeEnd: '10000000-0000-4000-8000-000000000013',
  anonPriv: '10000000-0000-4000-8000-000000000014',
  dstSpring: '10000000-0000-4000-8000-000000000015',
  dstFall: '10000000-0000-4000-8000-000000000016',
}

const RESULT_KEYS = [
  'present_registered_accounts',
  'created_in_prior_30_days',
  'measured_at',
  'window_start',
  'definition_version',
]

const ergebnisse = []
let cluster = null

export function assertIsolatedConnectionEnvironment(env = process.env, argv = process.argv) {
  if (env.JETNITY_ALLOW_REMOTE_DB === '1') {
    throw new Error('Dieser Lauf ist nur für isolierte lokale PostgreSQL. Remote-DB ist verboten.')
  }
  const gesetzt = FORBIDDEN_CONNECTION_KEYS.filter((schluessel) => {
    const wert = env[schluessel]
    return wert != null && wert !== ''
  })
  if (gesetzt.length) {
    throw new Error(`Verbotene Verbindungs-Umgebung: ${gesetzt.join(', ')}`)
  }
  if (
    argv.some((arg) =>
      /supabase\.(co|com)|pooler\.supabase|db\.[a-z0-9]+\.supabase|postgres(ql)?:\/\//i.test(String(arg)),
    )
  ) {
    throw new Error('Remote- oder Verbindungsziel in den Argumenten ist verboten.')
  }
}

export function sha256Datei(pfad) {
  return createHash('sha256').update(readFileSync(pfad)).digest('hex')
}

function bewerte(name, gruppe, ok, detail) {
  ergebnisse.push({ name, gruppe, ok, detail: String(detail ?? '') })
  console.log(`${ok ? '  ok  ' : ' FEHL '} [${gruppe}] ${name}  ${detail ?? ''}`)
}

export function findPgBin(name) {
  const dirs = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/17/bin', '/usr/lib/postgresql/15/bin', '/usr/bin']
  for (const dir of dirs) {
    const pfad = join(dir, name)
    if (existsSync(pfad)) return pfad
  }
  return null
}

export function requirePgBins() {
  const initdb = findPgBin('initdb')
  const pgCtl = findPgBin('pg_ctl')
  const postgres = findPgBin('postgres')
  const psql = findPgBin('psql')
  const missing = [
    ['initdb', initdb],
    ['pg_ctl', pgCtl],
    ['postgres', postgres],
    ['psql', psql],
  ]
    .filter(([, pfad]) => !pfad)
    .map(([name]) => name)
  if (missing.length) {
    const error = new Error(
      `BLOCKED: lokale PostgreSQL-Binaries fehlen (${missing.join(', ')}). ` +
        'Kein Remote-Fallback. Installiere ein lokales Engine-Paket ohne Cloud-Dienst.',
    )
    error.code = 'JETNITY_LOCAL_PG_MISSING'
    throw error
  }
  return { initdb, pgCtl, postgres, psql }
}

export function cleanChildEnv(base = process.env) {
  const env = { ...base }
  for (const schluessel of Object.keys(env)) {
    if (
      schluessel.startsWith('PG') ||
      FORBIDDEN_CONNECTION_KEYS.includes(schluessel) ||
      CHILD_ENV_STRIP_KEYS.includes(schluessel)
    ) {
      delete env[schluessel]
    }
  }
  if (cluster?.homeDir) env.HOME = cluster.homeDir
  return env
}

export function psqlSafeArgs(datenbank, extra = []) {
  if (!cluster) {
    throw new Error('fail-closed: psql ohne registriertes privates Cluster ist verboten.')
  }
  const args = [
    ...PSQL_NO_STARTUP,
    '-h',
    cluster.socketDir,
    '-U',
    cluster.user,
    '-d',
    datenbank,
    '-v',
    'ON_ERROR_STOP=1',
    ...extra,
  ]
  if (!args.includes('-X') || !args.includes('--no-psqlrc')) {
    throw new Error('fail-closed: psql startup files are not disabled.')
  }
  if (args.includes('-h') && args[args.indexOf('-h') + 1] !== cluster.socketDir) {
    throw new Error('fail-closed: psql host is not the owned private socket.')
  }
  return args
}

export function aktuellerCluster() {
  return cluster
}

export function postmasterLebt(state = cluster) {
  if (!state?.dataDir) return false
  const pidDatei = join(state.dataDir, 'postmaster.pid')
  if (!existsSync(pidDatei)) return false
  const pid = Number(readFileSync(pidDatei, 'utf8').split('\n')[0])
  if (!Number.isInteger(pid) || pid <= 1) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function claims({ uid, rolle = 'authenticated', aal, extra = {} }) {
  if (!uid) {
    return JSON.stringify({ role: rolle, ...extra })
  }
  return JSON.stringify({
    sub: uid,
    role: rolle,
    ...(aal ? { aal } : {}),
    ...extra,
  })
}

function jsonZeile(roh) {
  const zeile = roh
    .split('\n')
    .map((teil) => teil.trim())
    .reverse()
    .find((teil) => teil.startsWith('{') || teil.startsWith('['))
  if (!zeile) throw new Error(`Keine JSON-Zeile gelesen.\n${roh}`)
  return JSON.parse(zeile)
}

export function registrierePrivatesCluster(bins = requirePgBins()) {
  const runId = randomUUID()
  const rootDir = join(tmpdir(), `jetnity-admin-account-counts-1-${runId}`)
  const dataDir = join(rootDir, 'data')
  const socketDir = join(rootDir, 'socket')
  const homeDir = join(rootDir, 'home')
  const logFile = join(rootDir, 'postgres.log')
  const state = {
    ...bins,
    rootDir,
    dataDir,
    socketDir,
    homeDir,
    logFile,
    user: CLUSTER_USER,
    lifecycle: 'registered',
  }
  cluster = state
  mkdirSync(rootDir, { recursive: true, mode: 0o700 })
  mkdirSync(socketDir, { recursive: true, mode: 0o700 })
  mkdirSync(homeDir, { recursive: true, mode: 0o700 })
  chmodSync(rootDir, 0o700)
  chmodSync(socketDir, 0o700)
  chmodSync(homeDir, 0o700)
  return state
}

export function startePrivatesCluster(options = {}) {
  const bins = requirePgBins()
  const state = cluster?.lifecycle ? cluster : registrierePrivatesCluster(bins)
  if (options.failBeforeInit) {
    const error = new Error('injected initialization failure')
    error.code = 'JETNITY_PROOF_INJECT_INIT'
    throw error
  }

  const initArgs = [
    '-D',
    state.dataDir,
    '--auth-local=trust',
    '--auth-host=reject',
    '--no-sync',
    '--encoding=UTF8',
    '--username',
    CLUSTER_USER,
  ]
  try {
    execFileSync(bins.initdb, [...initArgs, '--locale=C.UTF-8'], {
      stdio: 'pipe',
      env: cleanChildEnv(),
      timeout: SUBPROCESS_TIMEOUT_MS.initdb,
    })
  } catch (erster) {
    if (options.failBeforeInit) throw erster
    try {
      execFileSync(bins.initdb, [...initArgs, '--no-locale'], {
        stdio: 'pipe',
        env: cleanChildEnv(),
        timeout: SUBPROCESS_TIMEOUT_MS.initdb,
      })
    } catch (zweiter) {
      state.lifecycle = 'failed'
      throw zweiter
    }
  }
  state.lifecycle = 'initialized'

  appendFileSync(
    join(state.dataDir, 'postgresql.conf'),
    [
      '',
      "listen_addresses = ''",
      `unix_socket_directories = '${state.socketDir}'`,
      'unix_socket_permissions = 0700',
      "timezone = 'UTC'",
      'logging_collector = off',
      '',
    ].join('\n'),
  )

  if (options.failBeforeStart) {
    const error = new Error('injected start failure before pg_ctl')
    error.code = 'JETNITY_PROOF_INJECT_START'
    throw error
  }

  try {
    execFileSync(bins.pgCtl, ['-D', state.dataDir, '-l', state.logFile, '-w', '-t', '30', 'start'], {
      stdio: 'pipe',
      env: cleanChildEnv(),
      timeout: SUBPROCESS_TIMEOUT_MS.pgctl,
    })
  } catch (fehler) {
    state.lifecycle = postmasterLebt(state) ? 'started' : 'failed'
    throw fehler
  }
  state.lifecycle = 'started'
  if (options.failAfterStart) {
    const error = new Error('injected start failure after postmaster is up')
    error.code = 'JETNITY_PROOF_INJECT_START_UP'
    throw error
  }
  return state
}

export function stoppePrivatesCluster(options = {}) {
  if (!cluster) {
    return { cleaned: true, removed: false, stopped: false, running: false, error: null, lifecycle: null }
  }
  const report = {
    cleaned: false,
    removed: false,
    stopped: false,
    running: postmasterLebt(cluster),
    error: null,
    lifecycle: cluster.lifecycle,
    rootDir: cluster.rootDir,
  }

  if (report.running || cluster.lifecycle === 'started') {
    if (options.failStop) {
      report.error = 'injected stop failure'
      report.running = postmasterLebt(cluster)
      if (report.running) {
        return report
      }
    }
    try {
      execFileSync(cluster.pgCtl, ['-D', cluster.dataDir, '-m', 'fast', '-w', '-t', '20', 'stop'], {
        stdio: 'pipe',
        env: cleanChildEnv(),
        timeout: SUBPROCESS_TIMEOUT_MS.pgctl,
      })
    } catch (fehler) {
      report.error = fehler instanceof Error ? fehler.message : String(fehler)
    }
    report.running = postmasterLebt(cluster)
    if (report.running) {
      report.error = report.error || 'cluster still running after stop'
      return report
    }
    cluster.lifecycle = 'stopped'
    report.stopped = true
  }

  try {
    rmSync(cluster.rootDir, { recursive: true, force: true })
    report.removed = true
    report.cleaned = true
  } catch (fehler) {
    report.error = fehler instanceof Error ? fehler.message : String(fehler)
    return report
  }
  cluster = null
  return report
}

function psqlFile(sql, datenbank = DB_NAME) {
  const env = cleanChildEnv()
  if (env.PSQLRC) {
    throw new Error('fail-closed: PSQLRC leaked into child environment.')
  }
  return execFileSync(cluster.psql, psqlSafeArgs(datenbank, ['-At', '-q', '-f', '-']), {
    encoding: 'utf8',
    input: sql,
    env,
    timeout: SUBPROCESS_TIMEOUT_MS.psql,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim()
}

function psqlSql(sql, datenbank = DB_NAME) {
  const env = cleanChildEnv()
  if (env.PSQLRC) {
    throw new Error('fail-closed: PSQLRC leaked into child environment.')
  }
  execFileSync(cluster.psql, psqlSafeArgs(datenbank, ['-f', '-']), {
    input: sql,
    env,
    timeout: SUBPROCESS_TIMEOUT_MS.psql,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function sitzung({ rolle, uid, aal, extraClaims = {}, sql, inspektion = 'select 1 as ok' }) {
  const jwt = claims({
    uid,
    rolle: rolle === 'service_role' ? 'service_role' : rolle === 'anon' ? 'anon' : 'authenticated',
    aal,
    extra: extraClaims,
  })
  const roh = psqlFile(`
begin;
select jetnity_test.sitzung(
  $r$${rolle}$r$,
  $c$${jwt}$c$,
  $a$${sql}$a$,
  $i$${inspektion}$i$
);
rollback;
`)
  return jsonZeile(roh)
}

function mussAblehnen(name, gruppe, opts, muster) {
  const ergebnis = sitzung(opts)
  const text = `${ergebnis.arbeit?.sqlstate ?? ''} ${ergebnis.arbeit?.message ?? ''}`
  const ok =
    ergebnis.arbeit?.ok === false &&
    ergebnis.arbeit?.row == null &&
    (!muster || new RegExp(muster, 'i').test(text))
  bewerte(
    name,
    gruppe,
    ok,
    ok ? text : `erwartet Ablehnung${muster ? ` / ${muster}` : ''}, gemessen ${JSON.stringify(ergebnis.arbeit)}`,
  )
  return ergebnis
}

function formIstSauber(row) {
  if (!row || typeof row !== 'object') return false
  const keys = Object.keys(row)
  if (keys.length !== RESULT_KEYS.length) return false
  if (RESULT_KEYS.some((key) => !keys.includes(key))) return false
  const blob = JSON.stringify(row)
  return (
    row.definition_version === 'jetnity.admin-account-counts.v1' &&
    !/email|@|user_id|display_name|ip|trip/i.test(blob)
  )
}

function legeDatenbankAn() {
  psqlSql(`create database ${DB_NAME}`, 'postgres')
  psqlSql(
    [
      readFileSync(BOOTSTRAP, 'utf8'),
      readFileSync(CANDIDATE, 'utf8'),
      seedSql(),
      testHelperSql(),
    ].join('\n\n'),
  )
}

function seedSql() {
  return `
insert into auth.users (id, created_at, deleted_at, confirmed_at, is_anonymous) values
  ('${IDS.owner}',       now() - interval '40 days', null, now() - interval '40 days', false),
  ('${IDS.admin}',       now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.operator}',    now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.moderator}',   now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.user}',        now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.creator}',     now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.noProfile}',   now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.unconfirmed}', now() - interval '2 days',  null, null,                       false),
  ('${IDS.internal}',    now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.nullTs}',      null,                       null, null,                       false),
  ('${IDS.old}',         now() - interval '40 days', null, now() - interval '40 days', false),
  ('${IDS.future}',      now() + interval '1 day',   null, now() + interval '1 day',   false),
  ('${IDS.hardDel}',     now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.banned}',      now() - interval '2 days',  null, now() - interval '2 days',  false),
  ('${IDS.anonUser}',    now() - interval '2 days',  null, now() - interval '2 days',  true),
  ('${IDS.softDel}',     now() - interval '2 days',  now(), now() - interval '2 days', false),
  ('${IDS.anonPriv}',    now() - interval '2 days',  null, now() - interval '2 days',  true);

insert into public.profiles (user_id, role, status) values
  ('${IDS.owner}',       'owner',     'active'),
  ('${IDS.admin}',       'admin',     'active'),
  ('${IDS.operator}',    'operator',  'active'),
  ('${IDS.moderator}',   'moderator', 'active'),
  ('${IDS.user}',        'user',      'active'),
  ('${IDS.creator}',     'creator',   'active'),
  ('${IDS.unconfirmed}', 'user',      'pending'),
  ('${IDS.internal}',    'user',      'active'),
  ('${IDS.nullTs}',      'user',      'active'),
  ('${IDS.old}',         'user',      'active'),
  ('${IDS.future}',      'user',      'active'),
  ('${IDS.hardDel}',     'user',      'active'),
  ('${IDS.banned}',      'user',      'banned'),
  ('${IDS.anonUser}',    'user',      'active'),
  ('${IDS.softDel}',     'moderator', 'active'),
  ('${IDS.anonPriv}',    'moderator', 'active');
`
}

function testHelperSql() {
  return `
create schema if not exists jetnity_test;
revoke all on schema jetnity_test from public, anon, service_role;
grant usage on schema jetnity_test to authenticated;

create or replace function jetnity_test.sitzung(
  _role text,
  _claims text,
  _arbeit text,
  _inspektion text
)
returns jsonb
language plpgsql
as $fn$
declare
  n bigint;
  arbeit jsonb;
  inspektion jsonb;
  zeile jsonb;
begin
  perform set_config('role', _role, true);
  perform set_config('request.jwt.claims', coalesce(_claims, ''), true);
  begin
    if _arbeit ~* '^\\s*select' then
      execute 'select to_jsonb(q) from (' || _arbeit || ') q' into zeile;
      get diagnostics n = row_count;
      arbeit := jsonb_build_object('ok', true, 'row_count', n, 'row', zeile);
    else
      execute _arbeit;
      get diagnostics n = row_count;
      arbeit := jsonb_build_object('ok', true, 'row_count', n);
    end if;
  exception when others then
    arbeit := jsonb_build_object('ok', false, 'sqlstate', sqlstate, 'message', sqlerrm);
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  if _inspektion is not null and btrim(_inspektion) <> '' then
    execute 'select to_jsonb(q) from (' || _inspektion || ') q' into inspektion;
  end if;
  return jsonb_build_object('arbeit', arbeit, 'inspektion', inspektion);
end
$fn$;

-- Proof-only clock seam. Not a production caller filter/time parameter.
create or replace function jetnity_test.counts_at(_measured_at timestamp with time zone)
returns table (
  present_registered_accounts bigint,
  created_in_prior_30_days bigint,
  measured_at timestamp with time zone,
  window_start timestamp with time zone
)
language sql
stable
set search_path = pg_catalog
as $fn$
  select
    count(*)::bigint,
    count(*) filter (
      where u.created_at is not null
        and u.created_at >= _measured_at - interval '720 hours'
        and u.created_at < _measured_at
    )::bigint,
    _measured_at,
    _measured_at - interval '720 hours'
  from auth.users as u
  where u.deleted_at is null
    and u.is_anonymous is false;
$fn$;

create or replace function jetnity_test.fixed_minus_720_hours(_measured_at timestamp with time zone)
returns timestamp with time zone
language sql
stable
set search_path = pg_catalog
as $fn$
  select _measured_at - interval '720 hours'
$fn$;

create or replace function jetnity_test.calendar_minus_30_days(_measured_at timestamp with time zone)
returns timestamp with time zone
language sql
stable
set search_path = pg_catalog
as $fn$
  select _measured_at - interval '30 days'
$fn$;

do $role$
begin
  if not exists (select 1 from pg_roles where rolname = 'jetnity_reporting_owner') then
    create role jetnity_reporting_owner
      nologin
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit;
  end if;
end
$role$;

grant usage on schema auth to jetnity_reporting_owner;
grant select on table auth.users to jetnity_reporting_owner;
grant execute on function auth.uid() to jetnity_reporting_owner;
grant execute on function auth.jwt() to jetnity_reporting_owner;
grant execute on function public.rollenrang(text) to jetnity_reporting_owner;
grant execute on function public.aktuelle_rolle() to jetnity_reporting_owner;
grant execute on function public.hat_rolle_mindestens(text) to jetnity_reporting_owner;
grant execute on function public.aktuelles_admin_aal2() to jetnity_reporting_owner;
grant execute on function public.darf_konten_verwalten() to jetnity_reporting_owner;

create or replace function jetnity_test.unprivileged_owner_counts()
returns table (
  present_registered_accounts bigint,
  created_in_prior_30_days bigint,
  measured_at timestamp with time zone,
  window_start timestamp with time zone,
  definition_version text
)
language plpgsql
stable
security definer
set search_path = pg_catalog
set timezone = 'UTC'
as $fn$
declare
  _uid uuid;
  _caller_present boolean;
  _measured_at timestamp with time zone;
  _window_start timestamp with time zone;
begin
  _uid := auth.uid();
  if _uid is null then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  select exists (
    select 1
      from auth.users as u
     where u.id = _uid
       and u.deleted_at is null
       and u.is_anonymous is false
  )
    into _caller_present;

  if not coalesce(_caller_present, false) then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  if not coalesce(public.darf_konten_verwalten(), false) then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  _measured_at := pg_catalog.now();
  _window_start := _measured_at - interval '720 hours';

  return query
  select
    count(*)::bigint,
    count(*) filter (
      where u.created_at is not null
        and u.created_at >= _window_start
        and u.created_at < _measured_at
    )::bigint,
    _measured_at,
    _window_start,
    'jetnity.admin-account-counts.v1'::text
  from auth.users as u
  where u.deleted_at is null
    and u.is_anonymous is false;
end
$fn$;

alter function jetnity_test.unprivileged_owner_counts() owner to jetnity_reporting_owner;

create or replace function jetnity_test.unprivileged_owner_visible_users()
returns bigint
language sql
stable
security definer
set search_path = pg_catalog
as $fn$
  select count(*)::bigint from auth.users
$fn$;

alter function jetnity_test.unprivileged_owner_visible_users() owner to jetnity_reporting_owner;

revoke all on function jetnity_test.unprivileged_owner_counts() from public, anon, service_role;
grant execute on function jetnity_test.unprivileged_owner_counts() to authenticated;
revoke all on function jetnity_test.counts_at(timestamp with time zone) from public, anon, authenticated, service_role;
`
}

function privilegedPresentWindow() {
  return jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    count(*) filter (where deleted_at is null and is_anonymous is false)::bigint as present,
    count(*) filter (
      where deleted_at is null
        and is_anonymous is false
        and created_at is not null
        and created_at >= now() - interval '720 hours'
        and created_at < now()
    )::bigint as windowed
  from auth.users
) q;
`),
  )
}

function pruefeAutorisierung() {
  const gruppe = 'auth-sql'
  const erwartung = privilegedPresentWindow()

  for (const [name, uid] of [
    ['owner', IDS.owner],
    ['admin', IDS.admin],
    ['operator', IDS.operator],
    ['moderator', IDS.moderator],
  ]) {
    const ergebnis = sitzung({
      rolle: 'authenticated',
      uid,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    })
    const row = ergebnis.arbeit?.row
    const ok =
      ergebnis.arbeit?.ok === true &&
      formIstSauber(row) &&
      Number(row.present_registered_accounts) === Number(erwartung.present) &&
      Number(row.created_in_prior_30_days) === Number(erwartung.windowed)
    bewerte(
      `${name} AAL2 erhält die Fixture-Aggregate`,
      gruppe,
      ok,
      ok
        ? `present=${row.present_registered_accounts} window=${row.created_in_prior_30_days}`
        : JSON.stringify(ergebnis.arbeit),
    )
  }

  mussAblehnen(
    'Moderator AAL1 erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal1',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'Moderator ohne AAL erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'Moderator AAL3 erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal3',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'gewöhnliches user-Konto AAL2 erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.user,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'creator AAL2 erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.creator,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'Konto ohne Profil erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.noProfile,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'abwesender JWT-sub erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.absent,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'soft-gelöschter Moderator erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.softDel,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'anonymes Konto erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.anonUser,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'anonymes Konto mit privileged Fixture-Profil erhält keine Aggregate',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.anonPriv,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'anon-Rolle erhält keine Aggregate',
    gruppe,
    {
      rolle: 'anon',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501',
  )
  mussAblehnen(
    'service_role-Shortcut erhält keine Aggregate',
    gruppe,
    {
      rolle: 'service_role',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501',
  )
  mussAblehnen(
    'Break-Glass-Claim hebt user nicht zu owner',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.user,
      aal: 'aal2',
      extraClaims: { break_glass: true, grant: 'break-glass' },
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'user_metadata.role=owner autorisiert nicht',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.user,
      aal: 'aal2',
      extraClaims: { user_metadata: { role: 'owner' }, app_metadata: { role: 'admin' } },
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
}

function privilegedOwnerCounts() {
  const ergebnis = sitzung({
    rolle: 'authenticated',
    uid: IDS.owner,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  return {
    ok: ergebnis.arbeit?.ok === true,
    present: Number(ergebnis.arbeit?.row?.present_registered_accounts),
    windowed: Number(ergebnis.arbeit?.row?.created_in_prior_30_days),
    raw: ergebnis.arbeit,
  }
}

function pruefeCallerStatus() {
  const gruppe = 'caller-status-sql'
  const basis = privilegedOwnerCounts()
  bewerte(
    'active owner AAL2 still receives fixture aggregates after existing gates',
    gruppe,
    basis.ok && Number.isInteger(basis.present) && basis.present >= 1,
    JSON.stringify(basis.raw),
  )

  for (const [name, uid, status] of [
    ['banned moderator', IDS.moderator, 'banned'],
    ['disabled admin', IDS.admin, 'disabled'],
    ['pending operator', IDS.operator, 'pending'],
  ]) {
    psqlSql(`update public.profiles set status = '${status}' where user_id = '${uid}'`)
    mussAblehnen(
      `${name}+AAL2 is 42501 before counts; not a zero success row`,
      gruppe,
      {
        rolle: 'authenticated',
        uid,
        aal: 'aal2',
        sql: 'select * from jetnity_reporting.account_counts_v1()',
      },
      '42501|not authorized',
    )
    const still = privilegedOwnerCounts()
    bewerte(
      `metric population unchanged while ${name} is blocked`,
      gruppe,
      still.ok && still.present === basis.present && still.windowed === basis.windowed,
      JSON.stringify({ basis: basis.raw, still: still.raw }),
    )
    psqlSql(`update public.profiles set status = 'active' where user_id = '${uid}'`)
  }

  const first = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  bewerte(
    'same authenticated moderator is allowed while persisted status is active',
    gruppe,
    first.arbeit?.ok === true &&
      Number(first.arbeit.row.present_registered_accounts) === basis.present,
    JSON.stringify(first.arbeit),
  )
  psqlSql(`update public.profiles set status = 'banned' where user_id = '${IDS.moderator}'`)
  mussAblehnen(
    'direct SQL status change denies the same JWT/claims on the next producer call',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  const duringBlock = privilegedOwnerCounts()
  bewerte(
    'blocked caller status does not change the counted population',
    gruppe,
    duringBlock.ok &&
      duringBlock.present === basis.present &&
      duringBlock.windowed === basis.windowed,
    JSON.stringify(duringBlock.raw),
  )
  psqlSql(`update public.profiles set status = 'active' where user_id = '${IDS.moderator}'`)
  const restored = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  bewerte(
    'same authenticated moderator is allowed again after status returns to active',
    gruppe,
    restored.arbeit?.ok === true &&
      Number(restored.arbeit.row.present_registered_accounts) === basis.present &&
      Number(restored.arbeit.row.created_in_prior_30_days) === basis.windowed,
    JSON.stringify(restored.arbeit),
  )

  psqlSql(`
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles alter column status drop not null;
update public.profiles set status = null where user_id = '${IDS.moderator}';
`)
  mussAblehnen(
    'NULL persisted caller status is 42501',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  psqlSql(`update public.profiles set status = 'unrecognized' where user_id = '${IDS.moderator}'`)
  mussAblehnen(
    'unrecognized persisted caller status is 42501',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  psqlSql(`
update public.profiles set status = 'active' where user_id = '${IDS.moderator}';
alter table public.profiles alter column status set default 'active';
alter table public.profiles alter column status set not null;
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active', 'pending', 'disabled', 'banned'));
`)
}

function pruefeLebenszyklus() {
  const gruppe = 'lifecycle-sql'
  const basis = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  const present = Number(basis.arbeit?.row?.present_registered_accounts)
  const windowed = Number(basis.arbeit?.row?.created_in_prior_30_days)

  const ohneProfil = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select exists(
    select 1 from auth.users
     where id = '${IDS.noProfile}'
       and deleted_at is null
       and is_anonymous is false
       and not exists (select 1 from public.profiles p where p.user_id = auth.users.id)
  ) as target_without_profile
) q;
`),
  )
  bewerte(
    'Zielkonto ohne Profil ist vorhanden und zählt in present',
    gruppe,
    ohneProfil.target_without_profile === true && present >= 1,
    JSON.stringify({ present, ohneProfil }),
  )

  const excluded = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    (select is_anonymous from auth.users where id = '${IDS.anonUser}') as anon,
    (select is_anonymous from auth.users where id = '${IDS.anonPriv}') as anon_priv,
    (select deleted_at is not null from auth.users where id = '${IDS.softDel}') as soft,
    exists(select 1 from auth.users where id = '${IDS.unconfirmed}' and confirmed_at is null) as unconfirmed,
    exists(select 1 from public.profiles where user_id = '${IDS.banned}' and status = 'banned') as banned,
    exists(select 1 from auth.users where id = '${IDS.internal}') as internal_row,
    exists(select 1 from public.profiles where user_id = '${IDS.anonPriv}' and role = 'moderator') as anon_priv_profile
) q;
`),
  )
  bewerte(
    'anonym/soft-delete sind ausgeschlossen; unconfirmed/internal/banned-Profil bleiben in der Zielmenge',
    gruppe,
    excluded.anon === true &&
      excluded.anon_priv === true &&
      excluded.anon_priv_profile === true &&
      excluded.soft === true &&
      excluded.unconfirmed === true &&
      excluded.banned === true &&
      excluded.internal_row === true &&
      present === Number(privilegedPresentWindow().present),
    JSON.stringify({ present, excluded }),
  )

  const beforeDelete = present
  psqlSql(`delete from public.profiles where user_id = '${IDS.hardDel}'; delete from auth.users where id = '${IDS.hardDel}';`)
  const afterDelete = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  bewerte(
    'Hard-Delete senkt den aktuellen present-Count um 1',
    gruppe,
    afterDelete.arbeit?.ok === true &&
      Number(afterDelete.arbeit.row.present_registered_accounts) === beforeDelete - 1 &&
      Number(afterDelete.arbeit.row.created_in_prior_30_days) === windowed - 1,
    JSON.stringify({ beforeDelete, after: afterDelete.arbeit?.row }),
  )

  const beforeConvert = Number(afterDelete.arbeit.row.present_registered_accounts)
  const beforeConvertWindow = Number(afterDelete.arbeit.row.created_in_prior_30_days)
  psqlSql(`update auth.users set is_anonymous = false where id = '${IDS.anonUser}'`)
  const afterConvert = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  bewerte(
    'Anonymous-zu-permanent zählt die Original-created_at-Zeile, nicht eine neue Registrierung',
    gruppe,
    afterConvert.arbeit?.ok === true &&
      Number(afterConvert.arbeit.row.present_registered_accounts) === beforeConvert + 1 &&
      Number(afterConvert.arbeit.row.created_in_prior_30_days) === beforeConvertWindow + 1,
    JSON.stringify({ beforeConvert, after: afterConvert.arbeit?.row }),
  )
  psqlSql(`update auth.users set is_anonymous = true where id = '${IDS.anonUser}'`)
}

function pruefeFensterUndNull() {
  const gruppe = 'window-sql'
  const utc = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  const row = utc.arbeit?.row
  const privileged = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    count(*) filter (where deleted_at is null and is_anonymous is false)::bigint as present,
    count(*) filter (
      where deleted_at is null
        and is_anonymous is false
        and created_at is not null
        and created_at >= '${row.window_start}'::timestamptz
        and created_at < '${row.measured_at}'::timestamptz
    )::bigint as windowed,
    count(*) filter (
      where id = '${IDS.nullTs}' and deleted_at is null and is_anonymous is false and created_at is null
    ) as null_present,
    count(*) filter (
      where id = '${IDS.future}' and deleted_at is null and is_anonymous is false and created_at > now()
    ) as future_present,
    extract(epoch from ('${row.measured_at}'::timestamptz - '${row.window_start}'::timestamptz)) as window_seconds,
    extract(epoch from ('${row.measured_at}'::timestamptz - jetnity_test.fixed_minus_720_hours('${row.measured_at}'::timestamptz))) as oracle_seconds
  from auth.users
) q;
`),
  )
  bewerte(
    'NULL-created_at zählt in present, nicht im Fenster; Zukunft zählt nicht in den prior 720 hours',
    gruppe,
    Number(row.present_registered_accounts) === Number(privileged.present) &&
      Number(row.created_in_prior_30_days) === Number(privileged.windowed) &&
      Number(privileged.null_present) === 1 &&
      Number(privileged.future_present) === 1,
    JSON.stringify({ row, privileged }),
  )
  bewerte(
    'unabhängiges 720-Stunden-Orakel: Fensterlänge ist genau 2592000 Sekunden',
    gruppe,
    Number(privileged.window_seconds) === FIXED_WINDOW_SECONDS &&
      Number(privileged.oracle_seconds) === FIXED_WINDOW_SECONDS,
    JSON.stringify({
      window_seconds: privileged.window_seconds,
      oracle_seconds: privileged.oracle_seconds,
    }),
  )

  const kanten = jsonZeile(
    psqlFile(`
begin;
insert into auth.users (id, created_at, deleted_at, confirmed_at, is_anonymous) values
  ('${IDS.edgeStart}', now() - interval '720 hours', null, now() - interval '720 hours', false),
  ('${IDS.edgeEnd}', now(), null, now(), false);
select jetnity_test.sitzung(
  'authenticated',
  $c$${claims({ uid: IDS.moderator, aal: 'aal2' })}$c$,
  $a$select * from jetnity_reporting.account_counts_v1()$a$,
  $i$
    select
      (select created_at >= now() - interval '720 hours' from auth.users where id = '${IDS.edgeStart}') as start_ge,
      (select created_at = now() from auth.users where id = '${IDS.edgeEnd}') as end_eq
  $i$
);
rollback;
`),
  )
  const kantenRow = kanten.arbeit?.row
  bewerte(
    'halboffene Kanten: window_start inklusive, measured_at exklusiv',
    gruppe,
    kanten.arbeit?.ok === true &&
      kanten.inspektion?.start_ge === true &&
      kanten.inspektion?.end_eq === true &&
      Number(kantenRow.present_registered_accounts) === Number(row.present_registered_accounts) + 2 &&
      Number(kantenRow.created_in_prior_30_days) === Number(row.created_in_prior_30_days) + 1,
    JSON.stringify(kanten),
  )

  const tz = jsonZeile(
    psqlFile(`
begin;
create temporary table tz_probe (k text, v jsonb) on commit drop;
set timezone = 'Pacific/Auckland';
insert into tz_probe
select 'auckland', jetnity_test.sitzung(
  'authenticated',
  $c$${claims({ uid: IDS.moderator, aal: 'aal2' })}$c$,
  $a$select * from jetnity_reporting.account_counts_v1()$a$,
  $i$select current_setting('TimeZone') as timezone$i$
);
set timezone = 'America/New_York';
insert into tz_probe
select 'york', jetnity_test.sitzung(
  'authenticated',
  $c$${claims({ uid: IDS.moderator, aal: 'aal2' })}$c$,
  $a$select * from jetnity_reporting.account_counts_v1()$a$,
  $i$select current_setting('TimeZone') as timezone$i$
);
select jsonb_object_agg(k, v) from tz_probe;
rollback;
`),
  )
  const a = tz.auckland?.arbeit?.row
  const y = tz.york?.arbeit?.row
  bewerte(
    'UTC- und Nicht-UTC-Session liefern dieselben Counts und denselben Zeitinstant',
    gruppe,
    formIstSauber(a) &&
      formIstSauber(y) &&
      Number(a.present_registered_accounts) === Number(y.present_registered_accounts) &&
      Number(a.created_in_prior_30_days) === Number(y.created_in_prior_30_days) &&
      Date.parse(a.measured_at) === Date.parse(y.measured_at) &&
      Date.parse(a.window_start) === Date.parse(y.window_start),
    JSON.stringify({
      present: a?.present_registered_accounts,
      window: a?.created_in_prior_30_days,
      measuredMs: Date.parse(a?.measured_at ?? ''),
    }),
  )

  const dst = jsonZeile(
    psqlFile(`
begin;
-- US spring-forward 2026-03-08: 30 calendar days in America/New_York is 1h
-- longer than 720 hours. A row at 2026-02-07 07:30:00+00 is inside the
-- fixed window and outside the session-DST calendar window.
insert into auth.users (id, created_at, deleted_at, confirmed_at, is_anonymous) values
  ('${IDS.dstSpring}', timestamptz '2026-02-07 07:30:00+00', null, timestamptz '2026-02-07 07:30:00+00', false),
  ('${IDS.dstFall}', timestamptz '2026-10-03 05:30:00+00', null, timestamptz '2026-10-03 05:30:00+00', false);

create temporary table dst_probe (k text, v jsonb) on commit drop;

insert into dst_probe
select 'fixed_spring', to_jsonb(q) from jetnity_test.counts_at(timestamptz '2026-03-09 07:00:00+00') q;

set timezone = 'America/New_York';
insert into dst_probe
select 'calendar_spring_ny', jsonb_build_object(
  'calendar_start', jetnity_test.calendar_minus_30_days(timestamptz '2026-03-09 07:00:00+00'),
  'fixed_start', jetnity_test.fixed_minus_720_hours(timestamptz '2026-03-09 07:00:00+00'),
  'row_in_calendar', (
    select created_at >= jetnity_test.calendar_minus_30_days(timestamptz '2026-03-09 07:00:00+00')
       and created_at < timestamptz '2026-03-09 07:00:00+00'
      from auth.users where id = '${IDS.dstSpring}'
  ),
  'row_in_fixed', (
    select created_at >= jetnity_test.fixed_minus_720_hours(timestamptz '2026-03-09 07:00:00+00')
       and created_at < timestamptz '2026-03-09 07:00:00+00'
      from auth.users where id = '${IDS.dstSpring}'
  )
);

insert into dst_probe
select 'fixed_fall', to_jsonb(q) from jetnity_test.counts_at(timestamptz '2026-11-02 06:00:00+00') q;

insert into dst_probe
select 'calendar_fall_ny', jsonb_build_object(
  'calendar_start', jetnity_test.calendar_minus_30_days(timestamptz '2026-11-02 06:00:00+00'),
  'fixed_start', jetnity_test.fixed_minus_720_hours(timestamptz '2026-11-02 06:00:00+00'),
  'row_in_calendar', (
    select created_at >= jetnity_test.calendar_minus_30_days(timestamptz '2026-11-02 06:00:00+00')
       and created_at < timestamptz '2026-11-02 06:00:00+00'
      from auth.users where id = '${IDS.dstFall}'
  ),
  'row_in_fixed', (
    select created_at >= jetnity_test.fixed_minus_720_hours(timestamptz '2026-11-02 06:00:00+00')
       and created_at < timestamptz '2026-11-02 06:00:00+00'
      from auth.users where id = '${IDS.dstFall}'
  )
);

set timezone = 'UTC';
insert into dst_probe
select 'calendar_spring_utc', jsonb_build_object(
  'calendar_start', jetnity_test.calendar_minus_30_days(timestamptz '2026-03-09 07:00:00+00'),
  'fixed_start', jetnity_test.fixed_minus_720_hours(timestamptz '2026-03-09 07:00:00+00')
);

select jsonb_object_agg(k, v) from dst_probe;
rollback;
`),
  )
  const springNy = dst.calendar_spring_ny
  const fallNy = dst.calendar_fall_ny
  const springUtc = dst.calendar_spring_utc
  bewerte(
    'DST spring/fall: 720-Stunden-Fenster ≠ session-DST-Kalendertag; feste Dauer bleibt UTC-invariant',
    gruppe,
    springNy?.row_in_fixed === true &&
      springNy?.row_in_calendar === false &&
      fallNy?.row_in_fixed === false &&
      fallNy?.row_in_calendar === true &&
      Date.parse(springNy?.fixed_start) === Date.parse(springUtc?.fixed_start) &&
      Date.parse(springNy?.calendar_start) !== Date.parse(springNy?.fixed_start) &&
      Date.parse(fallNy?.calendar_start) !== Date.parse(fallNy?.fixed_start),
    JSON.stringify(dst),
  )
}

function pruefeZeroVersusDeny() {
  const gruppe = 'zero-vs-deny-sql'
  const deny = sitzung({
    rolle: 'authenticated',
    uid: IDS.user,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  bewerte(
    'Deny liefert keine Erfolgszeile mit Nullen',
    gruppe,
    deny.arbeit?.ok === false && deny.arbeit?.row == null && deny.arbeit?.sqlstate === '42501',
    JSON.stringify(deny.arbeit),
  )

  const zeroWindow = jsonZeile(
    psqlFile(`
begin;
update auth.users
   set deleted_at = now()
 where id <> '${IDS.owner}'
   and deleted_at is null
   and is_anonymous is false;
select jetnity_test.sitzung(
  'authenticated',
  $c$${claims({ uid: IDS.owner, aal: 'aal2' })}$c$,
  $a$select * from jetnity_reporting.account_counts_v1()$a$,
  $i$select 1 as ok$i$
);
rollback;
`),
  )
  const row = zeroWindow.arbeit?.row
  bewerte(
    'autorisierte leere Fenstermenge liefert window=0; present bleibt >= 1 (Caller-Constraint)',
    gruppe,
    zeroWindow.arbeit?.ok === true &&
      formIstSauber(row) &&
      Number(row.created_in_prior_30_days) === 0 &&
      Number(row.present_registered_accounts) === 1,
    JSON.stringify(zeroWindow.arbeit),
  )
}

function pruefeRlsContrast() {
  const gruppe = 'rls-sql'
  const unpriv = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from jetnity_test.unprivileged_owner_counts()',
  })
  bewerte(
    'unprivilegierter Owner + SELECT-Grant scheitert unter RLS-on/default-deny auch für den legitimen Caller',
    gruppe,
    unpriv.arbeit?.ok === false &&
      unpriv.arbeit?.row == null &&
      unpriv.arbeit?.sqlstate === '42501',
    JSON.stringify(unpriv.arbeit),
  )

  const sichtbar = jsonZeile(
    psqlFile(`select to_jsonb(q) from (select jetnity_test.unprivileged_owner_visible_users() as n) q;`),
  )
  bewerte(
    'unprivilegierter Owner sieht 0 auth.users-Zeilen trotz SELECT-Grant',
    gruppe,
    Number(sichtbar.n) === 0,
    JSON.stringify(sichtbar),
  )

  const trusted = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from jetnity_reporting.account_counts_v1()',
  })
  bewerte(
    'trusted-postgres-Owner besteht denselben legitimen Caller-Aufruf',
    gruppe,
    trusted.arbeit?.ok === true &&
      formIstSauber(trusted.arbeit.row) &&
      Number(trusted.arbeit.row.present_registered_accounts) >= 1,
    JSON.stringify(trusted.arbeit),
  )

  mussAblehnen(
    'trusted-Owner bleibt für user AAL2 verboten',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.user,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'trusted-Owner bleibt für abwesenden authenticated subject verboten',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.absent,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'trusted-Owner bleibt für anonymous+privileged Profil verboten',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.anonPriv,
      aal: 'aal2',
      sql: 'select * from jetnity_reporting.account_counts_v1()',
    },
    '42501|not authorized',
  )
}

function pruefeKatalogUndDirektzugriff() {
  const gruppe = 'catalog'
  mussAblehnen(
    'authenticated darf auth.users nicht direkt lesen',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal2',
      sql: 'select id from auth.users',
    },
    '42501|permission denied',
  )
  mussAblehnen(
    'anon darf auth.users nicht direkt lesen',
    gruppe,
    {
      rolle: 'anon',
      sql: 'select id from auth.users',
    },
    '42501|permission denied',
  )

  const katalog = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    p.prosecdef as security_definer,
    coalesce(p.proconfig, array[]::text[]) as config,
    has_function_privilege('anon', p.oid, 'execute') as anon_exec,
    has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
    has_function_privilege('service_role', p.oid, 'execute') as service_exec,
    exists (
      select 1
        from unnest(coalesce(p.proacl, acldefault('f', p.proowner))) acl
        join aclexplode(array[acl]) e on true
       where e.grantee = 0 and e.privilege_type = 'EXECUTE'
    ) as public_exec,
    pg_get_function_identity_arguments(p.oid) as args,
    p.prosrc as src,
    r.rolname as owner_name
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_roles r on r.oid = p.proowner
  where n.nspname = 'jetnity_reporting' and p.proname = 'account_counts_v1'
) q;
`),
  )
  const searchPath = (katalog.config ?? []).some(
    (wert) => wert === 'search_path=pg_catalog' || wert === 'search_path="pg_catalog"',
  )
  const timezonePin = (katalog.config ?? []).some(
    (wert) => wert === 'timezone=UTC' || wert === "timezone='UTC'" || wert === 'TimeZone=UTC',
  )
  bewerte('Candidate ist SECURITY DEFINER', gruppe, katalog.security_definer === true, JSON.stringify(katalog.security_definer))
  bewerte('search_path ist auf pg_catalog fixiert', gruppe, searchPath, JSON.stringify(katalog.config))
  bewerte('Candidate-Owner ist das fixture-postgres (nicht eine neue Privilege-Rolle)', gruppe, katalog.owner_name === 'postgres', katalog.owner_name)
  bewerte(
    'PUBLIC/anon/service_role haben kein EXECUTE; authenticated hat EXECUTE',
    gruppe,
    katalog.anon_exec === false &&
      katalog.service_exec === false &&
      katalog.public_exec === false &&
      katalog.auth_exec === true,
    JSON.stringify(katalog),
  )
  bewerte(
    'kein dynamisches SQL und keine Caller-Filterparameter',
    gruppe,
    !/execute format|execute\s+'/i.test(katalog.src) &&
      katalog.args === '' &&
      /jetnity\.admin-account-counts\.v1/.test(katalog.src) &&
      /720 hours/.test(katalog.src),
    'prosrc inspected',
  )
  bewerte('Function-TimeZone ist auf UTC gepinnt oder 720-hours-Arithmetik ist tz-unabhängig', gruppe, timezonePin || /720 hours/.test(katalog.src), JSON.stringify(katalog.config))

  const fixture = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    c.relrowsecurity as users_rls,
    c.relforcerowsecurity as users_force_rls,
    pg_get_userbyid(c.relowner) as users_owner,
    (select count(*) from pg_policy p where p.polrelid = c.oid) as users_policies,
    r.rolsuper as postgres_super,
    r.rolbypassrls as postgres_bypass,
    has_table_privilege('postgres', 'auth.users', 'SELECT') as postgres_sel,
    has_table_privilege('anon', 'auth.users', 'SELECT') as anon_sel,
    has_table_privilege('authenticated', 'auth.users', 'SELECT') as auth_sel,
    has_table_privilege('service_role', 'auth.users', 'SELECT') as service_sel,
    has_schema_privilege('anon', 'jetnity_internal', 'USAGE') as anon_internal,
    has_schema_privilege('authenticated', 'jetnity_internal', 'USAGE') as auth_internal,
    has_schema_privilege('service_role', 'jetnity_internal', 'USAGE') as service_internal,
    has_schema_privilege('authenticated', 'jetnity_reporting', 'USAGE') as auth_reporting,
    has_schema_privilege('anon', 'jetnity_reporting', 'USAGE') as anon_reporting,
    has_schema_privilege('service_role', 'jetnity_reporting', 'USAGE') as service_reporting,
    pg_has_role('authenticated', 'postgres', 'MEMBER') as auth_inherits_postgres,
    pg_has_role('anon', 'postgres', 'MEMBER') as anon_inherits_postgres,
    pg_has_role('service_role', 'postgres', 'MEMBER') as service_inherits_postgres,
    (select relrowsecurity from pg_class pc join pg_namespace pn on pn.oid = pc.relnamespace
      where pn.nspname = 'public' and pc.relname = 'profiles') as profiles_rls,
    (select pg_get_userbyid(pc.relowner) from pg_class pc join pg_namespace pn on pn.oid = pc.relnamespace
      where pn.nspname = 'public' and pc.relname = 'profiles') as profiles_owner
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_roles r on r.rolname = 'postgres'
  where n.nspname = 'auth' and c.relname = 'users'
) q;
`),
  )
  bewerte(
    'auth.users Fixture: RLS-on, FORCE-off, owner supabase_auth_admin, keine Policies',
    gruppe,
    fixture.users_rls === true &&
      fixture.users_force_rls === false &&
      fixture.users_owner === 'supabase_auth_admin' &&
      Number(fixture.users_policies) === 0,
    JSON.stringify(fixture),
  )
  bewerte(
    'postgres Fixture: NOSUPERUSER + BYPASSRLS + SELECT; Clients erben postgres nicht',
    gruppe,
    fixture.postgres_super === false &&
      fixture.postgres_bypass === true &&
      fixture.postgres_sel === true &&
      fixture.anon_sel === false &&
      fixture.auth_sel === false &&
      fixture.service_sel === false &&
      fixture.auth_inherits_postgres === false &&
      fixture.anon_inherits_postgres === false &&
      fixture.service_inherits_postgres === false,
    JSON.stringify(fixture),
  )
  bewerte(
    'kein client SELECT auf auth.users; jetnity_internal bleibt geschlossen',
    gruppe,
    fixture.anon_internal === false &&
      fixture.auth_internal === false &&
      fixture.service_internal === false &&
      fixture.auth_reporting === true &&
      fixture.anon_reporting === false &&
      fixture.service_reporting === false,
    JSON.stringify(fixture),
  )
  bewerte(
    'profiles Fixture: RLS-on, owner postgres',
    gruppe,
    fixture.profiles_rls === true && fixture.profiles_owner === 'postgres',
    JSON.stringify({ rls: fixture.profiles_rls, owner: fixture.profiles_owner }),
  )

  const acl = sitzung({
    rolle: 'authenticated',
    uid: IDS.user,
    aal: 'aal1',
    sql: `insert into public.acl_kontrolle (notiz) values ('voreinstellung')`,
  })
  bewerte(
    'nachgebildete Default-Privilegien bleiben für acl_kontrolle wirksam',
    gruppe,
    acl.arbeit?.ok === true,
    JSON.stringify(acl.arbeit),
  )
}

function ohneKommentare(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*--.*$/gm, '')
}

function pruefeStatischeQuelle() {
  const gruppe = 'static-source'
  const candidate = ohneKommentare(readFileSync(CANDIDATE, 'utf8'))
  bewerte(
    'Candidate enthält kein dynamisches SQL',
    gruppe,
    !/execute format|execute\s+'/i.test(candidate),
    'source scan',
  )
  const grantStatements = candidate.split(';').filter((teil) => /^\s*grant\b/im.test(teil))
  const createRoleStatements = candidate.split(';').filter((teil) => /^\s*create\s+role\b/im.test(teil))
  bewerte(
    'Candidate gewährt nichts auf jetnity_internal und kein client SELECT auf auth.users',
    gruppe,
    grantStatements.every((teil) => !/\bjetnity_internal\b/i.test(teil)) &&
      !/grant\s+select\s+on(?:\s+table)?\s+auth\.users/i.test(candidate) &&
      !/create\s+role\s+jetnity_reporting_owner/i.test(candidate) &&
      createRoleStatements.length === 0,
    'source scan',
  )
  bewerte(
    'Candidate benutzt 720-hours-Fenster und owner postgres',
    gruppe,
    /interval '720 hours'/.test(candidate) && /owner to postgres/.test(candidate) && !/interval '30 days'/.test(candidate),
    'source scan',
  )
  bewerte(
    'Candidate verlangt persisted active caller status without joining the metric population',
    gruppe,
    /from public\.profiles as p/.test(candidate) &&
      /_caller_status is distinct from 'active'/.test(candidate) &&
      !/from auth\.users as u\s+join\s+public\.profiles/i.test(candidate),
    'source scan',
  )
}

export function schreibeHostileStartup(datei) {
  writeFileSync(
    datei,
    [
      `\\echo ${PSQLRC_SENTINEL}`,
      '\\connect nonexistent_psqlrc_redirect_db',
      '',
    ].join('\n'),
  )
}

export function runPsqlCapture(psqlBin, args, env) {
  try {
    const stdout = execFileSync(psqlBin, args, {
      encoding: 'utf8',
      env,
      timeout: SUBPROCESS_TIMEOUT_MS.psql,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { status: 0, stdout, stderr: '' }
  } catch (fehler) {
    return {
      status: typeof fehler?.status === 'number' ? fehler.status : 1,
      stdout: String(fehler?.stdout ?? ''),
      stderr: String(fehler?.stderr ?? ''),
    }
  }
}

function pruefePsqlrcIsolation() {
  const gruppe = 'psqlrc-node'
  const hostileDir = join(cluster.rootDir, 'hostile-psqlrc')
  mkdirSync(hostileDir, { recursive: true, mode: 0o700 })
  const explicitRc = join(hostileDir, 'explicit.psqlrc')
  const homeRc = join(hostileDir, '.psqlrc')
  schreibeHostileStartup(explicitRc)
  schreibeHostileStartup(homeRc)

  const basisEnv = cleanChildEnv()
  const verbindungsArgs = ['-h', cluster.socketDir, '-U', cluster.user, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-q', '-c', 'select 1']

  const kontrolle = runPsqlCapture(cluster.psql, verbindungsArgs, {
    ...basisEnv,
    PSQLRC: explicitRc,
    HOME: hostileDir,
  })
  bewerte(
    'Lokale Kontrolle: ohne -X führt explizites PSQLRC den Sentinel aus (kein Remote-Ziel)',
    gruppe,
    kontrolle.stdout.includes(PSQLRC_SENTINEL),
    `${kontrolle.status} ${kontrolle.stdout.trim()} ${kontrolle.stderr.trim()}`,
  )

  const explizit = runPsqlCapture(cluster.psql, ['-X', '--no-psqlrc', ...verbindungsArgs], {
    ...basisEnv,
    PSQLRC: explicitRc,
    HOME: '/tmp',
  })
  bewerte(
    'explizites PSQLRC wird mit -X/--no-psqlrc nicht ausgeführt',
    gruppe,
    explizit.status === 0 && !explizit.stdout.includes(PSQLRC_SENTINEL) && explizit.stdout.trim() === '1',
    `${explizit.status} ${explizit.stdout.trim()}`,
  )

  const geerbt = runPsqlCapture(cluster.psql, ['-X', '--no-psqlrc', ...verbindungsArgs], {
    ...basisEnv,
    HOME: hostileDir,
  })
  bewerte(
    'geerbtes HOME/.psqlrc wird mit -X/--no-psqlrc nicht ausgeführt',
    gruppe,
    geerbt.status === 0 && !geerbt.stdout.includes(PSQLRC_SENTINEL) && geerbt.stdout.trim() === '1',
    `${geerbt.status} ${geerbt.stdout.trim()}`,
  )

  const runnerOut = psqlFile('select 2', 'postgres')
  bewerte(
    'Runner-psql (sanitized env, -X) führt keinen Startup-Sentinel aus',
    gruppe,
    runnerOut === '2' && !runnerOut.includes(PSQLRC_SENTINEL) && !cleanChildEnv().PSQLRC,
    runnerOut,
  )
}

function pruefeNormalCleanupEvidence(rootDirBeforeStop, cleanupReport) {
  const gruppe = 'cleanup-node'
  bewerte(
    'Normal-Lauf: Postmaster ist nach stop beendet; owned directory entfernt',
    gruppe,
    cleanupReport?.cleaned === true &&
      cleanupReport?.removed === true &&
      cleanupReport?.running === false &&
      !cleanupReport?.error &&
      rootDirBeforeStop &&
      !existsSync(rootDirBeforeStop),
    JSON.stringify({ ...cleanupReport, exists: existsSync(rootDirBeforeStop ?? '') }),
  )
}

function invokedAsMain() {
  const entry = process.argv[1]
  if (!entry) return false
  return fileURLToPath(import.meta.url) === resolve(entry)
}

async function main() {
  assertIsolatedConnectionEnvironment()
  const candidateHash = sha256Datei(CANDIDATE)
  const bootstrapHash = sha256Datei(BOOTSTRAP)
  console.log(`candidate sha256=${candidateHash}`)
  console.log(`bootstrap sha256=${bootstrapHash}`)

  let rootDir = null
  let cleanupReport = null
  try {
    startePrivatesCluster()
    rootDir = cluster.rootDir
    console.log(`cluster lifecycle=${cluster.lifecycle} socket=${cluster.socketDir} (private; system 16/main not used)`)
    legeDatenbankAn()
    const version = psqlFile('select version()', 'postgres')
    console.log(`postgresql ${version}`)

    pruefeStatischeQuelle()
    pruefePsqlrcIsolation()
    pruefeAutorisierung()
    pruefeCallerStatus()
    pruefeLebenszyklus()
    pruefeFensterUndNull()
    pruefeZeroVersusDeny()
    pruefeRlsContrast()
    pruefeKatalogUndDirektzugriff()
  } catch (fehler) {
    console.error(fehler)
    cleanupReport = stoppePrivatesCluster()
    if (cleanupReport.error) {
      console.error('CLEANUP FAILED:', cleanupReport)
    }
    process.exit(1)
  }

  cleanupReport = stoppePrivatesCluster()
  if (cleanupReport.error) {
    console.error('CLEANUP FAILED:', cleanupReport)
    process.exit(1)
  }
  pruefeNormalCleanupEvidence(rootDir, cleanupReport)
  console.log(`cleanup ${JSON.stringify(cleanupReport)}`)

  const byGruppe = ergebnisse.reduce((acc, eintrag) => {
    acc[eintrag.gruppe] = (acc[eintrag.gruppe] ?? 0) + 1
    return acc
  }, {})
  const fehler = ergebnisse.filter((eintrag) => !eintrag.ok)
  console.log(`\n${ergebnisse.length - fehler.length}/${ergebnisse.length} isolierte Account-Count-Nachweise erfüllt.`)
  console.log(`assertion categories: ${JSON.stringify(byGruppe)}`)
  console.log('Ziel: privater disposable PostgreSQL-Cluster. Supabase und Production nicht berührt.')
  if (fehler.length) {
    console.error('Fehlgeschlagen:')
    for (const eintrag of fehler) {
      console.error(`- [${eintrag.gruppe}] ${eintrag.name}: ${eintrag.detail}`)
    }
    process.exit(1)
  }
}

if (invokedAsMain()) {
  main().catch((fehler) => {
    console.error(fehler)
    const report = stoppePrivatesCluster()
    if (report.error) {
      console.error('CLEANUP FAILED:', report)
    }
    process.exit(1)
  })
}
