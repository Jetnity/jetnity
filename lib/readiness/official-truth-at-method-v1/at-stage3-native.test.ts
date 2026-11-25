import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { spawn } from 'node:child_process'
import { findLocalPgBins } from '../../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const stage3 = new URL('../../../scripts/db/official-truth-at-stage3/', import.meta.url)
const stage1 = new URL('../../../scripts/db/official-truth-at-source-v3/', import.meta.url)
const read = (url: URL) => readFileSync(url, 'utf8')

function v6Functions(sql: string) {
  return [...sql.matchAll(/CREATE OR REPLACE FUNCTION /g)].map(match => {
    const marker = sql.indexOf('AS $function$', match.index ?? 0)
    const close = sql.indexOf('$function$', marker + 'AS $function$'.length)
    const end = sql.indexOf(';', close)
    return sql.slice(match.index ?? 0, end + 1)
  }).join('\n')
}

function ownerFunction() {
  const owner = read(new URL('../../../scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql', import.meta.url))
  const start = owner.indexOf('create function jetnity_ot_auth.require_current_owner_session_v1()')
  const end = owner.indexOf('end $$;', start)
  assert.ok(start >= 0 && end > start)
  return owner.slice(start, end + 'end $$;'.length)
}

function batchQualified() {
  const source = read(new URL('production-stufe1.candidate.sql', stage1))
  const start = source.indexOf('CREATE FUNCTION official_v3_at_production_private.batch_qualified_ch_v3(')
  const end = source.indexOf('END $verified$;', start)
  assert.ok(start >= 0 && end > start)
  return source.slice(start, end + 'END $verified$;'.length)
}

function packagePrefix() {
  const body = read(new URL('production-stage3.PACKAGE-BODY.sql', stage3))
  const cut = body.indexOf('DO $stage3_historical_chain$')
  assert.ok(cut > 0)
  return body.slice(0, cut)
}

const settings = `SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='8s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.at_stage3_assembler='package';
`

function parentSql() {
  return [
    read(new URL('native-baseline.sql', stage3)),
    v6Functions(read(new URL('production-bg1-v6.suffix.sql', stage1))),
    ownerFunction(),
    read(new URL('bmeia-theme-assets-v3.function.sql', stage1)),
    batchQualified(),
    settings,
  ].join('\n')
}

function startCluster() {
  const bins = findLocalPgBins()
  if (!bins) throw new Error('local_postgresql_not_available')
  const directory = mkdtempSync(join(tmpdir(), 'at-stage3-'))
  const data = join(directory, 'data')
  const socket = join(directory, 'socket')
  mkdirSync(socket, { mode: 0o700 })
  const env = { ...process.env }
  for (const key of Object.keys(env)) if (/^(PG|PSQL)/.test(key)) delete env[key]
  const run = (file: string, args: string[], timeout = 60_000) => execFileSync(file, args, { env, encoding: 'utf8', timeout })
  run(bins.initdb, ['-D', data, '--no-locale', '--encoding=UTF8', '--auth-local=trust', '--auth-host=reject', '--username', 'postgres', '--no-sync'])
  writeFileSync(join(data, 'postgresql.auto.conf'), [`listen_addresses = ''`, `unix_socket_directories = '${socket.replaceAll("'", "''")}'`, 'port = 5432', "timezone = 'UTC'", 'log_statement = none'].join('\n'))
  run(bins.pg_ctl, ['-D', data, '-l', join(directory, 'postgres.log'), '-w', '-t', '30', 'start'])
  const version = run(bins.postgres, ['--version']).trim()
  return {
    bins, socket, version,
    psql(sql: string) {
      return execFileSync(bins.psql, ['-X', '--no-psqlrc', '-h', socket, '-p', '5432', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], {
        input: sql, encoding: 'utf8', timeout: 60_000, maxBuffer: 8_000_000,
      })
    },
    stop() {
      try { run(bins.pg_ctl, ['-D', data, '-m', 'fast', '-w', '-t', '20', 'stop']) } catch { /* cluster already stopped */ }
      rmSync(directory, { recursive: true, force: true })
    },
  }
}

