import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { v6Pins } from '../../../scripts/db/official-truth-at-stage3/assemble.mjs'
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
    tuples(sql: string) {
      const result = spawnSync(bins.psql, [...psqlArgs, '-q', '-t', '-A'], { input: sql, encoding: 'utf8', timeout: 90_000, maxBuffer: 8_000_000 })
      const stdout = result.stdout || ''
      const stderr = result.stderr || ''
      if (result.status !== 0) {
        const error = new Error(stderr || stdout) as Error & { stdout: string, stderr: string }
        error.stdout = stdout
        error.stderr = stderr
        throw error
      }
      return stdout.replace(/\n$/, '')
    },
    args: psqlArgs,
    stop() {
      try { run(bins.pg_ctl, ['-D', data, '-m', 'fast', '-w', '-t', '20', 'stop']) } catch { /* already stopped */ }
      rmSync(directory, { recursive: true, force: true })
    },
  }
}

type Cluster = ReturnType<typeof startCluster>

const keyedMessage = /^(AT_STAGE3_V6_LIVE_CATALOG_DRIFT|AT_STAGE3_FOREIGN_CATALOG_DRIFT (?:added|changed|removed))(?: [A-Za-z0-9_:.+-]+)?$/

function primaryError(stderr: string) {
  const line = stderr.split('\n').map(item => item.trim()).find(item => item.startsWith('ERROR:'))
  if (!line) throw new Error('no primary ERROR on stderr')
  const coded = /^ERROR:\s+([A-Z0-9]{5}):\s+(\S.*)$/.exec(line)
  if (coded) return { sqlstate: coded[1], message: coded[2] }
  const plain = /^ERROR:\s+(\S.*)$/.exec(line)
  const state = stderr.split('\n').map(item => item.trim()).find(item => item.startsWith('SQLSTATE:'))
  const parsedState = state ? /^SQLSTATE:\s+([A-Z0-9]{5})$/.exec(state) : null
  if (!plain || !parsedState) throw new Error('unparsed primary ERROR: ' + line)
  return { sqlstate: parsedState[1], message: plain[1] }
}

function booleanCells(raw: string) {
  const lines = raw.split('\n').filter(line => line.length > 0)
  if (lines.length === 0) throw new Error('empty boolean result')
  return lines.map(line => {
    if (line === 't') return true
    if (line === 'f') return false
    throw new Error('not an exact boolean cell: ' + JSON.stringify(line))
  })
}

function expectSqlstate(cluster: Cluster, sql: string, sqlstate: string, message: string, keyed = false) {
  let stderr = ''
  let completed = false
  try {
    cluster.psql('\\set VERBOSITY verbose\n' + sql)
    completed = true
  } catch (error) {
    stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : ''
  }
  if (completed) throw new Error('script completed')
  const primary = primaryError(stderr)
  if (primary.sqlstate !== sqlstate || (keyed
    ? !primary.message.startsWith(message) || !keyedMessage.test(primary.message)
    : primary.message !== message)) {
    throw new Error('wanted ' + sqlstate + ' / ' + message + '\n' + primary.sqlstate + ' / ' + primary.message)
  }
}

const parentPins = v6Pins() as Record<string, string>
const expectedParentHashes = Object.keys(parentPins).sort().map(signature => parentPins[signature]).join(',')
const assembler = `SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.at_stage3_assembler='package';
`
const operation = `'atsrc3_'||repeat('a',32)`

function isolatedBody(splice = '') {
  const body = read(new URL('native-isolated-guard.sql', stage3))
  assert.equal((body.match(/Full historical V6 chain|Full chain again, now the V8 body/g) || []).length, 0)
  const marker = 'PERFORM official_v3_guard_private.stage3_require_allowed_delta_v1();'
  assert.equal(body.includes(marker), true)
  return splice ? body.replace(marker, splice + '\n' + marker) : body
}

