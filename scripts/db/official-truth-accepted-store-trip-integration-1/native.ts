/** Four mandatory native suites. R10 changes only their aggregate test
 * contract; each keeps real independent state and the original case bounds. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { quote } from './native-schema'
import { declareNativeTrip,nativeIds } from './native-fixture'
import { nativeTrip } from './native-http'
import { nativeBoundaryProof } from './native-boundaries'
import { retainedIntegrityProof } from './native-integrity'
import { nativeWaitProof } from './native-waits'
import { nativeSemanticReproof } from './native-semantic-reproof'
import { runNativeSuite,nativeCurrent as current,nativeUnknown as unknown,type NativeSuite } from './native-suite'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'
import { acceptedStoreClientResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/client-result'
import { acceptedStoreRuleReference } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/engine-reference'
type Json=Record<string,unknown>

export async function nativeAcceptedStoreBoundariesProof(t:TestContext):Promise<void> {
  await runNativeSuite(t,'boundaries',async suite=>{
    const {owner,runtime,state,http,witness,sql}=suite
    await owner.phase('all actual pinned SSR / outgoing / target / request / key boundary cases',
      ()=>nativeBoundaryProof(t,runtime,state,http,witness,sql,owner))
  })
}

export async function nativeAcceptedStoreProof(t:TestContext):Promise<void> {
  await runNativeSuite(t,'native-publication',async suite=>{
    const {owner,cluster,sql,http,witness,state,runtime,count,publication,request,read}=suite
    let completed=0
    await owner.phase('closed availability / origin / bounded body before Auth or DB',async()=>{
      const cookiesBefore=state.authCookieReads,requestsBefore=http.requests.length
      const respond=(body:string,headers:Record<string,string>={})=>owner.run(()=>runtime.request.acceptedStoreTripRequest(request(body,headers)))
      state.binding=null
      assert.equal((await respond('{}')).status,503)
      state.binding=witness.binding
      assert.equal((await respond('{}',{origin:'https://foreign.example'})).status,403)
      assert.equal((await respond('x'.repeat(8193))).status,413)
      assert.equal((await respond(JSON.stringify({tripId:nativeTrip,revision:suite.trip.revision,actor:'forbidden'}))).status,400)
      assert.equal(state.authCookieReads,cookiesBefore);assert.equal(http.requests.length,requestsBefore)
    })
    const {first,a}=await owner.phase('genuine protected publication A / fresh reader / real client binding',async()=>{
      const first=await publication();assert.equal(first.head.sequence,1);assert.equal(witness.casCount(),1)
      assert.equal(count('versions'),1);assert.equal(count('operations'),1);assert.equal(count('originals'),1);assert.equal(count('ciphertexts'),1)
      assert.equal(count('reservations'),0);assert.equal(count('stages'),0)
      assert.equal(sql(`select count(*) from official_accepted_trip_private.versions where manifest::text like '%${nativeTrip}%' or manifest::text like '%synthetic-traveller%'`),'0')
      assert.equal(sql(`select count(*) from official_accepted_trip_private.ciphertexts where envelope::text like '%SYNTHETIC LOCAL TEST ONLY%'`),'0')
      assert(witness.keyCopies.length>0&&witness.keyCopies.every(k=>k.every(byte=>byte===0)))
      const sourceStarts=state.sourceStarts,firstReadStarted=performance.now(),a=current(await read())
      assert.equal(a.receiptFingerprint,first.receipt);assert.equal(state.sourceStarts,sourceStarts)
      assert(a.deadlineFromRequestStartMs>performance.now()-firstReadStarted,'Fresh result must retain a usable monotonic deadline without double subtracting server work')
      assert.equal(a.evaluations.find(e=>e.result!=='unknown')!.result,'not_required')
      // A genuine native current response and its actual saved Trip cross the
      // real client decoder. No positive DTO or evaluator is constructed here.
      const client=acceptedStoreClientResult(a,suite.trip),positive=client.evaluations.find(e=>e.result!=='unknown')!
      assert.equal(client.receiptFingerprint,first.receipt);assert.equal(first.receipt.length,81)
      const reference=acceptedStoreRuleReference(first.receipt)
      assert.equal(reference.length,79);assert.equal(reference,`ot-accepted-v1:${first.receipt.slice('ot-provenance-v1:'.length)}`)
      assert.equal(positive.evidence.ruleReference,reference,'The unchanged engine must preserve the complete mapped reference')
      const helperPath='lib/readiness/official-truth-accepted-store-trip-integration-1/engine-reference.ts'
      const helperSources=witness.binding.contract.implementationSources.filter(value=>value.path===helperPath)
      assert.equal(helperSources.length,1);assert.equal(helperSources[0]!.utf8,readFileSync(helperPath,'utf8'))
      const altered=JSON.parse(JSON.stringify(a)) as AcceptedStoreTripResult
      altered.evaluations.find(e=>e.result!=='unknown')!.evidence.ruleReference=reference.slice(0,-1)+(reference.endsWith('0')?'1':'0')
      assert.throws(()=>acceptedStoreClientResult(altered,suite.trip),{message:'response_binding_invalid'})
      for(const malformed of [first.receipt.slice(0,-1),first.receipt+'\n',first.receipt.replace('provenance-v1','provenance-v2'),first.receipt.toUpperCase()]) {
        owner.check();assert.throws(()=>acceptedStoreRuleReference(malformed),{message:'accepted_store_receipt_invalid'})
      }
      assert.equal(acceptedStoreClientResult(a,suite.trip).evaluations.find(e=>e.result!=='unknown')!.evidence.ruleReference,reference)
      const again=current(await read());assert.equal(again.sourceCheckedAt,a.sourceCheckedAt);assert.equal(again.acceptedAt,a.acceptedAt)
      assert.equal(state.sourceStarts,sourceStarts);completed++
      t.diagnostic(JSON.stringify({proof:'actual-producer-commit-fresh-reader',postgres:cluster.version,node:process.versions.node,
        receipt:first.receipt,sourceCheckedAt:a.sourceCheckedAt,acceptedAt:a.acceptedAt,readAt:a.readAt,expiresAt:a.expiresAt,
        selectedPositive:1,otherCellsUnknown:true,independentReaderSourceCalls:0,deadlineFromRequestStartMs:a.deadlineFromRequestStartMs,
        actualClientDecoderPassed:true,fullReceiptLength:81,engineReferenceLength:79,alteredReferenceRefused:true,referenceHelperInActualSourceClosure:true}))
      return {first,a}
    })
    await owner.phase('strict R2 false fact / actual retained semantic re-extraction',async()=>{
      await nativeSemanticReproof(t,runtime,http,witness,sql,suite.trip,owner);completed++
    })
    await owner.phase('all four actual staged mismatch refusals',async()=>{
      for(const mutate of [
        (m:Json)=>{(m.claim as Json).fact={kind:'requirement_effect',effect:'required',visaMode:'electronic_visa'}},
        (m:Json)=>{(m.archive as Json).plaintext='forbidden even in provisional stage'},
        (m:Json)=>{(m.metadata as Json).key='forbidden even in provisional stage'},
        (m:Json)=>{(m.evidence as Json).canonicalUrl='https://accepted-trip.example/different'},
      ]) {
        owner.check()
        let reached=false
        http.faults.beforeRpc=async(name,payload)=>{if(name==='official_truth_trip_store_prepare_v1'&&payload.phase==='stage'){reached=true;mutate(payload.manifest as Json)}}
        const restoreHook=owner.restore(()=>{delete http.faults.beforeRpc})
        let refused:Awaited<ReturnType<typeof runtime.producer.publishAcceptedStore>>
        try{refused=await owner.run(()=>runtime.producer.publishAcceptedStore(owner.signal))}finally{restoreHook()}
        assert(reached);assert.equal(refused.status,'unavailable');assert.equal(count('versions'),1);assert.equal(count('stages'),0)
        assert(http.evidence.slice(-3).some(e=>e.rpc==='official_truth_trip_store_prepare_v1'&&!e.committed))
      }
      completed++
    })
    const b=await owner.phase('actual successor COMMIT / lost ACK / reconciliation / full support identity',async()=>{
      state.successor=true;let dropped=false
      http.faults.afterCommit=async(name)=>{if(name==='official_truth_trip_store_finalize_v1'&&!dropped){dropped=true;return 'drop'}}
      const restoreHook=owner.restore(()=>{delete http.faults.afterCommit})
      try{assert.equal((await owner.run(()=>runtime.producer.publishAcceptedStore(owner.signal))).status,'unavailable')}finally{restoreHook()}
      assert(dropped);assert.equal(count('versions'),2);assert.equal(count('operations'),2);assert.equal(count('reservations'),0)
      assert.equal(witness.casCount(),1)
      const callsBeforeReconcile=state.sourceStarts
      assert.equal(await owner.run(()=>runtime.producer.reconcileAcceptedStore(owner.signal)),'reconciled');assert.equal(witness.casCount(),2)
      assert.equal(state.sourceStarts,callsBeforeReconcile);assert.equal(count('versions'),2)
      const b=current(await read());assert.notEqual(b.receiptFingerprint,a.receiptFingerprint)
      assert.equal(b.evaluations.find(e=>e.result!=='unknown')!.result,'required');completed++
      // The actual successor support preserves every retained Schema-2 identity
      // field. This runs only after genuine successor COMMIT and fresh read B.
      assert.equal(sql(`select (count(*)=1 and bool_and(
        (s.identity_schema,s.content_item_id,s.content_item_version,s.representation_id,s.representation_version,
         s.identity_profile_id,s.identity_profile_version,s.content_type,s.rule_scope_key,s.version_id,s.source_id,
         s.evidence_lifecycle,s.evidence_validation_state,s.source_class)
        =(e.identity_schema,e.content_item_id,e.content_item_version,e.representation_id,e.representation_version,
         e.identity_profile_id,e.identity_profile_version,e.content_type,e.rule_scope_key,e.version_id,e.source_id,
         e.lifecycle,e.validation_state,src.source_class)))::text
        from official_accepted_trip_private.current_versions cv join official_accepted_trip_private.versions v on v.receipt=cv.receipt
        join private.official_rule_claim_support s on s.claim_id=v.claim_id
        join private.official_evidence_versions e on e.version_id=s.version_id
        join private.official_sources src on src.source_id=e.source_id`),'true')
      return b
    })
    await owner.phase('partial restore refusal / exact current recovery',async()=>{
      const headBefore=sql('select row_to_json(h)::text from official_accepted_trip_private.heads h')
      // Deliberately corrupted *local fixture* restore. No product transition uses
      // this DBA helper. Historical rows, journal and external witness stay intact.
      const restoreCurrent=(receipt:string)=>sql(`begin;
        update official_accepted_trip_private.current_versions set receipt=${quote(receipt)};
        update private.official_rule_claims c set accepted_at=(v.legacy_projection#>>'{claim,accepted_at}')::timestamptz
          from official_accepted_trip_private.versions v where v.receipt=${quote(receipt)} and c.claim_id=v.claim_id;
        update private.official_rule_claim_requirement_effect f set effect=v.legacy_projection#>>'{fact,effect}',visa_mode=v.legacy_projection#>>'{fact,visa_mode}'
          from official_accepted_trip_private.versions v where v.receipt=${quote(receipt)} and f.claim_id=v.claim_id;
        delete from private.official_rule_claim_support s using official_accepted_trip_private.versions v where v.receipt=${quote(receipt)} and s.claim_id=v.claim_id;
        insert into private.official_rule_claim_support select x.* from official_accepted_trip_private.versions v,
          jsonb_populate_recordset(null::private.official_rule_claim_support,v.legacy_projection->'supports') x where v.receipt=${quote(receipt)};
        set constraints all immediate;commit;`)
      restoreCurrent(first.receipt);unknown(await read());assert.equal(sql('select row_to_json(h)::text from official_accepted_trip_private.heads h'),headBefore)
      assert.equal(witness.casCount(),2);restoreCurrent(b.receiptFingerprint!);current(await read());completed++
    })
    assert.equal(completed,5)
    t.diagnostic(JSON.stringify({proof:'native-publication-restore-families',completedFamilies:completed,projectionRestoreRejected:true,
      custodyEnvelopeDigest:createHash('sha256').update(sql('select envelope::text from official_accepted_trip_private.ciphertexts order by receipt')).digest('hex')}))
  })
}

/** Genuine prerequisites only: not duplicate Lost-ACK/restore family claims. */
async function actualABPrerequisite(suite:NativeSuite) {
  const {owner,publication,read,state,count,witness}=suite
  return owner.phase('prerequisite: independent genuine A then B / confirmations / current B read',async()=>{
    const first=await publication();assert.equal(first.head.sequence,1);assert.equal(witness.casCount(),1)
    const a=current(await read());assert.equal(a.receiptFingerprint,first.receipt)
    assert.equal(a.evaluations.find(e=>e.result!=='unknown')!.result,'not_required')
    state.successor=true
    const second=await publication();assert.equal(second.head.sequence,2);assert.equal(witness.casCount(),2)
    const b=current(await read());assert.equal(b.receiptFingerprint,second.receipt);assert.notEqual(b.receiptFingerprint,a.receiptFingerprint)
    assert.equal(b.evaluations.find(e=>e.result!=='unknown')!.result,'required')
    assert.equal(count('versions'),2);assert.equal(count('operations'),2)
    return b
  })
}

