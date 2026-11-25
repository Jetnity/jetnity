import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { findLocalPgBins } from '../../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const stage3 = new URL('../../../scripts/db/official-truth-at-stage3/', import.meta.url)
const stage1 = new URL('../../../scripts/db/official-truth-at-source-v3/', import.meta.url)
const stage2 = new URL('../../../scripts/db/official-truth-at-stage2/', import.meta.url)
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

function fixtureSql() {
  return [
    read(new URL('native-baseline.sql', stage3)),
    v6Functions(read(new URL('production-bg1-v6.suffix.sql', stage1))),
    ownerFunction(),
    read(new URL('bmeia-theme-assets-v3.function.sql', stage1)),
    batchQualified(),
  ].join('\n')
}

const bindLiveCatalog = `UPDATE official_v3_guard_private.bg1_prod_ch_at_source_v6
 SET catalog=official_v3_guard_private.catalog_status_v1() WHERE singleton;
SELECT set_config('jetnity.at_stage3_expected_v6_catalog_digest',
 (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
  FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton), false);
`

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
  const psqlArgs = ['-X', '--no-psqlrc', '-h', socket, '-p', '5432', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1']
  return {
    bins, socket, version,
    psql(sql: string) {
      const result = spawnSync(bins.psql, psqlArgs, { input: sql, encoding: 'utf8', timeout: 90_000, maxBuffer: 8_000_000 })
      const stdout = result.stdout || ''
      const stderr = result.stderr || ''
      if (result.status !== 0) {
        const error = new Error(stderr || stdout) as Error & { stdout: string, stderr: string }
        error.stdout = stdout
        error.stderr = stderr
        throw error
      }
      return stdout + stderr
    },
    stop() {
      try { run(bins.pg_ctl, ['-D', data, '-m', 'fast', '-w', '-t', '20', 'stop']) } catch { /* already stopped */ }
      rmSync(directory, { recursive: true, force: true })
    },
  }
}

function expectSqlstate(cluster: ReturnType<typeof startCluster>, sql: string, sqlstate: string, marker: string) {
  let completed = false
  let detail = ''
  try {
    detail = cluster.psql('\\set VERBOSITY verbose\n' + sql)
    completed = true
  } catch (error) {
    const stdout = error && typeof error === 'object' && 'stdout' in error ? String(error.stdout) : ''
    const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : ''
    detail = stdout + '\n' + stderr
  }
  if (completed) throw new Error('script completed')
  const hasState = detail.includes('SQLSTATE: ' + sqlstate) || detail.includes(sqlstate + ': ' + marker)
  if (!hasState || !detail.includes(marker)) {
    throw new Error('wanted ' + sqlstate + ' / ' + marker + '\n' + detail.slice(-1800))
  }
}

function psqlCommand(cluster: ReturnType<typeof startCluster>, sql: string) {
  const args = ['-X', '--no-psqlrc', '-h', cluster.socket, '-p', '5432', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', sql]
  return new Promise<string>((resolve, reject) => {
    const child = spawn(cluster.bins.psql, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString('utf8') })
    child.stderr.on('data', (chunk: Buffer) => { output += chunk.toString('utf8') })
    child.on('exit', (code: number | null) => code === 0 ? resolve(output) : reject(new Error(output)))
  })
}

