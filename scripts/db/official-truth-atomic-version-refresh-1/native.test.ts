import assert from 'node:assert/strict'
import { AsyncLocalStorage } from 'node:async_hooks'
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { startLocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgBytes, pgCompositeArray, pgText, type PgParameter, type LocalPgBoundedCommit } from '../official-truth-integrated-pilot-1/pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, publishIntegratedBundle } from '../official-truth-integrated-pilot-1/storage'
import { bindCandidate, cursor, prepareOriginals, reviewCandidate, type Cursor, type PreparedOriginals } from '../official-truth-original-custody-1/storage'
import { readPersistedCanonicalRequirements as actualPersistedRead } from '../official-truth-persisted-canonical-read-1/reader'
import { persistedCanonicalReadContract } from '../official-truth-persisted-canonical-read-1/contract'
import { selectCurrentVersion } from '../official-truth-current-version-lookup-1/lookup'
import { alternateSameIdentityReceipt } from '../official-truth-current-version-lookup-1/fixtures'
import { contradictingFactFixture, originalsFor } from '../official-truth-persisted-canonical-read-1/fixtures'
import { createIntegratedPilotArtifact, verifyLocalIntegratedPilotBundle, type IntegratedPilotManifestContent } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { ATOMIC_REFRESH_LOGIN, ATOMIC_REFRESH_ROLE, ownAtomicRefreshRequest, type AtomicRefreshRequest } from './contract'
import { refreshPersistedCanonicalVersion as actualAtomicRefresh, type AtomicRefreshResult } from './refresh'
import { actuallyFreshObservations, corruptReceipt, directlyCallRefresh, falseValidityLocator, extraInactivePolicy } from './fixtures'
import { OwnedTestLifetime } from './test-lifetime'

const code = (expected: string) => (error: unknown) => error instanceof LocalPgError && error.code === expected
const migrations = [
  '20261001121258_official_truth_private_evidence_store_schema_1.sql', '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
  '20261001180549_official_truth_trusted_store_writer_1.sql', '20261001193748_official_truth_source_catalog_gateway_1.sql',
  '20261004010705_official_truth_content_identity_2.sql', '20261004223959_official_truth_v2_catalog_hardening_1.sql',
  '20261010180000_official_truth_source_fingerprint_protocol_2.sql', '20261011111839_official_truth_original_custody_lifecycle_1.sql',
  '20261023153726_official_truth_current_version_lookup_1.sql',
]
const packageSql = readFileSync(new URL('./refresh-candidate.sql', import.meta.url), 'utf8')
const rollbackSql = readFileSync(new URL('./refresh-candidate.rollback.sql', import.meta.url), 'utf8')
const referenceSql = readFileSync(new URL('./semantic-reference-r5.fixture.sql', import.meta.url), 'utf8')
const graphWorkerName = 'validate_inspected_graph_v2'
const graphReferenceSchema = 'official_refresh_graph_reference_r9'
const graphWorkerSignature = `${graphWorkerName}(text,text,bytea,bytea,official_provenance_api.artifact_input_v1[],jsonb)`
const validateGraphReferenceSource = (graphReferenceSql: string) => {
  assert.equal(createHash('sha256').update(graphReferenceSql).digest('hex'), 'e01025d2ff40c374835729519c9e62e9c7eff03bcd8f68f6847d4983e2204f0c')
  assert.equal((graphReferenceSql.match(/^CREATE FUNCTION /gm) ?? []).length, 1)
  const definition = graphReferenceSql.match(/^CREATE FUNCTION official_refresh_graph_reference_r9\.validate_inspected_graph_v2\([\s\S]*?END \$\$;\n/m)?.[0]
  assert.ok(definition)
  const original = definition.replace(`${graphReferenceSchema}.${graphWorkerName}`, `official_provenance_private.${graphWorkerName}`)
  assert.equal(Buffer.byteLength(original), 6147)
  assert.equal(createHash('sha256').update(original).digest('hex'), '17af51e55da5c3ed65007904ddaf62f7875f28a8b3e9b91a71edb88c8976ea39')
}
const referenceDefinitions = [
  ['validate_graph_v2', 5137, 'dbdc6616e3a6b9de6b46aecc64b6f92921233717c4adcb33e726c15ee52402ef'],
  ['validate_semantics_v2', 27604, 'c2a4b0e6ccfd6e25c7c95de5588ae629210f8a3f01bb0ace4ed1f5a9a3b21cb1'],
  ['validate_bundle_v2', 500, 'a114b166b1a7637fa318e09044440dcd445cc375b23ae99ebc753f442eb01c1d'],
  ['closure_v2', 3506, '056971dc1e7369ecdfc585b14578cc71ad57f603b7c3582b3f2e3b466040d74a'],
  ['verify_retained_v2', 3787, 'f29f3f9cc5243959d882a456776afb9fd79f3f354d4f5795bc4957a66619dfc4'],
] as const
const privateR5Helpers = [
  ['artifact_edges_once_v2(official_provenance_api.artifact_input_v1)', 'i', 'artifact_edges_once_v2(NULL::official_provenance_api.artifact_input_v1)'],
  ['inspected_closure_v2(text)', 's', 'inspected_closure_v2(NULL::text)'],
  ['validate_inspected_graph_v2(text,text,bytea,bytea,official_provenance_api.artifact_input_v1[],jsonb)', 'i', 'validate_inspected_graph_v2(NULL::text,NULL::text,NULL::bytea,NULL::bytea,NULL::official_provenance_api.artifact_input_v1[],NULL::jsonb)'],
  ['semantic_content_index_v2(official_provenance_api.artifact_input_v1[])', 'i', 'semantic_content_index_v2(NULL::official_provenance_api.artifact_input_v1[])'],
  ['content_from_index_v2(jsonb,jsonb,text)', 'i', 'content_from_index_v2(NULL::jsonb,NULL::jsonb,NULL::text)'],
  ['semantic_contract_from_index_v2(jsonb,jsonb,text)', 'i', 'semantic_contract_from_index_v2(NULL::jsonb,NULL::jsonb,NULL::text)'],
] as const
const referenceCalls = [
  'validate_graph_v2(NULL::text,NULL::text,NULL::bytea,NULL::bytea,NULL::official_provenance_api.artifact_input_v1[])',
  'validate_semantics_v2(NULL::jsonb,NULL::jsonb,NULL::official_provenance_api.artifact_input_v1[])',
  'validate_bundle_v2(NULL::text,NULL::text,NULL::bytea,NULL::bytea,NULL::official_provenance_api.artifact_input_v1[])',
  'closure_v2(NULL::text)', 'verify_retained_v2(NULL::text)',
] as const
const validateReferenceSource = () => {
  assert.equal(createHash('sha256').update(referenceSql).digest('hex'), '874257493bd8836dd999bd068afac677fbe7118d9af283261d8a2c1ec9d9d3fc')
  assert.equal((referenceSql.match(/^CREATE FUNCTION /gm) ?? []).length, 5)
  for (const [name, length, digest] of referenceDefinitions) {
    const definition = referenceSql.match(new RegExp(`^CREATE FUNCTION official_refresh_reference_r5\\.${name}\\([\\s\\S]*?\\$\\$;\\n`, 'm'))?.[0]
    assert.ok(definition)
    let original = definition
    for (const [redirected] of referenceDefinitions) original = original.replaceAll(`official_refresh_reference_r5.${redirected}(`, `official_provenance_private.${redirected}(`)
    assert.equal(Buffer.byteLength(original), length)
    assert.equal(createHash('sha256').update(original).digest('hex'), digest)
  }
}
const signature = 'official_original_api.refresh_version_v1(text,text,text,uuid,text,bigint,text,bytea,bytea,official_provenance_api.artifact_input_v1[],bytea[])'
const settingsSql = "SELECT current_setting('jit') AS jit,current_setting('statement_timeout') AS statement,current_setting('lock_timeout') AS lock,current_setting('idle_in_transaction_session_timeout') AS idle_transaction,current_setting('idle_session_timeout') AS idle_session"
const executionSettings = async (query: LocalPgConnection['query']) => {
  const rows = await query(settingsSql)
  assert.equal(rows.length, 1)
  const row = rows[0]!
  assert.ok(row.jit === 'on' || row.jit === 'off')
  assert.deepEqual({ ...row, jit: 'unchanged' }, { jit: 'unchanged', statement: '25s', lock: '15s', idle_transaction: '20s', idle_session: '0' })
  return row
}
const tables = [
  ...['admissions', 'reviews', 'rule_bindings', 'originals', 'ciphertexts', 'supports', 'events', 'head', 'refresh_transitions_v1'].map(name => `official_original_private.${name}`),
  ...['artifact_names', 'artifact_blobs', 'artifacts', 'receipts', 'receipt_dependencies', 'artifact_dependencies', 'custody_bindings', 'custody_dependencies'].map(name => `official_provenance_private.${name}`),
]
const snapshot = (connection: LocalPgConnection, includeAudit = true) => connection.query(tables.filter(name => includeAudit || !name.endsWith('.refresh_transitions_v1')).map(name =>
  `SELECT '${name}' AS relation,count(*)::text AS n,md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) AS digest FROM ${name} t`).join(' UNION ALL ') + ' ORDER BY relation')
const nonpositive = (result: AtomicRefreshResult) => {
  assert.notEqual(result.status, 'synthetic_atomic_refresh_verified'); assert.equal(result.syntheticVisaCells, 0)
  assert.equal(result.positiveRealVisaCells, 0); assert.equal(result.productionAcceptedRead, 'NOT_AUTHORIZED')
  assert.equal('readback' in result, false); assert.equal('sourceContent' in result, false)
  assert.equal('evaluations' in result, true); assert.ok(Object.isFrozen(result)); return result
}
const positive = (result: AtomicRefreshResult, request: AtomicRefreshRequest) => {
  assert.equal(result.status, 'synthetic_atomic_refresh_verified')
  if (result.status !== 'synthetic_atomic_refresh_verified') throw Error('refresh_positive_missing')
  assert.equal(result.predecessor, request.expectedPredecessor); assert.equal(result.successor, request.envelope.bundle.recordFingerprint)
  assert.equal(result.witness.sequence, String(Number(request.witness.sequence) + 2))
  assert.equal(result.sourceContent, 'unchanged'); assert.equal(result.ruleChange, 'not_asserted')
  assert.equal(result.commitStatus, 'acknowledged'); assert.equal(result.producerClosed, true)
  assert.equal(result.syntheticVisaCells, 1); assert.equal(result.positiveRealVisaCells, 0)
  assert.equal(result.productionAcceptedRead, 'NOT_AUTHORIZED'); assert.equal(result.reusablePositiveCache, false)
  assert.equal(result.readback.projection.recordFingerprint, result.successor)
  assert.deepEqual(result.readback.witness, result.witness)
  assert.equal(result.readback.projection.evaluations.filter(row => row.result !== 'unknown').length, 1)
  assert.ok(result.readback.projection.evaluations.filter(row => row.requirementType !== 'visa').every(row => row.result === 'unknown'))
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.readback.projection.sources[0]!) && Object.isFrozen(result.sqlPhaseMs))
  assert.ok(Object.values(result.sqlPhaseMs).every(value => Number.isFinite(value) && value >= 0))
  return result
}

