import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgParameter, type PgRows } from '../../scripts/db/official-truth-integrated-pilot-1/pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, publishIntegratedBundle } from '../../scripts/db/official-truth-integrated-pilot-1/storage'
import { bindCandidate, cursor, reviewCandidate, type Cursor, type PreparedOriginals } from '../../scripts/db/official-truth-original-custody-1/storage'
import { lookupCurrentVersion } from '../../scripts/db/official-truth-current-version-lookup-1/lookup'
import { alternateSameIdentityReceipt } from '../../scripts/db/official-truth-current-version-lookup-1/fixtures'
import { readPersistedCanonicalRequirements, type PersistedCanonicalReadResult } from '../../scripts/db/official-truth-persisted-canonical-read-1/reader'
import { persistedCanonicalReadContract } from '../../scripts/db/official-truth-persisted-canonical-read-1/contract'
import { freshExecutedFixture, originalsFor, contradictingFactFixture } from '../../scripts/db/official-truth-persisted-canonical-read-1/fixtures'
import { verifyLocalIntegratedPilotBundle } from './official-truth-integrated-pilot-bundle'

const migrations = [
  '20261001121258_official_truth_private_evidence_store_schema_1.sql',
  '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
  '20261001180549_official_truth_trusted_store_writer_1.sql',
  '20261001193748_official_truth_source_catalog_gateway_1.sql',
  '20261004010705_official_truth_content_identity_2.sql',
  '20261004223959_official_truth_v2_catalog_hardening_1.sql',
  '20261010180000_official_truth_source_fingerprint_protocol_2.sql',
  '20261011111839_official_truth_original_custody_lifecycle_1.sql',
  '20261023153726_official_truth_current_version_lookup_1.sql',
]
const code = (expected: string) => (error: unknown) => error instanceof LocalPgError && error.code === expected
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
const positive = (result: PersistedCanonicalReadResult) => {
  assert.equal(result.status, 'synthetic_persisted_requirements_verified')
  if (result.status !== 'synthetic_persisted_requirements_verified') throw Error('persisted_positive_missing')
  assert.equal(result.productionAcceptedRead, 'NOT_AUTHORIZED')
  assert.equal(result.positiveRealVisaCells, 0)
  assert.equal(result.syntheticVisaCells, 1)
  assert.equal(result.reusablePositiveCache, false)
  assert.equal(result.projection.evaluations.filter(row => row.result !== 'unknown').length, 1)
  assert.ok(result.projection.evaluations.filter(row => row.requirementType !== 'visa').every(row => row.result === 'unknown'))
  assert.ok(Date.parse(result.recheckedAt) >= Date.parse(result.readAt))
  assert.ok(result.projection.sources.every(source => Date.parse(source.retrievedAt) < Date.parse(result.readAt)))
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.witness) && Object.isFrozen(result.projection.sources[0]!))
  return result
}
const nonpositive = (result: PersistedCanonicalReadResult) => {
  assert.notEqual(result.status, 'synthetic_persisted_requirements_verified')
  assert.equal(result.syntheticVisaCells, 0)
  assert.equal(result.positiveRealVisaCells, 0)
  assert.equal(result.productionAcceptedRead, 'NOT_AUTHORIZED')
  assert.equal('projection' in result, false)
  assert.deepEqual(result.evaluations, [])
  return result
}

