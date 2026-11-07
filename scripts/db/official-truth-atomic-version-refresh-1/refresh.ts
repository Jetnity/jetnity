// Owned native-local refresh, never imported by an application/provider route.
import 'server-only'
import { performance } from 'node:perf_hooks'
import { historicalValuesEqual, immutable, ownRecord } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { verifyLocalIntegratedPilotBundle } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { assertOwnedLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, pgBytes, pgCompositeArray, pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import { localArtifactTypeOids } from '../official-truth-integrated-pilot-1/storage'
import { historicalProjectionCurrent, projectHistoricalCanonicalRequirements } from '../official-truth-persisted-canonical-read-1/projection'
import { readPersistedCanonicalRequirements, type PersistedCanonicalReadResult } from '../official-truth-persisted-canonical-read-1/reader'
import type { Cursor } from '../official-truth-original-custody-1/storage'
import { ATOMIC_REFRESH_COMMON, ATOMIC_REFRESH_LIMITS, ATOMIC_REFRESH_LOGIN, ownAtomicRefreshRequest, type OwnedAtomicRefreshRequest } from './contract'

type Readback = Extract<PersistedCanonicalReadResult, { status: 'synthetic_persisted_requirements_verified' }>
type FailureReason = 'context_invalid' | 'cancelled' | 'deadline' | 'precommit_refused' | 'producer_exit_unproved'
  | 'readback_failed' | 'currentness_lost' | 'commit_unacknowledged'
type Common = typeof ATOMIC_REFRESH_COMMON
export type AtomicRefreshResult = Common & (
  | Readonly<{ status: 'synthetic_atomic_refresh_verified'; commitStatus: 'acknowledged'; producerClosed: true;
    predecessor: string; successor: string; witness: Cursor; sourceContent: 'unchanged'; ruleChange: 'not_asserted';
    syntheticVisaCells: 1; readback: Readback; sqlPhaseMs: Readonly<Record<string, number>> }>
  | Readonly<{ status: 'refused' | 'unavailable' | 'commit_outcome_unknown' | 'committed_readback_unavailable';
    reason: FailureReason; commitStatus: 'not_attempted' | 'attempted_unacknowledged' | 'acknowledged';
    syntheticVisaCells: 0; evaluations: readonly [] }>
)
const phaseNames = ['publish', 'head_wait', 'old_lookup', 'old_reproof', 'bind', 'old_final_reproof', 'supersede', 'new_lookup', 'new_reproof', 'total']
function stamp(input: string | null | undefined): number {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(input)) throw Error('refresh_response')
  const value = Date.parse(input)
  if (!Number.isFinite(value) || new Date(value).toISOString() !== `${input.slice(0, 23)}Z`) throw Error('refresh_response')
  return value
}

