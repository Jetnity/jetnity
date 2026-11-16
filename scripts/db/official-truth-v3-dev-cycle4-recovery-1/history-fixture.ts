// OWNED, SOCKET-FREE PG17 FIXTURE ONLY. Copied business history is not a live
// source run, publication, Owner decision, deployment or unattended proof.
// The installed predecessors stay exact. REFRESH1 retirement is performed by
// the real local Owner/AAL2 RPC, then the captured later rows are appended.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { baseSetup, methodSeed } from '../official-truth-v3-customer-information-1/native'

type Row = Record<string, unknown>
type Fixture = { schema: number; scope: string; project?: string; tables: Record<string, Row[]> }
type ColumnTypes = Record<string, { json: boolean; notNull: boolean }>
type Evidence = {
  subject: Row & { job_key: string; current_job: Row; open_attempt: string; terminal_credit_claim: string }
  start: Row & { attempt_key: string }
  intake: Row & { operation_id: string }
  hrsHead: Row
  qualification: { reference: string; decisionRef: string; originalIds: string[] }
  counts: Record<string, number>
  cycle: Row
  dispatches: Row[]
  cycle2Review: Row
  cycle3Review: Row
}
const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;SET search_path=pg_catalog;'
const creator = 'SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const localToken = (attempt: string) => hash('SYNTHETIC LOCAL M04 ONLY:' + attempt)
const readJson = (path: string): unknown => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const human = () => 'SET SESSION AUTHORIZATION authenticated;SET search_path=pg_catalog;SELECT set_config(\'request.jwt.claims\','
  + literal(JSON.stringify({ sub: uid(1), session_id: uid(201), role: 'authenticated', aal: 'aal2',
    exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) - 10 })) + ',false);'
const subjects = 'official_v3_jobs_private.subjects_v1'
const queue = 'official_v3_jobs_private.queue_operations_v1'
const starts = 'official_v3_jobs_private.execution_starts_v1'
const heads = 'official_v3_result_private.heads_v1'
const schedule = 'official_v3_result_private.monitor_schedule_v1'
const ownerOperations = 'official_v3_guard_private.owner_operations_v1'
const refreshRetirements = 'official_v3_guard_private.retired_refresh_attempts_v1'
const scheduler = 'jetnity_dev_import_scheduler.'
const schedulerTables = ['cycles_v1', 'dispatches_v1', 'preview_access_v1', 'preview_dispatches_v1', 'state_v1'] as const
const sequence = [
  'official_v3_intake_private.operations_v1', 'official_v3_intake_private.reservations_v1',
  'official_v3_intake_private.completions_v1', queue, starts,
  'official_v3_jobs_private.execution_results_v1', 'official_v3_jobs_private.execution_dispositions_v1',
  'official_v3_result_private.originals_v1', 'official_v3_result_private.extractions_v1',
  'official_v3_result_private.qualifications_v1', 'official_v3_result_private.decisions_v1',
  'official_v3_result_private.archive_pages_v1', 'official_v3_result_private.versions_v1',
  'official_v3_result_private.projections_v1', 'official_v3_result_private.operations_v1',
  'official_v3_result_private.outbox_v1', ownerOperations,
  'official_v3_guard_private.retired_attempts_v1', 'official_v3_guard_private.retired_later_attempts_v1',
] as const

