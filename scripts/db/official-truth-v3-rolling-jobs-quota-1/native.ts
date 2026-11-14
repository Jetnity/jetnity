import { OwnedPersistentProof } from './persistent-backend'
// Actual local PG17 proof. Historical rows are explicit, coherent synthetic
// fixture data; cycle 65 and the successor upgrade execute the real SQL paths.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { TestContext } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { createV3QueueCoordinator, type V3ManagedJobRecord, type V3QueueCommit, type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { createM04SubjectIdentity, readM04Command, type M04Operation, type M04NativeReply } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { hrs1Canonical } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { buildHistoricalQuotaFixture } from './history-fixture'
import { json, literal, readSql } from './local-proof'

const binding = program.binding
const creator = 'SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog;'
const jobRole = "SET SESSION AUTHORIZATION ot_m04_jobs; SET ROLE ot_v3_jobs_caller;"
const id = (kind: string, value: string) => kind + '_' + createHash('sha256').update('rolling-native:' + value).digest('hex').slice(0, 32)
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const api = (request: M04Operation) => `official_v3_jobs_api.execute_v1(${literal(hrs1Canonical({ ...request, phase: 'authorized' }))},
  ${literal(binding.methodId)},${binding.revision},${literal(binding.methodDigest)},${literal(binding.packageDigest)},1,5000,
  to_char((clock_timestamp()+interval '5 seconds') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))`
const requireSql = (condition: string, label: string) => `DO $assert$ BEGIN IF (${condition}) IS NOT TRUE THEN RAISE EXCEPTION ${literal(label)}; END IF; END $assert$;`
const history = `SELECT jsonb_build_object('subjects',(SELECT jsonb_agg(to_jsonb(s) ORDER BY job_key) FROM official_v3_jobs_private.subjects_v1 s),
 'operations',(SELECT jsonb_agg(to_jsonb(s) ORDER BY operation_id) FROM official_v3_jobs_private.queue_operations_v1 s),
 'starts',(SELECT jsonb_agg(to_jsonb(s) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_starts_v1 s),
 'dispositions',(SELECT jsonb_agg(to_jsonb(s) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_dispositions_v1 s))`