function isolatedScript(splice = '') {
  return 'BEGIN;\n' + assembler + isolatedBody(splice) + 'COMMIT;\n'
}

function parentHashes(cluster: Cluster) {
  const values = Object.keys(parentPins).map(signature => `('${signature}')`).join(',')
  return cluster.tuples(`SELECT string_agg(encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'), ',' ORDER BY expected.signature)
 FROM (VALUES ${values}) AS expected(signature)
 JOIN pg_proc p ON p.oid=to_regprocedure(expected.signature);`)
}

function assertRolledBack(cluster: Cluster) {
  assert.deepEqual(booleanCells(cluster.tuples(`SELECT
 to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NULL
 AND to_regclass('official_v3_at_production_private.ch_visa_facts_v3') IS NULL
 AND to_regclass('official_v3_at_production_private.ch_visa_publication_v3') IS NULL
 AND to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1') IS NULL
 AND to_regclass('official_v3_at_production_private.ch_renewal_go_v3') IS NULL;`)), [true])
  assert.equal(parentHashes(cluster), expectedParentHashes)
}

function authInsert(id: string, batch: number, predecessor: number) {
  return `INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(
 'atrenew3_'||repeat('${id}',32),${operation},${batch},${predecessor},
 official_v3_at_production_private.fixture_digest(${batch}),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');`
}

function renewCall(id: string) {
  return `SELECT official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('${id}',32));`
}

function psqlValue(cluster: Cluster, sql: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(cluster.bins.psql, [...cluster.args, '-q', '-t', '-A'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8') })
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8') })
    child.on('exit', (code: number | null) => {
      if (code !== 0 || stderr.includes('ERROR:')) reject(new Error(stderr || stdout))
      else resolve(stdout.trim())
    })
    child.stdin.write(sql)
    child.stdin.end()
  })
}

function openSession(cluster: Cluster) {
  const child = spawn(cluster.bins.psql, [...cluster.args, '-q', '-t', '-A'], { stdio: ['pipe', 'pipe', 'pipe'] })
  let buffer = ''
  let stderr = ''
  child.stdout.on('data', (chunk: Buffer) => { buffer += chunk.toString('utf8') })
  child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8') })
  return {
    async query(sql: string) {
      const token = 'stage3_ready_' + Math.random().toString(16).slice(2)
      buffer = ''
      stderr = ''
      child.stdin.write(sql.trim().replace(/;+\s*$/, '') + `;\nSELECT '${token}';\n`)
      const start = Date.now()
      while (!buffer.includes(token)) {
        if (stderr.includes('ERROR:')) throw new Error(stderr)
        if (Date.now() - start > 20_000) throw new Error('session timeout\n' + stderr + buffer)
        await new Promise(resolve => setTimeout(resolve, 20))
      }
      return buffer.slice(0, buffer.indexOf(token)).trim()
    },
    close() { child.stdin.end() },
  }
}

async function waitFor(label: string, predicate: () => Promise<boolean>) {
  const start = Date.now()
  let detail = ''
  while (Date.now() - start < 1_500) {
    try {
      if (await predicate()) return
    } catch (error) {
      detail = error instanceof Error ? error.message : String(error)
    }
    await new Promise(resolve => setTimeout(resolve, 30))
  }
  throw new Error('overlap not observed: ' + label + (detail ? '\n' + detail : ''))
}