test('native PG17 Stage 3 composition, preflight, drift, withdrawal and concurrent renewal', { timeout: 180_000 }, async () => {
  const cluster = startCluster()
  try {
    assert.match(cluster.version, /PostgreSQL\) 17\./)
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

    cluster.psql(fixtureSql())
    const absent = cluster.psql(read(new URL('production-read-only-preflight.sql', stage3)))
    assert.match(absent, /AT_STAGE3_PREFLIGHT/)
    assert.match(absent, /"publication_count": null/)
    cluster.psql(`CREATE TABLE official_v3_at_production_private.ch_visa_publication_v3(id int);
      INSERT INTO official_v3_at_production_private.ch_visa_publication_v3 VALUES (1),(2);`)
    const present = cluster.psql(read(new URL('production-read-only-preflight.sql', stage3)))
    assert.match(present, /"publication_count": 2/)
    cluster.psql('DROP TABLE official_v3_at_production_private.ch_visa_publication_v3;')

    const probe = cluster.psql(bindLiveCatalog + read(new URL('production-stage3.ROLLBACK-PROBE.sql', stage3)))
    assert.match(probe, /AT_STAGE3_ROLLBACK_PROBE_CLEAN/)
    const leaked = cluster.psql(`SELECT to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NULL AS absent;`)
    assert.match(leaked, /t/)

    expectSqlstate(cluster, bindLiveCatalog +
      'CREATE TABLE official_v3_at_production_private.foreign_drift_probe(id int);\n' +
      read(new URL('production-stage3.ROLLBACK-PROBE.sql', stage3)), 'P7996', 'AT_STAGE3_V6_LIVE_CATALOG_DRIFT')
    cluster.psql('DROP TABLE official_v3_at_production_private.foreign_drift_probe;')
    expectSqlstate(cluster, `UPDATE official_v3_guard_private.bg1_prod_ch_at_source_v6
      SET catalog=official_v3_guard_private.catalog_status_v1() WHERE singleton;
      SELECT set_config('jetnity.at_stage3_expected_v6_catalog_digest','', false);\n` +
      read(new URL('production-stage3.ROLLBACK-PROBE.sql', stage3)), 'P7996', 'AT_STAGE3_V6_CATALOG_DIGEST_REQUIRES_FRESH_READBACK')
    expectSqlstate(cluster, bindLiveCatalog +
      'CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7(singleton boolean);\n' +
      read(new URL('production-stage3.ROLLBACK-PROBE.sql', stage3)), 'P7996', 'AT_STAGE3_V6_PARENT_REQUIRED')
    cluster.psql('DROP TABLE official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7;')
    expectSqlstate(cluster, `CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1()
      RETURNS jsonb LANGUAGE sql AS $tiny$ SELECT '{}'::jsonb $tiny$;\n` + bindLiveCatalog +
      read(new URL('production-stage3.ROLLBACK-PROBE.sql', stage3)), 'P7996', 'AT_STAGE3_V6_PARENT_FUNCTION_DRIFT')
    cluster.psql(v6Functions(read(new URL('production-bg1-v6.suffix.sql', stage1))))

    const committed = cluster.psql(bindLiveCatalog + read(new URL('production-stage3.COMMIT-CANDIDATE.sql', stage3)))
    assert.doesNotMatch(committed, /ERROR/)
    expectSqlstate(cluster, 'SELECT official_v3_guard_private.assert_catalog_v1();', 'P7905', 'production rolling protected catalog changed')
    const rehearsal = cluster.psql(`SET jetnity.at_stage3_withdrawal='production:qscbgcdmivbbnzrcyegn:AT-STAGE3-WITHDRAWAL';\n` +
      read(new URL('production-stage3.WITHDRAWAL-REHEARSAL.sql', stage3)))
    assert.match(rehearsal, /AT_STAGE3_WITHDRAWAL_ROLLBACK_CLEAN/)
    const held = cluster.psql('SELECT count(*) AS holds FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1;')
    assert.match(held, / 0\n/)
  } finally { cluster.stop() }

  const race = startCluster()
  try {
    race.psql(['BEGIN;',
      read(new URL('native-baseline.sql', stage3)),
      read(new URL('native-stub-guard.sql', stage3)),
      read(new URL('bmeia-theme-assets-v3.function.sql', stage1)),
      batchQualified(),
      'CREATE TEMP TABLE at_stage2_exact_predecessor(singleton boolean);',
      "SET LOCAL jetnity.at_stage3_assembler='package';",
      read(new URL('renewal-core.CANDIDATE.sql', stage2)),
      read(new URL('public-wrapper.CANDIDATE.sql', stage2)),
      read(new URL('renewal-overlay.sql', stage3)),
      'CREATE TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1(hold_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, reason text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp());',
      `CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8(singleton boolean PRIMARY KEY);
       INSERT INTO official_v3_guard_private.bg1_prod_ch_at_stage3_v8 VALUES(true);
       DO $auth$ DECLARE op text:='atsrc3_'||repeat('a',32); BEGIN
        INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(
         'atrenew3_'||repeat('b',32),op,690,82,official_v3_at_production_private.fixture_digest(690),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
       END $auth$;`,
      'COMMIT;',
    ].join('\n'))
    const same = await Promise.all([
      psqlCommand(race, `SELECT official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('b',32));`),
      psqlCommand(race, `SELECT official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('b',32));`),
    ])
    const ones = same.filter(row => /\n\s*1\n/.test(row)).length
    assert.equal(ones, 1)
    const afterSame = race.psql('SELECT count(*)::int AS facts, max(version_id)::int AS version FROM official_v3_at_production_private.ch_visa_facts_v3;')
    assert.match(afterSame, /1\s+\|\s+83/)
    race.psql(`SELECT official_v3_at_production_private.fixture_seed(691,clock_timestamp()-interval '1 minute');
      SELECT official_v3_at_production_private.fixture_seed(692,clock_timestamp()-interval '1 minute');
      INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES
       ('atrenew3_'||repeat('c',32),'atsrc3_'||repeat('a',32),691,82,official_v3_at_production_private.fixture_digest(691),2,clock_timestamp(),clock_timestamp()+interval '5 minutes'),
       ('atrenew3_'||repeat('e',32),'atsrc3_'||repeat('a',32),692,83,official_v3_at_production_private.fixture_digest(692),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');`)
    const different = await Promise.all([
      psqlCommand(race, `SELECT official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('c',32));`),
      psqlCommand(race, `SELECT official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('e',32));`),
    ])
    assert.ok(different.filter(row => /\n\s*1\n/.test(row)).length <= 1)
    const afterDifferent = race.psql('SELECT count(*)::int AS facts, max(version_id)::int AS version FROM official_v3_at_production_private.ch_visa_facts_v3;')
    assert.match(afterDifferent, /[12]\s+\|\s+8[34]/)
    race.psql(`SELECT official_v3_at_production_private.fixture_seed(693,clock_timestamp()-interval '1 minute');
      INSERT INTO official_v3_at_production_private.ch_renewal_go_v3
      SELECT 'atrenew3_'||repeat('d',32),'atsrc3_'||repeat('a',32),693,
       (SELECT max(version_id) FROM official_v3_at_production_private.ch_visa_facts_v3),
       official_v3_at_production_private.fixture_digest(692),2,clock_timestamp(),clock_timestamp()+interval '5 minutes';`)
    const [renewed, withdrawn] = await Promise.all([
      psqlCommand(race, `SELECT official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('d',32));`),
      psqlCommand(race, `SET jetnity.at_stage3_withdrawal='production:qscbgcdmivbbnzrcyegn:AT-STAGE3-WITHDRAWAL';\n` +
        read(new URL('production-stage3.WITHDRAWAL.sql', stage3))),
    ])
    assert.doesNotMatch(renewed + withdrawn, /deadlock detected/)
    const afterRace = race.psql(`SELECT count(*)::int AS holds FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1;
      SELECT official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('d',32));`)
    assert.match(afterRace, /1\n/)
    assert.match(afterRace, /\n\s*0\n/)
    const versions = race.psql(`SELECT (count(*)::int = count(DISTINCT version_id)::int AND max(version_id) = 82 + count(*)::int) AS monotonic
      FROM official_v3_at_production_private.ch_visa_facts_v3;`)
    assert.match(versions, /\n\s*t\n/)
  } finally { race.stop() }
})
