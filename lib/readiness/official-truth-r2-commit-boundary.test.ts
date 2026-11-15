import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Socket } from 'node:net'
import { findLocalPgBins, startLocalProofCluster, type LocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, localPgCommitWasNotDispatched, pgText } from '../../scripts/db/official-truth-integrated-pilot-1/pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, persistVerifiedIntegratedBundleLocally, readVerifiedIntegratedBundleLocally } from '../../scripts/db/official-truth-integrated-pilot-1/storage'

test('R2 unsent COMMIT evidence cannot be constructed by a caller', () => {
  assert.equal(localPgCommitWasNotDispatched(new LocalPgError('commit_deadline_not_armed')), false)
  assert.equal(localPgCommitWasNotDispatched(Object.assign(new LocalPgError('connection_state'), { commitDispatched: false })), false)
  assert.equal(localPgCommitWasNotDispatched(Object.create(LocalPgError.prototype)), false)
})

const tables = ['artifact_names', 'artifact_blobs', 'artifacts', 'receipts', 'receipt_dependencies', 'artifact_dependencies', 'custody_bindings', 'custody_dependencies'] as const
async function empty(owner: LocalPgConnection) {
  const counts = tables.map(name => `SELECT count(*) AS n FROM official_provenance_private.${name}`)
  const rows = await owner.query(`SELECT sum(n)::text AS n FROM (${counts.join(' UNION ALL ')}) totals`)
  assert.equal(rows[0]?.n, '0')
  assert.equal((await owner.query('SELECT count(*)::text AS n FROM r2_boundary_probe.pending'))[0]?.n, '0')
}

/** Native snapshot fault injection substitutes another real sleeping backend.
 * It changes no server result, ACK, deadline or birth. PostgreSQL must reject
 * that PID when it does not carry the original guard's independently read birth.
 * This exercises identity mismatch; it does not claim to force OS PID reuse. */
async function rejectOtherGuard(cluster: LocalProofCluster, owner: LocalPgConnection, stage: 'control' | 'arming') {
  const connect = LocalPgConnection.connect
  const writer = await connect(cluster, 'ot_provenance_writer'), foreign = await connect(cluster)
  const foreignIdentity = (await foreign.query('SELECT pid::text AS pid,backend_start::text AS birth FROM pg_catalog.pg_stat_get_activity(pg_catalog.pg_backend_pid())'))[0]!
  const foreignPid = foreignIdentity.pid!, foreignBirth = foreignIdentity.birth!
  assert.ok(foreignPid && foreignBirth)
  let foreignSettled = false
  const foreignOperation = foreign.query('SELECT pg_catalog.pg_sleep(20)').then(() => null, error => error).finally(() => { foreignSettled = true })
  const connections: LocalPgConnection[] = []
  const cancels: { pid: string; birth: string }[] = []
  const observed: { original?: { pid: string; birth: string }; guard?: LocalPgConnection } = {}
  let redirected = 0, excluded = 0, commitFrames = 0, actualWaitObserved = false
  const socket = Reflect.get(writer, 'socket') as Socket, write = socket.write.bind(socket)
  socket.write = ((bytes: Buffer) => {
    if (bytes[0] === 81 && bytes.subarray(5).toString() === 'COMMIT\0') commitFrames++
    return write(bytes)
  }) as Socket['write']
  try {
    await writer.query('BEGIN')
    await writer.query('INSERT INTO r2_boundary_probe.pending VALUES(10,1,false)')
    LocalPgConnection.connect = async (...args: Parameters<typeof LocalPgConnection.connect>) => {
      const c = await connect(...args); connections.push(c)
      const query = c.query.bind(c)
      c.query = async (sql, parameters = []) => {
        if (sql.includes('pg_stat_get_activity(pg_catalog.pg_backend_pid())')) observed.guard = c
        const first = sql.startsWith('SELECT backend_start::text AS birth FROM pg_catalog.pg_stat_get_activity($1::integer)')
        const arming = sql.startsWith('SELECT state,wait_event')
        if (first) observed.original = { pid: Buffer.from(parameters[0]!.bytes).toString(), birth: parameters[1] ? Buffer.from(parameters[1].bytes).toString() : '' }
        if (sql.startsWith('SELECT pg_catalog.pg_cancel_backend(a.pid)')) cancels.push({ pid: Buffer.from(parameters[0]!.bytes).toString(), birth: Buffer.from(parameters[1]!.bytes).toString() })
        if (arming && stage === 'arming') {
          // Inject the late mismatch only after the real original guard is
          // sleeping. Earlier genuine rows keep the existing arming loop alive.
          const originalRows = await query(sql, parameters)
          if (originalRows[0]?.state !== 'active' || originalRows[0]?.wait_event !== 'PgSleep') return originalRows
          actualWaitObserved = true
        }
        if (arming || first && stage === 'control') {
          redirected++
          const rows = await query(sql, [pgText(foreignPid, 23), ...parameters.slice(1)])
          if (rows.length === 0) excluded++
          return rows
        }
        return query(sql, parameters)
      }
      return c
    }
    let failure: unknown
    try { await writer.query('COMMIT') } catch (error) { failure = error }
    assert.ok(localPgCommitWasNotDispatched(failure))
    assert.equal(failure.code, 'commit_deadline_not_armed')
    assert.equal(commitFrames, 0)
    assert.ok(redirected > 0); assert.equal(excluded, 1)
    assert.ok(observed.original?.birth)
    assert.equal(writer.operationDiagnostics.findLast(d => d.phase === 'commit')?.commitDispatched, false)
    assert.equal(writer.operationDiagnostics.findLast(d => d.phase === 'commit')?.commitAcknowledged, false)
    if (stage === 'control') assert.deepEqual(cancels, [])
    else {
      assert.equal(actualWaitObserved, true)
      assert.deepEqual(cancels, [observed.original])
      assert.equal(observed.guard?.operationDiagnostics.at(-1)?.code, '57014')
    }
    // The rejected transaction remains local and must still be rolled back.
    await writer.query('ROLLBACK')
    await empty(owner)
    const live = await owner.query('SELECT state,wait_event FROM pg_catalog.pg_stat_get_activity($1::integer) WHERE backend_start=$2::timestamptz', [pgText(foreignPid, 23), pgText(foreignBirth)])
    assert.deepEqual(live, [{ state: 'active', wait_event: 'PgSleep' }])
    assert.equal(foreignSettled, false)
  } finally {
    LocalPgConnection.connect = connect
    socket.write = write as Socket['write']
    if (!foreignSettled) await owner.query('SELECT pg_catalog.pg_cancel_backend(a.pid) FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz', [pgText(foreignPid, 23), pgText(foreignBirth)])
    await foreignOperation
    for (const c of connections) c.close()
    writer.close(); foreign.close()
  }
}

