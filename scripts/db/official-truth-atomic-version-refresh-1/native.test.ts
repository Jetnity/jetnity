import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { startLocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgParameter, type LocalPgBoundedCommit } from '../official-truth-integrated-pilot-1/pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, publishIntegratedBundle } from '../official-truth-integrated-pilot-1/storage'
import { bindCandidate, cursor, prepareOriginals, reviewCandidate, type Cursor, type PreparedOriginals } from '../official-truth-original-custody-1/storage'
import { readPersistedCanonicalRequirements } from '../official-truth-persisted-canonical-read-1/reader'
import { alternateSameIdentityReceipt } from '../official-truth-current-version-lookup-1/fixtures'
import { contradictingFactFixture, originalsFor } from '../official-truth-persisted-canonical-read-1/fixtures'
import { verifyLocalIntegratedPilotBundle } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { ATOMIC_REFRESH_LOGIN, ATOMIC_REFRESH_ROLE, ownAtomicRefreshRequest, type AtomicRefreshRequest } from './contract'
import { refreshPersistedCanonicalVersion, type AtomicRefreshResult } from './refresh'
import { actuallyFreshObservations, corruptReceipt, directlyCallRefresh, falseValidityLocator, extraInactivePolicy } from './fixtures'

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
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
const signature = 'official_original_api.refresh_version_v1(text,text,text,uuid,text,bigint,text,bytea,bytea,official_provenance_api.artifact_input_v1[],bytea[])'
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
test('atomic refresh: actual fresh execution, full transition, concurrency, rollback and independent readback', { timeout: 900_000 }, async t => {
  const began = performance.now()
  const note = (phase: string, details: Record<string, unknown> = {}) => t.diagnostic(JSON.stringify({
    schema: 'official-truth-atomic-version-refresh-1', phase, elapsedMs: Math.round(performance.now() - began), ...details,
  }))
  const primary = await actuallyFreshObservations('primary', 3), composed = await actuallyFreshObservations('composed', 2)
  note('five independent actual fresh executions; full capsules retained; later observations, unchanged bytes and mutually compatible immutable artifact identities asserted')
  const openHarness = async (initial: PreparedOriginals) => {
    const cluster = startLocalProofCluster(), opened = new Set<LocalPgConnection>()
    const connect = async (role?: string) => { const c = await LocalPgConnection.connect(cluster, role); opened.add(c); return c }
    const close = (c: LocalPgConnection) => { if (opened.delete(c)) c.close() }
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
    try {
      await owner.query('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;')
      await installLocalProofSchema(owner)
      for (const name of migrations) await owner.query(readFileSync(new URL(`../../../supabase/migrations/${name}`, import.meta.url), 'utf8'))
      await owner.query(readFileSync(new URL('../official-truth-persisted-canonical-read-1/read-projection-candidate.sql', import.meta.url), 'utf8'))
      await owner.query(packageSql)
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
        const records: { role: string; pid: string; closed: boolean; committed: boolean; queries: { phase: string; ms: number; code: string | null }[] }[] = []
        let insideBoundedCommit = false, boundedDeadline = 0, commitLossReached = false, readerFailureReached = false, delayReached = false, postCommitOriginals = 0
        let hookAssertion: unknown
        const afterActualBound = async () => { while (performance.now() <= boundedDeadline + 10) await delay(Math.min(50, Math.max(1, boundedDeadline + 11 - performance.now()))) }
        LocalPgConnection.connect = async (...args: Parameters<typeof realConnect>) => {
          const c = await realConnect.call(LocalPgConnection, ...args)
          const commitControl = insideBoundedCommit && (args[1] === undefined || args[1] === cluster.user)
          if (!commitControl && ![ATOMIC_REFRESH_LOGIN, 'ot_original_test_reader'].includes(args[1] ?? '')) return c
          const pid = (await c.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
          const record = { role: args[1] ?? cluster.user, pid, closed: false, committed: false, queries: [] as { phase: string; ms: number; code: string | null }[] }; records.push(record)
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
              const rows = await actualQuery(sql, params)
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
        }
        globalThis.fetch = async () => { throw Error('unexpected_refresh_network') }
        let result: AtomicRefreshResult
        try { result = await operation() } finally { LocalPgConnection.connect = realConnect; globalThis.fetch = realFetch }
        if (hookAssertion) throw hookAssertion
        if (options.commitLoss) assert.equal(commitLossReached, true)
        if (options.failReader) assert.equal(readerFailureReached, true)
        if (options.afterAckDelay) assert.equal(delayReached, true)
        await gone(records.map(r => r.pid)); await locksReleased()
        if (result.status === 'synthetic_atomic_refresh_verified') {
          assert.equal(records.filter(r => r.role === 'ot_original_test_reader').length, 4)
          assert.equal(records.filter(r => r.role === ATOMIC_REFRESH_LOGIN && r.committed).length, 1)
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
          backends: records.map(r => ({ role: r.role, closed: r.closed, acknowledged: r.committed, queries: r.queries.filter(q => q.phase !== 'other') })) })
        return result
      }
      const negative = async (name: string, req: AtomicRefreshRequest, setup?: () => Promise<void>, expectedCode?: string) => {
        await align(); const before = await snapshot(owner)
        await owner.query('BEGIN ISOLATION LEVEL READ COMMITTED')
        let caught: unknown
        try {
          await setup?.(); const provisionalBaseline = await snapshot(owner)
          await owner.query(`SAVEPOINT failed_refresh; SET LOCAL ROLE ${ATOMIC_REFRESH_ROLE}`)
          try { await directlyCallRefresh(owner, oids, req, key) } catch (error) { caught = error }
          assert.ok(caught instanceof LocalPgError, `${name} must fail through the actual narrow SQL grant`)
          if (expectedCode) assert.equal(caught.code, expectedCode)
          await owner.query('ROLLBACK TO SAVEPOINT failed_refresh')
          assert.deepEqual(await snapshot(owner), provisionalBaseline, `${name}: complete provisional publication/original/event/audit rollback`)
        } finally { await owner.query('ROLLBACK') }
        assert.deepEqual(await snapshot(owner), before); await locksReleased()
        note('negative direct SQL with complete rollback', { case: name, sqlstate: (caught as LocalPgError).code })
      }
      return { cluster, owner, key, connect, close, gone, oids, reviewer, lifecycle, initialReview, align, review, seed, request, observed, negative, locksReleased, publicationProbe,
        get witness() { return witness }, set witness(value: Cursor) { witness = value },
        stop() { for (const c of opened) c.close(); cluster.stop() } }
    } catch (error) { for (const c of opened) c.close(); cluster.stop(); throw error }
  }

  // Closed input and direct-role adversarial proof, real two fault phases,
  // same-content primary transition, duplicates and package-only removal.
  const h = await openHarness(primary[0]!)
  try {
    await h.publicationProbe(primary[1]!)
    const req = await h.request(primary[1]!, 'primary')
    const installed = await h.owner.query(`SELECT p.prosecdef::text AS definer,(p.proowner=o.proowner)::text AS owner,
      (p.proconfig @> ARRAY['search_path=""','TimeZone=UTC'])::text AS config FROM pg_proc p JOIN pg_proc o
      ON o.oid='official_original_api.read_candidate(text,text,bigint,text)'::regprocedure WHERE p.oid=$1::regprocedure`, [pgText(signature)])
    assert.deepEqual(installed, [{ definer: 'true', owner: 'true', config: 'true' }])
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
          IF EXISTS(SELECT 1 FROM official_original_private.rule_bindings WHERE fingerprint='${req.envelope.bundle.recordFingerprint}')
           AND EXISTS(SELECT 1 FROM official_original_private.events WHERE kind='accepted' AND target='${req.envelope.bundle.recordFingerprint}')
           AND NOT EXISTS(SELECT 1 FROM official_original_private.events WHERE kind='superseded' AND target='${req.expectedPredecessor}')
          THEN RAISE EXCEPTION 'actual_bound_before_supersede' USING ERRCODE='P7701'; ELSE RAISE EXCEPTION 'fault_phase_wrong' USING ERRCODE='P7799'; END IF;
        END IF; RETURN NEW; END $$;
        CREATE TRIGGER refresh_fault_before BEFORE INSERT ON official_original_private.events FOR EACH ROW EXECUTE FUNCTION public.refresh_fault_before();`)
    }, 'P7701')
    await h.negative('after actual supersede before COMMIT', req, async () => {
      await h.owner.query(`CREATE FUNCTION public.refresh_fault_after() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        IF EXISTS(SELECT 1 FROM official_original_private.events WHERE kind='superseded' AND target=NEW.predecessor AND sequence=NEW.after_sequence)
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
    // Real second accepted receipt creates ambiguity; test data is rolled back.
    const ambiguousRequest = { ...await h.request(primary[2]!, 'primary') }
    await h.negative('full-corpus ambiguity', ambiguousRequest, async () => {
      await publishIntegratedBundle(h.owner, h.oids, primary[1]!.envelope)
      await bindCandidate(h.owner, primary[1]!, req.reviewId, h.key, req.witness, 'create_or_verify')
      ambiguousRequest.witness = await cursor(h.owner)
    }, '55000')
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
  for (const corruption of ['old_validity_locator', 'extra_inactive_policy'] as const) {
    const mode = corruption === 'old_validity_locator' ? 'primary' : 'composed'
    const old = originalsFor(corruption === 'old_validity_locator' ? falseValidityLocator(primary[0]!.envelope) : extraInactivePolicy(composed[0]!.envelope))
    const next = corruption === 'old_validity_locator' ? primary[1]! : originalsFor(extraInactivePolicy(composed[1]!.envelope))
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
    LocalPgConnection.connect = async (...args: Parameters<typeof connectBeforeArming>) => {
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
    }
    try {
      const commit = await unsent.commitBefore(armingBound.deadlineAt, armingBound.cutoff)
      assert.equal(armingReached, true); assert.equal(commit.dispatched, false); assert.equal(commit.acknowledged, false)
      assert.equal(unsent.operationDiagnostics.at(-1)?.commitDispatched, false)
    } finally { LocalPgConnection.connect = connectBeforeArming; w.close(unsent); for (const connection of guardConnections) connection.close() }
    await w.gone([unsentPid])
    assert.equal((await w.owner.query('SELECT count(*)::text AS n FROM public.refresh_commit_probe'))[0]?.n, '0')
    note('actual cutoff during asynchronous arming; no COMMIT dispatch and no persisted probe')
    // A real deferred trigger runs inside COMMIT (where PG's statement timeout
    // is insufficient). The new independent guard must end it well before 20s.
    const deferred = await w.connect(), deferredPid = (await deferred.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
    await deferred.query('BEGIN; INSERT INTO public.refresh_commit_probe VALUES(2)')
    const deferredBound = await databaseCutoff(2_500), deferredStarted = performance.now()
    const deferredResult = deferred.commitBefore(deferredBound.deadlineAt, deferredBound.cutoff)
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
    note('actually running deferred COMMIT terminated by the shorter server guard', { elapsedMs: Math.round(performance.now() - deferredStarted) })
    // The raw database cutoff is much later. Delay the ACTUAL guard transport,
    // while leaving enough monotonic time to arm and dispatch COMMIT. With the
    // old relative-sleep implementation this three-second deferred work would
    // commit after our bound but before its late-started guard. Absolute DB
    // calibration must instead terminate it and leave no durable marker.
    const delayed = await w.connect(), delayedPid = (await delayed.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
    await delayed.query('BEGIN; INSERT INTO public.refresh_commit_probe VALUES(3)')
    const later = await databaseCutoff(20_000), earlierDeadline = performance.now() + 4_000
    const connectBeforeDelay = LocalPgConnection.connect, delayedGuards: LocalPgConnection[] = []
    let guardDelayMs = 0, guardArmed = false
    LocalPgConnection.connect = async (...args: Parameters<typeof connectBeforeDelay>) => {
      const connection = await connectBeforeDelay.call(LocalPgConnection, ...args); delayedGuards.push(connection)
      const query = connection.query.bind(connection)
      connection.query = async (sql: string, params: readonly PgParameter[] = []) => {
        if (!guardDelayMs && sql.includes('pg_terminate_backend(a.pid)::text AS terminated') && sql.includes('pg_sleep(')) {
          const start = performance.now(); await delay(1_600); guardDelayMs = performance.now() - start
        }
        const rows = await query(sql, params)
        if (sql.includes('SELECT state,wait_event') && rows[0]?.wait_event === 'PgSleep') guardArmed = true
        return rows
      }
      return connection
    }
    try {
      const pending = delayed.commitBefore(earlierDeadline, later.cutoff)
      let enteredAt: number | null = null
      const until = performance.now() + 3_500
      while (performance.now() < until) {
        const active = (await w.owner.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid::text=$1::text AND query='COMMIT' AND wait_event='PgSleep'", [pgText(delayedPid)]))[0]?.n === '1'
        if (active) { enteredAt = performance.now(); break }; await delay(20)
      }
      const result = await pending
      assert.equal(guardArmed, true); assert.ok(enteredAt !== null && enteredAt < earlierDeadline)
      assert.ok(enteredAt + 3_000 > earlierDeadline + 100, 'actual deferred work would finish after the earlier monotonic bound')
      assert.ok(enteredAt + 3_000 < earlierDeadline + guardDelayMs - 100, 'that work would beat a guard which restarted its relative sleep')
      assert.equal(result.dispatched, true); assert.equal(result.acknowledged, false)
      assert.ok(performance.now() < earlierDeadline + 1_500, 'guard fires at calibrated absolute cutoff, not delayed relative sleep')
    } finally { LocalPgConnection.connect = connectBeforeDelay; w.close(delayed); for (const connection of delayedGuards) connection.close() }
    await w.gone([delayedPid])
    assert.equal((await w.owner.query('SELECT count(*)::text AS n FROM public.refresh_commit_probe'))[0]?.n, '0')
    await w.owner.query('DROP TABLE public.refresh_commit_probe RESTRICT; DROP FUNCTION public.refresh_commit_pause() RESTRICT')
    note('real delayed guard transport preserves earlier monotonic cutoff', { guardDelayMs: Math.round(guardDelayMs) })
    const blocked = async (kind: 'expiry' | 'abort' | 'timeout') => {
      await w.align()
      let baseline: Awaited<ReturnType<typeof snapshot>> | undefined
      const blocker = await w.connect(), cancel = new AbortController(), realConnect = LocalPgConnection.connect
      let armed = false
      // The unchanged canonical Old preflight completes before this real lock
      // is acquired. It cannot be accidentally used as the lock-wait subject.
      LocalPgConnection.connect = async (...args: Parameters<typeof realConnect>) => {
        const connection = await realConnect.call(LocalPgConnection, ...args)
        if (args[1] === ATOMIC_REFRESH_LOGIN && !armed) {
          armed = true
          if (kind === 'expiry') await w.owner.query(`ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows;
            UPDATE official_original_private.originals SET freshness_until=clock_timestamp()+interval '12 seconds';
            ALTER TABLE official_original_private.originals ENABLE TRIGGER immutable_rows;`)
          baseline = await snapshot(w.owner)
          await blocker.query('BEGIN'); await blocker.query('SELECT singleton FROM official_original_private.head FOR UPDATE')
        }
        return connection
      }
      const pending = refreshPersistedCanonicalVersion(w.cluster, req, w.key, cancel.signal)
      let lockSeen = false
      try {
        const until = performance.now() + 45_000
        while (performance.now() < until) {
          lockSeen = (await w.owner.query(`SELECT count(*)::text AS n FROM pg_stat_activity WHERE usename='${ATOMIC_REFRESH_LOGIN}' AND wait_event_type='Lock'`))[0]?.n === '1'
          if (lockSeen) break; await delay(20)
        }
        assert.equal(lockSeen, true, `${kind}: writer really waits on held head`)
        if (kind === 'abort') cancel.abort()
        if (kind === 'expiry') {
          assert.equal((await w.owner.query('SELECT bool_and(clock_timestamp()<freshness_until)::text AS current FROM official_original_private.originals'))[0]?.current, 'true', 'predecessor is still usable after the wait actually begins')
          while ((await w.owner.query('SELECT bool_and(clock_timestamp()>=freshness_until)::text AS expired FROM official_original_private.originals'))[0]?.expired !== 'true') await delay(20)
          await blocker.query('ROLLBACK')
        }
        const result = nonpositive(await pending)
        assert.equal(result.commitStatus, 'not_attempted')
        if (kind === 'abort') assert.equal(result.reason, 'cancelled')
      } finally { LocalPgConnection.connect = realConnect; await blocker.query('ROLLBACK'); w.close(blocker) }
      assert.ok(baseline)
      assert.deepEqual(await snapshot(w.owner), baseline); await w.locksReleased()
      if (kind === 'expiry') await w.owner.query(`ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows;
        UPDATE official_original_private.originals SET freshness_until=captured_at+interval '30 days';
        ALTER TABLE official_original_private.originals ENABLE TRIGGER immutable_rows;`)
      note('actual lock-wait refusal with complete rollback and no leaked locks', { case: kind })
    }
    await blocked('expiry'); await blocked('abort'); await blocked('timeout')
    await w.align()
    const realConnect = LocalPgConnection.connect, connections: { connection: LocalPgConnection; pid: string }[] = []
    let readerOriginals = 0, gateUsed = false, release!: () => void, ready!: () => void
    const held = new Promise<void>(resolve => { ready = resolve }), resume = new Promise<void>(resolve => { release = resolve })
    LocalPgConnection.connect = async (...args: Parameters<typeof realConnect>) => {
      const connection = await realConnect.call(LocalPgConnection, ...args)
      if ([ATOMIC_REFRESH_LOGIN, 'ot_original_test_reader'].includes(args[1] ?? '')) {
        const pid = (await connection.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!; connections.push({ connection, pid })
        const originalQuery = connection.query.bind(connection)
        connection.query = async (sql: string, parameters: readonly PgParameter[] = []) => {
          const rows = await originalQuery(sql, parameters)
          if (args[1] === 'ot_original_test_reader' && sql.includes('read_projection_candidate(') && !gateUsed && ++readerOriginals === 2) {
            gateUsed = true; ready(); await resume
          }
          return rows
        }
      }
      return connection
    }
    try {
      const oldRead = readPersistedCanonicalRequirements(w.cluster, 'primary', w.key, w.witness)
      await Promise.race([held, oldRead.then(() => { throw Error('reader_did_not_hold_final_share') })])
      const first = refreshPersistedCanonicalVersion(w.cluster, req, w.key), second = refreshPersistedCanonicalVersion(w.cluster, rival, w.key)
      let waits: Awaited<ReturnType<LocalPgConnection['query']>> = []
      const until = performance.now() + 12_000
      while (performance.now() < until) {
        waits = await w.owner.query(`SELECT wait_event,count(*)::text AS n FROM pg_stat_activity WHERE usename='${ATOMIC_REFRESH_LOGIN}' AND wait_event_type='Lock' GROUP BY wait_event`)
        if (waits.reduce((sum, row) => sum + Number(row.n), 0) === 2 && waits.some(row => row.wait_event === 'advisory')) break
        await delay(20)
      }
      assert.equal(waits.reduce((sum, row) => sum + Number(row.n), 0), 2, 'actual head wait and actual competing publication-lock wait')
      assert.ok(waits.some(row => row.wait_event === 'advisory'))
      release()
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
      note('real reader SHARE barrier and competing writers', { winner: winnerIndex, sql: winner.sqlPhaseMs })
    } finally { release(); LocalPgConnection.connect = realConnect; for (const item of connections) item.connection.close() }
    await w.gone(connections.map(item => item.pid)); await w.locksReleased()
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
  note('complete native refresh acceptance matrix finished')
})