function fixture(directory: string, name: string, expectedScope: string): Fixture {
  const manifest = readJson(directory + name + '-manifest.json') as {
    file: string; bytes: number; sha256: string; gzipBytes: number; gzipSha256: string
  }
  assert.equal(manifest.file, name + '.json.gz')
  const compressed = readFileSync(new URL(directory + manifest.file, import.meta.url))
  assert.equal(compressed.length, manifest.gzipBytes)
  assert.equal(hash(compressed), manifest.gzipSha256)
  const raw = gunzipSync(compressed, { maxOutputLength: 6 * 1024 * 1024 })
  assert.equal(raw.length, manifest.bytes); assert.equal(hash(raw), manifest.sha256)
  const value = JSON.parse(raw.toString('utf8')) as Fixture
  assert.equal(value.schema, 1); assert.equal(value.scope, expectedScope)
  if (expectedScope.endsWith('-delta')) assert.equal(value.project, 'yfvbxvijcorffwxbxahl')
  const inspect = (item: unknown) => {
    if (item && typeof item === 'object') for (const [key, field] of Object.entries(item)) {
      assert.doesNotMatch(key, /token|secret|authorization|password|cookie|actor_id/i,
        'no live credential or actor field in retained local fixture')
      inspect(field)
    }
  }
  inspect(value.tables)
  for (const [table, rows] of Object.entries(value.tables)) {
    assert.match(table, /^(?:official_v3_(?:jobs|intake|result|guard)_private|jetnity_dev_import_scheduler)\.[a-z0-9_]+$/)
    assert.ok(Array.isArray(rows))
    for (const row of rows) {
      if (expectedScope.endsWith('-delta')) {
        assert.ok(Array.isArray(row._sql_nulls), 'delta distinguishes actual SQL NULL from JSON null')
        for (const key of row._sql_nulls) assert.equal(row[String(key)], null)
      }
      // Withheld credentials are replaced only with explicit local material.
      // No real token, token hash or actor identity is restored from a digest.
      if (table.startsWith('official_v3_intake_private.')) {
        const text = hash('SYNTHETIC LOCAL S1 ONLY:' + String(row.operation_id))
        row.lease_token = text.slice(0, 8) + '-' + text.slice(8, 12) + '-4' + text.slice(13, 16)
          + '-8' + text.slice(17, 20) + '-' + text.slice(20, 32)
      }
      if (table === starts) row.token_hash = hash(localToken(String(row.attempt_key)))
      if (table === ownerOperations) row.actor_id = uid(1)
    }
  }
  return value
}

const identifier = (value: string) => { assert.match(value, /^[a-z_]+$/); return '"' + value + '"' }
function fields(row: Row) { return Object.entries(row).filter(([key]) => key !== '_sql_nulls') }
function sqlValue(row: Row, key: string, column: ColumnTypes[string]) {
  const value = row[key]
  if (Array.isArray(row._sql_nulls) && row._sql_nulls.includes(key)) {
    assert.equal(value, null); return 'NULL'
  }
  if (value === null) {
    if (column.json) {
      assert.ok(Array.isArray(row._sql_nulls) || column.notNull,
        'nullable JSON requires captured SQL-null versus JSON-null evidence')
      return json(null)
    }
    return 'NULL'
  }
  if (column.json) return json(value)
  if (typeof value === 'string') return literal(value)
  if (typeof value === 'number') { assert.ok(Number.isFinite(value)); return String(value) }
  if (typeof value === 'boolean') return String(value)
  return json(value)
}
function insert(table: string, rows: Row[], columns: ColumnTypes) {
  return rows.map(row => 'INSERT INTO ' + table + '(' + fields(row).map(([key]) => identifier(key)).join(',') + ')'
    + (table.startsWith(scheduler) && Object.hasOwn(row, 'id') ? ' OVERRIDING SYSTEM VALUE' : '')
    + ' VALUES(' + fields(row).map(([key]) => {
      const type = columns[table + '.' + key]; assert.ok(type, 'known fixture column ' + table + '.' + key)
      return sqlValue(row, key, type)
    }).join(',') + ');').join('\n')
}
function update(table: string, row: Row, columns: ColumnTypes, key: string) {
  return 'UPDATE ' + table + ' SET ' + fields(row).filter(([name]) => name !== key).map(([name]) => {
    const type = columns[table + '.' + name]; assert.ok(type)
    return identifier(name) + '=' + sqlValue(row, name, type)
  }).join(',') + ' WHERE ' + identifier(key) + '=' + sqlValue(row, key, columns[table + '.' + key]!) + ';'
}
function ordered(table: string, rows: Row[]) {
  return [...rows].sort((a, b) => table.endsWith('versions_v1') ? Number(a.revision) - Number(b.revision)
    : table.endsWith('decisions_v1') ? String((a.record as Row).evaluatedAt).localeCompare(String((b.record as Row).evaluatedAt)) : 0)
}
const certificates = 'UPDATE official_v3_result_private.binding_v1 SET state_certificate=official_v3_result_private.state_fingerprint_v1() WHERE singleton;'
  + 'SELECT official_v3_guard_private.seal_s1_v1();SELECT official_v3_guard_private.seal_jobs_v1();'
  + 'SELECT official_v3_guard_private.check_retirements_v1();SELECT official_v3_guard_private.check_certificates_v1();'

