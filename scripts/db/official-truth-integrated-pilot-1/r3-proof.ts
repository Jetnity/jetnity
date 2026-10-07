import assert from 'node:assert/strict'
import { verifyLocalIntegratedPilotBundle, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { contentEvidenceVersionV2 } from '../../../lib/readiness/official-truth-content-identity'
import { quelleUrlLesen } from '../../../lib/readiness/official'
import { sha256Hex } from '../../../lib/readiness/digest'
import { provenanceHash } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { startLocalProofCluster, LOCAL_PG_DEADLINES } from './local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type LocalPgOperationDiagnostic } from './pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, publishIntegratedBundle, persistVerifiedIntegratedBundleLocally, readVerifiedIntegratedBundleLocally } from './storage'
import { r3UrlFixtures, r3UrlCodecVectors } from './r3-fixtures'

const tables = ['artifact_names', 'artifact_blobs', 'artifacts', 'receipts', 'receipt_dependencies', 'artifact_dependencies', 'custody_bindings', 'custody_dependencies'] as const
const counts = (owner: LocalPgConnection) => owner.query(tables.map(t => `SELECT '${t}' AS t,count(*)::text AS n FROM official_provenance_private.${t}`).join(' UNION ALL ') + ' ORDER BY t')
const empty = async (owner: LocalPgConnection) => assert.deepEqual(await counts(owner), tables.map(t => ({ t, n: '0' })).sort((a, b) => a.t.localeCompare(b.t)))
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
const sqlState = (expected: string) => (error: unknown) => error instanceof LocalPgError && error.code === expected

async function urlProof(primary: LocalIntegratedPilotEnvelope, checks: string[]) {
  const fixtures = r3UrlFixtures(primary), cluster = startLocalProofCluster(), owner = await LocalPgConnection.connect(cluster)
  let codecComparisons = 0
  try {
    await installLocalProofSchema(owner)
    const identity = JSON.parse(Buffer.from(primary.bundle.artifacts.find(a => a.artifactType === 'AcceptedEvidenceCustodyV1')!.canonicalBytes).toString()).value.evidenceIdentity
    const { versionId: _version, ...preimage } = identity; void _version
    const vectors = r3UrlCodecVectors()
    for (const role of ['extractor', 'identity'] as const) {
      const rows = await owner.query("SELECT u,official_provenance_private.canonical_url(u,$2::text)::text AS allowed FROM pg_catalog.jsonb_array_elements_text($1::jsonb) AS v(u)", [pgText(JSON.stringify(vectors)), pgText(role)])
      for (const row of rows) {
        const expected = role === 'extractor' ? quelleUrlLesen(row.u) === row.u : contentEvidenceVersionV2({ ...preimage, canonicalUrl: row.u }).ok
        assert.equal(row.allowed, String(expected), JSON.stringify({ role, url: row.u })); codecComparisons++
      }
      checks.push(`r3_native_${role}_url_codec_matches_frozen_reader`)
    }
    const oids = await localArtifactTypeOids(owner)
    for (const [name, envelope] of fixtures.negative) {
      assert.equal(verifyLocalIntegratedPilotBundle(envelope).ok, false, name)
      for (const artifact of envelope.bundle.artifacts) assert.equal(sha256Hex(Buffer.from(artifact.canonicalBytes).toString()), artifact.pin.digest)
      assert.equal(provenanceHash('ot-provenance-v1', JSON.parse(Buffer.from(envelope.bundle.receiptBytes).toString())), envelope.bundle.recordFingerprint)
      assert.equal(JSON.parse(Buffer.from(envelope.bundle.custodyBindingBytes).toString()).value.receiptFingerprint, envelope.bundle.recordFingerprint)
      const writer = await LocalPgConnection.connect(cluster, 'ot_provenance_writer')
      try {
        await writer.query('BEGIN')
        await assert.rejects(publishIntegratedBundle(writer, oids, envelope), sqlState('P0001'), name)
        await writer.query('COMMIT'); await empty(owner)
        assert.equal((await readVerifiedIntegratedBundleLocally(cluster, envelope.bundle.recordFingerprint)).status, 'receipt_absent')
      } finally { writer.close() }
      checks.push(`r3_native_rehashed_${name}_refused_commit_empty_fresh_absent`)
    }
  } finally { owner.close(); cluster.stop() }
  for (const [name, envelope] of fixtures.positive) {
    assert.equal(verifyLocalIntegratedPilotBundle(envelope).ok, true, name)
    const positiveCluster = startLocalProofCluster(), owner = await LocalPgConnection.connect(positiveCluster)
    try {
      await installLocalProofSchema(owner)
      const connection = await LocalPgConnection.connect(positiveCluster, 'ot_provenance_writer')
      try {
        await connection.query('BEGIN')
        assert.equal(await publishIntegratedBundle(connection, await localArtifactTypeOids(owner), envelope), 'inserted')
        await connection.query('COMMIT')
        assert.equal(connection.operationDiagnostics.at(-1)?.commitAcknowledged, true)
        assert.equal(connection.operationDiagnostics.at(-1)?.protectionFailure, undefined)
        const readback = await readVerifiedIntegratedBundleLocally(positiveCluster, envelope.bundle.recordFingerprint)
        assert.equal(readback.status, 'verified'); if (readback.status !== 'verified') throw Error('r3_positive_readback')
        assert.deepEqual(Buffer.from(readback.envelope.bundle.receiptBytes), Buffer.from(envelope.bundle.receiptBytes))
        assert.deepEqual(Buffer.from(readback.envelope.bundle.custodyBindingBytes), Buffer.from(envelope.bundle.custodyBindingBytes))
        assert.equal(readback.envelope.bundle.artifacts.length, envelope.bundle.artifacts.length)
        for (const a of envelope.bundle.artifacts) assert.deepEqual(Buffer.from(readback.envelope.bundle.artifacts.find(b => b.pin.id === a.pin.id && b.pin.version === a.pin.version)!.canonicalBytes), Buffer.from(a.canonicalBytes))
      } finally { connection.close() }
      checks.push(`r3_native_${name}_public_commit_full_verified_readback_normal_disarm`)
    } finally { owner.close(); positiveCluster.stop() }
  }
  return { codecComparisons, postgresVersion: cluster.version }
}