async function forceOrder(cluster: Cluster, firstSql: string, secondSql: string, block: 'renew' | 'withdraw') {
  const gate = openSession(cluster)
  try {
    const gatePid = await gate.query('SELECT pg_backend_pid()')
    assert.match(gatePid, /^[0-9]+$/)
    const lock = block === 'renew'
      ? 'LOCK TABLE official_v3_at_production_private.watch_batches_v1 IN ACCESS EXCLUSIVE MODE;'
      : 'LOCK TABLE official_v3_at_production_private.ch_visa_publication_v3 IN ACCESS EXCLUSIVE MODE;'
    await gate.query('BEGIN;\n' + lock + '\nSELECT pg_advisory_lock(771112,1);')
    const first = psqlValue(cluster, firstSql)
    await waitFor('first waits on advisory 1', async () => cluster.tuples(
      `SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=771112 AND objid=1 AND NOT granted AND pid<>${gatePid};`,
    ) === '1')
    await gate.query('SELECT pg_advisory_unlock(771112,1);')
    await waitFor('first holds advisory 1', async () => cluster.tuples(
      `SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=771112 AND objid=1 AND granted AND pid<>${gatePid};`,
    ) === '1')
    const second = psqlValue(cluster, secondSql)
    await waitFor('second waits on an advisory lock', async () => cluster.tuples(
      `SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=771112 AND objid IN (1,2,34) AND NOT granted AND pid<>${gatePid};`,
    ) === '1')
    await gate.query('ROLLBACK;')
    return { first: await first, second: await second }
  } finally { gate.close() }
}

function factState(cluster: Cluster) {
  return cluster.tuples(`SELECT count(*)::int||','||coalesce(max(version_id)::int::text,'none')
 FROM official_v3_at_production_private.ch_visa_facts_v3;`)
}

test('Stage 3 result parsers reject a masked error and a column-name boolean', () => {
  assert.deepEqual(primaryError('NOTICE: ignored\nERROR:  P7996: AT_STAGE3_FOREIGN_CATALOG_DRIFT added relation:42\nCONTEXT: line\n'), {
    sqlstate: 'P7996', message: 'AT_STAGE3_FOREIGN_CATALOG_DRIFT added relation:42',
  })
  assert.deepEqual(primaryError('ERROR:  production rolling protected catalog changed\nSQLSTATE: P7905\n'), {
    sqlstate: 'P7905', message: 'production rolling protected catalog changed',
  })
  assert.equal(primaryError('ERROR:  P7905: production rolling protected catalog changed\nERROR:  P7996: later\n').sqlstate, 'P7905')
  assert.throws(() => primaryError('NOTICE: P7996: AT_STAGE3_FOREIGN_CATALOG_DRIFT\n'))
  assert.throws(() => primaryError('SQLSTATE: P7996\n'))
  assert.deepEqual(booleanCells('t\n'), [true])
  assert.deepEqual(booleanCells('f'), [false])
  assert.throws(() => booleanCells('absent'))
  assert.throws(() => booleanCells('t\nabsent'))
  assert.throws(() => booleanCells(''))
})

