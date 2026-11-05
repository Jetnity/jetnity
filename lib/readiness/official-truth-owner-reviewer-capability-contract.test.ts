import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const ROOT = process.cwd()
const MIGRATION_DIR = join(ROOT, 'supabase/migrations')
const MIGRATION_SUFFIX = '_official_truth_owner_reviewer_capability_1.sql'
const PG_BIN = '/usr/lib/postgresql/16/bin'

function migration() {
  const names = readdirSync(MIGRATION_DIR).filter((name) => name.endsWith(MIGRATION_SUFFIX))
  assert.equal(names.length, 1)
  assert.match(names[0]!, /^\d{14}_official_truth_owner_reviewer_capability_1\.sql$/)
  const file = names[0]!
  return { file, sql: readFileSync(join(MIGRATION_DIR, file), 'utf8') }
}

function noComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
}

type Cluster = {
  ok(sql: string): string
  fail(sql: string): string
  stop(): void
}

function cleanEnv(home: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: home }
  for (const key of Object.keys(env)) {
    if (
      key.startsWith('PG')
      || key.startsWith('SUPABASE')
      || key === 'DATABASE_URL'
      || key === 'NEXT_PUBLIC_SUPABASE_URL'
    ) {
      delete env[key]
    }
  }
  return env
}

function runPsql(
  env: NodeJS.ProcessEnv,
  socketDir: string,
  port: number,
  database: string,
  sql: string,
  expectSuccess: boolean,
): string {
  const result = spawnSync(
    join(PG_BIN, 'psql'),
    ['-X', '--no-psqlrc', '-Atq', '-h', socketDir, '-p', String(port), '-U', process.env.USER || 'ubuntu', '-d', database, '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'],
    { env, encoding: 'utf8', input: sql, maxBuffer: 8 * 1024 * 1024 },
  )
  const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  if (expectSuccess) {
    assert.equal(result.status, 0, combined)
    return (result.stdout ?? '').trim()
  }
  assert.notEqual(result.status, 0, combined)
  return combined
}

