/** Actual new-RPC lock waits followed by changed authority/Trip state. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { Trip } from '@/types/trips'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'
import { LocalPgConnection,pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { nativeSession,type startNativeHttp } from './native-http'
import { quote,type nativeSql } from './native-schema'
import { declareNativeTrip,nativeIds } from './native-fixture'
import type { nativeProductRuntime } from './native-loader'

export async function nativeWaitProof(t:TestContext,cluster:LocalProofCluster,sql:ReturnType<typeof nativeSql>,
  runtime:ReturnType<typeof nativeProductRuntime>,http:Awaited<ReturnType<typeof startNativeHttp>>,initial:Trip):Promise<Trip>{
  let trip=initial
  const cases:string[]=[]
  async function observe(condition:()=>boolean|Promise<boolean>,ms:number){
    const deadline=performance.now()+ms
    while(performance.now()<deadline){
      if(await condition()){assert(performance.now()<=deadline,'Actual native checkpoint exceeded its unchanged observation bound');return}
      await new Promise<void>(resolve=>setTimeout(resolve,5))
    }
    assert.fail('Required actual blocked native SQL checkpoint was not observed')
  }
  const read=(signal:AbortSignal)=>{runtime.rate.readinessRateLeeren();return runtime.reader.readAcceptedStoreTrip(trip.id,trip.revision,signal)}
  for(const mode of ['auth_revoked','auth_expired','child_change','child_aba'] as const){
    const held:{connection:LocalPgConnection|null;ready:boolean;pid:number;waiterPid:number|null}={connection:null,ready:false,pid:0,waiterPid:null}
    let entered=false,finished=false,observer:LocalPgConnection|null=null
    const owner=new AbortController(),from=http.evidence.length
    http.faults.beforeRpc=async(name)=>{
      if(name!=='official_truth_trip_store_finalize_v1'||entered)return
      entered=true;held.connection=await LocalPgConnection.connect(cluster)
      await held.connection.query('begin')
      await held.connection.query('lock table private.official_sources in row exclusive mode')
      held.pid=Number((await held.connection.query('select pg_backend_pid()::text as pid'))[0]!.pid)
      assert(Number.isInteger(held.pid)&&held.pid>0);held.ready=true
    }
    http.faults.afterRpcDispatch=(name,_payload,pid)=>{if(name==='official_truth_trip_store_finalize_v1')held.waiterPid=pid}
    const operation=read(owner.signal).finally(()=>{finished=true})
    try {
      observer=await LocalPgConnection.connect(cluster)
      await observer.query("set statement_timeout='1s'")
      await observe(()=>held.ready&&held.waiterPid!==null||finished,15_000)
      assert(held.connection&&held.ready&&held.waiterPid!==null&&!finished)
      // An owned async connection lets the real HTTP/native wire advance. The
      // previous synchronous psql poll could begin before holder lock acquisition and
      // could block that same Node event loop during setup/closure traversal.
      // This is the existing first catalog lock, before full journal reproof;
      // no product lock, authority check or time budget is changed.
      await observe(async()=>{
        const rows=await observer!.query(`select a.pid::text as waiter_pid,h.pid::text as holder_pid,
          l.relation::regclass::text as relation,l.mode as waiting_mode,h.mode as holding_mode
          from pg_stat_activity a join pg_locks l on l.pid=a.pid
          join pg_locks h on h.relation=l.relation and h.pid=$2::integer and h.granted
          where a.pid=$1::integer and a.wait_event_type='Lock'
          and a.query like 'select public.official_truth_trip_store_finalize_v1(%'
          and l.locktype='relation' and not l.granted and l.mode='ShareLock'
          and l.relation='private.official_sources'::regclass and h.mode='RowExclusiveLock'
          and $2::integer=any(pg_blocking_pids(a.pid))`,[pgText(String(held.waiterPid),23),pgText(String(held.pid),23)])
        return rows.length===1&&rows[0]!.waiter_pid===String(held.waiterPid)&&rows[0]!.holder_pid===String(held.pid)
          &&rows[0]!.relation==='private.official_sources'
      },1_000)
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
      owner.abort();delete http.faults.beforeRpc;delete http.faults.afterRpcDispatch
      if(held.connection){await held.connection.query('rollback').catch(()=>[]);held.connection.close()}
      await operation;await http.settle()
      observer?.close()
      sql(`update auth.sessions set aal='aal2',not_after=clock_timestamp()+interval '1 hour' where id=${quote(nativeSession)}`)
    }
    if(mode.startsWith('child_'))trip=await declareNativeTrip(http,runtime)
    const control=await read(new AbortController().signal)
    assert.equal(control.status,200);assert.equal((control.body as AcceptedStoreTripResult).status,'current',`${mode}: positive control must independently reprove current data`)
  }
  t.diagnostic(JSON.stringify({proof:'native-after-wait-authority-and-trip',cases,actualBlockedFinalizeObserved:true,
    holderReadyBeforeDispatch:true,actualWaiterAndBlockerMatched:true,blockedRelation:'private.official_sources',observationBoundMs:1_000,
    positiveControlAfterEach:true,boundary:'Value-plus-MVCC closure; no claim to detect every fully vanished child ABA. Engine values remain the exact reserved own Trip.'}))
  return trip
}