async function guardProof(primary: LocalIntegratedPilotEnvelope, checks: string[]) {
  const evidence: { scenario: string; elapsedAfterLossMs: number; outcome: string; diagnostic: LocalPgOperationDiagnostic | undefined }[] = []
  for (const scenario of ['cancel', 'terminate', 'dispatch_gap', 'ack_race'] as const) {
    const cluster = startLocalProofCluster(), connect = LocalPgConnection.connect, owner = await connect(cluster)
    let writer: LocalPgConnection | undefined, writerPid = '', recoveryDelay = false, lossAt = 0
    let commitHeld = false
    const connections: LocalPgConnection[] = []
    try {
      await installLocalProofSchema(owner)
      const deferredWait = scenario === 'ack_race' ? 'pg_catalog.pg_advisory_xact_lock(19003,1)' : 'pg_catalog.pg_sleep(60)'
      if (scenario === 'ack_race') await owner.query('SELECT pg_catalog.pg_advisory_lock(19003,1)')
      await owner.query(`CREATE SCHEMA r3_guard_probe;CREATE TABLE r3_guard_probe.pending(id integer);CREATE FUNCTION r3_guard_probe.wait_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM ${deferredWait};RETURN NEW;END $$;CREATE CONSTRAINT TRIGGER r3_wait AFTER INSERT ON r3_guard_probe.pending DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION r3_guard_probe.wait_commit();GRANT USAGE ON SCHEMA r3_guard_probe TO ot_provenance_writer;GRANT INSERT ON r3_guard_probe.pending TO ot_provenance_writer`)
      const oids = await localArtifactTypeOids(owner)
      // Fault injection changes no ACK, SQL result or target identity. The race
      // adds an owned control-path scheduling delay within the fixed 5s bound;
      // COMMIT and its acknowledged durable publication remain real PostgreSQL.
      LocalPgConnection.connect = async (candidate, user) => {
        const c = await connect(candidate, user); connections.push(c)
        const query = c.query.bind(c)
        if (candidate === cluster && user === 'ot_provenance_writer') {
          if (scenario === 'dispatch_gap') {
            // Hold only the actual COMMIT frame before kernel dispatch. All
            // PostgreSQL connections, earlier publication and results stay real.
            // On guard loss the original idle transaction must be terminated;
            // no COMMIT frame or ACK is ever fabricated by this fixture.
            const socket = Reflect.get(c, 'socket') as { write(bytes: Buffer): boolean }
            const write = socket.write.bind(socket)
            socket.write = bytes => {
              if (bytes[0] === 81 && bytes.subarray(5).toString() === 'COMMIT\0') { commitHeld = true; return true }
              return write(bytes)
            }
          }
          writer = c; writerPid = (await query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
          c.query = async (sql, parameters) => { if (sql === 'COMMIT') await query('INSERT INTO r3_guard_probe.pending VALUES(1)'); return query(sql, parameters) }
        } else if (candidate === cluster && scenario === 'ack_race') {
          c.query = async (sql, parameters) => {
            if (sql.includes('pg_terminate_backend(a.pid,1000)')) { recoveryDelay = true; await pause(1500) }
            return query(sql, parameters)
          }
        }
        return c
      }
      let settled = false
      const operation = persistVerifiedIntegratedBundleLocally(cluster, oids, primary).finally(() => { settled = true })
      void operation.catch(() => { /* Observed below after the activity barrier. */ })
      // Cancel/terminate/ACK-race must observe actual deferred COMMIT. The
      // additional dispatch-gap case observes the original idle transaction
      // with its COMMIT frame held after arming. Identify guard by activity/birth.
      let observed = false
      const start = performance.now()
      // Observe across the bounded publication statement AND deferred COMMIT;
      // 29s from before publication can expire before a valid20s COMMIT begins.
      const observationMs = LOCAL_PG_DEADLINES.statementMs + LOCAL_PG_DEADLINES.commitMs + 5_000
      let observedTarget: { state: string | null; wait: string | null } | undefined
      while (!settled && performance.now() - start < observationMs) {
        if (writerPid) {
          const rows = await owner.query("SELECT pid::text AS pid,backend_start::text AS birth,state,wait_event,query FROM pg_catalog.pg_stat_get_activity(NULL) WHERE pid=$1::integer OR (state='active' AND wait_event='PgSleep' AND query LIKE 'SELECT pg_catalog.pg_terminate_backend(a.pid)%')", [pgText(writerPid, 23)])
          const target = rows.find(r => r.pid === writerPid && (scenario === 'dispatch_gap' ? commitHeld && r.state === 'idle in transaction' : r.state === 'active' && r.wait_event === (scenario === 'ack_race' ? 'advisory' : 'PgSleep') && r.query === 'COMMIT')), guard = rows.filter(r => r.pid !== writerPid)
          const activity = rows.find(r => r.pid === writerPid)
          if (activity) observedTarget = { state: activity.state ?? null, wait: activity.wait_event ?? null }
          if (target && guard.length === 1) {
            lossAt = performance.now()
            const fn = scenario === 'terminate' ? 'pg_terminate_backend' : 'pg_cancel_backend'
            const stopped = await owner.query(`SELECT pg_catalog.${fn}(pid)::text AS stopped FROM pg_catalog.pg_stat_get_activity($1::integer) WHERE backend_start=$2::timestamptz AND state='active' AND wait_event='PgSleep' AND query LIKE 'SELECT pg_catalog.pg_terminate_backend(a.pid)%'`, [pgText(guard[0]!.pid!, 23), pgText(guard[0]!.birth!)])
            assert.equal(stopped[0]?.stopped, 'true')
            if (scenario === 'ack_race') {
              // Hold real deferred COMMIT until the guard failure is observed.
              // Then release its native barrier while owned recovery is delayed.
              for (let i = 0; i < 100 && !recoveryDelay; i++) await pause(10)
              assert.ok(recoveryDelay, 'native ACK race must observe guard loss before release')
              assert.equal((await owner.query('SELECT pg_catalog.pg_advisory_unlock(19003,1)::text AS released'))[0]?.released, 'true')
            }
            observed = true; break
          }
        }
        await pause(10)
      }
      assert.ok(observed, JSON.stringify({ reason: 'native_guard_observation_barrier', scenario, settled, observedTarget, elapsedMs: Math.ceil(performance.now() - start), operations: writer?.operationDiagnostics }))
      if (scenario === 'ack_race') {
        let completedNative = false
        for (let i = 0; i < 100 && !settled; i++) {
          const row = (await owner.query('SELECT state,xact_start::text AS transaction FROM pg_catalog.pg_stat_get_activity($1::integer)', [pgText(writerPid, 23)]))[0]
          if (row?.state === 'idle' && row.transaction === null) { completedNative = true; break }
          await pause(10)
        }
        assert.ok(recoveryDelay && completedNative && !settled)
        await assert.rejects(writer!.query('SELECT 1'), sqlState('connection_state'))
      }
      // In the dispatch gap, only a real backend termination can settle this
      // held transport operation. Socket closure/rollback is independently read.
      const result = await operation, elapsedAfterLossMs = Math.ceil(performance.now() - lossAt)
      const diagnostic = writer!.operationDiagnostics.findLast(d => d.phase === 'commit')
      assert.equal(diagnostic?.protectionFailure, 'commit_guard_lost')
      LocalPgConnection.connect = connect
      // Completion includes fresh semantic readback in the acknowledged case;
      // the operational stop assertion is for the interrupted COMMIT itself.
      if (scenario !== 'ack_race') {
        assert.ok(elapsedAfterLossMs < LOCAL_PG_DEADLINES.commitRecoveryMs)
        assert.deepEqual(result, { ok: false, reason: 'commit_outcome_unknown', commitProtectionFailure: 'commit_guard_lost' })
        assert.equal(diagnostic?.commitAcknowledged, false); assert.equal(diagnostic?.code, '57P01')
        await empty(owner)
        assert.equal((await owner.query('SELECT count(*)::text AS n FROM r3_guard_probe.pending'))[0]?.n, '0')
        assert.equal((await readVerifiedIntegratedBundleLocally(cluster, primary.bundle.recordFingerprint)).status, 'receipt_absent')
      } else {
        assert.ok(result.ok); assert.equal(result.commitProtectionFailure, 'commit_guard_lost')
        assert.equal(diagnostic?.commitAcknowledged, true)
        assert.equal((await owner.query('SELECT count(*)::text AS n FROM r3_guard_probe.pending'))[0]?.n, '1')
      }
      assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_locks WHERE pid=$1::integer AND locktype='advisory' AND granted", [pgText(writerPid, 23)]))[0]?.n, '0')
      const recovery = await persistVerifiedIntegratedBundleLocally(cluster, oids, primary)
      assert.ok(recovery.ok); assert.equal(recovery.outcome, scenario === 'ack_race' ? 'idempotent' : 'inserted')
      checks.push(`r3_native_post_arming_${scenario}_observed_protection_loss_honest_outcome_independent_writer_readback`)
      evidence.push({ scenario, elapsedAfterLossMs, outcome: result.ok ? 'acknowledged_verified_commit' : result.reason, diagnostic })
    } finally { LocalPgConnection.connect = connect; for (const c of connections) c.close(); owner.close(); cluster.stop() }
  }
  return evidence
}

export async function runR3NativeProof(primary: LocalIntegratedPilotEnvelope) {
  assert.equal(verifyLocalIntegratedPilotBundle(primary).ok, true)
  const checks: string[] = []
  const urls = await urlProof(primary, checks)
  const guardLoss = await guardProof(primary, checks)
  return { status: 'PASS' as const, ...urls, checks, guardLoss }
}
