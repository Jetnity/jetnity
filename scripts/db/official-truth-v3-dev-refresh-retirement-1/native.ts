// Owned socket-free PG17 only. Redacted copied business history is a local
// fixture, never a live publication, Owner decision or unattended proof.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { gunzipSync } from 'node:zlib'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { baseSetup, methodSeed } from '../official-truth-v3-customer-information-1/native'
import { localExecutors } from '../official-truth-v3-customer-information-1/history-claim-native'
import { createV3PostgresResultJobs } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import { hrs1Canonical, hrs1Clock } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { retainedChDeClaim, chDeRefreshRequestIdentity } from '../../../lib/readiness/official-truth-product-v3/jobs/selected-claim'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { compileRefreshRetirementMigration, BASELINE, RETIREMENTS } from './build.mjs'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;SET search_path=pg_catalog;'
const creator = 'SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const id = (tag: string) => 'op3_' + hash('owned-refresh-retirement:' + tag).slice(0, 32)
type Row = Record<string, unknown>
type Fixture = { schema: number; scope: string; tables: Record<string, Row[]> }
type ColumnTypes = Record<string, { json: boolean; notNull: boolean }>
const localToken = (attempt: string) => hash('SYNTHETIC LOCAL M04 ONLY:' + attempt)
function fixture() {
  const manifest = JSON.parse(readFileSync(new URL('./local-history-manifest.json', import.meta.url), 'utf8'))
  assert.equal(manifest.file, 'local-history.json.gz')
  const compressed = readFileSync(new URL('./local-history.json.gz', import.meta.url))
  assert.equal(hash(compressed), manifest.gzipSha256)
  const raw = gunzipSync(compressed, { maxOutputLength: 6 * 1024 * 1024 })
  assert.equal(raw.length, manifest.bytes); assert.equal(hash(raw), manifest.sha256)
  const value = JSON.parse(raw.toString('utf8')) as Fixture
  assert.equal(value.schema, 1); assert.equal(value.scope, 'owned-local-pg17-redacted-dev-history')
  const inspect = (item: unknown) => {
    if (item && typeof item === 'object') for (const [key, field] of Object.entries(item)) {
      assert.doesNotMatch(key, /token|secret|authorization|password|cookie|actor_id/i, 'no live credential or actor field in retained fixture')
      inspect(field)
    }
  }
  inspect(value.tables)
  for (const table of Object.keys(value.tables)) assert.match(table, /^official_v3_(?:jobs|intake|result|guard)_private\.[a-z0-9_]+$/)
  // Every withheld credential is replaced with explicitly synthetic local
  // material. No omitted token is inferred, recovered or reconstructed.
  for (const [table, rows] of Object.entries(value.tables)) for (const row of rows) {
    if (table.startsWith('official_v3_intake_private.')) {
      const operation = String(row.operation_id), text = hash('SYNTHETIC LOCAL S1 ONLY:' + operation)
      row.lease_token = text.slice(0, 8) + '-' + text.slice(8, 12) + '-4' + text.slice(13, 16)
        + '-8' + text.slice(17, 20) + '-' + text.slice(20, 32)
    }
    if (table.endsWith('execution_starts_v1')) row.token_hash = hash(localToken(String(row.attempt_key)))
    if (table.endsWith('owner_operations_v1')) row.actor_id = uid(1)
  }
  return value
}
const identifier = (s: string) => { assert.match(s, /^[a-z_]+$/); return '"' + s + '"' }
function sqlValue(value: unknown, column: ColumnTypes[string]) {
  if (value === null) {
    if (column.json) {
      assert.equal(column.notNull, true, 'a nullable JSON field requires separately captured SQL-null versus JSON-null evidence')
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
  return rows.map(row => 'INSERT INTO ' + table + '(' + Object.keys(row).map(identifier).join(',') + ') VALUES('
    + Object.entries(row).map(([key, value]) => { const type = columns[table + '.' + key]; assert.ok(type); return sqlValue(value, type) }).join(',') + ');').join('\n')
}
function updateSingleton(table: string, row: Row, columns: ColumnTypes) {
  return 'UPDATE ' + table + ' SET ' + Object.entries(row).filter(([key]) => key !== 'singleton')
    .map(([key, value]) => { const type = columns[table + '.' + key]; assert.ok(type); return identifier(key) + '=' + sqlValue(value, type) }).join(',') + ' WHERE singleton;'
}
const human = (person = 1) => 'SET SESSION AUTHORIZATION authenticated;SET search_path=pg_catalog;SELECT set_config(\'request.jwt.claims\','
  + literal(JSON.stringify({ sub: uid(person), session_id: uid(person + 200), role: 'authenticated', aal: person === 3 ? 'aal1' : 'aal2',
    exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) - 10 })) + ',false);'

export async function runRefreshRetirementNative(t: TestContext) {
  const compiled = compileRefreshRetirementMigration(), data = fixture()
  const evidence = JSON.parse(readFileSync(new URL('./original-evidence.json', import.meta.url), 'utf8'))
  const migration = readFileSync(new URL('./provider-migration-body.sql', import.meta.url), 'utf8')
  assert.equal(migration, compiled.migration)
  const readback = '(' + compiled.readback.slice(compiled.readback.indexOf('WITH catalog_checked')).trim().replace(/;$/, '') + ')'
  const proof = new OwnedPersistentProof(t.signal)
  const originalClaim = JSON.parse(evidence.start.claim_text)
  const executionRead = (claim: unknown, purpose = 'resume', direct = false) => {
    const wire = { operation: 'execution_read', phase: 'probe', body: { claim, purpose } }
    return direct ? 'official_v3_jobs_private.tx_execution_read_v1(' + json(wire) + ','
      + json(evidence.subject.method_binding) + ",1,5000,clock_timestamp()+interval '5 seconds')"
      : 'official_v3_jobs_api.execute_v1(' + [literal(hrs1Canonical(wire)), literal(program.binding.methodId), '1',
        literal(program.binding.methodDigest), literal(program.binding.packageDigest), 'NULL', '5000',
        literal(new Date(Date.now() + 5000).toISOString())].join(',') + ')'
  }
  const jobsCaller = 'SET SESSION AUTHORIZATION ot_m04_jobs;SET ROLE ot_v3_jobs_caller;'
  const refuses = async (sql: string, label: string, expected: RegExp) => {
    const output = await proof.run(sql, label, new RegExp(expected.source + '|current transaction is aborted'))
    assert.match(output, expected, 'the original refusal is observed')
  }
  const historyTables = Object.keys(data.tables).filter(table => !table.endsWith('subjects_v1') && !table.endsWith('heads_v1') && !table.endsWith('monitor_schedule_v1'))
  const retained = (tables: string[], prefixOnly = false) => 'jsonb_build_object(' + tables.map(table => literal(table)
    + ",(SELECT jsonb_build_object('count',count(*),'digest',encode(sha256(convert_to(COALESCE(string_agg(to_jsonb(r)::text,'' ORDER BY to_jsonb(r)::text COLLATE \"C\"),''),'UTF8')),'hex')) FROM "
    + table + ' r' + (prefixOnly && table.startsWith('official_v3_jobs_private.')
      ? ' WHERE ' + (table.endsWith('queue_operations_v1') ? 'operation_id' : 'attempt_key') + ' IN('
        + data.tables[table]!.map(row => literal(String(row[table.endsWith('queue_operations_v1') ? 'operation_id' : 'attempt_key']))).join(',') + ')' : '') + ')').join(',') + ')'
  const metadata = `to_jsonb(encode(sha256(convert_to((SELECT jsonb_agg(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'] ORDER BY p.oid)
    FROM pg_proc p WHERE p.oid=ANY(ARRAY[${compiled.inventory.map(f => literal(f.signature) + '::regprocedure').join(',')}]))::text,'UTF8')),'hex'))`
  const authority = `(SELECT jsonb_build_object('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
    'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),
    'schema',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')))`
  try {
    await baseSetup(proof)
    const columnTypes = () => proof.value<ColumnTypes>(`(SELECT jsonb_object_agg(n.nspname||'.'||c.relname||'.'||a.attname,
      jsonb_build_object('json',a.atttypid IN ('json'::regtype,'jsonb'::regtype),'notNull',a.attnotnull))
      FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind='r' AND n.nspname LIKE 'official_v3_%_private')`, owner)
    let columns = await columnTypes()
    const firstOperation = [...data.tables['official_v3_jobs_private.queue_operations_v1']!]
      .sort((a, b) => String(a.recorded_at).localeCompare(String(b.recorded_at)))[0]!
    assert.equal(firstOperation.action, 'enqueue')
    const initialSubject = { ...evidence.subject, current_job: JSON.parse(String(firstOperation.envelope_text)).next,
      operation_count: 1, start_count: 0, open_attempt: null, terminal_credit_claim: null }
    await proof.run(owner + "BEGIN;SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';"
      + methodSeed('2026-11-12T00:00:00.000Z')
      + 'UPDATE official_v3_jobs_private.slots_v1 SET job_key=' + literal(evidence.subject.job_key) + ' WHERE slot_id=1;'
      + insert('official_v3_jobs_private.subjects_v1', [initialSubject], columns)
      + insert('official_v3_jobs_private.queue_operations_v1', [firstOperation], columns) + 'COMMIT;',
    'synthetic local method actor and genuine first queued prefix before installed guard chain')
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql',
      'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql'])
      await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-background-guard-1/' + file) + 'COMMIT;', 'exact predecessor ' + file)
    for (const directory of ['official-truth-v3-rolling-jobs-quota-1', 'official-truth-v3-customer-information-1'])
      await proof.run(creator + 'BEGIN;' + readSql(directory + '/provider-migration-body.sql') + 'COMMIT;', 'exact predecessor ' + directory)
    columns = await columnTypes()
    // Seed copied, redacted business facts only in the newly owned local
    // database. Old guards stay installed and validate the complete fixture.
    const rows = (table: string) => data.tables[table]!
    const sequence = ['official_v3_intake_private.operations_v1', 'official_v3_intake_private.reservations_v1',
      'official_v3_intake_private.completions_v1', 'official_v3_jobs_private.queue_operations_v1',
      'official_v3_jobs_private.execution_starts_v1', 'official_v3_jobs_private.execution_results_v1', 'official_v3_jobs_private.execution_dispositions_v1',
      'official_v3_result_private.originals_v1', 'official_v3_result_private.extractions_v1', 'official_v3_result_private.qualifications_v1',
      'official_v3_result_private.decisions_v1', 'official_v3_result_private.archive_pages_v1', 'official_v3_result_private.versions_v1',
      'official_v3_result_private.projections_v1', 'official_v3_result_private.operations_v1', 'official_v3_result_private.outbox_v1',
      'official_v3_guard_private.owner_operations_v1', 'official_v3_guard_private.retired_attempts_v1', 'official_v3_guard_private.retired_later_attempts_v1']
    for (const table of sequence) {
      const remaining = rows(table).filter(row => table !== 'official_v3_jobs_private.queue_operations_v1'
        || row.operation_id !== firstOperation.operation_id)
      const ordered = [...remaining].sort((a, b) => table.endsWith('versions_v1') ? Number(a.revision) - Number(b.revision)
        : table.endsWith('decisions_v1') ? String((a.record as Row).evaluatedAt).localeCompare(String((b.record as Row).evaluatedAt)) : 0)
      if (ordered.length) await proof.run(owner + insert(table, ordered, columns), 'local redacted fixture ' + table)
    }
    await proof.run(owner + 'UPDATE official_v3_jobs_private.subjects_v1 SET current_job=' + json(evidence.subject.current_job)
      + ',operation_count=41,start_count=9,open_attempt=' + literal(evidence.subject.open_attempt)
      + ',terminal_credit_claim=' + literal(evidence.subject.terminal_credit_claim)
      + ' WHERE job_key=' + literal(evidence.subject.job_key) + ';'
      + updateSingleton('official_v3_result_private.heads_v1', rows('official_v3_result_private.heads_v1')[0]!, columns)
      + updateSingleton('official_v3_result_private.monitor_schedule_v1', rows('official_v3_result_private.monitor_schedule_v1')[0]!, columns)
      + 'UPDATE official_v3_result_private.binding_v1 SET state_certificate=official_v3_result_private.state_fingerprint_v1() WHERE singleton;'
      + 'SELECT official_v3_guard_private.seal_s1_v1();SELECT official_v3_guard_private.seal_jobs_v1();'
      + 'SELECT official_v3_guard_private.check_retirements_v1();SELECT official_v3_guard_private.check_certificates_v1();',
    'complete copied history validates with synthetic local credentials and unchanged installed checks')
    const oldTables = await proof.value<string[]>(`(SELECT jsonb_agg(format('%I.%I',n.nspname,c.relname) ORDER BY n.nspname,c.relname)
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN
        ('official_v3_method_private','official_v3_intake_private','official_v3_jobs_private','official_v3_result_private','official_v3_guard_private'))`, owner)
    const before = await proof.value(retained(oldTables), creator)
    const beforeMetadata = await proof.value(metadata, creator), beforeAuthority = await proof.value(authority, creator)

    await t.test('wrong target, wrong original, predecessor drift and residual privileges each roll back', async () => {
      const faults = [
        { prefix: '', body: migration.replace("SET LOCAL jetnity.refresh_retirement_target='dev:", "SET LOCAL jetnity.refresh_retirement_target='wrong:"), error: /exact unused Dev predecessor/ },
        { prefix: owner + "UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL;" + creator, body: migration, error: /exact expired unknown original/ },
        { prefix: owner + "ALTER FUNCTION official_v3_guard_private.recovery_jobs_v1() SET statement_timeout='1s';" + creator, body: migration, error: /predecessor catalog mismatch/ },
        { prefix: '', body: migration.replace('REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;', ''), error: /exact authority restoration/ },
        { prefix: '', body: migration.replace('REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner,ot_v3_result_owner;', ''), error: /exact authority restoration/ },
      ]
      for (const fault of faults) {
        await refuses(creator + 'BEGIN;' + fault.prefix + fault.body + 'ROLLBACK;', 'refused precise refresh successor', fault.error)
        assert.deepEqual(await proof.value(retained(oldTables), creator), before)
        assert.equal(await proof.value('to_jsonb(to_regclass(' + literal(BASELINE) + ') IS NULL)', creator), true)
      }
    })
    await t.test('a real previous BG1 proof cannot admit the successor without its new boundary', async () => {
      await proof.run(creator + 'BEGIN;SELECT official_v3_guard_private.audit_v1();SELECT official_v3_guard_private.require_open_v1();'
        + migration + 'ROLLBACK;', 'actual prior proof rejected by immutable successor boundary')
      assert.deepEqual(await proof.value(retained(oldTables), creator), before)
    })
    await proof.run(creator + 'BEGIN;' + migration + 'COMMIT;', 'exact additive refresh retirement installation')
    await t.test('all original rows, function identities and permissions survive the exact provider body', async () => {
      assert.deepEqual(await proof.value(retained(oldTables), creator), before)
      assert.deepEqual(await proof.value(metadata, creator), beforeMetadata)
      assert.deepEqual(await proof.value(authority, creator), beforeAuthority)
      const result = await proof.value<Record<string, unknown>>(readback, creator)
      for (const key of ['installed', 'catalog_verified', 'definitions_verified', 'predecessor_verified', 'original_evidence_verified']) assert.equal(result[key], true, key)
      assert.equal(result.retired, 0)
      assert.deepEqual(result.admission, { schema: 1, status: 'unavailable' })
      await refuses(creator + 'BEGIN;' + migration + 'ROLLBACK;', 'immutable install cannot replay', /exact unused Dev predecessor/)
    })
    await t.test('one genuine complete BG1 opens the new exact review without changing any source result', async () => {
      const started = performance.now()
      assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
      t.diagnostic('actual complete PG17 BG1 milliseconds: ' + (performance.now() - started).toFixed(2))
      assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'current' })
      await proof.run(creator + 'SELECT official_v3_guard_private.check_jobs_v1();SELECT official_v3_guard_private.check_hrs_v1();', 'full old history remains valid')
    })
    const review = await proof.value<{ retirement: { status: string; selection: string; attempt: number; originals: number; qualifications: number; acceptedVersions: number } }>(
      'public.official_v3_guard_review_v1()', human())
    const selection = review.retirement.selection, operation = id('retire')
    const call = 'public.official_v3_guard_retire_v1(' + literal(operation) + ',' + literal(selection ?? 'missing') + ')'
    await t.test('existing Owner/AAL2 review truthfully scopes the new attempt and retains five earlier publications', async () => {
      assert.equal(review.retirement.status, 'reviewable')
      assert.deepEqual([review.retirement.attempt, review.retirement.originals, review.retirement.qualifications, review.retirement.acceptedVersions], [1, 2, 1, 0])
      for (const person of [2, 3]) await refuses(human(person) + 'SELECT ' + call + ';', 'non-owner or AAL1 refused', /owner|authority|session|aal|privilege|permission/i)
      await refuses(creator + 'SELECT ' + call + ';', 'provider alone has no Owner session', /owner|authority|session|aal|privilege|permission/i)
      await refuses(human() + 'SELECT public.official_v3_guard_retire_v1(' + literal(operation) + ',' + literal('0'.repeat(64)) + ');', 'review selection compare is mandatory', /reviewed state changed/)
      await refuses(owner + 'BEGIN;UPDATE official_v3_jobs_private.subjects_v1 SET terminal_credit_claim=NULL;' + human()
        + 'SELECT ' + call + ';ROLLBACK;', 'full reviewed subject cannot change', /certified content|expired refresh original|reviewed state changed/)
      assert.equal(await proof.value('(SELECT to_jsonb(count(*)) FROM ' + RETIREMENTS + ')', creator), 0)
      assert.deepEqual(await proof.value(executionRead(originalClaim), jobsCaller), { status: 'blocked' })
      // Isolate missing retirement from the outer custody gate. This is a
      // rolled-back local adversarial fixture, never a live repair or result.
      assert.deepEqual(await proof.value(executionRead(originalClaim, 'resume', true),
        owner + 'BEGIN;UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL;', 'ROLLBACK;'),
      { reply: { status: 'blocked' }, authority: false })
    })
    const preservedBeforeRetire = await proof.value(retained(historyTables.filter(t => t !== 'official_v3_guard_private.owner_operations_v1')), creator)
    await t.test('same original is retired once, separately confirmed, and never relabelled successful or failed', async () => {
      const started = performance.now()
      const receipt = await proof.value<Record<string, unknown>>(call, human())
      t.diagnostic('actual Owner/AAL2 PG17 retirement milliseconds: ' + (performance.now() - started).toFixed(2))
      assert.equal(receipt.result, 'unknown_retired')
      assert.deepEqual(await proof.value('public.official_v3_guard_confirm_v1(' + literal(operation) + ",'retire_unknown'," + literal(selection) + ')', human()), receipt)
      assert.deepEqual(await proof.value(call, human()), receipt)
      assert.deepEqual(await proof.value(retained(historyTables.filter(t => t !== 'official_v3_guard_private.owner_operations_v1')), creator), preservedBeforeRetire)
      const state = await proof.value<{ subject: Row; versions: number; publications: number; first: number; later: number; refresh: number; results: number; dispositions: number }>(`(SELECT jsonb_build_object(
        'subject',(SELECT to_jsonb(s) FROM official_v3_jobs_private.subjects_v1 s),
        'versions',(SELECT count(*) FROM official_v3_result_private.versions_v1),
        'publications',(SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication'),
        'first',(SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1),
        'later',(SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1),
        'refresh',(SELECT count(*) FROM ${RETIREMENTS}),
        'results',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=${literal(evidence.start.attempt_key)}),
        'dispositions',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=${literal(evidence.start.attempt_key)})))`, creator)
      assert.deepEqual(state.subject, { ...evidence.subject, open_attempt: null })
      assert.deepEqual([state.versions, state.publications, state.first, state.later, state.refresh, state.results, state.dispositions], [5, 5, 1, 2, 1, 0, 0])
      assert.equal((await proof.value<{ retirement: { status: string } }>('public.official_v3_guard_review_v1()', human())).retirement.status, 'closed')
      await proof.run(creator + 'SELECT official_v3_guard_private.check_retirements_v1();SELECT official_v3_guard_private.check_jobs_v1();'
        + 'SELECT official_v3_guard_private.check_hrs_v1();SELECT official_v3_guard_private.check_certificates_v1();', 'all old and new guards still validate')
    })
    await t.test('actual late intake endpoints stay fenced while all old receipts and published versions remain immutable', async () => {
      const intake = 'SET SESSION AUTHORIZATION ot_m04_intake;SET ROLE ot_v3_intake_caller;'
      const original = data.tables['official_v3_intake_private.operations_v1']!.find(row => row.operation_id === evidence.intake.operation_id)!
      const originalText = Buffer.from(String(original.original_bytes).slice(2), 'hex').toString('utf8')
      assert.equal(hash(originalText), evidence.intake.proposal_digest)
      const args = json(evidence.intake.binding) + ',' + literal(originalText) + ',' + literal(evidence.intake.proposal_digest)
      assert.deepEqual(await proof.value('official_v3_intake_api.capture_v1(' + args + ')', intake), { status: 'unconfirmed' })
      assert.deepEqual(await proof.value('official_v3_intake_api.reserve_v1(' + json(evidence.intake.binding) + ','
        + literal(evidence.intake.proposal_digest) + ',' + evidence.intake.bytes + ',5000)', intake), { status: 'unconfirmed' })
      const latePrepare = { operation: 'execution_prepare', phase: 'authorized', body: {
        claim: originalClaim, attemptKey: evidence.start.attempt_key, token: localToken(evidence.start.attempt_key),
        result: { kind: 'rule_research', jobId: evidence.subject.current_job.jobId, operationId: evidence.subject.current_job.operationId,
          jobKey: evidence.subject.job_key, preparedAt: new Date().toISOString(), decisionRef: evidence.qualification.decisionRef },
        references: [{ binding: evidence.intake.binding, proposalDigest: evidence.intake.proposal_digest, bytes: evidence.intake.bytes }],
      } }
      const lateWire = hrs1Canonical(latePrepare)
      assert.deepEqual(await proof.value('official_v3_jobs_private.wire_v1(' + literal(lateWire) + ')', owner), latePrepare)
      const nativeArguments = [literal(lateWire), literal(program.binding.methodId), '1', literal(program.binding.methodDigest),
        literal(program.binding.packageDigest), '1', '5000', literal(new Date(Date.now() + 5000).toISOString())].join(',')
      assert.deepEqual(await proof.value('official_v3_jobs_api.execute_v1(' + nativeArguments + ')',
        jobsCaller), { status: 'blocked' })
      assert.equal(await proof.value('to_jsonb(official_v3_guard_private.attempt_retired_v1(' + literal(evidence.start.attempt_key) + '))', creator), true)
      assert.equal(await proof.value('to_jsonb(official_v3_guard_private.intake_retired_v1(' + literal(evidence.intake.operation_id) + '))', creator), true)
      for (const table of [BASELINE, RETIREMENTS]) {
        for (const action of ['DELETE FROM ', 'TRUNCATE ']) await refuses(creator + 'BEGIN;' + action + table + ';ROLLBACK;', 'new records immutable', /immutable/)
        for (const role of ['anon', 'authenticated', 'service_role', 'ot_v3_jobs_owner', 'ot_v3_intake_owner', 'ot_v3_result_owner'])
          await refuses('SET SESSION AUTHORIZATION ' + role + ';SELECT * FROM ' + table + ';', 'no direct state authority', /permission denied/)
      }
      assert.deepEqual(await proof.value(retained(historyTables.filter(t => t !== 'official_v3_guard_private.owner_operations_v1')), creator), preservedBeforeRetire)
      assert.deepEqual(await proof.value(metadata, creator), beforeMetadata)
      assert.deepEqual(await proof.value(authority, creator), beforeAuthority)
    })
    await t.test('only the exact retired resume is absent; other purposes, original claims and subject drift remain fenced', async () => {
      assert.deepEqual(await proof.value(executionRead(originalClaim), jobsCaller), { status: 'absent' })
      for (const purpose of ['lookup', 'confirm', 'artifact'])
        assert.deepEqual(await proof.value(executionRead(originalClaim, purpose), jobsCaller), { status: 'blocked' })
      assert.deepEqual(await proof.value(executionRead({ ...originalClaim, leaseId: 'lease3_' + 'f'.repeat(32) }), jobsCaller), { status: 'collision' })
      const firstRetired = data.tables['official_v3_guard_private.retired_attempts_v1']![0]!
      const oldStart = data.tables['official_v3_jobs_private.execution_starts_v1']!.find(row => row.attempt_key === firstRetired.attempt_key)!
      assert.deepEqual(await proof.value(executionRead(JSON.parse(String(oldStart.claim_text))), jobsCaller), { status: 'blocked' })
      for (const change of ["open_attempt=" + literal(evidence.start.attempt_key), 'start_count=start_count+1', 'terminal_credit_claim=NULL'])
        assert.deepEqual(await proof.value(executionRead(originalClaim, 'resume', true),
          owner + 'BEGIN;UPDATE official_v3_jobs_private.subjects_v1 SET ' + change + ';', 'ROLLBACK;'),
        { reply: { status: 'blocked' }, authority: false })
      await refuses(creator + 'BEGIN;UPDATE ' + RETIREMENTS + " SET before_state=jsonb_set(before_state,'{originalEvidenceDigest}',to_jsonb(repeat('0',64)));ROLLBACK;",
        'retirement receipt cannot be changed', /immutable/)
      // Owned local corruption probes, always rolled back. Restore the trigger
      // before reading so the actual normal endpoint must reject the missing
      // or altered Owner receipt, independently of a catalog-drift refusal.
      const ownerTable = 'official_v3_guard_private.owner_operations_v1'
      for (const change of ['DELETE FROM ' + ownerTable,
        'UPDATE ' + ownerTable + " SET expected_digest=repeat('0',64)",
        'UPDATE ' + ownerTable + " SET receipt=jsonb_set(receipt,'{selection}',to_jsonb(repeat('0',64)))"]) {
        const prefix = creator + 'BEGIN;ALTER TABLE ' + ownerTable + ' DISABLE TRIGGER immutable_v1;'
          + change + ' WHERE operation_id=' + literal(operation) + ';ALTER TABLE ' + ownerTable + ' ENABLE TRIGGER immutable_v1;'
          + jobsCaller
        assert.deepEqual(await proof.value(executionRead(originalClaim), prefix, 'ROLLBACK;'), { status: 'blocked' })
      }
      assert.deepEqual(await proof.value(retained(historyTables.filter(t => t !== 'official_v3_guard_private.owner_operations_v1')), creator), preservedBeforeRetire)
    })
    await t.test('the retained original request selects and starts its ordinary deterministic next claim', async () => {
      const bridge = localExecutors(proof), root = JSON.parse(evidence.start.claim_text)
      assert.deepEqual(chDeRefreshRequestIdentity(root), { jobId: evidence.subject.current_job.jobId, operationId: evidence.subject.current_job.operationId })
      const next = retainedChDeClaim(root, 1); assert.ok(next)
      let produced = 0
      const resultUnavailable = { async executeFixed() { return { status: 'unconfirmed' as const } } }
      const facade = createV3PostgresResultJobs({
        binding: evidence.subject.method_binding, registry: program.registry,
        clock() { const clock = hrs1Clock(new Date().toISOString(), program.legalTimeZone); assert.ok(clock); return clock },
        methodExecutor: bridge.method, jobsExecutor: bridge.jobs, intakeExecutor: bridge.intake,
        producer: { async produce() { produced++; return { status: 'failed' as const, reason: 'unreachable' as const } } },
        result: { binding: program.binding, writerExecutor: resultUnavailable, readerExecutor: resultUnavailable,
          verifierExecutor: resultUnavailable, ids: () => ({ operationId: id('normal-next-result'), jobId: 'job3_' + hash('normal-next-result').slice(0, 32) }) },
      })
      const outcome = await facade.workSelectedOnce('rule_research', t.signal, { deadline: performance.now() + 30000 },
        { operationId: root.operationId, leaseId: root.leaseId })
      await bridge.drain()
      t.diagnostic('actual retained selected follow-up: ' + JSON.stringify({ outcome, produced,
        calls: bridge.events.map(event => ({ operation: event.operation, purpose: event.purpose, status: event.status, error: event.error })) }))
      const claim = bridge.events.find(event => event.operation === 'queue_claim' && event.status === 'committed')
      assert.ok(claim?.record); assert.equal(claim.record.attempt, 2); assert.equal(claim.record.jobId, evidence.subject.current_job.jobId)
      assert.equal(claim.record.lease?.leaseId, next.leaseId)
      assert.ok(claim.envelopeText)
      assert.deepEqual(JSON.parse(claim.envelopeText).expected, evidence.subject.current_job)
      assert.ok(bridge.events.some(event => event.operation === 'execution_read' && event.status === 'absent'))
      assert.ok(bridge.events.some(event => event.operation === 'queue_confirm' && event.status === 'committed'))
      assert.ok(bridge.events.some(event => event.operation === 'execution_start' && event.status === 'reserved'))
      assert.equal(produced, 1)
      assert.deepEqual(await proof.value(retained(historyTables.filter(t => t !== 'official_v3_guard_private.owner_operations_v1'), true), creator), preservedBeforeRetire)
      await proof.run(creator + 'SELECT official_v3_guard_private.check_retirements_v1();SELECT official_v3_guard_private.check_jobs_v1();'
        + 'SELECT official_v3_guard_private.check_hrs_v1();SELECT official_v3_guard_private.check_certificates_v1();', 'real following attempt preserves all old custody and permanent fences')
      assert.deepEqual(await proof.value(executionRead(originalClaim), jobsCaller), { status: 'blocked' })
      assert.equal(bridge.active(), 0)
    })
  } finally { await proof.close() }
}
