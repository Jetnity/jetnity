// Genuine LOCAL PostgreSQL proof through the existing owned psql toolchain.
// This test cannot import the protected application "pg" transport.
// All subprocesses are awaited before the owned cluster is stopped.
import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { findLocalPgBins, startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { readWeatherQuota } from './quota-contract'

test('weather quotas are atomic across independent database sessions', { timeout: 120000 }, async () => {
  const cluster = startLocalProofCluster()
  const bins = findLocalPgBins()
  assert.ok(bins, 'the owned local PostgreSQL toolchain is required')
  const env = { ...process.env }
  for (const key of Object.keys(env)) if (/^(PG|PSQL)/.test(key)) delete env[key]
  const args = ['-X', '-q', '-A', '-t', '-w', '-v', 'ON_ERROR_STOP=1',
    '-h', cluster.socket, '-p', String(cluster.port), '-U', cluster.user, '-d', cluster.database]
  const exec = (sql: string) => execFileSync(bins.psql, [...args, '-c', sql], {
    env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 25000, maxBuffer: 1048576,
  })
  const inflight = new Set<Promise<string>>()
  const query = (sql: string): Promise<string> => {
    const task = new Promise<string>((resolve, reject) => {
      const child = spawn(bins.psql, [...args, '-c', sql], { env, stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = '', stderr = '', finished = false
      const settle = (error?: Error) => {
        if (finished) return
        finished = true
        if (error) reject(error)
        else resolve(stdout)
      }
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      child.stdout.on('data', (chunk: string) => { stdout += chunk; if (stdout.length > 131072) child.kill() })
      child.stderr.on('data', (chunk: string) => { stderr += chunk; if (stderr.length > 131072) child.kill() })
      child.on('error', () => settle(new Error('owned_local_psql_spawn_failed')))
      child.on('close', code => {
        if (code !== 0) settle(new Error(stderr.slice(0, 2048) || 'owned_local_psql_failed'))
        else settle()
      })
    })
    inflight.add(task)
    void task.then(() => inflight.delete(task), () => inflight.delete(task))
    return task
  }
  const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-111111111111'
  const claims = (n: number) => ({ sub: uid(n), session_id: uid(n + 1000),
    role: 'authenticated', is_anonymous: false, exp: Math.floor(Date.now() / 1000) + 600 })
  const reserve = async (n: number, overrides: Record<string, unknown> = {}) => {
    const json = JSON.stringify({ ...claims(n), ...overrides }).replaceAll("'", "''")
    const sql = 'BEGIN; SET LOCAL ROLE authenticated;\n' +
      "SELECT set_config('request.jwt.claims','" + json + "',true);\n" +
      'SELECT public.reisewetter_reservieren_v1()::text;\nCOMMIT;'
    const output = await query(sql)
    const value = output.split(/\r?\n/).map(line => line.trim())
      .filter(line => line.startsWith('{') && line.includes('"allowed"')).at(-1)
    const parsed = readWeatherQuota(value ? JSON.parse(value) : null)
    assert.ok(parsed, 'only a canonical database acknowledgement is accepted')
    return parsed
  }
  try {
    assert.match(cluster.version, /PostgreSQL\) (?:15|16|17)\./)
    exec([
      'CREATE ROLE postgres SUPERUSER; CREATE ROLE authenticated NOLOGIN; CREATE ROLE anon NOLOGIN;',
      'CREATE ROLE service_role NOLOGIN; CREATE SCHEMA auth;',
      'CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean NOT NULL DEFAULT false,banned_until timestamptz,deleted_at timestamptz);',
      'CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id),not_after timestamptz);',
      "CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;",
      "CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT (auth.jwt()->>'sub')::uuid $$;",
      'GRANT USAGE ON SCHEMA auth TO authenticated,anon;',
      'CREATE SCHEMA official_v3_guard_private; CREATE TABLE official_v3_guard_private.fixture_state(open boolean NOT NULL);',
      'INSERT INTO official_v3_guard_private.fixture_state VALUES(true);',
      "CREATE FUNCTION official_v3_guard_private.require_open_v1() RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF NOT (SELECT open FROM official_v3_guard_private.fixture_state) THEN RAISE EXCEPTION 'synthetic guard closed'; END IF; END $$;",
    ].join('\n'))
    const users = Array.from({ length: 80 }, (_, i) => '(' + "'" + uid(i + 1) + "'" + ')').join(',')
    const sessions = Array.from({ length: 80 }, (_, i) => "('" + uid(i + 1001) + "','" + uid(i + 1) + "')").join(',')
    exec('INSERT INTO auth.users(id) VALUES ' + users + ';\nINSERT INTO auth.sessions(id,user_id) VALUES ' + sessions)
    const sql = readFileSync(new URL('../../scripts/db/reisewetter-global-1/quota-candidate.sql', import.meta.url), 'utf8')
    exec('BEGIN; SET LOCAL ROLE postgres;\n' + sql + '\nCOMMIT;')
    for (let n = 0; n < 10; n++) assert.equal((await reserve(1)).allowed, true)
    assert.deepEqual(await reserve(1), { allowed: false, retryAfterSec: 60 })
    exec('TRUNCATE jetnity_weather_private.reservations_v1')
    const results: Awaited<ReturnType<typeof reserve>>[] = []
    // Independent processes/sessions: settle every child even if one fails.
    for (let start = 2; start < 62; start += 12) {
      const batch = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => reserve(start + i)))
      for (const item of batch) {
        if (item.status === 'rejected') throw item.reason
        results.push(item.value)
      }
    }
    assert.equal(results.filter(x => x.allowed).length, 45)
    assert.equal(Number(exec('SELECT count(*) FROM jetnity_weather_private.reservations_v1').trim()), 45)
    assert.deepEqual(await reserve(79), { allowed: false, retryAfterSec: 60 })
    exec('TRUNCATE jetnity_weather_private.reservations_v1')
    exec("INSERT INTO jetnity_weather_private.reservations_v1(actor,reserved_at) SELECT '" +
      uid(1) + "'::uuid,clock_timestamp()-interval '2 minutes' FROM generate_series(1,1000)")
    assert.deepEqual(await reserve(79), { allowed: false, retryAfterSec: 86400 })
    exec('TRUNCATE jetnity_weather_private.reservations_v1')
    await assert.rejects(reserve(79, { exp: 1 }), /weather admission unavailable/)
    await assert.rejects(reserve(79, { session_id: uid(2) }), /weather admission unavailable/)
    exec("UPDATE auth.users SET is_anonymous=true WHERE id='" + uid(79) + "'")
    await assert.rejects(reserve(79), /weather admission unavailable/)
    exec("UPDATE auth.users SET is_anonymous=false WHERE id='" + uid(79) + "'")
    exec('UPDATE official_v3_guard_private.fixture_state SET open=false')
    await assert.rejects(reserve(79), /synthetic guard closed/)
    assert.equal(Number(exec('SELECT count(*) FROM jetnity_weather_private.reservations_v1').trim()), 0)
    const permissions = JSON.parse(exec([
      "SELECT json_build_object('anon',has_function_privilege('anon','public.reisewetter_reservieren_v1()','EXECUTE'),",
      "'service',has_function_privilege('service_role','public.reisewetter_reservieren_v1()','EXECUTE'),",
      "'table_access',has_table_privilege('authenticated','jetnity_weather_private.reservations_v1','SELECT,INSERT,UPDATE,DELETE,TRUNCATE'))::text",
    ].join(' ')))
    assert.deepEqual(permissions, { anon: false, service: false, table_access: false })
  } finally {
    // Drain every spawned process/connection before stopping its server.
    await Promise.allSettled([...inflight])
    cluster.stop()
  }
})
