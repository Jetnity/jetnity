#!/usr/bin/env node
// Isolated local proof of jetnity.admin-account-counts.v1.
//
// Starts a disposable PostgreSQL cluster on a private socket owned by this
// process. It never imports scripts/db/sql.mjs, never uses remote defaults,
// and refuses inherited connection overrides. Cleanup removes only the
// cluster directory this run created.
//
//   node scripts/db/admin-account-counts-1-local-proof.mjs

import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../..', import.meta.url).pathname
const BOOTSTRAP = join(ROOT, 'scripts/db/admin-account-counts-1-bootstrap.sql')
const CANDIDATE = join(ROOT, 'scripts/db/admin-account-counts-1-candidate.sql')
const DB_NAME = 'jetnity_admin_account_counts_1'
const CLUSTER_USER = 'jetnity_proof'

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

const IDS = {
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

function findPgBin(name) {
  const dirs = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/17/bin', '/usr/lib/postgresql/15/bin', '/usr/bin']
  for (const dir of dirs) {
    const pfad = join(dir, name)
    if (existsSync(pfad)) return pfad
  }
  return null
}

function requirePgBins() {
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

function cleanChildEnv() {
  const env = { ...process.env }
  for (const schluessel of Object.keys(env)) {
    if (schluessel.startsWith('PG') || FORBIDDEN_CONNECTION_KEYS.includes(schluessel)) {
      delete env[schluessel]
    }
  }
  return env
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

function startePrivatesCluster() {
  const bins = requirePgBins()
  const runId = randomUUID()
  const rootDir = join(tmpdir(), `jetnity-admin-account-counts-1-${runId}`)
  const dataDir = join(rootDir, 'data')
  const socketDir = join(rootDir, 'socket')
  const logFile = join(rootDir, 'postgres.log')
  mkdirSync(socketDir, { recursive: true })

  const initArgs = [
    '-D',
    dataDir,
    '--auth-local=trust',
    '--auth-host=reject',
    '--no-sync',
    '--encoding=UTF8',
    '--username',
    CLUSTER_USER,
  ]
  try {
    execFileSync(bins.initdb, [...initArgs, '--locale=C.UTF-8'], { stdio: 'pipe', env: cleanChildEnv() })
  } catch {
    execFileSync(bins.initdb, [...initArgs, '--no-locale'], { stdio: 'pipe', env: cleanChildEnv() })
  }

  appendFileSync(
    join(dataDir, 'postgresql.conf'),
    [
      '',
      "listen_addresses = ''",
      `unix_socket_directories = '${socketDir}'`,
      'unix_socket_permissions = 0700',
      "timezone = 'UTC'",
      'logging_collector = off',
      '',
    ].join('\n'),
  )

  execFileSync(bins.pgCtl, ['-D', dataDir, '-l', logFile, '-w', '-t', '30', 'start'], {
    stdio: 'pipe',
    env: cleanChildEnv(),
  })

  cluster = { ...bins, rootDir, dataDir, socketDir, logFile, user: CLUSTER_USER }
  return cluster
}

function stoppePrivatesCluster() {
  if (!cluster) return
  try {
    execFileSync(cluster.pgCtl, ['-D', cluster.dataDir, '-m', 'fast', '-w', '-t', '20', 'stop'], {
      stdio: 'pipe',
      env: cleanChildEnv(),
    })
  } catch {
    // Best-effort stop of the cluster this run created.
  }
  try {
    rmSync(cluster.rootDir, { recursive: true, force: true })
  } catch {
    // Best-effort removal of this run's directory only.
  }
  cluster = null
}

function psqlArgs(datenbank, extra = []) {
  return ['-h', cluster.socketDir, '-U', cluster.user, '-d', datenbank, '-v', 'ON_ERROR_STOP=1', ...extra]
}

function psqlFile(sql, datenbank = DB_NAME) {
  return execFileSync(cluster.psql, psqlArgs(datenbank, ['-At', '-q', '-f', '-']), {
    encoding: 'utf8',
    input: sql,
    env: cleanChildEnv(),
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim()
}

function psqlSql(sql, datenbank = DB_NAME) {
  execFileSync(cluster.psql, psqlArgs(datenbank, ['-f', '-']), {
    input: sql,
    env: cleanChildEnv(),
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
  ('${IDS.softDel}',     now() - interval '2 days',  now(), now() - interval '2 days', false);

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
  ('${IDS.softDel}',     'moderator', 'active');
`
}

function testHelperSql() {
  return `
create schema if not exists jetnity_test;

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
        and created_at >= now() - interval '30 days'
        and created_at < now()
    )::bigint as windowed
  from auth.users
) q;
`),
  )
}

function pruefeAutorisierung() {
  const gruppe = 'auth'
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

function pruefeLebenszyklus() {
  const gruppe = 'lifecycle'
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
    (select deleted_at is not null from auth.users where id = '${IDS.softDel}') as soft,
    exists(select 1 from auth.users where id = '${IDS.unconfirmed}' and confirmed_at is null) as unconfirmed,
    exists(select 1 from public.profiles where user_id = '${IDS.banned}' and status = 'banned') as banned,
    exists(select 1 from auth.users where id = '${IDS.internal}') as internal_row
) q;
`),
  )
  bewerte(
    'anonym/soft-delete sind ausgeschlossen; unconfirmed/internal/banned-Profil bleiben in der Zielmenge',
    gruppe,
    excluded.anon === true &&
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
  const gruppe = 'window'
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
    ) as future_present
  from auth.users
) q;
`),
  )
  bewerte(
    'NULL-created_at zählt in present, nicht im Fenster; Zukunft zählt nicht in den prior 30 days',
    gruppe,
    Number(row.present_registered_accounts) === Number(privileged.present) &&
      Number(row.created_in_prior_30_days) === Number(privileged.windowed) &&
      Number(privileged.null_present) === 1 &&
      Number(privileged.future_present) === 1,
    JSON.stringify({ row, privileged }),
  )

  const kanten = jsonZeile(
    psqlFile(`
begin;
insert into auth.users (id, created_at, deleted_at, confirmed_at, is_anonymous) values
  ('${IDS.edgeStart}', now() - interval '30 days', null, now() - interval '30 days', false),
  ('${IDS.edgeEnd}', now(), null, now(), false);
select jetnity_test.sitzung(
  'authenticated',
  $c$${claims({ uid: IDS.moderator, aal: 'aal2' })}$c$,
  $a$select * from jetnity_reporting.account_counts_v1()$a$,
  $i$
    select
      (select created_at >= now() - interval '30 days' from auth.users where id = '${IDS.edgeStart}') as start_ge,
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
}

function pruefeZeroVersusDeny() {
  const gruppe = 'zero-vs-deny'
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
    p.prosrc as src
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'jetnity_reporting' and p.proname = 'account_counts_v1'
) q;
`),
  )
  const searchPath = (katalog.config ?? []).some(
    (wert) => wert === 'search_path=pg_catalog' || wert === 'search_path="pg_catalog"',
  )
  bewerte('Candidate ist SECURITY DEFINER', gruppe, katalog.security_definer === true, JSON.stringify(katalog.security_definer))
  bewerte('search_path ist auf pg_catalog fixiert', gruppe, searchPath, JSON.stringify(katalog.config))
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
      /jetnity\.admin-account-counts\.v1/.test(katalog.src),
    'prosrc inspected',
  )

  const grants = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    has_table_privilege('anon', 'auth.users', 'SELECT') as anon_sel,
    has_table_privilege('authenticated', 'auth.users', 'SELECT') as auth_sel,
    has_table_privilege('service_role', 'auth.users', 'SELECT') as service_sel,
    has_schema_privilege('anon', 'jetnity_internal', 'USAGE') as anon_internal,
    has_schema_privilege('authenticated', 'jetnity_internal', 'USAGE') as auth_internal,
    has_schema_privilege('service_role', 'jetnity_internal', 'USAGE') as service_internal,
    has_schema_privilege('authenticated', 'jetnity_reporting', 'USAGE') as auth_reporting,
    has_schema_privilege('anon', 'jetnity_reporting', 'USAGE') as anon_reporting,
    has_schema_privilege('service_role', 'jetnity_reporting', 'USAGE') as service_reporting,
    pg_has_role('authenticated', 'jetnity_reporting_owner', 'MEMBER') as auth_inherits_owner
) q;
`),
  )
  bewerte(
    'kein client SELECT auf auth.users; jetnity_internal bleibt geschlossen',
    gruppe,
    grants.anon_sel === false &&
      grants.auth_sel === false &&
      grants.service_sel === false &&
      grants.anon_internal === false &&
      grants.auth_internal === false &&
      grants.service_internal === false &&
      grants.auth_reporting === true &&
      grants.anon_reporting === false &&
      grants.service_reporting === false &&
      grants.auth_inherits_owner === false,
    JSON.stringify(grants),
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
  const gruppe = 'static'
  const candidate = ohneKommentare(readFileSync(CANDIDATE, 'utf8'))
  bewerte(
    'Candidate enthält kein dynamisches SQL',
    gruppe,
    !/execute format|execute\s+'/i.test(candidate),
    'source scan',
  )
  const grantStatements = candidate.split(';').filter((teil) => /^\s*grant\b/im.test(teil))
  bewerte(
    'Candidate gewährt nichts auf jetnity_internal',
    gruppe,
    grantStatements.every((teil) => !/\bjetnity_internal\b/i.test(teil)),
    'source scan',
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

  startePrivatesCluster()
  try {
    legeDatenbankAn()
    const version = psqlFile('select version()')
    console.log(`postgresql ${version}`)
    console.log(`cluster socket=${cluster.socketDir} (private; system 16/main not used)`)

    pruefeStatischeQuelle()
    pruefeAutorisierung()
    pruefeLebenszyklus()
    pruefeFensterUndNull()
    pruefeZeroVersusDeny()
    pruefeKatalogUndDirektzugriff()
  } finally {
    stoppePrivatesCluster()
  }

  const fehler = ergebnisse.filter((eintrag) => !eintrag.ok)
  console.log(`\n${ergebnisse.length - fehler.length}/${ergebnisse.length} isolierte Account-Count-Nachweise erfüllt.`)
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
    try {
      stoppePrivatesCluster()
    } catch {
      // Best-effort cleanup of this run only.
    }
    process.exit(1)
  })
}
