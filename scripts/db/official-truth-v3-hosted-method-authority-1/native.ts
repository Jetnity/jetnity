// HMA1 mandatory owned native proof. Synthetic only; never a hosted installer.
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
const SOURCE_PINS = Object.freeze([
  [
    "./install-candidate.sql",
    "edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0"
  ],
  [
    "./recovery-candidate.sql",
    "c445fb4eff4a76e75162f5698fc3a7a6942e2775f82929e42639e25308843f1a"
  ],
  [
    "../official-truth-v3-private-owner-guards-1/install-candidate.sql",
    "3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2"
  ],
  [
    "../official-truth-v3-method-authority-1/method-candidate.sql",
    "269c8567da63014c3aa80905aa0773afa4203778985b44ad84fea48d0f24eee6"
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
  ]
] as const)
const FUNCTION_PINS = Object.freeze([
  {
    "name": "official_v3_method_private.tuple_valid_v1",
    "signature": "official_v3_method_private.tuple_valid_v1(text,integer,text,text)",
    "bytes": 440,
    "sha256": "30a147ddffeec98fdd573804962e9692de08e5c11ce9fbf96def1776542a7990",
    "bodyBytes": 193,
    "bodySha256": "15741698f4f66adb08e23694b15c6bb9d071b8c01e1123ba7087c4c3d50c6662"
  },
  {
    "name": "official_v3_method_private.timestamp_v1",
    "signature": "official_v3_method_private.timestamp_v1(text)",
    "bytes": 958,
    "sha256": "cf0b10a86d6ecf27fdc44dcf06eac984bea97b1d8e5a0487732000daa168e240",
    "bodyBytes": 775,
    "bodySha256": "35e5ada766b2b82bc585d403725c2232ffb4c28b3395d9623797a873413cefb1"
  },
  {
    "name": "official_v3_method_private.command_v1",
    "signature": "official_v3_method_private.command_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)",
    "bytes": 3970,
    "sha256": "790f7f2d893f7b118e6b32cbe75997f4b7bf41271a649ea76d03c71d59619fa0",
    "bodyBytes": 3471,
    "bodySha256": "ef0a7fe89cd5bc2d15a40f8ec01ab1dd2bc2f7d6f64498409e9485761597561b"
  },
  {
    "name": "official_v3_method_private.immutable_v1",
    "signature": "official_v3_method_private.immutable_v1()",
    "bytes": 242,
    "sha256": "f7fd73d27f9da70c76e3e96530c8ef67357144bc71021ac05d5e33e91c8e4c59",
    "bodyBytes": 74,
    "bodySha256": "2a4782a3ca5e568a170743800ad36ea5c8c0a6b926c7524acfe9718c74ffe3a4"
  },
  {
    "name": "official_v3_method_api.confirm_operation_v1",
    "signature": "official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)",
    "bytes": 2599,
    "sha256": "08388ed8d6375c1a6f97374ca16647d002b7245ded117e491fd1d751f6e272fa",
    "bodyBytes": 2093,
    "bodySha256": "232cdcfb8c10161336d2755a83c2a941dd3a582b235515b01f7d6c167579078b"
  },
  {
    "name": "official_v3_method_api.stage_draft_v1",
    "signature": "official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)",
    "bytes": 2758,
    "sha256": "249f59a5fc066d0ac79a4e99de020e082cfa984c0d8f47d7aac5928d0dc4a4c9",
    "bodyBytes": 2461,
    "bodySha256": "947d017cbc27e70a1df22ecbd19214e295d5162f371e00c8d040076e5a168c90"
  },
  {
    "name": "official_v3_method_api.approve_v1",
    "signature": "official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)",
    "bytes": 4559,
    "sha256": "8b62c0285e86cb5aba3162ee6c48f38b1d41fbef910cc4855d49ccaa925bbfbd",
    "bodyBytes": 4111,
    "bodySha256": "df1a49cd377c135460f3e3691303bbe527c4b3fc4e293b486a85ea5b8b1a3f49"
  },
  {
    "name": "official_v3_method_api.revoke_v1",
    "signature": "official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)",
    "bytes": 2871,
    "sha256": "cd388f9d65356fc265e3b07a42048af6aa14a0efbaae52d33db428d3f3a49e37",
    "bodyBytes": 2585,
    "bodySha256": "c6296c4a05ee52b32cdcf6145007dc5b8c3fd6867cf155e500b8bc27f738772f"
  },
  {
    "name": "official_v3_method_api.read_current_v1",
    "signature": "official_v3_method_api.read_current_v1(text,integer,text,text,text)",
    "bytes": 2484,
    "sha256": "28b35822204af378a1c0cb8a4bc86b6ca08849be66d7bb3f4f301fa16dc0a24a",
    "bodyBytes": 2041,
    "bodySha256": "e5688f6912d6ac5098d3826001386e19e163bf3df16ae3d7503a0ab18bb48de2"
  },
  {
    "name": "official_v3_method_private.require_current_locked_v1",
    "signature": "official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)",
    "bytes": 1270,
    "sha256": "d79042c67e670ea0716ab63dca57278042d89d43fbf72d516f5e0141b7b9b5a2",
    "bodyBytes": 994,
    "bodySha256": "7e98f2a32a2388efde95d729d425581bf9443e4397eb8311d82e6a46eb88ca8c"
  }
] as const)
// Exact helper body references from Root receipt 6816048537, not hosted Auth proof.
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
  assert.equal(digest(bytes), pin[1], 'source drift requires review')
  return bytes.toString('utf8')
}
const install = source('./install-candidate.sql')
const recovery = source('./recovery-candidate.sql')
const pg1 = source('../official-truth-v3-private-owner-guards-1/install-candidate.sql')
const original = source('../official-truth-v3-method-authority-1/method-candidate.sql')
function block(text: string, label: string): string {
  const opening = 'DO $' + label + '$', closing = '$' + label + '$;'
  const start = text.indexOf(opening), end = text.indexOf(closing, start)
  assert.ok(start >= 0 && end > start, 'bounded source block missing')
  assert.equal(text.indexOf(opening, start + opening.length), -1)
  assert.equal(text.indexOf(closing, end + closing.length), -1)
  return text.slice(start, end + closing.length)
}
function functionDeclaration(text: string, name: string): string {
  const marker = 'CREATE FUNCTION ' + name + '('
  const start = text.indexOf(marker), end = text.indexOf('$$;', start)
  assert.ok(start >= 0 && end > start)
  assert.equal(text.indexOf(marker, start + marker.length), -1)
  return text.slice(start, end + 3)
}
function assertOriginalDeclarations(): void {
  assert.equal(install.split('CREATE FUNCTION ').length - 1, 10)
  assert.equal(original.split('CREATE FUNCTION ').length - 1, 10)
  for (const pin of FUNCTION_PINS) {
    const before = functionDeclaration(original, pin.name), after = functionDeclaration(install, pin.name)
    assert.equal(after, before, pin.name)
    assert.equal(Buffer.byteLength(after), pin.bytes); assert.equal(digest(after), pin.sha256)
    const body = after.slice(after.indexOf('AS $$') + 5, -3)
    assert.equal(Buffer.byteLength(body), pin.bodyBytes); assert.equal(digest(body), pin.bodySha256)
  }
  assert.equal(block(install, 'ma1_exact_boundary'), block(recovery, 'ma1_exact_boundary'))
  assert.equal(block(install, 'hma1_exact_identity'), block(recovery, 'hma1_exact_identity'))
  assert.equal(block(install, 'pg1_exact_inventory'), block(pg1, 'pg1_exact_inventory'))
}
const AUTH = Object.freeze({
  owner: '11111111-1111-4111-8111-111111111111', other: '22222222-2222-4222-8222-222222222222',
  session: '55555555-5555-4555-8555-555555555555', foreign: '66666666-6666-4666-8666-666666666666',
})
const LOGIN = Object.freeze({ human: 'hma1_human', reader: 'hma1_reader', anon: 'hma1_anon', service: 'hma1_service' })
const claims = (change: Readonly<Record<string, unknown>> = {}) => ({
  sub: AUTH.owner, session_id: AUTH.session, role: 'authenticated', aal: 'aal2',
  exp: Math.floor(Date.now() / 1000) + 300, ...change,
})
const code = (state: string) => (error: unknown) => error instanceof LocalPgError && error.code === state
const values = (items: readonly (string | number | null)[]) => items.map(x => pgText(x === null ? '' : String(x)))
const args = (types: readonly ('text' | 'integer')[]) => types.map((type, i) =>
  "NULLIF($" + (i + 1) + "::text,'')" + (type === 'integer' ? '::integer' : '')).join(',')
