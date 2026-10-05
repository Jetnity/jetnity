#!/usr/bin/env node
// Isolated local proof of public.admin_account_counts_v1().
//
// Reuses the accepted #550 isolation helpers without editing them.
// Applies the accepted candidate+bootstrap unchanged, then this LOCAL
// wrapper only. Never imports scripts/db/sql.mjs.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  IDS,
  FORBIDDEN_CONNECTION_KEYS,
  assertIsolatedConnectionEnvironment,
  sha256Datei,
  requirePgBins,
  cleanChildEnv,
  psqlSafeArgs,
  startePrivatesCluster,
  stoppePrivatesCluster,
  aktuellerCluster,
} from './admin-account-counts-1-local-proof.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const BOOTSTRAP = join(ROOT, 'scripts/db/admin-account-counts-1-bootstrap.sql')
const CANDIDATE = join(ROOT, 'scripts/db/admin-account-counts-1-candidate.sql')
const WRAPPER = join(ROOT, 'scripts/db/admin-account-counts-delivery-1-rpc.sql')
const DB_NAME = 'jetnity_admin_account_counts_delivery_1'
const ACCEPTED_CANDIDATE_SHA256 = '612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de'
const HISTORICAL_REFUSED_CANDIDATE_SHA256 =
  'dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420'
const SUBPROCESS_TIMEOUT_MS = 30_000

const ergebnisse = []