async function baseSetup(proof: OwnedPersistentProof) {
  await proof.run("CREATE ROLE supabase_read_only_user LOGIN NOINHERIT NOSUPERUSER BYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;\n"
    + readSql('official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql')
    + '\nGRANT pg_read_all_data TO postgres WITH ADMIN TRUE, INHERIT TRUE, SET TRUE;\n'
    + [1, 2, 3, 8].map(n => `INSERT INTO auth.users(id,email) VALUES(${literal(uid(n))}::uuid,${literal('quota-' + n + '@example.invalid')});
      INSERT INTO auth.sessions(id,user_id,aal) VALUES(${literal(uid(n + 200))}::uuid,${literal(uid(n))}::uuid,${literal(n === 3 ? 'aal1' : 'aal2')}::auth.aal_level);`).join('\n')
    + '\n' + creator + '\n' + [[1, 'owner'], [2, 'moderator'], [3, 'owner']].map(([n, role]) =>
      `INSERT INTO public.profiles(id,user_id,role,status) VALUES(${literal(uid(Number(n) + 100))}::uuid,${literal(uid(Number(n)))}::uuid,${literal(String(role))},'active');`).join('\n'), 'local auth/profile fixture');
  await proof.run(creator + '\n' + readSql('profile-authority-integrity-1/install-candidate.sql')
    + '\n' + ['ot_m04_jobs', 'ot_m04_intake', 'ot_ma1_reader'].map(login =>
      `CREATE ROLE ${login} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION; GRANT CONNECT ON DATABASE postgres TO ${login};`).join('\n')
    + '\n' + readSql('official-truth-v3-private-owner-guards-1/install-candidate.sql')
    + '\n' + readSql('official-truth-v3-hosted-method-authority-1/install-candidate.sql')
    + '\n' + readSql('official-truth-v3-hosted-intake-store-1/install-candidate.sql')
    + "\nSET jetnity.hmt1_target='dev:yfvbxvijcorffwxbxahl:postgres:E18B6824905662';\n"
    + readSql('official-truth-v3-human-method-transport-1/install-candidate.sql')
    + `\nSET jetnity.hrs1_install_context='root_selected_complete_binding_v1'; SET jetnity.hrs1_binding=${literal(hrs1Canonical(binding))};\n`
    + readSql('official-truth-v3-hosted-result-store-1/install-candidate.sql')
    + '\n' + readSql('official-truth-v3-hosted-durable-jobs-1/install-candidate.sql')
    + '\nGRANT ot_v3_jobs_caller TO ot_m04_jobs WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;'
    + '\nGRANT ot_v3_intake_caller TO ot_m04_intake WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;'
    + '\nGRANT ot_v3_method_reader TO ot_ma1_reader WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;', 'unmodified HMA/S1/HMT/HRS/HM04 stack');
}
function methodSeed(first: string) {
  const stage = id('maop1', 'old-stage'), approve = id('maop1', 'old-approve')
  const tuple = [literal(binding.methodId), String(binding.revision), literal(binding.methodDigest), literal(binding.packageDigest)].join(',')
  const staged = literal(new Date(Date.parse(first) - 2000).toISOString()) + '::timestamptz'
  const approved = literal(new Date(Date.parse(first) - 1000).toISOString()) + '::timestamptz'
  const after = json({ methodId: binding.methodId, revision: binding.revision, methodDigest: binding.methodDigest,
    packageDigest: binding.packageDigest, epoch: 1, status: 'approved', approvalMode: 'until_revoked', approvalUntil: null })
  return `INSERT INTO official_v3_method_private.revisions_v1 VALUES(${tuple},NULL,${staged},${literal(uid(1))}::uuid);
    INSERT INTO official_v3_method_private.operations_v1 VALUES(${literal(stage)},'stage',${literal(binding.methodId)},${binding.revision},
      official_v3_method_private.command_v1(${literal(stage)},'stage',${tuple},NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),NULL,NULL,${literal(uid(1))}::uuid,${staged});
    INSERT INTO official_v3_method_private.operations_v1 VALUES(${literal(approve)},'approve',${literal(binding.methodId)},${binding.revision},
      official_v3_method_private.command_v1(${literal(approve)},'approve',${tuple},NULL,NULL,NULL,NULL,0,NULL,'until_revoked',NULL),NULL,${after},${literal(uid(1))}::uuid,${approved});
    INSERT INTO official_v3_method_private.heads_v1 VALUES(${tuple},1,'approved','until_revoked',NULL,${approved},${literal(uid(1))}::uuid,${literal(approve)});`
}
async function envelope(raw: unknown, current: V3ManagedJobRecord | null): Promise<M04Operation & { operation: 'queue_cas' }> {
  const command = readM04Command(raw); assert.ok(command)
  let commit: V3QueueCommit | undefined
  const storage: V3QueueStoragePort = { async read() { return { status: 'ok', record: current } },
    async confirm() { return { status: 'not_attempted' } }, async compareAndSwap(value) { commit = value; return { status: 'unconfirmed' } } }
  const queue = createV3QueueCoordinator({ storage, methodAuthority: {
    async resolveCurrent() { return { status: 'approved', receipt: {} } }, async reproveAtCommit() { return { status: 'current' } },
  }, now: () => new Date().toISOString(), invocationMilliseconds: 5000, backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000 })
  if (command.action === 'enqueue') await queue.enqueue(command.value.input)
  else if (command.action === 'claim') await queue.claim(command.value.input)
  else if (command.action === 'fail') await queue.fail(command.value.input)
  else throw new Error('quota fixture never fabricates official publication')
  assert.ok(commit)
  const next = commit.next; assert.equal(next.kind, 'research_job_record')
  assert.ok(next.kind === 'research_job_record')
  const subject = createM04SubjectIdentity('rule_research', { context: next.context, method: next.method,
    factKind: next.research.factKind, researchReason: next.research.researchReason }); assert.ok(subject)
  return { operation: 'queue_cas', body: { command: command.value, commit, subjectText: subject.subjectText, disposition: { kind: 'regular' } } }
}