const STAGE = 'SELECT official_v3_method_api.stage_draft_v1(' + args(['text','text','integer','text','text','integer']) + ') AS result'
const APPROVE = 'SELECT official_v3_method_api.approve_v1(' + args(['text','text','integer','text','text','integer','text','text','integer','text','text','text']) + ') AS result'
const REVOKE = 'SELECT official_v3_method_api.revoke_v1(' + args(['text','text','integer','text','text','integer']) + ') AS result'
const READ = 'SELECT status,epoch::text FROM official_v3_method_api.read_current_v1($1::text,$2::integer,$3::text,$4::text,$5::text)'
const LOCKED = 'SELECT official_v3_method_private.require_current_locked_v1($1::text,$2::integer,$3::text,$4::text,$5::integer)'
const IDENTITY = 'SELECT pg_catalog.pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_catalog.pg_stat_activity WHERE pid=pg_catalog.pg_backend_pid()'
type Identity = Readonly<{ pid: string; birth: string }>
type Role = 'authenticated' | 'anon' | 'service_role' | 'ot_v3_method_reader'
type Terminal = Awaited<ReturnType<OwnedTestLifetime['dispose']>>
function observe<T>(promise: Promise<T>) {
  let settled = false
  const result = promise.then(value => { settled = true; return { ok: true as const, value } },
    error => { settled = true; return { ok: false as const, error: error as unknown } })
  return { result, settled: () => settled }
}
async function transaction(connection: LocalPgConnection, sql: string): Promise<void> {
  try { await connection.query(sql) }
  catch (error) {
    try { await connection.query('ROLLBACK') }
    catch (rollbackError) { throw new AggregateError([error, rollbackError], 'hma1 candidate and rollback failed') }
    throw error
  }
}
async function setClaims(connection: LocalPgConnection, value: unknown): Promise<void> {
  const text = JSON.stringify(value)
  assert.ok(typeof text === 'string')
  await connection.query("SELECT pg_catalog.set_config('request.jwt.claims',$1,false)", [pgText(text)])
}
function acknowledgment(rows: PgRows) {
  assert.equal(rows.length, 1); assert.ok(rows[0]!.result && rows[0]!.result.length < 8192)
  return JSON.parse(rows[0]!.result) as { status: string; actorId?: string; after?: { status?: string; epoch?: number } }
}
async function resetHumans(connection: LocalPgConnection): Promise<void> {
  // These rows belong only to this newly owned disposable Auth fixture.
  await connection.query("TRUNCATE auth.users CASCADE; INSERT INTO auth.users(id) VALUES('" + AUTH.owner + "'),('" + AUTH.other + "');"
    + "INSERT INTO public.profiles(user_id,role,status) VALUES('" + AUTH.owner + "','owner','active'),('" + AUTH.other + "','owner','active');"
    + "INSERT INTO auth.sessions(id,user_id,aal) VALUES('" + AUTH.session + "','" + AUTH.owner + "','aal2'),('" + AUTH.foreign + "','" + AUTH.other + "','aal2');")
}
async function fixture(cluster: LocalProofCluster) {
  assertOwnedLocalProofCluster(cluster)
  const connections = new Set<LocalPgConnection>(), identities = new Map<LocalPgConnection, Identity>()
  const connect = async (login = cluster.user, role?: Role) => {
    assert.ok(connections.size < 64, 'bounded connection inventory')
    const connection = await LocalPgConnection.connect(cluster, login); connections.add(connection)
    const identity = (await connection.query(IDENTITY))[0]
    assert.ok(identity?.pid && identity.birth)
    identities.set(connection, { pid: identity.pid, birth: identity.birth })
    if (role) await connection.query('SET ROLE ' + role)
    return connection
  }
  const bootstrap = await connect(), observer = await connect()
  const version = Number((await bootstrap.query("SELECT current_setting('server_version_num') AS version"))[0]?.version)
  assert.ok(Number.isInteger(version) && version >= 170000 && version < 180000, 'HMA1 requires actual PostgreSQL 17, no optional skip')
  // Only bootstrap fixture preparation uses a superuser. The subjects below
  // run unchanged through an actual separately authenticated LOGIN postgres.
  await bootstrap.query([
    'CREATE ROLE anon NOLOGIN INHERIT NOSUPERUSER NOBYPASSRLS',
    'CREATE ROLE authenticated NOLOGIN INHERIT NOSUPERUSER NOBYPASSRLS',
    'CREATE ROLE service_role NOLOGIN INHERIT NOSUPERUSER BYPASSRLS',
    'CREATE ROLE postgres LOGIN INHERIT NOSUPERUSER BYPASSRLS CREATEROLE CREATEDB REPLICATION',
    'ALTER DATABASE postgres OWNER TO postgres',
    "ALTER ROLE postgres SET application_name='hma1-synthetic-fixture'",
    "ALTER ROLE postgres IN DATABASE postgres SET statement_timeout='25s'",
    'CREATE ROLE hma1_alien NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS',
    'CREATE ROLE ' + LOGIN.human + ' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION',
    'CREATE ROLE ' + LOGIN.reader + ' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION',
    'CREATE ROLE ' + LOGIN.anon + ' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION',
    'CREATE ROLE ' + LOGIN.service + ' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION',
    'GRANT authenticated TO ' + LOGIN.human,
    'GRANT anon TO ' + LOGIN.anon,
    'GRANT service_role TO ' + LOGIN.service,
    'GRANT USAGE ON SCHEMA public TO postgres',
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
    'CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $hma_auth$' + AUTH_HELPER_BODIES.jwt + '$hma_auth$',
    'CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $hma_auth$' + AUTH_HELPER_BODIES.uid + '$hma_auth$',
    'REVOKE ALL ON FUNCTION auth.jwt(),auth.uid() FROM PUBLIC',
    'GRANT USAGE ON SCHEMA auth TO postgres,authenticated,service_role',
    'GRANT EXECUTE ON FUNCTION auth.jwt(),auth.uid() TO postgres,authenticated,service_role',
    'GRANT SELECT(id,deleted_at,banned_until,is_anonymous),UPDATE(id) ON auth.users TO postgres',
    'GRANT SELECT(id,user_id,aal,not_after),UPDATE(id) ON auth.sessions TO postgres',
    'GRANT SELECT(user_id,role,status),UPDATE(user_id) ON public.profiles TO postgres',
    'CREATE TABLE public.hma1_unrelated_marker(id integer PRIMARY KEY,value text NOT NULL)',
    "INSERT INTO public.hma1_unrelated_marker VALUES(1,'retained-hma1-fixture')",
  ].join(';\n') + ';')
  for (let i = 0; i < 10; i++) {
    await bootstrap.query('CREATE ROLE hma1_existing_' + i + ' NOLOGIN NOINHERIT; GRANT hma1_existing_' + i
      + ' TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;')
  }
  await resetHumans(bootstrap)
  const installer = await connect('postgres'), human = await connect(LOGIN.human, 'authenticated')
  assert.deepEqual(await installer.query('SELECT session_user::text AS session,current_user::text AS role'), [{ session: 'postgres', role: 'postgres' }])
  const profile = (await installer.query("SELECT rolcanlogin::text,rolsuper::text,rolbypassrls::text,rolcreaterole::text FROM pg_roles WHERE rolname=current_user"))[0]
  assert.deepEqual(profile, { rolcanlogin: 'true', rolsuper: 'false', rolbypassrls: 'true', rolcreaterole: 'true' })
  await setClaims(human, claims())
  await observer.query("SET statement_timeout='1s'; SET lock_timeout='1s'")
  let operation = 0
  const stage = (binding: Ma1MethodBinding, connection = human) => connection.query(STAGE,
    values([ma1Operation(++operation),binding.methodId,binding.revision,binding.methodDigest,binding.packageDigest,null]))
  const unrelated = () => bootstrap.query('SELECT id::text,value FROM public.hma1_unrelated_marker ORDER BY id')
  const graph = () => bootstrap.query("SELECT roleid::text,member::text,grantor::text,admin_option::text,inherit_option::text,set_option::text FROM pg_auth_members "
    + "WHERE roleid=(SELECT oid FROM pg_roles WHERE rolname='ot_v3_method_reader') OR member=(SELECT oid FROM pg_roles WHERE rolname='ot_v3_method_reader') ORDER BY roleid,member,grantor")
  const identitiesNow = () => bootstrap.query("SELECT "
    + "(SELECT oid::text FROM pg_namespace WHERE nspname='official_v3_method_private') AS private_oid,"
    + "(SELECT oid::text FROM pg_namespace WHERE nspname='official_v3_method_api') AS api_oid,"
    + "(SELECT oid::text FROM pg_roles WHERE rolname='ot_v3_method_reader') AS reader_oid")
  const history = () => bootstrap.query("SELECT (SELECT count(*)::text FROM official_v3_method_private.revisions_v1) AS revisions,"
    + "(SELECT count(*)::text FROM official_v3_method_private.heads_v1) AS heads,"
    + "(SELECT count(*)::text FROM official_v3_method_private.operations_v1) AS operations")
  const snapshot = async () => ({
    schemas: await bootstrap.query("SELECT n.oid::text,n.nspname,n.nspowner::text,COALESCE(n.nspacl,acldefault('n',n.nspowner))::text AS acl,obj_description(n.oid,'pg_namespace') AS description "
      + "FROM pg_namespace n WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api') ORDER BY n.nspname"),
    role: await bootstrap.query("SELECT oid::text,rolname,rolcanlogin::text,rolinherit::text,rolsuper::text,rolcreatedb::text,rolcreaterole::text,rolreplication::text,rolbypassrls::text,rolconfig::text "
      + "FROM pg_roles WHERE rolname='ot_v3_method_reader'"),
    graph: await graph(),
    functions: await bootstrap.query("SELECT p.oid::text,n.nspname,p.proname,p.proowner::text,p.proacl::text,p.proconfig::text,"
      + "encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') AS body_hash FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace "
      + "WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api') ORDER BY n.nspname,p.proname"),
    objects: await bootstrap.query("SELECT c.oid::text,c.relname,c.relkind::text,c.relowner::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
      + "WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api') ORDER BY c.relname"),
    types: await bootstrap.query("SELECT t.oid::text,t.typname,t.typowner::text,t.typacl::text FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace "
      + "WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api') ORDER BY t.typname"),
  })
  const bindRecovery = async (binding?: PgRows[number], context = 'root-verified-unused-quiescent-v1') => {
    const row = binding ?? (await identitiesNow())[0]!
    assert.ok(row.private_oid && row.api_oid && row.reader_oid)
    await installer.query("SELECT set_config('jetnity.hma1_recovery_context',$1,false) AS recovery_context,set_config('jetnity.hma1_recovery_private_oid',$2,false) AS recovery_private_oid,"
      + "set_config('jetnity.hma1_recovery_api_oid',$3,false) AS recovery_api_oid,set_config('jetnity.hma1_recovery_reader_oid',$4,false) AS recovery_reader_oid",
    [pgText(context),pgText(row.private_oid),pgText(row.api_oid),pgText(row.reader_oid)])
  }
  return { cluster, version, bootstrap, observer, installer, human, connect, identities, graph, identitiesNow, history, snapshot, bindRecovery, unrelated, stage, op: () => ma1Operation(++operation) }
}
type Fixture = Awaited<ReturnType<typeof fixture>>
async function waitUntil(lifetime: OwnedTestLifetime, predicate: () => Promise<boolean>, message: string, milliseconds = 3000): Promise<void> {
  const until = performance.now() + milliseconds
  do { if (await predicate()) return; await lifetime.wait(10) } while (performance.now() < until)
  assert.fail(message)
}
async function waitBlocked(f: Fixture, lifetime: OwnedTestLifetime, caller: LocalPgConnection, holder: LocalPgConnection, pending: () => boolean, sql: string): Promise<void> {
  const c = f.identities.get(caller)!, h = f.identities.get(holder)!
  await waitUntil(lifetime, async () => {
    const rows = await f.observer.query("SELECT a.wait_event_type,a.query,($3::integer=ANY(pg_blocking_pids(a.pid)))::text AS actual_holder "
      + "FROM pg_stat_activity a WHERE a.pid=$1::integer AND a.backend_start=$2::timestamptz",
    [pgText(c.pid,23),pgText(c.birth),pgText(h.pid,23)])
    return !pending() && rows.length === 1 && rows[0]!.wait_event_type === 'Lock' && rows[0]!.query === sql && rows[0]!.actual_holder === 'true'
  }, 'actual identified wait was not observed')
}
async function cleanupWitness(parent: OwnedTestLifetime, mode: 'failure' | 'timeout') {
  const controller = new AbortController()
  const marker = Error('hma1_expected_' + mode)
  const lifetime = new OwnedTestLifetime(AbortSignal.any([parent.signal, controller.signal]))
  lifetime.installConnectOwnership()
  let timer: ReturnType<typeof setTimeout> | undefined, timerFired = false, expectedBody = false
  let failed = false, failure: unknown, terminal: Terminal | undefined
  let cluster: ReturnType<typeof startLocalProofCluster> | undefined
  let pending: ReturnType<typeof observe<PgRows>> | undefined
  try {
    cluster = lifetime.startCluster(startLocalProofCluster)
    const target = await LocalPgConnection.connect(cluster), observer = await LocalPgConnection.connect(cluster)
    const identity = (await target.query(IDENTITY))[0]
    assert.ok(identity?.pid && identity.birth)
    pending = observe(target.query('SELECT pg_catalog.pg_sleep(25)'))
    await waitUntil(lifetime, async () => {
      const rows = await observer.query("SELECT state,wait_event FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz",
        [pgText(identity.pid!,23),pgText(identity.birth!)])
      return !pending!.settled() && rows.length === 1 && rows[0]!.state === 'active' && rows[0]!.wait_event === 'PgSleep'
    }, 'real cleanup actor was not observed')
    if (mode === 'failure') throw marker
    timer = setTimeout(() => { timerFired = true; controller.abort(marker) }, 25)
    await lifetime.wait(1000)
    assert.fail('the test-owned timeout did not abort')
  } catch (error) {
    if (error === marker) expectedBody = true
    else { failed = true; failure = error }
  } finally {
    clearTimeout(timer)
    if (!controller.signal.aborted) controller.abort(marker)
    try {
      terminal = await lifetime.dispose()
      if (pending) {
        const outcome = await pending.result
        assert.equal(outcome.ok, false, 'the actual interrupted query must settle negatively')
      }
      assert.ok(cluster && !existsSync(cluster.root), 'owned cluster directory must be absent')
      assert.equal(terminal.pending, 0); assert.equal(terminal.started, terminal.settled)
      assert.equal(terminal.connections, terminal.closed); assert.equal(terminal.stoppedClusters, 1)
    } catch (error) {
      failure = failed ? new AggregateError([failure, error], 'hma1 witness and cleanup failed') : error
      failed = true
    }
  }
  if (failed) throw failure
  assert.equal(expectedBody, true); assert.equal(timerFired, mode === 'timeout')
  assert.ok(terminal)
  return { mode, actualWaitObserved: true, originalQueryJoined: true, timerFired, terminal }
}