/** No user connection, clock, callback, current list or registry can enter. */
export async function refreshPersistedCanonicalVersion(cluster: LocalProofCluster, input: unknown, key: string, signal?: AbortSignal): Promise<AtomicRefreshResult> {
  const operationDeadline = performance.now() + ATOMIC_REFRESH_LIMITS.operationMs
  let owned: OwnedAtomicRefreshRequest
  let commitAttempted = false, commitAcknowledged = false
  const failure = (reason: FailureReason, unavailable = false): AtomicRefreshResult => immutable({ ...ATOMIC_REFRESH_COMMON,
    status: commitAcknowledged ? 'committed_readback_unavailable' : commitAttempted ? 'commit_outcome_unknown' : unavailable ? 'unavailable' : 'refused',
    reason: commitAttempted && !commitAcknowledged ? 'commit_unacknowledged' : reason,
    commitStatus: commitAcknowledged ? 'acknowledged' : commitAttempted ? 'attempted_unacknowledged' : 'not_attempted', syntheticVisaCells: 0, evaluations: [] as const })
  try {
    if (arguments.length < 3 || arguments.length > 4 || typeof key !== 'string' || !/^[a-f0-9]{64}$/.test(key)
      || (signal !== undefined && !(signal instanceof AbortSignal))) return failure('context_invalid')
    assertOwnedLocalProofCluster(cluster)
    owned = ownAtomicRefreshRequest(input) // all caller bytes owned before first await
  } catch { return failure('context_invalid') }
  if (signal?.aborted) return failure('cancelled')
  const lifetime = new AbortController()
  let producer: LocalPgConnection | undefined, monitor: LocalPgConnection | undefined
  let producerClosed = false, timedOut = false, closeFailed = false, storedDeadline = Infinity
  const closeProducer = () => {
    if (producer && !producerClosed) { producerClosed = true; try { producer.close() } catch { closeFailed = true } }
  }
  const cancel = () => { lifetime.abort(); closeProducer(); try { monitor?.close() } catch { closeFailed = true } }
  const expired = () => {
    if (performance.now() >= operationDeadline) { timedOut = true; cancel() }
    return timedOut || lifetime.signal.aborted || signal?.aborted
  }
  const current = () => {
    if (expired()) throw Error('refresh_cancelled')
    if (performance.now() >= storedDeadline) throw Error('refresh_bound_elapsed')
  }
  signal?.addEventListener('abort', cancel, { once: true })
  const operationTimer = setTimeout(() => { timedOut = true; cancel() }, Math.max(0, operationDeadline - performance.now()))
  let exitTimer: ReturnType<typeof setTimeout> | undefined
  try {
    current()
    // Canonical Old reproof uses the unchanged owned #1151 reader. Its selected
    // fingerprint and witness must be exactly the caller's external CAS pair;
    // no producer-memory assertion can stand in for that retained-store read.
    const predecessor = await readPersistedCanonicalRequirements(cluster, owned.contract.mode, key, owned.witness, lifetime.signal)
    current()
    if (predecessor.status !== 'synthetic_persisted_requirements_verified'
      || predecessor.projection.recordFingerprint !== owned.expectedPredecessor
      || !historicalValuesEqual(predecessor.witness, owned.witness)
      || !historicalProjectionCurrent(predecessor.projection)) return failure('precommit_refused')
    const check = verifyLocalIntegratedPilotBundle(owned.prepared.envelope)
    if (!check.ok) return failure('precommit_refused')
    // The unchanged canonical extraction/Review/Rule/Requirements path runs on
    // the owned actual raw bodies. Hash-consistent false facts cannot pass.
    const precommitProjection = await projectHistoricalCanonicalRequirements(check.value, owned.prepared.bodies, owned.contract.mode, lifetime.signal)
    current()
    if (!historicalProjectionCurrent(precommitProjection) || !historicalProjectionCurrent(predecessor.projection)) return failure('currentness_lost')
    producer = await LocalPgConnection.connect(cluster, ATOMIC_REFRESH_LOGIN)
    current()
    const identity = await producer.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_catalog.pg_stat_activity WHERE pid=pg_backend_pid()')
    current()
    if (identity.length !== 1 || Object.keys(identity[0]!).join(',') !== 'pid,birth' || !/^[1-9][0-9]{0,9}$/.test(identity[0]?.pid ?? '')
      || !identity[0]?.birth || identity[0].birth.length > 64) throw Error('refresh_response')
    const pid = identity[0].pid!, birth = identity[0].birth!
    const oids = await localArtifactTypeOids(producer)
    current()
    await producer.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    current()
    const bundle = owned.prepared.envelope.bundle
    const artifacts = pgCompositeArray(oids.array, oids.element, bundle.artifacts.map(a => [
      pgText(a.pin.id), pgText(String(a.pin.version), 20), pgText(a.pin.digest), pgText(a.artifactType),
      pgText(a.artifactType === 'global_cell' ? 'global_definition_v1' : a.artifactType.endsWith('V1') ? 'custody_v1' : 'manifest_v1'),
      pgText(String(a.artifactContractVersion), 23), pgBytes(a.canonicalBytes),
    ]))
    const parameters = [pgText(owned.contract.mode), pgText(owned.expectedPredecessor), pgText(bundle.recordFingerprint),
      pgText(owned.reviewId), pgText(key), pgText(owned.witness.sequence, 20), pgText(owned.witness.eventHash),
      pgBytes(bundle.receiptBytes), pgBytes(bundle.custodyBindingBytes), artifacts, ...owned.prepared.bodies.map(pgBytes)]
    const bodies = owned.prepared.bodies.map((_, i) => `$${11 + i}::bytea`).join(',')
    // Start the returned remaining-bound budget BEFORE publication/lock waits.
    const queryStarted = performance.now()
    const rows = await producer.query(`SELECT predecessor,successor,after_sequence::text,after_hash,
      to_char(started_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS started_at,
      to_char(valid_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS valid_until,
      to_char(observed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS observed_at,
      phase_ms::text,production_accepted_read,positive_real_visa_cells::text
      FROM official_original_api.refresh_version_v1($1::text,$2::text,$3::text,$4::uuid,$5::text,$6::bigint,$7::text,
        $8::bytea,$9::bytea,$10::official_provenance_api.artifact_input_v1[],ARRAY[${bodies}]::bytea[])`, parameters)
    current()
    const row = rows[0]
    if (rows.length !== 1 || !row || Object.keys(row).join(',') !== 'predecessor,successor,after_sequence,after_hash,started_at,valid_until,observed_at,phase_ms,production_accepted_read,positive_real_visa_cells'
      || row.predecessor !== owned.expectedPredecessor || row.successor !== bundle.recordFingerprint
      || row.after_sequence !== String(Number(owned.witness.sequence) + 2) || !/^[a-f0-9]{64}$/.test(row.after_hash ?? '')
      || row.production_accepted_read !== 'NOT_AUTHORIZED' || row.positive_real_visa_cells !== '0') throw Error('refresh_response')
    const serverStarted = stamp(row.started_at), observed = stamp(row.observed_at), cutoff = stamp(row.valid_until)
    const duration = cutoff - serverStarted - 2
    if (serverStarted > observed || observed >= cutoff || duration <= 0 || duration > 60_000) throw Error('refresh_bound_elapsed')
    // The actual function-start timestamp lies after our monotonic query start.
    // This conservative anchor charges SQL/lock waits exactly once and never
    // restarts the original authority budget when the response finally arrives.
    storedDeadline = Math.min(storedDeadline, queryStarted + duration)
    const phases = ownRecord(JSON.parse(row.phase_ms ?? 'null'), phaseNames)
    if (!phases || Object.values(phases).some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > ATOMIC_REFRESH_LIMITS.operationMs)) throw Error('refresh_response')
    const sqlPhaseMs = immutable({ ...phases }) as Readonly<Record<string, number>>
    const witness = Object.freeze({ sequence: row.after_sequence, eventHash: row.after_hash! })
    current()
    if (!historicalProjectionCurrent(precommitProjection) || !historicalProjectionCurrent(predecessor.projection)) return failure('currentness_lost')
    // A rejected/lost COMMIT response is never converted into rollback/success.
    commitAttempted = true
    const commit = await producer.commitBefore(Math.min(operationDeadline, storedDeadline), row.valid_until!)
    commitAttempted = commit.dispatched; commitAcknowledged = commit.acknowledged
    if (!commit.acknowledged) return failure(expired() ? timedOut ? 'deadline' : 'cancelled' : 'precommit_refused', true)
    current()
    closeProducer()
    if (expired()) return failure(timedOut ? 'deadline' : 'cancelled')
    if (closeFailed || commit.protectionFailure || producer.operationDiagnostics.some(item => item.phase === 'commit' && item.protectionFailure)) return failure('producer_exit_unproved', true)
    // A closed JS object is insufficient. A fresh connection with the SAME
    // narrow login observes exact PID+birth departure, then itself closes before
    // the immutable #1151 reader opens its independent reader backends.
    const exitDeadline = Math.min(operationDeadline, performance.now() + ATOMIC_REFRESH_LIMITS.producerExitMs)
    exitTimer = setTimeout(() => { try { monitor?.close() } catch { closeFailed = true } }, Math.max(0, exitDeadline - performance.now()))
    monitor = await LocalPgConnection.connect(cluster, ATOMIC_REFRESH_LOGIN)
    current()
    let gone = false
    while (performance.now() < exitDeadline) {
      const alive = await monitor.query('SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity WHERE pid::text=$1::text AND backend_start::text=$2::text', [pgText(pid), pgText(birth)])
      current()
      if (performance.now() >= exitDeadline) break
      if (alive.length !== 1 || Object.keys(alive[0]!).join(',') !== 'n' || !['0', '1'].includes(alive[0]?.n ?? '')) throw Error('refresh_response')
      if (alive[0]!.n === '0') { gone = true; break }
      await new Promise<void>(resolve => setTimeout(resolve, ATOMIC_REFRESH_LIMITS.producerPollMs))
      current()
    }
    monitor.close(); monitor = undefined; clearTimeout(exitTimer); exitTimer = undefined
    if (!gone || closeFailed) return failure('producer_exit_unproved', true)
    const readback = await readPersistedCanonicalRequirements(cluster, owned.contract.mode, key, witness, lifetime.signal)
    current()
    if (readback.status !== 'synthetic_persisted_requirements_verified' || readback.projection.recordFingerprint !== bundle.recordFingerprint
      || !historicalValuesEqual(readback.witness, witness)) return failure('readback_failed', true)
    if (!historicalProjectionCurrent(readback.projection)) return failure('currentness_lost')
    const result: AtomicRefreshResult = immutable({ ...ATOMIC_REFRESH_COMMON, status: 'synthetic_atomic_refresh_verified',
      commitStatus: 'acknowledged', producerClosed: true, predecessor: owned.expectedPredecessor, successor: bundle.recordFingerprint,
      witness, sourceContent: 'unchanged', ruleChange: 'not_asserted', syntheticVisaCells: 1, readback, sqlPhaseMs })
    if (!historicalProjectionCurrent(readback.projection)) return failure('currentness_lost')
    current()
    return result
  } catch (error) {
    if (expired()) return failure(timedOut ? 'deadline' : 'cancelled')
    if (error instanceof Error && error.message === 'refresh_bound_elapsed') return failure('currentness_lost')
    return failure(commitAcknowledged ? 'readback_failed' : 'precommit_refused', true)
  } finally {
    signal?.removeEventListener('abort', cancel)
    clearTimeout(operationTimer); if (exitTimer !== undefined) clearTimeout(exitTimer)
    // Termination aborts any uncommitted transaction. No cleanup query/retry can
    // turn an uncertain COMMIT into a claimed rollback or a second publication.
    closeProducer(); try { monitor?.close() } catch { /* no positive result depends on a live monitor */ }
  }
}
