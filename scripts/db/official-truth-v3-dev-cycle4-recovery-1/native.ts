// Owned socket-free PG17 only. Redacted copied business history is a local
// fixture, never a live publication, Owner decision or unattended proof.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { setTimeout as delay } from 'node:timers/promises'
import type { TestContext } from 'node:test'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { createV3PostgresResultJobs } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import { hrs1Canonical, hrs1Clock } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { retainedChDeClaim, chDeRefreshRequestIdentity } from '../../../lib/readiness/official-truth-product-v3/jobs/selected-claim'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { compileCycle4RecoveryMigration, BASELINE, RETIREMENTS } from './build.mjs'
import { prepareCycle4RecoveryFixture } from './history-fixture'
import { historicalPublicWire, publicationExecutors, reviewedOriginals } from './local-publication'
import { historyGuardCadence } from '../official-truth-v3-customer-information-1/history-bg1-cadence-native'
import { AA_CH_DE_DELIVERY_PRODUCER } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-delivery-producer'
import type { V3ManagedJobRecord } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { compileDevTerminalCycle4Review, REVIEW } from './cycle4-review.mjs'
import type { M04Claim } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;SET search_path=pg_catalog;'
const creator = 'SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const id = (tag: string) => 'op3_' + hash('owned-cycle4-recovery:' + tag).slice(0, 32)
type Row = Record<string, unknown>
const localToken = (attempt: string) => hash('SYNTHETIC LOCAL M04 ONLY:' + attempt)
const human = (person = 1) => 'SET SESSION AUTHORIZATION authenticated;SET search_path=pg_catalog;SELECT set_config(\'request.jwt.claims\','
  + literal(JSON.stringify({ sub: uid(person), session_id: uid(person + 200), role: 'authenticated', aal: person === 3 ? 'aal1' : 'aal2',
    exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) - 10 })) + ',false);'

