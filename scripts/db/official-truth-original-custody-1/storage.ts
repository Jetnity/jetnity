// CODE-ONLY local candidate. No hosted client, public DTO, account or real authority.
import 'server-only'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { evidenceQuellenFingerprint } from '../../../lib/readiness/evidence'
import { officialTruthSourceFingerprintV2 } from '../../../lib/readiness/official-truth-source-fingerprint-v2'
import { verifyLocalIntegratedPilotBundle, LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { LocalPgConnection, pgBytes, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { inspectIntegratedReadback, publishIntegratedBundle, readIntegratedRows } from '../official-truth-integrated-pilot-1/storage'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { historicalValuesEqual, immutable, ownRecord } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { selectCurrentVersion } from '../official-truth-current-version-lookup-1/lookup'
import { persistedCanonicalReadContract } from '../official-truth-persisted-canonical-read-1/contract'
import { historicalProjectionCurrent, projectHistoricalCanonicalRequirements, type HistoricalCanonicalProjection } from '../official-truth-persisted-canonical-read-1/projection'

export type Cursor = Readonly<{ sequence: string; eventHash: string }>
export type PreparedOriginals = Readonly<{ envelope: LocalIntegratedPilotEnvelope; bodies: readonly Uint8Array[]; ordered: readonly { versionId: string; rawDigest: string }[] }>
export const rawDigest = (body: Uint8Array) => createHash('sha256').update(body).digest('hex')

/** Own the complete bytes synchronously before any async call, never a re-fetch. */
export function prepareOriginals(envelope: LocalIntegratedPilotEnvelope, bodies: readonly Uint8Array[]): PreparedOriginals {
  const check = verifyLocalIntegratedPilotBundle(envelope)
  if (!check.ok) throw Error('original_closure_invalid')
  if (bodies.length !== check.value.receipt.payload.supports.length) throw Error('original_support_count')
  const copied = bodies.map((body, i) => {
    if (!(body instanceof Uint8Array) || body.byteLength < 1 || body.byteLength > 131072) throw Error('original_bound')
    const bytes = Uint8Array.from(body), support = check.value.receipt.payload.supports[i]!
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
    if (text.startsWith('\uFEFF') || !Buffer.from(text).equals(Buffer.from(bytes))) throw Error('original_encoding')
    if (!support.sourceFingerprintProtocol && bytes.length > 65536) throw Error('original_bound')
    const digest = support.sourceFingerprintProtocol === 2 ? officialTruthSourceFingerprintV2(text, {
      ...(support.binding as Record<string, unknown>), canonicalUrl: support.canonicalFinalUrl, contentType: support.contentType,
    }) : evidenceQuellenFingerprint(text)
    if (digest !== support.sourceContentHash) throw Error('original_fingerprint')
    return bytes
  })
  return { envelope: { profile: envelope.profile, bundle: {
    recordFingerprint: envelope.bundle.recordFingerprint, receiptBytes: Uint8Array.from(envelope.bundle.receiptBytes),
    custodyBindingBytes: Uint8Array.from(envelope.bundle.custodyBindingBytes), artifacts: envelope.bundle.artifacts.map(a => ({ ...a, pin: { ...a.pin }, canonicalBytes: Uint8Array.from(a.canonicalBytes) })),
  } }, bodies: copied, ordered: check.value.receipt.payload.supports.map((s, i) => ({ versionId: s.versionId, rawDigest: rawDigest(copied[i]!) })) }
}
export async function cursor(connection: LocalPgConnection): Promise<Cursor> {
  const rows = await connection.query('SELECT sequence::text,event_hash FROM official_original_api.cursor()')
  const row = rows[0]
  if (rows.length !== 1 || !row || Object.keys(row).join(',') !== 'sequence,event_hash' || !/^(0|[1-9][0-9]{0,5})$/.test(row.sequence ?? '') || !/^[a-f0-9]{64}$/.test(row.event_hash ?? '')) throw Error('original_cursor_shape')
  return { sequence: row.sequence!, eventHash: row.event_hash! }
}
/** SQL call is provisional; owned producer below requires COMMIT + fresh readback. */
export async function bindCandidate(connection: LocalPgConnection, prepared: PreparedOriginals, review: string, key: string, witness: Cursor, mode: 'create_or_verify' | 'verify_existing') {
  const params = [pgText(prepared.envelope.bundle.recordFingerprint), pgText(review), pgText(key), pgText(witness.sequence, 20), pgText(witness.eventHash), pgText(mode), ...prepared.bodies.map(pgBytes)]
  const array = prepared.bodies.map((_, i) => `$${i + 7}::bytea`).join(',')
  const rows = await connection.query(`SELECT official_original_api.bind_candidate($1::text,$2::uuid,ARRAY[${array}]::bytea[],$3::text,$4::bigint,$5::text,$6::text) AS outcome`, params)
  if (rows.length !== 1 || !['inserted', 'idempotent'].includes(rows[0]?.outcome ?? '')) throw Error('original_write_shape')
  return rows[0]!.outcome!
}
export async function reviewCandidate(connection: LocalPgConnection, prepared: PreparedOriginals): Promise<string> {
  const verified = verifyLocalIntegratedPilotBundle(prepared.envelope)
  if (!verified.ok) throw Error('original_closure_invalid')
  const rows = await connection.query('SELECT official_original_api.review($1::text,$2::text,$3::jsonb)::text AS review_id', [pgText(prepared.envelope.bundle.recordFingerprint), pgText(verified.value.receipt.payload.proof.reviewPacketKey), pgText(JSON.stringify(prepared.ordered), 3802)])
  if (rows.length !== 1 || !/^[a-f0-9-]{36}$/.test(rows[0]?.review_id ?? '')) throw Error('original_review_shape')
  return rows[0]!.review_id!
}
async function originalRows(connection: LocalPgConnection, fingerprint: string, key: string, witness: Cursor) {
  return connection.query('SELECT ordinal::text,original_pin::text,evidence_version,raw_digest,original_bytes FROM official_original_api.read_candidate($1::text,$2::text,$3::bigint,$4::text)', [pgText(fingerprint), pgText(key), pgText(witness.sequence, 20), pgText(witness.eventHash)])
}

type OriginalBound = Readonly<{ expires: number; fresh: number; lifecycle: number; observed: number }>
type OriginalRead = Readonly<{ rows: PgRows; deadlineAt: number | null; bounds: readonly OriginalBound[] }>
const projectionColumns = 'ordinal,original_pin,evidence_version,raw_digest,original_bytes,expires_at,freshness_until,lifecycle_valid_until,observed_at'
function timestamp(value: string | null | undefined): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(value)) throw Error('persisted_bound_invalid')
  const ms = Date.parse(value)
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== `${value.slice(0, 23)}Z`) throw Error('persisted_bound_invalid')
  return ms
}
/** Actual persisted bounds; never infer retention from a schema maximum. */
async function projectionRows(connection: LocalPgConnection, fingerprint: string, key: string, witness: Cursor): Promise<OriginalRead> {
  const started = performance.now()
  const rows = await connection.query(`SELECT ordinal::text,original_pin::text,evidence_version,raw_digest,original_bytes,
    to_char(expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS expires_at,
    to_char(freshness_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS freshness_until,
    to_char(lifecycle_valid_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS lifecycle_valid_until,
    to_char(observed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS observed_at
    FROM official_original_api.read_projection_candidate($1::text,$2::text,$3::bigint,$4::text)`,
  [pgText(fingerprint), pgText(key), pgText(witness.sequence, 20), pgText(witness.eventHash)])
  if (rows.length < 1 || rows.length > 8) throw Error('persisted_bound_invalid')
  let deadlineAt = Infinity
  const bounds: OriginalBound[] = []
  const material = rows.map((row, index) => {
    if (Object.keys(row).join(',') !== projectionColumns || row.ordinal !== String(index)) throw Error('persisted_bound_invalid')
    const bound = { expires: timestamp(row.expires_at), fresh: timestamp(row.freshness_until),
      lifecycle: timestamp(row.lifecycle_valid_until), observed: timestamp(row.observed_at) }
    if (bound.expires <= bound.observed || bound.fresh <= bound.observed || bound.lifecycle <= bound.observed
      || bound.expires - bound.observed > 2_592_000_000 || bound.fresh - bound.observed > 2_592_000_000
      || bound.lifecycle - bound.observed > 60_000
      || (index > 0 && bound.observed < bounds[index - 1]!.observed)) throw Error('persisted_bound_invalid')
    // Date.parse truncates microseconds. Subtract two milliseconds, and start
    // the remaining duration BEFORE the query, never at response arrival.
    const remaining = Math.min(bound.expires, bound.fresh, bound.lifecycle) - bound.observed - 2
    if (remaining <= 0) throw Error('persisted_bound_elapsed')
    deadlineAt = Math.min(deadlineAt, started + remaining)
    bounds.push(bound)
    return { ordinal: row.ordinal, original_pin: row.original_pin, evidence_version: row.evidence_version,
      raw_digest: row.raw_digest, original_bytes: row.original_bytes }
  })
  if (!Number.isFinite(deadlineAt) || performance.now() >= deadlineAt) throw Error('persisted_bound_elapsed')
  return { rows: material, deadlineAt, bounds }
}