export async function runRollingQuotaNative(t: TestContext) {
  const fixture = await buildHistoricalQuotaFixture({ method: binding, context: binding.context, factKind: 'requirement_effect',
    firstAt: new Date(Date.now() - 4 * 86400000), cycleSpacingMs: 40 * 60000, cycles: 64 })
  assert.ok(Date.parse(fixture.newestAt) - Date.parse(fixture.oldestAt) > 86400000)
  assert.ok(Date.now() - Date.parse(fixture.newestAt) > 86400000)
  const proof = new OwnedPersistentProof(t.signal)
  try {
    await baseSetup(proof);
    await proof.run('BEGIN; SET LOCAL jetnity.local_quota_fixture=\'owned-local-pg17-only\';\n' + methodSeed(fixture.oldestAt)
      + '\n' + fixture.seedSql + '\nCOMMIT;', 'coherent historical fixture, no timestamp UPDATE');
    const before = (await proof.value<unknown>('(' + history + ')'))
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql',
      'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql']) {
      await proof.run(creator + '\nBEGIN;\n' + readSql('official-truth-v3-background-guard-1/' + file) + '\nCOMMIT;', 'unmodified BG1 predecessor ' + file);
    }
    // Prove that a real positive predecessor proof cannot authorize its new
    // catalog. This whole rehearsal rolls back, including its new audit row.
    // It creates neither a manufactured timestamp nor a replacement baseline.
    const upgrade = readFileSync(new URL('./provider-migration-body.sql', import.meta.url), 'utf8')
    await proof.run(creator + '\nBEGIN; SELECT official_v3_guard_private.audit_v1(); SELECT official_v3_guard_private.require_open_v1();\n'
      + upgrade + '\nROLLBACK;', 'old positive BG1 proof does not admit the successor');
    // The installer itself must preserve every old row. All live timestamps,
    // quotas and immutable v1 anchors remain exactly those of the predecessor.
    await proof.run(creator + '\nBEGIN;\n' + upgrade + '\nCOMMIT;', 'exact rolling quota upgrade');
    assert.deepEqual((await proof.value('(' + history + ')')), before)
    await t.test('fresh complete BG1 proof admits the successor; history spans 24h and preserves 64 lifetime STARTs', async () => {
      assert.deepEqual((await proof.value('public.official_v3_guard_alarm_status_v1()', creator)), { schema: 1, status: 'unavailable' })
      assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
      const quota = (await proof.value<{ model: string; starts: number; operations: number; lifetime_starts: number; lifetime_operations: number; remaining_starts: number }>(
        'official_v3_guard_private.ch_de_quota_v2()', creator))
      assert.equal(quota.model, 'rolling_24h_v2'); assert.equal(quota.starts, 0); assert.equal(quota.operations, 0)
      assert.equal(quota.lifetime_starts, 64); assert.equal(quota.lifetime_operations, 192); assert.equal(quota.remaining_starts, 64)
    })
    const timings: { operation: string; milliseconds: number; lifetime_starts: number; lifetime_operations: number }[] = []
    const jobs = async (request: M04Operation) => {
      const measured = (await proof.value<{ reply: M04NativeReply; milliseconds: number }>(`(WITH start AS MATERIALIZED (SELECT clock_timestamp() AS at),
        actual AS MATERIALIZED (SELECT ${api(request)} AS reply,start.at FROM start)
        SELECT jsonb_build_object('reply',reply,'milliseconds',extract(epoch FROM clock_timestamp()-at)*1000) FROM actual)`, jobRole))
      const counts = (await proof.value<{ lifetime_starts: number; lifetime_operations: number }>(`(SELECT jsonb_build_object(
        'lifetime_starts',start_count,'lifetime_operations',operation_count) FROM official_v3_jobs_private.subjects_v1 WHERE job_key=${literal(fixture.jobKey)})`, creator))
      timings.push({ operation: request.operation === 'queue_cas' ? 'queue_' + String(request.body.command.action) : request.operation,
        milliseconds: measured.milliseconds, ...counts })
      return measured.reply
    }
    let current: V3ManagedJobRecord = fixture.subjectRow.current_job
    let lastGuardCheck = Date.now()
    const maintainGuard = async () => {
      if (Date.now() - lastGuardCheck < 20000) return
      assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
      lastGuardCheck = Date.now()
    }
    const enqueueOperation = async (tag: string) => { await maintainGuard(); return envelope({ action: 'enqueue', kind: 'rule_research', input: { context: binding.context,
      method: { methodId: binding.methodId, revision: binding.revision }, factKind: 'requirement_effect', researchReason: { status: 'missing' },
      operationId: id('op3', tag + '-enqueue'), jobId: id('job3', tag + '-job'), attemptLimit: 1 } }, current) }
    async function finishCycle(tag: string) {
      const claim = { jobKey: fixture.jobKey, operationId: id('op3', tag + '-claim'), leaseId: id('lease3', tag + '-lease'), leaseMilliseconds: 30000 }
      const claimed = (await jobs(await envelope({ action: 'claim', input: claim }, current)))
      assert.equal(claimed.status, 'committed'); assert.ok(claimed.status === 'committed'); current = claimed.record
      const started = (await jobs({ operation: 'execution_start', body: { claim, leasedJob: current, subjectText: fixture.subject.subjectText } }))
      assert.equal(started.status, 'reserved'); assert.ok(started.status === 'reserved')
      const failure = await envelope({ action: 'fail', input: { jobKey: fixture.jobKey, operationId: id('op3', tag + '-fail'),
        fence: { jobId: current.jobId, revision: current.revision, leaseId: claim.leaseId, generation: current.lease!.generation },
        reason: 'unreachable' } }, current)
      failure.body.disposition = { kind: 'settled_failure', attemptKey: started.attemptKey, token: started.token }
      const finished = (await jobs(failure)); assert.equal(finished.status, 'committed'); assert.ok(finished.status === 'committed')
      current = finished.record; assert.equal(current.state, 'exhausted')
      return { failure, finished }
    }
    await t.test('old confirmation is free while the original expired CAS remains expired', async () => {
      assert.equal((await jobs(fixture.oldQueueConfirm)).status, 'committed')
      assert.equal((await jobs(fixture.oldExecutionRead)).status, fixture.expectedOldExecutionReadStatus)
      await proof.run(jobRole + '\nSELECT ' + api(fixture.witnesses[0].enqueue) + ';', 'expired old original CAS', /(?:ERROR|FATAL):.*m04.*(?:expired|deadline|budget)/);
      assert.deepEqual((await proof.value('(' + history + ')')), before)
    })
    await t.test('real API executes cycles 65 through 86 above both original lifetime ceilings', async () => {
      for (let number = 65; number <= 86; number++) {
        if (number === 65 || number === 86) process.stderr.write('ROLLING_NATIVE_STAGE cycle ' + number + '\n')
        const queued = (await jobs(await enqueueOperation(String(number)))); assert.equal(queued.status, 'committed'); assert.ok(queued.status === 'committed')
        current = queued.record
        const { failure, finished } = await finishCycle(String(number))
        if (number === 86) assert.deepEqual((await jobs(failure)), finished, 'exact current replay consumes no quota')
      }
      const quota = (await proof.value<{ lifetime_starts: number; lifetime_operations: number; starts: number; operations: number; credit: number }>(
        'official_v3_guard_private.ch_de_quota_v2()', creator))
      assert.equal(quota.lifetime_starts, 86); assert.equal(quota.lifetime_operations, 258)
      assert.equal(quota.starts, 22); assert.equal(quota.operations, 66); assert.equal(quota.credit, 0)
      const last = timings.slice(-5)
      t.diagnostic('cycle86 actual SQL milliseconds: ' + JSON.stringify(last))
    })
    await t.test('real 256-operation window preserves one terminal credit and exact replay at the boundary', async () => {
      const queued = (await jobs(await enqueueOperation('87'))); assert.equal(queued.status, 'committed'); assert.ok(queued.status === 'committed')
      current = queued.record
      // Each new, ordinary deduplicated enqueue is a genuine immutable operation.
      // No START/history counter is edited to construct the remaining boundary.
      for (let count = 68; count <= 254; count++) {
        if (count % 50 === 0) process.stderr.write('ROLLING_NATIVE_STAGE window operation ' + count + '\n')
        const added = (await jobs(await enqueueOperation('dedup-' + count))); assert.equal(added.status, 'committed'); assert.ok(added.status === 'committed')
        assert.deepEqual(added.record, current)
      }
      const claim = { jobKey: fixture.jobKey, operationId: id('op3', '87-claim'), leaseId: id('lease3', '87-lease'), leaseMilliseconds: 30000 }
      const claimed = (await jobs(await envelope({ action: 'claim', input: claim }, current)))
      assert.equal(claimed.status, 'committed'); assert.ok(claimed.status === 'committed'); current = claimed.record
      const reserved = (await proof.value<{ operations: number; credit: number; remaining_operations: number }>('official_v3_guard_private.ch_de_quota_v2()', creator))
      assert.equal(reserved.operations, 255); assert.equal(reserved.credit, 1); assert.equal(reserved.remaining_operations, 0)
      assert.equal((await jobs(await enqueueOperation('must-not-consume-terminal'))).status, 'quota')
      const started = (await jobs({ operation: 'execution_start', body: { claim, leasedJob: current, subjectText: fixture.subject.subjectText } }))
      assert.equal(started.status, 'reserved'); assert.ok(started.status === 'reserved')
      const failure = await envelope({ action: 'fail', input: { jobKey: fixture.jobKey, operationId: id('op3', '87-fail'),
        fence: { jobId: current.jobId, revision: current.revision, leaseId: claim.leaseId, generation: current.lease!.generation },
        reason: 'unreachable' } }, current)
      failure.body.disposition = { kind: 'settled_failure', attemptKey: started.attemptKey, token: started.token }
      const finished = (await jobs(failure)); assert.equal(finished.status, 'committed'); assert.ok(finished.status === 'committed')
      current = finished.record
      assert.deepEqual((await jobs(failure)), finished, 'exact terminal replay is free at 256 operations')
      assert.equal((await jobs(fixture.oldQueueConfirm)).status, 'committed', 'old original confirmation is free at full rolling quota')
      assert.equal((await jobs(await enqueueOperation('quota-denied'))).status, 'quota')
      const quota = (await proof.value<{ lifetime_starts: number; lifetime_operations: number; operations: number; credit: number }>(
        'official_v3_guard_private.ch_de_quota_v2()', creator))
      assert.equal(quota.lifetime_starts, 87); assert.equal(quota.lifetime_operations, 448)
      assert.equal(quota.operations, 256); assert.equal(quota.credit, 0)
    })
    await t.test('full BG1 checks preserve old history, original baselines, and non-UTC catalog identity after 448 lifetime operations', async () => {
      const actualCounts = (await proof.value<{ lifetime_starts: number; lifetime_operations: number }>(`(SELECT jsonb_build_object(
        'lifetime_starts',start_count,'lifetime_operations',operation_count) FROM official_v3_jobs_private.subjects_v1 WHERE job_key=${literal(fixture.jobKey)})`, creator))
      assert.deepEqual(actualCounts, { lifetime_starts: 87, lifetime_operations: 448 }, 'full claimed history must actually exist before reporting its audit time')
      const checked = (await proof.value<{ milliseconds: number }>(`(WITH start AS MATERIALIZED (SELECT clock_timestamp() AS at),
        checked AS MATERIALIZED (SELECT official_v3_guard_private.check_jobs_v1(),official_v3_guard_private.check_certificates_v1(),
          official_v3_guard_private.check_hma_v1(),official_v3_guard_private.check_s1_v1(),official_v3_guard_private.check_hrs_v1(),
          official_v3_guard_private.check_retirements_v1(),official_v3_guard_private.assert_catalog_v1(),at FROM start)
        SELECT jsonb_build_object('milliseconds',extract(epoch FROM clock_timestamp()-at)*1000) FROM checked)`, creator))
      t.diagnostic('complete BG1 checks actual lifetime counts and milliseconds: ' + JSON.stringify({ ...actualCounts, ...checked }))
      await proof.run(creator + "; SET TIME ZONE 'Europe/Zurich'; SELECT official_v3_guard_private.assert_catalog_v1();", 'non-UTC immutable catalog identity');
      const after = (await proof.value<{ operations: unknown[]; starts: unknown[]; dispositions: unknown[] }>('(' + history + ')'))
      const old = before as typeof after
      for (const key of ['operations', 'starts', 'dispositions'] as const)
        for (const row of old[key]) assert.ok(after[key].some(candidate => JSON.stringify(candidate) === JSON.stringify(row)), 'old immutable ' + key + ' row changed')
      const sorted = timings.map(row => row.milliseconds).sort((a, b) => a - b)
      t.diagnostic('actual M04 API milliseconds: ' + JSON.stringify({ calls: timings.length, maximum: sorted.at(-1),
        p95: sorted[Math.ceil(sorted.length * 0.95) - 1], deadline: 5000, slowest: timings.reduce((a, b) => a.milliseconds > b.milliseconds ? a : b) }))
      const next = (await proof.value<{ next: string; generation: number }>("(SELECT jsonb_build_object('next',last_due+interval '5 minutes','generation',generation) FROM official_v3_guard_private.state_v1 WHERE singleton)", creator))
      const waiting = Math.max(0, Date.parse(next.next) - Date.now() + 100)
      t.diagnostic('waiting for actual next BG1 due slot, milliseconds=' + waiting)
      process.stderr.write('ROLLING_NATIVE_STAGE actual next BG1 slot wait milliseconds=' + waiting + '\n')
      let remaining = waiting
      while (remaining > 0) { const step = Math.min(30000, remaining); await delay(step, undefined, { signal: t.signal }); remaining -= step }
      assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
      const audit = (await proof.value<{ milliseconds: number; generation: number }>("(SELECT jsonb_build_object('milliseconds',extract(epoch FROM last_finished-last_proof_started)*1000,'generation',generation) FROM official_v3_guard_private.state_v1 WHERE singleton)", creator))
      assert.equal(audit.generation, next.generation + 1); assert.ok(audit.milliseconds < 30000)
      t.diagnostic('actual final fresh BG1 full audit at lifetime87/448: ' + JSON.stringify(audit))
    })
    await t.test('private policy and original baseline content cannot be rewritten', async () => {
      await proof.run(creator + '\nUPDATE official_v3_jobs_private.rolling_policy_v2 SET start_limit=65;', 'immutable rolling policy', /(?:ERROR|FATAL):.*(?:permission denied|immutable|protected)/);
      await proof.run(creator + '\nUPDATE official_v3_guard_private.baselines_v1 SET catalog=\'{}\';', 'immutable original baseline', /(?:ERROR|FATAL):.*(?:immutable|protected)/);
      await proof.run('SET SESSION AUTHORIZATION pai1_human; SET ROLE authenticated; SELECT official_v3_guard_private.ch_de_quota_v2();',
        'application role cannot inspect private quota', /(?:ERROR|FATAL):.*permission denied/);
      await proof.run(creator + '\n' + requireSql("(SELECT start_count=87 AND operation_count=448 FROM official_v3_jobs_private.subjects_v1 WHERE job_key=" + literal(fixture.jobKey) + ')', 'monotone lifetime counters'), 'final native evidence');
    })
  } finally { await proof.close(); }
}

