// HMT1 source-only authored proof. Every authority fixture is synthetic.
// Root must separately select PG17 execution; this module is not hosted HTTP QA.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { assertOwnedLocalProofCluster, startLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { ma1Operation, ma1SyntheticTuple } from '../official-truth-v3-method-authority-1/fixtures'
import type { Ma1MethodBinding } from '../../../lib/readiness/official-truth-product-v3/method/contract'

const EFFECT_MS = 180_000
const DRAIN_MS = 35_000
const CONNECTION_LIMIT = 128
const SOURCE_PINS = Object.freeze([
  [
    "./install-candidate.sql",
    "727e83dbed7f0a6b127c3003248d85acc6b920fddc44356cdfeb8f3f57a82d2c"
  ],
  [
    "./recovery-candidate.sql",
    "c81bc8f70b55353f6f5ed974cf387c07cf807a0ccbadbcb0fcaa8374606ea459"
  ],
  [
    "../official-truth-v3-hosted-method-authority-1/install-candidate.sql",
    "edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0"
  ],
  [
    "../official-truth-v3-hosted-method-authority-1/recovery-candidate.sql",
    "c8f6a40f72b5f36d0a0808e6fe0c7444bdb93fce3cbb6c5f580b14daeb19d13d"
  ],
  [
    "../official-truth-v3-hosted-method-authority-1/native.ts",
    "b8370649fb278c9c5a7f60bccd2f866ef972c642facc2683babdd6e1dcbfb19e"
  ],
  [
    "../official-truth-v3-private-owner-guards-1/install-candidate.sql",
    "3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2"
  ],
  [
    "../official-truth-integrated-pilot-1/local-cluster.ts",
    "f6d21b3fef8f0ad41a8ac3951972ea5cba0394cfe41037eba8d0258ed508aa10"
  ],
  [
    "../official-truth-integrated-pilot-1/pg-wire.ts",
    "57f3b01f5624889a41e8e8832cbebf49da9100fbb4dec6ffe25f769a44a4aaf8"
  ],
  [
    "../official-truth-atomic-version-refresh-1/test-lifetime.ts",
    "e7a6a5deb652019209fd9e4bd2f1ce71bef3c15a4988838ab5b35f147dbbee68"
  ],
  [
    "../official-truth-v3-method-authority-1/fixtures.ts",
    "f6c2fe919e7ccd056fd0120010cf4189540c4b71a818f105d38e276577c03811"
  ],
  [
    "../../../lib/readiness/official-truth-product-v3/method/contract.ts",
    "77d88e2063bf12ee4c1ca385bb4d65b9b5fd14845da62a25556877a0329ed05e"
  ],
  [
    "../../../lib/readiness/official-truth-v3-human-method-transport-1.test.ts",
    "f471be4cc81a58d9c4d715e642210ae9b50415836c3e3836e888b6d2c4337061"
  ]
] as const)
const WRAPPERS = Object.freeze([
  {
    "name": "stage_draft_v1",
    "args": [
      [
        "p_operation_id",
        "text"
      ],
      [
        "p_method_id",
        "text"
      ],
      [
        "p_revision",
        "integer"
      ],
      [
        "p_method_digest",
        "text"
      ],
      [
        "p_package_digest",
        "text"
      ],
      [
        "p_predecessor_revision",
        "integer"
      ]
    ],
    "publicName": "official_v3_method_stage_draft_v1",
    "signature": "public.official_v3_method_stage_draft_v1(text,text,integer,text,text,integer)",
    "target": "official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)"
  },
  {
    "name": "approve_v1",
    "args": [
      [
        "p_operation_id",
        "text"
      ],
      [
        "p_method_id",
        "text"
      ],
      [
        "p_revision",
        "integer"
      ],
      [
        "p_method_digest",
        "text"
      ],
      [
        "p_package_digest",
        "text"
      ],
      [
        "p_expected_revision",
        "integer"
      ],
      [
        "p_expected_method_digest",
        "text"
      ],
      [
        "p_expected_package_digest",
        "text"
      ],
      [
        "p_expected_epoch",
        "integer"
      ],
      [
        "p_expected_status",
        "text"
      ],
      [
        "p_approval_mode",
        "text"
      ],
      [
        "p_approval_until",
        "text"
      ]
    ],
    "publicName": "official_v3_method_approve_v1",
    "signature": "public.official_v3_method_approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)",
    "target": "official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)"
  },
  {
    "name": "revoke_v1",
    "args": [
      [
        "p_operation_id",
        "text"
      ],
      [
        "p_method_id",
        "text"
      ],
      [
        "p_revision",
        "integer"
      ],
      [
        "p_method_digest",
        "text"
      ],
      [
        "p_package_digest",
        "text"
      ],
      [
        "p_expected_epoch",
        "integer"
      ]
    ],
    "publicName": "official_v3_method_revoke_v1",
    "signature": "public.official_v3_method_revoke_v1(text,text,integer,text,text,integer)",
    "target": "official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)"
  },
  {
    "name": "confirm_operation_v1",
    "args": [
      [
        "p_operation_id",
        "text"
      ],
      [
        "p_action",
        "text"
      ],
      [
        "p_method_id",
        "text"
      ],
      [
        "p_revision",
        "integer"
      ],
      [
        "p_method_digest",
        "text"
      ],
      [
        "p_package_digest",
        "text"
      ],
      [
        "p_predecessor_revision",
        "integer"
      ],
      [
        "p_expected_revision",
        "integer"
      ],
      [
        "p_expected_method_digest",
        "text"
      ],
      [
        "p_expected_package_digest",
        "text"
      ],
      [
        "p_expected_epoch",
        "integer"
      ],
      [
        "p_expected_status",
        "text"
      ],
      [
        "p_approval_mode",
        "text"
      ],
      [
        "p_approval_until",
        "text"
      ]
    ],
    "publicName": "official_v3_method_confirm_operation_v1",
    "signature": "public.official_v3_method_confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)",
    "target": "official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)"
  }
] as const)
const AUTH_HELPER_BODIES = Object.freeze({
  "jwt": "\n  select \n    coalesce(\n        nullif(current_setting('request.jwt.claim', true), ''),\n        nullif(current_setting('request.jwt.claims', true), '')\n    )::jsonb\n",
  "uid": "\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.sub', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n  )::uuid\n"
} as const)
const AUTH_HELPER_PINS = Object.freeze([
  {
    "name": "jwt",
    "bytes": 166,
    "sha256": "fed2a8ac0349ffaba807c1b574698bfb1348825b8ef5163ad72d8408386f5e3e"
  },
  {
    "name": "uid",
    "bytes": 176,
    "sha256": "9ab5ea099e74ec09e83b1505c51a3647791195aed7c742dcc3f257dfc7d2f300"
  }
] as const)

const digest = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
function source(path: string): string {
  const pin = SOURCE_PINS.find(([name]) => name === path)
  assert.ok(pin, 'unlisted source')
  const bytes = readFileSync(new URL(path, import.meta.url))
  assert.equal(digest(bytes), pin[1], 'source drift requires independent review')
  return bytes.toString('utf8')
}
function block(text: string, label: string): string {
  const opening = 'DO $' + label + '$', closing = '$' + label + '$;'
  const at = text.indexOf(opening), end = text.indexOf(closing, at)
  assert.ok(at >= 0 && end > at, 'bounded block absent')
  assert.equal(text.indexOf(opening, at + opening.length), -1)
  assert.equal(text.indexOf(closing, end + closing.length), -1)
  return text.slice(at, end + closing.length)
}
const AUTH = Object.freeze({
  owner:'11111111-1111-4111-8111-111111111111', other:'22222222-2222-4222-8222-222222222222',
  session:'55555555-5555-4555-8555-555555555555', foreign:'66666666-6666-4666-8666-666666666666',
})
const LOGIN = Object.freeze({human:'hmt1_human',anon:'hmt1_anon',service:'hmt1_service'})
const TARGET = 'dev:yfvbxvijcorffwxbxahl:postgres:E18B6824905662'
const NAMES = WRAPPERS.map(w => "'" + w.publicName + "'").join(',')
const claims = (change: Readonly<Record<string,unknown>> = {}) => ({
  sub:AUTH.owner,session_id:AUTH.session,role:'authenticated',aal:'aal2',
  exp:Math.floor(Date.now()/1000)+300,...change,
})
const code = (expected: string) => (error: unknown) => error instanceof LocalPgError && error.code === expected
type Scalar = string | number | null
const values = (items: readonly Scalar[]) => items.map(x => pgText(x === null ? '' : String(x)))
const args = (types: readonly string[]) => types.map((type,i) =>
  "NULLIF($" + (i+1) + "::text,'')" + (type==='integer'?'::integer':'')).join(',')
