/** Mandatory real PostgreSQL + pinned SSR/SDK smoke and integrity proofs.
 * Not hosted PostgREST/Auth configuration, origin completeness or activation. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { createHash } from 'node:crypto'
import { startLocalProofCluster,assertLocalProofEnvironment } from '../official-truth-integrated-pilot-1/local-cluster'
import { nativeSql,installNativeSchema,quote } from './native-schema'
import { nativeProductRuntime,type NativeRuntimeState } from './native-loader'
import { startNativeHttp,nativeTrip } from './native-http'
import { seedNativeRows,seedNativeCatalog,nativeBinding,declareNativeTrip,nativeIds } from './native-fixture'
import { nativeBoundaryProof } from './native-boundaries'
import { retainedIntegrityProof } from './native-integrity'
import { nativeWaitProof } from './native-waits'
import { nativeSemanticReproof } from './native-semantic-reproof'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'

const signal=()=>new AbortController().signal
type Json=Record<string,unknown>
function current(response:{status:number;body:unknown}):AcceptedStoreTripResult {
  assert.equal(response.status,200);const result=response.body as AcceptedStoreTripResult
  assert.equal(result.status,'current',JSON.stringify({status:result.status}))
  assert(result.receiptFingerprint&&result.evidenceVersionId&&result.sourceCheckedAt&&result.acceptedAt&&result.readAt&&result.expiresAt)
  assert(result.deadlineFromRequestStartMs>0&&result.deadlineFromRequestStartMs<=45_000)
  assert(Date.parse(result.expiresAt)-Date.parse(result.readAt)<=15_000)
  const positives=result.evaluations.filter(e=>e.result!=='unknown')
  assert.equal(positives.length,1);assert.equal(positives[0]!.status,'current')
  assert.equal(positives[0]!.travellerClientRef,'synthetic-traveller')
  assert.equal(positives[0]!.credentialOptionRef,'synthetic-traveller:synthetic-passport')
  assert.equal(positives[0]!.requirementType,'visa')
  assert(result.evaluations.some(e=>e.travellerClientRef==='synthetic-other'&&e.result==='unknown'))
  assert(result.evaluations.some(e=>e.credentialOptionRef==='synthetic-traveller:synthetic-national-id'&&e.result==='unknown'))
  return result
}
function unknown(response:{status:number;body:unknown}) {
  if(response.status===200){const value=response.body as AcceptedStoreTripResult;assert.notEqual(value.status,'current');assert(value.evaluations.every(e=>e.result==='unknown'))}
  else assert([400,401,403,404,409,429,503].includes(response.status))
}

export async function nativeAcceptedStoreProof(t:TestContext):Promise<void> {
  assert.equal(process.versions.node.split('.')[0],'22','Required exact CI Node22 runtime; not a skip or local Node24 PASS')
  assertLocalProofEnvironment()
  const cluster=startLocalProofCluster(),sql=nativeSql(cluster)
  let http:Awaited<ReturnType<typeof startNativeHttp>>|null=null,witness:Awaited<ReturnType<typeof nativeBinding>>|null=null
  const envKeys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'] as const
  const previous=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]))
  let stage='schema',completed=0
  try {
    installNativeSchema(sql);seedNativeRows(sql)
    http=await startNativeHttp(cluster)
    process.env.NEXT_PUBLIC_SUPABASE_URL=http.url;process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=http.anonToken;process.env.SUPABASE_SERVICE_ROLE_KEY=http.serviceToken
    await seedNativeCatalog(http)
    witness=await nativeBinding(http.url,sql)
    const state:NativeRuntimeState={binding:witness.binding,cookie:http.cookie(),successor:false,sourceStarts:0,authCookieReads:0}
    const runtime=nativeProductRuntime(state)
    let trip=await declareNativeTrip(http,runtime)
    assert.equal(trip.party?.length,2);assert.equal(trip.ohneTag.length,1)
    assert(runtime.tripBinding.selectedTripBinding(trip,witness.binding.contract))
    stage='actual pinned SSR and request/key/target lifetime boundaries'
    await nativeBoundaryProof(t,runtime,state,http,witness,sql)
    const count=(table:string)=>Number(sql(`select count(*) from official_accepted_trip_private.${table}`))
    const publication=async()=>{
      const output=await runtime.producer.publishAcceptedStore(signal())
      assert.equal(output.status,'confirmed',JSON.stringify({stage,rpcs:http!.evidence.slice(-10)}))
      assert(output.status==='confirmed');return output
    }
    const request=(body:string,headers:Record<string,string>={})=>new Request(`${http!.url}/api/readiness/accepted-store`,{
      method:'POST',headers:{origin:http!.url,'content-type':'application/json','sec-fetch-site':'same-origin',...headers},body})
    const read=async()=>{runtime.rate.readinessRateLeeren();return runtime.request.acceptedStoreTripRequest(request(JSON.stringify({tripId:nativeTrip,revision:trip.revision})))}
    stage='closed availability, origin and bounded request body precede Auth/DB'
    const cookiesBefore=state.authCookieReads,requestsBefore=http.requests.length
    state.binding=null
    assert.equal((await runtime.request.acceptedStoreTripRequest(request('{}'))).status,503)
    state.binding=witness.binding
    assert.equal((await runtime.request.acceptedStoreTripRequest(request('{}',{origin:'https://foreign.example'}))).status,403)
    assert.equal((await runtime.request.acceptedStoreTripRequest(request('x'.repeat(8193)))).status,413)
    assert.equal((await runtime.request.acceptedStoreTripRequest(request(JSON.stringify({tripId:nativeTrip,revision:trip.revision,actor:'forbidden'})))).status,400)
    assert.equal(state.authCookieReads,cookiesBefore);assert.equal(http.requests.length,requestsBefore)
    stage='native fresh protected publication A'
    const first=await publication();assert.equal(first.head.sequence,1);assert.equal(witness.casCount(),1)
    assert.equal(count('versions'),1);assert.equal(count('operations'),1);assert.equal(count('originals'),1);assert.equal(count('ciphertexts'),1)
    assert.equal(count('reservations'),0);assert.equal(count('stages'),0)
    assert.equal(sql(`select count(*) from official_accepted_trip_private.versions where manifest::text like '%${nativeTrip}%' or manifest::text like '%synthetic-traveller%'`),'0')
    assert.equal(sql(`select count(*) from official_accepted_trip_private.ciphertexts where envelope::text like '%SYNTHETIC LOCAL TEST ONLY%'`),'0')
    assert(witness.keyCopies.length>0&&witness.keyCopies.every(k=>k.every(byte=>byte===0)))
    stage='fresh native independent reader A'
    const sourceStarts=state.sourceStarts,firstReadStarted=performance.now(),a=current(await read())
    assert.equal(a.receiptFingerprint,first.receipt);assert.equal(state.sourceStarts,sourceStarts)
    assert(a.deadlineFromRequestStartMs>performance.now()-firstReadStarted,'Fresh result must retain a usable monotonic deadline without double subtracting server work')
    assert.equal(a.evaluations.find(e=>e.result!=='unknown')!.result,'not_required')
    const again=current(await read());assert.equal(again.sourceCheckedAt,a.sourceCheckedAt);assert.equal(again.acceptedAt,a.acceptedAt)
    assert.equal(state.sourceStarts,sourceStarts);completed++
    t.diagnostic(JSON.stringify({proof:'actual-producer-commit-fresh-reader',postgres:cluster.version,node:process.versions.node,
      receipt:first.receipt,sourceCheckedAt:a.sourceCheckedAt,acceptedAt:a.acceptedAt,readAt:a.readAt,expiresAt:a.expiresAt,
      selectedPositive:1,otherCellsUnknown:true,independentReaderSourceCalls:0,deadlineFromRequestStartMs:a.deadlineFromRequestStartMs}))

    stage='strict R2-rehashed false fact reaches actual retained canonical extraction'
    await nativeSemanticReproof(t,runtime,http,witness,sql,trip);completed++

    stage='prepare rejects archive / claim and evidence mismatches before persistence'
    for(const mutate of [
      (m:Json)=>{(m.claim as Json).fact={kind:'requirement_effect',effect:'required',visaMode:'electronic_visa'}},
      (m:Json)=>{(m.archive as Json).plaintext='forbidden even in provisional stage'},
      (m:Json)=>{(m.metadata as Json).key='forbidden even in provisional stage'},
      (m:Json)=>{(m.evidence as Json).canonicalUrl='https://accepted-trip.example/different'},
    ]) {
      let reached=false
      http.faults.beforeRpc=async(name,payload)=>{if(name==='official_truth_trip_store_prepare_v1'&&payload.phase==='stage'){reached=true;mutate(payload.manifest as Json)}}
      const refused=await runtime.producer.publishAcceptedStore(signal());delete http.faults.beforeRpc
      assert(reached);assert.equal(refused.status,'unavailable');assert.equal(count('versions'),1);assert.equal(count('stages'),0)
      assert(http.evidence.slice(-3).some(e=>e.rpc==='official_truth_trip_store_prepare_v1'&&!e.committed))
    }
    completed++
    stage='committed successor with lost ACK and finite external witness reconciliation'
    state.successor=true;let dropped=false
    http.faults.afterCommit=async(name)=>{if(name==='official_truth_trip_store_finalize_v1'&&!dropped){dropped=true;return 'drop'}}
    assert.equal((await runtime.producer.publishAcceptedStore(signal())).status,'unavailable');delete http.faults.afterCommit
    assert(dropped);assert.equal(count('versions'),2);assert.equal(count('operations'),2);assert.equal(count('reservations'),0)
    assert.equal(witness.casCount(),1)
    const callsBeforeReconcile=state.sourceStarts
    assert.equal(await runtime.producer.reconcileAcceptedStore(signal()),'reconciled');assert.equal(witness.casCount(),2)
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

    stage='partial restore: latest head and external witness cannot bless old current projection'
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

    stage='actual retained Evidence, support, archive and custody row integrity'
    await retainedIntegrityProof(t,sql,http,witness,b.receiptFingerprint!,read);completed++

    stage='actual RLS identity and persisted context changes'
    runtime.rate.readinessRateLeeren()
    const foreign=await runtime.reader.readAcceptedStoreTrip(nativeIds.foreignTrip,trip.revision,signal())
    const missing=await runtime.reader.readAcceptedStoreTrip('33333333-3333-4333-8333-333333333335',trip.revision,signal())
    assert.equal(foreign.status,404);assert.deepEqual(foreign,missing)
    sql(`update public.trip_traveller_documents set expires_on='2031-12-31' where id=${quote(nativeIds.nationalId)}`)
    unknown(await read());trip=await declareNativeTrip(http,runtime);current(await read());completed++

    stage='genuine native blocked Finalize with fresh authority, expiry and Trip closure'
    trip=await nativeWaitProof(t,cluster,sql,runtime,http,trip);completed++

    stage='protected native internal lifecycle conflict and withdrawal'
    assert.equal((await runtime.producer.conflictAcceptedStore(signal())).status,'confirmed');unknown(await read())
    assert.equal((await runtime.producer.withdrawAcceptedStore(signal())).status,'confirmed');unknown(await read())
    assert.equal(count('versions'),2);assert.equal(count('operations'),4)
    assert.equal((await runtime.producer.publishAcceptedStore(signal())).status,'unavailable')
    assert.equal(count('versions'),2);completed++

    stage='SQL ACL and owned connection cleanup'
    assert.equal(sql(`select bool_and(not has_table_privilege(r.rolname,c.oid,'select,insert,update,delete'))
      from pg_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
      where r.rolname in ('anon','authenticated','service_role') and n.nspname='official_accepted_trip_private' and c.relkind='r'`),'t')
    assert.equal(sql(`select bool_and(not has_function_privilege(r.rolname,p.oid,'execute')) from pg_roles r cross join pg_proc p
      join pg_namespace n on n.oid=p.pronamespace where r.rolname in ('anon','authenticated','service_role') and n.nspname='official_accepted_trip_private'`),'t')
    assert.equal(sql(`select has_function_privilege('anon','public.official_truth_trip_store_reserve_v1(jsonb)','execute')`),'f')
    assert.equal(sql(`select has_function_privilege('service_role','public.official_truth_trip_store_finalize_v1(jsonb)','execute')`),'f')
    await http.settle();assert.equal(http.counts().connections,0)
    // Includes the unchanged native wire's separate COMMIT owner/control peers.
    assert.equal(sql(`select count(*) from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid()
      and backend_type='client backend' and state is distinct from 'idle'`),'0')
    const peers=()=>Number(sql(`select count(*) from pg_stat_activity where datname=current_database()
      and pid<>pg_backend_pid() and backend_type='client backend'`))
    const peerDeadline=performance.now()+2_000
    while(peers()!==0&&performance.now()<peerDeadline)await new Promise<void>(resolve=>setTimeout(resolve,10))
    assert.equal(peers(),0,'Every owned direct, COMMIT guard and control backend must actually disappear, including idle peers')
    assert(witness.keyCopies.every(k=>k.every(byte=>byte===0)))
    t.diagnostic(JSON.stringify({proof:'native-integrity-smoke',completedFamilies:completed,journalOperations:count('operations'),immutableVersions:count('versions'),
      sourceFetches:state.sourceStarts,rpcCommits:http.evidence.filter(e=>e.committed).length,rpcRefusals:http.evidence.filter(e=>!e.committed).length,
      witnessAdvances:witness.casCount(),activeSql:0,ownedClientBackends:0,keyCopiesWiped:true,projectionRestoreRejected:true,
      custodyEnvelopeDigest:createHash('sha256').update(sql('select envelope::text from official_accepted_trip_private.ciphertexts order by receipt')).digest('hex')}))
  } catch(error) {
    t.diagnostic(JSON.stringify({failedStage:stage,completedFamilies:completed,lastRpcOutcomes:http?.evidence.slice(-12)??[]}))
    throw error
  } finally {
    if(http)await http.close();if(witness)await witness.close()
    for(const key of envKeys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}
    cluster.stop()
  }
}