export async function runHostedMethodAuthorityNative(t: TestContext): Promise<void> {
  const started = performance.now(), cutoff = new AbortController()
  const timer = setTimeout(() => cutoff.abort(Error('hma1_effect_budget_expired')), EFFECT_MS)
  const lifetime = new OwnedTestLifetime(AbortSignal.any([t.signal, cutoff.signal]))
  lifetime.installConnectOwnership()
  const completed: string[] = [], cleanup: Awaited<ReturnType<typeof cleanupWitness>>[] = []
  let cluster: LocalProofCluster | undefined, f: Fixture | undefined
  let failed = false, failure: unknown, terminal: Terminal | undefined
  let effectEnded = started, cleanupEnded = started
  let automaticEdge: PgRows = [], actualVersion: number | null = null
  const group = async (name: string, work: () => Promise<void>) => {
    lifetime.check()
    let passed = false
    await t.test(name, async () => { await work(); lifetime.check(); passed = true })
    assert.equal(passed, true, name + ' did not complete')
    completed.push(name)
  }
  try {
    for (const [path] of SOURCE_PINS) source(path)
    assertOriginalDeclarations()
    cluster = lifetime.startCluster(startLocalProofCluster)
    f = await fixture(cluster)
    const db = f
    actualVersion = db.version
    const unrelated = await db.unrelated()
    const noObjects = async () => {
      assert.deepEqual(await db.identitiesNow(), [{ private_oid: null, api_oid: null, reader_oid: null }])
      assert.deepEqual(await db.unrelated(), unrelated)
    }
    await group('HMA1-01 real creator and synthetic version/self-grant/missing-PG1 refusals', async () => {
      await assert.rejects(transaction(db.bootstrap, install), code('P7801'))
      await assert.rejects(transaction(db.human, install), code('P7801'))
      await noObjects()
      // Deliberate expression injection exercises both closed version bounds.
      // This is not an actual PostgreSQL 16/18 execution claim.
      const versionExpression = "version_number:=pg_catalog.current_setting('server_version_num')::integer;"
      const guard = block(install, 'hma1_creator')
      assert.equal(guard.split(versionExpression).length, 2)
      for (const wrongVersion of [160999, 180000]) {
        const injected = guard.replace(versionExpression, 'version_number:=' + wrongVersion + ';')
        await assert.rejects(db.installer.query(injected), code('P7801'))
        await noObjects()
      }
      await db.installer.query("SET createrole_self_grant='set'")
      try { await assert.rejects(transaction(db.installer, install), code('P7801')) }
      finally { await db.installer.query('RESET createrole_self_grant') }
      await db.bootstrap.query('GRANT postgres TO authenticated')
      try {
        await assert.rejects(transaction(db.installer, install), code('P7801'))
        assert.deepEqual(await db.bootstrap.query("SELECT count(*)::text AS n FROM pg_auth_members WHERE roleid='postgres'::regrole AND member='authenticated'::regrole"), [{ n: '1' }])
      } finally { await db.bootstrap.query('REVOKE postgres FROM authenticated') }
      await assert.rejects(transaction(db.installer, install), code('P7703'))
      await noObjects()
    })
    await transaction(db.installer, pg1)
    await group('HMA1-02 exact private PG1, destination collisions and unnormalized creator ACLs', async () => {
      for (const pin of AUTH_HELPER_PINS) {
        const rows = await db.bootstrap.query("SELECT octet_length(prosrc)::text AS bytes,encode(sha256(convert_to(prosrc,'UTF8')),'hex') AS hash FROM pg_proc "
          + "WHERE oid=to_regprocedure($1::text)", [pgText('auth.' + pin.name + '()')])
        assert.deepEqual(rows, [{ bytes: String(pin.bytes), hash: pin.sha256 }])
      }
      // Exact prerequisite body drift, preserved until its fixture owner restores it.
      const marker = 'create function jetnity_ot_auth.own_active_session_v1('
      const at = pg1.indexOf(marker), end = pg1.indexOf('$$;', at)
      assert.ok(at >= 0 && end > at); assert.equal(pg1.indexOf(marker, at + marker.length), -1)
      const originalGuard = pg1.slice(at, end + 3).replace('create function', 'create or replace function')
      const driftedGuard = originalGuard.replace('claims jsonb := auth.jwt();', 'claims jsonb := auth.jwt(); -- synthetic drift')
      assert.notEqual(driftedGuard, originalGuard)
      await db.installer.query(driftedGuard)
      try { await assert.rejects(transaction(db.installer, install), code('P7703')); await noObjects() }
      finally { await db.installer.query(originalGuard) }
      for (const [create, remove] of [
        ['CREATE ROLE ot_v3_method_reader NOLOGIN', 'DROP ROLE ot_v3_method_reader'],
        ['CREATE SCHEMA official_v3_method_private', 'DROP SCHEMA official_v3_method_private RESTRICT'],
        ['CREATE SCHEMA official_v3_method_api', 'DROP SCHEMA official_v3_method_api RESTRICT'],
      ]) {
        await db.installer.query(create!)
        const collided = await db.snapshot()
        try {
          await assert.rejects(transaction(db.installer, install), code('P7505'))
          assert.deepEqual(await db.snapshot(), collided)
        } finally { await db.installer.query(remove!) }
        await noObjects()
      }
      const defaults = () => db.bootstrap.query("SELECT defaclrole::text,defaclnamespace::text,defaclobjtype::text,defaclacl::text FROM pg_default_acl "
        + "WHERE defaclrole='postgres'::regrole ORDER BY 1,2,3")
      for (const [object, privilege] of [['FUNCTIONS','EXECUTE'],['SCHEMAS','USAGE'],['TABLES','SELECT']] as const) {
        const clean = await defaults()
        await db.installer.query('ALTER DEFAULT PRIVILEGES GRANT ' + privilege + ' ON ' + object + ' TO hma1_alien')
        const changed = await defaults(); assert.notDeepEqual(changed, clean)
        try {
          await assert.rejects(transaction(db.installer, install), code('P7505'))
          assert.deepEqual(await defaults(), changed); await noObjects()
        } finally { await db.installer.query('ALTER DEFAULT PRIVILEGES REVOKE ' + privilege + ' ON ' + object + ' FROM hma1_alien') }
        assert.deepEqual(await defaults(), clean)
      }
      // One unchanged candidate transaction, with a fixture-owned extra edge
      // inserted at a unique boundary before the two catalog validators.
      const boundary = 'DO $hma1_creator_acl_origin$', split = install.indexOf(boundary)
      assert.ok(split > 0); assert.equal(install.indexOf(boundary, split + boundary.length), -1)
      try {
        await db.installer.query(install.slice(0, split))
        await db.installer.query('GRANT ot_v3_method_reader TO hma1_alien WITH ADMIN FALSE, INHERIT FALSE, SET FALSE')
        await assert.rejects(db.installer.query(install.slice(split)), code('P7505'))
      } finally { await db.installer.query('ROLLBACK') }
      await noObjects()
    })
    await group('HMA1-03 unchanged artifact installs through actual non-superuser LOGIN postgres', async () => {
      await transaction(db.installer, install)
      const ids = (await db.identitiesNow())[0]!
      const creator = (await db.bootstrap.query("SELECT oid::text FROM pg_roles WHERE rolname='postgres'"))[0]!.oid!
      automaticEdge = await db.graph()
      assert.deepEqual(automaticEdge, [{ roleid: ids.reader_oid, member: creator, grantor: '10',
        admin_option: 'true', inherit_option: 'false', set_option: 'false' }])
      assert.deepEqual(await db.bootstrap.query("SELECT rolsuper::text FROM pg_roles WHERE oid=10"), [{ rolsuper: 'true' }])
      assert.deepEqual(await db.installer.query("SELECT pg_has_role('postgres','ot_v3_method_reader','SET')::text AS can_set,"
        + "pg_has_role('postgres','ot_v3_method_reader','USAGE')::text AS can_inherit"), [{ can_set: 'false', can_inherit: 'false' }])
      assert.deepEqual(await db.bootstrap.query("SELECT count(*)::text AS n FROM pg_auth_members WHERE member='postgres'::regrole"), [{ n: '11' }])
      await db.installer.query(block(install, 'ma1_exact_boundary'))
      await db.installer.query(block(install, 'hma1_exact_identity'))
      for (const pin of FUNCTION_PINS) {
        const rows = await db.installer.query("SELECT octet_length(prosrc)::text AS bytes,encode(sha256(convert_to(prosrc,'UTF8')),'hex') AS hash "
          + "FROM pg_proc WHERE oid=to_regprocedure($1::text)", [pgText(pin.signature)])
        assert.deepEqual(rows, [{ bytes: String(pin.bodyBytes), hash: pin.bodySha256 }])
      }
      const exact = await db.snapshot()
      for (const [login, role] of [[LOGIN.human,'authenticated'],[LOGIN.anon,'anon'],[LOGIN.service,'service_role']] as const) {
        const caller = await db.connect(login, role)
        try {
          await setClaims(caller, claims())
          assert.deepEqual(await caller.query("SELECT pg_has_role(current_user,'ot_v3_method_reader','SET')::text AS can_set,"
            + "pg_has_role(current_user,'ot_v3_method_reader','USAGE')::text AS can_inherit"), [{ can_set: 'false', can_inherit: 'false' }])
          await assert.rejects(caller.query('SELECT * FROM official_v3_method_private.revisions_v1'), code('42501'))
          await assert.rejects(caller.query("SELECT * FROM official_v3_method_api.read_current_v1('x',1,'x','x','x')"), code('42501'))
          if (role !== 'authenticated') await assert.rejects(db.stage(ma1SyntheticTuple('hma1-role-' + role.replace('_','-')), caller), code('42501'))
        } finally { caller.close() }
      }
      assert.deepEqual(await db.snapshot(), exact)
      assert.deepEqual(await db.history(), [{ revisions: '0', heads: '0', operations: '0' }])
      assert.deepEqual(await db.unrelated(), unrelated)
    })
    await group('HMA1-04 unused recovery binds identity and refuses drift, every edge option and consumers', async () => {
      const exact = await db.snapshot(), oldIds = (await db.identitiesNow())[0]!
      await assert.rejects(transaction(db.installer, recovery), code('P7803'))
      await db.bindRecovery({ ...oldIds, reader_oid: '0' })
      await assert.rejects(transaction(db.installer, recovery), code('P7803'))
      await db.bindRecovery()
      const changes = [
        ['GRANT EXECUTE ON FUNCTION official_v3_method_private.tuple_valid_v1(text,integer,text,text) TO hma1_alien',
          'REVOKE EXECUTE ON FUNCTION official_v3_method_private.tuple_valid_v1(text,integer,text,text) FROM hma1_alien','P7505'],
        ['GRANT USAGE ON SCHEMA official_v3_method_private TO hma1_alien','REVOKE USAGE ON SCHEMA official_v3_method_private FROM hma1_alien','P7505'],
        ['CREATE TABLE official_v3_method_private.foreign_fixture(id integer)','DROP TABLE official_v3_method_private.foreign_fixture RESTRICT','P7505'],
        ["CREATE TYPE official_v3_method_api.foreign_fixture AS ENUM('x')",'DROP TYPE official_v3_method_api.foreign_fixture RESTRICT','P7802'],
      ] as const
      for (const [change, restore, expected] of changes) {
        await db.installer.query(change)
        const drift = await db.snapshot(); assert.notDeepEqual(drift, exact)
        try {
          await assert.rejects(transaction(db.installer, recovery), code(expected))
          assert.deepEqual(await db.snapshot(), drift)
        } finally { await db.installer.query(restore) }
        assert.deepEqual(await db.snapshot(), exact)
      }
      const originalTuple = functionDeclaration(original, 'official_v3_method_private.tuple_valid_v1').replace('CREATE FUNCTION','CREATE OR REPLACE FUNCTION')
      const driftTuple = originalTuple.replace('AS $$', 'AS $$\n-- synthetic body drift\n')
      await db.installer.query(driftTuple)
      const drift = await db.snapshot()
      try {
        await assert.rejects(transaction(db.installer, recovery), code('P7802'))
        assert.deepEqual(await db.snapshot(), drift)
      } finally { await db.installer.query(originalTuple) }
      assert.deepEqual(await db.snapshot(), exact)
      for (const options of [
        'ADMIN FALSE, INHERIT FALSE, SET FALSE',
        'ADMIN TRUE, INHERIT TRUE, SET FALSE',
        'ADMIN TRUE, INHERIT FALSE, SET TRUE',
      ]) {
        await db.bootstrap.query('GRANT ot_v3_method_reader TO postgres WITH ' + options)
        const changed = await db.graph(); assert.notDeepEqual(changed, automaticEdge)
        try {
          await assert.rejects(transaction(db.installer, recovery), code('P7505'))
          assert.deepEqual(await db.graph(), changed)
        } finally { await db.bootstrap.query('GRANT ot_v3_method_reader TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE') }
        assert.deepEqual(await db.graph(), automaticEdge)
      }
      await db.bootstrap.query('GRANT ot_v3_method_reader TO hma1_alien WITH ADMIN TRUE, INHERIT FALSE, SET FALSE')
      try {
        const extra = await db.graph(); assert.equal(extra.length, 2)
        await assert.rejects(transaction(db.installer, recovery), code('P7505'))
        assert.deepEqual(await db.graph(), extra)
        const alien = await db.connect()
        try {
          await alien.query('SET ROLE hma1_alien')
          await alien.query('GRANT ot_v3_method_reader TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET FALSE')
          const wrongGrantor = await db.graph()
          assert.equal(wrongGrantor.length, 3)
          assert.ok(wrongGrantor.some(edge => edge.member === automaticEdge[0]!.member && edge.grantor !== '10'))
          try {
            await assert.rejects(transaction(db.installer, recovery), code('P7505'))
            assert.deepEqual(await db.graph(), wrongGrantor)
          } finally { await alien.query('REVOKE ot_v3_method_reader FROM postgres') }
        } finally { alien.close() }
      } finally { await db.bootstrap.query('REVOKE ot_v3_method_reader FROM hma1_alien') }
      assert.deepEqual(await db.snapshot(), exact)
      for (const [create, remove] of [
        ['CREATE SCHEMA official_v3_hma1_consumer','DROP SCHEMA official_v3_hma1_consumer RESTRICT'],
        ['CREATE ROLE ot_v3_hma1_consumer NOLOGIN','DROP ROLE ot_v3_hma1_consumer'],
      ]) {
        await db.bootstrap.query(create!)
        try {
          await assert.rejects(transaction(db.installer, recovery), code('P7803'))
          assert.deepEqual(await db.snapshot(), exact)
        } finally { await db.bootstrap.query(remove!) }
      }
      await transaction(db.installer, recovery)
      await noObjects()
      await db.installer.query(block(pg1, 'pg1_exact_inventory'))
      await transaction(db.installer, install)
      const newIds = (await db.identitiesNow())[0]!
      assert.notEqual(newIds.private_oid, oldIds.private_oid)
      assert.notEqual(newIds.api_oid, oldIds.api_oid)
      assert.notEqual(newIds.reader_oid, oldIds.reader_oid)
      await db.bindRecovery(oldIds)
      await assert.rejects(transaction(db.installer, recovery), code('P7803'))
      await db.bindRecovery()
      automaticEdge = await db.graph()
      assert.equal(automaticEdge.length, 1)
    })
    const binding = ma1SyntheticTuple('hma1-positive')
    await group('HMA1-05 real synthetic Owner/AAL2 stage approve read revoke and retained history', async () => {
      const staged = acknowledgment(await db.stage(binding))
      assert.equal(staged.status, 'recorded'); assert.equal(staged.actorId, AUTH.owner)
      assert.deepEqual(await db.history(), [{ revisions: '1', heads: '0', operations: '1' }])
      // Still the exact one-edge installation graph: history is the cause of refusal.
      assert.deepEqual(await db.graph(), automaticEdge)
      await assert.rejects(transaction(db.installer, recovery), code('P7803'))
      assert.deepEqual(await db.history(), [{ revisions: '1', heads: '0', operations: '1' }])
      const approved = acknowledgment(await db.human.query(APPROVE, values([db.op(),binding.methodId,1,binding.methodDigest,binding.packageDigest,
        null,null,null,0,null,'until_revoked',null])))
      assert.equal(approved.status, 'recorded'); assert.equal(approved.after?.status, 'approved'); assert.equal(approved.after?.epoch, 1)
      // Fixture-only operational reader binding; never part of install privileges.
      await db.bootstrap.query('GRANT ot_v3_method_reader TO ' + LOGIN.reader)
      const reader = await db.connect(LOGIN.reader, 'ot_v3_method_reader')
      try {
        const read = () => reader.query(READ, [pgText(binding.methodId),pgText('1',23),pgText(binding.methodDigest),pgText(binding.packageDigest),pgText(new Date().toISOString())])
        assert.deepEqual(await read(), [{ status: 'approved', epoch: '1' }])
        const revoked = acknowledgment(await db.human.query(REVOKE, values([db.op(),binding.methodId,1,binding.methodDigest,binding.packageDigest,1])))
        assert.equal(revoked.status, 'recorded'); assert.equal(revoked.after?.status, 'revoked'); assert.equal(revoked.after?.epoch, 2)
        assert.deepEqual(await read(), [{ status: 'revoked', epoch: '2' }])
        await assert.rejects(db.stage(ma1SyntheticTuple('hma1-reader-no-write'), reader), code('42501'))
      } finally { reader.close(); await db.bootstrap.query('REVOKE ot_v3_method_reader FROM ' + LOGIN.reader) }
      assert.deepEqual(await db.graph(), automaticEdge)
      const retained = await db.history()
      assert.deepEqual(retained, [{ revisions: '1', heads: '1', operations: '3' }])
      await assert.rejects(transaction(db.installer, recovery), code('P7803'))
      assert.deepEqual(await db.history(), retained)
    })
    await group('HMA1-06 invalid current authority and actual Owner row NOWAIT conflicts never write', async () => {
      const before = await db.history()
      const negatives: readonly unknown[] = [
        {},null,[],claims({role:'service_role'}),claims({aal:'aal1'}),claims({session_id:null}),
        claims({session_id:AUTH.foreign}),claims({sub:AUTH.other}),claims({sub:'not-a-uuid'}),
        claims({sub:'44444444-4444-4444-8444-444444444444'}),claims({exp:0}),claims({exp:'9999999999'}),
      ]
      for (const [i, value] of negatives.entries()) {
        await setClaims(db.human, value)
        await assert.rejects(db.stage(ma1SyntheticTuple('hma1-claims-' + i)), code('42501'))
        assert.deepEqual(await db.history(), before)
      }
      await setClaims(db.human, claims())
      await db.human.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [pgText(AUTH.other)])
      await assert.rejects(db.stage(ma1SyntheticTuple('hma1-uid-mismatch')), code('42501'))
      await db.human.query("SELECT set_config('request.jwt.claim.sub','',false) AS cleared_sub,set_config('request.jwt.claim',$1,false) AS precedence_claim",
        [pgText(JSON.stringify(claims({ sub: AUTH.other, session_id: AUTH.foreign })))])
      await assert.rejects(db.stage(ma1SyntheticTuple('hma1-jwt-precedence')), code('42501'))
      await db.human.query("SELECT set_config('request.jwt.claim','',false) AS cleared_claim,set_config('request.jwt.claims','{invalid-json',false) AS malformed_claims")
      await assert.rejects(db.stage(ma1SyntheticTuple('hma1-malformed-json')), code('22P02'))
      await setClaims(db.human, claims())
      const mutations = [
        "UPDATE auth.users SET deleted_at=clock_timestamp() WHERE id='" + AUTH.owner + "'",
        "UPDATE auth.users SET banned_until=clock_timestamp()+interval '1 hour' WHERE id='" + AUTH.owner + "'",
        "UPDATE auth.users SET is_anonymous=true WHERE id='" + AUTH.owner + "'",
        "UPDATE auth.sessions SET not_after=clock_timestamp() WHERE id='" + AUTH.session + "'",
        "UPDATE auth.sessions SET aal='aal1' WHERE id='" + AUTH.session + "'",
        "UPDATE auth.sessions SET user_id='" + AUTH.other + "' WHERE id='" + AUTH.session + "'",
        "DELETE FROM auth.sessions WHERE id='" + AUTH.session + "'",
        "UPDATE public.profiles SET role='admin' WHERE user_id='" + AUTH.owner + "'",
        "UPDATE public.profiles SET status='disabled' WHERE user_id='" + AUTH.owner + "'",
        "DELETE FROM public.profiles WHERE user_id='" + AUTH.owner + "'",
        "DELETE FROM auth.users WHERE id='" + AUTH.owner + "'",
      ]
      for (const [i, mutation] of mutations.entries()) {
        await resetHumans(db.bootstrap); await db.bootstrap.query(mutation)
        await assert.rejects(db.stage(ma1SyntheticTuple('hma1-state-' + i)), code('42501'))
        assert.deepEqual(await db.history(), before)
      }
      await resetHumans(db.bootstrap)
      const holder = await db.connect()
      try {
        for (const [i, lock] of [
          "SELECT id FROM auth.users WHERE id='" + AUTH.owner + "' FOR UPDATE",
          "SELECT id FROM auth.sessions WHERE id='" + AUTH.session + "' FOR UPDATE",
          "SELECT user_id FROM public.profiles WHERE user_id='" + AUTH.owner + "' FOR UPDATE",
        ].entries()) {
          await holder.query('BEGIN')
          try {
            assert.equal((await holder.query(lock)).length, 1)
            await assert.rejects(db.stage(ma1SyntheticTuple('hma1-nowait-' + i)), code('55P03'))
            assert.deepEqual(await db.history(), before)
          } finally { await holder.query('ROLLBACK') }
        }
      } finally { holder.close() }
      assert.deepEqual(await db.history(), before)
      const methodHolder = await db.connect()
      try {
        for (const kind of ['session-expiry','profile-disabled'] as const) {
          await resetHumans(db.bootstrap)
          const waitingBinding = ma1SyntheticTuple('hma1-wait-' + kind)
          await methodHolder.query('BEGIN')
          await methodHolder.query('SELECT pg_advisory_xact_lock(750102,hashtext($1::text))', [pgText(waitingBinding.methodId)])
          const pending = observe(db.stage(waitingBinding))
          try {
            await waitBlocked(db, lifetime, db.human, methodHolder, pending.settled, STAGE)
            const identity = db.identities.get(db.human)!
            const began = (await db.observer.query('SELECT query_start::text AS began FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',
              [pgText(identity.pid,23),pgText(identity.birth)]))[0]?.began
            assert.ok(began)
            if (kind === 'session-expiry') {
              const expired = (await db.bootstrap.query("UPDATE auth.sessions SET not_after=clock_timestamp() WHERE id='" + AUTH.session + "' RETURNING not_after::text AS expired"))[0]?.expired
              assert.ok(expired)
              assert.deepEqual(await db.bootstrap.query('SELECT ($1::timestamptz<$2::timestamptz)::text AS after_start,(clock_timestamp()>$2::timestamptz)::text AS expired_now',
                [pgText(began),pgText(expired)]), [{ after_start: 'true', expired_now: 'true' }])
            } else await db.bootstrap.query("UPDATE public.profiles SET status='disabled' WHERE user_id='" + AUTH.owner + "'")
            await methodHolder.query('ROLLBACK')
            const outcome = await pending.result
            assert.equal(outcome.ok, false)
            if (outcome.ok) assert.fail('changed current Owner state admitted after method wait')
            assert.ok(code('42501')(outcome.error))
            assert.deepEqual(await db.history(), before)
          } finally { await methodHolder.query('ROLLBACK'); await pending.result }
        }
      } finally { methodHolder.close(); await resetHumans(db.bootstrap) }
    })
    await group('HMA1-07 epoch CAS and actual head wait recheck clock expiry', async () => {
      // DB clock anchors the short synthetic approval; observation proves the wait.
      const deadline = (await db.bootstrap.query("SELECT to_char(clock_timestamp()+interval '3 seconds','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS until"))[0]!.until!
      const approval = acknowledgment(await db.human.query(APPROVE, values([db.op(),binding.methodId,1,binding.methodDigest,binding.packageDigest,
        1,binding.methodDigest,binding.packageDigest,2,'revoked','until',deadline])))
      assert.equal(approval.after?.epoch, 3); assert.equal(approval.after?.status, 'approved')
      const lockedValues = (epoch: number) => [pgText(binding.methodId),pgText('1',23),pgText(binding.methodDigest),pgText(binding.packageDigest),pgText(String(epoch),23)]
      await assert.rejects(db.installer.query(LOCKED, lockedValues(2)), code('P7504'))
      const history = await db.history()
      await assert.rejects(db.human.query(APPROVE, values([db.op(),binding.methodId,1,binding.methodDigest,binding.packageDigest,
        1,binding.methodDigest,binding.packageDigest,2,'revoked','until_revoked',null])), code('P7503'))
      assert.deepEqual(await db.history(), history)
      const holder = await db.connect()
      let pending: ReturnType<typeof observe<PgRows>> | undefined
      try {
        await holder.query('BEGIN')
        assert.equal((await holder.query('SELECT method_id FROM official_v3_method_private.heads_v1 WHERE method_id=$1::text FOR UPDATE',
          [pgText(binding.methodId)])).length, 1)
        pending = observe(db.installer.query(LOCKED, lockedValues(3)))
        await waitBlocked(db, lifetime, db.installer, holder, pending.settled, LOCKED)
        const callerIdentity = db.identities.get(db.installer)!
        assert.deepEqual(await db.observer.query('SELECT (query_start<$3::timestamptz)::text AS began_unexpired FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',
          [pgText(callerIdentity.pid,23),pgText(callerIdentity.birth),pgText(deadline)]), [{ began_unexpired: 'true' }])
        await waitUntil(lifetime, async () => (await db.observer.query("SELECT (clock_timestamp()>$1::timestamptz)::text AS expired",
          [pgText(deadline)]))[0]?.expired === 'true', 'synthetic approval did not expire', 5000)
        await holder.query('ROLLBACK')
        const outcome = await pending.result
        assert.equal(outcome.ok, false)
        if (outcome.ok) assert.fail('expired locked method admitted')
        assert.ok(code('P7504')(outcome.error))
      } finally {
        await holder.query('ROLLBACK')
        if (pending) await pending.result
        holder.close()
      }
      assert.deepEqual(await db.history(), history)
      const expired = await db.installer.query(READ, [pgText(binding.methodId),pgText('1',23),pgText(binding.methodDigest),pgText(binding.packageDigest),pgText(new Date().toISOString())])
      assert.deepEqual(expired, [{ status: 'expired', epoch: '3' }])
      const revoked = acknowledgment(await db.human.query(REVOKE, values([db.op(),binding.methodId,1,binding.methodDigest,binding.packageDigest,3])))
      assert.equal(revoked.after?.epoch, 4); assert.equal(revoked.after?.status, 'revoked')
      assert.deepEqual(await db.history(), [{ revisions: '1', heads: '1', operations: '5' }])
      await assert.rejects(transaction(db.installer, recovery), code('P7803'))
    })
    await group('HMA1-08 failure and timeout settle actual queries and stop every owned cluster', async () => {
      cleanup.push(await cleanupWitness(lifetime, 'failure'))
      cleanup.push(await cleanupWitness(lifetime, 'timeout'))
    })
    assert.equal(completed.length, 8)
    assert.deepEqual(await db.history(), [{ revisions: '1', heads: '1', operations: '5' }])
    assert.deepEqual(await db.unrelated(), unrelated)
  } catch (error) { failed = true; failure = error }
  finally {
    effectEnded = performance.now()
    clearTimeout(timer)
    // Unconditional disposal must remain the first cleanup operation. A failed
    // connection.close, fixture setup or test assertion cannot bypass ownership.
    try {
      terminal = await lifetime.dispose()
      assert.equal(terminal.pending, 0); assert.equal(terminal.started, terminal.settled)
      assert.equal(terminal.connections, terminal.closed)
      assert.equal(terminal.stoppedClusters, cluster ? 1 : 0)
      if (cluster) assert.equal(existsSync(cluster.root), false, 'main owned cluster must be absent')
    } catch (error) {
      failure = failed ? new AggregateError([failure, error], 'hma1 primary and cleanup failed') : error
      failed = true
    }
    cleanupEnded = performance.now()
  }
  const receipt = {
    schema: 'jetnity.hma1.native.v1', status: failed ? 'failed' : 'passed',
    syntheticOnly: true, hostedInstall: false, signedOwnerRequest: false, methodApprovalIsSynthetic: true,
    versionNegativesAreExpressionInjection: true, actualVersion, actualAutomaticEdge: automaticEdge,
    source: { install: SOURCE_PINS[0][1], recovery: SOURCE_PINS[1][1], pg1: SOURCE_PINS[2][1], originalMa1: SOURCE_PINS[3][1] },
    completed, effectLimitMs: EFFECT_MS, effectMs: Math.ceil(effectEnded - started),
    cleanupMs: Math.ceil(cleanupEnded - effectEnded), elapsedMs: Math.ceil(cleanupEnded - started),
    main: terminal ?? null, cleanupWitnesses: cleanup,
  }
  assert.ok(Buffer.byteLength(JSON.stringify(receipt)) < 8192)
  t.diagnostic('HMA1_NATIVE_RECEIPT ' + JSON.stringify(receipt))
  if (failed) throw failure
}
