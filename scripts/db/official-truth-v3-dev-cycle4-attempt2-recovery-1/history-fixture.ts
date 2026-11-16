// OWNED, SOCKET-FREE PG17 FIXTURE ONLY. No copied row is a live proof.
// The entire applied Case1 chain is reused unchanged. Its original retirement
// is calculated by the real local Owner/AAL2 RPC before actual Attempt2 rows
// are appended; live-token retirement digests are never imported.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { prepareCycle4RecoveryFixture } from '../official-truth-v3-dev-cycle4-recovery-1/history-fixture'
import { BASELINE as CASE1_BASELINE } from '../official-truth-v3-dev-cycle4-recovery-1/build.mjs'
import { awaitNextBg1 } from './await-next-bg1'

type Row = Record<string, unknown>
type Fixture = { schema: number; scope: string; project?: string; tables: Record<string, Row[]> }
type ColumnTypes = Record<string, { json: boolean; notNull: boolean }>
type Evidence = { subject: Row & { job_key: string; current_job: Row }; start: Row & { attempt_key: string };
  intake: Row & { operation_id: string }; hrsHead: Row; counts: Record<string, number>; cycle: Row; dispatches: Row[] }
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
const starts = 'official_v3_jobs_private.execution_starts_v1'
const queue = 'official_v3_jobs_private.queue_operations_v1'
const heads = 'official_v3_result_private.heads_v1'
const schedule = 'official_v3_result_private.monitor_schedule_v1'
const ownerOperations = 'official_v3_guard_private.owner_operations_v1'
const case1Retirements = 'official_v3_guard_private.retired_cycle4_attempts_v1'
const scheduler = 'jetnity_dev_import_scheduler.'
const schedulerTables = ['cycles_v1', 'dispatches_v1', 'preview_access_v1', 'preview_dispatches_v1', 'state_v1'] as const
const oldRetirements = ['official_v3_guard_private.retired_attempts_v1',
  'official_v3_guard_private.retired_later_attempts_v1', 'official_v3_guard_private.retired_refresh_attempts_v1'] as const
const sequence = [
  'official_v3_intake_private.operations_v1', 'official_v3_intake_private.reservations_v1',
  'official_v3_intake_private.completions_v1', queue, starts,
  'official_v3_jobs_private.execution_results_v1', 'official_v3_jobs_private.execution_dispositions_v1',
  'official_v3_result_private.originals_v1', 'official_v3_result_private.extractions_v1',
  'official_v3_result_private.qualifications_v1', 'official_v3_result_private.decisions_v1',
  'official_v3_result_private.archive_pages_v1', 'official_v3_result_private.versions_v1',
  'official_v3_result_private.projections_v1', 'official_v3_result_private.operations_v1',
  'official_v3_result_private.outbox_v1',
] as const
const case1ProviderSha = 'e12dc341cc01de2a459826e8b1c6a3a9b4dd48b40dd8cd1c765660007b7694f3'

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

