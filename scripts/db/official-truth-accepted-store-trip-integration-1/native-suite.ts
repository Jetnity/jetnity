/** R10: independently owned native suites. This is test infrastructure only;
 * actual product, Auth, SQL, key and witness implementations remain in use. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { startLocalProofCluster,assertLocalProofEnvironment } from '../official-truth-integrated-pilot-1/local-cluster'
import { nativeSql,installNativeSchema } from './native-schema'
import { nativeProductRuntime,type NativeRuntimeState } from './native-loader'
import { startNativeHttp,nativeTrip } from './native-http'
import { seedNativeRows,seedNativeCatalog,nativeBinding,declareNativeTrip } from './native-fixture'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'

const SUITE_MS=240_000
export class NativeSuiteOwnership extends OwnedTestLifetime {
  private readonly abort:AbortController
  private readonly timer:ReturnType<typeof setTimeout>
  readonly startedAt=performance.now()
  readonly deadline=this.startedAt+SUITE_MS
  readonly failures:unknown[]=[]
  private phaseName='setup'
  private completed=0
  constructor(readonly test:TestContext,readonly suite:string) {
    const abort=new AbortController()
    super(AbortSignal.any([test.signal,abort.signal]))
    this.abort=abort
    this.timer=setTimeout(()=>this.stop(Error('native_suite_parent_deadline')),SUITE_MS)
    this.timer.unref()
  }
  override check():void {
    // This also runs inside the unchanged lifetime's owned native connect /
    // query / COMMIT wrappers. Synchronous psql cannot postpone the next gate.
    if(performance.now()>=this.deadline&&!this.abort.signal.aborted)this.stop(Error('native_suite_parent_deadline'))
    super.check()
  }
  stop(error?:unknown):void {
    if(error!==undefined&&!this.failures.includes(error))this.failures.push(error)
    if(!this.abort.signal.aborted)this.abort.abort(error??Error('native_suite_stopped'))
  }
  cleanupTask(operation:()=>Promise<unknown>):Promise<unknown> {
    // The unchanged lifetime handles/tracks rejections but intentionally does
    // not make every rejected work item a cleanup failure. A resource closer
    // is different: retain its actual rejection for the final suite outcome.
    return this.track(Promise.resolve().then(operation).catch(error=>{
      if(!this.failures.includes(error))this.failures.push(error)
      throw error
    }))
  }
  controller():AbortController {
    this.check()
    const controller=new AbortController(),remove=this.onStop(()=>controller.abort(this.signal.reason))
    controller.signal.addEventListener('abort',remove,{once:true})
    return controller
  }
  async phase<T>(name:string,operation:()=>Promise<T>):Promise<T> {
    this.check();this.phaseName=name
    this.test.diagnostic(JSON.stringify({proof:'native-suite-phase',suite:this.suite,phase:name,event:'start',elapsedMs:Math.round(performance.now()-this.startedAt)}))
    try {
      const value=await this.run(operation);this.check();this.completed++
      this.test.diagnostic(JSON.stringify({proof:'native-suite-phase',suite:this.suite,phase:name,event:'complete',elapsedMs:Math.round(performance.now()-this.startedAt)}))
      return value
    } catch(error){this.stop(error);throw error}
  }
  /** A created resource is registered before a post-await check may reject. */
  async acquire<T>(operation:()=>Promise<T>,register:(value:T)=>void):Promise<T> {
    this.check()
    return this.track((async()=>{const value=await operation();register(value);this.check();return value})().catch(error=>{
      // Setup can itself fail while cleaning a partially acquired resource.
      // Keep that actual failure before an outer parent check can replace it.
      if(!this.failures.includes(error))this.failures.push(error)
      throw error
    }))
  }
  /** Cleanup keeps every started operation owned and retains all errors. */
  async cleanup(...operations:Array<()=>void|Promise<unknown>>):Promise<void> {
    const errors:unknown[]=[]
    for(const operation of operations) {
      try {
        const pending=this.track(Promise.resolve().then(operation))
        const [result]=await this.drain([pending])
        if(result?.status==='rejected')errors.push(result.reason)
      } catch(error){errors.push(error)}
    }
    for(const error of errors)if(!this.failures.includes(error))this.failures.push(error)
    if(errors.length)throw new AggregateError(errors,'native_suite_scenario_cleanup_failed')
  }
  progress(){return {suite:this.suite,phase:this.phaseName,completedPhases:this.completed,elapsedMs:Math.round(performance.now()-this.startedAt)}}
  async finish(){try{return await super.dispose()}finally{clearTimeout(this.timer)}}
}