/** Private material stays inside the fixed storage-to-projection operation. */
async function readMaterial(cluster: LocalProofCluster, connection: LocalPgConnection, fingerprint: string, key: string, witness: Cursor, signal?: AbortSignal, requireBounds = false) {
  const reading: OriginalRead = requireBounds ? await projectionRows(connection, fingerprint, key, witness)
    : { rows: await originalRows(connection, fingerprint, key, witness), deadlineAt: null, bounds: [] }
  const { rows } = reading
  const current = () => {
    if (signal?.aborted) throw Error('persisted_read_aborted')
    if (reading.deadlineAt !== null && performance.now() >= reading.deadlineAt) throw Error('persisted_bound_elapsed')
  }
  current()
  // Preserve the existing reader's REPEATABLE READ / READ ONLY contract. The
  // guard transaction keeps the lifecycle SHARE lock until this re-proof ends.
  const archive = await LocalPgConnection.connect(cluster, 'ot_original_test_reader')
  let archiveClosed = false
  const closeArchive = () => { if (!archiveClosed) { archiveClosed = true; archive.close() } }
  signal?.addEventListener('abort', closeArchive, { once: true })
  const closure = await (async () => {
    try {
      current()
      await archive.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      current()
      const archived = await readIntegratedRows(archive, fingerprint)
      current()
      const verified = inspectIntegratedReadback({ profile: LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE, rows: archived }, fingerprint)
      current()
      await archive.query('COMMIT'); current(); return verified
    } finally { signal?.removeEventListener('abort', closeArchive); closeArchive() }
  })()
  current()
  if (closure.status !== 'verified' || rows.length !== closure.verified.receipt.payload.supports.length) throw Error('original_read_incomplete')
  const bodies = rows.map((row, i) => {
    if (Object.keys(row).join(',') !== 'ordinal,original_pin,evidence_version,raw_digest,original_bytes' || row.ordinal !== String(i) || row.evidence_version !== closure.verified.receipt.payload.supports[i]!.versionId || !/^[a-f0-9-]{36}$/.test(row.original_pin ?? '') || !/^\\x(?:[a-f0-9]{2})+$/.test(row.original_bytes ?? '')) throw Error('original_read_shape')
    const body = Buffer.from(row.original_bytes!.slice(2), 'hex')
    if (body.length > 131072 || rawDigest(body) !== row.raw_digest) throw Error('original_read_digest')
    if (requireBounds) {
      const captured = Date.parse(closure.verified.receipt.payload.supports[i]!.acceptedRetrievedAt), bound = reading.bounds[i]!
      if (!Number.isFinite(captured) || bound.observed < captured || bound.expires > captured + 2_592_000_000
        || bound.fresh > captured + 2_592_000_000) throw Error('persisted_bound_invalid')
    }
    return body
  })
  prepareOriginals(closure.envelope, bodies)
  current()
  return { ...reading, bodies, verified: closure.verified }
}