export async function nativeAcceptedStoreIntegrityProof(t:TestContext):Promise<void> {
  await runNativeSuite(t,'integrity-rls',async suite=>{
    const {owner,sql,http,witness,runtime,read}=suite
    const b=await actualABPrerequisite(suite)
    let completed=0
    await owner.phase('all retained Evidence / support / archive / custody / current-row integrity cases',async()=>{
      await retainedIntegrityProof(t,sql,http,witness,b.receiptFingerprint!,read);completed++
    })
    await owner.phase('actual own / foreign / missing Trip and persisted context recovery',async()=>{
      runtime.rate.readinessRateLeeren()
      const foreign=await owner.run(()=>runtime.reader.readAcceptedStoreTrip(nativeIds.foreignTrip,suite.trip.revision,owner.signal))
      const missing=await owner.run(()=>runtime.reader.readAcceptedStoreTrip('33333333-3333-4333-8333-333333333335',suite.trip.revision,owner.signal))
      assert.equal(foreign.status,404);assert.deepEqual(foreign,missing)
      sql(`update public.trip_traveller_documents set expires_on='2031-12-31' where id=${quote(nativeIds.nationalId)}`)
      unknown(await read());suite.trip=await owner.run(()=>declareNativeTrip(http,runtime,{},owner));current(await read());completed++
    })
    assert.equal(completed,2)
    t.diagnostic(JSON.stringify({proof:'native-integrity-rls-families',completedFamilies:completed,prerequisitePublications:2,bootstrapNotCountedAsLostAckOrRestoreProof:true}))
  })
}

