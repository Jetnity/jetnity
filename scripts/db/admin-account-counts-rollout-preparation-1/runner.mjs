#!/usr/bin/env node
// LOCAL-ONLY rollout rehearsal for the accepted account-count package.
//
// Reuses reviewed isolation/lifecycle helpers from the accepted local proof.
// Never imports scripts/db/sql.mjs. Never uses a hosted URL. Bootstrap is a
// disposable fixture only.

import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  IDS,
  assertIsolatedConnectionEnvironment,
  requirePgBins,
  cleanChildEnv,
  psqlSafeArgs,
  startePrivatesCluster,
  stoppePrivatesCluster,
  aktuellerCluster,
} from '../admin-account-counts-1-local-proof.mjs'

import {
  assertLocalDisposableOnly,
  composeFixtureBootstrap,
  composeInstallTransaction,
  composeProducerAndWrapper,
  composeRevokeExecute,
  composeRollbackTransaction,
  pinAcceptedSources,
  readPackageSql,
} from './compose.mjs'

const hier = dirname(fileURLToPath(import.meta.url))
const ROOT = join(hier, '../../..')
const DB_NAME = 'jetnity_admin_account_counts_rollout_prep_1'
const EVIDENCE_DIR = join(ROOT, 'docs/evidence/admin-account-counts-rollout-preparation-1')
const SUBPROCESS_TIMEOUT_MS = 30_000

export const EXTRA_IDS = Object.freeze({
  bannedMod: '10000000-0000-4000-8000-000000000017',
  disabledAdmin: '10000000-0000-4000-8000-000000000018',
})

const ergebnisse = []

function bewerte(name, gruppe, ok, detail) {
  ergebnisse.push({ name, gruppe, ok, detail: String(detail ?? '') })
  console.log(`${ok ? '  ok  ' : ' FEHL '} [${gruppe}] ${name}  ${detail ?? ''}`)
}

