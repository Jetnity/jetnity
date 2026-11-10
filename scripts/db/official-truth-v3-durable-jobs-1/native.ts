// Mandatory CI-only PostgreSQL proof. No availability skip, hosted target or local runner.
import assert from 'node:assert/strict'
import { fork, type ChildProcess } from 'node:child_process'
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { startLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { installMa1AuthFixture, MA1_AUTH, ma1Claims } from '../official-truth-v3-method-authority-1/auth-fixture'
import { ma1Operation } from '../official-truth-v3-method-authority-1/fixtures'
import { createMa1NativeExecutor } from '../official-truth-v3-method-authority-1/native-adapter'
import { s1Fixture } from '../official-truth-v3-intake-store-1/fixtures'
import { createV3PostgresDurableJobs } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import { readMa1CurrentRequest } from '../../../lib/readiness/official-truth-product-v3/method/contract'
import { createV3ProposalIntakeStore } from '../../../lib/readiness/official-truth-product-v3/storage/intake-server'
import { createV3ImportCoordinator } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import { readV3RetainableProposal } from '../../../lib/readiness/official-truth-product-v3/storage/proposal-bytes'
import { createV3WorkIdentity, readV3GlobalRuleContext, type V3GlobalRuleContext } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3ManagedJobRecord, type V3QueueCommit, type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { ids } from '../../../lib/readiness/official-truth-product-v3/monitor/test-support'
import { key } from '../../../lib/readiness/official-truth-product-v3/monitor/internal'
import { readM04Command, readM04NativeReply, createM04SubjectIdentity, type M04FixedRequest, type M04Operation, type M04Config } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { m04Fixture, m04Canonical, M04_TEST_BINDING, M04_TEST_LOGIN } from './fixtures'
import { m04IdentityVectors, m04MaximumContext, m04WireUpperBounds } from './generate-identity-vectors'
import { createM04NativeExecutors, M04_FIXED_SQL, M04_S1_STATEMENTS } from './native-adapter'

const candidate = readFileSync(new URL('./jobs-candidate.sql', import.meta.url), 'utf8')
const rollback = readFileSync(new URL('./jobs-candidate.rollback.sql', import.meta.url), 'utf8')
const s1Candidate = readFileSync(new URL('../official-truth-v3-intake-store-1/intake-candidate.sql', import.meta.url), 'utf8')
const s1Rollback = readFileSync(new URL('../official-truth-v3-intake-store-1/intake-candidate.rollback.sql', import.meta.url), 'utf8')
const ma1Candidate = readFileSync(new URL('../official-truth-v3-method-authority-1/method-candidate.sql', import.meta.url), 'utf8')
const ma1Rollback = readFileSync(new URL('../official-truth-v3-method-authority-1/method-candidate.rollback.sql', import.meta.url), 'utf8')
const binding = M04_TEST_BINDING
const signal = () => new AbortController().signal
const digest = (s: string) => createHash('sha256').update(s).digest('hex')
const text = (values: readonly (string | number | null)[]) => values.map(v => pgText(v === null ? '' : String(v)))
const code = (wanted: string) => (e: unknown) => e instanceof LocalPgError && e.code === wanted
const result = (rows: PgRows): Record<string, unknown> => { assert.equal(rows.length, 1); assert.ok(rows[0]?.result); return JSON.parse(rows[0]!.result!) }
const ID = 'SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_catalog.pg_stat_activity WHERE pid=pg_backend_pid()'
type Identity = { pid: string; birth: string }
type Native = Awaited<ReturnType<typeof createM04NativeExecutors>>
type MethodNative = Awaited<ReturnType<typeof createMa1NativeExecutor>>
const schemaNames = ['official_v3_intake_private', 'official_v3_intake_api', 'official_v3_method_private', 'official_v3_method_api', 'official_v3_jobs_private', 'official_v3_jobs_api']
const catalogSQL = `SELECT jsonb_build_object(
 'schemas',(SELECT jsonb_agg(to_jsonb(n) ORDER BY n.oid) FROM pg_catalog.pg_namespace n WHERE n.nspname=ANY($1::text[])),
 'relations',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1::text[])),
 'columns',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attrelid,a.attnum) FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1::text[]) AND a.attnum>0),
 'constraints',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON n.oid=c.connamespace WHERE n.nspname=ANY($1::text[])),
 'indexes',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1::text[])),
 'functions',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=ANY($1::text[])),
 'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1::text[])),
 'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1::text[])),
 'dependencies',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype) FROM pg_catalog.pg_depend d WHERE d.objid IN (SELECT p.oid FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=ANY($1::text[])) OR d.refobjid IN (SELECT p.oid FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=ANY($1::text[]))),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_roles r WHERE r.rolname='postgres' OR r.rolname LIKE 'ot_%'),
 'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.roleid,m.member,m.grantor) FROM pg_catalog.pg_auth_members m),
 'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d))::text AS snapshot`
const schemaParameter = pgText('{' + schemaNames.join(',') + '}')
async function catalog(owner: LocalPgConnection) { const rows = await owner.query(catalogSQL, [schemaParameter]); assert.ok(rows[0]?.snapshot); return rows[0]!.snapshot! }
function unchangedPredecessors(beforeText: string, afterText: string) {
  const before = JSON.parse(beforeText), after = JSON.parse(afterText)
  for (const name of ['schemas', 'relations', 'columns', 'constraints', 'indexes', 'functions', 'triggers', 'policies', 'roles', 'dependencies']) {
    const prior = (before[name] ?? []) as Record<string, unknown>[]
    const field = name === 'columns' ? 'attrelid' : name === 'indexes' ? 'indexrelid' : name === 'dependencies' ? 'objid' : 'oid'
    const ids = new Set(prior.map(row => row[field]))
    assert.deepEqual((after[name] ?? []).filter((row: Record<string, unknown>) => ids.has(row[field])), prior,
      'candidate cannot change predecessor ' + name)
  }
  assert.deepEqual(after.defaults, before.defaults)
  assert.deepEqual(after.memberships, before.memberships)
}
async function finiteSecurityInventory(owner: LocalPgConnection) {
  // Independent finite inventory from frozen Plan §§Tables/Functions, with T02.
  // Expected signatures/privileges are not read back from catalog_binding_v1.
  const pure = ['exact_keys_v1(jsonb,text[]):boolean', 'unique_json_v1(json,integer):boolean',
    'nodes_v1(jsonb,integer,integer,integer):integer', 'canonical_v1(jsonb,integer):text', 'wire_v1(text):jsonb',
    'civil_date_v1(text):boolean', 'timestamp_v1(text):timestamptz', 'predicate_v1(jsonb):jsonb',
    'expression_v1(jsonb,boolean,integer):jsonb', 'context_v1(jsonb):jsonb', 'subject_v1(text,jsonb):jsonb',
    'job_v1(jsonb):jsonb', 'command_v1(jsonb):jsonb', 'reference_v1(jsonb):jsonb']
  const stateful = ['transition_v1(jsonb,jsonb,jsonb):void', 'immutable_v1():trigger', 'assert_catalog_v1():void',
    'assert_history_v1(text):void', 'consume_s1_v1(jsonb,jsonb,jsonb,text):void',
    ...['queue_read', 'queue_confirm', 'queue_cas', 'execution_read', 'execution_start', 'execution_prepare']
      .map(name => `tx_${name}_v1(jsonb,jsonb,integer,integer,timestamptz):jsonb`)]
  const bridges = ['s1_read_v1(jsonb,text,integer):jsonb', 's1_shape_v1(jsonb,text):boolean',
    'ma1_require_v1(text,integer,text,text,integer):void']
  const api = 'execute_v1(text,text,integer,text,text,integer,integer,text):jsonb'
  const expected = [...pure, ...stateful, ...bridges, api].sort()
  assert.equal(expected.length, 29)
  const rows = await owner.query(`SELECT p.proname, n.nspname, pg_catalog.oidvectortypes(p.proargtypes) AS args,
    p.prorettype::pg_catalog.regtype::text AS result, pg_catalog.pg_get_userbyid(p.proowner) AS owner,
    p.prosecdef::text AS definer,p.provolatile,p.proparallel,p.proisstrict::text AS strict,p.prokind,
    p.pronargdefaults::text AS defaults,p.provariadic::text AS variadic,p.proargmodes::text AS modes,
    p.proconfig::text AS config,l.lanname,
    (SELECT jsonb_agg(jsonb_build_object('grantee',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(a.grantee) END,
      'grantor',pg_catalog.pg_get_userbyid(a.grantor),'privilege',a.privilege_type,'grantable',a.is_grantable) ORDER BY a.grantee)
      FROM pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a)::text AS acl
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    JOIN pg_catalog.pg_language l ON l.oid=p.prolang WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')`)
  const normalized = (value: string) => value.replaceAll('timestamp with time zone', 'timestamptz').replaceAll(' ', '')
  assert.deepEqual(rows.map(row => row.proname + '(' + normalized(row.args!) + '):' + normalized(row.result!)).sort(), expected)
  for (const row of rows) {
    const name = row.proname!, s1 = name === 's1_read_v1' || name === 's1_shape_v1', isApi = name === 'execute_v1'
    const expectedOwner = s1 ? 'ot_v3_intake_owner' : 'postgres'
    assert.equal(row.owner, expectedOwner); assert.equal(row.nspname, isApi ? 'official_v3_jobs_api' : 'official_v3_jobs_private')
    assert.equal(row.definer, String(s1 || name === 'ma1_require_v1' || isApi))
    assert.equal(row.provolatile, pure.some(value => value.startsWith(name + '(')) || name === 's1_shape_v1' || name === 'transition_v1' ? 'i' : 'v')
    assert.equal(row.lanname, name === 'exact_keys_v1' || bridges.some(value => value.startsWith(name + '(')) ? 'sql' : 'plpgsql')
    assert.equal(row.proparallel, 'u'); assert.equal(row.strict, 'false'); assert.equal(row.prokind, 'f')
    assert.equal(row.defaults, '0'); assert.equal(row.variadic, '0'); assert.equal(row.modes, null)
    assert.equal(row.config, '{"search_path=pg_catalog, pg_temp"}')
    const acl = JSON.parse(row.acl!) as { grantee: string; grantor: string; privilege: string; grantable: boolean }[]
    const grantees = s1 ? ['ot_v3_intake_owner', 'postgres'] : isApi ? ['ot_v3_jobs_caller', 'postgres'] : ['postgres']
    assert.deepEqual(acl.map(a => a.grantee).sort(), grantees.sort())
    assert.ok(acl.every(a => a.grantor === expectedOwner && a.privilege === 'EXECUTE' && !a.grantable))
  }
  const constraints = await owner.query(`SELECT c.conrelid::pg_catalog.regclass::text AS relation,c.contype,c.condeferrable::text AS deferred,
    c.condeferred::text AS initially,c.convalidated::text AS valid,c.confdeltype,c.confupdtype,
    CASE WHEN c.contype='f' THEN c.confrelid::pg_catalog.regclass::text END AS target,
    (SELECT string_agg(a.attname,',' ORDER BY u.ord) FROM unnest(c.conkey) WITH ORDINALITY u(num,ord)
      JOIN pg_catalog.pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=u.num) AS columns
    FROM pg_catalog.pg_constraint c WHERE c.connamespace='official_v3_jobs_private'::pg_catalog.regnamespace`)
  assert.ok(constraints.every(c => c.deferred === 'false' && c.initially === 'false' && c.valid === 'true'))
  const fks = constraints.filter(c => c.contype === 'f')
  assert.ok(fks.every(c => c.confdeltype === 'r' && c.confupdtype === 'r'))
  assert.deepEqual(fks.map(c => `${c.relation!.split('.').at(-1)}.${c.columns}->${c.target!.split('.').at(-1)}`).sort(), [
    'subjects_v1.slot_id->slots_v1', 'queue_operations_v1.job_key->subjects_v1',
    'execution_starts_v1.job_key->subjects_v1', 'execution_starts_v1.claim_operation_id->queue_operations_v1',
    'execution_results_v1.attempt_key->execution_starts_v1', 'execution_dispositions_v1.attempt_key->execution_starts_v1',
    'execution_dispositions_v1.queue_operation_id->queue_operations_v1',
  ].sort())
  assert.equal(constraints.filter(c => c.contype === 'p').length, 7)
  assert.equal(constraints.filter(c => c.contype === 'u').length, 6)
  assert.deepEqual(Object.fromEntries(['slots_v1', 'subjects_v1', 'queue_operations_v1', 'execution_starts_v1', 'execution_results_v1', 'execution_dispositions_v1', 'catalog_binding_v1']
    .map(name => [name, constraints.filter(c => c.contype === 'c' && c.relation!.endsWith('.' + name)).length])),
  { slots_v1: 1, subjects_v1: 6, queue_operations_v1: 6, execution_starts_v1: 3, execution_results_v1: 2, execution_dispositions_v1: 2, catalog_binding_v1: 1 })
  assert.equal(constraints.length, 41)
  const indexes = await owner.query(`SELECT x.relname,i.indisunique::text AS unique,i.indisprimary::text AS primary,
    i.indisvalid::text AS valid,i.indisready::text AS ready,i.indimmediate::text AS immediate,
    pg_catalog.pg_get_indexdef(i.indexrelid) AS definition FROM pg_catalog.pg_index i
    JOIN pg_catalog.pg_class x ON x.oid=i.indexrelid WHERE x.relnamespace='official_v3_jobs_private'::pg_catalog.regnamespace`)
  assert.deepEqual(indexes.map(i => i.relname).sort(), ['slots_v1_pkey','slots_v1_job_key_key','subjects_v1_pkey','subjects_v1_slot_id_key',
    'queue_operations_v1_pkey','queue_operations_v1_audit_reference_key','queue_operations_v1_new_cycle_job_id_key','queue_operations_subject_v1',
    'execution_starts_v1_pkey','execution_starts_v1_claim_operation_id_key','execution_starts_subject_v1','execution_results_v1_pkey',
    'execution_results_reference_v1','execution_dispositions_v1_pkey','execution_dispositions_v1_queue_operation_id_key','catalog_binding_v1_pkey'].sort())
  assert.ok(indexes.every(i => i.valid === 'true' && i.ready === 'true' && i.immediate === 'true'))
  assert.equal(indexes.filter(i => i.unique === 'true').length, 14)
  const resultIndex = indexes.find(i => i.relname === 'execution_results_reference_v1')!.definition!
  assert.match(resultIndex, /CASE/); assert.match(resultIndex, /rule_research/); assert.match(resultIndex, /decisionRef/)
  assert.match(resultIndex, /combination_discovery/); assert.match(resultIndex, /discoveryRef/); assert.doesNotMatch(resultIndex, /COALESCE/i)
  const guards = await owner.query(`SELECT t.tgname,t.tgtype::text AS type,t.tgdeferrable::text AS deferred,t.tginitdeferred::text AS initially,
    t.tgenabled,t.tgisinternal::text AS internal,t.tgfoid::pg_catalog.regprocedure::text AS function
    FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace='official_v3_jobs_private'::pg_catalog.regnamespace`)
  const app = guards.filter(g => g.internal === 'false')
  assert.equal(app.length, 14)
  assert.ok(app.every(g => g.tgenabled === 'O' && g.deferred === 'false' && g.initially === 'false'
    && g.function === 'official_v3_jobs_private.immutable_v1()'
    && (g.tgname === 'guard_row_v1' && g.type === '27' || g.tgname === 'guard_truncate_v1' && g.type === '34')))
  assert.equal(guards.length - app.length, 28); assert.ok(guards.every(g => g.deferred === 'false' && g.initially === 'false'))
  const policies = await owner.query(`SELECT p.polname,p.polcmd,p.polpermissive::text AS permissive,
    (p.polroles=ARRAY['postgres'::pg_catalog.regrole::oid])::text AS owner,
    pg_catalog.pg_get_expr(p.polqual,p.polrelid) AS using,pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid) AS check
    FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid WHERE c.relnamespace='official_v3_jobs_private'::pg_catalog.regnamespace`)
  assert.equal(policies.length, 7)
  assert.ok(policies.every(p => p.polname === 'owner_v1' && p.polcmd === '*' && p.permissive === 'true' && p.owner === 'true' && p.using === 'true' && p.check === 'true'))
  for (const role of ['PUBLIC', 'anon', 'authenticated', 'service_role', 'ot_v3_jobs_caller', 'ot_v3_intake_owner']) {
    const grants = await owner.query(`SELECT count(*)::text AS n FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a
      WHERE c.relnamespace='official_v3_jobs_private'::pg_catalog.regnamespace AND a.grantee=CASE WHEN $1='PUBLIC' THEN 0 ELSE $1::pg_catalog.regrole::oid END`, [pgText(role)])
    assert.equal(grants[0]?.n, '0', role + ' receives no table privilege')
  }
}
async function refusal(connection: LocalPgConnection, sql: string, state: string) {
  try { await assert.rejects(connection.query(sql), code(state)) } finally { await connection.query('ROLLBACK') }
}
function observe<T>(promise: Promise<T>) {
  let terminal = false
  const joined = promise.then(value => { terminal = true; return { value, error: undefined } }, error => { terminal = true; return { value: undefined, error } })
  return { joined, terminal: () => terminal }
}
async function until(lifetime: OwnedTestLifetime, predicate: () => Promise<boolean>, message: string, ms = 3000) {
  const deadline = performance.now() + ms
  do { if (await predicate()) return; await lifetime.wait(5) } while (performance.now() < deadline)
  assert.fail(message)
}
function latch(lifetime: OwnedTestLifetime) {
  let release!: () => void
  const promise = new Promise<void>(resolve => { release = resolve })
  const remove = lifetime.onStop(() => release())
  return { promise, release() { remove(); release() } }
}
let op = 1000
const stageSQL = 'SELECT official_v3_method_api.stage_draft_v1($1::text,$2::text,$3::integer,$4::text,$5::text,NULLIF($6::text,\'\')::integer) AS result'
const approveSQL = `SELECT official_v3_method_api.approve_v1($1::text,$2::text,$3::integer,$4::text,$5::text,
 NULLIF($6::text,'')::integer,NULLIF($7::text,''),NULLIF($8::text,''),$9::integer,NULLIF($10::text,''),$11::text,NULLIF($12::text,'')) AS result`
async function makeFixture(lifetime: OwnedTestLifetime, allocate: () => LocalProofCluster, install = true, approve = true,
  phase: (step: string) => void = () => {}) {
  phase('fixture_acquire')
  const cluster = allocate(), all = new Set<LocalPgConnection>()
  let maxFixtureConnections = 0
  async function connect(login = cluster.user, role?: string) {
    assert.ok(all.size < 16, 'finite owner/human/holder/observer fixture connection inventory')
    const connection = await lifetime.run(() => LocalPgConnection.connect(cluster, login)); all.add(connection)
    maxFixtureConnections = Math.max(maxFixtureConnections, all.size)
    const close = connection.close.bind(connection)
    connection.close = () => { all.delete(connection); close() }
    const id = (await connection.query(ID))[0]!; assert.ok(id.pid && id.birth)
    if (role) { assert.ok(['authenticated', 'ot_v3_jobs_caller', 'ot_v3_intake_caller', 'ot_v3_method_reader'].includes(role)); await connection.query('SET ROLE ' + role) }
    return { connection, identity: { pid: id.pid!, birth: id.birth! } }
  }
  const { connection: owner } = await connect(), { connection: observer } = await connect()
  phase('fixture_config')
  await owner.query('SET search_path=pg_catalog,pg_temp')
  await observer.query("SET statement_timeout='1500'; SET lock_timeout='1500'")
  phase('auth_fixture')
  await installMa1AuthFixture(owner)
  phase('fixture_markers')
  await owner.query("SELECT set_config('jetnity.ma1_fixture','jetnity-ma1-disposable-native-v1',false) AS ma1_fixture,set_config('jetnity.s1_owned_fixture','s1_disposable_native_test_v1',false) AS s1_fixture")
  phase('method_candidate'); await owner.query(ma1Candidate)
  phase('intake_candidate'); await owner.query(s1Candidate)
  phase('predecessor_catalog')
  const predecessorCatalog = await catalog(owner)
  if (install) { phase('jobs_candidate'); await owner.query(candidate); phase('predecessor_unchanged'); unchangedPredecessors(predecessorCatalog, await catalog(owner)) }
  phase('human_fixture')
  const human = (await connect(MA1_AUTH.humanLogin, 'authenticated')).connection
  await human.query("SELECT set_config('request.jwt.claims',$1::text,false)", [pgText(JSON.stringify(ma1Claims()))])
  async function head() {
    const rows = await owner.query('SELECT * FROM official_v3_method_private.heads_v1 WHERE method_id=$1::text', [pgText(binding.methodId)])
    return rows[0]
  }
  async function approveCurrent(untilDate: string | null = null) {
    const previous = await head()
    const params = [ma1Operation(++op), binding.methodId, binding.revision, binding.methodDigest, binding.packageDigest,
      previous?.revision ?? null, previous?.method_digest ?? null, previous?.package_digest ?? null,
      previous?.epoch ?? 0, previous?.status ?? null, untilDate ? 'until' : 'until_revoked', untilDate]
    assert.equal(result(await human.query(approveSQL, text(params))).status, 'recorded')
    return Number((await head())!.epoch)
  }
  async function revoke() {
    const h = (await head())!
    assert.equal(result(await human.query('SELECT official_v3_method_api.revoke_v1($1::text,$2::text,$3::integer,$4::text,$5::text,$6::integer) AS result',
      text([ma1Operation(++op), binding.methodId, binding.revision, binding.methodDigest, binding.packageDigest, h.epoch]))).status, 'recorded')
  }
  if (approve) {
    phase('method_stage')
    assert.equal(result(await human.query(stageSQL, text([ma1Operation(++op), binding.methodId, binding.revision, binding.methodDigest, binding.packageDigest, null]))).status, 'recorded')
    phase('method_approve')
    await approveCurrent()
  }
  async function grantRunners() {
    await owner.query(`CREATE ROLE ${M04_TEST_LOGIN.jobs} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
      CREATE ROLE ${M04_TEST_LOGIN.intake} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
      GRANT ot_v3_jobs_caller TO ${M04_TEST_LOGIN.jobs}; GRANT ot_v3_intake_caller TO ${M04_TEST_LOGIN.intake}; GRANT ot_v3_method_reader TO ${MA1_AUTH.readerLogin};`)
  }
  async function state(jobKey: string) {
    return await owner.query(`SELECT jsonb_build_object('subjects',(SELECT jsonb_agg(to_jsonb(s)) FROM official_v3_jobs_private.subjects_v1 s WHERE job_key=$1),
      'commands',(SELECT jsonb_agg(to_jsonb(o) ORDER BY operation_id) FROM official_v3_jobs_private.queue_operations_v1 o WHERE job_key=$1),
      'starts',(SELECT jsonb_agg(to_jsonb(x) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_starts_v1 x WHERE job_key=$1),
      'results',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.attempt_key) FROM official_v3_jobs_private.execution_results_v1 r JOIN official_v3_jobs_private.execution_starts_v1 s USING(attempt_key) WHERE s.job_key=$1),
      'dispositions',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.attempt_key) FROM official_v3_jobs_private.execution_dispositions_v1 d JOIN official_v3_jobs_private.execution_starts_v1 s USING(attempt_key) WHERE s.job_key=$1))::text AS state`, [pgText(jobKey)])
  }
  return { cluster, owner, observer, human, connect, head, approveCurrent, revoke, grantRunners, state, predecessorCatalog,
    connectionEvidence: () => ({ active: all.size, maximum: maxFixtureConnections, limit: 16 }), close() { for (const c of all) c.close() } }
}
type Fixture = Awaited<ReturnType<typeof makeFixture>>
function config(input: ReturnType<typeof m04Fixture>, native: Native, method: MethodNative, overrides: Partial<M04Config> = {}): M04Config {
  return { binding, registry: input.originals.registry, clock: input.clock, methodExecutor: method.executor,
    jobsExecutor: native.jobs, intakeExecutor: native.intake, producer: input.producer, evidence: input.evidence, history: input.history, ...overrides }
}
function contextFor(seed: number): V3GlobalRuleContext {
  const f = m04Fixture('context-base')
  return f.contextWith({ kind: 'age_on_travel_date', comparison: 'at_least', years: seed })
}
async function fixed(connection: LocalPgConnection, operation: M04Operation | unknown, epoch: number | null, phase = 'authorized', cap = 5000, notAfter = new Date(Date.now() + cap).toISOString()) {
  return result(await connection.query(M04_FIXED_SQL, text([m04Canonical({ ...(operation as object), phase }), binding.methodId, binding.revision,
    binding.methodDigest, binding.packageDigest, epoch, cap, notAfter])))
}
async function assertNativeEmpty(native: Native, method: MethodNative) {
  assert.deepEqual(native.snapshot(), { jobs: 0, intake: 0, contexts: 0, poisoned: false })
  assert.equal(native.evidence.drained, native.evidence.admitted)
  assert.ok(native.evidence.calls.every(c => c.drained && c.target && c.control))
  method.assertHealthy()
  assert.ok(method.evidence.calls.every(c => c.pending === 0 && c.joined && c.targetAbsent && c.controlAbsent))
}
// The unchanged queue computes a valid prospective envelope. This test helper
// does not persist/authorize it: the real fixed SQL independently checks actual
// retained state, complete transition, current MA1 tuple and the native clock.
async function commandRequest(commandValue: unknown, current: V3ManagedJobRecord | null, observedAt = new Date().toISOString()) {
  const command = readM04Command(commandValue); assert.ok(command)
  let captured: V3QueueCommit | undefined
  const storage: V3QueueStoragePort = { async read() { return { status: 'ok', record: current } },
    async confirm() { return { status: 'not_attempted' } }, async compareAndSwap(commit) { captured = commit; return { status: 'unconfirmed' } } }
  const options = { storage, methodAuthority: { async resolveCurrent() { return { status: 'approved' as const, receipt: Object.freeze({}) } },
    async reproveAtCommit() { return { status: 'current' as const } } }, now: () => observedAt, invocationMilliseconds: 5000,
    backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000 }
  const queue = command.kind === 'combination_discovery' ? createV3DiscoveryQueueCoordinator(options) : createV3QueueCoordinator(options)
  if (command.action === 'enqueue') await queue.enqueue(command.value.input)
  else if (command.action === 'claim') await queue.claim(command.value.input)
  else if (command.action === 'complete') await queue.complete(command.value.input)
  else await queue.fail(command.value.input)
  assert.ok(captured, 'actual queue must derive an eligible complete envelope')
  const next: V3ManagedJobRecord = captured.next
  const source = next.kind === 'research_job_record' ? { context: next.context, method: next.method, factKind: next.research.factKind, researchReason: next.research.researchReason }
    : { destinationCountryCode: next.identity.destinationCountryCode, citizenshipCountryCode: next.identity.citizenshipCountryCode, method: next.identity.method }
  const subject = createM04SubjectIdentity(command.kind, source); assert.ok(subject)
  return { operation: 'queue_cas' as const, body: { command: command.value, commit: captured,
    subjectText: subject.subjectText, disposition: { kind: 'regular' as const } } }
}

const unfinishedChildren = new Set<() => Promise<unknown>>()
function childWorker(lifetime: OwnedTestLifetime, children: Set<ChildProcess>, native: Native, method: MethodNative) {
  assert.ok(children.size < 2, 'two-child fixture cap')
  const generation = randomBytes(8).toString('hex')
  const child = fork(fileURLToPath(new URL('./process-worker.ts', import.meta.url)), [generation], {
    execArgv: ['--import', fileURLToPath(new URL('../../server-only-test-register.mjs', import.meta.url)), '--import', 'tsx'],
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'], serialization: 'json',
  })
  children.add(child)
  let exited = false, closeSeen = false, closing = false, commandId = 0, rpcId = 0, producerCalls = 0, bytes = 0, outputBytes = 0, failure: unknown
  const controllers = new Map<number, AbortController>(), active = new Set<Promise<void>>()
  let current: { id: number; resolve: (r: Record<string, unknown>) => void; reject: (e: unknown) => void } | undefined
  const exit = () => { exited = true; if (!closing) stop(Error('m04 unexpected child exit')) }
  const closed = lifetime.track(new Promise<void>(resolve => {
    child.once('exit', exit)
    child.once('close', () => { closeSeen = true; children.delete(child); if (!closing) stop(Error('m04 unexpected child close')); resolve() })
  }))
  function stop(error?: unknown) {
    closing = true; failure ??= error
    for (const controller of controllers.values()) controller.abort()
    current?.reject(error ?? Error('m04 child stopped')); current = undefined
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  }
  const timer = setTimeout(() => stop(Error('m04 child finite scenario exceeded')), 30000)
  const remove = lifetime.onStop(() => stop(Error('m04 parent stopped')))
  const send = (frame: Record<string, unknown>) => {
    const size = Buffer.byteLength(JSON.stringify(frame)); bytes += size
    if (size > 1_048_576 || bytes > 67_108_864 || !child.connected) { stop(Error('m04 child frame limit')); return }
    child.send(frame, error => { if (error && !closing) stop(error) })
  }
  const output = (b: Buffer) => { outputBytes += b.length; if (outputBytes > 65536) stop(Error('m04 child output limit')) }
  child.stdout?.on('data', output); child.stderr?.on('data', output)
  const error = (e: Error) => stop(e)
  const disconnect = () => { if (!closing && current) stop(Error('m04 unexpected child disconnect')) }
  child.on('error', error); child.on('disconnect', disconnect)
  const receive = (input: unknown) => {
    if (closing) return
    try {
      assert.ok(input && typeof input === 'object' && Buffer.byteLength(JSON.stringify(input)) <= 1_048_576)
      const frame = input as Record<string, unknown>
      assert.equal(frame.v, 1); assert.equal(frame.generation, generation)
      if (frame.kind === 'producer') {
        assert.deepEqual(Object.keys(frame).sort(), ['count', 'generation', 'kind', 'v'])
        assert.equal(frame.count, ++producerCalls); return
      }
      if (frame.kind === 'result') {
        assert.deepEqual(Object.keys(frame).sort(), ['commandId', 'generation', 'kind', 'producerCalls', 'result', 'v'])
        assert.ok(current && current.id === frame.commandId); assert.equal(frame.producerCalls, producerCalls)
        const pending = current; current = undefined
        assert.ok(frame.result && typeof frame.result === 'object'); pending.resolve(frame.result as Record<string, unknown>); return
      }
      if (frame.kind === 'abort') {
        assert.deepEqual(Object.keys(frame).sort(), ['generation', 'kind', 'rpcId', 'v'])
        controllers.get(frame.rpcId as number)?.abort(); return
      }
      assert.deepEqual(Object.keys(frame).sort(), ['generation', 'kind', 'operation', 'request', 'rpcId', 'v'])
      assert.equal(frame.kind, 'rpc'); assert.ok(Number.isInteger(frame.rpcId) && frame.rpcId === rpcId + 1 && rpcId < 256 && active.size < 8)
      rpcId++; const id = rpcId, controller = new AbortController(); controllers.set(id, controller)
      const task = (async () => {
        let reply: unknown
        if (frame.operation === 'method') {
          const read = readMa1CurrentRequest(frame.request); assert.ok(read.ok)
          if (!read.ok) throw Error('m04 child method')
          assert.deepEqual({ methodId: read.value.methodId, revision: read.value.revision, methodDigest: read.value.methodDigest, packageDigest: read.value.packageDigest }, binding)
          reply = await method.executor.readCurrent(read.value, controller.signal)
        } else if (frame.operation === 'jobs') {
          const r = frame.request as Record<string, unknown>
          assert.deepEqual(Object.keys(r).sort(), ['epoch', 'methodDigest', 'methodId', 'notAfter', 'operationText', 'packageDigest', 'remaining', 'revision'])
          assert.deepEqual({ methodId: r.methodId, revision: r.revision, methodDigest: r.methodDigest, packageDigest: r.packageDigest }, binding)
          assert.ok(Number.isInteger(r.remaining) && (r.remaining as number) >= 1 && (r.remaining as number) <= 5000)
          assert.ok(r.epoch === null || Number.isSafeInteger(r.epoch)); assert.equal(typeof r.operationText, 'string')
          assert.equal(typeof r.notAfter, 'string')
          reply = await native.jobs.executeFixed({ ...r, budget: { deadline: performance.now() + (r.remaining as number) } } as M04FixedRequest, controller.signal)
        } else {
          assert.equal(frame.operation, 'intake'); const r = frame.request as Record<string, unknown>
          assert.deepEqual(Object.keys(r).sort(), ['index', 'parameters'])
          assert.ok(Number.isInteger(r.index) && (r.index as number) >= 0 && (r.index as number) < 4 && Array.isArray(r.parameters))
          assert.equal(r.parameters.length, [3, 3, 4, 7][r.index as number])
          assert.ok(r.parameters.every(v => typeof v === 'string' || typeof v === 'number' && Number.isSafeInteger(v)))
          reply = await native.intake.execute(M04_S1_STATEMENTS[r.index as number], r.parameters as (string | number)[], controller.signal)
        }
        if (!closing) send({ v: 1, generation, kind: 'settled', rpcId: id, result: reply })
      })().catch(e => { failure ??= e; if (!closing) stop(e) }).finally(() => { controllers.delete(id); active.delete(task) })
      active.add(task); lifetime.track(task)
    } catch (e) { stop(e) }
  }
  child.on('message', receive)
  const handle = { child, producerCalls: () => producerCalls,
    async command(action: 'init' | 'enqueue_rule' | 'enqueue_discovery' | 'work' | 'stop', data: unknown = null) {
      assert.ok(!closing && !current && commandId < 65535)
      const id = ++commandId
      const reply = new Promise<Record<string, unknown>>((resolve, reject) => { current = { id, resolve, reject } })
      send({ v: 1, generation, kind: 'command', commandId: id, action, data })
      return lifetime.track(reply)
    },
    async close(crash = false) {
      if (!closing) {
        if (!crash) { const done = await this.command('stop'); assert.equal(done.status, 'stopped') }
        closing = true
        if (crash && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
        for (const controller of controllers.values()) controller.abort()
        current?.reject(Error('m04 intentional crash')); current = undefined
      }
      await closed; await Promise.allSettled([...active])
      clearTimeout(timer); remove()
      child.removeListener('message', receive); child.removeListener('error', error); child.removeListener('disconnect', disconnect)
      child.stdout?.removeListener('data', output); child.stderr?.removeListener('data', output)
      assert.ok(exited && closeSeen, 'actual exit and close both required')
      assert.equal(active.size, 0); assert.equal(controllers.size, 0)
      assert.equal(child.listenerCount('message'), 0); assert.equal(child.listenerCount('error'), 0)
      unfinishedChildren.delete(finalize)
      if (failure) throw failure
      return { exited, closeSeen, rpcId, producerCalls, active: active.size, controllers: controllers.size }
    },
  }
  const finalize = () => handle.close(true)
  unfinishedChildren.add(finalize)
  return handle
}

async function blocked(f: Fixture, lifetime: OwnedTestLifetime, waiter: Identity, holder: Identity, relation: string, pending: () => boolean) {
  await until(lifetime, async () => {
    const rows = await f.observer.query(`SELECT state,wait_event_type,($3::integer=ANY(pg_blocking_pids(pid)))::text AS holder,
      EXISTS(SELECT 1 FROM pg_catalog.pg_locks l WHERE l.pid=a.pid AND (l.relation=$4::regclass OR l.locktype='transactionid'))::text AS relation
      FROM pg_catalog.pg_stat_activity a WHERE pid=$1::integer AND backend_start=$2::timestamptz`,
    text([waiter.pid, waiter.birth, holder.pid, relation]))
    return rows[0]?.state === 'active' && rows[0]?.wait_event_type === 'Lock' && rows[0]?.holder === 'true' && rows[0]?.relation === 'true' && pending()
  }, 'actual matching PID/birth/holder/relation/native wait absent')
}

// Fixture-only diagnostics: closed error categories and bounded SQLSTATE/wire
// codes, never raw messages, stacks, SQL, parameter values or original bytes.
function nativeFailure(error: unknown, depth = 0): Readonly<{ kind: string; code: string; causes?: readonly unknown[] }> {
  if (error instanceof LocalPgError) {
    const wireCodes = ['unsafe_socket', 'connection_failed', 'connection_closed', 'response_bound', 'authentication_forbidden',
      'duplicate_column', 'row_bound', 'column_count', 'commit_deadline_not_armed', 'commit_bound_elapsed', 'connection_state', 'parameter_bound', 'query_failed']
    return { kind: 'postgres', code: /^[0-9A-Z]{5}$/.test(error.code) || wireCodes.includes(error.code) ? error.code : 'unclassified' }
  }
  if (error instanceof assert.AssertionError) return { kind: 'assertion', code: 'assertion_failed' }
  if (error instanceof AggregateError) return { kind: 'aggregate', code: 'multiple_failures',
    causes: depth < 2 ? error.errors.slice(0, 8).map(value => nativeFailure(value, depth + 1)) : [] }
  return { kind: 'fixture', code: 'unclassified_failure' }
}

test('M04 mandatory native: finite durable jobs, full S1/MA1 authority, original uncertainty and terminal ownership', { timeout: 300000 }, async t => {
  const effectAbort = new AbortController(), parent = AbortSignal.any([t.signal, effectAbort.signal])
  const lifetime = new OwnedTestLifetime(parent), started = performance.now(), children = new Set<ChildProcess>()
  const timer = setTimeout(() => effectAbort.abort(Error('M04 240s effect budget exceeded')), 240000)
  let clusters = 0
  const allocate = () => { assert.ok(++clusters <= 3, 'three owned clusters maximum'); return lifetime.startCluster(startLocalProofCluster) }
  lifetime.installConnectOwnership()
  const cleanup: (() => Promise<void> | void)[] = []
  const proofs: { id: string; milliseconds: number }[] = []
  const nestedRaceWitnesses: Readonly<Record<string, unknown>>[] = []
  function newQuotaCounters() {
    return { lastStartedIndex: null as number | null, lastCompletedIndex: null as number | null,
      commandRequestsStarted: 0, commandRequestsCompleted: 0, commandRequestMilliseconds: 0,
      fixedCallsStarted: 0, fixedCallsCompleted: 0, fixedCallMilliseconds: 0,
      commandCallsStarted: 0, commandCallsCompleted: 0, commandCommits: 0,
      startCallsStarted: 0, startCallsCompleted: 0, startReservations: 0 }
  }
  const quotaProgress = {
    currentGroup: 'none' as 'none' | 'N05/A03' | 'N05',
    boundary: 'not_started' as 'not_started' | 'absent_probe' | 'ledger_fill' | 'claim_255' | 'start_1' |
      'interstitial_refusal' | 'terminal_256' | 'ledger_quota_refusal' | 'cycle_enqueue' | 'cycle_claim' |
      'cycle_start' | 'cycle_fail' | 'enqueue_65' | 'claim_65_refusal' | 'pointer_refusal' | 'done',
    indexBase: 0, millisecondsCap: 300000,
    timingMeaning: 'client await durations including construction/transport; not server statement profiling',
    ledger: newQuotaCounters(), cycles: newQuotaCounters(),
  }
  const quotaElapsed = (before: number) => Math.max(0, Math.min(300000, Math.ceil(performance.now() - before)))
  async function quotaCommand(progress: ReturnType<typeof newQuotaCounters>, command: unknown, current: V3ManagedJobRecord | null) {
    progress.commandRequestsStarted++; const before = performance.now()
    try { const value = await commandRequest(command, current); progress.commandRequestsCompleted++; return value }
    finally { progress.commandRequestMilliseconds = Math.min(300000, progress.commandRequestMilliseconds + quotaElapsed(before)) }
  }
  async function quotaFixed(progress: ReturnType<typeof newQuotaCounters>, connection: LocalPgConnection,
    operation: unknown, epoch: number | null, phase = 'authorized') {
    const name = operation !== null && typeof operation === 'object' ? (operation as { operation?: unknown }).operation : undefined
    progress.fixedCallsStarted++
    if (name === 'queue_cas') progress.commandCallsStarted++
    if (name === 'execution_start') progress.startCallsStarted++
    const before = performance.now()
    try {
      const value = await fixed(connection, operation, epoch, phase); progress.fixedCallsCompleted++
      if (name === 'queue_cas') { progress.commandCallsCompleted++; if (value.status === 'committed') progress.commandCommits++ }
      if (name === 'execution_start') { progress.startCallsCompleted++; if (value.status === 'reserved') progress.startReservations++ }
      return value
    } finally { progress.fixedCallMilliseconds = Math.min(300000, progress.fixedCallMilliseconds + quotaElapsed(before)) }
  }
  let phase = 'initial_setup', primaryPhase: string | null = null
  const setPhase = (value: string) => { assert.match(value, /^[A-Za-z0-9_:/-]{1,80}$/); phase = value }
  // T03: test fault families may coexist with the idle base family. Count
  // their extra observers explicitly and enforce the SAME aggregate work
  // lane limits across every instance; never multiply the runtime family cap.
  const familyCalls = { jobs: 0, intake: 0, method: 0 }, familyMaximum = { jobs: 0, intake: 0, method: 0 }
  const families: Native[] = []
  const rawFamilies = new WeakMap<Native, Native>() // test-only access for the refused fifth-call witness
  let familyObservers = 0, maximumFamilyObservers = 0, methodObservers = 0
  async function familyCall<T>(kind: keyof typeof familyCalls, run: () => Promise<T>) {
    assert.ok(familyCalls[kind] < 4, 'aggregate fixture work-lane bound across coexisting families')
    familyCalls[kind]++; familyMaximum[kind] = Math.max(familyMaximum[kind], familyCalls[kind])
    try { return await run() } finally { familyCalls[kind]-- }
  }
  async function ownedNative(cluster: LocalProofCluster, hooks?: Parameters<typeof createM04NativeExecutors>[2]): Promise<Native> {
    assert.ok(familyObservers < 2, 'base plus one transient fault observer only')
    const underlying = await createM04NativeExecutors(cluster, lifetime, hooks)
    familyObservers++; maximumFamilyObservers = Math.max(maximumFamilyObservers, familyObservers)
    let disposed = false
    const owned: Native = { ...underlying,
      jobs: { executeFixed: (request, signal) => familyCall('jobs', () => underlying.jobs.executeFixed(request, signal)) },
      intake: { execute: (statement, parameters, signal) => familyCall('intake', () => underlying.intake.execute(statement, parameters, signal)) },
      async dispose() { if (disposed) return; await underlying.dispose(); disposed = true; familyObservers-- },
    }
    families.push(owned); rawFamilies.set(owned, underlying); cleanup.push(() => owned.dispose())
    return owned
  }
  let activeObserver: LocalPgConnection | undefined
  let minimumInheritedConnections = 0, inheritedCommitGuardPairs = 0
  const backendInventory = (observer: LocalPgConnection) => observer.query("SELECT pid::text,backend_start::text AS birth FROM pg_catalog.pg_stat_activity WHERE backend_type='client backend' AND datname=current_database() ORDER BY pid")
  async function proof(id: string, name: string, run: () => Promise<void>) {
    setPhase('proof_' + (proofs.length + 1) + ':' + id)
    lifetime.check(); assert.ok(performance.now() - started < 240000)
    const at = performance.now()
    const before = activeObserver ? await backendInventory(activeObserver) : undefined
    let passed = false, assertionFailure: unknown
    await t.test(id + ' ' + name, async () => {
      try { await lifetime.run(run); passed = true }
      catch (error) { assertionFailure = error; throw error }
    })
    if (assertionFailure) throw assertionFailure
    assert.equal(passed, true, id + ' native obligation failed')
    if (activeObserver && before) await until(lifetime, async () => JSON.stringify(await backendInventory(activeObserver!)) === JSON.stringify(before),
      id + ': unexpected native backend after terminal scenario, including inherited commit guard/control')
    lifetime.check(); proofs.push({ id, milliseconds: Math.ceil(performance.now() - at) })
  }
  let primary: unknown, cleanupReceipt: Awaited<ReturnType<OwnedTestLifetime['dispose']>> | undefined
  try {
    const f = await makeFixture(lifetime, allocate, true, true, setPhase)
    cleanup.push(() => f.close())
    setPhase('grant_runners')
    await f.grantRunners()
    setPhase('native_executors')
    const native = await ownedNative(f.cluster), underlyingMethod = await createMa1NativeExecutor(f.cluster, lifetime)
    methodObservers++
    let methodClosed = false
    const method: MethodNative = { ...underlyingMethod,
      executor: { readCurrent: (request, signal) => familyCall('method', () => underlyingMethod.executor.readCurrent(request, signal)) },
      closeObserver() { if (methodClosed) return; underlyingMethod.closeObserver(); methodClosed = true; methodObservers-- },
    }
    cleanup.push(() => method.closeObserver())
    const runtime = (await f.connect(M04_TEST_LOGIN.jobs, 'ot_v3_jobs_caller')).connection
    activeObserver = f.observer
    const currentEpoch = () => f.head().then(h => Number(h!.epoch))
    await proof('N01', 'exact finite objects, fixed ownership, FORCE RLS, roles and permitted login only', async () => {
      await finiteSecurityInventory(f.owner)
      const objects = await f.owner.query(`SELECT
        (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))::text AS functions,
        (SELECT count(*) FROM pg_catalog.pg_class c WHERE c.relnamespace='official_v3_jobs_private'::regnamespace AND c.relkind='r')::text AS tables,
        (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class c ON c.oid=g.tgrelid WHERE c.relnamespace='official_v3_jobs_private'::regnamespace AND NOT g.tgisinternal)::text AS guards,
        (SELECT count(*) FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid WHERE c.relnamespace='official_v3_jobs_private'::regnamespace)::text AS policies,
        (SELECT count(*) FROM official_v3_jobs_private.slots_v1 WHERE job_key IS NULL)::text AS free_slots`)
      assert.deepEqual(objects, [{ functions: '29', tables: '7', guards: '14', policies: '7', free_slots: '1024' }])
      const rows = await f.owner.query("SELECT c.relrowsecurity::text AS rls,c.relforcerowsecurity::text AS force,pg_get_userbyid(c.relowner) AS owner FROM pg_catalog.pg_class c WHERE c.relnamespace='official_v3_jobs_private'::regnamespace AND c.relkind='r'")
      assert.ok(rows.every(r => r.rls === 'true' && r.force === 'true' && r.owner === 'postgres'))
      const functions = await f.owner.query("SELECT p.proconfig::text AS config,pg_get_userbyid(p.proowner) AS owner,p.proname FROM pg_catalog.pg_proc p WHERE p.pronamespace IN ('official_v3_jobs_private'::regnamespace,'official_v3_jobs_api'::regnamespace)")
      assert.ok(functions.every(r => r.config === '{"search_path=pg_catalog, pg_temp"}'))
      assert.equal(functions.filter(r => r.owner === 'ot_v3_intake_owner').length, 2)
      const role = await runtime.query('SELECT session_user::text AS login,current_user::text AS role')
      assert.deepEqual(role, [{ login: M04_TEST_LOGIN.jobs, role: 'ot_v3_jobs_caller' }])
      for (const sql of ['SELECT * FROM official_v3_jobs_private.subjects_v1', 'SELECT official_v3_jobs_private.assert_catalog_v1()',
        "SELECT official_v3_method_private.require_current_locked_v1('x',1,'x','x',1)",
        "SELECT official_v3_intake_api.read_v1('{}','x',1)", 'SET ROLE postgres', 'SET ROLE ot_v3_intake_owner']) await assert.rejects(runtime.query(sql), code('42501'))
      const oldRole = await f.owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_auth_members WHERE roleid IN ('postgres'::regrole,'ot_v3_intake_owner'::regrole) OR member='ot_v3_jobs_caller'::regrole")
      assert.equal(oldRole[0]?.n, '0')
      await f.owner.query('SELECT official_v3_jobs_private.assert_catalog_v1()')
    })
    await proof('N02', 'actual S0 seventeen-kind/native canonical parity and closed direct-entry witnesses', async () => {
      for (const v of m04IdentityVectors()) {
        const nativeSubject = result(await f.owner.query('SELECT official_v3_jobs_private.subject_v1($1::text,$2::jsonb) AS result', text(['rule_research', m04Canonical(v.input)])))
        assert.equal(nativeSubject.jobKey, v.identity.jobKey, v.name); assert.equal(nativeSubject.contextKey, v.identity.contextKey)
        assert.equal(nativeSubject.subjectText, v.subject.subjectText); assert.deepEqual(nativeSubject.research, v.identity.research)
        const proposalFixture = m04Fixture('predicate-' + v.name, { context: v.input.context })
        const delivery = proposalFixture.delivery()
        const store = createV3ProposalIntakeStore({ registry: proposalFixture.originals.registry, executor: native.intake, leaseMilliseconds: 5000 })
        assert.equal((await store.intake.capture(delivery.text, delivery.binding, signal())).status, 'recorded', v.name)
      }
      // R18: reuse preserves canonical bytes/hash and the original NULL/size guard.
      const commandFixture = m04Fixture('r18-canonical-command', { context: contextFor(62) })
      for (const kind of ['rule_research', 'combination_discovery'] as const) {
        const value = { action: 'enqueue', kind, input: kind === 'rule_research' ? commandFixture.ruleInput : commandFixture.discoveryInput }
        const canonical = m04Canonical(value)
        const parsed = result(await f.owner.query('SELECT official_v3_jobs_private.command_v1($1::jsonb) AS result', text([JSON.stringify(value)])))
        assert.equal(parsed.commandText, canonical); assert.equal(parsed.commandKey, 'queue-command:v3:' + digest(canonical))
        assert.deepEqual(parsed.value, value)
      }
      await f.owner.query(`DO $r18_guards$
        DECLARE failure_message text; job_kind text; command_value jsonb;
        BEGIN
          BEGIN
            PERFORM official_v3_jobs_private.command_v1(NULL::jsonb);
            RAISE EXCEPTION 'r18 SQL NULL command accepted';
          EXCEPTION WHEN SQLSTATE 'P7601' THEN
            GET STACKED DIAGNOSTICS failure_message = MESSAGE_TEXT;
            IF failure_message IS DISTINCT FROM 'm04 invalid command' THEN RAISE EXCEPTION 'r18 wrong SQL NULL guard'; END IF;
          END;
          FOREACH job_kind IN ARRAY ARRAY['rule_research','combination_discovery'] LOOP
            command_value:=jsonb_build_object('action','enqueue','kind',job_kind,'input',
              jsonb_build_object('operationId','op3_'||repeat('1',32),'padding',repeat('x',65536)));
            IF octet_length(official_v3_jobs_private.canonical_v1(command_value,0))<=65536 THEN RAISE EXCEPTION 'r18 size fixture invalid'; END IF;
            BEGIN
              PERFORM official_v3_jobs_private.command_v1(command_value);
              RAISE EXCEPTION 'r18 oversized command accepted';
            EXCEPTION WHEN SQLSTATE 'P7601' THEN
              GET STACKED DIAGNOSTICS failure_message = MESSAGE_TEXT;
              IF failure_message IS DISTINCT FROM 'm04 invalid command' THEN RAISE EXCEPTION 'r18 wrong command size guard'; END IF;
            END;
          END LOOP;
        END $r18_guards$`)
      await assert.rejects(f.owner.query("SELECT official_v3_jobs_private.command_v1('null'::jsonb)"), code('P7601'))
      // R19: fixed direct-helper oracles cover scalar roots and both nested leaf paths.
      const canonicalLeaves = [
        ["null","null"],
        ["true","true"],
        ["false","false"],
        ["\" ~\"","\" ~\""],
        ["\"quote:\\\" slash:\\\\\"","\"quote:\\\" slash:\\\\\""],
        ["18.0","18"],
        ["18e0","18"],
        ["1.8e1","18"],
        ["9007199254740991","9007199254740991"],
        ["-9007199254740991","-9007199254740991"],
      ] as const
      for (const [raw, expected] of canonicalLeaves) {
        const rows = await f.owner.query("SELECT official_v3_jobs_private.canonical_v1($1::jsonb,0) AS root_text, official_v3_jobs_private.canonical_v1(jsonb_build_object('v',$1::jsonb),0) AS object_text, official_v3_jobs_private.canonical_v1(jsonb_build_array($1::jsonb),0) AS array_text", text([raw]))
        assert.deepEqual(rows, [{ root_text: expected, object_text: '{"v":' + expected + '}', array_text: '[' + expected + ']' }], 'R19 canonical scalar paths')
      }
      const canonicalAt = (raw: string | null, depth: number | null) =>
        f.owner.query("SELECT official_v3_jobs_private.canonical_v1(NULLIF($1,'')::jsonb,NULLIF($2,'')::integer) AS canonical", text([raw, depth]))
      const badCanonicalLeaves = ["\"\\u001f\"","\"\\u007f\"","\"\\u00e9\"","\"line\\nend\"","9007199254740992","-9007199254740992","0.5","-0.5"] as const
      for (const raw of badCanonicalLeaves) {
        for (const value of [raw, '{"v":' + raw + '}', '[' + raw + ']']) {
          await assert.rejects(canonicalAt(value, 0), code('P7601'), 'R19 invalid scalar root/object/array')
        }
      }
      const badCanonicalKeys = ["{\"\\u001f\":0}","{\"\\u00e9\":0}"] as const
      for (const raw of badCanonicalKeys) {
        for (const value of [raw, '{"v":' + raw + '}', '[' + raw + ']']) {
          await assert.rejects(canonicalAt(value, 0), code('P7601'), 'R19 invalid nested key')
        }
      }
      const canonicalDepthCases = [
        ["{\"b\":0,\"aa\":1,\"a\":2,\"_\":3,\"A\":4}",0,"{\"A\":4,\"_\":3,\"a\":2,\"aa\":1,\"b\":0}"],
        ["[3,1,2,false,null,\"x\"]",0,"[3,1,2,false,null,\"x\"]"],
        ["{\"\\\\\":1,\"\\\"\":2}",0,"{\"\\\"\":2,\"\\\\\":1}"],
        ["null",24,"null"],
        ["true",24,"true"],
        ["\"x\"",24,"\"x\""],
        ["18.0",24,"18"],
        ["{}",24,"{}"],
        ["[]",24,"[]"],
        ["{\"v\":{}}",23,"{\"v\":{}}"],
        ["{\"v\":[]}",23,"{\"v\":[]}"],
        ["[{}]",23,"[{}]"],
        ["[[]]",23,"[[]]"],
        ["{\"v\":[0]}",22,"{\"v\":[0]}"],
      ] as const
      for (const [raw, depth, expected] of canonicalDepthCases) {
        assert.deepEqual(await canonicalAt(raw, depth), [{ canonical: expected }], 'R19 canonical order/escape/depth')
      }
      const invalidCanonicalDepths = [
        [null,0],
        ["null",null],
        ["0",-1],
        ["0",25],
        ["{\"v\":0}",24],
        ["[0]",24],
        ["{\"v\":{\"v\":0}}",23],
        ["{\"v\":[0]}",23],
        ["[{\"v\":0}]",23],
        ["[[0]]",23],
      ] as const
      for (const [raw, depth] of invalidCanonicalDepths) {
        await assert.rejects(canonicalAt(raw, depth), code('P7601'), 'R19 canonical NULL/depth refusal')
      }
      // text() represents null as empty text; NULLIF above/below deliberately creates SQL NULL.
      const nodeLeaves = ["null","true","false","\"\\u00e9\"","9007199254740992","0.5"] as const
      for (const raw of nodeLeaves) {
        const rows = await f.owner.query("SELECT official_v3_jobs_private.nodes_v1($1::jsonb,0,24,65536)::text AS root_count, official_v3_jobs_private.nodes_v1(jsonb_build_object('v',$1::jsonb),0,24,65536)::text AS object_count, official_v3_jobs_private.nodes_v1(jsonb_build_array($1::jsonb),0,24,65536)::text AS array_count", text([raw]))
        assert.deepEqual(rows, [{ root_count: '1', object_count: '3', array_count: '2' }], 'R19 scalar node weights without canonical validation')
      }
      const nodeCases = [
        ["null",0,24,65536,1],
        ["{\"a\":null}",0,24,3,3],
        ["{\"a\":null}",0,24,2,-1],
        ["[null]",0,24,2,2],
        ["[null]",0,24,1,-1],
        ["{\"a\":1,\"b\":[true,null]}",0,24,7,7],
        ["{\"a\":1,\"b\":[true,null]}",0,24,6,-1],
        ["null",24,24,1,1],
        ["{}",24,24,1,1],
        ["[]",24,24,1,1],
        ["{\"a\":null}",24,24,65536,-1],
        ["[null]",24,24,65536,-1],
        ["{\"v\":{}}",23,24,3,3],
        ["{\"v\":[]}",23,24,3,3],
        ["[{}]",23,24,2,2],
        ["[[]]",23,24,2,2],
        ["{\"v\":{\"v\":0}}",23,24,65536,-1],
        ["{\"v\":[0]}",23,24,65536,-1],
        ["[{\"v\":0}]",23,24,65536,-1],
        ["[[0]]",23,24,65536,-1],
        [null,0,24,65536,-1],
        ["null",null,24,65536,-1],
        ["null",0,null,65536,-1],
        ["null",0,24,null,-1],
        ["null",-1,24,65536,-1],
        ["null",0,-1,65536,-1],
        ["null",1,0,65536,-1],
        ["null",0,25,65536,-1],
        ["null",0,24,0,-1],
        ["null",0,24,-1,-1],
        ["null",0,24,65537,-1],
      ] as const
      for (const [raw, depth, maxDepth, maxNodes, expected] of nodeCases) {
        const rows = await f.owner.query("SELECT official_v3_jobs_private.nodes_v1(NULLIF($1,'')::jsonb,NULLIF($2,'')::integer,NULLIF($3,'')::integer,NULLIF($4,'')::integer)::text AS nodes", text([raw, depth, maxDepth, maxNodes]))
        assert.deepEqual(rows, [{ nodes: String(expected) }], 'R19 node count/depth/cap/NULL oracle')
      }
      // R20: both kinds retain exact timestamp validation before same-text reuse.
      const timeAt = '2026-11-09T00:00:00.000Z'
      const timeCases = [
        ['equal valid', timeAt, timeAt, true],
        ['different valid', timeAt, '2026-11-09T00:00:00.001Z', true],
        ['equal invalid calendar', '2026-02-30T00:00:00.000Z', '2026-02-30T00:00:00.000Z', false],
        ['different malformed', timeAt, 'not-a-time', false],
        ['JSON null', timeAt, null, false],
        ['boolean', timeAt, false, false],
        ['number', timeAt, 0, false],
        ['object', timeAt, {}, false],
        ['earlier valid', timeAt, '2026-11-08T23:59:59.999Z', false],
        ['same instant different text', timeAt, '2026-11-09T00:00:00.000+00:00', false],
      ] as const
      for (const kind of ['rule_research', 'combination_discovery'] as const) {
        // This existing helper prepares a prospective record; no journal write occurs.
        const prepared = await commandRequest({ action: 'enqueue', kind,
          input: kind === 'rule_research' ? commandFixture.ruleInput : commandFixture.discoveryInput }, null, timeAt)
        for (const [label, createdAt, updatedAt, valid] of timeCases) {
          const value = { ...prepared.body.commit.next, createdAt, updatedAt }
          const query = f.owner.query('SELECT official_v3_jobs_private.job_v1($1::jsonb) AS result', text([JSON.stringify(value)]))
          if (valid) assert.deepEqual(result(await query), value, 'R20 ' + kind + ': ' + label)
          else await assert.rejects(query, code('P7601'), 'R20 ' + kind + ': ' + label)
        }
      }
      // Raw numeric text and fixed expectations avoid JavaScript number rounding.
      const reuseNumericCases = [
        ['{"z":[-0,9007199254740991.000,-9007199254740991e0],"a":18.0}',
          '{"a":18,"z":[0,9007199254740991,-9007199254740991]}'],
        ['[1.8e1,{"max":9.007199254740991e15,"min":-9007199254740991.000,"zero":-0.0},2e0]',
          '[18,{"max":9007199254740991,"min":-9007199254740991,"zero":0},2]'],
      ] as const
      for (const [raw, expected] of reuseNumericCases) {
        assert.deepEqual(await canonicalAt(raw, 0), [{ canonical: expected }], 'R20 mixed numeric reuse')
      }
      for (const raw of ['9007199254740991.1', '[18,9.007199254740992e15]']) {
        await assert.rejects(canonicalAt(raw, 0), code('P7601'), 'R20 exact numeric refusal')
      }
      // R21: fixed byte oracles retain JSONB string normalization and every ASCII guard.
      const stringReuseCases = [
        ["\"\"","\"\""],
        ["\"\\u0041\\u0020\\u007e\"","\"A ~\""],
        ["\"\\/\"","\"/\""],
        ["\"\\u0022\"","\"\\\"\""],
        ["\"\\u005c\"","\"\\\\\""],
        ["\"\\\\u0041\"","\"\\\\u0041\""],
        ["\"null\"","\"null\""],
      ] as const
      for (const [raw, expected] of stringReuseCases) {
        const rows = await f.owner.query("SELECT official_v3_jobs_private.canonical_v1($1::jsonb,0) AS root_text, official_v3_jobs_private.canonical_v1(jsonb_build_object('v',$1::jsonb),0) AS object_text, official_v3_jobs_private.canonical_v1(jsonb_build_array($1::jsonb),0) AS array_text", text([raw]))
        assert.deepEqual(rows, [{ root_text: expected, object_text: '{"v":' + expected + '}', array_text: '[' + expected + ']' }], 'R21 string root/object/array bytes')
      }
      const mixedStringReuseCases = [
        ["[\"\\u0041\",\"\",{\"z\":\"\\\\u0041\",\"a\":\"\\/\",\"q\":\"\\u0022\"},[\"\\u005c\",\"last\"]]","[\"A\",\"\",{\"a\":\"/\",\"q\":\"\\\"\",\"z\":\"\\\\u0041\"},[\"\\\\\",\"last\"]]"],
        ["{\"z\":[\"third\",\"\\u0022\"],\"a\":{\"y\":\"\\u005c\",\"x\":\"\\u0042\"},\"m\":\"middle\"}","{\"a\":{\"x\":\"B\",\"y\":\"\\\\\"},\"m\":\"middle\",\"z\":[\"third\",\"\\\"\"]}"],
      ] as const
      for (const [raw, expected] of mixedStringReuseCases) {
        assert.deepEqual(await canonicalAt(raw, 0), [{ canonical: expected }], 'R21 successive and nested string bytes')
      }
      // R22: fixed Discovery bytes/digests and bounded same-text lease-time reuse.
      // These expectations are literal independent inputs; no function under test builds them.
      const subjectReuseCases = [
        ["representative reordered keys","{\"method\":{\"revision\":17,\"methodId\":\"m04_fixture-1\"},\"destinationCountryCode\":\"NO\",\"citizenshipCountryCode\":\"DE\"}","{\"citizenshipCountryCode\":\"DE\",\"destinationCountryCode\":\"NO\",\"kind\":\"combination_discovery\",\"method\":{\"methodId\":\"m04_fixture-1\",\"revision\":17}}","combination-discovery-job:v3:d70b8ea47efcee1340b1b587302045063b85b85fcb9d549884a147e6f02efea3"],
        ["minimum MethodId and revision","{\"destinationCountryCode\":\"IS\",\"method\":{\"revision\":1,\"methodId\":\"aa\"},\"citizenshipCountryCode\":\"CH\"}","{\"citizenshipCountryCode\":\"CH\",\"destinationCountryCode\":\"IS\",\"kind\":\"combination_discovery\",\"method\":{\"methodId\":\"aa\",\"revision\":1}}","combination-discovery-job:v3:29462a8a134a608b3a6dda2e2458c7620b8e9bc5f665d442a883789281da68aa"],
        ["maximum MethodId and revision","{\"method\":{\"revision\":2147483647,\"methodId\":\"z_______________________________________________________________\"},\"citizenshipCountryCode\":\"FR\",\"destinationCountryCode\":\"SE\"}","{\"citizenshipCountryCode\":\"FR\",\"destinationCountryCode\":\"SE\",\"kind\":\"combination_discovery\",\"method\":{\"methodId\":\"z_______________________________________________________________\",\"revision\":2147483647}}","combination-discovery-job:v3:bfe68f82f44aadb4463c0120d82e09d59f2db2bf9dda4f527c338e692f87eb93"],
      ] as const
      for (const [label, raw, subjectText, jobKey] of subjectReuseCases) {
        const parsed = result(await f.owner.query("SELECT official_v3_jobs_private.subject_v1('combination_discovery',$1::jsonb) AS result", text([raw])))
        assert.deepEqual(parsed, { kind: 'combination_discovery', jobKey, subjectText, contextKey: null }, 'R22 Discovery: ' + label)
      }
      const invalidSubjectReuseCases = [
        ["extra pair metadata","{\"citizenshipCountryCode\":\"CH\",\"destinationCountryCode\":\"IS\",\"method\":{\"methodId\":\"aa\",\"revision\":1},\"metadata\":\",\\\"method\\\":{\\\"methodId\\\":\\\"injected\\\",\\\"revision\\\":1}\"}"],
        ["missing country key","{\"destinationCountryCode\":\"IS\",\"method\":{\"methodId\":\"aa\",\"revision\":1}}"],
        ["invalid country","{\"citizenshipCountryCode\":\"CH\",\"destinationCountryCode\":\"ZZ\",\"method\":{\"methodId\":\"aa\",\"revision\":1}}"],
        ["hostile MethodId","{\"citizenshipCountryCode\":\"CH\",\"destinationCountryCode\":\"IS\",\"method\":{\"methodId\":\"aa\\\",\\\"method\\\":{\",\"revision\":1}}"],
        ["revision above limit","{\"citizenshipCountryCode\":\"CH\",\"destinationCountryCode\":\"IS\",\"method\":{\"methodId\":\"aa\",\"revision\":2147483648}}"],
        ["MethodId above limit","{\"citizenshipCountryCode\":\"CH\",\"destinationCountryCode\":\"IS\",\"method\":{\"methodId\":\"z________________________________________________________________\",\"revision\":1}}"],
      ] as const
      for (const [label, raw] of invalidSubjectReuseCases) {
        await assert.rejects(f.owner.query("SELECT official_v3_jobs_private.subject_v1('combination_discovery',$1::jsonb) AS result", text([raw])), code('P7601'), 'R22 Discovery refusal: ' + label)
      }
      await f.owner.query(`DO $r22_subject_order$
        DECLARE actual_message text; bad_input jsonb; expected_message text;
        BEGIN
          FOR bad_input,expected_message IN SELECT * FROM (VALUES
            ('{"citizenshipCountryCode":"CH","destinationCountryCode":"ZZ","method":{"methodId":"aa","revision":1,"extra":true}}'::jsonb,'m04 invalid method'::text),
            ('{"citizenshipCountryCode":"CH","destinationCountryCode":"ZZ","method":{"methodId":"aa","revision":1},"metadata":true}'::jsonb,'m04 invalid pair'::text)
          ) AS oracle(value,expected) LOOP
            BEGIN
              PERFORM official_v3_jobs_private.subject_v1('combination_discovery',bad_input);
              RAISE EXCEPTION 'r22 invalid Discovery accepted';
            EXCEPTION WHEN SQLSTATE 'P7601' THEN
              GET STACKED DIAGNOSTICS actual_message = MESSAGE_TEXT;
              IF actual_message IS DISTINCT FROM expected_message THEN RAISE EXCEPTION 'r22 subject guard order'; END IF;
            END;
          END LOOP;
        END $r22_subject_order$`)
      const leaseUpdated = '2026-11-09T00:00:02.000Z'
      const leaseTimeCases = [
        ['equal valid exact 900s', leaseUpdated, '2026-11-09T00:15:02.000Z', true, false],
        ['older valid exact 900s', '2026-11-09T00:00:01.000Z', '2026-11-09T00:15:01.000Z', true, false],
        ['future acquired', '2026-11-09T00:00:03.000Z', '2026-11-09T00:15:02.000Z', false, false],
        ['acquired before created', '2026-11-08T23:59:59.999Z', '2026-11-09T00:15:02.000Z', false, false],
        ['JSON null acquired', null, '2026-11-09T00:15:02.000Z', false, false],
        ['object acquired', {}, '2026-11-09T00:15:02.000Z', false, false],
        ['malformed acquired', 'not-a-time', '2026-11-09T00:15:02.000Z', false, false],
        ['same instant different text', '2026-11-09T00:00:02.000+00:00', '2026-11-09T00:15:02.000Z', false, false],
        ['expiry equals updated', leaseUpdated, leaseUpdated, false, false],
        ['malformed expiry', leaseUpdated, 'not-a-time', false, false],
        ['equal acquired over 900s', leaseUpdated, '2026-11-09T00:15:02.001Z', false, false],
        ['older acquired over 900s but within updated bound', '2026-11-09T00:00:01.000Z', '2026-11-09T00:15:01.001Z', false, false],
        ['extra lease key before malformed times', 'not-a-time', 'not-a-time', false, true],
      ] as const
      for (const kind of ['rule_research', 'combination_discovery'] as const) {
        // Both records come from the unchanged actual queue; this helper never persists history.
        const queued = await commandRequest({ action: 'enqueue', kind,
          input: kind === 'rule_research' ? commandFixture.ruleInput : commandFixture.discoveryInput }, null, timeAt)
        const claimed = await commandRequest({ action: 'claim', input: commandFixture.claim(kind) }, queued.body.commit.next, leaseUpdated)
        const base = claimed.body.commit.next
        assert.equal(base.state, 'leased'); assert.ok(base.lease)
        assert.equal(base.createdAt, timeAt); assert.equal(base.updatedAt, leaseUpdated); assert.equal(base.lease.acquiredAt, leaseUpdated)
        for (const [label, acquiredAt, expiresAt, valid, extraKey] of leaseTimeCases) {
          // Only the final case intentionally fails at the earlier exact-lease-key guard.
          const value: Record<string, unknown> = { ...base, lease: { ...base.lease, acquiredAt, expiresAt, ...(extraKey ? { extra: true } : {}) } }
          const query = f.owner.query('SELECT official_v3_jobs_private.job_v1($1::jsonb) AS result', text([JSON.stringify(value)]))
          if (valid) assert.deepEqual(result(await query), value, 'R22 ' + kind + ': ' + label)
          else await assert.rejects(query, code('P7601'), 'R22 ' + kind + ': ' + label)
        }
      }
      const empty = { operation: 'queue_read', body: { jobKey: 'research-job:v3:' + 'a'.repeat(64), continuation: null } }
      const before = await f.state(empty.body.jobKey)
      const s1SchemaUsage = await runtime.query(`SELECT has_schema_privilege('postgres','official_v3_intake_private','USAGE')::text AS owner_private,
        has_schema_privilege('postgres','official_v3_intake_api','USAGE')::text AS owner_api,
        has_schema_privilege('ot_v3_jobs_caller','official_v3_intake_private','USAGE')::text AS caller_private,
        has_schema_privilege('ot_v3_jobs_caller','official_v3_intake_api','USAGE')::text AS caller_api`)
      assert.deepEqual(s1SchemaUsage, [{ owner_private: 'false', owner_api: 'false', caller_private: 'false', caller_api: 'false' }])
      assert.deepEqual(await fixed(runtime, empty, null, 'probe'), { status: 'absent' }, 'T01 empty-text epoch is genuine SQL NULL')
      // R13: the real restricted runtime must inspect pinned OIDs without S1 schema USAGE.
      // This pinned predecessor is not a direct parsed bridge target: its rename isolates that fingerprint.
      const catalogBeforeRename = await catalog(f.owner)
      const predecessorOid = (await f.owner.query("SELECT 'official_v3_intake_private.binding_valid_v1(jsonb)'::regprocedure::oid::text AS oid"))[0]!.oid!
      await f.owner.query('ALTER FUNCTION official_v3_intake_private.binding_valid_v1(jsonb) RENAME TO m04_r13_binding_drift')
      try {
        assert.deepEqual(await f.owner.query('SELECT oid::text,proname::text AS name FROM pg_catalog.pg_proc WHERE oid=$1::oid', text([predecessorOid])),
          [{ oid: predecessorOid, name: 'm04_r13_binding_drift' }], 'rename preserves the pinned predecessor OID')
        await assert.rejects(fixed(runtime, empty, null, 'probe'), code('P7603'), 'same-OID predecessor identity drift is refused')
      } finally {
        await f.owner.query('ALTER FUNCTION official_v3_intake_private.m04_r13_binding_drift(jsonb) RENAME TO binding_valid_v1')
      }
      assert.equal(await catalog(f.owner), catalogBeforeRename, 'disposable predecessor rename restores the exact full catalog without grants')
      assert.deepEqual(await fixed(runtime, empty, null, 'probe'), { status: 'absent' }, 'restricted runtime succeeds again after exact restoration')
      await assert.rejects(fixed(runtime, empty, null), code('P7601'))
      await assert.rejects(runtime.query(M04_FIXED_SQL, text([m04Canonical({ ...empty, phase: 'authorized' }), binding.methodId, binding.revision,
        binding.methodDigest, binding.packageDigest, 'not-an-integer', 5000, new Date(Date.now() + 5000).toISOString()])), code('22P02'))
      assert.deepEqual(await fixed(runtime, empty, await currentEpoch()), { status: 'absent' })
      for (const bad of [
        { operation: 'queue_read', phase: 'probe', body: { ...empty.body, extra: true } },
        { operation: 'queue_read', phase: 'probe', body: { jobKey: null, continuation: null } },
        { operation: 'queue_read', phase: 'probe', body: { jobKey: empty.body.jobKey } },
      ]) await assert.rejects(runtime.query(M04_FIXED_SQL, text([m04Canonical(bad), binding.methodId, binding.revision, binding.methodDigest, binding.packageDigest, null, 5000, new Date(Date.now() + 5000).toISOString()])), code('P7601'))
      const goodWire = m04Canonical({ ...empty, phase: 'probe' })
      for (const wire of [' ' + goodWire, goodWire.replace('"operation":"queue_read"', '"operation":"queue_read","operation":"queue_read"'), goodWire.replace('"continuation":null', '"continuation":-0'), 'x'.repeat(262145)])
        await assert.rejects(runtime.query(M04_FIXED_SQL, text([wire, binding.methodId, binding.revision, binding.methodDigest, binding.packageDigest, null, 5000, new Date(Date.now() + 5000).toISOString()])), code('P7601'))
      for (const mutate of [
        (c: Record<string, unknown>) => { (c.scope as { citizenship: { mode: unknown } }).citizenship.mode = null },
        (c: Record<string, unknown>) => { c.contextRevision = 2; c.application = { purpose: null, tripStartAndEndWindow: { from: '2026-11-09', through: '2026-11-20' } } },
      ]) {
        const c = JSON.parse(JSON.stringify(contextFor(18))); mutate(c)
        await assert.rejects(f.owner.query('SELECT official_v3_jobs_private.context_v1($1::jsonb)', text([JSON.stringify(c)])), code('P7601'))
      }
      const normal = m04IdentityVectors()[0]!.input
      for (const methodId of [null, true, false]) {
        const bad = { ...normal, method: { ...normal.method, methodId } }
        await assert.rejects(f.owner.query('SELECT official_v3_jobs_private.subject_v1($1::text,$2::jsonb)', text(['rule_research', JSON.stringify(bad)])), code('P7601'))
        const d = m04Fixture('native-reference-string').delivery(), parsed = readV3RetainableProposal(d.text, m04Fixture('native-reference-string').originals.registry)
        assert.ok(parsed.ok); if (!parsed.ok) throw Error('reference fixture')
        const reference = { binding: { ...d.binding, method: { ...d.binding.method, methodId } }, proposalDigest: parsed.value.digest, bytes: parsed.value.bytes }
        await assert.rejects(f.owner.query('SELECT official_v3_jobs_private.reference_v1($1::jsonb)', text([JSON.stringify(reference)])), code('P7601'))
      }
      await assert.rejects(f.owner.query('SELECT official_v3_jobs_private.subject_v1($1::text,$2::jsonb)',
        text(['rule_research', JSON.stringify({ ...normal, researchReason: { status: null, reason: 'max_age_exceeded' } })])), code('P7601'))
      const valid = m04Fixture('native-full-boundary', { context: contextFor(59) })
      const prospective = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: valid.ruleInput }, null)
      const untouched = await f.state(valid.identity.jobKey)
      assert.equal(createM04SubjectIdentity('rule_research', { ...valid.ruleInput, context: contextFor(60) }), null,
        'enqueue-shaped input is rejected by the strict subject identity reader')
      const alternate = createM04SubjectIdentity('rule_research', {
        context: contextFor(60), method: valid.ruleInput.method,
        factKind: valid.ruleInput.factKind, researchReason: valid.ruleInput.researchReason,
      })
      assert.ok(alternate)
      assert.notEqual(alternate.jobKey, valid.identity.jobKey, 'alternate fixture has a distinct job locator')
      assert.notEqual(alternate.subjectText, prospective.body.subjectText, 'alternate fixture has a distinct canonical subject')
      await assert.rejects(fixed(runtime, { ...prospective, body: { ...prospective.body, subjectText: alternate.subjectText } }, await currentEpoch()), code('P7601'))
      await assert.rejects(fixed(runtime, { ...prospective, body: { ...prospective.body,
        commit: { ...prospective.body.commit, commandKey: 'queue-command:v3:' + '0'.repeat(64) } } }, await currentEpoch()), code('P7601'))
      await assert.rejects(fixed(runtime, prospective, (await currentEpoch()) + 1), code('P7504'))
      assert.deepEqual(await f.state(valid.identity.jobKey), untouched, 'forged subject/command/epoch never create another subject bucket')
      const dispositions = await f.owner.query('SELECT count(*)::text AS n FROM official_v3_jobs_private.execution_dispositions_v1')
      await assert.rejects(f.owner.query("INSERT INTO official_v3_jobs_private.execution_dispositions_v1(attempt_key,queue_operation_id,kind,failure_reason,settled_at) VALUES($1,$2,'settled_failure',NULL,clock_timestamp())",
        text(['execution-attempt:v3:' + '0'.repeat(64), ids('op3', 'native-null-failure')])), code('23514'))
      assert.deepEqual(await f.owner.query('SELECT count(*)::text AS n FROM official_v3_jobs_private.execution_dispositions_v1'), dispositions)
      assert.deepEqual(await f.state(empty.body.jobKey), before)
    })
    await proof('N03', 'actual durable command replay, independent subjects, cycle collisions and active dedup', async () => {
      const input = m04Fixture('native-commands', { context: contextFor(2) }), api = createV3PostgresDurableJobs(config(input, native, method))
      const first = await api.enqueueRule(input.ruleInput); assert.equal(first.status, 'confirmed', JSON.stringify(first))
      const before = await f.state(input.identity.jobKey)
      const replay = await api.enqueueRule(input.ruleInput); assert.equal(replay.status, 'confirmed')
      assert.deepEqual(await f.state(input.identity.jobKey), before, 'same operation never appends or reconstructs envelope')
      const row = await f.owner.query('SELECT command_text,envelope_text,audit_reference,authority FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=$1', text([input.ruleInput.operationId]))
      assert.equal(row.length, 1); const envelope = JSON.parse(row[0]!.envelope_text!)
      assert.equal(m04Canonical(envelope), row[0]!.envelope_text)
      assert.deepEqual(envelope.next, first.status === 'confirmed' ? first.record : null)
      const another = { ...input.ruleInput, operationId: ids('op3', 'dedup-other'), jobId: ids('job3', 'dedup-other') }
      assert.equal((await api.enqueueRule(another)).status, 'confirmed')
      const held = result(await fixed(runtime, { operation: 'queue_read', body: { jobKey: input.identity.jobKey, continuation: null } }, await currentEpoch()).then(v => [{ result: JSON.stringify(v) }]))
      assert.equal((held.record as V3ManagedJobRecord).jobId, input.ruleInput.jobId)
      const foreign = m04Fixture('native-other-subject', { context: contextFor(3) })
      const foreignApi = createV3PostgresDurableJobs(config(foreign, native, method))
      assert.notEqual((await foreignApi.enqueueRule({ ...foreign.ruleInput, operationId: input.ruleInput.operationId })).status, 'confirmed')
      assert.ok(Object.values(JSON.parse((await f.state(foreign.identity.jobKey))[0]!.state!)).every(v => v === null))
      assert.equal((await foreignApi.enqueueRule(foreign.ruleInput)).status, 'confirmed')
      // R18: both kinds keep full prior validation and exact deduplicated next equality.
      const dedupBase = m04Fixture('r18-dedup-base'), epoch = await currentEpoch()
      for (const kind of ['rule_research', 'combination_discovery'] as const) {
        const fixture = m04Fixture('r18-dedup-' + kind, { context: kind === 'rule_research' ? contextFor(68) : dedupBase.originals.context('CH', 'SE') })
        const enqueueInput = kind === 'rule_research' ? fixture.ruleInput : fixture.discoveryInput
        const jobKey = kind === 'rule_research' ? fixture.identity.jobKey : fixture.discovery.jobKey
        assert.equal((await fixed(runtime, { operation: 'queue_read', body: { jobKey, continuation: null } }, null, 'probe')).status, 'absent')
        const initial = await commandRequest({ action: 'enqueue', kind, input: enqueueInput }, null)
        assert.equal((await fixed(runtime, initial, epoch)).status, 'committed')
        const current = initial.body.commit.next
        const duplicate = await commandRequest({ action: 'enqueue', kind, input: { ...enqueueInput,
          operationId: ids('op3', 'r18-dedup-second-' + kind), jobId: ids('job3', 'r18-dedup-second-' + kind) } }, current)
        assert.deepEqual(duplicate.body.commit.next, current); assert.equal(duplicate.body.commit.audit.kind, 'deduplicated')
        const transitionSQL = 'SELECT official_v3_jobs_private.transition_v1($1::jsonb,$2::jsonb,$3::jsonb)'
        await f.owner.query(transitionSQL, text([JSON.stringify(duplicate.body.command), JSON.stringify(current), JSON.stringify(duplicate.body.commit)]))
        const malformed = { ...current, attemptLimit: 0 }
        const malformedCommit = { ...duplicate.body.commit, expected: malformed, next: malformed }
        await assert.rejects(f.owner.query(transitionSQL, text([JSON.stringify(duplicate.body.command), JSON.stringify(malformed), JSON.stringify(malformedCommit)])),
          code('P7601'), kind + ': identical malformed current/expected/next cannot bypass prior validation')
        const forgedNext = { ...current, jobId: ids('job3', 'r18-dedup-forged-' + kind) }
        await f.owner.query('SELECT official_v3_jobs_private.job_v1($1::jsonb)', text([JSON.stringify(forgedNext)]))
        const forged = { ...duplicate, body: { ...duplicate.body, commit: { ...duplicate.body.commit, next: forgedNext } } }
        const unchanged = await f.state(jobKey)
        await assert.rejects(fixed(runtime, forged, epoch), code('P7601'), kind + ': distinct valid next record is not deduplication')
        assert.deepEqual(await f.state(jobKey), unchanged)
        assert.equal((await fixed(runtime, duplicate, epoch)).status, 'committed')
        const retained = JSON.parse((await f.state(jobKey))[0]!.state!)
        assert.equal(retained.commands.length, 2); assert.equal(retained.subjects[0].operation_count, 2)
        assert.deepEqual(retained.subjects[0].current_job, current)
      }
    })
    await proof('N07', 'actual S1/I1 Rule completion, immutable original and final MA1 authority', async () => {
      const seenContextKeys = new Set<string>(), seenJobKeys = new Set<string>()
      for (const [index, spelling] of ['18.0', '18e0', '1.8e1'].entries()) {
        const input = m04Fixture('native-rule-' + index, { context: contextFor(18 + index) })
        // Keep age 18 identical while the coherent citizenship/passport scope
        // distinguishes all three jobs and preserves each original number spelling.
        const country = ['CH', 'DE', 'FR'][index]!
        const inconsistent = { ...input.context, scope: { ...input.context.scope, citizenship: { ...input.context.scope.citizenship, countryCodes: [country] } }, conditions: contextFor(18).conditions }
        if (country !== 'CH') assert.equal(readV3GlobalRuleContext(inconsistent).ok, false, 'foreign citizenship with the original CH passport link is rejected')
        const ctx = { ...input.originals.context(country, input.context.scope.destinationCountryCode), conditions: contextFor(18).conditions }
        const parsed = readV3GlobalRuleContext(ctx); assert.ok(parsed.ok); if (!parsed.ok) throw Error('native context')
        const f2 = m04Fixture('native-rule-number-' + index, { context: parsed.value })
        assert.equal(seenContextKeys.has(f2.identity.contextKey), false, 'each number spelling uses a distinct valid work context')
        assert.equal(seenJobKeys.has(f2.identity.jobKey), false, 'each number spelling uses a distinct valid work job')
        seenContextKeys.add(f2.identity.contextKey); seenJobKeys.add(f2.identity.jobKey)
        const originals: string[] = []
        const api = createV3PostgresDurableJobs(config(f2, native, method, { producer: { async produce(request, s) {
          const p = await f2.producer.produce(request, s); if (p.status !== 'delivered') return p
          return { status: 'delivered', deliveries: p.deliveries.map(d => { const original = d.text.replace('"years": 18', '"years": ' + spelling); originals.push(original); return { ...d, text: original } }) }
        } } }))
        assert.equal((await api.enqueueRule(f2.ruleInput)).status, 'confirmed')
        const done = await api.workOnce(f2.claim()); assert.equal(done.status, 'processed', JSON.stringify({ done, codes: native.evidence.sqlCodes.slice(-3) }))
        if (done.status === 'processed') { assert.equal(done.worker.acceptedRule, false); assert.equal(done.results.length, 1) }
        assert.equal(f2.producerCalls(), 1)
        const rows = await f.owner.query('SELECT convert_from(o.original_bytes,\'UTF8\') AS original,c.outcome::text FROM official_v3_intake_private.operations_v1 o JOIN official_v3_intake_private.completions_v1 c USING(operation_id) WHERE o.binding->>\'jobId\'=$1', text([f2.ruleInput.jobId]))
        assert.equal(rows.length, 1); assert.equal(rows[0]?.original, originals[0]); assert.equal(JSON.parse(rows[0]!.outcome!).status, 'prepared')
        const states = JSON.parse((await f.state(f2.identity.jobKey))[0]!.state!)
        assert.equal(states.starts.length, 1); assert.equal(states.results.length, 1); assert.equal(states.dispositions[0].kind, 'completed')
        assert.equal(states.subjects[0].current_job.state, 'succeeded')
      }
      assert.equal(seenContextKeys.size, 3); assert.equal(seenJobKeys.size, 3)
      await assertNativeEmpty(native, method)
    })
    await proof('N07/R4', 'actual S1 archived history and linked method revision survive full native consumption', async () => {
      const sf = s1Fixture('m04-native-archived-history')
      const historical = await sf.withArchivedPredecessor('primary_unclear')
      assert.equal(historical.outcome.status, 'escalation')
      if (historical.outcome.status !== 'escalation') throw Error('archive fixture')
      assert.ok(historical.outcome.archiveAppend)
      // The protected synthetic clear qualifier is METHOD v1. Use its actual
      // unclear escalation to exercise v2 history without fabricating a qualifier.
      sf.synthetic.control.methodRevision = 2; sf.originals.control.primaryUnclear = true
      sf.originals.control.counter = 'not_found'
      const nextMethod = { methodId: binding.methodId, revision: 2 }
      const nextIdentity = createV3WorkIdentity({ context: sf.proposal.context, method: nextMethod,
        factKind: sf.proposal.research.factKind, researchReason: sf.proposal.research.researchReason })
      assert.ok(nextIdentity.ok); if (!nextIdentity.ok) throw Error('revision fixture')
      const nextText = JSON.stringify({ ...sf.proposal, operationId: ids('op3', 'm04-next-method'), research: nextIdentity.value.research }, null, 2)
      const prepared = await createV3ImportCoordinator({ ...sf.synthetic.importPorts, method: nextMethod }).submit(nextText)
      assert.equal(prepared.status, 'completed'); if (prepared.status !== 'completed' || prepared.outcome.status !== 'escalation') throw Error('revision decision')
      assert.equal(prepared.outcome.previousDecision?.method.revision, 1)
      assert.equal(prepared.outcome.decision.method.revision, 2)
      const cases = [
        { text: sf.text, binding: sf.binding, completion: historical },
        { text: nextText, binding: { ...sf.binding, operationId: ids('op3', 'm04-next-method'), method: nextMethod },
          completion: { outcome: prepared.outcome, audit: sf.synthetic.importAudits.at(-1)! } },
      ]
      for (const [index, value] of cases.entries()) {
        const store = createV3ProposalIntakeStore({ registry: sf.originals.registry, executor: native.intake, leaseMilliseconds: 5000 })
        const retained = await store.intake.capture(value.text, value.binding, signal()); assert.equal(retained.status, 'recorded')
        if (retained.status !== 'recorded') throw Error('archive capture')
        const upload = readV3RetainableProposal(value.text, sf.originals.registry); assert.ok(upload.ok)
        if (!upload.ok) throw Error('archive parse')
        const port = store.forImport(value.binding), held = await port.reserve(upload.value, signal())
        assert.equal(held.status, 'acquired'); if (held.status !== 'acquired') throw Error('archive reserve')
        assert.equal((await port.finish(held.ticket, value.completion.outcome, value.completion.audit, signal())).status, 'recorded')
        const opened = await store.open(retained.reference, signal()); assert.equal(opened.status, 'recorded')
        if (opened.status !== 'recorded') throw Error('archive read')
        assert.equal(opened.record.text, value.text)
        const completion = opened.record.completion; assert.ok(completion, 'actual S1 completion is required for archive proof')
        const nativeReply = result(await f.owner.query('SELECT official_v3_jobs_private.s1_read_v1($1::jsonb,$2::text,$3::integer) AS result',
          text([JSON.stringify(retained.reference.binding), retained.reference.proposalDigest, retained.reference.bytes])))
        assert.deepEqual(nativeReply, { status: 'recorded', record: { reference: opened.record.reference, text: opened.record.text,
          outcome: completion.outcome, audit: completion.audit } }, 'actual raw S1 reply matches the decoded original and completion')
        const queued = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: {
          context: upload.value.proposal.context, method: value.binding.method, factKind: upload.value.proposal.research.factKind,
          researchReason: upload.value.proposal.research.researchReason, operationId: ids('op3', 'archive-queue-' + index),
          jobId: value.binding.jobId, attemptLimit: 3,
        } }, null)
        const job = queued.body.commit.next, decisionRef = value.completion.audit.decisionRef!
        const workerResult = { kind: 'rule_research', jobId: job.jobId, operationId: job.operationId, jobKey: queued.body.commit.jobKey,
          preparedAt: value.completion.audit.recordedAt, decisionRef }
        await assert.rejects(f.owner.query('SELECT official_v3_jobs_private.consume_s1_v1($1::jsonb,$2::jsonb,$3::jsonb,$4::text)',
          text([JSON.stringify(opened), JSON.stringify(job), JSON.stringify(workerResult), 'prepare'])), code('P7604'), 'application DTO is not a raw S1 SQL reply')
        await assert.doesNotReject(f.owner.query('SELECT official_v3_jobs_private.consume_s1_v1($1::jsonb,$2::jsonb,$3::jsonb,$4::text)',
          text([JSON.stringify(nativeReply), JSON.stringify(job), JSON.stringify(workerResult), 'prepare'])),
          'N07/R4 raw case ' + index + ' method revision ' + value.binding.method.revision)
        for (const mutation of ['missing', 'audit', 'link', 'archive']) {
          const bad = JSON.parse(JSON.stringify(nativeReply))
          if (mutation === 'missing') { bad.record.outcome = null; bad.record.audit = null }
          else if (mutation === 'audit') bad.record.audit.decisionRef = 'source-decision:v3:' + '0'.repeat(64)
          else if (mutation === 'link') {
            const outcome = bad.record.outcome.status === 'prepared' ? bad.record.outcome.value : bad.record.outcome
            outcome.decision.predecessor = 'source-decision:v3:' + '0'.repeat(64)
          } else {
            const outcome = bad.record.outcome.status === 'prepared' ? bad.record.outcome.value : bad.record.outcome
            assert.ok(outcome.archiveAppend); outcome.archiveAppend.method = value.binding.method
          }
          await assert.rejects(f.owner.query('SELECT official_v3_jobs_private.consume_s1_v1($1::jsonb,$2::jsonb,$3::jsonb,$4::text)',
            text([JSON.stringify(bad), JSON.stringify(job), JSON.stringify(workerResult), 'prepare'])), code('P7604'))
        }
        assert.deepEqual(await store.open(retained.reference, signal()), opened, 'full real S1 original/completion remains unchanged')
      }
    })
    await proof('N08', 'sixteen actual persisted originals complete inside fixed call budgets', async () => {
      const input = m04Fixture('native-full-sixteen', { count: 16 }), api = createV3PostgresDurableJobs(config(input, native, method))
      assert.equal((await api.enqueueDiscovery(input.discoveryInput)).status, 'confirmed')
      const before = native.evidence.admitted + method.evidence.admitted
      const done = await api.workOnce(input.claim('combination_discovery'))
      assert.equal(done.status, 'processed', JSON.stringify({ done, codes: native.evidence.sqlCodes.slice(-3) }))
      if (done.status === 'processed') { assert.equal(done.results.length, 16); assert.equal(done.worker.acceptedRule, false) }
      assert.ok(native.evidence.admitted + method.evidence.admitted - before <= 256)
      assert.equal(input.producerCalls(), 1)
      const rows = await f.owner.query("SELECT operation_id,convert_from(original_bytes,'UTF8') AS original FROM official_v3_intake_private.operations_v1 WHERE binding->>'jobId'=$1 ORDER BY operation_id", text([input.ruleInput.jobId]))
      assert.equal(rows.length, 16)
      for (const d of input.delivered) assert.equal(rows.find(r => r.operation_id === d.binding.operationId)?.original, d.text)
      const completions = await f.owner.query("SELECT count(*)::text AS n FROM official_v3_intake_private.completions_v1 c JOIN official_v3_intake_private.operations_v1 o USING(operation_id) WHERE o.binding->>'jobId'=$1", text([input.ruleInput.jobId]))
      assert.equal(completions[0]?.n, '16')
      await assertNativeEmpty(native, method)
    })
    await proof('N08/U04', 'duplicate or missing final member is rejected before the first S1 effect for the whole batch', async () => {
      for (const [index, badKind] of ['duplicate', 'missing'].entries()) {
        const base = m04Fixture('native-bad-batch-context'), input = m04Fixture('native-bad-batch-' + badKind,
          { count: 16, context: base.originals.context(index === 0 ? 'DE' : 'FR') })
        const api = createV3PostgresDurableJobs(config(input, native, method, { producer: { async produce(request, s) {
          const delivery = await input.producer.produce(request, s); assert.equal(delivery.status, 'delivered')
          if (delivery.status !== 'delivered') return delivery
          const batch = [...delivery.deliveries]
          if (badKind === 'duplicate') batch[15] = batch[0]
          else delete batch[15]
          return { status: 'delivered', deliveries: batch }
        } } }))
        assert.equal((await api.enqueueDiscovery(input.discoveryInput)).status, 'confirmed')
        const beforeIntake = native.evidence.calls.filter(c => c.kind === 'intake').length
        assert.notEqual((await api.workOnce(input.claim('combination_discovery'))).status, 'processed')
        assert.equal(native.evidence.calls.filter(c => c.kind === 'intake').length, beforeIntake)
        assert.equal((await f.owner.query("SELECT count(*)::text AS n FROM official_v3_intake_private.operations_v1 WHERE binding->>'jobId'=$1", text([input.ruleInput.jobId])))[0]?.n, '0')
        const state = JSON.parse((await f.state(input.discovery.jobKey))[0]!.state!)
        assert.equal(state.starts.length, 1); assert.equal(state.results, null); assert.equal(state.dispositions[0].kind, 'settled_failure')
        assert.equal(state.dispositions[0].failure_reason, 'invalid_proposal')
      }
    })
    await proof('N02/U04', 'maximum node/support cardinalities fit the source-derived worst-valid wire bound', async () => {
      const bounds = m04WireUpperBounds(), input = m04Fixture('native-max-wire', { context: m04MaximumContext() })
      const api = createV3PostgresDurableJobs(config(input, native, method))
      const command = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: input.ruleInput }, null)
      const wire = m04Canonical({ ...command, phase: 'authorized' })
      assert.ok(Buffer.byteLength(wire) <= bounds.requests.queue_cas)
      assert.ok(bounds.maximum < 262144)
      assert.equal((await fixed(runtime, command, await currentEpoch())).status, 'committed')
      assert.equal((await api.enqueueRule(input.ruleInput)).status, 'confirmed')
      const readback = await fixed(runtime, { operation: 'queue_confirm', body: { command: command.body.command, continuation: null } }, await currentEpoch())
      assert.equal(readback.status, 'committed'); assert.ok(Buffer.byteLength(m04Canonical(readback)) <= bounds.replies.queue_confirm)
      const decoded = readM04NativeReply([{ result: JSON.stringify(readback) }], 'queue_confirm')
      assert.equal(decoded?.status, 'committed')
      assert.equal(readback.envelopeText, m04Canonical(command.body.commit))
    })
    await proof('N04/N06', 'two actual native starts race after preflight, one owned producer and no losing claim mutation', async () => {
      const input = m04Fixture('native-real-start-race', { context: contextFor(56) }), epoch = await currentEpoch()
      const enqueued = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: input.ruleInput }, null)
      assert.equal((await fixed(runtime, enqueued, epoch)).status, 'committed')
      const claimed = await commandRequest({ action: 'claim', input: input.claim() }, enqueued.body.commit.next)
      assert.equal((await fixed(runtime, claimed, epoch)).status, 'committed')
      const before = await f.state(input.identity.jobKey), holder = await f.connect()
      const bothAtStart = latch(lifetime), allowStart = latch(lifetime), finishProducer = latch(lifetime)
      const targets: Identity[] = []; let produced = 0
      const racing = await ownedNative(f.cluster, { async beforeQuery(call) {
        if (call.kind !== 'jobs' || call.operation !== 'execution_start') return
        assert.ok(call.targetId); targets.push(call.targetId)
        assert.ok(targets.length <= 2)
        if (targets.length === 2) bothAtStart.release()
        await allowStart.promise
      }, releaseGates: () => { allowStart.release(); finishProducer.release() } })
      const producer: M04Config['producer'] = { async produce() { produced++; await finishProducer.promise; return { status: 'failed', reason: 'unreachable' } } }
      const first = createV3PostgresDurableJobs(config(input, racing, method, { producer }))
      const second = createV3PostgresDurableJobs(config(input, racing, method, { producer }))
      let one: ReturnType<typeof observe<Awaited<ReturnType<typeof first.workOnce>>>> | undefined
      let two: typeof one
      try {
        one = observe(lifetime.track(first.workOnce(input.claim())))
        two = observe(lifetime.track(second.workOnce(input.claim())))
        await bothAtStart.promise
        assert.equal(produced, 0, 'both actual preflights and same-claim replays precede start admission')
        assert.deepEqual(await f.state(input.identity.jobKey), before)
        const attempt = key('execution-attempt', { subject: JSON.parse(claimed.body.subjectText), claim: input.claim(),
          leasedJob: claimed.body.commit.next, authority: { ...binding, epoch } })
        const names = ['subject:' + input.identity.jobKey, 'operation:' + input.claim().operationId, 'attempt:' + attempt]
        // Hold the lowest actual signed token, so neither contender can hold a
        // later token first. Both target PIDs must show this real lock holder.
        await holder.connection.query('BEGIN')
        await holder.connection.query("SELECT pg_advisory_xact_lock(min(('x'||substr(encode(sha256(convert_to('m04-lock:v1:'||v,'UTF8')),'hex'),1,16))::bit(64)::bigint)) FROM unnest($1::text[]) v", [pgText('{' + names.join(',') + '}')])
        allowStart.release()
        for (const target of targets) await until(lifetime, async () => {
          const row = (await f.observer.query("SELECT wait_event_type,($3::integer=ANY(pg_blocking_pids(pid)))::text AS held,EXISTS(SELECT 1 FROM pg_catalog.pg_locks l WHERE l.pid=a.pid AND l.locktype='advisory' AND NOT l.granted)::text AS advisory FROM pg_catalog.pg_stat_activity a WHERE pid=$1::integer AND backend_start=$2::timestamptz", text([target.pid, target.birth, holder.identity.pid])))[0]
          return row?.wait_event_type === 'Lock' && row.held === 'true' && row.advisory === 'true'
        }, 'each independently acquired native START must wait on the actual common first token')
        assert.equal(produced, 0); assert.equal(one.terminal(), false); assert.equal(two.terminal(), false)
        await holder.connection.query('COMMIT')
        await until(lifetime, async () => produced === 1 && (one!.terminal() || two!.terminal()), 'one winner and one refused racing start required')
        const state = JSON.parse((await f.state(input.identity.jobKey))[0]!.state!)
        assert.equal(state.starts.length, 1); assert.equal(state.commands.length, 2); assert.equal(state.dispositions, null)
        assert.equal(state.subjects[0].current_job.attempt, claimed.body.commit.next.attempt)
        const separate = m04Fixture('native-race-independent', { context: contextFor(57) })
        assert.equal((await createV3PostgresDurableJobs(config(separate, native, method)).enqueueRule(separate.ruleInput)).status, 'confirmed')
        finishProducer.release()
        const outcomes = await Promise.all([one.joined, two.joined])
        assert.ok(outcomes.every(r => !r.error)); assert.equal(produced, 1)
        const final = JSON.parse((await f.state(input.identity.jobKey))[0]!.state!)
        assert.equal(final.commands.length, 3); assert.equal(final.starts.length, 1); assert.equal(final.dispositions.length, 1)
        assert.equal(final.dispositions[0].kind, 'settled_failure')
      } finally {
        allowStart.release(); finishProducer.release(); await holder.connection.query('ROLLBACK')
        await Promise.all([one?.joined, two?.joined]); holder.connection.close(); await racing.dispose()
      }
    })
    await proof('N04/N06/N10', 'older active start blocks a new claim while an independent subject progresses', async () => {
      const input = m04Fixture('native-contended-start', { context: contextFor(25), fail: true }), gate = latch(lifetime)
      let produced = 0
      const producer: M04Config['producer'] = { async produce() { produced++; await gate.promise; return { status: 'failed', reason: 'unreachable' } } }
      const api = createV3PostgresDurableJobs(config(input, native, method, { producer }))
      assert.equal((await api.enqueueRule(input.ruleInput)).status, 'confirmed')
      const pending = observe(lifetime.track(api.workOnce(input.claim())))
      await until(lifetime, async () => produced === 1, 'first actual reserved producer did not start')
      const before = await f.state(input.identity.jobKey)
      const other = createV3PostgresDurableJobs(config(input, native, method, { producer }))
      const refusalResult = await other.workOnce(input.claim('rule_research', 2))
      assert.notEqual(refusalResult.status, 'processed'); assert.equal(produced, 1)
      assert.deepEqual(await f.state(input.identity.jobKey), before, 'contender cannot claim/fail/audit active start')
      const separate = m04Fixture('native-independent', { context: contextFor(26) })
      assert.equal((await createV3PostgresDurableJobs(config(separate, native, method)).enqueueRule(separate.ruleInput)).status, 'confirmed')
      gate.release(); const done = await pending.joined; assert.equal(done.error, undefined)
      assert.equal(done.value?.status, 'worker_only')
      const state = JSON.parse((await f.state(input.identity.jobKey))[0]!.state!)
      assert.equal(state.starts.length, 1); assert.equal(state.dispositions.length, 1)
      assert.equal(state.dispositions[0].kind, 'settled_failure'); assert.equal(state.dispositions[0].failure_reason, 'unreachable')
      assert.equal(state.subjects[0].current_job.state, 'backoff'); assert.equal(state.subjects[0].terminal_credit_claim, null)
      await assertNativeEmpty(native, method)
    })
    await proof('N05/N09', 'real process crash preserves older unknown across IDs, reason and reapproved epoch', async () => {
      const input = m04Fixture('native-child-unknown', { context: contextFor(27) })
      const first = childWorker(lifetime, children, native, method)
      await first.command('init', { seed: 'native-child-unknown', context: input.context, count: 1, mode: 'hang' })
      assert.equal((await first.command('enqueue_rule')).status, 'confirmed')
      const pending = observe(first.command('work', input.claim()))
      await until(lifetime, async () => first.producerCalls() === 1, 'actual child producer START acknowledgement missing')
      const before = await f.state(input.identity.jobKey)
      const terminal = await first.close(true); assert.ok(terminal.exited && terminal.closeSeen)
      assert.ok((await pending.joined).error, 'killed producer did not finish')
      assert.deepEqual(await f.state(input.identity.jobKey), before)
      await f.revoke(); await f.approveCurrent()
      const restarted = childWorker(lifetime, children, native, method)
      await restarted.command('init', { seed: 'native-child-unknown', context: input.context, count: 1, mode: 'normal' })
      assert.notEqual((await restarted.command('work', input.claim())).status, 'processed')
      assert.notEqual((await restarted.command('work', input.claim('rule_research', 2))).status, 'processed')
      assert.equal(restarted.producerCalls(), 0); await restarted.close()
      const api = createV3PostgresDurableJobs(config(input, native, method))
      assert.notEqual((await api.enqueueRule({ ...input.ruleInput, operationId: ids('op3', 'unknown-new-cycle'), jobId: ids('job3', 'unknown-new-cycle'),
        researchReason: { status: 'recheck_needed', reason: 'max_age_exceeded' } })).status, 'confirmed')
      assert.deepEqual(await f.state(input.identity.jobKey), before, 'new method epoch never clears an old unknown start')
      for (const epoch of [null, await currentEpoch(), 2147483647]) {
        const reply = await fixed(runtime, { operation: 'execution_read', body: { claim: input.claim('rule_research', 3), purpose: 'lookup' } }, epoch, epoch === null ? 'probe' : 'authorized')
        assert.equal(reply.status, 'blocked')
      }
      await assertNativeEmpty(native, method)
    })
    await proof('N09', 'prepared and completed lost acknowledgements recover in a fresh process without producer reuse', async () => {
      for (const [index, loseOperation] of ['execution_prepare', 'queue_cas', 'execution_prepare'].entries()) {
        const input = m04Fixture('native-child-recovery-' + index, { context: contextFor(29 + index) })
        const originalClaim = { ...input.claim(), leaseMilliseconds: index === 0 ? 30000 : 5000 }
        let armed = false, lost = false
        const faulty = await ownedNative(f.cluster, { loseAcknowledgement(call) {
          if (!armed || lost || call.kind !== 'jobs' || call.operation !== loseOperation) return false
          // For Complete loss arm only once an actual PREPARED is acknowledged.
          lost = true; return true
        }, afterQuery: async (call, rows) => {
          if (index === 1 && call.operation === 'execution_prepare' && result(rows).status === 'prepared') armed = true
        } })
        try {
          const api = createV3PostgresDurableJobs(config(input, faulty, method))
          assert.equal((await api.enqueueRule(input.ruleInput)).status, 'confirmed')
          if (index !== 1) armed = true
          assert.notEqual((await api.workOnce(originalClaim)).status, 'processed'); assert.equal(lost, true)
          const before = JSON.parse((await f.state(input.identity.jobKey))[0]!.state!)
          assert.equal(before.starts.length, 1); assert.equal(before.results.length, 1)
          assert.equal(before.dispositions?.length ?? 0, index === 1 ? 1 : 0)
          if (index !== 1) {
            const unchanged = await f.state(input.identity.jobKey)
            for (const changed of [{ ...originalClaim, leaseMilliseconds: originalClaim.leaseMilliseconds - 1 },
              { ...originalClaim, leaseId: ids('lease3', 'native-recovery-foreign-fence') }, input.claim('rule_research', 2)]) {
              assert.equal((await fixed(runtime, { operation: 'execution_read', body: { claim: changed, purpose: 'resume' } }, await currentEpoch())).status, 'blocked')
            }
            assert.notEqual((await api.enqueueRule({ ...input.ruleInput, operationId: ids('op3', 'native-recovery-cycle-' + index), jobId: ids('job3', 'native-recovery-cycle-' + index) })).status, 'confirmed')
            assert.deepEqual(await f.state(input.identity.jobKey), unchanged)
          }
          if (index !== 0) await until(lifetime, async () => (await f.observer.query('SELECT (clock_timestamp()>$1::timestamptz)::text AS expired',
            text([before.starts[0].leased_job.lease.expiresAt])))[0]?.expired === 'true', 'actual original recovery lease must expire', 6000)
          if (index === 2) await assert.rejects(fixed(runtime, { operation: 'execution_read', body: { claim: originalClaim, purpose: 'resume' } }, await currentEpoch()), code('P7605'))
          const worker = childWorker(lifetime, children, native, method)
          await worker.command('init', { seed: 'native-child-recovery-' + index, context: input.context, count: 1, mode: 'normal' })
          const replay = await worker.command('work', originalClaim)
          // Native completion must be durable even when new synthetic source
          // proof cannot reconstruct an old in-process evidence receipt.
          if (index !== 2) assert.ok(replay.status === 'processed' || replay.status === 'worker_only', JSON.stringify(replay))
          else assert.notEqual(replay.status, 'processed')
          assert.equal(worker.producerCalls(), 0)
          const after = JSON.parse((await f.state(input.identity.jobKey))[0]!.state!)
          assert.equal(after.starts.length, 1); assert.equal(after.results.length, 1)
          if (index !== 2) { assert.equal(after.dispositions.length, 1); assert.equal(after.subjects[0].current_job.state, 'succeeded') }
          else assert.deepEqual(after, before, 'expired PREPARED keeps the original unknown and all records')
          await worker.close()
          const wrong = { ...originalClaim, leaseMilliseconds: originalClaim.leaseMilliseconds - 1 }
          assert.equal((await fixed(runtime, { operation: 'execution_read', body: { claim: wrong, purpose: 'resume' } }, await currentEpoch())).status, index === 2 ? 'blocked' : 'collision')
          if (index === 2) {
            await f.revoke(); await f.approveCurrent()
            assert.equal((await fixed(runtime, { operation: 'execution_read', body: { claim: originalClaim, purpose: 'resume' } }, await currentEpoch())).status, 'blocked')
            assert.deepEqual(JSON.parse((await f.state(input.identity.jobKey))[0]!.state!), before)
          }
        } finally { await faulty.dispose() }
      }
      await assertNativeEmpty(native, method)
    })
    await proof('N10/U06', 'delivered producer does not terminate a pending I1 evidence callback', async () => {
      const input = m04Fixture('native-pending-evidence', { context: contextFor(32) }), gate = latch(lifetime)
      let entered = false, terminal = false
      const evidence: M04Config['evidence'] = { async inspect() { entered = true; await gate.promise; terminal = true; return { status: 'unavailable' } }, reprove: input.evidence.reprove }
      const api = createV3PostgresDurableJobs(config(input, native, method, { evidence }))
      assert.equal((await api.enqueueRule(input.ruleInput)).status, 'confirmed')
      const work = observe(lifetime.track(api.workOnce(input.claim())))
      await until(lifetime, async () => entered, 'actual I1 evidence callback did not start')
      const outcome = await work.joined; assert.equal(outcome.error, undefined); assert.notEqual(outcome.value?.status, 'processed')
      assert.equal(terminal, false); assert.equal(input.producerCalls(), 1)
      const before = await f.state(input.identity.jobKey), actual = JSON.parse(before[0]!.state!)
      assert.equal(actual.starts.length, 1); assert.equal(actual.dispositions, null)
      const admitted = native.evidence.admitted
      gate.release(); await until(lifetime, async () => terminal, 'late callback did not terminate')
      assert.equal(native.evidence.admitted, admitted, 'sealed late callback never dispatches native SQL')
      assert.deepEqual(await f.state(input.identity.jobKey), before)
      await assertNativeEmpty(native, method)
    })
    await proof('N11', 'anchored budgets and actual due/lease checks after MA1, subject, advisory and table waits', async () => {
      const input = m04Fixture('native-wait-lease', { context: contextFor(40) }), api = createV3PostgresDurableJobs(config(input, native, method))
      const enqueued = await api.enqueueRule(input.ruleInput); assert.equal(enqueued.status, 'confirmed')
      if (enqueued.status !== 'confirmed') throw Error('native enqueue')
      const original = await f.state(input.identity.jobKey), epoch = await currentEpoch()
      const holder = await f.connect(), waiter = await f.connect(M04_TEST_LOGIN.jobs, 'ot_v3_jobs_caller')
      const short = await commandRequest({ action: 'claim', input: { ...input.claim(), leaseMilliseconds: 150 } }, enqueued.record)
      await holder.connection.query('BEGIN')
      await holder.connection.query('SELECT 1 FROM official_v3_method_private.heads_v1 WHERE method_id=$1 FOR UPDATE', text([binding.methodId]))
      const pending = observe(lifetime.track(fixed(waiter.connection, short, epoch)))
      await blocked(f, lifetime, waiter.identity, holder.identity, 'official_v3_method_private.heads_v1', () => !pending.terminal())
      await until(lifetime, async () => (await f.observer.query('SELECT (clock_timestamp()>$1::timestamptz)::text AS expired', text([short.body.commit.next.lease!.expiresAt])))[0]?.expired === 'true', 'short new lease did not actually expire')
      await holder.connection.query('COMMIT')
      assert.ok(code('P7605')((await pending.joined).error), 'no acknowledged already-expired new claim')
      assert.deepEqual(await f.state(input.identity.jobKey), original)
      for (const kind of ['subject', 'advisory', 'table'] as const) {
        await holder.connection.query('BEGIN')
        if (kind === 'subject') await holder.connection.query('SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE job_key=$1 FOR UPDATE', text([input.identity.jobKey]))
        else if (kind === 'table') await holder.connection.query('LOCK TABLE official_v3_jobs_private.slots_v1 IN ACCESS EXCLUSIVE MODE')
        else await holder.connection.query("SELECT pg_advisory_xact_lock(('x'||substr(encode(sha256(convert_to('m04-lock:v1:subject:'||$1,'UTF8')),'hex'),1,16))::bit(64)::bigint)", text([input.identity.jobKey]))
        const cap = 350, wait = observe(lifetime.track(fixed(waiter.connection, { operation: 'queue_read', body: { jobKey: input.identity.jobKey, continuation: null } }, epoch, 'authorized', cap)))
        await until(lifetime, async () => {
          const row = (await f.observer.query('SELECT wait_event_type,($3::integer=ANY(pg_blocking_pids(pid)))::text AS holder FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz', text([waiter.identity.pid, waiter.identity.birth, holder.identity.pid])))[0]
          return row?.wait_event_type === 'Lock' && row.holder === 'true' && !wait.terminal()
        }, 'actual ' + kind + ' wait absent')
        const done = await wait.joined
        assert.ok(code('55P03')(done.error) || code('P7605')(done.error), 'original budget refused after actual wait')
        await holder.connection.query('ROLLBACK'); assert.deepEqual(await f.state(input.identity.jobKey), original)
      }
      // A future audit cannot advance the database due clock or reclaim live work.
      const claim = await commandRequest({ action: 'claim', input: input.claim() }, enqueued.record)
      assert.equal((await fixed(runtime, claim, epoch)).status, 'committed')
      const leased = claim.body.commit.next
      const failureInput = { operationId: ids('op3', 'native-due-fail'), jobKey: input.identity.jobKey,
        fence: { jobId: leased.jobId, revision: leased.revision, leaseId: leased.lease!.leaseId, generation: leased.lease!.generation }, reason: 'unreachable' }
      const futureReclaim = await commandRequest({ action: 'claim', input: input.claim('rule_research', 2) }, leased, new Date(Date.parse(leased.lease!.expiresAt) + 1).toISOString())
      const liveState = await f.state(input.identity.jobKey)
      await assert.rejects(fixed(runtime, futureReclaim, epoch), code('P7605')); assert.deepEqual(await f.state(input.identity.jobKey), liveState)
      const fail = await commandRequest({ action: 'fail', input: failureInput }, leased)
      assert.equal((await fixed(runtime, fail, epoch)).status, 'committed', 'native ordinary preSTART terminal-credit transition remains valid')
      const backoff = fail.body.commit.next
      const early = await commandRequest({ action: 'claim', input: input.claim('rule_research', 3) }, backoff, new Date(Date.parse(backoff.nextAttemptAt!) + 1).toISOString())
      const backoffState = await f.state(input.identity.jobKey)
      await assert.rejects(fixed(runtime, early, epoch), code('P7605')); assert.deepEqual(await f.state(input.identity.jobKey), backoffState)
      holder.connection.close(); waiter.connection.close()
    })
    await proof('N11', 'actual revoke held in a native transaction defeats staged queue writes after the wait', async () => {
      const input = m04Fixture('native-revoke-wait', { context: contextFor(41) })
      const request = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: input.ruleInput }, null)
      const epoch = await currentEpoch(), before = await f.state(input.identity.jobKey)
      const holder = await f.connect(MA1_AUTH.humanLogin, 'authenticated'), waiter = await f.connect(M04_TEST_LOGIN.jobs, 'ot_v3_jobs_caller')
      await holder.connection.query("SELECT set_config('request.jwt.claims',$1,false)", text([JSON.stringify(ma1Claims())]))
      await holder.connection.query('BEGIN')
      assert.equal(result(await holder.connection.query('SELECT official_v3_method_api.revoke_v1($1,$2,$3::integer,$4,$5,$6::integer) AS result', text([ma1Operation(++op), binding.methodId, binding.revision, binding.methodDigest, binding.packageDigest, epoch]))).status, 'recorded')
      const wait = observe(lifetime.track(fixed(waiter.connection, request, epoch)))
      await blocked(f, lifetime, waiter.identity, holder.identity, 'official_v3_method_private.heads_v1', () => !wait.terminal())
      await holder.connection.query('COMMIT')
      assert.ok(code('P7504')((await wait.joined).error)); assert.deepEqual(await f.state(input.identity.jobKey), before)
      await f.approveCurrent(); holder.connection.close(); waiter.connection.close()
    })
    await proof('N12', 'acquisition, control failure and real drain never free a live native lane', async () => {
      const empty = { operation: 'queue_read', phase: 'probe', body: { jobKey: 'research-job:v3:' + 'f'.repeat(64), continuation: null } }
      const request = (): M04FixedRequest => ({ ...binding, operationText: m04Canonical(empty), epoch: null,
        budget: { deadline: performance.now() + 5000 }, notAfter: new Date(Date.now() + 5000).toISOString() }) as M04FixedRequest
      const acquired = latch(lifetime), release = latch(lifetime)
      let acquisitions = 0
      const pendingCalls: Promise<unknown>[] = []
      const delayed = await ownedNative(f.cluster, { async afterAcquisition() { if (++acquisitions === 4) acquired.release(); await release.promise }, releaseGates: () => release.release() })
      try {
        const controllers = Array.from({ length: 4 }, () => new AbortController())
        const calls = controllers.map(abort => observe(lifetime.track(delayed.jobs.executeFixed(request(), abort.signal))))
        pendingCalls.push(...calls.map(call => call.joined))
        await acquired.promise
        const admissions = delayed.evidence.admitted
        // Observe the actual underlying four-lane refusal, not the outer
        // aggregate fixture guard. A fifth positive admission fails this proof.
        const fifth = observe(lifetime.track(rawFamilies.get(delayed)!.jobs.executeFixed(request(), signal())))
        pendingCalls.push(fifth.joined)
        await lifetime.wait(5); assert.equal(fifth.terminal(), true, 'the refused fifth call cannot wait for a free lane')
        assert.deepEqual((await fifth.joined).value, { status: 'unavailable' })
        assert.equal(delayed.evidence.admitted, admissions); assert.equal(acquisitions, 4)
        for (const abort of controllers) abort.abort()
        assert.ok(calls.every(call => !call.terminal())); assert.equal(delayed.snapshot().jobs, 4)
        release.release(); const done = await Promise.all(calls.map(call => call.joined))
        assert.ok(done.every(call => call.error === undefined && call.value?.status !== 'acknowledged'))
        assert.equal(delayed.evidence.dispatched, 0); assert.equal(delayed.evidence.drained, 4)
        assert.equal(delayed.snapshot().jobs, 0); assert.ok(delayed.evidence.calls[0]?.target && delayed.evidence.calls[0]?.control)
      } finally { release.release(); await Promise.allSettled(pendingCalls); await delayed.dispose() }
      const controlled = new AbortController()
      let actualControl: Identity | undefined, actualTarget: Identity | undefined, injected = false
      const failedCancel = await ownedNative(f.cluster, { async afterAcquisition(call) {
        actualControl = call.controlId; actualTarget = call.targetId
        const original = call.control!.query.bind(call.control!)
        call.control!.query = ((sql, parameters) => sql.startsWith('SELECT pg_terminate_backend')
          ? (injected = true, Promise.reject(Error('m04 controlled cancellation-query failure'))) : original(sql, parameters)) as LocalPgConnection['query']
        controlled.abort()
      } })
      try {
        await assert.rejects(failedCancel.jobs.executeFixed(request(), controlled.signal), /controlled cancellation-query failure/)
        assert.equal(injected, true); assert.equal(failedCancel.snapshot().contexts, 0); assert.equal(failedCancel.evidence.drained, 1)
        for (const id of [actualTarget!, actualControl!]) assert.equal((await f.observer.query('SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz', text([id.pid, id.birth])))[0]?.n, '0')
      } finally { await failedCancel.dispose() }
      await assertNativeEmpty(native, method)
    })
    await proof('N04/N10/N12', 'lost actual START or nested I1 finish ACK remains unknown and cannot call a new producer', async () => {
      for (const [index, kind] of ['start', 'finish'].entries()) {
        const input = m04Fixture('native-ack-' + kind, { context: contextFor(43 + index) })
        let lost = false
        const fault = await ownedNative(f.cluster, { loseAcknowledgement(call) {
          if (lost || !(kind === 'start' ? call.kind === 'jobs' && call.operation === 'execution_start' : call.kind === 'intake' && call.operation === '3')) return false
          lost = true; return true
        } })
        try {
          const api = createV3PostgresDurableJobs(config(input, fault, method))
          assert.equal((await api.enqueueRule(input.ruleInput)).status, 'confirmed')
          assert.notEqual((await api.workOnce(input.claim())).status, 'processed'); assert.equal(lost, true)
          assert.equal(input.producerCalls(), index)
          const before = await f.state(input.identity.jobKey), state = JSON.parse(before[0]!.state!)
          assert.equal(state.starts.length, 1); assert.equal(state.results, null); assert.equal(state.dispositions, null)
          const fresh = m04Fixture('native-ack-' + kind, { context: input.context })
          assert.notEqual((await createV3PostgresDurableJobs(config(fresh, native, method)).workOnce(input.claim())).status, 'processed')
          assert.equal(fresh.producerCalls(), 0); assert.deepEqual(await f.state(input.identity.jobKey), before)
          if (kind === 'finish') assert.equal((await f.owner.query("SELECT count(*)::text AS n FROM official_v3_intake_private.completions_v1 c JOIN official_v3_intake_private.operations_v1 o USING(operation_id) WHERE o.binding->>'jobId'=$1", text([input.ruleInput.jobId])))[0]?.n, '1')
          assert.equal(fault.snapshot().contexts, 0); assert.equal(fault.evidence.admitted, fault.evidence.drained)
        } finally { await fault.dispose() }
      }
    })
    await proof('N12/U06/R9', 'actual nested I1 S1 reserve remains owned past timeout and explicit worker caller-abort races', async () => {
      for (const [index, boundary] of ['i1_timeout', 'worker_caller_abort'].entries()) {
        const input = m04Fixture('native-r9-' + boundary, { context: contextFor(60 + index * 4) })
        const helpers = Array.from({ length: 3 }, (_, n) => m04Fixture('native-r9-helper-' + boundary + '-' + n,
          { context: contextFor(61 + index * 4 + n) }))
        const holder = await f.connect(), entered = latch(lifetime), releaseDrain = latch(lifetime), releaseMethods = latch(lifetime)
        const caller = new AbortController(), pendingCalls: Promise<unknown>[] = []
        let target: Identity | undefined, control: Identity | undefined, nestedSignal: AbortSignal | undefined, heldCallId = 0
        let drainEntered = false, failConfirmObserved = false, terminalEffects = 0, holdMethods = false, heldMethods = 0, completedMethods = 0
        const fault = await ownedNative(f.cluster, {
          async beforeQuery(call, signal) {
            if (call.kind !== 'intake' || call.operation !== '2') return
            assert.equal(heldCallId, 0, 'one exact nested reserve, not capture or pre-I1 read')
            await holder.connection.query('BEGIN')
            const locked = await holder.connection.query("SELECT operation_id FROM official_v3_intake_private.operations_v1 WHERE binding->>'jobId'=$1 FOR UPDATE", text([input.ruleInput.jobId]))
            assert.equal(locked.length, 1, 'actual earlier capture created the original row')
            target = call.targetId; control = call.controlId; nestedSignal = signal; heldCallId = call.id; entered.release()
          },
          async beforeDrain(call) {
            if (call.id !== heldCallId) return
            assert.equal(call.kind, 'intake'); assert.equal(call.operation, '2')
            drainEntered = true; await releaseDrain.promise
          },
          releaseGates() { releaseDrain.release(); releaseMethods.release() },
        })
        const api = createV3PostgresDurableJobs(config(input, fault, method, {
          methodExecutor: { async readCurrent(request, signal) {
            const actual = await method.executor.readCurrent(request, signal)
            if (!holdMethods) return actual
            // The actual MA1 native read has terminated; its caller's original
            // executor promise deliberately remains owned by the outer scope.
            assert.equal(signal.aborted, false); heldMethods++
            try { await releaseMethods.promise; return { status: 'unavailable' } }
            finally { completedMethods++ }
          } },
          jobsExecutor: { async executeFixed(request, signal) {
            const q = JSON.parse(request.operationText)
            if (q.body.command?.input?.jobKey === input.identity.jobKey) {
              if (q.operation === 'queue_confirm' && q.body.command.action === 'fail') failConfirmObserved = true
              if (q.operation === 'queue_cas' && ['fail', 'complete'].includes(q.body.command.action)) terminalEffects++
            }
            return fault.jobs.executeFixed(request, signal)
          } },
        }))
        const s1State = () => f.owner.query(`SELECT to_jsonb(o)::text AS original,
          (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.generation)::text FROM official_v3_intake_private.reservations_v1 r WHERE r.operation_id=o.operation_id) AS reservations,
          (SELECT jsonb_agg(to_jsonb(c))::text FROM official_v3_intake_private.completions_v1 c WHERE c.operation_id=o.operation_id) AS completions
          FROM official_v3_intake_private.operations_v1 o WHERE o.binding->>'jobId'=$1`, text([input.ruleInput.jobId]))
        try {
          assert.equal((await api.enqueueRule(input.ruleInput)).status, 'confirmed')
          for (const helper of helpers) assert.equal((await api.enqueueRule(helper.ruleInput)).status, 'confirmed')
          const work = observe(lifetime.track(api.workOnce(input.claim(), caller.signal))); pendingCalls.push(work.joined)
          await entered.promise; assert.ok(target && control && nestedSignal)
          await blocked(f, lifetime, target, holder.identity, 'official_v3_intake_private.operations_v1', () => !work.terminal())
          const before = await f.state(input.identity.jobKey), beforeS1 = await s1State()
          const state = JSON.parse(before[0]!.state!)
          assert.equal(state.subjects[0].current_job.state, 'leased'); assert.equal(state.commands.length, 2)
          assert.equal(state.starts.length, 1); assert.equal(state.results, null); assert.equal(state.dispositions, null)
          // Start these before the S1 cleanup gate: that adapter serializes
          // drains. Each helper uses the unchanged 30s work budget and cannot
          // reach a producer while its actual method executor promise is held.
          holdMethods = true
          const other = helpers.map(helper => observe(lifetime.track(api.workOnce(helper.claim()))))
          pendingCalls.push(...other.map(call => call.joined))
          await until(lifetime, async () => heldMethods === 3, 'three independent same-facade method calls did not enter')
          holdMethods = false
          if (boundary === 'worker_caller_abort') caller.abort()
          // Caller cancellation exercises the unchanged worker/integration
          // race path. It does not measure their raw return or a 30s expiry.
          await until(lifetime, async () => !!nestedSignal?.aborted && drainEntered,
            'actual nested reserve did not receive abort and retain terminal drain', 6500)
          if (boundary === 'i1_timeout') await until(lifetime, async () => failConfirmObserved,
            'actual I1 facade did not return into the worker failure-confirm path', 2000)
          // beforeDrain runs after target/control close. The earlier real SQL
          // wait is proven above; here the context/promise (not a live backend)
          // is retained. Prove the distinct backend absence explicitly.
          for (const id of [target, control]) await until(lifetime, async () =>
            (await f.observer.query('SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz', text([id.pid, id.birth])))[0]?.n === '0',
          'closed nested target/control backend still present')
          assert.equal(work.terminal(), false); assert.equal(fault.snapshot().intake, 1)
          assert.equal(completedMethods, 0); assert.ok(other.every(call => !call.terminal()))
          const beforeDrainSlot = await api.workOnce(null)
          assert.equal(beforeDrainSlot.status, 'unavailable', 'all four outer slots remain owned until the original native drain')
          assert.equal(terminalEffects, 0); assert.deepEqual(await f.state(input.identity.jobKey), before)
          assert.deepEqual(await s1State(), beforeS1)
          releaseDrain.release()
          const done = await work.joined
          assert.equal(done.error, undefined); assert.notEqual(done.value?.status, 'processed')
          assert.equal(completedMethods, 0); assert.ok(other.every(call => !call.terminal()))
          const afterDrainSlot = await api.workOnce(null)
          assert.equal(afterDrainSlot.status, 'invalid', 'only the original drained invocation released its outer lane')
          const originalCall = fault.evidence.calls.find(call => call.id === heldCallId)
          assert.ok(originalCall?.drained && originalCall.dispatched && !originalCall.committed)
          assert.equal(fault.snapshot().intake, 0); assert.equal(terminalEffects, 0)
          assert.deepEqual(await f.state(input.identity.jobKey), before); assert.deepEqual(await s1State(), beforeS1)
          const admissions = fault.evidence.admitted
          await lifetime.wait(5) // late-work check, not the native wait/drain witness
          assert.equal(fault.evidence.admitted, admissions); assert.deepEqual(await s1State(), beforeS1)
          assert.equal(input.producerCalls(), 1)
          nestedRaceWitnesses.push({ boundary, operation: 'reserve_v1', target, control, holder: holder.identity,
            realSqlWaitObserved: true, abortDelivered: nestedSignal.aborted, retainedExecutorDrained: originalCall.drained,
            backendAbsentWhileExecutorHeld: true, failConfirmObserved, terminalEffects,
            beforeDrainSlot: beforeDrainSlot.status, afterDrainSlot: afterDrainSlot.status, heldMethods, completedMethods,
            outwardStatus: done.value?.status, nativeAdmissionsAfterDrain: admissions })
        } finally {
          holdMethods = false; caller.abort(); releaseDrain.release(); releaseMethods.release()
          try { await holder.connection.query('ROLLBACK') }
          finally { await Promise.allSettled(pendingCalls); holder.connection.close(); await fault.dispose() }
        }
        assert.equal(completedMethods, heldMethods); assert.equal(fault.snapshot().contexts, 0)
        assert.equal(fault.evidence.admitted, fault.evidence.drained)
      }
    })
    await proof('N12/R7-03', 'intentional child crash retains a thrown actual native cancellation cleanup failure', async () => {
      const acquired = latch(lifetime), release = latch(lifetime)
      let injected = false
      const fault = await ownedNative(f.cluster, { async afterAcquisition(call) {
        const real = call.control!.query.bind(call.control!)
        call.control!.query = ((sql, parameters) => sql.startsWith('SELECT pg_terminate_backend')
          ? (injected = true, Promise.reject(Error('m04 child cancellation cleanup failure'))) : real(sql, parameters)) as LocalPgConnection['query']
        acquired.release(); await release.promise
      }, releaseGates: () => release.release() })
      try {
        const worker = childWorker(lifetime, children, fault, method)
        const input = m04Fixture('native-child-cleanup', { context: contextFor(51) })
        await worker.command('init', { seed: 'native-child-cleanup', context: input.context, count: 1, mode: 'normal' })
        const work = observe(worker.command('enqueue_rule'))
        await acquired.promise
        const closing = observe(lifetime.track(worker.close(true)))
        await until(lifetime, async () => children.size === 0, 'actual crash close missing')
        assert.equal(closing.terminal(), false, 'child close joins actual pending native cleanup')
        release.release()
        const closed = await closing.joined
        assert.match(String(closed.error), /child cancellation cleanup failure/)
        assert.ok((await work.joined).error); assert.equal(injected, true)
        assert.equal(fault.snapshot().contexts, 0); assert.equal(fault.evidence.drained, 1)
      } finally { release.release(); await fault.dispose() }
    })
    await proof('N11', 'staged PREPARED waits on the actual S1 operation before final current MA1', async () => {
      const input = m04Fixture('native-s1-final-wait', { context: contextFor(52) }), holder = await f.connect()
      const entered = latch(lifetime)
      let target: Identity | undefined
      const fault = await ownedNative(f.cluster, { async beforeQuery(call) {
        if (call.kind !== 'jobs' || call.operation !== 'execution_prepare') return
        await holder.connection.query('BEGIN')
        await holder.connection.query("SELECT 1 FROM official_v3_intake_private.operations_v1 WHERE binding->>'jobId'=$1 FOR UPDATE", text([input.ruleInput.jobId]))
        target = call.targetId; entered.release()
      } })
      try {
        const api = createV3PostgresDurableJobs(config(input, fault, method))
        assert.equal((await api.enqueueRule(input.ruleInput)).status, 'confirmed')
        const work = observe(lifetime.track(api.workOnce(input.claim())))
        await entered.promise; assert.ok(target)
        await blocked(f, lifetime, target, holder.identity, 'official_v3_intake_private.operations_v1', () => !work.terminal())
        const before = await f.state(input.identity.jobKey)
        await f.revoke(); await holder.connection.query('COMMIT')
        assert.notEqual((await work.joined).value?.status, 'processed')
        assert.ok(fault.evidence.sqlCodes.includes('P7504'))
        assert.deepEqual(await f.state(input.identity.jobKey), before, 'staged execution result and all queue state rolled back together')
        assert.equal(JSON.parse(before[0]!.state!).results, null)
        await f.approveCurrent()
      } finally { await holder.connection.query('ROLLBACK'); holder.connection.close(); await fault.dispose() }
    })
    await proof('N11', 'real immediate FK wait precedes final authority and leaves no attempted start on revoke', async () => {
      const input = m04Fixture('native-fk-final-wait', { context: contextFor(53) }), epoch = await currentEpoch()
      const enqueued = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: input.ruleInput }, null)
      assert.equal((await fixed(runtime, enqueued, epoch)).status, 'committed')
      const claim = await commandRequest({ action: 'claim', input: input.claim() }, enqueued.body.commit.next)
      assert.equal((await fixed(runtime, claim, epoch)).status, 'committed')
      const before = await f.state(input.identity.jobKey), holder = await f.connect(), waiter = await f.connect(M04_TEST_LOGIN.jobs, 'ot_v3_jobs_caller')
      await holder.connection.query('BEGIN')
      await holder.connection.query('SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=$1 FOR UPDATE', text([input.claim().operationId]))
      const starting = observe(lifetime.track(fixed(waiter.connection, { operation: 'execution_start', body: { claim: input.claim(), leasedJob: claim.body.commit.next, subjectText: claim.body.subjectText } }, epoch)))
      await blocked(f, lifetime, waiter.identity, holder.identity, 'official_v3_jobs_private.queue_operations_v1', () => !starting.terminal())
      await f.revoke(); await holder.connection.query('COMMIT')
      assert.ok(code('P7504')((await starting.joined).error)); assert.deepEqual(await f.state(input.identity.jobKey), before)
      await f.approveCurrent(); holder.connection.close(); waiter.connection.close()
    })
    await proof('N11', 'actual unique-operation wait and deferred-trigger drift cannot move effects beyond authority', async () => {
      const a = m04Fixture('native-unique-holder', { context: contextFor(54) }), b = m04Fixture('native-unique-waiter', { context: contextFor(55) }), epoch = await currentEpoch()
      const first = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: a.ruleInput }, null)
      assert.equal((await fixed(runtime, first, epoch)).status, 'committed')
      const shared = ids('op3', 'native-real-unique-collision')
      const held = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: { ...a.ruleInput, operationId: shared, jobId: ids('job3', 'native-holder-dedup') } }, first.body.commit.next)
      const requested = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: { ...b.ruleInput, operationId: shared } }, null)
      const holder = await f.connect(), waiter = await f.connect(M04_TEST_LOGIN.jobs, 'ot_v3_jobs_caller'), before = await f.state(b.identity.jobKey)
      const command = readM04Command(held.body.command)!
      await holder.connection.query('BEGIN')
      // Owner-only controlled fixture stages the exact valid second command,
      // intentionally without its normal advisory lock, to expose the real
      // unique-index wait. It never supplies runtime authority or commits.
      await holder.connection.query(`INSERT INTO official_v3_jobs_private.queue_operations_v1(operation_id,job_key,action,command_key,command_text,envelope_text,audit_reference,new_cycle_job_id,authority,recorded_at)
        VALUES($1,$2,'enqueue',$3,$4,$5,$6,NULL,$7::jsonb,clock_timestamp())`, text([command.operationId, command.jobKey, command.commandKey, command.commandText, m04Canonical(held.body.commit), held.body.commit.audit.reference, JSON.stringify({ ...binding, epoch })]))
      await holder.connection.query('UPDATE official_v3_jobs_private.subjects_v1 SET operation_count=operation_count+1 WHERE job_key=$1', text([a.identity.jobKey]))
      const waiting = observe(lifetime.track(fixed(waiter.connection, requested, epoch)))
      await blocked(f, lifetime, waiter.identity, holder.identity, 'official_v3_jobs_private.queue_operations_v1', () => !waiting.terminal())
      await f.revoke(); await holder.connection.query('ROLLBACK')
      assert.ok(code('P7504')((await waiting.joined).error)); assert.deepEqual(await f.state(b.identity.jobKey), before)
      await f.approveCurrent(); holder.connection.close(); waiter.connection.close()
      const catalogBefore = await catalog(f.owner)
      await f.owner.query('CREATE CONSTRAINT TRIGGER m04_deferred_drift AFTER INSERT ON official_v3_jobs_private.subjects_v1 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1()')
      try { await assert.rejects(fixed(runtime, requested, await currentEpoch()), code('P7603')); assert.deepEqual(await f.state(b.identity.jobKey), before) }
      finally { await f.owner.query('DROP TRIGGER m04_deferred_drift ON official_v3_jobs_private.subjects_v1') }
      assert.equal(await catalog(f.owner), catalogBefore)
    })
    await proof('N13', 'legacy raw aliases remain in actual S1 unchanged but never become M04 preparation', async () => {
      const input = m04Fixture('native-alias-original', { context: contextFor(46) })
      const d = input.delivery(), original = d.text.replace('"destinationCountryCode": "AQ"', '"destinationCountryCode": " aq "')
      assert.notEqual(original, d.text)
      const parsed = readV3RetainableProposal(original, input.originals.registry); assert.ok(parsed.ok)
      const store = createV3ProposalIntakeStore({ registry: input.originals.registry, executor: native.intake, leaseMilliseconds: 5000 })
      const retained = await store.intake.capture(original, d.binding, signal()); assert.equal(retained.status, 'recorded')
      if (retained.status !== 'recorded') throw Error('legacy capture')
      const before = await f.owner.query("SELECT convert_from(original_bytes,'UTF8') AS original,proposal_digest FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1", text([d.binding.operationId]))
      const opened = await store.open(retained.reference, signal()); assert.equal(opened.status, 'recorded')
      if (opened.status === 'recorded') assert.equal(opened.record.text, original)
      const nativeRead = await f.owner.query('SELECT official_v3_jobs_private.s1_read_v1($1::jsonb,$2::text,$3::integer) AS result', text([JSON.stringify(retained.reference.binding), retained.reference.proposalDigest, retained.reference.bytes]))
      // Correct full pair/job/method binding; only original normal-form admission
      // differs. The new native consumer cannot turn the old raw alias into proof.
      const job = { kind: 'combination_discovery_job_record', jobId: d.binding.jobId, identity: input.discovery }
      await assert.rejects(f.owner.query("SELECT official_v3_jobs_private.consume_s1_v1($1::jsonb,$2::jsonb,'{}'::jsonb,'prepare')",
        text([JSON.stringify(result(nativeRead)), JSON.stringify(job)])), e => code('P7601')(e) || code('P7604')(e))
      assert.deepEqual(await f.owner.query("SELECT convert_from(original_bytes,'UTF8') AS original,proposal_digest FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1", text([d.binding.operationId])), before)
      const api = createV3PostgresDurableJobs(config(input, native, method, { producer: { async produce() { return { status: 'delivered', deliveries: [{ binding: d.binding, text: original }] } } } }))
      assert.equal((await api.enqueueRule(input.ruleInput)).status, 'confirmed')
      const count = native.evidence.calls.filter(c => c.kind === 'intake').length
      const failure = await api.workOnce(input.claim()); assert.equal(failure.status, 'worker_only')
      assert.equal(native.evidence.calls.filter(c => c.kind === 'intake').length, count, 'whole-batch D01 fails before first S1 effect')
      const state = JSON.parse((await f.state(input.identity.jobKey))[0]!.state!)
      assert.equal(state.results, null); assert.equal(state.dispositions[0].kind, 'settled_failure'); assert.equal(state.dispositions[0].failure_reason, 'invalid_proposal')
    })
    await proof('N05/A03', 'actual 254/255/256 ledger boundary preserves the sole original terminal credit', async () => {
      const progress = quotaProgress.ledger
      quotaProgress.currentGroup = 'N05/A03'; quotaProgress.boundary = 'absent_probe'
      const base = m04Fixture('native-ledger-quota-base')
      const input = m04Fixture('native-ledger-quota', { context: base.originals.context('CH', 'IS') })
      assert.notEqual(input.discovery.jobKey, base.discovery.jobKey, 'ledger quota uses a distinct Discovery subject')
      assert.equal((await quotaFixed(progress, runtime, { operation: 'queue_read', body: { jobKey: input.discovery.jobKey, continuation: null } }, null, 'probe')).status, 'absent')
      let current: V3ManagedJobRecord | null = null
      const epoch = await currentEpoch()
      for (let n = 0; n < 254; n++) {
        quotaProgress.boundary = 'ledger_fill'; progress.lastStartedIndex = n
        const q = await quotaCommand(progress, { action: 'enqueue', kind: 'combination_discovery', input: { ...input.discoveryInput,
          operationId: ids('op3', 'quota-enqueue-' + n), jobId: ids('job3', 'quota-cycle-' + n), attemptLimit: 1 } }, current)
        assert.equal((await quotaFixed(progress, runtime, q, epoch)).status, 'committed', 'ledger command ' + n)
        current = q.body.commit.next; progress.lastCompletedIndex = n
      }
      quotaProgress.boundary = 'claim_255'
      const originalClaim = { ...input.claim('combination_discovery'), operationId: ids('op3', 'quota-boundary-claim') }
      const claim = await quotaCommand(progress, { action: 'claim', input: originalClaim }, current)
      assert.equal((await quotaFixed(progress, runtime, claim, epoch)).status, 'committed'); current = claim.body.commit.next
      assert.deepEqual(await f.owner.query('SELECT operation_count::text,terminal_credit_claim FROM official_v3_jobs_private.subjects_v1 WHERE job_key=$1', text([input.discovery.jobKey])), [{ operation_count: '255', terminal_credit_claim: originalClaim.operationId }])
      quotaProgress.boundary = 'start_1'
      const start = await quotaFixed(progress, runtime, { operation: 'execution_start', body: { claim: originalClaim, leasedJob: current, subjectText: claim.body.subjectText } }, epoch)
      assert.equal(start.status, 'reserved')
      const before = await f.state(input.discovery.jobKey)
      quotaProgress.boundary = 'interstitial_refusal'
      const unentitled = await quotaCommand(progress, { action: 'enqueue', kind: 'combination_discovery', input: { ...input.discoveryInput, operationId: ids('op3', 'quota-cannot-steal'), jobId: ids('job3', 'quota-cannot-steal') } }, current)
      assert.equal((await quotaFixed(progress, runtime, unentitled, epoch)).status, 'blocked', 'old unknown gate precedes otherwise possible interstitial command')
      assert.deepEqual(await f.state(input.discovery.jobKey), before)
      // This finite test caller owns a synchronously terminal failed producer and
      // has no callback/native children. The DB validates token/claim/command;
      // it does not infer that external terminal fact from a reason string.
      quotaProgress.boundary = 'terminal_256'
      const failure = await quotaCommand(progress, { action: 'fail', input: { operationId: ids('op3', 'quota-final-fail'), jobKey: input.discovery.jobKey,
        fence: { jobId: current.jobId, revision: current.revision, leaseId: current.lease!.leaseId, generation: current.lease!.generation }, reason: 'unreachable' } }, current)
      const terminalRequest = { ...failure, body: { ...failure.body, disposition: { kind: 'settled_failure', attemptKey: start.attemptKey, token: start.token } } }
      assert.equal((await quotaFixed(progress, runtime, terminalRequest, epoch)).status, 'committed')
      const final = JSON.parse((await f.state(input.discovery.jobKey))[0]!.state!)
      assert.equal(final.commands.length, 256); assert.equal(final.subjects[0].operation_count, 256); assert.equal(final.subjects[0].terminal_credit_claim, null)
      assert.equal(final.dispositions.length, 1); assert.equal(final.subjects[0].current_job.state, 'exhausted')
      quotaProgress.boundary = 'ledger_quota_refusal'
      const beyond = await quotaCommand(progress, { action: 'enqueue', kind: 'combination_discovery', input: { ...input.discoveryInput, operationId: ids('op3', 'quota-beyond'), jobId: ids('job3', 'quota-beyond') } }, final.subjects[0].current_job)
      assert.equal((await quotaFixed(progress, runtime, beyond, epoch)).status, 'quota')
      assert.deepEqual(JSON.parse((await f.state(input.discovery.jobKey))[0]!.state!), final)
      quotaProgress.boundary = 'done'; quotaProgress.currentGroup = 'none'
    })
    await proof('N05', 'sixty-four actual starts retain all older history and refuse the sixty-fifth claim', async () => {
      const progress = quotaProgress.cycles
      quotaProgress.currentGroup = 'N05'; quotaProgress.boundary = 'absent_probe'
      const base = m04Fixture('native-start-quota-base')
      const input = m04Fixture('native-start-quota', { context: base.originals.context('CH', 'NO') }), epoch = await currentEpoch()
      const ledger = m04Fixture('native-ledger-quota', { context: base.originals.context('CH', 'IS') })
      assert.equal(new Set([base.discovery.jobKey, ledger.discovery.jobKey, input.discovery.jobKey]).size, 3, 'quota Discovery subjects are distinct from each other and the earlier default')
      assert.equal((await quotaFixed(progress, runtime, { operation: 'queue_read', body: { jobKey: input.discovery.jobKey, continuation: null } }, null, 'probe')).status, 'absent')
      let current: V3ManagedJobRecord | null = null
      for (let n = 0; n < 64; n++) {
        quotaProgress.boundary = 'cycle_enqueue'; progress.lastStartedIndex = n
        const enqueue = await quotaCommand(progress, { action: 'enqueue', kind: 'combination_discovery', input: { ...input.discoveryInput,
          operationId: ids('op3', 'start-quota-enqueue-' + n), jobId: ids('job3', 'start-quota-cycle-' + n), attemptLimit: 1 } }, current)
        assert.equal((await quotaFixed(progress, runtime, enqueue, epoch)).status, 'committed'); current = enqueue.body.commit.next
        quotaProgress.boundary = 'cycle_claim'
        const c = { ...input.claim('combination_discovery'), operationId: ids('op3', 'start-quota-claim-' + n), leaseId: ids('lease3', 'start-quota-' + n) }
        const claim = await quotaCommand(progress, { action: 'claim', input: c }, current)
        assert.equal((await quotaFixed(progress, runtime, claim, epoch)).status, 'committed'); current = claim.body.commit.next
        quotaProgress.boundary = 'cycle_start'
        const start = await quotaFixed(progress, runtime, { operation: 'execution_start', body: { claim: c, leasedJob: current, subjectText: claim.body.subjectText } }, epoch)
        assert.equal(start.status, 'reserved')
        quotaProgress.boundary = 'cycle_fail'
        const failed = await quotaCommand(progress, { action: 'fail', input: { operationId: ids('op3', 'start-quota-fail-' + n), jobKey: input.discovery.jobKey,
          fence: { jobId: current.jobId, revision: current.revision, leaseId: current.lease!.leaseId, generation: current.lease!.generation }, reason: 'unreachable' } }, current)
        assert.equal((await quotaFixed(progress, runtime, { ...failed, body: { ...failed.body, disposition: { kind: 'settled_failure', attemptKey: start.attemptKey, token: start.token } } }, epoch)).status, 'committed')
        current = failed.body.commit.next; progress.lastCompletedIndex = n
      }
      quotaProgress.boundary = 'enqueue_65'
      const last = await quotaCommand(progress, { action: 'enqueue', kind: 'combination_discovery', input: { ...input.discoveryInput,
        operationId: ids('op3', 'start-quota-65-enqueue'), jobId: ids('job3', 'start-quota-65-cycle') } }, current)
      assert.equal((await quotaFixed(progress, runtime, last, epoch)).status, 'committed'); current = last.body.commit.next
      const before = await f.state(input.discovery.jobKey)
      quotaProgress.boundary = 'claim_65_refusal'
      const rejected = await quotaCommand(progress, { action: 'claim', input: { ...input.claim('combination_discovery'), operationId: ids('op3', 'start-quota-65-claim') } }, current)
      assert.equal((await quotaFixed(progress, runtime, rejected, epoch)).status, 'quota'); assert.deepEqual(await f.state(input.discovery.jobKey), before)
      const history = JSON.parse(before[0]!.state!)
      assert.equal(history.starts.length, 64); assert.equal(history.dispositions.length, 64)
      assert.equal(history.commands.length, 193)
      // A contradictory retained pointer is detected by full-history comparison;
      // the controlled test restores exactly its prior value, never deletes rows.
      quotaProgress.boundary = 'pointer_refusal'
      await f.owner.query("UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=$2 WHERE job_key=$1", text([input.discovery.jobKey, history.starts[0].attempt_key]))
      await assert.rejects(quotaFixed(progress, runtime, { operation: 'queue_read', body: { jobKey: input.discovery.jobKey, continuation: null } }, null, 'probe'), code('P7603'))
      await f.owner.query('UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL WHERE job_key=$1', text([input.discovery.jobKey]))
      assert.deepEqual(await f.state(input.discovery.jobKey), before)
      quotaProgress.boundary = 'done'; quotaProgress.currentGroup = 'none'
    })
    await proof('N15', 'nonempty real command/unknown/prepared/success/failure history forbids rollback', async () => {
      const snapshot = await catalog(f.owner)
      await refusal(f.owner, rollback, 'P7606')
      assert.equal(await catalog(f.owner), snapshot)
      assert.ok(Number((await f.owner.query('SELECT count(*)::text AS n FROM official_v3_jobs_private.execution_starts_v1'))[0]!.n) >= 64)
    })
    await assertNativeEmpty(native, method)
    // M04-T03: each committing fixed S1/M04 operation owns target+control plus
    // inherited commitBefore guard+control. MA1 observations own two. Actual
    // lifetime accounting below includes all helper acquisitions; per-case
    // backend comparison above proves disappearance, beyond close() flags.
    inheritedCommitGuardPairs = families.reduce((n, family) => n + family.evidence.acknowledged, 0)
    minimumInheritedConnections = inheritedCommitGuardPairs * 4 + method.evidence.admitted * 2
    await native.dispose(); method.closeObserver(); f.close(); lifetime.stopCluster(f.cluster)
    activeObserver = undefined
    const pristine = await makeFixture(lifetime, allocate, false, false)
    activeObserver = pristine.observer
    cleanup.push(() => pristine.close())
    await proof('N14', 'creator ACLs, protected membership/role/language/body/owner/ACL drift refuse before creation', async () => {
      const baseline = await catalog(pristine.owner)
      const cases: readonly [string, string][] = [
        ['ALTER DEFAULT PRIVILEGES GRANT SELECT ON TABLES TO PUBLIC', 'ALTER DEFAULT PRIVILEGES REVOKE SELECT ON TABLES FROM PUBLIC'],
        ['ALTER DEFAULT PRIVILEGES GRANT USAGE ON SCHEMAS TO PUBLIC', 'ALTER DEFAULT PRIVILEGES REVOKE USAGE ON SCHEMAS FROM PUBLIC'],
        ['ALTER DEFAULT PRIVILEGES GRANT USAGE ON TYPES TO authenticated', 'ALTER DEFAULT PRIVILEGES REVOKE USAGE ON TYPES FROM authenticated'],
        ['GRANT ot_v3_intake_owner TO authenticated', 'REVOKE ot_v3_intake_owner FROM authenticated'],
        ['GRANT authenticated TO ot_v3_intake_owner', 'REVOKE authenticated FROM ot_v3_intake_owner'],
        ['ALTER ROLE postgres CREATEROLE', 'ALTER ROLE postgres NOCREATEROLE'],
        ["ALTER FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) OWNER TO authenticated", "ALTER FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) OWNER TO ot_v3_intake_owner"],
        ['GRANT EXECUTE ON FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) TO PUBLIC', 'REVOKE EXECUTE ON FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) FROM PUBLIC'],
      ]
      for (const [inject, restore] of cases) {
        await pristine.owner.query(inject)
        const before = await catalog(pristine.owner)
        try { await refusal(pristine.owner, candidate, 'P7601'); assert.equal(await catalog(pristine.owner), before, inject) }
        finally { await pristine.owner.query(restore) }
        assert.equal(await catalog(pristine.owner), baseline, 'controlled injection restored exact pre-state')
      }
      const identity = 'official_v3_intake_private.exact_keys_v1(jsonb,text[])'
      const original = (await pristine.owner.query('SELECT oid::text,prosrc,prolang::text FROM pg_catalog.pg_proc WHERE oid=$1::regprocedure', text([identity])))[0]!
      for (const field of ['prosrc', 'prolang'] as const) {
        // Exact owned-fixture catalog mutation only, before any candidate effect.
        // No language handler is ever executed and the actual source is restored.
        if (field === 'prosrc') await pristine.owner.query('UPDATE pg_catalog.pg_proc SET prosrc=$2 WHERE oid=$1::oid', text([original.oid!, original.prosrc! + '\n-- controlled drift']))
        else await pristine.owner.query("UPDATE pg_catalog.pg_proc SET prolang=(SELECT oid FROM pg_catalog.pg_language WHERE lanname='internal') WHERE oid=$1::oid", text([original.oid!]))
        const before = await catalog(pristine.owner)
        try { await refusal(pristine.owner, candidate, 'P7601'); assert.equal(await catalog(pristine.owner), before, field) }
        finally { await pristine.owner.query('UPDATE pg_catalog.pg_proc SET prosrc=$2,prolang=$3::oid WHERE oid=$1::oid', text([original.oid!, original.prosrc!, original.prolang!])) }
      }
      assert.equal(await catalog(pristine.owner), baseline)
    })
    const shadows = "CREATE TEMP TABLE pg_roles(rolname text); CREATE TEMP TABLE pg_namespace(oid integer,nspname text); CREATE TYPE pg_temp.jsonb AS ENUM('shadow');"
    const dropShadows = 'DROP TABLE pg_temp.pg_roles; DROP TABLE pg_temp.pg_namespace; DROP TYPE pg_temp.jsonb;'
    await proof('N01/N14/T02', 'temporary catalog/type shadows do not influence the new install or runtime', async () => {
      await pristine.owner.query(shadows)
      await pristine.owner.query('SET search_path=pg_temp,public')
      await pristine.owner.query(candidate)
      const funcs = await pristine.owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api') AND p.proconfig=ARRAY['search_path=pg_catalog, pg_temp']")
      assert.equal(funcs[0]?.n, '29')
      const probe = await fixed(pristine.owner, { operation: 'queue_read', body: { jobKey: 'research-job:v3:' + '0'.repeat(64), continuation: null } }, null, 'probe')
      assert.deepEqual(probe, { status: 'absent' })
      const type = await pristine.owner.query("SELECT prorettype::text AS type FROM pg_catalog.pg_proc WHERE oid='official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)'::pg_catalog.regprocedure")
      assert.equal(type[0]?.type, '3802', 'actual pg_catalog jsonb return type')
      await pristine.owner.query(dropShadows)
      await pristine.owner.query('SET search_path=pg_catalog,pg_temp')
    })
    await proof('N14', 'actual consumed S1/MA1 RESTRICT dependencies preserve the complete pristine catalog', async () => {
      assert.equal((await pristine.owner.query('SELECT count(*)::text AS n FROM official_v3_method_private.operations_v1'))[0]?.n, '0')
      assert.equal((await pristine.owner.query('SELECT count(*)::text AS n FROM official_v3_method_private.heads_v1'))[0]?.n, '0')
      assert.equal((await pristine.owner.query('SELECT count(*)::text AS n FROM official_v3_method_private.revisions_v1'))[0]?.n, '0')
      // Explicitly remove only the known fixture reader grant; P7506/P7507
      // would be the wrong failure and are never accepted as dependency proof.
      await pristine.owner.query(`GRANT ot_v3_method_reader TO ${MA1_AUTH.readerLogin}; REVOKE ot_v3_method_reader FROM ${MA1_AUTH.readerLogin}`)
      assert.equal((await pristine.owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_auth_members WHERE roleid='ot_v3_method_reader'::regrole OR member='ot_v3_method_reader'::regrole"))[0]?.n, '0')
      for (const source of [s1Rollback, ma1Rollback]) {
        const before = await catalog(pristine.owner)
        await refusal(pristine.owner, source, '2BP01')
        assert.equal(await catalog(pristine.owner), before, 'exact unchanged catalog, actual dependency error only')
      }
      const graph = await pristine.owner.query(`SELECT p.proname,count(*)::text AS n FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_proc p ON p.oid=d.objid
        JOIN pg_catalog.pg_proc target ON target.oid=d.refobjid WHERE d.classid='pg_catalog.pg_proc'::regclass AND d.refclassid='pg_catalog.pg_proc'::regclass
        AND p.pronamespace='official_v3_jobs_private'::regnamespace AND target.pronamespace IN ('official_v3_intake_private'::regnamespace,'official_v3_intake_api'::regnamespace,'official_v3_method_private'::regnamespace)
        GROUP BY p.proname ORDER BY p.proname`)
      assert.deepEqual(graph, [{ proname: 'ma1_require_v1', n: '1' }, { proname: 's1_read_v1', n: '1' }, { proname: 's1_shape_v1', n: '5' }])
    })
    await proof('N15/T02', 'empty companion-first exact teardown survives temporary shadows and preserves predecessors', async () => {
      const priorDefaults = await pristine.owner.query('SELECT * FROM pg_catalog.pg_default_acl ORDER BY oid')
      await pristine.owner.query(shadows)
      await pristine.owner.query('SET search_path=pg_temp,public')
      await pristine.owner.query(rollback)
      assert.equal((await pristine.owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_namespace WHERE nspname IN ('official_v3_jobs_private','official_v3_jobs_api')"))[0]?.n, '0')
      assert.equal((await pristine.owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_roles WHERE rolname='ot_v3_jobs_caller'"))[0]?.n, '0')
      assert.deepEqual(await pristine.owner.query('SELECT * FROM pg_catalog.pg_default_acl ORDER BY oid'), priorDefaults)
      await pristine.owner.query(dropShadows)
      await pristine.owner.query('SET search_path=pg_catalog,pg_temp')
      await pristine.owner.query(s1Rollback); await pristine.owner.query(ma1Rollback)
      assert.equal((await pristine.owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_namespace WHERE nspname=ANY($1::text[])", [schemaParameter]))[0]?.n, '0')
    })
    await proof('N15', 'rollback waits for actual late writer then rechecks nonempty history atomically', async () => {
      // Reuse the same owned pristine cluster after demonstrated empty teardown.
      await pristine.owner.query(ma1Candidate); await pristine.owner.query(s1Candidate); await pristine.owner.query(candidate)
      assert.equal(result(await pristine.human.query(stageSQL, text([ma1Operation(++op), binding.methodId, binding.revision, binding.methodDigest, binding.packageDigest, null]))).status, 'recorded')
      await pristine.approveCurrent()
      const input = m04Fixture('native-late-rollback', { context: contextFor(50) })
      const command = await commandRequest({ action: 'enqueue', kind: 'rule_research', input: input.ruleInput }, null)
      const writer = await pristine.connect(), destroyer = await pristine.connect()
      await writer.connection.query('BEGIN; LOCK TABLE official_v3_jobs_private.slots_v1 IN ROW EXCLUSIVE MODE')
      const waiting = observe(lifetime.track(destroyer.connection.query(rollback)))
      await blocked(pristine, lifetime, destroyer.identity, writer.identity, 'official_v3_jobs_private.slots_v1', () => !waiting.terminal())
      assert.equal((await fixed(writer.connection, command, Number((await pristine.head())!.epoch))).status, 'committed')
      await writer.connection.query('COMMIT')
      assert.ok(code('P7606')((await waiting.joined).error)); await destroyer.connection.query('ROLLBACK')
      const state = JSON.parse((await pristine.state(input.identity.jobKey))[0]!.state!)
      assert.equal(state.commands.length, 1); assert.equal(state.subjects.length, 1)
      await pristine.owner.query('SELECT official_v3_jobs_private.assert_catalog_v1()')
      writer.connection.close(); destroyer.connection.close()
    })
    assert.ok(performance.now() - started < 240000, 'effect/test work stayed inside frozen 240s')
  } catch (error) { primary = error; primaryPhase = phase }
  finally {
    clearTimeout(timer)
    const cleanupStarted = performance.now(), errors: unknown[] = []
    for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    for (const finalize of [...unfinishedChildren]) { try { await finalize() } catch (error) { errors.push(error) } }
    for (const dispose of cleanup.reverse()) { try { await dispose() } catch (error) { errors.push(error) } }
    try { cleanupReceipt = await lifetime.dispose() } catch (error) { errors.push(error) }
    try {
      assert.ok(performance.now() - cleanupStarted <= 60000, 'whole cleanup includes synchronous cluster stop and actual child/native joins')
      assert.equal(children.size, 0, 'every actual child close observed')
      assert.deepEqual(familyCalls, { jobs: 0, intake: 0, method: 0 })
      assert.equal(familyObservers, 0); assert.equal(methodObservers, 0)
      if (cleanupReceipt) {
        assert.equal(cleanupReceipt.pending, 0); assert.equal(cleanupReceipt.started, cleanupReceipt.settled)
        assert.equal(cleanupReceipt.connections, cleanupReceipt.closed); assert.equal(cleanupReceipt.stoppedClusters, clusters)
        assert.ok(cleanupReceipt.connections >= minimumInheritedConnections, 'actual inherited guard/control acquisitions remain in owned lifetime receipt')
      }
    } catch (error) { errors.push(error) }
    t.diagnostic('M04_NATIVE_RECEIPT ' + JSON.stringify({ schema: 'jetnity.m04.native.v1', candidateSha256: digest(candidate), rollbackSha256: digest(rollback),
      executed: true, effectAndCleanupMilliseconds: Math.ceil(performance.now() - started), cleanupMilliseconds: Math.ceil(performance.now() - cleanupStarted),
      clusters, childProcesses: children.size, lifetime: cleanupReceipt ?? null, groups: proofs,
      nestedRaceWitnesses, quotaProgress,
      connections: { aggregateWorkConnectionBound: 40, maximumJobs: familyMaximum.jobs, maximumIntake: familyMaximum.intake,
        maximumMethod: familyMaximum.method, m04ObserverLimit: 2, maximumM04Observers: maximumFamilyObservers,
        methodObserverLimit: 1, fixturePerClusterLimit: 16, inheritedCommitGuardPairs, minimumOwned: minimumInheritedConnections },
      failure: primary ? { phase: primaryPhase, error: nativeFailure(primary) } : null,
      cleanupFailures: errors.slice(0, 8).map(error => nativeFailure(error)), cleanupFailureCount: errors.length,
      nativePass: !primary && errors.length === 0 }))
    if (primary || errors.length) throw new AggregateError([...(primary ? [primary] : []), ...errors], 'M04 native proof or terminal cleanup failed')
  }
})