export function nativeCurrent(response:{status:number;body:unknown}):AcceptedStoreTripResult {
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
export function nativeUnknown(response:{status:number;body:unknown}) {
  if(response.status===200){const value=response.body as AcceptedStoreTripResult;assert.notEqual(value.status,'current');assert(value.evaluations.every(e=>e.result==='unknown'))}
  else assert([400,401,403,404,409,429,503].includes(response.status))
}

type Cluster=ReturnType<typeof startLocalProofCluster>
type Sql=ReturnType<typeof nativeSql>
type Http=Awaited<ReturnType<typeof startNativeHttp>>
type Witness=Awaited<ReturnType<typeof nativeBinding>>
type Runtime=ReturnType<typeof nativeProductRuntime>
export type NativeSuite={owner:NativeSuiteOwnership;cluster:Cluster;sql:Sql;http:Http;witness:Witness;state:NativeRuntimeState;runtime:Runtime;
  trip:Awaited<ReturnType<typeof declareNativeTrip>>;count:(table:string)=>number;
  request:(body:string,headers?:Record<string,string>)=>Request;
  read:()=>ReturnType<Runtime['request']['acceptedStoreTripRequest']>;
  publication:()=>Promise<Extract<Awaited<ReturnType<Runtime['producer']['publishAcceptedStore']>>,{status:'confirmed'}>>}

export async function runNativeSuite(t:TestContext,name:string,work:(suite:NativeSuite)=>Promise<void>):Promise<void> {
  const owner=new NativeSuiteOwnership(t,name),errors:unknown[]=[]
  const envKeys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'] as const
  const previous=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]))
  const resources:{http:Http|null;witness:Witness|null;summary:Record<string,unknown>|null}={http:null,witness:null,summary:null}
  let teardown:Awaited<ReturnType<NativeSuiteOwnership['finish']>>|null=null
  try {
    assert.equal(process.versions.node.split('.')[0],'22','Required exact CI Node22 runtime; not a skip or local Node24 PASS')
    owner.check();assertLocalProofEnvironment();owner.check()
    owner.installConnectOwnership()
    const cluster=owner.startCluster(startLocalProofCluster),rawSql=nativeSql(cluster)
    const sql:Sql=(...args)=>{owner.check();const value=rawSql(...args);owner.check();return value}
    await owner.phase('fresh owned schema/catalog/Auth/witness/Trip setup',async()=>{
      installNativeSchema(sql);owner.check();seedNativeRows(sql)
      resources.http=await owner.acquire(()=>startNativeHttp(cluster,owner),value=>{
        resources.http=value
        owner.onStop(()=>{try{value.stop()}finally{owner.cleanupTask(()=>value.close())}})
      })
      owner.check()
      process.env.NEXT_PUBLIC_SUPABASE_URL=resources.http.url;process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=resources.http.anonToken;process.env.SUPABASE_SERVICE_ROLE_KEY=resources.http.serviceToken
      await owner.run(()=>seedNativeCatalog(resources.http!,owner))
      resources.witness=await owner.acquire(()=>nativeBinding(resources.http!.url,sql,300,owner),value=>{
        resources.witness=value
        owner.onStop(()=>{try{value.setLive(false)}finally{owner.cleanupTask(()=>value.close())}})
      })
    })
    assert(resources.http&&resources.witness)
    const protocol=resources.http,custody=resources.witness
    owner.check()
    const state:NativeRuntimeState={binding:custody.binding,cookie:protocol.cookie(),successor:false,sourceStarts:0,authCookieReads:0}
    const runtime=nativeProductRuntime(state)
    const trip=await owner.run(()=>declareNativeTrip(protocol,runtime,{},owner))
    assert.equal(trip.party?.length,2);assert.equal(trip.ohneTag.length,1)
    assert(runtime.tripBinding.selectedTripBinding(trip,custody.binding.contract))
    const count=(table:string)=>Number(sql(`select count(*) from official_accepted_trip_private.${table}`))
    const suite:NativeSuite={owner,cluster,sql,http:protocol,witness:custody,state,runtime,trip,count,
      request:(body,headers={})=>{owner.check();return new Request(`${protocol.url}/api/readiness/accepted-store`,{
        method:'POST',headers:{origin:protocol.url,'content-type':'application/json','sec-fetch-site':'same-origin',...headers},body,signal:owner.signal})},
      read:()=>owner.run(()=>{runtime.rate.readinessRateLeeren();return runtime.request.acceptedStoreTripRequest(suite.request(JSON.stringify({tripId:nativeTrip,revision:suite.trip.revision})))}),
      publication:()=>owner.run(async()=>{
        const output=await runtime.producer.publishAcceptedStore(owner.signal)
        assert.equal(output.status,'confirmed',JSON.stringify({...owner.progress(),rpcs:protocol.evidence.slice(-10)}))
        assert(output.status==='confirmed');return output
      }),
    }
    await work(suite)
    await owner.phase('healthy ACL / provisional rows / HTTP / backend / product-key closure',async()=>{
      assert.equal(sql(`select bool_and(not has_table_privilege(r.rolname,c.oid,'select,insert,update,delete'))
        from pg_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
        where r.rolname in ('anon','authenticated','service_role') and n.nspname='official_accepted_trip_private' and c.relkind='r'`),'t')
      assert.equal(sql(`select bool_and(not has_function_privilege(r.rolname,p.oid,'execute')) from pg_roles r cross join pg_proc p
        join pg_namespace n on n.oid=p.pronamespace where r.rolname in ('anon','authenticated','service_role') and n.nspname='official_accepted_trip_private'`),'t')
      assert.equal(sql(`select has_function_privilege('anon','public.official_truth_trip_store_reserve_v1(jsonb)','execute')`),'f')
      assert.equal(sql(`select has_function_privilege('service_role','public.official_truth_trip_store_finalize_v1(jsonb)','execute')`),'f')
      assert.equal(count('reservations'),0);assert.equal(count('stages'),0)
      await owner.run(()=>protocol.settle());assert.equal(protocol.counts().active,0);assert.equal(protocol.counts().connections,0)
      assert.equal(sql(`select count(*) from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid()
        and backend_type='client backend' and state is distinct from 'idle'`),'0')
      const peers=()=>Number(sql(`select count(*) from pg_stat_activity where datname=current_database()
        and pid<>pg_backend_pid() and backend_type='client backend'`))
      const peerDeadline=performance.now()+2_000
      while(peers()!==0&&performance.now()<peerDeadline){owner.check();await owner.wait(10)}
      assert.equal(peers(),0,'Every owned direct, COMMIT guard and control backend must actually disappear, including idle peers')
      assert(custody.keyCopies.every(k=>k.every(byte=>byte===0)),'Product key copies must already be wiped before witness.close')
      resources.summary={...owner.progress(),journalOperations:count('operations'),immutableVersions:count('versions'),sourceFetches:state.sourceStarts,
        rpcCommits:protocol.evidence.filter(e=>e.committed).length,rpcRefusals:protocol.evidence.filter(e=>!e.committed).length,
        witnessAdvances:custody.casCount(),activeSql:0,ownedClientBackends:0,provisionalReservations:0,provisionalStages:0,keyCopiesWipedBeforeWitnessClose:true}
    })
  } catch(error){errors.push(error);owner.stop(error);t.diagnostic(JSON.stringify({proof:'native-suite-failed',...owner.progress(),lastRpcOutcomes:resources.http?.evidence.slice(-12)??[]}))}
  finally {
    // Stop releases registered gates/controllers and HTTP acceptance, then the
    // unchanged owner closes actual SQL/cluster transports before its 35s drain.
    try{teardown=await owner.finish()}catch(error){errors.push(error)}
    for(const key of envKeys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}
  }
  for(const error of owner.failures)if(!errors.includes(error))errors.push(error)
  if(errors.length)throw new AggregateError(errors,`native_suite_failed:${name}`)
  assert(resources.summary&&teardown)
  const summary=resources.summary
  assert.equal(teardown.pending,0);assert.equal(teardown.started,teardown.settled)
  assert.equal(teardown.connections,teardown.closed);assert.equal(teardown.stoppedClusters,1)
  assert.equal(t.signal.aborted,false);assert(performance.now()<owner.deadline,'Complete healthy suite teardown must fit its unchanged 240s parent')
  t.diagnostic(JSON.stringify({proof:'native-suite-complete',...summary,elapsedMs:Math.round(performance.now()-owner.startedAt),
    ownedStarted:teardown.started,ownedSettled:teardown.settled,ownedPending:teardown.pending,ownedConnections:teardown.connections,
    ownedClosed:teardown.closed,stoppedClusters:teardown.stoppedClusters,teardownComplete:true}))
}