export async function nativeAcceptedStoreWaitLifecycleProof(t:TestContext):Promise<void> {
  await runNativeSuite(t,'wait-lifecycle',async suite=>{
    const {owner,cluster,sql,http,runtime,read,count}=suite
    await actualABPrerequisite(suite)
    let completed=0
    await owner.phase('all four genuine native Finalize waits / authority / expiry / Trip controls',async()=>{
      suite.trip=await nativeWaitProof(t,cluster,sql,runtime,http,suite.trip,owner);completed++
    })
    await owner.phase('actual internal conflict / withdrawal / no reactivation',async()=>{
      assert.equal((await owner.run(()=>runtime.producer.conflictAcceptedStore(owner.signal))).status,'confirmed');unknown(await read())
      assert.equal((await owner.run(()=>runtime.producer.withdrawAcceptedStore(owner.signal))).status,'confirmed');unknown(await read())
      assert.equal(count('versions'),2);assert.equal(count('operations'),4)
      assert.equal((await owner.run(()=>runtime.producer.publishAcceptedStore(owner.signal))).status,'unavailable')
      assert.equal(count('versions'),2);completed++
    })
    assert.equal(completed,2)
    t.diagnostic(JSON.stringify({proof:'native-wait-lifecycle-families',completedFamilies:completed,prerequisitePublications:2,
      journalOperations:count('operations'),immutableVersions:count('versions'),bootstrapNotCountedAsLostAckOrRestoreProof:true}))
  })
}