export async function runCycle4RecoveryNative(t: TestContext) {
  const compiled = compileCycle4RecoveryMigration()
  let data: { tables: Record<string, Row[]> }
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
  const keys: Record<string, string[]> = {
    queue_operations_v1: ['operation_id'], execution_starts_v1: ['attempt_key'], execution_results_v1: ['attempt_key'],
    execution_dispositions_v1: ['attempt_key'], operations_v1: ['operation_id'], reservations_v1: ['operation_id','generation'],
    completions_v1: ['operation_id'], originals_v1: ['version_id'], extractions_v1: ['version_id'], qualifications_v1: ['reference'],
    decisions_v1: ['reference'], archive_pages_v1: ['reference'], versions_v1: ['reference'], projections_v1: ['reference'],
    outbox_v1: ['escalation_key'], owner_operations_v1: ['operation_id'], retired_attempts_v1: ['attempt_key'],
    retired_later_attempts_v1: ['attempt_key'], retired_refresh_attempts_v1: ['attempt_key'],
  }
  const retained = (tables: string[], prefixOnly = false) => '(SELECT jsonb_object_agg(name,value) FROM (VALUES ' + tables.map(table => {
    const fields = table === 'official_v3_result_private.operations_v1' ? ['operation_kind','operation_id'] : keys[table.split('.')[1]!]!
    const originalKeys = prefixOnly ? data.tables[table]!.map(row => Object.fromEntries(fields.map(key => [key, row[key]]))) : []
    const where = prefixOnly ? ' WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(' + json(originalKeys)
      + ') original WHERE ' + fields.map(key => 'to_jsonb(r)->' + literal(key) + '=original->' + literal(key)).join(' AND ') + ')' : ''
    return '(' + literal(table) + ",(SELECT jsonb_build_object('count',count(*),'digest',encode(sha256(convert_to(COALESCE(string_agg(to_jsonb(r)::text,'' ORDER BY to_jsonb(r)::text COLLATE \"C\"),''),'UTF8')),'hex')) FROM "
      + table + ' r' + where + '))'
  }).join(',') + ') items(name,value))'
  const metadata = `to_jsonb(encode(sha256(convert_to((SELECT jsonb_agg(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'] ORDER BY p.oid)
    FROM pg_proc p WHERE p.oid=ANY(ARRAY[${compiled.inventory.map(f => literal(f.signature) + '::regprocedure').join(',')}]))::text,'UTF8')),'hex'))`
  const authority = `(SELECT jsonb_build_object('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
    'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),
    'schema',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')))`
  try {
    data = await prepareCycle4RecoveryFixture(proof)
    const historyTables = Object.keys(data.tables).filter(table => !table.endsWith('subjects_v1') && !table.endsWith('heads_v1')
      && !table.endsWith('monitor_schedule_v1') && !table.startsWith('jetnity_dev_import_scheduler.'))
    const oldTables = await proof.value<string[]>(`(SELECT jsonb_agg(format('%I.%I',n.nspname,c.relname) ORDER BY n.nspname,c.relname)
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN
        ('official_v3_method_private','official_v3_intake_private','official_v3_jobs_private','official_v3_result_private','official_v3_guard_private','jetnity_dev_import_scheduler'))`, owner)
    const before = await proof.value(retained(oldTables), creator)
    const beforeMetadata = await proof.value(metadata, creator), beforeAuthority = await proof.value(authority, creator)

    await t.test('wrong target, wrong original, predecessor drift and residual privileges each roll back', async () => {
      const faults = [
        { prefix: '', body: migration.replace("SET LOCAL jetnity.cycle4_recovery_target='dev:", "SET LOCAL jetnity.cycle4_recovery_target='wrong:"), error: /exact unused Dev predecessor/ },
        { prefix: owner + "UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL;" + creator, body: migration, error: /exact expired unknown original/ },
        { prefix: owner + "ALTER FUNCTION official_v3_guard_private.recovery_jobs_v1() SET statement_timeout='1s';" + creator, body: migration, error: /predecessor catalog mismatch/ },
        { prefix: '', body: migration.replace('REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;', ''), error: /exact authority restoration/ },
        { prefix: '', body: migration.replace('REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner,ot_v3_result_owner;', ''), error: /exact authority restoration/ },
      ]
      for (const fault of faults) {
        await refuses(creator + 'BEGIN;' + fault.prefix + fault.body + 'ROLLBACK;', 'refused precise cycle4 successor', fault.error)
        assert.deepEqual(await proof.value(retained(oldTables), creator), before)
        assert.equal(await proof.value('to_jsonb(to_regclass(' + literal(BASELINE) + ') IS NULL)', creator), true)
      }
    })
    await t.test('a real previous BG1 proof cannot admit the successor without its new boundary', async () => {
      await proof.run(creator + 'BEGIN;SELECT official_v3_guard_private.audit_v1();SELECT official_v3_guard_private.require_open_v1();'
        + migration + 'ROLLBACK;', 'actual prior proof rejected by immutable successor boundary')
      assert.deepEqual(await proof.value(retained(oldTables), creator), before)
    })
    await proof.run(creator + 'BEGIN;' + migration + 'COMMIT;', 'exact additive cycle4 retirement installation')
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
      // The local backend has no pg_cron worker. A completed five-minute slot
      // is immutable, so a same-slot audit cannot satisfy the new baseline.
      // Wait for the real next scheduled slot; no clock/proof row is rewritten.
      type Due = { generation: number; required: number; proofBoundary: string; proofStarted: string;
        nextDue: string; lastDue: string; incident: number; resumed: number; untilDue: number; remaining: number }
      const due = () => proof.value<Due>(`(WITH instant AS MATERIALIZED (SELECT clock_timestamp() AS at)
        SELECT jsonb_build_object('generation',s.generation,'required',b.required_generation,
          'proofBoundary',b.proof_not_before,'proofStarted',s.last_proof_started,'lastDue',s.last_due,
          'nextDue',s.last_due+interval '5 minutes','incident',s.incident_generation,'resumed',s.resumed_generation,
          'untilDue',extract(epoch FROM s.last_due+interval '5 minutes'-instant.at)*1000,
          'remaining',extract(epoch FROM s.valid_until-instant.at)*1000)
        FROM official_v3_guard_private.state_v1 s CROSS JOIN ${BASELINE} b CROSS JOIN instant
        WHERE s.singleton AND b.singleton)`, creator)
      const original = await due()
      assert.ok(original.generation > 0 && original.required > original.generation)
      assert.equal(original.incident, original.resumed)
      t.diagnostic('actual post-install BG1 scheduled wait: ' + JSON.stringify(original))
      let before = original
      for (;;) {
        t.signal.throwIfAborted()
        assert.equal(before.generation, original.generation)
        assert.equal(before.incident, original.incident); assert.equal(before.resumed, original.resumed)
        assert.equal(before.nextDue, original.nextDue); assert.equal(before.proofBoundary, original.proofBoundary)
        assert.ok(before.remaining > 0, 'never heal an expired proof or incident with a late audit')
        if (before.untilDue <= 0) break
        await delay(Math.min(20000, Math.ceil(before.untilDue) + 1), undefined, { signal: t.signal })
        before = await due()
      }
      const started = performance.now()
      assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
      t.diagnostic('actual complete PG17 BG1 milliseconds: ' + (performance.now() - started).toFixed(2))
      const after = await due()
      assert.equal(after.generation, original.generation + 1)
      assert.ok(after.generation >= after.required)
      assert.equal(after.lastDue, original.nextDue)
      assert.ok(Date.parse(after.proofStarted) >= Date.parse(after.proofBoundary))
      assert.equal(after.incident, original.incident); assert.equal(after.resumed, original.resumed)
      assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'current' })
      await proof.run(creator + 'SELECT official_v3_guard_private.check_jobs_v1();SELECT official_v3_guard_private.check_hrs_v1();', 'full old history remains valid')
    })
    const review = await proof.value<{ retirement: { status: string; selection: string; attempt: number; originals: number; qualifications: number; acceptedVersions: number } }>(
      'public.official_v3_guard_review_v1()', human())
    const selection = review.retirement.selection, operation = id('retire')
    const call = 'public.official_v3_guard_retire_v1(' + literal(operation) + ',' + literal(selection ?? 'missing') + ')'
    await t.test('existing Owner/AAL2 review truthfully scopes the new attempt and retains six earlier publications', async () => {
      assert.equal(review.retirement.status, 'reviewable')
      assert.deepEqual([review.retirement.attempt, review.retirement.originals, review.retirement.qualifications, review.retirement.acceptedVersions], [1, 2, 1, 0])
      for (const person of [2, 3]) await refuses(human(person) + 'SELECT ' + call + ';', 'non-owner or AAL1 refused', /owner|authority|session|aal|privilege|permission/i)
      await refuses(creator + 'SELECT ' + call + ';', 'provider alone has no Owner session', /owner|authority|session|aal|privilege|permission/i)
      await refuses(human() + 'SELECT public.official_v3_guard_retire_v1(' + literal(operation) + ',' + literal('0'.repeat(64)) + ');', 'review selection compare is mandatory', /reviewed state changed/)
      await refuses(owner + 'BEGIN;UPDATE official_v3_jobs_private.subjects_v1 SET terminal_credit_claim=NULL;' + human()
        + 'SELECT ' + call + ';ROLLBACK;', 'full reviewed subject cannot change', /certified content|expired cycle4 original|reviewed state changed/)
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
      const state = await proof.value<{ subject: Row; versions: number; publications: number; first: number; later: number; refresh: number; cycle4: number; results: number; dispositions: number }>(`(SELECT jsonb_build_object(
        'subject',(SELECT to_jsonb(s) FROM official_v3_jobs_private.subjects_v1 s),
        'versions',(SELECT count(*) FROM official_v3_result_private.versions_v1),
        'publications',(SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication'),
        'first',(SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1),
        'later',(SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1),
        'refresh',(SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1),
        'cycle4',(SELECT count(*) FROM ${RETIREMENTS}),
        'results',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=${literal(evidence.start.attempt_key)}),
        'dispositions',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=${literal(evidence.start.attempt_key)})))`, creator)
      assert.deepEqual(state.subject, { ...evidence.subject, open_attempt: null })
      assert.deepEqual([state.versions, state.publications, state.first, state.later, state.refresh, state.cycle4, state.results, state.dispositions], [6, 6, 1, 2, 1, 1, 0, 0])
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
    // The normal selected UI path and subsequent exact Cycle4 review are below.
    await runPublicationAndReview(t, proof, evidence, originalClaim, executionRead, jobsCaller,
      () => proof.value(retained(historyTables.filter(table => table !== 'official_v3_guard_private.owner_operations_v1'), true), creator),
      preservedBeforeRetire, refuses)

  } finally { await proof.close() }
}