// One cluster, real full implementation capsules, no skips/secret dependency.
// R3 allows 900s only for this new aggregate suite's complete proof matrix.
// Existing tests, SQL/transport deadlines, the reader and CI budgets are frozen.
test('persisted canonical bridge: closed committed producer, fresh native reader, final lifecycle proof', { timeout: 900_000 }, async t => {
  const actualMonotonic = performance.now.bind(performance)
  const began = actualMonotonic()
  const note = (name: string, details: Record<string, unknown> = {}) => t.diagnostic(JSON.stringify({
    schema: 'official-truth-persisted-canonical-read-1', phase: name, elapsedMs: Math.round(actualMonotonic() - began), ...details,
  }))
  const first = await freshExecutedFixture('primary'), composed = await freshExecutedFixture('composed')
  const alternate = originalsFor(alternateSameIdentityReceipt(first.envelope))
  const forged = originalsFor(contradictingFactFixture(first.envelope))
  note('actual fresh primary and composed capsules; alternate and contradiction are labelled historical negative fixtures')
  const cluster = startLocalProofCluster(), opened = new Set<LocalPgConnection>(), producerPids = new Set<string>()
  const connect = async (role?: string) => { const connection = await LocalPgConnection.connect(cluster, role); opened.add(connection); return connection }
  const close = (connection: LocalPgConnection) => { if (opened.delete(connection)) connection.close() }
  const owner = await connect(), key = randomBytes(32).toString('hex')
  const gone = async (pids: readonly string[]) => {
    for (const pid of pids) {
      let absent = false
      for (let attempt = 0; attempt < 100; attempt++) {
        absent = (await owner.query('SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid::text=$1::text', [pgText(pid)]))[0]?.n === '0'
        if (absent) break
        await delay(20)
      }
      assert.equal(absent, true, 'owned backend must actually disappear')
    }
  }
  try {
    assert.match(cluster.version, /^postgres \(PostgreSQL\) 16\./)
    await owner.query('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;')
    await installLocalProofSchema(owner)
    for (const name of migrations) await owner.query(readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'))
    const candidateSql = readFileSync(new URL('../../scripts/db/official-truth-persisted-canonical-read-1/read-projection-candidate.sql', import.meta.url), 'utf8')
    const rollbackSql = readFileSync(new URL('../../scripts/db/official-truth-persisted-canonical-read-1/read-projection-candidate.rollback.sql', import.meta.url), 'utf8')
    const boundedSignature = 'official_original_api.read_projection_candidate(text,text,bigint,text)'
    const objects = async () => owner.query(`SELECT 'function' AS kind,p.oid::text AS id,md5(pg_get_functiondef(p.oid)||p.proowner::text||COALESCE(p.proacl::text,'')) AS definition
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname LIKE 'official_%'
      UNION ALL SELECT 'relation',c.oid::text,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname LIKE 'official_%'
      ORDER BY 1,2`)
    const oldObjects = await objects()
    const oldRoles = await owner.query('SELECT rolname,rolsuper::text,rolbypassrls::text,rolcanlogin::text FROM pg_roles ORDER BY rolname')
    await owner.query(candidateSql)
    assert.deepEqual(await owner.query('SELECT rolname,rolsuper::text,rolbypassrls::text,rolcanlogin::text FROM pg_roles ORDER BY rolname'), oldRoles)
    const installed = await owner.query(`SELECT p.prosecdef::text AS definer,p.proowner::text AS owner,
      (p.proowner=o.proowner)::text AS same_owner,(p.proconfig @> ARRAY['search_path=""','TimeZone=UTC'])::text AS fixed_config,
      pg_get_userbyid(p.proowner) AS owner_name FROM pg_proc p JOIN pg_proc o ON o.oid='official_original_api.read_candidate(text,text,bigint,text)'::regprocedure
      WHERE p.oid=$1::regprocedure`, [pgText(boundedSignature)])
    assert.equal(installed[0]?.definer, 'true'); assert.equal(installed[0]?.same_owner, 'true'); assert.equal(installed[0]?.fixed_config, 'true')
    assert.equal(installed[0]?.owner_name, cluster.user)
    assert.equal((await objects()).length, oldObjects.length + 1)
    const installedObjects = await objects()
    await assert.rejects(owner.query(candidateSql), code('42723')); await owner.query('ROLLBACK')
    assert.deepEqual(await objects(), installedObjects, 'reapply must not overwrite an existing function')
    await owner.query(`CREATE ROLE ot_original_test_writer LOGIN; GRANT ot_original_producer,ot_provenance_writer TO ot_original_test_writer;
      CREATE ROLE ot_original_test_reader LOGIN; GRANT ot_original_reader,ot_provenance_reader TO ot_original_test_reader;
      CREATE ROLE ot_original_test_reviewer LOGIN; GRANT ot_original_reviewer TO ot_original_test_reviewer;
      CREATE ROLE ot_original_test_lifecycle LOGIN; GRANT ot_original_lifecycle TO ot_original_test_lifecycle;`)
    for (const fixture of [first, composed]) {
      const verified = verifyLocalIntegratedPilotBundle(fixture.envelope); assert.ok(verified.ok)
      for (const support of verified.value.receipt.payload.supports) await owner.query(
        'INSERT INTO official_original_private.admissions VALUES($1::jsonb,$2::text,$3::text,1,65536,2592000,2592000) ON CONFLICT DO NOTHING',
        [pgText(JSON.stringify(support.binding), 3802), pgText(support.contentType), pgText(support.canonicalFinalUrl)])
    }
    const reviewer = await connect('ot_original_test_reviewer'), lifecycle = await connect('ot_original_test_lifecycle')
    const oids = await localArtifactTypeOids(owner)
    let witness = await cursor(owner)
    const align = async (next = witness) => {
      await lifecycle.query('SELECT official_original_api.checkpoint($1::bigint,$2::text)', [pgText(next.sequence, 20), pgText(next.eventHash)])
    }
    await align()
    const lifecycleEvent = async (kind: string, target: string) => {
      await lifecycle.query('SELECT official_original_api.lifecycle($1::text,$2::text,$3::bigint,$4::text)',
        [pgText(kind), pgText(target), pgText(witness.sequence, 20), pgText(witness.eventHash)])
      witness = await cursor(lifecycle); await align()
    }
    type Phase = 'lookup' | 'originals' | 'archive' | 'archive_commit' | 'other'
    type QueryTiming = Readonly<{ readerAnchor: number | null; enteredAt: number; sqlStartedAt: number | null; repliedAt: number | null }>
    type Hook = (phase: Phase, count: number, rows: PgRows | undefined, timing: QueryTiming) => Promise<void> | void
    let observedReaderClock: { last: number } | null = null
    let lastSuccessfulPrimary: { readMs: number; maxOriginalSqlMs: number } | undefined
    let readNumber = 0
    const ownedRead = async (mode: 'primary' | 'composed', options: { at?: Cursor; signal?: AbortSignal; before?: Hook; after?: Hook; onConnect?: () => void;
      alterRows?: (phase: Phase, count: number, rows: PgRows) => PgRows; decryptionKey?: string } = {}) => {
      const realConnect = LocalPgConnection.connect, realFetch = globalThis.fetch
      const readStarted = actualMonotonic(), readId = ++readNumber
      const records: { pid: string; connection: LocalPgConnection; phases: Phase[]; begins: string[] }[] = []
      const timings: (QueryTiming & { phase: Phase; count: number; deliveredAt: number | null; failed: boolean })[] = []
      let hookAssertion: unknown
      let originalReads = 0, lookups = 0
      LocalPgConnection.connect = async (...args: Parameters<typeof realConnect>) => {
        const connection = await realConnect.call(LocalPgConnection, ...args)
        if (args[1] === 'ot_original_test_reader') {
          const pid = (await connection.query('SELECT pg_backend_pid()::text AS pid'))[0]?.pid
          assert.ok(pid); assert.equal(producerPids.has(pid), false)
          const record = { pid, connection, phases: [] as Phase[], begins: [] as string[] }; records.push(record)
          const realQuery = connection.query.bind(connection)
          connection.query = async (sql: string, parameters: readonly PgParameter[] = []) => {
            // Capture before ANY test clock observation. In the earliest-bound
            // case the pass-through observer records the actual reader anchor
            // immediately preceding this synchronous query-wrapper invocation.
            const readerAnchor = observedReaderClock?.last ?? null
            const enteredAt = actualMonotonic()
            const phase: Phase = sql.includes('lookup_current_version(') ? 'lookup' : sql.includes('read_projection_candidate(') ? 'originals'
              : sql.includes('read_local_integrated_v2(') ? 'archive' : sql === 'COMMIT' ? 'archive_commit' : 'other'
            if (sql.startsWith('BEGIN')) record.begins.push(sql)
            const count = phase === 'originals' ? ++originalReads : phase === 'lookup' ? ++lookups : 0
            record.phases.push(phase)
            const timing = { phase, count, readerAnchor, enteredAt, sqlStartedAt: null as number | null,
              repliedAt: null as number | null, deliveredAt: null as number | null, failed: false }
            timings.push(timing)
            try {
              await options.before?.(phase, count, undefined, timing)
              timing.sqlStartedAt = actualMonotonic()
              const rows = await realQuery(sql, parameters)
              timing.repliedAt = actualMonotonic()
              await options.after?.(phase, count, rows, timing)
              const delivered = options.alterRows?.(phase, count, rows) ?? rows
              timing.deliveredAt = actualMonotonic()
              return delivered
            } catch (error) {
              timing.failed = true
              if (error instanceof Error && error.name === 'AssertionError') hookAssertion = error
              throw error
            }
          }
          options.onConnect?.()
        }
        return connection
      }
      globalThis.fetch = async () => { throw Error('unexpected_reader_network') }
      let result: PersistedCanonicalReadResult
      try { result = await readPersistedCanonicalRequirements(cluster, mode, options.decryptionKey ?? key, options.at ?? witness, options.signal) }
      finally { LocalPgConnection.connect = realConnect; globalThis.fetch = realFetch }
      const readMs = actualMonotonic() - readStarted
      note('owned reader result', { readId, mode, status: result.status, reason: 'reason' in result ? result.reason : null,
        readMs: Math.round(readMs), originalReads, lookups, queries: timings.filter(row => row.phase !== 'other').map(row => ({
          phase: row.phase, count: row.count, sqlSucceeded: row.repliedAt !== null, failed: row.failed,
          sqlMs: row.repliedAt !== null && row.sqlStartedAt !== null ? Math.round(row.repliedAt - row.sqlStartedAt) : null,
          beforeMs: row.sqlStartedAt === null ? null : Math.round(row.sqlStartedAt - row.enteredAt),
          afterMs: row.deliveredAt !== null && row.repliedAt !== null ? Math.round(row.deliveredAt - row.repliedAt) : null,
        })) })
      // Successful read termination is a read-only rollback/Terminate, not an
      // invented durability acknowledgement. Prove actual backend/lock release.
      await gone(records.map(record => record.pid))
      await owner.query('BEGIN')
      try { await owner.query('SELECT singleton FROM official_original_private.head FOR UPDATE NOWAIT') }
      finally { await owner.query('ROLLBACK') }
      if (hookAssertion) throw hookAssertion // test assertions must not become a swallowed reader refusal
      assert.equal(records[0]?.begins[0], 'BEGIN ISOLATION LEVEL READ COMMITTED')
      assert.equal(records[0]?.phases.includes('archive_commit'), false)
      if (result.status === 'synthetic_persisted_requirements_verified') {
        assert.equal(records.length, 2)
        assert.notEqual(records[0]!.pid, records[1]!.pid)
        assert.deepEqual(records[1]!.begins, ['BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'])
        assert.equal(records[1]!.phases.at(-1), 'archive_commit')
        assert.equal(records[0]!.phases.at(-1), 'originals')
        assert.equal(originalReads, 2)
        assert.equal(lookups, 2)
        if (mode === 'primary') lastSuccessfulPrimary = { readMs, maxOriginalSqlMs: Math.max(...timings
          .filter(row => row.phase === 'originals').map(row => row.repliedAt! - row.sqlStartedAt!)) }
      }
      const encoded = JSON.stringify(result)
      assert.equal(encoded.includes(key), false)
      for (const fixture of [first, composed]) for (const body of fixture.bodies) {
        assert.equal(encoded.includes(JSON.stringify(Buffer.from(body).toString('utf8')).slice(1, -1)), false)
        assert.equal(encoded.includes(Buffer.from(body).toString('base64')), false)
      }
      assert.doesNotMatch(encoded, /"(?:original_bytes|sourceSnapshot|bundleBase64|canonicalBytes|custodyBindingBytes|seal|token)":/)
      return result
    }
    const publish = async (fixture: PreparedOriginals, finish: 'commit' | 'rollback' | 'disconnect' = 'commit') => {
      await align()
      const review = await reviewCandidate(reviewer, fixture), producer = await connect('ot_original_test_writer')
      const pid = (await producer.query('SELECT pg_backend_pid()::text AS pid'))[0]?.pid
      assert.ok(pid); producerPids.add(pid)
      let next: Cursor | undefined
      try {
        await producer.query('BEGIN ISOLATION LEVEL READ COMMITTED')
        assert.equal(await publishIntegratedBundle(producer, oids, fixture.envelope), 'inserted')
        assert.equal(await bindCandidate(producer, fixture, review, key, witness, 'create_or_verify'), 'inserted')
        const provisional = await cursor(producer)
        if (finish === 'commit') {
          await producer.query('COMMIT')
          assert.ok(producer.operationDiagnostics.some(operation => operation.phase === 'commit' && operation.commitAcknowledged === true))
          next = provisional // becomes external witness only after acknowledgement
        } else if (finish === 'rollback') await producer.query('ROLLBACK')
      } finally { close(producer) }
      await gone([pid]) // mandatory before creating the new reader, including failures
      if (next) { witness = next; await align() }
    }
    await align()
    assert.equal((await ownedRead('primary')).status, 'no_match')
    await publish(first, 'rollback')
    await align()
    assert.equal((await ownedRead('primary')).status, 'no_match')
    await publish(first, 'disconnect')
    await align()
    assert.equal((await ownedRead('primary')).status, 'no_match')
    note('rollback and uncommitted disconnect are not a persisted-path proof')
    await publish(first)
    await align()
    const firstRead = positive(await ownedRead('primary'))
    assert.equal(firstRead.projection.recordFingerprint, first.envelope.bundle.recordFingerprint)
    assert.deepEqual(firstRead.witness, witness)
    note('primary: acknowledged COMMIT, producer gone, distinct fresh guarded and archive backends, one synthetic Visa')
    // The whole accepted corpus is still verified on every read. Composed is
    // actually published later, after the independent generic primary cases.
    await align()
    const legacy = await connect('ot_original_test_reader')
    await legacy.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    const metadata = await lookupCurrentVersion(cluster, legacy, persistedCanonicalReadContract('primary').request, key, witness)
    assert.equal(metadata.status, 'synthetic_current_version_verified')
    assert.equal(metadata.positiveVisaCells, 0)
    assert.equal(metadata.reusablePositiveCache, false)
    if (metadata.status === 'synthetic_current_version_verified') {
      assert.deepEqual(Object.keys(metadata.proof).sort(), ['authority', 'cursor', 'historicalOriginalsReproved', 'positiveVisaCells', 'productionAcceptedRead', 'recordFingerprint', 'status', 'supports'])
    }
    await legacy.query('COMMIT'); close(legacy)
    note('legacy lookup and custody metadata contracts preserved')

    // Snapshot only tiny synthetic lifecycle tables for independent tamper cases.
    // Owner corruption/restore is confined to this disposable native cluster;
    // no schema function, migration, guard, role or effective grant is changed.
    const savedTables = ['reviews', 'rule_bindings', 'originals', 'ciphertexts', 'supports', 'events', 'head'] as const
    for (const table of savedTables) await owner.query(`CREATE TEMP TABLE saved_${table} AS SELECT * FROM official_original_private.${table}`)
    const baseWitness = Object.freeze({ ...witness })
    const restore = async () => {
      await owner.query('BEGIN; SET LOCAL session_replication_role=replica')
      for (const table of savedTables) await owner.query(`DELETE FROM official_original_private.${table}; INSERT INTO official_original_private.${table} SELECT * FROM saved_${table}`)
      await owner.query('COMMIT')
      witness = baseWitness; await align()
    }
    const corrupt = async (sql: string, parameters: readonly PgParameter[] = []) => {
      await owner.query('BEGIN; SET LOCAL session_replication_role=replica')
      try { await owner.query(sql, parameters); await owner.query('COMMIT') }
      catch (error) { await owner.query('ROLLBACK'); throw error }
    }
    for (const [name, sql] of [
      ['missing original ciphertext', 'DELETE FROM official_original_private.ciphertexts'],
      ['wrong raw digest', "UPDATE official_original_private.originals SET raw_digest=repeat('0',64)"],
      ['wrong support order', 'UPDATE official_original_private.supports SET position=position+3'],
      ['missing rule binding', 'DELETE FROM official_original_private.rule_bindings'],
      ['mismatched review key', "UPDATE official_original_private.reviews SET packet_key='review-packet:v3:'||repeat('0',64)"],
    ] as const) {
      await align()
      try { await corrupt(sql); nonpositive(await ownedRead('primary')) }
      finally { await restore() }
      note(name)
    }
    const invalidWitness = { sequence: witness.sequence, eventHash: '0'.repeat(64) }
    await align()
    nonpositive(await ownedRead('primary', { at: invalidWitness }))
    await align()
    nonpositive(await ownedRead('primary', { at: { sequence: '0', eventHash: '0'.repeat(64) } }))
    await align()
    nonpositive(await ownedRead('primary', { decryptionKey: '00'.repeat(32) }))
    await align()
    try {
      await owner.query("UPDATE official_original_private.head SET checked_at=clock_timestamp()-interval '61 seconds'")
      nonpositive(await ownedRead('primary'))
    } finally { await restore() }
    await align()
    const mutableWitness = { ...witness }
    let witnessMutationHooks = 0
    const detached = positive(await ownedRead('primary', { at: mutableWitness, onConnect: () => {
      witnessMutationHooks++; mutableWitness.sequence = '0'; mutableWitness.eventHash = '0'.repeat(64)
    } }))
    assert.equal(witnessMutationHooks, 2)
    assert.deepEqual(detached.witness, witness)
    note('foreign/stale/head-expired witnesses and wrong key fail; invocation owns witness before first await')

    for (const [kind, target] of [
      ['withdrawn', first.envelope.bundle.recordFingerprint], ['conflicted', first.envelope.bundle.recordFingerprint],
      ['superseded', first.envelope.bundle.recordFingerprint], ['source_withdrawn', 'synthetic-pilot-authority'],
      ['profile_withdrawn', 'synthetic-pilot-whole-response:1'],
    ] as const) {
      await align()
      try { await lifecycleEvent(kind, target); nonpositive(await ownedRead('primary')) }
      finally { await restore() }
      note(`${kind} cannot yield cached projection`)
    }
    await align()
    try {
      await corrupt("UPDATE official_original_private.originals SET expires_at=captured_at+interval '1 second'")
      nonpositive(await ownedRead('primary'))
      await lifecycle.query('SELECT official_original_api.expire($1::bigint,$2::text)', [pgText(witness.sequence, 20), pgText(witness.eventHash)])
      witness = await cursor(lifecycle); await align()
      nonpositive(await ownedRead('primary'))
      assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_original_private.ciphertexts'))[0]?.n, '0')
      assert.ok((await owner.query("SELECT kind FROM official_original_private.events WHERE kind='disposed'")).length > 0)
    } finally { await restore() }
    note('expiry before read and actual disposal never yield retained positive')

    let lockProofs = 0
    const held = async () => {
      await owner.query('BEGIN')
      try { await assert.rejects(owner.query('SELECT singleton FROM official_original_private.head FOR UPDATE NOWAIT'), code('55P03')); lockProofs++ }
      finally { await owner.query('ROLLBACK') }
    }
    await align()
    positive(await ownedRead('primary', { after: async (phase, count) => { if (phase === 'archive_commit' || (phase === 'lookup' && count === 2)) await held() } }))
    assert.equal(lockProofs, 2)
    note('guard SHARE lock held after archive COMMIT and after awaited canonical Requirements')
    assert.ok(lastSuccessfulPrimary)
    const deadlineWindow = Math.ceil(lastSuccessfulPrimary.readMs + lastSuccessfulPrimary.maxOriginalSqlMs + 5_000)
    assert.ok(Number.isFinite(deadlineWindow) && deadlineWindow <= 45_000, 'real calibration must fit R3; never clamp or retry')
    note('fixed deadline calibration from actual healthy primary read', { fullReadMs: Math.ceil(lastSuccessfulPrimary.readMs),
      maxOriginalSqlMs: Math.ceil(lastSuccessfulPrimary.maxOriginalSqlMs), reserveMs: 5_000, windowMs: deadlineWindow })
    for (const boundary of ['archive_commit', 'final_originals'] as const) {
      await align()
      const cancelled = new AbortController()
      let cancellationHooks = 0
      const result = nonpositive(await ownedRead('primary', { signal: cancelled.signal, after: (phase, count) => {
        if (phase === boundary || (boundary === 'final_originals' && phase === 'originals' && count === 2)) { cancellationHooks++; cancelled.abort() }
      } }))
      assert.equal(cancellationHooks, 1, `must reach ${boundary} cancellation hook`)
      assert.equal(result.reason, 'cancelled')
      note('specific cancellation boundary reached', { boundary, hooks: cancellationHooks })
    }
    await align()
    let transportHooks = 0
    const failed = nonpositive(await ownedRead('primary', { before: (phase, count) => {
      if (phase === 'originals' && count === 2) { transportHooks++; throw Error('synthetic_transport_failure_private') }
    } }))
    assert.equal(transportHooks, 1, 'must reach final original-query transport injection')
    assert.equal(failed.status, 'unavailable')
    assert.equal(failed.reason, 'read_failed')
    assert.equal(JSON.stringify(failed).includes('synthetic_transport_failure_private'), false)
    note('cancellation after archive/final read and final transport failure release guards without positive')
    await align()
    let finalReads = 0, expiryHooks = 0, expiryLookupHooks = 0
    let lateExpiryAt: number | undefined, finalLookupReplyAt: number | undefined
    try {
      await corrupt("UPDATE official_original_private.originals SET expires_at=clock_timestamp()+$1::bigint*interval '1 millisecond'", [pgText(String(deadlineWindow), 20)])
      const caseStarted = actualMonotonic()
      const lateExpiry = nonpositive(await ownedRead('primary', {
        after: async (phase, count, rows, timing) => {
          if (phase === 'originals' && count === 1) {
            expiryHooks++; lateExpiryAt = Math.min(...rows!.map(row => Date.parse(row.expires_at!)))
          }
          if (phase === 'lookup' && count === 2) {
            expiryLookupHooks++
            assert.ok(timing.repliedAt !== null)
            finalLookupReplyAt = timing.repliedAt
          }
        },
        before: async (phase, count) => {
          if (phase !== 'originals' || count !== 2) return
          finalReads++
          assert.ok(lateExpiryAt !== undefined)
          const remaining = Math.ceil(lateExpiryAt - Date.now())
          assert.ok(remaining > 0 && remaining + 5 < 18_000)
          const pausedAt = actualMonotonic()
          await delay(remaining + 5)
          assert.ok(actualMonotonic() - pausedAt < 18_000)
          assert.ok(finalLookupReplyAt !== undefined && actualMonotonic() - finalLookupReplyAt < 18_000,
            'entire idle interval before actual final SQL remains below R3')
          assert.ok(Date.now() >= lateExpiryAt, 'pre-existing bound crosses before the actual final native SQL call')
        },
      }))
      assert.equal(expiryHooks, 1, 'must observe actual pre-existing retention in initial material read')
      assert.equal(expiryLookupHooks, 1)
      assert.equal(lateExpiry.reason, 'material_or_lifecycle_refused')
      assert.equal(finalReads, 1, 'fresh native SQL recheck occurs after projection')
      assert.ok(actualMonotonic() - caseStarted < 59_000)
    } finally { await restore() }
    note('retention crossing during awaited operation is refused by final actual SQL recheck')

    // The R2 counterexample delays an ACTUALLY successful final native reply.
    // Every real deadline is carried from the initial read; it is not inferred
    // from the 30-day schema ceiling or reset when the last response arrives.
    for (const cause of ['retention', 'freshness', 'lifecycle'] as const) {
      await align()
      let finalSuccess = 0, initialSuccess = 0, stagingHooks = 0
      let initialActualExpiry: number | undefined
      try {
        if (cause === 'lifecycle') await owner.query("UPDATE official_original_private.head SET checked_at=clock_timestamp()-interval '60 seconds'+$1::bigint*interval '1 millisecond'", [pgText(String(deadlineWindow), 20)])
        else await corrupt(`UPDATE official_original_private.originals SET ${cause === 'retention' ? 'expires_at' : 'freshness_until'}=clock_timestamp()+$1::bigint*interval '1 millisecond'`, [pgText(String(deadlineWindow), 20)])
        const caseStarted = actualMonotonic()
        const delayed = nonpositive(await ownedRead('primary', { after: async (phase, count, rows, timing) => {
          if (phase === 'originals' && count === 1) {
            initialSuccess++
            initialActualExpiry = Math.min(...rows!.flatMap(row => ['expires_at', 'freshness_until', 'lifecycle_valid_until'].map(field => Date.parse(row[field]!))))
            return
          }
          if (phase === 'lookup' && count === 2) {
            stagingHooks++
            assert.ok(initialActualExpiry !== undefined && timing.repliedAt !== null)
            // If this read runs faster than calibration, consume only existing
            // time BEFORE the final query starts. No bound/checkpoint is changed.
            const stagingMs = Math.max(0, Math.ceil(initialActualExpiry - Date.now() - 12_000))
            assert.ok(stagingMs < 18_000, 'pre-final staging must fit the unchanged idle bound')
            if (stagingMs > 0) await delay(stagingMs)
            assert.ok(actualMonotonic() - timing.repliedAt < 18_000)
            note('bounded staging before final SQL', { cause, stagingMs })
            return
          }
          if (phase !== 'originals' || count !== 2) return
          finalSuccess++
          assert.ok(rows && rows.length > 0, 'actual final native query returned originals and bound metadata')
          const remaining = Math.min(...rows!.flatMap(row => ['expires_at', 'freshness_until', 'lifecycle_valid_until']
            .map(field => Date.parse(row[field]!) - Date.parse(row.observed_at!))))
          const actualExpiry = Math.min(...rows!.flatMap(row => ['expires_at', 'freshness_until', 'lifecycle_valid_until'].map(field => Date.parse(row[field]!))))
          const relevantField = cause === 'retention' ? 'expires_at' : cause === 'freshness' ? 'freshness_until' : 'lifecycle_valid_until'
          assert.equal(actualExpiry, Math.min(...rows!.map(row => Date.parse(row[relevantField]!))), 'the intended bound is the active minimum')
          assert.ok(remaining > 0 && Math.ceil(remaining) + 5 < 18_000, 'actual final response pause must fit unchanged idle protection')
          const pausedAt = actualMonotonic()
          await delay(Math.ceil(remaining) + 5)
          const actualPause = actualMonotonic() - pausedAt
          assert.ok(actualPause < 18_000, 'actual response sleep remains strictly within R3')
          assert.ok(timing.repliedAt !== null && actualMonotonic() - timing.repliedAt < 18_000,
            'entire actual final-response idle interval remains below the R3 bound')
          assert.ok(Date.now() >= actualExpiry, 'the actual database deadline was crossed after successful final SQL')
          assert.ok(actualMonotonic() - caseStarted < 59_000, 'whole-operation deadline is still independently future')
          note('successful final SQL response delayed across actual bound', { cause, hooks: finalSuccess, pauseMs: Math.round(actualPause) })
        } }))
        assert.equal(initialSuccess, 1, 'actual initial candidate bound must be observed')
        assert.equal(stagingHooks, 1, 'must reach the completed second lookup before final SQL')
        assert.equal(finalSuccess, 1, 'must reach exactly one successful final SQL reply before delaying it')
        assert.equal(delayed.reason, 'freshness_lost', 'carried DB bound, independently of the whole 60s operation deadline')
      } finally { await restore() }
      note(`${cause} deadline crossed after successful final SQL reply: no positive output`)
    }
    const metadataCases: readonly [string, (rows: PgRows) => PgRows][] = [
      ['missing bound', rows => rows.map(({ expires_at, ...row }) => { void expires_at; return row })],
      ['invalid timestamp', rows => rows.map(row => ({ ...row, observed_at: 'not-a-time' }))],
      ['expired bound', rows => rows.map(row => ({ ...row, expires_at: row.observed_at! }))],
      ['inconsistent lifecycle interval', rows => rows.map(row => ({ ...row, lifecycle_valid_until: row.expires_at! }))],
      ['mismatched stable material', rows => rows.map(row => ({ ...row, raw_digest: '0'.repeat(64) }))],
      ['changed bound', rows => rows.map(row => ({ ...row, freshness_until: new Date(Date.parse(row.freshness_until!) - 1000).toISOString().replace('Z', '000Z') }))],
    ]
    for (const [name, mutate] of metadataCases) {
      await align()
      let metadataHooks = 0
      const malformed = nonpositive(await ownedRead('primary', { alterRows: (phase, count, rows) => {
        if (phase !== 'originals' || count !== 2) return rows
        metadataHooks++; return mutate(rows)
      } }))
      assert.equal(metadataHooks, 1, `must reach actual final SQL metadata mutation: ${name}`)
      assert.equal(malformed.reason, name === 'mismatched stable material' ? 'material_changed' : 'material_or_lifecycle_refused')
      note(name, { hooks: metadataHooks })
    }
    await align()
    let initialMetadataHooks = 0
    const initialMissing = nonpositive(await ownedRead('primary', { alterRows: (phase, count, rows) => {
      if (phase !== 'originals' || count !== 1) return rows
      initialMetadataHooks++; return metadataCases[0]![1](rows)
    } }))
    assert.equal(initialMetadataHooks, 1)
    assert.equal(initialMissing.reason, 'material_or_lifecycle_refused')
    note('initial read also requires all actual bound metadata')
    await align()
    const earliestWindow = deadlineWindow + 5_000
    assert.ok(earliestWindow < 50_000, 'initial transport-delay allowance must remain below R3 hard bound')
    let earlierConfirmed = 0, initialDelayHooks = 0, initialSuccess = 0, laterSuccess = 0, earliestStagingHooks = 0
    let initialBound: number | undefined
    const clockObservation = { last: NaN }
    observedReaderClock = clockObservation
    const earliestClock = t.mock.method(performance, 'now', () => {
      const realValue = actualMonotonic()
      clockObservation.last = realValue
      return realValue // exact pass-through: no offset or synthetic clock
    })
    const actualQueryBound = (rows: PgRows, timing: QueryTiming) => {
      assert.ok(timing.readerAnchor !== null && Number.isFinite(timing.readerAnchor))
      assert.ok(timing.enteredAt >= timing.readerAnchor && timing.enteredAt - timing.readerAnchor < 100,
        'observed reader query-start must directly precede the wrapper, not a reconstructed wall-clock time')
      assert.ok(rows.length > 0)
      return Math.min(...rows.map(row => timing.readerAnchor! + Math.min(...['expires_at', 'freshness_until', 'lifecycle_valid_until']
        .map(field => Date.parse(row[field]!) - Date.parse(row.observed_at!))) - 2))
    }
    try {
      await corrupt("UPDATE official_original_private.originals SET expires_at=clock_timestamp()+$1::bigint*interval '1 millisecond'", [pgText(String(earliestWindow), 20)])
      const caseStarted = actualMonotonic()
      const earliest = nonpositive(await ownedRead('primary', {
        before: async (phase, count) => {
          if (phase === 'originals' && count === 1) {
            initialDelayHooks++
            const pausedAt = actualMonotonic()
            await delay(5_000)
            assert.ok(actualMonotonic() - pausedAt < 18_000, 'initial delay retains the unchanged idle bound')
          }
        },
        after: async (phase, count, rows, timing) => {
          if (phase === 'originals' && count === 1) { initialSuccess++; initialBound = actualQueryBound(rows!, timing); return }
          if (phase === 'lookup' && count === 2) {
            earliestStagingHooks++
            assert.ok(initialBound !== undefined && timing.repliedAt !== null)
            const stagingMs = Math.max(0, Math.ceil(initialBound - actualMonotonic() - 12_000))
            assert.ok(stagingMs < 18_000, 'earliest-bound staging must fit unchanged idle protection')
            if (stagingMs > 0) await delay(stagingMs)
            assert.ok(actualMonotonic() - timing.repliedAt < 18_000)
            note('bounded staging before earliest-bound final SQL', { stagingMs })
            return
          }
          if (phase !== 'originals' || count !== 2) return
          laterSuccess++
          assert.ok(initialBound !== undefined)
          const laterBound = actualQueryBound(rows!, timing), separation = laterBound - initialBound
          assert.ok(separation >= 2_000, 'first and final conservative bounds need a decisive measured separation')
          const releaseAt = (initialBound + laterBound) / 2
          const pauseMs = releaseAt - actualMonotonic()
          assert.ok(pauseMs > 0 && Math.ceil(pauseMs) < 18_000, 'distinguishing interval must be reachable within idle protection')
          const pausedAt = actualMonotonic()
          await delay(Math.ceil(pauseMs))
          const deliveredAt = actualMonotonic()
          assert.ok(deliveredAt - pausedAt < 18_000, 'actual earliest-bound response sleep remains strictly within R3')
          assert.ok(timing.repliedAt !== null && deliveredAt - timing.repliedAt < 18_000,
            'entire earliest-bound final-response idle interval stays within R3')
          assert.ok(deliveredAt > initialBound + 500 && deliveredAt < laterBound - 500,
            'release must be strictly beyond first bound and still safely before final bound')
          const actualExpiry = Math.min(...rows!.flatMap(row => ['expires_at', 'freshness_until', 'lifecycle_valid_until'].map(field => Date.parse(row[field]!))))
          assert.ok(Date.now() < actualExpiry, 'actual database expiry remains future')
          assert.ok(deliveredAt - caseStarted < 59_000, 'whole-operation deadline remains future')
          earlierConfirmed++
          note('earliest bound is decisive at actual response delivery', { initialDelayHooks, initialSuccess, laterSuccess,
            separationMs: Math.round(separation), afterFirstMs: Math.round(deliveredAt - initialBound),
            beforeFinalMs: Math.round(laterBound - deliveredAt), pauseMs: Math.ceil(pauseMs), actualPauseMs: Math.round(deliveredAt - pausedAt) })
        },
      }))
      assert.equal(initialDelayHooks, 1)
      assert.equal(initialSuccess, 1)
      assert.equal(earliestStagingHooks, 1)
      assert.equal(laterSuccess, 1)
      assert.equal(earlierConfirmed, 1)
      assert.equal(earliest.reason, 'freshness_lost', 'a faster later recheck must not extend the first conservative bound')
    } finally { earliestClock.mock.restore(); observedReaderClock = null; await restore() }
    note('earliest confirmed monotonic bound preserved across the faster later recheck')

    await align()
    let elapsedOffset = 0
    let budgetHooks = 0
    const clock = t.mock.method(performance, 'now', () => actualMonotonic() + elapsedOffset)
    try {
      const expiredBudget = nonpositive(await ownedRead('primary', { after: (phase, count) => {
        if (phase === 'originals' && count === 2) { budgetHooks++; elapsedOffset = 60_001 }
      } }))
      assert.equal(budgetHooks, 1, 'must reach actual successful final SQL before the isolated budget counterexample')
      assert.equal(expiredBudget.reason, 'deadline', 'explicit monotonic bound before the delayed timer callback can run')
    } finally { clock.mock.restore() }
    note('monotonic 60s budget enforced even before timeout callback delivery')

    await align()
    const waitObserver = await connect()
    await owner.query('BEGIN')
    await owner.query('SELECT singleton FROM official_original_private.head FOR UPDATE')
    const cancelledWait = new AbortController()
    const connectBeforeWait = LocalPgConnection.connect
    let actualWaitingPid: string | undefined
    LocalPgConnection.connect = async (...args: Parameters<typeof connectBeforeWait>) => {
      const connection = await connectBeforeWait.call(LocalPgConnection, ...args)
      if (args[1] === 'ot_original_test_reader') actualWaitingPid = (await connection.query('SELECT pg_backend_pid()::text AS pid'))[0]?.pid ?? undefined
      return connection
    }
    const waiting = readPersistedCanonicalRequirements(cluster, 'primary', key, witness, cancelledWait.signal)
    let observedLockWait = false
    try {
      const observeUntil = performance.now() + 5_000
      while (performance.now() < observeUntil) {
        // Separate autocommit observations avoid a statistics snapshot held by
        // the owner's deliberately open head-lock transaction.
        const waitingReaders = actualWaitingPid ? await waitObserver.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid::text=$1::text AND usename='ot_original_test_reader' AND wait_event_type='Lock'", [pgText(actualWaitingPid)]) : []
        observedLockWait = waitingReaders[0]?.n === '1'
        if (observedLockWait) break
        await delay(20)
      }
    } finally { cancelledWait.abort(); await owner.query('ROLLBACK'); close(waitObserver); LocalPgConnection.connect = connectBeforeWait }
    assert.equal(nonpositive(await waiting).reason, 'cancelled')
    assert.ok(actualWaitingPid, 'the reader backend itself must have connected')
    assert.equal(observedLockWait, true, 'abort only after the native reader is observed waiting for the lifecycle lock')
    // No test wrapper owns this cancellation path: inspect real role backends.
    const readersGone = async () => {
      for (let attempt = 0; attempt < 100; attempt++) {
        const count = (await owner.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE usename='ot_original_test_reader'"))[0]?.n
        if (count === '0') return
        await delay(20)
      }
      assert.fail('reader_backends_not_released')
    }
    await readersGone()
    note('cancelled lifecycle lock wait cannot return positive; reader backends actually cleared')

    const signature = 'official_original_api.lookup_current_version(text,bigint,text,bytea,text,text,bigint,text)'
    for (const role of ['anon', 'authenticated', 'service_role', 'ot_original_producer', 'ot_original_reviewer', 'ot_original_lifecycle']) {
      assert.equal((await owner.query('SELECT has_function_privilege($1::text,$2::text,\'EXECUTE\')::text AS allowed', [pgText(role), pgText(signature)]))[0]?.allowed, 'false')
      assert.equal((await owner.query('SELECT has_function_privilege($1::text,$2::text,\'EXECUTE\')::text AS allowed', [pgText(role), pgText(boundedSignature)]))[0]?.allowed, 'false')
      await owner.query(`BEGIN; SET LOCAL ROLE ${role}`)
      try { await assert.rejects(owner.query('SELECT outcome FROM official_original_api.lookup_current_version(NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL)'), code('42501')) }
      finally { await owner.query('ROLLBACK') }
      await owner.query(`BEGIN; SET LOCAL ROLE ${role}`)
      try { await assert.rejects(owner.query('SELECT ordinal FROM official_original_api.read_projection_candidate(NULL,NULL,NULL,NULL)'), code('42501')) }
      finally { await owner.query('ROLLBACK') }
    }
    assert.equal((await owner.query('SELECT has_function_privilege(\'public\',$1::text,\'EXECUTE\')::text AS allowed', [pgText(boundedSignature)]))[0]?.allowed, 'false')
    assert.equal((await owner.query('SELECT has_function_privilege(\'ot_original_reader\',$1::text,\'EXECUTE\')::text AS allowed', [pgText(boundedSignature)]))[0]?.allowed, 'true')
    await owner.query('BEGIN; SET LOCAL ROLE ot_original_reader')
    try { await assert.rejects(owner.query('SELECT expires_at FROM official_original_private.originals'), code('42501')) }
    finally { await owner.query('ROLLBACK') }
    note('existing non-reader roles denied without new grants')

    // Only now does the actual accepted corpus gain its second full receipt.
    // The composed proof is still real publication and a fresh owned read;
    // subsequent version cases deliberately retain all three/four receipts.
    await publish(composed)
    await align()
    const composedRead = positive(await ownedRead('composed'))
    assert.equal(composedRead.projection.recordFingerprint, composed.envelope.bundle.recordFingerprint)
    assert.equal(composedRead.projection.sources.length, 2)
    assert.ok(composedRead.projection.sources.every(source => source.sourceUrl.startsWith('https://regulations.example/rules/composed_')))
    assert.equal(composedRead.projection.evaluations.find(row => row.requirementType === 'visa')?.evidence.sourceUrl, null)
    note('composed: acknowledged COMMIT, producer gone, distinct fresh guarded and archive backends, one synthetic Visa')
    await align()
    let swappedHooks = 0
    const swapped = nonpositive(await ownedRead('composed', { alterRows: (phase, count, rows) => {
      if (phase !== 'originals' || count !== 2) return rows
      swappedHooks++; return [...rows].reverse()
    } }))
    assert.equal(swappedHooks, 1, 'must reach actual successful final composed query before swapping rows')
    assert.equal(swapped.reason, 'material_or_lifecycle_refused')
    note('swapped composed bound/material rows refuse', { hooks: swappedHooks })
    await publish(alternate)
    await align()
    assert.equal((await ownedRead('primary')).status, 'ambiguous')
    const beforeDamagedRival = Object.freeze({ ...witness })
    // A complete valid first candidate must not hide an unclassifiable rival.
    await align()
    await owner.query('SELECT official_original_private.append_event($1::text,$2::text)', [pgText('accepted'), pgText(`ot-provenance-v1:${'de'.repeat(32)}`)])
    witness = await cursor(owner); await align()
    const damagedRival = nonpositive(await ownedRead('primary'))
    assert.equal(damagedRival.reason, 'selection_refused')
    // Restore just the deliberately added last event/head from an external
    // known pre-event witness; never done by the reader, never hosted history.
    await owner.query('BEGIN; SET LOCAL session_replication_role=replica')
    await owner.query('DELETE FROM official_original_private.events WHERE sequence>$1::bigint', [pgText(beforeDamagedRival.sequence, 20)])
    await owner.query('UPDATE official_original_private.head SET sequence=$1::bigint,event_hash=$2::text,checked_at=clock_timestamp()',
      [pgText(beforeDamagedRival.sequence, 20), pgText(beforeDamagedRival.eventHash)])
    await owner.query('COMMIT')
    witness = beforeDamagedRival; await align()
    await lifecycleEvent('superseded', first.envelope.bundle.recordFingerprint)
    await align()
    const selectedAlternate = positive(await ownedRead('primary'))
    assert.equal(selectedAlternate.projection.recordFingerprint, alternate.envelope.bundle.recordFingerprint)
    assert.equal(selectedAlternate.projection.reviewPacketKey, firstRead.projection.reviewPacketKey)
    assert.deepEqual(selectedAlternate.projection.supportVersionIds, firstRead.projection.supportVersionIds)
    note('ambiguous versions refuse, damaged rival refuses entire set, supersession selects exactly the remaining unchanged-fact version')
    await align()
    await lifecycleEvent('superseded', alternate.envelope.bundle.recordFingerprint)
    await publish(forged)
    await align()
    const contradiction = nonpositive(await ownedRead('primary'))
    assert.equal(contradiction.reason, 'material_or_lifecycle_refused')
    note('fully rehashed stored fact passes native publication and closure but is rejected against actual originals')
    await owner.query(rollbackSql)
    assert.deepEqual(await objects(), oldObjects, 'rollback removes only the new function, preserving every old definition/relation')
    await align()
    const removed = nonpositive(await ownedRead('composed'))
    assert.equal(removed.status, 'unavailable', 'new positive path has no fallback when the candidate is missing')
    await align()
    const oldReader = await connect('ot_original_test_reader')
    await oldReader.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    const afterRollback = await lookupCurrentVersion(cluster, oldReader, persistedCanonicalReadContract('composed').request, key, witness)
    assert.equal(afterRollback.status, 'synthetic_current_version_verified')
    assert.equal(afterRollback.positiveVisaCells, 0)
    await oldReader.query('COMMIT'); close(oldReader)
    note('candidate rollback leaves old metadata readers intact and positive reader unavailable')
    note('complete native shared suite; synthetic only, no hosted apply or production authority')
  } finally {
    for (const connection of [...opened]) close(connection)
    cluster.stop()
  }
})
