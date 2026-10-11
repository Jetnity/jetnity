// CODE-ONLY local candidate. No hosted client, public DTO, account or real authority.
import 'server-only'
import { createHash } from 'node:crypto'
import { evidenceQuellenFingerprint } from '../../../lib/readiness/evidence'
import { officialTruthSourceFingerprintV2 } from '../../../lib/readiness/official-truth-source-fingerprint-v2'
import { verifyLocalIntegratedPilotBundle, LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { LocalPgConnection, pgBytes, pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import { inspectIntegratedReadback, publishIntegratedBundle, readIntegratedRows } from '../official-truth-integrated-pilot-1/storage'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'

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
/** Holds the SQL lifecycle SHARE lock through both re-proofs. No raw bytes escape. */
export async function readCandidate(cluster: LocalProofCluster, connection: LocalPgConnection, fingerprint: string, key: string, witness: Cursor) {
  const rows = await connection.query('SELECT ordinal::text,original_pin::text,evidence_version,raw_digest,original_bytes FROM official_original_api.read_candidate($1::text,$2::text,$3::bigint,$4::text)', [pgText(fingerprint), pgText(key), pgText(witness.sequence, 20), pgText(witness.eventHash)])
  // Preserve the existing reader's REPEATABLE READ / READ ONLY contract. The
  // guard transaction keeps the lifecycle SHARE lock until this re-proof ends.
  const archive = await LocalPgConnection.connect(cluster, 'ot_original_test_reader')
  const closure = await (async () => {
    try {
      await archive.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      const verified = inspectIntegratedReadback({ profile: LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE, rows: await readIntegratedRows(archive, fingerprint) }, fingerprint)
      await archive.query('COMMIT'); return verified
    } finally { archive.close() }
  })()
  if (closure.status !== 'verified' || rows.length !== closure.verified.receipt.payload.supports.length) throw Error('original_read_incomplete')
  const bodies = rows.map((row, i) => {
    if (Object.keys(row).join(',') !== 'ordinal,original_pin,evidence_version,raw_digest,original_bytes' || row.ordinal !== String(i) || row.evidence_version !== closure.verified.receipt.payload.supports[i]!.versionId || !/^[a-f0-9-]{36}$/.test(row.original_pin ?? '') || !/^\\x(?:[a-f0-9]{2})+$/.test(row.original_bytes ?? '')) throw Error('original_read_shape')
    const body = Buffer.from(row.original_bytes!.slice(2), 'hex')
    if (body.length > 131072 || rawDigest(body) !== row.raw_digest) throw Error('original_read_digest')
    return body
  })
  prepareOriginals(closure.envelope, bodies)
  return Object.freeze({ status: 'synthetic_custody_verified' as const, recordFingerprint: fingerprint, supports: rows.length,
    cursor: witness, authority: 'synthetic-local-review-v1' as const, historicalOriginalsReproved: true,
    // This receipt is not a production accepted DTO and never a Requirements result.
    productionAcceptedRead: 'NOT_AUTHORIZED' as const, positiveVisaCells: 0 as const })
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