function expectFailure(cluster: ReturnType<typeof startCluster>, sql: string, code: string) {
  try {
    const output = cluster.psql(sql)
    assert.fail('expected ' + code + ' but the script finished: ' + output.slice(-300))
  } catch (error) {
    const text = `${error instanceof Error ? error.message : ''}\n${error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : ''}`
    assert.match(text, new RegExp(code))
  }
}

test('native PG17 Stage 3 successor, renewal rules, fail-closed catalog and rollback', { timeout: 120_000 }, async () => {
  const cluster = startCluster()
  try {
    assert.match(cluster.version, /PostgreSQL\) 17\./)
    const stage2 = new URL('../../../scripts/db/official-truth-at-stage2/', import.meta.url)
    const renewal = cluster.psql(['BEGIN;',
      read(new URL('native-baseline.sql', stage3)),
      read(new URL('native-stub-guard.sql', stage3)),
      read(new URL('bmeia-theme-assets-v3.function.sql', stage1)),
      batchQualified(),
      'CREATE TEMP TABLE at_stage2_exact_predecessor(singleton boolean);',
      "SET LOCAL jetnity.at_stage3_assembler='package';",
      read(new URL('renewal-core.CANDIDATE.sql', stage2)),
      read(new URL('public-wrapper.CANDIDATE.sql', stage2)),
      read(new URL('renewal-overlay.sql', stage3)),
      read(new URL('native-renewal.sql', stage3)),
      'ROLLBACK;',
    ].join('\n'))
    assert.match(renewal, /AT_STAGE3_RENEWAL_RULES_PASS/)
    const prefix = packagePrefix()
    const applied = cluster.psql(['BEGIN;', parentSql(), prefix, read(new URL('native-security.sql', stage3)), 'ROLLBACK;',
      `DO $clean$ BEGIN
        IF to_regnamespace('official_v3_at_production_private') IS NOT NULL
        OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NOT NULL
        THEN RAISE EXCEPTION 'AT_STAGE3_ROLLBACK_LEAK'; END IF; END $clean$;
       SELECT 'AT_STAGE3_ROLLBACK_PASS' AS proof;`].join('\n'))
    assert.match(applied, /AT_STAGE3_PACKAGE_PREFIX_APPLIED/)
    assert.match(applied, /AT_STAGE3_REAL_GUARD_BLOCKS_SYNTHETIC_RENEWAL/)
    assert.match(applied, /AT_STAGE3_ROLLBACK_PASS/)
    expectFailure(cluster, ['BEGIN;', parentSql(), read(new URL('production-stage3.PACKAGE-BODY.sql', stage3)), 'ROLLBACK;'].join('\n'), 'production rolling protected catalog changed|42P01')
    expectFailure(cluster, ['BEGIN;', parentSql(), "SELECT set_config('jetnity.at_stage3_expected_v6_catalog_digest','',true);", prefix].join('\n'), 'AT_STAGE3_V6_CATALOG_DIGEST_REQUIRES_FRESH_READBACK')
    expectFailure(cluster, ['BEGIN;', parentSql(), 'CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7(singleton boolean);', prefix].join('\n'), 'AT_STAGE3_V6_PARENT_REQUIRED')
    expectFailure(cluster, ['BEGIN;', parentSql(), `CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1() RETURNS jsonb LANGUAGE sql AS $f$ SELECT '{}'::jsonb $f$;`, prefix].join('\n'), 'AT_STAGE3_V6_PARENT_FUNCTION_DRIFT')
    const holder = spawn(cluster.bins.psql, ['-X', '--no-psqlrc', '-h', cluster.socket, '-p', '5432', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { stdio: ['pipe', 'pipe', 'pipe'] })
    holder.stdin.write('BEGIN; SELECT pg_advisory_lock(771112,34); SELECT pg_sleep(2); COMMIT;\n')
    holder.stdin.end()
    await new Promise(resolve => setTimeout(resolve, 300))
    const blocked = cluster.psql("BEGIN; SELECT pg_try_advisory_xact_lock(771112,34) AS got; ROLLBACK;")
    assert.match(blocked, / f\n/)
    await new Promise((resolve, reject) => holder.on('exit', code => code === 0 ? resolve(code) : reject(new Error('lock holder exit ' + code))))
    const free = cluster.psql("BEGIN; SELECT pg_try_advisory_xact_lock(771112,34) AS got; ROLLBACK;")
    assert.match(free, / t\n/)
  } finally { cluster.stop() }
})
