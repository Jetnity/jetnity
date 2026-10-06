// Local proof adapter. No runtime application, hosted target or acceptance operation.
import { readFileSync } from 'node:fs'
import { verifyIntegratedPilotBundle, verifyLocalIntegratedPilotBundle, LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE, type LocalIntegratedPilotEnvelope, type IntegratedPilotBundleInput, type IntegratedPilotArtifactInput } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { decodeProvenanceBytes, provenanceCanonical } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { sha256Hex } from '../../../lib/readiness/digest'
import type { LocalProofCluster } from './local-cluster'
import { LocalPgConnection, pgBytes, pgCompositeArray, pgText, type PgRows } from './pg-wire'

export type StructuralByteFixture = IntegratedPilotBundleInput
export async function installLocalProofSchema(owner: LocalPgConnection): Promise<void> {
  await owner.query(readFileSync(new URL('./storage.sql', import.meta.url), 'utf8'))
  await owner.query(readFileSync(new URL('./semantic-v2.sql', import.meta.url), 'utf8'))
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

export const LOCAL_READER_COLUMNS = ['row_kind','record_fingerprint','storage_contract_version','receipt_schema','receipt_schema_version','canonicalization','binding_schema_version','object_id','object_version','object_digest','artifact_type','byte_contract_family','artifact_contract_version','canonical_bytes','parent_id','parent_version','parent_digest','slot','target_id','target_version','target_digest','status','detail_code'] as const
const columnsByKind: Record<string, readonly string[]> = {
  receipt: ['record_fingerprint','storage_contract_version','receipt_schema','receipt_schema_version','canonicalization','canonical_bytes'],
  binding: ['binding_schema_version','object_digest','canonical_bytes'],
  artifact: ['object_id','object_version','object_digest','artifact_type','byte_contract_family','artifact_contract_version','canonical_bytes'],
  receipt_link: ['slot','target_id','target_version','target_digest'], binding_link: ['slot','target_id','target_version','target_digest'],
  artifact_link: ['parent_id','parent_version','parent_digest','slot','target_id','target_version','target_digest'], read_status: ['status'],
}
/** Closed 23-column framing and complete exact link equality, then shared full semantics. */
export function inspectIntegratedReadback(envelope: Readonly<{ profile: typeof LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE; rows: PgRows }>, fingerprint: string) {
  if (envelope.profile !== LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE || Object.keys(envelope).sort().join(',') !== 'profile,rows') throw Error('local_storage_profile')
  const rows=envelope.rows
  if(rows.length<1 || rows.length>1281 || rows.at(-1)?.row_kind!=='read_status') throw Error('local_storage_response_incomplete')
  let priorRank=-1,priorKey:readonly (string|number)[]=[]
  for(const row of rows) {
    if(Object.keys(row).join(',')!==LOCAL_READER_COLUMNS.join(',')) throw Error('local_storage_response_shape')
    const fields=columnsByKind[row.row_kind??''];if(!fields)throw Error('local_storage_response_shape')
    const allowed=row.row_kind==='read_status'&&row.status==='receipt_absent'?[...fields,'detail_code']:fields
    if(row.row_kind==='read_status'&&row.status==='receipt_absent'&&row.detail_code!=='receipt_absent')throw Error('local_storage_response_shape')
    if(Object.values(row).some(v=>v!==null&&typeof v!=='string'))throw Error('local_storage_response_shape')
    for(const field of ['object_version','parent_version','target_version']) {const v=row[field];if(v!==null&&(!/^[1-9][0-9]*$/.test(v!)||!Number.isSafeInteger(Number(v))))throw Error('local_storage_response_version')}
    const rank=['receipt','binding','artifact','receipt_link','binding_link','artifact_link','read_status'].indexOf(row.row_kind!)
    const orderKey:readonly (string|number)[]=rank===2?[row.object_id!,Number(row.object_version),row.object_digest!]:rank===3||rank===4?[row.slot!]:rank===5?[row.parent_id!,Number(row.parent_version),row.parent_digest!,row.slot!]:[]
    if(rank<priorRank||(rank===priorRank&&(orderKey.length===0||!orderKey.some((v,i)=>v!==priorKey[i]&&orderKey.slice(0,i).every((x,j)=>x===priorKey[j])&&v>priorKey[i]!))))throw Error('local_storage_response_order')
    priorRank=rank;priorKey=orderKey
    if(row.record_fingerprint!==fingerprint||row.storage_contract_version!=='2')throw Error('local_storage_response_profile')
    for(const column of LOCAL_READER_COLUMNS) {
      if(['row_kind','record_fingerprint','storage_contract_version'].includes(column))continue
      if(allowed.includes(column) ? row[column]===null : row[column]!==null)throw Error('local_storage_response_shape')
    }
  }
  const statuses=rows.filter(r=>r.row_kind==='read_status')
  if(statuses.length!==1)throw Error('local_storage_response_incomplete')
  if(statuses[0]!.status==='receipt_absent' && rows.length===1)return {status:'receipt_absent' as const}
  if(statuses[0]!.status!=='complete')throw Error('local_storage_response_incomplete')
  const receipts=rows.filter(r=>r.row_kind==='receipt'),bindings=rows.filter(r=>r.row_kind==='binding')
  if(receipts.length!==1||bindings.length!==1)throw Error('local_storage_response_incomplete')
  const r=receipts[0]!,k=bindings[0]!
  if(r.record_fingerprint!==fingerprint||r.storage_contract_version!=='2'||r.receipt_schema!=='official-truth-autonomous-provenance'||r.receipt_schema_version!=='1'||r.canonicalization!=='ot-provenance-json-v1'||k.binding_schema_version!=='1')throw Error('local_storage_response_metadata')
  const artifacts=rows.filter(r=>r.row_kind==='artifact').map(a=>{
    if(a.artifact_contract_version!=='1'||!a.object_version||!/^[1-9][0-9]*$/.test(a.object_version))throw Error('local_storage_response_metadata')
    const item={pin:{id:a.object_id!,version:Number(a.object_version),digest:a.object_digest!},artifactType:a.artifact_type as IntegratedPilotArtifactInput['artifactType'],artifactContractVersion:1 as const,canonicalBytes:bytea(a.canonical_bytes)}
    if(a.byte_contract_family!==family(item))throw Error('local_storage_response_metadata');return item
  })
  const bundle:IntegratedPilotBundleInput={recordFingerprint:fingerprint,receiptBytes:bytea(r.canonical_bytes),custodyBindingBytes:bytea(k.canonical_bytes),artifacts}
  const verified=verifyLocalIntegratedPilotBundle({profile:envelope.profile,bundle})
  if(!verified.ok)throw Error(`local_storage_${verified.reason}`)
  if(verified.value.bindingDigest!==k.object_digest)throw Error('local_storage_binding_digest')
  const actual=(kind:string)=>rows.filter(r=>r.row_kind===kind).map(e=>({slot:e.slot!,pin:{id:e.target_id!,version:Number(e.target_version),digest:e.target_digest!},...(kind==='artifact_link'?{parent:{id:e.parent_id!,version:Number(e.parent_version),digest:e.parent_digest!}}:{})}))
  const normalize=(values:readonly unknown[])=>values.map(v=>provenanceCanonical(v)).sort()
  const expected=(values:readonly {slot:string;pin:unknown;parent?:unknown}[])=>values.map(({slot,pin,parent})=>({slot,pin,...(parent?{parent}:{})}))
  for(const [kind,edges] of [['receipt_link',verified.value.receiptRoots],['binding_link',verified.value.bindingRoots],['artifact_link',verified.value.artifactEdges]] as const) {
    if(provenanceCanonical(normalize(actual(kind)))!==provenanceCanonical(normalize(expected(edges))))throw Error('local_storage_edge_mismatch')
  }
  return {status:'verified' as const,envelope:{profile:envelope.profile,bundle},verified:verified.value,rowCount:rows.length}
}
export async function readIntegratedRows(connection:LocalPgConnection,fingerprint:string) {
  return connection.query(`SELECT ${LOCAL_READER_COLUMNS.join(',')} FROM official_provenance_api.read_local_integrated_v2($1::text,$2::text)`,[pgText(LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE),pgText(fingerprint)])
}
export async function readVerifiedIntegratedBundleLocally(cluster:LocalProofCluster,fingerprint:string) {
  const reader=await LocalPgConnection.connect(cluster,'ot_provenance_reader')
  try {
    await reader.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const result=inspectIntegratedReadback({profile:LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE,rows:await readIntegratedRows(reader,fingerprint)},fingerprint)
    await reader.query('COMMIT');return result
  }finally{reader.close()}
}
/** Low-level provisional SQL result; callers must COMMIT and then use a fresh reader. */
export async function publishIntegratedBundle(connection:LocalPgConnection,oids:{element:number;array:number},envelope:LocalIntegratedPilotEnvelope,mode:'create_or_verify'|'verify_existing'='create_or_verify') {
  const b=envelope.bundle
  const array=pgCompositeArray(oids.array,oids.element,b.artifacts.map(a=>[pgText(a.pin.id),pgText(String(a.pin.version),20),pgText(a.pin.digest),pgText(a.artifactType),pgText(family(a)),pgText(String(a.artifactContractVersion),23),pgBytes(a.canonicalBytes)]))
  const rows=await connection.query('SELECT official_provenance_api.publish_local_integrated_v2($1::text,$2::smallint,$3::text,$4::text,$5::bytea,$6::bytea,$7::official_provenance_api.artifact_input_v1[]) AS outcome',[pgText(envelope.profile),pgText('2',21),pgText(mode),pgText(b.recordFingerprint),pgBytes(b.receiptBytes),pgBytes(b.custodyBindingBytes),array])
  if(rows.length!==1||!['inserted','idempotent'].includes(rows[0]?.outcome??''))throw Error('local_storage_bad_write_response')
  return rows[0]!.outcome as 'inserted'|'idempotent'
}
/** Unknown COMMIT is never success. The caller may resolve by explicit verify_existing. */
export async function persistVerifiedIntegratedBundleLocally(cluster:LocalProofCluster,oids:{element:number;array:number},envelope:LocalIntegratedPilotEnvelope,mode:'create_or_verify'|'verify_existing'='create_or_verify') {
  // Verify the strict incoming surface first, then own every byte before yielding.
  const admitted=verifyLocalIntegratedPilotBundle(envelope)
  if(!admitted.ok)return admitted
  envelope={profile:envelope.profile,bundle:{recordFingerprint:envelope.bundle.recordFingerprint,receiptBytes:Uint8Array.from(envelope.bundle.receiptBytes),custodyBindingBytes:Uint8Array.from(envelope.bundle.custodyBindingBytes),artifacts:envelope.bundle.artifacts.map(a=>({pin:{...a.pin},artifactType:a.artifactType,artifactContractVersion:a.artifactContractVersion,canonicalBytes:Uint8Array.from(a.canonicalBytes)}))}}
  const verified=verifyLocalIntegratedPilotBundle(envelope)
  if(!verified.ok)return verified
  const connection=await LocalPgConnection.connect(cluster,'ot_provenance_writer')
  let committing=false,committed=false
  try {
    await connection.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    const outcome=await publishIntegratedBundle(connection,oids,envelope,mode)
    committing=true;await connection.query('COMMIT');committed=true
    const readback=await readVerifiedIntegratedBundleLocally(cluster,envelope.bundle.recordFingerprint)
    if(readback.status!=='verified')throw Error('local_storage_postcommit_absent')
    // Fresh stored bytes must equal the submitted immutable bytes, not only hashes.
    const b=readback.envelope.bundle,submitted=envelope.bundle
    if(Buffer.compare(Buffer.from(b.receiptBytes),Buffer.from(submitted.receiptBytes))||Buffer.compare(Buffer.from(b.custodyBindingBytes),Buffer.from(submitted.custodyBindingBytes))||b.artifacts.length!==submitted.artifacts.length||b.artifacts.some(a=>{const source=submitted.artifacts.find(s=>s.pin.id===a.pin.id&&s.pin.version===a.pin.version);return !source||Buffer.compare(Buffer.from(a.canonicalBytes),Buffer.from(source.canonicalBytes))!==0}))throw Error('local_storage_postcommit_bytes')
    return {ok:true as const,outcome,readback}
  }catch(error){
    if(committing&&!committed)return {ok:false as const,reason:'commit_outcome_unknown' as const}
    if(!committing){try{await connection.query('ROLLBACK')}catch{/* Closed connection cannot manufacture success. */}}
    throw error
  }finally{connection.close()}
}
