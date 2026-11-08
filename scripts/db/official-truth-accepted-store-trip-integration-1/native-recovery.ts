/** Required real-transaction abandonment, disposal, expiry and recovery proof. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { startLocalProofCluster,assertLocalProofEnvironment } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection } from '../official-truth-integrated-pilot-1/pg-wire'
import { nativeSql,installNativeSchema } from './native-schema'
import { startNativeHttp } from './native-http'
import { nativeProductRuntime,type NativeRuntimeState } from './native-loader'
import { seedNativeRows,seedNativeCatalog,nativeBinding,declareNativeTrip } from './native-fixture'
import { ACCEPTED_STORE_TRIP_CLOSURE_PROFILE } from '@/lib/readiness/official-truth-integrated-pilot-bundle'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'

export async function nativeRecoveryProof(t:TestContext){
  assert.equal(process.versions.node.split('.')[0],'22');assertLocalProofEnvironment()
  const cluster=startLocalProofCluster(),sql=nativeSql(cluster)
  let http:Awaited<ReturnType<typeof startNativeHttp>>|null=null,witness:Awaited<ReturnType<typeof nativeBinding>>|null=null
  const held:{connection:LocalPgConnection|null}={connection:null}
  const envKeys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'] as const
  const previous=Object.fromEntries(envKeys.map(key=>[key,process.env[key]])),proofs:string[]=[]
  let stage='schema'
  const count=(table:string)=>Number(sql(`select count(*) from official_accepted_trip_private.${table}`))
  async function observe(condition:()=>boolean,ms:number){
    const deadline=performance.now()+ms
    while(!condition()&&performance.now()<deadline)await new Promise<void>(resolve=>setTimeout(resolve,5))
    assert(condition(),'Actual native wait boundary missing')
  }
  try {
    installNativeSchema(sql);seedNativeRows(sql);http=await startNativeHttp(cluster)
    process.env.NEXT_PUBLIC_SUPABASE_URL=http.url;process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=http.anonToken;process.env.SUPABASE_SERVICE_ROLE_KEY=http.serviceToken
    await seedNativeCatalog(http);witness=await nativeBinding(http.url,sql)
    const state:NativeRuntimeState={binding:witness.binding,cookie:http.cookie(),successor:false,sourceStarts:0,authCookieReads:0}
    const runtime=nativeProductRuntime(state),trip=await declareNativeTrip(http,runtime),signal=()=>new AbortController().signal
    const read=(owner=signal())=>{runtime.rate.readinessRateLeeren();return runtime.reader.readAcceptedStoreTrip(trip.id,trip.revision,owner)}
    const isCurrent=(response:{status:number;body:unknown})=>{assert.equal(response.status,200);assert.equal((response.body as AcceptedStoreTripResult).status,'current')}
    const unavailable=(response:{status:number;body:unknown})=>{assert.equal(response.status,200);assert.notEqual((response.body as AcceptedStoreTripResult).status,'current')}
    const accepted=await runtime.producer.publishAcceptedStore(signal());assert.equal(accepted.status,'confirmed');isCurrent(await read())
    const sourceStarts=state.sourceStarts,reserve={cell:witness.binding.contract.id,contractDigest:witness.binding.contract.digest,
      profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,purpose:'read',tripId:trip.id,revision:trip.revision}

    stage='genuine finalized read response arrives after original validation window'
    let lateCommitted=false
    const lateFrom=http.evidence.length
    http.faults.afterCommit=async(name)=>{if(name==='official_truth_trip_store_finalize_v1'){
      lateCommitted=true;await new Promise<void>(resolve=>setTimeout(resolve,16_000))
    }}
    try{unavailable(await read())}finally{delete http.faults.afterCommit;await http.settle()}
    assert(lateCommitted);assert(http.evidence.slice(lateFrom).some(value=>value.rpc==='official_truth_trip_store_finalize_v1'&&value.committed))
    assert(!http.evidence.slice(lateFrom).some(value=>value.rpc==='official_truth_trip_store_confirm_v1'))
    assert.equal(count('reservations'),0);assert.equal(state.sourceStarts,sourceStarts);isCurrent(await read());proofs.push(stage)

    stage='R4 acquired token disposal loses ACK but performs one actual bounded cleanup'
    const owner=new AbortController(),life=new runtime.lifetime.AcceptedStoreLifetime(owner.signal,20_000)
    const database=new runtime.database.AcceptedStoreDatabase(life,witness.binding)
    const reservation=await database.reserve(reserve) as {token:string}
    await database.snapshot({token:reservation.token})
    const beforeAuth=http.counts().authRequests,beforeRequests=http.requests.length
    let removed:number|null=null
    http.faults.afterCommit=async(name,_payload,result)=>{if(name==='official_truth_trip_store_cleanup_v1'){removed=(result as {removed:number}).removed;return 'drop'}}
    try {
      owner.abort();assert.deepEqual(await database.dispose(),{status:'unknown'})
      assert.deepEqual(await database.dispose(),{status:'not_started'})
    } finally {delete http.faults.afterCommit;await life.settle();await http.settle()}
    assert.equal(removed,1);assert.equal(http.counts().authRequests,beforeAuth)
    assert.deepEqual(http.requests.slice(beforeRequests).map(value=>value.path),['/rest/v1/rpc/official_truth_trip_store_cleanup_v1'])
    assert.equal(count('reservations'),0);assert.equal(count('stages'),0);assert.equal(count('versions'),1);isCurrent(await read());proofs.push(stage)

    stage='expired unacknowledged read reservations recover through explicit reader alone'
    let lost=0
    http.faults.afterCommit=async(name)=>{if(name==='official_truth_trip_store_reserve_v1'){lost++;return 'drop'}}
    const quotaFrom=http.evidence.length
    try {
      // The actual reader first proves the unknown-token failure boundary.
      unavailable(await read());assert.equal(count('reservations'),1)
      // Real signed authenticated POST RPCs then model processes that disappear
      // before learning a token. These are not inserted/copied reservation rows.
      for(let i=1;i<32;i++)await assert.rejects(fetch(`${http.url}/rest/v1/rpc/official_truth_trip_store_reserve_v1`,{
        method:'POST',headers:{apikey:http.anonToken,Authorization:`Bearer ${http.accessToken}`,'content-type':'application/json'},
        body:JSON.stringify({payload:reserve}),signal:AbortSignal.timeout(10_000),redirect:'error'}))
    } finally {delete http.faults.afterCommit;await http.settle()}
    assert.equal(lost,32);assert.equal(count('reservations'),32)
    assert.equal(http.evidence.slice(quotaFrom).filter(value=>value.rpc==='official_truth_trip_store_reserve_v1'&&value.committed).length,32)
    assert.equal(sql(`select count(*) from official_accepted_trip_private.reservations
      where purpose='read' and state='reserved' and created_at<expires_at and expires_at<=original_expiry
      and expires_at<=created_at+interval '45 seconds'
      and expires_at=least(created_at+interval '45 seconds',original_expiry)`),'32',
    'Every actual committed reservation keeps the same creation anchor and earliest original expiry')
    const exhausted=await fetch(`${http.url}/rest/v1/rpc/official_truth_trip_store_reserve_v1`,{
      method:'POST',headers:{apikey:http.anonToken,Authorization:`Bearer ${http.accessToken}`,'content-type':'application/json'},
      body:JSON.stringify({payload:reserve}),signal:AbortSignal.timeout(10_000),redirect:'error'})
    assert.equal(exhausted.status,400);assert.equal((await exhausted.json() as {code:string}).code,'22023')
    const remaining=Number(sql(`select greatest(0,ceil(extract(epoch from max(expires_at)-clock_timestamp())*1000)) from official_accepted_trip_private.reservations`))
    assert(remaining>=0&&remaining<=45_000)
    t.diagnostic(JSON.stringify({proof:'native-orphan-expiry-checkpoint',genuineUnacknowledgedReserves:32,storedReservationBoundsChecked:32,quotaActuallyRefused:true,waitMs:remaining}))
    await new Promise<void>(resolve=>setTimeout(resolve,remaining+25))
    assert.equal(sql(`select count(*) from official_accepted_trip_private.reservations where expires_at<=clock_timestamp()`),'32')
    let swept=0
    http.faults.afterCommit=async(name,payload,result)=>{if(name==='official_truth_trip_store_cleanup_v1'&&payload.token===null)swept=(result as {removed:number}).removed}
    try{isCurrent(await read())}finally{delete http.faults.afterCommit;await http.settle()}
    assert.equal(swept,32);assert.equal(count('reservations'),0);assert.equal(count('versions'),1);assert.equal(count('operations'),1)
    assert.equal(count('originals'),1);assert.equal(state.sourceStarts,sourceStarts);proofs.push(stage)

    stage='R4 cleanup races actual pending authenticated Finalize and preserves committed history'
    const raceOwner=new AbortController();state.successor=true
    let entered=false,finished=false
    const raceFrom=http.evidence.length,beforeWitness=witness.casCount()
    http.faults.beforeRpc=async(name)=>{if(name==='official_truth_trip_store_finalize_v1'&&!entered){
      entered=true;held.connection=await LocalPgConnection.connect(cluster);await held.connection.query('begin')
      await held.connection.query('select pg_advisory_xact_lock(1869901924,2)')
    }}
    const publication=runtime.producer.publishAcceptedStore(raceOwner.signal).finally(()=>{finished=true})
    try {
      await observe(()=>held.connection!==null||finished,15_000);assert(held.connection&&!finished)
      await observe(()=>Number(sql(`select count(*) from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock'
        and query like 'select public.official_truth_trip_store_finalize_v1(%'`))===1,1_000)
      raceOwner.abort()
      await observe(()=>Number(sql(`select count(*) from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock'
        and query like 'select public.official_truth_trip_store_cleanup_v1(%'`))===1,700)
      await held.connection.query('commit');held.connection.close();held.connection=null
      assert.equal((await publication).status,'unavailable')
    } finally {
      raceOwner.abort();delete http.faults.beforeRpc
      if(held.connection){await held.connection.query('rollback').catch(()=>[]);held.connection.close();held.connection=null}
      await publication;await http.settle()
    }
    const final=http.evidence.slice(raceFrom).find(value=>value.rpc==='official_truth_trip_store_finalize_v1')
    assert(final);assert(http.evidence.slice(raceFrom).some(value=>value.rpc==='official_truth_trip_store_cleanup_v1'&&value.committed))
    assert.equal(count('reservations'),0);assert.equal(count('stages'),0);assert.equal(witness.casCount(),beforeWitness)
    if(final.committed){
      assert.equal(count('versions'),2);assert.equal(count('operations'),2)
      const sources=state.sourceStarts;assert.equal(await runtime.producer.reconcileAcceptedStore(signal()),'reconciled')
      assert.equal(state.sourceStarts,sources);assert.equal(witness.casCount(),beforeWitness+1)
    }else {assert.equal(count('versions'),1);assert.equal(count('operations'),1)}
    isCurrent(await read());proofs.push(stage)
    await http.settle()
    const peers=()=>Number(sql(`select count(*) from pg_stat_activity where pid<>pg_backend_pid() and datname=current_database() and backend_type='client backend'`))
    await observe(()=>peers()===0,2_000)
    assert(witness.keyCopies.every(key=>key.every(byte=>byte===0)))
    t.diagnostic(JSON.stringify({proof:'native-disposal-and-recovery',proofs,lateReadNoPositive:true,unknownDisposalAckHonest:true,
      expiredOrphansSwept:32,readerRecoverySourceFetches:0,finalizeRaceCommitted:final.committed,
      immutableVersions:count('versions'),durableOperations:count('operations'),ownedClientBackends:0}))
  } catch(error){t.diagnostic(JSON.stringify({failedRecoveryStage:stage,proofs,lastRpcOutcomes:http?.evidence.slice(-10)}));throw error}
  finally {
    if(held.connection){await held.connection.query('rollback').catch(()=>[]);held.connection.close()}
    if(http)await http.close();if(witness)await witness.close()
    for(const key of envKeys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}
    cluster.stop()
  }
}