function bewerte(name, gruppe, ok, detail) {
  ergebnisse.push({ name, gruppe, ok, detail: String(detail ?? '') })
  console.log(`${ok ? '  ok  ' : ' FEHL '} [${gruppe}] ${name}  ${detail ?? ''}`)
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

function psqlFile(sql, datenbank = DB_NAME) {
  const cluster = aktuellerCluster()
  const env = cleanChildEnv()
  if (env.PSQLRC) throw new Error('fail-closed: PSQLRC leaked into child environment.')
  return execFileSync(cluster.psql, psqlSafeArgs(datenbank, ['-At', '-q', '-f', '-']), {
    encoding: 'utf8',
    input: sql,
    env,
    timeout: SUBPROCESS_TIMEOUT_MS,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim()
}

function psqlSql(sql, datenbank = DB_NAME) {
  const cluster = aktuellerCluster()
  const env = cleanChildEnv()
  if (env.PSQLRC) throw new Error('fail-closed: PSQLRC leaked into child environment.')
  execFileSync(cluster.psql, psqlSafeArgs(datenbank, ['-f', '-']), {
    input: sql,
    env,
    timeout: SUBPROCESS_TIMEOUT_MS,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function claims({ uid, rolle = 'authenticated', aal, extra = {} }) {
  if (!uid) return JSON.stringify({ role: rolle, ...extra })
  return JSON.stringify({
    sub: uid,
    role: rolle,
    ...(aal ? { aal } : {}),
    ...extra,
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
`
}

function funktionKatalog(schema, name) {
  return jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    n.nspname as schema,
    p.proname as name,
    pg_get_userbyid(p.proowner) as owner,
    p.prosecdef as security_definer,
    p.pronargs as nargs,
    pg_get_function_identity_arguments(p.oid) as args,
    pg_get_functiondef(p.oid) as definition,
    (
      select coalesce(jsonb_agg(acl::text order by acl::text), '[]'::jsonb)
      from unnest(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
    ) as acls
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = $s$${schema}$s$
    and p.proname = $n$${name}$n$
    and p.pronargs = 0
) q;
`),
  )
}

function wrapperTypen() {
  return jsonZeile(
    psqlFile(`
select jsonb_agg(jsonb_build_object('name', t.name, 'typ', t.typ) order by t.ord) as cols
from (
  select
    t.name,
    format_type(t.typ, null) as typ,
    t.ord
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join lateral unnest(p.proargnames, p.proargmodes, p.proallargtypes)
    with ordinality as t(name, mode, typ, ord)
  where n.nspname = 'public'
    and p.proname = 'admin_account_counts_v1'
    and t.mode = 't'
) t;
`),
  )
}

function legeDatenbankAn() {
  psqlSql(`create database ${DB_NAME}`, 'postgres')
  psqlSql(
    [readFileSync(BOOTSTRAP, 'utf8'), readFileSync(CANDIDATE, 'utf8'), seedSql(), testHelperSql()].join(
      '\n\n',
    ),
  )
}

function pruefeWrapper() {
  const gruppeAuth = 'wrapper-auth-sql'
  const vergleich = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: `select
      to_jsonb(i) as inner_row,
      to_jsonb(w) as wrapper_row
    from jetnity_reporting.account_counts_v1() as i
    cross join public.admin_account_counts_v1() as w`,
  })
  const innerRow = vergleich.arbeit?.row?.inner_row
  const wrapRow = vergleich.arbeit?.row?.wrapper_row
  const match =
    vergleich.arbeit?.ok === true &&
    wrapRow?.definition_version === 'jetnity.admin-account-counts.v1' &&
    wrapRow?.present_registered_accounts === String(innerRow?.present_registered_accounts) &&
    wrapRow?.created_in_prior_30_days === String(innerRow?.created_in_prior_30_days) &&
    wrapRow?.measured_at === innerRow?.measured_at &&
    wrapRow?.window_start === innerRow?.window_start &&
    typeof wrapRow?.present_registered_accounts === 'string' &&
    typeof wrapRow?.created_in_prior_30_days === 'string'
  bewerte(
    'Wrapper-TEXT entspricht inneren Counts/Zeitstempeln/Version',
    'wrapper-transport-sql',
    match,
    match
      ? `present=${wrapRow.present_registered_accounts} window=${wrapRow.created_in_prior_30_days}`
      : JSON.stringify(vergleich.arbeit),
  )

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
      sql: 'select * from public.admin_account_counts_v1()',
    })
    const row = ergebnis.arbeit?.row
    const ok =
      ergebnis.arbeit?.ok === true &&
      row?.definition_version === 'jetnity.admin-account-counts.v1' &&
      typeof row?.present_registered_accounts === 'string'
    bewerte(
      `${name} AAL2 erhält den Wrapper`,
      gruppeAuth,
      ok,
      ok ? `present=${row.present_registered_accounts}` : JSON.stringify(ergebnis.arbeit),
    )
  }

  mussAblehnen(
    'Moderator AAL1 erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal1',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'User AAL2 erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'authenticated',
      uid: IDS.user,
      aal: 'aal2',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'Creator AAL2 erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'authenticated',
      uid: IDS.creator,
      aal: 'aal2',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'Fehlendes AAL erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'Gelöschter Moderator erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'authenticated',
      uid: IDS.softDel,
      aal: 'aal2',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'Anonymer privilegierter Caller erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'authenticated',
      uid: IDS.anonPriv,
      aal: 'aal2',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'Fehlendes Subjekt erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'authenticated',
      uid: IDS.absent,
      aal: 'aal2',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|not authorized',
  )
  mussAblehnen(
    'anon erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'anon',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|permission denied',
  )
  mussAblehnen(
    'service_role erhält keinen Wrapper',
    gruppeAuth,
    {
      rolle: 'service_role',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|permission denied',
  )
  mussAblehnen(
    'authenticated darf auth.users nicht direkt lesen',
    'wrapper-acl-sql',
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal2',
      sql: 'select id from auth.users',
    },
    '42501|permission denied',
  )
  mussAblehnen(
    'Wrapper akzeptiert keine Argumente',
    'wrapper-catalog',
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal2',
      sql: 'select * from public.admin_account_counts_v1(1)',
    },
    'function.*does not exist|42883',
  )

  pruefeCallerStatus()
}