// One bounded parent, actual PostgreSQL 16 and isolated small clusters. All
// unchanged suites remain in their original mandatory jobs; no intended skips.
test('atomic refresh: actual fresh execution, full transition, concurrency, rollback and independent readback', { timeout: 1_200_000 }, async t => {
  const began = performance.now()
  const lifetime = new OwnedTestLifetime(t.signal)
  lifetime.installConnectOwnership()
  const delay = (ms: number) => lifetime.wait(ms)
  const refreshPersistedCanonicalVersion: typeof actualAtomicRefresh = (cluster, input, key, signal) => lifetime.run(() =>
    actualAtomicRefresh(cluster, input, key, signal ? AbortSignal.any([lifetime.signal, signal]) : lifetime.signal))
  const readPersistedCanonicalRequirements: typeof actualPersistedRead = (cluster, mode, key, witness, signal) => lifetime.run(() =>
    actualPersistedRead(cluster, mode, key, witness, signal ? AbortSignal.any([lifetime.signal, signal]) : lifetime.signal))
  const note = (phase: string, details: Record<string, unknown> = {}) => t.diagnostic(JSON.stringify({
    schema: 'official-truth-atomic-version-refresh-1', phase, elapsedMs: Math.round(performance.now() - began), ...details,
  }))
  const abortLifetimeRegression = async () => {
    const injected = new AbortController(), reason = Error('native_injected_parent_abort')
    const scope = new OwnedTestLifetime(AbortSignal.any([lifetime.signal, injected.signal]))
    const beforeConnect = LocalPgConnection.connect, beforeFetch = globalThis.fetch
    scope.installConnectOwnership()
    const ownPids: string[] = [], started: Promise<unknown>[] = []
    let nextScenario = 0, nextCluster = 0, sleepingSeen = false, gateSeen = false
    let failure: unknown, failed = false
    try {
      const cluster = scope.startCluster(startLocalProofCluster)
      const identify = async (connection: LocalPgConnection) => {
        const row = (await connection.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE pid=pg_backend_pid()'))[0]
        assert.match(row?.pid ?? '', /^[1-9][0-9]*$/); assert.ok(row?.birth)
        ownPids.push(row.pid!); return row.pid!
      }
      const worker = await LocalPgConnection.connect(cluster), workerPid = await identify(worker)
      const observer = await LocalPgConnection.connect(cluster); await identify(observer)
      let resume!: () => void, reached!: () => void, failEarly!: (error: unknown) => void
      const gate = new Promise<void>(resolve => { resume = resolve }), ready = new Promise<void>(resolve => { reached = resolve })
      const early = new Promise<never>((_resolve, reject) => { failEarly = reject }); void early.catch(() => {})
      scope.onStop(() => { resume(); failEarly(scope.signal.reason) })
      const realConnect = LocalPgConnection.connect
      scope.patchConnect(async (...args: Parameters<typeof realConnect>) => {
        const connection = await realConnect.call(LocalPgConnection, ...args)
        await identify(connection); gateSeen = true; reached()
        await gate; scope.check(); return connection
      })
      globalThis.fetch = async () => { throw Error('unexpected_abort_regression_network') }
      scope.restore(() => { globalThis.fetch = beforeFetch })
      const capturedConnect = LocalPgConnection.connect
      const sleeping = scope.run(() => worker.query('SELECT pg_sleep(10)'))
      const gated = capturedConnect(cluster)
      started.push(sleeping, gated); for (const pending of started) void pending.catch(failEarly)
      await scope.run(() => Promise.race([ready, early]))
      const until = performance.now() + 2_000
      while (performance.now() < until) {
        sleepingSeen = (await observer.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid::text=$1::text AND state='active' AND wait_event='PgSleep'", [pgText(workerPid)]))[0]?.n === '1'
        if (sleepingSeen) break; await scope.wait(20)
      }
      assert.equal(sleepingSeen, true); assert.equal(gateSeen, true); assert.equal(new Set(ownPids).size, 3)
      const abortStarted = performance.now()
      injected.abort(reason)
      const cleanup = await scope.dispose(), outcomes = await Promise.allSettled(started)
      assert.equal(outcomes.length, 2); assert.ok(outcomes.every(outcome => outcome.status === 'rejected'))
      assert.equal(cleanup.pending, 0); assert.equal(cleanup.started, cleanup.settled)
      assert.equal(cleanup.connections, 3); assert.equal(cleanup.closed, 3); assert.equal(cleanup.stoppedClusters, 1)
      assert.equal(LocalPgConnection.connect, beforeConnect); assert.equal(globalThis.fetch, beforeFetch)
      assert.equal(existsSync(cluster.root), false)
      for (const pid of ownPids) assert.throws(() => process.kill(Number(pid), 0), (error: unknown) => (error as NodeJS.ErrnoException)?.code === 'ESRCH')
      assert.throws(() => scope.startCluster(() => { nextCluster++; return startLocalProofCluster() }), error => error === reason)
      await assert.rejects(scope.run(async () => { nextScenario++ }), error => error === reason)
      await assert.rejects(capturedConnect(cluster), error => error === reason)
      assert.equal(nextScenario, 0); assert.equal(nextCluster, 0)
      note('actual parent-lifetime abort stops pending SQL and connection gate, restores hooks and removes own backends', {
        sleepingSeen, gateSeen, actorsSettled: outcomes.length, ownBackendsGone: ownPids.length,
        abortCleanupMs: Math.round(performance.now() - abortStarted), cleanup, nextScenario, nextCluster,
      })
    } catch (error) { failed = true; failure = error }
    finally {
      try { await scope.dispose() } catch (error) { throw new AggregateError(failed ? [failure, error] : [error], 'abort_regression_cleanup_failed') }
    }
    if (failed) throw failure
  }
  let failure: unknown, failed = false
  try {
  await lifetime.run(abortLifetimeRegression)
  validateReferenceSource()
  const graphReferenceSql = readFileSync(new URL('./graph-reference-r9.fixture.sql', import.meta.url), 'utf8')
  validateGraphReferenceSource(graphReferenceSql)
  const primary = await lifetime.run(() => actuallyFreshObservations('primary', 3, lifetime.signal))
  const composed = await lifetime.run(() => actuallyFreshObservations('composed', 2, lifetime.signal))
  note('five independent actual fresh executions; full capsules retained; later observations, unchanged bytes and mutually compatible immutable artifact identities asserted')
  const openHarness = async (initial: PreparedOriginals) => {
    const cluster = lifetime.startCluster(startLocalProofCluster), opened = new Set<LocalPgConnection>()
    const connect = async (role?: string) => { const c = await LocalPgConnection.connect(cluster, role); opened.add(c); return c }
    const close = (c: LocalPgConnection) => { if (opened.delete(c)) c.close() }
    try {
    const owner = await connect(), key = randomBytes(32).toString('hex')
    assert.match(cluster.version, /^postgres \(PostgreSQL\) 16\./)
    const gone = async (pids: readonly string[]) => {
      for (const pid of pids) {
        const until = performance.now() + 3_000
        let absent = false
        while (performance.now() < until) {
          absent = (await owner.query('SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid::text=$1::text', [pgText(pid)]))[0]?.n === '0'
          if (absent) break; await delay(20)
        }
        assert.equal(absent, true, 'owned producer/reader backend actually exits')
      }
    }
      await owner.query('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;')
      await installLocalProofSchema(owner)
      for (const name of migrations) await owner.query(readFileSync(new URL(`../../../supabase/migrations/${name}`, import.meta.url), 'utf8'))
      await owner.query(readFileSync(new URL('../official-truth-persisted-canonical-read-1/read-projection-candidate.sql', import.meta.url), 'utf8'))
      await owner.query(packageSql)
      // Actual server-side assertion inside every successful transition. It
      // changes no runtime function and emits no caller material or settings.
      await owner.query(`CREATE FUNCTION public.refresh_profile_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        IF current_setting('jit')<>'off' OR current_setting('statement_timeout')<>'25s'
         OR current_setting('lock_timeout')<>'15s' OR current_setting('idle_in_transaction_session_timeout')<>'20s'
        THEN RAISE EXCEPTION 'refresh_execution_profile_wrong' USING ERRCODE='P7798'; END IF;
        RETURN NEW; END $$;
        CREATE TRIGGER refresh_profile_guard AFTER INSERT ON official_original_private.refresh_transitions_v1
        FOR EACH ROW EXECUTE FUNCTION public.refresh_profile_guard();`)
      await owner.query(`CREATE ROLE ot_original_test_writer LOGIN; GRANT ot_original_producer,ot_provenance_writer TO ot_original_test_writer;
        CREATE ROLE ot_original_test_reader LOGIN; GRANT ot_original_reader,ot_provenance_reader TO ot_original_test_reader;
        CREATE ROLE ot_original_test_reviewer LOGIN; GRANT ot_original_reviewer TO ot_original_test_reviewer;
        CREATE ROLE ot_original_test_lifecycle LOGIN; GRANT ot_original_lifecycle TO ot_original_test_lifecycle;
        CREATE ROLE ${ATOMIC_REFRESH_LOGIN} LOGIN; GRANT ${ATOMIC_REFRESH_ROLE} TO ${ATOMIC_REFRESH_LOGIN};`)
      for (const fixture of [primary[0]!, composed[0]!]) {
        const checked = verifyLocalIntegratedPilotBundle(fixture.envelope); assert.ok(checked.ok)
        for (const support of checked.value.receipt.payload.supports) await owner.query(
          'INSERT INTO official_original_private.admissions VALUES($1::jsonb,$2::text,$3::text,1,65536,2592000,2592000) ON CONFLICT DO NOTHING',
          [pgText(JSON.stringify(support.binding), 3802), pgText(support.contentType), pgText(support.canonicalFinalUrl)])
      }
      const oids = await localArtifactTypeOids(owner), reviewer = await connect('ot_original_test_reviewer'), lifecycle = await connect('ot_original_test_lifecycle')
      let witness = await cursor(lifecycle)
      // Explicit test-only synthetic authority. The runtime never reads a
      // cursor, checkpoints, repairs an old witness or receives this callback.
      const align = async () => lifecycle.query('SELECT official_original_api.checkpoint($1::bigint,$2::text)', [pgText(witness.sequence, 20), pgText(witness.eventHash)])
      const review = (fixture: PreparedOriginals) => reviewCandidate(reviewer, fixture)
      const seed = async (fixture: PreparedOriginals) => {
        await align(); const reviewId = await review(fixture), writer = await connect('ot_original_test_writer')
        const pid = (await writer.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
        try {
          await writer.query('BEGIN ISOLATION LEVEL READ COMMITTED')
          await publishIntegratedBundle(writer, oids, fixture.envelope)
          await bindCandidate(writer, fixture, reviewId, key, witness, 'create_or_verify')
          await writer.query('COMMIT')
        } finally { close(writer) }
        await gone([pid]); witness = await cursor(lifecycle); await align(); return reviewId
      }
      const initialReview = await seed(initial)
      const compareJit = async () => {
        const baseline = await snapshot(owner)
        const probe = async (setting: 'on' | 'off') => {
          const c = await connect()
          let pid: string | null = null, original: Awaited<ReturnType<typeof executionSettings>> | undefined
          let available: string | null | undefined
          let verifyMs: number | null = null, completed = false, restored = false
          let errorCode: string | null = null
          try {
            pid = (await c.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
            original = await executionSettings(c.query.bind(c))
            available = (await c.query('SELECT pg_jit_available()::text AS available'))[0]?.available
            assert.ok(available === 'true' || available === 'false')
            await c.query('BEGIN ISOLATION LEVEL READ COMMITTED')
            await c.query(setting === 'on' ? 'SET LOCAL jit=on' : 'SET LOCAL jit=off')
            assert.deepEqual(await executionSettings(c.query.bind(c)), { ...original, jit: setting })
            const started = performance.now()
            try {
              await c.query('SELECT official_provenance_private.verify_retained_v2($1::text)', [pgText(initial.envelope.bundle.recordFingerprint)])
              completed = true
            } finally { verifyMs = Math.round(performance.now() - started) }
          } catch (error) { errorCode = error instanceof LocalPgError ? error.code : 'test_or_transport'; throw error }
          finally {
            try {
              await c.query('ROLLBACK')
              assert.ok(original)
              assert.deepEqual(await executionSettings(c.query.bind(c)), original)
              restored = true
            } finally {
              close(c); if (pid) await gone([pid])
              assert.deepEqual(await snapshot(owner), baseline)
              note('fixed retained verification execution-profile probe', { setting, previous: original?.jit ?? null,
                jitAvailableBefore: available === 'true' ? true : available === 'false' ? false : null,
                verifyMs, completed, restored, sqlstate: errorCode })
            }
          }
        }
        // Exactly this fixed pair; no retries, favorable-result selection or
        // performance assertion. Each probe owns a fresh backend and rollback.
        await probe('on')
        await probe('off')
        await locksReleased()
      }
      const request = async (next: PreparedOriginals, mode: 'primary' | 'composed', predecessor = initial.envelope.bundle.recordFingerprint): Promise<AtomicRefreshRequest> => ({
        mode, expectedPredecessor: predecessor, envelope: next.envelope, bodies: next.bodies, reviewId: await review(next), witness: { ...witness },
      })
      const locksReleased = async () => {
        await owner.query('BEGIN')
        try {
          await owner.query('SELECT singleton FROM official_original_private.head FOR UPDATE NOWAIT')
          assert.equal((await owner.query('SELECT pg_try_advisory_xact_lock(1869901924,1)::text AS held'))[0]?.held, 'true')
        } finally { await owner.query('ROLLBACK') }
      }
      const compareReference = async (mode: 'primary' | 'composed') => {
        const baseline = await snapshot(owner)
        const typeInventorySql = `SELECT n.nspname,t.typname,t.typtype,t.oid::text FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
          WHERE n.nspname LIKE 'official_%' ORDER BY n.nspname,t.typname`
        const typesBefore = await owner.query(typeInventorySql)
        await owner.query(referenceSql)
        assert.deepEqual(await owner.query(typeInventorySql), typesBefore, 'native oracle introduces no SQL type')
        type Envelope = PreparedOriginals['envelope']
        type Implementation = 'reference' | 'current'
        const invoke = async (connection: LocalPgConnection, implementation: Implementation, kind: 'retained' | 'raw', envelope: Envelope = initial.envelope) => {
          const schema = implementation === 'reference' ? 'official_refresh_reference_r5' : 'official_provenance_private'
          const b = envelope.bundle
          if (kind === 'retained') return connection.query(`SELECT ${schema}.verify_retained_v2($1::text)`, [pgText(b.recordFingerprint)])
          const aa = pgCompositeArray(oids.array, oids.element, b.artifacts.map(a => [pgText(a.pin.id), pgText(String(a.pin.version), 20),
            pgText(a.pin.digest), pgText(a.artifactType), pgText(a.artifactType === 'global_cell' ? 'global_definition_v1' : a.artifactType.endsWith('V1') ? 'custody_v1' : 'manifest_v1'),
            pgText(String(a.artifactContractVersion), 23), pgBytes(a.canonicalBytes)]))
          const sql = `SELECT ${schema}.validate_bundle_v2($1::text,$2::text,$3::bytea,$4::bytea,$5::official_provenance_api.artifact_input_v1[])`
          const parameters = [pgText(envelope.profile), pgText(b.recordFingerprint), pgBytes(b.receiptBytes), pgBytes(b.custodyBindingBytes), aa]
          if (b.artifacts.length === 256) {
            // The count-only negative must reach SQL. This conservative bound
            // covers both unchanged wire guards, including fixed P/B/D/E/S
            // framing beyond the driver's 12-byte-per-parameter preflight.
            const frameUpperBound = parameters.reduce((sum, parameter) => sum + parameter.bytes.length + 12, Buffer.byteLength(sql) + 64)
            const transportReserve = 10_485_760 - frameUpperBound
            assert.ok(transportReserve >= 1_048_576, 'count256 fixture retains at least 1MiB below the unchanged transport limit')
            note('raw count256 fixture fits actual serialized transport with reserve', { implementation, artifacts: b.artifacts.length,
              arrayBytes: aa.bytes.length, frameUpperBoundBytes: frameUpperBound, transportReserveBytes: transportReserve })
          }
          return connection.query(sql, parameters)
        }
        const stats = async (connection: LocalPgConnection) => connection.query(`SELECT schemaname,funcname,calls::text,total_time::text,self_time::text
          FROM pg_stat_xact_user_functions WHERE schemaname IN ('official_provenance_private','official_refresh_reference_r5')
          AND funcname IN ('artifact_v2','artifact_envelope','decode','content_v2','content_from_index_v2','semantic_content_index_v2',
            'closure_v2','inspected_closure_v2','validate_graph_v2','validate_inspected_graph_v2','validate_semantics_v2','validate_bundle_v2','verify_retained_v2')
          ORDER BY schemaname,funcname`)
        // These transaction-local statistics measure only the one actual call
        // between two samples. Preparation/snapshots cannot inflate the count.
        const probe = async (implementation: Implementation, kind: 'retained' | 'raw') => {
          const connection = await connect()
          let pid: string | null = null, beforeProfile: Awaited<ReturnType<typeof executionSettings>> | undefined
          let beforeTracking: string | null | undefined, elapsed: number | null = null, completed = false, restored = false
          let sqlstate: string | null = null
          let delta: { schema: string; function: string; calls: number; totalMs: number; selfMs: number }[] = []
          try {
            pid = (await connection.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
            beforeProfile = await executionSettings(connection.query.bind(connection))
            beforeTracking = (await connection.query("SELECT current_setting('track_functions') AS setting"))[0]?.setting
            assert.ok(beforeTracking)
            await connection.query('BEGIN ISOLATION LEVEL READ COMMITTED')
            await connection.query("SET LOCAL track_functions='all'")
            const before = await stats(connection), started = performance.now()
            try { await invoke(connection, implementation, kind); completed = true }
            finally { elapsed = Math.round(performance.now() - started) }
            const after = await stats(connection)
            delta = after.map(row => {
              const prior = before.find(value => value.schemaname === row.schemaname && value.funcname === row.funcname)
              return { schema: row.schemaname!, function: row.funcname!, calls: Number(row.calls) - Number(prior?.calls ?? '0'),
                totalMs: Number(row.total_time) - Number(prior?.total_time ?? '0'), selfMs: Number(row.self_time) - Number(prior?.self_time ?? '0') }
            }).filter(row => row.calls > 0)
            assert.ok(delta.every(row => Number.isSafeInteger(row.calls) && row.calls >= 0 && Number.isFinite(row.totalMs)
              && row.totalMs >= 0 && Number.isFinite(row.selfMs) && row.selfMs >= 0))
            assert.equal(delta.find(row => row.schema === 'official_provenance_private' && row.function === 'artifact_v2')?.calls,
              initial.envelope.bundle.artifacts.length * (kind === 'retained' && implementation === 'reference' ? 4 : 1))
            assert.deepEqual(await executionSettings(connection.query.bind(connection)), beforeProfile)
            assert.deepEqual(await snapshot(connection), baseline)
          } catch (error) { sqlstate = error instanceof LocalPgError ? error.code : 'test_or_transport'; throw error }
          finally {
            try {
              await connection.query('ROLLBACK')
              assert.ok(beforeProfile && beforeTracking)
              assert.deepEqual(await executionSettings(connection.query.bind(connection)), beforeProfile)
              assert.equal((await connection.query("SELECT current_setting('track_functions') AS setting"))[0]?.setting, beforeTracking)
              restored = true
            } finally {
              close(connection); if (pid) await gone([pid])
              assert.deepEqual(await snapshot(owner), baseline)
              note('fixed original/new complete verifier probe', { mode, implementation, kind, artifacts: initial.envelope.bundle.artifacts.length,
                verifyMs: elapsed, completed, restored, sqlstate, invocationDelta: delta })
            }
          }
        }
        for (const kind of ['retained', 'raw'] as const) for (const implementation of ['reference', 'current'] as const) await probe(implementation, kind)

        // Exact installed metadata plus actual denied calls. New workers are
        // private INVOKER functions, never login capabilities or caller caches.
        for (const [sig, volatility] of privateR5Helpers) {
          const qualified = `official_provenance_private.${sig}`
          assert.deepEqual(await owner.query(`SELECT r.rolname AS owner,p.prosecdef::text AS definer,p.provolatile::text AS volatility,
            (p.proconfig=ARRAY['search_path=""','TimeZone=UTC'])::text AS config FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner
            WHERE p.oid=$1::regprocedure`, [pgText(qualified)]), [{ owner: 'ot_provenance_ddl', definer: 'false', volatility, config: 'true' }])
          assert.deepEqual(await owner.query(`SELECT r.rolname,r.rolcanlogin::text AS login,a.privilege_type,a.is_grantable::text AS grantable
            FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a LEFT JOIN pg_roles r ON r.oid=a.grantee WHERE p.oid=$1::regprocedure ORDER BY r.rolname`,
            [pgText(qualified)]), ['ot_provenance_ddl', 'ot_provenance_read_exec', 'ot_provenance_write_exec'].map(rolname =>
            ({ rolname, login: 'false', privilege_type: 'EXECUTE', grantable: 'false' })))
        }
        assert.deepEqual(await owner.query(`SELECT r.rolname,a.privilege_type,a.is_grantable::text AS grantable FROM pg_namespace n
          CROSS JOIN LATERAL aclexplode(n.nspacl) a LEFT JOIN pg_roles r ON r.oid=a.grantee WHERE n.nspname='official_refresh_reference_r5'
          ORDER BY a.privilege_type`), ['CREATE', 'USAGE'].map(privilege_type => ({ rolname: cluster.user, privilege_type, grantable: 'false' })))
        const referenceAcl = await owner.query(`SELECT p.proname,r.rolname,p.prosecdef::text AS definer,a.privilege_type,a.is_grantable::text AS grantable
          FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN LATERAL aclexplode(p.proacl) a
          LEFT JOIN pg_roles r ON r.oid=a.grantee WHERE n.nspname='official_refresh_reference_r5' ORDER BY p.proname`)
        assert.deepEqual(referenceAcl, referenceDefinitions.map(([proname]) => ({ proname, rolname: cluster.user, definer: 'false', privilege_type: 'EXECUTE', grantable: 'false' }))
          .sort((a, b) => a.proname.localeCompare(b.proname)))
        const deniedRoles = ['anon', 'authenticated', 'service_role', 'ot_provenance_writer', 'ot_provenance_reader',
          'ot_original_test_writer', 'ot_original_test_reader', ATOMIC_REFRESH_ROLE, ATOMIC_REFRESH_LOGIN]
        const denialConnection = await connect(), denialPid = (await denialConnection.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
        try {
          await denialConnection.query('BEGIN')
          for (const role of deniedRoles) {
            for (const [sig] of privateR5Helpers) assert.equal((await owner.query("SELECT has_function_privilege($1::name,$2::text,'EXECUTE')::text AS allowed",
              [pgText(role), pgText(`official_provenance_private.${sig}`)]))[0]?.allowed, 'false')
            await denialConnection.query(`SAVEPOINT role_denial; SET LOCAL ROLE ${role}`)
            for (const call of [...privateR5Helpers.map(([, , expression]) => `official_provenance_private.${expression}`),
              ...referenceCalls.map(expression => `official_refresh_reference_r5.${expression}`)]) {
              await denialConnection.query('SAVEPOINT denied_call')
              await assert.rejects(denialConnection.query(`SELECT ${call}`), code('42501'))
              await denialConnection.query('ROLLBACK TO SAVEPOINT denied_call')
            }
            await denialConnection.query('ROLLBACK TO SAVEPOINT role_denial')
          }
        } finally { try { await denialConnection.query('ROLLBACK') } finally { close(denialConnection) } }
        await gone([denialPid]); assert.deepEqual(await snapshot(owner), baseline); await locksReleased()
        note('six private worker ACLs and five owner-only reference functions: actual denied role calls; no new SQL types', { mode, deniedRoles: deniedRoles.length })
        if (mode === 'composed') return

        // One actual backend sees a valid baseline, each later corruption, and
        // the restored baseline. No replacement runtime functions or fake pins.
        const adversary = await connect(), adversaryPid = (await adversary.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
        const originalProfile = await executionSettings(adversary.query.bind(adversary))
        const triggerInventory = () => adversary.query(`SELECT n.nspname,c.relname,t.tgname,t.tgenabled::text AS enabled,
          t.tgdeferrable::text AS deferrable,t.tginitdeferred::text AS initially_deferred,md5(pg_get_triggerdef(t.oid)) AS definition
          FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname IN ('official_original_private','official_provenance_private') ORDER BY n.nspname,c.relname,t.tgname`)
        const originalTriggers = await triggerInventory()
        const refuseBoth = async (name: string, kind: 'raw' | 'retained', envelope: Envelope = initial.envelope) => {
          const before = await snapshot(adversary), outcomes: { implementation: Implementation; sqlstate: string; verifyMs: number }[] = []
          for (const implementation of ['reference', 'current'] as const) {
            await adversary.query('SAVEPOINT invalid_proof')
            const started = performance.now(); let caught: unknown
            try { await invoke(adversary, implementation, kind, envelope) } catch (error) { caught = error }
            assert.ok(caught instanceof LocalPgError, 'invalid proof must reach the actual verifier and fail')
            assert.equal(caught.code, 'P0001')
            outcomes.push({ implementation, sqlstate: caught.code, verifyMs: Math.round(performance.now() - started) })
            await adversary.query('ROLLBACK TO SAVEPOINT invalid_proof')
            assert.deepEqual(await snapshot(adversary), before, 'verifier refusal must not mutate even the deliberately corrupt state')
          }
          note('original/new invalid proof agreement', { case: name, kind, outcomes })
        }
        try {
          await invoke(adversary, 'current', 'retained')
          const linkCases = [
            ['missing artifact link', 'artifact_dependencies', `WITH chosen AS (SELECT parent_id,parent_version,slot FROM official_provenance_private.artifact_dependencies ORDER BY parent_id,parent_version,slot LIMIT 1)
              DELETE FROM official_provenance_private.artifact_dependencies d USING chosen c WHERE (d.parent_id,d.parent_version,d.slot)=(c.parent_id,c.parent_version,c.slot) RETURNING 1 AS changed`],
            ['extra artifact link', 'artifact_dependencies', `INSERT INTO official_provenance_private.artifact_dependencies
              SELECT parent_id,parent_version,parent_digest,'/r5_extra',target_id,target_version,target_digest FROM official_provenance_private.artifact_dependencies ORDER BY parent_id,parent_version,slot LIMIT 1 RETURNING 1 AS changed`],
            ['same-count wrong artifact link', 'artifact_dependencies', `WITH chosen AS (SELECT * FROM official_provenance_private.artifact_dependencies ORDER BY parent_id,parent_version,slot LIMIT 1),
              alternative AS (SELECT a.* FROM official_provenance_private.artifacts a,chosen c WHERE (a.artifact_id,a.artifact_version,a.digest)<>(c.target_id,c.target_version,c.target_digest)
                AND (a.artifact_id,a.artifact_version,a.digest)<>(c.parent_id,c.parent_version,c.parent_digest) ORDER BY a.artifact_id,a.artifact_version LIMIT 1)
              UPDATE official_provenance_private.artifact_dependencies d SET target_id=a.artifact_id,target_version=a.artifact_version,target_digest=a.digest FROM chosen c,alternative a
                WHERE (d.parent_id,d.parent_version,d.slot)=(c.parent_id,c.parent_version,c.slot) RETURNING 1 AS changed`],
            ['missing receipt root link', 'receipt_dependencies', `WITH chosen AS (SELECT record_fingerprint,root_slot FROM official_provenance_private.receipt_dependencies ORDER BY record_fingerprint,root_slot LIMIT 1)
              DELETE FROM official_provenance_private.receipt_dependencies d USING chosen c WHERE (d.record_fingerprint,d.root_slot)=(c.record_fingerprint,c.root_slot) RETURNING 1 AS changed`],
            ['missing custody root link', 'custody_dependencies', `WITH chosen AS (SELECT record_fingerprint,binding_slot FROM official_provenance_private.custody_dependencies ORDER BY record_fingerprint,binding_slot LIMIT 1)
              DELETE FROM official_provenance_private.custody_dependencies d USING chosen c WHERE (d.record_fingerprint,d.binding_slot)=(c.record_fingerprint,c.binding_slot) RETURNING 1 AS changed`],
            ['later retained byte/digest substitution', 'artifact_blobs', `WITH chosen AS (SELECT b.digest FROM official_provenance_private.artifact_blobs b
              JOIN official_provenance_private.artifacts a USING(digest) WHERE a.artifact_type='semantic_contract' ORDER BY b.digest LIMIT 1)
              UPDATE official_provenance_private.artifact_blobs b SET canonical_bytes=b.canonical_bytes||decode('20','hex'),
                digest=encode(sha256(b.canonical_bytes||decode('20','hex')),'hex') FROM chosen c WHERE b.digest=c.digest RETURNING 1 AS changed`],
          ] as const
          for (const [name, table, mutation] of linkCases) {
            await adversary.query('BEGIN ISOLATION LEVEL READ COMMITTED')
            try {
              await adversary.query(`ALTER TABLE official_provenance_private.${table} DISABLE TRIGGER immutable_rows`)
              assert.deepEqual(await adversary.query(mutation), [{ changed: '1' }])
              // DML may queue the unchanged deferred FK/constraint triggers.
              // No further ALTER TABLE is legal while those events are pending.
              // Only this native mutation trigger stays disabled until ROLLBACK;
              // both actual STABLE verifiers still inspect the entire bad state.
              assert.deepEqual(await triggerInventory(), originalTriggers.map(row => row.nspname === 'official_provenance_private'
                && row.relname === table && row.tgname === 'immutable_rows' ? { ...row, enabled: 'D' } : row))
              assert.notDeepEqual(await snapshot(adversary), baseline, 'fixture corruption must actually be present')
              await refuseBoth(name, 'retained')
            } finally { await adversary.query('ROLLBACK') }
            assert.deepEqual(await triggerInventory(), originalTriggers, 'rollback restores every actual trigger definition and enabled state')
            assert.deepEqual(await executionSettings(adversary.query.bind(adversary)), originalProfile)
            assert.deepEqual(await snapshot(adversary), baseline)
            await invoke(adversary, 'current', 'retained')
          }
          const original = initial.envelope, b = original.bundle
          const contract = b.artifacts.find(a => a.artifactType === 'semantic_contract'); assert.ok(contract)
          const extra = createIntegratedPilotArtifact('semantic_contract', 'r5-unsolicited-contract', 1,
            JSON.parse(Buffer.from(contract.canonicalBytes).toString('utf8')).content as IntegratedPilotManifestContent<'semantic_contract'>)
          assert.ok(extra.ok)
          const wrongIncoming = corruptReceipt(original, payload => {
            const extractor = payload.extractor as { definition: unknown; registrySnapshot: unknown }
            extractor.registrySnapshot = extractor.definition
          })
          const malformedBytes = Buffer.from('{')
          const malformedFirst = { ...contract, pin: { ...contract.pin, digest: createHash('sha256').update(malformedBytes).digest('hex') }, canonicalBytes: malformedBytes }
          const rawCases: readonly [string, Envelope][] = [
            ['duplicate raw identity before indexing', { ...original, bundle: { ...b, artifacts: [...b.artifacts, b.artifacts[0]!] } }],
            ['missing raw artifact', { ...original, bundle: { ...b, artifacts: b.artifacts.slice(1) } }],
            ['unsolicited fully formed artifact', { ...original, bundle: { ...b, artifacts: [...b.artifacts, extra.value] } }],
            ['later malformed raw artifact bytes with matching content digest, inspected first', { ...original, bundle: { ...b, artifacts: [malformedFirst, ...b.artifacts.filter(a => a !== contract)] } }],
            ['later canonically invalid receipt bytes', { ...original, bundle: { ...b, receiptBytes: Buffer.concat([b.receiptBytes, Buffer.from(' ')]) } }],
            ['second wrong incoming expected type for existing pin', wrongIncoming],
            // This is an explicit raw count refusal, not a fabricated valid
            // 256-node proof or a claimed native depth/cycle branch traversal.
            ['raw artifact count 256 exceeds unchanged bound', { ...original, bundle: { ...b, artifacts: Array.from({ length: 256 }, () => contract) } }],
          ]
          await invoke(adversary, 'current', 'raw')
          for (const [name, envelope] of rawCases) {
            await adversary.query('BEGIN')
            try { await refuseBoth(name, 'raw', envelope) } finally { await adversary.query('ROLLBACK') }
            assert.deepEqual(await snapshot(adversary), baseline)
          }
          await invoke(adversary, 'current', 'raw')
          // Store only this negative receipt/root fixture in a rollback-only
          // transaction. Its unchanged artifacts contain a correctly typed
          // first root and a later root with the identical pin but wrong type.
          // Full verifiers must reject; it is never a published positive bundle.
          await adversary.query('BEGIN')
          try {
            const negative = wrongIncoming.bundle, bindingDigest = createHash('sha256').update(negative.custodyBindingBytes).digest('hex')
            const roots = await adversary.query(`SELECT r.slot,r.expected_type,r.ordinality::text,r.pin::text FROM
              official_provenance_private.receipt_roots(official_provenance_private.decode($1::bytea,262144)) WITH ORDINALITY r`, [pgBytes(negative.receiptBytes)])
            const first = roots.find(row => row.slot === 'extractor.definition'), second = roots.find(row => row.slot === 'extractor.registrySnapshot')
            assert.ok(first && second); assert.equal(first.pin, second.pin); assert.notEqual(first.expected_type, second.expected_type)
            assert.ok(Number(first.ordinality) < Number(second.ordinality))
            await adversary.query('INSERT INTO official_provenance_private.artifact_blobs VALUES($1::text,$2::bytea)', [pgText(bindingDigest), pgBytes(negative.custodyBindingBytes)])
            await adversary.query(`INSERT INTO official_provenance_private.receipts VALUES($1::text,$2::bytea,2,'official-truth-autonomous-provenance',1,'ot-provenance-json-v1')`,
              [pgText(negative.recordFingerprint), pgBytes(negative.receiptBytes)])
            await adversary.query('INSERT INTO official_provenance_private.custody_bindings VALUES($1::text,$2::text,1)', [pgText(negative.recordFingerprint), pgText(bindingDigest)])
            await adversary.query(`INSERT INTO official_provenance_private.receipt_dependencies SELECT $1::text,r.slot,r.pin->>'id',(r.pin->>'version')::bigint,r.pin->>'digest'
              FROM official_provenance_private.receipt_roots(official_provenance_private.decode($2::bytea,262144)) r`, [pgText(negative.recordFingerprint), pgBytes(negative.receiptBytes)])
            await adversary.query(`INSERT INTO official_provenance_private.custody_dependencies SELECT $1::text,r.slot,r.pin->>'id',(r.pin->>'version')::bigint,r.pin->>'digest'
              FROM official_provenance_private.binding_roots(official_provenance_private.decode($2::bytea,4096),$1::text) r`, [pgText(negative.recordFingerprint), pgBytes(negative.custodyBindingBytes)])
            assert.notDeepEqual(await snapshot(adversary), baseline)
            await refuseBoth('retained second wrong incoming type to an already reached full pin', 'retained', wrongIncoming)
          } finally { await adversary.query('ROLLBACK') }
          assert.deepEqual(await snapshot(adversary), baseline); await invoke(adversary, 'current', 'retained')
          // Full structural equivalence is deliberately weaker than source
          // truth. The unchanged canonical New/Old checks below reject this.
          const falseFact = contradictingFactFixture(original)
          await adversary.query('BEGIN')
          try { for (const implementation of ['reference', 'current'] as const) await invoke(adversary, implementation, 'raw', falseFact) }
          finally { await adversary.query('ROLLBACK') }
          assert.deepEqual(await snapshot(adversary), baseline)
          note('fully rehashed false fact remains structurally valid in both reference/current raw verifiers; canonical rejection is a separate mandatory proof')
        } finally {
          try {
            await adversary.query('ROLLBACK')
            assert.deepEqual(await triggerInventory(), originalTriggers)
            assert.deepEqual(await executionSettings(adversary.query.bind(adversary)), originalProfile)
          }
          finally { close(adversary) }
          await gone([adversaryPid]); assert.deepEqual(await snapshot(owner), baseline); await locksReleased()
        }
        note('same backend re-read later corrupt bytes/links and restored all 17 tables; no cross-invocation proof cache')
      }
      const compareGraphWorker = async (mode: 'primary' | 'composed') => {
        // R9 comparisons are graph-worker proofs only. Full authenticated
        // closure/semantic/refresh acceptance above and below stays mandatory.
        const baseline = await snapshot(owner)
        const typeInventory = `SELECT n.nspname,t.typname,t.typtype,t.oid::text FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
          WHERE n.nspname LIKE 'official_%' ORDER BY n.nspname,t.typname`
        const typesBefore = await owner.query(typeInventory)
        await owner.query(graphReferenceSql)
        assert.deepEqual(await owner.query(typeInventory), typesBefore, 'R9 reference adds no SQL type')
        const connection = await connect()
        let pid: string | null = null, profile: Awaited<ReturnType<typeof executionSettings>> | undefined
        let tracking: string | null | undefined, failed = false, failure: unknown
        type StoredNode = { id: string; version: string; digest: string; type: string; family: string; contract: string; bytes: Buffer }
        type Edge = { slot: string; pin: Record<string, unknown>; expected_type: string | null }
        type Inspection = Record<string, Edge[]>
        try {
          pid = (await connection.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
          profile = await executionSettings(connection.query.bind(connection))
          tracking = (await connection.query("SELECT current_setting('track_functions') AS setting"))[0]?.setting
          assert.ok(tracking)
          await connection.query('BEGIN ISOLATION LEVEL READ COMMITTED')
          const qualified = `${graphReferenceSchema}.${graphWorkerSignature}`
          assert.deepEqual(await connection.query(`SELECT r.rolname AS owner,p.prosecdef::text AS definer,p.provolatile::text AS volatility,
            (p.proconfig=ARRAY['search_path=""','TimeZone=UTC'])::text AS config FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner
            WHERE p.oid=$1::regprocedure`, [pgText(qualified)]), [{ owner: cluster.user, definer: 'false', volatility: 'i', config: 'true' }])
          assert.equal((await connection.query("SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') AS digest FROM pg_proc p WHERE p.oid=$1::regprocedure",
            [pgText(qualified)]))[0]?.digest, '658b89a62bf3482611df4f94eeefe941e5adc2e599ec0e5e6e112be58f32895e')
          assert.deepEqual(await connection.query(`SELECT r.rolname,a.privilege_type,a.is_grantable::text AS grantable
            FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a LEFT JOIN pg_roles r ON r.oid=a.grantee
            WHERE p.oid=$1::regprocedure`, [pgText(qualified)]), [{ rolname: cluster.user, privilege_type: 'EXECUTE', grantable: 'false' }])
          assert.deepEqual(await connection.query(`SELECT r.rolname,a.privilege_type,a.is_grantable::text AS grantable FROM pg_namespace n
            CROSS JOIN LATERAL aclexplode(n.nspacl) a LEFT JOIN pg_roles r ON r.oid=a.grantee WHERE n.nspname='official_refresh_graph_reference_r9'
            ORDER BY a.privilege_type`), ['CREATE', 'USAGE'].map(privilege_type => ({ rolname: cluster.user, privilege_type, grantable: 'false' })))
          const denied = ['anon', 'authenticated', 'service_role', 'ot_provenance_writer', 'ot_provenance_reader',
            'ot_original_test_writer', 'ot_original_test_reader', ATOMIC_REFRESH_ROLE, ATOMIC_REFRESH_LOGIN]
          for (const role of denied) {
            assert.deepEqual(await connection.query("SELECT has_function_privilege($1::name,$2::text,'EXECUTE')::text AS execute_allowed,has_schema_privilege($1::name,$3::text,'USAGE')::text AS usage_allowed",
              [pgText(role), pgText(qualified), pgText(graphReferenceSchema)]), [{ execute_allowed: 'false', usage_allowed: 'false' }])
            await connection.query(`SAVEPOINT graph_role; SET LOCAL ROLE ${role}`)
            await assert.rejects(connection.query(`SELECT ${graphReferenceSchema}.${graphWorkerName}(NULL::text,NULL::text,NULL::bytea,NULL::bytea,NULL::official_provenance_api.artifact_input_v1[],NULL::jsonb)`), code('42501'))
            await connection.query('ROLLBACK TO SAVEPOINT graph_role')
          }
          note('R9 graph reference owner-only ACL and exact pinned definition', { mode, deniedRoles: denied.length, referenceDefinitionSha256: '17af51e55da5c3ed65007904ddaf62f7875f28a8b3e9b91a71edb88c8976ea39' })

          // Derive the full stored closure exactly once BEFORE any measured
          // worker call. No capsule is truncated and no inspection flag is
          // supplied by the runtime caller. These are private owner test inputs.
          const fingerprint = initial.envelope.bundle.recordFingerprint
          const stored = await connection.query(`WITH closure AS MATERIALIZED (
            SELECT * FROM official_provenance_private.inspected_closure_v2($1::text))
            SELECT 'artifact'::text AS kind,a.ordinality::text AS ordinal,a.artifact_id,a.artifact_version::text,a.digest,a.artifact_type,
              a.byte_contract_family,a.artifact_contract_version::text,a.canonical_bytes,NULL::text AS inspection
            FROM closure c CROSS JOIN LATERAL unnest(c.artifacts) WITH ORDINALITY a
            UNION ALL SELECT 'inspection',NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::bytea,c.inspected_edges::text FROM closure c`, [pgText(fingerprint)])
          const inspections = stored.filter(row => row.kind === 'inspection')
          assert.equal(inspections.length, 1)
          assert.ok(inspections[0]!.inspection)
          const actualInspection = JSON.parse(inspections[0]!.inspection!) as Inspection
          const artifactRows = stored.filter(row => row.kind === 'artifact').sort((a, b) => Number(a.ordinal) - Number(b.ordinal))
          assert.equal(artifactRows.length, initial.envelope.bundle.artifacts.length)
          assert.equal(stored.length, artifactRows.length + 1)
          const nodes: StoredNode[] = artifactRows.map((row, index) => {
            assert.equal(row.ordinal, String(index + 1))
            const original = initial.envelope.bundle.artifacts.find(a => a.pin.id === row.artifact_id && String(a.pin.version) === row.artifact_version)
            assert.ok(original)
            assert.equal(row.digest, original.pin.digest); assert.equal(row.artifact_type, original.artifactType)
            assert.equal(row.byte_contract_family, original.artifactType === 'global_cell' ? 'global_definition_v1' : original.artifactType.endsWith('V1') ? 'custody_v1' : 'manifest_v1')
            assert.equal(row.artifact_contract_version, String(original.artifactContractVersion))
            assert.match(row.canonical_bytes ?? '', /^\\x(?:[a-f0-9]{2})+$/)
            const bytes = Buffer.from(row.canonical_bytes!.slice(2), 'hex')
            assert.deepEqual(bytes, Buffer.from(original.canonicalBytes))
            return { id: row.artifact_id!, version: row.artifact_version!, digest: row.digest!, type: row.artifact_type!,
              family: row.byte_contract_family!, contract: row.artifact_contract_version!, bytes }
          })
          const keyOf = (node: StoredNode) => `${node.id}:${node.version}:${node.digest}`
          assert.equal(new Set(nodes.map(keyOf)).size, nodes.length)
          assert.equal(Object.keys(actualInspection).length, nodes.length)
          assert.ok(nodes.every(node => Array.isArray(actualInspection[keyOf(node)])))
          const material = (await connection.query(`SELECT r.canonical_payload_bytes AS receipt,bb.canonical_bytes AS binding
            FROM official_provenance_private.receipts r JOIN official_provenance_private.custody_bindings cb USING(record_fingerprint)
            JOIN official_provenance_private.artifact_blobs bb ON bb.digest=cb.binding_digest WHERE r.record_fingerprint=$1::text`, [pgText(fingerprint)]))[0]
          assert.ok(material)
          assert.match(material.receipt ?? '', /^\\x(?:[a-f0-9]{2})+$/); assert.match(material.binding ?? '', /^\\x(?:[a-f0-9]{2})+$/)
          const receipt = Buffer.from(material.receipt!.slice(2), 'hex'), binding = Buffer.from(material.binding!.slice(2), 'hex')
          assert.deepEqual(receipt, Buffer.from(initial.envelope.bundle.receiptBytes)); assert.deepEqual(binding, Buffer.from(initial.envelope.bundle.custodyBindingBytes))
          const artifacts = pgCompositeArray(oids.array, oids.element, nodes.map(node => [pgText(node.id), pgText(node.version, 20), pgText(node.digest),
            pgText(node.type), pgText(node.family), pgText(node.contract, 23), pgBytes(node.bytes)]))
          const parameters = (inspection: Inspection) => [pgText(initial.envelope.profile), pgText(fingerprint), pgBytes(receipt), pgBytes(binding), artifacts, pgText(JSON.stringify(inspection), 3802)]
          const actualParameters = parameters(actualInspection)
          const invoke = (implementation: 'r8_reference' | 'current', prepared: readonly PgParameter[]) => {
            const schema = implementation === 'r8_reference' ? graphReferenceSchema : 'official_provenance_private'
            return connection.query(`SELECT ${schema}.${graphWorkerName}($1::text,$2::text,$3::bytea,$4::bytea,$5::official_provenance_api.artifact_input_v1[],$6::jsonb)`, prepared)
          }
          const stats = () => connection.query(`SELECT schemaname,funcname,calls::text,total_time::text,self_time::text FROM pg_stat_xact_user_functions
            WHERE schemaname IN ('official_provenance_private','official_refresh_graph_reference_r9')
              AND funcname IN ('validate_inspected_graph_v2','artifact_v2') ORDER BY schemaname,funcname`)
          await connection.query("SET LOCAL track_functions='all'")
          for (const implementation of ['r8_reference', 'current'] as const) {
            const before = await stats(), started = performance.now()
            await invoke(implementation, actualParameters)
            const workerMs = Math.round(performance.now() - started), after = await stats()
            const delta = after.map(row => {
              const prior = before.find(value => value.schemaname === row.schemaname && value.funcname === row.funcname)
              return { schema: row.schemaname!, function: row.funcname!, calls: Number(row.calls) - Number(prior?.calls ?? '0'),
                totalMs: Number(row.total_time) - Number(prior?.total_time ?? '0'), selfMs: Number(row.self_time) - Number(prior?.self_time ?? '0') }
            }).filter(row => row.calls > 0)
            assert.equal(delta.length, 1)
            assert.equal(delta[0]!.schema, implementation === 'r8_reference' ? graphReferenceSchema : 'official_provenance_private')
            assert.equal(delta[0]!.function, graphWorkerName); assert.equal(delta[0]!.calls, 1)
            assert.ok(Number.isFinite(delta[0]!.totalMs) && delta[0]!.totalMs >= 0 && Number.isFinite(delta[0]!.selfMs) && delta[0]!.selfMs >= 0)
            note('R9 fixed R8/new graph worker probe on complete retained inputs', { mode, implementation, artifacts: nodes.length,
              canonicalBytes: nodes.reduce((sum, node) => sum + node.bytes.length, 0), workerMs, invocationDelta: delta })
          }

          if (mode === 'primary') {
            const rootRows = await connection.query(`SELECT r.slot,r.pin::text,r.expected_type,
              (CASE WHEN r.slot IN ('globalAdmission','selectedSupportManifest','autonomousReviewConstruction') THEN 2 ELSE 1 END)::text AS depth
              FROM (SELECT * FROM official_provenance_private.receipt_roots(official_provenance_private.decode($1::bytea,262144))
              UNION ALL SELECT * FROM official_provenance_private.binding_roots(official_provenance_private.decode($2::bytea,4096),$3::text)) r`,
            [pgBytes(receipt), pgBytes(binding), pgText(fingerprint)])
            const roots = rootRows.map(row => { const pin = JSON.parse(row.pin!) as { id: string; version: number; digest: string }
              return { key: `${pin.id}:${pin.version}:${pin.digest}`, depth: Number(row.depth) } })
            assert.ok(roots.length > 1 && roots.every(root => nodes.some(node => keyOf(node) === root.key) && [1, 2].includes(root.depth)))
            const firstRoot = roots.find(root => root.depth === 1)!, deeperRoot = roots.find(root => root.depth === 2)!
            assert.ok(firstRoot && deeperRoot)
            const start = nodes.find(node => keyOf(node) === firstRoot.key)!, deepStart = nodes.find(node => keyOf(node) === deeperRoot.key)!
            const free = nodes.filter(node => !roots.some(root => root.key === keyOf(node)))
            assert.ok(free.length >= 16)
            const edge = (node: StoredNode, index: number): Edge => ({ slot: `/r9/${index}`, pin: { id: node.id, version: Number(node.version), digest: node.digest }, expected_type: node.type })
            const empty = (): Inspection => Object.fromEntries(nodes.map(node => [keyOf(node), []]))
            const star = (): Inspection => { const value = empty(); value[keyOf(start)] = nodes.filter(node => node !== start).map(edge); return value }
            const chain = (maximumDepth: 16 | 17): Inspection => {
              const value = empty(), shared = free[0]!, end = free[1]!, middle = free.slice(2, maximumDepth - 1)
              assert.equal(middle.length, maximumDepth - 3)
              const used = new Set([keyOf(start), keyOf(shared), keyOf(end), ...middle.map(keyOf)])
              value[keyOf(start)] = [shared, middle[0]!, ...nodes.filter(node => !used.has(keyOf(node)))].map(edge)
              for (let i = 0; i < middle.length; i++) value[keyOf(middle[i]!)] = [edge(middle[i + 1] ?? shared, 0)]
              value[keyOf(shared)] = [edge(end, 0)]; return value
            }
            // This arithmetic describes the explicit graph-only fixture; it
            // is neither a typed-capsule validator nor a SQL execution trace.
            const arithmetic = (inspection: Inspection) => {
              const queue = roots.map(root => ({ ...root, path: [] as string[] })), longest = new Map<string, number>()
              let head = 0, deepest = 0, laterDeeper = 0, maxPending = queue.length, dominated = 0
              while (head < queue.length) {
                const item = queue[head++]!; deepest = Math.max(deepest, item.depth)
                if (item.depth > 16) return { outcome: 'depth', deepest, laterDeeper, maxPending, dominated, cycleDominated: false }
                if (item.path.includes(item.key)) return { outcome: 'cycle', deepest, laterDeeper, maxPending, dominated,
                  cycleDominated: (longest.get(item.key) ?? 0) >= item.depth }
                const previous = longest.get(item.key)
                if (previous !== undefined && previous >= item.depth) { dominated++; continue }
                if (previous !== undefined) laterDeeper++
                longest.set(item.key, item.depth)
                for (const next of inspection[item.key] ?? []) {
                  queue.push({ key: `${next.pin.id}:${next.pin.version}:${next.pin.digest}`, depth: item.depth + 1, path: [...item.path, item.key] })
                  maxPending = Math.max(maxPending, queue.length - head)
                }
              }
              return { outcome: longest.size === nodes.length ? 'complete' : 'unsolicited', deepest, laterDeeper, maxPending, dominated, cycleDominated: false }
            }
            const duplicate = star(); duplicate[keyOf(start)]!.push(edge(free[0]!, 900), edge(free[1]!, 901), edge(free[0]!, 902))
            const depth16 = chain(16), depth17 = chain(17), cycle = star()
            cycle[keyOf(deepStart)] = [edge(free[0]!, 0)]; cycle[keyOf(free[0]!)] = [edge(free[0]!, 0)]
            const wide = star()
            while (wide[keyOf(start)]!.length + roots.length + 1 < 1024) wide[keyOf(start)]!.push(edge(free[0]!, wide[keyOf(start)]!.length))
            const excessive = { ...wide, [keyOf(start)]: [...wide[keyOf(start)]!, edge(free[0]!, 2000)] }
            assert.equal(arithmetic(star()).outcome, 'complete')
            assert.ok(Object.values(star()).filter(list => list.length === 0).length === nodes.length - 1)
            assert.ok(arithmetic(duplicate).dominated > 0)
            assert.equal(arithmetic(depth16).outcome, 'complete'); assert.equal(arithmetic(depth16).deepest, 16); assert.ok(arithmetic(depth16).laterDeeper > 0)
            assert.equal(arithmetic(depth17).outcome, 'depth'); assert.equal(arithmetic(depth17).deepest, 17)
            assert.equal(arithmetic(cycle).outcome, 'cycle'); assert.equal(arithmetic(cycle).cycleDominated, true)
            assert.equal(wide[keyOf(start)]!.length + roots.length + 1, 1024); assert.ok(arithmetic(wide).maxPending >= 900)
            assert.equal(excessive[keyOf(start)]!.length + roots.length + 1, 1025)
            const invalidVersion = { ...edge(free[0]!, 0), pin: { ...edge(free[0]!, 0).pin, version: 'not-a-bigint' } }
            const missingTarget = { ...edge(free[0]!, 1), pin: { ...edge(free[0]!, 1).pin, id: 'r9-missing-target' } }
            const withFirst = (...entries: Edge[]): Inspection => ({ ...star(), [keyOf(start)]: [...entries, ...star()[keyOf(start)]!] })
            const missingInspection = star(), missingKey = keyOf(nodes[0]!)
            delete missingInspection[missingKey]; missingInspection['r9-unused-inspection-key'] = []
            const spelling = withFirst({ ...edge(free[0]!, 0), pin: { ...edge(free[0]!, 0).pin, version: `0${free[0]!.version}` } })
            const cases: { name: string; inspection: Inspection; sqlstate: string | null; message: string | null; nullFirstKey?: boolean }[] = [
              { name: 'reachable empty adjacency', inspection: star(), sqlstate: null, message: null },
              { name: 'ordered duplicate edges retained', inspection: duplicate, sqlstate: null, message: null },
              { name: 'later deeper shared path accepts exact depth16', inspection: depth16, sqlstate: null, message: null },
              { name: 'later deeper shared path refuses depth17', inspection: depth17, sqlstate: 'P0001', message: 'bound_exceeded' },
              { name: 'cycle before an already dominating visit', inspection: cycle, sqlstate: 'P0001', message: 'cycle' },
              { name: 'wide pending FIFO and duplicate edges total1024', inspection: wide, sqlstate: null, message: null },
              { name: 'duplicate edges total1025 refuse', inspection: excessive, sqlstate: 'P0001', message: 'bound_exceeded' },
              { name: 'edge order: invalid bigint before missing target', inspection: withFirst(invalidVersion, missingTarget), sqlstate: '22P02', message: 'invalid input syntax for type bigint: "not-a-bigint"' },
              { name: 'edge order: missing target before invalid bigint', inspection: withFirst(missingTarget, invalidVersion), sqlstate: 'P0001', message: 'dependency_missing' },
              { name: 'NULL expected type refuses', inspection: withFirst({ ...edge(free[0]!, 0), expected_type: null }), sqlstate: 'P0001', message: 'dependency_missing' },
              { name: 'missing inspected key at unchanged cardinality', inspection: missingInspection, sqlstate: 'P0001', message: 'semantic_mismatch' },
              { name: 'NULL artifact key precedes missing inspection', inspection: actualInspection, sqlstate: '22023', message: 'argument 1: key must not be null', nullFirstKey: true },
              { name: 'bigint-equal version spelling preserves original target key', inspection: spelling, sqlstate: 'P0001', message: 'unsolicited_artifact' },
              { name: 'NULL edge version refuses', inspection: withFirst({ ...edge(free[0]!, 0), pin: { ...edge(free[0]!, 0).pin, version: null } }), sqlstate: 'P0001', message: 'dependency_missing' },
            ]
            assert.equal(cases.length, 14)
            // The shared driver intentionally redacts error messages. Inspect
            // them inside owner-only anonymous SQL blocks instead of adding
            // a function/grant or weakening that driver. An expected P0001 must
            // also be the exact depth/cycle/refusal message, never an early
            // input error that happens to share the SQLSTATE. quote_literal is
            // performed by PostgreSQL; no case value becomes unquoted SQL.
            // One finite case pair per statement keeps the existing 25-second
            // statement bound. Every case derives its complete stored input
            // before both calls; all of this remains inside the 1200s Parent.
            for (const [index, fixture] of cases.entries()) {
              const quoted = (await connection.query('SELECT quote_literal($1::text) AS fixture,quote_literal($2::text) AS fingerprint,quote_literal($3::text) AS profile',
                [pgText(JSON.stringify(fixture)), pgText(fingerprint), pgText(initial.envelope.profile)]))[0]!
              assert.ok(quoted.fixture && quoted.fingerprint && quoted.profile)
              const block = `DECLARE original_ official_provenance_api.artifact_input_v1[]; input_ official_provenance_api.artifact_input_v1[];
              receipt_ bytea; binding_ bytea; fixture_ jsonb:=${quoted.fixture}::jsonb; implementation_ text; state_ text; message_ text; checked_ integer:=0;
              BEGIN
               SELECT c.artifacts INTO STRICT original_ FROM official_provenance_private.inspected_closure_v2(${quoted.fingerprint}) c;
               SELECT r.canonical_payload_bytes,bb.canonical_bytes INTO STRICT receipt_,binding_ FROM official_provenance_private.receipts r
                JOIN official_provenance_private.custody_bindings cb USING(record_fingerprint)
                JOIN official_provenance_private.artifact_blobs bb ON bb.digest=cb.binding_digest WHERE r.record_fingerprint=${quoted.fingerprint};
                input_:=original_;
                IF fixture_->>'nullFirstKey'='true' THEN
                 SELECT ARRAY(SELECT ROW(CASE WHEN a.ordinality=1 THEN NULL::text ELSE a.artifact_id END,
                  a.artifact_version,a.digest,a.artifact_type,a.byte_contract_family,a.artifact_contract_version,a.canonical_bytes)::official_provenance_api.artifact_input_v1
                  FROM unnest(original_) WITH ORDINALITY a ORDER BY a.ordinality) INTO input_;
                END IF;
                FOREACH implementation_ IN ARRAY ARRAY['r8_reference','current'] LOOP
                 state_:=NULL; message_:=NULL;
                 BEGIN
                  IF implementation_='r8_reference' THEN
                   PERFORM official_refresh_graph_reference_r9.validate_inspected_graph_v2(${quoted.profile},${quoted.fingerprint},receipt_,binding_,input_,fixture_->'inspection');
                  ELSE
                   PERFORM official_provenance_private.validate_inspected_graph_v2(${quoted.profile},${quoted.fingerprint},receipt_,binding_,input_,fixture_->'inspection');
                  END IF;
                 EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS state_=RETURNED_SQLSTATE,message_=MESSAGE_TEXT;
                 END;
                 IF state_ IS DISTINCT FROM (fixture_->>'sqlstate') OR message_ IS DISTINCT FROM (fixture_->>'message') THEN
                  RAISE EXCEPTION 'r9_exact_worker_outcome_mismatch' USING ERRCODE='P79${String(index + 1).padStart(2, '0')}';
                 END IF;
                 checked_:=checked_+1;
                END LOOP;
               IF checked_<>2 THEN RAISE EXCEPTION 'r9_case_count_mismatch' USING ERRCODE='P7999'; END IF;
              END`
              assert.equal(block.includes('$r9_graph_cases$'), false)
              await connection.query(`DO $r9_graph_cases$ ${block} $r9_graph_cases$`)
              // Completion proves both actual invocations matched both fields
              // (or genuinely succeeded for the four structural positives).
              note('R9 structural graph-worker equivalence; no canonical acceptance claim', {
                case: fixture.name, sqlstate: fixture.sqlstate, message: fixture.message, implementationsCheckedInSql: 2,
              })
            }
          }
          assert.deepEqual(await snapshot(connection), baseline)
        } catch (error) { failed = true; failure = error }
        finally {
          const cleanupErrors: unknown[] = []
          const cleanup = async (operation: () => unknown) => { try { await operation() } catch (error) { cleanupErrors.push(error) } }
          await cleanup(async () => {
            await connection.query('ROLLBACK')
            assert.ok(profile && tracking)
            assert.deepEqual(await executionSettings(connection.query.bind(connection)), profile)
            assert.equal((await connection.query("SELECT current_setting('track_functions') AS setting"))[0]?.setting, tracking)
          })
          await cleanup(() => close(connection)); if (pid) await cleanup(() => gone([pid!]))
          await cleanup(async () => { assert.deepEqual(await snapshot(owner), baseline); await locksReleased() })
          if (cleanupErrors.length) throw new AggregateError(failed ? [failure, ...cleanupErrors] : cleanupErrors, 'graph_comparison_cleanup_failed')
        }
        if (failed) throw failure
        note('R9 worker comparison restored settings, full stored state and owned backend departure', { mode })
      }
      const publicationProbe = async (next: PreparedOriginals) => {
        const before = await snapshot(owner), writer = await connect('ot_original_test_writer')
        const pid = (await writer.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
        try {
          await writer.query('BEGIN ISOLATION LEVEL READ COMMITTED')
          assert.equal(await publishIntegratedBundle(writer, oids, next.envelope), 'inserted')
          assert.equal(await publishIntegratedBundle(writer, oids, next.envelope, 'verify_existing'), 'idempotent')
        } finally {
          try { await writer.query('ROLLBACK') } finally { close(writer) }
        }
        await gone([pid]); await locksReleased()
        assert.deepEqual(await snapshot(owner), before, 'compatibility probe must leave every stored row unchanged')
        note('actual new graph coexisted with stored predecessor; full publisher verification; probe transaction rolled back')
      }
      const observed = async (operation: () => Promise<AtomicRefreshResult>, options: { commitLoss?: boolean; failReader?: boolean; afterAckDelay?: 'cleanup' | 'reader' } = {}) => {
        const realConnect = LocalPgConnection.connect, realFetch = globalThis.fetch
        const records: { role: string; pid: string; closed: boolean; committed: boolean; profileRestored: boolean; queries: { phase: string; ms: number; code: string | null }[] }[] = []
        let insideBoundedCommit = false, boundedDeadline = 0, commitLossReached = false, readerFailureReached = false, delayReached = false, postCommitOriginals = 0
        let hookAssertion: unknown
        const afterActualBound = async () => { while (performance.now() <= boundedDeadline + 10) await delay(Math.min(50, Math.max(1, boundedDeadline + 11 - performance.now()))) }
        const restoreConnect = lifetime.patchConnect(async (...args: Parameters<typeof realConnect>) => {
          const c = await realConnect.call(LocalPgConnection, ...args)
          const commitControl = insideBoundedCommit && (args[1] === undefined || args[1] === cluster.user)
          if (!commitControl && ![ATOMIC_REFRESH_LOGIN, 'ot_original_test_reader'].includes(args[1] ?? '')) return c
          let pid: string
          try { pid = (await c.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid! }
          catch (error) { c.close(); throw error }
          const record = { role: args[1] ?? cluster.user, pid, closed: false, committed: false, profileRestored: false, queries: [] as { phase: string; ms: number; code: string | null }[] }; records.push(record)
          const actualQuery = c.query.bind(c), actualClose = c.close.bind(c)
          const actualCommit = c.commitBefore.bind(c)
          c.close = () => { record.closed = true; actualClose() }
          if (args[1] === 'ot_original_test_reader') {
            try { await gone(records.filter(r => r.role === ATOMIC_REFRESH_LOGIN && r.committed).map(r => r.pid)) }
            catch (error) { hookAssertion = error; c.close(); throw error }
            if (options.failReader && records.some(r => r.committed)) { readerFailureReached = true; c.close(); throw Error('native_readback_failure_after_real_commit') }
          }
          if (args[1] === ATOMIC_REFRESH_LOGIN) {
            c.commitBefore = async (deadline, cutoff) => {
              const start = performance.now(); boundedDeadline = deadline; insideBoundedCommit = true
              let errorCode: string | null = null
              try {
                const outcome = await actualCommit(deadline, cutoff)
                record.committed = outcome.acknowledged
                if (options.commitLoss && outcome.acknowledged) { commitLossReached = true; throw new LocalPgError('08006') }
                return outcome
              } catch (error) { errorCode = error instanceof LocalPgError ? error.code : 'test_or_transport'; throw error }
              finally { insideBoundedCommit = false; record.queries.push({ phase: 'bounded_commit', ms: Math.round(performance.now() - start), code: errorCode }) }
            }
          }
          c.query = async (sql: string, params: readonly PgParameter[] = []) => {
            const start = performance.now(), phase = sql.includes('refresh_version_v1(') ? 'refresh' : sql === 'COMMIT' ? 'commit' : sql.includes('read_projection_candidate(') ? 'originals' : sql.includes('lookup_current_version(') ? 'lookup' : 'other'
            let errorCode: string | null = null
            try {
              const beforeProfile = phase === 'refresh' ? await executionSettings(actualQuery) : undefined
              const rows = await actualQuery(sql, params)
              if (beforeProfile) {
                try { assert.deepEqual(await executionSettings(actualQuery), beforeProfile); record.profileRestored = true }
                catch (error) { hookAssertion = error; throw error }
              }
              if (commitControl && sql.includes('pg_cancel_backend') && options.afterAckDelay === 'cleanup' && !delayReached) {
                try { assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_original_private.refresh_transitions_v1'))[0]?.n, '1') }
                catch (error) { hookAssertion = error; throw error }
                delayReached = true; await afterActualBound()
              }
              if (args[1] === 'ot_original_test_reader' && records.some(r => r.committed) && sql.includes('read_projection_candidate(')
                && ++postCommitOriginals === 2 && options.afterAckDelay === 'reader') {
                delayReached = true; await afterActualBound()
              }
              return rows
            } catch (error) { errorCode = error instanceof LocalPgError ? error.code : 'test_or_transport'; throw error }
            finally { record.queries.push({ phase, ms: Math.round(performance.now() - start), code: errorCode }) }
          }
          return c
        })
        globalThis.fetch = async () => { throw Error('unexpected_refresh_network') }
        const restoreFetch = lifetime.restore(() => { globalThis.fetch = realFetch })
        let result: AtomicRefreshResult
        try { result = await lifetime.run(operation) } finally { restoreFetch(); restoreConnect() }
        if (hookAssertion) throw hookAssertion
        if (options.commitLoss) assert.equal(commitLossReached, true)
        if (options.failReader) assert.equal(readerFailureReached, true)
        if (options.afterAckDelay) assert.equal(delayReached, true)
        await gone(records.map(r => r.pid)); await locksReleased()
        if (result.status === 'synthetic_atomic_refresh_verified') {
          assert.equal(records.filter(r => r.role === 'ot_original_test_reader').length, 4)
          assert.equal(records.filter(r => r.role === ATOMIC_REFRESH_LOGIN && r.committed).length, 1)
          assert.ok(records.filter(r => r.role === ATOMIC_REFRESH_LOGIN && r.committed).every(r => r.profileRestored))
          assert.equal(new Set(records.map(r => r.pid)).size, records.length)
          assert.ok(records.every(r => r.closed))
          note('verified atomic refresh native phase timings', { sql: result.sqlPhaseMs })
        }
        const encoded = JSON.stringify(result)
        assert.equal(encoded.includes(key), false)
        assert.doesNotMatch(encoded, /"(?:sourceSnapshot|original_bytes|canonicalBytes|bundleBase64|custodyBindingBytes|seal|token)":/)
        for (const body of initial.bodies) {
          assert.equal(encoded.includes(JSON.stringify(Buffer.from(body).toString('utf8')).slice(1, -1)), false)
          assert.equal(encoded.includes(Buffer.from(body).toString('base64')), false)
        }
        note('observed owned coordinator', { status: result.status, reason: 'reason' in result ? result.reason : null,
          backends: records.map(r => ({ role: r.role, closed: r.closed, acknowledged: r.committed, profileRestored: r.profileRestored, queries: r.queries.filter(q => q.phase !== 'other') })) })
        return result
      }
      const negative = async (name: string, req: AtomicRefreshRequest, setup?: () => Promise<void>, expectedCode?: string) => {
        await align(); const before = await snapshot(owner)
        const beforeProfile = await executionSettings(owner.query.bind(owner))
        await owner.query('BEGIN ISOLATION LEVEL READ COMMITTED')
        let caught: unknown
        try {
          await setup?.(); const provisionalBaseline = await snapshot(owner)
          await owner.query(`SAVEPOINT failed_refresh; SET LOCAL ROLE ${ATOMIC_REFRESH_ROLE}`)
          const started = performance.now()
          try { await directlyCallRefresh(owner, oids, req, key) } catch (error) { caught = error }
          finally { note('actual negative refresh statement returned', { case: name, statementMs: Math.round(performance.now() - started),
            sqlstate: caught instanceof LocalPgError ? caught.code : caught ? 'test_or_transport' : null }) }
          assert.ok(caught instanceof LocalPgError, `${name} must fail through the actual narrow SQL grant`)
          if (expectedCode) assert.equal(caught.code, expectedCode)
          await owner.query('ROLLBACK TO SAVEPOINT failed_refresh')
          assert.deepEqual(await snapshot(owner), provisionalBaseline, `${name}: complete provisional publication/original/event/audit rollback`)
        } finally {
          await owner.query('ROLLBACK')
          assert.deepEqual(await executionSettings(owner.query.bind(owner)), beforeProfile)
        }
        assert.deepEqual(await snapshot(owner), before); await locksReleased()
        note('negative direct SQL with complete rollback', { case: name, sqlstate: (caught as LocalPgError).code })
      }
      return { cluster, owner, key, connect, close, gone, oids, reviewer, lifecycle, initialReview, align, review, seed, request, observed, negative, locksReleased, publicationProbe, compareJit, compareReference, compareGraphWorker,
        get witness() { return witness }, set witness(value: Cursor) { witness = value },
        stop() { lifetime.stopCluster(cluster) } }
    } catch (error) { lifetime.stopCluster(cluster); throw error }
  }

  // Closed input and direct-role adversarial proof, real two fault phases,
  // same-content primary transition, duplicates and package-only removal.
  const h = await openHarness(primary[0]!)
  try {
    await h.publicationProbe(primary[1]!)
    const req = await h.request(primary[1]!, 'primary')
    const installed = await h.owner.query(`SELECT p.prosecdef::text AS definer,(p.proowner=o.proowner)::text AS owner,
      (p.proconfig = ARRAY['search_path=""','TimeZone=UTC','jit=off'])::text AS config FROM pg_proc p JOIN pg_proc o
      ON o.oid='official_original_api.read_candidate(text,text,bigint,text)'::regprocedure WHERE p.oid=$1::regprocedure`, [pgText(signature)])
    assert.deepEqual(installed, [{ definer: 'true', owner: 'true', config: 'true' }])
    await h.compareJit()
    await h.compareReference('primary')
    await h.compareGraphWorker('primary')
    assert.deepEqual(await h.owner.query(`SELECT rolsuper::text,rolbypassrls::text,rolcanlogin::text,rolinherit::text FROM pg_roles WHERE rolname='${ATOMIC_REFRESH_ROLE}'`),
      [{ rolsuper: 'false', rolbypassrls: 'false', rolcanlogin: 'false', rolinherit: 'false' }])
    assert.deepEqual(await h.owner.query(`SELECT r.rolname FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid WHERE m.member='${ATOMIC_REFRESH_LOGIN}'::regrole ORDER BY r.rolname`), [{ rolname: ATOMIC_REFRESH_ROLE }])
    for (const role of [ATOMIC_REFRESH_ROLE, ATOMIC_REFRESH_LOGIN]) {
      for (const forbidden of ['ot_original_producer', 'ot_original_reviewer', 'ot_original_lifecycle', 'ot_provenance_writer'])
        assert.equal((await h.owner.query('SELECT pg_has_role($1::name,$2::name,\'MEMBER\')::text AS member', [pgText(role), pgText(forbidden)]))[0]?.member, 'false')
    }
    for (const role of ['anon', 'authenticated', 'service_role', 'ot_original_producer', 'ot_original_reviewer', 'ot_original_reader', 'ot_original_lifecycle', 'ot_provenance_writer']) {
      assert.equal((await h.owner.query('SELECT has_function_privilege($1::name,$2::text,\'EXECUTE\')::text AS allowed', [pgText(role), pgText(signature)]))[0]?.allowed, 'false')
    }
    const narrow = await h.connect(ATOMIC_REFRESH_LOGIN)
    for (const sql of [
      'SELECT * FROM official_original_private.refresh_transitions_v1',
      'SELECT official_original_api.lifecycle(\'superseded\',\'caller\',1,\'caller\')',
      'SELECT official_original_api.review(\'caller\',\'caller\',\'[]\'::jsonb)',
      'SELECT official_original_api.bind_candidate(\'caller\',NULL,ARRAY[]::bytea[],\'caller\',1,\'caller\',\'create_or_verify\')',
      'SELECT official_provenance_api.publish_local_integrated_v2(\'caller\',2::smallint,\'caller\',\'caller\',NULL,NULL,NULL)',
      'SELECT official_original_api.checkpoint(1,\'caller\')',
    ]) await assert.rejects(narrow.query(sql), code('42501'))
    h.close(narrow)
    const beforeReapply = await snapshot(h.owner)
    await assert.rejects(h.owner.query(packageSql), code('42723')); await h.owner.query('ROLLBACK')
    assert.deepEqual(await snapshot(h.owner), beforeReapply)
    await h.negative('wrong separate review', { ...req, reviewId: h.initialReview }, undefined, 'P0002')
    await h.negative('missing review', { ...req, reviewId: '00000000-0000-0000-0000-000000000000' }, undefined, 'P0002')
    await h.negative('wrong selected fictional mode', { ...req, mode: 'composed' }, undefined, '22023')
    const changedBody = primary[1]!.bodies.map(b => Uint8Array.from(b)); changedBody[0]![0] = 32
    await h.negative('unsupported or changed exact source bytes', { ...req, bodies: changedBody }, undefined, '23514')
    const forged = originalsFor(contradictingFactFixture(primary[1]!.envelope)), forgedRequest = await h.request(forged, 'primary')
    assert.ok(verifyLocalIntegratedPilotBundle(forged.envelope).ok)
    await h.negative('fully rehashed false canonical fact', forgedRequest, undefined, '23514')
    const wrongNewValidity = originalsFor(falseValidityLocator(primary[1]!.envelope))
    await h.negative('closure-consistent New qualified locator mismatch', await h.request(wrongNewValidity, 'primary'), undefined, '23514')
    const reused = originalsFor(alternateSameIdentityReceipt(primary[0]!.envelope))
    await h.negative('reused source versions and observation times', await h.request(reused, 'primary'), undefined, '23514')
    for (const [name, mutate] of [
      ['changed scope', (p: Record<string, unknown>) => { (p.globalCell as { scope: { destinationCountryCode: string } }).scope.destinationCountryCode = 'DE' }],
      ['changed source identity', (p: Record<string, unknown>) => { (p.supports as { binding: { sourceId: string } }[])[0]!.binding.sourceId = 'untrusted-source' }],
    ] as const) await h.negative(name, { ...req, envelope: corruptReceipt(req.envelope, mutate) })
    await h.negative('after actual bind before actual supersede', req, async () => {
      await h.owner.query(`CREATE FUNCTION public.refresh_fault_before() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        IF NEW.kind='superseded' THEN
          IF current_setting('jit')='off'
           AND EXISTS(SELECT 1 FROM official_original_private.rule_bindings WHERE fingerprint='${req.envelope.bundle.recordFingerprint}')
           AND EXISTS(SELECT 1 FROM official_original_private.events WHERE kind='accepted' AND target='${req.envelope.bundle.recordFingerprint}')
           AND NOT EXISTS(SELECT 1 FROM official_original_private.events WHERE kind='superseded' AND target='${req.expectedPredecessor}')
          THEN RAISE EXCEPTION 'actual_bound_before_supersede' USING ERRCODE='P7701'; ELSE RAISE EXCEPTION 'fault_phase_wrong' USING ERRCODE='P7799'; END IF;
        END IF; RETURN NEW; END $$;
        CREATE TRIGGER refresh_fault_before BEFORE INSERT ON official_original_private.events FOR EACH ROW EXECUTE FUNCTION public.refresh_fault_before();`)
    }, 'P7701')
    await h.negative('after actual supersede before COMMIT', req, async () => {
      await h.owner.query(`CREATE FUNCTION public.refresh_fault_after() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        IF current_setting('jit')='off'
         AND EXISTS(SELECT 1 FROM official_original_private.events WHERE kind='superseded' AND target=NEW.predecessor AND sequence=NEW.after_sequence)
         AND EXISTS(SELECT 1 FROM official_original_private.events WHERE kind='accepted' AND target=NEW.successor AND sequence=NEW.accepted_sequence)
        THEN RAISE EXCEPTION 'actual_superseded_before_commit' USING ERRCODE='P7702'; ELSE RAISE EXCEPTION 'fault_phase_wrong' USING ERRCODE='P7799'; END IF;
        RETURN NEW; END $$;
        CREATE TRIGGER refresh_fault_after AFTER INSERT ON official_original_private.refresh_transitions_v1 FOR EACH ROW EXECUTE FUNCTION public.refresh_fault_after();`)
    }, 'P7702')
    for (const kind of ['source_withdrawn', 'profile_withdrawn', 'withdrawn', 'conflicted', 'superseded']) {
      const adjusted = { ...req }
      await h.negative(kind, adjusted, async () => {
        const target = kind === 'source_withdrawn' ? 'synthetic-pilot-authority' : kind === 'profile_withdrawn' ? 'synthetic-pilot-whole-response:1' : req.expectedPredecessor
        await h.owner.query('SELECT official_original_api.lifecycle($1::text,$2::text,$3::bigint,$4::text)', [pgText(kind), pgText(target), pgText(req.witness.sequence, 20), pgText(req.witness.eventHash)])
        adjusted.witness = await cursor(h.owner)
      }, '55000')
    }
    for (const field of ['freshness_until', 'expires_at']) await h.negative(`already ${field === 'freshness_until' ? 'stale' : 'expired'} predecessor`, req, async () => {
      await h.owner.query(`ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows;
        UPDATE official_original_private.originals SET ${field}=clock_timestamp()-interval '1 millisecond';
        ALTER TABLE official_original_private.originals ENABLE TRIGGER immutable_rows;`)
    }, '55000')
    const disposedRequest = { ...req }
    await h.negative('actually expired and cryptographically disposed originals', disposedRequest, async () => {
      await h.owner.query(`ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows;
        UPDATE official_original_private.originals SET expires_at=clock_timestamp()-interval '1 millisecond';
        ALTER TABLE official_original_private.originals ENABLE TRIGGER immutable_rows;`)
      await h.owner.query('SELECT official_original_api.expire($1::bigint,$2::text)', [pgText(req.witness.sequence, 20), pgText(req.witness.eventHash)])
      disposedRequest.witness = await cursor(h.owner)
      assert.equal((await h.owner.query('SELECT count(*)::text AS n FROM official_original_private.ciphertexts'))[0]?.n, '0')
    }, '55000')
    await h.negative('damaged accepted corpus', req, async () => {
      await h.owner.query('ALTER TABLE official_original_private.supports DISABLE TRIGGER immutable_rows; DELETE FROM official_original_private.supports; ALTER TABLE official_original_private.supports ENABLE TRIGGER immutable_rows;')
    }, '55000')
    // Each real accepted baseline has its own acknowledged transaction. The
    // publisher's final SET CONSTRAINTS IMMEDIATE must not leak from fixture
    // setup into the separate refresh transaction under test.
    const ambiguous = await openHarness(primary[0]!)
    try {
      await ambiguous.seed(primary[1]!)
      const ambiguousRequest = await ambiguous.request(primary[2]!, 'primary')
      const reader = await ambiguous.connect('ot_original_test_reader')
      const pid = (await reader.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
      try {
        await reader.query('BEGIN ISOLATION LEVEL READ COMMITTED')
        const selection = await selectCurrentVersion(reader, persistedCanonicalReadContract('primary').request, ambiguousRequest.witness)
        assert.equal(selection.status, 'ambiguous')
        if (selection.status !== 'ambiguous') throw Error('actual_ambiguous_baseline_missing')
        assert.equal(selection.matchCount, 2); assert.equal(selection.acceptedCount, 2)
        assert.deepEqual(selection.witness, ambiguousRequest.witness)
        await reader.query('COMMIT')
      } finally { ambiguous.close(reader) }
      await ambiguous.gone([pid])
      note('independent lookup proves two separately committed accepted versions and actual full-corpus ambiguity')
      await ambiguous.negative('full-corpus ambiguity', ambiguousRequest, undefined, '55000')
    } finally { ambiguous.stop() }
    await h.align()
    const baseline = await snapshot(h.owner)
    const oldMaterial = () => h.owner.query(`SELECT s.position::text,md5(to_jsonb(s)::text) AS support,md5(to_jsonb(o)::text) AS original,
      md5(to_jsonb(c)::text) AS cipher,md5(to_jsonb(b)::text) AS binding,md5(to_jsonb(r)::text) AS review
      FROM official_original_private.supports s JOIN official_original_private.originals o USING(original_pin,evidence_version)
      JOIN official_original_private.ciphertexts c USING(original_pin) JOIN official_original_private.rule_bindings b USING(fingerprint)
      JOIN official_original_private.reviews r ON r.review_id=b.review_id WHERE s.fingerprint=$1::text ORDER BY s.position`, [pgText(req.expectedPredecessor)])
    const retainedOld = await oldMaterial()
    nonpositive(await h.observed(() => refreshPersistedCanonicalVersion(h.cluster, forgedRequest, h.key)))
    assert.deepEqual(await snapshot(h.owner), baseline)
    // A separate operation receives fresh outer fixture authority. Nothing is
    // renewed during either coordinator call; event witness and sources stay put.
    await h.align()
    // Own ALL material before first await, including Buffer/TypedArray aliases.
    const aliased = prepareOriginals(primary[1]!.envelope, primary[1]!.bodies)
    const copiedRequest = { ...req, envelope: aliased.envelope, bodies: aliased.bodies }
    const owned = ownAtomicRefreshRequest(copiedRequest)
    assert.notEqual(owned.prepared.bodies[0]!.buffer, aliased.bodies[0]!.buffer)
    const result = positive(await h.observed(async () => {
      const pending = refreshPersistedCanonicalVersion(h.cluster, copiedRequest, h.key)
      aliased.bodies[0]!.fill(0); aliased.envelope.bundle.receiptBytes.fill(0); aliased.envelope.bundle.custodyBindingBytes.fill(0)
      for (const a of aliased.envelope.bundle.artifacts) a.canonicalBytes.fill(0)
      return pending
    }), req)
    h.witness = result.witness
    assert.deepEqual(await oldMaterial(), retainedOld, 'old exact support/original/ciphertext/binding/review bytes remain immutable')
    const actual = await h.owner.query('SELECT predecessor,successor,before_sequence::text,after_sequence::text FROM official_original_private.refresh_transitions_v1')
    assert.deepEqual(actual, [{ predecessor: req.expectedPredecessor, successor: req.envelope.bundle.recordFingerprint, before_sequence: req.witness.sequence, after_sequence: result.witness.sequence }])
    const oldRowsBefore = baseline.filter(row => row.relation === 'official_original_private.ciphertexts' || row.relation === 'official_original_private.originals')
    assert.ok(oldRowsBefore.every(row => Number(row.n) === 1))
    assert.equal((await h.owner.query('SELECT count(*)::text AS n FROM official_original_private.originals'))[0]?.n, '2')
    await h.owner.query('BEGIN')
    try { await assert.rejects(h.owner.query('SELECT * FROM official_original_api.read_candidate($1::text,$2::text,$3::bigint,$4::text)',
      [pgText(req.expectedPredecessor), pgText(h.key), pgText(result.witness.sequence, 20), pgText(result.witness.eventHash)]), code('55000')) } finally { await h.owner.query('ROLLBACK') }
    await h.negative('duplicate under stale external witness', req, undefined, '55000')
    await h.negative('duplicate under fresh witness safely refuses', { ...req, witness: result.witness }, undefined, '55000')
    const history = await h.owner.query('SELECT sequence::text,prior_hash,event_hash,kind,target,occurred_at::text FROM official_original_private.events ORDER BY sequence')
    const originalObjects = await h.owner.query(`SELECT p.oid::text AS oid,md5(pg_get_functiondef(p.oid)||p.proowner::text||COALESCE(p.proacl::text,'')) AS digest
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname LIKE 'official_%' AND p.oid<>$1::regprocedure ORDER BY p.oid`, [pgText(signature)])
    await assert.rejects(h.owner.query('UPDATE official_original_private.refresh_transitions_v1 SET mode=mode'), code('55000'))
    await assert.rejects(h.owner.query('DELETE FROM official_original_private.refresh_transitions_v1'), code('55000'))
    await assert.rejects(h.owner.query('TRUNCATE official_original_private.refresh_transitions_v1'), code('55000'))
    const survivingState = await snapshot(h.owner, false)
    await h.owner.query(`REVOKE ${ATOMIC_REFRESH_ROLE} FROM ${ATOMIC_REFRESH_LOGIN}`)
    await h.owner.query(rollbackSql)
    assert.deepEqual(await snapshot(h.owner, false), survivingState, 'package rollback preserves all original store rows byte-for-byte')
    assert.equal((await h.owner.query('SELECT to_regprocedure($1::text)::text AS fn', [pgText(signature)]))[0]?.fn, null)
    assert.deepEqual(await h.owner.query(`SELECT p.oid::text AS oid,md5(pg_get_functiondef(p.oid)||p.proowner::text||COALESCE(p.proacl::text,'')) AS digest
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname LIKE 'official_%' ORDER BY p.oid`), originalObjects)
    assert.deepEqual(await h.owner.query('SELECT sequence::text,prior_hash,event_hash,kind,target,occurred_at::text FROM official_original_private.events ORDER BY sequence'), history)
    await h.align()
    const read = await readPersistedCanonicalRequirements(h.cluster, 'primary', h.key, h.witness)
    assert.equal(read.status, 'synthetic_persisted_requirements_verified')
    if (read.status === 'synthetic_persisted_requirements_verified') assert.equal(read.projection.recordFingerprint, req.envelope.bundle.recordFingerprint)
    note('primary, fault matrix, restricted direct calls, repeats and package rollback preserve original history')
  } finally { h.stop() }

  const c = await openHarness(composed[0]!)
  try {
    await c.publicationProbe(composed[1]!)
    await c.compareReference('composed')
    await c.compareGraphWorker('composed')
    const req = await c.request(composed[1]!, 'composed')
    await c.negative('composed reversed original support order', { ...req, bodies: [...req.bodies].reverse() })
    await c.negative('composed reversed receipt supports', { ...req, envelope: corruptReceipt(req.envelope, p => { (p.supports as unknown[]).reverse() }) })
    const previous = verifyLocalIntegratedPilotBundle(composed[0]!.envelope); assert.ok(previous.ok)
    await c.negative('composed mixed old/new support versions', { ...req, envelope: corruptReceipt(req.envelope, p => { (p.supports as unknown[])[0] = previous.value.receipt.payload.supports[0] }) })
    await c.align(); positive(await c.observed(() => refreshPersistedCanonicalVersion(c.cluster, req, c.key)), req)
    note('composed two actual fresh executions and sole successor readback')
  } finally { c.stop() }

  // These are explicitly corrupt historical fixtures, with every ancestor pin
  // recomputed through the unchanged existing test encoder. They never replace
  // either actually executed positive fixture or its observation timestamps.
  for (const corruption of ['old_validity_locator', 'extra_inactive_policy', 'old_false_fact'] as const) {
    const mode = corruption === 'extra_inactive_policy' ? 'composed' : 'primary'
    const old = originalsFor(corruption === 'old_validity_locator' ? falseValidityLocator(primary[0]!.envelope)
      : corruption === 'old_false_fact' ? contradictingFactFixture(primary[0]!.envelope) : extraInactivePolicy(composed[0]!.envelope))
    const next = corruption === 'extra_inactive_policy' ? originalsFor(extraInactivePolicy(composed[1]!.envelope)) : primary[1]!
    const bad = await openHarness(old)
    try {
      const req = await bad.request(next, mode)
      const read = await readPersistedCanonicalRequirements(bad.cluster, mode, bad.key, bad.witness)
      assert.notEqual(read.status, 'synthetic_persisted_requirements_verified')
      await bad.negative(`closure-consistent ${corruption}: narrow direct SQL refusal`, req, undefined, '23514')
      await bad.align(); const baseline = await snapshot(bad.owner)
      const refused = nonpositive(await bad.observed(() => refreshPersistedCanonicalVersion(bad.cluster, req, bad.key)))
      assert.equal(refused.commitStatus, 'not_attempted')
      assert.deepEqual(await snapshot(bad.owner), baseline)
      note('canonical Old preflight and direct SQL agree on corrupt historical closure', { case: corruption })
    } finally { bad.stop() }
  }

  // Real lock waits: expiry/abort/timeout first leave Old unchanged; then a real
  // completed reader holds SHARE while two minimal-role writers compete.
  const w = await openHarness(primary[0]!)
  try {
    const req = await w.request(primary[1]!, 'primary'), rival = await w.request(primary[2]!, 'primary')
    await w.owner.query(`CREATE TABLE public.refresh_commit_probe(id integer PRIMARY KEY);
      CREATE FUNCTION public.refresh_commit_pause() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        IF NEW.id=2 THEN PERFORM pg_sleep(10); ELSIF NEW.id=3 THEN PERFORM pg_sleep(3); END IF; RETURN NEW; END $$;
      CREATE CONSTRAINT TRIGGER refresh_commit_pause AFTER INSERT ON public.refresh_commit_probe
        DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.refresh_commit_pause();`)
    const databaseCutoff = async (ms: number) => {
      const anchor = performance.now()
      const row = (await w.owner.query(`SELECT to_char((clock_timestamp()+($1::double precision*interval '1 millisecond')) AT TIME ZONE 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cutoff`, [pgText(String(ms))]))[0]!
      assert.ok(row.cutoff); return { deadlineAt: anchor + ms, cutoff: row.cutoff }
    }
    // Actual guard arming is delayed across a real SQL cutoff. The independent
    // server guard expires while COMMIT is definitely still unsent.
    const unsent = await w.connect(), unsentPid = (await unsent.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
    await unsent.query('BEGIN; INSERT INTO public.refresh_commit_probe VALUES(1)')
    const armingBound = await databaseCutoff(1_200), connectBeforeArming = LocalPgConnection.connect
    let armingReached = false
    const guardConnections: LocalPgConnection[] = []
    const restoreArmingConnect = lifetime.patchConnect(async (...args: Parameters<typeof connectBeforeArming>) => {
      const connection = await connectBeforeArming.call(LocalPgConnection, ...args); guardConnections.push(connection)
      const query = connection.query.bind(connection)
      connection.query = async (sql: string, params: readonly PgParameter[] = []) => {
        const rows = await query(sql, params)
        if (!armingReached && sql.includes('SELECT state,wait_event') && rows[0]?.wait_event === 'PgSleep') {
          armingReached = true
          while (performance.now() <= armingBound.deadlineAt + 40) await delay(20)
        }
        return rows
      }
      return connection
    })
    try {
      const commit = await unsent.commitBefore(armingBound.deadlineAt, armingBound.cutoff)
      assert.equal(armingReached, true); assert.equal(commit.dispatched, false); assert.equal(commit.acknowledged, false)
      assert.equal(unsent.operationDiagnostics.at(-1)?.commitDispatched, false)
    } finally { restoreArmingConnect(); w.close(unsent); for (const connection of guardConnections) connection.close() }
    await w.gone([unsentPid])
    assert.equal((await w.owner.query('SELECT count(*)::text AS n FROM public.refresh_commit_probe'))[0]?.n, '0')
    note('actual cutoff during asynchronous arming; no COMMIT dispatch and no persisted probe')
    // A real deferred trigger runs inside COMMIT (where PG's statement timeout
    // is insufficient). The new independent guard must end it well before 20s.
    const deferred = await w.connect(), deferredPid = (await deferred.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
    await deferred.query('BEGIN; INSERT INTO public.refresh_commit_probe VALUES(2)')
    const deferredBound = await databaseCutoff(2_500), deferredStarted = performance.now()
    const deferredResult = lifetime.track(deferred.commitBefore(deferredBound.deadlineAt, deferredBound.cutoff))
    let deferredReached = false
    while (performance.now() - deferredStarted < 2_000) {
      deferredReached = (await w.owner.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid::text=$1::text AND query='COMMIT' AND wait_event='PgSleep'", [pgText(deferredPid)]))[0]?.n === '1'
      if (deferredReached) break; await delay(20)
    }
    const shortened: LocalPgBoundedCommit = await deferredResult
    assert.ok(Object.isFrozen(shortened))
    assert.equal(deferredReached, true); assert.equal(shortened.dispatched, true); assert.equal(shortened.acknowledged, false)
    assert.ok(performance.now() - deferredStarted < 8_000, 'actual server cutoff shortens the unchanged 20s guard')
    w.close(deferred); await w.gone([deferredPid])
    assert.equal((await w.owner.query('SELECT count(*)::text AS n FROM public.refresh_commit_probe'))[0]?.n, '0')
    note('actually running deferred COMMIT terminated by the shorter server guard', { deferredCommitElapsedMs: Math.round(performance.now() - deferredStarted) })
    // The raw database cutoff is much later. Delay the ACTUAL guard transport,
    // while leaving enough monotonic time to arm and dispatch COMMIT. With the
    // old relative-sleep implementation this three-second deferred work would
    // commit after our bound but before its late-started guard. Absolute DB
    // calibration must instead terminate it and leave no durable marker.
    const delayed = await w.connect(), delayedPid = (await delayed.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
    await delayed.query('BEGIN; INSERT INTO public.refresh_commit_probe VALUES(3)')
    const later = await databaseCutoff(20_000), earlierDeadline = performance.now() + 3_500
    const connectBeforeDelay = LocalPgConnection.connect, delayedGuards: LocalPgConnection[] = []
    let guardDelayMs = 0, guardArmed = false, guardTransportObserved = false
    let enteredAt: number | null = null, delayedOutcome: LocalPgBoundedCommit | undefined
    const restoreDelayedConnect = lifetime.patchConnect(async (...args: Parameters<typeof connectBeforeDelay>) => {
      const connection = await connectBeforeDelay.call(LocalPgConnection, ...args); delayedGuards.push(connection)
      const query = connection.query.bind(connection)
      connection.query = async (sql: string, params: readonly PgParameter[] = []) => {
        if (!guardTransportObserved && sql.includes('pg_terminate_backend(a.pid)::text AS terminated') && sql.includes('pg_sleep(')) {
          // Stay below the unchanged 50 x 20ms arming-poll budget, while still
          // making a restarted relative sleep observably later than our cutoff.
          guardTransportObserved = true
          const start = performance.now(); await delay(700); guardDelayMs = performance.now() - start
        }
        const rows = await query(sql, params)
        if (sql.includes('SELECT state,wait_event') && rows[0]?.wait_event === 'PgSleep') guardArmed = true
        return rows
      }
      return connection
    })
    try {
      const pending = lifetime.track(delayed.commitBefore(earlierDeadline, later.cutoff))
      const until = performance.now() + 3_500
      while (performance.now() < until) {
        const active = (await w.owner.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid::text=$1::text AND query='COMMIT' AND wait_event='PgSleep'", [pgText(delayedPid)]))[0]?.n === '1'
        if (active) { enteredAt = performance.now(); break }; await delay(20)
      }
      const result = await pending
      delayedOutcome = result
      assert.equal(guardArmed, true); assert.ok(enteredAt !== null && enteredAt < earlierDeadline)
      assert.ok(enteredAt + 3_000 > earlierDeadline + 100, 'actual deferred work would finish after the earlier monotonic bound')
      assert.ok(enteredAt + 3_000 < earlierDeadline + guardDelayMs - 100, 'that work would beat a guard which restarted its relative sleep')
      assert.equal(result.dispatched, true); assert.equal(result.acknowledged, false)
      assert.ok(performance.now() < earlierDeadline + 1_500, 'guard fires at calibrated absolute cutoff, not delayed relative sleep')
    } finally {
      note('delayed guard transport bounded evidence', {
        requestedGuardDelayMs: 700, guardDelayMs: Math.round(guardDelayMs), earlierBudgetMs: 3_500, deferredWorkMs: 3_000,
        observedHook: guardTransportObserved, guardArmed, commitObserved: enteredAt !== null,
        resultCode: delayedOutcome?.code ?? null, dispatched: delayedOutcome?.dispatched ?? null, acknowledged: delayedOutcome?.acknowledged ?? null,
        deferredAfterBoundMs: enteredAt === null ? null : Math.round(enteredAt + 3_000 - earlierDeadline),
        deferredBeforeRelativeRestartMs: enteredAt === null ? null : Math.round(earlierDeadline + guardDelayMs - enteredAt - 3_000),
      })
      restoreDelayedConnect(); w.close(delayed); for (const connection of delayedGuards) connection.close()
    }
    await w.gone([delayedPid])
    assert.equal((await w.owner.query('SELECT count(*)::text AS n FROM public.refresh_commit_probe'))[0]?.n, '0')
    await w.owner.query('DROP TABLE public.refresh_commit_probe RESTRICT; DROP FUNCTION public.refresh_commit_pause() RESTRICT')
    note('real delayed guard transport preserves earlier monotonic cutoff', { guardDelayMs: Math.round(guardDelayMs) })
    const blocked = async (kind: 'expiry' | 'abort' | 'timeout') => {
      await w.align()
      const beforeFixture = await snapshot(w.owner)
      const backendInventorySql = "SELECT pid::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE datname=current_database() AND backend_type='client backend' ORDER BY pid"
      const previousBackends = await w.owner.query(backendInventorySql)
      const ownerPid = (await w.owner.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
      let baseline: Awaited<ReturnType<typeof snapshot>> | undefined
      type Owned = { connection: LocalPgConnection; pid: string | null; closed: boolean }
      const owned: Owned[] = [], hooks: Promise<LocalPgConnection>[] = [], observations: Promise<unknown>[] = []
      const cancel = new AbortController(), realConnect = LocalPgConnection.connect
      let blocker: Owned | undefined, observer: Owned | undefined, writer: Owned | undefined
      let pending: Promise<AtomicRefreshResult> | undefined
      let armed = false, stopping = false, expiryChanged = false, outcomeAllowed = false, lockSeen = false
      let refreshSqlstate: string | null = null, failure: unknown, failed = false
      let failEarly!: (error: unknown) => void
      const early = new Promise<never>((_resolve, reject) => { failEarly = reject }); void early.catch(() => {})
      const closeOwned = (record: Owned) => { if (!record.closed) { record.closed = true; record.connection.close() } }
      const openOwned = async (...args: Parameters<typeof realConnect>) => {
        const connection = await realConnect.call(LocalPgConnection, ...args)
        // Record ownership before even the identity-query await can fail. The
        // coordinator does not own an intercepted connection until we return.
        const record: Owned = { connection, pid: null, closed: false }; owned.push(record)
        try {
          record.pid = (await connection.query('SELECT pg_backend_pid()::text AS pid'))[0]?.pid ?? null
          assert.match(record.pid ?? '', /^[1-9][0-9]*$/)
          return record
        } catch (error) { closeOwned(record); throw error }
      }
      let restoreBlockedConnect = () => {}
      const removeParentStop = lifetime.onStop(() => {
        stopping = true; cancel.abort(); failEarly(lifetime.signal.reason)
        for (const record of owned) closeOwned(record)
      })
      try {
        blocker = await openOwned(w.cluster); observer = await openOwned(w.cluster)
        assert.equal(new Set([ownerPid, blocker.pid, observer.pid]).size, 3)
        // Observation owns its backend BEFORE the asynchronous hook is active.
        // Only the hook uses owner; no poll can overlap its mutation/snapshot.
        const observe = (sql: string, parameters: readonly PgParameter[] = []) => {
          const query = observer!.connection.query(sql, parameters)
          observations.push(query); void query.catch(() => {})
          return Promise.race([query, early])
        }
        restoreBlockedConnect = lifetime.patchConnect((...args: Parameters<typeof realConnect>) => {
          const hook = (async () => {
            const record = await openOwned(...args)
            try {
              if (stopping) throw Error('blocked_hook_stopped')
              if (args[1] === ATOMIC_REFRESH_LOGIN && !armed) {
                armed = true; writer = record
                assert.equal(new Set([ownerPid, blocker!.pid, observer!.pid, writer.pid]).size, 4)
                const query = record.connection.query.bind(record.connection)
                record.connection.query = async (sql: string, parameters: readonly PgParameter[] = []) => {
                  try { return await query(sql, parameters) }
                  catch (error) {
                    if (sql.includes('refresh_version_v1(')) refreshSqlstate = error instanceof LocalPgError ? error.code : 'test_or_transport'
                    throw error
                  }
                }
                // The unchanged canonical Old preflight has completed. Only
                // this actual producer, not that reader, can wait on our head.
                if (kind === 'expiry') {
                  expiryChanged = true
                  await w.owner.query(`ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows;
                    UPDATE official_original_private.originals SET freshness_until=clock_timestamp()+interval '12 seconds';
                    ALTER TABLE official_original_private.originals ENABLE TRIGGER immutable_rows;`)
                }
                if (stopping) throw Error('blocked_hook_stopped')
                baseline = await snapshot(w.owner)
                if (stopping) throw Error('blocked_hook_stopped')
                await blocker!.connection.query('BEGIN')
                if (stopping) throw Error('blocked_hook_stopped')
                await blocker!.connection.query('SELECT singleton FROM official_original_private.head FOR UPDATE')
              }
              return record.connection
            } catch (error) { closeOwned(record); throw error }
          })()
          hooks.push(lifetime.track(hook)); void hook.catch(failEarly)
          return hook
        })
        pending = lifetime.track(refreshPersistedCanonicalVersion(w.cluster, req, w.key, cancel.signal).then(result => {
          if (!outcomeAllowed) failEarly(Error('blocked_coordinator_returned_before_expected_wait_outcome'))
          return result
        }, error => { failEarly(error); throw error }))
        void pending.catch(() => {})
        const until = performance.now() + 45_000
        while (performance.now() < until) {
          lockSeen = (await observe(`SELECT count(*)::text AS n FROM pg_stat_activity a
            WHERE a.pid::text=$1::text AND a.usename='${ATOMIC_REFRESH_LOGIN}' AND a.wait_event_type='Lock'
             AND $2::integer=ANY(pg_blocking_pids(a.pid)) AND position('refresh_version_v1(' IN a.query)>0`,
          [pgText(writer?.pid ?? ''), pgText(blocker.pid!, 23)]))[0]?.n === '1'
          if (lockSeen) break; await delay(20)
        }
        assert.equal(lockSeen, true, `${kind}: writer really waits on held head`)
        if (kind === 'abort') { outcomeAllowed = true; cancel.abort() }
        if (kind === 'expiry') {
          assert.equal((await observe('SELECT bool_and(clock_timestamp()<freshness_until)::text AS current FROM official_original_private.originals'))[0]?.current, 'true', 'predecessor is still usable after the wait actually begins')
          while ((await observe('SELECT bool_and(clock_timestamp()>=freshness_until)::text AS expired FROM official_original_private.originals'))[0]?.expired !== 'true') await delay(20)
          outcomeAllowed = true; await blocker.connection.query('ROLLBACK')
        }
        if (kind === 'timeout') outcomeAllowed = true
        const result = nonpositive(await Promise.race([pending, early]))
        assert.equal(result.commitStatus, 'not_attempted')
        if (kind === 'abort') assert.equal(result.reason, 'cancelled')
        if (kind === 'expiry') assert.equal(refreshSqlstate, '55000')
        if (kind === 'timeout') assert.equal(refreshSqlstate, '55P03')
        assert.notEqual(refreshSqlstate, 'connection_state')
        assert.ok(baseline)
      } catch (error) { failure = error; failed = true }
      finally {
        const cleanupErrors: unknown[] = []
        const cleanup = async (operation: () => unknown) => { try { await operation() } catch (error) { cleanupErrors.push(error) } }
        stopping = true; cancel.abort()
        // Close releases the held transaction without issuing ROLLBACK on a
        // blocker that a partially completed hook might still be using.
        for (const record of owned) await cleanup(() => closeOwned(record))
        restoreBlockedConnect(); removeParentStop()
        let coordinatorOutcomes: PromiseSettledResult<AtomicRefreshResult>[] = []
        await cleanup(async () => { coordinatorOutcomes = await lifetime.drain(pending ? [pending] : []) })
        const hookOutcomes: PromiseSettledResult<LocalPgConnection>[] = []
        for (let drained = 0; drained < hooks.length;) {
          const batch = hooks.slice(drained); drained += batch.length
          await cleanup(async () => { hookOutcomes.push(...await lifetime.drain(batch)) })
        }
        await cleanup(() => lifetime.drain(observations))
        // A connect that was already pending at cancellation can finish later;
        // openOwned tracked it before its first further await, and we drain it.
        for (const record of owned) await cleanup(() => closeOwned(record))
        await cleanup(() => w.gone(owned.flatMap(record => record.pid ? [record.pid] : [])))
        await cleanup(() => w.locksReleased())
        if (baseline) await cleanup(async () => assert.deepEqual(await snapshot(w.owner), baseline))
        if (expiryChanged) await cleanup(() => w.owner.query(`ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows;
          UPDATE official_original_private.originals SET freshness_until=captured_at+interval '30 days';
          ALTER TABLE official_original_private.originals ENABLE TRIGGER immutable_rows;`))
        await cleanup(async () => assert.deepEqual(await snapshot(w.owner), beforeFixture))
        // Even a failed initial PID probe must not leave an unrecorded new
        // backend: compare actual PID+birth against the pre-helper inventory.
        await cleanup(async () => {
          const after = await w.owner.query(backendInventorySql)
          assert.ok(after.every(row => previousBackends.some(before => row.pid === before.pid && row.birth === before.birth)))
        })
        note('blocked actors settled and owned backend cleanup inspected', { case: kind, lockSeen, refreshSqlstate,
          coordinatorSettled: coordinatorOutcomes.length === 1, hooksSettled: hookOutcomes.length,
          rejectedHooks: hookOutcomes.filter(outcome => outcome.status === 'rejected').length,
          ownedConnections: owned.length, recordedPids: owned.filter(record => record.pid !== null).length,
          cleanupFailures: cleanupErrors.length, primaryFailure: failed })
        if (cleanupErrors.length) throw new AggregateError(failed ? [failure, ...cleanupErrors] : cleanupErrors, 'blocked_cleanup_failed')
      }
      if (failed) throw failure
      note('actual lock-wait refusal with complete rollback and no leaked locks', { case: kind, refreshSqlstate })
    }
    await blocked('expiry'); await blocked('abort'); await blocked('timeout')
    await w.align()
    type RaceActor = 'old_reader' | 'first_writer' | 'second_writer'
    type WriterActor = Exclude<RaceActor, 'old_reader'>
    type ConnectionRecord = { connection: LocalPgConnection; pid: string; actor: RaceActor; role: string; dispatchedAt: number | null }
    const actors = new AsyncLocalStorage<RaceActor>(), raceAbort = new AbortController()
    const realConnect = LocalPgConnection.connect, connections: ConnectionRecord[] = [], started: Promise<unknown>[] = [], observations: Promise<unknown>[] = []
    const barrier = () => {
      let resolve!: () => void
      const promise = new Promise<void>(done => { resolve = done })
      return { promise, resolve }
    }
    const readerHeld = barrier(), readerResume = barrier(), writerResume = barrier()
    const writerReady = { first_writer: barrier(), second_writer: barrier() }
    const writerDispatched = { first_writer: barrier(), second_writer: barrier() }
    const producers: Partial<Record<WriterActor, ConnectionRecord>> = {}
    let readerOriginals = 0, readerPid: string | null = null, lockProofReached = false
    let failEarly!: (error: unknown) => void
    const early = new Promise<never>((_resolve, reject) => { failEarly = reject })
    void early.catch(() => {})
    const raceStarted = performance.now()
    // This observation cap does not extend any actor's existing 60s/120s
    // lifetime. Its only job is to release test gates on an unreachable phase.
    const phaseTimer = setTimeout(() => { raceAbort.abort(); failEarly(Error('race_actor_phase_unreached')) }, 120_000)
    const removeParentRaceStop = lifetime.onStop(() => {
      clearTimeout(phaseTimer); raceAbort.abort(); readerResume.resolve(); writerResume.resolve()
      failEarly(lifetime.signal.reason)
    })
    const launch = <T>(actor: RaceActor, operation: () => Promise<T>) => {
      const promise = lifetime.track(actors.run(actor, operation).then(result => {
        if (!lockProofReached) failEarly(Error(`race_${actor}_returned_before_lock_proof`))
        return result
      }, error => { failEarly(error); throw error }))
      started.push(promise); void promise.catch(() => {})
      return promise
    }
    const restoreRaceConnect = lifetime.patchConnect(async (...args: Parameters<typeof realConnect>) => {
      const actor = actors.getStore()
      const connection = await realConnect.call(LocalPgConnection, ...args)
      if (actor && [ATOMIC_REFRESH_LOGIN, 'ot_original_test_reader'].includes(args[1] ?? '')) {
        let pid: string
        try { pid = (await connection.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid! }
        catch (error) { connection.close(); throw error }
        const record: ConnectionRecord = { connection, pid, actor, role: args[1]!, dispatchedAt: null }; connections.push(record)
        const isProducer = actor !== 'old_reader' && args[1] === ATOMIC_REFRESH_LOGIN && !producers[actor]
        if (isProducer) producers[actor as WriterActor] = record
        const originalQuery = connection.query.bind(connection)
        connection.query = async (sql: string, parameters: readonly PgParameter[] = []) => {
          if (isProducer && sql.includes('refresh_version_v1(')) {
            assert.equal(record.dispatchedAt, null)
            record.dispatchedAt = performance.now()
            writerDispatched[actor as WriterActor].resolve()
          }
          const rows = await originalQuery(sql, parameters)
          if (actor === 'old_reader' && args[1] === 'ot_original_test_reader' && sql.includes('read_projection_candidate(') && ++readerOriginals === 2) {
            readerPid = pid; readerHeld.resolve(); await readerResume.promise; lifetime.check()
          }
          return rows
        }
        if (isProducer) {
          // The coordinator has already completed both immutable preflights.
          // This actual connection has not received BEGIN or refresh SQL yet.
          writerReady[actor as WriterActor].resolve(); await writerResume.promise; lifetime.check()
        }
      }
      return connection
    })
    let raceFailure: unknown, raceFailed = false
    try {
      // Fixed independent actor contexts prevent either coordinator's Old-read
      // from becoming the separate reader barrier. All three proofs are real.
      const oldRead = launch('old_reader', () => readPersistedCanonicalRequirements(w.cluster, 'primary', w.key, w.witness, raceAbort.signal))
      const first = launch('first_writer', () => refreshPersistedCanonicalVersion(w.cluster, req, w.key, raceAbort.signal))
      const second = launch('second_writer', () => refreshPersistedCanonicalVersion(w.cluster, rival, w.key, raceAbort.signal))
      await Promise.race([Promise.all([readerHeld.promise, writerReady.first_writer.promise, writerReady.second_writer.promise]), early])
      assert.ok(readerPid && producers.first_writer && producers.second_writer)
      assert.equal(new Set([readerPid, producers.first_writer.pid, producers.second_writer.pid]).size, 3)
      writerResume.resolve()
      await Promise.race([Promise.all([writerDispatched.first_writer.promise, writerDispatched.second_writer.promise]), early])
      assert.ok(producers.first_writer.dispatchedAt !== null && producers.second_writer.dispatchedAt !== null)
      const dispatchedAt = Math.min(producers.first_writer.dispatchedAt, producers.second_writer.dispatchedAt)
      let waits: Awaited<ReturnType<LocalPgConnection['query']>> = []
      const until = dispatchedAt + 12_000
      while (performance.now() < until) {
        const observation = w.owner.query(`SELECT a.pid::text AS pid,a.wait_event,
          ($3::integer=ANY(pg_blocking_pids(a.pid)))::text AS reader_blocks,
          EXISTS(SELECT 1 FROM pg_locks l WHERE l.pid=a.pid AND l.locktype='advisory' AND NOT l.granted
           AND l.classid=1869901924::oid AND l.objid=1::oid AND l.objsubid=2)::text AS publication_wait
          FROM pg_stat_activity a WHERE a.pid IN($1::integer,$2::integer)
           AND a.usename='${ATOMIC_REFRESH_LOGIN}' AND a.wait_event_type='Lock'
           AND position('refresh_version_v1(' IN a.query)>0 ORDER BY a.pid`,
        [pgText(producers.first_writer.pid, 23), pgText(producers.second_writer.pid, 23), pgText(readerPid, 23)])
        observations.push(observation)
        waits = await Promise.race([observation, early])
        if (waits.length === 2 && waits.filter(row => row.reader_blocks === 'true').length === 1
          && waits.filter(row => row.wait_event === 'advisory' && row.publication_wait === 'true').length === 1) break
        await Promise.race([delay(20), early])
      }
      assert.equal(waits.length, 2, 'both exact producer PIDs must actually be blocked')
      assert.equal(waits.filter(row => row.reader_blocks === 'true').length, 1, 'actual separate reader holds the head')
      assert.equal(waits.filter(row => row.wait_event === 'advisory' && row.publication_wait === 'true').length, 1)
      lockProofReached = true; clearTimeout(phaseTimer); readerResume.resolve()
      const before = await oldRead
      assert.equal(before.status, 'synthetic_persisted_requirements_verified')
      if (before.status === 'synthetic_persisted_requirements_verified') assert.equal(before.projection.recordFingerprint, req.expectedPredecessor)
      const results = await Promise.all([first, second])
      assert.equal(results.filter(r => r.status === 'synthetic_atomic_refresh_verified').length, 1)
      const winnerIndex = results[0]!.status === 'synthetic_atomic_refresh_verified' ? 0 : 1
      const winner = positive(results[winnerIndex]!, winnerIndex === 0 ? req : rival)
      nonpositive(results[1 - winnerIndex]!)
      w.witness = winner.witness
      assert.equal((await w.owner.query('SELECT count(*)::text AS n FROM official_original_private.refresh_transitions_v1'))[0]?.n, '1')
      assert.equal((await w.owner.query("SELECT count(*)::text AS n FROM official_original_private.events WHERE kind='accepted'"))[0]?.n, '2')
      const loser = winnerIndex === 0 ? rival : req
      assert.equal((await w.owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipts WHERE record_fingerprint=$1::text', [pgText(loser.envelope.bundle.recordFingerprint)]))[0]?.n, '0')
      await w.negative('later winner survives a fresh-witness old contender', { ...loser, witness: winner.witness }, undefined, '55000')
      note('real reader SHARE barrier and competing writers', { winner: winnerIndex, sql: winner.sqlPhaseMs,
        writerPhaseStartMs: Math.round(dispatchedAt - raceStarted) })
    } catch (error) { raceFailed = true; raceFailure = error }
    finally {
      clearTimeout(phaseTimer); raceAbort.abort(); readerResume.resolve(); writerResume.resolve()
      restoreRaceConnect(); removeParentRaceStop(); actors.disable()
      const cleanupErrors: unknown[] = []
      const cleanup = async (operation: () => unknown) => { try { await operation() } catch (error) { cleanupErrors.push(error) } }
      // Release transports before awaiting actors. Parent abort also stops the
      // actual cluster, waking a driver message waiter that close alone cannot.
      for (const item of connections) await cleanup(() => item.connection.close())
      let outcomes: PromiseSettledResult<unknown>[] = []
      await cleanup(async () => { outcomes = await lifetime.drain(started) })
      await cleanup(() => lifetime.drain(observations))
      await cleanup(() => w.gone(connections.map(item => item.pid))); await cleanup(() => w.locksReleased())
      note('three race actors settled and concrete backends removed', { lockProofReached,
        readerHeld: readerPid !== null, firstWriterReady: Boolean(producers.first_writer), secondWriterReady: Boolean(producers.second_writer),
        firstDispatched: producers.first_writer?.dispatchedAt !== null && producers.first_writer?.dispatchedAt !== undefined,
        secondDispatched: producers.second_writer?.dispatchedAt !== null && producers.second_writer?.dispatchedAt !== undefined,
        outcomes: outcomes.map(result => result.status), cleanupFailures: cleanupErrors.length })
      if (cleanupErrors.length) throw new AggregateError(raceFailed ? [raceFailure, ...cleanupErrors] : cleanupErrors, 'race_cleanup_failed')
    }
    if (raceFailed) throw raceFailure
  } finally { w.stop() }

  for (const outcome of ['unknown_commit', 'readback_failure', 'cleanup_after_bound', 'reader_after_bound'] as const) {
    const h = await openHarness(primary[0]!)
    try {
      const req = await h.request(primary[1]!, 'primary'); await h.align()
      const result = nonpositive(await h.observed(() => refreshPersistedCanonicalVersion(h.cluster, req, h.key),
        outcome === 'unknown_commit' ? { commitLoss: true } : outcome === 'readback_failure' ? { failReader: true }
          : { afterAckDelay: outcome === 'cleanup_after_bound' ? 'cleanup' : 'reader' }))
      assert.equal(result.status, outcome === 'unknown_commit' ? 'commit_outcome_unknown' : 'committed_readback_unavailable')
      assert.equal(result.commitStatus, outcome === 'unknown_commit' ? 'attempted_unacknowledged' : 'acknowledged')
      if (outcome.endsWith('_after_bound')) assert.equal(result.reason, 'currentness_lost')
      // Actual COMMIT happened in both injected transport/readback cases; the
      // runtime never guesses it, retries it, undoes it or returns Old positive.
      assert.equal((await h.owner.query('SELECT count(*)::text AS n FROM official_original_private.refresh_transitions_v1'))[0]?.n, '1')
      assert.equal((await h.owner.query("SELECT count(*)::text AS n FROM official_original_private.events WHERE kind='superseded'"))[0]?.n, '1')
      h.witness = await cursor(h.lifecycle); await h.align()
      const read = await readPersistedCanonicalRequirements(h.cluster, 'primary', h.key, h.witness)
      assert.equal(read.status, 'synthetic_persisted_requirements_verified')
      if (read.status === 'synthetic_persisted_requirements_verified') assert.equal(read.projection.recordFingerprint, req.envelope.bundle.recordFingerprint)
      note('truthful nonpositive terminal outcome independently inspected without replay', { case: outcome })
    } finally { h.stop() }
  }
  lifetime.check()
  } catch (error) { failed = true; failure = error }
  finally {
    try {
      const cleanup = await lifetime.dispose()
      assert.equal(cleanup.pending, 0); assert.equal(cleanup.started, cleanup.settled); assert.equal(cleanup.closed, cleanup.connections)
      note('parent lifetime disposed all owned resources and settled initiated operations', { cleanup, parentAborted: t.signal.aborted })
    } catch (error) { throw new AggregateError(failed ? [failure, error] : [error], 'native_parent_cleanup_failed') }
  }
  if (failed) throw failure
  t.signal.throwIfAborted()
  const parentReserveMs = 1_200_000 - (performance.now() - began)
  assert.ok(parentReserveMs > 0, 'complete healthy matrix and cleanup must retain actual parent budget')
  note('complete native refresh acceptance matrix finished', { parentReserveMs: Math.round(parentReserveMs) })
})