export async function prepareCycle4Attempt2RecoveryFixture(proof: OwnedPersistentProof,
  signal: AbortSignal, beforeProtectedSetup?: () => Promise<void>): Promise<{ tables: Record<string, Row[]> }> {
  signal.throwIfAborted()
  const prior = await prepareCycle4RecoveryFixture(proof, beforeProtectedSetup)
  const previous = readJson('../official-truth-v3-dev-cycle4-recovery-1/original-evidence.json') as Evidence
  const evidence = readJson('./original-evidence.json') as Evidence
  const delta = fixture('./', 'local-history-delta', 'owned-local-pg17-redacted-dev-history-delta')
  const allowed = [...sequence, subjects, heads, schedule, ownerOperations, case1Retirements,
    ...oldRetirements, ...schedulerTables.map(name => scheduler + name)]
  for (const table of Object.keys(delta.tables)) assert.ok(allowed.includes(table), 'bounded actual Attempt2 delta table ' + table)
  const rawRows = (table: string) => delta.tables[table] ?? []
  const keys: Record<string, readonly string[]> = {
    queue_operations_v1: ['operation_id'], execution_starts_v1: ['attempt_key'], execution_results_v1: ['attempt_key'],
    execution_dispositions_v1: ['attempt_key'], operations_v1: ['operation_id'], reservations_v1: ['operation_id', 'generation'],
    completions_v1: ['operation_id'], originals_v1: ['version_id'], extractions_v1: ['version_id'], qualifications_v1: ['reference'],
    decisions_v1: ['reference'], archive_pages_v1: ['reference'], versions_v1: ['reference'], projections_v1: ['reference'],
    outbox_v1: ['escalation_key'],
  }
  // The captured export is cumulative from REFRESH1. Subtract only exact old
  // immutable rows by their real keys; never replay or rewrite that prefix.
  const appended = new Map<string, Row[]>()
  for (const table of sequence) {
    const key = table === 'official_v3_result_private.operations_v1' ? ['operation_kind', 'operation_id']
      : keys[table.split('.')[1]!]!
    const newRows: Row[] = []
    for (const row of rawRows(table)) {
      const existing = (prior.tables[table] ?? []).find(item => key.every(field => item[field] === row[field]))
      if (existing) assert.deepEqual(existing, Object.fromEntries(fields(row)), 'copied immutable predecessor row remains exact')
      else newRows.push(row)
    }
    appended.set(table, newRows)
  }
  const rows = (table: string) => appended.get(table) ?? rawRows(table)
  const snapshot = (table: string) => { assert.equal(rows(table).length, 1, table); return rows(table)[0]! }
  assert.deepEqual(Object.fromEntries(fields(snapshot(subjects))), evidence.subject)
  assert.deepEqual(Object.fromEntries(fields(snapshot(heads))), evidence.hrsHead)
  assert.equal(evidence.subject.job_key, previous.subject.job_key)
  assert.equal(evidence.subject.current_job.jobId, previous.subject.current_job.jobId)
  assert.equal(evidence.subject.current_job.operationId, previous.subject.current_job.operationId)
  assert.deepEqual([evidence.subject.current_job.attempt, evidence.subject.current_job.revision], [2, 42])
  assert.deepEqual(evidence.cycle, previous.cycle, 'the original blocked Cycle4 stays exact')
  assert.deepEqual(evidence.dispatches, previous.dispatches, 'all nine original dispatches stay exact')
  assert.equal(rows(queue).length, 1); assert.equal(rows(queue)[0]!.action, 'claim')
  assert.equal(rows(starts).length, 1); assert.equal(rows(starts)[0]!.attempt_key, evidence.start.attempt_key)
  for (const table of ['official_v3_intake_private.operations_v1', 'official_v3_intake_private.reservations_v1']) {
    assert.equal(rows(table).length, 1); assert.equal(rows(table)[0]!.operation_id, evidence.intake.operation_id)
  }
  assert.equal(rows('official_v3_result_private.originals_v1').length, 2)
  assert.equal(rows('official_v3_result_private.extractions_v1').length, 2)
  assert.equal(rows('official_v3_result_private.qualifications_v1').length, 1)
  for (const table of ['official_v3_intake_private.completions_v1',
    'official_v3_jobs_private.execution_results_v1', 'official_v3_jobs_private.execution_dispositions_v1',
    'official_v3_result_private.versions_v1', 'official_v3_result_private.projections_v1',
    'official_v3_result_private.operations_v1', 'official_v3_result_private.decisions_v1',
    'official_v3_result_private.archive_pages_v1', 'official_v3_result_private.outbox_v1'])
    assert.equal(rows(table).length, 0, 'no invented completion, publication or changed historical retirement: ' + table)
  for (const table of oldRetirements) for (const row of rawRows(table))
    assert.ok(prior.tables[table]!.some(item => item.attempt_key === row.attempt_key), 'all older retirements already exist locally')
  assert.equal(rawRows(case1Retirements).length, 1)
  assert.equal(rawRows(case1Retirements)[0]!.attempt_key, previous.start.attempt_key)
  assert.equal(rawRows(ownerOperations).filter(row => row.operation_id === rawRows(case1Retirements)[0]!.owner_operation_id).length, 1)
  // Both live Owner rows and every captured retirement remain evidence-only:
  // the actual locally generated Owner receipts, times and digests prevail.

  const migration = readSql('official-truth-v3-dev-cycle4-recovery-1/provider-migration-body.sql')
  assert.equal(hash(migration), case1ProviderSha, 'the applied Case1 provider is byte-identical')
  await proof.run(creator + 'BEGIN;' + migration + 'COMMIT;', 'exact applied Case1 provider for the local predecessor')
  await awaitNextBg1(proof, signal, CASE1_BASELINE)
  const reviewed = await proof.value<{ retirement: { status: string; selection: string } }>('public.official_v3_guard_review_v1()', human())
  assert.equal(reviewed.retirement.status, 'reviewable')
  const operation = 'op3_' + hash('owned-cycle4-attempt2-fixture:retire-original-case1').slice(0, 32)
  const receipt = await proof.value<Row>('public.official_v3_guard_retire_v1(' + literal(operation) + ','
    + literal(reviewed.retirement.selection) + ')', human())
  assert.equal(receipt.result, 'unknown_retired')
  assert.deepEqual(await proof.value('public.official_v3_guard_confirm_v1(' + literal(operation)
    + ",'retire_unknown'," + literal(reviewed.retirement.selection) + ')', human()), receipt)

  const columns = await proof.value<ColumnTypes>(`(SELECT jsonb_object_agg(n.nspname||'.'||c.relname||'.'||a.attname,
    jsonb_build_object('json',a.atttypid IN ('json'::regtype,'jsonb'::regtype),'notNull',a.attnotnull))
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind='r'
      AND (n.nspname LIKE 'official_v3_%_private' OR n.nspname='jetnity_dev_import_scheduler'))`, owner)
  for (const table of sequence) {
    signal.throwIfAborted()
    if (rows(table).length) await proof.run(owner + insert(table, ordered(table, rows(table)), columns), 'captured real Attempt2 append ' + table)
  }
  for (const table of [heads, schedule]) {
    const actual = await proof.value<Row>('(SELECT to_jsonb(r) FROM ' + table + ' r WHERE singleton)', creator)
    assert.deepEqual(actual, Object.fromEntries(fields(snapshot(table))), 'unchanged sixth-publication row remains exact: ' + table)
  }
  await proof.run(owner + update(subjects, snapshot(subjects), columns, 'job_key')
    + certificates, 'actual Attempt2 subject with the retained sixth-publication head and schedule')
  for (const suffix of schedulerTables) {
    const table = scheduler + suffix, captured = rows(table)
    const actual = await proof.value<Row[]>('(SELECT coalesce(jsonb_agg(to_jsonb(r)),\'[]\'::jsonb) FROM ' + table + ' r)', creator)
    assert.equal(actual.length, captured.length, 'no additional scheduler row in this Attempt2 delta')
    const key = suffix === 'state_v1' || suffix === 'preview_access_v1' ? 'singleton' : 'id'
    for (const row of captured) {
      const existing = actual.find(item => item[key] === row[key])
      assert.deepEqual(existing, Object.fromEntries(fields(row)), 'retained scheduler row remains exact: ' + table)
    }
  }
  await proof.run(creator + `
    SELECT official_v3_guard_private.audit_v1();
    SELECT official_v3_guard_private.require_open_v1();
    SELECT official_v3_guard_private.check_jobs_v1();
    SELECT official_v3_guard_private.check_hrs_v1();
    SELECT official_v3_guard_private.check_retirements_v1();
    SELECT official_v3_guard_private.check_certificates_v1();`, 'real guards validate the full local Attempt2 history')

  const tables: Record<string, Row[]> = {}
  for (const table of new Set([...Object.keys(prior.tables), case1Retirements])) {
    if (table.startsWith(scheduler)) continue
    tables[table] = table === subjects || table === heads || table === schedule
      ? rows(table).map(row => Object.fromEntries(fields(row)))
      : [...(prior.tables[table] ?? []), ...(appended.get(table) ?? []).map(row => Object.fromEntries(fields(row)))]
  }
  for (const table of [ownerOperations, case1Retirements])
    tables[table] = await proof.value<Row[]>('(SELECT coalesce(jsonb_agg(to_jsonb(r)),\'[]\'::jsonb) FROM ' + table + ' r)', creator)
  assert.equal(tables[queue]!.length, 46); assert.equal(tables[starts]!.length, 12)
  assert.equal(tables['official_v3_result_private.versions_v1']!.length, 6)
  assert.equal(tables['official_v3_result_private.originals_v1']!.length, 26)
  assert.equal(tables['official_v3_result_private.qualifications_v1']!.length, 14)
  assert.equal(tables[ownerOperations]!.length, 5); assert.equal(tables[case1Retirements]!.length, 1)
  return { tables }
}