function privilegedOwnerWrapperCounts() {
  const ergebnis = sitzung({
    rolle: 'authenticated',
    uid: IDS.owner,
    aal: 'aal2',
    sql: 'select * from public.admin_account_counts_v1()',
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
  const basis = privilegedOwnerWrapperCounts()
  bewerte(
    'active owner AAL2 still receives wrapper aggregates',
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
      `${name}+AAL2 is 42501 on the wrapper; not a zero success row`,
      gruppe,
      {
        rolle: 'authenticated',
        uid,
        aal: 'aal2',
        sql: 'select * from public.admin_account_counts_v1()',
      },
      '42501|not authorized',
    )
    mussAblehnen(
      `${name}+AAL2 is 42501 on the inner producer`,
      gruppe,
      {
        rolle: 'authenticated',
        uid,
        aal: 'aal2',
        sql: 'select * from jetnity_reporting.account_counts_v1()',
      },
      '42501|not authorized',
    )
    const still = privilegedOwnerWrapperCounts()
    bewerte(
      `wrapper metric population unchanged while ${name} is blocked`,
      gruppe,
      still.ok && still.present === basis.present && still.windowed === basis.windowed,
      JSON.stringify({ basis: basis.raw, still: still.raw }),
    )
    psqlSql(`update public.profiles set status = 'active' where user_id = '${uid}'`)
  }

  psqlSql(`update public.profiles set status = 'banned' where user_id = '${IDS.moderator}'`)
  mussAblehnen(
    'direct SQL status change denies the same JWT on the next wrapper call',
    gruppe,
    {
      rolle: 'authenticated',
      uid: IDS.moderator,
      aal: 'aal2',
      sql: 'select * from public.admin_account_counts_v1()',
    },
    '42501|not authorized',
  )
  psqlSql(`update public.profiles set status = 'active' where user_id = '${IDS.moderator}'`)
  const restored = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from public.admin_account_counts_v1()',
  })
  bewerte(
    'same authenticated moderator receives the wrapper again after status returns to active',
    gruppe,
    restored.arbeit?.ok === true &&
      Number(restored.arbeit.row.present_registered_accounts) === basis.present,
    JSON.stringify(restored.arbeit),
  )
}

