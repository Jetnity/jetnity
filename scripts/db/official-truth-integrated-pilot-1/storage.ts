// Local proof adapter. No runtime application, hosted target or acceptance operation.
import { readFileSync } from 'node:fs'
import { verifyIntegratedPilotBundle, type IntegratedPilotBundleInput, type IntegratedPilotArtifactInput } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { decodeProvenanceBytes, provenanceCanonical } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { sha256Hex } from '../../../lib/readiness/digest'
import type { LocalProofCluster } from './local-cluster'
import { LocalPgConnection, pgBytes, pgCompositeArray, pgText, type PgRows } from './pg-wire'

export type StructuralByteFixture = IntegratedPilotBundleInput
export async function installLocalProofSchema(owner: LocalPgConnection): Promise<void> {
  await owner.query(readFileSync(new URL('./storage.sql', import.meta.url), 'utf8'))
}
export async function localArtifactTypeOids(owner: LocalPgConnection) {
  const rows = await owner.query("SELECT t.oid::text AS element, t.typarray::text AS array FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='official_provenance_api' AND t.typname='artifact_input_v1'")
  if (rows.length !== 1 || !rows[0]?.element || !rows[0]?.array) throw new Error('local_storage_type_missing')
  return { element: Number(rows[0].element), array: Number(rows[0].array) }
}
function family(a: IntegratedPilotArtifactInput) {
  return a.artifactType === 'global_cell' ? 'global_definition_v1' : a.artifactType.endsWith('V1') ? 'custody_v1' : 'manifest_v1'
}
/** SQL intentionally tests structural fixtures; caller must not treat this as full domain publication. */
export async function publishStructuralFixture(connection: LocalPgConnection, oids: { element: number; array: number }, fixture: StructuralByteFixture, mode: 'create_or_verify' | 'verify_existing' = 'create_or_verify') {
  const array = pgCompositeArray(oids.array, oids.element, fixture.artifacts.map(a => [pgText(a.pin.id), pgText(String(a.pin.version), 20), pgText(a.pin.digest), pgText(a.artifactType), pgText(family(a)), pgText(String(a.artifactContractVersion), 23), pgBytes(a.canonicalBytes)]))
  const rows = await connection.query('SELECT official_provenance_api.publish_structural_fixture_v1($1::smallint,$2::text,$3::text,$4::bytea,$5::bytea,$6::official_provenance_api.artifact_input_v1[]) AS outcome', [pgText('1', 21), pgText(mode), pgText(fixture.recordFingerprint), pgBytes(fixture.receiptBytes), pgBytes(fixture.custodyBindingBytes), array])
  if (rows.length !== 1 || !['inserted', 'idempotent'].includes(rows[0]?.outcome ?? '')) throw new Error('local_storage_bad_write_response')
  return rows[0]!.outcome as 'inserted' | 'idempotent'
}
export async function commitStructuralFixture(cluster: LocalProofCluster, oids: { element: number; array: number }, fixture: StructuralByteFixture, mode: 'create_or_verify' | 'verify_existing' = 'create_or_verify') {
  const connection = await LocalPgConnection.connect(cluster, 'ot_provenance_writer')
  try {
    await connection.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    const result = await publishStructuralFixture(connection, oids, fixture, mode)
    await connection.query('COMMIT')
    return result
  } catch (error) { try { await connection.query('ROLLBACK') } catch { /* No success after an unknown transaction outcome. */ } throw error }
  finally { connection.close() }
}
export async function persistVerifiedIntegratedBundleLocally(cluster: LocalProofCluster, oids: { element: number; array: number }, bundle: IntegratedPilotBundleInput) {
  const verified = verifyIntegratedPilotBundle(bundle)
  if (!verified.ok) return verified
  // Keep exact caller bytes after verification. This is a private developer-only adapter.
  const outcome = await commitStructuralFixture(cluster, oids, bundle)
  return { ok: true as const, outcome }
}
function bytea(value: string | null | undefined): Uint8Array {
  if (typeof value !== 'string' || !/^\\x(?:[0-9a-f]{2})*$/.test(value)) throw new Error('local_storage_byte_transport')
  return Buffer.from(value.slice(2), 'hex')
}
export async function readStructuralFixture(connection: LocalPgConnection, fingerprint: string): Promise<PgRows> {
  return connection.query('SELECT row_kind,metadata,canonical_bytes FROM official_provenance_api.read_structural_fixture_v1($1::text)', [pgText(fingerprint)])
}
/** Reuses shared C/strict bytes and full semantic verification; structural completion is never `valid`. */
export function inspectStructuralReadback(rows: PgRows, fingerprint: string) {
  if (rows.length < 1 || rows.length > 1281 || rows.at(-1)?.row_kind !== 'read_status') throw new Error('local_storage_response_incomplete')
  if (rows.some(row => !['receipt','binding','artifact','receipt_link','binding_link','read_status'].includes(row.row_kind ?? ''))) throw new Error('local_storage_response_incomplete')
  const statuses = rows.filter(row => row.row_kind === 'read_status')
  if (statuses.length !== 1) throw new Error('local_storage_response_incomplete')
  const status = JSON.parse(statuses[0]!.metadata ?? 'null') as { status?: string } | null
  if (status?.status === 'receipt_absent' && rows.length === 1) return { status: 'receipt_absent' as const }
  if (status?.status !== 'complete_structure_only') throw new Error('local_storage_response_incomplete')
  const receipts = rows.filter(row => row.row_kind === 'receipt'), bindings = rows.filter(row => row.row_kind === 'binding')
  if (receipts.length !== 1 || bindings.length !== 1) throw new Error('local_storage_response_incomplete')
  const receiptBytes = bytea(receipts[0]!.canonical_bytes), custodyBindingBytes = bytea(bindings[0]!.canonical_bytes)
  for (const bytes of [receiptBytes, custodyBindingBytes]) if (!decodeProvenanceBytes(bytes).ok) throw new Error('local_storage_noncanonical')
  if (`ot-provenance-v1:${sha256Hex(`ot-provenance-v1\n${Buffer.from(receiptBytes).toString('utf8')}`)}` !== fingerprint) throw new Error('local_storage_fingerprint_mismatch')
  const artifacts: IntegratedPilotArtifactInput[] = rows.filter(row => row.row_kind === 'artifact').map(row => {
    const metadata = JSON.parse(row.metadata ?? 'null') as IntegratedPilotArtifactInput
    const canonicalBytes = bytea(row.canonical_bytes)
    if (!decodeProvenanceBytes(canonicalBytes).ok || sha256Hex(Buffer.from(canonicalBytes).toString('utf8')) !== metadata.pin.digest) throw new Error('local_storage_artifact_mismatch')
    return { pin: metadata.pin, artifactType: metadata.artifactType, artifactContractVersion: metadata.artifactContractVersion, canonicalBytes }
  })
  const bundle = { recordFingerprint: fingerprint, receiptBytes, custodyBindingBytes, artifacts }
  return { status: 'complete_structure_only' as const, bundle, semanticVerification: verifyIntegratedPilotBundle(bundle), byteIdentity: provenanceCanonical(artifacts.map(a => a.pin)) }
}
