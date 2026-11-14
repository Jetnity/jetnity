// Actual owned PostgreSQL 17 only. All original bytes/accounts below are local
// fixtures. This is neither a hosted upgrade, an official HTTP import nor cron.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { TestContext } from 'node:test'
import { performance } from 'node:perf_hooks'
import { startLocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { createBg1LocalPredecessor, createBg1LocalHrsExecutors } from '../official-truth-v3-hosted-result-store-1/native'
import { M04_FIXED_SQL, createM04NativeExecutors } from '../official-truth-v3-durable-jobs-1/native-adapter'
import { createMa1NativeExecutor } from '../official-truth-v3-method-authority-1/native-adapter'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { AA_CH_DE_DELIVERY_PRODUCER } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-delivery-producer'
import { readV3RetainableProposal } from '../../../lib/readiness/official-truth-product-v3/storage/proposal-bytes'
import { createV3WorkIdentity, createV3TransitionIdempotencyKey } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3ManagedJobRecord,
  type V3QueueCommit, type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { readM04Command, createM04SubjectIdentity, type M04Operation, type M04NativeReply } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { createV3PostgresMethodAuthority, createV3PostgresResultJobs } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import { MA1_LIMITS } from '../../../lib/readiness/official-truth-product-v3/method/contract'
import { HRS1_SQL, hrs1Canonical, hrs1Hash, hrs1Ref, hrs1Clock, type Hrs1Operation, type Hrs1Reply } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { readDevGuardReview } from '../../../lib/readiness/official-truth-product-v3/runtime/guard-contract'
import { fixtureId, fixtureVerification, fixturePrepared } from './fixtures'

const binding = program.binding
const params = (values: readonly unknown[]) => values.map(value => pgText(value == null ? '' : typeof value === 'string' ? value : String(value)))
function json<T>(rows: PgRows, key = 'result'): T { assert.equal(rows.length, 1); assert.ok(rows[0]?.[key]); return JSON.parse(rows[0]![key]!) as T }
const stateError = (code: string) => (error: unknown) => error instanceof LocalPgError && error.code === code
async function envelope(value: unknown, current: V3ManagedJobRecord | null) {
  const command = readM04Command(value); assert.ok(command)
  let commit: V3QueueCommit | undefined
  const storage: V3QueueStoragePort = { async read() { return { status: 'ok', record: current } },
    async confirm() { return { status: 'not_attempted' } }, async compareAndSwap(value) { commit = value; return { status: 'unconfirmed' } } }
  // Pure prospective envelope only. This object supplies no database authority;
  // the actual unchanged SQL validates tuple, lease and retained transition.
  const options = { storage, methodAuthority: { async resolveCurrent() { return { status: 'approved' as const, receipt: {} } },
    async reproveAtCommit() { return { status: 'current' as const } } }, now: () => new Date().toISOString(), invocationMilliseconds: 5000,
    backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000 }
  const queue = command.kind === 'combination_discovery' ? createV3DiscoveryQueueCoordinator(options) : createV3QueueCoordinator(options)
  if (command.action === 'enqueue') await queue.enqueue(command.value.input)
  else if (command.action === 'claim') await queue.claim(command.value.input)
  else if (command.action === 'fail') await queue.fail(command.value.input)
  else await queue.complete(command.value.input)
  assert.ok(commit)
  const next = commit.next
  const subject = createM04SubjectIdentity(command.kind, next.kind === 'research_job_record'
    ? { context: next.context, method: next.method, factKind: next.research.factKind, researchReason: next.research.researchReason }
    : { destinationCountryCode: next.identity.destinationCountryCode, citizenshipCountryCode: next.identity.citizenshipCountryCode, method: next.identity.method })
  assert.ok(subject)
  return { operation: 'queue_cas' as const, body: { command: command.value, commit, subjectText: subject.subjectText, disposition: { kind: 'regular' as const } } }
}

/** Additional real SQL cases use separate owned databases. They run while the
 * main proof is waiting for its already selected next five-minute due time.
 * No fixture clock, certificate reissue, source issuer or held Dev token exists. */
async function recoveryCases(t: TestContext, lifetime: OwnedTestLifetime, allocated: () => void) {
  const started = performance.now()
  async function fixture(jobMilliseconds: number, intakeMilliseconds: number) {
    const cluster = lifetime.startCluster(startLocalProofCluster); allocated()
    const bootstrap = await LocalPgConnection.connect(cluster)
    await bootstrap.query('CREATE ROLE supabase_read_only_user LOGIN NOINHERIT NOSUPERUSER BYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION')
    bootstrap.close()
    const base = await createBg1LocalPredecessor(lifetime, cluster, binding)
    const owner = base.bootstrap.connection, creator = base.creator.connection, observer = base.observer.connection
    let serial = 0
    const operation = () => fixtureId('op3', 'recovery-case-' + (++serial))
    async function absent(pid: string, birth: string) {
      const until = performance.now() + 2000
      for (;;) {
        if ((await observer.query('SELECT NOT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz) AS absent', params([pid,birth])))[0]!.absent === 't') return
        assert.ok(performance.now() < until, 'real recovery fixture backend drains'); await lifetime.wait(2)
      }
    }
    async function human(name: string, values: readonly unknown[] = [], actor?: Awaited<ReturnType<typeof base.humanAs>>) {
      const selected = actor ?? await base.humanAs(1)
      const casts = name === 'official_v3_method_stage_draft_v1' ? ['text','text','integer','text','text','integer']
        : name === 'official_v3_method_approve_v1' ? ['text','text','integer','text','text','integer','text','text','integer','text','text','text']
          : name === 'official_v3_method_confirm_operation_v1' ? ['text','text','text','integer','text','text','integer','integer','text','text','integer','text','text','text']
            : values.map(() => 'text')
      try {
        return json(await selected.connection.query('SELECT public.' + name + '(' + casts.map((type,i) => `NULLIF($${i+1}::text,'')::${type}`).join(',') + ') AS result', params(values)))
      } finally { if (!actor) { selected.connection.close(); await absent(selected.identity.pid,selected.identity.birth) } }
    }
    for (const action of ['stage','approve'] as const) {
      const id = 'maop1_' + hrs1Hash({ localRecovery: action }).slice(0,32)
      const tuple = [id,binding.methodId,1,binding.methodDigest,binding.packageDigest]
      const before = [null,null,null,0,null]
      const receipt = await human('official_v3_method_' + (action === 'stage' ? 'stage_draft' : action) + '_v1',
        action === 'stage' ? [...tuple,null] : [...tuple,...before,'until_revoked',null])
      assert.equal((receipt as { status: string }).status,'recorded')
      assert.deepEqual(await human('official_v3_method_confirm_operation_v1', [id,action,binding.methodId,1,binding.methodDigest,binding.packageDigest,null,
        ...(action === 'stage' ? [null,null,null,null,null] : before),action === 'approve' ? 'until_revoked' : null,null]),receipt)
    }
    async function jobs(request: M04Operation, connection: LocalPgConnection) {
      return json<M04NativeReply>(await connection.query(M04_FIXED_SQL, params([hrs1Canonical({...request,phase:'authorized'}),
        binding.methodId,1,binding.methodDigest,binding.packageDigest,1,5000,new Date(Date.now()+5000).toISOString()])))
    }
    const enqueued = await envelope({action:'enqueue',kind:'rule_research',input:{context:program.context,method:program.method,
      factKind:'requirement_effect',researchReason:{status:'missing'},operationId:operation(),jobId:fixtureId('job3','recovery'),attemptLimit:4}},null)
    assert.equal((await jobs(enqueued,base.runtime[0]!.connection)).status,'committed')
    const claim = {operationId:operation(),jobKey:enqueued.body.commit.jobKey,leaseId:fixtureId('lease3','recovery-first'),leaseMilliseconds:jobMilliseconds}
    const claimed = await envelope({action:'claim',input:claim},enqueued.body.commit.next)
    assert.equal((await jobs(claimed,base.runtime[0]!.connection)).status,'committed')
    const leased = claimed.body.commit.next; assert.ok(leased.lease)
    const startedReply = await jobs({operation:'execution_start',body:{claim,leasedJob:leased,subjectText:claimed.body.subjectText}},base.runtime[0]!.connection)
    assert.ok(startedReply.status === 'reserved')
    const start = startedReply
    const delivery = await AA_CH_DE_DELIVERY_PRODUCER.produce({job:leased,fence:{jobId:leased.jobId,revision:leased.revision,
      leaseId:leased.lease.leaseId,generation:leased.lease.generation}},lifetime.signal)
    assert.ok(delivery.status === 'delivered')
    const item = delivery.deliveries[0]!, uploaded = readV3RetainableProposal(item.text,program.registry); assert.ok(uploaded.ok)
    const upload = uploaded.value
    const intake = base.runtime[1]!.connection
    assert.equal(json<{status:string}>(await intake.query('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',params([JSON.stringify(item.binding),item.text,upload.digest]))).status,'recorded')
    // These independently selected local lease lengths exercise both expiry
    // orders of the existing S1 API. Application I1/S1 remains five seconds.
    const reservation = json<{status:string;generation:number;leaseToken:string;expiresAt:string}>(await intake.query(
      'SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
      params([JSON.stringify(item.binding),upload.digest,upload.bytes,intakeMilliseconds])))
    assert.equal(reservation.status,'acquired')
    const verification = fixtureVerification(new Date().toISOString(),hrs1Ref('source-decision',{operationId:item.binding.operationId,
      proposalDigest:upload.digest,contextKey:binding.contextKey,method:program.method,predecessor:null}))
    const verifier = await LocalPgConnection.connect(cluster,'ot_v3_result_verifier')
    try {
      const clock = hrs1Clock(new Date().toISOString(),binding.legalTimeZone); assert.ok(clock)
      assert.equal(json<{status:string}>(await verifier.query(HRS1_SQL.attest,params([hrs1Canonical({schema:1,operation:'attest',bindingHash:hrs1Hash(binding),body:{kind:'verification',verification}}),
        hrs1Hash(binding),binding.methodId,1,binding.methodDigest,binding.packageDigest,1,5000,new Date(Date.now()+5000).toISOString(),clock.legalDate]))).status,'recorded')
    } finally { verifier.close() }
    const prepared = fixturePrepared(upload,verification).prepared
    const oldFail = await envelope({action:'fail',input:{operationId:operation(),jobKey:claim.jobKey,
      fence:{jobId:leased.jobId,revision:leased.revision,leaseId:leased.lease.leaseId,generation:leased.lease.generation},reason:'verification_unavailable'}},leased)
    const failed: M04Operation = {...oldFail,body:{...oldFail.body,disposition:{kind:'settled_failure',attemptKey:start.attemptKey,token:start.token}}}
    for (const entry of base.runtime) { entry.connection.close(); await absent(entry.identity.pid,entry.identity.birth) }
    // No technical transport is still attached when the exact upgrade runs.
    const until = performance.now()+2000
    while ((await observer.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE usename='ot_v3_result_verifier'"))[0]!.n !== '0') {
      assert.ok(performance.now()<until); await lifetime.wait(2)
    }
    await creator.query("SET jetnity.bg1_target='dev:yfvbxvijcorffwxbxahl:BG1'")
    await creator.query(readFileSync(new URL('./upgrade-candidate.sql',import.meta.url),'utf8'))
    await creator.query("SET statement_timeout='25s'")
    assert.equal(json<{status:string}>(await creator.query('SELECT official_v3_guard_private.audit_v1() AS result')).status,'current')
    const runtimeJobs = await LocalPgConnection.connect(cluster,base.bound[0]!.login)
    const runtimeIntake = await LocalPgConnection.connect(cluster,base.bound[1]!.login)
    await runtimeJobs.query('SET ROLE ot_v3_jobs_caller'); await runtimeIntake.query('SET ROLE ot_v3_intake_caller')
    async function identity(connection: LocalPgConnection) {
      return (await connection.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE pid=pg_backend_pid()'))[0]!
    }
    const jobsIdentity = await identity(runtimeJobs), intakeIdentity = await identity(runtimeIntake)
    async function waitUntil(value: string) {
      while (Date.now() <= Date.parse(value)) await lifetime.wait(Math.min(100,Math.max(1,Date.parse(value)+5-Date.now())))
    }
    async function state() {
      return json<{open:boolean;job:string;retired:number;receipts:number;completions:number;results:number;dispositions:number}>(await observer.query(`SELECT jsonb_build_object(
        'open',s.open_attempt IS NOT NULL,'job',md5(s.current_job::text),
        'retired',(SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1),
        'receipts',(SELECT count(*) FROM official_v3_guard_private.owner_operations_v1),
        'completions',(SELECT count(*) FROM official_v3_intake_private.completions_v1),
        'results',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1),
        'dispositions',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1)) AS result
        FROM official_v3_jobs_private.subjects_v1 s WHERE job_key=$1`,params([claim.jobKey])))
    }
    async function refused(code: string) {
      const before = await state()
      // A deliberately nonmatching selection is not the negative oracle:
      // the real prerequisite/read path must itself refuse this exact state.
      if (code === 'P7905') {
        await assert.rejects(human('official_v3_guard_review_v1'),stateError(code))
      } else {
        await assert.rejects(owner.query('SELECT official_v3_guard_private.recovery_snapshot_v1() AS result'),stateError(code))
        const review = readDevGuardReview(await human('official_v3_guard_review_v1'))
        assert.ok(review); assert.equal(review.retirement.status,'unavailable')
      }
      await assert.rejects(human('official_v3_guard_retire_v1',[operation(),'0'.repeat(64)]),stateError(code))
      assert.deepEqual(await state(),before,'refused recovery creates no receipt/retirement and does not change the retained open attempt')
      assert.equal(before.retired,0); assert.equal(before.receipts,0)
    }
    async function finish() {
      const audit = {schema:3,kind:'import_attempt_record',operationId:item.binding.operationId,proposalDigest:upload.digest,
        jobId:leased.jobId,contextKey:binding.contextKey,method:program.method,recordedAt:verification.decision.evaluatedAt,
        result:'prepared',decisionRef:prepared.decision.reference,escalationKey:null}
      return json<{status:string}>(await runtimeIntake.query('SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
        params([JSON.stringify(item.binding),upload.digest,upload.bytes,reservation.generation,reservation.leaseToken,
          JSON.stringify({status:'prepared',value:prepared}),JSON.stringify(audit)])))
    }
    async function prepare() {
      return jobs({operation:'execution_prepare',body:{claim,attemptKey:start.attemptKey,token:start.token,
        result:{kind:'rule_research',jobId:leased.jobId,operationId:leased.operationId,jobKey:claim.jobKey,
          preparedAt:verification.decision.evaluatedAt,decisionRef:prepared.decision.reference},
        references:[{binding:item.binding,proposalDigest:upload.digest,bytes:upload.bytes}]}},runtimeJobs)
    }
    async function blocked(pid: string, blocker: string) {
      const until = performance.now()+1000
      for (;;) {
        if ((await observer.query('SELECT ($2::integer=ANY(pg_blocking_pids($1::integer))) AS blocked',params([pid,blocker])))[0]!.blocked === 't') return
        assert.ok(performance.now()<until,'actual common-lock acquisition order must be observed'); await lifetime.wait(2)
      }
    }
    async function reviewed() {
      const review = readDevGuardReview(await human('official_v3_guard_review_v1')); assert.ok(review?.retirement.status==='reviewable')
      return review.retirement.selection
    }
    async function retireRace(kind: 's1'|'m04', first: 'old'|'owner') {
      await waitUntil(leased.lease!.expiresAt); await waitUntil(reservation.expiresAt)
      const selection = await reviewed(), id = operation(), before = await state()
      const actor = await base.humanAs(1)
      let old: Promise<unknown> | undefined, retirement: Promise<unknown> | undefined
      let receipt: unknown
      const writer = kind==='s1' ? intakeIdentity : jobsIdentity
      const runOld = () => kind==='s1' ? finish() : jobs(failed,runtimeJobs)
      try {
        if (first==='old') {
          // Block the actual certificate read after the old API has acquired
          // the common write lock. The Owner must then wait behind that API.
          await owner.query('BEGIN; LOCK TABLE ' + (kind==='s1'?'official_v3_intake_private.operations_v1':'official_v3_jobs_private.subjects_v1') + ' IN ACCESS EXCLUSIVE MODE')
          old=runOld(); void Promise.allSettled([old])
          await blocked(writer.pid!,base.bootstrap.identity.pid)
          retirement=human('official_v3_guard_retire_v1',[id,selection],actor); void Promise.allSettled([retirement])
          await blocked(actor.identity.pid,writer.pid!)
          await owner.query('ROLLBACK')
          receipt=await retirement
        } else {
          await actor.connection.query('BEGIN')
          receipt=await human('official_v3_guard_retire_v1',[id,selection],actor)
          old=runOld(); void Promise.allSettled([old])
          await blocked(writer.pid!,actor.identity.pid)
          assert.deepEqual(await state(),before,'uncommitted retirement is not visible to the independent observer')
          await actor.connection.query('COMMIT')
        }
        assert.ok(old)
        const [settled]=await lifetime.drain([old])
        if(kind==='s1') { assert.equal(settled.status,'fulfilled'); if(settled.status==='fulfilled') assert.deepEqual(settled.value,{status:'unconfirmed'}) }
        else { assert.equal(settled.status,'rejected'); if(settled.status==='rejected') assert.ok(stateError('P7605')(settled.reason),'the actual expired old M04 request cannot record settled_failure') }
        assert.equal((receipt as {result:string}).result,'unknown_retired')
        assert.deepEqual(await human('official_v3_guard_confirm_v1',[id,'retire_unknown',selection]),receipt)
        assert.deepEqual(await state(),{...before,open:false,retired:1,receipts:1})
        await creator.query('SELECT official_v3_guard_private.check_certificates_v1(); SELECT official_v3_guard_private.check_retirements_v1()')
      } finally {
        await owner.query('ROLLBACK'); await actor.connection.query('ROLLBACK')
        await lifetime.drain([...(old?[old]:[]),...(retirement?[retirement]:[])])
        actor.connection.close(); await absent(actor.identity.pid,actor.identity.birth)
      }
    }
    return {cluster,base,owner,creator,observer,human,jobs,runtimeJobs,claim,claimed,leased,start,failed,item,upload,
      prepared,reservation,operation,state,refused,finish,prepare,blocked,reviewed,retireRace,waitUntil,jobsIdentity}
  }
  type Fixture = Awaited<ReturnType<typeof fixture>>
  async function run(name: string,jobMs: number,intakeMs: number,body: (f:Fixture)=>Promise<void>) {
    assert.ok(performance.now()-started<120000,'finite additional recovery cases stay within the existing due wait')
    let actual: Promise<void> | undefined
    await t.test(name,async()=>{
      actual=lifetime.run(async()=>{
        const f=await fixture(jobMs,intakeMs)
        try { await body(f) } finally { lifetime.stopCluster(f.cluster) }
      })
      await actual
    })
    assert.ok(actual); const [settled]=await lifetime.drain([actual]); if(settled.status==='rejected') throw settled.reason
  }
  await run('R01 actual active job/S1 leases and a real S1 completion refuse Owner recovery',10000,15000,async f=>{
    assert.equal((await f.observer.query('SELECT clock_timestamp()<$1::timestamptz AS active',params([f.leased.lease!.expiresAt])))[0]!.active,'t')
    await assert.rejects(f.owner.query('SELECT official_v3_guard_private.recovery_jobs_v1() AS result'),stateError('P7906'))
    await f.refused('P7906')
    await f.waitUntil(f.leased.lease!.expiresAt)
    assert.equal((await f.observer.query('SELECT clock_timestamp()<$1::timestamptz AS active',params([f.reservation.expiresAt])))[0]!.active,'t')
    const job = json<{attemptKey:string}>(await f.owner.query('SELECT official_v3_guard_private.recovery_jobs_v1() AS result'))
    assert.equal(job.attemptKey,f.start.attemptKey)
    await assert.rejects(f.owner.query('SELECT official_v3_guard_private.recovery_intake_v1($1::jsonb) AS result',params([JSON.stringify(job)])),stateError('P7906'))
    await f.refused('P7906')
    assert.equal((await f.finish()).status,'recorded')
    await f.waitUntil(f.reservation.expiresAt)
    assert.equal((await f.state()).completions,1); assert.equal((await f.state()).results,0)
    assert.deepEqual(json(await f.owner.query('SELECT official_v3_guard_private.recovery_jobs_v1() AS result')),job)
    await assert.rejects(f.owner.query('SELECT official_v3_guard_private.recovery_intake_v1($1::jsonb) AS result',params([JSON.stringify(job)])),stateError('P7906'))
    await f.refused('P7906')
  })
  await run('R02 a real PREPARED result refuses recovery after both leases expire',12000,10000,async f=>{
    assert.equal((await f.finish()).status,'recorded'); assert.equal((await f.prepare()).status,'prepared')
    await f.waitUntil(f.leased.lease!.expiresAt); await f.waitUntil(f.reservation.expiresAt)
    const state = await f.state(); assert.equal(state.results,1); assert.equal(state.dispositions,0)
    await assert.rejects(f.owner.query('SELECT official_v3_guard_private.recovery_jobs_v1() AS result'),stateError('P7906'))
    await f.refused('P7906')
  })
  await run('R02 a regular M04 complete winning the common lock refuses recovery',30000,20000,async f=>{
    assert.equal((await f.finish()).status,'recorded'); assert.equal((await f.prepare()).status,'prepared')
    const ended=await envelope({action:'complete',kind:'rule_research',input:{operationId:f.operation(),jobKey:f.claim.jobKey,
      fence:{jobId:f.leased.jobId,revision:f.leased.revision,leaseId:f.leased.lease!.leaseId,generation:f.leased.lease!.generation},decisionRef:f.prepared.decision.reference}},f.leased)
    const request:M04Operation={...ended,body:{...ended.body,disposition:{kind:'completed',attemptKey:f.start.attemptKey}}}
    const actor=await f.base.humanAs(1)
    let refused: Promise<unknown> | undefined
    try {
      await f.runtimeJobs.query('BEGIN'); assert.equal((await f.jobs(request,f.runtimeJobs)).status,'committed')
      refused=f.human('official_v3_guard_retire_v1',[f.operation(),'0'.repeat(64)],actor); void Promise.allSettled([refused])
      await f.blocked(actor.identity.pid,f.jobsIdentity.pid!)
      await f.runtimeJobs.query('COMMIT')
      await assert.rejects(refused,stateError('P0002'))
      const after=await f.state(); assert.equal(after.retired,0); assert.equal(after.receipts,0)
      assert.equal(after.open,false); assert.equal(after.results,1); assert.equal(after.dispositions,1)
      await f.refused('P0002')
    } finally { await f.runtimeJobs.query('ROLLBACK'); if(refused) await lifetime.drain([refused]); actor.connection.close() }
  })
  await run('R03 an actual terminal failure and a different normal claim/attempt refuse recovery',30000,5000,async f=>{
    // The local producer above has actually returned and owns no child work.
    // This known terminal fixture is distinct from the ambiguous Dev attempt.
    const fresh = await envelope({action:'fail',input:{operationId:f.operation(),jobKey:f.claim.jobKey,
      fence:{jobId:f.leased.jobId,revision:f.leased.revision,leaseId:f.leased.lease!.leaseId,generation:f.leased.lease!.generation},reason:'verification_unavailable'}},f.leased)
    const failed:M04Operation = {...fresh,body:{...fresh.body,disposition:{kind:'settled_failure',attemptKey:f.start.attemptKey,token:f.start.token}}}
    assert.equal((await f.jobs(failed,f.runtimeJobs)).status,'committed'); await f.refused('P0002')
    const prior=failed.body.commit.next; assert.ok(prior.nextAttemptAt)
    await f.waitUntil(prior.nextAttemptAt)
    const claim={...f.claim,operationId:f.operation(),leaseId:fixtureId('lease3','actual-second'),leaseMilliseconds:1500}
    const next=await envelope({action:'claim',input:claim},prior)
    assert.equal((await f.jobs(next,f.runtimeJobs)).status,'committed'); assert.equal(next.body.commit.next.attempt,2)
    const second=await f.jobs({operation:'execution_start',body:{claim,leasedJob:next.body.commit.next,subjectText:next.body.subjectText}},f.runtimeJobs)
    assert.ok(second.status==='reserved'); assert.notEqual(second.attemptKey,f.start.attemptKey)
    assert.ok(next.body.commit.next.lease); await f.waitUntil(next.body.commit.next.lease.expiresAt)
    await f.refused('P7906'); assert.equal((await f.state()).open,true)
  })
  for(const kind of ['s1','m04'] as const) for(const first of ['old','owner'] as const) {
    await run(`R04 ${kind} ${first}-first real lock race leaves only the confirmed retirement`,6000,6000,async f=>{
      if(kind==='s1'&&first==='old') {
        const before=await f.state(), certificates=(await f.observer.query('SELECT md5(jsonb_agg(to_jsonb(c) ORDER BY component)::text) AS digest FROM official_v3_guard_private.certificates_v1 c'))[0]!.digest
        await f.owner.query("BEGIN; SET LOCAL session_replication_role='replica'")
        await f.owner.query("UPDATE official_v3_intake_private.operations_v1 SET original_bytes=original_bytes||decode('20','hex'),proposal_digest=encode(sha256(original_bytes||decode('20','hex')),'hex')")
        await f.owner.query('COMMIT')
        try { await f.refused('P7905') }
        finally {
          await f.owner.query("BEGIN; SET LOCAL session_replication_role='replica'")
          await f.owner.query('UPDATE official_v3_intake_private.operations_v1 SET original_bytes=convert_to($1::text,\'UTF8\'),proposal_digest=$2::text',params([f.item.text,f.upload.digest]))
          await f.owner.query('COMMIT')
        }
        assert.deepEqual(await f.state(),before)
        assert.equal((await f.observer.query('SELECT md5(jsonb_agg(to_jsonb(c) ORDER BY component)::text) AS digest FROM official_v3_guard_private.certificates_v1 c'))[0]!.digest,certificates)
        await f.creator.query('SELECT official_v3_guard_private.check_certificates_v1()')
      }
      await f.retireRace(kind,first)
    })
  }
}

export async function runBg1Native(t: TestContext) {
  const deadline = new AbortController(), timer = setTimeout(() => deadline.abort(), 675000)
  const lifetime = new OwnedTestLifetime(AbortSignal.any([t.signal, deadline.signal]))
  const originalConnect = LocalPgConnection.connect
  lifetime.installConnectOwnership()
  let failure: unknown, clusterCount = 0
  const dispose: (() => Promise<void> | void)[] = []
  const completed: string[] = []
  try {
    const cluster = lifetime.startCluster(startLocalProofCluster); clusterCount++
    const bootstrap = await LocalPgConnection.connect(cluster)
    // Exact provider-role properties observed by Root; no fabricated cron.
    await bootstrap.query('CREATE ROLE supabase_read_only_user LOGIN NOINHERIT NOSUPERUSER BYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION')
    bootstrap.close()
    const base = await createBg1LocalPredecessor(lifetime, cluster, binding)
    const owner = base.bootstrap.connection, creator = base.creator.connection
    let epoch = 0, serial = 0
    const nextId = () => fixtureId('op3', 'human-' + (++serial))
    const nextMethodId = () => 'maop1_' + hrs1Hash({ fixture: 'BG1 human method', serial: ++serial }).slice(0, 32)
    async function observedAbsent(pid: string, birth: string) {
      const until = performance.now() + 5000
      for (;;) {
        const rows = await base.observer.connection.query('SELECT NOT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz) AS absent', params([pid, birth]))
        if (rows[0]?.absent === 't' || rows[0]?.absent === 'true') return
        assert.ok(performance.now() < until, 'actual backend must drain'); await lifetime.wait(5)
      }
    }
    async function blockedBy(pid: string, blocker: string) {
      const until = performance.now() + 2000
      for (;;) {
        const rows = await base.observer.connection.query('SELECT ($2::integer=ANY(pg_blocking_pids($1::integer)))::text AS blocked', params([pid, blocker]))
        if (rows[0]?.blocked === 'true') return
        assert.ok(performance.now() < until, 'actual pg_locks wait must be observed'); await lifetime.wait(5)
      }
    }
    async function human(name: string, values: readonly unknown[] = [], person: 1 | 2 | 3 = 1,
      held?: Awaited<ReturnType<typeof base.humanAs>>): Promise<unknown> {
      const actor = held ?? await base.humanAs(person)
      try {
        const casts = name === 'official_v3_method_stage_draft_v1' ? ['text','text','integer','text','text','integer']
          : name === 'official_v3_method_approve_v1' ? ['text','text','integer','text','text','integer','text','text','integer','text','text','text']
          : name === 'official_v3_method_revoke_v1' ? ['text','text','integer','text','text','integer']
          : name === 'official_v3_method_confirm_operation_v1' ? ['text','text','text','integer','text','text','integer','integer','text','text','integer','text','text','text']
          : values.map(() => 'text')
        return json(await actor.connection.query('SELECT public.' + name + '(' + casts.map((type, i) => `NULLIF($${i + 1}::text,'')::${type}`).join(',') + ') AS result', params(values)))
      } finally { if (!held) { actor.connection.close(); await observedAbsent(actor.identity.pid, actor.identity.birth) } }
    }
    async function method(action: 'stage' | 'approve' | 'revoke') {
      const operation = nextMethodId(), tuple = [operation, binding.methodId, 1, binding.methodDigest, binding.packageDigest]
      const before = epoch === 0 ? [null, null, null, 0, null] : [1, binding.methodDigest, binding.packageDigest, epoch, action === 'revoke' ? 'approved' : 'revoked']
      const args = action === 'stage' ? [...tuple, null] : action === 'approve' ? [...tuple, ...before, 'until_revoked', null] : [...tuple, epoch]
      const receipt = await human('official_v3_method_' + (action === 'stage' ? 'stage_draft' : action) + '_v1', args)
      assert.ok(receipt && typeof receipt === 'object' && 'status' in receipt && receipt.status === 'recorded')
      const confirmation = [operation, action, binding.methodId, 1, binding.methodDigest, binding.packageDigest, null,
        ...(action === 'stage' ? [null,null,null,null,null] : before),
        action === 'approve' ? 'until_revoked' : null, null]
      assert.deepEqual(await human('official_v3_method_confirm_operation_v1', confirmation), receipt, 'separate actual Owner session confirms immutable method operation')
      if (action !== 'stage') epoch++
    }
    async function jobs(request: M04Operation, connection = base.runtime[0]!.connection): Promise<M04NativeReply> {
      return json(await connection.query(M04_FIXED_SQL, params([hrs1Canonical({ ...request, phase: 'authorized' }),
        binding.methodId, 1, binding.methodDigest, binding.packageDigest, epoch, 5000, new Date(Date.now() + 5000).toISOString()])))
    }
    async function hrs(operation: Hrs1Operation, body: Record<string, unknown>, channel: 'read' | 'attest' | 'execute', selectedEpoch = epoch): Promise<Hrs1Reply> {
      const login = channel === 'attest' ? 'ot_v3_result_verifier' : channel === 'read' && operation === 'ch_de_snapshot' ? 'ot_v3_result_reader' : 'ot_v3_result_writer'
      const connection = await LocalPgConnection.connect(cluster, login)
      const identity = (await connection.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE pid=pg_backend_pid()'))[0]!
      try {
        const clock = hrs1Clock(new Date().toISOString(), binding.legalTimeZone); assert.ok(clock)
        return json(await connection.query(HRS1_SQL[channel], params([hrs1Canonical({ schema: 1, operation, bindingHash: hrs1Hash(binding), body }),
          hrs1Hash(binding), binding.methodId, 1, binding.methodDigest, binding.packageDigest, selectedEpoch,
          operation === 'ch_de_snapshot' ? 750 : 5000, new Date(Date.now() + (operation === 'ch_de_snapshot' ? 750 : 5000)).toISOString(), clock.legalDate])))
      } finally { connection.close(); await observedAbsent(identity.pid!, identity.birth!) }
    }
    const immutableTables = ['official_v3_method_private.revisions_v1','official_v3_method_private.operations_v1','official_v3_method_private.heads_v1',
      'official_v3_intake_private.operations_v1','official_v3_intake_private.reservations_v1','official_v3_intake_private.completions_v1',
      'official_v3_jobs_private.queue_operations_v1','official_v3_jobs_private.execution_starts_v1','official_v3_jobs_private.execution_results_v1',
      'official_v3_jobs_private.execution_dispositions_v1','official_v3_jobs_private.catalog_binding_v1',
      'official_v3_result_private.originals_v1','official_v3_result_private.extractions_v1',
      'official_v3_result_private.qualifications_v1','official_v3_result_private.binding_v1']
    async function retained(connection = owner) {
      const values: Record<string, string> = {}
      for (const table of immutableTables) values[table] = (await connection.query(`SELECT md5(COALESCE(jsonb_agg(to_jsonb(x) ORDER BY to_jsonb(x)::text)::text,'[]')) AS digest FROM ${table} x`))[0]!.digest!
      return values
    }
    async function proof(name: string, body: (subtest: TestContext) => Promise<void>) {
      let actual: Promise<void> | undefined
      await t.test(name, async subtest => { actual = lifetime.run(() => body(subtest)); await actual })
      assert.ok(actual); const [settled] = await lifetime.drain([actual])
      if (settled.status === 'rejected') throw settled.reason
      completed.push(name); t.diagnostic('BG1 ' + name + ' complete')
    }
    await method('stage'); await method('approve')
    const identity = createV3WorkIdentity({ context: program.context, method: program.method, factKind: 'requirement_effect', researchReason: { status: 'missing' } }); assert.ok(identity.ok)
    const enqueued = await envelope({ action: 'enqueue', kind: 'rule_research', input: { context: program.context, method: program.method,
      factKind: 'requirement_effect', researchReason: { status: 'missing' }, operationId: fixtureId('op3','enqueue'), jobId: fixtureId('job3','first'), attemptLimit: 4 } }, null)
    assert.equal((await jobs(enqueued)).status, 'committed')
    const claim = { operationId: fixtureId('op3','claim'), jobKey: identity.value.jobKey, leaseId: fixtureId('lease3','first'), leaseMilliseconds: 30000 }
    const claimed = await envelope({ action: 'claim', input: claim }, enqueued.body.commit.next)
    assert.equal((await jobs(claimed)).status, 'committed')
    const leased = claimed.body.commit.next
    const start = await jobs({ operation: 'execution_start', body: { claim, leasedJob: leased, subjectText: claimed.body.subjectText } })
    assert.equal(start.status, 'reserved'); if (start.status !== 'reserved') assert.fail('actual start required')
    assert.ok(leased.lease)
    const delivery = await AA_CH_DE_DELIVERY_PRODUCER.produce({ job: leased, fence: { jobId: leased.jobId, revision: leased.revision,
      leaseId: leased.lease.leaseId, generation: leased.lease.generation } }, lifetime.signal)
    assert.equal(delivery.status, 'delivered'); if (delivery.status !== 'delivered') assert.fail('fixed deterministic producer')
    const item = delivery.deliveries[0]!, upload = readV3RetainableProposal(item.text, program.registry); assert.ok(upload.ok)
    const intake = base.runtime[1]!.connection
    assert.equal(json<{ status: string }>(await intake.query('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result', params([JSON.stringify(item.binding), item.text, upload.value.digest]))).status, 'recorded')
    const reservation = json<Record<string, unknown>>(await intake.query('SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result', params([JSON.stringify(item.binding), upload.value.digest, upload.value.bytes, 5000])))
    assert.equal(reservation.status, 'acquired')
    const verification = fixtureVerification(new Date().toISOString())
    assert.equal((await hrs('attest', { kind: 'verification', verification }, 'attest')).status, 'recorded')

    // A second, terminal key plus same-revision dedup is essential: the audit
    // must not inspect just the selected research key or sort by observedAt.
    const secondInput = { destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: program.method,
      operationId: fixtureId('op3','second-enqueue'), jobId: fixtureId('job3','second'), attemptLimit: 1 }
    const second = await envelope({ action: 'enqueue', kind: 'combination_discovery', input: secondInput }, null)
    assert.equal((await jobs(second)).status, 'committed')
    const dedup = await envelope({ action: 'enqueue', kind: 'combination_discovery', input: { ...secondInput, operationId: fixtureId('op3','dedup') } }, second.body.commit.next)
    assert.equal((await jobs(dedup)).status, 'committed')
    const otherClaim = { operationId: fixtureId('op3','second-claim'), jobKey: second.body.commit.jobKey, leaseId: fixtureId('lease3','second'), leaseMilliseconds: 30000 }
    const otherLeased = await envelope({ action: 'claim', input: otherClaim }, second.body.commit.next)
    assert.equal((await jobs(otherLeased)).status, 'committed')
    const otherStart = await jobs({ operation: 'execution_start', body: { claim: otherClaim, leasedJob: otherLeased.body.commit.next, subjectText: otherLeased.body.subjectText } })
    assert.equal(otherStart.status, 'reserved'); if (otherStart.status !== 'reserved') assert.fail('actual second start')
    const otherJob = otherLeased.body.commit.next; assert.ok(otherJob.lease)
    const otherEnd = await envelope({ action: 'fail', input: { operationId: fixtureId('op3','second-fail'), jobKey: otherClaim.jobKey,
      fence: { jobId: otherJob.jobId, revision: otherJob.revision, leaseId: otherJob.lease.leaseId, generation: otherJob.lease.generation }, reason: 'unreachable' } }, otherJob)
    // This separate test producer is synchronously terminal and owns no child.
    assert.equal((await jobs({ ...otherEnd, body: { ...otherEnd.body, disposition: { kind: 'settled_failure', attemptKey: otherStart.attemptKey, token: otherStart.token } } })).status, 'committed')
    for (const entry of base.runtime) { entry.connection.close(); await observedAbsent(entry.identity.pid, entry.identity.birth) }
    // Only a local stand-in for the provider's migration-history transaction,
    // outside every protected namespace and owned by the existing postgres.
    await owner.query('CREATE SCHEMA bg1_provider_fixture AUTHORIZATION postgres; SET ROLE postgres; CREATE TABLE bg1_provider_fixture.history(body_sha256 text PRIMARY KEY); RESET ROLE')
    const before = await retained()
    const sql = readFileSync(new URL('./upgrade-candidate.sql', import.meta.url), 'utf8')
    const providerBody = readFileSync(new URL('./provider-migration-body.sql', import.meta.url), 'utf8')
    const providerHash = createHash('sha256').update(providerBody).digest('hex')
    async function installationState(connection: LocalPgConnection) {
      return json<{ installed: boolean; markers: string[]; memberships: string }>(await connection.query(`SELECT jsonb_build_object(
        'installed',to_regnamespace('official_v3_guard_private') IS NOT NULL,
        'markers',(SELECT COALESCE(jsonb_agg(body_sha256 ORDER BY body_sha256),'[]'::jsonb) FROM bg1_provider_fixture.history),
        'memberships',(SELECT md5(COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.oid)::text,'[]')) FROM pg_auth_members m)
      ) AS result`))
    }
    const uninstalled = await installationState(base.observer.connection)
    assert.equal(uninstalled.installed, false); assert.deepEqual(uninstalled.markers, [])
    async function rollbackObserved() {
      const fresh = await LocalPgConnection.connect(cluster)
      try {
        assert.deepEqual(await installationState(fresh), uninstalled, 'fresh backend sees no installed schema, marker or changed membership')
        assert.deepEqual(await retained(fresh), before, 'old approvals, original bytes and journals survive outer rollback')
      } finally { fresh.close() }
    }
    async function providerBegin(isolation: 'READ COMMITTED' | 'REPEATABLE READ' = 'READ COMMITTED') {
      await creator.query('BEGIN ISOLATION LEVEL ' + isolation)
      assert.equal((await creator.query('SELECT count(*)::text AS n FROM bg1_provider_fixture.history'))[0]!.n, '0',
        'provider has already read its migration metadata before receiving the body')
    }
    await creator.query("SET jetnity.bg1_target='dev:yfvbxvijcorffwxbxahl:BG1'")
    async function refusedUpgrade(expectedCode: string, provider = false) {
      try {
        if (provider) await providerBegin()
        await assert.rejects(creator.query(provider ? providerBody : sql), stateError(expectedCode))
      } finally { await creator.query('ROLLBACK') }
      await rollbackObserved()
    }
    await proof('B01 used predecessor rollback and exact original journals', async () => {
      // Standalone still requires the operator's explicit exact target. Its
      // core must never silently repair a missing or incorrect selection.
      await creator.query('RESET jetnity.bg1_target'); await refusedUpgrade('P7901')
      await creator.query("SET jetnity.bg1_target='local-provider-fixture-unselected'"); await refusedUpgrade('P7901')
      await creator.query("SET jetnity.bg1_target='dev:yfvbxvijcorffwxbxahl:BG1'")
      await owner.query('ALTER TABLE public.profiles DISABLE TRIGGER profiles_autoritaet_integritaet_v1')
      await refusedUpgrade('P7905'); await refusedUpgrade('P7905', true)
      await owner.query('ALTER TABLE public.profiles ENABLE TRIGGER profiles_autoritaet_integritaet_v1')
      // This old mutable-head edit passes the historical single-transition
      // validator; the new full replay must abort the whole unchanged upgrade.
      await owner.query('UPDATE official_v3_jobs_private.subjects_v1 SET current_job=$2::jsonb WHERE job_key=$1', params([otherClaim.jobKey, hrs1Canonical(second.body.commit.next)]))
      await refusedUpgrade('P7905'); await refusedUpgrade('P7905', true)
      await owner.query('UPDATE official_v3_jobs_private.subjects_v1 SET current_job=$2::jsonb WHERE job_key=$1', params([otherClaim.jobKey, hrs1Canonical(otherEnd.body.commit.next)]))
      assert.deepEqual(await retained(), before)
      // The provider body alone supplies a transaction-local fixed Dev target.
      // The pre-existing operator setting is restored on rollback and commit.
      await creator.query("SET jetnity.bg1_target='local-provider-fixture-unselected'")
      try {
        await providerBegin('REPEATABLE READ')
        await assert.rejects(creator.query(providerBody), stateError('P7901'))
      } finally { await creator.query('ROLLBACK') }
      await rollbackObserved()
      try {
        await providerBegin()
        await creator.query(providerBody)
        await creator.query('INSERT INTO bg1_provider_fixture.history VALUES($1::text)', params([providerHash]))
        // These reads deliberately avoid old tables locked by the upgrade.
        assert.deepEqual(await installationState(base.observer.connection), uninstalled)
        await assert.rejects(creator.query('SELECT 1/0'), stateError('22012'))
      } finally { await creator.query('ROLLBACK') }
      await rollbackObserved()
      assert.equal((await creator.query("SELECT current_setting('jetnity.bg1_target') AS target"))[0]!.target, 'local-provider-fixture-unselected')
      try {
        await providerBegin()
        await creator.query(providerBody)
        await creator.query('INSERT INTO bg1_provider_fixture.history VALUES($1::text)', params([providerHash]))
        assert.deepEqual(await installationState(base.observer.connection), uninstalled)
        await creator.query('COMMIT')
      } catch (error) { await creator.query('ROLLBACK'); throw error }
      assert.deepEqual(await installationState(base.observer.connection), { ...uninstalled, installed: true, markers: [providerHash] })
      assert.equal((await creator.query("SELECT current_setting('jetnity.bg1_target') AS target"))[0]!.target, 'local-provider-fixture-unselected')
      assert.deepEqual(await retained(), before, 'used approvals, source bytes, claims and old baseline rows are byte-identical')
      assert.equal((await creator.query("SELECT count(*)::text AS n FROM pg_auth_members WHERE member='postgres'::regrole AND grantor='postgres'::regrole AND roleid IN ('ot_v3_result_owner'::regrole,'ot_v3_jobs_owner'::regrole,'ot_v3_intake_owner'::regrole)"))[0]!.n, '0')
      assert.equal(json<{ status: string }>(await creator.query('SELECT official_v3_guard_private.alarm_status_v1() AS result')).status, 'unchecked')
    })
    await proof('B02 original checksum, full key history, certificate chain and catalog tamper refuse', async () => {
      const probes = [
        "UPDATE official_v3_jobs_private.subjects_v1 SET current_job=(SELECT envelope_text::jsonb->'next' FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id='" + secondInput.operationId + "') WHERE job_key='" + otherClaim.jobKey + "'",
        "UPDATE official_v3_intake_private.operations_v1 SET original_bytes=original_bytes||decode('20','hex'),proposal_digest=encode(sha256(original_bytes||decode('20','hex')),'hex')",
        "UPDATE official_v3_method_private.heads_v1 SET epoch=epoch+2",
        "UPDATE official_v3_result_private.originals_v1 SET body_text=body_text||'x'",
        "UPDATE official_v3_guard_private.certificates_v1 SET generation=generation+1 WHERE component='jobs'",
      ]
      for (const query of probes) {
        await owner.query("BEGIN; SET LOCAL session_replication_role='replica'")
        try {
          await owner.query(query)
          await assert.rejects(owner.query('SELECT official_v3_guard_private.check_certificates_v1(); SELECT official_v3_guard_private.check_hrs_v1(); SELECT official_v3_guard_private.check_jobs_v1()'))
        } finally { await owner.query('ROLLBACK') }
      }
      await owner.query('BEGIN; ALTER TABLE public.profiles DISABLE TRIGGER profiles_autoritaet_integritaet_v1')
      try { await assert.rejects(owner.query('SELECT official_v3_guard_private.assert_catalog_v1()')) }
      finally { await owner.query('ROLLBACK') }
      // Timeout before the inner exception block cannot persist an incident;
      // no proof exists, so another connection still observes fail-closed.
      await owner.query('BEGIN; SELECT pg_advisory_xact_lock(771106,1)')
      await creator.query("SET statement_timeout='400ms'")
      const outside = assert.rejects(creator.query('SELECT official_v3_guard_private.audit_v1()'), stateError('57014'))
      try { await blockedBy(base.creator.identity.pid, base.bootstrap.identity.pid); await outside }
      finally { await owner.query('ROLLBACK'); await outside }
      assert.equal(json<{ status: string }>(await base.observer.connection.query('SELECT official_v3_guard_private.alarm_status_v1() AS result')).status, 'unchecked')
      // Cancellation INSIDE the checker subtransaction is caught. Its negative
      // run and sticky incident must then really commit and be seen elsewhere.
      await owner.query('BEGIN; LOCK TABLE official_v3_method_private.revisions_v1 IN ACCESS EXCLUSIVE MODE')
      const inside = creator.query('SELECT official_v3_guard_private.audit_v1() AS result')
      const joined = Promise.allSettled([inside])
      try { await blockedBy(base.creator.identity.pid, base.bootstrap.identity.pid); assert.equal(json<{ status: string }>(await inside).status, 'incident') }
      finally { await owner.query('ROLLBACK'); await joined; await creator.query("SET statement_timeout='25s'") }
      const negative = json<Record<string, unknown>>(await base.observer.connection.query('SELECT to_jsonb(s) AS result FROM official_v3_guard_private.state_v1 s'))
      assert.equal(negative.generation, 0); assert.equal(negative.incident_generation, 1)
      assert.equal(json<{ status: string }>(await creator.query('SELECT official_v3_guard_private.alarm_status_v1() AS result')).status, 'incident')
      assert.equal((await creator.query("SELECT outcome FROM official_v3_guard_private.runs_v1"))[0]!.outcome, 'expired')
      // Same due slot is idempotent, including refused/late retries.
      await creator.query('SELECT official_v3_guard_private.audit_v1()')
      assert.deepEqual(json(await creator.query('SELECT to_jsonb(s) AS result FROM official_v3_guard_private.state_v1 s')), negative)
      await assert.rejects(creator.query('SELECT official_v3_guard_private.require_open_v1()'))
    })
    await proof('B03 exact expired unknown recovery, real Owner/AAL2 and separate confirmation', async () => {
      const until = Date.parse(leased.lease!.expiresAt) + 5
      while (Date.now() < until) await lifetime.wait(Math.min(1000, until - Date.now()))
      for (const person of [2,3] as const) await assert.rejects(human('official_v3_guard_review_v1', [], person))
      await assert.rejects(creator.query('SELECT public.official_v3_guard_review_v1()'))
      const reviewed = readDevGuardReview(await human('official_v3_guard_review_v1')); assert.ok(reviewed)
      assert.equal(reviewed.retirement.status, 'reviewable'); if (reviewed.retirement.status !== 'reviewable') assert.fail('precise original must be reviewable')
      const operation = nextId(), selection = reviewed.retirement.selection
      await assert.rejects(human('official_v3_guard_retire_v1', [operation, '0'.repeat(64)]))
      for (const person of [2,3] as const) await assert.rejects(human('official_v3_guard_retire_v1', [operation, selection], person))
      const actor = await base.humanAs(1)
      try {
        // Genuine method transactions, rolled back after the negative probe:
        // the original reviewed retirement cannot authorize an Epoch3 case.
        await actor.connection.query('BEGIN')
        await human('official_v3_method_revoke_v1', [nextMethodId(), binding.methodId, 1, binding.methodDigest, binding.packageDigest, 1], 1, actor)
        await human('official_v3_method_approve_v1', [nextMethodId(), binding.methodId, 1, binding.methodDigest, binding.packageDigest,
          1, binding.methodDigest, binding.packageDigest, 2, 'revoked', 'until_revoked', null], 1, actor)
        const newEpoch = readDevGuardReview(await human('official_v3_guard_review_v1', [], 1, actor)); assert.ok(newEpoch)
        assert.equal(newEpoch.incident.methodEpoch, 3); assert.equal(newEpoch.retirement.status, 'unavailable')
        await assert.rejects(human('official_v3_guard_retire_v1', [operation, selection], 1, actor))
        await actor.connection.query('ROLLBACK')
        const who = (await actor.connection.query("SELECT auth.uid()::text AS actor,auth.jwt()->>'session_id' AS session"))[0]!
        // A retained selection does not retain actor authority. The actual PG1
        // NOWAIT row locks refuse an in-flight session/profile revoke as well.
        for (const mutation of [
          'UPDATE auth.sessions SET aal=\'aal1\' WHERE id=$1::uuid',
          'DELETE FROM auth.sessions WHERE id=$1::uuid',
          'UPDATE auth.users SET deleted_at=clock_timestamp() WHERE id=$1::uuid',
          'UPDATE public.profiles SET role=\'moderator\' WHERE user_id=$1::uuid',
        ]) {
          await owner.query("BEGIN; SET LOCAL session_replication_role='replica'")
          try {
            await owner.query(mutation, params([mutation.includes('auth.sessions') ? who.session : who.actor]))
            await assert.rejects(human('official_v3_guard_retire_v1', [operation, selection], 1, actor))
          } finally { await owner.query('ROLLBACK') }
        }
      } finally { await actor.connection.query('ROLLBACK'); actor.connection.close(); await observedAbsent(actor.identity.pid, actor.identity.birth) }
      assert.deepEqual(await retained(), before)
      for (const role of ['anon', 'service_role', 'ot_v3_jobs_caller', 'ot_v3_intake_caller', 'ot_v3_result_writer', 'ot_v3_result_reader', 'ot_v3_result_verifier']) {
        await owner.query('BEGIN; SET LOCAL ROLE ' + role)
        try { await assert.rejects(owner.query('SELECT public.official_v3_guard_retire_v1($1::text,$2::text)', params([operation, selection]))) }
        finally { await owner.query('ROLLBACK') }
      }
      const receipt = await human('official_v3_guard_retire_v1', [operation, selection])
      assert.equal((receipt as { result: string }).result, 'unknown_retired')
      assert.deepEqual(await human('official_v3_guard_confirm_v1', [operation, 'retire_unknown', selection]), receipt)
      assert.deepEqual(await human('official_v3_guard_retire_v1', [operation, selection]), receipt)
      await assert.rejects(human('official_v3_guard_retire_v1', [operation, 'f'.repeat(64)]))
      assert.deepEqual(await retained(), before, 'retirement leaves every old immutable row and original byte unchanged')
      assert.equal((await owner.query('SELECT open_attempt IS NULL AS closed FROM official_v3_jobs_private.subjects_v1 WHERE job_key=$1', params([claim.jobKey])))[0]!.closed, 't')
      assert.equal((await owner.query('SELECT current_job=$2::jsonb AS same FROM official_v3_jobs_private.subjects_v1 WHERE job_key=$1', params([claim.jobKey, hrs1Canonical(leased)])))[0]!.same, 't')
      // General incident resume follows a legitimate new current method epoch;
      // exact first-import retirement is not broadened to that epoch.
      await method('revoke'); await method('approve'); assert.equal(epoch, 3)
      const changed = readDevGuardReview(await human('official_v3_guard_review_v1')); assert.ok(changed)
      assert.equal(changed.incident.methodEpoch, 3); assert.equal(changed.incident.canResume, false)
    })
    await proof('B04 genuine next due proof stays sticky until exact Owner resume', async subtest => {
      const due = (await creator.query("SELECT extract(epoch FROM date_bin(interval '5 minutes',clock_timestamp(),'2000-01-01'::timestamptz)+interval '5 minutes')::text AS seconds"))[0]!.seconds!
      const waitUntil = Number(due) * 1000 + 20
      await recoveryCases(subtest,lifetime,()=>{clusterCount++})
      while (Date.now() < waitUntil) await lifetime.wait(Math.min(1000, waitUntil - Date.now()))
      await creator.query('SELECT official_v3_guard_private.audit_v1()')
      const state = json<{ generation: number; incident_generation: number; resumed_generation: number }>(await creator.query('SELECT to_jsonb(s) AS result FROM official_v3_guard_private.state_v1 s'))
      assert.equal(state.generation, 1); assert.ok(state.incident_generation > state.resumed_generation)
      await assert.rejects(creator.query('SELECT official_v3_guard_private.require_open_v1()'))
      const reviewed = readDevGuardReview(await human('official_v3_guard_review_v1')); assert.ok(reviewed)
      assert.equal(reviewed.incident.canResume, true); assert.equal(reviewed.incident.methodEpoch, 3)
      const operation = nextId(), selection = reviewed.incident.selection
      await assert.rejects(human('official_v3_guard_resume_v1', [operation, '0'.repeat(64)]))
      for (const person of [2,3] as const) await assert.rejects(human('official_v3_guard_resume_v1', [operation, selection], person))
      const receipt = await human('official_v3_guard_resume_v1', [operation, selection])
      assert.deepEqual(await human('official_v3_guard_confirm_v1', [operation, 'resume', selection]), receipt)
      await creator.query('SELECT official_v3_guard_private.require_open_v1()')
    })
    await proof('B05 old operation tombstones, new normal claim and unchanged heartbeat', async () => {
      const beforeState = (await creator.query('SELECT valid_until::text AS cap FROM official_v3_guard_private.state_v1'))[0]!.cap
      const currentJobs = await LocalPgConnection.connect(cluster, base.bound[0]!.login)
      const currentIntake = await LocalPgConnection.connect(cluster, base.bound[1]!.login)
      try {
        await currentJobs.query('SET ROLE ot_v3_jobs_caller'); await currentIntake.query('SET ROLE ot_v3_intake_caller')
        assert.equal(json<{ status: string }>(await currentIntake.query('SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result', params([JSON.stringify(item.binding), upload.value.digest, upload.value.bytes, 5000]))).status, 'unconfirmed')
        const oldReference = { binding: item.binding, proposalDigest: upload.value.digest, bytes: upload.value.bytes }
        const oldPrepare: M04Operation = { operation: 'execution_prepare', body: { claim, attemptKey: start.attemptKey, token: start.token,
          result: { kind: 'rule_research', jobId: leased.jobId, operationId: leased.operationId, jobKey: claim.jobKey,
            preparedAt: verification.decision.evaluatedAt, decisionRef: verification.decision.reference }, references: [oldReference] } }
        assert.equal((await jobs(oldPrepare, currentJobs)).status, 'blocked')
        // Isolate the new lowest tombstone with the ORIGINAL epoch and full
        // otherwise well-formed data, before ordinary later-epoch admission.
        assert.deepEqual(json(await owner.query('SELECT official_v3_jobs_private.tx_execution_prepare_v1($1::jsonb,$2::jsonb,1,5000,clock_timestamp()+interval \'5 seconds\') AS result',
          params([hrs1Canonical(oldPrepare), hrs1Canonical({ methodId: binding.methodId, revision: 1, methodDigest: binding.methodDigest, packageDigest: binding.packageDigest })]))),
          { reply: { status: 'blocked' }, authority: false })
        const oldPrepared = fixturePrepared(upload.value, verification).prepared
        await assert.rejects(owner.query('SELECT official_v3_result_private.consume_s1_v1($1::jsonb,$2::jsonb,$3::jsonb)',
          params([JSON.stringify(oldReference), JSON.stringify({ status: 'prepared', value: oldPrepared }), hrs1Canonical(binding)])), stateError('P7906'))
        const oldOutcome = { status: 'unavailable', reason: 'verification_unavailable' }
        const oldAudit = { schema: 3, kind: 'import_attempt_record', operationId: item.binding.operationId,
          proposalDigest: upload.value.digest, jobId: leased.jobId, contextKey: binding.contextKey, method: program.method,
          recordedAt: verification.decision.evaluatedAt, result: 'unavailable', decisionRef: null, escalationKey: null }
        assert.equal(json<{ status: string }>(await currentIntake.query('SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
          params([JSON.stringify(item.binding), upload.value.digest, upload.value.bytes, reservation.generation, reservation.leaseToken,
            JSON.stringify(oldOutcome), JSON.stringify(oldAudit)]))).status, 'unconfirmed')
        const nextClaim = { ...claim, operationId: fixtureId('op3','next-claim'), leaseId: fixtureId('lease3','next') }
        const next = await envelope({ action: 'claim', input: nextClaim }, leased)
        assert.equal((await jobs(next, currentJobs)).status, 'committed'); assert.equal(next.body.commit.next.attempt, 2)
        const j = next.body.commit.next; assert.ok(j.lease)
        const nextDelivery = await AA_CH_DE_DELIVERY_PRODUCER.produce({ job: j, fence: { jobId: j.jobId, revision: j.revision,
          leaseId: j.lease.leaseId, generation: j.lease.generation } }, lifetime.signal)
        assert.equal(nextDelivery.status, 'delivered'); if (nextDelivery.status !== 'delivered') assert.fail('new delivery')
        assert.notEqual(nextDelivery.deliveries[0]!.binding.operationId, item.binding.operationId)
        // Actual authorized local APIs create the positive reader fixture.
        // These invented originals are NOT an official source-custody proof.
        const nextItem = nextDelivery.deliveries[0]!, nextUpload = readV3RetainableProposal(nextItem.text, program.registry); assert.ok(nextUpload.ok)
        const reference = { binding: nextItem.binding, proposalDigest: nextUpload.value.digest, bytes: nextUpload.value.bytes }
        assert.equal(json<{ status: string }>(await currentIntake.query('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
          params([JSON.stringify(nextItem.binding), nextItem.text, nextUpload.value.digest]))).status, 'recorded')
        const acquired = json<Record<string, unknown>>(await currentIntake.query('SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
          params([JSON.stringify(nextItem.binding), nextUpload.value.digest, nextUpload.value.bytes, 5000])))
        assert.equal(acquired.status, 'acquired')
        const qualified = fixtureVerification(new Date().toISOString(), hrs1Ref('source-decision', {
          operationId: nextItem.binding.operationId, proposalDigest: nextUpload.value.digest, contextKey: binding.contextKey, method: program.method, predecessor: null }))
        assert.equal((await hrs('attest', { kind: 'verification', verification: qualified }, 'attest')).status, 'recorded')
        const { prepared, projection } = fixturePrepared(nextUpload.value, qualified)
        const outcome = { status: 'prepared', value: prepared }, audit = { ...oldAudit, operationId: nextItem.binding.operationId,
          proposalDigest: nextUpload.value.digest, recordedAt: new Date().toISOString(), result: 'prepared', decisionRef: prepared.decision.reference }
        assert.equal(json<{ status: string }>(await currentIntake.query('SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
          params([JSON.stringify(nextItem.binding), nextUpload.value.digest, nextUpload.value.bytes, acquired.generation, acquired.leaseToken,
            JSON.stringify(outcome), JSON.stringify(audit)]))).status, 'recorded')
        const plan = createV3TransitionIdempotencyKey(prepared.transition); assert.ok(plan.ok)
        const transition = { operationKey: hrs1Ref('version-commit', { planKey: plan.value, prepared }), prepared,
          expectedHead: { pointer: prepared.transition.expected, sourceDecisionRef: null, historyArchive: null }, verificationRef: qualified.reference, intake: reference }
        assert.equal((await hrs('transition', transition, 'execute')).status, 'committed')
        const publication = { operationId: prepared.transition.operationId,
          operationKey: hrs1Ref('projection-publish', { operationId: prepared.transition.operationId, prepared, projection }),
          prepared, projection, verificationRef: qualified.reference, intake: reference }
        assert.equal((await hrs('publication', publication, 'execute')).status, 'reported')
        assert.equal((await hrs('publication_confirm', publication, 'read')).status, 'confirmed')
        assert.equal((await creator.query('SELECT valid_until::text AS cap FROM official_v3_guard_private.state_v1'))[0]!.cap, beforeState)
        await creator.query('SELECT official_v3_guard_private.check_certificates_v1(); SELECT official_v3_guard_private.check_jobs_v1(); SELECT official_v3_guard_private.check_retirements_v1()')
      } finally { currentJobs.close(); currentIntake.close() }
    })
    await proof('B06 real two-effect reader joins native drain and retains 750ms', async () => {
      const native = await createM04NativeExecutors(cluster, lifetime), methodNative = await createMa1NativeExecutor(cluster, lifetime)
      const resultNative = await createBg1LocalHrsExecutors(lifetime, cluster)
      dispose.push(() => native.dispose(), () => methodNative.closeObserver(), () => resultNative.dispose())
      let pauseMethod = false, methodArrived = false, releaseMethod: (() => void) | undefined
      const facade = createV3PostgresResultJobs({ binding, registry: program.registry, clock: () => hrs1Clock(new Date().toISOString(), binding.legalTimeZone)!,
        methodExecutor: { async readCurrent(...args: Parameters<typeof methodNative.executor.readCurrent>) {
          const reply = await methodNative.executor.readCurrent(...args)
          if (pauseMethod) { methodArrived = true; await new Promise<void>(resolve => { releaseMethod = resolve }) }
          return reply
        } }, intakeExecutor: native.intake, jobsExecutor: native.jobs, producer: AA_CH_DE_DELIVERY_PRODUCER,
        result: { binding, writerExecutor: resultNative.writer, readerExecutor: resultNative.reader, verifierExecutor: resultNative.verifier,
          ids: () => ({ jobId: fixtureId('job3','public'), operationId: fixtureId('op3','public') }) } })
      const previous = await retained(), cap = (await creator.query('SELECT valid_until::text AS cap FROM official_v3_guard_private.state_v1'))[0]!.cap
      const started = performance.now()
      const answer = await facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, lifetime.signal)
      assert.equal(answer.ok, true)
      if (!answer.ok) assert.fail('actual 750ms selected reader did not complete')
      assert.equal(answer.answer.response.cells[0]!.results[0]!.status, 'accepted', 'actual accepted head; SQL error or unavailable can never satisfy this proof')
      assert.ok(performance.now() - started < 750)
      assert.equal(methodNative.evidence.admitted, 1); assert.equal(resultNative.evidence.admitted, 1)
      assert.equal(resultNative.evidence.drained, 1); assert.equal(native.evidence.admitted, 0)
      assert.equal(resultNative.evidence.acknowledged, 1); assert.equal(resultNative.evidence.dispatched, 1)
      assert.equal(resultNative.evidence.sqlCodes.length, 0)
      assert.ok(resultNative.evidence.calls.every(c => c.drained && c.committed && c.operation === 'ch_de_snapshot'))
      methodNative.assertHealthy()
      assert.ok(methodNative.evidence.calls.every(c => c.pending === 0 && c.joined && c.targetAbsent && c.controlAbsent))
      // A current read does not renew audit evidence or create results/jobs.
      assert.equal(json<{ status: string }>(await creator.query('SELECT official_v3_guard_private.alarm_status_v1() AS result')).status, 'current')
      assert.deepEqual(await retained(), previous)
      assert.equal((await creator.query('SELECT valid_until::text AS cap FROM official_v3_guard_private.state_v1'))[0]!.cap, cap)
      // Revoke commits after the actual MA1 read, before the lower HRS fence.
      // The real private receipt is constructed only by the existing authority.
      pauseMethod = true
      const pending = facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, lifetime.signal)
      const joined = Promise.allSettled([pending])
      try {
        const until = performance.now() + 1000
        while (!methodArrived) { assert.ok(performance.now() < until); await lifetime.wait(2) }
        await method('revoke'); assert.ok(releaseMethod); releaseMethod()
        assert.equal((await pending).ok, false)
      } finally { pauseMethod = false; releaseMethod?.(); await joined }
      assert.ok(resultNative.evidence.sqlCodes.includes('P7504'), 'actual unchanged SQL method fence rejects the old epoch')
      await method('approve')
      // Abort a truly dispatched reader while it waits on the real guard row.
      await owner.query('BEGIN; SELECT singleton FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE')
      const stop = new AbortController(), abortRead = facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, stop.signal)
      const abortJoined = Promise.allSettled([abortRead])
      try {
        const until = performance.now() + 1000
        for (;;) {
          const active = resultNative.activeIdentities().find(c => c.operation === 'ch_de_snapshot')
          if (active) { await blockedBy(active.target.pid, base.bootstrap.identity.pid); break }
          assert.ok(performance.now() < until); await lifetime.wait(2)
        }
        stop.abort(); assert.equal((await abortRead).ok, false)
      } finally { stop.abort(); await owner.query('ROLLBACK'); await abortJoined }
      assert.ok(resultNative.evidence.calls.every(c => c.drained))
      assert.equal(resultNative.snapshot().active, 0)
      // Genuine standalone MA1 receipt custody and expiry. Neither forged nor
      // another authority instance's receipt performs an extra database call.
      const tuple = { methodId: binding.methodId, revision: 1, methodDigest: binding.methodDigest, packageDigest: binding.packageDigest }
      const first = createV3PostgresMethodAuthority(tuple, methodNative.executor), second = createV3PostgresMethodAuthority(tuple, methodNative.executor)
      const current = await first.resolveCurrent(program.method, new Date().toISOString()); assert.ok(current.status === 'approved')
      const calls = methodNative.evidence.admitted
      assert.equal((await first.reproveAtCommit({} as typeof current.receipt, program.method, new Date().toISOString())).status, 'unavailable')
      assert.equal((await second.reproveAtCommit(current.receipt, program.method, new Date().toISOString())).status, 'unavailable')
      assert.equal(methodNative.evidence.admitted, calls)
      await lifetime.wait(MA1_LIMITS.receiptMs + 5)
      assert.equal((await first.reproveAtCommit(current.receipt, program.method, new Date().toISOString())).status, 'expired')
      assert.equal(methodNative.evidence.admitted, calls)
      methodNative.assertHealthy()
    })
    await proof('B07 actual missed due, future evidence and late repair remain closed and idempotent', async () => {
      await owner.query("BEGIN; UPDATE official_v3_guard_private.state_v1 SET last_observed=clock_timestamp()+interval '1 minute'")
      try {
        assert.equal(json<{ status: string }>(await owner.query('SELECT official_v3_guard_private.alarm_status_v1() AS result')).status, 'clock')
        await assert.rejects(owner.query('SELECT official_v3_guard_private.require_open_v1()'), stateError('P7902'))
      } finally { await owner.query('ROLLBACK') }
      const cap = Number((await creator.query('SELECT extract(epoch FROM valid_until)::text AS cap FROM official_v3_guard_private.state_v1'))[0]!.cap) * 1000
      // Real database time, no p_now/GUC/fixture-clock bypass. No cron is mocked.
      while (Date.now() <= cap) await lifetime.wait(Math.min(1000, Math.max(1, cap + 5 - Date.now())))
      assert.equal(json<{ status: string }>(await creator.query('SELECT official_v3_guard_private.alarm_status_v1() AS result')).status, 'stale')
      await assert.rejects(creator.query('SELECT official_v3_guard_private.require_open_v1()'), stateError('P7902'))
      await creator.query('SELECT official_v3_guard_private.audit_v1()')
      const repaired = json<Record<string, unknown>>(await base.observer.connection.query('SELECT to_jsonb(s) AS result FROM official_v3_guard_private.state_v1 s'))
      assert.equal(repaired.generation, 2)
      assert.ok(Number(repaired.incident_generation) > Number(repaired.resumed_generation))
      assert.equal(json<{ status: string }>(await creator.query('SELECT official_v3_guard_private.alarm_status_v1() AS result')).status, 'incident')
      await creator.query('SELECT official_v3_guard_private.audit_v1()')
      assert.deepEqual(json(await creator.query('SELECT to_jsonb(s) AS result FROM official_v3_guard_private.state_v1 s')), repaired)
      await assert.rejects(creator.query('SELECT official_v3_guard_private.require_open_v1()'), stateError('P7902'))
    })
    t.diagnostic('BG1 core PG17 complete; real pg_cron/scheduler and hosted timing remain separate gates')
  } catch (error) { failure = error }
  finally {
    clearTimeout(timer)
    const results = await Promise.allSettled(dispose.map(async stop => stop()))
    const terminal = await lifetime.dispose()
    t.diagnostic('BG1 terminal ' + JSON.stringify({ completed, terminal, nativeScheduler: false }))
    assert.equal(terminal.started, terminal.settled); assert.equal(terminal.pending, 0)
    assert.equal(terminal.closed, terminal.connections); assert.equal(terminal.stoppedClusters, clusterCount)
    assert.equal(LocalPgConnection.connect, originalConnect)
    const errors = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').map(r => r.reason)
    if (failure || errors.length) throw new AggregateError([...(failure ? [failure] : []), ...errors], 'BG1 native proof failed')
  }
}