type PublicationEvidence = {
  subject: { job_key: string; current_job: V3ManagedJobRecord;
    method_binding: Pick<typeof program.binding, 'methodId' | 'revision' | 'methodDigest' | 'packageDigest'> };
  cycle: { operation_id: string; lease_id: string };
  cycle3Review: { ci_run: number };
}
type PublicationState = {
  job: V3ManagedJobRecord; starts: number; results: number; completed: number;
  versions: number; projections: number; publications: number; openAttempt: boolean; terminalCredit: boolean;
}

async function runPublicationAndReview(t: TestContext, proof: OwnedPersistentProof, evidence: PublicationEvidence,
  root: M04Claim, executionRead: (claim: unknown, purpose?: string, direct?: boolean) => string, jobsCaller: string,
  prefix: () => Promise<unknown>, expectedPrefix: unknown,
  refuses: (sql: string, label: string, expected: RegExp) => Promise<void>) {
  const wire = historicalPublicWire(t, reviewedOriginals()), ports = publicationExecutors(proof)
  const guard = historyGuardCadence(t, proof)
  let serial = 0, produced = 0
  const facade = createV3PostgresResultJobs({ binding: evidence.subject.method_binding, registry: program.registry,
    clock() { const value = hrs1Clock(new Date().toISOString(), program.legalTimeZone); assert.ok(value); return value },
    methodExecutor: ports.method, jobsExecutor: ports.jobs, intakeExecutor: ports.intake,
    producer: { async produce(input, signal) { produced++; return AA_CH_DE_DELIVERY_PRODUCER.produce(input, signal) } },
    result: { binding: program.binding, writerExecutor: ports.writer, readerExecutor: ports.reader, verifierExecutor: ports.verifier,
      ids: () => { const tag = String(++serial); return { operationId: id('publication-' + tag), jobId: 'job3_' + hash(tag).slice(0, 32) } } } })
  t.mock.module(new URL('../../../lib/readiness/official-truth-product-v3/runtime/ch-de-server.ts', import.meta.url), {
    cache: true, namedExports: { officialTruthV3ChDeRuntime() { return facade } },
  })
  const { runOfficialTruthV3ChDeTick } = await import('../../../lib/readiness/official-truth-product-v3/runtime/ch-de-tick')
  const request = { schema: 2 as const, mode: 'resume' as const,
    operationId: evidence.cycle.operation_id, leaseId: evidence.cycle.lease_id }
  const state = () => proof.value<PublicationState>(`(SELECT jsonb_build_object('job',s.current_job,
    'starts',(SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1),
    'results',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1),
    'completed',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1 WHERE kind='completed'),
    'versions',(SELECT count(*) FROM official_v3_result_private.versions_v1),
    'projections',(SELECT count(*) FROM official_v3_result_private.projections_v1),
    'publications',(SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication'),
    'openAttempt',s.open_attempt IS NOT NULL,'terminalCredit',s.terminal_credit_claim IS NOT NULL)
    FROM official_v3_jobs_private.subjects_v1 s WHERE job_key=${literal(evidence.subject.job_key)})`, creator)
  const review = compileDevTerminalCycle4Review()
  const declaration = (version = 7) => `SET jetnity.dev_terminal_cycle4_review_target=${literal(REVIEW.target)};
    SET jetnity.dev_terminal_cycle4_review_ack=${literal(REVIEW.ack)};
    SET jetnity.dev_terminal_cycle4_review_commit='1111111111111111111111111111111111111111';
    SET jetnity.dev_terminal_cycle4_review_deployment='dpl_OwnedLocalFixtureOnly12345';
    SET jetnity.dev_terminal_cycle4_review_ci_run=${literal(String(evidence.cycle3Review.ci_run + 1))};
    SET jetnity.dev_terminal_cycle4_review_ui_version=${literal(String(version))};`
  const reviewBody = review.migration.replace(/^BEGIN;\n/m, '').replace(/COMMIT;\s*$/, '')
  try {
    await t.test('the later sender review refuses a retired but still unpublished original', async () => {
      await guard.admit('before unpublished Cycle4 refusal', 5000)
      await refuses(creator + declaration() + 'BEGIN;' + reviewBody + 'ROLLBACK;',
        'no sender admission before a real following publication', /publication|unresolved|succeeded|custody|terminal|attempt/i)
    })
    await t.test('the normal retained UI request makes its exact Attempt2, publishes and reaches the real visitor', async () => {
      assert.deepEqual(chDeRefreshRequestIdentity(root), { jobId: evidence.subject.current_job.jobId,
        operationId: evidence.subject.current_job.operationId })
      const next = retainedChDeClaim(root, 1); assert.ok(next)
      await guard.admit('Cycle4 original UI resume')
      const entered = performance.now(), enteredAt = Date.now()
      let outcome = await runOfficialTruthV3ChDeTick(t.signal, request)
      await ports.drain()
      let final = await state()
      t.diagnostic('actual Cycle4 selected tick: ' + JSON.stringify({ milliseconds: performance.now() - entered,
        outcome, jobState: final.job.state, starts: final.starts, versions: final.versions, produced,
        calls: ports.events().map(e => ({ operation: e.operation, phase: e.phase, action: e.action, purpose: e.purpose,
          milliseconds: e.finished - e.entered, dispatched: e.dispatched, status: e.status, error: e.error })) }))
      const claim = ports.events().find(e => e.operation === 'queue_claim' && e.status === 'committed')
      assert.ok(claim?.record?.lease)
      assert.equal(claim.record.attempt, 2); assert.equal(claim.record.jobId, evidence.subject.current_job.jobId)
      assert.equal(claim.record.lease.leaseId, next.leaseId)
      assert.ok(claim.envelopeText); assert.deepEqual(JSON.parse(claim.envelopeText).expected, evidence.subject.current_job)
      assert.ok(ports.events().some(e => e.operation === 'execution_read' && e.purpose === 'resume' && e.status === 'absent'))
      assert.ok(ports.events().some(e => e.operation === 'queue_confirm' && e.status === 'committed'))
      assert.ok(ports.events().some(e => e.operation === 'execution_start' && e.status === 'reserved'))
      // Only a genuinely completed original can use the existing later minute
      // publication recovery. PREPARED/unknown never gains a new proof window.
      if (outcome.counts.published === 0 && final.job.state === 'succeeded' && final.completed === 7) {
        const originalComplete = final.job, previousCalls = ports.events().length
        await guard.waitUntil(enteredAt + 60001, 'ordinary next-minute completed publication resume')
        assert.ok(Date.now() > Date.parse(claim.record.lease.expiresAt))
        await guard.admit('same original completed publication')
        outcome = await runOfficialTruthV3ChDeTick(t.signal, request)
        await ports.drain(); final = await state()
        assert.deepEqual(final.job, originalComplete)
        assert.ok(ports.events().slice(previousCalls).every(e => !['queue_claim','queue_mutate','execution_start','execution_prepare'].includes(e.operation)))
      }
      assert.equal(outcome.budgetMilliseconds, 30000); assert.equal(outcome.status, 'complete')
      assert.equal(outcome.counts.published, 1)
      assert.equal(final.job.jobId, evidence.subject.current_job.jobId); assert.equal(final.job.attempt, 2)
      assert.equal(final.job.state, 'succeeded'); assert.equal(final.job.lease, null)
      assert.deepEqual([final.starts, final.results, final.completed, final.versions, final.projections, final.publications], [12, 7, 7, 7, 7, 7])
      assert.equal(final.openAttempt, false); assert.equal(final.terminalCredit, false); assert.equal(produced, 1)
      assert.deepEqual(await prefix(), expectedPrefix)
      await proof.run(creator + 'SELECT official_v3_guard_private.check_retirements_v1();SELECT official_v3_guard_private.check_jobs_v1();'
        + 'SELECT official_v3_guard_private.check_hrs_v1();SELECT official_v3_guard_private.check_certificates_v1();', 'real new publication preserves original history')
      assert.deepEqual(await proof.value(executionRead(root), jobsCaller), { status: 'blocked' })
      await guard.admit('published Cycle4 visitor', 5000)
      const beforeRead = wire.calls.length, visitor = await facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, t.signal)
      await ports.drain()
      assert.ok(visitor.ok)
      assert.equal(visitor.answer.response.dataMode, 'official_projection')
      assert.equal(visitor.answer.response.cells.flatMap(cell => cell.results).filter(result => result.status === 'accepted').length, 1)
      assert.equal(wire.calls.length, beforeRead)
      assert.equal(ports.active(), 0)
    })
    await t.test('the exact subsequent Cycle4 review refuses false UI/receipt and preserves the blocked original plus old reviews', async () => {
      await guard.admit('exact Cycle4 sender review')
      const protectedRows = `(SELECT jsonb_build_object(
        'cycles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM jetnity_dev_import_scheduler.cycles_v1 r),
        'dispatches',(SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM jetnity_dev_import_scheduler.dispatches_v1 r),
        'state',(SELECT to_jsonb(r) FROM jetnity_dev_import_scheduler.state_v1 r),
        'cycle2',(SELECT to_jsonb(r) FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 r),
        'cycle3',(SELECT to_jsonb(r) FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r)))`
      const before = await proof.value(protectedRows, creator)
      await refuses(creator + declaration(6) + 'BEGIN;' + reviewBody + 'ROLLBACK;', 'false UI version refused', /operator|declaration|publication|version/i)
      const receipts = 'official_v3_guard_private.owner_operations_v1'
      await refuses(creator + declaration() + 'BEGIN;ALTER TABLE ' + receipts + ' DISABLE TRIGGER immutable_v1;DELETE FROM '
        + receipts + ' WHERE operation_id=' + literal(id('retire')) + ';ALTER TABLE ' + receipts + ' ENABLE TRIGGER immutable_v1;'
        + reviewBody + 'ROLLBACK;', 'missing actual Cycle4 Owner receipt refused', /receipt|retirement|owner|query returned no rows/i)
      assert.deepEqual(await proof.value(protectedRows, creator), before)
      await proof.run(creator + declaration() + review.migration, 'actual additive Cycle4 review after genuine local publication')
      const readback = await proof.value<Record<string, unknown>>('(' + review.readback.slice(review.readback.indexOf('SELECT jsonb_build_object')).trim().replace(/;$/, '') + ')', creator)
      t.diagnostic('actual Cycle4 sender review readback: ' + JSON.stringify(readback))
      for (const field of ['review_valid', 'original_owner_retirement_valid', 'original_attempt2_publication_valid',
        'original_cycle4_evidence_unchanged', 'prior_cycle2_review_valid', 'prior_cycle3_review_valid', 'exact_reviewed_sender'])
        assert.equal(readback[field], true, field)
      assert.equal(await proof.value('(SELECT to_jsonb(count(*)) FROM jetnity_dev_import_scheduler.terminal_cycle4_review_v1)', creator), 1)
      assert.equal(await proof.value("(SELECT to_jsonb(encode(sha256(convert_to(prosrc,'UTF8')),'hex')) FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure)", creator), review.newHash)
      assert.deepEqual(await proof.value(protectedRows, creator), before)
      assert.deepEqual(await prefix(), expectedPrefix)
      await refuses(creator + declaration() + review.migration, 'review cannot replace its original receipt', /already present|never replace/)
      for (const action of ['DELETE FROM ', 'TRUNCATE ']) await refuses(creator + 'BEGIN;' + action
        + 'jetnity_dev_import_scheduler.terminal_cycle4_review_v1;ROLLBACK;', 'new review is immutable', /immutable/)
    })
  } finally {
    wire.close()
    await ports.drain()
  }
}
