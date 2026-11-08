/** A deliberately forged historical input, never a successful SQL publication.
 * The untouched control is read through the actual authenticated/native store.
 * This isolates the new historical reader's semantic extraction boundary. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { createHash } from 'node:crypto'
import { provenanceCanonical,provenanceHash } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,verifyAcceptedStoreIntegratedBundleV1,
  type IntegratedPilotBundleInput,type IntegratedPilotPayload,type IntegratedPilotArtifactType } from '@/lib/readiness/official-truth-integrated-pilot-bundle'
import type { ArchiveWire } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/wire'
import type { Trip } from '@/types/trips'
import type { nativeProductRuntime } from './native-loader'
import type { nativeBinding } from './native-fixture'
import type { startNativeHttp } from './native-http'
import { quote,type nativeSql } from './native-schema'
import { fixtureExtractor } from './fixtures'
import type { NativeSuiteOwnership } from './native-suite'

/** Same pure receipt-rehash recipe as the frozen historical negative fixture;
 * the required verifier here is the actual Accepted-Store R2 profile. No LOCAL
 * profile assertion is reused, relaxed or treated as accepted-store authority. */
function contradictingAcceptedArchive(wire:ArchiveWire):IntegratedPilotBundleInput {
  const payload=JSON.parse(Buffer.from(wire.receiptBase64,'base64').toString('utf8')) as IntegratedPilotPayload
  assert.equal(payload.policy,null,'This package supports the single-primary rule only')
  const fact={kind:'requirement_effect',effect:'required',visaMode:'visa_on_arrival'}
  assert.notDeepEqual(payload.candidate.fact,fact)
  const factHash=provenanceHash('ot-fact-v1',{factSchema:payload.candidate.factSchema,
    applicabilitySchema:payload.candidate.applicabilitySchema,factKind:payload.candidate.factKind,
    requirementType:payload.candidate.requirementType,fact})!
  const candidateBinding=provenanceHash('ot-candidate-v1',{scope:payload.globalCell.scope,ruleScopeKey:payload.globalCell.ruleScopeKey,
    factKind:payload.candidate.factKind,requirementType:payload.candidate.requirementType,schemaFamily:payload.extractor.schemaFamily,
    factSchema:payload.candidate.factSchema,applicabilitySchema:payload.candidate.applicabilitySchema,factHash,
    evidenceQuality:payload.evidenceQuality,supportVersionIds:payload.supports.map(s=>s.versionId)})!
  const next={...payload,candidate:{...payload.candidate,fact,factHash,candidateBinding}}
  const recordFingerprint=provenanceHash('ot-provenance-v1',next)!
  const binding=JSON.parse(Buffer.from(wire.custodyBindingBase64,'base64').toString('utf8')) as {value:Record<string,unknown>}
  const bundle:IntegratedPilotBundleInput={recordFingerprint,receiptBytes:Buffer.from(provenanceCanonical(next)!),
    custodyBindingBytes:Buffer.from(provenanceCanonical({...binding,value:{...binding.value,receiptFingerprint:recordFingerprint}})!),
    artifacts:wire.artifacts.map(a=>({pin:a.pin,artifactType:a.artifactType as IntegratedPilotArtifactType,
      artifactContractVersion:a.artifactContractVersion,canonicalBytes:Buffer.from(a.canonicalBase64,'base64')}))}
  assert.notEqual(bundle.recordFingerprint,wire.recordFingerprint)
  const verified=verifyAcceptedStoreIntegratedBundleV1({profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,bundle})
  assert(verified.ok,'The contradictory clone must pass the complete, unchanged strict R2 closure before semantic re-extraction')
  return bundle
}

