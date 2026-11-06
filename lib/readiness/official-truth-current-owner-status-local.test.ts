// Diagnostic evidence for #1139, not an authorization acceptance test.
// A green result reproduces a KNOWN P1 / RELEASE NO-GO in unchanged helpers.
// No Supabase project, real JWT, Auth account, remote DB or runtime change.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { findLocalPgBins, startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const MIGRATIONS = join(process.cwd(), 'supabase/migrations')
const ROLE_FILE = '20260817100000_rollenmodell.sql'
const PROFILE_FILE = '20260817120300_generisches_profil.sql'
const AAL2_FILE = '20260827170000_admin_aal2_data_plane_alignment.sql'
const OFFICIAL_FILE = '20261002154952_official_truth_owner_reviewer_capability_1.sql'
const FUNCTIONS = [
  { name: 'rollenrang', args: 'rolle text', file: ROLE_FILE },
  { name: 'aktuelle_rolle', args: '', file: PROFILE_FILE },
  { name: 'hat_rolle_mindestens', args: 'minimum text', file: ROLE_FILE },
  { name: 'aktuelles_admin_aal2', args: '', file: AAL2_FILE },
  { name: 'darf_official_truth_freigeben', args: '', file: OFFICIAL_FILE },
] as const
const STATUSES = ['active', 'pending', 'disabled', 'banned'] as const
const OWNER = '11111111-1111-4111-8111-111111111111'
const ADMIN = '22222222-2222-4222-8222-222222222222'
const ORDINARY = '33333333-3333-4333-8333-333333333333'
const MISSING = '44444444-4444-4444-8444-444444444444'
const UNBOUND_SESSION = '55555555-5555-4555-8555-555555555555'
const migration = (name: string) => readFileSync(join(MIGRATIONS, name), 'utf8')

/** Conservative source-selection guard, NOT a SQL interpreter or ACL replay. */
function assertCurrentDefinitions(): void {
  const files = readdirSync(MIGRATIONS).filter(name => name.endsWith('.sql')).sort()
  assert.ok(files.length > 0, 'canonical migration inventory missing')
  const sources = files.map(file => {
    assert.match(file, /^\d{14}_[a-z0-9_]+\.sql$/i, 'unrecognized migration needs review')
    const sql = migration(file).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\r\n]*/g, ' ')
    return { file, sql }
  })
  for (const target of FUNCTIONS) {
    // Quoted/unqualified forms and any overload of the same name also require
    // re-review. Arbitrarily constructed dynamic SQL is outside this guard.
    const identifier = `(?:(?:public|"public")\\s*\\.\\s*)?(?:${target.name}|"${target.name}")\\s*\\(`
    const definitions = sources.flatMap(({ file, sql }) =>
      [...sql.matchAll(new RegExp(`\\bcreate\\s+(?:or\\s+replace\\s+)?function\\s+${identifier}`, 'gi'))]
        .map(() => file))
    assert.equal(definitions.at(-1), target.file,
      target.name + ': selected definition is no longer current; update the proof after review')
    assert.equal(definitions.filter(file => file === target.file).length, 1,
      target.name + ': unexpected overload or duplicate definition')
    for (const { file, sql } of sources.filter(source => source.file > target.file)) {
      assert.doesNotMatch(sql,
        new RegExp(`\\b(?:alter|drop)\\s+function\\b[^;]*${identifier}`, 'i'),
        target.name + ': later function mutation in ' + file + ' requires review')
    }
  }
}

/** Extract unchanged canonical DDL, without rewriting the selected body. */
function exactFunction(source: string, name: string, args: string): string {
  const marker = 'create or replace function public.' + name + '(' + args + ')'
  const from = source.indexOf(marker)
  assert.ok(from >= 0, 'missing canonical function: ' + marker)
  assert.equal(source.indexOf(marker, from + marker.length), -1, 'ambiguous canonical function')
  const delimiter = source.indexOf('as $$', from)
  const end = source.indexOf('$$;', delimiter + 'as $$'.length)
  assert.ok(delimiter > from && end > delimiter, 'canonical function delimiter changed')
  return source.slice(from, end + 3)
}