/** Holds the SQL lifecycle SHARE lock through both re-proofs. No raw bytes escape. */
export async function readCandidate(cluster: LocalProofCluster, connection: LocalPgConnection, fingerprint: string, key: string, witness: Cursor) {
  const { rows } = await readMaterial(cluster, connection, fingerprint, key, witness)
  return Object.freeze({ status: 'synthetic_custody_verified' as const, recordFingerprint: fingerprint, supports: rows.length,
    cursor: witness, authority: 'synthetic-local-review-v1' as const, historicalOriginalsReproved: true,
    // This receipt is not a production accepted DTO and never a Requirements result.
    productionAcceptedRead: 'NOT_AUTHORIZED' as const, positiveVisaCells: 0 as const })
}

type ReadFailure = 'context_invalid' | 'cancelled' | 'deadline' | 'material_or_lifecycle_refused' | 'selection_refused'
  | 'selection_changed' | 'material_changed' | 'freshness_lost' | 'read_failed'
type CanonicalCommon = Readonly<{ productionAcceptedRead: 'NOT_AUTHORIZED'; positiveRealVisaCells: 0;
  reusablePositiveCache: false; authority: 'synthetic-local-review-v1' }>
export type PersistedCanonicalReadResult = CanonicalCommon & (
  | Readonly<{ status: 'synthetic_persisted_requirements_verified'; syntheticVisaCells: 1;
    witness: Cursor; readAt: string; recheckedAt: string; projection: HistoricalCanonicalProjection }>
  | Readonly<{ status: 'no_match' | 'ambiguous' | 'refused' | 'unavailable'; reason: ReadFailure | null;
    syntheticVisaCells: 0; evaluations: readonly [] }>
)
const canonicalCommon: CanonicalCommon = Object.freeze({ productionAcceptedRead: 'NOT_AUTHORIZED', positiveRealVisaCells: 0,
  reusablePositiveCache: false, authority: 'synthetic-local-review-v1' })