const sql = (index: number) => 'SELECT public.' + WRAPPERS[index]!.publicName + '('
  + args(WRAPPERS[index]!.args.map(a=>a[1])) + ') AS result'
const STAGE=sql(0), APPROVE=sql(1), REVOKE=sql(2), CONFIRM=sql(3)
const IDENTITY='SELECT pg_catalog.pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_catalog.pg_stat_activity WHERE pid=pg_catalog.pg_backend_pid()'
type Identity=Readonly<{pid:string;birth:string}>
type Role='authenticated'|'anon'|'service_role'
type Terminal=Awaited<ReturnType<OwnedTestLifetime['dispose']>>
type Receipt=Readonly<{status:string;operationId?:string;actorId?:string;action?:string;command?:unknown;before?:unknown;after?:{status?:string;epoch?:number}}>
function acknowledgment(rows: PgRows): Receipt {
  assert.equal(rows.length,1); assert.ok(rows[0]!.result && rows[0]!.result.length<8192)
  return JSON.parse(rows[0]!.result) as Receipt
}
function observe<T>(promise: Promise<T>) {
  let settled=false
  const result=promise.then(value=>{settled=true;return {ok:true as const,value}},
    error=>{settled=true;return {ok:false as const,error:error as unknown}})
  return {result,settled:()=>settled}
}
async function transaction(connection:LocalPgConnection,candidate:string):Promise<void> {
  try { await connection.query(candidate) }
  catch(error) {
    try { await connection.query('ROLLBACK') }
    catch(rollbackError) { throw new AggregateError([error,rollbackError],'hmt1 candidate and rollback failed') }
    throw error
  }
}
async function setClaims(connection:LocalPgConnection,value:unknown):Promise<void> {
  const json=JSON.stringify(value); assert.equal(typeof json,'string')
  await connection.query("SELECT set_config('request.jwt.claims',$1,false)",[pgText(json!)])
}
async function resetHumans(connection:LocalPgConnection):Promise<void> {
  // Only these disposable synthetic Auth/profile rows belong to this fixture.
  await connection.query("TRUNCATE auth.users CASCADE; INSERT INTO auth.users(id) VALUES('"+AUTH.owner+"'),('"+AUTH.other+"');"
    +"INSERT INTO public.profiles(user_id,role,status) VALUES('"+AUTH.owner+"','owner','active'),('"+AUTH.other+"','owner','active');"
    +"INSERT INTO auth.sessions(id,user_id,aal) VALUES('"+AUTH.session+"','"+AUTH.owner+"','aal2'),('"+AUTH.foreign+"','"+AUTH.other+"','aal2');")
}
async function fixture(cluster:LocalProofCluster) {
  assertOwnedLocalProofCluster(cluster)
  const identities=new Map<LocalPgConnection,Identity>(),connections=new Set<LocalPgConnection>()
  const connect=async(login=cluster.user,role?:Role) => {
    assert.ok(connections.size<CONNECTION_LIMIT,'finite connection inventory exceeded')
    const connection=await LocalPgConnection.connect(cluster,login);connections.add(connection)
    const id=(await connection.query(IDENTITY))[0];assert.ok(id?.pid && id.birth)
    identities.set(connection,{pid:id.pid,birth:id.birth})
    if(role)await connection.query('SET ROLE '+role)
    return connection
  }
  const bootstrap=await connect(),observer=await connect()
  const version=Number((await bootstrap.query("SELECT current_setting('server_version_num') AS version"))[0]?.version)
  assert.ok(Number.isInteger(version)&&version>=170000&&version<180000,'actual PostgreSQL17 mandatory')
  await bootstrap.query([
    'CREATE ROLE anon NOLOGIN INHERIT NOSUPERUSER NOBYPASSRLS',
    'CREATE ROLE authenticated NOLOGIN INHERIT NOSUPERUSER NOBYPASSRLS',
    'CREATE ROLE service_role NOLOGIN INHERIT NOSUPERUSER BYPASSRLS',
    'CREATE ROLE postgres LOGIN INHERIT NOSUPERUSER BYPASSRLS CREATEROLE CREATEDB REPLICATION',
    'ALTER DATABASE postgres OWNER TO postgres',
    "ALTER ROLE postgres SET application_name='hmt1-synthetic-fixture'",
    "ALTER ROLE postgres IN DATABASE postgres SET statement_timeout='25s'",
    'CREATE ROLE hmt1_alien NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS',
    'CREATE ROLE '+LOGIN.human+' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION',
    'CREATE ROLE '+LOGIN.anon+' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION',
    'CREATE ROLE '+LOGIN.service+' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION',
    'GRANT authenticated TO '+LOGIN.human,
    'GRANT anon TO '+LOGIN.anon,
    'GRANT service_role TO '+LOGIN.service,
    'GRANT USAGE ON SCHEMA public TO postgres,anon,authenticated,service_role',
    'CREATE SCHEMA auth',
    "CREATE TYPE auth.aal_level AS ENUM('aal1','aal2','aal3')",
    'CREATE TABLE auth.users(id uuid PRIMARY KEY,deleted_at timestamptz,banned_until timestamptz,is_anonymous boolean NOT NULL DEFAULT false)',
    'CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,aal auth.aal_level,not_after timestamptz)',
    'CREATE TABLE public.profiles(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,role text NOT NULL,status text NOT NULL)',
    'ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE auth.users FORCE ROW LEVEL SECURITY',
    'ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE auth.sessions FORCE ROW LEVEL SECURITY',
    'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY',
    'CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $hmt_auth$'+AUTH_HELPER_BODIES.jwt+'$hmt_auth$',
    'CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $hmt_auth$'+AUTH_HELPER_BODIES.uid+'$hmt_auth$',
    'REVOKE ALL ON FUNCTION auth.jwt(),auth.uid() FROM PUBLIC',
    'GRANT USAGE ON SCHEMA auth TO postgres,authenticated,service_role',
    'GRANT EXECUTE ON FUNCTION auth.jwt(),auth.uid() TO postgres,authenticated,service_role',
    'GRANT SELECT(id,deleted_at,banned_until,is_anonymous),UPDATE(id) ON auth.users TO postgres',
    'GRANT SELECT(id,user_id,aal,not_after),UPDATE(id) ON auth.sessions TO postgres',
    'GRANT SELECT(user_id,role,status),UPDATE(user_id) ON public.profiles TO postgres',
    'CREATE TABLE public.hmt1_unrelated_marker(id integer PRIMARY KEY,value text NOT NULL)',
    "INSERT INTO public.hmt1_unrelated_marker VALUES(1,'retained-hmt1-fixture')",
  ].join(';\n')+';')
  await resetHumans(bootstrap)
  const installer=await connect('postgres')
  await installer.query("SELECT set_config('jetnity.hmt1_target',$1,false)",[pgText(TARGET)])
  await installer.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres,service_role')
  await observer.query("SET statement_timeout='1s'; SET lock_timeout='1s'")
  const profile=await installer.query('SELECT session_user::text AS session,current_user::text AS role,rolcanlogin::text,rolinherit::text,rolsuper::text,rolcreatedb::text,rolcreaterole::text,rolbypassrls::text FROM pg_roles WHERE rolname=current_user')
  assert.deepEqual(profile,[{session:'postgres',role:'postgres',rolcanlogin:'true',rolinherit:'true',rolsuper:'false',rolcreatedb:'true',rolcreaterole:'true',rolbypassrls:'true'}])
  let operation=0
  const op=()=>ma1Operation(++operation)
  const human=async(value:unknown=claims()) => {
    const connection=await connect(LOGIN.human,'authenticated')
    await setClaims(connection,value)
    assert.deepEqual(await connection.query('SELECT session_user::text AS session,current_user::text AS role'),
      [{session:LOGIN.human,role:'authenticated'}])
    return connection
  }
  const call=async(query:string,items:readonly Scalar[],value:unknown=claims()) => {
    const connection=await human(value)
    try { return await connection.query(query,values(items)) } finally { connection.close() }
  }
  const history=(connection=bootstrap)=>connection.query("SELECT (SELECT count(*)::text FROM official_v3_method_private.revisions_v1) AS revisions,"
    +"(SELECT count(*)::text FROM official_v3_method_private.heads_v1) AS heads,(SELECT count(*)::text FROM official_v3_method_private.operations_v1) AS operations")
  const fullHistory=async(connection=bootstrap)=>({
    revisions:await connection.query('SELECT row_to_json(v)::text AS value FROM official_v3_method_private.revisions_v1 v ORDER BY method_id,revision'),
    heads:await connection.query('SELECT row_to_json(v)::text AS value FROM official_v3_method_private.heads_v1 v ORDER BY method_id'),
    operations:await connection.query('SELECT row_to_json(v)::text AS value FROM official_v3_method_private.operations_v1 v ORDER BY operation_id'),
  })
  const functionOids=async()=> (await bootstrap.query("SELECT jsonb_agg(oid ORDER BY proname)::text AS oids FROM pg_proc WHERE pronamespace=2200 AND proname IN ("+NAMES+")"))[0]?.oids
  const snapshot=async()=>({
    schemas:await bootstrap.query("SELECT row_to_json(n)::text AS value FROM pg_namespace n WHERE nspname IN ('public','jetnity_ot_auth','official_v3_method_api','official_v3_method_private') ORDER BY oid"),
    functions:await bootstrap.query("SELECT row_to_json(p)::text AS value FROM pg_proc p WHERE pronamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_api','official_v3_method_private')) OR (pronamespace=2200 AND proname IN ("+NAMES+")) ORDER BY oid"),
    dependencies:await bootstrap.query("SELECT row_to_json(d)::text AS value FROM pg_depend d WHERE (classid='pg_proc'::regclass AND objid IN (SELECT oid FROM pg_proc WHERE pronamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_api','official_v3_method_private')) OR (pronamespace=2200 AND proname IN ("+NAMES+")))) OR (refclassid='pg_proc'::regclass AND refobjid IN (SELECT oid FROM pg_proc WHERE pronamespace=2200 AND proname IN ("+NAMES+"))) ORDER BY classid,objid,objsubid,refclassid,refobjid,refobjsubid,deptype"),
    shared:await bootstrap.query("SELECT row_to_json(d)::text AS value FROM pg_shdepend d WHERE classid='pg_proc'::regclass AND objid IN (SELECT oid FROM pg_proc WHERE pronamespace=2200 AND proname IN ("+NAMES+")) ORDER BY dbid,classid,objid,refobjid,deptype"),
    defaults:await bootstrap.query("SELECT row_to_json(d)::text AS value FROM pg_default_acl d WHERE defaclrole='postgres'::regrole ORDER BY oid"),
    roles:await bootstrap.query("SELECT row_to_json(r)::text AS value FROM pg_roles r WHERE rolname IN ('postgres','anon','authenticated','service_role','ot_v3_method_reader') ORDER BY oid"),
    memberships:await bootstrap.query('SELECT row_to_json(m)::text AS value FROM pg_auth_members m ORDER BY roleid,member,grantor'),
    tables:await bootstrap.query("SELECT row_to_json(c)::text AS value FROM pg_class c WHERE relnamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_api','official_v3_method_private')) ORDER BY oid"),
    marker:await bootstrap.query('SELECT id::text,value FROM public.hmt1_unrelated_marker ORDER BY id'),
  })
  const prerequisiteSnapshot=async()=>({
    functions:await bootstrap.query("SELECT row_to_json(p)::text AS value FROM pg_proc p WHERE pronamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_api','official_v3_method_private')) ORDER BY oid"),
    schemas:await bootstrap.query("SELECT row_to_json(n)::text AS value FROM pg_namespace n WHERE nspname IN ('jetnity_ot_auth','official_v3_method_api','official_v3_method_private') ORDER BY oid"),
    roles:await bootstrap.query("SELECT row_to_json(r)::text AS value FROM pg_roles r WHERE rolname='ot_v3_method_reader'"),
    memberships:await bootstrap.query("SELECT row_to_json(m)::text AS value FROM pg_auth_members m WHERE roleid='ot_v3_method_reader'::regrole OR member='ot_v3_method_reader'::regrole ORDER BY roleid,member,grantor"),
  })
  const bindRecovery=async(oids?:string) => {
    const exact=oids??await functionOids();assert.ok(exact)
    await installer.query("SELECT set_config('jetnity.hmt1_original_oids',$1,false) AS original_oids,set_config('jetnity.hmt1_recovery_context','root-verified-unused-quiescent-v1',false) AS recovery_context,"
      +"set_config('jetnity.hmt1_quiescence_receipt','synthetic-only:owned-fixture:no-external-requests',false) AS external_receipt,"
      +"set_config('jetnity.hmt1_quiescence_until',(clock_timestamp()+interval '4 minutes')::text,false) AS quiescence_until",[pgText(exact)])
  }
  return {cluster,version,bootstrap,observer,installer,profile,connect,human,call,op,identities,history,fullHistory,functionOids,snapshot,prerequisiteSnapshot,bindRecovery}
}
type Fixture=Awaited<ReturnType<typeof fixture>>
async function waitUntil(lifetime:OwnedTestLifetime,predicate:()=>Promise<boolean>,message:string,milliseconds=3000):Promise<void> {
  const until=performance.now()+milliseconds
  do { if(await predicate())return;await lifetime.wait(10) }while(performance.now()<until)
  assert.fail(message)
}
async function waitBlocked(f:Fixture,lifetime:OwnedTestLifetime,caller:LocalPgConnection,holder:LocalPgConnection,settled:()=>boolean,query:string):Promise<void> {
  const c=f.identities.get(caller)!,h=f.identities.get(holder)!
  await waitUntil(lifetime,async()=>{
    const rows=await f.observer.query("SELECT a.wait_event_type,a.query,($3::integer=ANY(pg_blocking_pids(a.pid)))::text AS actual_holder FROM pg_stat_activity a WHERE a.pid=$1::integer AND a.backend_start=$2::timestamptz",
      [pgText(c.pid,23),pgText(c.birth),pgText(h.pid,23)])
    return !settled()&&rows.length===1&&rows[0]!.wait_event_type==='Lock'&&rows[0]!.query===query&&rows[0]!.actual_holder==='true'
  },'identified actual lock wait absent')
}
const stageValues=(op:string,b:Ma1MethodBinding):readonly Scalar[]=>[op,b.methodId,b.revision,b.methodDigest,b.packageDigest,b.revision===1?null:b.revision-1]
const confirmStage=(op:string,b:Ma1MethodBinding):readonly Scalar[]=>[op,'stage',b.methodId,b.revision,b.methodDigest,b.packageDigest,b.revision===1?null:b.revision-1,null,null,null,null,null,null,null]
function negativeOperations(op:string,b:Ma1MethodBinding):readonly (readonly [string,readonly Scalar[]])[] {
  return [
    [STAGE,stageValues(op,b)],
    [APPROVE,[op,b.methodId,b.revision,b.methodDigest,b.packageDigest,null,null,null,0,null,'until_revoked',null]],
    [REVOKE,[op,b.methodId,b.revision,b.methodDigest,b.packageDigest,1]],
    [CONFIRM,confirmStage(op,b)],
  ]
}
function expectedStage(op:string,b:Ma1MethodBinding) {
  return {schema:1,operationId:op,action:'stage',methodId:b.methodId,revision:b.revision,methodDigest:b.methodDigest,packageDigest:b.packageDigest,predecessorRevision:b.revision===1?null:b.revision-1,expected:null,approval:null}
}

