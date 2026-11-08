import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { nativeProductRuntime,NativeRuntimeState } from './native-loader'
import type { startNativeHttp } from './native-http'
import type { nativeBinding } from './native-fixture'
import type { nativeSql } from './native-schema'
import { TRIP_GRAPH_SELECT_KANONISCH } from '@/lib/trips/foundation-e-select'
import { nativeTrip } from './native-http'
import { nativeFetchBoundaryProof } from './native-fetch-boundaries'
import type { NativeSuiteOwnership } from './native-suite'
type Runtime=ReturnType<typeof nativeProductRuntime>
type Protocol=Awaited<ReturnType<typeof startNativeHttp>>
type Witness=Awaited<ReturnType<typeof nativeBinding>>

export async function nativeBoundaryProof(t:TestContext,runtime:Runtime,state:NativeRuntimeState,http:Protocol,witness:Witness,sql:ReturnType<typeof nativeSql>,owner?:NativeSuiteOwnership) {
  owner?.check()
  const controller=()=>owner?owner.controller():new AbortController()
  const fresh=()=>{owner?.check();return owner?.signal??new AbortController().signal}
  const run=<T>(operation:()=>Promise<T>)=>owner?owner.run(operation):operation()
  const turn=()=>{owner?.check();const pending=new Promise<void>(resolve=>setImmediate(resolve));return owner?owner.track(pending):pending}
  const base=witness.binding,cookiesBefore=state.authCookieReads,requestsBefore=http.requests.length
  for(const targetUrl of ['file:///tmp/forbidden','http://other.example:80','https://other.example/path','https://user:synthetic@other.example','https://other.example/?x=1','https://other.example/']) {
    owner?.check();state.binding={...base,targetUrl}
    assert.equal((await run(()=>runtime.producer.publishAcceptedStore(fresh()))).status,'unavailable')
  }
  state.binding=base
  const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://other.example'
  try{assert.equal((await run(()=>runtime.producer.publishAcceptedStore(fresh()))).status,'unavailable')}
  finally{process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl}
  // Isolate the captured-RSC-target check: both other target inputs agree with
  // each other, while the already-loaded factory still holds its first URL.
  const alternate=new URL(http.url);alternate.port=alternate.port==='65534'?'65533':'65534'
  state.binding={...base,targetUrl:alternate.origin};process.env.NEXT_PUBLIC_SUPABASE_URL=alternate.origin
  try{assert.equal((await run(()=>runtime.producer.publishAcceptedStore(fresh()))).status,'unavailable')}
  finally{state.binding=base;process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl}
  assert.equal(state.authCookieReads,cookiesBefore);assert.equal(http.requests.length,requestsBefore)
  assert.equal(state.sourceStarts,0)

  const pre=controller();pre.abort()
  const preLife=new runtime.lifetime.AcceptedStoreLifetime(pre.signal,500)
  await assert.rejects(run(()=>runtime.factory.createServerComponentClient(preLife.signal)));await run(()=>preLife.settle())
  assert.equal(state.authCookieReads,cookiesBefore);assert.equal(http.requests.length,requestsBefore)

  // Actual SSR0.6.1 + supabase2.57.2/auth2.71.1 constructor/listener refresh.
  // No fake HTTP error stops retries: native pending refresh is really aborted,
  // and the pinned SDK's already-started retry bookkeeping is fully drained.
  for(const mode of ['constructor_only','concurrent_get_user','query_abort_then_owner'] as const) {
    owner?.check()
    const parent=controller(),life=new runtime.lifetime.AcceptedStoreLifetime(parent.signal,1_000)
    const refreshBefore=http.counts().refreshRequests,started=performance.now(),originalFetch=globalThis.fetch
    let nativeFetchStarts=0,nativeStartsAfterAbort=0,positive=false,userCalls=0,queryCalls=0
    const queryOwner=controller()
    let observedStart!:()=>void
    const reachedOrClosed=new Promise<void>(resolve=>{observedStart=resolve;life.signal.addEventListener('abort',resolve as ()=>void,{once:true});if(life.signal.aborted)resolve()})
    owner?.track(reachedOrClosed)
    const removeReachedStop=owner?.onStop(()=>observedStart())
    // Transparent observation of the actual native fetch boundary. No Auth
    // response/error is invented and no request or credential is retained.
    globalThis.fetch=((input,init)=>{nativeFetchStarts++;if(life.signal.aborted)nativeStartsAfterAbort++;return originalFetch(input,init)}) as typeof fetch
    state.cookie=http.cookie(true);http.faults.refresh='pending';http.faults.onRefresh=()=>{observedStart();if(mode!=='query_abort_then_owner')parent.abort()}
    const restoreObserver=owner?.restore(()=>{globalThis.fetch=originalFetch;state.cookie=http.cookie();http.faults.refresh='normal';delete http.faults.onRefresh})
    const operation=life.run(()=>runtime.factory.createServerComponentClient(life.signal)).then(async client=>{
      if(mode==='constructor_only')return
      if(mode==='query_abort_then_owner') {
        life.assertCurrent();queryCalls++
        const result=await life.run(()=>Promise.resolve(client.from('trips').select(TRIP_GRAPH_SELECT_KANONISCH)
          .eq('id',nativeTrip).limit(1).abortSignal(queryOwner.signal)))
        life.assertCurrent();positive=!!result.data?.length;return
      }
      life.assertCurrent();userCalls++;const result=await life.run(()=>client.auth.getUser());life.assertCurrent();positive=!!result.data.user
    }).catch(()=>undefined)
    owner?.track(operation)
    try {
      if(mode==='query_abort_then_owner') {
        await reachedOrClosed;queryOwner.abort();await turn()
        assert.equal(queryCalls,1,'The actual SDK query must start before its separate query signal is aborted')
        assert.equal(life.signal.aborted,false,'A query abort alone does not own the already running Auth refresh')
        const active=(life as unknown as {authWork:Array<{counts:{refresh:number;use:number}}>}).authWork
        assert(active.some(work=>work.counts.refresh>0&&work.counts.use>0))
        assert.equal(nativeFetchStarts,1);parent.abort()
      }
      await operation;await reachedOrClosed
    } catch(error){owner?.stop(error);throw error}
    finally {
      parent.abort();observedStart();removeReachedStop?.()
      try {if(owner)await owner.cleanup(()=>operation,()=>life.settle(),()=>http.settle());else{await operation;await life.settle();await http.settle()}}
      finally {if(restoreObserver)restoreObserver();else{globalThis.fetch=originalFetch;state.cookie=http.cookie();http.faults.refresh='normal';delete http.faults.onRefresh}}
    }
    owner?.check()
    assert.equal(positive,false);assert.equal(http.counts().refreshRequests-refreshBefore,1)
    assert.equal(nativeFetchStarts,1);assert.equal(nativeStartsAfterAbort,0)
    if(mode==='concurrent_get_user')assert.equal(userCalls,1,'The concurrent case must actually start getUser before abort')
    else assert.equal(userCalls,0)
    // Read-only inspection of OUR observation counters, not SDK internals or an
    // SDK patch. Their signals came from the actual public debug callback.
    const observed=(life as unknown as {authWork:Array<{counts:Record<string,number>;registered:number;initialCompleted:number;initializationCompleted:boolean;invalid:boolean}>}).authWork
    assert.equal(observed.length,1)
    for(const work of observed){owner?.check();assert(work.registered>=2);assert.equal(work.initialCompleted,work.registered);assert(work.initializationCompleted)
      assert.equal(work.invalid,false);assert(Object.values(work.counts).every(value=>value===0))}
    const afterDrain=http.requests.length;await turn();assert.equal(http.requests.length,afterDrain)
    t.diagnostic(JSON.stringify({proof:'actual-pinned-SSR-factory-abort',mode,node:process.versions.node,ssr:'0.6.1',supabase:'2.57.2',auth:'2.71.1',
      elapsedMs:Math.round(performance.now()-started),httpRefreshRequests:1,nativeFetchStarts,nativeStartsAfterAbort,positive:false,userCalls,queryCalls,subscribers:observed[0]!.registered,
      initialCompletions:observed[0]!.initialCompleted,observedPending:0,boundary:'No fixed clock-rollback-safe SDK return ceiling; business and new native work remain closed'}))
  }

  // The two actual existing legacy modes retain their cookie/client identity.
  for(const legacySignal of [undefined,pre.signal]) {
    owner?.check()
    const before=state.authCookieReads,client=await run(()=>runtime.factory.createServerComponentClient(legacySignal))
    const user=await run(()=>client.auth.getUser());assert.equal(user.data.user?.id,http.claims.sub);assert(state.authCookieReads>before)
  }
  await run(()=>http.settle())

  await nativeFetchBoundaryProof(t,runtime,http,owner)

  let cancelStarted!:()=>void,releaseCancel!:()=>void
  const cancelled=new Promise<void>(resolve=>{cancelStarted=resolve}),dispose=new Promise<void>(resolve=>{releaseCancel=resolve})
  let cancellationSettled=false,returned=false
  const requestController=controller(),stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode('{'))},
    async cancel(){cancelStarted();await dispose;cancellationSettled=true}})
  const request=new Request(`${http.url}/api/readiness/accepted-store`,{method:'POST',headers:{origin:http.url,'content-type':'application/json'},
    body:stream,signal:requestController.signal,duplex:'half'} as RequestInit&{duplex:'half'})
  owner?.track(cancelled);owner?.track(dispose)
  const removeBodyStop=owner?.onStop(()=>{cancelStarted();releaseCancel()})
  const requestStarts=http.requests.length,bodyPromise=run(()=>runtime.request.acceptedStoreTripRequest(request)).then(value=>{returned=true;return value})
  owner?.track(bodyPromise)
  try {
    requestController.abort();await cancelled
    // A microtask-only checkpoint passed the old broken pipeThrough path.
    // An actual event-loop turn exposes a prematurely returned handler.
    await turn()
    assert.equal(returned,false);assert.equal(cancellationSettled,false)
  } catch(error){owner?.stop(error);throw error}
  finally {releaseCancel();cancelStarted();removeBodyStop?.();if(owner)await owner.cleanup(()=>Promise.allSettled([bodyPromise]));else await bodyPromise}
  assert.equal((await bodyPromise).status,400);assert.equal(cancellationSettled,true);assert.equal(http.requests.length,requestStarts)

  // A key acquired after cancellation/binding closure is still owned and wiped.
  for(const mode of ['abort','binding_closed'] as const) {
    owner?.check()
    let entered!:()=>void,release!:()=>void
    const acquired=new Promise<void>(resolve=>{entered=resolve}),continueKey=new Promise<void>(resolve=>{release=resolve})
    const key=Uint8Array.from({length:32},()=>61),keyOwner=controller()
    let resolverSignal:AbortSignal|undefined
    state.binding={...base,key:{...base.key,resolve:async signal=>{resolverSignal=signal;entered();await continueKey;return key}}}
    owner?.track(acquired);owner?.track(continueKey)
    const removeKeyStop=owner?.onStop(()=>{entered();release()})
    const outcome=run(()=>runtime.producer.publishAcceptedStore(keyOwner.signal))
    try {
      // Observe entry OR an earlier concrete failure. The operation remains
      // owned and is fully awaited in finally; no lost work is raced away.
      await Promise.race([acquired,outcome.then(()=>{throw Error(`producer ended before ${mode} key acquisition`)})])
      if(mode==='abort')keyOwner.abort();else state.binding=null
      release();assert.equal((await outcome).status,'unavailable');assert(key.every(byte=>byte===0))
      if(mode==='abort')assert.equal(resolverSignal?.aborted,true)
    } catch(error){owner?.stop(error);throw error}
    finally {release();entered();removeKeyStop?.();try{if(owner)await owner.cleanup(()=>Promise.allSettled([outcome]));else await outcome}finally{state.binding=base}}
  }
  owner?.check()
  assert.equal(sql('select count(*) from official_accepted_trip_private.versions'),'0')
  assert.equal(sql('select count(*) from official_accepted_trip_private.reservations'),'0')
  t.diagnostic(JSON.stringify({proof:'owned-boundaries',unsafeTargetNoActivity:true,preabortNoActivity:true,legacyFactoryModesPreserved:true,
    requestSourceDisposalAwaited:true,lateKeyAbortWiped:true,lateKeyBindingClosureWiped:true}))
}