export async function nativeSemanticReproof(t:TestContext,runtime:ReturnType<typeof nativeProductRuntime>,
  http:Awaited<ReturnType<typeof startNativeHttp>>,witness:Awaited<ReturnType<typeof nativeBinding>>,
  sql:ReturnType<typeof nativeSql>,trip:Trip,owner?:NativeSuiteOwnership) {
  owner?.check()
  const run=<T>(operation:()=>Promise<T>)=>owner?owner.run(operation):operation()
  const persistent=()=>sql(`select encode(sha256(jsonb_build_object(
    'heads',(select jsonb_agg(to_jsonb(x)) from official_accepted_trip_private.heads x),
    'operations',(select jsonb_agg(to_jsonb(x) order by sequence) from official_accepted_trip_private.operations x),
    'versions',(select jsonb_agg(to_jsonb(x) order by receipt) from official_accepted_trip_private.versions x),
    'supports',(select jsonb_agg(to_jsonb(x) order by receipt) from official_accepted_trip_private.version_supports x),
    'originals',(select jsonb_agg(to_jsonb(x) order by receipt) from official_accepted_trip_private.originals x),
    'ciphertexts',(select jsonb_agg(to_jsonb(x) order by receipt) from official_accepted_trip_private.ciphertexts x),
    'archiveBlobs',(select jsonb_agg(jsonb_build_array(digest,encode(sha256(canonical_bytes),'hex')) order by digest)
      from official_provenance_private.artifact_blobs))::text::bytea),'hex')`)
  owner?.noteSemanticStep('persisted_baseline')
  const before=persistent(),cas=witness.casCount(),rpcFrom=http.evidence.length
  const readerOwner=owner?owner.controller():new AbortController(),life=new runtime.lifetime.AcceptedStoreLifetime(readerOwner.signal,45_000)
  const db=new runtime.database.AcceptedStoreDatabase(life,witness.binding)
  let originalHash='',originalReceipt='',forgedReceipt=''
  const bindingCases:string[]=[]
  const cleanupObservation={snapshotTokenMatched:false,ordinary:{entries:0,tokenMatches:0,commits:0,committedRemovedOne:false,acknowledged:false},
    disposal:{status:'not_observed' as 'not_observed'|'not_started'|'acknowledged'|'unknown',removed:null as number|null,intervalCleanupHttpEntries:0,intervalCleanupRpcOutcomes:[] as {committed:boolean;sqlState:string|null}[]}}
  let disposalRequestFrom:number|null=null,disposalEvidenceFrom:number|null=null
  const dispose=async()=>{
    disposalRequestFrom=http.requests.length;disposalEvidenceFrom=http.evidence.length
    const result=await db.dispose();cleanupObservation.disposal.status=result.status
    if(result.status==='acknowledged')cleanupObservation.disposal.removed=result.removed
  }
  try {
    owner?.noteSemanticStep('identity')
    assert.equal(await run(()=>db.userIdentity()),http.claims.sub)
    owner?.noteSemanticStep('reserve')
    const reserve=await run(()=>db.reserve({cell:witness.binding.contract.id,contractDigest:witness.binding.contract.digest,
      profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,purpose:'read',tripId:trip.id,revision:trip.revision})) as {token:string}
    assert.equal(typeof reserve.token,'string')
    owner?.noteSemanticStep('snapshot')
    const response=await run(()=>db.snapshot({token:reserve.token})) as {snapshot:unknown}
    owner?.noteSemanticStep('genuine_reproof')
    const genuine=await run(()=>runtime.reproof.reproveRetainedSnapshot(response.snapshot,witness.binding,life))
    owner?.noteSemanticStep('genuine_control')
    genuine.assertCurrent();originalReceipt=genuine.receipt
    assert.deepEqual(genuine.claim.fact,{kind:'requirement_effect',effect:'not_required',visaMode:'visa_exempt'})
    type Snapshot=typeof genuine.snapshot
    const malformed:readonly [string,string,(value:Snapshot)=>void][]=[
      ['stale compiled contract binding','retained_binding_invalid',value=>{value.contractDigest='f'.repeat(64)}],
      ['stale copied code definition binding','retained_binding_invalid',value=>{value.codeDigest='e'.repeat(64)}],
      ['forged recorded decision review','retained_review_invalid',value=>{value.manifest.reviewPacketKey=`review-packet:v3:${'0'.repeat(64)}`}],
      ['forged retained Evidence support','retained_evidence_invalid',value=>{value.manifest.evidence={...(value.manifest.evidence as Record<string,unknown>),versionId:`ev2_${'0'.repeat(32)}`}}],
      ['unavailable current source profile pin','profile_pin_missing',value=>{
        const catalog=value.catalog as {acceptedStoreProfilePins:Record<string,unknown>[]}
        catalog.acceptedStoreProfilePins=catalog.acceptedStoreProfilePins.map(pin=>({...pin,current:false}))
      }],
    ]
    for(const [name,reason,change] of malformed) {
      owner?.check()
      owner?.noteSemanticStep('malformed_binding')
      const clone=structuredClone(genuine.snapshot);change(clone)
      await assert.rejects(run(()=>runtime.reproof.reproveRetainedSnapshot(clone,witness.binding,life)),
        error=>error instanceof Error&&error.message===reason,name)
      bindingCases.push(name)
    }
    // This is only the existing closed test registry object, never a canonical
    // production definition or SDK mutation. The actual new reader compares
    // its current descriptor with the unchanged archived definition pins.
    owner?.noteSemanticStep('changed_extractor')
    const version=Object.getOwnPropertyDescriptor(fixtureExtractor,'extractorVersion')!
    const restoreDefinition=owner?.restore(()=>Object.defineProperty(fixtureExtractor,'extractorVersion',version))
    try {
      Object.defineProperty(fixtureExtractor,'extractorVersion',{...version,value:fixtureExtractor.extractorVersion+1})
      await assert.rejects(run(()=>runtime.reproof.reproveRetainedSnapshot(response.snapshot,witness.binding,life)),
        error=>error instanceof Error&&error.message==='current_extractor_changed')
      bindingCases.push('changed current closed-fixture extractor definition')
    } finally {if(restoreDefinition)restoreDefinition();else Object.defineProperty(fixtureExtractor,'extractorVersion',version)}
    owner?.check()
    owner?.noteSemanticStep('contradiction_build')
    const snapshot=structuredClone(genuine.snapshot)
    const sourceArchive=snapshot.archive as ArchiveWire&{edges:{receipt:Record<string,unknown>[];binding:Record<string,unknown>[];artifacts:Record<string,unknown>[]}}
    const bundle=contradictingAcceptedArchive(sourceArchive),wire=runtime.archive.archiveWire(bundle)
    owner?.check()
    owner?.noteSemanticStep('strict_archive')
    const strict=runtime.archive.verifyArchive(wire)
    forgedReceipt=strict.receipt.recordFingerprint
    assert.deepEqual(wire.artifacts,sourceArchive.artifacts,'Every original artifact byte and pin stays unchanged')
    const edges=structuredClone(sourceArchive.edges)
    for(const edge of [...edges.receipt,...edges.binding]){owner?.check();edge.record_fingerprint=forgedReceipt}
    snapshot.archive={...wire,edges};snapshot.receipt=forgedReceipt
    snapshot.metadata={...snapshot.metadata,receiptFingerprint:forgedReceipt}
    snapshot.manifest.metadata=snapshot.metadata
    snapshot.manifest.claim={...(snapshot.manifest.claim as Record<string,unknown>),fact:strict.receipt.payload.candidate.fact}
    owner?.check()
    owner?.noteSemanticStep('original_key')
    const acquiringKey=life.run(()=>witness.binding.key.resolve(life.signal))
    owner?.track(acquiringKey)
    const key=await acquiringKey
    try {
      owner?.check();life.assertCurrent();assert(key)
      owner?.noteSemanticStep('original_crypto')
      const original=runtime.custody.decryptOriginal(genuine.snapshot.ciphertext,genuine.snapshot.metadata,key)
      originalHash=createHash('sha256').update(original,'utf8').digest('hex')
      assert.equal(originalHash,genuine.snapshot.metadata.contentHash)
      snapshot.ciphertext=runtime.custody.encryptOriginal(original,snapshot.metadata,key)
      assert.equal(runtime.custody.decryptOriginal(snapshot.ciphertext,snapshot.metadata,key),original)
    } finally {key?.fill(0)}
    // Edges, code pins, Evidence, original hash, AAD and parser are all real.
    // This precise error occurs only after actual match/extract and canonical
    // regelKandidatAkzeptieren, rather than an earlier byte/hash refusal.
    owner?.noteSemanticStep('false_fact_reproof')
    await assert.rejects(run(()=>runtime.reproof.reproveRetainedSnapshot(snapshot,witness.binding,life)),
      error=>error instanceof Error&&error.message==='retained_fact_invalid')
    owner?.noteSemanticStep('untouched_reproof')
    const after=await run(()=>runtime.reproof.reproveRetainedSnapshot(response.snapshot,witness.binding,life))
    after.assertCurrent();assert.equal(after.receipt,originalReceipt)
    // The direct semantic fixture is still healthy. A normal acknowledged
    // cleanup proves removal before the unchanged one-shot R4 disposal; an
    // unknown later disposal is never credited with this ordinary deletion.
    owner?.check();life.assertCurrent()
    assert.equal(sql(`select count(*) from official_accepted_trip_private.reservations
      where token=${quote(reserve.token)} and purpose='read' and state='snapshotted'
        and user_id=${quote(http.claims.sub)} and session_id=${quote(http.claims.session_id)}
        and trip_id=${quote(trip.id)} and trip_revision=${quote(String(trip.revision))}::bigint
        and expires_at>clock_timestamp() and original_expiry>clock_timestamp()`),'1')
    cleanupObservation.snapshotTokenMatched=true
    const previousBefore=http.faults.beforeRpc,previousAfter=http.faults.afterCommit,ordinaryFrom=http.evidence.length
    const restoreHooks=()=>{
      if(previousBefore===undefined)delete http.faults.beforeRpc;else http.faults.beforeRpc=previousBefore
      if(previousAfter===undefined)delete http.faults.afterCommit;else http.faults.afterCommit=previousAfter
    }
    const restore=owner?.restore(restoreHooks)
    try {
      http.faults.beforeRpc=async(name,payload)=>{
        if(previousBefore)await previousBefore(name,payload)
        if(name==='official_truth_trip_store_cleanup_v1'){
          cleanupObservation.ordinary.entries++
          if(payload.token===reserve.token)cleanupObservation.ordinary.tokenMatches++
        }
      }
      http.faults.afterCommit=async(name,payload,result)=>{
        const acknowledgement=await previousAfter?.(name,payload,result)
        if(name==='official_truth_trip_store_cleanup_v1'&&payload.token===reserve.token){
          cleanupObservation.ordinary.commits++
          cleanupObservation.ordinary.committedRemovedOne=typeof result==='object'&&result!==null
            &&Object.keys(result).length===1&&'removed'in result&&result.removed===1
        }
        return acknowledgement
      }
      const cleaned=await run(()=>db.cleanup({token:reserve.token}))
      owner?.check();life.assertCurrent()
      assert.deepEqual(cleaned,{removed:1})
      cleanupObservation.ordinary.acknowledged=true
      assert.equal(cleanupObservation.ordinary.entries,1);assert.equal(cleanupObservation.ordinary.tokenMatches,1)
      assert.equal(cleanupObservation.ordinary.commits,1);assert.equal(cleanupObservation.ordinary.committedRemovedOne,true)
      assert.equal(http.evidence.slice(ordinaryFrom).filter(value=>value.rpc==='official_truth_trip_store_cleanup_v1'&&value.committed).length,1)
    } finally {if(restore)restore();else restoreHooks()}
  } catch(error){owner?.stop(error);throw error}
  finally {
    try {if(owner)await owner.cleanup(dispose,()=>life.settle(),()=>http.settle());else{await dispose();await life.settle();await http.settle()}}
    finally {
      // These cleanup events span disposal through the final owned drain; a
      // late ordinary handler can also finish here. They are not exclusively
      // correlated to the one disposal request. Its own status stays separate.
      if(disposalRequestFrom!==null)cleanupObservation.disposal.intervalCleanupHttpEntries=http.requests.slice(disposalRequestFrom).filter(value=>value.path==='/rest/v1/rpc/official_truth_trip_store_cleanup_v1').length
      if(disposalEvidenceFrom!==null)cleanupObservation.disposal.intervalCleanupRpcOutcomes=http.evidence.slice(disposalEvidenceFrom).filter(value=>value.rpc==='official_truth_trip_store_cleanup_v1')
        .map(value=>({committed:value.committed,sqlState:value.sqlState}))
      t.diagnostic(JSON.stringify({proof:'native-semantic-cleanup-observation',...cleanupObservation}))
    }
  }
  owner?.noteSemanticStep('persistent_after')
  owner?.check();assert.equal(persistent(),before);assert.equal(witness.casCount(),cas)
  assert(http.evidence.slice(rpcFrom).some(e=>e.rpc==='official_truth_trip_store_reserve_v1'&&e.committed))
  assert(http.evidence.slice(rpcFrom).some(e=>e.rpc==='official_truth_trip_store_snapshot_v1'&&e.committed))
  assert(!http.evidence.slice(rpcFrom).some(e=>e.rpc==='official_truth_trip_store_finalize_v1'))
  assert.equal(sql('select count(*) from official_accepted_trip_private.reservations'),'0')
  t.diagnostic(JSON.stringify({proof:'native-snapshot-rehashed-fact-semantic-refusal',profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,
    originalReceipt,forgedReceipt,originalHash,bindingCases,strictStructuralPass:true,exactRefusal:'retained_fact_invalid',
    untouchedPositiveBeforeAndAfter:true,originalBytesAndArtifactPinsUnchanged:true,durableHistoryAndWitnessUnchanged:true,
    boundary:'Direct historical reproof negative over a genuine native snapshot; no forged SQL publication or accepted authority is claimed'}))
}
