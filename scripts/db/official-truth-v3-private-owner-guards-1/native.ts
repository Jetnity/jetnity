// PG1 mandatory disposable native proof. Never a hosted installer or signed-JWT proof.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { assertOwnedLocalProofCluster, startLocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { ma1Operation, ma1SyntheticTuple } from '../official-truth-v3-method-authority-1/fixtures'
import type { Ma1MethodBinding } from '../../../lib/readiness/official-truth-product-v3/method/contract'

const EFFECT_MS = 180_000
const SOURCE_PINS = Object.freeze([
  ['./install-candidate.sql', '3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2'],
  ['./recovery-candidate.sql', '869ed584a9f1aeb4d56a198ec2c94d20569f5cead3f99532753e9d2ab3edb78b'],
  ['../official-truth-v3-method-authority-1/method-candidate.sql', '269c8567da63014c3aa80905aa0773afa4203778985b44ad84fea48d0f24eee6'],
  ['../official-truth-integrated-pilot-1/local-cluster.ts', 'f6d21b3fef8f0ad41a8ac3951972ea5cba0394cfe41037eba8d0258ed508aa10'],
  ['../official-truth-integrated-pilot-1/pg-wire.ts', '57f3b01f5624889a41e8e8832cbebf49da9100fbb4dec6ffe25f769a44a4aaf8'],
  ['../official-truth-atomic-version-refresh-1/test-lifetime.ts', 'e7a6a5deb652019209fd9e4bd2f1ce71bef3c15a4988838ab5b35f147dbbee68'],
  ['../official-truth-v3-method-authority-1/fixtures.ts', 'f6c2fe919e7ccd056fd0120010cf4189540c4b71a818f105d38e276577c03811'],
  ['../../../lib/readiness/official-truth-product-v3/method/contract.ts', '77d88e2063bf12ee4c1ca385bb4d65b9b5fd14845da62a25556877a0329ed05e'],
] as const)
const digest = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex')
function source(path: string): string {
  const pin = SOURCE_PINS.find(([name]) => name === path)
  assert.ok(pin, 'unlisted native source')
  const bytes = readFileSync(new URL(path, import.meta.url))
  assert.equal(digest(bytes), pin[1], 'source drift requires new independent review')
  return bytes.toString('utf8')
}
const install = source('./install-candidate.sql')
const recovery = source('./recovery-candidate.sql')
const method = source('../official-truth-v3-method-authority-1/method-candidate.sql')
const GUARDS = Object.freeze([
  { name: 'own_active_session_v1', result: 'bool', volatility: 's', config: '{search_path=pg_catalog}',
    declarationHash: '1600e77651e4f571d2d281c1900488ce1e372a9a8fca3c904792a93eb9d6ebf0',
    bodyHash: '1bf7498146d4827371087a926327db1348ce2a4cc55693427ee154eb81082354' },
  { name: 'require_current_owner_session_v1', result: 'void', volatility: 'v', config: '{search_path=pg_catalog,lock_timeout=2s}',
    declarationHash: '204b7f7e102222b9cb070f9d6998959664de8e4827ac0bc0e87d9483ec0c630b',
    bodyHash: 'ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b' },
] as const)
function declaration(name: typeof GUARDS[number]['name']): string {
  const marker = 'create function jetnity_ot_auth.' + name + '()'
  const start = install.indexOf(marker), end = install.indexOf('$$;', start)
  assert.ok(start >= 0 && end > start)
  assert.equal(install.indexOf(marker, start + marker.length), -1)
  const text = install.slice(start, end + 3), expected = GUARDS.find(g => g.name === name)!
  assert.equal(digest(text), expected.declarationHash)
  assert.equal(digest(text.slice(text.indexOf('as $$') + 5, -3)), expected.bodyHash)
  return text
}
// Actual helper BODY reference from Root's bounded Dev observation 6816048537.
// Ownership/configuration/rows/claims below are still synthetic and not hosted evidence.
const AUTH_HELPER_BODY_PINS = Object.freeze([
  {
    "name": "jwt",
    "sha256": "fed2a8ac0349ffaba807c1b574698bfb1348825b8ef5163ad72d8408386f5e3e",
    "bytes": 166
  },
  {
    "name": "uid",
    "sha256": "9ab5ea099e74ec09e83b1505c51a3647791195aed7c742dcc3f257dfc7d2f300",
    "bytes": 176
  }
] as const)
const AUTH_HELPER_BODIES = Object.freeze({
  "jwt": "\n  select \n    coalesce(\n        nullif(current_setting('request.jwt.claim', true), ''),\n        nullif(current_setting('request.jwt.claims', true), '')\n    )::jsonb\n",
  "uid": "\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.sub', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n  )::uuid\n"
} as const)
const AUTH = Object.freeze({
  owner: '11111111-1111-4111-8111-111111111111', other: '22222222-2222-4222-8222-222222222222',
  session: '55555555-5555-4555-8555-555555555555', foreignSession: '66666666-6666-4666-8666-666666666666',
})
const LOGIN = Object.freeze({ human: 'ot_pg1_human', reader: 'ot_pg1_reader', anon: 'ot_pg1_anon', service: 'ot_pg1_service' })
const claims = (change: Readonly<Record<string, unknown>> = {}) => ({
  sub: AUTH.owner, session_id: AUTH.session, role: 'authenticated', aal: 'aal2',
  exp: Math.floor(Date.now() / 1000) + 300, ...change,
})
const code = (state: string) => (error: unknown) => error instanceof LocalPgError && error.code === state
const values = (items: readonly (string | number | null)[]) => items.map(x => pgText(x === null ? '' : String(x)))
const args = (types: readonly ('text' | 'integer')[]) => types.map((type, i) => `NULLIF($${i + 1}::text,'')${type === 'integer' ? '::integer' : ''}`).join(',')
const STAGE = `SELECT official_v3_method_api.stage_draft_v1(${args(['text','text','integer','text','text','integer'])}) AS result`
const APPROVE = `SELECT official_v3_method_api.approve_v1(${args(['text','text','integer','text','text','integer','text','text','integer','text','text','text'])}) AS result`
const REVOKE = `SELECT official_v3_method_api.revoke_v1(${args(['text','text','integer','text','text','integer'])}) AS result`
const READ = 'SELECT status,epoch::text FROM official_v3_method_api.read_current_v1($1::text,$2::integer,$3::text,$4::text,$5::text)'
const IDENTITY = 'SELECT pg_catalog.pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_catalog.pg_stat_activity WHERE pid=pg_catalog.pg_backend_pid()'
type Identity = Readonly<{ pid: string; birth: string }>
type Role = 'postgres' | 'authenticated' | 'anon' | 'service_role' | 'ot_v3_method_reader'
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
    catch (rollbackError) { throw new AggregateError([error, rollbackError], 'pg1 candidate and rollback failed') }
    throw error
  }
}
async function setClaims(connection: LocalPgConnection, value: unknown): Promise<void> {
  const encoded = JSON.stringify(value)
  assert.ok(typeof encoded === 'string')
  await connection.query("SELECT pg_catalog.set_config('request.jwt.claims',$1,false)", [pgText(encoded)])
}
function acknowledgment(rows: PgRows) {
  assert.equal(rows.length, 1); assert.ok(rows[0]!.result && rows[0]!.result.length < 8192)
  return JSON.parse(rows[0]!.result) as { status: string; actorId?: string; after?: { status?: string; epoch?: number } }
}
async function resetHumans(connection: LocalPgConnection) {
  // Only the newly owned disposable fixture. MA1 history intentionally has no Auth FK.
  await connection.query(`TRUNCATE auth.users CASCADE;
    INSERT INTO auth.users(id) VALUES('${AUTH.owner}'),('${AUTH.other}');
    INSERT INTO public.profiles(user_id,role,status) VALUES('${AUTH.owner}','owner','active'),('${AUTH.other}','owner','active');
    INSERT INTO auth.sessions(id,user_id,aal) VALUES('${AUTH.session}','${AUTH.owner}','aal2'),('${AUTH.foreignSession}','${AUTH.other}','aal2');`)
}
async function fixture(lifetime: OwnedTestLifetime) {
  const cluster = lifetime.startCluster(startLocalProofCluster)
  assertOwnedLocalProofCluster(cluster)
  const connections = new Set<LocalPgConnection>(), identities = new Map<LocalPgConnection, Identity>()
  const connect = async (login = cluster.user, role?: Role) => {
    assert.ok(connections.size < 64, 'finite connection inventory')
    const connection = await LocalPgConnection.connect(cluster, login); connections.add(connection)
    const identity = (await connection.query(IDENTITY))[0]
    assert.ok(identity?.pid && identity.birth)
    identities.set(connection, { pid: identity.pid, birth: identity.birth })
    if (role) await connection.query('SET ROLE ' + role)
    return connection
  }
  const owner = await connect(), observer = await connect()
  await owner.query(`CREATE ROLE anon NOLOGIN NOINHERIT;
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    CREATE ROLE postgres NOLOGIN NOINHERIT NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
    CREATE ROLE ot_pg1_alien NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
    CREATE ROLE ${LOGIN.human} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
    CREATE ROLE ${LOGIN.reader} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
    CREATE ROLE ${LOGIN.anon} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
    CREATE ROLE ${LOGIN.service} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
    GRANT authenticated TO ${LOGIN.human}; GRANT anon TO ${LOGIN.anon}; GRANT service_role TO ${LOGIN.service};
    GRANT CREATE ON DATABASE postgres TO postgres;
    GRANT USAGE ON SCHEMA public TO postgres;
    CREATE SCHEMA auth;
    CREATE TYPE auth.aal_level AS ENUM('aal1','aal2','aal3');
    CREATE TABLE auth.users(id uuid PRIMARY KEY,deleted_at timestamptz,banned_until timestamptz,is_anonymous boolean NOT NULL DEFAULT false);
    CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,aal auth.aal_level,not_after timestamptz);
    CREATE TABLE public.profiles(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,role text NOT NULL,status text NOT NULL);
    ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY; ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;
    ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY; ALTER TABLE auth.sessions FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$${AUTH_HELPER_BODIES.jwt}$$;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$${AUTH_HELPER_BODIES.uid}$$;
    REVOKE ALL ON FUNCTION auth.jwt(),auth.uid() FROM PUBLIC;
    GRANT USAGE ON SCHEMA auth TO postgres,authenticated,service_role;
    GRANT EXECUTE ON FUNCTION auth.jwt(),auth.uid() TO postgres,authenticated,service_role;
    GRANT SELECT(id,deleted_at,banned_until,is_anonymous),UPDATE(id) ON auth.users TO postgres;
    GRANT SELECT(id,user_id,aal,not_after),UPDATE(id) ON auth.sessions TO postgres;
    GRANT SELECT(user_id,role,status),UPDATE(user_id) ON public.profiles TO postgres;
    CREATE TABLE public.pg1_unrelated_marker(id integer PRIMARY KEY,value text NOT NULL);
    INSERT INTO public.pg1_unrelated_marker VALUES(1,'retained-private-guard-fixture');
    CREATE FUNCTION public.pg1_synthetic_legacy_boolean() RETURNS boolean LANGUAGE sql IMMUTABLE AS $$ SELECT true $$;`)
  await resetHumans(owner)
  const installer = await connect(cluster.user, 'postgres')
  const human = await connect(LOGIN.human, 'authenticated')
  await setClaims(human, claims())
  await observer.query("SET statement_timeout='1s'; SET lock_timeout='1s'")
  // Only SQL NULL versus the documented default owner ACL is canonicalized here.
  // Extra grantees, grantors and rights remain visible; no candidate ACL is repaired.
  const snapshot = async () => ({
    schema: await owner.query(`SELECT oid::text,nspowner::text,COALESCE(nspacl,pg_catalog.acldefault('n',nspowner))::text AS nspacl,pg_catalog.obj_description(oid,'pg_namespace') AS description
      FROM pg_catalog.pg_namespace WHERE nspname='jetnity_ot_auth' ORDER BY oid`),
    functions: await owner.query(`SELECT p.proname,p.proowner::text,p.proacl::text,p.proconfig::text,p.prosecdef::text,p.provolatile::text,p.proparallel::text,
      pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') AS body_hash,
      pg_catalog.obj_description(p.oid,'pg_proc') AS description
      FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='jetnity_ot_auth' ORDER BY p.proname`),
    objects: await owner.query(`SELECT c.relname,c.relkind::text FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='jetnity_ot_auth' ORDER BY c.relname`),
  })
  const unrelated = () => owner.query('SELECT id::text,value FROM public.pg1_unrelated_marker ORDER BY id')
  const history = () => owner.query(`SELECT
    (SELECT count(*)::text FROM official_v3_method_private.revisions_v1) AS revisions,
    (SELECT count(*)::text FROM official_v3_method_private.heads_v1) AS heads,
    (SELECT count(*)::text FROM official_v3_method_private.operations_v1) AS operations`)
  const bindRecovery = async (oid?: string, context = 'root-verified-unbound-quiescent-v1') => {
    const actual = oid ?? (await snapshot()).schema[0]?.oid
    assert.ok(actual)
    await installer.query("SELECT pg_catalog.set_config('jetnity.pg1_recovery_context',$1,false) AS recovery_context,pg_catalog.set_config('jetnity.pg1_recovery_namespace_oid',$2,false) AS recovery_namespace_oid",
      [pgText(context), pgText(actual)])
  }
  let operation = 0
  const stage = (binding: Ma1MethodBinding, connection = human) => connection.query(STAGE,
    values([ma1Operation(++operation),binding.methodId,binding.revision,binding.methodDigest,binding.packageDigest,null]))
  return { cluster, owner, observer, installer, human, connections, identities, connect, snapshot, unrelated, history, bindRecovery, stage,
    op: () => ma1Operation(++operation) }
}
type Fixture = Awaited<ReturnType<typeof fixture>>
async function waitUntil(lifetime: OwnedTestLifetime, predicate: () => Promise<boolean>, message: string, milliseconds = 3000) {
  const until = performance.now() + milliseconds
  do { if (await predicate()) return; await lifetime.wait(10) } while (performance.now() < until)
  assert.fail(message)
}
async function waitBlocked(f: Fixture, lifetime: OwnedTestLifetime, caller: LocalPgConnection, holder: LocalPgConnection, pending: () => boolean) {
  const c = f.identities.get(caller)!, h = f.identities.get(holder)!
  await waitUntil(lifetime, async () => {
    const rows = await f.observer.query(`SELECT a.wait_event_type,a.query,
      ($3::integer=ANY(pg_catalog.pg_blocking_pids(a.pid)))::text AS actual_holder
      FROM pg_catalog.pg_stat_activity a WHERE a.pid=$1::integer AND a.backend_start=$2::timestamptz`,
    [pgText(c.pid,23),pgText(c.birth),pgText(h.pid,23)])
    return !pending() && rows.length === 1 && rows[0]!.wait_event_type === 'Lock' && rows[0]!.query === STAGE && rows[0]!.actual_holder === 'true'
  }, 'actual method-lock wait was not observed')
}

