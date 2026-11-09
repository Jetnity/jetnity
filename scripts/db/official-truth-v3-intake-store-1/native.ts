// Mandatory native evidence. This file never selects a hosted/database URL.
import assert from 'node:assert/strict'
import { fork, type ChildProcess } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { startLocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { sha256Hex } from '../../../lib/readiness/digest'
import { createV3ProposalIntakeStore } from '../../../lib/readiness/official-truth-product-v3/storage/intake-server'
import { createV3ImportCoordinator, type V3ImportOutcome } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import type { V3IntakeSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'
import { readV3ProposalUpload } from '../../../lib/readiness/official-truth-product-v3/import/interface'
import { s1Fixture } from './fixtures'
import { nativeExecutor } from './native-adapter'
import { retentionFixtures, unknownMemberMutations } from './retention-fixtures'

const signal = () => new AbortController().signal
const result = (rows: PgRows): Record<string, unknown> => JSON.parse(rows[0]!.result!) as Record<string, unknown>
const sqlError = (code: string) => (error: unknown) => error instanceof LocalPgError && error.code === code
function fixture(seed: string) {
  const f = s1Fixture(seed)
  // Fictional source clock is intentionally historical; database lease/commit
  // clocks remain actual PostgreSQL clocks throughout this proof.
  f.synthetic.control.instant = Date.parse('2026-11-01T00:04:00.000Z')
  f.originals.control.retrievedAt = '2026-11-01T00:00:00.000Z'
  return f
}

test('S1 mandatory native PostgreSQL: durable intake, strict custody and owned transactions', { timeout: 150_000 }, async t => {
  const cluster = startLocalProofCluster(), connections = new Set<LocalPgConnection>(), children = new Set<ChildProcess>()
  const connect = async (role?: string) => { const c = await LocalPgConnection.connect(cluster, role); connections.add(c); return c }
  const close = (c: LocalPgConnection) => { connections.delete(c); c.close() }
  const stop = () => { for (const child of children) child.kill('SIGKILL'); for (const c of connections) c.close(); cluster.stop() }
  t.signal.addEventListener('abort', stop, { once: true })
  const owner = await connect()
  const candidate = readFileSync(new URL('./intake-candidate.sql', import.meta.url), 'utf8')
  const rollback = readFileSync(new URL('./intake-candidate.rollback.sql', import.meta.url), 'utf8')
  const rowsFor = async (operation: string) => (await owner.query('SELECT count(*)::text AS n FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text', [pgText(operation)]))[0]!.n
  const completionsFor = async (operation: string) => (await owner.query('SELECT count(*)::text AS n FROM official_v3_intake_private.completions_v1 WHERE operation_id=$1::text', [pgText(operation)]))[0]!.n
  const waitExpiry = async (operation: string) => { await owner.query('SELECT pg_sleep(GREATEST(0::double precision,extract(epoch FROM (expires_at-clock_timestamp()))::double precision)+0.02) FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text', [pgText(operation)]) }
  const store = (f: ReturnType<typeof fixture>, executor: V3IntakeSqlExecutor, leaseMilliseconds = 30_000) =>
    createV3ProposalIntakeStore({ registry: f.originals.registry, executor, leaseMilliseconds })
  try {
    await owner.query('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE ROLE ot_s1_alien NOLOGIN;')
    await t.test('installer foreign default grants cause complete atomic refusal without changing defaults', async () => {
      for (const [objectType, privilege] of [['FUNCTIONS', 'EXECUTE'], ['TABLES', 'SELECT']] as const) {
        await owner.query(`ALTER DEFAULT PRIVILEGES GRANT ${privilege} ON ${objectType} TO ot_s1_alien`)
        const before = await owner.query('SELECT defaclrole::text,defaclnamespace::text,defaclobjtype::text,defaclacl::text FROM pg_default_acl ORDER BY 1,2,3')
        await assert.rejects(owner.query(candidate), sqlError('P7304')); await owner.query('ROLLBACK')
        assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_namespace WHERE nspname IN ('official_v3_intake_private','official_v3_intake_api')"))[0]?.n, '0')
        assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_roles WHERE rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller')"))[0]?.n, '0')
        assert.deepEqual(await owner.query('SELECT defaclrole::text,defaclnamespace::text,defaclobjtype::text,defaclacl::text FROM pg_default_acl ORDER BY 1,2,3'), before)
        await owner.query(`ALTER DEFAULT PRIVILEGES REVOKE ${privilege} ON ${objectType} FROM ot_s1_alien`)
      }
    })
    await owner.query(candidate)
    await owner.query('CREATE ROLE ot_s1_test_runner LOGIN INHERIT; GRANT ot_v3_intake_caller TO ot_s1_test_runner;')
    const caller = await connect('ot_s1_test_runner')
    const capture = async (binding: unknown, text: string) => result(await caller.query('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
      [pgText(JSON.stringify(binding)), pgText(text), pgText(sha256Hex(text))]))
    const reserve = async (f: ReturnType<typeof fixture>, lease = 30_000) => result(await caller.query('SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
      [pgText(JSON.stringify(f.binding)), pgText(f.reference.proposalDigest), pgText(String(f.reference.bytes), 23), pgText(String(lease), 23)]))
    const finish = async (f: ReturnType<typeof fixture>, held: Record<string, unknown>, outcome: unknown, audit: unknown) => result(await caller.query(
      'SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
      [pgText(JSON.stringify(f.binding)), pgText(f.reference.proposalDigest), pgText(String(f.reference.bytes), 23),
        pgText(String(held.generation), 23), pgText(String(held.leaseToken)), pgText(JSON.stringify(outcome)), pgText(JSON.stringify(audit))]))

    await t.test('exact least privileges, FORCE RLS, fixed definers, no PUBLIC or API roles, immutable originals', async () => {
      const roles = await owner.query("SELECT rolname,rolcanlogin::text,rolinherit::text,rolsuper::text,rolbypassrls::text,rolcreaterole::text,rolcreatedb::text,rolreplication::text FROM pg_roles WHERE rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller') ORDER BY rolname")
      assert.equal(roles.length, 2)
      for (const row of roles) for (const [key, value] of Object.entries(row)) if (key !== 'rolname') assert.equal(value, 'false', key)
      const tables = await owner.query("SELECT c.relname,c.relrowsecurity::text,c.relforcerowsecurity::text,pg_get_userbyid(c.relowner) AS owner,(SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid)::text AS policies FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_intake_private' AND c.relkind='r' ORDER BY 1")
      assert.deepEqual(tables.map(row => row.relname), ['completions_v1','operations_v1','reservations_v1'])
      for (const row of tables) { assert.equal(row.relrowsecurity, 'true'); assert.equal(row.relforcerowsecurity, 'true'); assert.equal(row.owner, 'ot_v3_intake_owner'); assert.equal(row.policies, '1') }
      const functions = await owner.query("SELECT n.nspname,p.proname,p.prosecdef::text,p.proconfig::text,pg_get_userbyid(p.proowner) AS owner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api') ORDER BY 1,2")
      assert.deepEqual(functions.filter(row => row.nspname === 'official_v3_intake_api').map(row => row.proname), ['capture_v1','finish_v1','read_v1','reserve_v1'])
      for (const row of functions) { assert.equal(row.owner, 'ot_v3_intake_owner'); assert.equal(row.proconfig, '{search_path=pg_catalog}'); assert.equal(row.prosecdef, row.nspname === 'official_v3_intake_api' ? 'true' : 'false') }
      for (const role of ['anon','authenticated','service_role','ot_v3_intake_caller','ot_s1_alien']) {
        assert.equal((await owner.query("SELECT has_schema_privilege($1::text,'official_v3_intake_private','USAGE')::text AS allowed", [pgText(role)]))[0]?.allowed, 'false')
        assert.equal((await owner.query("SELECT bool_or(has_table_privilege($1::text,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))::text AS allowed FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_intake_private' AND c.relkind='r'", [pgText(role)]))[0]?.allowed, 'false')
        const denied = await connect(); await denied.query(`SET ROLE ${role}`)
        await assert.rejects(denied.query('SELECT * FROM official_v3_intake_private.operations_v1'), sqlError('42501'))
        await assert.rejects(denied.query("SELECT official_v3_intake_private.record_v1('bad')"), sqlError('42501'))
        if (role !== 'ot_v3_intake_caller') await assert.rejects(denied.query("SELECT official_v3_intake_api.capture_v1('{}', '{}', 'bad')"), sqlError('42501'))
        close(denied)
      }
      const foreign = await owner.query("SELECT count(*)::text AS n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN LATERAL aclexplode(p.proacl) a WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api') AND (a.grantee=0 OR a.is_grantable AND a.grantee<>'ot_v3_intake_owner'::regrole)")
      assert.equal(foreign[0]?.n, '0')
      await owner.query("SET ROLE ot_v3_intake_owner; CREATE FUNCTION official_v3_intake_private.default_probe() RETURNS integer LANGUAGE sql AS 'SELECT 1'; RESET ROLE")
      assert.equal((await owner.query("SELECT count(*)::text AS n FROM aclexplode((SELECT proacl FROM pg_proc WHERE oid='official_v3_intake_private.default_probe()'::regprocedure)) WHERE grantee=0"))[0]?.n, '0')
      await owner.query('DROP FUNCTION official_v3_intake_private.default_probe()')
      const f = fixture('native-immutable'); assert.equal((await capture(f.binding, f.text)).status, 'recorded')
      const owned = await connect(); await owned.query('SET ROLE ot_v3_intake_owner')
      await assert.rejects(owned.query('UPDATE official_v3_intake_private.operations_v1 SET original_bytes=original_bytes'), sqlError('P7301'))
      await assert.rejects(owned.query('DELETE FROM official_v3_intake_private.operations_v1'), sqlError('P7301'))
      await assert.rejects(owned.query('UPDATE official_v3_intake_private.operations_v1 SET generation=1,lease_token=gen_random_uuid(),acquired_at=clock_timestamp(),expires_at=NULL'), sqlError('23514'))
      close(owned)
    })

    await t.test('direct RPC retains supported full shapes and rejects PII/null/free-text at every depth before INSERT', async () => {
      for (const row of retentionFixtures()) {
        const text = JSON.stringify(row.proposal)
        assert.equal(readV3ProposalUpload(text, row.registry).ok, true)
        assert.equal((await capture(row.binding, text)).status, row.supported ? 'recorded' : 'invalid', row.name)
        if (!row.supported) assert.equal(await rowsFor(row.proposal.operationId), '0')
        for (const mutated of unknownMemberMutations(row.proposal)) assert.equal((await capture(row.binding, JSON.stringify(mutated))).status, 'invalid', row.name)
      }
      const f = fixture('native-retention-negative')
      const texts = [f.text.replace('"jobId":','"jobId":"PII_CANARY","jobId":'),
        f.text.replace('"factKind":','"\\u0066actKind":"PII_CANARY","factKind":'),
        ...['context','research','proposedFact','references'].flatMap(key => [null,'PII_CANARY',true,2].map(value => JSON.stringify({ ...f.proposal, [key]: value }))),
        ...unknownMemberMutations(f.proposal).map(value => JSON.stringify(value)),
      ]
      for (const text of texts) { assert.equal((await capture(f.binding,text)).status, 'invalid'); assert.equal(await rowsFor(f.binding.operationId), '0') }
    })

    await t.test('byte-preserving capture/reconnect, whitespace collision and complete server binding collisions', async () => {
      const f = fixture('native-original'), first = nativeExecutor(cluster), a = store(f,first.executor)
      assert.deepEqual(await a.intake.capture(f.text,f.binding,signal()), { status:'recorded', reference:f.reference })
      const second = nativeExecutor(cluster), b = store(f,second.executor), reopened = await b.open(f.reference,signal())
      assert.equal(reopened.status,'recorded'); if(reopened.status !== 'recorded') assert.fail('open')
      assert.equal(reopened.record.text,f.text); assert.equal(reopened.record.completion,null)
      assert.deepEqual(await b.intake.capture(f.text,f.binding,signal()), { status:'recorded', reference:f.reference })
      assert.equal((await b.intake.capture(f.text+'\n',f.binding,signal())).status,'collision')
      for (const binding of [{ ...f.binding, runnerId:`runner3_${'a'.repeat(32)}` },{ ...f.binding, deliveryId:`delivery3_${'b'.repeat(32)}` },
        { ...f.binding,inputRevision:`git:${'c'.repeat(40)}` },{ ...f.binding,method:{ ...f.binding.method,revision:2 } }]) {
        assert.equal((await b.intake.capture(f.text,binding,signal())).status,'collision')
      }
      for (const binding of [{ ...f.binding,jobId:`job3_${'d'.repeat(32)}` },{ ...f.binding,contextKey:`official-truth-context:v3:${'e'.repeat(64)}` }]) {
        assert.equal((await b.intake.confirm({ ...f.reference,binding },signal())).status,'collision')
      }
      assert.equal(first.evidence.acknowledged,first.evidence.drained)
      assert.ok(!first.evidence.pids.some(pid => second.evidence.pids.includes(pid)))
      assert.equal(await rowsFor(f.binding.operationId),'1')
    })

    await t.test('independent concurrent clients serialize; expiry reclaims generation and rejects old ticket', async () => {
      const f = fixture('native-concurrency'), io = nativeExecutor(cluster), a = store(f,io.executor,500), b = store(f,nativeExecutor(cluster).executor,500)
      assert.equal((await a.intake.capture(f.text,f.binding,signal())).status,'recorded')
      const pa = a.forImport(f.binding), pb = b.forImport(f.binding)
      const pair = await Promise.all([pa.reserve(f.upload,signal()),pb.reserve(f.upload,signal())])
      assert.deepEqual(pair.map(item=>item.status).sort(),['acquired','busy'])
      const at = pair.findIndex(item=>item.status==='acquired'), old = pair[at]!
      if(old.status!=='acquired') assert.fail('one held ticket')
      await waitExpiry(f.binding.operationId)
      const fresh = await (at===0?pb:pa).reserve(f.upload,signal()); if(fresh.status!=='acquired') assert.fail('reclaimed')
      const value = await f.completion()
      assert.equal((await (at===0?pa:pb).finish(old.ticket,value.outcome,value.audit,signal())).status,'unconfirmed')
      assert.equal((await (at===0?pb:pa).finish(fresh.ticket,value.outcome,value.audit,signal())).status,'recorded')
      const history = await owner.query('SELECT generation::text FROM official_v3_intake_private.reservations_v1 WHERE operation_id=$1::text ORDER BY generation',[pgText(f.binding.operationId)])
      assert.deepEqual(history.map(row=>row.generation),['1','2'])
      assert.equal(await completionsFor(f.binding.operationId),'1')
    })

    await t.test('I1 uses durable quarantine for every terminal outcome and full archived escalation replay', async () => {
      const negative: V3ImportOutcome[] = [
        ...(['conditions_unresolved','invalid_verification','history_changed','method_not_current'] as const).map(reason=>({status:'quarantined' as const,reason})),
        ...(['method_not_approved','method_unavailable','verification_unavailable','history_unavailable','aborted','temporary_failure'] as const).map(reason=>({status:'unavailable' as const,reason})),
      ]
      for (const [index,outcome] of negative.entries()) {
        const f = fixture(`native-negative-${index}`), s = store(f,nativeExecutor(cluster).executor)
        await s.intake.capture(f.text,f.binding,signal()); const port=s.forImport(f.binding), held=await port.reserve(f.upload,signal())
        if(held.status!=='acquired') assert.fail('negative reservation')
        const audit=f.auditFor(outcome)
        assert.equal((await port.finish(held.ticket,outcome,audit,signal())).status,'recorded')
        assert.deepEqual(await store(f,nativeExecutor(cluster).executor).confirmImport(f.reference),{status:'completed',outcome,audit})
      }
      for (const reason of ['prepared','primary_unclear','comparable_conflict'] as const) {
        const f=fixture(`native-full-${reason}`), s=store(f,nativeExecutor(cluster).executor)
        await s.intake.capture(f.text,f.binding,signal())
        if(reason==='prepared') {
          const actual=await createV3ImportCoordinator({...f.synthetic.importPorts,quarantine:s.forImport(f.binding)}).submit(f.text)
          assert.equal(actual.status,'completed'); if(actual.status!=='completed') assert.fail('actual I1')
          assert.equal(actual.outcome.status,'prepared')
          const confirmed=await s.confirmImport(f.reference); assert.equal(confirmed.status,'completed')
          if(confirmed.status==='completed') assert.deepEqual(confirmed.outcome,actual.outcome)
        } else {
          const value=await f.withArchivedPredecessor(reason), port=s.forImport(f.binding), held=await port.reserve(f.upload,signal())
          if(held.status!=='acquired') assert.fail('archive reservation')
          assert.equal((await port.finish(held.ticket,value.outcome,value.audit,signal())).status,'recorded')
          assert.deepEqual(await store(f,nativeExecutor(cluster).executor).confirmImport(f.reference),{status:'completed',...value})
        }
      }
    })

    await t.test('finish direct RPC refuses null, incomplete nested records and free text without storing a completion', async () => {
      const f=fixture('native-bad-finish'), value=await f.completion(); await capture(f.binding,f.text); const held=await reserve(f)
      assert.equal(held.status,'acquired')
      for(const bad of unknownMemberMutations(value.outcome)) assert.equal((await finish(f,held,bad,value.audit)).status,'unconfirmed')
      for(const bad of unknownMemberMutations(value.audit)) assert.equal((await finish(f,held,value.outcome,bad)).status,'unconfirmed')
      const negative:V3ImportOutcome={status:'unavailable',reason:'aborted'}
      for(const bad of [{...negative,reason:null},{status:'prepared',value:{proposalDigest:f.upload.digest,
        decision:{reference:value.audit.decisionRef,contextKey:f.binding.contextKey,method:f.binding.method},previousDecision:null,archiveAppend:null,
        version:{payload:'PII_CANARY'},transition:{},proposalDisposition:'matched',acceptance:'not_committed',reproof:'required_before_commit'}}]) {
        assert.equal((await finish(f,held,bad,typeof bad.status==='string'&&bad.status==='prepared'?value.audit:f.auditFor(negative))).status,'unconfirmed')
      }
      assert.equal((await finish(f,held,value.outcome,{...value.audit,recordedAt:null})).status,'unconfirmed')
      assert.equal(await completionsFor(f.binding.operationId),'0')
      assert.equal((await finish(f,held,value.outcome,value.audit)).status,'recorded')
    })

    await t.test('actual commit then lost acknowledgement requires same-operation readback, with no duplicate completion', async () => {
      const f=fixture('native-lost-ack'), value=await f.completion(), io=nativeExecutor(cluster,{loseAcknowledgement:statement=>statement.includes('.finish_v1(')})
      const s=store(f,io.executor); await s.intake.capture(f.text,f.binding,signal()); const port=s.forImport(f.binding), held=await port.reserve(f.upload,signal())
      if(held.status!=='acquired') assert.fail('held')
      const before=io.evidence.acknowledged
      assert.equal((await port.finish(held.ticket,value.outcome,value.audit,signal())).status,'unconfirmed')
      assert.equal(io.evidence.acknowledged,before+1,'actual COMMIT ACK was observed inside owned transport before loss')
      const recovered=store(f,nativeExecutor(cluster).executor)
      assert.deepEqual(await recovered.confirmImport(f.reference),{status:'completed',...value})
      const replay=await recovered.forImport(f.binding).reserve(f.upload,signal()); assert.equal(replay.status,'completed')
      if(replay.status==='completed') assert.deepEqual(replay.outcome,value.outcome)
      assert.equal(await completionsFor(f.binding.operationId),'1')
      const captureLost=fixture('native-lost-capture'), lost=store(captureLost,nativeExecutor(cluster,{loseAcknowledgement:statement=>statement.includes('.capture_v1(')}).executor)
      assert.equal((await lost.intake.capture(captureLost.text,captureLost.binding,signal())).status,'unconfirmed')
      assert.equal((await store(captureLost,nativeExecutor(cluster).executor).intake.confirm(captureLost.reference,signal())).status,'recorded')
    })

    await t.test('failure before commit, transaction abort and post-write lease lapse leave no partial data', async () => {
      const f=fixture('native-before-commit'), io=nativeExecutor(cluster,{beforeCommit(){throw Error('controlled_precommit_failure')}})
      assert.equal((await store(f,io.executor).intake.capture(f.text,f.binding,signal())).status,'unconfirmed')
      assert.equal(await rowsFor(f.binding.operationId),'0'); assert.equal(io.evidence.rolledBack,1)
      const interrupted=fixture('native-disconnected-xact'), c=await connect('ot_s1_test_runner')
      await c.query('BEGIN')
      await c.query('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text)',[pgText(JSON.stringify(interrupted.binding)),pgText(interrupted.text),pgText(interrupted.upload.digest)])
      const pid=(await c.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!; close(c)
      for(let i=0;i<100;i++){if((await owner.query('SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer',[pgText(pid,23)]))[0]?.n==='0')break; await new Promise(resolve=>setTimeout(resolve,20))}
      assert.equal(await rowsFor(interrupted.binding.operationId),'0')
      const slow=fixture('native-post-write-expiry'), value=await slow.completion(), sx=nativeExecutor(cluster), s=store(slow,sx.executor,2000)
      await s.intake.capture(slow.text,slow.binding,signal()); const port=s.forImport(slow.binding), held=await port.reserve(slow.upload,signal())
      if(held.status!=='acquired') assert.fail('slow reservation')
      await owner.query("CREATE FUNCTION public.s1_slow_completion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(GREATEST(0::double precision,extract(epoch FROM (expires_at-clock_timestamp()))::double precision)+0.03) FROM official_v3_intake_private.operations_v1 WHERE operation_id=NEW.operation_id; RETURN NEW; END $$; CREATE TRIGGER s1_slow AFTER INSERT ON official_v3_intake_private.completions_v1 FOR EACH ROW EXECUTE FUNCTION public.s1_slow_completion()")
      try { assert.equal((await port.finish(held.ticket,value.outcome,value.audit,signal())).status,'unconfirmed'); assert.ok(sx.evidence.sqlCodes.includes('P7302')) }
      finally { await owner.query('DROP TRIGGER s1_slow ON official_v3_intake_private.completions_v1; DROP FUNCTION public.s1_slow_completion()') }
      assert.equal(await completionsFor(slow.binding.operationId),'0')
    })

    await t.test('cancellation owns, terminates and drains a genuinely blocked PostgreSQL call', async () => {
      const f=fixture('native-abort'), regular=store(f,nativeExecutor(cluster).executor); await regular.intake.capture(f.text,f.binding,signal())
      const blockerPid=(await owner.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
      const observer=await connect()
      await observer.query("SET statement_timeout='2s'")
      await owner.query('BEGIN'); await owner.query('SELECT operation_id FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text FOR UPDATE',[pgText(f.binding.operationId)])
      const readStatement='SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result'
      let target:Readonly<{pid:string;birth:string}>|undefined
      const controller=new AbortController(), io=nativeExecutor(cluster,{async beforeQuery(statement,connection){
        assert.equal(statement,readStatement)
        const identity=(await connection.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE pid=pg_backend_pid()'))[0]
        assert.ok(identity?.pid&&identity.birth)
        target={pid:identity.pid,birth:identity.birth}
      }}), s=store(f,io.executor)
      const pending=s.open(f.reference,controller.signal)
      try {
        let observedBlocked=false
        const deadline=performance.now()+5000
        while(performance.now()<deadline){
          if(target&&io.evidence.dispatched===1){
            // Autocommit observer: no stale activity snapshot from the lock
            // owner's open transaction. Match PID AND birth, exact statement,
            // active lock wait and the actual owner holding the blocking lock.
            const observed=await observer.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz AND state='active' AND wait_event_type='Lock' AND query=$3::text AND $4::integer=ANY(pg_blocking_pids(pid))",
              [pgText(target.pid,23),pgText(target.birth),pgText(readStatement),pgText(blockerPid,23)])
            if(observed[0]?.n==='1'){observedBlocked=true;break}
          }
          await new Promise(resolve=>setTimeout(resolve,20))
        }
        assert.equal(observedBlocked,true,'exact dispatched read must be observed in a real lock wait before abort')
        assert.equal(io.evidence.dispatched,1);assert.equal(controller.signal.aborted,false)
        assert.ok(target&&io.evidence.pids.includes(target.pid))
        controller.abort()
        assert.equal((await pending).status,'unconfirmed')
        assert.equal(io.evidence.aborted,1);assert.equal(io.evidence.drained,1)
        assert.equal((await observer.query('SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',
          [pgText(target.pid,23),pgText(target.birth)]))[0]?.n,'0','terminated target is absent before releasing its blocking lock')
      } finally {
        controller.abort()
        try { await owner.query('ROLLBACK') }
        finally { try { await pending } finally { close(observer) } }
      }
      assert.equal(io.evidence.aborted,1); assert.equal(io.evidence.drained,1)
      assert.equal((await regular.open(f.reference,signal())).status,'recorded')
    })

    await t.test('actual importer process interruption and new process reconnect preserve original and completed outcome', async () => {
      const seed='native-process-restart', f=fixture(seed), io=nativeExecutor(cluster)
      const allowed=new Set([
        'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
        'SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result',
        'SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
      ])
      async function worker(mode:'capture-reserve'|'confirm') {
        const child=fork(fileURLToPath(new URL('./process-worker.ts',import.meta.url)),[],{execPath:process.execPath,
          execArgv:['--import',fileURLToPath(new URL('../../server-only-test-register.mjs',import.meta.url)),'--import','tsx'],stdio:['ignore','ignore','ignore','ipc']})
        children.add(child)
        let ended=false, produced=false
        const pending=new Set<Promise<void>>()
        const exited=new Promise<NodeJS.Signals|null>(resolve=>child.once('exit',(_code,exitSignal)=>{ended=true;resolve(exitSignal)}))
        let rejectOutput:(reason:unknown)=>void=()=>{}
        const output=new Promise<Record<string,unknown>>((resolve,reject)=>{
          rejectOutput=reject
          child.once('error',reject)
          child.once('exit',()=>{if(!produced)reject(Error('worker_exited_before_result'))})
          child.on('message',(message:unknown)=>{
            if(!message||typeof message!=='object'){reject(Error('worker_message'));return}
            const row=message as Record<string,unknown>
            if(row.type==='held'||row.type==='confirmed'){produced=true;resolve(row);return}
            if(row.type!=='sql'||typeof row.id!=='number'||typeof row.statement!=='string'||!allowed.has(row.statement)||!Array.isArray(row.parameters)
              ||row.parameters.length>4||row.parameters.some(value=>typeof value!=='string'&&typeof value!=='number'||typeof value==='string'&&value.length>524288)){reject(Error('worker_request'));return}
            const job=(async()=>{const reply=await io.executor.execute(row.statement as string,row.parameters as (string|number)[],signal());if(child.connected)child.send({type:'reply',id:row.id,reply})})()
            pending.add(job);void job.then(()=>pending.delete(job),error=>{pending.delete(job);reject(error)})
          })
        })
        const timer=setTimeout(()=>{child.kill('SIGKILL');rejectOutput(Error('worker_deadline'))},15_000)
        try { child.send({type:'start',seed,mode});const observed=await output;if(mode==='capture-reserve')child.kill('SIGKILL');const exit=await exited;
          if(mode==='capture-reserve')assert.equal(exit,'SIGKILL');await Promise.all(pending);return observed
        } finally {clearTimeout(timer);if(!ended)child.kill('SIGKILL');await exited;await Promise.allSettled(pending);children.delete(child)}
      }
      assert.equal((await worker('capture-reserve')).type,'held')
      const s=store(f,nativeExecutor(cluster).executor)
      assert.deepEqual(await s.confirmImport(f.reference),{status:'pending'})
      await waitExpiry(f.binding.operationId)
      const port=s.forImport(f.binding),held=await port.reserve(f.upload,signal());if(held.status!=='acquired')assert.fail('process reclaim')
      const value=await f.completion();assert.equal((await port.finish(held.ticket,value.outcome,value.audit,signal())).status,'recorded')
      assert.deepEqual((await worker('confirm')).result,{status:'completed',...value})
      assert.equal(await rowsFor(f.binding.operationId),'1');assert.equal(await completionsFor(f.binding.operationId),'1')
      t.diagnostic('Actual child SIGKILL, fresh child readback, real PostgreSQL commits; test-only IPC owns database transports in parent.')
    })

    await t.test('guarded fixture removal refuses default execution, then removes only candidate and reinstalls cleanly', async () => {
      await assert.rejects(owner.query(rollback),sqlError('P7303'));await owner.query('ROLLBACK')
      assert.equal((await owner.query("SELECT to_regnamespace('official_v3_intake_private') IS NOT NULL AS present"))[0]?.present,'t')
      close(caller)
      await owner.query("SET jetnity.s1_owned_fixture='s1_disposable_native_test_v1'")
      await owner.query('CREATE TABLE public.s1_unexpected_owner_object(id integer); ALTER TABLE public.s1_unexpected_owner_object OWNER TO ot_v3_intake_owner')
      await assert.rejects(owner.query(rollback),sqlError('2BP01'));await owner.query('ROLLBACK')
      assert.equal((await owner.query("SELECT to_regclass('public.s1_unexpected_owner_object') IS NOT NULL AS present"))[0]?.present,'t')
      assert.equal((await owner.query("SELECT to_regnamespace('official_v3_intake_private') IS NOT NULL AS present"))[0]?.present,'t')
      await owner.query('DROP TABLE public.s1_unexpected_owner_object')
      // This view is owned by the installer, not either candidate role. A
      // schema CASCADE would erase it without DROP ROLE detecting a dependency.
      await owner.query('CREATE VIEW public.s1_foreign_dependent_view AS SELECT operation_id FROM official_v3_intake_private.operations_v1')
      assert.equal((await owner.query("SELECT pg_get_userbyid(relowner) AS owner FROM pg_class WHERE oid='public.s1_foreign_dependent_view'::regclass"))[0]?.owner,'ot_pilot_owner')
      const beforeViewRefusal=await owner.query('SELECT count(*)::text AS n FROM public.s1_foreign_dependent_view')
      await assert.rejects(owner.query(rollback),sqlError('2BP01'));await owner.query('ROLLBACK')
      assert.deepEqual(await owner.query('SELECT count(*)::text AS n FROM public.s1_foreign_dependent_view'),beforeViewRefusal)
      assert.equal((await owner.query("SELECT to_regclass('official_v3_intake_private.operations_v1') IS NOT NULL AS present"))[0]?.present,'t')
      assert.equal((await owner.query("SELECT to_regprocedure('official_v3_intake_api.capture_v1(jsonb,text,text)') IS NOT NULL AS present"))[0]?.present,'t','earlier teardown statements were rolled back too')
      await owner.query('DROP VIEW public.s1_foreign_dependent_view RESTRICT')
      await owner.query(rollback)
      assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_roles WHERE rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller')"))[0]?.n,'0')
      await owner.query(candidate)
      assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_v3_intake_private.operations_v1'))[0]?.n,'0')
      assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','ot_s1_alien','ot_s1_test_runner')"))[0]?.n,'5')
    })
    t.diagnostic(JSON.stringify({schema:'s1-native-v1',database:cluster.version,hosted:false,acceptedWrites:0,mandatory:true}))
  } finally { t.signal.removeEventListener('abort',stop);stop() }
})