function jsonZeile(roh) {
  const zeile = String(roh)
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

function psqlCapture(sql, datenbank = DB_NAME) {
  const cluster = aktuellerCluster()
  const env = cleanChildEnv()
  try {
    const stdout = execFileSync(cluster.psql, psqlSafeArgs(datenbank, ['-At', '-q', '-f', '-']), {
      encoding: 'utf8',
      input: sql,
      env,
      timeout: SUBPROCESS_TIMEOUT_MS,
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

function classify() {
  return jsonZeile(psqlFile(readPackageSql('classify')))
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
  ('${IDS.anonPriv}',    now() - interval '2 days',  null, now() - interval '2 days',  true),
  ('${EXTRA_IDS.bannedMod}',     now() - interval '2 days', null, now() - interval '2 days', false),
  ('${EXTRA_IDS.disabledAdmin}', now() - interval '2 days', null, now() - interval '2 days', false);

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
  ('${IDS.anonPriv}',    'moderator', 'active'),
  ('${EXTRA_IDS.bannedMod}',     'moderator', 'banned'),
  ('${EXTRA_IDS.disabledAdmin}', 'admin',     'disabled');
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

function legeDatenbankAn() {
  psqlSql(`create database ${DB_NAME}`, 'postgres')
  psqlSql(
    [composeFixtureBootstrap(), seedSql(), testHelperSql(), readPackageSql('sentinel')].join('\n\n'),
  )
}

function packageAbsent() {
  const klass = classify()
  return klass.state === 'FRESH'
}

function pruefeQuelle() {
  const gruppe = 'source-pin'
  const pins = pinAcceptedSources()
  bewerte('accepted candidate/bootstrap/wrapper/contract/parser hashes match', gruppe, true, JSON.stringify(pins))
  const composed = composeProducerAndWrapper()
  bewerte(
    'composition concatenates unchanged candidate then wrapper',
    gruppe,
    composed.sql.includes('jetnity_reporting.account_counts_v1') &&
      composed.sql.includes('public.admin_account_counts_v1') &&
      !composed.sql.includes('create role jetnity_reporting_owner'),
    'composed',
  )
  for (const name of ['classify', 'verify', 'rollback', 'revokeExecute', 'sentinel']) {
    const sql = readPackageSql(name)
    bewerte(
      `${name} has no CASCADE and no hosted DSN`,
      gruppe,
      !/\bCASCADE\b/i.test(sql) && !/postgres(ql)?:\/\//i.test(sql),
      name,
    )
  }
}

function pruefeUnerwartetesObjekt() {
  const gruppe = 'unexpected-object'
  psqlSql(`
create schema jetnity_reporting;
create table jetnity_reporting.unexpected_drift (id int);
`)
  const vor = classify()
  bewerte('pre-existing unexpected schema/table is INCOMPATIBLE', gruppe, vor.state === 'INCOMPATIBLE', JSON.stringify(vor))
  const lauf = psqlCapture(composeInstallTransaction({ mode: 'fresh' }))
  bewerte(
    'fresh install refuses unexpected pre-existing objects',
    gruppe,
    lauf.status !== 0 && /expected FRESH|INCOMPATIBLE/i.test(`${lauf.stdout}\n${lauf.stderr}`),
    `${lauf.status} ${lauf.stderr || lauf.stdout}`.slice(0, 300),
  )
  bewerte('incompatible refusal left the unexpected table in place', gruppe, classify().state === 'INCOMPATIBLE', classify().state)
  psqlSql(`
drop table jetnity_reporting.unexpected_drift;
drop schema jetnity_reporting;
`)
  bewerte('injected incompatibility cleaned without CASCADE', gruppe, packageAbsent(), classify().state)
}

function pruefeFehlerOhneRest() {
  const gruppe = 'fault-closed'
  const lauf = psqlCapture(composeInstallTransaction({ mode: 'fault' }))
  bewerte(
    'forced install failure exits non-zero',
    gruppe,
    lauf.status !== 0 && /JETNITY_ROLLOUT_FAULT_INJECT/.test(`${lauf.stdout}\n${lauf.stderr}`),
    `${lauf.status}`,
  )
  bewerte('forced install failure leaves FRESH / no package residue', gruppe, packageAbsent(), JSON.stringify(classify()))
}

function pruefeInstallUndRepeat() {
  const gruppe = 'install-repeat'
  const first = psqlCapture(composeInstallTransaction({ mode: 'fresh' }))
  bewerte('fresh install commits', gruppe, first.status === 0, first.stderr || first.stdout.slice(-200))
  const after = classify()
  bewerte('post-install state is ALREADY_INSTALLED', gruppe, after.state === 'ALREADY_INSTALLED', JSON.stringify(after))
  bewerte(
    'producer owner is postgres; wrapper owner is not a client role',
    gruppe,
    after.inventory?.producer_owner === 'postgres' &&
      after.inventory?.wrapper_owner &&
      !['anon', 'authenticated', 'service_role'].includes(after.inventory.wrapper_owner),
    JSON.stringify({
      producer: after.inventory?.producer_owner,
      wrapper: after.inventory?.wrapper_owner,
      executor: after.executor,
    }),
  )
  const againFresh = psqlCapture(composeInstallTransaction({ mode: 'fresh' }))
  bewerte(
    'second fresh apply is refused (no blind CREATE OR REPLACE)',
    gruppe,
    againFresh.status !== 0 && /expected FRESH/i.test(`${againFresh.stdout}\n${againFresh.stderr}`),
    `${againFresh.status}`,
  )
  const already = psqlCapture(composeInstallTransaction({ mode: 'already' }))
  bewerte('exact already-installed repeat verifies without rewrite', gruppe, already.status === 0, already.stderr)
  bewerte('repeat leaves ALREADY_INSTALLED', gruppe, classify().state === 'ALREADY_INSTALLED', classify().state)
}

function pruefeAutorisierung() {
  const gruppe = 'authorization'
  const okCall = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from public.admin_account_counts_v1()',
  })
  const row = okCall.arbeit?.row
  bewerte(
    'moderator AAL2 receives both accepted measures; failure is not zero',
    gruppe,
    okCall.arbeit?.ok === true &&
      row?.definition_version === 'jetnity.admin-account-counts.v1' &&
      typeof row?.present_registered_accounts === 'string' &&
      Number(row.present_registered_accounts) >= 1 &&
      row.present_registered_accounts !== '0',
    JSON.stringify(okCall.arbeit),
  )

  for (const [name, opts] of [
    ['no subject', { rolle: 'authenticated', uid: null, aal: 'aal2' }],
    ['anonymous privileged profile', { rolle: 'authenticated', uid: IDS.anonPriv, aal: 'aal2' }],
    ['soft-deleted moderator', { rolle: 'authenticated', uid: IDS.softDel, aal: 'aal2' }],
    ['user AAL2', { rolle: 'authenticated', uid: IDS.user, aal: 'aal2' }],
    ['moderator AAL1', { rolle: 'authenticated', uid: IDS.moderator, aal: 'aal1' }],
    ['anon role', { rolle: 'anon', uid: IDS.moderator, aal: 'aal2' }],
    ['service_role', { rolle: 'service_role', uid: IDS.moderator, aal: 'aal2' }],
  ]) {
    const ergebnis = sitzung({
      ...opts,
      sql: 'select * from public.admin_account_counts_v1()',
    })
    const text = `${ergebnis.arbeit?.sqlstate ?? ''} ${ergebnis.arbeit?.message ?? ''}`
    bewerte(
      `${name} is 42501 and not a zero success row`,
      gruppe,
      ergebnis.arbeit?.ok === false && ergebnis.arbeit?.row == null && /42501|permission denied/i.test(text),
      text || JSON.stringify(ergebnis.arbeit),
    )
  }

  const banned = sitzung({
    rolle: 'authenticated',
    uid: EXTRA_IDS.bannedMod,
    aal: 'aal2',
    sql: 'select * from public.admin_account_counts_v1()',
  })
  const disabled = sitzung({
    rolle: 'authenticated',
    uid: EXTRA_IDS.disabledAdmin,
    aal: 'aal2',
    sql: 'select * from public.admin_account_counts_v1()',
  })
  bewerte(
    'HONEST: banned moderator+AAL2 still receives counts (profiles.status is not a producer/app-role gate)',
    gruppe,
    banned.arbeit?.ok === true && banned.arbeit?.row?.definition_version === 'jetnity.admin-account-counts.v1',
    JSON.stringify(banned.arbeit),
  )
  bewerte(
    'HONEST: disabled admin+AAL2 still receives counts (profiles.status is not a producer/app-role gate)',
    gruppe,
    disabled.arbeit?.ok === true && disabled.arbeit?.row?.definition_version === 'jetnity.admin-account-counts.v1',
    JSON.stringify(disabled.arbeit),
  )

  const clientSelect = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select count(*) as n from auth.users',
  })
  bewerte(
    'authenticated still cannot SELECT auth.users',
    gruppe,
    clientSelect.arbeit?.ok === false,
    JSON.stringify(clientSelect.arbeit),
  )
}

function pruefeOwnerUndAcl() {
  const gruppe = 'owner-acl'
  const meta = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    (select rolbypassrls from pg_roles where rolname = 'postgres') as postgres_bypassrls,
    (select rolsuper from pg_roles where rolname = 'postgres') as postgres_super,
    has_table_privilege('postgres', 'auth.users', 'SELECT') as postgres_users_select,
    has_table_privilege('authenticated', 'auth.users', 'SELECT') as auth_users_select,
    has_schema_privilege('authenticated', 'jetnity_internal', 'USAGE') as auth_internal,
    exists(select 1 from pg_roles where rolname = 'jetnity_reporting_owner') as extra_role,
    (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'auth' and c.relname = 'users') as users_rls,
    (select relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'auth' and c.relname = 'users') as users_force,
    (select pg_get_userbyid(c.relowner) from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'auth' and c.relname = 'users') as users_owner
) q;
`),
  )
  bewerte(
    'trusted owner remains postgres NOSUPERUSER+BYPASSRLS with SELECT; no new privilege role',
    gruppe,
    meta.postgres_bypassrls === true &&
      meta.postgres_super === false &&
      meta.postgres_users_select === true &&
      meta.auth_users_select === false &&
      meta.auth_internal === false &&
      meta.extra_role === false &&
      meta.users_rls === true &&
      meta.users_force === false &&
      meta.users_owner === 'supabase_auth_admin',
    JSON.stringify(meta),
  )
}

function pruefeRollbackUndSentinel() {
  const gruppe = 'rollback'
  const sentinelBefore = psqlFile(`select count(*) from public.jetnity_rollout_sentinel`)
  const helperBefore = psqlFile(`select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'jetnity_test' and p.proname = 'sitzung'`)
  const lauf = psqlCapture(composeRollbackTransaction())
  bewerte('identity-strict rollback commits', gruppe, lauf.status === 0, lauf.stderr || lauf.stdout.slice(-200))
  bewerte('rollback returns FRESH', gruppe, packageAbsent(), JSON.stringify(classify()))
  const sentinelAfter = psqlFile(`select count(*) from public.jetnity_rollout_sentinel`)
  const helperAfter = psqlFile(`select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'jetnity_test' and p.proname = 'sitzung'`)
  bewerte(
    'unrelated sentinel table and test helper survive rollback',
    gruppe,
    sentinelBefore === '1' && sentinelAfter === '1' && helperBefore === '1' && helperAfter === '1',
    JSON.stringify({ sentinelBefore, sentinelAfter, helperBefore, helperAfter }),
  )
}

function pruefeReinstallRevoke() {
  const gruppe = 'reinstall-revoke'
  const reinstall = psqlCapture(composeInstallTransaction({ mode: 'fresh' }))
  bewerte('reinstall after rollback succeeds', gruppe, reinstall.status === 0, reinstall.stderr)
  bewerte('reinstall is ALREADY_INSTALLED', gruppe, classify().state === 'ALREADY_INSTALLED', classify().state)

  psqlSql(composeRevokeExecute())
  const afterRevoke = sitzung({
    rolle: 'authenticated',
    uid: IDS.moderator,
    aal: 'aal2',
    sql: 'select * from public.admin_account_counts_v1()',
  })
  bewerte(
    'REVOKE EXECUTE denies the authorized caller; objects can still exist',
    gruppe,
    afterRevoke.arbeit?.ok === false,
    JSON.stringify(afterRevoke.arbeit),
  )
  const klass = classify()
  bewerte(
    'revoked ACL is INCOMPATIBLE for identity-strict rollback/repeat',
    gruppe,
    klass.state === 'INCOMPATIBLE',
    JSON.stringify(klass),
  )
  const rollback = psqlCapture(composeRollbackTransaction())
  bewerte(
    'rollback refuses revoked/drifted ACL instead of dropping a non-matching object',
    gruppe,
    rollback.status !== 0 && /rollback refused|drifted/i.test(`${rollback.stdout}\n${rollback.stderr}`),
    `${rollback.status} ${String(rollback.stderr || rollback.stdout).slice(0, 240)}`,
  )
  const objectsRemain = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    exists(select 1 from pg_namespace where nspname = 'jetnity_reporting') as schema_exists,
    exists(
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'admin_account_counts_v1'
    ) as wrapper_exists
) q;
`),
  )
  bewerte(
    'refused rollback left objects in place; UI disable remains a separate application layer',
    gruppe,
    objectsRemain.schema_exists === true && objectsRemain.wrapper_exists === true,
    JSON.stringify(objectsRemain),
  )
}

