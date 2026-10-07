// Native R2 regressions. Every cluster is disposable and owned by this runner.
import assert from 'node:assert/strict'
import { verifyLocalIntegratedPilotBundle, readIntegratedPilotArtifact, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { sha256Hex } from '../../../lib/readiness/digest'
import { provenanceHash } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { startLocalProofCluster, LOCAL_PG_DEADLINES } from './local-cluster'
import { LocalPgConnection, LocalPgError, pgText } from './pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, publishIntegratedBundle, persistVerifiedIntegratedBundleLocally, readVerifiedIntegratedBundleLocally } from './storage'
import { r2SemanticFixtures, r2RepresentationFixture } from './r2-fixtures'

const tables = ['artifact_names', 'artifact_blobs', 'artifacts', 'receipts', 'receipt_dependencies', 'artifact_dependencies', 'custody_bindings', 'custody_dependencies'] as const
const counts = (owner: LocalPgConnection) => owner.query(tables.map(table => `SELECT '${table}' AS t,count(*)::text AS n FROM official_provenance_private.${table}`).join(' UNION ALL ') + ' ORDER BY t')
const noRows = async (owner: LocalPgConnection) => assert.deepEqual(await counts(owner), tables.map(t => ({ t, n: '0' })).sort((a, b) => a.t.localeCompare(b.t)))
const sqlState = (expected: string) => (error: unknown) => error instanceof LocalPgError && error.code === expected
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
const backend = async (connection: LocalPgConnection) => (await connection.query('SELECT pg_catalog.pg_backend_pid()::text AS pid'))[0]!.pid!
const settingsSql = "SELECT current_setting('statement_timeout') AS statement,current_setting('lock_timeout') AS lock,current_setting('idle_in_transaction_session_timeout') AS idle_transaction,current_setting('idle_session_timeout') AS idle_session"

export async function runR2SemanticProof(primary: LocalIntegratedPilotEnvelope): Promise<string[]> {
  const checks: string[] = [], cluster = startLocalProofCluster(), owner = await LocalPgConnection.connect(cluster)
  try {
    await installLocalProofSchema(owner)
    const oids = await localArtifactTypeOids(owner), fixtures = r2SemanticFixtures(primary)
    for (const [name, envelope] of fixtures.positive) {
      assert.equal(verifyLocalIntegratedPilotBundle(envelope).ok, true, name)
      const writer = await LocalPgConnection.connect(cluster, 'ot_provenance_writer')
      try {
        await writer.query('BEGIN')
        assert.equal(await publishIntegratedBundle(writer, oids, envelope), 'inserted', name)
        await writer.query('ROLLBACK'); await noRows(owner)
      } finally { writer.close() }
      checks.push(`r2_native_positive_${name}`)
    }
    for (const [name, envelope] of fixtures.negative) {
      // Every artifact SHA and both receipt fingerprints are freshly rebuilt.
      // The passport case also passes all individual canonical artifact readers.
      for (const artifact of envelope.bundle.artifacts) assert.equal(sha256Hex(Buffer.from(artifact.canonicalBytes).toString('utf8')), artifact.pin.digest, name)
      assert.equal(provenanceHash('ot-provenance-v1', JSON.parse(Buffer.from(envelope.bundle.receiptBytes).toString('utf8'))), envelope.bundle.recordFingerprint, name)
      assert.equal(JSON.parse(Buffer.from(envelope.bundle.custodyBindingBytes).toString('utf8')).value.receiptFingerprint, envelope.bundle.recordFingerprint, name)
      assert.equal(verifyLocalIntegratedPilotBundle(envelope).ok, false, name)
      if (name === 'candidate_scope_mismatch') assert.ok(envelope.bundle.artifacts.every(a => readIntegratedPilotArtifact(a).ok))
      const writer = await LocalPgConnection.connect(cluster, 'ot_provenance_writer')
      try {
        await writer.query('BEGIN')
        // No TypeScript preflight in this low-level call to the public native SQL boundary.
        await assert.rejects(publishIntegratedBundle(writer, oids, envelope), sqlState('P0001'), name)
        // COMMIT after an aborted statement must roll back, never retain a partial package.
        await writer.query('COMMIT'); await noRows(owner)
        assert.equal((await readVerifiedIntegratedBundleLocally(cluster, envelope.bundle.recordFingerprint)).status, 'receipt_absent', name)
      } finally { writer.close() }
      checks.push(`r2_native_rehashed_${name}_refused_commit_empty_fresh_absent`)
    }
    const positive = await persistVerifiedIntegratedBundleLocally(cluster, oids, r2RepresentationFixture(primary, 16))
    assert.ok(positive.ok); assert.equal(positive.outcome, 'inserted')
    checks.push('r2_sixteen_representations_commit_independent_complete_verified_readback')
    return checks
  } finally { owner.close(); cluster.stop() }
}

/** Separate empty clusters make rollback evidence independent for each deadline. */
export async function runR2BackendProof(primary: LocalIntegratedPilotEnvelope): Promise<string[]> {
  const checks: string[] = []
  for (const scenario of ['statement', 'lock_and_idle_transaction', 'commit'] as const) {
    const cluster = startLocalProofCluster(), connections: LocalPgConnection[] = []
    const connect = async (user?: string) => { const c = await LocalPgConnection.connect(cluster, user); connections.push(c); return c }
    try {
      const owner = await connect(); await installLocalProofSchema(owner)
      const oids = await localArtifactTypeOids(owner), writer = await connect('ot_provenance_writer'), reader = await connect('ot_provenance_reader')
      for (const connection of [owner, writer, reader]) assert.deepEqual(await connection.query(settingsSql), [{ statement: '25s', lock: '15s', idle_transaction: '20s', idle_session: '0' }])
      if (scenario === 'commit') {
        // An ordinary, test-only deferred trigger executes inside COMMIT. It does
        // not alter provenance tables, their constraints, functions or grants.
        await owner.query("CREATE SCHEMA r2_deadline_probe; CREATE TABLE r2_deadline_probe.pending(id integer); CREATE FUNCTION r2_deadline_probe.wait_at_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_catalog.pg_sleep(60); RETURN NEW; END $$; CREATE CONSTRAINT TRIGGER r2_commit_wait AFTER INSERT ON r2_deadline_probe.pending DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION r2_deadline_probe.wait_at_commit(); GRANT USAGE ON SCHEMA r2_deadline_probe TO ot_provenance_writer; GRANT INSERT ON r2_deadline_probe.pending TO ot_provenance_writer")
      }
      await writer.query('BEGIN'); assert.equal(await publishIntegratedBundle(writer, oids, primary), 'inserted')
      const pid = await backend(writer)
      assert.equal((await readVerifiedIntegratedBundleLocally(cluster, primary.bundle.recordFingerprint)).status, 'receipt_absent')
      if (scenario === 'statement') {
        const started = performance.now()
        await assert.rejects(writer.query('SELECT pg_catalog.pg_sleep(60)'), sqlState('57014'))
        assert.ok(performance.now() - started >= LOCAL_PG_DEADLINES.statementMs - 500)
        assert.ok(performance.now() - started < 30_000)
        await writer.query('COMMIT')
        checks.push('r2_backend_statement_57014_before_transport_fallback_aborts_staged_bundle')
      } else if (scenario === 'lock_and_idle_transaction') {
        const waiter = await connect('ot_provenance_writer'), started = performance.now()
        await waiter.query('BEGIN')
        await assert.rejects(waiter.query('SELECT pg_catalog.pg_advisory_xact_lock(1869901924,1)'), sqlState('55P03'))
        assert.ok(performance.now() - started >= LOCAL_PG_DEADLINES.lockMs - 500)
        assert.ok(performance.now() - started < LOCAL_PG_DEADLINES.idleTransactionMs)
        await waiter.query('ROLLBACK')
        assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_locks WHERE pid=$1::integer AND locktype='advisory' AND granted", [pgText(pid, 23)]))[0]?.n, '1')
        // Do not query or close the holder: only PostgreSQL's idle-transaction
        // timer may terminate it and release its live publication lock.
        let alive = true
        while (performance.now() - started < 24_000) {
          alive = (await owner.query('SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer', [pgText(pid, 23)]))[0]?.n !== '0'
          if (!alive) break
          await delay(100)
        }
        assert.equal(alive, false)
        assert.ok(performance.now() - started >= LOCAL_PG_DEADLINES.idleTransactionMs - 1500)
        await assert.rejects(writer.query('SELECT 1'), LocalPgError)
        checks.push('r2_backend_lock_55P03_at_15_seconds_holder_still_locked', 'r2_backend_idle_transaction_terminated_at_20_seconds_without_client_close')
      } else {
        await writer.query('INSERT INTO r2_deadline_probe.pending VALUES (1)')
        const started = performance.now()
        await assert.rejects(writer.query('COMMIT'), sqlState('57P01'))
        assert.ok(performance.now() - started >= LOCAL_PG_DEADLINES.commitMs - 500)
        assert.ok(performance.now() - started < 30_000)
        assert.equal((await owner.query('SELECT count(*)::text AS n FROM r2_deadline_probe.pending'))[0]?.n, '0')
        checks.push('r2_backend_commit_guard_57P01_at_20_seconds_rolls_back_deferred_work_and_staged_bundle')
      }
      await noRows(owner)
      assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_locks WHERE pid=$1::integer AND locktype='advisory' AND granted", [pgText(pid, 23)]))[0]?.n, '0')
      assert.equal((await readVerifiedIntegratedBundleLocally(cluster, primary.bundle.recordFingerprint)).status, 'receipt_absent')
      const independent = await persistVerifiedIntegratedBundleLocally(cluster, oids, primary)
      assert.ok(independent.ok); assert.equal(independent.outcome, 'inserted')
      checks.push(`r2_${scenario}_all_eight_tables_empty_lock_released_independent_writer_verified_readback`)
    } finally { for (const connection of connections) connection.close(); cluster.stop() }
  }
  return checks
}