test('native PG17 Stage 3 composition, preflight, drift, withdrawal and concurrent renewal', { timeout: 300_000 }, async () => {
  const probeSql = read(new URL('production-stage3.ROLLBACK-PROBE.sql', stage3))
  const commitSql = read(new URL('production-stage3.COMMIT-CANDIDATE.sql', stage3))
  assert.match(probeSql, /Full historical V6 chain/)
  assert.match(probeSql, /Full chain again, now the V8 body/)
  assert.match(commitSql, /Full historical V6 chain/)
  const withdrawalSql = `SET jetnity.at_stage3_withdrawal='production:qscbgcdmivbbnzrcyegn:AT-STAGE3-WITHDRAWAL';\n` +
    read(new URL('production-stage3.WITHDRAWAL.sql', stage3))

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

    expectSqlstate(cluster, bindLiveCatalog + probeSql, 'P7905', 'production rolling protected catalog changed')
    assertRolledBack(cluster)
    expectSqlstate(cluster, bindLiveCatalog + commitSql, 'P7905', 'production rolling protected catalog changed')
    assertRolledBack(cluster)
    expectSqlstate(cluster, bindLiveCatalog +
      'CREATE TABLE official_v3_at_production_private.foreign_drift_probe(id int);\n' + probeSql,
      'P7996', 'AT_STAGE3_V6_LIVE_CATALOG_DRIFT', true)
    cluster.psql('DROP TABLE official_v3_at_production_private.foreign_drift_probe;')
    expectSqlstate(cluster, `UPDATE official_v3_guard_private.bg1_prod_ch_at_source_v6
      SET catalog=official_v3_guard_private.catalog_status_v1() WHERE singleton;
      SELECT set_config('jetnity.at_stage3_expected_v6_catalog_digest','', false);\n` + probeSql,
      'P7996', 'AT_STAGE3_V6_CATALOG_DIGEST_REQUIRES_FRESH_READBACK')
    expectSqlstate(cluster, bindLiveCatalog +
      'CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7(singleton boolean);\n' + probeSql,
      'P7996', 'AT_STAGE3_V6_PARENT_REQUIRED')
    cluster.psql('DROP TABLE official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7;')

    expectSqlstate(cluster, `BEGIN;
      CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1()
      RETURNS jsonb LANGUAGE sql AS $tiny$ SELECT '{}'::jsonb $tiny$;
      UPDATE official_v3_guard_private.bg1_prod_ch_at_source_v6
       SET catalog=official_v3_guard_private.catalog_status_v1() WHERE singleton;
      SELECT set_config('jetnity.at_stage3_expected_v6_catalog_digest',
       (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
        FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton), true);
      ${assembler}
      ${isolatedBody()}
      COMMIT;`, 'P7996', 'AT_STAGE3_V6_PARENT_FUNCTION_DRIFT')
    assert.equal(parentHashes(cluster), expectedParentHashes)
    for (const splice of [
      `CREATE FUNCTION official_v3_guard_private.foreign_stage3_probe_v1() RETURNS integer LANGUAGE sql AS $foreign$ SELECT 1 $foreign$;`,
      `CREATE TABLE official_v3_at_production_private.foreign_stage3_probe(id int);`,
      `GRANT EXECUTE ON FUNCTION official_v3_at_production_private.renew_ch_v1() TO anon;`,
    ]) {
      expectSqlstate(cluster, bindLiveCatalog + isolatedScript(splice), 'P7996', 'AT_STAGE3_FOREIGN_CATALOG_DRIFT', true)
      assertRolledBack(cluster)
    }

    cluster.psql(bindLiveCatalog + isolatedScript())
    expectSqlstate(cluster, 'SELECT official_v3_guard_private.assert_catalog_v1();', 'P7905', 'production rolling protected catalog changed')
    expectSqlstate(cluster, 'SELECT official_v3_guard_private.require_open_v1();', 'P7902', 'bg1 recovery fresh full proof required')
    assert.equal(cluster.tuples(`SELECT public.official_v3_guard_alarm_status_v1()->>'status';`), 'unavailable')
    const rehearsal = cluster.psql(`SET jetnity.at_stage3_withdrawal='production:qscbgcdmivbbnzrcyegn:AT-STAGE3-WITHDRAWAL';\n` +
      read(new URL('production-stage3.WITHDRAWAL-REHEARSAL.sql', stage3)))
    assert.match(rehearsal, /AT_STAGE3_WITHDRAWAL_ROLLBACK_CLEAN/)
    assert.equal(cluster.tuples('SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1;'), '0')

    cluster.psql(read(new URL('native-stub-guard.sql', stage3)))
    cluster.psql(authInsert('b', 690, 82))
    assert.equal(await psqlValue(cluster, renewCall('b')), '1')
    assert.equal(factState(cluster), '1,83')
    cluster.psql(`SELECT official_v3_at_production_private.fixture_seed(692,clock_timestamp()-interval '1 minute');`)
    cluster.psql(authInsert('c', 692, 83))
    assert.equal(cluster.tuples(`SELECT official_v3_at_production_private.batch_qualified_ch_v3(692)
      AND expected_predecessor=83 AND source_digest=official_v3_at_production_private.fixture_digest(692)
      FROM official_v3_at_production_private.ch_renewal_go_v3
      WHERE authorization_id='atrenew3_'||repeat('c',32);`), 't')
    assert.equal(await psqlValue(cluster, 'BEGIN;\n' + renewCall('c') + '\nROLLBACK;'), '1')
    const withdrawnFirst = await forceOrder(cluster, withdrawalSql, renewCall('c'), 'withdraw')
    assert.equal(withdrawnFirst.second, '0')
    assert.equal(factState(cluster), '1,83')
    assert.equal(cluster.tuples(`SELECT count(*)::int||','||
      (SELECT decision FROM official_v3_at_production_private.ch_visa_publication_v3 ORDER BY decision_seq DESC LIMIT 1)
      FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1;`), '1,hold')
    assert.equal(await psqlValue(cluster, renewCall('c')), '0')
  } finally { cluster.stop() }

  const race = startCluster()
  try {
    race.psql(fixtureSql())
    race.psql(bindLiveCatalog + isolatedScript())
    race.psql(authInsert('b', 690, 82))
    const blocked = await Promise.all([psqlValue(race, renewCall('b')), psqlValue(race, renewCall('b'))])
    assert.deepEqual(blocked.map(value => value.trim()).sort(), ['0', '0'])
    assert.equal(factState(race), '0,none')
    race.psql(read(new URL('native-stub-guard.sql', stage3)))
    assert.equal(await psqlValue(race, renewCall('b')), '1')
    assert.equal(factState(race), '1,83')
    race.psql(`SELECT official_v3_at_production_private.fixture_seed(692,clock_timestamp()-interval '1 minute');`)
    race.psql(authInsert('c', 692, 83) + '\n' + authInsert('e', 692, 83))
    assert.equal(race.tuples(`SELECT count(*) FROM official_v3_at_production_private.ch_renewal_go_v3
      WHERE batch_id=692 AND expected_predecessor=83
      AND source_digest=official_v3_at_production_private.fixture_digest(692)
      AND authorization_id IN ('atrenew3_'||repeat('c',32),'atrenew3_'||repeat('e',32));`), '2')
    assert.equal(race.tuples('SELECT official_v3_at_production_private.batch_qualified_ch_v3(692);'), 't')
    assert.equal(await psqlValue(race, 'BEGIN;\n' + renewCall('c') + '\nROLLBACK;'), '1')
    assert.equal(await psqlValue(race, 'BEGIN;\n' + renewCall('e') + '\nROLLBACK;'), '1')
    assert.equal(factState(race), '1,83')
    const different = await Promise.all([psqlValue(race, renewCall('c')), psqlValue(race, renewCall('e'))])
    assert.deepEqual(different.map(value => value.trim()).sort(), ['0', '1'])
    assert.equal(factState(race), '2,84')
    race.psql(`SELECT official_v3_at_production_private.fixture_seed(693,clock_timestamp()-interval '1 minute');`)
    race.psql(authInsert('d', 693, 84))
    assert.equal(race.tuples(`SELECT official_v3_at_production_private.batch_qualified_ch_v3(693)
      AND source_digest=official_v3_at_production_private.fixture_digest(693)
      AND expected_predecessor=84
      FROM official_v3_at_production_private.ch_renewal_go_v3
      WHERE authorization_id='atrenew3_'||repeat('d',32);`), 't')
    assert.equal(await psqlValue(race, 'BEGIN;\n' + renewCall('d') + '\nROLLBACK;'), '1')
    const renewedFirst = await forceOrder(race, renewCall('d'), withdrawalSql, 'renew')
    assert.equal(renewedFirst.first, '1')
    assert.equal(factState(race), '3,85')
    assert.equal(race.tuples(`SELECT count(*)::int||','||
      (SELECT decision FROM official_v3_at_production_private.ch_visa_publication_v3 ORDER BY decision_seq DESC LIMIT 1)
      FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1;`), '1,hold')
    assert.equal(await psqlValue(race, renewCall('d')), '0')
    assert.doesNotMatch(renewedFirst.first + renewedFirst.second, /deadlock detected|timeout/)
  } finally { race.stop() }
})
