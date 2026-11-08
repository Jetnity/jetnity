import 'server-only'
import { z } from 'zod'
import { loadOfficialTruthServerOwnedRetrievalWithCatalogTransport } from '../official-truth-server-owned-retrieval'
import { ACCEPTED_STORE_TRIP_CLOSURE_PROFILE } from '../official-truth-integrated-pilot-bundle'
import { historicalValuesEqual } from '../official-truth-autonomous-provenance-artifact'
import { regelScopeAusEvidenceScope } from '../rule-claims'
import { acceptedStoreBinding } from './binding-server'
import { AcceptedStoreLifetime } from './lifetime-server'
import { AcceptedStoreDatabase } from './database-server'
import { canonicalStoreMaterial, type AcceptedStoreOriginal } from './canonical-server'
import { storeProvenanceBundle } from './provenance-server'
import { archiveWire, verifyArchive, verifyCurrentImplementation } from './archive-server'
import { encryptOriginal, custodyMetadataSchema } from './custody-server'
import { readStoreCatalog, storeCatalogTransport } from './catalog-server'
import { requireCurrent,checkReservation,requireWitness,reconcilePending,witnessCommitted } from './protocol-server'
import { receiptSchema,headSchema } from './wire'

const inspectSchema=z.object({catalog:z.unknown(),catalogDigest:z.string().regex(/^[a-f0-9]{64}$/),now:z.string(),expiresAt:z.string()}).strict()
const stageSchema=z.object({digest:z.string().regex(/^[a-f0-9]{64}$/),now:z.string(),expiresAt:z.string()}).strict()
const finalizedSchema=z.object({kind:z.enum(['accept','withdraw','conflict']),operationId:z.string().uuid(),receipt:receiptSchema,head:headSchema,now:z.string()}).strict()
export type StorePublicationResult={status:'unavailable'}|{status:'confirmed';kind:'accept'|'withdraw'|'conflict';receipt:string;head:{sequence:number;hash:string}}

/** Internal only, no HTTP/schedule/activation entry. Every argument that could
 * assert a source, fact, receipt or actor is deliberately absent. */
export function publishAcceptedStore(signal:AbortSignal):Promise<StorePublicationResult>{return publishCurrent('accept',signal)}
export function withdrawAcceptedStore(signal:AbortSignal):Promise<StorePublicationResult>{return publishCurrent('withdraw',signal)}
export function conflictAcceptedStore(signal:AbortSignal):Promise<StorePublicationResult>{return publishCurrent('conflict',signal)}