export async function runRollingStartBoundary(t: TestContext) {
  const fixture = await buildHistoricalQuotaFixture({ method: binding, context: binding.context, factKind: 'requirement_effect',
    firstAt: new Date(Date.now() - 10 * 60000), cycleSpacingMs: 3000, cycles: 64 })
  const proof = new OwnedPersistentProof(t.signal)
  try {
    await baseSetup(proof);
    await proof.run('BEGIN; SET LOCAL jetnity.local_quota_fixture=\'owned-local-pg17-only\';\n' + methodSeed(fixture.oldestAt)
      + '\n' + fixture.seedSql + '\nCOMMIT;', 'coherent current-window fixture');
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql',
      'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql']) {
      await proof.run(creator + '\nBEGIN;\n' + readSql('official-truth-v3-background-guard-1/' + file) + '\nCOMMIT;', 'START boundary predecessor ' + file);
    }
    await proof.run(creator + '\nBEGIN;\n' + readFileSync(new URL('./provider-migration-body.sql', import.meta.url), 'utf8') + '\nCOMMIT;', 'START boundary successor');
    assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
    const before = (await proof.value<{ starts: number; operations: number; remaining_starts: number; remaining_operations: number }>(
      'official_v3_guard_private.ch_de_quota_v2()', creator))
    assert.equal(before.starts, 64); assert.equal(before.operations, 192); assert.equal(before.remaining_starts, 0); assert.equal(before.remaining_operations, 64)
    const enqueue = await envelope({ action: 'enqueue', kind: 'rule_research', input: { context: binding.context,
      method: { methodId: binding.methodId, revision: binding.revision }, factKind: 'requirement_effect', researchReason: { status: 'missing' },
      operationId: id('op3', 'start-cap-enqueue'), jobId: id('job3', 'start-cap-job'), attemptLimit: 1 } }, fixture.subjectRow.current_job)
    const queued = (await proof.value<M04NativeReply>(api(enqueue), jobRole)); assert.equal(queued.status, 'committed'); assert.ok(queued.status === 'committed')
    assert.deepEqual((await proof.value(api(enqueue), jobRole)), queued, 'valid original CAS replay costs no quota at the full START window')
    const claim = await envelope({ action: 'claim', input: { jobKey: fixture.jobKey, operationId: id('op3', 'start-cap-claim'),
      leaseId: id('lease3', 'start-cap-lease'), leaseMilliseconds: 30000 } }, queued.record)
    assert.equal((await proof.value<M04NativeReply>(api(claim), jobRole)).status, 'quota', 'START cap refuses fresh claim despite 63 remaining operations')
    const after = (await proof.value<{ starts: number; operations: number }>('official_v3_guard_private.ch_de_quota_v2()', creator))
    assert.equal(after.starts, 64); assert.equal(after.operations, 193)
    await proof.run(creator + '\nSELECT official_v3_guard_private.check_jobs_v1(); SELECT official_v3_guard_private.check_certificates_v1();', 'full history remains valid at START quota');
    t.diagnostic('actual 64 START / 193 operation API refusal preserved both original IDs and all counters')
  } finally { await proof.close(); }
}