function startCluster(): Cluster {
  const root = mkdtempSync(join(tmpdir(), 'jetnity-owner-reviewer-'))
  const dataDir = join(root, 'data')
  const socketDir = join(root, 'sock')
  const home = join(root, 'home')
  const user = process.env.USER || 'ubuntu'
  const port = 55433
  const env = cleanEnv(home)
  execFileSync('mkdir', ['-p', socketDir, home])
  const initArgs = ['-D', dataDir, '--username', user, '--auth-local=trust', '--encoding=UTF8']
  try {
    execFileSync(join(PG_BIN, 'initdb'), [...initArgs, '--locale=C.UTF-8'], { env, stdio: 'ignore' })
  } catch {
    execFileSync(join(PG_BIN, 'initdb'), [...initArgs, '--no-locale'], { env, stdio: 'ignore' })
  }
  execFileSync(
    join(PG_BIN, 'pg_ctl'),
    ['-D', dataDir, '-o', `-k ${socketDir} -p ${port}`, '-l', join(root, 'postgres.log'), '-w', 'start'],
    { env, stdio: 'ignore' },
  )
  let stopped = false
  const stop = () => {
    if (!stopped) {
      stopped = true
      try {
        execFileSync(join(PG_BIN, 'pg_ctl'), ['-D', dataDir, '-m', 'immediate', 'stop'], { env, stdio: 'ignore' })
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    }
  }

  try {
    runPsql(
      env,
      socketDir,
      port,
      'postgres',
      `
      create database owner_reviewer_contract;
      `,
      true,
    )

    runPsql(
      env,
      socketDir,
      port,
      'owner_reviewer_contract',
      `
      create role anon nologin noinherit;
      create role authenticated nologin noinherit;
      create role service_role nologin noinherit;

      create or replace function public.hat_rolle_mindestens(required text)
      returns boolean
      language sql
      stable
      security invoker
      set search_path = pg_catalog
      as $fn$
        select required = 'owner'
           and coalesce(current_setting('request.jwt.claim.role', true), '') = 'owner'
      $fn$;

      create or replace function public.aktuelles_admin_aal2()
      returns boolean
      language sql
      stable
      security invoker
      set search_path = pg_catalog
      as $fn$
        select coalesce(current_setting('request.jwt.claim.aal', true), '') = 'aal2'
      $fn$;
      `,
      true,
    )
    runPsql(env, socketDir, port, 'owner_reviewer_contract', migration().sql, true)
  } catch (error) {
    stop()
    throw error
  }

  return {
    ok(sql: string) {
      return runPsql(env, socketDir, port, 'owner_reviewer_contract', sql, true)
    },
    fail(sql: string) {
      return runPsql(env, socketDir, port, 'owner_reviewer_contract', sql, false)
    },
    stop,
  }
}

test('owner reviewer capability SQL contract: invoker, AAL2 gate and minimal grants', () => {
  const { file, sql } = migration()
  const stripped = noComments(sql)
  assert.match(file, /^\d{14}_official_truth_owner_reviewer_capability_1\.sql$/)
  assert.match(stripped, /create or replace function public\.darf_official_truth_freigeben\(\)/i)
  assert.match(stripped, /security invoker/i)
  assert.doesNotMatch(stripped, /security definer/i)
  assert.match(stripped, /set search_path = pg_catalog/i)
  assert.match(stripped, /hat_rolle_mindestens\('owner'\)/i)
  assert.match(stripped, /aktuelles_admin_aal2\(\)/i)
  assert.match(stripped, /and/i)
  assert.match(stripped, /revoke all on function public\.darf_official_truth_freigeben\(\) from public, anon/i)
  assert.match(stripped, /grant execute on function public\.darf_official_truth_freigeben\(\) to authenticated, service_role/i)
  assert.doesNotMatch(stripped, /auth\.uid|break-glass|create\s+table|alter\s+table|create\s+policy|drop\s+policy/i)
})

test('owner reviewer capability: disposable PostgreSQL proof for fail-closed execution', { timeout: 120_000 }, async () => {
  const cluster = startCluster()
  try {
    const config = cluster.ok(`
      select prosecdef::text || ':' || provolatile::text || ':' || proparallel::text || ':' || (proconfig @> array['search_path=pg_catalog'])::text
      from pg_proc
      where oid = 'public.darf_official_truth_freigeben()'::regprocedure
    `)
    assert.equal(config, 'false:s:s:true')

    const acl = (role: string) => cluster.ok(`
      select has_function_privilege('${role}', 'public.darf_official_truth_freigeben()', 'EXECUTE')::text
    `)
    assert.equal(acl('anon'), 'false')
    assert.equal(acl('authenticated'), 'true')
    assert.equal(acl('service_role'), 'true')

    const denied = cluster.fail(`
      begin;
      set local role anon;
      select public.darf_official_truth_freigeben();
      commit;
    `)
    assert.match(denied, /permission denied/i)

    const run = (role: string | null, claims: Record<string, string>) => {
      const roleSql = role ? `set local role ${role};` : ''
      const claimSql = Object.entries(claims)
        .map(([key, value]) => `set local request.jwt.claim.${key} = '${value}';`)
        .join('\n')
      return cluster.ok(`
        begin;
        ${roleSql}
        ${claimSql}
        select public.darf_official_truth_freigeben()::text;
        commit;
      `)
    }

    assert.equal(run('authenticated', {}), 'false')
    assert.equal(run('authenticated', { role: 'owner' }), 'false')
    assert.equal(run('authenticated', { aal: 'aal2' }), 'false')
    assert.equal(run('authenticated', { role: 'admin', aal: 'aal2' }), 'false')
    assert.equal(run('authenticated', { role: 'owner', aal: 'aal1' }), 'false')
    assert.equal(run('authenticated', { role: 'owner', aal: 'aal2' }), 'true')
    assert.equal(run('service_role', { role: 'owner', aal: 'aal2' }), 'true')
  } finally {
    cluster.stop()
  }
})