async function publishCurrent(kind:'accept'|'withdraw'|'conflict',signal:AbortSignal):Promise<StorePublicationResult> {
  const binding=acceptedStoreBinding();if(!binding)return {status:'unavailable'}
  const life=new AcceptedStoreLifetime(signal,45_000);let db:AcceptedStoreDatabase|null=null
  let result:StorePublicationResult={status:'unavailable'},confirmedDeadline=0
  try {
    db=new AcceptedStoreDatabase(life,binding)
    const userId=await db.userIdentity();requireCurrent(binding,life)
    await db.cleanup({token:null});requireCurrent(binding,life)
    await reconcilePending(binding,db,life)
    const reserveStarted=performance.now()
    const reserved=checkReservation(await db.reserve({cell:binding.contract.id,contractDigest:binding.contract.digest,profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,
      purpose:'publish',tripId:null,revision:null}),binding,life,reserveStarted,userId)
    await requireWitness(binding,life,reserved.head)
    const inspectStarted=performance.now()
    const inspection=inspectSchema.parse(await db.prepare({token:reserved.token,phase:'inspect',kind:null,manifest:null}))
    life.pinWindow(inspectStarted,inspection.now,inspection.expiresAt);requireCurrent(binding,life)
    const base={profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,contractDigest:binding.contract.digest,codeDigest:binding.codeDigest,
      scopeKey:'',catalogDigest:inspection.catalogDigest}
    let manifest:Record<string,unknown>,receipt:string
    if(kind==='accept') {
      const registry=await readStoreCatalog(inspection.catalog,binding,life)
      // Frozen 64 KiB transport has its own ten-second ceiling and cannot be
      // parent-aborted. Reserve its WHOLE budget, await actual settlement, then
      // reject late results. #1131 framing/completeness remains a separate hold.
      requireCurrent(binding,life,10_000)
      const startedAt=new Date().toISOString(),started=performance.now()
      const retrieval=await life.run(()=>loadOfficialTruthServerOwnedRetrievalWithCatalogTransport({sourceId:binding.contract.source.sourceId,url:binding.contract.source.url},
        storeCatalogTransport(inspection.catalog,binding,life)))
      requireCurrent(binding,life)
      if(retrieval.status!=='server_owned_official_retrieval')throw Error('fresh_original_unavailable')
      const material=canonicalStoreMaterial(binding.contract,registry,retrieval as AcceptedStoreOriginal,startedAt)
      const bundle=storeProvenanceBundle(material),archive=archiveWire(bundle),verified=verifyArchive(archive)
      verifyCurrentImplementation(verified,binding.contract)
      const custody=verified.artifacts.filter(a=>a.artifactType==='AcceptedEvidenceCustodyV1')
      if(custody.length!==1)throw Error('original_custody_invalid')
      receipt=bundle.recordFingerprint
      const metadata=custodyMetadataSchema.parse({schema:'accepted-store-original-v1',operationId:reserved.operationId,receiptFingerprint:receipt,
        originalPin:custody[0]!.pin,evidenceVersionId:material.evidence.versionId,identity:binding.contract.source.binding,
        canonicalUrl:material.original.canonicalUrl,contentType:material.original.contentType,contentHash:material.original.sourceContentHash,
        contentBytes:Buffer.byteLength(material.original.sourceSnapshot,'utf8'),originalRetrievedAt:material.original.retrievedAt,
        retainUntil:new Date(Date.parse(material.original.retrievedAt)+binding.retentionSeconds*1000).toISOString(),
        keyId:binding.key.id,keyPolicyDigest:binding.key.policyDigest})
      life.pinWindow(started,material.original.retrievedAt,new Date(Date.parse(material.original.retrievedAt)+binding.sourceMaxAgeSeconds*1000).toISOString())
      requireCurrent(binding,life)
      const key=await life.run(()=>binding.key.resolve(life.signal))
      let ciphertext:ReturnType<typeof encryptOriginal>
      try{requireCurrent(binding,life);if(!key)throw Error('custody_key_unavailable');ciphertext=encryptOriginal(material.original.sourceSnapshot,metadata,key)}finally{key?.fill(0)}
      manifest={...base,scopeKey:material.claim.key,archive,evidence:material.evidence,claim:material.claim,reviewPacketKey:material.reviewPacketKey,
        originalStartedAt:material.originalStartedAt,metadata,ciphertext}
    } else {
      if(!reserved.priorVersion)throw Error('lifecycle_version_missing')
      receipt=reserved.priorVersion
      const scope=regelScopeAusEvidenceScope(binding.contract.scope);if(!scope.ok)throw Error('scope_invalid')
      manifest={...base,scopeKey:scope.key,observedVersion:receipt}
    }
    requireCurrent(binding,life)
    const stageStarted=performance.now(),staged=stageSchema.parse(await db.prepare({token:reserved.token,phase:'stage',kind,manifest}))
    life.pinWindow(stageStarted,staged.now,staged.expiresAt);requireCurrent(binding,life)
    await requireWitness(binding,life,reserved.head)
    const finalized=finalizedSchema.parse(await db.finalize({token:reserved.token,digest:staged.digest}));requireCurrent(binding,life)
    if(finalized.kind!==kind||finalized.operationId!==reserved.operationId||finalized.receipt!==receipt)throw Error('finalization_unconfirmed')
    const observed=await db.confirm({cell:binding.contract.id,operationId:reserved.operationId,ack:null});requireCurrent(binding,life)
    const confirmed=await witnessCommitted(binding,db,life,observed,{operationId:reserved.operationId,receipt,stageDigest:staged.digest,prior:reserved.head})
    if(!historicalValuesEqual(confirmed.head,finalized.head))throw Error('commit_head_changed')
    requireCurrent(binding,life);confirmedDeadline=performance.now()+life.remaining()
    result={status:'confirmed',kind,receipt,head:confirmed.head}
  } catch {result={status:'unavailable'}}
  finally {
    // R4 exception: one separately owned disposal, never confirmation/retry.
    if(db)await db.dispose()
    try{await life.settle()}catch{result={status:'unavailable'}}
  }
  if(signal.aborted||acceptedStoreBinding()!==binding||performance.now()>=confirmedDeadline)return {status:'unavailable'}
  return result
}

/** Callable internal reconciliation, at most one already committed operation.
 * No new acceptance/source request and no user-claim impersonation. */
export async function reconcileAcceptedStore(signal:AbortSignal):Promise<'unavailable'|'clear'|'reconciled'> {
  const binding=acceptedStoreBinding();if(!binding)return 'unavailable'
  const life=new AcceptedStoreLifetime(signal,45_000);let result:'unavailable'|'clear'|'reconciled'='unavailable',deadline=0
  try {const db=new AcceptedStoreDatabase(life,binding);result=await reconcilePending(binding,db,life);requireCurrent(binding,life);deadline=performance.now()+life.remaining()}
  catch {result='unavailable'}finally{try{await life.settle()}catch{result='unavailable'}}
  return signal.aborted||acceptedStoreBinding()!==binding||performance.now()>=deadline?'unavailable':result
}