async function withCleanup<T>(work:()=>Promise<T>,cleanup:()=>Promise<void>):Promise<T> {
  let failed=false,failure:unknown,result:T|undefined
  try { result=await work() }catch(error){failed=true;failure=error}
  finally { try { await cleanup() }catch(error){failure=failed?new AggregateError([failure,error],'hmt1 work and cleanup failed'):error;failed=true} }
  if(failed)throw failure
  return result as T
}
async function cleanupWitness(lifetime:OwnedTestLifetime,mode:'failure'|'timeout') {
  // All three clusters share ONE lifetime and one terminal 35000ms drain.
  // No nested per-witness disposal can extend the final cleanup window.
  const cluster=lifetime.startCluster(startLocalProofCluster)
  const controller=new AbortController(),marker=Error('hmt1_expected_'+mode)
  let target:LocalPgConnection|undefined,observer:LocalPgConnection|undefined
  let pending:ReturnType<typeof observe<PgRows>>|undefined
  let timer:ReturnType<typeof setTimeout>|undefined,timerFired=false,expected=false
  let failed=false,failure:unknown
  try {
    target=await LocalPgConnection.connect(cluster)
    observer=await LocalPgConnection.connect(cluster)
    const id=(await target.query(IDENTITY))[0];assert.ok(id?.pid&&id.birth)
    pending=observe(target.query('SELECT pg_catalog.pg_sleep(25)'))
    await waitUntil(lifetime,async()=>{
      const rows=await observer!.query("SELECT state,wait_event FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz",
        [pgText(id.pid!,23),pgText(id.birth!)])
      return !pending!.settled()&&rows.length===1&&rows[0]!.state==='active'&&rows[0]!.wait_event==='PgSleep'
    },'real cleanup witness SQL was not active')
    if(mode==='failure')throw marker
    await lifetime.run(()=>new Promise<never>((_resolve,reject)=>{
      const abort=()=>{controller.signal.removeEventListener('abort',abort);reject(controller.signal.reason)}
      controller.signal.addEventListener('abort',abort,{once:true})
      timer=setTimeout(()=>{timerFired=true;controller.abort(marker)},25)
    }))
  }catch(error){if(error===marker)expected=true;else{failed=true;failure=error}}
  finally {
    clearTimeout(timer)
    try {
      target?.close();observer?.close()
      lifetime.stopCluster(cluster)
      if(pending) {
        const joined=await lifetime.drain([pending.result])
        assert.equal(joined.length,1);assert.equal(joined[0]!.status,'fulfilled')
        const result=await pending.result
        assert.equal(result.ok,false,'interrupted original SQL must settle negatively')
      }
      assert.equal(existsSync(cluster.root),false)
    }catch(error){failure=failed?new AggregateError([failure,error],'hmt1 expected-failure cleanup failed'):error;failed=true}
  }
  if(failed)throw failure
  assert.equal(expected,true);assert.equal(timerFired,mode==='timeout')
  return {mode,activeQueryObserved:true,abortSignalFired:controller.signal.aborted,timerFired,originalQueryJoined:true,clusterRemoved:true}
}
export async function runHumanMethodTransportNative(t:TestContext):Promise<void> {
  const started=performance.now(),cutoff=new AbortController()
  const timer=setTimeout(()=>cutoff.abort(Error('hmt1_effect_budget_expired')),EFFECT_MS)
  const lifetime=new OwnedTestLifetime(AbortSignal.any([t.signal,cutoff.signal]))
  lifetime.installConnectOwnership()
  const completed:string[]=[],groupEvidence:Record<string,unknown>={}
  let failed=false,failure:unknown,terminal:Terminal|undefined
  let cluster:LocalProofCluster|undefined,f:Fixture|undefined,actualNativeHash:string|null=null
  let effectEnded=started,cleanupEnded=started
  const group=async(name:string,work:()=>Promise<unknown>)=>{
    lifetime.check();let passed=false,groupFailed=false,groupFailure:unknown
    await t.test(name,async()=>{
      try{groupEvidence[name]=await work();lifetime.check();passed=true}
      catch(error){groupFailed=true;groupFailure=error;throw error}
    })
    if(groupFailed)throw groupFailure
    assert.equal(passed,true,name+' incomplete');completed.push(name)
  }
  try {
    actualNativeHash=digest(readFileSync(new URL('./native.ts',import.meta.url)))
    // Sibling HMA1 absence or pin drift fails here, inside the failure receipt.
    for(const [path]of SOURCE_PINS)source(path)
    const install=source('./install-candidate.sql'),recovery=source('./recovery-candidate.sql')
    const hma=source('../official-truth-v3-hosted-method-authority-1/install-candidate.sql')
    const pg1=source('../official-truth-v3-private-owner-guards-1/install-candidate.sql')
    for(const label of ['pg1_exact_inventory','ma1_exact_boundary','hma1_exact_identity'])assert.equal(block(install,label),block(hma,label))
    assert.equal(block(install,'hmt1_exact_inventory'),block(recovery,'hmt1_exact_inventory'))
    assert.equal(install.split('CREATE FUNCTION public.').length-1,4)
    assert.equal(recovery.split('DROP FUNCTION public.').length-1,4)
    for(const pin of AUTH_HELPER_PINS){assert.equal(Buffer.byteLength(AUTH_HELPER_BODIES[pin.name]),pin.bytes);assert.equal(digest(AUTH_HELPER_BODIES[pin.name]),pin.sha256)}
    cluster=lifetime.startCluster(startLocalProofCluster)
    f=await fixture(cluster);const db=f
    // These two source artifacts run only as the actual NOSUPER LOGIN postgres.
    await transaction(db.installer,pg1)
    await transaction(db.installer,hma)
    const untouched=await db.prerequisiteSnapshot()
    const refusal=async(candidate:string,state:string,connection=db.installer)=>{
      const before=await db.snapshot(),history=await db.fullHistory()
      await assert.rejects(transaction(connection,candidate),code(state))
      assert.deepEqual(await db.snapshot(),before,'refusal changed catalog/default/role/marker')
      assert.deepEqual(await db.fullHistory(),history,'refusal changed committed history')
    }
    await group('HMT1-01 real creator and atomic hostile-preflight refusals',async()=>{
      await refusal(install,'P7901',db.bootstrap)
      const restricted=await db.human()
      try{await refusal(install,'P7901',restricted)}finally{restricted.close()}
      await db.installer.query("SELECT set_config('jetnity.hmt1_target','wrong-project',false)")
      await withCleanup(()=>refusal(install,'P7901'),async()=>{await db.installer.query("SELECT set_config('jetnity.hmt1_target',$1,false)",[pgText(TARGET)])})
      for(const [mutate,restore]of [
        ['GRANT CREATE ON SCHEMA public TO anon','REVOKE CREATE ON SCHEMA public FROM anon'],
        ['GRANT USAGE ON SCHEMA public TO hmt1_alien','REVOKE USAGE ON SCHEMA public FROM hmt1_alien'],
      ]) {
        await db.bootstrap.query(mutate!)
        await withCleanup(()=>refusal(install,'P7902'),async()=>{await db.bootstrap.query(restore!)})
      }
      for(const [mutate,restore]of [
        ['ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO hmt1_alien','ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM hmt1_alien'],
        ['ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO hmt1_alien','ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM hmt1_alien'],
        ['ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role WITH GRANT OPTION','ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE GRANT OPTION FOR EXECUTE ON FUNCTIONS FROM service_role'],
      ]) {
        await db.installer.query(mutate!)
        await withCleanup(()=>refusal(install,'P7902'),async()=>{await db.installer.query(restore!)})
      }
      // Deliberate bootstrap-owned catalog corruption: a foreign grantor is
      // not a creator-known right and must not be silently revoked/adopted.
      const defaults=(await db.bootstrap.query("SELECT defaclacl::text AS acl FROM pg_default_acl WHERE defaclrole='postgres'::regrole AND defaclnamespace=2200 AND defaclobjtype='f'"))[0]?.acl
      assert.ok(defaults)
      await db.bootstrap.query("UPDATE pg_default_acl SET defaclacl=ARRAY['postgres=X/postgres','service_role=X/hmt1_alien']::aclitem[] WHERE defaclrole='postgres'::regrole AND defaclnamespace=2200 AND defaclobjtype='f'")
      await withCleanup(()=>refusal(install,'P7902'),async()=>{
        await db.bootstrap.query("UPDATE pg_default_acl SET defaclacl=$1::aclitem[] WHERE defaclrole='postgres'::regrole AND defaclnamespace=2200 AND defaclobjtype='f'",[pgText(defaults)])
      })
      for(const [create,drop]of [
        ["CREATE FUNCTION public.official_v3_method_stage_draft_v1() RETURNS integer LANGUAGE sql RETURN 1",'DROP FUNCTION public.official_v3_method_stage_draft_v1() RESTRICT'],
        ["CREATE PROCEDURE public.official_v3_method_approve_v1(p boolean) LANGUAGE sql AS 'SELECT 1'",'DROP PROCEDURE public.official_v3_method_approve_v1(boolean) RESTRICT'],
      ]) {
        await db.installer.query(create!)
        await withCleanup(()=>refusal(install,'P7904'),async()=>{await db.installer.query(drop!)})
      }
      await db.installer.query('GRANT EXECUTE ON FUNCTION jetnity_ot_auth.require_current_owner_session_v1() TO authenticated')
      await withCleanup(()=>refusal(install,'P7703'),async()=>{await db.installer.query('REVOKE EXECUTE ON FUNCTION jetnity_ot_auth.require_current_owner_session_v1() FROM authenticated')})
      await db.installer.query('ALTER FUNCTION official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer) SET search_path=public')
      await withCleanup(()=>refusal(install,'P7505'),async()=>{await db.installer.query('ALTER FUNCTION official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer) SET search_path=pg_catalog')})
      await db.bootstrap.query('GRANT authenticated TO anon')
      await withCleanup(()=>refusal(install,'P7505'),async()=>{await db.bootstrap.query('REVOKE authenticated FROM anon')})
      const originAt=install.indexOf('DO $hmt1_new_acl_origin$')
      assert.ok(originAt>0);assert.equal(install.indexOf('DO $hmt1_new_acl_origin$',originAt+1),-1)
      const clean=await db.snapshot()
      await withCleanup(async()=>{
        await db.installer.query(install.slice(0,originAt))
        await db.installer.query('GRANT EXECUTE ON FUNCTION '+WRAPPERS[0]!.signature+' TO hmt1_alien')
        await assert.rejects(db.installer.query(install.slice(originAt)),code('P7902'))
      },async()=>{await db.installer.query('ROLLBACK')})
      assert.deepEqual(await db.snapshot(),clean)
      assert.deepEqual(await db.prerequisiteSnapshot(),untouched)
      assert.equal(await db.functionOids(),null)
      await transaction(db.installer,install)
      await db.installer.query("SET search_path=pg_catalog")
      await db.installer.query(block(install,'hmt1_exact_inventory'))
      assert.deepEqual(await db.prerequisiteSnapshot(),untouched)
      return {actualVersion:db.version,creator:db.profile,hostileScenarios:15,atomicRefusals:true}
    })
    await group('HMT1-02 exact four invokers dependencies ACLs NULL forwarding and private denials',async()=>{
      await db.installer.query(block(install,'hmt1_exact_inventory'))
      const metadata=await db.bootstrap.query("SELECT p.proname,p.pronargs::text,p.prosecdef::text,p.proisstrict::text,p.provolatile::text,p.proparallel::text,(p.prosqlbody IS NOT NULL)::text AS parsed,"
        +"(SELECT count(*)::text FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid) AS direct_dependencies "
        +"FROM pg_proc p WHERE p.pronamespace=2200 AND p.proname IN ("+NAMES+") ORDER BY p.proname")
      assert.equal(metadata.length,4)
      for(const row of metadata){assert.equal(row.prosecdef,'false');assert.equal(row.proisstrict,'false');assert.equal(row.provolatile,'v');assert.equal(row.proparallel,'u');assert.equal(row.parsed,'true');assert.equal(row.direct_dependencies,'2')}
      const before=await db.fullHistory()
      for(const [index,wrapper]of WRAPPERS.entries())await assert.rejects(db.call(sql(index),wrapper.args.map(()=>null)),code('P7501'))
      const human=await db.human()
      try{
        for(const query of [
          'SELECT * FROM official_v3_method_private.revisions_v1',
          'SELECT * FROM official_v3_method_private.heads_v1',
          'SELECT * FROM official_v3_method_private.operations_v1',
          'SELECT jetnity_ot_auth.require_current_owner_session_v1()',
          "SELECT official_v3_method_private.tuple_valid_v1('aa',1,repeat('a',64),repeat('b',64))",
        ])await assert.rejects(human.query(query),code('42501'))
      }finally{human.close()}
      for(const [login,role]of [[LOGIN.anon,'anon'],[LOGIN.service,'service_role']] as const){
        const caller=await db.connect(login,role)
        try{for(const [index,wrapper]of WRAPPERS.entries())await assert.rejects(caller.query(sql(index),values(wrapper.args.map(()=>null))),code('42501'))}
        finally{caller.close()}
      }
      assert.deepEqual(await db.fullHistory(),before)
      return {metadata,allFourNullCallsReachedUnderlyingValidation:true,directPrivateAccessDenied:true,anonAndServiceDenied:true}
    })
    await group('HMT1-03 unused-only recovery exact identities external acknowledgements and late writer',async()=>{
      await db.bindRecovery()
      for(const [name,value]of [
        ['jetnity.hmt1_recovery_context','unproved'],
        ['jetnity.hmt1_original_oids','[1,2,3,4]'],
        ['jetnity.hmt1_quiescence_receipt',''],
        ['jetnity.hmt1_quiescence_until','2000-01-01T00:00:00Z'],
      ]){
        await db.installer.query("SELECT set_config($1,$2,false)",[pgText(name!),pgText(value!)])
        await refusal(recovery,'P7905');await db.bindRecovery()
      }
      await db.installer.query('ALTER FUNCTION '+WRAPPERS[0]!.signature+' STRICT')
      await withCleanup(()=>refusal(recovery,'P7903'),async()=>{await db.installer.query('ALTER FUNCTION '+WRAPPERS[0]!.signature+' CALLED ON NULL INPUT')})
      await db.installer.query('GRANT EXECUTE ON FUNCTION '+WRAPPERS[0]!.signature+' TO PUBLIC')
      await withCleanup(()=>refusal(recovery,'P7903'),async()=>{await db.installer.query('REVOKE EXECUTE ON FUNCTION '+WRAPPERS[0]!.signature+' FROM PUBLIC')})
      await db.installer.query("CREATE FUNCTION public.hmt1_foreign_dependent() RETURNS jsonb LANGUAGE sql RETURN public.official_v3_method_stage_draft_v1(NULL::text,NULL::text,NULL::integer,NULL::text,NULL::text,NULL::integer)")
      await withCleanup(()=>refusal(recovery,'P7903'),async()=>{await db.installer.query('DROP FUNCTION public.hmt1_foreign_dependent() RESTRICT')})
      const originalOids=await db.functionOids();assert.ok(originalOids)
      const unchanged=await db.prerequisiteSnapshot()
      assert.deepEqual(await db.history(),[{revisions:'0',heads:'0',operations:'0'}])
      await transaction(db.installer,recovery)
      assert.equal(await db.functionOids(),null)
      assert.deepEqual(await db.prerequisiteSnapshot(),unchanged)
      await refusal(recovery,'P7903')
      await transaction(db.installer,install)
      const freshOids=await db.functionOids();assert.ok(freshOids);assert.notEqual(freshOids,originalOids)
      await db.bindRecovery(originalOids);await refusal(recovery,'P7905');await db.bindRecovery()
      const boundary='LOCK TABLE official_v3_method_private.revisions_v1,official_v3_method_private.heads_v1,\n'
        +'  official_v3_method_private.operations_v1 IN ACCESS EXCLUSIVE MODE;'
      const at=recovery.indexOf(boundary);assert.ok(at>0);assert.equal(recovery.indexOf(boundary,at+boundary.length),-1)
      const prefix=recovery.slice(0,at),suffix=recovery.slice(at+boundary.length)
      assert.equal(prefix+boundary+suffix,recovery)
      const writer=await db.human(),binding=ma1SyntheticTuple('hmt1-late-writer'),operation=db.op()
      let pending:ReturnType<typeof observe<PgRows>>|undefined
      let evidence:Record<string,unknown>|undefined
      await db.installer.query('SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL REPEATABLE READ')
      await withCleanup(async()=>{
        await db.installer.query(prefix)
        const isolation=(await db.installer.query("SELECT current_setting('default_transaction_isolation') AS session_default,current_setting('transaction_isolation') AS selected,pg_current_snapshot()::text AS snapshot"))[0]
        assert.equal(isolation?.session_default,'repeatable read');assert.equal(isolation?.selected,'read committed');assert.ok(isolation?.snapshot)
        await writer.query('BEGIN')
        const staged=acknowledgment(await writer.query(STAGE,values(stageValues(operation,binding))))
        assert.equal(staged.status,'recorded');assert.equal(staged.actorId,AUTH.owner)
        const xid=(await writer.query('SELECT pg_current_xact_id()::text AS xid'))[0]?.xid;assert.ok(xid)
        pending=observe(db.installer.query(boundary))
        await waitBlocked(db,lifetime,db.installer,writer,pending.settled,boundary)
        await writer.query('COMMIT')
        const lockResult=await pending.result;assert.equal(lockResult.ok,true)
        assert.deepEqual(await db.bootstrap.query('SELECT pg_visible_in_snapshot($1::xid8,$2::pg_snapshot)::text AS visible',[pgText(xid),pgText(isolation.snapshot)]),[{visible:'false'}])
        // This observation uses the lock-owning installer; a separate backend
        // would block on ACCESS EXCLUSIVE. Final retention is independently
        // compared through bootstrap only after the candidate rolls back.
        const retained=await db.fullHistory(db.installer),catalog=await db.snapshot()
        assert.deepEqual(await db.history(db.installer),[{revisions:'1',heads:'0',operations:'1'}])
        await assert.rejects(transaction(db.installer,suffix),code('P7905'))
        assert.deepEqual(await db.fullHistory(),retained);assert.deepEqual(await db.snapshot(),catalog)
        assert.deepEqual(await db.prerequisiteSnapshot(),unchanged)
        evidence={sessionDefault:isolation.session_default,selected:isolation.selected,preLockSnapshot:isolation.snapshot,writerXid:xid,
          actualIdentifiedWait:true,commitThenFreshHistoryRefusal:'P7905',historyRetained:true,syntheticQuiescenceAcknowledgementWasDeliberatelyViolated:true}
      },async()=>{
        await writer.query('ROLLBACK');writer.close()
        if(pending)await lifetime.drain([pending.result])
        await db.installer.query('ROLLBACK')
        await db.installer.query('SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL READ COMMITTED')
      })
      assert.ok(evidence)
      return {unusedRemoval:true,oldOidRefusal:true,missingObjectRefusal:true,foreignDependencyRefusal:true,unchangedHmaAndPg1:true,lateWriter:evidence}
    })

    await group('HMT1-04 synthetic Owner lifecycle separate exact confirmations and immutable retries',async()=>{
      const binding=ma1SyntheticTuple('hmt1-lifecycle'),stageOp=db.op(),approveOp=db.op(),revokeOp=db.op()
      const before=await db.history()
      const staged=acknowledgment(await db.call(STAGE,stageValues(stageOp,binding)))
      assert.equal(staged.status,'recorded');assert.equal(staged.actorId,AUTH.owner);assert.equal(staged.operationId,stageOp)
      assert.deepEqual(staged.command,expectedStage(stageOp,binding))
      const stagedReadback=acknowledgment(await db.call(CONFIRM,confirmStage(stageOp,binding)))
      assert.deepEqual(stagedReadback,staged)
      const approveValues:readonly Scalar[]=[approveOp,binding.methodId,1,binding.methodDigest,binding.packageDigest,null,null,null,0,null,'until_revoked',null]
      const approveConfirmation:readonly Scalar[]=[approveOp,'approve',binding.methodId,1,binding.methodDigest,binding.packageDigest,null,null,null,null,0,null,'until_revoked',null]
      const approved=acknowledgment(await db.call(APPROVE,approveValues))
      assert.equal(approved.status,'recorded');assert.equal(approved.actorId,AUTH.owner);assert.equal(approved.action,'approve')
      assert.equal(approved.after?.status,'approved');assert.equal(approved.after?.epoch,1)
      assert.deepEqual(approved.command,{schema:1,operationId:approveOp,action:'approve',methodId:binding.methodId,revision:1,
        methodDigest:binding.methodDigest,packageDigest:binding.packageDigest,predecessorRevision:null,
        expected:{revision:null,methodDigest:null,packageDigest:null,epoch:0,status:null},approval:{mode:'until_revoked',until:null}})
      assert.deepEqual(acknowledgment(await db.call(CONFIRM,approveConfirmation)),approved)
      const revokeValues:readonly Scalar[]=[revokeOp,binding.methodId,1,binding.methodDigest,binding.packageDigest,1]
      const revokeConfirmation:readonly Scalar[]=[revokeOp,'revoke',binding.methodId,1,binding.methodDigest,binding.packageDigest,null,1,binding.methodDigest,binding.packageDigest,1,'approved',null,null]
      const revoked=acknowledgment(await db.call(REVOKE,revokeValues))
      assert.equal(revoked.status,'recorded');assert.equal(revoked.actorId,AUTH.owner);assert.equal(revoked.action,'revoke')
      assert.equal(revoked.after?.status,'revoked');assert.equal(revoked.after?.epoch,2)
      assert.deepEqual(revoked.command,{schema:1,operationId:revokeOp,action:'revoke',methodId:binding.methodId,revision:1,
        methodDigest:binding.methodDigest,packageDigest:binding.packageDigest,predecessorRevision:null,
        expected:{revision:1,methodDigest:binding.methodDigest,packageDigest:binding.packageDigest,epoch:1,status:'approved'},approval:null})
      assert.deepEqual(acknowledgment(await db.call(CONFIRM,revokeConfirmation)),revoked)
      const retained=await db.fullHistory()
      assert.deepEqual(acknowledgment(await db.call(STAGE,stageValues(stageOp,binding))),staged)
      assert.deepEqual(acknowledgment(await db.call(APPROVE,approveValues)),approved)
      assert.deepEqual(acknowledgment(await db.call(REVOKE,revokeValues)),revoked)
      await assert.rejects(db.call(STAGE,stageValues(stageOp,ma1SyntheticTuple('hmt1-id-collision'))),code('P7502'))
      await assert.rejects(db.call(STAGE,stageValues(db.op(),{...binding,methodDigest:'c'.repeat(64)})),code('P7502'))
      await assert.rejects(db.call(CONFIRM,confirmStage(stageOp,binding),claims({sub:AUTH.other,session_id:AUTH.foreign})),code('P7502'))
      await assert.rejects(db.bootstrap.query("UPDATE official_v3_method_private.revisions_v1 SET method_digest=repeat('c',64) WHERE method_id=$1",[pgText(binding.methodId)]),code('P7508'))
      assert.deepEqual(await db.fullHistory(),retained)
      const after=await db.history()
      assert.equal(Number(after[0]!.revisions),Number(before[0]!.revisions)+1)
      assert.equal(Number(after[0]!.heads),Number(before[0]!.heads)+1)
      assert.equal(Number(after[0]!.operations),Number(before[0]!.operations)+3)
      await db.bindRecovery();await refusal(recovery,'P7905')
      return {separateFreshPrincipalConfirmations:3,actor:AUTH.owner,exactStoredCommandTuples:true,exactRetries:3,
        conflictingOperationAndActorDenied:true,immutableRevisionDenied:true,nullableFieldsForwarded:true,retainedHistory:after}
    })
    await group('HMT1-05 invalid claims current sessions AAL1 and non-Owners never create history',async()=>{
      const before=await db.fullHistory()
      for(const [query,items]of negativeOperations(db.op(),ma1SyntheticTuple('hmt1-no-claim'))){
        const noClaim=await db.connect(LOGIN.human,'authenticated')
        try{await assert.rejects(noClaim.query(query,values(items)),code('42501'))}finally{noClaim.close()}
      }
      const negatives:readonly unknown[]=[
        {},null,[],claims({role:'service_role'}),claims({aal:'aal1'}),claims({session_id:'invalid'}),
        claims({session_id:AUTH.foreign}),claims({sub:AUTH.other}),claims({sub:'invalid'}),
        claims({exp:0}),claims({exp:'9999999999'}),
      ]
      for(const [index,value]of negatives.entries()){
        for(const [query,items]of negativeOperations(db.op(),ma1SyntheticTuple('hmt1-claim-'+index)))await assert.rejects(db.call(query,items,value),code('42501'))
        assert.deepEqual(await db.fullHistory(),before)
      }
      for(const [query,items]of negativeOperations(db.op(),ma1SyntheticTuple('hmt1-malformed'))){
        const malformed=await db.human()
        try{
          await malformed.query("SELECT set_config('request.jwt.claims','{invalid-json',false)")
          await assert.rejects(malformed.query(query,values(items)),code('22P02'))
        }finally{malformed.close()}
      }
      const changes=[
        "UPDATE auth.sessions SET not_after=clock_timestamp() WHERE id='"+AUTH.session+"'",
        "DELETE FROM auth.sessions WHERE id='"+AUTH.session+"'",
        "UPDATE auth.sessions SET aal='aal1' WHERE id='"+AUTH.session+"'",
        "UPDATE auth.sessions SET user_id='"+AUTH.other+"' WHERE id='"+AUTH.session+"'",
        "UPDATE public.profiles SET role='admin' WHERE user_id='"+AUTH.owner+"'",
        "UPDATE public.profiles SET status='disabled' WHERE user_id='"+AUTH.owner+"'",
        "UPDATE auth.users SET deleted_at=clock_timestamp() WHERE id='"+AUTH.owner+"'",
        "UPDATE auth.users SET is_anonymous=true WHERE id='"+AUTH.owner+"'",
      ]
      await withCleanup(async()=>{
        for(const [index,change]of changes.entries()){
          await resetHumans(db.bootstrap);await db.bootstrap.query(change)
          for(const [query,items]of negativeOperations(db.op(),ma1SyntheticTuple('hmt1-state-'+index)))await assert.rejects(db.call(query,items),code('42501'))
          assert.deepEqual(await db.fullHistory(),before)
        }
      },()=>resetHumans(db.bootstrap))
      assert.deepEqual(await db.fullHistory(),before)
      return {noClaimDenied:true,malformedJsonDenied:true,claimCases:negatives.length,currentStateCases:changes.length,eachCaseExercisesAllFourWrappers:true,historyUnchanged:true}
    })
    await group('HMT1-06 real method lock wait then fresh session and authority refusal',async()=>{
      const before=await db.fullHistory(),holder=await db.connect()
      const evidence:unknown[]=[]
      await withCleanup(async()=>{
        for(const kind of ['expired-session','disabled-profile'] as const){
          await resetHumans(db.bootstrap)
          const caller=await db.human(),binding=ma1SyntheticTuple('hmt1-wait-'+kind)
          let pending:ReturnType<typeof observe<PgRows>>|undefined
          await withCleanup(async()=>{
            await holder.query('BEGIN')
            await holder.query('SELECT pg_advisory_xact_lock(750102,hashtext($1::text))',[pgText(binding.methodId)])
            pending=observe(caller.query(STAGE,values(stageValues(db.op(),binding))))
            await waitBlocked(db,lifetime,caller,holder,pending.settled,STAGE)
            const id=db.identities.get(caller)!
            const began=(await db.observer.query('SELECT query_start::text AS began FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',[pgText(id.pid,23),pgText(id.birth)]))[0]?.began
            assert.ok(began)
            let expiry:string|undefined
            if(kind==='expired-session'){
              expiry=(await db.bootstrap.query("UPDATE auth.sessions SET not_after=clock_timestamp() WHERE id='"+AUTH.session+"' RETURNING not_after::text AS expired"))[0]?.expired??undefined
              assert.ok(expiry)
              assert.deepEqual(await db.bootstrap.query('SELECT ($1::timestamptz<$2::timestamptz)::text AS changed_after_start,(clock_timestamp()>$2::timestamptz)::text AS expired_now',[pgText(began),pgText(expiry)]),
                [{changed_after_start:'true',expired_now:'true'}])
            }else await db.bootstrap.query("UPDATE public.profiles SET status='disabled' WHERE user_id='"+AUTH.owner+"'")
            await holder.query('ROLLBACK')
            const result=await pending.result
            assert.equal(result.ok,false)
            if(result.ok)assert.fail('changed authority admitted after actual method wait')
            assert.ok(code('42501')(result.error))
            assert.deepEqual(await db.fullHistory(),before)
            evidence.push({kind,actualWaitObserved:true,began,expiry:expiry??null,freshRefusal:'42501'})
          },async()=>{
            await holder.query('ROLLBACK')
            if(pending)await lifetime.drain([pending.result])
            caller.close()
          })
        }
      },async()=>{holder.close();await resetHumans(db.bootstrap)})
      return {cases:evidence,historyUnchanged:true}
    })
    await group('HMT1-07 transaction and response loss require independent matching confirmation',async()=>{
      const before=await db.fullHistory()
      const writer=await db.human(),binding=ma1SyntheticTuple('hmt1-uncommitted-loss'),operation=db.op()
      await writer.query('BEGIN')
      const provisional=acknowledgment(await writer.query(STAGE,values(stageValues(operation,binding))))
      assert.equal(provisional.status,'recorded')
      assert.deepEqual(await db.fullHistory(),before,'an uncommitted local response is not stored confirmation')
      const id=db.identities.get(writer)!
      assert.deepEqual(await db.bootstrap.query('SELECT pg_terminate_backend(a.pid,1000)::text AS terminated FROM pg_stat_activity a WHERE a.pid=$1::integer AND a.backend_start=$2::timestamptz',
        [pgText(id.pid,23),pgText(id.birth)]),[{terminated:'true'}])
      writer.close()
      await waitUntil(lifetime,async()=>(await db.observer.query('SELECT pid::text FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',[pgText(id.pid,23),pgText(id.birth)])).length===0,'lost transaction backend remains')
      const absent=acknowledgment(await db.call(CONFIRM,confirmStage(operation,binding)))
      assert.deepEqual(absent,{status:'absent',operationId:operation})
      assert.deepEqual(await db.fullHistory(),before)

      // Actual COMMIT followed by a server-side response-completion pause.
      // Observe that exact owned backend in the pause, then terminate it. The
      // shared wire may truthfully preserve CommandComplete(COMMIT); neither
      // that outcome nor the connection loss substitutes for separate readback.
      const lossy=await db.human(),lossBinding=ma1SyntheticTuple('hmt1-response-loss'),lossOp=db.op()
      await lossy.query('BEGIN')
      assert.equal(acknowledgment(await lossy.query(STAGE,values(stageValues(lossOp,lossBinding)))).status,'recorded')
      const lossQuery='COMMIT;SELECT pg_catalog.pg_sleep(25)'
      const commit=observe(lossy.query(lossQuery))
      const lossId=db.identities.get(lossy)!
      await waitUntil(lifetime,async()=>{
        const rows=await db.observer.query('SELECT state,wait_event,query FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',[pgText(lossId.pid,23),pgText(lossId.birth)])
        return !commit.settled()&&rows.length===1&&rows[0]!.state==='active'&&rows[0]!.wait_event==='PgSleep'&&rows[0]!.query===lossQuery
      },'post-COMMIT response-completion pause not observed')
      assert.deepEqual(await db.bootstrap.query('SELECT pg_terminate_backend(a.pid,1000)::text AS terminated FROM pg_stat_activity a WHERE a.pid=$1::integer AND a.backend_start=$2::timestamptz',[pgText(lossId.pid,23),pgText(lossId.birth)]),[{terminated:'true'}])
      lossy.close()
      const [joined]=await lifetime.drain([commit.result]);assert.equal(joined?.status,'fulfilled')
      const commitOutcome=await commit.result
      await waitUntil(lifetime,async()=>(await db.observer.query('SELECT pid::text FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',[pgText(lossId.pid,23),pgText(lossId.birth)])).length===0,'lossy backend remains')
      const confirmed=acknowledgment(await db.call(CONFIRM,confirmStage(lossOp,lossBinding)))
      assert.equal(confirmed.status,'recorded','separate confirmation must find the commit observed before server-side response loss')
      const stored=await db.bootstrap.query('SELECT command::text,actor_id::text FROM official_v3_method_private.operations_v1 WHERE operation_id=$1',[pgText(lossOp)])
      assert.equal(stored.length,confirmed.status==='recorded'?1:0)
      if(confirmed.status==='recorded'){
        assert.equal(confirmed.actorId,AUTH.owner);assert.deepEqual(confirmed.command,expectedStage(lossOp,lossBinding))
        assert.equal(stored[0]!.actor_id,AUTH.owner);assert.deepEqual(JSON.parse(stored[0]!.command!),confirmed.command)
      }

      // Actual stored mutation followed by unavailable signed-authority analogue:
      // denial of the independent readback stays UNKNOWN to that caller. This
      // synthetic fixture does not equate bootstrap inspection with user proof.
      const unknownBinding=ma1SyntheticTuple('hmt1-unknown'),unknownOp=db.op()
      await db.call(STAGE,stageValues(unknownOp,unknownBinding))
      await db.bootstrap.query("UPDATE auth.sessions SET not_after=clock_timestamp() WHERE id='"+AUTH.session+"'")
      let resultForCaller:'UNKNOWN'|'CONFIRMED'='UNKNOWN',denied=false
      await withCleanup(async()=>{
        try{
          const result=acknowledgment(await db.call(CONFIRM,confirmStage(unknownOp,unknownBinding)))
          if(result.status==='recorded')resultForCaller='CONFIRMED'
        }catch(error){if(!code('42501')(error))throw error;denied=true}
        assert.equal(denied,true);assert.equal(resultForCaller,'UNKNOWN')
      },()=>resetHumans(db.bootstrap))
      return {uncommittedResponseWasNotCommit:true,terminatedOriginalBackend:true,missingTransactionConfirmedAbsent:true,
        actualPostCommitResponseLoss:true,originalCommitJoined:true,wireCompletionObserved:commitOutcome.ok,
        separateStoredConfirmation:confirmed.status,authorityUnavailableReadback:resultForCaller,syntheticOnly:true}
    })
    await group('HMT1-08 actual effect failure abort timeout and shared terminal ownership',async()=>{
      const failureWitness=await cleanupWitness(lifetime,'failure')
      const timeoutWitness=await cleanupWitness(lifetime,'timeout')
      await db.installer.query(block(install,'pg1_exact_inventory'))
      await db.installer.query(block(install,'ma1_exact_boundary'))
      await db.installer.query(block(install,'hma1_exact_identity'))
      await db.installer.query(block(install,'hmt1_exact_inventory'))
      assert.deepEqual(await db.prerequisiteSnapshot(),untouched)
      assert.deepEqual(await db.bootstrap.query('SELECT id::text,value FROM public.hmt1_unrelated_marker'),[{id:'1',value:'retained-hmt1-fixture'}])
      await db.bindRecovery();await refusal(recovery,'P7905')
      return {failureWitness,timeoutWitness,sharedLifetime:true,maximumClusters:3,terminalReceiptFollowsUnconditionalDisposal:true}
    })
    assert.equal(completed.length,8)
  }catch(error){failed=true;failure=error}
  finally{
    effectEnded=performance.now();clearTimeout(timer)
    // First cleanup action is unconditional ONE-lifetime disposal. Its fixed
    // total drain owns every query, startup, wire helper, observer and cluster.
    try{
      terminal=await lifetime.dispose()
      assert.equal(terminal.pending,0);assert.equal(terminal.started,terminal.settled)
      assert.equal(terminal.connections,terminal.closed);assert.ok(terminal.connections<=160)
      assert.ok(terminal.stoppedClusters<=3)
      if(completed.length===8)assert.equal(terminal.stoppedClusters,3)
      if(cluster)assert.equal(existsSync(cluster.root),false)
    }catch(error){failure=failed?new AggregateError([failure,error],'hmt1 primary and terminal cleanup failed'):error;failed=true}
    cleanupEnded=performance.now()
  }
  if(effectEnded-started>EFFECT_MS||cleanupEnded-effectEnded>DRAIN_MS){
    const budgetError=Error('hmt1 selected effect or total cleanup limit exceeded')
    failure=failed?new AggregateError([failure,budgetError],'hmt1 failure and budget exceeded'):budgetError;failed=true
  }
  const receipt={
    schema:'jetnity.hmt1.native.v1',status:failed?'failed':'passed',syntheticOnly:true,
    hostedInstall:false,signedJwtOrHttpProof:false,methodApprovalIsSynthetic:true,
    actualVersion:f?.version??null,creator:f?.profile??null,
    source:Object.fromEntries(SOURCE_PINS),actualNativeSha256:actualNativeHash,completed,groups:groupEvidence,
    effectLimitMs:EFFECT_MS,totalDrainLimitMs:DRAIN_MS,wrapperLimitMs:240_000,fixtureConnectionLimit:CONNECTION_LIMIT,totalConnectionLimit:160,
    effectMs:Math.ceil(effectEnded-started),cleanupMs:Math.ceil(cleanupEnded-effectEnded),elapsedMs:Math.ceil(cleanupEnded-started),
    terminal:terminal??null,failure:failed?(failure instanceof Error?{name:failure.name,message:failure.message.slice(0,400)}:{type:typeof failure,value:String(failure).slice(0,400)}):null,
  }
  assert.ok(Buffer.byteLength(JSON.stringify(receipt))<32768,'bounded receipt exceeded')
  t.diagnostic('HMT1_NATIVE_RECEIPT '+JSON.stringify(receipt))
  if(failed)throw failure
}
