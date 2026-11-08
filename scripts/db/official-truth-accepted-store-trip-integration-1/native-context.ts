/** Required real saved-Trip/context/credential integration refusals. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { PilotDeclaration } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/context'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'
import { startLocalProofCluster,assertLocalProofEnvironment } from '../official-truth-integrated-pilot-1/local-cluster'
import { nativeSql,installNativeSchema,quote } from './native-schema'
import { startNativeHttp,nativeTrip } from './native-http'
import { nativeProductRuntime,type NativeRuntimeState } from './native-loader'
import { seedNativeRows,seedNativeCatalog,nativeBinding,declareNativeTrip,nativeIds } from './native-fixture'
import { ACCEPTED_STORE_TRIP_CLOSURE_PROFILE } from '@/lib/readiness/official-truth-integrated-pilot-bundle'

export async function nativeContextProof(t:TestContext) {
  assert.equal(process.versions.node.split('.')[0],'22');assertLocalProofEnvironment()
  const cluster=startLocalProofCluster(),sql=nativeSql(cluster)
  let http:Awaited<ReturnType<typeof startNativeHttp>>|null=null,witness:Awaited<ReturnType<typeof nativeBinding>>|null=null
  const envKeys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'] as const
  const previous=Object.fromEntries(envKeys.map(key=>[key,process.env[key]])),proofs:string[]=[]
  let stage='schema'
  try {
    installNativeSchema(sql);seedNativeRows(sql);http=await startNativeHttp(cluster)
    process.env.NEXT_PUBLIC_SUPABASE_URL=http.url;process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=http.anonToken;process.env.SUPABASE_SERVICE_ROLE_KEY=http.serviceToken
    await seedNativeCatalog(http);witness=await nativeBinding(http.url,sql)
    const state:NativeRuntimeState={binding:witness.binding,cookie:http.cookie(),successor:false,sourceStarts:0,authCookieReads:0}
    const runtime=nativeProductRuntime(state);let trip=await declareNativeTrip(http,runtime)
    assert.equal((await runtime.producer.publishAcceptedStore(new AbortController().signal)).status,'confirmed')
    const sourceStarts=state.sourceStarts
    const read=(revision=trip.revision)=>{runtime.rate.readinessRateLeeren();return runtime.reader.readAcceptedStoreTrip(trip.id,revision,new AbortController().signal)}
    const current=async()=>{const response=await read();assert.equal(response.status,200);assert.equal((response.body as AcceptedStoreTripResult).status,'current')}
    await current()
    stage='actual six-RPC role separation and caller authority refusal'
    for(const [name,token] of [
      ['prepare',http.accessToken],['snapshot',http.accessToken],['confirm',http.accessToken],['cleanup',http.accessToken],
      ['reserve',http.serviceToken],['finalize',http.serviceToken],
    ]) {
      const index:number=http.evidence.length,rpc=`official_truth_trip_store_${name}_v1`
      const response:Response=await fetch(`${http.url}/rest/v1/rpc/${rpc}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'content-type':'application/json'},
        body:JSON.stringify({payload:{}}),signal:AbortSignal.timeout(10_000)})
      assert.equal(response.status,400);assert.equal((await response.json() as {code:string}).code,'42501')
      assert.deepEqual(http.evidence[index],{rpc,committed:false,sqlState:'42501'})
    }
    const forged=await fetch(`${http.url}/rest/v1/rpc/official_truth_trip_store_reserve_v1`,{method:'POST',
      headers:{Authorization:`Bearer ${http.accessToken}`,'content-type':'application/json'},signal:AbortSignal.timeout(10_000),
      body:JSON.stringify({payload:{cell:witness.binding.contract.id,contractDigest:witness.binding.contract.digest,
        profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,purpose:'read',tripId:trip.id,revision:trip.revision,authorized:true,actor:'owner'}})})
    assert.equal(forged.status,400);assert.equal((await forged.json() as {code:string}).code,'22023')
    assert.equal(sql('select count(*) from official_accepted_trip_private.reservations'),'0');await current();proofs.push(stage)
    stage='wrong expected revision before any Reserve'
    let from=http.evidence.length
    assert.equal((await read(trip.revision+1)).status,409);assert.equal(http.evidence.length,from);proofs.push(stage)
    const cases:Array<{name:string;declaration:Partial<PilotDeclaration>}>= [
      {name:'explicit other traveller and passport',declaration:{travellerClientRef:'synthetic-other',documentClientRef:'synthetic-other-passport',
        citizenshipClientRef:'synthetic-other-citizenship',credentialOptionRef:'synthetic-other:synthetic-other-passport'}},
      {name:'explicit national ID instead of selected ordinary passport',declaration:{documentClientRef:'synthetic-national-id',credentialOptionRef:'synthetic-traveller:synthetic-national-id'}},
      {name:'unknown passport class',declaration:{passportClass:'unknown'}},
      {name:'unsupported purpose',declaration:{purpose:'other'}},
      {name:'incomplete route',declaration:{route:'unknown'}},
      {name:'unsupported origin',declaration:{originCountryCode:'other'}},
    ]
    for(const candidate of cases) {
      stage=candidate.name;trip=await declareNativeTrip(http,runtime,candidate.declaration);from=http.evidence.length
      const response=await read();assert.equal(response.status,200);assert.equal((response.body as AcceptedStoreTripResult).status,'unsupported_context')
      assert.equal(http.evidence.length,from,'Unsupported actual context must stop before Reserve/cleanup/reader SQL')
      trip=await declareNativeTrip(http,runtime);await current();proofs.push(stage)
    }
    stage='foreign citizenship reference cannot be saved as the own selected document'
    await assert.rejects(declareNativeTrip(http,runtime,{citizenshipClientRef:'synthetic-other-citizenship'}))
    trip=await declareNativeTrip(http,runtime);await current();proofs.push(stage)
    for(const [field,changed,original] of [['start_date','2026-11-21','2026-11-20'],['end_date','2026-11-26','2026-11-25']] as const) {
      stage=`actual ${field} outside compiled application slot`
      try {
        sql(`update public.trips set ${field}=${quote(changed)} where id=${quote(nativeTrip)}`)
        trip=await declareNativeTrip(http,runtime);from=http.evidence.length
        const response=await read();assert.equal(response.status,200);assert.equal((response.body as AcceptedStoreTripResult).status,'unsupported_context')
        assert.equal(http.evidence.length,from)
      } finally {sql(`update public.trips set ${field}=${quote(original)} where id=${quote(nativeTrip)}`)}
      trip=await declareNativeTrip(http,runtime);await current();proofs.push(stage)
    }
    stage='extra credential after attestation invalidates saved context'
    try {
      sql(`insert into public.trip_traveller_documents(traveller_id,trip_id,user_id,client_ref,document_type,issuing_country_code,citizenship_id,expires_on)
        select traveller_id,trip_id,user_id,'synthetic-third-option','passport',issuing_country_code,citizenship_id,expires_on
        from public.trip_traveller_documents where id=${quote(nativeIds.passport)}`)
      const loaded=await runtime.trips.reiseLaden(nativeTrip);assert.equal(loaded.problem,null);assert(loaded.zeilen[0]);trip=loaded.zeilen[0]
      from=http.evidence.length;const response=await read();assert.equal(response.status,200);assert.equal((response.body as AcceptedStoreTripResult).status,'unsupported_context')
      assert.equal(http.evidence.length,from)
    } finally {sql(`delete from public.trip_traveller_documents where trip_id=${quote(nativeTrip)} and client_ref='synthetic-third-option'`)}
    trip=await declareNativeTrip(http,runtime);await current();proofs.push(stage)
    assert.equal(state.sourceStarts,sourceStarts);assert.equal(sql('select count(*) from official_accepted_trip_private.versions'),'1')
    await http.settle()
    const peers=()=>Number(sql(`select count(*) from pg_stat_activity where pid<>pg_backend_pid() and datname=current_database() and backend_type='client backend'`))
    const deadline=performance.now()+2_000
    while(peers()&&performance.now()<deadline)await new Promise<void>(resolve=>setTimeout(resolve,5))
    assert.equal(peers(),0);assert(witness.keyCopies.every(key=>key.every(byte=>byte===0)))
    t.diagnostic(JSON.stringify({proof:'actual-saved-Trip-context-negatives',proofs,sourceFetchesDuringReads:0,
      targetContextStatusProved:true,positiveControlsAfterEach:true,originalMultiPersonMultiOptionPositive:true,ownedClientBackends:0}))
  } catch(error){t.diagnostic(JSON.stringify({failedContextStage:stage,proofs,lastRpcOutcomes:http?.evidence.slice(-8)}));throw error}
  finally {
    if(http)await http.close();if(witness)await witness.close()
    for(const key of envKeys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}
    cluster.stop()
  }
}
