// HS1 mandatory proof source. NOT_RUN at author delivery; no hosted endpoint.
import assert from 'node:assert/strict'
import { fork, type ChildProcess } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import type { TestContext } from 'node:test'
import { startLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { sha256Hex } from '../../../lib/readiness/digest'
import { createV3ProposalIntakeStore } from '../../../lib/readiness/official-truth-product-v3/storage/intake-server'
import { createV3ImportCoordinator, type V3ImportOutcome } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import type { V3IntakeSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'
import { readV3ProposalUpload } from '../../../lib/readiness/official-truth-product-v3/import/interface'
import { s1Fixture } from '../official-truth-v3-intake-store-1/fixtures'
import { nativeExecutor as originalNativeExecutor, type NativeAdapterOptions } from '../official-truth-v3-intake-store-1/native-adapter'
import { retentionFixtures, unknownMemberMutations } from '../official-truth-v3-intake-store-1/retention-fixtures'

const EFFECT_MS = 150_000
const WRAPPER_MS = 210_000
const CONNECTION_LIMIT = 1024
const ACTIVE_CONNECTION_LIMIT = 24
const CHILD_LIMIT = 2
const result = (rows: PgRows): Record<string, unknown> => JSON.parse(rows[0]!.result!) as Record<string, unknown>
const sqlError = (code: string) => (error: unknown) => error instanceof LocalPgError && error.code === code
const repository = new URL('../../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path,repository),'utf8')
function fixture(seed: string) {
  const f = s1Fixture(seed)
  f.synthetic.control.instant = Date.parse('2026-11-01T00:04:00.000Z')
  f.originals.control.retrievedAt = '2026-11-01T00:00:00.000Z'
  return f
}
type Span = Readonly<{ originalStart: number; originalEnd: number; candidateStart: number; candidateEnd: number; sha256: string }>
type Manifest = Readonly<{
  reused: readonly Readonly<{ path: string; bytes: number; sha256: string }>[]
  artifacts: readonly Readonly<{ path: string; bytes: number; sha256: string }>[]
  preservation: Readonly<{
    originalPath: string; originalSha256: string; originalBytes: number
    retained: readonly Span[]
    functions: readonly Readonly<{ declaration: Span; body: Span }>[]
    retentionJson: Span
    originalInverse: readonly Readonly<{ start: number; end: number; kind: 'retained'|'replaced'; sha256: string }>[]
    candidateInverse: readonly Readonly<{ start: number; end: number; kind: 'retained'|'new'; sha256: string }>[]
  }>
}>
function assertSourcePins(candidate: string): void {
  const manifest = JSON.parse(read('docs/official-truth-product-v3/HOSTED_INTAKE_STORE_MANIFEST_V1.json')) as Manifest
  for (const pin of [...manifest.reused,...manifest.artifacts]) {
    const bytes=read(pin.path)
    assert.equal(Buffer.byteLength(bytes,'utf8'),pin.bytes,pin.path)
    assert.equal(sha256Hex(bytes),pin.sha256,pin.path)
  }
  const old=Buffer.from(read(manifest.preservation.originalPath),'utf8'), next=Buffer.from(candidate,'utf8')
  assert.equal(old.length,manifest.preservation.originalBytes)
  assert.equal(sha256Hex(old.toString('utf8')),manifest.preservation.originalSha256)
  const check=(span:Span) => {
    const before=old.subarray(span.originalStart,span.originalEnd), after=next.subarray(span.candidateStart,span.candidateEnd)
    assert.deepEqual(after,before)
    assert.equal(sha256Hex(after.toString('utf8')),span.sha256)
  }
  for(const span of manifest.preservation.retained)check(span)
  assert.equal(manifest.preservation.functions.length,14)
  for(const pin of manifest.preservation.functions){check(pin.declaration);check(pin.body)}
  check(manifest.preservation.retentionJson)
  for(const [bytes,inverse] of [[old,manifest.preservation.originalInverse],[next,manifest.preservation.candidateInverse]] as const){
    let end=0
    for(const span of inverse){assert.equal(span.start,end);assert.ok(span.end>span.start);assert.equal(sha256Hex(bytes.subarray(span.start,span.end).toString('utf8')),span.sha256);end=span.end}
    assert.equal(end,bytes.length,'complete inverse span coverage')
  }
}
const identitySql = "WITH scope_schemas AS (\n  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n\n  WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')\n), scope_tables AS (\n  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'\n), scope_classes AS (\n  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace\n  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0\n  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0\n), scope_objects AS (\n  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n\n  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c\n  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace\n  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace\n  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid\n  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid\n  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid\n  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid\n)\nSELECT pg_catalog.jsonb_build_object(\n  'package','HS1-v1',\n  'database',pg_catalog.jsonb_build_object('name',d.datname,'oid',d.oid),\n  'roles',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',r.rolname,'oid',r.oid) ORDER BY r.rolname)\n    FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller')),\n  'objects',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('catalog',o.classid::pg_catalog.regclass::text,\n      'identity',pg_catalog.pg_describe_object(o.classid,o.objid,0),'oid',o.objid) ORDER BY o.classid,o.objid)\n    FROM scope_objects o)\n) AS hs1_identity\nFROM pg_catalog.pg_database d WHERE d.datname=current_database()"
const recoveryContext='root_independent_identity_no_consumers_controlled_quiescence_v1'

/** One root-owned execution, 150s effects + independent existing 35s drain.
 * Wrapper's 210s ceiling never gives a scenario additional effect time. */
export async function runHostedIntakeNative(t:TestContext):Promise<void>{
  const effect=new AbortController(), startedAt=performance.now()
  const parentAbort=()=>effect.abort(t.signal.reason)
  t.signal.addEventListener('abort',parentAbort,{once:true})
  if(t.signal.aborted)parentAbort()
  const effectTimer=setTimeout(()=>effect.abort(Error('hs1_effect_budget_elapsed')),EFFECT_MS)
  const lifetime=new OwnedTestLifetime(effect.signal)
  const children=new Set<ChildProcess>(), groups:string[]=[]
  let childCount=0, childJoined=0, connectionCount=0, activeConnections=0, maxActiveConnections=0
  let primary:unknown, hasFailure=false, receipt:Awaited<ReturnType<OwnedTestLifetime['dispose']>>|undefined
  const signal=()=>lifetime.signal
  const group=async(name:string,work:()=>Promise<void>)=>{
    lifetime.check();let complete=false
    await t.test(name,async()=>{await lifetime.run(work);complete=true})
    assert.equal(complete,true,'failed subtest must stop subsequent scenario work')
    groups.push(name)
  }
  try{
    const candidate=read('scripts/db/official-truth-v3-hosted-intake-store-1/install-candidate.sql')
    const recovery=read('scripts/db/official-truth-v3-hosted-intake-store-1/recovery-candidate.sql')
    assertSourcePins(candidate)
    const cluster=lifetime.startCluster(startLocalProofCluster)
    assert.match(cluster.version,/PostgreSQL\) 17\./,'PG17 is mandatory; no skip/fallback result')
    lifetime.installConnectOwnership()
    const ownedConnect=LocalPgConnection.connect
    lifetime.patchConnect(async(...args)=>{
      assert.equal(args[0],cluster,'this proof cannot select any foreign cluster')
      assert.ok(++connectionCount<=CONNECTION_LIMIT)
      assert.ok(++activeConnections<=ACTIVE_CONNECTION_LIMIT)
      maxActiveConnections=Math.max(maxActiveConnections,activeConnections)
      let connection:LocalPgConnection|undefined
      try{
        connection=await ownedConnect(...args)
        const close=connection.close.bind(connection);let closed=false
        connection.close=()=>{if(!closed){closed=true;activeConnections--;close()}}
        return connection
      }catch(error){if(!connection)activeConnections--;throw error}
    })
    const connect=(role?:string)=>LocalPgConnection.connect(cluster,role)
    const close=(c:LocalPgConnection)=>c.close()
    const owner=await connect() // Synthetic bootstrap observation/fixture only.
    await owner.query(`CREATE ROLE postgres LOGIN INHERIT NOSUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;
      ALTER DATABASE postgres OWNER TO postgres;
      ALTER ROLE postgres SET application_name='hs1-owned-postgres-fixture';
      CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
      CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE ROLE ot_s1_alien NOLOGIN;
      CREATE ROLE ot_s1_test_runner LOGIN INHERIT;
      CREATE ROLE hs1_platform_member NOLOGIN;
      GRANT hs1_platform_member TO postgres WITH ADMIN FALSE,INHERIT TRUE,SET TRUE;
      CREATE ROLE hs1_unrelated_owner NOLOGIN;
      CREATE ROLE ot_v3_method_reader NOLOGIN NOINHERIT;
      CREATE SCHEMA official_v3_method_private;
      CREATE SCHEMA official_v3_method_api;
      CREATE SCHEMA hs1_unrelated;
      CREATE TABLE hs1_unrelated.history(kind text PRIMARY KEY,bytes bytea NOT NULL);
      INSERT INTO hs1_unrelated.history VALUES ('PG1',decode('0102','hex')),('MA1',decode('0304','hex')),('legacy',decode('0506','hex'));
      CREATE VIEW hs1_unrelated.history_view AS SELECT kind,bytes FROM hs1_unrelated.history;
      ALTER DEFAULT PRIVILEGES FOR ROLE hs1_unrelated_owner GRANT EXECUTE ON FUNCTIONS TO ot_s1_alien;`)
    const installer=await connect('postgres') // A real LOGIN, never bootstrap SET ROLE.
    const login=await installer.query("SELECT current_user AS current_identity,session_user AS session_identity,current_setting('server_version_num') AS major,rolsuper::text AS super,rolcreaterole::text AS creator,rolcanlogin::text AS login FROM pg_catalog.pg_roles WHERE rolname=current_user")
    assert.deepEqual(login.map(r=>[r.current_identity,r.session_identity,r.super,r.creator,r.login]),[['postgres','postgres','false','true','true']])
    assert.equal(Math.floor(Number(login[0]!.major)/10000),17)
    const snapshot=()=>owner.query(`SELECT jsonb_build_object(
      'database',(SELECT jsonb_build_array(datname,datdba,datacl,datallowconn,datconnlimit,encoding) FROM pg_catalog.pg_database WHERE datname='postgres'),
      'roles',(SELECT jsonb_agg(jsonb_build_array(oid,rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit,rolconfig,rolvaliduntil) ORDER BY oid)
        FROM pg_catalog.pg_roles WHERE rolname NOT IN ('ot_v3_intake_owner','ot_v3_intake_caller')),
      'memberships',(SELECT jsonb_agg(jsonb_build_array(m.roleid,m.member,m.grantor,m.admin_option,m.inherit_option,m.set_option) ORDER BY m.roleid,m.member,m.grantor)
        FROM pg_catalog.pg_auth_members m WHERE NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller') AND r.oid IN (m.roleid,m.member,m.grantor))),
      'defaults',(SELECT jsonb_agg(jsonb_build_array(defaclrole,defaclnamespace,defaclobjtype,defaclacl) ORDER BY oid) FROM pg_catalog.pg_default_acl),
      'history',(SELECT jsonb_agg(jsonb_build_array(kind,encode(bytes,'hex')) ORDER BY kind) FROM hs1_unrelated.history_view),
      'role_settings',(SELECT jsonb_agg(jsonb_build_array(setdatabase,setrole,setconfig) ORDER BY setdatabase,setrole) FROM pg_catalog.pg_db_role_setting),
      'schemas',(SELECT jsonb_agg(jsonb_build_array(oid,nspname,nspowner,nspacl) ORDER BY oid) FROM pg_catalog.pg_namespace
        WHERE nspname NOT IN ('official_v3_intake_private','official_v3_intake_api') AND left(nspname,3)<>'pg_'),
      'unrelated',(SELECT jsonb_agg(jsonb_build_object('identity',jsonb_build_array(c.oid,n.nspname,c.relname,c.relowner,c.relacl,c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.reloptions),
          'columns',(SELECT jsonb_agg(jsonb_build_array(a.attnum,a.attname,a.atttypid,a.attnotnull,a.attacl,a.attgenerated,a.attidentity) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0),
          'constraints',(SELECT jsonb_agg(jsonb_build_array(k.oid,k.conname,pg_catalog.pg_get_constraintdef(k.oid,false)) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
          'triggers',(SELECT jsonb_agg(jsonb_build_array(g.oid,pg_catalog.pg_get_triggerdef(g.oid,false)) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
          'view',CASE WHEN c.relkind IN ('v','m') THEN pg_catalog.pg_get_viewdef(c.oid,false) ELSE NULL END) ORDER BY c.oid)
        FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname NOT IN ('pg_catalog','information_schema','official_v3_intake_private','official_v3_intake_api') AND left(n.nspname,3)<>'pg_'),
      'functions',(SELECT jsonb_agg(jsonb_build_array(p.oid,n.nspname,p.proname,p.proowner,p.proacl,p.proargtypes,p.prorettype,p.prosecdef,p.proconfig,encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')) ORDER BY p.oid)
        FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname NOT IN ('pg_catalog','information_schema','official_v3_intake_private','official_v3_intake_api') AND left(n.nspname,3)<>'pg_'),
      'types',(SELECT jsonb_agg(to_jsonb(y) ORDER BY y.oid) FROM pg_catalog.pg_type y JOIN pg_catalog.pg_namespace n ON n.oid=y.typnamespace
        WHERE n.nspname NOT IN ('pg_catalog','information_schema','official_v3_intake_private','official_v3_intake_api') AND left(n.nspname,3)<>'pg_')
    )::text AS preserved_catalog`)
    const baseline=await snapshot()
    const noPackage=async()=>{
      const rows=await owner.query("SELECT (SELECT count(*) FROM pg_catalog.pg_roles WHERE rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller'))::text AS role_count,(SELECT count(*) FROM pg_catalog.pg_namespace WHERE nspname IN ('official_v3_intake_private','official_v3_intake_api'))::text AS schema_count")
      assert.deepEqual(rows,[{role_count:'0',schema_count:'0'}])
    }
    const bootstrapOnly=async()=>{
      const rows=await owner.query("SELECT r.rolname,m.member::text AS member_oid,m.grantor::text AS grantor_oid,m.admin_option::text AS admin,m.inherit_option::text AS inherit,m.set_option::text AS can_set FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.roleid WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller') ORDER BY r.rolname,m.grantor")
      const postgres=(await owner.query("SELECT oid::text AS installer_oid FROM pg_catalog.pg_roles WHERE rolname='postgres'"))[0]!.installer_oid
      assert.deepEqual(rows,['ot_v3_intake_caller','ot_v3_intake_owner'].map(rolname=>({rolname,member_oid:postgres,grantor_oid:'10',admin:'true',inherit:'false',can_set:'false'})))
      const effective=await installer.query("SELECT pg_catalog.pg_has_role('postgres','ot_v3_intake_owner','SET')::text AS owner_set,pg_catalog.pg_has_role('postgres','ot_v3_intake_owner','USAGE')::text AS owner_usage,pg_catalog.pg_has_role('postgres','ot_v3_intake_caller','SET')::text AS caller_set,pg_catalog.pg_has_role('postgres','ot_v3_intake_caller','USAGE')::text AS caller_usage,current_user AS current_identity,session_user AS session_identity")
      assert.deepEqual(effective,[{owner_set:'false',owner_usage:'false',caller_set:'false',caller_usage:'false',current_identity:'postgres',session_identity:'postgres'}])
    }
    const rejectScript=async(sql:string,code:string)=>{
      await assert.rejects(installer.query(sql),sqlError(code))
      await installer.query('ROLLBACK')
      assert.equal((await installer.query('SELECT current_user AS installer_identity'))[0]!.installer_identity,'postgres')
    }
    const inject=(marker:string,sql:string)=>{
      assert.equal(candidate.split(marker).length,2,'one reviewed fault-injection location')
      return candidate.replace(marker,()=>marker+'\n'+sql)
    }
    const acknowledge=async(identity?:string)=>{
      const witnessed=identity??(await owner.query(identitySql))[0]!.hs1_identity!
      await installer.query('SELECT pg_catalog.set_config($1::text,$2::text,false) AS recovery_context',[pgText('jetnity.hs1_recovery_context'),pgText(recoveryContext)])
      await installer.query('SELECT pg_catalog.set_config($1::text,$2::text,false) AS recovery_identity',[pgText('jetnity.hs1_recovery_identity'),pgText(witnessed)])
      return witnessed
    }
    const counts=()=>owner.query("SELECT (SELECT count(*) FROM official_v3_intake_private.operations_v1)::text AS originals,(SELECT count(*) FROM official_v3_intake_private.reservations_v1)::text AS reservations,(SELECT count(*) FROM official_v3_intake_private.completions_v1)::text AS completions")
    const nativeExecutor=(target:LocalProofCluster,options:NativeAdapterOptions={})=>{
      assert.equal(target,cluster)
      const original=originalNativeExecutor(target,options)
      const executor:V3IntakeSqlExecutor={execute:(...args)=>lifetime.run(()=>original.executor.execute(...args))}
      return{executor,evidence:original.evidence}
    }
    const rowsFor=async(operation:string)=>(await owner.query('SELECT count(*)::text AS n FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text',[pgText(operation)]))[0]!.n
    const completionsFor=async(operation:string)=>(await owner.query('SELECT count(*)::text AS n FROM official_v3_intake_private.completions_v1 WHERE operation_id=$1::text',[pgText(operation)]))[0]!.n
    const waitExpiry=async(operation:string)=>{await owner.query("SELECT pg_sleep(GREATEST(0::double precision,extract(epoch FROM (expires_at-clock_timestamp()))::double precision)+0.02) AS waited FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text",[pgText(operation)])}
    const store=(f:ReturnType<typeof fixture>,executor:V3IntakeSqlExecutor,leaseMilliseconds=30_000)=>
      createV3ProposalIntakeStore({registry:f.originals.registry,executor,leaseMilliseconds})

    await group('HS1 installer prerequisite, collision and creator-default negatives are atomic',async()=>{
      for(const setup of [
        {before:"CREATE ROLE ot_v3_intake_owner NOLOGIN",after:"DROP ROLE ot_v3_intake_owner"},
        {before:"CREATE SCHEMA official_v3_intake_private",after:"DROP SCHEMA official_v3_intake_private"},
      ]){
        await owner.query(setup.before);const observed=await snapshot()
        await rejectScript(candidate,'P7310');assert.deepEqual(await snapshot(),observed)
        await owner.query(setup.after);await noPackage()
      }
      for(const mutation of [
        {before:'ALTER ROLE postgres NOCREATEROLE',after:'ALTER ROLE postgres CREATEROLE'},
        {before:'ALTER ROLE postgres SUPERUSER',after:'ALTER ROLE postgres NOSUPERUSER'},
        {before:'ALTER ROLE postgres NOLOGIN',after:'ALTER ROLE postgres LOGIN'},
        {before:'ALTER DATABASE postgres OWNER TO ot_pilot_owner',after:'ALTER DATABASE postgres OWNER TO postgres'},
      ]){
        await owner.query(mutation.before);const observed=await snapshot()
        try{await rejectScript(candidate,'P7310');await noPackage();assert.deepEqual(await snapshot(),observed)}
        finally{await owner.query(mutation.after)}
      }
      await installer.query("SET createrole_self_grant='set'")
      try{await rejectScript(candidate,'P7310');await noPackage()}
      finally{await installer.query('RESET createrole_self_grant')}
      for(const [kind,privilege] of [['FUNCTIONS','EXECUTE'],['TABLES','SELECT'],['SCHEMAS','USAGE']] as const){
        await owner.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ${privilege} ON ${kind} TO ot_s1_alien`)
        const observed=await snapshot()
        try{await rejectScript(candidate,'P7310');await noPackage();assert.deepEqual(await snapshot(),observed)}
        finally{await owner.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ${privilege} ON ${kind} FROM ot_s1_alien`)}
      }
      assert.deepEqual(await snapshot(),baseline)
    })
    await group('HS1 exact grantors, restricted roles, initial ACLs and temporary grant cleanup reject injected drift',async()=>{
      // These are labelled synthetic faults around reviewed source boundaries.
      // Successful installation below executes the unmodified complete file.
      const faults=[
        {name:'role attribute',at:'-- HS1_AFTER_ROLE_CREATION',sql:'ALTER ROLE ot_v3_intake_owner LOGIN;',code:'P7311'},
        {name:'extra member',at:'-- HS1_AFTER_ROLE_CREATION',sql:'GRANT ot_v3_intake_owner TO ot_s1_alien WITH ADMIN FALSE,INHERIT FALSE,SET FALSE GRANTED BY postgres;',code:'P7311'},
        {name:'wrong grantor row',at:'-- HS1_AFTER_ROLE_CREATION',sql:'GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE,INHERIT FALSE,SET FALSE GRANTED BY postgres;',code:'P7311'},
        {name:'initial function ACL',at:'-- HS1_BEFORE_INITIAL_ACL_CHECK',sql:'GRANT EXECUTE ON FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) TO ot_s1_alien;',code:'P7312'},
        {name:'initial table ACL',at:'-- HS1_BEFORE_INITIAL_ACL_CHECK',sql:'GRANT SELECT ON official_v3_intake_private.operations_v1 TO ot_s1_alien;',code:'P7312'},
        {name:'initial row type ACL',at:'-- HS1_BEFORE_INITIAL_ACL_CHECK',sql:'GRANT USAGE ON TYPE official_v3_intake_private.operations_v1 TO ot_s1_alien;',code:'P7312'},
        {name:'column ACL',at:'-- HS1_BEFORE_INITIAL_ACL_CHECK',sql:'GRANT SELECT(binding) ON official_v3_intake_private.operations_v1 TO ot_s1_alien;',code:'P7312'},
        {name:'column option drift',at:'-- HS1_BEFORE_EXACT_PACKAGE_CHECK',sql:'ALTER TABLE official_v3_intake_private.operations_v1 ALTER COLUMN operation_id SET (n_distinct=1);',code:'P7312'},
        {name:'column statistics drift',at:'-- HS1_BEFORE_EXACT_PACKAGE_CHECK',sql:'ALTER TABLE official_v3_intake_private.operations_v1 ALTER COLUMN operation_id SET STATISTICS 1;',code:'P7312'},
        {name:'final table grant',at:'-- HS1_BEFORE_EXACT_PACKAGE_CHECK',sql:'GRANT SELECT ON official_v3_intake_private.operations_v1 TO ot_v3_intake_caller;',code:'P7312'},
        {name:'body drift',at:'-- HS1_BEFORE_EXACT_PACKAGE_CHECK',sql:"CREATE OR REPLACE FUNCTION official_v3_intake_private.record_v1(p_operation text) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS 'SELECT NULL::jsonb';",code:'P7312'},
        {name:'constraint drift',at:'-- HS1_BEFORE_EXACT_PACKAGE_CHECK',sql:'ALTER TABLE official_v3_intake_private.operations_v1 ADD CONSTRAINT hs1_extra_check CHECK (generation>=0);',code:'P7312'},
        {name:'foreign object',at:'-- HS1_BEFORE_EXACT_PACKAGE_CHECK',sql:'CREATE TABLE official_v3_intake_private.hs1_foreign(id integer);',code:'P7312'},
        {name:'temporary grant not removed',at:'-- HS1_AFTER_TEMPORARY_GRANT_REMOVAL',sql:'GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE,INHERIT FALSE,SET TRUE GRANTED BY postgres;',code:'P7311'},
      ] as const
      for(const fault of faults){
        await rejectScript(inject(fault.at,fault.sql),fault.code)
        await noPackage();assert.deepEqual(await snapshot(),baseline,fault.name)
      }
    })
    await group('HS1 actual LOGIN postgres installs unmodified source and returns to bootstrap-only memberships',async()=>{
      await installer.query(candidate)
      await bootstrapOnly()
      assert.deepEqual(await counts(),[{originals:'0',reservations:'0',completions:'0'}])
      assert.deepEqual(await snapshot(),baseline)
      // Existing fixture names are a coexistence check, not an HMA1 execution.
      assert.equal((await owner.query("SELECT count(*)::text AS readers FROM pg_catalog.pg_roles WHERE rolname='ot_v3_method_reader'"))[0]!.readers,'1')
    })
    await group('HS1 unused recovery requires exact OIDs/context and rejects foreign rights, defaults, drift and consumers',async()=>{
      await rejectScript(recovery,'P7313')
      await installer.query('SELECT pg_catalog.set_config($1::text,$2::text,false) AS context_ack',[pgText('jetnity.hs1_recovery_context'),pgText(recoveryContext)])
      await rejectScript(recovery,'P7313')
      const exact=await acknowledge()
      const wrong=JSON.parse(exact) as {database:{oid:number}}
      wrong.database.oid++
      await acknowledge(JSON.stringify(wrong));await rejectScript(recovery,'P7313')
      await acknowledge(exact)
      const mutations=[
        {name:'table ACL',before:'GRANT SELECT ON official_v3_intake_private.operations_v1 TO ot_s1_alien',after:'REVOKE SELECT ON official_v3_intake_private.operations_v1 FROM ot_s1_alien RESTRICT',code:'P7312'},
        {name:'column ACL',before:'GRANT SELECT(binding) ON official_v3_intake_private.operations_v1 TO ot_s1_alien',after:'REVOKE SELECT(binding) ON official_v3_intake_private.operations_v1 FROM ot_s1_alien RESTRICT',code:'P7312'},
        {name:'column option drift',before:'ALTER TABLE official_v3_intake_private.operations_v1 ALTER COLUMN operation_id SET (n_distinct=1)',after:'ALTER TABLE official_v3_intake_private.operations_v1 ALTER COLUMN operation_id RESET (n_distinct)',code:'P7312'},
        {name:'column statistics drift',before:'ALTER TABLE official_v3_intake_private.operations_v1 ALTER COLUMN operation_id SET STATISTICS 1',after:'ALTER TABLE official_v3_intake_private.operations_v1 ALTER COLUMN operation_id SET STATISTICS -1',code:'P7312'},
        {name:'function config',before:"ALTER FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) SET search_path=public",after:"ALTER FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) SET search_path=pg_catalog",code:'P7312'},
        {name:'owner default',before:'ALTER DEFAULT PRIVILEGES FOR ROLE ot_v3_intake_owner GRANT EXECUTE ON FUNCTIONS TO ot_s1_alien',after:'ALTER DEFAULT PRIVILEGES FOR ROLE ot_v3_intake_owner REVOKE EXECUTE ON FUNCTIONS FROM ot_s1_alien',code:'P7311'},
        {name:'extra member',before:'GRANT ot_v3_intake_caller TO ot_s1_alien WITH ADMIN FALSE,INHERIT FALSE,SET FALSE',after:'REVOKE ot_v3_intake_caller FROM ot_s1_alien RESTRICT',code:'P7311'},
        {name:'foreign object',before:'CREATE TABLE official_v3_intake_private.hs1_foreign(id integer)',after:'DROP TABLE official_v3_intake_private.hs1_foreign RESTRICT',code:'P7312'},
        {name:'foreign owner dependency',before:'CREATE TABLE hs1_unrelated.owner_dependency(id integer); ALTER TABLE hs1_unrelated.owner_dependency OWNER TO ot_v3_intake_owner',after:'DROP TABLE hs1_unrelated.owner_dependency RESTRICT',code:'P7312'},
        {name:'external view consumer',before:'CREATE VIEW hs1_unrelated.external_consumer AS SELECT operation_id FROM official_v3_intake_private.operations_v1',after:'DROP VIEW hs1_unrelated.external_consumer RESTRICT',code:'P7312'},
        {name:'M04 consumer',before:'CREATE SCHEMA official_v3_jobs_private',after:'DROP SCHEMA official_v3_jobs_private RESTRICT',code:'P7313'},
        {name:'unrelated method caller is not the allowed reader',before:'CREATE ROLE ot_v3_method_caller NOLOGIN',after:'DROP ROLE ot_v3_method_caller',code:'P7313'},
      ] as const
      for(const mutation of mutations){
        await owner.query(mutation.before)
        const observed=await snapshot()
        // Deliberately acknowledge current mutated OIDs: the acknowledgement
        // cannot make foreign state acceptable to independent package guards.
        await acknowledge()
        try{await rejectScript(recovery,mutation.code);assert.deepEqual(await snapshot(),observed,mutation.name);assert.deepEqual(await counts(),[{originals:'0',reservations:'0',completions:'0'}])}
        finally{await owner.query(mutation.after);await acknowledge(exact)}
      }
      await bootstrapOnly()
      assert.deepEqual(await snapshot(),baseline)
    })
    await group('HS1 exact unused recovery succeeds beside actual known reader name; stale reinstall OIDs refuse',async()=>{
      const old=await acknowledge()
      await installer.query(recovery)
      await noPackage()
      assert.deepEqual(await snapshot(),baseline)
      await installer.query(candidate);await bootstrapOnly()
      await acknowledge(old);await rejectScript(recovery,'P7313')
      await acknowledge()
      assert.deepEqual(await snapshot(),baseline)
    })
    await owner.query('GRANT ot_v3_intake_caller TO ot_s1_test_runner WITH ADMIN FALSE,INHERIT TRUE,SET TRUE')
    const caller=await connect('ot_s1_test_runner')
    const capture=async(binding:unknown,text:string)=>result(await caller.query(
      'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
      [pgText(JSON.stringify(binding)),pgText(text),pgText(sha256Hex(text))]))
    const reserve=async(f:ReturnType<typeof fixture>,lease=30_000)=>result(await caller.query(
      'SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
      [pgText(JSON.stringify(f.binding)),pgText(f.reference.proposalDigest),pgText(String(f.reference.bytes),23),pgText(String(lease),23)]))
    const finish=async(f:ReturnType<typeof fixture>,held:Record<string,unknown>,outcome:unknown,audit:unknown)=>result(await caller.query(
      'SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
      [pgText(JSON.stringify(f.binding)),pgText(f.reference.proposalDigest),pgText(String(f.reference.bytes),23),
        pgText(String(held.generation),23),pgText(String(held.leaseToken)),pgText(JSON.stringify(outcome)),pgText(JSON.stringify(audit))]))

    await group('HS1 R2 inherited REPEATABLE READ cannot hide a capture committed after recovery prefix',async()=>{
      assert.deepEqual(await counts(),[{originals:'0',reservations:'0',completions:'0'}])
      const boundary=recovery.indexOf('LOCK TABLE official_v3_intake_private.operations_v1,')
      assert.ok(boundary>0)
      assert.equal(recovery.indexOf('LOCK TABLE official_v3_intake_private.operations_v1,',boundary+1),-1)
      const prefix=recovery.slice(0,boundary),suffix=recovery.slice(boundary)
      assert.equal(prefix+suffix,recovery,'every actual candidate byte remains in order')
      const f=fixture('hs1-repeatable-read-late-writer')
      let transactionOpen=false,writer:LocalPgConnection|undefined
      await owner.query('REVOKE ot_v3_intake_caller FROM ot_s1_test_runner RESTRICT')
      const exact=await acknowledge()
      await installer.query("SET default_transaction_isolation='repeatable read'")
      try{
        await installer.query(prefix);transactionOpen=true
        const isolation=await installer.query("SELECT pg_catalog.current_setting('transaction_isolation') AS selected_isolation,pg_catalog.current_setting('default_transaction_isolation') AS inherited_isolation,current_user AS current_identity,session_user AS session_identity")
        assert.deepEqual(isolation,[{selected_isolation:'read committed',inherited_isolation:'repeatable read',current_identity:'ot_v3_intake_owner',session_identity:'postgres'}])
        // Prefix has completed real catalog reads. A new allowed writer commits
        // only now, before executing the byte-exact lock/emptiness/drop suffix.
        await owner.query('GRANT ot_v3_intake_caller TO ot_s1_test_runner WITH ADMIN FALSE,INHERIT TRUE,SET TRUE')
        writer=await connect('ot_s1_test_runner')
        await writer.query('BEGIN')
        assert.equal(result(await writer.query('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
          [pgText(JSON.stringify(f.binding)),pgText(f.text),pgText(f.upload.digest)])).status,'recorded')
        await writer.query('COMMIT')
        assert.ok(writer.operationDiagnostics.some(d=>d.phase==='commit'&&d.commitAcknowledged===true))
        close(writer);writer=undefined
        await owner.query('REVOKE ot_v3_intake_caller FROM ot_s1_test_runner RESTRICT')
        await rejectScript(suffix,'P7314');transactionOpen=false
        const retained=await owner.query('SELECT encode(original_bytes,\'hex\') AS original_hex,proposal_digest,generation::text AS generation FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text',[pgText(f.binding.operationId)])
        assert.deepEqual(retained,[{original_hex:Buffer.from(f.text,'utf8').toString('hex'),proposal_digest:f.upload.digest,generation:'0'}])
        assert.deepEqual(await counts(),[{originals:'1',reservations:'0',completions:'0'}])
        assert.equal((await owner.query(identitySql))[0]!.hs1_identity,exact)
        await bootstrapOnly()
        assert.deepEqual(await snapshot(),baseline)
      }finally{
        if(writer)close(writer)
        if(transactionOpen)await installer.query('ROLLBACK')
        await installer.query("SET default_transaction_isolation='read committed'")
      }
      await owner.query('GRANT ot_v3_intake_caller TO ot_s1_test_runner WITH ADMIN FALSE,INHERIT TRUE,SET TRUE')
    })
    await group('HS1 recovery waits for an active writer and then refuses committed history; each nonempty history stage refuses removal',async()=>{
      const f=fixture('hs1-late-writer'), value=await f.completion(), writer=await connect('ot_s1_test_runner'), observer=await connect()
      const writerIdentity=(await writer.query('SELECT pg_backend_pid()::text AS writer_pid,backend_start::text AS writer_birth FROM pg_catalog.pg_stat_activity WHERE pid=pg_backend_pid()'))[0]!
      const recoveryIdentity=(await installer.query('SELECT pg_backend_pid()::text AS recovery_pid,backend_start::text AS recovery_birth FROM pg_catalog.pg_stat_activity WHERE pid=pg_backend_pid()'))[0]!
      let pending:Promise<PgRows>|undefined
      try{
        await writer.query('BEGIN')
        assert.equal(result(await writer.query('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
          [pgText(JSON.stringify(f.binding)),pgText(f.text),pgText(f.upload.digest)])).status,'recorded')
        await owner.query('REVOKE ot_v3_intake_caller FROM ot_s1_test_runner RESTRICT')
        await acknowledge()
        pending=installer.query(recovery)
        void pending.catch(()=>{}) // Owning finally joins before any next group.
        let blocked=false
        for(let attempt=0;attempt<100;attempt++){
          const row=(await observer.query("SELECT count(*)::text AS blocked FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz AND wait_event_type='Lock' AND $3::integer=ANY(pg_catalog.pg_blocking_pids(pid))",
            [pgText(recoveryIdentity.recovery_pid!,23),pgText(recoveryIdentity.recovery_birth!),pgText(writerIdentity.writer_pid!,23)]))[0]!
          if(row.blocked==='1'){blocked=true;break}
          await lifetime.wait(20)
        }
        assert.equal(blocked,true,'recovery must really wait for its original table lock')
        await writer.query('COMMIT')
        assert.ok(writer.operationDiagnostics.some(d=>d.phase==='commit'&&d.commitAcknowledged===true))
        await assert.rejects(pending,sqlError('P7314'));pending=undefined
        await installer.query('ROLLBACK')
        assert.equal(await rowsFor(f.binding.operationId),'1')
        assert.deepEqual(await counts(),[{originals:'2',reservations:'0',completions:'0'}])
        await bootstrapOnly();await rejectScript(recovery,'P7314')
        await owner.query('GRANT ot_v3_intake_caller TO ot_s1_test_runner WITH ADMIN FALSE,INHERIT TRUE,SET TRUE')
        const held=await reserve(f);assert.equal(held.status,'acquired')
        await owner.query('REVOKE ot_v3_intake_caller FROM ot_s1_test_runner RESTRICT')
        await rejectScript(recovery,'P7314')
        assert.deepEqual(await counts(),[{originals:'2',reservations:'1',completions:'0'}])
        await owner.query('GRANT ot_v3_intake_caller TO ot_s1_test_runner WITH ADMIN FALSE,INHERIT TRUE,SET TRUE')
        assert.equal((await finish(f,held,value.outcome,value.audit)).status,'recorded')
        await owner.query('REVOKE ot_v3_intake_caller FROM ot_s1_test_runner RESTRICT')
        await rejectScript(recovery,'P7314')
        assert.deepEqual(await counts(),[{originals:'2',reservations:'1',completions:'1'}])
        await bootstrapOnly()
      }finally{
        close(writer)
        if(pending){await lifetime.drain([pending]);await installer.query('ROLLBACK')}
        close(observer)
      }
      await owner.query('GRANT ot_v3_intake_caller TO ot_s1_test_runner WITH ADMIN FALSE,INHERIT TRUE,SET TRUE')
      assert.deepEqual(await snapshot(),baseline)
    })
    await group('exact least privileges, FORCE RLS, fixed definers, no PUBLIC or API roles, immutable originals', async () => {
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
      assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid='official_v3_intake_private.default_probe()'::regprocedure AND a.grantee=0 AND a.privilege_type='EXECUTE' AND NOT a.is_grantable"))[0]?.n, '1','HS1 leaves global defaults untouched; only the finite package functions lose PUBLIC EXECUTE')
      await owner.query('DROP FUNCTION official_v3_intake_private.default_probe()')
      const f = fixture('native-immutable'); assert.equal((await capture(f.binding, f.text)).status, 'recorded')
      const owned = await connect(); await owned.query('SET ROLE ot_v3_intake_owner')
      await assert.rejects(owned.query('UPDATE official_v3_intake_private.operations_v1 SET original_bytes=original_bytes WHERE operation_id=$1::text',[pgText(f.binding.operationId)]), sqlError('P7301'))
      await assert.rejects(owned.query('DELETE FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text',[pgText(f.binding.operationId)]), sqlError('P7301'))
      await assert.rejects(owned.query('UPDATE official_v3_intake_private.operations_v1 SET generation=1,lease_token=gen_random_uuid(),acquired_at=clock_timestamp(),expires_at=NULL WHERE operation_id=$1::text',[pgText(f.binding.operationId)]), sqlError('23514'))
      close(owned)
    })

    await group('direct RPC retains supported full shapes and rejects PII/null/free-text at every depth before INSERT', async () => {
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

    await group('byte-preserving capture/reconnect, whitespace collision and complete server binding collisions', async () => {
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

    await group('independent concurrent clients serialize; expiry reclaims generation and rejects old ticket', async () => {
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

    await group('I1 uses durable quarantine for every terminal outcome and full archived escalation replay', async () => {
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

    await group('finish direct RPC refuses null, incomplete nested records and free text without storing a completion', async () => {
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

    await group('actual commit then lost acknowledgement requires same-operation readback, with no duplicate completion', async () => {
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

    await group('failure before commit, transaction abort and post-write lease lapse leave no partial data', async () => {
      const f=fixture('native-before-commit'), io=nativeExecutor(cluster,{beforeCommit(){throw Error('controlled_precommit_failure')}})
      assert.equal((await store(f,io.executor).intake.capture(f.text,f.binding,signal())).status,'unconfirmed')
      assert.equal(await rowsFor(f.binding.operationId),'0'); assert.equal(io.evidence.rolledBack,1)
      const interrupted=fixture('native-disconnected-xact'), c=await connect('ot_s1_test_runner')
      await c.query('BEGIN')
      await c.query('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text)',[pgText(JSON.stringify(interrupted.binding)),pgText(interrupted.text),pgText(interrupted.upload.digest)])
      const pid=(await c.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!; close(c)
      for(let i=0;i<100;i++){if((await owner.query('SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer',[pgText(pid,23)]))[0]?.n==='0')break; await lifetime.wait(20)}
      assert.equal(await rowsFor(interrupted.binding.operationId),'0')
      const slow=fixture('native-post-write-expiry'), value=await slow.completion(), sx=nativeExecutor(cluster), s=store(slow,sx.executor,2000)
      await s.intake.capture(slow.text,slow.binding,signal()); const port=s.forImport(slow.binding), held=await port.reserve(slow.upload,signal())
      if(held.status!=='acquired') assert.fail('slow reservation')
      await owner.query("CREATE FUNCTION public.s1_slow_completion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(GREATEST(0::double precision,extract(epoch FROM (expires_at-clock_timestamp()))::double precision)+0.03) FROM official_v3_intake_private.operations_v1 WHERE operation_id=NEW.operation_id; RETURN NEW; END $$; CREATE TRIGGER s1_slow AFTER INSERT ON official_v3_intake_private.completions_v1 FOR EACH ROW EXECUTE FUNCTION public.s1_slow_completion()")
      try { assert.equal((await port.finish(held.ticket,value.outcome,value.audit,signal())).status,'unconfirmed'); assert.ok(sx.evidence.sqlCodes.includes('P7302')) }
      finally { await owner.query('DROP TRIGGER s1_slow ON official_v3_intake_private.completions_v1; DROP FUNCTION public.s1_slow_completion()') }
      assert.equal(await completionsFor(slow.binding.operationId),'0')
    })

    await group('cancellation owns, terminates and drains a genuinely blocked PostgreSQL call', async () => {
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
          await lifetime.wait(20)
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

    await group('actual importer process interruption and new process reconnect preserve original and completed outcome', async () => {
      const seed='native-process-restart', f=fixture(seed), io=nativeExecutor(cluster)
      const allowed=new Set([
        'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
        'SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result',
        'SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
      ])
      async function worker(mode:'capture-reserve'|'confirm') {
        assert.equal(children.size,0,'one active child at a time')
        assert.ok(childCount<CHILD_LIMIT)
        const child=fork(fileURLToPath(new URL('../official-truth-v3-intake-store-1/process-worker.ts',import.meta.url)),[],{
          execPath:process.execPath,execArgv:['--import',fileURLToPath(new URL('../../server-only-test-register.mjs',import.meta.url)),'--import','tsx'],
          stdio:['ignore','ignore','ignore','ipc']})
        childCount++;children.add(child)
        let ended=false,produced=false,spawnError:unknown,exitSignal:NodeJS.Signals|null=null,exitCode:number|null=null
        const jobs:Promise<void>[]=[]
        const closed=lifetime.track(new Promise<void>(resolve=>{
          child.once('close',(code,termination)=>{ended=true;exitCode=code;exitSignal=termination;childJoined++;resolve()})
        }))
        let rejectOutput:(reason:unknown)=>void=()=>{}
        const output=lifetime.track(new Promise<Record<string,unknown>>((resolve,reject)=>{
          rejectOutput=reject
          child.once('error',error=>{spawnError=error;reject(error)})
          child.once('exit',()=>{if(!produced)reject(Error('worker_exited_before_result'))})
          child.on('message',(message:unknown)=>{
            if(!message||typeof message!=='object'){reject(Error('worker_message'));return}
            const row=message as Record<string,unknown>
            if(row.type==='held'||row.type==='confirmed'){if(produced){reject(Error('worker_duplicate_result'));return}produced=true;resolve(row);return}
            if(row.type!=='sql'||typeof row.id!=='number'||!Number.isSafeInteger(row.id)||row.id<1
              ||typeof row.statement!=='string'||!allowed.has(row.statement)||!Array.isArray(row.parameters)
              ||row.parameters.length>4||jobs.length>=4
              ||row.parameters.some(value=>typeof value!=='string'&&typeof value!=='number'||typeof value==='string'&&value.length>524288)){
              reject(Error('worker_request'));return
            }
            const job=lifetime.run(async()=>{
              const reply=await io.executor.execute(row.statement as string,row.parameters as (string|number)[],signal())
              if(!child.connected)throw Error('worker_reply_channel_closed')
              await new Promise<void>((sent,failed)=>child.send({type:'reply',id:row.id,reply},error=>error?failed(error):sent()))
            })
            jobs.push(job);void job.catch(reject)
          })
        }))
        void output.catch(()=>{})
        const releaseStop=lifetime.onStop(()=>{if(!ended)child.kill('SIGKILL');rejectOutput(lifetime.signal.reason)})
        const timer=setTimeout(()=>{if(!ended)child.kill('SIGKILL');rejectOutput(Error('worker_deadline'))},15_000)
        try{
          await lifetime.run(()=>new Promise<void>((sent,failed)=>child.send({type:'start',seed,mode},error=>error?failed(error):sent())))
          const observed=await output
          if(mode==='capture-reserve')child.kill('SIGKILL')
          await closed
          if(spawnError)throw spawnError
          if(mode==='capture-reserve')assert.equal(exitSignal,'SIGKILL')
          else{assert.equal(exitSignal,null);assert.equal(exitCode,0)}
          const results=await lifetime.drain(jobs)
          for(const result of results)if(result.status==='rejected')throw result.reason
          return observed
        }finally{
          clearTimeout(timer)
          if(!ended)child.kill('SIGKILL')
          await lifetime.drain<unknown>([closed,output,...jobs])
          releaseStop();children.delete(child)
        }
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


    await group('HS1 used custody remains intact; unused-only recovery cannot replace a forward repair',async()=>{
      close(caller)
      await owner.query('REVOKE ot_v3_intake_caller FROM ot_s1_test_runner RESTRICT')
      await acknowledge()
      const before=await counts()
      assert.ok(Number(before[0]!.originals)>2)
      assert.ok(Number(before[0]!.reservations)>0)
      assert.ok(Number(before[0]!.completions)>0)
      await rejectScript(recovery,'P7314')
      assert.deepEqual(await counts(),before)
      await bootstrapOnly()
      assert.deepEqual(await snapshot(),baseline)
    })
    assert.equal(groups.length,18,'all selected groups must complete')
    assert.equal(childCount,CHILD_LIMIT);assert.equal(childJoined,childCount);assert.equal(children.size,0)
    assert.ok(performance.now()-startedAt<EFFECT_MS,'no effect budget restart')
    assert.equal(WRAPPER_MS,210_000)
  }catch(error){primary=error;hasFailure=true}
  finally{
    clearTimeout(effectTimer)
    t.signal.removeEventListener('abort',parentAbort)
    try{
      receipt=await lifetime.dispose()
      assert.equal(receipt.pending,0)
      assert.equal(receipt.started,receipt.settled)
      assert.equal(receipt.connections,receipt.closed)
      assert.equal(receipt.stoppedClusters,1)
      assert.equal(activeConnections,0)
      assert.equal(children.size,0)
      assert.equal(childJoined,childCount)
    }catch(error){primary=hasFailure?new AggregateError([primary,error],'hs1_primary_and_cleanup_failure'):error;hasFailure=true}
  }
  if(hasFailure)throw primary
  assert.ok(receipt)
  t.diagnostic(JSON.stringify({schema:'hs1-native-v1',hosted:false,mandatory:true,acceptedWrites:0,
    groups:groups.length,effectBudgetMs:EFFECT_MS,ownedDrainBudgetMs:35_000,wrapperCeilingMs:WRAPPER_MS,
    connections:connectionCount,maxActiveConnections,children:childCount,joinedChildren:childJoined,ownership:receipt}))
}