test('R2 native deferred checks finish before COMMIT and guard identity fails closed', { timeout: 120_000 }, async context => {
  assert.ok(findLocalPgBins(), 'NOT_VERIFIED: local PostgreSQL binaries are required; no hosted fallback or emulator')
  const { runControlledSyntheticPilot } = await import('../../scripts/official-truth-integrated-pilot-1/controlled-runtime')
  const primary = await runControlledSyntheticPilot('primary')
  assert.equal(primary.status, 'synthetic_bundle_verified')
  if (primary.status !== 'synthetic_bundle_verified') throw Error('r2_boundary_baseline_missing')
  const cluster = startLocalProofCluster(), connect = LocalPgConnection.connect, owner = await connect(cluster)
  const connections: LocalPgConnection[] = [], checks: string[] = []
  let knownUnsent: LocalPgError | undefined
  try {
    await installLocalProofSchema(owner)
    const oids = await localArtifactTypeOids(owner)
    await owner.query("CREATE SCHEMA r2_boundary_probe; CREATE TABLE r2_boundary_probe.parent(id integer PRIMARY KEY); INSERT INTO r2_boundary_probe.parent VALUES(1); CREATE TABLE r2_boundary_probe.pending(id integer PRIMARY KEY,parent_id integer REFERENCES r2_boundary_probe.parent DEFERRABLE INITIALLY DEFERRED,reject boolean NOT NULL); CREATE FUNCTION r2_boundary_probe.reject_deferred() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.reject THEN RAISE EXCEPTION 'r2_boundary_constraint'; END IF; RETURN NEW; END $$; CREATE CONSTRAINT TRIGGER r2_boundary_constraint AFTER INSERT ON r2_boundary_probe.pending DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION r2_boundary_probe.reject_deferred(); GRANT USAGE ON SCHEMA r2_boundary_probe TO ot_provenance_writer; GRANT INSERT ON r2_boundary_probe.pending TO ot_provenance_writer")
    // Neither probe changes a provenance function, grant, table or constraint.
    // The FK and trigger are genuinely deferred until the adapter drains them.
    for (const scenario of ['foreign_key', 'constraint_trigger'] as const) {
      let commits = 0, rollbacks = 0, injected = false
      LocalPgConnection.connect = async (...args: Parameters<typeof LocalPgConnection.connect>) => {
        const c = await connect(...args); connections.push(c)
        if (args[0] === cluster && args[1] === 'ot_provenance_writer') {
          const query = c.query.bind(c)
          c.query = async (sql, parameters) => {
            if (sql === 'COMMIT') commits++
            if (sql === 'ROLLBACK') rollbacks++
            const rows = await query(sql, parameters)
            if (sql.includes('publish_local_integrated_v2')) {
              await query(scenario === 'foreign_key' ? 'INSERT INTO r2_boundary_probe.pending VALUES(1,999,false)' : 'INSERT INTO r2_boundary_probe.pending VALUES(2,1,true)')
              injected = true
            }
            return rows
          }
        }
        return c
      }
      try {
        await assert.rejects(persistVerifiedIntegratedBundleLocally(cluster, oids, primary.envelope), error => error instanceof LocalPgError && error.code === (scenario === 'foreign_key' ? '23503' : 'P0001') && !localPgCommitWasNotDispatched(error))
      } finally { LocalPgConnection.connect = connect }
      assert.equal(injected, true); assert.equal(commits, 0); assert.equal(rollbacks, 1)
      await empty(owner)
      assert.equal((await readVerifiedIntegratedBundleLocally(cluster, primary.envelope.bundle.recordFingerprint)).status, 'receipt_absent')
      checks.push(`${scenario}_native_failure_before_commit_rollback_fresh_absent`)
    }
    // A closed writer before COMMIT dispatch proves only unsent, not rollback.
    // Require the adapter to throw after its rollback attempt, then independently
    // inspect the stored state rather than returning a fabricated success.
    let rollbacks = 0
    LocalPgConnection.connect = async (...args: Parameters<typeof LocalPgConnection.connect>) => {
      const c = await connect(...args); connections.push(c)
      if (args[0] === cluster && args[1] === 'ot_provenance_writer') {
        const query = c.query.bind(c)
        c.query = async (sql, parameters) => {
          if (sql === 'COMMIT') c.close()
          if (sql === 'ROLLBACK') rollbacks++
          return query(sql, parameters)
        }
      }
      return c
    }
    try {
      await assert.rejects(persistVerifiedIntegratedBundleLocally(cluster, oids, primary.envelope), error => {
        if (!localPgCommitWasNotDispatched(error)) return false
        knownUnsent = error; return error.code === 'connection_state'
      })
    } finally { LocalPgConnection.connect = connect }
    assert.equal(rollbacks, 1); assert.ok(knownUnsent)
    await empty(owner)
    assert.equal((await readVerifiedIntegratedBundleLocally(cluster, primary.envelope.bundle.recordFingerprint)).status, 'receipt_absent')
    checks.push('adapter_unsent_commit_throws_after_rollback_attempt_fresh_absent')

    for (const stage of ['control', 'arming'] as const) {
      await rejectOtherGuard(cluster, owner, stage)
      checks.push(`${stage}_other_backend_birth_refused_original_guard_only_cleanup`)
    }

    // A throw after the extended frame handoff is conservatively dispatched,
    // even if the throwing transport reuses an earlier unsent error object.
    const writer = await connect(cluster, 'ot_provenance_writer'); connections.push(writer)
    await writer.query('BEGIN')
    const socket = Reflect.get(writer, 'socket') as Socket, write = socket.write.bind(socket)
    let extended = false, failure: unknown
    socket.write = ((bytes: Buffer) => {
      if (bytes[0] === 80) { extended = true; throw knownUnsent }
      return write(bytes)
    }) as Socket['write']
    try { await writer.query('COMMIT', [pgText('unused')]) } catch (error) { failure = error }
    finally { socket.write = write as Socket['write'] }
    assert.equal(extended, true)
    assert.ok(failure instanceof LocalPgError); assert.notEqual(failure, knownUnsent)
    assert.equal(localPgCommitWasNotDispatched(failure), false)
    assert.equal(writer.operationDiagnostics.findLast(d => d.phase === 'commit')?.commitDispatched, true)
    assert.equal(writer.operationDiagnostics.findLast(d => d.phase === 'commit')?.commitAcknowledged, false)
    await writer.query('ROLLBACK')
    await empty(owner)
    checks.push('extended_commit_handoff_cannot_reuse_old_unsent_error')
    context.diagnostic(JSON.stringify({ schema: 'jetnity.native.r2-commit-boundary.v1', checks, productionActivation: false, hostedApply: false }))
  } finally {
    LocalPgConnection.connect = connect
    for (const c of connections) c.close()
    owner.close(); cluster.stop()
  }
})