/** Owns one fresh local reader and the complete selection/projection lifetime.
 * No fingerprint/material/registry/callback/clock can enter. This is never a
 * production Accepted reader. The mutual lookup import is functions-only:
 * the old lookup still calls readCandidate; this entry uses selection metadata.
 */
export async function readPersistedCanonicalRequirements(cluster: LocalProofCluster, mode: unknown, key: string, witness: Cursor, signal?: AbortSignal): Promise<PersistedCanonicalReadResult> {
  const deadlineAt = performance.now() + 60_000
  const failure = (reason: ReadFailure | null, status: 'no_match' | 'ambiguous' | 'refused' | 'unavailable' = 'refused'): PersistedCanonicalReadResult =>
    immutable({ ...canonicalCommon, status, reason, syntheticVisaCells: 0, evaluations: [] as const })
  let contract: ReturnType<typeof persistedCanonicalReadContract>, ownedWitness: Cursor
  try {
    if (arguments.length < 4 || arguments.length > 5 || typeof key !== 'string' || !/^[a-f0-9]{64}$/.test(key)
      || (signal !== undefined && !(signal instanceof AbortSignal))) return failure('context_invalid')
    contract = persistedCanonicalReadContract(mode)
    const row = ownRecord(witness, ['sequence', 'eventHash'])
    if (!row || typeof row.sequence !== 'string' || !/^(0|[1-9][0-9]{0,5})$/.test(row.sequence)
      || typeof row.eventHash !== 'string' || !/^[a-f0-9]{64}$/.test(row.eventHash)) return failure('context_invalid')
    ownedWitness = Object.freeze({ sequence: row.sequence, eventHash: row.eventHash })
  } catch { return failure('context_invalid') }
  if (signal?.aborted) return failure('cancelled')
  const lifetime = new AbortController()
  let connection: LocalPgConnection | undefined, closed = false, timedOut = false, closeFailed = false, storedDeadline = Infinity
  const close = () => { if (connection && !closed) { closed = true; try { connection.close() } catch { closeFailed = true } } }
  const cancel = () => { lifetime.abort(); close() }
  signal?.addEventListener('abort', cancel, { once: true })
  const deadline = setTimeout(() => { timedOut = true; cancel() }, Math.max(0, deadlineAt - performance.now()))
  // Timer delivery can lag behind synchronous re-proof or resolved Promises.
  // The monotonic deadline is independently enforced at every owned boundary.
  const cancelled = () => {
    if (performance.now() >= deadlineAt) { timedOut = true; cancel() }
    return lifetime.signal.aborted || signal?.aborted
  }
  const abortFailure = () => failure(timedOut ? 'deadline' : 'cancelled')
  try {
    connection = await LocalPgConnection.connect(cluster, 'ot_original_test_reader')
    if (cancelled()) return abortFailure()
    await connection.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    if (cancelled()) return abortFailure()
    const selection = await selectCurrentVersion(connection, contract.request, ownedWitness)
    if (cancelled()) return abortFailure()
    if (selection.status === 'no_match' || selection.status === 'ambiguous') return failure(null, selection.status)
    if (selection.status !== 'unique') return failure('selection_refused')
    const material = await readMaterial(cluster, connection, selection.recordFingerprint, key, ownedWitness, lifetime.signal, true)
    if (cancelled()) return abortFailure()
    if (material.deadlineAt === null) return failure('material_or_lifecycle_refused')
    storedDeadline = Math.min(storedDeadline, material.deadlineAt)
    if (performance.now() >= storedDeadline) return failure('freshness_lost')
    const projection = await projectHistoricalCanonicalRequirements(material.verified, material.bodies, contract.mode, lifetime.signal)
    if (cancelled()) return abortFailure()
    if (performance.now() >= storedDeadline || !historicalProjectionCurrent(projection)) return failure('freshness_lost')
    // The SHARE lock remains held through the asynchronous canonical engine.
    // Re-enumerate the whole current set, then freshly check actual original
    // retention/freshness/source/profile/review/head state as the last await.
    const current = await selectCurrentVersion(connection, contract.request, ownedWitness)
    if (cancelled()) return abortFailure()
    if (performance.now() >= storedDeadline) return failure('freshness_lost')
    if (current.status !== 'unique' || current.recordFingerprint !== selection.recordFingerprint) return failure('selection_changed')
    const currentRead = await projectionRows(connection, selection.recordFingerprint, key, ownedWitness)
    if (cancelled()) return abortFailure()
    if (currentRead.deadlineAt === null) return failure('material_or_lifecycle_refused')
    storedDeadline = Math.min(storedDeadline, currentRead.deadlineAt)
    if (performance.now() >= storedDeadline) return failure('freshness_lost')
    if (!historicalValuesEqual(currentRead.rows, material.rows)) return failure('material_changed')
    if (!historicalValuesEqual(currentRead.bounds.map(({ expires, fresh, lifecycle }) => ({ expires, fresh, lifecycle })),
      material.bounds.map(({ expires, fresh, lifecycle }) => ({ expires, fresh, lifecycle })))) return failure('material_or_lifecycle_refused')
    const recheckedAt = new Date().toISOString()
    if (!historicalProjectionCurrent(projection, recheckedAt)) return failure('freshness_lost')
    // No writes occurred on this guard transaction. Terminate/rollback it
    // synchronously; no COMMIT/cleanup await after the final current read.
    // The separate historical archive retained its existing RR/RO + COMMIT.
    const result: PersistedCanonicalReadResult = immutable({ ...canonicalCommon, status: 'synthetic_persisted_requirements_verified', syntheticVisaCells: 1,
      witness: ownedWitness, readAt: selection.readAt, recheckedAt, projection })
    if (cancelled()) return abortFailure()
    if (performance.now() >= storedDeadline || !historicalProjectionCurrent(projection)) return failure('freshness_lost')
    close()
    if (cancelled()) return abortFailure()
    if (closeFailed) return failure('read_failed', 'unavailable')
    if (!historicalProjectionCurrent(projection)) return failure('freshness_lost')
    if (cancelled()) return abortFailure()
    return performance.now() >= storedDeadline ? failure('freshness_lost') : result
  } catch (error) {
    if (cancelled()) return abortFailure()
    if (error instanceof Error && error.message === 'persisted_bound_elapsed') return failure('freshness_lost')
    // Never expose raw SQL, source material, keys, stack or arbitrary errors.
    return error instanceof Error && (error.message.startsWith('original_') || error.message === 'persisted_projection_refused' || error.message === 'persisted_bound_invalid'
      || /^local_pg_(?:22023|23514|55000|P0002)$/.test(error.message))
      ? failure('material_or_lifecycle_refused') : failure('read_failed', 'unavailable')
  } finally {
    clearTimeout(deadline)
    signal?.removeEventListener('abort', cancel)
    close()
  }
}
/** Read/COMMIT use a NEW connection after the writer's acknowledged COMMIT. */
export async function persistCandidate(cluster: LocalProofCluster, oids: { element: number; array: number }, input: PreparedOriginals, review: string, key: string, witness: Cursor, mode: 'create_or_verify' | 'verify_existing' = 'create_or_verify') {
  const prepared = prepareOriginals(input.envelope, input.bodies)
  const writer = await LocalPgConnection.connect(cluster, 'ot_original_test_writer')
  let committing = false, committed = false
  try {
    await writer.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    await publishIntegratedBundle(writer, oids, prepared.envelope, mode)
    const outcome = await bindCandidate(writer, prepared, review, key, witness, mode)
    const next = await cursor(writer)
    committing = true
    await writer.query('COMMIT'); committed = true
    const reader = await LocalPgConnection.connect(cluster, 'ot_original_test_reader')
    try {
      await reader.query('BEGIN ISOLATION LEVEL READ COMMITTED')
      const readback = await readCandidate(cluster, reader, prepared.envelope.bundle.recordFingerprint, key, next)
      await reader.query('COMMIT')
      return { ok: true as const, outcome, cursor: next, readback }
    } finally { reader.close() }
  } catch (error) {
    if (committing && !committed) return { ok: false as const, reason: 'commit_outcome_unknown' as const }
    if (!committing) { try { await writer.query('ROLLBACK') } catch { /* Never infer success. */ } }
    throw error
  } finally { writer.close() }
}
