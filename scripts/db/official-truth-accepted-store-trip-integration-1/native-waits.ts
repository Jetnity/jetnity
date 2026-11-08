/** Actual new-RPC lock waits followed by changed authority/Trip state. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { Trip } from '@/types/trips'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'
import { LocalPgConnection } from '../official-truth-integrated-pilot-1/pg-wire'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { nativeSession,type startNativeHttp } from './native-http'
import { quote,type nativeSql } from './native-schema'
import { declareNativeTrip,nativeIds } from './native-fixture'
import type { nativeProductRuntime } from './native-loader'

export async function nativeWaitProof(t:TestContext,cluster:LocalProofCluster,sql:ReturnType<typeof nativeSql>,
  runtime:ReturnType<typeof nativeProductRuntime>,http:Awaited<ReturnType<typeof startNativeHttp>>,initial:Trip):Promise<Trip>{
  let trip=initial
  const cases:string[]=[]
  async function observe(condition:()=>boolean,ms:number){
    const deadline=performance.now()+ms
    while(!condition()&&performance.now()<deadline)await new Promise<void>(resolve=>setTimeout(resolve,5))
    assert(condition(),'Required actual blocked native SQL checkpoint was not observed')
  }
  const read=(signal:AbortSignal)=>{runtime.rate.readinessRateLeeren();return runtime.reader.readAcceptedStoreTrip(trip.id,trip.revision,signal)}
  for(const mode of ['auth_revoked','auth_expired','child_change','child_aba'] as const){
    const held:{connection:LocalPgConnection|null}={connection:null}
    let entered=false,finished=false
    const owner=new AbortController(),from=http.evidence.length
    http.faults.beforeRpc=async(name)=>{
      if(name!=='official_truth_trip_store_finalize_v1'||entered)return
      entered=true;held.connection=await LocalPgConnection.connect(cluster)
      await held.connection.query('begin')
      await held.connection.query('lock table public.trip_traveller_documents in row exclusive mode')
    }
    const operation=read(owner.signal).finally(()=>{finished=true})
    try {
      await observe(()=>held.connection!==null||finished,15_000);assert(held.connection&&!finished)
      await observe(()=>Number(sql(`select count(*) from pg_stat_activity where pid<>pg_backend_pid()
        and wait_event_type='Lock' and query like 'select public.official_truth_trip_store_finalize_v1(%'`))===1,1_000)
      if(mode==='auth_revoked')sql(`update auth.sessions set aal='aal1' where id=${quote(nativeSession)}`)
      else if(mode==='auth_expired'){
        sql(`update auth.sessions set not_after=clock_timestamp()+interval '150 milliseconds' where id=${quote(nativeSession)}`)
        await observe(()=>sql(`select (not_after<=clock_timestamp())::text from auth.sessions where id=${quote(nativeSession)}`)==='true',600)
      } else {
        await held.connection.query(`update public.trip_traveller_documents set expires_on=expires_on+1 where id=${quote(nativeIds.nationalId)}`)
        if(mode==='child_aba')await held.connection.query(`update public.trip_traveller_documents set expires_on=expires_on-1 where id=${quote(nativeIds.nationalId)}`)
      }
      await held.connection.query('commit');held.connection.close();held.connection=null
      const response=await operation
      assert.equal(response.status,200);assert.notEqual((response.body as AcceptedStoreTripResult).status,'current')
      const final=http.evidence.slice(from).find(value=>value.rpc==='official_truth_trip_store_finalize_v1')
      assert(final&&!final.committed,`${mode}: must reach and refuse actual final native transaction`)
      assert.equal(final.sqlState,mode.startsWith('auth_')?'42501':'22023')
      cases.push(mode)
    } finally {
      owner.abort();delete http.faults.beforeRpc
      if(held.connection){await held.connection.query('rollback').catch(()=>[]);held.connection.close()}
      await operation;await http.settle()
      sql(`update auth.sessions set aal='aal2',not_after=clock_timestamp()+interval '1 hour' where id=${quote(nativeSession)}`)
    }
    if(mode.startsWith('child_'))trip=await declareNativeTrip(http,runtime)
    const control=await read(new AbortController().signal)
    assert.equal(control.status,200);assert.equal((control.body as AcceptedStoreTripResult).status,'current',`${mode}: positive control must independently reprove current data`)
  }
  t.diagnostic(JSON.stringify({proof:'native-after-wait-authority-and-trip',cases,actualBlockedFinalizeObserved:true,
    positiveControlAfterEach:true,boundary:'Value-plus-MVCC closure; no claim to detect every fully vanished child ABA. Engine values remain the exact reserved own Trip.'}))
  return trip
}
