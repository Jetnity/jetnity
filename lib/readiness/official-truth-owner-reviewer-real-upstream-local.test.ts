import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { findLocalPgBins, startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const MIGRATIONS = join(process.cwd(), 'supabase/migrations')
const ROLE_FILE = '20260817100000_rollenmodell.sql'
const AAL2_FILE = '20260827170000_admin_aal2_data_plane_alignment.sql'
const OFFICIAL_FILE = '20261002154952_official_truth_owner_reviewer_capability_1.sql'
const OWNER = '11111111-1111-4111-8111-111111111111'
const ADMIN = '22222222-2222-4222-8222-222222222222'
const ORDINARY = '33333333-3333-4333-8333-333333333333'

/** Extract original production function DDL; never rewrite actual helpers. */
function exactFunction(sql: string, name: string, args: string): string {
  const marker = 'create or replace function public.' + name + '(' + args + ')'
  const first = sql.indexOf(marker)
  assert(first >= 0, 'missing canonical function: ' + marker)
  assert.equal(sql.indexOf(marker, first + marker.length), -1, 'ambiguous function')
  const delimiter = sql.indexOf('as $$', first)
  assert(delimiter > first, 'body delimiter missing')
  const end = sql.indexOf('$$;', delimiter + 'as $$'.length)
  assert(end > delimiter, 'function ending missing')
  const statement = sql.slice(first, end + 3)
  assert.match(statement, /set search_path = /i)
  return statement
}
function exactGrants(sql: string, begin: string, last: string): string {
  const from = sql.indexOf(begin), end = sql.indexOf(last, from)
  assert(from >= 0 && end > from, 'canonical grant set changed')
  return sql.slice(from, end + last.length)
}
const migration = (filename: string) => readFileSync(join(MIGRATIONS, filename), 'utf8')
const bins = findLocalPgBins()

test('Owner/AAL2: source-defined SQL helpers in a disconnected disposable PG cluster',
  { skip: !bins, timeout: 120_000 }, () => {
    const roles = migration(ROLE_FILE)
    const aal2 = migration(AAL2_FILE)
    const official = migration(OFFICIAL_FILE)
    const cluster = startLocalProofCluster()
    const sql = (statement: string) => execFileSync(bins!.psql,
      ['-X', '--no-psqlrc', '-Atq', '-h', cluster.socket, '-p', String(cluster.port),
        '-U', cluster.user, '-d', cluster.database, '-v', 'ON_ERROR_STOP=1'],
      { input: statement, encoding: 'utf8', timeout: 30_000, maxBuffer: 1_048_576 },
    ).trim()
    try {
      // Only the minimal auth.jwt / auth.uid helpers and profile table are
      // synthetic. These do NOT prove a Supabase-signed JWT or hosted parity.
      sql(`
        create role anon nologin noinherit;
        create role authenticated nologin noinherit;
        create role service_role nologin noinherit bypassrls;
        create schema auth;
        grant usage on schema auth to authenticated, service_role;
        grant usage on schema public to anon, authenticated, service_role;
        create function auth.jwt() returns jsonb language sql stable
          set search_path = pg_catalog as $auth$
          select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
          $auth$;
        create function auth.uid() returns uuid language sql stable
          set search_path = pg_catalog as $auth$
          select nullif(auth.jwt()->>'sub','')::uuid
          $auth$;
        create table public.creator_profiles(user_id uuid primary key, role text not null);
        insert into public.creator_profiles(user_id, role)
          values ('${OWNER}','owner'),('${ADMIN}','admin'),('${ORDINARY}','user');
        alter table public.creator_profiles enable row level security;
        revoke all on public.creator_profiles from public,anon,authenticated,service_role;
      `)

      for (const ddl of [
        exactFunction(roles, 'rollenrang', 'rolle text'),
        exactFunction(roles, 'aktuelle_rolle', ''),
        exactFunction(roles, 'hat_rolle_mindestens', 'minimum text'),
      ]) sql(ddl)
      sql(exactGrants(roles,
        'revoke all on function public.rollenrang(text) from public;',
        'grant execute on function public.hat_rolle_mindestens(text) to authenticated, service_role;'))
      sql(exactFunction(aal2, 'aktuelles_admin_aal2', ''))
      sql(exactGrants(aal2,
        'revoke all on function public.aktuelles_admin_aal2() from public, anon;',
        'grant execute on function public.aktuelles_admin_aal2() to authenticated, service_role;'))
      // Exactly the source-controlled capability migration, applied only here.
      sql(official)

      assert.equal(sql(`select prosecdef::text || ':' || provolatile::text || ':' ||
        proparallel::text || ':' || (proconfig @> array['search_path=pg_catalog'])::text
        from pg_proc where oid = 'public.darf_official_truth_freigeben()'::regprocedure`),
      'false:s:s:true')
      assert.equal(sql(`select prosecdef::text from pg_proc where
        oid = 'public.aktuelle_rolle()'::regprocedure`), 'true')
      assert.equal(sql(`select prosecdef::text from pg_proc where
        oid = 'public.hat_rolle_mindestens(text)'::regprocedure`), 'true')
      assert.equal(sql(`select prosecdef::text from pg_proc where
        oid = 'public.aktuelles_admin_aal2()'::regprocedure`), 'false')
      assert.equal(sql(`select
        has_function_privilege('anon','public.darf_official_truth_freigeben()','EXECUTE')::text || ',' ||
        has_function_privilege('authenticated','public.darf_official_truth_freigeben()','EXECUTE')::text || ',' ||
        has_function_privilege('service_role','public.darf_official_truth_freigeben()','EXECUTE')::text || ',' ||
        has_table_privilege('authenticated','public.creator_profiles','SELECT')::text`),
        'false,true,true,false')

      const check = (claims: Record<string, unknown>, role: 'authenticated' | 'service_role' = 'authenticated') => {
        const jwt = JSON.stringify(claims).replaceAll("'", "''")
        return sql(`begin; set local role ${role};
          set local request.jwt.claims = '${jwt}';
          select public.darf_official_truth_freigeben()::text; commit;`)
      }
      assert.equal(check({ sub: OWNER, aal: 'aal2' }), 'true')
      assert.equal(check({ sub: OWNER, aal: 'aal1' }), 'false')
      assert.equal(check({ sub: OWNER, aal: 'unknown' }), 'false')
      assert.equal(check({ sub: OWNER }), 'false')
      assert.equal(check({ sub: ADMIN, aal: 'aal2' }), 'false')
      assert.equal(check({ sub: ORDINARY, aal: 'aal2' }), 'false')
      assert.equal(check({ aal: 'aal2' }), 'false')
      assert.equal(check({ sub: '44444444-4444-4444-8444-444444444444', aal: 'aal2' }), 'false')
      assert.equal(check({ sub: ADMIN, aal: 'aal2', role: 'owner', user_metadata: { role: 'owner' } }), 'false')
      assert.equal(check({ sub: ADMIN, aal: 'aal2', app_metadata: { role: 'owner' } }), 'false')
      assert.equal(check({ sub: OWNER, aal: 'aal2' }, 'service_role'), 'true')
      assert.equal(check({ aal: 'aal2' }, 'service_role'), 'false')

      assert.throws(() => sql(`begin; set local role anon;
        select public.darf_official_truth_freigeben(); commit;`), /permission denied/i)
      assert.throws(() => sql(`begin; set local role authenticated;
        set local request.jwt.claims = '{"sub":"${OWNER}","aal":"aal2"}';
        select role from public.creator_profiles; commit;`), /permission denied/i)
    } finally {
      cluster.stop()
    }
  },
)
