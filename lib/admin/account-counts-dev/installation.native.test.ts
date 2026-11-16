// Real isolated PostgreSQL only, never a hosted connection or hosted JWT.
// Required normal core CI runs this. Engine version is printed; no PG17 claim
// is made when the existing core runner supplies PostgreSQL 16.
import assert from 'node:assert/strict'
import { execFileSync, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  assertIsolatedConnectionEnvironment, startePrivatesCluster, stoppePrivatesCluster,
  psqlSafeArgs, cleanChildEnv, IDS,
} from '@/scripts/db/admin-account-counts-1-local-proof.mjs'
import { composeDevAccountCountsInstallation } from './installation'
import { ADMIN_ACCOUNT_COUNTS_DEV_PROJECT } from '@/lib/admin/account-counts-delivery/dev-activation'

const runAsync = promisify(execFile)
const bootstrap = readFileSync('scripts/db/admin-account-counts-1-bootstrap.sql', 'utf8')
const authority = readFileSync('lib/admin/account-counts-dev/fixtures/authority.sql', 'utf8')
const installation = composeDevAccountCountsInstallation(ADMIN_ACCOUNT_COUNTS_DEV_PROJECT).sql

test('Dev account-count installer native contract on the reported local engine', { timeout: 180_000 }, async t => {
  assertIsolatedConnectionEnvironment()
  let started = false
  try {
    const cluster = startePrivatesCluster()
    started = true
    let sequence = 0
    const execute = (database: string, sql: string) => execFileSync(cluster.psql, psqlSafeArgs(database, ['-At', '-q', '-f', '-']), {
      encoding: 'utf8', input: sql, env: cleanChildEnv(), timeout: 30_000, stdio: ['pipe','pipe','pipe'], maxBuffer: 1_048_576,
    }).trim()
    const engine = execute('postgres', "select current_setting('server_version');")
    t.diagnostic(`Observed native engine: PostgreSQL ${engine}; synthetic private socket only`)
    const fresh = () => {
      const database = `counts_dev_${++sequence}`
      execute('postgres', `create database ${database};`)
      execute(database, bootstrap)
      execute(database, `${authority}\ngrant create on database ${database} to postgres; grant create on schema public to postgres;`)
      return database
    }
    const asInstaller = (sql = installation) => `set statement_timeout='25s'; set session authorization postgres;\n${sql}`
    const absent = (database: string) => assert.equal(execute(database,
      "select (to_regnamespace('jetnity_reporting') is null and to_regprocedure('public.admin_account_counts_v1()') is null)::text;"), 'true')
    const refused = (database: string, sql = installation, pattern = /counts_dev_|already exists|permission denied/) => {
      let failure: unknown
      try { execute(database, asInstaller(sql)) } catch (error) { failure = error }
      assert.ok(failure, 'expected a refused installation')
      const stderr = (failure as { stderr?: Buffer | string }).stderr?.toString() ?? String(failure)
      assert.match(stderr, pattern)
    }

    await t.test('fresh installation and synthetic caller permissions', () => {
      const database = fresh()
      execute(database, asInstaller())
      assert.equal(execute(database, "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='jetnity_reporting';"), '1')
      assert.equal(execute(database, "select has_table_privilege('authenticated','auth.users','SELECT')::text;"), 'false')
      const rows = [
        [IDS.owner, 'owner', 'active', false, false], [IDS.moderator, 'moderator', 'active', false, false],
        [IDS.user, 'user', 'active', false, false], [IDS.banned, 'moderator', 'banned', false, false],
        [IDS.anonPriv, 'moderator', 'active', true, false], [IDS.softDel, 'moderator', 'active', false, true],
      ] as const
      for (const [id, role, status, anonymous, deleted] of rows) {
        execute(database, `insert into auth.users(id,created_at,deleted_at,is_anonymous) values ('${id}',now()-interval '1 day',${deleted ? 'now()' : 'null'},${anonymous});
          insert into public.profiles(user_id,role,status) values ('${id}','${role}','${status}');`)
      }
      const call = (id: string, aal: string, role = 'authenticated') => `begin; set local role ${role};
        select set_config('request.jwt.claims','${JSON.stringify({ sub: id, role, aal })}',true);
        select row_to_json(x) from public.admin_account_counts_v1() x; rollback;`
      const success = execute(database, call(IDS.owner, 'aal2')).split('\n').at(-1)!
      const counts = JSON.parse(success)
      assert.equal(counts.present_registered_accounts, '4')
      assert.equal(counts.created_in_prior_30_days, '4')
      for (const [id, aal, role] of [
        [IDS.owner, 'aal1', 'authenticated'], [IDS.user, 'aal2', 'authenticated'],
        [IDS.banned, 'aal2', 'authenticated'], [IDS.anonPriv, 'aal2', 'authenticated'],
        [IDS.softDel, 'aal2', 'authenticated'], [IDS.owner, 'aal2', 'anon'], [IDS.owner, 'aal2', 'service_role'],
      ]) {
        let failure: unknown
        try { execute(database, call(id, aal, role)) } catch (error) { failure = error }
        assert.ok(failure, `${id}/${aal}/${role} must be denied`)
        assert.match((failure as { stderr: Buffer }).stderr.toString(), /not authorized|permission denied/)
      }
    })

    for (const populated of [false, true]) {
      await t.test(`an ${populated ? 'installed' : 'incomplete'} entry guard blocks installation unchanged`, () => {
        const database = fresh()
        execute(database, 'create schema official_v3_guard_private;')
        if (populated) execute(database, 'create table official_v3_guard_private.sentinel(n integer); insert into official_v3_guard_private.sentinel values(42);')
        const identity = "select oid::text||':'||nspowner::text||':'||coalesce(nspacl::text,'NULL') from pg_namespace where nspname='official_v3_guard_private';"
        const before = execute(database, identity)
        refused(database, installation, /counts_dev_entry_guard_integration_required/)
        absent(database)
        assert.equal(execute(database, identity), before)
        if (populated) assert.equal(execute(database, 'select n from official_v3_guard_private.sentinel;'), '42')
      })
    }

    await t.test('temporary catalog shadows cannot change installer identity checks', () => {
      const database = fresh()
      execute(database, `create temp table pg_roles (untrusted integer);
        create temp table pg_proc (untrusted integer);
        create temp table pg_namespace (untrusted integer);
        ${asInstaller()}`)
      assert.equal(execute(database, "select (to_regprocedure('public.admin_account_counts_v1()') is not null)::text;"), 'true')
    })

    await t.test('authority changes after helper validation are detected and rolled back', () => {
      const database = fresh()
      const before = execute(database, "select pg_get_functiondef('public.rollenrang(text)'::regprocedure);")
      const boundary = '-- counts-dev-authority-validation-boundary'
      assert.equal(installation.split(boundary).length, 2)
      const fault = installation.replace(boundary, 'alter function public.rollenrang(text) volatile;')
      refused(database, fault, /counts_dev_preexisting_authority_changed/)
      absent(database)
      assert.equal(execute(database, "select pg_get_functiondef('public.rollenrang(text)'::regprocedure);"), before)
    })

    await t.test('an existing reporting schema is refused without touching its objects', () => {
      const database = fresh()
      execute(database, 'create schema jetnity_reporting; create table jetnity_reporting.sentinel(n integer); insert into jetnity_reporting.sentinel values (42);')
      refused(database)
      assert.equal(execute(database, 'select n from jetnity_reporting.sentinel;'), '42')
      assert.equal(execute(database, "select (to_regprocedure('public.admin_account_counts_v1()') is null)::text;"), 'true')
    })

    await t.test('a same-name public overload is refused and preserved', () => {
      const database = fresh()
      execute(database, 'create function public.admin_account_counts_v1(integer) returns integer language sql as $$select 42$$;')
      const before = execute(database, "select pg_get_functiondef('public.admin_account_counts_v1(integer)'::regprocedure);")
      refused(database)
      assert.equal(execute(database, "select pg_get_functiondef('public.admin_account_counts_v1(integer)'::regprocedure);"), before)
      absent(database)
    })

    await t.test('changed profile guard fails before creating any object', () => {
      const database = fresh()
      execute(database, 'create or replace function public.profil_autoritaet_integritaet_pruefen_v1() returns trigger language plpgsql as $$begin return new; end$$;')
      refused(database, installation, /counts_dev_profile_guard_changed/)
      absent(database)
    })

    await t.test('unexpected profile guard privilege is refused unchanged', () => {
      const database = fresh()
      execute(database, 'grant execute on function public.profil_autoritaet_integritaet_pruefen_v1() to authenticated;')
      refused(database, installation, /counts_dev_profile_guard_changed/)
      absent(database)
      assert.equal(execute(database, "select has_function_privilege('authenticated','public.profil_autoritaet_integritaet_pruefen_v1()','EXECUTE')::text;"), 'true')
    })

    for (const restriction of ['when-false', 'update-column']) {
      await t.test(`a restricted ${restriction} profile trigger is refused`, () => {
        const database = fresh()
        const events = restriction === 'update-column' ? 'update of status or delete' : 'update or delete'
        const condition = restriction === 'when-false' ? 'when (false)' : ''
        execute(database, `drop trigger profiles_autoritaet_integritaet_v1 on public.profiles;
          create trigger profiles_autoritaet_integritaet_v1 before ${events} on public.profiles
          for each row ${condition} execute function public.profil_autoritaet_integritaet_pruefen_v1();`)
        refused(database, installation, /counts_dev_profile_guard_changed/)
        absent(database)
      })
    }

    await t.test('changed helper return shape is refused despite an identical body', () => {
      const database = fresh()
      execute(database, `drop function public.darf_konten_verwalten();
create function public.darf_konten_verwalten() returns setof boolean language sql stable parallel safe
set search_path=pg_catalog as $function$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$function$;
alter function public.darf_konten_verwalten() owner to postgres;
revoke all on function public.darf_konten_verwalten() from public, anon, authenticated, service_role;
grant execute on function public.darf_konten_verwalten() to authenticated, service_role;`)
      refused(database, installation, /counts_dev_helper_contract_changed/)
      absent(database)
    })

    await t.test('an inherited unexpected function grant rolls back the entire package', () => {
      const database = fresh()
      execute(database, 'create role counts_extra nologin; alter default privileges for role postgres grant execute on functions to counts_extra;')
      refused(database, installation, /counts_dev_function_contract_not_exact/)
      absent(database)
    })

    for (const boundary of ['counts-dev-wrapper-boundary', 'counts-dev-verification-boundary']) {
      await t.test(`failure at ${boundary} rolls back every new object`, () => {
        const database = fresh()
        assert.equal(installation.split(`-- ${boundary}`).length, 2)
        const fault = installation.replace(`-- ${boundary}`, "raise exception 'synthetic_atomic_failure';")
        refused(database, fault, /synthetic_atomic_failure/)
        absent(database)
        execute(database, asInstaller())
        assert.equal(execute(database, "select (to_regprocedure('public.admin_account_counts_v1()') is not null)::text;"), 'true')
      })
    }

    await t.test('concurrent installers permit exactly one complete installation', async () => {
      const database = fresh()
      const invoke = () => runAsync(cluster.psql, psqlSafeArgs(database, ['-At','-q','-c',asInstaller()]), {
        encoding: 'utf8', env: cleanChildEnv(), timeout: 30_000, maxBuffer: 1_048_576,
      })
      const outcomes = await Promise.allSettled([invoke(), invoke()])
      assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1)
      const rejected = outcomes.find(outcome => outcome.status === 'rejected') as PromiseRejectedResult
      assert.match(String(rejected.reason.stderr), /counts_dev_target_not_fresh|counts_dev_install_in_progress/)
      assert.equal(execute(database, "select count(*) from pg_proc where pronamespace='jetnity_reporting'::regnamespace;"), '1')
    })
  } finally {
    const cleanup = stoppePrivatesCluster()
    if (started) assert.equal(cleanup.cleaned, true, JSON.stringify(cleanup))
  }
})