function exactGrants(source: string, first: string, last: string): string {
  const from = source.indexOf(first)
  const end = source.indexOf(last, from)
  assert.ok(from >= 0 && end > from, 'selected source grants changed')
  return source.slice(from, end + last.length)
}

function exactStatusConstraint(): string {
  const source = migration(PROFILE_FILE)
  const matches = [...source.matchAll(/alter table public\.profiles\s+add constraint profiles_status_check\s+check\s*\([\s\S]*?\);/gi)]
  assert.equal(matches.length, 1, 'current profile status constraint changed')
  const ddl = matches[0]![0]
  assert.deepEqual([...ddl.matchAll(/'([a-z]+)'::text/g)].map(match => match[1]), [...STATUSES])
  return ddl
}

test('Official Truth current-owner diagnostic: source selection includes final profiles override', () => {
  assertCurrentDefinitions()
  exactStatusConstraint()
  for (const target of FUNCTIONS) exactFunction(migration(target.file), target.name, target.args)
})

const bins = findLocalPgBins()

test('Official Truth current-owner native diagnostic: KNOWN status/session GAP — RELEASE NO-GO',
  { skip: bins ? false : 'native PostgreSQL unavailable; no native proof or authorization PASS', timeout: 120_000 }, t => {
    assertCurrentDefinitions()
    const cluster = startLocalProofCluster()
    const sql = (statement: string): string => execFileSync(bins!.psql,
      ['-X', '--no-psqlrc', '-Atq', '-h', cluster.socket, '-p', String(cluster.port),
        '-U', cluster.user, '-d', cluster.database, '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'],
      { input: statement, encoding: 'utf8', stdio: 'pipe', timeout: 30_000, maxBuffer: 1_048_576 },
    ).trim()
    const expectSqlState = (statement: string, state: string): void => {
      let failure: unknown
      try { sql(statement) } catch (error) { failure = error }
      assert.ok(failure, 'expected PostgreSQL rejection: ' + state)
      const stderr = String((failure as { stderr?: unknown }).stderr ?? '')
      assert.match(stderr, new RegExp('\\b' + state + '\\b'))
    }

    try {
      // Only these local roles/auth helpers/minimal profiles are synthetic.
      // No auth.users/auth.sessions table, signed-token validation, FK/delete
      // behavior or complete migrated profile policy is reproduced here.
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
        create table public.profiles (
          user_id uuid primary key,
          role text not null,
          status text not null
        );
        alter table public.profiles enable row level security;
        revoke all on public.profiles from public, anon, authenticated, service_role;
      `)
      sql(exactStatusConstraint())
      for (const target of FUNCTIONS) {
        sql(exactFunction(migration(target.file), target.name, target.args))
      }
      // Fixture role validity follows the actual source rollenrang(), as the
      // real role constraint does. It is not another runtime role authority.
      sql(`alter table public.profiles add constraint profiles_role_check
        check (public.rollenrang(role) is not null);
        insert into public.profiles(user_id, role, status) values
          ('${OWNER}', 'owner', 'active'),
          ('${ADMIN}', 'admin', 'active'),
          ('${ORDINARY}', 'user', 'active');`)
      sql(exactGrants(migration(ROLE_FILE),
        'revoke all on function public.rollenrang(text) from public;',
        'grant execute on function public.hat_rolle_mindestens(text) to authenticated, service_role;'))
      sql(exactGrants(migration(AAL2_FILE),
        'revoke all on function public.aktuelles_admin_aal2() from public, anon;',
        'grant execute on function public.aktuelles_admin_aal2() to authenticated, service_role;'))
      sql(exactGrants(migration(OFFICIAL_FILE),
        'revoke all on function public.darf_official_truth_freigeben() from public, anon;',
        'grant execute on function public.darf_official_truth_freigeben() to authenticated, service_role;'))

      const check = (claims: Readonly<Record<string, unknown>>): boolean => {
        const json = JSON.stringify(claims).replaceAll("'", "''")
        const result = sql(`begin; set local role authenticated;
          set local request.jwt.claims = '${json}';
          select public.darf_official_truth_freigeben()::text; commit;`)
        assert.ok(result === 'true' || result === 'false', 'capability must return a boolean')
        return result === 'true'
      }
      const sameClaims = Object.freeze({ sub: OWNER, aal: 'aal2', session_id: UNBOUND_SESSION })
      const statusResults = STATUSES.map(status => {
        sql(`update public.profiles set status = '${status}' where user_id = '${OWNER}'`)
        return { status, allowed: check(sameClaims) }
      })
      // This deliberately observes the EXISTING defect, not the desired
      // authorization policy. A future fix must update this diagnostic after
      // review; true for a blocked status must never become an acceptance gate.
      assert.deepEqual(statusResults, STATUSES.map(status => ({ status, allowed: true })))
      for (const status of ['active', 'disabled', 'active'] as const) {
        sql(`update public.profiles set status = '${status}' where user_id = '${OWNER}'`)
        assert.equal(check(sameClaims), true, 'diagnostic: unchanged synthetic claims ignore ' + status)
      }
      t.diagnostic('KNOWN P1 / RELEASE NO-GO: unchanged current helpers admit Owner+AAL2 for ' +
        JSON.stringify(statusResults) + '; no secure-authorization PASS')

      // Invalid statuses are rejected by real CHECK / NOT NULL semantics;
      // they are never passed off as valid blocked-account fixture rows.
      expectSqlState(`update public.profiles set status = null where user_id = '${OWNER}'`, '23502')
      expectSqlState(`update public.profiles set status = 'unknown' where user_id = '${OWNER}'`, '23514')
      assert.equal(sql(`select status from public.profiles where user_id = '${OWNER}'`), 'active')

      assert.equal(check({ sub: ADMIN, aal: 'aal2' }), false)
      assert.equal(check({ sub: ORDINARY, aal: 'aal2' }), false)
      assert.equal(check({ sub: MISSING, aal: 'aal2' }), false)
      assert.equal(check({ aal: 'aal2' }), false)
      assert.equal(check({ sub: OWNER, aal: 'aal1' }), false)
      assert.equal(check({ sub: OWNER }), false)
      assert.equal(check({ sub: OWNER, aal: 'unknown' }), false)
      assert.equal(check({ sub: ADMIN, aal: 'aal2', role: 'owner',
        user_metadata: { role: 'owner' }, app_metadata: { role: 'owner' } }), false)
      assert.equal(check({ sub: OWNER, aal: 'aal1',
        user_metadata: { aal: 'aal2' }, app_metadata: { aal: 'aal2' } }), false)

      assert.equal(sql(`select (to_regclass('auth.sessions') is null)::text`), 'true')
      assert.equal(check({ sub: OWNER, aal: 'aal2' }), true)
      assert.equal(check(sameClaims), true)
      assert.equal(check({ sub: OWNER, aal: 'aal2', session_id: 'not-a-session-id' }), true)
      t.diagnostic('KNOWN GAP: missing/unbound session_id is ignored with synthetic claims; ' +
        'auth.sessions is absent. No signed/revoked JWT or hosted session behavior was tested.')

      assert.equal(sql(`select prosecdef::text from pg_proc where
        oid = 'public.darf_official_truth_freigeben()'::regprocedure`), 'false')
      assert.equal(sql(`select
        has_function_privilege('anon', 'public.darf_official_truth_freigeben()', 'EXECUTE')::text || ',' ||
        has_function_privilege('authenticated', 'public.darf_official_truth_freigeben()', 'EXECUTE')::text || ',' ||
        has_table_privilege('authenticated', 'public.profiles', 'SELECT')::text`), 'false,true,false')
      expectSqlState('set role anon; select public.darf_official_truth_freigeben()', '42501')
      expectSqlState('set role authenticated; select role, status from public.profiles', '42501')
    } finally {
      cluster.stop()
    }
  },
)