const providerFixture = `
CREATE SCHEMA vault;
CREATE TABLE vault.decrypted_secrets(name text PRIMARY KEY,decrypted_secret text);
INSERT INTO vault.decrypted_secrets VALUES('jetnity_dev_import_cron_v1','owned_local_cycle4_fixture_signing_123456789'),
 ('jetnity_dev_import_preview_cookie_v1','_vercel_jwt=bG9jYWw.Zml4dHVyZQ.b25seQ');
CREATE SCHEMA net;
CREATE TABLE net.http_request_queue(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,url text,body jsonb,headers jsonb);
CREATE TABLE net._http_response(id bigint,status_code integer,content_type text,headers jsonb,content text,timed_out boolean,error_msg text);
CREATE FUNCTION net.http_post(url text,body jsonb,params jsonb,headers jsonb,timeout_milliseconds integer) RETURNS bigint
LANGUAGE sql AS $$ INSERT INTO net.http_request_queue(url,body,headers) VALUES($1,$2,$4) RETURNING id $$;
-- Local metadata only: no pg_cron worker or scheduled invocation exists.
-- Match hosted postgres: it can read cron metadata but does not own or write it.
SET SESSION AUTHORIZATION ot_pilot_owner;
CREATE SCHEMA cron;
CREATE TABLE cron.job(jobid bigint PRIMARY KEY,active boolean NOT NULL,command text NOT NULL,
 jobname text NOT NULL,database text NOT NULL,nodename text NOT NULL,nodeport integer NOT NULL,
 schedule text NOT NULL,username text NOT NULL);
INSERT INTO cron.job VALUES(5,false,'SELECT jetnity_dev_import_scheduler.run_v1();',
 'jetnity-ch-de-dev-import-v1','postgres','localhost',5432,'* * * * *','postgres');
REVOKE ALL ON SCHEMA cron FROM PUBLIC,postgres;
REVOKE ALL ON TABLE cron.job FROM PUBLIC,postgres;
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT SELECT ON TABLE cron.job TO postgres;
SET SESSION AUTHORIZATION postgres;
`

