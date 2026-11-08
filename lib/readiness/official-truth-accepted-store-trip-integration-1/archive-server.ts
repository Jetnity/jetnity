import 'server-only'
import { z } from 'zod'
import { archiveSchema, type ArchiveWire } from './wire'
import { verifyAcceptedStoreIntegratedBundleV1, ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,
  type IntegratedPilotBundleInput, type IntegratedPilotVerifiedBundle, type IntegratedPilotArtifactType } from '../official-truth-integrated-pilot-bundle'
import { historicalValuesEqual } from '../official-truth-autonomous-provenance-artifact'
import type { AcceptedStoreContract } from './canonical-server'

const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const decode = (text: string) => {
  const bytes = Buffer.from(text,'base64')
  if (bytes.toString('base64') !== text) throw Error('archive_encoding_invalid')
  return new Uint8Array(bytes)
}
export function archiveWire(bundle: IntegratedPilotBundleInput): ArchiveWire {
  return archiveSchema.parse({ recordFingerprint: bundle.recordFingerprint,
    receiptBase64: Buffer.from(bundle.receiptBytes).toString('base64'), custodyBindingBase64: Buffer.from(bundle.custodyBindingBytes).toString('base64'),
    artifacts: [...bundle.artifacts].sort((a,b) => order(a.pin.id,b.pin.id) || a.pin.version-b.pin.version).map(a => ({
      pin:a.pin,artifactType:a.artifactType,artifactContractVersion:a.artifactContractVersion,canonicalBase64:Buffer.from(a.canonicalBytes).toString('base64'),
    })) })
}
export function verifyArchive(input: unknown): IntegratedPilotVerifiedBundle {
  const wire = archiveSchema.parse(input)
  const bundle: IntegratedPilotBundleInput = { recordFingerprint: wire.recordFingerprint,
    receiptBytes:decode(wire.receiptBase64),custodyBindingBytes:decode(wire.custodyBindingBase64),
    artifacts: wire.artifacts.map(a => ({pin:a.pin,artifactType:a.artifactType as IntegratedPilotArtifactType,
      artifactContractVersion:a.artifactContractVersion,canonicalBytes:decode(a.canonicalBase64)})) }
  const verified = verifyAcceptedStoreIntegratedBundleV1({profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,bundle})
  if (!verified.ok) throw Error('archive_invalid')
  return verified.value
}
/** SQL returns both bytes and persisted edges. Reconstructing expected edges
 * does not excuse a missing/extra stored edge; compare both exact sets. */
export function verifyPersistedArchive(input: unknown): IntegratedPilotVerifiedBundle {
  const parsed = archiveSchema.extend({edges:z.object({receipt:z.array(z.record(z.string(),z.unknown())),
    binding:z.array(z.record(z.string(),z.unknown())),artifacts:z.array(z.record(z.string(),z.unknown()))}).strict()}).strict().parse(input)
  const {edges,...wire}=parsed, verified=verifyArchive(wire)
  const root = (slot: string, p: {id:string;version:number;digest:string}) => ({record_fingerprint:wire.recordFingerprint,
    target_id:p.id,target_version:p.version,target_digest:p.digest,[slot]:''})
  const receipt=verified.receiptRoots.map(r=>({...root('root_slot',r.pin),root_slot:r.slot})).sort((a,b)=>order(a.root_slot,b.root_slot))
  const binding=verified.bindingRoots.map(r=>({...root('binding_slot',r.pin),binding_slot:r.slot})).sort((a,b)=>order(a.binding_slot,b.binding_slot))
  const artifacts=verified.artifactEdges.map(e=>({parent_id:e.parent.id,parent_version:e.parent.version,parent_digest:e.parent.digest,
    slot:e.slot,target_id:e.pin.id,target_version:e.pin.version,target_digest:e.pin.digest})).sort((a,b)=>order(a.parent_id,b.parent_id)||a.parent_version-b.parent_version||order(a.slot,b.slot))
  if (!historicalValuesEqual(edges,{receipt,binding,artifacts})) throw Error('archive_edges_invalid')
  return verified
}

const sourceBundle=z.object({schema:z.literal('implementation-source-bundle-v1'),
  files:z.array(z.object({path:z.string().min(1).max(500),utf8:z.string()}).strict()).min(1).max(256)}).strict()
export function verifyCurrentImplementation(bundle: IntegratedPilotVerifiedBundle, contract: AcceptedStoreContract): void {
  const files: {path:string;utf8:string}[]=[]
  for (const artifact of bundle.artifacts) {
    if (artifact.artifactType!=='implementation_bundle') continue
    const content=(artifact.value as {content:{bundleBase64:string}}).content
    const text=new TextDecoder('utf-8',{fatal:true}).decode(decode(content.bundleBase64))
    files.push(...sourceBundle.parse(JSON.parse(text)).files)
  }
  if (!files.length || new Set(files.map(f=>f.path)).size!==files.length
    || !historicalValuesEqual(files.sort((a,b)=>order(a.path,b.path)),[...contract.implementationSources].sort((a,b)=>order(a.path,b.path)))) throw Error('implementation_changed')
}