function pruefeKatalog(vorherInner, nachherInner) {
  const wrap = funktionKatalog('public', 'admin_account_counts_v1')
  const typen = wrapperTypen()
  const cols = typen.cols ?? typen
  const textCols = Array.isArray(cols)
    ? cols.filter((col) =>
        ['present_registered_accounts', 'created_in_prior_30_days'].includes(col.name),
      )
    : []
  bewerte(
    'Wrapper ist SECURITY INVOKER, nullstellig, nicht postgres-owner',
    'wrapper-catalog',
    wrap.security_definer === false && wrap.nargs === 0 && wrap.args === '' && wrap.owner !== 'postgres',
    JSON.stringify({ owner: wrap.owner, definer: wrap.security_definer, args: wrap.args }),
  )
  bewerte(
    'Zählfelder sind kanonischer TEXT-Transport',
    'wrapper-catalog',
    textCols.length === 2 && textCols.every((col) => col.typ === 'text'),
    JSON.stringify(textCols),
  )
  bewerte(
    'PRIVATE ACLs unverändert nach Wrapper-Apply',
    'wrapper-catalog',
    JSON.stringify(vorherInner) === JSON.stringify(nachherInner),
    JSON.stringify({ before: vorherInner.acls, after: nachherInner.acls }),
  )

  const privileges = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    has_function_privilege('anon', 'public.admin_account_counts_v1()', 'EXECUTE') as anon_exec,
    has_function_privilege('authenticated', 'public.admin_account_counts_v1()', 'EXECUTE') as auth_exec,
    has_function_privilege('service_role', 'public.admin_account_counts_v1()', 'EXECUTE') as service_exec,
    has_table_privilege('authenticated', 'auth.users', 'SELECT') as auth_users_sel
) q;
`),
  )
  bewerte(
    'EXECUTE nur authenticated; kein auth.users SELECT',
    'wrapper-catalog',
    privileges.anon_exec === false &&
      privileges.service_exec === false &&
      privileges.auth_exec === true &&
      privileges.auth_users_sel === false,
    JSON.stringify(privileges),
  )
}

function pruefeQuelle() {
  const wrapper = readFileSync(WRAPPER, 'utf8')
  const runner = readFileSync(fileURLToPath(import.meta.url), 'utf8')
  bewerte(
    'Wrapper bleibt LOCAL/UNAPPLIED ohne DEFINER/auth.users/Migration',
    'static-source',
    /LOCAL \/ UNAPPLIED/.test(wrapper) &&
      /^\s*security invoker$/im.test(wrapper) &&
      !/^\s*security definer\b/im.test(wrapper) &&
      !/^\s*[^-\s].*auth\.users/im.test(wrapper) &&
      !/supabase\/migrations\//.test(wrapper) &&
      !/grant select on table/i.test(wrapper),
    'wrapper source',
  )
  bewerte(
    'Runner importiert sql.mjs nicht und bleibt lokal',
    'static-source',
    !/from ['"][^'"]*sql\.mjs['"]/.test(runner) &&
      FORBIDDEN_CONNECTION_KEYS.includes('PGHOST'),
    'runner source',
  )
}

async function main() {
  assertIsolatedConnectionEnvironment()
  const bins = requirePgBins()
  const version = execFileSync(bins.postgres, ['--version'], { encoding: 'utf8' }).trim()
  const candidateSha = sha256Datei(CANDIDATE)
  const wrapperSha = sha256Datei(WRAPPER)
  if (candidateSha === HISTORICAL_REFUSED_CANDIDATE_SHA256) {
    throw new Error(
      `Refused historical #555 candidate identity: ${candidateSha}. Caller-status producer is required.`,
    )
  }
  if (candidateSha !== ACCEPTED_CANDIDATE_SHA256) {
    throw new Error(`Accepted candidate hash mismatch: ${candidateSha}`)
  }
  console.log(`engine ${version}`)
  console.log(`candidate sha256 ${candidateSha}`)
  console.log(`wrapper sha256 ${wrapperSha}`)

  pruefeQuelle()

  let vorherInner
  let nachherInner
  let nachDropInner
  try {
    startePrivatesCluster()
    legeDatenbankAn()
    vorherInner = funktionKatalog('jetnity_reporting', 'account_counts_v1')
    psqlSql(readFileSync(WRAPPER, 'utf8'))
    nachherInner = funktionKatalog('jetnity_reporting', 'account_counts_v1')
    pruefeWrapper()
    pruefeKatalog(vorherInner, nachherInner)
    psqlSql('drop function public.admin_account_counts_v1();')
    nachDropInner = funktionKatalog('jetnity_reporting', 'account_counts_v1')
    bewerte(
      'Nur-Wrapper-Drop lässt inneren Katalog identisch',
      'wrapper-catalog',
      JSON.stringify(vorherInner) === JSON.stringify(nachDropInner),
      'inner intact',
    )
  } finally {
    const cleanup = stoppePrivatesCluster()
    bewerte(
      'Nur eigenes Cluster gestoppt und entfernt',
      'cleanup-node',
      cleanup.cleaned === true && cleanup.running === false,
      JSON.stringify({ cleaned: cleanup.cleaned, running: cleanup.running, stopped: cleanup.stopped }),
    )
  }

  const fehl = ergebnisse.filter((eintrag) => !eintrag.ok)
  const gruppen = {}
  for (const eintrag of ergebnisse) {
    gruppen[eintrag.gruppe] = (gruppen[eintrag.gruppe] ?? 0) + 1
  }
  console.log(
    JSON.stringify(
      {
        ok: fehl.length === 0,
        passed: ergebnisse.filter((eintrag) => eintrag.ok).length,
        failed: fehl.length,
        groups: gruppen,
        engine: version,
        candidateSha,
        wrapperSha,
      },
      null,
      2,
    ),
  )
  if (fehl.length) {
    process.exitCode = 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((fehler) => {
    console.error(fehler instanceof Error ? fehler.message : String(fehler))
    try {
      stoppePrivatesCluster()
    } catch {
      /* owned cleanup best-effort */
    }
    process.exitCode = 1
  })
}