export async function prepareCycle4RecoveryFixture(proof: OwnedPersistentProof,
  beforeProtectedSetup?: () => Promise<void>): Promise<{ tables: Record<string, Row[]> }> {
  const prior = fixture('../official-truth-v3-dev-refresh-retirement-1/', 'local-history', 'owned-local-pg17-redacted-dev-history')
  const delta = fixture('./', 'local-history-delta', 'owned-local-pg17-redacted-dev-history-delta')
  const previous = readJson('../official-truth-v3-dev-refresh-retirement-1/original-evidence.json') as Evidence
  const evidence = readJson('./original-evidence.json') as Evidence
  assert.deepEqual(Object.keys(delta.tables).sort(), [...sequence, subjects, heads, schedule, refreshRetirements,
    ...schedulerTables.map(name => scheduler + name)].sort(), 'complete bounded delta table inventory')
  assert.deepEqual([evidence.counts.queue, evidence.counts.starts, evidence.counts.versions,
    evidence.counts.publications, evidence.counts.refreshRetirements], [45, 11, 6, 6, 1])
  assert.equal(evidence.cycle.id, 4)
  assert.equal(evidence.subject.job_key, previous.subject.job_key)
  assert.equal(prior.tables[queue]!.length, 41); assert.equal(prior.tables[starts]!.length, 9)
  const deltaRows = (table: string) => delta.tables[table] ?? []
  const snapshot = (table: string) => { assert.equal(deltaRows(table).length, 1, table); return deltaRows(table)[0]! }
  assert.deepEqual(Object.fromEntries(fields(snapshot(subjects))), evidence.subject)
  assert.deepEqual(Object.fromEntries(fields(snapshot(heads))), evidence.hrsHead)
  assert.equal(deltaRows(queue).length, 4); assert.equal(deltaRows(starts).length, 2)
  for (const table of ['official_v3_guard_private.retired_attempts_v1', 'official_v3_guard_private.retired_later_attempts_v1'])
    assert.equal(deltaRows(table).length, 0, 'the three earlier retirements are already retained')
  assert.equal(deltaRows(ownerOperations).length, 1)
  assert.equal(deltaRows(refreshRetirements).length, 1)
  assert.equal(deltaRows(refreshRetirements)[0]!.attempt_key, previous.start.attempt_key)
  assert.equal(deltaRows(refreshRetirements)[0]!.owner_operation_id, deltaRows(ownerOperations)[0]!.operation_id)
  // The captured fourth retirement documents the observed predecessor, but
  // its live-token digests are never imported. The real local RPC below owns
  // the local retirement and its confirmation.

  await proof.run('CREATE SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;', 'real local pgcrypto provider')
  await baseSetup(proof, beforeProtectedSetup)
  const columnTypes = () => proof.value<ColumnTypes>(`(SELECT jsonb_object_agg(n.nspname||'.'||c.relname||'.'||a.attname,
    jsonb_build_object('json',a.atttypid IN ('json'::regtype,'jsonb'::regtype),'notNull',a.attnotnull))
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind='r'
      AND (n.nspname LIKE 'official_v3_%_private' OR n.nspname='jetnity_dev_import_scheduler'))`, owner)
  let columns = await columnTypes()
  const first = [...prior.tables[queue]!].sort((a, b) => String(a.recorded_at).localeCompare(String(b.recorded_at)))[0]!
  assert.equal(first.action, 'enqueue')
  const initialSubject = { ...previous.subject, current_job: JSON.parse(String(first.envelope_text)).next,
    operation_count: 1, start_count: 0, open_attempt: null, terminal_credit_claim: null }
  await proof.run(owner + "BEGIN;SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';"
    + methodSeed('2026-11-12T00:00:00.000Z')
    + 'UPDATE official_v3_jobs_private.slots_v1 SET job_key=' + literal(previous.subject.job_key) + ' WHERE slot_id=1;'
    + insert(subjects, [initialSubject], columns) + insert(queue, [first], columns) + 'COMMIT;',
  'local method actor and complete first queue prefix before the unchanged installed chain')
  for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql',
    'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql'])
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-background-guard-1/' + file) + 'COMMIT;', 'exact BG1 predecessor ' + file)
  for (const directory of ['official-truth-v3-rolling-jobs-quota-1', 'official-truth-v3-customer-information-1'])
    await proof.run(creator + 'BEGIN;' + readSql(directory + '/provider-migration-body.sql') + 'COMMIT;', 'exact predecessor ' + directory)
  columns = await columnTypes()
  for (const table of sequence) {
    const rows = prior.tables[table]!.filter(row => table !== queue || row.operation_id !== first.operation_id)
    if (rows.length) await proof.run(owner + insert(table, ordered(table, rows), columns), 'original redacted five-publication prefix ' + table)
  }
  await proof.run(owner + update(subjects, previous.subject, columns, 'job_key')
    + update(heads, prior.tables[heads]![0]!, columns, 'singleton')
    + update(schedule, prior.tables[schedule]![0]!, columns, 'singleton') + certificates,
  'all original copied rows remain protected by the unchanged guards')

  await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-dev-refresh-retirement-1/provider-migration-body.sql') + 'COMMIT;',
    'exact already reviewed REFRESH1 predecessor installation')
  assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
  const review = await proof.value<{ retirement: { status: string; selection: string } }>('public.official_v3_guard_review_v1()', human())
  assert.equal(review.retirement.status, 'reviewable')
  const retirementOperation = 'op3_' + hash('owned-cycle4-fixture:retire-original-refresh1').slice(0, 32)
  const receipt = await proof.value<Row>('public.official_v3_guard_retire_v1(' + literal(retirementOperation) + ','
    + literal(review.retirement.selection) + ')', human())
  assert.equal(receipt.result, 'unknown_retired')
  assert.deepEqual(await proof.value('public.official_v3_guard_confirm_v1(' + literal(retirementOperation)
    + ",'retire_unknown'," + literal(review.retirement.selection) + ')', human()), receipt)

  const targetOriginals = new Set(evidence.qualification.originalIds)
  const isCycle4 = (table: string, row: Row): boolean => {
    if (table === queue) return (JSON.parse(String(row.envelope_text)).next as Row).jobId === evidence.subject.current_job.jobId
    if (table.startsWith('official_v3_jobs_private.')) return row.attempt_key === evidence.start.attempt_key
    if (table.startsWith('official_v3_intake_private.')) return row.operation_id === evidence.intake.operation_id
    if (table.endsWith('originals_v1') || table.endsWith('extractions_v1')) return targetOriginals.has(String(row.version_id))
    if (table.endsWith('qualifications_v1')) return row.reference === evidence.qualification.reference
    return false
  }
  const beforeCycle4 = deltaRows(queue).filter(row => !isCycle4(queue, row))
  assert.equal(beforeCycle4.length, 2)
  const completed = beforeCycle4.find(row => row.action === 'complete')
  assert.ok(completed, 'the sixth publication has its actual completed queue envelope')
  const completedJob = JSON.parse(String(completed.envelope_text)).next as Row
  assert.equal(completedJob.state, 'succeeded'); assert.equal(completedJob.revision, 39); assert.equal(completedJob.lease, null)
  const completedSubject: Row = { ...previous.subject, current_job: completedJob, operation_count: 43,
    start_count: 10, open_attempt: null, terminal_credit_claim: null }
  for (const table of sequence) {
    if (table.startsWith('official_v3_guard_private.')) continue
    const rows = deltaRows(table).filter(row => !isCycle4(table, row))
    if (rows.length) await proof.run(owner + insert(table, ordered(table, rows), columns), 'captured sixth-publication append ' + table)
  }
  await proof.run(owner + update(subjects, completedSubject, columns, 'job_key')
    + update(heads, snapshot(heads), columns, 'singleton') + update(schedule, snapshot(schedule), columns, 'singleton')
    + certificates, 'genuine captured sixth publication with no open Cycle4 custody yet')
  assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')

  await proof.run(creator + providerFixture + "BEGIN;SET LOCAL jetnity.dev_import_target='dev:yfvbxvijcorffwxbxahl:refresh1';"
    + readSql('official-truth-v3-dev-import-schedule-1/core.sql')
    + readSql('official-truth-v3-dev-import-schedule-1/preview-renewal.sql') + 'COMMIT;',
  'unchanged local scheduler with a table-only HTTP fixture, no automatic call')
  columns = await columnTypes()
  for (const cycle of [2, 3]) {
    const original = readJson(cycle === 2 ? '../official-truth-v3-dev-terminal-cycle-review-1/original-evidence.json'
      : '../official-truth-v3-dev-terminal-cycle3-review-1/original-evidence.json') as { cycle: Row; dispatches: Row[] }
    await proof.run(creator + insert(scheduler + 'cycles_v1', [original.cycle], columns)
      + insert(scheduler + 'dispatches_v1', original.dispatches, columns), 'exact original Cycle' + cycle + ' scheduler evidence')
    const prefix = cycle === 2 ? 'dev_terminal_review' : 'dev_terminal_cycle3_review'
    const declaration = cycle === 2 ? evidence.cycle2Review : evidence.cycle3Review
    // These are explicit local operator declarations, not proof of a remote CI
    // run or deployment. Both unchanged migrations still calculate their own
    // actual local reviewed_at/reviewed_head and preserve every existing row.
    await proof.run(creator + 'SELECT official_v3_guard_private.audit_v1();'
      + 'SET jetnity.' + prefix + '_target=' + literal('dev:yfvbxvijcorffwxbxahl:terminal-cycle' + cycle + '-v1') + ';'
      + 'SET jetnity.' + prefix + '_ack=' + literal('full-ci-ready-preview-and-normal-ui-verified-cycle' + cycle + '-v1') + ';'
      + 'SET jetnity.' + prefix + '_commit=' + literal(String(declaration.runtime_commit)) + ';'
      + 'SET jetnity.' + prefix + '_deployment=' + literal(String(declaration.ready_deployment)) + ';'
      + 'SET jetnity.' + prefix + '_ci_run=' + literal(String(declaration.ci_run)) + ';'
      + 'SET jetnity.' + prefix + '_ui_version=' + literal(String(declaration.ui_version)) + ';'
      + readSql(cycle === 2 ? 'official-truth-v3-dev-terminal-cycle-review-1/review-cycle2.sql'
        : 'official-truth-v3-dev-terminal-cycle3-review-1/review-cycle3.sql'),
    'unchanged real Cycle' + cycle + ' review against actual local protected history')
  }

  for (const table of sequence) {
    if (table.startsWith('official_v3_guard_private.')) continue
    const rows = deltaRows(table).filter(row => isCycle4(table, row))
    if (rows.length) await proof.run(owner + insert(table, ordered(table, rows), columns), 'captured blocked Cycle4 original append ' + table)
  }
  await proof.run(owner + update(subjects, snapshot(subjects), columns, 'job_key') + certificates,
    'exact original Cycle4 subject and full retained business history')
  for (const suffix of schedulerTables) {
    const table = scheduler + suffix, rows = deltaRows(table)
    const selected = table.endsWith('cycles_v1') ? rows.filter(row => row.id !== 2 && row.id !== 3)
      : table.endsWith('dispatches_v1') ? rows.filter(row => row.cycle_id !== 2 && row.cycle_id !== 3) : rows
    if (!selected.length) continue
    const singleton = table.endsWith('state_v1') || table.endsWith('preview_access_v1')
    if (singleton) assert.equal(selected.length, 1)
    await proof.run(creator + (singleton ? update(table, selected[0]!, columns, 'singleton')
      : insert(table, selected, columns)), 'retained local scheduler snapshot ' + table)
  }
  await proof.run(creator + `
    SELECT setval(pg_get_serial_sequence('jetnity_dev_import_scheduler.cycles_v1','id'),
      (SELECT max(id) FROM jetnity_dev_import_scheduler.cycles_v1),true);
    SELECT setval(pg_get_serial_sequence('jetnity_dev_import_scheduler.dispatches_v1','id'),
      (SELECT max(id) FROM jetnity_dev_import_scheduler.dispatches_v1),true);
    SELECT setval(pg_get_serial_sequence('jetnity_dev_import_scheduler.preview_dispatches_v1','id'),
      (SELECT coalesce(max(id),0)+1 FROM jetnity_dev_import_scheduler.preview_dispatches_v1),false);
    SELECT setval(pg_get_serial_sequence('net.http_request_queue','id'),greatest(
      (SELECT coalesce(max(net_request_id),0) FROM jetnity_dev_import_scheduler.dispatches_v1),
      (SELECT coalesce(max(net_request_id),0) FROM jetnity_dev_import_scheduler.preview_dispatches_v1))+1,false);
    SELECT official_v3_guard_private.audit_v1();
    SELECT official_v3_guard_private.require_open_v1();
    SELECT official_v3_guard_private.check_jobs_v1();
    SELECT official_v3_guard_private.check_hrs_v1();
    SELECT official_v3_guard_private.check_retirements_v1();
    SELECT official_v3_guard_private.check_certificates_v1();`, 'complete real guards validate all appended local history')

  const tables: Record<string, Row[]> = {}
  for (const table of new Set([...Object.keys(prior.tables), ...Object.keys(delta.tables), refreshRetirements])) {
    if (table.startsWith(scheduler)) continue
    const rows = table === subjects || table === heads || table === schedule ? deltaRows(table)
      : [...(prior.tables[table] ?? []), ...deltaRows(table)]
    tables[table] = rows.map(row => Object.fromEntries(fields(row)))
  }
  // These two sets contain genuinely calculated local retirement time/digests,
  // not the incompatible live-token/actor snapshot from the copied evidence.
  for (const table of [ownerOperations, refreshRetirements])
    tables[table] = await proof.value<Row[]>('(SELECT coalesce(jsonb_agg(to_jsonb(r)),\'[]\'::jsonb) FROM ' + table + ' r)', creator)
  assert.equal(tables[queue]!.length, 45); assert.equal(tables[starts]!.length, 11)
  assert.equal(tables['official_v3_result_private.versions_v1']!.length, 6)
  assert.equal(tables[ownerOperations]!.length, 4); assert.equal(tables[refreshRetirements]!.length, 1)
  return { tables }
}