async function cleanupWitness(parent: OwnedTestLifetime, mode: 'failure' | 'timeout') {
  const controller = new AbortController()
  const marker = Error('pg1_expected_' + mode)
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
      failure = failed ? new AggregateError([failure, error], 'pg1 witness and cleanup failed') : error
      failed = true
    }
  }
  if (failed) throw failure
  assert.equal(expectedBody, true); assert.equal(timerFired, mode === 'timeout')
  assert.ok(terminal)
  return { mode, actualWaitObserved: true, originalQueryJoined: true, timerFired, terminal }
}

export async function runPrivateOwnerGuardsNative(t: TestContext): Promise<void> {
  const started = performance.now(), cutoff = new AbortController()
  const timer = setTimeout(() => cutoff.abort(Error('pg1_effect_budget_expired')), EFFECT_MS)
  const lifetime = new OwnedTestLifetime(AbortSignal.any([t.signal, cutoff.signal]))
  lifetime.installConnectOwnership()
  const completed: string[] = []
  const cleanup: Awaited<ReturnType<typeof cleanupWitness>>[] = []
  let f: Fixture | undefined, failed = false, failure: unknown, terminal: Terminal | undefined
  let effectEnded = started, cleanupEnded = started
  const group = async (name: string, work: () => Promise<void>) => {
    lifetime.check()
    let passed = false
    await t.test(name, async () => { await work(); lifetime.check(); passed = true })
    assert.equal(passed, true, name + ' did not complete')
    completed.push(name)
  }
  try {
    for (const [path] of SOURCE_PINS) source(path)
    for (const guard of GUARDS) declaration(guard.name)
    f = await fixture(lifetime)
    const db = f
    const unrelated = await db.unrelated()
    await group('PG1-01 exact creator defaults, collision and inherited rights refuse atomically', async () => {
      await assert.rejects(transaction(db.owner, install), code('P7701'))
      assert.deepEqual((await db.snapshot()).schema, [])
      await db.owner.query("CREATE SCHEMA jetnity_ot_auth AUTHORIZATION postgres; COMMENT ON SCHEMA jetnity_ot_auth IS 'foreign-fixture-object'")
      const collision = await db.snapshot()
      await assert.rejects(transaction(db.installer, install), code('P7702'))
      assert.deepEqual(await db.snapshot(), collision)
      await db.owner.query('DROP SCHEMA jetnity_ot_auth RESTRICT')
      const defaultSnapshot = () => db.owner.query("SELECT defaclrole::text,defaclnamespace::text,defaclobjtype::text,defaclacl::text FROM pg_catalog.pg_default_acl WHERE defaclrole='postgres'::regrole ORDER BY 1,2,3")
      for (const [object, privilege] of [['FUNCTIONS','EXECUTE'],['SCHEMAS','USAGE']] as const) {
        const clean = await defaultSnapshot()
        await db.installer.query(`ALTER DEFAULT PRIVILEGES GRANT ${privilege} ON ${object} TO ot_pg1_alien`)
        const foreign = await defaultSnapshot()
        assert.notDeepEqual(foreign, clean)
        await assert.rejects(transaction(db.installer, install), code('P7702'))
        assert.deepEqual(await defaultSnapshot(), foreign)
        assert.deepEqual((await db.snapshot()).schema, [])
        await db.installer.query(`ALTER DEFAULT PRIVILEGES REVOKE ${privilege} ON ${object} FROM ot_pg1_alien`)
        assert.deepEqual(await defaultSnapshot(), clean)
      }
      await db.owner.query('GRANT postgres TO authenticated')
      await assert.rejects(transaction(db.installer, install), code('P7701'))
      assert.equal((await db.owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_auth_members WHERE roleid='postgres'::regrole AND member='authenticated'::regrole"))[0]!.n, '1')
      await db.owner.query('REVOKE postgres FROM authenticated')
      assert.deepEqual((await db.snapshot()).schema, [])
      // Same complete candidate, split at a unique transaction-internal boundary.
      // Only a fixture-owned extra grant is injected before its own ACL validator.
      const splitMarker = 'DO $pg1_creator_acl$'
      const at = install.indexOf(splitMarker)
      assert.ok(at > 0); assert.equal(install.indexOf(splitMarker, at + splitMarker.length), -1)
      const prefix = install.slice(0, at), suffix = install.slice(at)
      assert.equal(prefix + suffix, install)
      try {
        await db.installer.query(prefix)
        await db.installer.query('GRANT EXECUTE ON FUNCTION jetnity_ot_auth.own_active_session_v1() TO ot_pg1_alien')
        await assert.rejects(db.installer.query(suffix), code('P7702'))
      } finally { await db.installer.query('ROLLBACK') }
      assert.deepEqual((await db.snapshot()).schema, [])
      assert.deepEqual(await db.unrelated(), unrelated)
    })
    await transaction(db.installer, install)
    await group('PG1-02 both exact private guards and direct application-role denials', async () => {
      const helperRows = await db.owner.query(`SELECT p.proname AS name,pg_catalog.octet_length(p.prosrc)::text AS bytes,
        pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') AS sha256
        FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='auth' AND p.proname IN ('jwt','uid') AND p.pronargs=0 ORDER BY p.proname`)
      assert.deepEqual(helperRows, AUTH_HELPER_BODY_PINS.map(p => ({ name: p.name, bytes: String(p.bytes), sha256: p.sha256 })))
      const snapshot = await db.snapshot()
      assert.equal(snapshot.schema.length, 1); assert.equal(snapshot.functions.length, 2); assert.deepEqual(snapshot.objects, [])
      const ownerOid = (await db.owner.query("SELECT oid::text FROM pg_catalog.pg_roles WHERE rolname='postgres'"))[0]?.oid
      assert.ok(ownerOid)
      assert.equal(snapshot.schema[0]!.nspowner, ownerOid)
      assert.equal(snapshot.schema[0]!.description, 'jetnity:v3-private-owner-guards:1:unbound')
      const acls = await db.owner.query(`SELECT 'schema'::text AS object,a.grantee::text,a.grantor::text,a.privilege_type,a.is_grantable::text
        FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
        WHERE n.nspname='jetnity_ot_auth'
        UNION ALL
        SELECT p.proname::text,a.grantee::text,a.grantor::text,a.privilege_type,a.is_grantable::text
        FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
        CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
        WHERE n.nspname='jetnity_ot_auth' ORDER BY object,privilege_type`)
      assert.deepEqual(acls, [
        { object: 'own_active_session_v1', grantee: ownerOid, grantor: ownerOid, privilege_type: 'EXECUTE', is_grantable: 'false' },
        { object: 'require_current_owner_session_v1', grantee: ownerOid, grantor: ownerOid, privilege_type: 'EXECUTE', is_grantable: 'false' },
        { object: 'schema', grantee: ownerOid, grantor: ownerOid, privilege_type: 'CREATE', is_grantable: 'false' },
        { object: 'schema', grantee: ownerOid, grantor: ownerOid, privilege_type: 'USAGE', is_grantable: 'false' },
      ])
      const shapes = await db.owner.query(`SELECT p.proname,p.prokind::text,p.proretset::text,p.proisstrict::text,p.proleakproof::text,
        p.pronargs::text,p.pronargdefaults::text,p.prorettype::regtype::text AS result_type,l.lanname
        FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang
        WHERE n.nspname='jetnity_ot_auth' ORDER BY p.proname`)
      assert.deepEqual(shapes, GUARDS.map(g => ({ proname: g.name, prokind: 'f', proretset: 'false', proisstrict: 'false',
        proleakproof: 'false', pronargs: '0', pronargdefaults: '0', result_type: g.result === 'bool' ? 'boolean' : 'void', lanname: 'plpgsql' })))
      for (const guard of GUARDS) {
        const row = snapshot.functions.find(x => x.proname === guard.name)!
        assert.ok(row)
        assert.equal(row.proowner, ownerOid)
        assert.equal(row.body_hash, guard.bodyHash); assert.equal(row.prosecdef, 'true')
        assert.equal(row.provolatile, guard.volatility); assert.equal(row.proparallel, 'u')
        assert.equal(row.proconfig, guard.config)
        assert.equal(row.description, 'jetnity:v3-private-owner-guards:1:unbound')
      }
      const roles = [[LOGIN.anon,'anon'],[LOGIN.human,'authenticated'],[LOGIN.service,'service_role']] as const
      for (const [login, role] of roles) {
        const caller = await db.connect(login, role)
        await setClaims(caller, claims())
        assert.deepEqual(await caller.query('SELECT session_user::text AS login,current_user::text AS role'), [{ login, role }])
        const privileges = await db.owner.query(`SELECT pg_catalog.has_schema_privilege($1,'jetnity_ot_auth','USAGE')::text AS usage,
          pg_catalog.has_function_privilege($1,'jetnity_ot_auth.own_active_session_v1()','EXECUTE')::text AS observer,
          pg_catalog.has_function_privilege($1,'jetnity_ot_auth.require_current_owner_session_v1()','EXECUTE')::text AS locker`, [pgText(role)])
        assert.deepEqual(privileges, [{ usage: 'false', observer: 'false', locker: 'false' }])
        for (const guard of GUARDS) await assert.rejects(caller.query('SELECT jetnity_ot_auth.' + guard.name + '()'), code('42501'))
        // A temporary fixture-only USAGE right isolates function EXECUTE denial.
        await db.installer.query('GRANT USAGE ON SCHEMA jetnity_ot_auth TO ' + role)
        try {
          for (const guard of GUARDS) await assert.rejects(caller.query('SELECT jetnity_ot_auth.' + guard.name + '()'), code('42501'))
        } finally { await db.installer.query('REVOKE USAGE ON SCHEMA jetnity_ot_auth FROM ' + role); caller.close() }
      }
      assert.deepEqual(await db.snapshot(), snapshot)
      await setClaims(db.installer, claims())
      assert.deepEqual(await db.installer.query('SELECT jetnity_ot_auth.own_active_session_v1()::text AS permitted'), [{ permitted: 'true' }])
      await db.installer.query('BEGIN')
      try { await db.installer.query('SELECT jetnity_ot_auth.require_current_owner_session_v1()') }
      finally { await db.installer.query('ROLLBACK') }
      assert.deepEqual(await db.unrelated(), unrelated)
    })
    await group('PG1-03 guarded unused removal refuses missing context, drift, foreign rights and consumers', async () => {
      const exact = await db.snapshot()
      await assert.rejects(transaction(db.installer, recovery), code('P7704'))
      assert.deepEqual(await db.snapshot(), exact)
      await db.bindRecovery('0')
      await assert.rejects(transaction(db.installer, recovery), code('P7704'))
      await db.bindRecovery()
      const changes = [
        ['GRANT EXECUTE ON FUNCTION jetnity_ot_auth.own_active_session_v1() TO ot_pg1_alien',
          'REVOKE EXECUTE ON FUNCTION jetnity_ot_auth.own_active_session_v1() FROM ot_pg1_alien'],
        ['GRANT USAGE ON SCHEMA jetnity_ot_auth TO ot_pg1_alien', 'REVOKE USAGE ON SCHEMA jetnity_ot_auth FROM ot_pg1_alien'],
        ['CREATE TABLE jetnity_ot_auth.foreign_fixture(id integer)', 'DROP TABLE jetnity_ot_auth.foreign_fixture RESTRICT'],
      ] as const
      for (const [change, restore] of changes) {
        await db.installer.query(change)
        const changed = await db.snapshot(); assert.notDeepEqual(changed, exact)
        await assert.rejects(transaction(db.installer, recovery), code('P7703'))
        assert.deepEqual(await db.snapshot(), changed)
        await db.installer.query(restore)
        assert.deepEqual(await db.snapshot(), exact)
      }
      const original = declaration('own_active_session_v1').replace('create function', 'create or replace function')
      const drift = original.replace('claims jsonb := auth.jwt();', 'claims jsonb := auth.jwt(); -- fixture source drift')
      assert.notEqual(drift, original)
      await db.installer.query(drift)
      const changed = await db.snapshot()
      await assert.rejects(transaction(db.installer, recovery), code('P7703'))
      assert.deepEqual(await db.snapshot(), changed)
      await db.installer.query(original); assert.deepEqual(await db.snapshot(), exact)
      for (const [change, restore] of [
        ['CREATE SCHEMA official_v3_pg1_consumer', 'DROP SCHEMA official_v3_pg1_consumer RESTRICT'],
        ['CREATE ROLE ot_v3_pg1_consumer NOLOGIN', 'DROP ROLE ot_v3_pg1_consumer'],
      ]) {
        await db.owner.query(change)
        await assert.rejects(transaction(db.installer, recovery), code('P7704'))
        assert.deepEqual(await db.snapshot(), exact)
        await db.owner.query(restore)
      }
      await transaction(db.installer, recovery)
      assert.deepEqual(await db.snapshot(), { schema: [], functions: [], objects: [] })
      assert.deepEqual(await db.unrelated(), unrelated)
      const oldOid = exact.schema[0]!.oid!
      await transaction(db.installer, install)
      assert.notEqual((await db.snapshot()).schema[0]!.oid, oldOid)
      await db.bindRecovery(oldOid)
      await assert.rejects(transaction(db.installer, recovery), code('P7704'))
      await db.bindRecovery()
    })
    await transaction(db.owner, method)
    await db.owner.query(`GRANT ot_v3_method_reader TO ${LOGIN.reader}`)
    const reader = await db.connect(LOGIN.reader, 'ot_v3_method_reader')
    await group('PG1-04 unchanged MA1 calls the private Definer chain and retains real synthetic history', async () => {
      const before = await db.snapshot()
      await assert.rejects(transaction(db.installer, recovery), code('P7704'))
      assert.deepEqual(await db.snapshot(), before)
      const binding = ma1SyntheticTuple('pg1-positive')
      const staged = acknowledgment(await db.stage(binding))
      assert.equal(staged.status, 'recorded'); assert.equal(staged.actorId, AUTH.owner)
      const approved = acknowledgment(await db.human.query(APPROVE, values([db.op(),binding.methodId,1,binding.methodDigest,binding.packageDigest,
        null,null,null,0,null,'until_revoked',null])))
      assert.equal(approved.status, 'recorded'); assert.equal(approved.after?.status, 'approved'); assert.equal(approved.after?.epoch, 1)
      const read = () => reader.query(READ, [pgText(binding.methodId),pgText('1',23),pgText(binding.methodDigest),pgText(binding.packageDigest),pgText(new Date().toISOString())])
      assert.deepEqual(await read(), [{ status: 'approved', epoch: '1' }])
      const retained = await db.history()
      assert.deepEqual(retained, [{ revisions: '1', heads: '1', operations: '2' }])
      await assert.rejects(transaction(db.installer, recovery), code('P7704'))
      assert.deepEqual(await db.history(), retained); assert.deepEqual(await db.snapshot(), before)
      const revoked = acknowledgment(await db.human.query(REVOKE, values([db.op(),binding.methodId,1,binding.methodDigest,binding.packageDigest,1])))
      assert.equal(revoked.status, 'recorded'); assert.equal(revoked.after?.status, 'revoked')
      assert.deepEqual(await read(), [{ status: 'revoked', epoch: '2' }])
      assert.deepEqual(await db.history(), [{ revisions: '1', heads: '1', operations: '3' }])
    })

    await group('PG1-05 malformed, foreign and expired claims never write method history', async () => {
      const before = await db.history()
      const negatives: readonly { name: string; value: unknown }[] = [
        { name: 'missing', value: {} }, { name: 'null', value: null }, { name: 'array', value: [] },
        { name: 'role', value: claims({ role: 'service_role' }) }, { name: 'aal', value: claims({ aal: 'aal1' }) },
        { name: 'missing-session', value: claims({ session_id: null }) },
        { name: 'foreign-session', value: claims({ session_id: AUTH.foreignSession }) },
        { name: 'foreign-user', value: claims({ sub: AUTH.other }) },
        { name: 'malformed-user', value: claims({ sub: 'not-a-uuid' }) },
        { name: 'unknown-user', value: claims({ sub: '44444444-4444-4444-8444-444444444444' }) },
        { name: 'expired', value: claims({ exp: 0 }) }, { name: 'string-exp', value: claims({ exp: '9999999999' }) },
      ]
      for (const negative of negatives) {
        await setClaims(db.human, negative.value)
        await assert.rejects(db.stage(ma1SyntheticTuple('pg1-claims-' + negative.name)), code('42501'))
        assert.deepEqual(await db.history(), before)
      }
      // Exercise actual helper precedence, rather than assuming auth.uid() mirrors jwt.sub.
      await setClaims(db.human, claims())
      await db.human.query("SELECT pg_catalog.set_config('request.jwt.claim.sub',$1,false)", [pgText(AUTH.other)])
      await assert.rejects(db.stage(ma1SyntheticTuple('pg1-uid-mismatch')), code('42501'))
      assert.deepEqual(await db.history(), before)
      await db.human.query("SELECT pg_catalog.set_config('request.jwt.claim.sub','',false) AS cleared_claim_sub,pg_catalog.set_config('request.jwt.claim',$1,false) AS selected_claim",
        [pgText(JSON.stringify(claims({ sub: AUTH.other, session_id: AUTH.foreignSession })))])
      await assert.rejects(db.stage(ma1SyntheticTuple('pg1-claim-precedence')), code('42501'))
      assert.deepEqual(await db.history(), before)
      await db.human.query("SELECT pg_catalog.set_config('request.jwt.claim','',false)")
      await db.human.query("SELECT pg_catalog.set_config('request.jwt.claims','{invalid-json',false)")
      await assert.rejects(db.stage(ma1SyntheticTuple('pg1-invalid-json')), code('22P02'))
      assert.deepEqual(await db.history(), before)
      await setClaims(db.human, claims())
    })
    await group('PG1-06 current account, session and profile invalidations retain all method history', async () => {
      const before = await db.history()
      const invalidations = [
        `UPDATE auth.users SET deleted_at=clock_timestamp() WHERE id='${AUTH.owner}'`,
        `UPDATE auth.users SET banned_until=clock_timestamp()+interval '1 hour' WHERE id='${AUTH.owner}'`,
        `UPDATE auth.users SET is_anonymous=true WHERE id='${AUTH.owner}'`,
        `UPDATE auth.sessions SET not_after=clock_timestamp() WHERE id='${AUTH.session}'`,
        `UPDATE auth.sessions SET aal='aal1' WHERE id='${AUTH.session}'`,
        `UPDATE auth.sessions SET user_id='${AUTH.other}' WHERE id='${AUTH.session}'`,
        `DELETE FROM auth.sessions WHERE id='${AUTH.session}'`,
        `UPDATE public.profiles SET status='disabled' WHERE user_id='${AUTH.owner}'`,
        `UPDATE public.profiles SET role='admin' WHERE user_id='${AUTH.owner}'`,
        `DELETE FROM public.profiles WHERE user_id='${AUTH.owner}'`,
        `DELETE FROM auth.users WHERE id='${AUTH.owner}'`,
      ]
      for (let index = 0; index < invalidations.length; index++) {
        await resetHumans(db.owner); await db.owner.query(invalidations[index]!)
        await assert.rejects(db.stage(ma1SyntheticTuple('pg1-state-' + index)), code('42501'))
        assert.deepEqual(await db.history(), before)
      }
      await resetHumans(db.owner)
      await setClaims(db.human, claims({ session_id: AUTH.foreignSession }))
      assert.deepEqual(await db.human.query('SELECT public.pg1_synthetic_legacy_boolean()::text AS legacy'), [{ legacy: 'true' }])
      await assert.rejects(db.stage(ma1SyntheticTuple('pg1-legacy-boolean')), code('42501'))
      assert.deepEqual(await db.history(), before)
      await setClaims(db.human, claims())
      assert.deepEqual(await db.unrelated(), unrelated)
    })
    await group('PG1-07 actual user, session and profile row conflicts refuse NOWAIT', async () => {
      const before = await db.history(), holder = await db.connect()
      try {
        for (const [index, lock] of [
          `SELECT id FROM auth.users WHERE id='${AUTH.owner}' FOR UPDATE`,
          `SELECT id FROM auth.sessions WHERE id='${AUTH.session}' FOR UPDATE`,
          `SELECT user_id FROM public.profiles WHERE user_id='${AUTH.owner}' FOR UPDATE`,
        ].entries()) {
          await holder.query('BEGIN')
          try {
            assert.equal((await holder.query(lock)).length, 1)
            await assert.rejects(db.stage(ma1SyntheticTuple('pg1-nowait-' + index)), code('55P03'))
            assert.deepEqual(await db.history(), before)
          } finally { await holder.query('ROLLBACK') }
        }
      } finally { holder.close() }
    })
    await group('PG1-08 method wait precedes fresh session expiry and profile checks', async () => {
      const before = await db.history(), holder = await db.connect()
      try {
        for (const kind of ['session-expiry','profile-disabled'] as const) {
          await resetHumans(db.owner)
          const binding = ma1SyntheticTuple('pg1-wait-' + kind)
          await holder.query('BEGIN')
          await holder.query('SELECT pg_catalog.pg_advisory_xact_lock(750102,pg_catalog.hashtext($1::text))', [pgText(binding.methodId)])
          const pending = observe(db.stage(binding))
          try {
            await waitBlocked(db, lifetime, db.human, holder, pending.settled)
            const identity = db.identities.get(db.human)!
            const began = (await db.observer.query('SELECT query_start::text AS began FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',
              [pgText(identity.pid,23),pgText(identity.birth)]))[0]?.began
            assert.ok(began)
            if (kind === 'session-expiry') {
              const expired = (await db.owner.query(`UPDATE auth.sessions SET not_after=clock_timestamp() WHERE id='${AUTH.session}' RETURNING not_after::text AS expired`))[0]?.expired
              assert.ok(expired)
              assert.deepEqual(await db.owner.query('SELECT ($1::timestamptz<$2::timestamptz)::text AS after_start,(clock_timestamp()>$2::timestamptz)::text AS now_expired',
                [pgText(began),pgText(expired)]), [{ after_start: 'true', now_expired: 'true' }])
            } else await db.owner.query(`UPDATE public.profiles SET status='disabled' WHERE user_id='${AUTH.owner}'`)
            await holder.query('ROLLBACK')
            const outcome = await pending.result
            assert.equal(outcome.ok, false)
            if (outcome.ok) assert.fail('a changed session/profile was admitted')
            assert.ok(code('42501')(outcome.error))
            assert.deepEqual(await db.history(), before)
          } finally {
            await holder.query('ROLLBACK')
            await pending.result
          }
        }
      } finally { holder.close(); await resetHumans(db.owner) }
      assert.deepEqual(await db.unrelated(), unrelated)
    })
    await group('PG1-09 actual failed and timed-out query ownership drains and stops its clusters', async () => {
      cleanup.push(await cleanupWitness(lifetime, 'failure'))
      cleanup.push(await cleanupWitness(lifetime, 'timeout'))
    })
    assert.equal(completed.length, 9)
    assert.deepEqual(await db.history(), [{ revisions: '1', heads: '1', operations: '3' }])
    assert.deepEqual(await db.unrelated(), unrelated)
  } catch (error) { failed = true; failure = error }
  finally {
    effectEnded = performance.now()
    clearTimeout(timer)
    try {
      terminal = await lifetime.dispose()
      assert.equal(terminal.pending, 0); assert.equal(terminal.started, terminal.settled)
      assert.equal(terminal.connections, terminal.closed); assert.equal(terminal.stoppedClusters, 1)
      assert.ok(f && !existsSync(f.cluster.root), 'main owned cluster must be absent')
    } catch (error) {
      failure = failed ? new AggregateError([failure, error], 'pg1 primary and cleanup failed') : error
      failed = true
    }
    cleanupEnded = performance.now()
  }
  const receipt = {
    schema: 'jetnity.pg1.native.v1', status: failed ? 'failed' : 'passed', syntheticOnly: true,
    hostedInstall: false, signedOwnerRequest: false, methodApprovalIsSynthetic: true,
    source: { install: SOURCE_PINS[0][1], recovery: SOURCE_PINS[1][1], ma1: SOURCE_PINS[2][1],
      guardBodies: GUARDS.map(g => ({ name: g.name, sha256: g.bodyHash })) },
    completed, effectLimitMs: EFFECT_MS, effectMs: Math.ceil(effectEnded - started),
    cleanupMs: Math.ceil(cleanupEnded - effectEnded), elapsedMs: Math.ceil(cleanupEnded - started),
    main: terminal ?? null, cleanupWitnesses: cleanup,
  }
  assert.ok(Buffer.byteLength(JSON.stringify(receipt)) < 8192)
  t.diagnostic('PG1_NATIVE_RECEIPT ' + JSON.stringify(receipt))
  if (failed) throw failure
}