function schreibeEvidence(payload) {
  mkdirSync(EVIDENCE_DIR, { recursive: true, mode: 0o755 })
  const ziel = join(EVIDENCE_DIR, 'local-rehearsal.json')
  writeFileSync(ziel, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8' })
  return ziel
}

function invokedAsMain() {
  const entry = process.argv[1]
  if (!entry) return false
  return fileURLToPath(import.meta.url) === resolve(entry)
}

export function runRolloutRehearsal() {
  assertIsolatedConnectionEnvironment()
  assertLocalDisposableOnly()
  requirePgBins()

  const pins = pinAcceptedSources()
  console.log(`candidate sha256=${pins.candidate}`)
  console.log(`bootstrap sha256=${pins.bootstrap}`)
  console.log(`wrapper sha256=${pins.wrapper}`)
  console.log(`contract blob=${pins.contractBlob}`)
  console.log(`parser blob=${pins.parserBlob}`)

  let rootDir = null
  let cleanupReport = null
  let engine = null
  try {
    startePrivatesCluster()
    rootDir = aktuellerCluster().rootDir
    console.log(`cluster lifecycle=${aktuellerCluster().lifecycle} socket=${aktuellerCluster().socketDir} (private; system cluster not used)`)
    legeDatenbankAn()
    engine = psqlFile('select version()', 'postgres')
    console.log(`postgresql ${engine}`)

    pruefeQuelle()
    pruefeUnerwartetesObjekt()
    pruefeFehlerOhneRest()
    pruefeInstallUndRepeat()
    pruefeAutorisierung()
    pruefeOwnerUndAcl()
    pruefeRollbackUndSentinel()
    pruefeReinstallRevoke()
  } catch (fehler) {
    console.error(fehler)
    cleanupReport = stoppePrivatesCluster()
    if (cleanupReport.error) console.error('CLEANUP FAILED:', cleanupReport)
    process.exitCode = 1
    return { ok: false, ergebnisse, cleanupReport, engine }
  }

  cleanupReport = stoppePrivatesCluster()
  if (cleanupReport.error) {
    console.error('CLEANUP FAILED:', cleanupReport)
    process.exitCode = 1
  }
  bewerte(
    'owned disposable cluster stopped and directory removed',
    'cleanup-node',
    cleanupReport?.cleaned === true &&
      cleanupReport?.removed === true &&
      cleanupReport?.running === false &&
      !cleanupReport?.error &&
      rootDir &&
      !existsSync(rootDir),
    JSON.stringify({ ...cleanupReport, exists: existsSync(rootDir ?? '') }),
  )

  const fehler = ergebnisse.filter((eintrag) => !eintrag.ok)
  const byGruppe = ergebnisse.reduce((acc, eintrag) => {
    acc[eintrag.gruppe] = (acc[eintrag.gruppe] ?? 0) + 1
    return acc
  }, {})
  console.log(`\n${ergebnisse.length - fehler.length}/${ergebnisse.length} rollout-preparation Nachweise erfüllt.`)
  console.log(`assertion categories: ${JSON.stringify(byGruppe)}`)
  console.log('Ziel: privater disposable PostgreSQL-Cluster. Hosted/Production nicht berührt.')
  if (fehler.length) {
    console.error('Fehlgeschlagen:')
    for (const eintrag of fehler) {
      console.error(`- [${eintrag.gruppe}] ${eintrag.name}: ${eintrag.detail}`)
    }
    process.exitCode = 1
  }

  const receipt = {
    agent: 'Jetnity admin account counts rollout preparation 1',
    generation: 1,
    localOnly: true,
    engine,
    pins,
    counts: { passed: ergebnisse.length - fehler.length, total: ergebnisse.length },
    categories: byGruppe,
    failures: fehler.map((eintrag) => ({ name: eintrag.name, gruppe: eintrag.gruppe })),
    cleanup: {
      cleaned: cleanupReport?.cleaned ?? false,
      removed: cleanupReport?.removed ?? false,
      running: cleanupReport?.running ?? null,
    },
    notes: [
      'PostgreSQL version is the local disposable engine, not Production 17.6.',
      'Banned/disabled privileged callers remaining authorized is an honest NO-GO for later exposure.',
      'No hosted SQL, live accounts, or secrets were used.',
    ],
  }
  const evidencePath = schreibeEvidence(receipt)
  console.log(`evidence ${evidencePath}`)
  return { ok: fehler.length === 0 && !cleanupReport?.error, ergebnisse, cleanupReport, engine, evidencePath }
}

if (invokedAsMain()) {
  try {
    const result = runRolloutRehearsal()
    if (!result.ok) process.exit(1)
  } catch (fehler) {
    console.error(fehler)
    const report = stoppePrivatesCluster()
    if (report.error) console.error('CLEANUP FAILED:', report)
    process.exit(1)
  }
}
